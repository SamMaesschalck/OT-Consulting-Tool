# Risk tool redesign: recommended plan (revised after review)

Base: the incremental sequencing (honest fixes first, additive model, stage ids kept), with the seven-step navigation, zone workshop, register, heat map and scenario library added later. Points checked in the code:

- **Null `slTarget` is safe.** The importer tests `typeof z.slTarget === "number"` (`modules/assessments/js/engine.js:863`, `ui.js:5923`, `6020`). A zone with a null scalar and an empty vector is created with no pre-set target.
- **Additive fields survive old builds; a new schema string does not.** `normaliseProject` keeps unknown keys, and `loadProjectText` and autosave restore refuse any schema not on the list (`modules/risk-assessment/index.html:662`, `2032`). Old builds do not maintain new fields, so the new build must prune dangling ids on load.
- **The "SIS present" tick is live.** It drives the SL3 floor and the exported `safetyRelated`, which the Assessment Tool consumes (`index.html:732`, `1594`). The other ticks only add trace text.
- **Disposition is pinned in four places:** the engine, `js/review.js:135-151` (pack `priority`), the Report Review Tool check `risk-no-disposition` (`modules/report-review/js/checks.js:40`, `338-343`) and `scripts/test-risk-tool.html:136-160`. Changing it is never a risk-tool-only change.

Everything said about the standard is from memory and is listed in the last section.

## What is wrong today

**Standard alignment**
- Clause citations ("Â§4.1" to "Â§4.7") follow a working draft and are probably one behind the published edition. About 70 sit in the UI and 9 print in Word (cover, a heading, a tile, the sign-off).
- There is no risk comparison step (ZCR 4). "Detail" is offered on every ranked system and no decision is recorded.
- The detailed assessment is compressed. One residual rating stands for both "today with existing controls" and "after planned measures".
- The ZCR 3 separation rules are a sentence in a sub-title. Apart from "SIS present", the exposure ticks change nothing.

**Workflow**
- Disposition is inferred. One untagged countermeasure, or any SL-T at all, marks every over-tolerable threat as addressed, and the report prints that as fact.
- "Detail" creates one zone per system, seeds a placeholder threat and skips the zoning page.
- Detailed risk and SL-T are flat pages of fully expanded cards. Twelve zones and ten conduits means about 154 clicks on SL-T alone. There is no register, heat map, copy, move or bulk accept.
- Completeness shows only on one report page and in a browser confirm, with no links. Conduits with no threats are never reported. Reports have five overlapping nav entries.
- Load always returns to step 1, and tolerable risk silently defaults to Medium.

**Realism**
- The risk matrix is one fixed house file. "Client matrix in use" is a tick box and the report still prints house bands.
- A threat has one impact value. The consequence categories in the rules file are loaded and never used.
- An unconfirmed house suggestion can be exported as the zone's SL-T. The safety floor puts SL3 on all seven requirements.

**Outputs**
- The Word report is not a requirements specification. Access points, dependencies, policies and conduit notes are captured and never printed. The matrix and scales are never printed. There is no treatment plan. Raw flag and asset-type ids, capitals for emphasis and dash placeholders leak into deliverables.
- The Excel tracker's owner and date columns are exported blank, and a regenerated workbook overwrites anything the client typed.

## The redesigned workflow

Seven numbered steps in plain words, each with its ZCR as a quiet reference in the page sub-title, read from one lookup (`data/zcr-map.json` plus its generated `.js` twin, since the folder app cannot fetch JSON). Clause numbers leave the UI and deliverables. Existing stage ids stay reachable: `suc`, `srs`, `zones`, `risk`, `slt`, `basis`, `report`, `review`, `peer`, `about`; `hlreport` and `wordpreview` become aliases of `report`. The nav shows status per step from one structured completeness list.

**Home.** Steps with status, "Open the demo", and a choice of high-level assessment only or full assessment. Load reopens the last step used.

**Engagement and evidence** (`basis`, moved first; no ZCR). Unchanged content.

**1 Scope and risk criteria** (`suc`; ZCR 1, inputs to ZCR 6).
- Consultant: describes the system under consideration, assumptions and organisational policies, and confirms the risk criteria and tolerable risk with the asset owner (a confirmed marker replaces the silent default).
- Tool: the matrix, scale definitions and tolerable line beside the form. Read-only house matrix at first; an editable per-project copy later.

**2 High-level risk** (`srs`; ZCR 2).
- Consultant: rates worst-case consequence per system with its source (HAZOP, business impact); likelihood is optional. Records threat environment and adversary assumption.
- Tool: the ranking, each row marked against tolerable risk. For a high-level-only job the comparison decision is a column here. "Assign to zone" (existing or new) replaces "Detail", lands on step 3 and seeds no threat. Known threats can be sent to step 5 as draft scenarios.

