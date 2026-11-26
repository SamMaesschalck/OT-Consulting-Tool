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
| 3 Zones and conduits (tabs: Zones and conduits, Asset register) | `zones` | ZCR 3 |
| 4 Risk comparison | `compare` | ZCR 4 |
| 5 Detailed risk (tabs: By zone, By consequence, Register, Heat map, SL-T grid) | `risk`, `slt` | ZCR 5, ZCR 5.6 |
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
- **Risk comparison (step 4)** is, first, the standard's one comparison: the
  SUC's initial risk (the worst of the rated ranked systems and of the zones'
  and conduits' initial risk, `js/engine.js` sucComparison) against tolerable
  risk. Above it, a detailed risk assessment of every zone and conduit is
  required; within it, the page says plainly that none is, and the consultant
  may still assess the zones, for example to set their SL-T. With nothing
  rated, it is the step's one completeness item. Then a table of each zone's
  and conduit's own initial risk against tolerable risk, labelled as the house
  method for choosing its depth: it suggests detailed above tolerable risk and
  proportionate within it, beside the depth set, and Set opens step 5 at that
  depth. Nothing is filled from it. A zone's initial risk is the worst of its
  rated ranked systems, or entered (`zone.initialRisk`) when it has none or
  none of them is rated (an impact with no likelihood gives no band); a
  conduit takes the higher of the zones it joins unless one is entered (a
  house rule, said so on the page). Comparing per zone and conduit is the
  house method for the depth, never the standard's comparison (see
  `data/zcr-map.json`). On a high-level-only assessment the decision on a
  detailed assessment is still a column of the ranking
  (`highLevelAssets[i].detailed`), recorded per system; a system rated for
  impact alone is listed as having nothing to compare. That decision per
  system is the house method for choosing what goes forward to a detailed
  assessment, and step 2's sub-title and the high-level report's ranking say
  so; the standard compares the SUC once.
