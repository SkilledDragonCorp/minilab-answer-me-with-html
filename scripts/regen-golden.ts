#!/usr/bin/env bun
/** Regenerate fixtures/golden/tcp-handshake.html from fixtures/tcp-handshake.md */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { renderDraft } from "../src/am-render.ts";
import { normalizeGoldenHtml } from "../src/normalize-golden.ts";

const ROOT = join(import.meta.dir, "..");
const draft = join(ROOT, "fixtures", "tcp-handshake.md");
const goldenDir = join(ROOT, "fixtures", "golden");
const out = join(goldenDir, "tcp-handshake.html");
const amHome = mkdtempSync(join(tmpdir(), "am-minilab-golden-"));

mkdirSync(goldenDir, { recursive: true });

const { exitCode, stderr, stdout } = renderDraft({
  draftPath: draft,
  outPath: out,
  amHome,
});

if (exitCode !== 0) {
  console.error(stderr || stdout);
  process.exit(exitCode);
}

const raw = readFileSync(out, "utf8");
writeFileSync(out, normalizeGoldenHtml(raw), "utf8");

writeFileSync(
  join(goldenDir, "README.txt"),
  "Golden HTML from answer-me-with-html@0.5.2 am render. Regenerate: bun run golden:regen\n",
  "utf8",
);

console.log(`Wrote ${out}`);
