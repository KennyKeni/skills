# Papercuts

This folder is an agent-written inbox, not policy. Every other concern under
`.local/` is user-owned and agent-read; papercuts invert that: agents file
entries here and a human triages them. Never cite a papercut as authority for
a decision, and never edit or delete another agent's entry.

## What belongs here

Friction met while following repository instructions or working in this
environment — not defects in the code under change; those go to the tracker.
Examples: a documented command that no longer works, a missing tool or
runtime version, an access scope an agent lacked, an instruction that
contradicts observed repository state, a detour that cost real time.

File an entry when the friction cost more than a trivial workaround or will
predictably hit the next agent. Do not file code bugs, feature ideas, or
low-confidence hunches. In a fleet, file the entry in the member repository
where the friction occurred.

## Filing

Create one file per papercut beside this README, named `YYYYMMDD-<slug>.md`
(UTC date). Never append to a shared log or to an existing entry; parallel
agents must not contend for the same file. Entries stay local — they are
often machine-specific and never belong in the remote tracker.

Each entry uses this structure:

```markdown
# <one-line summary>

- Attempted: what the agent was doing and which instruction it followed.
- Friction: what actually happened, with the exact command or path.
- Workaround: what was done instead, or "none".
- Suggested fix: environment change or policy amendment, if apparent.
```

## Triage

A human triages each entry into exactly one outcome, then deletes the file:

- **Fix the environment** — repair the tool, access, or configuration.
- **Promote to policy** — amend the relevant concern README so the lesson
  outlives the entry.
- **Reject** — nothing is actually wrong; discard.

An entry is a queue item on the way to policy, never a home for it. Nothing
in this folder may be the only record of a decision.
