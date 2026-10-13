/** Featured upstream (MIT). */
export const UPSTREAM_REPO =
  "https://github.com/QingYunA/answer-me-with-html.git" as const;

/** Pinned at v0.5.2 — `git ls-remote … refs/tags/v0.5.2^{}`. */
export const UPSTREAM_PINNED_SHA =
  "4da5ae89ac435683110aa1b8707d9d4170184c55" as const;

export const UPSTREAM_NPM_PACKAGE = "answer-me-with-html" as const;
export const UPSTREAM_NPM_VERSION = "0.5.2" as const;

/** Keyless gate: `npm test` with AM_E2E unset (browser/TTS tests skip). */
export const UPSTREAM_TEST_COMMAND = "npm test" as const;

export const UPSTREAM_PASS_CRITERIA =
  "Exit code 0 from node --test test/*.test.js with AM_E2E unset (no Chrome/ffmpeg/TTS e2e)." as const;
