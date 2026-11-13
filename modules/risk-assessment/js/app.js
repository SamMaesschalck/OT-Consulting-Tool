/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* app.js — the running tool: its state, the page loop and the project file.
 *
 * Holds the one state object ({ project, stage }), unsaved-changes tracking
 * and autosave, Save (in place where the browser allows) and Load, the
 * sidebar, the redraw that keeps keyboard focus, and the header buttons.
 * The pages register themselves in RiskApp.Pages (js/ui-stages.js,
 * js/ui-reports.js, js/ui-about.js, loaded after this file); render() draws
 * whichever the stage names. boot() starts the tool and publishes
 * window.RiskTool, the facade the exports, the review, the Report page, the
 * Word preview, the suite and the tests use; js/boot.js calls it once every
 * page has registered.
 */
window.RiskApp = window.RiskApp || {};
window.RiskApp.Pages = window.RiskApp.Pages || {};
window.RiskApp.App = (function () {
  "use strict";

  var R = window.RiskApp, M = R.Model, E = R.Engine, MG = R.Migrate, U = R.UI;
  var FR_IDS = M.FR_IDS, VERSION = M.VERSION;
  var $ = U.$, h = U.h, toast = U.toast, slug = U.slug, downloadBlob = U.downloadBlob;
  var projectHasContent = M.projectHasContent;

  var AUTOSAVE_KEY = "spt-risk-tool:autosave:v1";
  // Tour mode (?tour): tour.html redirects here with the flag; the completed
  // demo project (data/tour-project.js) is loaded on boot and autosave is
  // made inert, so the demo can neither overwrite nor clear a consultant's
  // real unsaved-work snapshot. An iframe-based tour is not possible on
  // plain file:// (cross-window access between file pages is blocked unless
  // the browser runs with --allow-file-access-from-files). The suite opens
  // the tour by launching the tool with { tour: true } (js/host-bridge.js),
  // since a page it builds in memory can carry no query string.
  var TOUR_MODE = /[?&]tour(=|&|$)/.test(location.search) ||
    !!(window.App.HostBridge && window.App.HostBridge.launch.tour);

  var STAGES = [
    { id: "suc",    label: "1. System under consideration",  sub: "scope and boundary" },
    { id: "srs",    label: "2. High-level risk & requirements", sub: "ranking · tolerable risk" },
    { id: "zones",  label: "3. Zones & conduits",            sub: "partition · drawing" },
    { id: "risk",   label: "4. Detailed risk assessment",    sub: "threats · treatment" },
    { id: "slt",    label: "5. SL-T assignment",             sub: "per foundational requirement" }
  ];

  var state = { project: M.emptyProject(), stage: "suc" };

  // ---------- Persistence ----------

  // Unsaved-changes tracking: `dirty` is set on every edit and cleared on
  // save/load/new. It drives the Save* button and the beforeunload guard.
  var dirty = false, autosaveTimer = null, autosaveBroken = false;

  function updateSaveButton() {
    // The suite, when it hosts the tool, marks tools with unsaved changes
    // in its bar and warns before it closes (js/host-bridge.js; absent or
    // standalone, nothing happens). A tour is a demo whose changes are never
    // kept, so it never reports any.
    if (window.App.HostBridge) window.App.HostBridge.setDirty(dirty && !TOUR_MODE);
    var b = document.getElementById("btn-save");
    if (!b) return;
    if (dirty) { b.textContent = "Save*"; b.classList.add("btn-unsaved"); b.title = "Unsaved changes. Shift+click to save a copy"; }
    else { b.textContent = "Save"; b.classList.remove("btn-unsaved"); b.title = "Shift+click to save a copy"; }
  }
  function markDirty() { if (!dirty) { dirty = true; updateSaveButton(); } }
  function markClean() { if (dirty) { dirty = false; updateSaveButton(); } else updateSaveButton(); }

  // Write the crash-net snapshot now. Surfaces a one-time warning if browser
  // storage is blocked/full, so the consultant knows there is no safety net
  // (a locked-down client laptop) rather than losing work silently.
  // Inert in tour mode: the demo must never overwrite a real snapshot.
  function writeAutosave() {
    if (TOUR_MODE) return;
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ savedOn: new Date().toISOString(), stage: state.stage, project: state.project }));
    } catch (e) {
      if (!autosaveBroken) { autosaveBroken = true; toast("Autosave unavailable (browser storage blocked or full). Save to a file regularly.", "err"); }
    }
  }
  function scheduleAutosave() {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(writeAutosave, 800);
  }
  function flushAutosave() { clearTimeout(autosaveTimer); if (dirty && projectHasContent(state.project)) writeAutosave(); }
  function touched() { markDirty(); scheduleAutosave(); renderHeaderSummary(); }

  // ---------- Save-in-place (File System Access API) ----------
  // A download can never overwrite, so repeated saves pile up as
  // "name (1).json" copies. On Chromium (incl. file://) Save keeps a handle
  // to the project file and writes back to it in place; Load through the
  // picker captures the handle so Save overwrites the loaded file. The
  // handle persists in IndexedDB across sessions (the browser re-confirms
  // permission on the first save of a new session). Where the API is
  // missing, Save falls back to the classic download.

  var projectHandle = null;
  var IDB_NAME = "spt-risk-files", IDB_STORE = "handles", IDB_KEY = "project";

  // The browser refuses the file dialogs to a page framed by a page of
  // another origin (the suite's folder build frames this file:// page, and
  // the browser counts every file:// page as an origin of its own). There
  // Save downloads and Load uses the file input, as in a browser without
  // the dialogs. Standalone, or framed by a page of the same origin (the
  // suite's single-file build), the dialogs are used as normal.
  function inForeignFrame() {
    try { return window.top !== window.self && !window.top.location.href; } catch (e) { return true; }
  }
  function supportsFilePickers() { return typeof window.showSaveFilePicker === "function" && !inForeignFrame(); }

  // In the suite, a project file saved or opened goes on its Recent files
  // list: the name, the customer and when, never the contents. The handle,
  // when the browser gave one, stays in this tool's own storage (see
  // js/host-bridge.js). Standalone, nothing happens.
  function noteRecentFile(action, name, handle) {
    var HB = window.App.HostBridge;
    if (!HB || !HB.hosted || !name || TOUR_MODE) return;   // a tour saves nothing worth reopening
    var p = state.project || {};
    HB.recent({ action: action, name: name, handle: handle || null,
                label: ((p.engagement && p.engagement.client) || (p.suc && p.suc.name) || "") });
  }

  // Handle persistence is a convenience, never a dependency: all failures
  // (no IndexedDB, non-cloneable handle, private mode) are swallowed.
  function persistHandle(hd) {
    try {
      var req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(IDB_STORE); };
      req.onerror = function () {};
      req.onsuccess = function () {
        try {
          var st = req.result.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE);
          if (hd) st.put(hd, IDB_KEY); else st["delete"](IDB_KEY);
        } catch (e) {}
      };
    } catch (e) {}
  }

  function restoreHandle(cb) {
    var called = false;
    function finish(hd) { if (!called) { called = true; cb(hd || null); } }
    if (!supportsFilePickers() || typeof indexedDB === "undefined") { finish(null); return; }
    try {
      var req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(IDB_STORE); };
      req.onerror = function () { finish(null); };
      req.onsuccess = function () {
        try {
          var g = req.result.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(IDB_KEY);
          g.onsuccess = function () { finish(g.result); };
          g.onerror = function () { finish(null); };
        } catch (e) { finish(null); }
      };
    } catch (e) { finish(null); }
    setTimeout(function () { finish(null); }, 1500); // broken storage must not hang the save
  }

  function ensureWritePermission(handle) {
    if (!handle.queryPermission) return Promise.resolve(true);
    return handle.queryPermission({ mode: "readwrite" }).then(function (p) {
      if (p === "granted") return true;
      return handle.requestPermission({ mode: "readwrite" }).then(function (p2) { return p2 === "granted"; });
    }).catch(function () { return false; });
  }

  // Forget the current file (New project, or a legacy file-input load) so a
  // later Save can never overwrite the WRONG project's file.
  function forgetProjectFile() { projectHandle = null; persistHandle(null); }

  // Save. Wired directly to the button click, so `ev` is the click event:
  // Shift+click forces the save dialog (a fresh copy / snapshot).
  function saveProject(ev, onDone) {
    onDone = onDone || function () {};
    var saveAs = !!(ev && ev.shiftKey);
    state.project.savedOn = new Date().toISOString();
    var text = JSON.stringify(state.project, null, 2);
    var suggested = slug(state.project.suc.name) + "-risk-project.json";

    function download(blocked) {
      downloadBlob(text, suggested);
      markClean();
      toast(blocked ? "Risk project saved as a download (" + suggested + "). Each save here downloads a new copy."
                    : "Risk project saved (downloaded).");
      noteRecentFile("save", suggested, null);
      onDone({ ok: true, method: "download", name: suggested, blocked: !!blocked });
    }

    if (!supportsFilePickers()) { download(inForeignFrame()); return; }

    function pick() {
      window.showSaveFilePicker({
        suggestedName: suggested,
        types: [{ description: "OT risk project", accept: { "application/json": [".json"] } }]
      }).then(function (hd) { writeTo(hd, false); }, function (e) {
        // Refused for a security reason (a frame the browser will not show
        // the dialog in, or the click that asked for it has expired): the
        // work still has to reach a file, so it downloads instead.
        if (e && e.name === "SecurityError") { download(true); return; }
        if (!(e && e.name === "AbortError")) toast("Save failed: " + ((e && e.message) || "save dialog failed"), "err");
        onDone({ ok: false, aborted: !!(e && e.name === "AbortError") });
      });
    }

    // canFallback: a reused/restored handle may be stale (file moved/deleted
    // or permission refused) — fall back to the picker instead of failing.
    function writeTo(handle, canFallback) {
      ensureWritePermission(handle).then(function (granted) {
        if (!granted) {
          if (canFallback) pick();
          else { toast("Save failed: write permission refused.", "err"); onDone({ ok: false }); }
          return;
        }
        handle.createWritable().then(function (w) {
          return w.write(text).then(function () { return w.close(); });
        }).then(function () {
          projectHandle = handle;
          persistHandle(handle);
          markClean();
          toast("Saved to " + handle.name + ".");
          noteRecentFile("save", handle.name, handle);
          onDone({ ok: true, method: "file", name: handle.name });
        }).catch(function (e) {
          if (canFallback) pick();
          else { toast("Save failed: " + ((e && e.message) || "could not write file"), "err"); onDone({ ok: false }); }
        });
      });
    }

    if (saveAs) { pick(); return; }
    if (projectHandle) { writeTo(projectHandle, true); return; }
    restoreHandle(function (hd) { if (hd) writeTo(hd, true); else pick(); });
  }

  // Picker-based load: captures the handle so Save writes back to this file.
  function loadViaPicker() {
    window.showOpenFilePicker({
      types: [{ description: "OT risk project", accept: { "application/json": [".json"] } }],
      multiple: false
    }).then(function (handles) {
      var handle = handles && handles[0];
      if (!handle) return;
      handle.getFile().then(function (f) {
        var reader = new FileReader();
        reader.onload = function () {
          if (loadProjectText(String(reader.result))) { projectHandle = handle; persistHandle(handle); noteRecentFile("open", handle.name, handle); }
        };
        reader.onerror = function () { toast("Could not read the file.", "err"); };
        reader.readAsText(f);
      }, function () { toast("Could not read the file.", "err"); });
    }, function (e) {
      if (!(e && e.name === "AbortError")) toast("Open failed: " + ((e && e.message) || "open dialog failed"), "err");
    });
  }

  // Returns true only when the project was actually replaced, so callers can
  // tie follow-up state (e.g. the save-file handle) to a successful load.
  // The file is brought to this build's shape by js/migrate.js.
  function loadProjectText(text) {
    var data;
    try { data = JSON.parse(text); }
    catch (e) { toast("Not a valid JSON file.", "err"); return false; }
    if (!data || !MG.accepts(data.schema)) {
      toast("Unrecognised file: expected " + M.ACCEPTED_PROJECT_SCHEMAS.join(" or ") + ", got " + (data && data.schema ? data.schema : "none") + ".", "err");
      return false;
    }
    if (projectHasContent(state.project)) {
      var incoming = (data.suc && data.suc.name) ? "“" + data.suc.name + "”" : "this project";
      if (!confirm("Load " + incoming + "? Unsaved changes to the current assessment will be lost. Save first if you want to keep them.")) return false;
    }
    state.project = MG.normaliseProject(data);
    state.stage = "suc";
    render(); writeAutosave(); markClean();
    toast("Risk project loaded.");
    return true;
  }

  // ---------- Header / nav ----------

  function renderHeaderSummary() {
    var p = state.project, bits = [];
    if (p.suc.name) bits.push(p.suc.name);
    if (p.zones.length) bits.push(p.zones.length + " zone" + (p.zones.length === 1 ? "" : "s"));
    if (p.conduits.length) bits.push(p.conduits.length + " conduit" + (p.conduits.length === 1 ? "" : "s"));
    var nt = p.zones.concat(p.conduits).reduce(function (a, o) { return a + o.threats.length; }, 0);
    if (nt) bits.push(nt + " threat" + (nt === 1 ? "" : "s"));
    $("suc-summary").textContent = bits.join(" · ");
  }

  function stageBadge(id) {
    var p = state.project;
    if (id === "zones" && p.zones.length) return String(p.zones.length);
    var owners = p.zones.concat(p.conduits);
    if (id === "risk") { var n = owners.reduce(function (a, o) { return a + o.threats.length; }, 0); return n ? String(n) : null; }
    if (id === "slt") {
      var set = owners.filter(function (o) { return FR_IDS.some(function (fr) { return o.slTargetByFR[fr] != null; }); }).length;
      return p.zones.length ? set + "/" + owners.length : null;
    }
    return null;
  }

  function renderNav() {
    var sb = $("sidebar"); sb.innerHTML = "";
    var sec = h("div", { class: "nav-section" });
    sec.appendChild(h("div", { class: "nav-section-title", text: "62443-3-2 workflow" }));
    STAGES.forEach(function (s) {
      var badge = stageBadge(s.id);
      sec.appendChild(h("div", {
        class: "nav-item" + (state.stage === s.id ? " active" : ""),
        onClick: function () { state.stage = s.id; render(); }
      }, [
        h("span", null, [s.label, s.sub ? h("span", { class: "muted", style: "display:block;font-size:11px", text: s.sub }) : null]),
        badge ? h("span", { class: "badge", text: badge }) : null
      ]));
    });
    sec.appendChild(h("div", { class: "nav-section-title", text: "Engagement" }));
    var basisCount = state.project.basisOfAssessment.interviews.length + state.project.basisOfAssessment.documents.length + state.project.basisOfAssessment.observations.length;
    sec.appendChild(h("div", {
      class: "nav-item" + (state.stage === "basis" ? " active" : ""),
      onClick: function () { state.stage = "basis"; render(); }
    }, [
      h("span", null, ["Basis of assessment", h("span", { class: "muted", style: "display:block;font-size:11px", text: "who / what / observed" })]),
      basisCount ? h("span", { class: "badge", text: String(basisCount) }) : null
    ]));
    sec.appendChild(h("div", { class: "nav-section-title", text: "Reports" }));
    sec.appendChild(h("div", {
      class: "nav-item" + (state.stage === "report" ? " active" : ""),
      onClick: function () { state.stage = "report"; render(); }
    }, [h("span", null, ["Report", h("span", { class: "muted", style: "display:block;font-size:11px", text: "both reports, section by section" })])]));
    // The Word file itself, page by page (js/word-preview.js).
    sec.appendChild(h("div", {
      class: "nav-item" + (state.stage === "wordpreview" ? " active" : ""), id: "nav-word-preview",
      onClick: function () { state.stage = "wordpreview"; render(); }
    }, [h("span", null, ["Word preview", h("span", { class: "muted", style: "display:block;font-size:11px", text: "the Word file, page by page" })])]));
    sec.appendChild(h("div", {
      class: "nav-item" + (state.stage === "hlreport" ? " active" : ""),
      onClick: function () { state.stage = "hlreport"; render(); }
    }, [h("span", null, ["High-level report", h("span", { class: "muted", style: "display:block;font-size:11px", text: "the ranking on its own" })])]));
    sec.appendChild(h("div", {
      class: "nav-item" + (state.stage === "review" ? " active" : ""),
      onClick: function () { state.stage = "review"; render(); }
    }, [h("span", null, ["Full report & export", h("span", { class: "muted", style: "display:block;font-size:11px", text: "zones · SL-T · risk context" })])]));
    sec.appendChild(h("div", {
      class: "nav-item" + (state.stage === "peer" ? " active" : ""),
      onClick: function () { state.stage = "peer"; render(); }
    }, [h("span", null, ["Peer review", h("span", { class: "muted", style: "display:block;font-size:11px", text: "send for review · comments" })])]));
    sec.appendChild(h("div", { class: "nav-section-title", text: "Reference" }));
    sec.appendChild(h("div", {
      class: "nav-item" + (state.stage === "about" ? " active" : ""),
      onClick: function () { state.stage = "about"; render(); }
    }, [h("span", { text: "About & framing" })]));
    sb.appendChild(sec);
    sb.appendChild(h("div", { class: "sidebar-legal", title: U.LEGAL_NOTICE, text: U.LEGAL_SHORT }));
  }

  // A redraw rebuilds the page, so the control that had keyboard focus is
  // found again afterwards: by its zone or conduit (its card's place on the
  // page, checked against its id), its threat, and what it is (a treatment
  // choice, a reason field, a card action; a list by its place, which a
  // redraw does not change).
  function focusMark() {
    var el = document.activeElement, main = $("main");
    if (!el || !main || el === main || !main.contains(el) || !el.getAttribute) return null;
    var own = el.closest("[data-owner-id]"), thr = el.closest("[data-threat-id]"), sel = null, index = 0;
    ["data-decision", "data-reason", "data-action"].forEach(function (a) {
      if (!sel && el.getAttribute(a)) sel = "[" + a + '="' + el.getAttribute(a) + '"]';
    });
    if (!sel && el.tagName === "SELECT") { sel = "select"; index = Array.prototype.indexOf.call((thr || own || main).querySelectorAll("select"), el); }
    if (!sel) return null;
    return { owner: own ? own.getAttribute("data-owner-id") : null, ownerAt: own ? Array.prototype.indexOf.call(main.querySelectorAll("[data-owner-id]"), own) : -1,
      threat: thr ? thr.getAttribute("data-threat-id") : null, sel: sel, index: index,
      caret: el.tagName === "INPUT" ? el.selectionStart : null };
  }
  function focusBack(mark) {
    if (!mark) return;
    function within(scope, attr, id) {
      if (id == null) return scope;
      var all = scope ? scope.querySelectorAll("[" + attr + "]") : [];
      for (var i = 0; i < all.length; i++) if (all[i].getAttribute(attr) === id) return all[i];
      return null;
    }
    var own = $("main");
    if (mark.owner != null) {
      own = own.querySelectorAll("[data-owner-id]")[mark.ownerAt] || null;
      if (own && own.getAttribute("data-owner-id") !== mark.owner) own = null;
    }
    var scope = within(own, "data-threat-id", mark.threat);
    var el = scope ? scope.querySelectorAll(mark.sel)[mark.index] : null;
    // The action that was pressed has gone (nothing left to confirm): the
    // first treatment choice of the same card takes the focus.
    if (!el && own && /data-action/.test(mark.sel)) el = own.querySelector("[data-decision]");
    if (!el || typeof el.focus !== "function") return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    if (mark.caret != null && typeof el.setSelectionRange === "function") { try { el.setSelectionRange(mark.caret, mark.caret); } catch (e2) { /* not a text field */ } }
  }
  function rerender() { var m = $("main"), y = m.scrollTop, mark = focusMark(); render(); $("main").scrollTop = y; focusBack(mark); }

  // ---------- Render root ----------
  // The pages: js/ui-stages.js, js/ui-reports.js and js/ui-about.js. Three
  // more are drawn by the files that own them: js/review.js (peer),
  // js/report-page.js (report) and js/word-preview.js (wordpreview), all
  // loaded after the app.

  function render() {
    renderNav(); renderHeaderSummary();
    var main = $("main"); main.innerHTML = "";
    var fn = R.Pages[state.stage];
    (fn || R.Pages.suc)(main);
  }

  // ---------- Autosave restore ----------

  function offerRestore() {
    if (TOUR_MODE) return; // the demo replaces the project; don't offer (or risk) real work here
    var raw = null; try { raw = localStorage.getItem(AUTOSAVE_KEY); } catch (e) {}
    if (!raw) return;
    var snap; try { snap = JSON.parse(raw); } catch (e) { return; }
    if (!snap || !snap.project || !MG.accepts(snap.project.schema)) return;
    var pj = snap.project;
    // Offer to recover ANY substantive work — including a high-level-only or
    // basis-only session that has no zones yet (both are valid deliverables).
    if (!projectHasContent(pj)) return;
    var bar = h("div", { class: "autosave-bar no-print" }, [
      h("span", { class: "autosave-msg", text: "Found unsaved work from " + new Date(snap.savedOn).toLocaleString() + (pj.suc.name ? " (“" + pj.suc.name + "”)" : "") + "." }),
      h("button", { class: "btn sm primary", text: "Restore", onClick: function () { state.project = MG.normaliseProject(pj); state.stage = snap.stage || "suc"; document.body.removeChild(bar); render(); markDirty(); toast("Autosaved work restored."); } }),
      h("button", { class: "btn sm", text: "Discard", onClick: function () { try { localStorage.removeItem(AUTOSAVE_KEY); } catch (e) {} document.body.removeChild(bar); } })
    ]);
    document.body.appendChild(bar);
  }

  // ---------- Header wiring ----------

  function wireHeader() {
    $("btn-new").addEventListener("click", function () {
      if (dirty && projectHasContent(state.project) && !confirm("Start a new risk assessment? Unsaved changes will be lost. Save first if you want to keep them.")) return;
      state.project = M.emptyProject(); state.stage = "suc";
      // In tour mode the snapshot belongs to the consultant's real session.
      if (!TOUR_MODE) { try { localStorage.removeItem(AUTOSAVE_KEY); } catch (e) {} }
      // Forget the previous project's file so Save can't overwrite it with
      // this new, unrelated assessment — the first save will ask where to save.
      forgetProjectFile();
      render(); markClean(); toast("New risk assessment started.");
    });
    $("btn-save").addEventListener("click", saveProject); // Shift+click = Save as…
    $("btn-export").addEventListener("click", function () { R.Reports.exportRiskContext(); });
    $("btn-load").addEventListener("click", function () {
      if (supportsFilePickers() && typeof window.showOpenFilePicker === "function") loadViaPicker();
      else $("file-input").click();
    });
    $("file-input").addEventListener("change", function (ev) {
      var file = ev.target.files && ev.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        // A plain file input yields no handle: forget any previous one so Save
        // can't overwrite a DIFFERENT project's file with this one's content.
        if (loadProjectText(String(reader.result))) { forgetProjectFile(); noteRecentFile("open", file.name, null); }
      };
      reader.onerror = function () { toast("Could not read the file.", "err"); };
      reader.readAsText(file); ev.target.value = "";
    });
    // In the suite: reopening a file from its Recent files list. The bridge
    // hands over the file the consultant chose to reopen (and its handle,
    // when the browser kept one, so Save writes back to it); it goes through
    // the same checks as Load.
    if (window.App.HostBridge && window.App.HostBridge.hosted) {
      window.App.HostBridge.register({
        loadButton: "btn-load",
        applyTheme: U.applyTheme,
        openFile: function (file, handle) {
          var reader = new FileReader();
          reader.onload = function () {
            if (!loadProjectText(String(reader.result))) return;
            if (handle) { projectHandle = handle; persistHandle(handle); } else forgetProjectFile();
            noteRecentFile("open", file.name, handle);
          };
          reader.onerror = function () { toast("Could not read the file.", "err"); };
          reader.readAsText(file);
        },
        // The suite is closing this tool and the consultant chose to lose the
        // unsaved work: the crash-net copy goes too, so the tool does not
        // offer it when it is opened again. Only called with unsaved work,
        // and the copy is then this session's (each edit rewrites it).
        discardUnsaved: function () {
          clearTimeout(autosaveTimer);
          if (!TOUR_MODE) { try { localStorage.removeItem(AUTOSAVE_KEY); } catch (e) {} }
          markClean();
        }
      });
    }

    // Warn before leaving with unsaved work, and flush the crash-net first so a
    // confirmed leave (or a tab crash) can still be recovered on next open.
    // A tour is a demo: nothing to keep, so no warning.
    window.addEventListener("beforeunload", function (e) {
      if (TOUR_MODE) return;
      flushAutosave();
      if (dirty && projectHasContent(state.project)) { e.preventDefault(); e.returnValue = ""; return ""; }
    });
  }

  // ---------- Boot ----------

  function boot() {
    wireHeader();

    // The header badge: the suite version, then the alignment note.
    (function () {
      var badge = $("stage-badge");
      if (!badge) return;
      badge.textContent = VERSION.label + ", 62443-3-2-aligned";
      badge.title = VERSION.product + " version " + VERSION.number;
    })();

    U.setupThemeToggle();
    render();
    updateSaveButton();
    offerRestore();

    // ---------- Tour mode boot ----------
    // Load the completed demo project through the normal load path so every
    // guard and normaliser runs. The boot project is empty, so no confirm
    // fires; autosave is inert (see TOUR_MODE guards above).
    // The single-file build carries the demo inline (window.SPT_TOUR_PROJECT is
    // already set); the folder app loads it only when the tour is opened.
    if (TOUR_MODE && window.SPT_TOUR_PROJECT) {
      loadProjectText(JSON.stringify(window.SPT_TOUR_PROJECT));
    } else if (TOUR_MODE) {
      var tourScript = document.createElement("script");
      tourScript.src = "data/tour-project.js";
      tourScript.onload = function () {
        if (window.SPT_TOUR_PROJECT) loadProjectText(JSON.stringify(window.SPT_TOUR_PROJECT));
        else toast("Tour data missing (data/tour-project.js).", "err");
      };
      tourScript.onerror = function () { toast("Tour data (data/tour-project.js) failed to load.", "err"); };
      document.head.appendChild(tourScript);
    }

    // The facade. Calls that leave the project out mean the open one.
    var RP = R.Reports;
    window.RiskTool = {
      state: state,
      suggestZone: E.suggestZone, suggestConduit: E.suggestConduit,
      riskFor: E.riskFor, threatRisk: E.threatRisk, exceedsTolerable: E.exceedsTolerable,
      threatDisposition: function (owner, t, project) { return E.threatTreatment(owner, t, project && typeof project === "object" ? project : state.project).disposition; },
      residualRisk: E.residualRisk,
      threatTreatment: function (owner, t, project) { return E.threatTreatment(owner, t, project || state.project); },
      suggestTreatment: E.suggestTreatment, TREATMENT_LABEL: E.TREATMENT_LABEL,
      assetTypeLabel: E.assetTypeLabel, flagLabel: E.flagLabel,
      likelihoodName: E.likelihoodName, impactName: E.impactName,
      buildRiskContext: function (project) { return E.buildRiskContext(project || state.project); },
      exportProblems: function (project) { return E.exportProblems(project || state.project); },
      // Everything the outputs print per threat and per zone or conduit
      // (js/view-model.js), for the open project unless one is given.
      viewModel: function (project) { return R.ViewModel.build(project || state.project); },
      emptyZone: M.emptyZone, emptyConduit: M.emptyConduit, emptyThreat: M.emptyThreat,
      loadProjectText: loadProjectText, projectHasContent: projectHasContent,
      confirmRemove: U.confirmRemove, FR_IDS: FR_IDS,
      touched: touched, isDirty: function () { return dirty; }, flushAutosave: flushAutosave,
      downloadWordReport: RP.downloadWordReport, downloadExcelReport: RP.downloadExcelReport,
      offerRestore: offerRestore, AUTOSAVE_KEY: AUTOSAVE_KEY,
      saveProject: saveProject, forgetProjectFile: forgetProjectFile,
      supportsFilePickers: supportsFilePickers,
      render: render, toast: toast,
      // The published standard's ZCR lookup (data/zcr-map.json) and the
      // old-key-to-new-key map for report sections whose heading was reworded.
      zcrMap: M.ZCR, zcrOf: M.zcrOf, stageZcr: M.stageZcr, sectionKeyAlias: M.sectionKeyAlias
    };
  }

  return {
    state: state, TOUR_MODE: TOUR_MODE, AUTOSAVE_KEY: AUTOSAVE_KEY,
    touched: touched, markDirty: markDirty, markClean: markClean, isDirty: function () { return dirty; },
    flushAutosave: flushAutosave, saveProject: saveProject, loadProjectText: loadProjectText,
    forgetProjectFile: forgetProjectFile, supportsFilePickers: supportsFilePickers,
    render: render, rerender: rerender, renderHeaderSummary: renderHeaderSummary,
    offerRestore: offerRestore, boot: boot
  };
}());
