/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only. */
/* selftest-documents.js - run the packaged document tool with --self-test to
 * check it end to end.
 *
 *   "OT Cyber Document Tool.exe" --self-test --out=C:\path\result.txt
 *
 * Checks that the app starts from inside the package with its title, logo
 * and version, that the autosave store (IndexedDB) answers here, that the
 * demo document it carries opens and every page draws, that a Word export is
 * a real file on disk with the house cover and the kept diagram's parts, that
 * the exported file imports again, that a save with no dialog downloads the
 * document file, and that closing with unsaved work triggers the app's own
 * warning. Whether Word opens the export is tools\word-open-check.ps1's
 * job, not this one's. Exits 0 on pass, 1 on fail. Only loaded when the flag
 * is given; main.js loads it for the module whose module.json says
 * electron.selfTest "documents".
 */
"use strict";
const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const MODULE = require("./module.json");

module.exports = function selfTest(win) {
  const lines = [];
  let failed = 0;
  const ok = (cond, name, detail) => {
    lines.push((cond ? "PASS " : "FAIL ") + name + (!cond && detail ? " - " + detail : ""));
    if (!cond) failed++;
  };
  const outArg = process.argv.find((a) => a.startsWith("--out="));
  const finish = (code) => {
    lines.push("", failed === 0 ? "ALL TESTS PASSED" : failed + " FAILED");
    const text = lines.join("\n");
    if (outArg) fs.writeFileSync(outArg.slice(6), text, "utf8");
    console.log(text);
    app.exit(code != null ? code : (failed ? 1 : 0));
  };
  const run = (js) => win.webContents.executeJavaScript(js, true);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Downloads are saved to temp in self-test mode (see main.js); watch them land.
  const downloads = [];
  win.webContents.session.on("will-download", (e, item) => {
    const rec = { name: item.getFilename(), state: "pending", path: null, bytes: null };
    downloads.push(rec);
    item.once("done", (ev, state) => {
      rec.state = state; rec.path = item.getSavePath();
      try { rec.bytes = fs.readFileSync(rec.path); } catch (err) {}
    });
  });
  const landed = async (from) => {
    for (let i = 0; i < 150 && !(downloads.length > from && downloads[from].state !== "pending"); i++) await sleep(100);
    return downloads[from];
  };

  let preventUnloadFired = false;
  win.webContents.on("will-prevent-unload", () => { preventUnloadFired = true; });

  setTimeout(() => { ok(false, "self-test timed out"); finish(1); }, 240000);

  win.webContents.once("did-finish-load", async () => {
    try {
      let started = false;
      for (let i = 0; i < 100 && !started; i++) {
        started = await run("!!(window.App && App.Version && App.DocApp && App.DocPages && App.HouseDocx && window.DocumentTool)");
        if (!started) await sleep(100);
      }
      ok(started, "the app starts inside the package");
      if (!started) return finish(1);
      if (global.otcatSplash.launcher) {
        for (let i = 0; i < 50 && !global.otcatSplash.readyFlag; i++) await sleep(100);
        ok(!global.otcatSplash.shown && BrowserWindow.getAllWindows().length === 1,
           "the launcher's loading window covers the start, so the app opens no second one");
        ok(!!global.otcatSplash.readyFlag && fs.existsSync(global.otcatSplash.readyFlag),
           "and the app tells it the tool is ready, so it closes", JSON.stringify(global.otcatSplash));
      } else {
        for (let i = 0; i < 50 && !global.otcatSplash.closed; i++) await sleep(100);
        ok(global.otcatSplash.shown, "a loading window shows while the app starts");
        ok(global.otcatSplash.closed && BrowserWindow.getAllWindows().length === 1,
           "and closes once the tool is ready, leaving only the tool's window",
           JSON.stringify(global.otcatSplash) + ", windows " + BrowserWindow.getAllWindows().length);
      }
      if (process.argv.includes("--startup-only")) return finish();
      await run(`window.confirm = function () { return true; }; window.alert = function () {};
        window.__violations = []; document.addEventListener("securitypolicyviolation", function (e) { window.__violations.push(e.violatedDirective + " " + e.blockedURI); }); 0`);

      const shell = await run(`({
        title: document.title,
        product: App.Version.product,
        version: App.Version.number,
        label: App.Version.label,
        badge: (document.getElementById("version-badge") || {}).textContent || "",
        legal: (document.querySelector(".sidebar-legal") || {}).textContent || "",
        logo: (document.querySelector(".brand-logo img") || {}).naturalWidth || 0,
        empty: !DocumentTool.state.doc && /Try the demo/.test(document.getElementById("main").textContent),
        docx: !!(window.docx && window.docx.Document),
        pickers: typeof window.showSaveFilePicker === "function" && typeof window.showOpenFilePicker === "function"
      })`);
      ok(shell.empty, "it opens on the start page, with no document");
      ok(shell.title === MODULE.product && shell.product === MODULE.product, "the window carries the app's title (" + shell.title + ")", shell.title + " / " + shell.product);
      ok(shell.logo > 0, "the header logo shows");
      ok(shell.version && shell.version === app.getVersion() && shell.badge === shell.label,
         "the exe and the tool agree on the version, and the tool shows it (" + shell.label + ")",
         "exe " + app.getVersion() + ", tool " + shell.version + ", badge " + shell.badge);
      ok(/SolutionsPT/.test(shell.legal), "the copyright notice is in the sidebar", shell.legal);
      ok(shell.docx, "the docx library is loaded");
      ok(shell.pickers, "the file pickers Save in place relies on are available");

      // Autosave keeps its copies in IndexedDB, which only a real window can
      // prove: the header says so when the store does not answer.
      let store = "unknown";
      for (let i = 0; i < 50 && store === "unknown"; i++) { store = await run("App.DocStorage.autosave.status()"); if (store === "unknown") await sleep(100); }
      const note = await run(`document.getElementById("autosave-note").textContent`);
      ok(store === "on" && note === "", "the autosave store (IndexedDB) answers here", store + " / " + note);

      const about = await run(`(function () {
        DocumentTool.go("about");
        var t = document.getElementById("main").textContent;
        return { licence: /Copyright and licence/.test(t) && /Proprietary and confidential/.test(t) && /SolutionsPT/.test(t), version: t.indexOf(App.Version.product + " " + App.Version.label) !== -1 };
      })()`);
      ok(about.licence, "the About page carries the copyright and licence notice");
      ok(about.version, "and names the version");

      // The tour's document, which the single-file build carries inline.
      const inline = await run("!!(window.SPT_DOCUMENT_DEMO && window.SPT_DOCUMENT_DEMO.schema === 'spt-document/1.0')");
      ok(inline, "the demo document is carried inside the package");
      await run("App.DocApp.openTour(); 0");
      for (let i = 0; i < 50 && !(await run("!!DocumentTool.state.doc")); i++) await sleep(100);
      await run(`DocumentTool.go("issue"); 0`);
      await sleep(1500);
      const demo = await run(`(function () {
        var T = DocumentTool, d = T.state.doc, pages = [], kinds = {};
        var todo = document.getElementById("dp-todo-list");
        var issues = todo ? todo.children.length : 0;
        ["info", "preview", "report", "edit"].forEach(function (p) {
          T.go(p);
          pages.push(document.getElementById(p === "edit" ? "paper" : "main").textContent.length);
        });
        App.DocModel.each(d, function (b) { kinds[b.type === "kept" ? "kept:" + b.kind : b.type] = true; });
        return { tour: T.state.tour, id: d.id, blocks: document.querySelectorAll("#paper > [data-block-id], #paper .paper > [data-block-id]").length || document.querySelectorAll("#paper [data-block-id]").length,
          expected: d.blocks.length, kinds: Object.keys(kinds).sort().join(","), pages: pages, issues: issues,
          outline: document.querySelectorAll("#outline [role=treeitem]").length, cards: document.querySelectorAll('#paper [data-type="kept"]').length };
      })()`);
      ok(demo.tour && demo.id === "doc-demo" && demo.blocks >= demo.expected && demo.expected > 15, "the demo opens in the editor with every block drawn (" + demo.blocks + ")", JSON.stringify(demo));
      ok(/heading/.test(demo.kinds) && /kept:smartart/.test(demo.kinds) && /list/.test(demo.kinds) && /pageBreak/.test(demo.kinds) && /picture/.test(demo.kinds) && /prompt/.test(demo.kinds) && /table/.test(demo.kinds),
         "it shows every block type, with a diagram kept from Word", demo.kinds);
      ok(demo.cards >= 1 && demo.outline >= 4, "the kept diagram has its card and the outline lists the headings", JSON.stringify(demo));
      ok(demo.pages && demo.pages.every((n) => n > 200), "every page renders", JSON.stringify(demo.pages));
      ok(demo.issues === 1, "the Issue check finds the one thing left to write", String(demo.issues));

      // Export Word, as the button does: a real file on disk.
      let from = downloads.length;
      const exported = await run(`App.DocExport.word("draft").then(function (r) {
        if (!r) return null;
        return App.ZipIO.read(r.blob).then(function (parts) {
          var body = App.ZipIO.text(parts.filter(function (p) { return p.name === "word/document.xml"; })[0]);
          var margins = body.match(/<w:pgMar\\b[^>]*>/) || [""];
          return { name: r.name, parts: parts.length, kept: parts.filter(function (p) { return /^word\\/kept\\//.test(p.name); }).length,
            theme: parts.some(function (p) { return p.name === "word/theme/theme1.xml"; }),
            cover: /w:top="0"/.test(margins[0]) && /w:right="0"/.test(margins[0]) && /NORTHFIELD WATER|Northfield Water/.test(body),
            control: /Document control and confidentiality/.test(body), diagram: /relIds/.test(body), tokens: /KEPT:/.test(body),
            version: body.indexOf(App.Version.number) !== -1 || body.indexOf(App.Version.product) !== -1 };
        });
      })`);
      const dl = await landed(from);
      ok(exported && dl && dl.state === "completed" && /-draft\.docx$/.test(dl.name) && dl.name === exported.name, "Export Word downloads a draft to disk (" + (dl && dl.name) + ")", dl && JSON.stringify({ n: dl.name, s: dl.state }));
      ok(dl && dl.bytes && dl.bytes.length > 50000 && dl.bytes[0] === 0x50 && dl.bytes[1] === 0x4B, "and it is a zip, as a Word file is", dl && dl.bytes ? dl.bytes.length + " bytes" : "no bytes");
      ok(exported && exported.cover && exported.control, "with the cover as its own section and the document control page", JSON.stringify(exported));
      ok(exported && exported.kept >= 5 && exported.theme && exported.diagram && !exported.tokens, "the kept diagram is in it, with its parts and the source theme", JSON.stringify(exported));
      ok(exported && !exported.version, "and neither the tool's name nor its version");
      const refused = await run(`DocumentTool.exportBlob("final").then(function () { return ""; }, function (e) { return e.message; })`);
      ok(/cannot be issued as final/.test(refused), "a Final is refused while something is still to write", refused);

      // The exported file read back in, as Load of a Word file does.
      const imported = await run(`DocumentTool.exportBlob("draft").then(function (blob) {
        return DocumentTool.load(new File([blob], "Self test.docx")).then(function (opened) {
          var d = DocumentTool.state.doc, kept = 0;
          App.DocModel.each(d, function (b) { if (b.type === "kept" && b.kind === "smartart") kept++; });
          return { opened: opened, page: DocumentTool.state.page, tour: DocumentTool.state.tour, dirty: DocumentTool.state.dirty, kept: kept,
            report: /Brought across/.test(document.getElementById("main").textContent), parts: Object.keys(d.parts).length };
        });
      })`);
      ok(imported.opened && imported.page === "report" && imported.report, "a Word file imports and the import report opens", JSON.stringify(imported));
      ok(imported.kept === 1 && imported.parts >= 6, "with its diagram kept, parts and all", JSON.stringify(imported));
      ok(!imported.tour && imported.dirty, "an import is unsaved work, not a tour");

      // A save with the dialog taken away: a real document file on disk.
      from = downloads.length;
      await run(`(function () { window.showSaveFilePicker = undefined; DocumentTool.state.doc.info.title = "Self test"; DocumentTool.save({ saveAs: true }); return 0; })()`);
      const sv = await landed(from);
      ok(sv && sv.state === "completed" && /\.json$/.test(sv.name), "a save with no dialog downloads the document file to disk (" + (sv && sv.name) + ")", sv && JSON.stringify({ n: sv.name, s: sv.state }));
      let file = null;
      try { file = JSON.parse(sv.bytes.toString("utf8")); } catch (e) {}
      ok(file && file.schema === "spt-document/1.0" && file.info.title === "Self test" && Object.keys(file.parts || {}).length >= 6 &&
         Object.keys(file.parts).every((k) => typeof file.parts[k].data === "string" && file.parts[k].data.length > 0),
         "and it is a document file holding the kept parts' bytes");
      for (let i = 0; i < 30 && (await run("DocumentTool.state.dirty")); i++) await sleep(100);
      ok(!(await run("DocumentTool.state.dirty")), "saving clears the unsaved mark");
      downloads.forEach((d) => { try { if (d.path) fs.unlinkSync(d.path); } catch (err) {} });

      const violations = await run("window.__violations.join(' | ')");
      ok(violations === "", "nothing broke the page's Content-Security-Policy", violations);

      // Type something, then close: the app's own warning must fire.
      const dirty = await run(`(function () {
        var T = DocumentTool, d = T.state.doc;
        T.go("edit");
        var p = d.blocks.filter(function (b) { return b.type === "paragraph"; })[0];
        App.DocEditor.focusBlock(p.id, { at: "end" });
        T.editor.type(" Typed by the self-test.");
        return T.state.dirty;
      })()`);
      ok(dirty, "typing marks the document as unsaved");
      let closed = false;
      win.once("closed", () => { closed = true; });
      win.close();
      for (let i = 0; i < 50 && !closed; i++) await sleep(100);
      ok(preventUnloadFired, "closing with unsaved work triggers the app's warning");
      ok(closed, "and the window can still close once that is answered");
      finish();
    } catch (e) {
      ok(false, "self-test threw: " + (e && e.message));
      finish(1);
    }
  });
};
