# OT Cyber Risk Assessment Tool

An offline, browser-based zones-and-conduits risk assessment that implements
the IEC 62443-3-2 Clause 4 workflow. Open `index.html` directly from disk
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

## Report page

The Report page shows both Word reports, Detailed and High level, section by section, and edits them the way the assessment tool's report page does: no mode and no panel. Edit is on every section's header, and edits in place: the heading becomes a field and the opening paragraphs become a box holding those same sentences. Hide this section and Back to the generated version sit at the foot of the card. Saving text identical to the generated version stores nothing, so an untouched section never reads as edited. A hidden section is dimmed on the page, so it can be put back; only Word drops it.

- **What is on the page is the Word report.** It is read back from a real Word build through `js/docx-blocks.js`, and rebuilt after each edit, with a visible refreshing state. To keep that quick the build leaves out the cover art and the logo header, so the page shows the body only.
- **The store** is `project.reportCustom = { detailed: {...}, highLevel: {...} }`, each in the assessment tool's shape, `{ <sectionKey>: { title, hidden, prose, order, paragraphs } }`. Two sets, because same-named sections say different things. `paragraphs` is a list of `{ from, to, at }`, written when a review suggestion is accepted on one paragraph of an opening (see `docs/report-review.md`): that paragraph alone is printed as `to` while it still reads `from` and the section has no `prose`. The page lists them above the report, each with whether it applies and Back to the generated version, and Edit starts from the text as printed. It is absent until something is changed and removed again when nothing is left, so a project with no overrides saves as it always did, and the file format stays `spt-risk-project/0.2`. It rides the normal save and autosave and reaches only the Word reports, never Excel or the risk context file.
- **The key and the pass that applies it to Word are shared with the assessment tool** (`js/report-sections.js`, canonical copy `shared/report-sections.js`). A key slugs the generated heading, so a rename does not orphan its override. A rewrite replaces only the run of plain paragraphs opening a section: tables, figures, the scope and tolerable risk lines and the sign-off statement stay.
- **Per-zone repeats.** The "Justification for ..." sections are one section across the zones and conduits. Its title is the words before the name, which every one of them keeps, and Hide takes them all. A rewrite is refused and the page says why: each has its own wording, written on the SL-T page. An accepted review suggestion can still reword one zone's paragraph, as it replaces that paragraph only.
- **A zone's or conduit's own heading in the registers is its name,** not a section title: it has no Edit, and is renamed where it is entered. Hiding one zone's register would leave the summary's counts including a zone the report no longer prints.
- **Ranked lists.** "Where to focus first" (Detailed) and "Where to look first" (High level) can be reordered by dragging or with the arrows, and Word follows. Rows nobody placed come after the placed ones. The ranking table is sorted by risk band and stays so: that order is what it reports.

## Peer review

The Peer review page sends both Word reports for review as a pack, and imports the review files that come back: comments with severity, status and replies, on a page of their own. A suggestion on a section's heading or opening wording can be accepted into that report's overrides, rebuilt to check it is really in Word, and undone if not; other text is Copy and Go to, with the reason, and Go to reaches the section on the Report page. See `docs/report-review.md` at the repository root. An accepted change can be undone from the comment. Go to on a threat, or on a zone's target levels, scrolls to it and highlights it. With no zones or conduits the pack holds only the high-level report. Send for review can carry a note and a needed-by date for the reviewers. The review is saved in the project file (`project.review`) and never reaches the Word report, the Excel workbook or the risk context file.

Once a review has started, the Word downloads (detailed and high level) and the Excel download ask once when changes are requested, must-fix comments are open, a sent round has had no review back, or the report has changed since approval; they never stop the download. The Report, Review & export and high-level report pages show the same warnings in a Peer review card. The Engagement details card has a QA review by field (printed in document control in both Word reports), which an approval offers to fill in with the reviewer's name. Recording the asset owner's sign-off does not count as a change since approval.

## Two tiers

The tool is split into two tiers, matching how 3-2 is used in practice.

The high-level tier is a §4.2 relative risk ranking of the systems in scope, and
it is a deliverable in its own right. You can rank the systems and generate a
*High-level risk assessment report* (Reports → High-level report) without
defining zones, running the detailed assessment or assigning SL-T.

The detailed tier is done per system, for the systems that warrant it. From the
ranking, "Detail →" promotes a ranked system into a single-system zone,
pre-filled and seeded with a starting threat at the ranked impact and
likelihood. This keeps the 62443 zone and conduit vocabulary, and the per-zone
handoff to the 3-3 tool, while the detailed work reads as per-system.

