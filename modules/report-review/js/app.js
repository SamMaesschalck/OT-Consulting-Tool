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
  // + pack id: { packName, packRound, reviewName, savedAt, reviewer }: the file names
  // this browser has seen for a pack, so it can point at the right file. Names
  // and dates only, never content.
  var KEY_SEEN = "spt-review:seen:v1:";
  // + pack id: ["<document index>|<section heading block id>", ...], the
  // sections this reviewer has ticked as read. A note to self for this
  // browser, never put in the review file.
  var KEY_READ = "spt-review:read:v1:";

  // The tour opens the demo by itself. Everything else about the demo (no
  // autosave, no Recent files, the banner) follows state.demo, so a real pack
  // opened in the tour's window behaves as it does in the tool.
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
    restore: null,       // unsaved work found in this browser, on offer
    handle: null,
    dirty: false,
    demo: false,
    pendingReview: null, // a review file opened before its pack: { file, handle, name }
    savedHint: null,     // a review file this browser has for the open pack (KEY_SEEN)
    colleague: null,     // someone else's review file, shown read only
    carried: false,      // the last review file opened took unsaved work in
    openedFrom: null,    // { reviewer, ids }: whose the opened file was, and the comments it held
    undoOpen: null,      // the review as it was before a file was opened, until it is drawn
    lastSave: null,      // { name, at, method } of the last save this session
    focusSearch: false,  // put the caret back in the item search after a redraw
    replyBox: null       // the reply being written to an earlier comment: { to, editing, text }
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
      else if (k === "onKeydown") el.addEventListener("keydown", v);
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
  function focusOn(el) {
    if (!el) return false;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    return document.activeElement === el;
  }
  // action (optional): { label, run, focus, back } adds one button, such as
  // Undo, and keeps the message up longer so there is time to press it. With
  // focus (a delete made from the keyboard) the keyboard goes to the button,
  // and the message stays up while it is there; Escape on it closes the
  // message and back() says where the keyboard goes then. An Undo on offer is
  // on Ctrl+Z too (see the wiring).
  var toastTimer = null, toastUndo = null;
  function hideToast() { clearTimeout(toastTimer); toastUndo = null; $("toast").className = "toast hidden"; }
  function toast(msg, kind, action) {
    var t = $("toast"), btn = null;
    t.textContent = msg;
    toastUndo = null;
    if (action) {
      var press = function () { hideToast(); action.run(); };
      btn = h("button", { type: "button", class: "rr-toast-act", text: action.label, onClick: press });
      btn.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        e.preventDefault(); hideToast();
        if (action.back) action.back();
      });
      t.appendChild(btn);
      if (action.label === "Undo") toastUndo = press;
    }
    t.className = "toast" + (kind ? " " + kind : "");
    clearTimeout(toastTimer);
    (function wait(ms) {
      toastTimer = setTimeout(function () { if (t.contains(document.activeElement)) wait(1500); else hideToast(); }, ms);
    })(action ? 8000 : 4200);
    if (btn && action.focus) focusOn(btn);
  }
  // Was this click made from the keyboard (Enter or Space on the button)?
  function byKeyboard(ev) { return !!ev && ev.detail === 0; }
  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso || "");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  function fmtTime(when) {
    var d = new Date(when);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  // A value inside a quoted attribute selector. A pack's ids are its own, and
  // one with a quote or a backslash in it must not break the selector.
  function cssEsc(v) { v = String(v == null ? "" : v); return window.CSS && window.CSS.escape ? window.CSS.escape(v) : v.replace(/["\\]/g, "\\$&"); }
  // A map keyed by ids from a pack or a file: no inherited names, so an id
  // such as __proto__ is a key like any other.
  function mapOf() { return Object.create(null); }

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
    // Demo work is never kept, so the suite does not warn about it on close.
    if (A.HostBridge) A.HostBridge.setDirty(state.dirty && !state.demo);
    var b = $("btn-save");
    if (!b) return;
    b.textContent = state.dirty ? "Save*" : "Save";
    b.classList.toggle("btn-unsaved", state.dirty);
    b.title = "Shift+click to Save as" + (state.lastSave ? ". Last saved to " + state.lastSave.name + " at " + fmtTime(state.lastSave.at) + "." : "");
    if (state.review) b.removeAttribute("disabled"); else b.setAttribute("disabled", "");
  }
  function markClean() { state.dirty = false; cix = null; updateSaveButton(); }
  function touched() {
    state.dirty = true;
    cix = null;
    updateSaveButton();
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(writeAutosave, 800);
  }
  // The crash net. One entry per pack, holding the review only: the pack itself
  // is a file the reviewer already has. Only unsaved work is written, never the
  // demo's. While earlier work is still on offer (state.restore) the stored copy
  // holds both, so a crash before the reviewer answers loses neither.
  function writeAutosave() {
    if (state.demo || !state.review || !state.pack || !state.dirty) return;
    var r = state.restore ? withOffered() : state.review;
    if (!lsSet(KEY_AUTOSAVE + state.pack.packId, JSON.stringify({ savedOn: new Date().toISOString(), review: r })) && !autosaveBroken) {
      autosaveBroken = true;
      toast("Autosave is not working in this browser. Save to a file regularly.", "err");
    }
  }
  function clearAutosave() { if (!state.demo && state.pack) lsDel(KEY_AUTOSAVE + state.pack.packId); }
  function readAutosave(packId) {
    var raw = lsGet(KEY_AUTOSAVE + packId), snap = raw ? RC.parseJson(raw) : null;
    if (!snap || !snap.review || snap.review.packId !== packId || !hasWork(snap.review)) return null;
    normaliseReview(snap.review);
    return { savedOn: snap.savedOn || "", review: snap.review };
  }
  // Anything the reviewer would mind losing: a dismissed check and a note for
  // the author count as much as a comment does.
  function hasWork(r) {
    return !!(r && ((r.comments && r.comments.length) || (r.verdict && ((r.verdict.value && r.verdict.value !== "none") || RC.norm(r.verdict.note))) ||
      (r.checklist && r.checklist.some(function (c) { return c.answer || c.note; })) || (r.confirmations && r.confirmations.length) ||
      (r.dismissedChecks && r.dismissedChecks.length) || (r.replies && r.replies.length)));
  }
  function normaliseReview(r) {
    ["checklist", "dismissedChecks", "confirmations", "comments"].forEach(function (k) { if (!Array.isArray(r[k])) r[k] = []; });
    // An answer or confirmation that is not an object says nothing: drop it.
    ["checklist", "confirmations"].forEach(function (k) { r[k] = r[k].filter(function (x) { return x && typeof x === "object"; }); });
    if (!r.verdict || typeof r.verdict !== "object") r.verdict = { value: "none", date: "", note: "" };
    if (!r.verdict.value) r.verdict.value = "none";
    // Replies to earlier comments are optional: a file without them has no
    // such key, and one that is not whole says nothing.
    if (Array.isArray(r.replies)) r.replies = r.replies.filter(function (x) { return x && typeof x === "object" && x.id && x.to && typeof x.text === "string"; });
    else delete r.replies;
    return r;
  }
  function stamp(x) { var t = Date.parse(x || ""); return isNaN(t) ? 0 : t; }
  function indexBy(list, key, v) {
    for (var i = 0; i < list.length; i++) if (list[i] && list[i][key] === v) return i;
    return -1;
  }
  // One review holding the work of two. It keeps the target's identity (file
  // id, reviewer, when saved), so Save still writes the file that is open.
  // Comments, confirmations and dismissed checks are unions keyed by id, and a
  // comment in both keeps its later edit. Checklist answers and the verdict
  // come from `other` when otherWins; otherwise they only fill in what the
  // target has left blank. Nothing either side holds is dropped.
  function mergeReviews(target, other, otherWins) {
    var m = normaliseReview(JSON.parse(JSON.stringify(target)));
    var o = normaliseReview(JSON.parse(JSON.stringify(other || {})));
    o.comments.forEach(function (c) {
      var i = indexBy(m.comments, "id", c.id);
      if (i < 0) m.comments.push(c);
      else if (stamp(c.updatedAt) > stamp(m.comments[i].updatedAt)) m.comments[i] = c;
    });
    o.confirmations.forEach(function (c) { if (indexBy(m.confirmations, "commentId", c.commentId) < 0) m.confirmations.push(c); });
    o.dismissedChecks.forEach(function (id) { if (m.dismissedChecks.indexOf(id) < 0) m.dismissedChecks.push(id); });
    // Replies are a union by id too, and one in both keeps its later edit.
    (o.replies || []).forEach(function (x) {
      if (!m.replies) m.replies = [];
      var i = indexBy(m.replies, "id", x.id);
      if (i < 0) m.replies.push(x);
      else if (stamp(x.at) > stamp(m.replies[i].at)) m.replies[i] = x;
    });
    if (o.dismissedCheckTitles && typeof o.dismissedCheckTitles === "object") {
      m.dismissedCheckTitles = m.dismissedCheckTitles || {};
      Object.keys(o.dismissedCheckTitles).forEach(function (k) { if (!(k in m.dismissedCheckTitles)) m.dismissedCheckTitles[k] = o.dismissedCheckTitles[k]; });
    }
    o.checklist.forEach(function (c) {
      if (!c || (!c.answer && !c.note)) return;
      var i = indexBy(m.checklist, "id", c.id);
      if (i < 0) m.checklist.push(c);
      else if (otherWins || (!m.checklist[i].answer && !m.checklist[i].note)) m.checklist[i] = c;
    });
    var ov = o.verdict, mv = m.verdict;
    if ((ov.value !== "none" || ov.note) && (otherWins || (mv.value === "none" && !mv.note))) m.verdict = ov;
    return m;
  }
  function reviewContent(r) {
    return JSON.stringify([r.comments, r.checklist.filter(function (c) { return c.answer || c.note; }), r.verdict, r.confirmations, r.dismissedChecks, r.replies || []]);
  }
  // Would adding `other` change anything in `r`?
  function addsTo(r, other, otherWins) { return reviewContent(mergeReviews(r, other, otherWins)) !== reviewContent(normaliseReview(r)); }
  // The open review and the work on offer together: what Restore gives. Over
  // an opened file, the file stays the one Save writes; otherwise the work
  // carries on as the review it was. What was done most recently wins a
  // disagreement over a checklist answer or the verdict.
  function withOffered() {
    var snap = state.restore;
    return snap.overFile ? mergeReviews(state.review, snap.review, snap.newer && !state.dirty)
      : mergeReviews(snap.review, state.review, state.dirty);
  }

  // ---------- small dialogs ----------
  // In the page, never confirm(): that blocks a headless run and looks foreign
  // in the exe. build(m) returns the dialog's children; m.close() shuts it and
  // m.cancel() shuts it and calls onCancel. Escape and a click outside cancel.
  // The keyboard goes into it when it opens (its first field, else the main
  // button, which in every dialog here is the one that loses nothing), Tab
  // stays inside it, and closing it puts the keyboard back where it was.
  function modal(label, build, onCancel, cls) {
    var back = null, box = null, opener = document.activeElement, openerKey = focusKey(opener), shut = false;
    function stops() {
      return Array.prototype.filter.call(box.querySelectorAll("button, input, select, textarea, a[href]"), function (el) { return !el.disabled; });
    }
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); m.cancel(); return; }
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
        if (back && back.parentNode) back.parentNode.removeChild(back);
        document.removeEventListener("keydown", onKey, true);
        // The page may have been drawn again while it was up.
        if (!focusOn(opener && opener !== document.body && opener.isConnected ? opener : null)) focusBack(openerKey);
      },
      cancel: function () { if (shut) return; m.close(); if (onCancel) onCancel(); }
    };
    box = h("div", { class: "rr-modal" + (cls ? " " + cls : ""), role: "dialog", "aria-modal": "true", "aria-label": label }, build(m));
    back = h("div", { class: "rr-modal-back" }, [box]);
    back.addEventListener("click", function (e) { if (e.target === back) m.cancel(); });
    document.addEventListener("keydown", onKey, true);
    document.body.appendChild(back);
    focusOn(box.querySelector("input, textarea, select") || box.querySelector(".btn.primary") || box.querySelector("button"));
    return m;
  }

  // ---------- the reviewer's name ----------
  // Asked once, then remembered in this browser. Cancelling leaves things as
  // they were: onCancel, if given, is told.
  function reviewerName() { return RC.norm(lsGet(KEY_REVIEWER)); }
  function sameName(a, b) {
    function k(s) { return RC.norm(s).toLowerCase().replace(/[.\s]/g, ""); }
    return k(a) === k(b);
  }
  function withReviewerName(cb, onCancel) {
    var n = reviewerName();
    if (state.review && state.review.reviewer) { cb(state.review.reviewer); return; }
    if (n) { if (state.review) state.review.reviewer = n; cb(n); return; }
    askName(cb, undefined, onCancel);
  }
  function askName(cb, current, onCancel) {
    var input = h("input", { type: "text", id: "rr-name-input", value: current || "", "aria-label": "Your name", placeholder: "For example J. Marsh" });
    var dlg = modal("Your name", function (m) {
      return [
        h("h2", { text: "Your name" }),
        h("div", { text: "It goes on your comments and your review file." }),
        input,
        h("div", { class: "btn-row" }, [
          h("button", { type: "button", class: "btn", id: "rr-name-cancel", text: "Cancel", onClick: m.cancel }),
          h("button", { type: "button", class: "btn primary", id: "rr-name-ok", text: "Carry on", onClick: go })
        ])
      ];
    }, onCancel);
    function go() {
      var v = RC.norm(input.value);
      if (!v) { input.focus(); return; }
      lsSet(KEY_REVIEWER, v);
      var saved = [], old = state.review ? state.review.reviewer : "";
      if (state.review) {
        // Only your own comments take the new name: a file can hold comments
        // that came from elsewhere, and a rename must never claim them. Nor,
        // unless asked, does what the opened file already held under the old
        // name: after taking over a colleague's file, that name is theirs.
        var from = state.openedFrom && old && sameName(state.openedFrom.reviewer, old) ? state.openedFrom.ids : [];
        state.review.reviewer = v;
        state.review.comments.forEach(function (c) {
          if (c.reviewer && !(old && c.reviewer === old)) return;
          if (c.reviewer && from.indexOf(c.id) !== -1) { if (c.reviewer !== v) saved.push(c); } else c.reviewer = v;
        });
      }
      dlg.close();
      if (cb) cb(v);
      render();
      if (saved.length) askAlsoRename(saved, old, v);
    }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
    try { input.focus(); } catch (e) {}
  }
  // After a change of name: the comments the opened file already held under
  // the old name keep it, unless the reviewer says they are theirs.
  function askAlsoRename(list, old, v) {
    modal("Comments already in the file", function (m) {
      return [
        h("h2", { text: "Also put your new name on " + RC.plural(list.length, "comment") + " already saved as " + old + "?" }),
        h("p", { text: "Only if they are yours under another spelling." }),
        h("div", { class: "rr-modal-choices" }, [
          h("button", { type: "button", class: "btn primary", id: "rr-rename-keep", text: "Leave them as " + old, onClick: m.cancel }),
          h("button", { type: "button", class: "btn", id: "rr-rename-also", text: "They are mine: put " + v + " on them", onClick: function () {
            m.close();
            list.forEach(function (c) { if (c.reviewer === old) c.reviewer = v; });
            touched(); render();
          } })
        ])
      ];
    });
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
  // Sections ticked as read: kept in this browser per pack (not for the demo).
  function readSet(packId) {
    var v = state.demo ? null : RC.parseJson(lsGet(KEY_READ + packId) || "null"), out = {};
    if (Array.isArray(v)) v.forEach(function (k) { if (typeof k === "string") out[k] = true; });
    return out;
  }
  function isRead(d, id) { return !!(state.read && state.read[d + "|" + id]); }
  function setRead(d, id, on) {
    state.read = state.read || {};
    if (on) state.read[d + "|" + id] = true; else delete state.read[d + "|" + id];
    if (!state.demo && state.pack) lsSet(KEY_READ + state.pack.packId, JSON.stringify(Object.keys(state.read)));
  }
  function seenOf(packId) { var v = RC.parseJson(lsGet(KEY_SEEN + packId) || "null"); return v && typeof v === "object" ? v : null; }
  function noteSeen(packId, patch) {
    if (state.demo || !packId) return;
    var v = seenOf(packId) || {};
    Object.keys(patch).forEach(function (k) { if (patch[k] != null) v[k] = patch[k]; });
    lsSet(KEY_SEEN + packId, JSON.stringify(v));
  }
  function openPack(pack, isDemo, name) {
    closeFileQuestion();
    // Unsaved work on the pack being left is stored first: a write still
    // waiting would be lost, and it is offered back when that pack is opened.
    if (state.dirty) writeAutosave();
    state.openedFrom = null;
    state.undoOpen = null;
    state.demo = !!isDemo;
    state.pack = pack;
    state.review = newReview(pack);
    state.page = "report";
    state.docIndex = 0;
    state.composer = null;
    state.replyBox = null;
    state.checks = null;
    state.itemTarget = "";
    state.handle = null;
    state.restore = null;
    state.savedHint = null;
    state.colleague = null;
    state.checksAll = null;
    state.itemsAll = false;
    state.lastSave = null;
    state.read = readSet(pack.packId);
    clearTimeout(autosaveTimer);
    if (!isDemo) {
      state.restore = readAutosave(pack.packId);
      // A shared browser may hold someone else's unsaved work: it is offered
      // under their name, and Restore asks whose it is (see restoreBar).
      var sr = state.restore && RC.norm(state.restore.review.reviewer);
      if (sr && !(reviewerName() && sameName(sr, reviewerName()))) state.restore.someoneElse = sr;
      if (name) noteSeen(pack.packId, { packName: name, packRound: pack.round || 1 });
      var seen = seenOf(pack.packId);
      // Only your own: a shared browser may have saved someone else's.
      if (seen && seen.reviewName && (!seen.reviewer || !reviewerName() || sameName(seen.reviewer, reviewerName()))) state.savedHint = seen;
    }
    markClean();
  }

  // Opening a review file, for the open pack. It asks first where opening it
  // could lose work or put the wrong name on it, so it may answer later:
  // done(result) with "opened", "pending" (held until its pack is opened),
  // "colleague" (someone else's, shown read only beside your own), or false.
  function openReviewFile(file, handle, name, done) {
    done = done || function () {};
    normaliseReview(file);
    if (!file.fileId) file.fileId = RC.newId("rf");
    if (!state.pack || state.demo && file.packId !== state.pack.packId) {
      // Before its pack: keep it, and open it when that pack is opened.
      state.pendingReview = { file: file, handle: handle || null, name: name || "" };
      return done("pending");
    }
    // An answer can come after another pack was opened: never put this file
    // on a pack it does not answer.
    function wrongPack() {
      if (state.pack && file.packId === state.pack.packId) return false;
      toast("This review file answers a different pack" + (file.round ? " (round " + file.round + ")" : "") + ", not the one that is open.", "err");
      return true;
    }
    if (wrongPack()) return done(false);
    // Someone else's file, or a file named for someone when this browser has
    // no name yet. Carrying on as them is right for your own review under
    // another spelling, or a handover; anything else must not put your
    // comments under their name or save over their file.
    var me = reviewerName(), theirs = RC.norm(file.reviewer), asName = null, fromName = null;
    if (theirs && !(me && sameName(me, theirs))) {
      render();
      whose(theirs, "file", function (choice) {
        if (!choice || wrongPack()) return done(false);
        if (choice === "theirs") adopt(theirs, me);
        else { state.undoOpen = openState(); showColleague(file, name); done("colleague"); }
      });
      return;
    }
    adopt(null, null);

    // setName: the name this browser takes on; renameFrom: the name the
    // unsaved comments carried in were made under, which become the file's.
    function adopt(setName, renameFrom) {
      asName = setName; fromName = renameFrom;
      // Unsaved comments here are added to the file, never dropped.
      if (!(state.dirty && hasWork(state.review))) return take(false);
      askMerge(name, function (yes) {
        if (!yes || wrongPack()) return done(false);
        take(state.dirty && hasWork(state.review));
      });
    }
    function take(withLive) {
      // Store the unsaved work first: a write still waiting would be lost.
      if (state.dirty) writeAutosave();
      state.undoOpen = openState();
      if (asName) lsSet(KEY_REVIEWER, asName);
      var live = withLive ? JSON.parse(JSON.stringify(state.review)) : null;
      if (live && fromName) live.comments.forEach(function (c) { if (!c.reviewer || sameName(c.reviewer, fromName)) c.reviewer = RC.norm(file.reviewer); });
      // Unsaved work kept by this browser (a crash, or leaving without saving)
      // stays on offer when the file does not already hold it.
      var snap = state.restore || readAutosave(file.packId);
      clearTimeout(autosaveTimer);
      state.review = live ? mergeReviews(file, live, true) : file;
      // What the file held when it was opened, and under whose name: a later
      // change of name leaves those comments alone unless asked to.
      state.openedFrom = { reviewer: RC.norm(file.reviewer), ids: file.comments.map(function (c) { return c.id; }) };
      state.handle = handle || null;
      state.composer = null;
      state.replyBox = null;
      state.pendingReview = null;
      state.savedHint = null;
      state.colleague = null;
      state.restore = null;
      state.carried = !!live;
      if (snap) {
        var newer = !stamp(file.savedAt) || !stamp(snap.savedOn) || stamp(snap.savedOn) > stamp(file.savedAt);
        if (addsTo(state.review, snap.review, newer)) state.restore = { savedOn: snap.savedOn, review: snap.review, overFile: true, newer: newer };
      }
      if (!state.restore && !live) clearAutosave();
      noteSeen(file.packId, { reviewName: name || "", savedAt: file.savedAt || "", reviewer: RC.norm(state.review.reviewer) });
      if (live) touched(); else markClean();
      done("opened");
    }
  }
  // What opening a review file changes, so a file that turns out not to draw
  // can be taken off again (see show).
  function openState() {
    return { review: state.review, handle: state.handle, restore: state.restore, savedHint: state.savedHint, colleague: state.colleague,
      carried: state.carried, openedFrom: state.openedFrom, dirty: state.dirty, composer: state.composer, pendingReview: state.pendingReview };
  }
  // The questions asked while a file opens. Opening another pack closes one
  // still up, as its answer would be about the pack before.
  var fileQuestion = null;
  function closeFileQuestion() { var q = fileQuestion; fileQuestion = null; if (q) q.cancel(); }
  // Is the person here `theirs`? cb("theirs"), cb("mine") for someone else, or
  // cb(null) when they cancel. With no name in this browser yet, someone else
  // is asked for theirs. what: "file" for a review file, "work" for unsaved
  // work this browser kept.
  function whose(theirs, what, cb) {
    var me = reviewerName();
    askWhose(me, theirs, what, function (choice) {
      if (choice !== "mine" || me) return cb(choice);
      askName(function (v) { cb(sameName(v, theirs) ? "theirs" : "mine"); }, "", function () { cb(null); });
    });
  }
  function askWhose(me, theirs, what, cb) {
    var isFile = what !== "work";
    fileQuestion = modal(isFile ? "Whose review file" : "Whose unsaved work", function (m) {
      function pick(v) { return function () { fileQuestion = null; m.close(); cb(v); }; }
      return [
        h("h2", { text: "This is " + theirs + (isFile ? "'s review file" : "'s unsaved work") }),
        h("p", { text: "If you carry on as " + theirs + ", what you add goes out under their name" + (isFile ? " and Save writes into their file." : ".") }),
        h("div", { class: "rr-modal-choices" }, [
          h("button", { type: "button", class: "btn primary", id: "rr-whose-mine", text: (me ? "I am " + me : "I am someone else") + ": show their comments, read only", onClick: pick("mine") }),
          h("button", { type: "button", class: "btn", id: "rr-whose-theirs", text: "I am " + theirs + ": carry on as " + theirs, onClick: pick("theirs") }),
          h("button", { type: "button", class: "btn", id: "rr-whose-cancel", text: "Cancel", onClick: m.cancel })
        ])
      ];
    }, function () { fileQuestion = null; cb(null); });
  }
  // Asked in the page, like every other question here: never confirm().
  function askMerge(name, cb) {
    fileQuestion = modal("Unsaved work", function (m) {
      function pick(v) { return function () { fileQuestion = null; m.close(); cb(v); }; }
      return [
        h("h2", { text: "You have unsaved work on this pack" }),
        h("p", { text: "It can be added to the review file you are opening" + (name ? " (" + name + ")" : "") + "." }),
        h("div", { class: "rr-modal-choices" }, [
          h("button", { type: "button", class: "btn primary", id: "rr-merge-yes", text: "Add it to the review file", onClick: pick(true) }),
          h("button", { type: "button", class: "btn", id: "rr-merge-no", text: "Leave everything as it is", onClick: m.cancel })
        ])
      ];
    }, function () { fileQuestion = null; cb(false); });
  }
  // Opening another pack over unsaved work. cb(true) to open it.
  function askLeave(cb) {
    closeFileQuestion();   // one question at a time
    fileQuestion = modal("Unsaved review", function (m) {
      function pick(v) { return function () { fileQuestion = null; m.close(); cb(v); }; }
      return [
        h("h2", { text: "Your review of the open pack is not saved" }),
        h("p", { text: "Save it first if you want to keep it in your review file." }),
        h("div", { class: "rr-modal-choices" }, [
          h("button", { type: "button", class: "btn primary", id: "rr-leave-no", text: "Stay on the open pack", onClick: m.cancel }),
          h("button", { type: "button", class: "btn", id: "rr-leave-yes", text: "Open the pack without saving", onClick: pick(true) })
        ])
      ];
    }, function () { fileQuestion = null; cb(false); });
  }
  function showColleague(file, name) {
    state.colleague = { reviewer: RC.norm(file.reviewer), round: file.round, name: name || "", fileId: file.fileId,
      comments: file.comments.filter(function (c) { return c && c.anchor; }), replies: file.replies || [], verdict: file.verdict };
  }
  function colleagueOnBlock(id, d) {
    return state.colleague ? (placeIndex().theirBlock[d + "|" + id] || []).filter(function (c) { return c.anchor.documentIndex === d && c.anchor.blockId === id; }) : [];
  }
  function colleagueOnItem(i) {
    return state.colleague ? (placeIndex().theirItem[String(i.itemId)] || []).filter(function (c) { return onItem(c.anchor, i); }) : [];
  }

  // What a file is, with messages for the mistakes people make: the Word
  // report dropped instead of the pack, or a pack or file that is incomplete.
  function textOrNone(v) { return v == null || typeof v === "string"; }
  function identifyFile(text) {
    var t = String(text || "");
    if (/^PK/.test(t)) return { ok: false, error: "This is a Word or Excel file. Open the review pack (.json) instead." };
    if (/^%PDF/.test(t)) return { ok: false, error: "This is a PDF. Open the review pack (.json) instead." };
    var d = RC.parseJson(t);
    if (!d || typeof d !== "object") return { ok: false, error: "This is not a review pack or a review file: it could not be read." };
    var id = RC.identify(t);
    if (!id.ok) return id;
    if (id.kind === "pack") {
      if (!d.engagement || typeof d.engagement !== "object") return { ok: false, error: "This review pack is incomplete: it has no engagement details. Ask the author to send it again." };
      if (d.documents.some(function (x) { return !x || !Array.isArray(x.blocks); })) return { ok: false, error: "This review pack is incomplete: a document in it has no report text. Ask the author to send it again." };
    } else if (d.comments.some(function (c) {
      return !c || typeof c !== "object" || !c.id || !c.anchor || typeof c.anchor !== "object" || !textOrNone(c.text) || !textOrNone(c.suggestion);
    })) {
      return { ok: false, error: "This review file is damaged: some of its comments cannot be read." };
    }
    return id;
  }

  // texts: [{ name, text, handle }]. Packs first, so a pack and a review file
  // dropped together open in the right order, and a review file opened before
  // its pack waits for it. Returns the number opened straight away; a file
  // that needs a question answered is counted when it is answered.
  function loadTexts(texts) {
    var parsed = [], opened = 0, outcomes = [];
    texts.forEach(function (f) {
      var id = identifyFile(f.text);
      if (!id.ok) { toast(f.name + ": " + id.error, "err"); return; }
      parsed.push({ name: f.name, id: id, handle: f.handle });
    });
    var packs = parsed.filter(function (p) { return p.id.kind === "pack"; });
    var files = parsed.filter(function (p) { return p.id.kind !== "pack"; });
    var realInTour = false, failed = false;
    function openOne(p) {
      var pending = state.pendingReview;
      openPack(p.id.data, false, p.name);
      noteRecent("open", p.name, p.handle, "Review pack");
      opened++;
      outcomes.push("pack");
      if (TOUR_MODE) realInTour = true;
      // The review file that came first, now that its pack is here.
      if (pending && pending.file.packId === p.id.data.packId && !files.length) {
        files.push({ name: pending.name, id: { kind: "review", data: pending.file }, handle: pending.handle, held: true });
      }
    }
    // A pack over unsaved work asks first, in the page; the review files
    // wait for the answer.
    (function nextPack(k) {
      if (k >= packs.length) { next(0); return; }
      if (!(state.dirty && hasWork(state.review))) { openOne(packs[k]); nextPack(k + 1); return; }
      askLeave(function (yes) { if (yes) openOne(packs[k]); nextPack(k + 1); });
    })(0);
    function next(i) {
      if (i >= files.length) { if (opened) finish(); return; }
      var p = files[i];
      openReviewFile(p.id.data, p.handle, p.name, function (res) {
        if (res && !p.held) noteRecent("open", p.name, p.handle, "Review file");
        if (res) { opened++; outcomes.push(res); } else failed = true;
        next(i + 1);
      });
    }
    function finish() {
      if (!show()) return;
      var last = outcomes[outcomes.length - 1], r = state.review, msg;
      if (failed && last === "pack") return;   // the file's own message stands
      if (last === "pending") {
        var pr = state.pendingReview, seen = seenOf(pr.file.packId);
        msg = "Now open the review pack for this file" + (seen && seen.packName ? ": " + seen.packName : " (round " + (pr.file.round || 1) + ")") + ".";
      } else if (last === "colleague") {
        msg = state.colleague.reviewer + "'s comments are shown read only.";
      } else if (last === "opened") {
        msg = state.restore ? "Your review file is open. Unsaved work not in it is offered at the top of the page."
          : state.carried ? "Your review file is open, with your unsaved work added to it. Save to keep it."
          : "Your review is open (round " + (r.round || state.pack.round) + (r.reviewer ? ", as " + r.reviewer : "") + ").";
      } else {
        msg = "Review pack opened: round " + state.pack.round + "." + (realInTour ? " This is the tour's window: use the Report Review Tool for real work." : "");
      }
      toast(msg);
    }
    return opened;
  }
  // Draws the page. A review file that cannot be drawn is taken off again,
  // leaving the review as it was before it was opened; a pack that cannot be
  // drawn is closed again, with a message, rather than leaving an empty page.
  function show() {
    var undo = state.undoOpen;
    state.undoOpen = null;
    try { render(); return true; } catch (e) {
      if (undo && state.pack) {
        try {
          Object.keys(undo).forEach(function (k) { state[k] = undo[k]; });
          updateSaveButton();
          // Put the crash copy back as it was: opening the file may have cleared it.
          if (state.dirty) writeAutosave();
          else if (state.restore) lsSet(KEY_AUTOSAVE + state.pack.packId, JSON.stringify({ savedOn: state.restore.savedOn, review: state.restore.review }));
          render();
          toast("That review file is damaged and was not opened.", "err");
          return false;
        } catch (e2) {}
      }
      state.pack = null; state.review = null; state.restore = null; state.savedHint = null; state.colleague = null;
      state.page = "welcome"; state.composer = null;
      markClean(); render();
      toast("That pack is damaged or incomplete. Ask the author to send it again.", "err");
      return false;
    }
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
  // kind labels the entry in the suite's Recent files ("Review pack" or
  // "Review file"), so a renamed file is still labelled right.
  function noteRecent(action, name, handle, kind) {
    var B = HB();
    if (!B || !name || state.demo) return;
    B.recent({ action: action, name: name, handle: handle || null, kind: kind || "", label: state.pack ? (state.pack.engagement || {}).client || "" : "" });
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
      // Never earlier than the last save: the author's tool keeps the later of
      // two saves, so a clock set back must not make this one look older.
      var now = new Date(), prev = Date.parse(state.review.savedAt || "");
      if (!isNaN(prev) && now.getTime() <= prev) now = new Date(prev + 1000);
      state.review.savedAt = now.toISOString();
      state.review.savedBy = { product: V.product, version: V.number };
      // So the author can read "7 of 9 answered" and what was dismissed, with
      // no checklist data or check engine of their own.
      state.review.checklistTotal = checklistTotal();
      state.review.dismissedCheckTitles = dismissedTitles();
      var text = JSON.stringify(state.review, null, 1);
      var name = suggestedName();
      var DEMO_SAVED = " There is no author to send the demo review to.";
      // A comment still being written is not in the file: say so, never block.
      var DRAFT = composerHasDraft() ? " Your unfinished comment is not in it: add it, then save again." : "";
      function saved(method, shown, handle) {
        state.lastSave = { name: shown, at: new Date().toISOString(), method: method, text: text };
        if (DRAFT) toast("Saved to " + shown + "." + DRAFT, "warn");
        // A write still waiting would put back what was just saved.
        clearTimeout(autosaveTimer);
        // Work still on offer is not in what was saved: keep it stored.
        if (state.restore) lsSet(KEY_AUTOSAVE + state.pack.packId, JSON.stringify({ savedOn: state.restore.savedOn, review: state.restore.review }));
        else clearAutosave();
        markClean();
        noteRecent("save", shown, handle, "Review file");
        noteSeen(state.pack.packId, { reviewName: shown, savedAt: state.review.savedAt, reviewer: RC.norm(state.review.reviewer) });
        // Only Summary says where the save went; elsewhere nothing in the
        // page changes, so nothing is drawn again under the reviewer.
        if (state.page === "summary") render(true); else renderHeader();
        onDone({ ok: true, method: method, name: shown, text: text });
      }
      function download(blocked) {
        RC.downloadText(text, name);
        toast(state.demo ? "Downloaded as " + name + "." + DEMO_SAVED
          : blocked ? "Review file downloaded as " + name + ". Each save here downloads a new copy."
          : "Review file downloaded as " + name + ".");
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
            toast("Saved to " + handle.name + "." + (state.demo ? DEMO_SAVED : " Send it to the author."));
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
    }, function () { onDone({ ok: false, cancelled: true }); });
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
  // Which comments (your own, and a colleague's shown read only) are on which
  // block and which item: worked out once, then looked up, rather than every
  // comment being checked for every block drawn. Any change to the review
  // drops it (touched, markClean), and so does the start of every draw.
  var cix = null;
  function placeIndex() {
    if (cix) return cix;
    var ix = { block: mapOf(), item: mapOf(), theirBlock: mapOf(), theirItem: mapOf() };
    function put(map, k, c) { (map[k] = map[k] || []).push(c); }
    function add(list, blocks, items) {
      list.forEach(function (c) {
        var a = c && c.anchor;
        if (!a) return;
        if (a.kind === "block") put(blocks, a.documentIndex + "|" + a.blockId, c);
        else if (a.kind === "item") put(items, String(a.itemId), c);
      });
    }
    add(comments(), ix.block, ix.item);
    if (state.colleague) add(state.colleague.comments, ix.theirBlock, ix.theirItem);
    return (cix = ix);
  }
  function commentsOnBlock(id, doc) {
    return (placeIndex().block[doc + "|" + id] || []).filter(function (c) { return c.anchor.documentIndex === doc && c.anchor.blockId === id; });
  }
  function commentsOnItem(i) {
    return (placeIndex().item[String(i.itemId)] || []).filter(function (c) { return onItem(c.anchor, i); });
  }
  function severityLabel(id) { return (RC.SEVERITIES.filter(function (s) { return s.id === id; })[0] || { label: id }).label; }
  function prevComments() { return (state.pack.previousRound && state.pack.previousRound.comments) || []; }

  function isConfirmed(id) { return state.review.confirmations.some(function (c) { return c.commentId === id; }); }

  // ---------- replies to earlier comments ----------
  // From round 2 the reviewer can answer an earlier comment's thread without
  // raising the point again. They are kept in the review file as
  // replies: [{ id, to, text, at }], where "to" is the earlier comment's id.
  // A review with none has no such key, so older files are as they were.
  function replies() { return (state.review && state.review.replies) || []; }
  function repliesTo(id) { return replies().filter(function (r) { return r.to === id; }); }
  function replyHasDraft() {
    var b = state.replyBox;
    if (!b) return false;
    var ex = b.editing ? replies().filter(function (r) { return r.id === b.editing; })[0] : null;
    return ex ? RC.norm(b.text) !== RC.norm(ex.text) : !!RC.norm(b.text);
  }
  function focusReply() { focusOn(document.querySelector(".rr-reply-box textarea")); }
  function prevEl(id, sel) { return document.querySelector('#main [data-prev-id="' + cssEsc(id) + '"]' + (sel ? " " + sel : "")); }
  // One reply box at a time; a reply half written is not thrown away by
  // starting another.
  function openReply(to, editing) {
    var b = state.replyBox;
    if (b && b.to === to && (b.editing || "") === (editing || "")) { focusReply(); return; }
    if (replyHasDraft()) { toast("Add or cancel the reply you are writing first.", "warn"); focusReply(); return; }
    withReviewerName(function () {
      var ex = editing ? replies().filter(function (r) { return r.id === editing; })[0] : null;
      var was = state.replyBox && state.replyBox.to;
      state.replyBox = { to: to, editing: ex ? ex.id : null, text: ex ? ex.text : "" };
      redraw([], [was, to]);
      focusReply();
    });
  }
  function closeReply() {
    var to = state.replyBox && state.replyBox.to;
    state.replyBox = null;
    redraw([], [to]);
    if (to) focusOn(prevEl(to, ".rr-reply"));
  }
  function replyBoxNode() {
    var b = state.replyBox;
    // Escape closes an empty box; a reply half written stays.
    function onKey(e) {
      if (e.key !== "Escape") return;
      e.preventDefault(); e.stopPropagation();
      if (replyHasDraft()) toast("Add or cancel the reply you are writing first.", "warn"); else closeReply();
    }
    return h("div", { class: "rr-reply-box", onKeydown: onKey }, [
      h("textarea", { "aria-label": "Your reply", placeholder: "Your reply to the author", value: b.text || "", onInput: function (e) { b.text = e.target.value; } }),
      h("div", { class: "rr-actions" }, [
        h("button", { type: "button", class: "btn sm primary rr-reply-add", text: b.editing ? "Save reply" : "Add reply", onClick: function () {
          var text = String(b.text || "").trim(), now = new Date().toISOString();
          if (!text) { toast("Write the reply first.", "warn"); return; }
          var ex = b.editing ? replies().filter(function (r) { return r.id === b.editing; })[0] : null;
          if (ex) { ex.text = text; ex.at = now; }
          else {
            if (!Array.isArray(state.review.replies)) state.review.replies = [];
            state.review.replies.push({ id: RC.newId("r"), to: b.to, text: text, at: now });
          }
          touched(); closeReply();
        } }),
        h("button", { type: "button", class: "btn sm rr-reply-cancel", text: "Cancel", onClick: closeReply })
      ])
    ]);
  }
  // Delete at once, with Undo, as a comment is: the same reply goes back.
  function deleteReply(r, ev) {
    var review = state.review, idx = review.replies.indexOf(r), keys = byKeyboard(ev);
    review.replies = review.replies.filter(function (x) { return x !== r; });
    if (state.replyBox && state.replyBox.editing === r.id) state.replyBox = null;
    touched(); redraw([], [r.to]);
    function back() { focusOn(prevEl(r.to, ".rr-reply")); }
    if (!keys) back();
    toast("Reply deleted.", null, { label: "Undo", focus: keys, back: back, run: function () {
      if (state.review !== review || replies().indexOf(r) !== -1) return;
      if (!Array.isArray(review.replies)) review.replies = [];
      review.replies.splice(Math.min(idx, review.replies.length), 0, r);
      touched(); redraw([], [r.to]); toast("Reply restored.");
      if (!focusOn(document.querySelector('#main [data-reply-id="' + cssEsc(r.id) + '"] .rr-reply-edit'))) back();
    } });
  }
  // The thread under an earlier comment: the author's replies, a colleague's
  // (read only, when their file is open beside yours), then your own.
  function threadNode(p) {
    var id = p.comment.id, box = state.replyBox && state.replyBox.to === id ? state.replyBox : null, col = state.colleague;
    var rows = (p.replies || []).map(function (r) {
      return h("div", { class: "small" }, [h("strong", { text: r.author }), " " + r.text]);
    });
    (col ? col.replies || [] : []).forEach(function (r) {
      if (r.to !== id) return;
      rows.push(h("div", { class: "small rr-reply-theirs", "data-colleague-reply": r.id }, [h("strong", { text: col.reviewer }), " ", h("span", { class: "rr-chip", text: "Read only" }), " " + r.text]));
    });
    repliesTo(id).forEach(function (r) {
      if (box && box.editing === r.id) return;   // it is in the box below
      rows.push(h("div", { class: "small rr-reply-mine", "data-reply-id": r.id }, [
        h("strong", { text: state.review.reviewer || reviewerName() || "You" }), " ", h("span", { class: "rr-chip mine", text: "Your reply" }), " " + r.text + " ",
        h("span", { class: "rr-reply-acts" }, [
          h("button", { type: "button", class: "rr-linkbtn rr-reply-edit", text: "Edit", onClick: function () { openReply(id, r.id); } }), " ",
          h("button", { type: "button", class: "rr-linkbtn rr-reply-del", text: "Delete", onClick: function (ev) { deleteReply(r, ev); } })
        ])
      ]));
    });
    if (box) rows.push(replyBoxNode());
    return rows.length ? h("div", { class: "rr-replies" }, rows) : null;
  }

  // ---------- the composer ----------
  // { kind, anchor, severity, text, suggest, suggestion, editing, relatesTo, label }
  // There is one composer. A comment half written in it is never thrown away
  // by a click elsewhere: the click is refused with a nudge, and moving to
  // another page keeps it (it shows again beside its place, and a bar on other
  // pages leads back to it). Only Add, Save and Cancel end it.
  function composerHasDraft() {
    var c = state.composer;
    if (!c) return false;
    if (c.editing) {
      // An edit counts once it differs from the comment as saved.
      var ex = comments().filter(function (x) { return x.id === c.editing; })[0];
      if (!ex) return false;
      return RC.norm(c.text) !== RC.norm(ex.text) || c.severity !== ex.severity ||
        RC.norm(c.suggest ? c.suggestion : "") !== RC.norm(ex.suggestion || "");
    }
    if (RC.norm(c.text)) return true;
    // A suggestion starts as the text it is on; only a change to it is work.
    var start = c.field && c.fieldValue ? c.fieldValue(c.field) : c.anchor && c.anchor.quote;
    return !!(c.suggest && RC.norm(c.suggestion) && RC.norm(c.suggestion) !== RC.norm(start));
  }
  function sameAnchor(a, b) {
    if (!a || !b) return false;
    return a.kind === b.kind && (a.documentIndex || 0) === (b.documentIndex || 0) && (a.blockId || "") === (b.blockId || "") &&
      (a.targetName || "") === (b.targetName || "") && (a.itemId || "") === (b.itemId || "") && (a.sectionTitle || "") === (b.sectionTitle || "") &&
      // General comments under one title are told apart by what they quote
      // (a checklist question each).
      (a.kind !== "general" || RC.norm(a.quote) === RC.norm(b.quote));
  }
  // Where the draft is, in words, for the bar on other pages.
  function draftWhere() {
    var a = state.composer.anchor;
    if (a.kind === "item") return [a.targetName, a.code].filter(Boolean).join(": ");
    if (a.kind === "general") return a.sectionTitle || "the review";
    return (a.sectionTitle || "the cover") + docSuffix(a.documentIndex || 0);
  }
  // The page a composer is drawn on.
  function draftPage() {
    var c = state.composer, a = c.anchor;
    if (c.relatesTo && !c.editing && (state.page === "previous" || a.kind === "general")) return "previous";
    if (c.editing && state.page === "summary") return "summary";
    if (a.kind === "item" || (a.kind === "general" && a.sectionTitle === "Basis of assessment")) return "engagement";
    if (isChecklistAnchor(a)) return "checklist";
    if (a.kind === "general") return "summary";
    return "report";
  }
  function goToDraft() {
    var c = state.composer;
    if (!c) return;
    var a = c.anchor, page = draftPage();
    if (page === "report") { if (state.page !== "report" || state.docIndex !== (a.documentIndex || 0)) { jumpToBlock(a.documentIndex, a.blockId); return; } }
    else if (page === "engagement" && a.kind === "item") { if (state.page !== "engagement") { jumpToItem(a.targetName, a.itemId, a.targetId); return; } }
    else if (state.page !== page) { state.page = page; render(); }
    flashComposer();
  }
  function flashComposer() {
    var el = document.querySelector(".rr-composer");
    if (!el) return;
    if (el.scrollIntoView) el.scrollIntoView({ block: "center" });
    focusOn(el.querySelector("textarea"));
    el.classList.add("flash");
    setTimeout(function () { el.classList.remove("flash"); }, 1500);
  }
  // True (with a nudge) when a draft is in the way of what was clicked.
  function holdDraft() {
    if (!composerHasDraft()) return false;
    var here = !!document.querySelector(".rr-composer");
    toast("Add or cancel the comment you are writing first.", "warn", here ? null : { label: "Go to it", run: goToDraft });
    if (here) flashComposer();
    return true;
  }
  function openComposer(c) {
    var cur = state.composer;
    if (cur && composerHasDraft() && !(sameAnchor(cur.anchor, c.anchor) && (cur.editing || "") === (c.editing || "") && (cur.relatesTo || "") === (c.relatesTo || ""))) { holdDraft(); return; }
    withReviewerName(function () {
      var was = state.composer;
      state.composer = c;
      redraw([was && was.anchor, c.anchor], [was && was.relatesTo, c.relatesTo]);
      focusOn(document.querySelector(".rr-composer textarea"));
      // A line on the cover has its box under the cover: bring it into view.
      var cz = document.querySelector(".rr-cover-notes > .rr-composer");
      if (cz && cz.scrollIntoView) cz.scrollIntoView({ block: "nearest" });
    });
  }
  // The place a comment is on, for the keyboard: its block or its cell, its
  // item's Comment button, the button that comments on the basis, or the
  // checklist question's link.
  function placeEl(a) {
    if (!a) return null;
    var el = null;
    if (a.kind === "block" && state.page === "report") {
      el = document.querySelector('#rr-paper [data-block-id="' + cssEsc(a.blockId) + '"]');
      var td = el && a.cell ? el.querySelector('td[data-cell="' + a.cell.row + "." + a.cell.col + '"]') : null;
      if (td) el = td;
    } else if (a.kind === "item" && state.page === "engagement") {
      el = Array.prototype.filter.call(document.querySelectorAll(".rr-item"), function (n) { return n.getAttribute("data-item-id") === a.itemId && n.getAttribute("data-target") === a.targetName; })[0];
      el = el && el.querySelector(".rr-item-comment");
    } else if (a.kind === "general" && state.page === "engagement") el = document.querySelector(".rr-basis-comment");
    else if (isChecklistAnchor(a) && state.page === "checklist") {
      el = Array.prototype.filter.call(document.querySelectorAll(".rr-q"), function (n) { return RC.norm((n.firstChild || {}).textContent) === RC.norm(a.quote); })[0];
      el = el && (el.querySelector(".rr-q-why-add") || el.querySelector("[data-answer]"));
    }
    return el;
  }
  function commentEl(id, sel) { return document.querySelector('#main [data-comment-id="' + cssEsc(id) + '"]' + (sel ? " " + sel : "")); }
  // Closing the composer puts the keyboard back where it was opened from: the
  // comment's Edit, the earlier comment's Raise it again, or the place the
  // comment is on. A comment just added (`added`) takes it to its Edit, except
  // on the Report page, where it goes back to the paragraph to read on.
  function closeComposer(added) {
    var c = state.composer, a = c && c.anchor;
    state.composer = null;
    redraw([a], [c && c.relatesTo]);
    if (!a) return;
    if (c.editing && focusOn(commentEl(c.editing, ".rr-edit"))) return;
    if (added && state.page !== "report" && focusOn(commentEl(added.id, ".rr-edit"))) return;
    if (c.relatesTo && !added && focusOn(prevEl(c.relatesTo, ".rr-raise"))) return;
    focusOn(placeEl(a));
  }
  // What each severity means, beside the buttons. review-core may carry the
  // wording (SEVERITIES[].help); this is the same wording, for an older copy.
  var SEV_HELP = {
    "must-fix": "Wrong, misleading, or not fit to send to the client. The author's Issue check warns while any are open.",
    "should-fix": "Weakens the report. The author should change it unless there is a good reason not to.",
    suggestion: "An improvement the author can take or leave."
  };
  function sevHelp(s) { return s.help || SEV_HELP[s.id] || ""; }
  function composerNode() {
    var c = state.composer;
    var help = h("div", { class: "small muted rr-sev-help", text: sevHelp(RC.SEVERITIES.filter(function (s) { return s.id === c.severity; })[0] || {}) });
    var sev = h("div", { class: "rr-seg", role: "group", "aria-label": "Severity" }, RC.SEVERITIES.map(function (s) {
      return h("button", { type: "button", class: s.id + (c.severity === s.id ? " on" : ""), "data-severity": s.id, text: s.label, title: sevHelp(s), "aria-pressed": c.severity === s.id ? "true" : "false", onClick: function (ev) {
        ev.stopPropagation(); c.severity = s.id;
        var bs = ev.currentTarget.parentNode.querySelectorAll("button");
        Array.prototype.forEach.call(bs, function (b) { var on = b === ev.currentTarget; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
        help.textContent = sevHelp(s);
      } });
    }));
    var text = h("textarea", { class: "rr-c-text", placeholder: "Your comment", "aria-label": "Your comment", value: c.text || "", onInput: function (e) { c.text = e.target.value; } });
    var kids = [];
    if (c.label) kids.push(h("div", { class: "small muted", text: c.label }));
    kids.push(sev, help, text);
    if (c.fields) {
      var select = h("select", { class: "rr-c-field", "aria-label": "Which field the suggestion is for", onChange: function (e) {
        c.field = e.target.value;
        c.suggestion = c.fieldValue(c.field);
        c.suggest = !!c.field;
        redrawComposer();
      } }, [h("option", { value: "", text: "No suggested wording" })].concat(c.fields.map(function (f) {
        var o = h("option", { value: f[0], text: "Suggest wording for: " + f[1] });
        if (f[0] === c.field) o.selected = true;
        return o;
      })));
      kids.push(select);
    } else if (c.canSuggest !== false) {
      var box = h("input", { type: "checkbox", class: "rr-c-suggest" });
      box.checked = !!c.suggest;
      box.addEventListener("change", function () { c.suggest = box.checked; redrawComposer(); });
      kids.push(h("label", { class: "small" }, [box, " Suggest wording"]));
    }
    if (c.suggest) {
      // The wording it started from: the field's, or the text the comment is
      // on. Under the box, what the suggestion changes in it, as it is typed.
      var orig = String((c.field && c.fieldValue ? c.fieldValue(c.field) : c.anchor && c.anchor.quote) || "");
      var sug = h("textarea", { class: "rr-c-sug", "aria-label": "Suggested wording", value: c.suggestion || "" });
      var diff = h("div", { class: "rr-now small rr-sug-diff" }), diffTimer = null;
      // As tall as its wording, up to a limit (review.css), then it scrolls.
      var grow = function () { sug.style.height = "auto"; sug.style.height = (sug.scrollHeight + 2) + "px"; };
      var showDiff = function () {
        var now = c.suggestion || "", kids2 = [];
        if (RC.norm(now) === RC.norm(orig)) kids2.push(h("span", { class: "muted", text: orig ? "No change yet. Edit the wording above." : "Write the wording above." }));
        else {
          if (!RC.norm(orig)) kids2.push(h("span", { class: "muted", text: "There is no wording here now, so all of this is new." }));
          else if (!RC.norm(now)) kids2.push(h("span", { class: "muted", text: "The box is empty, so no wording is suggested." }));
          else kids2 = [h("span", { class: "rr-lbl", text: "What changes: " })].concat(wordDiff(orig, now));
          if (RC.norm(orig)) kids2.push(" ", h("button", { type: "button", class: "rr-linkbtn rr-sug-reset", text: "Start again from the original", onClick: function () {
            c.suggestion = orig; sug.value = orig; grow(); showDiff();
            focusOn(sug);
          } }));
        }
        diff.textContent = "";
        kids2.forEach(function (k) { diff.appendChild(typeof k === "string" ? document.createTextNode(k) : k); });
      };
      sug.addEventListener("input", function () {
        c.suggestion = sug.value; grow();
        clearTimeout(diffTimer); diffTimer = setTimeout(showDiff, 150);
      });
      showDiff();
      setTimeout(grow, 0);   // once it is in the page and has a size
      kids.push(sug, diff);
    }
    kids.push(h("div", { class: "rr-actions" }, [
      h("button", { type: "button", class: "btn sm primary rr-c-add", text: c.editing ? "Save comment" : "Add comment", onClick: function () {
        if (!RC.norm(c.text) && !(c.suggest && RC.norm(c.suggestion))) { toast("Write a comment or a suggestion first.", "warn"); return; }
        var sug = c.suggest && RC.norm(c.suggestion) ? c.suggestion : null;
        if (c.field) c.anchor.field = c.field;
        if (c.field && c.fieldValue) c.anchor.quote = c.fieldValue(c.field);
        var added = null;
        if (c.editing) {
          var ex = comments().filter(function (x) { return x.id === c.editing; })[0];
          if (ex) { ex.severity = c.severity; ex.text = c.text; ex.suggestion = sug; ex.anchor = c.anchor; ex.updatedAt = new Date().toISOString(); touched(); }
        } else {
          added = addComment({ severity: c.severity, anchor: c.anchor, text: c.text, suggestion: sug, relatesTo: c.relatesTo, check: c.check });
        }
        closeComposer(added);
      } }),
      h("button", { type: "button", class: "btn sm rr-c-cancel", text: "Cancel", onClick: function () { closeComposer(); } })
    ]));
    // Escape cancels an empty box; one with something written stays, as it
    // does for a click elsewhere.
    function onKey(e) {
      if (e.key !== "Escape") return;
      e.preventDefault(); e.stopPropagation();
      if (composerHasDraft()) holdDraft(); else closeComposer();
    }
    return h("div", { class: "rr-side rr-composer", onClick: function (e) { e.stopPropagation(); }, onKeydown: onKey }, kids);
  }
  // The composer drawn again in place, for a change to what it holds (Suggest
  // wording, the field a suggestion is for). The keyboard stays on the control.
  function redrawComposer() {
    var old = document.querySelector("#main .rr-composer");
    if (!old || !state.composer) { render(true); return; }
    var act = document.activeElement, sel = old.contains(act) ? ["rr-c-suggest", "rr-c-field", "rr-c-text", "rr-c-sug"].filter(function (k) { return act.classList.contains(k); })[0] : null;
    var nu = composerNode();
    rovingFor(old, nu);
    old.parentNode.replaceChild(nu, old);
    if (sel) focusOn(nu.querySelector("." + sel));
  }

  function commentNode(c) {
    function edit() {
      if (state.composer && state.composer.editing === c.id) { flashComposer(); return; }
      if (holdDraft()) return;
      var a = JSON.parse(JSON.stringify(c.anchor));
      var comp = { anchor: a, severity: c.severity, text: c.text, suggest: !!c.suggestion, suggestion: c.suggestion || "", editing: c.id, canSuggest: a.kind !== "general" };
      if (a.kind === "item") {
        var it = findItemFor(a);
        if (it) { comp.fields = itemFields(); comp.field = a.field || ""; comp.fieldValue = function (f) { return it[f] || ""; }; }
      }
      openComposer(comp);
    }
    // Delete at once, with Undo for a few seconds: the same comment object
    // goes back where it was, so its id (which the author merges on) is kept.
    // From the keyboard, Delete takes the keyboard to Undo; with the mouse it
    // goes to the place the comment was on, never nowhere.
    function del(ev) {
      var list = comments(), idx = list.indexOf(c), review = state.review, keys = byKeyboard(ev);
      review.comments = list.filter(function (x) { return x !== c; });
      if (state.composer && state.composer.editing === c.id) state.composer = null;
      touched(); redraw([c.anchor], [c.relatesTo]);
      function back() { if (!focusOn(placeEl(c.anchor))) focusOn(pageTitle()); }
      if (!keys) back();
      toast("Comment deleted.", null, { label: "Undo", focus: keys, back: back, run: function () {
        if (state.review !== review || comments().indexOf(c) !== -1) return;
        review.comments.splice(Math.min(idx, review.comments.length), 0, c);
        touched(); redraw([c.anchor], [c.relatesTo]); toast("Comment restored.");
        if (!focusOn(commentEl(c.id, ".rr-edit"))) back();
      } });
    }
    return h("div", { class: "rr-comment sev-" + c.severity, "data-comment-id": c.id, onClick: function (e) { e.stopPropagation(); } }, [
      h("div", { class: "rr-head" }, [
        h("span", { class: "rr-sev sev-" + c.severity, text: severityLabel(c.severity) }),
        h("strong", { class: "small", text: c.reviewer }),
        c.check ? h("span", { class: "rr-chip", text: "From a check" }) : null,
        c.relatesTo ? h("span", { class: "rr-chip", text: "Raised again" }) : null
      ]),
      c.text ? h("div", { class: "text", text: c.text }) : null,
      c.suggestion ? h("div", { class: "sug" }, [h("div", { class: "small muted", text: "Suggested wording" + (c.anchor.field ? " for " + fieldName(c.anchor.field) : "") }), c.suggestion]) : null,
      h("div", { class: "rr-actions" }, [
        h("button", { type: "button", class: "rr-linkbtn rr-edit", text: "Edit", onClick: edit }),
        h("button", { type: "button", class: "rr-linkbtn rr-del", text: "Delete", onClick: del })
      ])
    ]);
  }

  // ---------- earlier rounds, found in this round's report ----------
  // Block ids are positional (one paragraph added earlier moves every later
  // id), so an earlier comment is found by its words, never by its old id:
  //   same     the quoted text is still there (a cell's text in some table's
  //            cell; for a picture, the same media key or the same place)
  //   near     it was rewritten: the block of the same kind in the same section
  //            sharing the most words with the old quote, if enough (a cell:
  //            the cell, in a table of the same section)
  //   section  neither: the section's heading. `placeOnly` when the comment
  //            was on the section itself (no quote), so nothing has changed
  // null when the section has gone as well. Worked out once per pack.
  var NEAR = 0.5, NEAR_IN_PLACE = 0.3;
  var prevCache = { pack: null, at: mapOf(), byDoc: {}, norm: new WeakMap() };
  function prevMemo() {
    if (prevCache.pack !== state.pack) prevCache = { pack: state.pack, at: mapOf(), byDoc: {}, norm: new WeakMap() };
    return prevCache;
  }
  // A block's or a cell's text with its spacing evened out, worked out once:
  // every earlier comment is compared with every block.
  function normText(x) {
    var m = prevMemo().norm, v = m.get(x);
    if (v === undefined || v.of !== x.text) { v = { of: x.text, is: RC.norm(x.text) }; m.set(x, v); }
    return v.is;
  }
  function wordsOf(s) { return RC.norm(s).toLowerCase().split(/[^a-z0-9'’]+/).filter(Boolean); }
  // Word overlap of two texts: shared words over all words (Jaccard).
  function overlap(x, y) {
    var A = {}, B = {}, both = 0, all = 0;
    wordsOf(x).forEach(function (w) { A[w] = 1; });
    wordsOf(y).forEach(function (w) { B[w] = 1; });
    Object.keys(A).forEach(function (w) { all++; if (B[w]) both++; });
    Object.keys(B).forEach(function (w) { if (!A[w]) all++; });
    return all ? both / all : 0;
  }
  function cellText(t, cell) { var r = t.rows && t.rows[cell.row], c = r && r.cells[cell.col]; return c ? c.text || "" : ""; }
  // What a cell comment keeps of its row and its column, to find the cell
  // again by: the first cell of the row, the header cell of the column.
  function anchorKey(s) { return RC.norm(s).slice(0, 200); }
  function sectionHead(blocks, key) {
    return key ? blocks.filter(function (x) { return x.type === "heading" && !x.sub && x.sectionKey === key; })[0] || null : null;
  }
  // Which of this pack's documents an earlier comment is on: by its title when
  // one document has it (a risk pack sent before any zones held only the
  // high-level report, at index 0; with zones it is at 1), else by index.
  function docOf(a) {
    var docs = state.pack ? state.pack.documents : [], t = a && a.documentTitle;
    if (t) {
      var at = [];
      docs.forEach(function (x, i) { if (x.title === t) at.push(i); });
      if (at.length === 1) return at[0];
      if (at.indexOf(a.documentIndex || 0) !== -1) return a.documentIndex || 0;
    }
    return (a && a.documentIndex) || 0;
  }
  function locatePrev(a) {
    if (!a || a.kind !== "block" || !state.pack) return null;
    var doc = state.pack.documents[docOf(a)];
    if (!doc) return null;
    var blocks = doc.blocks || [], q = RC.norm(a.quote), found = [], best = null;
    // Several pictures with the same key: the one with the old id, then one
    // in the same section, then the first.
    function pick() {
      return found.filter(function (x) { return x.block.id === a.blockId; })[0] ||
        found.filter(function (x) { return x.block.sectionKey === a.sectionKey; })[0] || found[0] || null;
    }
    // Narrows the matches to those passing a test, when any do. Returns how many did.
    function keep(test) { var some = found.filter(test); if (some.length) found = some; return some.length; }
    // Several cells with the same words, as a status column has. The row and
    // column the comment kept (rowKey, colHead) say which; then the table in
    // the same section. One left, in the row it was in, is the cell. Otherwise
    // it is a guess, the one nearest the old place, and it is marked as a tie
    // ("near", with no change of wording) so the reviewer is told to check: a
    // cell whose row cannot be found, or a repeated one from an older file
    // that kept no row.
    function pickCell() {
      var rk = anchorKey(a.rowKey), ch = anchorKey(a.colHead);
      var rowFound = rk ? keep(function (x) { return anchorKey(cellText(x.block, { row: x.cell.row, col: 0 })) === rk; }) : 0;
      if (ch) keep(function (x) { return anchorKey(cellText(x.block, { row: 0, col: x.cell.col })) === ch; });
      keep(function (x) { return x.block.sectionKey === a.sectionKey; });
      if (found.length === 1 && (!rk || rowFound)) return found[0];
      keep(function (x) { return x.block.id === a.blockId; });
      var g = found.slice().sort(function (x, y) {
        return (Math.abs(x.cell.row - a.cell.row) + Math.abs(x.cell.col - a.cell.col)) - (Math.abs(y.cell.row - a.cell.row) + Math.abs(y.cell.col - a.cell.col));
      })[0];
      return { block: g.block, cell: g.cell, how: "near", now: cellText(g.block, g.cell), tie: true };
    }
    // Several blocks with the same words, as a sentence each zone's section
    // repeats. One of the same kind in the same section is the one. Several
    // there are a guess: the block at the old id, else the nearest to where
    // it was (ids count the blocks), marked as a tie.
    function pickBlock() {
      if (a.blockType) keep(function (x) { return x.block.type === a.blockType; });
      keep(function (x) { return x.block.sectionKey === a.sectionKey; });
      if (found.length === 1) return found[0];
      var was = /(\d+)$/.exec(a.blockId || ""), at = was ? Number(was[1]) : 0;
      var g = found.filter(function (x) { return x.block.id === a.blockId; })[0] ||
        found.slice().sort(function (x, y) { return Math.abs(x.at - at) - Math.abs(y.at - at); })[0];
      return { block: g.block, how: "near", now: g.block.text || "", tie: true };
    }
    // Generated paragraphs share a lot of words (a demo's summary has
    // neighbours at 0.33 and 0.49 of a deleted paragraph), so half the words
    // are needed, or a third for the block still at the old id: an edit in place.
    function nearer(block, cell, text) {
      var s = overlap(a.quote, text);
      if (s >= (block.id === a.blockId && !cell ? NEAR_IN_PLACE : NEAR) && (!best || s > best.score)) best = { block: block, cell: cell, how: "near", now: text, score: s };
    }
    if (a.blockType === "image") {
      // Never by the empty quote, which every picture would match.
      blocks.forEach(function (x) { if (x.type === "image" && a.media && x.media === a.media) found.push({ block: x, how: "same" }); });
      if (!found.length) {
        var pics = blocks.filter(function (x) { return x.type === "image" && x.sectionKey === a.sectionKey; });
        var at = pics.filter(function (x) { return x.id === a.blockId; })[0] || (pics.length === 1 ? pics[0] : null);
        if (at) found.push({ block: at, how: "same" });
      }
      if (found.length) return pick();
    } else if (a.cell) {
      // Every cell that holds the words, in any table.
      if (q) blocks.forEach(function (x) {
        if (x.type !== "table") return;
        (x.rows || []).forEach(function (row, r) {
          (row.cells || []).forEach(function (cell, c) { if (normText(cell) === q) found.push({ block: x, cell: { row: r, col: c }, how: "same" }); });
        });
      });
      if (found.length) return pickCell();
      // A cell of a word or two is too short to match by overlap.
      if (wordsOf(q).length >= 3) blocks.forEach(function (x) {
        if (x.type !== "table" || x.sectionKey !== a.sectionKey) return;
        x.rows.forEach(function (row, r) { row.cells.forEach(function (cell, c) { nearer(x, { row: r, col: c }, cell.text || ""); }); });
      });
      if (best) return best;
    } else if (q) {
      blocks.forEach(function (x, k) { if (x.type !== "image" && normText(x) === q) found.push({ block: x, how: "same", at: k }); });
      if (found.length) return pickBlock();
      // An anchor with no block type (older files) takes any block with words.
      blocks.forEach(function (x) { if (x.sectionKey === a.sectionKey && (a.blockType ? x.type === a.blockType : x.type !== "image")) nearer(x, null, x.text || ""); });
      if (best) return best;
    }
    var head = sectionHead(blocks, a.sectionKey);
    if (!head) return null;
    return { block: head, how: "section", placeOnly: !q && a.blockType !== "image" && !a.cell };
  }
  function placeOf(p) {
    var m = prevMemo(), id = p.comment.id;
    if (!(id in m.at)) m.at[id] = locatePrev(p.comment.anchor);
    return m.at[id];
  }
  // Earlier comments by the block they sit beside now, for one document.
  function prevAt(d) {
    var m = prevMemo();
    if (!m.byDoc[d]) {
      var map = mapOf();
      prevComments().forEach(function (p) {
        var a = p.comment.anchor;
        if (a.kind !== "block" || docOf(a) !== d) return;
        var loc = placeOf(p);
        if (loc) (map[loc.block.id] = map[loc.block.id] || []).push(p);
      });
      m.byDoc[d] = map;
    }
    return m.byDoc[d];
  }
  // The text has changed since the comment was made.
  function prevChanged(p, loc) {
    var a = p.comment.anchor;
    if (a.kind === "item") { var it = findItemFor(a); return !!(it && a.field && RC.norm(it[a.field]) !== RC.norm(a.quote)); }
    return !!loc && loc.how !== "same" && !loc.placeOnly && !loc.tie;
  }
  // A plain word diff: words taken out struck through, words put in marked.
  function wordDiff(before, after) {
    var x = RC.norm(before).split(" "), y = RC.norm(after).split(" "), out = [];
    if (!RC.norm(before)) x = [];
    if (x.length * y.length > 250000) return [after];
    var L = [], i, j;
    for (i = 0; i <= x.length; i++) { L.push(new Array(y.length + 1).fill(0)); }
    for (i = x.length - 1; i >= 0; i--) for (j = y.length - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    var runs = [];
    function put(op, w) { var last = runs[runs.length - 1]; if (last && last.op === op) last.w.push(w); else runs.push({ op: op, w: [w] }); }
    i = 0; j = 0;
    while (i < x.length || j < y.length) {
      if (i < x.length && j < y.length && x[i] === y[j]) { put("=", x[i]); i++; j++; }
      else if (j < y.length && (i >= x.length || L[i][j + 1] >= L[i + 1][j])) { put("+", y[j]); j++; }
      else { put("-", x[i]); i++; }
    }
    runs.forEach(function (r, k) {
      var t = r.w.join(" ");
      if (k) out.push(" ");
      out.push(r.op === "=" ? t : h(r.op === "+" ? "ins" : "del", { text: t }));
    });
    return out;
  }
  function cut(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n) + "…" : s; }

  // "Raise it again" anchors the new comment where the text is now, so it
  // sits beside the right paragraph, the author does not see it as stale, and
  // a later round matches this round's wording. `moved` says why it moved.
  function raiseAnchor(old) {
    var a = JSON.parse(JSON.stringify(old));
    delete a.selection;
    if (a.kind === "item") {
      var it = findItemFor(old);
      if (it) { a.targetName = it.targetName; a.targetId = it.targetId || ""; if (a.field) a.quote = it[a.field] || ""; }
      return { anchor: a, moved: false, item: it };
    }
    if (a.kind !== "block") return { anchor: a, moved: false };
    var di = docOf(old), loc = locatePrev(old), doc = state.pack.documents[di];
    if (!loc) { a.blockId = ""; a.quote = ""; a.cell = null; a.documentIndex = di; return { anchor: a, moved: "gone" }; }
    var b = loc.block;
    if (loc.how === "section") return { anchor: blockAnchor(doc, di, b, null, ""), moved: loc.placeOnly ? false : "section" };
    var quote = loc.cell ? cellText(b, loc.cell) : b.type === "image" ? "" : b.text;
    return { anchor: blockAnchor(doc, di, b, loc.cell || null, quote), moved: loc.tie ? "tie" : loc.how === "near" ? "near" : false,
      canSuggest: b.type !== "image" && (b.type !== "table" || !!loc.cell) };
  }
  function raiseAgain(p) {
    var c = p.comment, r = raiseAnchor(c.anchor);
    var why = { near: "The text has changed since round " + p.round + ".",
      section: "The text has changed, so this goes on its section heading.",
      tie: "Check this is the right place.",
      gone: "That text is no longer in the report." }[r.moved] || "";
    var comp = { anchor: r.anchor, severity: c.severity, text: "", relatesTo: c.id, suggest: false, suggestion: "",
      label: "Raising again: " + cut(c.text, 120) + (why ? " " + why : "") };
    if (r.anchor.kind === "item") {
      // The anchor keeps the field it was on; choosing a field below starts a
      // suggestion from what that field holds now.
      if (r.item) { comp.fields = itemFields(); comp.field = ""; comp.fieldValue = function (f) { return r.item[f] || ""; }; }
      else comp.canSuggest = false;
    } else if (r.anchor.kind === "block" && r.canSuggest) {
      comp.canSuggest = true; comp.suggestion = r.anchor.quote;
    } else comp.canSuggest = false;
    openComposer(comp);
  }
  function goToPrev(p) {
    var a = p.comment.anchor;
    if (a.kind === "block") { var loc = placeOf(p); if (loc) jumpToBlock(docOf(a), loc.block.id); return; }
    jumpToComment(p.comment);
  }

  // An earlier round's comment. Beside the report (inline) it shows whether
  // the text has changed; on the Previous round page it also says where it
  // is now, what it reads now, and has Go to.
  function prevNode(p, inline) {
    var c = p.comment, a = c.anchor, confirmed = isConfirmed(c.id), st = p.status;
    var loc = a.kind === "block" ? placeOf(p) : null, it = a.kind === "item" ? findItemFor(a) : null;
    var changed = prevChanged(p, loc), raised = comments().some(function (x) { return x.relatesTo === c.id; });
    // What there is to confirm depends on what the author did: a fix, or a
    // reason for leaving it. An open point has nothing to confirm yet.
    // A point is either confirmed or raised again, never both: the other is
    // offered again once the first is taken back (the raised comment deleted).
    var wont = st === "wontchange";
    var canConfirm = confirmed || (!raised && (st === "resolved" || wont));
    var now = null;
    if (changed && loc && loc.how === "near") now = loc.now;
    else if (changed && it) now = it[a.field] || "";
    var where = null;
    if (!inline) {
      if (a.kind === "block") where = "In: " + (a.sectionTitle || "the cover") + docSuffix(docOf(a)) + (a.cell ? ", a table cell" : "");
      else if (a.kind === "item") where = "On: " + [it ? it.targetName : a.targetName, a.code].filter(Boolean).join(", ");
    }
    var gone = a.kind === "block" ? !loc : a.kind === "item" && !it;
    return h("div", { class: "rr-comment rr-prev sev-" + c.severity, "data-prev-id": c.id, onClick: function (e) { e.stopPropagation(); } }, [
      h("div", { class: "rr-head" }, [
        h("span", { class: "rr-sev sev-" + c.severity, text: severityLabel(c.severity) }),
        h("strong", { class: "small", text: c.reviewer }),
        h("span", { class: "small muted", text: "round " + p.round }),
        h("span", { class: "rr-chip " + st, text: RC.STATUSES[st] || st }),
        changed ? h("span", { class: "rr-chip changed", text: "Text changed since round " + p.round }) : null,
        loc && loc.tie ? h("span", { class: "rr-chip changed", text: "Check the place" }) : null,
        p.confirmedBy && p.confirmedBy.length ? h("span", { class: "rr-chip met", text: "Confirmed by " + p.confirmedBy.join(", ") }) : null,
        confirmed ? h("span", { class: "rr-chip met", text: wont ? "You accepted the reason" : "You confirmed this fix" }) : null,
        raised ? h("span", { class: "rr-chip", text: "You raised this again" }) : null,
        repliesTo(c.id).length ? h("span", { class: "rr-chip", text: "You replied" }) : null
      ]),
      where ? h("div", { class: "small muted rr-prev-where", text: where }) : null,
      a.quote ? h("div", { class: "quote small" }, [changed ? h("span", { class: "rr-lbl", text: "Was: " }) : a.cell ? h("span", { class: "rr-lbl", text: "On a cell: " }) : null, cut(a.quote, 240)]) : null,
      now != null ? h("div", { class: "rr-now small" }, [h("span", { class: "rr-lbl", text: "Now reads: " })].concat(wordDiff(a.quote, now))) : null,
      changed && loc && loc.how === "section" ? h("div", { class: "small muted", text: inline ? "No close match now, so shown on its section heading." : "No close match now. Go to opens its section." }) : null,
      loc && loc.tie ? h("div", { class: "small muted rr-tie", text: (a.cell ? "These words could not be matched to one cell." : "These words are in the report more than once.") + " Check this is the right place." }) : null,
      gone && !inline ? h("div", { class: "small rr-gone", text: a.kind === "item" ? "This item is no longer in the engagement." : "This is no longer in the report." }) : null,
      h("div", { class: "text", text: c.text }),
      c.suggestion ? h("div", { class: "sug" }, [h("div", { class: "small muted", text: "Suggested wording" }), c.suggestion]) : null,
      wont && p.reason ? h("div", { class: "small", text: "Won't change: " + p.reason }) : null,
      threadNode(p),
      h("div", { class: "rr-actions" }, [
        !inline && !gone && a.kind !== "general" ? h("button", { type: "button", class: "rr-linkbtn rr-prev-go", text: "Go to", onClick: function () { goToPrev(p); } }) : null,
        canConfirm ? h("button", { type: "button", class: "rr-linkbtn rr-confirm", text: confirmed ? (wont ? "Take back" : "Take back the confirmation") : (wont ? "Accept the reason" : "Confirm it is fixed"), onClick: function () {
          if (confirmed) state.review.confirmations = state.review.confirmations.filter(function (x) { return x.commentId !== c.id; });
          else state.review.confirmations.push({ commentId: c.id, at: new Date().toISOString() });
          touched(); redraw([], [c.id]);
          focusOn(prevEl(c.id, ".rr-confirm"));
        } }) : null,
        confirmed ? null : h("button", { type: "button", class: "rr-linkbtn rr-raise", text: "Raise it again", onClick: function () { raiseAgain(p); } }),
        // An answer in the thread, which changes nothing else about the point.
        h("button", { type: "button", class: "rr-linkbtn rr-reply", text: "Reply", onClick: function () { openReply(c.id); } })
      ])
    ]);
  }

  // A colleague's comment, from a review file opened read only: no actions.
  function colleagueNode(c) {
    return h("div", { class: "rr-comment rr-prev rr-colleague sev-" + c.severity, "data-colleague-id": c.id, onClick: function (e) { e.stopPropagation(); } }, [
      h("div", { class: "rr-head" }, [
        h("span", { class: "rr-sev sev-" + c.severity, text: severityLabel(c.severity) }),
        h("strong", { class: "small", text: c.reviewer || state.colleague.reviewer }),
        h("span", { class: "rr-chip", text: "Read only" })
      ]),
      c.text ? h("div", { class: "text", text: c.text }) : null,
      c.suggestion ? h("div", { class: "sug" }, [h("div", { class: "small muted", text: "Suggested wording" + (c.anchor.field ? " for " + fieldName(c.anchor.field) : "") }), c.suggestion]) : null
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
      // A colour the Word file gave a run, such as a key's swatch (■ meets
      // target): a chart colour, so it reads on either theme.
      else if (r.c && /^[0-9A-Fa-f]{6}$/.test(r.c)) { var sw = h("span", { class: "rr-swatch", style: "color:#" + r.c }); sw.appendChild(node); node = sw; }
      el.appendChild(node);
    });
    return el;
  }
  function lightText(fill) {
    if (!fill) return false;
    var n = parseInt(fill, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 < 120;
  }
  // A picture is shown only from the pack's own data: an embedded PNG, JPEG,
  // GIF or BMP. Anything else there (a web or file address) is never loaded.
  var IMAGE_SRC = /^data:image\/(png|jpeg|gif|bmp);base64,/;
  function imageNode(b, media) {
    var src = media && Object.prototype.hasOwnProperty.call(media, b.media) ? media[b.media] : null;
    if (typeof src !== "string" || !IMAGE_SRC.test(src)) return h("p", { class: "muted small", text: "[image: " + b.media + "]" });
    // At the size Word gives it (px at 96 dpi), never wider than the page's
    // text (review.css).
    var w = Number(b.width);
    return h("img", { src: src, alt: "Chart or picture from the report", style: w > 0 ? "width:" + Math.round(w) + "px" : null });
  }
  // top: the block's own table, whose cells can be commented on (a table
  // inside a cell cannot). Those cells carry data-cell and can take the
  // keyboard; the paper's own listeners do the rest (see paperClick, paperKey).
  function tableNode(t, media, top, prevCells) {
    var tbl = h("table", { class: "rr-table" });
    var tb = h("tbody");
    t.rows.forEach(function (row, r) {
      var tr = h("tr");
      row.cells.forEach(function (cell, c) {
        var td = document.createElement("td");
        if (top) { td.setAttribute("data-cell", r + "." + c); td.setAttribute("tabindex", "-1"); }
        // Only a plain six-figure colour is put in a style ("AUTO" is none).
        if (typeof cell.fill === "string" && /^[0-9A-Fa-f]{6}$/.test(cell.fill) && cell.fill.toUpperCase() !== "FFFFFF") {
          td.style.background = "#" + cell.fill;
          if (lightText(cell.fill)) td.style.color = "#FFF";
        }
        if (cell.span) td.setAttribute("colspan", cell.span);
        if (prevCells && prevCells.length && prevCells.some(function (x) { return x.row === r && x.col === c; })) td.classList.add("prev");
        cell.blocks.forEach(function (p) {
          if (p.type === "table") td.appendChild(tableNode(p, media, false, null));
          else if (p.type === "image") td.appendChild(imageNode(p, media));
          else if (p.type === "bullet") td.appendChild(runsNode({ runs: [{ t: "• " }].concat(p.runs || []) }));
          else td.appendChild(runsNode(p));
        });
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    return h("div", { class: "rr-tablewrap" }, [tbl]);
  }

  function blockAnchor(doc, d, b, cell, quote) {
    var a = { documentIndex: d, documentTitle: doc.title || "", kind: "block", sectionKey: b.sectionKey || "", sectionTitle: b.sectionTitle || "",
      blockId: b.id, blockType: b.type, quote: quote != null ? quote : (b.text || ""), cell: cell || null, targetName: doc.targetName || "", targetId: "", itemId: "", field: "" };
    // A picture has no words to find it by next round: its media key does.
    if (b.type === "image" && b.media) a.media = b.media;
    // A cell's words are often in the table many times: its row and column
    // say which cell it is next round (both optional in the review file).
    if (cell && b.rows) { a.rowKey = anchorKey(cellText(b, { row: cell.row, col: 0 })); a.colHead = anchorKey(cellText(b, { row: 0, col: cell.col })); }
    return a;
  }

  // ---------- the Report page as drawn ----------
  // rep holds what the page shows: the paper, and for each block of the
  // document an entry { b, el, n } (the block, its element, its place). The
  // report's own text, tables and pictures are made once, when the page is
  // opened. A change to a comment then draws again only the comments beside
  // the blocks it touches (refreshBlock), so nothing the reviewer is reading
  // moves, and a picture is never made twice.
  var rep = null;
  function curDoc() { return Math.min(state.docIndex, state.pack.documents.length - 1); }
  function repLive() { return !!rep && !!state.pack && rep.pack === state.pack && state.page === "report" && rep.d === curDoc() && rep.paper.isConnected; }
  function entryOf(node) {
    var w = node && node.closest ? node.closest(".rr-block") : null;
    return (w && w.rrEntry) || null;
  }
  // The block a comment panel (or anything in one) sits under.
  function entryOfSide(node) {
    var s = node && node.closest ? node.closest(".rr-side") : null;
    // A line on the cover has its comments under the cover, after its slot.
    while (s && !(s.classList && (s.classList.contains("rr-block") || s.classList.contains("rr-cover-slot")))) s = s.previousSibling;
    return (s && s.rrEntry) || null;
  }
  function sidesOf(en) {
    var out = [], n = (en.slot || en.el).nextSibling;
    while (n && n.classList && n.classList.contains("rr-side")) { out.push(n); n = n.nextSibling; }
    return out;
  }
  // Takes the controls in a panel or a card out of the Tab order, or puts
  // them back (they can still be clicked, and focused by the page).
  function setTabbable(root, on) {
    Array.prototype.forEach.call(root.querySelectorAll("button, input, select, textarea"), function (c) {
      if (on) c.removeAttribute("tabindex"); else c.setAttribute("tabindex", "-1");
    });
  }
  function rovingFor(old, nu) { if (old.querySelector('[tabindex="-1"]')) setTabbable(nu, false); }
  // A height to lay an unseen block out at until it is first shown (see
  // .rr-block in review.css), so the scroll bar is about right from the start.
  function roughHeight(b) {
    if (b.type === "table") return (b.rows || []).length * 26 + 10;
    // The page's text is 602px wide (A4 less its margins).
    if (b.type === "image") { var w = Number(b.width), ht = Number(b.height); return (ht > 0 ? (w > 602 ? ht * 602 / w : ht) : 240) + 10; }
    if (b.type === "heading") return 44;
    return Math.ceil(String(b.text || "").length / 110) * 20 + 8;
  }
  // A block's element. It has no role of its own, so the heading, paragraph
  // or picture inside is what a screen reader meets; a table is named as one
  // rather than by all its words. Blocks take the keyboard one at a time
  // (setCurrent): the report is a single stop for Tab.
  function blockEl(doc, b, prevOn) {
    var wrap = h("div", { class: "rr-block", "data-block-id": b.id, "data-section-key": b.sectionKey || "", tabindex: "-1" });
    if (b.type === "heading") {
      wrap.appendChild(runsNode(b, "h" + Math.min(4, Math.max(1, b.level || 1))));
    } else if (b.type === "table") {
      wrap.setAttribute("role", "group");
      wrap.setAttribute("aria-label", "Table, " + RC.plural(b.rows.length, "row"));
      // Cells an earlier round commented on, where their text is now.
      var prevCells = (prevOn || []).map(function (p) { var l = placeOf(p); return l && l.cell; }).filter(Boolean);
      wrap.appendChild(tableNode(b, doc.media, true, prevCells));
    } else if (b.type === "image") {
      wrap.classList.add("rr-img");
      wrap.appendChild(imageNode(b, doc.media));
    } else if (b.type === "bullet") {
      wrap.appendChild(h("div", { class: "rr-bullet" }, [h("span", { class: "m", text: b.marker || "•" }), runsNode(b)]));
    } else {
      wrap.appendChild(runsNode(b));
    }
    wrap.style.setProperty("contain-intrinsic-block-size", "auto " + Math.round(roughHeight(b)) + "px");
    return wrap;
  }
  function composerOnBlock(id, d) {
    var c = state.composer;
    return !!c && c.anchor.kind === "block" && c.anchor.documentIndex === d && c.anchor.blockId === id;
  }
  // The comments beside a block: earlier rounds', a colleague's, your own,
  // then the comment being written.
  function sideNodes(en) {
    var d = rep.d, b = en.b, out = [];
    var prevOn = prevAt(d)[b.id] || [], theirs = colleagueOnBlock(b.id, d), mine = commentsOnBlock(b.id, d);
    if (prevOn.length) out.push(h("div", { class: "rr-side" }, prevOn.map(function (p) { return prevNode(p, true); })));
    if (theirs.length) out.push(h("div", { class: "rr-side" }, theirs.map(colleagueNode)));
    if (mine.length) out.push(h("div", { class: "rr-side" }, mine.map(commentNode)));
    if (composerOnBlock(b.id, d)) out.push(composerNode());
    return out;
  }
  // Words for a screen reader, kept once each and pointed at by the blocks
  // they describe: what Enter does, and that a block has comments (colour and
  // a border are all that show it otherwise).
  function hintId(text) {
    var id = rep.hints[text];
    if (!id) { id = rep.hints[text] = "rr-hint-" + (++rep.hintN); rep.hintBox.appendChild(h("span", { id: id, text: text })); }
    return id;
  }
  // What a block shows of its comments: the bar at its edge, the open box's
  // tint, the cell being commented on, and the words for a screen reader.
  function dressBlock(en) {
    var d = rep.d, b = en.b, el = en.el, mine = commentsOnBlock(b.id, d), open = composerOnBlock(b.id, d);
    el.classList.toggle("has-comment", mine.length > 0);
    el.classList.toggle("has-must", mine.some(function (c) { return c.severity === "must-fix"; }));
    el.classList.toggle("open", open);
    if (b.type === "table") {
      var cell = open ? state.composer.anchor.cell : null, was = el.querySelector("td.picked");
      var now = cell ? el.querySelector('td[data-cell="' + cell.row + "." + cell.col + '"]') : null;
      if (was && was !== now) was.classList.remove("picked");
      if (now) now.classList.add("picked");
    }
    var said = [], earlier = (prevAt(d)[b.id] || []).length, theirs = colleagueOnBlock(b.id, d).length;
    if (mine.length) said.push(RC.plural(mine.length, "comment"));
    if (earlier) said.push(RC.plural(earlier, "earlier comment"));
    if (theirs) said.push(RC.plural(theirs, "comment") + " from " + state.colleague.reviewer);
    el.setAttribute("aria-describedby", (said.length ? hintId("Has " + said.join(", ") + ".") + " " : "") +
      (b.type === "table" ? "rr-table-hint" : b.type === "heading" ? "rr-head-hint" : "rr-block-hint"));
  }
  // The comments beside one block, drawn again; the block itself is not touched.
  function refreshBlock(en) {
    // A line on the cover: its slot under the cover, shown only with comments.
    var el = en.slot || en.el, par = el.parentNode, next, ss;
    while ((next = el.nextSibling) && next.classList && next.classList.contains("rr-side")) par.removeChild(next);
    ss = sideNodes(en);
    ss.forEach(function (n) {
      if (rep.cur !== en) setTabbable(n, false);
      par.insertBefore(n, next);
    });
    if (en.slot) en.slot.hidden = !ss.length;
    dressBlock(en);
  }
  // The block that holds the report's place in the Tab order. Its comments'
  // buttons come with it; every other block's are skipped by Tab.
  function setCurrent(en) {
    if (!rep || !en || rep.cur === en) return;
    var old = rep.cur;
    rep.cur = en;
    if (old) { old.el.setAttribute("tabindex", "-1"); sidesOf(old).forEach(function (s) { setTabbable(s, false); }); }
    en.el.setAttribute("tabindex", "0");
    sidesOf(en).forEach(function (s) { setTabbable(s, true); });
  }
  function focusBlock(en) {
    if (!en) return;
    setCurrent(en);
    en.el.focus();
  }

  function startOnBlock(en, quote, cell, canSuggest) {
    var doc = rep.doc, d = rep.d, b = en.b, wrap = en.el, open = composerOnBlock(b.id, d);
    var cur = state.composer;
    // An edit, or a point raised again, stays on its own block; elsewhere a
    // click is refused only while there is something in it to lose.
    if (cur && (cur.editing || cur.relatesTo)) { if (open || holdDraft()) return; cur = null; }
    else if (cur && !open && holdDraft()) return;
    // Text selected with the mouse says which words the comment is about. The
    // quote stays the whole block, which is what a later round matches on.
    // Only words selected in this block count: a selection left in another
    // one (the block was opened from the keyboard) is not about this one.
    var picked = "";
    try {
      var sel = window.getSelection && window.getSelection();
      if (sel && sel.rangeCount && !sel.isCollapsed && wrap.contains(sel.anchorNode) && wrap.contains(sel.focusNode)) picked = RC.norm(String(sel));
    } catch (e) {}
    var mine = open && cur;
    if (mine && !cell && !cur.anchor.cell && !picked) {
      // A second click on the block closes an empty box, and leaves a draft.
      if (composerHasDraft()) flashComposer(); else closeComposer();
      return;
    }
    // Moving within the block (a cell, some words) keeps what is written,
    // but not a suggestion reworded from text the comment would leave.
    if (mine && cur.suggest && RC.norm(cur.suggestion) !== RC.norm(cur.anchor.quote) && RC.norm(quote) !== RC.norm(cur.anchor.quote)) { holdDraft(); return; }
    var anchor = blockAnchor(doc, d, b, cell, quote);
    if (picked && picked !== RC.norm(quote)) anchor.selection = picked;
    var keepSug = !!(mine && cur.suggest && canSuggest && RC.norm(quote) === RC.norm(cur.anchor.quote));
    openComposer({ anchor: anchor, severity: (mine && cur.severity) || "should-fix", text: (mine && cur.text) || "",
      suggest: keepSug, suggestion: keepSug ? cur.suggestion : canSuggest ? (quote || "") : "", canSuggest: canSuggest,
      label: anchor.selection ? "On: " + anchor.selection : (b.type === "table" && !cell ? "On the whole table" : (cell ? "On this cell" : "")) });
  }
  // A comment on a block, or on one cell of its table (td).
  function commentOn(en, td) {
    var b = en.b;
    if (td) {
      var at = td.getAttribute("data-cell").split("."), r = Number(at[0]), c = Number(at[1]);
      startOnBlock(en, b.rows[r].cells[c].text, { row: r, col: c }, true);
    } else if (b.type === "table") startOnBlock(en, b.text, null, false);
    else if (b.type === "image") startOnBlock(en, "", null, false);
    else startOnBlock(en, b.text, null, true);
  }
  // One click listener and one key listener for the whole paper, in place of
  // several on every block and every cell.
  function paperClick(e) {
    var en = entryOf(e.target);
    if (!en) return;   // the comments beside a block are not in it
    commentOn(en, en.b.type === "table" && e.target.closest ? e.target.closest("td[data-cell]") : null);
  }
  // The keyboard in the report. On a block: Up and Down move to the next,
  // Page Up and Page Down to the next section, Home and End to the ends;
  // Enter or Space comments on it. A table takes Enter into its cells (Space
  // comments on the whole table), where the arrow keys move between cells,
  // Enter comments on the cell and Escape goes back out to the table.
  function paperKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target, en = entryOf(t), k = e.key;
    if (!en) return;
    function done() { e.preventDefault(); e.stopPropagation(); }
    if (t === en.el) {
      var list = rep.list, to = null;
      if (k === "ArrowDown") to = list[en.n + 1];
      else if (k === "ArrowUp") to = list[en.n - 1];
      else if (k === "Home") to = list[0];
      else if (k === "End") to = list[list.length - 1];
      else if (k === "PageDown" || k === "PageUp") {
        var step = k === "PageDown" ? 1 : -1;
        for (var i = en.n + step; i >= 0 && i < list.length && !to; i += step) if (list[i].b.type === "heading" && !list[i].b.sub) to = list[i];
        if (!to) to = list[step > 0 ? list.length - 1 : 0];
      } else if (k === "Enter" && en.b.type === "table") {
        var first = (en.cell && en.cell.isConnected ? en.cell : null) || en.el.querySelector("td[data-cell]");
        if (first) { done(); focusCell(en, first); return; }
      }
      if (to) { done(); focusBlock(to); return; }
      if (k === "Enter" || k === " ") { done(); commentOn(en, null); }
      return;
    }
    var td = t.nodeName === "TD" && t.hasAttribute("data-cell") ? t : null;
    if (!td) return;
    var at = td.getAttribute("data-cell").split("."), r = Number(at[0]), c = Number(at[1]), rows = en.b.rows, next = null;
    function cellAt(rr, cc) {
      if (rr < 0 || rr >= rows.length) return null;
      cc = Math.max(0, Math.min(cc, rows[rr].cells.length - 1));
      return en.el.querySelector('td[data-cell="' + rr + "." + cc + '"]');
    }
    if (k === "ArrowRight") next = c + 1 < rows[r].cells.length ? cellAt(r, c + 1) : null;
    else if (k === "ArrowLeft") next = c > 0 ? cellAt(r, c - 1) : null;
    else if (k === "ArrowDown") next = cellAt(r + 1, c);
    else if (k === "ArrowUp") next = cellAt(r - 1, c);
    else if (k === "Home") next = cellAt(r, 0);
    else if (k === "End") next = cellAt(r, rows[r].cells.length - 1);
    else if (k === "Escape") { done(); focusBlock(en); return; }
    else if (k === "Enter" || k === " ") { done(); commentOn(en, td); return; }
    else return;
    done();
    if (next) focusCell(en, next);
  }
  function focusCell(en, td) {
    setCurrent(en);
    en.cell = td;
    td.setAttribute("aria-describedby", "rr-cell-hint");
    td.focus();
  }
  // Wherever the keyboard or the mouse lands in the report, that block is the
  // one Tab comes back to.
  function paperFocus(e) {
    var en = entryOf(e.target) || entryOfSide(e.target);
    if (en) setCurrent(en);
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
    var counts = mapOf(), cur = "";
    (doc.blocks || []).forEach(function (b) {
      if (b.type === "heading" && !b.sub) cur = b.id;
      var n = commentsOnBlock(b.id, d).length;
      if (n) counts[cur] = (counts[cur] || 0) + n;
    });
    return counts;
  }

  // What the Document list and the Go to section list say for one entry.
  function docOptionText(x, i) {
    var n = comments().filter(function (c) { return c.anchor.kind === "block" && (c.anchor.documentIndex || 0) === i; }).length;
    return x.title + (x.targetName && x.title !== x.targetName ? " (" + x.targetName + ")" : "") + (n ? " (" + RC.plural(n, "comment") + ")" : "");
  }
  function jumpOptionText(s, counts, d) {
    return (s.level > 1 ? "  " : "") + s.title + (counts[s.id] ? " (" + counts[s.id] + ")" : "") + (isRead(d, s.id) ? " ✓" : "");
  }

  function renderReport(main) {
    var pack = state.pack, d = curDoc(), doc = pack.documents[d];
    var tb = [], e = pack.engagement || {}, multi = pack.documents.length > 1;
    if (multi) {
      // A draft stays put when the document changes: it shows again on its own.
      tb.push(h("label", null, ["Document ", h("select", { id: "rr-doc", onChange: function (ev) { state.docIndex = Number(ev.target.value); if (!composerHasDraft()) state.composer = null; render(false); } },
        pack.documents.map(function (x, i) {
          var o = h("option", { value: String(i), text: docOptionText(x, i) });
          if (i === d) o.selected = true; return o;
        }))]));
    }
    // Go to a section: the outline's job where the sidebar has no room for it.
    var secs = sectionsOf(doc), counts = countsBySection(doc, d);
    if (secs.length) {
      tb.push(h("select", { class: "rr-jump", id: "rr-jump", "aria-label": "Go to section", onChange: function (ev) {
        // It stays on the section chosen, and then follows the one in view.
        var id = ev.target.value;
        if (id) scrollToSection(id);
      } }, [h("option", { value: "", text: "Go to section" })].concat(secs.map(function (s) {
        return h("option", { value: s.id, text: jumpOptionText(s, counts, d) });
      }))));
      // Nor are the outline's ticks: this one marks the section at the top of
      // the report read (syncReadTick keeps it in step as you scroll).
      var tick = h("input", { type: "checkbox", id: "rr-mark-read" });
      tick.addEventListener("change", function () {
        var s = sectionInView();
        if (!s) return;
        setRead(d, s.id, tick.checked);
        syncCounts();
      });
      tb.push(h("label", { class: "rr-markread", id: "rr-markread" }, [tick, "Read"]));
    }
    tb.push(findBox());
    tb.push(h("button", { type: "button", class: "btn sm", id: "rr-keys", text: "Keyboard", title: "Keyboard shortcuts", onClick: showKeys }));
    tb.push(h("span", { class: "muted", text: "Click anything in the report to comment. Select some words first to comment on just those." }));
    main.appendChild(h("h1", { class: "page-title", text: (e.instrumentTitle || "Report") }));
    // Who and which round stay in view at any width (the header hides them
    // on a narrow window); with two reports, which one this is.
    var who = [e.client, e.site].filter(Boolean).join(", "), me = state.review && state.review.reviewer;
    main.appendChild(h("p", { class: "page-sub", text: (who ? who + ". " : "") + "As the client will read it: " +
      (multi ? "the " + (doc.title || "report") + ", round " + pack.round + "." : "the generated Word report, round " + pack.round + ".") +
      (me ? " You are reviewing as " + me + "." : "") }));
    var rq = requestPanel();
    if (rq) main.appendChild(rq);
    main.appendChild(h("div", { class: "rr-toolbar" }, tb));
    main.appendChild(h("p", { class: "rr-pages-note", id: "rr-pages-note", text: "Page breaks in Word may differ." }));
    main.appendChild(h("span", { class: "rr-sr", id: "rr-block-hint", text: "Press Enter to comment on it." }));
    var hintBox = h("div", { class: "rr-sr", id: "rr-hints" }, [
      h("span", { id: "rr-head-hint", text: "Heading. Press Enter to comment on it." }),
      h("span", { id: "rr-table-hint", text: "Press Enter to go into its cells, or Space to comment on the whole table." }),
      h("span", { id: "rr-cell-hint", text: "Press Enter to comment on this cell. Escape goes back to the table." })
    ]);
    main.appendChild(hintBox);
    var paper = h("div", { class: "rr-paper", id: "rr-paper" });
    // Drawn again for the same document (a change of name, a file opened), the
    // report keeps its place in the Tab order.
    var keep = rep && rep.pack === pack && rep.d === d && rep.cur ? rep.cur.n : 0;
    rep = { pack: pack, d: d, doc: doc, paper: paper, at: mapOf(), list: [], cur: null, secs: secs, hints: mapOf(), hintN: 0, hintBox: hintBox };
    // The report as Word prints it: the house cover, drawn from the pack, then
    // the pages. Each line on the cover that the Word file holds (its front
    // matter) is that block's own element, so it takes a comment, the
    // keyboard and a check's Go to as any block does. Its comments cannot sit
    // beside it on the picture: they go under the cover, in cover order, each
    // after a slot naming the line ("On the cover: title"), which stands in
    // for the block in sidesOf and refreshBlock. Front matter the cover does
    // not draw goes under it too, as Other cover text. Each top-level heading
    // starts a sheet; Word decides where its pages break. A body block and
    // its comments always share a sheet.
    var cv = coverSheet(doc, e), onCover = mapOf();
    cv.items.forEach(function (x) { onCover[x.b.id] = x; });
    paper.appendChild(cv.page);
    var notes = null, other = null, sheet = null, filled = false, prevMap = prevAt(d);
    (doc.blocks || []).forEach(function (b, n) {
      var cx = b.front ? onCover[b.id] : null;
      var en = { b: b, el: cx ? cx.el : blockEl(doc, b, prevMap[b.id]), n: n, cell: null };
      en.el.rrEntry = en;
      rep.list.push(en);
      if (!rep.at[b.id]) rep.at[b.id] = en;
      var into;
      if (b.front && !notes) {
        notes = h("div", { class: "rr-cover-notes", "data-part": "cover-notes" });
        paper.appendChild(notes);
      }
      if (cx) {
        en.slot = h("div", { class: "rr-cover-slot", text: "On the cover: " + cx.label });
        en.slot.rrEntry = en;
        notes.appendChild(en.slot);
        var ss = sideNodes(en);
        en.slot.hidden = !ss.length;
        ss.forEach(function (s) { setTabbable(s, false); notes.appendChild(s); });
        dressBlock(en);
        return;
      }
      if (b.front) {
        if (!other) {
          other = h("div", { class: "rr-cover-other", "data-part": "front" }, [h("p", { class: "rr-sheet-note", text: "Other cover text" })]);
          notes.appendChild(other);
        }
        into = other;
      } else {
        if (!sheet || (filled && b.type === "heading" && (b.level || 1) === 1)) {
          sheet = h("div", { class: "rr-sheet", "data-part": "page" });
          paper.appendChild(sheet);
          filled = false;
        }
        filled = true;
        into = sheet;
      }
      into.appendChild(en.el);
      sideNodes(en).forEach(function (s) { setTabbable(s, false); into.appendChild(s); });
      dressBlock(en);
    });
    setCurrent(rep.list[keep] || rep.list[0]);
    paper.addEventListener("click", paperClick);
    paper.addEventListener("keydown", paperKey);
    paper.addEventListener("focusin", paperFocus);
    main.appendChild(paper);
    applyFind(paper, false);
  }

  // ---------- the cover ----------
  // The house cover (the Design B cover the assessment and risk tools print),
  // drawn from the pack: the engagement's client, site, author and document
  // control, and the document's title. Where the Word file's own cover words
  // are in the pack (its front matter) they are taken as printed: the
  // document type above the title, the title's lines, the line under the
  // site, the issue strip, the logo and the address. Each of those is drawn
  // as its block (coverSheet's items), so it can be commented on; the rest is
  // drawn from the engagement. The picture behind is decorative. The
  // capitals on it are the Word cover's own.
  var COVER_TYPE = /^[A-Z][A-Z0-9 &\/.,'()-]*$/;
  function splitTitle(t) {
    t = RC.norm(t);
    if (t.length <= 26) return [t];
    var mid = t.length / 2, best = -1;
    for (var i = 0; i < t.length; i++) if (t[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    return best < 0 ? [t] : [t.slice(0, best), t.slice(best + 1)];
  }
  var ADDRESS = /^(SolutionsPT Ltd|Telephone)\b/;
  // Each part of the cover, as { t: text, b: the front-matter block it is,
  // or null when it comes from the engagement }.
  function coverInfo(doc, e) {
    var dc = e.documentControl || {};
    var front = (doc.blocks || []).filter(function (b) { return b.front; });
    var lines = front.filter(function (b) { return b.type === "paragraph" && RC.norm(b.text); })
      .map(function (b) { return { t: RC.norm(b.text), b: b }; });
    var strip = -1, kind = -1;
    lines.forEach(function (x, i) { if (strip < 0 && /^ISSUE\s/.test(x.t)) strip = i; });
    var head = strip < 0 ? lines.filter(function (x) { return !ADDRESS.test(x.t); }) : lines.slice(0, strip);
    var addr = (strip < 0 ? lines : lines.slice(strip + 1)).filter(function (x) { return ADDRESS.test(x.t); });
    head.forEach(function (x, i) { if (kind < 0 && COVER_TYPE.test(x.t) && /[A-Z]{3}/.test(x.t)) kind = i; });
    var client = RC.norm(e.client), site = RC.norm(e.site), at = -1;
    if (client) head.forEach(function (x, i) { if (at < 0 && i > kind && x.t === client) at = i; });
    var title = kind >= 0 && at > kind + 1 ? head.slice(kind + 1, at)
      : splitTitle(doc.title || e.instrumentTitle || "Report").map(function (t) { return { t: t, b: null }; });
    var after = at >= 0 ? head.slice(at + 1) : [];
    var siteLine = site ? { t: site, b: null } : null;
    if (after.length && (after[0].t === site || (!site && after.length > 1))) siteLine = after.shift();
    var m = strip >= 0 ? /^ISSUE\s+(.*?)\s+(?:AUTHOR\s+(.*?)\s+)?CLASSIFICATION\s+(.*)$/.exec(lines[strip].t) : null;
    var longest = title.reduce(function (x, l) { return Math.max(x, l.t.length); }, 0);
    return {
      logo: front.filter(function (b) { return b.type === "image"; })[0] || null,
      // Without the Word cover's own words: the risk tool's requirements
      // specification says OT CYBER SECURITY, its reports OT CYBER RISK ASSESSMENT.
      type: kind >= 0 ? head[kind] : { t: e.scoringFamily === "risk-assessment" ? (/requirements specification/i.test(String(doc.title || "")) ? "OT CYBER SECURITY" : "OT CYBER RISK ASSESSMENT") : "OT CYBER SECURITY ASSESSMENT", b: null },
      title: title, titlePx: longest <= 30 ? 35 : longest <= 38 ? 29 : 24,
      client: at >= 0 ? head[at] : (client ? { t: client, b: null } : null), site: siteLine, sub: after[0] || null,
      // The strip as the Word file printed it, where it has one.
      strip: strip >= 0 ? lines[strip].b : null, stripText: strip >= 0 ? lines[strip].t : "",
      issue: m ? m[1] : RC.norm(dc.documentRevision || "0.1") + (RC.norm(dc.issuedDate) ? "  ·  " + RC.norm(dc.issuedDate) : ""),
      author: m ? m[2] || "" : RC.norm(e.consultant),
      classification: m ? m[3] : RC.norm(dc.confidentiality) || "Confidential",
      parsed: !!m || strip < 0,
      addr: addr
    };
  }
  function assetSrc(x) { return x && typeof x.base64 === "string" ? "data:" + (x.mime || "image/png") + ";base64," + x.base64 : ""; }
  // The cover sheet, and the lines on it that are blocks: { page, items:
  // [{ b, el, label }] }, which renderReport makes entries of.
  function coverSheet(doc, e) {
    var c = coverInfo(doc, e), as = A.Assets || {}, items = [];
    function part(cls, x, label, kids) {
      var el = h("div", { class: cls, text: kids ? null : x && x.t }, kids || null);
      if (x && x.b) {
        el.classList.add("rr-block", "rr-cv-line");
        el.setAttribute("data-block-id", x.b.id);
        el.setAttribute("data-section-key", x.b.sectionKey || "");
        el.setAttribute("tabindex", "-1");
        items.push({ b: x.b, el: el, label: label });
      }
      return el;
    }
    var page = h("div", { class: "rr-sheet rr-cover-page", "data-part": "cover" });
    var bg = assetSrc(as.coverBg);
    if (bg) page.appendChild(h("img", { class: "rr-cv-bg", src: bg, alt: "" }));
    var top = h("div", { class: "rr-cv-top" });
    var logo = assetSrc(as.logoCard);
    if (logo) top.appendChild(part("rr-cv-logowrap", c.logo ? { b: c.logo } : null, "logo", [h("img", { class: "rr-cv-logo", src: logo, alt: c.logo ? "The logo on the cover" : "" })]));
    top.appendChild(part("rr-cv-type", c.type, "document type"));
    top.appendChild(h("div", { class: "rr-cv-bar" }));
    var title = h("div", { class: "rr-cv-title", style: "font-size:calc(" + c.titlePx + " * var(--u))" });
    c.title.forEach(function (l, i) { title.appendChild(part("rr-cv-tline", l, c.title.length > 1 ? "title, line " + (i + 1) : "title")); });
    top.appendChild(title);
    if (c.client) top.appendChild(part("rr-cv-client", c.client, "client"));
    if (c.site) top.appendChild(part("rr-cv-site", c.site, "site"));
    if (c.sub) top.appendChild(part("rr-cv-sub", c.sub, "line under the site"));
    function pair(k, v) { return h("span", { class: "rr-cv-pair" }, [h("span", { class: "rr-cv-k", text: k }), h("span", { class: "rr-cv-v", text: v })]); }
    var strip = [pair("ISSUE", c.issue)];
    if (c.author) strip.push(pair("AUTHOR", c.author));
    strip.push(pair("CLASSIFICATION", c.classification));
    // A strip that does not read as one is shown as the Word file has it.
    var stripEl = c.parsed ? part("rr-cv-strip", c.strip ? { b: c.strip } : null, "issue, author and classification", strip)
      : part("rr-cv-strip", { t: c.stripText, b: c.strip }, "issue, author and classification");
    var addr = c.addr.length ? c.addr.map(function (x, i) { return part("rr-cv-addr", x, "address, line " + (i + 1)); })
      : [h("div", { class: "rr-cv-addr", text: "SolutionsPT Ltd   ·   Unit 1, Oakfield Road, Cheadle Royal Business Park, Cheadle, Cheshire SK8 3GX" }),
        h("div", { class: "rr-cv-addr", text: "Telephone +44 (0) 161 495 4600   ·   sales@solutionspt.com   ·   www.solutionspt.com" })];
    page.appendChild(h("div", { class: "rr-cv-in" }, [top, h("div", { class: "rr-cv-foot" }, [stripEl].concat(addr))]));
    return { page: page, items: items };
  }

  // A section's heading brought to the top of the report, below the toolbar
  // that stays in view (scrollIntoView alone puts it underneath).
  function toolbarBottom() {
    var tb = document.querySelector("#main .rr-toolbar"), main = $("main");
    return tb ? tb.getBoundingClientRect().bottom : main.getBoundingClientRect().top;
  }
  // A block's element on the Report page, by its id.
  function blockElById(id) {
    if (repLive()) return rep.at[id] ? rep.at[id].el : null;
    return document.querySelector('#rr-paper [data-block-id="' + cssEsc(id) + '"]');
  }
  // Blocks not yet scrolled to are laid out at a rough height (.rr-block in
  // review.css), so the first scroll to a far one can land a little off: go
  // again once the ones around it have their real heights. still() says
  // whether it is still wanted.
  function bringIntoView(el, where, still) {
    var main = $("main");
    function go() {
      if (!el.isConnected || !el.scrollIntoView || (still && !still())) return false;
      // Something taller than the window (a long table) is shown from its top.
      var tall = where === "center" && el.offsetHeight > main.clientHeight - 140;
      el.scrollIntoView({ block: tall ? "start" : where });
      var gap = tall ? el.getBoundingClientRect().top - toolbarBottom() - 8 : 0;
      if (gap < 0) main.scrollTop += gap;
      return true;
    }
    if (go()) setTimeout(go, 80);
  }
  function scrollToSection(id) {
    var el = blockElById(id), main = $("main");
    if (!el || !el.scrollIntoView) return;
    function place() {
      if (!el.isConnected) return;
      el.scrollIntoView({ block: "start" });
      var gap = el.getBoundingClientRect().top - toolbarBottom() - 8;
      if (gap < 0) main.scrollTop += gap;
      syncSection();
    }
    place();
    setTimeout(place, 80);
    // Tab into the report now starts at this section.
    if (repLive() && rep.at[id]) setCurrent(rep.at[id]);
  }
  // The section whose heading was passed last, reading down: the one in view.
  function sectionInView() {
    if (!state.pack || state.page !== "report") return null;
    var secs = repLive() ? rep.secs : sectionsOf(state.pack.documents[curDoc()]);
    var line = toolbarBottom() + 40, cur = null;
    // In reading order, so the first heading below the line ends the search.
    for (var i = 0; i < secs.length; i++) {
      var el = blockElById(secs[i].id);
      if (!el) continue;
      if (cur && el.getBoundingClientRect().top > line) break;
      cur = secs[i];
    }
    return cur;
  }
  // The section in view, wherever the page names one: the outline's row
  // (aria-current and a bar, and kept in view within the outline), the narrow
  // window's Go to section list, and its Read tick. It runs as the report
  // scrolls, so it draws nothing again: it touches those three, and the
  // outline only when the section changes.
  function syncSection() {
    if (!state.pack || state.page !== "report") return;
    var s = sectionInView(), id = s ? s.id : "";
    var cur = document.querySelector(".rr-outline-item[aria-current]");
    if ((cur ? cur.getAttribute("data-section-block") : "") !== id) {
      if (cur) { cur.removeAttribute("aria-current"); cur.parentNode.classList.remove("cur"); }
      var next = id ? document.querySelector('.rr-outline-item[data-section-block="' + cssEsc(id) + '"]') : null;
      if (next) {
        next.setAttribute("aria-current", "location");
        next.parentNode.classList.add("cur");
        if (next.offsetParent && next.scrollIntoView) next.scrollIntoView({ block: "nearest" });
      }
      // Tab into the outline starts at the section in view, unless the
      // keyboard is already in it.
      var sb = $("sidebar");
      if (!sb.contains(document.activeElement)) outlineRow(next ? next.parentNode : sb.querySelector(".rr-outline-row"));
    }
    // Not while the list is in use: it would change under the reviewer.
    var jump = $("rr-jump");
    if (jump && jump.value !== id && document.activeElement !== jump) jump.value = id;
    syncReadTick(s);
  }
  function syncReadTick(s) {
    var tick = $("rr-mark-read");
    if (!tick || !tick.offsetParent) return;
    var d = curDoc();
    tick.checked = !!(s && isRead(d, s.id));
    var label = s ? "Mark " + s.title + " as read" : "Mark this section as read";
    tick.setAttribute("aria-label", label);
    $("rr-markread").title = label;
  }

  // ---------- find in the report ----------
  // The page's own find (Ctrl+F lands here on the Report page), since the exe
  // has no find bar. Marks every match in the report text; Next and Previous
  // move between them. Kept across redraws in state.reportFind.
  var findTimer = null;
  function findBox() {
    var f = state.reportFind || (state.reportFind = { q: "", i: 0 });
    var input = h("input", { type: "search", id: "rr-report-find", placeholder: "Find in the report", "aria-label": "Find in the report", value: f.q });
    input.addEventListener("input", function () {
      clearTimeout(findTimer);
      findTimer = setTimeout(function () { f.q = input.value; f.i = 0; applyFind($("rr-paper"), true); }, 200);
    });
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter") { ev.preventDefault(); clearTimeout(findTimer); if (f.q !== input.value) { f.q = input.value; f.i = 0; applyFind($("rr-paper"), true); } else stepFind(ev.shiftKey ? -1 : 1); }
      else if (ev.key === "Escape") { input.value = ""; f.q = ""; f.i = 0; applyFind($("rr-paper"), false); }
    });
    return h("span", { class: "rr-findbox" }, [input,
      h("button", { type: "button", class: "btn sm", id: "rr-find-prev", text: "Previous", title: "Shift+Enter", onClick: function () { stepFind(-1); } }),
      h("button", { type: "button", class: "btn sm", id: "rr-find-next", text: "Next", title: "Enter", onClick: function () { stepFind(1); } }),
      h("span", { class: "small muted", id: "rr-find-count", "aria-live": "polite" })]);
  }
  // The marks in the report, in order. Kept from the last search (the report's
  // own text is not drawn again between searches), so Next and Previous do
  // not look for them each time.
  var findCache = { paper: null, marks: [] };
  function findMarks() {
    var p = $("rr-paper");
    if (!p) return [];
    if (findCache.paper !== p) findCache = { paper: p, marks: Array.prototype.slice.call(p.querySelectorAll("mark.rr-find")) };
    return findCache.marks;
  }
  function applyFind(paper, scroll) {
    if (!paper) return;
    findMarks().forEach(function (m) { var par = m.parentNode; if (!par) return; par.replaceChild(document.createTextNode(m.textContent), m); par.normalize(); });
    findCache = { paper: paper, marks: [] };
    var f = state.reportFind || { q: "", i: 0 }, q = RC.norm(f.q).toLowerCase(), count = $("rr-find-count");
    if (q.length < 2) { if (count) count.textContent = ""; return; }
    var walker = document.createTreeWalker(paper, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = walker.nextNode())) {
      // Report text only: not the comments, the composer or the buttons.
      // Nor the labels the page adds: the cover strip's, a cover line's slot.
      if (n.parentNode.closest && n.parentNode.closest(".rr-side, .rr-composer, button, textarea, input, select, .rr-cv-k, .rr-cover-slot, .rr-sheet-note")) continue;
      if (n.nodeValue.toLowerCase().indexOf(q) !== -1) nodes.push(n);
    }
    nodes.forEach(function (t) {
      var s = t.nodeValue, low = s.toLowerCase(), at = 0, i, frag = document.createDocumentFragment();
      while ((i = low.indexOf(q, at)) !== -1) {
        if (i > at) frag.appendChild(document.createTextNode(s.slice(at, i)));
        frag.appendChild(h("mark", { class: "rr-find", text: s.slice(i, i + q.length) }));
        at = i + q.length;
      }
      if (at < s.length) frag.appendChild(document.createTextNode(s.slice(at)));
      t.parentNode.replaceChild(frag, t);
    });
    var marks = Array.prototype.slice.call(paper.querySelectorAll("mark.rr-find"));
    findCache = { paper: paper, marks: marks };
    if (!marks.length) { if (count) count.textContent = "Not found"; return; }
    f.i = ((f.i % marks.length) + marks.length) % marks.length;
    marks[f.i].classList.add("cur");
    if (count) count.textContent = (f.i + 1) + " of " + marks.length;
    if (scroll) showMark(marks[f.i]);
  }
  function showMark(m) { bringIntoView(m, "center", function () { return m.classList.contains("cur"); }); }
  function stepFind(by) {
    var f = state.reportFind, marks = findMarks();
    if (!f || !marks.length) return;
    marks[f.i] && marks[f.i].classList.remove("cur");
    f.i = (f.i + by + marks.length) % marks.length;
    marks[f.i].classList.add("cur");
    var count = $("rr-find-count");
    if (count) count.textContent = (f.i + 1) + " of " + marks.length;
    showMark(marks[f.i]);
  }

  // The author's note sent with the pack (pack.request): a quiet panel on
  // Report and Summary. It is the author's own words, so shown as they are.
  function requestPanel() {
    var rq = state.pack && state.pack.request;
    if (!rq || typeof rq !== "object") return null;
    var note = String(rq.note || "").trim(), due = RC.norm(rq.neededBy);
    if (!note && !due) return null;
    return h("div", { class: "rr-request", id: "rr-request" }, [
      h("div", { class: "small muted", text: "From the author" + (due ? ". Needed by " + due + "." : ":") }),
      note ? h("div", { class: "rr-request-note", text: note }) : null
    ]);
  }

  // ---------- the engagement ----------
  // What an item's fields are called. A pack can name them its own way
  // (engagement.fieldLabels): a label, or null when it has no such field, so
  // the row, the suggestion and the filter for it are left out. A field it
  // does not mention keeps the assessment name.
  var FIELD_DEFAULTS = { answer: "Answer", expected: "Target", evidence: "Evidence", notes: "Notes", action: "Action", impact: "Impact", priority: "Priority", owner: "Owner" };
  // The same fields as the suggestion picker names them, for an assessment.
  var FIELD_PICK = { evidence: "evidence", notes: "notes", action: "recommended action", impact: "business impact", owner: "owner" };
  function fieldLabel(f) {
    var L = state.pack && (state.pack.engagement || {}).fieldLabels;
    if (L && typeof L === "object" && f in L) return L[f] == null || L[f] === "" ? null : String(L[f]);
    return FIELD_DEFAULTS[f] || f;
  }
  function hasOwnLabel(f) {
    var L = state.pack && (state.pack.engagement || {}).fieldLabels;
    return !!(L && typeof L === "object" && f in L && L[f]);
  }
  // A label inside a sentence: "Threat source" reads "threat source"; an
  // initialism such as "SL-T" keeps its capitals.
  function lowerLabel(s) { s = String(s || ""); return /^[A-Z][A-Z0-9]/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1); }
  // The name to use for a field in a sentence, on comments and the picker.
  function fieldName(f) {
    if (hasOwnLabel(f)) return lowerLabel(fieldLabel(f));
    return FIELD_PICK[f] || f;
  }
  // Fields a suggestion can be for: [[field, name]], without those the pack
  // does not have.
  function itemFields() {
    return ["evidence", "notes", "action", "impact", "owner"].filter(function (f) { return fieldLabel(f) !== null; })
      .map(function (f) { return [f, fieldName(f)]; });
  }
  // An item comment names its target by id when the pack gave one, otherwise
  // by name: an id survives the site or zone being renamed between rounds,
  // and keeps two targets of the same name apart.
  function onTarget(a, i) { return a.targetId && i.targetId ? a.targetId === i.targetId : a.targetName === i.targetName; }
  function onItem(a, i) { return !!a && a.itemId === i.itemId && onTarget(a, i); }
  // The pack's items by id, and the earlier comments on each: looked up, not
  // searched for, as a pack can hold hundreds of both. Made once per pack.
  var itemCache = { pack: null, n: -1, byId: mapOf(), prev: mapOf() };
  function itemMemo() {
    var items = (state.pack && state.pack.items) || [], np = state.pack ? prevComments().length : 0;
    if (itemCache.pack !== state.pack || itemCache.n !== items.length || itemCache.np !== np) {
      var m = { pack: state.pack, n: items.length, np: np, byId: mapOf(), prev: mapOf() };
      items.forEach(function (i) { var k = String(i.itemId); (m.byId[k] = m.byId[k] || []).push(i); });
      if (state.pack) prevComments().forEach(function (p) {
        var a = p.comment.anchor;
        if (a.kind === "item") { var k = String(a.itemId); (m.prev[k] = m.prev[k] || []).push(p); }
      });
      itemCache = m;
    }
    return itemCache;
  }
  function findItemFor(a) { return (itemMemo().byId[String(a.itemId)] || []).filter(function (i) { return onItem(a, i); })[0] || null; }
  // An item's extra rows, [[label, value]]. Anything else there is no rows.
  function detailsOf(i) { return Array.isArray(i.details) ? i.details : []; }
  var searchTimer = null;
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
    if (f === "noevidence" && (fieldLabel("evidence") === null || i.status === "na" || RC.norm(i.evidence))) return false;
    if (f === "open" && i.status !== "unanswered" && i.status !== "to-assess") return false;
    if (f === "commented" && !commentsOnItem(i).length) return false;
    if (state.itemSearch) {
      var q = RC.norm(state.itemSearch).toLowerCase();
      var words = [i.code, i.title, i.answer, i.evidence, i.notes, i.action, i.impact, i.owner, i.priority, i.targetName];
      detailsOf(i).forEach(function (row) { if (Array.isArray(row)) words.push(row[1]); });
      if (q && words.join(" ").toLowerCase().indexOf(q) === -1) return false;
    }
    return true;
  }
  function itemCommentAnchor(i) {
    var dIndex = 0;
    (state.pack.documents || []).forEach(function (doc, k) { if (doc.targetName && doc.targetName === i.targetName) dIndex = k; });
    return { documentIndex: dIndex, documentTitle: (state.pack.documents[dIndex] || {}).title || "", kind: "item", sectionKey: "", sectionTitle: "", blockId: "",
      quote: "", cell: null, targetName: i.targetName, targetId: i.targetId || "", itemId: i.itemId, field: "", code: i.code, itemTitle: i.title, groupName: i.groupName };
  }
  function itemNode(i) {
    var mine = commentsOnItem(i);
    var open = state.composer && state.composer.anchor.kind === "item" && onItem(state.composer.anchor, i);
    function row(label, v) { return [h("dt", { text: label }), h("dd", { class: v ? null : "blank", text: v || "Not recorded" })]; }
    // Each field under the pack's own name; one it does not have is left out.
    var kv = [];
    function field(f, always) {
      var label = fieldLabel(f);
      if (label !== null && (always || i[f])) kv = kv.concat(row(label, i[f]));
    }
    field("answer", true);
    field("expected");
    // A blank evidence row is worth showing on a finding, or on an item with
    // nothing else to go on; a risk pack's SL-T item keeps its justification
    // in its detail rows, and "Threat source: Not recorded" would mislead.
    field("evidence", i.status === "finding" || !detailsOf(i).length);
    field("notes");
    if (i.status === "finding" || i.action || i.owner || i.impact) { field("action", true); field("owner", true); field("impact", true); }
    field("priority");
    detailsOf(i).forEach(function (d) {
      if (Array.isArray(d) && d[0]) kv = kv.concat(row(String(d[0]), d[1] == null ? "" : String(d[1])));
    });
    var card = h("div", { class: "rr-item", "data-item-id": i.itemId, "data-target": i.targetName, "data-target-id": i.targetId || null }, [
      h("div", { class: "rr-item-h" }, [
        h("span", { class: "code", text: i.code }),
        h("span", { class: "ttl", text: i.title }),
        i.shared ? h("span", { class: "rr-chip", text: "Shared answer" }) : null,
        h("span", { class: "rr-chip " + i.status, text: STATUS_LABELS[i.status] || i.status }),
        h("button", { type: "button", class: "btn sm rr-item-comment", text: "Comment", "aria-label": "Comment on " + [i.code, i.title].filter(Boolean).join(" "), onClick: function () {
          if (open && !state.composer.editing && !state.composer.relatesTo) { flashComposer(); return; }
          openComposer({ anchor: itemCommentAnchor(i), severity: "should-fix", text: "", fields: itemFields(), field: "", fieldValue: function (f) { return i[f] || ""; }, suggestion: "" });
        } })
      ]),
      h("dl", { class: "rr-kv" }, kv),
      mine.length ? h("div", { class: "rr-side" }, mine.map(commentNode)) : null,
      prevOnItem(i),
      colleagueOnItem(i).length ? h("div", { class: "rr-side" }, colleagueOnItem(i).map(colleagueNode)) : null,
      open ? composerNode() : null
    ]);
    card.rrItem = i;
    return card;
  }
  // ---------- the Engagement page as drawn ----------
  // eng holds the item cards on the page, by item. A change to a comment
  // draws again only the card it is on (refreshItem), or the basis card. The
  // cards take the keyboard one at a time, as the report's blocks do: Tab
  // stops at one card's buttons, and Up and Down on a Comment button move to
  // the next card's.
  var eng = null;
  function engLive() { return !!eng && eng.pack === state.pack && state.page === "engagement" && eng.host.isConnected; }
  function refreshItem(i) {
    var old = eng.els.get(i);
    if (!old) return;
    var nu = itemNode(i);
    if (eng.cur !== i) setTabbable(nu, false);
    old.parentNode.replaceChild(nu, old);
    eng.els.set(i, nu);
  }
  function setCurrentItem(i) {
    if (!eng || eng.cur === i || !eng.els.get(i)) return;
    var old = eng.cur && eng.els.get(eng.cur);
    eng.cur = i;
    if (old) setTabbable(old, false);
    setTabbable(eng.els.get(i), true);
  }
  function refreshBasis() {
    var old = $("rr-basis");
    if (old) old.parentNode.replaceChild(basisCard(), old);
  }
  function basisCard() {
    var bs = state.pack.basisOfAssessment || {};
    function list(title, rows, fmt) {
      rows = Array.isArray(rows) ? rows.filter(function (r) { return r && typeof r === "object"; }) : [];
      if (!rows.length) return h("p", { class: "muted", text: title + ": none recorded." });
      return h("div", null, [h("strong", { text: title }), h("ul", { style: "margin:4px 0 10px; padding-left:20px" }, rows.map(function (r) { return h("li", { text: fmt(r) }); }))]);
    }
    var openBasis = state.composer && state.composer.anchor.kind === "general" && state.composer.anchor.sectionTitle === "Basis of assessment";
    var basisComments = comments().filter(function (c) { return c.anchor.kind === "general" && c.anchor.sectionTitle === "Basis of assessment"; });
    var basis = card("Basis of assessment", null, [
      list("People interviewed", bs.interviews, function (r) { return [r.name, r.role, r.date].filter(Boolean).join(", "); }),
      list("Documents reviewed", bs.documents, function (r) { return [r.title, r.reference, r.date].filter(Boolean).join(", "); }),
      list("Systems observed", bs.observations, function (r) { return [r.name, r.method || r.description, r.location, r.date].filter(Boolean).join(", "); }),
      h("button", { type: "button", class: "btn sm rr-basis-comment", text: "Comment on the basis of assessment", onClick: function () {
        if (openBasis && !state.composer.editing) { flashComposer(); return; }
        openComposer({ anchor: { documentIndex: 0, documentTitle: "", kind: "general", sectionKey: "", sectionTitle: "Basis of assessment", blockId: "", quote: "", cell: null, targetName: "", itemId: "", field: "" }, severity: "should-fix", text: "", canSuggest: false });
      } }),
      basisComments.length ? h("div", { class: "rr-side" }, basisComments.map(commentNode)) : null,
      openBasis ? composerNode() : null
    ]);
    basis.id = "rr-basis";
    return basis;
  }
  function prevOnItem(i) {
    var list = (itemMemo().prev[String(i.itemId)] || []).filter(function (p) { return onItem(p.comment.anchor, i); });
    return list.length ? h("div", { class: "rr-side" }, list.map(function (p) { return prevNode(p, true); })) : null;
  }

  function renderEngagement(main) {
    var pack = state.pack, all = pack.items || [], targets = targetsOf(pack);
    main.appendChild(h("h1", { class: "page-title", text: "Engagement" }));
    main.appendChild(h("p", { class: "page-sub", text: "The answers and evidence behind the report." }));
    // "No evidence" is named for what the pack calls that field, and left out
    // when it has none.
    var evLabel = fieldLabel("evidence");
    if (evLabel === null && state.itemFilter === "noevidence") state.itemFilter = "all";
    var filters = [["all", "All"], ["findings", "Findings"], evLabel === null ? null : ["noevidence", "No " + lowerLabel(evLabel)], ["open", "To assess or not answered"], ["commented", "With your comments"]].filter(Boolean);
    var tb = [
      h("div", { class: "rr-seg", role: "group", "aria-label": "Filter" }, filters.map(function (f) {
        return h("button", { type: "button", class: state.itemFilter === f[0] ? "on" : "", "data-filter": f[0], "aria-pressed": state.itemFilter === f[0] ? "true" : "false", text: f[1], onClick: function () { state.itemFilter = f[0]; render(true); } });
      }))
    ];
    if (targets.length > 1) {
      tb.push(h("select", { id: "rr-item-target", "aria-label": "Which target", onChange: function (e) { state.itemTarget = e.target.value; render(true); } },
        [h("option", { value: "", text: "All (" + targets.length + ")" })].concat(targets.map(function (t) { var o = h("option", { value: t, text: t }); if (t === state.itemTarget) o.selected = true; return o; }))));
    }
    // Searches as you type, a moment after the last key; Enter at once. The
    // caret stays in the box across the redraw.
    var search = h("input", { type: "search", id: "rr-item-search", placeholder: "Search items", "aria-label": "Search items", value: state.itemSearch });
    function apply() {
      clearTimeout(searchTimer);
      if (state.itemSearch === search.value) return;
      state.itemSearch = search.value; state.focusSearch = true; render(true);
    }
    search.addEventListener("input", function () { clearTimeout(searchTimer); searchTimer = setTimeout(apply, 200); });
    search.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); apply(); } });
    tb.push(search);
    main.appendChild(h("div", { class: "rr-toolbar" }, tb));
    if (state.focusSearch) {
      state.focusSearch = false;
      try { search.focus({ preventScroll: true }); } catch (e) { search.focus(); }
      try { var n = search.value.length; search.setSelectionRange(n, n); } catch (e) {}
    }
    var shown = all.filter(itemVisible);
    var countLine = h("p", { class: "small muted", id: "rr-item-count" }, ["Showing " + shown.length + " of " + all.length + " items. ",
      h("button", { type: "button", class: "rr-linkbtn", id: "rr-basis-link", text: "Go to the basis of assessment", onClick: function () {
        var el = $("rr-basis");
        if (el && el.scrollIntoView) el.scrollIntoView({ block: "start" });
        focusOn(el && el.querySelector(".rr-basis-comment"));
      } })]);
    main.appendChild(countLine);
    var lastT = null, lastG = null;
    var LIMIT = 150, cut = shown.length > LIMIT && !state.itemsAll ? LIMIT : shown.length;
    var keep = eng && eng.pack === pack ? eng.cur : null;
    eng = { pack: pack, els: new Map(), list: [], cur: null, host: countLine };
    shown.slice(0, cut).forEach(function (i) {
      if (targets.length > 1 && i.targetName !== lastT) { main.appendChild(h("h2", { class: "rr-target-h", text: i.targetName })); lastG = null; }
      lastT = i.targetName;
      if (i.groupName !== lastG) { main.appendChild(h("div", { class: "rr-group-h", text: i.groupName })); lastG = i.groupName; }
      var el = itemNode(i);
      eng.els.set(i, el);
      eng.list.push(i);
      main.appendChild(el);
    });
    // One card's buttons are in the Tab order: the one last used, if it is
    // still shown, else the first.
    eng.cur = keep && eng.els.get(keep) ? keep : eng.list[0] || null;
    eng.list.forEach(function (i) { if (i !== eng.cur) setTabbable(eng.els.get(i), false); });
    if (cut < shown.length) main.appendChild(h("button", { type: "button", class: "btn", id: "rr-items-all", text: "Show all " + shown.length, onClick: function () {
      var from = eng.list.length;
      state.itemsAll = true; render(true);
      // On to the first of the items just shown.
      var first = eng.list[from], el = first && eng.els.get(first);
      if (el) { setCurrentItem(first); focusOn(el.querySelector(".rr-item-comment")); }
    } }));

    // The basis of assessment
    main.appendChild(h("div", { class: "spacer-12", style: "height:12px" }));
    main.appendChild(basisCard());
  }
  // Up and Down on an item's Comment button: the next item's, or the one
  // before. Home and End: the first and the last.
  function itemKey(e) {
    var t = e.target, k = e.key;
    if (e.altKey || e.ctrlKey || e.metaKey || !engLive() || !t.classList || !t.classList.contains("rr-item-comment")) return;
    var cardEl = t.closest(".rr-item"), at = cardEl && cardEl.rrItem ? eng.list.indexOf(cardEl.rrItem) : -1;
    if (at === -1) return;
    var to = k === "ArrowDown" ? at + 1 : k === "ArrowUp" ? at - 1 : k === "Home" ? 0 : k === "End" ? eng.list.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    var next = eng.list[to];
    if (!next) return;
    setCurrentItem(next);
    eng.els.get(next).querySelector(".rr-item-comment").focus();
  }

  // ---------- the checklist ----------
  function checklistItems() {
    var C = A.Data.checklists || {}, e = state.pack.engagement || {};
    var groups = [{ title: "Every report", items: C.common || [] }];
    // A family question that does not fit this framework is left out (skip).
    var skip = (C.skip || {})[e.instrumentId] || [];
    var fam = ((C.families || {})[e.scoringFamily] || []).filter(function (q) { return skip.indexOf(q.id) === -1; });
    if (fam.length) groups.push({ title: "For this type of report", items: fam });
    var ins = (C.instruments || {})[e.instrumentId];
    if (ins && ins.length) groups.push({ title: e.instrumentTitle || "For this framework", items: ins });
    return groups;
  }
  function checklistTotal() { var n = 0; checklistItems().forEach(function (g) { n += g.items.length; }); return n; }
  function checklistAnswered() {
    var ids = {};
    checklistItems().forEach(function (g) { g.items.forEach(function (q) { ids[q.id] = true; }); });
    return state.review.checklist.filter(function (a) { return a.answer && ids[a.id]; }).length;
  }
  function answerOf(id) { return state.review.checklist.filter(function (a) { return a.id === id; })[0] || null; }
  function setAnswer(q, patch) {
    var a = answerOf(q.id);
    if (!a) { a = { id: q.id, text: q.text, answer: "", note: "" }; state.review.checklist.push(a); }
    Object.keys(patch).forEach(function (k) { a[k] = patch[k]; });
    touched();
  }
  // A comment saying why an answer is No: a general comment like any other,
  // with the question as the text it is on, so the author sees which one.
  function checklistAnchor(q) {
    return { documentIndex: 0, documentTitle: "", kind: "general", sectionKey: "", sectionTitle: "Checklist", blockId: "", quote: q.text, cell: null, targetName: "", itemId: "", field: "" };
  }
  // Is this anchor on the checklist (and, given a question, on that one)?
  function isChecklistAnchor(a, q) {
    return !!a && a.kind === "general" && a.sectionTitle === "Checklist" && (!q || RC.norm(a.quote) === RC.norm(q.text));
  }
  function renderChecklist(main) {
    main.appendChild(h("h1", { class: "page-title", text: "Checklist" }));
    main.appendChild(h("p", { class: "page-sub", text: "If you answer no, add a comment saying why." }));
    checklistItems().forEach(function (g) {
      main.appendChild(card(g.title, null, g.items.map(function (q) {
        var a = answerOf(q.id) || {};
        // Saved as it is typed: closing the window straight after must not
        // lose it. Nothing is drawn again for a key.
        function noteChanged(e) {
          var cur = answerOf(q.id);
          if ((cur ? cur.note || "" : "") !== e.target.value) setAnswer(q, { note: e.target.value });
        }
        // A No can say why, as a comment the author gets. Offered, never
        // required; the comment then shows here, under its question.
        var why = comments().filter(function (c) { return isChecklistAnchor(c.anchor, q); });
        var open = !!state.composer && isChecklistAnchor(state.composer.anchor, q);
        var whyKids = [];
        if (a.answer === "no" && !why.length && !open) whyKids.push(h("button", { type: "button", class: "rr-linkbtn rr-q-why-add", text: "Add a comment saying why", onClick: function () {
          openComposer({ anchor: checklistAnchor(q), severity: "should-fix", text: "", canSuggest: false, label: "Why the answer is no to: " + q.text });
        } }));
        if (why.length) whyKids.push(h("div", { class: "rr-side" }, why.map(commentNode)));
        if (open) whyKids.push(composerNode());
        return h("div", { class: "rr-q" + (why.length ? " has-why" : ""), "data-q": q.id }, [
          h("div", { text: q.text }),
          h("div", { class: "rr-seg", role: "group", "aria-label": "Answer" }, [["yes", "Yes"], ["no", "No"], ["na", "N/A"]].map(function (o) {
            return h("button", { type: "button", class: o[0] + (a.answer === o[0] ? " on" : ""), "data-answer": o[0], "aria-pressed": a.answer === o[0] ? "true" : "false", text: o[1], onClick: function () {
              setAnswer(q, { answer: a.answer === o[0] ? "" : o[0] }); render(true);
            } });
          })),
          h("div", { class: "rr-note" }, [h("input", { type: "text", placeholder: "Note (optional)", "aria-label": "Note", value: a.note || "", onInput: noteChanged, onChange: noteChanged })]),
          whyKids.length ? h("div", { class: "rr-note rr-q-why" }, whyKids) : null
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
  // A result's ids: its own, and any it had in an earlier version of the
  // checks. A dismissal or a comment saved under any of them still counts.
  function checkIds(r) { return [r.id].concat(Array.isArray(r.legacyIds) ? r.legacyIds : []); }
  function isDismissed(r) { return checkIds(r).some(function (id) { return state.review.dismissedChecks.indexOf(id) !== -1; }); }
  function hasCheckComment(r) { var ids = checkIds(r); return comments().some(function (c) { return ids.indexOf(c.check) !== -1; }); }
  function activeChecks() { return currentChecks().filter(function (r) { return !isDismissed(r); }); }
  // { check result id: what it said }, for each dismissed check, so the
  // author can read them with no check engine. One no longer found keeps the
  // words it was saved with.
  function dismissedTitles() {
    var r = state.review, had = r.dismissedCheckTitles || {}, out = {}, byId = mapOf();
    currentChecks().forEach(function (x) { checkIds(x).forEach(function (id) { if (!byId[id]) byId[id] = x; }); });
    r.dismissedChecks.forEach(function (id) {
      var x = byId[id];
      if (x) out[id] = x.title + (x.kind === "block" && x.sectionTitle ? " (in " + x.sectionTitle + docSuffix(x.documentIndex || 0) + ")" : "") + ": " + x.message;
      else if (typeof had[id] === "string") out[id] = had[id];
    });
    return out;
  }

  function checkAnchor(r) {
    var doc = state.pack.documents[r.documentIndex] || {};
    if (r.kind === "item") {
      var it = findItemFor(r) || {};
      return { documentIndex: r.documentIndex || 0, documentTitle: doc.title || "", kind: "item", sectionKey: "", sectionTitle: "", blockId: "", quote: r.field ? it[r.field] || "" : "",
        cell: null, targetName: r.targetName, targetId: r.targetId || it.targetId || "", itemId: r.itemId, field: r.field || "", code: r.code, itemTitle: r.itemTitle };
    }
    if (r.kind === "general") {
      return { documentIndex: 0, documentTitle: "", kind: "general", sectionKey: "", sectionTitle: r.sectionTitle || "General", blockId: "", quote: r.quote || "", cell: null, targetName: "", itemId: "", field: "" };
    }
    // On the block as a click on it would be: the quote is the whole block,
    // or the whole cell, never the clipped words the check shows. That is
    // what the author's tool and the next round match the comment by.
    var b = (doc.blocks || []).filter(function (x) { return x.id === r.blockId; })[0];
    if (b) {
      var cell = r.cell && b.type === "table" ? { row: r.cell.row, col: r.cell.col } : null;
      return blockAnchor(doc, r.documentIndex || 0, b, cell, typeof r.fullText === "string" ? r.fullText : cell ? cellText(b, cell) : b.type === "image" ? "" : b.text || "");
    }
    return { documentIndex: r.documentIndex, documentTitle: doc.title || "", kind: "block", sectionKey: r.sectionKey, sectionTitle: r.sectionTitle, blockId: r.blockId,
      quote: r.fullText || r.quote, cell: r.cell, targetName: doc.targetName || "", itemId: "", field: "" };
  }
  function goToCheck(r) {
    if (r.kind === "item") { jumpToItem(r.targetName, r.itemId, r.targetId); return; }
    if (r.kind === "general") { state.page = "summary"; render(true); return; }
    jumpToBlock(r.documentIndex, r.blockId);
  }
  function renderChecks(main) {
    main.appendChild(h("h1", { class: "page-title", text: "Automatic checks" }));
    main.appendChild(h("p", { class: "page-sub", text: "Possible problems in this pack. Make each one a comment or dismiss it." }));
    var all = currentChecks(), active = all.filter(function (r) { return !isDismissed(r); }), gone = all.length - active.length;
    // What was found first, in the checks' own order; the clean checks folded
    // into one card, each opening to say what it looked for.
    var risk = (state.pack.engagement || {}).scoringFamily === "risk-assessment";
    var ids = Object.keys(RK.CHECKS).filter(function (id) { return active.some(function (r) { return r.check === id; }) || /^risk-/.test(id) === risk; });
    var hits = ids.filter(function (id) { return active.some(function (r) { return r.check === id; }); });
    var clean = ids.filter(function (id) { return hits.indexOf(id) === -1; });
    hits.forEach(function (id) {
      var def = RK.CHECKS[id], rows = active.filter(function (r) { return r.check === id; });
      var c = card(def.title + " (" + rows.length + ")", null, [
        h("p", { class: "muted small", style: "margin-top:0", text: def.about }),
        h("div", { "data-check": id }, rows.slice(0, state.checksAll === id ? rows.length : 25).map(checkRow)),
        rows.length > 25 && state.checksAll !== id ? h("button", { type: "button", class: "btn sm", text: "Show all " + rows.length, onClick: function () { state.checksAll = id; render(true); } }) : null
      ]);
      c.setAttribute("data-check-card", id);
      main.appendChild(c);
    });
    if (clean.length) {
      var cc = card("Nothing found", RC.plural(clean.length, "check"), [h("div", { class: "rr-clean" }, clean.map(function (id) {
        var def = RK.CHECKS[id];
        return h("details", { class: "rr-clean-item", "data-check-clean": id }, [h("summary", { text: def.title }), h("p", { class: "muted small", text: def.about })]);
      }))]);
      cc.id = "rr-checks-clean";
      main.appendChild(cc);
    }
    // The reviewer's own list of names: always here, whatever it found.
    main.appendChild(card("Other clients' names to look for", null, [namesEditor()]));
    if (gone) {
      main.appendChild(h("div", null, [
        h("button", { type: "button", class: "rr-linkbtn", id: "rr-checks-gone", text: (state.showDismissed ? "Hide" : "Show") + " " + gone + " dismissed", onClick: function () { state.showDismissed = !state.showDismissed; render(true); } })
      ]));
      if (state.showDismissed) {
        main.appendChild(card("Dismissed", null, all.filter(isDismissed).map(checkRow)));
      }
    }
  }
  // After a check's button has gone (the row dismissed, restored or made a
  // comment), the keyboard goes to the row's Dismiss, else to the row that
  // took its place, else to the link that shows the dismissed ones.
  function checkFocus(id, nextId) {
    function btn(x) { return x ? document.querySelector('#main [data-check-id="' + cssEsc(x) + '"]:not(.dismissed) .rr-check-dismiss') : null; }
    if (!focusOn(btn(id)) && !focusOn(btn(nextId)) && !focusOn($("rr-checks-gone"))) focusOn(pageTitle());
  }
  function checkRow(r) {
    var dismissed = isDismissed(r), made = hasCheckComment(r);
    function neighbour(ev) {
      var row = ev.currentTarget.closest(".rr-check"), n = row && (row.nextElementSibling || row.previousElementSibling);
      return n && n.getAttribute ? n.getAttribute("data-check-id") : null;
    }
    return h("div", { class: "rr-check" + (dismissed ? " dismissed" : ""), "data-check-id": r.id }, [
      h("div", { text: r.message }),
      r.quote ? h("div", { class: "quote small", text: r.quote }) : null,
      r.kind === "block" && (r.sectionTitle || docSuffix(r.documentIndex || 0)) ? h("div", { class: "small muted rr-check-where", text: r.sectionTitle ? "In " + r.sectionTitle + docSuffix(r.documentIndex || 0) : "In the " + state.pack.documents[r.documentIndex || 0].title }) : null,
      h("div", { class: "rr-actions" }, [
        h("button", { type: "button", class: "btn sm rr-check-go", text: "Go to", onClick: function () { goToCheck(r); } }),
        made ? h("span", { class: "rr-chip met", text: "Comment added" }) : h("button", { type: "button", class: "btn sm rr-check-comment", text: "Make it a comment", onClick: function () {
          withReviewerName(function () {
            addComment({ severity: r.severity, anchor: checkAnchor(r), text: r.message, check: r.id });
            render(true);
            checkFocus(r.id);
          });
        } }),
        dismissed
          ? h("button", { type: "button", class: "btn sm rr-check-restore", text: "Restore", onClick: function () { var ids = checkIds(r); state.review.dismissedChecks = state.review.dismissedChecks.filter(function (x) { return ids.indexOf(x) === -1; }); touched(); render(true); checkFocus(r.id); } })
          : h("button", { type: "button", class: "btn sm rr-check-dismiss", text: "Dismiss", onClick: function (ev) { var next = neighbour(ev); state.review.dismissedChecks.push(r.id); touched(); render(true); checkFocus(null, next); } })
      ])
    ]);
  }
  function namesEditor() {
    var ta = h("input", { type: "text", id: "rr-names", style: "width:100%;box-sizing:border-box;font:inherit;padding:5px 8px;border:1px solid var(--border-strong);border-radius:var(--radius);background:var(--surface);color:var(--text)",
      placeholder: "Names, separated by commas", "aria-label": "Other clients' names to look for", value: userNames().join(", ") });
    ta.addEventListener("change", function () {
      var names = ta.value.split(",").map(RC.norm).filter(Boolean);
      lsSet(KEY_NAMES, JSON.stringify(names));
      state.checks = null;
      render(true);
    });
    return h("div", { style: "margin-bottom:8px" }, [ta, h("div", { class: "small muted", text: "Kept in this browser only." })]);
  }

  // ---------- previous round ----------
  function renderPrevious(main) {
    var list = prevComments();
    main.appendChild(h("h1", { class: "page-title", text: "Previous round" }));
    main.appendChild(h("p", { class: "page-sub", text: "What the author did about each earlier comment. Confirm it or raise it again." }));
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
    approved: "It can go out as it is.",
    "approved-with-comments": "It can go out once the author has looked at your comments.",
    "changes-requested": "It should not go out until your points are dealt with."
  };
  // Only a pack whose document control has a QA review by field can take the
  // reviewer's name there, so only then is it promised.
  function hasQaField() {
    var dc = state.pack && (state.pack.engagement || {}).documentControl;
    return !!(dc && typeof dc === "object" && "qaReviewBy" in dc);
  }
  function verdictHelp(v) {
    return VERDICT_HELP[v] + (RC.isApproval(v) && hasQaField() ? " The author can put your name in QA review by." : "");
  }
  // " - <report>" when the pack holds more than one report, so the same
  // section title in each is told apart.
  function docSuffix(i) {
    var docs = state.pack ? state.pack.documents : [];
    return docs.length > 1 && docs[i] && docs[i].title ? " - " + docs[i].title : "";
  }
  function commentWhere(c) {
    var a = c.anchor;
    if (a.kind === "item") return [a.targetName, a.code].filter(Boolean).join(": ");
    if (a.kind === "general") return a.sectionTitle || "General";
    return (a.sectionTitle || "Cover") + docSuffix(a.documentIndex || 0);
  }
  // Comments in the order the document prints them: each report's blocks in
  // turn, then the items behind them, then the general ones.
  function inDocOrder(list) {
    var pos = {}, items = {};
    state.pack.documents.forEach(function (doc, d) { (doc.blocks || []).forEach(function (b, k) { pos[d + "|" + b.id] = k; }); });
    (state.pack.items || []).forEach(function (it, k) { items[it.targetName + "|" + it.itemId] = k; });
    function key(c, n) {
      var a = c.anchor, k;
      if (a.kind === "block") { k = pos[(a.documentIndex || 0) + "|" + a.blockId]; return [0, a.documentIndex || 0, k == null ? 1e9 : k, n]; }
      if (a.kind === "item") { var it = findItemFor(a); k = it ? (state.pack.items || []).indexOf(it) : items[a.targetName + "|" + a.itemId]; return [1, 0, k == null ? 1e9 : k, n]; }
      return [2, 0, 0, n];
    }
    return list.map(function (c, n) { return { c: c, k: key(c, n) }; }).sort(function (x, y) {
      for (var i = 0; i < 4; i++) if (x.k[i] !== y.k[i]) return x.k[i] - y.k[i];
      return 0;
    }).map(function (x) { return x.c; });
  }
  function jumpToComment(c) {
    if (c.anchor.kind === "item") {
      // The item as it is in this pack: the target may have been renamed.
      var it = findItemFor(c.anchor);
      jumpToItem(it ? it.targetName : c.anchor.targetName, c.anchor.itemId, it ? it.targetId : c.anchor.targetId);
      return;
    }
    if (c.anchor.kind === "general") {
      // The basis of assessment has its card on Engagement; any other general
      // comment (one made from a check) lives on Summary.
      state.page = c.anchor.sectionTitle === "Basis of assessment" ? "engagement" : isChecklistAnchor(c.anchor) ? "checklist" : "summary";
      state.jump = { el: state.page === "engagement" ? "rr-basis" : null, comment: c.id };
      render();
      return;
    }
    jumpToBlock(c.anchor.documentIndex, c.anchor.blockId);
  }
  // How far through the previous round's comments the reviewer is: confirmed,
  // raised again, or replied to. Each is something done about the comment.
  function prevLookedAt() {
    var prev = prevComments();
    return prev.filter(function (p) {
      return isConfirmed(p.comment.id) || comments().some(function (c) { return c.relatesTo === p.comment.id; }) || repliesTo(p.comment.id).length > 0;
    }).length;
  }
  function sectionsRead() {
    var n = 0, all = 0;
    state.pack.documents.forEach(function (doc, d) { sectionsOf(doc).forEach(function (s) { all++; if (isRead(d, s.id)) n++; }); });
    return { read: n, all: all };
  }
  function renderSummary(main) {
    var r = state.review, list = comments();
    main.appendChild(h("h1", { class: "page-title rr-sum-title", text: "Summary and verdict" }));
    main.appendChild(h("p", { class: "page-sub", text: "Choose a verdict, save, and send the file to the author." }));
    main.appendChild(printHeader());
    var rq = requestPanel();
    if (rq) main.appendChild(rq);
    var sev = {};
    RC.SEVERITIES.forEach(function (s) { sev[s.id] = list.filter(function (c) { return c.severity === s.id; }).length; });
    var answered = checklistAnswered(), totalQ = checklistTotal();
    // What is left to do: each count goes to its page. Advice only.
    function stat(n, label, page, id) {
      var kids = [h("strong", { id: id || null, text: n }), label];
      if (!page) return h("div", { class: "rr-stat" }, kids);
      return h("button", { type: "button", class: "rr-stat rr-stat-go", "data-go": page, title: "Go to " + label.toLowerCase(), onClick: function () { state.page = page; render(false); } }, kids);
    }
    var prevN = prevComments().length, reads = sectionsRead();
    // The printout names the reviewer in its header, and lists the earlier
    // comments one by one, so the card's "as" and the sections read (a note
    // to self) are screen only.
    var yours = card("Your review", "as " + (r.reviewer || reviewerName() || "unnamed"), [
      h("div", { class: "rr-stats" }, [
        stat(String(sev["must-fix"]), "Must fix", null, "rr-sum-must"),
        stat(String(sev["should-fix"]), "Should fix"),
        stat(String(sev.suggestion), "Suggestions"),
        stat(answered + "/" + totalQ, "Checklist", "checklist", "rr-sum-checklist"),
        stat(String(activeChecks().length), "Checks not dismissed", "checks", "rr-sum-checks"),
        prevN ? stat(prevLookedAt() + "/" + prevN, "Earlier comments looked at", "previous", "rr-sum-prev") : null,
        prevN ? stat(String(replies().length), "Replies to earlier comments", "previous", "rr-sum-replies") : null,
        reads.all ? stat(reads.read + "/" + reads.all, "Sections marked read", "report", "rr-sum-read") : null
      ]),
      h("div", { class: "rr-actions no-print" }, [
        h("button", { type: "button", class: "rr-linkbtn", id: "rr-rename", text: "Change your name", onClick: function () { askName(null, r.reviewer || reviewerName()); } }),
        h("button", { type: "button", class: "rr-linkbtn", id: "rr-print", text: "Print or save as PDF", onClick: function () { window.print(); } })
      ])
    ]);
    yours.querySelector(".card-h .sub").classList.add("no-print");
    var readStat = yours.querySelector("#rr-sum-read");
    if (readStat) readStat.parentNode.classList.add("no-print");
    main.appendChild(yours);
    var vWrap = h("div", { class: "rr-verdicts" }, ["approved", "approved-with-comments", "changes-requested", "none"].map(function (v) {
      var on = (r.verdict.value || "none") === v;
      var radio = h("input", { type: "radio", name: "rr-verdict", value: v });
      radio.checked = on;
      radio.addEventListener("change", function () {
        r.verdict.value = v;
        r.verdict.date = v === "none" ? "" : todayISO();
        touched(); render(true);
      });
      return h("label", { class: "rr-verdict" + (on ? " on" : ""), "data-verdict": v }, [radio, h("span", null, [h("strong", { text: RC.VERDICTS[v] }), h("div", { class: "small muted", text: verdictHelp(v) })])]);
    }));
    var warn = RC.isApproval(r.verdict.value) && sev["must-fix"] ? h("div", { class: "rr-warn", text: "You have " + RC.plural(sev["must-fix"], "must-fix comment") + " and an approval. The author will see both." }) : null;
    // Where the last save went, and when. A file opened from disk has only
    // the date it was saved on.
    var ls = state.lastSave, savedText = null;
    if (!state.dirty && ls) savedText = "Saved to " + ls.name + " at " + fmtTime(ls.at) + "." + (ls.method === "download" ? " Send the newest copy." : "");
    else if (!state.dirty && r.savedAt) savedText = "Saved " + fmtDate(r.savedAt) + ".";
    // The note is saved as it is typed: closing the window straight after
    // must not lose it. Nothing is drawn again for a key; only the line that
    // says where the last save went, no longer true, is taken off.
    function noteChanged(e) {
      if ((r.verdict.note || "") === e.target.value) return;
      r.verdict.note = e.target.value;
      touched();
      var at = $("rr-saved-at");
      if (at && at.parentNode) at.parentNode.removeChild(at);
    }
    // Not printed: the printout's header carries the verdict and the note.
    var vCard = card("Verdict", null, [
      vWrap, warn,
      h("div", { class: "field" }, [h("label", { text: "A note for the author" }), h("textarea", { id: "rr-verdict-note", "aria-label": "A note for the author", value: r.verdict.note || "", onInput: noteChanged, onChange: noteChanged })]),
      h("div", { class: "rr-save-row no-print" }, [
        h("button", { type: "button", class: "btn primary", id: "rr-save-2", text: "Save my review file", onClick: function (e) { saveReview(e); } }),
        savedText ? h("span", { class: "small muted", id: "rr-saved-at", text: savedText }) : null
      ]),
      (r.verdict.value || "none") === "none" ? h("div", { class: "small muted no-print", id: "rr-no-verdict", text: "No verdict yet. Choose one before you send the file." }) : null
    ]);
    // No button sends the saved file to the author's tool, even in the suite:
    // the reviewer is someone else, who sends the file to the author.
    vCard.classList.add("no-print");
    main.appendChild(vCard);
    // In the order the document prints them, each with what it is on. Edit
    // opens the comment here.
    var ordered = inDocOrder(list);
    main.appendChild(card("All your comments", list.length ? String(list.length) : "none yet", list.length ? ordered.map(function (c) {
      var a = c.anchor, quote = a.selection || a.quote;
      var kids = [
        h("div", { class: "small muted rr-sum-where" }, [h("button", { type: "button", class: "rr-linkbtn", text: commentWhere(c), onClick: function () { jumpToComment(c); } })]),
        quote ? h("div", { class: "quote small muted rr-sum-quote", text: cut(quote, 240) }) : null,
        commentNode(c)
      ];
      if (state.composer && state.composer.editing === c.id) kids.push(composerNode());
      return h("div", { class: "rr-check", "data-sum-comment": c.id }, kids);
    }) : [h("p", { class: "muted", text: "Comments you add appear here." })]));
    var col = state.colleague;
    if (col) {
      main.appendChild(card(col.reviewer + "'s comments", "read only" + (col.verdict && col.verdict.value !== "none" ? ", " + (RC.VERDICTS[col.verdict.value] || col.verdict.value) : ""), col.comments.length ? col.comments.map(function (c) {
        return h("div", { class: "rr-check" }, [
          h("div", { class: "small muted" }, [h("button", { type: "button", class: "rr-linkbtn", text: commentWhere(c), onClick: function () { jumpToComment(c); } })]),
          colleagueNode(c)
        ]);
      }) : [h("p", { class: "muted", text: "Their file has no comments." })]));
    }
    var pp = printPrevious();
    if (pp) main.appendChild(pp);
    main.appendChild(printChecklist());
  }
  // The printout's own parts, hidden on screen: who, what and when at the
  // top, and the checklist answers at the end. A reviewer's working note,
  // printed from this page only; it never goes near Word or Excel.
  function printHeader() {
    var e = state.pack.engagement || {}, r = state.review;
    var rows = [
      ["Client", [e.client, e.site].filter(Boolean).join(", ")],
      ["Report", state.pack.documents.map(function (d) { return d.title; }).filter(Boolean).join("; ") || e.instrumentTitle || ""],
      ["Round", String(state.pack.round || 1)],
      ["Reviewer", r.reviewer || reviewerName() || ""],
      ["Printed", fmtDate(new Date().toISOString())],
      ["Verdict", RC.VERDICTS[r.verdict.value || "none"] + (r.verdict.note ? ". " + r.verdict.note : "")]
    ];
    return h("div", { class: "rr-print-only", id: "rr-print-head" }, [
      h("h2", { text: "Review of " + (e.instrumentTitle || "the report") }),
      h("table", { class: "rr-print-table" }, [h("tbody", null, rows.filter(function (x) { return x[1]; }).map(function (x) {
        return h("tr", null, [h("th", { text: x[0] }), h("td", { text: x[1] })]);
      }))])
    ]);
  }
  function printChecklist() {
    var ANS = { yes: "Yes", no: "No", na: "N/A" };
    var rows = [];
    checklistItems().forEach(function (g) {
      g.items.forEach(function (q) {
        var a = answerOf(q.id) || {};
        rows.push(h("tr", null, [h("td", { text: q.text }), h("td", { class: "rr-ans", text: ANS[a.answer] || "Not answered" }), h("td", { text: a.note || "" })]));
      });
    });
    return h("div", { class: "rr-print-only", id: "rr-print-checklist" }, [
      h("h2", { text: "Checklist" }),
      h("table", { class: "rr-print-table" }, [h("thead", null, [h("tr", null, [h("th", { text: "Question" }), h("th", { class: "rr-ans", text: "Answer" }), h("th", { text: "Note" })])]), h("tbody", null, rows)])
    ]);
  }
  // From round 2, what became of each earlier comment: the main output of a
  // later round's review, so the printout lists it.
  function printPrevious() {
    var list = prevComments();
    if (!list.length) return null;
    var rows = list.map(function (p) {
      var c = p.comment, raised = comments().some(function (x) { return x.relatesTo === c.id; }), mine = repliesTo(c.id);
      var what = isConfirmed(c.id) ? (p.status === "wontchange" ? "Reason accepted" : "Confirmed fixed") : raised ? "Raised again" : mine.length ? "Replied" : "Not looked at";
      var said = [h("div", { text: cut(c.text, 160) + " (" + c.reviewer + ", round " + p.round + ")" })].concat(mine.map(function (r) {
        return h("div", { class: "rr-print-reply", text: "Your reply: " + cut(r.text, 300) });
      }));
      return h("tr", { "data-prev-row": c.id }, [h("td", { text: commentWhere(c) }), h("td", null, said), h("td", { class: "rr-ans", text: what })]);
    });
    return h("div", { class: "rr-print-only", id: "rr-print-prev" }, [
      h("h2", { text: "Earlier comments" }),
      h("table", { class: "rr-print-table" }, [h("thead", null, [h("tr", null, [h("th", { text: "Where" }), h("th", { text: "Comment" }), h("th", { class: "rr-ans", text: "Now" })])]), h("tbody", null, rows)])
    ]);
  }

  // ---------- welcome and about ----------
  function renderWelcome(main) {
    main.appendChild(h("h1", { class: "page-title", text: "Report review" }));
    main.appendChild(h("p", { class: "page-sub", text: "Read a report as the client will, and comment on it." }));
    var drop = h("div", { class: "rr-drop", id: "rr-drop" }, [
      h("p", { text: "Drop a review pack here, or" }),
      h("button", { type: "button", class: "btn primary", id: "rr-open", text: "Open a review pack", onClick: chooseFiles }),
      h("button", { type: "button", class: "btn", id: "rr-demo", text: "Try the demo", onClick: openDemo })
    ]);
    main.appendChild(drop);
    main.appendChild(card("How a review works", null, [h("ol", { class: "rr-steps" }, [
      h("li", { text: "Open the review pack. It holds client data: handle it as you would the project file." }),
      h("li", { text: "Read the report and comment as you go. Then work through the checklist and the automatic checks." }),
      h("li", { text: "On Summary and verdict, choose a verdict and save your review file. To carry on later, open the pack and your review file." }),
      h("li", { text: "Send the file to the author." })
    ])]));
  }
  function renderAbout(main) {
    main.appendChild(h("h1", { class: "page-title", text: "About" }));
    main.appendChild(card(V.product + " " + V.label, "version " + V.number, [
      h("p", { text: "Works offline. Review packs hold client data: handle them as you would the project file." }),
      h("p", { text: "It reads " + RC.packSchema() + " and writes " + RC.fileSchema() + "." })
    ]));
    main.appendChild(card("Keyboard", null, [keysList()]));
    main.appendChild(card("Copyright and licence", null, [h("p", { text: LEGAL_NOTICE }), h("div", { class: "rr-licence", text: (A.Data && A.Data.licence) || "" })]));
  }
  // The keys, in one place: on About, and from the Keyboard button above the
  // report. Keep it in step with paperKey, itemKey and the wiring.
  var KEYS = [
    ["Tab", "Moves between parts of the page. Use the keys below inside the report, the section list and the items."],
    ["Up and Down", "Previous or next block, section or item."],
    ["Page Up and Page Down", "Previous or next section of the report."],
    ["Home and End", "First or last block, section or item. In a table, first or last cell of the row."],
    ["Enter or Space", "Comment on the block. On a table, Enter goes into the cells and Space comments on the whole table."],
    ["In a table", "Arrow keys move between cells, Enter comments on the cell, Escape goes back to the table."],
    ["Tab from a paragraph", "Goes to its comments, then out of the report."],
    ["Escape", "Closes an empty comment or reply box, or a question. Clears the find box."],
    ["Left and Right", "Move between buttons in a group."],
    ["Ctrl+F", "Find in the report. Enter and Shift+Enter go to the next and previous match."],
    ["Ctrl+Z", "Undoes a delete while Undo is showing."]
  ];
  function keysList() {
    var kids = [];
    KEYS.forEach(function (k) { kids.push(h("dt", { text: k[0] }), h("dd", { text: k[1] })); });
    return h("dl", { class: "rr-keys" }, kids);
  }
  function showKeys() {
    modal("Keyboard", function (m) {
      return [h("h2", { text: "Keyboard" }), keysList(),
        h("div", { class: "btn-row" }, [h("button", { type: "button", class: "btn primary", id: "rr-keys-close", text: "Close", onClick: m.close })])];
    }, null, "wide");
  }

  function openDemo() {
    function go() {
      if (!window.SPT_REVIEW_DEMO_PACK) { toast("The demo pack (data/demo-pack.js) is missing.", "err"); return; }
      openPack(JSON.parse(JSON.stringify(window.SPT_REVIEW_DEMO_PACK)), true);
      render();
      toast("Demo pack opened.");
    }
    if (window.SPT_REVIEW_DEMO_PACK) { go(); return; }
    var s = document.createElement("script");
    s.src = "data/demo-pack.js";
    s.onload = go;
    s.onerror = function () { toast("The demo pack (data/demo-pack.js) failed to load.", "err"); };
    document.head.appendChild(s);
  }

  // ---------- going to things ----------
  // Already on the report, in that document: it is scrolled to, not drawn again.
  function jumpToBlock(d, id) {
    var here = repLive() && rep.d === (d || 0);
    state.page = "report";
    state.docIndex = d || 0;
    state.jump = { block: id };
    if (here) flushJump(); else render();
  }
  function jumpToItem(target, id, targetId) {
    state.page = "engagement";
    state.itemFilter = "all"; state.itemSearch = ""; state.itemTarget = target || "";
    state.itemsAll = true;
    state.jump = { item: id, target: target, targetId: targetId || "" };
    render();
  }
  function flushJump() {
    var j = state.jump;
    if (!j) return;
    state.jump = null;
    var el = null;
    if (j.el) el = $(j.el);
    if (j.comment && !el) el = document.querySelector('[data-sum-comment="' + cssEsc(j.comment) + '"]') || document.querySelector('[data-comment-id="' + cssEsc(j.comment) + '"]');
    if (j.block) el = blockElById(j.block);
    if (j.item) el = Array.prototype.filter.call(document.querySelectorAll(".rr-item"), function (n) {
      if (n.getAttribute("data-item-id") !== j.item) return false;
      return j.targetId && n.getAttribute("data-target-id") ? n.getAttribute("data-target-id") === j.targetId : n.getAttribute("data-target") === j.target;
    })[0];
    if (!el) return;
    bringIntoView(el, "center");
    el.classList.add("flash");
    setTimeout(function () { el.classList.remove("flash"); }, 2000);
    // The keyboard goes with it: to the block, the item's Comment button, or
    // the comment's Edit.
    if (j.block) { setCurrent(el.rrEntry); focusOn(el); }
    else if (j.item) { setCurrentItem(el.rrItem); focusOn(el.querySelector(".rr-item-comment")); }
    else focusOn(el.querySelector(".rr-edit, .rr-basis-comment, button"));
  }

  // ---------- the frame of the page ----------
  // Moving page keeps a comment still being written: it shows again beside its
  // place, and a bar on the other pages leads back to it. Enter and Space work
  // as a click (the keydown listener on #sidebar, set up once below).
  function navItem(id, label, badge, disabled) {
    return h("div", { class: "nav-item" + (state.page === id ? " active" : ""), "data-page": id, role: "button", tabindex: "0",
      "aria-current": state.page === id ? "page" : null,
      onClick: function () {
        state.page = id; if (!composerHasDraft()) state.composer = null; render(false);
        // The sidebar was drawn again: keep the keyboard on this page's entry,
        // so the next Tab carries on from here rather than the top.
        focusOn(document.querySelector('.nav-item[data-page="' + id + '"]'));
      } }, [h("span", { text: label }), badge ? h("span", { class: "badge", text: String(badge) }) : null]);
  }
  // The count beside each page in the sidebar; null for none.
  function navBadges() {
    var block = 0, item = 0;
    comments().forEach(function (c) { if (c.anchor.kind === "block") block++; else if (c.anchor.kind === "item") item++; });
    return { report: block || null, engagement: item || null, checklist: checklistAnswered() + "/" + checklistTotal(), checks: activeChecks().length || null,
      // Earlier comments confirmed or raised again, of all of them.
      previous: prevComments().length ? prevLookedAt() + "/" + prevComments().length : null };
  }
  function outlineTitle(secs, d) {
    return "Sections, " + secs.filter(function (s) { return isRead(d, s.id); }).length + " of " + secs.length + " read";
  }
  // The counts the page shows, brought up to date where they are: the
  // sidebar's badges, the outline's comment counts and its count of sections
  // read, and the Go to section and Document lists. Nothing is drawn again.
  function syncCounts() {
    if (!state.pack) return;
    var badges = navBadges();
    function count(host, cls, v) {
      var el = host.querySelector("." + cls);
      if (v == null || v === "" || v === 0) { if (el) host.removeChild(el); }
      else if (!el) host.appendChild(h("span", { class: cls, text: String(v) }));
      else if (el.textContent !== String(v)) el.textContent = String(v);
    }
    Array.prototype.forEach.call(document.querySelectorAll("#sidebar .nav-item"), function (n) {
      var page = n.getAttribute("data-page");
      if (page in badges) count(n, "badge", badges[page]);
    });
    if (!repLive()) return;
    var d = rep.d, counts = countsBySection(rep.doc, d), byId = mapOf();
    rep.secs.forEach(function (s) { byId[s.id] = s; });
    Array.prototype.forEach.call(document.querySelectorAll("#sidebar .rr-outline-item"), function (n) {
      count(n, "n", counts[n.getAttribute("data-section-block")]);
    });
    var title = document.querySelector("#sidebar .rr-outline .nav-section-title");
    if (title) title.textContent = outlineTitle(rep.secs, d);
    var jump = $("rr-jump"), docs = $("rr-doc");
    if (jump) Array.prototype.forEach.call(jump.options, function (o) {
      var s = byId[o.value], t = s ? jumpOptionText(s, counts, d) : null;
      if (t != null && o.textContent !== t) o.textContent = t;
    });
    if (docs) Array.prototype.forEach.call(docs.options, function (o, i) {
      var t = state.pack.documents[i] ? docOptionText(state.pack.documents[i], i) : null;
      if (t != null && o.textContent !== t) o.textContent = t;
    });
  }
  // The outline's row that Tab stops at: one row's tick and link at a time,
  // with Up and Down to move between rows (see the sidebar's key listener).
  function outlineRow(row) {
    var sb = $("sidebar"), was = sb.querySelector(".rr-outline-row.tab");
    if (!row || was === row) return;
    if (was) { was.classList.remove("tab"); setTabbable(was, false); }
    row.classList.add("tab");
    setTabbable(row, true);
  }
  function renderNav() {
    var sb = $("sidebar"); sb.innerHTML = "";
    var sec = h("div", { class: "nav-section" });
    if (state.pack) {
      var d = curDoc(), doc = state.pack.documents[d], badges = navBadges();
      sec.appendChild(h("div", { class: "nav-section-title", text: "This review" }));
      sec.appendChild(navItem("report", "Report", badges.report));
      sec.appendChild(navItem("engagement", "Engagement", badges.engagement));
      sec.appendChild(navItem("checklist", "Checklist", badges.checklist));
      sec.appendChild(navItem("checks", "Automatic checks", badges.checks));
      if (badges.previous) sec.appendChild(navItem("previous", "Previous round", badges.previous));
      sec.appendChild(navItem("summary", "Summary and verdict", null));
      sb.appendChild(sec);
      if (state.page === "report") {
        // Each section: go to it, its comment count, and a tick to mark it
        // read, which only tells you (on Summary) how far you have got.
        var counts = countsBySection(doc, d), secs = sectionsOf(doc);
        var outline = h("div", { class: "rr-outline" }, [h("div", { class: "nav-section-title", text: outlineTitle(secs, d) })]);
        secs.forEach(function (s, n) {
          var tick = h("input", { type: "checkbox", class: "rr-read", "data-read-block": s.id, title: "Mark as read", "aria-label": "Mark " + s.title + " as read" });
          tick.checked = isRead(d, s.id);
          var row = h("div", { class: "rr-outline-row" + (tick.checked ? " read" : "") }, [tick,
            h("button", { type: "button", class: "rr-outline-item" + (s.level > 1 ? " lvl2" : ""), "data-section-block": s.id, onClick: function () {
              scrollToSection(s.id);
            } }, [h("span", { class: "t", text: s.title }), counts[s.id] ? h("span", { class: "n", text: String(counts[s.id]) }) : null])]);
          // Ticked where it is: the outline is not drawn again, so the
          // keyboard stays on the tick.
          tick.addEventListener("change", function () {
            setRead(d, s.id, tick.checked);
            row.classList.toggle("read", tick.checked);
            syncCounts(); syncSection();
          });
          if (n) setTabbable(row, false); else row.classList.add("tab");
          outline.appendChild(row);
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
    // Whose review Save writes, always in view.
    // The client, site and round give way to a narrow header; the name never does.
    var who = state.review && state.review.reviewer ? "as " + state.review.reviewer : "";
    var ps = $("pack-summary");
    ps.innerHTML = "";
    if (e) {
      ps.appendChild(h("span", { class: "what", text: [e.client, e.site, "round " + state.pack.round].filter(Boolean).join(" · ") + (who ? " ·" : "") }));
      if (who) ps.appendChild(h("span", { class: "who", id: "pack-who", text: who }));
    }
    ps.title = e ? [e.client, e.site, "round " + state.pack.round, who].filter(Boolean).join(" · ") : "";
    updateSaveButton();
  }
  function restoreBar() {
    var snap = state.restore;
    if (!snap) return null;
    var when = fmtDate(snap.savedOn) + " " + (function () { var d = new Date(snap.savedOn); return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); })();
    var other = !snap.overFile && snap.someoneElse;
    var text = snap.overFile
      ? "Unsaved work from " + when + " is not in the review file you opened. Restore adds it to the file."
      : other ? "Unsaved work by " + other + " on this pack, from " + when + "."
      : "Unsaved work on this pack from " + when + "." + (hasWork(state.review) ? " Restore adds it to what you have done since." : "");
    function restore() {
      state.review = withOffered();
      state.restore = null;
      touched(); render();
      toast("Unsaved work restored. Save to keep it.");
    }
    return h("div", { class: "rr-banner autosave-bar", id: "rr-restore" }, [
      h("span", { class: "t", text: text }),
      h("button", { type: "button", class: "btn sm primary", id: "rr-restore-yes", text: "Restore", onClick: function () {
        if (!other) { restore(); return; }
        // Someone else's: never taken on as yours without asking.
        whose(other, "work", function (choice) {
          if (!choice || state.restore !== snap) return;
          if (choice === "theirs") {
            var me = reviewerName();
            lsSet(KEY_REVIEWER, other);
            // What you added since goes with the work, under its name.
            state.review.comments.forEach(function (c) { if (!c.reviewer || (me && sameName(c.reviewer, me))) c.reviewer = other; });
            state.review.reviewer = other;
            restore();
            state.openedFrom = { reviewer: other, ids: snap.review.comments.map(function (c) { return c.id; }) };
            return;
          }
          showColleague(snap.review, "");
          state.restore = null;
          render();
          toast(other + "'s unsaved work is shown read only. It is replaced once you change anything here.");
        });
      } }),
      h("button", { type: "button", class: "btn sm", id: "rr-restore-no", text: "Discard", onClick: function () {
        clearAutosave(); state.restore = null;
        if (state.dirty) writeAutosave();   // what was done since is still unsaved
        render();
      } })
    ]);
  }
  function pendingBar() {
    var pr = state.pendingReview;
    if (!pr || (state.pack && !state.demo)) return null;
    var seen = seenOf(pr.file.packId), B = HB();
    var packName = seen && seen.packName;
    return h("div", { class: "rr-banner", id: "rr-pending" }, [
      h("span", { class: "t", text: "Open the review pack" + (packName ? " " + packName : "") + " to carry on with your review file " + (pr.name || "") + " (round " + (pr.file.round || 1) + (pr.file.reviewer ? ", " + pr.file.reviewer : "") + ")." }),
      h("button", { type: "button", class: "btn sm primary", id: "rr-pending-open", text: "Open the pack", onClick: function () {
        if (B && packName) B.openRecent({ name: packName, label: "" }); else chooseFiles();
      } })
    ]);
  }
  function savedHintBar() {
    var s = state.savedHint;
    if (!s || !state.pack || state.demo) return null;
    var B = HB();
    return h("div", { class: "rr-banner", id: "rr-saved-hint" }, [
      h("span", { class: "t", text: "You have a review file for this pack: " + s.reviewName + (s.savedAt ? ", saved " + fmtDate(s.savedAt) : "") + "." }),
      h("button", { type: "button", class: "btn sm primary", id: "rr-saved-open", text: "Open it", onClick: function () {
        if (B) B.openRecent({ name: s.reviewName, label: (state.pack.engagement || {}).client || "" }); else chooseFiles();
      } }),
      h("button", { type: "button", class: "btn sm", id: "rr-saved-no", text: "Start a new one", onClick: function () { state.savedHint = null; render(true); } })
    ]);
  }
  function colleagueBar() {
    var c = state.colleague;
    if (!c) return null;
    return h("div", { class: "rr-banner", id: "rr-colleague" }, [
      h("span", { class: "t", text: c.reviewer + "'s comments" + (c.name ? " from " + c.name : "") + " are shown read only. Their file is not changed." }),
      h("button", { type: "button", class: "btn sm", id: "rr-colleague-hide", text: "Hide them", onClick: function () { state.colleague = null; render(true); } })
    ]);
  }
  // ---------- keeping the keyboard's place ----------
  // A draw replaces the elements it draws, and the one with the keyboard
  // may be among them. focusKey says where an element is in words that
  // outlast it (the comment, question, item or block it belongs to, and
  // which control of it); focusBack finds the element now in that place.
  var FOCUS_SCOPES = ["data-reply-id", "data-comment-id", "data-prev-id", "data-check-id", "data-sum-comment", "data-q", "data-verdict", "data-item-id", "data-block-id"];
  var FOCUS_SAYS = ["data-answer", "data-severity", "data-filter", "data-go", "data-page", "data-read-block", "data-section-block", "data-cell", "name", "type"];
  var FOCUS_NOT = { on: 1, active: 1, cur: 1, flash: 1, open: 1, picked: 1, read: 1, tab: 1, prev: 1, "has-comment": 1, "has-must": 1, primary: 1 };
  function attrSel(el, name) { return "[" + name + '="' + cssEsc(el.getAttribute(name)) + '"]'; }
  function focusKey(el) {
    el = el || document.activeElement;
    if (!el || el === document.body || !el.closest || !el.getAttribute) return null;
    var root = el.closest("#main") ? "#main" : el.closest("#sidebar") ? "#sidebar" : null;
    if (!root) return null;
    if (el.id) return { sel: "#" + cssEsc(el.id), n: 0 };
    var scope = null, scopeSel = "";
    for (var n = el; n && n.getAttribute && !scope; n = n.parentNode) {
      if (n.id === "main" || n.id === "sidebar") break;
      for (var k = 0; k < FOCUS_SCOPES.length; k++) if (n.hasAttribute(FOCUS_SCOPES[k])) {
        scope = n;
        scopeSel = attrSel(n, FOCUS_SCOPES[k]) + (FOCUS_SCOPES[k] === "data-item-id" && n.hasAttribute("data-target") ? attrSel(n, "data-target") : "");
        break;
      }
    }
    if (scope === el) return { sel: root + " " + scopeSel, n: 0 };
    var says = el.nodeName.toLowerCase();
    Array.prototype.forEach.call(el.classList || [], function (c) { if (!FOCUS_NOT[c]) says += "." + cssEsc(c); });
    FOCUS_SAYS.forEach(function (a) { if (el.hasAttribute(a)) says += attrSel(el, a); });
    var sel = root + " " + (scopeSel ? scopeSel + " " : "") + says, at = 0;
    try { at = Math.max(0, Array.prototype.indexOf.call(document.querySelectorAll(sel), el)); } catch (e) { return null; }
    return { sel: sel, n: at };
  }
  function focusBack(key) {
    if (!key) return false;
    var list;
    try { list = document.querySelectorAll(key.sel); } catch (e) { return false; }
    return focusOn(list[key.n] || list[0]);
  }
  function focusLost() { var a = document.activeElement; return !a || a === document.body || !a.isConnected; }
  // The page's heading, which takes the keyboard when the control that had it
  // has gone and nothing else is the obvious next place.
  function pageTitle() {
    var t = document.querySelector("#main .page-title");
    if (t) t.setAttribute("tabindex", "-1");
    return t;
  }

  // A comment still being written that this page does not show: say where.
  function syncDraftBar() {
    var main = $("main"), old = $("rr-draft");
    var need = !!state.pack && composerHasDraft() && !main.querySelector(".rr-composer");
    if (!need) { if (old) old.parentNode.removeChild(old); return; }
    var bar = h("div", { class: "rr-banner", id: "rr-draft" }, [
      h("span", { class: "t", text: "You have an unfinished comment on " + draftWhere() + ". It is not in your review until you add it." }),
      h("button", { type: "button", class: "btn sm primary", id: "rr-draft-go", text: "Go to it", onClick: goToDraft }),
      h("button", { type: "button", class: "btn sm", id: "rr-draft-drop", text: "Discard it", onClick: function () { state.composer = null; render(true); } })
    ]);
    if (old) { old.parentNode.replaceChild(bar, old); return; }
    var first = main.querySelector(".page-title");
    main.insertBefore(bar, first || main.firstChild);
  }

  // Draws again only what a change to a comment touched. On the Report page
  // that is the comments beside the blocks named; on Engagement the item
  // cards named, or the basis card. The report's own text, the other cards,
  // the scroll position and any selection are left as they are. anchors: the
  // places of the comments (or the composer) that changed; prevIds: earlier
  // rounds' comments whose own node changed (confirmed, replied to, raised
  // again). The counts around the page are brought up to date too. On any
  // other page, or if the page is not as it was drawn, the page is drawn.
  function redraw(anchors, prevIds) {
    var key = focusKey(), todo = [], i;
    cix = null;
    anchors = (anchors || []).filter(Boolean);
    var prevs = (prevIds || []).filter(Boolean).map(function (id) { return prevComments().filter(function (p) { return p.comment.id === id; })[0]; }).filter(Boolean);
    if (repLive()) {
      var seen = mapOf();
      var add = function (id) { var en = rep.at[id]; if (en && !seen[id]) { seen[id] = true; todo.push(en); } };
      anchors.forEach(function (a) { if (a.kind === "block" && (a.documentIndex || 0) === rep.d && a.blockId) add(a.blockId); });
      prevs.forEach(function (p) {
        var a = p.comment.anchor, loc = a.kind === "block" && docOf(a) === rep.d ? placeOf(p) : null;
        if (loc) add(loc.block.id);
      });
      todo.forEach(refreshBlock);
    } else if (engLive() && state.itemFilter !== "commented") {
      var basis = false;
      anchors.concat(prevs.map(function (p) { return p.comment.anchor; })).forEach(function (a) {
        if (a.kind === "item") { var it = findItemFor(a); if (it && todo.indexOf(it) === -1) todo.push(it); }
        else if (a.kind === "general" && a.sectionTitle === "Basis of assessment") basis = true;
      });
      for (i = 0; i < todo.length; i++) refreshItem(todo[i]);
      if (basis) refreshBasis();
    } else { render(true); return; }
    syncCounts();
    syncDraftBar();
    if (focusLost()) focusBack(key);
  }

  function render(keepScroll) {
    var main = $("main");
    var top = main.scrollTop;
    // Where the keyboard is, to put it back once the page is drawn.
    var key = focusKey(), inMain = main.contains(document.activeElement);
    cix = null;
    renderNav(); renderHeader();
    main.innerHTML = "";
    if (state.demo) {
      main.appendChild(h("div", { class: "rr-banner", id: "rr-demo-note" }, [h("span", { class: "t", text: "This is a demo pack." })]));
    }
    [restoreBar(), pendingBar(), savedHintBar(), colleagueBar()].forEach(function (bar) { if (bar) main.appendChild(bar); });
    var page = state.page;
    if (!state.pack && page !== "about") page = "welcome";
    var fn = { welcome: renderWelcome, report: renderReport, engagement: renderEngagement, checklist: renderChecklist, checks: renderChecks, previous: renderPrevious, summary: renderSummary, about: renderAbout }[page] || renderWelcome;
    fn(main);
    syncDraftBar();
    if (state.jump) flushJump();
    else main.scrollTop = keepScroll === false ? 0 : top;
    syncSection();
    // The control that was in use, as it is now; if it has gone, the page's
    // heading, so the keyboard is never left nowhere.
    if (focusLost() && !focusBack(key) && inMain) focusOn(pageTitle());
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
  // The outline, and the narrow window's Go to section list and Read tick,
  // follow the section in view.
  var tickTimer = null;
  $("main").addEventListener("scroll", function () { clearTimeout(tickTimer); tickTimer = setTimeout(syncSection, 80); });
  // The sidebar's pages are role=button: Enter and Space press them. One
  // listener on the sidebar, which keeps it through every redraw. In the
  // outline, Up and Down (and Home and End) move between sections, staying on
  // the tick or on the link.
  $("sidebar").addEventListener("keydown", function (e) {
    var row = e.target && e.target.closest && e.target.closest(".rr-outline-row"), k = e.key;
    if (row && !e.altKey && !e.ctrlKey && !e.metaKey && (k === "ArrowDown" || k === "ArrowUp" || k === "Home" || k === "End")) {
      var rows = row.parentNode.querySelectorAll(".rr-outline-row"), at = Array.prototype.indexOf.call(rows, row);
      var to = rows[k === "ArrowDown" ? at + 1 : k === "ArrowUp" ? at - 1 : k === "Home" ? 0 : rows.length - 1];
      e.preventDefault();
      if (to) { outlineRow(to); to.querySelector(e.target.classList.contains("rr-read") ? ".rr-read" : ".rr-outline-item").focus(); }
      return;
    }
    if (k !== "Enter" && k !== " ") return;
    var t = e.target && e.target.closest && e.target.closest(".nav-item");
    if (t && e.target === t) { e.preventDefault(); t.click(); }
  });
  $("sidebar").addEventListener("focusin", function (e) {
    var row = e.target && e.target.closest && e.target.closest(".rr-outline-row");
    if (row) outlineRow(row);
  });
  // In the page: an item's card takes the Tab order when the keyboard or the
  // mouse lands in it; Up and Down move between items; Left and Right move
  // between the buttons of a group (severities, answers, filters).
  $("main").addEventListener("focusin", function (e) {
    var c = engLive() && e.target && e.target.closest && e.target.closest(".rr-item");
    if (c && c.rrItem) setCurrentItem(c.rrItem);
  });
  $("main").addEventListener("keydown", function (e) {
    var t = e.target, k = e.key;
    if (!t || !t.closest || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((k === "ArrowLeft" || k === "ArrowRight") && t.nodeName === "BUTTON" && t.parentNode.classList.contains("rr-seg")) {
      var to = k === "ArrowLeft" ? t.previousElementSibling : t.nextElementSibling;
      e.preventDefault();
      if (to) to.focus();
      return;
    }
    itemKey(e);
  });
  // Ctrl+Z takes back the last delete while its Undo is on offer, unless the
  // keyboard is in a box of text, where it undoes typing as usual.
  document.addEventListener("keydown", function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || String(e.key).toLowerCase() !== "z" || !toastUndo) return;
    var t = e.target, tag = t && t.nodeName;
    if (tag === "TEXTAREA" || tag === "SELECT" || (tag === "INPUT" && !/^(checkbox|radio|button)$/.test(t.type)) || (t && t.isContentEditable)) return;
    e.preventDefault();
    toastUndo();
  });
  // Ctrl+F on the Report page goes to the page's own find, which the exe
  // (with no find bar) relies on. Elsewhere the browser's own find is left.
  document.addEventListener("keydown", function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey || String(e.key).toLowerCase() !== "f") return;
    var box = state.pack && state.page === "report" && $("rr-report-find");
    if (!box) return;
    e.preventDefault();
    box.focus(); box.select();
  });
  window.addEventListener("beforeunload", function (e) {
    clearTimeout(autosaveTimer);
    // A comment or a reply still being written is in no file and no autosave.
    if ((state.dirty || composerHasDraft() || replyHasDraft()) && !state.demo) { writeAutosave(); e.preventDefault(); e.returnValue = ""; return ""; }
  });
  if (A.HostBridge && A.HostBridge.hosted) {
    A.HostBridge.register({
      loadButton: "btn-load",
      applyTheme: applyTheme,
      openFile: function (file, handle) { loadFiles([file], handle ? [handle] : null); },
      // The suite is closing this tool and the reviewer chose to lose the
      // unsaved work: its autosave copy goes, so the tool does not offer it
      // when it is opened again. Earlier work still on offer was never
      // answered, so it stays offered, as it was before this session.
      discardUnsaved: function () {
        clearTimeout(autosaveTimer);
        if (!state.demo && state.pack) {
          if (state.restore) lsSet(KEY_AUTOSAVE + state.pack.packId, JSON.stringify({ savedOn: state.restore.savedOn, review: state.restore.review }));
          else clearAutosave();
        }
        markClean();
      }
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
    locatePrev: locatePrev,
    KEY_AUTOSAVE: KEY_AUTOSAVE, KEY_REVIEWER: KEY_REVIEWER, KEY_NAMES: KEY_NAMES, KEY_SEEN: KEY_SEEN,
    mergeReviews: mergeReviews,
    writeAutosave: writeAutosave,
    composerHasDraft: composerHasDraft,
    KEY_READ: KEY_READ,
    hasWork: hasWork,
    syncSection: syncSection
  };
})();
