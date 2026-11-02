/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* product.js
 *
 * Which product this module is. The version number is the suite's, shared by
 * every module (js/version.js, copied in from shared/version.js); the name is
 * this module's own, and matches "product" in module.json (the packaging
 * scripts check that). Loads before or after js/version.js: whichever comes
 * second fills in App.Version.product.
 */
(function () {
  window.App = window.App || {};
  window.App.Product = { id: "assessments", name: "OT Cyber Assessment Tool" };
  if (window.App.Version) window.App.Version.product = window.App.Product.name;
})();
