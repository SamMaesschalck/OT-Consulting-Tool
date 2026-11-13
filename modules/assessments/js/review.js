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
        done({ ok: true, message: "Round " + r.pack.round + " pack saved as " + res.name + ". It holds client data, so share it only with the reviewers.", pack: r.pack, name: res.name });
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

  // One drawing of the comments list asks, for every card, whether the
  // comment is stale and whether its wording can be accepted. What those
  // answers are worked out from (the signature, the resolved answers, the
  // filled item fields) is the same for every card, so it is kept between
  // review-author's beginPaint and endPaint and worked out once. Outside a
  // drawing nothing is kept: the assessment may change between any two calls.
  var paintMemo = null, paintDepth = 0;
  // How often each was really worked out, for the test that a drawing does
  // not go back to once per card.
  var counts = { signature: 0, texts: 0, fields: 0, resolved: 0 };
  function beginPaint() { if (!paintDepth++) paintMemo = {}; }
  function endPaint() { if (paintDepth && !--paintDepth) paintMemo = null; }
  function once(key, make) {
    if (!paintMemo) return make();
    if (!(key in paintMemo)) paintMemo[key] = make();
    return paintMemo[key];
  }

  // Everything the Word build reads, so a change to any of it is seen as a
  // change of content: the whole assessment (answers, targets, profile and
  // setup choices, narrative, section overrides, basis, baseline with its
  // target mapping, and whatever is added to it later) without the review
  // itself, the engagement details it shares with the project, and which
  // other instruments in the project have answers (the report names its
  // companions). The target selected on screen is not in it: the documents
  // never depend on it.
  function signature() {
    return once("signature", function () {
      var e = E();
      if (!e.state.engagement) return "";
      counts.signature++;
      var ass = (e.state.assessments || {})[e.state.activeAssessmentId] || {};
      var own = Object.assign({}, ass);
      delete own.review;
      return JSON.stringify([e.state.activeAssessmentId, e.state.engagement.engagement, own,
        e.answeredInstrumentIds ? e.answeredInstrumentIds() : null]);
    });
  }
  function rememberSnapshot(docs) { snap.signature = signature(); snap.docs = docs; snap.texts = null; snap.red = null; }

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
      snap.signature = sig; snap.docs = docs; snap.texts = null; snap.red = null;
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

  // Every piece of text in the documents, normalised. The snapshot's own set
  // is kept with it: the documents do not change once read.
  function allTexts(docs) {
    if (docs === snap.docs && snap.texts) return snap.texts;
    counts.texts++;
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
    if (docs === snap.docs) snap.texts = set;
    return set;
  }
  function docContains(docs, text) { return !!allTexts(docs)[norm(text)]; }
  // What the documents print in red: the prompts the Issue check counts.
  function redTexts(docs) {
    if (docs === snap.docs && snap.red) return snap.red;
    var set = {};
    docs.forEach(function (d) {
      DB().flatten(d.blocks).forEach(function (b) { if (b.red && norm(b.text)) set[norm(b.text)] = true; });
    });
    if (docs === snap.docs) snap.red = set;
    return set;
  }

  // The document a comment is on. A document's place among those built can
  // change (a site added or removed), so it is found by its title, then by
  // its target, and by its place only when neither settles it.
  function docFor(a, docs) {
    if (!docs) return null;
    var named = a.documentTitle ? docs.filter(function (d) { return d.title === a.documentTitle; }) : [];
    if (named.length === 1) return named[0];
    var forTarget = a.kind === "block" && (a.targetId || a.targetName) ? docs.filter(function (d) {
      return a.targetId ? d.targetId === a.targetId : d.targetName === a.targetName;
    }) : [];
    if (forTarget.length === 1) return forTarget[0];
    return docs[Number(a.documentIndex) || 0] || null;
  }

  // The cell of a table that holds the quoted text. Where several do, the
  // one in the row and under the column heading the reviewer's tool noted
  // (anchor.rowKey, anchor.colHead), then the one at the same place.
  function cellFor(a, table, q) {
    var rows = table.rows || [], found = [];
    rows.forEach(function (r, ri) {
      (r.cells || []).forEach(function (c, ci) { if (norm(c.text) === q) found.push({ row: ri, col: ci }); });
    });
    if (found.length < 2) return found[0] || null;
    var rk = norm(a.rowKey), ch = norm(a.colHead), was = a.cell || {};
    function score(f) {
      var head = rows[0] && rows[0].cells[f.col];
      return (rk && norm(rows[f.row].cells[0].text) === rk ? 4 : 0) + (ch && head && norm(head.text) === ch ? 2 : 0) +
        (f.row === was.row && f.col === was.col ? 1 : 0);
    }
    return found.slice().sort(function (x, y) { return score(y) - score(x); })[0];
  }

  // The block a comment is on, in the document as it is now:
  // { block, index, cell }, or null. A block's id is its position, which
  // moves when anything above it is added, hidden or rewritten, so the block
  // is found by its wording within its section first, and by its id only
  // when the wording finds nothing (an image, or text changed since).
  function blockFor(a, doc) {
    var blocks = (doc && doc.blocks) || [], q = norm(a.quote), key = a.sectionKey || "", hits = [];
    if (q) blocks.forEach(function (b, i) {
      if ((b.sectionKey || "") !== key) return;
      if (a.cell) {
        var cell = b.type === "table" ? cellFor(a, b, q) : null;
        if (cell) hits.push({ block: b, index: i, cell: cell });
      } else if (norm(DB().blockText(b)) === q || (b.type === "heading" && norm(DB().stripNumber(b.text)) === q)) {
        hits.push({ block: b, index: i, cell: null });
      }
    });
    if (hits.length) return hits.filter(function (x) { return x.block.id === a.blockId; })[0] || hits[0];
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].id !== a.blockId) continue;
      var rows = blocks[i].rows || [];
      return { block: blocks[i], index: i, cell: a.cell && rows[a.cell.row] ? a.cell : null, byId: true };
    }
    return null;
  }

  // What says which item a block is about: its table row, then the headings
  // over it in its section, nearest first.
  function contextTexts(a, doc, loc) {
    var blocks = (doc && doc.blocks) || [], texts = [];
    if (!loc) return texts;
    var b = loc.block;
    if (b.type === "table" && loc.cell && b.rows[loc.cell.row]) texts = texts.concat(b.rows[loc.cell.row].cells.map(function (c) { return c.text; }));
    for (var i = loc.index - 1; i >= 0 && blocks[i].sectionKey === b.sectionKey; i--) {
      if (blocks[i].type === "heading") { texts.push(blocks[i].text); if (!blocks[i].sub) break; }
    }
    return texts;
  }
  function catalog() {
    return once("catalog", function () { return window.App.Compare.catalogFor(E().state.instrument, E().state.scoringFamily); });
  }

  // true when the comment no longer matches the report, null while unknown.
  function isStale(t) {
    var a = t.comment.anchor || {};
    if (a.kind === "general") return false;
    var e = E();
    if (a.kind === "item") {
      var target = targetOf(a);
      if (!target) return true;
      var ids = once("catalogIds", function () { var m = {}; catalog().forEach(function (c) { m[c.id] = true; }); return m; });
      if (!ids[a.itemId]) return true;
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

  // A target's answers as it reads them, by item: the system-wide layer
  // resolved by the scorer's own rules (Compare.scopeResponses), which is
  // what the pack showed the reviewer.
  function resolvedFor(targetId) {
    var all = once("resolved", function () { return {}; });
    if (!all[targetId]) {
      counts.resolved++;
      var map = all[targetId] = {};
      window.App.Compare.scopeResponses(E().state.engagement.responses, targetId).forEach(function (r) { map[r.requirementId] = r; });
    }
    return all[targetId];
  }

  // What a field reads for this target, and which response holds it: the
  // target's own, or the system-wide one it inherits from. Inheritance is
  // not field by field: evidence and notes come down only where the target
  // inherits one of the shared items, and the plan (owner, action, impact)
  // only as a whole, when the target has none of its own. So a blank field
  // beside the target's own owner is blank, whatever the shared layer says.
  function holderOf(targetId, itemId, field) {
    var e = E();
    var r = resolvedFor(targetId)[itemId];
    var value = r && r[field] != null ? r[field] : "";
    if (value === "") return { targetId: targetId, value: "" };
    var own = e.findResponse(targetId, itemId);
    var mine = !e.SHARED_TARGET_ID || !!(own && own[field] != null && own[field] !== "");
    return { targetId: mine ? targetId : e.SHARED_TARGET_ID, value: value };
  }
  // Every filled item field, normalised, for finding the one a paragraph or
  // cell of the report prints.
  function fieldIndex() {
    return once("fields", function () {
      counts.fields++;
      var out = [];
      (E().state.engagement.responses || []).forEach(function (r) {
        Object.keys(ITEM_FIELDS).forEach(function (fld) {
          var v = r[fld], n = v == null ? "" : norm(v);
          if (n.length >= MIN_FIELD_MATCH) out.push({ targetId: r.targetId, itemId: r.requirementId, field: fld, value: v, n: n });
        });
      });
      return out;
    });
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

  var NOT_EDITABLE = "The tool writes this text, so it cannot be changed here. Copy the wording and use Go to.";

  function headingHasTarget(text) {
    var R = window.App.Report, eng = E().state.engagement;
    var plain = DB().stripNumber(text);
    return R.sectionKey(plain, { engagement: eng }) !== DB().slugTitle(plain);
  }

  // How a comment's suggestion would be applied, given the current documents.
  // { can, why, label, kind, apply(), undo(), expect: [texts], mustPrint }
  function planAccept(t, docs) {
    var c = t.comment, a = c.anchor || {}, sug = c.suggestion;
    if (!sug) return { can: false };
    var e = E(), R = window.App.Report, eng = e.state.engagement;
    // One accepted change per comment: a second would write over the record
    // of what the first replaced, and its Undo with it.
    if (t.accepted && t.accepted.revert) return { can: false, why: "Wording from this comment is already in the report. Undo it first." };

    if (a.kind === "item") {
      var target = targetOf(a);
      if (!target) return { can: false, why: "The " + targetWord() + " this comment is on can no longer be found. Copy the wording instead." };
      if (!ITEM_FIELDS[a.field]) return { can: false, why: "This comment is not on a single field. Copy the wording and use Go to." };
      var holder = holderOf(target.id, a.itemId, a.field);
      if (norm(holder.value) !== norm(a.quote)) return { can: false, why: "The " + ITEM_FIELDS[a.field] + " has changed since the review. Copy the wording and compare." };
      return itemPlan(holder.targetId, a.itemId, a.field, holder.value, String(sug).trim(), docs);
    }
    if (a.kind !== "block") return { can: false, why: "This comment is not on a piece of the report's text." };
    if (!docs) return { can: false, why: "Still checking this against the current report." };
    if (!docContains(docs, a.quote)) return { can: false, why: "This wording no longer matches the report. Copy it and compare." };
    // Where the new wording has to be once the document is rebuilt: in the
    // section the comment is on, in its document, not just somewhere.
    var doc = docFor(a, docs) || {};
    var where = { title: doc.title, index: docs.indexOf(doc), sectionKey: a.sectionKey || "" };

    // A heading: the section's own title.
    var isHeading = !a.cell && docs.some(function (dd) {
      return dd.blocks.some(function (b) { return b.type === "heading" && !b.sub && b.sectionKey === a.sectionKey && norm(b.text) === norm(a.quote); });
    });
    if (isHeading) {
      if (!a.sectionKey) return { can: false, why: "This heading comes from the assessment. Rename it where it is entered." };
      if (headingHasTarget(a.quote)) return { can: false, why: "This heading is a target's name and cannot be renamed here." };
      var title = DB().stripNumber(sug), prevTitle = e.getReportSection(a.sectionKey).title || null;
      return { can: true, kind: "section title", label: "Accept", where: where,
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
      if (next != null) return narrativePlan(f, val, next, sug, where);
    }

    // The proposed next steps: their own store, and until someone edits them
    // what prints is scaffolded from the assessment.
    var nsKey = R.sectionKey("Proposed next steps", { engagement: eng });
    if (a.sectionKey === nsKey) {
      var linesPerDoc = docs.map(function (d) {
        return DB().flatten(d.blocks.filter(function (b) { return b.sectionKey === nsKey && b.type !== "heading"; })).map(function (b) { return b.text; });
      });
      if (linesPerDoc.some(function (l) { return JSON.stringify(l) !== JSON.stringify(linesPerDoc[0]); })) {
        return { can: false, why: "The next steps differ between the documents. Copy the wording and use Go to." };
      }
      var lines = linesPerDoc[0] || [], idx = -1;
      lines.forEach(function (l, k) { if (idx === -1 && norm(l) === norm(a.quote)) idx = k; });
      if (idx !== -1) {
        var repl = lines.slice(); repl[idx] = String(sug).trim();
        return narrativePlan("nextSteps", rn.nextSteps, repl.join("\n"), sug, where);
      }
    }

    // A plan or evidence field that prints in this paragraph or cell. The
    // same words are not enough to say so: a role in the People interviewed
    // table can be an item's owner, word for word. The block has to be about
    // that item (itemAt), which rules out every part of the report that
    // prints no item's fields.
    var tid = doc.targetId || null, nq = norm(a.quote);
    var matches = [];
    fieldIndex().forEach(function (x) {
      if (tid && x.targetId !== tid && x.targetId !== e.SHARED_TARGET_ID) return;
      if (nq.indexOf(x.n) === -1) return;
      var fitted = fitToField(x.value, a.quote, sug);
      if (fitted != null) matches.push({ targetId: x.targetId, itemId: x.itemId, field: x.field, value: x.value, next: fitted });
    });
    var about = matches.length ? itemAt(a, doc) : null;
    if (about && matches.length === 1 && matches[0].itemId === about.id) {
      var m = matches[0];
      var ip = itemPlan(m.targetId, m.itemId, m.field, m.value, m.next, docs);
      ip.mustPrint = true; ip.where = where;
      return ip;
    }
    if (about && matches.length > 1) return { can: false, why: "The same wording is on " + matches.length + " items. Copy it and change the ones it applies to." };

    // A red prompt is answered where it is entered, never reworded: as plain
    // words it would print in black, unanswered, and the Issue check would
    // stop counting it. That is the whole of a prompt paragraph, and a
    // paragraph that closes in one.
    if (!a.cell && redTexts(docs)[nq]) {
      return { can: false, why: "This is a prompt to complete in the tool. Use Go to and answer it there." };
    }

    // A paragraph of a section's opening.
    if (a.sectionKey && !a.cell) {
      var runs = [];
      docs.forEach(function (d) { (d.probe || []).forEach(function (s) { if (s.key === a.sectionKey) runs.push(s); }); });
      var holding = runs.filter(function (s) { return s.texts.some(function (x) { return norm(x) === nq; }); });
      if (holding.length) {
        var cur = e.getReportSection(a.sectionKey);
        // The author rewrote the whole opening on the report page (Edit):
        // the one line of that rewrite is changed, and it stays a rewrite.
        if (cur.prose) return prosePlan(a.sectionKey, cur.prose, nq, sug, where);
        return paragraphPlan(a.sectionKey, cur, holding, nq, sug, where);
      }
    }
    return { can: false, why: NOT_EDITABLE };
  }

  // One line of a whole-opening rewrite the author made.
  function prosePlan(key, prev, nq, sug, where) {
    var e = E(), hit = false;
    var lines = String(prev).split(/\n/).map(function (l) {
      if (norm(l) !== nq) return l;
      hit = true;
      return String(sug).trim();
    });
    if (!hit) return { can: false, why: NOT_EDITABLE };
    var prose = lines.join("\n");
    return { can: true, kind: "section opening", label: "Accept", where: where,
      apply: function () { e.setReportSection(key, { prose: prose }); },
      undo: function () { e.setReportSection(key, { prose: prev }); },
      revert: { what: "section", key: key, field: "prose", prev: prev }, applied: prose,
      expect: String(sug).split(/\n/).filter(function (l) { return norm(l); }), mustPrint: true };
  }

  // One generated paragraph of a section's opening: only it is replaced
  // (reportCustom[key].paragraphs, shared/report-sections.js), so the rest of
  // the opening stays generated and the consultant's input still prints. The
  // replacement is keyed by the paragraph's generated text and applies
  // wherever a paragraph of that section's opening reads the same, in any
  // document: the same words get the same rewording, and a paragraph only
  // one zone or document prints is changed only there. holding is the
  // openings that print the commented paragraph.
  function paragraphPlan(key, cur, holding, nq, sug, where) {
    var e = E(), RS = window.App.ReportSections;
    // The commented paragraph may itself be an earlier accepted rewording:
    // the generated text it stands for is then what the replacement is on.
    var gen = nq, was = null;
    holding.forEach(function (s) {
      s.texts.forEach(function (x, i) { if (was == null && norm(x) === nq && s.from && s.from[i] != null) was = s.from[i]; });
    });
    var entry = RS.paragraphFor(cur.paragraphs, was != null ? was : nq);
    var to = String(sug).trim();
    if (was != null && entry) {
      gen = norm(was);
      to = String(entry.to).split(/\n/).map(function (l) { return norm(l) === nq ? String(sug).trim() : l; }).join("\n");
    }
    if (norm(to) === norm(entry ? entry.to : gen)) return { can: false, why: "The suggested wording is what the report already says." };
    var before = RS.paragraphsOf(cur), at = new Date().toISOString();
    var places = 0;
    holding.forEach(function (s) { s.texts.forEach(function (x) { if (norm(x) === nq) places++; }); });
    return { can: true, kind: "paragraph", label: "Accept", where: where, places: places,
      apply: function () { e.setReportSection(key, { paragraphs: RS.setParagraph(before, gen, to, at) }); },
      undo: function () { e.setReportSection(key, { paragraphs: before }); },
      revert: { what: "paragraph", key: key, from: gen, prevTo: entry ? entry.to : null }, applied: to,
      expect: String(sug).split(/\n/).filter(function (l) { return norm(l); }), mustPrint: true };
  }

  // ---- paragraphs reworded by an accepted suggestion --------------------------
  //
  // Each stored replacement and whether it is in the report now, from the
  // last read of the documents: [{ key, title, from, to, at, state }], state
  // as ReportSections.paragraphStatus gives it, or "checking" until the
  // documents have been read. A replacement whose paragraph has changed does
  // not apply and the generated text prints, so the author is told: on the
  // report page, on the comment, and once in the Issue check.
  function hasParagraphs() {
    var RS = window.App.ReportSections, custom = E().getReportCustom();
    return Object.keys(custom).some(function (k) { return RS.paragraphsOf(custom[k]).length > 0; });
  }
  function paragraphChanges() {
    if (!E().state.instrument || !hasParagraphs()) return [];
    var RS = window.App.ReportSections, docs = cachedDocs();
    var rows = RS.paragraphStatus(E().getReportCustom(), docs ? docs.map(function (d) { return d.probe || []; }) : []);
    if (!docs) rows.forEach(function (r) { r.state = "checking"; });
    return rows;
  }
  function removeParagraph(key, from) {
    var RS = window.App.ReportSections, e = E();
    e.setReportSection(key, { paragraphs: RS.setParagraph(e.getReportSection(key).paragraphs, from, null) });
  }
  // What a comment says about the paragraph its Accept reworded, when that
  // wording is not in the report. Null when it is, or is not known yet.
  function acceptedNote(t) {
    var rv = t && t.accepted && t.accepted.revert;
    if (!rv || rv.what !== "paragraph") return null;
    var RS = window.App.ReportSections;
    if (!RS.paragraphFor(E().getReportSection(rv.key).paragraphs, rv.from)) return "The accepted wording has since been taken out on the report page.";
    var row = once("paragraphs", paragraphChanges).filter(function (r) { return r.key === rv.key && norm(r.from) === norm(rv.from); })[0];
    return row ? RS.paragraphNote(row.state) : null;
  }

  // The catalogue item the commented block is about, or null: named by code
  // in its table row or in the headings over it. Front matter, document
  // control and the basis of assessment registers print no item's fields.
  var NO_ITEM_FIELDS = /^document-control|^(basis-of-assessment|people-interviewed|documents-reviewed|systems-observed)$/;
  function itemAt(a, doc) {
    if (NO_ITEM_FIELDS.test(a.sectionKey || "")) return null;
    var loc = blockFor(a, doc);
    if (!loc || loc.block.front) return null;
    var blocks = doc.blocks, b = loc.block, list = catalog(), item = null, i;
    // A table row names its item in one of its cells.
    if (b.type === "table" && loc.cell && b.rows[loc.cell.row]) {
      var cells = b.rows[loc.cell.row].cells;
      for (i = 0; i < cells.length && !item; i++) item = itemNamed(cells[i].text, list);
      return item;
    }
    // Otherwise the block itself, or the nearest line or heading over it in
    // its section: "SR 1.1 Human user identification ..." then "Evidence: ...".
    item = itemNamed(DB().blockText(b), list);
    for (i = loc.index - 1; !item && i >= 0 && i > loc.index - ITEM_LOOK_BACK && blocks[i].sectionKey === b.sectionKey; i--) {
      if (blocks[i].type === "table" || blocks[i].type === "image") break;
      item = itemNamed(blocks[i].text, list);
      if (blocks[i].type === "heading" && !blocks[i].sub) break;
    }
    return item;
  }
  var ITEM_LOOK_BACK = 12;   // an item's own lines are few: further up is another item's
  // The item a line of the report names: it opens with the item's code (after
  // the priority a roadmap entry is headed with, "P3   SR 1.1 ..."), or with
  // its title, which is how a question with no printed code is named.
  function itemNamed(text, list) {
    var s = norm(text).replace(/^P\d+\s+/, "");
    if (!s) return null;
    var byCode = itemByCode(s, list);
    if (byCode) return byCode;
    var low = s.toLowerCase(), best = null, bestLen = 0;
    list.forEach(function (c) {
      var label = norm(c.label).toLowerCase(), code = norm(c.code || c.id).toLowerCase();
      if (label.length < MIN_FIELD_MATCH || label.length <= bestLen) return;
      if (low.indexOf(label) === 0 || low.indexOf(code + " " + label) === 0) { best = c; bestLen = label.length; }
    });
    return best;
  }

  function narrativePlan(field, prev, next, sug, where) {
    var e = E();
    var had = prev;
    return { can: true, kind: "narrative", label: "Accept", where: where,
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
      // A system-wide answer: the change is every inheriting target's.
      shared: !!e.SHARED_TARGET_ID && targetId === e.SHARED_TARGET_ID,
      apply: function () { var p = {}; p[field] = next; e.setResponse(targetId, itemId, p); },
      undo: function () { var p = {}; p[field] = prev; e.setResponse(targetId, itemId, p); },
      revert: { what: "item", targetId: targetId, itemId: itemId, field: field, prev: prev == null ? "" : prev }, applied: next,
      expect: [next], mustPrint: printed, fragment: true };
  }

  function docContainsFragment(docs, text) {
    var n = norm(text);
    return docs.some(function (d) { return DB().flatten(d.blocks).some(function (b) { return norm(b.text).indexOf(n) !== -1; }); });
  }
  // Is the text in the section a plan names (plan.where), in its document:
  // as a whole paragraph, heading or cell, or (fragment) inside one. The
  // document is found by its title, as its place can change.
  function sectionContains(docs, where, text, fragment) {
    var named = where.title ? docs.filter(function (d) { return d.title === where.title; }) : [];
    var doc = named.length === 1 ? named[0] : docs[where.index];
    if (!doc) return false;
    var n = norm(text);
    function hit(t) { var x = norm(t); return fragment ? x.indexOf(n) !== -1 : x === n; }
    var blocks = doc.blocks.filter(function (b) { return (b.sectionKey || "") === where.sectionKey; });
    return blocks.some(function (b) {
      if (b.type === "heading" && hit(DB().stripNumber(b.text))) return true;
      if (b.type === "table") return b.rows.some(function (r) { return r.cells.some(function (c) { return hit(c.text); }); });
      return hit(DB().blockText(b));
    }) || DB().flatten(blocks).some(function (b) { return hit(b.text); });
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
        // A comment on the report's text must find its new wording in the
        // section it is on, not just somewhere in the documents.
        var missing = err2 ? plan.expect : plan.expect.filter(function (x) {
          if (plan.where) return !sectionContains(after, plan.where, x, !!plan.fragment);
          return plan.fragment ? !docContainsFragment(after, x) : !docContains(after, x);
        });
        if (plan.mustPrint && missing.length) {
          plan.undo();
          currentDocs(function () {
            markPlanFailed(t);
            done({ ok: false, message: "That wording did not reach the Word document, so the change was undone. Copy it and use Go to." });
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
        done({ ok: true, message: "Accepted into the " + plan.kind + " and checked in the Word document." +
          (plan.mustPrint ? "" : " This field is not in the Word report.") +
          (plan.kind === "paragraph" ? " Only that paragraph is changed." : "") +
          (plan.places > 1 ? " Changed in all " + plan.places + " places it is printed." : "") +
          (plan.shared ? " It applies to every " + targetWord() + " that inherits this system-wide answer." : "") });
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
    if (!rv) { done({ ok: false, message: "There is nothing to put back. Change it where it is entered." }); return; }
    if (rv.what === "paragraph") { undoParagraph(t, done); return; }
    var e = E(), cur = revertTarget(rv);
    if (cur === undefined && rv.what === "item") { done({ ok: false, message: "That " + targetWord() + " is no longer in this assessment, so there is nothing to put back." }); return; }
    if (norm(cur) !== norm(acc.applied)) {
      done({ ok: false, message: "The wording has been edited since it was accepted, so it was not put back. Change it where it is entered." });
      return;
    }
    var p = {};
    try {
      if (rv.what === "section") { p[rv.field] = rv.prev == null ? null : rv.prev; e.setReportSection(rv.key, p); }
      else if (rv.what === "narrative") { p[rv.field] = rv.prev == null ? null : rv.prev; e.setReportNarrative(p); }
      else { p[rv.field] = rv.prev == null ? "" : rv.prev; e.setResponse(rv.targetId, rv.itemId, p); }
    } catch (x) { done({ ok: false, message: "The earlier wording could not be put back: " + (x.message || x) }); return; }
    reopenAfterUndo(t);
    done({ ok: true, message: "The earlier wording is back, and the comment is open again." });
  }
  function reopenAfterUndo(t) {
    delete t.accepted;
    delete failedPlans[t.comment.id];
    t.status = "open"; t.reason = ""; t.statusAt = new Date().toISOString();
    delete t.reopened;
    E().touchReview();
  }
  // Takes out the one paragraph replacement this comment's Accept made (or
  // puts back the wording it took over from an earlier one), whether or not
  // it applies at the moment. Any other replacement in the section is left
  // exactly as it is.
  function undoParagraph(t, done) {
    var acc = t.accepted, rv = acc.revert, e = E(), RS = window.App.ReportSections;
    var list = e.getReportSection(rv.key).paragraphs, entry = RS.paragraphFor(list, rv.from);
    var gone = !entry && !(rv.prevTo != null && norm(acc.applied) === norm(rv.from));
    if (entry && norm(entry.to) !== norm(acc.applied)) {
      done({ ok: false, message: "The wording has changed since it was accepted, so it was not put back. Use Back to the generated version on the report page." });
      return;
    }
    if (!gone) {
      try { e.setReportSection(rv.key, { paragraphs: RS.setParagraph(list, rv.from, rv.prevTo) }); }
      catch (x) { done({ ok: false, message: "The earlier wording could not be put back: " + (x.message || x) }); return; }
    }
    reopenAfterUndo(t);
    done({ ok: true, message: gone ? "The accepted wording had already been taken out. The comment is open again."
      : "The earlier wording is back, and the comment is open again." });
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
    var d = docFor(a, docs);
    if (d && d.targetId) U.setTargetThen(d.targetId, function () {});
    var have = {};
    U.sectionKeys().forEach(function (k) { have[k] = true; });
    if (have[a.sectionKey] && U.goToSection(a.sectionKey, a, true)) return "card:" + a.sectionKey;

    // A finding: the text, its table row, or the smaller heading above it
    // opens with an item's code. The block is found by its wording in its
    // section (blockFor), as its id moves with every edit above it.
    var blocks = (d && d.blocks) || [];
    var loc = blockFor(a, d), at = loc ? loc.index : -1;
    var list = catalog();
    var texts = [a.quote].concat(contextTexts(a, d, loc));
    for (var k = 0; k < texts.length; k++) {
      var item = itemByCode(texts[k], list);
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
    U.toast((a.sectionTitle ? "\"" + a.sectionTitle + "\" is" : "That part is") + " only in the Word report.", "warn");
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
    var out = RC().warnings(store() || RC().emptyStore(), currentHashes(), { qaReviewBy: m.qaReviewBy || "" });
    // An accepted rewording whose paragraph has changed since: the generated
    // text prints, and the author may believe the reviewer's wording is in.
    // One line, however many. Not for a section the author has since hidden
    // or rewritten as a whole: that was their own choice.
    var lost = paragraphChanges().filter(function (r) { return r.state === "changed"; }).length;
    if (lost) {
      out.push({ kind: "reworded-not-applied", text: (lost === 1 ? "1 accepted rewording is" : lost + " accepted rewordings are") +
        " not in the Word report: the text " + (lost === 1 ? "it" : "they") + " replaced has changed." });
    }
    return out;
  }
  // For App.UI's issue check: the same shape as its own warning lines.
  function issueWarnings() {
    if (!E().state.instrument) return [];
    var goCard = function () { UI().revealOnReport('[data-check-anchor="review"]'); };
    // The line on reworded paragraphs goes to their list, not the Review card.
    var goList = function () { UI().revealOnReport('[data-check-anchor="reworded"]'); };
    return warningList().map(function (w) {
      var lost = w.kind === "reworded-not-applied";
      return { cls: "warn review-warn", kind: w.kind, text: w.text, label: lost ? "Show" : "Review", go: lost ? goList : goCard };
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
  // Another assessment in this project that holds the pack, or (reviewId
  // given) the review it belongs to: the one to switch to. Two assessments of
  // one instrument for one client both pass packMatches, so this is what
  // keeps a pack and its review files off the wrong one.
  function packHint(packId, reviewId) {
    var e = E(), all = e.state.assessments || {}, hit = null;
    Object.keys(all).forEach(function (id) {
      if (hit || id === e.state.activeAssessmentId) return;
      var rv = all[id] && all[id].review;
      if (!rv || !Array.isArray(rv.rounds) || !rv.rounds.length) return;
      if (rv.rounds.some(function (r) { return r.packId === packId; }) || (reviewId && rv.reviewId === reviewId)) hit = id;
    });
    if (!hit) return null;
    var row = (e.listAssessments ? e.listAssessments() : []).filter(function (x) { return x.id === hit; })[0];
    return "This file is for the " + ((row && (row.label || row.instrumentTitle)) || "other") + " assessment: switch to it, then import the file.";
  }

  // ---- QA review by ------------------------------------------------------------
  //
  // An approval can fill QA review by, and the consultant says so: offered once
  // per file, and an existing different value is never replaced without asking.
  var qaOffers = [];   // { reviewer, fileId }

  function afterImport(results) {
    results.forEach(function (r) {
      if (!RC().isApproval(r.verdict)) return;
      // The same name in other capitals is the same reviewer.
      var who = norm(r.reviewer).toLowerCase();
      if (norm((E().state.engagement.engagement || {}).qaReviewBy).toLowerCase() === who) return;
      if (!qaOffers.some(function (o) { return norm(o.reviewer).toLowerCase() === who; })) qaOffers.push({ reviewer: r.reviewer });
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
      beginPaint: beginPaint,
      endPaint: endPaint,
      acceptPlan: function (t) {
        if (failedPlans[t.comment.id]) return { can: false, why: "That wording did not reach the Word document. Copy it and use Go to." };
        return acceptPlan(t);
      },
      accept: accept,
      undoAccept: undoAccept,
      acceptedNote: acceptedNote,
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
    body.appendChild(h("p", { class: "issue-lead", text: "Send a review pack to each reviewer, then import the review files they send back." }));
    var holder = h("div", { class: "rv-panel" });
    liveHolder = holder;   // Accept can redraw the page while it is checking
    body.appendChild(holder);
    paint(holder);
    // Comments are checked against the current report once it has been read.
    if ((store() || hasParagraphs()) && !cachedDocs()) {
      currentDocs(function () { if (holder.isConnected) paint(holder); U.repaintIssueCheck(); U.repaintReworded(); });
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
    paragraphChanges: paragraphChanges,
    removeParagraph: removeParagraph,
    acceptedNote: acceptedNote,
    qaOffers: function () { return qaOffers.slice(); },
    // For the tests: the card's adapter, and how often a drawing really
    // worked out the signature, the document texts and the answers.
    __adapter: adapter,
    __counts: counts
  };
})();
