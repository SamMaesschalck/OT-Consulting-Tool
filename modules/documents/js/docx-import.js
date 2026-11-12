/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* docx-import.js
 *
 * App.DocxImport reads a person-written .docx into a document project
 * (docs/document-tool-design.md 4.4, contracts/document.json). The canonical
 * copy is shared/docx-import.js; tools/sync-shared.ps1 copies it into
 * modules/documents/js. It needs App.ZipIO and nothing else, and it never
 * calls a module's code.
 *
 * What it keeps is the document's structure: headings, paragraphs, lists,
 * tables, pictures, footnotes and links, as the contract's blocks. What it
 * leaves behind is the look (fonts, sizes, colours, spacing), because the
 * house template supplies that. What it cannot redraw (shapes, text boxes,
 * SmartArt, charts, embedded objects, equations) it carries as the original
 * XML with the parts that XML depends on, for shared/docx-graft.js to put
 * back at export.
 *
 * Two rules run through the whole file:
 *   - Nothing is dropped silently. Every branch that leaves something out or
 *     alters it adds to the import report under one of CODES. Markup the
 *     reader does not know loses its wrapper, never its content.
 *   - The file is not trusted. It is parsed with DOMParser and nothing from
 *     it is ever put into the page; a DOCTYPE anywhere refuses the file;
 *     numbers read from it are clamped; names in it are only ever keys.
 *
 * read(blob, { name, maxBytes, onProgress }) resolves to { project, report }
 * with the project in the memory form (bytes as Blobs, design 3.6), or
 * rejects with an Error whose message can be shown to the user as it is
 * (err.code says which refusal it was).
 */