**3 Zones and conduits** (`zones`; ZCR 3).
- Consultant: sketches the partition, pastes assets several at a time, adds conduits, and answers only the separation rows the tool has raised: met, or not separated with a reason.
- Tool: drawing on top, compact zones and conduits tables, one selected item in a detail panel with a collapsed characteristics section. A separation row is raised when the data shows a mix (a safety controller beside other controllers, a wireless asset, a conduit to an external party); rows not raised stay quiet and are not counted as open. The safety designation stays a zone field and keeps driving `safetyRelated`.

**4 Risk comparison** (new `compare`; ZCR 4).
- Consultant: confirms per zone and conduit whether a detailed assessment is required, with a reason when overriding.
- Tool: one table of initial risk against tolerable risk, decision defaulted. Initial risk is the worst of the zone's assigned systems, or entered directly when the zone was drawn without a ranking. "Not required" skips step 5; the SL-T is then set by hand with its basis in the justification, as the tool already allows.

**5 Detailed risk** (`risk`, with `slt` as its grid tab; ZCR 5).
- Consultant: works one zone or conduit at a time. The minimum scenario stays what it is today (statement, affected requirements, likelihood, impact); everything else is optional.
  1. Scenario: source, entry point, assets, vulnerabilities, consequence.
  2. Unmitigated rating with a one-line likelihood rationale.
  3. Existing countermeasures and the current rating.
  4. Treatment decision: reduce, accept, or treat through the SL-T programme.
  5. Additional countermeasures with owner and date, then the planned rating.
- The zone's SL-T strip sits above the scenario table and is set once unmitigated ratings exist, before existing controls are credited.
- Tool:
  - Left rail of zones and conduits with scenario count, worst-risk pill and "n open".
  - Compact scenario table with one editor open; `data-owner-id` and `data-threat-id` stay on rows and grid lines.
  - "Scales" popover with every definition.
  - Row actions: duplicate, copy to zones, move, add from the house scenario library.
  - SL-T strip with "Use suggestion", "Accept all suggested", "Copy from" and the Why trace.
  - Three tabs across all zones: Register (filterable), Heat map (unmitigated, current, planned toggle) and SL-T grid.
  - "Confirm suggested" per zone for treatment decisions carried over from old files.
  - Edits update in place and keep focus.
- Current and planned ratings are both optional. Current is hidden when a scenario has no existing countermeasures.

**6 Requirements specification** (new `spec`; ZCR 6).
- Consultant: reviews the assembled elements and fills gaps (regulatory requirements, "security functions that must be kept").
- Tool: eight blocks, each with a completeness tick and a link back to where it was captured.

**7 Approval** (new `approval`; ZCR 7).
- Consultant: records one or more approvers and their scope.
- Tool: what is being approved (tolerable risk, SL-T grid, accepted risks), then the approvers, with "changed since approval" when the fingerprint differs. Never blocks.

**Report, Check and issue, Peer review.** Three entries in place of five. Report (`report`) has tabs for each document and a Word-pages toggle; the hand-built summary pages are retired. Check and issue (`review`) holds the linked readiness list for both documents, an in-page "Generate anyway" panel in place of the browser confirm, and all downloads. Save takes the primary header slot.

## Data model

All additions are optional and filled on load. Ids never change.

- **Project:** `savedBy` (suite version); `criteria` (likelihood and impact levels, consequence categories, matrix cells, tolerable band, optionally per category), seeded from the house file. The four band ids stay fixed as the output vocabulary. `projectHasContent` learns about approval, section edits and reviews.
- **Zone:** `hlaIds[]`, with `fromHLA` kept as a mirror of the first entry so old builds and the interchange's `fromHighLevelAsset` still work. The link lives on the zone only. Also `initialRisk`, `detailed {required, reason}`, `separation` (raised rows only), `level`, accountable organisation, physical boundary, physical access points, data flows, assumptions. Assets gain `criticality`. `flags` stay as stored.
- **Ranked system:** `consequenceSource`.
- **Conduit:** boundary devices, protocols, direction, wireless, external and temporary markers, a label for the external party. `fromZone`, `toZone` and `EXT` stay.
- **Threat:** `treatment {decision, confirmed, reason}` first; later `assetIds`, `entryPoint`, `vulnerabilityIds`, `countermeasureIds`, `consequence`, `impactByCategory`, `likelihoodRationale`, `currentLikelihood`, `currentImpact`, `acceptanceDetail {by, role, date, reviewDate}`. The existing residual pair is kept and means "after planned measures". The old acceptance string stays as the reason.
- **Countermeasure:** `owner`, `priority`, `dueDate`, `status`, `srRefs[]`. `reference` and `addressesFR` stay.
- **Approval:** `approvals[]` (scope, name, role, organisation, date, revision, fingerprint). The old object is mirrored from the first entry. The sign-off sentences left out of the review hash are extended to cover the new table, so signing still does not read as a change.
- **Report sections:** today's slugs are frozen as the fixed section ids, so stored edits and review anchors need no migration. Only headings that are reworded get an alias (first: `high-level-risk-ranking-4-2`). The alias is applied on project load, to stored review threads and to review files imported later. `shared/report-sections.js` is not changed. The pack keeps its document names, "Detailed report" and "High-level report".

