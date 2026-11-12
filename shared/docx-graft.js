/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* docx-graft.js: App.DocxGraft, puts kept Word content into a packed file
   (docs/document-tool-design.md 4.2).

   The docx library cannot write a chart, a diagram, a shape or an embedded
   object, so the writer types a token where each one belongs and this pass
   swaps the token's run for the original XML after packing, then adds the
   parts that XML depends on. The original XML is put in as text, never parsed
   and rebuilt, so a drawing arrives exactly as it left its source file.

   Needs App.ZipIO. Calls no module code. */
(function () {
  "use strict";
  window.App = window.App || {};

  var DOC = "word/document.xml", DOC_RELS = "word/_rels/document.xml.rels", TYPES = "[Content_Types].xml";
  var THEME = "word/theme/theme1.xml";
  var T_THEME = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme";
  var CT_THEME = "application/vnd.openxmlformats-officedocument.theme+xml";
  var CT_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  var RELS_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
  var MC = "http://schemas.openxmlformats.org/markup-compatibility/2006";

  // Prefixes Word itself declares on a document root. Kept XML declares the
  // namespaces of its own elements and attributes (XMLSerializer does that),
  // but a prefix named inside an attribute VALUE, as in mc:Choice
  // Requires="wps", is only in scope if the root declares it.
  var KNOWN_NS = {
    wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
    wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
    wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
    wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
    wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
    wp15: "http://schemas.microsoft.com/office/word/2012/wordprocessingDrawing",
    w14: "http://schemas.microsoft.com/office/word/2010/wordml",
    w15: "http://schemas.microsoft.com/office/word/2012/wordml",
    w16: "http://schemas.microsoft.com/office/word/2018/wordml",
    w16cex: "http://schemas.microsoft.com/office/word/2018/wordml/cex",
    w16cid: "http://schemas.microsoft.com/office/word/2016/wordml/cid",
    w16du: "http://schemas.microsoft.com/office/word/2023/wordml/word16du",
    w16sdtdh: "http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash",
    w16sdtfl: "http://schemas.microsoft.com/office/word/2024/wordml/sdtformatlock",
    w16se: "http://schemas.microsoft.com/office/word/2015/wordml/symex",
    a14: "http://schemas.microsoft.com/office/drawing/2010/main",
    am3d: "http://schemas.microsoft.com/office/drawing/2017/model3d",
    aink: "http://schemas.microsoft.com/office/drawing/2016/ink",
    cx: "http://schemas.microsoft.com/office/drawing/2014/chartex",
    cx1: "http://schemas.microsoft.com/office/drawing/2015/9/8/chartex",
    cx2: "http://schemas.microsoft.com/office/drawing/2015/10/21/chartex",
    cx3: "http://schemas.microsoft.com/office/drawing/2016/5/9/chartex",
    cx4: "http://schemas.microsoft.com/office/drawing/2016/5/10/chartex",
    cx5: "http://schemas.microsoft.com/office/drawing/2016/5/11/chartex",
    cx6: "http://schemas.microsoft.com/office/drawing/2016/5/12/chartex",
    cx7: "http://schemas.microsoft.com/office/drawing/2016/5/13/chartex",
    cx8: "http://schemas.microsoft.com/office/drawing/2016/5/14/chartex",
    oel: "http://schemas.microsoft.com/office/2019/extlst",
    mc: MC
  };
  // What Word lists in mc:Ignorable on a root. A reader too old to know one of
  // these namespaces skips it when it is listed, and refuses the file when it is not.
  var IGNORABLE = ["w14", "w15", "w16se", "w16cid", "w16", "w16cex", "w16sdtdh", "w16sdtfl", "w16du", "wp14"];

  // ---- small helpers ------------------------------------------------------
  function escapeAttr(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escapeText(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  // The token is fixed by the design: private-use characters no document
  // holds, so it can be found in the packed XML by a plain search.
  function token(id) { return "\uE000KEPT:" + id + "\uE000"; }

  function SharedPartError(message, blockIds) {
    this.name = "SharedPartError";
    this.message = message || "";
    this.blockIds = blockIds || [];
    if (Error.captureStackTrace) Error.captureStackTrace(this, SharedPartError);
  }
  SharedPartError.prototype = Object.create(Error.prototype);
  SharedPartError.prototype.constructor = SharedPartError;

  function placeError(blockId, why) {
    var e = new Error("A drawing could not be placed" + (blockId ? " (block " + blockId + ")" : "") + (why ? ": " + why : "") + ".");
    e.blockId = blockId || null;
    return e;
  }

  function needsGraft(plan) {
    return !!(plan && ((plan.kept && plan.kept.length) || (plan.media && plan.media.length)));
  }

  // ---- the parts a kept object reaches ------------------------------------
  // Every part key reachable from a list of relationships, each once.
  function closure(rels, parts) {
    var seen = {}, order = [];
    (function walk(list) {
      (list || []).forEach(function (r) {
        if (!r || !r.part || seen[r.part] || !parts[r.part]) return;
        seen[r.part] = true; order.push(r.part);
        walk(parts[r.part].rels);
      });
    })(rels);
    return order;
  }

  // Word opens two drawings on one picture or one embedded file, and nothing else.
  function mayShare(rel) { return /\/(image|oleObject|package)$/.test(rel.type || ""); }
  function isSingleUse(part) {
    return /drawingml\.(chart|diagram)|chartex|chartshapes/i.test((part && part.contentType) || "");
  }

  // ---- unshare ------------------------------------------------------------
  // Copies made in the editor point at the same parts as their original (the
  // model never clones parts). Word refuses two charts or two diagrams on one
  // part, so every later use gets relationship ids of its own and its own copy
  // of whatever may not be shared. The plan given is not changed.
  //
  // A cloned SmartArt data part still names its drawing part by the old
  // relationship id, inside its XML. The bytes are not read here (that is
  // asynchronous); the clone carries `relIds`, old id to new, and apply
  // rewrites the part with it when it reads the bytes.
  function unshare(plan) {
    if (!plan || !plan.kept || !plan.kept.length) return plan;
    var parts = {}, used = {}, takenIds = {}, n = 0;
    Object.keys(plan.parts || {}).forEach(function (k) { parts[k] = plan.parts[k]; });
    plan.kept.forEach(function (e) { (e.rels || []).forEach(function (r) { takenIds[r.id] = true; }); });

    function freshKey(key, tag) {
      var k = key + tag, i = 0;
      while (parts[k]) k = key + tag + "x" + (++i);
      return k;
    }

    var kept = plan.kept.map(function (entry) {
      var reach = closure(entry.rels, parts);
      var clash = reach.some(function (k) { return used[k]; });
      if (!clash) {
        reach.forEach(function (k) { used[k] = true; });
        return entry;
      }

      var tag;
      do { tag = "c" + (++n); } while ((entry.rels || []).some(function (r) { return takenIds[r.id + tag]; }));
      var idMap = {}, cloned = {};
      (entry.rels || []).forEach(function (r) { idMap[r.id] = r.id + tag; takenIds[r.id + tag] = true; });

      function clone(key) {
        if (cloned[key]) return cloned[key];
        var src = parts[key];
        if (!src) return key;
        var nk = cloned[key] = freshKey(key, tag), copy = {};
        Object.keys(src).forEach(function (f) { copy[f] = src[f]; });
        parts[nk] = copy;
        copy.rels = (src.rels || []).map(function (r) {
          if (!r.part) return r;
          var c = {}; Object.keys(r).forEach(function (f) { c[f] = r[f]; });
          c.part = clone(r.part);
          return c;
        });
        return nk;
      }

      var rels = (entry.rels || []).map(function (r) {
        var c = {}; Object.keys(r).forEach(function (f) { c[f] = r[f]; });
        c.id = idMap[r.id];
        if (r.part && parts[r.part]) {
          // Kind "other" is content nobody has opened in Word as a copy, so nothing of it is shared.
          if (entry.kind !== "other" && mayShare(r)) used[r.part] = true;
          else {
            c.part = clone(r.part);
            if (/\/diagramData$/.test(r.type || "")) parts[c.part].relIds = idMap;
          }
        }
        return c;
      });

      var out = {}; Object.keys(entry).forEach(function (f) { out[f] = entry[f]; });
      // Whole attribute values only, in one pass: "sptK1" never touches "sptK12",
      // and an id that happens to be quoted in a text box's words is not an attribute.
      out.xml = String(entry.xml).replace(/="([^"]*)"/g, function (m, v) {
        return Object.prototype.hasOwnProperty.call(idMap, v) ? '="' + idMap[v] + '"' : m;
      });
      out.rels = rels;
      closure(rels, parts).forEach(function (k) { used[k] = true; });
      return out;
    });

    // The check that stands behind the rule: a file Word would refuse is never written.
    var owner = {};
    kept.forEach(function (entry, i) {
      closure(entry.rels, parts).forEach(function (k) {
        if (!isSingleUse(parts[k])) return;
        if (owner[k] != null && owner[k] !== i) {
          throw new SharedPartError("Two drawings use the same chart or diagram, and Word does not open a file like that.",
            [kept[owner[k]].blockId, entry.blockId]);
        }
        owner[k] = i;
      });
    });

    var result = {}; Object.keys(plan).forEach(function (f) { result[f] = plan[f]; });
    result.kept = kept; result.parts = parts;
    return result;
  }

  // ---- scaleXml -----------------------------------------------------------
  // Makes an in-line object smaller by rewriting its frame: wp:extent, the
  // outermost a:xfrm (a picture's, a shape's, a group's own) and the width and
  // height in a VML shape's style. Children of a group are left alone, because
  // they are measured in the group's own coordinates.
  //
  // Words inside a text box or a shape do not shrink with their frame (Word
  // keeps their size and cuts off what no longer fits), so they are made
  // smaller by the same factor: font sizes, paragraph spacing, fixed line
  // heights, and the margin between the frame and its words, at any depth.
  var TAG = /<(\/?)(?:[A-Za-z_][\w.\-]*:)?([A-Za-z_][\w.\-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;

  function scaleAttr(tag, name, factor, least) {
    return tag.replace(new RegExp('(\\s' + name + '=")(-?\\d+)(")'), function (m, a, v, b) {
      return a + Math.max(least, Math.round(Number(v) * factor)) + b;
    });
  }
  function scaleStyle(tag, factor) {
    return tag.replace(/(\sstyle=")([^"]*)(")/, function (m, a, style, b) {
      return a + style.replace(/(^|;)(\s*(?:width|height)\s*:\s*)(\d*\.?\d+)/g, function (mm, lead, key, v) {
        return lead + key + (Math.round(Number(v) * factor * 100) / 100);
      }) + b;
    });
  }

  // Word's own margins inside a shape, in EMU, used when the shape names none.
  var INSETS = [["lIns", 91440], ["tIns", 45720], ["rIns", 91440], ["bIns", 45720]];
  function scaleInsets(tag, factor) {
    INSETS.forEach(function (ins) {
      if (new RegExp('\\s' + ins[0] + '="').test(tag)) tag = scaleAttr(tag, ins[0], factor, 0);
      else tag = tag.replace(/\s*(\/?)>$/, " " + ins[0] + '="' + Math.round(ins[1] * factor) + '"$1>');
    });
    return tag;
  }
  // The text of a text box: sizes are half-points, never below 4 pt.
  function scaleText(tag, name, attrs, factor) {
    if (name === "sz" || name === "szCs") return scaleAttr(tag, "w:val", factor, 8);
    if (name === "spacing" && /\sw:(?:before|after|line)="/.test(attrs)) {
      tag = scaleAttr(scaleAttr(tag, "w:before", factor, 0), "w:after", factor, 0);
      if (/\sw:lineRule="(?:exact|atLeast)"/.test(attrs)) tag = scaleAttr(tag, "w:line", factor, 1);
    }
    return tag;
  }

  function scaleXml(xml, factor) {
    xml = String(xml == null ? "" : xml);
    factor = Number(factor);
    if (!(factor > 0) || factor === 1) return xml;
    var stack = [], groups = 0, vmlGroups = 0, inText = 0;
    return xml.replace(TAG, function (tag, closing, name, attrs, selfClosing) {
      if (closing) {
        var was = stack.pop();
        if (was === "wgp" || was === "grpSp") groups--;
        else if (was === "group") vmlGroups--;
        else if (was === "txbxContent") inText--;
        return tag;
      }
      var out = tag, parent = stack[stack.length - 1], grand = stack[stack.length - 2];
      if (!inText) {
        if (name === "extent" && /\scx="/.test(attrs)) {
          out = scaleAttr(scaleAttr(out, "cx", factor, 1), "cy", factor, 1);
        } else if ((name === "ext" || name === "off") && parent === "xfrm" && groups - (grand === "grpSpPr" ? 1 : 0) <= 0) {
          out = name === "ext"
            ? scaleAttr(scaleAttr(out, "cx", factor, 1), "cy", factor, 1)
            : scaleAttr(scaleAttr(out, "x", factor, -Infinity), "y", factor, -Infinity);
        } else if (!vmlGroups && /\sstyle="[^"]*(?:width|height)\s*:/.test(attrs)) {
          out = scaleStyle(out, factor);
        } else if (name === "bodyPr" && /^<wps:/.test(tag)) {
          out = scaleInsets(out, factor);
        }
      } else out = scaleText(out, name, attrs, factor);
      if (!selfClosing) {
        stack.push(name);
        if (name === "wgp" || name === "grpSp") groups++;
        else if (name === "group") vmlGroups++;
        else if (name === "txbxContent") inText++;
      }
      return out;
    });
  }

  // ---- the package as text ------------------------------------------------
  // A relationship to something outside the file that is not a link to click:
  // a linked picture, workbook or object, which Word fetches when the file is
  // opened (an address on a share hands over the reader's Windows sign-in).
  function outsideRel(r) { return !!r && r.external != null && !/(^|\/)hyperlink$/i.test(String(r.type || "")); }
  function relXml(id, type, target, external) {
    return '<Relationship Id="' + escapeAttr(id) + '" Type="' + escapeAttr(type) + '" Target="' + escapeAttr(target) + '"' +
      (external ? ' TargetMode="External"' : "") + "/>";
  }

  // The run the writer typed the token into: a run holding that text and nothing else.
  function findRun(doc, tok) {
    var at = doc.indexOf(tok);
    if (at < 0) return null;
    var open = Math.max(doc.lastIndexOf("<w:r>", at), doc.lastIndexOf("<w:r ", at));
    var close = doc.indexOf("</w:r>", at);
    if (open < 0 || close < 0) return null;
    var run = doc.slice(open, close + 6);
    var m = /^<w:r(?: [^>]*)?>(?:<w:rPr\/>|<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t(?: [^>]*)?>([^<]*)<\/w:t><\/w:r>$/.exec(run);
    return m && m[1] === tok ? { from: open, to: close + 6 } : null;
  }

  // Kept XML that is whole paragraphs (a diagram drawn over blank lines brings
  // the lines with it) takes the place of the token's paragraph, not only of
  // its run. The paragraph must hold the token's run and nothing else.
  function isParagraphs(xml) { return /^\s*<w:p[\s>]/.test(String(xml)); }
  function paragraphOf(doc, at) {
    var open = Math.max(doc.lastIndexOf("<w:p>", at.from), doc.lastIndexOf("<w:p ", at.from));
    if (open < 0 || doc.substr(at.to, 6) !== "</w:p>") return null;
    if (!/^<w:p(?: [^>]*)?>(?:<w:pPr\/>|<w:pPr>(?:(?!<\/w:p>)[\s\S])*?<\/w:pPr>)?$/.test(doc.slice(open, at.from))) return null;
    return { from: open, to: at.to + 6 };
  }

  // Adds to the root what the placed XML needs there and cannot declare itself.
  function patchRoot(doc, xmls) {
    var rootAt = /<w:document\b[^>]*>/.exec(doc);
    if (!rootAt) return doc;
    var root = rootAt[0], onRoot = {}, declared = {}, named = {}, m;
    var NS = /\sxmlns:([\w.\-]+)="([^"]*)"/g;
    while ((m = NS.exec(root))) onRoot[m[1]] = m[2];
    xmls.forEach(function (xml) {
      var d, re = /\sxmlns:([\w.\-]+)="([^"]*)"/g, val = /\s(?:Requires|[\w.\-]+:Ignorable)="([^"]*)"/g;
      while ((d = re.exec(xml))) { if (!(d[1] in declared)) declared[d[1]] = d[2]; }
      while ((d = val.exec(xml))) d[1].split(/\s+/).forEach(function (p) { if (p) named[p] = true; });
    });

    var add = "";
    function declare(prefix) {
      if (onRoot[prefix]) return true;
      var uri = declared[prefix] || KNOWN_NS[prefix];
      if (!uri) return false;
      onRoot[prefix] = uri;
      add += " xmlns:" + prefix + '="' + escapeAttr(uri) + '"';
      return true;
    }
    Object.keys(named).forEach(declare);

    var ignorable = /\smc:Ignorable="([^"]*)"/.exec(root);
    var list = ignorable ? ignorable[1].split(/\s+/).filter(Boolean) : [], grew = false;
    IGNORABLE.forEach(function (p) {
      // Only a prefix the placed XML really uses, and only when both sides mean the same namespace by it.
      if (declared[p] !== KNOWN_NS[p] || list.indexOf(p) !== -1) return;
      if (declare(p) && onRoot[p] === KNOWN_NS[p]) { list.push(p); grew = true; }
    });
    if (grew) {
      if (ignorable) root = root.replace(ignorable[0], ' mc:Ignorable="' + list.join(" ") + '"');
      else if (declare("mc") && onRoot.mc === MC) add += ' mc:Ignorable="' + list.join(" ") + '"';
    }
    if (!add && !grew) return doc;
    root = root.slice(0, -1) + add + ">";
    return doc.slice(0, rootAt.index) + root + doc.slice(rootAt.index + rootAt[0].length);
  }

  // Drawing ids in one sequence: a copied block repeats its original's id, and
  // a source file's ids can collide with the library's. The sequence starts
  // after any id the headers and footers use.
  function renumberDocPr(doc, others) {
    var max = 0, m, re = /<(?:[\w.\-]+:)?docPr\b[^>]*?\sid="(\d+)"/g;
    others.forEach(function (xml) { while ((m = re.exec(xml))) max = Math.max(max, Number(m[1])); });
    // The id is a 32-bit number; a header carrying one of Word's own huge ids would leave no room above it.
    if (max > 1000000) max = 0;
    return doc.replace(/(<(?:[\w.\-]+:)?docPr\b[^>]*?\sid=")\d+(")/g, function (all, a, b) { return a + (++max) + b; });
  }

  // An embedded object is tied to its preview shape by the shape's id, and Word
  // tells objects apart by ObjectID: with either repeated, a copy silently
  // becomes a plain picture. The watermark's _x0000_s ids are another series.
  function renumberObjects(doc) {
    var n = 1024;
    return doc.replace(/<w:object\b[\s\S]*?<\/w:object>/g, function (obj) {
      var ole = /<o:OLEObject\b[^>]*>/.exec(obj);
      if (!ole) return obj;
      n++;
      var shapeId = /\sShapeID="([^"]*)"/.exec(ole[0]), fresh = "_x0000_i" + n;
      if (shapeId) {
        var old = shapeId[1];
        obj = obj.replace(/<v:shape\b[^>]*>/g, function (tag) {
          return tag.replace(/(\sid=")([^"]*)(")/, function (all, a, v, b) { return v === old ? a + fresh + b : all; });
        });
      }
      return obj.replace(/<o:OLEObject\b[^>]*>/, function (tag) {
        return tag.replace(/(\sShapeID=")[^"]*(")/, "$1" + fresh + "$2")
          .replace(/(\sObjectID=")[^"]*(")/, "$1_" + (1700000000 + n) + "$2");
      });
    });
  }

  function extOf(name) {
    var base = String(name || "").split("/").pop(), dot = base.lastIndexOf(".");
    var ext = dot < 0 ? "" : base.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "");
    return ext && ext !== "rels" ? ext : "bin";
  }

  function partBytes(part) {
    var got;
    if (part.bytes instanceof Uint8Array) got = Promise.resolve(part.bytes);
    else if (part.blob && typeof part.blob.arrayBuffer === "function") {
      got = part.blob.arrayBuffer().then(function (b) { return new Uint8Array(b); });
    } else return Promise.reject(placeError(null, "part of it is missing from this document"));
    if (!part.relIds) return got;
    // A cloned SmartArt data part: point it at its own drawing part (see unshare).
    return got.then(function (bytes) {
      var Zip = window.App.ZipIO, xml = Zip.text(bytes), map = part.relIds;
      var out = xml.replace(/(<(?:[\w.\-]+:)?dataModelExt\b[^>]*?\srelId=")([^"]*)(")/g, function (all, a, v, b) {
        return Object.prototype.hasOwnProperty.call(map, v) ? a + escapeAttr(map[v]) + b : all;
      });
      return out === xml ? bytes : Zip.bytesOf(out);
    });
  }

  // ---- apply --------------------------------------------------------------
  function apply(blob, plan) {
    if (!needsGraft(plan)) return Promise.resolve(blob);
    var Zip = window.App.ZipIO, work;
    try { work = unshare(plan); } catch (e) { return Promise.reject(e); }
    var parts = work.parts || {};
    // A drawing that would make Word fetch something from outside the file
    // (a linked picture, workbook or object) is refused before anything is
    // written: the writer and the model never hand one over.
    for (var ki = 0; ki < (work.kept || []).length; ki++) {
      var ke = work.kept[ki], reach = closure(ke.rels, parts);
      if ((ke.rels || []).some(outsideRel) || reach.some(function (k) { return (parts[k].rels || []).some(outsideRel); })) {
        return Promise.reject(placeError(ke.blockId, "it would fetch a file from outside the document when Word opens it"));
      }
    }

    return Zip.read(blob).then(function (files) {
      var byName = {}, lower = {};
      files.forEach(function (f) { byName[f.name] = f; lower[f.name.toLowerCase()] = true; });
      if (!byName[DOC] || !byName[DOC_RELS] || !byName[TYPES]) throw placeError(null, "the file is not a Word document");
      var doc = Zip.text(byName[DOC]), rels = Zip.text(byName[DOC_RELS]), types = Zip.text(byName[TYPES]);

      // 3. Each token's run becomes the original XML. Found first, replaced in
      // one pass, so a long document is not copied once per drawing.
      var swaps = [], placed = [];
      (work.kept || []).forEach(function (entry) {
        var at = findRun(doc, escapeText(entry.token || token(entry.blockId)));
        if (at && isParagraphs(entry.xml)) at = paragraphOf(doc, at);
        if (!at) throw placeError(entry.blockId);
        var xml =entry.scale > 0 && entry.scale < 1 ? scaleXml(entry.xml, entry.scale) : String(entry.xml);
        swaps.push({ from: at.from, to: at.to, xml: xml });
        placed.push(xml);
      });
      swaps.sort(function (a, b) { return a.from - b.from; });
      var pieces = [], last = 0;
      swaps.forEach(function (s) {
        if (s.from < last) throw placeError(null, "two drawings were given the same place");
        pieces.push(doc.slice(last, s.from), s.xml); last = s.to;
      });
      pieces.push(doc.slice(last));
      doc = pieces.join("");

      // 5. Carried parts are named by their key, never by their source name: a
      // space, an ampersand or a non-ASCII character can then never reach a part name.
      var nameOf = {}, order = [], spare = 0;
      function nameFor(key) {
        if (nameOf[key]) return nameOf[key];
        var ext = extOf(parts[key].name), stem = /^[A-Za-z0-9_\-]{1,60}$/.test(key) ? key : "x" + (++spare);
        while (lower[("word/kept/" + stem + "." + ext).toLowerCase()]) stem = "x" + (++spare);
        var name = "word/kept/" + stem + "." + ext;
        lower[name.toLowerCase()] = true;
        nameOf[key] = name; order.push(key);
        // Reserve the names of everything this part reaches before its .rels is written.
        (parts[key].rels || []).forEach(function (r) { if (r.part && parts[r.part]) nameFor(r.part); });
        return name;
      }
      function relsOf(list) {
        return (list || []).map(function (r) {
          // Nothing outside the file but a link to click is ever written (see outsideRel).
          if (outsideRel(r)) throw placeError(null, "it would fetch a file from outside the document when Word opens it");
          // A link is written only to an http, https or mailto address,
          // whatever the model holds (the import and the model keep to the
          // same rule); any other is pointed nowhere.
          if (r.external != null) return relXml(r.id, r.type, !/^(https?:\/\/|mailto:)\S+/i.test(String(r.external)) ? "about:blank" : r.external, true);
          if (r.part && parts[r.part]) return relXml(r.id, r.type, "/" + nameFor(r.part), false);
          return "";
        }).join("");
      }

      // 4. The document's own relationships, once per id.
      var have = {}, m, ID = /<Relationship\b[^>]*?\sId="([^"]*)"/g, docRels = "";
      while ((m = ID.exec(rels))) have[m[1]] = true;
      (work.kept || []).forEach(function (entry) {
        (entry.rels || []).forEach(function (r) {
          if (have[escapeAttr(r.id)]) return;
          var x = relsOf([r]);
          if (x) { have[escapeAttr(r.id)] = true; docRels += x; }
        });
      });

      // 7. The source's theme, so theme colours and fonts in kept drawings resolve as they did.
      var themePart = work.theme && parts[work.theme], themeRels = "";
      var hasTheme = Object.keys(byName).some(function (n) { return /^word\/theme\//i.test(n); }) || rels.indexOf(T_THEME) !== -1;
      if (themePart && !hasTheme) {
        var themeId = "sptTheme", t = 0;
        while (have[themeId]) themeId = "sptTheme" + (++t);
        docRels += relXml(themeId, T_THEME, "theme/theme1.xml", false);
        themeRels = relsOf(themePart.rels);
      } else themePart = null;

      // 6. A content type for every part added.
      var overrides = order.map(function (key) {
        return '<Override PartName="/' + nameOf[key] + '" ContentType="' + escapeAttr(parts[key].contentType || "application/octet-stream") + '"/>';
      }).join("");
      if (themePart) overrides += '<Override PartName="/' + THEME + '" ContentType="' + escapeAttr(themePart.contentType || CT_THEME) + '"/>';

      // 8. Ids, and what the placed XML needs on the root.
      doc = patchRoot(doc, placed);
      doc = renumberDocPr(doc, files.filter(function (f) {
        return f !== byName[DOC] && /^word\/[^\/]+\.xml$/.test(f.name) && /^word\/(header|footer|footnotes|endnotes)/.test(f.name);
      }).map(Zip.text));
      doc = renumberObjects(doc);

      // 9. Pictures the library named .png whatever they hold.
      var renamed = {};
      (work.media || []).forEach(function (md) {
        var from = "word/media/" + md.fileName, file = byName[from];
        var ext = String(md.ext || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!file || !ext) return;
        var base = String(md.fileName), dot = base.lastIndexOf(".");
        var to = (dot < 0 ? base : base.slice(0, dot)) + "." + ext;
        if (to !== base) { file.name = "word/media/" + to; renamed[base] = to; }
        if (!new RegExp('<Default\\b[^>]*\\sExtension="' + ext + '"', "i").test(types)) {
          types = types.replace(/<Types\b[^>]*>/, function (open) {
            return open + '<Default Extension="' + ext + '" ContentType="' + escapeAttr(md.contentType || "application/octet-stream") + '"/>';
          });
        }
      });
      function retarget(xml) {
        Object.keys(renamed).forEach(function (old) { xml = xml.split("media/" + old + '"').join("media/" + renamed[old] + '"'); });
        return xml;
      }
      rels = retarget(rels);
      if (Object.keys(renamed).length) {
        files.forEach(function (f) {
          if (!/\.rels$/.test(f.name) || f === byName[DOC_RELS]) return;
          var before = Zip.text(f), after = retarget(before);
          if (after !== before) f.bytes = Zip.bytesOf(after);
        });
      }

      if (docRels) rels = rels.replace(/<\/Relationships>\s*$/, docRels + "</Relationships>");
      if (overrides) types = types.replace(/<\/Types>\s*$/, overrides + "</Types>");
      byName[DOC].bytes = Zip.bytesOf(doc);
      byName[DOC_RELS].bytes = Zip.bytesOf(rels);
      byName[TYPES].bytes = Zip.bytesOf(types);

      // 5, the bytes. One part at a time: they can be large, and nothing is gained by holding them all at once twice.
      var added = [], chain = Promise.resolve();
      order.forEach(function (key) {
        chain = chain.then(function () { return partBytes(parts[key]); }).then(function (bytes) {
          var name = nameOf[key], own = relsOf(parts[key].rels);
          added.push({ name: name, bytes: bytes });
          if (own) added.push({ name: "word/kept/_rels/" + name.split("/").pop() + ".rels", bytes: Zip.bytesOf(RELS_HEAD + own + "</Relationships>") });
        });
      });
      if (themePart) {
        chain = chain.then(function () { return partBytes(themePart); }).then(function (bytes) {
          added.push({ name: THEME, bytes: bytes });
          if (themeRels) added.push({ name: "word/theme/_rels/theme1.xml.rels", bytes: Zip.bytesOf(RELS_HEAD + themeRels + "</Relationships>") });
        });
      }

      // 10. Word wants the content types first.
      return chain.then(function () {
        var out = [byName[TYPES]].concat(files.filter(function (f) { return f !== byName[TYPES]; }), added);
        return Zip.write(out, { mimeType: blob.type || CT_DOCX });
      });
    });
  }

  window.App.DocxGraft = {
    apply: apply, token: token, needsGraft: needsGraft, unshare: unshare,
    scaleXml: scaleXml, escapeAttr: escapeAttr, SharedPartError: SharedPartError
  };
})();
