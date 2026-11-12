# OT Cyber Assessment Tool

Browser-based assessment tool for OT cybersecurity engagements. Runs entirely from `file://`. No server, no build pipeline, no telemetry, no network calls at runtime.

Twenty instruments are live across seven scoring families, from ISA/IEC 62443 through NCSC CAF, NIST, CIS, NIS2, the EU CRA and ONR SyAPs. Instruments are **data**: adding one is a content task, not a code change, unless it needs a new scoring family.

## Running

Double-click `index.html`, or open it from a synced SharePoint/OneDrive folder. No installation. Tested in Microsoft Edge / Chromium under Windows 11.

`tour.html` populates every instrument with a worked demo engagement and lands on the 62443-3-3 report. Three of those demos (62443-3-3, General OT Posture, NCSC CAF) also carry a previous assessment, so the re-assessment and progress features are visible without loading a second file.

**One tour page, deep-linked by hash.** Any instrument and view can be linked with a hash on `tour.html`:

```
tour.html                             every demo, landing on the 62443-3-3 report
tour.html#ncsc-caf                    the CAF demo, its report
tour.html#ncsc-caf/caf-principle/C1   a specific capture page
tour.html#iec-62443-3-3/fr/FR1        SL guidance for FR1
tour.html#risk-appetite/ra-verdict    the assessor's read
```

Editing the hash re-lands without a reload.

## Instruments

| Instrument | Family | Scale |
|---|---|---|
| ISA/IEC 62443-3-3 System Security | `capability-sl` | SL 0-4 per zone and conduit |
| ISA/IEC 62443-4-2 Component Security | `capability-sl` | SL 0-4 per component |
| ISA/IEC 62443-4-1 Secure Development Lifecycle | `program-maturity-ml` | ML 1-4 |
| ISA/IEC 62443-2-1:2024 Security Program | `program-maturity-ml` | ML 1-4 |
| ISA/IEC 62443-2-1:2010 CSMS | `csms-conformance` | Conformance states |
| EU Cyber Resilience Act (CRA) | `csms-conformance` | Layered P1/P2/P3 |
| EU Machinery Regulation | `csms-conformance` | Layered M1/M2/M3 |
| NCSC CAF | `caf-achieved` | Achieved / partially / not |
| CAF for Aviation (CAP1850) | `caf-achieved` | Achieved / partially / not |
| NIST SP 800-53 Rev 5 | `caf-achieved` | Achieved / partially / not |
| NIST SP 800-82 Rev 3 OT Overlay | `caf-achieved` | Achieved / partially / not |
| CIS Critical Security Controls v8.1.2 | `caf-achieved` | Implemented / partially / not |
| ONR SyAPs Security Management | `caf-achieved` | Achieved / partially / not |
| ONR SyAPs Cyber Security & IA | `caf-achieved` | Achieved / partially / not |
| ONR SyAPs Nuclear Security Posture | `caf-achieved` | Achieved / partially / not |
| EU NIS2 Directive | `nis2-conformance` | Conformance states |
| EU NIS2 Quick Gap | `nis2-conformance` | Conformance states |
| General OT Security Posture | `domain-letter` | Band 0-3, domain grades A-F |
| Supplier Cyber Exposure Screener | `domain-letter` | Band 0-3, domain grades A-F |
| OT Risk Appetite & Exposure (draft) | `risk-appetite-coherence` | Two 4-band axes, coherence verdict |

`caa-tier3-assessment` remains a placeholder and opens a "coming soon" panel.

**Scoring families are the unit of real code.** Each has its own scorer (`js/scoring-*.js`), capture UI, report section set and export path. Adding an instrument to an existing family costs no code; adding a family is the meaningful work.

## What it does

**Capture.** Every family has both a list view (a whole group on one page) and a
Guided wizard (one item per page, for interview-led work); answers flow both
ways. `Ctrl+K` finds any requirement by code or keyword and scrolls to it.
Answers carry evidence, notes, and N/A with a justification. 62443-3-3 adds
zones and conduits with their own SL-T vector per FR, plus a system-wide
`__shared` answer layer that zones inherit per item and can override.