**Migration**
- Replace the single normaliser with a stepwise ladder followed by a shape fill and a dangling-id prune. Freeze today's tour project and one hand-made 0.1 file as fixtures.
- Links are never invented. The old inference becomes a suggested treatment (and later suggested links), unconfirmed. "Untagged covers everything" is deleted.
- The old residual pair is copied to current only when every matched countermeasure is existing.
- Schema string: stay on `0.2` through phase 3. Files written then must still open and re-save in v0.7 (a fixture test proves it). Bump to `0.3` at phase 4, where the residual pair changes meaning and links become the record.

**Engine**
- One coverage rule and one view model (a grown `summarise`) feed screen, Word, Excel, review pack and risk context. Engine functions take the project as an argument.
- Risk context keeps the 1.3 disposition vocabulary: reduce exports as `mitigated` or `countermeasure`, accept as `accepted`, SL-T programme as `sl-t`, unconfirmed as null. `residualRisk` exports the planned rating, else the current one.
- The safety floor is limited by a `floorFR` list in the rules file. Conduit inheritance becomes a prompt. Unmitigated likelihood wording excludes existing controls.

## Deliverables

**Word.** Two variants at first (high-level, full), from the one builder:
- Clause numbers, raw flag and asset-type ids, capitals for emphasis and dash placeholders removed; the style guard tests extended to generated text.
- New sections:
  - Risk criteria appendix (matrix with tolerable line, scale and SL definitions, FR key).
  - ZCR 4 decision table.
  - Characteristics table per zone and conduit, with unmet separation rows and their reasons.
  - Landscape risk register with the three states.
  - Treatment plan.
  - Accepted risks.
  - Signature table.
  - A generated "How this assessment maps to IEC 62443-3-2" table.
- SL-T section: driving scenarios per requirement, safety zones marked, the "Worst case" row dropped.
- The executive summary leads with the residual position, a top risks table and decisions required.
- Specification content is grouped in ZCR 6 order so it can later be issued as its own file.

**Excel.** A register and treatment plan issued from the tool. It is one-way: the tool holds owner, date and status, and the Front sheet says a new issue replaces the old. Existing sheet names kept. Residual likelihood and impact columns added. New sheets: Summary with heat map, Treatment plan, Vulnerabilities, Accepted risks, Criteria.

**Drawing.** Optional `level` per zone gives horizontal bands with nudge ordering. Files with no level draw as today. Boxes click through to the zone. Conduit SL-T and channel sit on the line. A legend is added, and the drawing gets its own landscape page in Word. One `layout()` still feeds SVG and PNG.

**Risk context.** Stays `spt-risk-context/1.4`. Fixed in phase 1: scalar `slTarget` is null when the consultant has set nothing (`test-risk-tool.html:131` and the contract example change), and conduit countermeasures export `existing`. The six consumed zone fields, FR keys and `EXT` are frozen. New fields are provenance only. Staying on 1.4 while adding fields goes against the contract's own bump note, so that note is reworded in both synced copies.

## What stays the same

- Offline, no backend, plain scripts, no build step for the folder app (data twins are still generated by `scripts/build-data.ps1`).
- Save-in-place, autosave and restore, unsaved-changes guard, suite hosting hooks, element ids and autosave key.
- The per-requirement SL-T vector, the Why trace and mandatory justification. Suggestions never fill silently.
- Rules as data, with the house method labelled as house method.
- Completeness warns and never blocks.
- Basis of assessment, the standalone high-level report, section customisation, peer review anchors, review pack item grammar, status words and the `priority` convention.
- `window.RiskTool` member names, and version never in Word or Excel.

## Delivery plan

Before phase 1: commit or land the work in progress on `feature/word-preview`, which touches `index.html`, `exports.js`, `checks.js` and seven test pages.

