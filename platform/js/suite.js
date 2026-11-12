/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* suite.js - the SolutionsPT OT Cyber Suite shell.
 *
 * A rail down the left (Home, each tool, any tour that is open, the theme and
 * the licence) and beside it the home page or a tool in its frame. Each tool runs
 * exactly as it does on its own, in its own frame: the tools define the
 * same global names, so they could not share one page, and the frame keeps
 * every tool's behaviour identical inside and outside the suite. A tool that
 * is left stays open and hidden, so switching never loses work. Each tool
 * still saves and loads its own files: a project file in the assessment and
 * risk tools, a review pack and review file in the Report Review Tool, a
 * document file (and Word files) in the Document Tool.
 *
 * Where the tools come from:
 *   - the folder (developer) build frames each tool's own page,
 *     ../modules/<id>/index.html. Every file:// page counts as its own
 *     origin, so the shell cannot reach into those frames, and the browser
 *     will not show a file dialog inside one: the tools save by download there.
 *   - the single-file build (and the exe) carries each tool's own single-file
 *     build, gzipped, in a <script type="application/x-spt-payload"> element,
 *     listed in window.Suite.Bundle. A tool is unpacked the first time it is
 *     opened and given to its frame as srcdoc, which makes the frame the same
 *     origin as the shell: the file dialogs, IndexedDB and localStorage work
 *     there as they do standalone. (A blob: URL would not do: from a file://
 *     page the browser refuses to run one in a frame.)
 *
 * The shell and the tools talk only through postMessage (protocol
 * "spt-suite/1", see shared/host-bridge.js): a tool says when it has started,
 * when it has unsaved changes and when it saved or opened a file; the shell
 * passes on theme changes and asks a tool to reopen a recent file. A tool can
 * also hand a file it has just written to another tool (the author's review
 * pack to the Report Review Tool), and a file dropped anywhere in the suite is
 * opened in the tool that reads it, never in place of the suite. Nothing in a
 * tool requires the shell. A tour's frame is a demo: its unsaved changes and
 * its saves are not counted, and it hands nothing on.
 *
 * Recent files ("spt-suite:recent:v1" in localStorage, newest first, at most
 * 12) hold the file name, the tool, the customer or project label, what sort
 * of file it is and when, never the contents.
 */
