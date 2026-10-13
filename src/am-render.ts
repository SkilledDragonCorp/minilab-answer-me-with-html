import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "node_modules",
  "answer-me-with-html",
);

export function amBinPath(): string {
  const bin = join(PKG_ROOT, "bin", "am.js");
  if (!existsSync(bin)) {
    throw new Error(
      `answer-me-with-html CLI missing at ${bin}; run bun install`,
    );
  }
  return bin;
}

export type RenderOptions = {
  draftPath: string;
  outPath: string;
  amHome: string;
  extraArgs?: string[];
};

/** Run `am render` with isolated AM_HOME (no auto-open). */
export function renderDraft(opts: RenderOptions): {
  exitCode: number;
  stderr: string;
  stdout: string;
} {
  const args = [
    amBinPath(),
    "render",
    opts.draftPath,
    "-o",
    opts.outPath,
    "--no-open",
    ...(opts.extraArgs ?? []),
  ];
  const result = spawnSync(process.execPath, args, {
    encoding: "utf8",
    env: {
      ...process.env,
      AM_HOME: opts.amHome,
      NO_COLOR: "1",
    },
  });
  return {
    exitCode: result.status ?? 1,
    stderr: result.stderr ?? "",
    stdout: result.stdout ?? "",
  };
}
