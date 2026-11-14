/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* migrate.js — a loaded project file brought to the shape this build uses.
 *
 * normaliseProject(data) runs three passes, in place, and returns data:
 *
 *  1. The ladder: one step per file format, oldest first, each taking a file
 *     from one schema to the next (0.1 -> 0.2, then 0.2 -> 0.3). A file
 *     labelled 0.2 that still carries a 0.1 field (initialRisk, a scalar
 *     slTarget, a zone's consequences table) gets the 0.1 step too, as the
 *     single normaliser before it did. The 0.2 -> 0.3 step turns what the old
 *     requirement match covered into suggested links (never links), and
 *     copies the residual pair to the current rating only when every matched
 *     countermeasure is already in place.
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
 *     The 0.3 fields of threats, countermeasures and vulnerabilities are
 *     filled (empty strings and lists), and every asset gets an id.
 *     Phase 5's fields (the project's risk criteria, a threat's impact and a
 *     ranked system's consequence per category, a ranked system's
 *     consequence source) are tidied when present and never added: a file
 *     without criteria reads the house criteria, as before. So are phase
 *     5b's (the project's safety floor list, a zone's drawing level and place
 *     in its band, a threat's library id), and phase 6a's (an asset's
 *     register attributes, the previous assessment compared with).
 *  3. The dangling-id prune: a reference to a record that is not in the file
 *     (a zone's ranked systems, a conduit's end, a threat's linked assets,
 *     vulnerabilities and countermeasures) is cleared, never invented.
 *     An older build edits a file without maintaining the links a newer one
 *     added, so a link can outlive what it pointed at. A zone's fromHLA is
 *     kept the first of its hlaIds; one an older build wrote goes first.
 *
 * Running it twice changes nothing the first run did not
 * (scripts/test-risk-migrate.html, on the frozen files in scripts/fixtures/).
 * The schema written is spt-risk-project/0.3. Which schemas Load and the
 * autosave restore accept is Model.ACCEPTED_PROJECT_SCHEMAS; anything else is
 * refused before this runs.
 */
