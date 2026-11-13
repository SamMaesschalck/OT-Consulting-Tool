/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* app.js: App.DocApp, the shell of the OT Cyber Document Tool, and
 * window.DocumentTool, the test seam (docs/document-tool-design.md 5.2, 5.9).
 *
 * The shell owns the one open document, which page is showing, the header
 * buttons, the sidebar (pages and outline), the notices above the page,
 * unsaved work and its guard, and the suite bridge. It draws no page of its
 * own: App.DocPages draws every page but Edit into #main, and App.DocEditor
 * owns #edit-view. Both are reached by the signatures in the design only.
 *
 * File handles, which is the part that can lose somebody's work, follow one
 * rule (5.9): a handle is adopted only for a project file the user chose, once
 * it has loaded; everything else forgets the handle there was, so the first
 * Save asks where to save. An import never sees the Word file's handle at all.
 */
(function () {
  "use strict";

  var A = window.App, M = A.DocModel, S = A.DocStorage, V = A.Version || {};
  var HB = function () { return A.HostBridge && A.HostBridge.hosted ? A.HostBridge : null; };

  var LEGAL_SHORT = "© 2026 SolutionsPT. All rights reserved.";
  // The tour opens the demo by itself. A tour's changes are not kept, not
  // reported as unsaved and not put in Recent files.
  var TOUR_MODE = /[?&]tour(=|&|$)/.test(location.search) || !!(A.HostBridge && A.HostBridge.launch && A.HostBridge.launch.tour);
  var PAGES = ["info", "edit", "preview", "issue", "report", "about", "welcome"];
  var PAGE_NAMES = { welcome: "Start", info: "Document information", edit: "Edit", preview: "Preview", issue: "Issue and export", report: "Import report", about: "About" };
  // The page a document opens on, by how it arrived.
  var FIRST_PAGE = { "new": "info", file: "edit", "import": "report", autosave: "edit", tour: "edit" };

  var state = { doc: null, page: "welcome", dirty: false, tour: false, recovered: false };
  // The shell's own notes, which no other file needs.
  var ui = {
    offer: null,        // unsaved work found in this browser, on offer: { id, title, time }
    lastSave: null,     // { name, how, at } of the last save of the open document
    fileName: "",       // the file the open document was loaded from or saved to
    mounted: null,      // the document the editor is showing
    mountKey: "",       // its kind and options when the editor was mounted
    passed: null,       // the unsaved-changes question has been answered for the load in hand
    warned: null,       // the id of the document the size warning has been shown for
    outlineKey: ""      // what the outline shows, so it is drawn again only when it changes
  };

  // ---------- DOM helpers ----------
  function $(id) { return document.getElementById(id); }
  // attrs: text, class and value set properties; onClick, onInput and so on
  // add listeners; true sets an empty attribute; null and false are left
  // out. Children are nodes or strings, and strings become text nodes: no
  // markup is ever parsed.
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") el.textContent = v;
      else if (k === "class") el.className = v;
      else if (k === "value") el.value = v;
      else if (/^on[A-Z]/.test(k) && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    (Array.isArray(kids) ? kids : kids == null ? [] : [kids]).forEach(function (c) {
      if (c == null || c === false) return;
      el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    });
    return el;
  }
  function focusOn(el) {
    if (!el) return false;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    return document.activeElement === el;
  }
  function cssEsc(v) { v = String(v == null ? "" : v); return window.CSS && window.CSS.escape ? window.CSS.escape(v) : v.replace(/["\\]/g, "\\$&"); }
  function fmtWhen(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + " at " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  function fmtTime(when) {
    var d = new Date(when);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  function mb(bytes) { return Math.round(bytes / 1048576); }
  function titleOf(doc) { return String((doc && doc.info && doc.info.title) || "").trim() || "Untitled document"; }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // ---------- messages ----------
  // action (optional): { label, run } adds one button, such as Undo, and
  // keeps the message up longer so there is time to press it.
  var toastTimer = null;
  function hideToast() { clearTimeout(toastTimer); $("toast").className = "toast hidden"; }
  function toast(text, kind, action) {
    var t = $("toast");
    t.textContent = String(text == null ? "" : text);
    if (action && typeof action.run === "function") {
      t.appendChild(h("button", { type: "button", class: "doc-toast-act", text: action.label || "Undo", onClick: function () { hideToast(); action.run(); } }));
    }
    t.className = "toast" + (kind ? " " + kind : "");
    clearTimeout(toastTimer);
    // Long enough to read: a message of several sentences (what a paste left
    // out, what an export made smaller) stays up longer than a short one,
    // at about 15 characters a second, up to 20 seconds.
    var read = Math.min(20000, Math.max(4200, t.textContent.length * 65));
    (function wait(ms) {
      toastTimer = setTimeout(function () { if (t.contains(document.activeElement)) wait(1500); else hideToast(); }, ms);
    })(action ? Math.max(8000, read) : read);
  }
  // The same words twice in a row are still said twice.
  function say(text) {
    var live = $("live");
    live.textContent = "";
    setTimeout(function () { live.textContent = String(text == null ? "" : text); }, 30);
  }

  // ---------- dialogs ----------
  // In the page, never confirm(): that blocks a headless run and looks
  // foreign in the exe. build(m) returns the dialog's children; m.close()
  // shuts it and m.cancel() shuts it and calls onCancel. Escape and a click
  // outside cancel. The keyboard goes into it when it opens (its first field,
  // else its main button, which in every dialog here is the one that loses
  // nothing), Tab stays inside it, and closing it puts the keyboard back.
  function modal(label, build, onCancel, cls) {
    var host = $("modal"), back = null, box = null, opener = document.activeElement, shut = false;
    function stops() {
      return Array.prototype.filter.call(box.querySelectorAll("button, input, select, textarea, a[href]"), function (el) { return !el.disabled; });
    }
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); m.cancel(); return; }
      if (e.key !== "Tab") return;
      var list = stops(), at = list.indexOf(document.activeElement);
      if (!list.length) { e.preventDefault(); return; }
      if (at === -1 || (e.shiftKey && at === 0) || (!e.shiftKey && at === list.length - 1)) {
        e.preventDefault();
        focusOn(list[e.shiftKey ? list.length - 1 : 0]);
      }
    }
    var m = {
      close: function () {
        if (shut) return;
        shut = true;
        if (back.parentNode) back.parentNode.removeChild(back);
        if (!host.firstChild) host.classList.add("hidden");
        document.removeEventListener("keydown", onKey, true);
        // The page may have been drawn again while it was up.
        if (opener && opener !== document.body && opener.isConnected) focusOn(opener);
      },
      cancel: function () { if (shut) return; m.close(); if (onCancel) onCancel(); }
    };
    box = h("div", { class: "doc-modal" + (cls ? " " + cls : ""), role: "dialog", "aria-modal": "true", "aria-label": label }, build(m));
    back = h("div", { class: "doc-modal-back" }, [box]);
    back.addEventListener("mousedown", function (e) { if (e.target === back) m.cancel(); });
    document.addEventListener("keydown", onKey, true);
    host.appendChild(back);
    host.classList.remove("hidden");
    focusOn(box.querySelector("input, textarea, select") || box.querySelector(".btn.primary") || box.querySelector("button"));
    return m;
  }
  // Resolves true for the ok button and false for cancel, Escape or a click
  // outside. o: { title, text, ok, cancel, danger }.
  function confirmBox(o) {
    o = o || {};
    return new Promise(function (resolve) {
      modal(o.title || "Are you sure?", function (m) {
        return [
          h("h2", { text: o.title || "Are you sure?" }),
          o.text ? h("p", { text: o.text }) : null,
          h("div", { class: "btn-row" }, [
            h("button", { type: "button", class: "btn", "data-act": "cancel", text: o.cancel || "Cancel", onClick: function () { m.cancel(); } }),
            h("button", { type: "button", class: "btn " + (o.danger ? "danger" : "primary"), "data-act": "ok", text: o.ok || "OK", onClick: function () { m.close(); resolve(true); } })
          ])
        ];
      }, function () { resolve(false); });
    });
  }
  // A panel over the page while something long runs. busy(label) shows it,
  // busy(label, 0.4) shows how far it has got, busy(null) takes it away.
  var busyEl = null;
  function busy(label, fraction) {
    if (label == null || label === false || label === "") {
      if (busyEl && busyEl.parentNode) busyEl.parentNode.removeChild(busyEl);
      busyEl = null;
      return;
    }
    if (!busyEl) {
      busyEl = h("div", { class: "doc-busy-back" }, [h("div", { class: "doc-busy", role: "status", "aria-live": "polite" }, [
        h("div", { class: "doc-busy-label" }), h("progress", { max: "1" })
      ])]);
      document.body.appendChild(busyEl);
    }
    var text = busyEl.querySelector(".doc-busy-label"), bar = busyEl.querySelector("progress");
    if (text.textContent !== String(label)) text.textContent = String(label);
    // With no value the bar shows that work is going on, not how much.
    if (typeof fraction === "number" && isFinite(fraction)) bar.value = Math.max(0, Math.min(1, fraction));
    else bar.removeAttribute("value");
  }

  // ---------- theme ----------
  function currentTheme() { return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    lsSet("ot-theme", theme);
    var btn = $("btn-theme"), dark = theme === "dark";
    btn.textContent = dark ? "☀ Light" : "☾ Dark";
    btn.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
  }

  // ---------- unsaved work ----------
  function updateHeader() {
    // A tour's work is never kept, so the suite does not warn about it on close.
    if (A.HostBridge) A.HostBridge.setDirty(state.dirty && !state.tour);
    var b = $("btn-save");
    b.textContent = state.dirty ? "Save*" : "Save";
    b.classList.toggle("btn-unsaved", state.dirty);
    b.title = "Save your document file (Shift+click: Save as)" +
      (ui.lastSave ? ". Last saved to " + ui.lastSave.name + " at " + fmtTime(ui.lastSave.at) + "." : "");
    if (state.doc) b.removeAttribute("disabled"); else b.setAttribute("disabled", "");
    var where = !state.doc ? "" : state.tour ? "tour" : state.dirty ? "unsaved changes"
      : ui.fileName ? ui.fileName : "not saved yet";
    var text = state.doc ? titleOf(state.doc) + " · " + where : "";
    var ss = $("save-state");
    if (ss.textContent !== text) { ss.textContent = text; ss.title = text; }
  }
  function markClean() { state.dirty = false; updateHeader(); }
  // Counts every change to the document. A save compares it with what it was
  // when the text was taken for the file: a change made while the file was
  // being written is not in it, and must not be called saved.
  var rev = 0;
  var refreshTimer = null;
  // what: { blocks: [ids] }, { info: true }, { structure: true } or
  // { media: [keys] } (parts: [keys] is taken too). Called on every change to
  // the document, typing included, so it does next to nothing itself: the
  // badge and the outline follow on a short delay.
  function touched(what) {
    if (!state.doc) return;
    what = what || {};
    rev++;
    if (!state.tour) {
      if (!state.dirty) { state.dirty = true; updateHeader(); }
      S.autosave.note(state.doc, what);
    }
    if (what.media || what.parts) warnSize();
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refresh, 150);
  }
  function refresh() {
    clearTimeout(refreshTimer);
    if (!state.doc) return;
    if (state.recovered && !M.missing(state.doc).length) state.recovered = false;
    syncBadge(); renderOutline(); renderNotices(); updateHeader();
  }

  // ---------- size ----------
  // Limits apply where bytes come in, never at Save (3.5).
  function warnSize() {
    var doc = state.doc;
    if (!doc || ui.warned === doc.id) return;
    var size = M.sizeOf(doc);
    if (size <= M.LIMITS.warnBytes) return;
    ui.warned = doc.id;
    toast("The pictures and kept content in this document are over " + mb(M.LIMITS.warnBytes) + " MB (" + mb(size) +
      " MB). It still saves, but nothing more can be added past " + mb(M.LIMITS.refuseBytes) + " MB.", "warn");
  }
  function canAdd(bytes) {
    if (!state.doc) return false;
    if (M.sizeOf(state.doc) + (Number(bytes) || 0) <= M.LIMITS.refuseBytes) return true;
    toast("Not added: the pictures and kept content in this document would go over " + mb(M.LIMITS.refuseBytes) + " MB.", "err");
    return false;
  }

  // ---------- the guard ----------
  // Resolves "clean" (nothing to lose), "saved", "discard" or false (stay).
  function guard() {
    if (!state.doc || !state.dirty || state.tour) return Promise.resolve("clean");
    return new Promise(function (resolve) {
      modal("Unsaved changes", function (m) {
        return [
          h("h2", { text: "Save your changes first?" }),
          h("p", { text: titleOf(state.doc) + " has changes that are not in a file." }),
          h("div", { class: "btn-row" }, [
            h("button", { type: "button", class: "btn", "data-act": "cancel", text: "Cancel", onClick: function () { m.cancel(); } }),
            h("button", { type: "button", class: "btn danger", "data-act": "discard", text: "Discard changes", onClick: function () { m.close(); resolve("discard"); } }),
            h("button", { type: "button", class: "btn primary", "data-act": "save", text: "Save", onClick: function (e) {
              m.close();
              save({ saveAs: !!(e && e.shiftKey) }).then(function (res) { resolve(res ? "saved" : false); });
            } })
          ])
        ];
      }, function () { resolve(false); });
    });
  }

  // ---------- opening a document ----------
  // Replaces the open document. o.from is "new", "file", "import",
  // "autosave" or "tour"; with "file", o.handle is the handle the user chose
  // it by (if any) and o.name its file name. Resolves false when the user
  // chose to stay with the document they had.
  function setDoc(doc, o) {
    o = o || {};
    var from = FIRST_PAGE[o.from] ? o.from : "file";
    var asked = ui.passed ? Promise.resolve(ui.passed) : guard();
    ui.passed = null;
    return asked.then(function (answer) {
      if (!answer) return false;
      var old = state.doc;
      if (old) {
        M.releaseUrls(old);
        // The copy of a document closed with nothing unsaved, or whose
        // changes were just given up, is no longer wanted. One still on
        // offer is the user's to answer for.
        if (!state.tour && old.id !== doc.id && !(ui.offer && ui.offer.id === old.id) && (!state.dirty || answer === "discard")) {
          S.autosave.discard(old.id);
        }
      }
      if (ui.mounted) { A.DocEditor.unmount(); ui.mounted = null; }
      A.DocHistory.clear();
      state.doc = doc;
      state.tour = from === "tour";
      state.recovered = from === "autosave" && M.missing(doc).length > 0;
      // An import and a restored copy are in no file yet.
      state.dirty = from === "import" || from === "autosave";
      if (!(from === "file" && o.handle && S.adopt(o.handle, doc.id))) S.forget();
      ui.fileName = from === "file" ? String(o.name || "") : "";
      ui.lastSave = null; ui.outlineKey = ""; ui.warned = null;
      // Other windows of the tool are told this document is open here, so its
      // autosave copy is neither cleared nor offered there as crashed work.
      S.autosave.own(state.tour ? null : doc.id);
      if (from === "file") S.autosave.note(doc, { all: true, clean: true });
      else if (from === "import") S.autosave.note(doc, { all: true });
      warnSize();
      go(FIRST_PAGE[from]);
      return true;
    });
  }
  function newDocument(kind) { return setDoc(M.create(kind || "report"), { from: "new" }); }

  // What a JSON file of another tool is, and where it opens.
  function foreignMessage(name, err) {
    var f = err && err.foreign, s = f ? String(f.schema || "") : "";
    if (!f) return name + " was not opened. " + ((err && err.message) || "");
    if (/^spt-review-pack\//.test(s)) return name + " is a review pack. Open it in the OT Cyber Report Review Tool.";
    if (/^spt-review\//.test(s)) return name + " is a review file. Open it in the OT Cyber Report Review Tool, or import it in the tool the report came from.";
    if (/^spt-risk-project\//.test(s)) return name + " is a risk assessment project file. Open it in the OT Cyber Risk Assessment Tool.";
    if (/^spt-risk-context\//.test(s)) return name + " is a risk context file. Import it in the OT Cyber Assessment Tool.";
    if (!s && f.schemaVersion) return name + " is an assessment project file. Open it in the OT Cyber Assessment Tool.";
    return name + " is not a document file.";
  }
  function loadText(name, text, handle) {
    var doc;
    name = String(name || "file.json");
    try { doc = M.fromText(text); }
    catch (e) { toast(foreignMessage(name, e), "err"); return Promise.resolve(false); }
    return setDoc(doc, { from: "file", handle: handle || null, name: name }).then(function (opened) {
      if (!opened) return false;
      toast("Opened " + name + ".");
      noteRecent("open", name, S.currentName() ? handle : null);
      return true;
    });
  }
  // A Word file starts an import. The question about unsaved changes is asked
  // before the file is read, not after; the import is given the file and
  // never its handle.
  function importWord(file) {
    return guard().then(function (answer) {
      if (!answer) return false;
      ui.passed = answer;
      return Promise.resolve(A.DocImportFlow.start(file)).then(function (opened) {
        ui.passed = null;
        return opened !== false;
      }, function (e) {
        ui.passed = null;
        busy(null);
        toast((e && e.message) || "The Word file could not be read.", "err");
        return false;
      });
    });
  }
  var TEXT_MAX = 500 * 1048576;
  var OLD_WORD ="is an old Word file (.doc), which cannot be read. In Word, use Save as and choose Word Document (.docx), then load that.";
  function loadFile(file, handle) {
    if (!file) return Promise.resolve(false);
    var name = String(file.name || "file");
    if (/\.doc$/i.test(name)) { toast(name + " " + OLD_WORD, "err"); return Promise.resolve(false); }
    return file.slice(0, 8).arrayBuffer().then(function (buf) {
      var b = new Uint8Array(buf);
      // A .docx is a zip; it is known by its first bytes as well as its name.
      if ((b[0] === 0x50 && b[1] === 0x4B) || /\.docx$/i.test(name)) return importWord(file);
      if (b[0] === 0xD0 && b[1] === 0xCF && b[2] === 0x11 && b[3] === 0xE0) { toast(name + " " + OLD_WORD, "err"); return false; }
      // A project file is read as one piece of text, and the browser cannot
      // hold one longer than this (scripts/measure-size.html).
      if (file.size > TEXT_MAX) { toast(name + " is too large to open here (" + mb(file.size) + " MB).", "err"); return false; }
      return new Promise(function (resolve) {
        var r = new FileReader();
        r.onload = function () { resolve(loadText(name, String(r.result), handle || null)); };
        r.onerror = function () { toast(name + " could not be read.", "err"); resolve(false); };
        r.readAsText(file);
      });
    }, function () { toast(name + " could not be read.", "err"); return false; });
  }
  function chooseFile() {
    if (!S.canPick()) { $("file-input").click(); return; }
    S.openWithPicker().then(function (got) {
      if (got) loadFile(got.file, got.handle);
    }, function (e) {
      // The dialog was refused here (a frame, or the click has expired).
      if (e && e.name === "SecurityError") $("file-input").click();
      else toast("The file dialog could not be opened. " + ((e && e.message) || ""), "err");
    });
  }
  function openTour() {
    function open() {
      if (!window.SPT_DOCUMENT_DEMO) { toast("The demo document (data/demo-document.js) is missing.", "err"); return; }
      var doc;
      // A copy: reading turns the demo's base64 into Blobs and drops the strings.
      try { doc = M.normalise(JSON.parse(JSON.stringify(window.SPT_DOCUMENT_DEMO))); }
      catch (e) { toast("The demo document could not be opened.", "err"); return; }
      setDoc(doc, { from: "tour" }).then(function (opened) { if (opened) toast("Demo document opened. Nothing you change here is kept."); });
    }
    if (window.SPT_DOCUMENT_DEMO) { open(); return; }
    var s = document.createElement("script");
    s.src = "data/demo-document.js";
    s.onload = open;
    s.onerror = function () { toast("The demo document (data/demo-document.js) failed to load.", "err"); };
    document.head.appendChild(s);
  }
  function noteRecent(action, name, handle) {
    var B = HB();
    if (!B || !name || state.tour) return;
    B.recent({ action: action, name: name, handle: handle || null, kind: "Document", label: titleOf(state.doc) });
  }

  // ---------- saving ----------
  // Resolves what App.DocStorage.save resolved, or false when nothing was
  // saved. A Save is never refused for size; a copy with pictures missing is
  // saved as a new file, after saying so, and never over the earlier one.
  function save(o) {
    var doc = state.doc, saveAs = !!(o && o.saveAs);
    if (!doc) { toast("There is no document to save.", "warn"); return Promise.resolve(false); }
    var lost = state.recovered ? M.missing(doc).length : 0, ask = Promise.resolve(true);
    if (lost && !S.currentName()) {
      saveAs = true;
      ask = confirmBox({
        title: "Save an incomplete copy?",
        text: lost + (lost === 1 ? " picture or drawing is" : " pictures or drawings are") + " missing from this copy. It is saved as a new file, so the file you saved before keeps " + (lost === 1 ? "it" : "them") + ".",
        ok: "Save as a new file"
      });
    }
    return ask.then(function (yes) {
      if (!yes) return false;
      // What the change count was when the text was taken for the file. Until
      // then (the save dialog is open) every change still reaches the file.
      var at = rev;
      return S.save(doc, { saveAs: saveAs, fromName: ui.fileName, onSnapshot: function () { at = rev; } }).then(function (res) {
        if (!res) return false;
        if (state.doc !== doc) return res;
        var later = rev !== at, moved = !!res.oldId && res.oldId !== doc.id;
        ui.lastSave = { name: res.name, how: res.how, at: new Date().toISOString() };
        ui.fileName = res.name;
        if (moved) {
          // Saved into another file, it is now a document of its own (see
          // App.DocStorage.save): its autosave copy goes under its new id.
          // The copy under the old id is removed unless it is on offer, which
          // is the earlier file's unsaved work and the user's to answer for.
          if (ui.warned === res.oldId) ui.warned = doc.id;
          if (window.App.DocPages && window.App.DocPages.moved) window.App.DocPages.moved(res.oldId, doc.id);
          S.autosave.own(doc.id);
          S.autosave.note(doc, { all: true, clean: true });
          if (!(ui.offer && ui.offer.id === res.oldId)) S.autosave.discard(res.oldId);
        }
        if (later) {
          // Changed while the file was being written: those changes are not
          // in the file. The document stays unsaved, and the autosave copy
          // stays the newer one.
          if (moved) S.autosave.note(doc, {});
          updateHeader();
        } else {
          S.autosave.saved(doc);
          markClean();
        }
        var over = M.sizeOf(doc) > M.LIMITS.warnBytes
          ? " Its pictures and kept content are over " + mb(M.LIMITS.warnBytes) + " MB." : "";
        if (later) over = " What you changed while it was being saved is not in the file yet: save again." + over;
        toast(res.how === "file" ? "Saved to " + res.name + "." + over
          : res.blocked ? "Saved (downloaded as " + res.name + "). Saving back into the same file is not available here, so each save downloads a new copy." + over
          : "Saved (downloaded as " + res.name + ")." + over, over ? "warn" : "");
        noteRecent("save", res.name, res.handle);
        return res;
      }, function (e) {
        toast("The document was not saved. " + ((e && e.message) || ""), "err");
        return false;
      });
    });
  }

  // ---------- unsaved work found in this browser ----------
  function restoreOffer() {
    var offer = ui.offer;
    if (!offer) return Promise.resolve(false);
    return guard().then(function (answer) {
      if (!answer) return false;
      return S.autosave.restore(offer.id).then(function (doc) {
        if (!doc) {
          ui.offer = null;
          S.autosave.discard(offer.id);
          renderNotices();
          toast("The autosave copy could not be found.", "err");
          return false;
        }
        ui.offer = null;
        ui.passed = answer;
        return setDoc(doc, { from: "autosave" }).then(function (opened) {
          if (opened) toast("Restored. Save it to keep it in a file.");
          return opened;
        });
      }, function () {
        toast("The autosave copy could not be read.", "err");
        return false;
      });
    });
  }
  // Looks for unsaved work to offer. What is known at once is shown at once;
  // which documents are open in other windows is heard a moment later, and
  // the offer is then put right (a copy that is another window's live work is
  // not offered). The copy of the document open here is never touched by it.
  function lookForOffer() {
    if (TOUR_MODE) { ui.offer = null; renderNotices(); return Promise.resolve(null); }
    ui.offer = S.autosave.offer();
    renderNotices();
    return S.autosave.check().then(function (found) {
      // Whatever was answered meanwhile, this is the copy the store now
      // holds back for an answer (the one already on offer, while it lasts).
      ui.offer = found;
      renderNotices();
      return found;
    }, function () { return ui.offer; });
  }
  function declineOffer() {
    var offer = ui.offer, doc = state.doc;
    if (!offer) return;
    ui.offer = null;
    S.autosave.discard(offer.id, offer);
    // The copy turned down was held under the id of the document that is
    // open (the same document, opened from its file): autosave was paused
    // for it, and discarding took its pictures with it. The open document is
    // written again in full.
    if (doc && !state.tour && doc.id === offer.id) S.autosave.note(doc, { all: true, clean: !state.dirty });
    lookForOffer();
  }
  // The pictures and parts of `other` that can stand in for the missing ones
  // of `doc`: the same key AND the same description. Two files can share an
  // id and their keys without being the same document (one made from the
  // other by Save as in an earlier version), and one's picture must never be
  // put into the other.
  function agreeing(doc, other) {
    var out = { media: {}, parts: {} }, refused = 0;
    function same(a, b, fields) { return fields.every(function (f) { return JSON.stringify(a[f] == null ? null : a[f]) === JSON.stringify(b[f] == null ? null : b[f]); }); }
    [["media", ["type", "name", "width", "height"]], ["parts", ["name", "contentType"]]].forEach(function (g) {
      var mine = doc[g[0]] || {}, theirs = other[g[0]] || {};
      Object.keys(theirs).forEach(function (k) {
        if (!mine[k] || !theirs[k]) return;
        if (same(mine[k], theirs[k], g[1])) out[g[0]][k] = theirs[k];
        else if (mine[k].missing === true || !mine[k].blob) refused++;
      });
    });
    out.refused = refused;
    return out;
  }
  // Pictures that did not come back from the autosave copy are still in the
  // file the document was last saved to, under the same keys.
  function fillFrom(fileOrText) {
    var doc = state.doc;
    if (!doc || fileOrText == null) return Promise.resolve(0);
    var text = typeof fileOrText === "string" ? Promise.resolve(fileOrText) : fileOrText.text();
    return text.then(function (t) {
      var other;
      try { other = M.fromText(t); } catch (e) { toast(foreignMessage(String(fileOrText.name || "That file"), e), "err"); return 0; }
      if (other.id !== doc.id) { toast("That file is a different document, so nothing was taken from it.", "err"); return 0; }
      var match = agreeing(doc, other);
      var was = M.missing(doc), n = M.fill(doc, match), left = M.missing(doc).length;
      if (!n) {
        toast(match.refused ? "Nothing was taken from that file: its pictures are not the ones missing here." : "That file does not hold the missing pictures either.", "warn");
        return 0;
      }
      // What was brought back is in no file yet: the document is unsaved
      // work. The bytes go into the autosave copy too, so the next restore
      // has them.
      rev++;
      if (!state.tour) { state.dirty = true; S.autosave.note(doc, { all: true }); }
      if (ui.mounted === doc) A.DocEditor.redraw(was);
      refresh();
      toast(n + (n === 1 ? " picture or drawing was" : " pictures or drawings were") + " brought back." + (left ? " " + left + " still missing." : ""), left ? "warn" : "");
      return n;
    }, function () { toast("That file could not be read.", "err"); return 0; });
  }
  function chooseFillFile() {
    var input = h("input", { type: "file", accept: "application/json,.json", class: "hidden" });
    input.addEventListener("change", function () {
      var f = input.files && input.files[0];
      if (input.parentNode) input.parentNode.removeChild(input);
      if (f) fillFrom(f);
    });
    document.body.appendChild(input);
    input.click();
  }
  function banner(id, text, buttons) {
    return h("div", { class: "doc-banner", id: id, role: "status" }, [h("span", { class: "t", text: text })].concat(buttons || []));
  }
  function renderNotices() {
    var host = $("notices"), list = [], doc = state.doc;
    if (state.tour) list.push(banner("doc-tour-note", "This is the tour's demo document. Nothing you change here is kept."));
    if (ui.offer) {
      // Always by its own title and time: the copy may not be of what is open,
      // even when it goes by the same id.
      var same = doc && doc.id === ui.offer.id, when = fmtWhen(ui.offer.time), named = (ui.offer.title || "Untitled document") + (when ? ", from " + when : "");
      list.push(banner("doc-offer",
        same ? "This browser holds unsaved work on this document: " + named + ". Autosave is paused until you restore or discard it."
          : "Unsaved work was found in this browser: " + named + ".", [
          h("button", { type: "button", class: "btn primary", id: "doc-offer-restore", text: "Restore it", onClick: restoreOffer }),
          h("button", { type: "button", class: "btn", id: "doc-offer-discard", text: "Discard it", onClick: declineOffer })
        ]));
    }
    var lost = doc ? M.missing(doc).length : 0;
    if (lost) {
      list.push(banner("doc-missing",
        lost + (lost === 1 ? " picture or drawing" : " pictures or drawings") + " could not be restored from " +
        (state.recovered ? "the autosave copy." : "this file.") + " Final is refused until each is brought back, replaced or deleted.", [
          h("button", { type: "button", class: "btn primary", id: "doc-missing-fill", text: "Bring them back from the saved file", onClick: chooseFillFile })
        ]));
    }
    // Drawn again only when what it says has changed, so a button in it
    // keeps the keyboard.
    var key = list.map(function (b) { return b.id + "|" + b.firstChild.textContent; }).join("\n");
    if (host.getAttribute("data-key") === key) return;
    host.setAttribute("data-key", key);
    host.textContent = "";
    list.forEach(function (b) { host.appendChild(b); });
  }

  // ---------- sidebar: pages ----------
  function navItem(id, badge) {
    return h("div", { class: "nav-item" + (state.page === id ? " active" : ""), "data-page": id, role: "button", tabindex: "0",
      "aria-current": state.page === id ? "page" : null,
      onClick: function () {
        go(id);
        // The sidebar was drawn again: keep the keyboard on this page's entry.
        focusOn(document.querySelector('.nav-item[data-page="' + id + '"]'));
      } }, [h("span", { text: PAGE_NAMES[id] }), badge ? h("span", { class: "badge", title: badge + " still to complete", text: String(badge) }) : null]);
  }
  function renderNav() {
    var nav = $("nav"), sec = h("div", { class: "nav-section" });
    nav.textContent = "";
    if (state.doc) {
      sec.appendChild(h("div", { class: "nav-section-title", text: "This document" }));
      sec.appendChild(navItem("info"));
      sec.appendChild(navItem("edit"));
      sec.appendChild(navItem("preview"));
      sec.appendChild(navItem("issue", M.promptCount(state.doc) || null));
      if (state.doc.importReport) sec.appendChild(navItem("report"));
    } else {
      sec.appendChild(navItem("welcome"));
    }
    sec.appendChild(navItem("about"));
    nav.appendChild(sec);
  }
  // The count beside Issue and export, brought up to date where it is.
  function syncBadge() {
    var item = document.querySelector('#nav .nav-item[data-page="issue"]');
    if (!item || !state.doc) return;
    var n = M.promptCount(state.doc), el = item.querySelector(".badge");
    if (!n) { if (el) item.removeChild(el); return; }
    if (!el) { el = h("span", { class: "badge" }); item.appendChild(el); }
    if (el.textContent !== String(n)) { el.textContent = String(n); el.title = n + " still to complete"; }
    if (!!state.doc.importReport !== !!document.querySelector('#nav .nav-item[data-page="report"]')) renderNav();
  }

  // ---------- sidebar: outline ----------
  // A tree of the headings, on the Edit page. One row takes the Tab key;
  // Up, Down, Home and End move between rows, Left and Right between a
  // heading and the ones under it. Enter goes to the heading, Alt+Up and
  // Alt+Down move the whole section, Delete deletes it (after asking), and
  // Shift+F10 or the menu key opens the row's menu, as its button does.
  function outlineLabel(e) { return (e.number ? e.number + " " : "") + (e.text.trim() || "Untitled heading"); }
  function outlineRows() { return Array.prototype.slice.call($("outline").querySelectorAll(".doc-outline-row")); }
  function rowOf(id) { return $("outline").querySelector('.doc-outline-row[data-heading-id="' + cssEsc(id) + '"]'); }
  function setOutlineTab(row) {
    outlineRows().forEach(function (r) { r.setAttribute("tabindex", r === row ? "0" : "-1"); });
  }
  function renderOutline() {
    var host = $("outline");
    if (!state.doc || state.page !== "edit") { if (host.firstChild) host.textContent = ""; ui.outlineKey = ""; return; }
    var entries = M.outline(state.doc), key = JSON.stringify(entries);
    if (key === ui.outlineKey && host.firstChild) return;
    ui.outlineKey = key;
    var active = document.activeElement, had = host.contains(active) ? active.closest(".doc-outline-row") : null;
    var hadId = had ? had.getAttribute("data-heading-id") : null, tabId = (host.querySelector('.doc-outline-row[tabindex="0"]') || { getAttribute: function () { return null; } }).getAttribute("data-heading-id");
    host.textContent = "";
    host.appendChild(h("div", { class: "nav-section-title", id: "doc-outline-title", text: "Sections" }));
    if (!entries.length) { host.appendChild(h("div", { class: "doc-outline-none", text: "No headings yet." })); return; }
    var tree = h("div", { class: "doc-outline", role: "tree", "aria-labelledby": "doc-outline-title" });
    entries.forEach(function (e) {
      var label = outlineLabel(e);
      tree.appendChild(h("div", { class: "doc-outline-row lvl" + e.level, role: "treeitem", "aria-level": String(e.level), "data-heading-id": e.id,
        "data-level": String(e.level), tabindex: "-1", "aria-label": label + (e.count ? ", " + e.count + " still to complete" : "") }, [
        h("span", { class: "t", text: label }),
        e.count ? h("span", { class: "n", title: e.count + " still to complete", text: String(e.count) }) : null,
        h("button", { type: "button", class: "doc-outline-more", tabindex: "-1", "aria-haspopup": "menu", "aria-label": "Actions for " + label, title: "Section actions", text: "⋯" })
      ]));
    });
    host.appendChild(tree);
    setOutlineTab((tabId && rowOf(tabId)) || tree.firstChild);
    if (hadId) { var row = rowOf(hadId) || tree.firstChild; setOutlineTab(row); focusOn(row); }
  }
  // The blocks an edit made outside the editor touched, as the history keeps
  // them: where each was and what it was (5.3, undo and redo).
  function snapshot(ids) {
    var out = [];
    ids.forEach(function (id) {
      var at = M.find(state.doc, id);
      if (at) out.push({ id: id, index: at.index, parent: null, json: JSON.stringify(at.block) });
    });
    return out;
  }
  // One edit to the body from the sidebar: recorded for undo, and the editor
  // told which blocks to draw again. change() returns the ids it leaves behind.
  function structural(label, ids, change) {
    var before = snapshot(ids), left;
    try {
      left = change() || [];
      A.DocHistory.record({ label: label, before: before, after: snapshot(left), selBefore: null, selAfter: null });
      if (ui.mounted === state.doc) A.DocEditor.redraw(ids.concat(left.filter(function (id) { return ids.indexOf(id) === -1; })));
    } finally {
      touched({ structure: true });
      refresh();
    }
  }
  function moveSection(id, dir) {
    var doc = state.doc, ids = M.sectionRange(doc, id);
    if (!ids.length) return;
    var blocks = doc.blocks, start = M.find(doc, id).index, end = start + ids.length, level = blocks[start].level, beforeId;
    if (dir < 0) {
      var j = start - 1;
      while (j >= 0 && !(blocks[j].type === "heading" && blocks[j].level <= level)) j--;
      if (j < 0 || blocks[j].level < level) { say("This section is already the first."); return; }
      beforeId = blocks[j].id;
    } else {
      var next = blocks[end];
      if (!next || next.level < level) { say("This section is already the last."); return; }
      var after = blocks[end + M.sectionRange(doc, next.id).length];
      beforeId = after ? after.id : null;
    }
    structural("Move section", ids, function () { return M.move(doc, ids, beforeId); });
    focusOn(rowOf(id));
    say("Section moved " + (dir < 0 ? "up." : "down."));
  }
  function addSectionAfter(id) {
    var doc = state.doc, ids = M.sectionRange(doc, id);
    if (!ids.length) return;
    var level = M.find(doc, id).block.level;
    var fresh = [M.make.heading(doc, level, ""), M.make.paragraph(doc, "")];
    structural("Add section", [], function () { return M.insertAfter(doc, ids[ids.length - 1], fresh); });
    go("edit", { blockId: fresh[0].id });
  }
  function deleteSection(id) {
    var doc = state.doc, ids = M.sectionRange(doc, id);
    if (!ids.length) return;
    var name = M.text(M.find(doc, id).block).trim() || "Untitled heading", under = ids.length - 1;
    var rows = outlineRows(), at = rows.indexOf(rowOf(id)), nextId = null;
    // Where the keyboard goes afterwards: the section after it, else the one before.
    for (var i = at + 1; i < rows.length && !nextId; i++) if (ids.indexOf(rows[i].getAttribute("data-heading-id")) === -1) nextId = rows[i].getAttribute("data-heading-id");
    if (!nextId && at > 0) nextId = rows[at - 1].getAttribute("data-heading-id");
    confirmBox({
      title: "Delete this section?",
      text: name + (under ? " and the " + under + (under === 1 ? " block" : " blocks") + " under it" : "") + " will be deleted. Undo in the editor brings " + (under ? "them" : "it") + " back.",
      ok: "Delete the section", danger: true
    }).then(function (yes) {
      if (!yes || state.doc !== doc) return;
      structural("Delete section", ids, function () {
        M.remove(doc, ids);
        // The body is never left with nothing to type in.
        if (!doc.blocks.length) { var p = M.make.paragraph(doc, ""); doc.blocks.push(p); return [p.id]; }
        return [];
      });
      focusOn((nextId && rowOf(nextId)) || outlineRows()[0] || document.querySelector('.nav-item[data-page="edit"]'));
      say("Section deleted.");
    });
  }
  var menuEl = null;
  function closeMenu(back) {
    if (!menuEl) return;
    var row = menuEl.previousSibling;
    if (menuEl.parentNode) menuEl.parentNode.removeChild(menuEl);
    menuEl = null;
    if (back && row) focusOn(row);
  }
  function openMenu(row) {
    closeMenu();
    var id = row.getAttribute("data-heading-id");
    function item(label, run) {
      return h("button", { type: "button", role: "menuitem", class: "doc-menu-item", tabindex: "-1", text: label, onClick: function () { closeMenu(); run(); } });
    }
    menuEl = h("div", { class: "doc-menu", role: "menu", "aria-label": "Section actions" }, [
      item("Add a section after", function () { addSectionAfter(id); }),
      item("Move up", function () { moveSection(id, -1); }),
      item("Move down", function () { moveSection(id, 1); }),
      item("Delete this section", function () { deleteSection(id); })
    ]);
    menuEl.addEventListener("keydown", function (e) {
      var items = Array.prototype.slice.call(menuEl.querySelectorAll(".doc-menu-item")), at = items.indexOf(document.activeElement);
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeMenu(true); }
      else if (e.key === "Tab") closeMenu(true);
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); e.stopPropagation();
        focusOn(items[(at + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]);
      }
    });
    row.parentNode.insertBefore(menuEl, row.nextSibling);
    focusOn(menuEl.firstChild);
  }
  function outlineClick(e) {
    var row = e.target.closest && e.target.closest(".doc-outline-row");
    if (!row) return;
    setOutlineTab(row);
    if (e.target.closest(".doc-outline-more")) { if (menuEl && menuEl.previousSibling === row) closeMenu(true); else openMenu(row); return; }
    go("edit", { blockId: row.getAttribute("data-heading-id") });
  }
  function outlineKey(e) {
    var row = e.target.classList && e.target.classList.contains("doc-outline-row") ? e.target : null, k = e.key;
    if (!row || e.ctrlKey || e.metaKey) return;
    var rows = outlineRows(), at = rows.indexOf(row), id = row.getAttribute("data-heading-id"), level = +row.getAttribute("data-level"), to = null;
    if (e.altKey) {
      if (k === "ArrowUp" || k === "ArrowDown") { e.preventDefault(); moveSection(id, k === "ArrowUp" ? -1 : 1); }
      return;
    }
    if (k === "ArrowDown") to = rows[at + 1];
    else if (k === "ArrowUp") to = rows[at - 1];
    else if (k === "Home") to = rows[0];
    else if (k === "End") to = rows[rows.length - 1];
    else if (k === "ArrowRight") { if (rows[at + 1] && +rows[at + 1].getAttribute("data-level") > level) to = rows[at + 1]; }
    else if (k === "ArrowLeft") { for (var i = at - 1; i >= 0 && !to; i--) if (+rows[i].getAttribute("data-level") < level) to = rows[i]; }
    else if (k === "Enter" || k === " ") { e.preventDefault(); go("edit", { blockId: id }); return; }
    else if (k === "Delete") { e.preventDefault(); deleteSection(id); return; }
    else if (k === "ContextMenu" || (k === "F10" && e.shiftKey)) { e.preventDefault(); openMenu(row); return; }
    else return;
    e.preventDefault();
    if (to) { closeMenu(); setOutlineTab(to); focusOn(to); }
  }

  // ---------- pages ----------
  // Until a page is built, something that says so is better than nothing;
  // the start page has to work whatever else does.
  function fallbackPage(main, page) {
    main.appendChild(h("h1", { class: "page-title", tabindex: "-1", text: page === "welcome" ? "OT Cyber Document Tool" : PAGE_NAMES[page] }));
    if (page !== "welcome") return;
    main.appendChild(h("p", { text: "Write a document in the SolutionsPT template, or load a Word file to have it rebuilt in the template." }));
    main.appendChild(h("div", { class: "btn-row" }, [
      h("button", { type: "button", class: "btn primary", text: "New document", onClick: function () { newDocument(); } }),
      h("button", { type: "button", class: "btn", text: "Load a document or a Word file", onClick: chooseFile }),
      h("button", { type: "button", class: "btn", text: "Take the tour", onClick: openTour })
    ]));
  }
  function focusField(main, field) {
    var f = String(field);
    var el = main.querySelector('[data-field="' + cssEsc(f) + '"]') || main.querySelector("#info-" + cssEsc(f)) || main.querySelector('[name="' + cssEsc(f) + '"]');
    if (el && !/^(INPUT|TEXTAREA|SELECT)$/.test(el.nodeName)) el = el.querySelector("input, textarea, select") || el;
    if (el) { focusOn(el); if (el.scrollIntoView) el.scrollIntoView({ block: "center" }); }
  }
  // go("edit", { blockId }) opens the editor at a block, go("edit",
  // { blockIds }) with those blocks selected, go("info", { field }) with the
  // keyboard in that field. Without a document every page but About is the
  // start page.
  function go(page, arg) {
    var doc = state.doc, main = $("main"), edit = $("edit-view");
    if (PAGES.indexOf(page) === -1) page = doc ? "info" : "welcome";
    if (!doc && page !== "about") page = "welcome";
    if (doc && page === "welcome") page = "info";
    if (page === "report" && !doc.importReport) page = "edit";
    state.page = page;
    closeMenu();
    renderNav(); renderOutline(); renderNotices(); updateHeader();
    if (page === "edit") {
      main.classList.add("hidden");
      main.textContent = "";
      edit.classList.remove("hidden");
      // What the paper shows around the text (heading numbers, the kind) is
      // set on another page; when it has changed, the paper is built again.
      var key = doc.kind + JSON.stringify(doc.options);
      if (ui.mounted !== doc || ui.mountKey !== key) {
        if (ui.mounted) A.DocEditor.unmount();
        A.DocEditor.mount(edit);
        ui.mounted = doc; ui.mountKey = key;
      }
      if (arg && Array.isArray(arg.blockIds) && arg.blockIds.length) A.DocEditor.selectBlocks(arg.blockIds);
      else if (arg && arg.blockId) A.DocEditor.focusBlock(arg.blockId, {});
      return;
    }
    edit.classList.add("hidden");
    main.classList.remove("hidden");
    main.textContent = "";
    main.scrollTop = 0;
    A.DocPages[page](main, arg);
    if (!main.firstChild) fallbackPage(main, page);
    if (page === "info" && arg && arg.field) focusField(main, arg.field);
  }

  // ---------- wiring ----------
  applyTheme(currentTheme());
  $("btn-theme").addEventListener("click", function () { applyTheme(currentTheme() === "dark" ? "light" : "dark"); });
  $("btn-new").addEventListener("click", function () { newDocument(); });
  $("btn-load").addEventListener("click", chooseFile);
  $("btn-save").addEventListener("click", function (e) { save({ saveAs: !!e.shiftKey }); });
  $("file-input").addEventListener("change", function (ev) {
    var file = ev.target.files && ev.target.files[0];
    ev.target.value = "";
    // A plain file input gives no handle, so the first Save asks where.
    if (file) loadFile(file, null);
  });
  (function () {
    var b = $("version-badge");
    b.textContent = V.label || "";
    b.title = (V.product || "") + " version " + (V.number || "");
    $("sidebar").appendChild(h("div", { class: "sidebar-legal", text: (V.product || "") + " " + (V.label || "") + ". " + LEGAL_SHORT }));
  })();
  S.autosave.onStatus(function (st) {
    var note = $("autosave-note"), text = st === "off" ? "Autosave is off. Save often." : "";
    if (note.textContent !== text) note.textContent = text;
  });

  // A document or Word file dropped anywhere on the tool is opened as Load
  // would. A picture dropped on the paper is the editor's, which takes it
  // first; this listener then leaves it alone. Taking every file drop here
  // also stops the suite bridge passing the file to the suite as well.
  function isFileDrag(e) {
    var t = e.dataTransfer && e.dataTransfer.types;
    return !!t && Array.prototype.indexOf.call(t, "Files") !== -1;
  }
  document.addEventListener("dragover", function (e) { if (isFileDrag(e)) e.preventDefault(); });
  document.addEventListener("drop", function (e) {
    if (e.defaultPrevented || !isFileDrag(e)) return;
    e.preventDefault();
    var files = Array.prototype.slice.call(e.dataTransfer.files || []);
    var file = files.filter(function (f) { return /\.(json|docx|doc)$/i.test(f.name || ""); })[0] || files[0];
    if (!file) return;
    if (/^image\//.test(file.type || "")) { toast("To add a picture, drop it on the page in Edit, or use Insert picture there.", "warn"); return; }
    if (files.length > 1) toast("Only one file can be opened at a time. Opening " + file.name + ".", "warn");
    loadFile(file, null);
  });

  // The sidebar's pages are role=button: Enter and Space press them. One
  // listener each on the parts of the sidebar, kept through every redraw.
  $("nav").addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var t = e.target && e.target.closest && e.target.closest(".nav-item");
    if (t && e.target === t) { e.preventDefault(); t.click(); }
  });
  $("outline").addEventListener("click", outlineClick);
  $("outline").addEventListener("keydown", outlineKey);
  $("outline").addEventListener("focusin", function (e) {
    var row = e.target.closest && e.target.closest(".doc-outline-row");
    if (row && e.target === row) setOutlineTab(row);
  });
  document.addEventListener("mousedown", function (e) {
    if (menuEl && !menuEl.contains(e.target) && !(e.target.closest && e.target.closest(".doc-outline-more"))) closeMenu();
  });
  // Ctrl+S saves the document; the browser's own "save this page" is no use
  // to anyone here. Ctrl+Shift+S is Save as.
  document.addEventListener("keydown", function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || String(e.key).toLowerCase() !== "s") return;
    e.preventDefault();
    if (state.doc && !$("modal").firstChild) save({ saveAs: e.shiftKey });
  });
  window.addEventListener("beforeunload", function (e) {
    if (!state.dirty || state.tour) return;
    S.autosave.flush();
    e.preventDefault(); e.returnValue = ""; return "";
  });
  if (A.HostBridge && A.HostBridge.hosted) {
    A.HostBridge.register({
      loadButton: "btn-load",
      applyTheme: applyTheme,
      // A file the user chose to reopen comes with its handle where the
      // browser kept one; a file handed over or dropped on the suite does not.
      openFile: function (file, handle) { loadFile(file, handle || null); },
      openText: function (name, text) { loadText(name, text, null); },
      // The suite is closing this tool and the user chose to lose the unsaved
      // work: the document's autosave copy goes, so the tool does not offer
      // it when it is opened again. The suite waits for this to finish.
      discardUnsaved: function () {
        var id = state.doc && !state.tour ? state.doc.id : null;
        markClean();
        return id ? S.autosave.drop(id) : null;
      }
    });
  }

  A.DocApp = {
    state: state, go: go, touched: touched, markClean: markClean, setDoc: setDoc, canAdd: canAdd,
    toast: toast, confirmBox: confirmBox, busy: busy, say: say, h: h,
    // Beyond the design's table, for the pages and the tests: the header
    // buttons' actions, the dialog every other dialog is made from, and an
    // immediate refresh of the badge, outline and notices.
    modal: modal, newDocument: newDocument, chooseFile: chooseFile, loadFile: loadFile, loadText: loadText, save: save,
    openTour: openTour, guard: guard, refresh: refresh, fillFrom: fillFrom, restoreOffer: restoreOffer, declineOffer: declineOffer,
    lookForOffer: lookForOffer,
    offer: function () { return ui.offer; }
  };

  // Exposed for the headless test pages.
  window.DocumentTool = {
    state: state,
    go: go,
    load: function (fileOrText) { return typeof fileOrText === "string" ? loadText("file.json", fileOrText, null) : loadFile(fileOrText, null); },
    exportBlob: function (status) { return A.DocExport.blob(status); },
    issues: function () { return A.DocExport.issues(); },
    save: save
  };
  // Read when asked for, so it is the editor's own object whenever that is set.
  Object.defineProperty(window.DocumentTool, "editor", { enumerable: true, get: function () { return A.DocEditor.__test; } });

  if (!TOUR_MODE) lookForOffer();
  go("welcome");
  if (TOUR_MODE) openTour();
})();
