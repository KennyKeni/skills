# Workflow survey

This file directs an agent to fill the unresolved sections of
[README.md](README.md) from repository evidence. It is disposable: delete it
once every section below has been confirmed and written into the README.

Rules:

1. Gather the listed evidence with the given commands; do not guess. Cite
   exact issue numbers, commands, or output so the human can verify.
2. If evidence is absent or too thin to generalize (young repository, fewer
   than ~5 samples), say so and propose keeping the shipped default
   unchanged — do not invent a convention.
3. When samples disagree, present the split and the majority; let the human
   choose rather than silently picking one.
4. A human confirms each item independently before it becomes policy; never
   batch-confirm.
5. On confirmation, replace that section's unresolved marker in README.md
   with the agreed text, then remove only that item here; leave the rest for
   a later session.
6. Only edit the section an item names. If evidence contradicts an
   already-written section, note it for the human and leave that section
   untouched.
7. When no items remain, delete this file.

## Unresolved sections

{{surveyItems}}
