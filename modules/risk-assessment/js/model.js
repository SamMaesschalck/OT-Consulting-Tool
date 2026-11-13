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
  var PROJECT_SCHEMA = "spt-risk-project/0.2";
  var ACCEPTED_PROJECT_SCHEMAS = ["spt-risk-project/0.1", "spt-risk-project/0.2"];

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

  var ASSET_TYPES = ["plc", "safety-plc", "hmi", "historian", "engineering-workstation", "server", "network", "other"];

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
      counters: { zone: 0, conduit: 0, threat: 0, vuln: 0, cm: 0, hla: 0, interview: 0, document: 0, observation: 0 }
    };
  }

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
      fromHLA: ""   // id of the ranked system this zone was promoted from, if any
    };
  }

  function emptyConduit(n) {
    return {
      id: "C" + n, fromZone: "", toZone: "", name: "", channels: [], notes: "",
      threats: [], vulnerabilities: [], countermeasures: [],
      slTargetByFR: emptyFRVector(), justification: ""
    };
  }

  function emptyThreat(n) {
    return { id: "T" + n, statement: "", source: "", affectedFR: [], likelihood: "", impact: "", residualLikelihood: "", residualImpact: "", acceptance: "", treatment: emptyTreatment() };
  }
  // The consultant's treatment decision for a threat above tolerable risk.
  // decision: "reduce" | "accept" | "slt" | null. An unconfirmed decision is
  // only a suggestion and is never printed or exported as fact. The reason
  // for "accept" is the threat's acceptance text; reason holds any other.
  var TREATMENT_DECISIONS = ["reduce", "accept", "slt"];
  function emptyTreatment() { return { decision: null, confirmed: false, reason: "" }; }

  function emptyVulnerability(n) { return { id: "V" + n, description: "" }; }
  function emptyCountermeasure(n) { return { id: "M" + n, description: "", addressesFR: [], reference: "", existing: false }; }

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
      any(pj.zones) || any(pj.conduits)
    );
  }

  return {
    RULES: RULES, INTERCHANGE: INTERCHANGE, VERSION: VERSION, TOOL_ID: TOOL_ID,
    PROJECT_SCHEMA: PROJECT_SCHEMA, ACCEPTED_PROJECT_SCHEMAS: ACCEPTED_PROJECT_SCHEMAS,
    FRS: FRS, FR_IDS: FR_IDS, CATS: CATS, SEV: SEV, LIK: LIK, BANDS: BANDS, MODS: MODS,
    SIS_RULE: SIS_RULE, MISMATCH_RULE: MISMATCH_RULE, ASSET_TYPES: ASSET_TYPES,
    SEV_RANK: SEV_RANK, LIK_RANK: LIK_RANK, BAND_RANK: BAND_RANK, BAND_NAME: BAND_NAME, FR_NAME: FR_NAME,
    ZCR: ZCR, zcrOf: zcrOf, stageZcr: stageZcr, ZCR_COVERED: ZCR_COVERED, ZCR_LATER: ZCR_LATER,
    SECTION_KEY_ALIASES: SECTION_KEY_ALIASES, sectionKeyAlias: sectionKeyAlias,
    emptyProject: emptyProject, emptyHLA: emptyHLA, emptyInterview: emptyInterview,
    emptyDocument: emptyDocument, emptyObservation: emptyObservation, emptyFRVector: emptyFRVector,
    emptyZone: emptyZone, emptyConduit: emptyConduit, emptyThreat: emptyThreat,
    TREATMENT_DECISIONS: TREATMENT_DECISIONS, emptyTreatment: emptyTreatment,
    emptyVulnerability: emptyVulnerability, emptyCountermeasure: emptyCountermeasure,
    projectHasContent: projectHasContent
  };
}());
