/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* suite.js - the SolutionsPT OT Cyber Suite shell.
 *
 * A home page with a card per tool, and, once a tool is opened, that tool in a
 * frame under a slim bar (Home, the tool's name, a switcher). Each tool runs
 * exactly as it does on its own, in its own frame: the two tools define the
 * same global names, so they could not share one page, and the frame keeps
 * every tool's behaviour identical inside and outside the suite. A tool that
 * is left stays open and hidden, so switching never loses work. Each tool
 * still saves and loads its own files: a project file in the assessment and
 * risk tools, a review pack and review file in the Report Review Tool.
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
    toastTimer = setTimeout(function () { t.className = "toast hidden"; }, 6000);
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
          if (f.loading) f.loading.textContent = "The " + displayName(f) + " could not be opened: " + (err.message || err) + ".";
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

  function send(f, type, data) {
    try { f.el.contentWindow.postMessage({ protocol: PROTOCOL, from: "suite", type: type, data: data || {} }, "*"); } catch (e) {}
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
    renderBar();
    if (key === null) {
      document.title = D.product;
      renderHome();
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
    // not count (no bar tag, no close warning) and its saves are not recent files.
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
    renderBar();
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

  // What sort of file a recent entry is, for the list: what the tool said,
  // or, for the Report Review Tool, read from the names it gives its files.
  function recentKind(e) {
    if (e.kind) return e.kind;
    if (e.module !== "report-review") return "";
    if (/-review-pack-round-\d+/i.test(e.name)) return "Review pack";
    if (/-review-round-\d+-/i.test(e.name)) return "Review file";
    return "";
  }

  // ---- files handed over, and files dropped on the suite ----------------------
  //
  // The contents go straight to the tool that opens them (open-text, see
  // shared/host-bridge.js) and are never kept here. postMessage carries them
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
      hint: "Import it in the 62443-3-3 assessment in the OT Cyber Assessment Tool." };
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
    if (from.tour) { toast("This is a tour, so its files stay in it.", "err"); return; }
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
  // other than the Report Review Tool takes one project file at a time. A
  // review file dropped on the author's own tool (not its tour) is the author
  // bringing it in: it goes to that tool, whose review card imports it.
  function openDropped(files, from) {
    var author = from && !from.tour && AUTHOR_TOOLS[from.module.id] ? from.module : null;
    files = (files || []).filter(function (x) { return x && typeof x.name === "string"; });
    if (!files.length) return Promise.resolve([]);
    return Promise.all(files.map(function (file) {
      if (typeof file.size === "number" && file.size > FILE_MAX) return Promise.resolve({ name: file.name, text: null });
      return Promise.resolve().then(function () { return file.text(); })
        .then(function (text) { return { name: file.name, text: text }; }, function () { return { name: file.name, text: null }; });
    })).then(function (got) {
      var byTool = {}, order = [], notes = [], projects = {};
      got.forEach(function (g) {
        var k = g.text === null ? null : fileKind(g.text);
        var toAuthor = !!(author && k && k.what === "review file");
        var m = toAuthor ? author : k && k.module ? modulesById[k.module] : null;
        if (k && !k.module) { notes.push(g.name + " is a " + k.what + ". " + k.hint); return; }
        if (!m || !moduleAvailable(m)) {
          notes.push(g.name + (/^PK/.test(g.text || "") ? " is a Word or Excel file, which the suite does not open."
            : " is not a file the suite opens. Open it with Load in its own tool."));
          return;
        }
        if (!byTool[m.id]) { byTool[m.id] = []; order.push(m.id); }
        if (m.id !== "report-review" && !toAuthor) {
          if (projects[m.id]) { notes.push(g.name + " was left out: drop one project file at a time."); return; }
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
        byTool[id].forEach(function (g) { deliver(id, "open-text", { name: g.name, text: g.text }); });
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
  // bar in place of the suite, and the exe silently does nothing.
  document.addEventListener("dragover", function (e) {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    try { e.dataTransfer.dropEffect = "copy"; } catch (x) {}
    document.body.classList.add("drop-over");
  });
  document.addEventListener("dragleave", function (e) {
    if (!e.relatedTarget) document.body.classList.remove("drop-over");
  });
  document.addEventListener("drop", function (e) {
    document.body.classList.remove("drop-over");
    if (!isFileDrag(e)) return;
    e.preventDefault();
    openDropped(Array.prototype.slice.call(e.dataTransfer.files || []));
  });

  function when(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    try {
      return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return d.toISOString().slice(0, 16).replace("T", " "); }
  }

  // ---- theme -------------------------------------------------------------------

  function theme() { return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; }

  function updateThemeButton() {
    var btn = $("btn-theme");
    if (!btn) return;
    var dark = theme() === "dark";
    btn.textContent = dark ? "☀ Light" : "☾ Dark";   // the mode you would switch to
    btn.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
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

  var modal = null;
  function closeModal() { if (modal && modal.parentNode) modal.parentNode.removeChild(modal); modal = null; }
  function openLicence() {
    closeModal();
    var close = h("button", { class: "btn primary", type: "button", onClick: closeModal, text: "Close" });
    modal = h("div", { class: "modal-backdrop licence-modal" }, [
      h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Licence" }, [
        h("div", { class: "modal-h" }, [h("h2", { text: "Licence" })]),
        h("div", { class: "modal-b" }, [
          h("p", { class: "licence-version muted small",
            text: D.product + " " + V.label + " (version " + V.number + "). The licence covers every tool in the suite." }),
          D.licence ? h("pre", { class: "licence-text", text: D.licence })
                    : h("p", { text: LEGAL_NOTICE + " The full licence text is missing from this copy; ask your SolutionsPT engagement contact for it." })
        ]),
        h("div", { class: "modal-f" }, [close])
      ])
    ]);
    modal.addEventListener("click", function (ev) { if (ev.target === modal) closeModal(); });
    modal.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { ev.preventDefault(); closeModal(); } });
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

  // ---- the bar --------------------------------------------------------------

  function houseIcon() {
    var ns = "http://www.w3.org/2000/svg";
    var s = document.createElementNS(ns, "svg");
    s.setAttribute("viewBox", "0 0 16 16");
    s.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", "M8 1.5 1 7.6l1 1.1.9-.8V14.5h4.2v-4h1.8v4h4.2V7.9l.9.8 1-1.1z");
    p.setAttribute("fill", "currentColor");
    s.appendChild(p);
    return s;
  }

  function stateWords(f) {
    if (!f) return "";
    return f.dirty ? "open, with unsaved changes" : "open";
  }

  function renderBar() {
    var bar = $("suite-bar");
    if (current === null) { bar.classList.add("hidden"); bar.innerHTML = ""; return; }
    bar.classList.remove("hidden");
    bar.innerHTML = "";
    var f = frames[current];

    bar.appendChild(h("button", {
      type: "button", class: "bar-btn bar-home", title: "Back to the " + D.product + " home page",
      "aria-label": "Home: " + D.product, onClick: goHome
    }, [houseIcon(), h("span", { class: "bar-suite-name", text: D.shortName || D.product })]));
    bar.appendChild(h("span", { class: "bar-sep", "aria-hidden": "true", text: "›" }));
    bar.appendChild(h("span", { class: "bar-current", "aria-current": "page" }, [
      h("span", { class: "bar-name bar-name-full", text: f.module.name }),
      h("span", { class: "bar-name bar-name-short", text: f.module.shortName || f.module.name }),
      f.tour ? h("span", { class: "bar-tag", text: "Tour" }) : null,
      f.dirty ? h("span", { class: "bar-tag dirty", title: "This tool has changes that are not saved to its file yet.", text: "Unsaved changes" }) : null
    ]));
    bar.appendChild(h("span", { class: "bar-spacer" }));

    // Every other tool, and any tour that is open.
    var others = [];
    D.modules.forEach(function (m) {
      if (!moduleAvailable(m)) return;
      if (m.id !== current) others.push({ key: m.id, label: m.shortName || m.name, full: m.name });
      var tk = m.id + "/tour";
      if (frames[tk] && tk !== current) others.push({ key: tk, label: (m.shortName || m.name) + " tour", full: m.name + " tour" });
    });
    if (others.length) {
      var nav = h("div", { class: "bar-switch", role: "group", "aria-label": "Switch to another tool" }, [
        h("span", { class: "bar-switch-label", text: "Switch to" })
      ]);
      others.forEach(function (o) {
        var of = frames[o.key];
        var words = stateWords(of);
        nav.appendChild(h("button", {
          type: "button", class: "bar-btn bar-tab", "data-key": o.key,
          title: o.full + (words ? " (" + words + ")" : ""), onClick: function () { openTool(o.key); }
        }, [
          h("span", { class: "dot" + (of ? (of.dirty ? " dirty" : " open") : ""), "aria-hidden": "true" }),
          h("span", { text: o.label }),
          words ? h("span", { class: "sr-only", text: ", " + words }) : null
        ]));
      });
      bar.appendChild(nav);
    }
  }

  // ---- the home page --------------------------------------------------------

  function toolCard(m) {
    var f = frames[m.id];
    return h("section", { class: "tool-card", "data-module": m.id }, [
      h("div", { class: "tool-card-top" }, [
        h("h2", { text: m.name }),
        f ? h("div", { class: "tool-chips" }, [
          f.dirty ? h("span", { class: "chip dirty", text: "Unsaved changes" }) : h("span", { class: "chip open", text: "Open" })
        ]) : null
      ]),
      h("p", { text: m.summary }),
      h("div", { class: "tool-actions" }, [
        h("button", { type: "button", class: "btn primary tool-open", onClick: function () { openTool(m.id); }, text: f ? "Return to it" : "Open" }),
        tourAvailable(m) ? h("button", { type: "button", class: "link-btn tool-tour", title: m.tour.note || "",
          onClick: function () { openTool(m.id + "/tour"); }, text: m.tour.label || "Take the tour" }) : null
      ])
    ]);
  }

  function recentCard() {
    var list = readRecent();
    var body;
    if (!list.length) {
      body = h("p", { class: "recent-empty", text: "Project files, review packs and review files you open or save in a tool appear here, so you can go back to one in a click." });
    } else {
      body = h("ul", { class: "recent-list" }, list.map(function (e) {
        var m = modulesById[e.module];
        var meta = [m.name];
        var kind = recentKind(e);
        if (kind) meta.push(kind);
        if (e.label) meta.push(e.label);
        var w = when(e.when);
        if (w) meta.push((e.action === "save" ? "Saved " : "Opened ") + w);
        return h("li", { class: "recent-item" }, [
          h("button", { type: "button", class: "recent-open", title: "Open " + e.name + " in the " + m.name,
            onClick: function () { openRecent(e); } }, [
            h("span", { class: "recent-text" }, [
              h("span", { class: "recent-name", text: e.name }),
              h("span", { class: "recent-meta", text: meta.join("  ·  ") })
            ]),
            h("span", { class: "recent-go", "aria-hidden": "true", text: "Open" })
          ])
        ]);
      }));
    }
    return h("section", { class: "card recent-card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "Recent files" }),
        list.length ? h("button", { type: "button", class: "link-btn small recent-clear", onClick: clearRecent, text: "Clear the list" }) : null
      ]),
      body,
      h("div", { class: "recent-foot" }, [
        "Only the file name, the customer and the date are kept here, never what a file contains. Opening one switches to its tool, which offers to reopen the file where the browser still has access to it, or shows you where to load it from. A review file opened before its pack waits for the pack."
      ])
    ]);
  }

  function helpCard() {
    var tips = [
      "Each tool saves and loads its own files with the buttons in its own header, just as it does on its own: a project file in the assessment and risk tools, a review pack and your review file in the Report Review Tool.",
      "You can also drop a project file, review pack or review file anywhere on the suite: it opens in the tool that reads it.",
      "Switching keeps your work: a tool you leave stays open in the background until you close the suite.",
      "The bar at the top marks a tool with unsaved changes, and the suite asks before it closes while any tool has them."
    ];
    if (!BUNDLE) tips.push("This is the developer copy of the suite, run from its folder. The browser does not let a tool save back into the same file here, so Save downloads a new copy each time.");
    return h("section", { class: "card help-card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Getting started" })]),
      h("div", { class: "card-b" }, D.modules.filter(moduleAvailable).map(function (m) {
        return h("div", { class: "help-tool", "data-module": m.id }, [
          h("h3", { text: m.name }),
          h("p", { text: m.useWhen }),
          h("div", { class: "help-links" }, [
            h("button", { type: "button", class: "link-btn", onClick: function () { openTool(m.id); }, text: "Open it" }),
            tourAvailable(m) ? h("button", { type: "button", class: "link-btn help-tour", title: m.tour.note || "",
              onClick: function () { openTool(m.id + "/tour"); }, text: m.tour.label || "Take the tour" }) : null
          ])
        ]);
      }).concat([h("ul", { class: "help-tips" }, tips.map(function (t) { return h("li", { text: t }); }))]))
    ]);
  }

  function notesCard() {
    var n = D.releaseNotes;
    if (!n || !n.markdown) return null;
    return h("section", { class: "card notes-card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "What's new in " + n.label }),
        h("span", { class: "card-h-note", text: "Release notes" })
      ]),
      renderMarkdown(n.markdown, h("div", { class: "card-b notes" }))
    ]);
  }

  function renderHome() {
    var main = $("home-main");
    var scroll = $("home").scrollTop;
    main.innerHTML = "";
    main.appendChild(h("h1", { class: "page-title", text: "Choose a tool" }));
    main.appendChild(h("p", { class: "page-sub", text:
      "Open a tool to work in it here. The bar at the top of a tool takes you back to this page or straight to another tool, and a tool you leave stays open with your work in it." }));
    main.appendChild(h("div", { class: "tool-grid" }, D.modules.filter(moduleAvailable).map(toolCard)));
    // Recent files and What's new on the left, the wider column (the notes
    // carry a table); getting started on the right. One column when narrow,
    // in reading order: recent files, getting started, then what's new
    // (grid areas in suite.css).
    main.appendChild(h("div", { class: "home-cols" }, [recentCard(), helpCard(), notesCard()]));
    main.appendChild(h("footer", { class: "home-legal" }, [
      h("p", { class: "home-version", text: D.product + " " + V.label }),
      h("p", null, [LEGAL_NOTICE + " ", h("button", { type: "button", class: "link-btn", onClick: openLicence, text: "Read the licence" })])
    ]));
    $("home").scrollTop = scroll;
  }

  // ---- start -------------------------------------------------------------------

  (function start() {
    var name = $("suite-name");
    if (name) {
      name.textContent = D.shortName || D.product;
      if (V.label) name.appendChild(h("span", { class: "version-badge", title: D.product + " version " + V.number, text: V.label }));
    }
    document.title = D.product;
    updateThemeButton();
    $("btn-theme").addEventListener("click", function () { setTheme(theme() === "dark" ? "light" : "dark"); });
    $("btn-licence").addEventListener("click", openLicence);
    renderHome();
    // #open=<id> or #open=<id>/tour opens a tool straight away.
    var m = /^#open=([\w\-\/]+)$/.exec(location.hash || "");
    if (m) openTool(m[1]);
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
    bundled: !!BUNDLE,
    RECENT_KEY: RECENT_KEY
  };
})();
