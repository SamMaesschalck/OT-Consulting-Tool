/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* host-bridge.js
 *
 * How a module talks to the SolutionsPT OT Cyber Suite while the suite hosts
 * it, and nothing at all when it does not. The canonical copy is
 * shared/host-bridge.js; tools/sync-shared.ps1 copies it to js/host-bridge.js
 * in each module.
 *
 * A module never depends on this file. Every call a module makes goes through
 * "if (window.App.HostBridge)", so a module without it, or opened on its own,
 * behaves exactly as before. Standalone, App.HostBridge.hosted is false and
 * every method returns without doing anything.
 *
 * How the module knows it is hosted: the suite opens each tool in a frame
 * whose name is "spt-suite:" followed by JSON launch options
 *   { "module": "risk-assessment", "frame": "risk-assessment", "tour": false }
 * The frame name is there before any of the module's own code runs, so a
 * module can read App.HostBridge.launch while it starts (the risk tool opens
 * its demo when launch.tour is true). A page that is merely framed, such as a
 * test page or the single-HTML parity checks, has no such name and stays
 * standalone.
 *
 * Messages are plain objects sent with postMessage, because in the folder
 * build each tool is a file:// page of its own and the browser treats it as a
 * different origin from the suite (the suite cannot reach into it). Every
 * message carries protocol "spt-suite/1".
 *
 *   module -> suite (from: "module")
 *     ready   { product, version, number, title, dirty, reopen }   once, when the module has started
 *     dirty   { dirty }                                          unsaved changes appeared or were saved
 *     recent  { action: "save"|"open", name, label, kind, hasHandle, when }   a file was saved or opened
 *     theme   { theme: "light"|"dark" }                          the module's own theme toggle was used
 *     handoff { to, name, text }                                 open a file this module just wrote in another
 *                                                                tool of the suite (to: its id or product name)
 *     drop    { files: [File] }                                  files dropped on the module's page that the
 *                                                                module did not take itself
 *     closed  {}                                                 the answer to close: the module is done and
 *                                                                its frame can go
 *   suite -> module (from: "suite")
 *     theme        { theme }                                     follow the suite's theme
 *     open-recent  { name, label }                               reopen a recent file (see openRecent)
 *     open-text    { name, text, handle? }                       open a file handed over by another tool,
 *                                                                dropped on the suite or chosen with its
 *                                                                Open a file (with its handle, see openText)
 *     close        { discard }                                   the suite is closing this tool's frame. With
 *                                                                discard (the tool has unsaved changes and the
 *                                                                user chose to lose them), the module's
 *                                                                discardUnsaved hook throws its autosave copy
 *                                                                away, so a tool opened again starts as if it
 *                                                                had never been opened. Answered with closed.
 *
 * Recent files never carry file contents: the suite keeps only the name, the
 * customer or project label and when. Where the browser gave the module a file
 * handle (save in place, or Load through the file dialog), the handle is kept
 * in this module's own IndexedDB ("spt-suite-recent"), so reopening can be one
 * click. That click has to happen inside the module's frame: the browser only
 * lets a page ask for file access in answer to a click on that same page.
 *
 * handoff, drop and open-text are the only messages that carry a file's
 * contents. They go straight to the tool that opens the file and are never
 * kept: not in Recent files, not in any storage.
 */
