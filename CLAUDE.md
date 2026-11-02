# Working on this repository

Read `README.md` for the layout and commands, and `docs/platform-architecture.md` for the design.

## Structure

- Each tool is a self-contained module under `modules/` that must keep running and shipping on its own (folder, one HTML file, portable exe). Never make a module depend on another module's code or on the suite; modules exchange data only through the versioned contracts in `contracts/`.
- The suite shell is `platform/` (SolutionsPT OT Cyber Suite). It talks to a tool only through `js/host-bridge.js` (canonical copy `shared/host-bridge.js`) and postMessage, never by reaching into the tool. A module never requires the bridge: guard every call with `if (window.App.HostBridge)` and keep standalone behaviour unchanged. Inside the suite a tool may sit in a frame of another origin (the folder build) where file dialogs are refused, so saving must still work there (a `SecurityError` from the save dialog falls back to a download).
- The suite's single HTML carries each tool's own single-HTML build unchanged; after a module change, rebuild and check the suite too (`tools/build.ps1 -Module suite -As html`), not only the module.
- Files both modules use have one canonical copy in `shared/` or `contracts/`. Edit only that copy, then run `tools/sync-shared.ps1`; `-Check` must pass before a release.
- One version for everything, in `shared/version.js`. It is shown in the tools and stamped in saved project files, and must NEVER appear in Word or Excel exports (text or document properties); `test-version.html` and `test-risk-version.html` prove it.
- After any change to a module's `data/**/*.json`, run that module's `scripts/build-data.ps1` and commit the regenerated `.js` too.
- `shared/vendor/docx.umd.js` (synced into both modules) is hand-patched (`rStyle`/`rFonts` must lead `w:rPr` or Word refuses the file). Do not replace it with an upstream copy; `shared/vendor/docx.umd.js.upstream-unpatched` is kept for reference.
- `.gitattributes` is `* -text`: files keep their exact bytes and line endings (the tree mixes LF and CRLF). Edit files with an editor or exact string replacement, never by rewriting whole files through PowerShell string handling, which has silently truncated edits before.

## Testing

- Tests are headless-Edge pages under `modules/<m>/scripts/test-*.html`, run with `tools/run-tests.ps1 [-Module <m>] [-Tests a.html,b.html]`. The full assessments suite takes about 40 minutes; pass `-VirtualTimeMs 900000 -TimeoutSec 600` for Word-heavy pages.
- Keep test page names short: a long name pushes the dump path past Windows' 260-character limit and the page reports "0 pass 0 fail incomplete".
- Headless gotchas: `confirm()` blocks (stub it), downloads hang (stub them), IndexedDB never settles, animation frames can be held back indefinitely.
- Exe builds: clear `ELECTRON_RUN_AS_NODE` first (VS Code terminals set it and the exe then runs as Node).

## Writing in the tools and their reports

- UK English.
- No em dashes or en dashes in anything a client reads (a spaced hyphen is fine). No capitals for emphasis, no AI-sounding filler, no "the tool" or other internal wording in Word or Excel deliverables.
- Never change verbatim standards text in the instrument data.
- Consultant prompts in the Word export print red; the report-page Issue check must list exactly what would print red (`test-issue-parity.html`).

## Releases and safety

- Do not rebuild or publish releases unless asked. `tools/release.ps1` builds, checks and tags; publishing is `git push origin main <tag>` plus `gh release create`.
- Every version needs `docs/releases/v<x.y.z>.md` before release (`release.ps1` refuses without it); it is the GitHub release notes and the suite's What's new. After editing it, run `platform/scripts/build-data.ps1` and commit `platform/data/suite-data.js`.
- Built files, `dist/`, `test-results/` and the licensed reference documents are never committed.
- Never take screenshots of the desktop to check the UI; use headless rendering or the exe self-tests.
