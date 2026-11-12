/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* export.js: App.DocExport, the Word export and the Issue check
 * (docs/document-tool-design.md 5.2, 5.8).
 *
 * Everything that prints is decided by App.HouseDocx.buildDocument. This file
 * only chooses Draft or Final, names the file and hands it to the browser.
 * The Issue check is that same build stopped before packing, so the list on
 * the Issue page is what would print red, never a second opinion of it.
 *
 * The suite version and the product name are never passed to the writer:
 * the Word file is the consultant's deliverable, not the tool's
 * (scripts/test-doc-version.html opens exports to prove it).
 */
(function () {
  "use strict";
  var A = window.App = window.App || {};

  function current() { return A.DocApp && A.DocApp.state && A.DocApp.state.doc; }
  function statusOf(status) { return status === "final" ? "final" : "draft"; }

  // One part of a file name: anything a file system or a mail gateway might
  // object to becomes a hyphen. Dots stay, so revision 0.1 reads as 0.1.
  function slug(s, max) {
    return String(s || "").trim().slice(0, max || 80)
      .replace(/[^A-Za-z0-9_.\-]+/g, "-").replace(/-{2,}/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  }

  // Client, title and revision; a draft says so in its name and the final
  // carries the plain name, as the assessment tool's docxFilename does.
  function filename(doc, status) {
    var info = (doc && doc.info) || {};
    var parts = [slug(info.client, 40), slug(info.title, 80) || "document", slug(info.revision, 12)]
      .filter(function (p) { return !!p; });
    return parts.join("-") + (statusOf(status) === "final" ? "" : "-draft") + ".docx";
  }

  // The pictures and kept objects the last export made smaller to fit (too
  // wide for their space, or taller than a page), for the message after it.
  var lastFitted = [];

  // A report's cover is one page whatever is typed on it, so cover text that
  // is far too long is cut off in the Word file. The writer's estimate says
  // when; the export says so, since the cover on screen cannot show it.
  function coverCut(doc) {
    var H = A.HouseDocx;
    return !!(doc && doc.kind !== "short" && H && H.coverFits && !H.coverFits(doc));
  }

  // Rejects with the writer's own message when Final is refused, so the page
  // and the tests see the same words.
  function blob(status) {
    var doc = current();
    if (!doc) return Promise.reject(new Error("There is no document open."));
    return A.HouseDocx.buildDocument(doc, { issueStatus: statusOf(status) }).then(function (res) {
      if (!res || !res.blob) throw new Error("The Word file could not be built.");
      lastFitted = res.fitted || [];
      return res.blob;
    });
  }

  // Builds and downloads. It never rejects: a failure is shown and the
  // promise resolves null, so a button can call it without a catch.
  function word(status) {
    var D = A.DocApp, doc = current(), st = statusOf(status);
    if (!doc) { D.toast("There is no document open.", "err"); return Promise.resolve(null); }
    D.busy(st === "final" ? "Building the final Word file" : "Building the draft Word file");
    return blob(st).then(function (b) {
      var name = filename(doc, st);
      A.DocStorage.download(b, name);
      D.busy(null);
      var n = lastFitted.length, cut = coverCut(doc);
      // A drawing kept from a Word file has the text inside it made smaller
      // with it, which nothing on screen shows.
      var drawn = lastFitted.some(function (id) { var f = A.DocModel && A.DocModel.find(doc, id); return !!(f && f.block && f.block.type === "kept"); });
      var said = "Exported " + name + "." +
        (n ? " " + (n === 1 ? "1 picture or drawing was" : n + " pictures or drawings were") + " made smaller to fit the page." : "") +
        (drawn ? " Text inside a drawing is made smaller with it, so check it in Word." : "") +
        (cut ? " The cover has more text than its page holds, so some of it is cut off. Shorten the title or the other cover lines." : "");
      if (cut) D.toast(said, "warn"); else D.toast(said);
      return { name: name, blob: b, fitted: lastFitted, coverCut: cut };
    }, function (err) {
      D.busy(null);
      D.toast("The Word file was not exported. " + ((err && err.message) || "Something went wrong."), "err");
      return null;
    });
  }

  // [{ text, where }], where is { kind: "block", blockId } or
  // { kind: "info", field }. Draft or Final makes no difference to the list.
  function issues() {
    var doc = current();
    if (!doc) return Promise.resolve([]);
    return A.HouseDocx.issueList(doc).then(function (list) { return list || []; });
  }

  A.DocExport = { word: word, blob: blob, issues: issues, filename: filename, coverCut: coverCut };
})();
