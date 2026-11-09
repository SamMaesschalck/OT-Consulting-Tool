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

All under its own keys, so it cannot touch another module's data: the reviewer's name (`spt-review:reviewer:v1`), their list of names to look for (`spt-review:names:v1`), unsaved work per pack (`spt-review:autosave:v1:<pack id>`), the review file names seen for a pack (`spt-review:seen:v1:<pack id>`), and the sections ticked as read (`spt-review:read:v1:<pack id>`, a note to self that never goes in the review file). `ot-theme` is shared with the other tools on purpose.

## How it reads a pack

- A pack may name its item fields its own way (`engagement.fieldLabels`): the Engagement page, the suggestion picker, the No evidence filter and the comments use those names, and a field set to null is left out. Without it, the assessment names are used. Extra read-only rows (`items[].details`) show after the standard ones.
- With more than one report in a pack (the risk tool's detailed and high level reports), every place outside the Report page names the report a comment or check is on, and the Document list counts each one's comments.
- The author's note sent with the pack (`request`) shows in a quiet panel on Report and Summary.
- A key's swatch keeps its colour from the Word file (`runs[].c`, which `shared/docx-blocks.js` writes only on a lone swatch shape).
- An item with detail rows and nothing in its evidence field (a risk pack's target levels) shows no empty evidence row.
- An earlier round's comment is matched to its report by the report's title, then by its place in the pack, so it follows a report that moved (a risk pack sent before any zones held only the high-level report).
- An approval promises the reviewer's name can go in QA review by only when the pack's document control has that field.

## Using it

- A comment half written is never lost to a click: a click on another paragraph or item is refused with a nudge, and changing page keeps it (a bar leads back to it). Add, Save or Cancel ends it. Delete has Undo for a few seconds.
- Summary says what is left (checklist, checks, earlier comments looked at, sections read), each count going to its page, and where and when the last save went. Print or save as PDF prints a working note of the review: who, which round, the verdict, every comment in document order and the checklist.
- Everything works from the keyboard: Enter or Space on the pages, paragraphs and table cells; severities and answers say which is pressed.
- The Report page has its own find: Ctrl+F there goes to it (the exe has no find bar of its own), Enter and Shift+Enter or Next and Previous move between matches, and Escape clears it.
- A save is never stamped earlier than the last one, so a clock set back cannot make the author's tool keep an older save.
- Opening the Word or Excel report, or a PDF, in place of the pack says so; an incomplete pack or a damaged review file is refused with a message.

## In the suite

- Recent files is told whether a file is a review pack or a review file, so a renamed file is still labelled right.
- After a save, Summary offers "Give it to the <author's tool>", which hands the file just saved to the tool the pack came from; it imports it as Import review files would. Never on its own, on a tour, for the demo, or while there is work the file does not hold.
- A review file opened before its pack waits for it, and Open the pack reopens the pack from Recent files where it can.