window.RiskApp = window.RiskApp || {};
window.RiskApp.Migrate = (function () {
  "use strict";

  var M = window.RiskApp.Model, E = window.RiskApp.Engine;
  var FR_IDS = M.FR_IDS, RULES = M.RULES, TREATMENT_DECISIONS = M.TREATMENT_DECISIONS;
  var V01 = "spt-risk-project/0.1", V02 = "spt-risk-project/0.2", V03 = "spt-risk-project/0.3";

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

  // 0.2 -> 0.3: links become the record of coverage, and a threat has three
  // ratings. Links are never invented: what the old requirement match covered
  // becomes suggested links (suggestedCountermeasureIds), unconfirmed until
  // the consultant confirms them. The residual pair now means "after planned
  // measures"; it is copied to the current rating only when every matched
  // countermeasure is already in place (with one still planned, what it rated
  // is not today's position). With nothing matched it is not copied: nothing
  // is invented, and with no planned countermeasure linked the planned rating
  // is already the one that stands today (engine.js threatTreatment, today),
  // so the report does not promise planned countermeasures that do not exist.
  function up02to03(data) {
    (data.zones || []).concat(data.conduits || []).forEach(function (o) {
      if (!o || !Array.isArray(o.threats)) return;
      if (!Array.isArray(o.countermeasures)) o.countermeasures = [];
      o.threats.forEach(function (t) {
        if (!isObj(t)) return;
        if (!Array.isArray(t.affectedFR)) t.affectedFR = [];
        o.countermeasures.forEach(function (m) { if (m && !Array.isArray(m.addressesFR)) m.addressesFR = []; });
        var matched = E.suggestLinks(o, t);
        var linked = Array.isArray(t.countermeasureIds) ? t.countermeasureIds : [];
        var sug = matched.filter(function (id) { return linked.indexOf(id) < 0; });
        if (sug.length) t.suggestedCountermeasureIds = sug;
        var hasResidual = isStr(t.residualLikelihood) && t.residualLikelihood || isStr(t.residualImpact) && t.residualImpact;
        var hasCurrent = t.currentLikelihood || t.currentImpact;
        var allInPlace = matched.length > 0 && matched.every(function (id) {
          var m = o.countermeasures.filter(function (x) { return x && x.id === id; })[0];
          return !!(m && m.existing === true);
        });
        if (hasResidual && !hasCurrent && allInPlace) {
          t.currentLikelihood = t.residualLikelihood || "";
          t.currentImpact = t.residualImpact || "";
        }
      });
    });
    data.schema = V03;
  }

  var LADDER = [
    { from: V01, to: V02, up: up01to02 },
    { from: V02, to: V03, up: up02to03 }
  ];

  function hasLegacyShape(data) {
    function scalar(o) { return o && typeof o.slTarget === "number"; }
    return ("initialRisk" in data) ||
      (data.zones || []).some(function (z) { return scalar(z) || (z && "consequences" in z); }) ||
      (data.conduits || []).some(scalar);
  }

  function climb(data) {
    var at = data.schema;
    // A file that still carries a 0.1 field takes the 0.1 step; a 0.3 file
    // only that step (it does not go through 0.2 to 0.3 again).
    if (at !== V01 && hasLegacyShape(data)) {
      if (at === V03) { up01to02(data); data.schema = V03; return data; }
      at = V01;
    }
    LADDER.forEach(function (step) { if (at === step.from) { step.up(data); at = step.to; } });
    return data;
  }

  // ---------- 2. The shape fill ----------

  // Normalise one threat / countermeasure in place. A threat saved before
  // treatment decisions were recorded gets what the old build inferred, as a
  // suggestion for the consultant to confirm.
  function strList(v) { return Array.isArray(v) ? v.filter(function (x) { return typeof x === "string" && x; }) : []; }
  function normThreat(t, owner, tolerable, data) {
    if (!Array.isArray(t.affectedFR)) t.affectedFR = [];
    normCategoryMap(t, "impactByCategory");
    // The 0.3 fields: every text field a string, every link list a list of ids.
    M.THREAT_TEXT_FIELDS.forEach(function (k) { if (typeof t[k] !== "string") t[k] = ""; });
    M.THREAT_LINK_FIELDS.forEach(function (k) { t[k] = strList(t[k]); });
    if ("suggestedCountermeasureIds" in t) {
      t.suggestedCountermeasureIds = strList(t.suggestedCountermeasureIds);
      if (!t.suggestedCountermeasureIds.length) delete t.suggestedCountermeasureIds;
    }
    var ad = isObj(t.acceptanceDetail) ? t.acceptanceDetail : {};
    M.ACCEPTANCE_FIELDS.forEach(function (k) { if (typeof ad[k] !== "string") ad[k] = ""; });
    t.acceptanceDetail = ad;
    var tr = t.treatment;
    if (!tr || typeof tr !== "object" || Array.isArray(tr)) {
      t.treatment = M.emptyTreatment();
      t.treatment.decision = owner ? E.suggestTreatment(owner, t, tolerable, data) : null;
      return;
    }
    if (TREATMENT_DECISIONS.indexOf(tr.decision) < 0) tr.decision = null;
    tr.confirmed = !!(tr.decision && tr.confirmed);
    if (typeof tr.reason !== "string") tr.reason = "";
  }
  function normCM(m) {
    if (!Array.isArray(m.addressesFR)) m.addressesFR = [];
    if (typeof m.existing !== "boolean") m.existing = false;
    ["owner", "dueDate", "reference"].forEach(function (k) { if (typeof m[k] !== "string") m[k] = ""; });
    if (M.CM_PRIORITIES.indexOf(m.priority) < 0) m.priority = "";
    if (M.CM_STATUSES.indexOf(m.status) < 0) m.status = "";
    m.srRefs = strList(m.srRefs);
  }
  function normVuln(v) {
    if (typeof v.description !== "string") v.description = "";
    if (typeof v.reference !== "string") v.reference = "";
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

  // The fields phase 5 added (js/model.js), tidied when present and never
  // added. The risk criteria: a copy that cannot be read (a scale of fewer
  // than 3 or more than 5 levels, an id missing or repeated, no matrix) goes,
  // as it already reads as the house criteria; a matrix cell that is not one
  // of the four bands is dropped (a rating there has no band). A category map
  // keeps only text values, and goes when empty; a rating on a category or a
  // level the criteria do not have is kept, and the completeness list says it
  // no longer fits. Nothing here changes a rating.
  function normCriteria(data) {
    if (!("criteria" in data)) return;
    var c = data.criteria;
    if (!M.criteriaUsable(c)) { delete data.criteria; return; }
    [c.likelihood, c.impact].forEach(function (list) {
      list.forEach(function (x) { if (!isStr(x.name)) x.name = x.id; if (!isStr(x.note)) x.note = ""; });
    });
    c.impact.forEach(function (iv) {
      var row = c.matrix[iv.id];
      if (!isObj(row)) { delete c.matrix[iv.id]; return; }
      c.likelihood.forEach(function (lv) { if (lv.id in row && !isBand(row[lv.id])) delete row[lv.id]; });
    });
    var seen = {};
    c.categories = (Array.isArray(c.categories) ? c.categories : []).filter(function (x) {
      if (!isObj(x) || !isStr(x.id) || !x.id || seen[x.id]) return false; seen[x.id] = true;
      if (!isStr(x.name)) x.name = x.id;
      return true;
    });
    if ("tolerableByCategory" in c) {
      var t = c.tolerableByCategory;
      if (!isObj(t)) delete c.tolerableByCategory;
      else {
        Object.keys(t).forEach(function (k) { if (!seen[k] || !isBand(t[k])) delete t[k]; });
        if (!Object.keys(t).length) delete c.tolerableByCategory;
      }
    }
    if ("preset" in c && !isStr(c.preset)) delete c.preset;
  }
  function normCategoryMap(o, key) {
    if (!(key in o)) return;
    var m = o[key];
    if (!isObj(m)) { delete o[key]; return; }
    Object.keys(m).forEach(function (k) { if (!isStr(m[k]) || !m[k]) delete m[k]; });
    if (!Object.keys(m).length) delete o[key];
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
    M.COUNTER_KEYS.forEach(function (k) { if (typeof data.counters[k] !== "number") data.counters[k] = 0; });
    // The criteria first: a suggested treatment is worked out on them.
    normCriteria(data);
    data.srs.highLevelAssets.forEach(function (a) {
      if (!isObj(a)) return;
      normCategoryMap(a, "consequenceByCategory");
      normText(a, "consequenceSource");
    });
    (data.zones || []).forEach(function (z) {
      var ez = M.emptyZone(0);
      Object.keys(ez).forEach(function (k) { if (z[k] == null) z[k] = ez[k]; });
      fixVector(z);
      z.countermeasures.forEach(normCM);
      z.vulnerabilities.forEach(normVuln);
      z.threats.forEach(function (t) { normThreat(t, z, loadTolerable, data); });
    });
    (data.conduits || []).forEach(function (c) {
      var ec = M.emptyConduit(0);
      Object.keys(ec).forEach(function (k) { if (c[k] == null) c[k] = ec[k]; });
      fixVector(c);
      c.countermeasures.forEach(normCM);
      c.vulnerabilities.forEach(normVuln);
      c.threats.forEach(function (t) { normThreat(t, c, loadTolerable, data); });
    });
    // Assets had no ids before 0.3; a threat links one by its id. The counter
    // starts above any id already in the file, and ids, once given, never change.
    var seenAsset = {};
    (data.zones || []).forEach(function (z) {
      (z.assets || []).forEach(function (a) {
        var m = a && typeof a.id === "string" ? /^AS(\d+)$/.exec(a.id) : null;
        if (m && Number(m[1]) > data.counters.asset) data.counters.asset = Number(m[1]);
      });
    });
    (data.zones || []).forEach(function (z) {
      (z.assets || []).forEach(function (a) {
        if (!isObj(a)) return;
        if (typeof a.id !== "string" || !a.id || seenAsset[a.id]) a.id = M.nextAssetId(data);
        seenAsset[a.id] = true;
      });
    });
    // The consultant's section overrides, one set per report (js/report-page.js),
    // and one for the requirements specification (phase 6b).
    // Optional and additive, so the file format stays at this schema: a file
    // without them loads as before, and an older copy of the tool keeps them.
    if (data.reportCustom != null) {
      if (typeof data.reportCustom !== "object" || Array.isArray(data.reportCustom)) delete data.reportCustom;
      else ["detailed", "highLevel", "spec"].forEach(function (k) {
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
    normNew5b(data);
    normNew6(data);
    return data;
  }

  // The fields phase 6a added (js/model.js), tidied when present and never
  // added: an asset's register attributes are text (criticality one of its
  // three words), and the previous assessment is kept only when it reads as
  // one (an object with its frozen facts); of its facts only what is not an
  // object (an owner, a threat, a countermeasure, a ranked system) is dropped.
  function normNew6(data) {
    (data.zones || []).forEach(function (z) {
      (isObj(z) && Array.isArray(z.assets) ? z.assets : []).forEach(function (a) {
        if (!isObj(a)) return;
        M.ASSET_TEXT_FIELDS.forEach(function (k) { normText(a, k); });
        if ("criticality" in a && M.ASSET_CRITICALITY.indexOf(a.criticality) < 0) delete a.criticality;
      });
    });
    if ("baseline" in data) {
      var b = data.baseline;
      if (!isObj(b) || !isObj(b.facts) || !Array.isArray(b.facts.owners)) { delete data.baseline; return; }
      ["fileName", "savedOn", "assessmentDate", "revision", "approvedOn", "sucName", "loadedOn"].forEach(function (k) { if (!isStr(b[k])) b[k] = ""; });
      // A frozen copy edited by hand: what is not an object goes, so a build
      // never trips on it. What is left is as frozen.
      b.facts.owners = b.facts.owners.filter(isObj);
      b.facts.owners.forEach(function (o) {
        ["threats", "cms"].forEach(function (k) { o[k] = Array.isArray(o[k]) ? o[k].filter(isObj) : []; });
      });
      if ("ranked" in b.facts) b.facts.ranked = Array.isArray(b.facts.ranked) ? b.facts.ranked.filter(isObj) : [];
    }
  }

  // The fields phase 5b added (js/model.js), tidied when present and never
  // added: the safety floor list keeps known requirements once each (an empty
  // list is a floor on none); a zone's level is one of the house layering's,
  // its place in the band a number; a threat's library id is text.
  function normNew5b(data) {
    if ("safetyFloorFR" in data) {
      if (!Array.isArray(data.safetyFloorFR)) delete data.safetyFloorFR;
      else data.safetyFloorFR = FR_IDS.filter(function (fr) { return data.safetyFloorFR.indexOf(fr) >= 0; });
    }
    (data.zones || []).forEach(function (z) {
      if (!isObj(z)) return;
      if ("level" in z && !M.zoneLevel(z)) delete z.level;
      if ("levelOrder" in z && (typeof z.levelOrder !== "number" || !isFinite(z.levelOrder))) delete z.levelOrder;
    });
    (data.zones || []).concat(data.conduits || []).forEach(function (o) {
      (isObj(o) && Array.isArray(o.threats) ? o.threats : []).forEach(function (t) { if (isObj(t)) normText(t, "libraryId"); });
    });
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
    // A threat's links: to its owner's countermeasures and vulnerabilities, and
    // to the assets of its zone (or of the zones a conduit joins). A suggested
    // link that is now a link, or points at nothing, goes.
    function uniq(arr) { var s = {}; return arr.filter(function (id) { if (s[id]) return false; s[id] = true; return true; }); }
    data.zones.concat(data.conduits).forEach(function (o) {
      var cms = idsOf(o.countermeasures), vulns = idsOf(o.vulnerabilities), assets = idsOf(E.threatAssets(o, data));
      o.threats.forEach(function (t) {
        if (Array.isArray(t.countermeasureIds)) t.countermeasureIds = uniq(keepKnown(t.countermeasureIds, cms));
        if (Array.isArray(t.vulnerabilityIds)) t.vulnerabilityIds = uniq(keepKnown(t.vulnerabilityIds, vulns));
        if (Array.isArray(t.assetIds)) t.assetIds = uniq(keepKnown(t.assetIds, assets));
        if (Array.isArray(t.suggestedCountermeasureIds)) {
          var linked = t.countermeasureIds || [];
          t.suggestedCountermeasureIds = uniq(keepKnown(t.suggestedCountermeasureIds, cms)).filter(function (id) { return linked.indexOf(id) < 0; });
          if (!t.suggestedCountermeasureIds.length) delete t.suggestedCountermeasureIds;
        }
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
