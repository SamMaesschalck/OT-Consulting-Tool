/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* app.js - the OT Cyber Report Review Tool.
 *
 * A reviewer opens a review pack (spt-review-pack, written by the assessment or
 * risk tool), reads the report as the client will, looks behind it at the
 * engagement, and saves their own small review file (spt-review). They never
 * touch anyone else's work: the author merges each reviewer's file by comment
 * id. Offline, no server. See docs/report-review.md.
 *
 * Nothing here depends on any other module; the pack is the whole contract.
 */
(function () {
  "use strict";

  var A = window.App, RC = A.ReviewCore, RK = A.ReviewChecks, V = A.Version;
  var HB = function () { return A.HostBridge && A.HostBridge.hosted ? A.HostBridge : null; };

  var LEGAL_NOTICE = "© 2026 SolutionsPT. All rights reserved. Proprietary and confidential. " +
    "Licensed only for work commissioned by SolutionsPT; it may not be resold, shared or used for any other client or purpose. See the licence below for the full terms.";
  var LEGAL_SHORT = "© 2026 SolutionsPT. All rights reserved.";

  // localStorage keys. All this tool's own, so they cannot touch another
  // module's data; "ot-theme" alone is shared, on purpose.
  var KEY_REVIEWER = "spt-review:reviewer:v1";
  var KEY_NAMES = "spt-review:names:v1";
  var KEY_AUTOSAVE = "spt-review:autosave:v1:";   // + pack id

  var TOUR_MODE = /[?&]tour(=|&|$)/.test(location.search) || !!(A.HostBridge && A.HostBridge.launch && A.HostBridge.launch.tour);

  var state = {
    pack: null,
    review: null,
    page: "welcome",
    docIndex: 0,
    composer: null,      // the comment being written; see openComposer
    itemFilter: "all",
    itemTarget: "",
    itemSearch: "",
    checks: null,
    jump: null,
    showDismissed: false,
    restore: null,
    handle: null,
    dirty: false
  };

  // ---------- DOM helpers ----------
  function $(id) { return document.getElementById(id); }
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") el.textContent = v;
      else if (k === "class") el.className = v;
      else if (k === "onClick") el.addEventListener("click", v);
      else if (k === "onInput") el.addEventListener("input", v);
      else if (k === "onChange") el.addEventListener("change", v);
      else if (k === "value") el.value = v;
      else el.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(function (c) {
      if (c == null || c === false) return;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }
  function card(title, sub, kids) {
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: title }), sub ? h("span", { class: "sub", text: sub }) : null]),
      h("div", { class: "card-b" }, kids)
    ]);
  }
  var toastTimer = null;
  function toast(msg, kind) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast" + (kind ? " " + kind : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast hidden"; }, 4200);
  }
  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso || "");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  // ---------- theme ----------
  function currentTheme() { return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    lsSet("ot-theme", theme);
    var btn = $("btn-theme");
    if (btn) {
      var dark = theme === "dark";
      btn.textContent = dark ? "☀ Light" : "☾ Dark";
      btn.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
    }
  }

  // ---------- unsaved work ----------
  var autosaveTimer = null, autosaveBroken = false;
  function updateSaveButton() {
    if (A.HostBridge) A.HostBridge.setDirty(state.dirty);
    var b = $("btn-save");
    if (!b) return;
    b.textContent = state.dirty ? "Save*" : "Save";
    b.classList.toggle("btn-unsaved", state.dirty);
    if (state.review) b.removeAttribute("disabled"); else b.setAttribute("disabled", "");
  }
  function markClean() { state.dirty = false; updateSaveButton(); }
  function touched() {
    state.dirty = true;
    updateSaveButton();
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(writeAutosave, 800);
  }
  // The crash net. One entry per pack, holding the review only: the pack itself
  // is a file the reviewer already has. Inert in the demo.
  function writeAutosave() {
    if (TOUR_MODE || !state.review) return;
    if (!lsSet(KEY_AUTOSAVE + state.pack.packId, JSON.stringify({ savedOn: new Date().toISOString(), review: state.review })) && !autosaveBroken) {
      autosaveBroken = true;
      toast("Autosave is not available here (browser storage blocked or full). Save to a file regularly.", "err");
    }
  }
  function clearAutosave() { if (!TOUR_MODE && state.pack) lsDel(KEY_AUTOSAVE + state.pack.packId); }
  function hasWork(r) {
    return !!(r && ((r.comments && r.comments.length) || (r.verdict && r.verdict.value !== "none") ||
      (r.checklist && r.checklist.some(function (c) { return c.answer || c.note; })) || (r.confirmations && r.confirmations.length)));
  }

  // ---------- the reviewer's name ----------
  // Asked once, then remembered in this browser.
  function reviewerName() { return RC.norm(lsGet(KEY_REVIEWER)); }
  function withReviewerName(cb) {
    var n = reviewerName();
    if (state.review && state.review.reviewer) { cb(state.review.reviewer); return; }
    if (n) { if (state.review) state.review.reviewer = n; cb(n); return; }
    askName(cb);
  }
  function askName(cb, current) {
    var input = h("input", { type: "text", id: "rr-name-input", value: current || "", "aria-label": "Your name", placeholder: "For example J. Marsh" });
    function go() {
      var v = RC.norm(input.value);
      if (!v) { input.focus(); return; }
      lsSet(KEY_REVIEWER, v);
      if (state.review) {
        state.review.reviewer = v;
        state.review.comments.forEach(function (c) { c.reviewer = v; });
      }
      document.body.removeChild(back);
      if (cb) cb(v);
      render();
    }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    var back = h("div", { class: "rr-modal-back" }, [h("div", { class: "rr-modal", role: "dialog", "aria-label": "Your name" }, [
      h("h2", { text: "Your name" }),
      h("div", { text: "It goes on your comments and on your review file, so the author knows who said what. This browser remembers it." }),
      input,
      h("div", { class: "btn-row" }, [h("button", { type: "button", class: "btn primary", id: "rr-name-ok", text: "Carry on", onClick: go })])
    ])]);
    document.body.appendChild(back);
    try { input.focus(); } catch (e) {}
  }

  // ---------- opening files ----------
  function newReview(pack) {
    var name = reviewerName();
    return {
      schema: RC.fileSchema(), packId: pack.packId, reviewId: pack.reviewId || "", round: pack.round || 1,
      fileId: RC.newId("rf"), reviewer: name, savedAt: null,
      savedBy: { product: V.product, version: V.number },
      verdict: { value: "none", date: "", note: "" },
      checklist: [], dismissedChecks: [], confirmations: [], comments: []
    };
  }
  function openPack(pack) {
    state.pack = pack;
    state.review = newReview(pack);
    state.page = "report";
    state.docIndex = 0;
    state.composer = null;
    state.checks = null;
    state.itemTarget = "";
    state.handle = null;
    state.restore = null;
    if (!TOUR_MODE) {
      var raw = lsGet(KEY_AUTOSAVE + pack.packId), snap = raw ? RC.parseJson(raw) : null;
      if (snap && snap.review && snap.review.packId === pack.packId && hasWork(snap.review)) state.restore = snap;
    }
    markClean();
  }
  function openReviewFile(file, handle) {
    if (!state.pack) { toast("Open the review pack first, then your review file.", "warn"); return false; }
    if (file.packId !== state.pack.packId) {
      toast("This review file answers a different pack" + (file.round ? " (round " + file.round + ")" : "") + ", not the one that is open.", "err");
      return false;
    }
    state.review = file;
    ["checklist", "dismissedChecks", "confirmations", "comments"].forEach(function (k) { if (!Array.isArray(file[k])) file[k] = []; });
    if (!file.verdict) file.verdict = { value: "none", date: "", note: "" };
    if (!file.fileId) file.fileId = RC.newId("rf");
    state.handle = handle || null;
    state.restore = null;
    state.composer = null;
    clearAutosave();
    markClean();
    return true;
  }

  // texts: [{ name, text, handle }]. Packs first, so a pack and a review file
  // dropped together open in the right order. Returns the number opened.
  function loadTexts(texts) {
    var parsed = [], opened = 0;
    texts.forEach(function (f) {
      var id = RC.identify(f.text);
      if (!id.ok) { toast(f.name + ": " + id.error, "err"); return; }
      parsed.push({ name: f.name, id: id, handle: f.handle });
    });
    parsed.sort(function (a, b) { return (a.id.kind === "pack" ? 0 : 1) - (b.id.kind === "pack" ? 0 : 1); });
    parsed.forEach(function (p) {
      if (p.id.kind === "pack") {
        if (state.dirty && hasWork(state.review) && !confirm("Open this pack? Your unsaved review of the open pack will be left behind. Save it first if you want to keep it.")) return;
        openPack(p.id.data);
        noteRecent("open", p.name, p.handle);
        opened++;
      } else if (openReviewFile(p.id.data, p.handle)) {
        noteRecent("open", p.name, p.handle);
        opened++;
      }
    });
    if (opened) {
      render();
      var kinds = parsed.map(function (p) { return p.id.kind; });
      toast(kinds.indexOf("review") !== -1 ? "Your review is open, so you can carry on." : "Review pack opened: round " + state.pack.round + ".");
    }
    return opened;
  }
  function loadFiles(files, handles) {
    var out = [], left = files.length;
    if (!left) return;
    files.forEach(function (f, i) {
      var r = new FileReader();
      r.onload = function () { out[i] = { name: f.name, text: String(r.result), handle: handles ? handles[i] : null }; if (--left === 0) loadTexts(out); };
      r.onerror = function () { out[i] = { name: f.name, text: "" }; if (--left === 0) loadTexts(out); };
      r.readAsText(f);
    });
  }
  function supportsFilePickers() { return typeof window.showSaveFilePicker === "function" && !RC.inForeignFrame(); }
  function chooseFiles() {
    if (supportsFilePickers() && typeof window.showOpenFilePicker === "function") {
      window.showOpenFilePicker({ multiple: true, types: [{ description: "Review pack or review file", accept: { "application/json": [".json"] } }] })
        .then(function (hs) {
          return Promise.all(hs.map(function (x) { return x.getFile(); })).then(function (fs) { loadFiles(fs, hs); });
        }, function (e) {
          if (!(e && e.name === "AbortError")) { if (e && e.name === "SecurityError") $("file-input").click(); else toast("Open failed: " + ((e && e.message) || "open dialog failed"), "err"); }
        });
    } else $("file-input").click();
  }
  function noteRecent(action, name, handle) {
    var B = HB();
    if (!B || !name) return;
    B.recent({ action: action, name: name, handle: handle || null, label: state.pack ? (state.pack.engagement || {}).client || "" : "" });
  }

  // ---------- saving the review file ----------
  function suggestedName() {
    var e = state.pack.engagement || {};
    return RC.fileSlug(e.client || e.instrumentTitle) + "-review-round-" + state.pack.round + "-" + RC.fileSlug(state.review.reviewer || "reviewer") + ".json";
  }
  function saveReview(ev, onDone) {
    onDone = onDone || function () {};
    if (!state.review) { toast("Open a review pack first.", "warn"); onDone({ ok: false }); return; }
    withReviewerName(function () {
      state.review.savedAt = new Date().toISOString();
      state.review.savedBy = { product: V.product, version: V.number };
      var text = JSON.stringify(state.review, null, 1);
      var name = suggestedName();
      function saved(method, shown, handle) {
        clearAutosave();
        markClean();
        noteRecent("save", shown, handle);
        render();
        onDone({ ok: true, method: method, name: shown, text: text });
      }
      function download(blocked) {
        RC.downloadText(text, name);
        toast(blocked ? "Review file saved (downloaded as " + name + "). Saving back into the same file is not available here, so each save downloads a new copy."
                      : "Review file saved (downloaded as " + name + ").");
        saved("download", name, null);
      }
      function pick() {
        window.showSaveFilePicker({ suggestedName: name, types: [{ description: "Review file", accept: { "application/json": [".json"] } }] })
          .then(function (hd) { writeTo(hd, false); }, function (e) {
            if (e && e.name === "SecurityError") { download(true); return; }
            if (!(e && e.name === "AbortError")) toast("Save failed: " + ((e && e.message) || "save dialog failed"), "err");
            onDone({ ok: false, aborted: !!(e && e.name === "AbortError") });
          });
      }
      function writeTo(handle, canFallback) {
        var ask = handle.queryPermission ? handle.queryPermission({ mode: "readwrite" }).then(function (p) {
          return p === "granted" ? true : handle.requestPermission({ mode: "readwrite" }).then(function (q) { return q === "granted"; });
        }).catch(function () { return false; }) : Promise.resolve(true);
        ask.then(function (granted) {
          if (!granted) { if (canFallback) pick(); else { toast("Save failed: write permission refused.", "err"); onDone({ ok: false }); } return; }
          handle.createWritable().then(function (w) {
            return w.write(text).then(function () { return w.close(); });
          }).then(function () {
            state.handle = handle;
            toast("Saved to " + handle.name + ". Send this file to the author by shared folder or email.");
            saved("file", handle.name, handle);
          }).catch(function (e) {
            if (canFallback) pick();
            else { toast("Save failed: " + ((e && e.message) || "could not write file"), "err"); onDone({ ok: false }); }
          });
        });
      }
      if (!supportsFilePickers()) { download(RC.inForeignFrame()); return; }
      if (ev && ev.shiftKey) { pick(); return; }
      if (state.handle) { writeTo(state.handle, true); return; }
      pick();
    });
  }

  // ---------- comments ----------
  function comments() { return state.review ? state.review.comments : []; }
  function addComment(fields) {
    var now = new Date().toISOString();
    var c = {
      id: RC.newId("c"), reviewer: state.review.reviewer || reviewerName() || "Reviewer", createdAt: now, updatedAt: now,
      severity: fields.severity || "should-fix", anchor: fields.anchor, text: fields.text || "",
      suggestion: fields.suggestion || null, relatesTo: fields.relatesTo || null, check: fields.check || null
    };
    state.review.comments.push(c);
    touched();
    return c;
  }
  function commentsOnBlock(id, doc) {
    return comments().filter(function (c) { return c.anchor.kind === "block" && c.anchor.documentIndex === doc && c.anchor.blockId === id; });
  }
  function commentsOnItem(target, itemId) {
    return comments().filter(function (c) { return c.anchor.kind === "item" && c.anchor.targetName === target && c.anchor.itemId === itemId; });
  }
  function severityLabel(id) { return (RC.SEVERITIES.filter(function (s) { return s.id === id; })[0] || { label: id }).label; }
  function prevComments() { return (state.pack.previousRound && state.pack.previousRound.comments) || []; }

  function isConfirmed(id) { return state.review.confirmations.some(function (c) { return c.commentId === id; }); }

  // ---------- the composer ----------
  // { kind, anchor, severity, text, suggest, suggestion, editing, relatesTo, label }
  function openComposer(c) {
    withReviewerName(function () {
      state.composer = c;
      render();
      setTimeout(function () {
        var t = document.querySelector(".rr-composer textarea");
        if (t) { try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } }
      }, 0);
    });
  }
  function composerNode() {
    var c = state.composer;
    var sev = h("div", { class: "rr-seg", role: "group", "aria-label": "Severity" }, RC.SEVERITIES.map(function (s) {
      return h("button", { type: "button", class: s.id + (c.severity === s.id ? " on" : ""), "data-severity": s.id, text: s.label, onClick: function (ev) {
        ev.stopPropagation(); c.severity = s.id;
        var bs = ev.currentTarget.parentNode.querySelectorAll("button");
        Array.prototype.forEach.call(bs, function (b) { b.classList.toggle("on", b === ev.currentTarget); });
      } });
    }));
    var text = h("textarea", { class: "rr-c-text", placeholder: "Your comment", "aria-label": "Your comment", value: c.text || "", onInput: function (e) { c.text = e.target.value; } });
    var kids = [];
    if (c.label) kids.push(h("div", { class: "small muted", text: c.label }));
    kids.push(sev, text);
    if (c.fields) {
      var select = h("select", { class: "rr-c-field", "aria-label": "Which field the suggestion is for", onChange: function (e) {
        c.field = e.target.value;
        c.suggestion = c.fieldValue(c.field);
        c.suggest = !!c.field;
        render();
      } }, [h("option", { value: "", text: "No suggested wording" })].concat(c.fields.map(function (f) {
        var o = h("option", { value: f[0], text: "Suggest wording for: " + f[1] });
        if (f[0] === c.field) o.selected = true;
        return o;
      })));
      kids.push(select);
    } else if (c.canSuggest !== false) {
      var box = h("input", { type: "checkbox", class: "rr-c-suggest" });
      box.checked = !!c.suggest;
      box.addEventListener("change", function () { c.suggest = box.checked; render(); });
      kids.push(h("label", { class: "small" }, [box, " Suggest wording"]));
    }
    if (c.suggest) {
      kids.push(h("textarea", { class: "rr-c-sug", "aria-label": "Suggested wording", value: c.suggestion || "", onInput: function (e) { c.suggestion = e.target.value; } }));
    }
    kids.push(h("div", { class: "rr-actions" }, [
      h("button", { type: "button", class: "btn sm primary rr-c-add", text: c.editing ? "Save comment" : "Add comment", onClick: function () {
        if (!RC.norm(c.text) && !(c.suggest && RC.norm(c.suggestion))) { toast("Write a comment or a suggestion first.", "warn"); return; }
        var sug = c.suggest && RC.norm(c.suggestion) ? c.suggestion : null;
        if (c.field) c.anchor.field = c.field;
        if (c.field && c.fieldValue) c.anchor.quote = c.fieldValue(c.field);
        if (c.editing) {
          var ex = comments().filter(function (x) { return x.id === c.editing; })[0];
          if (ex) { ex.severity = c.severity; ex.text = c.text; ex.suggestion = sug; ex.anchor = c.anchor; ex.updatedAt = new Date().toISOString(); touched(); }
        } else {
          addComment({ severity: c.severity, anchor: c.anchor, text: c.text, suggestion: sug, relatesTo: c.relatesTo, check: c.check });
        }
        state.composer = null;
        render();
      } }),
      h("button", { type: "button", class: "btn sm rr-c-cancel", text: "Cancel", onClick: function () { state.composer = null; render(); } })
    ]));
    return h("div", { class: "rr-side rr-composer", onClick: function (e) { e.stopPropagation(); } }, kids);
  }

  function commentNode(c) {
    function edit() {
      var a = JSON.parse(JSON.stringify(c.anchor));
      var comp = { anchor: a, severity: c.severity, text: c.text, suggest: !!c.suggestion, suggestion: c.suggestion || "", editing: c.id, canSuggest: a.kind !== "general" };
      if (a.kind === "item") {
        var it = findItem(a.targetName, a.itemId);
        if (it) { comp.fields = ITEM_FIELDS; comp.field = a.field || ""; comp.fieldValue = function (f) { return it[f] || ""; }; }
      }
      openComposer(comp);
    }
    return h("div", { class: "rr-comment sev-" + c.severity, "data-comment-id": c.id, onClick: function (e) { e.stopPropagation(); } }, [
      h("div", { class: "rr-head" }, [
        h("span", { class: "rr-sev sev-" + c.severity, text: severityLabel(c.severity) }),
        h("strong", { class: "small", text: c.reviewer }),
        c.check ? h("span", { class: "rr-chip", text: "From a check" }) : null,
        c.relatesTo ? h("span", { class: "rr-chip", text: "Raised again" }) : null
      ]),
      c.text ? h("div", { class: "text", text: c.text }) : null,
      c.suggestion ? h("div", { class: "sug" }, [h("div", { class: "small muted", text: "Suggested wording" + (c.anchor.field ? " for " + c.anchor.field : "") }), c.suggestion]) : null,
      h("div", { class: "rr-actions" }, [
        h("button", { type: "button", class: "rr-linkbtn", text: "Edit", onClick: edit }),
        h("button", { type: "button", class: "rr-linkbtn rr-del", text: "Delete", onClick: function () {
          state.review.comments = comments().filter(function (x) { return x !== c; });
          touched(); render();
        } })
      ])
    ]);
  }

  function prevNode(p) {
    var c = p.comment, confirmed = isConfirmed(c.id);
    return h("div", { class: "rr-comment rr-prev sev-" + c.severity, "data-prev-id": c.id, onClick: function (e) { e.stopPropagation(); } }, [
      h("div", { class: "rr-head" }, [
        h("span", { class: "rr-sev sev-" + c.severity, text: severityLabel(c.severity) }),
        h("strong", { class: "small", text: c.reviewer }),
        h("span", { class: "small muted", text: "round " + p.round }),
        h("span", { class: "rr-chip " + p.status, text: RC.STATUSES[p.status] || p.status }),
        p.confirmedBy && p.confirmedBy.length ? h("span", { class: "rr-chip met", text: "Confirmed by " + p.confirmedBy.join(", ") }) : null,
        confirmed ? h("span", { class: "rr-chip met", text: "You confirmed this fix" }) : null
      ]),
      c.anchor.quote ? h("div", { class: "quote small", text: c.anchor.quote.length > 240 ? c.anchor.quote.slice(0, 240) + "…" : c.anchor.quote }) : null,
      h("div", { class: "text", text: c.text }),
      c.suggestion ? h("div", { class: "sug" }, [h("div", { class: "small muted", text: "Suggested wording" }), c.suggestion]) : null,
      p.status === "wontchange" && p.reason ? h("div", { class: "small", text: "Won't change: " + p.reason }) : null,
      (p.replies || []).length ? h("div", { class: "rr-replies" }, p.replies.map(function (r) {
        return h("div", { class: "small" }, [h("strong", { text: r.author }), " " + r.text]);
      })) : null,
      h("div", { class: "rr-actions" }, [
        h("button", { type: "button", class: "rr-linkbtn rr-confirm", text: confirmed ? "Take back the confirmation" : "Confirm it is fixed", onClick: function () {
          if (confirmed) state.review.confirmations = state.review.confirmations.filter(function (x) { return x.commentId !== c.id; });
          else state.review.confirmations.push({ commentId: c.id, at: new Date().toISOString() });
          touched(); render();
        } }),
        h("button", { type: "button", class: "rr-linkbtn rr-raise", text: "Raise it again", onClick: function () {
          openComposer({ anchor: JSON.parse(JSON.stringify(c.anchor)), severity: c.severity, text: "", relatesTo: c.id, canSuggest: false, label: "Raising again: " + c.text.slice(0, 120) });
        } })
      ])
    ]);
  }

  // ---------- rendering the document ----------
  function runsNode(block, tag) {
    var el = h(tag || "p");
    var flagged = false;
    (block.runs && block.runs.length ? block.runs : [{ t: block.text || "" }]).forEach(function (r) {
      if (r.red && !flagged) { el.appendChild(h("span", { class: "rr-prompt-flag", text: "Prompt left in" })); flagged = true; }
      var s = document.createTextNode(r.t);
      var node = s;
      if (r.i) { var i = document.createElement("em"); i.appendChild(node); node = i; }
      if (r.b) { var b = document.createElement("strong"); b.appendChild(node); node = b; }
      if (r.red) { var sp = h("span", { class: "rr-red" }); sp.appendChild(node); node = sp; }
      el.appendChild(node);
    });
    return el;
  }
  function lightText(fill) {
    if (!fill) return false;
    var n = parseInt(fill, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 < 120;
  }
  function imageNode(b, media) {
    var src = media && media[b.media];
    if (!src) return h("p", { class: "muted small", text: "[image: " + b.media + "]" });
    return h("img", { src: src, alt: "Chart or picture from the report", style: b.width ? "width:" + Math.min(b.width, 800) + "px" : null });
  }
  function tableNode(t, media, onCell, pickedCell) {
    var tbl = h("table", { class: "rr-table" });
    var tb = h("tbody");
    t.rows.forEach(function (row, r) {
      var tr = h("tr");
      row.cells.forEach(function (cell, c) {
        var td = h("td", { "data-cell": r + "." + c });
        if (cell.fill && cell.fill !== "FFFFFF" && cell.fill !== "AUTO") {
          td.style.background = "#" + cell.fill;
          if (lightText(cell.fill)) td.style.color = "#FFF";
        }
        if (cell.span) td.setAttribute("colspan", cell.span);
        if (pickedCell && pickedCell.row === r && pickedCell.col === c) td.classList.add("picked");
        cell.blocks.forEach(function (p) {
          if (p.type === "table") td.appendChild(tableNode(p, media, null, null));
          else if (p.type === "image") td.appendChild(imageNode(p, media));
          else if (p.type === "bullet") td.appendChild(runsNode({ runs: [{ t: "• " }].concat(p.runs || []) }));
          else td.appendChild(runsNode(p));
        });
        if (onCell) td.addEventListener("click", function (e) { e.stopPropagation(); onCell(r, c, cell); });
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    return h("div", { class: "rr-tablewrap" }, [tbl]);
  }

  function blockAnchor(doc, d, b, cell, quote) {
    return { documentIndex: d, documentTitle: doc.title || "", kind: "block", sectionKey: b.sectionKey || "", sectionTitle: b.sectionTitle || "",
      blockId: b.id, quote: quote != null ? quote : (b.text || ""), cell: cell || null, targetName: doc.targetName || "", itemId: "", field: "" };
  }

  function blockNode(doc, d, b) {
    var mine = commentsOnBlock(b.id, d);
    var open = state.composer && state.composer.anchor.kind === "block" && state.composer.anchor.documentIndex === d && state.composer.anchor.blockId === b.id;
    var cls = "rr-block" + (mine.length ? " has-comment" : "") + (mine.some(function (c) { return c.severity === "must-fix"; }) ? " has-must" : "") + (open ? " open" : "");
    var wrap = h("div", { class: cls, "data-block-id": b.id, "data-section-key": b.sectionKey || "", tabindex: "0", role: "button", "aria-label": "Comment on this " + b.type });
    function startOnBlock(quote, cell, canSuggest) {
      if (state.composer && state.composer.editing) return;
      if (open && !cell && !state.composer.anchor.cell) { state.composer = null; render(); return; }
      openComposer({ anchor: blockAnchor(doc, d, b, cell, quote), severity: "should-fix", text: (open && state.composer.text) || "",
        suggest: false, suggestion: canSuggest ? (quote || "") : "", canSuggest: canSuggest,
        label: b.type === "table" && !cell ? "On the whole table" : (cell ? "On this cell" : "") });
    }
    if (b.type === "heading") {
      var lv = Math.min(4, Math.max(1, b.level || 1));
      wrap.appendChild(runsNode(b, "h" + lv));
      wrap.addEventListener("click", function () { startOnBlock(b.text, null, true); });
    } else if (b.type === "table") {
      var picked = open ? state.composer.anchor.cell : null;
      wrap.appendChild(tableNode(b, doc.media, function (r, c, cell) {
        startOnBlock(cell.text, { row: r, col: c }, true);
      }, picked));
      wrap.addEventListener("click", function () { startOnBlock(b.text, null, false); });
    } else if (b.type === "image") {
      wrap.classList.add("rr-img");
      wrap.appendChild(imageNode(b, doc.media));
      wrap.addEventListener("click", function () { startOnBlock("[chart]", null, false); });
    } else if (b.type === "bullet") {
      wrap.appendChild(h("div", { class: "rr-bullet" }, [h("span", { class: "m", text: b.marker || "•" }), runsNode(b)]));
      wrap.addEventListener("click", function () { startOnBlock(b.text, null, true); });
    } else {
      wrap.appendChild(runsNode(b));
      wrap.addEventListener("click", function () { startOnBlock(b.text, null, true); });
    }
    wrap.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target === wrap) wrap.click(); });
    var frag = [wrap];
    var prevOn = prevComments().filter(function (p) { return p.comment.anchor.kind === "block" && p.comment.anchor.documentIndex === d && RC.norm(p.comment.anchor.quote) === RC.norm(b.text); });
    if (prevOn.length) frag.push(h("div", { class: "rr-side" }, prevOn.map(prevNode)));
    if (mine.length) frag.push(h("div", { class: "rr-side" }, mine.map(commentNode)));
    if (open) frag.push(composerNode());
    return frag;
  }

  function sectionsOf(doc) {
    var out = [];
    (doc.blocks || []).forEach(function (b) {
      if (b.type === "heading" && !b.sub) out.push({ id: b.id, title: b.text.replace(" ", " "), level: b.level, key: b.sectionKey || "", titleOnly: b.sectionTitle });
    });
    return out;
  }
  // Comments per section of one document: a heading's own comments and those on
  // the blocks under it, up to the next section heading.
  function countsBySection(doc, d) {
    var counts = {}, cur = "";
    (doc.blocks || []).forEach(function (b) {
      if (b.type === "heading" && !b.sub) cur = b.id;
      var n = commentsOnBlock(b.id, d).length;
      if (n) counts[cur] = (counts[cur] || 0) + n;
    });
    return counts;
  }

  function renderReport(main) {
    var pack = state.pack, d = Math.min(state.docIndex, pack.documents.length - 1), doc = pack.documents[d];
    var tb = [];
    if (pack.documents.length > 1) {
      tb.push(h("label", null, ["Document ", h("select", { id: "rr-doc", onChange: function (e) { state.docIndex = Number(e.target.value); state.composer = null; render(true); } },
        pack.documents.map(function (x, i) { var o = h("option", { value: String(i), text: x.title + (x.targetName && x.title !== x.targetName ? " (" + x.targetName + ")" : "") }); if (i === d) o.selected = true; return o; }))]));
    }
    tb.push(h("span", { class: "muted", text: "Click any paragraph, heading or table to comment. Click a table cell to comment on that cell." }));
    main.appendChild(h("h1", { class: "page-title", text: (pack.engagement.instrumentTitle || "Report") }));
    main.appendChild(h("p", { class: "page-sub", text: "As the client will read it: this is the generated Word report, round " + pack.round + "." }));
    main.appendChild(h("div", { class: "rr-toolbar" }, tb));
    var paper = h("div", { class: "rr-paper", id: "rr-paper" });
    var cover = null;
    doc.blocks.forEach(function (b) {
      var nodes = blockNode(doc, d, b);
      if (b.front) {
        if (!cover) { cover = h("div", { class: "rr-cover" }); paper.appendChild(cover); }
        nodes.forEach(function (n) { cover.appendChild(n); });
      } else nodes.forEach(function (n) { paper.appendChild(n); });
    });
    main.appendChild(paper);
  }

  // ---------- the engagement ----------
  var ITEM_FIELDS = [["evidence", "evidence"], ["notes", "notes"], ["action", "recommended action"], ["impact", "business impact"], ["owner", "owner"]];
  function findItem(target, id) { return (state.pack.items || []).filter(function (i) { return i.targetName === target && i.itemId === id; })[0] || null; }
  var STATUS_LABELS = { finding: "Finding", met: "Met", recorded: "Recorded", "to-assess": "To assess", unanswered: "Not answered", na: "N/A" };

  function targetsOf(pack) {
    var out = [];
    (pack.items || []).forEach(function (i) { if (out.indexOf(i.targetName) === -1) out.push(i.targetName); });
    return out;
  }
  function itemVisible(i) {
    if (state.itemTarget && i.targetName !== state.itemTarget) return false;
    var f = state.itemFilter;
    if (f === "findings" && i.status !== "finding") return false;
    if (f === "noevidence" && (i.status === "na" || RC.norm(i.evidence))) return false;
    if (f === "open" && i.status !== "unanswered" && i.status !== "to-assess") return false;
    if (f === "commented" && !commentsOnItem(i.targetName, i.itemId).length) return false;
    if (state.itemSearch) {
      var q = state.itemSearch.toLowerCase();
      if ([i.code, i.title, i.evidence, i.notes, i.action, i.impact].join(" ").toLowerCase().indexOf(q) === -1) return false;
    }
    return true;
  }
  function itemCommentAnchor(i) {
    var dIndex = 0;
    (state.pack.documents || []).forEach(function (doc, k) { if (doc.targetName && doc.targetName === i.targetName) dIndex = k; });
    return { documentIndex: dIndex, documentTitle: (state.pack.documents[dIndex] || {}).title || "", kind: "item", sectionKey: "", sectionTitle: "", blockId: "",
      quote: "", cell: null, targetName: i.targetName, itemId: i.itemId, field: "", code: i.code, itemTitle: i.title, groupName: i.groupName };
  }
  function itemNode(i) {
    var mine = commentsOnItem(i.targetName, i.itemId);
    var open = state.composer && state.composer.anchor.kind === "item" && state.composer.anchor.targetName === i.targetName && state.composer.anchor.itemId === i.itemId;
    function row(label, v) { return [h("dt", { text: label }), h("dd", { class: v ? null : "blank", text: v || "Not recorded" })]; }
    var kv = [];
    kv = kv.concat(row("Answer", i.answer));
    if (i.expected) kv = kv.concat(row("Target", i.expected));
    kv = kv.concat(row("Evidence", i.evidence));
    if (i.notes) kv = kv.concat(row("Notes", i.notes));
    if (i.status === "finding" || i.action || i.owner || i.impact) {
      kv = kv.concat(row("Action", i.action)).concat(row("Owner", i.owner)).concat(row("Impact", i.impact));
    }
    if (i.priority) kv = kv.concat(row("Priority", i.priority));
    return h("div", { class: "rr-item", "data-item-id": i.itemId, "data-target": i.targetName }, [
      h("div", { class: "rr-item-h" }, [
        h("span", { class: "code", text: i.code }),
        h("span", { class: "ttl", text: i.title }),
        i.shared ? h("span", { class: "rr-chip", text: "Shared answer" }) : null,
        h("span", { class: "rr-chip " + i.status, text: STATUS_LABELS[i.status] || i.status }),
        h("button", { type: "button", class: "btn sm rr-item-comment", text: "Comment", onClick: function () {
          openComposer({ anchor: itemCommentAnchor(i), severity: "should-fix", text: "", fields: ITEM_FIELDS, field: "", fieldValue: function (f) { return i[f] || ""; }, suggestion: "" });
        } })
      ]),
      h("dl", { class: "rr-kv" }, kv),
      mine.length ? h("div", { class: "rr-side" }, mine.map(commentNode)) : null,
      prevOnItem(i),
      open ? composerNode() : null
    ]);
  }
  function prevOnItem(i) {
    var list = prevComments().filter(function (p) { return p.comment.anchor.kind === "item" && p.comment.anchor.targetName === i.targetName && p.comment.anchor.itemId === i.itemId; });
    return list.length ? h("div", { class: "rr-side" }, list.map(prevNode)) : null;
  }

  function renderEngagement(main) {
    var pack = state.pack, all = pack.items || [], targets = targetsOf(pack);
    main.appendChild(h("h1", { class: "page-title", text: "Engagement" }));
    main.appendChild(h("p", { class: "page-sub", text: "The answers, evidence and plans behind the report, so you can challenge a finding as well as its wording." }));
    var filters = [["all", "All"], ["findings", "Findings"], ["noevidence", "No evidence"], ["open", "To assess or not answered"], ["commented", "With your comments"]];
    var tb = [
      h("div", { class: "rr-seg", role: "group", "aria-label": "Filter" }, filters.map(function (f) {
        return h("button", { type: "button", class: state.itemFilter === f[0] ? "on" : "", "data-filter": f[0], text: f[1], onClick: function () { state.itemFilter = f[0]; render(true); } });
      }))
    ];
    if (targets.length > 1) {
      tb.push(h("select", { id: "rr-item-target", "aria-label": "Which target", onChange: function (e) { state.itemTarget = e.target.value; render(true); } },
        [h("option", { value: "", text: "All (" + targets.length + ")" })].concat(targets.map(function (t) { var o = h("option", { value: t, text: t }); if (t === state.itemTarget) o.selected = true; return o; }))));
    }
    var search = h("input", { type: "search", id: "rr-item-search", placeholder: "Search items", "aria-label": "Search items", value: state.itemSearch });
    search.addEventListener("change", function () { state.itemSearch = search.value; render(true); });
    tb.push(search);
    main.appendChild(h("div", { class: "rr-toolbar" }, tb));
    var shown = all.filter(itemVisible);
    main.appendChild(h("p", { class: "small muted", id: "rr-item-count", text: "Showing " + shown.length + " of " + all.length + " items." }));
    var lastT = null, lastG = null;
    var LIMIT = 150, cut = shown.length > LIMIT && !state.itemsAll ? LIMIT : shown.length;
    shown.slice(0, cut).forEach(function (i) {
      if (targets.length > 1 && i.targetName !== lastT) { main.appendChild(h("h2", { class: "rr-target-h", text: i.targetName })); lastG = null; }
      lastT = i.targetName;
      if (i.groupName !== lastG) { main.appendChild(h("div", { class: "rr-group-h", text: i.groupName })); lastG = i.groupName; }
      main.appendChild(itemNode(i));
    });
    if (cut < shown.length) main.appendChild(h("button", { type: "button", class: "btn", text: "Show all " + shown.length, onClick: function () { state.itemsAll = true; render(true); } }));

    // The basis of assessment
    var bs = pack.basisOfAssessment || {};
    function list(title, rows, fmt) {
      if (!rows || !rows.length) return h("p", { class: "muted", text: title + ": none recorded." });
      return h("div", null, [h("strong", { text: title }), h("ul", { style: "margin:4px 0 10px; padding-left:20px" }, rows.map(function (r) { return h("li", { text: fmt(r) }); }))]);
    }
    var openBasis = state.composer && state.composer.anchor.kind === "general" && state.composer.anchor.sectionTitle === "Basis of assessment";
    var basisComments = comments().filter(function (c) { return c.anchor.kind === "general" && c.anchor.sectionTitle === "Basis of assessment"; });
    main.appendChild(h("div", { class: "spacer-12", style: "height:12px" }));
    main.appendChild(card("Basis of assessment", "who was spoken to, what was read, what was seen", [
      list("People interviewed", bs.interviews, function (r) { return [r.name, r.role, r.date].filter(Boolean).join(", "); }),
      list("Documents reviewed", bs.documents, function (r) { return [r.title, r.reference, r.date].filter(Boolean).join(", "); }),
      list("Systems observed", bs.observations, function (r) { return [r.name, r.method || r.description, r.location, r.date].filter(Boolean).join(", "); }),
      h("button", { type: "button", class: "btn sm rr-basis-comment", text: "Comment on the basis of assessment", onClick: function () {
        openComposer({ anchor: { documentIndex: 0, documentTitle: "", kind: "general", sectionKey: "", sectionTitle: "Basis of assessment", blockId: "", quote: "", cell: null, targetName: "", itemId: "", field: "" }, severity: "should-fix", text: "", canSuggest: false });
      } }),
      basisComments.length ? h("div", { class: "rr-side" }, basisComments.map(commentNode)) : null,
      openBasis ? composerNode() : null
    ]));
  }

  // ---------- the checklist ----------
  function checklistItems() {
    var C = A.Data.checklists || {}, e = state.pack.engagement || {};
    var groups = [{ title: "Every report", items: C.common || [] }];
    var fam = (C.families || {})[e.scoringFamily];
    if (fam && fam.length) groups.push({ title: "For this type of report", items: fam });
    var ins = (C.instruments || {})[e.instrumentId];
    if (ins && ins.length) groups.push({ title: e.instrumentTitle || "For this framework", items: ins });
    return groups;
  }
  function answerOf(id) { return state.review.checklist.filter(function (a) { return a.id === id; })[0] || null; }
  function setAnswer(q, patch) {
    var a = answerOf(q.id);
    if (!a) { a = { id: q.id, text: q.text, answer: "", note: "" }; state.review.checklist.push(a); }
    Object.keys(patch).forEach(function (k) { a[k] = patch[k]; });
    touched();
  }
  function renderChecklist(main) {
    main.appendChild(h("h1", { class: "page-title", text: "Checklist" }));
    main.appendChild(h("p", { class: "page-sub", text: "Your answers go in your review file. A no is worth a comment saying why." }));
    checklistItems().forEach(function (g) {
      main.appendChild(card(g.title, null, g.items.map(function (q) {
        var a = answerOf(q.id) || {};
        return h("div", { class: "rr-q", "data-q": q.id }, [
          h("div", { text: q.text }),
          h("div", { class: "rr-seg", role: "group", "aria-label": "Answer" }, [["yes", "Yes"], ["no", "No"], ["na", "N/A"]].map(function (o) {
            return h("button", { type: "button", class: o[0] + (a.answer === o[0] ? " on" : ""), "data-answer": o[0], text: o[1], onClick: function () {
              setAnswer(q, { answer: a.answer === o[0] ? "" : o[0] }); render(true);
            } });
          })),
          h("div", { class: "rr-note" }, [h("input", { type: "text", placeholder: "A note, if there is anything to say", "aria-label": "Note", value: a.note || "", onChange: function (e) { setAnswer(q, { note: e.target.value }); } })])
        ]);
      })));
    });
  }

  // ---------- the automatic checks ----------
  function userNames() { var v = RC.parseJson(lsGet(KEY_NAMES) || "[]"); return Array.isArray(v) ? v : []; }
  function currentChecks() {
    if (!state.checks) state.checks = RK.run(state.pack, { names: userNames() });
    return state.checks;
  }
  function isDismissed(id) { return state.review.dismissedChecks.indexOf(id) !== -1; }
  function hasCheckComment(r) { return comments().some(function (c) { return c.check === r.id; }); }
  function activeChecks() { return currentChecks().filter(function (r) { return !isDismissed(r.id); }); }

  function checkAnchor(r) {
    var doc = state.pack.documents[r.documentIndex] || {};
    if (r.kind === "item") {
      return { documentIndex: r.documentIndex || 0, documentTitle: doc.title || "", kind: "item", sectionKey: "", sectionTitle: "", blockId: "", quote: r.field ? (findItem(r.targetName, r.itemId) || {})[r.field] || "" : "",
        cell: null, targetName: r.targetName, itemId: r.itemId, field: r.field || "", code: r.code, itemTitle: r.itemTitle };
    }
    if (r.kind === "general") {
      return { documentIndex: 0, documentTitle: "", kind: "general", sectionKey: "", sectionTitle: r.sectionTitle || "General", blockId: "", quote: r.quote || "", cell: null, targetName: "", itemId: "", field: "" };
    }
    return { documentIndex: r.documentIndex, documentTitle: doc.title || "", kind: "block", sectionKey: r.sectionKey, sectionTitle: r.sectionTitle, blockId: r.blockId,
      quote: r.fullText || r.quote, cell: r.cell, targetName: doc.targetName || "", itemId: "", field: "" };
  }
  function goToCheck(r) {
    if (r.kind === "item") { jumpToItem(r.targetName, r.itemId); return; }
    if (r.kind === "general") { state.page = "summary"; render(true); return; }
    jumpToBlock(r.documentIndex, r.blockId);
  }
  function renderChecks(main) {
    main.appendChild(h("h1", { class: "page-title", text: "Automatic checks" }));
    main.appendChild(h("p", { class: "page-sub", text: "What a machine can find in this pack. None of it is a verdict: go and look, then make it a comment or dismiss it." }));
    var all = currentChecks(), active = all.filter(function (r) { return !isDismissed(r.id); }), gone = all.length - active.length;
    Object.keys(RK.CHECKS).forEach(function (id) {
      var def = RK.CHECKS[id], rows = active.filter(function (r) { return r.check === id; });
      main.appendChild(card(def.title + (rows.length ? " (" + rows.length + ")" : ""), rows.length ? null : "nothing found", [
        h("p", { class: "muted small", style: "margin-top:0", text: def.about }),
        id === "other-names" ? namesEditor() : null,
        rows.length ? h("div", { "data-check": id }, rows.slice(0, state.checksAll === id ? rows.length : 25).map(checkRow)) : null,
        rows.length > 25 && state.checksAll !== id ? h("button", { type: "button", class: "btn sm", text: "Show all " + rows.length, onClick: function () { state.checksAll = id; render(true); } }) : null
      ]));
    });
    if (gone) {
      main.appendChild(h("div", null, [
        h("button", { type: "button", class: "rr-linkbtn", text: (state.showDismissed ? "Hide" : "Show") + " " + gone + " dismissed", onClick: function () { state.showDismissed = !state.showDismissed; render(true); } })
      ]));
      if (state.showDismissed) {
        main.appendChild(card("Dismissed", null, all.filter(function (r) { return isDismissed(r.id); }).map(checkRow)));
      }
    }
  }
  function checkRow(r) {
    var dismissed = isDismissed(r.id), made = hasCheckComment(r);
    return h("div", { class: "rr-check" + (dismissed ? " dismissed" : ""), "data-check-id": r.id }, [
      h("div", { text: r.message }),
      r.quote ? h("div", { class: "quote small", text: r.quote }) : null,
      r.sectionTitle && r.kind === "block" ? h("div", { class: "small muted", text: "In " + r.sectionTitle }) : null,
      h("div", { class: "rr-actions" }, [
        h("button", { type: "button", class: "btn sm rr-check-go", text: "Go to", onClick: function () { goToCheck(r); } }),
        made ? h("span", { class: "rr-chip met", text: "Comment added" }) : h("button", { type: "button", class: "btn sm rr-check-comment", text: "Make it a comment", onClick: function () {
          withReviewerName(function () {
            addComment({ severity: r.severity, anchor: checkAnchor(r), text: r.message, check: r.id });
            render(true);
          });
        } }),
        dismissed
          ? h("button", { type: "button", class: "btn sm rr-check-restore", text: "Restore", onClick: function () { state.review.dismissedChecks = state.review.dismissedChecks.filter(function (x) { return x !== r.id; }); touched(); render(true); } })
          : h("button", { type: "button", class: "btn sm rr-check-dismiss", text: "Dismiss", onClick: function () { state.review.dismissedChecks.push(r.id); touched(); render(true); } })
      ])
    ]);
  }
  function namesEditor() {
    var ta = h("input", { type: "text", id: "rr-names", style: "width:100%;box-sizing:border-box;font:inherit;padding:5px 8px;border:1px solid var(--border-strong);border-radius:var(--radius);background:var(--surface);color:var(--text)",
      placeholder: "Other clients' names to look for, separated by commas", "aria-label": "Other clients' names to look for", value: userNames().join(", ") });
    ta.addEventListener("change", function () {
      var names = ta.value.split(",").map(RC.norm).filter(Boolean);
      lsSet(KEY_NAMES, JSON.stringify(names));
      state.checks = null;
      render(true);
    });
    return h("div", { style: "margin-bottom:8px" }, [ta, h("div", { class: "small muted", text: "This list stays in this browser, and is never put in your review file." })]);
  }

  // ---------- previous round ----------
  function renderPrevious(main) {
    var list = prevComments();
    main.appendChild(h("h1", { class: "page-title", text: "Previous round" }));
    main.appendChild(h("p", { class: "page-sub", text: "What was said last time, what the author did and why. Confirm the fixes you have checked, or raise a point again." }));
    var verdicts = (state.pack.previousRound && state.pack.previousRound.verdicts) || [];
    if (verdicts.length) {
      main.appendChild(card("Verdicts so far", null, verdicts.map(function (v) {
        return h("div", { class: "small" }, [h("strong", { text: v.reviewer }), " round " + v.round + ": " + (RC.VERDICTS[v.value] || v.value) + (v.note ? ". " + v.note : "")]);
      })));
    }
    var openRaise = state.composer && state.composer.relatesTo;
    main.appendChild(card("Comments", list.length + " from earlier rounds", list.length ? list.map(function (p) {
      var nodes = [prevNode(p)];
      if (openRaise === p.comment.id) nodes.push(composerNode());
      return h("div", null, nodes);
    }) : [h("p", { class: "muted", text: "No comments came back in earlier rounds." })]));
  }

  // ---------- summary and verdict ----------
  var VERDICT_HELP = {
    none: "You have not decided yet.",
    approved: "It can go out as it is. The author can put your name in QA review by.",
    "approved-with-comments": "It can go out once the author has looked at your comments. The author can put your name in QA review by.",
    "changes-requested": "It should not go out until your points are dealt with."
  };
  function jumpToComment(c) {
    if (c.anchor.kind === "item") { jumpToItem(c.anchor.targetName, c.anchor.itemId); return; }
    if (c.anchor.kind === "general") { state.page = "engagement"; render(true); return; }
    jumpToBlock(c.anchor.documentIndex, c.anchor.blockId);
  }
  function renderSummary(main) {
    var r = state.review, list = comments();
    main.appendChild(h("h1", { class: "page-title", text: "Summary and verdict" }));
    main.appendChild(h("p", { class: "page-sub", text: "When you have finished, say where it stands and save. Send the file to the author by shared folder or email; it holds only your review, and the author's tool merges it with anyone else's." }));
    var sev = {};
    RC.SEVERITIES.forEach(function (s) { sev[s.id] = list.filter(function (c) { return c.severity === s.id; }).length; });
    var answered = r.checklist.filter(function (a) { return a.answer; }).length;
    var totalQ = 0; checklistItems().forEach(function (g) { totalQ += g.items.length; });
    main.appendChild(card("Your review", "as " + (r.reviewer || reviewerName() || "unnamed"), [
      h("div", { class: "rr-stats" }, [
        h("div", { class: "rr-stat" }, [h("strong", { id: "rr-sum-must", text: String(sev["must-fix"]) }), "Must fix"]),
        h("div", { class: "rr-stat" }, [h("strong", { text: String(sev["should-fix"]) }), "Should fix"]),
        h("div", { class: "rr-stat" }, [h("strong", { text: String(sev.suggestion) }), "Suggestions"]),
        h("div", { class: "rr-stat" }, [h("strong", { text: answered + "/" + totalQ }), "Checklist"]),
        h("div", { class: "rr-stat" }, [h("strong", { text: String(activeChecks().length) }), "Checks not dismissed"])
      ]),
      h("button", { type: "button", class: "rr-linkbtn", text: "Change your name", onClick: function () { askName(null, r.reviewer || reviewerName()); } })
    ]));
    var vWrap = h("div", { class: "rr-verdicts" }, ["approved", "approved-with-comments", "changes-requested", "none"].map(function (v) {
      var on = (r.verdict.value || "none") === v;
      var radio = h("input", { type: "radio", name: "rr-verdict", value: v });
      radio.checked = on;
      radio.addEventListener("change", function () {
        r.verdict.value = v;
        r.verdict.date = v === "none" ? "" : todayISO();
        touched(); render(true);
      });
      return h("label", { class: "rr-verdict" + (on ? " on" : ""), "data-verdict": v }, [radio, h("span", null, [h("strong", { text: RC.VERDICTS[v] }), h("div", { class: "small muted", text: VERDICT_HELP[v] })])]);
    }));
    var warn = RC.isApproval(r.verdict.value) && sev["must-fix"] ? h("div", { class: "rr-warn", text: "You have " + RC.plural(sev["must-fix"], "must-fix comment") + " and an approval. That is allowed, but the author will see both." }) : null;
    main.appendChild(card("Verdict", null, [
      vWrap, warn,
      h("div", { class: "field" }, [h("label", { text: "A note for the author" }), h("textarea", { id: "rr-verdict-note", "aria-label": "A note for the author", value: r.verdict.note || "", onChange: function (e) { r.verdict.note = e.target.value; touched(); } })]),
      h("button", { type: "button", class: "btn primary", id: "rr-save-2", text: "Save my review file", onClick: function (e) { saveReview(e); } }),
      r.savedAt && !state.dirty ? h("span", { class: "small muted", style: "margin-left:10px", text: "Saved " + fmtDate(r.savedAt) + "." }) : null
    ]));
    main.appendChild(card("All your comments", list.length ? String(list.length) : "none yet", list.length ? list.map(function (c) {
      var where = c.anchor.kind === "item" ? [c.anchor.targetName, c.anchor.code].filter(Boolean).join(": ") : (c.anchor.sectionTitle || "Cover");
      return h("div", { class: "rr-check" }, [
        h("div", { class: "small muted" }, [h("button", { type: "button", class: "rr-linkbtn", text: where, onClick: function () { jumpToComment(c); } })]),
        commentNode(c)
      ]);
    }) : [h("p", { class: "muted", text: "Comments you add on the Report and Engagement pages are listed here." })]));
  }

  // ---------- welcome and about ----------
  function renderWelcome(main) {
    main.appendChild(h("h1", { class: "page-title", text: "Report review" }));
    main.appendChild(h("p", { class: "page-sub", text: "Read a report as the client will, look behind it at the engagement, and give your comments here rather than by marking up a Word file." }));
    var drop = h("div", { class: "rr-drop", id: "rr-drop" }, [
      h("p", { text: "Drop a review pack here, or" }),
      h("button", { type: "button", class: "btn primary", id: "rr-open", text: "Open a review pack", onClick: chooseFiles }),
      h("button", { type: "button", class: "btn", id: "rr-demo", text: "Try the demo", onClick: openDemo })
    ]);
    main.appendChild(drop);
    main.appendChild(card("How a review works", null, [h("ol", { class: "rr-steps" }, [
      h("li", { text: "The author sends a review pack from the assessment or risk tool. It holds client data: handle it as you would the project file." }),
      h("li", { text: "Open it here. Read the report, look at the engagement, work through the checklist and the automatic checks, and comment as you go." }),
      h("li", { text: "On Summary and verdict, say where it stands and save your review file. To carry on later, load the pack and then your review file." }),
      h("li", { text: "Send the file to the author. Their tool merges it with other reviewers' files, so nobody overwrites anyone." })
    ])]));
  }
  function renderAbout(main) {
    main.appendChild(h("h1", { class: "page-title", text: "About" }));
    main.appendChild(card(V.product + " " + V.label, "version " + V.number, [
      h("p", { text: "Works offline, with no server. A review pack holds client data, so handle it as you would the project file. Your review file holds your comments, your checklist answers and your verdict, with the short quotes they are about." }),
      h("p", { text: "It reads " + RC.packSchema() + " and writes " + RC.fileSchema() + "." })
    ]));
    main.appendChild(card("Copyright and licence", null, [h("p", { text: LEGAL_NOTICE }), h("div", { class: "rr-licence", text: (A.Data && A.Data.licence) || "" })]));
  }

  function openDemo() {
    function go() {
      if (!window.SPT_REVIEW_DEMO_PACK) { toast("The demo pack (data/demo-pack.js) is missing.", "err"); return; }
      openPack(JSON.parse(JSON.stringify(window.SPT_REVIEW_DEMO_PACK)));
      state.demo = true;
      render();
      toast("Demo pack opened: a real report from a demo assessment, round " + state.pack.round + ".");
    }
    if (window.SPT_REVIEW_DEMO_PACK) { go(); return; }
    var s = document.createElement("script");
    s.src = "data/demo-pack.js";
    s.onload = go;
    s.onerror = function () { toast("The demo pack (data/demo-pack.js) failed to load.", "err"); };
    document.head.appendChild(s);
  }

  // ---------- going to things ----------
  function jumpToBlock(d, id) {
    state.page = "report";
    state.docIndex = d || 0;
    state.jump = { block: id };
    render();
  }
  function jumpToItem(target, id) {
    state.page = "engagement";
    state.itemFilter = "all"; state.itemSearch = ""; state.itemTarget = target || "";
    state.itemsAll = true;
    state.jump = { item: id, target: target };
    render();
  }
  function flushJump() {
    var j = state.jump;
    if (!j) return;
    state.jump = null;
    var el = null;
    if (j.block) el = document.querySelector('[data-block-id="' + j.block + '"]');
    if (j.item) el = Array.prototype.filter.call(document.querySelectorAll(".rr-item"), function (n) { return n.getAttribute("data-item-id") === j.item && n.getAttribute("data-target") === j.target; })[0];
    if (!el) return;
    if (el.scrollIntoView) el.scrollIntoView({ block: "center" });
    el.classList.add("flash");
    setTimeout(function () { el.classList.remove("flash"); }, 2000);
  }

  // ---------- the frame of the page ----------
  function navItem(id, label, badge, disabled) {
    return h("div", { class: "nav-item" + (state.page === id ? " active" : ""), "data-page": id, role: "button", tabindex: "0",
      onClick: function () { state.page = id; state.composer = null; render(); } }, [h("span", { text: label }), badge ? h("span", { class: "badge", text: String(badge) }) : null]);
  }
  function renderNav() {
    var sb = $("sidebar"); sb.innerHTML = "";
    var sec = h("div", { class: "nav-section" });
    if (state.pack) {
      var d = Math.min(state.docIndex, state.pack.documents.length - 1), doc = state.pack.documents[d];
      sec.appendChild(h("div", { class: "nav-section-title", text: "This review" }));
      var blockCount = comments().filter(function (c) { return c.anchor.kind === "block"; }).length;
      var itemCount = comments().filter(function (c) { return c.anchor.kind === "item"; }).length;
      var qAnswered = state.review.checklist.filter(function (a) { return a.answer; }).length;
      var total = 0; checklistItems().forEach(function (g) { total += g.items.length; });
      sec.appendChild(navItem("report", "Report", blockCount || null));
      sec.appendChild(navItem("engagement", "Engagement", itemCount || null));
      sec.appendChild(navItem("checklist", "Checklist", qAnswered + "/" + total));
      sec.appendChild(navItem("checks", "Automatic checks", activeChecks().length || null));
      if (prevComments().length) sec.appendChild(navItem("previous", "Previous round", prevComments().length));
      sec.appendChild(navItem("summary", "Summary and verdict", null));
      sb.appendChild(sec);
      if (state.page === "report") {
        var counts = countsBySection(doc, d);
        var outline = h("div", { class: "rr-outline" }, [h("div", { class: "nav-section-title", text: "Sections" })]);
        sectionsOf(doc).forEach(function (s) {
          outline.appendChild(h("button", { type: "button", class: "rr-outline-item" + (s.level > 1 ? " lvl2" : ""), "data-section-block": s.id, onClick: function () {
            var el = document.querySelector('[data-block-id="' + s.id + '"]');
            if (el && el.scrollIntoView) el.scrollIntoView({ block: "start" });
          } }, [h("span", { class: "t", text: s.title }), counts[s.id] ? h("span", { class: "n", text: String(counts[s.id]) }) : null]));
        });
        sb.appendChild(outline);
      }
      var sec2 = h("div", { class: "nav-section" }, [navItem("about", "About", null)]);
      sb.appendChild(sec2);
    } else {
      sec.appendChild(navItem("welcome", "Start", null));
      sec.appendChild(navItem("about", "About", null));
      sb.appendChild(sec);
    }
    sb.appendChild(h("div", { class: "sidebar-legal", text: V.product + " " + V.label + ". " + LEGAL_SHORT }));
  }
  function renderHeader() {
    var e = state.pack ? state.pack.engagement || {} : null;
    $("pack-summary").textContent = e ? [e.client, e.site, "round " + state.pack.round].filter(Boolean).join(" · ") : "";
    updateSaveButton();
  }
  function restoreBar() {
    var snap = state.restore;
    if (!snap) return null;
    return h("div", { class: "rr-banner autosave-bar", id: "rr-restore" }, [
      h("span", { class: "t", text: "Unsaved review work on this pack from " + new Date(snap.savedOn).toLocaleString() + " was found." }),
      h("button", { type: "button", class: "btn sm primary", id: "rr-restore-yes", text: "Restore", onClick: function () {
        state.review = snap.review; state.restore = null;
        ["checklist", "dismissedChecks", "confirmations", "comments"].forEach(function (k) { if (!Array.isArray(state.review[k])) state.review[k] = []; });
        state.dirty = true; render(); toast("Your autosaved review is restored.");
      } }),
      h("button", { type: "button", class: "btn sm", id: "rr-restore-no", text: "Discard", onClick: function () { clearAutosave(); state.restore = null; render(); } })
    ]);
  }
  function render(keepScroll) {
    var main = $("main");
    var top = main.scrollTop;
    renderNav(); renderHeader();
    main.innerHTML = "";
    if (TOUR_MODE || state.demo) {
      main.appendChild(h("div", { class: "rr-banner", id: "rr-demo-note" }, [h("span", { class: "t", text: "This is a demo pack, made from a demo assessment. Try anything; nothing here touches real work." })]));
    }
    var bar = restoreBar();
    if (bar) main.appendChild(bar);
    var page = state.page;
    if (!state.pack && page !== "about") page = "welcome";
    var fn = { welcome: renderWelcome, report: renderReport, engagement: renderEngagement, checklist: renderChecklist, checks: renderChecks, previous: renderPrevious, summary: renderSummary, about: renderAbout }[page] || renderWelcome;
    fn(main);
    if (state.jump) flushJump();
    else main.scrollTop = keepScroll === false ? 0 : top;
  }

  // ---------- wiring ----------
  applyTheme(currentTheme());
  $("btn-theme").addEventListener("click", function () { applyTheme(currentTheme() === "dark" ? "light" : "dark"); });
  $("btn-load").addEventListener("click", chooseFiles);
  $("btn-save").addEventListener("click", function (e) { saveReview(e); });
  $("file-input").addEventListener("change", function (ev) {
    var files = Array.prototype.slice.call(ev.target.files || []);
    ev.target.value = "";
    loadFiles(files);
  });
  (function () {
    var b = $("version-badge");
    b.textContent = V.label;
    b.title = V.product + " version " + V.number;
  })();
  // Drag and drop, anywhere on the page.
  document.addEventListener("dragover", function (e) {
    e.preventDefault();
    var d = $("rr-drop"); if (d) d.classList.add("over");
  });
  document.addEventListener("dragleave", function () { var d = $("rr-drop"); if (d) d.classList.remove("over"); });
  document.addEventListener("drop", function (e) {
    e.preventDefault();
    var d = $("rr-drop"); if (d) d.classList.remove("over");
    var files = Array.prototype.slice.call((e.dataTransfer && e.dataTransfer.files) || []);
    if (files.length) loadFiles(files);
  });
  window.addEventListener("beforeunload", function (e) {
    clearTimeout(autosaveTimer);
    if (state.dirty) { writeAutosave(); e.preventDefault(); e.returnValue = ""; return ""; }
  });
  if (A.HostBridge && A.HostBridge.hosted) {
    A.HostBridge.register({
      loadButton: "btn-load",
      applyTheme: applyTheme,
      openFile: function (file, handle) { loadFiles([file], handle ? [handle] : null); }
    });
  }

  render();
  updateSaveButton();
  if (TOUR_MODE) openDemo();

  // Exposed for the headless test pages.
  window.ReviewTool = {
    state: state,
    loadTexts: loadTexts,
    saveReview: saveReview,
    render: render,
    addComment: addComment,
    openDemo: openDemo,
    openComposer: openComposer,
    supportsFilePickers: supportsFilePickers,
    isDirty: function () { return state.dirty; },
    activeChecks: activeChecks,
    jumpToBlock: jumpToBlock,
    jumpToItem: jumpToItem,
    KEY_AUTOSAVE: KEY_AUTOSAVE, KEY_REVIEWER: KEY_REVIEWER, KEY_NAMES: KEY_NAMES,
    writeAutosave: writeAutosave
  };
})();
