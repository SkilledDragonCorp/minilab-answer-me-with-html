import { describe, expect, test } from "bun:test";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { renderDraft } from "../src/am-render.ts";

const ROOT = join(import.meta.dir, "..");
const draft = join(ROOT, "fixtures", "tcp-handshake.md");
const golden = join(ROOT, "fixtures", "golden", "tcp-handshake.html");

describe("am render golden", () => {
  test("fixture Markdown renders HTML matching golden", () => {
    const amHome = mkdtempSync(join(tmpdir(), "am-minilab-test-"));
    const out = join(amHome, "out.html");
    try {
      const { exitCode, stderr } = renderDraft({
        draftPath: draft,
        outPath: out,
        amHome,
      });
      expect(exitCode).toBe(0);
      if (exitCode !== 0) {
        console.error(stderr);
      }
      const rendered = readFileSync(out, "utf8");
      const expected = readFileSync(golden, "utf8");
      expect(rendered).toBe(expected);
      expect(rendered).toContain("TCP three-way handshake");
      expect(rendered).toContain("SYN");
    } finally {
      rmSync(amHome, { recursive: true, force: true });
    }
  });
});
