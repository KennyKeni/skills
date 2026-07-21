# groundwork

`groundwork` creates portable, user-owned policy below a repository's
`.local/` directory. It separates deterministic setup from runtime harness
bootstrap and from reusable skills.

The approach is loosely based on
[Matt Pocock's skills](https://github.com/mattpocock/skills) and its
once-per-repository setup flow, adapted into a standalone typed CLI with
deterministic discovery and user-owned output.

## Usage

```sh
pnpm dlx @kennykeni/groundwork setup
pnpm dlx @kennykeni/groundwork setup --cwd /path/to/repository
```

The routed command and its flags are documented by Stricli:

```sh
groundwork --help
groundwork setup --help
groundwork --version
```

## Generated contract

Setup always plans `.local/INDEX.md` and offers five independently
configurable concerns:

```text
.local/
├── INDEX.md
├── workflow/
│   ├── README.md
│   └── SURVEY.md        (team profile only; disposable)
├── architecture/
│   ├── README.md
│   ├── SHAPES.md        (modular-hexagonal style only)
│   └── decisions/
│       └── README.md
├── development/
│   └── README.md
├── domain/
│   └── README.md
└── papercuts/
    └── README.md
```

The workflow README is composed from three declarative template fragments
selected by two axes — forge (`github` / `gitlab` / `none`) and tracker
(`forge-issues` / `linear` / `none`) — plus a shared header. Variation lives
entirely in which fragment files are selected; templates contain no
conditionals, and the type model excludes invalid combinations (forge `none`
cannot host forge issues). Every tracker fragment implements the identical
section contract (verb contract, issues, specifications, executable tickets,
labels, relationships, claims, readiness, local work context), enforced by a
template-parity test.

The architecture README is composed the same way from a style axis
(`modular-hexagonal` / `layered` / `framework-idiomatic` / `flat-minimal` /
`serverless`). Each style is a detailed writeup — doctrine, layout and naming
conventions, seam rules, fit and failure modes — on an identical section
contract enforced by a parity test, so agents get concrete naming guidance
(is there a repository interface? what is a handler called?) that matches the
project's actual shape. The modular-hexagonal style additionally ships
`SHAPES.md` with runtime-specific mappings (event consumers, jobs, actors,
workflows) and the incremental migration order. Fleet-scoped architecture
keeps the fixed cross-service doctrine; each member repository chooses its
own internal style.

A third axis, profile (`solo` / `team`), selects default text. The solo
profile ships opinionated agent-first defaults. The team profile can leave
sections unresolved and generates `SURVEY.md`, which directs an agent to fill
each unresolved section from named repository evidence, with a human
confirming before anything becomes policy; the survey deletes itself when
empty.

Papercuts inverts the ownership of every other concern: its README is fixed
protocol prose under which agents file one entry per friction report
(instructions, environment, or access — never code defects) and a human
triages each entry into an environment fix, a policy amendment, or a
rejection, deleting the entry afterwards. It is repository-scoped even in
fleet mode and its entries never leave the machine for the remote tracker.

Concern folders may be moved within the repository, but filenames are fixed.
Skipped concerns are not linked from `INDEX.md`. Setup does not create empty
state, report, research, debugging, or work directories; the transient
`work/<slug>/` convention is documented in the generated policy and created
by agents, never by setup.

## Fleet mode

Run inside a directory that is not a git repository but contains member
repositories, setup offers fleet mode: only the fleet-scoped concerns
(architecture and domain) are on the menu, the fleet `INDEX.md` lists the
member repositories and the cross-repository umbrella home, and setup then
offers to run the normal per-repository flow for each member in sequence.
Each run is an independent transaction with its own lock, staging, and
recovery journal. A repository setup that discovers a parent fleet
`.local/INDEX.md` offers to link it and defaults fleet-scoped concerns to
skip; linking is always an explicit choice.

Generated READMEs are ordinary Markdown assets, not skills. They have no skill
frontmatter, invocation policy, implicit trigger, or separate lifecycle. The
generated copies become user-owned policy and are never automatically updated.

## Inputs and precedence

Setup uses four layers, in this order:

1. **Deterministic discovery** reads the repository root and working directory,
   Git remotes and default-branch evidence, available GitHub metadata and
   labels, GitHub relationship fields, package/workspace/mise files,
   verification scripts, project instructions and standards, architecture
   documents, and existing `.local/` paths. At most 12 candidate guidance or
   architecture documents are read, and each excerpt is capped at 4 KiB.
   Existing files are read-only.
   GitHub label discovery records lookup failure separately from a successful
   lookup that confirms an empty label set.
2. **Interactive preferences** decide the profile, the forge and tracker
   axes, whether to configure each concern and its destination folder, and —
   per section group — whether to accept prepared defaults, review and edit
   each section, or leave sections for the survey. Discovered candidates are
   shown as editable prompt defaults; accepting one is an explicit user
   choice, and nothing is configured automatically.
3. **Typed setup plan** is the normalized boundary between prompting and
   rendering. Planning can be inspected and tested without writing files.
4. **Packaged templates** accept only declared plan values. Rendering fails on
   a missing required value or any unresolved placeholder.

Discovery evidence never becomes policy merely because it was found. Current
Git, GitHub, issue, and code state remains owned by those live sources.

## Filesystem safety

- Configured paths are resolved relative to the discovered repository root.
- Lexical escapes and destinations reached through an external symlink are
  rejected.
- Existing target folders are warned about and skipped as a whole without
  inspection or mutation.
- An existing `.local/INDEX.md` marks an initialized user-owned policy tree, so
  the setup applies no concern changes.
- An exclusive repository-root reservation prevents two instances of this CLI
  from interleaving setup. A well-formed lock owned by a dead process is
  reclaimed; an indeterminate lock is preserved for manual inspection.
- Missing folders are rendered completely in a temporary staging area and
  published with one namespace-atomic directory rename. Each staging directory
  is a sibling of its destination, so custom mount points do not cause `EXDEV`.
  The final pathname is never created and populated file by file.
- A recovery journal is written before publication, and each CLI-owned concern
  carries a matching temporary marker. If index publication fails or the
  process crashes, a later setup can link only those marked concerns into the
  index. Markers and the journal are removed after successful index creation.
  If a recorded destination exists but its marker is missing or mismatched,
  recovery stops and preserves the journal for manual resolution; it never
  silently omits that destination from a new index.
- A destination that appears during setup is preserved and reported as skipped.
- Setup never recursively removes a final destination pathname during rollback,
  because ownership of that name could have changed after a failure.
- An existing `.local/INDEX.md` is preserved. If one appears unexpectedly
  during a locked operation, setup fails and retains recovery evidence rather
  than reporting an index that omits folders it published.

“Atomic” here means other processes observe either the old namespace entry or
the complete renamed directory. It does not mean fsync-backed durability across
power loss: pure Node cannot portably fsync a renamed directory and all of its
parent directory entries as one transaction.

Node does not expose macOS `renamex_np(..., RENAME_EXCL)` or an equivalent
portable exclusive directory rename. The setup reservation eliminates the
empty-directory replacement race between cooperating instances of this CLI,
and setup checks the destination immediately before rename. It does not protect
against an arbitrary external process that ignores the reservation and creates
an empty destination in the final syscall window; macOS `rename()` may replace
that empty directory. Eliminating that narrow adversarial race requires a
native platform binding.

Existing and newly created parent components are checked for symlinks before
filesystem mutation and again immediately before directory publication or the
exclusive hard-link used for `INDEX.md`. Node lacks directory-handle-relative
rename/link APIs, so an adversarial process with write access can still replace
a checked parent in the final syscall window. Setup never follows a parent
symlink observed by those checks and never rolls back through the final path.
If a parent is replaced after sibling staging, safe cleanup may leave the
staging directory in the displaced parent rather than risk deleting through a
pathname whose ownership changed. Recursive staging cleanup requires the
captured parent `dev`/`ino` and physical path plus the staging directory inode
to still match. Failure to prove ownership emits a cleanup warning and
intentionally leaks the temporary directory. Recovery-journal deletion applies
the same repository-root identity check and also authenticates the journal's
exact expected contents.

Setup never changes remote labels, commits generated files, or edits root
`AGENTS.md` or `CLAUDE.md`.

## Runtime bootstrap

See [RUNTIME-BOOTSTRAP.md](./RUNTIME-BOOTSTRAP.md). Each supported agent harness
must separately learn to read `.local/INDEX.md` and only the concerns relevant
to its current task.

## Development

The repository pins Node and pnpm with mise. From the repository root:

```sh
mise install
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm verify
```

`pack:check` creates a tarball with lifecycle scripts disabled, inspects its
required assets, installs it with npm in a temporary project outside the
checkout, and runs it through `npx`. The package `verify` script is a
`prepublishOnly` release gate and includes this smoke test without recursively
invoking `prepack`.

The suite exercises cancellation at the prompt-driver boundary and runs the
packed executable's non-TTY rejection path. A real Clack cancellation test
requires a PTY controller; Node has no portable built-in PTY API, and the
platform `script` utilities have incompatible macOS/Linux interfaces and are
absent on Windows. To keep the filesystem-sensitive suite stable on all three
CI operating systems, PTY-level cancellation remains explicitly out of scope
until the project adopts a maintained cross-platform PTY test dependency.
