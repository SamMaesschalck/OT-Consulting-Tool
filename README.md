# OT Cyber Assessment Tool

Copyright (c) 2026 SolutionsPT. Proprietary and confidential; licensed use only, see `LICENCE.txt`.

An offline, browser-based tool for OT cyber security assessments (IEC 62443, NCSC CAF, NIS2, NIST, CIS, ONR SyAPs, EU CRA and others), producing the on-screen report, a Word report and an Excel tracker.

## Layout

| Folder | What it is |
|---|---|
| `Assessments/` | The tool itself. Open `Assessments/index.html` in Edge or Chrome; no install, no server. See `Assessments/README.md`. |
| `Risk Assessment/` | The sibling risk assessment app (self-contained; shares only the risk-context interchange file). |
| `Single HTML/` | `build-single-html.ps1` bundles the tool into one HTML file; `check-single-html.html` proves the bundle matches the folder app. |
| `Electron App/` | Wraps the single HTML as a portable Windows exe (`build-portable-exe.ps1`). Heavy build output goes to `%LOCALAPPDATA%\OTCAT-electron`. |
| `tools/` | `run-tests.ps1` (headless test suite) and `release.ps1` (build, check and stage a release). |

Built files (the single HTML and the exe) are never committed. They are attached to each GitHub Release. The licensed standards documents used for reference are kept outside the repository.

## Day to day

- Data: the instrument JSON under `Assessments/data` is mirrored to `.js` by `Assessments/scripts/build-data.ps1`. Run it after any JSON change and commit both.
- Tests: `.\tools\run-tests.ps1` runs every `Assessments/scripts/test-*.html` page in headless Edge (about 40 minutes); pass `-Tests a.html,b.html` for a subset. Results land in `test-results/` (ignored).

## Releasing

1. Bump `VERSION` in `Assessments/js/version.js` and `"version"` in `Electron App/app/package.json`, update the pinned numbers in `Assessments/scripts/test-version.html` and the two READMEs, and commit.
2. Run `.\tools\release.ps1`. It refuses a dirty tree or an existing tag, runs the test suite, builds and checks the single HTML, builds the exe and runs its self-test, stages both with `SHA256SUMS.txt` in `dist\<version>\`, and tags `v<version>`.
3. Push the branch and tag (`git push origin main v<version>`) and create the GitHub Release from that tag with the files in `dist\<version>\` attached.

The version is shown in the tool and recorded in saved project files. It never appears in Word or Excel exports.