- **How each zone and conduit is assessed (the depth).** Every zone and
  conduit is assessed; `zone/conduit.assessment { depth, withId, reuseSource,
  considered, reason }` records how, and is written only once set (read
  through `js/engine.js` depthOf):
  - `detailed`: its own threat scenarios. A file without the field reads so.
  - `grouped`: assessed with `withId`, a zone or conduit assessed in detail
    (not itself, and never one that is itself grouped, so there are no chains
    or loops), whose threat scenarios it shares. By the house method its SL-T
    suggestion is, per FR, the higher of its own and that one's (the Why
    trace and the driving scenarios say so). It keeps its own SL-T and
    justification. The prune drops a `withId` naming a record that is gone,
    or itself.
  - `reused`: results reused from `reuseSource` (a standard design or an
    earlier assessment). It keeps its own SL-T and justification.
  - `proportionate`: a short review; `considered` notes the threats
    considered, and threat scenarios may be added as well.
  - `deferred`: not assessed in this assessment, for `reason`. The reports
    say so as a limitation, once, the SL-T tables mark it as having no SL-T
    yet, and the approval page and the approval sentence in Word say the
    approval does not cover it.
  - A file saved by v0.7.0 recorded a per-zone decision instead
    (`detailed: { required, reason }`). With no `assessment`, one recorded as
    not required that has no threat scenarios reads as deferred with no
    reason (it was not assessed), so the completeness list asks for the
    reason; anything else reads as detailed. Nothing is written by that
    reading, and the released v0.7.0 normaliser keeps `assessment` as it is.
  - Completeness warns, never blocks: every zone and conduit has an SL-T, a
    deferred one with a warning of its own that it has none yet; detailed has
    a threat scenario (a conduit with a justification excepted, as before);
    grouped names a zone or conduit assessed in detail; reused names its
    source; proportionate has a note or a scenario; deferred has a reason.
    Detailed also has at least one vulnerability recorded ("no vulnerabilities
    recorded", Go to opens its Vulnerabilities list); the other depths are
    exempt, as they rest on their own record.
- **Check and issue** lists what is open in each report, each line with Go to
  (the page, scrolled to the item, which flashes and takes the keyboard
  focus), what has changed since a previous assessment (phase 6a), and every
  download. The approvals are step 7's. Before a download
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
  risk, its depth, n open from the one completeness list) and one of them at
  a time: its depth bar (the depth as a list of five, with beside it what that
  depth rests on: the zone or conduit it is grouped with and Open, the
  source reused, the threats considered or the reason for deferring; Shared
  with on a zone others are grouped with; the house method's suggestion with
  Use; a change of depth keeps what was typed for the others, offers Undo and
  puts the keyboard on what the new depth needs), its SL-T strip above the scenarios (each FR's
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
  mouse to end before it redraws. Add from library, beside + Add scenario,
  adds house scenarios as unrated drafts (see phase 5b). Go to and the peer review open the zone
  and the scenario (`RiskApp.RiskPage.select`).

- **Zones and conduits (step 3)** has two tabs, Zones and conduits and Asset
  register (phase 6a, below). The first has the drawing on top (a zone's box opens
  the zone), compact tables of the zones and the conduits, and one selected
  zone or conduit in a detail panel (`js/ui-zones.js`). A zone's panel holds
  its name, function, logical boundary, safety designation (the `sis-present`
  flag, which still drives `safetyRelated` and the SL3 floor), its drawing level (see phase 5b below), its assets and
  the separation rows raised for it, then a collapsed Characteristics section:
  accountable organisation, physical boundary, logical and physical access
  points, data flows, external dependencies, security policies, assumptions,
  the applicable security requirements (`securityRequirements`, lines, e.g.
  "IEC 62443-3-3 SRs at the SL-T; site policy P-12") and the exposure flags. Paste several adds assets one per line, with an
  optional type and connection (fixed, wireless, temporarily connected) in
  tab-separated columns (`Engine.parseAssets`); a first line reading as a
  spreadsheet's header row is skipped, and the toast says so. A conduit's panel holds its
  ends, name, channels and protocols, and collapsed its direction, boundary
  devices, markers (wireless, external network, temporarily connected; an
  EXT end is external without a marker) and the external party, then the
  characteristics a zone has, as far as they apply to a conduit
  (`accountableOrg`, `logicalBoundary`, `physicalBoundary`, `safetyRelated`,
  `accessPoints`, `physicalAccessPoints`, `dataFlows`, `externalDependencies`,
  `securityPolicies`, `assumptions`, `securityRequirements`; all optional,
  written only once set). Word prints them in the conduit's characteristics
  table (its safety designation once any of them is recorded), and step 6
  and the specification show the accountable organisation and the security
  requirements. A conduit
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
  the method used here (`data/zcr-map.json`). Separating business and
  control system assets, and separating safety related assets, are
  requirements of the standard (the other rows are recommendations): Not
  separated there reads as a departure from it on the zones page, step 6
  and in Word and Excel, and its warning asks for the justification. Safety
  related assets may instead share a zone designated safety related as a
  whole (the zone's Safety related tick, or "The whole zone is designated
  safety related" on the row): Not separated is then no departure, and Word
  says the whole zone is treated as safety related.
- **Step 1's risk criteria** are the project's own, editable beside the form
  (`js/ui-criteria.js`, phase 5): the matrix, one choice of band per cell, the
  cells above tolerable risk outlined; Start from a preset (the SolutionsPT
  house criteria, or three, four or five levels each); and below, the impact
  and likelihood levels (3 to 5 each, highest first, each with a one-line
  definition and how many ratings use it) and the consequence categories,
  each with a tolerable risk of its own or "Same as general". Confirmed
  with the asset owner stores the band confirmed (`srs.tolerableConfirmed`):
  until it matches the tolerable risk, "Tolerable risk is not confirmed with
  the asset owner." is open for both reports. See Risk criteria below.
- **Requirements specification (step 6)** is nine blocks in the order
  `data/zcr-map.json` (`specBlocks`) gives: the mandatory security
  countermeasures (`Engine.mandatoryCountermeasures`: the countermeasures the
  confirmed decisions to reduce a risk or to treat it through the SL-T
  programme rest on, in place or planned, each once
  per zone or conduit, a house reading; the specification file prints them
  after the SL-T, which they follow from, and a justification naming one of
  them by id is no longer flagged there), SUC description, zone and conduit
  drawings, zone and conduit characteristics, operating environment
  assumptions, threat environment, organisational security policies,
  tolerable risk and regulatory requirements (`js/ui-spec.js`). Each is
  assembled from what the steps captured, with Done or Open and a link back
  to where it was captured. The organisational policies (`suc.policies`) and
  the regulatory requirements are entered here, each policy with what
  implements it (`suc.policyImplementation`, short text by policy, printed
  after it in Word and the specification; a policy edited in place keeps
  it, `Model.setPolicies`) (regulatory moved from step
  2; security functions that must be kept stay on step 2 and show in the SUC
  block). The blocks with no other check (assumptions, threat environment,
  policies, regulatory) are open in the completeness list when empty.
  The threat environment is entered on step 2: the sources of threat
  intelligence (`srs.threatSources`), the current threats, known or presumed
  (`srs.knownThreats`), and the emerging threats (`srs.emergingThreats`). It
  is open until it names a source as well as the adversary or a threat. Word
  and the specification print them under Threat environment (section key
  `threat-environment`; the old `known-or-presumed-threats` key is mapped).
- **Approval (step 7)** shows what an approval covers (the tolerable risk,
  the SL-T grid, the accepted risks and any transferred ones, the ranking,
  and the zones and conduits deferred, which it does not cover) and the approvers, `project.approvals`
  (scope, name, role, organisation, date, revision, approved, fingerprint).
  `project.approval`, the single sign-off v0.7 and the risk context read,
  mirrors the first; a sign-off edited by an older build wins for that entry
  on load (a new name drops the earlier person's revision and fingerprint,
  an approval taken back drops its fingerprint, and a role or statement typed
  into an empty sign-off starts an entry). Ticking Approved takes the
  fingerprint of what is covered (`Engine.approvalFingerprint`, `a3-`: one
  hash per part, so a change says what moved; the parts are the tolerable
  risk, the ranking, the SL-T, the accepted risks (with the transferred ones
  and the remaining risks accepted), each threat scenario with its three
  ratings, every treatment decision, the zones and conduits with what each
  holds and its depth, and the mandatory security countermeasures). An
  `a2-` print, taken before the 3-2 fixes' step 5, is read under its own
  rule, its four parts, so it cannot see a change to the others; a
  first-build `a1-` print is still read, as one hash. The detailed report's
  approval covers the tolerable risk, the zones and conduits, the threat
  scenarios with their ratings and decisions, the SL-T and the accepted and
  transferred risks, and says it does not cover a deferred zone or conduit;
  the specification's the tolerable risk, the zones and conduits, the SL-T
  and the mandatory countermeasures; the high-level report's the tolerable
  risk and the ranking (with each system's decision on a high-level-only
  assessment; on a full assessment it says the scopes were given for the
  full assessment): a later change reads "Changed since approval:
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

### The 3-2 fixes, step 5 (built Nov 2026)

Every finding of the final check against the published standard, fixed.
All of it warns and never blocks; the new fields are optional and written
only once set (`js/model.js`), and the released v0.7.0 normaliser keeps them.

- **SL-T per requirement.** A zone or conduit with some targets set and
  others not warns once, naming them ("no SL-T set for SI and RA."). The
  SL-T section in Word and the specification says each has one target per
  requirement only when every target is set; otherwise that the consultant
  sets one per requirement and Not set marks one with none yet.
- **Reduce, and the remaining risk.** A decision to reduce is incomplete
  (`threatTreatment` gap, no disposition) when the risk is above tolerable
  today and no planned countermeasure is linked ("Reduce with
  countermeasures (none planned)"), and when the rating once the plan is
  complete (`afterPlan`) stays above tolerable with no record of the asset
  owner's acceptance of what remains. A decision to treat through the SL-T
  programme in the same position is incomplete the same way. The acceptance
  reuses the threat's acceptance fields: the reason in `acceptance`, who,
  role, date and review date in `acceptanceDetail` (`remainingAbove`,
  `remainingAccepted`, `remainingMissing`). Accepted risks in Word and
  Excel list it, marked "Remaining risk accepted", rated once the plan is
  complete; the approval covers it; the review pack shows it.
- **Mandatory security countermeasures** are, by the house reading, those
  the confirmed decisions to reduce a risk or to treat it through the SL-T
  programme rest on.
- **The approval fingerprint** is `a3-` (see Approval above).
- **Characteristics.** One warning per zone or conduit lists what it lacks
  (`Engine.characteristicsMissing`): name, accountable organisation, logical
  and physical boundary, logical and physical access points, data flows,
  for a zone the zones or conduits it connects to and its assets'
  classification, criticality and business value, applicable security
  requirements, security policies, and assumptions or external
  dependencies. Go to opens the characteristics.
- **Routes.** A threat whose route crosses two zones that no conduit joins,
  or passes a conduit that does not join the zone beside it, warns.
- **Ranked systems inside the SUC.** `rankedSystem.inSuc` is false for a
  system outside the SUC (absent: inside). The SUC's initial risk is the
  worst of the systems inside it; one inside it in no zone warns (on a full
  assessment with zones); the ranking marks the others in the UI ("In the
  SUC"), Word ("Outside the SUC") and Excel (an "In the SUC" column when
  any is outside). The risk context does not carry the mark.
- **Documentation of the results.** No confidentiality classification of
  the reports warns (both reports). The risk assessment sessions
  (`basisOfAssessment.sessions`: date, topic, participants with their
  titles; ids S1, S2..., `counters.session`) sit on Engagement and evidence
  beside the interviews, print in Word's basis of assessment and the Basis
  sheet, and none recorded warns for the detailed report.
- **The SUC's access points** (`suc.accessPoints`: description, and the
  zone or conduit it enters) are on step 1, print in Word and the
  specification under the SUC, and none listed warns for both reports.
- **Organisational policies** say what implements each (see step 6 above).
- **ZCR 3.3** is a requirement (see the separation rows above).
- **Older files.** A zone or conduit a v0.7.0 file recorded as not needing
  a detailed assessment, with no threats, reads as deferred with no reason.

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
- **Three ratings.** `likelihood`/`impact` is unmitigated (before any cyber security
  countermeasure, existing ones included; countermeasures built into the
  components and non-cyber protection still count) and drives the SL-T suggestion;
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

### Risk criteria and impact per category (phase 5)

The schema stays `spt-risk-project/0.3`; every field here is optional, tidied
by the migration when present and never added. A file without them reads
the house criteria exactly as before (`scripts/test-risk-criteria.html`
proves it on the frozen fixtures and the demo: every band, SL-T suggestion,
risk context, completeness item and approval fingerprint is unchanged).

- **`project.criteria`** holds the criteria in use: `likelihood` and `impact`
  (`[{ id, name, note }]`, lowest first, 3 to 5 each), `matrix` (impact id,
  then likelihood id, to one of the four fixed bands), `categories`
  (`[{ id, name }]`), optionally `tolerableByCategory` (category id to band)
  and `preset` (the last preset applied). It is absent until the first change
  and is seeded from `data/slt-suggestion-rules.json`; a copy that is the
  house's again, with no tolerable risk per category, is dropped, so the
  file reads as one never changed. The four band ids (low, medium, high, very
  high) stay the output vocabulary of the exports and the risk context; the
  general tolerable risk stays `srs.tolerableRisk`; the risk-to-SL mapping is
  on the bands, so it is unaffected.
- **One accessor.** `Model.criteriaOf(project)` (`RiskTool.criteriaOf`) gives
  the criteria in use, normalised: the levels with their rank, the categories
  with their tolerable risk, and whether they are the house's, the client's
  (the "client's criteria in use" tick) or agreed for this assessment.
  `Engine.riskFor(impact, likelihood, project)` reads the matrix from the
  project; the engine, the today rule, the view model, the heat map, the
  Scales popover, the register, the ranking, Word, Excel, the review pack and
  the risk context all go through these (`RiskTool.riskFor`, `threatRisk`,
  `residualRisk`, `likelihoodName` and `impactName` take the project, the
  open one when left out). A level the criteria do not have gives no band.
- **Presets.** The generic 3x3, 4x4 and 5x5 shapes are the tool's own: words
  of its own, positional ids (`L1`, `I1`, ...) and a band from the sum of the
  two positions on their scales, never lower for a higher level. Choosing a
  preset (or removing a level) with ratings on levels that change asks in the
  page where each goes; Cancel or Escape changes nothing, and a change that
  moves nothing (the same criteria again) asks nothing. The default
  (`Engine.defaultMapping`): a level is the same only when both its id and its
  name match (the presets reuse `L1`, `I1` with other words); else the level of
  the same name; else the one at the same relative place on the new scale,
  rounded up, so no rating reads lower; for a preset every level goes by its
  place alone, so moving between the generic presets never lowers a band
  (`scripts/test-risk-p5fix.html` checks every pair). Rounding up means a
  4-level scale there and back can end a level higher (house Serious to 5x5
  Major and back is Severe): the panel shows each default before it applies.
  Leave as it is keeps the rating. A rating left where it is, on a level or a
  category the criteria no longer have, is open in the completeness list
  ("the impact no longer fits the risk criteria") on the page it was rated
  on, with Go to, and a new level or category never takes the id it holds.
  Nothing moves a rating silently. A matrix cell that is not one of the four
  bands (a file edited by hand) is open: "The risk matrix has cells not set."
- **Tolerable risk per category.** A threat rated per category is above
  tolerable risk when any category's risk (its impact, capped at the
  rating's own impact, with the state's likelihood) is above that category's
  tolerable risk, or the general one; a rating whose own impact is above all
  its categories (one was removed) is its band against the general tolerable
  risk, so it never reads within below its band. A threat with no category,
  or criteria with no tolerable risk per category, compares its band with the
  general tolerable risk as before. The engine's treatment state (required,
  current, planned, today, once the plan is done) and so every output read
  it, as do the SL-T trace (every threat behind a requirement, not only the
  worst band's), the heat maps (a cell holding threats is outlined when one
  of them is above tolerable risk, an empty one by its band:
  `ViewModel.heatCells` and `heatAbove`, read by step 5 and the workbook's
  Summary) and the review pack (its expected value is each rated category's
  tolerable risk where one has its own). A ranked system does the same
  (`hlaExceeds`), and a zone's initial risk from its systems. The tolerable
  risk an approval covers includes the per-category ones and the criteria
  (the same content `isHouseContent` compares: names, definitions, cells,
  category names), once they are not the house's, so a change reads as "the
  tolerable risk or the risk criteria changed".
