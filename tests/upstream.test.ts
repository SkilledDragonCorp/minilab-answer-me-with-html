import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { UPSTREAM_PINNED_SHA, UPSTREAM_REPO } from "../src/upstream.ts";

const ROOT = join(import.meta.dir, "..");

describe("upstream pin", () => {
  test("SHA matches scripts/upstream-npm-test.sh", () => {
    const script = readFileSync(
      join(ROOT, "scripts/upstream-npm-test.sh"),
      "utf8",
    );
    expect(script).toContain(UPSTREAM_PINNED_SHA);
    expect(script).toContain(UPSTREAM_REPO);
    expect(script).toContain("npm test");
  });

  test("package.json pins upstream git SHA", () => {
    const pkg = JSON.parse(
      readFileSync(join(ROOT, "package.json"), "utf8"),
    ) as { devDependencies?: Record<string, string> };
    expect(pkg.devDependencies?.["answer-me-with-html"]).toContain(
      UPSTREAM_PINNED_SHA,
    );
  });

  test("SHA is 40-char hex", () => {
    expect(UPSTREAM_PINNED_SHA).toMatch(/^[0-9a-f]{40}$/);
  });
});
