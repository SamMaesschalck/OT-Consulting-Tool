/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* review.js
 *
 * The assessment tool's side of a report review. The team reviews through the
 * tools rather than by marking up Word files: the author sends a pack, each
 * reviewer saves a small review file from the OT Cyber Report Review Tool, and
 * the files come back here and merge. See docs/report-review.md.
 *
 *   Send for review   runs the Draft build of exactly the documents an export
 *                     would write (docxJobs), reads each generated Word file
 *                     back into blocks (js/docx-blocks.js) and writes the pack
 *                     with the engagement behind it (contract spt-review-pack).
 *   Import            merges spt-review files into the assessment's store
 *                     (js/review-core.js); the list is js/review-author.js.
 *   Accept            puts suggested wording where it can be changed in the
 *                     tool, rebuilds the Word document to check it took, and
 *                     undoes it if not.
 *   Issue check       warnings only (issueWarnings). Final is never stopped by
 *                     a review, so a lone contractor is not stuck.
 *
 * The store lives on the assessment (Engine.getReview), not on the engagement
 * projection the exporters read, so nothing here can reach Word or Excel.
 */
window.App = window.App || {};
window.App.Review = (function () {
  "use strict";

  function E() { return window.App.Engine; }
  function RC() { return window.App.ReviewCore; }
  function DB() { return window.App.DocxBlocks; }
  function UI() { return window.App.UI.__review; }
  function norm(s) { return RC().norm(s); }

  function store() {
    var s = E().getReview();
    return s ? RC().normaliseStore(s) : null;
  }
  // A store is only created when a review starts: until then an old file and a
  // new one look the same.
  function ensureStore() {
    var s = store();
    if (!s) { s = RC().emptyStore(); E().setReview(s); }
    return s;
  }

  // ---- reading the generated documents ---------------------------------------

  // Builds every document an export would write and reads each back. Charts are
  // drawn only for a pack (opts.charts); a check of the current text does not
  // need them. progress(text) as each one starts. Resolves to a list of
  // { title, targetName, targetId, blocks, media, contentHash, probe }.
  function buildDocuments(opts, progress) {
    opts = opts || {};
    var ids = UI().allTargetIds();
    var jobs = UI().jobs(ids, "per");
    var inst = E().state.instrument, tax = E().state.taxonomy, prof = E().state.profile, nar = E().getActiveNarrative();
    var X = window.App.ExportDOCX;
    var out = [], chain = Promise.resolve();
    jobs.forEach(function (job, i) {
      chain = chain.then(function () {
        if (progress) progress("Building the Word report" + (jobs.length > 1 ? " " + (i + 1) + " of " + jobs.length : "") + "…");
        var probe = [];
        var o = Object.assign({}, job.opts, { issueStatus: "draft", sectionProbe: probe });
        delete o.issueCheck;
        if (!opts.charts) o.blankCharts = true;
        return new Promise(function (resolve, reject) {
          try {
            X.buildAsync(job.engagement, inst, tax, prof, nar, o, function (err, blob) {
              if (err) reject(err); else resolve(blob);
            });
          } catch (e) { reject(e); }
        }).then(function (blob) {
          // App.Report.sectionKey slugs the GENERATED heading, and a Word file
          // only has the printed one. The build's probe says which section each
          // tagged heading is, renamed or not; the file is read against it.
          return DB().fromBlob(blob, { idPrefix: "d" + i + "-b", headings: probe });
        }).then(function (res) {
          out.push({
            title: job.name || inst.title, targetName: job.name || "", targetId: job.targetId || null,
            blocks: res.blocks, media: res.media, contentHash: DB().contentHash(res.blocks), probe: probe
          });
        });
      });
    });
    return chain.then(function () { return out; });
  }

  // ---- the engagement behind the report ---------------------------------------

  function itemIdOf(it) { return it.itemId || it.requirementId || it.outcomeId || it.questionId || it.elementId || it.id; }

  // The level an item is measured against, where the family has one per item.
  function expectedOf(entry) {
    if (!entry) return "";
    if (entry.expectedLabel) return String(entry.expectedLabel);
    if (entry.expected != null && entry.expected !== "") return String(entry.expected);
    if (entry.targetSL != null) return "SL " + entry.targetSL;
    if (entry.slTarget != null) return "SL " + entry.slTarget;
    if (entry.targetMl != null) return String(entry.targetMl);
    if (entry.target != null && typeof entry.target !== "object") return String(entry.target);
    return "";
  }
  function perItemIndex(result) {
    var map = {};
    ["perItem", "perOutcome", "perRequirement", "perQuestion", "perElement"].forEach(function (k) {
      (result && Array.isArray(result[k]) ? result[k] : []).forEach(function (x) { map[itemIdOf(x)] = x; });
    });
    return map;
  }

  // One row per item per target, as that target reads it: the shared layer
  // resolved, then the family's own answer label and roadmap.
  function packItems() {
    var e = E(), C = window.App.Compare, inst = e.state.instrument, fam = e.state.scoringFamily, prof = e.state.profile;
    var catalog = C.catalogFor(inst, fam);
    if (window.App.ScoringCRA && window.App.ScoringCRA.isCRA && window.App.ScoringCRA.isCRA(inst)) {
      var layers = e.getCRASetup().layers;
      catalog = catalog.filter(function (c) { return layers.indexOf(c.groupId) !== -1; });
    }
    var groups = C.groupNames(inst, e.state.taxonomy);
    var all = e.scoreAllTargets() || {};
    var perTarget = all.perTarget || [];
    var eng = e.state.engagement;
    var items = [], facts = [];
    eng.targets.forEach(function (t) {
      var pt = perTarget.filter(function (x) { return x.target && x.target.id === t.id; })[0];
      var result = (pt && pt.result) || {};
      var road = {};
      (result.roadmap || []).forEach(function (it) { road[itemIdOf(it)] = it; });
      var scoped = {};
      C.scopeResponses(eng.responses, t.id).forEach(function (r) { scoped[r.requirementId] = r; });
      var own = {};
      eng.responses.forEach(function (r) { if (r.targetId === t.id) own[r.requirementId] = r; });
      var perItem = perItemIndex(result);
      var fact = { targetName: t.name, roadmapEntries: (result.roadmap || []).length, findings: 0, met: 0, recorded: 0, toAssess: 0, unanswered: 0, na: 0, groups: [] };
      var gfact = {};
      catalog.forEach(function (c) {
        var r = scoped[c.id];
        var v = C.valueFor(fam, r, inst, prof);
        var entry = perItem[c.id];
        var status;
        if (v.kind === "na" || (entry && entry.profileApplicable === false)) status = "na";
        else if (v.kind === "unanswered") status = "unanswered";
        else if (road[c.id] && road[c.id].toAssess) status = "to-assess";
        else if (v.kind === "unknown") status = "to-assess";
        else if (road[c.id]) status = "finding";
        else if (fam === "risk-appetite-coherence") status = "recorded";
        else status = "met";
        var entryR = road[c.id] || entry || {};
        var groupName = c.groupId ? (groups[c.groupId] || c.groupId) : "";
        items.push({
          targetName: t.name, itemId: c.id, code: c.code || c.id, title: c.label || "", groupName: groupName,
          answer: (entry && entry.profileApplicable === false) ? "Outside the chosen profile" : v.label,
          expected: expectedOf(entryR),
          evidence: (r && r.evidence) || "", notes: (r && r.notes) || "",
          owner: (r && r.owner) || "", action: (r && r.action) || "", impact: (r && r.impact) || "",
          priority: (r && r.priorityBand) || "", status: status,
          shared: !!(r && !own[c.id] && r.targetId !== t.id)
        });
        var key = groupName || "";
        var g = gfact[key];
        if (!g) { g = gfact[key] = { groupName: key, findings: 0, met: 0, recorded: 0, toAssess: 0, unanswered: 0, na: 0 }; fact.groups.push(g); }
        var field = { finding: "findings", met: "met", recorded: "recorded", "to-assess": "toAssess", unanswered: "unanswered", na: "na" }[status];
        g[field]++; fact[field]++;
      });
      facts.push(fact);
    });
    return { items: items, perTarget: facts };
  }

  function packEngagement() {
    var e = E(), m = e.state.engagement.engagement || {}, inst = e.state.instrument;
    return {
      client: m.clientName || "", site: m.siteName || "", consultant: m.consultant || "",
      instrumentId: inst.id, instrumentTitle: inst.title, scoringFamily: e.state.scoringFamily,
      targetLabel: inst.targetDimensionLabel || "Site",
      documentControl: {
        documentRevision: m.documentRevision || "", qaReviewBy: m.qaReviewBy || "", authorisedBy: m.authorisedBy || "",
        issuedTo: m.issuedTo || "", issuedDate: m.issuedDate || "", confidentiality: m.confidentiality || ""
      }
    };
  }

  // The whole pack. Resolves to { pack, docs }.
  function buildPack(progress) {
    var s = ensureStore();
    return buildDocuments({ charts: true }, progress).then(function (docs) {
      if (progress) progress("Writing the review pack…");
      var nr = RC().nextRound(s, docs);
      var extract = packItems();
      var basis = E().getBasisOfAssessment();
      var V = window.App.Version || {};
      var pack = {
        schema: RC().packSchema(),
        packId: nr.packId,
        reviewId: s.reviewId,
        round: nr.round,
        createdAt: new Date().toISOString(),
        sourceTool: { product: V.product || "OT Cyber Assessment Tool", version: V.number || "" },
        engagement: packEngagement(),
        documents: docs.map(function (d) {
          return { title: d.title, targetName: d.targetName, contentHash: d.contentHash, media: d.media, blocks: d.blocks };
        }),
        items: extract.items,
        basisOfAssessment: { interviews: basis.interviews, documents: basis.documents, observations: basis.observations },
        facts: { perTarget: extract.perTarget },
        previousRound: RC().previousRound(s)
      };
      return { pack: pack, docs: docs, store: s };
    });
  }

  function packFileName(pack) {
    var m = pack.engagement;
    return RC().fileSlug(m.client || m.instrumentTitle) + "-review-pack-round-" + pack.round + ".json";
  }

  // Send for review: build, write, then record the round. Written first and
  // recorded after, so a cancelled save dialog moves nothing on.
  function send(progress, done) {
    if (!E().state.instrument) { done({ ok: false, message: "Choose an assessment first." }); return; }
    buildPack(progress).then(function (r) {
      var text = JSON.stringify(r.pack);
      RC().saveNewFile(text, packFileName(r.pack), "Review pack", function (res) {
        if (!res.ok) {
          done({ ok: false, message: res.aborted ? null : "The pack was not saved" + (res.error ? ": " + res.error : ".") });
          return;
        }
        RC().recordRound(r.store, r.pack);
        E().touchReview();
        rememberSnapshot(r.docs);
        done({ ok: true, message: "Round " + r.pack.round + " pack saved as " + res.name + ". It holds client data: share it as you would the project file, then give it to each reviewer to open in the OT Cyber Report Review Tool.", pack: r.pack });
      });
    }).catch(function (e) {
      console.error(e);
      done({ ok: false, message: "The pack could not be built: " + ((e && e.message) || e) });
    });
  }

  // ---- the current report (what comments are checked against) ------------------
  //
  // Only built once a review exists, cached until the assessment changes, and
  // never with charts: its text is all that is read.
  var snap = { signature: null, docs: null, building: null, waiting: [] };

  function signature() {
    var e = E();
    if (!e.state.engagement) return "";
    return JSON.stringify([e.state.activeAssessmentId, e.state.engagement.engagement, e.state.engagement.responses, e.state.engagement.targets,
      e.state.engagement.targetProfile, e.state.engagement.reportNarrative, e.state.engagement.reportCustom, e.state.engagement.basisOfAssessment]);
  }
  function rememberSnapshot(docs) { snap.signature = signature(); snap.docs = docs; }

  // cb(err, docs) with the documents as they stand now.
  function currentDocs(cb) {
    var sig = signature();
    if (snap.docs && snap.signature === sig) { cb(null, snap.docs); return; }
    snap.waiting.push(cb);
    if (snap.building === sig) return;
    snap.building = sig;
    buildDocuments({ charts: false }).then(function (docs) {
      if (snap.building !== sig) return;     // something newer has started
      snap.building = null;
      snap.signature = sig; snap.docs = docs;
      var w = snap.waiting; snap.waiting = [];
      w.forEach(function (f) { f(null, docs); });
    }, function (e) {
      if (snap.building !== sig) return;
      snap.building = null;
      var w = snap.waiting; snap.waiting = [];
      w.forEach(function (f) { f(e); });
    });
  }
  function cachedDocs() { return snap.docs && snap.signature === signature() ? snap.docs : null; }
  function resetSnapshot() { snap = { signature: null, docs: null, building: null, waiting: [] }; }

  function allTexts(docs) {
    var set = {};
    function add(t) { var n = norm(t); if (n) set[n] = true; }
    docs.forEach(function (d) {
      d.blocks.forEach(function (b) {
        add(DB().blockText(b));
        if (b.type === "table") {
          b.rows.forEach(function (r) { r.cells.forEach(function (c) { add(c.text); }); });
        }
      });
      DB().flatten(d.blocks).forEach(function (b) { add(b.text); });
    });
    return set;
  }
  function docContains(docs, text) { return !!allTexts(docs)[norm(text)]; }

  // true when the comment no longer matches the report, null while unknown.
  function isStale(t) {
    var a = t.comment.anchor || {};
    if (a.kind === "general") return false;
    var e = E();
    if (a.kind === "item") {
      var target = targetByName(a.targetName);
      var inst = e.state.instrument;
      if (!target) return true;
      if (!window.App.Compare.catalogFor(inst, e.state.scoringFamily).some(function (c) { return c.id === a.itemId; })) return true;
      if (a.field && a.quote != null) {
        var h = holderOf(target.id, a.itemId, a.field);
        return norm(h.value) !== norm(a.quote);
      }
      return false;
    }
    if (!a.quote) return false;
    var docs = cachedDocs();
    if (!docs) return null;
    return !docContains(docs, a.quote);
  }

  function targetByName(name) {
    var ts = (E().state.engagement && E().state.engagement.targets) || [];
    return ts.filter(function (t) { return t.name === name; })[0] || null;
  }

  // ---- suggested wording: where it can go ------------------------------------

  var ITEM_FIELDS = { evidence: "evidence", notes: "notes", owner: "owner", action: "recommended action", impact: "business impact" };
  var MIN_FIELD_MATCH = 12;   // shorter than this, "the same text" is a coincidence

  // Which response holds a field for this target: its own, else the shared layer.
  function holderOf(targetId, itemId, field) {
    var e = E();
    var own = e.findResponse(targetId, itemId);
    var shared = e.SHARED_TARGET_ID ? e.findResponse(e.SHARED_TARGET_ID, itemId) : null;
    if (own && own[field] != null && own[field] !== "") return { targetId: targetId, value: own[field] };
    if (shared && shared[field] != null && shared[field] !== "") return { targetId: e.SHARED_TARGET_ID, value: shared[field] };
    return { targetId: targetId, value: "" };
  }

  // The new value of a field whose text sits inside the quoted paragraph
  // ("Evidence: <field>"): the suggestion keeps the same words around it, or
  // the field is the whole of it. Null if the suggestion cannot be fitted.
  function fitToField(fieldValue, quote, suggestion) {
    var v = norm(fieldValue), q = norm(quote), s = String(suggestion).trim();
    if (v === q) return s;
    var at = q.indexOf(v);
    if (at === -1) return null;
    var pre = q.slice(0, at), post = q.slice(at + v.length), ns = norm(s);
    if (ns.slice(0, pre.length) !== pre || (post && ns.slice(ns.length - post.length) !== post)) return null;
    return ns.slice(pre.length, ns.length - post.length).trim();
  }

  // Replaces one line of a multi-line field. Null when no line matches.
  function replaceLine(value, quote, suggestion) {
    var lines = String(value == null ? "" : value).split(/\r?\n/), hit = false;
    var out = lines.map(function (l) {
      if (hit || !norm(l)) return l;
      var fitted = norm(l).length >= MIN_FIELD_MATCH || norm(l) === norm(quote) ? fitToField(l, quote, suggestion) : null;
      if (fitted == null) return l;
      hit = true;
      return fitted;
    });
    return hit ? out.join("\n") : null;
  }

  var NOT_EDITABLE = "This text is written by the tool from the answers or the framework, so it cannot be changed here. Copy the wording, then use Go to.";

  function headingHasTarget(text) {
    var R = window.App.Report, eng = E().state.engagement;
    var plain = DB().stripNumber(text);
    return R.sectionKey(plain, { engagement: eng }) !== DB().slugTitle(plain);
  }

  // The leading run of a section across every document it prints in. Null when
  // the documents differ: a prose override replaces the run in all of them, so
  // one zone's wording would overwrite another's.
  function sharedLeads(docs, key) {
    var runs = [];
    docs.forEach(function (d) {
      (d.probe || []).forEach(function (s) { if (s.key === key) runs.push(s.texts); });
    });
    if (!runs.length) return null;
    var first = JSON.stringify(runs[0].map(norm));
    if (runs.some(function (r) { return JSON.stringify(r.map(norm)) !== first; })) return null;
    return runs[0];
  }

  // How a comment's suggestion would be applied, given the current documents.
  // { can, why, label, kind, apply(), undo(), expect: [texts], mustPrint }
  function planAccept(t, docs) {
    var c = t.comment, a = c.anchor || {}, sug = c.suggestion;
    if (!sug) return { can: false };
    var e = E(), R = window.App.Report, eng = e.state.engagement;

    if (a.kind === "item") {
      var target = targetByName(a.targetName);
      if (!target || !ITEM_FIELDS[a.field]) return { can: false, why: "This comment does not name one field of the item, so copy the wording and use Go to." };
      var holder = holderOf(target.id, a.itemId, a.field);
      if (norm(holder.value) !== norm(a.quote)) return { can: false, why: "The " + ITEM_FIELDS[a.field] + " has changed since the review, so copy the wording and compare." };
      return itemPlan(holder.targetId, a.itemId, a.field, holder.value, String(sug).trim(), docs);
    }
    if (a.kind !== "block") return { can: false, why: "This comment is not on a piece of the report's text." };
    if (!docs) return { can: false, why: "Still checking this against the current report." };
    if (!docContains(docs, a.quote)) return { can: false, why: "The report has changed, so this wording no longer matches what is there. Copy it and compare." };

    // A heading: the section's own title.
    var isHeading = (function () {
      var d = docs[a.documentIndex];
      return !!(d && d.blocks.filter(function (b) { return b.id === a.blockId && b.type === "heading"; })[0]) ||
        docs.some(function (dd) { return dd.blocks.some(function (b) { return b.type === "heading" && norm(b.text) === norm(a.quote); }); });
    })();
    if (isHeading) {
      if (!a.sectionKey) return { can: false, why: "This heading is a name from the assessment, not a section title. Rename it where it is entered." };
      if (headingHasTarget(a.quote)) return { can: false, why: "This heading is built from a target's name, so it cannot be renamed for one document." };
      var title = DB().stripNumber(sug), prevTitle = e.getReportSection(a.sectionKey).title || null;
      return { can: true, kind: "section title", label: "Accept",
        apply: function () { e.setReportSection(a.sectionKey, { title: title }); },
        undo: function () { e.setReportSection(a.sectionKey, { title: prevTitle }); },
        expect: [title], mustPrint: true };
    }

    // A narrative field the consultant wrote.
    var rn = e.getReportNarrative();
    var fields = ["regulatoryExposure", "topPriorities", "method"];
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i], val = rn[f];
      if (val == null || !norm(val)) continue;
      var next = replaceLine(val, a.quote, sug);
      if (next != null) return narrativePlan(f, val, next, sug);
    }

    // The proposed next steps: their own store, and until someone edits them
    // what prints is scaffolded from the assessment.
    var nsKey = R.sectionKey("Proposed next steps", { engagement: eng });
    if (a.sectionKey === nsKey) {
      var linesPerDoc = docs.map(function (d) {
        return DB().flatten(d.blocks.filter(function (b) { return b.sectionKey === nsKey && b.type !== "heading"; })).map(function (b) { return b.text; });
      });
      if (linesPerDoc.some(function (l) { return JSON.stringify(l) !== JSON.stringify(linesPerDoc[0]); })) {
        return { can: false, why: "The next steps differ between the documents, so editing them here would overwrite the others. Copy the wording and use Go to." };
      }
      var lines = linesPerDoc[0] || [], idx = -1;
      lines.forEach(function (l, k) { if (idx === -1 && norm(l) === norm(a.quote)) idx = k; });
      if (idx !== -1) {
        var repl = lines.slice(); repl[idx] = String(sug).trim();
        return narrativePlan("nextSteps", rn.nextSteps, repl.join("\n"), sug);
      }
    }

    // A plan or evidence field that prints in this paragraph or cell.
    var doc = docs[a.documentIndex] || {};
    var tid = doc.targetId || null;
    var matches = [];
    (eng.responses || []).forEach(function (r) {
      if (tid && r.targetId !== tid && r.targetId !== e.SHARED_TARGET_ID) return;
      Object.keys(ITEM_FIELDS).forEach(function (fld) {
        var v = r[fld];
        if (v == null || norm(v).length < MIN_FIELD_MATCH) return;
        var fitted = fitToField(v, a.quote, sug);
        if (fitted != null) matches.push({ targetId: r.targetId, itemId: r.requirementId, field: fld, value: v, next: fitted });
      });
    });
    if (matches.length === 1) {
      var m = matches[0];
      var ip = itemPlan(m.targetId, m.itemId, m.field, m.value, m.next, docs);
      ip.mustPrint = true;
      return ip;
    }
    if (matches.length > 1) return { can: false, why: "The same wording is recorded on " + matches.length + " items, so copy the wording and change the ones it should apply to." };

    // A section's opening prose: a rewrite replaces the whole run, so the run
    // is rebuilt with the one paragraph changed.
    if (a.sectionKey) {
      var occurs = docs.some(function (d) { return (d.probe || []).some(function (s) { return s.key === a.sectionKey && s.texts.some(function (x) { return norm(x) === norm(a.quote); }); }); });
      if (occurs) {
        var leads = sharedLeads(docs, a.sectionKey);
        if (!leads) return { can: false, why: "This section opens differently in each document, and a rewrite here would replace all of them. Copy the wording and use Go to." };
        var prev = e.getReportSection(a.sectionKey).prose || null;
        var keep = leads.filter(function (x) { return norm(x) !== norm(a.quote); });
        var prose = leads.map(function (x) { return norm(x) === norm(a.quote) ? String(sug).trim() : x; }).join("\n");
        return { can: true, kind: "section opening", label: "Accept",
          apply: function () { e.setReportSection(a.sectionKey, { prose: prose }); },
          undo: function () { e.setReportSection(a.sectionKey, { prose: prev }); },
          expect: String(sug).split(/\n/).filter(function (l) { return norm(l); }).concat(keep), mustPrint: true };
      }
    }
    return { can: false, why: NOT_EDITABLE };
  }

  function narrativePlan(field, prev, next, sug) {
    var e = E();
    var had = prev;
    return { can: true, kind: "narrative", label: "Accept",
      apply: function () { var p = {}; p[field] = next; e.setReportNarrative(p); },
      undo: function () { var p = {}; p[field] = had; e.setReportNarrative(p); },
      expect: String(sug).split(/\n/).filter(function (l) { return norm(l); }), mustPrint: true };
  }

  function itemPlan(targetId, itemId, field, prev, next, docs) {
    var e = E();
    var printed = !!(docs && norm(prev) && docContainsFragment(docs, prev));
    return { can: true, kind: ITEM_FIELDS[field], label: "Accept",
      apply: function () { var p = {}; p[field] = next; e.setResponse(targetId, itemId, p); },
      undo: function () { var p = {}; p[field] = prev; e.setResponse(targetId, itemId, p); },
      expect: [next], mustPrint: printed, fragment: true };
  }

  function docContainsFragment(docs, text) {
    var n = norm(text);
    return docs.some(function (d) { return DB().flatten(d.blocks).some(function (b) { return norm(b.text).indexOf(n) !== -1; }); });
  }

  function acceptPlan(t) {
    try { return planAccept(t, cachedDocs()); }
    catch (e) { console.error(e); return { can: false, why: "This could not be worked out, so copy the wording." }; }
  }

  // Apply, rebuild, check the wording is really in the Word document. If not,
  // undo and say so; the comment stays open, with Copy.
  function accept(t, done) {
    currentDocs(function (err, docs) {
      if (err) { done({ ok: false, message: "The report could not be read: " + (err.message || err) }); return; }
      var plan = planAccept(t, docs);
      if (!plan.can) { done({ ok: false, message: plan.why || "This cannot be applied." }); return; }
      try { plan.apply(); }
      catch (e) { done({ ok: false, message: "This could not be applied: " + (e.message || e) }); return; }
      currentDocs(function (err2, after) {
        var missing = err2 ? plan.expect : plan.expect.filter(function (x) {
          return plan.fragment ? !docContainsFragment(after, x) : !docContains(after, x);
        });
        if (plan.mustPrint && missing.length) {
          plan.undo();
          currentDocs(function () {
            markPlanFailed(t);
            done({ ok: false, message: "That wording did not reach the Word document when it was rebuilt, so the change was undone. Copy the wording and use Go to." });
          });
          return;
        }
        t.accepted = { at: new Date().toISOString(), kind: plan.kind };
        t.status = "resolved"; t.statusAt = t.accepted.at;
        E().touchReview();
        done({ ok: true, message: "Accepted into the " + plan.kind + ", and checked in the rebuilt Word document." +
          (plan.mustPrint ? "" : " This field does not print in the Word report, so the change shows only in the assessment.") });
      });
    });
  }
  // Remembered for this session, so the failed Accept is not offered again.
  var failedPlans = {};
  function markPlanFailed(t) { failedPlans[t.comment.id] = true; }

  // ---- taking the author to it ---------------------------------------------------

  function goTo(t) {
    var a = t.comment.anchor || {};
    var U = UI();
    if (a.kind === "item") {
      var target = targetByName(a.targetName);
      if (!target) { U.toast("That " + (E().state.instrument.targetDimensionLabel || "target").toLowerCase() + " is no longer in this assessment.", "warn"); return; }
      if (a.field === "action" || a.field === "impact" || a.field === "owner") { U.openPlanFor(a.itemId, holderOf(target.id, a.itemId, a.field).targetId === E().SHARED_TARGET_ID ? E().SHARED_TARGET_ID : target.id); return; }
      U.jumpToItem(target.id, a.itemId);
      return;
    }
    var docs = cachedDocs();
    var d = docs && docs[a.documentIndex];
    if (d && d.targetId) U.setTargetThen(d.targetId, function () {});
    U.goToSection(a.sectionKey, a);
  }

  // ---- what the Issue check says ----------------------------------------------

  function currentHashes() {
    var docs = cachedDocs();
    return docs ? docs.map(function (d) { return d.contentHash; }) : null;
  }
  function warningList() {
    return RC().warnings(store() || RC().emptyStore(), currentHashes());
  }
  // For App.UI's issue check: the same shape as its own warning lines.
  function issueWarnings() {
    if (!E().state.instrument) return [];
    var goCard = function () { UI().revealOnReport('[data-check-anchor="review"]'); };
    return warningList().map(function (w) {
      return { cls: "warn review-warn", kind: w.kind, text: w.text, label: "Review", go: goCard };
    });
  }
  // Something needs the current text (a review exists): make sure it gets read,
  // then let the page repaint. Returns true when a read has been started.
  function refresh(cb) {
    if (!store()) { if (cb) cb(); return false; }
    if (cachedDocs()) { if (cb) cb(); return false; }
    currentDocs(function () { if (cb) cb(); });
    return true;
  }

  // ---- QA review by ------------------------------------------------------------
  //
  // An approval can fill QA review by, and the consultant says so: offered once
  // per file, and an existing different value is never replaced without asking.
  var qaOffers = [];   // { reviewer, fileId }

  function afterImport(results) {
    results.forEach(function (r) {
      if (!RC().isApproval(r.verdict)) return;
      if (norm((E().state.engagement.engagement || {}).qaReviewBy) === norm(r.reviewer)) return;
      if (!qaOffers.some(function (o) { return o.reviewer === r.reviewer; })) qaOffers.push({ reviewer: r.reviewer });
    });
  }
  function qaPrompt(repaint) {
    if (!qaOffers.length) return null;
    var U = UI(), h = U.h, o = qaOffers[0];
    var cur = norm((E().state.engagement.engagement || {}).qaReviewBy);
    function finish(fill) {
      qaOffers.shift();
      if (fill) { E().updateMetadata({ qaReviewBy: o.reviewer }); U.toast("QA review by now says " + o.reviewer + ".", ""); }
      repaint();
    }
    return h("div", { class: "rv-qa" }, [
      h("span", { class: "rv-qa-text", text: cur
        ? o.reviewer + " approved the report, and QA review by already says " + cur + ". Replace it with " + o.reviewer + "?"
        : o.reviewer + " approved the report. Fill in QA review by with this name?" }),
      h("button", { type: "button", class: "btn primary rv-qa-yes", text: cur ? "Replace" : "Fill in", onClick: function () { finish(true); } }),
      h("button", { type: "button", class: "btn rv-qa-no", text: cur ? "Keep " + cur : "Not now", onClick: function () { finish(false); } })
    ]);
  }

  // ---- the card -------------------------------------------------------------------

  var panelUi = null, panelFor = null;
  function panelState() {
    var id = E().state.activeAssessmentId;
    if (panelFor !== id) { panelUi = window.App.ReviewAuthor.newUi(); panelFor = id; qaOffers = []; }
    return panelUi;
  }

  function adapter(container) {
    var U = UI();
    return {
      store: function () { return store() || RC().emptyStore(); },
      touch: function () { E().touchReview(); },
      send: function (progress, done) { send(progress, done); },
      afterImport: afterImport,
      goTo: goTo,
      acceptPlan: function (t) {
        if (failedPlans[t.comment.id]) return { can: false, why: "That wording did not reach the Word document when it was rebuilt, so copy it and use Go to." };
        return acceptPlan(t);
      },
      accept: accept,
      stale: isStale,
      authorName: function () { return norm((E().state.engagement.engagement || {}).consultant) || "Author"; },
      extras: function () { return qaPrompt(function () { paint(container); }); },
      toast: U.toast
    };
  }
  function paint(container) { window.App.ReviewAuthor.mount(container, adapter(container), panelState()); }

  // The report page's card. Not a report section: it has no data-section, and
  // the report renderers and the exporters never see it.
  function buildCard() {
    var U = UI(), h = U.h;
    var body = h("div", { class: "card-b" });
    var card = h("div", { class: "card review-card", "data-check-anchor": "review" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Review" })]),
      body
    ]);
    body.appendChild(h("p", { class: "issue-lead", text: "Send the report for review as a pack. Each reviewer opens it in the OT Cyber Report Review Tool and sends back a small review file; import those here. Nothing on this card reaches the Word or Excel report." }));
    var holder = h("div", { class: "rv-panel" });
    body.appendChild(holder);
    paint(holder);
    // Comments are checked against the current report once it has been read.
    if (store() && !cachedDocs()) {
      currentDocs(function () { if (holder.isConnected) paint(holder); U.repaintIssueCheck(); });
    }
    return card;
  }

  return {
    buildCard: buildCard,
    send: send,
    buildPack: buildPack,
    buildDocuments: buildDocuments,
    packItems: packItems,
    packFileName: packFileName,
    store: store,
    ensureStore: ensureStore,
    importTexts: function (list) { var a = adapter(null); return window.App.ReviewAuthor.importTexts(a, list, null, null); },
    acceptPlan: acceptPlan,
    accept: accept,
    isStale: isStale,
    goTo: goTo,
    currentDocs: currentDocs,
    cachedDocs: cachedDocs,
    resetSnapshot: resetSnapshot,
    refresh: refresh,
    issueWarnings: issueWarnings,
    warningList: warningList,
    qaOffers: function () { return qaOffers.slice(); }
  };
})();
