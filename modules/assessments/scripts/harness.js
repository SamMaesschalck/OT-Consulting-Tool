/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* harness.js - the shared scaffolding for the test pages in this folder.
 *
 * Every page used to carry its own copy of three things: the app's script tags,
 * a fake header/sidebar/main DOM for ui.js to render into, and a pass/fail
 * helper. Sixty-four copies of the first had drifted into thirty-seven
 * different include lists - eight of them loading js/find.js, which does not
 * exist and had been 404ing silently. A test page should say what it tests and
 * nothing else, so all three live here.
 *
 * Usage, at the top of the body:
 *
 *   <script src="harness.js"></script>
 *   <script>H.app({ docx: "mock", tours: ["sl"] }); H.dom();</script>
 *   ... then the test itself:
 *   <script>
 *   H.test(function (ok) {
 *     ok(1 + 1 === 2, "arithmetic still works");
 *   });
 *   </script>
 *
 * H.app writes the script tags with document.write, which the parser executes
 * in order and synchronously - so by the time the test script runs, window.App
 * is fully built, exactly as it is in index.html.
 */
(function () {
  var H = {};

  function write(src) {
    document.write('<script src="../' + src + '"><\/script>');
  }

  // The order index.html uses. It is not arbitrary - engine.js and ui.js expect
  // the scoring families and the exporters to be defined - so this list mirrors
  // it rather than inventing its own, and any change to index.html belongs here
  // too. The optional pieces are marked; everything else always loads, because
  // a module nobody calls costs nothing and a missing one costs an afternoon.
  var CORE = [
    "data/manifest.js",
    "js/version.js",
    "js/product.js",
    "js/logo.js",
    "js/scoring.js",
    "js/scoring-domain-letter.js",
    "js/scoring-caf-achieved.js",
    "js/scoring-program-ml.js",
    "js/scoring-nis2.js",
    "js/scoring-csms.js",
    "js/scoring-cra.js",
    "js/scoring-risk-appetite.js",
    "js/storage.js",
    "js/compare.js",
    "js/charts.js",
    "js/report.js"
  ];

  /* opts:
   *   xlsx:  true                 - ExcelJS + SheetJS + js/export-xlsx.js
   *   docx:  true | "mock"        - js/export-docx.js, with the real vendor
   *                                 library or without it for pages that
   *                                 install their own window.docx (the real one
   *                                 is over a megabyte, so mocking pages skip it)
   *   tours: ["sl", "caf", ...]   - js/tour-<name>-data.js
   *   extra: ["data/..."]         - anything else, loaded last
   */
  H.app = function (opts) {
    opts = opts || {};
    if (opts.xlsx) { write("vendor/xlsx.full.min.js"); write("vendor/exceljs.min.js"); }
    if (opts.docx === true) write("vendor/docx.umd.js");
    CORE.forEach(write);
    if (opts.xlsx) write("js/export-xlsx.js");
    if (opts.docx) { write("js/hero-asset.js"); write("js/export-docx.js"); }
    write("js/engine.js");
    write("js/ui.js");
    (opts.tours || []).forEach(function (t) { write("js/tour-" + t + "-data.js"); });
    (opts.extra || []).forEach(write);
  };

  // The shell ui.js renders into. The header buttons are real elements because
  // init() binds listeners to them by id and would throw on a missing one.
  // It deliberately does NOT write the #out element: a page may want its own
  // (several style their results as rows), and H.test makes one if there is
  // none, so neither choice needs saying out loud.
  H.dom = function () {
    document.write(
      '<div class="app"><div class="header"><div id="engagement-summary"></div>' +
      '<button id="btn-theme"></button><button id="btn-engagement"></button>' +
      '<button id="btn-new"></button><button id="btn-load"></button>' +
      '<button id="btn-save"></button><button id="btn-xlsx"></button>' +
      '<button id="btn-docx"></button><input id="file-input" type="file"/></div>' +
      '<div id="sidebar"></div><div id="main"></div></div>' +
      '<div id="toast"></div>'
    );
  };

  // Every part of a .docx/.xlsx blob as { name, text } (text for XML parts
  // only), so a page can read what was actually written.
  H.unzipText = function (blob) {
    return blob.arrayBuffer().then(function (buf) {
      var v = new DataView(buf), u8 = new Uint8Array(buf), eocd = -1;
      for (var i = buf.byteLength - 22; i >= 0; i--) { if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
      if (eocd < 0) throw new Error("not a zip");
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
          return bytes.then(function (b) { return { name: name, text: /\.(xml|rels)$/.test(name) ? new TextDecoder().decode(b) : "" }; });
        })(name, method, data));
        p += 46 + nlen + xlen + clen;
      }
      return Promise.all(jobs);
    });
  };

  // The demo dataset each instrument's tour loads, by instrument id. Needs
  // every tour script (H.ALL_TOURS) loaded.
  H.ALL_TOURS = ["41", "42", "caf", "caf-aviation", "cis", "cra", "csms", "machinery", "ml", "nis2", "nis2-quick",
                 "nist", "nist82", "posture", "risk-appetite", "sl", "supplier", "syaps"];
  H.demoSeeds = function () {
    var A = window.App;
    return {
      "iec-62443-3-3": A.TourSL, "iec-62443-4-2": A.Tour42, "ncsc-caf": A.TourCAF, "general-ot-posture": A.TourPosture,
      "iec-62443-2-1-2024": A.TourML, "nis2-assessment": A.TourNIS2, "nis2-quick-gap": A.TourNIS2Quick, "iec-62443-4-1": A.Tour41,
      "iec-62443-2-1-2010": A.TourCSMS, "ncsc-caf-aviation": A.TourCAFAviation, "eu-cra": A.TourCRA, "eu-machinery": A.TourMachinery,
      "supplier-screener": A.TourSupplier, "risk-appetite": A.TourRiskAppetite, "nist-800-53": A.TourNIST, "nist-800-82": A.TourNIST82,
      "cis-controls-v8": A.TourCIS, "onr-syaps-management": A.TourSyAPS.management, "onr-syaps-cyber": A.TourSyAPS.cyber,
      "onr-syaps-full": A.TourSyAPS.full
    };
  };

  function outEl() {
    var el = document.getElementById("out");
    if (!el) {
      el = document.createElement("pre");
      el.id = "out";
      el.setAttribute("style", "font:12px monospace; white-space:pre-wrap");
      document.body.appendChild(el);
    }
    return el;
  }

  /* Runs a test body and writes the summary the runner reads.
   *
   *   H.test(function (ok) { ... })           synchronous; flushed on return
   *   H.test(function (ok, done) { ... })     asynchronous; flushed on done()
   *
   * Declaring `done` is what makes a page asynchronous, so a page that forgets
   * to call it fails visibly (no summary, reported INCOMPLETE) instead of
   * reporting a green run that stopped at the first callback.
   */
  H.test = function (body) {
    var lines = [], failed = 0;

    function ok(cond, name, detail) {
      lines.push((cond ? "PASS " : "FAIL ") + name + (!cond && detail ? " - " + detail : ""));
      if (!cond) failed++;
    }
    // Free-text note between assertions, for pages that explain what a block is
    // about. Never counted.
    ok.note = function (text) { lines.push(text); };
    ok.failures = function () { return failed; };

    // Safe to call repeatedly: it rewrites the summary rather than locking the
    // first one in. Several pages step through a list of instruments and flush
    // after each, so that progress is visible if a later one hangs - a guard
    // that ignored the second call would throw all of that away.
    function flush() {
      // Builds the summary rather than appending it, so calling flush twice
      // does not leave two summaries stacked up in the output.
      outEl().textContent = lines.concat([
        "", failed === 0 ? "ALL TESTS PASSED" : failed + " FAILED"
      ]).join("\n");
    }

    function run() {
      var isAsync = body.length >= 2;
      try {
        body(ok, flush);
      } catch (e) {
        ok(false, "threw: " + (e && e.message ? e.message : e) + "\n" + ((e && e.stack) || ""));
        flush();
        return;
      }
      if (!isAsync) flush();
    }

    // H.dom() writes the #out element during parsing, so it exists by now on a
    // normal page; waiting for DOMContentLoaded anyway means a page can put its
    // markup wherever it likes.
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", run);
    } else {
      run();
    }
  };

  window.H = H;
})();
