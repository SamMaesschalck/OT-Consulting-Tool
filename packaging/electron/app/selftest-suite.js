/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only. */
/* selftest-suite.js - run the packaged SolutionsPT OT Cyber Suite with
 * --self-test to check it end to end.
 *
 *   "SolutionsPT OT Cyber Suite.exe" --self-test --out=C:\path\result.txt
 *
 * main.js loads it for the manifest whose electron.selfTest is "suite"
 * (platform/suite.json, copied in as module.json).
 *
 * What is DIFFERENT about the suite inside Electron: that it starts on its
 * home page with every tool listed, that each tool opens in its frame (made
 * from the single file the suite carries) with its title and the exe's
 * version, that the file dialogs and storage work inside those frames, that
 * a Word and an Excel export from EACH tool really reach disk from inside its
 * frame, that switching keeps a tool's work, and that unsaved work in a frame
 * still brings up the unsaved-work warning (main.js answers will-prevent-unload)
 * without trapping the window: first from a tool's own warning in its frame,
 * then from the suite's.
 * Only loaded when the flag is given; the normal app never requires it.
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
  const until = async (js, ms) => {
    for (let i = 0; i < (ms || 30000) / 100; i++) {
      let v = null;
      try { v = await run(js); } catch (e) {}
      if (v) return v;
      await sleep(100);
    }
    return null;
  };
  // A tool's frame, as Electron sees it, to run code in it with a click's
  // worth of user activation (the browser lets only a page that has been
  // clicked raise the unsaved-work warning).
  const toolFrame = (key) => win.webContents.mainFrame.framesInSubtree.find((f) =>
    f.name && f.name.indexOf("spt-suite:") === 0 && f.name.indexOf('"frame":"' + key + '"') !== -1);
  const IN = (key, body) => "(function () { var w = Suite.Shell.frames['" + key + "'].el.contentWindow; " + body + " })()";

  // Downloads are saved to temp in self-test mode (see main.js); watch them land.
  const downloads = [];
  win.webContents.session.on("will-download", (e, item) => {
    const rec = { name: item.getFilename(), state: "pending", path: null, bytes: 0, zip: false };
    downloads.push(rec);
    item.once("done", (ev, state) => {
      rec.state = state; rec.path = item.getSavePath();
      try {
        rec.bytes = fs.statSync(rec.path).size;
        rec.zip = fs.readFileSync(rec.path).subarray(0, 2).toString("latin1") === "PK";   // .docx and .xlsx are zip files
      } catch (err) {}
    });
  });

  let preventUnloadFired = 0;
  win.webContents.on("will-prevent-unload", () => { preventUnloadFired++; });

  setTimeout(() => { ok(false, "self-test timed out"); finish(1); }, 300000);

  win.webContents.once("did-finish-load", async () => {
    try {
      const started = await until("!!(window.App && App.Version && window.Suite && Suite.Shell && Suite.Data)", 10000);
      ok(started, "the suite starts inside the package");
      if (!started) return finish(1);
      if (global.otcatSplash.launcher) {
        for (let i = 0; i < 50 && !global.otcatSplash.readyFlag; i++) await sleep(100);
        ok(!global.otcatSplash.shown && BrowserWindow.getAllWindows().length === 1,
           "the launcher's loading window covers the start, so the app opens no second one");
        ok(!!global.otcatSplash.readyFlag && fs.existsSync(global.otcatSplash.readyFlag),
           "and the app tells it the suite is ready, so it closes", JSON.stringify(global.otcatSplash));
      } else {
        for (let i = 0; i < 50 && !global.otcatSplash.closed; i++) await sleep(100);
        ok(global.otcatSplash.shown, "a loading window shows while the suite starts");
        ok(global.otcatSplash.closed && BrowserWindow.getAllWindows().length === 1,
           "and closes once the suite is ready, leaving only its window",
           JSON.stringify(global.otcatSplash) + ", windows " + BrowserWindow.getAllWindows().length);
      }
      if (process.argv.includes("--startup-only")) return finish();
      await run("window.confirm = function () { return true; }; window.alert = function () {}; 0");

      // The home page.
      const home = await run(`({
        title: document.title,
        product: Suite.Data.product,
        version: App.Version.number, label: App.Version.label,
        badge: (document.querySelector("#suite-name .version-badge") || {}).textContent || "",
        logo: (document.querySelector(".brand-logo img") || {}).naturalWidth || 0,
        cards: Array.prototype.map.call(document.querySelectorAll(".tool-card h2"), function (e) { return e.textContent; }),
        tours: document.querySelectorAll(".tool-card .tool-tour").length,
        bundled: Suite.Shell.bundled && Suite.Bundle.payloads.join(","),
        notes: (document.querySelector(".notes-card h2") || {}).textContent || "",
        recent: !!document.querySelector(".recent-card"),
        help: document.querySelectorAll(".help-tool").length
      })`);
      ok(home.title === MODULE.product && home.product === MODULE.product, "the window carries the suite's title (" + home.title + ")", home.title);
      ok(home.version === app.getVersion() && home.badge === home.label, "the exe and the suite agree on the version, and the home page shows it (" + home.label + ")",
         "exe " + app.getVersion() + ", suite " + home.version + ", badge " + home.badge);
      ok(home.logo > 0, "the header logo shows");
      ok(home.cards.join(" | ") === "OT Cyber Assessment Tool | OT Cyber Risk Assessment Tool | OT Cyber Report Review Tool | OT Cyber Document Tool" && home.tours === 4, "the home page has a card for each tool, with its tour", home.cards.join(" | "));
      ok(home.bundled === "assessments,assessments-tour,risk-assessment,report-review,documents", "the suite carries every tool and the assessment tour", String(home.bundled));
      ok(/^What's new in v/.test(home.notes) && home.recent && home.help === 4, "it shows What's new, Recent files and when to use each tool", home.notes);
      const licence = await run(`(function () {
        document.getElementById("btn-licence").click();
        var t = (document.querySelector(".licence-modal .licence-text") || {}).textContent || "";
        document.querySelector(".licence-modal").click();
        return { ok: /PROPRIETARY LICENCE/.test(t), closed: !document.querySelector(".licence-modal") };
      })()`);
      ok(licence.ok && licence.closed, "the licence opens in its pop-up and closes again");

      // The report review tool in its frame, with a real pack.
      await run(`Suite.Shell.open("report-review"); 0`);
      const reviewUp = await until(IN("report-review", "return !!(w.ReviewTool && w.App.ReviewChecks && Suite.Shell.frames['report-review'].ready);"), 60000);
      ok(reviewUp, "the report review tool starts in its frame");
      const review = await run(IN("report-review", `w.confirm = function () { return true; }; w.alert = function () {};
        w.ReviewTool.openDemo();
        var R = w.ReviewTool, b = R.state.pack.documents[0].blocks.filter(function (x) { return x.type === "paragraph" && !x.front && x.text.length > 40; })[0];
        R.state.review.reviewer = "Self Test";
        R.addComment({ severity: "must-fix", anchor: { documentIndex: 0, kind: "block", sectionKey: b.sectionKey, sectionTitle: b.sectionTitle, blockId: b.id, quote: b.text, cell: null }, text: "Self-test comment." });
        R.state.dirty = false; R.render();
        return { title: w.document.title, hosted: w.App.HostBridge.hosted, version: w.App.Version.label, blocks: w.document.querySelectorAll("#rr-paper [data-block-id]").length, comments: R.state.review.comments.length, srcdoc: Suite.Shell.frames["report-review"].el.hasAttribute("srcdoc") };`));
      ok(review.title === "OT Cyber Report Review Tool" && review.hosted && review.srcdoc && review.version === home.label && review.blocks > 50 && review.comments === 1, "it opens a pack, draws the report and takes a comment inside the suite", JSON.stringify(review));

      // The document tool in its frame. That it starts here is the suite's
      // to prove; what it does is selftest-documents.js.
      await run(`Suite.Shell.open("documents"); 0`);
      const docsUp = await until(IN("documents", "return !!(w.App && w.App.Product && w.App.DocApp && w.DocumentTool && Suite.Shell.frames['documents'].ready);"), 60000);
      ok(docsUp, "the document tool starts in its frame");
      const docs = await run(IN("documents", `w.confirm = function () { return true; }; w.alert = function () {};
        var f = Suite.Shell.frames["documents"];
        return { title: w.document.title, product: f.product, version: w.App.Version.number, label: f.version, hosted: w.App.HostBridge.hosted, srcdoc: f.el.hasAttribute("srcdoc"),
          docx: !!w.docx, bar: (document.querySelector("#suite-bar [aria-current='page']") || { getAttribute: function () { return ""; } }).getAttribute("aria-label") || "" };`));
      ok(docs.title === "OT Cyber Document Tool" && docs.product === docs.title && docs.version === app.getVersion() && docs.label === home.label && docs.hosted && docs.srcdoc && docs.docx,
         "with its own title and the exe's version, knowing it is in the suite (" + docs.title + " " + docs.label + ")", JSON.stringify(docs));
      ok(/^Write, OT Cyber Document Tool/.test(docs.bar), "the rail marks it as the tool on show", docs.bar);

      // Each tool in its frame.
      await run(`Suite.Shell.open("risk-assessment"); 0`);
      const riskUp = await until(IN("risk-assessment", "return !!(w.RiskTool && w.RiskExports && w.docx && w.ExcelJS && Suite.Shell.frames['risk-assessment'].ready);"), 60000);
      ok(riskUp, "the risk tool opens in its frame");
      const risk = await run(IN("risk-assessment", `w.confirm = function () { return true; }; w.alert = function () {};
        return { title: w.document.title, version: w.App.Version.number, label: w.App.Version.label,
          badge: (w.document.getElementById("stage-badge") || {}).textContent || "",
          srcdoc: Suite.Shell.frames["risk-assessment"].el.hasAttribute("srcdoc"),
          pickers: w.RiskTool.supportsFilePickers(),
          storage: (function () { try { w.localStorage.setItem("otcat:selftest", "1"); var v = w.localStorage.getItem("otcat:selftest"); w.localStorage.removeItem("otcat:selftest"); return v === "1"; } catch (e) { return false; } })(),
          bar: (document.querySelector("#suite-bar [aria-current='page']") || { getAttribute: function () { return ""; } }).getAttribute("aria-label") || "", tabs: document.querySelectorAll("#suite-bar .bar-tab").length };`));
      ok(risk.title === "OT Cyber Risk Assessment Tool" && risk.version === app.getVersion() && risk.badge === risk.label + ", 62443-3-2-aligned",
         "with its own title and the exe's version (" + risk.title + " " + risk.label + ")", JSON.stringify(risk));
      ok(risk.srcdoc && risk.pickers && risk.storage, "the frame is the suite's own origin: the file dialogs and storage work in it", JSON.stringify(risk));
      ok(/OT Cyber Risk Assessment Tool/.test(risk.bar) && risk.tabs === 4, "the rail marks the tool on show, with a button for every tool", risk.bar);

      await run(`Suite.Shell.open("assessments"); 0`);
      const asUp = await until(IN("assessments", "return !!(w.App && w.App.UI && w.App.Engine && w.App.Engine.state.instruments && Suite.Shell.frames['assessments'].ready);"), 60000);
      ok(asUp, "the assessment tool opens in its frame");
      const as = await run(IN("assessments", `w.confirm = function () { return true; }; w.alert = function () {};
        return { title: w.document.title, version: w.App.Version.number, home: /Start an assessment/.test(w.document.getElementById("main").textContent),
                 pickers: w.App.Storage.supportsFilePickers() };`));
      ok(as.title === "OT Cyber Assessment Tool" && as.version === app.getVersion() && as.home && as.pickers,
         "with its own title and the exe's version, on its assessment picker", JSON.stringify(as));

      // Exports from inside each frame, through each tool's own download path.
      await run(IN("risk-assessment", `w.RiskTool.loadProjectText(JSON.stringify(w.SPT_TOUR_PROJECT));
        w.RiskExports.downloadWord({}, function () {}); w.RiskExports.downloadExcel(function () {}); return 0;`));
      await run(IN("assessments", `var A = w.App, E = A.Engine; E.activateInstrument("iec-62443-3-3");
        A.ExportXLSX.download(E.state.engagement, E.state.instrument, E.state.taxonomy, E.state.profile, { targetId: E.state.activeTargetId });
        A.ExportDOCX.download(E.state.engagement, E.state.instrument, E.state.taxonomy, E.state.profile,
          E.getActiveNarrative ? E.getActiveNarrative() : null, { targetId: E.state.activeTargetId });
        return 0;`));
      for (let i = 0; i < 400 && downloads.filter((d) => d.state !== "pending").length < 4; i++) await sleep(100);
      const done = downloads.filter((d) => d.state === "completed" && d.zip);
      const riskWord = done.find((d) => /\.docx$/i.test(d.name) && /risk/i.test(d.name));
      const riskXl = done.find((d) => /\.xlsx$/i.test(d.name) && /risk/i.test(d.name));
      const asWord = done.find((d) => /\.docx$/i.test(d.name) && d !== riskWord);
      const asXl = done.find((d) => /\.xlsx$/i.test(d.name) && d !== riskXl);
      ok(riskWord && riskWord.bytes > 5000 && riskXl && riskXl.bytes > 8000, "the risk tool's Word and Excel exports reach disk from inside the suite",
         JSON.stringify(downloads));
      ok(asWord && asWord.bytes > 2000 && asXl && asXl.bytes > 2000, "the assessment tool's Word and Excel exports reach disk from inside the suite",
         JSON.stringify(downloads));
      downloads.forEach((d) => { try { if (d.path) fs.unlinkSync(d.path); } catch (err) {} });

      // Switching keeps work.
      const kept = await run(`(function () {
        var rw = Suite.Shell.frames["risk-assessment"].el.contentWindow;
        rw.RiskTool.state.project.suc.name = "Self-test unit";
        Suite.Shell.open("risk-assessment"); Suite.Shell.home(); Suite.Shell.open("assessments"); Suite.Shell.open("risk-assessment");
        return Suite.Shell.frames["risk-assessment"].el.contentWindow === rw && rw.RiskTool.state.project.suc.name === "Self-test unit";
      })()`);
      ok(kept, "switching between the tools and the home page keeps each tool's work");

      // Unsaved work, 1: a tool's own warning, from inside its frame. The
      // suite's guard is set aside, the risk tool is edited from a click in
      // its frame, and the suite is reloaded.
      await run(`Suite.__noOwnGuard = true; 0`);
      const rf = toolFrame("risk-assessment");
      ok(!!rf, "Electron sees the risk tool's frame");
      const dirty1 = rf ? await rf.executeJavaScript("RiskTool.state.project.suc.description += ' (self-test)'; RiskTool.touched(); RiskTool.isDirty()", true) : false;
      ok(dirty1, "editing in the risk tool marks it unsaved");
      const shown = await until(`(function () {
        var b = document.querySelector('#suite-bar .bar-tab[data-key="risk-assessment"]');
        return !!b && !!b.querySelector(".dot.dirty") && /unsaved changes/.test(b.getAttribute("aria-label"));
      })()`, 5000);
      ok(shown, "and the rail marks it, in its marker and its name");
      preventUnloadFired = 0;
      const reloaded = new Promise((r) => win.webContents.once("did-finish-load", r));
      win.webContents.reload();
      await Promise.race([reloaded, sleep(20000)]);
      ok(preventUnloadFired > 0, "reloading with unsaved work in a tool's frame raises the unsaved-work warning (the tool's own, in its frame)");
      const back = await until("!!(window.Suite && Suite.Shell && Suite.Shell.current() === null)", 15000);
      ok(back, "and once answered the suite reloads, on its home page");

      // Unsaved work, 2: the suite's own warning, then close.
      await run("window.confirm = function () { return true; }; Suite.Shell.open('assessments'); 0");
      await until(IN("assessments", "return !!(Suite.Shell.frames['assessments'].ready && w.App.Engine);"), 60000);
      await run(IN("assessments", `w.confirm = function () { return true; }; var E = w.App.Engine; E.activateInstrument("iec-62443-3-3");
        E.updateMetadata({ clientName: "Self-test Ltd" }); return 0;`));
      const dirty2 = await until("Suite.Shell.frames['assessments'].dirty", 5000);
      ok(dirty2, "editing in the assessment tool marks it unsaved in the suite");
      preventUnloadFired = 0;
      let closed = false;
      win.once("closed", () => { closed = true; });
      win.close();
      for (let i = 0; i < 80 && !closed; i++) await sleep(100);
      ok(preventUnloadFired > 0, "closing the suite with unsaved work raises the warning");
      ok(closed, "and the window can still close once that is answered");
      finish();
    } catch (e) {
      ok(false, "self-test threw: " + (e && e.message));
      finish(1);
    }
  });
};
