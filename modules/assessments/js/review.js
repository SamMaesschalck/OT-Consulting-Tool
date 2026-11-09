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
 *                     undoes it if not. What it replaced is kept on the
 *                     comment (thread.accepted.revert), for undoAccept.
 *   Issue check      warnings only (issueWarnings). Final is never stopped by
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
    // The CAF family's expected state for the outcome under the chosen profile
    // (none where the profile sets no expectation), and the ML family's level
    // by its name rather than its id.
    if (entry.expectedStateLabel) return String(entry.expectedStateLabel);
    if (entry.targetLabel) return String(entry.targetLabel);
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
          targetName: t.name, targetId: t.id, itemId: c.id, code: c.code || c.id, title: c.label || "", groupName: groupName,
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

  // The whole pack. Resolves to { pack, docs }. opts { note, neededBy }: what
  // the author typed for the reviewers, carried as the pack's request only
  // when something was (it never reaches Word or Excel).
  function buildPack(progress, opts) {
    var s = ensureStore();
    var note = String((opts && opts.note) || "").trim(), neededBy = norm(opts && opts.neededBy);
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
      if (note || neededBy) {
        pack.request = {};
        if (note) pack.request.note = note;
        if (neededBy) pack.request.neededBy = neededBy;
      }
      return { pack: pack, docs: docs, store: s };
    });
  }

  function packFileName(pack) {
    var m = pack.engagement;
    return RC().fileSlug(m.client || m.instrumentTitle) + "-review-pack-round-" + pack.round + ".json";
  }

  // Send for review: build, write, then record the round. Written first and
  // recorded after, so a cancelled save dialog moves nothing on.
  function send(progress, done, opts) {
    if (!E().state.instrument) { done({ ok: false, message: "Choose an assessment first." }); return; }
    buildPack(progress, opts).then(function (r) {
      var text = JSON.stringify(r.pack);
      RC().saveNewFile(text, packFileName(r.pack), "Review pack", function (res) {
        if (!res.ok) {
          done({ ok: false, message: res.aborted ? null : "The pack was not saved" + (res.error ? ": " + res.error : ".") });
          return;
        }
        RC().recordRound(r.store, r.pack);
        E().touchReview();
        rememberSnapshot(r.docs);
        done({ ok: true, message: "Round " + r.pack.round + " pack saved as " + res.name + ". It holds client data: share it as you would the project file, then give it to each reviewer to open in the OT Cyber Report Review Tool.", pack: r.pack, name: res.name });
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
    // The baseline (with its target mapping) decides each document's progress
    // section, so loading, clearing or remapping it is a change of content.
    // The target selected on screen is not: the documents never depend on it.
    return JSON.stringify([e.state.activeAssessmentId, e.state.engagement.engagement, e.state.engagement.responses, e.state.engagement.targets,
      e.state.engagement.targetProfile, e.state.engagement.reportNarrative, e.state.engagement.reportCustom, e.state.engagement.basisOfAssessment,
      e.getBaseline ? e.getBaseline() : null]);
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
        if (b.type === "heading") add(DB().stripNumber(b.text));
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
      var target = targetOf(a);
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

  // The target an item comment is on: by its id when the anchor carries one,
  // so a site or zone renamed since the pack still holds its comments, else by
  // name (an older file).
  function targetOf(a) {
    var ts = (E().state.engagement && E().state.engagement.targets) || [];
    return (a.targetId && ts.filter(function (t) { return t.id === a.targetId; })[0]) ||
      ts.filter(function (t) { return t.name === a.targetName; })[0] || null;
  }
  function targetWord() { return String((E().state.instrument && E().state.instrument.targetDimensionLabel) || "target").toLowerCase(); }

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
      var target = targetOf(a);
      if (!target) return { can: false, why: "The " + targetWord() + " this comment is on can no longer be found, so copy the wording and compare." };
      if (!ITEM_FIELDS[a.field]) return { can: false, why: "This comment does not name one field of the item, so copy the wording and use Go to." };
      var holder = holderOf(target.id, a.itemId, a.field);
      if (norm(holder.value) !== norm(a.quote)) return { can: false, why: "The " + ITEM_FIELDS[a.field] + " has changed since the review, so copy the wording and compare." };
      return itemPlan(holder.targetId, a.itemId, a.field, holder.value, String(sug).trim(), docs);
    }
    if (a.kind !== "block") return { can: false, why: "This comment is not on a piece of the report's text." };
    if (!docs) return { can: false, why: "Still checking this against the current report." };
    if (!docContains(docs, a.quote)) return { can: false, why: "The report has changed, so this wording no longer matches what is there. Copy it and compare." };

    // A heading: the section's own title.
    var isHeading = !a.cell && docs.some(function (dd) {
      return dd.blocks.some(function (b) { return b.type === "heading" && !b.sub && b.sectionKey === a.sectionKey && norm(b.text) === norm(a.quote); });
    });
    if (isHeading) {
      if (!a.sectionKey) return { can: false, why: "This heading is a name from the assessment, not a section title. Rename it where it is entered." };
      if (headingHasTarget(a.quote)) return { can: false, why: "This heading is built from a target's name, so it cannot be renamed for one document." };
      var title = DB().stripNumber(sug), prevTitle = e.getReportSection(a.sectionKey).title || null;
      return { can: true, kind: "section title", label: "Accept",
        apply: function () { e.setReportSection(a.sectionKey, { title: title }); },
        undo: function () { e.setReportSection(a.sectionKey, { title: prevTitle }); },
        revert: { what: "section", key: a.sectionKey, field: "title", prev: prevTitle }, applied: title,
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
          revert: { what: "section", key: a.sectionKey, field: "prose", prev: prev }, applied: prose,
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
      // null for next steps that were still scaffolded: putting null back
      // scaffolds them again.
      revert: { what: "narrative", field: field, prev: had == null ? null : had }, applied: next,
      expect: String(sug).split(/\n/).filter(function (l) { return norm(l); }), mustPrint: true };
  }

  function itemPlan(targetId, itemId, field, prev, next, docs) {
    var e = E();
    var printed = !!(docs && norm(prev) && docContainsFragment(docs, prev));
    return { can: true, kind: ITEM_FIELDS[field], label: "Accept",
      apply: function () { var p = {}; p[field] = next; e.setResponse(targetId, itemId, p); },
      undo: function () { var p = {}; p[field] = prev; e.setResponse(targetId, itemId, p); },
      revert: { what: "item", targetId: targetId, itemId: itemId, field: field, prev: prev == null ? "" : prev }, applied: next,
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
        // What was replaced is kept with the comment, so the change can be
        // put back from it (Undo the accepted wording) and is never lost in a
        // section the report page has no card for.
        t.accepted = { at: new Date().toISOString(), kind: plan.kind };
        if (plan.revert) { t.accepted.revert = plan.revert; t.accepted.applied = plan.applied; }
        t.status = "resolved"; t.statusAt = t.accepted.at;
        E().touchReview();
        done({ ok: true, message: "Accepted into the " + plan.kind + ", and checked in the rebuilt Word document." +
          (plan.mustPrint ? "" : " This field does not print in the Word report, so the change shows only in the assessment.") });
      });
    });
  }

  // What the accepted change touched holds now, or undefined if it is gone.
  function revertTarget(rv) {
    var e = E();
    if (rv.what === "section") return e.getReportSection(rv.key)[rv.field];
    if (rv.what === "narrative") return e.getReportNarrative()[rv.field];
    if (rv.what === "item") {
      if (!(e.state.engagement.targets || []).some(function (t) { return t.id === rv.targetId; }) && rv.targetId !== e.SHARED_TARGET_ID) return undefined;
      var r = e.findResponse(rv.targetId, rv.itemId);
      return r ? r[rv.field] : "";
    }
    return undefined;
  }

  // Puts back what Accept replaced, and opens the comment again. Refused when
  // the text has been edited since, as putting the old wording back would
  // throw that edit away.
  function undoAccept(t, done) {
    var acc = t && t.accepted, rv = acc && acc.revert;
    if (!rv) { done({ ok: false, message: "There is no record of what this replaced, so change it where it is entered." }); return; }
    var e = E(), cur = revertTarget(rv);
    if (cur === undefined && rv.what === "item") { done({ ok: false, message: "That " + targetWord() + " is no longer in this assessment, so there is nothing to put back." }); return; }
    if (norm(cur) !== norm(acc.applied)) {
      done({ ok: false, message: "The wording has been edited since it was accepted, so the earlier wording was not put back. Use Edit where it is, or change it where it is entered." });
      return;
    }
    var p = {};
    try {
      if (rv.what === "section") { p[rv.field] = rv.prev == null ? null : rv.prev; e.setReportSection(rv.key, p); }
      else if (rv.what === "narrative") { p[rv.field] = rv.prev == null ? null : rv.prev; e.setReportNarrative(p); }
      else { p[rv.field] = rv.prev == null ? "" : rv.prev; e.setResponse(rv.targetId, rv.itemId, p); }
    } catch (x) { done({ ok: false, message: "The earlier wording could not be put back: " + (x.message || x) }); return; }
    delete t.accepted;
    delete failedPlans[t.comment.id];
    t.status = "open"; t.reason = ""; t.statusAt = new Date().toISOString();
    delete t.reopened;
    e.touchReview();
    done({ ok: true, message: "The earlier wording is back, and the comment is open again." });
  }
  // Remembered for this session, so the failed Accept is not offered again.
  var failedPlans = {};
  function markPlanFailed(t) { failedPlans[t.comment.id] = true; }

  // ---- taking the author to it ---------------------------------------------------

  function canGo(t) {
    var a = t.comment.anchor || {};
    return a.kind !== "general" || /^Basis of assessment/.test(a.sectionTitle || "");
  }
  // Many Word sections have no card on the report page under the same key, but
  // most are edited somewhere: the document control page in the engagement
  // details, the basis of assessment in its register, the executive summary in
  // the consultant's input, a finding on its item. Tried in this order; the
  // first that is on the page wins. cards are other report-page keys.
  var PLACES = [
    { re: /^terms-used-in-the-findings$|^other-terms-used-in-this-report$/, cards: [/^terms-used-in-this-report$/] },
    { re: /^executive-summary$/, anchor: "consultant-input" },
    { re: /^document-control/, engagement: true },
    { re: /^(basis-of-assessment|people-interviewed|documents-reviewed|systems-observed)$/, basis: true },
    { re: /^method-and-limitations$|^scope-and-method$/, anchor: "narrative-method", cards: [/^about-this-assessment$/, /^not-a-formal-assessment$/, /^about-the-/] },
    { re: /^(progress-since-previous-assessment|change-since-the-previous-assessment)$/, anchor: "progress" },
    { re: /^findings-by-|^results-by-|^results-across-|^closeness-to-target|-achieved$|^full-obligation-register$|^fr\d+-/,
      cards: [/^results-by-/, /^fr-breakdown$/, /^domain-results$/, /^fr-achievement-vs-target$/, /^the-three-positions/] },
    { re: /at-a-glance$|^(outcome|conformance)-profile-by-|^maturity-distribution-by-|^posture-by-|^achieved-security-level|^overall-posture/,
      cards: [/headline/, /^posture-summary$/, /^the-three-positions/, /^achieved-security-level/, /^capability-security-level/, /^results-by-/] },
    { re: /roadmap|recommendations|^where-to-focus-first$/, cards: [/^where-to-focus-first$/, /roadmap/, /^priority-order$/, /^results-by-/] }
  ];

  // The catalogue item a piece of report text is about, when it opens with the
  // item's code ("SR 1.1 Human user ...", "A1.a Board direction").
  function itemByCode(text, catalog) {
    var s = norm(text), best = null;
    if (!s) return null;
    catalog.forEach(function (c) {
      var code = norm(c.code || c.id);
      if (code.length < 2 || !/[a-z.]/i.test(code)) return;
      if (s.slice(0, code.length).toLowerCase() !== code.toLowerCase()) return;
      var next = s.charAt(code.length);
      if (next && /[a-z0-9]/i.test(next)) return;
      if (!best || code.length > norm(best.code || best.id).length) best = c;
    });
    return best;
  }

  // Takes the author to a report section by its key: its card, else the place
  // it is edited, else a card close to it. Returns where it went, or null.
  function placeSection(key, have, U) {
    if (!key) return null;
    if (have[key] && U.goToSection(key, null, true)) return "card:" + key;
    var keys = Object.keys(have);
    for (var i = 0; i < PLACES.length; i++) {
      var p = PLACES[i];
      if (!p.re.test(key)) continue;
      if (p.engagement) { U.openEngagement("documentRevision"); return "engagement"; }
      if (p.basis) { U.goToBasis(); return "basis"; }
      if (p.anchor && U.revealIfThere('[data-check-anchor="' + p.anchor + '"]')) return "anchor:" + p.anchor;
      var cards = p.cards || [];
      for (var j = 0; j < cards.length; j++) {
        var k = keys.filter(function (x) { return cards[j].test(x); })[0];
        if (k && U.goToSection(k, null, true)) return "card:" + k;
      }
    }
    // A card under a near name: a domain's card carries its code in front
    // ("gov-governance-and-risk"), and a few headings differ in the last word.
    var words = key.split("-");
    var near = keys.filter(function (x) { return x.slice(-(key.length + 1)) === "-" + key; })[0] ||
      (words.length >= 3 ? keys.filter(function (x) { return x.split("-").slice(0, 3).join("-") === words.slice(0, 3).join("-"); })[0] : null);
    if (near && U.goToSection(near, null, true)) return "card:" + near;
    return null;
  }

  function goTo(t) {
    var a = t.comment.anchor || {};
    var U = UI(), e = E();
    if (a.kind === "general") { U.goToBasis(); return "basis"; }
    if (a.kind === "item") {
      var target = targetOf(a);
      if (!target) { U.toast("That " + targetWord() + " is no longer in this assessment.", "warn"); return null; }
      if (a.field === "action" || a.field === "impact" || a.field === "owner") { U.openPlanFor(a.itemId, holderOf(target.id, a.itemId, a.field).targetId === e.SHARED_TARGET_ID ? e.SHARED_TARGET_ID : target.id); return "plan:" + a.itemId; }
      U.jumpToItem(target.id, a.itemId);
      return "item:" + a.itemId;
    }
    var docs = cachedDocs();
    var d = docs && docs[a.documentIndex];
    if (d && d.targetId) U.setTargetThen(d.targetId, function () {});
    var have = {};
    U.sectionKeys().forEach(function (k) { have[k] = true; });
    if (have[a.sectionKey] && U.goToSection(a.sectionKey, a, true)) return "card:" + a.sectionKey;

    // A finding: the text, its table row, or the smaller heading above it
    // opens with an item's code.
    var blocks = (d && d.blocks) || [];
    var at = -1;
    blocks.forEach(function (b, i) { if (at === -1 && b.id === a.blockId) at = i; });
    var catalog = window.App.Compare.catalogFor(e.state.instrument, e.state.scoringFamily);
    var texts = [a.quote];
    var b0 = at !== -1 ? blocks[at] : null;
    if (b0 && b0.type === "table" && a.cell && b0.rows[a.cell.row]) texts = texts.concat(b0.rows[a.cell.row].cells.map(function (c) { return c.text; }));
    for (var i = at - 1; i >= 0 && blocks[i].sectionKey === a.sectionKey; i--) {
      if (blocks[i].type === "heading") { texts.push(blocks[i].text); if (!blocks[i].sub) break; }
    }
    for (var k = 0; k < texts.length; k++) {
      var item = itemByCode(texts[k], catalog);
      if (item) {
        U.jumpToItem((d && d.targetId) || e.state.activeTargetId, item.id);
        return "item:" + item.id;
      }
    }

    var went = placeSection(a.sectionKey, have, U);
    if (went) return went;
    // Else the section this one sits in, by the headings above it.
    var own = blocks.filter(function (b) { return b.type === "heading" && !b.sub && b.sectionKey === a.sectionKey; })[0];
    var level = own ? own.level : 99;
    for (var j = (at !== -1 ? at : blocks.indexOf(own)) - 1; j >= 0; j--) {
      var hb = blocks[j];
      if (hb.type !== "heading" || hb.sub || !(hb.level < level)) continue;
      level = hb.level;
      went = placeSection(hb.sectionKey, have, U);
      if (went) return went;
    }
    U.toast((a.sectionTitle ? "\"" + a.sectionTitle + "\" is" : "That part is") + " only in the Word report, so the report page has no card for it.", "warn");
    return null;
  }

  // ---- what the Issue check says ----------------------------------------------

  function currentHashes() {
    var docs = cachedDocs();
    return docs ? docs.map(function (d) { return d.contentHash; }) : null;
  }
  // QA review by filled in, with nothing ever sent, is a review done outside
  // the tools: no "not reviewed" line then.
  function warningList() {
    var m = (E().state.engagement && E().state.engagement.engagement) || {};
    return RC().warnings(store() || RC().emptyStore(), currentHashes(), { qaReviewBy: m.qaReviewBy || "" });
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

  // ---- a pack this copy of the project has no record of ---------------------------
  //
  // If the project was not saved after Send for review, or an older copy is
  // open, the round is not in the store and every review file is refused. The
  // pack itself can put the round back (review-author asks packMatches first);
  // packHint names another assessment in this file that did send it.
  function packMatches(pack) {
    var inst = E().state.instrument, eng = (pack && pack.engagement) || {};
    if (!inst || eng.instrumentId !== inst.id) return false;
    var m = E().state.engagement.engagement || {};
    return norm(eng.client).toLowerCase() === norm(m.clientName).toLowerCase();
  }
  function packHint(packId) {
    var e = E(), all = e.state.assessments || {}, hit = null;
    Object.keys(all).forEach(function (id) {
      if (hit || id === e.state.activeAssessmentId) return;
      var rv = all[id] && all[id].review;
      if (rv && Array.isArray(rv.rounds) && rv.rounds.some(function (r) { return r.packId === packId; })) hit = id;
    });
    if (!hit) return null;
    var row = (e.listAssessments ? e.listAssessments() : []).filter(function (x) { return x.id === hit; })[0];
    return "This file is for the " + ((row && (row.label || row.instrumentTitle)) || "other") + " assessment in this project: switch to it, then import the file.";
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

  var panelUi = null, panelFor = null, liveHolder = null;
  function panelState() {
    var id = E().state.activeAssessmentId;
    if (panelFor !== id) { panelUi = window.App.ReviewAuthor.newUi(); panelFor = id; qaOffers = []; }
    return panelUi;
  }

  function adapter(container) {
    var U = UI();
    return {
      store: function () { return store() || RC().emptyStore(); },
      // Starts the review on the assessment, for a pack imported before any.
      ensureStore: ensureStore,
      touch: function () { E().touchReview(); },
      send: function (progress, done, opts) { send(progress, done, opts); },
      afterImport: afterImport,
      goTo: goTo,
      canGo: canGo,
      // Back from a Go to that left the report page (an item, its plan, the basis).
      showCard: function () { window.App.UI.go("report"); },
      live: function () { return liveHolder && liveHolder.isConnected ? liveHolder : null; },
      acceptPlan: function (t) {
        if (failedPlans[t.comment.id]) return { can: false, why: "That wording did not reach the Word document when it was rebuilt, so copy it and use Go to." };
        return acceptPlan(t);
      },
      accept: accept,
      undoAccept: undoAccept,
      packMatches: packMatches,
      packHint: packHint,
      stale: isStale,
      authorName: function () { return norm((E().state.engagement.engagement || {}).consultant) || "Author"; },
      extras: function () { return qaPrompt(function () { paint(liveHolder && liveHolder.isConnected ? liveHolder : container); }); },
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
    liveHolder = holder;   // Accept can redraw the page while it is checking
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
    undoAccept: undoAccept,
    packMatches: packMatches,
    packHint: packHint,
    isStale: isStale,
    goTo: goTo,
    canGo: canGo,
    currentDocs: currentDocs,
    cachedDocs: cachedDocs,
    resetSnapshot: resetSnapshot,
    refresh: refresh,
    issueWarnings: issueWarnings,
    warningList: warningList,
    qaOffers: function () { return qaOffers.slice(); }
  };
})();
