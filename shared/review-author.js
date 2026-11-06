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
 *   send(progress, done)    build and write the pack; progress(text), done({ ok, message })
 *   afterImport(results)    optional, after files were merged in
 *   goTo(thread)            take the author to what the comment is on; returns nothing
 *   canGo(thread)           optional, false when there is nowhere to go
 *   acceptPlan(thread)      { can, why, label } for a comment with suggested wording
 *   accept(thread, done)    apply it; done({ ok, message }) after checking it took
 *   stale(thread)           true when the comment no longer matches the report, null if not known yet
 *   authorName()            who is replying
 *   extras()                optional, a node shown under the review summary (the QA prompt)
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

  // The filters and open reply boxes outlive a repaint of the panel.
  function newUi() { return { status: "open", severity: "", reviewer: "", replying: {}, refusing: {}, notice: null, busy: null }; }

  function mount(container, adapter, ui) {
    ui = ui || newUi();
    function repaint() { mount(container, adapter, ui); }
    container.innerHTML = "";
    var store = adapter.store();

    // ---- the two actions --------------------------------------------------
    var fileInput = h("input", { type: "file", accept: "application/json,.json", multiple: true, class: "rv-file", "aria-label": "Review files to import" });
    fileInput.style.display = "none";
    fileInput.addEventListener("change", function () {
      var files = Array.prototype.slice.call(fileInput.files || []);
      fileInput.value = "";
      readAll(files, function (texts) { importTexts(adapter, texts, ui, repaint); });
    });
    var sendBtn = h("button", { type: "button", class: "btn primary rv-send", text: "Send for review", disabled: !!ui.busy, onClick: function () {
      ui.busy = "Building the Word report…"; ui.notice = null; repaint();
      adapter.send(function (text) {
        ui.busy = text;
        var line = container.querySelector(".rv-busy");
        if (line) line.textContent = text;
      }, function (res) {
        ui.busy = null;
        ui.notice = res && res.message ? { kind: res.ok ? "ok" : "err", text: res.message } : null;
        repaint();
      });
    } });
    container.appendChild(h("div", { class: "rv-actions" }, [
      sendBtn,
      h("button", { type: "button", class: "btn rv-import", text: "Import review files", disabled: !!ui.busy, onClick: function () { fileInput.click(); } }),
      fileInput
    ]));
    if (ui.busy) container.appendChild(h("p", { class: "rv-busy muted", text: ui.busy }));
    if (ui.notice) {
      var lines = String(ui.notice.text).split("\n");
      container.appendChild(h("div", { class: "rv-notice " + ui.notice.kind }, lines.map(function (l) { return h("div", { text: l }); })));
    }

    // ---- where it stands ----------------------------------------------------
    var last = RC().lastRound(store);
    if (!last) {
      container.appendChild(h("p", { class: "muted rv-empty", text: "Nothing has been sent yet. Send for review writes a pack: give it to each reviewer by shared folder or email, and treat it like the project file, as it holds client data." }));
      return;
    }
    var fileRows = store.files.slice().sort(function (a, b) { return b.round - a.round || String(a.reviewer).localeCompare(b.reviewer); });
    container.appendChild(h("p", { class: "muted rv-round", text: "Round " + last.round + " was sent on " + fmtDate(last.createdAt) + "." + (store.files.length ? "" : " No review has come back yet.") }));
    if (fileRows.length) {
      container.appendChild(h("ul", { class: "rv-files" }, fileRows.map(function (f) {
        var v = (f.verdict && f.verdict.value) || "none";
        var no = (f.checklist || []).filter(function (c) { return c.answer === "no"; });
        var kids = [
          h("strong", { text: f.reviewer }),
          " ",
          h("span", { class: "rv-verdict v-" + v, text: RC().VERDICTS[v] || v }),
          h("span", { class: "muted", text: " round " + f.round + ", saved " + fmtDate(f.savedAt) })
        ];
        if (f.verdict && f.verdict.note) kids.push(h("div", { class: "rv-note", text: f.verdict.note }));
        if (no.length) kids.push(h("div", { class: "rv-note", text: "Checklist, answered no: " + no.map(function (c) { return c.text + (c.note ? " (" + c.note + ")" : ""); }).join("; ") }));
        return h("li", null, kids);
      })));
    }
    var extra = adapter.extras && adapter.extras();
    if (extra) container.appendChild(extra);

    // ---- the comments -------------------------------------------------------
    var live = store.threads.filter(function (t) { return !t.withdrawn; });
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

    groupBySection(shown, store).forEach(function (g) {
      container.appendChild(h("h3", { class: "rv-group", text: g.title + " (" + g.threads.length + ")" }));
      g.threads.forEach(function (t) { container.appendChild(commentCard(t, adapter, ui, repaint)); });
    });
  }

  // Sections in the order the document prints them; engagement comments after.
  function groupBySection(threads, store) {
    var groups = [], byKey = {};
    var multi = (RC().lastRound(store) || { documents: [] }).documents.length > 1;
    function rank(t) {
      var a = t.comment.anchor || {};
      if (a.kind === "block") {
        var m = /b(\d+)$/.exec(a.blockId || "");
        return [Number(a.documentIndex) || 0, m ? Number(m[1]) : 0];
      }
      return [a.kind === "item" ? 1e6 : 2e6, 0];
    }
    threads.slice().sort(function (x, y) {
      var a = rank(x), b = rank(y);
      return a[0] - b[0] || a[1] - b[1];
    }).forEach(function (t) {
      var a = t.comment.anchor || {};
      var title, key;
      if (a.kind === "item") {
        key = "item|" + (a.groupName || a.targetName || "");
        title = "Engagement" + (a.targetName ? ": " + a.targetName : "");
      } else if (a.kind === "general") {
        key = "general|" + (a.sectionTitle || "");
        title = a.sectionTitle || "General";
      } else {
        key = "block|" + (multi ? a.documentIndex : "") + "|" + (a.sectionKey || "") + "|" + (a.sectionTitle || "");
        title = (a.sectionTitle || "Cover") + (multi && a.documentTitle ? " - " + a.documentTitle : "");
      }
      if (!byKey[key]) { byKey[key] = { title: title, threads: [] }; groups.push(byKey[key]); }
      byKey[key].threads.push(t);
    });
    return groups;
  }

  function commentCard(t, adapter, ui, repaint) {
    var c = t.comment, a = c.anchor || {}, id = c.id;
    var store = adapter.store();
    var stale = adapter.stale(t);
    var sevLabel = (RC().SEVERITIES.filter(function (s) { return s.id === c.severity; })[0] || { label: c.severity }).label;
    var card = h("div", { class: "rv-comment sev-" + c.severity + (t.status !== "open" ? " done" : ""), "data-comment-id": id });
    card.appendChild(h("div", { class: "rv-c-head" }, [
      h("span", { class: "rv-sev sev-" + c.severity, text: sevLabel }),
      h("strong", { text: c.reviewer }),
      h("span", { class: "muted", text: " round " + t.round + ", " + fmtDate(c.updatedAt || c.createdAt) }),
      h("span", { class: "rv-status st-" + t.status, text: RC().STATUSES[t.status] || t.status }),
      stale === true ? h("span", { class: "rv-stale", text: "No longer matches the current report" }) : null,
      t.accepted ? h("span", { class: "rv-accepted", text: "Wording accepted" }) : null,
      t.confirmedBy && t.confirmedBy.length ? h("span", { class: "rv-accepted", text: "Fix confirmed by " + t.confirmedBy.join(", ") }) : null
    ]));
    if (a.kind === "item") {
      card.appendChild(h("div", { class: "rv-item-ref muted", text: [a.code, a.itemTitle].filter(Boolean).join(" ") + (a.field ? " (" + a.field + ")" : "") }));
    }
    if (a.quote) card.appendChild(h("blockquote", { class: "rv-quote", text: a.quote.length > 400 ? a.quote.slice(0, 400) + "…" : a.quote }));
    card.appendChild(h("p", { class: "rv-text", text: c.text }));

    var actions = [];
    if (!adapter.canGo || adapter.canGo(t)) {
      actions.push(h("button", { type: "button", class: "btn sm rv-go", text: "Go to", onClick: function () { adapter.goTo(t); } }));
    }
    if (c.suggestion) {
      var plan = adapter.acceptPlan(t);
      card.appendChild(h("div", { class: "rv-suggest" }, [h("div", { class: "rv-s-label", text: "Suggested wording" }), h("div", { class: "rv-s-text", text: c.suggestion })]));
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
        if (plan && plan.why && t.status === "open") card.appendChild(h("p", { class: "rv-why muted", text: plan.why }));
      }
    }
    if (t.status === "open") {
      actions.push(h("button", { type: "button", class: "btn sm rv-resolve", text: "Resolve", onClick: function () {
        RC().setStatus(store, id, "resolved"); adapter.touch(); repaint();
      } }));
      actions.push(h("button", { type: "button", class: "btn sm rv-wont", text: "Won't change", onClick: function () {
        ui.refusing[id] = !ui.refusing[id]; repaint();
      } }));
    } else {
      actions.push(h("button", { type: "button", class: "btn sm rv-reopen", text: "Reopen", onClick: function () {
        RC().setStatus(store, id, "open"); adapter.touch(); repaint();
      } }));
    }
    actions.push(h("button", { type: "button", class: "btn sm rv-reply", text: "Reply", onClick: function () {
      ui.replying[id] = !ui.replying[id]; repaint();
    } }));
    if (t.status === "wontchange" && t.reason) card.appendChild(h("p", { class: "rv-reason", text: "Won't change: " + t.reason }));
    (t.replies || []).forEach(function (r) {
      card.appendChild(h("div", { class: "rv-replyline" }, [h("strong", { text: r.author }), h("span", { class: "muted", text: " " + fmtDate(r.at) + " " }), r.text]));
    });
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
  function importTexts(adapter, texts, ui, repaint) {
    var store = adapter.store(), results = [], lines = [], bad = 0, changed = false;
    texts.forEach(function (f) {
      var id = RC().identify(f.text);
      if (!id.ok) { bad++; lines.push(f.name + ": " + id.error); return; }
      if (id.kind !== "review") { bad++; lines.push(f.name + ": this is a review pack. Import the review files reviewers send back."); return; }
      var r = RC().importFile(store, id.data);
      if (!r.ok) { bad++; lines.push(f.name + ": " + r.error); return; }
      r.file = id.data;
      results.push(r);
      if (r.duplicate) lines.push(f.name + ": already imported, nothing changed.");
      else if (r.older) lines.push(f.name + ": a later save from " + r.reviewer + " is already imported, so this one was left out.");
      else {
        changed = true;
        lines.push(r.reviewer + " (round " + r.round + "): " + RC().plural(r.added, "new comment") + (r.updated ? ", " + r.updated + " updated" : "") + (r.removed ? ", " + r.removed + " withdrawn" : "") + ".");
      }
    });
    if (changed) adapter.touch();
    if (adapter.afterImport) adapter.afterImport(results.filter(function (r) { return !r.duplicate && !r.older; }));
    if (ui) { ui.notice = lines.length ? { kind: bad ? "err" : "ok", text: lines.join("\n") } : null; ui.status = ui.status || "open"; }
    if (repaint) repaint();
    return { results: results, lines: lines, bad: bad };
  }

  window.App.ReviewAuthor = { mount: mount, newUi: newUi, importTexts: importTexts };
})();
