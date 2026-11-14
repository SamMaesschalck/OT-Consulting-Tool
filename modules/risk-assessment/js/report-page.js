/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* report-page.js
 *
 * The Report page: both Word reports, section by section, with the same in-place
 * editing as the assessment tool's report page. What is on screen is read back
 * from a real Word build through js/docx-blocks.js, so the consultant edits what
 * the client reads, and it is rebuilt after each edit. Only the body is built
 * (exports.js, opts.preview), and a hidden section is kept in the build so it can
 * be dimmed here and put back; every real export leaves it out.
 *
 * The store is project.reportCustom = { detailed: {...}, highLevel: {...} }, each
 * in the assessment tool's shape: { <sectionKey>: { title, hidden, prose, order,
 * paragraphs } }. paragraphs holds single paragraphs reworded by an accepted review
 * suggestion (js/review.js); this page lists them above the report, each with
 * whether it still applies and the way back.
 * Two sets, because same-named sections say different things in the two reports,
 * and a third, spec, for the cyber security requirements specification (phase 6b).
 * It is absent until something is changed, and empties are removed again, so a
 * project with no overrides saves as it always did. See shared/report-sections.js
 * for the key and the pass that applies it to Word.
 */
window.RiskReportPage = (function () {
  "use strict";

  function RT() { return window.RiskTool; }
  function RX() { return window.RiskExports; }
  function DB() { return window.App.DocxBlocks; }
  function RS() { return window.App.ReportSections; }
  function project() { return RT().state.project; }
  function norm(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim(); }

  // The cyber security requirements specification is the third (phase 6b),
  // built from the same sections as the detailed report, with its own store.
  var DOCS = [
    { id: "detailed", label: "Detailed", title: "Detailed report", opts: {} },
    { id: "highLevel", label: "High level", title: "High-level report", opts: { highLevelOnly: true } },
    { id: "spec", label: "Specification", title: "Cyber security requirements specification", opts: { spec: true } }
  ];

  // ---- the store -------------------------------------------------------------
  function customOf(docId) {
    var all = project().reportCustom;
    return (all && all[docId]) || {};
  }
  function sectionOf(docId, key) { return customOf(docId)[key] || {}; }
  // Returns whether anything changed: text saved back as it was stores nothing,
  // and marks nothing as unsaved.
  function setSection(docId, key, patch) {
    if (!key) return false;
    var p = project(), all = p.reportCustom || {}, store = all[docId] || {};
    var before = JSON.stringify(store[key] || null);
    RS().patchSection(store, key, patch);
    if (JSON.stringify(store[key] || null) === before) return false;
    if (Object.keys(store).length) all[docId] = store; else delete all[docId];
    if (Object.keys(all).length) p.reportCustom = all; else delete p.reportCustom;
    RT().touched();
    return true;
  }
  function clearSection(docId, key) {
    if (!Object.keys(sectionOf(docId, key)).length) return false;
    var p = project();
    delete p.reportCustom[docId][key];
    if (!Object.keys(p.reportCustom[docId]).length) delete p.reportCustom[docId];
    if (!Object.keys(p.reportCustom).length) delete p.reportCustom;
    RT().touched();
    return true;
  }

  // ---- the build ---------------------------------------------------------------
  var ui = { doc: 0, open: null, models: [null, null, null], building: false, error: null, errorSig: null, holder: null, status: null, reveal: null, h: null };

  function signature() {
    var c = Object.assign({}, project());
    delete c.review; delete c.savedOn; delete c.lastStage;
    return JSON.stringify(c);
  }

  function modelFrom(blocks, printed, generated, lists) {
    var sections = [], cur = null, n = 0;
    blocks.forEach(function (b) {
      if (b.type === "heading" && !b.sub) {
        var tag = printed[n], gen = generated[n] || tag;
        n++;
        cur = { key: tag.key, title: tag.title, level: tag.level, boundary: tag.boundary || !tag.key, repeat: tag.repeat, targetName: tag.targetName,
                texts: tag.texts, genTitle: gen.title, genTexts: gen.texts, blocks: [] };
        sections.push(cur);
      } else if (cur) cur.blocks.push(b);
    });
    return { sections: sections, lists: lists };
  }

  function buildModel(i) {
    var printed = [], generated = [], lists = {};
    var o = Object.assign({}, DOCS[i].opts, { preview: true, keepHidden: true, sectionProbe: printed, generatedProbe: generated, listProbe: lists });
    return window.docx.Packer.toBlob(RX().buildWordDoc(project(), o)).then(function (blob) {
      return DB().fromBlob(blob, { idPrefix: "p" + i + "-b", headings: printed, keepShapes: true });
    }).then(function (res) {
      var m = modelFrom(res.blocks, printed, generated, lists);
      m.media = res.media;
      m.probe = printed;   // which reworded paragraphs applied (rewordedCard)
      return m;
    });
  }

  function fresh() {
    var m = ui.models[ui.doc];
    return !!(m && m.sig === signature());
  }
  function idle() { return !ui.building && fresh(); }

  // One build at a time: whatever changed while one ran is picked up after it.
  function pump() {
    if (ui.building) return;
    if (fresh()) { showBusy(false); return; }
    var sig = signature(), i = ui.doc;
    if (ui.errorSig === sig) { showBusy(false); return; }
    ui.building = true;
    showBusy(true);
    Promise.resolve().then(function () { return buildModel(i); }).then(function (m) {
      m.sig = sig; ui.models[i] = m; ui.error = null; ui.errorSig = null;
    }, function (e) {
      console.error(e);
      ui.error = (e && e.message) || String(e); ui.errorSig = sig;
    }).then(function () {
      ui.building = false;
      if (signature() === sig && i === ui.doc) { showBusy(false); paint(); }
      pump();
    });
  }
  function showBusy(on) {
    if (ui.status) ui.status.textContent = on ? "Refreshing the preview…" : "";
    var doc = ui.holder && (ui.holder.querySelector(".rp-doc") || ui.holder.firstChild);
    if (doc && doc.classList) doc.classList.toggle("rp-busy", !!on);
  }

  // ---- reading a block -----------------------------------------------------------
  function runsInto(el, b) {
    var runs = b.runs && b.runs.length ? b.runs : [{ t: b.text || "" }];
    runs.forEach(function (r) {
      var cls = (r.b ? "rp-b " : "") + (r.i ? "rp-i " : "") + (r.red ? "rp-red" : "");
      el.appendChild(cls ? ui.h("span", { class: cls.trim(), text: r.t }) : document.createTextNode(r.t));
    });
    return el;
  }
  // The bars' legend. A block carries no run colours, and a key of four dark
  // squares under coloured bars says nothing, so the squares take the bars' colours.
  var LEGEND = { "Very high": "#7A1F1A", "High": "#B23A33", "Medium": "#C28A1E", "Low": "#2E7D52" };
  function legendNode(b) {
    var h = ui.h, p = h("p", { class: "rp-p rp-legend" });
    String(b.text).split("■").forEach(function (part) {
      var label = norm(part);
      if (!label) return;
      var mark = h("span", { class: "rp-legend-mark", text: "■" });
      if (LEGEND[label]) mark.style.color = LEGEND[label];
      p.appendChild(h("span", { class: "rp-legend-item" }, [mark, " " + label]));
      p.appendChild(document.createTextNode(" "));
    });
    return p;
  }
  function darkFill(fill) {
    var r = parseInt(fill.slice(0, 2), 16), g = parseInt(fill.slice(2, 4), 16), b = parseInt(fill.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
  }
  // Word's light fills as the theme's own tokens, so they follow dark mode. Word's
  // darker ones (the table headers) stay as printed, with text that reads on them.
  var FILL_TOKEN = { E5F1EA: "--met-bg", F7EFD9: "--near-bg", F3DEDC: "--gap-bg", F0CFCB: "--gap-bg", ECEFF2: "--na-bg", F4F7FA: "--surface-2", F5F8FA: "--surface-2" };
  function paintFill(el, fill) {
    if (!fill) return;
    if (FILL_TOKEN[fill]) { el.style.background = "var(" + FILL_TOKEN[fill] + ")"; return; }
    el.style.background = "#" + fill;
    el.style.color = darkFill(fill) ? "#FFFFFF" : "#1A2533";
  }
  function isBarTable(b) {
    return b.type === "table" && b.rows.every(function (r) { return r.cells.every(function (c) { return !c.text; }); });
  }
  function barNode(b, media) {
    var h = ui.h, bar = h("div", { class: "rp-bar" });
    b.rows[0].cells.forEach(function (c) {
      var seg = h("span", { class: "rp-seg" });
      seg.style.flexGrow = String(c.w || 1);
      if (c.fill) seg.style.background = "#" + c.fill;
      bar.appendChild(seg);
    });
    return bar;
  }
  // A row of coloured cells is the scorecard's tiles: the figure, then its label.
  function isTiles(b) {
    return b.rows.length === 1 && b.rows[0].cells.some(function (c) { return !!c.fill; }) &&
      b.rows[0].cells.filter(function (c) { return c.text; }).every(function (c) { return !!c.fill; });
  }
  function tilesNode(b) {
    var h = ui.h, wrap = h("div", { class: "rp-tiles" });
    b.rows[0].cells.forEach(function (c) {
      if (!c.text) return;
      var paras = DB().flatten(c.blocks);
      var tile = h("div", { class: "rp-tile" }, [h("div", { class: "rp-tile-v", text: paras[0] ? paras[0].text : "" })].concat(
        paras.slice(1).map(function (x) { return h("div", { class: "rp-tile-l", text: x.text }); })));
      paintFill(tile, c.fill);
      wrap.appendChild(tile);
    });
    return wrap;
  }
  // The stacked bars: a label beside a table of coloured cells.
  function isStack(b) {
    return b.rows.length > 0 && b.rows.every(function (r) {
      return r.cells.length === 2 && (!r.cells[1].blocks.length || (r.cells[1].blocks.length === 1 && isBarTable(r.cells[1].blocks[0])));
    });
  }
  function stackNode(b, media) {
    var h = ui.h, wrap = h("div", { class: "rp-stack" });
    b.rows.forEach(function (r) {
      wrap.appendChild(h("div", { class: "rp-stack-label", text: r.cells[0].text }));
      wrap.appendChild(r.cells[1].blocks.length ? barNode(r.cells[1].blocks[0], media) : h("div", { class: "rp-bar" }));
    });
    return wrap;
  }
  function tableNode(b, media) {
    if (isBarTable(b)) return barNode(b, media);
    if (isStack(b)) return stackNode(b, media);
    if (isTiles(b)) return tilesNode(b);
    var h = ui.h, tb = h("tbody");
    b.rows.forEach(function (r) {
      var tr = h("tr");
      r.cells.forEach(function (c) {
        var td = h("td");
        if (c.span) td.setAttribute("colspan", String(c.span));
        paintFill(td, c.fill);
        c.blocks.forEach(function (x) { blocksInto(td, [x], media); });
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    return h("div", { class: "rp-tablewrap" }, [h("table", { class: "tbl rp-table" }, [tb])]);
  }
  function blocksInto(el, blocks, media) {
    var h = ui.h;
    blocks.forEach(function (b) {
      if (b.type === "paragraph") el.appendChild(/^■ /.test(b.text) ? legendNode(b) : runsInto(h("p", { class: "rp-p" }), b));
      else if (b.type === "bullet") {
        var last = el.lastChild;
        if (!last || last.tagName !== "UL") { last = h("ul", { class: "rp-ul" }); el.appendChild(last); }
        last.appendChild(runsInto(h("li"), b));
      }
      else if (b.type === "heading") el.appendChild(runsInto(h("h3", { class: "rp-subhead" }), b));
      else if (b.type === "image") {
        var src = media && media[b.media];
        if (src) el.appendChild(h("img", { class: "rp-img", src: src, alt: "" }));
      }
      else if (b.type === "table") el.appendChild(tableNode(b, media));
    });
  }

  // ---- a section ---------------------------------------------------------------
  function withoutTarget(title, name) {
    return name ? norm(String(title).split(name).join(" ")) : title;
  }
  function sameProse(a, b) {
    function lines(s) { return String(s).split(/\r?\n/).map(norm).filter(Boolean).join("\n"); }
    return lines(a) === lines(b);
  }
  // Saved on change, as on the assessment tool's page, and on leaving the box: a
  // repaint can put the box back with text typed while a build was running, and
  // the browser raises no change event for that.
  function commitOn(el, save) {
    var base = el.value;
    function go() { if (el.value === base) return; base = el.value; save(el.value); }
    el.addEventListener("change", go);
    el.addEventListener("blur", go);
  }
  function autoGrow(ta) {
    ta.style.height = "auto";
    ta.style.height = (ta.scrollHeight + 2) + "px";
  }
  // Which of a section's blocks are the wording that opens it: the same run the
  // Word pass replaces, found by the text the build recorded for it.
  function leadBlocks(s) {
    var out = [], j = 0;
    s.blocks.forEach(function (b) {
      if (j < s.texts.length && b.type === "paragraph" && norm(b.text) === norm(s.texts[j])) { out.push(b); j++; }
    });
    return out;
  }

  // Drag and drop plus arrows, as on the assessment tool's report page: the same
  // gesture, the same classes, and the arrows for anyone not using a mouse.
  var drag = { id: null };
  function listNode(s, ids, rowsOf, editing, docId) {
    var h = ui.h, list = h("div", { class: "priority-list", "data-reorder-list": "1" });
    function commit(next) { if (setSection(docId, s.key, { order: next })) { paint(); pump(); } }
    function move(i, delta) {
      var next = ids.slice(), j = i + delta;
      if (j < 0 || j >= next.length) return;
      var tmp = next[i]; next[i] = next[j]; next[j] = tmp;
      commit(next);
    }
    // Drop BEFORE the row landed on, which is what the drop-target line promises.
    function dropOn(draggedId, targetId) {
      if (!draggedId || draggedId === targetId) return;
      var next = ids.filter(function (x) { return x !== draggedId; });
      next.splice(next.indexOf(targetId), 0, draggedId);
      commit(next);
    }
    rowsOf.forEach(function (b, i) {
      var id = ids[i], cells = b.rows[0].cells;
      var r = h("div", { class: "priority-row", "data-reorder-id": id }, [
        h("span", { class: "priority-rank", text: cells[0] ? cells[0].text : String(i + 1) }),
        h("span", { class: "priority-name", text: cells[1] ? cells[1].text : "" }),
        h("span", { class: "muted", text: cells[2] ? cells[2].text : "" })
      ]);
      if (editing && ids.length > 1) {
        r.classList.add("reordering");
        r.setAttribute("draggable", "true");
        r.title = "Drag to reorder";
        r.addEventListener("dragstart", function (e) {
          drag.id = id;
          r.classList.add("dragging");
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            try { e.dataTransfer.setData("text/plain", id); } catch (x) {}
          }
        });
        r.addEventListener("dragend", function () { r.classList.remove("dragging"); r.classList.remove("drop-target"); drag.id = null; });
        r.addEventListener("dragover", function (e) {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
          if (drag.id && drag.id !== id) r.classList.add("drop-target");
        });
        r.addEventListener("dragleave", function () { r.classList.remove("drop-target"); });
        r.addEventListener("drop", function (e) {
          e.preventDefault(); r.classList.remove("drop-target");
          dropOn(drag.id, id);
        });
        function arrow(glyph, label, delta, off) {
          var a = h("button", { class: "reorder-btn", text: glyph, title: label, onClick: function (e) { e.stopPropagation(); move(i, delta); } });
          if (off) a.disabled = true;
          return a;
        }
        r.appendChild(h("span", { class: "reorder-grip" }, [
          arrow("↑", "Move up", -1, i === 0),
          arrow("↓", "Move down", 1, i === ids.length - 1)
        ]));
      }
      list.appendChild(r);
    });
    return list;
  }

  // group is one section, or its repeats (one per zone or conduit).
  function sectionCard(group, model, docId) {
    var h = ui.h, s = group[0], key = s.key;
    var cur = sectionOf(docId, key), editing = ui.open === key;
    var genTitle = s.repeat ? withoutTarget(s.genTitle, s.targetName) : s.genTitle;
    var shownTitle = s.repeat ? withoutTarget(s.title, s.targetName) : s.title;
    var genProse = s.repeat ? "" : s.genTexts.join("\n");
    // What prints with no whole rewrite: the generated wording, with any
    // paragraphs reworded from review comments put in. Edit starts from it, and
    // saving a rewrite then makes it the whole opening: the paragraph
    // replacements stay stored, listed as not applying.
    var printedProse = s.repeat ? "" : RS().applyParagraphs(s.genTexts, cur.paragraphs).join("\n");
    var changed = Object.keys(cur).length > 0;

    var head = h("div", { class: "card-h" }, [h("h2", { text: shownTitle })]);
    var bodyEl = h("div", { class: "card-b" });
    var card = h("div", { class: "card rp-section" + (editing ? " editing" : "") + (cur.hidden ? " section-hidden" : ""),
      "data-section": key, "data-section-title": genTitle, "data-generated-prose": genProse }, [head, bodyEl]);
    if (s.repeat) card.setAttribute("data-repeat", "1");
    if (s.repeat) head.appendChild(h("span", { class: "sub", text: "One for each zone and conduit, with its name after this title" }));
    if (cur.hidden) head.appendChild(h("span", { class: "section-hidden-tag", text: "Hidden: left out of the Word document" }));
    head.appendChild(h("button", {
      class: "sect-edit" + (changed ? " changed" : "") + (editing ? " open" : ""),
      text: editing ? "Done" : (changed ? "Edited" : "Edit"),
      title: "Rename, rewrite, reorder or hide this section",
      onClick: function () { ui.open = editing ? null : key; paint(); }
    }));

    // A text box's commit does not repaint at once: it fires as the box loses
    // focus, on the way to a click on Done, and redrawing the page under that
    // click would lose it. The finished build repaints.
    function saveText(patch) { if (setSection(docId, key, patch)) pump(); }
    function save(patch) { if (setSection(docId, key, patch)) { paint(); pump(); } }

    if (editing) {
      var titleIn = h("input", { type: "text", class: "sect-title-input", "aria-label": "Section title", value: shownTitle });
      commitOn(titleIn, function (v) {
        v = norm(v);
        saveText({ title: (v === genTitle || v === "") ? null : v });
      });
      head.replaceChild(titleIn, head.querySelector("h2"));
    }

    // ---- the body ----
    var lead = editing && !s.repeat ? leadBlocks(s) : [];
    var ids = model.lists[key];
    var listRows = [];
    group.forEach(function (one) {
      if (s.repeat) bodyEl.appendChild(h("h3", { class: "rp-subhead", text: one.title }));
      var box = null, listDone = false;
      one.blocks.forEach(function (b) {
        if (lead.indexOf(b) !== -1) {
          if (!box) {
            box = h("textarea", { class: "sect-prose-input", "aria-label": "Section wording",
              title: "One paragraph per line" });
            box.value = cur.prose || printedProse;
            commitOn(box, function (v) {
              saveText({ prose: (sameProse(v, printedProse) || norm(v) === "") ? null : v.trim() });
            });
            box.addEventListener("input", function () { autoGrow(box); });
            bodyEl.appendChild(box);
          }
          return;
        }
        if (ids && ids.length && b.type === "table" && b.rows.length === 1) {
          // The ranked list is printed as one table per row.
          if (!listDone) {
            listDone = true;
            listRows = one.blocks.filter(function (x) { return x.type === "table" && x.rows.length === 1; });
            bodyEl.appendChild(listNode(s, ids, listRows, editing, docId));
          }
          return;
        }
        blocksInto(bodyEl, [b], model.media);
      });
    });

    if (editing) {
      if (s.repeat) {
        bodyEl.insertBefore(h("p", { class: "muted sect-note", "data-no-rewrite": "1", text:
          "Each zone and conduit has its own wording here. Change it on the SL-T assignment page." }), bodyEl.firstChild);
      } else if (ids && ids.length > 1) {
        bodyEl.insertBefore(h("p", { class: "muted sect-note", text:
          "Drag a row, or use its arrows, to reorder." }), bodyEl.firstChild);
      } else if (!lead.length) {
        bodyEl.insertBefore(h("p", { class: "muted sect-note", text:
          "There is no opening wording to rewrite here. You can still rename or hide it." }), bodyEl.firstChild);
      }
      var actions = [h("button", {
        class: "sl-btn" + (cur.hidden ? " active" : ""),
        text: cur.hidden ? "Hidden (click to show)" : "Hide this section",
        onClick: function () { save({ hidden: !cur.hidden }); }
      })];
      if (s.repeat) {
        actions.push(h("button", { class: "inherited-edit", text: "Go to SL-T assignment", onClick: function () { RT().state.stage = "slt"; RT().render(); } }));
      }
      if (changed) {
        actions.push(h("button", { class: "inherited-edit", text: "Back to the generated version",
          onClick: function () { if (clearSection(docId, key)) { paint(); pump(); } } }));
      }
      bodyEl.appendChild(h("div", { class: "sect-actions" }, actions));
    }
    return { card: card, body: bodyEl };
  }

  function drawDoc(model, docId) {
    var h = ui.h, root = h("div", { class: "rp-doc" });
    var secs = model.sections, top = null, topKey = null, noted = false, i = 0;
    while (i < secs.length) {
      var s = secs[i];
      if (s.boundary) {
        // A zone's own heading is its name: it belongs to the section it sits in.
        var into = top || root;
        if (!noted && topKey && ui.open === topKey) {
          noted = true;
          into.appendChild(h("p", { class: "muted sect-note", text: "Rename the zones and conduits below on the Zones and conduits page." }));
        }
        into.appendChild(h("h3", { class: "rp-subhead", text: s.title }));
        blocksInto(into, s.blocks, model.media);
        i++;
        continue;
      }
      var group = [s];
      if (s.repeat) { while (secs[i + group.length] && secs[i + group.length].repeat && secs[i + group.length].key === s.key) group.push(secs[i + group.length]); }
      var made = sectionCard(group, model, docId);
      if (s.level === 1 || !top) { root.appendChild(made.card); top = made.body; topKey = s.key; noted = false; }
      else top.appendChild(made.card);
      i += group.length;
    }
    // An open section's controls stay at the foot of its card, below everything
    // that was added to it after they were made.
    Array.prototype.forEach.call(root.querySelectorAll(".sect-actions"), function (a) { a.parentNode.appendChild(a); });
    return root;
  }

  // Paragraphs reworded by an accepted review suggestion, in this report. Each
  // replaces one generated paragraph, found by its text, so when the assessment
  // changes that text it stops applying and the generated paragraph prints.
  // Nothing is lost, but the author has to be told. Null when there are none.
  function rewordedCard(m, docId) {
    var h = ui.h, known = !!m && fresh();
    var rows = RS().paragraphStatus(customOf(docId), m && m.probe ? [m.probe] : []);
    if (!rows.length) return null;
    function clip(t) { t = norm(t); return t.length > 180 ? t.slice(0, 180) + "…" : t; }
    function titleOf(r) {
      var t = r.title || r.key.replace(/-/g, " ");
      return t.charAt(0).toUpperCase() + t.slice(1);
    }
    var items = rows.map(function (r) {
      var state = known ? r.state : "checking", note = RS().paragraphNote(state);
      return h("li", { class: "wo-row", "data-reworded-row": r.key, "data-reworded-state": state }, [
        h("div", { class: "wo-head" }, [
          h("strong", { text: titleOf(r) }),
          h("span", { class: note ? "rw-lost" : "muted", text: ": " + (state === "checking" ? "Checking the Word report…" : note || "In the report.") })
        ]),
        h("p", { class: "wo-prose muted", text: "Generated: " + clip(r.from) }),
        h("p", { class: "wo-prose", text: "Reworded: " + clip(r.to) }),
        h("button", { type: "button", class: "inherited-edit wo-back", text: "Back to the generated version",
          onClick: function () {
            if (setSection(docId, r.key, { paragraphs: RS().setParagraph(sectionOf(docId, r.key).paragraphs, r.from, null) })) { paint(); pump(); }
          } })
      ]);
    });
    return h("div", { class: "card reworded-changes no-print", "data-check-anchor": "reworded" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Paragraphs reworded from review comments" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted sect-note", text: "If the assessment changes a reworded paragraph, the rewording stops applying and the generated text prints." }),
        h("ul", { class: "wo-list" }, items)
      ])
    ]);
  }

  // ---- the page ------------------------------------------------------------------
  function typingNow() {
    var a = document.activeElement;
    if (!a || !ui.holder || !ui.holder.contains(a)) return null;
    if (!a.classList.contains("sect-prose-input") && !a.classList.contains("sect-title-input")) return null;
    return { cls: a.classList.contains("sect-prose-input") ? "sect-prose-input" : "sect-title-input", value: a.value, from: a.selectionStart, to: a.selectionEnd };
  }
  function reveal(m) {
    var r = ui.reveal, holder = ui.holder, el = null;
    ui.reveal = null;
    if (r.key) el = holder.querySelector('[data-section="' + String(r.key).replace(/"/g, '\\"') + '"]');
    if (!el && r.quote) {
      var q = norm(r.quote);
      el = Array.prototype.filter.call(holder.querySelectorAll("h3, p, td, li"), function (n) { return norm(n.textContent) === q; })[0] || null;
    }
    if (!el) {
      if (RT().toast) RT().toast("That part of the report is no longer there.", "warn");
      return;
    }
    if (el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("check-flash");
    void el.offsetWidth;
    el.classList.add("check-flash");
    window.setTimeout(function () { el.classList.remove("check-flash"); }, 2200);
  }
  function paint() {
    var holder = ui.holder;
    if (!holder || !holder.isConnected) return;
    var main = document.getElementById("main"), top = main ? main.scrollTop : 0, typing = typingNow();
    if (fresh()) { ui.error = null; ui.errorSig = null; }   // the report is good again, whatever failed before
    var m = ui.models[ui.doc], h = ui.h;
    holder.innerHTML = "";
    var reworded = rewordedCard(m, DOCS[ui.doc].id);
    if (reworded) holder.appendChild(reworded);
    if (m) holder.appendChild(drawDoc(m, DOCS[ui.doc].id));
    else if (ui.error) holder.appendChild(h("p", { class: "rp-error", text: "The report could not be built: " + ui.error }));
    else holder.appendChild(h("div", { class: "rp-doc rp-busy" }, [h("p", { class: "muted", text: "Reading the Word report…" })]));
    if (m && ui.error) holder.insertBefore(h("p", { class: "rp-error", text: "The report could not be rebuilt, so this is the last good version: " + ui.error }), holder.firstChild);
    Array.prototype.forEach.call(holder.querySelectorAll(".sect-prose-input"), autoGrow);
    if (typing) {
      // What the consultant is part way through typing is not theirs to lose
      // because a build finished.
      var box = holder.querySelector("." + typing.cls);
      if (box) {
        box.value = typing.value;
        box.focus();
        try { box.setSelectionRange(typing.from, typing.to); } catch (e) {}
        if (typing.cls === "sect-prose-input") autoGrow(box);
      }
    }
    if (main) main.scrollTop = top;
    if (ui.reveal && m && fresh()) reveal(m);
    showBusy(ui.building || (!fresh() && ui.errorSig !== signature()));
  }
  function openDoc(i) {
    if (ui.doc === i) return;
    ui.doc = i; ui.open = null;
    drawTabs();
    paint(); pump();
  }
  function drawTabs() {
    if (!ui.tabs) return;
    Array.prototype.forEach.call(ui.tabs.children, function (b, i) { b.classList.toggle("active", i === ui.doc); b.setAttribute("aria-pressed", i === ui.doc ? "true" : "false"); });
  }
  function render(main, h) {
    ui.h = h;
    main.appendChild(h("h1", { class: "page-title", text: "Report" }));
    main.appendChild(h("p", { class: "page-sub", text: "The Word report, section by section; use Edit to rename, rewrite or hide one." }));
    ui.tabs = h("div", { class: "rp-tabs", role: "group", "aria-label": "Which report" }, DOCS.map(function (d, i) {
      return h("button", { class: "sl-btn rp-tab", "data-doc": d.id, text: d.label, onClick: function () { openDoc(i); } });
    }));
    ui.status = h("span", { class: "rp-status", role: "status" });
    main.appendChild(h("div", { class: "rp-toolbar no-print" }, [
      ui.tabs, ui.status, h("span", { class: "rp-spacer" }),
      h("button", { class: "btn", text: "Download Word report", onClick: function () { RT().downloadWordReport(DOCS[ui.doc].opts); } })
    ]));
    // The peer review's warnings, once a review has started (js/review.js).
    var rv = window.RiskReview ? window.RiskReview.warningsCard(h) : null;
    if (rv) main.appendChild(rv);
    ui.holder = h("div", { class: "rp-holder" });
    main.appendChild(ui.holder);
    drawTabs();
    paint();
    pump();
  }
  // Go to, from a review comment: this report, this section.
  function goTo(docIndex, key, quote) {
    ui.doc = docIndex === 1 || docIndex === 2 ? docIndex : 0;
    ui.open = null;
    ui.reveal = { key: key || "", quote: quote || "" };
    // The Report page shows the sections, on this report (js/ui-reports.js).
    var RR = window.RiskApp && window.RiskApp.Reports;
    if (RR && RR.reportView) RR.reportView("sections", ui.doc);
    RT().state.stage = "report";
    RT().render();
  }

  return { DOCS: DOCS, render: render, goTo: goTo, customOf: customOf, sectionOf: sectionOf, setSection: setSection, clearSection: clearSection,
    idle: idle, state: ui, leadBlocks: leadBlocks };
})();
