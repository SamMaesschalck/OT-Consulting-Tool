/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* model.js — the risk project's shape.
 *
 * The house rules as the tool reads them (data/slt-suggestion-rules.js), the
 * ZCR lookup (data/zcr-map.js), the project file's schema, the empty records
 * every new zone, conduit, threat and register row starts from, and the map
 * of reworded report headings. Nothing here reads or changes page state.
 *
 * Classic script, no modules: the app runs from file:// and the single-HTML
 * build inlines every <script src>. It is the first of the tool's own
 * scripts; js/engine.js, js/migrate.js, js/view-model.js, the js/ui-*.js
 * pages and js/app.js read it through window.RiskApp.Model.
 */
window.RiskApp = window.RiskApp || {};
window.RiskApp.Model = (function () {
  "use strict";

  var RULES = window.App.Data.sltRules;
  var INTERCHANGE = window.App.Data.interchange;

  // The suite version, one number for every module (js/version.js). Shown in
  // the header badge and on the About page, and carried as generatedBy in
  // the risk-context file; never put in the Word or Excel deliverables.
  var VERSION = window.App.Version;
  var TOOL_ID = "spt-risk-tool/" + VERSION.number;
  // 0.3 (phase 4): links between a threat and its assets, vulnerabilities and
  // countermeasures are the record of coverage, and a threat carries three
  // ratings (unmitigated, current, planned). v0.7 and earlier refuse 0.3 files.
  var PROJECT_SCHEMA = "spt-risk-project/0.3";
  var ACCEPTED_PROJECT_SCHEMAS = ["spt-risk-project/0.1", "spt-risk-project/0.2", "spt-risk-project/0.3"];

  var FRS = RULES.foundationalRequirements;           // [{id,fr,name}]
  var FR_IDS = FRS.map(function (f) { return f.id; });
  var CATS = RULES.consequenceCategories;
  var SEV = RULES.severityScale;                       // [{id,name,rank,note}]
  var LIK = RULES.likelihoodScale;                     // [{id,name,rank,note}]
  var BANDS = RULES.riskBands;                         // [{id,name,rank}]
  var MODS = RULES.exposureModifiers;

  var SIS_RULE = null, MISMATCH_RULE = null;
  RULES.specialRules.forEach(function (r) {
    if (r.id === "sis-present") SIS_RULE = r;
    if (r.id === "adversary-mismatch") MISMATCH_RULE = r;
  });

  // "business" (a business or IT system) is phase 3b's: it lets the zones page
  // see business and control system assets sharing a zone.
  var ASSET_TYPES = ["plc", "safety-plc", "hmi", "historian", "engineering-workstation", "server", "network", "business", "other"];
  // How an asset is connected, when it is not fixed (asset.link, absent when fixed).
  var ASSET_LINKS = ["wireless", "temporary"];

  // rank lookups
  function rankMap(arr) { var m = {}; arr.forEach(function (x) { m[x.id] = x.rank; }); return m; }
  var SEV_RANK = rankMap(SEV), LIK_RANK = rankMap(LIK), BAND_RANK = rankMap(BANDS);
  function nameMap(arr) { var m = {}; arr.forEach(function (x) { m[x.id] = x.name; }); return m; }
  var BAND_NAME = nameMap(BANDS), FR_NAME = {}; FRS.forEach(function (f) { FR_NAME[f.id] = f.name; });

  // The zone and conduit requirements (ZCR) of the published standard, from
  // data/zcr-map.json: the one place an id, a title or a clause number is
  // written. A page shows its ZCR once, in its sub-title; fields, hints and
  // deliverables carry no reference at all.
  var ZCR = window.App.Data.zcrMap;
  function zcrOf(id) { return ZCR.requirements.filter(function (r) { return r.id === id; })[0] || null; }
  function stageZcr(stageId) { var id = ZCR.stages[stageId]; return id ? zcrOf(id) : null; }
  var ZCR_TOP = ZCR.requirements.filter(function (r) { return r.id.indexOf(".") < 0; });
  // The top-level ZCRs a page of the tool belongs to, and those with no page
  // of their own yet: About says exactly this and no more.
  var ZCR_COVERED = ZCR_TOP.filter(function (r) {
    return Object.keys(ZCR.stages).some(function (k) { var id = ZCR.stages[k]; return k.charAt(0) !== "_" && (id === r.id || id.indexOf(r.id + ".") === 0); });
  });
  var ZCR_LATER = ZCR_TOP.filter(function (r) { return ZCR_COVERED.indexOf(r) < 0; });

  // A report section is keyed by a slug of its generated heading
  // (js/report-sections.js), so a reworded heading would orphan what is
  // stored under the old slug. Old key to new key, applied wherever stored
  // keys are read: the section overrides on load (js/migrate.js) and a
  // review's comments (js/review.js). The old slugs are kept as written.
  var SECTION_KEY_ALIASES = {
    "high-level-risk-ranking-4-2": "high-level-risk-ranking",
    "mandatory-security-functions": "security-functions-that-must-be-kept"
  };
  function sectionKeyAlias(key) {
    return Object.prototype.hasOwnProperty.call(SECTION_KEY_ALIASES, key) ? SECTION_KEY_ALIASES[key] : key;
  }

  // ---------- Empty records ----------

  function emptyProject() {
    return {
      schema: PROJECT_SCHEMA,
      savedOn: null,
      suc: { name: "", description: "", scopeStatement: "", assumptions: [] },
      srs: {
        adversaryClass: null,
        essentialFunctions: "",
        worstCase: "",
        tolerableRisk: (RULES.tolerableRisk && RULES.tolerableRisk.default) || "medium",
        highLevelAssets: [],   // the high-level risk assessment's relative ranking of systems, which frames the zoning
        knownThreats: [],
        mandatorySecurityFunctions: [],
        regulatory: [],
        clientMatrix: false,
        clientMatrixNote: ""
      },
      // Engagement details for the report deliverables (Word/Excel document
      // control). Optional; blanks render as "(not set)" in the exports.
      // qaReviewBy: who did the internal QA review (an approval offers to fill it).
      engagement: { client: "", consultant: "", assessmentDate: "", revision: "", confidentiality: "", qaReviewBy: "" },
      // Evidence basis for the engagement: who we spoke to, what we read, what we saw.
      basisOfAssessment: { interviews: [], documents: [], observations: [] },
      // Asset-owner sign-off of the tolerable risk and the assessment outcome.
      approval: { name: "", role: "", date: "", statement: "", approved: false },
      zones: [],
      conduits: [],
      counters: { zone: 0, conduit: 0, threat: 0, vuln: 0, cm: 0, hla: 0, interview: 0, document: 0, observation: 0, asset: 0 }
    };
  }
  var COUNTER_KEYS = ["zone", "conduit", "threat", "vuln", "cm", "hla", "interview", "document", "observation", "asset"];

  function emptyHLA(n) { return { id: "A" + n, name: "", functionLocation: "", consequence: "", likelihood: "", note: "" }; }
  function emptyInterview(n) { return { id: "I" + n, name: "", role: "", date: "", notes: "" }; }
  function emptyDocument(n) { return { id: "D" + n, title: "", reference: "", source: "", relevance: "" }; }
  function emptyObservation(n) { return { id: "O" + n, description: "", location: "", date: "", notes: "" }; }

  function emptyFRVector() { var o = {}; FR_IDS.forEach(function (fr) { o[fr] = null; }); return o; }

  function emptyZone(n) {
    var flags = { "sis-present": false };
    MODS.forEach(function (m) { flags[m.id] = false; });
    return {
      id: "Z" + n, name: "", description: "", fn: "",
      assets: [], flags: flags,
      accessPoints: [], externalDependencies: [], securityPolicies: [],
      threats: [], vulnerabilities: [], countermeasures: [],
      slTargetByFR: emptyFRVector(), justification: "",
      fromHLA: ""   // the first ranked system assigned to the zone, if any (see hlaIdsOf)
    };
  }

  function emptyConduit(n) {
    return {
      id: "C" + n, fromZone: "", toZone: "", name: "", channels: [], notes: "",
      threats: [], vulnerabilities: [], countermeasures: [],
      slTargetByFR: emptyFRVector(), justification: ""
    };
  }

  // A threat scenario (schema 0.3). The minimum is the statement, the affected
  // requirements, likelihood and impact; everything else is optional.
  //   assetIds, vulnerabilityIds, countermeasureIds  explicit links to the
  //       owner's records (a conduit's assets are those of the zones it joins).
  //       countermeasureIds is the record of coverage: nothing is inferred.
  //   suggestedCountermeasureIds  links a file from before 0.3 implied (the old
  //       requirement match), unconfirmed until the consultant confirms them;
  //       absent when there are none.
  //   likelihood, impact          the unmitigated rating (before any countermeasure)
  //   currentLikelihood/Impact    the rating with the linked existing countermeasures
  //   residualLikelihood/Impact   the rating after the planned measures as well
  //   acceptance                  the reason a risk is accepted; acceptanceDetail
  //                               who accepted it, their role, when, and when to review
  function emptyThreat(n) {
    return { id: "T" + n, statement: "", source: "", entryPoint: "", consequence: "",
      assetIds: [], vulnerabilityIds: [], countermeasureIds: [],
      affectedFR: [], likelihood: "", impact: "", likelihoodRationale: "",
      currentLikelihood: "", currentImpact: "",
      residualLikelihood: "", residualImpact: "", acceptance: "", acceptanceDetail: emptyAcceptanceDetail(), treatment: emptyTreatment() };
  }
  var THREAT_TEXT_FIELDS = ["statement", "source", "entryPoint", "consequence", "likelihood", "impact", "likelihoodRationale",
    "currentLikelihood", "currentImpact", "residualLikelihood", "residualImpact", "acceptance"];
  var THREAT_LINK_FIELDS = ["assetIds", "vulnerabilityIds", "countermeasureIds"];
  var ACCEPTANCE_FIELDS = ["by", "role", "date", "reviewDate"];
  function emptyAcceptanceDetail() { return { by: "", role: "", date: "", reviewDate: "" }; }
  // The consultant's treatment decision for a threat above tolerable risk.
  // decision: "reduce" | "accept" | "slt" | null. An unconfirmed decision is
  // only a suggestion and is never printed or exported as fact. The reason
  // for "accept" is the threat's acceptance text; reason holds any other.
  var TREATMENT_DECISIONS = ["reduce", "accept", "slt"];
  function emptyTreatment() { return { decision: null, confirmed: false, reason: "" }; }

  // ---------- Fields a later build added (phase 3a) ----------
  // None is in the empty records above: a file saved by v0.7 must load and
  // save again unchanged, so each is written only once the consultant sets
  // it, and read through the helpers below, which give the default when it
  // is absent. js/migrate.js tidies them when present and never adds them.
  //
  //   project.assessmentType   "full" | "high-level" (absent: not chosen, read as full)
  //   project.lastStage        the page open when the file was last saved
  //   zone.hlaIds              the ranked systems assigned to the zone; zone.fromHLA
  //                            mirrors the first, for v0.7 and the risk context
  //   zone.initialRisk         a band entered on the risk comparison when the zone
  //                            has no ranked system; conduit.initialRisk likewise
  //   zone/conduit.detailed    { required: true | false | null, reason } the
  //                            risk comparison's decision; a ranked system carries
  //                            the same on a high-level-only assessment
  var ASSESSMENT_TYPES = ["full", "high-level"];
  function assessmentType(pj) { return pj && pj.assessmentType === "high-level" ? "high-level" : "full"; }
  function emptyDetailed() { return { required: null, reason: "" }; }

  // The ranked systems assigned to a zone, first one first.
  function hlaIdsOf(zone) {
    if (zone && Array.isArray(zone.hlaIds)) return zone.hlaIds.slice();
    return zone && zone.fromHLA ? [zone.fromHLA] : [];
  }
  // Writes the list and keeps fromHLA its mirror. A zone that never had a
  // list gets one only here.
  function setHlaIds(zone, ids) {
    var seen = {}, out = [];
    (ids || []).forEach(function (id) { if (id && !seen[id]) { seen[id] = true; out.push(id); } });
    zone.hlaIds = out;
    zone.fromHLA = out[0] || "";
  }

  // ---------- Fields phase 3b added ----------
  // Written only once set, like phase 3a's, and read through the helpers here.
  //
  //   srs.tolerableConfirmed   the tolerable risk band the asset owner confirmed;
  //                            confirmed while it equals srs.tolerableRisk
  //   suc.policies             organisational security policies (lines)
  //   zone: accountableOrg, physicalBoundary (text); physicalAccessPoints,
  //         dataFlows, assumptions (lines); separation { <row>: { answer, reason } }
  //         for the separation rows the zones page raised (SEPARATION_ROWS)
  //   asset.link               "wireless" | "temporary" (absent: fixed)
  //   conduit: boundaryDevices (lines), direction (CONDUIT_DIRECTIONS),
  //         wireless, external, temporary (true, absent when not), externalParty
  //   project.approvals        [{ scope, name, role, organisation, date, revision,
  //                            approved, fingerprint }]; project.approval mirrors
  //                            the first, for v0.7 and the risk context
  function tolerableConfirmed(pj) {
    var s = (pj && pj.srs) || {};
    return !!s.tolerableConfirmed && s.tolerableConfirmed === (s.tolerableRisk || RULES.tolerableRisk.default);
  }

  var ZONE_TEXT_FIELDS = ["accountableOrg", "physicalBoundary"];
  var ZONE_LIST_FIELDS = ["physicalAccessPoints", "dataFlows", "assumptions"];
  var CONDUIT_DIRECTIONS = ["both", "from-to", "to-from"];
  var CONDUIT_MARKERS = ["wireless", "external", "temporary"];
  function listOf(v) { return Array.isArray(v) ? v : []; }

  // The separation rows, in the order the zones page and the report show them.
  // Each is raised only when the zone's data shows a mix (js/engine.js
  // separationRows); one not raised asks nothing. answer: "met" | "not-separated".
  var SEPARATION_ROWS = [
    { id: "business", label: "Business and control system assets" },
    { id: "safety", label: "Safety related assets" },
    { id: "temporary", label: "Temporarily connected devices" },
    { id: "wireless", label: "Wireless devices" },
    { id: "external", label: "Devices connected via external networks" }
  ];
  var SEPARATION_ANSWERS = ["met", "not-separated"];

  // ---------- Approvals (step 7) ----------
  // approvals[] is the record; approval is its first entry's mirror. A build
  // that knows only approval (v0.7) edits that alone, so when the two
  // disagree the mirror is the later edit and wins for the first entry.
  function emptyApprovalEntry() { return { scope: "", name: "", role: "", organisation: "", date: "", revision: "", approved: false, fingerprint: "" }; }
  function mirrorOf(e) {
    e = e || {};
    return { name: e.name || "", role: e.role || "", date: e.date || "", statement: e.scope || "", approved: !!e.approved };
  }
  function sameMirror(a, b) {
    a = a || {}; b = b || {};
    return (a.name || "") === (b.name || "") && (a.role || "") === (b.role || "") && (a.date || "") === (b.date || "") &&
      (a.statement || "") === (b.statement || "") && !!a.approved === !!b.approved;
  }
  // The approvals as they stand, without changing the project.
  // An older build's edit (the mirror differs from the first entry) wins for
  // the first entry, with what that build cannot see kept straight: a new
  // name drops the earlier person's revision and fingerprint, an approval
  // taken back drops its fingerprint, and anything typed into an empty
  // sign-off starts an entry.
  function fromMirror(a) { return { scope: a.statement || "", name: a.name || "", role: a.role || "", date: a.date || "", approved: !!a.approved }; }
  function mirrorFilled(a) { return !!(a.name || a.role || a.date || a.statement || a.approved); }
  function approvalsOf(pj) {
    var a = (pj && pj.approval) || {};
    if (pj && Array.isArray(pj.approvals)) {
      var list = pj.approvals.map(function (e) { return Object.assign(emptyApprovalEntry(), e); });
      if (!sameMirror(mirrorOf(list[0]), a)) {
        if (!list.length) { if (mirrorFilled(a)) list.push(Object.assign(emptyApprovalEntry(), fromMirror(a))); }
        else {
          var was = list[0], e = Object.assign({}, was, fromMirror(a));
          if ((was.name || "") !== (a.name || "")) { e.revision = ""; e.fingerprint = ""; }
          if (!e.approved) e.fingerprint = "";
          list[0] = e;
        }
      }
      return list;
    }
    if (mirrorFilled(a)) return [Object.assign(emptyApprovalEntry(), fromMirror(a))];
    return [];
  }
  // Writes the list and keeps approval its first entry's mirror.
  function setApprovals(pj, list) {
    pj.approvals = list;
    var m = mirrorOf(list[0]);
    pj.approval = Object.assign(pj.approval || {}, m);
  }

  // reference: where the vulnerability is known from (a scan, an advisory, an observation).
  function emptyVulnerability(n) { return { id: "V" + n, description: "", reference: "" }; }
  // existing: in place when assessed. The plan fields (owner, priority, due
  // date, status) are for the additional ones; srRefs lists the 62443-3-3
  // system requirements it meets (reference stays free text).
  var CM_PRIORITIES = ["high", "medium", "low"];
  var CM_STATUSES = ["proposed", "agreed", "in-progress", "done"];
  var CM_STATUS_LABEL = { "proposed": "Proposed", "agreed": "Agreed", "in-progress": "In progress", "done": "Done" };
  var CM_PRIORITY_LABEL = { "high": "High", "medium": "Medium", "low": "Low" };
  function emptyCountermeasure(n) { return { id: "M" + n, description: "", addressesFR: [], reference: "", existing: false, owner: "", priority: "", dueDate: "", status: "", srRefs: [] }; }
  // An asset's id, for the threats that link it. Assets had none before 0.3.
  function nextAssetId(pj) {
    if (!pj.counters) pj.counters = {};
    pj.counters.asset = (typeof pj.counters.asset === "number" ? pj.counters.asset : 0) + 1;
    return "AS" + pj.counters.asset;
  }
  function newAsset(pj, a) { return Object.assign({ id: nextAssetId(pj) }, a || { name: "", type: "plc" }); }

  // True when the consultant has entered anything worth protecting — gates the
  // Load confirm so an untouched session opens a file without a needless nag.
  function projectHasContent(pj) {
    if (!pj) return false;
    var s = pj.suc || {}, r = pj.srs || {}, b = pj.basisOfAssessment || {};
    function any(a) { return Array.isArray(a) && a.length > 0; }
    var eng = pj.engagement || {};
    return !!(
      s.name || s.description || s.scopeStatement || any(s.assumptions) ||
      r.essentialFunctions || r.worstCase || r.adversaryClass || r.clientMatrixNote ||
      any(r.highLevelAssets) || any(r.knownThreats) || any(r.mandatorySecurityFunctions) || any(r.regulatory) ||
      any(b.interviews) || any(b.documents) || any(b.observations) ||
      eng.client || eng.consultant || eng.assessmentDate ||
      any(pj.zones) || any(pj.conduits) ||
      any(s.policies) || r.tolerableConfirmed || any(approvalsOf(pj)) ||
      pj.assessmentType || sectionEdits(pj.reportCustom) || (pj.review && any(pj.review.rounds))
    );
  }
  // A report section edited in either report.
  function sectionEdits(rc) {
    return !!rc && typeof rc === "object" && Object.keys(rc).some(function (doc) { var c = rc[doc]; return !!c && typeof c === "object" && Object.keys(c).length > 0; });
  }

  return {
    RULES: RULES, INTERCHANGE: INTERCHANGE, VERSION: VERSION, TOOL_ID: TOOL_ID,
    PROJECT_SCHEMA: PROJECT_SCHEMA, ACCEPTED_PROJECT_SCHEMAS: ACCEPTED_PROJECT_SCHEMAS,
    FRS: FRS, FR_IDS: FR_IDS, CATS: CATS, SEV: SEV, LIK: LIK, BANDS: BANDS, MODS: MODS,
    SIS_RULE: SIS_RULE, MISMATCH_RULE: MISMATCH_RULE, ASSET_TYPES: ASSET_TYPES, ASSET_LINKS: ASSET_LINKS,
    tolerableConfirmed: tolerableConfirmed, ZONE_TEXT_FIELDS: ZONE_TEXT_FIELDS, ZONE_LIST_FIELDS: ZONE_LIST_FIELDS,
    CONDUIT_DIRECTIONS: CONDUIT_DIRECTIONS, CONDUIT_MARKERS: CONDUIT_MARKERS, listOf: listOf,
    SEPARATION_ROWS: SEPARATION_ROWS, SEPARATION_ANSWERS: SEPARATION_ANSWERS,
    emptyApprovalEntry: emptyApprovalEntry, approvalMirror: mirrorOf, approvalsOf: approvalsOf, setApprovals: setApprovals,
    SEV_RANK: SEV_RANK, LIK_RANK: LIK_RANK, BAND_RANK: BAND_RANK, BAND_NAME: BAND_NAME, FR_NAME: FR_NAME,
    ZCR: ZCR, zcrOf: zcrOf, stageZcr: stageZcr, ZCR_COVERED: ZCR_COVERED, ZCR_LATER: ZCR_LATER,
    SECTION_KEY_ALIASES: SECTION_KEY_ALIASES, sectionKeyAlias: sectionKeyAlias,
    emptyProject: emptyProject, emptyHLA: emptyHLA, emptyInterview: emptyInterview,
    emptyDocument: emptyDocument, emptyObservation: emptyObservation, emptyFRVector: emptyFRVector,
    emptyZone: emptyZone, emptyConduit: emptyConduit, emptyThreat: emptyThreat,
    TREATMENT_DECISIONS: TREATMENT_DECISIONS, emptyTreatment: emptyTreatment,
    emptyVulnerability: emptyVulnerability, emptyCountermeasure: emptyCountermeasure,
    COUNTER_KEYS: COUNTER_KEYS, THREAT_TEXT_FIELDS: THREAT_TEXT_FIELDS, THREAT_LINK_FIELDS: THREAT_LINK_FIELDS,
    ACCEPTANCE_FIELDS: ACCEPTANCE_FIELDS, emptyAcceptanceDetail: emptyAcceptanceDetail,
    CM_PRIORITIES: CM_PRIORITIES, CM_STATUSES: CM_STATUSES, CM_STATUS_LABEL: CM_STATUS_LABEL, CM_PRIORITY_LABEL: CM_PRIORITY_LABEL,
    nextAssetId: nextAssetId, newAsset: newAsset,
    ASSESSMENT_TYPES: ASSESSMENT_TYPES, assessmentType: assessmentType, emptyDetailed: emptyDetailed,
    hlaIdsOf: hlaIdsOf, setHlaIds: setHlaIds,
    projectHasContent: projectHasContent
  };
}());
