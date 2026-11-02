/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only. */
/* selftest.js - run the packaged app with --self-test to check it end to end.
 *
 *   "OT Cyber Assessment Tool.exe" --self-test --out=C:\path\result.txt
 *
 * Everything here is what is DIFFERENT about running inside Electron rather
 * than Edge: that the app starts from inside the package, that every
 * instrument scores and exports, that a Word and an Excel download really
 * reach disk, that localStorage and the file pickers exist, and that the
 * unsaved-work guard lets the window close instead of trapping it.
 * Only loaded when the flag is given; the normal app never requires it.
 */
"use strict";
const { app, BrowserWindow } = require("electron");
const fs = require("fs");

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
    const rec = { name: item.getFilename(), state: "pending", path: null, bytes: 0 };
    downloads.push(rec);
    item.once("done", (ev, state) => {
      rec.state = state; rec.path = item.getSavePath();
      try { rec.bytes = fs.statSync(rec.path).size; } catch (err) {}
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
        started = await run("!!(window.App && App.UI && App.Engine && App.Engine.state && App.Engine.state.instruments)");
        if (!started) await sleep(100);
      }
      ok(started, "the app starts inside the package");
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
        failed: /Failed to start/.test(document.getElementById("main").textContent),
        home: /Start an assessment/.test(document.getElementById("main").textContent),
        title: document.title,
        version: (window.App.Version && App.Version.number) || "",
        badge: (document.querySelector(".version-badge") || {}).textContent || "",
        label: (window.App.Version && App.Version.label) || "",
        legal: !!document.querySelector(".sidebar-legal"),
        logo: (document.querySelector(".brand-logo img") || {}).naturalWidth || 0,
        pickers: typeof window.showSaveFilePicker === "function" && typeof window.showOpenFilePicker === "function",
        storage: (function () { try { localStorage.setItem("otcat:selftest", "1"); var v = localStorage.getItem("otcat:selftest"); localStorage.removeItem("otcat:selftest"); return v === "1"; } catch (e) { return false; } })()
      })`);
      ok(!shell.failed && shell.home, "it opens on the assessment picker");
      ok(shell.title === "OT Cyber Assessment Tool", "the window carries the app's title", shell.title);
      ok(shell.logo > 0, "the header logo shows");
      ok(shell.version && shell.version === app.getVersion() && shell.badge === shell.label,
         "the exe and the tool agree on the version, and the tool shows it (" + shell.label + ")",
         "exe " + app.getVersion() + ", tool " + shell.version + ", badge " + shell.badge);
      ok(shell.legal, "the copyright notice is in the sidebar");
      ok(shell.storage, "localStorage works, so autosave can");
      ok(shell.pickers, "the file pickers Save in place relies on are available");

      const licence = await run(`(function () {
        App.UI.openLicence();
        var t = (document.querySelector(".licence-modal .licence-text") || {}).textContent || "";
        document.querySelector(".licence-modal").click();
        return { ok: /PROPRIETARY LICENCE/.test(t), closed: !document.querySelector(".licence-modal") };
      })()`);
      ok(licence.ok && licence.closed, "the licence opens in its pop-up and closes again");

      // Every instrument: activate, score, report, Excel and Word.
      const results = await run(`(async function () {
        var A = App, E = A.Engine, out = [];
        var list = E.state.instruments.filter(function (i) { return i.status !== "placeholder"; });
        for (var k = 0; k < list.length; k++) {
          var id = list[k].id, r = { id: id };
          try {
            E.activateInstrument(id);
            var inst = E.state.instrument;
            var opts = {
              cafProfileRegistry: E.getCAFProfileRegistry ? E.getCAFProfileRegistry() : null,
              cafProfileId: E.getActiveCAFProfileId ? E.getActiveCAFProfileId() : null,
              cafProfile: E.getActiveCAFProfile ? E.getActiveCAFProfile() : null,
              cafOverlay: E.getActiveCAFOverlay ? E.getActiveCAFOverlay() : null,
              targetId: E.state.activeTargetId
            };
            A.UI.go("report");
            r.report = document.getElementById("main").textContent.length;
            r.sheets = A.ExportXLSX.build(E.state.engagement, inst, E.state.taxonomy, E.state.profile, opts).SheetNames.length;
            r.docx = await new Promise(function (res) {
              A.ExportDOCX.buildAsync(E.state.engagement, inst, E.state.taxonomy, E.state.profile,
                E.getActiveNarrative ? E.getActiveNarrative() : null, opts,
                function (err, blob) { res(err ? ("ERROR " + err.message) : (blob ? blob.size : 0)); });
            });
          } catch (e) { r.error = e.message; }
          out.push(r);
        }
        return out;
      })()`);
      ok(results.length >= 15, "every instrument is present (" + results.length + ")");
      results.forEach((r) => {
        ok(!r.error && r.report > 500 && r.sheets > 0 && typeof r.docx === "number" && r.docx > 2000,
           r.id + ": scores, reports and builds Word and Excel",
           r.error || ("report " + r.report + ", sheets " + r.sheets + ", docx " + r.docx));
      });

      // Real downloads through the app's own export path, onto disk.
      await run(`(function () {
        var E = App.Engine; E.activateInstrument("iec-62443-3-3");
        App.ExportXLSX.download(E.state.engagement, E.state.instrument, E.state.taxonomy, E.state.profile, { targetId: E.state.activeTargetId });
        App.ExportDOCX.download(E.state.engagement, E.state.instrument, E.state.taxonomy, E.state.profile,
          E.getActiveNarrative ? E.getActiveNarrative() : null, { targetId: E.state.activeTargetId });
        return 0;
      })()`);
      for (let i = 0; i < 300 && !(downloads.filter((d) => d.state !== "pending").length >= 2); i++) await sleep(100);
      const xl = downloads.find((d) => /\.xlsx$/i.test(d.name));
      const wd = downloads.find((d) => /\.docx$/i.test(d.name));
      ok(xl && xl.state === "completed" && xl.bytes > 2000, "an Excel export downloads to disk", xl && JSON.stringify(xl));
      ok(wd && wd.state === "completed" && wd.bytes > 2000, "a Word export downloads to disk", wd && JSON.stringify(wd));
      downloads.forEach((d) => { try { if (d.path) fs.unlinkSync(d.path); } catch (err) {} });

      // Unsaved work, then close: the app's guard must fire, and the window
      // must still be able to close (Electron alone would trap it open).
      const dirty = await run(`(function () {
        var E = App.Engine; E.activateInstrument("iec-62443-3-3");
        E.updateMetadata({ clientName: "Self-test Ltd" });
        return App.UI.__autosave.isDirty();
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
