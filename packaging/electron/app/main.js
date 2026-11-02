/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only. */
/* main.js - Electron shell for one module of the OT Cyber suite (the OT Cyber
 * Assessment Tool or the OT Cyber Risk Assessment Tool; test build), or for
 * the SolutionsPT OT Cyber Suite itself, whose page holds each tool in a
 * frame (its manifest, platform/suite.json, is copied in as module.json).
 *
 * The app itself is the module's single-file build (index.html beside this
 * file), run unchanged. Which module it is comes from module.json beside this
 * file, the module's manifest copied in by the build: its product name titles
 * the windows, and its electron.selfTest picks the self-test
 * (selftest-<kind>.js). Each module is packaged with its own appId and product
 * name, so each exe keeps its own local storage (autosave) and can run
 * alongside the other. This shell only does what a browser tab did for it for
 * free:
 *
 *   - one window, no browser chrome, no menu bar
 *   - the unsaved-work warning: Chromium shows a "Leave site?" box when a page
 *     cancels unload, but Electron shows NOTHING and silently keeps the window
 *     open, so the app's guard would make the window impossible to close.
 *     We ask the question ourselves and close if the answer is yes.
 *   - Word/Excel downloads get a proper Save As dialog, starting in Documents
 *   - links to websites open in the user's browser, never inside the app
 *   - only one copy runs at a time (both would share one autosave store)
 *
 * Nothing from Node is exposed to the page: no preload, sandboxed renderer,
 * context isolation on.
 */
"use strict";
const { app, BrowserWindow, Menu, dialog, shell, session, screen } = require("electron");
const path = require("path");

const SELF_TEST = process.argv.includes("--self-test");
const INDEX = path.join(__dirname, "index.html");
const MODULE = require("./module.json");
const PRODUCT = MODULE.product;

// The self-test runs in a profile of its own, so the demo data and unsaved
// edits it makes never reach the user's autosave.
if (SELF_TEST) app.setPath("userData", path.join(app.getPath("temp"), "otcat-selftest-" + MODULE.id));

if (!SELF_TEST && !app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let win = null;

  app.on("second-instance", () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });

  // Recorded for the self-test: was the loading window shown, and is it gone
  // once the tool is up.
  // In the portable exe the launcher's own loading window (OtcatSplash) is up
  // from the double-click and stays until the tool is ready, so the app shows
  // none of its own; see build-portable-exe.ps1.
  const LAUNCHER_SPLASH = process.env.OTCAT_LAUNCHER_SPLASH === "1";
  global.otcatSplash = { shown: false, closed: false, launcher: LAUNCHER_SPLASH, readyFlag: null };

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);

    // Otherwise, a loading window, up as soon as Electron is, until the tool
    // has drawn itself. The 8 MB page takes a moment to parse, and on a first
    // start antivirus is still checking files, so without this the user sees
    // nothing at all and double-clicks again.
    const parts = app.getVersion().split(".");
    const label = "v" + (parts[2] === "0" ? parts[0] + "." + parts[1] : app.getVersion());
    let splash = null;
    if (!LAUNCHER_SPLASH) {
      const scr = screen.getPrimaryDisplay().bounds;
      splash = new BrowserWindow({
        width: 520, height: 300, frame: false, resizable: false, movable: true,
        x: Math.round(scr.x + (scr.width - 520) / 2), y: Math.round(scr.y + (scr.height - 300) / 2),
        show: false, skipTaskbar: false, backgroundColor: "#ffffff",
        title: PRODUCT,
        webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false }
      });
      splash.once("ready-to-show", () => { if (splash) { splash.show(); global.otcatSplash.shown = true; } });
      splash.on("closed", () => { splash = null; global.otcatSplash.closed = true; });
      splash.loadFile(path.join(__dirname, "splash.html"), { query: { v: label, p: PRODUCT } });
    }
    const closeSplash = () => { if (splash && !splash.isDestroyed()) splash.destroy(); };

    // Tells the launcher's loading window the tool is ready, so it closes.
    const toolReady = () => {
      if (!LAUNCHER_SPLASH) return;
      const flag = path.join(path.dirname(process.execPath), ".tool-ready");
      try { require("fs").writeFileSync(flag, "1"); global.otcatSplash.readyFlag = flag; } catch (e) {}
    };

    win = new BrowserWindow({
      width: 1440, height: 900, minWidth: 1024, minHeight: 640,
      show: false,
      title: PRODUCT,
      backgroundColor: "#ffffff",
      webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: true }
    });

    win.once("ready-to-show", () => {
      if (!SELF_TEST) { win.maximize(); win.show(); }
      closeSplash();
      toolReady();
    });
    // Never leave a loading window up over a failure.
    win.webContents.once("did-fail-load", () => { closeSplash(); toolReady(); });
    win.on("closed", () => { closeSplash(); toolReady(); });

    // The app warns before unsaved work is lost. Electron would otherwise
    // swallow that silently and refuse to close.
    win.webContents.on("will-prevent-unload", (event) => {
      if (SELF_TEST) { event.preventDefault(); return; }  // the self-test answers "leave"
      const choice = dialog.showMessageBoxSync(win, {
        type: "warning",
        buttons: ["Leave without saving", "Stay"],
        defaultId: 1, cancelId: 1,
        title: "Unsaved changes",
        message: "You have unsaved changes.",
        // In the suite the warning can come from the suite page or from a
        // tool's own frame; Electron raises this event for either.
        detail: MODULE.id === "suite"
          ? "A tool in the suite has changes since its last Save that are not in its project file. Each tool offers its autosave copy the next time it starts, but only Save updates the file itself."
          : "Changes since your last Save are not in your project file. The tool will offer its autosave copy next time it starts, but only Save updates the file itself."
      });
      if (choice === 0) event.preventDefault();  // preventDefault here means "let it close"
    });

    // Stay on the app. Anything else is a link to the outside world.
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (/^https?:\/\//i.test(url)) shell.openExternal(url);
      return { action: "deny" };
    });
    win.webContents.on("will-navigate", (e, url) => {
      if (url.split("#")[0] !== win.webContents.getURL().split("#")[0]) {
        e.preventDefault();
        if (/^https?:\/\//i.test(url)) shell.openExternal(url);
      }
    });

    // Word and Excel exports arrive as downloads. Ask where to save them,
    // starting in Documents with the app's own file name.
    session.defaultSession.on("will-download", (e, item) => {
      const name = item.getFilename();
      if (SELF_TEST) {
        item.setSavePath(path.join(app.getPath("temp"), "otcat-selftest-" + Date.now() + "-" + name));
        return;
      }
      const ext = path.extname(name).slice(1).toLowerCase();
      const kinds = { docx: "Word document", xlsx: "Excel workbook", json: "Project file" };
      item.setSaveDialogOptions({
        title: "Save " + (kinds[ext] || "file"),
        defaultPath: path.join(app.getPath("documents"), name),
        filters: kinds[ext] ? [{ name: kinds[ext], extensions: [ext] }] : []
      });
    });

    win.loadFile(INDEX);

    if (SELF_TEST) require("./selftest-" + MODULE.electron.selfTest)(win);
  });

  // The self-test closes the window itself mid-run, and exits when it has
  // written its results.
  app.on("window-all-closed", () => { if (!SELF_TEST) app.quit(); });
}
