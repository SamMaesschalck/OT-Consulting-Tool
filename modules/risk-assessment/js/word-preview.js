/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* word-preview.js
 *
 * The Word preview: the Word report as Download Word report makes it, drawn
 * page by page. The same file is built in memory (exports.js buildWordDoc,
 * packed as downloadWord packs it), read back with the shared Word reader
 * (js/docx-import.js, App.DocxImport) and drawn by the shared renderer
 * (js/doc-preview.js, App.DocPreview): the cover, then the body on A4 sheets,
 * landscape where the report turns landscape. What is shown is the file
 * itself, so it cannot disagree with it. Built when the page is opened, kept
 * until the project changes. The Report page is still where the report is
 * edited.
 */
window.RiskWordPreview = (function () {
  "use strict";

  function RT() { return window.RiskTool; }
  function RX() { return window.RiskExports; }
  var DOCS = [
    { id: "detailed", label: "Detailed", opts: {} },
    { id: "highLevel", label: "High level", opts: { highLevelOnly: true } },
    // Phase 6b: the cyber security requirements specification.
    { id: "spec", label: "Specification", opts: { spec: true } }
  ];
  var ui = { doc: 0, key: null, read: null, error: null, seq: 0 };

  function keyOf(docIndex) {
    // The page a file was saved on is no part of the report.
    try { return JSON.stringify([docIndex, RT().state.project], function (k, v) { return k === "lastStage" ? undefined : v; }); } catch (e) { return String(Date.now()); }
  }

  // The Report page's Word pages view (js/ui-reports.js draws the view and
  // report choice around it).
  function render(main, h) {
    var DP = window.App && window.App.DocPreview;
    main.appendChild(h("h1", { class: "page-title", text: "Word preview" }));
    main.appendChild(h("p", { class: "page-sub", text: "The Word report, page by page. Edit it in Sections." }));
    if (!DP || !window.App.DocxImport || !RX() || !window.docx) {
      main.appendChild(h("p", { class: "muted", text: "The Word preview is not available in this copy of the tool." }));
      return;
    }
    var tabs = h("div", { class: "rp-tabs", role: "group", "aria-label": "Which report", id: "wp-docs" }, DOCS.map(function (d, i) {
      var b = h("button", { class: "sl-btn rp-tab" + (i === ui.doc ? " active" : ""), "aria-pressed": i === ui.doc ? "true" : "false", "data-doc": d.id, text: d.label,
        onClick: function () { if (ui.doc === i) return; ui.doc = i; RT().render(); } });
      return b;
    }));
    var again = h("button", { class: "btn", id: "wp-refresh", text: "Build again", onClick: function () { ui.key = null; RT().render(); } });
    main.appendChild(h("div", { class: "rp-toolbar no-print wp-bar", id: "wp-bar" }, [tabs, h("span", { class: "rp-spacer" }), again]));
    var stateText = h("span", { class: "muted", id: "wp-state-text" });
    var meter = h("progress", { class: "wp-progress", id: "wp-progress", max: "100", value: "0" });
    var state = h("div", { class: "wp-state", id: "wp-state", role: "status", "aria-live": "polite" }, [stateText, meter]);
    main.appendChild(state);
    var paper = h("div", { class: "wp-paper", id: "wp-paper" });
    main.appendChild(paper);

    function say(text, fraction) {
      stateText.textContent = text;
      if (fraction == null) meter.classList.add("hidden");
      else { meter.classList.remove("hidden"); meter.value = Math.round(Math.max(0, Math.min(1, fraction)) * 100); }
    }
    function show(read) {
      state.classList.add("hidden");
      DP.drawRead(paper, read, { fit: true });
    }
    var key = keyOf(ui.doc), d = DOCS[ui.doc];
    if (ui.key === key && ui.read) { show(ui.read); return; }
    if (ui.key === key && ui.error) { say(ui.error, null); return; }
    var seq = ++ui.seq;
    say("Building the Word report…", 0.05);
    // A moment for the page to show the message before the build takes the thread.
    setTimeout(function () {
      if (seq !== ui.seq) return;
      var built;
      try { built = window.docx.Packer.toBlob(RX().buildWordDoc(RT().state.project, Object.assign({}, d.opts))); }
      catch (e) { built = Promise.reject(e); }
      built.then(function (blob) {
        if (seq !== ui.seq) return null;
        if (stateText.isConnected) say("Reading the pages…", 0.3);
        return DP.fromDocx(blob, { name: d.id + ".docx", onProgress: function (f) {
          if (seq === ui.seq && stateText.isConnected) say("Reading the pages…", 0.3 + 0.65 * (f || 0));
        } });
      }).then(function (read) {
        if (!read) return;
        if (seq !== ui.seq) { DP.dispose(read); return; }
        if (ui.read && ui.read !== read) DP.dispose(ui.read);
        ui.key = key; ui.read = read; ui.error = null;
        if (stateText.isConnected) { say("Drawing the pages…", 0.97); setTimeout(function () { if (seq === ui.seq && paper.isConnected) show(read); }, 0); }
      }, function (e) {
        if (seq !== ui.seq) return;
        ui.key = key; ui.read = null; ui.error = "The Word report could not be built: " + ((e && e.message) || "something went wrong.");
        if (stateText.isConnected) say(ui.error, null);
      });
    }, 30);
  }

  return { render: render, DOCS: DOCS, state: ui };
})();
