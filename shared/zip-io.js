/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* zip-io.js: App.ZipIO, the zip reader and writer (docs/document-tool-design.md 4.1).
   A .docx is a plain zip, and the browser can inflate and deflate one itself
   (DecompressionStream, CompressionStream), so nothing is vendored for it.
   Edge, Chrome and Electron only. Depends on nothing. */
(function () {
  "use strict";
  window.App = window.App || {};

  var SIG_LOCAL = 0x04034b50, SIG_CENTRAL = 0x02014b50, SIG_END = 0x06054b50, SIG_ZIP64_LOCATOR = 0x07064b50;
  var MAX_TOTAL = 500 * 1024 * 1024, MAX_ENTRIES = 5000;
  var U32 = 0xFFFFFFFF, U16 = 0xFFFF;
  // Already compressed: deflating these again costs time and saves nothing.
  var STORED = /\.(png|jpe?g|gif|xlsx|docx|pptx|vsdx|zip)$/i;
  // 1 January 2026, 00:00. Fixed, so the same parts always give the same bytes.
  var DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1, DOS_TIME = 0;

  function bad(why) { return new Error("This file could not be read as a zip: " + why + "."); }

  // ---- text ---------------------------------------------------------------
  function text(part) {
    var bytes = part && part.bytes ? part.bytes : part;
    return bytes ? new TextDecoder().decode(bytes) : "";
  }
  function bytesOf(string) { return new TextEncoder().encode(String(string == null ? "" : string)); }

  // ---- CRC-32 -------------------------------------------------------------
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    var c = 0xFFFFFFFF, t = CRC_TABLE;
    for (var i = 0, n = bytes.length; i < n; i++) c = t[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  // ---- inflate and deflate ------------------------------------------------
  // Read a stream to the end, giving up once it passes `limit` bytes: an entry
  // can declare a small size and inflate to a huge one, so the declared size
  // is enforced while reading, not trusted.
  function drain(stream, limit) {
    var reader = stream.getReader(), chunks = [], total = 0;
    function step() {
      return reader.read().then(function (r) {
        if (r.done) {
          var out = new Uint8Array(total), at = 0;
          chunks.forEach(function (c) { out.set(c, at); at += c.length; });
          return out;
        }
        total += r.value.length;
        if (limit != null && total > limit) {
          try { reader.cancel(); } catch (e) { /* already closed */ }
          throw bad("an entry is larger than it declares");
        }
        chunks.push(r.value);
        return step();
      });
    }
    return step();
  }
  function inflate(data, size) {
    return drain(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw")), size)
      .then(function (out) {
        if (out.length !== size) throw bad("an entry is smaller than it declares");
        return out;
      }, function (e) {
        throw (/could not be read as a zip/.test(e && e.message) ? e : bad("an entry is damaged"));
      });
  }
  function deflate(bytes) {
    return drain(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw")), null);
  }

  // Run the jobs a few at a time: a large document has thousands of entries,
  // and one stream each, all at once, is slower than a short queue.
  function pooled(count, job, width) {
    var out = new Array(count), next = 0;
    function worker() {
      if (next >= count) return Promise.resolve();
      var i = next++;
      return job(i).then(function (v) { out[i] = v; return worker(); });
    }
    var workers = [];
    for (var w = 0; w < Math.min(width || 6, count); w++) workers.push(worker());
    return Promise.all(workers).then(function () { return out; });
  }

  // ---- read ---------------------------------------------------------------
  // Everything is taken from the central directory, so an entry written with a
  // data descriptor (sizes after the data, zeros in the local header) reads
  // like any other. Directory entries come back too, with no bytes.
  function read(blobOrBuffer, opts) {
    opts = opts || {};
    var maxTotal = opts.maxTotalBytes == null ? MAX_TOTAL : opts.maxTotalBytes;
    var maxEntries = opts.maxEntries == null ? MAX_ENTRIES : opts.maxEntries;
    var source;
    if (blobOrBuffer instanceof Uint8Array) source = Promise.resolve(blobOrBuffer);
    else if (blobOrBuffer instanceof ArrayBuffer) source = Promise.resolve(new Uint8Array(blobOrBuffer));
    else if (blobOrBuffer && typeof blobOrBuffer.arrayBuffer === "function") {
      source = blobOrBuffer.arrayBuffer().then(function (b) { return new Uint8Array(b); });
    } else return Promise.reject(bad("nothing was given to read"));

    return source.then(function (u8) {
      var v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), len = u8.length;
      // The end record is the last thing in the file, bar a comment of up to 65,535 bytes.
      var eocd = -1, stop = Math.max(0, len - 22 - U16);
      for (var i = len - 22; i >= stop; i--) { if (v.getUint32(i, true) === SIG_END) { eocd = i; break; } }
      if (eocd < 0) throw bad("it is not a zip file");
      var count = v.getUint16(eocd + 10, true), cdSize = v.getUint32(eocd + 12, true), cdAt = v.getUint32(eocd + 16, true);
      var zip64 = count === U16 || cdSize === U32 || cdAt === U32 ||
        (eocd >= 20 && v.getUint32(eocd - 20, true) === SIG_ZIP64_LOCATOR);
      if (zip64) throw bad("it uses the ZIP64 format, which is not supported");
      if (count > maxEntries) throw bad("it holds too many entries (" + count + ")");
      if (cdAt + cdSize > eocd) throw bad("its directory is damaged");

      var entries = [], total = 0, p = cdAt;
      for (var k = 0; k < count; k++) {
        if (p + 46 > eocd || v.getUint32(p, true) !== SIG_CENTRAL) throw bad("its directory is damaged");
        var flags = v.getUint16(p + 8, true), method = v.getUint16(p + 10, true);
        var csize = v.getUint32(p + 20, true), usize = v.getUint32(p + 24, true);
        var nlen = v.getUint16(p + 28, true), xlen = v.getUint16(p + 30, true), clen = v.getUint16(p + 32, true);
        var local = v.getUint32(p + 42, true);
        var name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
        if (flags & 0x0001) throw bad("it is encrypted");
        if (csize === U32 || usize === U32 || local === U32) throw bad("it uses the ZIP64 format, which is not supported");
        if (method !== 0 && method !== 8) throw bad("\"" + name + "\" is compressed in a way that is not supported");
        if (method === 0 && csize !== usize) throw bad("\"" + name + "\" is damaged");
        total += usize;
        // Counted from what the directory declares, before anything is inflated.
        if (total > maxTotal) throw bad("it unpacks to more than " + Math.round(maxTotal / 1048576) + " MB");
        if (local + 30 > len || v.getUint32(local, true) !== SIG_LOCAL) throw bad("\"" + name + "\" is damaged");
        // The local header has its own name and extra lengths; they can differ from the directory's.
        var start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
        if (start + csize > len) throw bad("\"" + name + "\" is cut short");
        entries.push({ name: name, method: method, usize: usize, data: u8.subarray(start, start + csize) });
        p += 46 + nlen + xlen + clen;
      }
      return pooled(entries.length, function (n) {
        var e = entries[n];
        // A stored entry is copied, so the result never pins the whole file in memory.
        var bytes = e.method === 0 ? Promise.resolve(e.data.slice()) : inflate(e.data, e.usize);
        return bytes.then(function (b) { return { name: e.name, bytes: b }; });
      });
    });
  }

  // ---- write --------------------------------------------------------------
  function header(size) { return new DataView(new ArrayBuffer(size)); }

  function write(parts, opts) {
    opts = opts || {};
    var seen = {};
    // The docx library's own zip has directory entries; a package has no use for them.
    var list = (parts || []).filter(function (p) { return p && !/\/$/.test(p.name); });
    if (list.length > U16 - 1) return Promise.reject(new Error("This file has too many parts to save (" + list.length + ")."));
    for (var i = 0; i < list.length; i++) {
      if (seen[list[i].name]) return Promise.reject(new Error("Two parts of this file have the same name: " + list[i].name));
      seen[list[i].name] = true;
    }

    return pooled(list.length, function (n) {
      var part = list[n], raw = part.bytes || new Uint8Array(0);
      var entry = { name: bytesOf(part.name), raw: raw, data: raw, method: 0, crc: crc32(raw) };
      if (!raw.length || STORED.test(part.name)) return Promise.resolve(entry);
      return deflate(raw).then(function (d) {
        if (d.length < raw.length) { entry.data = d; entry.method = 8; }
        return entry;
      });
    }).then(function (entries) {
      var chunks = [], central = [], offset = 0, centralSize = 0;
      entries.forEach(function (e) {
        var lh = header(30);
        lh.setUint32(0, SIG_LOCAL, true); lh.setUint16(4, 20, true);
        lh.setUint16(6, 0x0800, true);                       // names are UTF-8
        lh.setUint16(8, e.method, true); lh.setUint16(10, DOS_TIME, true); lh.setUint16(12, DOS_DATE, true);
        lh.setUint32(14, e.crc, true); lh.setUint32(18, e.data.length, true); lh.setUint32(22, e.raw.length, true);
        lh.setUint16(26, e.name.length, true); lh.setUint16(28, 0, true);
        chunks.push(new Uint8Array(lh.buffer), e.name, e.data);

        var ch = header(46);
        ch.setUint32(0, SIG_CENTRAL, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
        ch.setUint16(8, 0x0800, true); ch.setUint16(10, e.method, true);
        ch.setUint16(12, DOS_TIME, true); ch.setUint16(14, DOS_DATE, true);
        ch.setUint32(16, e.crc, true); ch.setUint32(20, e.data.length, true); ch.setUint32(24, e.raw.length, true);
        ch.setUint16(28, e.name.length, true);
        if (offset >= U32) throw new Error("This file is too large to save (over 4 GB).");
        ch.setUint32(42, offset, true);
        central.push(new Uint8Array(ch.buffer), e.name);
        centralSize += 46 + e.name.length;
        offset += 30 + e.name.length + e.data.length;
      });
      // No ZIP64: every size and offset has to fit in 32 bits.
      if (offset + centralSize >= U32) throw new Error("This file is too large to save (over 4 GB).");
      var end = header(22);
      end.setUint32(0, SIG_END, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
      end.setUint32(12, centralSize, true); end.setUint32(16, offset, true);
      return new Blob(chunks.concat(central, [new Uint8Array(end.buffer)]), { type: opts.mimeType || "application/zip" });
    });
  }

  window.App.ZipIO = { read: read, write: write, crc32: crc32, text: text, bytesOf: bytesOf };
})();
