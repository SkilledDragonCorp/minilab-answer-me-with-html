#!/usr/bin/env bun
/** Regenerate fixtures/golden/tcp-handshake.html from fixtures/tcp-handshake.md */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { renderDraft } from "../src/am-render.ts";

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

writeFileSync(
  join(goldenDir, "README.txt"),
  "Golden HTML from answer-me-with-html@0.5.2 am render. Regenerate: bun run golden:regen\n",
  "utf8",
);

console.log(`Wrote ${out}`);
