/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* review.js
 *
 * The risk tool's side of a report review: Send for review writes both Word
 * reports (detailed and high level) as a pack (contract spt-review-pack), and
 * Import review files merges what reviewers send back (spt-review) into the
 * project. See docs/report-review.md. The comments list is the shared one
 * (js/review-author.js); this file only says how the risk tool builds its
 * documents and where a comment takes the author.
 *
 * A suggestion on a section's heading or the wording that opens it can be
 * accepted into that report's section overrides (js/report-page.js): the Word
 * document is rebuilt to check the words are really there, and it is undone if
 * they are not, and the comment can undo it later. Anything else is Copy plus
 * Go to. The store is project.review: absent until a review starts, so older
 * files still load, and neither export reads it.
 *
 * Once a review has started, its warnings (not reviewed, changes requested,
 * must-fix open, changed since approval) show on the Peer review, Report and
 * Review & export pages and in the question before each Word or Excel
 * download. They only warn. An approval offers to fill in QA review by.
 */
window.RiskReview = (function () {
  "use strict";

  function RT() { return window.RiskTool; }
  function RX() { return window.RiskExports; }
  function RC() { return window.App.ReviewCore; }
  function DB() { return window.App.DocxBlocks; }
  function RP() { return window.RiskReportPage; }
  function norm(s) { return RC().norm(s); }
  function project() { return RT().state.project; }
  // Every read of the store goes through here, so a comment made on a section
  // whose heading has since been reworded (in the saved project, or in a review
  // file imported later) finds that section under its new key.
  function aliasKeys(s) {
    var alias = RT().sectionKeyAlias;
    s.threads.forEach(function (t) {
      var a = t && t.comment && t.comment.anchor, r = t && t.accepted && t.accepted.revert;
      if (a && a.sectionKey) a.sectionKey = alias(a.sectionKey);
      if (r && r.key) r.key = alias(r.key);
    });
    return s;
  }
  function store() { var s = project().review; return s ? aliasKeys(RC().normaliseStore(s)) : null; }
  function ensureStore() {
    var s = store();
    if (!s) { s = RC().emptyStore(); project().review = s; RT().touched(); }
    return s;
  }

  // ---- the documents --------------------------------------------------------
  // reportId is which report's overrides a comment's Accept writes to, and
  // which tab Go to opens. With no zones or conduits there is nothing behind
  // the detailed report, so only the high-level report (the zone-free
  // deliverable) is packed: a document's place in the pack is therefore not
  // which report it is, and docFor() finds it by title.
  var HIGH_LEVEL_TITLE = "High-level report";
  var DOCS = [
    { id: "detailed", title: "Detailed report", opts: {} },
    { id: "highLevel", title: HIGH_LEVEL_TITLE, opts: { highLevelOnly: true } }
  ];
  function docsToPack() {
    var p = project();
    return (p.zones.length || p.conduits.length) ? DOCS : DOCS.filter(function (d) { return d.id === "highLevel"; });
  }
  // The document a comment is on: by its title where the anchor has one (a
  // round packed before zones existed had the high-level report first), else
  // by its place.
  function docFor(a, docs) {
    if (!docs) return null;
    var byTitle = a.documentTitle ? docs.filter(function (d) { return d.title === a.documentTitle; })[0] : null;
    return byTitle || docs[Number(a.documentIndex) || 0] || null;
  }
  function reportIdFor(a, docs) {
    var d = docFor(a, docs);
    if (d && d.reportId) return d.reportId;
    if (a.documentTitle) return a.documentTitle === HIGH_LEVEL_TITLE ? "highLevel" : "detailed";
    return a.documentIndex === 1 ? "highLevel" : "detailed";
  }

  // The content hash leaves out the asset owner's sign-off, as document control
  // leaves out QA review by: signing off after the review approved it is the
  // normal order, not a change to what was reviewed. Out: the Sign-off section,
  // the document control row, the sentence the executive summary prints, and
  // the approvers' signature table wherever it is (phase 3b), so recording an
  // approver or an approval does not read as a change either.
  function hashBlocks(blocks) {
    var skip = {}, sigHead = norm((RX().SIGNATURE_HEAD || [])[0] || "").toLowerCase();
    RX().signOffTexts(project()).forEach(function (s) { skip[norm(s)] = 1; });
    function sigTable(b) {
      var r0 = b.type === "table" && b.rows && b.rows[0];
      return !!(sigHead && r0 && r0.cells && r0.cells[0] && norm(r0.cells[0].text).toLowerCase() === sigHead);
    }
    function para(b) { return (b.type !== "table" && b.type !== "image" && skip[norm(b.text)]) || sigTable(b); }
    function clean(b) {
      if (b.type !== "table") return b;
      return Object.assign({}, b, { rows: b.rows.filter(function (r) {
        return !(r.cells.length === 2 && norm(r.cells[0].text).toLowerCase() === "asset-owner sign-off");
      }) });
    }
    return (blocks || []).filter(function (b) { return b.sectionKey !== "sign-off" && !para(b); }).map(clean);
  }
  function hashOf(blocks) { return DB().contentHash(hashBlocks(blocks)); }

  function buildDocuments(progress) {
    var out = [], chain = Promise.resolve(), list = docsToPack();
    list.forEach(function (d, i) {
      var probe = [];
      chain = chain.then(function () {
        if (progress) progress("Building the Word report " + (i + 1) + " of " + list.length + "…");
        return window.docx.Packer.toBlob(RX().buildWordDoc(project(), Object.assign({}, d.opts, { sectionProbe: probe })));
      }).then(function (blob) {
        // A section's key slugs its GENERATED heading, and a Word file only has
        // the printed one. The build's probe says which section each heading is,
        // renamed or not, and which are only a zone's name.
        return DB().fromBlob(blob, { idPrefix: "d" + i + "-b", headings: probe });
      }).then(function (res) {
        out.push({ title: d.title, reportId: d.id, targetName: "", blocks: res.blocks, media: res.media, contentHash: hashOf(res.blocks), probe: probe });
      });
    });
    return chain.then(function () { return out; });
  }

  // ---- the engagement behind them ----------------------------------------------
  function ownerName(o) { return o.name || o.id; }
  // What the review tool calls each item field in a risk pack (contract
  // spt-review-pack, engagement.fieldLabels). null: a threat has no such field,
  // so the row is not shown, nor offered for suggested wording. Likelihood,
  // impact, affected FRs, the current and planned ratings, the plan behind a
  // decision, who accepted a risk, and an SL-T's justification and suggestion
  // are read-only rows (items[].details).
  var FIELD_LABELS = { answer: "Risk", expected: "Tolerable risk", evidence: "Threat source", notes: "Risk acceptance",
    action: "Countermeasures addressing this threat", impact: null, priority: "Treatment decision", owner: null };
  function cap(s) { s = String(s || ""); return s.charAt(0).toUpperCase() + s.slice(1); }
  function bandName(id) { return id ? RX().bandName(id) : ""; }
  function rating(l, i) { return (l ? cap(l) : "Not rated") + " × " + (i ? cap(i) : "Not rated"); }
  // A planned countermeasure's plan in words: "M3: owner J. Whitmore, high
  // priority, due 2027-03-31, agreed"; what is not given says so.
  function planWords(m) {
    var R = RT(), st = (R.CM_STATUS_LABEL || {})[m.status], pr = (R.CM_PRIORITY_LABEL || {})[m.priority];
    return m.id + ": " + [norm(m.owner) ? "owner " + norm(m.owner) : "no owner", pr ? pr.toLowerCase() + " priority" : "no priority",
      norm(m.dueDate) ? "due " + norm(m.dueDate) : "no due date", st ? st.toLowerCase() : "no status"].join(", ");
  }
  function slVector(v) {
    var ids = RT().FR_IDS.filter(function (fr) { return v && v[fr] != null; });
    return ids.map(function (fr) { return fr + " SL" + v[fr]; }).join(", ");
  }
  function packItems() {
    var p = project(), R = RT(), items = [], facts = [];
    // The tool's one view model (js/view-model.js): each threat's risk,
    // residual and treatment state, as the reports print them.
    var vm = R.viewModel(p);
    var tolerable = vm.tolerable;
    function addOwner(row, groupName, isZone) {
      var o = row.o;
      var fact = { targetName: ownerName(o), targetId: o.id, roadmapEntries: 0, findings: 0, met: 0, recorded: 0, toAssess: 0, unanswered: 0, na: 0, groups: [] };
      var field = { finding: "findings", met: "met", recorded: "recorded", "to-assess": "toAssess", unanswered: "unanswered", na: "na" };
      row.threats.forEach(function (x) {
        // The residual, as the risk context exports it (the view model's
        // residualRisk): the planned rating, else the current one.
        var t = x.t, band = x.risk, resid = x.residualRisk;
        var over = x.operativeExceeds;
        // The tool's one treatment state (RiskTool.threatTreatment). A threat
        // above tolerable risk with no confirmed decision, or with one that
        // lacks what it rests on (a countermeasure, a reason), is a finding
        // whatever its residual rating, so the review tool raises it.
        var T = x.treatment;
        var status = !band ? "unanswered" : (over || (T.required && !T.complete) ? "finding" : "met");
        // Only the countermeasures linked to this threat (the one coverage rule).
        var affected = t.affectedFR || [];
        var linked = T.covering;
        var details = [["Likelihood × impact", rating(t.likelihood, t.impact)], ["Affected FRs", affected.length ? affected.join(", ") : "None marked"]];
        // Schema 0.3: the rating with the countermeasures in place today, and
        // after the planned ones; a rating not given takes the one before it.
        if (x.current) details.push(["Current likelihood × impact", rating(t.currentLikelihood || t.likelihood, t.currentImpact || t.impact)]);
        if (x.planned) details.push(["Planned likelihood × impact", rating(t.residualLikelihood || t.currentLikelihood || t.likelihood, t.residualImpact || t.currentImpact || t.impact)]);
        if (T.confirmed && T.decision === "slt" && T.reason) details.push(["Reason for treating through the SL-T", T.reason]);
        // The plan behind a confirmed decision that rests on countermeasures
        // still to come: each one's owner, priority, due date and status.
        if (T.confirmed && T.plannedLinked.length) details.push(["Treatment plan", T.plannedLinked.map(planWords).join("; ")]);
        // Who accepted a risk, and when it is to be reviewed.
        if (T.complete && T.decision === "accept") {
          var ad = t.acceptanceDetail || {}, by = norm(ad.by);
          details.push(["Accepted by", (by || "Not recorded") + (norm(ad.role) ? " (" + norm(ad.role) + ")" : "") + (norm(ad.date) ? ", " + norm(ad.date) : "") + (norm(ad.reviewDate) ? ", review by " + norm(ad.reviewDate) : "")]);
        }
        // A decision recorded without what it rests on: the reviewer sees what
        // was chosen and what is missing, and the decision field stays empty.
        if (T.confirmed && !T.complete) details.push(["Decision still to complete", T.label]);
        items.push({
          targetName: ownerName(o), targetId: o.id, itemId: o.id + ":" + t.id, code: t.id, title: t.statement || "(no statement)", groupName: groupName,
          answer: band ? bandName(band) + (resid ? ", " + bandName(resid).toLowerCase() + " after countermeasures" : "") : "Not rated",
          expected: bandName(tolerable),
          // The acceptance text is not printed against another decision.
          evidence: t.source || "", notes: (T.confirmed && T.decision !== "accept") ? "" : (t.acceptance || ""),
          owner: "", action: linked.map(function (m) { return m.id + " " + m.description + (m.existing ? " [existing]" : " [planned]"); }).join("; "), impact: "",
          // Empty until the consultant has confirmed a decision and it is
          // complete: the review tool's risk-no-disposition check reads it so.
          // A suggestion that is not confirmed is no decision.
          priority: T.complete ? T.label : "",
          details: details, status: status, shared: false
        });
        fact[field[status]]++;
      });
      var slt = o.slTargetByFR || {}, set = slVector(slt), sug = null;
      try { sug = isZone ? R.suggestZone(o, p) : R.suggestConduit(o, p); } catch (e) { sug = null; }
      var sugVec = {};
      if (sug && sug.byFR) R.FR_IDS.forEach(function (fr) { sugVec[fr] = sug.byFR[fr] ? sug.byFR[fr].sl : null; });
      items.push({
        targetName: ownerName(o), targetId: o.id, itemId: o.id + ":slt", code: "SL-T", title: "Target security levels", groupName: groupName,
        answer: set || "Not set",
        expected: "", evidence: "", notes: "", owner: "", action: "", impact: "", priority: "",
        // No Justification row when there is none: the review tool's
        // risk-slt-justification check reads a filled one as written.
        details: [["Suggested SL-T", slVector(sugVec) || "None"]].concat((o.justification || "").trim() ? [["Justification", o.justification.trim()]] : []),
        status: set ? "recorded" : "unanswered", shared: false
      });
      fact[set ? "recorded" : "unanswered"]++;
      facts.push(fact);
    }
    vm.zones.forEach(function (row) { addOwner(row, "Zone", true); });
    vm.conduits.forEach(function (row) { addOwner(row, "Conduit", false); });
    return { items: items, perTarget: facts };
  }

  // opts (optional): { note, neededBy }, what the author typed for the
  // reviewers on Send for review. In the pack only when filled in; the review
  // tool shows it to the reviewers, and it never reaches Word or Excel.
  function buildPack(progress, opts) {
    var s = ensureStore(), p = project(), V = window.App.Version || {};
    return buildDocuments(progress).then(function (docs) {
      if (progress) progress("Writing the review pack…");
      var nr = RC().nextRound(s, docs), extract = packItems(), b = p.basisOfAssessment || {};
      var pack = {
        schema: RC().packSchema(), packId: nr.packId, reviewId: s.reviewId, round: nr.round, createdAt: new Date().toISOString(),
        sourceTool: { product: V.product || "OT Cyber Risk Assessment Tool", version: V.number || "" },
        engagement: {
          client: p.engagement.client || "", site: p.suc.name || "", consultant: p.engagement.consultant || "",
          instrumentId: "risk-assessment", instrumentTitle: "IEC 62443-3-2 risk assessment", scoringFamily: "risk-assessment", targetLabel: "Zone or conduit",
          fieldLabels: Object.assign({}, FIELD_LABELS),
          documentControl: { documentRevision: p.engagement.revision || "", confidentiality: p.engagement.confidentiality || "", qaReviewBy: p.engagement.qaReviewBy || "" }
        },
        documents: docs.map(function (d) { return { title: d.title, targetName: d.targetName, contentHash: d.contentHash, media: d.media, blocks: d.blocks }; }),
        items: extract.items,
        basisOfAssessment: { interviews: b.interviews || [], documents: b.documents || [], observations: b.observations || [] },
        facts: { perTarget: extract.perTarget },
        previousRound: RC().previousRound(s)
      };
      var note = String((opts && opts.note) || "").trim(), due = norm(opts && opts.neededBy);
      if (note || due) {
        pack.request = {};
        if (note) pack.request.note = note;
        if (due) pack.request.neededBy = due;
      }
      return { pack: pack, docs: docs, store: s };
    });
  }

  function send(progress, done, opts) {
    buildPack(progress, opts).then(function (r) {
      var name = RC().fileSlug(project().engagement.client || project().suc.name || "risk-assessment") + "-review-pack-round-" + r.pack.round + ".json";
      RC().saveNewFile(JSON.stringify(r.pack), name, "Review pack", function (res) {
        if (!res.ok) { done({ ok: false, message: res.aborted ? null : "The pack was not saved" + (res.error ? ": " + res.error : ".") }); return; }
        RC().recordRound(r.store, r.pack);
        RT().touched();
        snap.signature = signature(); snap.docs = r.docs;
        done({ ok: true, message: "Round " + r.pack.round + " pack saved as " + res.name + ". It holds client data, so share it as you would the project file.", pack: r.pack, name: res.name });
      });
    }).catch(function (e) {
      console.error(e);
      done({ ok: false, message: "The pack could not be built: " + ((e && e.message) || e) });
    });
  }

  // ---- comments against the current reports --------------------------------------
  var snap = { signature: null, docs: null, building: null, waiting: [] };
  // One drawing of the comments list asks, for every card, whether the comment
  // is stale and whether its wording can be accepted. The signature and the
  // list of items are the same for every card, so between review-author's
  // beginPaint and endPaint they are worked out once. Outside a drawing
  // nothing is kept: the project may change between any two calls.
  var paintMemo = null, paintDepth = 0;
  // How often each was really worked out, for the test that a drawing does
  // not go back to once per card.
  var counts = { signature: 0, items: 0, texts: 0 };
  function beginPaint() { if (!paintDepth++) paintMemo = {}; }
  function endPaint() { if (paintDepth && !--paintDepth) paintMemo = null; }
  function once(key, make) {
    if (!paintMemo) return make();
    if (!(key in paintMemo)) paintMemo[key] = make();
    return paintMemo[key];
  }
  function signature() {
    return once("signature", function () {
      counts.signature++;
      var c = Object.assign({}, project()); delete c.review; delete c.savedOn; delete c.lastStage; return JSON.stringify(c);
    });
  }
  // The ids of the items a pack would hold now.
  function itemIds() {
    return once("itemIds", function () {
      counts.items++;
      var ids = {};
      packItems().items.forEach(function (i) { ids[i.itemId] = true; });
      return ids;
    });
  }
  // Every piece of text in one document, normalised. Kept with the document:
  // it does not change once read.
  var textsOf = typeof WeakMap === "function" ? new WeakMap() : null;
  function docTexts(doc) {
    var set = textsOf && textsOf.get(doc);
    if (set) return set;
    counts.texts++;
    set = {};
    function add(t) { var n = norm(t); if (n) set[n] = true; }
    doc.blocks.forEach(function (b) {
      add(DB().blockText(b));
      if (b.type === "table") b.rows.forEach(function (r) { r.cells.forEach(function (c) { add(c.text); }); });
    });
    DB().flatten(doc.blocks).forEach(function (b) { add(b.text); });
    if (textsOf) textsOf.set(doc, set);
    return set;
  }
  function cachedDocs() { return snap.docs && snap.signature === signature() ? snap.docs : null; }
  // The reports as they are now, built if they have changed.
  function currentDocs(cb) {
    var sig = signature();
    if (snap.docs && snap.signature === sig) { cb(null, snap.docs); return; }
    snap.waiting.push(cb);
    if (snap.building === sig) return;
    snap.building = sig;
    buildDocuments().then(function (docs) {
      if (snap.building !== sig) return;     // something newer has started
      snap.building = null; snap.signature = sig; snap.docs = docs;
      var w = snap.waiting; snap.waiting = [];
      w.forEach(function (f) { f(null, docs); });
    }, function (e) {
      if (snap.building !== sig) return;
      snap.building = null;
      var w = snap.waiting; snap.waiting = [];
      w.forEach(function (f) { f(e); });
    });
  }
  function refreshDocs(cb) { currentDocs(function () { if (cb) cb(); }); }
  function isStale(t) {
    var a = t.comment.anchor || {};
    if (a.kind === "general") return false;
    // The item id holds the zone or conduit's own id, so renaming a zone (as a
    // reviewer may well ask) does not orphan the comments on its threats.
    if (a.kind === "item") return !itemIds()[a.itemId];
    var docs = cachedDocs();
    if (!docs) return null;
    var q = norm(a.quote);
    if (!q) return false;     // a chart or picture: nothing to compare
    return !docs.some(function (d) { return !!docTexts(d)[q]; });
  }

  // ---- accepting a suggestion -------------------------------------------------------
  //
  // Which text accepts what: a section's heading goes into its title, and a
  // paragraph of the wording that opens a section is replaced on its own (the
  // section's `paragraphs`), in the report the comment is on (its
  // documentIndex). Everything else is written from the zones and threats, or
  // is the numbers.
  var NOT_EDITABLE = "This text is written from the zones and threats, so it cannot be changed here. Copy the wording, then use Go to.";
  function docHas(doc, text) { var q = norm(text); return !!doc && (!q || !!docTexts(doc)[q]); }
  // How a comment's suggestion would be applied, given the current documents.
  // { can, why, label, kind, apply(), undo(), expect: [texts], documentIndex }
  function planAccept(t, docs) {
    var c = t.comment, a = c.anchor || {}, sug = c.suggestion;
    if (!sug) return { can: false };
    // One accepted change per comment: a second would write over the record
    // of what the first replaced, and its Undo with it.
    if (t.accepted && t.accepted.revert) return { can: false, why: "Wording from this comment is already in the report. Undo the accepted wording first, then accept the new suggestion." };
    if (a.kind !== "block") return { can: false, why: "This comment is on the zones and threats behind the reports, not on their wording, so copy the wording and use Go to." };
    if (!docs) return { can: false, why: "Still checking this against the current report." };
    var doc = docFor(a, docs), i = docs.indexOf(doc);
    var docId = reportIdFor(a, docs);
    if (!docHas(doc, a.quote)) return { can: false, why: "The report has changed, so this wording no longer matches what is there. Copy it and compare." };
    var probe = doc.probe || [];

    // A heading: the section's own title.
    var isHeading = !a.cell && doc.blocks.some(function (b) { return b.type === "heading" && !b.sub && norm(b.text) === norm(a.quote); });
    if (isHeading) {
      if (!a.sectionKey) return { can: false, why: "This heading is a name from the assessment, not a section title. Rename it where it is entered." };
      if (probe.some(function (s) { return s.key === a.sectionKey && s.repeat; })) {
        return { can: false, why: "This heading is built from a zone's name, so it cannot be changed for one zone. Use Edit on the Report page to change the words around the name." };
      }
      var title = DB().stripNumber(sug), prevTitle = RP().sectionOf(docId, a.sectionKey).title || null;
      return { can: true, kind: "section title", label: "Accept", documentIndex: i,
        apply: function () { RP().setSection(docId, a.sectionKey, { title: title }); },
        undo: function () { RP().setSection(docId, a.sectionKey, { title: prevTitle }); },
        revert: { report: docId, key: a.sectionKey, field: "title", prev: prevTitle }, applied: title,
        expect: [title] };
    }

    // A paragraph of the wording that opens a section.
    var nq = norm(a.quote);
    var runs = probe.filter(function (s) { return s.key && s.key === a.sectionKey && s.texts.some(function (x) { return norm(x) === nq; }); });
    if (!a.cell && runs.length) {
      // The red note to the consultant is taken out, not reworded: as plain
      // words it would print in black as if it were the report's own.
      if (doc.blocks.some(function (b) { return b.red && b.type === "paragraph" && b.sectionKey === a.sectionKey && norm(b.text) === nq; })) {
        return { can: false, why: "This is a note to complete in the tool, printed in red until it is dealt with, so it cannot be reworded here. Use Edit on the Report page." };
      }
      var cur = RP().sectionOf(docId, a.sectionKey);
      // The author rewrote the whole opening on the Report page (Edit): the
      // one line of that rewrite is changed, and it stays a rewrite. Not a
      // section repeated per zone, where a rewrite never applies.
      if (cur.prose && !runs[0].repeat) return prosePlan(docId, a.sectionKey, cur.prose, nq, sug, i);
      return paragraphPlan(docId, a.sectionKey, cur, runs, nq, sug, i);
    }
    return { can: false, why: NOT_EDITABLE };
  }

  // One line of a whole-opening rewrite the author made.
  function prosePlan(docId, key, prev, nq, sug, i) {
    var hit = false;
    var lines = String(prev).split(/\n/).map(function (l) {
      if (norm(l) !== nq) return l;
      hit = true;
      return String(sug).trim();
    });
    if (!hit) return { can: false, why: NOT_EDITABLE };
    var prose = lines.join("\n");
    return { can: true, kind: "section opening", label: "Accept", documentIndex: i,
      apply: function () { RP().setSection(docId, key, { prose: prose }); },
      undo: function () { RP().setSection(docId, key, { prose: prev }); },
      revert: { report: docId, key: key, field: "prose", prev: prev }, applied: prose,
      expect: String(sug).split(/\n/).filter(function (l) { return norm(l); }) };
  }

  // One generated paragraph of a section's opening: only it is replaced (the
  // section's `paragraphs`, shared/report-sections.js), so the rest of the
  // opening is still written from the assessment. The replacement is keyed by
  // the paragraph's generated text and applies wherever a paragraph of that
  // section's opening reads the same. In a section repeated per zone
  // ("Justification for ...") that is the one zone whose wording it is, or
  // every zone that says exactly the same. runs is the openings that print it.
  function paragraphPlan(docId, key, cur, runs, nq, sug, i) {
    var RS = window.App.ReportSections;
    // The commented paragraph may itself be an earlier accepted rewording:
    // the generated text it stands for is then what the replacement is on.
    var gen = nq, was = null;
    runs.forEach(function (s) {
      s.texts.forEach(function (x, k) { if (was == null && norm(x) === nq && s.from && s.from[k] != null) was = s.from[k]; });
    });
    var entry = RS.paragraphFor(cur.paragraphs, was != null ? was : nq);
    var to = String(sug).trim();
    if (was != null && entry) {
      gen = norm(was);
      to = String(entry.to).split(/\n/).map(function (l) { return norm(l) === nq ? String(sug).trim() : l; }).join("\n");
    }
    if (norm(to) === norm(entry ? entry.to : gen)) return { can: false, why: "The suggested wording is what the report already says." };
    var before = RS.paragraphsOf(cur), at = new Date().toISOString(), places = 0;
    runs.forEach(function (s) { s.texts.forEach(function (x) { if (norm(x) === nq) places++; }); });
    return { can: true, kind: "paragraph", label: "Accept", documentIndex: i, sectionKey: key, places: places,
      apply: function () { RP().setSection(docId, key, { paragraphs: RS.setParagraph(before, gen, to, at) }); },
      undo: function () { RP().setSection(docId, key, { paragraphs: before }); },
      revert: { report: docId, key: key, field: "paragraph", from: gen, prevTo: entry ? entry.to : null }, applied: to,
      expect: String(sug).split(/\n/).filter(function (l) { return norm(l); }) };
  }
  // Is the text a paragraph of that section's opening, in this document.
  function openingHas(doc, key, text) {
    var q = norm(text);
    return !!doc && (doc.probe || []).some(function (s) { return s.key === key && s.texts.some(function (x) { return norm(x) === q; }); });
  }

  // ---- paragraphs reworded by an accepted suggestion --------------------------
  //
  // Each stored replacement, in either report, and whether it is in that
  // report now: [{ report, key, title, from, to, at, state }], state as
  // ReportSections.paragraphStatus gives it, or "checking" until the reports
  // have been read. One whose paragraph has changed does not apply and the
  // generated text prints, so the author is told: on the Report page, on the
  // comment, and in the review's warnings.
  function customOf(reportId) { var all = project().reportCustom; return (all && all[reportId]) || {}; }
  function hasParagraphs() {
    var RS = window.App.ReportSections;
    return DOCS.some(function (d) {
      var c = customOf(d.id);
      return Object.keys(c).some(function (k) { return RS.paragraphsOf(c[k]).length > 0; });
    });
  }
  function paragraphChanges() {
    if (!hasParagraphs()) return [];
    var RS = window.App.ReportSections, docs = cachedDocs(), out = [];
    DOCS.forEach(function (d) {
      var doc = docs ? docs.filter(function (x) { return x.reportId === d.id; })[0] : null;
      RS.paragraphStatus(customOf(d.id), doc ? [doc.probe || []] : []).forEach(function (r) {
        r.report = d.id; r.reportTitle = d.title;
        if (!docs) r.state = "checking";
        out.push(r);
      });
    });
    return out;
  }
  // What a comment says about the paragraph its Accept reworded, when that
  // wording is not in the report. Null when it is, or is not known yet.
  function acceptedNote(t) {
    var rv = t && t.accepted && t.accepted.revert;
    if (!rv || rv.field !== "paragraph") return null;
    var RS = window.App.ReportSections;
    if (!RS.paragraphFor(RP().sectionOf(rv.report, rv.key).paragraphs, rv.from)) return "The accepted wording has since been taken out on the Report page.";
    var row = once("paragraphs", paragraphChanges).filter(function (r) { return r.report === rv.report && r.key === rv.key && norm(r.from) === norm(rv.from); })[0];
    return row ? RS.paragraphNote(row.state) : null;
  }
  // Remembered for this session, so the failed Accept is not offered again.
  var failedPlans = {};
  function acceptPlan(t) {
    if (!t) return { can: false };
    if (failedPlans[t.comment.id]) return { can: false, why: "That wording did not reach the Word document when it was rebuilt, so copy it and use Go to." };
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
        // A reworded paragraph has to be in the opening of its own section,
        // not just somewhere in the report.
        var missing = err2 ? plan.expect : plan.expect.filter(function (x) {
          return plan.kind === "paragraph" ? !openingHas(after[plan.documentIndex], plan.sectionKey, x) : !docHas(after[plan.documentIndex], x);
        });
        if (missing.length) {
          plan.undo();
          currentDocs(function () {
            failedPlans[t.comment.id] = true;
            done({ ok: false, message: "That wording did not reach the Word document when it was rebuilt, so the change was undone. Copy the wording and use Go to." });
          });
          return;
        }
        // What it replaced, so the comment can undo it (Reopen only changes the status).
        t.accepted = { at: new Date().toISOString(), kind: plan.kind, revert: plan.revert, applied: plan.applied };
        t.status = "resolved"; t.statusAt = t.accepted.at;
        RT().touched();
        done({ ok: true, message: "Accepted into the " + plan.kind + ", and checked in the rebuilt Word document." +
          (plan.kind === "paragraph" ? " Only that paragraph is changed: the rest of the section's opening is still written from the assessment." : "") +
          (plan.places > 1 ? " The same paragraph is printed " + plan.places + " times in this report, and each now has the new wording." : "") });
      });
    });
  }
  // Puts back what Accept replaced, unless it has been edited since, which is
  // then the consultant's to change on the Report page.
  function undoAccept(t, done) {
    var acc = t.accepted, r = acc && acc.revert;
    if (!r || !r.report || !r.key || (r.field !== "title" && r.field !== "prose" && r.field !== "paragraph")) { done({ ok: false, message: "There is nothing recorded to undo for this comment." }); return; }
    var gone = false;
    if (r.field === "paragraph") {
      // Only the one replacement this comment's Accept made, whether or not
      // it applies now: any other in the section is left exactly as it is.
      var RS = window.App.ReportSections, list = RP().sectionOf(r.report, r.key).paragraphs, entry = RS.paragraphFor(list, r.from);
      gone = !entry && !(r.prevTo != null && norm(acc.applied) === norm(r.from));
      if (entry && norm(entry.to) !== norm(acc.applied)) {
        done({ ok: false, message: "The wording has been changed since it was accepted, so the earlier wording was not put back. Use Back to the generated version on the Report page." });
        return;
      }
      if (!gone) RP().setSection(r.report, r.key, { paragraphs: RS.setParagraph(list, r.from, r.prevTo) });
    } else {
      var now = RP().sectionOf(r.report, r.key)[r.field] || null;
      if (norm(now) !== norm(acc.applied)) {
        done({ ok: false, message: "That section has been edited since the wording was accepted, so it was left as it is. Use Edit on the Report page." });
        return;
      }
      var patch = {}; patch[r.field] = r.prev || null;
      RP().setSection(r.report, r.key, patch);
    }
    delete t.accepted;
    if (!RC().setStatus(store() || RC().emptyStore(), t.comment.id, "open").ok) t.status = "open";
    RT().touched();
    currentDocs(function () {
      done({ ok: true, message: gone ? "The accepted wording had already been taken out, so the comment is open again."
        : "The earlier wording is back, and the comment is open again." });
    });
  }

  // Go to: a report block opens that report at the section; a zone's threat or
  // target levels open the page they are entered on, scrolled to them.
  function flash(el) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("check-flash");
    void el.offsetWidth;
    el.classList.add("check-flash");
    window.setTimeout(function () { el.classList.remove("check-flash"); }, 2200);
  }
  function attrSel(name, v) { return "[" + name + '="' + String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"]'; }
  function goTo(t) {
    var a = t.comment.anchor || {}, s = RT().state;
    if (a.kind === "item") {
      var id = String(a.itemId || ""), cut = id.lastIndexOf(":"), owner = cut > 0 ? id.slice(0, cut) : id, sub = cut > 0 ? id.slice(cut + 1) : "";
      s.stage = sub === "slt" ? "slt" : "risk";
      // Step 5 shows one zone or conduit at a time: open the one named, at the threat.
      if (s.stage === "risk" && window.RiskApp && window.RiskApp.RiskPage) window.RiskApp.RiskPage.select(owner, sub || null);
      RT().render();
      var main = document.getElementById("main"), el = main && main.querySelector(attrSel("data-owner-id", owner));
      if (el && sub && sub !== "slt") el = el.querySelector(attrSel("data-threat-id", sub)) || el;
      if (!el) { RT().toast("That zone or threat is no longer in the risk assessment.", "warn"); return; }
      flash(el);
      return;
    }
    if (a.kind === "general") { s.stage = "basis"; RT().render(); return; }
    var d = docFor(a, cachedDocs());
    var tab = d ? (d.reportId === "highLevel" ? 1 : 0) : (a.documentTitle ? (a.documentTitle === HIGH_LEVEL_TITLE ? 1 : 0) : a.documentIndex);
    RP().goTo(tab, a.sectionKey, a.quote);
  }

  // ---- QA review by -------------------------------------------------------------
  //
  // An approval can fill QA review by, and the consultant says so: offered once
  // per reviewer, and a different name already there is never replaced without
  // asking.
  var qaOffers = [], qaFor = null;   // { reviewer }, for this project only
  function offersNow() {
    if (qaFor !== project()) { qaFor = project(); qaOffers = []; }
    return qaOffers;
  }
  function afterImport(results) {
    offersNow();
    results.forEach(function (r) {
      if (!RC().isApproval(r.verdict)) return;
      // The same name in other capitals is the same reviewer.
      var who = norm(r.reviewer).toLowerCase();
      if (norm(project().engagement.qaReviewBy).toLowerCase() === who) return;
      if (!qaOffers.some(function (o) { return norm(o.reviewer).toLowerCase() === who; })) qaOffers.push({ reviewer: r.reviewer });
    });
  }
  function qaPrompt(h, repaint) {
    if (!offersNow().length) return null;
    var o = qaOffers[0], cur = norm(project().engagement.qaReviewBy);
    function finish(fill) {
      qaOffers.shift();
      if (fill) { project().engagement.qaReviewBy = o.reviewer; RT().touched(); RT().toast("QA review by now says " + o.reviewer + ".", ""); }
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

  // ---- the warnings ---------------------------------------------------------------
  //
  // What the review says about the reports now: on the Peer review, Report and
  // Review & export pages, and in the question before a Word or Excel download.
  // Only once a review has started, so a lone consultant is never nagged, and
  // only ever a warning. "Changed since approval" needs the current reports, so
  // it waits for them; the pages that show the list build them.
  function currentHashes() { var d = cachedDocs(); return d ? d.map(function (x) { return x.contentHash; }) : null; }
  function exportWarnings() {
    var s = store();
    return (s ? RC().warnings(s, currentHashes(), { qaReviewBy: project().engagement.qaReviewBy }) : []).concat(rewordedWarnings());
  }
  // An accepted rewording whose paragraph has changed since: the generated
  // text prints, and the author may believe the reviewer's wording is in. One
  // line per report. Not for a section the author has since hidden or
  // rewritten as a whole: that was their own choice.
  function rewordedWarnings() {
    var out = [];
    DOCS.forEach(function (d) {
      var lost = paragraphChanges().filter(function (r) { return r.report === d.id && r.state === "changed"; }).length;
      if (lost) out.push({ kind: "reworded-not-applied", text: d.title + ": " + (lost === 1 ? "1 accepted rewording is" : lost + " accepted rewordings are") +
        " not in the Word report, as the text " + (lost === 1 ? "it" : "they") + " replaced has changed. The Report page lists " + (lost === 1 ? "it" : "them") + "." });
    });
    return out;
  }
  function fillWarnings(box) {
    if (box.__fill) { box.__fill(); return; }
    var ws = exportWarnings();
    box.innerHTML = "";
    // The box, or the card it is in on another page: nothing to say, nothing to see.
    (box.__shows || box).style.display = ws.length ? "" : "none";
    ws.forEach(function (w) {
      var li = document.createElement("li");
      li.setAttribute("data-review-warning", w.kind);
      li.textContent = w.text;
      box.appendChild(li);
    });
  }
  var warnBoxes = [];
  function repaintWarnings() {
    warnBoxes = warnBoxes.filter(function (b) { return b.isConnected; });
    warnBoxes.forEach(fillWarnings);
  }
  function watchWarnings(box) {
    warnBoxes = warnBoxes.filter(function (b) { return b.isConnected; });
    warnBoxes.push(box);
    fillWarnings(box);
    if (needsDocs()) refreshDocs(repaintWarnings);
  }
  // Only an approval needs the reports rebuilt, to see whether they changed
  // since, or a reworded paragraph, to see whether it still applies.
  function needsDocs() {
    var s = store();
    if (cachedDocs()) return false;
    return hasParagraphs() || (!!s && s.files.some(function (f) { return f.verdict && RC().isApproval(f.verdict.value); }));
  }
  // A card for another page: the warnings and a way to the Peer review page.
  // Nothing at all until a review has started.
  function warningsCard(h, card) {
    if (!store()) return null;
    var box = h("ul", { class: "rv-warnings" });
    var kids = [
      box,
      h("p", { class: "rv-warn-foot" }, [h("button", { type: "button", class: "btn sm", text: "Open Peer review", onClick: function () { RT().state.stage = "peer"; RT().render(); } })])
    ];
    var node = card ? card("Peer review", null, kids) : h("div", { class: "card" }, [h("div", { class: "card-h" }, [h("h2", { text: "Peer review" })]), h("div", { class: "card-b" }, kids)]);
    node.classList.add("rv-warn-card", "no-print");
    box.__shows = node;
    watchWarnings(box);
    return node;
  }
  // The lines for the question before a download.
  function exportWarningTexts() { return exportWarnings().map(function (w) { return w.text; }); }

  // Is this pack one this project sent? A risk pack for the same client, and
  // the same system under consideration when both name one.
  function packMatches(pack) {
    var e = (pack && pack.engagement) || {}, p = project();
    if (e.instrumentId !== "risk-assessment" && e.scoringFamily !== "risk-assessment") return false;
    function k(s) { return norm(s).toLowerCase(); }
    if (k(e.client) !== k(p.engagement.client)) return false;
    return !k(e.site) || !k(p.suc && p.suc.name) || k(e.site) === k(p.suc.name);
  }

  // ---- the page ---------------------------------------------------------------------
  var ui = null, liveHolder = null, pageH = null;
  function paint(holder) {
    ui = ui || window.App.ReviewAuthor.newUi();
    liveHolder = holder;
    window.App.ReviewAuthor.mount(holder, adapter(), ui);
  }
  function live() { return liveHolder && liveHolder.isConnected ? liveHolder : null; }
  function adapter() {
    return {
      store: function () { return store() || RC().emptyStore(); },
      // A pack sent from a copy of the project that was never saved puts its
      // round back (review-author asks packMatches), on a review started for it.
      ensureStore: ensureStore,
      packMatches: packMatches,
      // The store changed (an import, a status, an Accept): the warnings follow.
      touch: function () { RT().touched(); repaintWarnings(); },
      send: send,
      afterImport: afterImport,
      goTo: goTo,
      // Back from a Go to, which always leaves the Peer review page.
      showCard: function () { RT().state.stage = "peer"; RT().render(); },
      acceptPlan: acceptPlan,
      accept: function (t, done) { accept(t, function (res) { repaintWarnings(); done(res); }); },
      undoAccept: function (t, done) { undoAccept(t, function (res) { repaintWarnings(); done(res); }); },
      acceptedNote: acceptedNote,
      stale: isStale,
      fieldLabel: function (f) { return FIELD_LABELS[f] || null; },
      authorName: function () { return norm(project().engagement.consultant) || "Author"; },
      extras: function () { return pageH ? qaPrompt(pageH, function () { var c = live(); if (c) paint(c); }) : null; },
      live: live,
      beginPaint: beginPaint,
      endPaint: endPaint,
      toast: RT().toast
    };
  }
  function render(main, h, card) {
    pageH = h;
    main.appendChild(h("h1", { class: "page-title", text: "Peer review" }));
    main.appendChild(h("p", { class: "page-sub", text: "Send the reports for review and import the comments." }));
    var holder = h("div", { class: "rv-panel" });
    var warnBox = h("ul", { class: "rv-warnings", style: "margin:0 0 10px;padding-left:18px;font-size:13px" });
    var p = project(), lead = (p.zones.length || p.conduits.length)
      ? "Reviewers open the pack in the OT Cyber Report Review Tool; import their review files here."
      : "Until there are zones, the pack holds only the high-level report; import reviewers' files here.";
    main.appendChild(card("Review", null, [
      h("p", { class: "issue-lead", text: lead }),
      warnBox,
      holder
    ]));
    // Not through watchWarnings: on this page the list shows even before a
    // review starts ("Not reviewed yet"), as the assessment tool's Issue check does.
    function fill() {
      var ws = RC().warnings(store() || RC().emptyStore(), currentHashes(), { qaReviewBy: project().engagement.qaReviewBy }).concat(rewordedWarnings());
      warnBox.innerHTML = "";
      warnBox.style.display = ws.length ? "" : "none";
      ws.forEach(function (w) { warnBox.appendChild(h("li", { "data-review-warning": w.kind, text: w.text })); });
    }
    warnBox.__fill = fill;
    warnBoxes = warnBoxes.filter(function (b) { return b.isConnected; });
    warnBoxes.push(warnBox);
    fill();
    paint(holder);
    // The reports are rebuilt after an edit; the comments' "no longer matches"
    // and the "changed since approval" warning wait for them.
    if (store() && !cachedDocs()) refreshDocs(function () { if (holder.isConnected) { paint(holder); fill(); } });
  }

  return { render: render, buildPack: buildPack, packItems: packItems, buildDocuments: buildDocuments, store: store, ensureStore: ensureStore, send: send,
    importTexts: function (list) { return window.App.ReviewAuthor.importTexts(adapter(), list, null, null); },
    isStale: isStale, acceptPlan: acceptPlan, accept: accept, undoAccept: undoAccept, goTo: goTo, refreshDocs: refreshDocs,
    exportWarnings: exportWarnings, exportWarningTexts: exportWarningTexts, paragraphChanges: paragraphChanges, acceptedNote: acceptedNote, cachedDocs: cachedDocs, warningsCard: warningsCard, currentHashes: currentHashes, needsDocs: needsDocs,
    qaOffers: function () { return offersNow().slice(); }, FIELD_LABELS: FIELD_LABELS,
    // For the tests: the page's adapter, and how often a drawing really worked
    // out the signature, the items and a document's texts.
    __adapter: adapter, __counts: counts,
    // For the tests: a document's content hash from its blocks.
    __hashOf: hashOf };
})();
