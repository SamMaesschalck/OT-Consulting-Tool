/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* docx-blocks.js
 *
 * Turns a generated Word file back into what the client will read: a list of
 * blocks (heading, paragraph, bullet, table, image), for a review pack. The
 * canonical copy is shared/docx-blocks.js; tools/sync-shared.ps1 copies it to
 * js/docx-blocks.js in each module that writes packs.
 *
 * It reads the file itself (word/document.xml), never the builder's objects: a
 * docx paragraph is write-only once the library has made it, and the file is
 * the only thing certain to be what the client gets. The same rules as the
 * Issue check decide what counts as a red consultant prompt: the
 * PlaceholderText style, or a run coloured E00000.
 *
 * Left out on purpose:
 *   - the DRAFT watermark: it is a shape (w:pict) in the cover paragraph and the
 *     headers, with no text run, so reading runs leaves it out by itself;
 *   - a floating image behind the text (the full-page cover background);
 *   - paragraphs with nothing in them (spacers and page breaks).
 *
 * A table of one cell is a layout device (the cover is one, and so are the
 * call-out boxes), so its contents become plain blocks. Everything before the
 * first heading is marked front: true, so the cover reads as text.
 *
 * App.DocxBlocks.fromBlob(blob, { idPrefix, sectionKeyOf, headings }) resolves to
 *   { blocks: [...], media: { "image1.png": dataUri }, omittedImages: n }
 * The caller knows how a section key is made; this file does not. Either:
 *   headings      the sections the exporter tagged, in order: [{ key, title }]
 *                 (the assessment tool's sectionProbe). Word also prints smaller
 *                 headings inside a section ("P1 SR 6.2 ..."), which no section
 *                 override can address; those get sub: true and stay in their
 *                 section. A heading that does not match the next tag is one.
 *   sectionKeyOf  otherwise, a function from a heading's text to its key, and
 *                 every heading starts a section.
 * keepShapes keeps what a preview can draw and a pack has no use for: a table of
 * coloured cells with no text in them (the scorecard's stacked bars), with each
 * cell's width as cell.w. A pack leaves it off, so its text and hash do not move.
 */
(function () {
  "use strict";
  window.App = window.App || {};

  var W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  var WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing";
  var A = "http://schemas.openxmlformats.org/drawingml/2006/main";
  var R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  var RED = "E00000";
  var EMU_PER_PX = 9525;

  // ---- the zip ------------------------------------------------------------
  // Every part of a .docx as { name, bytes }. A .docx is a plain zip, and the
  // browser can inflate it (DecompressionStream) without a library.
  function unzip(blob) {
    return blob.arrayBuffer().then(function (buf) {
      var v = new DataView(buf), u8 = new Uint8Array(buf), eocd = -1, i;
      for (i = buf.byteLength - 22; i >= 0; i--) { if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
      if (eocd < 0) throw new Error("This is not a Word file.");
      var n = v.getUint16(eocd + 10, true), p = v.getUint32(eocd + 16, true), jobs = [];
      for (var k = 0; k < n; k++) {
        var method = v.getUint16(p + 10, true), csize = v.getUint32(p + 20, true);
        var nlen = v.getUint16(p + 28, true), xlen = v.getUint16(p + 30, true), clen = v.getUint16(p + 32, true);
        var local = v.getUint32(p + 42, true);
        var name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
        var start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
        var data = u8.subarray(start, start + csize);
        jobs.push((function (name, method, data) {
          var bytes = method === 0 ? Promise.resolve(data)
            : new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer().then(function (b) { return new Uint8Array(b); });
          return bytes.then(function (b) { return { name: name, bytes: b }; });
        })(name, method, data));
        p += 46 + nlen + xlen + clen;
      }
      return Promise.all(jobs);
    });
  }
  function partText(part) { return part ? new TextDecoder().decode(part.bytes) : ""; }

  function bytesToDataUri(bytes, name) {
    var ext = String(name).split(".").pop().toLowerCase();
    var type = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "svg" ? "image/svg+xml" : "image/jpeg";
    var bin = "", CHUNK = 0x8000;
    for (var i = 0; i < bytes.length; i += CHUNK) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    return "data:" + type + ";base64," + btoa(bin);
  }

  // ---- reading the XML ----------------------------------------------------

  function kids(node) {
    var out = [];
    for (var c = node.firstChild; c; c = c.nextSibling) if (c.nodeType === 1) out.push(c);
    return out;
  }
  function firstChildNS(node, ns, local) {
    for (var c = node.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1 && c.namespaceURI === ns && c.localName === local) return c;
    }
    return null;
  }
  function attrW(node, name) { return node ? node.getAttributeNS(W, name) : null; }

  // A w:b or w:i that is present and not switched off.
  function onOff(rPr, local) {
    var e = rPr && firstChildNS(rPr, W, local);
    if (!e) return false;
    var v = attrW(e, "val");
    return v !== "0" && v !== "false";
  }

  // The runs of one paragraph, in order, however deep they sit (hyperlinks,
  // tracked insertions, smart tags), with its images beside them.
  function readParagraph(p, ctx) {
    var pPr = firstChildNS(p, W, "pPr");
    var pStyleEl = pPr && firstChildNS(pPr, W, "pStyle");
    var style = pStyleEl ? (attrW(pStyleEl, "val") || "") : "";
    var styled = style === "PlaceholderText";
    var numbered = !!(pPr && firstChildNS(pPr, W, "numPr"));
    var runs = [], images = [];

    function addText(t, rPr) {
      if (!t) return;
      var c = rPr && firstChildNS(rPr, W, "color");
      var red = styled || !!(c && String(attrW(c, "val") || "").toUpperCase() === RED);
      var b = onOff(rPr, "b"), i = onOff(rPr, "i");
      // A key's swatch (a lone shape character in a chart colour) keeps its
      // colour, so the reviewer can tell the key's entries apart. Other
      // colours are styling and are not kept. The hash reads text only.
      var hex = c ? String(attrW(c, "val") || "").toUpperCase() : "";
      var swatch = !red && /^[0-9A-F]{6}$/.test(hex) && hex !== "000000" && /^[■●▲◆▪]\s*$/.test(t) ? hex : "";
      var last = runs[runs.length - 1];
      if (last && last.b === b && last.i === i && last.red === red && !last.c && !swatch) last.t += t;
      else { var run = { t: t, b: b, i: i, red: red }; if (swatch) run.c = swatch; runs.push(run); }
    }
    function readRun(r) {
      var rPr = firstChildNS(r, W, "rPr");
      kids(r).forEach(function (e) {
        if (e.namespaceURI !== W) return;
        var l = e.localName;
        if (l === "t") addText(e.textContent, rPr);
        else if (l === "tab") addText("\t", rPr);
        else if (l === "br") { if (attrW(e, "type") !== "page") addText("\n", rPr); }
        else if (l === "noBreakHyphen") addText("-", rPr);
        else if (l === "drawing") images.push.apply(images, readDrawing(e, ctx));
        // w:pict is the watermark: a shape, not the client's text.
      });
    }
    function walk(n) {
      kids(n).forEach(function (c) {
        if (c.namespaceURI === W && c.localName === "r") readRun(c);
        else if (c.namespaceURI === W && c.localName === "pPr") return;
        else walk(c);
      });
    }
    walk(p);
    var text = runs.map(function (r) { return r.t; }).join("");
    return { style: style, styled: styled, numbered: numbered, runs: runs, images: images, text: text };
  }

  function readDrawing(d, ctx) {
    var out = [];
    kids(d).forEach(function (holder) {
      var anchored = holder.namespaceURI === WP && holder.localName === "anchor";
      var inline = holder.namespaceURI === WP && holder.localName === "inline";
      if (!anchored && !inline) return;
      var blip = holder.getElementsByTagNameNS(A, "blip")[0];
      var rid = blip ? blip.getAttributeNS(R, "embed") : null;
      var ext = firstChildNS(holder, WP, "extent");
      var cx = ext ? Number(ext.getAttribute("cx")) : 0, cy = ext ? Number(ext.getAttribute("cy")) : 0;
      // The full-page cover background: floating, behind the text.
      if (anchored && holder.getAttribute("behindDoc") === "1") { ctx.omitted++; return; }
      var target = rid ? ctx.rels[rid] : null;
      if (!target) return;
      out.push({ media: String(target).split("/").pop(), width: Math.round(cx / EMU_PER_PX), height: Math.round(cy / EMU_PER_PX) });
    });
    return out;
  }

  function headingLevel(style) {
    var m = /^Heading([1-9])$/i.exec(style || "");
    return m ? Number(m[1]) : 0;
  }

  // A paragraph (one block, or a text block and its images) in reading order.
  function paragraphBlocks(pEl, ctx) {
    var r = readParagraph(pEl, ctx), out = [];
    if (r.text.replace(/\s+/g, "") !== "") {
      var lvl = headingLevel(r.style);
      var red = r.runs.some(function (x) { return x.red; });
      if (lvl) {
        out.push({ type: "heading", level: lvl, text: r.text, runs: r.runs, red: red });
      } else {
        // The exporters' bullets are typed ("•  text"); a real list is numPr.
        var m = /^\s*•\s+/.exec(r.text);
        if (m || r.numbered) {
          var strip = m ? m[0].length : 0;
          out.push({ type: "bullet", marker: "•", markerText: r.text.slice(0, strip), text: r.text.slice(strip), runs: dropLead(r.runs, strip), red: red });
        } else {
          out.push({ type: "paragraph", text: r.text, runs: r.runs, red: red });
        }
      }
    } else if (r.styled) {
      // The PlaceholderText style with no text in it still counts as red in
      // the Issue check (it lists an empty prompt); keep it visible.
      out.push({ type: "paragraph", text: "", runs: [], red: true });
    }
    r.images.forEach(function (im) { out.push({ type: "image", media: im.media, width: im.width, height: im.height }); });
    return out;
  }
  function dropLead(runs, n) {
    if (!n) return runs;
    var out = [], left = n;
    runs.forEach(function (r) {
      if (left >= r.t.length) { left -= r.t.length; return; }
      out.push({ t: r.t.slice(left), b: r.b, i: r.i, red: r.red });
      left = 0;
    });
    return out;
  }

  // A cell's blocks, in order; a nested table stays a table.
  function containerBlocks(node, ctx) {
    var out = [];
    kids(node).forEach(function (c) {
      if (c.namespaceURI !== W) return;
      if (c.localName === "p") out.push.apply(out, paragraphBlocks(c, ctx));
      else if (c.localName === "tbl") out.push.apply(out, tableBlocks(c, ctx));
      else if (c.localName === "sdt") {
        var sc = firstChildNS(c, W, "sdtContent");
        if (sc) out.push.apply(out, containerBlocks(sc, ctx));
      }
    });
    return out;
  }

  function blockText(b) {
    if (b.type === "table") {
      return b.rows.map(function (r) { return r.cells.map(function (c) { return c.text; }).join(" | "); }).join("\n");
    }
    return b.text || "";
  }

  function tableBlocks(tbl, ctx) {
    var rows = [];
    kids(tbl).forEach(function (tr) {
      if (tr.namespaceURI !== W || tr.localName !== "tr") return;
      var cells = [];
      kids(tr).forEach(function (tc) {
        if (tc.namespaceURI !== W || tc.localName !== "tc") return;
        var bl = containerBlocks(tc, ctx);
        var tcPr = firstChildNS(tc, W, "tcPr");
        var span = tcPr && firstChildNS(tcPr, W, "gridSpan");
        var shd = tcPr && firstChildNS(tcPr, W, "shd");
        var cell = { blocks: bl, text: bl.map(blockText).filter(Boolean).join("\n"),
                     red: bl.some(function (x) { return x.red; }) };
        if (span && Number(attrW(span, "val")) > 1) cell.span = Number(attrW(span, "val"));
        if (shd) { var fill = String(attrW(shd, "fill") || "").toUpperCase(); if (/^[0-9A-F]{6}$/.test(fill)) cell.fill = fill; }
        if (ctx.keepShapes) {
          var tcW = tcPr && firstChildNS(tcPr, W, "tcW");
          var wv = tcW ? Number(attrW(tcW, "w")) : 0;
          if (wv) cell.w = wv;
        }
        cells.push(cell);
      });
      if (cells.length) rows.push({ cells: cells });
    });
    // One cell: a layout device, not a table to read.
    if (rows.length === 1 && rows[0].cells.length === 1 && !(ctx.keepShapes && rows[0].cells[0].fill && !rows[0].cells[0].text)) return rows[0].cells[0].blocks;
    var t = { type: "table", rows: rows, red: rows.some(function (r) { return r.cells.some(function (c) { return c.red; }); }) };
    t.text = blockText(t);
    if (!t.text.replace(/\s+/g, "") && !hasImage(t) && !(ctx.keepShapes && hasFill(t))) return [];
    return [t];
  }
  function hasFill(t) {
    return t.rows.some(function (r) { return r.cells.some(function (c) { return !!c.fill; }); });
  }
  function hasImage(t) {
    return t.rows.some(function (r) { return r.cells.some(function (c) { return c.blocks.some(function (b) { return b.type === "image"; }); }); });
  }

  // ---- the whole document --------------------------------------------------

  function parseRels(xml) {
    var map = {};
    if (!xml) return map;
    var doc = new DOMParser().parseFromString(xml, "application/xml");
    Array.prototype.forEach.call(doc.getElementsByTagName("Relationship"), function (r) {
      map[r.getAttribute("Id")] = r.getAttribute("Target");
    });
    return map;
  }

  // documentXml to blocks. opts.sectionKeyOf(text) and opts.idPrefix as above.
  function fromXml(documentXml, relsXml, opts) {
    opts = opts || {};
    var doc = new DOMParser().parseFromString(documentXml, "application/xml");
    var body = doc.getElementsByTagNameNS(W, "body")[0];
    if (!body) throw new Error("The Word file has no body.");
    var ctx = { rels: parseRels(relsXml), omitted: 0, keepShapes: !!opts.keepShapes };
    var flat = containerBlocks(body, ctx);
    var keyOf = opts.sectionKeyOf || slugTitle;
    var idp = opts.idPrefix || "b";
    var heads = opts.headings || null, hp = 0;
    var seenHeading = false, curKey = "", curTitle = "", n = 0;
    function cmp(t) { return String(t).replace(/\s+/g, " ").trim().toLowerCase(); }
    // A zone's own heading in a multi-zone report prints more than its tag (the
    // tag is the zone's name, the heading adds "(Zone 1 of 3)").
    function matches(printed, tag) {
      var a = cmp(stripNumber(printed)), t = cmp(stripNumber(tag.title));
      return a === t || (tag.boundary && a.indexOf(t) === 0);
    }
    flat.forEach(function (b) {
      n++;
      b.id = idp + n;
      if (b.type === "heading") {
        seenHeading = true;
        if (heads) {
          var tag = heads[hp];
          if (tag && matches(b.text, tag)) {
            hp++;
            curTitle = stripNumber(b.text);
            curKey = tag.key || "";
          } else {
            b.sub = true;
          }
        } else {
          curTitle = stripNumber(b.text);
          curKey = keyOf(b.text) || "";
        }
      }
      b.front = !seenHeading;
      b.sectionKey = curKey;
      b.sectionTitle = curTitle;
    });
    return { blocks: flat, omittedImages: ctx.omitted };
  }

  // The numbered headings print the number and an em space before the title
  // (see h1n in the assessment tool's exporter); a key is made without it.
  function stripNumber(text) { return String(text || "").replace(/^[^ ]{1,8} /, "").trim(); }
  function slugTitle(text) {
    return stripNumber(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function fromBlob(blob, opts) {
    return unzip(blob).then(function (parts) {
      var byName = {};
      parts.forEach(function (p) { byName[p.name] = p; });
      var main = byName["word/document.xml"];
      if (!main) throw new Error("The Word file has no main document.");
      var res = fromXml(partText(main), partText(byName["word/_rels/document.xml.rels"]), opts);
      var media = {};
      function want(bl) {
        bl.forEach(function (b) {
          if (b.type === "image" && !media[b.media]) {
            var part = byName["word/media/" + b.media];
            if (part) media[b.media] = bytesToDataUri(part.bytes, b.media);
          } else if (b.type === "table") {
            b.rows.forEach(function (r) { r.cells.forEach(function (c) { want(c.blocks); }); });
          }
        });
      }
      want(res.blocks);
      res.media = media;
      return res;
    });
  }

  // ---- reading blocks back --------------------------------------------------

  // Every paragraph-like block in reading order, down through tables: what the
  // client reads, and what a comment's quote is matched against.
  function flatten(blocks, out) {
    out = out || [];
    (blocks || []).forEach(function (b) {
      if (b.type === "table") b.rows.forEach(function (r) { r.cells.forEach(function (c) { flatten(c.blocks, out); }); });
      else if (b.type !== "image") out.push(b);
    });
    return out;
  }

  // Everything that prints red, one entry per paragraph, as the Issue check
  // counts it.
  function redTexts(blocks) {
    return flatten(blocks).filter(function (b) { return b.red; }).map(function (b) {
      return (b.runs || []).filter(function (r) { return r.red; }).map(function (r) { return r.t; }).join("");
    });
  }

  // ---- the content hash ------------------------------------------------------
  // What "the report has changed since approval" compares. Text only: charts
  // are redrawn from the same numbers the tables print, and their pixels may
  // differ between two builds of one report. Left out, because filling them in
  // is not a change to what was reviewed (approval itself fills QA review by):
  // the cover, and these document control rows.
  var VOLATILE_ROWS = {
    "status": 1, "qa review by": 1, "authorised by": 1, "issued to": 1, "issued date": 1,
    "document revision": 1, "revision": 1, "date issued": 1, "issue date": 1
  };
  function hashSource(blocks) {
    var lines = [];
    function add(b) {
      if (b.type === "image") { lines.push("[image]"); return; }
      if (b.type === "table") {
        b.rows.forEach(function (r) {
          var first = String((r.cells[0] && r.cells[0].text) || "").trim().toLowerCase();
          if (r.cells.length === 2 && VOLATILE_ROWS[first]) { lines.push("[row " + first + "]"); return; }
          r.cells.forEach(function (c) { c.blocks.forEach(add); });
        });
        return;
      }
      lines.push(b.type + ":" + (b.text || ""));
    }
    (blocks || []).forEach(function (b) { if (!b.front) add(b); });
    return lines.join("\n");
  }
  // A 53-bit string hash (cyrb53): plain code, the same in every browser and
  // synchronous. It detects a changed report; it is not a security measure.
  function hashString(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return "h1:" + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  function contentHash(blocks) { return hashString(hashSource(blocks)); }

  window.App.DocxBlocks = {
    unzip: unzip,
    fromBlob: fromBlob,
    fromXml: fromXml,
    flatten: flatten,
    redTexts: redTexts,
    blockText: blockText,
    stripNumber: stripNumber,
    slugTitle: slugTitle,
    contentHash: contentHash,
    hashString: hashString,
    __hashSource: hashSource
  };
})();
