# Sidekick Setup Registry

Default: [Luna Max](luna-max.md)

| Request | Harness | Sidekick model | Default validator | Adapter |
| --- | --- | --- | --- | --- |
| Luna Max | codex-native | `gpt-5.6-luna` | `gpt-5.6-sol` at medium effort | [luna-max.md](luna-max.md) |
| Grok 4.5 through OpenCode | opencode | `xai/grok-4.5` | `gpt-5.6-sol` at medium effort | [opencode-grok.md](opencode-grok.md) |
| Qwen3.8 Max Preview through OpenCode | opencode | `alibaba-token-plan/qwen3.8-max-preview` | `gpt-5.6-sol` at medium effort | [opencode-qwen.md](opencode-qwen.md) |
| Grok 4.5 through Cursor | cursor | `cursor-grok-4.5-high` | `gpt-5.6-sol` at medium effort | [cursor-grok.md](cursor-grok.md) |

Read exactly one adapter before starting the pair. Use an explicitly requested
setup; otherwise use the declared default. Report an unknown or unavailable
requested setup rather than substituting another model or harness.