(function () {
  "use strict";
  window.App = window.App || {};
  window.Suite = window.Suite || {};

  var D = window.Suite.Data || { product: "SolutionsPT OT Cyber Suite", shortName: "OT Cyber Suite", modules: [] };
  var V = window.App.Version || { label: "", number: "" };
  var BUNDLE = window.Suite.Bundle || null;
  var PROTOCOL = "spt-suite/1";
  var RECENT_KEY = "spt-suite:recent:v1";
  var RECENT_MAX = 12;

  var LEGAL_SHORT = "© 2026 SolutionsPT. All rights reserved.";
  var LEGAL_NOTICE = LEGAL_SHORT + " Proprietary and confidential. Licensed only for work commissioned by SolutionsPT; " +
    "it may not be resold, shared or used for any other client or purpose.";

  var modulesById = {};
  D.modules.forEach(function (m) { modulesById[m.id] = m; });

  // One entry per frame opened: a tool, or a tool's tour. Key "<id>" or "<id>/tour".
  var frames = {};
  var current = null;   // the key shown, or null for the home page

  function $(id) { return document.getElementById(id); }

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") el.textContent = v;
      else if (k === "class") el.className = v;
      else if (k.indexOf("on") === 0 && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }

  var toastTimer = null;
  function toast(msg, kind) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast" + (kind ? " " + kind : "");
    clearTimeout(toastTimer);
    // Long enough to read: a note about dropped files can run to a few lines.
    toastTimer = setTimeout(function () { t.className = "toast hidden"; }, Math.max(6000, String(msg).length * 60));
  }

  // ---- what this copy carries ----------------------------------------------

  function payloadAvailable(id) { return !BUNDLE || (BUNDLE.payloads || []).indexOf(id) !== -1; }
  function moduleAvailable(m) { return payloadAvailable(m.payload); }
  function tourAvailable(m) { return !!(m.tour && payloadAvailable(m.tour.payload)); }

  function target(key) {
    var parts = String(key || "").split("/");
    var m = modulesById[parts[0]];
    if (!m || !moduleAvailable(m)) return null;
    var tour = parts[1] === "tour";
    if (tour && !tourAvailable(m)) return null;
    return { key: m.id + (tour ? "/tour" : ""), module: m, tour: tour };
  }

  // The payloads come after this script in the file; wait for them.
  function whenParsed(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  // A tool's single-file build, unpacked from the payload this file carries.
  function payloadHtml(id, cb) {
    whenParsed(function () {
      var el = document.getElementById("spt-payload-" + id);
      if (!el) { cb(new Error("this copy of the suite does not include it")); return; }
      try {
        var bin = atob(el.textContent.replace(/\s+/g, ""));
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
        new Response(stream).text().then(function (html) { cb(null, html); }, function (e) { cb(e); });
      } catch (e) { cb(e); }
    });
  }

  // ---- frames -----------------------------------------------------------------

  function launchName(t) {
    var launch = { module: t.module.id, frame: t.key, tour: t.tour };
    var extra = t.tour && t.module.tour && t.module.tour.launch;
    if (extra) Object.keys(extra).forEach(function (k) { launch[k] = extra[k]; });
    return "spt-suite:" + JSON.stringify(launch);
  }

  function displayName(f) { return f.module.name + (f.tour ? " tour" : ""); }

  function createFrame(t) {
    var f = { key: t.key, module: t.module, tour: t.tour, el: null, loading: null,
              loaded: false, ready: false, dirty: false, product: "", version: "", queue: [] };
    frames[t.key] = f;
    var el = document.createElement("iframe");
    el.className = "tool-frame";
    // The launch options travel in the frame's name: the tool reads them
    // before any of its own code runs (shared/host-bridge.js).
    el.name = launchName(t);
    el.title = displayName(f);
    el.setAttribute("data-key", t.key);
    f.el = el;
    f.loading = h("div", { class: "stage-loading", text: "Opening the " + displayName(f) + "…" });
    el.addEventListener("load", function () {
      if (!el.src && !el.hasAttribute("srcdoc")) return;   // the empty page a frame starts with
      f.loaded = true;
      if (f.loading && f.loading.parentNode) f.loading.parentNode.removeChild(f.loading);
      f.loading = null;
    });
    var src = t.tour ? t.module.tour : t.module;
    if (!BUNDLE) el.src = src.entry;
    var stage = $("stage");
    stage.appendChild(el);
    stage.appendChild(f.loading);
    if (BUNDLE) {
      payloadHtml(src.payload, function (err, html) {
        if (err) {
          var why = "The " + displayName(f) + " could not be opened: " + (err.message || err) + ".";
          if (f.loading) f.loading.textContent = why;
          toast(why, "err");
          return;
        }
        el.srcdoc = html;
      });
    }
    return f;
  }

  function frameFor(win) {
    var keys = Object.keys(frames);
    for (var i = 0; i < keys.length; i++) if (frames[keys[i]].el.contentWindow === win) return frames[keys[i]];
    return null;
  }

  // A file's handle (Open a file in the single-file build) is passed with it
  // so the tool can save back to it; if the browser cannot pass the handle,
  // the file still goes, without it.
  function send(f, type, data) {
    var msg = { protocol: PROTOCOL, from: "suite", type: type, data: data || {} };
    try { f.el.contentWindow.postMessage(msg, "*"); }
    catch (e) {
      if (!data || !data.handle) return;
      var plain = {};
      Object.keys(data).forEach(function (k) { if (k !== "handle") plain[k] = data[k]; });
      try { f.el.contentWindow.postMessage({ protocol: PROTOCOL, from: "suite", type: type, data: plain }, "*"); } catch (x) {}
    }
  }

  // Opens a tool and sends it a message, held until the tool has started.
  // A later reopen request replaces one still waiting.
  function deliver(key, type, data) {
    var f = openTool(key);
    if (!f) return null;
    if (f.ready) send(f, type, data);
    else {
      if (type === "open-recent") f.queue = f.queue.filter(function (q) { return q.type !== "open-recent"; });
      f.queue.push({ type: type, data: data });
    }
    return f;
  }

  function show(key) {
    current = key;
    Object.keys(frames).forEach(function (k) {
      var f = frames[k], on = k === key;
      f.el.classList.toggle("active", on);
      if (f.loading) f.loading.classList.toggle("hidden", !on);
    });
    $("home").classList.toggle("hidden", key !== null);
    renderRail();
    if (key === null) {
      document.title = D.product;
      renderHome();
      markNotesSeen();
    } else {
      document.title = displayName(frames[key]) + " - " + D.product;
      try { frames[key].el.focus(); } catch (e) {}
    }
  }

  // Opens a tool (or "<id>/tour"), creating its frame the first time.
  function openTool(key) {
    var t = target(key);
    if (!t) { toast("That tool is not part of this copy of the suite.", "err"); return null; }
    var f = frames[t.key] || createFrame(t);
    show(t.key);
    return f;
  }

  function goHome() { show(null); }

  function dirtyFrames() {
    return Object.keys(frames).map(function (k) { return frames[k]; }).filter(function (f) { return f.dirty; });
  }

  // ---- messages from the tools ------------------------------------------------

  window.addEventListener("message", function (ev) {
    var m = ev.data;
    if (!m || typeof m !== "object" || m.protocol !== PROTOCOL || m.from !== "module") return;
    var f = frameFor(ev.source);
    if (!f) return;
    var d = m.data || {};
    // A tour is a demo whose changes are never kept: its unsaved changes do
    // not count (no amber dot, no close warning) and its saves are not recent files.
    if (m.type === "ready") {
      f.ready = true;
      f.product = String(d.product || "");
      f.version = String(d.version || "");
      f.dirty = !f.tour && !!d.dirty;
      if (d.theme && d.theme !== theme()) send(f, "theme", { theme: theme() });
      var queue = f.queue;
      f.queue = [];
      queue.forEach(function (q) { send(f, q.type, q.data); });
    } else if (m.type === "dirty") {
      f.dirty = !f.tour && !!d.dirty;
    } else if (m.type === "recent") {
      if (!f.tour) addRecent(f, d);
    } else if (m.type === "theme") {
      setTheme(d.theme, f);
    } else if (m.type === "handoff") {
      handoff(f, d);
      return;
    } else if (m.type === "drop") {
      openDropped(Array.isArray(d.files) ? d.files : [], f);
      return;
    } else {
      return;
    }
    // Readable from outside the frame too (the check page, the self-test).
    if (f.ready) f.el.setAttribute("data-ready", f.version || "");
    f.el.setAttribute("data-dirty", f.dirty ? "true" : "false");
    renderRail();
    if (current === null) renderHome();
  });

  // Closing or reloading the suite with unsaved work in any tool asks first.
  // Each tool's own warning runs in its frame as well; this one also covers a
  // tool the browser would not let warn (a frame never clicked in).
  window.addEventListener("beforeunload", function (ev) {
    if (window.Suite.__noOwnGuard) return;
    if (dirtyFrames().length) { ev.preventDefault(); ev.returnValue = ""; return ""; }
  });

  // ---- recent files ----------------------------------------------------------

  function readRecent() {
    try {
      var a = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (!Array.isArray(a)) return [];
      return a.filter(function (e) { return e && typeof e.name === "string" && e.name && modulesById[e.module]; });
    } catch (e) { return []; }
  }
  function writeRecent(list) {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX))); } catch (e) {}
  }
  function addRecent(f, d) {
    if (!d || !d.name) return;
    var entry = {
      module: f.module.id,
      name: String(d.name).slice(0, 260),
      label: String(d.label || "").slice(0, 200),
      action: d.action === "save" ? "save" : "open",
      kind: String(d.kind || "").slice(0, 40),
      when: typeof d.when === "string" ? d.when : new Date().toISOString(),
      hasHandle: !!d.hasHandle
    };
    var list = readRecent().filter(function (e) {
      return !(e.module === entry.module && e.name.toLowerCase() === entry.name.toLowerCase());
    });
    list.unshift(entry);
    writeRecent(list);
  }
  function clearRecent() { try { localStorage.removeItem(RECENT_KEY); } catch (e) {} renderHome(); }

  // Switches to the file's tool and asks it to reopen the file: in one click
  // where the browser kept access to it, otherwise by pointing at Load.
  function openRecent(entry) {
    deliver(entry.module, "open-recent", { name: entry.name, label: entry.label || "" });
  }

  // What sort of file a recent entry is, for the list: what the tool said; a
  // project file for the assessment and risk tools, which write nothing else;
  // a document for the Document Tool, whose Word exports are downloads and
  // never recent files; or, for the Report Review Tool, read from the names
  // it gives its files.
  function recentKind(e) {
    if (e.kind) return e.kind;
    if (e.module === "assessments" || e.module === "risk-assessment") return "Project file";
    if (e.module === "documents") return "Document";
    if (e.module !== "report-review") return "";
    if (/-review-pack-round-\d+/i.test(e.name)) return "Review pack";
    if (/-review-round-\d+-/i.test(e.name)) return "Review file";
    return "";
  }

  // ---- files handed over, and files dropped on the suite ----------------------
  //
  // The contents go straight to the tool that opens them (open-text, see
  // shared/host-bridge.js) and are never kept here. A file chosen with Open a
  // file in the single-file build also carries its handle, so the tool can
  // save back to it. postMessage carries them
  // across origins, so this works in the folder build as well.

  var FILE_MAX = 100 * 1024 * 1024;   // well above the largest review pack

  // Which tool opens a file, from what it says it is. null: not one of ours.
  function fileKind(text) {
    var d = null;
    try { d = JSON.parse(text); } catch (e) { d = null; }
    if (!d || typeof d !== "object" || Array.isArray(d)) return null;
    var s = typeof d.schema === "string" ? d.schema : "";
    if (/^spt-review-pack\//.test(s)) return { module: "report-review", what: "review pack" };
    if (/^spt-review\//.test(s)) return { module: "report-review", what: "review file" };
    if (/^spt-risk-project\//.test(s)) return { module: "risk-assessment", what: "project file" };
    if (/^spt-risk-context\//.test(s)) return { module: null, what: "risk context file",
      hint: "Open or start an IEC 62443-3-3 assessment in the OT Cyber Assessment Tool and use Import risk context on the Target SL card of its Engagement details page." };
    // Before the line below: a file with no schema string and a schemaVersion
    // is taken for an assessment project, so the document file always says
    // what it is.
    if (/^spt-document\//.test(s)) return { module: "documents", what: "document file" };
    if (!s && typeof d.schemaVersion === "string") return { module: "assessments", what: "project file" };
    return null;
  }

  function moduleFor(to) {
    to = String(to || "");
    if (modulesById[to]) return modulesById[to];
    for (var i = 0; i < D.modules.length; i++) if (D.modules[i].name === to) return D.modules[i];
    return null;
  }

  // A tool hands over a file it has just written: the author's pack to the
  // Report Review Tool, or a reviewer's file back to the tool the pack came from.
  function handoff(from, d) {
    if (from.tour) { toast("A tour's files can't be passed to another tool.", "err"); return; }
    var m = moduleFor(d.to);
    if (!m || m.id === from.module.id || !moduleAvailable(m) || typeof d.text !== "string" || d.text.length > FILE_MAX) {
      toast("That file could not be passed to the other tool. Open it there with Load.", "err");
      return;
    }
    deliver(m.id, "open-text", { name: String(d.name || "file.json").slice(0, 260), text: d.text });
  }

  // The tools that send review packs and import the review files that come back.
  var AUTHOR_TOOLS = { "assessments": true, "risk-assessment": true };

  // Files dropped on the suite, or on a tool that does not take them itself
  // (from: that tool's frame). Each goes to the tool that reads it; a tool
  // other than the Report Review Tool takes one file at a time. A Word file
  // cannot be passed on (a file reaches a tool as text): the message says
  // where to open it instead. A review file dropped on the author's own tool
  // (not its tour) is the author bringing it in: it goes to that tool, whose
  // review card imports it.
  function openDropped(files, from) {
    var author = from && !from.tour && AUTHOR_TOOLS[from.module.id] ? from.module : null;
    files = (files || []).filter(function (x) { return x && typeof x.name === "string"; });
    if (!files.length) return Promise.resolve([]);
    return Promise.all(files.map(function (file) {
      // Too large to pass on, so it is not read. Its first bytes alone say
      // whether it is a document file (which writes its schema first), so the
      // message can name the tool that opens it.
      if (typeof file.size === "number" && file.size > FILE_MAX) {
        return Promise.resolve().then(function () { return file.slice(0, 512).text(); })
          .then(function (head) { return { name: file.name, text: null, tooBig: true, isDocument: /^﻿?\s*\{\s*"schema"\s*:\s*"spt-document\//.test(String(head)) }; },
                function () { return { name: file.name, text: null, tooBig: true, isDocument: false }; });
      }
      return Promise.resolve().then(function () { return file.text(); })
        .then(function (text) { return { name: file.name, text: text, handle: file.__sptHandle || null }; }, function () { return { name: file.name, text: null }; });
    })).then(function (got) {
      var byTool = {}, order = [], notes = [], projects = {};
      got.forEach(function (g) {
        var k = g.text === null ? null : fileKind(g.text);
        var toAuthor = !!(author && k && k.what === "review file");
        var m = toAuthor ? author : k && k.module ? modulesById[k.module] : null;
        if (k && !k.module) { notes.push(g.name + " is a " + k.what + ". " + k.hint); return; }
        if (!m || !moduleAvailable(m)) {
          var docs = modulesById.documents && moduleAvailable(modulesById.documents) ? modulesById.documents : null;
          if (g.tooBig) {
            notes.push(g.name + " is too large to pass on from here (over " + Math.round(FILE_MAX / 1048576) + " MB). Open it with Load in " +
              (g.isDocument && docs ? "the " + docs.name : "its own tool") + ".");
            return;
          }
          notes.push(g.name + (/^PK/.test(g.text || "") ? " is a Word or Excel file, which the suite does not open." +
              (docs ? " To put a Word file into the SolutionsPT template, open it with Load in the " + docs.name + "." : "")
            : " is not a file the suite opens. Open it with Load in its own tool."));
          return;
        }
        if (!byTool[m.id]) { byTool[m.id] = []; order.push(m.id); }
        if (m.id !== "report-review" && !toAuthor) {
          if (projects[m.id]) { notes.push(g.name + " was left out: open one " + k.what + " at a time."); return; }
          projects[m.id] = true;
        }
        byTool[m.id].push(g);
      });
      // Review packs before review files, as the review tool would sort them.
      if (byTool["report-review"]) byTool["report-review"].sort(function (a, b) {
        return (fileKind(a.text).what === "review pack" ? 0 : 1) - (fileKind(b.text).what === "review pack" ? 0 : 1);
      });
      // In the author's tool, a project file before the review files for it.
      if (author && byTool[author.id]) byTool[author.id].sort(function (a, b) {
        return (fileKind(a.text).what === "review file" ? 1 : 0) - (fileKind(b.text).what === "review file" ? 1 : 0);
      });
      // The first tool is shown last, so it is the one in front.
      order.slice().reverse().forEach(function (id) {
        byTool[id].forEach(function (g) { deliver(id, "open-text", g.handle ? { name: g.name, text: g.text, handle: g.handle } : { name: g.name, text: g.text }); });
      });
      if (notes.length) toast(notes.join(" "), "err");
      return order;
    });
  }

  function isFileDrag(e) {
    var t = e.dataTransfer && e.dataTransfer.types;
    return !!t && Array.prototype.indexOf.call(t, "Files") !== -1;
  }
  // Without these the browser opens a file dropped on the home page or the
  // rail in place of the suite, and the exe silently does nothing. While a
  // file is over the suite, an overlay says what dropping it will do.
  // dragover repeats while a file is over this page, so the overlay goes
  // when it stops: the file left the window, moved over a tool's frame (whose
  // own page takes it) or the drag was cancelled. dragleave alone misses some.
  var dragTimer = null;
  function dragOver(on) {
    clearTimeout(dragTimer);
    document.body.classList.toggle("drop-over", on);
    if (on) dragTimer = setTimeout(function () { dragOver(false); }, 250);
  }
  document.addEventListener("dragover", function (e) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    try { e.dataTransfer.dropEffect = "copy"; } catch (x) {}
    dragOver(true);
  });
  document.addEventListener("dragleave", function (e) {
    if (!e.relatedTarget || e.relatedTarget.tagName === "IFRAME") dragOver(false);
  });
  document.addEventListener("drop", function (e) {
    dragOver(false);
    if (!isFileDrag(e)) return;
    e.preventDefault();
    openDropped(Array.prototype.slice.call(e.dataTransfer.files || []));
  });

  // "today, 14:02", "yesterday, 09:10", "3 Nov, 16:45", or "3 Nov 2025"
  // for an earlier year. now: for the tests.
  function when(iso, now) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    now = now || new Date();
    function day(x) { return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(); }
    try {
      var time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      var ago = Math.round((day(now) - day(d)) / 86400000);
      if (ago === 0) return "today, " + time;
      if (ago === 1) return "yesterday, " + time;
      if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", " + time;
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) { return d.toISOString().slice(0, 16).replace("T", " "); }
  }

  // ---- theme -------------------------------------------------------------------

  function theme() { return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; }

  // The rail's button names the mode it would switch to.
  function updateThemeButton() {
    var btn = $("btn-theme");
    if (!btn) return;
    var dark = theme() === "dark";
    btn.innerHTML = "";
    btn.appendChild(icon(dark ? "sun" : "moon"));
    btn.appendChild(h("span", { class: "rail-label", text: dark ? "Light" : "Dark" }));
    btn.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  }

  // The suite and every open tool share one theme: a change in any of them
  // reaches the rest. fromFrame: the tool that changed it, which needs no telling.
  function setTheme(t, fromFrame) {
    if (t !== "dark" && t !== "light") return;
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("ot-theme", t); } catch (e) {}
    updateThemeButton();
    Object.keys(frames).forEach(function (k) {
      var f = frames[k];
      if (f !== fromFrame && f.ready) send(f, "theme", { theme: t });
    });
  }

  window.addEventListener("storage", function (ev) {
    if (ev.key === "ot-theme" && (ev.newValue === "dark" || ev.newValue === "light") && ev.newValue !== theme()) setTheme(ev.newValue);
  });

  // ---- licence -------------------------------------------------------------

  // The dialog keeps the keyboard inside it (the text and Close) and
  // gives focus back to what opened it. The rail is redrawn whenever a tool
  // says something, so the opener is remembered by what it is, not as a node.
  var modal = null, modalOpener = null;
  function closeModal() {
    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    modal = null;
    var back = modalOpener && (modalOpener.isConnected ? modalOpener
      : modalOpener.getAttribute("data-rail") ? document.querySelector('#suite-bar [data-rail="' + modalOpener.getAttribute("data-rail") + '"]')
      : document.querySelector(".home-legal .link-btn"));
    modalOpener = null;
    if (back && back.offsetParent !== null) back.focus();
  }
  function openLicence() {
    closeModal();
    modalOpener = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    var close = h("button", { class: "btn primary", type: "button", onClick: closeModal, text: "Close" });
    modal = h("div", { class: "modal-backdrop licence-modal" }, [
      h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Licence" }, [
        h("div", { class: "modal-h" }, [h("h2", { text: "Licence" })]),
        h("div", { class: "modal-b", tabindex: "0", "aria-label": "Licence text" }, [
          h("p", { class: "licence-version muted small",
            text: D.product + " " + V.label + " (version " + V.number + "). The licence covers every tool in the suite." }),
          D.licence ? h("pre", { class: "licence-text", text: D.licence })
                    : h("p", { text: LEGAL_NOTICE + " The full licence text is missing from this copy; ask your SolutionsPT engagement contact for it." })
        ]),
        h("div", { class: "modal-f" }, [close])
      ])
    ]);
    modal.addEventListener("click", function (ev) { if (ev.target === modal) closeModal(); });
    modal.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { ev.preventDefault(); closeModal(); }
      // Tab goes between the text (which scrolls) and Close, and no further.
      else if (ev.key === "Tab") { ev.preventDefault(); (document.activeElement === close ? modal.querySelector(".modal-b") : close).focus(); }
    });
    document.body.appendChild(modal);
    close.focus();
  }

  // ---- release notes: a small Markdown subset -------------------------------
  // Headings, paragraphs, bullet lists, tables, **bold**, `code` and http(s)
  // links. Built as DOM nodes, never as HTML text.

  // A long file name may wrap only after a dot, never mid-word.
  function codeEl(text) {
    var c = h("code"), parts = text.split(".");
    parts.forEach(function (p, i) {
      var last = i === parts.length - 1;
      c.appendChild(document.createTextNode(p + (last ? "" : ".")));
      if (!last) c.appendChild(document.createElement("wbr"));
    });
    return c;
  }

  function inline(el, text) {
    var re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\))/g, last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
      if (m[1]) el.appendChild(codeEl(m[1].slice(1, -1)));
      else if (m[2]) el.appendChild(h("strong", { text: m[2].slice(2, -2) }));
      else el.appendChild(h("a", { href: m[5], target: "_blank", rel: "noopener noreferrer", text: m[4] }));
      last = re.lastIndex;
    }
    if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)));
    return el;
  }

  function cells(row) {
    return row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (c) { return c.trim(); });
  }

  function renderMarkdown(md, host) {
    var lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
    var para = [], list = null, i = 0, m;
    function flush() { if (para.length) { host.appendChild(inline(h("p"), para.join(" "))); para = []; } }
    while (i < lines.length) {
      var line = lines[i];
      if (/^\s*$/.test(line)) { flush(); list = null; i++; continue; }
      if ((m = /^(#{1,4})\s+(.*)$/.exec(line))) {
        flush(); list = null;
        host.appendChild(inline(h("h" + Math.min(4, m[1].length + 1)), m[2]));
        i++; continue;
      }
      if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
        flush(); list = null;
        var head = cells(line), rows = [];
        i += 2;
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(cells(lines[i])); i++; }
        var table = h("table", null, [
          h("thead", null, [h("tr", null, head.map(function (c) { return inline(h("th"), c); }))]),
          h("tbody", null, rows.map(function (r) {
            return h("tr", null, head.map(function (c, k) { return inline(h("td"), r[k] || ""); }));
          }))
        ]);
        host.appendChild(h("div", { class: "table-wrap" }, [table]));
        continue;
      }
      if ((m = /^\s*[-*]\s+(.*)$/.exec(line))) {
        flush();
        if (!list) { list = h("ul"); host.appendChild(list); }
        list.appendChild(inline(h("li"), m[1]));
        i++; continue;
      }
      if (list && /^\s{2,}\S/.test(line)) {
        inline(list.lastChild, " " + line.trim());
        i++; continue;
      }
      list = null;
      para.push(line.trim());
      i++;
    }
    flush();
    return host;
  }

  // ---- icons ------------------------------------------------------------------
  // Line icons on a 24-unit grid, drawn in the current text colour.

  var ICONS = {
    home: ["M3.5 10.5 12 3.5l8.5 7", "M5.5 9v11h4.5v-6h4v6h4.5V9"],
    assessments: ["M8.5 4.5H6.5a1.5 1.5 0 0 0-1.5 1.5v13.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5h-2",
                  "M9 3h6v3H9z", "m8.5 13.5 2.5 2.5 4.5-5"],
    "risk-assessment": ["M3 3.5h7v7H3z", "M14 3.5h7v7h-7z", "M8.5 15h7v6h-7z", "M10 7h4", "M6.5 10.5V13H12v2", "M17.5 10.5V13H12"],
    "report-review": ["M4 4.5h16v11.5H10l-6 4.5z", "M8 8.5h8", "M8 12h5"],
    // A page with a folded corner, and a pencil over its lower right.
    documents: ["M5.5 3h8l5 5v4.5", "M13.5 3v5h5", "M5.5 3v18h6", "M8.5 12h5", "M8.5 15.5h3", "m14 20.5.6-2.9 5-5 2.3 2.3-5 5z"],
    moon: ["M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"],
    sun: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 2.5V5", "M12 19v2.5", "M2.5 12H5", "M19 12h2.5",
          "m5.3 5.3 1.8 1.8", "m16.9 16.9 1.8 1.8", "m5.3 18.7 1.8-1.8", "m16.9 7.1 1.8-1.8"],
    licence: ["M6.5 3h7.5l4.5 4.5V21h-12z", "M14 3v4.5h4.5", "M9.5 12h6", "M9.5 15.5h6"],
    folder: ["M3 7.5A2 2 0 0 1 5 5.5h4l2 2h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
    drop: ["M12 3.5v11", "m7.5 10 4.5 4.5 4.5-4.5", "M4.5 20.5h15"],
    chevron: ["m9 5.5 6.5 6.5L9 18.5"],
    down: ["M12 4.5v14", "m6.5 13 5.5 5.5 5.5-5.5"],
    back: ["M9 14 4.5 9.5 9 5", "M4.5 9.5H15a5 5 0 0 1 0 10h-3"]
  };

  function icon(name, cls) {
    var ns = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("class", "ic" + (cls ? " " + cls : ""));
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor");
    s.setAttribute("stroke-width", "1.7");
    s.setAttribute("stroke-linecap", "round");
    s.setAttribute("stroke-linejoin", "round");
    (ICONS[name] || []).forEach(function (d) {
      var p = document.createElementNS(ns, "path");
      p.setAttribute("d", d);
      s.appendChild(p);
    });
    return s;
  }

  function toolIcon(m, small) {
    return h("span", { class: "tool-ic" + (small ? " sm" : ""), "data-module": m.id, "aria-hidden": "true" }, [icon(m.id)]);
  }

  function srOnly(text) { return h("span", { class: "sr-only", text: text }); }

  // ---- the rail -------------------------------------------------------------

  function stateWords(f) {
    if (!f) return "";
    return f.dirty ? "open, with unsaved changes" : "open";
  }

  // The spoken name starts with the visible label whenever the label is not
  // already a word of the full name ("Assess" is not a word of "OT Cyber
  // Assessment Tool"), so a speech user can say what they see.
  function railName(label, full) {
    var words = full.toLowerCase().split(/[^a-z0-9]+/);
    return words.indexOf(label.toLowerCase()) !== -1 ? full : label + ", " + full;
  }

  // A tool's marker: a ring when it is open, a larger filled amber dot when
  // it has unsaved changes. Shape as well as colour, so it reads without colour.
  function railButton(o) {
    var words = stateWords(o.frame);
    var full = o.full + (words ? " (" + words + ")" : "");
    return h("button", {
      type: "button", id: o.id || null, class: "rail-btn" + (o.cls ? " " + o.cls : ""),
      "data-key": o.key || null, "data-rail": o.rail, title: full, "aria-label": railName(o.label, full),
      "aria-current": o.current ? "page" : null, onClick: o.onClick
    }, [
      icon(o.icon),
      h("span", { class: "rail-label", "aria-hidden": "true", text: o.label }),
      o.key ? h("span", { class: "dot" + (o.frame ? (o.frame.dirty ? " dirty" : " open") : ""), "aria-hidden": "true" }) : null
    ]);
  }

  // Redrawn whenever a tool opens, has or clears unsaved changes, or is shown.
  // The button that had the keyboard focus keeps it.
  function renderRail() {
    var rail = $("suite-bar");
    var had = document.activeElement && rail.contains(document.activeElement) ? document.activeElement.getAttribute("data-rail") : null;
    rail.innerHTML = "";

    rail.appendChild(railButton({ rail: "home", icon: "home", label: "Home", full: D.product + " home page",
      current: current === null, onClick: goHome, cls: "bar-home" }));
    // In line with the bottom edge of the header beside it.
    rail.appendChild(h("div", { class: "rail-sep rail-sep-top", role: "presentation" }));

    var tours = [];
    D.modules.forEach(function (m) {
      if (!moduleAvailable(m)) return;
      rail.appendChild(railButton({ rail: m.id, key: m.id, icon: m.id, label: m.navLabel || m.shortName || m.name, full: m.name,
        frame: frames[m.id], current: current === m.id, cls: "bar-tab", onClick: function () { openTool(m.id); } }));
      var tk = m.id + "/tour";
      if (frames[tk]) tours.push({ m: m, key: tk });
    });
    // A tour that is open: its tool's icon, labelled Tour. A tour's changes
    // are never kept, so it has no unsaved changes to mark.
    if (tours.length) {
      rail.appendChild(h("div", { class: "rail-sep", role: "presentation" }));
      tours.forEach(function (t) {
        rail.appendChild(railButton({ rail: t.key, key: t.key, icon: t.m.id, label: "Tour", full: t.m.name + " tour",
          frame: frames[t.key], current: current === t.key, cls: "bar-tab is-tour", onClick: function () { openTool(t.key); } }));
      });
    }

    rail.appendChild(h("div", { class: "rail-spacer" }));
    rail.appendChild(h("button", { type: "button", id: "btn-theme", class: "rail-btn", "data-rail": "theme",
      onClick: function () { setTheme(theme() === "dark" ? "light" : "dark"); } }));
    rail.appendChild(railButton({ rail: "licence", id: "btn-licence", icon: "licence", label: "Licence", full: "Read the licence", onClick: openLicence }));
    updateThemeButton();

    if (had) {
      var back = rail.querySelector('[data-rail="' + had + '"]');
      if (back) back.focus();
    }
  }

  // ---- the home page --------------------------------------------------------
  //
  // Redrawn whenever a tool says something while the home page is showing, so
  // what is folded open is remembered here rather than in the page.

  var unfolded = {};        // "when:<id>": the tool card's "When to use it"
  var notesOpen = null;     // What's new; decided the first time it is drawn
  var NOTES_SEEN_KEY = "spt-suite:notes-seen:v1";

  function fold(key, summary, body, cls) {
    var d = h("details", { class: cls || null, open: !!unfolded[key] }, [h("summary", null, summary)].concat(body));
    d.addEventListener("toggle", function () { unfolded[key] = d.open; });
    return d;
  }

  function toolCard(m) {
    var f = frames[m.id];
    var tourNote = tourAvailable(m) && m.tour.note ? h("span", { id: "tour-note-" + m.id, class: "sr-only", text: m.tour.note }) : null;
    return h("section", { class: "tool-card", "data-module": m.id, "aria-labelledby": "tool-h-" + m.id }, [
      h("div", { class: "tool-card-top" }, [
        toolIcon(m),
        h("h2", { id: "tool-h-" + m.id, text: m.name })
      ]),
      h("p", { class: "tool-summary", text: m.summary }),
      h("div", { class: "tool-actions" }, [
        h("button", { type: "button", class: "btn primary tool-open", onClick: function () { openTool(m.id); } },
          [f ? "Go back to it" : "Open", srOnly(" the " + m.name)]),
        tourAvailable(m) ? h("button", { type: "button", class: "link-btn tool-tour", title: m.tour.note || "",
          "aria-describedby": tourNote ? "tour-note-" + m.id : null,
          onClick: function () { openTool(m.id + "/tour"); } }, [m.tour.label || "Take the tour", srOnly(" of the " + m.name)]) : null,
        tourNote,
        f && f.dirty ? h("span", { class: "tool-state", text: "Unsaved changes" }) : null
      ]),
      fold("when:" + m.id, [icon("chevron", "chev"), "When to use it", srOnly(" the " + m.name)], [h("p", { text: m.useWhen })], "tool-when help-tool")
    ]);
  }

  // Opens files where a dropped one would go. In the single-file build and
  // the exe the tools share this page's origin, so the file's handle goes with
  // it and the tool can save back to the same file, as it does after its own
  // Load. The folder build cannot pass a handle into a tool's frame, so it
  // reads the file and hands over its contents, as a drop does.
  function openFileButton() {
    var input = h("input", { type: "file", accept: ".json,application/json", multiple: true, class: "sr-only", tabindex: "-1", "aria-hidden": "true" });
    input.addEventListener("change", function () {
      var files = Array.prototype.slice.call(input.files || []);
      input.value = "";
      openDropped(files);
    });
    function pick() {
      if (!BUNDLE || typeof window.showOpenFilePicker !== "function") { input.click(); return; }
      window.showOpenFilePicker({ multiple: true, types: [{ description: "Project file, document file, review pack or review file", accept: { "application/json": [".json"] } }] })
        .then(function (handles) {
          return Promise.all(handles.map(function (hd) {
            return hd.getFile().then(function (file) { file.__sptHandle = hd; return file; });
          }));
        })
        .then(function (files) { openDropped(files); },
              function (e) { if (!e || e.name !== "AbortError") toast("The file could not be opened: " + ((e && e.message) || e) + ".", "err"); });
    }
    return h("span", null, [
      input,
      h("button", { type: "button", class: "btn small recent-pick", title: "Open a project file, document file, review pack or review file in the tool that reads it",
        onClick: pick }, [icon("folder"), "Open a file"])
    ]);
  }

  function recentCard() {
    var list = readRecent();
    var body;
    if (!list.length) {
      body = h("div", { class: "recent-empty" }, [
        icon("drop"),
        h("p", { text: "Project files, document files, review packs and review files you open or save in a tool appear here." }),
        h("p", { text: "Drop one anywhere in the suite and it opens in the right tool." })
      ]);
    } else {
      body = h("ul", { class: "recent-list" }, list.map(function (e) {
        var m = modulesById[e.module];
        var meta = [];
        var kind = recentKind(e);
        if (kind) meta.push(kind);
        if (e.label) meta.push(e.label);
        meta.push(m.shortName || m.name);
        var w = when(e.when);
        return h("li", { class: "recent-item" }, [
          h("button", { type: "button", class: "recent-open", "data-recent": e.module + "|" + e.name,
            title: "Open " + e.name + " in the " + m.name, onClick: function () { openRecent(e); } }, [
            toolIcon(m, true),
            h("span", { class: "recent-text" }, [
              h("span", { class: "recent-name", text: e.name }),
              h("span", { class: "recent-meta", text: meta.join(" · ") })
            ]),
            w ? h("span", { class: "recent-when", text: (e.action === "save" ? "Saved " : "Opened ") + w }) : null
          ])
        ]);
      }));
    }
    return h("section", { class: "card recent-card", "aria-labelledby": "recent-h" }, [
      h("div", { class: "card-h" }, [
        h("h2", { id: "recent-h", text: "Recent files" }),
        h("div", { class: "card-h-actions" }, [
          list.length ? h("button", { type: "button", class: "link-btn small recent-clear", onClick: clearRecent, text: "Clear the list" }) : null,
          openFileButton()
        ])
      ]),
      body,
      h("div", { class: "recent-foot", text: list.length
        ? "The list holds each file's name, its customer, system or document title and the time, not its contents. Picking one switches to its tool, which offers to reopen the file if the browser still has access to it, or shows where to load it from."
        : "The list holds each file's name, its customer, system or document title and the time, not its contents." })
    ]);
  }

  // Each tool, and the file that passes from one to the next. The Document
  // Tool comes last and apart, with no arrow: no file passes to or from it.
  function helpCard() {
    var by = function (id) { return modulesById[id] && moduleAvailable(modulesById[id]) ? modulesById[id] : null; };
    var risk = by("risk-assessment"), assess = by("assessments"), review = by("report-review"), docs = by("documents");
    function step(m, what, apart) {
      return h("li", { class: "flow-step" + (apart ? " flow-apart" : ""), "data-module": m.id }, [
        toolIcon(m, true),
        h("span", { class: "flow-text" }, [h("span", { class: "flow-name", text: m.name }), h("span", { class: "flow-what", text: what })])
      ]);
    }
    function link(arrow, file, note) {
      return h("li", { class: "flow-link" }, [
        h("span", { class: "flow-arrow" }, [icon(arrow)]),
        h("span", { class: "flow-file" }, [h("strong", { text: file }), h("span", { text: note })])
      ]);
    }
    var flow = [];
    if (risk) {
      flow.push(step(risk, "Zones and conduits, and a target security level for each."));
      if (assess) flow.push(link("down", "Risk context file", "Imported into an IEC 62443-3-3 assessment with Import risk context, on its Engagement details page."));
    }
    if (assess) flow.push(step(assess, "Answers and evidence against the framework, then the Word report and Excel tracker."));
    if (review && (risk || assess)) {
      flow.push(link("down", "Review pack", risk && assess ? "Sent from either tool with Send for review." : "Sent with Send for review."));
      flow.push(step(review, "A colleague comments on the report and the engagement behind it, and gives a verdict."));
      flow.push(link("back", "Review file", "Goes back to the author, who brings the comments in with Import review files."));
    }
    if (docs) flow.push(step(docs, "Proposals, method statements and other documents in the SolutionsPT template, written here or brought in from a Word file. It works on its own: no file passes between it and the other tools.", true));
    // Dropping files is said by the empty Recent files; once the list has
    // entries, this is the only place that says it.
    var tips = [];
    if (readRecent().length) tips.push("Drop a project file, document file, review pack or review file anywhere in the suite and it opens in the right tool.");
    tips.push("A tool you leave keeps your work until you close the suite. In the rail, a ring on a tool means it is open and a filled amber dot means it has unsaved changes. The suite asks before closing while any tool has them.");
    return h("section", { class: "card help-card", "aria-labelledby": "help-h" }, [
      h("div", { class: "card-h" }, [h("h2", { id: "help-h", text: "How the tools fit together" })]),
      h("div", { class: "card-b" }, [
        h("ol", { class: "flow" }, flow),
        h("ul", { class: "help-tips" }, tips.map(function (t) { return h("li", { text: t }); })),
        BUNDLE ? null : h("p", { class: "help-dev muted small", text: "This is the developer copy of the suite, run from its folder. The browser does not let a tool save back into the same file here, so Save downloads a new copy each time." })
      ])
    ]);
  }

  // What's new opens by itself the first time this version's notes are on
  // show, and is folded away after that until someone opens it. They count as
  // seen only once the home page has actually been shown (markNotesSeen).
  function notesCard() {
    var n = D.releaseNotes;
    if (!n || !n.markdown) return null;
    if (notesOpen === null) {
      var seen = null;
      try { seen = localStorage.getItem(NOTES_SEEN_KEY); } catch (e) {}
      notesOpen = seen !== n.version;
    }
    var d = h("details", { open: notesOpen }, [
      h("summary", null, [
        icon("chevron", "chev"),
        h("h2", { text: "What's new in " + n.label }),
        h("span", { class: "notes-hint", "aria-hidden": "true", text: notesOpen ? "Hide" : "Show" })
      ]),
      renderMarkdown(n.markdown, h("div", { class: "card-b notes" }))
    ]);
    d.addEventListener("toggle", function () {
      notesOpen = d.open;
      d.querySelector(".notes-hint").textContent = d.open ? "Hide" : "Show";
      markNotesSeen();
    });
    return h("section", { class: "card notes-card" }, [d]);
  }

  function markNotesSeen() {
    var n = D.releaseNotes;
    if (n && n.version) try { localStorage.setItem(NOTES_SEEN_KEY, n.version); } catch (e) {}
  }

  function renderHome() {
    var main = $("home-main");
    var scroll = $("home").scrollTop;
    var had = document.activeElement && main.contains(document.activeElement) ? focusKey(document.activeElement) : null;
    main.innerHTML = "";
    main.appendChild(h("h1", { class: "page-title", text: "Choose a tool" }));
    main.appendChild(h("div", { class: "tool-grid" }, D.modules.filter(moduleAvailable).map(toolCard)));
    // Recent files on the left, the wider column; how the tools fit together
    // on the right. One column when narrow, in that order. What's new below,
    // across both.
    main.appendChild(h("div", { class: "home-cols" }, [recentCard(), helpCard()]));
    var notes = notesCard();
    if (notes) main.appendChild(notes);
    main.appendChild(h("footer", { class: "home-legal" }, [
      h("p", { class: "home-version", text: D.product + " " + V.label }),
      h("p", null, [LEGAL_NOTICE + " ", h("button", { type: "button", class: "link-btn", onClick: openLicence, text: "Read the licence" })])
    ]));
    $("home").scrollTop = scroll;
    if (had) {
      // A control that is gone (Clear the list removes itself) hands focus to
      // Open a file, next to where it was.
      var back = main.querySelector(had) || main.querySelector(".recent-pick");
      if (back) back.focus();
    }
  }

  // Where the keyboard focus was on the home page, as a selector that finds
  // the same control after a redraw.
  function focusKey(el) {
    function esc(v) { return window.CSS && CSS.escape ? CSS.escape(v) : String(v).replace(/["\\]/g, "\\$&"); }
    if (el.hasAttribute("data-recent")) return '.recent-open[data-recent="' + esc(el.getAttribute("data-recent")) + '"]';
    var card = el.closest(".tool-card");
    var scope = card ? '.tool-card[data-module="' + card.getAttribute("data-module") + '"] ' : "";
    var cls = ["tool-open", "tool-tour", "recent-pick", "recent-clear"].filter(function (c) { return el.classList.contains(c); })[0];
    if (cls) return scope + "." + cls;
    if (el.tagName === "SUMMARY") return card ? scope + "summary" : ".notes-card summary";
    if (el.closest(".home-legal")) return ".home-legal .link-btn";
    return null;
  }

  // ---- start -------------------------------------------------------------------

  (function start() {
    var name = $("suite-name");
    if (name) {
      name.textContent = D.shortName || D.product;
      if (V.label) name.appendChild(h("span", { class: "version-badge", title: D.product + " version " + V.number, text: V.label }));
    }
    document.title = D.product;
    document.body.appendChild(h("div", { class: "drop-overlay", "aria-hidden": "true" }, [
      h("div", { class: "drop-msg" }, [icon("drop"), h("strong", { text: "Drop to open" }),
        h("span", { text: "Each file opens in the tool that reads it." })])
    ]));
    renderRail();
    renderHome();
    // #open=<id> or #open=<id>/tour opens a tool straight away.
    var m = /^#open=([\w\-\/]+)$/.exec(location.hash || "");
    if (m && openTool(m[1])) return;
    markNotesSeen();
  })();

  // For the suite's check page and the exe self-test.
  window.Suite.Shell = {
    open: openTool,
    home: goHome,
    current: function () { return current; },
    frames: frames,
    openRecent: openRecent,
    openDropped: openDropped,
    fileKind: fileKind,
    readRecent: readRecent,
    clearRecent: clearRecent,
    payloadHtml: payloadHtml,
    setTheme: setTheme,
    openLicence: openLicence,
    renderMarkdown: renderMarkdown,
    when: when,
    bundled: !!BUNDLE,
    RECENT_KEY: RECENT_KEY
  };
})();
