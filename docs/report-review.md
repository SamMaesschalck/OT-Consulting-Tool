# Report review

A team reviews reports and engagements through the tools rather than by marking up Word files, in line with the rule that changes are made in the tool, not in Word. It works fully offline, with no server: the author sends a pack, each reviewer saves their own small review file, and the author imports those files. Comments merge, so reviewers can never overwrite each other.

## For a reviewer

1. Open the pack in the **OT Cyber Report Review Tool** (Load, or drag it onto the page). You will be asked for your name once; the browser remembers it.
2. **Report** shows the Word report as the client will read it. Click any paragraph, heading or table to comment; click a table cell to comment on that cell. Choose a severity (must fix, should fix, suggestion), and tick Suggest wording to propose text, which starts from what is there. Text the report still prints in red is flagged "Prompt left in". The sections on the left count your comments.
3. **Engagement** shows what is behind the report: each item's answer, target, evidence, notes and plan, and the basis of assessment. Filter to findings, or to items with no evidence, and comment on any of them. A suggestion here is for one field of the item.
4. **Checklist** has questions for every report and for this type of report. Answer Yes, No or N/A, with a note if there is anything to say.
5. **Automatic checks** lists what a machine can find. Each line can take you to the place, be made into a comment, or be dismissed.
6. **Previous round** appears from round 2. It shows what was said last time, what the author did and why. Confirm the fixes you have checked, or raise a point again.
7. **Summary and verdict**: choose Approved, Approved with comments, Changes requested or No verdict yet, then **Save my review file**. Send that file to the author by shared folder or email.

To carry on later, load the pack and then your review file (together or one after the other). Save then writes back to the same file. If the browser closes unexpectedly, opening the pack again offers your unsaved work.

## For an author

### In the assessment tool

The **Review** card is on the report page, next to the Issue check. It is not a report section and never reaches Word or Excel.

1. **Send for review** runs the Draft build of exactly the documents an export would write, and saves a pack. Give it to each reviewer.
2. **Import review files** takes several files at once. Importing the same file twice changes nothing, and a reviewer's later save of the same comment wins.
3. Each comment shows the reviewer, severity, what it is on, and any suggested wording, grouped by section. Filter by status, severity and reviewer. **Go to** takes you to the section on the report page, to the item on its capture page, or to the plan dialogue. Reply, **Resolve**, or **Won't change** with a reason, which the reviewer sees next round.
4. **Accept** puts suggested wording in the tool where the text can be changed there, rebuilds the Word document to check it is really in it, and undoes it if not. Otherwise you get **Copy** and Go to, with the reason. Accepting into a section's opening rewrites the whole run of paragraphs that open it, with the one changed, as plain paragraphs: any emphasis in that run goes.
5. A comment that no longer matches the report is marked "No longer matches the current report". It is not lost.
6. When an approval comes in, the card offers to fill in **QA review by** with the reviewer's name. It asks first, and asks again before replacing a different name.
7. When you have made your changes, **Send for review** again. The round goes up when the content has changed or a review has come back; otherwise the pack is the same round, so a reviewer's file stays good. The new pack carries every comment's status and replies.

The Issue check and the export dialog warn when the report is not reviewed, when changes are requested, when must-fix comments are open, and when it has changed since approval. They only warn: Final is never blocked by a review, so a lone contractor with only a standalone tool is not stuck. Filling in the document control fields at issue does not count as a change.

### In the risk tool

**Peer review**, in the sidebar, has the same Send for review and Import review files, with the comments list on its own page. The pack holds both Word reports (detailed and high level) and the zones and threats behind them.

**Accept** works as in the assessment tool for a section's heading and the wording that opens it, in the report the comment is on (its `documentIndex`): the overrides are per report, because same-named sections say different things. The Word document is rebuilt to check the wording is really in it, and the change is undone if not. Other text is Copy and Go to, with the reason. **Go to** takes you to the section on the **Report** page, in that report, or to the zone or threat behind it.

## What is stored where