(function () {
  "use strict";
  window.App = window.App || {};

  var W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  var W_STRICT = "http://purl.oclc.org/ooxml/wordprocessingml/main";
  var R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  var A = "http://schemas.openxmlformats.org/drawingml/2006/main";
  var WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing";
  var MC = "http://schemas.openxmlformats.org/markup-compatibility/2006";
  var V = "urn:schemas-microsoft-com:vml";
  var W10 = "urn:schemas-microsoft-com:office:word";
  var O = "urn:schemas-microsoft-com:office:office";
  var M = "http://schemas.openxmlformats.org/officeDocument/2006/math";
  var W14 = "http://schemas.microsoft.com/office/word/2010/wordml";
  var XMLNS = "http://www.w3.org/2000/xmlns/";
  var EMU_PER_PX = 9525;
  var RED = "E00000";
  var MAX_BYTES = 150 * 1024 * 1024;
  var MAX_PX = 10000;        // no real drawing is wider than this; a file may claim anything
  var MAX_COLS = 63;         // Word's own limit on table columns
  var MAX_QUOTE = 120;

  // The import report's codes, by list (4.4, "The import report").
  var CODES = {
    toCheck: ["front-matter"],
    notCarried: ["comments", "headers-footers", "contents", "figures-list", "cover-page", "internal-links", "other-links", "picture-links",
      "links-in-drawings", "hidden-text", "controls", "macros", "fields-no-text", "objects-in-notes", "notes-missing", "embedded-chunks",
      "objects-lost", "unreadable-part", "theme-missing", "linked-pictures", "linked-objects"],
    changed: ["tracked-changes", "floating-pictures", "floating-drawings", "inline-objects", "heading-numbers", "headings-deeper",
      "lists-deeper", "list-numbering", "lists-in-drawings", "nested-tables", "endnotes", "fields", "symbols",
      "columns", "formatting"]
  };

  // Fonts whose letters are pictures: the character stored is only a place in
  // the font, so "W" in Symbol is an ohm sign and "ü" in Wingdings is a tick.
  // Each font maps the places that have a plain Unicode character; a place
  // that is not listed shows as a box and is counted, never passed through as
  // the letter it was stored as.
  function glyphs(pairs) {
    var out = mapOf();
    for (var i = 0; i < pairs.length; i += 2) out[pairs[i]] = String.fromCharCode(pairs[i + 1]);
    return out;
  }
  var SYMBOL_GLYPHS = (function () {
    var g = glyphs([0x22, 0x2200, 0x24, 0x2203, 0x27, 0x220B, 0x2A, 0x2217, 0x2D, 0x2212, 0x40, 0x2245,
      0x41, 0x391, 0x42, 0x392, 0x43, 0x3A7, 0x44, 0x394, 0x45, 0x395, 0x46, 0x3A6, 0x47, 0x393, 0x48, 0x397, 0x49, 0x399,
      0x4A, 0x3D1, 0x4B, 0x39A, 0x4C, 0x39B, 0x4D, 0x39C, 0x4E, 0x39D, 0x4F, 0x39F, 0x50, 0x3A0, 0x51, 0x398, 0x52, 0x3A1,
      0x53, 0x3A3, 0x54, 0x3A4, 0x55, 0x3A5, 0x56, 0x3C2, 0x57, 0x3A9, 0x58, 0x39E, 0x59, 0x3A8, 0x5A, 0x396,
      0x5C, 0x2234, 0x5E, 0x22A5,
      0x61, 0x3B1, 0x62, 0x3B2, 0x63, 0x3C7, 0x64, 0x3B4, 0x65, 0x3B5, 0x66, 0x3C6, 0x67, 0x3B3, 0x68, 0x3B7, 0x69, 0x3B9,
      0x6A, 0x3D5, 0x6B, 0x3BA, 0x6C, 0x3BB, 0x6D, 0x3BC, 0x6E, 0x3BD, 0x6F, 0x3BF, 0x70, 0x3C0, 0x71, 0x3B8, 0x72, 0x3C1,
      0x73, 0x3C3, 0x74, 0x3C4, 0x75, 0x3C5, 0x76, 0x3D6, 0x77, 0x3C9, 0x78, 0x3BE, 0x79, 0x3C8, 0x7A, 0x3B6, 0x7E, 0x223C,
      0xA0, 0x20AC, 0xA1, 0x3D2, 0xA2, 0x2032, 0xA3, 0x2264, 0xA4, 0x2044, 0xA5, 0x221E, 0xA6, 0x192, 0xA7, 0x2663, 0xA8, 0x2666,
      0xA9, 0x2665, 0xAA, 0x2660, 0xAB, 0x2194, 0xAC, 0x2190, 0xAD, 0x2191, 0xAE, 0x2192, 0xAF, 0x2193,
      0xB0, 0xB0, 0xB1, 0xB1, 0xB2, 0x2033, 0xB3, 0x2265, 0xB4, 0xD7, 0xB5, 0x221D, 0xB6, 0x2202, 0xB7, 0x2022, 0xB8, 0xF7,
      0xB9, 0x2260, 0xBA, 0x2261, 0xBB, 0x2248, 0xBC, 0x2026, 0xBF, 0x21B5,
      0xC0, 0x2135, 0xC1, 0x2111, 0xC2, 0x211C, 0xC3, 0x2118, 0xC4, 0x2297, 0xC5, 0x2295, 0xC6, 0x2205, 0xC7, 0x2229, 0xC8, 0x222A,
      0xC9, 0x2283, 0xCA, 0x2287, 0xCB, 0x2284, 0xCC, 0x2282, 0xCD, 0x2286, 0xCE, 0x2208, 0xCF, 0x2209,
      0xD0, 0x2220, 0xD1, 0x2207, 0xD2, 0xAE, 0xD3, 0xA9, 0xD4, 0x2122, 0xD5, 0x220F, 0xD6, 0x221A, 0xD7, 0x22C5, 0xD8, 0xAC,
      0xD9, 0x2227, 0xDA, 0x2228, 0xDB, 0x21D4, 0xDC, 0x21D0, 0xDD, 0x21D1, 0xDE, 0x21D2, 0xDF, 0x21D3,
      0xE0, 0x25CA, 0xE1, 0x2329, 0xE2, 0xAE, 0xE3, 0xA9, 0xE4, 0x2122, 0xE5, 0x2211, 0xF1, 0x232A, 0xF2, 0x222B]);
    // Digits and plain punctuation sit where they always do.
    "0123456789!#%&()+,./:;<=>?[]_{|}".split("").forEach(function (ch) { g[ch.charCodeAt(0)] = ch; });
    return g;
  })();
  var SYMBOL_FONTS = {
    "symbol": SYMBOL_GLYPHS,
    "wingdings": glyphs([0x4A, 0x263A, 0x4C, 0x2639, 0x6C, 0x25CF, 0x6E, 0x25A0, 0x6F, 0x2610, 0x75, 0x25C6, 0x76, 0x2756,
      0x9F, 0x2022, 0xA1, 0x25CB, 0xA7, 0x25AA, 0xA8, 0x2610, 0xAB, 0x2605, 0xD8, 0x27A2, 0xDF, 0x2190, 0xE0, 0x2192,
      0xE1, 0x2191, 0xE2, 0x2193, 0xE8, 0x2794, 0xFB, 0x2717, 0xFC, 0x2713, 0xFD, 0x2612, 0xFE, 0x2611]),
    "wingdings 2": glyphs([0x4F, 0x2717, 0x50, 0x2713, 0x51, 0x2612, 0x52, 0x2611, 0x53, 0x2612, 0x54, 0x2612, 0xA3, 0x2610]),
    "webdings": glyphs([0x33, 0x25C0, 0x34, 0x25B6, 0x35, 0x25B2, 0x36, 0x25BC, 0x61, 0x2714, 0x67, 0x25A0, 0x6E, 0x25CF, 0x72, 0x2718]),
    "wingdings 3": mapOf(), "mt extra": mapOf(), "marlett": mapOf(), "zapfdingbats": mapOf(), "zapf dingbats": mapOf(),
    "monotype sorts": mapOf()
  };
  var BOX = "□";
  function symbolFont(name) {
    name = String(name || "").toLowerCase();
    return Object.prototype.hasOwnProperty.call(SYMBOL_FONTS, name) ? SYMBOL_FONTS[name] : null;
  }
  // Text stored in a symbol font, as the characters it showed. `low` is the
  // table for the places below 128 and `high` the one for the rest (Word keeps
  // a font for each half); either may be null, which leaves that half as it
  // is. Word also stores these places in a private range (F020 to F0FF), which
  // means nothing in any other font: with no table for it, that is a box too.
  // Returns { text, misses }.
  function symbolText(text, low, high) {
    var out = "", misses = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i), code = text.charCodeAt(i), priv = code >= 0xF020 && code <= 0xF0FF;
      if (priv) code -= 0xF000;
      if (!priv && (code > 0xFF || ch === " " || ch === "\t" || ch === "\n" || ch === "\r")) { out += ch; continue; }
      var table = code < 0x80 ? (low || (priv ? high : null)) : (high || (priv ? low : null));
      if (!table && !priv) { out += ch; continue; }
      if (code === 0x20) { out += " "; continue; }
      if (table && table[code]) out += table[code];
      else { out += BOX; misses++; }
    }
    return { text: out, misses: misses };
  }
  // Word's built-in styles for the deeper levels of a list ("List Bullet 2",
  // "List Number 3") are each a list of their own at level 0, told apart only
  // by indent. The style says which family it belongs to and how deep it is.
  function listFamily(st) {
    if (!st) return null;
    for (var i = 0; i < st.chain.length; i++) {
      var m = /^List(Bullet|Number)([2-5])?$/.exec(st.chain[i].id || "") || /^list (bullet|number)(?: ([2-5]))?$/i.exec(st.chain[i].name || "");
      if (m) return { family: m[1].toLowerCase(), depth: m[2] ? +m[2] - 1 : 0 };
    }
    return null;
  }

  var CODE_FONTS = { "consolas": 1, "courier new": 1, "lucida console": 1, "cascadia mono": 1, "cascadia code": 1 };
  // Heading names Word uses on installs in other languages. The English name
  // usually survives in w:name; these catch the files where it does not.
  var LOCAL_HEADING = /^(?:Überschrift|Titre|Título|Titolo|Kop|Rubrik|Overskrift|Otsikko|Nagłówek|Заголовок)\s*([1-9])$/iu;
  var MEDIA_TYPES = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", bmp: "image/bmp",
    dib: "image/bmp", emf: "image/x-emf", wmf: "image/x-wmf", tif: "image/tiff", tiff: "image/tiff" };
  var SHOWN = { "image/png": 1, "image/jpeg": 1, "image/gif": 1, "image/bmp": 1 };
  var KIND_WORDS = { shape: "Shape", group: "Grouped drawing", textbox: "Text box", canvas: "Drawing canvas",
    smartart: "Diagram (SmartArt)", chart: "Chart", ole: "Embedded object", picture: "Picture",
    equation: "Equation", other: "Drawing" };

  // A refusal the user can read as it stands.
  function refuse(code, message) {
    var e = new Error(message);
    e.code = code; e.plain = true;
    return e;
  }
  // A map keyed by names from the file: no inherited names, so a part or a
  // style called __proto__ is a key like any other.
  function mapOf() { return Object.create(null); }

  // ---- reading the XML ----------------------------------------------------

  function kids(node) {
    var out = [];
    for (var c = node.firstChild; c; c = c.nextSibling) if (c.nodeType === 1) out.push(c);
    return out;
  }
  function child(node, ns, local) {
    if (!node) return null;
    for (var c = node.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1 && c.namespaceURI === ns && c.localName === local) return c;
    }
    return null;
  }
  function children(node, ns, local) {
    var out = [];
    if (!node) return out;
    for (var c = node.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1 && c.namespaceURI === ns && c.localName === local) out.push(c);
    }
    return out;
  }
  function first(node, ns, local) {
    if (!node) return null;
    var l = node.getElementsByTagNameNS(ns, local);
    return l.length ? l[0] : null;
  }
  function is(node, ns, local) { return node.namespaceURI === ns && node.localName === local; }
  function wAttr(node, name) {
    if (!node) return null;
    var v = node.getAttributeNS(W, name);
    return v === "" && !node.hasAttributeNS(W, name) ? null : v;
  }
  function wVal(node) { return wAttr(node, "val"); }
  // A number from the file, never trusted: not a number gives the fallback.
  function int(v, fallback) {
    var n = parseInt(v, 10);
    return isFinite(n) ? n : (fallback == null ? 0 : fallback);
  }
  function clamp(n, lo, hi) { return n < lo ? lo : n > hi ? hi : n; }
  // A toggle (w:b, w:i ...) is on when present, unless it says otherwise.
  function toggle(el) {
    if (!el) return undefined;
    var v = wVal(el);
    return !(v === "0" || v === "false" || v === "off");
  }
  // The same rule for a toggle written as an attribute (w:default, w:firstRow).
  function onAttr(v) { return v != null && !(v === "0" || v === "false" || v === "off"); }
  function textOf(node, ns, local) {
    var l = node.getElementsByTagNameNS(ns, local), s = "";
    for (var i = 0; i < l.length; i++) s += l[i].textContent;
    return s;
  }
  // A paragraph's words for a quote in the report, with a space where a tab or a line break was.
  function wordsOf(node) {
    var all = node.getElementsByTagNameNS(W, "*"), s = "";
    for (var i = 0; i < all.length; i++) {
      var l = all[i].localName;
      if (l === "t") s += all[i].textContent; else if (l === "tab" || l === "br" || l === "cr") s += " ";
    }
    return s;
  }
  function quote(s) {
    s = String(s || "").replace(/\s+/g, " ").trim();
    return s.length > MAX_QUOTE ? s.slice(0, MAX_QUOTE - 1) + "…" : s;
  }
  // The exported parse functions take the part's text or a parsed document.
  function toDoc(xml) {
    if (!xml) return null;
    if (typeof xml !== "string") return xml.documentElement ? xml : null;
    if (/<!DOCTYPE|<!ENTITY/.test(xml)) return null;
    var doc = new DOMParser().parseFromString(xml, "application/xml");
    return doc.getElementsByTagName("parsererror").length ? null : doc;
  }

  // ---- run and paragraph properties ----------------------------------------
  // Read as plain objects holding only what the element says, so that a style
  // chain can be merged key by key and "not said" stays different from "off".

  function readRPr(rPr) {
    var p = {};
    if (!rPr) return p;
    for (var c = rPr.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1 || c.namespaceURI !== W) continue;
      switch (c.localName) {
        case "rStyle": p.rStyle = wVal(c); break;
        case "b": p.b = toggle(c); break;
        case "i": p.i = toggle(c); break;
        case "strike": p.strike = toggle(c); break;
        case "dstrike": if (toggle(c)) p.strike = true; break;
        // Hidden text. Not w:webHidden (web view only; Word prints it) and not w:specVanish (a style separator's mark).
        case "vanish": p.vanish = toggle(c); break;
        case "u": { var u = wVal(c); p.u = u && u !== "none" ? u : false; break; }
        case "vertAlign": p.vertAlign = wVal(c) || "baseline"; break;
        case "sz": p.size = int(wVal(c), 0) || undefined; break;
        case "color": {
          p.color = wVal(c) || "auto";
          var tc = wAttr(c, "themeColor");
          if (tc) { p.themeColor = tc; p.themeTint = wAttr(c, "themeTint"); p.themeShade = wAttr(c, "themeShade"); }
          break;
        }
        case "rFonts": {
          // A theme reference beats a literal name given beside it.
          var f = {}, slots = [["ascii", "asciiTheme"], ["hAnsi", "hAnsiTheme"], ["eastAsia", "eastAsiaTheme"], ["cs", "cstheme"]];
          slots.forEach(function (s) {
            var th = wAttr(c, s[1]), lit = wAttr(c, s[0]);
            if (th) f[s[0]] = "@" + th; else if (lit) f[s[0]] = lit;
          });
          p.fonts = f;
          break;
        }
      }
    }
    return p;
  }
  function attrsOf(el, rename) {
    var out = {};
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i];
      if (a.namespaceURI !== W) continue;
      out[(rename && rename[a.localName]) || a.localName] = a.value;
    }
    return out;
  }
  function readPPr(pPr) {
    var p = {};
    if (!pPr) return p;
    for (var c = pPr.firstChild; c; c = c.nextSibling) {
      if (c.nodeType !== 1 || c.namespaceURI !== W) continue;
      switch (c.localName) {
        case "pStyle": p.pStyle = wVal(c); break;
        case "outlineLvl": p.outlineLvl = int(wVal(c), 9); break;
        case "jc": p.jc = wVal(c); break;
        case "pageBreakBefore": p.pageBreakBefore = toggle(c); break;
        case "spacing": p.spacing = attrsOf(c); break;
        case "ind": p.ind = attrsOf(c, { start: "left", end: "right" }); break;
        case "numPr": {
          var n = {}, id = child(c, W, "numId"), lvl = child(c, W, "ilvl");
          if (id) n.numId = wVal(id);
          if (lvl) n.ilvl = clamp(int(wVal(lvl), 0), 0, 8);
          p.numPr = n;
          break;
        }
        case "sectPr": p.sectPr = c; break;
        case "rPr": p.markRPr = c; break;
      }
    }
    return p;
  }
  function assign(out) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (src) for (var k in src) if (src[k] !== undefined) out[k] = src[k];
    }
    return out;
  }
  var COLOUR_KEYS = ["color", "themeColor", "themeTint", "themeShade"];
  function mergeRun(base, over) {
    var out = assign({}, base);
    if (!over) return out;
    for (var k in over) {
      if (over[k] === undefined) continue;
      if (k === "fonts") out.fonts = assign({}, base && base.fonts, over.fonts);
      else out[k] = over[k];
    }
    // A colour is one setting: a nearer plain colour must not keep a farther theme reference.
    if (over.color !== undefined || over.themeColor !== undefined) {
      COLOUR_KEYS.forEach(function (c) { if (over[c] == null) delete out[c]; else out[c] = over[c]; });
    }
    return out;
  }
  function mergePara(base, over) {
    var out = assign({}, base);
    if (!over) return out;
    ["outlineLvl", "jc", "pageBreakBefore"].forEach(function (k) { if (over[k] !== undefined) out[k] = over[k]; });
    if (over.numPr) out.numPr = assign({}, base && base.numPr, over.numPr);
    if (over.spacing) out.spacing = assign({}, base && base.spacing, over.spacing);
    if (over.ind) out.ind = assign({}, base && base.ind, over.ind);
    return out;
  }

  // ---- styles ---------------------------------------------------------------
  // Each style resolved down its basedOn chain. `run` and `para` are the
  // chain without the document defaults (a character style is laid over a
  // paragraph's formatting, so it must not bring the defaults with it); the
  // flat fields (b, font, size ...) include the defaults, for callers that
  // want to know what text in that style looks like.

  function parseStyles(xml) {
    var doc = toDoc(xml);
    var S = { byId: mapOf(), defaults: { run: {}, para: {} }, defaultParagraph: null, defaultCharacter: null };
    S.get = function (id) { return id != null && S.byId[id] ? S.byId[id] : null; };
    if (!doc) return S;
    var root = doc.documentElement;
    var dd = child(root, W, "docDefaults");
    if (dd) {
      S.defaults.run = readRPr(child(child(dd, W, "rPrDefault"), W, "rPr"));
      S.defaults.para = readPPr(child(child(dd, W, "pPrDefault"), W, "pPr"));
    }
    children(root, W, "style").forEach(function (st) {
      var id = wAttr(st, "styleId");
      if (id == null || S.byId[id]) return;
      var nameEl = child(st, W, "name"), basedEl = child(st, W, "basedOn");
      var s = { id: id, type: wAttr(st, "type") || "paragraph", name: nameEl ? (wVal(nameEl) || "") : "",
        basedOn: basedEl ? wVal(basedEl) : null,
        own: { run: readRPr(child(st, W, "rPr")), para: readPPr(child(st, W, "pPr")) }, firstRow: false };
      // A table style's first-row formatting: what makes a header row a header in most real files.
      children(st, W, "tblStylePr").forEach(function (t) {
        if (wAttr(t, "type") !== "firstRow") return;
        var b = toggle(child(child(t, W, "rPr"), W, "b"));
        var shd = child(child(t, W, "tcPr"), W, "shd");
        if (b || shaded(shd)) s.firstRow = true;
      });
      S.byId[id] = s;
      var isDefault = onAttr(wAttr(st, "default"));
      if (isDefault && s.type === "paragraph" && !S.defaultParagraph) S.defaultParagraph = id;
      if (isDefault && s.type === "character" && !S.defaultCharacter) S.defaultCharacter = id;
    });
    function resolve(s, seen) {
      if (s.chain) return s;
      var base = s.basedOn != null && S.byId[s.basedOn] && !seen[s.basedOn] ? S.byId[s.basedOn] : null;
      // A loop in basedOn (a damaged or hostile file) ends the chain where it closes.
      if (base) { seen[s.id] = true; resolve(base, seen); }
      s.run = mergeRun(base ? base.run : {}, s.own.run);
      s.para = mergePara(base ? base.para : {}, s.own.para);
      s.chain = [s].concat(base ? base.chain : []);
      s.firstRow = s.firstRow || !!(base && base.firstRow);
      var flat = mergeRun(S.defaults.run, s.run), flatPara = mergePara(S.defaults.para, s.para);
      s.outlineLvl = s.para.outlineLvl; s.numPr = s.para.numPr || null; s.jc = flatPara.jc; s.spacing = flatPara.spacing;
      s.b = !!flat.b; s.i = !!flat.i; s.u = !!flat.u; s.strike = !!flat.strike; s.vertAlign = flat.vertAlign || "baseline";
      s.font = flat.fonts ? flat.fonts.ascii : undefined; s.size = flat.size; s.color = flat.color;
      return s;
    }
    for (var id in S.byId) resolve(S.byId[id], mapOf());
    return S;
  }
  function shaded(shd) {
    if (!shd) return false;
    if (wAttr(shd, "themeFill")) return true;
    var fill = String(wAttr(shd, "fill") || "").toUpperCase();
    return !!fill && fill !== "AUTO" && fill !== "FFFFFF";
  }
  function styleOf(styles, pp) {
    return styles.get(pp.pStyle != null ? pp.pStyle : styles.defaultParagraph) || (pp.pStyle != null ? styles.get(styles.defaultParagraph) : null);
  }

  // The heading level a paragraph prints at in Word (1 to 9), or 0. Never
  // guessed from bold or large text: only from what the file says.
  function headingLevel(pPr, styles) {
    var pp = pPr && pPr.nodeType ? readPPr(pPr) : (pPr || {});
    return levelFrom(pp, styles || parseStyles(null));
  }
  function levelFrom(pp, styles) {
    if (pp.outlineLvl != null && pp.outlineLvl >= 0 && pp.outlineLvl <= 8) return pp.outlineLvl + 1;
    var st = styleOf(styles, pp);
    if (!st) return 0;
    if (st.outlineLvl != null && st.outlineLvl >= 0 && st.outlineLvl <= 8) return st.outlineLvl + 1;
    var i, m;
    for (i = 0; i < st.chain.length; i++) { m = /^heading\s*([1-9])$/i.exec(st.chain[i].name); if (m) return +m[1]; }
    for (i = 0; i < st.chain.length; i++) { m = LOCAL_HEADING.exec(st.chain[i].name); if (m) return +m[1]; }
    for (i = 0; i < st.chain.length; i++) { m = /^Heading\s*([1-9])$/i.exec(st.chain[i].id); if (m) return +m[1]; }
    return 0;
  }
  // Title, Subtitle and Caption are found the way headings are: by name down the chain.
  function roleOf(pp, styles) {
    var st = styleOf(styles, pp);
    if (!st) return null;
    for (var i = 0; i < st.chain.length; i++) {
      var n = String(st.chain[i].name || st.chain[i].id).toLowerCase();
      if (n === "title" || n === "subtitle" || n === "caption") return n;
    }
    return null;
  }

  // ---- numbering ------------------------------------------------------------

  function parseNumbering(xml) {
    var doc = toDoc(xml);
    var N = { abstracts: mapOf(), nums: mapOf() };
    function readLvl(l) {
      var fmt = child(l, W, "numFmt") || first(l, W, "numFmt"), txt = child(l, W, "lvlText"), start = child(l, W, "start");
      var ind = child(child(l, W, "pPr"), W, "ind"), ps = child(l, W, "pStyle");
      var a = ind ? attrsOf(ind, { start: "left", end: "right" }) : {};
      return { ilvl: clamp(int(wAttr(l, "ilvl"), 0), 0, 8), numFmt: fmt ? (wVal(fmt) || "decimal") : "decimal",
        lvlText: txt ? (wVal(txt) || "") : "", start: start ? int(wVal(start), 1) : 1,
        left: a.left != null ? int(a.left, 0) : null, pStyle: ps ? wVal(ps) : null };
    }
    if (doc) {
      var root = doc.documentElement;
      children(root, W, "abstractNum").forEach(function (a) {
        var id = wAttr(a, "abstractNumId");
        if (id == null) return;
        var link = child(a, W, "numStyleLink"), levels = mapOf();
        children(a, W, "lvl").forEach(function (l) { var lv = readLvl(l); levels[lv.ilvl] = lv; });
        N.abstracts[id] = { levels: levels, numStyleLink: link ? wVal(link) : null };
      });
      children(root, W, "num").forEach(function (n) {
        var id = wAttr(n, "numId"), abs = child(n, W, "abstractNumId");
        if (id == null || !abs) return;
        var overrides = mapOf();
        children(n, W, "lvlOverride").forEach(function (o) {
          var so = child(o, W, "startOverride"), l = child(o, W, "lvl");
          overrides[clamp(int(wAttr(o, "ilvl"), 0), 0, 8)] = { start: so ? int(wVal(so), 1) : null, lvl: l ? readLvl(l) : null };
        });
        N.nums[id] = { abstractId: wVal(abs), overrides: overrides };
      });
    }
    // The level a paragraph with this numId and ilvl takes its marker from.
    N.level = function (numId, ilvl, styles) {
      var num = N.nums[numId];
      if (!num) return null;
      var abs = N.abstracts[num.abstractId];
      // A list style: the abstract holds only a link to a style that names the real list.
      for (var hop = 0; abs && abs.numStyleLink && styles && hop < 5; hop++) {
        var st = styles.get(abs.numStyleLink), linked = st && st.numPr && N.nums[st.numPr.numId];
        if (!linked) break;
        abs = N.abstracts[linked.abstractId];
      }
      if (!abs) return null;
      var ov = num.overrides[ilvl], lvl = (ov && ov.lvl) || abs.levels[ilvl];
      if (!lvl) return null;
      return assign({}, lvl, { start: ov && ov.start != null ? ov.start : lvl.start, startOverride: !!(ov && ov.start != null) });
    };
    return N;
  }

  // What list a paragraph belongs to, or null. `left` is its left indent in
  // twips, which the caller compares between the items of one list.
  function listInfo(pPr, styles, numbering) {
    var pp = pPr && pPr.nodeType ? readPPr(pPr) : (pPr || {});
    return listFrom(pp, styles || parseStyles(null), numbering || parseNumbering(null));
  }
  function listFrom(pp, styles, numbering) {
    var st = styleOf(styles, pp), own = pp.numPr || {}, inherited = (st && st.numPr) || {};
    var numId = own.numId != null ? own.numId : inherited.numId;
    if (numId == null || String(numId) === "0") return null;
    var ilvl = own.ilvl != null ? own.ilvl : inherited.ilvl;
    if (ilvl == null) {
      // A style tied to a list level says so on the level, not on itself.
      ilvl = 0;
      var num = numbering.nums[numId], abs = num && numbering.abstracts[num.abstractId];
      if (abs && st) for (var k in abs.levels) if (abs.levels[k].pStyle === st.id) ilvl = abs.levels[k].ilvl;
    }
    var lvl = numbering.level(numId, ilvl, styles);
    if (!lvl) return null;
    var left = pp.ind && pp.ind.left != null ? int(pp.ind.left, 0)
      : lvl.left != null ? lvl.left
      : st && st.para.ind && st.para.ind.left != null ? int(st.para.ind.left, 0) : 0;
    // Which list it counts with. The built-in list styles of one family are one list at several
    // depths; an item numbered directly on the list the plain style uses is in that list too.
    var fam = own.numId == null ? listFamily(st) : null;
    var key = fam ? "style:" + fam.family : (familyNums(styles)[String(numId)] || String(numId));
    return { kind: lvl.numFmt === "bullet" ? "bullet" : lvl.numFmt === "none" ? "none" : "number",
      numId: String(numId), ilvl: ilvl, numFmt: lvl.numFmt, lvlText: lvl.lvlText, start: lvl.start,
      startOverride: lvl.startOverride, left: left, levelLeft: lvl.left, fromStyle: own.numId == null,
      key: key, styleDepth: fam ? fam.depth : 0 };
  }
  // numId -> list key, for the lists that Word's plain "List Number" and "List Bullet" styles use.
  function familyNums(styles) {
    if (styles.familyNums) return styles.familyNums;
    var out = mapOf();
    for (var id in styles.byId) {
      var s = styles.byId[id], fam = s.type === "paragraph" && s.numPr && s.numPr.numId != null ? listFamily(s) : null;
      if (fam && fam.depth === 0 && !out[String(s.numPr.numId)]) out[String(s.numPr.numId)] = "style:" + fam.family;
    }
    return (styles.familyNums = out);
  }

  // ---- theme ------------------------------------------------------------------

  function parseTheme(xml) {
    var doc = toDoc(xml);
    var T = { colors: {}, fonts: { major: { latin: "", ea: "", cs: "" }, minor: { latin: "", ea: "", cs: "" } } };
    if (!doc) return T;
    var scheme = first(doc, A, "clrScheme");
    if (scheme) kids(scheme).forEach(function (c) {
      var rgb = child(c, A, "srgbClr"), sys = child(c, A, "sysClr");
      var v = rgb ? rgb.getAttribute("val") : sys ? sys.getAttribute("lastClr") : null;
      if (v && /^[0-9a-f]{6}$/i.test(v)) T.colors[c.localName] = v.toUpperCase();
    });
    var fs = first(doc, A, "fontScheme");
    ["major", "minor"].forEach(function (which) {
      var f = fs && child(fs, A, which + "Font");
      if (!f) return;
      ["latin", "ea", "cs"].forEach(function (slot) {
        var e = child(f, A, slot);
        T.fonts[which][slot] = e ? (e.getAttribute("typeface") || "") : "";
      });
    });
    return T;
  }
  // Word's names for theme colours in w:themeColor, against the scheme's own.
  var THEME_COLOUR = { dark1: "dk1", light1: "lt1", dark2: "dk2", light2: "lt2", text1: "dk1", background1: "lt1",
    text2: "dk2", background2: "lt2", hyperlink: "hlink", followedHyperlink: "folHlink" };
  function themeFont(theme, token) {
    var which = /^major/.test(token) ? "major" : "minor";
    var slot = /EastAsia$/.test(token) ? "ea" : /Bidi$/.test(token) ? "cs" : "latin";
    return (theme && theme.fonts[which][slot]) || "";
  }
  function fontName(slot, theme) {
    if (!slot) return "";
    return slot.charAt(0) === "@" ? themeFont(theme, slot.slice(1)) : slot;
  }
  function colourHex(run, theme) {
    var plain = /^[0-9a-f]{6}$/i.test(run.color || "") ? run.color.toUpperCase() : null;
    if (run.themeColor && theme) {
      var base = theme.colors[THEME_COLOUR[run.themeColor] || run.themeColor];
      if (base) {
        // With a tint or shade Word saves the worked-out colour beside the reference; that is exact, ours would not be.
        if (!run.themeTint && !run.themeShade) return base;
        if (plain) return plain;
        var t = run.themeTint ? parseInt(run.themeTint, 16) / 255 : 1, s = run.themeShade ? parseInt(run.themeShade, 16) / 255 : 1;
        return [0, 2, 4].map(function (i) {
          var c = parseInt(base.substr(i, 2), 16);
          c = Math.round((c * t + 255 * (1 - t)) * s);
          return ("0" + clamp(c, 0, 255).toString(16)).slice(-2);
        }).join("").toUpperCase();
      }
    }
    return plain;
  }

  // ---- effective formatting ---------------------------------------------------
  // What a run or a paragraph really looks like in the source: its own
  // settings over its character style, its paragraph's style chain and the
  // document defaults, with theme fonts and colours turned into names and
  // hex values. Stamped onto the text inside kept text boxes, where the
  // styles it leaned on will not exist in the generated file.

  function paraOf(node) {
    for (var n = node; n; n = n.parentNode) if (n.nodeType === 1 && is(n, W, "p")) return n;
    return null;
  }
  function effectiveRun(own, pp, styles, theme) {
    var st = styleOf(styles, pp);
    var eff = mergeRun(styles.defaults.run, st ? st.run : null);
    var cs = own.rStyle != null ? styles.get(own.rStyle) : null;
    if (cs) eff = mergeRun(eff, cs.run);
    eff = mergeRun(eff, own);
    var f = eff.fonts || {}, latin = fontName(f.ascii, theme) || fontName(f.hAnsi, theme) || "Times New Roman";
    return { font: latin, hAnsi: fontName(f.hAnsi, theme) || latin, eastAsia: fontName(f.eastAsia, theme), cs: fontName(f.cs, theme),
      size: eff.size || 20, b: !!eff.b, i: !!eff.i, u: eff.u || false, strike: !!eff.strike,
      vertAlign: eff.vertAlign || "baseline", color: colourHex(eff, theme), vanish: !!eff.vanish };
  }
  function effectiveFormat(node, styles, theme) {
    if (!node || node.nodeType !== 1) return {};
    styles = styles || parseStyles(null);
    if (is(node, W, "p")) {
      var pp = readPPr(child(node, W, "pPr")), st = styleOf(styles, pp);
      var para = mergePara(mergePara(styles.defaults.para, st ? st.para : null), pp);
      var numbered = !!(para.numPr && para.numPr.numId != null && String(para.numPr.numId) !== "0");
      return { jc: para.jc || "left", spacing: assign({ before: "0", after: "0", line: "240", lineRule: "auto" }, para.spacing),
        ind: assign({}, para.ind), numbered: numbered, mark: effectiveRun(readRPr(pp.markRPr), pp, styles, theme) };
    }
    var p = paraOf(node);
    return effectiveRun(readRPr(child(node, W, "rPr")), p ? readPPr(child(p, W, "pPr")) : {}, styles, theme);
  }

  // Word refuses some orders of run properties and tolerates others; the
  // schema's own order is the one that is always right, so rebuilt
  // properties are written in it.
  var RPR_ORDER = ["rStyle", "rFonts", "b", "bCs", "i", "iCs", "caps", "smallCaps", "strike", "dstrike", "outline", "shadow",
    "emboss", "imprint", "noProof", "snapToGrid", "vanish", "webHidden", "color", "spacing", "w", "kern", "position", "sz",
    "szCs", "highlight", "u", "effect", "bdr", "shd", "fitText", "vertAlign", "rtl", "cs", "em", "lang", "eastAsianLayout",
    "specVanish", "oMath"];
  var PPR_ORDER = ["pStyle", "keepNext", "keepLines", "pageBreakBefore", "framePr", "widowControl", "numPr",
    "suppressLineNumbers", "pBdr", "shd", "tabs", "suppressAutoHyphens", "kinsoku", "wordWrap", "overflowPunct",
    "topLinePunct", "autoSpaceDE", "autoSpaceDN", "bidi", "adjustRightInd", "snapToGrid", "spacing", "ind",
    "contextualSpacing", "mirrorIndents", "suppressOverlap", "jc", "textDirection", "textAlignment", "textboxTightWrap",
    "outlineLvl", "divId", "cnfStyle", "rPr", "sectPr", "pPrChange"];
  var RPR_REPLACED = { rStyle: 1, rFonts: 1, b: 1, bCs: 1, i: 1, iCs: 1, strike: 1, color: 1, sz: 1, szCs: 1, u: 1,
    vertAlign: 1, vanish: 1, rPrChange: 1, ins: 1, del: 1, moveFrom: 1, moveTo: 1 };
  var PPR_REPLACED = { pStyle: 1, numPr: 1, spacing: 1, ind: 1, jc: 1, rPr: 1, pPrChange: 1 };

  function wEl(xdoc, prefix, local, attrs) {
    var e = xdoc.createElementNS(W, prefix + ":" + local);
    for (var k in attrs) if (attrs[k] != null && attrs[k] !== "") e.setAttributeNS(W, prefix + ":" + k, String(attrs[k]));
    return e;
  }
  // Fill `target` with the kept children of `old` and the new ones, in schema
  // order; anything from another namespace (w14 text effects) goes last, as Word writes it.
  function rebuild(target, old, replaced, fresh, order) {
    var byName = mapOf(), foreign = [];
    if (old) kids(old).forEach(function (c) {
      if (c.namespaceURI !== W) foreign.push(c);
      else if (!replaced[c.localName]) byName[c.localName] = c;
    });
    fresh.forEach(function (e) { byName[e.localName] = e; });
    while (target.firstChild) target.removeChild(target.firstChild);
    order.forEach(function (n) { if (byName[n]) { target.appendChild(byName[n]); delete byName[n]; } });
    for (var k in byName) target.appendChild(byName[k]);
    foreign.forEach(function (c) { target.appendChild(c); });
    return target;
  }
  function stampRPr(xdoc, prefix, rPr, f) {
    var fresh = [wEl(xdoc, prefix, "rFonts", { ascii: f.font, hAnsi: f.hAnsi, eastAsia: f.eastAsia, cs: f.cs }),
      wEl(xdoc, prefix, "sz", { val: f.size }), wEl(xdoc, prefix, "szCs", { val: f.size })];
    if (f.b) fresh.push(wEl(xdoc, prefix, "b", {}), wEl(xdoc, prefix, "bCs", {}));
    if (f.i) fresh.push(wEl(xdoc, prefix, "i", {}), wEl(xdoc, prefix, "iCs", {}));
    if (f.strike) fresh.push(wEl(xdoc, prefix, "strike", {}));
    if (f.u) fresh.push(wEl(xdoc, prefix, "u", { val: f.u }));
    if (f.color) fresh.push(wEl(xdoc, prefix, "color", { val: f.color }));
    if (f.vertAlign !== "baseline") fresh.push(wEl(xdoc, prefix, "vertAlign", { val: f.vertAlign }));
    // Text hidden through a style stays hidden when the style is gone.
    if (f.vanish) fresh.push(wEl(xdoc, prefix, "vanish", {}));
    var old = rPr ? rPr.cloneNode(true) : null;
    return rebuild(rPr || wEl(xdoc, prefix, "rPr", {}), old, RPR_REPLACED, fresh, RPR_ORDER);
  }

  var TRACK_DROP = { del: 1, moveFrom: 1, commentRangeStart: 1, commentRangeEnd: 1, commentReference: 1, bookmarkStart: 1,
    bookmarkEnd: 1, footnoteReference: 1, endnoteReference: 1, moveFromRangeStart: 1, moveFromRangeEnd: 1,
    moveToRangeStart: 1, moveToRangeEnd: 1, rPrChange: 1, pPrChange: 1, delText: 1, delInstrText: 1,
    lastRenderedPageBreak: 1 };
  // The text inside a kept text box, made to stand on its own. Returns true
  // when a numbered paragraph lost its number.
  function settleTextBox(box, styles, theme) {
    var xdoc = box.ownerDocument, prefix = box.prefix || "w", lostNumber = false;
    var all = box.getElementsByTagNameNS(W, "*"), i, list = [];
    for (i = 0; i < all.length; i++) list.push(all[i]);
    list.forEach(function (e) {
      if (!e.parentNode) return;
      if (TRACK_DROP[e.localName]) e.parentNode.removeChild(e);
      else if (e.localName === "ins" || e.localName === "moveTo") {
        // An insertion inside run properties is a mark, not a wrapper.
        if (is(e.parentNode, W, "rPr") || is(e.parentNode, W, "trPr") || is(e.parentNode, W, "numPr")) { e.parentNode.removeChild(e); return; }
        while (e.firstChild) e.parentNode.insertBefore(e.firstChild, e);
        e.parentNode.removeChild(e);
      }
    });
    var paras = box.getElementsByTagNameNS(W, "p"), plist = [];
    for (i = 0; i < paras.length; i++) plist.push(paras[i]);
    plist.forEach(function (p) {
      // Word's paragraph ids must be unique in a file, and a copied block would repeat them. They are optional.
      p.removeAttributeNS(W14, "paraId"); p.removeAttributeNS(W14, "textId");
      var pPr = child(p, W, "pPr"), pp = readPPr(pPr), pf = effectiveFormat(p, styles, theme);
      var runs = p.getElementsByTagNameNS(W, "r"), rlist = [], j;
      for (j = 0; j < runs.length; j++) if (paraOf(runs[j]) === p) rlist.push(runs[j]);
      // Formats are worked out before anything is rewritten, while the style references are still there.
      var formats = rlist.map(function (r) { return effectiveRun(readRPr(child(r, W, "rPr")), pp, styles, theme); });
      rlist.forEach(function (r, k) {
        var rPr = child(r, W, "rPr"), made = stampRPr(xdoc, prefix, rPr, formats[k]);
        if (!rPr) r.insertBefore(made, r.firstChild);
      });
      if (pf.numbered) lostNumber = true;
      var mark = stampRPr(xdoc, prefix, pp.markRPr ? pp.markRPr.cloneNode(true) : null, pf.mark);
      var fresh = [wEl(xdoc, prefix, "spacing", pf.spacing), wEl(xdoc, prefix, "jc", { val: pf.jc }), mark];
      var ind = wEl(xdoc, prefix, "ind", pf.ind);
      if (ind.attributes.length) fresh.push(ind);
      var old = pPr ? pPr.cloneNode(true) : null, target = pPr || wEl(xdoc, prefix, "pPr", {});
      rebuild(target, old, PPR_REPLACED, fresh, PPR_ORDER);
      if (!pPr) p.insertBefore(target, p.firstChild);
    });
    return lostNumber;
  }

  // ---- pictures and drawings ----------------------------------------------------

  // A CSS length from a VML style, in px at 96 dpi.
  function cssPx(v) {
    var m = /^\s*(-?[\d.]+)\s*([a-z%]*)/i.exec(v || "");
    if (!m) return 0;
    var n = parseFloat(m[1]), unit = m[2].toLowerCase();
    var per = { pt: 96 / 72, "in": 96, cm: 96 / 2.54, mm: 96 / 25.4, pc: 16, px: 1, "": 1, emu: 1 / EMU_PER_PX };
    return isFinite(n) && per[unit] != null ? n * per[unit] : 0;
  }
  function styleMap(style) {
    var out = {};
    String(style || "").split(";").forEach(function (d) {
      var i = d.indexOf(":");
      if (i > 0) out[d.slice(0, i).trim().toLowerCase()] = d.slice(i + 1).trim();
    });
    return out;
  }
  // A size from the file, made safe: a drawing claiming to be kilometres wide
  // is brought down to something a page could hold, in proportion.
  function safeSize(w, h) {
    w = isFinite(w) && w > 0 ? w : 0; h = isFinite(h) && h > 0 ? h : 0;
    var over = Math.max(w, h) / MAX_PX;
    if (over > 1) { w = w / over; h = h / over; }
    return { width: Math.round(w), height: Math.round(h) };
  }
  function boxText(node) {
    var boxes = node.getElementsByTagNameNS(W, "txbxContent"), out = [];
    for (var i = 0; i < boxes.length; i++) {
      // The VML fallback repeats the words of the drawing beside it.
      var inFallback = false;
      for (var n = boxes[i].parentNode; n && n !== node; n = n.parentNode) if (is(n, MC, "Fallback")) inFallback = true;
      if (inFallback && out.length) continue;
      var ps = boxes[i].getElementsByTagNameNS(W, "p");
      for (var j = 0; j < ps.length; j++) { var t = textOf(ps[j], W, "t").trim(); if (t) out.push(t); }
    }
    return out.join(" ");
  }

  function classifyDml(node) {
    var box = child(node, WP, "inline") || child(node, WP, "anchor");
    var out = { kind: "other", plain: false, floating: !!box && box.localName === "anchor", width: 0, height: 0,
      name: "", descr: "", text: "", embed: null, link: null, reasons: [] };
    if (!box) return out;
    var ext = child(box, WP, "extent"), pr = child(box, WP, "docPr");
    if (ext) assign(out, safeSize(int(ext.getAttribute("cx"), 0) / EMU_PER_PX, int(ext.getAttribute("cy"), 0) / EMU_PER_PX));
    if (pr) { out.name = pr.getAttribute("name") || ""; out.descr = pr.getAttribute("descr") || pr.getAttribute("title") || ""; }
    var data = first(box, A, "graphicData"), uri = data ? (data.getAttribute("uri") || "") : "";
    if (/\/picture$/.test(uri)) {
      out.kind = "picture";
      var blip = first(data, A, "blip"), spPr = null, i;
      kids(data).forEach(function (pic) { kids(pic).forEach(function (c) { if (c.localName === "spPr") spPr = c; }); });
      if (blip) { out.embed = blip.getAttributeNS(R, "embed") || null; out.link = blip.getAttributeNS(R, "link") || null; }
      // A link on the picture itself (Insert Link on a picture): Word writes it on wp:docPr and on pic:cNvPr.
      // A picture block has no link, so the caller decides what becomes of it (objectBlock).
      var click = first(box, A, "hlinkClick");
      if (click) out.click = click.getAttributeNS(R, "id") || "";
      if (out.link) out.reasons.push("linked");
      if (!out.embed && !out.link) out.reasons.push("empty");
      var crop = first(data, A, "srcRect");
      if (crop && ["l", "t", "r", "b"].some(function (k) { return int(crop.getAttribute(k), 0) !== 0; })) out.reasons.push("crop");
      var xfrm = spPr && child(spPr, A, "xfrm");
      if (xfrm && (int(xfrm.getAttribute("rot"), 0) !== 0 || xfrm.getAttribute("flipH") === "1" || xfrm.getAttribute("flipV") === "1")) out.reasons.push("rotation");
      var effects = false;
      if (spPr) kids(spPr).forEach(function (c) {
        if (c.localName === "effectDag" || c.localName === "scene3d" || c.localName === "sp3d" || c.localName === "custGeom") effects = true;
        if (c.localName === "effectLst" && kids(c).length) effects = true;
        if (c.localName === "prstGeom" && (c.getAttribute("prst") || "rect") !== "rect") effects = true;
      });
      if (blip) {
        kids(blip).forEach(function (c) { if (c.localName !== "extLst") effects = true; });
        var all = blip.getElementsByTagName("*");
        for (i = 0; i < all.length; i++) {
          if (all[i].localName === "svgBlip") out.reasons.push("svg");
          if (all[i].localName === "imgEffect") effects = true;
        }
      }
      if (effects) out.reasons.push("effects");
      out.plain = out.reasons.length === 0;
      return out;
    }
    if (/\/wordprocessingShape$/.test(uri)) {
      var c = first(data, "*", "cNvSpPr");
      out.kind = c && c.getAttribute("txBox") === "1" ? "textbox" : "shape";
    } else if (/\/wordprocessingGroup$/.test(uri)) out.kind = "group";
    else if (/\/wordprocessingCanvas$/.test(uri)) out.kind = "canvas";
    else if (/\/diagram$/.test(uri)) out.kind = "smartart";
    else if (/\/chart$|\/chartex$/.test(uri)) out.kind = "chart";
    out.text = boxText(node);
    return out;
  }
  function classifyVml(node, isObject) {
    var out = { kind: "shape", plain: false, floating: false, width: 0, height: 0, name: "", descr: "", text: "",
      embed: null, link: null, reasons: [] };
    if (first(node, W, "control")) { out.kind = "control"; return out; }
    var shapes = kids(node).filter(function (c) { return c.namespaceURI === V && c.localName !== "shapetype"; });
    var shape = shapes[0] || null, image = first(node, V, "imagedata");
    if (shape) {
      var st = styleMap(shape.getAttribute("style"));
      assign(out, safeSize(cssPx(st.width), cssPx(st.height)));
      out.floating = st.position === "absolute";
      out.name = shape.getAttributeNS(O, "title") || shape.getAttribute("title") || "";
      out.descr = shape.getAttribute("alt") || "";
      if (st.rotation && parseFloat(st.rotation)) out.reasons.push("rotation");
      // The older way to put a link on a picture: an address on the shape itself.
      if (shape.getAttribute("href")) out.href = shape.getAttribute("href");
    }
    if (image) {
      out.embed = image.getAttributeNS(R, "id") || image.getAttributeNS(R, "pict") || image.getAttributeNS(O, "relid") || null;
      if (image.getAttributeNS(R, "href") || image.getAttributeNS(O, "href")) { out.link = image.getAttributeNS(R, "href") || null; out.reasons.push("linked"); }
      if (["cropleft", "croptop", "cropright", "cropbottom"].some(function (k) { return image.hasAttribute(k); })) out.reasons.push("crop");
    }
    if (isObject) {
      var ole = first(node, O, "OLEObject") || first(node, W, "objectEmbed") || first(node, W, "objectLink");
      out.kind = ole ? "ole" : "other";
      out.progId = ole ? (ole.getAttribute("ProgID") || wAttr(ole, "progId") || "") : "";
      // A newer file draws the object's picture with DrawingML; its size is there.
      var dml = child(node, W, "drawing");
      if (dml && !out.width) { var d = classifyDml(dml); out.width = d.width; out.height = d.height; out.embed = out.embed || d.embed; }
      return out;
    }
    // A watermark is WordArt with a telling id: Word's own (they live in headers) and the
    // house template's, which also prints one on the cover, in the body.
    var art = first(node, V, "textpath"), artText = "";
    [].forEach.call(node.getElementsByTagNameNS(V, "textpath"), function (t) { artText = t.getAttribute("string") || artText; });
    if (art && shape && /^(DraftWatermark|PowerPlusWaterMarkObject|WordPictureWatermark)/.test(shape.getAttribute("id") || "")) {
      out.kind = "watermark"; out.text = artText;
      return out;
    }
    if (shapes.some(function (s) { return s.localName === "group"; })) out.kind = "group";
    else if (first(node, V, "textbox")) out.kind = "textbox";
    else if (image && shapes.length === 1 && !first(node, V, "textpath")) {
      out.kind = "picture";
      if (!out.embed && !out.link) out.reasons.push("empty");
      out.plain = out.reasons.length === 0;
    }
    out.text = boxText(node);
    return out;
  }
  // What a drawing is and what becomes of it. `plain` is true for a picture
  // the tool can print itself; everything else is kept as it is, apart from
  // kind "control" and kind "watermark", which are never carried.
  function classifyDrawing(node) {
    if (!node || node.nodeType !== 1) return null;
    if (node.namespaceURI === M && (node.localName === "oMath" || node.localName === "oMathPara")) {
      return { kind: "equation", plain: false, floating: false, width: 0, height: 0, name: "", descr: "",
        text: textOf(node, M, "t"), embed: null, link: null, reasons: [] };
    }
    if (is(node, W, "drawing")) return classifyDml(node);
    if (is(node, W, "object")) return classifyVml(node, true);
    if (is(node, W, "pict")) return classifyVml(node, false);
    if (is(node, MC, "AlternateContent")) {
      var best = null;
      kids(node).forEach(function (branch) {
        var inner = first(branch, W, "drawing") || first(branch, W, "pict") || first(branch, W, "object");
        var c = inner ? classifyDrawing(inner) : null;
        if (!c) return;
        if (!best) best = c;
        else { if (!best.width) { best.width = c.width; best.height = c.height; } if (!best.descr) best.descr = c.descr; }
      });
      // Whatever it holds, the two versions of it must travel together.
      if (best) best.plain = false;
      return best;
    }
    return null;
  }
  function holdsDrawing(node) {
    return !!(first(node, W, "drawing") || first(node, W, "pict") || first(node, W, "object"));
  }

  // The type and natural size of a picture, from its first bytes. The file
  // name is not believed: a .png that is really something else is not a PNG.
  function imageInfo(b, name) {
    var n = b.length, type = null, w = 0, h = 0;
    function be16(i) { return (b[i] << 8) | b[i + 1]; }
    function le16(i) { return b[i] | (b[i + 1] << 8); }
    function le32(i) { return (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0; }
    if (n > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) {
      type = "image/png"; w = ((be16(16) << 16) | be16(18)) >>> 0; h = ((be16(20) << 16) | be16(22)) >>> 0;
    } else if (n > 10 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) {
      type = "image/gif"; w = le16(6); h = le16(8);
    } else if (n > 26 && b[0] === 0x42 && b[1] === 0x4D) {
      type = "image/bmp"; w = le32(18); h = Math.abs(le32(22) | 0);
    } else if (n > 4 && b[0] === 0xFF && b[1] === 0xD8) {
      type = "image/jpeg";
      for (var i = 2; i + 9 < n;) {
        if (b[i] !== 0xFF) { i++; continue; }
        var mk = b[i + 1];
        if (mk >= 0xC0 && mk <= 0xCF && mk !== 0xC4 && mk !== 0xC8 && mk !== 0xCC) { h = be16(i + 5); w = be16(i + 7); break; }
        if (mk === 0xFF || mk === 0xD8 || (mk >= 0xD0 && mk <= 0xD7) || mk === 0x01) { i += 2; continue; }
        i += 2 + Math.max(2, be16(i + 2));
      }
    } else if (n > 4 && ((b[0] === 0x49 && b[1] === 0x49 && b[2] === 0x2A && b[3] === 0) || (b[0] === 0x4D && b[1] === 0x4D && b[2] === 0 && b[3] === 0x2A))) {
      type = "image/tiff";
    } else if (n > 44 && le32(0) === 1 && b[40] === 0x20 && b[41] === 0x45 && b[42] === 0x4D && b[43] === 0x46) {
      type = "image/x-emf";
    } else if (n > 4 && ((b[0] === 0xD7 && b[1] === 0xCD && b[2] === 0xC6 && b[3] === 0x9A) || (b[0] === 1 && b[1] === 0 && b[2] === 9 && b[3] === 0))) {
      type = "image/x-wmf";
    }
    if (!type && /<svg[\s>]/i.test(new TextDecoder().decode(b.subarray(0, 512)))) type = "image/svg+xml";
    var s = safeSize(w, h);
    return { type: type, width: s.width, height: s.height, ext: String(name || "").split(".").pop().toLowerCase() };
  }

  // ---- the package ----------------------------------------------------------

  function dirOf(name) { return name.slice(0, name.lastIndexOf("/") + 1); }
  function baseOf(name) { return name.slice(name.lastIndexOf("/") + 1); }
  // A relationship target against the part that names it. ".." can never
  // climb out of the package: there is nothing above the top to pop.
  function resolveTarget(base, target) {
    var path = target.charAt(0) === "/" ? target.slice(1) : dirOf(base) + target, out = [];
    path.split("/").forEach(function (s) {
      if (s === "..") out.pop(); else if (s !== "." && s !== "") out.push(s);
    });
    return out.join("/");
  }
  function relKind(type) { type = String(type || ""); return type.slice(type.lastIndexOf("/") + 1); }
  function decodeXml(bytes) {
    if (bytes.length > 1 && bytes[0] === 0xFF && bytes[1] === 0xFE) return new TextDecoder("utf-16le").decode(bytes);
    if (bytes.length > 1 && bytes[0] === 0xFE && bytes[1] === 0xFF) return new TextDecoder("utf-16be").decode(bytes);
    return new TextDecoder().decode(bytes);
  }
  // "<!DOCTYPE" or "<!ENTITY" anywhere in a part. Word never writes either,
  // and they are how an XML file is made to expand without end or to reach
  // outside itself, so their presence alone refuses the file.
  function hasDoctype(bytes) {
    if (bytes.length > 1 && ((bytes[0] === 0xFF && bytes[1] === 0xFE) || (bytes[0] === 0xFE && bytes[1] === 0xFF))) {
      return /<!DOCTYPE|<!ENTITY/.test(decodeXml(bytes));
    }
    for (var i = 0, n = bytes.length - 8; i < n; i++) {
      if (bytes[i] !== 0x3C || bytes[i + 1] !== 0x21) continue;
      var c = bytes[i + 2];
      if (c === 0x44 && bytes[i + 3] === 0x4F && bytes[i + 4] === 0x43 && bytes[i + 5] === 0x54 && bytes[i + 6] === 0x59 && bytes[i + 7] === 0x50 && bytes[i + 8] === 0x45) return true;
      if (c === 0x45 && bytes[i + 3] === 0x4E && bytes[i + 4] === 0x54 && bytes[i + 5] === 0x49 && bytes[i + 6] === 0x54 && bytes[i + 7] === 0x59) return true;
    }
    return false;
  }
  var DAMAGED = "This Word file is damaged and could not be read. Open it in Word, save it again and load that.";

  function openPackage(entries) {
    var byName = mapOf(), names = [];
    entries.forEach(function (e) {
      var n = String(e.name || "");
      // A name that tries to leave the package, or a folder entry, is not a part.
      if (!n || n.charAt(n.length - 1) === "/" || n.charAt(0) === "/" || n.indexOf("\\") >= 0 || n.split("/").indexOf("..") >= 0) return;
      var key = n.toLowerCase();
      if (!byName[key]) { byName[key] = { name: n, bytes: e.bytes }; names.push(n); }
    });
    var pkg = { names: names, xmlCache: mapOf(), relCache: mapOf() };
    pkg.part = function (name) {
      if (name == null) return null;
      var hit = byName[String(name).toLowerCase()];
      if (!hit) { try { hit = byName[decodeURIComponent(String(name)).toLowerCase()]; } catch (e) { hit = null; } }
      return hit || null;
    };
    names.forEach(function (n) {
      if (/\.(xml|rels|vml)$/i.test(n) && hasDoctype(byName[n.toLowerCase()].bytes)) {
        throw refuse("doctype", "This file holds a document type declaration, which a Word file never does. It was not opened.");
      }
    });
    pkg.xml = function (name) {
      var p = pkg.part(name);
      if (!p) return null;
      if (pkg.xmlCache[p.name]) return pkg.xmlCache[p.name];
      var doc = new DOMParser().parseFromString(decodeXml(p.bytes), "application/xml");
      if (doc.doctype || doc.getElementsByTagName("parsererror").length) throw refuse("damaged", DAMAGED);
      return (pkg.xmlCache[p.name] = doc);
    };
    // A part's relationships: internal targets resolved to part names, external ones left as written.
    pkg.rels = function (name) {
      if (pkg.relCache[name]) return pkg.relCache[name];
      var doc = pkg.xml(dirOf(name) + "_rels/" + baseOf(name) + ".rels"), out = [];
      if (doc) kids(doc.documentElement).forEach(function (r) {
        if (r.localName !== "Relationship") return;
        var external = r.getAttribute("TargetMode") === "External", target = r.getAttribute("Target") || "";
        out.push({ id: r.getAttribute("Id") || "", type: r.getAttribute("Type") || "", external: external,
          target: external ? target : resolveTarget(name, target) });
      });
      return (pkg.relCache[name] = out);
    };
    var types = pkg.xml("[Content_Types].xml"), defaults = mapOf(), overrides = mapOf();
    if (types) kids(types.documentElement).forEach(function (t) {
      if (t.localName === "Default") defaults[String(t.getAttribute("Extension") || "").toLowerCase()] = t.getAttribute("ContentType") || "";
      if (t.localName === "Override") overrides[String(t.getAttribute("PartName") || "").replace(/^\//, "").toLowerCase()] = t.getAttribute("ContentType") || "";
    });
    pkg.contentType = function (name) {
      var key = String(name).toLowerCase();
      return overrides[key] || defaults[key.split(".").pop()] || "application/octet-stream";
    };
    return pkg;
  }

  // ---- read -------------------------------------------------------------------

  function pause() { return new Promise(function (res) { setTimeout(res, 0); }); }

  function read(blob, opts) {
    opts = opts || {};
    var maxBytes = opts.maxBytes || MAX_BYTES;
    var progress = function (f, label) { if (typeof opts.onProgress === "function") { try { opts.onProgress(f, label); } catch (e) { /* the caller's own trouble */ } } };
    return Promise.resolve().then(function () {
      if (!blob || typeof blob.arrayBuffer !== "function") throw refuse("not-word", "This is not a Word file (.docx).");
      if (blob.size > maxBytes) {
        throw refuse("too-big", "This file is " + Math.ceil(blob.size / 1048576) + " MB, which is more than this tool can load (" + Math.round(maxBytes / 1048576) + " MB).");
      }
      progress(0.02, "Reading the file");
      return blob.slice(0, 8).arrayBuffer();
    }).then(function (head) {
      var h = new Uint8Array(head);
      if (h.length > 3 && h[0] === 0xD0 && h[1] === 0xCF && h[2] === 0x11 && h[3] === 0xE0) {
        throw refuse("not-zip", "This is an older Word file (.doc) or one protected with a password. In Word, use Save as and choose Word Document (.docx) with no password, then load that.");
      }
      if (!(h.length > 3 && h[0] === 0x50 && h[1] === 0x4B)) throw refuse("not-zip", "This is not a Word file (.docx).");
      return window.App.ZipIO.read(blob, opts.maxTotalBytes ? { maxTotalBytes: opts.maxTotalBytes } : undefined).then(null, function (e) {
        var why = /:\s*(.+?)\.?$/.exec((e && e.message) || "");
        throw refuse("zip", "This Word file could not be opened" + (why ? ": " + why[1] + "." : "."));
      });
    }).then(function (entries) {
      progress(0.15, "Reading the file");
      return build(openPackage(entries || []), blob, opts, maxBytes, progress);
    }).then(null, function (e) {
      if (e && e.plain) throw e;
      // Anything unforeseen in a damaged or hostile file still ends in a sentence, never a stack.
      var out = refuse("damaged", DAMAGED);
      out.cause = e;
      throw out;
    });
  }

  function build(pkg, blob, opts, maxBytes, progress) {
    // -- find the document --------------------------------------------------
    var top = pkg.rels(""), mainRel = null;
    top.forEach(function (r) { if (!mainRel && !r.external && relKind(r.type) === "officeDocument") mainRel = r; });
    if (!mainRel || !pkg.part(mainRel.target)) throw refuse("not-word", "This file is not a Word document.");
    var mainName = pkg.part(mainRel.target).name, mainType = pkg.contentType(mainName);
    if (/spreadsheetml|presentationml|visio/.test(mainType)) throw refuse("not-word", "This file is not a Word document.");
    var mainDoc = pkg.xml(mainName), root = mainDoc.documentElement;
    if (root.namespaceURI === W_STRICT) {
      throw refuse("strict", "This file is saved as Strict Open XML. In Word, use Save as and choose Word Document (.docx), then load that.");
    }
    var body = child(root, W, "body");
    if (root.namespaceURI !== W || !body) throw refuse("not-word", "This file is not a Word document.");

    var mainRels = mapOf(), curRels;
    pkg.rels(mainName).forEach(function (r) { mainRels[r.id] = r; });
    curRels = mainRels;
    function partsOfKind(kind) {
      return pkg.rels(mainName).filter(function (r) { return !r.external && relKind(r.type) === kind && pkg.part(r.target); })
        .map(function (r) { return pkg.part(r.target).name; });
    }
    function xmlOfKind(kind) { var n = partsOfKind(kind)[0]; return n ? pkg.xml(n) : null; }

    var styles = parseStyles(xmlOfKind("styles"));
    var numbering = parseNumbering(xmlOfKind("numbering"));
    var themeName = partsOfKind("theme")[0] || null;
    var theme = parseTheme(themeName ? pkg.xml(themeName) : null);

    // -- the project being built ---------------------------------------------
    var nextId = 1;
    function nid(prefix) { return prefix + (nextId++); }
    var project = {
      schema: "spt-document/1.0",
      id: "doc-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
      createdAt: new Date().toISOString(), savedAt: "",
      createdWithVersion: (window.App.Version && window.App.Version.number) || "",
      savedBy: { product: (window.App.Product && window.App.Product.name) || "OT Cyber Document Tool",
        version: (window.App.Version && window.App.Version.number) || "" },
      kind: "report",
      info: { title: "", docType: "", reference: "", client: "", site: "", author: "", revision: "0.1", date: "",
        qaReviewBy: "", authorisedBy: "", issuedTo: "", issuedDate: "", classification: "Confidential" },
      options: { numberHeadings: false, contents: false },
      nextId: 1, blocks: [], footnotes: {}, media: {}, parts: {}
    };
    var blocks = project.blocks;
    var diagramDone = mapOf();              // data parts whose drawing id has been rewritten
    var rawBytes = mapOf();                 // key -> bytes, until the Blobs are made at the end
    var mediaByPart = mapOf(), partByName = mapOf(), carriedBytes = 0;
    var titleTaken = false, linkCount = 0, insertions = 0, deletions = 0;
    var linkRuns = 0;                       // pieces of text that took a link: a link is counted once it has one
    var lastDrop = "contents";              // the report code of the list last left out
    var POINTED = ["internal-links", "other-links", "fields-no-text", "notes-missing"];   // lines that point at the paragraph they are about
    var fields = [];                        // open complex fields; they can span paragraphs
    var refFields = 0;                      // cross-references to a section or page, kept as their text
    var refBlocks = [], headsNumbered = [], headsPlain = [];   // block ids, for the heading-numbers line
    var plcDepth = 0;                       // inside a content control that still shows its prompt
    var tocDrops = 0, dropMarks = [];       // contents lists left out, and the block before each thing left out
    var sections = [], sectionFrom = 0;
    var tally = mapOf();

    // One line of the report. Every branch that drops or alters something ends here.
    function note(code, n, extra) {
      var t = tally[code] || (tally[code] = { code: code, count: 0, examples: [], blockIds: [] });
      t.count += (n == null ? 1 : n);
      if (extra && extra.example && t.examples.length < 5) { var q = quote(extra.example); if (q) t.examples.push(q); }
      if (extra && extra.blockId && t.blockIds.length < 50 && t.blockIds.indexOf(extra.blockId) < 0) t.blockIds.push(extra.blockId);
      return t;
    }

    // -- notes, comments, headers --------------------------------------------
    var notes = { footnote: mapOf(), endnote: mapOf() }, noteRels = { footnote: mapOf(), endnote: mapOf() };
    [["footnote", "footnotes"], ["endnote", "endnotes"]].forEach(function (k) {
      var name = partsOfKind(k[1])[0];
      if (!name) return;
      children(pkg.xml(name).documentElement, W, k[0]).forEach(function (n) {
        var id = wAttr(n, "id"), type = wAttr(n, "type");
        if (id != null && (!type || type === "normal")) notes[k[0]][id] = n;
      });
      pkg.rels(name).forEach(function (r) { noteRels[k[0]][r.id] = r; });
    });
    partsOfKind("comments").forEach(function (name) {
      children(pkg.xml(name).documentElement, W, "comment").forEach(function (c) { note("comments", 1, { example: wordsOf(c) }); });
    });
    partsOfKind("header").concat(partsOfKind("footer")).forEach(function (name) {
      var doc = pkg.xml(name), text = [], ps = doc.getElementsByTagNameNS(W, "p");
      for (var i = 0; i < ps.length; i++) { var t = wordsOf(ps[i]).trim(); if (t) text.push(t); }
      // A header holding only a watermark or a logo still goes; it is counted so that it is not lost unseen.
      if (text.length || holdsDrawing(doc.documentElement)) note("headers-footers", 1, { example: text.join(" ") });
    });
    if (pkg.names.some(function (n) { return /vbaProject\.bin$/i.test(n); })) note("macros", 1);

    // -- carried parts ---------------------------------------------------------
    function addBytes(bytes) {
      carriedBytes += bytes.length;
      if (carriedBytes > maxBytes) {
        throw refuse("too-big", "The pictures and drawings in this file come to more than this tool can hold (" + Math.round(maxBytes / 1048576) + " MB).");
      }
    }
    // A picture's bytes as a media entry. One entry per source part, however often it is used.
    function mediaFor(partName) {
      var p = pkg.part(partName);
      if (!p) return null;
      if (mediaByPart[p.name]) return mediaByPart[p.name];
      var info = imageInfo(p.bytes, p.name), type = info.type || MEDIA_TYPES[info.ext] || null;
      if (!type || type === "image/svg+xml") return null;
      var key = nid("m");
      project.media[key] = { type: type, name: baseOf(p.name), width: info.width, height: info.height, source: "import", blob: null };
      rawBytes[key] = p.bytes;
      addBytes(p.bytes);
      return (mediaByPart[p.name] = key);
    }
    function mediaType(partName) {
      var p = pkg.part(partName);
      if (!p) return null;
      var info = imageInfo(p.bytes, p.name);
      return info.type || MEDIA_TYPES[info.ext] || null;
    }
    // A part and everything it depends on, as part keys. Its own relationship
    // ids stay as they were, because the part's XML refers to them.
    // While carryLog is set, every part added is listed in it and every part that
    // could not be had is counted, at any depth, so the caller can judge the whole
    // closure and take it back out (uncarry) if it is not complete.
    // A carried part's XML is not read, so its links to things outside the file are judged by the
    // relationship alone, the way a link in the text is: a link that is not to a web or email address
    // keeps its id (the part's XML refers to it, and Word refuses a part that points at nothing) but
    // is pointed at an empty page. Anything else outside the file (a linked picture, the workbook a
    // chart is linked to) is never carried: Word would fetch it when the file is opened, and a
    // file on a share hands that share the reader's Windows sign-in. The part's XML is read just
    // enough to take the reference off (unlinkOutside); a part that still needs it afterwards
    // counts as one that could not be had. Each is listed for the caller to report.
    var carryLog = null, carryMisses = 0, carryBadLinks = 0, carryOutside = [];
    var BLANK_LINK = "about:blank";
    function carry(partName) {
      var p = pkg.part(partName);
      if (!p) { carryMisses++; return null; }
      if (partByName[p.name]) return partByName[p.name];
      // Active content is never carried, whatever points at it.
      if (/vbaProject\.bin$/i.test(p.name) || /(^|\/)activeX\//i.test(p.name) || p.name === mainName) { carryMisses++; return null; }
      var key = nid("p"), entry = { name: p.name, contentType: pkg.contentType(p.name), blob: null, rels: [] };
      partByName[p.name] = key;
      project.parts[key] = entry;
      rawBytes[key] = p.bytes;
      addBytes(p.bytes);
      if (carryLog) carryLog.push(key);
      var away = mapOf(), anyAway = false;
      pkg.rels(p.name).forEach(function (r) {
        if (r.external) {
          var isLink = relKind(r.type) === "hyperlink", refused = isLink && !okLink(r.target);
          if (!isLink) { away[r.id] = r; anyAway = true; return; }
          if (refused) carryBadLinks++;
          entry.rels.push({ id: r.id, type: r.type, external: refused ? BLANK_LINK : r.target });
          return;
        }
        var k = carry(r.target);
        if (k) entry.rels.push({ id: r.id, type: r.type, part: k });
      });
      if (anyAway) {
        var xml = /xml$/i.test(entry.contentType || "") || /\.xml$/i.test(p.name) ? toDoc(decodeXml(p.bytes)) : null;
        var cut = xml ? unlinkOutside(xml.documentElement, function (id) { return away[id] || null; }) : null;
        // Each is said, whether the part's XML named it or not.
        for (var id in away) carryOutside.push({ kind: relKind(away[id].type) === "image" ? "image" : "other", target: away[id].target });
        if (!cut || cut.left) carryMisses++;
        else {
          var out = new TextEncoder().encode(new XMLSerializer().serializeToString(xml));
          carriedBytes += out.length - rawBytes[key].length;
          rawBytes[key] = out;
        }
      }
      return key;
    }
    function uncarry(keys) {
      keys.forEach(function (key) {
        carriedBytes -= rawBytes[key].length;
        delete partByName[project.parts[key].name]; delete project.parts[key]; delete rawBytes[key];
      });
    }

    // -- kept objects ------------------------------------------------------------
    // Every namespace prefix in scope at a node of the source, nearest first.
    function scopeOf(node) {
      var out = mapOf();
      for (var n = node; n && n.nodeType === 1; n = n.parentNode) {
        for (var i = 0; i < n.attributes.length; i++) {
          var a = n.attributes[i];
          if (a.namespaceURI === XMLNS && a.prefix === "xmlns" && !(a.localName in out)) out[a.localName] = a.value;
        }
      }
      return out;
    }
    function describe(c) {
      var words = KIND_WORDS[c.kind] || KIND_WORDS.other;
      if (c.kind === "ole" && c.progId) words += " (" + c.progId + ")";
      if (c.width && c.height) words += ", " + (c.width * 2.54 / 96).toFixed(1) + " x " + (c.height * 2.54 / 96).toFixed(1) + " cm";
      return words;
    }
    function labelOf(c) {
      return c.name && c.descr && c.name !== c.descr ? c.name + ": " + c.descr : (c.name || c.descr || "");
    }

    // A kept object's XML is carried, not read, so what it links to is settled here, by the rule for
    // a link in the text: only a web or email address is carried. Any other link inside a drawing or
    // a text box (a file, a share, a script) is taken off; its words or its shape stay. A field in a
    // text box that makes Word fetch something when the file is opened (INCLUDEPICTURE, INCLUDETEXT,
    // LINK, DDE) is turned into what it showed. Returns how many links and fields that was. A text
    // box travels in two versions (DrawingML and its VML fallback): what is in both is counted once.
    function fetches(code) {
      code = String(code || "").trim();
      if (/^(INCLUDEPICTURE|INCLUDETEXT|IMPORT|LINK|DDE|DDEAUTO)\b/i.test(code)) return "fields";
      if (/^HYPERLINK\b/i.test(code)) { var h = linkOf(code); return h.url && !okLink(h.href) ? "links" : null; }
      return null;
    }
    function cleanLinks(top) {
      var seen = { links: [0, 0], fields: [0, 0] }, all = [top], found = top.getElementsByTagName("*"), i;
      for (i = 0; i < found.length; i++) all.push(found[i]);
      function gone(what, e) {
        var fallback = 0;
        for (var n = e; n && n !== top; n = n.parentNode) if (n.nodeType === 1 && is(n, MC, "Fallback")) fallback = 1;
        seen[what][fallback]++;
      }
      function unwrap(e) {
        while (e.firstChild) e.parentNode.insertBefore(e.firstChild, e);
        e.parentNode.removeChild(e);
      }
      all.forEach(function (e) {
        if (e !== top && !top.contains(e)) return;
        var bad = [];
        for (var k = 0; k < e.attributes.length; k++) {
          var a = e.attributes[k], r = a.namespaceURI === R && a.value ? mainRels[a.value] : null;
          if (r && r.external && relKind(r.type) === "hyperlink" && !okLink(r.target)) bad.push(a);
        }
        // VML writes a link as an address on the shape itself, with no relationship.
        if (e.namespaceURI === V && e.getAttribute("href") && !okLink(e.getAttribute("href"))) { gone("links", e); e.removeAttribute("href"); }
        if (!bad.length) return;
        gone("links", e);
        if (e !== top && e.namespaceURI === A && /^hlink/.test(e.localName)) e.parentNode.removeChild(e);
        // Its words stay, without the link's blue underline.
        else if (e !== top && is(e, W, "hyperlink")) { unstyleLink([e]); unwrap(e); }
        else bad.forEach(function (x) { e.removeAttributeNode(x); });
      });
      var boxes = top.getElementsByTagNameNS(W, "txbxContent");
      for (i = 0; i < boxes.length; i++) {
        var marks = [], stack = [], els = boxes[i].getElementsByTagNameNS(W, "*"), j;
        for (j = 0; j < els.length; j++) if (els[j].localName === "fldChar" || els[j].localName === "instrText" || els[j].localName === "fldSimple") marks.push(els[j]);
        marks.forEach(function (e) {
          var open = stack[stack.length - 1], why;
          if (e.localName === "fldSimple") {
            why = fetches(wAttr(e, "instr"));
            if (why) { gone(why, e); if (why === "links") unstyleLink([e]); unwrap(e); }
          } else if (e.localName === "instrText") {
            if (open && !open.result) { open.code += e.textContent; open.els.push(e); }
          } else {
            var type = wAttr(e, "fldCharType");
            if (type === "begin") stack.push({ code: "", els: [e], result: false });
            else if (type === "separate" && open) { open.result = true; open.els.push(e); }
            else if (type === "end" && open) {
              stack.pop();
              open.els.push(e);
              why = fetches(open.code);
              if (!why) return;
              gone(why, e);
              // A link's words lose the link's look with the link.
              if (why === "links") unstyleLink(fieldResult(open.els));
              // The marks and the code go; the result between them stays as it is.
              open.els.forEach(function (x) {
                var run = x.parentNode;
                if (!run) return;
                run.removeChild(x);
                if (is(run, W, "r") && run.parentNode && !kids(run).some(function (c) { return !is(c, W, "rPr"); })) run.parentNode.removeChild(run);
              });
            }
          }
        });
      }
      return { links: Math.max(seen.links[0], seen.links[1]), fields: Math.max(seen.fields[0], seen.fields[1]) };
    }
    function distinct(list) { return list.filter(function (x, i) { return list.indexOf(x) === i; }); }

    // What a drawing would fetch from outside the file when Word opens it is taken off: a linked
    // picture (an image relationship to an address, which is also what an INCLUDEPICTURE field
    // leaves behind), the workbook a chart is linked to, a linked object. Word fetches these on
    // open, and an address on a share hands that share the reader's Windows sign-in. `relOf(id)`
    // gives the relationship an r: attribute names; only one outside the file that is not a link
    // to click counts. A picture that also holds its own copy keeps the copy; a picture that was
    // only the link goes, the smallest whole piece of the drawing with it (a picture in a text
    // box's words, a picture in a group); a chart loses its link to the workbook and keeps the
    // figures it showed. Returns { pics, others: addresses taken off, left: true when something
    // still needs an address and could not be taken off without breaking the drawing }.
    var PIC_NS = "http://schemas.openxmlformats.org/drawingml/2006/picture";
    function unlinkOutside(root, relOf) {
      var res = { pics: [], others: [], left: false }, all = [root], found = root.getElementsByTagName("*"), i;
      for (i = 0; i < found.length; i++) all.push(found[i]);
      function outside(v) { var r = v ? relOf(v) : null; return r && r.external && relKind(r.type) !== "hyperlink" ? r : null; }
      // The piece that can go on its own: a picture inside a text box's words, or one member of a group.
      function piece(e) {
        var cand = null;
        for (var n = e; n && n !== root; n = n.parentNode) {
          if (n.nodeType !== 1) continue;
          var up = n.parentNode;
          if (n.namespaceURI === PIC_NS && n.localName === "pic" && up && /^(grpSp|wgp|wpc)$/.test(up.localName)) return n;
          if (n.namespaceURI === V && up && up.namespaceURI === V && up.localName === "group") return n;
          if (is(n, W, "drawing") || is(n, W, "pict") || is(n, W, "object")) cand = cand || n;
          if (is(n, W, "txbxContent")) return cand;
        }
        return null;
      }
      function shows(e) {
        if (e.namespaceURI === A && e.localName === "blip") return e.hasAttributeNS(R, "embed") && !!e.getAttributeNS(R, "embed");
        if (e.namespaceURI === V && e.localName === "imagedata") return !!(e.getAttributeNS(R, "id") || e.getAttributeNS(R, "pict") || e.getAttributeNS(O, "relid"));
        return false;
      }
      all.forEach(function (e) {
        if (e !== root && !root.contains(e)) return;
        var hits = [];
        for (var k = 0; k < e.attributes.length; k++) {
          var a = e.attributes[k], r = (a.namespaceURI === R || (a.namespaceURI === O && a.localName === "relid")) ? outside(a.value) : null;
          if (r) hits.push({ a: a, r: r });
        }
        // VML keeps the address a linked picture came from on the picture itself, with no relationship.
        if (e.namespaceURI === V && e.localName === "imagedata" && e.hasAttributeNS(O, "href")) e.removeAttributeNS(O, "href");
        if (!hits.length) return;
        var picture = false, other = false;
        hits.forEach(function (h) {
          if (relKind(h.r.type) === "image") { picture = true; res.pics.push(h.r.target); }
          else { other = true; res.others.push(h.r.target); }
          e.removeAttributeNode(h.a);
        });
        if (other) {
          // A chart's link to its workbook: the chart keeps the figures it holds.
          if (e.localName === "externalData") { e.parentNode.removeChild(e); return; }
          var p = piece(e);
          if (p) p.parentNode.removeChild(p); else res.left = true;
          return;
        }
        if (picture && !shows(e)) {
          // A picture that is the whole drawing stays empty here: the caller leaves the drawing out
          // (showsPicture). Anywhere else a picture's reference is optional, and is simply gone.
          var q = piece(e);
          if (q) q.parentNode.removeChild(q);
        }
      });
      res.pics = distinct(res.pics); res.others = distinct(res.others);
      return res;
    }
    // Whether a drawing still shows a picture of its own (after unlinkOutside).
    function showsPicture(root) {
      var blips = root.getElementsByTagNameNS(A, "blip"), i;
      for (i = 0; i < blips.length; i++) if (blips[i].getAttributeNS(R, "embed")) return true;
      var images = root.getElementsByTagNameNS(V, "imagedata");
      for (i = 0; i < images.length; i++) if (images[i].getAttributeNS(R, "id") || images[i].getAttributeNS(R, "pict") || images[i].getAttributeNS(O, "relid")) return true;
      return false;
    }
    // A link's own look (Word's Hyperlink character style), taken off the words of a link that is removed.
    function linkStyle(id) {
      if (id == null || id === "") return false;
      var s = styles.get(id);
      return /^(Followed)?Hyperlink$/.test(id) || !!(s && s.chain.some(function (x) { return /^(followed )?hyperlink$/i.test(x.name || "") || /^(Followed)?Hyperlink$/.test(x.id || ""); }));
    }
    // The runs a field shows (between its separate and end marks), from its marks.
    function fieldResult(els) {
      var sep = null, end = els[els.length - 1], out = [];
      els.forEach(function (x) { if (x.localName === "fldChar" && wAttr(x, "fldCharType") === "separate") sep = x; });
      if (!sep || !end) return out;
      var p = sep;
      while (p && !is(p, W, "p") && !is(p, W, "txbxContent")) p = p.parentNode;
      if (!p) return out;
      var runs = p.getElementsByTagNameNS(W, "r"), FOLLOWING = 4;
      for (var i = 0; i < runs.length; i++) {
        if ((sep.compareDocumentPosition(runs[i]) & FOLLOWING) && (runs[i].compareDocumentPosition(end) & FOLLOWING)) out.push(runs[i]);
      }
      return out;
    }
    function unstyleLink(nodes) {
      nodes.forEach(function (el) {
        var list = [], found = el.getElementsByTagNameNS(W, "rStyle");
        if (is(el, W, "rStyle")) list.push(el);
        for (var i = 0; i < found.length; i++) list.push(found[i]);
        list.forEach(function (s) { if (s.parentNode && is(s.parentNode, W, "rPr") && linkStyle(wVal(s))) s.parentNode.removeChild(s); });
      });
    }

    // `useId` is given when several drawings travel as one block (see floatBlock).
    function keep(obj, c, align, useId) {
      var id = useId || nid("b"), label = labelOf(c) || KIND_WORDS[c.kind] || "Drawing";
      var xdoc = new DOMParser().parseFromString('<w:r xmlns:w="' + W + '"/>', "application/xml");
      var top, copy = xdoc.importNode(obj.node, true);
      if (c.kind === "equation") top = copy;
      else {
        top = xdoc.documentElement;
        // Of the run's own properties only "do not spell-check" still means anything.
        if (obj.run && child(child(obj.run, W, "rPr"), W, "noProof")) top.appendChild(wEl(xdoc, "w", "rPr", {})).appendChild(wEl(xdoc, "w", "noProof", {}));
        top.appendChild(copy);
      }
      var i, list = [], all = top.getElementsByTagNameNS(W, "lastRenderedPageBreak");
      for (i = 0; i < all.length; i++) list.push(all[i]);
      list.forEach(function (e) { e.parentNode.removeChild(e); });

      // Links first, while the words of a link still carry its style: one taken off loses its look
      // too (unstyleLink). Then the text boxes are made to stand on their own.
      var cleaned = cleanLinks(top);
      var lost = false, boxes = top.getElementsByTagNameNS(W, "txbxContent");
      for (i = 0; i < boxes.length; i++) if (settleTextBox(boxes[i], styles, theme)) lost = true;

      // Nothing it would fetch from outside the file is carried (unlinkOutside). When that leaves
      // nothing to show, or something in it cannot do without the address, it is left out.
      var cut = unlinkOutside(top, function (old) { return mainRels[old] || null; });
      function linkedNotes(pics, others, blockId) {
        var where = blockId ? { blockId: blockId } : null;
        if (pics.length) { note("linked-pictures", pics.length, where); pics.forEach(function (t) { note("linked-pictures", 0, { example: t }); }); }
        if (others.length) { note("linked-objects", others.length, where); others.forEach(function (t) { note("linked-objects", 0, { example: t }); }); }
      }
      if (cut.left || (c.kind === "picture" && cut.pics.length && !showsPicture(top))) {
        linkedNotes(cut.pics, cut.others, null);
        return null;
      }

      // Relationship ids: each becomes an id of our own, unique in the document.
      var rels = [], renamed = mapOf(), missing = false;
      function rename(old) {
        if (renamed[old]) return renamed[old];
        var fresh = (renamed[old] = nid("sptK")), r = mainRels[old];
        if (!r) { missing = true; return fresh; }
        if (r.external) {
          // Only a link to click is left by now (see cleanLinks and unlinkOutside); anything else
          // outside the file is never carried, so an address the drawing still names is a part it has lost.
          if (relKind(r.type) !== "hyperlink") { missing = true; return fresh; }
          rels.push({ id: fresh, type: r.type, external: r.target });
          return fresh;
        }
        var key = carry(r.target);
        if (key) rels.push({ id: fresh, type: r.type, part: key });
        return fresh;
      }
      carryLog = []; carryMisses = 0; carryBadLinks = 0; carryOutside = [];
      var els = [top], found = top.getElementsByTagName("*");
      for (i = 0; i < found.length; i++) els.push(found[i]);
      els.forEach(function (e) {
        for (var k = 0; k < e.attributes.length; k++) {
          var a = e.attributes[k];
          if (!a.value) continue;
          if (a.namespaceURI === R || (a.namespaceURI === O && a.localName === "relid")) a.value = rename(a.value);
        }
      });
      var added = carryLog;
      carryLog = null;
      if (carryMisses) missing = true;
      // What was taken off because Word would fetch it from outside the file, here and in the parts
      // carried with it: said, with the address, whether or not the drawing itself stays.
      var away = carryOutside;
      carryOutside = [];
      var awayPics = distinct(cut.pics.concat(away.filter(function (x) { return x.kind === "image"; }).map(function (x) { return x.target; })));
      var awayOther = distinct(cut.others.concat(away.filter(function (x) { return x.kind !== "image"; }).map(function (x) { return x.target; })));
      // Real Word refuses the whole file when a chart, a diagram or an embedded object points at a
      // relationship that is not there, or when a chart's workbook is gone (tried: "The file appears
      // to be corrupted"). A picture with its image missing only shows an empty frame. So a picture
      // is kept, and anything else that has lost a part anywhere in what it depends on is left out
      // and named in the report.
      if (missing && c.kind !== "picture") {
        uncarry(added);
        note("objects-lost", 1, { example: label });
        linkedNotes(awayPics, awayOther, null);
        return null;
      }
      if (missing) note("unreadable-part", 1, { example: label, blockId: id });
      if (lost) note("lists-in-drawings", 1, { blockId: id });
      // Links taken off, here and in the parts carried with it, and fields turned into what they showed.
      if (cleaned.links + carryBadLinks) note("links-in-drawings", cleaned.links + carryBadLinks, { blockId: id, example: label });
      if (cleaned.fields) note("fields", cleaned.fields, { blockId: id });
      // A link round the drawing itself (a w:hyperlink or a HYPERLINK field) has nothing left to sit on.
      if (obj.link) note("picture-links", 1, { blockId: id, example: obj.link });
      linkedNotes(awayPics, awayOther, id);

      // SmartArt: the data part names its drawing part by a document-level id
      // that is not an r: attribute, so it is found and rewritten by name.
      if (c.kind === "smartart") rels.slice().forEach(function (r) {
        if (relKind(r.type) !== "diagramData" || !r.part || !rawBytes[r.part]) return;
        var bytes = rawBytes[r.part];
        if (bytes[0] === 0xFF || bytes[0] === 0xFE) return;
        var text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
        var m = /(<[\w.:-]*dataModelExt\b[^>]*?\brelId=")([^"]*)(")/.exec(text);
        // A data part is rewritten once. The id it holds may already look like one of ours (a file
        // this tool exported, read back): it is still that file's id and is renamed like any other.
        if (!m || diagramDone[r.part]) return;
        diagramDone[r.part] = true;
        // Without its drawing part Word draws the diagram again from the data (tried), so the
        // diagram stays; but the old id must not survive to collide with one in the generated file.
        var target = mainRels[m[2]], fresh = nid("sptK");
        carryLog = []; carryMisses = 0;
        var key = target && !target.external ? carry(target.target) : null;
        if (key && carryMisses) { uncarry(carryLog); key = null; }
        carryLog = null;
        if (key) rels.push({ id: fresh, type: target.type, part: key });
        else note("unreadable-part", 1, { example: label, blockId: id });
        var out = new TextEncoder().encode(text.slice(0, m.index) + m[1] + fresh + m[3] + text.slice(m.index + m[0].length));
        carriedBytes += out.length - bytes.length;
        rawBytes[r.part] = out;
      });

      // The fragment must declare every prefix it uses, including the ones
      // named only inside attribute values (mc:Choice Requires="wps").
      var scope = scopeOf(obj.node), bare = new XMLSerializer().serializeToString(top);
      for (var prefix in scope) {
        if (prefix === "xml" || top.hasAttributeNS(XMLNS, prefix)) continue;
        var safe = prefix.replace(/[^\w-]/g, "\\$&");
        var used = bare.indexOf("<" + prefix + ":") >= 0 || bare.indexOf(" " + prefix + ":") >= 0 ||
          new RegExp('(?:Requires|Ignorable|ProcessContent|MustUnderstand)="(?:[^"]*\\s)?' + safe + '(?:\\s[^"]*)?"').test(bare);
        if (used) top.setAttributeNS(XMLNS, "xmlns:" + prefix, scope[prefix]);
      }

      var block = { id: id, type: "kept", kind: c.kind, xml: new XMLSerializer().serializeToString(top), rels: rels,
        width: c.width, height: c.height, floating: !!c.floating, text: c.text || "", description: describe(c) };
      if (labelOf(c)) block.label = labelOf(c);
      if (align && !c.floating) block.align = align;
      // A picture of it the browser can show, when the file has one.
      var shown = c.embed && mainRels[c.embed] && !mainRels[c.embed].external ? mainRels[c.embed].target : null;
      if (shown && SHOWN[mediaType(shown)]) { var mk = mediaFor(shown); if (mk) block.preview = mk; }
      if (c.kind === "smartart" && !block.text) {
        rels.forEach(function (r) {
          if (relKind(r.type) !== "diagramData" || !r.part) return;
          var d = toDoc(new TextDecoder().decode(rawBytes[r.part])), words = [];
          if (!d) return;
          var ts = d.getElementsByTagNameNS(A, "t");
          for (var k = 0; k < ts.length; k++) { var t = ts[k].textContent.trim(); if (t) words.push(t); }
          block.text = words.join(" ");
        });
      }
      // It still floats, but the text it floated beside has been restyled: to be looked at in Word.
      if (block.floating) note("floating-drawings", 1, { blockId: id });
      return block;
    }

    // -- floating drawings ---------------------------------------------------------
    // A floating drawing is placed by its anchor: so far across the column, so
    // far down from the paragraph that holds it. Two rules keep it where it was.
    // Drawings anchored in one paragraph stay in one paragraph, as one block,
    // so they keep their places against each other. And a run of paragraphs
    // with no words, where a diagram was drawn over blank lines, travels whole:
    // every anchor in its own paragraph, the blank lines between and after
    // them, each with the font size and spacing it had in the source, so the
    // distances down the page and the room left for the drawing are the same.
    var held = null;            // { out, items: [{ p, objs }] }: wordless paragraphs not yet emitted
    var roomAfter = false;      // the last paragraph emitted holds a drawing that lies over what follows it

    // The drawing as a kept floating object, or null when it is anything else.
    function floatOf(obj) {
      var c = classifyDrawing(obj.node);
      return c && c.floating && !c.plain && c.kind !== "control" && c.kind !== "watermark" ? c : null;
    }
    // Where an anchor puts its drawing, in px: x and y as written, whether y is
    // measured from the paragraph, and whether the text takes no notice of it.
    function anchorPlace(node) {
      var a = first(node, WP, "anchor");
      if (a) {
        var off = function (pos) { var o = pos && child(pos, WP, "posOffset"); return o ? int(o.textContent, 0) / EMU_PER_PX : 0; };
        var pv = child(a, WP, "positionV"), rel = pv ? (pv.getAttribute("relativeFrom") || "paragraph") : "paragraph";
        return { x: off(child(a, WP, "positionH")), y: off(pv), byPara: rel === "paragraph" || rel === "line", loose: !!child(a, WP, "wrapNone") };
      }
      var shapes = node.getElementsByTagNameNS(V, "*"), st = null;
      for (var i = 0; i < shapes.length && !st; i++) {
        if (shapes[i].localName !== "shapetype" && shapes[i].getAttribute("style")) st = styleMap(shapes[i].getAttribute("style"));
      }
      st = st || {};
      var vr = st["mso-position-vertical-relative"] || "text", wrap = first(node, W10, "wrap");
      return { x: cssPx(st["margin-left"]), y: cssPx(st["margin-top"]), byPara: vr === "text" || vr === "line" || vr === "paragraph",
        loose: !wrap || (wrap.getAttribute("type") || "none") === "none" };
    }
    function attr(v) { return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    // One paragraph of the source that has no words, written to stand on its own: the same height in
    // any document, holding `runs` (its anchors). Its height in px is worked out roughly, for the card.
    function spacerPara(p, runs) {
      var f = effectiveFormat(p, styles, theme), sp = f.spacing || {}, ind = f.ind || {}, m = f.mark || {}, xml, k;
      xml = '<w:p xmlns:w="' + W + '"><w:pPr><w:keepNext/><w:spacing';
      ["before", "beforeLines", "beforeAutospacing", "after", "afterLines", "afterAutospacing", "line", "lineRule"].forEach(function (name) {
        if (sp[name] != null && sp[name] !== "") xml += ' w:' + name + '="' + attr(sp[name]) + '"';
      });
      xml += "/>";
      var indent = "";
      for (k in { left: 1, right: 1, hanging: 1, firstLine: 1 }) if (ind[k] != null && /^-?\d+$/.test(ind[k])) indent += ' w:' + k + '="' + ind[k] + '"';
      if (indent) xml += "<w:ind" + indent + "/>";
      if (f.jc && f.jc !== "left") xml += '<w:jc w:val="' + attr(f.jc) + '"/>';
      xml += "<w:rPr><w:rFonts";
      [["ascii", m.font], ["hAnsi", m.hAnsi], ["eastAsia", m.eastAsia], ["cs", m.cs]].forEach(function (s) {
        if (s[1]) xml += ' w:' + s[0] + '="' + attr(s[1]) + '"';
      });
      var size = int(m.size, 20) || 20;
      xml += '/><w:sz w:val="' + size + '"/><w:szCs w:val="' + size + '"/></w:rPr></w:pPr>' + runs + "</w:p>";
      var line = int(sp.line, 240), rule = sp.lineRule || "auto";
      var pt = (rule === "auto" ? size / 2 * 1.2 * line / 240 : line / 20) + (int(sp.before, 0) + int(sp.after, 0)) / 20;
      return { xml: xml, height: pt * 96 / 72 };
    }
    function cm(px) { return (px * 2.54 / 96).toFixed(1); }

    // Several floating drawings as ONE kept block. `items` is a list of
    // { p, objs }: with `whole` each is a source paragraph written out in full
    // (the block's XML is then paragraphs, which the writer puts in place of the
    // token's own paragraph); without it the drawings are runs side by side,
    // for the writer to put in a paragraph of no height before the text they
    // were anchored in. Null when nothing of it could be carried.
    function floatBlock(items, whole, keepEmpty) {
      var id = nid("b"), xml = "", rels = [], words = [], names = [], n = 0, one = null, loose = false;
      var top = 0, x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      items.forEach(function (it) {
        var runs = "";
        it.objs.forEach(function (obj) {
          var c = floatOf(obj), b = c ? keep(obj, c, null, id) : null;
          if (!b) return;
          var at = anchorPlace(obj.node);
          runs += b.xml; rels = rels.concat(b.rels); n++;
          one = n === 1 ? b : null;
          if (b.text) words.push(b.text);
          if (b.label && names.indexOf(b.label) < 0) names.push(b.label);
          if (at.loose && at.byPara) loose = true;
          x0 = Math.min(x0, at.x); x1 = Math.max(x1, at.x + b.width);
          y0 = Math.min(y0, top + at.y); y1 = Math.max(y1, top + at.y + b.height);
        });
        if (!whole) { xml += runs; return; }
        var sp = spacerPara(it.p, runs);
        xml += sp.xml; top += sp.height;
      });
      if (!n && !(whole && keepEmpty)) return null;
      var block;
      if (one && !whole) block = one;
      else {
        var width = n ? Math.round(x1 - x0) : 0, height = Math.round(Math.max(n ? y1 - Math.min(y0, 0) : 0, top));
        block = { id: id, type: "kept", kind: one ? one.kind : n ? "group" : "other", xml: xml, rels: rels, width: width, height: height,
          floating: true, text: words.join(" ") };
        if (one) {
          block.description = one.description;
          if (one.label) block.label = one.label;
          if (one.preview) block.preview = one.preview;
        } else if (n) {
          block.description = n + " shapes drawn on the page" + (width && height ? ", " + cm(width) + " x " + cm(height) + " cm" : "");
          // Their own names, so the card says which drawing this is.
          var label = names.join(", ");
          if (label) block.label = label.length > 160 ? label.slice(0, 159) + "…" : label;
        } else {
          block.description = "Blank lines that left room for a drawing, " + cm(height) + " cm";
        }
      }
      if (loose) Object.defineProperty(block, "__loose", { value: true, enumerable: false, configurable: true });
      return block;
    }

    // A paragraph with no words that is either empty or holds only floating
    // drawings is not emitted at once: what comes next decides what it is.
    // A table cell holds them the same way (the cell's own paragraphs, released
    // when the cell ends), so a diagram drawn in a cell keeps its shape and the
    // cell its height. There a numbered paragraph with no words is not held: its
    // number is what the cell shows (see emit).
    function holdSpacer(p, pp, style, st, out, env) {
      if (st.inNote || st.parts.length !== 1) return false;
      var seg = st.parts[0];
      if (seg.runs.some(function (r) { return r.fn || String(r.t).trim() !== ""; })) return false;
      if (seg.objects.some(function (o) { return !floatOf(o); })) return false;
      if (env.cell && !seg.objects.length && !levelFrom(pp, styles) && roleOf(pp, styles) !== "title") {
        var li = listFrom(pp, styles, numbering);
        if (li && li.kind !== "none") return false;
      }
      // (A cell has no page breaks: emit leaves them out there.)
      if (!env.cell && mergePara(style ? style.para : null, pp).pageBreakBefore) return false;
      if (held && held.out !== out) releaseSpacers();
      if (!held) held = { out: out, items: [] };
      held.items.push({ p: p, objs: seg.objects });
      return true;
    }
    // The held paragraphs become one block when a drawing floats among them, or
    // when the text just before them holds a drawing that lies over them.
    // Otherwise they are blank lines and go, as blank lines do.
    function releaseSpacers() {
      var h = held, wanted = roomAfter;
      held = null; roomAfter = false;
      if (!h) return;
      var any = h.items.some(function (it) { return it.objs.length > 0; });
      if (!any && !wanted) return;
      var block = floatBlock(h.items, true, wanted);
      if (block) h.out.push(block);
    }

    // One drawing found in a paragraph, as a block; null when it is not carried.
    function objectBlock(obj, align) {
      var c = classifyDrawing(obj.node);
      if (!c) return null;
      if (c.kind === "control") { note("controls", 1); return null; }
      // The template prints its own Draft watermark. Carried as a drawing, an old one would
      // print DRAFT across a Final; so it goes the way a header's watermark goes.
      if (c.kind === "watermark") { note("headers-footers", 1, { example: "Watermark: " + c.text }); return null; }
      if (c.plain) {
        var rel = mainRels[c.embed], type = rel && !rel.external ? mediaType(rel.target) : null;
        // A picture whose image is only an address outside the file is never carried (see unlinkOutside).
        if (rel && rel.external) { note("linked-pictures", 1); note("linked-pictures", 0, { example: rel.target }); return null; }
        if (!rel || !pkg.part(rel.target)) {
          note("objects-lost", 1, { example: labelOf(c) || "A picture" });
          return null;
        }
        // A link on the picture itself. A picture block cannot hold one, so a picture that links to a
        // web or email address travels as it is, link and all. Any other link is left off, and said.
        var clickRel = c.click ? mainRels[c.click] : null, hasLink = c.click != null || !!c.href;
        var clickTo = clickRel && clickRel.external && relKind(clickRel.type) === "hyperlink" ? clickRel.target : (c.href || "");
        var key = type && type !== "image/svg+xml" && !(hasLink && okLink(clickTo)) ? mediaFor(rel.target) : null;
        if (key) {
          var m = project.media[key], size = c.width && c.height ? { width: c.width, height: c.height }
            : safeSize(m.width || 300, m.height || 200);
          var pic = { id: nid("b"), type: "picture", media: key, width: size.width, height: size.height };
          if (align) pic.align = align;
          if (c.descr) pic.alt = c.descr;
          if (c.floating) note("floating-pictures", 1, { blockId: pic.id });
          if (hasLink || obj.link) note("picture-links", 1, { blockId: pic.id, example: clickTo || obj.link || "" });
          return pic;
        }
        // A picture of a kind the tool cannot print itself travels as it is.
      }
      return keep(obj, c, align);
    }

    // -- inline content ------------------------------------------------------------
    // Inside a contents list that is being left out. A field's own code is not
    // skipped this way: it lives in w:instrText, which is never read as text, so a
    // field that is opened and never closed (a damaged file) cannot swallow what follows it.
    function skipping() {
      for (var i = 0; i < fields.length; i++) if (fields[i].drop) return true;
      return false;
    }
    // The result of a field nested in another field's code (an IF around a merge field) is part of that code.
    function inCode() {
      for (var i = 0; i < fields.length - 1; i++) if (fields[i].phase === "code") return true;
      return false;
    }
    function fieldLink() {
      for (var i = fields.length - 1; i >= 0; i--) if (fields[i].link) return fields[i].link;
      return null;
    }
    function inFieldLink() {
      for (var i = 0; i < fields.length; i++) if (fields[i].wasLink) return true;
      return false;
    }
    function okLink(url) { return /^(https?:\/\/|mailto:)\S+/i.test(url || ""); }
    // Where a HYPERLINK field points: `url` is the address written in its code ("" when it names only a
    // bookmark), `href` the same with the bookmark after it.
    function linkOf(code) {
      code = String(code || "").trim();
      var anchor = /\\l\s+"([^"]*)"/i.exec(code), rest = code.replace(/^HYPERLINK/i, "").replace(/\\[a-z]\s+"[^"]*"/gi, "").replace(/\\[a-z]\b/gi, "");
      var url = /"([^"]*)"/.exec(rest) || /(\S+)/.exec(rest);
      return { url: url ? url[1] : "", href: url ? url[1] + (anchor && url[1].indexOf("#") < 0 ? "#" + anchor[1] : "") : "" };
    }
    // The report code of the list being left out (see skipping), or null.
    function dropping() {
      for (var i = 0; i < fields.length; i++) if (fields[i].drop) return fields[i].dropCode || "contents";
      return null;
    }
    // What a field is, once its code is known: a contents list to drop, a link, or a result to keep as text.
    function decideField(f) {
      var code = f.instr.trim();
      if (/^TOC\b/i.test(code)) {
        // A list of figures or of tables is a TOC field too, built from captions (\c, or \a for captions
        // without their label). It is left out like the contents list, but it is not the contents list:
        // the template has nothing to print in its place, so its own contents list is not switched on for it.
        var figures = /\\[ca]\b/i.test(code) && !/\\[otu]\b/i.test(code);
        f.dropCode = figures ? "figures-list" : "contents";
        if (!skipping()) {
          note(f.dropCode, 1);
          if (!figures) project.options.contents = true;
          tocDrops++; lastDrop = f.dropCode;
        }
        f.drop = true;
      } else if (/^HYPERLINK\b/i.test(code)) {
        var to = linkOf(code), href = to.href;
        f.wasLink = true;
        // Counted as a link brought across only once some text has taken it (see the field's end).
        if (okLink(href)) { f.link = href; f.linkAt = linkRuns; }
        // A target that is not a web or email address (a file, a share) is not a place inside the document.
        else if (!skipping()) { if (to.url) note("other-links", 1, { example: href }); else note("internal-links", 1); }
      } else if (f.formEmpty) {
        // A form field that showed nothing to keep: left out, and said so.
        if (!skipping() && !inCode()) note("controls", 1);
      } else if (code && !skipping()) {
        note("fields", 1);
        // A reference to a section or a page: its text was right for the original's numbering.
        if (/^(REF|PAGEREF|NOTEREF)\b/i.test(code)) refFields++;
      }
      f.decided = true;
    }
    // A legacy form field keeps what it shows in its own data, not in a result:
    // a check box its tick, a drop-down the entry chosen. The text it showed, or null.
    function formText(ffData) {
      var box = child(ffData, W, "checkBox"), dd = child(ffData, W, "ddList");
      if (box) {
        var checked = child(box, W, "checked"), dflt = child(box, W, "default");
        return (checked ? toggle(checked) : !!toggle(dflt)) ? "☒" : "☐";
      }
      if (dd) {
        var entries = children(dd, W, "listEntry"), res = child(dd, W, "result"), def = child(dd, W, "default");
        var at = clamp(int(res ? wVal(res) : def ? wVal(def) : 0, 0), 0, Math.max(0, entries.length - 1));
        return entries.length ? (wVal(entries[at]) || "") : "";
      }
      return null;
    }
    // Fields that never show anything where they stand (an index or contents entry, a bookmark's value).
    var SILENT_FIELD = /^(XE|TC|TA|RD|SET|ASK|PRIVATE|ADDIN|DATA|NEXT|NEXTIF|SKIPIF|ADVANCE|BIDIOUTLINE|PRINT)\b/i;
    // A field with no result part. Word draws what it shows from the code alone, so the file holds no
    // text for it: a SYMBOL field is the character it names and a MACROBUTTON field the prompt it
    // displays; anything else (an automatic clause number, an old-style equation) cannot be kept and
    // is reported with its code. `fmt` and `hidden` are those of the run the field ends in.
    function codeOnlyField(f, st, fmt, hidden) {
      var code = f.instr.replace(/\s+/g, " ").trim(), m;
      if (!code || skipping() || inCode() || SILENT_FIELD.test(code)) return;
      if ((m = /^SYMBOL\s+(0x[0-9a-f]+|\d+)(.*)$/i.exec(code))) {
        if (hidden(" (a symbol) ")) return;
        var n = parseInt(m[1], /^0x/i.test(m[1]) ? 16 : 10), font = /\\f\s+(?:"([^"]*)"|(\S+))/i.exec(m[2]);
        var table = font ? symbolFont(font[1] || font[2]) : null, ch = null;
        // A symbol font: the place in the font is what counts (an unmatched place is a box, and counted).
        if (table && ((n >= 0x20 && n < 0x100) || (n >= 0xF020 && n <= 0xF0FF))) ch = shownText(String.fromCharCode(n < 0x100 ? 0xF000 + n : n), { symLow: table, symHigh: table });
        else if (!isFinite(n) || n < 0x20 || n > 0xFFFF || (n >= 0xD800 && n <= 0xDFFF) || (n >= 0xE000 && n <= 0xF8FF)) { note("symbols", 1); ch = BOX; }
        // Without \u the number is a place in the Windows character set, which differs from Unicode between 128 and 159.
        else if (n < 0x100 && !/\\u\b/i.test(m[2])) ch = new TextDecoder("windows-1252").decode(new Uint8Array([n]));
        else ch = String.fromCharCode(n);
        addText(st, ch, fmt());
        note("fields", 1);
      } else if ((m = /^MACROBUTTON\s+\S+\s+(.+)$/i.exec(code))) {
        if (!hidden(m[1])) { addText(st, m[1], fmt()); note("fields", 1); }
      } else if (!fmt().hidden) {
        note("fields-no-text", 1, { example: code });
      }
    }

    function newState(pp, inNote) {
      var st = styleOf(styles, pp);
      var s = { paraRun: mergeRun(styles.defaults.run, st ? st.run : null), redPara: pp.pStyle === "PlaceholderText",
        link: null, inLink: false, inNote: !!inNote, noteObjects: 0, parts: [], seg: null, plain: null };
      s.seg = { runs: [], objects: [] };
      s.parts.push(s.seg);
      return s;
    }
    // Word's own style for the prompt of an unfilled content control ("Click or tap here to enter text.").
    function isPlaceholderStyle(cs, id) {
      return id === "PlaceholderText" || !!(cs && cs.chain.some(function (s) { return /^placeholder text$/i.test(s.name || ""); }));
    }
    function formatOf(rPr, st) {
      var link = st.link || fieldLink(), wasLink = st.inLink || inFieldLink();
      if (!rPr && !link && !wasLink && !plcDepth && st.plain) return st.plain;
      var own = readRPr(rPr), eff = st.paraRun, cs = own.rStyle != null ? styles.get(own.rStyle) : null;
      if (cs) eff = mergeRun(eff, cs.run);
      eff = mergeRun(eff, own);
      var f = {};
      if (eff.vanish) f.hidden = true;
      // A symbol font: Word keeps one font for the places below 128 and one for the rest.
      var fa = eff.fonts && fontName(eff.fonts.ascii, theme), fh = eff.fonts && fontName(eff.fonts.hAnsi, theme);
      f.symLow = symbolFont(fa || fh); f.symHigh = symbolFont(fh || fa);
      if (eff.b) f.b = true;
      if (eff.i) f.i = true;
      // The underline on a link is the link's own look. A carried link prints underlined
      // anyway, and one that kept only its words should not look like a link any more.
      if (eff.u && !wasLink) f.u = true;
      if (eff.strike) f.s = true;
      if (eff.vertAlign === "superscript") f.sup = true; else if (eff.vertAlign === "subscript") f.sub = true;
      if (CODE_FONTS[fontName(eff.fonts && eff.fonts.ascii, theme).toLowerCase()]) f.code = true;
      // Red is a prompt: the template's own, or the prompt Word shows in a content control nobody filled in.
      if (st.redPara || plcDepth || isPlaceholderStyle(cs, own.rStyle) || String(eff.color || "").toUpperCase() === RED) f.red = true;
      if (link) f.link = link;
      f.key = (f.b ? "b" : "") + (f.i ? "i" : "") + (f.u ? "u" : "") + (f.s ? "s" : "") + (f.sup ? "^" : "") + (f.sub ? "_" : "") +
        (f.code ? "c" : "") + (f.red ? "r" : "") + (link ? "|" + link : "");
      if (!rPr && !link && !wasLink && !plcDepth) st.plain = f;
      return f;
    }
    // The words of a w:t as they showed: symbol-font places turned into characters, the unmatched ones counted.
    function shownText(text, f) {
      if (!f.symLow && !f.symHigh && !/[-]/.test(text)) return text;
      var s = symbolText(text, f.symLow, f.symHigh);
      if (s.misses && !skipping() && !inCode()) note("symbols", s.misses);
      return s.text;
    }
    function addText(st, text, f) {
      if (!text || skipping() || inCode()) return;
      if (f.link) linkRuns++;
      var runs = st.seg.runs, last = runs[runs.length - 1];
      if (last && last.key === f.key && !last.fn) { last.t += text; return; }
      var run = { t: text, key: f.key };
      ["b", "i", "u", "s", "sup", "sub", "code", "red", "link"].forEach(function (k) { if (f[k]) run[k] = f[k]; });
      runs.push(run);
    }
    function addObject(st, node, run) {
      if (skipping() || inCode()) return;
      if (st.inNote) { st.noteObjects++; return; }
      // A link round it (a w:hyperlink or a HYPERLINK field) is remembered: a drawing cannot take one as text does.
      st.seg.objects.push({ node: node, run: run, link: st.link || fieldLink() });
    }
    function pageBreak(st) {
      if (skipping() || st.inNote) return;
      st.parts.push({ pageBreak: true });
      st.seg = { runs: [], objects: [] };
      st.parts.push(st.seg);
    }

    function readNote(kind, id) {
      var el = notes[kind][id];
      if (!el) { note("notes-missing", 1); return null; }
      var savedFields = fields, savedRels = curRels, runs = [], lostObjects = 0, lostTables = 0;
      fields = []; curRels = noteRels[kind];
      (function walk(parent) {
        kids(parent).forEach(function (n) {
          if (is(n, W, "p")) {
            var st = newState(readPPr(child(n, W, "pPr")), true);
            inline(n, st);
            lostObjects += st.noteObjects;
            if (st.seg.runs.length) { if (runs.length) runs.push({ t: "\n", key: "" }); runs = runs.concat(st.seg.runs); }
          } else if (is(n, W, "tbl")) {
            // A table in a note loses its grid, never its words: the paragraphs of each cell become lines of the note.
            lostObjects++; lostTables++;
            rowsOf(n).forEach(function (tr) {
              var trPr = child(tr, W, "trPr");
              if (trPr && child(trPr, W, "del")) { deletions++; return; }
              cellsOf(tr).forEach(walk);
            });
          }
          else if (is(n, W, "sdt")) { var c = child(n, W, "sdtContent"); if (c) walk(c); }
        });
      })(el);
      fields = savedFields; curRels = savedRels;
      runs = tidyRuns(runs);
      // Word puts a space between the note's own mark and its text.
      if (runs.length) { runs[0].t = runs[0].t.replace(/^\s+/, ""); if (!runs[0].t) runs.shift(); }
      var text = runs.map(function (r) { return r.t; }).join("");
      if (lostObjects) {
        var lostIn = note("objects-in-notes", lostObjects, { example: text });
        if (lostTables) lostIn.tables = (lostIn.tables || 0) + lostTables;
      }
      if (kind === "endnote") note("endnotes", 1);
      var key = nid("f");
      project.footnotes[key] = { runs: runs };
      return key;
    }
    // Runs as the contract has them: no working keys, neighbours of one format joined.
    function tidyRuns(runs) {
      var out = [];
      runs.forEach(function (r) {
        var last = out[out.length - 1];
        if (last && !last.fn && !r.fn && last.key === r.key) { last.t += r.t; return; }
        out.push(assign({}, r));
      });
      out.forEach(function (r) { delete r.key; });
      return out;
    }

    function readRun(r, st) { runContent(r, r, child(r, W, "rPr"), st); }
    // The children of a run, or of a wrapper inside one, which is read as if it were the run.
    function runContent(parent, r, rPr, st) {
      var f = null, lost = "", lostAny = false;
      function fmt() { return f || (f = formatOf(rPr, st)); }
      // Hidden text is neither shown nor printed by Word, so it is not brought across as if it
      // were ordinary text. What was left out is quoted in the report.
      function hidden(words) {
        if (!fmt().hidden) return false;
        lost += words; lostAny = true;
        return true;
      }
      for (var e = parent.firstChild; e; e = e.nextSibling) {
        if (e.nodeType !== 1) continue;
        if (e.namespaceURI === MC && e.localName === "AlternateContent") {
          // Either a drawing in two versions, or newer markup with older text beside it (an emoji).
          if (holdsDrawing(e)) { if (!hidden(" (a drawing) ")) addObject(st, e, r); }
          else { var alt = child(e, MC, "Fallback") || child(e, MC, "Choice"); if (alt) runContent(alt, r, rPr, st); }
          continue;
        }
        if (e.namespaceURI === M) { if ((e.localName === "oMath" || e.localName === "oMathPara") && !hidden(" (an equation) ")) addObject(st, e, null); continue; }
        if (e.namespaceURI !== W) continue;
        switch (e.localName) {
          case "rPr": case "delText": case "delInstrText": case "lastRenderedPageBreak": case "footnoteRef": case "endnoteRef":
          case "annotationRef": case "commentReference": case "separator": case "continuationSeparator": case "softHyphen":
            break;
          case "t": if (!hidden(e.textContent)) addText(st, shownText(e.textContent, fmt()), fmt()); break;
          case "tab": case "ptab": if (!hidden(" ")) addText(st, "\t", fmt()); break;
          case "cr": if (!hidden(" ")) addText(st, "\n", fmt()); break;
          case "noBreakHyphen": if (!hidden("-")) addText(st, "-", fmt()); break;
          case "br": {
            var type = wAttr(e, "type");
            if (type === "page") { if (!fmt().hidden) pageBreak(st); }
            else if (type !== "column" && !hidden(" ")) addText(st, "\n", fmt());
            break;
          }
          case "sym": {
            if (hidden(" (a symbol) ")) break;
            var code = parseInt(wAttr(e, "char"), 16), table = symbolFont(wAttr(e, "font"));
            // (Surrogates and anything past four hex digits are not characters at all.)
            if (!isFinite(code) || code < 0x20 || code > 0xFFFF || (code >= 0xD800 && code <= 0xDFFF)) { if (!skipping() && !inCode()) note("symbols", 1); addText(st, BOX, fmt()); }
            // A symbol font: the place in the font is what counts, whichever way the file wrote it.
            else if (table && (code < 0x100 || (code >= 0xF020 && code <= 0xF0FF))) addText(st, shownText(String.fromCharCode(code < 0x100 ? 0xF000 + code : code), { symLow: table, symHigh: table }), fmt());
            // A private-range character of a font not known here means nothing in another font.
            else if (code >= 0xE000 && code <= 0xF8FF) { if (!skipping() && !inCode()) note("symbols", 1); addText(st, BOX, fmt()); }
            else addText(st, String.fromCharCode(code), fmt());
            break;
          }
          case "fldChar": {
            var kind = wAttr(e, "fldCharType"), open = fields[fields.length - 1];
            if (kind === "begin") {
              var made = { instr: "", phase: "code" }, ff = child(e, W, "ffData"), shown = ff ? formText(ff) : null;
              if (shown && !hidden(shown)) addText(st, shown, fmt());
              if (shown === "") made.formEmpty = true;
              if (ff) made.form = true;
              fields.push(made);
            }
            else if (kind === "separate" && open && open.phase === "code") { open.phase = "result"; decideField(open); }
            else if (kind === "end" && open) {
              // A field with no result part never reached decideField.
              // (Asked before the field is closed: inCode() looks at the fields this one sits in.)
              if (open.formEmpty && !open.decided) { var quiet = skipping() || inCode(); fields.pop(); if (!quiet) note("controls", 1); }
              else {
                if (!open.decided && !open.form && open.phase === "code") codeOnlyField(open, st, fmt, hidden);
                // A link is brought across when some text took it; one round a picture alone was not.
                if (open.link && linkRuns > open.linkAt) linkCount++;
                fields.pop();
              }
            }
            break;
          }
          case "instrText": { var cur = fields[fields.length - 1]; if (cur && cur.phase === "code") cur.instr += e.textContent; break; }
          case "footnoteReference": case "endnoteReference": {
            if (st.inNote || skipping()) break;
            if (hidden(" (a note) ")) break;
            var key = readNote(e.localName === "footnoteReference" ? "footnote" : "endnote", wAttr(e, "id"));
            if (key) st.seg.runs.push({ t: "", fn: key, key: "fn" });
            break;
          }
          case "drawing": case "object": case "pict": if (!hidden(" (a drawing) ")) addObject(st, e, r); break;
          case "ruby": { var base = child(e, W, "rubyBase"); if (base) inline(base, st); break; }
          default:
            // Not known: read through it, so its words and drawings are not lost with it.
            if (e.firstChild) runContent(e, r, rPr, st);
        }
      }
      // Once for the run, with its words. Not inside a contents list that is left out anyway,
      // and not in a field's code, which never showed.
      if (lostAny && !skipping() && !inCode()) {
        st.hiddenText = true;
        if (lost.trim()) note("hidden-text", 1, { example: lost });
      }
    }

    function inline(parent, st) {
      for (var n = parent.firstChild; n; n = n.nextSibling) {
        if (n.nodeType !== 1) continue;
        if (n.namespaceURI === M) { if (n.localName === "oMath" || n.localName === "oMathPara") addObject(st, n, null); continue; }
        if (n.namespaceURI === MC && n.localName === "AlternateContent") {
          var alt = child(n, MC, "Fallback") || child(n, MC, "Choice");
          if (alt) inline(alt, st);
          continue;
        }
        if (n.namespaceURI !== W) { inline(n, st); continue; }
        switch (n.localName) {
          case "r": readRun(n, st); break;
          case "pPr": case "bookmarkStart": case "bookmarkEnd": case "commentRangeStart": case "commentRangeEnd":
          case "proofErr": case "permStart": case "permEnd": case "sdtPr": case "sdtEndPr": case "rPr":
            break;
          case "del": case "moveFrom": deletions++; break;
          case "ins": case "moveTo": insertions++; inline(n, st); break;
          case "hyperlink": {
            var rid = n.getAttributeNS(R, "id"), anchor = wAttr(n, "anchor"), rel = rid ? curRels[rid] : null, link = null;
            if (rel && rel.external) {
              var url = rel.target + (anchor && rel.target.indexOf("#") < 0 ? "#" + anchor : "");
              if (okLink(url)) link = url;
            }
            if (!skipping() && !link) {
              // A target outside the file that is not a web or email address (a file, a share) is not a place inside the document.
              if (rel && rel.external && rel.target) note("other-links", 1, { example: rel.target });
              else note("internal-links", 1);
            }
            var before = st.link, wasIn = st.inLink, ranBefore = linkRuns;
            st.link = link; st.inLink = true; inline(n, st); st.link = before; st.inLink = wasIn;
            // A link is brought across when some text took it; one round a picture alone was not (see objectBlock).
            if (link && linkRuns > ranBefore) linkCount++;
            break;
          }
          case "fldSimple": {
            var f = { instr: wAttr(n, "instr") || "", phase: "result" };
            if (!n.getElementsByTagNameNS(W, "r").length && !/^\s*(TOC|HYPERLINK)\b/i.test(f.instr)) {
              // Written with no result at all: there is no text to keep (see codeOnlyField).
              f.phase = "code";
              fields.push(f); codeOnlyField(f, st, function () { return formatOf(null, st); }, function () { return false; }); fields.pop();
              break;
            }
            decideField(f);
            fields.push(f); inline(n, st);
            if (f.link && linkRuns > f.linkAt) linkCount++;
            fields.pop();
            break;
          }
          case "sdt": {
            // A content control nobody filled in still shows its prompt: that is text still to complete.
            var prompt = !!child(child(n, W, "sdtPr"), W, "showingPlcHdr");
            if (prompt) plcDepth++;
            inline(n, st);
            if (prompt) plcDepth--;
            break;
          }
          default: inline(n, st);     // sdtContent, smartTag, customXml, dir, bdo and anything unknown
        }
      }
    }

    // -- block content ----------------------------------------------------------------
    function alignOf(jc) { return jc === "center" ? "center" : jc === "right" || jc === "end" ? "right" : jc === "both" || jc === "distribute" ? "justify" : null; }
    function plainText(runs) { return runs.map(function (r) { return r.t; }).join(""); }

    function paragraph(p, out, env) {
      var pPr = child(p, W, "pPr"), pp = readPPr(pPr), dropBefore = dropping(), wasSkipping = !!dropBefore;
      var st = newState(pp, false), style = styleOf(styles, pp);
      // A paragraph mark deleted while tracking is a deletion like any other.
      if (pp.markRPr && child(pp.markRPr, W, "del")) deletions++;
      if (pp.markRPr && child(pp.markRPr, W, "ins")) insertions++;
      var refsBefore = refFields, tocBefore = tocDrops, symBefore = tally.symbols ? tally.symbols.count : 0;
      var pointBefore = POINTED.map(function (code) { return tally[code] ? tally[code].count : 0; });
      inline(p, st);
      st.refs = refFields - refsBefore;
      st.symbols = (tally.symbols ? tally.symbols.count : 0) - symBefore;
      st.pointed = POINTED.filter(function (code, i) { return (tally[code] ? tally[code].count : 0) > pointBefore[i]; });
      // The lines of a contents list (or of a list of figures) are quoted in the report, under the
      // list they belong to, so what was left out can be read there.
      var dropNow = dropping();
      if (wasSkipping || dropNow) note(dropBefore || dropNow, 0, { example: wordsOf(p) });
      if (wasSkipping || dropNow || tocDrops > tocBefore) {
        // A heading typed above the list ("Contents") belongs to it: the template prints its own.
        if (!wasSkipping && !plainText(st.parts[0].runs || []).trim()) dropContentsHeading(out, dropNow || lastDrop);
        markDrop(out);
      }
      // The heading of a contents list that is a paragraph of its own, in Word's style for it,
      // goes with the list. Without this it would print as an empty numbered section.
      if (isTocHeading(style) && !env.cell && !st.inNote && !st.parts.some(function (part) { return part.objects && part.objects.length; })) {
        releaseSpacers();
        note("contents", 0, { example: plainText(st.parts.reduce(function (all, part) { return all.concat(part.runs || []); }, [])) });
        project.options.contents = true;
        markDrop(out);
        if (pp.sectPr) closeSection(pp.sectPr);
        return;
      }
      // Blank lines and paragraphs holding only floating drawings wait (see holdSpacer).
      if (wasSkipping || skipping() || !holdSpacer(p, pp, style, st, out, env)) emit(pp, style, st, out, env);
      if (pp.sectPr && !env.cell) { releaseSpacers(); closeSection(pp.sectPr); }
    }
    function isTocHeading(style) {
      return !!style && style.chain.some(function (s) { return s.id === "TOCHeading" || /^toc heading$/i.test(s.name || ""); });
    }
    // Something was left out here (a contents list, its heading, a cover page). The block before
    // it is remembered: a page break on each side of what went would leave an empty page.
    function markDrop(out) {
      if (out === blocks) dropMarks.push(blocks.length ? blocks[blocks.length - 1] : null);
    }
    // The block just before a contents list, when it is a heading that only says "Contents".
    // `code` says which list: the heading above a list of figures goes with that list, and is quoted with it.
    function dropContentsHeading(out, code) {
      releaseSpacers();
      var last = out[out.length - 1], figures = code === "figures-list";
      var title = figures ? /^(table|list) of (figures|tables|illustrations)$/i : /^(table of )?contents$/i;
      if (!last || last.type !== "heading" || !title.test(plainText(last.runs).trim())) return;
      // Not one a section has already been closed after: the sections count blocks.
      if (out === blocks && sectionFrom >= blocks.length) return;
      out.pop();
      note(figures ? "figures-list" : "contents", 0, { example: plainText(last.runs) });
    }
    function emit(pp, style, st, out, env) {
      releaseSpacers();
      var level = levelFrom(pp, styles), role = roleOf(pp, styles), list = null;
      var para = mergePara(style ? style.para : null, pp), align = alignOf(para.jc);
      if (!level && role !== "title") list = listFrom(pp, styles, numbering);
      // A heading whose style is numbered: the template can number headings itself, so the number is not typed in.
      var numbered = false;
      if (level && !env.cell) { var hl = listFrom(pp, styles, numbering); if (hl && hl.kind === "number") { project.options.numberHeadings = true; numbered = true; } }
      if ((para.pageBreakBefore && !env.cell) && out.length) out.push({ id: nid("b"), type: "pageBreak" });
      var firstBlock = null;
      st.parts.forEach(function (part, partAt) {
        if (part.pageBreak) { if (!env.cell) out.push({ id: nid("b"), type: "pageBreak" }); return; }
        var asHeading = (level || role === "title") && !env.cell;
        // Bold and italic mean nothing on a heading: its style decides.
        var runs = tidyRuns(asHeading ? unbold(part.runs) : part.runs), text = plainText(runs), textBlock = null;
        var hasText = text.trim() !== "" || runs.some(function (r) { return r.fn; });
        // The floating drawings of this paragraph go first, as one block: the writer gives them a
        // paragraph of no height, so they are measured from the top of the text they were anchored in.
        var floats = part.objects.filter(floatOf), inLine = part.objects.filter(function (o) { return !floatOf(o); });
        var floated = floats.length ? floatBlock([{ p: null, objs: floats }], false) : null;
        if (floated) {
          out.push(floated);
          if (hasText && floated.__loose) roomAfter = true;
        }
        if (hasText) {
          if (role === "title" && !titleTaken && !env.cell) {
            project.info.title = text.replace(/\s+/g, " ").trim();
            titleTaken = true;
          } else if (asHeading) {
            var lv = level || 1;
            // The template types a heading's number in front of it, with an em space (hn in
            // house-docx.js). Read back, that is the numbering option again, not part of the words.
            var typed = runs[0] && !runs[0].fn && !runs[0].link ? /^\d+(?:\.\d+){0,2}\u2003/.exec(runs[0].t) : null;
            if (typed && text.length > typed[0].length) {
              runs[0].t = runs[0].t.slice(typed[0].length);
              if (!runs[0].t) runs.shift();
              project.options.numberHeadings = true;
              numbered = true;
            }
            textBlock = { id: nid("b"), type: "heading", level: Math.min(lv, 3), runs: runs };
            if (lv > 3) note("headings-deeper", 1, { blockId: textBlock.id });
            // Whether the original numbered it: the template numbers every heading or none.
            (numbered ? headsNumbered : headsPlain).push(textBlock.id);
          } else if (st.redPara && !env.cell && !list) {
            textBlock = { id: nid("b"), type: "prompt", text: text };
          } else if (list && list.kind !== "none") {
            textBlock = { id: nid("b"), type: "list", list: list.kind, level: 0, runs: runs };
            Object.defineProperty(textBlock, "__li", { value: list, enumerable: false, configurable: true });
          } else {
            textBlock = { id: nid("b"), type: "paragraph", runs: runs };
            if (align) textBlock.align = align;
            if (role === "caption") Object.defineProperty(textBlock, "__caption", { value: true, enumerable: false, configurable: true });
          }
          if (textBlock) { out.push(textBlock); firstBlock = firstBlock || textBlock; }
        } else if (env.cell && partAt === 0 && st.parts.length === 1 && list && list.kind !== "none" && !part.objects.length && !st.hiddenText) {
          // A numbered or bulleted paragraph with no words, in a table cell: the number is what the
          // cell shows (a "No." column that Word counts by itself), so the item is kept for its marker.
          var marker = { id: nid("b"), type: "list", list: list.kind, level: 0, runs: [] };
          Object.defineProperty(marker, "__li", { value: list, enumerable: false, configurable: true });
          out.push(marker);
        }
        inLine.forEach(function (obj) {
          var c = classifyDrawing(obj.node), block = objectBlock(obj, align === "justify" ? null : align);
          if (!block) return;
          out.push(block);
          if (hasText && c && !c.floating) note("inline-objects", 1, { blockId: block.id });
        });
      });
      // The report's lines point at the paragraph they are about.
      if (firstBlock) {
        if (st.refs) refBlocks.push(firstBlock.id);
        if (st.symbols) note("symbols", 0, { blockId: firstBlock.id });
        (st.pointed || []).forEach(function (code) { note(code, 0, { blockId: firstBlock.id }); });
        if (st.hiddenText && tally["hidden-text"]) note("hidden-text", 0, { blockId: firstBlock.id });
      }
    }
    // The same runs without bold and italic, keyed again so that equal neighbours join.
    function unbold(runs) {
      return runs.map(function (r) {
        var k = assign({}, r);
        delete k.b; delete k.i;
        k.key = r.fn ? "fn" : ["u", "s", "sup", "sub", "code", "red"].filter(function (x) { return r[x]; }).join(",") + "|" + (r.link || "");
        return k;
      });
    }

    function sdtGallery(sdt) {
      var g = first(child(sdt, W, "sdtPr"), W, "docPartGallery");
      return g ? (wVal(g) || "") : "";
    }
    function paragraphsText(node) {
      var ps = node.getElementsByTagNameNS(W, "p"), out = [];
      for (var i = 0; i < ps.length; i++) { var t = wordsOf(ps[i]).trim(); if (t) out.push(t); }
      return out;
    }

    function blockLevel(n, out, env) {
      if (n.nodeType !== 1) return;
      if (n.namespaceURI === MC && n.localName === "AlternateContent") {
        var alt = child(n, MC, "Fallback") || child(n, MC, "Choice");
        if (alt) kids(alt).forEach(function (k) { blockLevel(k, out, env); });
        return;
      }
      if (n.namespaceURI !== W) { kids(n).forEach(function (k) { blockLevel(k, out, env); }); return; }
      switch (n.localName) {
        case "p": paragraph(n, out, env); break;
        case "tbl":
          releaseSpacers();
          if (env.cell) {
            // A table inside a cell: its text is kept, cell by cell, as paragraphs of the outer cell.
            note("nested-tables", 1);
            rowsOf(n).forEach(function (tr) { cellsOf(tr).forEach(function (tc) { kids(tc).forEach(function (k) { blockLevel(k, out, env); }); releaseSpacers(); }); });
          } else { var t = table(n); if (t) out.push(t); }
          break;
        case "sdt": {
          var gallery = sdtGallery(n);
          if (/^Table of Contents$/i.test(gallery)) {
            if (!env.cell) dropContentsHeading(out);
            var toc = note("contents", 1);
            paragraphsText(n).forEach(function (line) { if (toc.examples.length < 5) toc.examples.push(quote(line)); });
            project.options.contents = true;
            releaseSpacers(); markDrop(out);
            break;
          }
          if (/^Cover Pages$/i.test(gallery)) {
            var t2 = note("cover-page", 1);
            paragraphsText(n).forEach(function (line) { if (t2.examples.length < 5) t2.examples.push(quote(line)); });
            releaseSpacers(); markDrop(out);
            break;
          }
          var content = child(n, W, "sdtContent"), unfilled = !!child(child(n, W, "sdtPr"), W, "showingPlcHdr");
          if (unfilled) plcDepth++;
          if (content) kids(content).forEach(function (k) { blockLevel(k, out, env); });
          if (unfilled) plcDepth--;
          break;
        }
        case "altChunk": {
          var rel = curRels[n.getAttributeNS(R, "id")];
          note("embedded-chunks", 1, { example: rel ? baseOf(rel.target) : "" });
          break;
        }
        case "del": case "moveFrom": deletions++; break;
        case "ins": case "moveTo": insertions++; kids(n).forEach(function (k) { blockLevel(k, out, env); }); break;
        case "sectPr": case "tblPr": case "tblGrid": case "tcPr": case "trPr": case "sdtPr": case "sdtEndPr":
        case "bookmarkStart": case "bookmarkEnd": case "proofErr": case "permStart": case "permEnd":
        case "commentRangeStart": case "commentRangeEnd":
          break;
        default: kids(n).forEach(function (k) { blockLevel(k, out, env); });
      }
    }

    // -- tables ---------------------------------------------------------------------------
    // Rows and cells may sit inside content controls; those wrappers are looked through.
    function gather(parent, local, out) {
      kids(parent).forEach(function (c) {
        if (is(c, W, local)) out.push(c);
        else if (is(c, W, "sdt")) { var content = child(c, W, "sdtContent"); if (content) gather(content, local, out); }
        else if (is(c, W, "customXml") || is(c, W, "ins") || is(c, W, "moveTo")) gather(c, local, out);
      });
      return out;
    }
    function rowsOf(tbl) { return gather(tbl, "tr", []); }
    function cellsOf(tr) { return gather(tr, "tc", []); }
    function emptyCell() { return { blocks: [{ id: nid("b"), type: "paragraph", runs: [] }] }; }
    function allBold(blocks) {
      var any = false, every = true;
      blocks.forEach(function (b) {
        (b.runs || []).forEach(function (r) { if (r.t && r.t.trim()) { any = true; if (!r.b) every = false; } });
      });
      return any && every;
    }

    function table(tbl) {
      var tblPr = child(tbl, W, "tblPr"), grid = child(tbl, W, "tblGrid");
      var gridW = children(grid, W, "gridCol").slice(0, MAX_COLS).map(function (g) { return int(wAttr(g, "w"), 0); });
      var rows = [], used = [], open = [], widest = 0, widestWidths = null, headerRow = false, firstMeta = null;
      rowsOf(tbl).forEach(function (tr) {
        var trPr = child(tr, W, "trPr");
        if (trPr && child(trPr, W, "del")) { deletions++; return; }
        if (trPr && child(trPr, W, "ins")) insertions++;
        var before = clamp(int(wVal(child(trPr, W, "gridBefore")), 0), 0, MAX_COLS);
        var after = clamp(int(wVal(child(trPr, W, "gridAfter")), 0), 0, MAX_COLS);
        var cells = [], widths = [], col = 0, lastH = null, k, meta = { shaded: true, bold: true, any: false };
        for (k = 0; k < before && col < MAX_COLS; k++) { cells.push(emptyCell()); widths.push(null); open[col++] = null; }
        cellsOf(tr).forEach(function (tc) {
          if (col >= MAX_COLS) return;
          var tcPr = child(tc, W, "tcPr");
          var span = clamp(int(wVal(child(tcPr, W, "gridSpan")), 1), 1, MAX_COLS - col);
          var tcW = child(tcPr, W, "tcW"), w = tcW && (wAttr(tcW, "type") || "dxa") === "dxa" ? int(wAttr(tcW, "w"), 0) : 0;
          var hm = child(tcPr, W, "hMerge"), vm = child(tcPr, W, "vMerge");
          for (k = 0; k < span; k++) widths.push(w > 0 ? w / span : null);
          if (hm && (wVal(hm) || "continue") !== "restart" && lastH) {
            // The older way to merge across: the cells after the first say "continue".
            lastH.span = (lastH.span || 1) + span;
            for (k = 0; k < span; k++) open[col + k] = null;
            col += span;
            return;
          }
          if (vm && (wVal(vm) || "continue") !== "restart") {
            var o = open[col];
            if (o && o.span === span) { o.cell.rowSpan = (o.cell.rowSpan || 1) + 1; col += span; lastH = null; return; }
            // A continued merge with nothing above it to continue: an ordinary cell.
          }
          var cellBlocks = [];
          kids(tc).forEach(function (c) { blockLevel(c, cellBlocks, { cell: true }); });
          // What the cell's last paragraphs held back is settled inside the cell.
          releaseSpacers();
          meta.any = true;
          if (!shaded(child(tcPr, W, "shd"))) meta.shaded = false;
          if (!allBold(cellBlocks)) meta.bold = false;
          var cell = { blocks: cellBlocks.length ? cellBlocks : emptyCell().blocks };
          if (span > 1) cell.span = span;
          cells.push(cell);
          for (k = 0; k < span; k++) open[col + k] = null;
          if (vm) open[col] = { cell: cell, span: span };
          lastH = hm ? cell : null;
          col += span;
        });
        for (k = 0; k < after && col < MAX_COLS; k++) { cells.push(emptyCell()); widths.push(null); open[col++] = null; }
        if (!rows.length) { headerRow = !!(trPr && toggle(child(trPr, W, "tblHeader"))); firstMeta = meta; }
        if (col > widest) { widest = col; widestWidths = widths; }
        rows.push({ cells: cells });
        used.push(col);
      });
      if (!rows.length || !widest) return null;

      var cols;
      if (gridW.length >= widest && gridW.every(function (w) { return w > 0; })) cols = gridW.slice(0, widest);
      else if (widestWidths && widestWidths.every(function (w) { return w > 0; })) cols = widestWidths.map(Math.round);
      else { cols = []; for (var i = 0; i < widest; i++) cols.push(1); }
      // A short row is filled out, so every row covers the whole grid.
      rows.forEach(function (row, r) { for (var c = used[r]; c < cols.length; c++) row.cells.push(emptyCell()); });

      var header = headerRow ? 1 : 0;
      if (!header && rows.length > 1 && firstMeta && firstMeta.any) {
        var look = child(tblPr, W, "tblLook"), styleEl = child(tblPr, W, "tblStyle"), ts = styleEl ? styles.get(wVal(styleEl)) : null;
        var firstRowOn = look && (wAttr(look, "firstRow") != null ? onAttr(wAttr(look, "firstRow"))
          : (parseInt(wVal(look) || "0", 16) & 0x20) !== 0);
        if (firstMeta.shaded || firstMeta.bold || (firstRowOn && ts && ts.firstRow)) header = 1;
      }
      // The template prints a header row in bold, so bold there says nothing more.
      if (header) rows[0].cells.forEach(function (cell) {
        cell.blocks.forEach(function (b) { (b.runs || []).forEach(function (r) { delete r.b; }); });
      });
      return { id: nid("b"), type: "table", header: header, cols: cols, rows: rows };
    }

    // -- sections ----------------------------------------------------------------------------
    function closeSection(sectPr) {
      var size = child(sectPr, W, "pgSz"), type = child(sectPr, W, "type"), cols = child(sectPr, W, "cols");
      var land = !!size && (wAttr(size, "orient") === "landscape" || int(wAttr(size, "w"), 0) > int(wAttr(size, "h"), 0));
      var count = cols ? Math.max(int(wAttr(cols, "num"), 1), children(cols, W, "col").length) : 1;
      sections.push({ from: sectionFrom, to: blocks.length, land: land, type: type ? (wVal(type) || "nextPage") : "nextPage", cols: count });
      sectionFrom = blocks.length;
    }
    function finishSections() {
      sections.forEach(function (s) {
        if (s.cols > 1 && s.to > s.from) note("columns", 1, { blockId: blocks[s.from].id });
        if (s.land) for (var i = s.from; i < s.to; i++) blocks[i].land = true;
      });
      // A section that starts a new page without turning it is a page break.
      // One that turns the page starts a new page anyway.
      for (var k = sections.length - 1; k > 0; k--) {
        var s = sections[k], prev = sections[k - 1];
        if (s.type === "continuous" || s.type === "nextColumn" || s.land !== prev.land || s.to === s.from || s.from === 0) continue;
        if (blocks[s.from].type === "pageBreak" || blocks[s.from - 1].type === "pageBreak") continue;
        var pb = { id: nid("b"), type: "pageBreak" };
        if (s.land) pb.land = true;
        blocks.splice(s.from, 0, pb);
      }
    }

    // -- after the walk -------------------------------------------------------------------------
    function eachList(list, fn) {
      fn(list);
      list.forEach(function (b) {
        if (b.type === "table") b.rows.forEach(function (row) { row.cells.forEach(function (cell) { eachList(cell.blocks, fn); }); });
      });
    }
    // A Caption paragraph belongs to the picture, drawing or table beside it.
    function finishCaptions(list) {
      function takes(b) { return b && (b.type === "picture" || b.type === "kept" || b.type === "table") && !b.caption; }
      for (var i = 0; i < list.length; i++) {
        var b = list[i];
        if (!b.__caption) continue;
        delete b.__caption;
        // A block's caption is plain words. A caption that holds a footnote or a link stays a
        // paragraph where it stood, so that neither is lost.
        if (b.runs.some(function (r) { return r.fn || r.link; })) continue;
        var words = plainText(b.runs).replace(/\s+/g, " ").trim(), prev = list[i - 1], next = list[i + 1];
        // The caption's own label says what it belongs to: a table's caption is usually written above
        // the table, so "Table 1" between a picture and a table is the table's. Where the label does
        // not decide, the block before it is taken first.
        var want = /^table\b/i.test(words) ? "table" : /^(figure|fig\.?|diagram|chart|picture|image|drawing|illustration)\b/i.test(words) ? "figure" : null;
        var fits = function (x) { return takes(x) && want !== null && (want === "table") === (x.type === "table"); };
        var target = fits(prev) ? prev : fits(next) ? next : takes(prev) ? prev : takes(next) ? next : null;
        if (!target) continue;
        target.caption = words;
        captions++;
        list.splice(i, 1);
        i--;
      }
    }
    var captions = 0, seenNum = mapOf(), lastKey = null;
    var HOUSE_FORMAT = ["decimal", "lowerLetter", "lowerRoman"];
    // Levels and restart flags for each run of list items, in reading order
    // (tables included), so "continue" knows which lists came before.
    function finishLists(list) {
      var i = 0;
      while (i < list.length) {
        if (list[i].type === "table") list[i].rows.forEach(function (row) { row.cells.forEach(function (cell) { finishLists(cell.blocks); }); });
        if (!list[i].__li) { i++; continue; }
        var from = i, least = mapOf(), k;
        while (i < list.length && list[i].__li) {
          var li = list[i].__li, g = li.numId + "/" + li.ilvl;
          if (least[g] == null || li.left < least[g]) least[g] = li.left;
          i++;
        }
        // Word's Increase Indent moves an item along without changing its level, so extra
        // indent against the least indented item of its own list counts as depth. A whole
        // list dragged along the ruler has no extra indent against itself and stays put.
        // Decrease Indent can leave one item short of the level's own indent (real Word
        // files have this); that item must not make every ordinary item look indented,
        // so the measure never starts below the level's own indent.
        // That holds for bullets only. Word numbers an item by its list and its level whatever
        // its indent, so a numbered item pushed in is still 3. between 2. and 4.: made a sub-item
        // it would take a letter and every number after it would change. Its level is the file's.
        for (k = from; k < i; k++) {
          var item = list[k], info = item.__li, base = least[info.numId + "/" + info.ilvl];
          if (info.levelLeft != null && info.levelLeft > base) base = info.levelLeft;
          var extra = item.list === "number" ? 0 : Math.floor((info.left - base + 10) / 360);
          // A built-in "List Number 2" or "List Bullet 3" style is that much deeper than its level says.
          var level = info.ilvl + (info.styleDepth || 0) + extra;
          if (level > 2) { note("lists-deeper", 1, { blockId: item.id }); level = 2; }
          item.level = Math.max(0, level);
        }
        var seenHere = mapOf();
        for (k = from; k < i; k++) {
          var b = list[k], n = b.__li;
          if (b.list !== "number") continue;
          // The numbered item this one follows: the nearest one before it at its own level or above.
          var prior = null, resumed = false;
          for (var j = k - 1; j >= from && !prior; j--) if (list[j].list === "number" && list[j].level <= b.level) prior = list[j];
          if (prior && prior.level === b.level && prior.__li.key !== n.key) {
            b.restart = true;
            // It starts again at 1. If the original carried on a list from further up, that count is lost.
            resumed = !!(seenNum[n.key] || seenHere[n.key]);
          } else if (!prior && seenNum[n.key]) {
            // "Carry on" means the numbered list printed last. When another list came between,
            // this one cannot be resumed: it starts at 1 and is reported, never given the other's count.
            if (lastKey === n.key) b.continue = true; else resumed = true;
          }
          // Numbers the house style will print differently: references in the text may no longer match.
          var marker = n.lvlText.replace("%" + (n.ilvl + 1), "");
          var literal = marker.replace(/[\s().:\[\]-]/g, "") !== "";     // "Step %1", "%1.%2.", "§%1": more than punctuation round the number
          if (n.numFmt !== HOUSE_FORMAT[b.level] || literal || n.start !== 1 || resumed) note("list-numbering", 1, { blockId: b.id });
          seenHere[n.key] = true; lastKey = n.key;
        }
        for (k = from; k < i; k++) { if (list[k].list === "number") seenNum[list[k].__li.key] = true; }
        for (k = from; k < i; k++) delete list[k].__li;
      }
    }

    function finish() {
      var last = child(body, W, "sectPr");
      releaseSpacers();
      if (last) closeSection(last);
      finishSections();
      // The template ends its own cover, control table and contents on a new page. A page break that
      // opens the document (the one that followed the original's cover or contents) would print an
      // empty page after them; so would the second of two breaks left side by side where a contents
      // list was taken out from between them.
      while (blocks.length && blocks[0].type === "pageBreak") blocks.shift();
      dropMarks.forEach(function (prev) {
        var at = prev ? blocks.indexOf(prev) : -1, next = at >= 0 ? blocks[at + 1] : null;
        if (prev && prev.type === "pageBreak" && next && next.type === "pageBreak" && !prev.land === !next.land) blocks.splice(at + 1, 1);
      });
      eachList(blocks, finishCaptions);
      finishLists(blocks);
      // Headings are numbered by the template, all of them or none, from 1. Where the original left
      // some unnumbered, or its text refers to a section or a page by number, the numbers in the
      // text may no longer be the numbers printed.
      if (project.options.numberHeadings) {
        var live = mapOf();
        blocks.forEach(function (b) { if (b.type === "heading") live[b.id] = true; });
        var plain = headsPlain.filter(function (id) { return live[id]; });
        if (plain.length || refFields) {
          var hn = note("heading-numbers", plain.length + refFields);
          hn.headings = plain.length; hn.references = refFields;
          plain.concat(refBlocks).forEach(function (id) { note("heading-numbers", 0, { blockId: id }); });
        }
      }

      // Properties: only what the document did not say itself.
      var coreRel = null;
      top.forEach(function (r) { if (!coreRel && !r.external && relKind(r.type) === "core-properties") coreRel = r; });
      var core = coreRel ? pkg.xml(coreRel.target) : null;
      if (core) {
        var dc = "http://purl.org/dc/elements/1.1/", t = first(core, dc, "title"), a = first(core, dc, "creator");
        if (!project.info.title && t) project.info.title = t.textContent.replace(/\s+/g, " ").trim();
        if (a) project.info.author = a.textContent.replace(/\s+/g, " ").trim();
      }

      if (insertions || deletions) { var tc = note("tracked-changes", insertions + deletions); tc.insertions = insertions; tc.deletions = deletions; }
      note("formatting", 1);
      // What sits before the first heading is often the original's own cover and control table.
      var firstHeading = -1;
      blocks.some(function (b, i) { if (b.type === "heading") { firstHeading = i; return true; } return false; });
      if (firstHeading > 0) {
        var fm = note("front-matter", firstHeading);
        fm.blockIds = blocks.slice(0, firstHeading).map(function (b) { return b.id; });
      }

      var kept = false, carried = { headings: 0, paragraphs: 0, listItems: 0, tables: 0, pictures: 0, keptObjects: 0,
        captions: captions, footnotes: 0, links: linkCount };
      blocks.forEach(function (b) {
        if (b.type === "heading") carried.headings++;
        else if (b.type === "paragraph" || b.type === "prompt") carried.paragraphs++;
        else if (b.type === "list") carried.listItems++;
        else if (b.type === "table") carried.tables++;
      });
      eachList(blocks, function (list) {
        list.forEach(function (b) {
          if (b.type === "picture") carried.pictures++;
          if (b.type === "kept") { carried.keptObjects++; kept = true; }
        });
      });
      // A footnote is brought across when some text still refers to it.
      var noted = mapOf();
      eachList(blocks, function (list) {
        list.forEach(function (b) {
          (b.runs || []).forEach(function (r) { if (r.fn && project.footnotes[r.fn] && !noted[r.fn]) { noted[r.fn] = true; carried.footnotes++; } });
        });
      });
      // The theme travels only when something will need it.
      if (kept && themeName) {
        carryLog = []; carryMisses = 0;
        var tk = carry(themeName);
        if (tk && !carryMisses) project.theme = tk;
        else { uncarry(carryLog); note("theme-missing", 1); }
        carryLog = null;
      }

      for (var key in rawBytes) {
        var entry = project.media[key] || project.parts[key];
        entry.blob = new Blob([rawBytes[key]], { type: entry.type || entry.contentType || "application/octet-stream" });
      }
      project.nextId = nextId;

      var report = { source: { name: String(opts.name || blob.name || ""), size: blob.size, importedAt: new Date().toISOString() },
        carried: carried, toCheck: [], changed: [], notCarried: [] };
      ["toCheck", "changed", "notCarried"].forEach(function (listName) {
        CODES[listName].forEach(function (code) {
          var t = tally[code];
          if (!t) return;
          if (!t.examples.length) delete t.examples;
          if (!t.blockIds.length) delete t.blockIds;
          report[listName].push(t);
        });
      });
      project.importReport = report;
      return { project: project, report: report };
    }

    // -- the walk, in steps that yield --------------------------------------------------------
    var nodes = kids(body), at = 0, STEP = 200;
    function step() {
      var end = Math.min(nodes.length, at + STEP);
      for (; at < end; at++) blockLevel(nodes[at], blocks, { cell: false });
      progress(0.15 + 0.7 * (nodes.length ? at / nodes.length : 1), "Reading the text");
      if (at < nodes.length) return pause().then(step);
      progress(0.9, "Reading pictures and drawings");
      return pause().then(finish).then(function (result) { progress(1, "Done"); return result; });
    }
    return step();
  }

  window.App.DocxImport = {
    read: read, parseStyles: parseStyles, parseNumbering: parseNumbering, parseTheme: parseTheme,
    headingLevel: headingLevel, listInfo: listInfo, effectiveFormat: effectiveFormat,
    classifyDrawing: classifyDrawing, CODES: CODES
  };
})();
