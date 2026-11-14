/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* compare.js — this assessment against a previous one (phase 6a).
 *
 * A previous risk project file (any schema Load reads) is brought to this
 * build's shape on a copy (js/migrate.js) and frozen: freeze() keeps only
 * what is compared, worked out on that file's own criteria (each rating's
 * likelihood, impact and band in the three states, the treatment decision
 * recorded, the SL-T, the countermeasures, the ranked systems with their
 * ratings and, on a high-level-only assessment, their decision on a detailed
 * assessment, the tolerable risk and a key of the criteria). The project
 * stores it as project.baseline, with the file's name, its date and its
 * approval date, so the comparison stands without the old file. Nothing
 * here changes the current project apart from that one field.
 *
 * diff() matches by stable ids, with a name fallback for zones, conduits,
 * threats and countermeasures that were numbered again: the same id and
 * name first, then the same name (or, for a conduit, the same ends), then
 * the same id. Ranked systems match by id, then by name. Ratings on
 * different criteria are compared by band only. lines() puts the changes in
 * plain words, each said once and with its direction (raised, lowered, set,
 * no longer set): what an added or removed zone held is said with the zone,
 * an acceptance with the accepted risks rather than with the decisions, and
 * a decision only when the decision recorded changed. rows() is the same
 * for the workbook's Changes sheet. A review date that has passed is a fact
 * about today, not a change: the report says it under Decisions required.
 */
