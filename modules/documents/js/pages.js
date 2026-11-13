/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* pages.js: App.DocPages, each draws one page into #main
 * (docs/document-tool-design.md 5.2, 5.5 to 5.8).
 *
 *   welcome   no document open: new, load, the demo
 *   info      Document information: the fields, the kind, the cover miniature
 *   preview   the document drawn from the model by App.DocRender, on sheets
 *   issue     Still to complete, Worth a look, Draft or Final, Export Word
 *   report    what an import carried, changed and left out
 *   about     version, keyboard, licence
 *
 * Each function is given an empty #main and, as an optional second argument,
 * what App.DocApp.go was passed (info takes { field }). Nothing here keeps
 * its own copy of the document: a page reads App.DocApp.state.doc when it is
 * drawn and writes straight back to it, then calls App.DocApp.touched.
 *
 * Text from a document or an imported file only ever reaches the page as
 * text nodes and attribute values.
 */
(function () {
  "use strict";
  var A = window.App = window.App || {};

  // app.js loads after this file, so the shell is looked up when a page is
  // drawn, never when this file runs.
  function D() { return A.DocApp; }
  function M() { return A.DocModel; }
  function doc() { return D().state.doc; }
  // The shell's helper, given only attributes that are set, so an optional id
  // or data attribute can be written inline as null.
  function h(tag, attrs, kids) {
    var set = {};
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] != null && attrs[k] !== false) set[k] = attrs[k]; });
    return D().h(tag, set, kids);
  }
  function on(el, type, fn) { el.addEventListener(type, fn); return el; }
  function btn(text, cls, fn, id) {
    return on(h("button", { type: "button", class: "btn" + (cls ? " " + cls : ""), id: id || null, text: text }), "click", fn);
  }
  // A list has the same button on every row. Each is named for its row, so a
  // list of buttons read out of context still says which is which.
  function rowBtn(text, about, fn) {
    var b = btn(text, "small", fn);
    b.setAttribute("aria-label", text + ": " + String(about || "").slice(0, 80));
    return b;
  }
  function card(title, sub, kids, id) {
    return h("div", { class: "card", id: id || null }, [
      h("div", { class: "card-h" }, [h("h2", { text: title }), sub ? h("span", { class: "sub", text: sub }) : null]),
      h("div", { class: "card-b" }, kids)
    ]);
  }
  function head(main, title, sub) {
    main.appendChild(h("h1", { class: "page-title", text: title }));
    if (sub) main.appendChild(h("p", { class: "page-sub", text: sub }));
  }
  function redraw(main, page, arg) { main.textContent = ""; page(main, arg); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  // ---------- reading the model ----------
  // Every block in reading order, the ones inside table cells included.
  // fn(block, top, cell): top is the body block it sits in (itself when it is
  // one), cell is { table, widthShare } inside a table.
  function walk(d, fn) {
    (d.blocks || []).forEach(function (b) {
      fn(b, b, null);
      if (b.type !== "table") return;
      var total = (b.cols || []).reduce(function (s, n) { return s + (+n || 0); }, 0) || 1;
      var grid = M().table.grid(b) || [];
      (b.rows || []).forEach(function (row, r) {
        (row.cells || []).forEach(function (cell) {
          // The share of the table's width the cell covers, for the fit rule.
          var share = 0;
          (grid[r] || []).forEach(function (g, c) { if (g && g.cell === cell && !g.covered) share = spanShare(b, c, cell.span || 1) / total; });
          (cell.blocks || []).forEach(function (cb) { fn(cb, b, { table: b, widthShare: share || 1 / Math.max(1, (b.cols || []).length) }); });
        });
      });
    });
  }
  function spanShare(table, col, span) {
    var s = 0;
    for (var i = col; i < col + span && i < table.cols.length; i++) s += +table.cols[i] || 0;
    return s;
  }
  function exists(d, id) { var f = M().find(d, id); return !!(f && f.block); }

  // The printed width of the text area in px at 96 dpi (3.5).
  var PAGE_PX = 601, LAND_PX = 1026;
  var SHOWN_TYPES = { "image/png": 1, "image/jpeg": 1, "image/gif": 1, "image/bmp": 1 };
  var KEPT_NAMES = {
    shape: "Shape", group: "Group of shapes", textbox: "Text box", canvas: "Drawing canvas", smartart: "Diagram (SmartArt)",
    chart: "Chart", ole: "Embedded object", picture: "Picture", equation: "Equation", other: "Drawing"
  };
  function cm(px) { return (Math.round((+px || 0) / 96 * 25.4) / 10).toFixed(1); }
  function sizeText(b) { return b.width && b.height ? cm(b.width) + " x " + cm(b.height) + " cm" : ""; }
  function bytesText(n) {
    if (n < 1024) return n ? "less than 1 KB" : "none";
    if (n < 1024 * 1024) return Math.round(n / 1024) + " KB";
    return (Math.round(n / 1024 / 1024 * 10) / 10).toFixed(1) + " MB";
  }
  function mb(n) { return Math.round(n / 1024 / 1024) + " MB"; }

  // Kept objects, and the pictures the browser cannot draw, with the heading
  // each sits under: what the import report lists and the Issue page counts.
  function drawings(d) {
    var out = [], under = "", keptTotal = 0;
    walk(d, function (b, top, cell) {
      if (b.type === "heading" && !cell) under = M().text(b);
      if (b.type === "kept") {
        keptTotal++;
        out.push({ block: b, top: top, cell: cell, under: under, kept: keptTotal });
      } else if (b.type === "picture") {
        var m = (d.media || {})[b.media];
        if (!m || m.missing || !SHOWN_TYPES[m.type]) out.push({ block: b, top: top, cell: cell, under: under, media: m || null });
      }
    });
    out.keptTotal = keptTotal;
    return out;
  }
  // The in-line kept objects wider than the space they sit in: the writer
  // makes these smaller (3.4). Worked out here from the stored sizes so the
  // Issue page can say so without building the file.
  function tooWide(d) {
    var ids = [];
    walk(d, function (b, top, cell) {
      if (b.type !== "kept" || b.floating || !b.width) return;
      var room = (top.land ? LAND_PX : PAGE_PX) * (cell ? cell.widthShare : 1);
      if (b.width > room + 1) ids.push(b.id);
    });
    return ids;
  }
  // The pictures and in-line kept objects that, once fitted to the width of
  // their space, are still taller than a page can show: the writer makes
  // these smaller too (its own rule, App.HouseDocx.fitPx, and its limits).
  function tooTall(d) {
    var ids = [], H = A.HouseDocx || {}, PG = H.PAGE || {};
    if (!H.fitPx || !PG.portraitMaxHPx) return ids;
    walk(d, function (b, top, cell) {
      if ((b.type !== "picture" && b.type !== "kept") || b.floating || !(b.width > 0) || !(b.height > 0)) return;
      var room = Math.max(16, Math.floor((top.land ? LAND_PX : PAGE_PX) * (cell ? cell.widthShare : 1)));
      var high = (top.land ? PG.landscapeMaxHPx : PG.portraitMaxHPx) - (cell ? PG.cellHLessPx || 0 : 0);
      if (H.fitPx(b.width, b.height, room, high).lower) ids.push(b.id);
    });
    return ids;
  }

  // ---------- welcome ----------
  function welcome(main) {
    head(main, "Documents", "Write a document in the SolutionsPT template, or rebuild a Word file in it.");
    main.appendChild(h("div", { class: "dp-start", id: "dp-start" }, [
      h("p", { text: "You can also drop a file on this page." }),
      btn("New document", "primary", function () {
        D().setDoc(M().create("report"), { from: "new" });
      }, "dp-new"),
      btn("Load a document or a Word file", "", function () {
        // The picker, the file input fallback and the unsaved-changes guard
        // all live behind the header's Load.
        var b = document.getElementById("btn-load");
        if (b) b.click();
      }, "dp-load"),
      btn("Try the demo", "", openDemo, "dp-demo")
    ]));
    main.appendChild(card("How it works", null, [h("ol", { class: "dp-steps" }, [
      h("li", { text: "Fill in Document information for the cover and document control." }),
      h("li", { text: "Write on the Edit page. Mark anything still to complete in red." }),
      h("li", { text: "Or load a Word file to rebuild it in the template." }),
      h("li", { text: "Export a draft or final Word file from Issue and export." }),
      h("li", { text: "Save writes your work to a document file. It holds client data." })
    ])]));
  }

  // The demo is a project file kept as a script, so the single-file build can
  // carry it inline. Opened as a tour: its changes are never kept.
  function openDemo() {
    function go() {
      if (!window.SPT_DOCUMENT_DEMO) { D().toast("The demo document (data/demo-document.js) is missing.", "err"); return; }
      var d;
      try { d = M().fromText(JSON.stringify(window.SPT_DOCUMENT_DEMO)); }
      catch (e) { D().toast("The demo document could not be opened. " + e.message, "err"); return; }
      D().setDoc(d, { from: "tour" });
    }
    if (window.SPT_DOCUMENT_DEMO) { go(); return; }
    var s = document.createElement("script");
    s.src = "data/demo-document.js";
    s.onload = go;
    s.onerror = function () { D().toast("The demo document (data/demo-document.js) failed to load.", "err"); };
    document.head.appendChild(s);
  }

  // ---------- Document information ----------
  var LABELS = {
    title: "Title", docType: "Document type", reference: "Reference", client: "Client", site: "Site or subject",
    author: "Author", revision: "Revision", date: "Date",
    qaReviewBy: "QA review by", authorisedBy: "Authorised by", issuedTo: "Issued to", issuedDate: "Issued date",
    classification: "Classification"
  };
  // What each field's hint says depends on the kind: a short document has no
  // cover and no document control page, and prints only the title, one line
  // of client, revision and date under it, and the footer (design, section 2).
  var NOT_SHORT = "Not printed in a short document.";
  var HINTS = {
    report: {
      title: "Needed to issue as Final.",
      docType: "Printed in capitals at the top of the cover.",
      reference: "A document or opportunity reference.",
      revision: "Printed on the cover and in document control.",
      date: "Printed on the cover until an issued date is set.",
      issuedDate: "Printed in document control, and on the cover in place of the date.",
      classification: "Printed on the cover, in the footer and as Confidentiality in document control."
    },
    short: {
      title: "Needed to issue as Final.",
      docType: NOT_SHORT,
      reference: NOT_SHORT,
      client: "Printed under the title and in the footer.",
      site: NOT_SHORT,
      author: NOT_SHORT,
      revision: "Printed under the title.",
      date: "Printed under the title until an issued date is set.",
      issuedDate: "When set, it is printed under the title in place of the date.",
      classification: "Printed at the left of the footer."
    }
  };
  var LEADS = {
    report: "These fill in the cover, document control page and footer.",
    short: "These fill in the title, the line under it and the footer."
  };
  var KIND_TEXT = {
    report: ["Report", "Cover and document control page, then the body."],
    short: ["Short document", "No cover: the title, then the body."]
  };

  function info(main, arg) {
    var d = doc();
    if (!d) { welcome(main); return; }
    d.info = d.info || {};
    d.options = d.options || {};
    head(main, "Document information", LEADS[d.kind] || LEADS.report);
    // The page is drawn again when the kind changes, so the hints follow it.
    var hints = HINTS[d.kind] || HINTS.report;

    var mini = coverMini(d);
    function changed(what) { D().touched(what || { info: true }); mini.refresh(); }

    function field(key, wide) {
      var isDate = key === "date" || key === "issuedDate";
      var input = h("input", { type: isDate ? "date" : "text", id: "info-" + key, autocomplete: "off" });
      input.value = d.info[key] || "";
      if (key === "docType") input.setAttribute("list", "info-docType-list");
      // input for the live miniature; change as well, because a date field
      // and the browser's autofill report through it.
      function commit() {
        if ((d.info[key] || "") === input.value) return;
        d.info[key] = input.value;
        changed();
      }
      on(input, "input", commit); on(input, "change", commit);
      if (hints[key]) input.setAttribute("aria-describedby", "info-" + key + "-hint");
      return h("div", { class: "field" + (wide ? " dp-wide" : "") }, [
        h("label", { for: "info-" + key, text: LABELS[key] }), input,
        hints[key] ? h("div", { class: "hint", id: "info-" + key + "-hint", text: hints[key] }) : null
      ]);
    }

    // Kind: two choices, each with its one-line description.
    var kinds = h("fieldset", { class: "dp-kinds" }, [h("legend", { text: "Kind of document" })]);
    M().KINDS.forEach(function (k) {
      var radio = h("input", { type: "radio", name: "dp-kind", id: "info-kind-" + k, value: k });
      radio.checked = d.kind === k;
      on(radio, "change", function () {
        if (!radio.checked || d.kind === k) return;
        d.kind = k;
        // What prints around the body changes, so the page is drawn again.
        D().touched({ structure: true });
        redraw(main, info);
        var again = document.getElementById("info-kind-" + k);
        if (again) again.focus();
      });
      kinds.appendChild(h("label", { class: "dp-kind", for: "info-kind-" + k }, [
        radio, h("span", {}, [h("strong", { text: KIND_TEXT[k][0] }), h("span", { class: "muted", text: " " + KIND_TEXT[k][1] })])
      ]));
    });

    var types = h("datalist", { id: "info-docType-list" }, M().DOC_TYPES.map(function (t) { return h("option", { value: t }); }));

    // The cover title is split automatically unless the author sets the lines.
    var lines = h("textarea", { id: "info-coverTitleLines", rows: "3" });
    lines.value = (d.info.coverTitleLines || []).join("\n");
    function commitLines() {
      var v = lines.value.split("\n").map(function (s) { return s.trim(); }).filter(function (s) { return !!s; }).slice(0, 3);
      if (JSON.stringify(v) === JSON.stringify(d.info.coverTitleLines || [])) return;
      if (v.length) d.info.coverTitleLines = v; else delete d.info.coverTitleLines;
      changed();
    }
    on(lines, "input", commitLines); on(lines, "change", commitLines);
    var linesField = d.kind === "report" ? h("div", { class: "field dp-wide" }, [
      h("label", { for: "info-coverTitleLines", text: "Title lines on the cover" }), lines,
      h("div", { class: "hint", text: "Leave empty to split the title automatically, or type up to three lines." })
    ]) : null;

    main.appendChild(card("Document", null, [h("div", { class: "dp-info" }, [
      h("div", { class: "dp-info-fields" }, [
        kinds,
        h("div", { class: "grid-2" }, [
          field("title", true), field("docType"), field("reference"), field("client"), field("site"),
          field("author"), field("revision"), field("date"), linesField
        ]),
        types
      ]),
      mini.el
    ])], "dp-card-document"));

    function option(key, label, hint, off) {
      var box = h("input", { type: "checkbox", id: "opt-" + key });
      box.checked = !!d.options[key] && !off;
      box.disabled = !!off;
      on(box, "change", function () { d.options[key] = box.checked; changed({ structure: true }); });
      return h("label", { class: "dp-option", for: "opt-" + key }, [box, h("span", {}, [label, h("span", { class: "muted", text: " " + hint })])]);
    }
    var isShort = d.kind === "short";
    main.appendChild(card("Document control", null, [
      isShort ? h("p", { class: "muted", id: "dp-control-note", text: "A short document prints no document control page. If set, the issued date replaces the date under the title." }) : null,
      h("div", { class: "grid-2" }, [field("qaReviewBy"), field("authorisedBy"), field("issuedTo"), field("issuedDate"), field("classification")]),
      h("div", { class: "dp-options" }, [
        option("numberHeadings", "Number the headings.", "As 1, 1.1 and 1.1.1."),
        option("contents", "Add a contents list.", isShort ? "For a report only." : "Level 1 and 2 headings, without page numbers.", isShort)
      ])
    ], "dp-card-control"));

    main.appendChild(fileCard(d));
    mini.refresh();
    if (arg && arg.field) {
      var target = document.getElementById("info-" + arg.field);
      if (target) { target.focus(); if (target.select) target.select(); }
    }
  }

  // A framed picture of the cover, kept in step with the fields. It is hidden
  // from a screen reader, which gets the line of text under it. The capitals
  // on it are the Word cover's own.
  function coverMini(d) {
    var page = h("div", { class: "dp-mini-page" });
    var line = h("p", { class: "dp-mini-line muted", id: "dp-cover-line" });
    var label = h("div", { class: "dp-mini-label", id: "dp-cover-label" });
    var frame = h("div", { class: "dp-mini-frame", "aria-hidden": "true" }, [page]);
    var el = h("div", { class: "dp-mini", id: "dp-cover-mini" }, [label, frame, line]);
    function refresh() {
      var report = d.kind === "report", i = d.info || {};
      label.textContent = report ? "Cover as it will print" : "Opening as it will print";
      page.textContent = "";
      page.style.zoom = "";
      frame.className = "dp-mini-frame" + (report ? " is-cover" : "");
      // Only a cover is a whole page at a fixed size. A short document's
      // opening is ordinary text that wraps inside the frame.
      page.className = "dp-mini-page" + (report ? " cover-mini" : "");
      var drawn = report ? A.DocRender.coverEl(d) : A.DocRender.shortHeadEl(d);
      if (drawn) {
        page.appendChild(drawn);
        // The cover is drawn at its printed size and the whole page is scaled
        // to the frame. It is measured as it shows, so a cover that a
        // stylesheet has already made small is left alone.
        var w = drawn.getBoundingClientRect().width, room = frame.clientWidth;
        if (report && room > 0 && w > room + 1) page.style.zoom = String(room / w);
      }
      if (!report) {
        // Only what a short document prints: its title, then the writer's own
        // line of client, revision and date. No document type, and no
        // revision when none is set.
        var under = A.HouseDocx.shortHeadLine(d).split(/\s*·\s*/).join(", ");
        var title = String(i.title || "").trim();
        line.textContent = "A short document has no cover. It opens with: " + (title || "a red prompt for the title") + (under ? ", then " + under : "") + ".";
        return;
      }
      var bits = [i.docType || "Document", i.title || "Untitled document"];
      if (i.client) bits.push(i.client);
      bits.push("revision " + (i.revision || "0.1"));
      line.textContent = "Cover: " + bits.join(", ");
    }
    return { el: el, refresh: refresh };
  }

  function fileCard(d) {
    var size = M().sizeOf(d) || 0, L = M().LIMITS;
    var name = A.DocStorage && A.DocStorage.currentName ? A.DocStorage.currentName() : "";
    return card("File", null, [
      h("p", { id: "dp-file-name", text: name ? "Save writes to " + name + "." : "Save will ask where to keep the file." }),
      h("p", { id: "dp-file-size", text: "Pictures and kept content: " + bytesText(size) + "." }),
      size > L.warnBytes ? h("p", { class: "dp-warn", id: "dp-file-warn", text: "This is over " + mb(L.warnBytes) + ". It still saves, but slowly. Nothing more can be added past " + mb(L.refuseBytes) + "." }) : null
    ], "dp-card-file");
  }

  // ---------- preview ----------
  // Draft or Final as last chosen on the Issue page, so the preview's Status
  // row says what the export will. Kept per document.
  var chosen = { id: "", status: "draft" };
  function status(d) { return chosen.id === d.id ? chosen.status : "draft"; }

  function preview(main) {
    var d = doc();
    if (!d) { welcome(main); return; }
    head(main, "Preview");
    main.appendChild(h("p", { class: "dp-note", id: "dp-preview-note", text: "Word decides the page breaks. Drawings from an imported file show here as placeholders." }));
    var paper = h("div", { class: "dp-preview", id: "dp-preview" });
    main.appendChild(paper);

    // The shared renderer lays the document out on sheets (App.DocPreview.draw,
    // the same one the assessment and risk tools' Word previews use): the
    // front matter as whole sheets, then the body, a page break or a change
    // of orientation starting a new sheet, each sheet's footnotes at its end,
    // and a contents entry going to its heading. "dp-sheet paper" keep the
    // sheets' old names for this tool's own rules and tests.
    var R = A.DocRender, front = [];
    if (d.kind === "report") {
      front.push({ part: "cover", el: R.coverEl(d) });
      front.push({ part: "control", el: R.controlEl(d, status(d)) });
      if (d.options && d.options.contents) front.push({ part: "contents", el: R.contentsEl(d) });
    }
    A.DocPreview.draw(paper, d, {
      front: front, sheetClass: "dp-sheet paper",
      lead: d.kind === "short" ? R.shortHeadEl(d) : null,
      // One list numbering rule, the writer's own (3.2).
      numbers: A.HouseDocx.listNumbers(d.blocks || [])
    });
  }

  // ---------- Issue and export ----------
  var CONTROL_FIELDS = ["qaReviewBy", "authorisedBy", "issuedTo", "issuedDate"];

  // Things worth a second look that never stop an export.
  // [{ text, label?, run? }]
  function worth(d) {
    var out = [], i = d.info || {};
    function show(ids) {
      return function () { D().go("edit", ids.length === 1 ? { blockId: ids[0] } : { blockIds: ids }); };
    }
    if (d.kind === "report") {
      // The cover strip always prints its Author label, so a blank author
      // leaves the label on the cover with nothing after it.
      if (!String(i.author || "").trim()) {
        out.push({ code: "blank-author", text: "Author is blank on the cover.", label: "Go to it", run: function () { D().go("info", { field: "author" }); } });
      }
      CONTROL_FIELDS.forEach(function (k) {
        if (String(i[k] || "").trim()) return;
        // With no date either, the cover prints its revision with no date after it.
        var both = k === "issuedDate" && !String(i.date || "").trim();
        out.push({ code: "blank-" + k, text: LABELS[k] + " is blank in document control" + (both ? ", and with Date blank as well the cover prints no date." : "."), label: "Go to it", run: function () { D().go("info", { field: k }); } });
      });
      // The cover is one page whatever is typed on it (the writer's estimate).
      if (A.DocExport && A.DocExport.coverCut && A.DocExport.coverCut(d)) {
        out.push({ code: "cover-long", text: "The cover has more text than its page holds, so some of it will be cut off. Shorten the title or the other cover lines.", label: "Go to it", run: function () { D().go("info", { field: "title" }); } });
      }
    }
    var noAlt = [], wide = [];
    walk(d, function (b) {
      if (b.type === "picture" && !String(b.alt || "").trim()) noAlt.push(b.id);
      if (b.type === "table" && !b.land && (b.cols || []).length > 6) wide.push(b.id);
    });
    if (noAlt.length) out.push({ code: "no-alt", text: plural(noAlt.length, "picture has", "pictures have") + " no alternative text for someone who cannot see " + (noAlt.length === 1 ? "it" : "them") + ".", label: "Show", run: show(noAlt) });
    if (wide.length) out.push({ code: "wide-table", text: plural(wide.length, "table has", "tables have") + " more than six columns on a portrait page. A landscape page may read better.", label: "Show", run: show(wide) });
    var fit = tooWide(d);
    if (fit.length) out.push({ code: "fitted", text: plural(fit.length, "drawing is", "drawings are") + " wider than the space " + (fit.length === 1 ? "it sits" : "they sit") + " in and will be made smaller to fit. Any text inside " + (fit.length === 1 ? "it" : "them") + " is made smaller too, so check " + (fit.length === 1 ? "it" : "them") + " in a draft in Word.", label: "Show", run: show(fit) });
    var tall = tooTall(d).filter(function (id) { return fit.indexOf(id) === -1; });
    if (tall.length) out.push({ code: "tall", text: plural(tall.length, "picture or drawing is", "pictures or drawings are") + " taller than a page and will be made smaller to fit.", label: "Show", run: show(tall) });
    // What the import changed that a reader of the document would trip over.
    var rep = d.importReport;
    ["list-numbering", "heading-numbers"].forEach(function (code) {
      var e = rep && (rep.changed || []).filter(function (x) { return x.code === code; })[0];
      if (!e) return;
      var ids = (e.blockIds || []).filter(function (id) { return exists(d, id); });
      out.push({ code: code, text: A.DocImportFlow.sentence(e), label: ids.length ? "Show" : null, run: ids.length ? show(ids) : null });
    });
    return out;
  }

  var issueSeq = 0;
  function issue(main) {
    var d = doc();
    if (!d) { welcome(main); return; }
    head(main, "Issue and export", "Check what is still to complete, then export.");
    var seq = ++issueSeq;

    var todo = h("div", { id: "dp-todo", "aria-live": "polite" }, [h("p", { class: "muted", text: "Checking the document..." })]);
    main.appendChild(card("Still to complete", null, [todo], "dp-card-todo"));

    var looks = worth(d);
    main.appendChild(card("Worth a look", "These never stop an export", [
      looks.length ? h("ul", { class: "dp-list", id: "dp-worth" }, looks.map(function (w) {
        return h("li", { "data-code": w.code }, [h("span", { class: "dp-list-t", text: w.text }), w.run ? rowBtn(w.label, w.text, w.run) : null]);
      })) : h("p", { class: "muted", id: "dp-worth-none", text: "Nothing to mention." })
    ], "dp-card-worth"));

    // Export
    var st = status(d);
    var why = h("p", { class: "dp-warn hidden", id: "dp-final-why", role: "status" });
    var nameLine = h("p", { class: "muted", id: "dp-export-name" });
    var go = btn("Export Word", "primary", function () {
      go.disabled = true;
      A.DocExport.word(status(d)).then(function () { if (go.isConnected) sync(); });
    }, "dp-export");
    // null until the check has answered. Final waits for it: the check is the
    // build, and only the build knows what would print red.
    var outstanding = null, checkError = "";
    function sync() {
      var s = status(d), reason = "";
      if (s === "final") {
        var lost = (M().missing(d) || []).length;
        if (outstanding === null && !checkError) reason = "Checking the document...";
        else if (checkError) reason = "Final is not available: the check could not be run. " + checkError;
        else if (lost) reason = "Final is not available: " + plural(lost, "picture or drawing", "pictures or drawings") + " could not be restored. Bring " + (lost === 1 ? "it" : "them") + " back from the saved file, or replace or delete " + (lost === 1 ? "it" : "them") + ".";
        else if (outstanding > 0) reason = "Final is not available: " + plural(outstanding, "thing is", "things are") + " still to complete.";
      }
      go.disabled = !!reason;
      why.textContent = reason;
      why.className = "dp-warn" + (reason ? "" : " hidden");
      nameLine.textContent = "The file will be called " + A.DocExport.filename(d, s) + ".";
    }
    var radios = h("fieldset", { class: "dp-kinds", id: "dp-status" }, [h("legend", { text: "Export as" })]);
    [["draft", "Draft", "Draft watermark. Anything still to complete prints red."],
     ["final", "Final", "Opens read-only, marked as final. Needs nothing left to complete."]
    ].forEach(function (o) {
      var radio = h("input", { type: "radio", name: "dp-status", id: "dp-status-" + o[0], value: o[0] });
      radio.checked = st === o[0];
      on(radio, "change", function () { if (radio.checked) { chosen = { id: d.id, status: o[0] }; sync(); } });
      radios.appendChild(h("label", { class: "dp-kind", for: "dp-status-" + o[0] }, [
        radio, h("span", {}, [h("strong", { text: o[1] }), h("span", { class: "muted", text: " " + o[2] })])
      ]));
    });
    main.appendChild(card("Export", null, [radios, h("div", { class: "btn-row dp-export-row" }, [go]), why, nameLine], "dp-card-export"));
    sync();

    A.DocExport.issues().then(function (list) {
      if (seq !== issueSeq || !todo.isConnected) return;
      outstanding = list.length;
      todo.textContent = "";
      if (!list.length) {
        todo.appendChild(h("p", { id: "dp-todo-none", text: "Nothing is outstanding." }));
      } else {
        todo.appendChild(h("p", { class: "muted", id: "dp-todo-count", text: plural(list.length, "thing", "things") + " still to complete. Final is refused until none is left." }));
        todo.appendChild(h("ul", { class: "dp-list", id: "dp-todo-list" }, list.map(function (p) {
          var where = p.where || {};
          var run = where.kind === "info" ? function () { D().go("info", { field: where.field }); }
            : where.blockId ? function () { D().go("edit", { blockId: where.blockId }); } : null;
          return h("li", { "data-kind": where.kind || "", "data-block": where.blockId || null, "data-field": where.field || null }, [
            h("span", { class: "dp-list-t dp-red", text: p.text }), run ? rowBtn("Go to it", p.text, run) : null
          ]);
        })));
      }
      sync();
    }, function (err) {
      if (seq !== issueSeq || !todo.isConnected) return;
      checkError = (err && err.message) || "Something went wrong.";
      todo.textContent = "";
      todo.appendChild(h("p", { class: "dp-warn", id: "dp-todo-error", text: "The check could not be run. " + checkError }));
      sync();
    });
  }

  // ---------- import report ----------
  // One delete that Undo brings back: recorded in the editor's history before
  // the blocks go, in the shape App.DocHistory replays.
  function removeBlocks(d, ids, label) {
    var before = [];
    ids.forEach(function (id) {
      var f = M().find(d, id);
      if (f && f.block) before.push({ id: id, index: f.index, parent: null, json: JSON.stringify(f.block) });
    });
    if (!before.length) return 0;
    var gone = before.map(function (b) { return b.id; }), after = [];
    M().remove(d, gone);
    // A document is never left with nothing in it: there would be nowhere to
    // type (as when the editor deletes the last block). The paragraph is part
    // of the same step, so Undo takes it away again.
    if (!d.blocks.length) {
      var p = M().make.paragraph(d, "");
      d.blocks.push(p);
      after.push({ id: p.id, index: 0, parent: null, json: JSON.stringify(p) });
    }
    A.DocHistory.record({ label: label, before: before, after: after, selBefore: null, selAfter: null });
    D().touched({ structure: true });
    // The editor keeps its sheet between visits, so it is told as well.
    if (A.DocEditor && A.DocEditor.redraw) { try { A.DocEditor.redraw(gone.concat(after.map(function (a) { return a.id; }))); } catch (e) {} }
    return before.length;
  }

  // The original's SolutionsPT cover and document control (importReport.front):
  // taken out at import, kept on the report until the user chooses. Whether
  // they are in the body is read from the body, so Undo and Redo on the Edit
  // page keep the card right.
  function frontKept(d, fr) { return (fr.blocks || []).some(function (b) { return exists(d, b.id); }); }
  // Puts them back at the top of the body as they were, as one step Undo takes away.
  function keepFront(d, fr) {
    var after = [];
    (fr.blocks || []).forEach(function (b) {
      if (exists(d, b.id)) return;
      var copy = JSON.parse(JSON.stringify(b)), at = after.length;
      d.blocks.splice(at, 0, copy);
      after.push({ id: copy.id, index: at, parent: null, json: JSON.stringify(copy) });
    });
    if (!after.length) return 0;
    A.DocHistory.record({ label: "Keep the original cover and document control", before: [], after: after, selBefore: null, selAfter: null });
    D().touched({ structure: true });
    if (A.DocEditor && A.DocEditor.redraw) { try { A.DocEditor.redraw(after.map(function (a) { return a.id; })); } catch (e) {} }
    return after.length;
  }
  // Takes them out again (as they now are, in case they were edited) and
  // fills any Document information field that is still empty.
  function useTemplateFront(d, fr) {
    fr.blocks = (fr.blocks || []).map(function (b) {
      var f = M().find(d, b.id);
      return f && f.list === d.blocks ? JSON.parse(JSON.stringify(f.block)) : b;
    });
    var n = removeBlocks(d, fr.blocks.map(function (b) { return b.id; }).filter(function (id) { return exists(d, id); }), "Use the current template's cover and document control");
    var filled = 0;
    (fr.fields || []).forEach(function (p) {
      if (String(d.info[p[0]] || "").trim()) return;
      d.info[p[0]] = p[1]; filled++;
    });
    if (filled) D().touched({ info: true });
    return n;
  }
  function frontCard(d, main, fr) {
    var kept = frontKept(d, fr), kids = [];
    if (!kept) {
      kids.push(h("p", { class: "dp-entry-t", text: "The original's cover and document control page were replaced by the template's, filled in from them." }));
      if ((fr.fields || []).length) {
        kids.push(h("p", { class: "muted dp-entry-said", text: "Filled in under Document information:" }));
        kids.push(h("ul", { class: "dp-quotes", id: "dp-front-fields" }, fr.fields.map(function (p) {
          return h("li", { "data-field": p[0], text: (LABELS[p[0]] || p[0]) + ": " + p[1] });
        })));
      }
      if ((fr.unused || []).length) {
        kids.push(h("p", { class: "muted dp-entry-said", text: "Not used (no matching field):" }));
        kids.push(h("ul", { class: "dp-quotes", id: "dp-front-unused" }, fr.unused.map(function (p) { return h("li", { text: p[0] + ": " + p[1] }); })));
      }
      if (fr.contents) kids.push(h("p", { text: "Its contents list was replaced too." }));
      kids.push(h("div", { class: "btn-row" }, [
        btn("Keep the original pages instead", "small", function () {
          var n = keepFront(d, fr);
          if (n) D().toast("The original pages are back. Undo on the Edit page removes them.");
          redraw(main, report);
        }, "dp-front-keep"),
        btn("Go to Document information", "small", function () { D().go("info"); }, "dp-front-info")
      ]));
    } else {
      kids.push(h("p", { class: "dp-entry-t", text: "The original's cover and document control page are back at the start, after the template's own." }));
      var ids = fr.blocks.map(function (b) { return b.id; }).filter(function (id) { return exists(d, id); });
      kids.push(h("div", { class: "btn-row" }, [
        rowBtn("Show", "the original cover and document control", function () { D().go("edit", ids.length === 1 ? { blockId: ids[0] } : { blockIds: ids }); }),
        btn("Use the current template's pages", "small", function () {
          var n = useTemplateFront(d, fr);
          if (n) D().toast("The original pages were removed. Undo on the Edit page brings them back.");
          redraw(main, report);
        }, "dp-front-use")
      ]));
    }
    return card("SolutionsPT cover and document control recognised", null, kids, "dp-card-front");
  }

  function entryRow(d, entry, extra) {
    var ids = (entry.blockIds || []).filter(function (id) { return exists(d, id); });
    var words = A.DocImportFlow.sentence(entry);
    var kids = [h("p", { class: "dp-entry-t", text: words })];
    var ex = (entry.examples || []).filter(function (x) { return !!String(x || "").trim(); });
    if (ex.length) {
      kids.push(h("p", { class: "muted dp-entry-said", text: "The original said:" }));
      kids.push(h("ul", { class: "dp-quotes" }, ex.map(function (x) { return h("li", { text: String(x) }); })));
    }
    var row = h("div", { class: "btn-row" }, [
      ids.length ? rowBtn("Show", words, function () { D().go("edit", ids.length === 1 ? { blockId: ids[0] } : { blockIds: ids }); }) : null
    ].concat(extra ? extra(ids) : []));
    if (row.childNodes.length) kids.push(row);
    return h("li", { class: "dp-entry", "data-code": entry.code }, kids);
  }

  function drawingRow(d, it, total) {
    var b = it.block, lines = [], title;
    if (b.type === "kept") {
      title = "Drawing " + it.kept + " of " + total;
      lines.push(b.description || [KEPT_NAMES[b.kind] || KEPT_NAMES.other, sizeText(b)].filter(Boolean).join(", "));
      if (b.kind === "ole") lines.push("An embedded file, kept unopened.");
      if (b.floating) lines.push("Floats beside the text.");
    } else {
      title = "Picture";
      var m = it.media, type = m && m.type ? String(m.type).replace(/^image\/(x-)?/, "").toUpperCase() : "";
      if (!m || m.missing) lines.push("It could not be restored.");
      else lines.push([type + " picture", sizeText(b), m.name].filter(Boolean).join(", ") + ". Shown as a placeholder.");
    }
    if (b.label) lines.push("Named in the Word file: " + b.label);
    if (b.text) lines.push("Text inside it: " + String(b.text).slice(0, 160));
    if (b.caption) lines.push("Caption: " + b.caption);
    lines.push(it.cell ? "In a table" + (it.under ? " under: " + it.under : "") : it.under ? "Under: " + it.under : "Before the first heading");
    return h("li", { class: "dp-entry dp-drawing", "data-block": b.id, "data-type": b.type }, [
      h("div", { class: "dp-drawing-t" }, [h("strong", { text: title })].concat(lines.map(function (t) { return h("div", { text: t }); }))),
      rowBtn("Show", title + (b.type === "kept" ? "" : " " + ((it.media && it.media.name) || "")), function () { D().go("edit", { blockId: b.id }); })
    ]);
  }

  function report(main) {
    var d = doc();
    if (!d) { welcome(main); return; }
    var rep = d.importReport;
    if (!rep) {
      head(main, "Import report");
      main.appendChild(h("p", { id: "dp-report-none", text: "This document was not imported from Word." }));
      return;
    }
    var src = rep.source || {};
    head(main, "Import report", src.name ? "What changed when " + src.name + " was rebuilt in the template." : "What changed when the Word file was rebuilt in the template.");
    main.appendChild(h("p", { class: "dp-summary", id: "dp-report-summary", text: A.DocImportFlow.summary(rep) }));
    main.appendChild(h("div", { class: "btn-row dp-report-go" }, [
      btn("Go to the document", "primary", function () { D().go("edit"); }, "dp-report-edit"),
      h("span", { class: "muted", text: "You can come back to this report from the sidebar." })
    ]));

    if (rep.front && (rep.front.blocks || []).length) main.appendChild(frontCard(d, main, rep.front));

    // Someone else's cover: offered for removal, never taken out unasked.
    (rep.toCheck || []).filter(function (e) { return e.code === "cover-like"; }).forEach(function (entry) {
      var listed = (entry.blockIds || []).length;
      var left = (entry.blockIds || []).filter(function (id) { return exists(d, id); });
      var body = listed && !left.length
        ? h("p", { class: "dp-entry-t", text: "The blocks of the original's first page have been removed. Undo on the Edit page brings them back." })
        : h("ul", { class: "dp-entries" }, [entryRow(d, entry, function (ids) {
          if (!ids.length) return [];
          return [btn("Remove these blocks", "small danger", function () {
            var n = removeBlocks(d, ids, "Remove the original's first page");
            D().toast(plural(n, "block", "blocks") + " removed. Undo on the Edit page brings " + (n === 1 ? "it" : "them") + " back.");
            redraw(main, report);
          }, "dp-cover-remove")];
        })]);
      main.appendChild(card("The first page looks like a cover", null, [body], "dp-card-cover"));
    });

    var check = (rep.toCheck || []).filter(function (e) { return e.code !== "cover-like"; });
    if (check.length) {
      main.appendChild(card("Check first", null, [h("ul", { class: "dp-entries" }, check.map(function (entry) {
        var listed = (entry.blockIds || []).length;
        var left = (entry.blockIds || []).filter(function (id) { return exists(d, id); });
        if (entry.code === "front-matter" && listed && !left.length) {
          return h("li", { class: "dp-entry", "data-code": entry.code }, [
            h("p", { class: "dp-entry-t", text: "The blocks before the original's first heading have been removed. Undo on the Edit page brings them back." })
          ]);
        }
        return entryRow(d, entry, function (ids) {
          if (entry.code !== "front-matter" || !ids.length) return [];
          return [btn(ids.length === 1 ? "Remove it" : "Remove them", "small danger", function () {
            var n = removeBlocks(d, ids, "Remove the original's opening blocks");
            D().toast(plural(n, "block", "blocks") + " removed. Undo on the Edit page brings " + (n === 1 ? "it" : "them") + " back.");
            redraw(main, report);
          }, "dp-front-remove")];
        });
      }))], "dp-card-check"));
    }

    var not = rep.notCarried || [];
    main.appendChild(card("Not carried over", null, [
      not.length ? h("ul", { class: "dp-entries" }, not.map(function (e) { return entryRow(d, e); }))
        : h("p", { class: "muted", text: "Nothing was left out." })
    ], "dp-card-not"));

    var ch = rep.changed || [];
    main.appendChild(card("Carried over with changes", null, [
      ch.length ? h("ul", { class: "dp-entries" }, ch.map(function (e) { return entryRow(d, e); }))
        : h("p", { class: "muted", text: "Nothing was changed." })
    ], "dp-card-changed"));

    var list = drawings(d);
    main.appendChild(card("Pictures and drawings", null, list.length ? [
      h("p", { id: "dp-drawings-note", text: "Drawings from the Word file show only in Word." }),
      h("div", { class: "btn-row" }, [btn("Export a draft to check in Word", "", function () { A.DocExport.word("draft"); }, "dp-report-draft")]),
      h("ul", { class: "dp-entries", id: "dp-drawings" }, list.map(function (it) { return drawingRow(d, it, list.keptTotal); }))
    ] : [h("p", { class: "muted", id: "dp-drawings-none", text: "Nothing here needs checking in Word." })], "dp-card-drawings"));
  }

  // ---------- about ----------
  var LEGAL_NOTICE = "© 2026 SolutionsPT. All rights reserved. Proprietary and confidential. " +
    "Licensed only for work commissioned by SolutionsPT; it may not be resold, shared or used for any other client or purpose. See the licence below for the full terms.";
  // The editor's keys, for the reader. Keep it in step with the keyboard map
  // in editor.js.
  var KEYS = [
    ["Enter", "New block. In an empty list item, leaves the list."],
    ["Shift+Enter", "Line break."],
    ["Ctrl+B, Ctrl+I, Ctrl+U", "Bold, italic, underline."],
    ["Ctrl+Shift+X", "Strikethrough."],
    ["Ctrl+. and Ctrl+,", "Superscript and subscript."],
    ["Ctrl+Space", "Clears red."],
    ["Ctrl+K", "Link."],
    ["Ctrl+Alt+1, 2, 3 and Ctrl+Alt+0", "Heading 1, 2, 3 and paragraph."],
    ["Ctrl+Shift+8 and Ctrl+Shift+7", "Bulleted list and numbered list."],
    ["Tab and Shift+Tab", "Indent and outdent in a list; next and previous cell in a table. To leave the page, press Escape, then Tab."],
    ["Ctrl+Enter", "Page break."],
    ["Alt+Shift+Up and Down", "Moves the selected blocks."],
    ["Ctrl+Z, Ctrl+Y", "Undo and redo."],
    ["Ctrl+A", "Selects the block's text, then every block."],
    ["Escape", "Steps out from the text to the block, then to the outline."],
    ["F6", "Moves between the sidebar, the toolbar and the page."],
    ["Ctrl+F", "Find."]
  ];
  function about(main) {
    var V = A.Version || {};
    head(main, "About");
    main.appendChild(card((V.product || (A.Product && A.Product.name) || "") + " " + (V.label || ""), V.number ? "version " + V.number : null, [
      h("p", { text: "Works offline. Your document file holds client data." }),
      h("p", { text: "Opens " + M().SCHEMA + " document files and Word files (.docx). Exports Word files in the SolutionsPT template." })
    ], "dp-card-about"));
    var keys = [];
    KEYS.forEach(function (k) { keys.push(h("dt", { text: k[0] }), h("dd", { text: k[1] })); });
    main.appendChild(card("Keyboard", "on the Edit page", [h("dl", { class: "dp-keys" }, keys)]));
    main.appendChild(card("Copyright and licence", null, [
      h("p", { text: LEGAL_NOTICE }), h("div", { class: "dp-licence", text: (A.Data && A.Data.licence) || "" })
    ]));
  }

  A.DocPages = {
    info: info, preview: preview, issue: issue, report: report, about: about, welcome: welcome,
    // For the Issue page's tests and for the shell, should it want the counts.
    worth: worth, drawings: drawings,
    // Save as into another file gives the document a new id (App.DocStorage):
    // the Draft or Final last chosen for it goes with it.
    moved: function (oldId, newId) { if (chosen.id && chosen.id === oldId) chosen = { id: newId, status: chosen.status }; }
  };
})();