**Judgement stays with the consultant.** The tool never derives a band or level
from captured fields. Unknown reduces coverage and confidence rather than
scoring as a failure; N/A leaves both the score and its denominator.

**Recording the engagement.** A basis of assessment (interviews, documents,
systems observed) backs the findings. Remediation plans (priority, owner,
action, business impact) can be recorded against any item, gap or not, and
removed again.

**Review.** The report page's Review card sends the report for review as a pack and imports what reviewers send back: comments with severity, suggested wording accepted in one click where the text can be changed in the tool, status and replies. See `docs/report-review.md` at the repository root. Accepted wording can be undone from the comment, and changes to sections that only the Word report has are listed on the report page, each with Back to the generated version. Send for review can carry a note and a needed-by date for the reviewers. A pack sent from a copy of the project that was never saved can be imported again to reconnect its review files. The review is saved on the assessment and never reaches the Word or Excel exports. The Issue check and export dialog warn about it, and never block Final; with QA review by filled in and nothing ever sent, the review is taken as done outside the tools.

**Reporting.** An on-screen preview, a client Word document and a technical
Excel workbook, all from the same result. The consultant can rename, hide,
rewrite and reorder report sections, add glossary terms and edit the proposed
next steps; every change is saved in the project file and applies to both screen
and Word.