| Phase | Size | Contents | Leaves working |
|---|---|---|---|
| 1 Honest outputs (v0.7.x) | M | ZCR lookup and clause numbers out (UI, Word, tests, README); one heading alias; `treatment` field with a one-click decision and "Confirm suggested", replacing inference in engine, review pack and exports; Report Review Tool check text and tests updated in the same release; null `slTarget`; conduit counts, no-threats check and `existing`; labels for ids; band names. One Word baseline regeneration. | Same workflow, defensible deliverables, SL-T programme still recordable. |
| 2 Foundations | M | Split `index.html` into classic scripts behind the same `RiskTool` facade; migration ladder and fixtures; single view model. | Identical behaviour. |
| 3a Navigation and gates | M | Nav re-cut with aliases, Home, engagement first; Assign to zone; Risk comparison; linked readiness panel; three report entries. Electron self-test and parity check moved from label text to ids. | ZCR 1 to 5 path with the comparison recorded. |
| 3b Zones and specification | M | Zones layout, paste assets, characteristics, separation prompts; Specification and Approval steps; criteria appendix, decision table and characteristics printed. Second baseline. | Full ZCR 1 to 7 path, on 0.2 files. |
| 4 Detailed risk (built Nov 2026, uncommitted: 4a capture, 4b deliverables and demo) | L | Zone workshop, explicit links, three states, structured acceptance, plan fields, register, heat map, SL-T grid and bulk accept, copy and move. Word register, treatment plan and accepted risks; Excel sheets. Schema 0.3. Third baseline; new tour. | Workshop-grade capture at 12 or more zones. |
| 5 Realism (built Nov 2026, uncommitted: 5a criteria and impact per category; 5b drawing levels, safety floor list, scenario library, undo) | M | Per-project criteria editor and presets, impact per category, drawing levels, safety floor list, scenario library, one-level undo. | Each item ships alone. |
| 6 Optional | M | Asset register with paste import, separate specification file, previous-assessment comparison, interchange 1.5 with the Assessment Tool. | Extras. |

About 675 `ok(` calls across 13 pages pin today's behaviour. Phase 4 is at least half test and fixture work, and phases 1, 3b and 4 each regenerate the Word baseline.

## Decisions for the owner

1. **Licensed copy.** Buy one before phase 1 ships, or ship ZCR ids unverified. Recommend buying: the lookup file is then corrected once.
2. **Schema bump.** Stay on 0.2 for good (old builds open new files, show the planned rating as "residual" and ignore links) or bump to 0.3 at phase 4 (v0.7 and earlier, including issued single-file and exe copies, refuse those files). Recommend the bump, with a release note. Old builds re-infer dispositions today, so that alone is not the reason.
3. **Previously "complete" projects.** After phase 1, inferred dispositions read as suggested until confirmed (one click per zone), the review tool raises them as must-fix, and approved reviews read as changed. Accept this, or keep the old inference for old files. Recommend accepting it.
4. **SL-T programme as a treatment.** Allow it as a confirmed decision without a countermeasure when the SL-T is at or above the suggestion or a reason is given, or require a countermeasure. Recommend allowing it.
5. **Client matrix.** Client labels mapped onto four fixed band ids (moderate cost) or free band counts (expensive: exports and interchange change). Recommend four fixed bands.
6. **Document split.** One full report with the specification grouped inside it, or three files (high-level, management, specification). Recommend one report now and the split in phase 6.
7. **Scenario library.** Ship about 30 house scenarios or none. Recommend shipping, with a named owner for the wording.
8. **Second SL-T method** ("risk reduction to tolerable", with the adversary assumption as a visible floor). Add as opt-in rules data or leave out. Recommend leaving it out until a client asks.
9. **Excel read-back.** Keep the workbook one-way, or add an import of owner, date and status. Recommend one-way.
10. **Hand-built summary pages** (raised in the phase 3a review). The plan retires them, but phase 3a kept them as the Report page's Summary view because they are the only printable one-page summary (Print one-page summary, Print high-level report), and `hlreport` still opens the high-level one. Their wording now follows the house rules (no tool version, no dash placeholders). Either retire them and point `hlreport` at the high-level Sections view (several test assertions on the Summary view would then need the owner's OK to remove), or keep them as a print view. Undecided.

11. **Phase 3b calls** (raised when it was built; each can be reversed cheaply):
    - Conduit "protocols" reuse the existing `channels` field, labelled "Channels and protocols", rather than a second list.
    - Regulatory requirements moved from step 2 to step 6. Security functions that must be kept stay on step 2 and show in step 6's SUC block.
    - Organisational security policies are a new project field entered on step 6 (`suc.policies`); zone policies stay on the zone.
    - Asset types gained "Business system"; temporarily connected and wireless are an asset's connection (`asset.link`), not types. A v0.7 build shows an unknown type as the first in its list but keeps it unless edited.
    - Separation rows sit on zones only. The external row is raised on each zone at the end of a conduit to EXT or one marked external that holds control system assets.
    - An approver entry has an `approved` flag beside the planned fields, so one can be recorded before signing; old files read as one approver.
    - Four step 6 blocks with no other check (assumptions, threat environment, policies, regulatory) add completeness items for the detailed report; every existing project gains them and the tolerable-risk confirmation until filled in.
    - The sign-off item ("No asset-owner sign-off recorded.") moved from Check and issue to step 7; its text is unchanged.
    - Word: the drawing moved from the zones section to the requirements section; zone and conduit meta lines became characteristics tables; empty cells read "Not rated" or "Not set" instead of a dash (Word and Excel). The "Worst case" SL-T row stays until phase 4. No landscape pages: the risk module has no landscape helpers.

