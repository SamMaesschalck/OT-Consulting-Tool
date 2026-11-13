/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* storage.js
 *
 * Save/load the engagement file. All-client, no telemetry, no fetch.
 *
 * MODEL (schema 2.0)
 *   One project file is one CUSTOMER, holding every assessment done for them.
 *   A 62443-3-3 site report and a General OT Security Posture read for the same
 *   client live in a single saved JSON - and so do two 62443-3-3 assessments
 *   two years apart.
 *
 *     {
 *       schemaVersion: "2.0",
 *       project: {                       // shared by every assessment here
 *         clientName                     // the CUSTOMER, and only that
 *       },
 *       activeAssessmentId: "iec-62443-3-3~m8x1a2",
 *       activeInstrumentId: "iec-62443-3-3",   // so older builds still open it
 *       assessments: {
 *         "iec-62443-3-3~m8x1a2": {
 *           id, instrumentId, instrumentContentVersion, label,
 *           engagementMeta: {            // per ASSESSMENT, not per customer
 *             siteName, siteAddress, siteContact,
 *             opportunityId, consultant, dateOfVisit, documentRevision,
 *             qaReviewBy, authorisedBy, issuedTo, issuedDate, confidentiality
 *           },
 *           targetProfile: {...}, targets: [...], responses: [...],
 *           baseline: {...},            // a previous assessment, for the diff
 *           reportNarrative, reportSections, basisOfAssessment,
 *           review: {...}               // comments back from reviewers (js/review.js);
 *                                       // absent until a review starts, never exported
 *         }
 *       },
 *       createdAt, updatedAt
 *     }
 *
 *   Assessments are keyed by their OWN id, not by instrument id: keying by
 *   instrument allowed exactly one assessment of each, which made a
 *   re-assessment impossible to keep in the customer's file. instrumentId is a
 *   field on the assessment. Storage.findAssessment(file, instrumentId) returns
 *   the latest by visit date.
 *
 *   The metadata split follows what actually varies: only the CUSTOMER belongs
 *   to the file. The site, the opportunity, the consultant, the visit date and
 *   the document control belong to the individual assessment - a site is a
 *   facility or location, and a customer may have several.
 *
 * MIGRATION
 *   Files saved against schema 1.0 (one engagement per file) load transparently
 *   as a 2.0 project containing a single assessment. Files saved against the
 *   earlier instrument-keyed 2.0 layout are rekeyed on load by
 *   rekeyAssessments(), which returns a moved map so activeInstrumentId still
 *   resolves. Engagement fields left at the project level migrate down onto
 *   each assessment's engagementMeta.
 */
