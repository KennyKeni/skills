---
name: keni-setup-matt-pocock-skills
description: Sets up committed agent pointers plus gitignored `.local/agents/` files so engineering skills share this repo's issue tracker, canonical issue contract, triage labels, and local-only domain docs. Run before first use of `keni-to-issues`, `keni-to-prd`, `keni-triage`, `keni-diagnose`, `keni-tdd`, `keni-improve-codebase-architecture`, or `keni-zoom-out`, or when their local setup is missing.
disable-model-invocation: true
---

# Setup Matt Pocock's Skills

Scaffold the per-repo configuration that the engineering skills assume:

- **Issue tracker** — GitHub Issues or GitLab Issues for PRDs, implementation issues, QA reports, refactor plans, and triage state
- **Issue contract** — the canonical tracking-umbrella and executable-leaf format and readiness rules
- **Triage labels** — the strings used for category, state, and control roles
- **Domain docs** — where local-only context docs and ADRs live, and the consumer rules for reading them

This is a prompt-driven skill, not a deterministic script. Explore, present what you found, then write the local setup. Ask only if the repo cannot be identified as a GitHub or GitLab repo, or the user wants non-default label names.

## Process

### 1. Explore

Look at the current repo to understand its starting state. Read whatever exists; don't assume:

- `git remote -v` and `.git/config` — is this a GitHub or GitLab repo? Which one?
- `.gitignore` — is `.local/` already ignored?
- `AGENTS.md` and `CLAUDE.md` at the repo root — do they exist, and is there already an `## Agent skills` section?
- `.local/agents/` — does this skill's output already exist?
- `.local/context/`, `.local/adr/`, and `.local/architecture/` — do local-only domain or architecture docs already exist?
- `gh auth status` / `gh label list` for GitHub, or `glab auth status` / `glab label list` for GitLab, when available — are auth and expected labels present?
- Tracker relationship capabilities — are native hierarchy and dependency relationships available through the configured CLI and plan?

### 2. Present findings and defaults

Summarise what's present and what's missing. Then state the defaults this skill will apply:

- GitHub Issues or GitLab Issues, matching the repo manager, is the canonical issue tracker.
- `AGENTS.md` and, only when the repo already uses it or the user asks, `CLAUDE.md` are the only committed setup pointers this skill edits or creates.
- `.local/` is gitignored and holds local skill configuration and lazily created artifacts.
- `.local/agents/` holds only the four setup files consumed by the skills.
- `.local/context/` holds local-only domain context docs.
- `.local/adr/` holds local-only Architecture Decision Records.
- `.local/architecture/` holds explicitly saved architecture documents.
- `.local/state/` holds execution continuity only when a producing workflow needs local state; explicit handoffs live under `.local/state/handoffs/`.
- `.local/extra/reports/` and `.local/extra/prototypes/` hold disposable output only when the user explicitly asks to save it.

Create each artifact directory lazily. Setup creates only `.local/agents/` and its four files.

Do not offer tracker choices beyond GitHub Issues and GitLab Issues. If there is no GitHub or GitLab remote, ask for the repository or remote to use before doing issue-tracker operations; do not fall back to local issue files.

### 3. Triage label vocabulary

> Explainer: When the `keni-triage` skill processes an incoming issue, it classifies its category and moves it through a state machine — needs evaluation, waiting on reporter, tracking aggregate, ready for an AFK agent, ready for a human, or won't fix. To do that, it needs labels (or the equivalent in your issue tracker) that match strings *you've actually configured*. If your repo already uses different label names (e.g. `bug:triage` instead of `needs-triage`), map them here so the skill applies the right ones instead of creating duplicates.

Two category roles:

- `bug` — something is broken
- `enhancement` — new feature or improvement

Six state roles:

- `needs-triage` — maintainer needs to evaluate
- `needs-info` — waiting on reporter
- `tracking` — non-dispatchable umbrella or aggregate
- `ready-for-agent` — fully specified, AFK-ready (an agent can pick it up with no human context)
- `ready-for-human` — needs human implementation
- `wontfix` — will not be actioned

One control role:

- `implementation-locked` — implementation is owned and in progress; only the
  current owner may continue until the lock is released

The control role is orthogonal to category and state: it may coexist with any
category or state label and does not change readiness. Default each role's
string to its name. If the repo has no existing issue labels, the defaults are
fine. If labels are missing and the user wants them created, use the issue
manager's CLI (`gh label create` for GitHub, `glab label create` for GitLab)
rather than editing local files only.

