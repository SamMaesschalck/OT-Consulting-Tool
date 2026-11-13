/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* review-author.js
 *
 * The author's side of a review, drawn into whatever container a tool gives
 * it: Send for review, Import review files, who has answered, and the comments
 * list (grouped by section, filterable, with Go to, Accept or Copy, status and
 * replies). The canonical copy is shared/review-author.js; tools/sync-shared.ps1
 * copies it to js/review-author.js in the assessment and risk tools. Its styles
 * are shared/review-author.css.
 *
 * The tool passes an adapter, which is all this file knows about it:
 *   store()                 the assessment's review store (App.ReviewCore)
 *   touch()                 the store changed: mark unsaved, autosave
 *   send(progress, done, opts)  build and write the pack; progress(text), done({ ok, message });
 *                           opts { note, neededBy }: what the author typed for the
 *                           reviewers (either may be empty), for the pack's request
 *   afterImport(results)    optional, after files were merged in
 *   goTo(thread)            take the author to what the comment is on; returns nothing
 *   canGo(thread)           optional, false when there is nowhere to go
 *   acceptPlan(thread)      { can, why, label } for a comment with suggested wording
 *   accept(thread, done)    apply it; done({ ok, message }) after checking it took
 *   undoAccept(thread, done) optional, put back what Accept replaced (thread.accepted.revert);
 *   acceptedNote(thread)    optional, a sentence for an accepted comment whose wording is
 *                           not in the report now, or null
 *                           done({ ok, message }). Without it there is no Undo button
 *   fieldLabel(field)       optional, what the tool calls an item field, when the
 *                           round's pack named no fieldLabels
 *   stale(thread)           true when the comment no longer matches the report, null if not known yet
 *   authorName()            who is replying
 *   extras()                optional, a node shown under the review summary (the QA prompt)
 *   live()                  optional, the panel's container now, when the tool may
 *                           have redrawn its page while something was running
 *   beginPaint(), endPaint() optional, called around one drawing of the panel. Each
 *                           card asks stale() and acceptPlan(), so a tool may keep what
 *                           it works out about the report between the two calls
 *   packMatches(pack), ensureStore(), packHint(packId, reviewId)
 *                           optional, for a pack this copy of the project has no record
 *                           of (see importTexts)
 *   toast(msg, kind)
 * Nothing here is part of a report, so nothing here can reach Word or Excel.
 */
