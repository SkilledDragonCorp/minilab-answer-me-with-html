#!/usr/bin/env bun
/**
 * Lab report: keyless, deterministic numbers for the SkilledDragon drop.
 *
 *   bun run report                      # writes reports/golden.json + reports/golden.md
 *   REPORT_SKIP_UPSTREAM=1 bun run report   # skip the network-only upstream npm test
 *
 * What it measures
 *   - golden tests: `bun run test` (bun test) pass / fail counts
 *   - fixtures: every fixtures/*.md draft (golden-compared) plus every non-video
 *     upstream example under node_modules/answer-me-with-html/examples
 *     -> input Markdown bytes vs normalized `am render` HTML bytes
 *   - upstream: `bun run test:upstream` (clones the pinned SHA, npm ci, npm test).
 *     This needs network; the report records status pass | fail | skipped.
 *   - gitleaks: scripts/gitleaks-detect.sh (skips cleanly when not installed)
 *   - keyless: child processes run with *_KEY / *_TOKEN / *_SECRET env stripped
 *
 * Deterministic: byte counts and pass/fail do not depend on time or randomness;
 * only generated_at and durations change between runs.
 */
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join, relative } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { renderDraft } from "../src/am-render.ts";
import { normalizeGoldenHtml } from "../src/normalize-golden.ts";
import { UPSTREAM_NPM_VERSION, UPSTREAM_PINNED_SHA } from "../src/upstream.ts";

const ROOT = join(import.meta.dir, "..");
const FIXTURES = join(ROOT, "fixtures");
const GOLDEN_DIR = join(FIXTURES, "golden");
const REPORTS = join(ROOT, "reports");
const EXAMPLES = join(ROOT, "node_modules", "answer-me-with-html", "examples");

type Status = "pass" | "fail" | "skipped";

type FixtureRow = {
  id: string;
  source: "local" | "upstream-example";
  path: string;
  input_bytes: number;
  html_bytes: number;
  ratio: number;
  golden_match: boolean | null;
};

/** Keyless guard: drop anything that looks like a credential from child env. */
const SECRET_RE = /(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)/i;
const strippedVars: string[] = [];
const childEnv: Record<string, string> = {};
for (const [k, v] of Object.entries(process.env)) {
  if (v === undefined) continue;
  if (SECRET_RE.test(k)) strippedVars.push(k);
  else childEnv[k] = v;
}
childEnv.NO_COLOR = "1";

function run(cmd: string[], extra: Record<string, string> = {}, timeoutMs?: number) {
  const t0 = performance.now();
  const r = spawnSync(cmd[0], cmd.slice(1), {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...childEnv, ...extra },
    maxBuffer: 64 * 1024 * 1024,
    timeout: timeoutMs,
    killSignal: "SIGKILL",
  });
  const timedOut = r.error?.code === "ETIMEDOUT" || (r.signal === "SIGKILL" && timeoutMs !== undefined);
  return {
    status: timedOut ? 124 : (r.status ?? 1),
    timed_out: timedOut,
    output: `${r.stdout ?? ""}${r.stderr ?? ""}`,
    duration_ms: Math.round(performance.now() - t0),
  };
}

function tail(s: string, n = 12): string {
  return s.trim().split("\n").slice(-n).join("\n");
}

function measureDraft(draftPath: string, source: FixtureRow["source"], goldenPath?: string): FixtureRow {
  const id = basename(draftPath).replace(/\.md$/, "");
  const input_bytes = statSync(draftPath).size;
  const amHome = mkdtempSync(join(tmpdir(), "am-report-"));
  const out = join(amHome, `${id}.html`);
  const saved = process.env;
  try {
    // renderDraft spreads process.env; swap in the stripped env for the call.
    process.env = { ...childEnv };
    const { exitCode, stderr } = renderDraft({ draftPath, outPath: out, amHome });
    if (exitCode !== 0) throw new Error(`am render failed for ${id}: ${stderr}`);
    const rendered = normalizeGoldenHtml(readFileSync(out, "utf8"));
    const html_bytes = Buffer.byteLength(rendered, "utf8");
    let golden_match: boolean | null = null;
    if (goldenPath && existsSync(goldenPath)) golden_match = rendered === readFileSync(goldenPath, "utf8");
    return {
      id,
      source,
      path: relative(ROOT, draftPath),
      input_bytes,
      html_bytes,
      ratio: Number((html_bytes / Math.max(1, input_bytes)).toFixed(2)),
      golden_match,
    };
  } finally {
    process.env = saved;
    rmSync(amHome, { recursive: true, force: true });
  }
}

