/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only. */
/* selftest-risk-assessment.js - run the packaged risk assessment tool with
 * --self-test to check it end to end.
 *
 *   "OT Cyber Risk Assessment Tool.exe" --self-test --out=C:\path\result.txt
 *
 * main.js loads it for the module whose module.json says
 * electron.selfTest "risk-assessment"; selftest-assessments.js is the
 * assessment tool's.
 *
 * Everything here is what is DIFFERENT about running inside Electron rather
 * than Edge: that the app starts from inside the package with its title,
 * logo, version and licence notice, that the demo project (carried inline in
 * the single-file build) loads and renders, that a Word and an Excel download
 * really reach disk, that localStorage and the file pickers exist, and that
 * the unsaved-work guard lets the window close instead of trapping it.
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

  let preventUnloadFired = false;
  win.webContents.on("will-prevent-unload", () => { preventUnloadFired = true; });

  setTimeout(() => { ok(false, "self-test timed out"); finish(1); }, 240000);

  win.webContents.once("did-finish-load", async () => {
    try {
      // Wait for the app to start.
      let started = false;
      for (let i = 0; i < 100 && !started; i++) {
        started = await run("!!(window.App && App.Version && window.RiskTool && window.RiskExports && window.docx && window.ExcelJS)");
        if (!started) await sleep(100);
      }
      ok(started, "the app starts inside the package, with its Word and Excel libraries");
      if (!started) return finish(1);
      // The loading window: shown while starting, gone once the tool is up.
      if (global.otcatSplash.launcher) {
        // The portable exe: the launcher's OtcatSplash covers the whole start,
        // so the app opens none of its own and tells it when to close.
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
      // --startup-only: stop as soon as the tool is up, for timing how long a
      // launch takes (build-portable-exe.ps1 -TimeStartup).
      if (process.argv.includes("--startup-only")) return finish();
      await run("window.confirm = function () { return true; }; window.alert = function () {}; 0");

      const shell = await run(`({
        title: document.title,
        product: App.Version.product,
        version: App.Version.number,
        label: App.Version.label,
        badge: (document.getElementById("stage-badge") || {}).textContent || "",
        legal: (document.querySelector(".sidebar-legal") || {}).textContent || "",
        logo: (document.querySelector(".brand-logo img") || {}).naturalWidth || 0,
        empty: !RiskTool.state.project.suc.name && RiskTool.state.project.zones.length === 0,
        pickers: typeof window.showSaveFilePicker === "function" && typeof window.showOpenFilePicker === "function",
        storage: (function () { try { localStorage.setItem("otcat:selftest", "1"); var v = localStorage.getItem("otcat:selftest"); localStorage.removeItem("otcat:selftest"); return v === "1"; } catch (e) { return false; } })()
      })`);
      ok(shell.empty, "it opens on an empty risk assessment");
      ok(shell.title === MODULE.product && shell.product === MODULE.product, "the window carries the app's title (" + shell.title + ")", shell.title + " / " + shell.product);
      ok(shell.logo > 0, "the header logo shows");
      ok(shell.version && shell.version === app.getVersion() && shell.badge === shell.label + ", 62443-3-2-aligned",
         "the exe and the tool agree on the version, and the tool shows it (" + shell.label + ")",
         "exe " + app.getVersion() + ", tool " + shell.version + ", badge " + shell.badge);
      ok(/SolutionsPT/.test(shell.legal), "the copyright notice is in the sidebar", shell.legal);
      ok(shell.storage, "localStorage works, so autosave can");
      ok(shell.pickers, "the file pickers Save in place relies on are available");

      // The licence notice, on the About page.
      const about = await run(`(function () {
        var item = document.querySelector('#sidebar .nav-item[data-stage="about"]');
        if (!item) return { found: false };
        item.click();
        var t = document.getElementById("main").textContent;
        return { found: true, licence: /Copyright and licence/.test(t) && /Proprietary and confidential/.test(t) && /SolutionsPT/.test(t),
                 version: t.indexOf(App.Version.product + " (zones & conduits) " + App.Version.label) !== -1 };
      })()`);
      ok(about.found && about.licence, "the About page carries the copyright and licence notice");
      ok(about.version, "and names the version");

      // The demo project, which the single-file build carries inline, loads
      // through the app's own load path and renders on every page.
      const demo = await run(`(function () {
        if (!window.SPT_TOUR_PROJECT) return { inline: false };
        var loaded = RiskTool.loadProjectText(JSON.stringify(window.SPT_TOUR_PROJECT));
        var p = RiskTool.state.project, threats = 0;
        p.zones.concat(p.conduits).forEach(function (o) { threats += o.threats.length; });
        var pages = [];
        var n = document.querySelectorAll("#sidebar .nav-item").length;
        for (var i = 0; i < n; i++) {
          document.querySelectorAll("#sidebar .nav-item")[i].click();
          pages.push(document.getElementById("main").textContent.length);
        }
        var review = document.querySelector('#sidebar .nav-item[data-stage="review"]');   // Check and issue
        if (review) review.click();
        return { inline: true, loaded: loaded !== false, name: p.suc.name, zones: p.zones.length, conduits: p.conduits.length, threats: threats,
                 pages: pages, shows: document.getElementById("main").textContent.indexOf("Acme Petrochemicals") !== -1,
                 problems: RiskTool.exportProblems(p).length };
      })()`);
      ok(demo.inline, "the demo project is carried inside the package");
      ok(demo.loaded && /^Acme Petrochemicals/.test(demo.name || "") && demo.zones === 4 && demo.conduits === 3 && demo.threats === 9,
         "it loads: 4 zones, 3 conduits, 9 threats", JSON.stringify(demo));
      ok(demo.pages && demo.pages.length >= 8 && demo.pages.every((n) => n > 150), "every page renders (" + (demo.pages || []).length + " pages)", JSON.stringify(demo.pages));
      ok(demo.shows && demo.problems === 0, "the Check and issue page shows it, complete enough to export", JSON.stringify(demo));

      // Real downloads through the app's own export path, onto disk.
      await run(`(function () {
        RiskExports.downloadWord({}, function () {});
        RiskExports.downloadExcel(function () {});
        return 0;
      })()`);
      for (let i = 0; i < 300 && !(downloads.filter((d) => d.state !== "pending").length >= 2); i++) await sleep(100);
      const xl = downloads.find((d) => /\.xlsx$/i.test(d.name));
      const wd = downloads.find((d) => /\.docx$/i.test(d.name));
      ok(xl && xl.state === "completed" && xl.bytes > 8000 && xl.zip, "an Excel export downloads to disk", xl && JSON.stringify(xl));
      ok(wd && wd.state === "completed" && wd.bytes > 5000 && wd.zip, "a Word export downloads to disk", wd && JSON.stringify(wd));
      downloads.forEach((d) => { try { if (d.path) fs.unlinkSync(d.path); } catch (err) {} });

      // Unsaved work, then close: the app's guard must fire, and the window
      // must still be able to close (Electron alone would trap it open).
      const dirty = await run(`(function () {
        RiskTool.state.project.suc.description += " (edited by the self-test)";
        RiskTool.touched();
        return RiskTool.isDirty() && RiskTool.projectHasContent(RiskTool.state.project);
      })()`);
      ok(dirty, "editing marks the project as unsaved");
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
