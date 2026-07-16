---
name: keni-handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Invoking this skill explicitly authorizes one handoff write. Write a concise handoff document to `.local/state/handoffs/<slug>.md` relative to the repo root, creating the directory if needed. Derive a short kebab-case slug from the handoff scope. If there is no repo root, write the document in the operating system's temporary directory.

Start the document with:

- **Created** — the creation time as an ISO 8601 timestamp with timezone.
- **Warning** — `This handoff is a noncanonical point-in-time aid. Verify it against the canonical state before acting.`
- **Scope** — what the next agent should and should not continue.
- **Exact next action** — one concrete action the next agent can take immediately.
- **Canonical state** — paths or URLs for the issue, ADR, PRD, plan, tracker item, branch, commit, or diff that governs the work. State explicitly when no canonical artifact exists.

Then summarise only the context needed to execute that next action: current status, constraints, unresolved questions, and verification already performed.

Include a "suggested skills" section in the document, which suggests skills that the agent should invoke.

Do not duplicate content already captured in canonical artifacts. Reference them by path or URL instead, and make clear that those references outrank the handoff if they differ.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