// 1. golden + unit tests (`bun run test` → bun test)
const tests = run(["bun", "run", "test"]);
const passed = Number(tests.output.match(/(\d+)\s+pass/)?.[1] ?? 0);
const failed = Number(tests.output.match(/(\d+)\s+fail/)?.[1] ?? (tests.status === 0 ? 0 : 1));
const golden_tests = {
  command: "bun run test",
  status: (tests.status === 0 && failed === 0 ? "pass" : "fail") as Status,
  passed,
  failed,
  duration_ms: tests.duration_ms,
};

// 2. fixtures: local drafts (golden-compared) + upstream examples (non-video)
const fixtures: FixtureRow[] = [];
const localDrafts = readdirSync(FIXTURES).filter((n) => n.endsWith(".md")).sort();
for (const n of localDrafts) {
  fixtures.push(measureDraft(join(FIXTURES, n), "local", join(GOLDEN_DIR, n.replace(/\.md$/, ".html"))));
}
const exampleDrafts = existsSync(EXAMPLES)
  ? readdirSync(EXAMPLES).filter((n) => n.endsWith(".md") && !n.startsWith("video-")).sort()
  : [];
for (const n of exampleDrafts) fixtures.push(measureDraft(join(EXAMPLES, n), "upstream-example"));
fixtures.sort((a, b) => b.input_bytes - a.input_bytes || a.id.localeCompare(b.id));

// 3. upstream npm test (network: git fetch + npm ci)
let upstream: { command: string; status: Status; requires_network: true; duration_ms: number; note: string; tail?: string };
if (process.env.REPORT_SKIP_UPSTREAM === "1") {
  upstream = {
    command: "bun run test:upstream",
    status: "skipped",
    requires_network: true,
    duration_ms: 0,
    note: "skipped via REPORT_SKIP_UPSTREAM=1; needs network to fetch the pinned SHA and npm ci",
  };
} else {
  const limit = Number(process.env.UPSTREAM_TIMEOUT_MS ?? 600000);
  const r = run(["bun", "run", "test:upstream"], {}, limit);
  upstream = {
    command: "bun run test:upstream",
    status: r.status === 0 ? "pass" : "fail",
    requires_network: true,
    duration_ms: r.duration_ms,
    note:
      r.status === 0
        ? `pinned ${UPSTREAM_PINNED_SHA.slice(0, 7)} (v${UPSTREAM_NPM_VERSION}); npm test with AM_E2E unset`
        : r.timed_out
          ? `killed after ${limit} ms (UPSTREAM_TIMEOUT_MS); upstream export/browser tests launch a local Chrome and can stall on a loaded machine`
          : "does not run offline: needs git fetch of the pinned SHA + npm ci; set REPORT_SKIP_UPSTREAM=1 to skip",
    tail: tail(r.output, 20),
  };
}

// 4. gitleaks (wrapper exits 0 with a message when the binary is missing)
const gl = run(["bash", "scripts/gitleaks-detect.sh"]);
const gitleaksSkipped = /not found; .*Skipping/.test(gl.output);
const gitleaksVersion = run(["gitleaks", "version"]).output.trim().split("\n")[0] || null;
const nodeVersion = run(["node", "-v"]).output.trim().replace(/^v/, "") || process.versions.node;
const gitleaks = {
  command: "bash scripts/gitleaks-detect.sh",
  status: (gitleaksSkipped ? "skipped" : gl.status === 0 ? "pass" : "fail") as Status,
  version: gitleaksSkipped ? null : gitleaksVersion,
  leaks_found: gitleaksSkipped ? null : Number(gl.output.match(/leaks found:\s*(\d+)/i)?.[1] ?? (gl.status === 0 ? 0 : -1)),
  duration_ms: gl.duration_ms,
};

