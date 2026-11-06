# OT Cyber Report Review Tool

An offline, browser-based tool for reviewing a report and the engagement behind it. Open `index.html` directly from disk (file://). There is no backend and nothing to build to use it; for handing out, it is also built as one self-contained HTML file and as a portable exe (`tools/build.ps1 -Module report-review`).

A reviewer opens a review pack, written by the assessment or risk tool, comments on the report as the client will read it, and saves a small review file for the author to import. [docs/report-review.md](../../docs/report-review.md) has the workflow for a reviewer and an author, what is stored where, and which checks run.

It is a module like the others: it runs alone, and it depends on no other module. All it knows of the other tools is the two contracts in `contracts/`: it reads `spt-review-pack` and writes `spt-review`. Inside the suite it talks to the shell only through `js/host-bridge.js`.

## Layout

| Path | What it is |
|---|---|
| `index.html`, `js/app.js` | The app: Report, Engagement, Checklist, Automatic checks, Previous round, Summary and verdict, About. |
| `js/checks.js` | The automatic checks, pure functions of a pack. |
| `js/review-core.js` | The rules of a review, synced from `shared/`. |
| `css/spt-theme.css`, `css/review.css` | The shared design system (synced from `shared/`), and this tool's own styles. |
| `data/checklists.json` | The review checklist: common items, per scoring family and per instrument. Draft wording for the team to agree. After editing, run `scripts/build-data.ps1`. |
| `data/review-pack.json`, `data/review-file.json` | Copies of the contracts, synced from `contracts/`. |
| `data/demo-pack.js` | The demo pack the tour opens, generated from a real demo by `scripts/build-demo-pack.ps1`. Re-run it after a change to the Word reports or the pack's shape, and commit the result. |
| `scripts/test-*.html` | Headless test pages: `tools/run-tests.ps1 -Module report-review`. The round trip with the assessment tool, and the checks run over all 20 demos, are in `modules/assessments/scripts/test-review-*.html`. |

## What it keeps in the browser

All under its own keys, so it cannot touch another module's data: the reviewer's name (`spt-review:reviewer:v1`), their list of names to look for (`spt-review:names:v1`), and unsaved work per pack (`spt-review:autosave:v1:<pack id>`). `ot-theme` is shared with the other tools on purpose.
