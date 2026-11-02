/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* version.js
 *
 * THE version of the OT Cyber Assessment Tool. Change it here and only here:
 * every release reads it.
 *
 *   - the app shows it (header badge, sidebar notice, licence pop-up)
 *   - every project file it saves records it (createdWithVersion /
 *     savedWithVersion), so a project sent back says which version made it
 *   - the single-file build (packaging/single-html/) puts it in its file name
 *   - the desktop app (packaging/electron/) takes it as its exe version
 *
 * NEVER in a report. Word and Excel exports carry no version information,
 * visible or in their properties: the deliverable is the consultant's, not
 * the tool's. test-version.html guards this.
 *
 * Major.minor.patch. The label drops a .0 patch: "0.3.0" shows as "v0.3".
 */
(function () {
  window.App = window.App || {};
  var VERSION = "0.5.0";
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
    product: "OT Cyber Assessment Tool",
    labelOf: label,
    compare: compare
  };
})();