// 5. assemble
const largest = fixtures.slice(0, 3).map(({ id, input_bytes, html_bytes, ratio }) => ({ id, input_bytes, html_bytes, ratio }));
const report = {
  generated_at: new Date().toISOString(),
  lab: "SkilledDragonCorp/minilab-answer-me-with-html",
  upstream_package: { name: "answer-me-with-html", version: UPSTREAM_NPM_VERSION, sha: UPSTREAM_PINNED_SHA },
  versions: { bun: Bun.version, node: nodeVersion, gitleaks: gitleaks.version },
  keyless: { enforced: true, stripped_env_vars: strippedVars.length, api_keys_used: 0 },
  note: "input_bytes = draft Markdown bytes; html_bytes = normalized `am render` HTML bytes (colophon timestamp replaced). Local fixtures are compared byte-for-byte to fixtures/golden/*.html.",
  golden_tests,
  fixture_count: fixtures.length,
  local_fixture_count: localDrafts.length,
  upstream_example_count: exampleDrafts.length,
  goldens_matching: fixtures.filter((f) => f.golden_match === true).length,
  largest,
  fixtures,
  upstream,
  gitleaks,
};

mkdirSync(REPORTS, { recursive: true });
writeFileSync(join(REPORTS, "golden.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

const fmt = (n: number) => n.toLocaleString("en-US");
const md = [
  "# answer-me-with-html golden report",
  "",
  `generated_at: ${report.generated_at}  `,
  `upstream: answer-me-with-html@${UPSTREAM_NPM_VERSION} (${UPSTREAM_PINNED_SHA.slice(0, 7)}) · bun ${Bun.version} · node ${nodeVersion}`,
  "",
  "## Checks",
  "",
  "| Check | Status | Detail |",
  "|---|---|---|",
  `| golden + unit tests | ${golden_tests.status} | ${golden_tests.passed} pass / ${golden_tests.failed} fail (${golden_tests.duration_ms} ms) |`,
  `| upstream npm test | ${upstream.status} | ${upstream.note} (${upstream.duration_ms} ms) |`,
  `| gitleaks | ${gitleaks.status} | ${gitleaks.version ?? "not installed"}${gitleaks.leaks_found !== null ? ` · leaks found: ${gitleaks.leaks_found}` : ""} |`,
  `| keyless | pass | ${strippedVars.length} key-like env vars stripped from child processes; 0 API keys used |`,
  "",
  `## Fixtures (${fixtures.length}: ${localDrafts.length} local golden, ${exampleDrafts.length} upstream examples)`,
  "",
  "| Fixture | Source | Input bytes | HTML bytes | Ratio | Golden |",
  "|---|---|---:|---:|---:|---|",
  ...fixtures.map(
    (f) =>
      `| ${f.id} | ${f.source} | ${fmt(f.input_bytes)} | ${fmt(f.html_bytes)} | ${f.ratio}x | ${f.golden_match === null ? "—" : f.golden_match ? "match" : "MISMATCH"} |`,
  ),
  "",
  `${report.note}`,
  "",
].join("\n");
writeFileSync(join(REPORTS, "golden.md"), md, "utf8");

console.log(`wrote ${join(REPORTS, "golden.json")} and golden.md`);
console.log(
  `tests=${golden_tests.status} (${golden_tests.passed}/${golden_tests.passed + golden_tests.failed}) fixtures=${fixtures.length} upstream=${upstream.status} gitleaks=${gitleaks.status} largest=${largest.map((f) => `${f.id} ${f.input_bytes}→${f.html_bytes}`).join(", ")}`,
);

if (golden_tests.status !== "pass") process.exit(1);
