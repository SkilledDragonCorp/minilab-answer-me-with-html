# minilab-answer-me-with-html

**Built for [SkilledDragon LLC](https://skilleddragon.com)** — Bun wrapper, keyless upstream `npm test`, and Claude skill for [answer-me-with-html](https://github.com/QingYunA/answer-me-with-html) (MIT · v0.5.2).

Featured upstream: [QingYunA/answer-me-with-html](https://github.com/QingYunA/answer-me-with-html) · tag **v0.5.2** (git pin; package may be installed from GitHub when not on npm)

## What we built

| Piece | Purpose |
| --- | --- |
| `.claude/skills/answer-me-with-html/` | Skill installed with pinned `skills@1.7.2` (`--copy`, Claude Code layout) |
| `src/am-render.ts` | Runs bundled `am render` with isolated `AM_HOME` |
| `fixtures/tcp-handshake.md` → `fixtures/golden/tcp-handshake.html` | Golden HTML regression for the CLI |
| `scripts/upstream-npm-test.sh` | Clone pinned commit → `npm ci` → `npm test` (no `AM_E2E`) |
| CI | gitleaks 8.30.1, `bun audit`, skills frontmatter, `bun test`, upstream npm test |

## What we tested (real commands)

Pin at ship time:

```text
$ git ls-remote https://github.com/QingYunA/answer-me-with-html.git refs/tags/v0.5.2^{}
4da5ae89ac435683110aa1b8707d9d4170184c55	refs/tags/v0.5.2^{}
```

Local minilab (keyless):

```bash
bun install
bun run check:skills
bun test
bun audit
```

Upstream Node test gate (clones upstream; keyless):

```bash
bash scripts/upstream-npm-test.sh
# Pass: exit 0 from npm test with AM_E2E unset (browser/TTS e2e tests skip)
```

## Setup

- **Node** `>=24.11.0` (see `.nvmrc` → `24`; upstream allows `>=20`)
- **Bun** `>=1.2.0`

```bash
nvm use   # or fnm/mise
bun install
bun run hooks:install   # optional: gitleaks pre-commit
```

Install the featured skill (same as ship):

```bash
DISABLE_TELEMETRY=1 bun --bun x skills@1.7.2 add QingYunA/answer-me-with-html \
  --skill answer-me-with-html -a claude-code -y --copy
```

Copy `.env.example` → `.env` only for optional local TTS/video experiments. CI does not use keys.

## Tutorial: TCP three-way handshake page

This minilab ships a small Markdown draft in `fixtures/tcp-handshake.md`. It mirrors the upstream TCP explainer idea: a **sequence diagram** for SYN / SYN+ACK / ACK, short prose on *why three messages*, and a flags table.

1. Open `fixtures/tcp-handshake.md` and skim the frontmatter (`template: sheet`, `theme: blueprint`, `style: off` for a stable golden in CI).
2. Render with the bundled CLI (same version as the pin):

   ```bash
   AM_HOME="$(mktemp -d)" node node_modules/answer-me-with-html/bin/am.js render \
     fixtures/tcp-handshake.md -o /tmp/tcp.html --no-open
   open /tmp/tcp.html   # optional on macOS
   ```

3. Compare against the committed golden: `bun test tests/am-golden.test.ts`.
4. Regenerate golden after intentional draft changes: `bun run golden:regen`.

In Claude Code or Cursor, load `.claude/skills/answer-me-with-html/SKILL.md` and ask for a draft in the same format; run `am render` locally to produce a single-file HTML explainer.

## Using these skills in Claude Code and Cursor

- **Claude Code**: skills live at `.claude/skills/answer-me-with-html/SKILL.md`. Open this repo as the project root.
- **Cursor**: use the same `.claude/skills/…` path in your workspace. Do not mirror into `.cursor/skills` or `.agents/skills`.

Run `bun run check:skills` to verify `name` and `description` frontmatter.

## API keys (optional, local only)

| Variable / feature | Required for | Notes |
| --- | --- | --- |
| *(none)* | CI, golden test, upstream `npm test` | Default path is keyless |
| TTS providers | `am video` with `--voice` not `off` | Upstream picks ElevenLabs / local / system when configured |
| Chrome + ffmpeg | `AM_E2E=1` upstream tests, MP4/WebM export | **Leave off in CI** |

See `.env.example`. Never commit filled-in `.env` files.

## Token and “reduction” claims

Upstream README and skill text may cite **author benchmarks** for shorter prompts or fewer tokens versus plain HTML. Those numbers depend on model, draft length, and tooling versions. Treat them as **informal guidance**, not guaranteed savings in your stack. This minilab does not ship fake meters or unverified “REAL” savings badges.

## Scripts reference

| Script | Command |
| --- | --- |
| Unit + golden | `bun test` |
| Upstream | `bun run test:upstream` |
| Skills check | `bun run check:skills` |
| Regenerate golden | `bun run golden:regen` |

## License

MIT — see [LICENSE](LICENSE). Upstream answer-me-with-html is MIT separately.
