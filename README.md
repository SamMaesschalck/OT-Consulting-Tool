# OT Cyber tools

Copyright (c) 2026 SolutionsPT. Proprietary and confidential; licensed use only, see `LICENCE.txt`.

Offline, browser-based tools for OT cyber security work. Each tool is a module that runs on its own (as a folder, one HTML file or a portable exe), and the SolutionsPT OT Cyber Suite brings them together: a home page from which each tool opens inside the suite. See [docs/platform-architecture.md](docs/platform-architecture.md) for the design.

## Layout

| Path | What it is |
|---|---|
| `modules/assessments/` | OT Cyber Assessment Tool (IEC 62443, NCSC CAF, NIS2, NIST, CIS, ONR SyAPs, EU CRA and more): on-screen report, Word report and Excel tracker. Open `index.html` in Edge or Chrome. See its README. |
| `modules/risk-assessment/` | OT Cyber Risk Assessment Tool (62443-3-2 zones and conduits). Open `index.html`. See its README. |
| `modules/report-review/` | OT Cyber Report Review Tool: review a report and the engagement behind it from a pack the author sends, and save a review file for them to import. Open `index.html`. See its README and [docs/report-review.md](docs/report-review.md). |
| `modules/documents/` | OT Cyber Document Tool: write proposals, method statements and other documents in the SolutionsPT report template, or bring in a Word file and have it rebuilt in the template with its pictures and diagrams kept. Open `index.html`. See its README, [docs/document-tool.md](docs/document-tool.md) and the design, [docs/document-tool-design.md](docs/document-tool-design.md). |
| `platform/` | The SolutionsPT OT Cyber Suite shell. Open `platform/index.html` to run the suite from the folders (the developer build: each tool is framed from `modules/`, and Save downloads there). `suite.json` lists the tools; `scripts/build-data.ps1` regenerates `data/suite-data.js`. |
| `shared/` | The one canonical copy of files several modules use (version, licence, brand files, the design system, vendor libraries, the host bridge, the review rules, the report section overrides, and the document tool's Word template, Word import and zip code). `shared/sync.json` lists where each copy goes. |
| `contracts/` | Data contracts between modules: `risk-context-interchange.json` (`spt-risk-context`), `review-pack.json` (`spt-review-pack`) and `review-file.json` (`spt-review`). Also the document tool's own project file, `document.json` (`spt-document`), which no other module reads. |
| `packaging/` | `single-html/` builds a module (or the suite) into one HTML file and checks it; `electron/` builds a portable exe. `module-info.ps1` reads each module's `module.json`, or `platform/suite.json` for the suite. |
| `tools/` | `run-tests.ps1`, `sync-shared.ps1`, `build.ps1`, `release.ps1`, and `word-open-check.ps1`, which opens the document tool's exports in Microsoft Word. |
| `docs/` | Design notes, and `releases/`: one release notes file per version. |

Built files are never committed; they are attached to GitHub Releases. The licensed standards documents used for reference are kept outside the repository.

## Day to day

- **Shared files:** edit only the canonical copy in `shared/` or `contracts/`, then run `.\tools\sync-shared.ps1` to copy it into the modules. `-Check` changes nothing and fails if any module copy differs. After a contract `.json` changes, re-run each module's `scripts\build-data.ps1`.
- **Data:** each module's JSON data is mirrored to `.js` by its own `scripts\build-data.ps1`. Run it after any JSON change and commit both.
- **Tests:** `.\tools\run-tests.ps1` runs the assessment tool's headless test pages (about 40 minutes); `-Module risk-assessment`, `-Module report-review` and `-Module documents` run those tools'; `-Root platform` runs the suite shell's; `-Tests a.html,b.html` runs a subset. Results go to `test-results\` (ignored).
- **Builds:** `.\tools\build.ps1 -Module <assessments|risk-assessment|report-review|documents|suite|all> -As <html|exe|both> [-SelfTest]`. The HTML goes to `packaging\single-html\` and is checked against the folder app; the exe goes to `%LOCALAPPDATA%\OTCAT-electron\<module>\dist\`. `-Module suite` builds `SolutionsPT OT Cyber Suite v<label>.html` (each tool's own single HTML is built first and carried inside it) and its exe, checked by `check-single-html-suite.html` and `selftest-suite.js`; `all` builds every module, then the suite.
- **Suite home page data:** after changing `platform/suite.json`, a module's product name, the licence or the release notes, run `.\platform\scripts\build-data.ps1` and commit `platform\data\suite-data.js` (`-Check` changes nothing and fails if it is out of date).

## Versions and releases

There is one version for every tool, in `shared/version.js`. It is shown in each tool and recorded in saved assessment project files. It never appears in Word or Excel exports.

1. Bump `VERSION` in `shared/version.js`, run `.\tools\sync-shared.ps1`, update the pinned numbers in `modules\assessments\scripts\test-version.html` and `modules\risk-assessment\scripts\test-risk-version.html`, write `docs\releases\v<x.y.z>.md` (see `docs\releases\README.md`), run `.\platform\scripts\build-data.ps1`, and commit.
2. Run `.\tools\release.ps1`. It refuses a dirty tree, an existing tag, drifted shared files, stale suite home page data or missing release notes. It runs every module's tests, builds each module's HTML (with its parity check) and exe (with its self-test), then the suite's, stages the ten files (an HTML and an exe for each of the four tools and for the suite) with `SHA256SUMS.txt` in `dist\v<label>\` and tags `v<x.y.z>`. `-SkipTests` and `-NoTag` are there for trial runs.
3. Push the branch and tag (`git push origin main v<x.y.z>`) and create the GitHub Release from that tag with the files in `dist\v<label>\` attached and `docs\releases\v<x.y.z>.md` as the notes (`release.ps1` prints the `gh release create ... --notes-file` command).

## Branches

`main` always holds tested, releasable code, and releases are tagged from it. Work in progress goes on short-lived feature branches, merged when the tests pass. Modules are folders, not branches.
