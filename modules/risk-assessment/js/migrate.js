/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* migrate.js — a loaded project file brought to the shape this build uses.
 *
 * normaliseProject(data) runs three passes, in place, and returns data:
 *
 *  1. The ladder: one step per file format, oldest first, each taking a file
 *     from one schema to the next (today the one step is 0.1 -> 0.2). A file
 *     labelled 0.2 that still carries a 0.1 field (initialRisk, a scalar
 *     slTarget, a zone's consequences table) gets the 0.1 step too, as the
 *     single normaliser before it did.
 *  2. The shape fill: every field this build reads is there and of the right
 *     kind, and a threat saved before treatment decisions were recorded gets
 *     what the old build inferred, as an unconfirmed suggestion. Fields this
 *     build does not know are left alone, so a file from a later build keeps
 *     them through a load and a save.
 *  3. The dangling-id prune: a reference to a record that is not in the file
 *     (a zone's ranked system, a conduit's end) is cleared, never invented.
 *     An older build edits a file without maintaining the links a newer one
 *     added, so a link can outlive what it pointed at.
 *
 * Running it twice changes nothing the first run did not
 * (scripts/test-risk-migrate.html, on the frozen files in scripts/fixtures/).
 * The schema written stays spt-risk-project/0.2. Which schemas Load and the
 * autosave restore accept is Model.ACCEPTED_PROJECT_SCHEMAS; anything else is
 * refused before this runs.
 */
window.RiskApp = window.RiskApp || {};
window.RiskApp.Migrate = (function () {
  "use strict";

  var M = window.RiskApp.Model, E = window.RiskApp.Engine;
  var FR_IDS = M.FR_IDS, RULES = M.RULES, TREATMENT_DECISIONS = M.TREATMENT_DECISIONS;
  var V01 = "spt-risk-project/0.1", V02 = "spt-risk-project/0.2";

  function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }

  // An owner's per-FR SL-T vector, with every FR present.
  function fixVector(o) {
    if (!o.slTargetByFR || typeof o.slTargetByFR !== "object") o.slTargetByFR = M.emptyFRVector();
    FR_IDS.forEach(function (fr) { if (!(fr in o.slTargetByFR)) o.slTargetByFR[fr] = null; });
  }

  // ---------- 1. The ladder ----------

  // 0.1 -> 0.2: the requirements moved from initialRisk to srs, and the SL-T
  // became one target per foundational requirement.
  function up01to02(data) {
    if (data.srs == null) data.srs = M.emptyProject().srs;
    if (data.initialRisk && !data.srs.essentialFunctions && !data.srs.adversaryClass) {
      data.srs.adversaryClass = data.initialRisk.adversaryClass || null;
      data.srs.essentialFunctions = data.initialRisk.essentialFunctions || "";
      data.srs.worstCase = data.initialRisk.worstCase || "";
      data.srs.clientMatrix = !!data.initialRisk.clientMatrix;
      data.srs.clientMatrixNote = data.initialRisk.clientMatrixNote || "";
    }
    delete data.initialRisk;
    function scalarToVector(o) {
      fixVector(o);
      if (typeof o.slTarget === "number") { FR_IDS.forEach(function (fr) { if (o.slTargetByFR[fr] == null) o.slTargetByFR[fr] = o.slTarget; }); delete o.slTarget; }
    }
    (data.zones || []).forEach(function (z) { scalarToVector(z); delete z.consequences; });
    (data.conduits || []).forEach(scalarToVector);
    data.schema = V02;
  }

  var LADDER = [
    { from: V01, to: V02, up: up01to02 }
  ];

  function hasLegacyShape(data) {
    function scalar(o) { return o && typeof o.slTarget === "number"; }
    return ("initialRisk" in data) ||
      (data.zones || []).some(function (z) { return scalar(z) || (z && "consequences" in z); }) ||
      (data.conduits || []).some(scalar);
  }

  function climb(data) {
    var at = data.schema;
    if (at !== V01 && hasLegacyShape(data)) at = V01;
    LADDER.forEach(function (step) { if (at === step.from) { step.up(data); at = step.to; } });
    return data;
  }

  // ---------- 2. The shape fill ----------

  // Normalise one threat / countermeasure in place. A threat saved before
  // treatment decisions were recorded gets what the old build inferred, as a
  // suggestion for the consultant to confirm.
  function normThreat(t, owner, tolerable) {
    if (!Array.isArray(t.affectedFR)) t.affectedFR = [];
    ["acceptance", "residualLikelihood", "residualImpact"].forEach(function (k) { if (typeof t[k] !== "string") t[k] = ""; });
    var tr = t.treatment;
    if (!tr || typeof tr !== "object" || Array.isArray(tr)) {
      t.treatment = M.emptyTreatment();
      t.treatment.decision = owner ? E.suggestTreatment(owner, t, tolerable) : null;
      return;
    }
    if (TREATMENT_DECISIONS.indexOf(tr.decision) < 0) tr.decision = null;
    tr.confirmed = !!(tr.decision && tr.confirmed);
    if (typeof tr.reason !== "string") tr.reason = "";
  }
  function normCM(m) {
    if (!Array.isArray(m.addressesFR)) m.addressesFR = [];
    if (typeof m.existing !== "boolean") m.existing = false;
  }

  function fillShape(data) {
    var base = M.emptyProject();
    Object.keys(base).forEach(function (k) { if (data[k] == null) data[k] = base[k]; });
    ["knownThreats", "mandatorySecurityFunctions", "regulatory", "highLevelAssets"].forEach(function (k) { if (!Array.isArray(data.srs[k])) data.srs[k] = []; });
    if (!data.basisOfAssessment || typeof data.basisOfAssessment !== "object") data.basisOfAssessment = { interviews: [], documents: [], observations: [] };
    ["interviews", "documents", "observations"].forEach(function (k) { if (!Array.isArray(data.basisOfAssessment[k])) data.basisOfAssessment[k] = []; });
    if (!data.engagement || typeof data.engagement !== "object") data.engagement = { client: "", consultant: "", assessmentDate: "", revision: "", confidentiality: "", qaReviewBy: "" };
    ["client", "consultant", "assessmentDate", "revision", "confidentiality", "qaReviewBy"].forEach(function (k) { if (typeof data.engagement[k] !== "string") data.engagement[k] = ""; });
    if (!data.approval || typeof data.approval !== "object") data.approval = { name: "", role: "", date: "", statement: "", approved: false };
    ["name", "role", "date", "statement"].forEach(function (k) { if (typeof data.approval[k] !== "string") data.approval[k] = ""; });
    data.approval.approved = !!data.approval.approved;
    if (!data.counters) data.counters = base.counters;
    var loadTolerable = data.srs.tolerableRisk || RULES.tolerableRisk.default;
    ["zone", "conduit", "threat", "vuln", "cm", "hla", "interview", "document", "observation"].forEach(function (k) { if (typeof data.counters[k] !== "number") data.counters[k] = 0; });
    (data.zones || []).forEach(function (z) {
      var ez = M.emptyZone(0);
      Object.keys(ez).forEach(function (k) { if (z[k] == null) z[k] = ez[k]; });
      fixVector(z);
      z.countermeasures.forEach(normCM);
      z.threats.forEach(function (t) { normThreat(t, z, loadTolerable); });
    });
    (data.conduits || []).forEach(function (c) {
      var ec = M.emptyConduit(0);
      Object.keys(ec).forEach(function (k) { if (c[k] == null) c[k] = ec[k]; });
      fixVector(c);
      c.countermeasures.forEach(normCM);
      c.threats.forEach(function (t) { normThreat(t, c, loadTolerable); });
    });
    // The consultant's section overrides, one set per report (js/report-page.js).
    // Optional and additive, so the file format stays at this schema: a file
    // without them loads as before, and an older copy of the tool keeps them.
    if (data.reportCustom != null) {
      if (typeof data.reportCustom !== "object" || Array.isArray(data.reportCustom)) delete data.reportCustom;
      else ["detailed", "highLevel"].forEach(function (k) {
        var c = data.reportCustom[k];
        if (c != null && (typeof c !== "object" || Array.isArray(c))) { delete data.reportCustom[k]; return; }
        // A section whose heading has been reworded since the file was saved.
        if (c) Object.keys(c).forEach(function (key) {
          var now = M.sectionKeyAlias(key);
          if (now === key) return;
          if (c[now] == null) c[now] = c[key];
          delete c[key];
        });
      });
    }
    return data;
  }

  // ---------- 3. The dangling-id prune ----------

  // What each reference points at. A link field that only a later build
  // writes is pruned when present and left absent when not.
  function pruneDangling(data) {
    var hla = {}, zones = {};
    data.srs.highLevelAssets.forEach(function (a) { if (a && a.id) hla[a.id] = true; });
    data.zones.forEach(function (z) { if (z && z.id) zones[z.id] = true; });
    function idsOf(list) { var m = {}; (list || []).forEach(function (x) { if (x && x.id) m[x.id] = true; }); return m; }
    function keepKnown(arr, known) { return arr.filter(function (id) { return known[id]; }); }
    data.zones.forEach(function (z) {
      // The ranked system a zone was promoted from.
      if (z.fromHLA && !hla[z.fromHLA]) z.fromHLA = "";
      if (Array.isArray(z.hlaIds)) z.hlaIds = keepKnown(z.hlaIds, hla);
    });
    data.conduits.forEach(function (c) {
      // A conduit's ends: a zone in the file, or EXT (outside the SUC).
      ["fromZone", "toZone"].forEach(function (k) { if (c[k] && c[k] !== "EXT" && !zones[c[k]]) c[k] = ""; });
    });
    data.zones.concat(data.conduits).forEach(function (o) {
      var cms = idsOf(o.countermeasures), vulns = idsOf(o.vulnerabilities);
      o.threats.forEach(function (t) {
        if (Array.isArray(t.countermeasureIds)) t.countermeasureIds = keepKnown(t.countermeasureIds, cms);
        if (Array.isArray(t.vulnerabilityIds)) t.vulnerabilityIds = keepKnown(t.vulnerabilityIds, vulns);
      });
    });
    return data;
  }

  // ---------- All three ----------

  function normaliseProject(data) {
    climb(data);
    fillShape(data);
    pruneDangling(data);
    data.schema = M.PROJECT_SCHEMA;
    return data;
  }

  function accepts(schema) { return M.ACCEPTED_PROJECT_SCHEMAS.indexOf(schema) >= 0; }

  return {
    LADDER: LADDER, climb: climb, fillShape: fillShape, pruneDangling: pruneDangling,
    normaliseProject: normaliseProject, accepts: accepts
  };
}());
