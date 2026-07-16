---
name: keni-request-refactor-plan
description: Create a detailed refactor plan with tiny commits via user interview, then file it in the configured GitHub/GitLab issue tracker using `.local/agents/` tracker and label config. Use when user wants to plan a refactor, create a refactoring RFC, or break a refactor into safe incremental steps.
---

This skill will be invoked when the user wants to create a refactor request. You should go through the steps below. You may skip steps if you don't consider them necessary.

Before filing, read `.local/agents/issue-tracker.md`,
`.local/agents/triage-labels.md`, and `.local/agents/issue-contract.md`, then
follow the tracker file's command conventions for every operation. Run
`/keni-setup-matt-pocock-skills` if the local setup is missing. Do not create local
issue files as a fallback.

1. Ask the user for a long, detailed description of the problem they want to solve and any potential ideas for solutions.

2. Explore the repo to verify their assertions and understand the current state of the codebase.

3. Ask whether they have considered other options, and present other options to them.

4. Interview the user about the implementation. Be extremely detailed and thorough.

5. Hammer out the exact scope of the implementation. Work out what you plan to change and what you plan not to change.

6. Look in the codebase to check for test coverage of this area of the codebase. If there is insufficient test coverage, ask the user what their plans for testing are.

7. Break the implementation into a plan of tiny commits. Remember Martin Fowler's advice to "make each refactoring step as small as possible, so that you can always see the program working."

8. Create a non-dispatchable tracking umbrella in the configured issue tracker.
Render the canonical umbrella template from `.local/agents/issue-contract.md`,
then append the refactor-plan sections below as supplemental detail. Apply the
configured `enhancement` and `tracking` labels and read back the issue. This
publishes the approved intent and decisions, not executable work.

9. Invoke `keni-to-issues` on the published umbrella to produce the executable
tracer-bullet leaves and verified relationships. Do not implement the refactor
as part of this workflow.

Use these supplemental sections after the canonical umbrella core:

<refactor-plan-template>

## Commits

A LONG, detailed implementation plan. Write the plan in plain English, breaking down the implementation into the tiniest commits possible. Each commit should leave the codebase in a working state.

## Decision Document

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Further Notes (optional)

Any further notes about the refactor.

</refactor-plan-template>
