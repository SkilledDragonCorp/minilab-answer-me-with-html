# answer-me-with-html golden report

generated_at: 2026-10-13T15:16:19.114Z  
upstream: answer-me-with-html@0.5.2 (4da5ae8) · bun 1.4.2 · node 24.14.1

## Checks

| Check | Status | Detail |
|---|---|---|
| golden + unit tests | pass | 4 pass / 0 fail (219 ms) |
| upstream npm test | pass | pinned 4da5ae8 (v0.5.2); npm test with AM_E2E unset (181007 ms) |
| gitleaks | pass | 8.30.1 · leaks found: 0 |
| keyless | pass | 2 key-like env vars stripped from child processes; 0 API keys used |

## Fixtures (5: 1 local golden, 4 upstream examples)

| Fixture | Source | Input bytes | HTML bytes | Ratio | Golden |
|---|---|---:|---:|---:|---|
| ste100 | upstream-example | 4,971 | 117,978 | 23.73x | — |
| tcp | upstream-example | 1,869 | 109,642 | 58.66x | — |
| architecture | upstream-example | 1,445 | 106,471 | 73.68x | — |
| tcp.en | upstream-example | 1,314 | 105,724 | 80.46x | — |
| tcp-handshake | local | 897 | 101,248 | 112.87x | match |

input_bytes = draft Markdown bytes; html_bytes = normalized `am render` HTML bytes (colophon timestamp replaced). Local fixtures are compared byte-for-byte to fixtures/golden/*.html.