**Word preview.** Beside the report page, under Report in the sidebar, the Word
report as Export Word makes it, page by page: the cover, document control, then
the body, landscape pages and charts included. The file is built in memory with
`export-docx.js` (no download), read back with the shared Word reader
(`docx-import.js`) and drawn by the shared page renderer (`doc-preview.js`, the
document tool's), so it cannot disagree with the export. It follows the export's
choices (Draft or Final, which site, zone or product, the organisation-wide
report) and builds again when the assessment changes. `scripts/test-word-preview.html`
and `test-word-preview-2.html` (half the demos each, `word-preview-check.js`) draw every demo and check the pages, cover, headings, pictures and cell colours
against the file.

**Re-assessment.** An earlier assessment in the same file (or a separate loaded
file) becomes a baseline, and the report gains a "Progress since previous
assessment" section showing what moved.

**Working comfortably.** Light and dark themes, autosave to localStorage, save
in place over the opened file, and a sidebar that collapses to a 64px rail of
tokens for smaller screens.

## Files

```
/index.html                  entry point
/tour.html                   every instrument, pre-populated (demo + screenshots).
                             ONE page: deep-link any instrument and view by hash
/css/app.css                 design system (brand colours as CSS variables)
/js/
  scoring.js                 capability-SL scorer + shared item model
  scoring-domain-letter.js   band 0-3 -> domain letter grades, capped-mean headline
  scoring-caf-achieved.js    achieved/partially/not, profile-driven baselines
  scoring-program-ml.js      maturity levels ML1-4
  scoring-nis2.js            NIS2 conformance
  scoring-csms.js            CSMS conformance
  scoring-risk-appetite.js   exposure vs appetite coherence (NOT a grade - see below)
  scoring-cra.js             layered conformance, each layer rolled up separately
                             (CRA P1/P2/P3, Machinery M1/M2/M3)
  storage.js                 project file: save/load, schema migration, metadata split
  compare.js                 baseline diff ("Progress since previous assessment")
  charts.js                  hand-drawn SVG radar / bars / heatmap, SVG->PNG
  report.js                  shared report chassis + consultant customisation
  report-sections.js         what a section override means, synced from shared/ (also used by the risk tool)
  export-xlsx.js             technical workbook (ExcelJS)
  export-docx.js             client Word document
  review.js                  Send for review, Import, Accept, the Review card
  docx-blocks.js, review-core.js, review-author.js   shared review code, synced from shared/
  zip-io.js, docx-import.js, doc-preview.js          the Word preview's reader and renderer, synced
                             from shared/ (with css/doc-preview.css)
  engine.js                  engagement engine; assessments, targets, responses
  ui.js                      view layer: sidebar, capture pages, wizards, modals
  hero-asset.js, logo.js     branding assets for the Word cover
  tour-*-data.js             one worked demo dataset per instrument
/data/
  instruments-index.json     MANIFEST. Every instrument and the shared files.
  manifest.js                AUTO-GENERATED loader. The only data <script> in HTML.
  shared/*.json              taxonomy, scoring profiles, cross-references, guidance
  instruments/<id>/          instrument.json (+ narrative.json, + profiles/)
  *.pdf, *.xlsx              source standards, for authoring and verification
/vendor/
  xlsx.full.min.js           SheetJS, vendored
  exceljs.min.js             ExcelJS, vendored
  docx.umd.js                docx UMD build, vendored and hand-patched (see below)
  docx.umd.js.upstream-      the unpatched original. Keep it: it is the only way
    unpatched                to see what the patch changed if the lib is upgraded
/scripts/
  build-data.ps1             regenerate /data/**/*.js + /data/manifest.js from the JSON
  harness.js                 shared test scaffolding: H.app() writes the app's
                             script tags, H.dom() the fake app shell, H.test()
                             supplies ok() and the summary
  test-*.html                73 headless test pages (see Testing)
  ref-62443-3-3-table-b1.js  transcribed Annex B Table B.1, ground truth for the SL map
  verify-sl-mapping.html     renders the SL selection for eyeballing
  audit-report-parity.html   checks every instrument's report carries the shared sections
  dump-docx.html             dumps a built Word document as text
```

## How data is loaded

The HTML loads exactly one data script: `data/manifest.js`. That file registers the parsed manifest at `window.App.Data.index`, then `document.write()`s a `<script>` tag for each shared file and each active instrument's files, in dependency order, resolved relative to its own URL. The same manifest therefore works from `index.html` at the root and from any test page in `/scripts/`.

`document.write` of script tags during parsing inserts them at the script's position and runs them synchronously in order, so by the time `engine.js` runs, `App.Data.shared.*` and `App.Data.instruments[id].*` are populated.

## Why both .json and .js in /data?

The `.json` files are the source of truth and the only ones to edit. The `.js` files are auto-generated wrappers that assign each blob onto `window.App.Data.*`, so the tool can load them as classic `<script src>` tags without `fetch()` (which browsers block under `file://`).

**After editing any `.json` under `/data`, regenerate:**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-data.ps1
```

Forgetting this is the single most common mistake: the screen keeps working from the stale `.js` while your edit sits unused.

## The project file

One saved JSON is one **customer**, holding every assessment done for them. Schema 2.0.

```jsonc
{
  "schemaVersion": "2.0",
  "project": {                          // shared by every assessment in the file
    "clientName": "", "siteName": "", "siteAddress": "", "siteContact": ""
  },
  "activeAssessmentId": "iec-62443-3-3~m8x1a2",
  "activeInstrumentId": "iec-62443-3-3", // so the file still opens in an older build
  "assessments": {
    "iec-62443-3-3~m8x1a2": {
      "id": "iec-62443-3-3~m8x1a2",
      "instrumentId": "iec-62443-3-3",
      "instrumentContentVersion": "1.0.0",
      "label": "2024 baseline assessment",
      "engagementMeta": {               // per assessment, not per customer
        "opportunityId": "", "consultant": "", "dateOfVisit": "",
        "documentRevision": "", "qaReviewBy": "", "authorisedBy": "",
        "issuedTo": "", "issuedDate": "", "confidentiality": ""
      },
      "targetProfile": { "defaultTargetSL": 2, "perFR": {}, "perZone": {} },
      "targets":   [ { "id": "t-1", "name": "BPCS" } ],
      "responses": [ { "targetId": "t-1", "requirementId": "SR1.1", "components": {} } ],
      "baseline": { },                  // snapshot of a previous assessment, optional
      "reportNarrative": { }, "reportSections": { }, "basisOfAssessment": { }
    }
  },
  "createdAt": "", "updatedAt": ""
}
```

Points that matter:

- **Assessments are keyed by their own id, not by instrument.** One customer file can hold a 2024 and a 2026 62443-3-3 side by side. `instrumentId` is a field on the assessment. In `engine.js`, `activeAssessment()` is the only accessor; anything reaching into the map by instrument id is a bug.
- **Engagement metadata is split.** Customer and site are shared by the file; opportunity ID, consultant, visit date and document control belong to the individual assessment, because the same customer gets different ones per engagement.
- **Everything the consultant types is in the file**, including report section rewrites, added glossary terms, next steps and the basis of assessment.
- Files saved against schema 1.0 (one engagement per file) and against the older instrument-keyed 2.0 layout both migrate transparently on load. `instrumentContentVersion` is checked against the current instrument and a mismatch warns rather than blocks.

## Adding a new instrument

Adding an instrument to an existing family is a content task. **The engine, the report chassis, the exports and the HTML do not change.**

1. Create `/data/instruments/<your-id>/instrument.json`, mirroring an existing instrument in the same family. Add a `narrative.json` alongside it for the composed report prose: `boilerplate`, per-group narrative and `templates`, where the report inserts boilerplate verbatim and composes sentences only by `{slot}` substitution. Nothing free-writes prose, and there is no AI anywhere in the tool.

   The narrative pack is **optional**. `report.js` falls back to an empty pack, and an instrument that carries its own `framing`, `seriesContext`, `scoringNote` and `criticalCaveats` can produce a complete report without one; the CRA and Machinery instruments do exactly that. Run `scripts/audit-report-parity.html` to see which sections a new instrument's report actually emits.
2. Add or promote the entry in `data/instruments-index.json` with `"status": "active"` and its `files` map.
3. Run `scripts/build-data.ps1` and reload.

Bump `contentVersion` whenever requirement ids, titles or questions change, so saved engagements surface a version warning.

**Never reproduce verbatim text from a licensed standard** in the instrument unless the licence allows it and the file records the attribution. What that means in practice, per source:

| Source | Official wording carried? | Where it lives | Why |
|---|---|---|---|
| ISA/IEC 62443 | No, assessor-phrased questions | `verbatimText` left empty | Licensed standard; the licence holder pastes it into their own copy |
| EU CRA, Machinery Regulation | Yes | `verbatimText` | Official Journal text, reproducible with source acknowledged |
| NCSC CAF, ONR SyAPs | Yes | `igps` / outcome fields | Open Government Licence v3.0 |
| NIST SP 800-53, 800-82 | Yes | `controlText` | US Government work, not subject to copyright in the US |
| CIS Controls | Yes | `controlText` | CIS Controls terms of use, attribution and internal use |

Each of those instruments carries an `attribution` string stating the licence; the 62443 packs carry none because they quote nothing. Note that `verbatimText` is only one of the fields used, and reading it alone will tell you the wrong thing about which instruments quote their source.

## Verifying against a standard

Where a licensed copy exists in `/data`, the instrument is checked against it rather than trusted:

- `scripts/test-sl-mapping-standard.html` checks the 62443-3-3 SL selection against `ref-62443-3-3-table-b1.js`, transcribed from Annex B Table B.1 of BS IEC 62443-3-3:2013. The reference is ground truth: **if that test fails, fix the instrument, never the reference.**
- `scripts/verify-sl-mapping.html` renders the mapping for any capability-SL instrument as a table for eyeballing.
- `scripts/test-eu-instruments-complete.html` checks the EU CRA and Machinery instruments against their Regulations: that Annex I coverage is complete (13 + 8 provisions, every letter a to m), that every item cites its Article or Annex, and that the Official Journal wording it quotes matches.

## Risk appetite is not a grade

`risk-appetite-coherence` is the one family with no good direction. It characterises two independent positions, inherent exposure (limited → severe) and apparent appetite (averse → tolerant), and reports how well they fit, never a mark. A tolerant appetite and an averse one are each only well or badly matched to an exposure.

The appetite an exposure warrants is its **mirror**: severe exposure sits opposite an averse appetite, limited exposure can carry a tolerant one. So coherence is the anti-diagonal, and

```
delta = appetiteRank + exposureRank - (bands + 1)
```

with `delta >= 2` under-protected, `delta <= -2` over-invested, and anything within one band aligned. So a nuclear operator or CNI entity, facing severe exposure, is **aligned** when its appetite is correspondingly low, and under-protected when it is not.

**The consultant has the final say.** The arithmetic is a scaffold and cannot see a compensating group control, an imminent divestment, a site mid-migration, a regulator-agreed trajectory, or a board that has genuinely decided to carry a risk with its eyes open. The "Assessor's read" page shows the computed verdict and the override control side by side, so the judgement is made while looking at what it departs from. An override:

- changes the **verdict only**: the exposure and appetite positions stand as characterised, and the plot still shows where the organisation actually sits;
- **requires a recorded reason**, flagged in red until one is given (the same hard rule the sector baselines use).

**Deliverables carry the consultant's judgement, never a commentary on the tool.** The client is paying for the consultant's knowledge, so the report, Word document and workbook present the verdict as the assessor's finding with their reasoning, and say nothing about what the band arithmetic computed, whether the assessor agreed with it, or which bands came from a sector baseline rather than the assessor's pen. Exposing that invites an argument with software instead of a conversation about risk. The computed read and the provenance of each band stay on the **Assessor's read** capture page and in the saved project file, so nothing is lost for QA.

"Scaffold" and "structured prompts" are out of client-facing text as well, because they describe the tool's apparatus rather than the work, and a client reading that the assessment was "scaffolded by prompts" is being told about software. **Sector baselines may be named**: they are a real, defensible input, and the client is entitled to know their sector set a starting point. So the framing now reads *"assessor-led throughout, informed by sector baselines and conducted as a structured interview"*, the source note credits SolutionsPT starting points rather than "a tunable house scaffold" (which also leaked a repo file path into the document), and the workbook's question column is headed "Question asked". `test-risk-appetite.html` asserts all of these phrases stay out.

Capture runs **Sector and scope → Guided wizard (or the section list views) → Assessor's read**. The whole instrument is a structured interview, so every item carries an `interviewPrompt` that renders first and loudest (above the band controls, on both the wizard and the list view), with the `rationale` folded away behind "Why this is asked". The optional technical layer is a setup toggle: switching it on lengthens the wizard from 13 items to 18 and adds its step to the stepper; switching it off removes it from the read but keeps anything already recorded.

**Narrative pack.** `data/instruments/risk-appetite/narrative.json` holds every piece of client-facing prose for this family: the About, where-it-sits, how-to-read, method, limitations and caveat text; an executive summary composed by filling slots, with an opening, a why-it-matters paragraph and a board question for each verdict; plain-language explanations of each verdict (the scoring profile's own rule text is written for maintainers and is never printed); and a first draft of Proposed next steps chosen by verdict. The screen report, the Word document and the Excel Read me all read it through `Report.riskAppetiteNarrative` and `Report.riskAppetiteSlots`, so the three cannot describe one result in different words. The consultant's two paragraphs (context for the board, and the decision for the board) are typed on the report page and stored in `reportNarrative.regulatoryExposure` and `topPriorities`.

The pack is written to read as a person wrote it: plain UK English for a board, no em or en dashes, no hyphen standing in for a dash, none of the stock phrases that mark generated text, and no vocabulary about the tool. `scripts/test-risk-appetite-narrative.html` enforces that on every string in the pack **and** on every paragraph of the built Word document, and checks its own rules against a deliberately bad sentence so a guard that has stopped working cannot pass silently. Edit the `.json`, then run `build-data.ps1`: the app reads the generated `.js`.

Guard rails, all asserted in `scripts/test-risk-appetite.html`: no letter, no percentage, no `score` field, and nothing in the scored result that looks like an A-F grade. The exposure-vs-appetite plot shades only the under-protected region, and the band controls are colour-neutral, because tinting "averse" green would assert what the instrument refuses to assert. Sector baselines (`shared/risk-appetite-sector-baselines.json`) and item roll-ups only ever *suggest*; `source` on each axis records whether a band came from the baseline, the items or the assessor.

**EU legislation is quoted; IEC standards are not.** Official Journal text may be reproduced with attribution, so the CRA and Machinery instruments carry the Regulation's own wording in each item's `verbatimText`, and the tool reads that rather than the PDF. All 21 CRA Annex I items carry it. Where an item is a summary judgement spanning several provisions, which is most of the Machinery set by design, `verbatimText` stays empty and `scoring-cra.js` falls back to the assessor-phrased `requirement`, so nothing ever renders blank.

The PDFs under `/data` are authoring and verification sources only. Nothing at runtime reads them, and the tool works with the folder removed.

## Testing

73 test pages under `/scripts`, run headless:

```powershell
msedge --headless=new --allow-file-access-from-files --virtual-time-budget=180000 `
       --dump-dom "file:///<path>/scripts/test-<name>.html"
```

Each prints `PASS`/`FAIL` lines and ends with `ALL TESTS PASSED` or `<n> FAILED`. A page that reaches neither marker did not finish and must not be read as passing. `test-sanity-all.html` exercises every non-placeholder instrument end to end (structure, scoring, report, Word and Excel).

A page loads its dependencies through `scripts/harness.js` rather than listing them itself:

```html
<script src="harness.js"></script>
<script>H.app({ docx: "mock", tours: ["sl"] }); H.dom();</script>
<script>
H.test(function (ok) {          // (ok, done) if the test finishes in a callback
  ok(condition, "what should be true", "detail shown only on failure");
});
</script>
```

`H.app` mirrors the load order in `index.html`, so a change there belongs in the harness too. Its options are `xlsx`, `docx` (`true` for the real library, `"mock"` for pages that install their own `window.docx`), `tours` and `extra`. Pages predating the harness still carry their own `ok()`/`flush()`; that is fine, and `H.test` is not worth retrofitting to a page whose output is deliberately different.

Counting `PASS` needs care: some pages emit `<div class="row ok">PASS …` with the whole DOM on one line, so a line-anchored `^PASS` count reports them as `0 pass 0 fail`, which looks the same as a page that ran nothing. Match `(^|>)PASS ` instead.

Some pages carry a `#shot` hash that stops after the first render and hides the results, for screenshots.

## Vendor libraries

`xlsx.full.min.js` (SheetJS) and `exceljs.min.js` produce the workbook; `docx.umd.js` (v7.x UMD; newer ESM-only builds will not load under `file://`) produces the Word document. Nothing is fetched from a CDN at runtime.

**`vendor/docx.umd.js` is hand-patched** so Word will open the files: `rStyle` and `rFonts` must lead `w:rPr` in the generated XML. Re-apply the patch if the library is ever upgraded, and check the output opens in real Word, not just in the mocked tests. `vendor/docx.umd.js.upstream-unpatched` is the original, kept so the patch can be diffed against it.

## Brand

`css/app.css` exposes `--brand-blue` and `--brand-blue-dark` in `:root`. The semantic scoring colours (`--met`, `--near`, `--gap`) are intentionally muted; do not replace them with saturated values.

## Sibling app

`../risk-assessment/` is a self-contained risk assessment tool (`index.html`) with its own copy of the assets. It shares no runtime code with this app by design. The only coupling is the `spt-risk-context` interchange file (currently 1.4), which carries per-zone SL-T targets between the two.

## Known limits

- `caa-tier3-assessment` is a placeholder.
- Report narrative packs are static template libraries. Composed prose is limited to what the slots can express, by design.
- **The CAF regulator profiles are empty on purpose.** `ncsc-caf` ships 14 sector profiles (Ofgem, HSE/DESNZ, DfT rail/road/maritime, Ofcom, Ofwat/DWI, each Basic and Enhanced) and all are `status: "placeholder"` with per-outcome expected states set to null. Sector regulators have not generally published their profiles for CAF v4.0, and several issue theirs only to the organisations they regulate, so there is no authoritative source to transcribe. **The expected states must never be inferred**: a profile that looked populated but was guessed would produce a regulator gap report that is confidently wrong. Selecting one shows a banner explaining this; the assessment still runs and reports against the CAF itself, just without an expected-state comparison. To populate one when a regulator publishes (or a client supplies) its profile: fill the matching file under `data/instruments/ncsc-caf/profiles/`, set its `status` to `active`, and stamp `profileVersion` from the source. `caf-general` is fully usable and is the default.
- **Machinery coverage is not exhaustively verified.** The CRA's Annex I coverage is checked by test, because it is countable: 13 lettered and 8 numbered provisions. For the Machinery Regulation only the document identity, the Annex III chapter structure and the three quoted provisions were confirmed against the Official Journal; whether the 31 items exhaustively cover Articles 10 to 25 and Annexes IV to XI rests on the original authoring pass and has not been independently re-derived.
- `Compare.compare` indexes responses by requirement id alone. Callers must scope both sides first with `Compare.scopeResponses(responses, targetId)`, which resolves the 62443-3-3 `__shared` layer; skipping it compares only a zone's overrides.

## Copyright and licence

Copyright (c) 2026 SolutionsPT. All rights reserved. The tool is proprietary and confidential. It is licensed to SolutionsPT staff and to contractors SolutionsPT engages, only for work SolutionsPT commissions, and may not be resold, shared, or used for any other client or purpose. The full terms are in `LICENCE.txt`, which must travel with every copy handed out.

The notice appears in the app (sidebar foot, plus the home screen in the assessment tool and the About page in the risk tool), as a header line in every first-party source file, and in every generated data file via `scripts/build-data.ps1`. Third-party libraries in `vendor/` and quoted framework content keep their own licences, listed in `LICENCE.txt`.

## Version

The tool is **v0.6** (0.6.0). That is the suite version, one number for every tool in the suite (this one, the risk tool and the report review tool), so every file in a release carries the same version. `js/version.js` is a synced copy: the one place to change it is the repository's `shared/version.js`, and `tools/sync-shared.ps1` copies it into each module (`-Check` fails on drift). `js/product.js` gives the version this module's name, so `App.Version.product` is "OT Cyber Assessment Tool". Every release reads it from there:

- **In the tool:** a badge beside the name in the header, the sidebar notice, and the licence pop-up.
- **In project files:** each saved project records `createdWithVersion` and `savedWithVersion`, so a project sent back says which release made it. A project last saved by a newer release than the one opening it gets a warning. Files from before versions were recorded are left without a `createdWithVersion` rather than being given one they never had.
- **In releases:** the single file is named `OT Cyber Assessment Tool v0.6.html`, and the desktop exe is `OT Cyber Assessment Tool v0.6.exe` with file version 0.6.0.
- **Never in a report.** Word and Excel exports carry no version information, either in the text or in the file properties. `scripts/test-review-leak.html` opens real exports of six demos and fails if the version appears anywhere in them; `scripts/test-version.html` checks the version in the tool and the project files.

To release a new version, edit `shared/version.js`, run `tools/sync-shared.ps1`, update the pinned numbers in `scripts/test-version.html`, commit, then run `tools/release.ps1` (or build one module with `tools/build.ps1 -Module assessments -As both -SelfTest`). `module.json` is what the packaging scripts read: the product name, entry page, test pages, parity check page and the exe's app id and self-test.