12. **Phase 3b review calls** (each can be reversed cheaply):
    - The ranking is part of what an approval covers (the high-level report's approval: tolerable risk and ranking; the detailed report's: tolerable risk, SL-T, accepted risks). The fingerprint holds one hash per part (`a2-`), so a change says what moved and which report it concerns; the first build's `a1-` prints are still read.
    - The sign-off items concern the high-level report too, once there is a ranking, and named approvers with none approved are open on step 7.
    - The signature table's first column is "Approver"; the section opens "For approval by the people below" until someone has signed.
    - The risk context's `approval` stays the first approver's mirror (provenance); it does not yet say whether any other approver signed.
    - When an older build renames the single sign-off's person, the first approver keeps its organisation (often the same asset owner) but drops its revision and fingerprint.
    - The security level definitions are a house summary in our own words (rules file), used in the UI, the summary and the criteria appendix.

13. **Phase 4 calls** (built; each can be reversed cheaply):
    - Schema `spt-risk-project/0.3`, with the release note in the module README; v0.7 and earlier refuse 0.3 files. The 0.2 to 0.3 step makes the old requirement match suggested links, never links, and copies the residual pair to current only when every matched countermeasure is existing.
    - The risk context stays 1.4 with no new field: `residualRisk` (and the likelihood and impact beside it) is the planned rating, else the current one. The contract's note now says so, and that `countermeasure` and `mitigated` rest on a linked countermeasure.
    - Word, executive summary: it opens with two new sections, Risk position (within tolerable risk today and once the plan is done, the decisions tally moved here from What we found, and a table of at most five threats above tolerable risk today, worst first) and Decisions required (no decision and incomplete decisions in red, as before; accepted risks no approver has signed with the accepted risks unchanged; planned countermeasures with no owner or due date; or "Nothing is waiting on a decision"). The approved sentence on regulators and insurers stays. The top risks table prints the decision in plain bold, not red, so a prompt is red once (in the register).
    - Word, landscape: the Risk register, Treatment plan and Accepted risks are one landscape Word section, between the risk comparison and the zones' detail. The module has no shared landscape helper, so `exports.js` cuts the body by the key of each level 1 heading after the overrides.
    - Word, register: a current or planned rating not given is blank (the one before it stands, as on the heat map); an unmitigated rating not given reads Not rated, or the side given in words. The old per-zone Threat / L × I / Risk / Residual / Treatment tables are gone: the zones section now gives each threat's captured detail, and prints no ratings or decisions, so each is said once. The acceptance line under a zone's register moved to the Accepted risks table; the SL-T reason line stays under the threat.
    - Word, treatment plan: only the additional countermeasures, by priority then due date. Existing ones stay in each zone's countermeasure line.
    - Word, SL-T: the Worst case row is gone (the scorecard keeps its worst-case strip); a safety related zone is marked in the table, with the house floor said once; Driving scenarios is a new sub-section (per zone and conduit, the threats with the worst unmitigated risk on each requirement; a zone or conduit with none says why).
    - Excel: five new sheets (Summary with three heat map grids, Treatment plan, Accepted risks, Vulnerabilities, Criteria); the eight old sheets keep their names and order. The threat register's current and planned columns sit between Risk and Above tolerable?, which moves the later columns' letters; its Owner and Target date are filled from the planned countermeasures linked to the threat (the latest due date). The SL-T sheet keeps its Worst case row.
    - Review pack: detail rows "Current likelihood × impact", "Planned likelihood × impact", "Treatment plan" (for a confirmed decision with planned countermeasures linked, the SL-T programme included) and "Accepted by"; the answer's "residual" is planned, else current. Item fields, status words and the priority convention are unchanged, and the Report Review Tool's checks read it as before.
    - Demo: rebuilt as a workshop example. T4 (the SIS logic change, severe impact) moved from reduce to the SL-T programme, since no countermeasure can bring a severe consequence within tolerable risk on the house matrix; two additional countermeasures were added (M8 for Z2, M9 for Z4) and two vulnerabilities (V6, V7); T8's acceptance reason no longer starts "Accepted by R. Calder (Asset Owner) 2026-07-04", which is now its acceptance detail, so the approvals' fingerprint was retaken; C2 runs both ways. Ids that existed are unchanged.

