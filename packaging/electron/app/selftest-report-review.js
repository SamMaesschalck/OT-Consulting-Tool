/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only. */
/* selftest-report-review.js - run the packaged report review tool with
 * --self-test to check it end to end.
 *
 *   "OT Cyber Report Review Tool.exe" --self-test --out=C:\path\result.txt
 *
 * main.js loads it for the module whose module.json says electron.selfTest
 * "report-review".
 *
 * Everything here is what is DIFFERENT about running inside Electron rather than
 * Edge: that the app starts from inside the package with its title, logo, version
 * and licence notice, that the demo pack (carried inline in the single-file build)
 * loads and renders, that a review file really reaches disk, that localStorage and
 * the file pickers exist, and that the unsaved-work guard lets the window close
 * instead of trapping it. Only loaded when the flag is given.
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
    const rec = { name: item.getFilename(), state: "pending", path: null, text: "" };
    downloads.push(rec);
    item.once("done", (ev, state) => {
      rec.state = state; rec.path = item.getSavePath();
      try { rec.text = fs.readFileSync(rec.path, "utf8"); } catch (err) {}
    });
  });

  let preventUnloadFired = false;
  win.webContents.on("will-prevent-unload", () => { preventUnloadFired = true; });

  setTimeout(() => { ok(false, "self-test timed out"); finish(1); }, 240000);

  win.webContents.once("did-finish-load", async () => {
    try {
      let started = false;
      for (let i = 0; i < 100 && !started; i++) {
        started = await run("!!(window.App && App.Version && App.ReviewCore && App.ReviewChecks && window.ReviewTool)");
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
      await run("window.confirm = function () { return true; }; window.alert = function () {}; 0");

      const shell = await run(`({
        title: document.title,
        product: App.Version.product,
        version: App.Version.number,
        label: App.Version.label,
        badge: (document.getElementById("version-badge") || {}).textContent || "",
        legal: (document.querySelector(".sidebar-legal") || {}).textContent || "",
        logo: (document.querySelector(".brand-logo img") || {}).naturalWidth || 0,
        empty: !ReviewTool.state.pack && /Open a review pack/.test(document.getElementById("main").textContent),
        pickers: typeof window.showSaveFilePicker === "function" && typeof window.showOpenFilePicker === "function",
        storage: (function () { try { localStorage.setItem("spt-review:selftest", "1"); var v = localStorage.getItem("spt-review:selftest"); localStorage.removeItem("spt-review:selftest"); return v === "1"; } catch (e) { return false; } })()
      })`);
      ok(shell.empty, "it opens on the welcome page, with no pack");
      ok(shell.title === MODULE.product && shell.product === MODULE.product, "the window carries the app's title (" + shell.title + ")", shell.title + " / " + shell.product);
      ok(shell.logo > 0, "the header logo shows");
      ok(shell.version && shell.version === app.getVersion() && shell.badge === shell.label,
         "the exe and the tool agree on the version, and the tool shows it (" + shell.label + ")",
         "exe " + app.getVersion() + ", tool " + shell.version + ", badge " + shell.badge);
      ok(/SolutionsPT/.test(shell.legal), "the copyright notice is in the sidebar", shell.legal);
      ok(shell.storage, "localStorage works, so autosave can");
      ok(shell.pickers, "the file pickers Save in place relies on are available");

      const about = await run(`(function () {
        document.querySelector('.nav-item[data-page="about"]').click();
        var t = document.getElementById("main").textContent;
        return { licence: /Copyright and licence/.test(t) && /Proprietary and confidential/.test(t) && /SolutionsPT/.test(t), version: t.indexOf(App.Version.product + " " + App.Version.label) !== -1 };
      })()`);
      ok(about.licence, "the About page carries the copyright and licence notice");
      ok(about.version, "and names the version");

      // The demo pack, which the single-file build carries inline.
      const demo = await run(`(function () {
        if (!window.SPT_REVIEW_DEMO_PACK) return { inline: false };
        ReviewTool.openDemo();
        var p = ReviewTool.state.pack, pages = [];
        ["engagement", "checklist", "checks", "previous", "summary", "report"].forEach(function (id) {
          document.querySelector('.nav-item[data-page="' + id + '"]').click();
          pages.push(document.getElementById("main").textContent.length);
        });
        return { inline: true, round: p && p.round, docs: p && p.documents.length, blocks: document.querySelectorAll("#rr-paper [data-block-id]").length,
                 expected: p && p.documents[0].blocks.length, images: document.querySelectorAll("#rr-paper img").length, pages: pages,
                 checks: ReviewTool.activeChecks().length };
      })()`);
      ok(demo.inline, "the demo pack is carried inside the package");
      ok(demo.round === 2 && demo.docs >= 1 && demo.blocks === demo.expected && demo.blocks > 50, "it opens and draws every block (" + demo.blocks + ")", JSON.stringify(demo));
      ok(demo.images > 0, "with its charts");
      ok(demo.pages && demo.pages.every((n) => n > 200), "every page renders", JSON.stringify(demo.pages));
      ok(demo.checks > 0, "and the automatic checks run on it");

      // A comment, then a save with the dialog taken away: a real file on disk.
      const dirty = await run(`(function () {
        var s = ReviewTool.state, b = s.pack.documents[0].blocks.filter(function (x) { return x.type === "paragraph" && !x.front && x.text.length > 40; })[0];
        s.review.reviewer = "Self Test";
        ReviewTool.addComment({ severity: "must-fix", anchor: { documentIndex: 0, kind: "block", sectionKey: b.sectionKey, sectionTitle: b.sectionTitle, blockId: b.id, quote: b.text, cell: null }, text: "Self-test comment." });
        return ReviewTool.isDirty();
      })()`);
      ok(dirty, "adding a comment marks the review as unsaved");
      await run(`(function () { window.__saveResult = null; window.showSaveFilePicker = undefined; ReviewTool.saveReview(null, function (r) { window.__saveResult = r; }); return 0; })()`);
      for (let i = 0; i < 100 && !(downloads.length && downloads[0].state !== "pending"); i++) await sleep(100);
      const dl = downloads[0];
      ok(dl && dl.state === "completed" && /-review-round-2-self-test\.json$/.test(dl.name), "a save with no dialog downloads the review file to disk", dl && JSON.stringify({ n: dl.name, s: dl.state }));
      let file = null;
      try { file = JSON.parse(dl.text); } catch (e) {}
      ok(file && file.schema === "spt-review/1.0" && file.comments.length === 1 && file.comments[0].text === "Self-test comment.", "and it is a review file holding the comment");
      downloads.forEach((d) => { try { if (d.path) fs.unlinkSync(d.path); } catch (err) {} });
      const clean = await run("ReviewTool.isDirty()");
      ok(!clean, "saving clears the unsaved mark");

      await run(`(function () { ReviewTool.addComment({ severity: "suggestion", anchor: ReviewTool.state.review.comments[0].anchor, text: "Unsaved." }); return 0; })()`);
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
