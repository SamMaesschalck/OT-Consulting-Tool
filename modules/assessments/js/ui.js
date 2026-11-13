/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* ui.js
 *
 * View layer. Owns sidebar nav, main panel routing, capture forms, target
 * (site) management, engagement metadata modal, and the report preview.
 */
window.App = window.App || {};
window.App.UI = (function () {
  "use strict";

  var E = window.App.Engine;
  var S = window.App.Scoring;
  var STG = window.App.Storage;

  var view = "engagement";   // engagement | targets | fr | report | placeholder
  var viewFR = null;
  var refs = {};
  var lastScored = null;

  function $(id) { return document.getElementById(id); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function gradeLetterClass(grade) {
    // Colour by grade letter only - never by coverage confidence.
    if (!grade) return "";
    if (grade === "A" || grade === "B") return "met";
    if (grade === "C" || grade === "D") return "near";
    return "gap";
  }
  function provisionalMarker(opts) {
    opts = opts || {};
    return h("span", {
      class: "pmark" + (opts.large ? " lg" : ""),
      title: "Provisional: coverage below threshold, so treat as indicative"
    }, ["P"]);
  }
  function confidenceTag(level) {
    if (!level) return null;
    var DL = window.App.ScoringDomainLetter;
    var key = DL.confidenceKey(level);
    if (key === "high") return null;
    return h("span", {
      class: "conf-tag conf-" + key,
      title: level + " - share of Unknown answers among attempted questions"
    }, [
      h("span", { class: "conf-sep", text: "·" }),
      document.createTextNode(level.toLowerCase())
    ]);
  }
  function h(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k.indexOf("on") === 0 && typeof attrs[k] === "function") n.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (k === "value") n.value = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      if (typeof c === "string" || typeof c === "number") n.appendChild(document.createTextNode(String(c)));
      else n.appendChild(c);
    });
    return n;
  }

  // A small, discoverable "Clear" control shown only when a scored item already
  // has an answer. It returns the item to "Not yet set" so an accidental state
  // click is reversible - otherwise the answer counts permanently toward
  // coverage until the file is reloaded. Returns null when nothing to clear
  // (callers using appendChild must null-check; array children skip nulls).
  // Whether a target holds an answer of its own for a requirement, as opposed
  // to taking a shared one. The difference decides which controls are live:
  // there is nothing to clear, and nothing to revert, in an answer you do not
  // own.
  function ownAnswer(targetId, requirementId) {
    var r = E.findResponse(targetId, requirementId);
    return !!(r && r.components && Object.keys(r.components).some(function (k) {
      return r.components[k] && r.components[k].state;
    }));
  }

  function clearAnswerBtn(answered, onClear, label, title) {
    if (!answered) return null;
    return h("button", {
      class: "sl-btn clear-answer",
      title: title || (label ? "Remove this override and go back to the shared answer"
                             : "Clear this answer (back to Not yet set)"),
      onClick: onClear,
      text: label || "Clear"
    });
  }

  // ---- capture-page section navigation ------------------------------------
  // Prev / next footer appended to every list capture page so finishing a
  // section never dead-ends into a sidebar round-trip. `sections` is
  // [{id,label}] in display order; the final section's "next" goes to the
  // report preview.
  function sectionFootNav(sections, currentId, viewName) {
    if (!sections || sections.length < 2) return null;
    var idx = -1;
    sections.forEach(function (s, i) { if (s.id === currentId) idx = i; });
    if (idx === -1) return null;
    var prev = idx > 0 ? sections[idx - 1] : null;
    var next = idx < sections.length - 1 ? sections[idx + 1] : null;
    var prevBtn = h("button", { class: "btn", text: prev ? ("‹ " + prev.label) : "‹ Previous" });
    if (prev) prevBtn.addEventListener("click", function () { go(viewName, prev.id); });
    else prevBtn.setAttribute("disabled", "");
    var nextBtn = h("button", { class: "btn primary", text: next ? (next.label + " ›") : "Report preview ›" });
    nextBtn.addEventListener("click", function () { if (next) go(viewName, next.id); else go("report"); });
    return h("div", { class: "card section-footnav" }, [
      h("div", { class: "card-b", style: "display:flex; gap:8px; align-items:center;" }, [
        prevBtn,
        h("span", { class: "muted", style: "flex:1; text-align:center; font-size:12.5px;", text: "Section " + (idx + 1) + " of " + sections.length }),
        nextBtn
      ])
    ]);
  }

  // Human label for an instrument family id used by the sidebar grouping.
  // Falls back to the family id formatted as a single token if we don't have
  // a curated name yet.
  // Pluralise a target-dimension label for nav/headings. Handles consonant+y
  // ("Entity" -> "Entities"); everything else just takes "s" ("Site" -> "Sites").
  // "1 requirement" / "2 requirements" - the client-facing prose elsewhere is
  // written properly, so the UI should not fall back to "requirement(s)".
  function plural(n, one, many) {
    return n + " " + (n === 1 ? one : (many || one + "s"));
  }
  // Naive pluralisation is fine for "Site"/"Component" but not for a compound
  // label like "Zone or conduit", so an instrument may state its own plural.
  function pluralLabel(s, instrument) {
    var inst = instrument || E.state.instrument;
    if (inst && inst.targetDimensionLabelPlural &&
        String(s) === String(inst.targetDimensionLabel)) {
      return inst.targetDimensionLabelPlural;
    }
    // Same rule as the Excel tabs (export-xlsx.js targetNouns): drop the
    // bracketed gloss and pluralise each " / " alternative on its head noun,
    // so "Dutyholder / site" reads "Dutyholders / sites", not "dutyholder / sites".
    s = String(s || "").split(" (")[0].trim();
    return s.split(" / ").map(pluralPhrase).join(" / ");
  }
  function pluralPhrase(s) {
    var m = /^(.*?\S)(\s+(?:with|of|for|in|under|on|at)\s.*)$/i.exec(s);
    if (m) return pluralPhrase(m[1]) + m[2];
    var words = s.split(" ");
    var last = words[words.length - 1];
    if (/[^siu]s$/i.test(last)) return s;
    words[words.length - 1] = /(s|x|z|ch|sh)$/i.test(last) ? last + "es"
      : /[^aeiou]y$/i.test(last) ? last.slice(0, -1) + "ies"
      : last + "s";
    return words.join(" ");
  }

  // How the assessments are grouped in the picker and the sidebar.
  //
  // Grouped by the KIND OF WORK, not by who published it. Publisher grouping
  // read tidily on paper and fragmented in practice - CIS had a heading to
  // itself, NIST and the two screeners had two each - and "who wrote it" is not
  // the question a consultant is answering when they open the tool. These five
  // are the answers to "what am I being asked to do", and none of them is a
  // group of one.
  var FAMILY_NAMES = {
    "iec-62443": "ISA/IEC 62443",
    "frameworks": "Control frameworks",
    "regulation": "Regulations and directives",
    "sector": "Sector regulators",
    "screening": "Screening and posture",
    // Retired groupings, kept so an older manifest still renders a sensible
    // heading rather than a raw id.
    "regulatory": "Regulations and directives", "generic": "Screening and posture",
    "nis2": "Regulations and directives", "screeners": "Screening and posture",
    "nist": "Control frameworks", "cis": "Control frameworks", "onr": "Sector regulators"
  };
  // The standard the tool is built around first, then the frameworks a client
  // chooses, then what a regulator imposes, then the sector-specific regimes,
  // and last the short screeners that route into all of them.
  var FAMILY_ORDER = ["iec-62443", "frameworks", "regulation", "sector", "screening"];
  function instrumentFamilyName(family) {
    return FAMILY_NAMES[family] || String(family || "").replace(/^./, function (c) { return c.toUpperCase(); });
  }
  // Groups in the curated order, with anything unrecognised kept (at the end)
  // rather than dropped, so a new family id is visible instead of invisible.
  function orderedFamilies(found) {
    var known = FAMILY_ORDER.filter(function (f) { return found.indexOf(f) !== -1; });
    var rest  = found.filter(function (f) { return FAMILY_ORDER.indexOf(f) === -1; });
    return known.concat(rest);
  }
  // Within a group, what you can actually open comes first. A placeholder sat
  // second in its group reads as a choice until you get to the card and find it
  // is not built yet. Manifest order is otherwise preserved.
  function builtFirst(list) {
    var open = list.filter(function (i) { return i.status !== "placeholder"; });
    var stub = list.filter(function (i) { return i.status === "placeholder"; });
    return open.concat(stub);
  }

  // Layered CRA is a csms-conformance instrument with a three-layer structure
  // and a setup phase. It reuses the csms scorer per layer but has its own
  // capture, report and export handling, all guarded by this check so the
  // plain csms instrument is untouched. Shape-based (not dependent on the
  // ScoringCRA module being present) so the UI never silently degrades a CRA
  // instrument to the plain-csms path.
  function isCRA() {
    var i = E.state.instrument;
    return !!(i && i.layers && i.layers.length && i.setup && i.setup.length);
  }

  // ---- theme (light / dark) --------------------------------------------

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("ot-theme", theme); } catch (e) {}
    var btn = $("btn-theme");
    if (btn) {
      var dark = theme === "dark";
      // Show the icon for the mode you'd switch TO.
      btn.textContent = dark ? "☀ Light" : "☾ Dark";
      btn.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
    }
  }
  function setupThemeToggle() {
    applyTheme(currentTheme()); // sync the button label to the pre-applied theme
    var btn = $("btn-theme");
    if (!btn) return;
    btn.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  }

  function toast(msg, kind, ms) {
    var t = $("toast");
    t.textContent = msg;
    t.className = "toast" + (kind ? " " + kind : "");
    t.classList.remove("hidden");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.add("hidden"); }, ms || 4500);
  }

  // ---- autosave (localStorage safety net) -------------------------------
  // Enabled only on the main app (index.html calls init({ autosave: true })).
  // Tour/demo/test pages do NOT enable it, so their seeded data never clobbers a
  // consultant's real work (all pages share one localStorage origin). The shared
  // source of truth stays the Save/Load JSON files; this only guards against a
  // closed tab or refresh losing the current, unsaved session.
  // The live backstop: one key per session, LIVE_PREFIX + sessionId. A
  // "session" is one project's run of edits in one window: a new id at
  // start-up, New, Load and Restore. There used to be ONE live key for every
  // window, so two windows open at once took turns overwriting it and the
  // last write won: one window's backstop silently replaced the other's. Now
  // a window writes and removes only its own key. The one exception is
  // start-up, which sets every other session's copy aside as offered work.
  var LIVE_PREFIX = "otcat:autosave:live:v2:";
  // The single live key, and the tag naming the session that wrote it, used
  // by the release before per-session keys. Start-up still offers a copy left
  // there, so unsaved work written by the previous release is not lost, and
  // then removes both.
  var LEGACY_KEY = "otcat:autosave:v2";
  var LEGACY_OWNER_KEY = "otcat:autosave:owner:v2";
  // Unsaved work from a session that has ended, waiting for the consultant to
  // restore or discard it. A list, because a second session can end with
  // unsaved work before the first one has been dealt with. A window opened
  // while another is still editing sets that window's copy aside here too;
  // the other window, on its next autosave or Save, takes that stale copy back
  // out, so a project that was saved is not announced as unsaved at every
  // launch.
  var OFFERED_KEY = "otcat:autosave:offered:v2";
  // Copies kept, newest first. Every file:// page shares one storage quota, so
  // the list cannot grow for ever; five sessions abandoned with unsaved work
  // and never looked at is already more than anyone will go back through.
  var MAX_OFFERED = 5;
  var autosaveEnabled = false;
  var autosaveTimer = null;
  function newSessionId() {
    return "s-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36);
  }
  var sessionId = newSessionId();
  function liveKey() { return LIVE_PREFIX + sessionId; }
  // Other sessions' live keys that start-up could not set aside because the
  // store was too full. Each copy stays on its own key and the bar offers it
  // from there; Restore and Discard act on that key. Nothing else touches it,
  // and it never blocks this session's own backstop, which has a key of its
  // own.
  var strandedKeys = [];
  function autosaveContentCount(pf) {
    var n = 0;
    if (pf && pf.assessments) Object.keys(pf.assessments).forEach(function (id) {
      n += (((pf.assessments[id] || {}).responses) || []).length;
    });
    return n;
  }
  // Is there any consultant-entered work worth saving/restoring? Broader than
  // just answered items: engagement details, the basis-of-assessment register,
  // target SLs, the CAF profile and CRA classification all count, so prep work
  // done before the first item is scored is not silently lost.
  function projectHasContent(pf) {
    if (!pf) return false;
    var ass = pf.assessments || {};
    var assessmentHas = Object.keys(ass).some(function (id) {
      var a = ass[id] || {};
      if ((a.responses || []).length > 0) return true;
      if (a.selectedProfileId) return true;              // CAF profile chosen
      if (a.baseline) return true;                        // re-assessment baseline loaded
      if ((a.targets || []).length > 1) return true;      // extra site/product added
      if (a.reportNarrative && Object.keys(a.reportNarrative).some(function (k) { return String(a.reportNarrative[k] || "").trim() !== ""; })) return true;
      var tp = a.targetProfile || {};
      if ((tp.perFR && Object.keys(tp.perFR).length) || (tp.perZone && Object.keys(tp.perZone).length)) return true;
      var cs = a.craSetup || {};
      if (cs.products && Object.keys(cs.products).some(function (t) {
        var p = cs.products[t] || {};
        return (p.productClass && p.productClass !== "default") || p.productCategory;
      })) return true;
      if (basisHasContent(a.basisOfAssessment)) return true;  // per-assessment evidence register
      // Engagement setup IS work: the site, the consultant, the visit date. These
      // moved onto the assessment when the metadata split happened, and the check
      // stayed on the project - so an afternoon of prep with nothing yet scored
      // was backed up only if a client name had been typed at file level.
      var em = a.engagementMeta || {};
      if (Object.keys(em).some(function (k) {
        var v = String(em[k] == null ? "" : em[k]).trim();
        if (v === "") return false;
        // The default confidentiality is not something anyone chose.
        return !(k === "confidentiality" && v === "Confidential");
      })) return true;
      return false;
    });
    if (assessmentHas) return true;
    var p = pf.project || {};
    var metaFields = ["clientName", "siteName", "siteAddress", "siteContact", "opportunityId",
      "consultant", "dateOfVisit", "documentRevision", "qaReviewBy", "authorisedBy", "issuedTo", "issuedDate"];
    if (metaFields.some(function (k) { return String(p[k] || "").trim() !== ""; })) return true;
    if (p.confidentiality && p.confidentiality !== "Confidential") return true;
    return basisHasContent(p.basisOfAssessment);  // legacy project-level register (old files)
  }
  function basisHasContent(b) {
    b = b || {};
    return ["interviews", "documents", "observations"].some(function (kind) {
      return (b[kind] || []).some(function (row) {
        return Object.keys(row || {}).some(function (k) { return String(row[k] || "").trim() !== ""; });
      });
    });
  }
  // The backstop exists only while there is UNSAVED work. Writing it whenever
  // the project had content meant a saved, closed session left a copy behind,
  // and the next launch offered it back as "unsaved work found" - every time,
  // for work that was safely in a file. A consultant who is told about unsaved
  // work when there is none soon stops reading the message that matters.
  // True when the current session is now on its key, so a caller can tell a
  // backstop that exists from one that silently failed to. Only this
  // session's own key is written, so no other window's copy, and no copy a
  // full store left behind, can be overwritten or get in the way.
  function writeAutosave() {
    if (!autosaveEnabled || !dirtySinceSave) return false;
    try {
      var pf = E.getProjectFile();
      if (!projectHasContent(pf)) return false;
      localStorage.setItem(liveKey(), JSON.stringify(pf));
    } catch (e) { return false; /* private mode / quota / blocked - skip silently */ }
    // A copy of this session another window set aside is older than the one
    // just written, and would be offered as unsaved work that is not.
    dropOfferedFrom(sessionId);
    return true;
  }
  function scheduleAutosave() {
    if (!autosaveEnabled) return;
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(writeAutosave, 800);
  }
  // Guarded, because every page shares one localStorage origin: a tour or test
  // page must never delete the main app's backstop. Only THIS session's key
  // goes; another window's copy is not this session's to remove.
  function clearAutosave() {
    if (!autosaveEnabled) return;
    removeKey(liveKey());
  }
  // One live copy, by key: { raw, file }, or null when there is nothing there.
  // A copy that is not valid JSON comes back with file null, so the caller can
  // remove it rather than offer it.
  function readCopy(key) {
    var raw = null;
    try { raw = localStorage.getItem(key); } catch (e) { return null; }
    if (!raw) return null;
    var file = null;
    try { file = JSON.parse(raw); } catch (e) {}
    return { raw: raw, file: file };
  }
  function removeKey(key) {
    try { localStorage.removeItem(key); } catch (e) {}
    // The previous release's owner tag means nothing without its copy.
    if (key === LEGACY_KEY) { try { localStorage.removeItem(LEGACY_OWNER_KEY); } catch (e) {} }
  }
  // Which session wrote a live key: the suffix of a per-session key, or the
  // previous release's owner tag for its single key.
  function sessionOfKey(key) {
    if (key.indexOf(LIVE_PREFIX) === 0) return key.slice(LIVE_PREFIX.length) || null;
    if (key === LEGACY_KEY) { try { return localStorage.getItem(LEGACY_OWNER_KEY) || null; } catch (e) { return null; } }
    return null;
  }
  // The work this session has just saved, or chosen to throw away, is no
  // longer unsaved anywhere: drop any copy of it waiting to be offered too.
  function dropOfferedFrom(session) {
    if (!autosaveEnabled || !session) return;
    var raw = null;
    try { raw = localStorage.getItem(OFFERED_KEY); } catch (e) { return; }
    if (!raw || raw.indexOf(session) === -1) return;    // the usual case: nothing of ours
    writeOffered(readOffered().filter(function (b) { return b.session !== session; }));
  }

  // The offered list: [{ id, file, session }], the most recently set aside
  // first, at most MAX_OFFERED long. `session` is the session that wrote the
  // copy, so that session can take it back out once the work is saved. A copy
  // that cannot be read is no use to anyone, so it is dropped rather than
  // offered.
  function readOffered() {
    var raw = null;
    try { raw = localStorage.getItem(OFFERED_KEY); } catch (e) { return []; }
    if (!raw) return [];
    try {
      var list = JSON.parse(raw);
      return Array.isArray(list) ? list.filter(function (b) { return b && b.id && b.file; }) : [];
    } catch (e) { return []; }
  }
  function writeOffered(list) {
    try {
      if (list.length) localStorage.setItem(OFFERED_KEY, JSON.stringify(list));
      else localStorage.removeItem(OFFERED_KEY);
      return true;
    } catch (e) { return false; }
  }
  function removeOffered(id) {
    writeOffered(readOffered().filter(function (b) { return b.id !== id; }));
  }

  // Set one live copy aside as offered work, where nothing any session does
  // next can overwrite it, and stays until the consultant restores or
  // discards it. A copy with no content is simply removed.
  //
  // True when the key is now free. False means the store was too full to hold
  // even this one copy in the list, so it was left on its own key, where it
  // is still offered rather than lost.
  function retireKey(key) {
    var copy = readCopy(key);
    if (!copy) return true;
    // Nothing readable, or nothing worth offering: either way it goes.
    if (!copy.file || !projectHasContent(copy.file)) { removeKey(key); return true; }
    var session = sessionOfKey(key);
    // An offered copy from the same session is an older copy of this same
    // work, and the same copy twice is no use to anyone.
    var list = readOffered().filter(function (b) {
      return JSON.stringify(b.file) !== copy.raw && !(session && b.session === session);
    });
    list.unshift({ id: "b-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e6).toString(36),
                   file: copy.file, session: session });
    list = list.slice(0, MAX_OFFERED);
    // The copy out first, so a nearly full store has room for the list. If it
    // still does not fit, the oldest copies go before the newest: the newest
    // is the one the consultant is most likely to want, and losing it to keep
    // something older is how this used to fail.
    try { localStorage.removeItem(key); } catch (e) {}
    while (list.length) {
      if (writeOffered(list)) {
        if (key === LEGACY_KEY) { try { localStorage.removeItem(LEGACY_OWNER_KEY); } catch (e) {} }
        return true;
      }
      list.pop();
    }
    try { localStorage.setItem(key, copy.raw); } catch (e) {}
    return false;
  }

  // Set this session's own backstop aside as offered work. Called when Load,
  // Restore or New replaces a session: the consultant was told the unsaved
  // work would be kept, and a mis-click is exactly what a backstop is for.
  // The caller switches to a new session id straight after, so a copy a full
  // store will not let move stays on its old key, which is now another
  // session's: the next start-up offers it from there, and nothing is lost.
  function retireOwnBackstop() {
    if (!autosaveEnabled) return true;
    return retireKey(liveKey());
  }

  // Every live copy in the store that is not this session's: other windows'
  // keys and the previous release's single key.
  function foreignLiveKeys() {
    var keys = [], own = liveKey();
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k !== own && (k === LEGACY_KEY || k.indexOf(LIVE_PREFIX) === 0)) keys.push(k);
      }
    } catch (e) {}
    return keys;
  }
  function copyTime(key) {
    var c = readCopy(key);
    var t = c && c.file && c.file.updatedAt ? Date.parse(c.file.updatedAt) : NaN;
    return isNaN(t) ? 0 : t;
  }

  // At start-up every other session's live copy is set aside: the windows
  // that wrote them have closed, or, if one is still editing, it takes its
  // copy back out on its next autosave or Save. Oldest first, so the newest
  // ends up first in the list and is the one the bar offers first. A copy the
  // store is too full to move stays on its key and is offered from there.
  function retireForeignCopies() {
    strandedKeys = [];
    var keys = foreignLiveKeys();
    var times = {};
    keys.forEach(function (k) { times[k] = copyTime(k); });
    keys.sort(function (a, b) { return times[a] - times[b]; });
    keys.forEach(function (k) {
      if (!retireKey(k)) strandedKeys.push(k);
    });
    // The previous release's owner tag goes once its copy has been dealt with.
    if (strandedKeys.indexOf(LEGACY_KEY) === -1) {
      try { if (localStorage.getItem(LEGACY_KEY) === null) localStorage.removeItem(LEGACY_OWNER_KEY); } catch (e) {}
    }
  }

  // The bar belongs to the session it was shown in. When that session is
  // replaced it goes; the work it was offering stays in the list and is
  // offered again at the next start.
  function closeRestoreBar() {
    var bar = $("autosave-bar");
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }

  function maybeRestoreAutosave() {
    if (!autosaveEnabled) return;
    retireForeignCopies();
    showRestoreBar();
  }

  // What the bar can offer: the list, plus any copy a full store left on
  // another session's key. Those were the last to be set aside, so they go
  // first, newest first; showing only the list would hide them. A stranded
  // entry carries its `key`, which is what Restore and Discard act on.
  var STRANDED_ENTRY_PREFIX = "key:";
  function pendingBackups() {
    var stranded = [];
    strandedKeys = strandedKeys.filter(function (k) {
      var c = readCopy(k);
      if (!c || !c.file) return false;      // restored or saved elsewhere, or unreadable
      stranded.push({ id: STRANDED_ENTRY_PREFIX + k, key: k, file: c.file, session: sessionOfKey(k) });
      return true;
    });
    stranded.reverse();
    return stranded.concat(readOffered());
  }
  function pendingEntry(id) {
    return pendingBackups().filter(function (b) { return b.id === id; })[0] || null;
  }

  function showRestoreBar() {
    closeRestoreBar();
    if (!autosaveEnabled) return;
    var list = pendingBackups();
    if (!list.length) return;
    var entry = list[0], data = entry.file;
    var count = autosaveContentCount(data);
    var detail = count > 0 ? (count + " answers captured") : "engagement setup in progress";
    var when = data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "an earlier session";
    var more = list.length - 1;
    var bar = h("div", { id: "autosave-bar", class: "autosave-bar" }, [
      h("span", { class: "autosave-msg", text: "Unsaved work found from " + when + " (" + detail + ")." +
        (more > 0 ? " " + more + " more " + (more === 1 ? "copy is" : "copies are") + " kept and offered after this one." : "") })
    ]);

    var restore = h("button", { class: "btn primary", text: "Restore" });
    restore.addEventListener("click", function () {
      // Restoring replaces the session, so it asks first, and says what
      // happens to the work it replaces. That work is set aside like any other
      // unsaved work. If the store is too full to move it, it stays on its own
      // key, which belongs to an ended session once the id changes below, so
      // the next start offers it from there: kept either way.
      if (dirtySinceSave && projectHasContent(E.getProjectFile()) &&
          !confirm("Restore the unsaved work from " + when + "? It replaces the project open now. " +
            "The unsaved changes in the project open now are kept in this browser and offered the next time the app starts, until you restore or discard them. " +
            "To keep them in a file instead, choose Cancel and Save first.")) return;
      var current = pendingEntry(entry.id);
      if (!current) {
        toast("That unsaved work is no longer waiting in this browser. It may have been saved, or opened again, in another window.", "warn");
        showRestoreBar();
        return;
      }
      if (autosaveTimer) { clearTimeout(autosaveTimer); autosaveTimer = null; }
      writeAutosave();   // the session being replaced, current on its own key
      var failed = loadIntoSession(current.file);
      if (failed) {
        // The copy stays offered: a failed restore is no reason to lose it.
        toast("Could not restore: " + loadFailureReason(failed, current.file) + " The current session is unchanged.", "err", 12000);
        return;
      }
      retireOwnBackstop();
      sessionId = newSessionId();
      markDirty();
      // The restored work is still only in the browser. It leaves where it
      // was waiting only once it is safely on this session's key.
      if (current.key) {
        // Stranded on another session's key by a full store. Moved rather
        // than copied: its room is freed first, which is what lets this
        // session's copy fit, and it goes back if even that fails.
        var strandedRaw = readCopy(current.key);
        try { localStorage.removeItem(current.key); } catch (e) {}
        if (writeAutosave()) {
          removeKey(current.key);
          strandedKeys = strandedKeys.filter(function (k) { return k !== current.key; });
        } else if (strandedRaw) {
          try { localStorage.setItem(current.key, strandedRaw.raw); } catch (e) {}
        }
      } else if (writeAutosave()) removeOffered(entry.id);
      closeRestoreBar();
      toast("Restored unsaved work. Save it to a file to keep it.");
    });
    // Three outcomes, and they are genuinely different: take it back, throw it
    // away, or leave it alone. Discard used to be the only way to close the bar,
    // so a consultant who just wanted it out of the way had to delete the work
    // to do it - and it was invisible anyway (.btn.ghost is white-on-transparent,
    // styled for the dark header, on a white bar).
    var discard = h("button", { class: "btn autosave-discard", text: "Discard" });
    discard.addEventListener("click", function () {
      if (!confirm("Discard the unsaved work from " + when + "? It is not in a file, so this cannot be undone.")) return;
      if (entry.key) {
        removeKey(entry.key);
        strandedKeys = strandedKeys.filter(function (k) { return k !== entry.key; });
      } else removeOffered(entry.id);
      toast("Unsaved work discarded.");
      showRestoreBar();   // the next copy, if more than one was kept
    });
    var dismiss = h("button", {
      class: "autosave-dismiss", text: "×", title: "Dismiss (keeps the unsaved work and offers it again next time)",
      "aria-label": "Dismiss"
    });
    dismiss.addEventListener("click", closeRestoreBar);
    bar.appendChild(restore); bar.appendChild(discard); bar.appendChild(dismiss);
    document.body.appendChild(bar);
  }

  // ---- unsaved-changes tracking -----------------------------------------
  // "Dirty" = edited since the last explicit Save / Load / New. It drives the
  // Save-button cue and the on-close warning, so a consultant is told before
  // losing work. localStorage autosave (main app only) is a backstop; this
  // covers the whole session including tour pages, which do not autosave.
  var dirtySinceSave = false;
  function updateSaveButton() {
    // The suite, when it hosts the tool, marks tools with unsaved changes in
    // its bar and warns before it closes (js/host-bridge.js; absent or
    // standalone, nothing happens).
    if (window.App.HostBridge) window.App.HostBridge.setDirty(dirtySinceSave);
    var b = $("btn-save");
    if (!b) return;
    b.textContent = dirtySinceSave ? "Save*" : "Save";
    // The tooltip follows what Save will do: overwrite the open file, ask where
    // to save the first time, or (no file dialogs here) download a copy.
    var what;
    if (!STG.supportsFilePickers()) what = "Download the project as a new JSON file. This browser cannot save over the original.";
    else if (STG.currentFileHandle()) what = "Save over the project file. Shift+click to save a copy as a new file.";
    else what = "Save the project to a file. You choose where the first time.";
    b.classList.toggle("btn-unsaved", dirtySinceSave);
    b.title = (dirtySinceSave ? "You have unsaved changes. " : "All changes saved. ") + what;
  }
  function markDirty() { if (!dirtySinceSave) { dirtySinceSave = true; updateSaveButton(); } }
  function markClean() { dirtySinceSave = false; updateSaveButton(); }

  // In the suite, a project file saved or opened goes on its Recent files
  // list: the name, the customer and when, never the contents. The handle,
  // when the browser gave one, stays in this tool's own storage (see
  // js/host-bridge.js). Standalone, nothing happens.
  function noteRecentFile(action, name, handle) {
    var HB = window.App.HostBridge;
    if (!HB || !HB.hosted || !name) return;
    var pf = E.getProjectFile();
    HB.recent({ action: action, name: name, handle: handle || null,
                label: (pf && pf.project && pf.project.clientName) || "" });
  }

  // ---- version ----------------------------------------------------------
  // Shown in the tool so anyone can say which release they are on. Never in a
  // report (see js/version.js).
  function appVersion() { return window.App.Version || null; }

  function showVersionBadge() {
    var V = appVersion(), sub = document.querySelector(".header .brand .sub");
    if (!V || !sub || sub.querySelector(".version-badge")) return;
    sub.appendChild(h("span", { class: "version-badge", title: V.product + " version " + V.number, text: V.label }));
  }

  // A project saved by a newer release may use things this one does not know.
  function newerFileWarning(data) {
    var V = appVersion(), saved = data && data.savedWithVersion;
    if (!V || !saved || V.compare(saved, V.number) <= 0) return "";
    return "This project was last saved with " + V.labelOf(saved) + " of the tool, newer than this copy (" + V.label +
      "). Ask your SolutionsPT contact for the current version before working on it.";
  }

  // Why a project file was refused, as a sentence. A file holding an
  // assessment of something this copy does not have almost always came from a
  // newer release, so it names what is missing and says what to do about it
  // rather than passing on an engine error.
  function loadFailureReason(e, data) {
    if (e && e.code === "unknown-instrument") {
      var names = (e.instruments || []).map(function (n) { return "\"" + n + "\""; });
      var V = appVersion(), saved = data && data.savedWithVersion;
      var where = (V && saved && V.compare(saved, V.number) > 0)
        ? " It was saved with " + V.labelOf(saved) + ", newer than this copy (" + V.label + ")"
        : " It was probably made with a newer version";
      return "it contains " + (names.length === 1 ? "an assessment" : "assessments") + " of " + names.join(", ") +
        ", which this copy of the tool does not have." + where +
        ": ask your SolutionsPT contact for the current version.";
    }
    var msg = String(e && e.message ? e.message : e);
    return msg + (/[.!?]$/.test(msg) ? "" : ".");
  }

  // Engine.loadProjectFile leaves the data exactly as it was when it refuses a
  // file, but a listener may already have redrawn the page for the file that
  // failed, which sends the consultant back to the engagement page and clears
  // their place. Put the page, and the unsaved flag, back as they were too, so
  // "the current session is unchanged" is true of the screen as well.
  // Returns the error, or null when the file loaded.
  function loadIntoSession(data) {
    var keep = { view: view, viewFR: viewFR, collapsed: instrumentSectionCollapsed, dirty: dirtySinceSave };
    try { E.loadProjectFile(data); return null; }
    catch (e) {
      view = keep.view; viewFR = keep.viewFR; instrumentSectionCollapsed = keep.collapsed;
      dirtySinceSave = keep.dirty; updateSaveButton();
      try { render(); } catch (e2) {}
      return e;
    }
  }

  // ---- init -------------------------------------------------------------

  function init(opts) {
    autosaveEnabled = !!(opts && opts.autosave);
    refs.sidebar = $("sidebar");
    refs.main    = $("main");
    refs.toast   = $("toast");
    applySidebarSlim();   // the stored choice, before anything renders
    showVersionBadge();

    E.loadCatalog();
    E.on("instrument-changed", function (inst, info) {
      // A refused load putting the open session back is not a change of
      // instrument: loadIntoSession puts the page back where it was.
      if (info && info.restored) { render(); return; }
      // Reset the view when the family changes so we never try to render the SL
      // capture flow against a posture instrument (or vice versa). With the
      // instrument cleared we fall back to the picker.
      view = inst ? "engagement" : "home"; viewFR = null;
      // Choosing an assessment collapses the picker to it: from here on the
      // sidebar belongs to the capture nav, and "change" (or the chevron) gets
      // the list back. Honours a consultant who has explicitly chosen to keep
      // the list expanded.
      if (inst) {
        try {
          if (localStorage.getItem("ot-instrument-picker") !== "expanded") instrumentSectionCollapsed = true;
        } catch (e) { instrumentSectionCollapsed = true; }
      }
      render();
      scheduleAutosave();
    });
    E.on("engagement-changed", function () { render(); scheduleAutosave(); markDirty(); });
    E.on("targets-changed",    function () { render(); scheduleAutosave(); markDirty(); });
    E.on("active-target-changed", function () { render(); scheduleAutosave(); });
    E.on("response-changed",   function () { /* no full re-render; only summary */ updateSummaryNavBadges(); scheduleAutosave(); markDirty(); });
    // Edits that reach no listener above: adding, deleting or renaming an
    // assessment (project-changed) and linking or unlinking a requirement
    // across zones (responses-changed). Without these a 2028 re-assessment
    // created a moment ago left Save without its star, the close warning
    // silent, no backstop written, and Load did not ask before replacing it.
    // The callers re-render for themselves.
    E.on("project-changed", function (p, info) {
      if (info && info.restored) return;   // a refused load, not an edit
      scheduleAutosave(); markDirty();
    });
    E.on("responses-changed", function () { scheduleAutosave(); markDirty(); });

    // Dark-mode toggle. The initial theme is applied pre-paint by an inline
    // script in index.html; here we just reflect it on the button and let the
    // user flip + persist it. Guarded so tour/test pages without the button
    // (which still honour the stored theme) don't error.
    setupThemeToggle();

    // Global quick-find shortcut. Ctrl/Cmd+K anywhere; "/" only when not typing
    // into a field, so it never swallows a slash mid-evidence-note.
    document.addEventListener("keydown", function (ev) {
      if (findState) return; // the palette handles its own keys while open
      var isK = (ev.ctrlKey || ev.metaKey) && !ev.altKey && (ev.key === "k" || ev.key === "K");
      var tag = (ev.target && ev.target.tagName) ? ev.target.tagName.toUpperCase() : "";
      var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (ev.target && ev.target.isContentEditable);
      var isSlash = ev.key === "/" && !typing && !ev.ctrlKey && !ev.metaKey && !ev.altKey;
      if (isK || isSlash) { ev.preventDefault(); openFindPalette(); }
    });

    // Warn before losing unsaved work on tab close / refresh, and flush any
    // pending autosave first so the main app's localStorage backstop is current.
    window.addEventListener("beforeunload", function (ev) {
      if (autosaveEnabled) writeAutosave();
      if (dirtySinceSave) { ev.preventDefault(); ev.returnValue = ""; return ""; }
    });

    // header buttons
    $("btn-new").addEventListener("click", function () {
      // Asked whenever there is a project to replace, and the question says
      // what happens to it. Unsaved work is kept, as Load and Restore keep it:
      // New used to throw it away, and a mis-click on New is exactly what a
      // backstop is for. With nothing unsaved it still asks, because the
      // project leaves the screen, but says its file is untouched. A
      // confirm() is fine here, unlike Load: no file dialog follows, so there
      // is no click to use up.
      if (projectHasContent(E.getProjectFile())) {
        var newQuestion = dirtySinceSave
          ? "Start a new project? The project open now has unsaved changes (engagement details, evidence register or answers). " +
            "They are kept in this browser and offered the next time the app starts, until you restore or discard them. " +
            "To keep them in a file instead, choose Cancel and Save first."
          : "Start a new project? It replaces the project open now. There are no unsaved changes, and the project's saved file is not changed.";
        if (!confirm(newQuestion)) return;
      }
      // Bring the backstop up to date while it still describes the session on
      // screen, then set it aside to be offered until restored or discarded.
      // Work set aside from earlier sessions is untouched.
      if (autosaveTimer) { clearTimeout(autosaveTimer); autosaveTimer = null; }
      writeAutosave();
      retireOwnBackstop();
      sessionId = newSessionId();
      closeRestoreBar();
      E.newProject();
      // A new project has no assessment yet, so drop the selection and land on
      // the picker rather than silently inheriting whatever was open before.
      E.clearInstrument();
      // Forget the previous project's file so Save can't overwrite it with
      // this new, unrelated project - the first save will ask where to save.
      STG.forgetProjectFile();
      markClean();
    });
    // Save writes back to the project's own file where the browser supports it
    // (no more "name (1).json" copies); Shift+click forces the save dialog for
    // a fresh copy/snapshot. Falls back to a download elsewhere.
    // Shown once per session when the browser has no in-place save (e.g.
    // Firefox), so the consultant understands why copies pile up and how to
    // stop them, without nagging on every save.
    var noInPlaceHintShown = false;
    $("btn-save").addEventListener("click", function (ev) {
      var pf = E.getProjectFile();
      STG.saveProjectToFile(pf, { saveAs: !!(ev && ev.shiftKey) }, function (res) {
        if (res.ok) {
          markClean();
          // The work is in a file now, so the localStorage copy has nothing left
          // to rescue. Leaving it is what made the restore bar appear at every
          // launch for work that was never at risk. That includes a copy of
          // this session another window set aside as offered work.
          clearAutosave();
          dropOfferedFrom(sessionId);
          noteRecentFile("save", res.name, res.method === "file" ? STG.currentFileHandle() : null);
          if (res.method === "file") {
            toast("Saved to " + res.name + ".");
          } else if (res.blocked) {
            // The browser has the save dialog but would not show it here (the
            // tool is inside another page), so the save went to Downloads.
            toast("Downloaded " + res.name + ". Saving back into the same file is not available here, so each save downloads a new copy.", "warn", 9000);
          } else if (!noInPlaceHintShown) {
            noInPlaceHintShown = true;
            toast("Downloaded " + res.name + ". This browser can't overwrite the file from an offline page, so it adds \"(1)\", \"(2)\" to the name. To overwrite the same file with one click, open this tool in Edge or Chrome. (In Firefox you can also turn on Settings → \"Always ask you where to save files\" and choose Replace.)", "warn", 12000);
          } else {
            toast("Downloaded " + res.name + " (a new copy; see the earlier note).", "warn");
          }
        } else if (!res.aborted) {
          toast("Save failed: " + (res.error || "unknown error"), "err");
        }
      });
    });
    // Shared tail for both load paths (picker and legacy file input).
    function applyLoadedProject(res) {
      if (!res.ok) { toast(res.error, "err"); return false; }
      var byId = {};
      E.state.instruments.forEach(function (i) { if (i.status === "active") byId[i.id] = i; });
      // Bring the backstop up to date while it still describes the session on
      // screen; once the load has gone through, getProjectFile is the new one.
      writeAutosave();
      // All or nothing: a refused file leaves the session exactly as it was,
      // which is what the message below promises.
      var failed = loadIntoSession(res.data);
      if (failed) {
        toast("That file could not be loaded: " + loadFailureReason(failed, res.data) + " The current session is unchanged.", "err", 12000);
        return false;
      }
      // The session just replaced keeps its backstop, set aside and offered at
      // the next start until the consultant restores or discards it, as the
      // Load question said. Deleting it here is how unsaved work used to
      // vanish without a trace.
      if (autosaveTimer) { clearTimeout(autosaveTimer); autosaveTimer = null; }
      retireOwnBackstop();
      sessionId = newSessionId();
      closeRestoreBar();
      markClean();
      var msgs = STG.versionMismatchMessages(res.data, byId);
      var newer = newerFileWarning(res.data);
      if (newer) msgs.unshift(newer);
      if (msgs.length > 0) toast(msgs.join(" "), "warn", newer ? 12000 : undefined);
      else if (res.migrated) toast("Loaded an older 1.0 file and migrated it to the project format. Save to keep it in the new format.", "warn");
      else toast("Project loaded" + (res.fileName ? " from " + res.fileName : "") + ".");
      return true;
    }
    $("btn-load").addEventListener("click", function () {
      // Asked before any file dialog opens: a consultant who has just chosen a
      // file has stopped thinking about the work on screen. Only when there IS
      // unsaved work - switching between saved projects is routine, and a
      // question asked every time stops being read.
      if (dirtySinceSave && projectHasContent(E.getProjectFile())) { askBeforeLoad(chooseProjectFile); return; }
      chooseProjectFile();
    });
    // Asked in the page rather than with confirm(), unlike New. A browser
    // opens a file dialog only in answer to a click, and the click on Load
    // stops counting as one a few seconds after it happens: time spent reading
    // a confirm() used it up, so a consultant who paused before pressing OK got
    // a "must be handling a user gesture" error, or no dialog at all. The
    // button in this panel is a fresh click, however long they read for.
    function askBeforeLoad(go, goLabel) {
      closeModal();
      var goBtn = h("button", { class: "btn primary load-guard-go", text: goLabel || "Choose a file" });
      var modal = h("div", { class: "modal-backdrop load-guard-modal" }, [
        h("div", { class: "modal", role: "dialog", "aria-modal": "true" }, [
          h("div", { class: "modal-h" }, [h("h2", { text: "Load another project?" })]),
          h("div", { class: "modal-b" }, [
            h("p", { style: "margin-top:0;", text: "The project open now has unsaved changes (engagement details, evidence register or answers). Loading another file replaces it in this window." }),
            h("p", { text: "The unsaved changes are kept in this browser and offered the next time the app starts, until you restore or discard them. To keep them in a file instead, choose Cancel and Save first." })
          ]),
          h("div", { class: "modal-f" }, [
            h("button", { class: "btn load-guard-cancel", onClick: closeModal, text: "Cancel" }),
            goBtn
          ])
        ])
      ]);
      goBtn.addEventListener("click", function () { closeModal(); go(); });
      modal.addEventListener("keydown", function (ev) { if (ev.key === "Escape") closeModal(); });
      document.body.appendChild(modal);
      refs.modal = modal;
      try { goBtn.focus(); } catch (e) {}
    }
    function chooseProjectFile() {
      if (STG.supportsFilePickers()) {
        // Picker-based load captures the file handle, so Save writes back to
        // the loaded file - but only once the load has succeeded. A refused
        // file must not become the file Save overwrites.
        STG.openProjectWithPicker(function (res) {
          if (res.aborted) return;
          if (res.unsupported) { $("file-input").click(); return; }
          // Belt and braces for the gesture rule above: say what to do, not
          // what the browser said.
          if (res.needsGesture) { toast("The file dialog did not open. Click Load again to choose the file.", "warn"); return; }
          if (applyLoadedProject(res)) {
            STG.adoptProjectFile(res.handle, (E.state.project || {}).projectId);
            noteRecentFile("open", res.fileName, res.handle);
          }
        });
      } else {
        $("file-input").click();
      }
    }
    $("file-input").addEventListener("change", function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      STG.loadProjectFromFile(file, function (res) {
        // A plain file input yields no handle: forget any previous one so Save
        // can't overwrite a DIFFERENT project's file with this one's content.
        if (applyLoadedProject(res)) { STG.forgetProjectFile(); noteRecentFile("open", file.name, null); }
      });
      ev.target.value = "";
    });
    // In the suite: reopening a file from its Recent files list. The bridge
    // hands over the file the consultant chose to reopen (and its handle,
    // when the browser kept one, so Save writes back to it); it goes through
    // the same checks as Load.
    if (window.App.HostBridge && window.App.HostBridge.hosted) {
      window.App.HostBridge.register({
        loadButton: "btn-load",
        applyTheme: applyTheme,
        openFile: function (file, handle) {
          function go() {
            STG.loadProjectFromFile(file, function (res) {
              if (res.ok) {
                if (res.data && res.data.project && typeof res.data.project === "object") STG.ensureProjectId(res.data.project);
                res.fileName = file.name;
              }
              if (!applyLoadedProject(res)) return;
              if (handle) STG.adoptProjectFile(handle, (E.state.project || {}).projectId);
              else STG.forgetProjectFile();
              noteRecentFile("open", file.name, handle);
            });
          }
          if (dirtySinceSave && projectHasContent(E.getProjectFile())) askBeforeLoad(go, "Open " + file.name);
          else go();
        },
        // The suite is closing this tool and the consultant chose to lose the
        // unsaved work: this session's backstop goes, and any copy of it
        // already set aside, so the tool does not offer it when it is opened
        // again. Work from earlier sessions still on offer is left alone.
        discardUnsaved: function () {
          if (autosaveTimer) { clearTimeout(autosaveTimer); autosaveTimer = null; }
          clearAutosave();
          dropOfferedFrom(sessionId);
          markClean();
        }
      });
    }
    $("btn-engagement").addEventListener("click", openEngagementModal);
    // Excel / Word exports go through the export-scope flow: with several
    // sites/products a chooser asks which to include (default all); with one
    // target it exports directly, as before.
    $("btn-xlsx").addEventListener("click", function () { beginExport("xlsx"); });
    $("btn-docx").addEventListener("click", function () { beginExport("docx"); });

    // Start with nothing selected: the assessment picker is the landing screen,
    // so the consultant chooses the framework for the job instead of being
    // dropped into whichever instrument happens to be first in the manifest.
    // Test and tour pages call activateInstrument() themselves straight after
    // init(), so they are unaffected.
    view = "home";
    render();

    // After the app is up, offer to restore any unsaved work from a prior
    // session (main app only; no-op when autosave is disabled).
    maybeRestoreAutosave();

    // Start clean. A deferred reset also clears the "dirty" that tour/demo pages
    // set when they programmatically apply their canned dataset synchronously
    // after init - so the close warning only fires on the consultant's own edits.
    markClean();
    setTimeout(markClean, 0);
  }

  // ---- export scope (which sites/products go into the report) ------------
  // With multiple targets, Excel/Word exports open a scope chooser (default:
  // every target selected). Families whose document genuinely covers several
  // targets (the 62443-3-3 multi-site Word report; the SL and posture
  // whole-engagement workbooks) produce ONE file covering the selection.
  // Every other family's report is per-target, so those produce one file per
  // selected target, with the target name added to the filename. The chooser
  // says which of the two will happen, so export scope is never silent.

  function exportCoversWholeEngagement(kind) {
    // CRA Word reports cover every selected product in ONE document (org-wide
    // layer once, then per-product results) instead of one file per product.
    if (kind === "docx") return E.state.scoringFamily === "capability-sl" || isCRA();
    return E.state.scoringFamily === "capability-sl" || E.state.scoringFamily === "domain-letter";
  }

  function targetNoun() {
    if (isCRA()) return craDisplay().noun;
    return (E.state.instrument.targetDimensionLabel || "Site").toLowerCase();
  }
  // "zones and conduits", not "zone or conduits": the instrument's own plural
  // wins, and pluralLabel only matches it in its declared casing.
  function targetNounPlural() {
    if (isCRA()) return pluralLabel(craDisplay().noun);
    return pluralLabel(E.state.instrument.targetDimensionLabel || "Site").toLowerCase();
  }

  function slugify(s) {
    return String(s || "").replace(/[^A-Za-z0-9_\-]+/g, "-").replace(/^-+|-+$/g, "") || "target";
  }

  // Base filename; per-target files get the target name appended whenever the
  // engagement holds several, so downloads are distinguishable.
  function exportFileBase(targetName) {
    var base = STG.suggestedFilename(E.state.engagement).replace(/\.json$/, "");
    if (targetName && E.state.engagement.targets.length > 1) base += "-" + slugify(targetName);
    return base;
  }

  // A shallow copy of the engagement narrowed to the selected targets, for the
  // whole-engagement exporters. Project metadata and targetProfile are shared.
  // Narrowing an export to a subset of targets must NOT drop the system-wide
  // layer: those answers are not owned by any one target, they are inherited by
  // all of them. Filtering them out left a zone that records nothing of its own
  // - the normal case for a shared control - with a completely empty report.
  function filteredEngagementFor(ids) {
    var eng = E.state.engagement;
    var keep = ids.concat([E.SHARED_TARGET_ID]);
    return Object.assign({}, eng, {
      targets: eng.targets.filter(function (t) { return ids.indexOf(t.id) !== -1; }),
      responses: eng.responses.filter(function (r) { return keep.indexOf(r.targetId) !== -1; })
    });
  }

  function baseExportOpts() {
    var o = {};
    if (E.state.scoringFamily === "caf-achieved") {
      o.cafProfileRegistry = E.getCAFProfileRegistry();
      o.cafProfileId = E.getActiveCAFProfileId();
      o.cafProfile = E.getActiveCAFProfile();
      o.cafOverlay = E.getActiveCAFOverlay();
    }
    if (isCRA()) o.craSetup = E.getCRASetupRaw();
    // The risk-appetite exports need the sector choice, the technical-layer
    // toggle and any band overrides: without them the exported document would
    // re-derive different positions from the same answers.
    if (E.state.scoringFamily === "risk-appetite-coherence") {
      o.riskAppetiteSetup = E.getRiskAppetiteSetup();
    }
    o.companionInstrumentIds = E.answeredInstrumentIds();
    return o;
  }

  // Busy state: the buttons grey out while a report generates, so a slow
  // build doesn't invite a second click.
  var exportBusy = false;
  function setExportBusy(b) {
    exportBusy = b;
    ["btn-xlsx", "btn-docx"].forEach(function (id) {
      var el = $(id); if (!el) return;
      if (b) el.setAttribute("disabled", ""); else el.removeAttribute("disabled");
    });
  }

  function beginExport(kind) {
    if (exportBusy) return;
    if (!E.state.instrument) { toast("Choose an assessment first.", "warn"); return; }
    if (!E.state.engagement || !E.state.profile) { toast("Open a functional instrument first.", "warn"); return; }
    if (kind === "docx") {
      // program-maturity-ml / nis2 / csms (incl. CRA) render without a
      // narrative pack; every other family needs one.
      var noNarrativeFamilies = ["program-maturity-ml", "nis2-conformance", "csms-conformance"];
      if (!E.getActiveNarrative() && noNarrativeFamilies.indexOf(E.state.scoringFamily) === -1) {
        toast("No narrative pack is loaded for this instrument.", "err"); return;
      }
    }
    // A report with zero answers is rarely intended.
    if ((E.state.engagement.responses || []).length === 0) {
      if (!confirm("Nothing has been answered yet. Export an empty report anyway?")) return;
    }
    var all = E.state.engagement.targets.map(function (t) { return t.id; });
    // Word always asks: draft or final is a choice made at every issue.
    if (all.length <= 1 && kind !== "docx") { runExport(kind, all); return; }
    openExportScopeModal(kind);
  }

  // issueAs: "draft" or "final", for Word only.
  function runExport(kind, ids, shape, issueAs) {
    if (kind === "docx") { runWordExport(ids, shape, issueAs); return; }
    var inst = E.state.instrument, tax = E.state.taxonomy, prof = E.state.profile;
    var narrative = E.getActiveNarrative();
    var targets = E.state.engagement.targets.filter(function (t) { return ids.indexOf(t.id) !== -1; });
    if (!targets.length) return;

    var fileWord = kind === "xlsx" ? "workbook" : "Word document";
    setExportBusy(true);

    // One organisation-wide document across the selected sites, instead of one
    // per site. A different report, not a merge: it says where the organisation
    // stands given that its sites differ.
    if (shape === "org") {
      var oOpts = baseExportOpts();
      oOpts.orgWide = true;
      // Sites are assessments, so the roll-up spans this customer file's
      // sibling assessments of this instrument, not the targets ticked above.
      oOpts.siteEntries = siteRollUpEntries();
      oOpts.filenameHint = exportFileBase("organisation-wide");
      toast("Generating the organisation-wide " + fileWord + " (" + targets.length + " " + pluralLabel(targetNoun()) + ")…");
      var op = window.App.ExportXLSX.download(E.state.engagement, inst, tax, prof, oOpts);
      (op && op.then ? op : Promise.resolve()).then(
        function () { setExportBusy(false); toast("Organisation-wide Excel export ready."); },
        function () { setExportBusy(false); });
      return;
    }

    if (exportCoversWholeEngagement(kind)) {
      var engagement = filteredEngagementFor(ids);
      var opts = baseExportOpts();
      // The same progress target as the Word document (docxJobs), never the
      // one selected on screen.
      var pt = progressTargetOf(targets);
      opts.targetId = pt.id;
      var pw = progressExportPayload(pt.id);
      if (pw) opts.progress = pw;
      toast("Generating the " + fileWord + (targets.length > 1 ? " (covering " + targets.length + " " + pluralLabel(targetNoun()) + ")" : "") + "…");
      var wp = window.App.ExportXLSX.download(engagement, inst, tax, prof, opts);
      (wp && wp.then ? wp : Promise.resolve()).then(
        function () { setExportBusy(false); toast("Excel export ready."); },
        function () { setExportBusy(false); });
      return;
    }

    // Per-target report families: one file per selected target, sequenced with
    // a short stagger so the browser accepts the download burst.
    toast(targets.length > 1
      ? ("Generating " + targets.length + " " + fileWord + "s, one per " + targetNoun() + "…")
      : ("Generating the " + fileWord + "…"));
    var i = 0;
    function next() {
      if (i >= targets.length) {
        setExportBusy(false);
        toast(kind === "xlsx" ? "Excel export ready." : "Word export ready.");
        return;
      }
      var t = targets[i++];
      var opts = baseExportOpts();
      opts.targetId = t.id;
      opts.filenameHint = exportFileBase(t.name);
      if (carriesProgress(t)) opts.progress = progressExportPayload(t.id);
      var p = window.App.ExportXLSX.download(E.state.engagement, inst, tax, prof, opts);
      (p && p.then ? p : Promise.resolve()).then(function () { setTimeout(next, 350); },
        function () { setTimeout(next, 350); });
    }
    next();
  }

  // The Word export: the documents docxJobs describes (the same ones the
  // issue check reads), each marked draft or final. Several files are
  // sequenced with a short stagger so the browser accepts the burst.
  function runWordExport(ids, shape, issueAs) {
    var inst = E.state.instrument, tax = E.state.taxonomy, prof = E.state.profile;
    var narrative = E.getActiveNarrative();
    var jobs = docxJobs(ids, shape);
    if (!jobs.length) return;
    var final = issueAs === "final";
    var n = E.state.engagement.targets.filter(function (t) { return ids.indexOf(t.id) !== -1; }).length;
    var what = final ? "final Word document" : "draft Word document";
    setExportBusy(true);
    if (shape === "org") toast("Generating the organisation-wide " + what + " (" + n + " " + pluralLabel(targetNoun()) + ")…");
    else if (jobs.length > 1) toast("Generating " + jobs.length + " " + what + "s, one per " + targetNoun() + "…");
    else toast("Generating the " + what + (n > 1 ? " (covering " + n + " " + pluralLabel(targetNoun()) + ")" : "") + "…");
    var i = 0, failed = false;
    function next() {
      if (i >= jobs.length) {
        setExportBusy(false);
        if (!failed) toast((shape === "org" ? "Organisation-wide " : "") + (final ? "Final" : "Draft") + " Word export ready.");
        return;
      }
      var job = jobs[i++];
      var opts = Object.assign({}, job.opts, { issueStatus: final ? "final" : "draft" });
      opts.onDone = function (err) { if (err) failed = true; setTimeout(next, jobs.length > 1 ? 350 : 0); };
      window.App.ExportDOCX.download(job.engagement, inst, tax, prof, narrative, opts);
    }
    next();
  }

  function openExportScopeModal(kind) {
    var targets = E.state.engagement.targets;
    var noun = targetNoun();
    var whole = exportCoversWholeEngagement(kind);
    var fileWord = kind === "xlsx" ? "workbook" : "Word document";
    var checks = {};
    var rows = targets.map(function (t) {
      var cb = h("input", { type: "checkbox" });
      cb.checked = true;
      checks[t.id] = cb;
      return h("label", { style: "display:flex; align-items:center; gap:8px; padding:4px 0; font-weight:400;" }, [cb, document.createTextNode(t.name)]);
    });
    var scopeNote = whole
      ? "One " + fileWord + " will be produced, covering all the selected " + pluralLabel(noun) + "."
      : "This report is per-" + noun + ": one " + fileWord + " will be produced for each selected " + noun + ", with the " + noun + " name in the filename.";
    // Where an organisation-wide roll-up is meaningful, offer it as a second
    // shape of output. Not for zones, components or products: those are parts
    // of one system, not places the organisation operates.
    // Offered for both Word and Excel. Not gated on `whole`: the posture
    // workbook already covers every site in one file, but that is a set of
    // per-site sheets, not the weakest-site roll-up, which is a different
    // question and a different document.
    var siteEntries = siteRollUpEntries();
    var canOrgWide = E.state.scoringFamily !== "capability-sl" && !isCRA() &&
                     window.App.Compare && window.App.Compare.rollUpSites &&
                     siteEntries.length >= 2;
    var shape = "per";
    var shapeRow = null;
    if (canOrgWide) {
      var perBtn = h("button", { type: "button", class: "scope-choice active" }, [
        h("strong", { text: "One " + fileWord + " per " + noun }),
        h("div", { class: "muted small", text: "Each " + noun + "'s own report, with its evidence, roadmap and owners." })
      ]);
      var orgBtn = h("button", { type: "button", class: "scope-choice" }, [
        h("strong", { text: "One organisation-wide " + fileWord }),
        h("div", { class: "muted small", text: "Across the " + siteEntries.length + " " + pluralLabel(noun) + " assessed in this customer file (" + siteEntries.map(function (s) { return s.name; }).join(", ") + "): each requirement at its weakest " + noun + ", with the " + pluralLabel(noun) + " that set it named. The tick list above does not apply to this shape." })
      ]);
      function pick(which) {
        shape = which;
        perBtn.classList.toggle("active", which === "per");
        orgBtn.classList.toggle("active", which === "org");
      }
      perBtn.addEventListener("click", function () { pick("per"); recheck(); });
      orgBtn.addEventListener("click", function () { pick("org"); recheck(); });
      shapeRow = h("div", { class: "scope-choices" }, [perBtn, orgBtn]);
    }
    function selectedIds() {
      return targets.map(function (t) { return t.id; }).filter(function (id) { return checks[id].checked; });
    }

    // Word only: draft or final. Final stays shut while the issue check finds
    // anything that would print red in the documents this export would write
    // (the same jobs, so the same answer as the report page). The last choice
    // is remembered on the assessment; a new one starts as a draft.
    var issueAs = "draft", issueBlock = null, blocked = true, checkSeq = 0, userPicked = false;
    var recheck = function () {};
    var paintReviewNote = null;
    if (kind === "docx") {
      var remembered = E.getReportNarrative().issueAs === "final" ? "final" : "draft";
      var draftBtn = h("button", { type: "button", class: "scope-choice active", "data-issue": "draft" }, [
        h("strong", { text: "Draft" }),
        h("div", { class: "muted small", text: "Marked DRAFT on every page, with Status Draft in document control. For review rounds." })
      ]);
      var finalBtn = h("button", { type: "button", class: "scope-choice disabled", "data-issue": "final", disabled: "" }, [
        h("strong", { text: "Final" }),
        h("div", { class: "muted small", text: "Status Final and no draft marking. The file opens read-only and marked as final: make the client's PDF from it." })
      ]);
      var issueNote = h("p", { class: "export-issue-note muted" });
      var setIssue = function (which) {
        if (which === "final" && blocked) return;
        issueAs = which;
        draftBtn.classList.toggle("active", which === "draft");
        finalBtn.classList.toggle("active", which === "final");
      };
      draftBtn.addEventListener("click", function () { userPicked = true; setIssue("draft"); });
      finalBtn.addEventListener("click", function () { userPicked = true; setIssue("final"); });
      var setBlocked = function (b) {
        blocked = b;
        finalBtn.classList.toggle("disabled", b);
        if (b) finalBtn.setAttribute("disabled", ""); else finalBtn.removeAttribute("disabled");
        if (b && issueAs === "final") setIssue("draft");
      };
      recheck = function () {
        var ids = selectedIds();
        var seq = ++checkSeq;
        if (paintReviewNote) paintReviewNote();
        setBlocked(true);
        issueNote.className = "export-issue-note muted";
        issueNote.textContent = ids.length ? "Checking whether the report is ready to issue…" : "";
        if (!ids.length) return;
        runIssueChecks(docxJobs(ids, shape), function (err, list) {
          if (seq !== checkSeq) return;
          issueNote.innerHTML = "";
          if (err) {
            issueNote.className = "export-issue-note blocked";
            issueNote.textContent = "Final is not available: the report could not be checked (" + (err.message || err) + ").";
            return;
          }
          var n = issueBlockerLines(list).length;
          if (n) {
            issueNote.className = "export-issue-note blocked";
            issueNote.appendChild(document.createTextNode("Final is not available yet: " + n + " thing" + (n === 1 ? " is" : "s are") +
              " still to write, and would print in red in the Word report. "));
            issueNote.appendChild(h("button", { type: "button", class: "issue-go", text: "See what is left", onClick: function () {
              closeModal();
              revealOnReport('[data-check-anchor="issue-check"]');
            } }));
            return;
          }
          setBlocked(false);
          issueNote.className = "export-issue-note muted";
          issueNote.textContent = "Nothing is left to write, so it can be issued as final.";
          if (!userPicked && remembered === "final") setIssue("final");
        });
      };
      // The same review warnings as the Issue check, for the shape and the
      // ticks chosen: a review packs the per-target documents of this
      // assessment, so the organisation-wide roll-up was never in front of a
      // reviewer, and a whole-engagement report of fewer targets is not the
      // one they read. They never close Final.
      var reviewNote = h("div", { class: "export-review-note" });
      paintReviewNote = function () {
        reviewNote.innerHTML = "";
        if (!window.App.Review) return;
        var RV = window.App.Review, list = RV.warningList();
        var lines = [];
        if (shape === "org" && canOrgWide) {
          lines.push({ kind: "org-not-reviewed", text: "The organisation-wide report has not been reviewed. Send for review packs this " + noun + "'s own report, not the roll-up across " + pluralLabel(noun) + "." });
          // Those hashes belong to a different document.
          list = list.filter(function (w) { return w.kind !== "changed-since-approval"; });
        } else if (whole && RV.store && RV.store() && selectedIds().length && selectedIds().length < targets.length) {
          lines.push({ kind: "subset-not-reviewed", text: "The review covered all " + targets.length + " " + pluralLabel(noun) + ". This report covers " + selectedIds().length +
            ", so its summary and scores are not what the reviewers read." });
        }
        lines.concat(list).forEach(function (w) {
          reviewNote.appendChild(h("p", { class: "export-issue-note warn", "data-review-warning": w.kind, text: w.text }));
        });
      };
      if (window.App.Review) { paintReviewNote(); window.App.Review.refresh(paintReviewNote); }
      issueBlock = h("div", { class: "export-issue" }, [
        h("h3", { style: "margin:14px 0 6px; font-size:13px;", text: "Issue as" }),
        h("div", { class: "scope-choices", style: "margin-bottom:0;" }, [draftBtn, finalBtn]),
        issueNote,
        reviewNote
      ]);
      Object.keys(checks).forEach(function (id) { checks[id].addEventListener("change", recheck); });
    }
    var many = targets.length > 1;

    var exportBtn = h("button", { class: "btn primary", text: "Export" });
    exportBtn.addEventListener("click", function () {
      var ids = selectedIds();
      if (!ids.length) { toast("Select at least one " + noun + ".", "warn"); return; }
      if (shape === "org" && siteEntries.length < 2) {
        toast("An organisation-wide report needs at least two " + pluralLabel(noun) + " assessed in this file.", "warn"); return;
      }
      if (kind === "docx" && issueAs === "final" && blocked) {
        toast("The report still has text to write, so it cannot be issued as final.", "warn"); return;
      }
      closeModal();
      if (kind === "docx" && issueAs !== (E.getReportNarrative().issueAs || "draft")) E.setReportNarrative({ issueAs: issueAs });
      runExport(kind, ids, shape, issueAs);
    });
    var modal = h("div", { class: "modal-backdrop" }, [
      h("div", { class: "modal export-modal" }, [
        h("div", { class: "modal-h" }, [
          h("h2", { text: kind === "xlsx" ? "Export scope - Excel" : "Word export" }),
          h("button", { class: "btn ghost", style: "color:var(--text);", onClick: closeModal, text: "Close" })
        ]),
        h("div", { class: "modal-b" }, [
          many ? h("p", { class: "muted", style: "margin-top:0;", text: "Choose which " + pluralLabel(noun) + " to include in the report. All are selected by default." }) : null,
          many ? h("div", { class: "export-scope-list" }, rows) : null,
          shapeRow,
          many && !canOrgWide ? h("p", { class: "muted", style: "margin-bottom:0;", text: scopeNote }) : null,
          issueBlock
        ]),
        h("div", { class: "modal-f" }, [
          h("button", { class: "btn", onClick: closeModal, text: "Cancel" }),
          exportBtn
        ])
      ])
    ]);
    document.body.appendChild(modal);
    refs.modal = modal;
    recheck();
  }

  // ---- sidebar ----------------------------------------------------------

  // Which instrument-family groups are expanded. Module-local so the choice
  // survives the re-renders the engine fires. Absent key = expanded (default).
  var famExpanded = {};
  // When true, the Instrument selector is collapsed to show only the active
  // instrument (the rest of the picker is hidden behind the section toggle).
  //
  // Collapsed is the working default: you choose an instrument once and then
  // spend the engagement in the Capture nav below it. Left expanded, twenty
  // instruments push Capture more than a screen down the sidebar, which on a
  // 1366x768 laptop means no capture nav is visible at all. Selecting an
  // instrument collapses the picker automatically; the choice is remembered
  // across sessions so anyone who prefers the full list keeps it.
  var instrumentSectionCollapsed = true;
  try {
    var storedCollapse = localStorage.getItem("ot-instrument-picker");
    if (storedCollapse === "expanded") instrumentSectionCollapsed = false;
  } catch (e) {}

  function setInstrumentSectionCollapsed(next) {
    instrumentSectionCollapsed = next;
    try { localStorage.setItem("ot-instrument-picker", next ? "collapsed" : "expanded"); } catch (e) {}
  }

  // ---- slim sidebar -----------------------------------------------------
  //
  // Collapsed, the sidebar becomes a 64px rail: a short token per row, with
  // badges kept (so the rail doubles as a strip of domain grades) and the
  // labels hidden. It stays collapsed until the control is clicked again -
  // the tokens themselves are the navigation. No hover expansion: on a small
  // screen a panel that springs open over the capture page hides the work,
  // and on a touch screen nothing would trigger it. The choice is remembered.
  //
  // This is for smaller screens, where the requirement cards want the width:
  // evidence and recommendation boxes on a 1366px laptop are noticeably
  // cramped with a 260px sidebar taking a fifth of the screen.
  var sidebarSlim = false;
  try { sidebarSlim = localStorage.getItem("ot-sidebar") === "slim"; } catch (e) {}

  function applySidebarSlim() {
    var app = document.querySelector(".app");
    if (app) {
      if (sidebarSlim) app.classList.add("sidebar-slim");
      else app.classList.remove("sidebar-slim");
    }
  }
  function setSidebarSlim(next) {
    sidebarSlim = !!next;
    try { localStorage.setItem("ot-sidebar", sidebarSlim ? "slim" : "full"); } catch (e) {}
    applySidebarSlim();
    buildSidebar();
  }

  // Words that carry no meaning in a two-letter token.
  var SLIM_SKIP = { and: 1, of: 1, the: 1, to: 1, for: 1, in: 1, a: 1, an: 1, on: 1 };

  // The token a row shows when the sidebar is a rail. A leading code (FR1,
  // SR 3, P2) is already the shortest true name for the row, so it wins;
  // otherwise the initials of the first two words that mean anything.
  function slimToken(text) {
    var code = /^([A-Za-z]{1,3})\s?(\d+[A-Za-z]?)\b/.exec(text);
    if (code) return (code[1] + code[2]).toUpperCase();
    var words = String(text).split(/[\s/,&-]+/).filter(function (w) {
      return w && !SLIM_SKIP[w.toLowerCase()];
    });
    if (!words.length) return "•";
    return words.slice(0, 2).map(function (w) { return w.charAt(0); }).join("").toUpperCase();
  }

  function buildSidebar() {
    refs.sidebar.innerHTML = "";
    var s = h("div", null, []);

    // Instrument selector. Instruments are grouped under a family heading
    // (ISA/IEC 62443, Regulation, Generic). Grouping is order-independent: we
    // bucket by family preserving first-seen order of both families and
    // their members, so peer instruments stay under one heading even when
    // the index interleaves families. Each instrument is still its own row -
    // peers (e.g. 2-1:2010 and 2-1:2024) are NOT merged and there is no
    // edition switch. Anything without a family renders flat at the end.
    function instrumentItem(inst, grouped) {
      var isActive = E.state.instrument && E.state.instrument.id === inst.id;
      return h("div", {
        class: "nav-item" + (isActive ? " active" : "") + (grouped ? " nav-item-family-child" : ""),
        onClick: function () { E.activateInstrument(inst.id); }
      }, [
        h("span", null, [inst.title]),
        inst.status === "placeholder" ? h("span", { class: "badge", text: "stub" }) : null
      ]);
    }

    // With nothing chosen the picker page in the main area IS the instrument
    // list, so repeating it here would be noise. The sidebar stays empty until
    // there is an assessment to navigate.
    if (!E.state.instrument) { finishSidebar(s); return; }

    // Section header doubles as a collapse toggle: collapsed shows only the
    // active instrument, so the picker gets out of the way once you're working.
    var collapsed = instrumentSectionCollapsed;
    s.appendChild(h("div", {
      class: "nav-section-title nav-section-toggle" + (collapsed ? " collapsed" : ""),
      title: collapsed ? "Show the full instrument list" : "Collapse to the selected instrument only",
      onClick: function () { setInstrumentSectionCollapsed(!instrumentSectionCollapsed); buildSidebar(); }
    }, [
      h("span", null, ["Assessment"]),
      h("span", { class: "nav-section-chevron", text: collapsed ? "▸" : "▾" })
    ]));

    if (collapsed) {
      // The active instrument, its overall progress, and the two ways to move:
      // "change" opens the full picker page (with purposes and per-assessment
      // progress); the chevron above expands the list here for quick flipping
      // between two frameworks you are working in parallel.
      // With more than one assessment of this instrument in the file, the title
      // alone no longer says which one you are in.
      var siblings = E.assessmentsFor ? E.assessmentsFor(E.state.instrument.id) : [];
      var openAss = E.activeAssessment && E.activeAssessment();
      s.appendChild(h("div", { class: "nav-current" }, [
        h("div", { class: "nav-current-title", text: E.state.instrument.title }),
        (siblings.length > 1 && openAss)
          ? h("div", { class: "nav-current-which",
              title: "This file holds " + siblings.length + " assessments of this instrument",
              text: window.App.Storage.assessmentLabel(openAss, E.state.instrument) })
          : null,
        instrumentProgressNode(E.state.instrument),
        h("button", {
          class: "nav-change",
          title: "Choose a different assessment. Everything captured here is kept.",
          onClick: function (ev) { ev.stopPropagation(); go("home"); }
        }, [
          h("span", { class: "nav-change-icon", "aria-hidden": "true", text: "⇄" }),
          h("span", { text: "Switch assessment" })
        ])
      ]));
    } else {
      var famOrder = [];
      var famItems = {};
      var ungrouped = [];
      E.state.instruments.forEach(function (inst) {
        if (inst.family) {
          if (!famItems[inst.family]) { famItems[inst.family] = []; famOrder.push(inst.family); }
          famItems[inst.family].push(inst);
        } else {
          ungrouped.push(inst);
        }
      });
      orderedFamilies(famOrder).forEach(function (fam) {
        var open = famExpanded[fam] !== false; // default expanded
        s.appendChild(h("div", {
          class: "nav-family-title" + (open ? " open" : ""),
          onClick: function () { famExpanded[fam] = !open; buildSidebar(); }
        }, [
          h("span", { class: "fam-chevron", text: open ? "▾" : "▸" }),
          " ",
          h("span", null, [instrumentFamilyName(fam)])
        ]));
        if (open) builtFirst(famItems[fam]).forEach(function (inst) { s.appendChild(instrumentItem(inst, true)); });
      });
      ungrouped.forEach(function (inst) { s.appendChild(instrumentItem(inst, false)); });
    }

    if (E.state.instrument.status === "placeholder") {
      finishSidebar(s);
      return;
    }

    // engagement / targets / FRs / report
    s.appendChild(h("div", { class: "nav-section-title", text: "Capture" }));
    if (E.state.instrument.status !== "placeholder" && E.state.scoringFamily !== null) {
      s.appendChild(h("div", {
        class: "nav-item nav-find",
        title: "Find a requirement by code or keyword (Ctrl+K)",
        onClick: function () { openFindPalette(); }
      }, [
        h("span", null, ["Find a requirement"]),
        h("span", { class: "kbd", text: "Ctrl K" })
      ]));
    }
    s.appendChild(h("div", {
      class: "nav-item" + (view === "engagement" ? " active" : ""),
      onClick: function () { go("engagement"); }
    }, [h("span", null, ["Engagement details"])]));
    // CRA manages its products (targets) on the engagement details page, so the
    // separate targets page is redundant and hidden for it.
    //
    // For everyone else the row appears once there is genuinely more than one
    // target to switch between. Single-target engagements (the common case) get
    // a one-row table not worth a permanent nav slot: adding and renaming the
    // first one is on the Engagement details page, and every capture page
    // already carries the "+ Site" chip bar. The view itself still works, so a
    // direct go("targets") from anywhere is unaffected.
    if (!isCRA() && (E.state.engagement.targets.length > 1 || view === "targets")) {
      s.appendChild(h("div", {
        class: "nav-item" + (view === "targets" ? " active" : ""),
        onClick: function () { go("targets"); }
      }, [
        h("span", null, [pluralLabel(E.state.instrument.targetDimensionLabel || "Site")]),
        h("span", { class: "badge", text: String(E.state.engagement.targets.length) })
      ]));
    }

    if (E.state.scoringFamily === "domain-letter") {
      buildDomainNav(s);
    } else if (E.state.scoringFamily === "caf-achieved") {
      buildCAFNav(s);
    } else if (E.state.scoringFamily === "program-maturity-ml") {
      buildMLNav(s);
    } else if (E.state.scoringFamily === "nis2-conformance") {
      buildNIS2Nav(s);
    } else if (E.state.scoringFamily === "csms-conformance") {
      if (isCRA()) buildCRANav(s); else buildCSMSNav(s);
    } else if (E.state.scoringFamily === "risk-appetite-coherence") {
      buildRiskAppetiteNav(s);
    } else {
      buildFRNav(s);
    }

    s.appendChild(h("div", { class: "nav-section-title", text: "Report" }));
    s.appendChild(h("div", {
      class: "nav-item" + (view === "report" ? " active" : ""),
      onClick: function () { go("report"); }
    }, [h("span", null, ["Preview"])]));
    // The Word report itself, page by page, beside the report page where the
    // report is written and edited.
    if (window.App.DocPreview && window.App.DocxImport) s.appendChild(h("div", {
      class: "nav-item" + (view === "word-preview" ? " active" : ""), id: "nav-word-preview",
      onClick: function () { go("word-preview"); }
    }, [h("span", null, ["Word preview"])]));

    finishSidebar(s);
  }

  // Keyboard access for the sidebar: every nav row and family heading is
  // focusable and activates with Enter/Space (they are divs, not buttons).
  function finishSidebar(s) {
    Array.prototype.forEach.call(s.querySelectorAll(".nav-item, .nav-family-title"), function (el) {
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
    });
    slimifyRows(s);
    s.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      var t = ev.target;
      while (t && t !== s && !(t.classList && (t.classList.contains("nav-item") || t.classList.contains("nav-family-title")))) t = t.parentNode;
      if (t && t !== s) { ev.preventDefault(); t.click(); }
    });
    refs.sidebar.appendChild(sidebarToggle());
    refs.sidebar.appendChild(s);
    refs.sidebar.appendChild(h("button", {
      type: "button", class: "sidebar-legal", title: LEGAL_NOTICE + " Click to read the licence.",
      onClick: openLicence
    }, [
      appVersion() ? h("span", { class: "sidebar-version", text: appVersion().product + " " + appVersion().label }) : null,
      h("span", { text: LEGAL_SHORT }),
      h("span", { class: "sidebar-legal-link", text: "Licence terms" })
    ]));
  }

  // Ownership notice. The tool goes to contractors, so every screen says whose
  // it is and that use is licensed. The terms open in a pop-up, carried in as
  // data from LICENCE.txt, so the tool needs nothing sent alongside it.
  var LEGAL_SHORT = "© 2026 SolutionsPT. All rights reserved.";
  var LEGAL_NOTICE = "© 2026 SolutionsPT. All rights reserved. Proprietary and confidential. " +
    "Licensed only for work commissioned by SolutionsPT; it may not be resold, shared or used for any other " +
    "client or purpose.";

  function openLicence() {
    closeModal();
    var text = (window.App.Data && window.App.Data.shared && window.App.Data.shared.licence) || "";
    var close = h("button", { class: "btn primary", onClick: closeModal, text: "Close" });
    var modal = h("div", { class: "modal-backdrop licence-modal" }, [
      h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Licence" }, [
        h("div", { class: "modal-h" }, [
          h("h2", { text: "Licence" }),
          h("button", { class: "btn ghost", style: "color:var(--text);", onClick: closeModal, text: "Close" })
        ]),
        h("div", { class: "modal-b" }, [
          appVersion() ? h("p", { class: "licence-version muted small",
            text: appVersion().product + " " + appVersion().label + " (version " + appVersion().number + ")" }) : null,
          text ? h("pre", { class: "licence-text", text: text })
               : h("p", { text: LEGAL_NOTICE + " The full licence text is missing from this copy; ask your SolutionsPT engagement contact for it." })
        ]),
        h("div", { class: "modal-f" }, [close])
      ])
    ]);
    // Click outside the dialog, or Escape, closes it like the Close buttons.
    modal.addEventListener("click", function (ev) { if (ev.target === modal) closeModal(); });
    modal.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { ev.preventDefault(); closeModal(); } });
    document.body.appendChild(modal);
    refs.modal = modal;
    close.focus();
  }

  // Every row gets its rail token and a title, whichever state the sidebar is
  // in - the rail must not need a re-render to be correct, and the title is
  // worth having at full width too on the rows that truncate.
  function slimifyRows(s) {
    Array.prototype.forEach.call(s.querySelectorAll(".nav-item"), function (el) {
      if (el.querySelector(".nav-slim")) return;
      // The label is the first span that is not a badge or a shortcut hint.
      var label = null;
      Array.prototype.forEach.call(el.children, function (c) {
        if (label || c.tagName !== "SPAN") return;
        if (c.classList.contains("badge") || c.classList.contains("kbd")) return;
        label = c;
      });
      var text = (label ? label.textContent : el.textContent).trim();
      if (label) label.classList.add("nav-label");
      if (!el.getAttribute("title")) el.setAttribute("title", text);
      // Find has no sensible initials ("FA"), and would collide with the FR
      // rows besides.
      var token = el.classList.contains("nav-find") ? "⌕" : slimToken(text);
      el.insertBefore(h("span", { class: "nav-slim", "aria-hidden": "true", text: token }), el.firstChild);
    });
  }

  function sidebarToggle() {
    return h("button", {
      type: "button",
      class: "sidebar-toggle",
      title: sidebarSlim ? "Expand the sidebar" : "Collapse the sidebar to a slim rail",
      "aria-label": sidebarSlim ? "Expand the sidebar" : "Collapse the sidebar",
      "aria-pressed": sidebarSlim ? "true" : "false",
      onClick: function () { setSidebarSlim(!sidebarSlim); }
    }, [
      h("span", { class: "sidebar-toggle-icon", "aria-hidden": "true", text: sidebarSlim ? "»" : "«" }),
      h("span", { class: "nav-label", text: "Collapse" })
    ]);
  }

  // ---- risk appetite -----------------------------------------------------
  // Setup first, because the sector baseline and the technical-layer toggle
  // shape what the rest of the assessment even asks. Section badges show the
  // BAND, never a grade colour: there is no good end to either axis, so
  // painting "tolerant" red would be the tool taking a position it has no
  // business taking.
  function buildRiskAppetiteNav(s) {
    var scored = E.scoreActiveTarget();
    s.appendChild(h("div", { class: "nav-section-title", text: "Setup" }));
    s.appendChild(h("div", {
      class: "nav-item" + (view === "ra-setup" ? " active" : ""),
      title: "Sector baseline and the optional technical layer",
      onClick: function () { go("ra-setup"); }
    }, [
      h("span", { class: "nav-slim", "aria-hidden": "true", text: "SU" }),
      h("span", { class: "nav-label" }, ["Sector and scope"])
    ]));

    s.appendChild(h("div", { class: "nav-section-title", text: "Capture" }));
    // First, because this instrument IS a structured interview - one prompt on
    // screen is how it is actually conducted.
    s.appendChild(h("div", {
      class: "nav-item" + (view === "ra-wizard" ? " active" : ""),
      title: "One item per page, for interview-led work",
      onClick: function () { enterRiskAppetiteWizard(view === "ra-wizard" ? raWizardIdx : 0); }
    }, [
      h("span", { class: "nav-slim", "aria-hidden": "true", text: "GW" }),
      h("span", { class: "nav-label" }, ["Guided wizard"]),
      h("span", { class: "badge", text: "1 / page" })
    ]));
    E.getRiskAppetiteSections().forEach(function (sec) {
      var res = scored ? (scored.sections || []).filter(function (x) { return x.sectionId === sec.id; })[0] : null;
      var badge = res && res.bandLabel
        ? h("span", { class: "badge neutral", text: res.bandLabel })
        : h("span", { class: "badge", text: res ? (res.answeredCount + "/" + res.itemCount) : "" });
      s.appendChild(h("div", {
        class: "nav-item" + (view === "ra-section" && viewFR === sec.id ? " active" : ""),
        title: sec.name,
        onClick: function () { go("ra-section", sec.id); }
      }, [
        h("span", { class: "nav-slim", "aria-hidden": "true", text: sec.id.slice(0, 2) }),
        h("span", { class: "nav-label" }, [sec.name]),
        badge
      ]));
    });

    // The consultant's final say on the fit. Last, because it is the
    // conclusion - but a nav item of its own, because it is a judgement to be
    // made deliberately rather than a field at the bottom of a long page.
    var v = scored && scored.verdict;
    s.appendChild(h("div", { class: "nav-section-title", text: "Verdict" }));
    s.appendChild(h("div", {
      class: "nav-item" + (view === "ra-verdict" ? " active" : ""),
      title: "The coherence read, and your final say on it",
      onClick: function () { go("ra-verdict"); }
    }, [
      h("span", { class: "nav-slim", "aria-hidden": "true", text: "VD" }),
      h("span", { class: "nav-label" }, ["Assessor's read"]),
      // Short in the sidebar; the full "Aligned, leaning under-protected" is the tooltip.
      v && v.label ? h("span", { class: "badge neutral", title: v.displayLabel || v.label,
        text: (v.lean ? "Aligned (leaning)" : v.label) + (v.overridden ? " *" : "") }) : null
    ]));
  }

  function buildFRNav(s) {
    s.appendChild(h("div", { class: "nav-section-title", text: "Foundational requirements" }));
    s.appendChild(h("div", {
      class: "nav-item" + (view === "sl-wizard" ? " active" : ""),
      onClick: function () { enterSLWizard(view === "sl-wizard" ? slWizardIdx : 0); }
    }, [ h("span", null, ["Guided wizard"]), h("span", { class: "badge", text: "1 / page" }) ]));
    var scored = E.scoreActiveTarget();
    var onSharedNav = E.isSharedScope(E.state.activeTargetId);
    E.state.taxonomy.frs.forEach(function (fr) {
      var frRes = scored ? scored.perFR.filter(function (f) { return f.frId === fr.id; })[0] : null;
      var badgeCls = "";
      var badgeTxt = "";
      if (onSharedNav) {
        // Nobody is expected to answer everything system-wide, so the badge
        // counts what HAS been recorded here rather than what is outstanding.
        var recorded = frRes ? (frRes.countedCount - frRes.unassessedCount) : 0;
        badgeCls = recorded > 0 ? "met" : "na";
        badgeTxt = recorded > 0 ? String(recorded) : "-";
      } else if (!frRes || !frRes.inScope) {
        // SL-T 0: the FR is deliberately out of scope, not merely unanswered.
        badgeCls = "na"; badgeTxt = "SL 0";
      } else if (frRes.unassessedCount === frRes.countedCount) {
        // Nothing assessed yet - show the size of the job at this SL-T.
        badgeTxt = String(frRes.countedCount);
      } else if (frRes.frTargetMet) {
        badgeCls = "met"; badgeTxt = "met";
      } else if (frRes.frTargetStatus === "incomplete") {
        // Nothing answered falls short; only blanks hold it open.
        badgeCls = "near"; badgeTxt = frRes.unassessedCount + " left";
      } else if (frRes.unassessedCount > 0) {
        badgeCls = "gap"; badgeTxt = frRes.unassessedCount + " left";
      } else {
        badgeCls = "gap"; badgeTxt = S.formatSL(frRes.conformantAchievedSL);
      }
      s.appendChild(h("div", {
        class: "nav-item" + (view === "fr" && viewFR === fr.id ? " active" : ""),
        onClick: function () { go("fr", fr.id); }
      }, [
        h("span", null, [fr.id + " - " + fr.name]),
        h("span", { class: "badge " + badgeCls, text: badgeTxt })
      ]));
    });
  }

  // ---- CAF sidebar (objectives collapsible into principles) ------------
  // Module-local map of expanded objectives so the user's "open/closed"
  // state survives the renderFRPage-style re-renders the engine fires.
  var cafExpandedObj = {};

  function buildCAFNav(s) {
    var scored = E.scoreActiveTarget();

    // Guided wizard: one contributing outcome per page through every objective.
    // Same answers as the list view (they flow both ways through the engine).
    //
    // It sits directly under the shared "Capture" heading with the other
    // capture entry points. It used to come after the profile picker under a
    // SECOND "Capture" heading, which split the sidebar into two identically
    // titled sections either side of the picker.
    s.appendChild(h("div", {
      class: "nav-item" + (view === "caf-wizard" ? " active" : ""),
      onClick: function () { enterCAFWizard(view === "caf-wizard" ? cafWizardIdx : 0); }
    }, [
      h("span", null, ["Guided wizard"]),
      h("span", { class: "badge", text: "1 / page" })
    ]));

    // Two-step profile picker: step 1 = sector/regulator, step 2 = level
    // (Basic/Enhanced). With 14 regulator profiles a flat list is unusable,
    // so the registry is grouped by sectorRegulator+sector. The picker is
    // built from the active profile id (the single source of truth in the
    // engine), so closing/reopening or re-rendering preserves the choice.
    s.appendChild(h("div", { class: "nav-section-title", text: cafDisp().profileTitle }));
    buildCAFProfilePicker(s);

    // Objectives nav: A/B/C/D, each collapsible into its principles.
    s.appendChild(h("div", { class: "nav-section-title", text: cafDisp().objectiveTitle }));
    var objectives = E.getCAFObjectives();
    var principles = E.getCAFPrinciples();

    objectives.forEach(function (obj) {
      var open = !!cafExpandedObj[obj.id];
      var objRes = scored ? scored.byObjective.filter(function (x) { return x.objectiveId === obj.id; })[0] : null;
      var badgeTxt = objRes ? (objRes.answered + "/" + objRes.total) : "";
      var header = h("div", {
        class: "nav-item caf-obj-header" + (open ? " open" : ""),
        onClick: function () {
          cafExpandedObj[obj.id] = !cafExpandedObj[obj.id];
          updateSummaryNavBadges();
        }
      }, [
        h("span", null, [
          h("span", { class: "caf-obj-chevron", text: open ? "▾" : "▸" }),
          " ",
          h("strong", { text: obj.id }),
          " " + obj.name
        ]),
        h("span", { class: "badge", text: badgeTxt })
      ]);
      s.appendChild(header);

      if (!open) return;
      var prinsInObj = principles.filter(function (p) { return p.objectiveId === obj.id; });
      prinsInObj.forEach(function (p) {
        var pRes = scored ? scored.byPrinciple.filter(function (x) { return x.principleId === p.id; })[0] : null;
        var badge = h("span", { class: "badge", text: pRes ? (pRes.answered + "/" + pRes.total) : "" }, []);
        s.appendChild(h("div", {
          class: "nav-item caf-prin" + (view === "caf-principle" && viewFR === p.id ? " active" : ""),
          onClick: function () { go("caf-principle", p.id); }
        }, [
          h("span", null, [h("strong", { text: p.id }), " " + p.name]),
          badge
        ]));
      });
    });
  }

  // Two-step profile picker rendered into the sidebar. Step 1 chooses the
  // sector/regulator group; step 2 (shown only when the group has both Basic
  // and Enhanced) chooses the level. Native <select>s keep it keyboard- and
  // screen-reader-operable; each control has an associated <label>. The
  // active profile id drives both controls, so the selection is preserved
  // across re-renders and across save/load.
  function buildCAFProfilePicker(s) {
    var groups = E.getCAFProfileGroups();
    var activeId = E.getActiveCAFProfileId();
    var activeKey = E.getCAFGroupKeyForProfile(activeId);
    var activeGroup = groups.filter(function (g) { return g.key === activeKey; })[0] || groups[0];

    // Step 1 - sector / regulator.
    s.appendChild(h("label", { class: "caf-picker-label", for: "caf-sector-select", text: cafDisp().profileStep1Label }));
    var sectorSel = h("select", {
      id: "caf-sector-select",
      class: "caf-profile-select",
      onChange: function (e) {
        var g = groups.filter(function (x) { return x.key === e.target.value; })[0];
        if (!g) return;
        // Selecting a group selects a concrete profile: the single General
        // profile, or the Basic level by default for a regulator group.
        var target = g.isGeneral
          ? g.profiles[0]
          : (g.levels.filter(function (p) { return p.level === "basic"; })[0] || g.levels[0] || g.profiles[0]);
        if (target) E.setCAFProfile(target.id);
      }
    }, []);
    groups.forEach(function (g) {
      var opt = h("option", { value: g.key, text: g.label });
      if (activeGroup && g.key === activeGroup.key) opt.setAttribute("selected", "");
      sectorSel.appendChild(opt);
    });
    s.appendChild(sectorSel);

    // Step 2 - level (only when the group offers Basic and Enhanced).
    if (activeGroup && !activeGroup.isGeneral && activeGroup.levels.length > 0) {
      s.appendChild(h("label", { class: "caf-picker-label", for: "caf-level-select", text: "Level" }));
      var levelSel = h("select", {
        id: "caf-level-select",
        class: "caf-profile-select",
        onChange: function (e) { E.setCAFProfile(e.target.value); }
      }, []);
      activeGroup.levels.forEach(function (p) {
        var meta = E.getCAFProfileMeta(p.id) || {};
        var levelName = p.level === "basic" ? "Basic" : (p.level === "enhanced" ? "Enhanced" : p.level);
        var ver = meta.profileVersion && meta.profileVersion !== "UNSET" ? (" v" + meta.profileVersion) : "";
        var statusTag = p.status === "placeholder" ? " - placeholder" : "";
        var opt = h("option", { value: p.id, text: levelName + ver + statusTag });
        if (p.id === activeId) opt.setAttribute("selected", "");
        levelSel.appendChild(opt);
      });
      s.appendChild(levelSel);
    }

    // Persistent placeholder notice. For a placeholder profile this must be
    // unmissable: it states plainly that the regulator's expected-state
    // mapping is NOT loaded, so outcomes are not measured against an expected
    // state and the profile is not silently treated as expected-Achieved.
    s.appendChild(cafProfileNotice());
  }

  // The persistent profile notice shown under the picker. For a PLACEHOLDER
  // profile this is an unmissable warning that expected states are not loaded.
  // For a loaded/active profile there is nothing to warn about, and repeating
  // "Profile selected: X" just duplicates the dropdown (and, on the engagement
  // page, the profiles table's "Active" pill), so we render nothing.
  function cafProfileNotice() {
    var meta = E.getActiveCAFProfileMeta() || {};
    var name = meta.name || "General CAF";
    if (meta.status === "placeholder") {
      return h("div", { class: "caf-placeholder-banner",
        title: "This profile's expected-state data has not yet been loaded; gap comparison is unavailable."
      }, [
        h("strong", { text: "Profile selected: " + name }),
        h("div", { style: "margin-top:4px;", text:
          "Expected states not loaded yet. Outcomes are not compared against an expected state until this profile is filled in from the published source." })
      ]);
    }
    return h("span", { class: "hidden" });
  }

  function buildDomainNav(s) {
    s.appendChild(h("div", { class: "nav-section-title", text: "Domains" }));
    var scored = E.scoreActiveTarget();
    // Guided wizard: one question per page through every domain. Same answers
    // as the list view below (shared assessment).
    s.appendChild(h("div", {
      class: "nav-item" + (view === "wizard" ? " active" : ""),
      onClick: function () { enterWizard(0); }
    }, [
      h("span", null, ["Guided wizard"]),
      h("span", { class: "badge", text: "1 / page" })
    ]));
    s.appendChild(h("div", {
      class: "nav-item" + (view === "interview" && !viewFR ? " active" : ""),
      onClick: function () { go("interview"); }
    }, [
      h("span", null, ["All domains"]),
      h("span", { class: "badge", text: String((scored && scored.totalAnswered) || 0) + "/" + String((scored && scored.totalScorable) || 0) })
    ]));
    E.getDomains().forEach(function (d) {
      var dRes = scored ? scored.perDomain.filter(function (x) { return x.domainId === d.id; })[0] : null;
      var badgeCls = "neutral";
      var badgeChildren = [];
      if (dRes && dRes.grade) {
        badgeCls = gradeLetterClass(dRes.grade);
        badgeChildren.push(document.createTextNode(dRes.grade));
        // Provisional is signalled by the small circled P marker (same visual
        // language as the main report and KPIs); the grade letter's colour
        // stays true to the A-F scale.
        if (dRes.lowCoverage) {
          badgeChildren.push(h("span", {
            class: "pmark sm",
            title: "Provisional: coverage below threshold"
          }, ["P"]));
        }
      } else if (dRes) {
        badgeChildren.push(document.createTextNode(dRes.answeredCount + "/" + dRes.scorableCount));
      }
      s.appendChild(h("div", {
        class: "nav-item" + (view === "interview" && viewFR === d.id ? " active" : ""),
        onClick: function () { go("interview", d.id); }
      }, [
        // Posture domain names already start with the human word (e.g.
        // "Governance and risk"); the abbreviated code is shown only on the
        // domain page heading. Dropping "Gov - " here frees the line for the
        // letter grade and the provisional marker.
        h("span", null, [d.name]),
        h("span", { class: "badge " + badgeCls }, badgeChildren)
      ]));
    });
  }

  // Overall progress for the whole assessment, shown under the instrument name
  // in the collapsed sidebar. Per-group badges tell you where the gaps are;
  // this is the one number that says how much of the assessment is left, which
  // otherwise only existed inside the report.
  function instrumentProgressNode(inst) {
    var prog = instrumentProgress(inst);
    if (!prog.total) return null;
    var pct = Math.round(100 * prog.answered / prog.total);
    return h("div", { class: "nav-progress", title: prog.answered + " of " + prog.total + " answered (Unknown and N/A excluded, as in the report)" }, [
      h("div", { class: "nav-progress-bar" }, [
        h("div", { class: "nav-progress-fill" + (pct === 100 ? " done" : ""), style: "width:" + pct + "%;" })
      ]),
      h("span", { class: "nav-progress-txt", text: prog.answered + " / " + prog.total })
    ]);
  }

  function updateSummaryNavBadges() { buildSidebar(); }

  function go(v, fr) {
    // Navigating anywhere ends the current visit to the home screen, so the
    // engagement strip decides its shape afresh next time it is shown.
    if (v !== view) { homeStripMode = null; homeStripFocus = null; homeSearchAutofocused = false; }
    view = v;
    viewFR = fr || null;
    render();
  }

  // ---- main render dispatch --------------------------------------------

  function render() {
    buildSidebar();
    updateEngagementSummary();
    // No instrument chosen (fresh open / after New), or the picker was opened
    // deliberately from the sidebar: the assessment picker IS the page.
    if (!E.state.instrument) { renderHomePage(); return; }
    if (view === "home") { renderHomePage(); return; }
    // The shared layer only exists while there is more than one target to
    // share between; deleting back down to one must not strand the user on it.
    if (E.isSharedScope(E.state.activeTargetId) && !E.supportsSharedScope()) {
      var first = E.state.engagement.targets[0];
      if (first) E.setActiveTarget(first.id);
    }
    if (E.state.instrument.status === "placeholder") { renderPlaceholder(); return; }
    if (view === "engagement") renderEngagementSummaryPage();
    else if (view === "targets") renderTargetsPage();
    else if (view === "fr") renderFRPage(viewFR || E.state.taxonomy.frs[0].id);
    else if (view === "sl-wizard") renderSLWizardPage();
    else if (view === "interview") rerenderCapture();
    else if (view === "wizard") renderWizardPage();
    else if (view === "caf-principle") renderCAFPrinciplePage(viewFR);
    else if (view === "caf-wizard") renderCAFWizardPage();
    else if (view === "ml-element") renderMLElementPage(viewFR);
    else if (view === "ml-wizard") renderMLWizardPage();
    else if (view === "nis2-category") renderNIS2CategoryPage(viewFR);
    else if (view === "nis2-wizard") renderNIS2WizardPage();
    else if (view === "csms-category") renderCSMSCategoryPage(viewFR);
    else if (view === "csms-wizard") renderCSMSWizardPage();
    else if (view === "cra-layer") renderCRALayerPage(viewFR);
    else if (view === "cra-wizard") renderCRAWizardPage();
    else if (view === "ra-setup") renderRiskAppetiteSetupPage();
    else if (view === "ra-section") renderRiskAppetiteSectionPage(viewFR);
    else if (view === "ra-wizard") renderRiskAppetiteWizardPage();
    else if (view === "ra-verdict") renderRiskAppetiteVerdictPage();
    else if (view === "report") renderReportPage();
    else if (view === "word-preview") renderWordPreviewPage();
    else renderEngagementSummaryPage();
    refs.main.classList.toggle("hide-answered", hideAnswered && HIDEABLE_VIEWS.indexOf(view) !== -1);
    flushPendingJump();
  }

  // ---- find & jump to a requirement -------------------------------------
  // A within-instrument quick-find. Ctrl/Cmd+K (or "/") opens a palette; typing
  // filters the active instrument's requirements by code/title/keywords; Enter
  // navigates to the group page holding the item and scrolls to it. Lets the
  // consultant land on a requirement volunteered out of sequence in two
  // keystrokes rather than walking the sidebar.

  var pendingJumpId = null;

  // Maps each scoring family's items to a uniform, searchable, navigable index.
  // view/param are what go() needs to render the page that contains the item.
  function instrumentSearchIndex() {
    var inst = E.state.instrument;
    if (!inst || inst.status === "placeholder") return [];
    var fam = E.state.scoringFamily;
    var C = window.App.Compare;
    var groupNames = C ? C.groupNames(inst, E.state.taxonomy) : {};
    function mk(id, code, label, groupId, view, param, extra) {
      return {
        id: id, code: code || id, label: label || "",
        groupId: groupId || null, groupName: groupId ? (groupNames[groupId] || groupId) : "",
        view: view, param: param,
        hay: ((code || "") + " " + (label || "") + " " + (extra || "")).toLowerCase()
      };
    }
    var out = [];
    if (fam === "capability-sl") {
      (inst.requirements || []).forEach(function (r) { out.push(mk(r.id, r.code, r.title, r.frId, "fr", r.frId, r.rationale)); });
    } else if (fam === "domain-letter") {
      (inst.questions || []).forEach(function (q) { out.push(mk(q.id, q.id, q.prompt, q.domainId, "interview", q.domainId, (q.rationale || "") + " " + (q.goodLooksLike || ""))); });
    } else if (fam === "caf-achieved") {
      (inst.outcomes || []).forEach(function (o) { out.push(mk(o.id, o.id, o.title, o.principleId, "caf-principle", o.principleId, o.rationale)); });
    } else if (fam === "program-maturity-ml") {
      (inst.requirements || []).forEach(function (r) { out.push(mk(r.id, r.code, r.title, r.elementId, "ml-element", r.elementId, (r.rationale || "") + " " + (r.verbatimText || ""))); });
    } else if (fam === "nis2-conformance") {
      (inst.items || []).forEach(function (it) { out.push(mk(it.id, it.code, it.title, it.categoryId, "nis2-category", it.categoryId, (it.requirement || "") + " " + (it.rationale || ""))); });
    } else if (fam === "csms-conformance" && isCRA()) {
      // Layered CRA: items live in `items` keyed by layerId; only in-scope
      // layers are navigable (out-of-scope layers have no capture page).
      var inScope = E.getCRASetup().layers;
      (inst.items || []).forEach(function (it) {
        if (inScope.indexOf(it.layerId) === -1) return;
        out.push(mk(it.id, it.code, it.title, it.layerId, "cra-layer", it.layerId, (it.requirement || "") + " " + (it.rationale || "")));
      });
    } else if (fam === "csms-conformance") {
      (inst.requirements || []).forEach(function (el) { out.push(mk(el.id, el.code, el.title, el.categoryId, "csms-category", el.categoryId, (el.verbatimText || "") + " " + (el.rationale || ""))); });
    }
    return out;
  }

  function searchInstrument(index, query) {
    var q = (query || "").trim().toLowerCase();
    if (!q) return index.slice(0, 50);
    var terms = q.split(/\s+/);
    var scored = [];
    index.forEach(function (e) {
      // Every term must appear somewhere in the haystack (code + title + keywords).
      var all = terms.every(function (t) { return e.hay.indexOf(t) !== -1; });
      if (!all) return;
      var code = e.code.toLowerCase();
      var title = e.label.toLowerCase();
      var rank = 3;
      if (code === q) rank = 0;
      else if (code.indexOf(q) === 0) rank = 1;
      else if (title.indexOf(q) === 0) rank = 2;
      else if (code.indexOf(q) !== -1) rank = 2.5;
      scored.push({ e: e, rank: rank });
    });
    scored.sort(function (a, b) { return a.rank - b.rank || a.e.code.localeCompare(b.e.code); });
    return scored.slice(0, 50).map(function (x) { return x.e; });
  }

  function jumpToRequirement(entry) {
    pendingJumpId = entry.id;
    go(entry.view, entry.param);
  }

  // After a render that followed a jump, scroll the target requirement into
  // view and flash it. One-shot; cleared whether or not the node was found.
  function flushPendingJump() {
    if (!pendingJumpId) return;
    var id = pendingJumpId;
    pendingJumpId = null;
    // After layout, so the scroll lands. A frame is the usual moment, but a
    // browser can hold frames back (a background window, a busy headless run),
    // so a short timer stands in for it: whichever comes first does the work.
    var done = false;
    function reveal() {
      if (done) return;
      done = true;
      var sel = '[data-req-id="' + String(id).replace(/"/g, '\\"') + '"]';
      var el = refs.main.querySelector(sel);
      if (!el) return;
      if (el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("jump-flash");
      window.setTimeout(function () { el.classList.remove("jump-flash"); }, 2200);
    }
    if (typeof window.requestAnimationFrame === "function") window.requestAnimationFrame(reveal);
    window.setTimeout(reveal, 60);
  }

  // ---- find palette (overlay) -------------------------------------------
  var findState = null;   // { node, input, list, results, active } when open

  function openFindPalette() {
    if (findState) { findState.input.focus(); return; }
    if (!E.state.instrument || E.state.instrument.status === "placeholder") {
      toast("Open a functional instrument to search its requirements.", "warn");
      return;
    }
    var index = instrumentSearchIndex();
    if (index.length === 0) { toast("Nothing to search in this instrument yet.", "warn"); return; }

    var input = h("input", {
      type: "text", class: "find-input",
      placeholder: "Find a requirement by code or keyword (e.g. backups, SR 1.1)…",
      "aria-label": "Find a requirement"
    });
    var list = h("div", { class: "find-results" }, []);
    var box = h("div", { class: "find-box", onClick: function (e) { e.stopPropagation(); } }, [
      input,
      list,
      h("div", { class: "find-hint muted", text: "↑↓ to move · Enter to jump · Esc to close" })
    ]);
    var backdrop = h("div", { class: "find-backdrop", onClick: closeFindPalette }, [box]);
    document.body.appendChild(backdrop);

    findState = { node: backdrop, input: input, list: list, results: [], active: 0 };

    input.addEventListener("input", function () { refreshFindResults(index, input.value); });
    input.addEventListener("keydown", onFindKeydown);
    refreshFindResults(index, "");
    input.focus();
  }

  function closeFindPalette() {
    if (!findState) return;
    try { document.body.removeChild(findState.node); } catch (e) {}
    findState = null;
  }

  function refreshFindResults(index, query) {
    if (!findState) return;
    var results = searchInstrument(index, query);
    findState.results = results;
    findState.active = 0;
    findState.list.innerHTML = "";
    if (results.length === 0) {
      var emptyMsg = "No matching requirement.";
      // Layered CRA searches only the layers in scope - say so, or a consultant
      // hunting a P1 item with P1 toggled off gets an inexplicable blank.
      if (isCRA() && E.getCRASetup().layers.length < (E.state.instrument.layers || []).length) {
        emptyMsg += " Some layers are out of scope for this engagement, so their requirements are not searchable.";
      }
      findState.list.appendChild(h("div", { class: "find-empty muted", text: emptyMsg }));
      return;
    }
    results.forEach(function (e, i) {
      var row = h("div", {
        class: "find-result" + (i === 0 ? " active" : ""),
        onClick: function () { closeFindPalette(); jumpToRequirement(e); }
      }, [
        h("span", { class: "find-result-code", text: e.code }),
        h("span", { class: "find-result-title", text: e.label }),
        e.groupName ? h("span", { class: "find-result-group", text: e.groupName }) : null
      ]);
      row.addEventListener("mousemove", function () { setFindActive(i); });
      findState.list.appendChild(row);
    });
  }

  function setFindActive(i) {
    if (!findState || findState.results.length === 0) return;
    var n = findState.results.length;
    findState.active = ((i % n) + n) % n;
    var rows = findState.list.querySelectorAll(".find-result");
    for (var k = 0; k < rows.length; k++) rows[k].classList.toggle("active", k === findState.active);
    if (rows[findState.active] && rows[findState.active].scrollIntoView) {
      rows[findState.active].scrollIntoView({ block: "nearest" });
    }
  }

  function onFindKeydown(e) {
    if (!findState) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setFindActive(findState.active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFindActive(findState.active - 1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      var chosen = findState.results[findState.active];
      if (chosen) { closeFindPalette(); jumpToRequirement(chosen); }
    } else if (e.key === "Escape") { e.preventDefault(); closeFindPalette(); }
  }

  function updateEngagementSummary() {
    var el = $("engagement-summary");
    if (!E.state.engagement) { el.innerHTML = ""; return; }
    var e = E.state.engagement.engagement;
    var t = E.getActiveTarget();
    var bits = [];
    if (e.clientName) bits.push(e.clientName);
    if (e.siteName)   bits.push(e.siteName);
    if (t)            bits.push(t.name);
    el.textContent = bits.join("  -  ");

    // CAF: keep the active profile name visible in the persistent header on
    // every assessment screen, so the consultant cannot forget which profile
    // they are scoring against. Placeholder profiles are flagged here too.
    if (E.state.scoringFamily === "caf-achieved") {
      var meta = E.getActiveCAFProfileMeta() || {};
      var chip = h("span", {
        class: "engagement-profile-chip" + (meta.status === "placeholder" ? " placeholder" : ""),
        title: meta.status === "placeholder"
          ? "Placeholder profile: expected states not yet populated"
          : "Active CAF profile: outcomes are compared against its expected states"
      }, [
        document.createTextNode("Profile: " + (meta.name || "General CAF")),
        meta.status === "placeholder" ? h("span", { class: "chip-tag", text: "placeholder" }) : null
      ]);
      if (bits.length > 0) el.appendChild(document.createTextNode("    "));
      el.appendChild(chip);
    }
  }

  // ---- placeholder instruments -----------------------------------------

  function renderPlaceholder() {
    var inst = E.state.instrument;
    refs.main.innerHTML = "";
    var card = h("div", { class: "coming-soon" }, [
      h("div", { class: "tag", text: "Coming soon" }),
      h("h2", { text: inst.title }),
      h("p", { text: inst.comingSoon || "This instrument is a placeholder. Its content and scoring will come in a later release." }),
      h("div", { class: "muted" }, [
        h("div", null, ["Scoring family: " + (inst.scoringFamily || "-")]),
        h("div", null, ["Target dimension: " + (inst.targetDimensionLabel || "-")]),
      ])
    ]);
    refs.main.appendChild(card);
  }

  // ---- engagement details page -----------------------------------------

  // A short "what this assessment is and what it aims to do" paragraph shown at
  // the top of the engagement page. An instrument can override the copy with
  // display.about; otherwise per-family text is used, interpolating the title.
  function engagementAboutText() {
    var inst = E.state.instrument;
    var d = (inst && inst.display) || {};
    if (d.about) return d.about;
    var title = inst.title;
    switch (E.state.scoringFamily) {
      case "capability-sl":
        return "This assessment measures the security capability of the in-scope system against " + title + ", requirement by requirement, for the target security level set for the engagement. It shows where current capability meets the target and where it falls short, then turns the shortfalls into a prioritised remediation roadmap. It is an advisory gap analysis to guide hardening and investment, not a certification.";
      case "domain-letter":
        return "This is a lightweight posture screener that profiles the organisation's security across a set of domains through a guided interview. It gives a quick, structured read of relative strengths and weak spots, and a posture profile you can share. It is not a control-by-control audit.";
      case "program-maturity-ml":
        return "This assessment rates the maturity of the security programme against " + title + ", element by element, on a four-level maturity scale. It shows how established and repeatable each part of the programme is, where it needs to mature, and what to prioritise next. It is an advisory maturity review, not a certification.";
      case "nis2-conformance":
        return "This is a conformance and gap analysis against the obligations in " + title + ". It reviews each obligation to find where the organisation already conforms and where work is needed, and produces a prioritised roadmap. It is advisory and is not a determination of legal compliance.";
      case "csms-conformance":
        if (isCRA()) {
          return "This assessment evaluates the product against the essential cybersecurity requirements of " + title + ", layer by layer. It shows where the product already meets the requirements and where gaps remain ahead of any conformity work. It is an advisory gap analysis, not a conformity assessment or certification.";
        }
        return "This assessment reviews the organisation's cyber security management system against " + title + ", element by element, to establish how fully each part is in place and where to focus improvement. It is an advisory conformance review, not a certification.";
      case "caf-achieved":
        return "This is an alignment and gap analysis against " + title + ". It weighs current practice against the expected standard for the selected profile, highlights the gaps that matter most, and produces a prioritised improvement roadmap and a client-ready report. It is an advisory gap analysis, not a formal audit or certification.";
      default:
        return "This assessment reviews the organisation against " + title + " to find where current practice meets the expected standard and where gaps remain, and to produce a prioritised improvement roadmap and a client-ready report. It is an advisory gap analysis, not a formal audit or certification.";
    }
  }

  function engagementAboutCard() {
    return h("div", { class: "card", style: "border-left:3px solid var(--brand-blue);" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "About this assessment" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin:0; font-size:13px; line-height:1.55;", text: engagementAboutText() })
      ])
    ]);
  }

  // ---- assessment picker ("home") ---------------------------------------
  //
  // The screen you land on with no instrument chosen: a fresh open, after New,
  // and whenever you click "change" on the collapsed instrument row in the
  // sidebar. One component, both entry points - so there is only one thing to
  // learn, and switching framework mid-project is the same gesture as picking
  // the first one.
  //
  // Captured answers are per instrument (engine state.assessments), so leaving
  // an instrument never loses work; each card says how much is already in it.

  // Every capture item in an instrument, whatever the family calls them.
  function instrumentItems(inst) {
    if (!inst) return [];
    return inst.outcomes || inst.questions || inst.items || inst.requirements || [];
  }

  // Answered in the same sense the scorers use it: a captured judgement that
  // counts toward a score. Unknown and N/A are deliberate answers but sit
  // outside the profile, so they are excluded here exactly as the scorers
  // exclude them - the card can never claim more progress than the report.
  function responseIsAnswered(r) {
    if (!r) return false;
    if (r.components && Object.keys(r.components).length) return true;   // capability-sl (per item)
    if (typeof r.band === "number") return true;         // domain-letter (0-3)
    // risk-appetite-coherence: the band is a NAMED position on its axis
    // ("severe", "cautious"). Checking for a number only made a finished
    // assessment read 0 / 18 in the sidebar and the picker, which is how the
    // tour demo looked empty while its report was full.
    if (typeof r.band === "string" && r.band !== "") return true;
    // Risk appetite "could not establish": asked about and settled, so done.
    if (r.notEstablished === true) return true;
    if (r.ml) return true;                               // program-maturity-ml
    if (r.state && r.state !== "unknown" && r.state !== "na") return true; // caf / nis2 / csms
    return false;
  }

  // Answered / total for an instrument WITHOUT activating it, so the picker can
  // show progress across every assessment in the project at once. Counts the
  // first target only, matching the per-page numbers the consultant sees.
  function instrumentProgress(inst) {
    var items = instrumentItems(inst);
    // The LATEST assessment of this instrument: the picker row shows how far
    // the current one has got, not a sum across the 2026 and 2028 reviews.
    var forInst = E.assessmentsFor ? E.assessmentsFor(inst.id) : [];
    var ass = forInst.length ? forInst[forInst.length - 1] : null;

    // Risk appetite has an OPTIONAL section. With the technical layer switched
    // off its five items are not part of the assessment, so they are not part
    // of the count either - otherwise a finished assessment reads 13 / 18 for
    // ever. Same rule the scorer's coverage uses.
    var inScope = null;
    if (inst.scoringFamily === "risk-appetite-coherence") {
      var tech = !!(ass && ass.riskAppetiteSetup && ass.riskAppetiteSetup.includeTech);
      var optional = {};
      (inst.sections || []).forEach(function (s) { if (s.optional) optional[s.id] = true; });
      inScope = {};
      items.forEach(function (it) { if (tech || !optional[it.sectionId]) inScope[it.id] = true; });
      items = items.filter(function (it) { return inScope[it.id]; });
    }
    var total = items.length;
    if (!ass || !ass.responses || !ass.responses.length) return { answered: 0, total: total };
    var firstTargetId = (ass.targets && ass.targets[0] && ass.targets[0].id) || null;
    // A capability-SL answer may live on the shared layer and be inherited
    // by every zone, so resolve the first zone against it - otherwise an
    // assessment answered entirely system-wide reads as untouched.
    var sharedId = E.SHARED_TARGET_ID;
    var rows = ass.responses;
    if (inst.scoringFamily === "capability-sl") {
      var shared = rows.filter(function (r) { return r.targetId === sharedId; });
      if (shared.length) {
        rows = window.App.Scoring.resolveResponses(
          rows.filter(function (r) { return r.targetId === firstTargetId; }), shared);
        firstTargetId = null;   // resolveResponses already scoped it
      }
    }
    var seen = {};
    var answered = 0;
    rows.forEach(function (r) {
      if (r.targetId === sharedId) return;
      if (firstTargetId && r.targetId !== firstTargetId) return;
      if (seen[r.requirementId]) return;
      if (inScope && !inScope[r.requirementId]) return;
      seen[r.requirementId] = true;
      if (responseIsAnswered(r)) answered++;
    });
    return { answered: answered, total: total };
  }

  // One line saying what this instrument is for. Instrument data wins
  // (display.homeSummary, then the first sentence of display.about); otherwise
  // we compose from the scoring family, which is what actually determines the
  // shape of the work.
  var FAMILY_PURPOSE = {
    "capability-sl": "Requirement-by-requirement capability against a target security level.",
    "domain-letter": "Fast guided interview producing a letter-graded posture profile.",
    "program-maturity-ml": "Maturity of the security programme on a four-level scale.",
    "nis2-conformance": "Obligation-by-obligation conformance and gap analysis.",
    "csms-conformance": "Element-by-element conformance review.",
    "caf-achieved": "Outcome-based alignment and gap analysis against an expected profile.",
    // Not a gap analysis, and the fallback below would have said it was.
    "risk-appetite-coherence": "Interview-led read of inherent exposure against risk appetite, and how well the two fit."
  };
  function instrumentPurpose(inst) {
    var d = inst.display || {};
    if (d.homeSummary) return d.homeSummary;
    if (d.about) {
      var txt = String(d.about);
      var stop = txt.indexOf(". ");
      var first = stop === -1 ? txt : txt.slice(0, stop + 1);
      if (first && first.length <= 200) return first;
    }
    if (inst.status === "placeholder") return inst.comingSoon || "Not yet implemented.";
    return FAMILY_PURPOSE[inst.scoringFamily] || "Gap analysis against the published framework.";
  }

  // Filter text for the picker, kept module-local so it survives re-renders.
  var homeFilter = "";

  function renderHomePage() {
    refs.main.innerHTML = "";
    var hasInstrument = !!E.state.instrument;
    refs.main.appendChild(h("h1", { class: "page-title", text: hasInstrument ? "Change assessment" : "Start an assessment" }));
    refs.main.appendChild(h("p", { class: "page-sub", text: hasInstrument
      ? "Every assessment keeps its own answers, so switching never loses work. The customer and site are shared across the file; the opportunity, consultant and dates belong to each assessment. You can hold more than one assessment of the same instrument, for example a review this year and a re-assessment in two years' time."
      : "Choose the framework for this engagement. You can add more assessments to the same file later, including another of the same framework, and they will all share the customer and site recorded below." }));

    refs.main.appendChild(homeEngagementStrip());

    // Search box. Filters on title, family and purpose so "nuclear", "NIS2" or
    // "maturity" all land somewhere sensible.
    var search = h("input", {
      type: "text", value: homeFilter, id: "home-filter",
      placeholder: "Filter assessments by name, framework or purpose"
    });
    search.addEventListener("input", function () {
      homeFilter = search.value;
      renderHomeGrid(gridHost);
    });
    refs.main.appendChild(h("div", { class: "home-search" }, [search]));

    var gridHost = h("div", null, []);
    refs.main.appendChild(gridHost);
    renderHomeGrid(gridHost);

    // Land the caret in the filter when the picker first opens, so choosing a
    // framework can start with typing. ONCE per visit, not on every render:
    // committing a field in the engagement strip above re-renders this page,
    // and re-focusing here stole the caret back out of the strip every time a
    // name was entered - the search box grabbed it before the row could hand
    // focus to the next field.
    if (!hasInstrument && !homeSearchAutofocused) {
      homeSearchAutofocused = true;
      setTimeout(function () { try { search.focus(); } catch (e) {} }, 0);
    }

    // The full notice once, on the screen every session starts from.
    refs.main.appendChild(h("p", { class: "home-legal muted small" }, [
      LEGAL_NOTICE + " ",
      h("button", { type: "button", class: "link-btn", onClick: openLicence, text: "Read the licence" })
    ]));
  }

  // Which shape the strip took when this visit to the home screen began, and
  // which of its fields should hold the caret after the next re-render.
  //
  // The shape is decided ONCE per visit, not on every render. Committing a
  // field emits project-changed, which re-renders the whole page; deciding
  // live meant that typing the client name and tabbing on collapsed the strip
  // to its read-only line, and the site, consultant and date could then only
  // be reached by opening Edit details. Sticky for the visit, so all four can
  // be filled in one pass.
  var homeStripMode = null;    // null = decide on next render, then "form" | "line"
  var homeStripFocus = null;   // data-strip-field key to restore focus to
  var homeSearchAutofocused = false;  // the filter takes the caret once per visit

  // The compact engagement strip. Empty project: four editable fields, so
  // starting an engagement is one screen. Already filled: a read-only context
  // line, because mid-project you are here to switch framework, not to retype
  // the client name. The full thirteen fields stay on Engagement details.
  function homeEngagementStrip() {
    var p = E.state.project || {};
    var filled = !!(p.clientName || p.siteName || p.consultant || p.dateOfVisit);
    if (homeStripMode === null) homeStripMode = filled ? "line" : "form";
    // New project wipes the metadata without necessarily changing view, so a
    // sticky "line" would leave an empty engagement showing a blank read-only
    // strip with nothing to edit. Self-heal rather than hunt every caller.
    else if (homeStripMode === "line" && !filled) homeStripMode = "form";

    if (homeStripMode === "line") {
      var bits = [p.clientName, p.siteName].filter(Boolean).join(" - ");
      var who = [p.consultant, p.dateOfVisit].filter(Boolean).join(", ");
      return h("div", { class: "home-strip filled" }, [
        h("div", null, [
          h("span", { class: "home-strip-label", text: "Engagement" }),
          h("strong", { text: bits || "(unnamed)" }),
          who ? h("span", { class: "muted", text: " - " + who }) : null
        ]),
        h("button", { class: "btn", onClick: openEngagementModal, text: "Edit details" })
      ]);
    }

    var FIELDS = [
      ["clientName", "Client", "text"],
      ["siteName", "Site", "text"],
      ["consultant", "Consultant", "text"],
      ["dateOfVisit", "Date of visit", "date"]
    ];
    var inputs = {};
    var cells = FIELDS.map(function (f) {
      var input = h("input", { type: f[2], value: p[f[0]] || "", "data-strip-field": f[0] });
      inputs[f[0]] = input;
      // Commit on change (blur / date pick) rather than per keystroke: the
      // project-changed event re-renders, and we must not fight the caret.
      //
      // Deferred by a tick so the browser finishes moving focus first. `change`
      // fires DURING blur, before the next field has focus, so committing here
      // and re-rendering immediately would rebuild the row and throw the caret
      // out of a tab that was already in flight. One tick later the new field
      // is focused, we note which, and restore it after the render.
      input.addEventListener("change", function () {
        var patch = {}; patch[f[0]] = input.value;
        setTimeout(function () {
          var act = document.activeElement;
          homeStripFocus = (act && act.getAttribute) ? act.getAttribute("data-strip-field") : null;
          E.updateMetadata(patch);
        }, 0);
      });
      return h("div", { class: "field" }, [h("label", { text: f[1] }), input]);
    });

    if (homeStripFocus && inputs[homeStripFocus]) {
      var want = inputs[homeStripFocus];
      homeStripFocus = null;
      setTimeout(function () {
        try {
          want.focus();
          // Date inputs throw on setSelectionRange; text ones keep the caret
          // at the end rather than selecting the whole value.
          if (want.type === "text") want.setSelectionRange(want.value.length, want.value.length);
        } catch (e) {}
      }, 0);
    }

    return h("div", { class: "home-strip" }, [
      h("div", { class: "home-strip-title", text: "Who is this engagement for?" }),
      h("div", { class: "home-fields" }, cells),
      h("p", { class: "muted home-strip-note", text: "Optional for now. These carry into every assessment in the project. The other report details are on the Engagement details page." })
    ]);
  }

  function renderHomeGrid(host) {
    host.innerHTML = "";
    var q = homeFilter.trim().toLowerCase();
    var famOrder = [];
    var famItems = {};
    var matches = 0;

    E.state.instruments.forEach(function (inst) {
      var hay = (inst.title + " " + instrumentFamilyName(inst.family) + " " + (inst.edition || "") + " " + instrumentPurpose(inst)).toLowerCase();
      if (q && hay.indexOf(q) === -1) return;
      matches++;
      var fam = inst.family || "other";
      if (!famItems[fam]) { famItems[fam] = []; famOrder.push(fam); }
      famItems[fam].push(inst);
    });

    if (!matches) {
      host.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-b" }, [h("p", { class: "muted", text: "No assessment matches “" + homeFilter.trim() + "”." })])
      ]));
      return;
    }

    orderedFamilies(famOrder).forEach(function (fam) {
      host.appendChild(h("div", { class: "home-fam-title" }, [
        h("span", { text: instrumentFamilyName(fam) }),
        // The count belongs on the heading: it tells a consultant whether a
        // group is worth opening before they read four card titles to find out.
        h("span", { class: "home-fam-count", text: String(famItems[fam].length) })
      ]));
      host.appendChild(h("div", { class: "home-grid" }, builtFirst(famItems[fam]).map(instrumentCard)));
    });
  }

  function instrumentCard(inst) {
    var isCurrent = E.state.instrument && E.state.instrument.id === inst.id;
    var isStub = inst.status === "placeholder";
    var prog = isStub ? null : instrumentProgress(inst);

    // Only the two states that change what you can do here: which assessment is
    // open, and which cannot be opened at all. The skeleton/indicative flags are
    // deliberately NOT shown - they say something about how far to trust the
    // output, which the capture banner and the report caveats state properly in
    // context. A chip on a menu card was the wrong place to raise it.
    var tags = [];
    if (isCurrent) tags.push(h("span", { class: "pill met", text: "Current" }));
    if (isStub) tags.push(h("span", { class: "pill na", text: "Not yet built" }));

    // Progress reads as work-in-the-project, not as a score.
    var progNode = null;
    if (prog && prog.answered > 0) {
      progNode = h("div", { class: "home-card-prog" }, [
        h("div", { class: "home-card-bar" }, [
          h("div", { class: "home-card-bar-fill", style: "width:" + (prog.total ? Math.round(100 * prog.answered / prog.total) : 0) + "%;" })
        ]),
        h("span", { class: "home-card-prog-txt", text: prog.total ? (prog.answered + " of " + prog.total + " answered") : (prog.answered + " answered") })
      ]);
    } else if (prog && prog.total) {
      progNode = h("span", { class: "home-card-prog-txt muted", text: prog.total + " " + (prog.total === 1 ? "item" : "items") });
    }

    // A customer comes back: the file can hold a 2026 assessment of this
    // instrument and a 2028 one. Where it does, the card lists them so you open
    // the one you mean rather than always landing on the latest.
    var existing = (!isStub && E.assessmentsFor) ? E.assessmentsFor(inst.id) : [];
    var instances = existing.length > 1 ? assessmentPickerList(inst, existing) : null;
    if (existing.length > 1) tags.unshift(h("span", { class: "pill near", text: existing.length + " assessments" }));

    var card = h("div", {
      class: "home-card" + (isCurrent ? " current" : "") + (isStub ? " stub" : ""),
      tabindex: isStub ? "-1" : "0",
      role: "button",
      title: isStub ? "Not yet implemented"
        : (existing.length > 1 ? "Open the most recent " + inst.title : "Open " + inst.title),
      onClick: function () { if (!isStub) chooseInstrument(inst.id); }
    }, [
      h("div", { class: "home-card-top" }, [
        h("h3", { text: inst.title }),
        tags.length ? h("div", { class: "home-card-tags" }, tags) : null
      ]),
      inst.edition ? h("div", { class: "home-card-ed", text: inst.edition }) : null,
      h("p", { class: "home-card-purpose", text: instrumentPurpose(inst) }),
      instances || progNode,
      // Only once there is something to sit alongside: with none, opening the
      // card IS starting the first one.
      (isStub || !existing.length) ? null : h("button", {
        class: "home-card-new",
        text: "+ New assessment",
        title: "Start another assessment of this instrument, alongside the existing one",
        onClick: function (ev) { ev.stopPropagation(); startNewAssessment(inst); }
      })
    ]);

    if (!isStub) {
      card.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); chooseInstrument(inst.id); }
      });
    }
    return card;
  }

  // The assessments of one instrument held in this file, newest last, each
  // openable in its own right. Labelled by visit date and revision, because
  // that is what tells a 2026 review from a 2028 one; a consultant can rename
  // any of them to something they would rather see.
  function assessmentPickerList(inst, existing) {
    var STG = window.App.Storage;
    return h("div", { class: "home-card-instances" }, existing.map(function (ass) {
      var isOpen = E.state.activeAssessmentId === ass.id;
      var answered = (ass.responses || []).length;
      var row = h("div", {
        class: "home-instance" + (isOpen ? " current" : ""),
        role: "button", tabindex: "0",
        title: "Open this assessment",
        onClick: function (ev) { ev.stopPropagation(); homeFilter = ""; E.activateAssessment(ass.id); }
      }, [
        // Two lines: the label can be long (date, revision, or a name the
        // consultant chose) and the card is narrow, so the controls sit under
        // it rather than squeezing it onto two lines of their own.
        h("div", { class: "home-instance-label", text: STG.assessmentLabel(ass, inst) }),
        h("div", { class: "home-instance-foot" }, [
          h("span", { class: "home-instance-meta", text: answered
            ? answered + " answered" : "not started" }),
          h("button", {
            class: "home-instance-rename", text: "Rename", title: "Give this assessment a name of your own",
            onClick: function (ev) {
              ev.stopPropagation();
              var v = prompt("Name for this assessment", STG.assessmentLabel(ass, inst));
              if (v !== null) { E.renameAssessment(ass.id, v); render(); }
            }
          }),
          h("button", {
            class: "home-instance-del", text: "Delete", title: "Remove this assessment from the file",
            onClick: function (ev) {
              ev.stopPropagation();
              if (!confirm("Delete this assessment (" + STG.assessmentLabel(ass, inst) + ")?\n\n" +
                           answered + " captured answer" + (answered === 1 ? "" : "s") +
                           " will be lost. The other assessments in this file are not affected.")) return;
              E.deleteAssessment(ass.id); render();
            }
          })
        ])
      ]);
      row.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); homeFilter = ""; E.activateAssessment(ass.id); }
      });
      return row;
    }));
  }

  function startNewAssessment(inst) {
    homeFilter = "";
    E.newAssessment(inst.id);
    // Land on the engagement page: a new assessment's first job is its own
    // opportunity, consultant and date, which is what tells it from the last one.
    go("engagement");
  }

  function chooseInstrument(id) {
    homeFilter = "";
    E.activateInstrument(id);
  }


  function renderEngagementSummaryPage() {
    var inst = E.state.instrument;
    refs.main.innerHTML = "";
    refs.main.appendChild(h("h1", { class: "page-title", text: inst.title }));
    var subtitle;
    if (E.state.scoringFamily === "domain-letter") {
      subtitle = "Capture engagement details, then walk through the interview by domain from the sidebar.";
    } else if (E.state.scoringFamily === "caf-achieved") {
      subtitle = (inst.display && inst.display.subtitle) || "Alignment and gap analysis against NCSC CAF 4.0 (not a formal assessment). Capture engagement details, pick the regulator profile below, then work through the objectives and principles from the sidebar.";
    } else if (E.state.scoringFamily === "program-maturity-ml") {
      subtitle = window.App.Report.standardRef(inst) + " maturity assessment. Capture engagement details, then set a maturity level (ML1-ML4) per requirement, by " +
        window.App.Report.mlNoun(inst, "elementNounTitle").toLowerCase() + ", from the sidebar.";
    } else if (E.state.scoringFamily === "nis2-conformance") {
      subtitle = "EU NIS2 conformance and gap analysis (not a determination of legal compliance). Capture engagement details, then judge each obligation Achieved / Partially / Not Achieved by NIS2 area from the sidebar.";
    } else if (E.state.scoringFamily === "csms-conformance") {
      subtitle = "ISA/IEC 62443-2-1:2010 CSMS element conformance (not a certification). Capture engagement details, then judge each element Not in place / Partially / Largely / In place by category from the sidebar.";
    } else {
      subtitle = "Capture engagement details, set the target SL per " + (inst.targetDimensionLabel || "Site").toLowerCase() +
        ", then work through the FR tabs in the sidebar.";
    }
    refs.main.appendChild(h("p", { class: "page-sub", text: subtitle }));
    refs.main.appendChild(engagementAboutCard());
    // Instruments may carry hard "read before relying on this" caveats (e.g. the
    // ONR SyAPs instruments: not an ONR assessment, not a security plan, no SNI).
    // The CRA path renders its own caveats lower down, so skip it there.
    if (inst.criticalCaveats && inst.criticalCaveats.length && !(E.state.scoringFamily === "csms-conformance" && isCRA())) {
      var earlyCaveats = craCaveatsCallout();
      if (earlyCaveats) refs.main.appendChild(earlyCaveats);
    }

    var e = E.state.engagement.engagement;
    refs.main.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "Engagement details" }),
        h("button", { class: "btn", onClick: openEngagementModal, text: "Edit details" })
      ]),
      h("div", { class: "card-b" }, [
        h("div", { class: "grid-3" }, [
          metaPair("Client", e.clientName),
          metaPair("Site", e.siteName),
          metaPair("Address", e.siteAddress),
          metaPair("Site contact", e.siteContact),
          metaPair("Consultant", e.consultant),
          metaPair("Date of visit", e.dateOfVisit),
          metaPair("Opportunity ID", e.opportunityId),
          metaPair("Revision", e.documentRevision),
          metaPair("QA review by", e.qaReviewBy),
          metaPair("Authorised by", e.authorisedBy),
          metaPair("Issued to", e.issuedTo),
          metaPair("Issued date", e.issuedDate),
          metaPair("Confidentiality", e.confidentiality)
        ])
      ])
    ]));


    // The per-family setup comes FIRST after the engagement details - it is
    // what the consultant needs before capture is meaningful (target SLs, the
    // CAF regulator profile, CRA scope/classification). The evidence register
    // and preparation guidance follow.
    if (E.state.scoringFamily === "capability-sl" && E.state.taxonomy) {
      refs.main.appendChild(targetSettingsCard());
    } else if (E.state.scoringFamily === "domain-letter") {
      refs.main.appendChild(postureGettingStartedCard());
    } else if (E.state.scoringFamily === "caf-achieved") {
      refs.main.appendChild(cafGettingStartedCard());
    } else if (E.state.scoringFamily === "program-maturity-ml") {
      refs.main.appendChild(mlGettingStartedCard());
    } else if (E.state.scoringFamily === "nis2-conformance") {
      refs.main.appendChild(nis2GettingStartedCard());
    } else if (E.state.scoringFamily === "csms-conformance") {
      if (isCRA()) {
        // Critical caveats lead - they are "read before relying on this
        // assessment", so they cannot be the last thing on the page.
        var craCaveats = craCaveatsCallout();
        if (craCaveats) refs.main.appendChild(craCaveats);
        refs.main.appendChild(craProductsCard());
        refs.main.appendChild(craSetupCard());
      } else {
        refs.main.appendChild(csmsGettingStartedCard());
      }
    }

    // Targets live here too. The sidebar only carries a dedicated row once
    // there are several to switch between, so this is where a single-target
    // engagement names or adds one. CRA manages its products in its own card
    // above, so it is excluded.
    if (!isCRA()) refs.main.appendChild(targetsCard());

    refs.main.appendChild(buildBasisOfAssessmentCard());
    refs.main.appendChild(buildPreparationGuidanceCard());
  }

  // ---- preparation guidance (documents & stakeholders) -------------------
  // Advisory per-instrument notes from data/shared/engagement-guidance.json:
  // the documents a consultant typically needs, the ones clients often forget,
  // and the stakeholders worth interviewing. Guidance only - it never
  // pre-populates the basis-of-assessment register above; the consultant
  // records what was actually reviewed there. Collapsed by default so it
  // reads as a prompt, not a checklist.

  function buildPreparationGuidanceCard() {
    var data = window.App.Data.shared && window.App.Data.shared.engagementGuidance;
    if (!data) return h("span", { class: "hidden" });
    var entry = (data.instruments && data.instruments[E.state.instrument.id]) || data["default"];
    if (!entry) return h("span", { class: "hidden" });

    function col(title, items, forgotten) {
      return h("div", null, [
        h("h3", { style: "margin:0 0 6px; font-size:13px; font-weight:600; color:var(--text);", text: title }),
        h("ul", { style: "margin:0; padding-left:18px; font-size:13px;" },
          (items || []).map(function (t) {
            return h("li", { style: "margin:3px 0;" + (forgotten ? " color:var(--near);" : "") }, [t]);
          }))
      ]);
    }

    var details = h("details", null, [
      h("summary", { style: "cursor:pointer; color:var(--brand-blue); font-weight:600; font-size:13px;", text: "Show typical documents & stakeholders" }),
      h("div", { class: "grid-3", style: "margin-top:12px;" }, [
        col("Commonly needed documents", entry.commonDocuments, false),
        col("Often forgotten", entry.oftenForgotten, true),
        col("Key stakeholders to interview", entry.keyStakeholders, false)
      ])
    ]);

    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "Preparation guidance" }),
        h("span", { class: "sub", text: "typical for this assessment, not a fixed list" })
      ]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin:0 0 8px; font-size:13px;", text: "A prompt for scoping and the site visit. Record what was reviewed and who was interviewed in the Basis of assessment above; nothing here is added to it automatically." }),
        details
      ])
    ]);
  }

  // ---- basis of assessment (evidence register) --------------------------
  // Project-level capture of who was interviewed, what documents were reviewed
  // and which systems were observed. Underpins every "Achieved" verdict and
  // exports into the Word "Basis of assessment" section and the Excel workbook.
  // Text edits mutate the live register row and autosave (no re-render, so
  // focus is kept); add/remove re-render the engagement page.

  var BASIS_REGISTERS = [
    {
      kind: "interviews", title: "People interviewed", addLabel: "Add person",
      empty: "No interviews recorded yet.",
      fields: [
        { key: "name", label: "Name", placeholder: "e.g. J. Smith" },
        { key: "role", label: "Role", placeholder: "e.g. OT Engineering Lead" },
        { key: "date", label: "Date", type: "date" }
      ]
    },
    {
      kind: "documents", title: "Documents reviewed", addLabel: "Add document",
      empty: "No documents recorded yet.",
      fields: [
        { key: "title", label: "Title", placeholder: "e.g. OT Security Policy" },
        { key: "reference", label: "Reference / version", placeholder: "e.g. POL-014 v3.2" },
        { key: "date", label: "Date", type: "date" }
      ]
    },
    {
      kind: "observations", title: "Systems observed", addLabel: "Add system",
      empty: "No system observations recorded yet.",
      fields: [
        { key: "name", label: "System / environment", placeholder: "e.g. SCADA HMI, DMZ firewall" },
        { key: "method", label: "How observed", placeholder: "e.g. screen-shared walkthrough, on-site inspection" }
      ]
    }
  ];

  function basisRegisterBlock(cfg) {
    var basis = E.getBasisOfAssessment();
    var rows = basis[cfg.kind];

    var header = h("thead", null, [h("tr", null,
      cfg.fields.map(function (f) { return h("th", { text: f.label }); }).concat([h("th", { style: "width:1%;" }, [])])
    )]);

    var body = h("tbody", null, rows.map(function (row, idx) {
      var cells = cfg.fields.map(function (f) {
        var input = h("input", { type: f.type || "text", value: row[f.key] || "", placeholder: f.placeholder || "" });
        input.addEventListener("change", function () {
          row[f.key] = input.value;
          scheduleAutosave();
        });
        return h("td", null, [input]);
      });
      cells.push(h("td", null, [
        h("button", {
          // 'danger' (not 'ghost' - ghost is white text for the navy header and
          // would be invisible on this white card) so Remove is always visible.
          class: "btn danger", title: "Remove this row", "aria-label": "Remove row",
          onClick: function () {
            // Evidence-register rows underpin the verdicts; a misclick must
            // not silently erase one. Blank rows delete without ceremony.
            var hasContent = cfg.fields.some(function (f) { return String(row[f.key] || "").trim() !== ""; });
            if (hasContent && !confirm("Remove this " + cfg.title.toLowerCase().replace(/s$/, "") + " entry from the evidence register?")) return;
            rows.splice(idx, 1); E.touchBasisOfAssessment(); render();
          },
          text: "Remove"
        })
      ]));
      return h("tr", null, cells);
    }));

    var kids = [ h("h3", { style: "margin:14px 0 6px;", text: cfg.title }) ];
    if (rows.length === 0) {
      kids.push(h("p", { class: "muted", style: "margin:0 0 6px;", text: cfg.empty }));
    } else {
      kids.push(h("table", { class: "tbl" }, [header, body]));
    }
    kids.push(h("button", {
      class: "btn", style: "margin-top:6px;",
      onClick: function () {
        var blank = {};
        cfg.fields.forEach(function (f) { blank[f.key] = ""; });
        rows.push(blank);
        E.touchBasisOfAssessment();
        render();
      },
      text: "+ " + cfg.addLabel
    }));
    return h("div", null, kids);
  }

  function buildBasisOfAssessmentCard() {
    return h("div", { class: "card", "data-check-anchor": "basis" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Basis of assessment" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text: "Record the interviews, documentation and system observations this assessment rests on. It is specific to this assessment and appears as a “Basis of assessment” section in the Word report and a sheet in the Excel workbook." })
      ].concat(BASIS_REGISTERS.map(basisRegisterBlock)))
    ]);
  }

  // ---- program-maturity-ml getting-started + capture --------------------

  function mlGettingStartedCard() {
    var inst = E.state.instrument;
    var levels = E.getMLLevels();
    var levelRows = levels.map(function (l) {
      return h("tr", null, [
        h("td", null, [h("strong", { text: l.id }), " ", l.name]),
        h("td", { class: "muted", text: l.anchor || "" })
      ]);
    });
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Security Program maturity: how this instrument works" })]),
      h("div", { class: "card-b" }, [
        h("p", { text: inst.framing || "" }),
        h("ul", null, [
          h("li", null, ["The unit of capture is the " + window.App.Report.mlNoun(inst, "requirementNoun") +
            ", grouped into " + (inst.elements || []).length + " " +
            window.App.Report.mlNoun(inst, "elementNounPlural") + "."]),
          h("li", null, ["You set one maturity level per requirement, independently of the others: ML1-ML4, or Not met. Documentation is implied from ML2 upward."]),
          h("li", null, ["Unknown reduces coverage and lowers confidence; Not applicable drops the requirement from the score and coverage."]),
          h("li", null, ["An optional target ML per requirement should derive from risk (62443-3-2), not a flat default. Where set, the report shows met / below per requirement and per element."]),
          h("li", null, ["No single program grade is produced. The report is an achieved-ML profile by SPE and theme; mean ML is shown for context only. A Not met, or a requirement below its target, is surfaced as a floor finding, not averaged away."])
        ]),
        h("table", { class: "tbl", style: "margin-top:10px;" }, [
          h("thead", null, [h("tr", null, [h("th", null, ["Maturity level"]), h("th", null, ["Anchor (paraphrased guide)"])])]),
          h("tbody", null, levelRows)
        ])
      ])
    ]);
  }

  // Module-local map of which requirements have their OT-lens panel expanded.
  var mlOTLensOpen = {};
  // Which SPE summaries are expanded (keyed by element id; default collapsed).
  var mlSummaryOpen = {};
  // Which per-requirement summaries are expanded (keyed by req id; collapsed).
  var mlReqSummaryOpen = {};

  function buildMLNav(s) {
    var scored = E.scoreActiveTarget();
    s.appendChild(h("div", { class: "nav-section-title", text: cap(window.App.Report.mlNoun(E.state.instrument, "elementNounPlural")) }));
    s.appendChild(h("div", {
      class: "nav-item" + (view === "ml-wizard" ? " active" : ""),
      onClick: function () { enterMLWizard(view === "ml-wizard" ? mlWizardIdx : 0); }
    }, [ h("span", null, ["Guided wizard"]), h("span", { class: "badge", text: "1 / page" }) ]));
    var elements = E.getMLElements();
    elements.forEach(function (el) {
      var elRes = scored ? scored.byElement.filter(function (x) { return x.elementId === el.id; })[0] : null;
      var badgeTxt = elRes ? (elRes.scored + "/" + elRes.total) : "";
      s.appendChild(h("div", {
        class: "nav-item" + (view === "ml-element" && viewFR === el.id ? " active" : ""),
        onClick: function () { go("ml-element", el.id); }
      }, [
        h("span", null, [h("strong", { text: el.id }), " " + el.name]),
        h("span", { class: "badge", text: badgeTxt })
      ]));
    });
  }

  function renderMLElementPage(elementId) {
    refs.main.innerHTML = "";
    var elements = E.getMLElements();
    var el = elements.filter(function (x) { return x.id === elementId; })[0];
    if (!el) { el = elements[0]; elementId = el && el.id; }
    if (!el) { refs.main.appendChild(h("p", { class: "muted", text: "No " + window.App.Report.mlNoun(E.state.instrument, "elementNounPlural") + " defined." })); return; }

    // SPE title. When a summary exists it collapses/expands from the title
    // via a chevron; default collapsed.
    var sumOpen = !!mlSummaryOpen[elementId];
    var titleKids = [];
    if (el.summary) titleKids.push(h("span", { class: "ml-spe-chevron", text: sumOpen ? "▾ " : "▸ " }));
    titleKids.push(el.id + "  " + el.name);
    var titleAttrs = { class: "page-title" + (el.summary ? " ml-spe-title" : "") };
    if (el.summary) {
      titleAttrs.onClick = function () { mlSummaryOpen[elementId] = !sumOpen; renderMLElementPage(elementId); };
    }
    refs.main.appendChild(h("h1", titleAttrs, titleKids));
    // SPE summary as orientation for the consultant - shown only when expanded.
    if (el.summary && sumOpen) refs.main.appendChild(h("p", { class: "page-sub ml-spe-summary", text: el.summary }));
    refs.main.appendChild(h("p", { class: "page-sub", text:
      "Set one maturity level per requirement from the scale, or Not met / Unknown / N/A." }));
    refs.main.appendChild(buildSitesToolbar());

    // Maturity-level reference: the full ML1-ML4 definitions shown ONCE here
    // (per maturityModel._display), not repeated inline on every requirement.
    refs.main.appendChild(mlReferencePanel());

    var scored = E.scoreActiveTarget();
    var elRes = scored && scored.byElement.filter(function (x) { return x.elementId === elementId; })[0];
    if (elRes) refs.main.appendChild(mlElementBanner(elRes));

    var reqs = E.getMLRequirementsByElement(elementId);
    var list = h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Requirements" })]),
      h("div", { class: "card-b" }, reqs.map(function (r) { return mlRequirementRow(r); }))
    ]);
    refs.main.appendChild(list);
    var fn = sectionFootNav(E.getMLElements().map(function (x) { return { id: x.id, label: x.id }; }), elementId, "ml-element");
    if (fn) refs.main.appendChild(fn);
  }

  // Collapsible reference panel listing the full ML anchors once per page.
  var mlRefOpen = false;
  function mlReferencePanel() {
    var levels = E.getMLLevels();
    var overlayOn = E.isMLTargetOverlayEnabled();
    var head = h("div", { class: "card-h", style: "cursor:pointer; user-select:none;",
      onClick: function () { mlRefOpen = !mlRefOpen; renderMLElementPage(viewFR); } }, [
      h("h2", { text: (mlRefOpen ? "▾ " : "▸ ") + "Maturity levels (reference)" }),
      h("span", { class: "sub", text: overlayOn ? "Target overlay: on" : "Target overlay: off" })
    ]);
    var body = [];
    if (mlRefOpen) {
      body.push(h("table", { class: "tbl" }, [
        h("thead", null, [h("tr", null, [h("th", null, ["Level"]), h("th", null, ["Definition"])])]),
        h("tbody", null, levels.map(function (l) {
          return h("tr", null, [
            h("td", null, [h("strong", { text: l.id }), " ", l.name]),
            h("td", { class: "muted", text: l.anchor || "" })
          ]);
        }))
      ]));
      body.push(h("p", { class: "muted", style: "margin:8px 0 0;", text:
        "Not met sits below ML1 and is a floor finding. Unknown reduces coverage and confidence (not scored). N/A is excluded. No single program grade is produced." }));
    }
    return h("div", { class: "card" }, [head].concat(mlRefOpen ? [h("div", { class: "card-b" }, body)] : []));
  }

  function mlElementBanner(elRes) {
    var ML = window.App.ScoringProgramML;
    var c = elRes.counts;
    var kpis = [
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "ML profile (ML1/2/3/4)" }),
        h("div", { class: "val", style: "font-size:14px; line-height:1.4;" }, [
          h("span", { class: "pill neutral", text: c.ML1 + " ML1" }), " ",
          h("span", { class: "pill near", text: c.ML2 + " ML2" }), " ",
          h("span", { class: "pill met", text: c.ML3 + " ML3" }), " ",
          h("span", { class: "pill exceeds", text: c.ML4 + " ML4" })
        ])
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Not met / Unknown" }),
        h("div", { class: "val", style: "font-size:14px; line-height:1.4;" }, [
          h("span", { class: "pill gap", text: String(c.notMet) + " Not met" }), " ",
          h("span", { class: "pill neutral", text: String(c.unknown) + " Unknown" })
        ])
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Mean ML (context only)" }),
        h("div", { class: "val", text: ML.formatMean(elRes.meanMl) })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Coverage" }),
        h("div", { class: "val", text: ML.formatPct(elRes.coverage) + (elRes.confidenceLevel ? "  -  " + elRes.confidenceLevel : "") })
      ])
    ];
    if (elRes.targetsSet > 0) {
      kpis.push(h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Meets target" }),
        h("div", { class: "val", text: elRes.meeting + " / " + (elRes.meeting + elRes.below) })
      ]));
    }
    return h("div", { class: "card" }, [ h("div", { class: "card-b" }, [ h("div", { class: "kpi-row" }, kpis) ]) ]);
  }

  // Semantic pill band for an achieved-scale value.
  function mlPillBand(val) {
    if (val === "ML4") return "exceeds";
    if (val === "ML3") return "met";
    if (val === "ML2") return "near";
    if (val === "ML1") return "neutral";
    if (val === "not-met") return "gap";
    if (val === "na") return "na";
    return "neutral"; // unknown / unset
  }

  function mlRequirementRow(req) {
    var resp = E.findResponse(E.state.activeTargetId, req.id) || { ml: null, targetMl: null, applicable: true, evidence: "", notes: "" };
    var scale = E.getMLAchievedScale();
    var ordered = scale.ordered || [];
    var nonScoring = scale.nonScoring || [];
    var tid = E.state.activeTargetId;

    // Current-state pill. Label comes from the scale so it stays in sync.
    function scaleLabel(val) {
      var all = ordered.concat(nonScoring);
      for (var i = 0; i < all.length; i++) if (all[i].value === val) return all[i].label;
      return null;
    }
    var pillBand = mlPillBand(resp.applicable === false ? "na" : resp.ml);
    var pillText = (resp.applicable === false ? "Not applicable" : (scaleLabel(resp.ml) || "Not yet set"));
    var pill = h("span", { class: "pill " + pillBand, text: pillText });

    // Detail: the plain-language hint and/or the verbatim requirement text.
    // When VERBATIM text exists it is the authoritative wording being judged,
    // so it is OPEN by default (collapsible per item); hint-only detail stays
    // collapsed to keep the capture screen uncluttered.
    var hasHint = req.hint && String(req.hint).trim() !== "";
    var hasVerbatim = req.verbatimText && String(req.verbatimText).trim() !== "";
    var hasDetail = hasHint || hasVerbatim;
    var detailOpen = hasVerbatim ? (mlReqSummaryOpen[req.id] !== false) : !!mlReqSummaryOpen[req.id];

    var titleInner = [];
    if (hasDetail) titleInner.push(h("span", { class: "ml-req-chevron", text: detailOpen ? "▾ " : "▸ " }));
    titleInner.push(h("span", { class: "req-code", text: req.code }));
    titleInner.push(h("span", { class: "req-title", text: req.title }));
    var titleBlock = h("div", { class: hasDetail ? "ml-req-titletoggle" : "" }, titleInner);
    if (hasDetail) {
      titleBlock.addEventListener("click", function () {
        mlReqSummaryOpen[req.id] = !detailOpen;
        renderMLElementPage(req.elementId);
      });
    }
    var header = h("div", { class: "req-h" }, [
      titleBlock,
      h("div", { class: "req-meta" }, [pill])
    ]);

    // The expandable detail panel. verbatimText is the authoritative wording
    // (labelled as such); the hint is the paraphrased plain-language summary.
    // Shown only when expanded.
    var detailEl = null;
    if (hasDetail && detailOpen) {
      var detailKids = [];
      if (hasVerbatim) {
        detailKids.push(h("div", { class: "ml-req-verbatim-label", text: "Requirement (verbatim)" }));
        detailKids.push(h("p", { class: "ml-req-verbatim", text: req.verbatimText }));
      }
      if (hasHint) {
        detailKids.push(h("div", { class: "ml-req-hint-label", text: hasVerbatim ? "Plain-language summary" : "Summary" }));
        detailKids.push(h("p", { class: "muted ml-req-hint", text: req.hint }));
      }
      detailEl = h("div", { class: "ml-req-detail" }, detailKids);
    }

    // SINGLE control: one ordered selection from the achieved scale (Not met /
    // ML1-4 using the short labels), with Unknown and N/A alongside as
    // non-scoring options. No inline anchors - see the reference panel.
    function scaleBtn(opt, scored) {
      var isNA = opt.value === "na";
      var active = isNA ? (resp.applicable === false || resp.ml === "na")
                        : (resp.applicable !== false && resp.ml === opt.value);
      return h("button", {
        class: "sl-btn ml-scale-btn ml-" + opt.value.replace(/[^a-z0-9]/gi, "").toLowerCase() + (active ? " active" : ""),
        onClick: function () {
          E.setResponse(tid, req.id, isNA ? { applicable: false, ml: "na" } : { applicable: true, ml: opt.value });
          renderMLElementPage(req.elementId);
        },
        text: opt.short || opt.label
      });
    }
    var scaleRow = h("div", { class: "sl-row ml-scale-row" }, []);
    ordered.forEach(function (opt) { scaleRow.appendChild(scaleBtn(opt, true)); });
    scaleRow.appendChild(h("span", { class: "ml-scale-sep" }, []));
    nonScoring.forEach(function (opt) { scaleRow.appendChild(scaleBtn(opt, false)); });
    var mlClear = clearAnswerBtn(resp.applicable === false || (resp.ml != null && resp.ml !== ""), function () {
      E.setResponse(tid, req.id, { applicable: true, ml: null });
      renderMLElementPage(req.elementId);
    });
    if (mlClear) scaleRow.appendChild(mlClear);

    var body = [header, detailEl, scaleRow];

    // Target ML control - only when the optional overlay is enabled.
    if (E.isMLTargetOverlayEnabled()) {
      var targetScale = E.getMLTargetOverlay().targetScale || ["ML1", "ML2", "ML3", "ML4"];
      var targetWrap = h("div", { class: "ml-target-row" }, [
        h("span", { class: "ml-target-label", text: "Target ML (optional, from risk):" })
      ]);
      [{ id: "", label: "Unset" }].concat(targetScale.map(function (t) { return { id: t, label: t }; })).forEach(function (o) {
        var active = (resp.targetMl || "") === o.id;
        targetWrap.appendChild(h("button", {
          class: "ml-target-btn" + (active ? " active" : ""),
          onClick: function () { E.setResponse(tid, req.id, { targetMl: o.id || null }); renderMLElementPage(req.elementId); },
          text: o.label
        }));
      });
      body.push(targetWrap);
    }

    // Why this matters (best-practice interpretation).
    var mlWhy = whyThisMattersBlock(req.rationale);
    if (mlWhy) body.push(mlWhy);

    // OT lens panel (collapsible) if populated.
    var lens = req.otLens || {};
    if ((lens.framing && lens.framing.trim()) || (lens.gotchas && lens.gotchas.trim())) {
      var open = !!mlOTLensOpen[req.id];
      body.push(h("button", {
        class: "sl-guidance-toggle" + (open ? " open" : ""),
        style: "margin-top:10px;",
        onClick: function () { mlOTLensOpen[req.id] = !open; renderMLElementPage(req.elementId); },
        text: "OT lens"
      }));
      if (open) {
        var lensKids = [];
        if (lens.framing && lens.framing.trim()) lensKids.push(h("p", null, [h("strong", { text: "Framing: " }), lens.framing]));
        if (lens.gotchas && lens.gotchas.trim()) lensKids.push(h("p", null, [h("strong", { text: "Gotchas: " }), lens.gotchas]));
        body.push(h("div", { class: "caf-lens-panel" }, lensKids));
      }
    }

    // Evidence + notes.
    body.push(h("div", { class: "field", style: "margin-top:10px;" }, [
      h("label", { text: "Evidence" }),
      (function () {
        var ta = h("textarea", { placeholder: req.evidencePrompt || "Evidence for the maturity level selected." });
        ta.value = resp.evidence || "";
        ta.addEventListener("change", function () { E.setResponse(tid, req.id, { evidence: ta.value }); });
        return ta;
      })()
    ]));
    body.push(h("div", { class: "field" }, [
      h("label", { text: "Notes" }),
      (function () {
        var ta = h("textarea");
        ta.value = resp.notes || "";
        ta.addEventListener("change", function () { E.setResponse(tid, req.id, { notes: ta.value }); });
        return ta;
      })()
    ]));

    body.push(remediationBlock(req.id, function () { renderMLElementPage(req.elementId); }));

    return h("div", { class: "req ml-req" + ((resp.applicable === false || (resp.ml != null && resp.ml !== "")) ? " is-answered" : ""), "data-req-id": req.id }, body);
  }

  // ---- NIS2 conformance capture (nis2-conformance family) ---------------

  function nis2GettingStartedCard() {
    var inst = E.state.instrument;
    var cats = E.getNIS2Categories();
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "NIS2 conformance and gap analysis: how this works" })]),
      h("div", { class: "card-b" }, [
        h("p", { text: inst.framing || "" }),
        h("ul", null, [
          h("li", null, ["Each obligation is judged Achieved / Partially Achieved / Not Achieved against full conformance with NIS2."]),
          h("li", null, ["Unknown reduces coverage and lowers confidence; Not applicable drops the obligation from the score and coverage."]),
          h("li", null, ["No single grade or pass mark is produced. The report is a conformance profile by NIS2 area, plus a gap roadmap of every Partially or Not Achieved obligation."]),
          h("li", null, ["This is a readiness gap analysis, not a determination of legal compliance with NIS2 or the national law that transposes it."])
        ]),
        h("table", { class: "tbl", style: "margin-top:10px;" }, [
          h("thead", null, [h("tr", null, [h("th", null, ["Area"]), h("th", null, ["Article"]), h("th", { class: "center" }, ["Obligations"])])]),
          h("tbody", null, cats.map(function (c) {
            var n = E.getNIS2ItemsByCategory(c.id).length;
            return h("tr", null, [
              h("td", null, [h("strong", { text: c.id }), " " + c.name]),
              h("td", { class: "muted", text: c.article || "" }),
              h("td", { class: "center", text: String(n) })
            ]);
          }))
        ])
      ])
    ]);
  }

  function buildNIS2Nav(s) {
    var scored = E.scoreActiveTarget();
    s.appendChild(h("div", { class: "nav-section-title", text: "NIS2 areas" }));
    // Guided wizard: one obligation per page through every area. Same answers
    // as the per-area list view (shared assessment).
    s.appendChild(h("div", {
      class: "nav-item" + (view === "nis2-wizard" ? " active" : ""),
      onClick: function () { enterNIS2Wizard(0); }
    }, [
      h("span", null, ["Guided wizard"]),
      h("span", { class: "badge", text: "1 / page" })
    ]));
    E.getNIS2Categories().forEach(function (c) {
      var cRes = scored ? scored.byCategory.filter(function (x) { return x.categoryId === c.id; })[0] : null;
      s.appendChild(h("div", {
        class: "nav-item" + (view === "nis2-category" && viewFR === c.id ? " active" : ""),
        onClick: function () { go("nis2-category", c.id); }
      }, [
        h("span", null, [h("strong", { text: c.id }), " " + c.name]),
        h("span", { class: "badge", text: cRes ? (cRes.answered + "/" + cRes.total) : "" })
      ]));
    });
  }

  function renderNIS2CategoryPage(categoryId) {
    refs.main.innerHTML = "";
    var cats = E.getNIS2Categories();
    var cat = cats.filter(function (c) { return c.id === categoryId; })[0];
    if (!cat) { cat = cats[0]; categoryId = cat && cat.id; }
    if (!cat) { refs.main.appendChild(h("p", { class: "muted", text: "No NIS2 areas defined." })); return; }

    refs.main.appendChild(h("h1", { class: "page-title", text: cat.id + "  " + cat.name }));
    refs.main.appendChild(h("p", { class: "page-sub", text:
      (cat.article ? cat.article + "  -  " : "") + "Judge each obligation Achieved / Partially / Not Achieved, or Unknown / N/A." }));
    refs.main.appendChild(buildSitesToolbar());

    var scored = E.scoreActiveTarget();
    var cRes = scored && scored.byCategory.filter(function (x) { return x.categoryId === categoryId; })[0];
    if (cRes) refs.main.appendChild(nis2CategoryBanner(cRes));

    var items = E.getNIS2ItemsByCategory(categoryId);
    refs.main.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Obligations" })]),
      h("div", { class: "card-b" }, items.map(function (it) { return nis2ItemRow(it); }))
    ]));
    var fn = sectionFootNav(E.getNIS2Categories().map(function (c) { return { id: c.id, label: c.id }; }), categoryId, "nis2-category");
    if (fn) refs.main.appendChild(fn);
  }

  function nis2CategoryBanner(cRes) {
    var N = window.App.ScoringNIS2;
    var c = cRes.counts;
    return h("div", { class: "card" }, [ h("div", { class: "card-b" }, [ h("div", { class: "kpi-row" }, [
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Conformance profile" }),
        h("div", { class: "val", style: "font-size:14px; line-height:1.4;" }, [
          h("span", { class: "pill met",  text: c.achieved + " Achieved" }), " ",
          h("span", { class: "pill near", text: c.partially + " Partially" }), " ",
          h("span", { class: "pill gap",  text: c.not + " Not" })
        ])
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Gaps" }),
        h("div", { class: "val " + (cRes.gaps > 0 ? "gap" : "met"), text: String(cRes.gaps) })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Coverage" }),
        h("div", { class: "val", text: N.formatPct(cRes.coverage) + (cRes.confidenceLevel ? "  -  " + cRes.confidenceLevel : "") })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Conformance (context)" }),
        h("div", { class: "val", text: N.formatPct(cRes.conformance) })
      ])
    ]) ]) ]);
  }

  // Open/closed state for each obligation's guidance expander. Module-local so
  // it survives the renderNIS2CategoryPage re-render fired on every state click.
  var nis2GuidanceOpen = {};

  // The memory-jog panel for an obligation: what it requires, why it matters
  // (best-practice interpretation), what to look for, and the article reference.
  function buildNIS2GuidancePanel(item) {
    function block(label, text) {
      return h("div", { class: "wiz-ctx-block" }, [
        h("div", { class: "wiz-ctx-label", text: label }),
        h("div", { class: "wiz-ctx-text", text: text })
      ]);
    }
    var kids = [];
    if (item.requirement)    kids.push(block("What this obligation requires", item.requirement));
    if (item.rationale)      kids.push(block("Why this matters", item.rationale));
    if (item.evidencePrompt) kids.push(block("What to look for", item.evidencePrompt));
    if (item.articleRef)     kids.push(block("Reference", item.articleRef + " - Directive (EU) 2022/2555 (NIS2)"));
    if (kids.length === 0) kids.push(block("Guidance", "No additional guidance for this obligation yet."));
    return h("div", { class: "nis2-guidance" }, kids);
  }

  function nis2ItemRow(item) {
    var resp = E.findResponse(E.state.activeTargetId, item.id) || { state: null, applicable: true, evidence: "", notes: "" };
    var tid = E.state.activeTargetId;

    var pill;
    if (resp.applicable === false || resp.state === "na") pill = h("span", { class: "pill na", text: "Not applicable" });
    else if (resp.state === "achieved")  pill = h("span", { class: "pill met",  text: "Achieved" });
    else if (resp.state === "partially") pill = h("span", { class: "pill near", text: "Partially achieved" });
    else if (resp.state === "not")       pill = h("span", { class: "pill gap",  text: "Not achieved" });
    else if (resp.state === "unknown")   pill = h("span", { class: "pill neutral", text: "Unknown" });
    else                                  pill = h("span", { class: "pill neutral", text: "Not yet set" });

    var guideOpen = nis2GuidanceOpen[item.id] === true;
    var guideToggle = h("button", {
      type: "button",
      style: "margin-right:8px;",
      class: "sl-guidance-toggle" + (guideOpen ? " open" : ""),
      onClick: function () { nis2GuidanceOpen[item.id] = !guideOpen; renderNIS2CategoryPage(item.categoryId); },
      text: "Guidance"
    });
    var guidePanel = guideOpen ? buildNIS2GuidancePanel(item) : null;

    var header = h("div", { class: "req-h" }, [
      h("div", null, [
        h("span", { class: "req-code", text: item.code }),
        h("span", { class: "req-title", text: item.title }),
        item.articleRef ? h("span", { class: "pill neutral", style: "margin-left:8px;", text: item.articleRef }) : null
      ]),
      h("div", { class: "req-meta" }, [guideToggle, pill])
    ]);
    var reqEl = item.requirement ? h("p", { class: "muted", style: "margin:6px 0 10px;", text: item.requirement }) : null;

    function setState(v, applicable) {
      E.setResponse(tid, item.id, { applicable: applicable !== false, state: v });
      renderNIS2CategoryPage(item.categoryId);
    }
    var row = h("div", { class: "sl-row caf-state-row" }, [
      h("button", { class: "sl-btn caf-state-btn caf-state-achieved"  + (resp.applicable !== false && resp.state === "achieved"  ? " active" : ""), onClick: function () { setState("achieved"); },  text: "Achieved" }),
      h("button", { class: "sl-btn caf-state-btn caf-state-partially" + (resp.applicable !== false && resp.state === "partially" ? " active" : ""), onClick: function () { setState("partially"); }, text: "Partially" }),
      h("button", { class: "sl-btn caf-state-btn caf-state-not"       + (resp.applicable !== false && resp.state === "not"       ? " active" : ""), onClick: function () { setState("not"); },       text: "Not achieved" }),
      h("button", { class: "sl-btn special" + (resp.state === "unknown" ? " active" : ""), onClick: function () { setState("unknown"); }, text: "Unknown" }),
      h("button", { class: "sl-btn na" + ((resp.applicable === false || resp.state === "na") ? " active" : ""), onClick: function () { setState("na", false); }, text: "N/A" }),
      clearAnswerBtn(resp.applicable === false || !!resp.state, function () { setState(null, true); })
    ]);

    var body = [header, reqEl, guidePanel, row];
    body.push(h("div", { class: "field", style: "margin-top:10px;" }, [
      h("label", { text: "Evidence" }),
      (function () { var ta = h("textarea", { placeholder: item.evidencePrompt || "" }); ta.value = resp.evidence || ""; ta.addEventListener("change", function () { E.setResponse(tid, item.id, { evidence: ta.value }); }); return ta; })()
    ]));
    body.push(h("div", { class: "field" }, [
      h("label", { text: "Notes" }),
      (function () { var ta = h("textarea"); ta.value = resp.notes || ""; ta.addEventListener("change", function () { E.setResponse(tid, item.id, { notes: ta.value }); }); return ta; })()
    ]));
    body.push(remediationBlock(item.id, function () { renderNIS2CategoryPage(item.categoryId); }));
    return h("div", { class: "req posture-q" + ((resp.applicable === false || !!resp.state) ? " is-answered" : ""), "data-req-id": item.id }, body);
  }

  // Inline recommendation editor: the same priority band / owner / recommended
  // action / business impact as the report roadmap modal, written to the same
  // response fields, so the roadmap and the Word/Excel exports pick it up
  // automatically wherever it was typed.
  //
  // Available on EVERY item, in the list views and the wizards alike. It used
  // to appear only on items the scorer had already put on the roadmap, which
  // meant a consultant who wanted to record "this is fine, but here is what I
  // would do next" had nowhere to put it, and anyone working in the list view
  // had to finish, open the report and come back. A recommendation is the
  // consultant's judgement, so the tool should not decide when they are
  // allowed to make one.
  //
  // Quiet by default: open on a gap (where a plan is expected), open whenever
  // it already holds something, and otherwise behind "+ Add a recommendation" -
  // the same affordance as notes, for the same reason.
  var remOpen = {};
  function hasRecommendation(resp) {
    return !!(resp && ((resp.owner || "").trim() || (resp.action || "").trim() ||
                       (resp.impact || "").trim() || resp.priorityBand ||
                       typeof resp.priorityRank === "number"));
  }
  function isGapItem(itemId) {
    var scored = E.scoreActiveTarget();
    return (scored && scored.roadmap || []).some(function (r) {
      return (r.itemId || r.requirementId || r.id) === itemId;
    });
  }

  // The plan a zone INHERITS from the shared answer, when it holds none of its
  // own. Without this the card showed four empty boxes on a requirement whose
  // report prints a full recommendation, and typing in them silently forked a
  // plan that was meant to be written once.
  function inheritedPlan(itemId) {
    var tid = E.state.activeTargetId;
    if (!E.supportsSharedScope || !E.supportsSharedScope() || E.isSharedScope(tid)) return null;
    if (hasRecommendation(E.findResponse(tid, itemId))) return null;   // its own wins
    var shared = E.findResponse(E.SHARED_TARGET_ID, itemId);
    if (!hasRecommendation(shared)) return null;
    // Only where this zone is actually taking the shared answer, which is the
    // scorer's rule: any answered item reaching it. A zone that overrode one
    // enhancement still takes the plan, and the report prints it for that
    // zone, so its card has to show it too (the link list leaves it out).
    if (sharedReach(itemId).indexOf(tid) === -1) return null;
    return shared;
  }

  // Every zone taking anything from the shared answer to a requirement.
  function sharedReach(reqId) {
    return E.zonesReachedBy ? (E.zonesReachedBy(reqId) || []) : (E.linkedTargets(reqId) || []);
  }
  // The zones a shared field actually reaches: those the answer reaches that
  // hold no text of their own for it. `field` "plan" means the whole
  // recommendation, which goes as one.
  function zonesTakingSharedField(reqId, field) {
    return sharedReach(reqId).filter(function (id) {
      var own = E.findResponse(id, reqId);
      if (field === "plan") return !hasRecommendation(own);
      return !(own && own[field]);
    });
  }

  var BAND_LABEL = { high: "High", medium: "Medium", low: "Low" };

  // Clearing a recommendation writes back exactly the shape upsertResponse
  // creates a response with, so a cleared plan is indistinguishable from one
  // never written - the roadmap, the report and the exports all drop it.
  // A fresh object each call: setResponse fans the patch out to other targets
  // for CRA organisation-scope items, and a shared literal would alias.
  function clearRecommendation(targetId, itemId) {
    E.setResponse(targetId, itemId, {
      priorityRank: null, priorityBand: "", owner: "", action: "", impact: ""
    });
  }

  // Remove control for a recommendation. Confirms only when there is something
  // to lose - the same rule as the evidence register, and it keeps "+ Add a
  // recommendation" then changing your mind a single click rather than a
  // dialogue. `message` states what else goes with it, which is the part a
  // consultant cannot see when the plan is inherited by other zones.
  function recRemoveButton(targetId, itemId, resp, message, after) {
    return h("button", {
      type: "button", class: "btn danger rec-remove",
      title: "Remove this recommendation",
      onClick: function () {
        if (hasRecommendation(resp) && !confirm(message)) return;
        clearRecommendation(targetId, itemId);
        if (after) after();
      },
      text: "Remove"
    });
  }

  // `onChange` re-renders the host view; only needed to open the editor, since
  // the fields themselves save on change without a re-render so focus is kept.
  // `opts.openOnGap` opens it automatically on a gap - true in the wizards,
  // where one requirement has the page to itself, and false in the list views,
  // where four open boxes on every gap turned a 13-requirement page into 6500
  // pixels of form.
  function remediationBlock(itemId, onChange, opts) {
    var tid = E.state.activeTargetId;
    var resp = E.findResponse(tid, itemId) || {};
    var isGap = isGapItem(itemId);
    var filled = hasRecommendation(resp);
    var openOnGap = !!(opts && opts.openOnGap);

    // Inherited: show it, marked, and edit it where it lives rather than
    // offering an empty box that would fork it.
    var shared = inheritedPlan(itemId);
    if (shared) {
      var sKey = itemId + "/plan";
      var sEditing = sharedTextEdit[sKey] === true;
      var zoneCount = zonesTakingSharedField(itemId, "plan").length;
      var sHead = h("div", { class: "inherited-h" }, [
        // The label says "shared"; the pill said it again on every card.
        h("button", {
          type: "button", class: "inherited-edit",
          onClick: function () { sharedTextEdit[sKey] = !sEditing; if (onChange) onChange(); },
          text: sEditing ? "Done" : "Edit shared recommendation"
        }),
        // Removing is offered only while editing. This plan is not this zone's
        // to throw away in passing: the same paragraph is printed for every
        // zone taking it, so removal has to be a deliberate act inside the
        // shared editor rather than a button sitting on a card the consultant
        // only opened to read.
        sEditing
          ? recRemoveButton(E.SHARED_TARGET_ID, itemId, shared,
              zoneCount > 1
                ? "Remove this shared recommendation?\n\nIt will be removed for all " + zoneCount +
                  " " + targetNounPlural() + " taking it, not just this one."
                : "Remove this shared recommendation?\n\nThe priority band, owner, recommended action and business impact will all be cleared.",
              function () { sharedTextEdit[sKey] = false; if (onChange) onChange(); })
          : null
      ]);
      if (!sEditing) {
        var lead = [BAND_LABEL[shared.priorityBand] || "", shared.owner || ""]
          .filter(function (x) { return x; }).join("  -  ");
        return h("div", { class: "field rec-block" }, [
          h("div", { class: "rec-block-h" }, [h("label", { text: "Recommendation  ·  shared" })]),
          h("div", { class: "inherited-evidence" }, [
            sHead,
            lead ? h("div", { class: "rec-lead", text: lead }) : null,
            h("p", { text: shared.action || "" }),
            shared.impact ? h("p", { class: "rec-impact", text: shared.impact }) : null
          ])
        ]);
      }
      return h("div", { class: "field rec-block" }, [
        h("div", { class: "rec-block-h" }, [h("label", { text: "Recommendation  ·  shared" })]),
        h("div", { class: "inherited-evidence is-editing" }, [
          sHead,
          remediationFields(E.SHARED_TARGET_ID, itemId, shared, isGap),
          h("div", { class: "hint", text: zoneCount > 1
            ? "Editing this changes the recommendation for all " + zoneCount + " " + targetNounPlural() + " sharing it."
            : "Editing this changes the shared recommendation." })
        ])
      ]);
    }

    if ((!isGap || !openOnGap) && !filled && remOpen[itemId] !== true) {
      return h("button", {
        type: "button", class: "req-add-note req-add-rec" + (isGap ? " is-wanted" : ""),
        title: isGap ? "This is a gap. Record what should be done about it."
                     : "Record a recommendation for this item, whether or not it is a gap",
        onClick: function () { remOpen[itemId] = true; if (onChange) onChange(); },
        text: "+ Add a recommendation"
      });
    }
    return h("div", { class: "field rec-block" }, [
      h("div", { class: "rec-block-h" }, [
        h("label", { text: "Recommendation" }),
        // On an item that already meets its target, say what recording one
        // means: it is advice, and it is not counted as an outstanding gap.
        !isGap ? h("span", { class: "muted small",
                             text: "not a gap, recorded as advice" }) : null,
        h("div", { class: "spacer" }, []),
        recRemoveButton(tid, itemId, resp,
          "Remove this recommendation?\n\nThe priority band, owner, recommended action and business impact will all be cleared.",
          function () { remOpen[itemId] = false; if (onChange) onChange(); })
      ]),
      remediationFields(tid, itemId, resp, isGap)
    ]);
  }

  // The four fields themselves, bound to whichever response owns the plan -
  // the zone's own, or the shared answer when the zone is taking that.
  function remediationFields(targetId, itemId, resp, isGap) {
    function save(patch) { E.setResponse(targetId, itemId, patch); }
    var bandSel = h("select", null, [
      h("option", { value: "", text: "Not set" }),
      h("option", { value: "high", text: "High" }),
      h("option", { value: "medium", text: "Medium" }),
      h("option", { value: "low", text: "Low" })
    ]);
    bandSel.value = resp.priorityBand || "";
    bandSel.addEventListener("change", function () { save({ priorityBand: bandSel.value }); });
    var ownerIn = h("input", { type: "text", placeholder: "e.g. OT Security Lead" }); ownerIn.value = resp.owner || "";
    ownerIn.addEventListener("change", function () { save({ owner: ownerIn.value }); });
    var actionIn = h("textarea", { rows: "2", placeholder: isGap
      ? "What to do to close this gap."
      : "What you would recommend here, even though it meets its target." });
    actionIn.value = resp.action || "";
    actionIn.addEventListener("change", function () { save({ action: actionIn.value }); });
    var impactIn = h("textarea", { rows: "2", placeholder: "Why it matters if left open." });
    impactIn.value = resp.impact || "";
    impactIn.addEventListener("change", function () { save({ impact: impactIn.value }); });

    return h("div", null, [
      h("div", { class: "grid-2" }, [
        h("div", { class: "field", style: "margin:0;" }, [h("label", { text: "Priority band" }), bandSel]),
        h("div", { class: "field", style: "margin:0;" }, [h("label", { text: "Owner" }), ownerIn])
      ]),
      h("div", { class: "field", style: "margin-top:8px;" }, [h("label", { text: "Recommended action" }), actionIn]),
      h("div", { class: "field" }, [h("label", { text: "Business impact" }), impactIn])
    ]);
  }

  // The wizards give one requirement the whole page, so there the editor opens
  // itself on a gap rather than waiting to be asked.
  function wizardGapRemediation(item, onChange) {
    return remediationBlock(item.id, onChange, { openOnGap: true });
  }

  // ---- nis2-conformance guided wizard (one obligation per page) ---------
  // Shares the engine response store with the per-area list (answers flow both
  // ways) and reuses the posture wizard's CSS (wizard-* / wiz-ctx-*).
  var nis2WizardIdx = 0;
  function nis2WizardItems() {
    var out = [];
    E.getNIS2Categories().forEach(function (c) { out = out.concat(E.getNIS2ItemsByCategory(c.id)); });
    return out;
  }
  function enterNIS2Wizard(idx) {
    var items = nis2WizardItems();
    nis2WizardIdx = Math.max(0, Math.min(idx || 0, Math.max(0, items.length - 1)));
    view = "nis2-wizard"; viewFR = null;
    render();
  }
  function jumpToNIS2Category(categoryId) {
    var items = nis2WizardItems();
    for (var i = 0; i < items.length; i++) { if (items[i].categoryId === categoryId) { nis2WizardIdx = i; break; } }
    renderNIS2WizardPage();
  }

  function nis2ItemStatePill(item) {
    var resp = E.findResponse(E.state.activeTargetId, item.id) || {};
    if (resp.applicable === false || resp.state === "na") return h("span", { class: "pill na", text: "Not applicable" });
    if (resp.state === "achieved")  return h("span", { class: "pill met",  text: "Achieved" });
    if (resp.state === "partially") return h("span", { class: "pill near", text: "Partially achieved" });
    if (resp.state === "not")       return h("span", { class: "pill gap",  text: "Not achieved" });
    if (resp.state === "unknown")   return h("span", { class: "pill neutral", text: "Unknown (reduces coverage)" });
    return h("span", { class: "pill neutral", text: "Not yet answered" });
  }

  // Right-hand context column: status, why it matters (rationale), what to look
  // for (evidence prompt) and the article reference.
  function nis2WizardContext(item) {
    var kids = [ h("div", { class: "wiz-ctx-block" }, [nis2ItemStatePill(item)]) ];
    if (item.rationale) kids.push(h("div", { class: "wiz-ctx-block" }, [
      h("div", { class: "wiz-ctx-label", text: "Why this matters" }),
      h("div", { class: "wiz-ctx-text", text: item.rationale })
    ]));
    if (item.evidencePrompt) kids.push(h("div", { class: "wiz-ctx-block" }, [
      h("div", { class: "wiz-ctx-label", text: "What to look for" }),
      h("div", { class: "wiz-ctx-good", text: item.evidencePrompt })
    ]));
    if (item.articleRef) kids.push(h("div", { class: "wiz-ctx-block" }, [
      h("div", { class: "wiz-ctx-label", text: "Reference" }),
      h("div", { class: "wiz-ctx-maps" }, [ h("span", { class: "wiz-ctx-tag", text: item.articleRef + " - Directive (EU) 2022/2555" }) ])
    ]));
    return h("div", { class: "wizard-context" }, kids);
  }

  // Answer widget: obligation heading + requirement + the five state buttons +
  // evidence/notes. Guidance lives in the context column.
  function nis2WizardAnswer(item) {
    var tid = E.state.activeTargetId;
    var resp = E.findResponse(tid, item.id) || { state: null, applicable: true, evidence: "", notes: "" };
    function setState(v, applicable) {
      E.setResponse(tid, item.id, { applicable: applicable !== false, state: v });
      renderNIS2WizardPage();
    }
    var kids = [
      h("div", { class: "req-h" }, [
        h("div", null, [
          h("span", { class: "req-code", text: item.code }),
          h("span", { class: "req-title", text: item.title }),
          item.articleRef ? h("span", { class: "pill neutral", style: "margin-left:8px;", text: item.articleRef }) : null
        ])
      ])
    ];
    if (item.requirement) kids.push(h("p", { class: "muted", style: "margin:6px 0 10px;", text: item.requirement }));
    kids.push(h("div", { class: "sl-row caf-state-row" }, [
      h("button", { class: "sl-btn caf-state-btn caf-state-achieved"  + (resp.applicable !== false && resp.state === "achieved"  ? " active" : ""), onClick: function () { setState("achieved"); },  text: "Achieved" }),
      h("button", { class: "sl-btn caf-state-btn caf-state-partially" + (resp.applicable !== false && resp.state === "partially" ? " active" : ""), onClick: function () { setState("partially"); }, text: "Partially" }),
      h("button", { class: "sl-btn caf-state-btn caf-state-not"       + (resp.applicable !== false && resp.state === "not"       ? " active" : ""), onClick: function () { setState("not"); },       text: "Not achieved" }),
      h("button", { class: "sl-btn special" + (resp.state === "unknown" ? " active" : ""), onClick: function () { setState("unknown"); }, text: "Unknown" }),
      h("button", { class: "sl-btn na" + ((resp.applicable === false || resp.state === "na") ? " active" : ""), onClick: function () { setState("na", false); }, text: "N/A" })
    ]));
    kids.push(h("div", { class: "field", style: "margin-top:10px;" }, [
      h("label", { text: "Evidence" }),
      (function () { var ta = h("textarea", { placeholder: item.evidencePrompt || "" }); ta.value = resp.evidence || ""; ta.addEventListener("change", function () { E.setResponse(tid, item.id, { evidence: ta.value }); }); return ta; })()
    ]));
    kids.push(h("div", { class: "field" }, [
      h("label", { text: "Notes" }),
      (function () { var ta = h("textarea"); ta.value = resp.notes || ""; ta.addEventListener("change", function () { E.setResponse(tid, item.id, { notes: ta.value }); }); return ta; })()
    ]));
    var rem = wizardGapRemediation(item, renderNIS2WizardPage);
    if (rem) kids.push(rem);
    return h("div", { class: "req posture-q" }, kids);
  }

  function renderNIS2WizardPage() {
    refs.main.innerHTML = "";
    var items = nis2WizardItems();
    if (items.length === 0) { refs.main.appendChild(h("p", { class: "muted", text: "No obligations to capture." })); return; }
    if (nis2WizardIdx > items.length - 1) nis2WizardIdx = items.length - 1;
    if (nis2WizardIdx < 0) nis2WizardIdx = 0;
    var item = items[nis2WizardIdx];
    var cats = E.getNIS2Categories();
    var cat = cats.filter(function (c) { return c.id === item.categoryId; })[0] || { id: "", name: "" };
    var curCatIdx = cats.map(function (c) { return c.id; }).indexOf(item.categoryId);
    var scored = E.scoreActiveTarget();
    var total = items.length;
    var atStart = nis2WizardIdx === 0, atEnd = nis2WizardIdx >= total - 1;

    var wrap = h("div", { class: "wizard" }, []);
    var applicable = (scored && scored.overall && scored.overall.total) || 0;
    var answered = (scored && scored.overall && scored.overall.answered) || 0;
    var pct = applicable > 0 ? Math.round((answered / applicable) * 100) : 0;

    var stepper = h("div", { class: "wizard-stepper" }, []);
    cats.forEach(function (c, i) {
      if (i > 0) stepper.appendChild(h("span", { class: "wizard-step-sep", text: "›" }));
      var cls = "wizard-step" + (i === curCatIdx ? " active" : (i < curCatIdx ? " done" : ""));
      stepper.appendChild(h("button", { class: cls, title: "Jump to " + c.name, onClick: (function (cid) { return function () { jumpToNIS2Category(cid); }; })(c.id), text: c.id }));
    });
    stepper.appendChild(h("span", { class: "wizard-topmeta" }, [
      document.createTextNode("Obligation "), h("strong", { text: String(nis2WizardIdx + 1) }), document.createTextNode(" of " + total)
    ]));
    wrap.appendChild(h("div", { class: "wizard-topbar" }, [
      stepper,
      h("div", { class: "wizard-progress" }, [ h("div", { class: "wizard-progress-bar", style: "width:" + pct + "%;" }, []) ])
    ]));
    if (E.state.engagement.targets.length > 1) wrap.appendChild(buildSitesToolbar());

    wrap.appendChild(h("div", { class: "card wizard-card" }, [
      h("div", { class: "wizard-answer" }, [ nis2WizardAnswer(item) ]),
      nis2WizardContext(item)
    ]));

    var prev = h("button", { class: "btn", onClick: function () { if (!atStart) { nis2WizardIdx -= 1; renderNIS2WizardPage(); } }, text: "‹ Previous" });
    if (atStart) prev.setAttribute("disabled", "");
    var next = h("button", { class: "btn primary", onClick: function () { if (!atEnd) { nis2WizardIdx += 1; renderNIS2WizardPage(); } }, text: "Next ›" });
    if (atEnd) next.setAttribute("disabled", "");
    wrap.appendChild(h("div", { class: "wizard-footbar" }, [
      h("button", { class: "btn", onClick: function () { go("nis2-category", item.categoryId); }, text: "Switch to list view" }),
      h("span", { class: "wizard-footmeta", text: cat.id + " · " + cat.name }),
      h("div", { class: "spacer" }, []),
      prev,
      h("button", { class: "btn", onClick: function () { go("report"); }, text: "Jump to report" }),
      next
    ]));
    refs.main.appendChild(wrap);
  }

  // ---- shared guided-wizard chrome ---------------------------------------
  // The caf / nis2 / posture / cra wizards predate this and keep their own
  // render functions; the three newer wizards (capability-sl, program-ml,
  // csms) share this shell for a consistent look. All reuse the wizard-* /
  // wiz-ctx-* CSS. Answers flow through the same engine responses as the list
  // views, so switching between wizard and list keeps everything in sync.
  function wizardAnsweredPct(items) {
    var tid = E.state.activeTargetId, ans = 0, app = 0;
    (items || []).forEach(function (it) {
      var r = E.findResponse(tid, it.id) || {};
      if (r.applicable === false || r.state === "na" || r.ml === "na") return;
      app++;
      // `band` is the risk-appetite family's answer (a position on its axis);
      // without it the wizard progress bar sits at zero all the way through.
      if ((r.state != null && r.state !== "") || (r.ml != null && r.ml !== "") ||
          (r.band != null && r.band !== "") || r.notEstablished === true ||
          (r.components && Object.keys(r.components).length)) ans++;
    });
    return app > 0 ? Math.round(ans / app * 100) : 0;
  }
  // cfg: { items, idx, unitNoun, groups:[{id,name,label}], curGroupIdx,
  //        groupOf(item)->{id,name,label}, answerFn(item), contextFn(item),
  //        onNav(i), onJump(groupId), onList(groupId) }
  function wizardShell(cfg) {
    var items = cfg.items, idx = cfg.idx, total = items.length, item = items[idx];
    var atStart = idx === 0, atEnd = idx >= total - 1;
    var wrap = h("div", { class: "wizard" }, []);
    var stepper = h("div", { class: "wizard-stepper" }, []);
    cfg.groups.forEach(function (g, i) {
      if (i > 0) stepper.appendChild(h("span", { class: "wizard-step-sep", text: "›" }));
      var cls = "wizard-step" + (i === cfg.curGroupIdx ? " active" : (i < cfg.curGroupIdx ? " done" : ""));
      stepper.appendChild(h("button", { class: cls, title: "Jump to " + g.name, onClick: (function (gid) { return function () { cfg.onJump(gid); }; })(g.id), text: g.label || g.id }));
    });
    stepper.appendChild(h("span", { class: "wizard-topmeta" }, [
      document.createTextNode(cfg.unitNoun + " "), h("strong", { text: String(idx + 1) }), document.createTextNode(" of " + total)
    ]));
    wrap.appendChild(h("div", { class: "wizard-topbar" }, [
      stepper,
      h("div", { class: "wizard-progress" }, [ h("div", { class: "wizard-progress-bar", style: "width:" + wizardAnsweredPct(items) + "%;" }, []) ])
    ]));
    if (E.state.engagement.targets.length > 1) wrap.appendChild(buildSitesToolbar());
    wrap.appendChild(h("div", { class: "card wizard-card" }, [
      h("div", { class: "wizard-answer" }, [ cfg.answerFn(item) ]),
      cfg.contextFn(item)
    ]));
    var g = cfg.groupOf(item);
    var prev = h("button", { class: "btn", onClick: function () { if (!atStart) cfg.onNav(idx - 1); }, text: "‹ Previous" });
    if (atStart) prev.setAttribute("disabled", "");
    var next = h("button", { class: "btn primary", onClick: function () { if (!atEnd) cfg.onNav(idx + 1); }, text: "Next ›" });
    if (atEnd) next.setAttribute("disabled", "");
    wrap.appendChild(h("div", { class: "wizard-footbar" }, [
      h("button", { class: "btn", onClick: function () { cfg.onList(g.id); }, text: "Switch to list view" }),
      h("span", { class: "wizard-footmeta", text: (g.label || g.id) + " · " + g.name }),
      h("div", { class: "spacer" }, []),
      prev,
      h("button", { class: "btn", onClick: function () { go("report"); }, text: "Jump to report" }),
      next
    ]));
    return wrap;
  }
  // Right-hand context column: status pill + why-matters + what-to-look-for + reference.
  function wizardContextCol(statusPill, rationale, evidencePrompt, refTag) {
    var kids = [ h("div", { class: "wiz-ctx-block" }, [statusPill]) ];
    if (rationale) kids.push(h("div", { class: "wiz-ctx-block" }, [ h("div", { class: "wiz-ctx-label", text: "Why this matters" }), h("div", { class: "wiz-ctx-text", text: rationale }) ]));
    if (evidencePrompt) kids.push(h("div", { class: "wiz-ctx-block" }, [ h("div", { class: "wiz-ctx-label", text: "What to look for" }), h("div", { class: "wiz-ctx-good", text: evidencePrompt }) ]));
    if (refTag) kids.push(h("div", { class: "wiz-ctx-block" }, [ h("div", { class: "wiz-ctx-label", text: "Reference" }), h("div", { class: "wiz-ctx-maps" }, [ h("span", { class: "wiz-ctx-tag", text: refTag }) ]) ]));
    return h("div", { class: "wizard-context" }, kids);
  }
  function wizardEvidenceNotes(tid, id, resp, prompt) {
    return [
      h("div", { class: "field", style: "margin-top:10px;" }, [ h("label", { text: "Evidence" }),
        (function () { var ta = h("textarea", { placeholder: prompt || "" }); ta.value = resp.evidence || ""; ta.addEventListener("change", function () { E.setResponse(tid, id, { evidence: ta.value }); }); return ta; })() ]),
      h("div", { class: "field" }, [ h("label", { text: "Notes" }),
        (function () { var ta = h("textarea"); ta.value = resp.notes || ""; ta.addEventListener("change", function () { E.setResponse(tid, id, { notes: ta.value }); }); return ta; })() ])
    ];
  }

  // ---- capability-sl guided wizard (one requirement per page) ----
  var slWizardIdx = 0;
  function slWizardItems() {
    var out = [];
    ((E.state.taxonomy && E.state.taxonomy.frs) || []).forEach(function (fr) { out = out.concat(E.getRequirementsByFR(fr.id)); });
    return out;
  }
  function enterSLWizard(idx) { var items = slWizardItems(); slWizardIdx = Math.max(0, Math.min(idx || 0, Math.max(0, items.length - 1))); view = "sl-wizard"; viewFR = null; render(); }
  function slScoredReq(req) {
    var scored = E.scoreActiveTarget();
    var frRes = (scored && scored.perFR && scored.perFR.filter(function (f) { return f.frId === req.frId; })[0]) || null;
    return frRes ? frRes.reqs.filter(function (r) { return r.requirementId === req.id; })[0] : null;
  }
  function slWizardAnswer(req) {
    var tid = E.state.activeTargetId;
    var resp = E.findResponse(tid, req.id) || { components: {}, evidence: "", notes: "" };
    var sr = slScoredReq(req);
    var scoped = ((sr && sr.items) || []).filter(function (i) { return i.inScope; });

    var kids = [
      h("div", { class: "req-h" }, [ h("div", null, [ h("span", { class: "req-code", text: req.code }), h("span", { class: "req-title", text: req.title }) ]) ]),
      h("div", { class: "req-q", text: req.question })
    ];

    if (scoped.length === 0) {
      kids.push(h("div", { class: "hint", style: "margin-top:10px;", text:
        "Out of scope at the target Security Level for this " +
        (E.state.instrument.targetDimensionLabel || "zone").toLowerCase() + ". Nothing to record." }));
      return h("div", { class: "req" }, kids);
    }

    // Same controls as the list view: the Security Level is the answer, and
    // the items behind it open when they do not match a single level.
    var wAllNA = sr.countedCount === 0 && sr.excludedCount > 0;
    kids.push(h("div", { class: "sl-items-h" }, [
      h("span", { class: "sl-items-label", text: "Security Level achieved" })
    ]));
    // Same rule as the list view: the full ladder, and the one actually picked
    // shown as chosen.
    var wOffered = slLevelsOffered();
    var wShown = slShownLevel(sr, wOffered);
    kids.push(h("div", { class: "sl-row sl-achieved-row" },
      wOffered.map(function (n) {
        var here = sr.touched && !wAllNA && wShown === n;
        var wAbove = n > sr.targetSL;
        return h("button", {
          class: "sl-btn sl-achieved-btn" + (here && sr.matchesCleanSL ? " active" : "") +
                 (here && !sr.matchesCleanSL ? " derived" : "") + (wAbove ? " above-target" : "") +
                 (wAbove && n === sr.targetSL + 1 ? " first-above" : ""),
          title: wAbove
            ? "Above the target of " + S.formatSL(sr.targetSL) + " for this " + targetNoun() +
              ". Recording it shows where there is already headroom; it is never counted as outstanding work."
            : "",
          // Writing above the target is what was asked for, so the ceiling is
          // the level picked, not the target.
          onClick: function () { E.setRequirementSL(tid, req.id, n, Math.max(n, sr.targetSL)); renderSLWizardPage(); },
          text: "SL " + n
        });
      }).concat([
        h("button", {
          class: "sl-btn na" + (wAllNA ? " active" : ""),
          onClick: function () { E.setRequirementSL(tid, req.id, "na", sr.targetSL, ""); renderSLWizardPage(); },
          text: "N/A"
        })
      ]).concat(
        // Same rule as the list view: nothing of this zone's own, nothing to clear.
        ownAnswer(tid, req.id)
          ? [h("button", { class: "sl-btn clear-answer",
              onClick: function () { E.setRequirementSL(tid, req.id, null, sr.targetSL); renderSLWizardPage(); },
              text: "Clear" })]
          : []
      )));

    var wAdjusted = sr.touched && !sr.matchesCleanSL && !wAllNA;
    // The wizard is the on-site flow - one requirement at a time - so it is
    // exactly where a consultant notices that this zone's answer is the same as
    // the last one's. Withholding the sharing controls here meant breaking off
    // to the list view to say so.
    var wOnShared = E.isSharedScope(tid);
    var wCoverage = (wOnShared && slReqCoverageControl(req, renderSLWizardPage)) || { toggle: null, panel: null };
    var wLink = slLinkControl(req, sr, renderSLWizardPage);
    kids.push(h("div", { class: "sl-answer-aside", style: "margin-top:8px;" }, [
      wAdjusted ? h("span", { class: "pill flag", text: "Set per item" }) : null,
      wAllNA ? h("span", { class: "pill na", text: "Excluded" }) : null,
      wCoverage.toggle,
      wLink.toggle
    ]));
    if (wCoverage.panel) kids.push(wCoverage.panel);
    if (wLink.panel) kids.push(wLink.panel);
    var naField = naJustification(req, sr, tid, renderSLWizardPage);
    if (naField) kids.push(naField);

    // The level detail stays in the answer column - it is wide, and the context
    // rail is a fixed 322px. It starts CLOSED, the same as the list view: the
    // panel is long enough to push the evidence box off screen, and a
    // consultant working through the wizard is usually recording what they
    // found rather than reading what each level requires. One click opens it,
    // and the open state then follows the requirement to the list view.
    var wOpen = slGuidanceOpen[req.id] === true;
    kids.push(h("div", { class: "sl-row-bar", style: "margin-top:10px;" }, [
      h("button", {
        type: "button",
        class: "sl-items-toggle" + (wOpen ? " open" : ""),
        onClick: function () { slGuidanceOpen[req.id] = !wOpen; renderSLWizardPage(); },
        text: "What each level requires"
      })
    ]));
    if (wOpen) {
      var wPanel = slLevelPanel(req, sr, renderSLWizardPage);
      if (wPanel) kids.push(wPanel);
    }

    return h("div", { class: "req" }, kids
      .concat(wizardEvidenceNotes(tid, req.id, resp, req.evidencePrompt))
      .concat([remediationBlock(req.id, renderSLWizardPage, { openOnGap: true })]));
  }
  function slWizardContext(req) {
    var sr = slScoredReq(req);
    var pill;
    if (!sr || sr.scopedCount === 0) pill = window.App.Report.bandPill("na");
    else if (sr.band === "met") pill = window.App.Report.bandPill("met");
    else if (sr.band === "near") pill = window.App.Report.bandPill("near");
    else if (sr.unassessedCount === sr.countedCount) pill = h("span", { class: "pill neutral", text: "Not yet assessed" });
    else pill = window.App.Report.bandPill("gap");
    return wizardContextCol(pill, req.rationale, req.evidencePrompt, req.code + " - ISA/IEC 62443");
  }
  function renderSLWizardPage() {
    refs.main.innerHTML = "";
    var items = slWizardItems();
    if (!items.length) { refs.main.appendChild(h("p", { class: "muted", text: "No requirements to capture." })); return; }
    slWizardIdx = Math.max(0, Math.min(slWizardIdx, items.length - 1));
    var frs = ((E.state.taxonomy && E.state.taxonomy.frs) || []).map(function (f) { return { id: f.id, name: f.name, label: f.id }; });
    var item = items[slWizardIdx];
    refs.main.appendChild(wizardShell({
      items: items, idx: slWizardIdx, unitNoun: "Requirement",
      groups: frs, curGroupIdx: frs.map(function (f) { return f.id; }).indexOf(item.frId),
      groupOf: function (it) { return frs.filter(function (f) { return f.id === it.frId; })[0] || { id: it.frId, name: "" }; },
      answerFn: slWizardAnswer, contextFn: slWizardContext,
      onNav: function (i) { slWizardIdx = i; renderSLWizardPage(); },
      onJump: function (fid) { for (var i = 0; i < items.length; i++) { if (items[i].frId === fid) { slWizardIdx = i; break; } } renderSLWizardPage(); },
      onList: function (fid) { go("fr", fid); }
    }));
  }

  // ---- program-maturity-ml guided wizard (one requirement per page) ----
  var mlWizardIdx = 0;
  function mlWizardItems() {
    var out = [];
    E.getMLElements().forEach(function (el) { out = out.concat(E.getMLRequirementsByElement(el.id)); });
    return out;
  }
  function enterMLWizard(idx) { var items = mlWizardItems(); mlWizardIdx = Math.max(0, Math.min(idx || 0, Math.max(0, items.length - 1))); view = "ml-wizard"; viewFR = null; render(); }
  function mlScaleLabel(val) {
    var scale = E.getMLAchievedScale();
    var all = (scale.ordered || []).concat(scale.nonScoring || []);
    for (var i = 0; i < all.length; i++) if (all[i].value === val) return all[i].label;
    return null;
  }
  function mlWizardAnswer(req) {
    var tid = E.state.activeTargetId;
    var resp = E.findResponse(tid, req.id) || { ml: null, applicable: true, evidence: "", notes: "" };
    var scale = E.getMLAchievedScale();
    function scaleBtn(opt) {
      var isNA = opt.value === "na";
      var active = isNA ? (resp.applicable === false || resp.ml === "na") : (resp.applicable !== false && resp.ml === opt.value);
      return h("button", {
        class: "sl-btn ml-scale-btn ml-" + opt.value.replace(/[^a-z0-9]/gi, "").toLowerCase() + (active ? " active" : ""),
        onClick: function () { E.setResponse(tid, req.id, isNA ? { applicable: false, ml: "na" } : { applicable: true, ml: opt.value }); renderMLWizardPage(); },
        text: opt.short || opt.label
      });
    }
    var scaleRow = h("div", { class: "sl-row ml-scale-row" }, []);
    (scale.ordered || []).forEach(function (opt) { scaleRow.appendChild(scaleBtn(opt)); });
    scaleRow.appendChild(h("span", { class: "ml-scale-sep" }, []));
    (scale.nonScoring || []).forEach(function (opt) { scaleRow.appendChild(scaleBtn(opt)); });
    var kids = [ h("div", { class: "req-h" }, [ h("div", null, [ h("span", { class: "req-code", text: req.code }), h("span", { class: "req-title", text: req.title }) ]) ]) ];
    var reqText = (req.verbatimText && req.verbatimText.trim()) ? req.verbatimText : (req.hint || "");
    if (reqText) kids.push(h("p", { class: "muted", style: "margin:6px 0 10px;", text: reqText }));
    kids.push(h("div", { class: "field", style: "margin-top:4px;" }, [ h("label", { text: "Maturity level" }), scaleRow ]));
    return h("div", { class: "req" }, kids
      .concat(wizardEvidenceNotes(tid, req.id, resp, req.evidencePrompt))
      .concat([remediationBlock(req.id, renderMLWizardPage, { openOnGap: true })]));
  }
  function mlWizardContext(req) {
    var resp = E.findResponse(E.state.activeTargetId, req.id) || {};
    var pill = h("span", { class: "pill " + mlPillBand(resp.applicable === false ? "na" : resp.ml), text: resp.applicable === false ? "Not applicable" : (mlScaleLabel(resp.ml) || "Not yet set") });
    return wizardContextCol(pill, req.rationale, req.evidencePrompt, req.code + " · " + (req.theme || ""));
  }
  function renderMLWizardPage() {
    refs.main.innerHTML = "";
    var items = mlWizardItems();
    if (!items.length) { refs.main.appendChild(h("p", { class: "muted", text: "No requirements to capture." })); return; }
    mlWizardIdx = Math.max(0, Math.min(mlWizardIdx, items.length - 1));
    var els = E.getMLElements().map(function (e) { return { id: e.id, name: e.name, label: e.id }; });
    var item = items[mlWizardIdx];
    refs.main.appendChild(wizardShell({
      items: items, idx: mlWizardIdx, unitNoun: "Requirement",
      groups: els, curGroupIdx: els.map(function (e) { return e.id; }).indexOf(item.elementId),
      groupOf: function (it) { return els.filter(function (e) { return e.id === it.elementId; })[0] || { id: it.elementId, name: "" }; },
      answerFn: mlWizardAnswer, contextFn: mlWizardContext,
      onNav: function (i) { mlWizardIdx = i; renderMLWizardPage(); },
      onJump: function (eid) { for (var i = 0; i < items.length; i++) { if (items[i].elementId === eid) { mlWizardIdx = i; break; } } renderMLWizardPage(); },
      onList: function (eid) { go("ml-element", eid); }
    }));
  }

  // ---- csms-conformance guided wizard (one element per page) ----
  var csmsWizardIdx = 0;
  function csmsWizardItems() {
    var out = [];
    E.getCSMSCategories().forEach(function (c) { out = out.concat(E.getCSMSElementsByCategory(c.id)); });
    return out;
  }
  function enterCSMSWizard(idx) { var items = csmsWizardItems(); csmsWizardIdx = Math.max(0, Math.min(idx || 0, Math.max(0, items.length - 1))); view = "csms-wizard"; viewFR = null; render(); }
  function csmsWizardAnswer(el) {
    var tid = E.state.activeTargetId;
    var resp = E.findResponse(tid, el.id) || { state: null, applicable: true, evidence: "", notes: "" };
    function setState(v, applicable) { E.setResponse(tid, el.id, { applicable: applicable !== false, state: v }); renderCSMSWizardPage(); }
    var scale = E.getCSMSStateScale();
    var btns = scale.map(function (s) {
      return h("button", { class: "sl-btn caf-state-btn " + (CSMS_BTN[s.value] || "") + (resp.applicable !== false && resp.state === s.value ? " active" : ""), onClick: function () { setState(s.value); }, text: s.label });
    });
    btns.push(h("button", { class: "sl-btn special" + (resp.state === "unknown" ? " active" : ""), onClick: function () { setState("unknown"); }, text: "Unknown" }));
    btns.push(h("button", { class: "sl-btn na" + ((resp.applicable === false || resp.state === "na") ? " active" : ""), onClick: function () { setState("na", false); }, text: "N/A" }));
    var kids = [ h("div", { class: "req-h" }, [ h("div", null, [ h("span", { class: "req-code", text: el.code }), h("span", { class: "req-title", text: el.title }) ]) ]),
      h("div", { class: "sl-row caf-state-row", style: "margin-top:8px;" }, btns) ];
    return h("div", { class: "req posture-q" }, kids
      .concat(wizardEvidenceNotes(tid, el.id, resp, el.evidencePrompt))
      .concat([remediationBlock(el.id, renderCSMSWizardPage, { openOnGap: true })]));
  }
  function csmsWizardContext(el) {
    var resp = E.findResponse(E.state.activeTargetId, el.id) || {};
    var pillCls = (resp.applicable === false || resp.state === "na") ? "na" : (resp.state === "unknown") ? "neutral" : (CSMS_PILL[resp.state] || "neutral");
    var pillTxt = (resp.applicable === false || resp.state === "na") ? "Not applicable" : (resp.state === "unknown") ? "Unknown" : (resp.state ? (window.App.ScoringCSMS.stateLabelFor(resp.state, E.state.profile) || "") : "Not yet set");
    var col = wizardContextCol(h("span", { class: "pill " + pillCls, text: pillTxt }), el.rationale, el.evidencePrompt, el.code + " - ISA/IEC 62443-2-1:2010");
    // The list view's Guidance expander also carries the conformance hint and
    // the OT framing; the wizard was showing neither, so the focused view had
    // LESS to judge against than the dense one. Insert them ahead of the
    // Reference block, matching the list view's order.
    var extras = [];
    if (el.hint) extras.push(h("div", { class: "wiz-ctx-block" }, [
      h("div", { class: "wiz-ctx-label", text: "What good conformance looks like" }),
      h("div", { class: "wiz-ctx-text", text: el.hint })
    ]));
    if (el.otLens && el.otLens.framing) extras.push(h("div", { class: "wiz-ctx-block" }, [
      h("div", { class: "wiz-ctx-label", text: "OT context" }),
      h("div", { class: "wiz-ctx-text", text: el.otLens.framing })
    ]));
    if (extras.length) {
      var refBlock = col.lastChild;
      extras.forEach(function (n) { col.insertBefore(n, refBlock); });
    }
    return col;
  }
  function renderCSMSWizardPage() {
    refs.main.innerHTML = "";
    var items = csmsWizardItems();
    if (!items.length) { refs.main.appendChild(h("p", { class: "muted", text: "No elements to capture." })); return; }
    csmsWizardIdx = Math.max(0, Math.min(csmsWizardIdx, items.length - 1));
    var cats = E.getCSMSCategories().map(function (c) { return { id: c.id, name: c.name, label: c.id.replace(/^CAT-/, "") }; });
    var item = items[csmsWizardIdx];
    refs.main.appendChild(wizardShell({
      items: items, idx: csmsWizardIdx, unitNoun: "Element",
      groups: cats, curGroupIdx: cats.map(function (c) { return c.id; }).indexOf(item.categoryId),
      groupOf: function (it) { return cats.filter(function (c) { return c.id === it.categoryId; })[0] || { id: it.categoryId, name: "" }; },
      answerFn: csmsWizardAnswer, contextFn: csmsWizardContext,
      onNav: function (i) { csmsWizardIdx = i; renderCSMSWizardPage(); },
      onJump: function (cid) { for (var i = 0; i < items.length; i++) { if (items[i].categoryId === cid) { csmsWizardIdx = i; break; } } renderCSMSWizardPage(); },
      onList: function (cid) { go("csms-category", cid); }
    }));
  }

  // ---- csms-conformance (ISA/IEC 62443-2-1:2010) getting-started + capture ---

  var CSMS_BTN  = { "not-in-place": "caf-state-not", "partially": "caf-state-partially", "largely": "csms-state-largely", "in-place": "caf-state-achieved" };
  var CSMS_PILL = { "not-in-place": "gap", "partially": "near", "largely": "exceeds", "in-place": "met" };

  function csmsGettingStartedCard() {
    var inst = E.state.instrument;
    var cats = E.getCSMSCategories();
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "CSMS conformance and gap analysis: how this works" })]),
      h("div", { class: "card-b" }, [
        h("p", { text: inst.framing || "" }),
        h("ul", null, [
          h("li", null, ["Each CSMS element is judged Not in place / Partially in place / Largely in place / In place against full conformance with ISA/IEC 62443-2-1:2010."]),
          h("li", null, ["Unknown reduces coverage and lowers confidence; Not applicable drops the element from the score and coverage."]),
          h("li", null, ["No single CSMS grade is produced. The report is a conformance profile by category and element group, plus a gap roadmap of every Not in place or Partially in place element."]),
          h("li", null, ["This is a conformance gap analysis, not a certification. The 2024 edition restructures this CSMS into a maturity-based Security Program (a separate instrument in this tool)."])
        ]),
        h("table", { class: "tbl", style: "margin-top:10px;" }, [
          h("thead", null, [h("tr", null, [h("th", null, ["Category"]), h("th", { class: "center" }, ["Elements"])])]),
          h("tbody", null, cats.map(function (c) {
            var n = E.getCSMSElementsByCategory(c.id).length;
            return h("tr", null, [
              h("td", null, [h("strong", { text: c.id }), " " + c.name]),
              h("td", { class: "center", text: String(n) })
            ]);
          }))
        ])
      ])
    ]);
  }

  function buildCSMSNav(s) {
    var scored = E.scoreActiveTarget();
    s.appendChild(h("div", { class: "nav-section-title", text: "CSMS categories" }));
    s.appendChild(h("div", {
      class: "nav-item" + (view === "csms-wizard" ? " active" : ""),
      onClick: function () { enterCSMSWizard(view === "csms-wizard" ? csmsWizardIdx : 0); }
    }, [ h("span", null, ["Guided wizard"]), h("span", { class: "badge", text: "1 / page" }) ]));
    E.getCSMSCategories().forEach(function (c) {
      var cRes = scored ? scored.byCategory.filter(function (x) { return x.categoryId === c.id; })[0] : null;
      s.appendChild(h("div", {
        class: "nav-item" + (view === "csms-category" && viewFR === c.id ? " active" : ""),
        onClick: function () { go("csms-category", c.id); }
      }, [
        h("span", null, [h("strong", { text: c.id.replace(/^CAT-/, "") }), " " + c.name]),
        h("span", { class: "badge", text: cRes ? (cRes.answered + "/" + cRes.total) : "" })
      ]));
    });
  }

  // Which items have their "why this is asked" note open. Module-local, like
  // the other expander state: it is a reading preference, not an answer.
  var raRationaleOpen = {};
  var raAnchorsOpen = {};

  // What each band looks like for this item. The selected band's description
  // is always shown under the buttons, so the consultant sees what they have
  // just claimed; all four open behind a toggle, for deciding between two.
  // These are what make two consultants band the same organisation the same
  // way: the axis definitions say what "open" means in general, an anchor says
  // what it looks like for, say, risk acceptance.
  function raAnchorBlock(item, resp, bands, anchors, rerender, alwaysOpen) {
    var RA = window.App.ScoringRiskAppetite;
    var wrap = h("div", { class: "ra-anchors" }, []);
    if (resp.band && anchors[resp.band]) {
      wrap.appendChild(h("p", { class: "ra-anchor-current" }, [
        h("strong", { text: RA.titleCase(resp.band) + " here means: " }), anchors[resp.band]
      ]));
    }
    var open = alwaysOpen || raAnchorsOpen[item.id] === true;
    if (!alwaysOpen) {
      wrap.appendChild(h("div", { class: "sl-row-bar", style: "margin-top:6px;" }, [
        h("button", {
          type: "button",
          class: "sl-items-toggle" + (open ? " open" : ""),
          onClick: function () { raAnchorsOpen[item.id] = !open; rerender(); },
          text: "What each band looks like for this item"
        })
      ]));
    }
    if (open) {
      wrap.appendChild(h("div", { class: "ra-band-legend", style: "margin-top:8px;" }, bands.map(function (b) {
        return h("div", { class: "ra-band-def" + (resp.band === b ? " current" : "") }, [
          h("div", { class: "ra-band-name", text: RA.titleCase(b) }),
          h("div", { class: "muted small", text: anchors[b] || "" })
        ]);
      })));
    }
    return wrap;
  }

  // Technical readings only: is this state a choice, or a managed constraint?
  // Old firmware pinned by vendor certification, with the risk compensated and
  // tracked, is not appetite; the same firmware with nobody managing the risk
  // is. Getting this wrong is the likeliest way for the report to be
  // challenged by the client's own engineers.
  // What a reading rests on, kept apart from the characterisation (what it
  // tells you). A board or client that challenges a band gets pointed at the
  // interview, document or observation behind it, rather than at the
  // consultant's reading of it. Saved on change so focus is never lost.
  function raEvidenceField(tid, item, resp, rows) {
    var ev = h("textarea", { class: "input", rows: String(rows || 2),
      placeholder: "What this rests on: who said it, which document, what was seen" });
    ev.value = (resp && resp.evidence) || "";
    ev.addEventListener("change", function () {
      E.setResponse(tid, item.id, { evidence: ev.value });
      markDirty();
    });
    return h("div", { class: "field ra-evidence" }, [ h("label", { text: "Evidence" }), ev ]);
  }

  var RA_DISPOSITION_LABELS = {
    accepted: "Accepted in practice",
    constrained: "Constrained, and managed"
  };

  // "Could not establish" on any item. Stored as notEstablished; older files
  // recorded it on technical items as the disposition "unknown", which reads
  // the same way (see ScoringRiskAppetite).
  function raIsNotEstablished(resp) {
    return !!(resp && (resp.notEstablished === true || resp.disposition === "unknown"));
  }
  // A band and "could not establish" are alternatives: choosing one clears the
  // other, including the older technical-only form of it.
  function raSetBand(tid, item, resp, band) {
    var patch = { band: band, notEstablished: false };
    if (resp && resp.disposition === "unknown") patch.disposition = "";
    E.setResponse(tid, item.id, patch);
  }
  function raNotEstablishedButton(item, resp, rerender) {
    var tid = E.state.activeTargetId;
    var on = raIsNotEstablished(resp);
    var btn = h("button", {
      class: "ra-band-btn ra-ne-btn" + (on ? " active" : ""),
      title: "Asked about, but nobody could say. Left out of the band and reported as a finding.",
      text: "Could not establish"
    });
    btn.addEventListener("click", function () {
      E.setResponse(tid, item.id, on
        ? { notEstablished: false, disposition: resp && resp.disposition === "unknown" ? "" : (resp && resp.disposition) || "" }
        : { notEstablished: true, band: null, disposition: "" });
      markDirty(); rerender();
    });
    return btn;
  }

  function raDispositionControl(item, resp, sec, rerender) {
    if (!sec || sec.axis !== "appetite-revealed") return null;
    // Nothing to classify when the state itself could not be established.
    if (raIsNotEstablished(resp)) return null;
    var tid = E.state.activeTargetId;
    var cur = resp.disposition || "";
    var row = h("div", { class: "ra-band-row ra-disposition-row" },
      ["accepted", "constrained"].map(function (d) {
        var on = cur === d;
        var btn = h("button", {
          class: "ra-band-btn ra-disp-btn" + (on ? " active" : ""),
          "data-disposition": d,
          text: RA_DISPOSITION_LABELS[d]
        });
        btn.addEventListener("click", function () {
          E.setResponse(tid, item.id, { disposition: on ? "" : d });
          markDirty(); rerender();
        });
        return btn;
      }));
    return h("div", { class: "field ra-disposition", style: "margin-top:10px;" }, [
      h("label", { text: "Is this a choice, or a constraint?" }),
      row,
      h("p", { class: "muted small", style: "margin:4px 0 0;", text:
        "Count it as appetite where the state is a choice, or has been left unmanaged. A genuine operational "
        + "constraint that is being managed (firmware pinned by vendor certification, say, with the risk "
        + "compensated and tracked) is not appetite, and is reported without being counted. A constraint "
        + "nobody is managing still counts. Left unset, the reading counts." })
    ]);
  }

  // ---- risk appetite: setup ---------------------------------------------
  // Two decisions that shape everything after them: which sector (which sets a
  // baseline exposure band) and whether the technical layer is in play.
  function renderRiskAppetiteSetupPage() {
    refs.main.innerHTML = "";
    var RA = window.App.ScoringRiskAppetite;
    var setup = E.getRiskAppetiteSetup();
    var spec = (E.state.instrument.setup || []);
    var sectorSpec = spec.filter(function (s) { return s.type === "sector-baseline"; })[0] || {};
    var toggleSpec = spec.filter(function (s) { return s.type === "toggle"; })[0] || {};

    refs.main.appendChild(h("h1", { class: "page-title", text: "Sector and scope" }));
    refs.main.appendChild(h("p", { class: "page-sub", text:
      "Sets the starting point for the exposure conversation. Everything here is a starting point you can override." }));

    // --- sector ---
    var sectors = RA.sectors();
    var sel = h("select", { class: "input" }, [h("option", { value: "", text: "- choose a sector -" })].concat(
      sectors.map(function (s) {
        var o = h("option", { value: s.id, text: s.name + "  (baseline: " + RA.titleCase(s.baseline) + ")" });
        if (s.id === setup.sectorId) o.selected = true;
        return o;
      })
    ));
    sel.addEventListener("change", function () {
      E.updateRiskAppetiteSetup({ sectorId: sel.value });
      markDirty(); render();
    });
    var chosen = RA.sectorById(setup.sectorId);
    refs.main.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: sectorSpec.question || "Organisation sector" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text:
          sectorSpec.drives || "Pre-sets the baseline exposure band; you confirm or override it." }),
        sel,
        chosen ? h("p", { class: "muted small", style: "margin-bottom:0;", text: chosen.note }) : null,
        // Said plainly, because a baseline that looks like a verdict is the
        // failure mode for this whole instrument.
        h("p", { class: "muted small", text:
          "This is a house default, not a determination. The sector baselines can be tuned, and you set "
          + "the final band." })
      ])
    ]));

    // --- exposure modifiers ---
    var mods = RA.exposureModifiers();
    if (mods.length) {
      var modRows = mods.map(function (m) {
        var on = (setup.modifiers || []).indexOf(m.id) !== -1;
        var cb = h("input", { type: "checkbox" });
        cb.checked = on;
        cb.addEventListener("change", function () {
          var cur = (E.getRiskAppetiteSetup().modifiers || []).slice();
          var i = cur.indexOf(m.id);
          if (cb.checked && i === -1) cur.push(m.id);
          if (!cb.checked && i !== -1) cur.splice(i, 1);
          E.updateRiskAppetiteSetup({ modifiers: cur });
          markDirty(); render();
        });
        return h("label", { class: "check-row" }, [cb, h("span", null, [
          h("strong", { text: m.label }), h("span", { class: "muted small", text: "  " + m.effect })
        ])]);
      });
      refs.main.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "Exposure modifiers" })]),
        h("div", { class: "card-b" }, [
          h("p", { class: "muted", style: "margin-top:0;", text:
            "Considerations that push the baseline up or down. These are prompts for your judgement. Ticking one "
            + "records that you weighed it, and none of them moves the band on its own." })
        ].concat(modRows))
      ]));
    }

    // --- technical layer ---
    var tog = h("input", { type: "checkbox" });
    tog.checked = !!setup.includeTech;
    tog.addEventListener("change", function () {
      E.updateRiskAppetiteSetup({ includeTech: tog.checked });
      markDirty(); render();
    });
    refs.main.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Optional technical layer" })]),
      h("div", { class: "card-b" }, [
        h("label", { class: "check-row" }, [tog, h("span", null, [
          h("strong", { text: toggleSpec.question || "Include the optional technical layer?" })
        ])]),
        h("p", { class: "muted", text: toggleSpec.drives ||
          "Adds the technical section and enables the stated-vs-revealed comparison." }),
        h("p", { class: "muted small", style: "margin-bottom:0;", text:
          "Switching it off later hides the section from the read but keeps anything already recorded." })
      ])
    ]));
  }

  // ---- risk appetite: guided wizard --------------------------------------
  // One item per page. This is the family the wizard fits best: the whole
  // instrument is a structured interview, and a single prompt on screen is how
  // it is actually conducted. Same answers as the list view.
  var raWizardIdx = 0;
  function raWizardItems() {
    var out = [];
    E.getRiskAppetiteSections().forEach(function (sec) {
      out = out.concat(E.getRiskAppetiteItems(sec.id));
    });
    return out;
  }
  function raSectionOf(item) {
    return E.getRiskAppetiteSections().filter(function (s) { return s.id === item.sectionId; })[0]
      || { id: item.sectionId, name: "" };
  }
  function raBandsFor(item) {
    var RA = window.App.ScoringRiskAppetite;
    return RA.axisSpec(E.state.profile, RA.axisForSection(raSectionOf(item))).bands;
  }

  function raWizardAnswer(item) {
    var RA = window.App.ScoringRiskAppetite;
    var tid = E.state.activeTargetId;
    var resp = E.findResponse(tid, item.id) || {};
    var bands = raBandsFor(item);
    var spec = RA.axisSpec(E.state.profile, RA.axisForSection(raSectionOf(item)));

    var kids = [
      h("div", { class: "req-head" }, [
        h("span", { class: "req-code", text: item.code || item.id }),
        h("span", { class: "req-title", text: "  " + item.title })
      ]),
      // The question, first and loudest - it is the one being asked aloud.
      h("div", { class: "ra-prompt" }, [
        h("div", { class: "ra-prompt-label", text: "Ask" }),
        h("p", { class: "ra-prompt-text", text: item.interviewPrompt || "" })
      ])
    ];
    if (item.stateSummary) kids.push(h("p", { class: "muted small", text: item.stateSummary }));

    var anchors = RA.anchorsFor(item, spec);
    kids.push(h("div", { class: "ra-band-row" }, bands.map(function (b) {
      var on = resp.band === b;
      var btn = h("button", {
        class: "ra-band-btn" + (on ? " active" : ""),
        title: anchors[b] || "",
        text: RA.titleCase(b)
      });
      btn.addEventListener("click", function () {
        raSetBand(tid, item, resp, on ? null : b);
        markDirty(); renderRiskAppetiteWizardPage();
      });
      return btn;
    }).concat([raNotEstablishedButton(item, resp, renderRiskAppetiteWizardPage)])));
    var disp = raDispositionControl(item, resp, raSectionOf(item), renderRiskAppetiteWizardPage);
    if (disp) kids.push(disp);

    var ta = h("textarea", { rows: "4",
      placeholder: "Characterisation: what you heard, and what it tells you" });
    ta.value = resp.notes || "";
    ta.addEventListener("change", function () {
      E.setResponse(tid, item.id, { notes: ta.value });
      markDirty();
    });
    kids.push(h("div", { class: "field", style: "margin-top:10px;" }, [
      h("label", { text: "Characterisation" }), ta
    ]));
    kids.push(raEvidenceField(tid, item, resp, 2));

    // What each band looks like for THIS item, open, in the answer column
    // rather than the narrow context rail: four descriptions at ~90px a column
    // is not readable, which the CAF wizard already learned the hard way. In
    // the wizard there is room, and deciding the band is the whole job.
    kids.push(raAnchorBlock(item, resp, bands, anchors, renderRiskAppetiteWizardPage, true));
    return h("div", { class: "req" }, kids);
  }

  function raWizardContext(item) {
    var RA = window.App.ScoringRiskAppetite;
    var tid = E.state.activeTargetId;
    var resp = E.findResponse(tid, item.id) || {};
    var sec = raSectionOf(item);
    var pill = h("span", {
      class: "pill " + (resp.band ? "neutral" : ""),
      text: resp.band ? RA.titleCase(resp.band) : "Not yet characterised"
    });
    // No "what to look for": this is an interview, and the evidence prompt for
    // every item is the question itself, which is already in the answer column.
    return wizardContextCol(pill, item.rationale || "", "", sec.name);
  }

  function renderRiskAppetiteWizardPage() {
    refs.main.innerHTML = "";
    var items = raWizardItems();
    if (!items.length) {
      refs.main.appendChild(h("p", { class: "muted", text: "No items to capture." }));
      return;
    }
    raWizardIdx = Math.max(0, Math.min(raWizardIdx, items.length - 1));
    var secs = E.getRiskAppetiteSections().map(function (s) {
      return { id: s.id, name: s.name, label: s.id };
    });
    var item = items[raWizardIdx];
    refs.main.appendChild(wizardShell({
      items: items, idx: raWizardIdx, unitNoun: "Item",
      groups: secs,
      curGroupIdx: secs.map(function (s) { return s.id; }).indexOf(item.sectionId),
      groupOf: function (it) { return raSectionOf(it); },
      answerFn: raWizardAnswer, contextFn: raWizardContext,
      onNav: function (i) { raWizardIdx = i; renderRiskAppetiteWizardPage(); },
      onJump: function (sid) {
        for (var i = 0; i < items.length; i++) {
          if (items[i].sectionId === sid) { raWizardIdx = i; break; }
        }
        renderRiskAppetiteWizardPage();
      },
      onList: function (sid) { go("ra-section", sid); }
    }));
  }
  function enterRiskAppetiteWizard(i) {
    raWizardIdx = i || 0;
    go("ra-wizard");
  }

  // ---- risk appetite: the assessor's read --------------------------------
  // The bands compute a verdict; the consultant decides it. Both are on this
  // page at once, so overriding is a deliberate act taken while looking at what
  // you are disagreeing with - not a setting buried somewhere else.
  function renderRiskAppetiteVerdictPage() {
    refs.main.innerHTML = "";
    var RA = window.App.ScoringRiskAppetite;
    var scored = E.scoreActiveTarget();
    if (!scored) return;
    var setup = E.getRiskAppetiteSetup();
    var v = scored.verdict || {};
    var computed = v.computed || v;

    refs.main.appendChild(h("h1", { class: "page-title", text: "Assessor's read" }));
    refs.main.appendChild(h("p", { class: "page-sub", text:
      "What the two positions compute to, and your judgement on whether that is the right reading." }));

    // What the plot shows.
    refs.main.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Where the characterisation puts them" })]),
      h("div", { class: "card-b" }, [
        h("p", { style: "margin-top:0;" }, [
          h("strong", { text: scored.exposure.bandLabel || "not set" }),
          h("span", { class: "muted", text: " exposure  /  " }),
          h("strong", { text: scored.appetite.bandLabel || "not set" }),
          h("span", { class: "muted", text: " appetite" })
        ]),
        h("div", { class: "ra-verdict" }, [
          h("span", { class: "ra-verdict-badge " + (computed.key || "incomplete") + (computed.lean === "under-protected" ? " leaning-under" : ""),
                      text: computed.displayLabel || computed.label || "Not yet characterised" }),
          computed.warrantedBand || v.warrantedBand
            ? h("span", { class: "muted", text: "an exposure of "
                + String(scored.exposure.bandLabel || "").toLowerCase() + " would normally warrant "
                + (/^[aeiou]/i.test(String(v.warrantedBand || "")) ? "an " : "a ")
                + String(v.warrantedBand || "").toLowerCase() + " appetite" })
            : null
        ]),
        h("p", { class: "muted", text: computed.explanation || "" })
      ])
    ]));

    // The override.
    var opts = [h("option", { value: "", text: "Accept the computed read" })];
    Object.keys(RA.VERDICTS).forEach(function (k) {
      var o = h("option", { value: k, text: "Record as " + RA.VERDICTS[k] });
      if (setup.verdictOverride === k) o.selected = true;
      opts.push(o);
    });
    var sel = h("select", { class: "input" }, opts);
    sel.addEventListener("change", function () {
      E.updateRiskAppetiteSetup({ verdictOverride: sel.value });
      markDirty(); render();
    });

    var ta = h("textarea", { class: "input", rows: "4",
      placeholder: "Why the computed read is not the right one here: the circumstance the bands cannot see" });
    ta.value = setup.verdictRationale || "";
    ta.addEventListener("change", function () {
      E.updateRiskAppetiteSetup({ verdictRationale: ta.value });
      markDirty(); render();
    });

    var body = [
      h("p", { class: "muted", style: "margin-top:0;", text:
        "The bands are a starting point. You have the final say on whether an appetite is appropriate to the "
        + "risks faced, because there are circumstances a four-by-four grid cannot see: a compensating group "
        + "control, an imminent divestment, a site mid-migration, a regulator-agreed trajectory, or a board that "
        + "has knowingly decided to carry a risk." }),
      sel
    ];
    if (setup.verdictOverride) {
      body.push(h("div", { class: "field", style: "margin-top:12px;", "data-check-anchor": "ra-rationale" }, [
        h("label", { text: "Why (recorded in the report)" }), ta
      ]));
      if (v.rationaleMissing) {
        body.push(h("p", { class: "placeholder-note", text:
          "Record your reasoning. It goes into the report as the basis for this verdict, and it is the part the "
          + "client is paying for. Without it, the report states a conclusion with nothing behind it." }));
      }
      body.push(h("p", { class: "muted small", style: "margin-bottom:0;", text:
        "This changes the verdict only. The exposure and appetite positions stand as you characterised them, and "
        + "the plot still shows where the organisation sits. The computed read above, and the fact that "
        + "you set the verdict yourself, stay on this page. The report gives your judgement and your "
        + "reasoning, with no comparison against the tool." }));
    }
    refs.main.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Your verdict" })]),
      h("div", { class: "card-b" }, body)
    ]));

    if (window.App.Charts && window.App.Charts.exposureAppetitePlot) {
      refs.main.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "Exposure against appetite" })]),
        h("div", { class: "card-b" }, [window.App.Charts.exposureAppetitePlot(scored)])
      ]));
    }
  }

  // ---- risk appetite: a capture section ----------------------------------
  // Interview-led, so the prompt is the loudest thing on each item - it is the
  // question actually asked in the room. The band and the characterisation sit
  // under it, and the rationale (why this is asked at all) folds away.
  function renderRiskAppetiteSectionPage(sectionId) {
    refs.main.innerHTML = "";
    var RA = window.App.ScoringRiskAppetite;
    var secs = E.getRiskAppetiteSections();
    var sec = secs.filter(function (s) { return s.id === sectionId; })[0] || secs[0];
    if (!sec) { refs.main.appendChild(h("p", { class: "muted", text: "No sections defined." })); return; }
    sectionId = sec.id;

    var axis = RA.axisForSection(sec);
    var spec = RA.axisSpec(E.state.profile, axis);
    var bands = spec.bands;
    var tid = E.state.activeTargetId;
    var scored = E.scoreActiveTarget();
    var secRes = scored ? (scored.sections || []).filter(function (x) { return x.sectionId === sectionId; })[0] : null;

    refs.main.appendChild(h("h1", { class: "page-title", text: sec.name }));
    if (sec.summary) refs.main.appendChild(h("p", { class: "page-sub", text: sec.summary }));

    // The band legend. Both axes are ordinal but neither is a ladder to climb,
    // so the definitions are shown flat, with no better/worse styling.
    refs.main.appendChild(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: spec.label + ": what the bands mean" })]),
      h("div", { class: "card-b" }, [
        spec.meaning ? h("p", { class: "muted", style: "margin-top:0;", text: spec.meaning }) : null,
        h("div", { class: "ra-band-legend" }, bands.map(function (b) {
          return h("div", { class: "ra-band-def" }, [
            h("div", { class: "ra-band-name", text: RA.titleCase(b) }),
            h("div", { class: "muted small", text: spec.bandDefinitions[b] || "" })
          ]);
        }))
      ])
    ]));

    (E.getRiskAppetiteItems(sectionId)).forEach(function (item) {
      var resp = E.findResponse(tid, item.id) || {};
      var card = h("div", { class: "card ra-item", "data-req-id": item.id }, []);
      card.appendChild(h("div", { class: "card-h" }, [
        h("h2", null, [
          h("span", { class: "req-code", text: item.code || item.id }),
          h("span", { text: "  " + item.title })
        ])
      ]));
      var body = h("div", { class: "card-b" }, []);

      // THE question. This is an interview instrument: the prompt is the work.
      body.appendChild(h("div", { class: "ra-prompt" }, [
        h("div", { class: "ra-prompt-label", text: "Ask" }),
        h("p", { class: "ra-prompt-text", text: item.interviewPrompt || "" })
      ]));
      if (item.stateSummary) {
        body.appendChild(h("p", { class: "muted small", text: item.stateSummary }));
      }

      // Band buttons, all styled alike. No red end, no green end. Each one's
      // title is what that band looks like for THIS item.
      var anchors = RA.anchorsFor(item, spec);
      var btnRow = h("div", { class: "ra-band-row" }, bands.map(function (b) {
        var on = resp.band === b;
        var btn = h("button", {
          class: "ra-band-btn" + (on ? " active" : ""),
          title: anchors[b] || "",
          text: RA.titleCase(b)
        });
        btn.addEventListener("click", function () {
          // Clicking the band already set clears it: an answer must be
          // removable, not just changeable.
          raSetBand(tid, item, resp, on ? null : b);
          markDirty(); render();
        });
        return btn;
      }));
      btnRow.appendChild(raNotEstablishedButton(item, resp, render));
      body.appendChild(btnRow);
      if (!raIsNotEstablished(resp)) body.appendChild(raAnchorBlock(item, resp, bands, anchors, render));
      var disp = raDispositionControl(item, resp, sec, render);
      if (disp) body.appendChild(disp);

      var ta = h("textarea", {
        class: "input", rows: "3",
        placeholder: "Characterisation: what you heard, and what it tells you"
      });
      ta.value = resp.notes || "";
      ta.addEventListener("change", function () {
        E.setResponse(tid, item.id, { notes: ta.value });
        markDirty();
      });
      body.appendChild(h("div", { class: "field" }, [
        h("label", { text: "Characterisation" }), ta
      ]));
      body.appendChild(raEvidenceField(tid, item, resp, 2));

      if (item.rationale) {
        var rOpen = raRationaleOpen[item.id] === true;
        body.appendChild(h("div", { class: "sl-row-bar", style: "margin-top:10px;" }, [
          h("button", {
            type: "button",
            class: "sl-items-toggle" + (rOpen ? " open" : ""),
            onClick: function () { raRationaleOpen[item.id] = !rOpen; render(); },
            text: "Why this is asked"
          })
        ]));
        if (rOpen) body.appendChild(h("p", { class: "muted", text: item.rationale }));
      }
      card.appendChild(body);
      refs.main.appendChild(card);
    });

    // Section roll-up: the suggestion, and the assessor's say over it.
    if (secRes) {
      var overrideKey = sec.axis === "exposure" ? "exposureBand"
                      : sec.axis === "appetite" ? "appetiteBand" : "revealedBand";
      var cur = E.getRiskAppetiteSetup()[overrideKey] || "";
      var osel = h("select", { class: "input" }, [
        h("option", { value: "", text: secRes.suggestedBand
          ? "Use the suggestion (" + RA.titleCase(secRes.suggestedBand) + ")"
          : "Use the suggestion (none yet)" })
      ].concat(bands.map(function (b) {
        var o = h("option", { value: b, text: "Set " + RA.titleCase(b) });
        if (b === cur) o.selected = true;
        return o;
      })));
      osel.addEventListener("change", function () {
        var patch = {}; patch[overrideKey] = osel.value;
        E.updateRiskAppetiteSetup(patch);
        markDirty(); render();
      });
      refs.main.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "Section position" })]),
        h("div", { class: "card-b" }, [
          h("p", { class: "muted", style: "margin-top:0;", text:
            (secRes.rollUp === "worst"
              ? "The suggestion is the highest band above: exposure follows the worst credible consequence, so a "
                + "high regulatory reading does not dilute a severe consequence. "
              : "The suggestion is the mean of the bands above, rounded, since appetite is an overall posture. ")
            + "Treat it as a starting position and set the band yourself where your read differs." }),
          h("p", null, [
            h("strong", { text: secRes.bandLabel || "Not yet set" }),
            secRes.overridden ? h("span", { class: "muted small", text: "  (your override)" })
              : (secRes.suggestedBand ? h("span", { class: "muted small", text: "  (from the items)" }) : null)
          ]),
          osel,
          h("p", { class: "muted small", style: "margin-bottom:0;", text:
            secRes.answeredCount + " of " + secRes.itemCount + " items characterised." })
        ])
      ]));
    }

    var fn = sectionFootNav(secs.map(function (x) { return { id: x.id, label: x.id }; }), sectionId, "ra-section");
    if (fn) refs.main.appendChild(fn);
  }

  function renderCSMSCategoryPage(categoryId) {
    refs.main.innerHTML = "";
    var cats = E.getCSMSCategories();
    var cat = cats.filter(function (c) { return c.id === categoryId; })[0];
    if (!cat) { cat = cats[0]; categoryId = cat && cat.id; }
    if (!cat) { refs.main.appendChild(h("p", { class: "muted", text: "No CSMS categories defined." })); return; }

    refs.main.appendChild(h("h1", { class: "page-title", text: cat.name }));
    refs.main.appendChild(h("p", { class: "page-sub", text:
      "Judge each element Not in place / Partially / Largely / In place, or Unknown / N/A." }));
    if (cat.summary) refs.main.appendChild(h("p", { class: "muted", text: cat.summary }));
    refs.main.appendChild(buildSitesToolbar());

    var scored = E.scoreActiveTarget();
    var cRes = scored && scored.byCategory.filter(function (x) { return x.categoryId === categoryId; })[0];
    if (cRes) refs.main.appendChild(csmsCategoryBanner(cRes));

    var groups = E.getCSMSElementGroups(categoryId);
    if (groups.length) {
      // Category with element groups (Addressing risk): one card per group, plus
      // any category-direct elements at the end.
      groups.forEach(function (g) {
        var els = E.getCSMSElementsByGroup(g.id);
        if (!els.length) return;
        refs.main.appendChild(h("div", { class: "card" }, [
          h("div", { class: "card-h" }, [h("h2", { text: g.name })]),
          h("div", { class: "card-b" }, [g.summary ? h("p", { class: "muted", style: "margin-top:0;", text: g.summary }) : null]
            .concat(els.map(function (el) { return csmsElementRow(el); })))
        ]));
      });
      var direct = E.getCSMSElementsByCategory(categoryId).filter(function (el) { return !el.elementGroupId; });
      if (direct.length) {
        refs.main.appendChild(h("div", { class: "card" }, [
          h("div", { class: "card-h" }, [h("h2", { text: "Other elements" })]),
          h("div", { class: "card-b" }, direct.map(function (el) { return csmsElementRow(el); }))
        ]));
      }
    } else {
      var els = E.getCSMSElementsByCategory(categoryId);
      refs.main.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "Elements" })]),
        h("div", { class: "card-b" }, els.map(function (el) { return csmsElementRow(el); }))
      ]));
    }
    var fn = sectionFootNav(E.getCSMSCategories().map(function (c) { return { id: c.id, label: c.id.replace(/^CAT-/, "") }; }), categoryId, "csms-category");
    if (fn) refs.main.appendChild(fn);
  }

  function csmsCategoryBanner(cRes) {
    var C = window.App.ScoringCSMS;
    var c = cRes.counts;
    return h("div", { class: "card" }, [ h("div", { class: "card-b" }, [ h("div", { class: "kpi-row" }, [
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Conformance profile" }),
        h("div", { class: "val", style: "font-size:14px; line-height:1.4;" }, [
          h("span", { class: "pill met",     text: c.inPlace + " In place" }), " ",
          h("span", { class: "pill exceeds", text: c.largely + " Largely" }), " ",
          h("span", { class: "pill near",    text: c.partially + " Partially" }), " ",
          h("span", { class: "pill gap",     text: c.notInPlace + " Not in place" })
        ])
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Gaps" }),
        h("div", { class: "val " + (cRes.gaps > 0 ? "gap" : "met"), text: String(cRes.gaps) })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Coverage" }),
        h("div", { class: "val", text: C.formatPct(cRes.coverage) + (cRes.confidenceLevel ? "  -  " + cRes.confidenceLevel : "") })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Conformance (context)" }),
        h("div", { class: "val", text: C.formatPct(cRes.conformance) })
      ])
    ]) ]) ]);
  }

  var csmsGuidanceOpen = {};

  function buildCSMSGuidancePanel(el) {
    function block(label, text) {
      return h("div", { class: "wiz-ctx-block" }, [
        h("div", { class: "wiz-ctx-label", text: label }),
        h("div", { class: "wiz-ctx-text", text: text })
      ]);
    }
    var kids = [];
    if (el.hint)          kids.push(block("What good conformance looks like", el.hint));
    if (el.otLens && el.otLens.framing) kids.push(block("OT context", el.otLens.framing));
    if (el.evidencePrompt) kids.push(block("What to look for", el.evidencePrompt));
    kids.push(block("Reference", (el.code ? el.code + " - " : "") + "ISA/IEC 62443-2-1:2010 (CSMS)"));
    return h("div", { class: "nis2-guidance" }, kids);
  }

  function csmsElementRow(el) {
    var resp = E.findResponse(E.state.activeTargetId, el.id) || { state: null, applicable: true, evidence: "", notes: "" };
    var tid = E.state.activeTargetId;

    var pillCls = (resp.applicable === false || resp.state === "na") ? "na"
      : (resp.state === "unknown") ? "neutral"
      : (CSMS_PILL[resp.state] || "neutral");
    var pillTxt = (resp.applicable === false || resp.state === "na") ? "Not applicable"
      : (resp.state === "unknown") ? "Unknown"
      : (resp.state ? (window.App.ScoringCSMS.stateLabelFor(resp.state, E.state.profile) || "") : "Not yet set");
    var pill = h("span", { class: "pill " + pillCls, text: pillTxt });

    var guideOpen = csmsGuidanceOpen[el.id] === true;
    var guideToggle = h("button", {
      type: "button", style: "margin-right:8px;",
      class: "sl-guidance-toggle" + (guideOpen ? " open" : ""),
      onClick: function () { csmsGuidanceOpen[el.id] = !guideOpen; renderCSMSCategoryPage(el.categoryId); },
      text: "Guidance"
    });

    var header = h("div", { class: "req-h" }, [
      h("div", null, [
        h("span", { class: "req-code", text: el.code }),
        h("span", { class: "req-title", text: el.title })
      ]),
      h("div", { class: "req-meta" }, [guideToggle, pill])
    ]);

    function setState(v, applicable) {
      E.setResponse(tid, el.id, { applicable: applicable !== false, state: v });
      renderCSMSCategoryPage(el.categoryId);
    }
    var scale = E.getCSMSStateScale();
    var stateBtns = scale.map(function (s) {
      return h("button", {
        class: "sl-btn caf-state-btn " + (CSMS_BTN[s.value] || "") + (resp.applicable !== false && resp.state === s.value ? " active" : ""),
        onClick: function () { setState(s.value); }, text: s.label
      });
    });
    stateBtns.push(h("button", { class: "sl-btn special" + (resp.state === "unknown" ? " active" : ""), onClick: function () { setState("unknown"); }, text: "Unknown" }));
    stateBtns.push(h("button", { class: "sl-btn na" + ((resp.applicable === false || resp.state === "na") ? " active" : ""), onClick: function () { setState("na", false); }, text: "N/A" }));
    stateBtns.push(clearAnswerBtn(resp.applicable === false || !!resp.state, function () { setState(null, true); }));
    var row = h("div", { class: "sl-row caf-state-row" }, stateBtns);

    var body = [header];
    if (el.rationale) body.push(whyThisMattersBlock(el.rationale));
    if (guideOpen) body.push(buildCSMSGuidancePanel(el));
    body.push(row);
    body.push(h("div", { class: "field", style: "margin-top:10px;" }, [
      h("label", { text: "Evidence" }),
      (function () { var ta = h("textarea", { placeholder: el.evidencePrompt || "" }); ta.value = resp.evidence || ""; ta.addEventListener("change", function () { E.setResponse(tid, el.id, { evidence: ta.value }); }); return ta; })()
    ]));
    body.push(h("div", { class: "field" }, [
      h("label", { text: "Notes" }),
      (function () { var ta = h("textarea"); ta.value = resp.notes || ""; ta.addEventListener("change", function () { E.setResponse(tid, el.id, { notes: ta.value }); }); return ta; })()
    ]));
    body.push(remediationBlock(el.id, function () { renderCSMSCategoryPage(el.categoryId); }));
    return h("div", { class: "req posture-q" + ((resp.applicable === false || !!resp.state) ? " is-answered" : ""), "data-req-id": el.id }, body);
  }

  // ---- Layered conformance capture (EU CRA, EU Machinery Regulation) -----
  // A csms-conformance instrument with independently-scored layers and a setup
  // phase. The mechanics are shared; the regulation-specific prose comes from
  // instrument.display, with the CRA wording as the fallback so eu-cra needs
  // no data changes. The plain csms paths are untouched.

  function craDisplay() {
    var d = (E.state.instrument && E.state.instrument.display) || {};
    var il = (E.state.instrument && E.state.instrument.interlockSpec) || {};
    var noun = d.productNoun || "product";
    return {
      shortName: d.shortName || "CRA",
      noun: noun,
      Noun: noun.charAt(0).toUpperCase() + noun.slice(1),
      conformityLayer: il.conformityLayer || "P3",
      referenceTag: d.referenceTag || "EU CRA (Regulation (EU) 2024/2847)",
      captureBanner: d.captureBanner || "Indicative. Requirements are shown in the Regulation's own wording where a single provision maps to the question, and assessor-phrased where the question spans several; the Regulation text governs. This informs CRA conformity; it is not a conformity assessment or certification.",
      productsCardNote: d.productsCardNote || "Rename, add or remove products here; select one to set its classification below. Part I (product requirements) and most of the conformity layer are assessed per product; Part II (vulnerability handling) and the organisation-level conformity obligations (Art 14 reporting readiness, component due diligence) are organisation-wide and shared across all products. New products inherit the shared answers.",
      wizardOrgNote: d.wizardOrgNote || "Organisation-wide obligations (Annex I Part II vulnerability handling, plus Article 14 reporting readiness and component due diligence). These are answered once and apply to every product. Do this first, then switch to By product.",
      wizardProductNote: d.wizardProductNote || "Per-product obligations (Annex I Part I product requirements and the product conformity work). Pick a product below and work through it, then pick the next product and do the same."
    };
  }

  function craIndicativeBanner() {
    return h("div", { class: "card", style: "border-left:3px solid var(--near);" }, [
      h("div", { class: "card-b", style: "padding:10px 14px;" }, [
        h("div", { class: "muted", style: "font-size:12.5px;", text: craDisplay().captureBanner })
      ])
    ]);
  }

  function craCaveatsCallout() {
    var caveats = (E.state.instrument && E.state.instrument.criticalCaveats) || [];
    if (!caveats.length) return null;
    var items = caveats.map(function (c, i) {
      return h("li", { style: i === 0 ? "font-weight:600;" : "" }, [c]);
    });
    return h("div", { class: "card", style: "border-left:3px solid var(--gap);" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Critical caveats: read before relying on this assessment" })]),
      h("div", { class: "card-b" }, [ h("ul", { style: "margin:0; padding-left:20px;" }, items) ])
    ]);
  }

  function craInterlockCallout(interlock) {
    if (!interlock || !interlock.triggered) return null;
    var missing = (interlock.missingLayers || []).join(" and ");
    var confId = craDisplay().conformityLayer;
    return h("div", { class: "card", style: "border-left:3px solid var(--gap);" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Conformity claim not substantiated by the technical layers" })]),
      h("div", { class: "card-b" }, [
        h("p", { style: "margin-top:0;", text: interlock.message || "" }),
        h("p", { class: "muted", style: "margin-bottom:0;",
          text: "The conformity layer (" + confId + ") is in scope but " + (missing || "a technical layer") + " " + ((interlock.missingLayers || []).length > 1 ? "are" : "is") + " not. Assessed alone, " + confId + " is a paperwork check, not a substantiated one." })
      ])
    ]);
  }

  // Product classification. The consultant SETS the class directly (buttons);
  // the Annex III/IV category lookup below is an optional aid that suggests a
  // class from a match. A misclassification finding surfaces when Default is
  // chosen but a matched category indicates otherwise.
  function craClassificationField(classSpec, setup) {
    var CRA = window.App.ScoringCRA;
    var d = craDisplay();
    var lk = E.getCRAClassificationLookup();
    var cls = E.getCRAClassification() || {};
    var classList = (CRA && CRA.classes && CRA.classes(E.state.instrument)) || [];
    // The annex/category naming comes from the lookup where it declares one
    // (Machinery Annex I etc.); the CRA Annex III/IV wording is the fallback.
    var annexRef = (lk && lk.authorityRef) ? lk.authorityRef.replace(/^Machinery Regulation\s+/, "") : "Annex III / IV";

    // 1) Direct class selector - an always-present dropdown of all classes (the
    // authoritative choice; works even if the Annex lookup fails to load).
    var classSel = h("select", null, classList.map(function (c) { return h("option", { value: c.id, text: c.label }); }));
    classSel.value = cls.classId || "default";
    classSel.addEventListener("change", function () { E.setCRAProductClass(classSel.value); });
    var classField = h("div", { class: "field" }, [
      h("label", { text: classSpec.question || (d.Noun + " class") }),
      h("p", { class: "muted", style: "margin:0 0 6px;", text: "Set the class the " + d.noun + " falls under. This drives the " + d.conformityLayer + " conformity route. Use the classification aid below if you are unsure." }),
      classSel,
      cls.route ? h("p", { class: "muted", style: "margin:8px 0 0;" }, [h("strong", { text: "Conformity route (" + d.conformityLayer + "): " }), cls.route]) : null
    ]);

    // 2) Classification aid - the annex category lookup (optional).
    var aidKids = [
      h("label", { text: "Classification aid - " + annexRef + " category (optional)" }),
      h("p", { class: "muted", style: "margin:0 0 6px;", text: (classSpec.method || "Match the " + d.noun + " to a category to get a suggested class. Selecting one fills the class above; you can still override it.") })
    ];
    if (lk && lk.categories) {
      var groupOrder = (lk.groupOrder && lk.groupOrder.length) ? lk.groupOrder : ["annex-iii-class-i", "annex-iii-class-ii", "annex-iv"];
      var sel = h("select", null, [ h("option", { value: "", text: "No " + annexRef + " category matches" }) ]);
      groupOrder.forEach(function (gid) {
        var cats = lk.categories[gid] || [];
        if (!cats.length) return;
        var og = document.createElement("optgroup");
        og.label = CRA ? CRA.groupLabel(gid, E.state.instrument) : gid;
        cats.forEach(function (c) { og.appendChild(h("option", { value: gid + ":" + c.id, text: c.text })); });
        sel.appendChild(og);
      });
      sel.value = setup.productCategory || "";
      sel.addEventListener("change", function () { E.setCRAProductCategory(sel.value); });
      aidKids.push(sel);
      if (cls.suggestedClassLabel) {
        aidKids.push(h("p", { class: "muted", style: "margin:6px 0 0;" }, [h("strong", { text: "Category suggests: " }), cls.suggestedClassLabel]));
      }
    } else {
      aidKids.push(h("p", { class: "muted", text: "Category lookup is not loaded, so set the class directly above. (If this persists, hard-reload the page.)" }));
    }
    var aidField = h("div", { class: "field" }, aidKids);

    var kids = [ classField, aidField ];
    if (cls.misclassification) {
      kids.push(h("div", { style: "border-left:3px solid var(--gap); background:var(--gap-bg); color:var(--text); padding:10px 14px; margin-top:4px; border-radius:4px;" }, [
        h("strong", { text: "Possible misclassification. " }),
        document.createTextNode(cls.misclassificationNote || classSpec.flagMisclassification || "")
      ]));
    }
    return h("div", null, kids);
  }

  // Products (targets) management for CRA, on the engagement details page. Each
  // product is a target with its own class and Part I answers; the product name
  // is simply the target name (renamed here). Selecting a product makes it the
  // one the classification card below applies to.
  function craProductsCard() {
    var CRA = window.App.ScoringCRA;
    var d = craDisplay();
    var raw = E.getCRASetupRaw();
    var activeId = E.state.activeTargetId;
    var targets = E.state.engagement.targets;

    var rows = targets.map(function (t) {
      var isActive = t.id === activeId;
      var nameInput = h("input", { type: "text", value: t.name });
      nameInput.addEventListener("change", function () { E.renameTarget(t.id, nameInput.value); });
      var cls = CRA ? CRA.deriveClassification(CRA.flattenSetup(raw, t.id), E.state.instrument) : { classLabel: "-" };
      var selectBtn = h("button", {
        class: "btn" + (isActive ? " primary" : ""),
        onClick: function () { E.setActiveTarget(t.id); },
        text: isActive ? "Selected" : "Select"
      });
      var removeBtn = h("button", {
        class: "btn danger",
        onClick: function () {
          if (targets.length <= 1) { toast("Keep at least one " + d.noun + ".", "warn"); return; }
          if (!confirm("Remove " + t.name + " and all its answers?")) return;
          E.removeTarget(t.id);
        },
        text: "Remove"
      });
      return h("tr", null, [
        h("td", null, [nameInput]),
        h("td", null, [cls.classLabel + (cls.misclassification ? "  ⚠" : "")]),
        h("td", { class: "right" }, [ h("div", { class: "sl-row", style: "justify-content:flex-end;" }, [selectBtn, removeBtn]) ])
      ]);
    });

    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: d.Noun + "s under assessment" }),
        h("button", { class: "btn primary", onClick: function () { var t = E.addTarget(); E.setActiveTarget(t.id); toast(d.Noun + " added."); }, text: "Add " + d.noun })
      ]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text: d.productsCardNote }),
        h("table", { class: "tbl" }, [
          h("thead", null, [h("tr", null, [ h("th", null, [d.Noun + " name"]), h("th", null, ["Class"]), h("th", { class: "right", text: "" }) ])]),
          h("tbody", null, rows)
        ])
      ])
    ]);
  }

  function craSetupCard() {
    var inst = E.state.instrument;
    var spec = E.getCRASetupSpec();
    var setup = E.getCRASetup();
    var layerSpec = spec.filter(function (s) { return s.type === "layer-select"; })[0];
    var classSpec = spec.filter(function (s) { return s.type === "classification-lookup" || s.type === "single-select"; })[0];
    var activeTarget = E.getActiveTarget();

    var cards = [];

    // 1) Engagement-wide: which layers are in scope.
    var layerKids = [ h("p", { style: "margin-top:0;", text: inst.framing || "" }) ];
    if (layerSpec) {
      var layerBtns = (layerSpec.options || []).map(function (opt) {
        var on = setup.layers.indexOf(opt.value) !== -1;
        return h("button", {
          class: "sl-btn" + (on ? " active" : ""),
          onClick: function () { E.toggleCRALayer(opt.value); },
          text: opt.value + " - " + opt.label.replace(/^[^-]*-\s*/, "")
        });
      });
      layerKids.push(h("div", { class: "field" }, [
        h("label", { text: layerSpec.question || "Layers in scope" }),
        h("div", { class: "sl-row wrap" }, layerBtns),
        layerSpec.effect ? h("p", { class: "muted", style: "margin:6px 0 0;", text: layerSpec.effect }) : null
      ]));
    }
    var d = craDisplay();
    cards.push(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: d.shortName + " setup: layers in scope" })]),
      h("div", { class: "card-b" }, layerKids)
    ]));

    // 2) Per product: classification (class + category) for the SELECTED product
    // (chosen in the Products card above). The product name is the target name.
    var prodKids = [
      h("p", { class: "muted", style: "margin-top:0;", text: "Classification applies to the selected " + d.noun + " above. Select a different " + d.noun + " there to classify it." })
    ];
    if (classSpec) prodKids.push(craClassificationField(classSpec, setup));
    cards.push(h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: d.Noun + " classification" + (activeTarget ? " - " + activeTarget.name : "") })]),
      h("div", { class: "card-b" }, prodKids)
    ]));

    // (Critical caveats render at the top of the engagement page, not here.)
    // Interlock is evaluated from the current selection even before capture.
    var scored = E.scoreActiveTarget();
    if (scored && scored.interlock) {
      var il = craInterlockCallout(scored.interlock);
      if (il) cards.push(il);
    }
    return h("div", null, cards);
  }

  function buildCRANav(s) {
    var scored = E.scoreActiveTarget();
    // Guided wizard: one requirement per page, with a mode toggle for the
    // organisation-wide track vs the per-product track. Same answers as the
    // per-layer list views below (shared assessment).
    var navName = craDisplay().shortName;
    s.appendChild(h("div", { class: "nav-section-title", text: navName + " assessment" }));
    s.appendChild(h("div", {
      class: "nav-item" + (view === "cra-wizard" ? " active" : ""),
      onClick: function () { enterCRAWizard(craWizMode, 0); }
    }, [
      h("span", null, ["Guided wizard"]),
      h("span", { class: "badge", text: "1 / page" })
    ]));
    s.appendChild(h("div", { class: "nav-section-title", text: navName + " layers (in scope)" }));
    E.getCRALayers().forEach(function (l) {
      var lRes = scored ? (scored.layers || []).filter(function (x) { return x.layerId === l.id; })[0] : null;
      var ov = lRes && lRes.overall;
      s.appendChild(h("div", {
        class: "nav-item" + (view === "cra-layer" && viewFR === l.id ? " active" : ""),
        onClick: function () { go("cra-layer", l.id); }
      }, [
        h("span", null, [h("strong", { text: l.id }), " " + l.name]),
        h("span", { class: "badge", text: ov ? (ov.answered + "/" + ov.total) : "" })
      ]));
    });
  }

  function craLayerBanner(ov) {
    var C = window.App.ScoringCRA;
    var c = ov.counts;
    return h("div", { class: "card" }, [ h("div", { class: "card-b" }, [ h("div", { class: "kpi-row" }, [
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Conformance profile" }),
        h("div", { class: "val", style: "font-size:14px; line-height:1.4;" }, [
          h("span", { class: "pill met",  text: c.inPlace + " In place" }), " ",
          h("span", { class: "pill near", text: c.partially + " Partially" }), " ",
          h("span", { class: "pill gap",  text: c.notInPlace + " Not in place" })
        ])
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Gaps" }),
        h("div", { class: "val " + (ov.gaps > 0 ? "gap" : "met"), text: String(ov.gaps) })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Coverage" }),
        h("div", { class: "val", text: C.formatPct(ov.coverage) + (ov.confidenceLevel ? "  -  " + ov.confidenceLevel : "") })
      ]),
      h("div", { class: "kpi" }, [
        h("div", { class: "lbl", text: "Conformance (context)" }),
        h("div", { class: "val", text: C.formatPct(ov.conformance) })
      ])
    ]) ]) ]);
  }

  function craElementRow(item) {
    var resp = E.findResponse(E.state.activeTargetId, item.id) || { state: null, applicable: true, evidence: "", notes: "" };
    var tid = E.state.activeTargetId;

    var pillCls = (resp.applicable === false || resp.state === "na") ? "na"
      : (resp.state === "unknown") ? "neutral"
      : (CSMS_PILL[resp.state] || "neutral");
    var pillTxt = (resp.applicable === false || resp.state === "na") ? "Not applicable"
      : (resp.state === "unknown") ? "Unknown"
      : (resp.state ? (window.App.ScoringCSMS.stateLabelFor(resp.state, E.state.profile) || "") : "Not yet set");
    var pill = h("span", { class: "pill " + pillCls, text: pillTxt });

    // Item-level organisation scope: a couple of conformity obligations (Art
    // 14 reporting readiness, component due diligence) are the manufacturer's
    // process, not a product property - their answers fan out to every
    // product. Badge them on per-product pages so the sharing is visible.
    var meta = [pill];
    var CRAsc = window.App.ScoringCRA;
    if (CRAsc && CRAsc.itemScope(E.state.instrument, item) === "organisation") {
      var layerDef = (E.state.instrument.layers || []).filter(function (l) { return l.id === item.layerId; })[0];
      if (!(layerDef && layerDef.scope === "organisation") && E.state.engagement.targets.length > 1) {
        meta.unshift(h("span", { class: "pill neutral", title: "An organisation-wide obligation: this answer is shared across all " + craDisplay().noun + "s in the engagement.", text: "Organisation-wide" }));
      }
    }

    var header = h("div", { class: "req-h" }, [
      h("div", null, [
        h("span", { class: "req-code", text: item.code }),
        h("span", { class: "req-title", text: item.title })
      ]),
      h("div", { class: "req-meta" }, meta)
    ]);

    function setState(v, applicable) {
      E.setResponse(tid, item.id, { applicable: applicable !== false, state: v });
      renderCRALayerPage(item.layerId);
    }
    var scale = E.getCRAStateScale();
    var stateBtns = scale.map(function (st) {
      return h("button", {
        class: "sl-btn caf-state-btn " + (CSMS_BTN[st.value] || "") + (resp.applicable !== false && resp.state === st.value ? " active" : ""),
        onClick: function () { setState(st.value); }, text: st.label
      });
    });
    stateBtns.push(h("button", { class: "sl-btn special" + (resp.state === "unknown" ? " active" : ""), onClick: function () { setState("unknown"); }, text: "Unknown" }));
    stateBtns.push(h("button", { class: "sl-btn na" + ((resp.applicable === false || resp.state === "na") ? " active" : ""), onClick: function () { setState("na", false); }, text: "N/A" }));
    stateBtns.push(clearAnswerBtn(resp.applicable === false || !!resp.state, function () { setState(null, true); }));

    var body = [header];
    if (item.requirement) body.push(h("div", { class: "req-q", text: item.requirement }));
    if (item.rationale) body.push(whyThisMattersBlock(item.rationale));
    body.push(h("div", { class: "sl-row caf-state-row" }, stateBtns));
    body.push(h("div", { class: "field", style: "margin-top:10px;" }, [
      h("label", { text: "Evidence" }),
      (function () { var ta = h("textarea", { placeholder: item.evidencePrompt || "" }); ta.value = resp.evidence || ""; ta.addEventListener("change", function () { E.setResponse(tid, item.id, { evidence: ta.value }); }); return ta; })()
    ]));
    body.push(h("div", { class: "field" }, [
      h("label", { text: "Notes" }),
      (function () { var ta = h("textarea"); ta.value = resp.notes || ""; ta.addEventListener("change", function () { E.setResponse(tid, item.id, { notes: ta.value }); }); return ta; })()
    ]));
    body.push(remediationBlock(item.id, function () { renderCRALayerPage(item.layerId); }));
    return h("div", { class: "req posture-q" + ((resp.applicable === false || !!resp.state) ? " is-answered" : ""), "data-req-id": item.id }, body);
  }

  function renderCRALayerPage(layerId) {
    refs.main.innerHTML = "";
    var d = craDisplay();
    var layers = E.getCRALayers();
    if (!layers.length) {
      refs.main.appendChild(h("h1", { class: "page-title", text: "No layers in scope" }));
      refs.main.appendChild(h("p", { class: "muted", text: "Select at least one " + d.shortName + " layer on the Engagement details page." }));
      return;
    }
    var layer = layers.filter(function (l) { return l.id === layerId; })[0] || layers[0];
    layerId = layer.id;

    refs.main.appendChild(h("h1", { class: "page-title", text: layer.id + " - " + layer.name }));
    refs.main.appendChild(h("p", { class: "page-sub", text:
      (layer.scope ? "Scope: " + layer.scope + ". " : "") + "Judge each requirement In place / Partially in place / Not in place, or Unknown / N/A." }));
    if (layer.summary) refs.main.appendChild(h("p", { class: "muted", text: layer.summary }));
    // Organisation-scope layers describe the manufacturer's process, so the
    // answers are one set shared by every product (edits apply to all).
    if (layer.scope === "organisation" && E.state.engagement.targets.length > 1) {
      refs.main.appendChild(h("div", { class: "card", style: "border-left:3px solid var(--brand-blue);" }, [
        h("div", { class: "card-b", style: "padding:10px 14px;" }, [
          h("div", { class: "muted", style: "font-size:12.5px;",
            text: "Organisation-wide layer: these answers are shared across all " + d.noun + "s in this engagement. A change made here applies to every " + d.noun + "." })
        ])
      ]));
    }
    // The product switcher only belongs where answers are per product. The
    // organisation layer (P2) gets NO switcher - it is one shared answer set,
    // so switching products would change nothing. The mixed conformity layer
    // (P3) gets it further down, directly above its product-specific group.
    // Purely per-product layers (P1) keep it up top, as before.
    var CRAsc2 = window.App.ScoringCRA;
    var layerItems = E.getCRAItemsByLayer(layerId);
    var orgItems = layerItems.filter(function (it) { return CRAsc2.itemScope(E.state.instrument, it) === "organisation"; });
    var prodItems = layerItems.filter(function (it) { return CRAsc2.itemScope(E.state.instrument, it) !== "organisation"; });
    var mixedLayer = layer.scope !== "organisation" && orgItems.length > 0;
    if (layer.scope !== "organisation" && !mixedLayer) refs.main.appendChild(buildSitesToolbar());
    refs.main.appendChild(craIndicativeBanner());

    var scored = E.scoreActiveTarget();
    var lRes = scored && (scored.layers || []).filter(function (x) { return x.layerId === layerId; })[0];
    if (lRes) refs.main.appendChild(craLayerBanner(lRes.overall));
    // Interlock flag surfaces on the conformity layer.
    if (layer.id === d.conformityLayer && scored && scored.interlock) {
      var il = craInterlockCallout(scored.interlock);
      if (il) refs.main.appendChild(il);
    }

    if (layer.scope === "organisation") {
      refs.main.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "Requirements" }), h("span", { class: "sub", text: "organisation-wide: one answer set for all " + d.noun + "s" })]),
        h("div", { class: "card-b" }, layerItems.map(function (it) { return craElementRow(it); }))
      ]));
    } else if (mixedLayer) {
      refs.main.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "Organisation-level obligations" }), h("span", { class: "sub", text: "answered once, shared across all " + d.noun + "s" })]),
        h("div", { class: "card-b" }, orgItems.map(function (it) { return craElementRow(it); }))
      ]));
      refs.main.appendChild(buildSitesToolbar());
      var activeT = E.getActiveTarget();
      refs.main.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: d.Noun + "-specific obligations" }), h("span", { class: "sub", text: activeT ? ("for " + activeT.name) : ("per " + d.noun) })]),
        h("div", { class: "card-b" }, prodItems.map(function (it) { return craElementRow(it); }))
      ]));
    } else {
      refs.main.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "Requirements" })]),
        h("div", { class: "card-b" }, layerItems.map(function (it) { return craElementRow(it); }))
      ]));
    }
    var fn = sectionFootNav(E.getCRALayers().map(function (l) { return { id: l.id, label: l.id }; }), layerId, "cra-layer");
    if (fn) refs.main.appendChild(fn);
  }

  // ---- CRA guided wizard (one requirement per page) ---------------------
  // Two tracks driven by a mode toggle, matching the CRA's org/product split:
  //   "org"     - the organisation-wide items (all of P2 + the org-scoped P3
  //               obligations); one shared answer set, no product switcher.
  //   "product" - the per-product items (P1 + product-scoped P3), walked for
  //               the selected product; switch product to redo it per product.
  // Shares the engine response store with the list view (answers flow both
  // ways) and reuses the posture/NIS2 wizard CSS (wizard-* / wiz-ctx-*).
  var craWizMode = "org", craWizIdx = 0;

  var CRA_SECTION_NAME = {
    "P1": { org: "Product requirements",        product: "Product requirements" },
    "P2": { org: "Vulnerability handling",      product: "Vulnerability handling" },
    "P3": { org: "Organisation-level conformity", product: "Conformity & obligations" },
    "M1": { org: "Essential requirements",      product: "Essential requirements" },
    "M2": { org: "Manufacturer processes",      product: "Manufacturer processes" },
    "M3": { org: "Organisation-level conformity", product: "Conformity & placement" }
  };

  // Build the ordered items + stepper sections for a mode. An item is in the
  // org track when ScoringCRA.itemScope === "organisation", else the product
  // track; sections are the layers (in scope order) that contribute items.
  function craWizardTrack(mode) {
    var CRA = window.App.ScoringCRA, inst = E.state.instrument;
    var items = [], sections = [];
    E.getCRALayers().forEach(function (l) {
      var layerItems = E.getCRAItemsByLayer(l.id).filter(function (it) {
        var isOrg = CRA.itemScope(inst, it) === "organisation";
        return mode === "org" ? isOrg : !isOrg;
      });
      if (!layerItems.length) return;
      var nm = (CRA_SECTION_NAME[l.id] && CRA_SECTION_NAME[l.id][mode]) || l.name;
      sections.push({ layerId: l.id, label: l.id + " · " + nm, count: layerItems.length, start: items.length });
      items = items.concat(layerItems);
    });
    return { items: items, sections: sections };
  }

  function enterCRAWizard(mode, idx) {
    craWizMode = (mode === "product") ? "product" : "org";
    var track = craWizardTrack(craWizMode);
    craWizIdx = Math.max(0, Math.min(idx || 0, Math.max(0, track.items.length - 1)));
    view = "cra-wizard"; viewFR = null;
    render();
  }

  function craWizStatePill(item) {
    var resp = E.findResponse(E.state.activeTargetId, item.id) || {};
    if (resp.applicable === false || resp.state === "na") return h("span", { class: "pill na", text: "Not applicable" });
    if (resp.state === "unknown") return h("span", { class: "pill neutral", text: "Unknown (reduces coverage)" });
    if (resp.state) return h("span", { class: "pill " + (CSMS_PILL[resp.state] || "neutral"), text: window.App.ScoringCSMS.stateLabelFor(resp.state, E.state.profile) || "" });
    return h("span", { class: "pill neutral", text: "Not yet answered" });
  }

  // Right-hand context column: status, org-wide note, why it matters, what to
  // look for, and the CRA reference.
  function craWizardContext(item) {
    var isOrg = window.App.ScoringCRA.itemScope(E.state.instrument, item) === "organisation";
    var kids = [ h("div", { class: "wiz-ctx-block" }, [craWizStatePill(item)]) ];
    if (isOrg) kids.push(h("div", { class: "wiz-ctx-block" }, [
      h("div", { class: "wiz-ctx-label", text: "Scope" }),
      h("div", { class: "wiz-ctx-good", text: "Organisation-wide: one answer for every " + craDisplay().noun + " in this engagement." })
    ]));
    if (item.rationale) kids.push(h("div", { class: "wiz-ctx-block" }, [
      h("div", { class: "wiz-ctx-label", text: "Why this matters" }),
      h("div", { class: "wiz-ctx-text", text: item.rationale })
    ]));
    if (item.evidencePrompt) kids.push(h("div", { class: "wiz-ctx-block" }, [
      h("div", { class: "wiz-ctx-label", text: "What to look for" }),
      h("div", { class: "wiz-ctx-good", text: item.evidencePrompt })
    ]));
    kids.push(h("div", { class: "wiz-ctx-block" }, [
      h("div", { class: "wiz-ctx-label", text: "Reference" }),
      h("div", { class: "wiz-ctx-maps" }, [ h("span", { class: "wiz-ctx-tag", text: item.code + " - " + craDisplay().referenceTag }) ])
    ]));
    return h("div", { class: "wizard-context" }, kids);
  }

  function craWizardAnswer(item) {
    var tid = E.state.activeTargetId;
    var resp = E.findResponse(tid, item.id) || { state: null, applicable: true, evidence: "", notes: "" };
    var isOrg = window.App.ScoringCRA.itemScope(E.state.instrument, item) === "organisation";
    function setState(v, applicable) {
      E.setResponse(tid, item.id, { applicable: applicable !== false, state: v });
      renderCRAWizardPage();
    }
    var kids = [
      h("div", { class: "req-h" }, [
        h("div", null, [
          h("span", { class: "req-code", text: item.code }),
          h("span", { class: "req-title", text: item.title }),
          isOrg ? h("span", { class: "pill neutral", style: "margin-left:8px;", title: "Shared across every product in this engagement.", text: "Organisation-wide" }) : null
        ])
      ])
    ];
    if (item.requirement) kids.push(h("p", { class: "muted", style: "margin:6px 0 10px;", text: item.requirement }));
    var scale = E.getCRAStateScale();
    var stateBtns = scale.map(function (st) {
      return h("button", {
        class: "sl-btn caf-state-btn " + (CSMS_BTN[st.value] || "") + (resp.applicable !== false && resp.state === st.value ? " active" : ""),
        onClick: function () { setState(st.value); }, text: st.label
      });
    });
    stateBtns.push(h("button", { class: "sl-btn special" + (resp.state === "unknown" ? " active" : ""), onClick: function () { setState("unknown"); }, text: "Unknown" }));
    stateBtns.push(h("button", { class: "sl-btn na" + ((resp.applicable === false || resp.state === "na") ? " active" : ""), onClick: function () { setState("na", false); }, text: "N/A" }));
    kids.push(h("div", { class: "sl-row caf-state-row" }, stateBtns));
    kids.push(h("div", { class: "field", style: "margin-top:10px;" }, [
      h("label", { text: "Evidence" }),
      (function () { var ta = h("textarea", { placeholder: item.evidencePrompt || "" }); ta.value = resp.evidence || ""; ta.addEventListener("change", function () { E.setResponse(tid, item.id, { evidence: ta.value }); }); return ta; })()
    ]));
    kids.push(h("div", { class: "field" }, [
      h("label", { text: "Notes" }),
      (function () { var ta = h("textarea"); ta.value = resp.notes || ""; ta.addEventListener("change", function () { E.setResponse(tid, item.id, { notes: ta.value }); }); return ta; })()
    ]));
    var rem = wizardGapRemediation(item, renderCRAWizardPage);
    if (rem) kids.push(rem);
    return h("div", { class: "req posture-q" }, kids);
  }

  function renderCRAWizardPage() {
    refs.main.innerHTML = "";
    var d = craDisplay();
    if (!E.getCRALayers().length) {
      refs.main.appendChild(h("h1", { class: "page-title", text: "No layers in scope" }));
      refs.main.appendChild(h("p", { class: "muted", text: "Select at least one " + d.shortName + " layer on the Engagement details page." }));
      return;
    }

    // Mode toggle - the "choose org or products" control. Organisation-wide is
    // answered once; by-product is walked per product (switch product below).
    var modeBar = h("div", { class: "card", style: "margin-bottom:14px;" }, [
      h("div", { class: "card-b", style: "padding:12px 14px;" }, [
        h("div", { class: "muted", style: "font-size:13px; font-weight:600; margin-bottom:8px;", text: "What are you assessing?" }),
        h("div", { class: "btn-row" }, [
          h("button", { class: "btn" + (craWizMode === "org" ? " primary" : ""), onClick: function () { enterCRAWizard("org", 0); }, text: "Organisation-wide" }),
          h("button", { class: "btn" + (craWizMode === "product" ? " primary" : ""), onClick: function () { enterCRAWizard("product", 0); }, text: "By " + d.noun })
        ]),
        h("div", { class: "muted", style: "font-size:12.5px; margin-top:8px;", text: craWizMode === "org" ? d.wizardOrgNote : d.wizardProductNote })
      ])
    ]);
    refs.main.appendChild(modeBar);

    // In product mode, the product picker sits above the wizard so the
    // consultant redoes the walk per product.
    if (craWizMode === "product") {
      var active = E.getActiveTarget();
      refs.main.appendChild(h("p", { class: "page-sub", style: "margin:0 0 6px;", text: "Assessing " + d.noun + ": " + ((active && active.name) || "(none)") }));
      refs.main.appendChild(buildSitesToolbar());
    }

    var track = craWizardTrack(craWizMode);
    if (!track.items.length) {
      refs.main.appendChild(h("p", { class: "muted", text: "No requirements in this track." }));
      return;
    }
    if (craWizIdx > track.items.length - 1) craWizIdx = track.items.length - 1;
    if (craWizIdx < 0) craWizIdx = 0;
    var item = track.items[craWizIdx];
    var total = track.items.length;
    var atStart = craWizIdx === 0, atEnd = craWizIdx >= total - 1;

    var curSecIdx = 0;
    track.sections.forEach(function (s, i) { if (craWizIdx >= s.start) curSecIdx = i; });
    var curSec = track.sections[curSecIdx];

    // Within-track progress (answered / applicable among the track's items).
    var applicable = 0, answered = 0;
    track.items.forEach(function (it) {
      var r = E.findResponse(E.state.activeTargetId, it.id) || {};
      if (r.applicable === false || r.state === "na") return;
      applicable++;
      if (r.state && r.state !== "unknown") answered++;
    });
    var pct = applicable > 0 ? Math.round((answered / applicable) * 100) : 0;

    var wrap = h("div", { class: "wizard" }, []);
    var stepper = h("div", { class: "wizard-stepper" }, []);
    track.sections.forEach(function (s, i) {
      if (i > 0) stepper.appendChild(h("span", { class: "wizard-step-sep", text: "›" }));
      var cls = "wizard-step" + (i === curSecIdx ? " active" : (i < curSecIdx ? " done" : ""));
      stepper.appendChild(h("button", { class: cls, title: "Jump to " + s.label, onClick: (function (start) { return function () { craWizIdx = start; renderCRAWizardPage(); }; })(s.start), text: s.layerId }));
    });
    stepper.appendChild(h("span", { class: "wizard-topmeta" }, [
      document.createTextNode((craWizMode === "org" ? "Organisation item " : d.Noun + " item ")), h("strong", { text: String(craWizIdx + 1) }), document.createTextNode(" of " + total)
    ]));
    wrap.appendChild(h("div", { class: "wizard-topbar" }, [
      stepper,
      h("div", { class: "wizard-progress" }, [ h("div", { class: "wizard-progress-bar", style: "width:" + pct + "%;" }, []) ])
    ]));

    wrap.appendChild(h("div", { class: "card wizard-card" }, [
      h("div", { class: "wizard-answer" }, [ craWizardAnswer(item) ]),
      craWizardContext(item)
    ]));

    var prev = h("button", { class: "btn", onClick: function () { if (!atStart) { craWizIdx -= 1; renderCRAWizardPage(); } }, text: "‹ Previous" });
    if (atStart) prev.setAttribute("disabled", "");
    var nextLabel = atEnd ? (craWizMode === "org" ? "Assess " + d.noun + "s ›" : "Finish ›") : "Next ›";
    var next = h("button", { class: "btn primary", onClick: function () {
      if (!atEnd) { craWizIdx += 1; renderCRAWizardPage(); return; }
      if (craWizMode === "org") { enterCRAWizard("product", 0); return; }
      go("report");
    }, text: nextLabel });

    var footKids = [
      h("button", { class: "btn", onClick: function () { go("cra-layer", item.layerId); }, text: "Switch to list view" }),
      h("span", { class: "wizard-footmeta", text: curSec ? curSec.label : "" }),
      h("div", { class: "spacer" }, []),
      prev,
      h("button", { class: "btn", onClick: function () { go("report"); }, text: "Jump to report" }),
      next
    ];
    wrap.appendChild(h("div", { class: "wizard-footbar" }, footKids));

    // End-of-track guidance so the org-then-products flow is obvious.
    if (atEnd) {
      if (craWizMode === "org") {
        wrap.appendChild(h("p", { class: "muted", style: "margin-top:10px;", text: "That completes the organisation-wide obligations. Choose “Assess " + d.noun + "s” (or the By " + d.noun + " button above) to work through each " + d.noun + "’s own requirements." }));
      } else {
        wrap.appendChild(h("p", { class: "muted", style: "margin-top:10px;", text: "That completes this " + d.noun + ". Use the " + d.noun + " bar above to select or add another " + d.noun + " and work through it, or jump to the report." }));
      }
    }
    refs.main.appendChild(wrap);
  }

  // Display pack for the caf-achieved family. The engine hosts more than the
  // NCSC CAF on this family (e.g. the NIST SP 800-53 control assessment), so
  // the CAF-specific wording is data-driven via instrument.display, with the
  // CAF strings as the fallback so the CAF instruments are unchanged.
  function cafDisp() {
    var d = (E.state.instrument && E.state.instrument.display) || {};
    var gs = d.gettingStarted || {};
    return {
      profileTitle: d.profileTitle || "Regulator profile",
      profileStep1Label: d.profileStep1Label || "Sector / regulator",
      objectiveTitle: d.objectiveTitle || "Objectives",
      outcomesTitle: d.outcomesTitle || "Contributing outcomes",
      gs: {
        cardTitle: gs.cardTitle || "Alignment and gap analysis: how this instrument works",
        intro: gs.intro || "This is an alignment and gap analysis against the NCSC CAF 4.0 indicators of good practice, with an OT focus. It is not a formal CAF assessment and not a regulatory submission.",
        profileHeading: gs.profileHeading || "Regulator profile (sets the expected states)",
        bullets: gs.bullets || [
          "The unit of capture is the contributing outcome (41 of them across 4 objectives and 14 principles).",
          "You set one state per outcome: Achieved, Partially Achieved, or Not Achieved. Unknown reduces confidence; Not applicable drops the outcome.",
          "The regulator profile above sets the expected state for each outcome. The report shows the gap between actual and expected. The default General profile expects Achieved on every outcome.",
          "No single CAF grade is produced. The report is a profile of Achieved / Partially / Not counts by objective and principle, plus the roadmap of outcomes below expected."
        ],
        profilesHeading: gs.profilesHeading || "Available profiles"
      }
    };
  }

  function cafGettingStartedCard() {
    var reg = E.getCAFProfileRegistry();
    var profiles = (reg && reg.profiles) || [];
    var DISP = cafDisp();
    var rows = profiles.map(function (p) {
      var isActive = p.id === E.getActiveCAFProfileId();
      return h("tr", null, [
        h("td", null, [h("strong", { text: p.name }), isActive ? h("span", { class: "pill exceeds", style: "margin-left:8px;", text: "Active" }) : null]),
        h("td", null, [
          p.status === "placeholder"
            ? h("span", { class: "pill near", text: "Placeholder: expected states not populated" })
            : h("span", { class: "pill met", text: "Loaded" })
        ])
      ]);
    });
    // The regulator profile drives every expected-state comparison, so the
    // picker lives HERE in the setup flow (the sidebar keeps a copy for
    // mid-assessment visibility) - a consultant can no longer complete setup
    // without passing the choice.
    var picker = h("div", { class: "field", style: "max-width:420px;" }, []);
    buildCAFProfilePicker(picker);
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: DISP.gs.cardTitle })]),
      h("div", { class: "card-b" }, [
        h("p", { text: DISP.gs.intro }),
        h("h3", { style: "margin:12px 0 6px; font-size:14px; font-weight:600; color:var(--text);", text: DISP.gs.profileHeading }),
        picker,
        h("ul", null, DISP.gs.bullets.map(function (b) { return h("li", null, [b]); })),
        h("h3", { style: "margin:12px 0 6px; font-size:14px; font-weight:600; color:var(--text);", text: DISP.gs.profilesHeading }),
        h("table", { class: "tbl" }, [h("tbody", null, rows)])
      ])
    ]);
  }

  function postureGettingStartedCard() {
    var DL = window.App.ScoringDomainLetter;
    var thr = Math.round((E.state.profile.coverageThreshold || 0.6) * 100);
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "How this instrument scores" })]),
      h("div", { class: "card-b" }, [
        h("p", { text: "Open a domain from the sidebar and work through the questions. You set the band for each scored question on the four-point scale; the fields below it are for evidence and notes." }),
        h("ul", null, [
          h("li", null, ["The headline grade is the average across the graded domains, then held down twice: it can never sit more than two grades above the weakest domain, and the top grade is only awarded when every domain reaches it. A weak domain pulls the headline down sharply, but does not set it on its own."]),
          h("li", null, ["Unknown answers reduce coverage but are not counted as zero."]),
          h("li", null, ["Not applicable answers drop out of both the score and the coverage denominator."]),
          h("li", null, ["Coverage below " + thr + "% causes a grade to be reported as indicative rather than confident."])
        ])
      ])
    ]);
  }

  function metaPair(label, value) {
    return h("div", null, [
      h("div", { class: "lbl muted", style: "font-size:12.5px; font-weight:600;", text: label }),
      h("div", { style: "padding:2px 0 0 0;", text: value || h("span", { class: "soft", text: "(not set)" }).textContent })
    ]);
  }

  // ---- target SL settings ----------------------------------------------

  function targetSettingsCard() {
    var tp = E.state.engagement.targetProfile;

    // Risk context import (spt-risk-context file from the sibling risk tool).
    var fileIn = h("input", { type: "file", accept: "application/json,.json", class: "hidden" });
    fileIn.addEventListener("change", function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (file) loadRiskContextFromFile(file);
      ev.target.value = "";
    });

    // ONE editor for SL-T, not three. The engagement-wide default and its
    // per-FR overrides used to be two separate controls above a third
    // per-zone grid, so the same number could be set in three places and the
    // precedence between them was invisible. They are now the top row of the
    // same matrix: everything below inherits from it, so the resolution order
    // reads down the table and across it.
    var bodyKids = [];

    // The SL-T matrix. ISA/IEC 62443-3-2 gives every zone and conduit its own
    // SL-T, and SL-T is a vector across the seven FRs, so this is a grid: the
    // engagement default on top, then a row per zone. Anything left on "–"
    // inherits, and the bracketed number says what it would inherit, so the
    // resolution order in Scoring.effectiveTargetSL is legible on the page.
    var targets = E.state.engagement.targets || [];
    var labelSing = E.state.instrument.targetDimensionLabel || "Site";
    var frs = E.state.taxonomy.frs;
    var engDefault = (typeof tp.defaultTargetSL === "number") ? tp.defaultTargetSL : 2;

    function slSelect(value, effective, allowInherit, onPick) {
      var sel = h("select", { class: "slt-cell" }, []);
      if (allowInherit) sel.appendChild(h("option", { value: "", text: "- (" + effective + ")" }));
      [1, 2, 3, 4].forEach(function (v) {
        var o = h("option", { value: String(v), text: "SL " + v });
        if (v === value) o.setAttribute("selected", "");
        sel.appendChild(o);
      });
      sel.value = (typeof value === "number") ? String(value) : "";
      sel.addEventListener("change", function () {
        onPick(sel.value === "" ? null : parseInt(sel.value, 10));
      });
      return sel;
    }

    var head = h("thead", null, [h("tr", null,
      [h("th", null, [labelSing]), h("th", { class: "center" }, ["All FRs"])]
        .concat(frs.map(function (fr) {
          return h("th", { class: "center", title: fr.id + " " + fr.name }, [fr.id]);
        })))]);

    // Row 1: the engagement-wide setting every zone falls back to. Its "All
    // FRs" cell is the default target SL; its FR cells are the per-FR
    // overrides. No inherit option on the default - it is the root.
    var baseCells = [
      h("td", null, [h("strong", { text: "All " + pluralLabel(labelSing).toLowerCase() }),
                     h("div", { class: "muted small", text: "engagement default" })]),
      h("td", { class: "center" }, [ slSelect(engDefault, null, false, function (v) {
        E.setDefaultTargetSL(v); renderEngagementSummaryPage();
      }) ])
    ];
    frs.forEach(function (fr) {
      var own = (tp.perFR && typeof tp.perFR[fr.id] === "number") ? tp.perFR[fr.id] : null;
      baseCells.push(h("td", { class: "center" }, [ slSelect(own, engDefault, true, function (v) {
        E.setFRTarget(fr.id, v); renderEngagementSummaryPage();
      }) ]));
    });
    var rows = [ h("tr", { class: "slt-base" }, baseCells) ];

    targets.forEach(function (t) {
      var z = E.getZoneTarget(t.id) || { default: null, perFR: {} };
      var cells = [
        h("td", null, [h("strong", { text: t.name }),
                       t.zoneId ? h("div", { class: "muted small", text: "zone " + t.zoneId }) : null]),
        h("td", { class: "center" }, [ slSelect(z.default, engDefault, true, function (v) {
          E.setZoneTarget(t.id, v); renderEngagementSummaryPage();
        }) ])
      ];
      frs.forEach(function (fr) {
        var own = (z.perFR && typeof z.perFR[fr.id] === "number") ? z.perFR[fr.id] : null;
        // What this cell would inherit, following the same order as the scorer.
        var eff = (typeof z.default === "number") ? z.default
          : (tp.perFR && typeof tp.perFR[fr.id] === "number" ? tp.perFR[fr.id] : engDefault);
        cells.push(h("td", { class: "center" }, [ slSelect(own, eff, true, function (v) {
          E.setZoneFRTarget(t.id, fr.id, v); renderEngagementSummaryPage();
        }) ]));
      });
      rows.push(h("tr", null, cells));
    });

    bodyKids.push(h("p", { class: "hint", style: "margin:0 0 10px;", text:
      "ISA/IEC 62443-3-2 assigns each zone and conduit its own SL-T across the seven Foundational Requirements. Set the engagement default on the first row; each " +
      labelSing.toLowerCase() + " below overrides only what it needs. “-” means inherit, and the number in brackets is what would apply." }));
    bodyKids.push(h("div", { style: "overflow-x:auto;" }, [h("table", { class: "tbl slt-matrix" }, [head, h("tbody", null, rows)])]));

    // Provenance of an imported risk context, with the zone SL-T rationale
    // read-only and a way to drop the context (sites stay - they hold the
    // consultant's responses now).
    var rc = E.getRiskContext();
    if (rc) {
      var sucName = (rc.suc && rc.suc.name) || "(unnamed system under consideration)";
      var zoneRows = (rc.zones || []).map(function (z) {
        return h("tr", null, [
          h("td", null, [h("strong", { text: z.name }), z.safetyRelated ? h("span", { class: "pill gap", style: "margin-left:6px;", text: "safety-related" }) : null]),
          h("td", { class: "center", text: typeof z.slTarget === "number" ? "SL " + z.slTarget : "-" }),
          h("td", { class: "muted", text: z.justification || "" })
        ]);
      });
      bodyKids.push(h("div", { class: "spacer-12" }));
      bodyKids.push(h("h3", { style: "margin:6px 0 6px; font-size:13px; color:var(--text-muted);", text: "Imported risk context" }));
      bodyKids.push(h("p", { class: "muted", style: "margin-top:0;", text: "Risk context imported from " + sucName + " (" + (rc.generatedOn || "unknown date") + ", " + (rc.generatedBy || "unknown source") + ") on " + (rc.importedOn || "") + "." }));
      bodyKids.push(h("table", { class: "tbl" }, [
        h("thead", null, [h("tr", null, [h("th", { text: "Zone" }), h("th", { class: "center", text: "Imported SL-T" }), h("th", { text: "Justification" })])]),
        h("tbody", null, zoneRows)
      ]));
      bodyKids.push(h("div", { class: "sl-row", style: "margin-top:12px;" }, [
        h("button", {
          class: "btn ghost sm",
          onClick: function () {
            if (confirm("Remove the imported risk context? Sites and their responses stay; the imported per-zone SL-Ts are cleared.")) E.clearRiskContext();
          },
          text: "Remove imported context"
        })
      ]));
    }

    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "Target SL" }),
        h("button", { class: "btn sm", onClick: function () { fileIn.click(); }, text: "Import risk context…" })
      ]),
      h("div", { class: "card-b" }, bodyKids),
      fileIn
    ]);
  }

  function slButton(value, isActive, onClick) {
    return h("button", { class: "sl-btn" + (isActive ? " active" : ""), onClick: onClick }, ["SL " + value]);
  }

  // ---- risk context import (capability-sl) ------------------------------
  // Reads an spt-risk-context JSON exported by the sibling risk tool. The
  // schema is validated against the bundled interchange contract copy
  // (data/shared/risk-context-interchange.json); a mismatch is rejected
  // loudly so a stale export never silently mis-scopes an assessment.

  function loadRiskContextFromFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var contract = window.App.Data && window.App.Data.shared && window.App.Data.shared.riskContextInterchange;
        // Accept any schema the bundled contract lists (currently 1.0 and 1.1);
        // both carry a scalar slTarget, so a 1.0 export still scopes correctly.
        var accepted = (contract && contract.acceptedSchemas) || [(contract && contract.schema) || "spt-risk-context/1.0"];
        var received = data && data.schema ? String(data.schema) : "(none)";
        if (!data || accepted.indexOf(data.schema) < 0) {
          toast("Risk context rejected: expected schema " + accepted.map(function (s) { return "\"" + s + "\""; }).join(" or ") + " but the file declares \"" + received + "\".", "err");
          return;
        }
        if (!Array.isArray(data.zones) || data.zones.length === 0) {
          toast("Risk context rejected: the file contains no zones.", "err");
          return;
        }
        openRiskContextModal(data, file.name);
      } catch (e) {
        toast("Could not parse risk context file: " + e.message, "err");
      }
    };
    reader.onerror = function () { toast("Could not read file.", "err"); };
    reader.readAsText(file);
  }

  function openRiskContextModal(ctx, fileName) {
    // Read here, not borrowed from the file reader: `contract` used to be a
    // local of loadRiskContextFromFile's callback, so every import reached this
    // modal, threw "contract is not defined" and was reported as a file that
    // could not be parsed.
    var contract = window.App.Data && window.App.Data.shared && window.App.Data.shared.riskContextInterchange;
    var frKeys = (contract && contract.importContract && contract.importContract.frKeys) || ["IAC", "UC", "SI", "DC", "RDF", "TRE", "RA"];
    var label = E.state.instrument.targetDimensionLabel || "Site";
    var existingIds = {};
    E.state.engagement.targets.forEach(function (t) { existingIds[t.id] = true; });
    // Counts the shared layer as well - see the matching guard in engine.js.
    var hasResponses = E.state.engagement.responses.some(function (r) {
      return existingIds[r.targetId] || r.targetId === E.SHARED_TARGET_ID;
    });
    var sucName = (ctx.suc && ctx.suc.name) || "(unnamed system under consideration)";

    var checks = [];
    var zoneRows = (ctx.zones || []).map(function (z) {
      var cb = h("input", { type: "checkbox" });
      cb.checked = true;
      checks.push({ zoneId: z.id, cb: cb });
      // v1.1 exports carry a per-foundational-requirement SL-T vector; show it
      // as provenance under the scalar that actually drives the target.
      var frVec = z.slTargetByFR ? frKeys.map(function (k) { var v = z.slTargetByFR[k]; return typeof v === "number" ? v : "-"; }).join("/") : null;
      return h("tr", null, [
        h("td", null, [cb]),
        h("td", null, [h("strong", { text: z.name }), z.safetyRelated ? h("span", { class: "pill gap", style: "margin-left:6px;", text: "safety-related" }) : null]),
        h("td", { class: "center" }, [
          h("strong", { text: typeof z.slTarget === "number" ? "SL " + z.slTarget : "-" }),
          frVec ? h("div", { class: "muted", style: "font-size:11px;", text: frKeys.join("/") + " = " + frVec }) : null
        ])
      ]);
    });

    var scopeNote = hasResponses
      ? "Existing " + label.toLowerCase() + "s already hold responses, so the selected zones are added alongside them."
      : "No responses are captured yet, so the selected zones replace the current " + label.toLowerCase() + " list.";

    var modal = h("div", { class: "modal-backdrop" }, [
      h("div", { class: "modal" }, [
        h("div", { class: "modal-h" }, [
          h("h2", { text: "Import risk context" }),
          h("button", { class: "btn ghost", style: "color:var(--text);", onClick: closeModal, text: "Close" })
        ]),
        h("div", { class: "modal-b" }, [
          h("p", { style: "margin-top:0;" }, [h("strong", { text: sucName }), " - " + plural((ctx.zones || []).length, "zone") + ", exported " + (ctx.generatedOn || "unknown date") + " by " + (ctx.generatedBy || "unknown source") + "."]),
          h("table", { class: "tbl" }, [
            h("thead", null, [h("tr", null, [h("th", { text: "" }), h("th", { text: "Zone" }), h("th", { class: "center", text: "SL-T" })])]),
            h("tbody", null, zoneRows)
          ]),
          h("p", { class: "muted", text: "One assessment " + label.toLowerCase() + " is created per selected zone, with its Target SL pre-set from the zone's SL-T (you can still change it). " + scopeNote + " Untick every zone to store the context for provenance only, without creating " + label.toLowerCase() + "s." })
        ]),
        h("div", { class: "modal-f" }, [
          h("button", { class: "btn", onClick: closeModal, text: "Cancel" }),
          h("button", {
            class: "btn primary",
            onClick: function () {
              var zoneIds = checks.filter(function (c) { return c.cb.checked; }).map(function (c) { return c.zoneId; });
              E.setRiskContext(ctx, { scope: true, zoneIds: zoneIds, fileName: fileName });
              closeModal();
              toast(zoneIds.length > 0
                ? "Risk context imported: " + zoneIds.length + " " + label.toLowerCase() + "(s) scoped from zones."
                : "Risk context stored (no " + label.toLowerCase() + "s created).");
            },
            text: "Import"
          })
        ])
      ])
    ]);
    document.body.appendChild(modal);
    refs.modal = modal;
  }

  // ---- targets (sites) management --------------------------------------

  function renderTargetsPage() {
    refs.main.innerHTML = "";
    var label = E.state.instrument.targetDimensionLabel || "Site";
    refs.main.appendChild(h("h1", { class: "page-title", text: pluralLabel(label) }));
    refs.main.appendChild(h("p", { class: "page-sub", text: "Each " + label.toLowerCase() + " holds its own responses. Use the bar above each FR page to switch between " + label.toLowerCase() + "s." }));
    refs.main.appendChild(targetsCard());
  }

  // The add / rename / remove table for targets. Shared by the dedicated
  // targets page and the Engagement details page - the latter so a
  // single-target engagement, which no longer gets a permanent sidebar row,
  // can still name or add one.
  function targetsCard() {
    var label = E.state.instrument.targetDimensionLabel || "Site";
    var rows = E.state.engagement.targets.map(function (t) {
      var input = h("input", { type: "text", value: t.name, onChange: function (e) { E.renameTarget(t.id, e.target.value); } });
      var responseCount = E.state.engagement.responses.filter(function (r) { return r.targetId === t.id; }).length;
      return h("tr", null, [
        h("td", null, [input]),
        h("td", { class: "center", text: String(responseCount) }),
        h("td", { class: "right" }, [
          h("button", {
            class: "btn danger",
            onClick: function () {
              if (E.state.engagement.targets.length <= 1) { toast("Cannot remove the last " + label.toLowerCase() + ".", "warn"); return; }
              if (!confirm("Remove " + t.name + " and all its responses?")) return;
              E.removeTarget(t.id);
            },
            // Named, not a bare "Remove": this card now shares the Engagement
            // details page with the evidence register, whose rows have their
            // own Remove. Two identical buttons deleting very different things
            // is exactly the ambiguity worth spending three words on.
            text: "Remove " + label.toLowerCase()
          })
        ])
      ]);
    });
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: pluralLabel(label) }),
        h("button", { class: "btn primary", onClick: function () { E.addTarget(); toast(label + " added."); }, text: "Add " + label.toLowerCase() })
      ]),
      h("div", { class: "card-b" }, [
        h("table", { class: "tbl" }, [
          h("thead", null, [h("tr", null, [
            h("th", null, [label]), h("th", { class: "center", text: "Responses" }), h("th", { class: "right", text: "" })
          ])]),
          h("tbody", null, rows)
        ]),
        h("p", { class: "muted", style: "margin-bottom:0;", text: "Each " + label.toLowerCase() + " holds its own responses. Switch between them from the bar at the top of any capture page." })
      ])
    ]);
  }

  // ---- FR capture page --------------------------------------------------

  function renderFRPage(frId) {
    refs.main.innerHTML = "";
    var fr = E.state.taxonomy.frs.filter(function (f) { return f.id === frId; })[0];
    var requirements = E.getRequirementsByFR(frId);
    var label = E.state.instrument.targetDimensionLabel || "Site";

    var onShared = E.isSharedScope(E.state.activeTargetId);
    refs.main.appendChild(h("h1", { class: "page-title", text: fr.id + " - " + fr.name }));
    refs.main.appendChild(h("p", { class: "page-sub", text: plural(requirements.length, "requirement") + ". " +
      (onShared ? E.sharedScopeLabelLong() : label + ": " + (E.getActiveTarget() ? E.getActiveTarget().name : "-")) }));

    refs.main.appendChild(buildSitesToolbar());

    // The shared layer is a capture aid, not a result: say what it does
    // before the consultant starts answering on it.
    if (onShared) {
      refs.main.appendChild(h("div", { class: "card card-note" }, [
        h("div", { class: "card-b" }, [
          h("p", { style: "margin:0;", text:
            "Answers recorded here are written once and used by more than one " + targetNoun() +
            " - a single directory service, one log collector, one patching process. By default every " +
            targetNoun() + " takes them; where a countermeasure does not reach them all, set which " +
            targetNounPlural() + " it applies to. Answer an item in a " + targetNoun() +
            " to override it there." }),
          h("p", { class: "muted", style: "margin:6px 0 0;", text:
            "Items are listed against the highest target Security Level any " + targetNoun() +
            " asks for, so nothing a " + targetNoun() + " needs is hidden here. This page is not scored in its own right." })
        ])
      ]));
    }

    // A zone created after answering had begun takes every shared answer that
    // is not scoped away from it. That is the right default, but it means the
    // zone can read as largely assessed on the strength of answers written
    // before it existed, so it is said out loud once and cleared by hand.
    if (!onShared) {
      var activeT = E.getActiveTarget();
      if (activeT && activeT.inheritedAtCreation > 0) {
        refs.main.appendChild(h("div", { class: "card card-note" }, [
          h("div", { class: "card-b" }, [
            h("p", { style: "margin:0;", text:
              "This " + targetNoun() + " was added after " + plural(activeT.inheritedAtCreation, "requirement") +
              " had already been answered as shared answers, and it takes them automatically. " +
              "Check they do reach it, and answer here anything they do not." }),
            h("div", { style: "margin-top:8px;" }, [
              h("button", {
                class: "btn btn-small",
                onClick: function () { E.acknowledgeInherited(activeT.id); render(); },
                text: "I have checked these"
              })
            ])
          ])
        ]));
      }
    }

    if (requirements.length === 0) {
      refs.main.appendChild(h("div", { class: "card" }, [h("div", { class: "card-b" }, [
        h("p", { class: "muted", text: "No requirements defined for this FR." })
      ])]));
      return;
    }

    var scored = E.scoreActiveTarget();
    var frRes = scored.perFR.filter(function (f) { return f.frId === frId; })[0];
    var summary = h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [
        h("h2", { text: "FR result" }),
        h("div", { class: "row-flex" }, [
          !frRes.inScope ? window.App.Report.bandPill("na", "Out of scope (SL-T 0)") :
            (frRes.exceedsTarget
              ? window.App.Report.bandPill("above", "Exceeds target")
              : (frRes.frTargetMet ? window.App.Report.bandPill("met", "Target met")
                : frRes.frTargetStatus === "incomplete" ? window.App.Report.bandPill("near", "Not yet")
                : frRes.frTargetStatus === "unassessed" ? window.App.Report.bandPill("na", "Not assessed")
                : window.App.Report.bandPill("gap", "Target not met"))),
          frRes.propUpByCompensating
            ? h("span", { class: "pill exceeds", title: "Without the compensating measures this FR would achieve " + S.formatSL(frRes.achievedSLStrict), text: "Held by compensating" })
            : null,
          frRes.unassessedCount > 0 ? h("span", { class: "pill flag", text: plural(frRes.unassessedCount, "item") + " not assessed" }) : null
        ])
      ]),
      h("div", { class: "card-b" }, [
        h("div", { class: "kpi-row" }, [
          h("div", { class: "kpi" }, [
            h("div", { class: "lbl", text: "Target SL-T" }),
            h("div", { class: "val", text: frRes.inScope ? S.formatSL(frRes.targetSL) : "SL 0" })
          ]),
          h("div", { class: "kpi" }, [
            h("div", { class: "lbl", text: "Achieved SL-A" }),
            h("div", { class: "val " + (!frRes.inScope ? "" : (frRes.frTargetMet ? "met" : (frRes.frTargetStatus === "incomplete" ? "near" : "gap"))), text: frRes.inScope ? S.formatSL(frRes.conformantAchievedSL) : "-" })
          ]),
          h("div", { class: "kpi" }, [
            h("div", { class: "lbl", text: "Without compensating" }),
            h("div", { class: "val " + (frRes.propUpByCompensating ? "near" : ""), text: frRes.inScope ? S.formatSL(frRes.achievedSLStrict) : "-" })
          ]),
          h("div", { class: "kpi" }, [
            h("div", { class: "lbl", text: "Items satisfied" }),
            h("div", { class: "val", text: frRes.satisfiedCount + " / " + frRes.countedCount })
          ])
        ]),
        // The blocking items ARE the remediation list, so name them here where
        // the consultant is working rather than only in the report.
        (frRes.inScope && frRes.blockingItems.length)
          ? h("div", { style: "margin-top:12px;" }, [
              h("div", { class: "sl-items-label", text: "Holding this FR at " + S.formatSL(frRes.conformantAchievedSL) }),
              h("div", { class: "hint", style: "margin-top:4px;", text:
                frRes.blockingItems.map(function (i) { return i.label; }).join(", ") })
            ])
          : null
      ])
    ]);
    // An SL-A for the shared layer would be a number for something that is
    // not a zone, so the result card belongs only on a real target.
    if (!onShared) refs.main.appendChild(summary);

    var list = h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: onShared ? "Requirements (shared answers)" : "Requirements" })]),
      h("div", { class: "card-b" }, requirements.map(function (req) { return requirementRow(req, frRes); }))
    ]);
    refs.main.appendChild(list);
    var fn = sectionFootNav(E.state.taxonomy.frs.map(function (f) { return { id: f.id, label: f.id }; }), frId, "fr");
    if (fn) refs.main.appendChild(fn);
  }

  // Whether capture pages hide already-answered items (session-wide toggle).
  var hideAnswered = false;
  var HIDEABLE_VIEWS = ["fr", "caf-principle", "ml-element", "nis2-category", "csms-category", "cra-layer"];

  function buildSitesToolbar() {
    var bar = h("div", { class: "sites-bar" }, []);
    var label = E.state.instrument.targetDimensionLabel || "Site";
    bar.appendChild(h("span", { class: "muted", text: label + ":" }));
    function tab(id, name, cls) {
      bar.appendChild(h("span", {
        class: "site-tab" + (cls ? " " + cls : "") + (id === E.state.activeTargetId ? " active" : ""),
        tabindex: "0", role: "button",
        onClick: function () { E.setActiveTarget(id); },
        onKeydown: function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); E.setActiveTarget(id); } }
      }, [name]));
    }
    // The shared layer sits first: answers recorded there are inherited by
    // every zone, so it is where a shared countermeasure is stated once.
    if (E.supportsSharedScope()) {
      tab(E.SHARED_TARGET_ID, E.sharedScopeLabel(), "site-tab-shared");
    }
    E.state.engagement.targets.forEach(function (t) { tab(t.id, t.name); });
    bar.appendChild(h("button", { class: "btn", onClick: function () { E.addTarget(); toast(label + " added."); }, text: "+ " + label }));
    // Capture list pages get a "hide answered" toggle so the consultant can
    // see only what is left to do on a long section.
    if (HIDEABLE_VIEWS.indexOf(view) !== -1) {
      bar.appendChild(h("button", {
        class: "btn" + (hideAnswered ? " primary" : ""),
        style: "margin-left:auto;",
        title: "Show only the items that do not have an answer yet",
        onClick: function () { hideAnswered = !hideAnswered; render(); },
        text: hideAnswered ? "Showing unanswered only" : "Hide answered"
      }));
    }
    return bar;
  }

  // The six item states. "Not assessed" is the absence of a state, reached by
  // Clear, and it BLOCKS a level rather than being ignored - so the buttons
  // never present it as an answer.
  var SL_ITEM_STATES = [
    { value: "met",              label: "Met",           cls: "caf-state-achieved" },
    { value: "met-compensating", label: "Met (comp.)",   cls: "caf-state-achieved sl-comp",
      title: "Satisfied by a compensating countermeasure. Counts toward the level, but is reported separately as a fragility signal." },
    { value: "partial",          label: "Partial",       cls: "caf-state-partially",
      title: "Partially satisfied. Never counts toward a Security Level, but carries into the gap report." },
    { value: "not-met",          label: "Not met",       cls: "caf-state-not" },
    { value: "na",               label: "N/A",           cls: "na",
      title: "Not applicable. Needs a justification, otherwise it blocks the level rather than being excluded." }
  ];

  var SL_ITEM_LABEL = (function () {
    var m = {};
    SL_ITEM_STATES.forEach(function (s) { m[s.value] = s.label; });
    return m;
  })();

  // On the shared page, how many zones are currently taking this answer.
  // Written as a plain count so the consultant can see the reach of what they
  // are about to record, and notice when every zone has overridden it.
  function inheritCountText(reqId, componentId) {
    var zones = (E.state.engagement.targets || []).length;
    var cov = E.getItemCoverage(reqId, componentId);
    var scoped = cov ? cov.length : zones;
    var n = E.zonesInheriting(reqId, componentId);
    if (cov && n === scoped) return "covers " + scoped + " of " + zones + " " + targetNounPlural();
    if (cov) return "covers " + scoped + ", inherited by " + n;
    if (n === zones) return "inherited by all " + zones + " " + targetNounPlural();
    if (n === 0) return "every " + targetNoun() + " answers this for itself";
    return "inherited by " + n + " of " + zones + " " + targetNounPlural();
  }

  // Which zones a shared answer reaches. Open on demand rather than
  // always visible: the default - every zone - is right most of the time, and
  // a permanent checkbox list beside every item would bury the answer itself.
  var slCoverageOpen = {};
  function slCoverageControl(req, scoredItem, onChange) {
    var key = req.id + "/" + scoredItem.componentId;
    var targets = E.state.engagement.targets || [];
    var cov = E.getItemCoverage(req.id, scoredItem.componentId);
    var selected = cov || targets.map(function (t) { return t.id; });
    var isAll = !cov;

    var toggle = h("button", {
      type: "button",
      class: "sl-coverage-toggle" + (slCoverageOpen[key] ? " open" : "") + (isAll ? "" : " scoped"),
      title: "Choose which " + targetNounPlural() + " this answer applies to",
      onClick: function () { slCoverageOpen[key] = !slCoverageOpen[key]; onChange(); },
      text: isAll ? "Applies to all " + targetNounPlural()
                  : "Applies to " + selected.length + " of " + targets.length + " " + targetNounPlural()
    });
    if (!slCoverageOpen[key]) return toggle;

    var boxes = targets.map(function (t) {
      var cb = h("input", { type: "checkbox" });
      cb.checked = selected.indexOf(t.id) !== -1;
      cb.addEventListener("change", function () {
        var next = targets.filter(function (x) {
          var el = boxes.filter(function (b) { return b.__targetId === x.id; })[0];
          return el && el.querySelector("input").checked;
        }).map(function (x) { return x.id; });
        E.setItemCoverage(req.id, scoredItem.componentId, next);
        onChange();
      });
      var lab = h("label", { class: "sl-coverage-zone" }, [cb, h("span", { text: t.name })]);
      lab.__targetId = t.id;
      return lab;
    });

    return h("div", { class: "sl-coverage" }, [
      toggle,
      h("div", { class: "sl-coverage-body" }, [
        h("div", { class: "hint", text:
          "A countermeasure implemented once does not always reach every " + targetNoun() +
          ". Clear the ones it does not reach: they will show this item as unanswered rather than inheriting it." }),
        h("div", { class: "sl-coverage-list" }, boxes),
        h("button", {
          type: "button", class: "btn btn-small",
          onClick: function () {
            E.setItemCoverage(req.id, scoredItem.componentId, null);
            onChange();
          },
          text: "Select all " + targetNounPlural()
        })
      ])
    ]);
  }

  // The same choice at the level a consultant actually thinks in: "the
  // directory service reaches these zones", not "SR 1.1 RE 1 reaches these
  // zones". It sits on the requirement card itself, because the per-item
  // control lives inside a collapsed panel and so could not be found. Setting
  // it writes the reach to every answered item of the requirement; the item
  // control remains for the case where one enhancement reaches further than
  // the rest.
  var slReqCoverageOpen = {};
  function slReqCoverageControl(req, onChange) {
    var targets = E.state.engagement.targets || [];
    if (targets.length < 2) return null;
    var cov = E.getRequirementCoverage(req.id);
    if (!cov) return null;               // nothing answered here yet
    var isAll = !cov.mixed && !cov.appliesTo;
    var selected = cov.appliesTo || targets.map(function (t) { return t.id; });
    var open = slReqCoverageOpen[req.id] === true;

    var toggle = h("button", {
      type: "button",
      class: "sl-coverage-toggle" + (open ? " open" : "") + (isAll ? "" : " scoped"),
      title: "Choose which " + targetNounPlural() + " this answer reaches",
      onClick: function () { slReqCoverageOpen[req.id] = !open; onChange(); },
      text: cov.mixed
        ? "Applies to: set per item"
        : isAll ? "Applies to all " + targetNounPlural()
                : "Applies to " + selected.length + " of " + targets.length + " " + targetNounPlural()
    });
    // The toggle belongs in the answer row; the checkbox list is full-width and
    // belongs beneath it, so they are returned separately.
    if (!open) return { toggle: toggle, panel: null };

    var boxes = targets.map(function (t) {
      var cb = h("input", { type: "checkbox" });
      cb.checked = selected.indexOf(t.id) !== -1;
      var lab = h("label", { class: "sl-coverage-zone" }, [cb, h("span", { text: t.name })]);
      lab.__targetId = t.id;
      cb.addEventListener("change", function () {
        var next = boxes.filter(function (b) { return b.querySelector("input").checked; })
                        .map(function (b) { return b.__targetId; });
        E.setRequirementCoverage(req.id, next);
        onChange();
      });
      return lab;
    });

    return { toggle: toggle, panel: h("div", { class: "sl-coverage sl-req-coverage" }, [
      h("div", { class: "sl-coverage-body" }, [
        h("div", { class: "hint", text: cov.mixed
          ? "The items of this requirement currently reach different " + targetNounPlural() +
            ". Choosing here sets the same reach for all of them; to keep them different, set each one under \"What each level requires\" below."
          : "A countermeasure implemented once does not always reach every " + targetNoun() +
            ". Clear the ones it does not reach: they will show this requirement as unanswered rather than inheriting it." }),
        h("div", { class: "sl-coverage-list" }, boxes),
        h("button", {
          type: "button", class: "btn btn-small",
          onClick: function () { E.setRequirementCoverage(req.id, null); onChange(); },
          text: "Select all " + targetNounPlural()
        })
      ])
    ]) };
  }

  // "This is the same here as in the DMZ." Offered on a ZONE page, because that
  // is where the consultant notices it - halfway through answering the second
  // zone, recognising the answer they just wrote. Ticking another zone moves
  // this zone's answer onto the shared layer scoped to both, so it is
  // written once and edited once; unticking hands a zone its own copy back,
  // losing nothing.
  var slLinkOpen = {};
  // Zones ticked but not yet linked, and which zone's answer the link would
  // take. Held until the consultant commits, so nothing is discarded before
  // they have seen it.
  var slLinkStage = {};

  function summaryFor(list, id) {
    return list.filter(function (c) { return c.id === id; })[0] || { hasContent: false };
  }

  // What one zone's card shows for a requirement: its own answers with
  // whatever it takes from the shared layer filled in, item by item, exactly
  // as it is scored. This is what the consultant compares before deciding
  // that two zones really do have the same answer, and it is what a link
  // lifts from the chosen zone, so the preview has to be the same thing. It
  // used to show only the zone's own answers, so a zone that overrode one
  // enhancement read "Evidence: nothing recorded" while the evidence it was
  // inheriting went into the link anyway, and a zone inheriting everything
  // read "not answered here" and lost the default to the other zone.
  function zoneAnswerSummary(targetId, req) {
    var t = (E.state.engagement.targets || []).filter(function (x) { return x.id === targetId; })[0];
    var ownRaw = E.findResponse(targetId, req.id);
    var shared = E.supportsSharedScope && E.supportsSharedScope() ? E.findResponse(E.SHARED_TARGET_ID, req.id) : null;
    var own = shared ? S.resolveResponse(ownRaw || null, shared, targetId) : ownRaw;
    var items = S.requirementItems(req);
    var scored = S.scoreRequirement(req, own || null,
      S.effectiveTargetSL(E.state.engagement.targetProfile, req.frId, targetId), E.state.profile);
    var answered = !!(own && own.components && Object.keys(own.components).some(function (k) {
      return own.components[k] && own.components[k].state;
    }));
    var evidence = (own && own.evidence) || "";
    var notes    = (own && own.notes) || "";
    var action   = (own && own.action) || "";
    return {
      id: targetId,
      name: t ? t.name : targetId,
      levelLabel: answered ? S.formatSL(scored.achievedShown) : "not answered here",
      evidence: evidence, notes: notes, action: action,
      hasContent: answered || !!evidence || !!notes || !!action,
      itemCount: items.length
    };
  }

  function slLinkControl(req, scoredReq, onChange) {
    var tid = E.state.activeTargetId;
    var targets = E.state.engagement.targets || [];
    if (targets.length < 2 || E.isSharedScope(tid)) return { toggle: null, panel: null };

    var linked = E.linkedTargets(req.id);
    var isLinked = linked.length > 1 && linked.indexOf(tid) !== -1;
    // Nothing to share and nothing shared: no control. Offering "link this" on
    // a blank requirement asks the consultant to link an absence.
    if (!isLinked && !scoredReq.touched) return { toggle: null, panel: null };

    var others = targets.filter(function (t) { return t.id !== tid; });
    var open = slLinkOpen[req.id] === true;
    var toggle = h("button", {
      type: "button",
      class: "sl-link-toggle" + (open ? " open" : "") + (isLinked ? " linked" : ""),
      title: isLinked
        ? "Answered once for " + linked.length + " " + targetNounPlural() + ". Editing it here edits it in all of them."
        : "Use this same answer in another " + targetNoun(),
      text: isLinked
        ? "Shared with " + (linked.length - 1) + " other " + (linked.length - 1 === 1 ? targetNoun() : targetNounPlural())
        : "Same as another " + targetNoun() + "?"
    });
    toggle.addEventListener("click", function () { slLinkOpen[req.id] = !open; onChange(); });
    if (!open) return { toggle: toggle, panel: null };

    function nameOf(id) {
      var t = targets.filter(function (x) { return x.id === id; })[0];
      return t ? t.name : id;
    }
    // Which of the others would lose an answer of their own by being linked.
    function hasOwnAnswer(id) {
      var r = E.findResponse(id, req.id);
      return !!(r && r.components && Object.keys(r.components).some(function (k) {
        return r.components[k] && r.components[k].state;
      }));
    }

    // Ticking a zone STAGES it rather than linking straight away. Linking
    // replaces whatever that zone had, and a consultant should see the text
    // they are about to discard - and be able to keep it instead - before it
    // goes. Untickng an existing member is not staged: unlinking is lossless,
    // so it can happen on the spot.
    var stage = slLinkStage[req.id] || { targets: [], source: tid };
    var rows = others.map(function (t) {
      // Only a link THIS zone belongs to shows as ticked. Two other zones
      // sharing an answer between themselves is not this zone's link, and
      // showing it ticked here would say this zone was in it.
      var on = isLinked && linked.indexOf(t.id) !== -1;
      var staged = stage.targets.indexOf(t.id) !== -1;
      var cb = h("input", { type: "checkbox" });
      cb.checked = on || staged;
      cb.addEventListener("change", function () {
        if (on && !cb.checked) { E.unlinkRequirement(req.id, t.id); delete slLinkStage[req.id]; }
        else if (cb.checked) {
          stage.targets = stage.targets.concat([t.id]);
          slLinkStage[req.id] = stage;
        } else {
          stage.targets = stage.targets.filter(function (x) { return x !== t.id; });
          if (!stage.targets.length) delete slLinkStage[req.id]; else slLinkStage[req.id] = stage;
        }
        onChange();
      });
      return h("label", { class: "sl-coverage-zone" }, [
        cb,
        h("span", { text: t.name }),
        (!on && !staged && hasOwnAnswer(t.id))
          ? h("span", { class: "muted small", text: "(has its own answer)" })
          : null
      ]);
    });

    var body = [
      h("div", { class: "hint", text: isLinked
        ? "This answer, its evidence, notes and remediation plan are held once and used by " +
          linked.map(nameOf).join(", ") + ". Editing any of it here changes it for all of them."
        : "Tick the " + targetNounPlural() + " where this is the same. They will use one answer, "
          + "with its evidence, notes and remediation plan, instead of being asked again. "
          + "Any not ticked keep what they have." }),
      h("div", { class: "sl-coverage-list" }, rows)
    ];

    // The staged link: show what each zone holds today and let the consultant
    // choose which of them the linked set should use. This is the check they
    // asked for - read the other zone's evidence, see whether it really does
    // say the same thing, and only then commit.
    if (stage.targets.length) {
      var inLink = (isLinked ? linked : [tid]).concat(stage.targets)
        .filter(function (id, i, a) { return a.indexOf(id) === i; });
      var candidates = inLink.map(function (id) { return zoneAnswerSummary(id, req); });
      // Default to the only answer with anything in it, so linking an empty
      // zone to a filled one takes the filled text rather than wiping it.
      var withContent = candidates.filter(function (c) { return c.hasContent; });
      if (stage.source === undefined ||
          !candidates.some(function (c) { return c.id === stage.source; })) stage.source = tid;
      if (withContent.length === 1 && !summaryFor(candidates, stage.source).hasContent) {
        stage.source = withContent[0].id;
      }

      body.push(h("div", { class: "sl-link-choose" }, [
        h("div", { class: "sl-link-choose-h", text: candidates.length > 1
          ? "Which answer should they share?"
          : "The answer they will share" }),
        h("div", { class: "sl-link-cards" }, candidates.map(function (c) {
          var rb = h("input", { type: "radio", name: "linksrc-" + req.id });
          rb.checked = c.id === stage.source;
          rb.addEventListener("change", function () {
            stage.source = c.id; slLinkStage[req.id] = stage; onChange();
          });
          return h("label", { class: "sl-link-card" + (c.id === stage.source ? " is-chosen" : "") }, [
            h("div", { class: "sl-link-card-h" }, [
              rb,
              h("span", { class: "sl-link-card-name", text: c.name + (c.id === tid ? " (this one)" : "") }),
              h("span", { class: "pill neutral", text: c.levelLabel })
            ]),
            h("div", { class: "sl-link-card-b" }, [
              h("div", { class: "sl-link-field" }, [
                h("span", { class: "sl-link-field-l", text: "Evidence" }),
                h("span", { class: c.evidence ? "" : "muted", text: c.evidence || "nothing recorded" })
              ]),
              c.notes ? h("div", { class: "sl-link-field" }, [
                h("span", { class: "sl-link-field-l", text: "Notes" }),
                h("span", { text: c.notes })
              ]) : null,
              c.action ? h("div", { class: "sl-link-field" }, [
                h("span", { class: "sl-link-field-l", text: "Action" }),
                h("span", { text: c.action })
              ]) : null
            ])
          ]);
        })),
        h("div", { class: "hint", text: candidates.length > 1
          ? "The one you choose becomes the shared answer. What the others hold for this requirement is replaced by it."
          : "Nothing is being replaced: no other " + targetNoun() + " in this link has an answer of its own." }),
        h("div", { class: "sl-link-actions" }, [
          h("button", {
            type: "button", class: "btn primary btn-small",
            onClick: function () {
              E.linkRequirement(req.id, stage.source, inLink);
              delete slLinkStage[req.id];
              onChange();
            },
            text: "Share this answer"
          }),
          h("button", {
            type: "button", class: "btn btn-small",
            onClick: function () { delete slLinkStage[req.id]; onChange(); },
            text: "Cancel"
          })
        ])
      ]));
    }

    if (isLinked) {
      body.push(h("button", {
        type: "button", class: "btn btn-small",
        onClick: function () { E.unlinkRequirement(req.id, tid); onChange(); },
        text: "Answer this " + targetNoun() + " separately"
      }));
    }
    return { toggle: toggle, panel: h("div", { class: "sl-coverage sl-req-link" }, [
      h("div", { class: "sl-coverage-body" }, body)
    ]) };
  }

  // SL 0 to SL 4, always, on every requirement.
  //
  // Nothing is withheld: not levels the requirement selects nothing new at
  // (several levels can write identical items - "we checked this to SL 3" is
  // still the consultant's judgement to record), and not levels above the
  // target (a zone can be better than it needs to be, and that is worth being
  // able to say before anyone has established the target is met). Which one
  // lights is remembered rather than inferred - see slShownLevel - and the
  // above-target ones are MARKED rather than hidden, so a reader can tell
  // required work from headroom.
  function slLevelsOffered() {
    return [0, 1, 2, 3, 4];
  }

  // Which button reads as chosen: the level actually picked, when the items
  // still say what it would set. Falling back to the computed level covers
  // answers set item by item, and projects saved before the choice was kept.
  function slShownLevel(scoredReq, offered) {
    if (typeof scoredReq.chosenSL === "number") return scoredReq.chosenSL;
    var ach = scoredReq.achievedShown;
    if (ach == null) return null;
    var best = null;
    offered.forEach(function (n) { if (n <= ach && (best === null || n > best)) best = n; });
    return best;
  }

  // One row per item: the base requirement plus each requirement enhancement,
  // labelled with the SL it first applies at. Only in-scope items are shown -
  // SL-T scoping is what makes the list finishable on site.
  // `bare` omits the code / title / hint, for when the caller has already
  // printed them - the level panel does, since it groups items by the level
  // that introduces them.
  function slItemRow(req, scoredItem, onChange, bare, hideNaNote) {
    var tid = E.state.activeTargetId;
    var onShared = E.isSharedScope(tid);
    var inherited = scoredItem.source === "shared" && !onShared;
    var isNA = scoredItem.state === "na";
    var needsNote = isNA && String(scoredItem.note || "").trim() === "";

    var btns = h("div", { class: "sl-row caf-state-row" }, SL_ITEM_STATES.map(function (s) {
      return h("button", {
        class: "sl-btn caf-state-btn " + s.cls + (scoredItem.state === s.value ? " active" : ""),
        title: s.title || "",
        onClick: function () {
          E.setItemState(tid, req.id, scoredItem.componentId, s.value);
          onChange();
        },
        text: s.label
      });
    }));
    // On a zone, Clear means "stop overriding" when the item is inherited:
    // removing the zone answer hands the item back to the system-wide one.
    var own = E.getItemState(tid, req.id, scoredItem.componentId);
    var ownState = own && own.state;
    // Clearing an item that overrides a shared answer hands it back to
    // that answer rather than blanking it, so the control says so.
    var overriding = !onShared && !!ownState && !!scoredItem.sharedState;
    var clear = clearAnswerBtn(!!ownState, function () {
      E.setItemState(tid, req.id, scoredItem.componentId, null);
      onChange();
    }, overriding ? "Revert to shared" : null,
       overriding ? ("The shared answer is " + (SL_ITEM_LABEL[scoredItem.sharedState] || scoredItem.sharedState) +
                     ". Reverting removes this " + targetNoun() + "'s own answer and takes that one instead.") : null);
    if (clear) btns.appendChild(clear);

    var kids = [
      h("div", { class: "sl-item-h" }, [
        bare ? null : h("span", { class: "sl-item-code", text: scoredItem.isBase ? "Base" : scoredItem.componentId.replace(/^RE/, "RE ") }),
        bare ? null : h("span", { class: "sl-item-sl", title: "First applies at Security Level " + scoredItem.firstSL, text: "SL " + scoredItem.firstSL + "+" }),
        bare ? null : h("span", { class: "sl-item-title", text: scoredItem.title || "" }),
        // One tag, and only for an item actually taking the shared answer.
        // An overridden item needs no second badge: the Revert control below it
        // already says it is connected to that layer, and says what reverting
        // would restore.
        inherited
          ? h("span", { class: "pill inherit", title: "Answered once and shared. Inherited here; answer it below to override it for this " + targetNoun() + ".", text: "Shared" })
          : null,
        scoredItem.aboveTarget
          ? h("span", { class: "pill above", title: "Above the target for this " + targetNoun() + ". Recorded because it is in place, not because it is required; it is never counted as an outstanding gap.", text: "Above target" })
          : null,
        onShared
          ? h("span", { class: "muted sl-item-inherit-count", text: inheritCountText(req.id, scoredItem.componentId) })
          : null
      ]),
      (!bare && scoredItem.hint) ? h("div", { class: "sl-item-hint", text: scoredItem.hint }) : null,
      btns,
      // Only on the shared page, and only once there is an answer to
      // scope: choosing a reach for a blank item is meaningless.
      (onShared && scoredItem.state && (E.state.engagement.targets || []).length > 1)
        ? slCoverageControl(req, scoredItem, onChange)
        : null
    ];

    // The N/A justification. Without it the item is treated as not assessed,
    // so the prompt says exactly that rather than being a silent optional box.
    //
    // Not when the whole requirement is N/A: there the card carries ONE box
    // above, written to every item, and repeating it per item was the same
    // question asked five times with the same answer already in it.
    if (isNA && !hideNaNote) {
      var ta = h("textarea", { rows: "2", placeholder: "Why is this not applicable to this zone? Required: without it, this item blocks the Security Level instead of being excluded." });
      ta.value = scoredItem.note || "";
      ta.addEventListener("change", function () {
        E.setItemState(tid, req.id, scoredItem.componentId, "na", ta.value);
        onChange();
      });
      kids.push(h("div", { class: "field sl-item-note" + (needsNote ? " needs-note" : "") }, [
        h("label", { text: "Justification for N/A" }), ta,
        needsNote ? h("div", { class: "hint sl-note-warn", text: "Not yet justified, so this item currently blocks the level." }) : null
      ]));
    }

    return h("div", { class: "sl-item" + (scoredItem.state ? " is-answered" : "") +
      (inherited ? " is-inherited" : "") + (needsNote ? " is-unjustified" : "") }, kids);
  }

  // Names the items excluded from an otherwise ordinary answer, for the pill's
  // tooltip: which one, and why it does not apply here.
  function excludedItemsTitle(scoredReq) {
    return (scoredReq.items || []).filter(function (i) { return i.disposition === "excluded"; })
      .map(function (i) {
        var who = i.isBase ? "Base requirement" : i.componentId.replace(/^RE/, "RE ");
        return who + ": " + (i.note || "");
      }).join("\n") + "\nExcluded from the Security Level, not counted as a gap.";
  }

  // Whether the whole requirement is N/A, in which case ONE justification
  // covers it and the per-item boxes stand down. Shared by the card, the level
  // panel and the wizard so they cannot disagree about who asks.
  function reqIsAllNA(scoredReq) {
    var scoped = (scoredReq.items || []).filter(function (i) { return i.inScope; });
    return scoped.length > 0 && scoped.every(function (i) { return i.state === "na"; });
  }

  // Shown when every in-scope item of a requirement is N/A: one justification
  // for the whole requirement, written to each item, since that is how the
  // consultant reached it (one click on N/A, not five).
  function naJustification(req, scoredReq, tid, onChange) {
    var scoped = (scoredReq.items || []).filter(function (i) { return i.inScope; });
    if (!reqIsAllNA(scoredReq)) return null;
    var current = (scoped.filter(function (i) { return i.note; })[0] || {}).note || "";
    var needs = String(current).trim() === "";
    var ta = h("textarea", { rows: "2", placeholder:
      "Why does this requirement not apply to this " + targetNoun() +
      "? Required: without it, the items count as not assessed and block the Security Level instead of being excluded." });
    ta.value = current;
    ta.addEventListener("change", function () {
      scoped.forEach(function (i) { E.setItemState(tid, req.id, i.componentId, "na", ta.value); });
      onChange();
    });
    return h("div", { class: "field sl-item-note" + (needs ? " needs-note" : "") }, [
      h("label", { text: "Justification for N/A" }), ta,
      needs ? h("div", { class: "hint sl-note-warn", text: "Not yet justified, so this requirement currently blocks the level." }) : null
    ]);
  }

  function requirementRow(req, frRes) {
    var tid = E.state.activeTargetId;
    var resp = E.findResponse(tid, req.id) || { components: {}, evidence: "", notes: "" };
    var scoredReq = frRes.reqs.filter(function (r) { return r.requirementId === req.id; })[0];
    // Required items, plus anything recorded above the target - which is not
    // required, but has been assessed and so has to be visible and editable.
    var scoped = (scoredReq.items || []).filter(function (i) {
      return i.inScope || (i.aboveTarget && i.state);
    });

    // Out of scope at this target: shown collapsed so the consultant can see
    // it exists and why, without it competing for attention.
    if (scoped.length === 0) {
      return h("div", { class: "req is-outofscope", "data-req-id": req.id }, [
        h("div", { class: "req-h" }, [
          h("div", null, [h("span", { class: "req-code", text: req.code }), h("span", { class: "req-title", text: req.title })]),
          h("div", { class: "req-meta" }, [ h("span", { class: "pill na", text: frRes.inScope ? "Above target SL" : "FR out of scope" }) ])
        ]),
        h("div", { class: "hint", text: frRes.inScope
          ? "Applies only above the target Security Level for this " + (E.state.instrument.targetDimensionLabel || "zone").toLowerCase() + ", so it is out of scope here."
          : "This Foundational Requirement has a target of SL 0, so nothing in it is in scope." })
      ]);
    }

    // On the shared layer a "gap" pill would be a verdict for something
    // that is not a zone, so the marker says only whether anything has been
    // recorded here. The verdicts belong on the zones that inherit it.
    var pill;
    var onSharedReq = E.isSharedScope(tid);
    if (onSharedReq) {
      var recordedHere = scoredReq.countedCount - scoredReq.unassessedCount;
      pill = recordedHere > 0
        ? h("span", { class: "pill inherit", text: recordedHere === scoredReq.countedCount
            ? "Shared answer" : recordedHere + " of " + scoredReq.countedCount + " shared" })
        : h("span", { class: "pill neutral", text: "No shared answer" });
    }
    else if (scoredReq.band === "met") pill = window.App.Report.bandPill("met");
    else if (scoredReq.band === "near") pill = window.App.Report.bandPill("near");
    else if (scoredReq.unassessedCount === scoredReq.countedCount) pill = h("span", { class: "pill neutral", text: "Not yet assessed" });
    else pill = window.App.Report.bandPill("gap");

    function rerender() { renderFRPage(req.frId); }

    // The primary control: the Security Level this requirement achieves, which
    // is the standard's own vocabulary and the question a consultant is
    // actually holding in their head. It expands to item states underneath -
    // see Engine.setRequirementSL - so nothing downstream loses the detail.
    //
    // The full ladder, SL 0 to SL 4, on every requirement. Above-target levels
    // are marked rather than withheld: they are never outstanding work and
    // never count toward coverage or the roadmap, but recording one is how
    // headroom gets stated.
    var allNA = scoredReq.countedCount === 0 && scoredReq.excludedCount > 0;
    var offered = slLevelsOffered();
    var shownLevel = slShownLevel(scoredReq, offered);
    var slPicker = h("div", { class: "sl-row sl-achieved-row" },
      offered.map(function (n) {
        var above = n > scoredReq.targetSL;
        var answeredHere = scoredReq.touched && !allNA && shownLevel === n;
        var active  = answeredHere && scoredReq.matchesCleanSL;
        // Where the items were set individually, the level is still computed
        // and still true - it is just no longer the whole story. Marking it as
        // derived keeps the achieved level visible without claiming the
        // requirement was answered as a plain level.
        var derived = answeredHere && !scoredReq.matchesCleanSL;
        return h("button", {
          class: "sl-btn sl-achieved-btn" + (active ? " active" : "") + (derived ? " derived" : "") +
                 (above ? " above-target" : "") +
                 // A gap before the first one past the target, so the required
                 // ladder and the headroom read as two groups rather than five
                 // equal buttons.
                 (above && n === scoredReq.targetSL + 1 ? " first-above" : ""),
          title: derived
            ? "Achieves SL " + n + ", worked out from the items below. Click to reset the items to what SL " + n + " means."
            : above
              ? "Above the target of " + S.formatSL(scoredReq.targetSL) + " for this " + targetNoun() +
                ". Recording it shows where there is already headroom; it is never counted as outstanding work."
              : (n === 0 ? "Nothing this requirement asks for is in place"
                         : "Everything required up to SL " + n + " is in place"),
          onClick: function () {
            // Writing above the target is exactly what was asked for here, so
            // the write ceiling is the level picked, not the target.
            E.setRequirementSL(tid, req.id, n, Math.max(n, scoredReq.targetSL));
            rerender();
          },
          text: "SL " + n
        });
      }).concat([
        h("button", {
          class: "sl-btn na" + (allNA ? " active" : ""),
          title: "Not applicable here. Needs a justification, otherwise it blocks the level rather than being excluded.",
          onClick: function () {
            E.setRequirementSL(tid, req.id, "na", scoredReq.targetSL, resp.naNote || "");
            rerender();
          },
          text: "N/A"
        })
      ]).concat(
        // Only where this zone has an answer of ITS OWN to clear. `touched`
        // counts inherited items too, so a zone that merely takes a shared
        // answer was offered a Clear that deleted nothing and changed nothing
        // on screen. Detaching from a shared answer is a different decision,
        // and the link control is where it is made.
        ownAnswer(tid, req.id)
          ? [h("button", {
              class: "sl-btn clear-answer",
              title: "Clear this requirement (back to not assessed)",
              onClick: function () { E.setRequirementSL(tid, req.id, null, scoredReq.targetSL); rerender(); },
              text: "Clear"
            })]
          : []
      ));

    // Answered, but not as any single Security Level would set it: a
    // compensating measure, a partial, or an enhancement in place while the
    // base is not. Saying so is the point - the number would hide it.
    var adjusted = scoredReq.touched && !scoredReq.matchesCleanSL && !allNA;

    // Evidence follows the same rule as the items: the zone's own text if it
    // has any, otherwise the system-wide text, shown read-only with a prompt to
    // add zone-specific detail rather than retyping the shared paragraph.
    var inheritedEvidence = !E.isSharedScope(tid) && scoredReq.evidenceSource === "shared"
      ? scoredReq.evidence : "";
    var evidence = h("textarea", { onChange: function (e) { E.setResponse(tid, req.id, { evidence: e.target.value }); } });
    evidence.value = inheritedEvidence ? "" : (resp.evidence || "");
    // The prompt lives in the box rather than on a line beneath it: it says the
    // same thing on every requirement, and as a separate line it added a row of
    // grey text to all 51 of them.
    evidence.setAttribute("placeholder", inheritedEvidence
      ? "Anything specific to this " + targetNoun() + " (optional)"
      : (req.evidencePrompt || "Record how this is implemented, the evidence reviewed, and any exceptions or compensating controls."));
    // Notes inherit exactly as evidence does, but the box below only ever held
    // the ZONE's own text - so a note written once on the shared layer was
    // invisible here while appearing in the report. Same treatment: show it,
    // marked as shared, and let it be edited in place.
    var inheritedNotes = !E.isSharedScope(tid) && !(resp.notes || "").trim() &&
                         (scoredReq.notes || "").trim() ? scoredReq.notes : "";
    var notes = h("textarea", { onChange: function (e) { E.setResponse(tid, req.id, { notes: e.target.value }); } });
    notes.value = resp.notes || "";
    notes.setAttribute("placeholder", inheritedNotes
      ? "Anything specific to this " + targetNoun() + " (optional)"
      : "");

    // One disclosure, not two. The level detail and the item controls were
    // separate panels restating the same titles and hints; they are now the
    // same panel, ordered by level.
    var detailOpen = slGuidanceOpen[req.id] === true || adjusted;
    var detailToggle = h("button", {
      type: "button",
      class: "sl-items-toggle" + (detailOpen ? " open" : ""),
      title: "What each Security Level requires, and the items behind this answer",
      onClick: function () { slGuidanceOpen[req.id] = !detailOpen; rerender(); },
      text: "What each level requires"
    });
    var detailPanel = detailOpen ? slLevelPanel(req, scoredReq, rerender) : null;

    // Which zones this shared answer reaches, and - the same question from
    // the other end - which zones share this zone's answer.
    var reqCoverage = (onSharedReq && slReqCoverageControl(req, rerender)) || { toggle: null, panel: null };
    var reqLink = slLinkControl(req, scoredReq, rerender);

    var answered = scoredReq.unassessedCount === 0;
    return h("div", { class: "req" + (answered ? " is-answered" : ""), "data-req-id": req.id }, [
      h("div", { class: "req-h" }, [
        h("div", null, [h("span", { class: "req-code", text: req.code }), h("span", { class: "req-title", text: req.title })]),
        h("div", { class: "req-meta" }, [
          scoredReq.compensatingCount > 0 ? h("span", { class: "pill exceeds", title: "Relies on a compensating countermeasure", text: "Compensating" }) : null,
          (!onSharedReq && scoredReq.blocks) ? h("span", { class: "pill flag", title: "This requirement is holding the FR below its target", text: "Blocking" }) : null,
          pill
        ])
      ]),
      h("div", { class: "req-q", text: req.question }),
      // One row: the answer, then the two ways of going deeper, kept quiet and
      // pushed to the right. Three stacked rows of controls made the card look
      // busier than the decision actually is.
      h("div", { class: "sl-answer-row" }, [
        slPicker,
        h("div", { class: "sl-answer-aside" }, [
          adjusted
            ? h("span", { class: "pill flag", title: "The items do not match any single Security Level (see below).", text: "Set per item" })
            : null,
          allNA ? h("span", { class: "pill na", text: "Excluded" }) : null,
          // An outlier excluded inside an otherwise plain answer. The level is
          // still the answer, so this is not a flag - but the card must say the
          // requirement was not answered whole, or the exclusion would be
          // visible only to whoever opens the panel.
          (!allNA && scoredReq.excludedCount > 0)
            ? h("span", { class: "pill na", title: excludedItemsTitle(scoredReq),
                          text: scoredReq.excludedCount + (scoredReq.excludedCount === 1 ? " item N/A" : " items N/A") })
            : null,
          // Reach comes before the reference links: on the shared page it
          // is part of the answer, not a way of going deeper.
          reqCoverage.toggle,
          reqLink.toggle,
          detailToggle,
          whyToggle(req.rationale, rerender)
        ])
      ]),
      reqCoverage.panel,
      reqLink.panel,
      whyPanel(req.rationale),
      // One justification for a requirement marked N/A as a whole, written to
      // every item. Without it the items count as unassessed and block the
      // level, so the prompt says exactly that.
      naJustification(req, scoredReq, tid, rerender),
      detailPanel,
      h("div", { class: "req-controls" }, [
        h("div", { class: "field" }, [
          // The label carries the "shared" fact, so the block below does not
          // have to repeat it.
          h("label", { text: inheritedEvidence ? "Evidence  ·  shared" : "Evidence" }),
          inheritedEvidence ? inheritedTextBlock(req, "evidence", inheritedEvidence, rerender) : null,
          // Where the shared text already says it, the zone's own box is an
          // empty 90px rectangle on every card that will usually stay empty.
          // Offered rather than shown, like the note below it.
          (inheritedEvidence && !(resp.evidence || "").trim() && zoneEvidenceOpen[req.id] !== true)
            ? h("button", {
                type: "button", class: "req-add-note",
                onClick: function () { zoneEvidenceOpen[req.id] = true; rerender(); },
                text: "+ Add evidence specific to this " + targetNoun()
              })
            : evidence
        ]),
        // Notes are the exception, not the rule: evidence is what gets written
        // on nearly every requirement, and a second always-open box beside it
        // halved the width of the one that matters. It opens on demand, and
        // stays open whenever it holds anything.
        (notesOpen[req.id] === true || (resp.notes || "").trim() !== "" || inheritedNotes)
          ? h("div", { class: "field" }, [
              h("label", { text: inheritedNotes ? "Notes  ·  shared" : "Notes" }),
              inheritedNotes ? inheritedTextBlock(req, "notes", inheritedNotes, rerender) : null,
              notes
            ])
          : h("button", {
              type: "button", class: "req-add-note",
              onClick: function () { notesOpen[req.id] = true; rerender(); },
              text: "+ Add a note"
            }),
        // The recommendation belongs with the finding, not only in the report:
        // a consultant writing up a gap on site should be able to say what to
        // do about it without leaving the page.
        remediationBlock(req.id, rerender)
      ])
    ]);
  }

  // Which requirements have their notes box open. Notes with content are always
  // shown, so this only tracks the ones opened deliberately and left empty.
  var notesOpen = {};

  // Which shared blocks are being edited in place, keyed "<reqId>/evidence" or
  // "<reqId>/notes".
  var sharedTextEdit = {};
  // Which requirements have had the zone-specific evidence box opened. Only
  // relevant where the zone is taking a shared answer: there the box is offered
  // rather than shown, because on most requirements it stays empty.
  var zoneEvidenceOpen = {};

  // The shared text a zone is using, shown on the zone's own card.
  //
  // It was read-only, which made the box beneath it look like the tool had
  // failed to fill anything in - and to change the shared wording you had to
  // leave the zone, switch to the Shared tab and find the requirement again.
  // It is editable here now, saving to the shared answer, with the reach stated
  // so nobody edits three zones' evidence thinking they are editing one.
  function inheritedTextBlock(req, field, text, onChange) {
    var key = req.id + "/" + field;
    var editing = sharedTextEdit[key] === true;
    // Counted the scorer's way: every zone printing this text, including one
    // that overrode an item but has no text of its own.
    var zones = zonesTakingSharedField(req.id, field);
    var reach = zones.length > 1
      ? "Editing this changes it for all " + zones.length + " " + targetNounPlural() + " sharing it."
      : "Editing this changes the shared answer.";

    // No "Shared" pill here: the field label above already says the text is
    // shared, and the page was saying it twice on every one of 13 cards.
    var head = h("div", { class: "inherited-h" }, [
      h("button", {
        type: "button", class: "inherited-edit",
        title: reach,
        onClick: function () { sharedTextEdit[key] = !editing; onChange(); },
        text: editing ? "Done" : "Edit shared text"
      })
    ]);

    if (!editing) return h("div", { class: "inherited-evidence" }, [head, h("p", { text: text })]);

    var ta = h("textarea", { rows: "4" });
    ta.value = text;
    ta.addEventListener("change", function () {
      var patch = {}; patch[field] = ta.value;
      E.setResponse(E.SHARED_TARGET_ID, req.id, patch);
    });
    return h("div", { class: "inherited-evidence is-editing" }, [
      head, ta, h("div", { class: "hint", text: reach })
    ]);
  }

  // Open/closed state for each SR's "What each level requires" panel.
  // Module-local so it survives the renderFRPage re-render on every click.
  var slGuidanceOpen = {};

  // What each Security Level requires, AND the controls for answering it.
  //
  // These used to be two panels - a reference grid by level, and a list of
  // items - which restated the same titles and hints in two shapes. One panel,
  // ordered by level: each level says what it adds, and the items it adds
  // carry their own controls. A level that requires nothing further says so,
  // which is the one thing the item list alone could never show.
  function slLevelPanel(req, scoredReq, onChange) {
    var g = req.slGuidance;
    var items = scoredReq.items || [];
    if (!g && !items.length) return null;
    var targetSL = scoredReq.targetSL;
    // The capped figure: a requirement selecting nothing above SL 1 satisfies
    // every level once its base is met, and marking "Achieved" against a level
    // it never defines would be marking a row that says nothing is required.
    var achievedSL = scoredReq.achievedShown;
    // One justification for the whole requirement when every item is N/A: the
    // per-item boxes would be the same question with the same answer already
    // typed into it.
    var allNA = reqIsAllNA(scoredReq);
    var panel = h("div", { class: "sl-levels" }, []);

    [1, 2, 3, 4].forEach(function (n) {
      var entry = (g && g[String(n)]) || null;
      var newItems = items.filter(function (i) { return i.firstSL === n; });
      // Beyond anything this requirement defines: nothing to say about it.
      if (!newItems.length && (!entry || !entry.required)) {
        var everRequired = [1, 2, 3, 4].some(function (m) {
          return items.some(function (i) { return i.firstSL <= m; }) && m <= n;
        });
        if (!everRequired) return;
      }

      var head = h("div", { class: "sl-level-head" }, [
        h("span", { class: "sl-level-n", text: "SL " + n }),
        targetSL === n ? h("span", { class: "pill exceeds", text: "Target" }) : null,
        achievedSL === n ? h("span", { class: "pill met", text: "Achieved" }) : null,
        n > targetSL ? h("span", { class: "muted small", text: "above target" }) : null
      ]);

      var body;
      if (!newItems.length) {
        // The standard selects nothing new here, so meeting the level below
        // already meets this one. Worth saying: otherwise a reader assumes
        // something is missing.
        body = h("div", { class: "sl-level-none", text:
          (entry && entry.required)
            ? "Nothing further required at this level."
            : "Not selected at this level." });
      } else {
        body = h("div", { class: "sl-level-items" }, newItems.map(function (i) {
          var desc = (entry && entry.verbatimText && String(entry.verbatimText).trim() !== "")
            ? entry.verbatimText : (i.hint || "");
          // Controls for what is in scope, and for anything already recorded
          // above the target. Unanswered above-target items are reference only
          // until the consultant chooses to record them from the picker.
          var editable = i.inScope || !!i.state;
          return h("div", { class: "sl-level-item" + (i.disposition === "excluded" ? " is-excluded" : "") }, [
            h("div", { class: "sl-level-item-h" }, [
              h("span", { class: "sl-item-code", text: i.isBase ? "Base" : i.componentId.replace(/^RE/, "RE ") }),
              h("span", { class: "sl-item-title", text: i.title || "" })
            ]),
            desc ? h("div", { class: "sl-item-hint", text: desc }) : null,
            editable ? slItemRow(req, i, onChange, true, allNA) : null
          ]);
        }));
      }
      panel.appendChild(h("div", { class: "sl-level" + (targetSL === n ? " is-target" : "") +
                                          (n > targetSL ? " is-above" : "") }, [head, body]));
    });
    return panel;
  }

  // ---- Posture interview capture (domain-letter family) ----------------

  // ---- CAF principle capture page ---------------------------------------

  // Module-local map of which outcomes have their state-guidance panel
  // expanded (the "Indicators / OT lens" expander to the right of the state
  // buttons). Survives the renderCAFPrinciplePage re-render on every click.
  var cafGuideOpen = {};
  // Open/closed state for the per-outcome "Example questions to ask" toggle
  // (the inspector prompt questions, e.g. the ONR SyAPs instruments). Separate
  // from cafGuideOpen so questions get their own button, and persists across the
  // re-render on every answer click. Shared by the list row and the wizard.
  var cafQuestionsOpen = {};
  function cafQuestionsToggle(outcome, rerender) {
    var qs = outcome.promptQuestions;
    if (!qs || !qs.length) return null;
    var open = cafQuestionsOpen[outcome.id] === true;
    var toggle = h("button", {
      type: "button",
      class: "sl-guidance-toggle" + (open ? " open" : ""),
      onClick: function () { cafQuestionsOpen[outcome.id] = !open; rerender(); },
      text: "Example questions to ask"
    });
    var panel = open ? h("div", { class: "caf-state-guide" }, [
      h("div", { class: "caf-summary-label", text: "Example questions to ask (prompts, not a checklist)" }),
      h("ul", { class: "caf-questions" }, qs.map(function (q) { return h("li", null, [q]); }))
    ]) : null;
    return { toggle: toggle, panel: panel };
  }

  function renderCAFPrinciplePage(principleId) {
    refs.main.innerHTML = "";
    var principles = E.getCAFPrinciples();
    var principle = principles.filter(function (p) { return p.id === principleId; })[0];
    if (!principle) { principle = principles[0]; principleId = principle.id; }
    // Auto-expand the objective containing this principle so the sidebar
    // shows where the user is. Manual collapse via the chevron still works
    // (the user can re-close after navigation).
    if (principle.objectiveId) cafExpandedObj[principle.objectiveId] = true;
    var objectives = E.getCAFObjectives();
    var obj = objectives.filter(function (o) { return o.id === principle.objectiveId; })[0] || { name: "" };

    refs.main.appendChild(h("h1", { class: "page-title", text: principle.id + "  " + principle.name }));
    refs.main.appendChild(h("p", { class: "page-sub", text:
      "Objective " + obj.id + " " + obj.name +
      "  -  Profile: " + cafActiveProfileName() }));
    refs.main.appendChild(buildSitesToolbar());

    // Per-principle progress banner (counts + confidence).
    var scored = E.scoreActiveTarget();
    var pRes = scored && scored.byPrinciple.filter(function (x) { return x.principleId === principleId; })[0];
    if (pRes) refs.main.appendChild(cafPrincipleBanner(pRes));

    // Optional family/principle-level OT lens (used by the NIST 800-53
    // instrument: one OT lens per control family, shown once here rather than
    // repeated on every control).
    if (principle.otLens) {
      refs.main.appendChild(h("div", { class: "card" }, [
        h("div", { class: "card-h" }, [h("h2", { text: "OT lens - " + principle.name })]),
        h("div", { class: "card-b" }, [cafOTLensPanel(principle.otLens)])
      ]));
    }

    // Outcome cards.
    var outcomes = E.getCAFOutcomesByPrinciple(principleId);
    var list = h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: cafDisp().outcomesTitle })]),
      h("div", { class: "card-b" }, outcomes.map(function (o) { return cafOutcomeRow(o, pRes); }))
    ]);
    refs.main.appendChild(list);
    var fn = sectionFootNav(E.getCAFPrinciples().map(function (p) { return { id: p.id, label: p.id }; }), principleId, "caf-principle");
    if (fn) refs.main.appendChild(fn);
  }

  // ---- caf-achieved guided wizard (one contributing outcome per page) -------
  // Serves every caf-achieved instrument (NCSC CAF, NIST 800-53, 800-82 ICS
  // overlay). Shares the engine response store with the per-principle list
  // (answers flow both ways) and reuses the posture/NIS2 wizard CSS.
  var cafWizardIdx = 0;
  // Flat outcome list, grouped by objective then principle then outcome so the
  // walk order matches the sidebar (objectives -> principles -> outcomes).
  function cafWizardItems() {
    var out = [];
    var principles = E.getCAFPrinciples();
    E.getCAFObjectives().forEach(function (obj) {
      principles.filter(function (p) { return p.objectiveId === obj.id; }).forEach(function (p) {
        E.getCAFOutcomesByPrinciple(p.id).forEach(function (o) {
          out.push({ outcome: o, principle: p, objectiveId: obj.id, objName: obj.name });
        });
      });
    });
    return out;
  }
  function enterCAFWizard(idx) {
    var items = cafWizardItems();
    cafWizardIdx = Math.max(0, Math.min(idx || 0, Math.max(0, items.length - 1)));
    view = "caf-wizard"; viewFR = null;
    render();
  }
  function jumpToCAFObjective(objId) {
    var items = cafWizardItems();
    for (var i = 0; i < items.length; i++) { if (items[i].objectiveId === objId) { cafWizardIdx = i; break; } }
    renderCAFWizardPage();
  }

  function cafOutcomeStatePill(outcome, ov) {
    return cafStatePill(E.findResponse(E.state.activeTargetId, outcome.id) || {}, E.state.instrument);
  }

  // Right-hand context column: status + expected-state badge, why it matters,
  // and the outcome's detail blocks (control text / IGPs / OT lens), shown open.
  // Which of an outcome's criteria blocks are open, per outcome. Module-local
  // so the choice survives the re-render every answer triggers.
  var cafCriteriaOpen = {};

  // The criteria the outcome is judged against, in the WIDE column: the
  // verbatim control text and the indicators of good practice. The indicators
  // are the reason this moved out of the context rail - three columns of CAF
  // text need the room, and they are what the consultant is reading while
  // choosing a state.
  //
  // The indicators open by default; anything else starts closed, so the
  // evidence box stays on screen.
  function cafWizardCriteria(outcome) {
    var blocks = cafOutcomeDetailBlocks(outcome);
    if (!blocks.length) return null;
    var host = h("div", { class: "caf-criteria" }, []);
    blocks.forEach(function (b, i) {
      var key = outcome.id + "/" + i;
      var isIGP = /indicator/i.test(b.toggleLabel || "");
      var open = cafCriteriaOpen[key] === undefined ? isIGP : cafCriteriaOpen[key];
      var toggle = h("button", {
        type: "button",
        class: "sl-items-toggle" + (open ? " open" : ""),
        onClick: function () { cafCriteriaOpen[key] = !open; renderCAFWizardPage(); },
        text: b.toggleLabel || "Detail"
      });
      host.appendChild(toggle);
      if (open) host.appendChild(b.node);
    });
    return host;
  }

  function cafWizardContext(item) {
    var outcome = item.outcome;
    var overlay = E.getActiveCAFOverlay() || {};
    var ov = overlay[outcome.id] || null;
    var kids = [];
    var statusRow = [cafOutcomeStatePill(outcome, ov)];
    if (ov && ov.expectedState) {
      var lbl = window.App.ScoringCAF.stateLabelFor(ov.expectedState, E.state.instrument) || ov.expectedState;
      statusRow.push(h("span", { class: "pill exceeds", style: "margin-left:6px;", text: "Expected: " + lbl }));
    }
    kids.push(h("div", { class: "wiz-ctx-block" }, statusRow));
    if (outcome.rationale) kids.push(h("div", { class: "wiz-ctx-block" }, [
      h("div", { class: "wiz-ctx-label", text: "Why this matters" }),
      h("div", { class: "wiz-ctx-text", text: outcome.rationale })
    ]));
    var supp = (ov && ov.supplementaryGuidance) || "";
    if (supp) kids.push(h("div", { class: "wiz-ctx-block" }, [
      h("div", { class: "wiz-ctx-label", text: "Profile guidance" }),
      h("div", { class: "wiz-ctx-text", text: supp })
    ]));
    // The indicators of good practice and the verbatim control text do NOT go
    // in here. They are the criteria the outcome is judged against, and the
    // indicators are a three-column grid of verbatim CAF text; at 322px that
    // is three columns of about ninety pixels each and effectively unreadable.
    // They render in the answer column instead, which is the wide one.
    //
    // Inspector prompt questions behind their own toggle (collapsed by default).
    var qb = cafQuestionsToggle(outcome, function () { renderCAFWizardPage(); });
    if (qb) kids.push(h("div", { class: "wiz-ctx-block" }, [qb.toggle, qb.panel].filter(Boolean)));
    return h("div", { class: "wizard-context" }, kids);
  }

  // Answer widget: outcome heading + the state buttons + evidence/notes.
  function cafWizardAnswer(item) {
    var outcome = item.outcome;
    var tid = E.state.activeTargetId;
    var inst = E.state.instrument;
    var states = inst.states || [];
    var resp = E.findResponse(tid, outcome.id) || { state: null, applicable: true, evidence: "", notes: "" };
    function setState(v, applicable) {
      E.setResponse(tid, outcome.id, { applicable: applicable !== false, state: v });
      renderCAFWizardPage();
    }
    var btnRow = h("div", { class: "sl-row caf-state-row" }, []);
    states.forEach(function (st) {
      if (st.value === "unknown" || st.value === "na") return;
      var active = (resp.applicable !== false) && (resp.state === st.value);
      btnRow.appendChild(h("button", { class: "sl-btn caf-state-btn caf-state-" + st.value + (active ? " active" : ""), onClick: function () { setState(st.value); }, text: st.label }));
    });
    btnRow.appendChild(h("button", { class: "sl-btn special" + (resp.state === "unknown" ? " active" : ""), onClick: function () { setState("unknown"); }, text: "Unknown" }));
    btnRow.appendChild(h("button", { class: "sl-btn na" + ((resp.applicable === false || resp.state === "na") ? " active" : ""), onClick: function () { setState("na", false); }, text: "N/A" }));
    var clear = clearAnswerBtn(resp.applicable === false || !!resp.state, function () { setState(null); });
    if (clear) btnRow.appendChild(clear);

    var kids = [
      h("div", { class: "req-h" }, [ h("div", null, [
        h("span", { class: "req-code", text: outcome.id }),
        h("span", { class: "req-title", text: outcome.title })
      ]) ]),
      h("div", { class: "field" }, [ h("label", { text: "State" }), btnRow ])
    ];
    kids.push(h("div", { class: "field", style: "margin-top:10px;" }, [
      h("label", { text: "Evidence" }),
      (function () { var ta = h("textarea"); ta.value = resp.evidence || ""; ta.addEventListener("change", function () { E.setResponse(tid, outcome.id, { evidence: ta.value }); }); return ta; })()
    ]));
    kids.push(h("div", { class: "field" }, [
      h("label", { text: "Notes" }),
      (function () { var ta = h("textarea"); ta.value = resp.notes || ""; ta.addEventListener("change", function () { E.setResponse(tid, outcome.id, { notes: ta.value }); }); return ta; })()
    ]));
    // Inline remediation (priority/owner/action/impact): appears once the
    // outcome is a gap, and saves to the same response fields the report
    // roadmap and the Excel/Word exports read - same as the other wizards.
    var rem = wizardGapRemediation(outcome, renderCAFWizardPage);
    if (rem) kids.push(rem);
    return h("div", { class: "req posture-q" }, kids);
  }

  function renderCAFWizardPage() {
    refs.main.innerHTML = "";
    var items = cafWizardItems();
    if (items.length === 0) { refs.main.appendChild(h("p", { class: "muted", text: "No outcomes to capture." })); return; }
    if (cafWizardIdx > items.length - 1) cafWizardIdx = items.length - 1;
    if (cafWizardIdx < 0) cafWizardIdx = 0;
    var item = items[cafWizardIdx];
    var objs = E.getCAFObjectives();
    var curObjIdx = objs.map(function (o) { return o.id; }).indexOf(item.objectiveId);
    var scored = E.scoreActiveTarget();
    var total = items.length;
    var atStart = cafWizardIdx === 0, atEnd = cafWizardIdx >= total - 1;

    var wrap = h("div", { class: "wizard" }, []);
    var applicable = (scored && scored.overall && scored.overall.total) || 0;
    var answered = (scored && scored.overall && (scored.overall.answered != null ? scored.overall.answered : (scored.overall.counts ? (scored.overall.counts.achieved + scored.overall.counts.partially + scored.overall.counts.not) : 0))) || 0;
    var pct = applicable > 0 ? Math.round((answered / applicable) * 100) : 0;

    var stepper = h("div", { class: "wizard-stepper" }, []);
    objs.forEach(function (o, i) {
      if (i > 0) stepper.appendChild(h("span", { class: "wizard-step-sep", text: "›" }));
      var cls = "wizard-step" + (i === curObjIdx ? " active" : (i < curObjIdx ? " done" : ""));
      stepper.appendChild(h("button", { class: cls, title: "Jump to " + o.name, onClick: (function (oid) { return function () { jumpToCAFObjective(oid); }; })(o.id), text: o.id }));
    });
    stepper.appendChild(h("span", { class: "wizard-topmeta" }, [
      document.createTextNode(cafDisp().outcomesTitle.replace(/s$/, "") + " "), h("strong", { text: String(cafWizardIdx + 1) }), document.createTextNode(" of " + total)
    ]));
    wrap.appendChild(h("div", { class: "wizard-topbar" }, [
      stepper,
      h("div", { class: "wizard-progress" }, [ h("div", { class: "wizard-progress-bar", style: "width:" + pct + "%;" }, []) ])
    ]));
    if (E.state.engagement.targets.length > 1) wrap.appendChild(buildSitesToolbar());

    wrap.appendChild(h("div", { class: "card wizard-card" }, [
      h("div", { class: "wizard-answer" }, [
        cafWizardAnswer(item),
        cafWizardCriteria(item.outcome)
      ]),
      cafWizardContext(item)
    ]));

    var prev = h("button", { class: "btn", onClick: function () { if (!atStart) { cafWizardIdx -= 1; renderCAFWizardPage(); } }, text: "‹ Previous" });
    if (atStart) prev.setAttribute("disabled", "");
    var next = h("button", { class: "btn primary", onClick: function () { if (!atEnd) { cafWizardIdx += 1; renderCAFWizardPage(); } }, text: "Next ›" });
    if (atEnd) next.setAttribute("disabled", "");
    wrap.appendChild(h("div", { class: "wizard-footbar" }, [
      h("button", { class: "btn", onClick: function () { go("caf-principle", item.principle.id); }, text: "Switch to list view" }),
      h("span", { class: "wizard-footmeta", text: item.principle.id + " " + item.principle.name + "  ·  " + item.objectiveId + " " + item.objName }),
      h("div", { class: "spacer" }, []),
      prev,
      h("button", { class: "btn", onClick: function () { go("report"); }, text: "Jump to report" }),
      next
    ]));
    refs.main.appendChild(wrap);
  }

  function cafActiveProfileName() {
    var reg = E.getCAFProfileRegistry();
    var id = E.getActiveCAFProfileId();
    var entry = ((reg && reg.profiles) || []).filter(function (p) { return p.id === id; })[0];
    if (!entry) return "(none)";
    return entry.name + (entry.status === "placeholder" ? " (placeholder)" : "");
  }

  // State pill + count-pills driven by the instrument's substantive states, so
  // each caf-achieved instrument reads correctly (CAF: Achieved / Partially /
  // Not Achieved; NIST 800-53 & 800-82: Satisfied / Other Than Satisfied).
  function cafStatePill(resp, inst) {
    var CAF = window.App.ScoringCAF;
    if (!resp || resp.applicable === false || resp.state === "na") return h("span", { class: "pill na", text: "Not applicable" });
    if (resp.state === "unknown") return h("span", { class: "pill neutral", text: "Unknown" });
    if (!resp.state) return h("span", { class: "pill neutral", text: "Not yet set" });
    return h("span", { class: "pill " + (CAF.stateColourFor(resp.state, inst) || "neutral"), text: CAF.stateLabelFor(resp.state, inst) || resp.state });
  }
  function cafCountPills(counts, inst) {
    var out = [];
    window.App.ScoringCAF.substantiveStates(inst).forEach(function (s, i) {
      if (i) out.push(document.createTextNode(" "));
      out.push(h("span", { class: "pill " + s.colour, text: (counts[s.value] || 0) + " " + s.label }));
    });
    return out;
  }

  function cafPrincipleBanner(pRes) {
    var CAF = window.App.ScoringCAF;
    var c = pRes.counts;
    var meetsPct = pRes.total > 0 ? CAF.formatPct((pRes.meeting) / pRes.total) : "-";
    return h("div", { class: "card" }, [
      h("div", { class: "card-b" }, [
        h("div", { class: "kpi-row" }, [
          h("div", { class: "kpi" }, [
            h("div", { class: "lbl", text: "Outcome profile" }),
            h("div", { class: "val", style: "font-size:14px; line-height:1.4;" }, cafCountPills(c, E.state.instrument))
          ]),
          h("div", { class: "kpi" }, [
            h("div", { class: "lbl", text: "Meets expected (profile)" }),
            h("div", { class: "val", text: pRes.meeting + " / " + (pRes.meeting + pRes.below + pRes.gapUnknown) + "  (" + meetsPct + ")" })
          ]),
          h("div", { class: "kpi" }, [
            h("div", { class: "lbl", text: "Coverage" }),
            h("div", { class: "val", text: CAF.formatPct(pRes.coverage) })
          ]),
          h("div", { class: "kpi" }, [
            h("div", { class: "lbl", text: "Confidence" }),
            h("div", { class: "val", text: pRes.confidenceLevel || "-" })
          ])
        ])
      ])
    ]);
  }

  // Detail blocks for an outcome (verbatim control text, indicators of good
  // practice / state summaries, and per-outcome OT lens), each with the short
  // label used on the capture-card toggle. Shared by the per-outcome capture
  // card (behind the expander) and the guided wizard (shown in the context
  // column). Returns [{ node, toggleLabel }].
  function cafOutcomeDetailBlocks(outcome) {
    var blocks = [];
    if (outcome.controlText && String(outcome.controlText).trim()) {
      var disp = (E.state.instrument && E.state.instrument.display) || {};
      var unit = disp.outcomesTitle ? disp.outcomesTitle.replace(/s$/i, "").toLowerCase() : "control";
      blocks.push({ toggleLabel: "What this " + unit + " requires", node: h("div", { class: "caf-summaries" }, [
        h("div", { class: "caf-summary-label", text: outcome.controlTextLabel || "Control (verbatim)" }),
        h("div", { class: "caf-control-text" }, String(outcome.controlText).split("\n").map(function (ln) {
          return h("div", { class: "caf-control-line" }, [document.createTextNode(ln)]);
        }))
      ]) });
    }
    var summaries = outcome.stateSummary || {};
    var hasIGPs = outcome.igps && (
      (outcome.igps.achieved && outcome.igps.achieved.length) ||
      (outcome.igps.partially && outcome.igps.partially.length) ||
      (outcome.igps.not && outcome.igps.not.length)
    );
    if (hasIGPs) {
      blocks.push({ toggleLabel: "Indicators of good practice", node: cafIGPsBlock(outcome.igps) });
    } else if (typeof summaries === "string") {
      if (summaries.trim()) blocks.push({ toggleLabel: "What each state means", node: h("div", { class: "caf-summaries" }, [
        h("div", { class: "caf-summary-label", text: "State summary" }),
        h("div", { class: "caf-summary" }, [document.createTextNode(summaries)])
      ]) });
    } else if (summaries.achieved || summaries.partially || summaries.notAchieved) {
      blocks.push({ toggleLabel: "What each state means", node: h("div", { class: "caf-summaries" }, [
        h("div", { class: "caf-summary-label", text: "State summaries (paraphrased as a reminder; not verbatim CAF text)" }),
        h("div", { class: "caf-summary-grid" }, [
          h("div", { class: "caf-summary caf-summary-achieved" }, [h("span", { class: "caf-summary-tag", text: "Achieved" }), document.createTextNode(summaries.achieved || "")]),
          h("div", { class: "caf-summary caf-summary-partially" }, [h("span", { class: "caf-summary-tag", text: "Partially" }), document.createTextNode(summaries.partially || "")]),
          h("div", { class: "caf-summary caf-summary-not" }, [h("span", { class: "caf-summary-tag", text: "Not" }), document.createTextNode(summaries.notAchieved || "")])
        ])
      ]) });
    }
    var lens = outcome.otLens || null;
    var hasLens = !!lens && !!(lens.framing || (lens.relatedSRs && lens.relatedSRs.length) || (lens.related80082 && lens.related80082.length) || lens.gotchas);
    if (hasLens) {
      blocks.push({ toggleLabel: "OT lens", node: h("div", { class: "caf-lens-wrap" }, [
        h("div", { class: "caf-summary-label", text: "OT lens" }),
        cafOTLensPanel(lens)
      ]) });
    }
    return blocks;
  }

  function cafOutcomeRow(outcome, pRes) {
    var resp = E.findResponse(E.state.activeTargetId, outcome.id) || { state: null, applicable: true, evidence: "", notes: "" };
    var inst = E.state.instrument;
    var states = inst.states || [];
    var overlay = E.getActiveCAFOverlay() || {};
    var ov = overlay[outcome.id] || null;
    var expected = ov ? ov.expectedState : null;
    var supplementary = (ov && ov.supplementaryGuidance) || "";

    // State pill (current) - label/colour from the instrument's states.
    var statePill = cafStatePill(resp, inst);

    // Expected-state badge (only if the profile has populated one). A control the
    // profile does NOT require is flagged so the consultant can still record it as
    // implemented (above baseline) without it affecting the score.
    var notRequired = ov && ov.applicable === false;
    var expectedBadge = null;
    if (notRequired) {
      expectedBadge = h("span", { class: "pill neutral", style: "margin-left:6px;", title: "This control is not required by the selected profile. Marking it Implemented records it as 'above baseline' for the report; it does not affect the score.", text: "Not required by this profile" });
    } else if (expected) {
      var lbl = window.App.ScoringCAF.stateLabelFor(expected, inst) || expected;
      expectedBadge = h("span", { class: "pill exceeds", style: "margin-left:6px;", text: "Expected: " + lbl });
    } else if (ov) {
      expectedBadge = h("span", { class: "pill neutral", style: "margin-left:6px;", text: "Expected: not set" });
    }

    // "Above baseline" badge: implemented a control the profile does not require.
    var aboveBadge = (notRequired && (resp.state === "achieved" || resp.state === "partially"))
      ? h("span", { class: "pill met", style: "margin-left:6px;", title: "Implemented but not required by this profile. Captured for the report and reassessment tracking, and excluded from the score.", text: "Above baseline" })
      : null;

    // "Added by overlay" badge: the profile overlay marks this control as one the
    // ICS overlay adds beyond the standard baseline (overlaySource === "added").
    var addedBadge = (ov && ov.overlaySource === "added")
      ? h("span", { class: "pill exceeds", style: "margin-left:6px;", title: "Added by the ICS overlay beyond the standard 800-53B baseline", text: "Added by overlay" })
      : null;

    // State buttons row.
    var btnRow = h("div", { class: "sl-row caf-state-row" }, []);
    states.forEach(function (st) {
      if (st.value === "unknown" || st.value === "na") return; // handled separately
      var active = (resp.applicable !== false) && (resp.state === st.value);
      btnRow.appendChild(h("button", {
        class: "sl-btn caf-state-btn caf-state-" + st.value + (active ? " active" : ""),
        onClick: function () {
          E.setResponse(E.state.activeTargetId, outcome.id, { applicable: true, state: st.value });
          renderCAFPrinciplePage(outcome.principleId);
        },
        text: st.label
      }));
    });
    btnRow.appendChild(h("button", {
      class: "sl-btn special" + (resp.state === "unknown" ? " active" : ""),
      onClick: function () {
        E.setResponse(E.state.activeTargetId, outcome.id, { applicable: true, state: "unknown" });
        renderCAFPrinciplePage(outcome.principleId);
      },
      text: "Unknown"
    }));
    btnRow.appendChild(h("button", {
      class: "sl-btn na" + ((resp.applicable === false || resp.state === "na") ? " active" : ""),
      onClick: function () {
        E.setResponse(E.state.activeTargetId, outcome.id, { applicable: false, state: "na" });
        renderCAFPrinciplePage(outcome.principleId);
      },
      text: "N/A"
    }));
    var cafClear = clearAnswerBtn(resp.applicable === false || !!resp.state, function () {
      E.setResponse(E.state.activeTargetId, outcome.id, { applicable: true, state: null });
      renderCAFPrinciplePage(outcome.principleId);
    });
    if (cafClear) btnRow.appendChild(cafClear);

    // Detailed guidance, collapsed by default behind a toggle to the right of
    // the state buttons (mirrors the 62443-3-3 "What each SL requires" pattern).
    // Holds the verbatim control text / CAF indicators of good practice / state
    // summaries AND the per-outcome OT lens. Blocks are shared with the wizard.
    var detailBlocks = cafOutcomeDetailBlocks(outcome);
    var guideBlock = null;
    if (detailBlocks.length) {
      var open = cafGuideOpen[outcome.id] === true;
      var toggle = h("button", {
        type: "button",
        class: "sl-guidance-toggle" + (open ? " open" : ""),
        onClick: function () {
          cafGuideOpen[outcome.id] = !open;
          renderCAFPrinciplePage(outcome.principleId);
        },
        text: detailBlocks.map(function (b) { return b.toggleLabel; }).join("  ·  ")
      });
      var panel = open ? h("div", { class: "caf-state-guide" }, detailBlocks.map(function (b) { return b.node; })) : null;
      guideBlock = { toggle: toggle, panel: panel };
    }

    // State buttons + guidance toggle share one row; the toggle sits to the
    // right of the buttons (as in the 3-3 capture card).
    var stateBar = h("div", { class: "sl-row-bar" }, [btnRow]);
    if (guideBlock) stateBar.appendChild(guideBlock.toggle);
    // Dedicated "Example questions to ask" toggle (inspector prompts), kept
    // separate from the guidance so it has its own button and stays collapsed.
    var qBlock = cafQuestionsToggle(outcome, function () { renderCAFPrinciplePage(outcome.principleId); });
    if (qBlock) stateBar.appendChild(qBlock.toggle);

    // Supplementary guidance from the profile, if any.
    var supplementaryBlock = supplementary ? h("div", { class: "caf-supplementary" }, [
      h("div", { class: "caf-supplementary-label", text: "Profile guidance" }),
      document.createTextNode(supplementary)
    ]) : null;

    // Evidence + notes.
    var evidence = h("textarea", { onChange: function (e) { E.setResponse(E.state.activeTargetId, outcome.id, { evidence: e.target.value }); } });
    evidence.value = resp.evidence || "";
    var notes = h("textarea", { onChange: function (e) { E.setResponse(E.state.activeTargetId, outcome.id, { notes: e.target.value }); } });
    notes.value = resp.notes || "";

    return h("div", { class: "req caf-outcome" + ((resp.applicable === false || !!resp.state) ? " is-answered" : ""), "data-req-id": outcome.id }, [
      h("div", { class: "req-h" }, [
        h("div", null, [
          h("span", { class: "req-code", text: outcome.id }),
          h("span", { class: "req-title", text: outcome.title }),
          (outcome.assetClass || outcome.securityFunction)
            ? h("div", { class: "muted", style: "font-size:12px;margin-top:2px;", text: [
                outcome.assetClass ? "Asset class: " + outcome.assetClass : null,
                outcome.securityFunction ? "Security function: " + outcome.securityFunction : null
              ].filter(Boolean).join("  ·  ") })
            : null
        ]),
        h("div", { class: "req-meta" }, [statePill, expectedBadge, aboveBadge, addedBadge])
      ]),
      h("div", { class: "field" }, [
        h("label", { text: "State" }),
        stateBar
      ]),
      guideBlock ? guideBlock.panel : null,
      qBlock ? qBlock.panel : null,
      whyThisMattersBlock(outcome.rationale),
      supplementaryBlock,
      h("div", { class: "req-controls" }, [
        h("div", { class: "field" }, [h("label", { text: "Evidence" }), evidence]),
        h("div", { class: "field" }, [h("label", { text: "Notes" }), notes]),
        remediationBlock(outcome.id, function () { renderCAFPrinciplePage(outcome.principleId); })
      ])
    ]);
  }

  function cafIGPsBlock(igps) {
    function group(label, cls, items) {
      var ul = h("ul", { class: "caf-igp-list" }, (items || []).map(function (line) { return h("li", null, [line]); }));
      return h("div", { class: "caf-summary " + cls }, [
        h("span", { class: "caf-summary-tag", text: label }),
        ul
      ]);
    }
    return h("div", { class: "caf-summaries" }, [
      h("div", { class: "caf-summary-label", text: "Indicators of good practice (verbatim from the CAF)" }),
      h("div", { class: "caf-summary-grid" }, [
        group("Achieved",  "caf-summary-achieved",  igps.achieved),
        group("Partially", "caf-summary-partially", igps.partially),
        group("Not",       "caf-summary-not",       igps.not)
      ])
    ]);
  }

  function cafOTLensPanel(lens) {
    var children = [];
    if (lens.framing) children.push(h("p", { class: "caf-lens-framing", text: lens.framing }));
    var refs = [];
    if (lens.relatedSRs && lens.relatedSRs.length)
      refs.push(h("div", null, [h("strong", { text: "62443-3-3 SRs: " }), lens.relatedSRs.join(", ")]));
    if (lens.related80082 && lens.related80082.length)
      refs.push(h("div", null, [h("strong", { text: "NIST 800-82 areas: " }), lens.related80082.join(", ")]));
    if (refs.length) children.push(h("div", { class: "caf-lens-refs" }, refs));
    if (lens.gotchas) children.push(h("p", { class: "caf-lens-gotchas" }, [h("strong", { text: "OT gotchas: " }), lens.gotchas]));
    return h("div", { class: "caf-lens-panel" }, children);
  }

  // Re-render whichever posture capture view is active after an answer change.
  // questionRow / captureFieldNode are shared between the domain list and the
  // guided wizard, so they route their re-render through here.
  function rerenderCapture() {
    if (view === "wizard") renderWizardPage();
    else renderInterviewPage(viewFR);
  }

  // ---- Guided wizard (one posture question per page) -------------------
  // Same engine response store as the domain list, so answers given here show
  // up in the list view and vice versa - it's one underlying assessment.
  var wizardIdx = 0;
  function wizardQuestions() {
    var qs = [];
    E.getDomains().forEach(function (d) { qs = qs.concat(E.getQuestionsByDomain(d.id)); });
    return qs;
  }
  function enterWizard(idx) {
    var qs = wizardQuestions();
    wizardIdx = Math.max(0, Math.min(idx || 0, Math.max(0, qs.length - 1)));
    view = "wizard"; viewFR = null;
    render();
  }
  // Jump the wizard to the first question of a given domain (stepper clicks).
  function jumpToDomain(domainId) {
    var qs = wizardQuestions();
    for (var i = 0; i < qs.length; i++) {
      if (qs[i].domainId === domainId) { wizardIdx = i; break; }
    }
    renderWizardPage();
  }

  // The single most relevant status pill for a question (answer state / band).
  // Used both in the dense list and in the wizard's context column.
  function questionStatePill(q, dRes) {
    if (!q.scored) return h("span", { class: "pill neutral", text: "Context only" });
    var scoredQ = (dRes.questions || []).filter(function (x) { return x.questionId === q.id; })[0];
    if (!scoredQ || scoredQ.state === "unanswered") return h("span", { class: "pill neutral", text: "Not yet answered" });
    if (scoredQ.state === "na")      return window.App.Report.bandPill("na");
    if (scoredQ.state === "unknown") return h("span", { class: "pill neutral", text: "Unknown (reduces coverage)" });
    if (scoredQ.state === "scored")  return h("span", { class: "pill " + (scoredQ.score >= 0.7 ? "met" : (scoredQ.score >= 0.4 ? "near" : "gap")), text: "Band " + scoredQ.band + " - " + scoredQ.bandLabel });
    return null;
  }

  // The anchor text for the top (best) band - a ready-made "what good looks
  // like" without needing a separate data field.
  function topBandAnchor(q) {
    if (!q.bandAnchors) return null;
    var nums = Object.keys(q.bandAnchors).map(Number).filter(function (n) { return !isNaN(n); });
    if (!nums.length) return null;
    var max = Math.max.apply(null, nums);
    return q.bandAnchors[String(max)] || null;
  }

  // The wizard's right-hand context column. Surfaces the answer status, why the
  // question matters (optional q.rationale), what good looks like (q.goodLooksLike
  // or the top band anchor), any guidance, and standards mappings (q.references).
  // Optional fields degrade gracefully when the instrument data omits them.
  function wizardContextPanel(q, dRes) {
    var kids = [];
    var pill = questionStatePill(q, dRes);
    if (pill) kids.push(h("div", { class: "wiz-ctx-block" }, [pill]));
    if (q.rationale) {
      kids.push(h("div", { class: "wiz-ctx-block" }, [
        h("div", { class: "wiz-ctx-label", text: "Why this matters" }),
        h("div", { class: "wiz-ctx-text", text: q.rationale })
      ]));
    }
    var good = q.goodLooksLike || topBandAnchor(q);
    if (good) {
      kids.push(h("div", { class: "wiz-ctx-block" }, [
        h("div", { class: "wiz-ctx-label", text: "What good looks like" }),
        h("div", { class: "wiz-ctx-good", text: good })
      ]));
    }
    if (q.guidance) {
      kids.push(h("div", { class: "wiz-ctx-block" }, [
        h("div", { class: "wiz-ctx-label", text: "Guidance" }),
        h("div", { class: "wiz-ctx-text", text: q.guidance })
      ]));
    }
    if (q.references && q.references.length) {
      kids.push(h("div", { class: "wiz-ctx-block" }, [
        h("div", { class: "wiz-ctx-label", text: "Maps to" }),
        h("div", { class: "wiz-ctx-maps" }, q.references.map(function (r) {
          return h("span", { class: "wiz-ctx-tag", text: r });
        }))
      ]));
    }
    if (kids.length === 0) {
      kids.push(h("div", { class: "wiz-ctx-text muted", text: "No additional guidance for this question yet." }));
    }
    return h("div", { class: "wizard-context" }, kids);
  }

  function renderWizardPage() {
    refs.main.innerHTML = "";
    var qs = wizardQuestions();
    if (qs.length === 0) { refs.main.appendChild(h("p", { class: "muted", text: "No questions to capture." })); return; }
    if (wizardIdx > qs.length - 1) wizardIdx = qs.length - 1;
    if (wizardIdx < 0) wizardIdx = 0;
    var q = qs[wizardIdx];
    var domains = E.getDomains();
    var domain = domains.filter(function (d) { return d.id === q.domainId; })[0] || { id: "", name: "" };
    var curDomainIdx = domains.map(function (d) { return d.id; }).indexOf(q.domainId);
    var scored = E.scoreActiveTarget();
    var dRes = scored.perDomain.filter(function (x) { return x.domainId === q.domainId; })[0] || { questions: [] };
    var total = qs.length;
    var atStart = wizardIdx === 0;
    var atEnd = wizardIdx >= total - 1;

    var wrap = h("div", { class: "wizard" }, []);

    // --- Top bar: domain stepper + progress + counter ---
    var scorable = scored.totalScorable || 0;
    var answered = scored.totalAnswered || 0;
    var pct = scorable > 0 ? Math.round((answered / scorable) * 100) : 0;

    var stepper = h("div", { class: "wizard-stepper" }, []);
    domains.forEach(function (d, i) {
      if (i > 0) stepper.appendChild(h("span", { class: "wizard-step-sep", text: "›" }));
      var cls = "wizard-step" + (i === curDomainIdx ? " active" : (i < curDomainIdx ? " done" : ""));
      stepper.appendChild(h("button", {
        class: cls,
        title: "Jump to " + d.name,
        onClick: (function (did) { return function () { jumpToDomain(did); }; })(d.id),
        text: cap(d.id)
      }));
    });
    stepper.appendChild(h("span", { class: "wizard-topmeta" }, [
      document.createTextNode("Question "),
      h("strong", { text: String(wizardIdx + 1) }),
      document.createTextNode(" of " + total)
    ]));

    wrap.appendChild(h("div", { class: "wizard-topbar" }, [
      stepper,
      h("div", { class: "wizard-progress" }, [
        h("div", { class: "wizard-progress-bar", style: "width:" + pct + "%;" }, [])
      ])
    ]));
    // Site tabs only matter when there's more than one target.
    if (E.state.engagement.targets.length > 1) wrap.appendChild(buildSitesToolbar());

    // --- Card: answer column (left) + context column (right) ---
    wrap.appendChild(h("div", { class: "card wizard-card" }, [
      h("div", { class: "wizard-answer" }, [ questionRow(q, dRes, { verbose: true, hideStatus: true, hideGuidance: true }), wizardGapRemediation(q, renderWizardPage) ].filter(Boolean)),
      wizardContextPanel(q, dRes)
    ]));

    // --- Sticky footer nav: list view + prev / report / next ---
    var prev = h("button", { class: "btn", onClick: function () { if (!atStart) { wizardIdx -= 1; renderWizardPage(); } }, text: "‹ Previous" });
    if (atStart) prev.setAttribute("disabled", "");
    var next = h("button", { class: "btn primary", onClick: function () { if (!atEnd) { wizardIdx += 1; renderWizardPage(); } }, text: "Next ›" });
    if (atEnd) next.setAttribute("disabled", "");
    wrap.appendChild(h("div", { class: "wizard-footbar" }, [
      h("button", { class: "btn", onClick: function () { go("interview"); }, text: "Switch to list view" }),
      h("span", { class: "wizard-footmeta", text: cap(domain.id) + " · " + domain.name }),
      h("div", { class: "spacer" }, []),
      prev,
      h("button", { class: "btn", onClick: function () { go("report"); }, text: "Jump to report" }),
      next
    ]));

    refs.main.appendChild(wrap);
  }

  // Per-question and per-domain collapse state for the list view. Manual only -
  // nothing auto-collapses. "Collapse answered" / "Expand all" act in bulk.
  var collapsedQ = {};
  var collapsedDomains = {};

  function collapseAnswered() {
    var sc = E.scoreActiveTarget();
    sc.perDomain.forEach(function (dr) {
      (dr.questions || []).forEach(function (x) {
        if (x.state && x.state !== "unanswered") collapsedQ[x.questionId] = true;
      });
    });
    rerenderCapture();
  }
  function expandAll() { collapsedQ = {}; collapsedDomains = {}; rerenderCapture(); }

  // Quality bucket for a scored question's answer-state edge / pill.
  function scoreBucket(score) { return score >= 0.7 ? "met" : (score >= 0.4 ? "near" : "gap"); }

  // Resolve a question's answer state into a class + summary the card can use.
  function questionStateInfo(q, dRes) {
    if (!q.scored) return { key: "context", edge: "state-context", answered: false };
    var sq = (dRes.questions || []).filter(function (x) { return x.questionId === q.id; })[0];
    if (!sq || sq.state === "unanswered") return { key: "unanswered", edge: "", answered: false };
    if (sq.state === "na")      return { key: "na", edge: "state-na", answered: true, sq: sq };
    if (sq.state === "unknown") return { key: "unknown", edge: "state-unknown", answered: true, sq: sq };
    var bucket = scoreBucket(sq.score);
    return { key: "scored", edge: "state-" + bucket, bucket: bucket, answered: true, sq: sq };
  }

  function renderInterviewPage(domainFilterId) {
    refs.main.innerHTML = "";
    var label = E.state.instrument.targetDimensionLabel || "Organisation";
    var domains = E.getDomains();
    var domain = domainFilterId ? domains.filter(function (d) { return d.id === domainFilterId; })[0] : null;
    refs.main.appendChild(h("h1", { class: "page-title", text: domain ? (cap(domain.id) + " - " + domain.name) : "Interview" }));
    refs.main.appendChild(h("p", { class: "page-sub", text: (domain ? "Domain capture - " : "All domains in one flow - ") + label + ": " + (E.getActiveTarget() ? E.getActiveTarget().name : "-") }));
    refs.main.appendChild(buildSitesToolbar());

    var scored = E.scoreActiveTarget();
    refs.main.appendChild(postureRunningBanner(scored));

    var rendered = domain ? [domain] : domains;

    // Collapse controls (only meaningful across multiple questions).
    refs.main.appendChild(h("div", { class: "interview-toolbar" }, [
      h("div", { class: "spacer" }, []),
      h("button", { class: "btn", onClick: collapseAnswered, text: "Collapse answered" }),
      h("button", { class: "btn", onClick: expandAll, text: "Expand all" })
    ]));

    rendered.forEach(function (d) {
      var dRes = scored.perDomain.filter(function (x) { return x.domainId === d.id; })[0];
      refs.main.appendChild(domainBlock(d, dRes));
    });
  }

  function formatWeakestAreas(weakestDomains) {
    if (!weakestDomains || weakestDomains.length === 0) return { label: "Weakest area", value: "-" };
    if (weakestDomains.length === 1) {
      var d = weakestDomains[0];
      return { label: "Weakest area", value: d.name + " (" + d.grade + ")" };
    }
    var names = weakestDomains.map(function (d) { return d.name; });
    return { label: "Weakest areas", value: names.join(", ") + " (all " + weakestDomains[0].grade + ")" };
  }

  function postureRunningBanner(scored) {
    var DL = window.App.ScoringDomainLetter;
    var profile = E.state.profile;
    var thr = Math.round((profile.coverageThreshold || 0.6) * 100);
    var headlineVal = h("div", { class: "val " + gradeLetterClass(scored.headlineGrade) }, [scored.headlineGrade || "-"]);
    if (scored.headlineGrade && scored.lowConfidence) headlineVal.appendChild(provisionalMarker({ large: true }));
    var hconf = scored.headlineGrade ? confidenceTag(scored.overallConfidenceLevel) : null;
    if (hconf) headlineVal.appendChild(hconf);
    var weak = formatWeakestAreas(scored.weakestDomains);
    return h("div", { class: "card" }, [
      h("div", { class: "card-b" }, [
        h("div", { class: "kpi-row" }, [
          h("div", { class: "kpi" }, [
            h("div", { class: "lbl", text: scored.capApplied ? ("Headline grade (capped from " + scored.headlineMeanGrade + ")") : "Headline grade" }),
            headlineVal
          ]),
          h("div", { class: "kpi" }, [
            h("div", { class: "lbl", text: weak.label }),
            h("div", { class: "val", style: "font-size:15px; line-height:1.2;", text: weak.value })
          ]),
          h("div", { class: "kpi" }, [
            h("div", { class: "lbl", text: "Coverage" }),
            h("div", { class: "val", text: DL.formatPct(scored.overallCoverage) + " (threshold " + thr + "%)" })
          ]),
          h("div", { class: "kpi" }, [
            h("div", { class: "lbl", text: "Answered / scorable" }),
            h("div", { class: "val", text: scored.totalAnswered + " / " + scored.totalScorable })
          ])
        ]),
        priorityInlineStrip(scored)
      ])
    ]);
  }

  function priorityInlineStrip(scored) {
    var DL = window.App.ScoringDomainLetter;
    var po = scored.priorityOrder || DL.priorityOrder(scored.perDomain);
    var graded = po.graded || [];
    if (graded.length === 0) return null;
    var bar = h("div", { class: "priority-inline" }, [
      h("span", { class: "priority-inline-label", text: "Priority" })
    ]);
    graded.forEach(function (d, i) {
      bar.appendChild(h("span", { class: "priority-chip" }, [
        h("span", { class: "muted", text: (i + 1) + "." }),
        document.createTextNode(d.name),
        h("span", { class: "pill " + gradeLetterClass(d.grade), text: d.grade })
      ]));
    });
    return bar;
  }

  function domainBlock(domain, dRes) {
    var DL = window.App.ScoringDomainLetter;
    var questions = E.getQuestionsByDomain(domain.id);
    var collapsed = collapsedDomains[domain.id] === true;

    // Per-domain progress: answered scorable questions / scorable questions.
    var qStates = {};
    (dRes.questions || []).forEach(function (x) { qStates[x.questionId] = x.state; });
    var scoredQs = questions.filter(function (q) { return q.scored; });
    var answered = scoredQs.filter(function (q) {
      var s = qStates[q.id]; return s && s !== "unanswered";
    }).length;
    var totalScorable = scoredQs.length;
    var pct = totalScorable > 0 ? Math.round((answered / totalScorable) * 100) : 0;

    var meta = h("div", { class: "domain-sec-meta" }, [
      h("span", { class: "domain-sec-count", text: answered + " of " + totalScorable + " answered" }),
      h("div", { class: "domain-sec-bar" }, [ h("span", { style: "width:" + pct + "%;" }, []) ])
    ]);
    if (dRes.grade) {
      meta.appendChild(h("span", { class: "pill " + gradeLetterClass(dRes.grade), text: dRes.grade }));
      if (dRes.lowCoverage) meta.appendChild(provisionalMarker());
      var dconf = confidenceTag(dRes.confidenceLevel);
      if (dconf) meta.appendChild(dconf);
    } else {
      meta.appendChild(h("span", { class: "pill neutral", text: "Not yet graded" }));
    }
    if (dRes.unknownCount > 0) {
      meta.insertBefore(h("span", { class: "domain-sec-count", text: dRes.unknownCount + " unknown" }), meta.firstChild);
    }

    var head = h("div", {
      class: "domain-sec-head",
      onClick: function () { collapsedDomains[domain.id] = !collapsed; rerenderCapture(); }
    }, [
      h("button", { class: "domain-sec-chev", "aria-label": "Toggle domain", text: "▾" }),
      h("span", { class: "domain-sec-title", text: domain.name }),
      h("span", { class: "domain-sec-code", text: cap(domain.id) }),
      meta
    ]);

    var body = h("div", { class: "domain-sec-body" }, questions.map(function (q) {
      return questionRow(q, dRes, { listMerged: true });
    }));

    return h("div", { class: "domain-sec" + (collapsed ? " collapsed" : "") }, [head, body]);
  }

  function postureBandLabel(value, instrument) {
    var scale = (instrument.responseModel && instrument.responseModel.bandScale) || [];
    for (var i = 0; i < scale.length; i++) if (scale[i].value === value) return scale[i].label;
    return String(value);
  }

  // A "Why this matters" guidance block (best-practice interpretation), shown on
  // capture pages that carry an item.rationale. Returns null when absent.
  // "Why this matters" is reference, not an input. Shown as a tinted block on
  // every requirement it pushed the answer controls down the page and made a
  // long capture list feel heavy, so it is a disclosure now: one quiet line,
  // opened when the consultant wants it. Keyed by its own text, so the open
  // state survives the re-render every click triggers.
  var whyOpen = {};
  function whyKey(text) { return String(text).slice(0, 80); }
  function whyIsOpen(text) { return !!text && whyOpen[whyKey(text)] === true; }
  function whyToggle(text, onChange) {
    if (!text) return null;
    var open = whyIsOpen(text);
    return h("button", {
      type: "button",
      class: "why-toggle" + (open ? " open" : ""),
      onClick: function () { whyOpen[whyKey(text)] = !open; (onChange || render)(); },
      text: "Why this matters"
    });
  }
  function whyPanel(text) {
    if (!text || !whyIsOpen(text)) return null;
    return h("div", { class: "nis2-guidance", style: "margin-top:6px;" }, [
      h("div", { class: "wiz-ctx-block" }, [ h("div", { class: "wiz-ctx-text", text: text }) ])
    ]);
  }
  // Toggle and panel together, for the families whose capture card stacks them.
  function whyThisMattersBlock(text) {
    if (!text) return null;
    return h("div", { class: "why-wrap" }, [ whyToggle(text), whyPanel(text) ]);
  }

  // Posture capture guidance: why this matters / what good looks like /
  // guidance / maps-to, mirroring the wizard context column so the list capture
  // view is not starved of guidance. Returns null when the question has none.
  var postureGuidanceOpen = {};
  function buildPostureGuidancePanel(q) {
    function block(label, text) {
      return h("div", { class: "wiz-ctx-block" }, [
        h("div", { class: "wiz-ctx-label", text: label }),
        h("div", { class: "wiz-ctx-text", text: text })
      ]);
    }
    var kids = [];
    if (q.rationale) kids.push(block("Why this matters", q.rationale));
    var good = q.goodLooksLike || topBandAnchor(q);
    if (good) kids.push(block("What good looks like", good));
    if (q.guidance) kids.push(block("Guidance", q.guidance));
    if (q.references && q.references.length) kids.push(block("Maps to", q.references.join(", ")));
    if (!kids.length) return null;
    return h("div", { class: "nis2-guidance" }, kids);
  }

  function questionRow(q, dRes, opts) {
    opts = opts || {};
    var verbose = !!opts.verbose;
    var resp = E.findResponse(E.state.activeTargetId, q.id) || { applicable: true, band: null, unknown: false, capture: {}, notes: "" };
    var inst = E.state.instrument;
    var bandScale = (inst.responseModel && inst.responseModel.bandScale) || [];

    var headerBits = [
      h("span", { class: "req-code", text: cap(q.id) }),
      h("span", { class: "req-title", text: q.prompt })
    ];
    if (!q.scored)    headerBits.push(h("span", { class: "pill neutral", text: "Context only" }));

    var stateBits = [];
    if (q.scored) {
      var scoredQ = (dRes.questions || []).filter(function (x) { return x.questionId === q.id; })[0];
      if (!scoredQ || scoredQ.state === "unanswered") stateBits.push(h("span", { class: "pill neutral", text: "Not yet answered" }));
      else if (scoredQ.state === "na")      stateBits.push(window.App.Report.bandPill("na"));
      else if (scoredQ.state === "unknown") stateBits.push(h("span", { class: "pill neutral", text: "Unknown (reduces coverage)" }));
      else if (scoredQ.state === "scored")  stateBits.push(h("span", { class: "pill " + (scoredQ.score >= 0.7 ? "met" : (scoredQ.score >= 0.4 ? "near" : "gap")), text: "Band " + scoredQ.band + " - " + scoredQ.bandLabel }));
    }

    function setBand(v)   { E.setResponse(E.state.activeTargetId, q.id, { applicable: true, unknown: false, band: v }); rerenderCapture(); }
    function setUnknown() { E.setResponse(E.state.activeTargetId, q.id, { applicable: true, unknown: true, band: null }); rerenderCapture(); }
    function setNA()      { E.setResponse(E.state.activeTargetId, q.id, { applicable: false, unknown: false, band: null }); rerenderCapture(); }
    function clearAnswer(){ E.setResponse(E.state.activeTargetId, q.id, { applicable: true, unknown: false, band: null }); rerenderCapture(); }

    // N/A is a state of the whole question (not a band): a header toggle in the
    // verbose view. When on, the question is excluded from score and coverage.
    var naToggle = null;
    if (verbose && q.scored && q.allowNA !== false) {
      var naOn = resp.applicable === false;
      naToggle = h("button", {
        class: "na-toggle" + (naOn ? " active" : ""),
        title: naOn ? "This requirement is marked not applicable" : "Mark this requirement not applicable",
        onClick: function () { if (naOn) clearAnswer(); else setNA(); },
        text: naOn ? "N/A ✓" : "Mark N/A"
      });
    }

    // Band control. Two presentations:
    //  - compact (list view): a row of "n - label" buttons plus a separate
    //    read-only anchor grid for the descriptions.
    //  - verbose (wizard): a single clickable list where each option carries
    //    the band number, its label and its full anchor description - no
    //    duplicate compact row, fewer nested boxes.
    var bandControl = null;
    if (q.scored && verbose) {
      // Unknown sits at the TOP of the list, above band 0 (Not in place).
      var unknownChoice = h("button", {
        class: "band-choice band-choice-unknown" + (resp.applicable !== false && resp.unknown === true ? " active" : ""),
        onClick: setUnknown
      }, [
        h("span", { class: "band-choice-num", text: "?" }),
        h("span", { class: "band-choice-body" }, [
          h("span", { class: "band-choice-label", text: "Unknown" }),
          h("span", { class: "band-choice-anchor", text: "Not established: reduces coverage and confidence, and is not scored." })
        ])
      ]);
      var bandBtns = bandScale.map(function (b) {
        var active = resp.applicable !== false && resp.unknown !== true && resp.band === b.value;
        var bodyKids = [h("span", { class: "band-choice-label", text: b.value + " - " + b.label })];
        var anchorTxt = q.bandAnchors && q.bandAnchors[String(b.value)];
        if (anchorTxt) bodyKids.push(h("span", { class: "band-choice-anchor", text: anchorTxt }));
        return h("button", {
          class: "band-choice" + (active ? " active" : ""),
          onClick: function () { setBand(b.value); }
        }, [
          h("span", { class: "band-choice-num", text: String(b.value) }),
          h("span", { class: "band-choice-body" }, bodyKids)
        ]);
      });
      var choices = h("div", { class: "band-choices" + (resp.applicable === false ? " is-na" : "") }, [unknownChoice].concat(bandBtns));
      bandControl = h("div", { class: "band-verbose" }, [choices]);
    } else if (q.scored) {
      var bandRow = h("div", { class: "sl-row" }, []);
      bandScale.forEach(function (b) {
        bandRow.appendChild(h("button", {
          class: "sl-btn" + (resp.applicable !== false && resp.unknown !== true && resp.band === b.value ? " active" : ""),
          onClick: function () { setBand(b.value); },
          title: (q.bandAnchors && q.bandAnchors[String(b.value)]) || "",
          text: b.value + " - " + b.label
        }));
      });
      bandRow.appendChild(h("button", { class: "sl-btn special" + (resp.unknown === true ? " active" : ""), onClick: setUnknown, text: "Unknown" }));
      if (q.allowNA !== false) {
        bandRow.appendChild(h("button", { class: "sl-btn na" + (resp.applicable === false ? " active" : ""), onClick: setNA, text: "N/A" }));
      }
      var anchorsBlock = null;
      if (q.bandAnchors) {
        anchorsBlock = h("div", { class: "anchors" }, bandScale.map(function (b) {
          return h("div", { class: "anchor" + (resp.band === b.value && resp.applicable !== false && !resp.unknown ? " active" : "") }, [
            h("span", { class: "anchor-num", text: String(b.value) }),
            h("span", { class: "anchor-txt", text: q.bandAnchors[String(b.value)] || "" })
          ]);
        }));
      }
      bandControl = h("div", { class: "field" }, [ h("label", { text: "Band" }), bandRow, anchorsBlock ]);
    }

    var captureFields = (q.capture || []).map(function (f) { return captureFieldNode(q, f, resp); });

    // ---- List view (design B): merged selector + collapsible card ----------
    if (opts.listMerged) {
      var info = questionStateInfo(q, dRes);
      var isCollapsed = collapsedQ[q.id] === true;
      var chev = h("button", {
        class: "q-chev", "aria-label": "Toggle question",
        onClick: function (e) { e.stopPropagation(); collapsedQ[q.id] = !isCollapsed; rerenderCapture(); },
        text: "\u25be"
      });

      // The first text capture field (falling back to resp.notes) is the note snippet.
      var noteTxt = "";
      (q.capture || []).forEach(function (f) {
        if (f.type === "text" && !noteTxt) {
          var v = resp.capture && resp.capture[f.id];
          if (v) noteTxt = String(v);
        }
      });
      if (!noteTxt && resp.notes) noteTxt = String(resp.notes);

      if (isCollapsed) {
        var sumPill = stateBits.length ? stateBits[0]
          : h("span", { class: "pill neutral", text: q.scored ? "Not yet answered" : "Context only" });
        var sumKids = [
          h("span", { class: "req-code", text: cap(q.id) }),
          h("span", { class: "q-summary-title", text: q.prompt }),
          sumPill
        ];
        if (noteTxt) sumKids.push(h("span", { class: "q-summary-note", text: noteTxt }));
        sumKids.push(chev);
        return h("div", { class: "q-card collapsed " + info.edge, "data-req-id": q.id }, [
          h("div", { class: "q-summary", onClick: function () { collapsedQ[q.id] = false; rerenderCapture(); } }, sumKids)
        ]);
      }

      // Not-scored cluster (Unknown / N/A) lives in the header, out of the band grid.
      var notScored = null;
      if (q.scored) {
        var unkBtn = h("button", {
          class: "mini-btn unknown" + (resp.applicable !== false && resp.unknown === true ? " active" : ""),
          onClick: function () { if (resp.unknown === true) clearAnswer(); else setUnknown(); },
          text: "Unknown"
        });
        var clusterKids = [h("span", { class: "q-notscore-lbl", text: "Not scored:" }), unkBtn];
        if (q.allowNA !== false) {
          clusterKids.push(h("button", {
            class: "mini-btn na" + (resp.applicable === false ? " active" : ""),
            onClick: function () { if (resp.applicable === false) clearAnswer(); else setNA(); },
            text: "N/A"
          }));
        }
        notScored = h("div", { class: "q-notscore" }, clusterKids);
      }

      var metaKids = [];
      if (stateBits.length) metaKids.push(stateBits[0]);
      if (notScored) metaKids.push(notScored);
      metaKids.push(chev);

      var lmHead = h("div", { class: "q-head" }, [
        h("div", { class: "q-head-main" }, [
          h("span", { class: "req-code", text: cap(q.id) }),
          h("span", { class: "req-title", text: q.prompt }),
          (!q.scored ? h("span", { class: "pill neutral", text: "Context only" }) : null)
        ]),
        h("div", { class: "q-head-meta" }, metaKids)
      ]);

      var grid = null;
      if (q.scored) {
        var cells = bandScale.map(function (b) {
          var active = resp.applicable !== false && resp.unknown !== true && resp.band === b.value;
          var cellKids = [h("div", { class: "band-cell-top" }, [
            h("span", { class: "band-cell-num", text: String(b.value) }),
            h("span", { class: "band-cell-label", text: b.label })
          ])];
          var anchorTxt = q.bandAnchors && q.bandAnchors[String(b.value)];
          if (anchorTxt) cellKids.push(h("div", { class: "band-cell-anchor", text: anchorTxt }));
          return h("button", {
            class: "band-cell" + (active ? " active" : ""),
            onClick: function () { setBand(b.value); }
          }, cellKids);
        });
        grid = h("div", { class: "band-grid" + (resp.applicable === false ? " is-na" : "") }, cells);
      }

      var capKids = (q.capture || []).map(function (f) {
        var node = captureFieldNode(q, f, resp);
        if (f.type === "text") node.classList.add("notes");
        return node;
      });
      var lmKids = [lmHead];
      if (grid) lmKids.push(grid);
      if (capKids.length) lmKids.push(h("div", { class: "q-capture" }, capKids));
      var lmGuide = buildPostureGuidancePanel(q);
      if (lmGuide) lmKids.push(lmGuide);
      else if (q.guidance) lmKids.push(h("div", { class: "hint", text: q.guidance }));
      if (q.scored) lmKids.push(remediationBlock(q.id, rerenderCapture));
      return h("div", { class: "q-card " + info.edge, "data-req-id": q.id }, lmKids);
    }

    // Non-wizard capture: a "Guidance" expander so the dense list isn't starved
    // of the why/what-good-looks-like/maps-to context the wizard column shows.
    var pgPanel = (!verbose && !opts.hideGuidance) ? buildPostureGuidancePanel(q) : null;
    var pgOpen = postureGuidanceOpen[q.id] === true;
    var pgToggle = pgPanel ? h("button", {
      type: "button", style: "margin-top:8px;",
      class: "sl-guidance-toggle" + (pgOpen ? " open" : ""),
      onClick: function () { postureGuidanceOpen[q.id] = !pgOpen; rerenderCapture(); },
      text: "Guidance"
    }) : null;

    return h("div", { class: "req posture-q" + (verbose ? " posture-q-verbose" : ""), "data-req-id": q.id }, [
      h("div", { class: "req-h" }, [
        h("div", null, headerBits),
        h("div", { class: "req-meta" }, (function () {
          var sb = opts.hideStatus ? [] : stateBits;
          return naToggle ? sb.concat([naToggle]) : sb;
        })())
      ]),
      pgToggle,
      (pgOpen ? pgPanel : null),
      bandControl,
      captureFields.length ? h("div", { class: "capture-block" }, captureFields) : null,
      // In the wizard the context column carries guidance; show the inline hint
      // there, and in the non-wizard view only when there is no expander.
      ((verbose || !pgPanel) && !opts.hideGuidance && q.guidance) ? h("div", { class: "hint", text: q.guidance }) : null,
      // The wizard's caller appends its own recommendation editor after this
      // row, so adding one here too would show it twice on that page.
      (!verbose && q.scored) ? remediationBlock(q.id, rerenderCapture) : null
    ]);
  }

  function captureFieldNode(q, field, resp) {
    var current = (resp.capture && resp.capture[field.id] !== undefined) ? resp.capture[field.id] : null;
    var save = function (v) { E.setCaptureField(E.state.activeTargetId, q.id, field.id, v); };

    if (field.type === "text") {
      var ta = h("textarea", { onChange: function (e) { save(e.target.value); } });
      ta.value = current || "";
      return h("div", { class: "field" }, [h("label", { text: field.label || "Notes" }), ta]);
    }
    if (field.type === "boolean") {
      var yes = h("button", {
        class: "sl-btn" + (current === true ? " active" : ""),
        onClick: function () { save(current === true ? null : true); rerenderCapture(); },
        text: "Yes"
      });
      var no = h("button", {
        class: "sl-btn" + (current === false ? " active" : ""),
        onClick: function () { save(current === false ? null : false); rerenderCapture(); },
        text: "No"
      });
      return h("div", { class: "field" }, [
        h("label", { text: field.label || field.id }),
        h("div", { class: "sl-row" }, [yes, no])
      ]);
    }
    if (field.type === "choice") {
      var row = h("div", { class: "sl-row wrap" }, (field.options || []).map(function (opt) {
        return h("button", {
          class: "sl-btn" + (current === opt ? " active" : ""),
          onClick: function () { save(current === opt ? null : opt); rerenderCapture(); },
          text: opt
        });
      }));
      return h("div", { class: "field" }, [h("label", { text: field.label || field.id }), row]);
    }
    if (field.type === "checklist") {
      var selected = Array.isArray(current) ? current : [];
      var row2 = h("div", { class: "sl-row wrap" }, (field.options || []).map(function (opt) {
        var on = selected.indexOf(opt) !== -1;
        return h("button", {
          class: "sl-btn" + (on ? " active" : ""),
          onClick: function () {
            var next = on ? selected.filter(function (x) { return x !== opt; }) : selected.concat([opt]);
            save(next); rerenderCapture();
          },
          text: opt
        });
      }));
      return h("div", { class: "field" }, [h("label", { text: field.label || field.id }), row2]);
    }
    return null;
  }

  // ---- ready to issue ---------------------------------------------------
  //
  // Consultants make every change in the tool, not in Word afterwards, and the
  // client's PDF is made from the final Word file. So the report page says what
  // is still to do before a final:
  //   blockers  anything the Word report would print in red, read from the
  //             Word build itself (ExportDOCX.issueCheck) over exactly the
  //             documents the export would write (docxJobs), so the list and
  //             the document cannot disagree. Any blocker keeps Final shut.
  //   warnings  blank document control, items not yet answered, 62443 Security
  //             Levels not assessed or entries still To assess. Worth a look,
  //             but a final can go out with them.
  // Every line takes the consultant to the field that settles it.

  var issueCheckState = { timer: null, seq: 0, last: null, lastFor: null, more: {} };

  // The Word documents an export of these targets would build, as
  // { engagement, opts, name, targetId } jobs: one place for the export and
  // the check, so the check reads exactly the documents that would be written.
  function docxJobs(ids, shape) {
    var targets = E.state.engagement.targets.filter(function (t) { return ids.indexOf(t.id) !== -1; });
    if (!targets.length) return [];
    if (shape === "org") {
      var oOpts = baseExportOpts();
      oOpts.orgWide = true;
      // Sites are assessments, so the roll-up spans this customer file's
      // sibling assessments of this instrument, not the targets ticked above.
      oOpts.siteEntries = siteRollUpEntries();
      oOpts.filenameHint = exportFileBase("organisation-wide");
      return [{ engagement: E.state.engagement, opts: oOpts, name: null, targetId: null }];
    }
    if (exportCoversWholeEngagement("docx")) {
      var opts = baseExportOpts();
      var pt = progressTargetOf(targets);
      opts.targetId = pt.id;
      var pw = progressExportPayload(pt.id);
      if (pw) opts.progress = pw;
      return [{ engagement: filteredEngagementFor(ids), opts: opts, name: null, targetId: null }];
    }
    return targets.map(function (t) {
      var o = baseExportOpts();
      o.targetId = t.id;
      o.filenameHint = exportFileBase(t.name);
      if (carriesProgress(t)) o.progress = progressExportPayload(t.id);
      return { engagement: E.state.engagement, opts: o, name: t.name, targetId: t.id };
    });
  }

  // Which documents carry "Progress since previous assessment". Never the
  // target selected on screen: the same content must build the same documents,
  // whichever site or zone happens to be open (a review approval is checked
  // against them). A target the baseline names, by a pinned mapping or by its
  // own name, is compared; with one target, it always is; and when the
  // baseline names none of several, the first is, as the comparison itself
  // falls back to the baseline's first target.
  function baselineNames(t) {
    var b = E.getBaseline();
    if (!b || !t) return false;
    var bts = b.targets || [];
    var pin = b.targetMap && b.targetMap[t.id];
    if (pin && bts.some(function (x) { return x.id === pin; })) return true;
    var name = String(t.name || "").trim().toLowerCase();
    return bts.some(function (x) { return String(x.name || "").trim().toLowerCase() === name; });
  }
  function carriesProgress(t) {
    if (!E.getBaseline()) return false;
    var all = E.state.engagement.targets || [];
    if (all.length <= 1 || baselineNames(t)) return true;
    return !all.some(baselineNames) && !!all[0] && all[0].id === t.id;
  }
  // A whole-engagement document has one progress section: the first target in
  // scope that the baseline names, else the first in scope.
  function progressTargetOf(targets) {
    return targets.filter(baselineNames)[0] || targets[0];
  }

  // Runs the Word check over a list of jobs, one after another. cb(err, list)
  // with every prompt that would print, each carrying the target it is on.
  function runIssueChecks(jobs, cb) {
    var X = window.App.ExportDOCX;
    if (!X || !X.issueCheck || !window.docx) { cb(new Error("The Word exporter is not loaded.")); return; }
    var inst = E.state.instrument, tax = E.state.taxonomy, prof = E.state.profile, nar = E.getActiveNarrative();
    var out = [], i = 0;
    (function next() {
      if (i >= jobs.length) { cb(null, out); return; }
      var job = jobs[i++];
      try {
        X.issueCheck(job.engagement, inst, tax, prof, nar, job.opts, function (err, res) {
          if (err) { cb(err); return; }
          res.placeholders.forEach(function (p) {
            var w = p.where || { kind: "unknown" };
            var tid = w.targetId || job.targetId || job.opts.targetId || null;
            out.push({ text: p.text, where: w, targetId: tid });
          });
          next();
        });
      } catch (e) { cb(e); }
    })();
  }

  function issueAllIds() {
    return ((E.state.engagement && E.state.engagement.targets) || []).map(function (t) { return t.id; });
  }

  function targetNameOf(id) {
    if (id === E.SHARED_TARGET_ID) return E.sharedScopeLabelLong ? E.sharedScopeLabelLong() : "Shared answers";
    var t = ((E.state.engagement && E.state.engagement.targets) || []).filter(function (x) { return x.id === id; })[0];
    return t ? t.name : "";
  }

  // Labels for the consultant-input fields, as each family's card names them.
  function narrativeFieldLabel(field) {
    var fam = E.state.scoringFamily;
    if (field === "method") return "Method (how the assessment was run)";
    if (field === "regulatoryExposure") {
      if (fam === "risk-appetite-coherence") return "Context for the board";
      if (isCRA()) return "Regulatory and commercial exposure";
      if (fam === "nis2-conformance") return "Regulatory exposure note";
      return "Exposure note";
    }
    if (field === "topPriorities") {
      if (fam === "risk-appetite-coherence") return "The decision for the board";
      if (isCRA()) return "Top priorities and sequencing";
      return "Top priorities";
    }
    return field;
  }

  function itemLabel(itemId) {
    var e = instrumentSearchIndex().filter(function (x) { return x.id === itemId; })[0];
    if (e) return e.code + " " + e.label;
    var cat = instrumentItems(E.state.instrument).filter(function (x) { return x.id === itemId; })[0];
    return cat ? ((cat.code || cat.id) + " " + (cat.title || cat.name || cat.prompt || "")) : String(itemId);
  }

  // Blocker entries, grouped into one line per thing to fix.
  function issueBlockerLines(list) {
    var multi = issueAllIds().length > 1;
    var lines = [], byKey = {};
    list.forEach(function (p) {
      var w = p.where, key;
      if (w.kind === "item") key = "item|" + p.targetId + "|" + w.itemId;
      else if (w.kind === "narrative") key = "narrative|" + w.field;
      else if (w.kind === "unknown") key = "unknown|" + p.text;
      else key = w.kind;
      var line = byKey[key];
      if (!line) { line = byKey[key] = { key: key, where: w, targetId: p.targetId, count: 0, fields: [], texts: [] }; lines.push(line); }
      line.count++;
      line.texts.push(p.text);
      if (w.field && line.fields.indexOf(w.field) === -1) line.fields.push(w.field);
    });
    return lines.map(function (l) {
      var w = l.where, text, label = "Go to", go;
      if (w.kind === "narrative") {
        text = narrativeFieldLabel(w.field) + ": still to be written.";
        label = "Write it";
        go = function () { revealOnReport('[data-check-anchor="narrative-' + w.field + '"]'); };
      } else if (w.kind === "nextSteps") {
        // Cleared outright, the section is one standing prompt; otherwise each
        // red line is a [bracketed] prompt left in the suggested steps.
        var cleared = !String(E.getReportNarrative().nextSteps == null ? "x" : E.getReportNarrative().nextSteps).trim();
        text = cleared ? "Proposed next steps: still to be written."
          : "Proposed next steps: " + l.count + " line" + (l.count === 1 ? "" : "s") + " in [square brackets] still to replace.";
        label = "Edit";
        go = openNextStepsEditor;
      } else if (w.kind === "item") {
        var what = l.fields.map(function (f) { return f === "impact" ? "business impact" : (f === "action" ? "recommended action" : f); });
        var where = (multi && l.targetId) ? " (" + targetNameOf(l.targetId) + ")" : "";
        text = itemLabel(w.itemId) + where + ": " + (what.length ? cap(joinAnd(what)) : "plan") + " still to be written.";
        label = "Open";
        go = function () { openPlanFor(w.itemId, l.targetId); };
      } else if (w.kind === "basis") {
        text = "Basis of assessment: no interviews, documents or systems recorded yet.";
        go = function () { go2("engagement", null, '[data-check-anchor="basis"]'); };
      } else if (w.kind === "raVerdict") {
        text = "Your verdict: the reasoning behind the verdict you set is not recorded.";
        go = function () { go2("ra-verdict", null, '[data-check-anchor="ra-rationale"]'); };
      } else if (w.kind === "incomplete") {
        text = "The assessment is not finished, so the executive summary is still a prompt.";
        go = function () { goFirstUnanswered(E.state.activeTargetId); };
      } else {
        text = "Still to be written: " + l.texts[0];
        go = null;
      }
      return { cls: "block", text: text, label: label, go: go };
    });
  }

  function joinAnd(parts) {
    if (parts.length < 2) return parts.join("");
    return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
  }

  // Not answered at all: Unknown and N/A are answers, so they do not count.
  function responseIsTouched(r) {
    if (!r) return false;
    if (responseIsAnswered(r)) return true;
    return r.unknown === true || r.applicable === false || r.state === "unknown" || r.state === "na" || !!r.ml;
  }

  // Items with no answer on a target, in capture order, limited to what the
  // assessment covers (a CAF-family profile leaves some outcomes out; the CRA
  // index already holds only the layers in scope).
  function unansweredOn(targetId, scored) {
    var outOfProfile = {};
    ((scored && scored.perOutcome) || []).forEach(function (o) { if (o.profileApplicable === false) outOfProfile[o.outcomeId] = true; });
    var byId = {};
    (E.state.engagement.responses || []).forEach(function (r) { if (r.targetId === targetId) byId[r.requirementId] = r; });
    var index = instrumentSearchIndex();
    return {
      total: index.filter(function (e) { return !outOfProfile[e.id]; }).length,
      items: index.filter(function (e) { return !outOfProfile[e.id] && !responseIsTouched(byId[e.id]); })
    };
  }

  function issueWarnings() {
    var out = [];
    var e = (E.state.engagement && E.state.engagement.engagement) || {};
    var DC = [["clientName", "client name"], ["consultant", "consultant"], ["documentRevision", "revision"],
      ["issuedDate", "issued date"], ["qaReviewBy", "QA review by"], ["authorisedBy", "authorised by"], ["issuedTo", "issued to"]];
    var blank = DC.filter(function (d) { return !String(e[d[0]] || "").trim(); });
    if (blank.length) {
      out.push({ cls: "warn", text: "Document control: " + joinAnd(blank.map(function (d) { return d[1]; })) + " not filled in.",
        label: "Fill in", go: function () { openEngagementModal({ focus: blank[0][0] }); } });
    }
    var fam = E.state.scoringFamily;
    var all = E.scoreAllTargets() || {};
    var multi = issueAllIds().length > 1;
    (all.perTarget || []).forEach(function (pt) {
      var tid = pt.target.id, r = pt.result || {};
      var pre = multi ? pt.target.name + ": " : "";
      if (fam === "capability-sl") {
        var na = r.notAssessedFRs || [];
        if (na.length) {
          out.push({ cls: "warn", text: pre + (na.length === 1 ? na[0].frId + " is" : joinAnd(na.map(function (f) { return f.frId; })) + " are") + " not assessed yet.",
            label: "Go to", go: function () { setTargetThen(tid, function () { go("fr", na[0].frId); }); } });
        }
        var toAssess = (r.roadmap || []).filter(function (it) { return it.toAssess; });
        if (toAssess.length) {
          out.push({ cls: "warn", text: pre + toAssess.length + " roadmap entr" + (toAssess.length === 1 ? "y is" : "ies are") + " still To assess.",
            label: "Go to first", go: function () { jumpToItem(tid, toAssess[0].requirementId); } });
        }
        return;
      }
      if (fam === "risk-appetite-coherence") return;   // its incomplete prompt says so
      var un = unansweredOn(tid, r);
      if (un.items.length) {
        out.push({ cls: "warn", text: pre + un.items.length + " of " + un.total + " items not answered yet.",
          label: "Go to first", go: function () { jumpToItem(tid, un.items[0].id); } });
      }
    });
    // Warnings only: a review never keeps Final shut (js/review.js).
    if (window.App.Review) out = out.concat(window.App.Review.issueWarnings());
    return out;
  }

  // ---- getting the consultant to the field ----

  function setTargetThen(tid, fn) {
    if (tid && tid !== E.state.activeTargetId && (E.state.engagement.targets || []).some(function (t) { return t.id === tid; })) {
      E.setActiveTarget(tid);
    }
    fn();
  }
  function jumpToItem(tid, itemId) {
    setTargetThen(tid, function () {
      var entry = instrumentSearchIndex().filter(function (x) { return x.id === itemId; })[0];
      if (entry) jumpToRequirement(entry);
    });
  }
  function goFirstUnanswered(tid) {
    if (E.state.scoringFamily === "risk-appetite-coherence") {
      var inst = E.state.instrument, setup = E.getRiskAppetiteSetup ? E.getRiskAppetiteSetup() : {};
      var byId = {};
      (E.state.engagement.responses || []).forEach(function (r) { if (r.targetId === E.state.activeTargetId) byId[r.requirementId] = r; });
      var item = (inst.items || inst.questions || []).filter(function (it) {
        var sec = (inst.sections || []).filter(function (s) { return s.id === it.sectionId; })[0];
        if (sec && sec.optional && !(setup && setup.includeTech)) return false;
        return !responseIsTouched(byId[it.id]);
      })[0];
      if (item && item.sectionId) { pendingJumpId = item.id; go("ra-section", item.sectionId); }
      else go("ra-setup");
      return;
    }
    var un = unansweredOn(tid, null);
    if (un.items.length) jumpToItem(tid, un.items[0].id);
  }
  // Show a node on the page just rendered: scroll to it, pulse it, and put
  // the cursor in its box when it has one.
  function revealNode(el) {
    if (!el) return false;
    for (var p = el.parentNode; p; p = p.parentNode) { if (p.tagName === "DETAILS" && !p.open) p.open = true; }
    if (el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("check-flash");
    void el.offsetWidth;
    el.classList.add("check-flash");
    window.setTimeout(function () { el.classList.remove("check-flash"); }, 2200);
    var box = el.matches && el.matches("textarea, input, select") ? el : el.querySelector("textarea, input, select");
    if (box && box.focus) { try { box.focus({ preventScroll: true }); } catch (x) { box.focus(); } }
    return true;
  }
  function go2(v, param, selector) {
    go(v, param);
    revealNode(refs.main.querySelector(selector));
  }
  function revealOnReport(selector) {
    if (view !== "report") go("report");
    revealNode(refs.main.querySelector(selector));
  }
  function openNextStepsEditor() {
    if (view !== "report") go("report");
    var card = refs.main.querySelector("[data-next-steps]");
    var key = card && card.getAttribute("data-section");
    if (key && openSection !== key) { openSection = key; renderReportPage(); }
    revealNode(refs.main.querySelector("[data-next-steps]"));
  }
  function openPlanFor(itemId, tid) {
    if (tid === E.SHARED_TARGET_ID) {
      if (view !== "report") go("report");
      openRemediationModal(itemId, {
        targetId: E.SHARED_TARGET_ID,
        title: "Action across " + window.App.Report.pluralLower(E.state.instrument.targetDimensionLabel || "zone", E.state.instrument),
        note: "Written once on the shared layer, so it reaches every " +
          String(E.state.instrument.targetDimensionLabel || "zone").toLowerCase() + " that inherits this answer." });
      return;
    }
    setTargetThen(tid, function () {
      if (view !== "report") go("report");
      openRemediationModal(itemId, tid ? { targetId: tid } : {});
    });
  }

  // ---- the card ----

  function buildIssueCheckCard() {
    var card = h("div", { class: "card issue-check", "data-check-anchor": "issue-check" });
    var cached = issueCheckState.lastFor === E.state.engagement ? issueCheckState.last : null;
    paintIssueCheck(card, cached);
    scheduleIssueCheck(card);
    return card;
  }

  function scheduleIssueCheck(card) {
    if (issueCheckState.timer) window.clearTimeout(issueCheckState.timer);
    var seq = ++issueCheckState.seq;
    var eng = E.state.engagement;
    issueCheckState.timer = window.setTimeout(function () {
      issueCheckState.timer = null;
      if (seq !== issueCheckState.seq || !E.state.instrument) return;
      runIssueChecks(docxJobs(issueAllIds(), "per"), function (err, list) {
        if (seq !== issueCheckState.seq) return;
        var res = err ? { error: err } : { list: list };
        issueCheckState.last = res; issueCheckState.lastFor = eng;
        if (card.parentNode) paintIssueCheck(card, res);
      });
    }, 250);
  }

  // The check for the active assessment, as last computed: null while none
  // has finished.
  function lastIssueCheck() {
    return issueCheckState.lastFor === E.state.engagement ? issueCheckState.last : null;
  }

  function paintIssueCheck(card, res) {
    card.innerHTML = "";
    var blockers = (res && res.list) ? issueBlockerLines(res.list) : [];
    var warnings = issueWarnings();
    var state = res && res.error ? "error" : (!res ? "checking" : (blockers.length ? "blocked" : "ready"));
    var pill = state === "checking" ? h("span", { class: "issue-pill", text: "Checking…" })
      : state === "error" ? h("span", { class: "issue-pill", text: "Not checked" })
      : state === "blocked" ? h("span", { class: "issue-pill blocked", text: blockers.length + " still to write" })
      : h("span", { class: "issue-pill ready", text: "Ready to issue" });
    card.appendChild(h("div", { class: "card-h" }, [h("h2", { text: "Issue check" }), pill]));
    var b = h("div", { class: "card-b" });
    if (state === "blocked") {
      b.appendChild(h("p", { class: "issue-lead", text: "These would print in red in the Word report, so it cannot go out as final yet. Write them here, not in Word." }));
      b.appendChild(issueList("block", blockers));
    } else if (state === "ready") {
      b.appendChild(h("p", { class: "issue-lead", text: "Nothing in the Word report is left to write: it can be issued as final." }));
    } else if (state === "error") {
      b.appendChild(h("p", { class: "issue-lead muted", text: "The Word report could not be checked (" + (res.error.message || res.error) + ")." }));
    } else {
      b.appendChild(h("p", { class: "issue-lead muted", text: "Checking the Word report for anything still to write…" }));
    }
    if (warnings.length) {
      b.appendChild(h("h3", { text: "Worth a look first" }));
      b.appendChild(issueList("warn", warnings));
    }
    card.appendChild(b);
  }

  function issueList(kind, lines) {
    var LIMIT = 6, open = !!issueCheckState.more[kind];
    var ul = h("ul", { class: "issue-list" });
    lines.forEach(function (l, i) {
      if (!open && i >= LIMIT) return;
      ul.appendChild(h("li", { class: "issue-line " + l.cls }, [
        h("span", { class: "issue-text", text: l.text }),
        l.go ? h("button", { type: "button", class: "issue-go", text: l.label, onClick: l.go }) : null
      ]));
    });
    if (lines.length <= LIMIT) return ul;
    return h("div", null, [ul, h("button", { type: "button", class: "issue-more",
      text: open ? "Show fewer" : "Show " + (lines.length - LIMIT) + " more",
      onClick: function () {
        issueCheckState.more[kind] = !open;
        var card = refs.main.querySelector(".issue-check");
        if (card) paintIssueCheck(card, lastIssueCheck());
      } })]);
  }

  // The report's sections are cards keyed by Report.sectionKey; a review
  // comment goes to the card for its section. A section that only the Word
  // document has (the document control page, for one) has no card to go to:
  // js/review.js looks for the place it is edited first, and passes quiet so
  // the miss is its to explain.
  function goToReportSection(key, anchor, quiet) {
    if (view !== "report") go("report");
    var card = key ? refs.main.querySelector('[data-section="' + String(key).replace(/"/g, '\\"') + '"]') : null;
    if (card) { revealNode(card); return true; }
    if (!quiet) toast("That part is only in the Word report, so the report page has no card for it.", "warn");
    return false;
  }
  // The report page's section keys, rendering the page first if need be.
  function reportSectionKeys() {
    if (view !== "report") go("report");
    return [].slice.call(refs.main.querySelectorAll("[data-section]")).map(function (c) { return c.getAttribute("data-section"); });
  }

  // ---- report preview ---------------------------------------------------

  // ---- Word preview ------------------------------------------------------
  // The Word report as the Export button makes it, drawn page by page. The
  // same documents docxJobs describes are built with the exporter, in memory,
  // read back with the shared Word reader (App.DocxImport) and drawn by the
  // shared renderer (App.DocPreview), so what is shown is the file itself and
  // cannot disagree with it. Built when the page is opened, kept until the
  // assessment, the choices here or the report's wording change.
  var wordPreview = { key: null, read: null, error: null, seq: 0, docIndex: 0, status: null, shape: "per", busy: false };

  function wordPreviewJobs(shape) {
    return docxJobs(issueAllIds(), shape === "org" ? "org" : "per");
  }
  function wordPreviewCanOrg() {
    return E.state.scoringFamily !== "capability-sl" && !isCRA() &&
      !!(window.App.Compare && window.App.Compare.rollUpSites) && siteRollUpEntries().length >= 2;
  }
  // What the built file depends on: the assessment, the export's options and
  // the choices on this page. A change to any of them builds it again.
  function wordPreviewKey(job, status) {
    var o = {};
    Object.keys(job.opts || {}).forEach(function (k) { if (typeof job.opts[k] !== "function") o[k] = job.opts[k]; });
    try {
      return JSON.stringify([E.state.instrument && E.state.instrument.id, status, o, job.engagement,
        E.getActiveNarrative ? E.getActiveNarrative() : null]);
    } catch (e) { return String(Date.now()); }
  }

  function renderWordPreviewPage() {
    var DP = window.App.DocPreview, X = window.App.ExportDOCX;
    refs.main.innerHTML = "";
    refs.main.appendChild(h("h1", { class: "page-title", text: "Word preview" }));
    refs.main.appendChild(h("p", { class: "page-sub", text: "The Word report as Export Word makes it, page by page. Word decides where the pages break. To change the report, edit it on the Preview page." }));
    if (!DP || !X || !window.App.DocxImport) {
      refs.main.appendChild(h("p", { class: "muted", text: "The Word preview is not available in this copy of the tool." }));
      return;
    }
    var noNarrativeFamilies = ["program-maturity-ml", "nis2-conformance", "csms-conformance", "risk-appetite-coherence"];
    if (!E.getActiveNarrative() && noNarrativeFamilies.indexOf(E.state.scoringFamily) === -1) {
      refs.main.appendChild(h("p", { class: "muted", text: "No narrative pack is loaded for this instrument, so there is no Word report to show." }));
      return;
    }
    var canOrg = wordPreviewCanOrg();
    if (wordPreview.shape === "org" && !canOrg) wordPreview.shape = "per";
    var jobs = wordPreviewJobs(wordPreview.shape);
    if (!jobs.length) { refs.main.appendChild(h("p", { class: "muted", text: "There is nothing to report on yet." })); return; }
    if (wordPreview.docIndex >= jobs.length) wordPreview.docIndex = 0;
    // Draft or Final as last chosen at export, unless chosen here.
    if (!wordPreview.status) wordPreview.status = E.getReportNarrative().issueAs === "final" ? "final" : "draft";

    // The choices that change the file: which document, and draft or final.
    var bar = h("div", { class: "wp-bar", id: "wp-bar" });
    var docOptions = jobs.map(function (j, i) {
      return { value: "per:" + i, text: j.name || "The report" };
    });
    if (wordPreview.shape === "org") docOptions = [{ value: "org:0", text: "Organisation-wide report" }];
    if (canOrg && wordPreview.shape === "per") docOptions.push({ value: "org:0", text: "Organisation-wide report" });
    if (canOrg && wordPreview.shape === "org") {
      docOptions = wordPreviewJobs("per").map(function (j, i) { return { value: "per:" + i, text: j.name || "The report" }; }).concat(docOptions);
    }
    if (docOptions.length > 1) {
      var sel = h("select", { id: "wp-doc", "aria-label": "Which Word document" });
      docOptions.forEach(function (o) {
        var opt = h("option", { value: o.value, text: o.text });
        if (o.value === wordPreview.shape + ":" + wordPreview.docIndex) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", function () {
        var v = sel.value.split(":");
        wordPreview.shape = v[0]; wordPreview.docIndex = Number(v[1]) || 0;
        renderWordPreviewPage();
      });
      bar.appendChild(h("label", { class: "wp-field", for: "wp-doc" }, ["Document", sel]));
    }
    var seg = h("div", { class: "wp-seg", role: "radiogroup", "aria-label": "Draft or final" });
    [["draft", "Draft"], ["final", "Final"]].forEach(function (o) {
      var b = h("button", { type: "button", class: "btn small" + (wordPreview.status === o[0] ? " primary" : ""), role: "radio",
        "aria-checked": wordPreview.status === o[0] ? "true" : "false", "data-status": o[0], text: o[1] });
      b.addEventListener("click", function () {
        if (wordPreview.status === o[0]) return;
        wordPreview.status = o[0];
        renderWordPreviewPage();
      });
      seg.appendChild(b);
    });
    bar.appendChild(seg);
    var refresh = h("button", { type: "button", class: "btn small", id: "wp-refresh", text: "Build again" });
    refresh.addEventListener("click", function () { wordPreview.key = null; renderWordPreviewPage(); });
    bar.appendChild(refresh);
    refs.main.appendChild(bar);

    var job = jobs[wordPreview.docIndex];
    var opts = Object.assign({}, job.opts, { issueStatus: wordPreview.status });
    delete opts.onDone;
    var state = h("div", { class: "wp-state", id: "wp-state", role: "status", "aria-live": "polite" });
    var meter = h("progress", { class: "wp-progress", id: "wp-progress", max: "100", value: "0" });
    var stateText = h("span", { class: "muted", id: "wp-state-text" });
    state.appendChild(stateText); state.appendChild(meter);
    refs.main.appendChild(state);
    var note = h("p", { class: "muted wp-note", id: "wp-note" });
    refs.main.appendChild(note);
    var paper = h("div", { class: "wp-paper", id: "wp-paper" });
    refs.main.appendChild(paper);

    function say(text, fraction) {
      stateText.textContent = text;
      if (fraction == null) meter.classList.add("hidden");
      else { meter.classList.remove("hidden"); meter.value = Math.round(Math.max(0, Math.min(1, fraction)) * 100); }
    }
    function show(read) {
      say("", null);
      state.classList.add("hidden");
      var name = X.docxFilename(job.engagement, opts);
      note.textContent = "This is " + name + (read.cover ? "" : ", drawn without its cover") + ". It is read from the file itself, so a change on the Preview page shows here the next time this page is opened.";
      DP.drawRead(paper, read, { watermark: wordPreview.status === "final" ? "" : "DRAFT", fit: true });
    }
    var key = wordPreviewKey(job, wordPreview.status);
    if (wordPreview.key === key && wordPreview.read) { show(wordPreview.read); return; }
    if (wordPreview.key === key && wordPreview.error) { say(wordPreview.error, null); return; }

    var seq = ++wordPreview.seq;
    say("Building the Word report…", 0.05);
    // A moment for the page to show the message before the build takes the thread.
    window.setTimeout(function () {
      if (seq !== wordPreview.seq) return;
      X.buildAsync(job.engagement, E.state.instrument, E.state.taxonomy, E.state.profile, E.getActiveNarrative(), opts, function (err, blob) {
        if (seq !== wordPreview.seq) return;
        if (err) {
          var why = wordPreview.status === "final"
            ? "Final is not available. " + (err.message || "The report could not be built.") + " Choose Draft to see the report."
            : "The Word report could not be built: " + (err.message || "something went wrong.");
          wordPreview.key = key; wordPreview.error = why; wordPreview.read = null;
          if (stateText.isConnected) say(why, null);
          return;
        }
        if (stateText.isConnected) say("Reading the pages…", 0.3);
        DP.fromDocx(blob, { name: X.docxFilename(job.engagement, opts), onProgress: function (f) {
          if (seq === wordPreview.seq && stateText.isConnected) say("Reading the pages…", 0.3 + 0.65 * (f || 0));
        } }).then(function (read) {
          if (seq !== wordPreview.seq) { DP.dispose(read); return; }
          if (wordPreview.read && wordPreview.read !== read) DP.dispose(wordPreview.read);
          wordPreview.key = key; wordPreview.read = read; wordPreview.error = null;
          if (stateText.isConnected) { say("Drawing the pages…", 0.97); window.setTimeout(function () { if (seq === wordPreview.seq && paper.isConnected) show(read); }, 0); }
        }, function (e) {
          if (seq !== wordPreview.seq) return;
          wordPreview.key = key; wordPreview.error = "The Word report could not be read back: " + ((e && e.message) || "something went wrong."); wordPreview.read = null;
          if (stateText.isConnected) say(wordPreview.error, null);
        });
      });
    }, 30);
  }

  function renderReportPage() {
    refs.main.innerHTML = "";
    refs.main.appendChild(h("h1", { class: "page-title", text: "Report preview" }));
    refs.main.appendChild(h("p", { class: "page-sub", text: "The same figures as the Excel and Word exports. Download those with the export buttons in the header." }));
    refs.main.appendChild(buildSitesToolbar());

    // Scored up front: the next-steps scaffolding is built from the roadmap and
    // the weakest area, so it has to exist before the capture card is made.
    var scoredAll = E.scoreAllTargets();
    var scored = E.scoreActiveTarget();

    // What still has to be done before a final can go out. First on the page,
    // because it is the to-do list for everything below it.
    refs.main.appendChild(buildIssueCheckCard());
    // The review, beside the check it feeds. Not a report section: it has no
    // key, and neither the report renderers nor the exporters ever see it.
    if (window.App.Review) refs.main.appendChild(window.App.Review.buildCard());

    if (E.state.scoringFamily === "nis2-conformance") refs.main.appendChild(buildNIS2NarrativeCard());
    if (isCRA()) refs.main.appendChild(buildCRANarrativeCard());
    if (E.state.scoringFamily === "risk-appetite-coherence") refs.main.appendChild(buildRiskAppetiteNarrativeCard());
    if (E.state.scoringFamily === "domain-letter") refs.main.appendChild(buildPostureReportOptionsCard());
    if (["capability-sl", "domain-letter", "caf-achieved", "program-maturity-ml"].indexOf(E.state.scoringFamily) !== -1 ||
        (E.state.scoringFamily === "csms-conformance" && !isCRA())) {
      var consultantInput = buildConsultantInputCard();
      if (consultantInput) refs.main.appendChild(consultantInput);
    }
    // The proposed next steps are written where they are read: the report's own
    // closing section is editable in place like any other, so there is no
    // capture copy of it at the top of the page.
    var basisPreview = buildBasisPreviewCard();
    if (basisPreview) refs.main.appendChild(basisPreview);
    var xTargets = crossTargetSummaryCard();
    if (xTargets) refs.main.appendChild(xTargets);
    var orgRoll = orgRollUpCard();
    if (orgRoll) refs.main.appendChild(orgRoll);

    var container = h("div", null, []);
    refs.main.appendChild(container);

    var reportOpts = {
      engagement: E.state.engagement,
      instrument: E.state.instrument,
      taxonomy: E.state.taxonomy,
      profile: E.state.profile,
      narrative: E.getActiveNarrative(),
      scored: scored,
      scoredAll: scoredAll,
      activeTarget: E.getActiveTarget(),
      targetProfile: E.state.engagement.targetProfile,
      // Lets the capability-SL report say whether a programme assessment
      // (62443-2-1) backs these technical figures or not.
      companionInstrumentIds: E.answeredInstrumentIds(),
      // Risk appetite: the previous visit, for the arrow on the chart and the
      // closer-or-further line in the verdict. Null with no baseline.
      riskAppetiteProgress: E.state.scoringFamily === "risk-appetite-coherence" ? progressExportPayload() : null
    };
    if (E.state.scoringFamily === "caf-achieved") {
      reportOpts.cafProfileRegistry = E.getCAFProfileRegistry();
      reportOpts.cafProfileId = E.getActiveCAFProfileId();
      reportOpts.cafProfile = E.getActiveCAFProfile();
    }
    if (["nis2-conformance", "caf-achieved", "program-maturity-ml", "capability-sl", "domain-letter", "csms-conformance"].indexOf(E.state.scoringFamily) !== -1) {
      reportOpts.planning = {
        editRow: openRemediationModal,
        reorder: reorderRoadmap,
        // Advice on something that already meets its target is a recommendation,
        // not a remediation - same editor, honest heading.
        editFurther: function (id) {
          openRemediationModal(id, { title: "Recommendation",
            note: "This requirement already meets its target. The advice is recorded as a recommendation and is not counted as outstanding work." });
        },
        // A cross-zone action is written once on the shared layer, which is what
        // makes it one piece of work rather than one per zone.
        editShared: function (id) {
          openRemediationModal(id, {
            targetId: E.SHARED_TARGET_ID,
            title: "Action across " + window.App.Report.pluralLower(
              E.state.instrument.targetDimensionLabel || "zone", E.state.instrument),
            note: "Written once on the shared layer, so it reaches every " +
              String(E.state.instrument.targetDimensionLabel || "zone").toLowerCase() +
              " that inherits this answer." });
        }
      };
    }
    window.App.Report.render(container, reportOpts);
    decorateCustomiseControls(container);
    var wordOnly = buildWordOnlyChangesCard();
    if (wordOnly) {
      var after = refs.main.querySelector('[data-check-anchor="review"]') || refs.main.querySelector(".issue-check");
      if (after) after.parentNode.insertBefore(wordOnly, after.nextSibling); else refs.main.insertBefore(wordOnly, container);
    }
    // After the word-only list is placed, so it sits between the Review card
    // and that list.
    placeRewordedCard();

    // Re-assessment comparison. With a baseline loaded this is a real finding
    // and shows what has moved; with none it is a prompt to load a file, which
    // has no business being the first thing above the headline. Either way it
    // now follows the results.
    refs.main.appendChild(buildComparisonCard());
  }

  // Word report options for the posture and supplier screeners. Each question
  // carries its own description of good practice; printing it under every
  // roadmap item tells the reader what the target looks like for that point,
  // at the cost of some length, so it is the consultant's choice (on unless
  // switched off).
  function buildPostureReportOptionsCard() {
    var rn = E.getReportNarrative();
    var cb = h("input", { type: "checkbox" });
    cb.checked = rn.includeGoodPractice !== false;
    cb.addEventListener("change", function () { E.setReportNarrative({ includeGoodPractice: cb.checked }); markDirty(); });
    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Word report options" })]),
      h("div", { class: "card-b" }, [
        h("label", { class: "check-row" }, [cb, h("span", null, [
          h("strong", { text: "Show what good looks like for each roadmap item" }),
          h("span", { class: "muted small", text: "  The question's own description of good practice, under each improvement in the Word roadmap. Adds some length; untick to leave it out." })
        ])])
      ])
    ]);
  }

  // The two executive-summary paragraphs only the consultant can write for a
  // risk appetite report. The rest of the summary is composed from the verdict
  // and the narrative pack; these are the consultant's own words, and anything
  // left blank prints red in the Word document. Stored in the same fields the
  // other families use, so they save, load and export with no special case.
  function buildRiskAppetiteNarrativeCard() {
    var rn = E.getReportNarrative();

    var ctxTa = h("textarea", { rows: "4", placeholder: "What this means for this organisation in particular: the services and people that depend on it, the regulatory or commercial pressures on it, and anything that sets it apart from others in its sector. Leave blank to keep the placeholder in the Word report." });
    ctxTa.value = rn.regulatoryExposure || "";
    ctxTa.addEventListener("change", function () { E.setReportNarrative({ regulatoryExposure: ctxTa.value }); });

    var decTa = h("textarea", { rows: "3", placeholder: "The one or two decisions this board should take, in terms that fit the organisation. Leave blank to keep the placeholder in the Word report." });
    decTa.value = rn.topPriorities || "";
    decTa.addEventListener("change", function () { E.setReportNarrative({ topPriorities: decTa.value }); });

    // The verdict section's general paragraph (what under-protection, over-
    // investment or alignment tends to mean) reads the same for every client
    // with that verdict, so it is left out unless the consultant wants it.
    var ctxCb = h("input", { type: "checkbox" });
    ctxCb.checked = rn.includeVerdictContext === true;
    ctxCb.addEventListener("change", function () { E.setReportNarrative({ includeVerdictContext: ctxCb.checked }); markDirty(); });

    return h("div", { class: "card", "data-check-anchor": "consultant-input" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Executive summary: consultant input" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text: "The Word executive summary is written from the verdict and the two positions. These two paragraphs are yours; anything left blank shows in the export as a placeholder to complete." }),
        h("div", { class: "field", "data-check-anchor": "narrative-regulatoryExposure" }, [h("label", { text: "Context for the board" }), ctxTa]),
        h("div", { class: "field", "data-check-anchor": "narrative-topPriorities" }, [h("label", { text: "The decision for the board" }), decTa]),
        methodField(),
        h("label", { class: "check-row" }, [ctxCb, h("span", null, [
          h("strong", { text: "Include the general paragraph on this verdict" }),
          h("span", { class: "muted small", text: "  In the Word verdict section: what this kind of verdict usually means in practice. The same for every client with this verdict, so it is off unless you want it." })
        ])])
      ])
    ]);
  }

  // Editable executive-summary inputs for the layered conformance reports
  // (EU CRA, EU Machinery Regulation). Everything else in those Word reports
  // is composed automatically from the captured scores, classification,
  // evidence and remediation; these two paragraphs are the consultant's own
  // words, and anything left blank stays a red placeholder in the export.
  // Saved on change so focus is never lost.
  function buildCRANarrativeCard() {
    var rn = E.getReportNarrative();
    var d = craDisplay();

    var priTa = h("textarea", { rows: "3", placeholder: "Sequencing: what must close first (e.g. the notified-body route), what gates CE marking for which " + d.noun + ", and what can run in parallel. Leave blank to keep the placeholder in the Word report." });
    priTa.value = rn.topPriorities || "";
    priTa.addEventListener("change", function () { E.setReportNarrative({ topPriorities: priTa.value }); });

    var expoTa = h("textarea", { rows: "3", placeholder: "Commercial exposure: which " + d.noun + " sales and markets depend on CE marking under this regulation, and what non-conformity would mean for them. Leave blank to keep the placeholder in the Word report." });
    expoTa.value = rn.regulatoryExposure || "";
    expoTa.addEventListener("change", function () { E.setReportNarrative({ regulatoryExposure: expoTa.value }); });

    return h("div", { class: "card", "data-check-anchor": "consultant-input" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Executive summary: consultant input" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text: "The Word executive summary is composed automatically from the scores, classification, gaps and remediation plans. These two paragraphs are the consultant's own words; anything left blank shows in the export as a placeholder to complete." }),
        h("div", { class: "field", "data-check-anchor": "narrative-topPriorities" }, [h("label", { text: "Top priorities / sequencing" }), priTa]),
        h("div", { class: "field", "data-check-anchor": "narrative-regulatoryExposure" }, [h("label", { text: "Regulatory & commercial exposure" }), expoTa])
      ])
    ]);
  }

  // The pack's own prompt, turned into a hint for the box that answers it:
  // "[Consultant to add a short note on ...]" reads "Add a short note on ...".
  function promptHint(prompt) {
    var s = String(prompt || "").replace(/^\[\s*/, "").replace(/\s*\]$/, "").replace(/^Consultant to\s+/i, "");
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  }

  // How the assessment was run. Several packs describe it in standing wording
  // that ends with a [prompt] to confirm or adjust it, which prints red in the
  // Word report until it is answered. The consultant writes their own
  // description here, or takes the standing one as it is. Null when the pack
  // asks nothing.
  function methodField() {
    var nar = E.getActiveNarrative();
    var std = String((nar && nar.boilerplate && nar.boilerplate.method) || "");
    var cut = std.indexOf("[");
    if (cut < 0) return null;
    var R = window.App.Report;
    if (R && R.personaliseNarrative) {
      var personal = R.personaliseNarrative(nar, E.state.engagement, E.state.instrument, E.getActiveTarget());
      std = String((personal.boilerplate || {}).method || std);
      cut = std.indexOf("[");
    }
    var standard = std.slice(0, cut).trim();
    // Risk appetite describes the technical review too, where it was part of
    // the engagement, exactly as the report does.
    var techLine = nar && nar.boilerplate && nar.boilerplate.method_technical;
    if (techLine && E.state.scoringFamily === "risk-appetite-coherence" && E.getRiskAppetiteSetup && E.getRiskAppetiteSetup().includeTech) {
      standard += " " + techLine;
    }
    var rn = E.getReportNarrative();
    var ta = h("textarea", { rows: "3", placeholder: promptHint(std.slice(cut)) + " Leave blank to keep the prompt in the Word report." });
    ta.value = rn.method || "";
    ta.addEventListener("change", function () { E.setReportNarrative({ method: ta.value }); markDirty(); });
    var kids = [h("label", { text: "How the assessment was run (Method)" }), ta];
    if (standard && !String(rn.method || "").trim()) {
      kids.push(h("button", { class: "sl-btn", style: "margin-top:6px;", text: "Use the standard description",
        title: standard,
        onClick: function () { E.setReportNarrative({ method: standard }); markDirty(); } }));
    }
    return h("div", { class: "field", "data-check-anchor": "narrative-method" }, kids);
  }

  // The same consultant input for the families whose summary carries the
  // pack's exposure and priorities prompts but had nowhere to answer them in
  // the tool (62443-3-3 and -4-2, the posture and supplier screeners, the CAF
  // family, 2-1:2024 and 4-1, 2-1:2010). Null when the pack asks for nothing.
  function buildConsultantInputCard() {
    var nar = E.getActiveNarrative();
    var CB = (nar && nar.executiveSummary && nar.executiveSummary.consultantBlocks) || {};
    var rn = E.getReportNarrative();
    var kids = [];
    function box(field, label, prompt, rows) {
      var ta = h("textarea", { rows: String(rows), placeholder: promptHint(prompt) + " Leave blank to keep the prompt in the Word report." });
      ta.value = rn[field] || "";
      ta.addEventListener("change", function () { var p = {}; p[field] = ta.value; E.setReportNarrative(p); markDirty(); });
      kids.push(h("div", { class: "field", "data-check-anchor": "narrative-" + field }, [h("label", { text: label }), ta]));
    }
    if (CB.consultant_exposure) box("regulatoryExposure", "Exposure note", CB.consultant_exposure, 3);
    if (CB.consultant_top_priorities_placeholder) box("topPriorities", "Top priorities", CB.consultant_top_priorities_placeholder, 3);
    var mf = methodField();
    if (mf) kids.push(mf);
    if (!kids.length) return null;
    return h("div", { class: "card", "data-check-anchor": "consultant-input" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Executive summary: consultant input" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text: "The rest of the Word report is composed from the assessment. These are the consultant's own words; anything left blank prints in red in the export for you to complete." })
      ].concat(kids))
    ]);
  }

  // Editable executive-summary inputs for the NIS2 report. These fill the
  // consultant-completed parts of the Word executive summary (regulatory
  // exposure and top priorities); anything left blank stays a placeholder in
  // the export. Saved on change so focus is never lost.
  // ---- customise the report ---------------------------------------------
  //
  // The report is generated, but the consultant is the one signing it. Every
  // section can be renamed, hidden, have its opening prose replaced, carry a
  // note, or - where it is a ranked list - be reordered. Overrides live on the
  // assessment (E.setReportSection) and apply to the screen preview and the
  // Word document alike; see Report.sectionKey for how the two are matched.
  var openSection = null;      // which section is being edited, if any

  // Adds the per-card controls. Runs after Report.render, over the cards it
  // tagged with data-section, so no renderer needs to know this exists. The
  // Edit button is always there - there is no mode to be in and out of.
  function decorateCustomiseControls(container) {
    // Every card Report.decorateSections keyed, wherever it sits - the standing
    // prose is nested inside a collapsed stack.
    [].slice.call(container.querySelectorAll(".card")).forEach(function (card) {
      var key = card.getAttribute && card.getAttribute("data-section");
      if (!key) return;
      var head = null, cardBody = null;
      [].slice.call(card.children).forEach(function (ch) {
        if (ch.classList && ch.classList.contains("card-h")) head = ch;
        if (ch.classList && ch.classList.contains("card-b")) cardBody = ch;
      });
      if (!head) return;
      var editing = openSection === key;
      var changed = Object.keys(E.getReportSection(key)).length > 0 ||
        (!!card.getAttribute("data-next-steps") && E.getReportNarrative().nextSteps != null);
      head.appendChild(h("button", {
        class: "sect-edit" + (changed ? " changed" : "") + (editing ? " open" : ""),
        text: editing ? "Done" : (changed ? "Edited" : "Edit"),
        title: "Rename, rewrite, reorder or hide this section",
        onClick: function () { openSection = editing ? null : key; renderReportPage(); }
      }));
      if (editing) {
        // A section being edited is never left inside a closed stack.
        for (var p = card.parentNode; p && p !== container; p = p.parentNode) {
          if (p.tagName === "DETAILS" && !p.open) p.open = true;
        }
        editSection(key, card, head, cardBody);
      }
    });
  }

  // A section override whose section has no card on this page (an Accept from
  // a review can put one on the document control page, say) would otherwise be
  // invisible and could never be undone. They are listed together, each with
  // what changed and the way back. Runs after the cards are drawn.
  function buildWordOnlyChangesCard() {
    var custom = E.getReportCustom ? E.getReportCustom() : {};
    var onPage = {};
    [].slice.call(refs.main.querySelectorAll("[data-section]")).forEach(function (c) { onPage[c.getAttribute("data-section")] = true; });
    var keys = Object.keys(custom).filter(function (k) {
      var c = custom[k];
      return !onPage[k] && c && typeof c === "object" && (c.title || c.prose || c.hidden || (c.order && c.order.length) || paraCount(c));
    });
    function paraCount(c) { return window.App.ReportSections.paragraphsOf(c).length; }
    if (!keys.length) return null;
    // The Word heading, from the last read of the documents when there is one.
    var docs = window.App.Review && window.App.Review.cachedDocs ? window.App.Review.cachedDocs() : null;
    function titleOf(k) {
      var t = null;
      (docs || []).forEach(function (d) { (d.probe || []).forEach(function (p) { if (!t && p.key === k && p.title) t = p.title; }); });
      if (t) return t;
      var s = k.replace(/-/g, " ");
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    var rows = keys.map(function (k) {
      var c = custom[k], what = [];
      if (c.title) what.push("renamed to \"" + c.title + "\"");
      if (c.prose) what.push("opening rewritten");
      if (c.hidden) what.push("hidden");
      if (c.order && c.order.length) what.push("reordered");
      // Each is set out, with whether it applies, in the list of reworded
      // paragraphs above this one.
      if (paraCount(c)) what.push(paraCount(c) === 1 ? "1 paragraph reworded" : paraCount(c) + " paragraphs reworded");
      var kids = [
        h("div", { class: "wo-head" }, [
          h("strong", { text: titleOf(k) }),
          h("span", { class: "muted", text: ": " + what.join(", ") + "." })
        ])
      ];
      if (c.prose) kids.push(h("p", { class: "wo-prose muted", text: String(c.prose) }));
      kids.push(h("button", { type: "button", class: "inherited-edit wo-back", text: "Back to the generated version",
        onClick: function () { E.clearReportSection(k); renderReportPage(); } }));
      return h("li", { class: "wo-row", "data-word-only": k }, kids);
    });
    return h("div", { class: "card word-only-changes", "data-check-anchor": "word-only" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Changes to sections only in the Word report" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "issue-lead", text: "These sections print in the Word report but have no card on this page, so their changes are listed here. A rewritten opening is fixed text: any figures in it no longer update." }),
        h("ul", { class: "wo-list" }, rows)
      ])
    ]);
  }

  // Paragraphs reworded by an accepted review suggestion (a section's
  // `paragraphs`, see js/review.js). Each replaces one generated paragraph,
  // found by its text, so when the assessment changes that text the
  // replacement stops applying and the generated paragraph prints. Nothing
  // is lost, but the author has to be told, or a report goes out without a
  // rewording they believe is in it. So every one is listed: its section,
  // the words before and after, whether it is in the report now, and the way
  // back. Null when there are none.
  function buildRewordedCard() {
    var RV = window.App.Review;
    var rows = RV && RV.paragraphChanges ? RV.paragraphChanges() : [];
    if (!rows.length) return null;
    var RS = window.App.ReportSections;
    function clip(s) { s = String(s).replace(/\s+/g, " ").trim(); return s.length > 180 ? s.slice(0, 180) + "…" : s; }
    function titleOf(r) {
      if (r.title) return r.title;
      var card = refs.main.querySelector('[data-section="' + String(r.key).replace(/"/g, '\\"') + '"]');
      if (card) return card.getAttribute("data-section-title") || r.key;
      var s = r.key.replace(/-/g, " ");
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    // Does this page show the reworded paragraph, or only Word?
    function onScreen(r) {
      return [].slice.call(refs.main.querySelectorAll("[data-reworded]")).some(function (p) {
        return p.getAttribute("data-reworded") === r.from;
      });
    }
    var items = rows.map(function (r) {
      var note = RS.paragraphNote(r.state);
      var status = r.state === "checking" ? "Checking the Word report…"
        : note || (onScreen(r) ? "In the report." : "In the Word report. This page does not show that paragraph.");
      return h("li", { class: "wo-row", "data-reworded-row": r.key, "data-reworded-state": r.state }, [
        h("div", { class: "wo-head" }, [
          h("strong", { text: titleOf(r) }),
          h("span", { class: note ? "rw-lost" : "muted", text: ": " + status })
        ]),
        h("p", { class: "wo-prose muted", text: "Generated: " + clip(r.from) }),
        h("p", { class: "wo-prose", text: "Reworded: " + clip(r.to) }),
        h("button", { type: "button", class: "inherited-edit wo-back", text: "Back to the generated version",
          title: "Takes out this rewording. The paragraph is written from the assessment again",
          onClick: function () { RV.removeParagraph(r.key, r.from); renderReportPage(); } })
      ]);
    });
    return h("div", { class: "card reworded-changes", "data-check-anchor": "reworded" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Paragraphs reworded from review comments" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "issue-lead", text: "Accepting a reviewer's wording on a paragraph that opens a section replaces that paragraph only. The rest of the section is still written from the assessment. If the assessment changes the paragraph it replaced, the rewording stops applying and the generated text prints." }),
        h("ul", { class: "wo-list" }, items)
      ])
    ]);
  }
  // Puts the list on the page, or redraws it where it is (the Word report
  // has been read since, so each line can say whether it applies).
  function placeRewordedCard() {
    var old = refs.main.querySelector('[data-check-anchor="reworded"]');
    var card = view === "report" ? buildRewordedCard() : null;
    if (old) {
      if (card) old.parentNode.replaceChild(card, old); else old.parentNode.removeChild(old);
      return;
    }
    if (!card) return;
    var after = refs.main.querySelector('[data-check-anchor="review"]') || refs.main.querySelector(".issue-check");
    if (after) after.parentNode.insertBefore(card, after.nextSibling); else refs.main.appendChild(card);
  }

  // Editing happens IN the report, not beside it: the heading becomes a field
  // and the wording becomes a box holding those very sentences. Nothing is
  // duplicated, so there is no second copy to wonder about, and a consultant
  // can change a clause without retyping the paragraph.
  function editSection(key, card, head, cardBody) {
    var R = window.App.Report;
    var cur = E.getReportSection(key);
    var generatedTitle = card.getAttribute("data-section-title") || "";
    var generatedProse = card.getAttribute("data-generated-prose") || "";
    card.classList.add("editing");
    function save(patch) { E.setReportSection(key, patch); renderReportPage(); }

    // --- the heading itself ---
    var h2 = head.getElementsByTagName("h2")[0];
    if (h2) {
      var titleIn = h("input", { type: "text", class: "sect-title-input",
        "aria-label": "Section title", value: h2.textContent });
      titleIn.addEventListener("change", function () {
        var v = titleIn.value.trim();
        save({ title: (v === generatedTitle || v === "") ? null : v });
      });
      head.replaceChild(titleIn, h2);
    }

    // --- the wording that opens the section ---
    //
    // The proposed next steps are the one section whose wording lives on
    // reportNarrative (they are also the Word document's closing list), so the
    // box writes there instead of onto a section override. Everything else
    // about that card - rename, hide - works exactly as elsewhere.
    var isNextSteps = !!card.getAttribute("data-next-steps");
    var declared = cardBody && cardBody.querySelector("[data-prose-block]");
    var lead = declared ? [declared] : R.leadingProse(cardBody);
    if (cardBody && (lead.length || generatedProse)) {
      var proseTa = h("textarea", { class: "sect-prose-input",
        "aria-label": isNextSteps ? "Proposed next steps" : "Section wording",
        title: isNextSteps
          ? "One step per line, in the order you would do them."
          : "One paragraph per line. The tables and charts below are not affected." });
      // The box starts from the text as printed. With paragraphs reworded
      // from review comments, that is the generated wording with those put
      // in; saving a rewrite then makes it the whole opening, and the
      // paragraph replacements stay stored, listed as not applying.
      var printedProse = isNextSteps ? generatedProse
        : window.App.ReportSections.applyParagraphs(generatedProse.split("\n"), cur.paragraphs).join("\n");
      proseTa.value = isNextSteps ? generatedProse : (cur.prose || printedProse);
      proseTa.addEventListener("change", function () {
        var v = proseTa.value.trim();
        if (isNextSteps) { E.setReportNarrative({ nextSteps: proseTa.value }); renderReportPage(); return; }
        save({ prose: (v === printedProse.trim() || v === "") ? null : v });
      });
      proseTa.addEventListener("input", function () { autoGrow(proseTa); });
      cardBody.insertBefore(proseTa, lead[0] || cardBody.firstChild);
      lead.forEach(function (el) { cardBody.removeChild(el); });
      autoGrow(proseTa);
      if (isNextSteps) {
        cardBody.insertBefore(h("p", { class: "muted", style: "margin:0 0 8px; font-size:12.5px;", text:
          "One step per line, in the order you would do them. Lines in [square brackets] are prompts and print in red until you replace or delete them." }), proseTa);
      }
    }

    // --- ranked lists get their arrows on the rows themselves ---
    inlineReorder(key, card);

    // --- the glossary can take terms of the consultant's own ---
    if (card.getAttribute("data-terms")) inlineTerms(key, card, cardBody);

    // --- the two things that have nowhere to live in the text ---
    var actions = [h("button", {
      class: "sl-btn" + (cur.hidden ? " active" : ""),
      text: cur.hidden ? "Hidden (click to show)" : "Hide this section",
      onClick: function () { save({ hidden: !cur.hidden }); }
    })];
    var narrativeEdited = isNextSteps && E.getReportNarrative().nextSteps != null;
    if (Object.keys(cur).length || narrativeEdited) {
      actions.push(h("button", { class: "inherited-edit", text: "Back to the generated version",
        onClick: function () {
          if (isNextSteps) E.setReportNarrative({ nextSteps: null });
          E.clearReportSection(key);
          renderReportPage();
        } }));
    }
    if (cardBody) cardBody.appendChild(h("div", { class: "sect-actions" }, actions));
  }

  function autoGrow(ta) {
    ta.style.height = "auto";
    ta.style.height = (ta.scrollHeight + 2) + "px";
  }

  // The consultant's own glossary entries: site vocabulary, a client's name for
  // a system, an acronym that came up in the interviews. The framework's own
  // definitions are not editable - they are what the standard says - so only
  // the consultant's group is swapped for fields, in the place it renders.
  function inlineTerms(key, card, cardBody) {
    var terms = window.App.Report.consultantTerms(E.state.engagement).slice();
    var group = card.querySelector("[data-terms-group]");
    function commit(next) {
      E.setReportSection(key, { terms: next.filter(function (t) { return String(t.term || "").trim() !== ""; }) });
      renderReportPage();
    }

    var rows = terms.map(function (t, i) {
      var termIn = h("input", { type: "text", class: "term-name", value: t.term, "aria-label": "Term" });
      var defIn = h("textarea", { class: "term-def", rows: "2", "aria-label": "Definition" });
      defIn.value = t.definition || "";
      function save() {
        var next = terms.slice();
        next[i] = { term: termIn.value, definition: defIn.value };
        commit(next);
      }
      termIn.addEventListener("change", save);
      defIn.addEventListener("change", save);
      return h("div", { class: "term-row" }, [
        termIn, defIn,
        h("button", { class: "term-remove", text: "Remove", title: "Remove this term",
          onClick: function () { commit(terms.filter(function (_, j) { return j !== i; })); } })
      ]);
    });

    var editor = h("div", { class: "terms-editor" }, [
      h("h3", { text: "Other terms used in this report" }),
      h("p", { class: "muted", style: "margin:2px 0 8px;", text: terms.length
        ? "Your own terms. They print after the definitions above, in this order."
        : "Nothing added yet. Anything you add prints after the definitions above." })
    ].concat(rows).concat([
      h("button", { class: "sl-btn", text: "+ Add a term",
        onClick: function () { commit(terms.concat([{ term: "New term", definition: "" }])); } })
    ]));

    if (group) cardBody.replaceChild(editor, group);
    else cardBody.appendChild(editor);
  }

  // Ranked lists tag their rows with data-reorder-id, so one control serves the
  // 3-3 Foundational Requirement order, the posture domain order and anything
  // tagged the same way later.
  //
  // Drag and drop, exactly as the remediation roadmap does it - same gesture,
  // same .dragging / .drop-target classes - so there is one way to reorder a
  // list in this tool. The arrows stay alongside it: dragging is the only way
  // to reorder the roadmap, and a ranked list nobody can reorder from the
  // keyboard is a list some people cannot reorder at all.
  var sectionDrag = { id: null };
  function inlineReorder(key, card) {
    var list = card.querySelector("[data-reorder-list]");
    if (!list) return;
    var rows = [].slice.call(list.querySelectorAll("[data-reorder-id]"));
    if (rows.length < 2) return;
    var ids = rows.map(function (r) { return r.getAttribute("data-reorder-id"); });

    function commit(next) { E.setReportSection(key, { order: next }); renderReportPage(); }
    function move(i, delta) {
      var next = ids.slice(), j = i + delta;
      if (j < 0 || j >= next.length) return;
      var tmp = next[i]; next[i] = next[j]; next[j] = tmp;
      commit(next);
    }
    // Drop BEFORE the row landed on, which is what the roadmap does and what
    // the drop-target line drawn above the row promises.
    function dropOn(draggedId, targetId) {
      if (!draggedId || draggedId === targetId) return;
      var next = ids.filter(function (x) { return x !== draggedId; });
      next.splice(next.indexOf(targetId), 0, draggedId);
      commit(next);
    }
    function arrow(glyph, label, i, delta, off) {
      var b = h("button", { class: "reorder-btn", text: glyph, title: label,
        onClick: function (e) { e.stopPropagation(); move(i, delta); } });
      if (off) b.disabled = true;
      return b;
    }

    rows.forEach(function (r, i) {
      var id = ids[i];
      // The rows are a fixed-column grid; an extra child would wrap onto a
      // second line, so they switch to flex while the controls are on them.
      r.classList.add("reordering");
      r.setAttribute("draggable", "true");
      r.title = "Drag to reorder";
      r.addEventListener("dragstart", function (e) {
        sectionDrag.id = id;
        r.classList.add("dragging");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          try { e.dataTransfer.setData("text/plain", id); } catch (x) {}
        }
      });
      r.addEventListener("dragend", function () {
        r.classList.remove("dragging"); r.classList.remove("drop-target"); sectionDrag.id = null;
      });
      r.addEventListener("dragover", function (e) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
        if (sectionDrag.id && sectionDrag.id !== id) r.classList.add("drop-target");
      });
      r.addEventListener("dragleave", function () { r.classList.remove("drop-target"); });
      r.addEventListener("drop", function (e) {
        e.preventDefault(); r.classList.remove("drop-target");
        dropOn(sectionDrag.id, id);
      });
      r.appendChild(h("span", { class: "reorder-grip" }, [
        arrow("↑", "Move up", i, -1, i === 0),
        arrow("↓", "Move down", i, 1, i === rows.length - 1)
      ]));
    });
  }


  function buildNIS2NarrativeCard() {
    var rn = E.getReportNarrative();

    var clsSel = h("select", null, [
      h("option", { value: "", text: "Not set" }),
      h("option", { value: "essential", text: "Essential entity" }),
      h("option", { value: "important", text: "Important entity" }),
      h("option", { value: "not-determined", text: "Not yet determined" })
    ]);
    clsSel.value = rn.entityClassification || "";
    clsSel.addEventListener("change", function () { E.setReportNarrative({ entityClassification: clsSel.value }); });

    var authIn = h("input", { type: "text", value: rn.competentAuthority || "", placeholder: "e.g. the relevant national competent authority / CSIRT" });
    authIn.addEventListener("change", function () { E.setReportNarrative({ competentAuthority: authIn.value }); });

    var expoTa = h("textarea", { rows: "3", placeholder: "Client-specific regulatory exposure: consequences arising from the weakest areas, especially any Not-Achieved incident-reporting duties. Leave blank to keep the placeholder in the Word report." });
    expoTa.value = rn.regulatoryExposure || "";
    expoTa.addEventListener("change", function () { E.setReportNarrative({ regulatoryExposure: expoTa.value }); });

    var priTa = h("textarea", { rows: "3", placeholder: "The top one or two priorities for this client. Leave blank to use the suggestion drawn from the roadmap." });
    priTa.value = rn.topPriorities || "";
    priTa.addEventListener("change", function () { E.setReportNarrative({ topPriorities: priTa.value }); });

    return h("div", { class: "card", "data-check-anchor": "consultant-input" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Executive summary: consultant input" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text: "These fields complete the consultant sections of the executive summary in the Word report. Anything left blank shows there as a placeholder to complete." }),
        h("div", { class: "grid-2" }, [
          h("div", { class: "field" }, [h("label", { text: "Entity classification" }), clsSel]),
          h("div", { class: "field" }, [h("label", { text: "Competent authority" }), authIn])
        ]),
        h("div", { class: "field", "data-check-anchor": "narrative-regulatoryExposure" }, [h("label", { text: "Regulatory exposure note" }), expoTa]),
        h("div", { class: "field", "data-check-anchor": "narrative-topPriorities" }, [h("label", { text: "Top priorities" }), priTa])
      ])
    ]);
  }

  // Read-only rendering of the basis of assessment on the report preview, so
  // the consultant sees exactly what the exports will carry. Editing is on the
  // engagement page. Returns null when nothing has been recorded.
  function buildBasisPreviewCard() {
    var basis = E.getBasisOfAssessment();
    var total = basis.interviews.length + basis.documents.length + basis.observations.length;
    if (total === 0) return null;

    function tbl(cols, rows, cells) {
      var head = h("thead", null, [h("tr", null, cols.map(function (c) { return h("th", { text: c }); }))]);
      var body = h("tbody", null, rows.map(function (r) { return h("tr", null, cells(r).map(function (v) { return h("td", { text: v || "" }); })); }));
      return h("table", { class: "tbl" }, [head, body]);
    }

    var kids = [];
    if (basis.interviews.length) {
      kids.push(h("h3", { style: "margin:14px 0 6px;", text: "People interviewed" }));
      kids.push(tbl(["Name", "Role", "Date"], basis.interviews, function (r) { return [r.name, r.role, r.date]; }));
    }
    if (basis.documents.length) {
      kids.push(h("h3", { style: "margin:14px 0 6px;", text: "Documents reviewed" }));
      kids.push(tbl(["Title", "Reference / version", "Date"], basis.documents, function (r) { return [r.title, r.reference, r.date]; }));
    }
    if (basis.observations.length) {
      kids.push(h("h3", { style: "margin:14px 0 6px;", text: "Systems observed" }));
      kids.push(tbl(["System / environment", "How observed"], basis.observations, function (r) { return [r.name, r.method]; }));
    }

    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Basis of assessment" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text: "Edit these on the engagement page. They export into the Word report and the Excel workbook." })
      ].concat(kids))
    ]);
  }

  // Compact side-by-side rollup for multi-target engagements in families
  // without a native multi-site report (62443-3-3 has its own comparison
  // card). One row per site/product: answered/total, open gaps, headline.
  // The organisation-wide position across every site in this assessment.
  //
  // The card above it compares sites side by side; this one answers the
  // different question a board asks - "where do we stand as an organisation?" -
  // by taking the WEAKEST site's result for each requirement and naming the
  // sites that set it. It leads with the requirements where sites disagree,
  // because those are the ones where one plant is carrying a gap alone and the
  // per-site reports each look fine on their own.
  // One entry per SITE, and a site is an assessment: its site name identifies
  // it, its answers are its own. Sibling assessments of the same instrument in
  // this customer file are the other sites; a prior-year baseline is excluded,
  // being history rather than a peer.
  function siteRollUpEntries() {
    if (!E.siblingSiteAssessments) return [];
    return E.siblingSiteAssessments().map(function (a) {
      var meta = a.engagementMeta || {};
      return {
        id: a.id,
        name: meta.siteName || a.label || "(site not named)",
        responses: a.responses || []
      };
    });
  }

  function orgRollUpCard() {
    var C = window.App.Compare;
    if (!C || !C.rollUpSites) return null;
    // Zones and components are parts of one system, not places the organisation
    // operates; rolling them up as "sites" would misdescribe them.
    if (E.state.scoringFamily === "capability-sl" || isCRA()) return null;
    var entries = siteRollUpEntries();
    if (entries.length < 2) return null;

    var noun = targetNoun();
    var roll = C.rollUpSites({
      instrument: E.state.instrument,
      taxonomy: E.state.taxonomy,
      profile: E.state.profile,
      family: E.state.scoringFamily,
      entries: entries
    });
    if (!roll.summary.compared) return null;

    var s = roll.summary;
    var lead = s.differing === 0
      ? "All " + roll.siteCount + " " + pluralLabel(noun) + " reached the same result on every requirement assessed at more than one, so the organisation-wide position is the same as each " + noun + "'s."
      : s.differing + " of " + s.compared + " requirements differ between " + pluralLabel(noun) +
        ". For those, the organisation-wide result is the weakest " + noun + "'s, and the " + pluralLabel(noun) + " setting it are named.";
    var included = "Across " + roll.siteCount + " assessments in this customer file: " + roll.siteNames.join(", ") + ".";

    var rows = roll.divergent.slice(0, 40).map(function (it) {
      return h("tr", null, [
        h("td", null, [
          h("strong", { text: it.code || it.id }),
          it.label ? h("div", { class: "muted small", text: it.label }) : null
        ]),
        h("td", null, [it.groupName || ""]),
        h("td", null, [h("strong", { text: it.orgValue ? it.orgValue.label : "" })]),
        h("td", null, [it.worstSites.join(", ")]),
        h("td", null, [it.unscoredSites.length ? ("not assessed at " + it.unscoredSites.join(", ")) : ""])
      ]);
    });

    // Not a section of THIS assessment's report, so it carries no section key
    // and no Edit control: it previews the organisation-wide document, which is
    // built across several assessments and therefore has no single assessment's
    // reportCustom to answer to. Offering Edit here would let a consultant
    // rename or hide something the export would go on printing anyway.
    return h("div", { class: "card", "data-cross-assessment": "1" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Organisation-wide position" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text: included }),
        h("p", { class: "muted", text: lead }),
        s.withUnscoredSites
          ? h("p", { class: "muted", text: s.withUnscoredSites + " requirement" + (s.withUnscoredSites === 1 ? " was" : "s were") + " not assessed at every " + noun + "; a " + noun + " that was not assessed is not a " + noun + " that passed, so it is listed rather than counted." })
          : null,
        rows.length ? h("table", { class: "tbl" }, [
          h("thead", null, [h("tr", null, [
            h("th", null, ["Requirement"]), h("th", null, ["Group"]),
            h("th", null, ["Organisation-wide"]), h("th", null, [cap(pluralLabel(noun)) + " setting it"]),
            h("th", null, ["Coverage"])
          ])]),
          h("tbody", null, rows)
        ]) : null,
        roll.divergent.length > 40
          ? h("p", { class: "muted small", text: "Showing the 40 weakest of " + roll.divergent.length + " differing requirements." })
          : null
      ])
    ]);
  }

  function crossTargetSummaryCard() {
    if (E.state.scoringFamily === "capability-sl") return null;
    var targets = E.state.engagement.targets;
    if (targets.length < 2) return null;
    var all = E.scoreAllTargets();
    if (!all || !all.perTarget) return null;
    var noun = targetNoun();

    var rows = all.perTarget.map(function (pt) {
      var r = pt.result || {};
      var answered = null, total = null, gaps = null, headline = "";
      if (r.layers) {
        // Layered CRA: sum the in-scope layers; headline = product class.
        answered = 0; total = 0;
        r.layers.forEach(function (l) { answered += (l.overall.answered || 0); total += (l.overall.total || 0); });
        gaps = (r.roadmap || []).length;
        headline = (r.classification && r.classification.classLabel) || "";
      } else if (r.overall && typeof r.overall === "object") {
        // nis2 / csms / caf-style rollups.
        if (typeof r.overall.answered === "number") answered = r.overall.answered;
        if (typeof r.overall.total === "number") total = r.overall.total;
        gaps = Array.isArray(r.roadmap) ? r.roadmap.length
          : (typeof r.overall.gaps === "number" ? r.overall.gaps : null);
      } else if (typeof r.totalScorable === "number") {
        // posture.
        answered = r.totalAnswered; total = r.totalScorable;
        gaps = Array.isArray(r.roadmap) ? r.roadmap.length : null;
        headline = r.headlineGrade || "";
      }
      if (gaps === null && Array.isArray(r.roadmap)) gaps = r.roadmap.length;
      return h("tr", null, [
        h("td", null, [h("strong", { text: pt.target.name })]),
        h("td", { class: "center", text: (answered === null ? "-" : (answered + " / " + (total === null ? "?" : total))) }),
        h("td", { class: "center" + (typeof gaps === "number" && gaps > 0 ? " gap" : ""), text: (gaps === null ? "-" : String(gaps)) }),
        h("td", null, [headline])
      ]);
    });

    return h("div", { class: "card" }, [
      h("div", { class: "card-h" }, [h("h2", { text: pluralLabel(cap(noun)) + " side by side" })]),
      h("div", { class: "card-b" }, [
        h("p", { class: "muted", style: "margin-top:0;", text: "Each " + noun + " is assessed and reported independently; this is a quick rollup. Switch the detailed report between " + pluralLabel(noun) + " with the toolbar above." }),
        h("table", { class: "tbl" }, [
          h("thead", null, [h("tr", null, [
            h("th", null, [cap(noun)]), h("th", { class: "center" }, ["Answered"]),
            h("th", { class: "center" }, ["Open gaps"]), h("th", null, [""])
          ])]),
          h("tbody", null, rows)
        ])
      ])
    ]);
  }

  // ---- progress since previous assessment (baseline comparison) ---------
  // The consultant loads an earlier saved project JSON; its responses for
  // this instrument become the baseline (App.Compare snapshot stored on the
  // assessment) and every scored item is compared against today's answers.

  // For one target: the one named, or the active one (the on-screen card).
  function computeComparison(targetId) {
    var C = window.App.Compare;
    if (!C) return null;
    var baseline = E.getBaseline();
    var t = targetId ? (E.state.engagement.targets || []).filter(function (x) { return x.id === targetId; })[0] : E.getActiveTarget();
    if (!baseline || !t) return null;
    var btid = C.baselineTargetIdFor(baseline, t);
    var baseResponses = C.scopeResponses(baseline.responses || [], btid);
    var currResponses = C.scopeResponses(E.state.engagement.responses, t.id);
    var cmp = C.compare({
      instrument: E.state.instrument,
      taxonomy: E.state.taxonomy,
      profile: E.state.profile,
      family: E.state.scoringFamily,
      baselineResponses: baseResponses,
      currentResponses: currResponses,
      targetProfile: E.state.engagement.targetProfile,
      cafOverlay: E.state.scoringFamily === "caf-achieved" ? E.getActiveCAFOverlay() : null,
      craSetup: isCRA() ? E.getCRASetup() : null,
      // Risk appetite: each visit read with its own sector, scope and verdict.
      riskAppetiteSetup: E.state.scoringFamily === "risk-appetite-coherence" ? E.getRiskAppetiteSetup() : null,
      baselineRiskAppetiteSetup: baseline.riskAppetiteSetup || null
    });
    var versionMismatch = !!(baseline.instrumentContentVersion && E.state.instrument.contentVersion
      && baseline.instrumentContentVersion !== E.state.instrument.contentVersion);
    var baselineTarget = (baseline.targets || []).filter(function (x) { return x.id === btid; })[0] || null;
    return { baseline: baseline, baselineTargetId: btid, baselineTargetName: baselineTarget ? baselineTarget.name : "", cmp: cmp, versionMismatch: versionMismatch, target: t };
  }

  // Flat payload for the Excel/Word exports (no DOM, no engine references),
  // for the target named, or the active one.
  function progressExportPayload(targetId) {
    var res = computeComparison(targetId);
    if (!res) return null;
    return {
      sourceLine: window.App.Compare.sourceLine(res.baseline),
      versionMismatch: res.versionMismatch,
      baselineContentVersion: res.baseline.instrumentContentVersion || "",
      currentContentVersion: E.state.instrument.contentVersion || "",
      targetName: (res.target || {}).name || "",
      baselineTargetName: res.baselineTargetName,
      summary: res.cmp.summary,
      gaps: res.cmp.gaps,
      movements: res.cmp.movements.map(function (m) {
        return { code: m.code, label: m.label, group: m.groupName, prev: m.prev.label, curr: m.curr.label,
                 change: m.change, direction: m.direction || "" };
      }),
      aboveBaseline: res.cmp.aboveBaseline || [],
      aboveBaselineNew: res.cmp.aboveBaselineNew || 0,
      // Risk appetite: the verdict and positions then and now, and whether the
      // organisation is closer to proportion. Null for every other family.
      fit: res.cmp.fit || null
    };
  }

  function loadBaselineFromFile(file) {
    STG.loadProjectFromFile(file, function (res) {
      if (!res.ok) { toast(res.error, "err"); return; }
      // Storage delivers the parsed file outside its own try, so a file that
      // parses but is the wrong shape inside (targets that are not a list, say)
      // would otherwise throw here unseen: the consultant picks a file and
      // nothing happens at all.
      var out;
      try { out = window.App.Compare.extractBaseline(res.data, E.state.instrument.id, file.name); }
      catch (e) {
        toast("That file could not be used as the previous assessment: its contents are not in a form this copy can read.", "err", 8000);
        return;
      }
      if (!out.ok) { toast(out.error, "err"); return; }
      E.setBaseline(out.baseline);
      toast("Previous assessment loaded as the comparison baseline.");
    });
  }

  function buildComparisonCard() {
    var C = window.App.Compare;
    var baseline = E.getBaseline();

    var fileIn = h("input", { type: "file", accept: "application/json,.json", class: "hidden" });
    fileIn.addEventListener("change", function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (file) loadBaselineFromFile(file);
      ev.target.value = "";
    });

    var kids = [];
    var isRA = E.state.scoringFamily === "risk-appetite-coherence";
    if (!baseline) {
      kids.push(h("p", { class: "muted", style: "margin-top:0;", text: isRA
        ? "Load the saved project JSON from an earlier visit to show how the two positions have moved and whether the organisation is closer to proportion than it was. The comparison also appears in the Excel and Word exports."
        : "Load the saved project JSON from an earlier visit to show what has moved since: improvements, regressions and the change in open gaps. The comparison also appears in the Excel and Word exports." }));
      kids.push(h("button", { class: "btn", onClick: function () { fileIn.click(); }, text: "Load previous assessment…" }));
    } else {
      var res = computeComparison();
      kids.push(h("p", { class: "muted", style: "margin-top:0;", text: "Baseline: " + C.sourceLine(baseline) }));
      if (res && res.versionMismatch) {
        kids.push(h("p", { class: "muted", text: "The baseline was scored against instrument content version " + baseline.instrumentContentVersion + "; the current version is " + (E.state.instrument.contentVersion || "unknown") + ". Renamed or removed items compare as not assessed." }));
      }

      // Baseline target pairing - only when the previous file held several.
      if (res && (baseline.targets || []).length > 1) {
        var sel = h("select", null, (baseline.targets || []).map(function (t) {
          return h("option", { value: t.id, text: t.name });
        }));
        sel.value = res.baselineTargetId || "";
        sel.addEventListener("change", function () {
          E.setBaselineTarget(E.getActiveTarget().id, sel.value);
        });
        var dimLabel = E.state.instrument.targetDimensionLabel || "Site";
        kids.push(h("div", { class: "field" }, [h("label", { text: "Compare against previous " + dimLabel.toLowerCase() }), sel]));
      }

      if (res && res.cmp.fit) {
        // Risk appetite. No improved or regressed: neither scale has a good
        // end, so items are shown as having moved, with the direction named,
        // and the only judgement is at the fit: closer to proportion or not.
        var R = window.App.Report;
        var N = R.riskAppetiteNarrative(null, E.state.instrument, E.state.engagement);
        var slots = R.riskAppetiteSlots(E.scoreActiveTarget(), E.state.engagement);
        var pay = progressExportPayload();
        var pt = R.riskAppetiteProgressText(pay, N, slots) || {};
        var fit = res.cmp.fit;
        var dirCls = fit.direction === "closer" ? "met" : fit.direction === "further" ? "gap" : "neutral";
        var dirText = fit.direction === "closer" ? "Closer to proportion"
                    : fit.direction === "further" ? "Further from proportion"
                    : fit.direction === "same" ? "Same distance from proportion" : "Not yet comparable";
        kids.push(h("div", { class: "sl-row wrap", style: "margin-bottom:10px;" }, [
          h("span", { class: "pill " + dirCls, text: dirText }),
          h("span", { class: "pill neutral", text: "Moved " + (res.cmp.summary.moved || 0) }),
          h("span", { class: "pill neutral", text: "Unchanged " + (res.cmp.summary.unchanged || 0) })
        ]));
        if (pt.verdictLine) kids.push(h("p", { text: pt.verdictLine }));
        if (pt.direction) kids.push(h("p", { text: pt.direction }));
        if (pt.moved) kids.push(h("p", { class: "muted", text: pt.moved }));
        if (res.cmp.movements.length) {
          kids.push(h("table", { class: "tbl" }, [
            h("thead", null, [h("tr", null, [
              h("th", { text: "Ref" }), h("th", { text: "Item" }), h("th", { text: "Section" }),
              h("th", { text: "Previous" }), h("th", { text: "Current" }), h("th", { text: "Moved" })
            ])]),
            h("tbody", null, res.cmp.movements.map(function (m) {
              return h("tr", null, [
                h("td", { text: m.code }), h("td", { text: m.label }), h("td", { text: m.groupName }),
                h("td", { text: m.prev.label }), h("td", { text: m.curr.label }),
                h("td", null, [h("span", { class: "pill neutral", text: m.direction })])
              ]);
            }))
          ]));
        }
      } else if (res) {
        var s = res.cmp.summary;
        function chip(text, cls) { return h("span", { class: "pill " + cls, text: text }); }
        var chips = [
          chip("Improved " + s.improved, s.improved > 0 ? "met" : "neutral"),
          chip("Regressed " + s.regressed, s.regressed > 0 ? "gap" : "neutral"),
          chip("Unchanged " + s.unchanged, "neutral"),
          chip("Newly assessed " + s.newlyAssessed, "neutral"),
          chip("No longer assessed " + s.noLongerAssessed, "neutral")
        ];
        if (res.cmp.gaps) {
          var g = res.cmp.gaps;
          chips.push(chip("Open gaps " + g.prev + " → " + g.curr, g.curr < g.prev ? "met" : (g.curr > g.prev ? "gap" : "neutral")));
        }
        if (res.cmp.aboveBaseline && res.cmp.aboveBaseline.length) {
          chips.push(chip("Beyond baseline " + res.cmp.aboveBaseline.length + (res.cmp.aboveBaselineNew ? " (+" + res.cmp.aboveBaselineNew + " new)" : ""), "met"));
        }
        kids.push(h("div", { class: "sl-row wrap", style: "margin-bottom:12px;" }, chips));

        if (res.cmp.movements.length === 0) {
          kids.push(h("p", { class: "muted", text: "No scored item moved in either direction." }));
        } else {
          var head = h("thead", null, [h("tr", null, [
            h("th", { text: "Ref" }), h("th", { text: "Item" }), h("th", { text: "Area" }),
            h("th", { text: "Previous" }), h("th", { text: "Current" }), h("th", { text: "Change" })
          ])]);
          var tbody = h("tbody", null, res.cmp.movements.map(function (m) {
            return h("tr", null, [
              h("td", { text: m.code }),
              h("td", { text: m.label }),
              h("td", { text: m.groupName }),
              h("td", { text: m.prev.label }),
              h("td", { text: m.curr.label }),
              h("td", null, [h("span", { class: "pill " + (m.change === "improved" ? "met" : "gap"), text: C.CHANGE_LABELS[m.change] })])
            ]);
          }));
          kids.push(h("table", { class: "tbl" }, [head, tbody]));
        }

        // Implemented beyond the requirement - showcase controls done above the
        // selected profile, and which are newly added since the baseline.
        if (res.cmp.aboveBaseline && res.cmp.aboveBaseline.length) {
          kids.push(h("h3", { style: "margin:16px 0 4px;", text: "Implemented beyond the requirement" }));
          kids.push(h("p", { class: "muted", style: "margin-top:0;", text: res.cmp.aboveBaseline.length + " control" + (res.cmp.aboveBaseline.length === 1 ? "" : "s") + " implemented beyond the selected profile" + (res.cmp.aboveBaselineNew ? ", " + res.cmp.aboveBaselineNew + " added since the previous assessment" : "") + ". They do not affect the score." }));
          var abHead = h("thead", null, [h("tr", null, [
            h("th", { text: "Ref" }), h("th", { text: "Control" }), h("th", { text: "Area" }),
            h("th", { text: "State" }), h("th", { text: "Since baseline" })
          ])]);
          var abBody = h("tbody", null, res.cmp.aboveBaseline.map(function (a) {
            return h("tr", null, [
              h("td", { text: a.code }),
              h("td", { text: a.label }),
              h("td", { text: a.group }),
              h("td", null, [h("span", { class: "pill met", text: a.state })]),
              h("td", null, [a.isNew ? h("span", { class: "pill met", text: "New" }) : h("span", { class: "pill neutral", text: "Maintained" })])
            ]);
          }));
          kids.push(h("table", { class: "tbl" }, [abHead, abBody]));
        }

        kids.push(h("p", { class: "muted", style: "margin-bottom:0;", text: "The previous responses are re-scored against the current instrument content and targets so both visits are compared on the same yardstick." }));
      }

      kids.push(h("div", { class: "sl-row", style: "margin-top:12px;" }, [
        h("button", { class: "btn", onClick: function () { fileIn.click(); }, text: "Change baseline file…" }),
        h("button", {
          class: "btn ghost",
          onClick: function () {
            if (confirm("Remove the comparison baseline from this assessment?")) E.clearBaseline();
          },
          text: "Remove baseline"
        })
      ]));
    }

    return h("div", { class: "card", "data-check-anchor": "progress" }, [
      h("div", { class: "card-h" }, [h("h2", { text: "Progress since previous assessment" })]),
      h("div", { class: "card-b" }, kids),
      fileIn
    ]);
  }

  // ---- remediation planning (gap roadmap) -------------------------------
  // Persist the consultant's manual priority order. The dragged obligation is
  // inserted ahead of the row it was dropped on; all gaps are then renumbered
  // so priorityRank drives the roadmap sort and the exports.
  function reorderRoadmap(draggedId, targetId) {
    var scored = E.scoreActiveTarget();
    var ids = (scored.roadmap || []).map(function (it) { return it.itemId; });
    var from = ids.indexOf(draggedId), to = ids.indexOf(targetId);
    if (from < 0 || to < 0 || from === to) return;
    ids.splice(from, 1);
    ids.splice(ids.indexOf(targetId), 0, draggedId);
    var tid = E.getActiveTarget().id;
    ids.forEach(function (id, i) { E.setResponse(tid, id, { priorityRank: i + 1 }); });
    renderReportPage();
  }

  // opts.targetId  where the plan is written. The shared layer for a
  //                cross-zone action, so one edit covers every zone it reaches.
  // opts.title     what the dialogue is called; the default is a gap plan.
  function openRemediationModal(itemId, opts) {
    opts = opts || {};
    var scored = E.scoreActiveTarget();
    var tid = opts.targetId || E.getActiveTarget().id;
    var it = (scored.roadmap || []).filter(function (x) { return x.itemId === itemId; })[0]
          || (scored.perItem || []).filter(function (x) { return x.itemId === itemId; })[0]
          || (scored.perRequirement || []).filter(function (x) { return x.requirementId === itemId; })[0]
          || (((E.scoreAllTargets() || {}).sharedRoadmap) || []).filter(function (x) { return x.requirementId === itemId; })[0];
    // Falls back to the raw response plus the catalogue, so advice recorded
    // against something that meets its target is editable even though nothing
    // in the scored result had a reason to carry it.
    if (!it) {
      var cat = (E.state.instrument &&
        (E.state.instrument.requirements || E.state.instrument.outcomes ||
         E.state.instrument.items || E.state.instrument.questions)) || [];
      var c = cat.filter(function (x) { return x.id === itemId; })[0];
      var resp = E.findResponse(tid, itemId);
      if (!c && !resp) return;
      c = c || {};
      resp = resp || {};
      it = {
        itemId: itemId, requirementId: itemId,
        code: c.code || c.id || itemId, title: c.title || c.name || c.prompt || "",
        evidence: resp.evidence, priorityBand: resp.priorityBand,
        owner: resp.owner, action: resp.action, impact: resp.impact
      };
    }
    // A shared plan is written on the shared layer, so read it from there too.
    if (opts.targetId) {
      var sharedResp = E.findResponse(tid, itemId) || {};
      it = Object.assign({}, it, {
        evidence: sharedResp.evidence != null ? sharedResp.evidence : it.evidence,
        priorityBand: sharedResp.priorityBand != null ? sharedResp.priorityBand : it.priorityBand,
        owner: sharedResp.owner != null ? sharedResp.owner : it.owner,
        action: sharedResp.action != null ? sharedResp.action : it.action,
        impact: sharedResp.impact != null ? sharedResp.impact : it.impact
      });
    }

    var bandSel = h("select", null, [
      h("option", { value: "", text: "Not set" }),
      h("option", { value: "high", text: "High" }),
      h("option", { value: "medium", text: "Medium" }),
      h("option", { value: "low", text: "Low" })
    ]);
    bandSel.value = it.priorityBand || "";
    var evidenceIn = h("textarea", { rows: "3" }); evidenceIn.value = it.evidence || "";
    var ownerIn = h("input", { type: "text", value: it.owner || "" });
    var actionIn = h("textarea", { rows: "4" }); actionIn.value = it.action || "";
    var impactIn = h("textarea", { rows: "3" }); impactIn.value = it.impact || "";

    var modal = h("div", { class: "modal-backdrop" }, [
      h("div", { class: "modal" }, [
        h("div", { class: "modal-h" }, [
          h("h2", { text: opts.title || "Remediation plan" }),
          h("button", { class: "btn ghost", style: "color:var(--text);", onClick: closeModal, text: "Close" })
        ]),
        h("div", { class: "modal-b" }, [
          h("p", { class: "muted", style: "margin-top:0;", text: it.code + " " + it.title }),
          opts.note ? h("p", { class: "muted", style: "margin-top:0; font-size:12.5px;", text: opts.note }) : null,
          h("div", { class: "field" }, [h("label", { text: "Captured evidence" }), evidenceIn]),
          h("div", { class: "field" }, [h("label", { text: "Priority band" }), bandSel]),
          h("div", { class: "field" }, [h("label", { text: "Owner" }), ownerIn]),
          h("div", { class: "field" }, [h("label", { text: "Recommended action" }), actionIn]),
          h("div", { class: "field" }, [h("label", { text: "Business impact" }), impactIn])
        ]),
        h("div", { class: "modal-f" }, [
          h("button", { class: "btn", onClick: closeModal, text: "Cancel" }),
          h("button", {
            class: "btn primary",
            onClick: function () {
              E.setResponse(tid, itemId, {
                evidence: evidenceIn.value,
                priorityBand: bandSel.value,
                owner: ownerIn.value,
                action: actionIn.value,
                impact: impactIn.value
              });
              closeModal();
              renderReportPage();
            },
            text: "Save"
          })
        ])
      ])
    ]);
    document.body.appendChild(modal);
    refs.modal = modal;
  }

  // ---- engagement modal -------------------------------------------------

  // opts.focus: a field to put the cursor in (the issue check links here).
  // A click handler passes its event, which is ignored.
  function openEngagementModal(opts) {
    var focusKey = opts && typeof opts.focus === "string" ? opts.focus : null;
    // Two halves, and the modal has to make the difference obvious or a
    // consultant will put one engagement's opportunity ID on the customer and
    // wonder why the next assessment inherited it.
    //   customer + site  belong to the FILE, shared by every assessment in it
    //   the rest        belong to THIS assessment
    // Opens with or without an instrument selected - the picker screen offers
    // it too - so with nothing open only the customer half is editable.
    var e = (E.state.engagement && E.state.engagement.engagement) || E.state.project;
    if (!e) return;
    var STG = window.App.Storage;
    var LABELS = {
      clientName: "Client name", siteName: "Site name",
      siteAddress: "Site address", siteContact: "Site contact",
      opportunityId: "Opportunity ID", consultant: "Consultant",
      dateOfVisit: "Date of visit", documentRevision: "Document revision",
      qaReviewBy: "QA review by", authorisedBy: "Authorised by",
      issuedTo: "Issued to", issuedDate: "Issued date",
      confidentiality: "Confidentiality"
    };
    var inputs = {};
    function fieldFor(key) {
      var type = (key === "dateOfVisit" || key === "issuedDate") ? "date" : "text";
      var input = h("input", { type: type, value: e[key] || "" });
      inputs[key] = input;
      return h("div", { class: "field" }, [h("label", { text: LABELS[key] }), input]);
    }

    var instName = E.state.instrument && E.state.instrument.title;
    var fields = [
      h("div", { class: "meta-group-h" }, [
        h("h3", { text: "Customer and site" }),
        h("span", { class: "muted", text: "shared by every assessment in this file" })
      ]),
      h("div", { class: "grid-2" }, STG.SHARED_META_KEYS.map(fieldFor))
    ];
    if (instName) {
      fields.push(h("div", { class: "meta-group-h" }, [
        h("h3", { text: "This assessment" }),
        h("span", { class: "muted", text: instName })
      ]));
      fields.push(h("p", { class: "muted", style: "margin:0 0 10px; font-size:12.5px;", text:
        "The opportunity, who carried it out, when, and how this report is controlled. " +
        "Another assessment in the same file keeps its own." }));
      fields.push(h("div", { class: "grid-2" }, STG.ASSESSMENT_META_KEYS.map(fieldFor)));
    } else {
      fields.push(h("p", { class: "muted", style: "margin:12px 0 0; font-size:12.5px;", text:
        "Open an assessment to record its opportunity ID, consultant, dates and document control. Those belong to the assessment, not to the customer." }));
    }

    var modal = h("div", { class: "modal-backdrop" }, [
      h("div", { class: "modal" }, [
        h("div", { class: "modal-h" }, [h("h2", { text: "Engagement details" }), h("button", { class: "btn ghost", style: "color:var(--text);", onClick: closeModal, text: "Close" })]),
        h("div", { class: "modal-b" }, fields),
        h("div", { class: "modal-f" }, [
          h("button", { class: "btn", onClick: closeModal, text: "Cancel" }),
          h("button", {
            class: "btn primary",
            onClick: function () {
              var patch = {};
              Object.keys(inputs).forEach(function (k) { patch[k] = inputs[k].value; });
              E.updateMetadata(patch);
              closeModal();
              render();
            },
            text: "Save"
          })
        ])
      ])
    ]);
    document.body.appendChild(modal);
    refs.modal = modal;
    if (focusKey && inputs[focusKey]) revealNode(inputs[focusKey].parentNode);
  }

  function closeModal() {
    if (refs.modal) { document.body.removeChild(refs.modal); refs.modal = null; }
  }

  // Exposed for tour fixtures + headless harnesses so they can open the panel
  // programmatically before screenshotting. Not used by the production UI.
  function openSLGuidance(reqId) { slGuidanceOpen[reqId] = true; }

  return {
    init: init,
    toast: toast,
    go: go,
    // Exposed for the regression suite: a refused load must leave the
    // consultant on the page they were on.
    __currentView: function () { return view; },
    openSLGuidance: openSLGuidance,
    openLicence: openLicence,
    // Exposed for the regression suite: the warning a project from a newer
    // release gets on load.
    __newerFileWarning: newerFileWarning,
    // Exposed for the regression suite: the export-scope filter decides what
    // reaches a report, and it has to keep the shared layer.
    __filteredEngagementFor: filteredEngagementFor,
    // What the Word and Excel exports receive as opts.progress.
    __progressExportPayload: progressExportPayload,
    // Target-label plurals on screen; pinned against the Excel tab rule.
    __pluralLabel: pluralLabel,
    // The ready-to-issue check: the documents an export would write, the
    // check over them, its lines, and the last result on the report page.
    __issue: {
      jobs: docxJobs,
      run: runIssueChecks,
      blockerLines: issueBlockerLines,
      warnings: issueWarnings,
      last: lastIssueCheck,
      beginExport: beginExport
    },
    // What js/review.js needs from the page: the same documents an export
    // would write, and the ways of taking the consultant to a field.
    __review: {
      jobs: docxJobs,
      allTargetIds: issueAllIds,
      jumpToItem: jumpToItem,
      openPlanFor: openPlanFor,
      setTargetThen: setTargetThen,
      revealOnReport: revealOnReport,
      goToSection: goToReportSection,
      sectionKeys: reportSectionKeys,
      // A selector on the report page: true when it is there and shown.
      revealIfThere: function (selector) {
        if (view !== "report") go("report");
        return revealNode(refs.main.querySelector(selector));
      },
      openEngagement: function (focus) { openEngagementModal(focus ? { focus: focus } : null); },
      goToBasis: function () { go2("engagement", null, '[data-check-anchor="basis"]'); },
      repaintIssueCheck: function () {
        var card = refs.main.querySelector(".issue-check");
        if (card) paintIssueCheck(card, lastIssueCheck());
      },
      repaintReworded: function () { if (view === "report") placeRewordedCard(); },
      toast: toast,
      h: h
    },
    // The autosave backstop decides when a consultant is told they have unsaved
    // work. Getting that wrong in either direction is expensive - a missed
    // rescue, or a warning so routine it stops being read - so the rules are
    // testable rather than only observable.
    __autosave: {
      hasContent: projectHasContent,
      write: writeAutosave,
      clear: clearAutosave,
      // Where this window's backstop is now (it changes with the session at
      // New, Load and Restore), the prefix every session's live key starts
      // with (prefix + another id stands in for a second window), and the
      // single key and owner tag the previous release wrote, which start-up
      // still offers and then removes.
      liveKey: liveKey,
      livePrefix: LIVE_PREFIX,
      legacyKey: LEGACY_KEY,
      legacyOwnerKey: LEGACY_OWNER_KEY,
      // Work from an ended session waiting to be restored or discarded, and
      // what the app does at start-up, so "the next launch" can be tested
      // without a second init() doubling every listener.
      offeredKey: OFFERED_KEY,
      offered: readOffered,
      startup: maybeRestoreAutosave,
      isDirty: function () { return dirtySinceSave; },
      // The cap on the offered list, this window's session id, and what the
      // bar would offer (the list, plus any copy a full store left on another
      // session's key; those entries carry `key`).
      maxOffered: MAX_OFFERED,
      session: function () { return sessionId; },
      pending: pendingBackups
    }
  };
})();