- **Impact per category.** A threat may give its impact per consequence
  category (`impactByCategory`, in the editor's Impact by category); a
  ranked system its consequence (`consequenceByCategory`) and where the
  rating comes from (`consequenceSource`: HAZOP, LOPA, a business impact
  analysis, an interview, typed or picked). The single `impact` (or
  `consequence`) mirrors the worst category, shown as derived, so every
  reader of it, the risk context and an older build work as before. With no
  category left the map goes and the impact stays, set by hand again. While
  an entry is on a level or category the criteria no longer have (Leave as
  it is), the single impact is not worked out again, so it never drops. An
  impact that is not the worst of its categories (an older build edited it)
  is open. Copy to takes the categories with the unmitigated rating.
- **Deliverables.** Word prints the project's criteria in the appendix,
  labelled "The SolutionsPT house risk criteria used in this assessment.",
  "The client's risk criteria used in this assessment (where they come
  from)." or "The risk criteria agreed for this assessment." (with "(from a
  SolutionsPT generic preset)" while they are one unchanged); with the
  client's criteria marked in use but the house's still on step 1, the old
  reference wording and red note stay, and "The client's risk criteria are
  marked in use, but step 1 still holds the house criteria." is open (and
  "The client's criteria are marked in use, but step 1 holds a generic
  preset." while step 1 is an unchanged 3x3, 4x4 or 5x5). The
  method row, the method text and the sentences naming the matrix follow
  the same label. Where categories were used, the appendix names them (a
  table with their tolerable risk when one is set per category, a category
  with none reading "Medium (general tolerable risk)"), the tolerable risk
  section lists the per-category ones ("Safety: Low; Financial loss: High"), a threat's detail has
  an Impact by category row and the ranking's consequence its categories and
  source. Excel: the Criteria sheet is the project's criteria with the same
  label and the categories (with a line on how they are compared), and names
  the SL-T mapping and the security levels as the house's; the Threat register gains an Impact by category
  column and the Ranking sheet Consequence source and Consequence by category
  columns, each last and only when something is captured. The review pack
  gains an Impact by category detail row where given, and its ratings print
  the criteria's level names.

### Drawing levels, safety floor, scenario library and undo (phase 5b, built Nov 2026)

Each item stands on its own. The schema stays `spt-risk-project/0.3`; every
new field is optional, tidied by the migration when present and never added,
so a file without them behaves exactly as before.

