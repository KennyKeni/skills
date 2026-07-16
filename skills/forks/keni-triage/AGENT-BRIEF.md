# Writing Agent Briefs

Read `.local/agents/issue-contract.md` before drafting. It is the sole
normative template and readiness definition.

For a reporter-created issue, preserve the reporter's body and render the
canonical leaf contract in a new `## Agent Brief` comment. The latest
maintainer-approved Agent Brief is the authoritative execution contract.

Apply these durability rules while filling the canonical fields:

- Describe observable behavior and caller-facing contracts rather than an
  implementation procedure.
- Name stable interfaces, types, signatures, schemas, and configuration shapes.
- Avoid file paths and line numbers that can become stale.
- Make every acceptance criterion independently verifiable.
- State explicit non-scope so adjacent work does not enter the contract.
- Preserve unresolved decisions as `needs-info`; a partial brief is not
  `ready-for-agent`.

Issue readiness establishes dispatch eligibility only. The active workflow
must separately authorize implementation and external mutations.