### 4. Issue contract and relationship capabilities

Use [issue-contract.md](./issue-contract.md) as the sole normative template for
tracking umbrellas, executable leaves, and readiness. Record the configured
tracker's relationship capabilities in `.local/agents/issue-tracker.md`.

Require every tracking umbrella to define its shared goal, scope, and completion
denominator. Require every human-only executable leaf to state why it cannot be
delegated. Do not apply a readiness label until the applicable contract is
complete.

For GitHub, require native parent/sub-issue and blocked-by/blocking
relationships with read-back. If the configured `gh` lacks those capabilities,
report the blocker instead of substituting body references.

For GitLab, record whether the configured plan and tooling support native
parent/child and dependency relationships. Use and verify native relationships
when supported. Otherwise state that the issue contract's `Parent` and
`Dependencies` fields are authoritative. Do not create a competing local graph.

Tracker capability and technical access define mechanism, not authorization.
Issue and relationship mutations still require an authorized workflow.

### 5. Domain docs

> Explainer: Some skills (`keni-improve-codebase-architecture`, `keni-diagnose`, `keni-tdd`, `keni-grill-with-docs`) read local context docs to learn the project's domain language, and local ADRs for past architectural decisions. These files are agent-owned memory and should not be committed.

Use this layout:

- **Single-context** — `.local/context/CONTEXT.md` plus `.local/adr/`.
- **Multi-context** — `.local/context/CONTEXT-MAP.md` points to context files under `.local/context/`.
- **ADRs** — all ADRs live in `.local/adr/`; include the context name in the title or slug when a decision is context-specific.
- **Architecture** — relevant `accepted` documents under `.local/architecture/` are normative; `proposed` documents are advisory and `superseded` documents are historical.

### 6. Confirm and edit

Show the user a draft of:

- The `## Agent skills` block to add to root `AGENTS.md`, and to `CLAUDE.md` only if the repo already uses it or the user asks
- The contents of `.local/agents/issue-tracker.md`, `.local/agents/issue-contract.md`, `.local/agents/triage-labels.md`, and `.local/agents/domain.md`

Let them edit before writing.

### 7. Write

**Edit root `AGENTS.md`:**

Create it if it doesn't exist. If an `## Agent skills` block already exists, update its contents in-place rather than appending a duplicate. Don't overwrite user edits to the surrounding sections. Edit `CLAUDE.md` only if it already contains repo agent instructions or the user asks for Claude-specific setup. Do not edit other agent-instruction files.

The block:

```markdown
## Agent skills

This repo keeps agent-owned support files in `.local/`, which is intentionally gitignored.

### Issue tracker

Issues, PRDs, triage, QA reports, and refactor plans live in the configured issue tracker (GitHub Issues or GitLab Issues). See `.local/agents/issue-tracker.md`.

### Triage labels

Use the repo's configured issue-tracker labels. See `.local/agents/triage-labels.md`.

### Issue contracts

Tracking umbrellas, executable leaves, and readiness use the canonical contract in `.local/agents/issue-contract.md`.

### Domain docs

Local-only domain context, ADRs, and explicitly saved architecture documents live under `.local/context/`, `.local/adr/`, and `.local/architecture/`. See `.local/agents/domain.md`.

### Local artifacts

Producing workflows create `.local/state/` and `.local/extra/` lazily. These contain execution state and disposable output, not project documentation.
```

Also ensure `.gitignore` contains `.local/` as a standalone ignored path.

Then write the four setup files using the seed templates in this skill folder as a starting point:

- [issue-tracker-github.md](./issue-tracker-github.md) or [issue-tracker-gitlab.md](./issue-tracker-gitlab.md) — choose the template matching the repo manager
- [issue-contract.md](./issue-contract.md) — canonical issue kinds, leaf template, readiness, and authorization boundary
- [triage-labels.md](./triage-labels.md) — label mapping
- [domain.md](./domain.md) — domain doc consumer rules + layout

Write them to `.local/agents/issue-tracker.md`, `.local/agents/issue-contract.md`, `.local/agents/triage-labels.md`, and `.local/agents/domain.md`. Fill the tracker template's relationship capability record with observed support rather than leaving placeholders.

### 8. Done

Tell the user the setup is complete and which engineering skills will now read from `.local/agents/*`. Mention they can edit `.local/agents/*.md` directly later; re-running this skill is only necessary if they want to refresh the local setup.
