# OT Cyber tools

Copyright (c) 2026 SolutionsPT. Proprietary and confidential; licensed use only, see `LICENCE.txt`.

Offline, browser-based tools for OT cyber security work. Each tool is a module that runs on its own (as a folder, one HTML file or a portable exe), and the modules are planned to come together in one suite. See [docs/platform-architecture.md](docs/platform-architecture.md) for the design.

## Layout

| Path | What it is |
|---|---|
| `modules/assessments/` | OT Cyber Assessment Tool (IEC 62443, NCSC CAF, NIS2, NIST, CIS, ONR SyAPs, EU CRA and more): on-screen report, Word report and Excel tracker. Open `index.html` in Edge or Chrome. See its README. |
| `modules/risk-assessment/` | OT Cyber Risk Assessment Tool (62443-3-2 zones and conduits). Open `index.html`. See its README. |
| `shared/` | The one canonical copy of files both modules use (version, licence, brand files, vendor libraries). `shared/sync.json` lists where each copy goes. |
| `contracts/` | Data contracts between modules, such as `risk-context-interchange.json` (`spt-risk-context`). |
| `packaging/` | `single-html/` builds a module into one HTML file and checks it against the folder app; `electron/` builds a portable exe. `module-info.ps1` reads each module's `module.json`. |
| `tools/` | `run-tests.ps1`, `sync-shared.ps1`, `build.ps1`, `release.ps1`. |
| `docs/` | Design notes. |

Built files are never committed; they are attached to GitHub Releases. The licensed standards documents used for reference are kept outside the repository.

## Day to day

- **Shared files:** edit only the canonical copy in `shared/` or `contracts/`, then run `.\tools\sync-shared.ps1` to copy it into the modules. `-Check` changes nothing and fails if any module copy differs. After a contract `.json` changes, re-run each module's `scripts\build-data.ps1`.
- **Data:** each module's JSON data is mirrored to `.js` by its own `scripts\build-data.ps1`. Run it after any JSON change and commit both.
- **Tests:** `.\tools\run-tests.ps1` runs the assessment tool's headless test pages (about 40 minutes); `-Module risk-assessment` runs the risk tool's; `-Tests a.html,b.html` runs a subset. Results go to `test-results\` (ignored).
- **Builds:** `.\tools\build.ps1 -Module <assessments|risk-assessment|all> -As <html|exe|both> [-SelfTest]`. The HTML goes to `packaging\single-html\` and is checked against the folder app; the exe goes to `%LOCALAPPDATA%\OTCAT-electron\<module>\dist\`.

## Versions and releases

There is one version for every tool, in `shared/version.js`. It is shown in each tool and recorded in saved assessment project files. It never appears in Word or Excel exports.

1. Bump `VERSION` in `shared/version.js`, run `.\tools\sync-shared.ps1`, update the pinned numbers in `modules\assessments\scripts\test-version.html` and `modules\risk-assessment\scripts\test-risk-version.html`, and commit.
2. Run `.\tools\release.ps1`. It refuses a dirty tree, an existing tag or drifted shared files. It runs both modules' tests, builds each module's HTML (with its parity check) and exe (with its self-test), stages everything with `SHA256SUMS.txt` in `dist\v<label>\` and tags `v<x.y.z>`. `-SkipTests` and `-NoTag` are there for trial runs.
3. Push the branch and tag (`git push origin main v<x.y.z>`) and create the GitHub Release from that tag with the files in `dist\v<label>\` attached.

## Branches

`main` always holds tested, releasable code, and releases are tagged from it. Work in progress goes on short-lived feature branches, merged when the tests pass. Modules are folders, not branches.
