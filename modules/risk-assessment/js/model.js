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

  // ---------- The risk criteria (phase 5) ----------
  // project.criteria is absent until the consultant changes the criteria on
  // step 1, and is then seeded from the house rules: the likelihood and
  // impact levels the client uses (lowest first, 3 to 5 of each, with a
  // one-line definition), the consequence categories, the matrix (each impact
  // x likelihood cell one of the four fixed bands, which stay the output
  // vocabulary) and, optionally, a tolerable band per consequence category
  // (tolerableByCategory). The general tolerable risk stays srs.tolerableRisk.
  // A file without criteria reads the house criteria, exactly as before.
  // Everything that reads the matrix or the scales goes through criteriaOf;
  // the engine's riskFor reads the stored shape directly, as it is hot.
  //
  //   project.criteria  { likelihood: [{ id, name, note }], impact: [...],
  //                       matrix: { impactId: { likelihoodId: band } },
  //                       categories: [{ id, name }], tolerableByCategory: { catId: band },
  //                       preset: the last preset applied (house, 3x3, 4x4, 5x5) }
  //   threat.impactByCategory       { catId: impact level id }; the threat's
  //                                 impact mirrors the worst of them
  //   rankedSystem.consequenceByCategory   the same for a ranked system's consequence
  //   rankedSystem.consequenceSource       where the consequence rating comes from
  var LEVEL_MIN = 3, LEVEL_MAX = 5;
  var CONSEQUENCE_SOURCES = ["HAZOP", "LOPA", "Business impact analysis", "Interview", "Site walk-down"];
  function plainNote(s) { s = String(s || "").replace(/^House default:\s*/i, ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function houseCriteria() {
    function lv(arr) { return arr.map(function (x) { return { id: x.id, name: x.name, note: plainNote(x.note) }; }); }
    var m = {};
    SEV.forEach(function (s) { m[s.id] = {}; LIK.forEach(function (l) { m[s.id][l.id] = RULES.riskMatrix[s.id][l.id]; }); });
    return { likelihood: lv(LIK), impact: lv(SEV), matrix: m, categories: CATS.map(function (c) { return { id: c.id, name: c.name }; }) };
  }
  // The generic shapes offered beside the house matrix. Their levels, words
  // and cells are the tool's own (a band from the sum of the two positions on
  // their scales), not any published example matrix.
  var PRESETS = [
    { id: "house", label: "SolutionsPT house criteria" },
    { id: "3x3", label: "Three levels each" },
    { id: "4x4", label: "Four levels each" },
    { id: "5x5", label: "Five levels each" }
  ];
  var GENERIC_LIKELIHOOD = {
    rare: ["Rare", "Not expected over the life of the system."],
    unlikely: ["Unlikely", "Needs an unusual mix of access, skill and intent."],
    possible: ["Possible", "Could happen over the life of the system, as the access and the means exist."],
    likely: ["Likely", "Expected without further action, as the path is exposed or used against similar sites."],
    certain: ["Almost certain", "Already seen here, or the path is open and actively targeted."]
  };
  var GENERIC_IMPACT = {
    negligible: ["Negligible", "No lasting effect on people, the plant, the environment or the business."],
    minor: ["Minor", "First aid, a short outage or a small cost, recovered within a shift."],
    moderate: ["Moderate", "An injury, a reportable event, a multi-shift outage or a material cost."],
    major: ["Major", "Serious injury, a significant release, loss of an essential function or a large cost."],
    critical: ["Critical", "Loss of life, a major release, or loss the business may not recover from."]
  };
  var GENERIC_ORDER = {
    3: { likelihood: ["unlikely", "possible", "likely"], impact: ["minor", "moderate", "major"] },
    4: { likelihood: ["rare", "unlikely", "possible", "likely"], impact: ["minor", "moderate", "major", "critical"] },
    5: { likelihood: ["rare", "unlikely", "possible", "likely", "certain"], impact: ["negligible", "minor", "moderate", "major", "critical"] }
  };
  function genericBand(i, nI, l, nL) {
    var s = i / (nI - 1) + l / (nL - 1);
    return s < 0.6 ? "low" : s < 1.1 ? "medium" : s < 1.6 ? "high" : "very-high";
  }
  // A preset's criteria, ready to store; null for an unknown id. Generic
  // levels have positional ids (L1.., I1..), so no word is mistaken for the
  // same word on another scale.
  function presetCriteria(id) {
    if (id === "house") { var hc = houseCriteria(); hc.preset = "house"; return hc; }
    var n = { "3x3": 3, "4x4": 4, "5x5": 5 }[id];
    if (!n) return null;
    var ord = GENERIC_ORDER[n];
    var L = ord.likelihood.map(function (k, i) { return { id: "L" + (i + 1), name: GENERIC_LIKELIHOOD[k][0], note: GENERIC_LIKELIHOOD[k][1] }; });
    var I = ord.impact.map(function (k, i) { return { id: "I" + (i + 1), name: GENERIC_IMPACT[k][0], note: GENERIC_IMPACT[k][1] }; });
    var m = {};
    I.forEach(function (iv, i) { m[iv.id] = {}; L.forEach(function (lv, l) { m[iv.id][lv.id] = genericBand(i, n, l, n); }); });
    return { likelihood: L, impact: I, matrix: m, categories: CATS.map(function (c) { return { id: c.id, name: c.name }; }), preset: id };
  }
  function isLevelList(a) {
    if (!Array.isArray(a) || a.length < LEVEL_MIN || a.length > LEVEL_MAX) return false;
    var seen = {};
    return a.every(function (x) { if (!x || typeof x.id !== "string" || !x.id || seen[x.id]) return false; seen[x.id] = true; return true; });
  }
  // The stored criteria are usable: both scales of 3 to 5 levels with ids,
  // and a matrix object. Anything else reads as the house criteria.
  function criteriaUsable(c) {
    return !!c && typeof c === "object" && !Array.isArray(c) && isLevelList(c.likelihood) && isLevelList(c.impact) && !!c.matrix && typeof c.matrix === "object";
  }
  function levelKey(a) { return a.map(function (x) { return [x.id, x.name || "", x.note || ""]; }); }
  function criteriaContent(c) {
    var cells = c.impact.map(function (iv) { return c.likelihood.map(function (lv) { var r = c.matrix[iv.id]; return (r && r[lv.id]) || ""; }); });
    return JSON.stringify([levelKey(c.likelihood), levelKey(c.impact), cells, (c.categories || []).map(function (x) { return [x.id, x.name || ""]; })]);
  }
  var HOUSE_CONTENT = null;
  function isHouseContent(c) {
    if (HOUSE_CONTENT == null) HOUSE_CONTENT = criteriaContent(houseCriteria());
    return criteriaContent(c) === HOUSE_CONTENT;
  }
  // The generic preset (3x3, 4x4 or 5x5) the project's stored criteria still
  // are, levels, definitions and cells unchanged, or "" (the categories are
  // left out: a preset keeps the project's own).
  function scalesContent(c) { return JSON.stringify(JSON.parse(criteriaContent(c)).slice(0, 3)); }
  var GENERIC_CONTENT = null;
  function genericPresetOf(pj) {
    var c = pj && criteriaUsable(pj.criteria) ? pj.criteria : null;
    if (!c) return "";
    if (!GENERIC_CONTENT) { GENERIC_CONTENT = {}; ["3x3", "4x4", "5x5"].forEach(function (id) { GENERIC_CONTENT[id] = scalesContent(presetCriteria(id)); }); }
    var mine = scalesContent(c);
    return Object.keys(GENERIC_CONTENT).filter(function (id) { return GENERIC_CONTENT[id] === mine; })[0] || "";
  }
  // The criteria in use, normalised for reading:
  //   likelihood, impact   [{ id, name, note, rank }], lowest first
  //   categories           [{ id, name, tolerable (band or null) }]
  //   matrix               impact id -> likelihood id -> band
  //   tolerableByCategory  category id -> band, only those set and known
  //   stored               the project holds its own copy
  //   isHouse              the levels, matrix and categories are the house's
  //   source               "client" (the client's criteria are marked in use),
  //                        "house" or "project" (changed for this assessment)
  function criteriaOf(pj) {
    var raw = pj && criteriaUsable(pj.criteria) ? pj.criteria : null;
    var c = raw || houseCriteria();
    function levels(arr) { return arr.map(function (x, i) { return { id: x.id, name: String(x.name || "").trim() || x.id, note: String(x.note || ""), rank: i }; }); }
    var catSeen = {};
    var cats = (Array.isArray(c.categories) ? c.categories : []).filter(function (x) {
      if (!x || typeof x.id !== "string" || !x.id || catSeen[x.id]) return false; catSeen[x.id] = true; return true;
    });
    var tbc = {}, rawT = raw && raw.tolerableByCategory && typeof raw.tolerableByCategory === "object" ? raw.tolerableByCategory : {};
    cats.forEach(function (x) { if (BAND_RANK[rawT[x.id]] != null) tbc[x.id] = rawT[x.id]; });
    var isHouse = !raw || isHouseContent(c);
    var client = !!(pj && pj.srs && pj.srs.clientMatrix);
    return {
      likelihood: levels(c.likelihood), impact: levels(c.impact), matrix: c.matrix,
      categories: cats.map(function (x) { return { id: x.id, name: String(x.name || "").trim() || x.id, tolerable: tbc[x.id] || null }; }),
      tolerableByCategory: tbc, hasCategoryTolerable: Object.keys(tbc).length > 0,
      stored: !!raw, isHouse: isHouse, source: client ? "client" : (isHouse ? "house" : "project"),
      preset: raw && typeof raw.preset === "string" ? raw.preset : (raw ? "" : "house")
    };
  }
  // The project's own copy of the criteria, made from the house's on the
  // first change.
  function ensureCriteria(pj) {
    if (!criteriaUsable(pj.criteria)) pj.criteria = houseCriteria();
    if (!Array.isArray(pj.criteria.categories)) pj.criteria.categories = [];
    return pj.criteria;
  }
  // A new level or category id not yet used in the list, nor among taken
  // (ids a rating still holds after its level or category was removed, so
  // such a rating never re-attaches to a new one).
  function freshId(list, prefix, taken) {
    var n = list.length + 1, ids = list.map(function (x) { return x.id; }).concat(taken || []);
    while (ids.indexOf(prefix + n) >= 0) n++;
    return prefix + n;
  }

  // ---------- Phase 5b: the safety floor list and drawing levels ----------
  // Optional and written only once set, like the fields above.
  //
  //   project.safetyFloorFR  the foundational requirements the safety floor
  //                          applies to, when narrowed from the rules file's
  //                          floorFR (absent: the rules' list, all seven by
  //                          default, so results are as before). Never wider.
  //   zone.level             a band of the house layering (ZONE_LEVELS); with
  //                          one set the drawing lays the zones out in bands
  //   zone.levelOrder        the zone's place within its band (the nudge)
  //   threat.libraryId       the house scenario a draft scenario was added
  //                          from (provenance only; printed nowhere)
  function houseFloorFR() {
    var list = SIS_RULE && Array.isArray(SIS_RULE.floorFR) ? SIS_RULE.floorFR : FR_IDS;
    return FR_IDS.filter(function (fr) { return list.indexOf(fr) >= 0; });
  }
  function safetyFloorFR(pj) {
    var house = houseFloorFR();
    if (pj && Array.isArray(pj.safetyFloorFR)) return house.filter(function (fr) { return pj.safetyFloorFR.indexOf(fr) >= 0; });
    return house;
  }
  // Stores the list in FR order, and drops it when it is the house's again.
  function setSafetyFloorFR(pj, list) {
    var house = houseFloorFR(), out = house.filter(function (fr) { return list.indexOf(fr) >= 0; });
    if (out.length === house.length) delete pj.safetyFloorFR; else pj.safetyFloorFR = out;
  }
  // The house layering the drawing's bands follow, top to bottom. A house
  // convention for laying out the drawing, not a model taken from a standard.
  var ZONE_LEVELS = [
    { id: "enterprise", name: "Enterprise" },
    { id: "dmz", name: "DMZ" },
    { id: "supervisory", name: "Supervisory" },
    { id: "control", name: "Control" },
    { id: "safety", name: "Safety" },
    { id: "field", name: "Field" }
  ];
  function zoneLevel(z) { return z && ZONE_LEVELS.some(function (l) { return l.id === z.level; }) ? z.level : null; }

  // The house scenario library (data/scenario-library.json), when loaded.
  var LIBRARY = (window.App.Data && window.App.Data.scenarioLibrary) || null;

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

  // ---------- Phase 6a: the asset register and the previous assessment ----------
  // Optional and written only once set, like the fields above.
  //
  //   asset.tag, vendor, model, version, location, owner, notes   text
  //   asset.criticality      "high" | "medium" | "low"
  //   project.baseline       the previous assessment this one is compared with
  //                          (js/compare.js): { fileName, savedOn, assessmentDate,
  //                          revision, approvedOn, sucName, loadedOn, facts }, facts
  //                          being the frozen copy of what is compared. It never
  //                          changes anything else in the project.
  var ASSET_TEXT_FIELDS = ["tag", "vendor", "model", "version", "location", "owner", "notes"];
  var ASSET_CRITICALITY = ["high", "medium", "low"];
  var ASSET_CRITICALITY_LABEL = { high: "High", medium: "Medium", low: "Low" };
  // The register's columns, in the order the register and Word print them.
  var ASSET_FIELD_LABEL = {
    zone: "Zone", name: "Name", type: "Type", link: "Connection", tag: "Tag or hostname", vendor: "Vendor", model: "Model",
    version: "Firmware or software version", location: "Location", criticality: "Criticality", owner: "Owner", notes: "Notes"
  };
  // Whether an asset has any of the register's own attributes.
  function assetExtended(a) {
    return !!a && (ASSET_TEXT_FIELDS.some(function (k) { return typeof a[k] === "string" && a[k].trim(); }) || ASSET_CRITICALITY.indexOf(a.criticality) >= 0);
  }

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
      pj.assessmentType || sectionEdits(pj.reportCustom) || (pj.review && any(pj.review.rounds)) ||
      criteriaUsable(pj.criteria) || Array.isArray(pj.safetyFloorFR) ||
      !!(pj.baseline && typeof pj.baseline === "object")
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
    LEVEL_MIN: LEVEL_MIN, LEVEL_MAX: LEVEL_MAX, PRESETS: PRESETS, CONSEQUENCE_SOURCES: CONSEQUENCE_SOURCES,
    houseCriteria: houseCriteria, presetCriteria: presetCriteria, criteriaUsable: criteriaUsable,
    criteriaOf: criteriaOf, ensureCriteria: ensureCriteria, freshId: freshId, isHouseContent: isHouseContent,
    criteriaContent: criteriaContent, genericPresetOf: genericPresetOf,
    houseFloorFR: houseFloorFR, safetyFloorFR: safetyFloorFR, setSafetyFloorFR: setSafetyFloorFR,
    ZONE_LEVELS: ZONE_LEVELS, zoneLevel: zoneLevel, LIBRARY: LIBRARY,
    ASSET_TEXT_FIELDS: ASSET_TEXT_FIELDS, ASSET_CRITICALITY: ASSET_CRITICALITY, ASSET_CRITICALITY_LABEL: ASSET_CRITICALITY_LABEL,
    ASSET_FIELD_LABEL: ASSET_FIELD_LABEL, assetExtended: assetExtended,
    projectHasContent: projectHasContent
  };
}());