window.RiskApp = window.RiskApp || {};
window.RiskApp.Compare = (function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine;
  var FR_IDS = M.FR_IDS, BAND_NAME = M.BAND_NAME, BAND_RANK = M.BAND_RANK || {};
  var STATES = ["unmitigated", "current", "planned"];

  function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function str(v) { return typeof v === "string" ? v : ""; }
  function list(v) { return Array.isArray(v) ? v.filter(isObj) : []; }
  // A short key for the criteria's content (FNV-1a), so the frozen copy does
  // not carry the whole matrix.
  function hash(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0; }
    return ("0000000" + h.toString(16)).slice(-8);
  }

  // ---------- Freezing ----------

  // A rating in one state; a state not rated takes the one before it.
  function stateOf(t, st, p) {
    var L = t.likelihood, I = t.impact;
    if (st !== "unmitigated") { L = t.currentLikelihood || L; I = t.currentImpact || I; }
    if (st === "planned") { L = t.residualLikelihood || L; I = t.residualImpact || I; }
    return ratingOf(L, I, p);
  }
  function ratingOf(L, I, p) {
    return { L: L || "", I: I || "", Ln: L ? E.likelihoodName(L, p) : "", In: I ? E.impactName(I, p) : "", band: E.riskFor(I, L, p) || null };
  }
  function freeze(p) {
    var vm = R.ViewModel.build(p), crit = M.criteriaOf(p), hlOnly = M.assessmentType(p) === "high-level";
    var owners = vm.owners.map(function (row) {
      var o = row.o, f = { kind: row.isZone ? "zone" : "conduit", id: o.id, name: o.name || "", slt: {} };
      FR_IDS.forEach(function (fr) { f.slt[fr] = typeof o.slTargetByFR[fr] === "number" ? o.slTargetByFR[fr] : null; });
      if (!row.isZone) { f.from = o.fromZone || ""; f.to = o.toZone || ""; }
      f.threats = row.threats.map(function (x) {
        var t = x.t, st = {};
        STATES.forEach(function (s) { st[s] = stateOf(t, s, p); });
        return { id: t.id, statement: t.statement || "", states: st, required: !!x.exceeds,
          decision: x.treatment.confirmed ? x.treatment.decision : null, label: x.label,
          accepted: x.disposition === "accepted", reviewDate: str((t.acceptanceDetail || {}).reviewDate) };
      });
      f.cms = (o.countermeasures || []).filter(function (m) { return m && String(m.description || "").trim(); }).map(function (m) {
        return { id: m.id, description: m.description, existing: !!m.existing, status: M.CM_STATUSES.indexOf(m.status) >= 0 ? m.status : "" };
      });
      return f;
    });
    // The ranking: each system's rating and, where the decision sits on the
    // system (a high-level-only assessment), that decision.
    var ranked = (p.srs.highLevelAssets || []).filter(isObj).map(function (a) {
      var r = ratingOf(a.likelihood, a.consequence, p);
      var f = { id: a.id, name: a.name || "", rating: r, byCategory: isObj(a.consequenceByCategory) ? JSON.parse(JSON.stringify(a.consequenceByCategory)) : {} };
      if (hlOnly) { var d = E.hlaComparison(a, p).required; f.decision = d === true || d === false ? d : null; }
      return f;
    });
    return { v: 1, tolerable: vm.tolerable, criteriaKey: hash(M.criteriaContent(crit)),
      tolerableByCategory: crit.tolerableByCategory || {}, owners: owners, ranked: ranked, highLevelOnly: hlOnly };
  }

  // The latest date among the approvals given (or "").
  function approvedOn(p) {
    return M.approvalsOf(p).filter(function (e) { return e.approved; }).map(function (e) { return e.date || ""; })
      .reduce(function (a, d) { return d > a ? d : a; }, "");
  }

  // A previous project file's text to the baseline the project stores, or
  // { error }. The file is read on a copy and never touches the open project.
  function baselineFrom(text, fileName) {
    var data;
    try { data = JSON.parse(text); } catch (e) { return { error: "Not a valid JSON file." }; }
    if (!data || !R.Migrate.accepts(data.schema)) return { error: "Not a risk project file this tool reads." };
    var p = R.Migrate.normaliseProject(data);
    var eng = p.engagement || {};
    return { baseline: {
      fileName: String(fileName || ""), savedOn: str(p.savedOn), assessmentDate: str(eng.assessmentDate), revision: str(eng.revision),
      approvedOn: approvedOn(p), sucName: str(p.suc && p.suc.name), loadedOn: E.todayISO(), facts: freeze(p)
    } };
  }

  // ---------- Matching ----------

  function norm(s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); }
  // Pairs items of two lists in passes, each pass taking the first match
  // left. Returns { pairs: [{ prev, cur, how }], added, removed }.
  function match(prev, cur, passes) {
    var usedP = prev.map(function () { return false; }), usedC = cur.map(function () { return false; }), pairs = [];
    passes.forEach(function (pass) {
      cur.forEach(function (c, ci) {
        if (usedC[ci]) return;
        for (var pi = 0; pi < prev.length; pi++) {
          if (usedP[pi] || !pass.test(prev[pi], c)) continue;
          usedP[pi] = usedC[ci] = true;
          pairs.push({ prev: prev[pi], cur: c, how: pass.how });
          return;
        }
      });
    });
    return { pairs: pairs, added: cur.filter(function (c, i) { return !usedC[i]; }), removed: prev.filter(function (x, i) { return !usedP[i]; }) };
  }
  function byIdName(key) {
    return [
      { how: "same", test: function (a, b) { return a.id === b.id && norm(a[key]) === norm(b[key]); } },
      { how: "name", test: function (a, b) { return !!norm(a[key]) && norm(a[key]) === norm(b[key]); } },
      { how: "id", test: function (a, b) { return a.id === b.id; } }
    ];
  }

  // ---------- The changes ----------

  function sameRating(a, b, sameCriteria) {
    a = a || {}; b = b || {};
    if ((a.band || null) !== (b.band || null)) return false;
    if (!sameCriteria) return true;
    return (a.L || "") === (b.L || "") && (a.I || "") === (b.I || "");
  }
  // The state at STATES[i] is the one before it, not rated on its own.
  function carried(t, i) {
    var st = t.states || {}, a = st[STATES[i]] || {}, b = st[STATES[i - 1]] || {};
    return (a.L || "") === (b.L || "") && (a.I || "") === (b.I || "");
  }
  // Every threat and countermeasure with its zone or conduit. A frozen copy
  // read from a file is not trusted to be well formed.
  function owned(facts) {
    var out = [];
    list(facts && facts.owners).forEach(function (o) { list(o.threats).forEach(function (t) { out.push({ t: t, owner: o }); }); });
    return out;
  }
  function cmsOf(facts) {
    var out = [];
    list(facts && facts.owners).forEach(function (o) { list(o.cms).forEach(function (m) { out.push({ m: m, owner: o }); }); });
    return out;
  }
  // The decision a threat stands on, for comparing: the one recorded, or
  // within tolerable risk (needing none), or none recorded.
  function decisionOf(t) {
    if (t.decision === "reduce" || t.decision === "accept" || t.decision === "slt") return t.decision;
    if (t.required === false || (t.required == null && str(t.label) === E.TREATMENT_LABEL.within)) return "within";
    return "none";
  }

  // prev, cur: frozen facts (cur is freeze() of the open project).
  function diff(prev, cur) {
    prev = isObj(prev) ? prev : { owners: [] }; cur = isObj(cur) ? cur : { owners: [] };
    var P = list(prev.owners), C = list(cur.owners);
    var sameCriteria = !!prev.criteriaKey && prev.criteriaKey === cur.criteriaKey;
    var out = {
      sameCriteria: sameCriteria,
      tolerable: (prev.tolerable || null) !== (cur.tolerable || null) ? { from: prev.tolerable || null, to: cur.tolerable || null } : null,
      criteriaChanged: !sameCriteria,
      byCategoryChanged: JSON.stringify(prev.tolerableByCategory || {}) !== JSON.stringify(cur.tolerableByCategory || {}),
      ranked: { added: [], removed: [], renumbered: [], renamed: [], ratings: [], categories: [], decisions: [] },
      owners: { added: [], removed: [], renumbered: [], renamed: [], ends: [] },
      slt: [], threats: { added: [], removed: [], moved: [], renumbered: [] },
      ratings: [], decisions: [], cms: { added: [], removed: [], moved: [], status: [] },
      accepted: { added: [], removed: [] }
    };

    // The ranked systems: by id, then by name. A copy frozen before the
    // ranking was compared has none to compare.
    var rm = match(list(prev.ranked), Array.isArray(prev.ranked) ? list(cur.ranked) : [], [
      { how: "id", test: function (a, b) { return !!a.id && a.id === b.id; } },
      { how: "name", test: function (a, b) { return !!norm(a.name) && norm(a.name) === norm(b.name); } }
    ]);
    out.ranked.added = rm.added; out.ranked.removed = rm.removed;
    rm.pairs.forEach(function (pr) {
      var a = pr.prev, b = pr.cur;
      if (a.id !== b.id) out.ranked.renumbered.push({ prev: a, cur: b });
      else if (norm(a.name) !== norm(b.name)) out.ranked.renamed.push({ prev: a, cur: b });
      if (!sameRating(a.rating, b.rating, sameCriteria)) out.ranked.ratings.push({ cur: b, from: a.rating || {}, to: b.rating || {} });
      if (sameCriteria && JSON.stringify(a.byCategory || {}) !== JSON.stringify(b.byCategory || {})) out.ranked.categories.push({ cur: b });
      // Only where both assessments recorded the decision on the system.
      if ("decision" in a && "decision" in b && a.decision !== b.decision) out.ranked.decisions.push({ cur: b, from: a.decision, to: b.decision });
    });

    // Zones, then conduits (whose ends read through the zones matched).
    var zm = match(P.filter(function (o) { return o.kind === "zone"; }), C.filter(function (o) { return o.kind === "zone"; }), byIdName("name"));
    var zoneNow = {};
    zm.pairs.forEach(function (pr) { zoneNow[pr.prev.id] = pr.cur.id; });
    function endsOf(o, map) { return [map ? (map[o.from] || o.from || "") : o.from || "", map ? (map[o.to] || o.to || "") : o.to || ""]; }
    function ends(o, map) { return endsOf(o, map).slice().sort().join("|"); }
    var cpasses = byIdName("name");
    cpasses.splice(2, 0, { how: "ends", test: function (a, b) { return !!(a.from && a.to) && ends(a, zoneNow) === ends(b); } });
    var cm = match(P.filter(function (o) { return o.kind === "conduit"; }), C.filter(function (o) { return o.kind === "conduit"; }), cpasses);
    var pairs = zm.pairs.concat(cm.pairs);
    var addedOwners = zm.added.concat(cm.added), removedOwners = zm.removed.concat(cm.removed);
    out.owners.added = addedOwners;
    out.owners.removed = removedOwners;
    pairs.forEach(function (pr) {
      if (pr.prev.id !== pr.cur.id) out.owners.renumbered.push({ prev: pr.prev, cur: pr.cur });
      else if (norm(pr.prev.name) !== norm(pr.cur.name)) out.owners.renamed.push({ prev: pr.prev, cur: pr.cur });
      var frs = FR_IDS.filter(function (fr) { return ((pr.prev.slt || {})[fr] == null ? null : pr.prev.slt[fr]) !== ((pr.cur.slt || {})[fr] == null ? null : pr.cur.slt[fr]); });
      if (frs.length) out.slt.push({ owner: pr.cur, changes: frs.map(function (fr) { return { fr: fr, from: pr.prev.slt[fr] == null ? null : pr.prev.slt[fr], to: pr.cur.slt[fr] == null ? null : pr.cur.slt[fr] }; }) });
    });
    // A conduit that now joins other zones (the previous ends read in today's numbering).
    cm.pairs.forEach(function (pr) {
      if (ends(pr.prev, zoneNow) !== ends(pr.cur)) out.owners.ends.push({ cur: pr.cur, from: endsOf(pr.prev, zoneNow), to: endsOf(pr.cur) });
    });
    function pairOf(prevOwner) { for (var i = 0; i < pairs.length; i++) if (pairs[i].prev === prevOwner) return pairs[i].cur; return null; }

    // Threats, across zones and conduits (an id is the project's own).
    var pT = owned(prev), cT = owned(cur);
    var tm = match(pT, cT, [
      { how: "same", test: function (a, b) { return a.t.id === b.t.id && norm(a.t.statement) === norm(b.t.statement); } },
      { how: "name", test: function (a, b) { return !!norm(a.t.statement) && norm(a.t.statement) === norm(b.t.statement) && pairOf(a.owner) === b.owner; } },
      { how: "name", test: function (a, b) { return !!norm(a.t.statement) && norm(a.t.statement) === norm(b.t.statement); } },
      { how: "id", test: function (a, b) { return a.t.id === b.t.id; } }
    ]);
    // What was in a zone or conduit added or removed is said with it.
    out.threats.added = tm.added.filter(function (x) { return addedOwners.indexOf(x.owner) < 0; });
    out.threats.removed = tm.removed.filter(function (x) { return removedOwners.indexOf(x.owner) < 0; });
    tm.pairs.forEach(function (pr) {
      var a = pr.prev, b = pr.cur;
      if (pairOf(a.owner) !== b.owner) out.threats.moved.push({ prev: a, cur: b });
      if (a.t.id !== b.t.id) out.threats.renumbered.push({ prev: a, cur: b });
      // A state not rated in either assessment only carries the one before
      // it, whose change is already said.
      var changed = STATES.filter(function (s, i) {
        if (i && carried(a.t, i) && carried(b.t, i)) return false;
        return !sameRating((a.t.states || {})[s], (b.t.states || {})[s], sameCriteria);
      });
      if (changed.length) out.ratings.push({ cur: b, changes: changed.map(function (s) { return { state: s, from: (a.t.states || {})[s] || {}, to: (b.t.states || {})[s] || {} }; }) });
      // An acceptance given or taken back is said with the accepted risks.
      if (!!a.t.accepted !== !!b.t.accepted) { (b.t.accepted ? out.accepted.added : out.accepted.removed).push({ prev: a, cur: b }); return; }
      // A decision only when the one recorded changed: a threat now within
      // tolerable risk needs none, which its rating already says.
      var da = decisionOf(a.t), db = decisionOf(b.t);
      if (da !== db && db !== "within") out.decisions.push({ prev: a, cur: b, from: da, to: db });
    });

    // Countermeasures, the same way.
    var pM = cmsOf(prev), cM = cmsOf(cur);
    var mm = match(pM, cM, [
      { how: "same", test: function (a, b) { return a.m.id === b.m.id && norm(a.m.description) === norm(b.m.description); } },
      { how: "name", test: function (a, b) { return !!norm(a.m.description) && norm(a.m.description) === norm(b.m.description); } },
      { how: "id", test: function (a, b) { return a.m.id === b.m.id; } }
    ]);
    out.cms.added = mm.added.filter(function (x) { return addedOwners.indexOf(x.owner) < 0; });
    out.cms.removed = mm.removed.filter(function (x) { return removedOwners.indexOf(x.owner) < 0; });
    mm.pairs.forEach(function (pr) {
      var a = pr.prev.m, b = pr.cur.m;
      if (pairOf(pr.prev.owner) !== pr.cur.owner) out.cms.moved.push({ prev: pr.prev, cur: pr.cur });
      if (!!a.existing !== !!b.existing || (!b.existing && str(a.status) !== str(b.status))) out.cms.status.push({ prev: pr.prev, cur: pr.cur });
    });
    var rk = out.ranked;
    out.empty = !out.tolerable && !out.criteriaChanged && !out.byCategoryChanged &&
      !rk.added.length && !rk.removed.length && !rk.renumbered.length && !rk.renamed.length && !rk.ratings.length && !rk.categories.length && !rk.decisions.length &&
      !out.owners.added.length && !out.owners.removed.length && !out.owners.renumbered.length && !out.owners.renamed.length && !out.owners.ends.length &&
      !out.slt.length && !out.threats.added.length && !out.threats.removed.length && !out.threats.moved.length && !out.threats.renumbered.length &&
      !out.ratings.length && !out.decisions.length && !out.cms.added.length && !out.cms.removed.length && !out.cms.moved.length && !out.cms.status.length &&
      !out.accepted.added.length && !out.accepted.removed.length;
    return out;
  }

  // The open project against its baseline, or null when it has none.
  function compare(p) {
    var b = p && isObj(p.baseline) && isObj(p.baseline.facts) ? p.baseline : null;
    if (!b) return null;
    return diff(b.facts, freeze(p));
  }

  // ---------- In words ----------

  function band(b) { return b ? BAND_NAME[b] || b : "not rated"; }
  function rating(r, withLI) {
    r = r || {};
    if (!r.band) return (r.Ln || r.In) ? (r.Ln || "Not rated") + " × " + (r.In || "Not rated") : "not rated";
    return band(r.band) + (withLI && r.Ln && r.In ? " (" + r.Ln + " × " + r.In + ")" : "");
  }
  function rank(b) { return b && BAND_RANK[b] != null ? BAND_RANK[b] : -1; }
  // A rating's change in words, by the rank of its band: "raised from High
  // (High × Serious) to Very high (High × Major)", "now rated Medium", "no
  // longer rated (was High)", or "changed from" for the same band.
  function moveWords(from, to, withLI) {
    from = from || {}; to = to || {};
    var a = rating(from, withLI), b = rating(to, withLI);
    if (!from.band && to.band) return "now rated " + b;
    if (from.band && !to.band) return "no longer rated (was " + a + ")";
    if (from.band && to.band && rank(to.band) !== rank(from.band)) return (rank(to.band) > rank(from.band) ? "raised" : "lowered") + " from " + a + " to " + b;
    return "changed from " + a + " to " + b;
  }
  function moveWord(from, to) {
    from = from || {}; to = to || {};
    if (!from.band && to.band) return "Rated";
    if (from.band && !to.band) return "No longer rated";
    if (from.band && to.band && rank(to.band) !== rank(from.band)) return rank(to.band) > rank(from.band) ? "Raised" : "Lowered";
    return "Changed";
  }
  function sl(v) { return v == null ? "" : "SL" + v; }
  // An SL-T's change: "IAC raised from SL2 to SL3", "DC set to SL1", "DC no
  // longer set (was SL2)".
  function sltWords(c) {
    if (c.from == null) return c.fr + " set to " + sl(c.to);
    if (c.to == null) return c.fr + " no longer set (was " + sl(c.from) + ")";
    return c.fr + " " + (c.to > c.from ? "raised" : "lowered") + " from " + sl(c.from) + " to " + sl(c.to);
  }
  function sltWord(c) { return c.from == null ? "Set" : c.to == null ? "No longer set" : c.to > c.from ? "Raised" : "Lowered"; }
  function who(o) { return o.id + (o.name ? " " + o.name : ""); }
  function lc1(s) { s = String(s || ""); return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function noStop(s) { return String(s || "").replace(/[.\s]+$/, ""); }
  function nOf(n, one, many) { return n + " " + (n === 1 ? one : many); }
  var STATUS = M.CM_STATUS_LABEL;
  // A countermeasure's state in words: in place, or a planned one's status.
  function cmState(m) { return m.existing ? "in place" : (STATUS[m.status] ? lc1(STATUS[m.status]) : "planned"); }
  function cmStatusWords(a, b) {
    if (!a.existing && b.existing) return "now in place";
    if (a.existing && !b.existing) return "no longer in place; now " + cmState(b);
    if (!STATUS[a.status]) return "now " + cmState(b);
    return "moved from " + cmState(a) + " to " + cmState(b);
  }
  // The decision a threat stands on, in words.
  var DECISION_WORDS = { reduce: "reduce with countermeasures", accept: "risk accepted", slt: "treated through the SL-T programme", within: "within tolerable risk", none: "no decision recorded" };
  function decisionLine(x) {
    var id = x.cur.t.id + " (" + x.cur.owner.id + ")";
    if (x.from === "none" || x.from === "within") return id + ": decision now recorded: " + DECISION_WORDS[x.to] + ".";
    if (x.to === "none") return id + ": no decision recorded now (was " + DECISION_WORDS[x.from] + ").";
    return id + ": was " + DECISION_WORDS[x.from] + "; now " + DECISION_WORDS[x.to] + ".";
  }
  function noLongerAccepted(x) {
    var d = decisionOf(x.cur.t), id = x.cur.t.id + " (" + x.cur.owner.id + ")";
    if (d === "within") return id + " no longer accepted; it is now within tolerable risk.";
    if (d === "none") return id + " no longer accepted; no decision is recorded now.";
    if (d === "accept") return id + " no longer accepted; " + lc1(x.cur.t.label || "no decision recorded") + ".";
    return id + " no longer accepted; the decision is now " + DECISION_WORDS[d] + ".";
  }
  var DETAILED_WORDS = { "true": "required", "false": "not required", "null": "not decided" };
  function detailedLine(x) {
    var w = who(x.cur);
    if (x.to == null) return w + ": the decision on a detailed assessment is no longer recorded (was " + DETAILED_WORDS[String(x.from)] + ").";
    return w + ": detailed assessment now judged " + DETAILED_WORDS[String(x.to)] + " (was " + DETAILED_WORDS[String(x.from)] + ").";
  }
  // A conduit's ends in words: "Z1 and Z3".
  function endWords(pair) { return pair.map(function (e) { return e === "EXT" ? "an external network" : e ? e : "an end not set"; }).join(" and "); }
  function held(o) {
    var bits = [];
    if ((o.threats || []).length) bits.push(nOf(o.threats.length, "threat", "threats"));
    if ((o.cms || []).length) bits.push(nOf(o.cms.length, "countermeasure", "countermeasures"));
    return bits.length ? ", with its " + bits.join(" and ") : "";
  }
  function renamedLine(x) {
    if (!x.prev.name) return x.cur.id + " had no name; now " + x.cur.name + ".";
    if (!x.cur.name) return x.cur.id + " was named " + x.prev.name + "; now it has no name.";
    return x.cur.id + " was named " + x.prev.name + "; now " + x.cur.name + ".";
  }
  function renumberedLine(x) {
    return who(x.cur) + " was numbered " + x.prev.id + (norm(x.prev.name) !== norm(x.cur.name) && x.prev.name ? " and named " + x.prev.name : "") + ".";
  }

  // [{ key, title, items: [text] }], only the groups with something in them.
  // keys: the groups wanted (all when not given), as the high-level report
  // asks for the criteria and the ranking only.
  function lines(d, keys) {
    if (!d) return [];
    var g = [];
    function group(key, title, items) { if (items.length && (!keys || keys.indexOf(key) >= 0)) g.push({ key: key, title: title, items: items }); }
    var withLI = d.sameCriteria;
    var crit = [];
    if (d.tolerable) crit.push("The tolerable risk changed from " + band(d.tolerable.from) + " to " + band(d.tolerable.to) + ".");
    if (d.criteriaChanged) crit.push("The risk criteria changed, so ratings are compared by band only.");
    else if (d.byCategoryChanged) crit.push("The tolerable risk of a consequence category changed.");
    group("criteria", "Risk criteria", crit);
    var rk = d.ranked || { added: [], removed: [], renumbered: [], renamed: [], ratings: [], categories: [], decisions: [] }, rs = [];
    rk.added.forEach(function (a) { rs.push(who(a) + " added, " + (a.rating && a.rating.band ? "rated " + rating(a.rating, withLI) : "not rated") + "."); });
    rk.removed.forEach(function (a) { rs.push(who(a) + " removed."); });
    rk.renumbered.forEach(function (x) { rs.push(renumberedLine(x)); });
    rk.renamed.forEach(function (x) { rs.push(renamedLine(x)); });
    rk.ratings.forEach(function (x) { rs.push(who(x.cur) + ": risk " + moveWords(x.from, x.to, withLI) + "."); });
    rk.categories.forEach(function (x) { rs.push(who(x.cur) + ": impact by consequence category changed."); });
    rk.decisions.forEach(function (x) { rs.push(detailedLine(x)); });
    group("ranked", "Ranked systems", rs);
    var ow = [];
    d.owners.added.forEach(function (o) { ow.push(who(o) + " added" + held(o) + "."); });
    d.owners.removed.forEach(function (o) { ow.push(who(o) + " removed" + held(o) + "."); });
    d.owners.renumbered.forEach(function (x) { ow.push(renumberedLine(x)); });
    d.owners.renamed.forEach(function (x) { ow.push(renamedLine(x)); });
    (d.owners.ends || []).forEach(function (x) { ow.push(x.cur.id + " now joins " + endWords(x.to) + "; was " + endWords(x.from) + "."); });
    group("owners", "Zones and conduits", ow);
    group("slt", "SL-T", d.slt.map(function (x) {
      return who(x.owner) + ": " + x.changes.map(sltWords).join(", ") + ".";
    }));
    var th = [];
    d.threats.added.forEach(function (x) { th.push(x.t.id + " added to " + x.owner.id + (x.t.statement ? ": " + noStop(x.t.statement) : "") + "."); });
    d.threats.removed.forEach(function (x) { th.push(x.t.id + " removed from " + x.owner.id + (x.t.statement ? ": " + noStop(x.t.statement) : "") + "."); });
    d.threats.moved.forEach(function (x) { th.push(x.cur.t.id + " moved from " + x.prev.owner.id + " to " + x.cur.owner.id + "."); });
    d.threats.renumbered.forEach(function (x) { th.push(x.cur.t.id + " was numbered " + x.prev.t.id + "."); });
    group("threats", "Threat scenarios", th);
    group("ratings", "Ratings", d.ratings.map(function (x) {
      return x.cur.t.id + " (" + x.cur.owner.id + "): " + x.changes.map(function (c) { return c.state + " risk " + moveWords(c.from, c.to, withLI); }).join("; ") + ".";
    }));
    group("decisions", "Treatment decisions", d.decisions.map(decisionLine));
    var cm = [];
    d.cms.added.forEach(function (x) { cm.push(x.m.id + " added to " + x.owner.id + ": " + noStop(x.m.description) + " (" + cmState(x.m) + ")."); });
    d.cms.removed.forEach(function (x) { cm.push(x.m.id + " removed from " + x.owner.id + ": " + noStop(x.m.description) + "."); });
    d.cms.moved.forEach(function (x) { cm.push(x.cur.m.id + " moved from " + x.prev.owner.id + " to " + x.cur.owner.id + "."); });
    (d.cms.status || []).forEach(function (x) { cm.push(x.cur.m.id + " (" + x.cur.owner.id + "): " + cmStatusWords(x.prev.m, x.cur.m) + "."); });
    group("countermeasures", "Countermeasures", cm);
    var ac = [];
    d.accepted.added.forEach(function (x) { ac.push(x.cur.t.id + " (" + x.cur.owner.id + ") accepted since the previous assessment."); });
    d.accepted.removed.forEach(function (x) { ac.push(noLongerAccepted(x)); });
    group("accepted", "Accepted risks", ac);
    return g;
  }

  // The baseline in one sentence: "the previous assessment of Unit 300,
  // 2024-06-12, revision 1.0, approved on 2024-06-20".
  function baselineWords(b) {
    if (!b) return "";
    var date = b.assessmentDate || String(b.savedOn || "").slice(0, 10);
    var bits = [];
    if (date) bits.push(date);
    if (b.revision) bits.push("revision " + b.revision);
    bits.push(b.approvedOn ? "approved on " + b.approvedOn : "not approved");
    return "the previous assessment" + (b.sucName ? " of " + b.sucName : "") + ", " + bits.join(", ");
  }

  // The workbook's rows: [{ area, where, item, change, before, now }]. A
  // countermeasure's state is printed as elsewhere (In place, Planned, Done).
  function rows(d) {
    if (!d) return [];
    var out = [], withLI = d.sameCriteria;
    function add(area, where, item, change, before, now) { out.push({ area: area, where: where || "", item: item || "", change: change, before: before == null ? "" : String(before), now: now == null ? "" : String(now) }); }
    function cmCell(m) { return cap(cmState(m)); }
    function ratingCell(r) { return r && (r.band || r.Ln || r.In) ? cap(rating(r, withLI)) : ""; }
    if (d.tolerable) add("Risk criteria", "", "Tolerable risk", "Changed", band(d.tolerable.from), band(d.tolerable.to));
    if (d.criteriaChanged) add("Risk criteria", "", "Risk criteria", "Changed; ratings compared by band only", "", "");
    else if (d.byCategoryChanged) add("Risk criteria", "", "Tolerable risk per consequence category", "Changed", "", "");
    var rk = d.ranked || { added: [], removed: [], renumbered: [], renamed: [], ratings: [], categories: [], decisions: [] };
    rk.added.forEach(function (a) { add("Ranked systems", "", who(a), "Added", "", ratingCell(a.rating)); });
    rk.removed.forEach(function (a) { add("Ranked systems", "", who(a), "Removed", ratingCell(a.rating), ""); });
    rk.renumbered.forEach(function (x) { add("Ranked systems", "", who(x.cur), "Renumbered", x.prev.id, x.cur.id); });
    rk.renamed.forEach(function (x) { add("Ranked systems", "", x.cur.id, "Renamed", x.prev.name, x.cur.name); });
    rk.ratings.forEach(function (x) { add("Ranked systems", "", who(x.cur), moveWord(x.from, x.to), ratingCell(x.from), ratingCell(x.to)); });
    rk.categories.forEach(function (x) { add("Ranked systems", "", who(x.cur), "Impact by consequence category changed", "", ""); });
    rk.decisions.forEach(function (x) { add("Ranked systems", "", who(x.cur), "Detailed assessment decision changed", cap(DETAILED_WORDS[String(x.from)]), cap(DETAILED_WORDS[String(x.to)])); });
    d.owners.added.forEach(function (o) { add("Zones and conduits", o.id, o.name, "Added" + held(o).replace(/^, with its/, ", with"), "", ""); });
    d.owners.removed.forEach(function (o) { add("Zones and conduits", o.id, o.name, "Removed" + held(o).replace(/^, with its/, ", with"), "", ""); });
    d.owners.renumbered.forEach(function (x) { add("Zones and conduits", x.cur.id, x.cur.name, "Renumbered", x.prev.id, x.cur.id); });
    d.owners.renamed.forEach(function (x) { add("Zones and conduits", x.cur.id, x.cur.name, "Renamed", x.prev.name, x.cur.name); });
    (d.owners.ends || []).forEach(function (x) { add("Zones and conduits", x.cur.id, x.cur.name, "Ends changed", cap(endWords(x.from)), cap(endWords(x.to))); });
    d.slt.forEach(function (x) { x.changes.forEach(function (c) { add("SL-T", x.owner.id, c.fr, sltWord(c), sl(c.from), sl(c.to)); }); });
    d.threats.added.forEach(function (x) { add("Threat scenarios", x.owner.id, x.t.id + " " + x.t.statement, "Added", "", ""); });
    d.threats.removed.forEach(function (x) { add("Threat scenarios", x.owner.id, x.t.id + " " + x.t.statement, "Removed", "", ""); });
    d.threats.moved.forEach(function (x) { add("Threat scenarios", x.cur.owner.id, x.cur.t.id + " " + x.cur.t.statement, "Moved", x.prev.owner.id, x.cur.owner.id); });
    d.threats.renumbered.forEach(function (x) { add("Threat scenarios", x.cur.owner.id, x.cur.t.id + " " + x.cur.t.statement, "Renumbered", x.prev.t.id, x.cur.t.id); });
    d.ratings.forEach(function (x) { x.changes.forEach(function (c) { add("Ratings", x.cur.owner.id, x.cur.t.id + " " + c.state, moveWord(c.from, c.to), ratingCell(c.from), ratingCell(c.to)); }); });
    d.decisions.forEach(function (x) { add("Treatment decisions", x.cur.owner.id, x.cur.t.id, "Changed", cap(DECISION_WORDS[x.from]), cap(DECISION_WORDS[x.to])); });
    d.cms.added.forEach(function (x) { add("Countermeasures", x.owner.id, x.m.id + " " + x.m.description, "Added", "", cmCell(x.m)); });
    d.cms.removed.forEach(function (x) { add("Countermeasures", x.owner.id, x.m.id + " " + x.m.description, "Removed", cmCell(x.m), ""); });
    d.cms.moved.forEach(function (x) { add("Countermeasures", x.cur.owner.id, x.cur.m.id + " " + x.cur.m.description, "Moved", x.prev.owner.id, x.cur.owner.id); });
    (d.cms.status || []).forEach(function (x) { add("Countermeasures", x.cur.owner.id, x.cur.m.id + " " + x.cur.m.description, "Status changed", cmCell(x.prev.m), cmCell(x.cur.m)); });
    d.accepted.added.forEach(function (x) { add("Accepted risks", x.cur.owner.id, x.cur.t.id, "Accepted", cap(DECISION_WORDS[decisionOf(x.prev.t)]), cap(DECISION_WORDS.accept)); });
    d.accepted.removed.forEach(function (x) { add("Accepted risks", x.cur.owner.id, x.cur.t.id, "No longer accepted", cap(DECISION_WORDS.accept), cap(DECISION_WORDS[decisionOf(x.cur.t)])); });
    return out;
  }

  return {
    freeze: freeze, baselineFrom: baselineFrom, diff: diff, compare: compare,
    lines: lines, rows: rows, baselineWords: baselineWords, approvedOn: approvedOn
  };
}());