14. **Phase 5a calls** (built; each can be reversed cheaply):
    - Criteria are stored only once changed (`project.criteria`, seeded from the house rules file) and dropped again when they are the house's once more with no tolerable risk per category; a file without them reads the house criteria. The shape fill tidies them when present and never adds them. Schema stays 0.3.
    - The four band ids are the output vocabulary (decision 5); client levels map onto them through the matrix. Levels are 3 to 5 per scale; a new level is added at the top of its scale with its cells copied from the level below; levels cannot be reordered.
    - Presets: the house criteria and generic 3x3, 4x4 and 5x5 shapes with the tool's own words, positional ids (`L1`, `I1`) and a band from the sum of the two positions (never lower for a higher level). A preset replaces the levels and the matrix only; the consequence categories and their tolerable risk are kept.
    - A preset applied, or a level removed, with ratings on levels that change asks in the page where each goes: by default the same level only where both id and name match, else the same name, else the same relative place rounded up (for a preset, by place alone, so no band drops between presets); a change that moves nothing asks nothing; Leave as it is keeps the rating, which then has no band and is open ("no longer fits the risk criteria", on step 2 for a ranked system, step 5 for a threat) until re-rated, and the single impact it mirrors is not worked out again while it does not fit. A new level or category never takes an id a rating still holds. A level renamed keeps its id, so nothing moves. (Phase 5 review.)
    - Tolerable risk per category: a threat or ranked system rated per category is above tolerable risk when any of its categories is above that category's tolerable risk (or the general one); a current or planned impact given caps each category's impact. Without a per-category tolerable risk, or with no category rated, it is the band against the general tolerable risk, as before. The confirmed marker (`srs.tolerableConfirmed`) still covers the general band only, as v0.7 reads it as a band.
    - The approval's "tolerable risk" part includes the per-category tolerable risks and, once they are not the house's, the criteria as `isHouseContent` compares them (names, definitions, cells, category names); on the house criteria it is the band alone, so approvals taken before still match. The note reads "the tolerable risk or the risk criteria changed". A rating whose own impact is above its categories compares its band; the heat maps, the review pack and the SL-T trace compare per category too (phase 5 review).
    - Impact per category: the single impact mirrors the worst category (as `fromHLA` mirrors `hlaIds`), so every reader of it, the risk context (1.4, no new field) and an older build work unchanged. Only the unmitigated impact is per category; the current and planned ratings stay single. A ranked system has the same (`consequenceByCategory`) and a free-text `consequenceSource` with suggestions (HAZOP, LOPA, business impact analysis, interview, site walk-down).
    - The client tick stays the label: with it, the criteria print as the client's (with where they come from); with it but the house criteria still on step 1, the old reference wording and red note stay and a completeness item asks for them. Unticked and changed, they print as "agreed for this assessment".
    - Word and Excel show categories only where used: a threat's Impact by category row, the ranking's consequence with its categories and source, the appendix's categories (a table only when a tolerable risk is set per category, else one sentence), Excel's Impact by category, Consequence source and Consequence by category as last columns (earlier columns keep their letters). The About page keeps showing the house matrix, as the house's.
    - The demo keeps the house criteria; T1, T4 and T6 give impacts per category and A1 and A2 a consequence source, which adds 10 lines to the detailed report and 2 to the high-level one (fourth baseline).

