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
 * they are not. Anything else is Copy plus Go to. The store is project.review:
 * absent until a review starts, so older files still load, and neither export
 * reads it.
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
  function store() { var s = project().review; return s ? RC().normaliseStore(s) : null; }
  function ensureStore() {
    var s = store();
    if (!s) { s = RC().emptyStore(); project().review = s; RT().touched(); }
    return s;
  }

  // ---- the documents --------------------------------------------------------
  var DOCS = [
    { title: "Detailed report", opts: {} },
    { title: "High-level report", opts: { highLevelOnly: true } }
  ];
  function buildDocuments(progress) {
    var out = [], chain = Promise.resolve();
    DOCS.forEach(function (d, i) {
      var probe = [];
      chain = chain.then(function () {
        if (progress) progress("Building the Word report " + (i + 1) + " of " + DOCS.length + "…");
        return window.docx.Packer.toBlob(RX().buildWordDoc(project(), Object.assign({}, d.opts, { sectionProbe: probe })));
      }).then(function (blob) {
        // A section's key slugs its GENERATED heading, and a Word file only has
        // the printed one. The build's probe says which section each heading is,
        // renamed or not, and which are only a zone's name.
        return DB().fromBlob(blob, { idPrefix: "d" + i + "-b", headings: probe });
      }).then(function (res) {
        out.push({ title: d.title, targetName: "", blocks: res.blocks, media: res.media, contentHash: DB().contentHash(res.blocks), probe: probe });
      });
    });
    return chain.then(function () { return out; });
  }

  // ---- the engagement behind them ----------------------------------------------
  function ownerName(o) { return o.name || o.id; }
  function packItems() {
    var p = project(), R = RT(), items = [], facts = [];
    var tolerable = p.srs.tolerableRisk || "medium";
    function addOwner(o, groupName) {
      var fact = { targetName: ownerName(o), roadmapEntries: 0, findings: 0, met: 0, recorded: 0, toAssess: 0, unanswered: 0, na: 0, groups: [] };
      var field = { finding: "findings", met: "met", recorded: "recorded", "to-assess": "toAssess", unanswered: "unanswered", na: "na" };
      (o.threats || []).forEach(function (t) {
        var band = R.threatRisk(t), resid = R.residualRisk(t);
        var over = R.exceedsTolerable(resid || band, tolerable);
        var status = !band ? "unanswered" : (over ? "finding" : "met");
        var linked = (o.countermeasures || []).filter(function (m) { return (m.description || "").trim(); });
        items.push({
          targetName: ownerName(o), itemId: o.id + ":" + t.id, code: t.id, title: t.statement || "(no statement)", groupName: groupName,
          answer: band ? "Risk " + band + (resid ? ", residual " + resid : "") : "Not assessed",
          expected: "Tolerable: " + tolerable,
          evidence: t.source || "", notes: t.acceptance || "",
          owner: "", action: linked.map(function (m) { return m.description; }).join("; "), impact: t.impact || "",
          priority: R.threatDisposition(o, t, tolerable) || "", status: status, shared: false
        });
        fact[field[status]]++;
      });
      var slt = o.slTargetByFR || {}, vals = Object.keys(slt).filter(function (k) { return slt[k] != null; });
      items.push({
        targetName: ownerName(o), itemId: o.id + ":slt", code: "SL-T", title: "Target security levels", groupName: groupName,
        answer: vals.length ? vals.map(function (k) { return k + " " + slt[k]; }).join(", ") : "Not set",
        expected: "", evidence: o.justification || "", notes: "", owner: "", action: "", impact: "", priority: "",
        status: vals.length ? "recorded" : "unanswered", shared: false
      });
      fact[vals.length ? "recorded" : "unanswered"]++;
      facts.push(fact);
    }
    p.zones.forEach(function (z) { addOwner(z, "Zone"); });
    p.conduits.forEach(function (c) { addOwner(c, "Conduit"); });
    return { items: items, perTarget: facts };
  }

  function buildPack(progress) {
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
          documentControl: { documentRevision: p.engagement.revision || "", confidentiality: p.engagement.confidentiality || "" }
        },
        documents: docs.map(function (d) { return { title: d.title, targetName: d.targetName, contentHash: d.contentHash, media: d.media, blocks: d.blocks }; }),
        items: extract.items,
        basisOfAssessment: { interviews: b.interviews || [], documents: b.documents || [], observations: b.observations || [] },
        facts: { perTarget: extract.perTarget },
        previousRound: RC().previousRound(s)
      };
      return { pack: pack, docs: docs, store: s };
    });
  }

  function send(progress, done) {
    buildPack(progress).then(function (r) {
      var name = RC().fileSlug(project().engagement.client || project().suc.name || "risk-assessment") + "-review-pack-round-" + r.pack.round + ".json";
      RC().saveNewFile(JSON.stringify(r.pack), name, "Review pack", function (res) {
        if (!res.ok) { done({ ok: false, message: res.aborted ? null : "The pack was not saved" + (res.error ? ": " + res.error : ".") }); return; }
        RC().recordRound(r.store, r.pack);
        RT().touched();
        snap.signature = signature(); snap.docs = r.docs;
        done({ ok: true, message: "Round " + r.pack.round + " pack saved as " + res.name + ". It holds client data: share it as you would the project file, then give it to each reviewer to open in the OT Cyber Report Review Tool.", pack: r.pack });
      });
    }).catch(function (e) {
      console.error(e);
      done({ ok: false, message: "The pack could not be built: " + ((e && e.message) || e) });
    });
  }

  // ---- comments against the current reports --------------------------------------
  var snap = { signature: null, docs: null, building: null, waiting: [] };
  function signature() { var c = Object.assign({}, project()); delete c.review; delete c.savedOn; return JSON.stringify(c); }
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
    if (a.kind === "item") return !packItems().items.some(function (i) { return i.itemId === a.itemId && i.targetName === a.targetName; });
    var docs = cachedDocs();
    if (!docs) return null;
    var q = norm(a.quote);
    return !docs.some(function (d) {
      return d.blocks.some(function (b) {
        if (norm(DB().blockText(b)) === q) return true;
        if (b.type === "table" && b.rows.some(function (r) { return r.cells.some(function (c) { return norm(c.text) === q; }); })) return true;
        return false;
      }) || DB().flatten(d.blocks).some(function (b) { return norm(b.text) === q; });
    });
  }

  // ---- accepting a suggestion -------------------------------------------------------
  //
  // Which text accepts what: a section's heading goes into its title, and a
  // paragraph of the wording that opens a section into its prose, in the report
  // the comment is on (its documentIndex). Everything else is written from the
  // zones and threats, or is the numbers.
  var NOT_EDITABLE = "This text is written from the zones and threats, so it cannot be changed here. Copy the wording, then use Go to.";
  function docHas(doc, text) {
    var q = norm(text);
    return !!doc && doc.blocks.some(function (b) {
      if (norm(DB().blockText(b)) === q) return true;
      return b.type === "table" && b.rows.some(function (r) { return r.cells.some(function (c) { return norm(c.text) === q; }); });
    }) || (!!doc && DB().flatten(doc.blocks).some(function (b) { return norm(b.text) === q; }));
  }
  // How a comment's suggestion would be applied, given the current documents.
  // { can, why, label, kind, apply(), undo(), expect: [texts], documentIndex }
  function planAccept(t, docs) {
    var c = t.comment, a = c.anchor || {}, sug = c.suggestion;
    if (!sug) return { can: false };
    if (a.kind !== "block") return { can: false, why: "This comment is on the zones and threats behind the reports, not on their wording, so copy the wording and use Go to." };
    if (!docs) return { can: false, why: "Still checking this against the current report." };
    var i = a.documentIndex === 1 ? 1 : 0, doc = docs[i];
    var docId = i === 1 ? "highLevel" : "detailed";
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
        expect: [title] };
    }

    // A section's opening wording: a rewrite replaces the whole run, so the run
    // is rebuilt with the one paragraph changed.
    var runs = probe.filter(function (s) { return s.key && s.key === a.sectionKey && s.texts.some(function (x) { return norm(x) === norm(a.quote); }); });
    if (!a.cell && runs.length) {
      if (runs[0].repeat || runs.length > 1) {
        return { can: false, why: "Each zone and conduit has its own wording in this section, and a rewrite here would replace all of them. Copy the wording and use Go to." };
      }
      var leads = runs[0].texts, prev = RP().sectionOf(docId, a.sectionKey).prose || null;
      var keep = leads.filter(function (x) { return norm(x) !== norm(a.quote); });
      var prose = leads.map(function (x) { return norm(x) === norm(a.quote) ? String(sug).trim() : x; }).join("\n");
      return { can: true, kind: "section opening", label: "Accept", documentIndex: i,
        apply: function () { RP().setSection(docId, a.sectionKey, { prose: prose }); },
        undo: function () { RP().setSection(docId, a.sectionKey, { prose: prev }); },
        expect: String(sug).split(/\n/).filter(function (l) { return norm(l); }).concat(keep) };
    }
    return { can: false, why: NOT_EDITABLE };
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
        var missing = err2 ? plan.expect : plan.expect.filter(function (x) { return !docHas(after[plan.documentIndex], x); });
        if (missing.length) {
          plan.undo();
          currentDocs(function () {
            failedPlans[t.comment.id] = true;
            done({ ok: false, message: "That wording did not reach the Word document when it was rebuilt, so the change was undone. Copy the wording and use Go to." });
          });
          return;
        }
        t.accepted = { at: new Date().toISOString(), kind: plan.kind };
        t.status = "resolved"; t.statusAt = t.accepted.at;
        RT().touched();
        done({ ok: true, message: "Accepted into the " + plan.kind + ", and checked in the rebuilt Word document." });
      });
    });
  }

  function goTo(t) {
    var a = t.comment.anchor || {}, s = RT().state;
    if (a.kind === "item") { s.stage = /:slt$/.test(a.itemId || "") ? "slt" : "risk"; RT().render(); return; }
    if (a.kind === "general") { s.stage = "basis"; RT().render(); return; }
    RP().goTo(a.documentIndex, a.sectionKey, a.quote);
  }

  // ---- the page ---------------------------------------------------------------------
  var ui = null;
  function paint(holder) {
    ui = ui || window.App.ReviewAuthor.newUi();
    window.App.ReviewAuthor.mount(holder, adapter(), ui);
  }
  function adapter() {
    return {
      store: function () { return store() || RC().emptyStore(); },
      touch: function () { RT().touched(); },
      send: send,
      goTo: goTo,
      acceptPlan: acceptPlan,
      accept: accept,
      stale: isStale,
      authorName: function () { return norm(project().engagement.consultant) || "Author"; },
      toast: RT().toast
    };
  }
  function render(main, h, card) {
    main.appendChild(h("h1", { class: "page-title", text: "Peer review" }));
    main.appendChild(h("p", { class: "page-sub", text: "Have the reports reviewed through the tools rather than by marking up Word files. Nothing on this page reaches the Word or Excel reports." }));
    var warnings = RC().warnings(store() || RC().emptyStore(), cachedDocs() ? cachedDocs().map(function (d) { return d.contentHash; }) : null);
    var holder = h("div", { class: "rv-panel" });
    main.appendChild(card("Review", null, [
      h("p", { class: "issue-lead", text: "Send for review writes a pack holding both Word reports and the zones and threats behind them. Each reviewer opens it in the OT Cyber Report Review Tool and sends back a small review file; import those here." }),
      warnings.length ? h("ul", { class: "rv-warnings", style: "margin:0 0 10px;padding-left:18px;font-size:13px" }, warnings.map(function (w) { return h("li", { "data-review-warning": w.kind, text: w.text }); })) : null,
      holder
    ]));
    paint(holder);
    if (store() && !cachedDocs()) refreshDocs(function () { if (holder.isConnected) paint(holder); });
  }

  return { render: render, buildPack: buildPack, packItems: packItems, buildDocuments: buildDocuments, store: store, ensureStore: ensureStore, send: send,
    importTexts: function (list) { return window.App.ReviewAuthor.importTexts(adapter(), list, null, null); },
    isStale: isStale, acceptPlan: acceptPlan, accept: accept, goTo: goTo, refreshDocs: refreshDocs };
})();