| What | Where | Holds |
|---|---|---|
| Review pack (`spt-review-pack`) | a file the author saves | the client's report text and images, the engagement behind them, earlier comments. It contains client data: handle it like the project file. |
| Review file (`spt-review`) | a file each reviewer saves | that reviewer's comments with the short quotes they are about, checklist answers, dismissed checks, verdict. The quotes are client text, so handle it the same way. |
| The review, on the author's side | the assessment in the project file (`assessment.review`), or the risk project (`project.review`) | rounds, the files imported, each comment with its status, reason and replies. Absent until a review starts; older files still load. Each assessment has its own. Never exported to Word or Excel: the assessment tool's exporters are given the engagement projection, which it is not on, and the risk tool's never read it. |
| Reviewer's name, list of names to look for | the reviewer's browser (`spt-review:reviewer:v1`, `spt-review:names:v1`) | never put in a review file |
| Unsaved review work | the reviewer's browser (`spt-review:autosave:v1:<pack id>`) | the review only, not the pack; cleared on save |

## Which text accepts a suggestion

In the assessment tool:

| The comment is on | Goes into | Otherwise |
|---|---|---|
| A section's heading | the section's title (`reportCustom[key].title`) | not if the heading is a target's name, or is built from one, as it would apply to every target |
| A paragraph of a narrative field the consultant wrote (exposure, priorities, method) | that line of the field | |
| A line of the proposed next steps | the next steps, made from all the lines as printed if they were still scaffolded | not if they differ between documents |
| A paragraph or table cell that holds an evidence, notes, owner, action or impact field | that field on that item | not if the same wording is on more than one item |
| An item comment that names a field | that field; if the field does not print in Word, the change stands and the message says so | not if the field has changed since the review |
| A paragraph in a section's opening run | `reportCustom[key].prose`, the whole run with the one paragraph changed | not if the section opens differently per zone, as a rewrite would replace all of them |
| Anything else: generated text, results tables, framework text | Copy and Go to | |

In the risk tool, in the overrides of the report the comment is on (`project.reportCustom.detailed` or `.highLevel`):

| The comment is on | Goes into | Otherwise |
|---|---|---|
| A section's heading | the section's title | not a zone's or conduit's own heading, which is a name: rename it where it is entered. Not a heading repeated per zone ("Justification for ..."), as it would change them all: use Edit on the Report page, which keeps each zone's name |
| A paragraph in a section's opening run | `reportCustom.<report>[key].prose`, the whole run with the one paragraph changed | not a section repeated per zone, as a rewrite would replace all of them |
| Anything else: threat registers, tables, the sign-off, text after a table, the zones and threats behind the report | Copy and Go to | |

## The automatic checks

They run on the pack, in `modules/report-review/js/checks.js`. A false alarm costs trust, so each is written to be precise.

| Check | What it finds |
|---|---|
| Red prompts left in | exactly what the Issue check counts |
| Em or en dashes | in the client's text, leaving out a cell holding only a dash, the house mark for empty |
| Internal wording | "the tool", "this tool", "scaffold", "placeholder", "structured prompt", "band arithmetic", "rolled up from", "lorem ipsum", TODO, TBC, TBD, FIXME, as whole words and not in red prompts |
| A demo or other client's name | the demo clients' names, and any the reviewer adds, in the report and the engagement data; never the report's own client, site or consultant |
| Client name missing or inconsistent | not set; not printed in a document; printed with different capitals (all capitals is styling, and not flagged) |
| Findings with no evidence | items whose status is finding, with no evidence recorded |
| Items not answered | one line per item, or one per target above five |
| Blank document control fields | named together in one line |
| Section numbering gaps | numbered level 1 headings that skip a number |
| Figures that disagree | sentences the exporter generates, for a document covering one target: "the N outcomes below their expected state", "open gaps moved from X to N", "there are N open gaps" against the roadmap, and "N of M outcomes were assessed as achieved" against the items met |

Not attempted, because no reliable reading exists: the counts inside results tables and charts; percentages and closeness figures; floor-finding counts; "meeting N of M" per requirement group; maturity profiles; any count in a document covering several targets (the 62443-3-3 report covers every zone in one file); whether a recommendation is any good; whether the tone is right. Those are what the reviewer is for, and the checklist asks.

## Contracts

`contracts/review-pack.json` and `contracts/review-file.json` hold the shape, an example and the schemas importers accept. Importers reject anything else with a message naming both schemas, so a change of shape fails loudly. Tests: `modules/assessments/scripts/test-review-*.html`, `modules/risk-assessment/scripts/test-risk-review.html` and `test-risk-accept.html`, `modules/report-review/scripts/test-review-*.html`.
