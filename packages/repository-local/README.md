# repository-local

`repository-local` creates portable, user-owned policy below a repository's
`.local/` directory. It separates deterministic setup from runtime harness
bootstrap and from reusable skills.

## Usage

```sh
pnpm dlx @kennykeni/repository-local setup
pnpm dlx @kennykeni/repository-local setup --cwd /path/to/repository
```

The routed command and its flags are documented by Stricli:

```sh
repository-local --help
repository-local setup --help
repository-local --version
```

## Generated contract

Setup always plans `.local/INDEX.md` and offers three independently
configurable concerns:

```text
.local/
├── INDEX.md
├── github/
│   └── README.md
├── architecture/
│   └── README.md
└── development/
    └── README.md
```

Concern folders may be moved within the repository, but filenames are fixed as
`README.md`. Skipped concerns are not linked from `INDEX.md`. Setup does not
create empty state, report, research, debugging, domain, ADR, or work
directories.

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
2. **Interactive preferences** decide whether to configure each concern, its
   destination folder, issue/specification/ticket/branch/pull-request
   conventions (including explicit specification and executable-ticket
   conventions), label meanings, relationships, merge/publication/readiness
   policy, Wayfinder storage, architecture constraints, and development rules.
   Discovered candidates are shown as editable prompt defaults; accepting one
   is an explicit user choice.
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
