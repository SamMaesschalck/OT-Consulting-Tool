/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* pictures.js: App.DocPictures, turns a picture the user inserts, pastes or
 * drops into what the document stores (docs/document-tool-design.md 3.5, 5.2).
 *
 * Only for pictures the user adds. Pictures read from an imported Word file
 * never come through here: they are stored byte for byte.
 *
 * What a file is, is decided from its first bytes, never from its name or
 * the type the browser reports. A PNG or JPEG of a sensible size is kept as
 * it is; anything else is redrawn on a canvas, which also means nothing but
 * pixels of an SVG, GIF, BMP or WebP is ever stored. Pictures are shown from
 * object URLs and data: URLs (the page's policy allows both for images) and
 * bytes are never fetched.
 */
(function () {
  "use strict";
  window.App = window.App || {};

  var ACCEPT = "image/png,image/jpeg,image/gif,image/bmp,image/webp,image/svg+xml,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg";
  var MAX_SIDE = 2400;                    // px, the longest side of a stored picture
  var MAX_BYTES = 5 * 1024 * 1024;        // refused above this, after reducing
  var JPEG_OVER = 1.5 * 1024 * 1024;      // a redrawn PNG with no transparency above this becomes JPEG
  var PAGE_PX = 601;                      // the text width of a portrait page at 96 dpi (9026 dxa)
  var EXT = { "image/png": "png", "image/jpeg": "jpg" };

  function sniff(bytes) {
    function at(i, list) { for (var k = 0; k < list.length; k++) if (bytes[i + k] !== list[k]) return false; return true; }
    if (at(0, [0x89, 0x50, 0x4E, 0x47])) return "image/png";
    if (at(0, [0xFF, 0xD8, 0xFF])) return "image/jpeg";
    if (at(0, [0x47, 0x49, 0x46, 0x38])) return "image/gif";
    if (at(0, [0x42, 0x4D])) return "image/bmp";
    if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) return "image/webp";
    var head = "";
    for (var i = 0; i < bytes.length; i++) head += String.fromCharCode(bytes[i]);
    head = head.replace(/^ï»¿/, "");
    if (/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE\s+svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return "image/svg+xml";
    return "";
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error("This picture could not be read. It may be damaged.")); };
      img.src = src;
    });
  }
  function canvasBlob(canvas, type, quality) {
    return new Promise(function (resolve, reject) {
      try {
        canvas.toBlob(function (b) { if (b) resolve(b); else reject(new Error("This picture could not be converted.")); }, type, quality);
      } catch (e) { reject(new Error("This picture could not be converted.")); }
    });
  }
  function opaque(canvas) {
    var data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    for (var i = 3; i < data.length; i += 4) if (data[i] !== 255) return false;
    return true;
  }
  function draw(img, w, h) {
    var canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    return canvas;
  }
  // Onto a canvas at w by h and out again: JPEG stays JPEG, everything else
  // becomes PNG, and a large PNG with nothing see-through becomes JPEG too.
  function redraw(img, w, h, type) {
    var canvas = draw(img, w, h);
    if (type === "image/jpeg") return canvasBlob(canvas, "image/jpeg", 0.9).then(function (b) { return { blob: b, type: "image/jpeg" }; });
    return canvasBlob(canvas, "image/png").then(function (b) {
      if (b.size <= JPEG_OVER || !opaque(canvas)) return { blob: b, type: "image/png" };
      return canvasBlob(canvas, "image/jpeg", 0.9).then(function (j) { return { blob: j, type: "image/jpeg" }; });
    });
  }
  function rename(name, type) {
    var base = String(name || "picture").replace(/\.[A-Za-z0-9]{1,5}$/, "") || "picture";
    return base + "." + EXT[type];
  }
  function mb(n) { return (n / 1048576).toFixed(1); }

  function raster(file, type) {
    var url = URL.createObjectURL(file.slice(0, file.size, type));
    return loadImage(url).then(function (img) {
      var w = img.naturalWidth, h = img.naturalHeight;
      if (!w || !h) throw new Error("This picture could not be read. It may be damaged.");
      var scale = Math.min(1, MAX_SIDE / Math.max(w, h));
      // Never up, and a PNG or JPEG that already fits is not touched at all.
      if (scale === 1 && own(EXT, type)) {
        return { blob: file.slice(0, file.size, type), type: type, width: w, height: h, name: rename(file.name, type) };
      }
      var tw = Math.max(1, Math.round(w * scale)), th = Math.max(1, Math.round(h * scale));
      return redraw(img, tw, th, type).then(function (r) {
        return { blob: r.blob, type: r.type, width: tw, height: th, name: rename(file.name, r.type) };
      });
    }).then(function (out) { URL.revokeObjectURL(url); return out; }, function (e) { URL.revokeObjectURL(url); throw e; });
  }
  // An SVG is drawn once, at twice the size it will print at so it stays
  // sharp, and the drawing is what is stored. printWidth and printHeight say
  // what size that was meant for.
  function vector(file) {
    return file.text().then(function (text) {
      return loadImage("data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(text))));
    }).then(function (img) {
      var w = img.naturalWidth || 600, h = img.naturalHeight || 400;
      var fit = Math.min(1, PAGE_PX / w), pw = Math.max(1, Math.round(w * fit)), ph = Math.max(1, Math.round(h * fit));
      var scale = Math.min(2, MAX_SIDE / pw, MAX_SIDE / ph), tw = Math.max(1, Math.round(pw * scale)), th = Math.max(1, Math.round(ph * scale));
      return redraw(img, tw, th, "image/png").then(function (r) {
        return { blob: r.blob, type: r.type, width: tw, height: th, name: rename(file.name, r.type), printWidth: pw, printHeight: ph };
      });
    });
  }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  // Resolves { blob, type, width, height, name } (width and height are the
  // stored picture's own pixels; printWidth and printHeight are added when it
  // should print smaller than that). Rejects with a message to show.
  function fromFile(file) {
    if (!file || typeof file.slice !== "function") return Promise.reject(new Error("No picture was given."));
    return file.slice(0, 2048).arrayBuffer().then(function (buf) {
      var type = sniff(new Uint8Array(buf));
      if (!type) throw new Error((file.name ? file.name + " is" : "This is") + " not a picture this tool can insert. Use a PNG, JPEG, GIF, BMP, WebP or SVG file.");
      return type === "image/svg+xml" ? vector(file) : raster(file, type);
    }).then(function (out) {
      if (out.blob.size > MAX_BYTES) {
        throw new Error("This picture is too large to insert (" + mb(out.blob.size) + " MB after reducing; the most is " + mb(MAX_BYTES) + " MB). Use a smaller picture.");
      }
      return out;
    });
  }

  window.App.DocPictures = { fromFile: fromFile, ACCEPT: ACCEPT, sniff: sniff, MAX_SIDE: MAX_SIDE, MAX_BYTES: MAX_BYTES };
})();
