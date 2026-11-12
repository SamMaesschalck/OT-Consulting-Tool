/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* word-preview-check.js: the body of test-word-preview.html and
 * test-word-preview-2.html, which split the demos between them (every other
 * one, by window.WP_PART) so each page finishes well inside the runner's
 * time under the full suite's load. Part 0 also checks the page itself.
 *
 * For each demo the real Word report is built as Export Word builds it, read
 * back and drawn (shared/doc-preview.js), and what is drawn is checked
 * against the file itself, read here straight from word/document.xml: the
 * house cover recognised; one body sheet per page the file starts, landscape
 * where it turns landscape; every heading with its typed number; every body
 * picture; every coloured cell in its colour.
 */
var W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
function attr(el, name) { return el.getAttributeNS(W, name) || el.getAttribute("w:" + name); }
// What the file holds, read from its XML, with the cover (the first section) left out.
function fromXml(parts) {
  var docPart = parts.filter(function (p) { return p.name === "word/document.xml"; })[0];
  var d = new DOMParser().parseFromString(docPart.text, "application/xml");
  var body = d.getElementsByTagNameNS(W, "body")[0];
  var kids = Array.prototype.slice.call(body.children), out = { sheets: 0, land: 0, headings: [], pictures: 0, fills: 0, navy: 0 };
  // The first section is the cover: everything up to the first paragraph holding a sectPr.
  var start = 0, i;
  for (i = 0; i < kids.length; i++) {
    if (kids[i].localName === "p" && kids[i].getElementsByTagNameNS(W, "sectPr")[0]) { start = i + 1; break; }
  }
  // Each section starts a sheet, and each page break in it another; a
  // landscape section's sheets are landscape.
  var starts = 0;
  function closeSection(sect) {
    var pg = sect.getElementsByTagNameNS(W, "pgSz")[0], land = !!pg && attr(pg, "orient") === "landscape";
    out.sheets += 1 + starts;
    if (land) out.land += 1 + starts;
    starts = 0;
  }
  for (i = start; i < kids.length; i++) {
    var el = kids[i];
    if (el.localName === "sectPr") { closeSection(el); continue; }
    Array.prototype.forEach.call(el.getElementsByTagNameNS(W, "br"), function (br) { if (attr(br, "type") === "page") starts++; });
    if (el.localName === "p") {
      var pbb = el.getElementsByTagNameNS(W, "pageBreakBefore")[0];
      if (pbb && attr(pbb, "val") !== "0" && attr(pbb, "val") !== "false") starts++;
      var st = el.getElementsByTagNameNS(W, "pStyle")[0], s = st ? attr(st, "val") : "";
      if (/^Heading[123]$/.test(s)) out.headings.push(Array.prototype.map.call(el.getElementsByTagNameNS(W, "t"), function (t) { return t.textContent; }).join("").replace(/\s+/g, " ").trim());
      var sect = el.getElementsByTagNameNS(W, "sectPr")[0];
      if (sect) closeSection(sect);
    }
    out.pictures += el.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main", "blip").length;
    Array.prototype.forEach.call(el.getElementsByTagNameNS(W, "tcPr"), function (tcPr) {
      var shd = tcPr.getElementsByTagNameNS(W, "shd")[0];
      if (!shd) return;
      var f = String(attr(shd, "val") === "solid" ? attr(shd, "color") : attr(shd, "fill") || "").toUpperCase();
      if (/^[0-9A-F]{6}$/.test(f) && f !== "FFFFFF") { if (f === "173267") out.navy++; else out.fills++; }
    });
  }
  return out;
}

