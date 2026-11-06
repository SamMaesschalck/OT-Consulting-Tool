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
 * The risk tool's reports have no per-section wording to edit, so a suggestion
 * is Copy plus Go to. The store is project.review: absent until a review starts,
 * so older files still load, and neither export reads it.
 */
window.RiskReview = (function () {
  "use strict";

  function RT() { return window.RiskTool; }
  function RX() { return window.RiskExports; }
  function RC() { return window.App.ReviewCore; }
  function DB() { return window.App.DocxBlocks; }
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
      chain = chain.then(function () {
        if (progress) progress("Building the Word report " + (i + 1) + " of " + DOCS.length + "…");
        return window.docx.Packer.toBlob(RX().buildWordDoc(project(), d.opts));
      }).then(function (blob) {
        return DB().fromBlob(blob, { idPrefix: "d" + i + "-b" });
      }).then(function (res) {
        out.push({ title: d.title, targetName: "", blocks: res.blocks, media: res.media, contentHash: DB().contentHash(res.blocks) });
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
  var snap = { signature: null, docs: null, building: false };
  function signature() { var c = Object.assign({}, project()); delete c.review; delete c.savedOn; return JSON.stringify(c); }
  function cachedDocs() { return snap.docs && snap.signature === signature() ? snap.docs : null; }
  function refreshDocs(cb) {
    if (cachedDocs() || snap.building) { if (cb) cb(); return; }
    snap.building = true;
    var sig = signature();
    buildDocuments().then(function (docs) {
      snap.building = false; snap.signature = sig; snap.docs = docs;
      if (cb) cb();
    }, function () { snap.building = false; if (cb) cb(); });
  }
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
  function acceptPlan() {
    return { can: false, why: "The risk tool's reports are written from the zones and threats, with no wording to edit on its own. Copy the wording, then use Go to." };
  }
  function goTo(t) {
    var a = t.comment.anchor || {}, s = RT().state;
    if (a.kind === "item") { s.stage = /:slt$/.test(a.itemId || "") ? "slt" : "risk"; RT().render(); return; }
    if (a.kind === "general") { s.stage = "basis"; RT().render(); return; }
    s.stage = a.documentIndex === 1 ? "hlreport" : "review";
    RT().render();
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
      accept: function (t, done) { done({ ok: false, message: acceptPlan().why }); },
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
    isStale: isStale, acceptPlan: acceptPlan, goTo: goTo, refreshDocs: refreshDocs };
})();
