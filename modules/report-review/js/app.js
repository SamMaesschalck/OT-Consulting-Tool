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
    focusSearch: false   // put the caret back in the item search after a redraw
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
  // action (optional): { label, run } adds one button, such as Undo, and keeps
  // the message up longer so there is time to press it.
  var toastTimer = null;
  function toast(msg, kind, action) {
    var t = $("toast");
    t.textContent = msg;
    if (action) t.appendChild(h("button", { type: "button", class: "rr-toast-act", text: action.label, onClick: function () {
      clearTimeout(toastTimer); t.className = "toast hidden"; action.run();
    } }));
    t.className = "toast" + (kind ? " " + kind : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = "toast hidden"; }, action ? 8000 : 4200);
  }
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
    b.title = "Save your review file (Shift+click: Save as)" + (state.lastSave ? ". Last saved to " + state.lastSave.name + " at " + fmtTime(state.lastSave.at) + "." : "");
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
  // is a file the reviewer already has. Only unsaved work is written, never the
  // demo's. While earlier work is still on offer (state.restore) the stored copy
  // holds both, so a crash before the reviewer answers loses neither.
  function writeAutosave() {
    if (state.demo || !state.review || !state.pack || !state.dirty) return;
    var r = state.restore ? withOffered() : state.review;
    if (!lsSet(KEY_AUTOSAVE + state.pack.packId, JSON.stringify({ savedOn: new Date().toISOString(), review: r })) && !autosaveBroken) {
      autosaveBroken = true;
      toast("Autosave is not available here (browser storage blocked or full). Save to a file regularly.", "err");
    }
  }
  function clearAutosave() { if (!state.demo && state.pack) lsDel(KEY_AUTOSAVE + state.pack.packId); }
  function readAutosave(packId) {
    var raw = lsGet(KEY_AUTOSAVE + packId), snap = raw ? RC.parseJson(raw) : null;
    if (!snap || !snap.review || snap.review.packId !== packId || !hasWork(snap.review)) return null;
    normaliseReview(snap.review);
    return { savedOn: snap.savedOn || "", review: snap.review };
  }
  function hasWork(r) {
    return !!(r && ((r.comments && r.comments.length) || (r.verdict && r.verdict.value !== "none") ||
      (r.checklist && r.checklist.some(function (c) { return c.answer || c.note; })) || (r.confirmations && r.confirmations.length)));
  }
  function normaliseReview(r) {
    ["checklist", "dismissedChecks", "confirmations", "comments"].forEach(function (k) { if (!Array.isArray(r[k])) r[k] = []; });
    // An answer or confirmation that is not an object says nothing: drop it.
    ["checklist", "confirmations"].forEach(function (k) { r[k] = r[k].filter(function (x) { return x && typeof x === "object"; }); });
    if (!r.verdict || typeof r.verdict !== "object") r.verdict = { value: "none", date: "", note: "" };
    if (!r.verdict.value) r.verdict.value = "none";
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
    return JSON.stringify([r.comments, r.checklist.filter(function (c) { return c.answer || c.note; }), r.verdict, r.confirmations, r.dismissedChecks]);
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
  function modal(label, build, onCancel) {
    var back = null;
    function onKey(e) { if (e.key === "Escape") { e.preventDefault(); m.cancel(); } }
    var m = {
      close: function () { if (back && back.parentNode) back.parentNode.removeChild(back); document.removeEventListener("keydown", onKey, true); },
      cancel: function () { m.close(); if (onCancel) onCancel(); }
    };
    back = h("div", { class: "rr-modal-back" }, [h("div", { class: "rr-modal", role: "dialog", "aria-modal": "true", "aria-label": label }, build(m))]);
    back.addEventListener("click", function (e) { if (e.target === back) m.cancel(); });
    document.addEventListener("keydown", onKey, true);
    document.body.appendChild(back);
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
        h("div", { text: "It goes on your comments and on your review file, so the author knows who said what. This browser remembers it." }),
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
        h("p", { text: "Choose this only if they are yours under another spelling. If " + old + " is someone else, leave them as they are." }),
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
    state.openedFrom = null;
    state.undoOpen = null;
    state.demo = !!isDemo;
    state.pack = pack;
    state.review = newReview(pack);
    state.page = "report";
    state.docIndex = 0;
    state.composer = null;
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
        h("p", { text: (me ? "This browser knows you as " + me + "." : "This browser does not know your name yet.") + " If you carry on as " + theirs + ", what you add goes out under that name" + (isFile ? " and Save writes into their file." : ".") }),
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
    fileQuestion = modal("Unsaved comments", function (m) {
      function pick(v) { return function () { fileQuestion = null; m.close(); cb(v); }; }
      return [
        h("h2", { text: "You have unsaved comments on this pack" }),
        h("p", { text: "They can be added to the review file you are opening" + (name ? " (" + name + ")" : "") + ", so nothing is lost." }),
        h("div", { class: "rr-modal-choices" }, [
          h("button", { type: "button", class: "btn primary", id: "rr-merge-yes", text: "Add them to the review file", onClick: pick(true) }),
          h("button", { type: "button", class: "btn", id: "rr-merge-no", text: "Leave everything as it is", onClick: m.cancel })
        ])
      ];
    }, function () { fileQuestion = null; cb(false); });
  }
  function showColleague(file, name) {
    state.colleague = { reviewer: RC.norm(file.reviewer), round: file.round, name: name || "", fileId: file.fileId,
      comments: file.comments.filter(function (c) { return c && c.anchor; }), verdict: file.verdict };
  }
  function colleagueOnBlock(id, d) {
    return state.colleague ? state.colleague.comments.filter(function (c) { return c.anchor.kind === "block" && c.anchor.documentIndex === d && c.anchor.blockId === id; }) : [];
  }
  function colleagueOnItem(i) {
    return state.colleague ? state.colleague.comments.filter(function (c) { return c.anchor.kind === "item" && onItem(c.anchor, i); }) : [];
  }

  // What a file is, with messages for the mistakes people make: the Word
  // report dropped instead of the pack, or a pack or file that is incomplete.
  function textOrNone(v) { return v == null || typeof v === "string"; }
  function identifyFile(text) {
    var t = String(text || "");
    if (/^PK/.test(t)) return { ok: false, error: "This is a Word or Excel file. Open the review pack (.json) the author sent, not the report itself." };
    if (/^%PDF/.test(t)) return { ok: false, error: "This is a PDF. Open the review pack (.json) the author sent, not the report itself." };
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
    packs.forEach(function (p) {
      if (state.dirty && hasWork(state.review) && !confirm("Open this pack? Your unsaved review of the open pack will be left behind. Save it first if you want to keep it.")) return;
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
    });
    (function next(i) {
      if (i >= files.length) { if (opened) finish(); return; }
      var p = files[i];
      openReviewFile(p.id.data, p.handle, p.name, function (res) {
        if (res && !p.held) noteRecent("open", p.name, p.handle, "Review file");
        if (res) { opened++; outcomes.push(res); } else failed = true;
        next(i + 1);
      });
    })(0);
    function finish() {
      if (!show()) return;
      var last = outcomes[outcomes.length - 1], r = state.review, msg;
      if (failed && last === "pack") return;   // the file's own message stands
      if (last === "pending") {
        var pr = state.pendingReview, seen = seenOf(pr.file.packId);
        msg = "Your review file is ready. Now open the review pack it answers" + (seen && seen.packName ? ": " + seen.packName : " (round " + (pr.file.round || 1) + ")") + ".";
      } else if (last === "colleague") {
        msg = state.colleague.reviewer + "'s comments are shown read only. Your own comments, and Save, stay in your own review file.";
      } else if (last === "opened") {
        msg = state.restore ? "Your review file is open. Unsaved work that is not in it was also found: Restore or Discard it at the top of the page."
          : state.carried ? "Your review file is open, with your unsaved work added to it. Save to keep it."
          : "Your review is open (round " + (r.round || state.pack.round) + (r.reviewer ? ", as " + r.reviewer : "") + ").";
      } else {
        msg = "Review pack opened: round " + state.pack.round + "." + (realInTour ? " This is the tour's window. Use the Report Review Tool itself for real work." : "");
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
          toast("That review file is damaged and was not opened. Your work is as it was.", "err");
          return false;
        } catch (e2) {}
      }
      state.pack = null; state.review = null; state.restore = null; state.savedHint = null; state.colleague = null;
      state.page = "welcome"; state.composer = null;
      markClean(); render();
      toast("That pack could not be shown: it is damaged or incomplete. Ask the author to send it again.", "err");
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
      var DEMO_SAVED = " This is the demo review, so there is no author to send it to.";
      // A comment still being written is not in the file: say so, never block.
      var DRAFT = composerHasDraft() ? " The comment you are still writing is not in it: add it, then save again." : "";
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
        render();
        onDone({ ok: true, method: method, name: shown, text: text });
      }
      function download(blocked) {
        RC.downloadText(text, name);
        toast(state.demo ? "Saved (downloaded as " + name + ")." + DEMO_SAVED
          : blocked ? "Review file saved (downloaded as " + name + "). Saving back into the same file is not available here, so each save downloads a new copy."
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
            toast("Saved to " + handle.name + "." + (state.demo ? DEMO_SAVED : " Send this file to the author by shared folder or email."));
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
  function commentsOnBlock(id, doc) {
    return comments().filter(function (c) { return c.anchor.kind === "block" && c.anchor.documentIndex === doc && c.anchor.blockId === id; });
  }
  function commentsOnItem(i) {
    return comments().filter(function (c) { return c.anchor.kind === "item" && onItem(c.anchor, i); });
  }
  function severityLabel(id) { return (RC.SEVERITIES.filter(function (s) { return s.id === id; })[0] || { label: id }).label; }
  function prevComments() { return (state.pack.previousRound && state.pack.previousRound.comments) || []; }

  function isConfirmed(id) { return state.review.confirmations.some(function (c) { return c.commentId === id; }); }

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
      (a.targetName || "") === (b.targetName || "") && (a.itemId || "") === (b.itemId || "") && (a.sectionTitle || "") === (b.sectionTitle || "");
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
    var t = el.querySelector("textarea");
    if (t) { try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } }
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
      state.composer = c;
      render();
      setTimeout(function () {
        var t = document.querySelector(".rr-composer textarea");
        if (t) { try { t.focus({ preventScroll: true }); } catch (e) { t.focus(); } }
      }, 0);
    });
  }
  // Closing the composer puts the keyboard back where it was opened from.
  function closeComposer() {
    var a = state.composer && state.composer.anchor;
    state.composer = null;
    render();
    if (!a) return;
    var el = null;
    if (a.kind === "block" && state.page === "report") el = document.querySelector('[data-block-id="' + a.blockId + '"]');
    else if (a.kind === "item" && state.page === "engagement") {
      el = Array.prototype.filter.call(document.querySelectorAll(".rr-item"), function (n) { return n.getAttribute("data-item-id") === a.itemId && n.getAttribute("data-target") === a.targetName; })[0];
      el = el && el.querySelector(".rr-item-comment");
    } else if (a.kind === "general" && state.page === "engagement") el = document.querySelector(".rr-basis-comment");
    if (el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
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
        closeComposer();
      } }),
      h("button", { type: "button", class: "btn sm rr-c-cancel", text: "Cancel", onClick: closeComposer })
    ]));
    return h("div", { class: "rr-side rr-composer", onClick: function (e) { e.stopPropagation(); } }, kids);
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
    function del() {
      var list = comments(), idx = list.indexOf(c), review = state.review;
      review.comments = list.filter(function (x) { return x !== c; });
      if (state.composer && state.composer.editing === c.id) state.composer = null;
      touched(); render();
      toast("Comment deleted.", null, { label: "Undo", run: function () {
        if (state.review !== review || comments().indexOf(c) !== -1) return;
        review.comments.splice(Math.min(idx, review.comments.length), 0, c);
        touched(); render(); toast("Comment restored.");
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
  var prevCache = { pack: null, at: {}, byDoc: {} };
  function prevMemo() {
    if (prevCache.pack !== state.pack) prevCache = { pack: state.pack, at: {}, byDoc: {} };
    return prevCache;
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
    // Several blocks with the same words: the one with the old id, then one in
    // the same section, then the first.
    function pick() {
      return found.filter(function (x) { return x.block.id === a.blockId; })[0] ||
        found.filter(function (x) { return x.block.sectionKey === a.sectionKey; })[0] || found[0] || null;
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
      blocks.forEach(function (x) {
        if (x.type !== "table" || !q) return;
        if (RC.norm(cellText(x, a.cell)) === q) { found.push({ block: x, cell: { row: a.cell.row, col: a.cell.col }, how: "same" }); return; }
        for (var r = 0; r < x.rows.length; r++) for (var c = 0; c < x.rows[r].cells.length; c++) {
          if (RC.norm(x.rows[r].cells[c].text) === q) { found.push({ block: x, cell: { row: r, col: c }, how: "same" }); return; }
        }
      });
      if (found.length) return pick();
      // A cell of a word or two is too short to match by overlap.
      if (wordsOf(q).length >= 3) blocks.forEach(function (x) {
        if (x.type !== "table" || x.sectionKey !== a.sectionKey) return;
        x.rows.forEach(function (row, r) { row.cells.forEach(function (cell, c) { nearer(x, { row: r, col: c }, cell.text || ""); }); });
      });
      if (best) return best;
    } else if (q) {
      blocks.forEach(function (x) { if (x.type !== "image" && RC.norm(x.text) === q) found.push({ block: x, how: "same" }); });
      if (found.length) return pick();
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
      var map = {};
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
    return !!loc && loc.how !== "same" && !loc.placeOnly;
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
    return { anchor: blockAnchor(doc, di, b, loc.cell || null, quote), moved: loc.how === "near" ? "near" : false,
      canSuggest: b.type !== "image" && (b.type !== "table" || !!loc.cell) };
  }
  function raiseAgain(p) {
    var c = p.comment, r = raiseAnchor(c.anchor);
    var why = { near: "The text has changed since round " + p.round + ", so this goes on it as it reads now.",
      section: "The text has changed since round " + p.round + ", so this goes on its section heading.",
      gone: "That text is no longer in the report, so this keeps only the section it was in." }[r.moved] || "";
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
        p.confirmedBy && p.confirmedBy.length ? h("span", { class: "rr-chip met", text: "Confirmed by " + p.confirmedBy.join(", ") }) : null,
        confirmed ? h("span", { class: "rr-chip met", text: wont ? "You accepted the reason" : "You confirmed this fix" }) : null,
        raised ? h("span", { class: "rr-chip", text: "You raised this again" }) : null
      ]),
      where ? h("div", { class: "small muted rr-prev-where", text: where }) : null,
      a.quote ? h("div", { class: "quote small" }, [changed ? h("span", { class: "rr-lbl", text: "Was: " }) : a.cell ? h("span", { class: "rr-lbl", text: "On a cell: " }) : null, cut(a.quote, 240)]) : null,
      now != null ? h("div", { class: "rr-now small" }, [h("span", { class: "rr-lbl", text: "Now reads: " })].concat(wordDiff(a.quote, now))) : null,
      changed && loc && loc.how === "section" ? h("div", { class: "small muted", text: inline ? "No close match for it now, so it is shown on its section heading." : "No close match for it now. Go to takes you to its section." }) : null,
      gone && !inline ? h("div", { class: "small rr-gone", text: a.kind === "item" ? "This item is no longer in the engagement." : "This is no longer in the report." }) : null,
      h("div", { class: "text", text: c.text }),
      c.suggestion ? h("div", { class: "sug" }, [h("div", { class: "small muted", text: "Suggested wording" }), c.suggestion]) : null,
      wont && p.reason ? h("div", { class: "small", text: "Won't change: " + p.reason }) : null,
      (p.replies || []).length ? h("div", { class: "rr-replies" }, p.replies.map(function (r) {
        return h("div", { class: "small" }, [h("strong", { text: r.author }), " " + r.text]);
      })) : null,
      h("div", { class: "rr-actions" }, [
        !inline && !gone && a.kind !== "general" ? h("button", { type: "button", class: "rr-linkbtn rr-prev-go", text: "Go to", onClick: function () { goToPrev(p); } }) : null,
        canConfirm ? h("button", { type: "button", class: "rr-linkbtn rr-confirm", text: confirmed ? (wont ? "Take back" : "Take back the confirmation") : (wont ? "Accept the reason" : "Confirm it is fixed"), onClick: function () {
          if (confirmed) state.review.confirmations = state.review.confirmations.filter(function (x) { return x.commentId !== c.id; });
          else state.review.confirmations.push({ commentId: c.id, at: new Date().toISOString() });
          touched(); render();
        } }) : null,
        confirmed ? null : h("button", { type: "button", class: "rr-linkbtn rr-raise", text: "Raise it again", onClick: function () { raiseAgain(p); } })
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
  function imageNode(b, media) {
    var src = media && media[b.media];
    if (!src) return h("p", { class: "muted small", text: "[image: " + b.media + "]" });
    return h("img", { src: src, alt: "Chart or picture from the report", style: b.width ? "width:" + Math.min(b.width, 800) + "px" : null });
  }
  function tableNode(t, media, onCell, pickedCell, prevCells) {
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
        if ((prevCells || []).some(function (x) { return x.row === r && x.col === c; })) td.classList.add("prev");
        cell.blocks.forEach(function (p) {
          if (p.type === "table") td.appendChild(tableNode(p, media, null, null));
          else if (p.type === "image") td.appendChild(imageNode(p, media));
          else if (p.type === "bullet") td.appendChild(runsNode({ runs: [{ t: "• " }].concat(p.runs || []) }));
          else td.appendChild(runsNode(p));
        });
        if (onCell) {
          td.setAttribute("tabindex", "0");
          td.addEventListener("click", function (e) { e.stopPropagation(); onCell(r, c, cell); });
          td.addEventListener("keydown", function (e) {
            if ((e.key === "Enter" || e.key === " ") && e.target === td) { e.preventDefault(); e.stopPropagation(); onCell(r, c, cell); }
          });
        }
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
    return a;
  }

  function blockNode(doc, d, b) {
    var mine = commentsOnBlock(b.id, d);
    var open = state.composer && state.composer.anchor.kind === "block" && state.composer.anchor.documentIndex === d && state.composer.anchor.blockId === b.id;
    var cls = "rr-block" + (mine.length ? " has-comment" : "") + (mine.some(function (c) { return c.severity === "must-fix"; }) ? " has-must" : "") + (open ? " open" : "");
    // The block's own words name it for a screen reader; the hint says what a
    // press does.
    var wrap = h("div", { class: cls, "data-block-id": b.id, "data-section-key": b.sectionKey || "", tabindex: "0", role: "button", "aria-describedby": "rr-block-hint",
      "aria-label": b.type === "image" ? "Chart or picture" : null });
    function startOnBlock(quote, cell, canSuggest) {
      var cur = state.composer;
      // An edit, or a point raised again, stays on its own block; elsewhere a
      // click is refused only while there is something in it to lose.
      if (cur && (cur.editing || cur.relatesTo)) { if (open || holdDraft()) return; cur = null; }
      else if (cur && !open && holdDraft()) return;
      // Text selected with the mouse says which words the comment is about. The
      // quote stays the whole block, which is what a later round matches on.
      var picked = "";
      try { picked = RC.norm(String(window.getSelection && window.getSelection())); } catch (e) {}
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
    if (b.type === "heading") {
      var lv = Math.min(4, Math.max(1, b.level || 1));
      wrap.appendChild(runsNode(b, "h" + lv));
      wrap.addEventListener("click", function () { startOnBlock(b.text, null, true); });
    } else if (b.type === "table") {
      var picked = open ? state.composer.anchor.cell : null;
      // Cells an earlier round commented on, where their text is now.
      var prevCells = (prevAt(d)[b.id] || []).map(function (p) { var l = placeOf(p); return l && l.cell; }).filter(Boolean);
      wrap.appendChild(tableNode(b, doc.media, function (r, c, cell) {
        startOnBlock(cell.text, { row: r, col: c }, true);
      }, picked, prevCells));
      wrap.addEventListener("click", function () { startOnBlock(b.text, null, false); });
    } else if (b.type === "image") {
      wrap.classList.add("rr-img");
      wrap.appendChild(imageNode(b, doc.media));
      wrap.addEventListener("click", function () { startOnBlock("", null, false); });
    } else if (b.type === "bullet") {
      wrap.appendChild(h("div", { class: "rr-bullet" }, [h("span", { class: "m", text: b.marker || "•" }), runsNode(b)]));
      wrap.addEventListener("click", function () { startOnBlock(b.text, null, true); });
    } else {
      wrap.appendChild(runsNode(b));
      wrap.addEventListener("click", function () { startOnBlock(b.text, null, true); });
    }
    wrap.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target === wrap) { e.preventDefault(); wrap.click(); } });
    var frag = [wrap];
    var prevOn = prevAt(d)[b.id] || [];
    if (prevOn.length) frag.push(h("div", { class: "rr-side" }, prevOn.map(function (p) { return prevNode(p, true); })));
    var theirs = colleagueOnBlock(b.id, d);
    if (theirs.length) frag.push(h("div", { class: "rr-side" }, theirs.map(colleagueNode)));
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
    var tb = [], e = pack.engagement || {}, multi = pack.documents.length > 1;
    if (multi) {
      // A draft stays put when the document changes: it shows again on its own.
      tb.push(h("label", null, ["Document ", h("select", { id: "rr-doc", onChange: function (ev) { state.docIndex = Number(ev.target.value); if (!composerHasDraft()) state.composer = null; render(false); } },
        pack.documents.map(function (x, i) {
          var n = comments().filter(function (c) { return c.anchor.kind === "block" && (c.anchor.documentIndex || 0) === i; }).length;
          var o = h("option", { value: String(i), text: x.title + (x.targetName && x.title !== x.targetName ? " (" + x.targetName + ")" : "") + (n ? " (" + RC.plural(n, "comment") + ")" : "") });
          if (i === d) o.selected = true; return o;
        }))]));
    }
    // Go to a section: the outline's job where the sidebar has no room for it.
    var secs = sectionsOf(doc), counts = countsBySection(doc, d);
    if (secs.length) {
      tb.push(h("select", { class: "rr-jump", id: "rr-jump", "aria-label": "Go to section", onChange: function (ev) {
        var id = ev.target.value;
        ev.target.value = "";
        if (id) scrollToSection(id);
      } }, [h("option", { value: "", text: "Go to section" })].concat(secs.map(function (s) {
        return h("option", { value: s.id, text: (s.level > 1 ? "  " : "") + s.title + (counts[s.id] ? " (" + counts[s.id] + ")" : "") + (isRead(d, s.id) ? " ✓" : "") });
      }))));
      // Nor are the outline's ticks: this one marks the section at the top of
      // the report read (syncReadTick keeps it in step as you scroll).
      var tick = h("input", { type: "checkbox", id: "rr-mark-read" });
      tick.addEventListener("change", function () {
        var s = sectionInView();
        if (!s) return;
        setRead(d, s.id, tick.checked);
        var opt = $("rr-jump") && $("rr-jump").querySelector('option[value="' + s.id + '"]');
        if (opt) opt.textContent = opt.textContent.replace(/ ✓$/, "") + (tick.checked ? " ✓" : "");
      });
      tb.push(h("label", { class: "rr-markread", id: "rr-markread" }, [tick, "Read"]));
    }
    tb.push(findBox());
    tb.push(h("span", { class: "muted", text: "Click any paragraph, heading or table to comment. Click a table cell to comment on that cell." }));
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
    main.appendChild(h("span", { class: "rr-sr", id: "rr-block-hint", text: "Press Enter to comment on it." }));
    var paper = h("div", { class: "rr-paper", id: "rr-paper" });
    var cover = null;
    (doc.blocks || []).forEach(function (b) {
      var nodes = blockNode(doc, d, b);
      if (b.front) {
        if (!cover) { cover = h("div", { class: "rr-cover" }); paper.appendChild(cover); }
        nodes.forEach(function (n) { cover.appendChild(n); });
      } else nodes.forEach(function (n) { paper.appendChild(n); });
    });
    main.appendChild(paper);
    applyFind(paper, false);
  }

  // A section's heading brought to the top of the report, below the toolbar
  // that stays in view (scrollIntoView alone puts it underneath).
  function toolbarBottom() {
    var tb = document.querySelector("#main .rr-toolbar"), main = $("main");
    return tb ? tb.getBoundingClientRect().bottom : main.getBoundingClientRect().top;
  }
  function scrollToSection(id) {
    var el = document.querySelector('#rr-paper [data-block-id="' + id + '"]'), main = $("main");
    if (!el || !el.scrollIntoView) return;
    el.scrollIntoView({ block: "start" });
    var gap = el.getBoundingClientRect().top - toolbarBottom() - 8;
    if (gap < 0) main.scrollTop += gap;
    syncReadTick();
  }
  // The section whose heading was passed last, reading down: the one in view.
  function sectionInView() {
    if (!state.pack || state.page !== "report") return null;
    var d = Math.min(state.docIndex, state.pack.documents.length - 1), secs = sectionsOf(state.pack.documents[d]);
    var line = toolbarBottom() + 40, cur = null;
    secs.forEach(function (s) {
      var el = document.querySelector('#rr-paper [data-block-id="' + s.id + '"]');
      if (el && (!cur || el.getBoundingClientRect().top <= line)) cur = s;
    });
    return cur;
  }
  function syncReadTick() {
    var tick = $("rr-mark-read");
    if (!tick || !tick.offsetParent) return;
    var s = sectionInView(), d = Math.min(state.docIndex, state.pack.documents.length - 1);
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
      h("button", { type: "button", class: "btn sm", id: "rr-find-prev", text: "Previous", title: "Previous match (Shift+Enter)", onClick: function () { stepFind(-1); } }),
      h("button", { type: "button", class: "btn sm", id: "rr-find-next", text: "Next", title: "Next match (Enter)", onClick: function () { stepFind(1); } }),
      h("span", { class: "small muted", id: "rr-find-count", "aria-live": "polite" })]);
  }
  function findMarks() { var p = $("rr-paper"); return p ? Array.prototype.slice.call(p.querySelectorAll("mark.rr-find")) : []; }
  function applyFind(paper, scroll) {
    if (!paper) return;
    findMarks().forEach(function (m) { var par = m.parentNode; par.replaceChild(document.createTextNode(m.textContent), m); par.normalize(); });
    var f = state.reportFind || { q: "", i: 0 }, q = RC.norm(f.q).toLowerCase(), count = $("rr-find-count");
    if (q.length < 2) { if (count) count.textContent = ""; return; }
    var walker = document.createTreeWalker(paper, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = walker.nextNode())) {
      // Report text only: not the comments, the composer or the buttons.
      if (n.parentNode.closest && n.parentNode.closest(".rr-side, .rr-composer, button, textarea, input, select")) continue;
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
    var marks = findMarks();
    if (!marks.length) { if (count) count.textContent = "Not found"; return; }
    f.i = ((f.i % marks.length) + marks.length) % marks.length;
    marks[f.i].classList.add("cur");
    if (count) count.textContent = (f.i + 1) + " of " + marks.length;
    if (scroll && marks[f.i].scrollIntoView) marks[f.i].scrollIntoView({ block: "center" });
  }
  function stepFind(by) {
    var f = state.reportFind, marks = findMarks();
    if (!f || !marks.length) return;
    marks[f.i] && marks[f.i].classList.remove("cur");
    f.i = (f.i + by + marks.length) % marks.length;
    marks[f.i].classList.add("cur");
    var count = $("rr-find-count");
    if (count) count.textContent = (f.i + 1) + " of " + marks.length;
    if (marks[f.i].scrollIntoView) marks[f.i].scrollIntoView({ block: "center" });
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
  function findItemFor(a) { return (state.pack.items || []).filter(function (i) { return onItem(a, i); })[0] || null; }
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
      (i.details || []).forEach(function (row) { if (Array.isArray(row)) words.push(row[1]); });
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
    field("evidence", i.status === "finding" || !(i.details && i.details.length));
    field("notes");
    if (i.status === "finding" || i.action || i.owner || i.impact) { field("action", true); field("owner", true); field("impact", true); }
    field("priority");
    (i.details || []).forEach(function (d) {
      if (Array.isArray(d) && d[0]) kv = kv.concat(row(String(d[0]), d[1] == null ? "" : String(d[1])));
    });
    return h("div", { class: "rr-item", "data-item-id": i.itemId, "data-target": i.targetName, "data-target-id": i.targetId || null }, [
      h("div", { class: "rr-item-h" }, [
        h("span", { class: "code", text: i.code }),
        h("span", { class: "ttl", text: i.title }),
        i.shared ? h("span", { class: "rr-chip", text: "Shared answer" }) : null,
        h("span", { class: "rr-chip " + i.status, text: STATUS_LABELS[i.status] || i.status }),
        h("button", { type: "button", class: "btn sm rr-item-comment", text: "Comment", onClick: function () {
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
  }
  function prevOnItem(i) {
    var list = prevComments().filter(function (p) { return p.comment.anchor.kind === "item" && onItem(p.comment.anchor, i); });
    return list.length ? h("div", { class: "rr-side" }, list.map(function (p) { return prevNode(p, true); })) : null;
  }

  function renderEngagement(main) {
    var pack = state.pack, all = pack.items || [], targets = targetsOf(pack);
    main.appendChild(h("h1", { class: "page-title", text: "Engagement" }));
    main.appendChild(h("p", { class: "page-sub", text: "The answers, evidence and plans behind the report, so you can challenge a finding as well as its wording." }));
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
    main.appendChild(h("p", { class: "small muted", id: "rr-item-count" }, ["Showing " + shown.length + " of " + all.length + " items. ",
      h("button", { type: "button", class: "rr-linkbtn", id: "rr-basis-link", text: "Go to the basis of assessment", onClick: function () {
        var el = $("rr-basis");
        if (el && el.scrollIntoView) el.scrollIntoView({ block: "start" });
      } })]));
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
    main.appendChild(basis);
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
  function renderChecklist(main) {
    main.appendChild(h("h1", { class: "page-title", text: "Checklist" }));
    main.appendChild(h("p", { class: "page-sub", text: "Your answers go in your review file. A no is worth a comment saying why." }));
    checklistItems().forEach(function (g) {
      main.appendChild(card(g.title, null, g.items.map(function (q) {
        var a = answerOf(q.id) || {};
        return h("div", { class: "rr-q", "data-q": q.id }, [
          h("div", { text: q.text }),
          h("div", { class: "rr-seg", role: "group", "aria-label": "Answer" }, [["yes", "Yes"], ["no", "No"], ["na", "N/A"]].map(function (o) {
            return h("button", { type: "button", class: o[0] + (a.answer === o[0] ? " on" : ""), "data-answer": o[0], "aria-pressed": a.answer === o[0] ? "true" : "false", text: o[1], onClick: function () {
              setAnswer(q, { answer: a.answer === o[0] ? "" : o[0] }); render(true);
            } });
          })),
          h("div", { class: "rr-note" }, [h("input", { type: "text", placeholder: "Note (optional)", "aria-label": "Note", value: a.note || "", onChange: function (e) { setAnswer(q, { note: e.target.value }); } })])
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
  // { check result id: what it said }, for each dismissed check, so the
  // author can read them with no check engine. One no longer found keeps the
  // words it was saved with.
  function dismissedTitles() {
    var r = state.review, had = r.dismissedCheckTitles || {}, out = {}, byId = {};
    currentChecks().forEach(function (x) { byId[x.id] = x; });
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
    main.appendChild(h("p", { class: "page-sub", text: "Possible problems found automatically in this pack. Look at each one in place, then make it a comment or dismiss it." }));
    var all = currentChecks(), active = all.filter(function (r) { return !isDismissed(r.id); }), gone = all.length - active.length;
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
      r.kind === "block" && (r.sectionTitle || docSuffix(r.documentIndex || 0)) ? h("div", { class: "small muted rr-check-where", text: r.sectionTitle ? "In " + r.sectionTitle + docSuffix(r.documentIndex || 0) : "In the " + state.pack.documents[r.documentIndex || 0].title }) : null,
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
      placeholder: "Names, separated by commas", "aria-label": "Other clients' names to look for", value: userNames().join(", ") });
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
    main.appendChild(h("p", { class: "page-sub", text: "Each earlier comment, with what the author did about it and how the text reads now. Look at each one in place, then confirm the fix, accept the author's reason, or raise it again." }));
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
      state.page = c.anchor.sectionTitle === "Basis of assessment" ? "engagement" : "summary";
      state.jump = { el: state.page === "engagement" ? "rr-basis" : null, comment: c.id };
      render();
      return;
    }
    jumpToBlock(c.anchor.documentIndex, c.anchor.blockId);
  }
  // How far through the previous round's comments the reviewer is: confirmed,
  // or raised again.
  function prevLookedAt() {
    var prev = prevComments();
    return prev.filter(function (p) { return isConfirmed(p.comment.id) || comments().some(function (c) { return c.relatesTo === p.comment.id; }); }).length;
  }
  function sectionsRead() {
    var n = 0, all = 0;
    state.pack.documents.forEach(function (doc, d) { sectionsOf(doc).forEach(function (s) { all++; if (isRead(d, s.id)) n++; }); });
    return { read: n, all: all };
  }
  function renderSummary(main) {
    var r = state.review, list = comments();
    main.appendChild(h("h1", { class: "page-title rr-sum-title", text: "Summary and verdict" }));
    main.appendChild(h("p", { class: "page-sub", text: "When you have finished, choose a verdict and save. Send the file to the author by shared folder or email. It holds only your review, and the author's tool merges it with other reviewers' files." }));
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
        reads.all ? stat(reads.read + "/" + reads.all, "Sections marked read", "report", "rr-sum-read") : null
      ]),
      h("div", { class: "rr-actions no-print" }, [
        h("button", { type: "button", class: "rr-linkbtn", id: "rr-rename", text: "Change your name", onClick: function () { askName(null, r.reviewer || reviewerName()); } }),
        h("button", { type: "button", class: "rr-linkbtn", id: "rr-print", text: "Print or save as PDF", title: "A printout of your review, for your own records or to brief someone", onClick: function () { window.print(); } })
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
    var warn = RC.isApproval(r.verdict.value) && sev["must-fix"] ? h("div", { class: "rr-warn", text: "You have " + RC.plural(sev["must-fix"], "must-fix comment") + " and an approval. That is allowed, but the author will see both." }) : null;
    // Where the last save went, and when. A file opened from disk has only
    // the date it was saved on.
    var ls = state.lastSave, savedText = null;
    if (!state.dirty && ls) savedText = "Saved to " + ls.name + " at " + fmtTime(ls.at) + "." + (ls.method === "download" ? " Each save downloads a new copy; send the newest." : "");
    else if (!state.dirty && r.savedAt) savedText = "Saved " + fmtDate(r.savedAt) + ".";
    // Not printed: the printout's header carries the verdict and the note.
    var vCard = card("Verdict", null, [
      vWrap, warn,
      h("div", { class: "field" }, [h("label", { text: "A note for the author" }), h("textarea", { id: "rr-verdict-note", "aria-label": "A note for the author", value: r.verdict.note || "", onChange: function (e) { r.verdict.note = e.target.value; touched(); } })]),
      h("div", { class: "rr-save-row no-print" }, [
        h("button", { type: "button", class: "btn primary", id: "rr-save-2", text: "Save my review file", onClick: function (e) { saveReview(e); } }),
        savedText ? h("span", { class: "small muted", id: "rr-saved-at", text: savedText }) : null
      ]),
      (r.verdict.value || "none") === "none" ? h("div", { class: "small muted no-print", id: "rr-no-verdict", text: "No verdict yet. You can save without one and carry on later, but choose one before you send the file to the author." }) : null
    ]);
    // In the suite, the file just saved can go straight to the tool the pack
    // came from, which imports it as Import review files would. Never on its
    // own, on a tour or for the demo (the bridge says no to the first two).
    var B = HB(), src = state.pack.sourceTool && state.pack.sourceTool.product;
    if (B && B.canHandoff && typeof B.handoff === "function" && !state.demo && ls && ls.text && !state.dirty && src) {
      vCard.querySelector(".rr-save-row").appendChild(h("button", { type: "button", class: "btn", id: "rr-handback", text: "Give it to the " + src,
        title: "Imports this review file into the author's tool here in the suite, as Import review files would.",
        onClick: function () { if (B.handoff(src, ls.name, ls.text)) toast("Review file handed to the " + src + "."); } }));
    }
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
    }) : [h("p", { class: "muted", text: "Comments you add on the Report and Engagement pages are listed here." })]));
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
      var c = p.comment, raised = comments().some(function (x) { return x.relatesTo === c.id; });
      var what = isConfirmed(c.id) ? (p.status === "wontchange" ? "Reason accepted" : "Confirmed fixed") : raised ? "Raised again" : "Not looked at";
      return h("tr", { "data-prev-row": c.id }, [h("td", { text: commentWhere(c) }), h("td", { text: cut(c.text, 160) + " (" + c.reviewer + ", round " + p.round + ")" }), h("td", { class: "rr-ans", text: what })]);
    });
    return h("div", { class: "rr-print-only", id: "rr-print-prev" }, [
      h("h2", { text: "Earlier comments" }),
      h("table", { class: "rr-print-table" }, [h("thead", null, [h("tr", null, [h("th", { text: "Where" }), h("th", { text: "Comment" }), h("th", { class: "rr-ans", text: "Now" })])]), h("tbody", null, rows)])
    ]);
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
      h("li", { text: "On Summary and verdict, choose a verdict and save your review file. To carry on later, open the pack and your review file in either order. Any unsaved work this browser kept is offered back." }),
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
      openPack(JSON.parse(JSON.stringify(window.SPT_REVIEW_DEMO_PACK)), true);
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
    if (j.comment && !el) el = document.querySelector('[data-sum-comment="' + j.comment + '"]');
    if (j.block) el = document.querySelector('[data-block-id="' + j.block + '"]');
    if (j.item) el = Array.prototype.filter.call(document.querySelectorAll(".rr-item"), function (n) {
      if (n.getAttribute("data-item-id") !== j.item) return false;
      return j.targetId && n.getAttribute("data-target-id") ? n.getAttribute("data-target-id") === j.targetId : n.getAttribute("data-target") === j.target;
    })[0];
    if (!el) return;
    if (el.scrollIntoView) el.scrollIntoView({ block: "center" });
    el.classList.add("flash");
    setTimeout(function () { el.classList.remove("flash"); }, 2000);
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
        var again = document.querySelector('.nav-item[data-page="' + id + '"]');
        if (again) { try { again.focus({ preventScroll: true }); } catch (e) { again.focus(); } }
      } }, [h("span", { text: label }), badge ? h("span", { class: "badge", text: String(badge) }) : null]);
  }
  function renderNav() {
    var sb = $("sidebar"); sb.innerHTML = "";
    var sec = h("div", { class: "nav-section" });
    if (state.pack) {
      var d = Math.min(state.docIndex, state.pack.documents.length - 1), doc = state.pack.documents[d];
      sec.appendChild(h("div", { class: "nav-section-title", text: "This review" }));
      var blockCount = comments().filter(function (c) { return c.anchor.kind === "block"; }).length;
      var itemCount = comments().filter(function (c) { return c.anchor.kind === "item"; }).length;
      sec.appendChild(navItem("report", "Report", blockCount || null));
      sec.appendChild(navItem("engagement", "Engagement", itemCount || null));
      sec.appendChild(navItem("checklist", "Checklist", checklistAnswered() + "/" + checklistTotal()));
      sec.appendChild(navItem("checks", "Automatic checks", activeChecks().length || null));
      // Earlier comments confirmed or raised again, of all of them.
      if (prevComments().length) sec.appendChild(navItem("previous", "Previous round", prevLookedAt() + "/" + prevComments().length));
      sec.appendChild(navItem("summary", "Summary and verdict", null));
      sb.appendChild(sec);
      if (state.page === "report") {
        // Each section: go to it, its comment count, and a tick to mark it
        // read, which only tells you (on Summary) how far you have got.
        var counts = countsBySection(doc, d), secs = sectionsOf(doc);
        var nRead = secs.filter(function (s) { return isRead(d, s.id); }).length;
        var outline = h("div", { class: "rr-outline" }, [h("div", { class: "nav-section-title", text: "Sections, " + nRead + " of " + secs.length + " read" })]);
        secs.forEach(function (s) {
          var tick = h("input", { type: "checkbox", class: "rr-read", "data-read-block": s.id, title: "Mark as read", "aria-label": "Mark " + s.title + " as read" });
          tick.checked = isRead(d, s.id);
          tick.addEventListener("change", function () {
            setRead(d, s.id, tick.checked); renderNav();
            var again = document.querySelector('.rr-read[data-read-block="' + s.id + '"]');
            if (again) { try { again.focus({ preventScroll: true }); } catch (e) { again.focus(); } }
          });
          outline.appendChild(h("div", { class: "rr-outline-row" + (tick.checked ? " read" : "") }, [tick,
            h("button", { type: "button", class: "rr-outline-item" + (s.level > 1 ? " lvl2" : ""), "data-section-block": s.id, onClick: function () {
              scrollToSection(s.id);
            } },[h("span", { class: "t", text: s.title }), counts[s.id] ? h("span", { class: "n", text: String(counts[s.id]) }) : null])]));
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
      ? "Unsaved work on this review from " + when + " was found that is not in the review file you opened. Restore adds it to the file; nothing in the file is lost."
      : other ? "Unsaved work by " + other + " on this pack, from " + when + ", was found in this browser."
      : "Unsaved review work on this pack from " + when + " was found." + (hasWork(state.review) ? " Restore adds it to what you have done since." : "");
    function restore() {
      state.review = withOffered();
      state.restore = null;
      touched(); render();
      toast("Your autosaved review is restored, with anything you added since. Save to keep it.");
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
          toast(other + "'s unsaved work is shown read only. This browser keeps one copy of unsaved work per pack, so theirs is replaced once you change anything here.");
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
      h("span", { class: "t", text: "Your review file " + (pr.name || "") + " (round " + (pr.file.round || 1) + (pr.file.reviewer ? ", " + pr.file.reviewer : "") + ") is ready. Open the review pack it answers" + (packName ? ", " + packName + "," : "") + " to carry on." }),
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
      h("span", { class: "t", text: "This browser has a review file for this pack: " + s.reviewName + (s.savedAt ? ", saved " + fmtDate(s.savedAt) : "") + ". Open it to carry on, rather than starting a second one." }),
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
      h("span", { class: "t", text: c.reviewer + "'s comments" + (c.name ? " from " + c.name : "") + " are shown read only, beside the report and on Summary. Your own comments, and Save, stay in your own review file; theirs is not changed." }),
      h("button", { type: "button", class: "btn sm", id: "rr-colleague-hide", text: "Hide them", onClick: function () { state.colleague = null; render(true); } })
    ]);
  }
  function render(keepScroll) {
    var main = $("main");
    var top = main.scrollTop;
    renderNav(); renderHeader();
    main.innerHTML = "";
    if (state.demo) {
      main.appendChild(h("div", { class: "rr-banner", id: "rr-demo-note" }, [h("span", { class: "t", text: "This is a demo pack, made from a demo assessment. Nothing you do here affects real work." })]));
    }
    [restoreBar(), pendingBar(), savedHintBar(), colleagueBar()].forEach(function (bar) { if (bar) main.appendChild(bar); });
    var page = state.page;
    if (!state.pack && page !== "about") page = "welcome";
    var fn = { welcome: renderWelcome, report: renderReport, engagement: renderEngagement, checklist: renderChecklist, checks: renderChecks, previous: renderPrevious, summary: renderSummary, about: renderAbout }[page] || renderWelcome;
    fn(main);
    // A comment still being written that this page does not show: say where.
    if (state.pack && composerHasDraft() && !main.querySelector(".rr-composer")) {
      var bar = h("div", { class: "rr-banner", id: "rr-draft" }, [
        h("span", { class: "t", text: "You have an unfinished comment on " + draftWhere() + ". It is not in your review until you add it." }),
        h("button", { type: "button", class: "btn sm primary", id: "rr-draft-go", text: "Go to it", onClick: goToDraft }),
        h("button", { type: "button", class: "btn sm", id: "rr-draft-drop", text: "Discard it", onClick: function () { state.composer = null; render(true); } })
      ]);
      var first = main.querySelector(".page-title");
      main.insertBefore(bar, first || main.firstChild);
    }
    if (state.jump) flushJump();
    else main.scrollTop = keepScroll === false ? 0 : top;
    syncReadTick();
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
  // The narrow window's Read tick follows the section in view.
  var tickTimer = null;
  $("main").addEventListener("scroll", function () { clearTimeout(tickTimer); tickTimer = setTimeout(syncReadTick, 80); });
  // The sidebar's pages are role=button: Enter and Space press them. One
  // listener on the sidebar, which keeps it through every redraw.
  $("sidebar").addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var t = e.target && e.target.closest && e.target.closest(".nav-item");
    if (t && e.target === t) { e.preventDefault(); t.click(); }
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
    // A comment still being written is in no file and no autosave.
    if ((state.dirty || composerHasDraft()) && !state.demo) { writeAutosave(); e.preventDefault(); e.returnValue = ""; return ""; }
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
    locatePrev: locatePrev,
    KEY_AUTOSAVE: KEY_AUTOSAVE, KEY_REVIEWER: KEY_REVIEWER, KEY_NAMES: KEY_NAMES, KEY_SEEN: KEY_SEEN,
    mergeReviews: mergeReviews,
    writeAutosave: writeAutosave,
    composerHasDraft: composerHasDraft,
    KEY_READ: KEY_READ
  };
})();