15. **Phase 5b calls** (built; each can be reversed cheaply):
    - Drawing levels are a house layering of six, top to bottom: Enterprise, DMZ, Supervisory, Control, Safety, Field (`Model.ZONE_LEVELS`), labelled as the house's on the page, in the legend ("Bands: SolutionsPT house layering") and in the code, never as a model from a standard. Safety sits between Control and Field.
    - Bands appear once any zone has a level; zones without one form a last band, No level. A band holds at most four zones to a row and wraps. Within a band the order is the nudge (`zone.levelOrder`, written out for the whole band on each nudge), then the zones' order; a zone given a level, or moved to another band, loses its place and follows the zones' order. With no level set the layout is the phase 5a one to the pixel (frozen copy in the tests).
    - A conduit's note on the drawing is its highest SL-T and its channels (cut at a comma or space within 24 characters), placed right of its tag, else left (each only where its own line carries on that way), else just above or below, only where it is clear of every box, tag, note and other line; one that fits nowhere is left off the drawing rather than moving anything (the key text is unchanged).
    - The legend lists only what the drawing uses, and is added under the key on every drawing (so a drawing with no level is taller by the legend; nothing else moves). The box border colours were left as they were, so Safety related and a medium worst risk share amber and differ by weight; the legend shows both.
    - Word: the drawing heading, the picture and, as Word tables, its key and legend are a Word section of their own inside the requirements (the body is now six sections: cover, portrait, the drawing, portrait, the register pages, portrait). The section is landscape, or portrait when that prints the drawing larger (a tall one); the picture is the drawing alone, up to 940 by 540 pixels landscape or 620 by 860 portrait. After the phase 5 review twelve zones over six levels print at 0.51 (0.41 before); the baseline gained the key and legend lines.
    - The safety floor list sits in the rules file as `floorFR` (all seven), and per project as `safetyFloorFR`, stored only while narrower (in requirement order, an empty list allowed: no floor). It is edited by chips in the floor box on the SL-T grid and on a safety related zone's strip; step 3's safety hint says what it covers. It is not part of what an approval covers (the SL-T set is).
    - The scenario library is 33 scenarios with ids `HS01` to `HS33` (HS31 to HS33 and rewrites of HS04, HS22, HS23, HS27 and HS30 after the phase 5 review), 17 named tags, and countermeasure ideas whose SR ids give the FRs they address (SR 5.x is RDF). A scenario added from it records `libraryId`; Copy to keeps it; nothing prints it. Its typical vulnerabilities are shown in the picker only, not added. Countermeasure ideas are added as additional (not existing) countermeasures with no plan fields, linked to nothing, only when ticked.
    - Send to step 5 adds the known threats chosen as drafts with the line as the statement and nothing else; a threat whose wording is already a scenario there is marked "in Z1" and cannot be sent twice. It is not offered on a high-level-only assessment.
    - Undo is generic: every change through `touched()` can be undone with Ctrl+Z, one level, typing in one field counting as one change (in a field nothing was typed in since the last change, Ctrl+Z is the app's); each undo point is numbered, and a toast offers Undo only for one its action made; the toast's Undo is offered after the destructive and bulk actions listed in the README (the ranked system and evidence rows' removal included). Undo restores the project in place (same object), returns to the step the change was made on, and closes a waiting criteria mapping. The existing confirms before a remove are kept.

## To verify against a licensed copy of IEC 62443-3-2

- Clause 4.1 is an overview, and ZCR 1 to ZCR 7 sit at 4.2 to 4.8.
- ZCR 3 sub-requirements and order: 3.1 establish zones and conduits; 3.2 business and IACS; 3.3 safety related; 3.4 temporarily connected devices; 3.5 wireless; 3.6 devices connected via external networks. Which of these are requirements and which are recommendations, because the checklist wording depends on it.
- ZCR 4 is a single comparison of initial risk with tolerable risk that decides whether ZCR 5 is needed. Whether it is made for the system as a whole or per zone; the per-zone table is a house reading until checked.
- ZCR 5 sub-requirements and order, 5.1 to 5.13: threats; vulnerabilities; consequence and impact; unmitigated likelihood; unmitigated risk; SL-T; comparison with tolerable risk; existing countermeasures; re-evaluated likelihood and impact; residual risk; comparison; additional countermeasures; document and communicate. In particular, that impact comes before likelihood, SL-T comes before existing countermeasures, and unmitigated likelihood sets existing controls aside.
- Whether a zone that passes the ZCR 4 comparison still needs an SL-T as a documented characteristic.
- ZCR 6 elements, with tolerable risk as ZCR 6.8: SuC description, drawings, zone and conduit characteristics, operating environment assumptions, threat environment, organisational security policies, tolerable risk, regulatory requirements.
- The list of zone and conduit characteristics (accountable organisation, logical and physical boundary, safety designation, logical and physical access points, data flows, connected zones and conduits, assets, SL-T, applicable requirements and policies, assumptions and dependencies).
- ZCR 7 wording on who approves.
- Published terms: "initial cyber security risk assessment", "cyber security requirements specification". The tool keeps "high-level risk assessment" for ZCR 2 (owner's ruling: 62443 goes from high-level to detailed risk assessment). Whether "mandatory security functions" and "def. 3.1.39" exist in the published text.
- That the standard prescribes no matrix or SL-T method and allows SL-T as a vector.

Key files: `C:\Dev\ot-assessment-tool\modules\risk-assessment\index.html`, `C:\Dev\ot-assessment-tool\modules\risk-assessment\js\exports.js`, `C:\Dev\ot-assessment-tool\modules\risk-assessment\js\review.js`, `C:\Dev\ot-assessment-tool\modules\risk-assessment\js\zone-map.js`, `C:\Dev\ot-assessment-tool\modules\risk-assessment\data\slt-suggestion-rules.json`, `C:\Dev\ot-assessment-tool\modules\risk-assessment\scripts\build-data.ps1`, `C:\Dev\ot-assessment-tool\contracts\risk-context-interchange.json`, `C:\Dev\ot-assessment-tool\modules\assessments\js\engine.js`, `C:\Dev\ot-assessment-tool\modules\report-review\js\checks.js`, `C:\Dev\ot-assessment-tool\packaging\electron\app\selftest-risk-assessment.js`.

## Reviewer's notes

Nothing was edited, built or run; all checks are from reading the code.

**Claims confirmed**
- Null `slTarget` imports cleanly (`engine.js:863-876`; no target entry is created when scalar and vector are both empty).
- Unknown schema strings are refused by Load and by autosave restore; unknown keys survive the normaliser.
- The tool's 4.1 to 4.7 numbering does look one behind the published ZCR layout, and it places the specification at "4.3" where ZCR 6 comes near the end. From memory only.

**What I changed and why**
1. **Phase 1 removed a legitimate position with nothing to replace it.** Deleting the "any SL-T clears it" rule in phase 1, with the explicit treatment decision arriving in phase 4, would leave an immature site unable to record "treated through the SL-T programme" for three phases. The `treatment` field and a one-click decision now arrive in phase 1.
2. **Phase 1 was not small and not risk-tool-only.** The disposition change runs through `review.js` (pack `priority`), the Report Review Tool's `risk-no-disposition` check and its description text, `test-risk-tool.html:136-160`, `test-risk-checks.html`, the interchange example and the Word baseline. Clause removal touches about 70 UI strings, 9 Word strings, tests and the README. Resized S to M and the cross-module work is named.
3. **"Exposure tick-boxes check and change nothing" was wrong for "SIS present"**, which drives the SL3 floor and the consumed `safetyRelated` field. The safety designation is now kept explicitly.
4. **Section id alias table was heavier than needed.** Freezing today's slugs as the ids avoids migrating every stored key; only reworded headings need an alias. The proposal also missed that review files imported after the upgrade carry old keys, and that `review.js:83` skips the literal key `sign-off` and the sign-off sentences when hashing, so a new signature table would otherwise make signing read as a change.
5. **`hlaIds[]` "wrapping" `fromHLA` would break old builds and the interchange's `fromHighLevelAsset`.** `fromHLA` is now kept as a mirror. I dropped the duplicate `zoneId` on the ranked system (two sources of truth).
6. **Interchange disposition vocabulary.** The contract fixes four values plus null. I mapped the new decisions onto them and removed "avoid", which has no legacy value and is rare in practice. Staying on 1.4 while adding fields contradicts the contract's own note, now stated.
7. **Risk comparison had gaps:** zones drawn without a ranking have no initial risk (direct entry added); a high-level-only job has no zones (comparison column on the ranking added).
8. **Phase 3 was larger than "M"**; split into 3a and 3b. The nav re-cut breaks the Electron self-test, which finds "Full report" by label (`selftest-risk-assessment.js:139`); added to 3a.
9. **Too heavy for a workshop:** five separation answers per zone (60 at 12 zones) reduced to rows the tool raises; the scenario's mandatory minimum stated as today's four fields; "SL-T" removed from the per-scenario step list because it is set per zone.
10. **Schema bump rationale corrected.** Old builds already print inferred dispositions, so that is not a new harm. The real reasons are the residual pair changing meaning and links becoming the record. Added the requirement that phase 1 to 3 files round-trip through v0.7, with a dangling-id prune.
11. **`data/zcr-map.json` cannot be read directly** from the folder app; data files load as generated `.js` twins via `scripts/build-data.ps1`.
12. **Dropped findings restored:** conduits missing from the no-threats check; Load returning to step 1; tolerable risk defaulting silently; known threats retyped in step 5; `projectHasContent` ignoring approval, section edits and reviews; Excel being one-way (now a stated limit and decision 9); SL-T section drivers and the "Worst case" row; top risks table; hand-built report pages retired; readiness check for the high-level report; style guard on generated text; engine functions reading page state.
13. **Stage ids made explicit**, including that `review` is today's "Full report & export" and that `hlreport` and `wordpreview` need aliases.
14. **Uncommitted work** on the branch overlaps the files phase 1 edits; landing it first is now a stated precondition.

**What remains uncertain**
- Every statement about the standard, including whether ZCR 3.4 to 3.6 are requirements or recommendations and whether ZCR 4 is per system or per zone. The per-zone comparison may be a house reading.
- Assert total: I counted about 675 `ok(` calls; some pages may count differently at run time.
- I did not read `report-page.js`, `word-preview.js`, `zone-map.js` or the Excel builder in full, so the cost of the tabbed Report page, drawing levels and new sheets is taken from the review findings, not checked.
- Whether retiring the hand-built report pages removes the "Print one-page summary" that someone relies on.
- Whether mixed-version working (a colleague or reviewer still on a v0.7 single file or exe) is common enough to argue against the 0.3 bump.
- How many real saved projects rely on the inferred "carried into the SL-T" position, which decides how disruptive decision 3 is.
- Phase 2 moves inline handlers that rely on closure variables into shared scripts; "identical behaviour" is the goal, and only the full test run can show it.