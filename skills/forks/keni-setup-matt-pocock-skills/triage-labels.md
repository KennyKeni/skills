# Triage Labels

The skills speak in terms of canonical category, state, and control roles. This
file maps those roles to the actual label strings used in this repo's configured
issue tracker.

| Role in mattpocock/skills | Issue label        | Meaning                                  |
| ------------------------- | ------------------ | ---------------------------------------- |
| `bug`                     | `bug`              | Something is broken                      |
| `enhancement`             | `enhancement`      | New feature or improvement               |
| `needs-triage`            | `needs-triage`     | Maintainer needs to evaluate this issue  |
| `needs-info`              | `needs-info`       | Waiting on reporter for more information |
| `tracking`                | `tracking`         | Non-dispatchable umbrella or aggregate    |
| `ready-for-agent`         | `ready-for-agent`  | Fully specified, ready for an AFK agent  |
| `ready-for-human`         | `ready-for-human`  | Requires human implementation            |
| `wontfix`                 | `wontfix`          | Will not be actioned                     |
| `implementation-locked`   | `implementation-locked` | Implementation is owned and in progress |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

`implementation-locked` is an orthogonal control label. It may coexist with
any category or state label and does not replace either one.

Edit the right-hand column to match whatever vocabulary you actually use.
