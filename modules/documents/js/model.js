/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* model.js: App.DocModel, pure functions on a document project
 * (docs/document-tool-design.md 3, 5.2; contracts/document.json).
 *
 * A project is a plain object. Its FILE form holds the bytes of pictures and
 * carried parts as base64 (`data`); its MEMORY form, which everything in the
 * tool and the shared writer use, holds them as Blobs (`blob`) and has no
 * `data`. fromText and normalise turn the first into the second, toFile turns
 * it back. An entry whose bytes did not come back from an autosave copy has
 * blob null and missing true.
 *
 * No DOM here, and nothing is ever deleted from media, parts or footnotes
 * while a document is open: undo can then always find what a restored block
 * refers to. toFile leaves out what nothing refers to.
 *
 * Offsets in the run functions count UTF-16 units of text, and a footnote
 * reference (a run with `fn`, whose text is empty) counts as ONE position, so
 * the caret can sit before it or after it and a range can hold it.
 * runs.length gives that length; runsText leaves the reference out.
 */
(function () {
  "use strict";
  window.App = window.App || {};

  var SCHEMA = "spt-document/1.0";
  var KINDS = ["report", "short"];
  var DOC_TYPES = ["Proposal", "Method statement", "Report", "Procedure", "Technical note"];
  // Where bytes come in, never at Save (3.5). Measured with
  // scripts/measure-size.html, whose first comment has the figures: 150 MB of
  // pictures saves and opens in seconds in about 1.3 GB, and a file cannot be
  // read back at all a little under 380 MB (the browser's longest string).
  var LIMITS = { warnBytes: 100 * 1024 * 1024, refuseBytes: 150 * 1024 * 1024 };

  var INFO_FIELDS = ["title", "docType", "reference", "client", "site", "author", "revision", "date",
    "qaReviewBy", "authorisedBy", "issuedTo", "issuedDate", "classification"];
  var FORMATS = ["b", "i", "u", "s", "sup", "sub", "code", "red"];
  var ALIGN = { paragraph: ["center", "right", "justify"], picture: ["left", "right"], kept: ["left", "center", "right"] };
  // What a table cell may hold (the contract): no table, heading, page break or prompt.
  var IN_CELL = { paragraph: 1, list: 1, picture: 1, kept: 1 };
  var KNOWN = { heading: 1, paragraph: 1, list: 1, table: 1, picture: 1, kept: 1, pageBreak: 1, prompt: 1 };
  // The types the browser can draw; the rest are stored and printed, and shown as a placeholder.
  var SHOWN = { "image/png": 1, "image/jpeg": 1, "image/gif": 1, "image/bmp": 1 };
  // Word's widest table, and the widest the import and a paste make.
  var MAX_COLS = 63;

  function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function str(v) { return typeof v === "string" ? v : v == null ? "" : String(v); }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  // A key or an id from a file that is also a name every object has
  // (__proto__, constructor, toString). Ours never are; one in a file made by
  // hand is not used, so it cannot stand in for something it is not.
  function inherited(k) { return str(k) in Object.prototype; }
  function safeKey(k) { k = str(k); return inherited(k) ? "" : k; }
  // A Blob made in another frame is not `instanceof Blob` here (the tests do that).
  function isBlob(b) { return !!b && typeof b.size === "number" && typeof b.arrayBuffer === "function"; }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function version() { return (window.App.Version && window.App.Version.number) || ""; }
  function product() { return (window.App.Product && window.App.Product.name) || "OT Cyber Document Tool"; }
  function acceptedSchemas() {
    var c = window.App.Data && window.App.Data.contracts && window.App.Data.contracts.document;
    return c && Array.isArray(c.acceptedSchemas) && c.acceptedSchemas.length ? c.acceptedSchemas : [SCHEMA];
  }

  // ---------- ids ----------
  // One counter for every kind of id, never wound back, so an id is never
  // used twice in a document: undo can bring a deleted block back as it was.
  function newId(doc, prefix) {
    if (!(doc.nextId >= 1)) doc.nextId = 1;
    return String(prefix || "b") + (doc.nextId++);
  }

  // ---------- base64 ----------
  // In slices, so neither direction ever holds a second whole copy as one string.
  var B64_IN = 4 * 262144, B64_OUT = 3 * 16384;
  function b64ToBlob(data, type) {
    try {
      if (/\s/.test(data.slice(0, 200))) data = data.replace(/\s+/g, "");
      var chunks = [];
      for (var at = 0; at < data.length; at += B64_IN) {
        var bin = atob(data.slice(at, at + B64_IN)), bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        chunks.push(bytes);
      }
      return new Blob(chunks, { type: type || "" });
    } catch (e) { return null; }
  }
  function blobToB64(blob) {
    return blob.arrayBuffer().then(function (buf) {
      var bytes = new Uint8Array(buf), out = [];
      for (var at = 0; at < bytes.length; at += B64_OUT) {
        out.push(btoa(String.fromCharCode.apply(null, bytes.subarray(at, at + B64_OUT))));
      }
      // As a Blob straight away: the browser may keep it off the heap.
      return new Blob(out);
    });
  }

  // ---------- runs ----------
  function runLen(r) { return r.fn ? 1 : r.t.length; }
  function safeLink(url) {
    url = str(url).trim();
    return /^(https?:\/\/|mailto:)\S+$/i.test(url) ? url : "";
  }
  // Text as a Word file can hold it: XML has no way to write most control
  // characters, U+FFFE, U+FFFF or half of a surrogate pair, and Word refuses
  // a file that holds one. The Word writer leaves them out as it writes
  // (App.HouseDocx.xmlSafe, the same rule); they are left out here as well, so
  // a project file does not carry them from one save to the next. A vertical
  // tab, which is what Word copies for a line break, becomes `vt`. A clean
  // string comes back as it went in.
  var UNSAFE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF￾￿]/;
  function safeText(v, vt) {
    var s = str(v);
    if (!UNSAFE.test(s)) return s;
    return s.replace(/\u000B/g, vt == null ? " " : vt).replace(/[\u0000-\u0008\u000C\u000E-\u001F￾￿]/g, "")
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g, function (m) { return m.length === 2 ? m : ""; });
  }
  function cleanRun(r) {
    if (!isObj(r)) return null;
    if (r.fn != null && r.fn !== "") return inherited(r.fn) ? null : { t: "", fn: str(r.fn) };
    var out = { t: safeText(r.t, "\n").replace(/\r\n?/g, "\n") };
    if (!out.t) return null;
    FORMATS.forEach(function (k) { if (r[k] === true) out[k] = true; });
    if (out.sup && out.sub) delete out.sub;
    var link = r.link ? safeLink(r.link) : "";
    if (link) out.link = link;
    return out;
  }
  function sameFormat(a, b) {
    if (a.fn || b.fn) return false;
    for (var i = 0; i < FORMATS.length; i++) if (!!a[FORMATS[i]] !== !!b[FORMATS[i]]) return false;
    return (a.link || "") === (b.link || "");
  }
  // The one canonical form: no empty runs, neighbours of the same formatting
  // merged, only the known fields. Every run function returns it, so two run
  // lists that print the same are equal as JSON.
  function normaliseRuns(list) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (r) {
      var c = cleanRun(r), last = out[out.length - 1];
      if (!c) return;
      if (last && sameFormat(last, c)) last.t += c.t; else out.push(c);
    });
    return out;
  }
  function runsLength(list) { var n = 0; (list || []).forEach(function (r) { n += runLen(r); }); return n; }
  function splitRuns(list, at) {
    var left = [], right = [], pos = 0;
    normaliseRuns(list).forEach(function (r) {
      var n = runLen(r);
      if (pos + n <= at) left.push(r);
      else if (pos >= at) right.push(r);
      else {
        var a = clone(r), b = clone(r);
        a.t = r.t.slice(0, at - pos); b.t = r.t.slice(at - pos);
        left.push(a); right.push(b);
      }
      pos += n;
    });
    return [left, right];
  }
  function joinRuns(a, b) { return normaliseRuns((a || []).concat(b || [])); }
  function range(list, from, to) {
    var total = runsLength(normaliseRuns(list));
    from = Math.max(0, Math.min(from | 0, total));
    to = Math.max(from, Math.min(to == null ? total : to | 0, total));
    var first = splitRuns(list, from), second = splitRuns(first[1], to - from);
    return { before: first[0], mid: second[0], after: second[1] };
  }
  var runs = {
    length: function (list) { return runsLength(normaliseRuns(list)); },
    safeLink: safeLink,
    normalise: normaliseRuns,
    slice: function (list, from, to) { return range(list, from, to).mid; },
    split: function (list, at) { return splitRuns(list, Math.max(0, at | 0)); },
    join: joinRuns,
    remove: function (list, from, to) { var p = range(list, from, to); return joinRuns(p.before, p.after); },
    // Sets the format when any of the text in the range lacks it, and clears
    // it otherwise, as a word processor does. `on` (true or false) says which
    // outright: a block selection has to do the same thing to every block.
    toggle: function (list, from, to, key, on) {
      if (FORMATS.indexOf(key) === -1) return normaliseRuns(list);
      var p = range(list, from, to), text = p.mid.filter(function (r) { return !r.fn; });
      if (!text.length) return normaliseRuns(list);
      if (on == null) on = !text.every(function (r) { return r[key] === true; });
      text.forEach(function (r) {
        if (!on) { delete r[key]; return; }
        r[key] = true;
        if (key === "sup") delete r.sub;
        if (key === "sub") delete r.sup;
      });
      return joinRuns(p.before.concat(p.mid), p.after);
    },
    // Typed text takes the look of the text before it (of the text after it
    // at the very start). A link is the exception: it only grows from inside,
    // so typing at its end starts plain text. An array is inserted as runs.
    insert: function (list, at, text) {
      var p = splitRuns(list, Math.max(0, Math.min(at | 0, runsLength(normaliseRuns(list)))));
      if (Array.isArray(text)) return joinRuns(p[0].concat(normaliseRuns(text)), p[1]);
      text = str(text);
      if (!text) return normaliseRuns(list);
      var left = p[0][p[0].length - 1], right = p[1][0];
      var like = left && !left.fn ? left : right && !right.fn ? right : null;
      var run = like ? clone(like) : {};
      run.t = text;
      if (!(left && right && left.link && left.link === right.link)) delete run.link;
      return joinRuns(p[0].concat([run]), p[1]);
    },
    // An empty address clears the link; one that is not http, https or mailto changes nothing.
    setLink: function (list, from, to, url) {
      var link = url ? safeLink(url) : "";
      if (url && !link) return normaliseRuns(list);
      var p = range(list, from, to);
      p.mid.forEach(function (r) {
        if (r.fn) return;
        if (link) r.link = link; else delete r.link;
      });
      return joinRuns(p.before.concat(p.mid), p.after);
    }
  };
  function runsText(list) {
    var s = "";
    (list || []).forEach(function (r) { if (r && !r.fn) s += r.t || ""; });
    return s;
  }

  // ---------- walking ----------
  // fn(block, list, index, table, cell) for every block, those in table cells
  // included, in reading order. Return false from fn to stop.
  function each(doc, fn) {
    var blocks = doc.blocks || [];
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (fn(b, blocks, i, null, null) === false) return false;
      if (b.type !== "table" || !Array.isArray(b.rows)) continue;
      for (var r = 0; r < b.rows.length; r++) {
        var cells = b.rows[r].cells || [];
        for (var c = 0; c < cells.length; c++) {
          var inner = cells[c].blocks || [];
          for (var k = 0; k < inner.length; k++) if (fn(inner[k], inner, k, b, cells[c]) === false) return false;
        }
      }
    }
    return true;
  }
  function find(doc, id) {
    var hit = null;
    each(doc, function (b, list, index, table, cell) {
      if (b.id !== id) return true;
      hit = { block: b, list: list, index: index };
      if (table) { hit.table = table; hit.cell = cell; }
      return false;
    });
    return hit;
  }

  // ---------- factories ----------
  function textRuns(text) { return text ? normaliseRuns([{ t: str(text) }]) : []; }
  function emptyCell(doc) { return { blocks: [make.paragraph(doc, "")] }; }
  var make = {
    heading: function (doc, level, text) {
      return { id: newId(doc, "b"), type: "heading", level: level === 2 || level === 3 ? level : 1, runs: textRuns(text) };
    },
    paragraph: function (doc, text) { return { id: newId(doc, "b"), type: "paragraph", runs: textRuns(text) }; },
    list: function (doc, list, level, text) {
      return { id: newId(doc, "b"), type: "list", list: list === "number" ? "number" : "bullet",
        level: Math.max(0, Math.min(2, level | 0)), runs: textRuns(text) };
    },
    // A new table has a header row, as every table in the house reports does.
    table: function (doc, rows, cols) {
      rows = Math.max(1, rows | 0); cols = Math.max(1, cols | 0);
      var t = { id: newId(doc, "b"), type: "table", header: 1, cols: [], rows: [] };
      for (var c = 0; c < cols; c++) t.cols.push(1);
      for (var r = 0; r < rows; r++) {
        var row = { cells: [] };
        for (var k = 0; k < cols; k++) row.cells.push(emptyCell(doc));
        t.rows.push(row);
      }
      return t;
    },
    picture: function (doc, mediaKey, w, h) {
      return { id: newId(doc, "b"), type: "picture", media: str(mediaKey), width: Math.max(1, Math.round(w) || 1), height: Math.max(1, Math.round(h) || 1) };
    },
    pageBreak: function (doc) { return { id: newId(doc, "b"), type: "pageBreak" }; },
    prompt: function (doc, text) { return { id: newId(doc, "b"), type: "prompt", text: str(text) }; }
  };

  // ---------- copies ----------
  // New block ids throughout, cells included. A kept block keeps its xml, its
  // relationship ids and its part keys: the copy is made independent at
  // export, in one place (3.4). A footnote is the exception to "nothing else
  // is copied": two references to one note would print one note twice, so
  // each copied reference gets a note of its own.
  function copyBlocks(doc, blocks) {
    function copyRuns(list) {
      (list || []).forEach(function (r) {
        if (!isObj(r) || !r.fn) return;
        var from = doc.footnotes && doc.footnotes[r.fn], key = newId(doc, "f");
        doc.footnotes = doc.footnotes || {};
        doc.footnotes[key] = { runs: from ? clone(from.runs || []) : [] };
        r.fn = key;
      });
    }
    function reId(b) {
      b.id = newId(doc, "b");
      if (Array.isArray(b.runs)) copyRuns(b.runs);
      if (b.type === "table") (b.rows || []).forEach(function (row) {
        (row.cells || []).forEach(function (cell) { (cell.blocks || []).forEach(reId); });
      });
      return b;
    }
    return (blocks || []).map(function (b) { return reId(clone(b)); });
  }

  // ---------- structural edits ----------
  function fitsCell(blocks) { return blocks.every(function (b) { return !own(KNOWN, b.type) || own(IN_CELL, b.type); }); }
  function idsOf(blocks) { return blocks.map(function (b) { return b.id; }); }
  // After the block `id`, in whichever list holds it (the body or a cell); at
  // the top of the body when id is null. Refused (nothing changes, [] comes
  // back) when a cell would be given something a cell cannot hold.
  function insertAfter(doc, id, blocks) {
    blocks = (blocks || []).filter(Boolean);
    if (!blocks.length) return [];
    if (id == null) { Array.prototype.unshift.apply(doc.blocks, blocks); return idsOf(blocks); }
    var at = find(doc, id);
    if (!at || (at.table && !fitsCell(blocks))) return [];
    Array.prototype.splice.apply(at.list, [at.index + 1, 0].concat(blocks));
    return idsOf(blocks);
  }
  // Removes exactly what is named and nothing else: an emptied document or an
  // emptied cell is the caller's to refill (the editor adds a paragraph).
  function remove(doc, ids) {
    var gone = [];
    (ids || []).forEach(function (id) {
      var at = find(doc, id);
      if (!at) return;
      at.list.splice(at.index, 1);
      gone.push(id);
    });
    return gone;
  }
  // Before the block `beforeId`, in its list; at the end of the body when it
  // is null. The blocks keep the order they have in the document.
  function move(doc, ids, beforeId) {
    ids = ids || [];
    if (beforeId != null && ids.indexOf(beforeId) !== -1) return [];
    var picked = [];
    each(doc, function (b) { if (ids.indexOf(b.id) !== -1) picked.push(b); });
    // A block inside a picked table goes with its table.
    picked = picked.filter(function (b) {
      var at = find(doc, b.id);
      return !(at.table && picked.indexOf(at.table) !== -1);
    });
    if (!picked.length) return [];
    var target = beforeId == null ? null : find(doc, beforeId);
    if (beforeId != null && (!target || (target.table && (!fitsCell(picked) || picked.indexOf(target.table) !== -1)))) return [];
    picked.forEach(function (b) { var at = find(doc, b.id); at.list.splice(at.index, 1); });
    if (beforeId == null) Array.prototype.push.apply(doc.blocks, picked);
    else {
      target = find(doc, beforeId);
      Array.prototype.splice.apply(target.list, [target.index, 0].concat(picked));
    }
    return idsOf(picked);
  }
  function replace(doc, id, blocks) {
    blocks = (blocks || []).filter(Boolean);
    var at = find(doc, id);
    if (!at || (at.table && !fitsCell(blocks))) return [];
    Array.prototype.splice.apply(at.list, [at.index, 1].concat(blocks));
    var out = idsOf(blocks);
    if (out.indexOf(id) === -1) out.unshift(id);
    return out;
  }

  // ---------- text, outline, prompts ----------
  function text(block) {
    if (!block) return "";
    if (Array.isArray(block.runs)) return runsText(block.runs);
    if (block.type === "prompt") return str(block.text);
    if (block.type === "picture") return str(block.caption || block.alt);
    if (block.type === "kept") return str(block.text);
    if (block.type === "table") {
      return (block.rows || []).map(function (row) {
        return (row.cells || []).map(function (cell) { return (cell.blocks || []).map(text).join(" "); }).join("\t");
      }).join("\n");
    }
    return "";
  }
  function entryMissing(map, key) { var e = map && map[key]; return !e || e.missing === true || !isBlob(e.blob); }
  // Every part a kept block needs, through the parts' own relationships.
  function partClosure(doc, relsList, into) {
    var todo = [];
    (relsList || []).forEach(function (r) { if (r && r.part) todo.push(r.part); });
    while (todo.length) {
      var key = todo.pop();
      if (own(into, key)) continue;
      into[key] = true;
      var p = doc.parts && doc.parts[key];
      if (p) (p.rels || []).forEach(function (r) { if (r && r.part) todo.push(r.part); });
    }
    return into;
  }
  function blockMissing(doc, b) {
    if (b.type === "picture") return entryMissing(doc.media, b.media);
    if (b.type !== "kept") return false;
    return Object.keys(partClosure(doc, b.rels, {})).some(function (k) { return entryMissing(doc.parts, k); });
  }
  // What the Issue check will list for one block, without building anything:
  // the block itself when it is a prompt, each run of red text, and a picture
  // or drawing whose bytes are missing (the writer prints a prompt for it).
  function blockPrompts(doc, b) {
    var n = b.type === "prompt" ? 1 : 0;
    if (Array.isArray(b.runs)) b.runs.forEach(function (r) { if (isObj(r) && r.red) n++; });
    if ((b.type === "picture" || b.type === "kept") && blockMissing(doc, b)) n++;
    return n;
  }
  function promptCount(doc) {
    var n = str(doc.info && doc.info.title).trim() ? 0 : 1;
    each(doc, function (b) { n += blockPrompts(doc, b); });
    return n;
  }
  // The headings, for the sidebar. `number` is empty unless headings are
  // numbered; `count` is the prompts in the heading's section, subsections
  // included (sectionRange).
  function outline(doc) {
    var out = [], open = [], counters = [0, 0, 0], numbered = !!(doc.options && doc.options.numberHeadings);
    (doc.blocks || []).forEach(function (b) {
      if (b.type === "heading") {
        var level = b.level === 2 || b.level === 3 ? b.level : 1;
        while (open.length && open[open.length - 1].level >= level) open.pop();
        // Numbered by how deep the heading really sits, not by its level, so
        // a skipped level never prints a nought (0.1, 1.0.1). The same rule
        // as App.HouseDocx.headingNumbers, which numbers the Word file.
        var depth = open.length + 1;
        counters[depth - 1]++;
        for (var i = depth; i < 3; i++) counters[i] = 0;
        var entry = { id: b.id, level: level, text: runsText(b.runs), number: numbered ? counters.slice(0, depth).join(".") : "", count: 0 };
        out.push(entry); open.push(entry);
      }
      var n = blockPrompts(doc, b);
      if (b.type === "table") (b.rows || []).forEach(function (row) {
        (row.cells || []).forEach(function (cell) { (cell.blocks || []).forEach(function (x) { n += blockPrompts(doc, x); }); });
      });
      if (n) open.forEach(function (e) { e.count += n; });
    });
    return out;
  }
  function sectionRange(doc, headingId) {
    var blocks = doc.blocks || [], ids = [], level = 0;
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (!level) { if (b.id === headingId && b.type === "heading") { level = b.level || 1; ids.push(b.id); } continue; }
      if (b.type === "heading" && (b.level || 1) <= level) break;
      ids.push(b.id);
    }
    return ids;
  }

  // ---------- tables ----------
  // Cells are placed as HTML places them: each in the next column of its row
  // that a span from the left or from above has not taken.
  function grid(t) {
    var rows = (t && t.rows) || [], G = rows.map(function () { return []; });
    rows.forEach(function (row, r) {
      var c = 0;
      (row.cells || []).forEach(function (cell, i) {
        while (G[r][c]) c++;
        var span = Math.max(1, cell.span | 0), down = Math.max(1, cell.rowSpan | 0);
        for (var dr = 0; dr < down && r + dr < rows.length; dr++) {
          for (var dc = 0; dc < span; dc++) G[r + dr][c + dc] = { cell: cell, r: r, c: c, i: i, covered: dr > 0 || dc > 0 };
        }
        c += span;
      });
    });
    var width = Math.max((t && t.cols ? t.cols.length : 0), G.reduce(function (m, row) { return Math.max(m, row.length); }, 0));
    G.forEach(function (row) { for (var c = 0; c < width; c++) if (!row[c]) row[c] = null; });
    return G;
  }
  function setSpan(cell, key, n) { if (n > 1) cell[key] = n; else delete cell[key]; }
  function tableOf(doc, id) { var at = find(doc, id); return at && at.block.type === "table" ? at.block : null; }
  function isOrigin(g, r, c) { return !!g && g.r === r && g.c === c; }
  var table = {
    grid: grid,
    // A new row at grid row `at` (0 puts it on top, the row count at the
    // bottom). A cell that reaches down across that line grows by one row.
    addRow: function (doc, id, at) {
      var t = tableOf(doc, id); if (!t) return [];
      var G = grid(t), R = t.rows.length, W = t.cols.length, row = { cells: [] };
      at = Math.max(0, Math.min(at == null ? R : at | 0, R));
      for (var c = 0; c < W; c++) {
        var g = at > 0 && at < R ? G[at][c] : null;
        if (g && g.r < at) { if (g.c === c) setSpan(g.cell, "rowSpan", (g.cell.rowSpan | 0 || 1) + 1); continue; }
        row.cells.push(emptyCell(doc));
      }
      t.rows.splice(at, 0, row);
      return [id];
    },
    // A cell that starts in the removed row and reaches further down keeps
    // its content: it moves to the next row, one row shorter.
    removeRow: function (doc, id, at) {
      var t = tableOf(doc, id); if (!t || t.rows.length < 2) return [];
      var G = grid(t), W = t.cols.length;
      at = at | 0;
      if (at < 0 || at >= t.rows.length) return [];
      var next = at + 1 < t.rows.length ? [] : null;
      for (var c = 0; c < W; c++) {
        var g = G[at][c];
        if (g && g.r < at && g.c === c) setSpan(g.cell, "rowSpan", (g.cell.rowSpan | 0) - 1);
        if (!next) continue;
        if (isOrigin(G[at + 1][c], at + 1, c)) next.push(G[at + 1][c].cell);
        else if (isOrigin(g, at, c) && (g.cell.rowSpan | 0) > 1) { setSpan(g.cell, "rowSpan", g.cell.rowSpan - 1); next.push(g.cell); }
      }
      if (next) t.rows[at + 1].cells = next;
      t.rows.splice(at, 1);
      return [id];
    },
    // A new column at grid column `at`. A cell that reaches across that line
    // grows by one column; every other row gets a new cell there.
    addCol: function (doc, id, at) {
      var t = tableOf(doc, id); if (!t) return [];
      var G = grid(t), W = t.cols.length;
      at = Math.max(0, Math.min(at == null ? W : at | 0, W));
      t.rows.forEach(function (row, r) {
        var cells = [];
        function add() {
          var a = at > 0 && at < W ? G[r][at - 1] : null, b = a ? G[r][at] : null;
          if (a && b && a.cell === b.cell) { if (a.r === r) setSpan(a.cell, "span", (a.cell.span | 0 || 1) + 1); }
          else cells.push(emptyCell(doc));
        }
        for (var c = 0; c < W; c++) {
          if (c === at) add();
          if (isOrigin(G[r][c], r, c)) cells.push(G[r][c].cell);
        }
        if (at === W) add();
        row.cells = cells;
      });
      t.cols.splice(at, 0, t.cols[at > 0 ? at - 1 : 0] || 1);
      return [id];
    },
    // A cell that covers the removed column and others gets one column
    // narrower and keeps its content; a cell of that column alone goes.
    removeCol: function (doc, id, at) {
      var t = tableOf(doc, id); if (!t || t.cols.length < 2) return [];
      var G = grid(t), seen = [];
      at = at | 0;
      if (at < 0 || at >= t.cols.length) return [];
      G.forEach(function (gr) {
        var g = gr[at];
        if (!g || seen.indexOf(g.cell) !== -1) return;
        seen.push(g.cell);
        if ((g.cell.span | 0) > 1) setSpan(g.cell, "span", g.cell.span - 1);
        else { var cells = t.rows[g.r].cells; cells.splice(cells.indexOf(g.cell), 1); }
      });
      t.cols.splice(at, 1);
      return [id];
    },
    setHeader: function (doc, id, on) {
      var t = tableOf(doc, id); if (!t) return [];
      t.header = on ? 1 : 0;
      return [id];
    },
    equalWidths: function (doc, id) {
      var t = tableOf(doc, id); if (!t) return [];
      t.cols = t.cols.map(function () { return 1; });
      return [id];
    },
    // Moves `by` of the table's width (0.05 is 5 percent; negative narrows)
    // into column `col` from the next column, or from the one before for the
    // last column. No column is taken below 5 percent of the table.
    nudge: function (doc, id, col, by) {
      var t = tableOf(doc, id); if (!t || t.cols.length < 2) return [];
      col = col | 0;
      if (col < 0 || col >= t.cols.length || !by) return [];
      var other = col + 1 < t.cols.length ? col + 1 : col - 1;
      var total = t.cols.reduce(function (a, b) { return a + b; }, 0), floor = total * 0.05;
      var d = by * total;
      d = Math.min(d, t.cols[other] - floor);
      d = Math.max(d, floor - t.cols[col]);
      if (Math.abs(d) < total * 1e-6) return [];
      var cols = t.cols.slice();
      cols[col] += d; cols[other] -= d;
      // As shares of 100, so a file does not gather long fractions.
      t.cols = cols.map(function (w) { return Math.round(w / total * 10000) / 100; });
      return [id];
    }
  };

  // ---------- footnotes ----------
  var footnote = {
    add: function (doc, blockId, at) {
      var hit = find(doc, blockId);
      if (!hit || !Array.isArray(hit.block.runs)) return null;
      var key = newId(doc, "f");
      doc.footnotes = doc.footnotes || {};
      doc.footnotes[key] = { runs: [] };
      hit.block.runs = runs.insert(hit.block.runs, at, [{ t: "", fn: key }]);
      return { key: key, ids: [blockId] };
    },
    // A note is one paragraph and cannot hold a note of its own.
    set: function (doc, key, list) {
      doc.footnotes = doc.footnotes || {};
      doc.footnotes[key] = { runs: normaliseRuns(list).filter(function (r) { return !r.fn; }) };
    }
  };

  // ---------- media and parts ----------
  function addMedia(doc, blob, meta) {
    meta = meta || {};
    var key = newId(doc, "m");
    doc.media = doc.media || {};
    doc.media[key] = { type: str(meta.type || (blob && blob.type)).toLowerCase(), name: str(meta.name), width: Math.round(meta.width) || 0,
      height: Math.round(meta.height) || 0, source: meta.source === "import" ? "import" : "insert", blob: blob };
    return key;
  }
  function addPart(doc, blob, meta) {
    meta = meta || {};
    var key = newId(doc, "p");
    doc.parts = doc.parts || {};
    doc.parts[key] = { name: str(meta.name), contentType: str(meta.contentType || (blob && blob.type)), blob: blob, rels: cleanRels(meta.rels) };
    return key;
  }
  // Object URLs are made on first use and kept beside the document, never in
  // it, so they are not saved and a second request costs nothing.
  var urls = typeof WeakMap === "function" ? new WeakMap() : null;
  function displayable(type) { return own(SHOWN, str(type).toLowerCase()); }
  function mediaUrl(doc, key) {
    var e = doc && doc.media && doc.media[key];
    if (!e || !isBlob(e.blob) || !displayable(e.type) || !urls) return "";
    var map = urls.get(doc);
    if (!map) { map = {}; urls.set(doc, map); }
    if (!map[key] || map[key].blob !== e.blob) {
      if (map[key]) URL.revokeObjectURL(map[key].url);
      // Typed, so the browser draws it whatever the Blob itself says it is.
      map[key] = { blob: e.blob, url: URL.createObjectURL(e.blob.type === e.type ? e.blob : new Blob([e.blob], { type: e.type })) };
    }
    return map[key].url;
  }
  function releaseUrls(doc) {
    var map = urls && doc ? urls.get(doc) : null;
    if (!map) return;
    Object.keys(map).forEach(function (k) { URL.revokeObjectURL(map[k].url); });
    urls["delete"](doc);
  }
  function usedKeys(doc) {
    var media = {}, parts = {}, notes = {};
    each(doc, function (b) {
      if (b.type === "picture" && b.media) media[b.media] = true;
      if (b.type === "kept") { if (b.preview) media[b.preview] = true; partClosure(doc, b.rels, parts); }
      if (Array.isArray(b.runs)) b.runs.forEach(function (r) { if (isObj(r) && r.fn) notes[r.fn] = true; });
    });
    if (doc.theme) partClosure(doc, [{ part: doc.theme }], parts);
    function known(map, of) { return Object.keys(map).filter(function (k) { return of && own(of, k); }); }
    return { media: known(media, doc.media), parts: known(parts, doc.parts), footnotes: known(notes, doc.footnotes) };
  }
  function missing(doc) {
    var ids = [];
    each(doc, function (b) { if ((b.type === "picture" || b.type === "kept") && blockMissing(doc, b)) ids.push(b.id); });
    return ids;
  }
  // By key: an autosave copy and the file it came from are the same document,
  // so the same key is the same picture.
  // The key alone is not enough: two files can share their keys without
  // being the same document (one made from the other), so an entry is taken
  // only when it is also described the same way, and one document's picture
  // is never put into another's frame.
  var FILL_SAME = { media: ["type", "name", "width", "height"], parts: ["name", "contentType"] };
  function fill(doc, other) {
    var n = 0;
    ["media", "parts"].forEach(function (group) {
      var mine = doc[group] || {}, theirs = (other && other[group]) || {};
      Object.keys(mine).forEach(function (k) {
        if (!entryMissing(mine, k) || entryMissing(theirs, k)) return;
        if (!FILL_SAME[group].every(function (f) { return (mine[k][f] == null ? "" : mine[k][f]) === (theirs[k][f] == null ? "" : theirs[k][f]); })) return;
        mine[k].blob = theirs[k].blob;
        delete mine[k].missing;
        n++;
      });
    });
    return n;
  }
  function sizeOf(doc) {
    var used = usedKeys(doc), n = 0;
    used.media.forEach(function (k) { if (isBlob(doc.media[k].blob)) n += doc.media[k].blob.size; });
    used.parts.forEach(function (k) { if (isBlob(doc.parts[k].blob)) n += doc.parts[k].blob.size; });
    return n;
  }

  // ---------- reading: defaults, repairs, the memory form ----------
  // A relationship to something outside the file that is not a link to click
  // (a linked picture, a linked workbook or object) makes Word fetch it when the
  // file is opened, and an address on a share hands over the reader's Windows
  // sign-in. The import never carries one (docs/document-tool-design.md 4.4);
  // a file edited by hand does not get round that. Such a relationship is
  // pointed at a part no document has, so the block counts as one with a part
  // missing: it shows as missing, prints a prompt and is never exported as it was.
  var OUTSIDE_PART = "?outside";
  function clickLink(type) { return /(^|\/)hyperlink$/i.test(str(type)); }
  function cleanRels(list) {
    return (Array.isArray(list) ? list : []).filter(isObj).map(function (r) {
      var out = { id: str(r.id), type: str(r.type) };
      // A part under a name every object has is never stored (normalise), so
      // the relationship is left pointing at a part that is plainly missing.
      if (r.part != null && r.part !== "") out.part = (inherited(r.part) ? "?" : "") + str(r.part);
      else if (!clickLink(out.type)) out.part = OUTSIDE_PART;
      // A link inside a kept drawing follows the rule for a link in the text:
      // http, https or mailto. The import already holds to it; a file edited
      // by hand does not get round it. The relationship stays, so the drawing
      // still opens, and points nowhere.
      else out.external = !/^(https?:\/\/|mailto:)\S+/i.test(str(r.external)) ? "about:blank" : str(r.external);
      return out;
    });
  }
  // A picture saved both in the file and as a link (Word's Insert and Link)
  // keeps its own copy: the link is taken off the XML, and its relationship
  // goes when nothing else names it. Returns { xml, rels } for cleanRels.
  function unlinkKept(xml, rels) {
    var list = (Array.isArray(rels) ? rels : []).filter(isObj), gone = {};
    list.forEach(function (r) {
      if ((r.part != null && r.part !== "") || clickLink(r.type) || !str(r.id)) return;
      var id = str(r.id), named = '="' + id.replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '"';
      xml = xml.replace(/<[^>]*>/g, function (tag) {
        if (!/\s[\w.\-]+:embed="[^"]+"/.test(tag)) return tag;
        return tag.split(/(\s[\w.\-]+:link="[^"]*")/).filter(function (bit) { return bit !== "" && !(/^\s[\w.\-]+:link="/.test(bit) && bit.slice(bit.indexOf("=")) === named); }).join("");
      });
      if (xml.indexOf(named) === -1) gone[id] = true;
    });
    return { xml: xml, rels: list.filter(function (r) { return !own(gone, str(r.id)) || (r.part != null && r.part !== "") || clickLink(r.type); }) };
  }
  function setBytes(out, e, type) {
    out.blob = typeof e.data === "string" ? b64ToBlob(e.data, type) : isBlob(e.blob) ? e.blob : null;
    // Dropped at once: the base64 is not held beside the Blob made from it.
    if (own(e, "data")) delete e.data;
    if (!out.blob) out.missing = true;
    return out;
  }
  function cleanBlock(doc, b, inCell, seen) {
    if (!isObj(b)) return null;
    var id = typeof b.id === "string" && b.id && !inherited(b.id) && !own(seen, b.id) ? b.id : newId(doc, "b");
    seen[id] = true;
    // A later version's block: kept exactly as it is, and printed as nothing.
    if (!own(KNOWN, b.type)) { b.id = id; return b; }
    var out = { id: id, type: b.type };
    if (b.land === true && !inCell) out.land = true;
    if (b.type === "heading") {
      out.level = b.level === 2 || b.level === 3 ? b.level : 1;
      out.runs = normaliseRuns(b.runs);
    } else if (b.type === "paragraph") {
      out.runs = normaliseRuns(b.runs);
      if (ALIGN.paragraph.indexOf(b.align) !== -1) out.align = b.align;
    } else if (b.type === "list") {
      out.list = b.list === "number" ? "number" : "bullet";
      out.level = Math.max(0, Math.min(2, b.level | 0));
      out.runs = normaliseRuns(b.runs);
      if (out.list === "number" && b.restart === true) out.restart = true;
      if (out.list === "number" && b["continue"] === true) out["continue"] = true;
    } else if (b.type === "prompt") {
      out.text = safeText(b.text, "\n");
    } else if (b.type === "picture") {
      out.media = safeKey(b.media);
      out.width = Math.max(1, Math.round(b.width) || 1);
      out.height = Math.max(1, Math.round(b.height) || 1);
      if (ALIGN.picture.indexOf(b.align) !== -1) out.align = b.align;
      if (b.caption) out.caption = safeText(b.caption);
      if (b.alt) out.alt = safeText(b.alt);
    } else if (b.type === "kept") {
      out.kind = str(b.kind) || "other";
      var unlinked = unlinkKept(str(b.xml), b.rels);
      out.xml = unlinked.xml;
      out.rels = cleanRels(unlinked.rels);
      out.width = Math.max(0, Math.round(b.width) || 0);
      out.height = Math.max(0, Math.round(b.height) || 0);
      out.floating = b.floating === true;
      if (b.preview && safeKey(b.preview)) out.preview = str(b.preview);
      out.text = safeText(b.text);
      if (b.label) out.label = safeText(b.label);
      out.description = safeText(b.description);
      if (ALIGN.kept.indexOf(b.align) !== -1) out.align = b.align;
      if (b.caption) out.caption = safeText(b.caption);
    } else if (b.type === "table") {
      cleanTable(doc, b, out, seen);
    }
    return out;
  }
  // A cell can hold paragraphs, list items, pictures and kept objects. What
  // else is found there is turned into those, so its words are not lost.
  function cellBlocks(doc, list, seen) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (b) {
      if (!isObj(b)) return;
      if (b.type === "heading") b = { id: b.id, type: "paragraph", runs: b.runs };
      else if (b.type === "prompt") b = { id: b.id, type: "paragraph", runs: [{ t: str(b.text), red: true }] };
      else if (b.type === "pageBreak") return;
      else if (b.type === "table") {
        (Array.isArray(b.rows) ? b.rows : []).forEach(function (row) {
          (isObj(row) && Array.isArray(row.cells) ? row.cells : []).forEach(function (cell) {
            out = out.concat(cellBlocks(doc, isObj(cell) ? cell.blocks : [], seen));
          });
        });
        return;
      }
      var c = cleanBlock(doc, b, true, seen);
      if (c) out.push(c);
    });
    return out;
  }
  // Keeps a table from a file inside Word's widest table before anything
  // lays it out, so a span of a million in a file made by hand cannot make a
  // million columns. Cells are placed as grid() places them. A span is cut
  // back where it would run past the last column or over a cell reaching
  // down from above, and a cell with no column left gives its content to the
  // last cell that had one: its words are kept, in the wrong cell, not lost.
  // The work is bounded by rows times MAX_COLS whatever the spans say.
  function boundTable(rows) {
    var occ = rows.map(function () { return []; }), last = null;
    rows.forEach(function (row, r) {
      var c = 0, kept = [];
      row.cells.forEach(function (cell) {
        while (occ[r][c]) c++;
        if (c >= MAX_COLS && last) {
          cell.blocks.forEach(function (b) { if (!(Array.isArray(b.runs) && !b.runs.length)) last.blocks.push(b); });
          return;
        }
        var span = Math.max(1, Math.min(cell.span | 0 || 1, MAX_COLS - c));
        for (var k = 1; k < span; k++) if (occ[r][c + k]) { span = k; break; }
        var down = Math.max(1, Math.min(cell.rowSpan | 0 || 1, rows.length - r));
        for (var rr = r; rr < r + down; rr++) for (var cc = c; cc < c + span; cc++) occ[rr][cc] = true;
        setSpan(cell, "span", span);
        setSpan(cell, "rowSpan", down);
        kept.push(cell);
        last = cell;
        c += span;
      });
      row.cells = kept;
    });
  }
  function cleanTable(doc, b, out, seen) {
    out.header = b.header ? 1 : 0;
    out.cols = [];
    out.rows = (Array.isArray(b.rows) ? b.rows : []).filter(isObj).map(function (row) {
      return { cells: (Array.isArray(row.cells) ? row.cells : []).filter(isObj).map(function (cell) {
        var c = { blocks: cellBlocks(doc, cell.blocks, seen) };
        if (!c.blocks.length) c.blocks.push(make.paragraph(doc, ""));
        setSpan(c, "span", Math.max(1, cell.span | 0));
        setSpan(c, "rowSpan", Math.max(1, cell.rowSpan | 0));
        return c;
      }) };
    });
    if (!out.rows.length) out.rows.push({ cells: [] });
    boundTable(out.rows);
    // Every row is made to reach the full width, and no cell reaches below
    // the last row, so the grid has no holes for the editor or the writer.
    var G = grid(out), width = Math.max(1, G[0].length);
    out.rows.forEach(function (row, r) {
      row.cells.forEach(function (cell) { if ((cell.rowSpan | 0) > out.rows.length - r) setSpan(cell, "rowSpan", out.rows.length - r); });
      for (var c = 0; c < width; c++) if (!G[r][c]) row.cells.push(emptyCell(doc));
    });
    var cols = Array.isArray(b.cols) ? b.cols : [];
    for (var c = 0; c < width; c++) out.cols.push(cols[c] > 0 && isFinite(cols[c]) ? Number(cols[c]) : 1);
    if (b.caption) out.caption = safeText(b.caption);
  }
  // The largest number already used in an id of ours, so nextId can be put
  // above it whatever the file says.
  function highestId(obj) {
    var max = 0;
    function see(id) { var m = /^(?:b|m|p|f|sptK)(\d+)/.exec(str(id)); if (m) max = Math.max(max, parseInt(m[1], 10)); }
    function walk(list) {
      (Array.isArray(list) ? list : []).forEach(function (b) {
        if (!isObj(b)) return;
        see(b.id);
        (Array.isArray(b.rels) ? b.rels : []).forEach(function (r) { if (isObj(r)) see(r.id); });
        (Array.isArray(b.rows) ? b.rows : []).forEach(function (row) {
          (isObj(row) && Array.isArray(row.cells) ? row.cells : []).forEach(function (cell) { if (isObj(cell)) walk(cell.blocks); });
        });
      });
    }
    walk(obj.blocks);
    ["media", "parts", "footnotes"].forEach(function (k) { if (isObj(obj[k])) Object.keys(obj[k]).forEach(see); });
    return max;
  }

  function refuse(message, foreign) {
    var e = new Error(message);
    // Ours, in words for the user: any other error is a file we could not read.
    e.refusal = true;
    // What the file says it is, so the shell can name the tool that reads it.
    if (foreign) e.foreign = foreign;
    return e;
  }
  function newDocId() {
    return "doc-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  }
  // Takes either form (a parsed file, or a project already in memory) and
  // returns the project in the memory form, with every optional field filled
  // in and anything inconsistent repaired. Throws a message for a file that
  // is not ours or is of a schema this version does not read. A file that is
  // ours but so damaged that reading it fails is refused in plain words too:
  // the user is never shown a script error (it is kept on `cause`).
  function normalise(obj) {
    try { return readProject(obj); }
    catch (e) {
      if (e && e.refusal) throw e;
      var damaged = refuse("This document file is damaged and could not be read.");
      damaged.cause = e;
      throw damaged;
    }
  }
  function readProject(obj) {
    if (!isObj(obj)) throw refuse("This is not a document file.", {});
    var schema = typeof obj.schema === "string" ? obj.schema : "";
    if (!/^spt-document\//.test(schema)) {
      throw refuse("This is not a document file.", { schema: schema, schemaVersion: typeof obj.schemaVersion === "string" ? obj.schemaVersion : "" });
    }
    if (acceptedSchemas().indexOf(schema) === -1) {
      throw refuse("This document file is in a format this version of the tool does not read (" + schema.slice(0, 40) +
        "). It was probably saved by a newer version. This version reads " + acceptedSchemas().join(", ") + ".");
    }
    var now = new Date().toISOString();
    var doc = {
      schema: schema,
      id: typeof obj.id === "string" && obj.id ? obj.id : newDocId(),
      createdAt: str(obj.createdAt) || now,
      savedAt: str(obj.savedAt),
      createdWithVersion: str(obj.createdWithVersion),
      savedBy: { product: str(isObj(obj.savedBy) ? obj.savedBy.product : ""), version: str(isObj(obj.savedBy) ? obj.savedBy.version : "") },
      kind: KINDS.indexOf(obj.kind) !== -1 ? obj.kind : "report",
      info: {}, options: {}, nextId: 0, blocks: [], footnotes: {}, media: {}, parts: {}
    };
    var info = isObj(obj.info) ? obj.info : {};
    INFO_FIELDS.forEach(function (k) { doc.info[k] = safeText(info[k]); });
    if (info.revision == null) doc.info.revision = "0.1";
    if (info.classification == null) doc.info.classification = "Confidential";
    if (Array.isArray(info.coverTitleLines)) {
      var lines = info.coverTitleLines.map(function (s) { return safeText(s); }).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 3);
      if (lines.length) doc.info.coverTitleLines = lines;
    }
    var options = isObj(obj.options) ? obj.options : {};
    doc.options.numberHeadings = options.numberHeadings === true;
    doc.options.contents = options.contents === true;
    doc.nextId = Math.max(obj.nextId >= 1 && isFinite(obj.nextId) ? Math.floor(obj.nextId) : 1, highestId(obj) + 1);

    var seen = {};
    (Array.isArray(obj.blocks) ? obj.blocks : []).forEach(function (b) {
      var c = cleanBlock(doc, b, false, seen);
      if (c) doc.blocks.push(c);
    });
    if (!doc.blocks.length) doc.blocks.push(make.paragraph(doc, ""));

    if (isObj(obj.footnotes)) Object.keys(obj.footnotes).forEach(function (k) {
      if (inherited(k)) return;
      var f = obj.footnotes[k];
      doc.footnotes[k] = { runs: normaliseRuns(isObj(f) ? f.runs : []).filter(function (r) { return !r.fn; }) };
    });
    // A reference to a note that is not there still needs somewhere to type.
    // And one note has one reference: the Word file numbers each reference
    // and prints a note for each, so a second reference to the same note (a
    // file made by hand) is given a copy of it, as a copied paragraph is
    // (copyBlocks), and the numbers on screen stay the ones that print.
    var referred = {};
    each(doc, function (b) {
      // A block of a later version is kept as it came, so its runs may be anything.
      if (Array.isArray(b.runs)) b.runs.forEach(function (r) {
        if (!isObj(r) || typeof r.fn !== "string" || !r.fn || inherited(r.fn)) return;
        if (!own(doc.footnotes, r.fn)) doc.footnotes[r.fn] = { runs: [] };
        if (own(referred, r.fn) && own(KNOWN, b.type)) {
          var again = newId(doc, "f");
          doc.footnotes[again] = { runs: clone(doc.footnotes[r.fn].runs) };
          r.fn = again;
        }
        referred[r.fn] = true;
      });
    });
    if (isObj(obj.media)) Object.keys(obj.media).forEach(function (k) {
      var e = obj.media[k];
      if (!isObj(e) || inherited(k)) return;
      var type = str(e.type).toLowerCase();
      doc.media[k] = setBytes({ type: type, name: str(e.name), width: Math.max(0, Math.round(e.width) || 0),
        height: Math.max(0, Math.round(e.height) || 0), source: e.source === "import" ? "import" : "insert" }, e, type);
    });
    if (isObj(obj.parts)) Object.keys(obj.parts).forEach(function (k) {
      var e = obj.parts[k];
      if (!isObj(e) || inherited(k)) return;
      var entry = { name: str(e.name), contentType: str(e.contentType) };
      setBytes(entry, e, entry.contentType);
      entry.rels = cleanRels(e.rels);
      doc.parts[k] = entry;
    });
    if (typeof obj.theme === "string" && own(doc.parts, obj.theme)) doc.theme = obj.theme;
    var report = cleanReport(obj.importReport);
    if (report) doc.importReport = report;
    return doc;
  }
  // The import report in the shape the contract gives it, whatever the file
  // holds: the Import report page reads it without testing each field. The
  // order of the fields is kept, and so is a count this version has no name
  // for (a later version's), as long as it is a plain value.
  function plain(v) { return typeof v === "string" || typeof v === "boolean" || (typeof v === "number" && isFinite(v)); }
  function count(v) { return typeof v === "number" && isFinite(v) && v > 0 ? v : 0; }
  function strings(list, max) {
    return (Array.isArray(list) ? list : []).filter(function (s) { return typeof s === "string"; }).slice(0, max);
  }
  function cleanEntry(e) {
    var out = {};
    Object.keys(e).forEach(function (k) {
      if (inherited(k)) return;
      if (k === "code") out.code = safeKey(e.code);
      else if (k === "count") out.count = count(e.count);
      else if (k === "examples") out.examples = strings(e.examples, 5);
      else if (k === "blockIds") out.blockIds = strings(e.blockIds, 50);
      else if (plain(e[k])) out[k] = e[k];
    });
    if (!own(out, "code")) out.code = "";
    if (!own(out, "count")) out.count = 0;
    return out;
  }
  function cleanReport(rep) {
    if (!isObj(rep)) return null;
    var out = {};
    Object.keys(rep).forEach(function (k) {
      var v = rep[k];
      if (inherited(k)) return;
      if (k === "source") {
        v = isObj(v) ? v : {};
        out.source = { name: str(v.name), size: count(v.size), importedAt: str(v.importedAt) };
      } else if (k === "carried") {
        out.carried = {};
        if (isObj(v)) Object.keys(v).forEach(function (c) { if (!inherited(c)) out.carried[c] = count(v[c]); });
      } else if (k === "toCheck" || k === "changed" || k === "notCarried") {
        out[k] = (Array.isArray(v) ? v : []).filter(isObj).map(cleanEntry);
      } else if (plain(v)) out[k] = v;
    });
    if (!own(out, "source")) out.source = { name: "", size: 0, importedAt: "" };
    if (!own(out, "carried")) out.carried = {};
    ["toCheck", "changed", "notCarried"].forEach(function (k) { if (!own(out, k)) out[k] = []; });
    return out;
  }
  function create(kind) {
    return normalise({
      schema: SCHEMA, id: newDocId(), createdAt: new Date().toISOString(), savedAt: "",
      createdWithVersion: version(), savedBy: { product: product(), version: version() },
      kind: kind, info: { date: todayISO() }, blocks: []
    });
  }
  function fromText(text) {
    var obj;
    try { obj = JSON.parse(text); } catch (e) { throw refuse("This is not a document file.", {}); }
    return normalise(obj);
  }

  // ---------- writing ----------
  // The project without its bytes, in the file's field order: what the file
  // holds around the base64, and what the autosave copy keeps as its record.
  // `used` limits media, parts and footnotes to what the blocks refer to.
  function shell(doc, used) {
    var out = {
      schema: doc.schema || SCHEMA, id: doc.id, createdAt: doc.createdAt, savedAt: doc.savedAt,
      createdWithVersion: doc.createdWithVersion, savedBy: doc.savedBy, kind: doc.kind, info: doc.info,
      options: doc.options, nextId: doc.nextId, blocks: doc.blocks, footnotes: {}, media: {}, parts: {}
    };
    used = used || usedKeys(doc);
    used.footnotes.forEach(function (k) { out.footnotes[k] = doc.footnotes[k]; });
    used.media.forEach(function (k) {
      var e = doc.media[k];
      out.media[k] = { type: e.type, name: e.name, width: e.width, height: e.height, source: e.source };
    });
    used.parts.forEach(function (k) {
      var e = doc.parts[k];
      out.parts[k] = { name: e.name, contentType: e.contentType, rels: e.rels };
    });
    if (doc.theme && own(out.parts, doc.theme)) out.theme = doc.theme;
    if (doc.importReport) out.importReport = doc.importReport;
    return out;
  }
  // The file is assembled from pieces and never exists as one string: the
  // text of the document, then each picture's base64 as a Blob of its own.
  // An entry whose bytes are missing is written without `data`, and reads
  // back as missing: saving an incomplete copy never turns a lost picture
  // into an empty one.
  function toFile(doc) {
    var used = usedKeys(doc), head = shell(doc, used), pieces = [];
    var media = head.media, parts = head.parts, theme = head.theme, report = head.importReport;
    delete head.media; delete head.parts; delete head.theme; delete head.importReport;
    pieces.push(JSON.stringify(head).slice(0, -1));
    var chain = Promise.resolve();
    function group(name, entries, source) {
      chain = chain.then(function () { pieces.push(',"' + name + '":{'); });
      Object.keys(entries).forEach(function (k, i) {
        chain = chain.then(function () {
          var blob = source[k].blob;
          pieces.push((i ? "," : "") + JSON.stringify(k) + ":" + JSON.stringify(entries[k]).slice(0, -1));
          if (!isBlob(blob) || source[k].missing) { pieces.push("}"); return null; }
          return blobToB64(blob).then(function (b64) { pieces.push(',"data":"', b64, '"}'); });
        });
      });
      chain = chain.then(function () { pieces.push("}"); });
    }
    group("media", media, doc.media);
    group("parts", parts, doc.parts);
    return chain.then(function () {
      if (theme) pieces.push(',"theme":' + JSON.stringify(theme));
      if (report) pieces.push(',"importReport":' + JSON.stringify(report));
      pieces.push("}");
      return new Blob(pieces, { type: "application/json" });
    });
  }

  window.App.DocModel = {
    SCHEMA: SCHEMA, KINDS: KINDS, DOC_TYPES: DOC_TYPES, LIMITS: LIMITS,
    create: create, normalise: normalise, newId: newId, make: make, copyBlocks: copyBlocks, find: find, each: each,
    insertAfter: insertAfter, remove: remove, move: move, replace: replace,
    outline: outline, sectionRange: sectionRange, text: text, runsText: runsText,
    runs: runs, table: table, footnote: footnote, promptCount: promptCount,
    addMedia: addMedia, addPart: addPart, mediaUrl: mediaUrl, releaseUrls: releaseUrls, displayable: displayable,
    usedKeys: usedKeys, missing: missing, fill: fill, sizeOf: sizeOf, shell: shell, toFile: toFile, fromText: fromText,
    // A new document id, for a document saved into another file (App.DocStorage).
    newDocId: newDocId
  };
})();