H.test(function (ok, done) {
  var A = window.App, E = A.Engine, DP = A.DocPreview, X = A.ExportDOCX, part = window.WP_PART || 0;
  window.confirm = function () { return true; }; window.alert = function () {};
  var downloads = 0;
  A.Storage.downloadBlob = function () { downloads++; };
  E.loadCatalog(); A.UI.init({ autosave: false });
  var SEED = H.demoSeeds();
  // Guarded: a demo that creates an assessment (the three with a previous one)
  // fires instrument-changed again from inside apply().
  E.on("instrument-changed", function (inst) { var m = inst && SEED[inst.id]; if (m && m.apply && !m.__busy) { m.__busy = true; try { m.apply(E); } finally { m.__busy = false; } } });
  ok(!!DP && !!A.DocxImport && !!A.ZipIO, "the preview's reader and renderer are loaded");
  var ids = Object.keys(SEED).filter(function (id, i) { return i % 2 === part; });
  var chain = Promise.resolve(), stage = document.getElementById("stage");

  ids.forEach(function (id) {
    chain = chain.then(function () {
      E.activateInstrument(id);
      var opts = {
        cafProfileRegistry: E.getCAFProfileRegistry(), cafProfileId: E.getActiveCAFProfileId(),
        cafProfile: E.getActiveCAFProfile(), cafOverlay: E.getActiveCAFOverlay(),
        targetId: E.state.activeTargetId, issueStatus: "draft",
        riskAppetiteSetup: E.state.scoringFamily === "risk-appetite-coherence" ? E.getRiskAppetiteSetup() : null
      };
      if (E.state.scoringFamily === "csms-conformance" && E.getCRASetupRaw) opts.craSetup = E.getCRASetupRaw();
      return new Promise(function (res) {
        X.buildAsync(E.state.engagement, E.state.instrument, E.state.taxonomy, E.state.profile, E.getActiveNarrative(), opts,
          function (err, blob) { res(err ? { err: err } : { blob: blob }); });
      }).then(function (r) {
        if (r.err) { ok(false, id + ": the Word report builds", r.err.message); return; }
        return Promise.all([H.unzipText(r.blob), DP.fromDocx(r.blob, { name: id + ".docx" })]).then(function (got) {
          var want = fromXml(got[0]), read = got[1];
          ok(!!read.cover && !!read.cover.kicker && read.cover.titleLines.length > 0 && !!read.cover.client && read.cover.strip.length >= 2,
            id + ": the house cover is recognised", JSON.stringify(read.cover && { k: read.cover.kicker, t: read.cover.titleLines, s: read.cover.strip }));
          ok(read.cover && !!read.cover.bg && !!read.cover.logo, id + ": the cover's background and logo are the file's pictures");
          var paper = document.createElement("div");
          stage.textContent = ""; stage.appendChild(paper);
          DP.drawRead(paper, read, { watermark: "DRAFT" });
          var sheets = paper.querySelectorAll(".dpv-sheet");
          var body = paper.querySelectorAll(".dpv-sheet[data-part=body]");
          ok(paper.querySelectorAll(".dpv-sheet[data-part=cover] .cover-page").length === 1, id + ": the cover is drawn on a sheet of its own");
          ok(body.length === want.sheets, id + ": one sheet per page the file starts (" + want.sheets + ")", "drew " + body.length);
          ok(paper.querySelectorAll(".dpv-sheet.land").length === want.land, id + ": a landscape sheet for each landscape page start (" + want.land + ")",
            "drew " + paper.querySelectorAll(".dpv-sheet.land").length);
          var heads = Array.prototype.map.call(paper.querySelectorAll(".dpv-sheet[data-part=body] > .blk[data-type=heading]"), function (b) {
            var n = b.querySelector(".hnum").textContent, t = b.querySelector(".txt").textContent;
            return ((n ? n + " " : "") + t).replace(/\s+/g, " ").trim();
          });
          ok(heads.length === want.headings.length, id + ": every heading in the file is a heading on a sheet (" + want.headings.length + ")", "drew " + heads.length);
          var firstOff = -1;
          want.headings.forEach(function (w, i) { if (firstOff < 0 && heads[i] !== w) firstOff = i; });
          ok(firstOff < 0, id + ": the headings read as the file has them, numbers included",
            firstOff < 0 ? "" : JSON.stringify([want.headings[firstOff], heads[firstOff]]));
          var pics = paper.querySelectorAll(".dpv-sheet[data-part=body] figure.pic img");
          ok(pics.length === want.pictures, id + ": every picture in the body is drawn (" + want.pictures + ")", "drew " + pics.length);
          ok(Array.prototype.every.call(pics, function (img) { return /^blob:/.test(img.src); }), id + ": the pictures come from the file itself");
          // The template's navy is also a house header row's.
          var filled = Array.prototype.slice.call(paper.querySelectorAll(".dpv-sheet[data-part=body] td.filled, .dpv-sheet[data-part=body] th.filled"));
          var navy = filled.filter(function (c) { return c.style.background.indexOf("rgb(23, 50, 103)") === 0; }).length;
          var houseHead = paper.querySelectorAll(".dpv-sheet[data-part=body] th:not(.filled):not(.plain)").length;
          ok(filled.length - navy === want.fills, id + ": every coloured cell in the file is drawn in its colour (" + want.fills + ")", "drew " + (filled.length - navy));
          ok(navy === want.navy && houseHead === 0, id + ": every navy cell is drawn navy, and no other header cell (" + want.navy + ")", "drew " + navy + ", other navy headers " + houseHead);
          ok(read.furniture && !!read.furniture.logo && !!read.furniture.left, id + ": the running header and footer are read");
          ok(paper.querySelectorAll(".dpv-sheet[data-part=body] .dpv-mark").length === body.length, id + ": a draft is marked on every body sheet");
          ok(sheets.length === body.length + 1, id + ": nothing is drawn but the cover and the body");
          DP.dispose(read);
        });
      }).catch(function (e) { ok(false, id + ": threw " + (e && e.message), e && e.stack); });
    });
  });

  // The page itself, on the multi-zone 62443-3-3 demo.
  if (part === 0) chain = chain.then(function () {
    E.activateInstrument("iec-62443-3-3");
    var nav = document.getElementById("nav-word-preview");
    ok(!!nav && /Word preview/.test(nav.textContent), "the sidebar has a Word preview entry beside the report");
    if (!nav) return;
    nav.click();
    function wait(test, ms) {
      return new Promise(function (res) {
        var t0 = Date.now();
        (function poll() { if (test() || Date.now() - t0 > ms) res(test()); else setTimeout(poll, 100); })();
      });
    }
    return wait(function () { return document.querySelectorAll("#wp-paper .dpv-sheet").length > 3; }, 120000).then(function (drawn) {
      ok(drawn, "the page draws the report's sheets");
      ok(!!document.querySelector("#wp-paper .dpv-sheet[data-part=cover] .cover-page"), "the page starts with the cover");
      ok(document.querySelectorAll("#wp-paper .dpv-mark").length > 0, "a draft shows its watermark");
      ok(downloads === 0, "a preview downloads nothing");
      var main = document.getElementById("main");
      ok(!/[–—]/.test(main.textContent.replace(/[\s\S]*?(?=Word preview)/, "").split("Document control")[0]), "no en or em dashes in the page's own words");
      var fin = document.querySelector('#wp-bar [data-status="final"]');
      ok(!!fin, "Draft and Final can be chosen");
      if (!fin) return;
      fin.click();
      return wait(function () { var s = document.getElementById("wp-state-text"); return (s && /Final is not available/.test(s.textContent)) || document.querySelectorAll("#wp-paper .dpv-sheet").length > 3; }, 120000).then(function () {
        var s = document.getElementById("wp-state-text");
        var refused = s && /Final is not available/.test(s.textContent);
        var drawnFinal = document.querySelectorAll("#wp-paper .dpv-sheet").length > 3 && !document.querySelector("#wp-paper .dpv-mark");
        ok(refused || drawnFinal, "Final either shows the final file, unmarked, or says why it is not available", s && s.textContent);
      });
    });
  });

  chain.then(function () { done(); }, function (e) { ok(false, "threw " + (e && e.message)); done(); });
});
