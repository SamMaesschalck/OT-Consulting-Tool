/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* product.js
 *
 * Which product this is: the suite shell. The version number is the suite's,
 * shared by every module (js/version.js, copied in from shared/version.js);
 * the name matches "product" in suite.json (the packaging scripts check
 * that). Loads before or after js/version.js: whichever comes second fills in
 * App.Version.product.
 */
(function () {
  window.App = window.App || {};
  window.App.Product = { id: "suite", name: "SolutionsPT OT Cyber Suite" };
  if (window.App.Version) window.App.Version.product = window.App.Product.name;
})();