(function () {
  "use strict";
  window.App = window.App || {};

  function RC() { return window.App.ReviewCore; }

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") el.textContent = v;
      else if (k === "class") el.className = v;
      else if (k === "onClick") el.addEventListener("click", v);
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

  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso || "");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  // The filters, open reply boxes, which groups are open and the note being
  // written for the reviewers all outlive a repaint of the panel.
  function newUi() {
    return { status: "open", severity: "", reviewer: "", replying: {}, refusing: {}, notice: null, busy: null,
      openGroups: {}, expanded: {}, lastGo: null, flash: null, request: { note: "", neededBy: "", open: false } };
  }
  // Above this many comments shown, the section groups start closed, so the
  // card stays short enough not to push the report far down the page.
  var OPEN_GROUPS_UP_TO = 12;

  // One drawing of the panel. Every card asks the tool whether its comment is
  // stale and whether its wording can be accepted, so the tool is told when a
  // drawing starts and ends and can work the report out once, not per card.
  function mount(container, adapter, ui) {
    if (adapter.beginPaint) adapter.beginPaint();
    try { draw(container, adapter, ui); }
    finally { if (adapter.endPaint) adapter.endPaint(); }
  }

  function draw(container, adapter, ui) {
    ui = ui || newUi();
    listenForHandBack();
    lastMount = { container: container, adapter: adapter, ui: ui, repaint: function () { var c = (adapter.live && adapter.live()) || container; if (c.isConnected) mount(c, adapter, ui); } };
    ["openGroups", "expanded"].forEach(function (k) { if (!ui[k]) ui[k] = {}; });
    if (!ui.request) ui.request = { note: "", neededBy: "", open: false };
    function repaint() { var c = (adapter.live && adapter.live()) || container; mount(c, adapter, ui); return c; }
    container.innerHTML = "";
    // The card is here again: it draws its own way back, if there is one.
    dropPageBack();
    var store = adapter.store();
    var multi = (RC().lastRound(store) || { documents: [] }).documents.length > 1;
    // Shows one comment: widens the filters if they hide it, opens its group,
    // then scrolls to it and flashes it.
    function reveal(id) {
      if (!readyReveal(store, ui, id)) return false;
      repaint();
      return true;
    }

    // ---- the two actions --------------------------------------------------
    var fileInput = h("input", { type: "file", accept: "application/json,.json", multiple: true, class: "rv-file", "aria-label": "Review files to import" });
    fileInput.style.display = "none";
    fileInput.addEventListener("change", function () {
      var files = Array.prototype.slice.call(fileInput.files || []);
      fileInput.value = "";
      readAll(files, function (texts) { importTexts(adapter, texts, ui, repaint); });
    });
    var sendBtn = h("button", { type: "button", class: "btn primary rv-send", text: "Send for review", disabled: !!ui.busy, onClick: function () {
      var opts = { note: String(ui.request.note || "").trim(), neededBy: RC().norm(ui.request.neededBy) };
      ui.busy = "Building the Word report…"; ui.notice = null; repaint();
      adapter.send(function (text) {
        ui.busy = text;
        var line = container.querySelector(".rv-busy");
        if (line) line.textContent = text;
      }, function (res) {
        ui.busy = null;
        ui.notice = res && res.message ? { kind: res.ok ? "ok" : "err", text: res.message } : null;
        // The note went with that pack; the next one starts empty.
        if (res && res.ok) ui.request = { note: "", neededBy: "", open: false };
        repaint();
      }, opts);
    } });
    container.appendChild(h("div", { class: "rv-actions" }, [
      sendBtn,
      h("button", { type: "button", class: "btn rv-import", text: "Import review files", disabled: !!ui.busy, onClick: function () { fileInput.click(); } }),
      fileInput
    ]));
    // An optional note and date for the reviewers, carried in the pack. They
    // are shown to the reviewers only, never in Word or Excel.
    var noteBox = h("textarea", { class: "rv-input rv-req-note", rows: "3", "aria-label": "Note to reviewers",
      placeholder: "For example: round 2, I accepted most of your wording; please look again at sections 4 and 5." });
    noteBox.value = ui.request.note || "";
    noteBox.addEventListener("input", function () { ui.request.note = noteBox.value; });
    var dueBox = h("input", { type: "text", class: "rv-input rv-req-due", "aria-label": "Needed by", placeholder: "For example: Thursday 12 November" });
    dueBox.value = ui.request.neededBy || "";
    dueBox.addEventListener("input", function () { ui.request.neededBy = dueBox.value; });
    var reqBox = h("details", { class: "rv-request" }, [
      h("summary", { text: "Add a note for the reviewers (optional)" }),
      h("label", { class: "rv-req-label" }, ["Note to reviewers", noteBox]),
      h("label", { class: "rv-req-label" }, ["Needed by", dueBox]),
      h("p", { class: "muted rv-req-hint", text: "Both go in the next pack you send. The reviewers see them in the review tool; they never reach the report." })
    ]);
    if (ui.request.open || ui.request.note || ui.request.neededBy) reqBox.open = true;
    reqBox.addEventListener("toggle", function () { ui.request.open = reqBox.open; });
    container.appendChild(reqBox);
    if (ui.busy) container.appendChild(h("p", { class: "rv-busy muted", text: ui.busy }));
    if (ui.notice) {
      var lines = String(ui.notice.text).split("\n");
      var noticeBox = h("div", { class: "rv-notice " + ui.notice.kind }, lines.map(function (l) { return h("div", { text: l }); }));
      container.appendChild(noticeBox);
    }

    // ---- where it stands ----------------------------------------------------
    var last = RC().lastRound(store);
    if (!last) {
      container.appendChild(h("p", { class: "muted rv-empty", text: "Nothing has been sent yet. Send for review writes a pack: give it to each reviewer by shared folder or email, and keep it as carefully as the project file: it holds client data." }));
      return;
    }
    var fileRows = store.files.slice().sort(function (a, b) { return b.round - a.round || String(a.reviewer).localeCompare(b.reviewer); });
    var rq = last.request;
    container.appendChild(h("p", { class: "muted rv-round", text: "Round " + last.round + " was sent on " + fmtDate(last.createdAt) + "." +
      (rq && rq.neededBy ? " Needed by " + rq.neededBy + "." : "") + (store.files.length ? "" : " No review has come back yet.") }));
    if (rq && rq.note) container.appendChild(h("div", { class: "rv-note rv-sent-note", text: "Your note to the reviewers: " + rq.note }));
    if (fileRows.length) {
      container.appendChild(h("ul", { class: "rv-files" }, fileRows.map(function (f) {
        var v = (f.verdict && f.verdict.value) || "none";
        var no = (f.checklist || []).filter(function (c) { return c.answer === "no"; });
        var kids = [
          h("strong", { text: f.reviewer }),
          " ",
          h("span", { class: "rv-verdict v-" + v, text: RC().VERDICTS[v] || v }),
          h("span", { class: "muted", text: " round " + f.round + ", saved " + fmtDate(f.savedAt) }),
          f.setAside ? h("span", { class: "rv-aside-tag", text: "Set aside" }) : null,
          // For a reviewer who has left, or who answered a later round under
          // another name: their verdict stops counting, their comments stay.
          h("button", { type: "button", class: "btn sm rv-aside", text: f.setAside ? "Count this review again" : "Set aside this review",
            title: f.setAside ? "This review counts towards the warnings again."
              : "This review no longer counts towards the warnings. Its comments stay, and you can count it again at any time.",
            onClick: function () { RC().setAside(store, f.fileId, !f.setAside); adapter.touch(); repaint(); } })
        ];
        if (f.verdict && f.verdict.note) kids.push(h("div", { class: "rv-note", text: f.verdict.note }));
        if (no.length) kids.push(h("div", { class: "rv-note", text: "Checklist, answered no: " + no.map(function (c) { return c.text + (c.note ? " (" + c.note + ")" : ""); }).join("; ") }));
        var cl = checklistNode(f, v);
        if (cl) kids.push(cl);
        var dismissed = f.dismissedChecks || [];
        if (dismissed.length) {
          var titles = f.dismissedCheckTitles || {};
          // A file from before titles were saved names only the check's id.
          kids.push(h("div", { class: "rv-note rv-dismissed", text: "Automatic checks dismissed as not a problem: " + dismissed.map(function (id) {
            return titles[id] || String(id).split(":")[0].replace(/-/g, " ");
          }).join("; ") }));
        }
        return h("li", { class: f.setAside ? "rv-file-aside" : null, "data-file-id": f.fileId }, kids);
      })));
    }
    var extra = adapter.extras && adapter.extras();
    if (extra) container.appendChild(extra);

    // ---- the comments -------------------------------------------------------
    var live = store.threads.filter(listed);
    if (!live.length) {
      container.appendChild(h("p", { class: "muted rv-empty", text: store.files.length ? "No comments in the review files imported so far." : "Comments appear here once review files are imported." }));
      return;
    }
    var reviewers = [];
    live.forEach(function (t) { if (reviewers.indexOf(t.comment.reviewer) === -1) reviewers.push(t.comment.reviewer); });
    function sel(cur, opts, onSet, label) {
      return h("label", { class: "rv-filter" }, [label + " ", h("select", { onChange: function (e) { onSet(e.target.value); repaint(); } },
        opts.map(function (o) { var op = h("option", { value: o[0], text: o[1] }); if (o[0] === cur) op.selected = true; return op; }))]);
    }
    container.appendChild(h("div", { class: "rv-filters" }, [
      sel(ui.status, [["open", "Open"], ["", "All"], ["resolved", "Resolved"], ["wontchange", "Won't change"]], function (v) { ui.status = v; }, "Show"),
      sel(ui.severity, [["", "Any severity"]].concat(RC().SEVERITIES.map(function (s) { return [s.id, s.label]; })), function (v) { ui.severity = v; }, "Severity"),
      reviewers.length > 1 ? sel(ui.reviewer, [["", "Everyone"]].concat(reviewers.map(function (n) { return [n, n]; })), function (v) { ui.reviewer = v; }, "Reviewer") : null,
      h("span", { class: "muted rv-count", text: RC().plural(live.filter(function (t) { return t.status === "open"; }).length, "open comment") + " of " + live.length })
    ]));

    var shown = live.filter(function (t) {
      return (!ui.status || t.status === ui.status) && (!ui.severity || t.comment.severity === ui.severity) && (!ui.reviewer || t.comment.reviewer === ui.reviewer);
    });
    if (!shown.length) { container.appendChild(h("p", { class: "muted rv-empty", text: "No comments match these filters." })); return; }

    // Each section is a group that opens and closes. With many comments they
    // start closed, so the report below is a few lines away, not screens.
    var startOpen = shown.length <= OPEN_GROUPS_UP_TO;
    groupBySection(shown, store).forEach(function (g) {
      var must = g.threads.filter(function (t) { return t.comment.severity === "must-fix" && t.status === "open"; }).length;
      var box = h("details", { class: "rv-groupbox", "data-group": g.key }, [
        h("summary", { class: "rv-group" }, [
          g.title + " (" + g.threads.length + ")",
          must ? h("span", { class: "rv-group-must", text: RC().plural(must, "must fix", "must fix") }) : null
        ])
      ]);
      box.open = g.key in ui.openGroups ? !!ui.openGroups[g.key] : startOpen;
      // Only the author's own opening or closing is remembered: the toggle
      // event that setting it here fires later is not a choice.
      var was = box.open;
      box.addEventListener("toggle", function () {
        if (box.open === was) return;
        was = box.open; ui.openGroups[g.key] = box.open;
      });
      g.threads.forEach(function (t) { box.appendChild(commentCard(t, adapter, ui, repaint, reveal)); });
      container.appendChild(box);
    });

    // After Go to, a way back to the comment the author came from.
    if (ui.lastGo && RC().findThread(store, ui.lastGo)) {
      container.appendChild(h("div", { class: "rv-back" }, [
        h("button", { type: "button", class: "btn primary rv-back-go", text: "Back to the comment", onClick: function () {
          var id = ui.lastGo; ui.lastGo = null;
          if (!reveal(id)) repaint();
        } }),
        h("button", { type: "button", class: "btn rv-back-close", text: "Close", "aria-label": "Close this bar", onClick: function () {
          ui.lastGo = null; repaint();
        } })
      ]));
    }
    if (ui.flash) {
      var target = container.querySelector('[data-comment-id="' + String(ui.flash).replace(/["\\]/g, "\\$&") + '"]');
      ui.flash = null;
      if (target) {
        if (target.scrollIntoView) target.scrollIntoView({ block: "center" });
        target.classList.add("rv-flash");
        setTimeout(function () { target.classList.remove("rv-flash"); }, 1600);
      }
    }
  }

  // A comment the reviewer has since deleted is not listed, unless wording
  // accepted from it is still in the report: that one stays, marked, so the
  // change and its Undo are not lost with it.
  function listed(t) { return !t.withdrawn || !!t.accepted; }

  // Sets the card up to show one comment when it is next drawn: the filters
  // widened if they hide it, its group open, and it flashed.
  function readyReveal(store, ui, id) {
    var t = RC().findThread(store, id);
    if (!t || !listed(t)) return false;
    if (ui.status && t.status !== ui.status) ui.status = "";
    if (ui.severity && t.comment.severity !== ui.severity) ui.severity = "";
    if (ui.reviewer && t.comment.reviewer !== ui.reviewer) ui.reviewer = "";
    ui.openGroups[groupOf(t, (RC().lastRound(store) || { documents: [] }).documents.length > 1).key] = true;
    ui.flash = id;
    return true;
  }

  // After Go to, the card shows a way back to the comment. When Go to left the
  // page the card is on (to an item, its plan, the basis, another page of the
  // risk tool), the same bar is put on the page itself; its Back opens the
  // card's page (adapter.showCard) at the comment.
  var pageBackBar = null;
  function dropPageBack() {
    if (pageBackBar && pageBackBar.parentNode) pageBackBar.parentNode.removeChild(pageBackBar);
    pageBackBar = null;
  }
  function pageBack(adapter, ui, holder) {
    dropPageBack();
    var live = adapter.live ? adapter.live() : (holder && holder.isConnected ? holder : null);
    if (live || !ui.lastGo || typeof adapter.showCard !== "function") return;
    pageBackBar = h("div", { class: "rv-back rv-back-page", id: "rv-back-page" }, [
      h("button", { type: "button", class: "btn primary rv-back-go", text: "Back to the comment", onClick: function () {
        var id = ui.lastGo;
        ui.lastGo = null;
        dropPageBack();
        readyReveal(adapter.store(), ui, id);
        adapter.showCard();
      } }),
      h("button", { type: "button", class: "btn rv-back-close", text: "Close", "aria-label": "Close this bar", onClick: function () {
        ui.lastGo = null; dropPageBack();
      } })
    ]);
    document.body.appendChild(pageBackBar);
  }

  // Which group a comment is listed under, and its heading. Item comments are
  // grouped by target and group together: comments on two zones that share a
  // group name ("Zone") are never put under the first zone's name.
  function groupOf(t, multi) {
    var a = t.comment.anchor || {};
    if (a.kind === "item") {
      return { key: "item|" + (a.targetId || a.targetName || "") + "|" + (a.groupName || ""),
        title: "Engagement" + (a.targetName ? ": " + a.targetName : "") + (a.groupName && a.groupName !== a.targetName ? " - " + a.groupName : "") };
    }
    if (a.kind === "general") return { key: "general|" + (a.sectionTitle || ""), title: a.sectionTitle || "General" };
    // A document is known by its title where the anchor has one: a risk pack
    // sent before any zones held the high-level report at index 0, later at 1.
    return { key: "block|" + (multi ? (a.documentTitle || a.documentIndex) : "") + "|" + (a.sectionKey || "") + "|" + (a.sectionTitle || ""),
      title: (a.sectionTitle || "Cover") + (multi && a.documentTitle ? " - " + a.documentTitle : "") };
  }

  // Sections in the order the document prints them; engagement comments after.
  function groupBySection(threads, store) {
    var groups = [], byKey = {};
    var docs = (RC().lastRound(store) || { documents: [] }).documents, multi = docs.length > 1, at = {};
    docs.forEach(function (d, i) { if (d.title && !(d.title in at)) at[d.title] = i; });
    function rank(t) {
      var a = t.comment.anchor || {};
      if (a.kind === "block") {
        var m = /b(\d+)$/.exec(a.blockId || "");
        return [a.documentTitle && a.documentTitle in at ? at[a.documentTitle] : Number(a.documentIndex) || 0, m ? Number(m[1]) : 0];
      }
      return [a.kind === "item" ? 1e6 : 2e6, 0];
    }
    threads.slice().sort(function (x, y) {
      var a = rank(x), b = rank(y);
      return a[0] - b[0] || a[1] - b[1];
    }).forEach(function (t) {
      var g = groupOf(t, multi);
      if (!byKey[g.key]) { byKey[g.key] = { key: g.key, title: g.title, threads: [] }; groups.push(byKey[g.key]); }
      byKey[g.key].threads.push(t);
    });
    return groups;
  }

  // What the card calls an item's field: the pack's own label (a risk pack
  // says "Threat source" where an assessment says "evidence"), else the tool's.
  var FIELD_LABELS = { evidence: "evidence", notes: "notes", action: "recommended action", impact: "business impact", owner: "owner",
    answer: "answer", expected: "target", priority: "priority" };
  function fieldLabel(field, t, store, adapter) {
    var rounds = store.rounds || [];
    var r = rounds.filter(function (x) { return x.round === t.round; })[0] || rounds[rounds.length - 1];
    var L = r && r.fieldLabels, label = null;
    if (L && typeof L[field] === "string" && L[field]) label = L[field];
    else if (adapter.fieldLabel) label = adapter.fieldLabel(field);
    label = label || FIELD_LABELS[field] || field;
    // Lower case for use mid-sentence, unless it starts with an abbreviation (SL-T).
    return /^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label;
  }

  // ---- suggested wording against the text it replaces ------------------------
  //
  // A word-level difference (longest common subsequence over the words), so a
  // one-word change in a long paragraph is seen at once. null when there is
  // nothing useful to show: too long to compare, or no words in common.
  var DIFF_MAX_CELLS = 250000, DIFF_CONTEXT = 8;
  function wordDiff(from, to) {
    var a = String(from || "").split(/\s+/).filter(Boolean), b = String(to || "").split(/\s+/).filter(Boolean);
    if (!a.length || !b.length || a.length * b.length > DIFF_MAX_CELLS) return null;
    var n = a.length, m = b.length, i, j;
    var L = [];
    for (i = 0; i <= n; i++) { L.push(new Uint16Array(m + 1)); }
    for (i = n - 1; i >= 0; i--) {
      for (j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    }
    if (!L[0][0]) return null;
    var ops = [];
    i = 0; j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) { ops.push(["eq", a[i]]); i++; j++; }
      else if (i < n && (j >= m || L[i + 1][j] >= L[i][j + 1])) { ops.push(["del", a[i]]); i++; }
      else { ops.push(["ins", b[j]]); j++; }
    }
    return ops.some(function (o) { return o[0] !== "eq"; }) ? ops : null;
  }
  // The diff as nodes, keeping only a few words either side of each change.
  function diffNode(ops) {
    var near = ops.map(function () { return false; });
    ops.forEach(function (o, k) {
      if (o[0] === "eq") return;
      for (var x = Math.max(0, k - DIFF_CONTEXT); x <= Math.min(ops.length - 1, k + DIFF_CONTEXT); x++) near[x] = true;
    });
    var out = h("div", { class: "rv-diff" }), gap = false, run = null, runKind = null;
    function flush() { if (run) { out.appendChild(run); out.appendChild(document.createTextNode(" ")); } run = null; runKind = null; }
    ops.forEach(function (o, k) {
      if (!near[k]) { if (!gap) { flush(); out.appendChild(h("span", { class: "rv-gap", text: "…" })); out.appendChild(document.createTextNode(" ")); gap = true; } return; }
      gap = false;
      if (o[0] === "eq") { flush(); out.appendChild(document.createTextNode(o[1] + " ")); return; }
      if (runKind !== o[0]) { flush(); runKind = o[0]; run = h(o[0], { class: o[0] === "ins" ? "rv-ins" : "rv-del" }); }
      else run.appendChild(document.createTextNode(" "));
      run.appendChild(document.createTextNode(o[1]));
    });
    flush();
    return out;
  }

  // One reviewer's checklist: how much was answered, and every answer and
  // note behind an expander. An approval with questions left unanswered is
  // pointed out, and only pointed out.
  function checklistNode(f, verdict) {
    var list = (f.checklist || []).filter(function (c) { return c && c.text; });
    var total = Number(f.checklistTotal) || 0;
    if (!list.length && !total) return null;
    var answered = list.filter(function (c) { return c.answer === "yes" || c.answer === "no" || c.answer === "na"; });
    var no = answered.filter(function (c) { return c.answer === "no"; }).length;
    var summary = "Checklist: " + answered.length + (total ? " of " + total : "") + " answered" + (no ? ", " + no + " no" : "");
    var words = { yes: "Yes", no: "No", na: "N/A" };
    var box = h("details", { class: "rv-checklist" }, [
      h("summary", { text: summary }),
      list.length ? h("ul", { class: "rv-cl-list" }, list.map(function (c) {
        return h("li", { class: "rv-cl-" + (c.answer || "none") }, [
          h("strong", { text: (words[c.answer] || "Not answered") + ": " }), c.text,
          c.note ? h("div", { class: "rv-note", text: c.note }) : null
        ]);
      })) : h("p", { class: "muted", text: "No question was answered." })
    ]);
    var out = h("div", { class: "rv-cl" }, [box]);
    if (RC().isApproval(verdict) && total && answered.length < total) {
      out.appendChild(h("div", { class: "rv-note rv-cl-short", text: "Approved with " + RC().plural(total - answered.length, "checklist question") + " not answered." }));
    }
    return out;
  }

  // A comment the reviewer raised again: which earlier comment it continues,
  // what that said and the wording it was on then, and a way to it.
  function raisedAgainNode(relatesTo, store, reveal) {
    var e = RC().findThread(store, relatesTo);
    if (!e) return h("div", { class: "rv-raised muted", text: "Raised again from an earlier round." });
    var ea = e.comment.anchor || {};
    var kids = [h("div", { class: "rv-raised-head", text: "Raised again from round " + e.round + ". " + e.comment.reviewer + " said then:" }),
      h("div", { class: "rv-raised-text", text: e.comment.text })];
    if (ea.quote) kids.push(h("div", { class: "rv-raised-quote muted", text: "On the wording then: " + (ea.quote.length > 200 ? ea.quote.slice(0, 200) + "…" : ea.quote) }));
    if (listed(e) && reveal) {
      kids.push(h("button", { type: "button", class: "btn sm rv-raised-go", text: "Show the earlier comment", onClick: function () { reveal(relatesTo); } }));
    }
    return h("div", { class: "rv-raised" }, kids);
  }

  function commentCard(t, adapter, ui, repaint, reveal) {
    var c = t.comment, a = c.anchor || {}, id = c.id;
    var store = adapter.store();
    var open = t.status === "open";
    // "No longer matches" is a warning about an open comment. On one already
    // answered (accepted, resolved after an edit, won't change) it is noise.
    var stale = open ? adapter.stale(t) : null;
    var sev = RC().SEVERITIES.filter(function (s) { return s.id === c.severity; })[0] || { label: c.severity }, sevLabel = sev.label;
    var card = h("div", { class: "rv-comment sev-" + c.severity + (open ? "" : " done"), "data-comment-id": id });
    card.appendChild(h("div", { class: "rv-c-head" }, [
      h("span", { class: "rv-sev sev-" + c.severity, text: sevLabel, title: sev.help || null }),
      h("strong", { text: c.reviewer }),
      h("span", { class: "muted", text: " round " + t.round + ", " + fmtDate(c.updatedAt || c.createdAt) }),
      h("span", { class: "rv-status st-" + t.status, text: RC().STATUSES[t.status] || t.status }),
      stale === true ? h("span", { class: "rv-stale", text: "No longer matches the current report" }) : null,
      t.reopened && open ? h("span", { class: "rv-stale rv-reopened", text: "Changed by the reviewer after you marked it " + (t.reopened.from === "wontchange" ? "Won't change" : "Resolved") }) : null,
      t.accepted ? h("span", { class: "rv-accepted", text: "Wording accepted" }) : null,
      t.withdrawn ? h("span", { class: "rv-stale rv-withdrawn", text: "Deleted by the reviewer" }) : null,
      t.confirmedBy && t.confirmedBy.length ? h("span", { class: "rv-accepted", text: "Fix confirmed by " + t.confirmedBy.join(", ") }) : null
    ]));
    // What is behind the comment's text. On a closed comment it folds away,
    // so a long list of answered comments stays short.
    var body = [];
    if (a.kind === "item") {
      body.push(h("div", { class: "rv-item-ref muted", text: [a.code, a.itemTitle].filter(Boolean).join(" ") + (a.field ? " (" + fieldLabel(a.field, t, store, adapter) + ")" : "") }));
    }
    var diff = c.suggestion && a.quote ? wordDiff(a.quote, c.suggestion) : null;
    if (a.quote && !diff) body.push(h("blockquote", { class: "rv-quote", text: a.quote.length > 400 ? a.quote.slice(0, 400) + "…" : a.quote }));
    else if (!a.quote && a.blockType === "image") body.push(h("div", { class: "rv-item-ref muted", text: "On a chart or picture" }));
    if (a.selection && a.selection !== a.quote) body.push(h("div", { class: "rv-item-ref muted", text: "Selected: " + a.selection }));
    if (t.reopened && open && t.reopened.reason) body.push(h("p", { class: "rv-reason", text: "Your earlier reason: " + t.reopened.reason }));
    if (c.relatesTo) body.push(raisedAgainNode(c.relatesTo, store, reveal));
    var textAt = body.length, textNode = h("p", { class: "rv-text", text: c.text });

    var actions = [];
    if (!adapter.canGo || adapter.canGo(t)) {
      actions.push(h("button", { type: "button", class: "btn sm rv-go", text: "Go to", onClick: function () {
        ui.lastGo = id;
        var holder = repaint();
        adapter.goTo(t);
        // Some Go to's finish a moment later (another site or zone first).
        pageBack(adapter, ui, holder);
        [300, 1000, 2500].forEach(function (ms) {
          setTimeout(function () { if (ui.lastGo === id && !pageBackBar) pageBack(adapter, ui, holder); }, ms);
        });
      } }));
    }
    if (c.suggestion) {
      var plan = adapter.acceptPlan(t);
      if (diff) {
        // The change, marked, with a few words either side; the whole of both
        // texts one click away.
        body.push(h("div", { class: "rv-suggest" }, [
          h("div", { class: "rv-s-label", text: "Suggested wording, with the changes marked" }),
          diffNode(diff),
          h("details", { class: "rv-full" }, [
            h("summary", { text: "Show full wording" }),
            h("div", { class: "rv-s-label", text: "As it reads" }), h("div", { class: "rv-s-text rv-s-was", text: a.quote }),
            h("div", { class: "rv-s-label", text: "Suggested wording" }), h("div", { class: "rv-s-text", text: c.suggestion })
          ])
        ]));
      } else {
        body.push(h("div", { class: "rv-suggest" }, [h("div", { class: "rv-s-label", text: "Suggested wording" }), h("div", { class: "rv-s-text", text: c.suggestion })]));
      }
      if (plan && plan.can && t.status === "open") {
        actions.push(h("button", { type: "button", class: "btn sm primary rv-accept", text: plan.label || "Accept", onClick: function () {
          ui.busy = "Applying the wording and checking the Word report…"; repaint();
          adapter.accept(t, function (res) {
            ui.busy = null;
            ui.notice = { kind: res.ok ? "ok" : "err", text: res.message };
            repaint();
          });
        } }));
      }
      if (!(plan && plan.can) || t.status !== "open") {
        actions.push(h("button", { type: "button", class: "btn sm rv-copy", text: "Copy", onClick: function () {
          RC().copyText(c.suggestion, function (done) {
            adapter.toast(done ? "Suggested wording copied." : "The browser would not copy it. Select the text instead.", done ? "" : "warn");
          });
        } }));
        if (plan && plan.why && t.status === "open") body.push(h("p", { class: "rv-why muted", text: plan.why }));
      }
    }
    var canUndo = !!(t.accepted && typeof t.accepted === "object" && t.accepted.revert && adapter.undoAccept);
    if (canUndo) {
      actions.push(h("button", { type: "button", class: "btn sm rv-undo", text: "Undo the accepted wording",
        title: "Puts back the text the accepted wording replaced, and opens the comment again", onClick: function () {
          ui.busy = "Putting the earlier wording back…"; repaint();
          adapter.undoAccept(t, function (res) {
            ui.busy = null;
            ui.notice = res && res.message ? { kind: res.ok ? "ok" : "err", text: res.message } : null;
            repaint();
          });
        } }));
    }
    if (t.status === "open") {
      actions.push(h("button", { type: "button", class: "btn sm rv-resolve", text: "Resolve", onClick: function () {
        RC().setStatus(store, id, "resolved"); adapter.touch(); repaint();
      } }));
      actions.push(h("button", { type: "button", class: "btn sm rv-wont", text: "Won't change", onClick: function () {
        ui.refusing[id] = !ui.refusing[id]; repaint();
      } }));
    } else {
      actions.push(h("button", { type: "button", class: "btn sm rv-reopen", text: "Reopen",
        title: "Opens the comment again. It does not change the report text" + (canUndo ? ": Undo the accepted wording does that." : "."), onClick: function () {
          RC().setStatus(store, id, "open"); adapter.touch(); repaint();
        } }));
    }
    actions.push(h("button", { type: "button", class: "btn sm rv-reply", text: "Reply", onClick: function () {
      ui.replying[id] = !ui.replying[id]; repaint();
    } }));
    (t.replies || []).forEach(function (r) {
      body.push(h("div", { class: "rv-replyline" }, [h("strong", { text: r.author }), h("span", { class: "muted", text: " " + fmtDate(r.at) + " " }), r.text]));
    });
    if (open || !body.length) {
      body.splice(textAt, 0, textNode);
      body.forEach(function (n) { card.appendChild(n); });
      if (t.status === "wontchange" && t.reason) card.appendChild(h("p", { class: "rv-reason", text: "Won't change: " + t.reason }));
    } else {
      card.appendChild(textNode);
      if (t.status === "wontchange" && t.reason) card.appendChild(h("p", { class: "rv-reason", text: "Won't change: " + t.reason }));
      var more = h("details", { class: "rv-more" }, [h("summary", { text: "Show what it is on" + ((t.replies || []).length ? " and the replies" : "") })].concat(body));
      more.open = !!ui.expanded[id];
      more.addEventListener("toggle", function () { ui.expanded[id] = more.open; });
      card.appendChild(more);
    }
    // Accepted wording that is not in the report now (the paragraph it replaced
    // has changed, say): said beside Undo the accepted wording, which still works.
    var lost = t.accepted && adapter.acceptedNote ? adapter.acceptedNote(t) : null;
    if (lost) card.appendChild(h("p", { class: "rv-why rv-accept-note", text: lost }));
    card.appendChild(h("div", { class: "rv-c-actions" }, actions));

    if (ui.refusing[id] && t.status === "open") {
      var why = h("input", { type: "text", class: "rv-input rv-wont-reason", placeholder: "Why it will not change (the reviewer will see this)", "aria-label": "Why it will not change" });
      card.appendChild(h("div", { class: "rv-inline" }, [why, h("button", { type: "button", class: "btn sm primary rv-wont-save", text: "Save reason", onClick: function () {
        var r = RC().setStatus(store, id, "wontchange", why.value);
        if (!r.ok) { adapter.toast(r.error, "warn"); return; }
        delete ui.refusing[id]; adapter.touch(); repaint();
      } })]));
    }
    if (ui.replying[id]) {
      var box = h("input", { type: "text", class: "rv-input rv-reply-text", placeholder: "Your reply (the reviewer sees it in the next round)", "aria-label": "Your reply" });
      card.appendChild(h("div", { class: "rv-inline" }, [box, h("button", { type: "button", class: "btn sm primary rv-reply-save", text: "Add reply", onClick: function () {
        var r = RC().addReply(store, id, adapter.authorName(), box.value);
        if (!r.ok) { adapter.toast(r.error, "warn"); return; }
        delete ui.replying[id]; adapter.touch(); repaint();
      } })]));
    }
    return card;
  }

  function readAll(files, cb) {
    var out = [], left = files.length;
    if (!left) { cb(out); return; }
    files.forEach(function (f, i) {
      var r = new FileReader();
      r.onload = function () { out[i] = { name: f.name, text: String(r.result) }; if (--left === 0) cb(out); };
      r.onerror = function () { out[i] = { name: f.name, text: "" }; if (--left === 0) cb(out); };
      r.readAsText(f);
    });
  }

  // Merges a set of files in. One bad file is reported and the rest still go in.
  // A pack among them is put back on this assessment's rounds when the tool
  // says it is this assessment's (adapter.packMatches): the round was sent
  // from a copy of the project that was never saved. Packs go first, so its
  // review files can follow in the same import.
  function importTexts(adapter, texts, ui, repaint) {
    var results = [], lines = [], bad = 0, changed = false;
    var read = texts.map(function (f) { return { f: f, id: RC().identify(f.text) }; });
    read.sort(function (x, y) { return (x.id.kind === "pack" ? 0 : 1) - (y.id.kind === "pack" ? 0 : 1); });
    // A pack this assessment sent goes on its rounds, so the review must
    // exist first: adapter.store() gives a stand-in when none has started,
    // which nothing would keep (adapter.ensureStore makes the real one).
    // A pack, or a review, that another assessment in the project already
    // holds is never put on this one: two assessments of one instrument for
    // one client both match, and the hint says which to switch to.
    function heldElsewhere(pack) {
      if (typeof adapter.packHint !== "function" || RC().roundOfPack(adapter.store(), pack.packId)) return "";
      return adapter.packHint(pack.packId, pack.reviewId) || "";
    }
    var adopting = typeof adapter.packMatches === "function" && read.some(function (x) {
      return x.id.ok && x.id.kind === "pack" && adapter.packMatches(x.id.data) && !heldElsewhere(x.id.data);
    });
    var store = adopting && typeof adapter.ensureStore === "function" ? adapter.ensureStore() : adapter.store();
    read.forEach(function (x) {
      var f = x.f, id = x.id;
      if (!id.ok) { bad++; lines.push(f.name + ": " + id.error); return; }
      if (id.kind === "pack") {
        if (typeof adapter.packMatches !== "function") { bad++; lines.push(f.name + ": this is a review pack. Import the review files reviewers send back."); return; }
        var other = heldElsewhere(id.data);
        if (other) { bad++; lines.push(f.name + ": " + other); return; }
        var ad = RC().adoptPack(store, id.data, !!adapter.packMatches(id.data));
        if (!ad.ok) { bad++; lines.push(f.name + ": " + ad.error); return; }
        if (ad.already) lines.push(f.name + ": round " + ad.round.round + " pack already registered with this assessment. Import the reviewers' files.");
        else { changed = true; lines.push(f.name + ": round " + ad.round.round + " pack re-registered with this assessment. Now import the reviewers' files."); }
        return;
      }
      var r = RC().importFile(store, id.data);
      if (!r.ok) {
        bad++;
        // The tool may know which of its assessments sent that pack.
        var hint = r.noPack && typeof adapter.packHint === "function" ? adapter.packHint(id.data.packId, id.data.reviewId) : "";
        lines.push(f.name + ": " + (hint || r.error));
        return;
      }
      r.file = id.data;
      results.push(r);
      if (r.duplicate) lines.push(f.name + ": already imported. Nothing changed.");
      else if (r.older) lines.push(f.name + ": a later save from " + r.reviewer + " is already imported, so this one was left out.");
      else {
        changed = true;
        lines.push(r.reviewer + " (round " + r.round + "): " + RC().plural(r.added, "new comment") + (r.updated ? ", " + r.updated + " updated" : "") +
          (r.reopened ? ", " + r.reopened + " reopened because the reviewer changed " + (r.reopened === 1 ? "it" : "them") + " after you closed " + (r.reopened === 1 ? "it" : "them") : "") +
          (r.removed ? ", " + r.removed + " withdrawn" : "") +
          (r.replies ? ", " + RC().plural(r.replies, "reply", "replies") : "") + "." +
          // What the reviewer deleted after the author had answered it stays.
          (r.withdrawn ? " " + r.reviewer + " also deleted " + RC().plural(r.withdrawn, "comment") + " you had already answered." : "") +
          (r.withdrawnAccepted ? " Wording you accepted from " + (r.withdrawn === 1 ? "it" : r.withdrawnAccepted + " of them") + " is still in the report, so " +
            (r.withdrawnAccepted === 1 ? "that comment stays" : "those comments stay") + " listed (show All), with Undo the accepted wording." : "") +
          (r.repliesOnClosed === 1 ? " 1 reply is on a comment you had closed, which stays closed: show All to read it." : "") +
          (r.repliesOnClosed > 1 ? " " + r.repliesOnClosed + " replies are on comments you had closed, which stay closed: show All to read them." : "") +
          (r.setAside ? " This review is set aside, so it does not count towards the warnings." : "") +
          (r.renamedFrom ? " This file was " + r.renamedFrom + "'s and is now saved as " + r.reviewer + "." : ""));
      }
    });
    if (changed) adapter.touch();
    if (adapter.afterImport) adapter.afterImport(results.filter(function (r) { return !r.duplicate && !r.older; }));
    if (ui) { ui.notice = lines.length ? { kind: bad ? "err" : "ok", text: lines.join("\n") } : null; ui.status = ui.status || "open"; }
    if (repaint) repaint();
    return { results: results, lines: lines, bad: bad };
  }

  // ---- in the suite: a review file dropped on this tool -------------------------
  // Only inside the SolutionsPT OT Cyber Suite (App.HostBridge, which a tool
  // never requires). Standalone, none of this shows or does anything. A review
  // file dropped on this tool's page is imported here, as Import review files
  // would, into the card last drawn. Nothing here opens the pack in the review
  // tool, and the review tool has no button that sends a review file back:
  // someone else does the review, so the pack and the review file travel
  // between people as files.
  var lastMount = null, listening = false;
  function takeHandedFile(name, text) {
    var id = RC() ? RC().identify(text) : null;
    if (!id || !id.ok || id.kind !== "review") return false;
    var B = window.App.HostBridge;
    if (!lastMount) {
      if (B && B.notice) B.notice("To bring in " + name + ", open the report it reviews and use Import review files.");
      return true;
    }
    var m = lastMount;
    var res = importTexts(m.adapter, [{ name: name, text: text }], m.ui, m.repaint);
    if (m.adapter.toast && res.lines.length) m.adapter.toast(res.lines.join(" "), res.bad ? "err" : undefined);
    return true;
  }
  function listenForHandBack() {
    var B = window.App.HostBridge;
    if (listening || !B || !B.hosted || typeof B.onOpenText !== "function") return;
    listening = true;
    B.onOpenText(takeHandedFile);
  }
  listenForHandBack();

  window.App.ReviewAuthor = { mount: mount, newUi: newUi, importTexts: importTexts };
})();