## Workflow (IEC 62443-3-2 Clause 4)

1. **System under consideration (§4.1):** name, description, scope and
   boundary, and operating-environment assumptions.
2. **High-level risk and requirements (§4.2 and 4.3):** the asset and system
   risk ranking (impact × likelihood → house risk band), which frames the
   zoning and is the high-level deliverable, plus the security requirements
   specification. That covers tolerable risk (§4.3.6), known and presumed
   threats, mandatory security functions, regulatory requirements, the assumed
   adversary class, and whether the client's own risk matrix is in use.
   "Detail →" promotes a ranked system into the detailed tier, and
   "Generate high-level report →" produces the standalone report.
3. **Zones and conduits (§4.4):** a zone editor (assets, access points and
   boundary devices, external dependencies, security policies, exposure
   flags), a conduit editor, and an auto-generated, read-only SVG drawing
   (§4.4.2). The tool prompts for safety, wireless and mobile separation per
   §4.4.4 to 4.4.7.
4. **Detailed risk assessment (§4.5, 4.6 and 4.7):** per zone or system and per
   conduit, a threat register (structured threat statements, §4.5.1),
   vulnerabilities (§4.5.2), and for each threat its likelihood (§4.5.3) ×
   impact (§4.5.4) = unmitigated risk (§4.5.5), read from a house risk matrix.
   Each threat's risk is compared with the tolerable risk (§4.6), and those
   that exceed it need a disposition. That can be countermeasures that bring
   the residual risk (§4.7) down to tolerable (a countermeasure can be flagged
   as an existing control or a planned remediation); carrying the risk into the
   SL-T, where the target is the treatment plan and capability is built through
   the 3-3 programme, so an empty countermeasure register is a legitimate
   position in less mature environments; or a recorded risk acceptance, saying
   who accepted it and why. Only threats with no disposition at all are
   flagged. The asset owner signs off the tolerable risk and outcome on the
   review page (§4.3.6 and §4), and the sign-off prints in both reports and
   travels with the export.
5. **SL-T assignment:** SL-T is a vector, one target per foundational
   requirement (IAC/UC/SI/DC/RDF/TRE/RA), as in the standard's worked example.
   Each FR's suggestion comes from the worst unmitigated risk affecting it and
   is shown with a full rule trace. The consultant sets the final per-FR SL-T
   and a mandatory justification, which is the deliverable.

There are two reports. The *High-level report* is the standalone §4.2 output
(system under consideration, basis of assessment, ranked systems). *Full report
& export* covers the per-FR SL-T vectors, zones, threats, the drawing, a
printable summary and the risk-context JSON export. The basis of assessment
(on the Engagement page) records the people interviewed, documents reviewed and
systems observed, plus the engagement details (client, consultant, date,
revision, confidentiality) that the exports use as document control. It appears
in both reports.

### Word and Excel deliverables

Both report pages offer downloads, built by `js/exports.js` with the libraries
in `vendor/`.

The Word document is the readable deliverable for a management audience. It
uses the same design as the Assessments app's reports, from this app's own copy
of that layout code. It has:

- a full-bleed branded cover, a logo header and a page-numbered footer;
- document control;
- a full executive summary, composed from the data: why the assessment was
  done, what the report is and how to use it, the evidence base, findings,
  treatment position and next steps, with a red note for the consultant to
  tailor;
- a "Risk at a glance" scorecard page: headline tiles, per-zone and per-conduit
  risk-band bars, the worst-case SL-T strip and "where to focus first" cards;
- the system under consideration and requirements specification, the basis,
  the §4.2 ranking, the zone and conduit threat registers with dispositions and
  acceptances, the per-FR SL-T table with justifications, sign-off and
  limitations.

The high-level page generates a §4.2-only version with its own scorecard.

The Excel workbook is the engineers' working copy: a threat tracker with a
status dropdown, owner, date and notes columns, colour-coded risk bands and
filters, plus the ranking, zone and conduit registers, countermeasures, the
SL-T matrix and the basis. An incomplete assessment asks before generating,
with the same check as the risk-context export.

### Demo

`tour.html` redirects to `index.html?tour`, which loads a completed demo
assessment (`data/tour-project.js`, Acme Petrochemicals Unit 300). Autosave is
switched off in the demo, so real unsaved work can never be touched.

