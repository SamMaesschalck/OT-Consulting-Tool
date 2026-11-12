/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* version.js
 *
 * THE version of the OT Cyber suite. Every module (the OT Cyber Assessment
 * Tool, the OT Cyber Risk Assessment Tool, the OT Cyber Report Review Tool,
 * the OT Cyber Document Tool) and the SolutionsPT OT Cyber Suite carry this
 * one number, and every
 * file in a release is named for it. The canonical copy is shared/version.js:
 * change it there and only there, then run tools/sync-shared.ps1, which copies
 * it to js/version.js in each module (each keeps its own copy so it still
 * runs, and ships, on its own). tools/sync-shared.ps1 -Check fails on drift.
 *
 *   - each tool shows it (header badge; the assessment tool's sidebar notice
 *     and licence pop-up; the risk tool's About page)
 *   - every project file the assessment tool saves records it
 *     (createdWithVersion / savedWithVersion), so a project sent back says
 *     which version made it
 *   - the single-file builds (packaging/single-html/) put it in their names
 *   - the desktop apps (packaging/electron/) take it as their exe version
 *
 * The product name is the module's own: js/product.js sets App.Product, and
 * App.Version.product reads it. Either file may load first.
 *
 * NEVER in a report. Word and Excel exports carry no version information,
 * visible or in their properties: the deliverable is the consultant's, not
 * the tool's. Each module has a test that opens real exports to prove it.
 *
 * Major.minor.patch. The label drops a .0 patch: "0.3.0" shows as "v0.3".
 */
(function () {
  window.App = window.App || {};
  var VERSION = "0.7.0";
  function label(v) {
    var p = String(v || "").split(".");
    return "v" + (p.length === 3 && p[2] === "0" ? p[0] + "." + p[1] : String(v));
  }
  // -1, 0 or 1, comparing "0.3.0"-style numbers part by part.
  function compare(a, b) {
    var x = String(a || "0").split("."), y = String(b || "0").split(".");
    for (var i = 0; i < Math.max(x.length, y.length); i++) {
      var d = (parseInt(x[i], 10) || 0) - (parseInt(y[i], 10) || 0);
      if (d) return d < 0 ? -1 : 1;
    }
    return 0;
  }
  window.App.Version = {
    number: VERSION,
    label: label(VERSION),
    product: (window.App.Product && window.App.Product.name) || "",
    labelOf: label,
    compare: compare
  };
})();
