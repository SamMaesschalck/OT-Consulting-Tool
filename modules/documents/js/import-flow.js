/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* import-flow.js: App.DocImportFlow, runs a Word import and words its report
 * (docs/document-tool-design.md 5.2, 5.6).
 *
 * The reading is App.DocxImport's. This file runs it behind a progress panel,
 * opens the result as a new document and turns the report's codes into
 * sentences. start() takes a File and nothing else, on purpose: an import
 * never learns the Word file's handle, so Save can never write over the
 * customer's .docx.
 */
(function () {
  "use strict";
  var A = window.App = window.App || {};

  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function was(n) { return n === 1 ? "was" : "were"; }

  // One sentence per report code (4.4, "The import report"). Each takes the
  // entry and is written so that it reads properly for 1 and for many. A code
  // with no count worth saying (the house style always replaces formatting)
  // ignores it.
  var SENTENCES = {
    // toCheck
    "cover-like": function (e) {
      return "The original's first page, before its first page break, has large type or a large picture and few words, so it may be a cover. " +
        "The template prints its own cover. Remove " + (e.count === 1 ? "it" : "these blocks") + " if you do not need " + (e.count === 1 ? "it" : "them") + ".";
    },
    "front-matter": function (e) {
      return "The original starts with " + plural(e.count, "block", "blocks") + " before its first heading. " +
        "This is often its own cover, document control table or contents list, which the template now provides. " +
        "Check whether you still need " + (e.count === 1 ? "it" : "them") + ".";
    },
    // notCarried
    "comments": function (e) {
      return plural(e.count, "comment", "comments") + " " + was(e.count) + " not carried over.";
    },
    "headers-footers": function () {
      return "Headers and footers were not carried over. The SolutionsPT header and footer replace them.";
    },
    "contents": function () {
      return "The table of contents was not carried over. A contents list of the headings is switched on in its place; " +
        "you can switch it off under Document information.";
    },
    "figures-list": function (e) {
      return (e.count > 1 ? plural(e.count, "list", "lists") + " of figures or tables were" : "A list of figures or tables was") +
        " not carried over. The template has none to put in " + (e.count > 1 ? "their" : "its") +
        " place. The captions themselves were kept.";
    },
    "cover-page": function () {
      return "The original's cover page was not carried over. The template's cover replaces it.";
    },
    "internal-links": function (e) {
      return plural(e.count, "link", "links") + " to a place inside the document " + was(e.count) +
        " not carried over. The text of each was kept.";
    },
    "other-links": function (e) {
      return plural(e.count, "link", "links") + " to a file or to another address that is not a web or email address " +
        was(e.count) + " not carried over. The text of each was kept.";
    },
    "picture-links": function (e) {
      return plural(e.count, "picture or drawing", "pictures or drawings") + " had a link on " + (e.count === 1 ? "it" : "them") +
        ". " + (e.count === 1 ? "It was" : "They were") + " kept, but without the link.";
    },
    "links-in-drawings": function (e) {
      return plural(e.count, "link", "links") + " inside a drawing or a text box pointed somewhere other than a web or email address and " +
        was(e.count) + " removed. The words and shapes were kept.";
    },
    "hidden-text": function (e) {
      return plural(e.count, "piece", "pieces") + " of hidden text " + was(e.count) + " left out. " +
        "Word does not show or print hidden text, so the original did not show " + (e.count === 1 ? "it" : "them") +
        " either. Type in anything you do want.";
    },
    "controls": function (e) {
      return plural(e.count, "form or ActiveX control", "form or ActiveX controls") + " " + was(e.count) +
        " not carried over. Active content is never brought across.";
    },
    "macros": function () {
      return "The file's macros were not carried over. Active content is never brought across.";
    },
    "fields-no-text": function (e) {
      return plural(e.count, "field", "fields") + " that Word works out as it prints (such as an automatic clause number or an " +
        "old-style equation) had no text to keep. Type in what " + (e.count === 1 ? "it" : "they") + " showed.";
    },
    "objects-in-notes": function (e) {
      // The reader says how many of them were tables, whose words it keeps as lines of the note.
      var tables = typeof e.tables === "number" ? e.tables : 0;
      return plural(e.count, "picture, drawing or table", "pictures, drawings or tables") + " inside a footnote or endnote " +
        was(e.count) + " not carried over. The note's text was kept." +
        (tables ? " The words in " + (tables === 1 ? "the table" : "each table") + " are now lines of the note." : "");
    },
    "notes-missing": function (e) {
      return plural(e.count, "footnote or endnote reference", "footnote or endnote references") +
        " pointed at a note that is not in the Word file and " + was(e.count) + " removed.";
    },
    "embedded-chunks": function (e) {
      return plural(e.count, "file placed inside the document as a chunk", "files placed inside the document as chunks") +
        " " + was(e.count) + " not carried over.";
    },
    "objects-lost": function (e) {
      return plural(e.count, "picture or drawing", "pictures or drawings") + " could not be brought across because part of " +
        (e.count === 1 ? "it" : "them") + " is missing from the Word file.";
    },
    // Only for a drawing that stayed: one that was left out is under objects-lost.
    "unreadable-part": function (e) {
      return plural(e.count, "drawing refers", "drawings refer") + " to something that is missing from the Word file. " +
        (e.count === 1 ? "It was" : "They were") + " kept, but may not look right. Check in a draft.";
    },
    "theme-missing": function () {
      return "The original's theme (its set of colours and fonts) could not be read. Drawings kept as they were may show " +
        "other colours. Check in a draft.";
    },
    // changed
    "tracked-changes": function (e) {
      // The reader gives the two counts apart; a file saved before it did has the total only.
      var ins = e.insertions, del = e.deletions;
      if (typeof ins === "number" && typeof del === "number") {
        return "Tracked changes were settled: " + plural(ins, "insertion", "insertions") + " accepted and " +
          plural(del, "deletion", "deletions") + " removed.";
      }
      return plural(e.count, "tracked change", "tracked changes") + " " + was(e.count) +
        " settled: insertions were accepted and deleted text was removed.";
    },
    "floating-pictures": function (e) {
      return plural(e.count, "picture", "pictures") + " that floated beside the text " + was(e.count) +
        " put in line, where " + (e.count === 1 ? "it was" : "they were") + " anchored.";
    },
    "floating-drawings": function (e) {
      return plural(e.count, "drawing", "drawings") + " that floated over or beside the text still " +
        (e.count === 1 ? "floats, anchored where it was" : "float, anchored where they were") +
        ". The text round " + (e.count === 1 ? "it" : "them") + " now has the house fonts and spacing, so check where " +
        (e.count === 1 ? "it sits" : "they sit") + " in a draft.";
    },
    "inline-objects": function (e) {
      return plural(e.count, "drawing or equation", "drawings or equations") + " that sat inside a line of text now " +
        (e.count === 1 ? "follows its" : "follow their") + " paragraph.";
    },
    // The address is shown with the line (the entry's examples).
    "linked-pictures": function (e) {
      return (e.count === 1 ? "A picture" : plural(e.count, "picture", "pictures")) + " linked to a file or web address outside the document " +
        was(e.count) + " left out, because Word would fetch " + (e.count === 1 ? "it" : "them") + " when the file is opened. " +
        (e.count === 1 ? "Insert the picture itself if it is needed." : "Insert the pictures themselves if they are needed.");
    },
    "linked-objects": function (e) {
      return (e.count === 1 ? "A link" : plural(e.count, "link", "links")) + " from a chart or an object to a file outside the document " +
        was(e.count) + " left out, because Word would fetch that file when the document is opened. " +
        "A chart keeps the figures it showed; an object that was only a link was left out.";
    },
    "heading-numbers": function (e) {
      // The reader says how many headings had no number and how many references were kept as text.
      var heads = typeof e.headings === "number" ? e.headings : 0, refs = typeof e.references === "number" ? e.references : 0;
      var s = "The headings are numbered again from 1, in order.";
      if (heads) {
        s += " " + plural(heads, "heading", "headings") + " that had no number in the original now " +
          (heads === 1 ? "has" : "have") + " one, so the numbers after " + (heads === 1 ? "it" : "them") + " have moved.";
      }
      if (refs) {
        s += " " + plural(refs, "cross-reference", "cross-references") + " to a section or a page " + was(refs) +
          " kept as the text " + (refs === 1 ? "it" : "they") + " showed, which may now be the wrong number.";
      }
      return s + " Check every reference to a section or page number in the text. Heading numbers can be switched off " +
        "under Document information, for every heading at once.";
    },
    "headings-deeper": function (e) {
      return plural(e.count, "heading", "headings") + " below level 3 became " +
        (e.count === 1 ? "a level 3 heading" : "level 3 headings") + ".";
    },
    "lists-deeper": function (e) {
      return plural(e.count, "list item", "list items") + " deeper than three levels " + was(e.count) +
        " brought up to the third level.";
    },
    "list-numbering": function (e) {
      return plural(e.count, "numbered item", "numbered items") + " may not show the number the original showed " +
        "(letters or a custom label, or a start other than 1). Check any reference to " +
        (e.count === 1 ? "it" : "them") + " in the text, such as \"see 4(b)\".";
    },
    "lists-in-drawings": function (e) {
      return plural(e.count, "numbered paragraph", "numbered paragraphs") + " inside a text box lost " +
        (e.count === 1 ? "its number" : "their numbers") + ".";
    },
    "nested-tables": function (e) {
      return plural(e.count, "table", "tables") + " inside a table cell " + was(e.count) +
        " turned into paragraphs in that cell.";
    },
    "endnotes": function (e) {
      return plural(e.count, "endnote", "endnotes") + " became " + (e.count === 1 ? "a footnote" : "footnotes") + ".";
    },
    "fields": function (e) {
      return plural(e.count, "field", "fields") + " (such as a date, a cross-reference or a page number) " +
        was(e.count) + " kept as the text " + (e.count === 1 ? "it" : "they") + " showed.";
    },
    "symbols": function (e) {
      return plural(e.count, "symbol", "symbols") + " from a symbol font could not be matched and " +
        (e.count === 1 ? "shows" : "show") + " as a box.";
    },
    "columns": function () {
      return "Text set in columns was brought across as one column.";
    },
    "formatting": function () {
      return "Fonts, sizes, colours, spacing and table styling were replaced by the house style.";
    }
  };

  // A code this version does not know still gets a line: nothing is dropped
  // without the user being told.
  function sentence(entry) {
    var e = entry || {};
    var e2 = Object.assign({}, e, { count: typeof e.count === "number" ? e.count : 0 });
    var fn = SENTENCES[e.code];
    if (fn) return fn(e2);
    return "Something else was changed or left out (" + String(e.code || "unknown") + (e2.count ? ", " + e2.count : "") + ").";
  }

  // "Brought across: 212 paragraphs, 31 headings, ..." Zero counts are left out.
  var CARRIED = [
    ["paragraphs", "paragraph", "paragraphs"], ["headings", "heading", "headings"],
    ["listItems", "list item", "list items"], ["tables", "table", "tables"], ["pictures", "picture", "pictures"],
    ["keptObjects", "drawing or diagram kept as it was", "drawings and diagrams kept as they were"],
    ["captions", "caption", "captions"], ["footnotes", "footnote", "footnotes"], ["links", "link", "links"]
  ];
  function summary(report) {
    var c = (report && report.carried) || {};
    var bits = CARRIED.filter(function (k) { return c[k[0]] > 0; })
      .map(function (k) { return plural(c[k[0]], k[1], k[2]); });
    return bits.length ? "Brought across: " + bits.join(", ") + "." : "Nothing in the file could be brought across.";
  }

  // Resolves true when the imported document is open, false when the file was
  // refused or the user kept the document they had. It never rejects: the
  // reason is shown, and the open document is left as it was.
  function start(file) {
    var D = A.DocApp;
    if (!file) return Promise.resolve(false);
    var limits = (A.DocModel && A.DocModel.LIMITS) || {};
    D.busy("Reading the Word file", 0);
    return A.DocxImport.read(file, {
      name: file.name || "document.docx",
      maxBytes: limits.refuseBytes,
      onProgress: function (fraction, label) { D.busy(label || "Reading the Word file", fraction); }
    }).then(function (res) {
      D.busy(null);
      if (!res || !res.project) throw new Error("The Word file could not be read.");
      // "import" makes the shell forget any file handle (5.9).
      return Promise.resolve(D.setDoc(res.project, { from: "import" })).then(function (opened) {
        if (opened === false) return false;
        if (D.state.page !== "report") D.go("report");
        D.say(summary(res.report || res.project.importReport));
        return true;
      });
    }).catch(function (err) {
      D.busy(null);
      D.toast((err && err.message) || "The Word file could not be read.", "err");
      return false;
    });
  }

  A.DocImportFlow = { start: start, sentence: sentence, summary: summary };
})();