## What the tool does and does not claim

- The structure follows the published 62443-3-2 process and has been checked
  against the ISA D4E6 working draft. Verbatim normative text and the
  standard's own example risk tables are not reproduced, because they belong to
  the licence holder. The version stays at 0.x because the tool has not been
  checked line by line against a licensed published copy.
- The risk matrix, likelihood scale and risk-to-SL mapping are SolutionsPT house
  defaults. 62443-3-2 does not prescribe them; it requires the organisation's
  own risk criteria and tolerable-risk threshold (def. 3.1.39, §4.3.6). The tool
  always shows the rule trace, and the consultant's per-FR SL-T and written
  justification are the deliverable. A client's own corporate matrix takes
  precedence: tune `data/slt-suggestion-rules.json` or replace the matrix
  entirely.

## Layout

```
index.html                         the whole app (UI + risk engine inline)
module.json                        the module manifest the packaging scripts read
tour.html                          demo entry: redirects to index.html?tour
js/version.js                      the suite version (synced copy of shared/version.js)
js/product.js                      this module's product name
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
data/risk-context-interchange.json the export contract (spt-risk-context/1.2) + .js
data/engagement-guidance.json      advisory prep notes (typical & often-forgotten
                                   documents, key stakeholders) shown on the
                                   Basis of assessment page; never auto-added
data/tour-project.js               the completed demo assessment (tour mode only)
scripts/build-data.ps1             regenerates the .js mirrors after editing JSON
scripts/test-risk-tool.html        engine + UI tests (headless Edge)
scripts/test-tour-risk.html        tour-mode tests (seeding, autosave protection)
scripts/test-risk-reports.html     Word/Excel deliverable tests
scripts/test-risk-version.html     version shown in the tool, never in Word/Excel
scripts/test-risk-sections.html    the Report page, on real Word output, against
                                   risk-word-baseline.js (the text with no overrides)
scripts/test-risk-accept.html      accepting suggested wording, and Go to
vendor/docx.umd.js                 Word lib — the rPr-PATCHED copy (see the
                                   Assessments app's docx patch note); exceljs
                                   drives the Excel workbook; xlsx unused
```

After editing either JSON file:

```
powershell -ExecutionPolicy Bypass -File scripts/build-data.ps1
```

## Interchange with the assessment tool

Stage 6 exports a `spt-risk-context/1.4` JSON file. The assessment tool's
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

- **In the tool:** the header badge (for example "v0.6, 62443-3-2-aligned",
  with the full number on hover) and the About page.
- **In the risk-context file:** `generatedBy` is `spt-risk-tool/<version>`.
  The project file's `schema` (`spt-risk-project/0.2`) is the file format's
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

- **Single HTML:** `packaging/single-html/OT Cyber Risk Assessment Tool v0.6.html`.
  Everything is inlined (stylesheet, logo, scripts, data and the demo project),
  so it opens from anywhere with no files beside it; add `?tour=1` to the
  address to open the demo. `packaging/single-html/check-single-html-risk.html`
  proves it is the same app as this folder.
- **Portable exe:** `%LOCALAPPDATA%\OTCAT-electron\risk-assessment\dist\OT Cyber Risk Assessment Tool v0.6.exe`,
  with its own app id, so its autosave is separate from the assessment tool's.
  See `packaging/electron/README.md`.

`module.json` is what the packaging scripts read: the product name, the entry
page, the test pages, the parity check page, the files only loaded on demand
that the single HTML must carry inline, and the exe's app id and self-test.

## Out of scope for v0.x

Verbatim zone and conduit requirements and other normative content (this waits
for a licensed copy), drag-and-drop network diagramming, and any automatic
scoring of the 3-3 assessment from risk data.

## Copyright and licence

Copyright (c) 2026 SolutionsPT. All rights reserved. The tool is proprietary and confidential. It is licensed to SolutionsPT staff and to contractors SolutionsPT engages, only for work SolutionsPT commissions, and may not be resold, shared, or used for any other client or purpose. The full terms are in `LICENCE.txt`, which must travel with every copy handed out.

The notice appears in the app (sidebar foot, plus the home screen in the assessment tool and the About page in the risk tool), as a header line in every first-party source file, and in every generated data file via `scripts/build-data.ps1`. Third-party libraries in `vendor/` and quoted framework content keep their own licences, listed in `LICENCE.txt`.
