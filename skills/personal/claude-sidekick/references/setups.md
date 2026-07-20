# Sidekick Setup Registry

Default: [Luna via Codex CLI](codex-luna.md)

| Request | Harness | Sidekick model | Adapter |
| --- | --- | --- | --- |
| Luna through the Codex CLI | codex-exec | `gpt-5.6-luna` | [codex-luna.md](codex-luna.md) |
| Grok 4.5 through OpenCode | opencode | `xai/grok-4.5` | [opencode-grok.md](opencode-grok.md) |
| Qwen3.8 Max Preview through OpenCode | opencode | `alibaba-token-plan/qwen3.8-max-preview` | [opencode-qwen.md](opencode-qwen.md) |
| Grok 4.5 through Cursor | cursor | `cursor-grok-4.5-high` | [cursor-grok.md](cursor-grok.md) |

Read exactly one adapter before starting the pair. Use an explicitly requested
setup; otherwise use the declared default. Report an unknown or unavailable
requested setup rather than substituting another model or harness.
