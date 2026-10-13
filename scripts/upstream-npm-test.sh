#!/usr/bin/env bash
# Clone pinned answer-me-with-html and run keyless npm test (AM_E2E off).
set -euo pipefail

UPSTREAM_REPO="https://github.com/QingYunA/answer-me-with-html.git"
# Pin: git ls-remote … refs/tags/v0.5.2^{}
UPSTREAM_SHA="4da5ae89ac435683110aa1b8707d9d4170184c55"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK="${UPSTREAM_WORKDIR:-$(mktemp -d -t amwih-upstream-XXXXXX)}"
CLEANUP="${UPSTREAM_KEEP:-0}"

cleanup() {
  if [[ "$CLEANUP" != "1" ]]; then
    rm -rf "$WORK"
  else
    echo "UPSTREAM_KEEP=1 — left clone at: $WORK"
  fi
}
trap cleanup EXIT

echo "==> Cloning answer-me-with-html @ ${UPSTREAM_SHA}"
git init "$WORK"
git -C "$WORK" remote add origin "$UPSTREAM_REPO"
git -C "$WORK" fetch --depth 1 origin "$UPSTREAM_SHA"
git -C "$WORK" checkout FETCH_HEAD

echo "==> Node $(node -v) (lab engines >=24; upstream >=20)"
cd "$WORK"

echo "==> npm ci (package-lock.json)"
npm ci

echo "==> npm test (AM_E2E unset — browser/TTS tests skip)"
unset AM_E2E
npm test

echo "==> PASS: upstream keyless npm test exited 0"
