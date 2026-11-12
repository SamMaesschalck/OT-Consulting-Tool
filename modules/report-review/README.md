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
| `js/hero-asset.js` | The house cover's picture and logo card, for the cover drawn on the Report page, synced from `shared/brand/`. |
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
- A pack is someone else's file, so nothing in it is trusted: its text is only ever put in the page as text; a cell's fill is used only when it is six hex digits, and a picture only when it is an embedded PNG, JPEG, GIF or BMP (`data:image/...;base64`). `index.html` carries a Content-Security-Policy that lets the page load only its own scripts and styles, and pictures only from itself or embedded in the pack. Block ids and other ids from a pack are escaped before they go in a selector.
- A comment on a table cell keeps the first cell of its row and the header of its column (`anchor.rowKey`, `anchor.colHead`, both optional), and the next round finds the cell by them. Where the same words are there more than once and nothing says which, the place is a guess, marked "Check the place", never "same".

## Using it

- A comment half written is never lost to a click: a click on another paragraph or item is refused with a nudge, and changing page keeps it (a bar leads back to it). Add, Save or Cancel ends it. Delete has Undo for a few seconds.
- From round 2, Reply on an earlier comment answers the author in its thread. Replies are kept in the review file as an optional top-level `replies: [{ id, to, text, at }]` (`to` is the earlier comment's id); a review with none has no such key. They merge by id, the later `at` winning, and a reply counts as having looked at the comment.
- A checklist No offers a comment saying why: a general comment under the section title "Checklist", quoting the question. Notes (checklist, and the note for the author) are saved as they are typed.
- Suggested wording has a box that grows with its text, a line under it showing the words taken out and put in, and a link back to the original.
- The outline on the Report page marks the section at the top of the reading area as you scroll (`aria-current`), and in a narrow window the Go to section list shows it.
- Unsaved work is anything done: comments, replies, checklist answers, dismissed checks, a verdict or only a note. Opening another pack or a review file over it asks first, in the page.
- Summary says what is left (checklist, checks, earlier comments looked at, replies, sections read), each count going to its page, and where and when the last save went. Print or save as PDF prints a working note of the review: who, which round, the verdict, every comment in document order, what became of each earlier comment with your replies, and the checklist.
- The keyboard: the report is one stop for Tab. In it, Up and Down move between paragraphs, headings, tables and pictures, Page Up and Page Down between sections, Home and End to the ends; Enter or Space comments on one. On a table, Enter goes into its cells (arrow keys between cells, Enter to comment on one, Escape back out) and Space comments on the whole table. Tab from a paragraph goes to the comments beside it. Escape closes an empty comment or reply box, and leaves one with something written in it. The list of sections and the items on Engagement are one stop each, with Up and Down inside; Left and Right move between severities, answers and filters, which say which is pressed. Delete from the keyboard puts the keyboard on Undo, and Ctrl+Z undoes a delete while Undo is on offer. Dialogs take the keyboard, keep Tab inside and give it back. The keys are listed on About and under Keyboard above the report. Tested by `scripts/test-review-keys.html`; not tested with a screen reader.
- Headings and tables in the report are real headings and tables to assistive technology, a table is named "Table, N rows" and not by its words, and a block with comments says so (`aria-describedby`).
- A large report stays quick: the report is drawn once when its page opens, and a comment added, changed or removed draws only the comments beside its paragraph (or its item's card on Engagement), so the text, the pictures, the scroll position and any selection stay as they were. Blocks and cards out of view are not laid out until scrolled to (`content-visibility`). `scripts/test-review-speed.html` fails if a click goes back to drawing the page.
- The Report page has its own find: Ctrl+F there goes to it (the exe has no find bar of its own), Enter and Shift+Enter or Next and Previous move between matches, and Escape clears it.
- A save is never stamped earlier than the last one, so a clock set back cannot make the author's tool keep an older save.
- Opening the Word or Excel report, or a PDF, in place of the pack says so; an incomplete pack or a damaged review file is refused with a message.

## In the suite

- Recent files is told whether a file is a review pack or a review file, so a renamed file is still labelled right.
- After a save, Summary offers "Give it to the <author's tool>", which hands the file just saved to the tool the pack came from; it imports it as Import review files would. Never on its own, on a tour, for the demo, or while there is work the file does not hold.
- A review file opened before its pack waits for it, and Open the pack reopens the pack from Recent files where it can.
