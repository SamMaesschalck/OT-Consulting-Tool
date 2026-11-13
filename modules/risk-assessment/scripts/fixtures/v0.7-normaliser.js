/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* Frozen fixture: the project normaliser and the schema list of the released
 * v0.7.0 build (commit b2605e9, modules/risk-assessment/index.html), copied
 * as it was, so a test can show what an issued v0.7 copy (single file or exe)
 * does with a file a later build saved. Only the build's own globals are
 * passed in (the FR ids, the exposure modifiers and the default tolerable
 * risk from the rules file). Do not edit or regenerate: it stands for code
 * already in consultants' hands. Used by scripts/test-risk-nav.html. */
window.RiskFixtures = window.RiskFixtures || {};
window.RiskFixtures["v0.7-normaliser"] = function (FR_IDS, MODS, defaultTolerable) {
  var PROJECT_SCHEMA = "spt-risk-project/0.2";
  var ACCEPTED_PROJECT_SCHEMAS = ["spt-risk-project/0.1", "spt-risk-project/0.2"];
  var RULES = { tolerableRisk: { "default": defaultTolerable } };

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
        highLevelAssets: [],
        knownThreats: [],
        mandatorySecurityFunctions: [],
        regulatory: [],
        clientMatrix: false,
        clientMatrixNote: ""
      },
      engagement: { client: "", consultant: "", assessmentDate: "", revision: "", confidentiality: "", qaReviewBy: "" },
      basisOfAssessment: { interviews: [], documents: [], observations: [] },
      approval: { name: "", role: "", date: "", statement: "", approved: false },
      zones: [],
      conduits: [],
      counters: { zone: 0, conduit: 0, threat: 0, vuln: 0, cm: 0, hla: 0, interview: 0, document: 0, observation: 0 }
    };
  }

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
      fromHLA: ""
    };
  }

  function emptyConduit(n) {
    return {
      id: "C" + n, fromZone: "", toZone: "", name: "", channels: [], notes: "",
      threats: [], vulnerabilities: [], countermeasures: [],
      slTargetByFR: emptyFRVector(), justification: ""
    };
  }

  function normThreat(t) {
    if (!Array.isArray(t.affectedFR)) t.affectedFR = [];
    ["acceptance", "residualLikelihood", "residualImpact"].forEach(function (k) { if (typeof t[k] !== "string") t[k] = ""; });
  }
  function normCM(m) {
    if (!Array.isArray(m.addressesFR)) m.addressesFR = [];
    if (typeof m.existing !== "boolean") m.existing = false;
  }

  function normaliseProject(data) {
    var base = emptyProject();
    Object.keys(base).forEach(function (k) { if (data[k] == null) data[k] = base[k]; });
    if (data.initialRisk && !data.srs.essentialFunctions && !data.srs.adversaryClass) {
      data.srs.adversaryClass = data.initialRisk.adversaryClass || null;
      data.srs.essentialFunctions = data.initialRisk.essentialFunctions || "";
      data.srs.worstCase = data.initialRisk.worstCase || "";
      data.srs.clientMatrix = !!data.initialRisk.clientMatrix;
      data.srs.clientMatrixNote = data.initialRisk.clientMatrixNote || "";
    }
    delete data.initialRisk;
    ["knownThreats", "mandatorySecurityFunctions", "regulatory", "highLevelAssets"].forEach(function (k) { if (!Array.isArray(data.srs[k])) data.srs[k] = []; });
    if (!data.basisOfAssessment || typeof data.basisOfAssessment !== "object") data.basisOfAssessment = { interviews: [], documents: [], observations: [] };
    ["interviews", "documents", "observations"].forEach(function (k) { if (!Array.isArray(data.basisOfAssessment[k])) data.basisOfAssessment[k] = []; });
    if (!data.engagement || typeof data.engagement !== "object") data.engagement = { client: "", consultant: "", assessmentDate: "", revision: "", confidentiality: "", qaReviewBy: "" };
    ["client", "consultant", "assessmentDate", "revision", "confidentiality", "qaReviewBy"].forEach(function (k) { if (typeof data.engagement[k] !== "string") data.engagement[k] = ""; });
    if (!data.approval || typeof data.approval !== "object") data.approval = { name: "", role: "", date: "", statement: "", approved: false };
    ["name", "role", "date", "statement"].forEach(function (k) { if (typeof data.approval[k] !== "string") data.approval[k] = ""; });
    data.approval.approved = !!data.approval.approved;
    if (!data.counters) data.counters = base.counters;
    ["zone", "conduit", "threat", "vuln", "cm", "hla", "interview", "document", "observation"].forEach(function (k) { if (typeof data.counters[k] !== "number") data.counters[k] = 0; });
    (data.zones || []).forEach(function (z) {
      var ez = emptyZone(0);
      Object.keys(ez).forEach(function (k) { if (z[k] == null) z[k] = ez[k]; });
      if (!z.slTargetByFR || typeof z.slTargetByFR !== "object") z.slTargetByFR = emptyFRVector();
      FR_IDS.forEach(function (fr) { if (!(fr in z.slTargetByFR)) z.slTargetByFR[fr] = null; });
      if (typeof z.slTarget === "number") { FR_IDS.forEach(function (fr) { if (z.slTargetByFR[fr] == null) z.slTargetByFR[fr] = z.slTarget; }); delete z.slTarget; }
      delete z.consequences;
      z.threats.forEach(normThreat);
      z.countermeasures.forEach(normCM);
    });
    (data.conduits || []).forEach(function (c) {
      var ec = emptyConduit(0);
      Object.keys(ec).forEach(function (k) { if (c[k] == null) c[k] = ec[k]; });
      c.threats.forEach(normThreat);
      c.countermeasures.forEach(normCM);
      if (!c.slTargetByFR || typeof c.slTargetByFR !== "object") c.slTargetByFR = emptyFRVector();
      FR_IDS.forEach(function (fr) { if (!(fr in c.slTargetByFR)) c.slTargetByFR[fr] = null; });
      if (typeof c.slTarget === "number") { FR_IDS.forEach(function (fr) { if (c.slTargetByFR[fr] == null) c.slTargetByFR[fr] = c.slTarget; }); delete c.slTarget; }
    });
    if (data.reportCustom != null) {
      if (typeof data.reportCustom !== "object" || Array.isArray(data.reportCustom)) delete data.reportCustom;
      else ["detailed", "highLevel"].forEach(function (k) {
        var c = data.reportCustom[k];
        if (c != null && (typeof c !== "object" || Array.isArray(c))) delete data.reportCustom[k];
      });
    }
    data.schema = PROJECT_SCHEMA;
    return data;
  }

  // What v0.7's Load and autosave restore ask before normalising.
  function accepts(schema) { return ACCEPTED_PROJECT_SCHEMAS.indexOf(schema) >= 0; }

  return { normaliseProject: normaliseProject, accepts: accepts, PROJECT_SCHEMA: PROJECT_SCHEMA };
};