- **Drawing levels.** A zone may have a drawing level (`zone.level`), chosen
  in step 3's zone panel from a house layering (Enterprise, DMZ, Supervisory,
  Control, Safety, Field; `Model.ZONE_LEVELS`), labelled as the house's and
  not as a model from a standard. Once any zone has one, the drawing lays the
  zones out in horizontal bands, top to bottom in that order, each band
  shaded and labelled on the left, at most four zones to a band's row; zones
  with no level form a last band, No level. Within a band the zones follow
  `zone.levelOrder` (Move left and Move right in the panel, which write the
  band's order out) and then the zones' order. With no level set the drawing
  is laid out exactly as before: `scripts/test-risk-drawing.html` holds every
  box, line, id tag and key line to a frozen copy of the phase 5a layout
  (`scripts/fixtures/zone-map-phase5a.js`) on the demo, the frozen files and
  generated projects.
  - Every drawing (steps 3 and 6 and the summary) opens a zone from its box,
    by click or Enter.
  - A conduit's SL-T (the highest set) and its channels sit beside its id tag
    where they fit, on its own line (never off the line's end), clear of every
    box, tag, note and other line; where they do not fit they are left off the
    drawing (the key, the conduit table and Word's characteristics carry
    them). Channels too long are cut at a comma or a space, never mid-word.
  - A box says "SL-T 3" (the conduits' form) or "Suggested SL 3", and the
    worst risk by name; a line too wide for the box goes on two.
  - A legend under the key says what is used: the safety related border, the
    worst-risk border colours, the dashed box outside the SUC, "SL-T: highest
    on any foundational requirement", "Suggested SL: no SL-T set yet", and
    "Shaded rows: SolutionsPT house layering".
  - On step 3 the drawing is a group of zone buttons, each with a focus ring.
  - Word puts the drawing on a page of its own (the heading, the picture, the
    key and the legend are a Word section of their own inside the
    requirements): landscape, or portrait for a drawing that prints larger
    that way (a tall banded one). The picture is the drawing alone
    (`toPng(L, 3, { picture: true })`, `L.drawH` tall), up to 940 by 540
    pixels landscape or 620 by 860 portrait; the key (each conduit's id, name
    and ends) and the legend (each mark as a bordered cell, or its word, and
    what it means) are Word tables under it at the body's size. Twelve zones
    over six levels print at about half size (0.51; 0.41 before); the demo at
    full size. One `layout()` still feeds the SVG and the PNG.
- **Safety floor list.** The rules file's `sis-present` rule has `floorFR`,
  the requirements the SL3 floor applies to, all seven by default (the
  owner's decision), so results do not change. A project can narrow it
  (`project.safetyFloorFR`, stored only while narrower, never wider) with the
  chips in the floor box on the SL-T grid and on a safety related zone's
  SL-T strip; step 3's safety hint says what it covers. The SL-T suggestion,
  the Why trace ("the SL3 floor does not cover UC in this assessment"), the
  driving scenarios ("SLn from the safety floor" only where it applies) and
  the Word SL-T section ("The house method sets a floor of SL3 for it; in
  this assessment the floor covers IAC and SI.") read it; the page says
  "every foundational requirement" when it covers all seven. `scripts/test-risk-floor.html` proves the
  frozen files and the demo give the same results and Word text as a rules
  file with no list.
- **Scenario library.** `data/scenario-library.json` (and its `.js` twin,
  `scripts/build-data.ps1`, version 1.1) holds 33 OT threat scenarios
  (`HS01` to `HS33`; HS31 to HS33 cover telemetry to remote sites, an IT
  management tool shared with the control hosts, and an OEM package unit) in SolutionsPT's
  own words: id, title, statement, typical threat source, entry point,
  consequence, affected requirements, typical asset types, typical
  vulnerabilities, countermeasure ideas with IEC 62443-3-3 SR ids (ids only,
  no requirement text) and tags. It holds no ratings. Its `_note` asks
  SolutionsPT to name an owner for the wording; nothing of the note appears
  in the tool or a deliverable.
  - Step 5's Add from library opens an in-page picker (search, a tag and a
    requirement filter, the scenarios that fit the zone or conduit first,
    with a hint of why: its asset types, an external or wireless conduit, the
    zone's flags). The chosen scenarios are added as unrated drafts
    (statement, source, entry point, requirements, consequence) with
    `threat.libraryId` for provenance; a countermeasure idea is added, as an
    additional countermeasure linked to nothing, only when ticked. Nothing is
    rated, decided or linked for the consultant. Escape or Cancel closes it.
    Add from library controls the picker (`aria-controls`), whose count is
    a live region; a scenario added before is marked Already added.
  - Step 2's Send to step 5 makes draft scenarios of the known threats
    recorded there, on a zone or conduit chosen in the panel (the line is the
    statement; those already there are marked and cannot be sent twice).
  - The library never reaches Word, Excel, the risk context or the review
    pack; a scenario added from it prints like any other.
- **One-level undo.** Ctrl+Z outside a text field (inside one the browser's
  own undo stays, unless nothing has been typed since the last change, as
  when an action has just put the keyboard there) undoes the last change, and the toast after a destructive
  or bulk action offers Undo: removing a scenario, zone, conduit, asset,
  countermeasure, vulnerability or ranked system, Move, Copy to, Accept all
  suggested (strip, grid row and grid), Confirm suggested, a preset applied,
  assets pasted, scenarios added from the library and threats sent to step 5.
  The state before the last change is kept as text (`js/app.js`); typing in
  one field is one change. Each undo point is numbered: an action takes
  `undoMark()` before it acts, and its toast offers Undo only for a point it
  made, so an action that changed nothing never offers to undo an earlier
  one. The toast is a polite live region (`role="status"`), kept in the
  layout when idle (`toast-off`), with a dark slate background in the dark
  theme; its Undo carries `aria-keyshortcuts="Control+Z"`. Undo puts the project back in place (ids never
  change), returns to the page the change was made on, opens the zone,
  conduit or scenario again and puts the keyboard on it; it marks the project
  changed and autosaves. One level only, no redo; Load, New and Restore clear
  it, and a question about where ratings go (step 1) is closed.
  `scripts/test-risk-undo.html` covers each action.

### Asset register and previous assessment (phase 6a, built Nov 2026)

Each item stands on its own. The schema stays `spt-risk-project/0.3`; every
new field is optional, tidied by the migration when present and never added,
so a file without them behaves and prints exactly as before.

- **Asset register.** Step 3 has two tabs, Zones and conduits (as before) and
  Asset register (`js/ui-assets.js`, over `js/assets.js`). Assets still live
  in their zone (`zone.assets`, ids `AS1`...); the register lists every one
  with its id, name, zone, type, connection and the register's own optional
  attributes: `tag` (tag or hostname), `vendor`, `model`, `version` (firmware
  or software), `location`, `criticality` (`high`, `medium`, `low`),
  `classification` (the owner's own classification, free text, as schemes
  differ), `businessValue` (`high`, `medium`, `low`; the 3-2 fixes), `owner`
  and `notes`, each written only when set. Paste from Excel does not map the
  classification or the business value; the risk context does not carry them. A search, filters by zone, type
  and criticality, and a sort on any column (numbers inside ids, names and
  tags sort by value, case ignored). The ID and Name columns stay at the
  left and the header at the top as the register scrolls; its count is a
  polite live region. Fields edit in place; notes are a box that grows with
  their lines. To stay quick at a few hundred assets the search and the
  filters hide rows in place, an edit redraws the table only when it is
  sorted on what was edited, the paste panel is drawn on its own, and each
  row's selects are cloned from one built per draw. After a change the
  keyboard is back on the same field of the same asset, wherever it now
  sorts (`js/app.js` focusMark finds a register row by `data-asset-id`).
  Choosing another zone moves the asset there (id kept) on a deliberate
  choice: a click, Enter, or leaving the field; an arrow press in a closed
  list, which fires change, waits. A threat's links to it then follow the
  prune (a zone's threats lose the link, a conduit's keep it while the
  conduit still joins the new zone), the toast says "AS1 moved to Z3 and
  taken off 2 threats.", and Undo puts it all back. The search, filters and
  paste box start afresh when another project is opened (Load, the demo,
  Restore, New: `js/app.js` projectReplaced), and a zone filter left from a
  zone removed is dropped.
- **Paste from Excel** (on the register). Tab-separated rows as a
  spreadsheet copies them: Excel's quoting (a cell holding a tab, a line
  break or a quote), CRLF, LF or CR line endings, a byte order mark. A cell
  that opens a quote and never closes it is read with the quote as a plain
  character, so it cannot swallow the rows after it. A first row is the
  header when it holds the name's heading or two known headings (English
  names: Name, Asset, Device; Zone; Type; Connection; Tag, Hostname; Vendor,
  Manufacturer, Make; Model; Version, Firmware; Location, Site, Room;
  Criticality; Owner; Notes, Comments). Without one, or with a heading not
  known, the panel asks what each column holds (no header: name, type and
  connection, as Paste several reads them), and after Read the keyboard is
  on the first column to choose. A field chosen for two columns is marked
  there, and only the first of them is read ("Two columns are read as tag or
  hostname; the first is used."). A status line (role status) says what the
  preview comes to ("6 rows: 4 to add, 2 left out; 3 with a problem."). The
  preview shows what each row does (Action: Add to a zone, Update an asset,
  Left out) and its problems: a zone not found (the row goes to the zone
  chosen for rows without one; an update row is updated in place), a type
  not known (set to Other), a connection or criticality not known, a tag
  repeated in the paste (the repeat is left out; a row left out for another
  reason does not take the tag), a tag an asset already has (left out unless
  Update existing is ticked; an update writes only the fields the paste
  gives, so a row with no name keeps the asset's own, says when it renames
  one, and never moves the asset), no name (a new asset takes its tag as its
  name). The paste is one undo step and puts the keyboard back on Paste from
  Excel. Paste several on a zone works as before (`Engine.parseAssets`).
- **Word.** Where any asset has one of the register's attributes, the
  characteristics no longer list the assets and say where they are; an
  Asset register sub-section follows them: one table per zone with only the
  columns something is recorded in (Name and Type always, a type of Other
  blank as in the characteristics row, Connection where an asset is not
  fixed, the version headed Firmware or software version). More than six
  columns in any zone puts the sub-section on a landscape page of its own
  (cut out like the drawing's). The high-level report has none. **Excel:** an
  Assets sheet after Conduits, every asset with its zone, one way like every
  sheet. The review pack and the risk context are unchanged.
- **Previous assessment.** Check and issue has a Since the previous
  assessment card: Load previous assessment reads a risk project file (any
  schema Load reads, on a copy) and stores it as `project.baseline`: the
  file's name, its date (`savedOn`, `assessmentDate`, `revision`), its
  approval date (`approvedOn`, the latest approved entry), `loadedOn`, and
  `facts`, a frozen copy of what is compared (`js/compare.js` freeze: each
  zone and conduit with its SL-T, its depth (and, grouped, the one it is
  assessed with) and a conduit's ends, each threat with its
  three ratings worked out on that file's own criteria, the treatment
  decision recorded and whether it is accepted, each countermeasure with its
  status, each ranked system with its rating, its impact by category and,
  on a high-level-only assessment, its decision on a detailed assessment,
  the tolerable risk and a key of the criteria). The comparison stands
  without the old file and never changes anything else in the project;
  Replace and Remove are on the card, and both undo. A frozen copy that is
  not well formed loses, on load, what is not an object, and the comparison
  reads it defensively, so it never breaks a build.
- **What is compared.** Matched by id with a name fallback for anything
  numbered again: the same id and name, then the same name (a conduit also
  by its ends), then the same id; ranked systems by id, then by name;
  threats and countermeasures across zones, so a move is seen. Each change
  is said once, with its direction in words: ranked systems added, removed,
  renumbered, renamed, their risk raised or lowered, their impact by
  category changed, the decision on a detailed assessment changed; zones and
  conduits added (with what they hold, not listed again), removed,
  renumbered ("Z1 Unit 300 BPCS was numbered Z2."), renamed ("C3 had no
  name; now Corporate reporting."), a conduit that now joins other zones
  ("C1 now joins Z1 and Z2; was Z1 and Z3."), a depth that changed ("C1
  Historian replication: now grouped with Z3; was assessed in detail.", only
  where both copies hold a depth, so one frozen before the depth was kept
  reports none, and on the Changes sheet as Assessment depth changed); the SL-T per FR ("IAC raised
  from SL2 to SL3", "DC set to SL1", "DC no longer set (was SL2)"); threats
  added, removed, moved or renumbered; ratings per state (unmitigated,
  current, planned; a state not rated in either is not said again): "current
  risk lowered from High (High × Serious) to Medium (Low × Serious)", "now
  rated", "no longer rated (was ...)", "changed from" for the same band, with
  likelihood and impact on the same criteria and by band only when the
  criteria changed ("The risk criteria changed, so ratings are compared by
  band only."); a treatment decision only when the decision recorded changed
  ("T4 (Z2): was reduce with countermeasures; now treated through the SL-T
  programme."; a threat now within tolerable risk needs none, which its
  rating says); countermeasures added, removed, moved to another zone ("M5
  moved from Z3 to Z1."), now in place or with their status changed ("M5
  (Z3): moved from in progress to done.", "M3 (Z1): now agreed."); accepted
  risks added or no longer accepted ("T8 (Z4) no longer accepted; the
  decision is now reduce with countermeasures.", said there, not again with
  the decisions); a change of tolerable risk or of a category's tolerable
  risk. A review date that has passed is a fact about today, not a change:
  the full report says it under Decisions required, baseline or not ("The
  review date of the accepted risk T8 (Z4), 2026-10-31, has passed.").
- **Deliverables.** The full Word report has Progress since the previous
  assessment after the risk position, only with a baseline: one sentence
  naming the previous assessment (by date, revision and approval, not its
  file name), then each group with its lines, or "Nothing recorded has
  changed since." The high-level report has the same section after What we
  found, with the risk criteria and the ranked systems only (the ranking
  rests on the criteria; it holds no zones). Excel has a Changes sheet after
  the Summary, only with a baseline, one row per change (area, zone or
  conduit, item, change, previous, now), in the same words: Raised, Lowered,
  Set, No longer set, Rated, Renumbered, Moved, Ends changed, Status changed,
  with a countermeasure's state as printed elsewhere (In place, Planned,
  Proposed, Agreed, In progress, Done) and a blank where there was none. The
  demo carries no baseline (`scripts/test-risk-compare.html` builds its
  previous assessments from the demo and the frozen files).

### The requirements specification as a file of its own (phase 6b, built Nov 2026)

The full report keeps the cyber security requirements specification as it
was (one report stays the owner's decision); for a client who issues the
specification on its own, it is also a third Word document,
`<name>-cyber-security-requirements-specification.docx`, from the same
builder (`buildWordDoc(p, { spec: true })`) and the same section functions,
so no text is written twice. The schema does not move.

- **What it holds.** The house cover, kicker OT CYBER SECURITY ("Cyber
  Security / Requirements Specification"; the Report Review Tool reads the
  cover by its kicker, and with no front matter a specification's title
  gives it), document control, a short opening on the same page as what
  follows (About this specification: what it is, what it sets out, where the
  criteria and the approvals are), then the detailed report's System under
  consideration and requirements section as it is (step 6's blocks in its
  order, the drawing's page and the asset register included), its SL-T
  table with the safety floor sentence and each justification (not the
  driving scenarios, which name threats it does not hold), then the
  mandatory security countermeasures (the 3-2 fixes: by the house reading,
  each one the decisions to reduce a risk or to treat it through the SL-T
  programme rest on, in place or planned, with its zone or conduit, owner
  and due date and SR references), the sign-off with the signature table
  ("An approval covers the tolerable risk, the zones and conduits, the
  target security levels and the mandatory security countermeasures in this
  specification"), method and limitations (its
  ratings sentence says the targets rest on risk ratings), and the risk
  criteria appendix (its tolerable line says only where the line is; a risk,
  not a threat or system, takes the worst of its categories). None of the
  reports' own sections: summary, scorecard, basis, ranking, comparison,
  register, treatment plan, accepted risks, threat detail. The footer reads
  "Cyber Security Requirements Specification".
- **Readiness.** Check and issue has a third card, Cyber security
  requirements specification, and a third download (its toast:
  "Requirements specification downloaded."). Its items come from the one
  completeness list: each item that concerns what it prints is marked
  (`spec: true`): the SUC and the risk criteria, step 3 (zones, conduits,
  separations), step 6's blocks, the SL-T and their justifications, and the
  sign-off once there are zones (an approval older than a change only when
  the tolerable risk or the SL-T moved: `APPROVAL_DOC_PARTS.spec`). One item
  is the specification's alone (`doc` null): a justification that names a
  threat or countermeasure of the project by its id, which the
  specification does not list ("Z1 Unit 300 BPCS: the justification names
  T1, T2, which the specification does not list."). `Engine.readiness(p,
  "spec")` reads them; the download asks the same question as the reports.
  On a high-level-only assessment the card is set aside like the detailed
  report's. The demo's justifications name no id, so it stays at nothing open.
- **Report page.** A third tab, Specification, in Sections and Word pages
  (the Summary view stays the two reports'; the document chosen is kept
  apart from the summary shown, so the specification is still chosen after
  a visit to Summary). Its overrides are a store of their own,
  `reportCustom.spec`, which the migration keeps: the same section key in
  the detailed report and the specification is two sections, one per
  document, as review anchors carry the document too.
- **Review pack.** The specification is the third document, after the two
  reports, whenever the detailed report is packed (so not with no zones or
  conduits). A comment on it goes to its tab and accepts into its store.
  Packs and review files of two documents still import (a comment finds its
  report by title, else by place). A round of two documents approved before
  the specification was packed is lined up with today's documents by title,
  and the specification, which it did not hold, is not read as a change; any
  other difference still is. Once the specification's own sections are
  edited (`reportCustom.spec`) with no approved round holding it, Peer
  review and Check and issue say so plainly: "The cyber security
  requirements specification has not been reviewed in an approved round."
- **Word baseline.** `scripts/risk-word-baseline.js` has a third array,
  `spec`; `scripts/test-risk-sections.html` pins it and checks that its
  requirements section and justifications are the detailed report's line for
  line. `scripts/test-risk-specfile.html` covers the rest.

### Consequence first (built Nov 2026)

A workshop can start from what could happen and work back to the threat
scenarios that could cause it, as in a cyber PHA or consequence-driven
cyber-informed engineering. The screen draws each consequence as a bow-tie:
the scenarios on the left, the consequence on the right. The record is still
kept threat by zone and conduit, as the rest of step 5 is.

The schema stays `spt-risk-project/0.3`. Every new field is optional. The
migration tidies a field when it is present and never adds one, so a file
without them behaves and prints exactly as before.
`scripts/test-risk-consequence.html` proves this against the v0.7.0 SL-T
suggestions and Word text, frozen in `scripts/fixtures/slt-suggestions-v0.7.0.js`
and `word-v0.7.0.js`.

- **Data.**
  - `project.consequences` is `[{ id ("K1"...), title, description, impact,
    impactByCategory, source, hlaIds, notes }]`. Ids come from
    `counters.consequence`, which stays above every K id and is absent until
    the first consequence.
  - A consequence's impact follows its worst category by the same rules as a
    threat's. It is never lowered while a rating no longer fits the criteria;
    the misfit shows as open on step 5, and a change of criteria moves and
    counts these ratings too.
  - A threat gains `consequenceId` and `via`. `via` lists, in order, the zones
    and conduits the scenario passes through before it acts in its own. It
    never holds EXT (the entry point covers that) or the threat's own zone or
    conduit.
  - A scenario linked to a consequence is still an ordinary threat. Every
    rating, decision and output is the threat's own.
  - The prune drops a `consequenceId` or `via` id that points at nothing, and a
    ranked system that has gone from a consequence. Removing a conduit prunes
    too.
  - The released v0.7.0 normaliser keeps all of these fields
    (`scripts/fixtures/v0.7.0-migrate.js`).
- **Step 5, By consequence** (`js/ui-consequence.js`). The tab sits beside By
  zone; the tab order is `TAB_ORDER` in `js/ui-risk.js`.
  - Each consequence is a card headed by its id and title. The left side is a
    table, "Scenarios leading to K1", with the zone or conduit, passes
    through, threat source, entry point, unmitigated risk and treatment
    decision, plus Open (in By zone) and Unlink. The right side shows the
    impact by category, source and ranked systems, with Edit and Remove. The
    title field shows only while editing.
  - Below about 1400 px the two sides stack, the consequence first, and the
    table scrolls sideways.
  - + Add consequence. + Add scenario asks for the zone or conduit, passes
    through, statement, threat source, entry point, assets and
    vulnerabilities. It creates a threat there with the consequence's impact
    and categories copied in. The affected FRs and the threat's own
    consequence text are left for the consultant.
  - From library turns house scenarios into scenarios for this consequence,
    using the picker in `js/ui-library.js`. Link adds an existing threat and
    keeps its own rating. When the threat led elsewhere, the toast says "T2
    now leads to K1, not K2."
  - A scenario whose impact differs from its consequence's says so ("Impact
    lower than K1 (Severe)"). Nothing is corrected silently.
  - Changing a consequence's impact offers to update the scenarios still on
    the old rating ("T1 and T9 are still rated Serious.", with Update, Leave
    as they are, and Undo). The offer sits after the impact controls and is
    announced as a polite status. A scenario counts as still on the old
    rating when its own category ratings match what the consequence had when
    editing began or when its impact last moved, or when it has no category
    ratings and its impact is the old one. A scenario rated on categories of
    its own is never overwritten.
  - There is no offer when the new impact is blank. The offer is checked
    against the project each time it is drawn or used, and is dropped on
    undo or when the page is left.
  - Unlink, Remove (the threats stay), Add scenario and the library all offer
    Undo. After a scenario is opened in By zone and the user comes back to
    this tab, that row's Open button has the keyboard.
- **Elsewhere in the tool.**
  - By zone's editor has Leads to, with an Open K1 link, and Passes through.
    Passes through shows once the project has a consequence or the threat a
    route. Its chips read "Z7 Utilities", with long names cut short.
  - The register has a Consequence filter once there is a consequence, and a
    Leads to column once there is a consequence or a route. A route with no
    consequence reads "Through Z4".
  - Step 2's Start from this consequence creates one from a ranked system's
    impact, categories and source, linked to that system. The title and
    description are left for the consultant. "In K1, K2 and K3" names the
    consequences that already cover the system.
  - Go to a consequence opens its card. Duplicate and Copy to keep the
    consequence and the route; Copy to drops the route when it would pass
    through the destination itself. Move keeps both, and the prune drops a
    route step that is now where the threat acts.
- **Zones and conduits on a route.** A zone or conduit that a scenario passes
  through but that has no threats of its own is flagged "On the route to K1"
  ("On a scenario's route" without a consequence). The flag shows on the
  step 5 rail, the zone's panel and step 3's tables, and as a pill in the
  scenario table.
- **SL-T house method for a route.** A scenario's unmitigated risk also
  suggests an SL-T for each zone or conduit it passes through, on the FRs it
  affects, with or without a consequence. It uses the same mapping as a
  zone's own threats, including the SL4 escalation note at Very high. It is a
  suggestion only, and it is always labelled as the house method: in the Why
  trace, on About, in the Word appendix and driving scenarios lead-in, and on
  the Criteria sheet. Each step of the route is checked against the
  conduits: two zones in a row that no conduit joins, or a zone beside a
  conduit that does not join it, warn (`Engine.routeBreaks`). A zone or
  conduit grouped with the one that holds its threat scenarios is no
  stepping stone. Driving scenarios name the route ("T1 through Z3 and C2 to K1
  (High)"). The specification prints no suggestions, so it leaves the method
  out.
- **Completeness** (warns only).
  - A consequence with no title ("K4: no title.").
  - A consequence that no threat scenario leads to.
  - A threat that leads to a consequence but has no threat source or entry
    point. Other threats keep the existing minimum.
  - There is no rule on the route.
- **Deliverables.**
  - The full Word report has "Consequences and how they could arise" after
    the risk register, on its landscape page, only when there are
    consequences. Its lead-in says what Risk today means. Each consequence
    gets an impact line ("Impact: Severe. By category: Safety (injury / loss
    of life) Severe; ..."), its source and ranked systems by name, its
    description, then a table of its scenarios: scenario, zone or conduit,
    passes through, threat source, entry point, unmitigated, risk today and
    treatment decision. A closing line names any scenario with a lower or
    higher impact ("T1 and T9 have a lower impact than K1.").
  - The register gains a Leads to column, and a threat's detail gains Leads
    to and Passes through rows, when used. The specification and the
    high-level report carry none of this.
  - Excel has a Consequences sheet after the threat register, one row per
    scenario. A consequence with none shows "None recorded" in the Scenario
    column. The threat register gains a Leads to column when used.
  - The review pack has Leads to and Passes through detail rows, each on its
    own.
  - Routes read as "and" lists everywhere ("Z3 and C2").
  - The risk context (still 1.4, provenance only) carries each threat's
    `consequenceId` and `via` (only ids still in the project) and a top-level
    `consequences` list (`id`, `title`, `impact`), each only when recorded.
  - The comparison with a previous assessment reports consequences added,
    removed, renumbered, renamed or with a changed impact, and a threat whose
    consequence changed. The previous consequence is shown in today's
    numbering.
  - A category rated only on a consequence counts as rated on step 1.
- **The demo.**
  - K1, an HF acid release, is Severe on safety, environment and production
    and Serious on regulatory. T1 passes through Z3 and C2, T4 through Z4
    and T9 through Z3.
  - K2, an unplanned shutdown, comes from an interview with the asset owner.
    T2 passes through Z4; T7 acts directly.
  - K3, loss of view, has T3.
  - Z3's and Z4's justifications say why IAC stays at SL2 although the routes
    through them suggest SL3. Z4's assumptions note that the engineering VLAN
    and the keyed SIS connection are not modelled as conduits.

## Report page

The Report page has three views, Sections, Word pages and Summary, over both
reports, Detailed and High level, and in Sections and Word pages the
requirements specification as well (phase 6b); the report chosen stays chosen when the view
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

The pack's threat items carry, as read-only detail rows, the current and planned likelihood × impact where rated, the plan of each planned countermeasure a confirmed decision rests on (owner, priority, due date, status) and who accepted a risk (with role, date and review date), or for a transfer how, to whom and who agreed it (rows Transferred and Transfer agreed by); the answer's "residual" is the planned rating, else the current one. The item fields, the status words and the priority convention (the confirmed, complete decision in the words the report prints, else empty, which the Report Review Tool's risk-no-disposition check reads) are unchanged. Each zone's and conduit's SL-T item opens its detail rows with its Assessment depth (Detailed, Grouped with Z3, Reused from its source, Proportionate with the threats considered, or Deferred with its reason).

The Peer review page sends both Word reports (and, since phase 6b, the requirements specification) for review as a pack, and imports the review files that come back: comments with severity, status and replies, on a page of their own. A suggestion on a section's heading or opening wording can be accepted into that report's overrides, rebuilt to check it is really in Word, and undone if not; other text is Copy and Go to, with the reason, and Go to reaches the section on the Report page. See `docs/report-review.md` at the repository root. An accepted change can be undone from the comment. Go to on a threat, or on a zone's target levels, scrolls to it and highlights it. With no zones or conduits the pack holds only the high-level report. Send for review can carry a note and a needed-by date for the reviewers. The review is saved in the project file (`project.review`) and never reaches the Word report, the Excel workbook or the risk context file.

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

The detailed tier is done per zone and per conduit. The standard compares the
SUC's initial risk with tolerable risk once (ZCR 4) and, above it, assesses
every zone and conduit; the depth of each is the consultant's, and suggesting
it from the zone's own initial risk is the house method. From the ranking, Assign to zone puts a ranked system in a zone (an
existing one or a new one named after it); the zone's initial risk on the
comparison is the worst of its systems. No threat is seeded.

## Workflow (IEC 62443-3-2:2020)

The standard's zone and conduit requirements (ZCR) are held in
`data/zcr-map.json`: every ZCR id, its title and its clause number, with a
note of what was checked against the published contents list and what is a
house reading. That file is the only place a clause number is written. Each
workflow page shows its ZCR once, in its sub-title, read from the lookup;
fields, hints and warnings carry no standard references, and the Word and
Excel deliverables carry no clause numbers: they name the standard, and the
method text names the edition. The workflow follows the order of the
published standard and has a step for each of ZCR 1 to ZCR 7.

Terms follow the 2020 edition: SUC, cyber security requirements
specification, countermeasure. The first tier keeps the house name high-level
risk assessment for the standard's initial cyber security risk assessment,
the step before the detailed one. Unmitigated risk is
the risk before any cyber security countermeasure is considered: countermeasures
built into the control system components, and protection that is not cyber
security such as controlled site access, hardwired interlocks and relief
devices, still count. Residual risk is what
remains with the countermeasures in place (the current rating), and again once
the planned ones are added (the planned rating).

1. **Scope and risk criteria (ZCR 1):** name, description, scope and
   boundary, and operating-environment assumptions; and the risk criteria:
   tolerable risk, confirmed with the asset owner, whether the client's own
   risk matrix is in use, and the project's own matrix, scales and
   consequence categories, editable beside them.
2. **High-level risk (ZCR 2):** the asset and system
   risk ranking (impact, optionally per consequence category and with its source, × likelihood → risk band on the project's criteria), which frames the
   zoning and is the high-level deliverable, the assumed adversary class, and
   the threats and requirements card (known and presumed threats, security
   functions that must be kept). Assign to zone
   puts a ranked system in a zone, and "High-level report →" opens the
   standalone report.
3. **Zones and conduits (ZCR 3):** the drawing, the zones and conduits
   tables and one of them in a detail panel with its characteristics, and the
   separation rows the data raises (see Pages and steps above).
4. **Risk comparison (ZCR 4):** the SUC's initial risk against tolerable
   risk, once, and whether a detailed risk assessment is required; then, as
   the house method, each zone's and conduit's own initial risk suggesting
   its depth (see Pages and steps above).
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
   accepted it, their role, the date and a review date; transfer, recording
   how the consequence is passed to another party (insurance, or a contract),
   to whom, and who agreed it with their role, the date and a review date (the
   rating does not change: a transfer moves who bears the consequence, not its
   likelihood or impact); or treat through the SL-T, the house option of
   mitigating through the SL-T programme, where the target is the
   treatment plan and capability is built through the 3-3 programme, so an
   empty countermeasure register is a legitimate position in less mature
   environments. Nothing is inferred: a countermeasure or an SL-T alone
   decides nothing. A file saved by an older build loads with what that build
   inferred shown as a suggestion, confirmed one at a time or per zone with
   Confirm suggested. An unconfirmed suggestion prints and exports as no
   decision. A confirmed decision that lacks what it rests on (reduce with no
   countermeasure on a requirement the threat affects, accept with no reason
   or no record of who accepted it,
   a transfer with no record of how, to whom or who agreed it,
   the SL-T with none set or one below the suggestion and no reason) is not
   a treatment yet: the reports print it as a prompt saying what is missing,
   it is left out of the summary's counts, the risk context exports no
   disposition for it and the review pack leaves its treatment decision
   empty. "Reduced to within tolerable risk" needs a linked countermeasure
   already in place and a tolerable rating it rests on (see File format 0.3).
   A transfer is stored as an acceptance marked as one (`treatment.transfer:
   true` on decision `accept`, how in `acceptance`, to whom in `transferTo`,
   who agreed it in `acceptanceDetail`), so the released v0.7.0 keeps it and
   shows it as a risk accepted whose reason is the arrangement. The risk
   context writes it as disposition `accepted`, the legacy value, with
   `decision: "transfer"` and `transferTo` beside it as provenance (on the
   same `spt-risk-context/1.4` string). The approval covers the transferred
   risks with the accepted ones.
6. **Detailed risk, SL-T strip and SL-T grid tab (ZCR 5.6):** SL-T is a vector, one target per foundational
   requirement (IAC/UC/SI/DC/RDF/TRE/RA), which is a house reading.
   Each FR's suggestion comes from the worst unmitigated risk affecting it and
   is shown with a full rule trace. The consultant sets the final per-FR SL-T
   and a mandatory justification, which is the deliverable.
7. **Requirements specification (ZCR 6):** the nine blocks, assembled from
   the steps, with the organisational policies and regulatory requirements
   entered there.
8. **Approval (ZCR 7):** what is approved, and the approvers with their
   scope; the first approver is the sign-off the reports and the risk
   context have always carried.

There are two reports. The *High-level report* is the standalone high-level risk assessment
(system under consideration, basis of assessment, ranked systems). The
*Detailed report* covers the per-FR SL-T vectors, zones, threats and the
drawing. The cyber security requirements specification can also be issued
as a file of its own (phase 6b, above). All are on the Report page; Check and issue holds their readiness
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
  before any cyber security countermeasure, how many are within it today and how many will
  be once the planned countermeasures are complete; one more: the treatment
  decisions that stand and how many existing and planned countermeasures the
  register holds, each count of none left out; and a table of the threats
  above tolerable risk today, at most five, with their three ratings, a
  rating not given carrying the one before it) and the decisions required
  (threats with no decision or an incomplete one, in red; accepted or
  transferred risks no
  approver has signed; planned countermeasures with no owner or due date, or
  only proposed; or that nothing is waiting). Then why the assessment was
  done, what the report is (the SUC compared with the tolerable risk in one
  line of outcome; the full statement and the depth table are under Risk
  comparison, and Method and limitations refers back to it in one sentence,
  with any deferral said there once), the evidence base, findings (an accepted or
  transferred risk is
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
  high-level risk ranking, the risk comparison (the SUC's initial risk
  against tolerable risk, then How each zone and conduit was assessed: each
  one's initial risk, its depth and what the depth rests on, with the house
  method named; a deferred one is said as a limitation once, under Method
  and limitations, and its SL-T rows read Deferred, no SL-T yet);
- on landscape pages of their own (Word sections, cut by the key of each
  level 1 heading after the section overrides, so a renamed or hidden
  section still lands right): the risk register (every scenario, its zone or
  conduit, the unmitigated, current and planned ratings with their likelihood
  and impact, and the treatment decision; a current or planned rating not
  given is blank), the treatment plan (the additional countermeasures by
  priority then due date, each with its owner, priority, due date, status,
  the scenarios it addresses and its SR references; a field not given reads
  Not assigned, Not set or None linked), the accepted risks (scenario,
  rating that stands, reason, accepted by, role, date and review date; Not
  recorded where not given) and, only when there is one, the transferred
  risks (scenario, risk today with no planned countermeasure applied, as a
  transfer does not change the risk, how it is transferred, to whom, agreed
  by, role, date and review date);
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
  limitations, and an appendix of the risk criteria in use (the matrix with
  the cells above tolerable risk bordered, the scales, the consequence
  categories where used, the house summary of the security levels and the
  FR key), labelled as the house's, the client's or agreed for this
  assessment. Where the client's own criteria are marked in use but step 1
  still holds the house's, the appendix says the tables are for reference,
  with a red note asking the consultant to relate the ratings to the
  client's (see Risk criteria and impact per category).

The high-level Word report is a ranking-only version with its own scorecard,
downloaded as `<name>-high-level-risk-assessment.docx`. It has the criteria
appendix (no FR key) and the signature table too, and on a high-level-only
assessment its ranking carries the comparison decision as a column. New
headings have section keys of their own; existing ones keep theirs.

The Excel workbook is the register and treatment plan issued from the tool,
one way: the tool holds the owner, date and status, and the Front sheet's
last row says a new issue replaces the workbook and changes are made in the
tool. Its sheets are Front, Summary, Ranking, Threat register, Treatment
plan, Accepted risks, Vulnerabilities, Zones, Conduits, Assets, Countermeasures,
SL-T, Criteria and Basis (the eight it had keep their names and order), with
Transferred risks after Accepted risks only when there is one (its rating
column is Risk today, as in Word), and
Changes after the Summary when a previous assessment is set (phase 6a). The
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
characteristics and how each was assessed (Assessment depth and Basis); a
high-level-only assessment's Ranking sheet ends with its decision. An incomplete assessment asks in the page before
generating (Generate anyway), with the same check as the risk-context export;
the high-level report is checked against its own part of the list.

### Demo

`tour.html` redirects to `index.html?tour`, which loads a completed demo
assessment (`data/tour-project.js`, Acme Petrochemicals Unit 300); Home's Open
the demo loads it in the running tool. Autosave is switched off in the demo,
so real unsaved work can never be touched. The demo is a full assessment with
every step Done; its SUC is above tolerable risk, so every zone and conduit is
assessed: the zones and C2 in detail, C1 grouped with Z3, C4 with Z4 and C5
with Z2, whose threats they share, and C3 as a proportionate review with the
threats considered noted.
Its zones carry their
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
Z3. Since phase 5 it keeps the house criteria (so the Word baseline stays
meaningful), and T1, T4 and T6 give their impact per consequence category
(each impact the worst of them), and A1 and A2 the source of their
consequence (a HAZOP revalidation, a LOPA and SIL determination). It is worked consequence first too:
K1 (an HF acid release), K2 (an unplanned shutdown) and K3 (loss of view),
each with the threat scenarios that lead to it (see Consequence first). The
routes through Z3 and Z4 raise their suggested IAC to SL3 by the house
method. Their SL-T stays at SL2, and Z3's and Z4's justifications say why.
Since the 3-2 fixes its threat environment names four sources of threat
intelligence and two emerging threats, its conduits carry a zone's
characteristics (accountable organisation, logical and physical boundary,
access points, data flows, dependencies, policies, assumptions), every zone
and conduit lists its applicable security requirements, and the ranking
notes say A1 to A4 are assessed in detail; A5 and A6 are marked outside the
SUC.
Every asset carries a classification and a business value, so the report
prints an asset register. T2's lost production is transferred through the
group's business interruption insurance, reviewed at each policy renewal and
agreed by the group insurance manager, whose interview is in the basis of
assessment (I5), and every acceptance records who accepted it. The approvals
were retaken for the transfer and again when its cover was reworded.
Since the 3-2 fixes' step 5 the engineering VLAN (C4, Z4 to Z1) and the
keyed SIS connection (C5, Z4 to Z2) are conduits, and T2 and T4 pass
through them; every zone and conduit has a target on every foundational
requirement (C1's justification now matches its SL3 targets) and its
characteristics in full, each asset with a criticality; T4's remaining risk
is accepted by the asset owner, so M4 and M8 are mandatory; the SUC lists
its access points; each organisational policy says what implements it; the
basis records three risk assessment sessions; and the second approver is
the operations manager accountable for the unit (D. Hargreaves). The
approvals were retaken on the `a3-` fingerprint.
`scripts/test-tour-risk.html` holds it to zero completeness problems and
its approvals to Unchanged since approval.

## What the tool does and does not claim

- The workflow follows the order of the published IEC 62443-3-2:2020 and
  covers ZCR 1 to ZCR 7 (the About page says the same, built from the
  lookup). The ZCR ids, titles and clause numbers in `data/zcr-map.json`
  were checked against its contents list (13 Nov 2026), and the requirement
  wording of clauses 3 and 4 and the annexes against the published edition
  (26 Nov 2026), with the tool brought into line. The points listed as a
  house reading in that file are the tool's interpretation, not claims
  about the standard. The tool was first built from a 2013 working draft; its
  clause numbers and terms have been removed. Verbatim normative text and the
  standard's own example risk tables are not reproduced, because they belong
  to the licence holder.
- The risk matrix, likelihood scale and risk-to-SL mapping are SolutionsPT house
  defaults. 62443-3-2 prescribes no matrix and no method for setting an
  SL-T. The tool
  always shows the rule trace, and the consultant's per-FR SL-T and written
  justification are the deliverable. A client's own corporate matrix takes
  precedence: enter it on step 1 (levels, definitions and matrix, mapped onto
  the four bands), and the reports print it as the client's. The generic
  presets are the tool's own shapes, not the standard's example matrices.

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
js/assets.js                       the asset register without the page: every asset with
                                   its zone, a move, and a paste read (Excel quoting,
                                   headers, mapping, preview, apply)
js/compare.js                      a previous assessment frozen as the baseline, and
                                   what changed since, in words and as rows
js/ui-kit.js                       h(), toast, theme, cards, fields, register table
js/app.js                          state, autosave, Save/Load, the sidebar (page ids,
                                   status per step), the render loop and the old page
                                   ids, Go to, Open the demo, header buttons; boot()
                                   publishes window.RiskTool
js/ui-stages.js                    Home, steps 1, 2 and 4 (with the risk comparison
                                   and Assign to zone) and Engagement and evidence
js/ui-criteria.js                  step 1's risk criteria editor: the matrix, presets
                                   and where ratings go, levels and categories
js/ui-library.js                   step 5's Add from library picker over the house
                                   scenario library, and step 2's Send to step 5
js/ui-consequence.js               step 5's By consequence tab: each consequence as a
                                   bow-tie with the scenarios that lead to it, and step
                                   2's Start from this consequence
js/ui-risk.js                      step 5: the zone workshop (rail, SL-T strip, scenario
                                   table and editor), Register, Heat map, SL-T grid
js/ui-zones.js                     step 3: its tabs, drawing, tables, detail panel, paste,
                                   separation rows
js/ui-assets.js                    step 3's Asset register tab and its Paste from Excel
js/ui-spec.js                      steps 6 and 7: the specification and the approvals
js/ui-reports.js                   the Report page's views and summaries, Check and
                                   issue (with Since the previous assessment), the
                                   Generate anyway panel, downloads
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
data/scenario-library.json         the house scenario library (33 scenarios, no ratings,
                                   SR ids only) + generated .js
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
scripts/test-risk-criteria.html    phase 5a: files without criteria unchanged (fixtures,
                                   demo), presets, step 1's editor, a cell moving every
                                   output, ratings mapped or left open, tolerable risk
                                   per category, the client's criteria, impact per
                                   category and consequence source, the migration
scripts/test-risk-drawing.html     phase 5b: the drawing with no level as phase 5a drew it
                                   (frozen layout), bands, the nudge, conduit notes, the
                                   legend, click-through, Word's drawing page (picture,
                                   key and legend tables, portrait when tall, print scale)
scripts/test-risk-floor.html       phase 5b: the safety floor list, old files unchanged,
                                   narrowing in every output, the chips
scripts/test-risk-library.html     phase 5b: the library's data, Add from library, what
                                   prints, Send to step 5
scripts/test-risk-assets.html      phase 6a: the paste read (quoting, line endings, headers,
                                   mapping), the preview's problems, Update existing, one
                                   undo; the register's sort, filters, edits and moves; Word's
                                   asset tables and the Assets sheet
scripts/test-risk-consequence.html consequence first: the data, migration and prune, the
                                   v0.7.0 normaliser, By consequence, Leads to and Passes
                                   through, the register, zones and conduits on a route,
                                   the SL-T house method (same as v0.7.0 without a route),
                                   completeness and outputs
scripts/test-risk-depth.html       every zone and conduit assessed, at a depth: the SUC's one
                                   comparison, the depth record, migration and prune, the
                                   v0.7.0 normaliser, no field as before, grouped suggestions,
                                   completeness per depth, steps 4 and 5 (focus, Undo), Word,
                                   the specification, Excel, the risk context, the review
                                   pack and the comparison with a previous assessment
scripts/test-risk-transfer.html    transfer as a fourth decision: the stored shape, migration,
                                   the v0.7.0 normaliser, the rating unchanged, completeness,
                                   the risk context, the approval, the comparison, Word, Excel,
                                   the review pack and its check, the decision control
scripts/test-risk-zcr2.html        the 3-2 fixes, step 2: unmitigated, the ZCR 3.2 departure,
                                   the threat environment, conduit and asset characteristics,
                                   the mandatory countermeasures, vulnerabilities, the method
                                   said once, the approval's scope
scripts/test-risk-zcr3.html        the 3-2 fixes, step 3: the Accepted by warning, and the demo's
                                   transfer and asset classification and business value
scripts/test-risk-zcr4.html        the 3-2 fixes, step 4: a transfer rated today in Word and
                                   Excel (an acceptance keeps its rule), the demo's cover not
                                   resting on M3, and the insurance manager's interview
scripts/test-risk-zcr5.html        the 3-2 fixes, step 5: partial SL-T, ZCR 3.3, reduce and the
                                   remaining risk accepted, the a3 fingerprint, characteristics,
                                   routes and the demo's C4 and C5, inside the SUC, sessions,
                                   classification, policies, SUC access points, mandatory
                                   countermeasures, wording, older files, the demo's approvers
scripts/demo-before-step5.js       the demo as step 4 left it, for pages written against it
scripts/test-risk-compare.html     phase 6a: the baseline from the demo and the frozen files,
                                   every kind of change, numbered again, criteria changed, an
                                   empty baseline, the card, the Word section, the Changes sheet
scripts/test-risk-specfile.html    phase 6b: the requirements specification as a file of its
                                   own: its readiness from the one list, its download, its
                                   tab and store, the pack's third document, a round of two
scripts/test-risk-undo.html        phase 5b: undo of each destructive and bulk action,
                                   Ctrl+Z and text fields, one level, focus, autosave, Load, New
scripts/test-risk-p5fix.html       the phase 5 review's fixes: Leave as it is, the cap at
                                   the rating's own impact, preset defaults (no band drops),
                                   ids not reused, no Undo for no change, per-category heat
                                   maps, review pack and SL-T trace, the fingerprint, matrix
                                   gaps, the generic preset, the toast, the editor's focus
                                   and names, Escape, the picker, the library's content
scripts/test-risk-nav.html         the sidebar and step status, Home, Assign to zone, the
                                   risk comparison, Check and issue and its links, the
                                   Generate anyway panel, old page ids, lastStage, Open
                                   the demo, and a file with the new fields in v0.7
scripts/fixtures/                  frozen files: the tour as v0.7 saved it, the tour as
                                   phase 3 saved it (0.2), a hand-made 0.1 file, the
                                   released v0.7 normaliser, the phase 5a drawing
                                   layout, and from the v0.7.0 release its migrate.js,
                                   its SL-T suggestions and its Word text; never edited
                                   or regenerated
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
- Phase 6 adds provenance on the same `spt-risk-context/1.4` string (the
  released v0.7 Assessment Tool refuses any schema it does not list, so the
  string stays): each zone and conduit carries `riskComparison` `{ required,
  reason }` (written until the depth replaced the per-zone decision; this
  build writes `assessment` `{ depth, withId, reuseSource, considered,
  reason }` instead, depth always, the rest only when recorded) and `initialRisk` `{ risk, source }` (`systems`, `entered`, or
  `zones` for a conduit under the house rule); each asset carries `id`, `tag`,
  `vendor`, `model`, `version` and `criticality` beside `name` and `type`; and
  a top-level `approvals` list (`name`, `role`, `organisation`, `date`,
  `scope`, given approvals only) sits beside the single `approval` mirror.
  Consequence first adds, on the same string, each threat's `consequenceId`
  and `via` and a top-level `consequences` list (`id`, `title`, `impact`),
  only when recorded; the Assessment Tool keeps none of it.
  A transferred risk (the 3-2 fixes) is written with the legacy disposition
  `accepted`, how it is transferred in `acceptance`, and `decision:
  "transfer"` and `transferTo` beside them, only for a complete transfer;
  the released v0.7 importer keeps the threat whole and reads it as an
  accepted risk whose acceptance is the arrangement.
  Each field is written only when it holds something. The Assessment Tool
  keeps `approvals` with the zones and conduits it already kept, and shows
  none of it. `scripts/test-risk-interchange.html` checks the demo export
  against the contract and against the Assessment Tool's copy of it
  (`modules/assessments/scripts/fixtures/risk-context-demo.js`; regenerate
  that copy when the demo or the export changes on purpose), and the
  Assessment Tool's `test-risk-context-phase6.html` imports it, the v0.7
  export, and runs the frozen v0.7 importer on it.

## Tests

From the repository root:

```
.\tools\run-tests.ps1 -Module risk-assessment
```

That runs every `scripts/test-*.html` page in headless Edge (each loads
index.html in an iframe and prints PASS/FAIL lines plus `ALL TESTS PASSED`)
and writes each page's output to `test-results\risk-assessment\`. Each page
pins today (`RiskTool.setToday("2026-11-14")`) as soon as it has the app, so
what it builds from the demo (Word, Excel, the screen, the risk context) does
not change with the real date: the demo's accepted risk T8 has a review date,
and a date past it adds a line under Decisions required. The Word builder's
`opts.today` still wins over the pin; `setToday(null)` is the clock again. To run one
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
