/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* app.js — the running tool: its state, the page loop and the project file.
 *
 * Holds the one state object ({ project, stage }), unsaved-changes tracking
 * and autosave, Save (in place where the browser allows) and Load (which
 * reopens the step last used), the sidebar (each entry's page id in
 * data-stage, and each step's status from the completeness list), the old
 * page ids, Go to an item of that list, Open the demo, the redraw that keeps
 * keyboard focus, and the header buttons.
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
  // Open the demo (Home) puts the running tool into tour mode without a
  // reload, which the exe and the suite's frame do not allow. It leaves again
  // on New or on loading a real file.
  var tourOpenedHere = false;

  // The sidebar, in order. Each entry is a page id (data-stage on the item);
  // the numbered steps follow IEC 62443-3-2:2020's order. "slt" is part of
  // step 5 (a tab on its page), and two old ids open the Report page:
  // hlreport (the high-level summary) and wordpreview (the Word pages).
  var NAV = [
    { id: "home",    label: "Home" },
    { id: "basis",   label: "Engagement and evidence" },
    { sep: true },
    { id: "suc",     num: "1", label: "Scope and risk criteria" },
    { id: "srs",     num: "2", label: "High-level risk" },
    { id: "zones",   num: "3", label: "Zones and conduits" },
    { id: "compare", num: "4", label: "Risk comparison" },
    { id: "risk",    num: "5", label: "Detailed risk", also: ["slt"] },
    { id: "spec",    num: "6", label: "Requirements specification" },
    { id: "approval", num: "7", label: "Approval" },
    { sep: true },
    { id: "report",  label: "Report" },
    { id: "review",  label: "Check and issue" },
    { id: "peer",    label: "Peer review" },
    { sep: true },
    { id: "about",   label: "About" }
  ];
  var STAGE_IDS = ["home", "basis", "suc", "srs", "zones", "compare", "risk", "slt", "spec", "approval", "report", "review", "peer", "about"];
  var STAGE_ALIASES = ["hlreport", "wordpreview"];

  var state = { project: M.emptyProject(), stage: "home" };
  // The page the open project was loaded or started on: lastStage is written
  // on Save only once the consultant has moved off it, or the file had one,
  // so a file loaded and saved again comes back as it was.
  var openedAt = "home";

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
    // Load reopens the page this was saved on.
    if (state.project.lastStage != null || state.stage !== openedAt) state.project.lastStage = state.stage;
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

    // The demo never writes over a real project's file: it always asks where.
    if (saveAs || TOUR_MODE) { pick(); return; }
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
  // opts.demo: the demo, opened from Home (already asked).
  function loadProjectText(text, opts) {
    opts = opts || {};
    var data;
    try { data = JSON.parse(text); }
    catch (e) { toast("Not a valid JSON file.", "err"); return false; }
    if (!data || !MG.accepts(data.schema)) {
      toast("Unrecognised file: expected " + M.ACCEPTED_PROJECT_SCHEMAS.join(" or ") + ", got " + (data && data.schema ? data.schema : "none") + ".", "err");
      return false;
    }
    if (!opts.demo && projectHasContent(state.project)) {
      var incoming = (data.suc && data.suc.name) ? "“" + data.suc.name + "”" : "this project";
      if (!confirm("Load " + incoming + "? Unsaved changes to the current assessment will be lost. Save first if you want to keep them.")) return false;
    }
    // A real file, opened while the demo is open from Home: the tool leaves
    // the demo, and autosave works again. The autosave copy still holds the
    // real work the demo kept: it is offered back, and not written over.
    var leftDemo = false;
    if (!opts.demo && tourOpenedHere) { TOUR_MODE = false; tourOpenedHere = false; leftDemo = true; }
    state.project = MG.normaliseProject(data);
    state.stage = knownStage(state.project.lastStage) ? state.project.lastStage : "home";
    openedAt = state.stage;
    clearGuard();
    render(); if (!leftDemo) writeAutosave(); markClean();
    toast(opts.demo ? "The demo is open. Autosave is off." : "Risk project loaded.");
    if (leftDemo) offerRestore({ forgetFile: true });
    return true;
  }
  // A question waiting before a download belongs to the project it was asked about.
  function clearGuard() { if (R.Reports && R.Reports.clearGuard) R.Reports.clearGuard(); }
  function knownStage(id) { return typeof id === "string" && (STAGE_IDS.indexOf(id) >= 0 || STAGE_ALIASES.indexOf(id) >= 0) && !!(R.Pages[id] || STAGE_ALIASES.indexOf(id) >= 0); }

  // Home's Open the demo: the completed demo project, in tour mode, in this
  // window. The single-file build carries it inline; the folder app loads it.
  function openDemo() {
    if (TOUR_MODE) { navigate("home"); return; }
    if (dirty && projectHasContent(state.project) && !confirm("Open the demo? Save first to keep unsaved changes in a file.")) return;
    flushAutosave();
    function go() {
      if (!window.SPT_TOUR_PROJECT) { toast("Tour data missing (data/tour-project.js).", "err"); return; }
      TOUR_MODE = true; tourOpenedHere = true;
      projectHandle = null;   // only in memory: Save in the demo always asks where
      loadProjectText(JSON.stringify(window.SPT_TOUR_PROJECT), { demo: true });
      updateSaveButton();
    }
    if (window.SPT_TOUR_PROJECT) { go(); return; }
    var s = document.createElement("script");
    s.src = "data/tour-project.js";
    s.onload = go;
    s.onerror = function () { toast("Tour data (data/tour-project.js) failed to load.", "err"); };
    document.head.appendChild(s);
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

  // A count beside a step: evidence rows, zones, threats.
  function stageBadge(id) {
    var p = state.project;
    if (id === "basis") { var b = p.basisOfAssessment, nb = b.interviews.length + b.documents.length + b.observations.length; return nb ? String(nb) : null; }
    if (id === "zones" && p.zones.length) return String(p.zones.length);
    var owners = p.zones.concat(p.conduits);
    if (id === "risk") { var n = owners.reduce(function (a, o) { return a + o.threats.length; }, 0); return n ? String(n) : null; }
    return null;
  }
  // How many zones and conduits have an SL-T set, of all of them: the SL-T
  // tab of step 5 shows it.
  function sltCount() {
    var p = state.project, owners = p.zones.concat(p.conduits);
    if (!p.zones.length) return null;
    return owners.filter(function (o) { return FR_IDS.some(function (fr) { return o.slTargetByFR[fr] != null; }); }).length + "/" + owners.length;
  }

  // focus: where the keyboard focus goes on the new page. "nav" is the
  // sidebar's active entry (the sidebar started it), a selector is a control
  // in the page (a tab), and otherwise it is the page's heading.
  function navigate(stage, focus) {
    state.stage = stage;
    render();
    var m = $("main"); if (m) m.scrollTop = 0;
    focusAfter(focus);
  }
  function focusEl(el) {
    if (!el || typeof el.focus !== "function") return false;
    if (!/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    return document.activeElement === el;
  }
  function pageHeading() {
    var hs = $("main").querySelectorAll("h1.page-title");
    for (var i = 0; i < hs.length; i++) if (!hs[i].closest(".print-only")) return hs[i];
    return null;
  }
  function focusAfter(focus) {
    var el = null;
    if (focus === "nav") el = document.querySelector("#sidebar .nav-item.active");
    else if (focus) el = $("main").querySelector(focus);
    if (!focusEl(el)) focusEl(pageHeading());
  }

  function renderNav() {
    var sb = $("sidebar"); sb.innerHTML = "";
    var sec = h("div", { class: "nav-section" });
    var status = E.stepStatus(state.project);
    NAV.forEach(function (s) {
      if (s.sep) { sec.appendChild(h("div", { class: "nav-sep", role: "separator" })); return; }
      var st = status[s.id] || null, badge = stageBadge(s.id);
      var on = state.stage === s.id || (s.also && s.also.indexOf(state.stage) >= 0);
      var item = h("div", {
        class: "nav-item" + (on ? " active" : ""), "data-stage": s.id, role: "button", tabindex: "0",
        "aria-current": on ? "page" : "false",
        onClick: function () { navigate(s.id, "nav"); }
      }, [
        h("span", { class: "nav-label" }, [
          s.num ? h("span", { class: "nav-num", text: s.num }) : null,
          (s.num ? " " : "") + s.label,
          st ? h("span", { class: "nav-status", "data-status": st.state, text: st.text }) : null
        ]),
        badge ? h("span", { class: "badge", text: badge }) : null
      ]);
      item.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(s.id, "nav"); } });
      sec.appendChild(item);
    });
    sb.appendChild(sec);
    sb.appendChild(h("div", { class: "sidebar-legal", title: U.LEGAL_NOTICE, text: U.LEGAL_SHORT }));
  }

  // Go to the place an item of the completeness list is fixed (js/engine.js
  // completeness): its page, scrolled to its zone, conduit, threat, ranked
  // system or card, which flashes.
  function flash(el) {
    if (el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("check-flash");
    void el.offsetWidth;
    el.classList.add("check-flash");
    setTimeout(function () { el.classList.remove("check-flash"); }, 2200);
  }
  function attrSel(name, v) { return "[" + name + '="' + String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"]'; }
  function goToItem(item) {
    var t = (item && item.target) || {};
    // Step 3 shows one zone or conduit at a time: the one named is opened.
    if (item.stage === "zones" && R.ZonesPage) R.ZonesPage.select(t.kind, t.id);
    navigate(item.stage);
    var main = $("main"), el = null;
    if (t.kind === "zone" || t.kind === "conduit") el = main.querySelector(attrSel("data-owner-id", t.id));
    else if (t.kind === "threat") {
      var own = main.querySelector(attrSel("data-owner-id", t.ownerId));
      el = own ? (own.querySelector(attrSel("data-threat-id", t.id)) || own) : null;
    } else if (t.kind === "system") el = main.querySelector(attrSel("data-hla-id", t.id));
    else if (t.kind === "spec") el = main.querySelector(attrSel("data-check-anchor", "spec-" + t.id));
    else if (t.kind === "approval" && t.id != null) el = main.querySelector(attrSel("data-approval", t.id)) || main.querySelector(attrSel("data-check-anchor", "approval"));
    else if (t.kind) el = main.querySelector(attrSel("data-check-anchor", t.kind));
    // A part of the item, such as one separation row of a zone.
    if (el && t.part) el = el.querySelector(attrSel("data-part", t.part)) || el;
    // The keyboard lands on the item too, not only the eye: on one approver,
    // on what settles it (Approved again, or the Approved tick).
    var key = el && t.kind === "approval" && t.id != null ? (el.querySelector('[data-action="approved-again"]') || el.querySelector('[data-approval-field="approved"]')) : null;
    if (el) { flash(el); if (!focusEl(key)) focusEl(el); }
    return el;
  }

  // A redraw rebuilds the page, so the control that had keyboard focus is
  // found again afterwards: by its zone or conduit (its card's place on the
  // page, checked against its id), its threat, and what it is (a treatment
  // choice, a reason field, a card action; a list by its place, which a
  // redraw does not change).
  function focusMark() {
    var el = document.activeElement, main = $("main");
    if (!el || !main || el === main || !main.contains(el) || !el.getAttribute) return null;
    // The owner: a zone or conduit, or a ranked system's row (data-hla-id).
    var key = el.closest("[data-owner-id]") ? "data-owner-id" : "data-hla-id";
    var own = el.closest("[" + key + "]"), thr = el.closest("[data-threat-id]"), sel = null, index = 0;
    ["data-decision", "data-detailed", "data-reason", "data-action", "data-assessment-type", "data-view", "data-doc", "data-separation", "data-marker", "data-end", "data-approval-field", "data-flag", "data-asset-name"].forEach(function (a) {
      if (!sel && el.getAttribute(a)) sel = "[" + a + '="' + el.getAttribute(a) + '"]';
    });
    if (!sel && el.tagName === "SELECT") { sel = "select"; index = Array.prototype.indexOf.call((thr || own || main).querySelectorAll("select"), el); }
    // Anything else that takes the keyboard, by its place among those of its
    // card: a redraw that adds or removes nothing puts it back where it was.
    if (!sel && el.matches && el.matches(FOCUSABLE)) { sel = FOCUSABLE; index = Array.prototype.indexOf.call((thr || own || main).querySelectorAll(FOCUSABLE), el); }
    if (!sel) return null;
    return { key: key, owner: own ? own.getAttribute(key) : null, ownerAt: own ? Array.prototype.indexOf.call(main.querySelectorAll("[" + key + "]"), own) : -1,
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
      own = own.querySelectorAll("[" + mark.key + "]")[mark.ownerAt] || null;
      if (own && own.getAttribute(mark.key) !== mark.owner) own = null;
    }
    var scope = within(own, "data-threat-id", mark.threat);
    var el = scope ? scope.querySelectorAll(mark.sel)[mark.index] : null;
    // The action that was pressed has gone (nothing left to confirm): the
    // first treatment choice of the same card takes the focus, or, for an
    // action outside a card (step 4's Confirm suggested), the page's first
    // decision.
    if (!el && /data-action/.test(mark.sel)) el = (own || $("main")).querySelector("[data-decision], [data-detailed]");
    if (!el || typeof el.focus !== "function") return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    if (mark.caret != null && typeof el.setSelectionRange === "function") { try { el.setSelectionRange(mark.caret, mark.caret); } catch (e2) { /* not a text field */ } }
  }
  function rerender() { clearTimeout(soonTimer); var m = $("main"), y = m.scrollTop, mark = focusMark(); render(); $("main").scrollTop = y; focusBack(mark); }
  var FOCUSABLE = "a[href], button, input, select, textarea, summary, [tabindex]";
  // A redraw once the focus has moved on: a field left with Tab redraws after
  // the keyboard has reached the next control, which the redraw then keeps.
  var soonTimer = null;
  function rerenderSoon() { clearTimeout(soonTimer); soonTimer = setTimeout(function () { soonTimer = null; rerender(); }, 0); }
  // A field that redraws the page when it changes. Left with Tab, the redraw
  // waits for the focus to arrive; otherwise (Enter, a script) it is at once,
  // and the field keeps the focus.
  function changeRedraw(el) {
    var tab = false;
    el.addEventListener("keydown", function (e) { tab = e.key === "Tab"; });
    el.addEventListener("change", function () { if (tab) { tab = false; rerenderSoon(); } else rerender(); });
    return el;
  }
  // The step status in the sidebar, after an edit that does not redraw the
  // page (typing in a field). Left alone while the keyboard is in the sidebar.
  function refreshNav() {
    var sb = $("sidebar");
    if (!sb || sb.contains(document.activeElement)) return;
    renderNav();
  }

  // ---------- Render root ----------
  // The pages: js/ui-stages.js, js/ui-reports.js and js/ui-about.js. Three
  // more are drawn by the files that own them: js/review.js (peer),
  // js/report-page.js (report) and js/word-preview.js (wordpreview), all
  // loaded after the app.

  // An old page id that now opens another page (hlreport, wordpreview): the
  // page that registered it (js/ui-reports.js) sets what to show and names
  // the page it opens.
  R.StageAliases = R.StageAliases || {};
  function render() {
    var alias = R.StageAliases[state.stage];
    if (alias) state.stage = alias();
    if (!R.Pages[state.stage]) state.stage = "home";
    renderNav(); renderHeaderSummary();
    var main = $("main"); main.innerHTML = "";
    R.Pages[state.stage](main);
    // The question before a download, when one is waiting on this page.
    if (R.Reports && R.Reports.drawGuard) R.Reports.drawGuard(main);
  }

  // ---------- Autosave restore ----------

  // opts.forgetFile: the file open now is not the restored work's, so a
  // restore forgets it and Save asks where.
  function offerRestore(opts) {
    opts = opts || {};
    if (TOUR_MODE) return; // the demo replaces the project; don't offer (or risk) real work here
    var old = document.querySelector(".autosave-bar"); if (old && old.parentNode) old.parentNode.removeChild(old);
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
      h("button", { class: "btn sm primary", text: "Restore", onClick: function () {
        state.project = MG.normaliseProject(pj); state.stage = knownStage(snap.stage) ? snap.stage : "home"; openedAt = state.stage;
        if (opts.forgetFile) forgetProjectFile();
        clearGuard();
        document.body.removeChild(bar); render(); markDirty(); toast("Autosaved work restored.");
      } }),
      h("button", { class: "btn sm", text: "Discard", onClick: function () { try { localStorage.removeItem(AUTOSAVE_KEY); } catch (e) {} document.body.removeChild(bar); } })
    ]);
    document.body.appendChild(bar);
  }

  // ---------- Header wiring ----------

  function wireHeader() {
    $("btn-new").addEventListener("click", function () {
      if (dirty && projectHasContent(state.project) && !confirm("Start a new risk assessment? Unsaved changes will be lost. Save first if you want to keep them.")) return;
      state.project = M.emptyProject(); state.stage = "home"; openedAt = "home";
      clearGuard();
      // In tour mode the snapshot belongs to the consultant's real session.
      var leftDemo = tourOpenedHere;
      if (!TOUR_MODE) { try { localStorage.removeItem(AUTOSAVE_KEY); } catch (e) {} }
      // New from a demo opened on Home leaves the demo: autosave works again,
      // and the real work it kept is offered back.
      if (tourOpenedHere) { TOUR_MODE = false; tourOpenedHere = false; }
      // Forget the previous project's file so Save can't overwrite it with
      // this new, unrelated assessment — the first save will ask where to save.
      forgetProjectFile();
      render(); markClean(); toast("New risk assessment started.");
      if (leftDemo) offerRestore();
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
      zcrMap: M.ZCR, zcrOf: M.zcrOf, stageZcr: M.stageZcr, sectionKeyAlias: M.sectionKeyAlias,
      // The pages and their status (phase 3a): the sidebar's page ids, going
      // to one, each step's status, the one completeness list and a report's
      // part of it, and opening the place an item of it is fixed.
      STAGE_IDS: STAGE_IDS.slice(), navigate: navigate,
      stepStatus: function (project) { return E.stepStatus(project || state.project); },
      completeness: function (project) { return E.completeness(project || state.project); },
      readiness: function (doc, project) { return E.readiness(project || state.project, doc); },
      goToItem: goToItem,
      // The risk comparison (step 4) and the ranked systems a zone holds.
      initialRiskOf: function (owner, project) { return E.initialRiskOf(owner, project || state.project); },
      comparison: function (owner, project) { return E.comparison(owner, project || state.project); },
      hlaComparison: function (a, project) { return E.hlaComparison(a, project || state.project); },
      hlaIdsOf: M.hlaIdsOf, assessmentType: function (project) { return M.assessmentType(project || state.project); },
      openDemo: openDemo, isTour: function () { return TOUR_MODE; },
      // Phase 3b: the confirmed tolerable risk, a zone's separation rows, the
      // asset paste, the specification's blocks and the approvals.
      tolerableConfirmed: function (project) { return M.tolerableConfirmed(project || state.project); },
      separationRows: function (zone, project) { return E.separationRows(zone, project || state.project); },
      conduitExternal: E.conduitExternal, parseAssets: E.parseAssets, assetLinkLabel: E.assetLinkLabel, zoneSafety: E.zoneSafety,
      specBlocks: function (project) { return E.specBlocks(project || state.project); },
      approvalsOf: function (project) { return M.approvalsOf(project || state.project); },
      approvalFingerprint: function (project) { return E.approvalFingerprint(project || state.project); },
      approvalStates: function (project) { return E.approvalStates(project || state.project); },
      approvalChangedFor: E.approvalChangedFor, approvalPartWords: E.approvalPartWords,
      zcrSpecBlocks: M.ZCR.specBlocks || null
    };
  }

  return {
    state: state, TOUR_MODE: TOUR_MODE, isTour: function () { return TOUR_MODE; }, AUTOSAVE_KEY: AUTOSAVE_KEY,
    touched: touched, markDirty: markDirty, markClean: markClean, isDirty: function () { return dirty; },
    flushAutosave: flushAutosave, saveProject: saveProject, loadProjectText: loadProjectText,
    forgetProjectFile: forgetProjectFile, supportsFilePickers: supportsFilePickers,
    render: render, rerender: rerender, rerenderSoon: rerenderSoon, changeRedraw: changeRedraw, refreshNav: refreshNav, renderHeaderSummary: renderHeaderSummary,
    navigate: navigate, focusAfter: focusAfter, goToItem: goToItem, flash: flash, sltCount: sltCount, openDemo: openDemo,
    offerRestore: offerRestore, boot: boot
  };
}());
