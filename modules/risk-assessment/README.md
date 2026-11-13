# OT Cyber Risk Assessment Tool

An offline, browser-based zones-and-conduits risk assessment that follows the
order of the published IEC 62443-3-2:2020 (ZCR 1 to ZCR 7). Open `index.html` directly from disk
(file://). There is no backend and nothing to build to use it; for handing
out, it is also built as one self-contained HTML file and as a portable exe
(see Builds below).

This app is a sibling of the assessment tool in `../assessments`, not part of
it. The two codebases are separate and are expected to diverge. When both need
the same file (vendor libraries, logo, licence, the suite version), its
canonical copy lives in the repository's `shared/` (or `contracts/`) and
`tools/sync-shared.ps1` copies it into each module; never reference across
module folders and never share runtime. The only thing the two apps agree on
at run time is the interchange file contract described below.

## Pages and steps

The sidebar is Home, Engagement and evidence, the seven numbered steps, then
Report, Check and issue and Peer review, and About last. Every entry carries
its page id as `data-stage` (the tests, the exe's self-test and the single-file
parity check find pages by it, never by label text):

| Sidebar | Page id | ZCR |
|---|---|---|
| Home | `home` | |
| Engagement and evidence | `basis` | |
| 1 Scope and risk criteria | `suc` | ZCR 1 |
| 2 High-level risk | `srs` | ZCR 2 |
| 3 Zones and conduits | `zones` | ZCR 3 |
| 4 Risk comparison | `compare` | ZCR 4 |
| 5 Detailed risk (tabs: By zone, Register, Heat map, SL-T grid) | `risk`, `slt` | ZCR 5, ZCR 5.6 |
| 6 Requirements specification | `spec` | ZCR 6 |
| 7 Approval | `approval` | ZCR 7 |
| Report | `report` | |
| Check and issue | `review` | |
| Peer review | `peer` | |
| About | `about` | |

Two old ids still open the Report page: `hlreport` on the high-level summary
and `wordpreview` on the Word pages (`RiskApp.StageAliases`, set by
`js/ui-reports.js`). `window.RiskTool.navigate(id)` opens a page.

- **Status per step.** Each step shows Done, n open, Not started (nothing
  entered) or Not needed (a zone step on a high-level-only assessment, while
  empty). It comes from one structured completeness list,
  `Engine.completeness(project)`: each item has its page (`stage`), the report
  it concerns (`doc`: `detailed`, `highLevel` or `both`) and what to open
  (`target`: a zone, conduit, threat, ranked system or card). `exportProblems`
  is the detailed report's part of it as text, as before.
- **Home** shows the steps with their status, the choice of a high-level
  assessment only or a full assessment (`project.assessmentType`, absent until
  chosen and read as full), and Open the demo, which opens the demo in this
  window in tour mode (autosave off, Save always asks where) and leaves it on
  New, which offers the real work back, or on loading a real file.
- **Load reopens the last step used** (`project.lastStage`, written by Save
  only once the consultant has moved off the page the file opened on, so a
  file loaded and saved again is unchanged). A file with no step, or one this
  build does not have, opens on Home.
- **Assign to zone** on the step 2 ranking puts a ranked system in an existing
  zone or a new one named after it, seeds no threat and opens step 3 at the
  zone. Choosing the zone and pressing Assign are two steps, so browsing the
  list with the keyboard records nothing. A zone's systems are `zone.hlaIds`;
  `zone.fromHLA` is kept as the mirror of the first, for v0.7 and the risk
  context's `fromHighLevelAsset`. A zone from an older file with only
  `fromHLA` reads as a list of one, and gets a list only when a second system
  is assigned. Every output reads the list (the Word ranking's arrow lists
  each zone of a system, the Excel Ranking sheet's Zone column too), never
  `fromHLA` alone. On a high-level-only assessment the column is hidden while
  there are no zones, and shows any zones read-only.
- **Risk comparison (step 4)** is one table of each zone's and conduit's
  initial risk against tolerable risk, and the decision whether a detailed
  assessment is required (`detailed: { required, reason }`). A zone's initial
  risk is the worst of its rated ranked systems, or entered (`zone.initialRisk`)
  when it has none or none of them is rated (an impact with no likelihood
  gives no band); a conduit takes the higher of the zones it joins unless one is
  entered (a house rule, said so on the page). The comparison suggests the
  decision, shown dashed until chosen (one click, or Confirm suggested); a
  decision against the suggestion, or one recorded with no initial risk to
  compare, needs a reason. Not required skips step 5
  for that zone or conduit: completeness asks for no threats, only its SL-T
  with the basis in the justification. Comparing per zone and conduit is the
  method used here, not a reading of the standard's words (see
  `data/zcr-map.json`). On a high-level-only assessment the decision is a
  column of the ranking instead (`highLevelAssets[i].detailed`); a system rated
  for impact alone is listed as having nothing to compare.
- **Check and issue** lists what is open in each report, each line with Go to
  (the page, scrolled to the item, which flashes and takes the keyboard
  focus), and every download. The approvals are step 7's. Before a download
  with something open, or with the peer review's warnings, an in-page panel
  asks (Generate anyway, or Export anyway for the risk context, or Cancel;
  Escape cancels); the browser's confirm is not used. What it lists is worked
  out again each time it is drawn, it goes when another project is opened,
  and the focus returns to the button that asked.
- **Keyboard.** Sidebar entries are buttons (Enter or Space), the open page is
  marked `aria-current`, and the focus stays on the entry. A page opened any
  other way puts the focus on its heading; tabs, view buttons and choices that
  redraw the page keep it.
- **Leaving the demo** by New or by Load offers the real work kept in autosave
  back; Load does not write the loaded file over it.

- **Detailed risk (step 5)** is a workshop page (`js/ui-risk.js`). Its By zone
  tab has a rail of the zones and conduits (scenario count, worst unmitigated
  risk, n open from the one completeness list, Not required from step 4) and
  one of them at a time: its SL-T strip above the scenarios (each FR's
  suggestion and SL-T, Use for one FR, Accept all suggested for those not yet
  set, Copy from another zone or conduit, the Why trace and the
  justification), then a compact scenario table (`tbody[data-threat-id]`
  inside the panel's `[data-owner-id]`) with one editor open, then the zone's
  vulnerabilities and countermeasures. The editor follows the work: the
  scenario (statement, source, entry point, linked assets and vulnerabilities,
  consequence, affected FRs), the unmitigated rating with a one-line
  likelihood rationale, the existing countermeasures linked and the current
  rating (shown once one is linked, or when a current rating is there), the
  treatment decision, and the additional countermeasures with owner,
  priority, due date and status, then the planned rating. The minimum is
  still the statement, affected FRs, likelihood and impact. A Scales popover
  holds every likelihood and impact definition. Duplicate copies a scenario
  in its zone; Copy to puts the scenario and its unmitigated rating in other
  zones or conduits (not the links, ratings with countermeasures or
  decision, which belong to the zone); Move takes the scenario itself, id
  kept, and drops its links to the zone it left. Register lists every
  scenario, filtered by zone or conduit, unmitigated band, decision and open
  only; Heat map counts scenarios per matrix cell for the unmitigated,
  current or planned rating (a state not rated takes the one before it), and
  a cell opens the register filtered to it; SL-T grid is every zone and
  conduit by FR with Accept all suggested (fills unset cells only) and Open
  to the zone's justification. Text typed in the workshop updates the model
  and what it changes on the page in place, never redrawing it, so the
  keyboard stays in the field and a click straight after typing lands;
  choices redraw and keep the focus. Elsewhere a field that redraws on
  change (step 4's reason, a separation reason) waits for a press of the
  mouse to end before it redraws. Go to and the peer review open the zone
  and the scenario (`RiskApp.RiskPage.select`).

- **Zones and conduits (step 3)** has the drawing on top (a zone's box opens
  the zone), compact tables of the zones and the conduits, and one selected
  zone or conduit in a detail panel (`js/ui-zones.js`). A zone's panel holds
  its name, function, logical boundary, safety designation (the `sis-present`
  flag, which still drives `safetyRelated` and the SL3 floor), its assets and
  the separation rows raised for it, then a collapsed Characteristics section:
  accountable organisation, physical boundary, logical and physical access
  points, data flows, external dependencies, security policies, assumptions
  and the exposure flags. Paste several adds assets one per line, with an
  optional type and connection (fixed, wireless, temporarily connected) in
  tab-separated columns (`Engine.parseAssets`); a first line reading as a
  spreadsheet's header row is skipped, and the toast says so. A conduit's panel holds its
  ends, name, channels and protocols, and collapsed its direction, boundary
  devices, markers (wireless, external network, temporarily connected; an
  EXT end is external without a marker) and the external party. A conduit
  with an end not chosen is open on step 3 ("an end is not set"), and Word
  prints the end as Not set, never as external.
- **Separation rows** (`Engine.separationRows`) are raised only when a zone's
  data shows a mix: a business system beside control system assets, a safety
  related asset beside other control system assets, a temporarily connected
  or wireless device (or the wireless flag) beside fixed ones, or control
  system assets in a zone reached by a conduit to EXT or one marked external.
  Each raised row is answered Met or Not separated, the second with a reason;
  unanswered (or without its reason) it is open in the one completeness list,
  and Go to lands on the row. A row not raised asks nothing, and an answer
  kept for a row no longer raised counts for nothing. When a row is raised is
  the method used here (`data/zcr-map.json`).
- **Step 1's risk criteria** show the matrix read-only beside the form, the
  cells above tolerable risk outlined, with the scale definitions. Confirmed
  with the asset owner stores the band confirmed (`srs.tolerableConfirmed`):
  until it matches the tolerable risk, "Tolerable risk is not confirmed with
  the asset owner." is open for both reports.
- **Requirements specification (step 6)** is eight blocks in the order
  `data/zcr-map.json` (`specBlocks`) gives: SUC description, zone and conduit
  drawings, zone and conduit characteristics, operating environment
  assumptions, threat environment, organisational security policies,
  tolerable risk and regulatory requirements (`js/ui-spec.js`). Each is
  assembled from what the steps captured, with Done or Open and a link back
  to where it was captured. The organisational policies (`suc.policies`) and
  the regulatory requirements are entered here (regulatory moved from step
  2; security functions that must be kept stay on step 2 and show in the SUC
  block). The blocks with no other check (assumptions, threat environment,
  policies, regulatory) are open in the completeness list when empty.
- **Approval (step 7)** shows what an approval covers (the tolerable risk,
  the SL-T grid, the accepted risks, the ranking) and the approvers, `project.approvals`
  (scope, name, role, organisation, date, revision, approved, fingerprint).
  `project.approval`, the single sign-off v0.7 and the risk context read,
  mirrors the first; a sign-off edited by an older build wins for that entry
  on load (a new name drops the earlier person's revision and fingerprint,
  an approval taken back drops its fingerprint, and a role or statement typed
  into an empty sign-off starts an entry). Ticking Approved takes the
  fingerprint of what is covered (`Engine.approvalFingerprint`, `a2-`: one
  hash per part, so a change says what moved; a first-build `a1-` print is
  still read, as one hash). The detailed report's approval covers the
  tolerable risk, the SL-T and the accepted risks, the high-level report's
  the tolerable risk and the ranking (with each system's decision on a
  high-level-only assessment): a later change reads "Changed since approval:
  the ranking." and is open for the report it concerns until Approved again.
  An approval with no fingerprint (ticked in an older build) offers Approved
  again. Named approvers with none approved are open ("approval not yet
  recorded"); the sign-off items concern the detailed report once there are
  zones and the high-level report once there is a ranking. Word reads every
  approver: document control, the workbook's Front sheet and the summary
  name each one who signed (the summary with their scope), and the Sign-off
  section opens "Signed off as below" only once someone has, else "For
  approval by the people below". Nothing here blocks, and the tool makes no
  claim about who must approve.

All these fields are optional and written only when set: `js/migrate.js`
tidies them when present and never adds them. A file phase 3 saved with them
(0.2) still opens in v0.7 unchanged (`scripts/test-risk-nav.html` runs the
released v0.7 normaliser, frozen in `scripts/fixtures/v0.7-normaliser.js`,
over `scripts/fixtures/tour-phase3-0.2.js`).

### File format 0.3 (phase 4)

**Release note: files saved by this build are `spt-risk-project/0.3`, which
v0.7 and earlier builds (folder, single file and exe) refuse to open.** This
build opens 0.1, 0.2 and 0.3 files.

- **Links are the record.** A threat has `assetIds`, `vulnerabilityIds` and
  `countermeasureIds`; a countermeasure covers a threat only when linked to
  it (and described). The old match (a countermeasure on a requirement the
  threat affects) is only ever a suggestion. A vulnerability has a
  `reference` (its source); assets have ids (`AS1`, ...); a conduit's
  threat links assets of the zones it joins.
- **Three ratings.** `likelihood`/`impact` is unmitigated (before any
  countermeasure, existing ones included) and drives the SL-T suggestion;
  `currentLikelihood`/`currentImpact` is with the linked existing
  countermeasures; the residual pair now means after the planned measures
  (the planned rating). Either of a pair alone falls back to the rating
  before it. The rating that stands is planned, else current, else
  unmitigated. **Today** is one rule in the engine (`threatTreatment`),
  read by the screen, Word, Excel, the review pack and the risk context
  through the view model: the current rating where rated; else the planned
  rating when no planned countermeasure is linked (nothing is still to come);
  else the unmitigated rating. "Reduced to within tolerable risk" needs a
  linked existing countermeasure and today's rating tolerable. Once the plan
  is complete counts a change only for a threat a planned countermeasure is
  linked to. The risk context's `residualRisk` is the planned rating, else
  the current one (the contract's note says so; the schema stays
  `spt-risk-context/1.4`), exported with the likelihood and impact it was
  worked out from (a side not given takes the rating before it), and the
  review pack's "residual" prints the same. Excel's "Rating that stands"
  column is planned, else current, else unmitigated (the standard's residual
  is our current rating). Word prints all three ratings in the risk register.
- **Approval.** Who accepted a risk, their role, the date and the review
  date are part of the accepted risks an approval covers; added only when one
  is given, so an approval taken before they were recorded still matches.
- **The plan and the acceptance.** A countermeasure has `owner`,
  `priority`, `dueDate`, `status` and `srRefs` (`reference` and
  `addressesFR` stay). A threat has `entryPoint`, `consequence`,
  `likelihoodRationale` and `acceptanceDetail { by, role, date,
  reviewDate }`; `acceptance` stays the reason.
- **The 0.2 to 0.3 step** makes what the old match covered each threat's
  `suggestedCountermeasureIds`, shown dashed with Confirm (per scenario, or
  Confirm suggested links per zone); until confirmed, a reduce decision
  resting on them is open ("a suggested link is waiting to be confirmed").
  The residual pair is copied to the current rating only when every matched
  countermeasure is already in place. The shape fill adds the 0.3 fields
  empty and gives every asset an id; the prune drops link ids that point at
  nothing, repeats, and suggestions already linked.
  `scripts/test-risk-schema03.html` checks this on the frozen files.

## Report page

The Report page has three views, Sections, Word pages and Summary, over both
reports, Detailed and High level; the report chosen stays chosen when the view
changes. Summary is the hand-built one-page summary of each report, kept for
printing (Print one-page summary, Print high-level report). The plan retires
it; keeping it is an open decision for the owner (`docs/risk-tool-redesign.md`,
decision 10). It prints no tool version and no dash placeholders. The Sections view
shows both Word reports, Detailed and High level, section by section, and edits them the way the assessment tool's report page does: no mode and no panel. Edit is on every section's header, and edits in place: the heading becomes a field and the opening paragraphs become a box holding those same sentences. Hide this section and Back to the generated version sit at the foot of the card. Saving text identical to the generated version stores nothing, so an untouched section never reads as edited. A hidden section is dimmed on the page, so it can be put back; only Word drops it.

- **What is on the page is the Word report.** It is read back from a real Word build through `js/docx-blocks.js`, and rebuilt after each edit, with a visible refreshing state. To keep that quick the build leaves out the cover art and the logo header, so the page shows the body only.
- **The store** is `project.reportCustom = { detailed: {...}, highLevel: {...} }`, each in the assessment tool's shape, `{ <sectionKey>: { title, hidden, prose, order, paragraphs } }`. Two sets, because same-named sections say different things. `paragraphs` is a list of `{ from, to, at }`, written when a review suggestion is accepted on one paragraph of an opening (see `docs/report-review.md`): that paragraph alone is printed as `to` while it still reads `from` and the section has no `prose`. The page lists them above the report, each with whether it applies and Back to the generated version, and Edit starts from the text as printed. It is absent until something is changed and removed again when nothing is left, so a project with no overrides saves as it always did, and it adds nothing to the file format. It rides the normal save and autosave and reaches only the Word reports, never Excel or the risk context file.
- **The key and the pass that applies it to Word are shared with the assessment tool** (`js/report-sections.js`, canonical copy `shared/report-sections.js`). A key slugs the generated heading, so a rename does not orphan its override. A rewrite replaces only the run of plain paragraphs opening a section: tables, figures, the scope and tolerable risk lines and the sign-off statement stay. (The tolerable risk line opens its own Tolerable risk section, since the phase 3b review.)
- **Per-zone repeats.** The "Justification for ..." sections are one section across the zones and conduits. Its title is the words before the name, which every one of them keeps, and Hide takes them all. A rewrite is refused and the page says why: each has its own wording, written on the SL-T page. An accepted review suggestion can still reword one zone's paragraph, as it replaces that paragraph only.
- **A zone's or conduit's own heading in the registers is its name,** not a section title: it has no Edit, and is renamed where it is entered. Hiding one zone's register would leave the summary's counts including a zone the report no longer prints.
- **Reworded headings.** A key slugs the generated heading, so rewording a heading in `js/exports.js` would orphan what is stored under the old key. `SECTION_KEY_ALIASES` in `js/model.js` maps each old key to its new one, and is applied where stored keys are read: the section overrides on load, and a review's comments (saved in the project or imported later) in `js/review.js`. Add a line there whenever a generated heading is reworded.
- **Ranked lists.** "Where to focus first" (Detailed) and "Where to look first" (High level) can be reordered by dragging or with the arrows, and Word follows. Rows nobody placed come after the placed ones. The ranking table is sorted by risk band and stays so: that order is what it reports.

## Word preview

The Report page's Word pages view shows the Detailed or High level Word report as Download Word report makes it, page by page: the cover, then the body on A4 sheets, with its headers, footers and coloured tables. `js/word-preview.js` builds the file in memory with `exports.js` (nothing is downloaded and the exporter is unchanged), reads it back with the shared Word reader (`js/docx-import.js` over `js/zip-io.js`) and draws it with the shared page renderer (`js/doc-preview.js`, `css/doc-preview.css`, the document tool's own), so it cannot disagree with the download. It builds again when the project changes. Editing stays on the Report page. `scripts/test-risk-wordpv.html` checks both reports against their files.

## Peer review

The pack's threat items carry, as read-only detail rows, the current and planned likelihood × impact where rated, the plan of each planned countermeasure a confirmed decision rests on (owner, priority, due date, status) and who accepted a risk (with role, date and review date); the answer's "residual" is the planned rating, else the current one. The item fields, the status words and the priority convention (the confirmed, complete decision in the words the report prints, else empty, which the Report Review Tool's risk-no-disposition check reads) are unchanged.

The Peer review page sends both Word reports for review as a pack, and imports the review files that come back: comments with severity, status and replies, on a page of their own. A suggestion on a section's heading or opening wording can be accepted into that report's overrides, rebuilt to check it is really in Word, and undone if not; other text is Copy and Go to, with the reason, and Go to reaches the section on the Report page. See `docs/report-review.md` at the repository root. An accepted change can be undone from the comment. Go to on a threat, or on a zone's target levels, scrolls to it and highlights it. With no zones or conduits the pack holds only the high-level report. Send for review can carry a note and a needed-by date for the reviewers. The review is saved in the project file (`project.review`) and never reaches the Word report, the Excel workbook or the risk context file.

Once a review has started, the Word downloads (detailed and high level) and the Excel download ask once, in the page, when changes are requested, must-fix comments are open, a sent round has had no review back, or the report has changed since approval; they never stop the download. The Report page and Check and issue show the same warnings in a Peer review card. The Engagement details card has a QA review by field (printed in document control in both Word reports), which an approval offers to fill in with the reviewer's name. Recording the asset owner's sign-off, or an approver in step 7, does not count as a change since approval: the content hash leaves out the Sign-off section, the signature table wherever it sits, the document control row and the summary's sign-off sentence.

## Two tiers

The tool is split into two tiers, matching how 3-2 is used in practice.

The high-level tier (ZCR 2) is the high-level risk assessment, done
here as a relative risk ranking of the systems in scope, and it is a
deliverable in its own right. You can rank the systems and generate a
*High-level risk assessment report* (Report, High level) without
defining zones, running the detailed assessment or assigning SL-T. Choosing
"High-level assessment only" on Home says so: the zone steps read Not needed,
and the comparison with tolerable risk is a column of the ranking.

The detailed tier is done per zone, for the zones the risk comparison finds
need it. From the ranking, Assign to zone puts a ranked system in a zone (an
existing one or a new one named after it); the zone's initial risk on the
comparison is the worst of its systems. No threat is seeded.

## Workflow (IEC 62443-3-2:2020)

The standard's zone and conduit requirements (ZCR) are held in
`data/zcr-map.json`: every ZCR id, its title and its clause number, with a
note of what was checked against the published contents list and what is a
house reading. That file is the only place a clause number is written. Each
workflow page shows its ZCR once, in its sub-title, read from the lookup;
fields, hints and warnings carry no standard references, and the Word and
Excel deliverables carry none beyond one sentence in the method text naming
the edition. The workflow covers ZCR 1 to ZCR 7.

Terms follow the 2020 edition: SUC, cyber security requirements
specification, countermeasure. The first tier keeps the 62443 name high-level
risk assessment, the step before the detailed one. Unmitigated risk is
the risk before any countermeasure is considered; residual risk is what
remains with countermeasures in place.

1. **Scope and risk criteria (ZCR 1):** name, description, scope and
   boundary, and operating-environment assumptions; and the risk criteria:
   tolerable risk, confirmed with the asset owner, and whether the client's
   own risk matrix is in use, with the matrix and scales shown beside them.
2. **High-level risk (ZCR 2):** the asset and system
   risk ranking (impact × likelihood → house risk band), which frames the
   zoning and is the high-level deliverable, the assumed adversary class, and
   the threats and requirements card (known and presumed threats, security
   functions that must be kept). Assign to zone
   puts a ranked system in a zone, and "High-level report →" opens the
   standalone report.
3. **Zones and conduits (ZCR 3):** the drawing, the zones and conduits
   tables and one of them in a detail panel with its characteristics, and the
   separation rows the data raises (see Pages and steps above).
4. **Risk comparison (ZCR 4):** each zone's and conduit's initial risk
   against tolerable risk, and whether it needs a detailed assessment (see
   Pages and steps above).
5. **Detailed risk (ZCR 5), By zone tab:** per zone and per conduit, the
   threat scenarios (structured threat statements), the vulnerabilities and
   countermeasures they link, and for each threat its unmitigated likelihood ×
   impact = unmitigated risk, read from a house risk matrix, then its current
   rating with the existing countermeasures and its planned rating after the
   additional ones.
   Each threat's risk is compared with the tolerable risk, and those
   that exceed it need a treatment decision, which the consultant records with
   one click: reduce with countermeasures (linked to the threat, each
   existing or an additional one with its plan, and the current and planned
   ratings show whether it reaches tolerable); accept, with a reason and who
   accepted it, their role, the date and a review date; or treat through the SL-T, where the target is the
   treatment plan and capability is built through the 3-3 programme, so an
   empty countermeasure register is a legitimate position in less mature
   environments. Nothing is inferred: a countermeasure or an SL-T alone
   decides nothing. A file saved by an older build loads with what that build
   inferred shown as a suggestion, confirmed one at a time or per zone with
   Confirm suggested. An unconfirmed suggestion prints and exports as no
   decision. A confirmed decision that lacks what it rests on (reduce with no
   countermeasure on a requirement the threat affects, accept with no reason,
   the SL-T with none set or one below the suggestion and no reason) is not
   a treatment yet: the reports print it as a prompt saying what is missing,
   it is left out of the summary's counts, the risk context exports no
   disposition for it and the review pack leaves its treatment decision
   empty. "Reduced to within tolerable risk" needs a linked countermeasure
   already in place and a tolerable rating it rests on (see File format 0.3).
6. **Detailed risk, SL-T strip and SL-T grid tab (ZCR 5.6):** SL-T is a vector, one target per foundational
   requirement (IAC/UC/SI/DC/RDF/TRE/RA), which is a house reading.
   Each FR's suggestion comes from the worst unmitigated risk affecting it and
   is shown with a full rule trace. The consultant sets the final per-FR SL-T
   and a mandatory justification, which is the deliverable.
7. **Requirements specification (ZCR 6):** the eight blocks, assembled from
   the steps, with the organisational policies and regulatory requirements
   entered there.
8. **Approval (ZCR 7):** what is approved, and the approvers with their
   scope; the first approver is the sign-off the reports and the risk
   context have always carried.

There are two reports. The *High-level report* is the standalone high-level risk assessment
(system under consideration, basis of assessment, ranked systems). The
*Detailed report* covers the per-FR SL-T vectors, zones, threats and the
drawing. Both are on the Report page; Check and issue holds their readiness
lists and every download, the risk-context JSON export among them. The basis of assessment
(on the Engagement and evidence page) records the people interviewed, documents reviewed and
systems observed, plus the engagement details (client, consultant, date,
revision, confidentiality) that the exports use as document control. It appears
in both reports.

### Word and Excel deliverables

Check and issue offers every download (the Report page has the Word one too),
built by `js/exports.js` with the libraries in `vendor/`.

The Word document is the readable deliverable for a management audience. It
uses the same design as the Assessments app's reports, from this app's own copy
of that layout code. It has:

- a full-bleed branded cover, a logo header and a page-numbered footer;
- document control;
- a full executive summary, composed from the data. It leads with the
  residual risk position (one sentence: of the threats above tolerable risk
  before any countermeasure, how many are within it today and how many will
  be once the planned countermeasures are complete; one more: the treatment
  decisions that stand and how many existing and planned countermeasures the
  register holds, each count of none left out; and a table of the threats
  above tolerable risk today, at most five, with their three ratings, a
  rating not given carrying the one before it) and the decisions required
  (threats with no decision or an incomplete one, in red; accepted risks no
  approver has signed; planned countermeasures with no owner or due date, or
  only proposed; or that nothing is waiting). Then why the assessment was
  done, what the report is, the evidence base, findings (an accepted risk is
  named only when it is not in the table above) and next steps, and who
  signed off (the scope of each approval is under Sign-off), with a red note
  for the consultant to tailor;
- a "Risk at a glance" scorecard page: headline tiles, per-zone and per-conduit
  risk-band bars, the worst-case SL-T strip and "where to focus first" cards
  (the threats still above tolerable risk today, ranked on today's rating);
- the system under consideration and requirements, grouped as step 6 is
  (SUC description with the security functions that must be kept, the
  drawing, a characteristics table per zone and conduit with any separation
  not in place and its reason, the assumptions, the threats with the assumed
  adversary, organisational policies, tolerable risk and regulatory
  requirements), the basis, the
  high-level risk ranking, the risk comparison table (each zone's and
  conduit's initial risk, the decision and its reason);
- on landscape pages of their own (Word sections, cut by the key of each
  level 1 heading after the section overrides, so a renamed or hidden
  section still lands right): the risk register (every scenario, its zone or
  conduit, the unmitigated, current and planned ratings with their likelihood
  and impact, and the treatment decision; a current or planned rating not
  given is blank), the treatment plan (the additional countermeasures by
  priority then due date, each with its owner, priority, due date, status,
  the scenarios it addresses and its SR references; a field not given reads
  Not assigned, Not set or None linked) and the accepted risks (scenario,
  rating that stands, reason, accepted by, role, date and review date; Not
  recorded where not given);
- each zone's and conduit's threats in detail: its vulnerabilities with
  where each is known from, then per threat only what was captured (source,
  entry point, linked assets, vulnerabilities, consequence, affected FRs,
  likelihood rationale and the countermeasures linked, in place or planned),
  and the zone's countermeasures in place (the planned ones are pointed to
  the treatment plan); the per-FR SL-T table, which marks a
  safety related zone (with the house floor said once) and no longer has a
  Worst case row, then the driving scenarios (per zone and conduit, the
  threats with the worst unmitigated risk on each foundational requirement,
  requirements with the same drivers on one row; where the suggestion is
  above what they map to, it says it comes from the safety floor or is
  inherited from a zone the conduit joins) and the justifications; the
  sign-off with a signature table from the approvers,
  limitations, and an appendix of the SolutionsPT house risk criteria (the
  matrix with the cells above tolerable risk bordered, the scales, the house
  summary of the security levels and the FR key). Where the client's own
  criteria are in use the appendix says the tables are for reference, with a
  red note asking the consultant to relate the ratings to the client's.

The high-level Word report is a ranking-only version with its own scorecard,
downloaded as `<name>-high-level-risk-assessment.docx`. It has the criteria
appendix (no FR key) and the signature table too, and on a high-level-only
assessment its ranking carries the comparison decision as a column. New
headings have section keys of their own; existing ones keep theirs.

The Excel workbook is the register and treatment plan issued from the tool,
one way: the tool holds the owner, date and status, and the Front sheet's
last row says a new issue replaces the workbook and changes are made in the
tool. Its sheets are Front, Summary, Ranking, Threat register, Treatment
plan, Accepted risks, Vulnerabilities, Zones, Conduits, Countermeasures,
SL-T, Criteria and Basis (the eight it had keep their names and order). The
Summary gives the position in numbers and a heat map grid per rating
(unmitigated, current, planned; a rating not given takes the one before it,
cells above tolerable risk carry a heavy border). The threat register has
current and planned likelihood, impact and risk columns between the risk and
the decision, the Rating that stands (planned, else current, else
unmitigated), and the owner and target
date of the planned countermeasures linked to each threat. The Countermeasures
sheet ends with SR references and the scenarios each addresses; Criteria is
the Word appendix's matrix, scales, security levels, suggested SL-T and FR
key. Empty cells are blank or a word, never a dash, and the version never
appears. The Zones and Conduits sheets end with the
characteristics and the risk comparison's decision and reason; a
high-level-only assessment's Ranking sheet ends with its decision. An incomplete assessment asks in the page before
generating (Generate anyway), with the same check as the risk-context export;
the high-level report is checked against its own part of the list.

### Demo

`tour.html` redirects to `index.html?tour`, which loads a completed demo
assessment (`data/tour-project.js`, Acme Petrochemicals Unit 300); Home's Open
the demo loads it in the running tool. Autosave is switched off in the demo,
so real unsaved work can never be touched. The demo is a full assessment with
every step Done, and its risk comparison shows two conduits found not to need
a detailed assessment, each with its reason. Its zones carry their
characteristics; Z1 and Z3 show an external-network separation answered Met
and Z4 temporarily connected vendor laptops Not separated, with the reason;
the tolerable risk is confirmed; its conduits name their channels and
protocols (OPC UA, VPN, HTTPS); and two approvers are recorded against the
current fingerprint. Since phase 4 it reads as a workshop leaves it: every
threat links its assets, vulnerabilities (each with its source) and
countermeasures (each with SR references), with its entry point, consequence
and likelihood rationale; T1, T7 and T9 carry a current rating their existing
countermeasures bring within tolerable risk, T2 and T5 a planned one, and the
four additional countermeasures have an owner, priority, due date and status;
T4 is treated through the SL-T programme, and T8 is accepted with who
accepted it, their role, the date and a review date. A current or planned
rating is recorded only where it differs from the rating before it (T2's
rationale says why its allow-listing does not lower its likelihood), and each
countermeasure's SR references are on the FRs it addresses. Conduit C2 (vendor
remote access) runs both ways, sessions always started from the jump host in
Z3. `scripts/test-tour-risk.html` holds it to zero completeness problems and
its approvals to Unchanged since approval.

## What the tool does and does not claim

- The workflow follows the order of the published IEC 62443-3-2:2020 and
  covers ZCR 1 to ZCR 7 (the About page says the same, built from the
  lookup). The ZCR ids, titles and clause numbers in `data/zcr-map.json`
  were checked against its contents list (13 Nov 2026). The detailed
  requirement wording has not been checked line by line, and the points listed
  as a house reading in that file are the tool's interpretation, not claims
  about the standard. The tool was first built from a 2013 working draft; its
  clause numbers and terms have been removed. Verbatim normative text and the
  standard's own example risk tables are not reproduced, because they belong
  to the licence holder.
- The risk matrix, likelihood scale and risk-to-SL mapping are SolutionsPT house
  defaults. 62443-3-2 prescribes no matrix. The tool
  always shows the rule trace, and the consultant's per-FR SL-T and written
  justification are the deliverable. A client's own corporate matrix takes
  precedence: tune `data/slt-suggestion-rules.json` or replace the matrix
  entirely.

## Layout

```
index.html                         the page: header, styles and the script tags, in load order
module.json                        the module manifest the packaging scripts read
tour.html                          demo entry: redirects to index.html?tour
js/version.js                      the suite version (synced copy of shared/version.js)
js/product.js                      this module's product name
js/model.js                        the project's shape: rules constants, schema, empty
                                   records, ZCR lookup, the reworded-heading aliases
js/engine.js                       the risk maths: matrix, residual, coverage, treatment
                                   state, SL-T suggestion, completeness, risk context;
                                   every function takes the project as an argument
js/migrate.js                      Load and autosave restore: the schema ladder
                                   (0.1 -> 0.2 -> 0.3), the shape fill, the dangling-id prune
js/view-model.js                   the one view model: per-threat and per-zone facts
                                   and counts that the pages, Word, Excel, the review
                                   pack and the risk context all read
js/ui-kit.js                       h(), toast, theme, cards, fields, register table
js/app.js                          state, autosave, Save/Load, the sidebar (page ids,
                                   status per step), the render loop and the old page
                                   ids, Go to, Open the demo, header buttons; boot()
                                   publishes window.RiskTool
js/ui-stages.js                    Home, steps 1, 2 and 4 (with the risk comparison
                                   and Assign to zone) and Engagement and evidence
js/ui-risk.js                      step 5: the zone workshop (rail, SL-T strip, scenario
                                   table and editor), Register, Heat map, SL-T grid
js/ui-zones.js                     step 3: drawing, tables, detail panel, paste,
                                   separation rows
js/ui-spec.js                      steps 6 and 7: the specification and the approvals
js/ui-reports.js                   the Report page's views and summaries, Check and
                                   issue, the Generate anyway panel, downloads
js/ui-about.js                     the About page
js/boot.js                         starts the app once every page has registered
js/exports.js                      Word + Excel deliverable builders/downloads
js/report-page.js                  the Report page: both Word reports, section by
                                   section, edited in place
js/report-sections.js              what a section override means, shared with the
                                   assessment tool (synced from shared/)
js/docx-blocks.js                  reads a generated Word file back into blocks
                                   (synced from shared/)
js/review.js                       Peer review: packs, review files and Accept
js/logo.js, js/hero-asset.js       brand assets as base64 (logo, cover art) for
                                   the Word report — this app's copies
css/spt-theme.css                  this app's copy of the SolutionsPT theme
css/report-page.css                the Report page, in the assessment tool's classes
data/slt-suggestion-rules.json     house risk model AS DATA (severity/likelihood
                                   scales, risk matrix, risk->SL, FRs, tolerable
                                   risk, exposure modifiers) + generated .js
data/zcr-map.json                  the ZCR ids, titles and clause numbers of
                                   IEC 62443-3-2:2020 + generated .js; the only
                                   place a clause number is written
data/risk-context-interchange.json the export contract (spt-risk-context/1.4) + .js
data/engagement-guidance.json      advisory prep notes (typical & often-forgotten
                                   documents, key stakeholders) shown on the
                                   Basis of assessment page; never auto-added
data/tour-project.js               the completed demo assessment (tour mode only)
scripts/build-data.ps1             regenerates the .js mirrors after editing JSON
scripts/test-risk-tool.html        engine + UI tests (headless Edge)
scripts/test-risk-migrate.html     the ladder, shape fill and prune on the frozen files
scripts/test-risk-schema03.html    schema 0.3: the model, the 0.2 to 0.3 step (suggested
                                   links, residual to current), asset ids, the prune, the
                                   three ratings and the coverage rule from links, and the
                                   one rule for the rating that stands today
scripts/test-risk-workshop.html    step 5: rail, editor, links, current hidden, scales,
                                   duplicate/copy/move, SL-T strip, register, heat map,
                                   SL-T grid, focus, Tab out of a reason, click after typing
scripts/test-risk-focus.html       step 5 after the phase 4 review: where the keyboard lands
                                   after each action, what a redraw keeps (sections, Why,
                                   Copy or move, the rail's scroll), the Scales closing, the
                                   zone's countermeasure and vulnerability lists, the other
                                   register filters, a Planned cell, Duplicate and Move
scripts/test-risk-spec.html        step 3's layout and paste, separation rows, step 1's
                                   criteria, step 6's blocks and links, step 7's
                                   approvers and fingerprint, the review hash, the Word
                                   sections, Excel columns, the 3b fields through v0.7
scripts/test-risk-nav.html         the sidebar and step status, Home, Assign to zone, the
                                   risk comparison, Check and issue and its links, the
                                   Generate anyway panel, old page ids, lastStage, Open
                                   the demo, and a file with the new fields in v0.7
scripts/fixtures/                  frozen files: the tour as v0.7 saved it, the tour as
                                   phase 3 saved it (0.2), a hand-made 0.1 file, and the
                                   released v0.7 normaliser; never edited or regenerated
scripts/test-tour-risk.html        tour-mode tests (seeding, autosave protection), and the
                                   demo as a workshop example with zero completeness problems
scripts/test-risk-reports.html     Word/Excel deliverable tests, with phase 4's sections and
                                   sheets (residual position, decisions required, landscape
                                   register, treatment plan, accepted risks, threat detail,
                                   driving scenarios; Summary heat maps, Treatment plan,
                                   Accepted risks, Vulnerabilities, Criteria) and the review
                                   pack's rating, plan and acceptance rows
scripts/test-risk-version.html     version shown in the tool, never in Word/Excel
scripts/test-risk-sections.html    the Report page, on real Word output, against
                                   risk-word-baseline.js (the text with no overrides)
scripts/test-risk-accept.html      accepting suggested wording, and Go to
scripts/test-risk-zcr.html         the ZCR lookup, no draft citation or term on
                                   any page or in the Word reports, and the
                                   alias for reworded section headings
vendor/docx.umd.js                 Word lib — the rPr-PATCHED copy (see the
                                   Assessments app's docx patch note); exceljs
                                   drives the Excel workbook; xlsx unused
```

The app's own scripts are classic scripts (no modules, no bundler), so the
folder app runs from file:// and the single-HTML build inlines each
`<script src>` line in turn. They share one namespace, `window.RiskApp`
(`Model`, `Engine`, `Migrate`, `ViewModel`, `UI`, `App`, `Reports`, `Pages`),
and load in the order `index.html` lists them, `js/boot.js` last.
`window.RiskTool` is the facade everything else uses (exports, review, the
Report page, the Word preview, the suite, the tests, the exe's self-test);
keep its members when moving code, and give an engine function the project
rather than letting it read page state.

After editing any of the JSON files:

```
powershell -ExecutionPolicy Bypass -File scripts/build-data.ps1
```

## Interchange with the assessment tool

Check and issue (or Export risk context in the header) exports a `spt-risk-context/1.4` JSON file. The assessment tool's
62443-3-3 instrument imports it ("Import risk context") to scope the assessment
per zone. The contract is duplicated on purpose in both apps' `data/` folders:
this app's copy is authoritative for what it exports, and the Assessments copy
for what it imports. Both list `acceptedSchemas`, and the importer rejects
anything not on that list, so a change of shape (bump `schema` in both copies)
fails loudly.

- Each zone and conduit carries `slTargetByFR` (the per-FR vector) and a scalar
  `slTarget` (the maximum across FRs). The 3-3 importer uses the scalar to
  pre-set the per-zone target today. The per-FR vector is shown as provenance,
  ready for the 3-3 tool to use per FR later.
- The threat, vulnerability and countermeasure register travels as context only
  and never scores the 3-3 assessment: the import sets targets, never results.

## Tests

From the repository root:

```
.\tools\run-tests.ps1 -Module risk-assessment
```

That runs every `scripts/test-*.html` page in headless Edge (each loads
index.html in an iframe and prints PASS/FAIL lines plus `ALL TESTS PASSED`)
and writes each page's output to `test-results\risk-assessment\`. To run one
page by hand:

```
msedge --headless --disable-gpu --allow-file-access-from-files ^
  --virtual-time-budget=15000 --dump-dom "file:///<abs-path>/scripts/test-risk-tool.html"
```

The matching import test lives in the assessment tool at
`../assessments/scripts/test-risk-import.html`.

## Version

The tool shows the suite version, one number shared by every tool in the
suite: `js/version.js` is a synced copy of `shared/version.js`, the only place
to change it (then run `tools/sync-shared.ps1`). `js/product.js` gives this
module its own name, so `App.Version.product` is "OT Cyber Risk Assessment
Tool".

- **In the tool:** the header badge (for example "v0.7, 62443-3-2-aligned",
  with the full number on hover) and the About page.
- **In the risk-context file:** `generatedBy` is `spt-risk-tool/<version>`.
  The project file's `schema` (`spt-risk-project/0.3`) is the file format's
  own version, not the tool's.
- **Never in a report.** The Word and Excel deliverables carry no version, in
  the text or the file properties. `scripts/test-risk-version.html` opens real
  exports and fails if the version appears anywhere in them.

## Builds

Like every tool in the suite, this one ships on its own, so a contractor can
be given just the risk tool. From the repository root:

```
.\tools\build.ps1 -Module risk-assessment -As html            # single HTML + parity check
.\tools\build.ps1 -Module risk-assessment -As exe -SelfTest   # portable exe + its self-test
```

- **Single HTML:** `packaging/single-html/OT Cyber Risk Assessment Tool v0.7.html`.
  Everything is inlined (stylesheet, logo, scripts, data and the demo project),
  so it opens from anywhere with no files beside it; add `?tour=1` to the
  address to open the demo. `packaging/single-html/check-single-html-risk.html`
  proves it is the same app as this folder.
- **Portable exe:** `%LOCALAPPDATA%\OTCAT-electron\risk-assessment\dist\OT Cyber Risk Assessment Tool v0.7.exe`,
  with its own app id, so its autosave is separate from the assessment tool's.
  See `packaging/electron/README.md`.

`module.json` is what the packaging scripts read: the product name, the entry
page, the test pages, the parity check page, the files only loaded on demand
that the single HTML must carry inline, and the exe's app id and self-test.

## Out of scope for v0.x

Verbatim zone and conduit requirements and other normative content,
drag-and-drop network diagramming, and any automatic
scoring of the 3-3 assessment from risk data.

## Copyright and licence

Copyright (c) 2026 SolutionsPT. All rights reserved. The tool is proprietary and confidential. It is licensed to SolutionsPT staff and to contractors SolutionsPT engages, only for work SolutionsPT commissions, and may not be resold, shared, or used for any other client or purpose. The full terms are in `LICENCE.txt`, which must travel with every copy handed out.

The notice appears in the app (sidebar foot, plus the home screen in the assessment tool and the About page in the risk tool), as a header line in every first-party source file, and in every generated data file via `scripts/build-data.ps1`. Third-party libraries in `vendor/` and quoted framework content keep their own licences, listed in `LICENCE.txt`.