window.App = window.App || {};
window.App.Storage = (function () {
  "use strict";

  var SCHEMA_VERSION = "2.0";

  function nowISO() { return new Date().toISOString(); }

  // Engagement metadata splits in two. WHO THE CUSTOMER IS belongs to the file
  // and is shared by every assessment in it. WHICH PIECE OF WORK THIS IS - the
  // opportunity, who did it, when, and how the resulting report is controlled -
  // belongs to the assessment: one customer file can hold a 62443-3-3 done in
  // May under one opportunity and an 800-82 done in September under another.
  //
  // The SITE belongs to the assessment too. A site is a facility or location of
  // a company: a small customer has one, and it is effectively the whole
  // organisation; a larger one has Manchester and Birmingham, and may have
  // several sites on a single physical location. So a customer file holds a
  // 62443-3-3 for Manchester and another for Birmingham, each naming its own
  // site. Only the CUSTOMER is common to the file.
  var SHARED_META_KEYS = ["clientName"];
  var ASSESSMENT_META_KEYS = ["siteName", "siteAddress", "siteContact",
    "opportunityId", "consultant", "dateOfVisit",
    "documentRevision", "qaReviewBy", "authorisedBy", "issuedTo", "issuedDate",
    "confidentiality"];

  // Only the customer. The site moved onto the assessment, so seeding empty
  // site fields here would leave a second, always-blank place for a site to
  // live and a plausible-looking "" for callers to read instead of the real one.
  //
  // projectId identifies THIS customer file for the life of the file. Save-in-
  // place keys its retained file handle on it, so a handle can only ever
  // overwrite the file it came from - see saveProjectToFile.
  function defaultProject() {
    return {
      projectId: newProjectId(),
      clientName: ""
    };
  }

  function newProjectId() {
    return "p-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e9).toString(36);
  }

  // Older files carry no projectId. Give them one on load so save-in-place can
  // tell them apart from anything else already saved.
  function ensureProjectId(project) {
    if (!project) return null;
    if (!project.projectId) project.projectId = newProjectId();
    return project.projectId;
  }

  function defaultAssessmentMeta() {
    return {
      opportunityId: "",
      consultant: "",
      dateOfVisit: "",
      documentRevision: "",
      qaReviewBy: "",
      authorisedBy: "",
      issuedTo: "",
      issuedDate: "",
      confidentiality: "Confidential"
    };
  }

  // A customer comes back: a 62443-3-3 in 2026, another in 2028. Both belong in
  // the same customer file, so `assessments` is keyed by an id of its own and
  // the instrument is a FIELD - it used to be the key, which allowed exactly one
  // assessment per instrument per file.
  var _assSeq = 0;
  function newAssessmentId(instrumentId) {
    _assSeq += 1;
    return (instrumentId || "assessment") + "~" + Date.now().toString(36) + _assSeq.toString(36);
  }

  function makeEmptyAssessment(instrument, assessmentId) {
    var label = (instrument && instrument.targetDimensionLabel) || "Site";
    return {
      id: assessmentId || newAssessmentId(instrument && instrument.id),
      instrumentId: instrument.id,
      instrumentContentVersion: instrument.contentVersion || "",
      targetProfile: { defaultTargetSL: 2, perFR: {}, perZone: {} },
      targets: [
        { id: "t-" + Date.now().toString(36), name: label + " 1" }
      ],
      responses: [],
      // The engagement half of the metadata - see SHARED_META_KEYS above.
      engagementMeta: defaultAssessmentMeta(),
      reportNarrative: {},
      // Per-section report customisation, keyed by section slug:
      //   { title, hidden, note, prose, order:[ids] }
      // Same per-assessment scope as reportNarrative. See Report.sectionKey.
      reportCustom: {},
      // Basis of assessment (evidence register). Per-assessment (like
      // reportNarrative), so the documents reviewed, systems observed and people
      // interviewed are specific to THIS instrument's assessment and never bleed
      // into another instrument's report.
      //   interviews:   [{ name, role, date }]
      //   documents:    [{ title, reference, date }]
      //   observations: [{ name, method }]   (systems / environments observed)
      basisOfAssessment: { interviews: [], documents: [], observations: [] }
    };
  }

  function makeEmptyProject() {
    return {
      schemaVersion: SCHEMA_VERSION,
      project: defaultProject(),
      activeInstrumentId: null,
      assessments: {},
      createdAt: nowISO(),
      updatedAt: nowISO()
    };
  }

  // Back-compat helper used by older test fixtures: produces a single
  // engagement projection (shared metadata + one assessment) in the v2 shape.
  function makeEmptyEngagement(instrument) {
    var ass = makeEmptyAssessment(instrument);
    return projectionFromProjectAndAssessment(defaultProject(), ass);
  }

  // The flat metadata block every consumer reads as engagement.engagement.
  // It is a MERGE of the two halves, not a reference to either, so callers must
  // write through Engine.updateMetadata rather than assigning to it - that is
  // what decides which half a field belongs to. `into` lets the caller refresh
  // the existing object in place, keeping its identity for anything holding a
  // reference to it.
  function mergedMeta(projectMeta, assessment, into) {
    var out = into || {};
    var am = assessmentMeta(assessment);
    SHARED_META_KEYS.forEach(function (k) { out[k] = projectMeta ? (projectMeta[k] || "") : ""; });
    ASSESSMENT_META_KEYS.forEach(function (k) { out[k] = am[k] || ""; });
    return out;
  }

  // Normalises an assessment's own metadata block, migrating a v2.0 file whose
  // engagement fields all sat on the shared project record. The caller passes
  // the project so the old values land on every assessment that was written
  // against them - dropping them would silently blank a saved report's
  // consultant, dates and revision.
  function assessmentMeta(assessment, projectMeta) {
    if (!assessment) return defaultAssessmentMeta();
    var m = assessment.engagementMeta;
    if (!m || typeof m !== "object") {
      m = assessment.engagementMeta = defaultAssessmentMeta();
      if (projectMeta) {
        ASSESSMENT_META_KEYS.forEach(function (k) {
          if (projectMeta[k] !== undefined && projectMeta[k] !== null && projectMeta[k] !== "") m[k] = projectMeta[k];
        });
      }
    }
    return m;
  }

  function projectionFromProjectAndAssessment(projectMeta, assessment) {
    assessmentMeta(assessment, projectMeta);
    return {
      schemaVersion: SCHEMA_VERSION,
      instrumentId: assessment.instrumentId,
      instrumentContentVersion: assessment.instrumentContentVersion,
      engagement: mergedMeta(projectMeta, assessment),
      targetProfile: assessment.targetProfile,
      targets: assessment.targets,
      responses: assessment.responses,
      reportNarrative: assessment.reportNarrative || (assessment.reportNarrative = {}),
      reportCustom: assessment.reportCustom || (assessment.reportCustom = {}),
      // Per-assessment evidence register, projected to the top level like
      // reportNarrative (NOT under engagement/projectMeta, which is shared).
      basisOfAssessment: assessment.basisOfAssessment || (assessment.basisOfAssessment = { interviews: [], documents: [], observations: [] })
    };
  }

  function migrateV1(data) {
    var assessmentId = data.instrumentId;
    var ass = {
      instrumentId: assessmentId,
      instrumentContentVersion: data.instrumentContentVersion || "",
      targetProfile: data.targetProfile || { defaultTargetSL: 2, perFR: {}, perZone: {} },
      targets: data.targets || [],
      responses: data.responses || []
    };
    var assessments = {};
    assessments[assessmentId] = ass;
    return {
      schemaVersion: SCHEMA_VERSION,
      project: Object.assign(defaultProject(), data.engagement || {}),
      activeInstrumentId: assessmentId,
      assessments: assessments,
      createdAt: data.createdAt || nowISO(),
      updatedAt: data.updatedAt || nowISO(),
      _migratedFrom: "1.0"
    };
  }

  // The file is named for the CUSTOMER, so the date has to come from the
  // assessments now that the visit date belongs to each one rather than to the
  // project. The active assessment's date wins; failing that the most recent
  // any of them carries, so a file holding a May 62443-3-3 and a September
  // 800-82 is named for the work that was actually done last.
  function projectVisitDate(projectFile) {
    var pf = projectFile || {};
    var asses = pf.assessments || {};
    var active = asses[pf.activeInstrumentId];
    var own = active && active.engagementMeta && active.engagementMeta.dateOfVisit;
    if (own) return own;
    var dates = Object.keys(asses).map(function (k) {
      var m = asses[k] && asses[k].engagementMeta;
      return (m && m.dateOfVisit) || "";
    }).filter(Boolean).sort();
    if (dates.length) return dates[dates.length - 1];
    // A v1/v2.0 file that has not been through a projection yet still carries
    // the date on the project record.
    return (pf.project && pf.project.dateOfVisit) || "";
  }

  // Files saved before the site moved onto the assessment carry siteName,
  // siteAddress and siteContact on the project record, shared by everything in
  // the file. Copy them down onto every assessment that does not have its own,
  // then drop them from the project so there is one place a site is recorded.
  // Without this, loading an older file would show every assessment with a
  // blank site while the real value sat unreachable at project level.
  function migrateSiteOntoAssessments(project, assessments) {
    if (!project) return;
    var SITE_KEYS = ["siteName", "siteAddress", "siteContact"];
    var carried = SITE_KEYS.some(function (k) { return String(project[k] || "").trim() !== ""; });
    if (carried) {
      Object.keys(assessments || {}).forEach(function (id) {
        var ass = assessments[id];
        if (!ass) return;
        var m = ass.engagementMeta || (ass.engagementMeta = defaultAssessmentMeta());
        SITE_KEYS.forEach(function (k) {
          if (!String(m[k] || "").trim() && project[k]) m[k] = project[k];
        });
      });
    }
    SITE_KEYS.forEach(function (k) { delete project[k]; });
  }

  // Older files keyed `assessments` by instrument id. Rekey to assessment ids,
  // keeping the object identical otherwise, and hand back a map from the old
  // key to the new one so the caller can translate activeInstrumentId.
  function rekeyAssessments(assessments) {
    var out = {}, moved = {};
    Object.keys(assessments || {}).forEach(function (key) {
      var ass = assessments[key];
      if (!ass) return;
      ass.instrumentId = ass.instrumentId || key;
      var id = ass.id || (ass.id = (key === ass.instrumentId ? newAssessmentId(ass.instrumentId) : key));
      out[id] = ass;
      moved[key] = id;
    });
    return { assessments: out, moved: moved };
  }

  // The assessment for an instrument inside a saved file. `assessments` is
  // keyed by assessment id, so anything that used to write
  // file.assessments[instrumentId] needs this instead. With several of the same
  // instrument the LATEST visit is returned, which is what "the 3-3 assessment"
  // means when a file holds a 2026 one and a 2028 one.
  function findAssessment(projectFile, instrumentId) {
    var all = (projectFile && projectFile.assessments) || {};
    var hits = Object.keys(all).map(function (k) { return all[k]; })
      .filter(function (a) { return a && (a.instrumentId || "") === instrumentId; });
    hits.sort(function (a, b) {
      var da = ((a.engagementMeta || {}).dateOfVisit) || "";
      var db = ((b.engagementMeta || {}).dateOfVisit) || "";
      return da < db ? -1 : (da > db ? 1 : 0);
    });
    return hits[hits.length - 1] || all[instrumentId] || null;
  }

  // How one assessment of an instrument is told apart from the next. The visit
  // date is what actually distinguishes them - a 2026 review and a 2028 one -
  // so it leads, with the revision as a tiebreak. A consultant can override it
  // with a label of their own.
  function assessmentLabel(assessment, instrument) {
    if (!assessment) return "";
    if (String(assessment.label || "").trim()) return assessment.label.trim();
    var m = assessment.engagementMeta || {};
    // Short enough to sit on one line in the picker. The visit date is what
    // actually separates a 2026 review from a 2028 one; the revision is the
    // tiebreak when two visits share a date. The opportunity is only reached
    // for when neither exists, since it is the least readable of the three.
    var bits = [];
    if (m.dateOfVisit) bits.push(m.dateOfVisit);
    if (m.documentRevision) bits.push("rev " + m.documentRevision);
    if (bits.length) return bits.join("  ·  ");
    if (m.opportunityId) return m.opportunityId;
    return (instrument && instrument.title) || assessment.instrumentId || "Assessment";
  }

  function suggestedProjectFilename(projectFile) {
    var p = (projectFile && projectFile.project) || {};
    var client = (p.clientName || "client").replace(/[^A-Za-z0-9_\-]+/g, "-");
    var date   = projectVisitDate(projectFile) || new Date().toISOString().slice(0, 10);
    return "ot-assessment-" + client + "-" + date + ".json";
  }

  // Kept for back-compat with any test that calls suggestedFilename(engagement).
  function suggestedFilename(engagementOrProject) {
    if (engagementOrProject && engagementOrProject.project) {
      return suggestedProjectFilename(engagementOrProject);
    }
    var e = (engagementOrProject && engagementOrProject.engagement) || {};
    var client = (e.clientName || "client").replace(/[^A-Za-z0-9_\-]+/g, "-");
    var site   = (e.siteName   || "site"  ).replace(/[^A-Za-z0-9_\-]+/g, "-");
    var date   = (e.dateOfVisit || new Date().toISOString().slice(0,10));
    return "ot-assessment-" + client + "-" + site + "-" + date + ".json";
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  function saveProject(projectFile, filename) {
    projectFile.updatedAt = nowISO();
    var text = JSON.stringify(projectFile, null, 2);
    var blob = new Blob([text], { type: "application/json" });
    downloadBlob(blob, filename || suggestedProjectFilename(projectFile));
  }

  // ---- save-in-place (File System Access API) ----------------------------
  // A plain download can never overwrite, so repeated saves pile up as
  // "name (1).json", "name (2).json". Chromium exposes showSaveFilePicker /
  // showOpenFilePicker on secure contexts (which includes file://): Save keeps
  // a handle to the project file and writes back to it, and Load through the
  // picker captures the handle so Save overwrites the loaded file. The handle
  // is persisted in IndexedDB so it survives a browser restart (the browser
  // re-confirms permission on the first save of a new session). Wherever the
  // API is missing the classic download above is used instead.

  // The retained file handle, and the projectId it belongs to. The pair travels
  // together: a handle without its project is not safe to write through.
  var projectHandle = null, projectHandleId = null;
  var IDB_NAME = "otcat-files", IDB_STORE = "handles", IDB_KEY = "project";

  // The browser refuses the file dialogs to a page framed by a page of another
  // origin (the suite's folder build frames each tool's own file:// page, and
  // the browser counts every file:// page as an origin of its own). There the
  // tool saves by download and loads through the file input, as it does in a
  // browser without the dialogs. Standalone, or framed by a page of the same
  // origin (the suite's single-file build), the dialogs are used as normal.
  function inForeignFrame() {
    try { return window.top !== window.self && !window.top.location.href; } catch (e) { return true; }
  }

  function supportsFilePickers() {
    return typeof window.showSaveFilePicker === "function" && !inForeignFrame();
  }

  // Handle persistence is a convenience, never a dependency: every failure
  // (no IndexedDB, non-cloneable handle, private mode) is swallowed.
  //
  // The handle is stored WITH the projectId it belongs to. Without that pairing
  // a restored handle is just "the last file anyone saved", and saving a
  // different project would silently overwrite it - which is exactly what used
  // to happen on a second assessment in a new session.
  function persistHandle(h, projectId) {
    try {
      var req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(IDB_STORE); };
      req.onerror = function () {};
      req.onsuccess = function () {
        try {
          var db = req.result;
          var st = db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE);
          if (h) st.put({ handle: h, projectId: projectId || null }, IDB_KEY);
          else st["delete"](IDB_KEY);
        } catch (e) {}
      };
    } catch (e) {}
  }

  // Test seam. window.indexedDB is not reliably assignable, so a test cannot
  // stub the store; this lets one supply exactly what the store would have
  // returned, which is where the overwrite decision is made.
  var restoreOverride = null;

  function restoreHandle(cb) {
    var called = false;
    function finish(h) { if (!called) { called = true; cb(h || null); } }
    if (restoreOverride !== null) { finish(restoreOverride); return; }
    if (!supportsFilePickers() || typeof indexedDB === "undefined") { finish(null); return; }
    try {
      var req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(IDB_STORE); };
      req.onerror = function () { finish(null); };
      req.onsuccess = function () {
        try {
          var db = req.result;
          var g = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(IDB_KEY);
          // Older entries were the bare handle with no project attached. Those
          // cannot be shown to belong to this project, so they are treated as
          // unusable and the save falls through to the picker.
          g.onsuccess = function () {
            var v = g.result;
            if (v && v.handle) finish(v);
            else finish(null);
          };
          g.onerror = function () { finish(null); };
        } catch (e) { finish(null); }
      };
    } catch (e) { finish(null); }
    // If the open request never fires (broken storage), don't hang the save.
    setTimeout(function () { finish(null); }, 1500);
  }

  // Chromium remembers one directory per picker id, per origin. Open and Save
  // share it deliberately: a consultant's projects live in one folder, and the
  // dialog should start there rather than at whatever the browser defaults to.
  var PICKER_ID = "otcat-project";

  function ensureWritePermission(handle) {
    if (!handle.queryPermission) return Promise.resolve(true);
    return handle.queryPermission({ mode: "readwrite" }).then(function (p) {
      if (p === "granted") return true;
      return handle.requestPermission({ mode: "readwrite" }).then(function (p2) { return p2 === "granted"; });
    }).catch(function () { return false; });
  }

  function currentFileName() { return projectHandle ? projectHandle.name : null; }
  function currentFileHandle() { return projectHandle; }

  // Forget the current file (New project, or a legacy file-input load where no
  // handle exists) so a later Save can never overwrite the WRONG project file.
  function forgetProjectFile() { projectHandle = null; projectHandleId = null; persistHandle(null); }

  // Save the project, overwriting its file where possible.
  // opts: { saveAs: true } forces the save dialog (a fresh copy / snapshot).
  // onResult({ ok, method: "file"|"download", name, aborted, error, blocked })
  // blocked: the download was used because the browser refused the save
  // dialog here (a frame), not because it has none.
  function saveProjectToFile(projectFile, opts, onResult) {
    opts = opts || {}; onResult = onResult || function () {};
    projectFile.updatedAt = nowISO();
    // Stamp an id on anything that lacks one (older files, hand-built objects)
    // BEFORE serialising, so the file that gets written carries the same id the
    // handle is filed under.
    var pid = ensureProjectId(projectFile.project || (projectFile.project = defaultProject()));
    var text = JSON.stringify(projectFile, null, 2);
    var suggested = suggestedProjectFilename(projectFile);

    function download(blocked) {
      downloadBlob(new Blob([text], { type: "application/json" }), suggested);
      onResult({ ok: true, method: "download", name: suggested, blocked: !!blocked });
    }

    if (!supportsFilePickers()) { download(inForeignFrame()); return; }

    function pick() {
      // Open where the consultant keeps their projects. Left to itself the
      // dialog lands wherever the browser last felt like - reported as "the
      // root of OneDrive" - and a file saved somewhere unintended is a file
      // that later looks lost. PICKER_ID makes Chromium remember a directory
      // for this app alone; the project's own file beats it when we have one,
      // because startIn given a FILE handle opens its containing folder.
      var opts2 = {
        id: PICKER_ID,
        suggestedName: suggested,
        types: [{ description: "OT assessment project", accept: { "application/json": [".json"] } }]
      };
      if (projectHandle) opts2.startIn = projectHandle;
      function ask(o, retry) {
        window.showSaveFilePicker(o).then(function (h) { writeTo(h, false); }, function (e) {
          if (e && e.name === "AbortError") { onResult({ ok: false, aborted: true }); return; }
          // Refused for a security reason (a frame the browser will not show
          // the dialog in, or the click that asked for it has expired): the
          // work still has to reach a file, so it downloads instead.
          if (e && e.name === "SecurityError") { download(true); return; }
          // A remembered directory that has since gone (a moved OneDrive
          // folder, a disconnected drive) must never be the reason a save is
          // impossible: drop the hint and ask again plainly.
          if (retry) { ask({ suggestedName: suggested, types: o.types }, false); return; }
          onResult({ ok: false, error: (e && e.message) || "save dialog failed" });
        });
      }
      ask(opts2, true);
    }

    // canFallback: a reused/restored handle may be stale (file moved/deleted
    // or permission refused) - fall back to the picker instead of failing.
    function writeTo(handle, canFallback) {
      ensureWritePermission(handle).then(function (granted) {
        if (!granted) { if (canFallback) pick(); else onResult({ ok: false, error: "write permission refused" }); return; }
        handle.createWritable().then(function (w) {
          return w.write(text).then(function () { return w.close(); });
        }).then(function () {
          projectHandle = handle;
          projectHandleId = pid;
          persistHandle(handle, pid);
          onResult({ ok: true, method: "file", name: handle.name });
        }).catch(function (e) {
          if (canFallback) pick();
          else onResult({ ok: false, error: (e && e.message) || "could not write file" });
        });
      });
    }

    if (opts.saveAs) { pick(); return; }

    // A retained handle may only overwrite the project it was retained FOR.
    //
    // This is the guard that was missing. The handle outlives the session in
    // IndexedDB, so starting a second, unrelated assessment and pressing Save
    // used to find the previous customer's file and write over it without
    // asking. Now anything that is not demonstrably this project's own file
    // falls through to the save dialog, which is the safe direction to fail:
    // the worst case is being asked where to save a file that already has a
    // home, rather than losing somebody else's work.
    if (projectHandle && projectHandleId && projectHandleId === pid) {
      writeTo(projectHandle, true); return;
    }
    restoreHandle(function (rec) {
      if (rec && rec.handle && rec.projectId && rec.projectId === pid) writeTo(rec.handle, true);
      else pick();
    });
  }

  // Make `handle` the file Save writes back to, for the project `projectId`.
  // Called by the caller of openProjectWithPicker once the project has
  // actually been loaded - never before. Adopting at pick time meant a file
  // that then failed to load still became "the project's file", and the next
  // Save wrote the session that was still open over the file the consultant
  // had only tried to open.
  function adoptProjectFile(handle, projectId) {
    if (!handle) return;
    projectHandle = handle;
    projectHandleId = projectId || null;
    persistHandle(handle, projectId);
  }

  // Open a project via the file picker. Same result contract as
  // loadProjectFromFile, plus { aborted } / { unsupported } outcomes and, on
  // success, `handle`: hand it to adoptProjectFile once the load has gone
  // through, so Save writes back to the opened file.
  function openProjectWithPicker(onResult) {
    if (!supportsFilePickers() || typeof window.showOpenFilePicker !== "function") {
      onResult({ ok: false, unsupported: true });
      return;
    }
    // Same PICKER_ID as Save, so Open and Save share one remembered folder:
    // the place this consultant keeps assessments.
    window.showOpenFilePicker({
      id: PICKER_ID,
      types: [{ description: "OT assessment project", accept: { "application/json": [".json"] } }],
      multiple: false
    }).then(function (handles) {
      var handle = handles && handles[0];
      if (!handle) { onResult({ ok: false, aborted: true }); return; }
      handle.getFile().then(function (file) {
        loadProjectFromFile(file, function (res) {
          if (res.ok) {
            // A file predating projectId gets one now, so the id the loaded
            // session carries is the one the handle is later filed under and
            // the one written back on the first save.
            if (res.data && res.data.project && typeof res.data.project === "object") ensureProjectId(res.data.project);
            res.handle = handle;
            res.fileName = handle.name;
          }
          onResult(res);
        });
      }, function (e) { onResult({ ok: false, error: "Could not read file: " + ((e && e.message) || e) }); });
    }, function (e) {
      if (e && e.name === "AbortError") onResult({ ok: false, aborted: true });
      // The browser opens the dialog only in answer to a recent click; the
      // caller can ask for another one rather than show the raw message.
      else if (e && e.name === "SecurityError") onResult({ ok: false, needsGesture: true, error: e.message });
      else onResult({ ok: false, error: (e && e.message) || "open dialog failed" });
    });
  }

  function loadProjectFromFile(file, onResult) {
    var reader = new FileReader();
    // The verdict is reached inside the try and delivered outside it. The
    // callback used to run inside, so anything IT threw was caught here and
    // reported as "Could not parse file" - a second, contradictory result for
    // a file that had parsed perfectly well.
    reader.onload = function () {
      var res;
      try {
        var data = JSON.parse(reader.result);
        if (!data || !data.schemaVersion) {
          res = { ok: false, error: "File does not look like an OT assessment project (no schemaVersion)." };
        } else if (data.schemaVersion === "1.0") {
          res = { ok: true, data: migrateV1(data), migrated: true };
        } else if (data.schemaVersion !== SCHEMA_VERSION) {
          res = { ok: false, error: "Unsupported schema version: " + data.schemaVersion + " (expected " + SCHEMA_VERSION + ")." };
        } else {
          res = { ok: true, data: data };
        }
      } catch (e) {
        res = { ok: false, error: "Could not parse file: " + e.message };
      }
      onResult(res);
    };
    reader.onerror = function () { onResult({ ok: false, error: "Could not read file." }); };
    reader.readAsText(file);
  }

  function versionMismatchMessages(projectFile, instrumentsById) {
    // Walks the project's assessments and reports any whose content version
    // differs from the currently-loaded instrument of the same id.
    var msgs = [];
    if (!projectFile || !projectFile.assessments) return msgs;
    Object.keys(projectFile.assessments).forEach(function (id) {
      var ass = projectFile.assessments[id];
      // The key is an assessment id now; the instrument is a field on it.
      var instrumentId = (ass && ass.instrumentId) || id;
      var inst = instrumentsById[instrumentId];
      // The app never gets here with an unknown instrument: Engine.loadProjectFile
      // refuses such a file before this is asked. Kept so the helper still
      // tells the truth to a caller that has not checked the file first.
      if (!inst) {
        msgs.push("Assessment '" + instrumentId + "' is for an instrument this tool does not have, so its answers are not shown.");
        return;
      }
      var saved = ass.instrumentContentVersion || "";
      var current = inst.contentVersion || "";
      if (saved && current && saved !== current) {
        msgs.push("Assessment '" + id + "' was saved against content version " + saved + ", but this tool has version " + current + ". Items renamed or removed since then may not show correctly.");
      }
    });
    return msgs;
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    defaultProject: defaultProject,
    defaultAssessmentMeta: defaultAssessmentMeta,
    newAssessmentId: newAssessmentId,
    rekeyAssessments: rekeyAssessments,
    findAssessment: findAssessment,
    assessmentLabel: assessmentLabel,
    // Which half of the metadata a field belongs to. Engine.updateMetadata
    // routes on these, and the engagement modal groups on them.
    SHARED_META_KEYS: SHARED_META_KEYS,
    ASSESSMENT_META_KEYS: ASSESSMENT_META_KEYS,
    migrateSiteOntoAssessments: migrateSiteOntoAssessments,
    ensureProjectId: ensureProjectId,
    // Drops the IN-MEMORY handle while leaving the persisted one alone, which
    // is exactly the state a new browser session starts in. The regression this
    // exists for only appears in that state, so it has to be reachable.
    __resetHandleForTests: function () { projectHandle = null; projectHandleId = null; },
    // rec: { handle, projectId } as the store would return it, or null for
    // "nothing persisted". Pass undefined to go back to the real store.
    __setRestoredForTests: function (rec) { restoreOverride = (rec === undefined) ? null : rec; },
    assessmentMeta: assessmentMeta,
    mergedMeta: mergedMeta,
    makeEmptyProject: makeEmptyProject,
    makeEmptyAssessment: makeEmptyAssessment,
    makeEmptyEngagement: makeEmptyEngagement,         // back-compat
    projectionFromProjectAndAssessment: projectionFromProjectAndAssessment,
    saveProject: saveProject,
    saveProjectToFile: saveProjectToFile,
    openProjectWithPicker: openProjectWithPicker,
    adoptProjectFile: adoptProjectFile,
    supportsFilePickers: supportsFilePickers,
    currentFileName: currentFileName,
    currentFileHandle: currentFileHandle,
    forgetProjectFile: forgetProjectFile,
    loadProjectFromFile: loadProjectFromFile,
    suggestedProjectFilename: suggestedProjectFilename,
    suggestedFilename: suggestedFilename,             // back-compat
    versionMismatchMessages: versionMismatchMessages,
    downloadBlob: downloadBlob
  };
})();
