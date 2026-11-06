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
 *     recent  { action: "save"|"open", name, label, hasHandle, when }   a project file was saved or opened
 *     theme   { theme: "light"|"dark" }                          the module's own theme toggle was used
 *   suite -> module (from: "suite")
 *     theme        { theme }                                     follow the suite's theme
 *     open-recent  { name, label }                               reopen a recent file (see openRecent)
 *
 * Recent files never carry file contents: the suite keeps only the name, the
 * customer or project label and when. Where the browser gave the module a file
 * handle (save in place, or Load through the file dialog), the handle is kept
 * in this module's own IndexedDB ("spt-suite-recent"), so reopening can be one
 * click. That click has to happen inside the module's frame: the browser only
 * lets a page ask for file access in answer to a click on that same page.
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
      }
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
    //   applyTheme(theme)       switch theme the module's own way (button label too)
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
    // info: { action: "save"|"open", name, label, handle }. The handle, when
    // there is one, stays in this module's storage; only the name, label and
    // time go to the suite.
    recent: function (info) {
      if (!hosted || !info || !info.name) return;
      var hasHandle = !!(info.handle && typeof info.handle.getFile === "function");
      if (hasHandle) storeHandle(info.name, info.handle);
      post("recent", {
        action: info.action === "save" ? "save" : "open",
        name: String(info.name), label: info.label ? String(info.label) : "",
        hasHandle: hasHandle, when: new Date().toISOString()
      });
    },
    openRecent: function (entry) { if (hosted) openRecent(entry); },
    // Test seam: fn(name, cb) answers in place of the handle store.
    __setHandleLookup: function (fn) { handleLookup = typeof fn === "function" ? fn : findHandle; }
  };
})();