(function () {
  "use strict";
  window.App = window.App || {};

  var PROTOCOL = "spt-suite/1";
  var NAME_PREFIX = "spt-suite:";

  var launch = null;
  try {
    if (window.parent && window.parent !== window && typeof window.name === "string" &&
        window.name.indexOf(NAME_PREFIX) === 0) {
      launch = JSON.parse(window.name.slice(NAME_PREFIX.length));
      if (!launch || typeof launch !== "object" || !launch.module) launch = null;
    }
  } catch (e) { launch = null; }
  var hosted = !!launch;
  var host = hosted ? window.parent : null;
  // For the module's styles: in the suite, its own theme toggle is hidden, as
  // the suite's rail has one that switches every tool together.
  if (hosted) document.documentElement.setAttribute("data-host", "suite");

  var hooks = {};
  var dirty = false, readySent = false, themeSeen = null;

  function post(type, data) {
    if (!hosted) return;
    try {
      host.postMessage({ protocol: PROTOCOL, from: "module", module: launch.module, frame: launch.frame || launch.module,
                         type: type, data: data || {} }, "*");
    } catch (e) {}
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function sendReady() {
    if (!hosted || readySent) return;
    readySent = true;
    var V = window.App.Version || {};
    themeSeen = currentTheme();
    post("ready", {
      product: V.product || "", version: V.label || "", number: V.number || "",
      title: document.title || "", dirty: dirty, reopen: typeof hooks.openFile === "function", theme: themeSeen
    });
  }

  // ---- recent files: the handle store ------------------------------------
  // A convenience, never a dependency: any failure (no IndexedDB, a handle the
  // browser will not store, storage that never answers) just means the module
  // asks the consultant to use Load instead.
  var IDB_NAME = "spt-suite-recent", IDB_STORE = "handles";

  function keyOf(name) { return (launch ? launch.module : "") + "|" + String(name || "").toLowerCase(); }

  function withStore(mode, fn, fail) {
    try {
      var req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(IDB_STORE); };
      req.onerror = function () { if (fail) fail(); };
      req.onsuccess = function () {
        try { fn(req.result.transaction(IDB_STORE, mode).objectStore(IDB_STORE)); }
        catch (e) { if (fail) fail(); }
      };
    } catch (e) { if (fail) fail(); }
  }

  function storeHandle(name, handle) {
    withStore("readwrite", function (st) { st.put(handle, keyOf(name)); });
  }

  function findHandle(name, cb) {
    var called = false;
    function finish(h) { if (!called) { called = true; cb(h || null); } }
    if (typeof indexedDB === "undefined") { finish(null); return; }
    withStore("readonly", function (st) {
      var g = st.get(keyOf(name));
      g.onsuccess = function () { finish(g.result); };
      g.onerror = function () { finish(null); };
    }, function () { finish(null); });
    setTimeout(function () { finish(null); }, 1500);   // storage that never answers must not leave the consultant waiting
  }
  var handleLookup = findHandle;   // replaced by tests (__setHandleLookup)

  function permitted(handle) {
    if (!handle.queryPermission) return Promise.resolve(true);
    return handle.queryPermission({ mode: "readwrite" }).then(function (p) {
      if (p === "granted") return true;
      return handle.requestPermission({ mode: "readwrite" }).then(function (p2) { return p2 === "granted"; });
    }).catch(function () { return false; });
  }

  // ---- the in-tool prompt -------------------------------------------------
  var STYLE =
    ".spt-host-banner{position:fixed;top:66px;left:50%;transform:translateX(-50%);z-index:3000;" +
    "box-sizing:border-box;width:max-content;max-width:min(640px,calc(100vw - 32px));display:flex;align-items:center;gap:10px;flex-wrap:wrap;" +
    "padding:10px 12px 10px 14px;background:var(--surface,#fff);color:var(--text,#1A2533);" +
    "border:1px solid var(--border-strong,#C8D2DD);border-left:3px solid var(--brand-blue,#0F5FA6);" +
    "border-radius:6px;box-shadow:0 6px 20px rgba(10,30,50,.18);font-size:13px;line-height:1.45}" +
    ".spt-host-banner .spt-host-msg{flex:1 1 220px;min-width:0;overflow-wrap:anywhere}" +
    ".spt-host-banner .spt-host-x{border:0;background:none;color:var(--text-muted,#5A6B7B);font-size:18px;line-height:1;cursor:pointer;padding:2px 4px}" +
    ".spt-host-attention{box-shadow:0 0 0 2px #F5B841 !important;animation:spt-host-pulse 1.1s ease-in-out 4}" +
    "@keyframes spt-host-pulse{50%{box-shadow:0 0 0 6px rgba(245,184,65,.45)}}";
  var banner = null, attention = null;

  function ensureStyle() {
    if (document.getElementById("spt-host-style")) return;
    var s = document.createElement("style");
    s.id = "spt-host-style";
    s.textContent = STYLE;
    (document.head || document.documentElement).appendChild(s);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function closeBanner() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
    if (attention) { attention.classList.remove("spt-host-attention"); attention = null; }
  }

  function showBanner(message, buttons) {
    closeBanner();
    ensureStyle();
    banner = el("div", "spt-host-banner");
    banner.setAttribute("role", "status");
    banner.appendChild(el("span", "spt-host-msg", message));
    (buttons || []).forEach(function (b) {
      var btn = el("button", b.primary ? "btn primary" : "btn", b.text);
      btn.type = "button";
      btn.addEventListener("click", b.onClick);
      banner.appendChild(btn);
    });
    var x = el("button", "spt-host-x", "×");
    x.type = "button";
    x.title = "Close";
    x.setAttribute("aria-label", "Close");
    x.addEventListener("click", closeBanner);
    banner.appendChild(x);
    document.body.appendChild(banner);
    return banner;
  }

  // No handle (or no access to it): point at the module's own Load button and
  // name the file to choose.
  function pointAtLoad(name, why) {
    showBanner((why ? why + " " : "") + "To open " + name + ", click Load and choose the file.", []);
    var load = document.getElementById(hooks.loadButton || "btn-load");
    if (load) {
      attention = load;
      load.classList.add("spt-host-attention");
      load.addEventListener("click", closeBanner, { once: true });
    }
  }

  function offerReopen(name, label, handle) {
    showBanner("Reopen " + name + (label ? " (" + label + ")" : "") + "?", [
      { text: "Reopen", primary: true, onClick: function () {
        permitted(handle).then(function (ok) {
          if (!ok) { pointAtLoad(name, "The browser did not give access to the file."); return; }
          return handle.getFile().then(function (file) {
            closeBanner();
            hooks.openFile(file, handle);
          });
        }).catch(function () { pointAtLoad(name, "The file could not be read from where it was; it may have been moved or renamed."); });
      } },
      { text: "Not now", onClick: closeBanner }
    ]);
  }

  function openRecent(entry) {
    var name = entry && entry.name ? String(entry.name) : "";
    if (!name) return;
    handleLookup(name, function (handle) {
      if (handle && typeof handle.getFile === "function" && typeof hooks.openFile === "function") {
        offerReopen(name, entry.label ? String(entry.label) : "", handle);
      } else {
        pointAtLoad(name, null);
      }
    });
  }

  // ---- files handed over or dropped in the suite ---------------------------
  // The contents arrive with the message, so no file access is needed. Who
  // takes it, in order: a listener added with onOpenText that says it has
  // (the author's review card takes a review file this way), the module's
  // openText hook, then its openFile hook given the text as a file, so a
  // module that can reopen a recent file can open one handed over as well.
  // A file chosen with the suite's Open a file comes with its handle (the
  // single-file build, where the tool shares the suite's origin): it goes to
  // the openFile hook with the handle, as the tool's own Load would, so Save
  // writes back to that file.
  var textListeners = [];
  function openText(d) {
    var name = d && d.name ? String(d.name) : "file.json";
    var text = d && typeof d.text === "string" ? d.text : null;
    if (text === null) return;
    for (var i = 0; i < textListeners.length; i++) {
      try { if (textListeners[i](name, text) === true) return; } catch (e) {}
    }
    var handle = d && d.handle && typeof d.handle.getFile === "function" ? d.handle : null;
    if (handle && typeof hooks.openFile === "function") {
      var hf = null;
      try { hf = new File([text], name, { type: "application/json" }); } catch (e) { hf = null; }
      if (hf) { hooks.openFile(hf, handle); return; }
    }
    if (typeof hooks.openText === "function") { hooks.openText(name, text); return; }
    if (typeof hooks.openFile === "function") {
      var file = null;
      try { file = new File([text], name, { type: "application/json" }); } catch (e) { file = null; }
      if (file) { hooks.openFile(file, null); return; }
    }
    pointAtLoad(name, null);
  }

  // A file dragged onto the module's page that the module does not take
  // itself (it did not call preventDefault) would make the browser open the
  // file in place of the tool, and in the exe nothing would happen at all. In
  // the suite it goes to the suite instead, which opens it in the tool that
  // reads it. Only file drags: dragging text into a box is left alone.
  function isFileDrag(e) {
    var t = e.dataTransfer && e.dataTransfer.types;
    return !!t && Array.prototype.indexOf.call(t, "Files") !== -1;
  }

  // ---- closing --------------------------------------------------------------
  // The suite removes this frame once it has the answer, or after its own
  // wait if none comes. The hook may return a promise (the document tool's
  // store answers later); a hook that fails or never finishes still lets the
  // tool close, as unsaved work the user chose to lose is no reason to keep it.
  var closing = false;
  function close(d) {
    if (closing) return;
    closing = true;
    closeBanner();
    var work = null;
    if (d && d.discard && typeof hooks.discardUnsaved === "function") {
      try { work = hooks.discardUnsaved(); } catch (e) { work = null; }
    }
    var answered = false;
    function done() { if (answered) return; answered = true; post("closed", {}); }
    setTimeout(done, 1500);
    Promise.resolve(work).then(done, done);
  }

  // ---- messages from the suite ----------------------------------------------
  if (hosted) {
    window.addEventListener("message", function (ev) {
      if (ev.source !== host) return;
      var m = ev.data;
      if (!m || m.protocol !== PROTOCOL || m.from !== "suite") return;
      var d = m.data || {};
      if (m.type === "theme" && (d.theme === "dark" || d.theme === "light")) {
        themeSeen = d.theme;
        if (currentTheme() === d.theme) return;
        if (typeof hooks.applyTheme === "function") hooks.applyTheme(d.theme);
        else document.documentElement.setAttribute("data-theme", d.theme);
      } else if (m.type === "open-recent") {
        openRecent(d);
      } else if (m.type === "open-text") {
        openText(d);
      } else if (m.type === "close") {
        close(d);
      }
    });
    // Listened for on the window, so the module's own handlers (on the
    // document or lower) run first and can take the file themselves.
    window.addEventListener("dragover", function (e) {
      if (e.defaultPrevented || !isFileDrag(e)) return;
      e.preventDefault();
      try { e.dataTransfer.dropEffect = "copy"; } catch (x) {}
    });
    window.addEventListener("drop", function (e) {
      if (e.defaultPrevented || !isFileDrag(e)) return;
      e.preventDefault();
      var files = Array.prototype.slice.call(e.dataTransfer.files || []);
      if (files.length) post("drop", { files: files });
    });
    // The module's own theme toggle: tell the suite, which keeps every open
    // tool and its own pages on the same theme.
    if (typeof MutationObserver === "function") {
      new MutationObserver(function () {
        var t = currentTheme();
        if (t !== themeSeen) { themeSeen = t; post("theme", { theme: t }); }
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }
    // A module that never registers still says it has started.
    window.addEventListener("load", function () { setTimeout(sendReady, 0); });
  }

  window.App.HostBridge = {
    hosted: hosted,
    // The launch options from the suite ({} standalone).
    launch: launch || {},
    // What the module offers the suite, all optional:
    //   openFile(file, handle)  open a project file the consultant chose to reopen
    //                           (handle is null for a file handed over or dropped)
    //   openText(name, text)    open a file handed over or dropped, in place of openFile
    //   applyTheme(theme)       switch theme the module's own way (button label too)
    //   discardUnsaved()        throw away the autosave copy of the unsaved work,
    //                           as the suite closes the tool (may return a promise)
    //   loadButton              the id of the module's Load button ("btn-load")
    register: function (h) {
      if (!hosted) return;
      hooks = h || {};
      sendReady();
    },
    setDirty: function (d) {
      d = !!d;
      if (d === dirty) return;
      dirty = d;
      if (readySent) post("dirty", { dirty: d });
    },
    // info: { action: "save"|"open", name, label, handle, kind }. The handle,
    // when there is one, stays in this module's storage; only the name, label,
    // kind (optional, what sort of file it is, such as "Review pack") and time
    // go to the suite.
    recent: function (info) {
      if (!hosted || !info || !info.name) return;
      var hasHandle = !!(info.handle && typeof info.handle.getFile === "function");
      if (hasHandle) storeHandle(info.name, info.handle);
      post("recent", {
        action: info.action === "save" ? "save" : "open",
        name: String(info.name), label: info.label ? String(info.label) : "",
        kind: info.kind ? String(info.kind) : "",
        hasHandle: hasHandle, when: new Date().toISOString()
      });
    },
    openRecent: function (entry) { if (hosted) openRecent(entry); },
    // Whether this module may hand files to another tool: in the suite, and
    // not on a tour, whose files stay in the tour.
    canHandoff: hosted && !launch.tour,
    // Opens a file this module has just written in another tool of the suite
    // (to: that tool's id, such as "report-review", or its product name).
    // Returns false, and does nothing, where that is not possible.
    handoff: function (to, name, text) {
      if (!hosted || launch.tour || !to || typeof text !== "string") return false;
      post("handoff", { to: String(to), name: String(name || "file.json"), text: text });
      return true;
    },
    // fn(name, text) is offered every file handed over or dropped before the
    // module's own hooks are; it returns true when it has dealt with it.
    onOpenText: function (fn) {
      if (hosted && typeof fn === "function" && textListeners.indexOf(fn) === -1) textListeners.push(fn);
    },
    // A short message in the module's frame, in the bridge's own banner.
    notice: function (message) { if (hosted && message) showBanner(String(message), []); },
    // Test seam: fn(name, cb) answers in place of the handle store.
    __setHandleLookup: function (fn) { handleLookup = typeof fn === "function" ? fn : findHandle; }
  };
})();
