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
 *     The fields phase 3a added (assessmentType, lastStage, a zone's hlaIds
 *     and initialRisk, a conduit's initialRisk, detailed on zones, conduits
 *     and ranked systems) are tidied when present and never added, and so
 *     are phase 3b's (the confirmed tolerable risk, organisational policies,
 *     zone and conduit characteristics, separation answers, an asset's
 *     connection, approvals). Where approvals[] is present, approval stays its
 *     first entry's mirror; one an older build edited wins for that entry.
 *  3. The dangling-id prune: a reference to a record that is not in the file
 *     (a zone's ranked systems, a conduit's end) is cleared, never invented.
 *     An older build edits a file without maintaining the links a newer one
 *     added, so a link can outlive what it pointed at. A zone's fromHLA is
 *     kept the first of its hlaIds; one an older build wrote goes first.
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

  // The fields phase 3a added (js/model.js), tidied when present and never
  // added when absent, so a v0.7 file comes through as it was saved.
  function isBand(v) { return typeof v === "string" && M.BAND_RANK[v] != null; }
  function normDetailed(o) {
    if (!("detailed" in o)) return;
    var d = o.detailed;
    if (!d || typeof d !== "object" || Array.isArray(d)) { delete o.detailed; return; }
    if (d.required !== true && d.required !== false) d.required = null;
    if (typeof d.reason !== "string") d.reason = "";
  }
  function normInitial(o) {
    if ("initialRisk" in o && !isBand(o.initialRisk)) delete o.initialRisk;
  }
  function normNew(data) {
    if ("assessmentType" in data && M.ASSESSMENT_TYPES.indexOf(data.assessmentType) < 0) delete data.assessmentType;
    if ("lastStage" in data && (typeof data.lastStage !== "string" || !/^[a-z]+$/.test(data.lastStage))) delete data.lastStage;
    data.srs.highLevelAssets.forEach(function (a) { if (a && typeof a === "object") normDetailed(a); });
    (data.zones || []).forEach(function (z) {
      if ("hlaIds" in z && !Array.isArray(z.hlaIds)) delete z.hlaIds;
      if (Array.isArray(z.hlaIds)) z.hlaIds = z.hlaIds.filter(function (id) { return typeof id === "string" && id; });
      normInitial(z); normDetailed(z);
    });
    (data.conduits || []).forEach(function (c) { normInitial(c); normDetailed(c); });
    normNew3b(data);
  }

  // The fields phase 3b added (js/model.js), tidied when present and never
  // added when absent.
  function isStr(v) { return typeof v === "string"; }
  function normText(o, k) { if (k in o && !isStr(o[k])) delete o[k]; }
  function normLines(o, k) {
    if (!(k in o)) return;
    if (!Array.isArray(o[k])) { delete o[k]; return; }
    o[k] = o[k].filter(function (x) { return isStr(x) && x; });
  }
  function normNew3b(data) {
    var s = data.srs;
    if ("tolerableConfirmed" in s && !isBand(s.tolerableConfirmed)) delete s.tolerableConfirmed;
    if (data.suc && typeof data.suc === "object") normLines(data.suc, "policies");
    (data.zones || []).forEach(function (z) {
      M.ZONE_TEXT_FIELDS.forEach(function (k) { normText(z, k); });
      M.ZONE_LIST_FIELDS.forEach(function (k) { normLines(z, k); });
      if ("separation" in z) {
        var sep = z.separation;
        if (!isObj(sep)) delete z.separation;
        else Object.keys(sep).forEach(function (k) {
          var r = sep[k];
          if (!isObj(r) || M.SEPARATION_ANSWERS.indexOf(r.answer) < 0 && r.answer != null) { delete sep[k]; return; }
          if (r.answer == null) r.answer = null;
          if (!isStr(r.reason)) r.reason = "";
        });
      }
      (z.assets || []).forEach(function (a) { if (a && "link" in a && M.ASSET_LINKS.indexOf(a.link) < 0) delete a.link; });
    });
    (data.conduits || []).forEach(function (c) {
      normLines(c, "boundaryDevices");
      normText(c, "externalParty");
      if ("direction" in c && M.CONDUIT_DIRECTIONS.indexOf(c.direction) < 0) delete c.direction;
      M.CONDUIT_MARKERS.forEach(function (k) { if (k in c && c[k] !== true) delete c[k]; });
    });
    if ("approvals" in data) {
      if (!Array.isArray(data.approvals)) delete data.approvals;
      else {
        data.approvals = data.approvals.filter(isObj).map(function (e) {
          ["scope", "name", "role", "organisation", "date", "revision", "fingerprint"].forEach(function (k) { if (!isStr(e[k])) e[k] = ""; });
          e.approved = !!e.approved;
          return e;
        });
        // v0.7 edits approval alone: the later edit wins for the first entry.
        M.setApprovals(data, M.approvalsOf(data));
      }
    }
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
    normNew(data);
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
      // The ranked systems assigned to a zone. fromHLA is the first of them,
      // kept for v0.7 and the risk context; an older build that edits the file
      // writes fromHLA only, so a fromHLA missing from the list goes first.
      if (z.fromHLA && !hla[z.fromHLA]) z.fromHLA = "";
      if (Array.isArray(z.hlaIds)) {
        var ids = keepKnown(z.hlaIds, hla), seen = {};
        if (z.fromHLA && ids.indexOf(z.fromHLA) < 0) ids.unshift(z.fromHLA);
        z.hlaIds = ids.filter(function (id) { if (seen[id]) return false; seen[id] = true; return true; });
        z.fromHLA = z.hlaIds[0] || "";
      }
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
