# Working on this repository

Read `README.md` for the layout and commands, and `docs/platform-architecture.md` for the design.

## Structure

- Each tool is a self-contained module under `modules/` that must keep running and shipping on its own (folder, one HTML file, portable exe). Never make a module depend on another module's code or on the suite; modules exchange data only through the versioned contracts in `contracts/`.
- The suite shell is `platform/` (SolutionsPT OT Cyber Suite). It talks to a tool only through `js/host-bridge.js` (canonical copy `shared/host-bridge.js`) and postMessage, never by reaching into the tool. A module never requires the bridge: guard every call with `if (window.App.HostBridge)` and keep standalone behaviour unchanged. Inside the suite a tool may sit in a frame of another origin (the folder build) where file dialogs are refused, so saving must still work there (a `SecurityError` from the save dialog falls back to a download).
- The suite's single HTML carries each tool's own single-HTML build unchanged; after a module change, rebuild and check the suite too (`tools/build.ps1 -Module suite -As html`), not only the module.
- Files several modules use have one canonical copy in `shared/` or `contracts/`. Edit only that copy, then run `tools/sync-shared.ps1`; `-Check` must pass before a release.
- One version for everything, in `shared/version.js`. It is shown in the tools and stamped in saved project files, and must NEVER appear in Word or Excel exports (text or document properties); in the assessment tool `test-version.html` (the tool and project files) and `test-review-leak.html` (the Word and Excel files, unzipped), and `test-risk-version.html` and the document tool's `test-doc-version.html`, prove it.
- After any change to a module's `data/**/*.json`, run that module's `scripts/build-data.ps1` and commit the regenerated `.js` too.
- `shared/vendor/docx.umd.js` (synced into the assessment, risk and document tools) is hand-patched (`rStyle`/`rFonts` must lead `w:rPr` or Word refuses the file). Do not replace it with an upstream copy; `shared/vendor/docx.umd.js.upstream-unpatched` is kept for reference.
- `.gitattributes` is `* -text`: files keep their exact bytes and line endings (the tree mixes LF and CRLF). Edit files with an editor or exact string replacement, never by rewriting whole files through PowerShell string handling, which has silently truncated edits before.

## Testing

- Tests are headless-Edge pages under `modules/<m>/scripts/test-*.html`, run with `tools/run-tests.ps1 [-Module <m>] [-Tests a.html,b.html] [-Parallel <n>]` (the suite shell's pages with `-Root platform`). Pass `-VirtualTimeMs 900000 -TimeoutSec 600` for Word-heavy pages. `-Parallel 6` runs six pages at once; pages that need a quiet CPU (hit-testing, scrolling, timing) are listed in the module's `module.json` as `tests.alone` and run on their own.
- A page is complete only when its own summary line (`ALL TESTS PASSED`, `<n> FAILED`, `<n> passed, <m> failed`) is in what it printed, outside its script text, and it printed at least one PASS or FAIL line. Every assertion must be able to fail: no `ok(true, ...)` or `|| true`.
- Keep test page names short: a long name pushes the dump path past Windows' 260-character limit and the page reports "0 pass 0 fail incomplete".
- Headless gotchas: `confirm()` blocks (stub it), downloads hang (stub them), IndexedDB never settles, animation frames can be held back indefinitely.
- Exe builds: clear `ELECTRON_RUN_AS_NODE` first (VS Code terminals set it and the exe then runs as Node).

## Writing in the tools and their reports

- UK English.
- No em dashes or en dashes in anything a client reads (a spaced hyphen is fine). No capitals for emphasis, no AI-sounding filler, no "the tool" or other internal wording in Word or Excel deliverables.
- Never change verbatim standards text in the instrument data.
- Consultant prompts in the Word export print red; the report-page Issue check must list exactly what would print red (`test-issue-parity.html`).

## Report review

- A review (`docs/report-review.md`) never reaches Word or Excel: its store is on the assessment, not on the engagement projection the exporters are given. Keep it off that projection. `test-review-leak.html` unzips the exports to prove it.
- A review only warns. Nothing about it may stop Final, so a lone contractor is never stuck.
- A pack's blocks are read from the generated Word file (`shared/docx-blocks.js`), not the builders. After a change to how the Word report prints, run `test-review-blocks.html`, and `modules/report-review/scripts/build-demo-pack.ps1` if the demo pack should follow.
- A new automatic check needs a real positive, a clean negative and a read of what it flags across all 20 demos (`test-review-checks.html`). A false alarm costs trust: leave out what cannot be read reliably.

## Document tool

- `modules/documents` (design: `docs/document-tool-design.md`) writes general documents in the report template and rebuilds an imported Word file in it. It stands beside the other tools: no file passes between it and them, and the suite routes only its project file (`spt-document`), never a `.docx`.
- Its template is `shared/house-docx.js`, copied from the assessment exporter, which is not changed and does not use it. After a change to the template code in either file, run `modules/assessments/scripts/test-house-parity.html`.
- Its page has no `connect-src`: read bytes with `Blob.arrayBuffer()`, `FileReader` or `atob`, never `fetch`. Build DOM nodes from file and pasted content, never HTML.
- The headless tests cannot prove Word opens a file. `tools/word-open-check.ps1` is the release gate for this tool; it starts its own invisible Word and never touches one already running.

## Releases and safety

- Do not rebuild or publish releases unless asked. `tools/release.ps1` builds, checks and tags; publishing is `git push origin main <tag>` plus `gh release create`.
- Every version needs `docs/releases/v<x.y.z>.md` before release (`release.ps1` refuses without it); it is the GitHub release notes and the suite's What's new. After editing it, run `platform/scripts/build-data.ps1` and commit `platform/data/suite-data.js`. The suite shows the newest `v<x.y.z>.md` whatever the version in `shared/version.js`, so notes for a version not yet bumped are drafted under another name (for example `docs/releases/v0.8.0-draft.md`) and renamed in the commit that bumps the version.
- Built files, `dist/`, `test-results/` and the licensed reference documents are never committed.
- Never take screenshots of the desktop to check the UI; use headless rendering or the exe self-tests.
