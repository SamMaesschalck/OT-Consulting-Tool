/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */
/* engine.js
 *
 * Generic engagement engine. Holds the loaded instrument, the active engagement,
 * and the currently selected target. Knows nothing about IEC specifics - the
 * scoring profile and taxonomy come from data.
 */
window.App = window.App || {};
window.App.Engine = (function () {
  "use strict";

  // PROJECT MODEL (storage schema 2.0)
  //   state.project       shared organisation metadata, edited once and reused
  //                       across every assessment in this session
  //   state.assessments   dict keyed by instrument id; each entry holds that
  //                       instrument's targets, responses, and targetProfile
  //   state.engagement    a live projection over state.project + the active
  //                       assessment, so existing UI/export code that reads
  //                       engagement.engagement / engagement.responses keeps
  //                       working unchanged. Mutating engagement.engagement.X
  //                       mutates state.project; mutating engagement.targets
  //                       mutates state.assessments[id].targets.
  var state = {
    instrument: null,           // currently active instrument definition
    scoringFamily: null,        // capability-sl | domain-letter | ...
    taxonomy:   null,           // resolved taxonomy (SL only; null for posture)
    profile:    null,           // resolved scoring profile
    project:    null,           // shared project metadata (storage.defaultProject())
    assessments: {},            // { instrumentId: assessment }
    engagement: null,           // projection over project + active assessment
    activeTargetId: null,       // currently focused target within the active assessment
    instruments: [],            // all instruments including stubs (for selector)
    listeners: []
  };

  function on(event, fn) { state.listeners.push({ event: event, fn: fn }); }
  // `info` is optional context for a listener that needs it, e.g. { restored:
  // true } when a failed load puts the previous session back, which is not an
  // edit and should not be treated as one.
  function emit(event, payload, info) {
    state.listeners.forEach(function (l) { if (l.event === event) l.fn(payload, info); });
  }

  // ---- bootstrap --------------------------------------------------------

  function labelFromDimension(dim) {
    if (!dim) return "Site";
    return dim.charAt(0).toUpperCase() + dim.slice(1);
  }

  function loadCatalog() {
    var D = window.App.Data;
    if (!D || !D.index) {
      throw new Error("data/manifest.js is not loaded. Include <script src='data/manifest.js'></script> in your HTML.");
    }
    state.taxonomies = (D.shared && D.shared.taxonomies) || {};
    state.profiles   = (D.shared && D.shared.scoringProfiles) || {};

    state.instruments = (D.index.instruments || []).map(function (entry) {
      // "active-skeleton" is an active instrument whose content is deliberately
      // partial (indicative; e.g. verbatim text pending a licensed reference).
      // It loads and captures like any active instrument; the UI flags it as a
      // skeleton. Every downstream "status === 'active'" gate keeps working
      // because we normalise merged.status to "active" and carry a skeleton flag.
      var isActive = entry.status === "active" || entry.status === "active-skeleton";
      if (isActive) {
        var slot = D.instruments && D.instruments[entry.id];
        var instrumentFile = slot && slot.instrument;
        if (!instrumentFile) {
          throw new Error("Active instrument '" + entry.id + "' has no instrument file loaded. Run scripts/build-data.ps1.");
        }
        // The instrument file is the source of truth for content. Manifest-level
        // metadata (title, scoringFamily, targetDimension) is merged in only as a
        // fallback so a partially-populated instrument file still renders.
        var merged = {};
        for (var k in instrumentFile) {
          if (Object.prototype.hasOwnProperty.call(instrumentFile, k)) merged[k] = instrumentFile[k];
        }
        if (!merged.id)                   merged.id = entry.id;
        if (!merged.title)                merged.title = entry.title;
        if (!merged.scoringFamily)        merged.scoringFamily = entry.scoringFamily;
        if (!merged.targetDimension)      merged.targetDimension = entry.targetDimension;
        if (!merged.targetDimensionLabel) merged.targetDimensionLabel = labelFromDimension(merged.targetDimension);
        // The sidebar groups instruments by 'family'; it lives on the index
        // entry, so carry it across (the instrument file may not repeat it).
        if (!merged.family)               merged.family = entry.family;
        if (entry.indicative)             merged.indicative = true;
        merged.skeleton = (entry.status === "active-skeleton");
        merged.status = "active";
        return merged;
      }
      // Placeholder - manifest entry is what the UI consumes.
      return {
        id: entry.id, title: entry.title, status: "placeholder",
        scoringFamily: entry.scoringFamily,
        targetDimension: entry.targetDimension,
        targetDimensionLabel: entry.targetDimensionLabel || labelFromDimension(entry.targetDimension),
        family: entry.family,
        comingSoon: entry.comingSoon || ""
      };
    });
    return state.instruments;
  }

  function getActiveNarrative() {
    if (!state.instrument || state.instrument.status !== "active") return null;
    var slot = window.App.Data && window.App.Data.instruments && window.App.Data.instruments[state.instrument.id];
    return slot ? (slot.narrative || null) : null;
  }

  function resolveForInstrument(instrument) {
    // capability-sl needs a shared taxonomy (FRs); domain-letter ships its own
    // domains inside the instrument file. Profile is always resolved from the
    // shared scoring-profiles store keyed by id.
    var profile = state.profiles[instrument.scoringProfileRef] || null;
    var taxonomy = null;
    if (instrument.taxonomyRef) {
      taxonomy = state.taxonomies[instrument.taxonomyRef] || null;
    }
    return { taxonomy: taxonomy, profile: profile };
  }

  // ---- project + assessment lifecycle -----------------------------------

  function ensureProject() {
    if (!state.project) state.project = window.App.Storage.defaultProject();
    if (!state.assessments) state.assessments = {};
  }

  // THE active assessment. `assessments` is keyed by assessment id, not by
  // instrument, so a customer file can hold a 62443-3-3 from 2026 and another
  // from 2028. Everything that used to reach for
  // activeAssessment() goes through here.
  function activeAssessment() {
    if (!state.assessments || !state.activeAssessmentId) return null;
    return state.assessments[state.activeAssessmentId] || null;
  }

  // Every assessment in the file for one instrument, oldest visit first, so
  // "the current one" means the latest.
  function assessmentsFor(instrumentId) {
    var all = Object.keys(state.assessments || {}).map(function (k) { return state.assessments[k]; })
      .filter(function (a) { return a && a.instrumentId === instrumentId; });
    all.sort(function (a, b) {
      var da = ((a.engagementMeta || {}).dateOfVisit) || "";
      var db = ((b.engagementMeta || {}).dateOfVisit) || "";
      if (da !== db) return da < db ? -1 : 1;
      return String(a.id) < String(b.id) ? -1 : 1;
    });
    return all;
  }

  function createAssessment(instrument) {
    ensureProject();
    var ass = window.App.Storage.makeEmptyAssessment(instrument);
      // Engagement fields captured before any assessment existed (the picker's
      // strip takes consultant and date of visit) are held on the project as
      // defaults. Seed the first assessment from them, without overwriting
      // anything makeEmptyAssessment has already set.
      (function () {
        var STG = window.App.Storage, meta = ass.engagementMeta || {};
        STG.ASSESSMENT_META_KEYS.forEach(function (k) {
          var v = state.project[k];
          if (v !== undefined && v !== null && v !== "" && !meta[k]) meta[k] = v;
        });
        ass.engagementMeta = meta;
      })();
      // SL family only: the targetProfile carries the default SL pulled from the profile.
      if (instrument.scoringFamily === "capability-sl") {
        var prof = state.profiles[instrument.scoringProfileRef];
        if (prof && typeof prof.defaultTargetSL === "number") {
          ass.targetProfile.defaultTargetSL = prof.defaultTargetSL;
        }
      }
      // CAF family: pick up the default profile id from the profile registry,
      // so the consultant's first interaction with the CAF instrument already
      // has General CAF selected as the comparison target.
      if (instrument.scoringFamily === "caf-achieved") {
        var slot = window.App.Data && window.App.Data.instruments && window.App.Data.instruments[instrument.id];
        var reg = slot && slot.profileRegistry;
        ass.selectedProfileId = (reg && reg.default) || null;
      }
      // Layered CRA: seed the setup phase (in-scope layers, product class,
      // product name) from the instrument's setup defaults so the first render
      // already has all three layers selected.
      if (window.App.ScoringCRA && window.App.ScoringCRA.isCRA(instrument)) {
        ass.craSetup = defaultCRASetup(instrument);
      }
      // Risk appetite: the sector picker and technical-layer toggle.
      if (instrument.scoringFamily === "risk-appetite-coherence") {
        ass.riskAppetiteSetup = defaultRiskAppetiteSetup(instrument);
      }
    state.assessments[ass.id] = ass;
    return ass;
  }

  // The assessment to work on for an instrument: the latest one there is, or a
  // new one if the file has none. A second 2028 review is made deliberately,
  // through newAssessment - never by simply opening the instrument again.
  function ensureAssessmentFor(instrument) {
    ensureProject();
    var existing = assessmentsFor(instrument.id);
    return existing.length ? existing[existing.length - 1] : createAssessment(instrument);
  }

  function rebuildProjection() {
    if (!state.instrument) { state.engagement = null; return; }
    var ass = activeAssessment();
    if (!ass) { state.engagement = null; return; }
    state.engagement = window.App.Storage.projectionFromProjectAndAssessment(state.project, ass);
    if (!ass.targets || ass.targets.length === 0) {
      ass.targets = [{ id: "t-" + Date.now().toString(36), name: (state.instrument.targetDimensionLabel || "Site") + " 1" }];
      state.engagement.targets = ass.targets;
    }
    state.activeTargetId = ass.targets[0].id;
  }

  function activateInstrument(instrumentId) {
    var inst = state.instruments.filter(function (i) { return i.id === instrumentId; })[0];
    if (!inst) throw new Error("Unknown instrument: " + instrumentId);
    state.instrument = inst;
    state.scoringFamily = inst.scoringFamily || null;
    if (inst.status === "placeholder") {
      state.taxonomy = null; state.profile = null;
      emit("instrument-changed", inst);
      return inst;
    }
    var r = resolveForInstrument(inst);
    state.taxonomy = r.taxonomy;
    state.profile  = r.profile;
    if (!state.profile) {
      throw new Error("Instrument '" + inst.id + "' references unknown scoring profile '" + inst.scoringProfileRef + "'.");
    }
    var ass = ensureAssessmentFor(inst);
    state.activeAssessmentId = ass.id;
    rebuildProjection();
    emit("instrument-changed", inst);
    return inst;
  }

  // Open one SPECIFIC assessment - the 2026 one rather than the 2028 one.
  function activateAssessment(assessmentId) {
    ensureProject();
    var ass = state.assessments[assessmentId];
    if (!ass) throw new Error("Unknown assessment: " + assessmentId);
    var inst = state.instruments.filter(function (i) { return i.id === ass.instrumentId; })[0];
    if (!inst) throw new Error("Unknown instrument: " + ass.instrumentId);
    state.instrument = inst;
    state.scoringFamily = inst.scoringFamily || null;
    if (inst.status !== "placeholder") {
      var r = resolveForInstrument(inst);
      state.taxonomy = r.taxonomy;
      state.profile  = r.profile;
    } else {
      state.taxonomy = null; state.profile = null;
    }
    state.activeAssessmentId = assessmentId;
    rebuildProjection();
    emit("instrument-changed", inst);
    return ass;
  }

  // A fresh assessment of an instrument the file already holds one of: the 2028
  // re-assessment alongside the 2026 original. Starts empty - carrying answers
  // forward would make the new read a copy of the old one rather than an
  // assessment - but the customer record is shared, so only the engagement
  // details need filling in.
  function newAssessment(instrumentId, opts) {
    ensureProject();
    var inst = state.instruments.filter(function (i) { return i.id === instrumentId; })[0];
    if (!inst) throw new Error("Unknown instrument: " + instrumentId);
    var ass = createAssessment(inst);
    if (opts && opts.label) ass.label = String(opts.label);
    if (opts && opts.dateOfVisit) {
      window.App.Storage.assessmentMeta(ass, state.project).dateOfVisit = opts.dateOfVisit;
    }
    activateAssessment(ass.id);
    emit("project-changed", state.project);
    return ass;
  }

  function deleteAssessment(assessmentId) {
    if (!state.assessments || !state.assessments[assessmentId]) return false;
    delete state.assessments[assessmentId];
    if (state.activeAssessmentId === assessmentId) {
      var next = Object.keys(state.assessments)[0];
      if (next) activateAssessment(next);
      else { state.activeAssessmentId = null; clearInstrument(); }
    }
    emit("project-changed", state.project);
    return true;
  }

  function renameAssessment(assessmentId, label) {
    var ass = state.assessments && state.assessments[assessmentId];
    if (!ass) return;
    var v = String(label || "").trim();
    if (v) ass.label = v; else delete ass.label;
    emit("project-changed", state.project);
  }

  // Everything in the file, for the picker: which instrument, how it is
  // labelled, how far through it is, and whether it is the one open now.
  function listAssessments() {
    var STG = window.App.Storage;
    return Object.keys(state.assessments || {}).map(function (id) {
      var ass = state.assessments[id];
      var inst = state.instruments.filter(function (i) { return i.id === ass.instrumentId; })[0] || null;
      var m = STG.assessmentMeta(ass, state.project);
      return {
        id: id,
        instrumentId: ass.instrumentId,
        instrumentTitle: (inst && inst.title) || ass.instrumentId,
        label: STG.assessmentLabel(ass, inst),
        hasOwnLabel: !!String(ass.label || "").trim(),
        dateOfVisit: m.dateOfVisit || "",
        opportunityId: m.opportunityId || "",
        answered: (ass.responses || []).length,
        active: id === state.activeAssessmentId
      };
    }).sort(function (a, b) {
      if (a.instrumentTitle !== b.instrumentTitle) return a.instrumentTitle < b.instrumentTitle ? -1 : 1;
      return (a.dateOfVisit || "") < (b.dateOfVisit || "") ? -1 : 1;
    });
  }

  // Drop back to "no instrument chosen". The catalogue stays loaded; only the
  // selection and its derived projection are cleared, so the UI can show the
  // assessment picker (New project, or "change" from the sidebar). Captured
  // answers live in state.assessments and are untouched - reselecting an
  // instrument brings its responses straight back.
  function clearInstrument() {
    state.instrument = null;
    state.scoringFamily = null;
    state.taxonomy = null;
    state.profile = null;
    state.engagement = null;
    state.activeTargetId = null;
    emit("instrument-changed", null);
  }

  function newProject() {
    state.project = window.App.Storage.defaultProject();
    state.assessments = {};
    state.activeAssessmentId = null;
    state.createdAt = null;              // stamped when first written
    state.createdWithVersion = undefined; // a new project: this version
    if (state.instrument && state.instrument.status === "active") {
      state.activeAssessmentId = ensureAssessmentFor(state.instrument).id;
      rebuildProjection();
    } else {
      state.engagement = null;
    }
    emit("project-changed", state.project);
    emit("engagement-changed", state.engagement);
  }

  // Back-compat: callers still expecting newEngagement() get a project reset.
  function newEngagement() { newProject(); }

  // ---- loading a project file ---------------------------------------------
  // A load replaces the whole session or changes nothing. It used to swap
  // state.project and state.assessments first and only then activate, so a
  // file naming an instrument this build does not have (or holding something
  // other than a list where the targets belong) threw half way through: the
  // screen still showed the old assessment, edits went to objects nothing would
  // ever save, getProjectFile() returned the other file's data, and the caller
  // was told the session was unchanged. Now the file is checked before anything
  // is touched, the new state is built aside, and the commit is undone if any
  // part of it fails.

  function loadError(message, code, extra) {
    var e = new Error(message);
    e.code = code;
    if (extra) Object.keys(extra).forEach(function (k) { e[k] = extra[k]; });
    return e;
  }
  function isRecord(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }

  // Everything that would make the load fail part way, found while the current
  // session is still intact. Throws an Error carrying `code`:
  //   "malformed"           - the shape is not a project file's
  //   "unknown-instrument"  - an assessment of something this build cannot
  //                           open; `instruments` names them
  // A placeholder counts as missing: its entry exists only to say "coming
  // soon", and it has nothing to show the answers against.
  function checkProjectFile(projectFile) {
    if (!isRecord(projectFile)) throw loadError("it does not contain a project", "malformed");
    if (projectFile.project != null && !isRecord(projectFile.project)) {
      throw loadError("its customer record is not readable", "malformed");
    }
    if (projectFile.assessments != null && !isRecord(projectFile.assessments)) {
      throw loadError("its list of assessments is not readable", "malformed");
    }
    var missing = [];
    Object.keys(projectFile.assessments || {}).forEach(function (key) {
      var ass = projectFile.assessments[key];
      if (ass == null) return;                      // rekeyAssessments skips these
      if (!isRecord(ass)) throw loadError("one of its assessments is not readable", "malformed");
      var instrumentId = ass.instrumentId || key;
      var inst = state.instruments.filter(function (i) { return i.id === instrumentId; })[0];
      // Named as the consultant knows it; the raw id only when this copy has
      // no title for it.
      var named = "the " + ((inst && inst.title) || instrumentId) + " assessment's ";
      ["targets", "responses"].forEach(function (k) {
        if (ass[k] == null) return;                 // filled in with defaults below
        if (!Array.isArray(ass[k]) || !ass[k].every(isRecord)) {
          throw loadError(named + (k === "targets" ? "sites or zones" : "answers") + " are not readable", "malformed");
        }
      });
      ["targetProfile", "engagementMeta"].forEach(function (k) {
        if (ass[k] != null && !isRecord(ass[k])) {
          throw loadError(named + (k === "targetProfile" ? "target levels" : "engagement details") + " are not readable", "malformed");
        }
      });
      if (!inst || inst.status !== "active") {
        var name = inst ? (inst.title || inst.id) : String(instrumentId);
        if (missing.indexOf(name) === -1) missing.push(name);
      }
    });
    if (missing.length) {
      throw loadError("it contains assessments this copy cannot open (" + missing.join(", ") + ")",
        "unknown-instrument", { instruments: missing });
    }
  }

  // Everything a load replaces, so a failed commit can put it all back.
  var SESSION_FIELDS = ["project", "assessments", "activeAssessmentId", "instrument", "scoringFamily",
    "taxonomy", "profile", "engagement", "activeTargetId", "createdAt", "createdWithVersion", "savedWithVersion"];
  function snapshotSession() {
    var snap = {};
    SESSION_FIELDS.forEach(function (k) { snap[k] = state[k]; });
    return snap;
  }
  function restoreSession(snap) {
    SESSION_FIELDS.forEach(function (k) { state[k] = snap[k]; });
  }

  function loadProjectFile(projectFile) {
    checkProjectFile(projectFile);
    // The checks cover what a real file gets wrong; anything stranger that
    // only shows up while the new session is built is still a file this copy
    // cannot read, and is reported as that rather than as a script error.
    var built;
    try { built = buildLoadedSession(projectFile); }
    catch (e) {
      if (e && e.code) throw e;
      throw loadError("its contents are not in a form this copy can read", "malformed",
        { detail: String(e && e.message ? e.message : e) });
    }
    var project = built.project, assessments = built.assessments, preferredId = built.preferredId;

    // ---- commit, undone in full if any of it fails ----
    var before = snapshotSession();
    try {
      state.project = project;
      state.assessments = assessments;
      // When and with which version the file was first made. Both used to be
      // re-stamped on every save, because nothing carried them through. A file
      // from before versions were recorded stays unknown rather than claiming
      // the version that happened to open it.
      state.createdAt = projectFile.createdAt || null;
      state.createdWithVersion = projectFile.createdWithVersion || null;
      state.savedWithVersion = projectFile.savedWithVersion || null;
      if (preferredId && assessments[preferredId]) {
        activateAssessment(preferredId);
      } else if (state.instruments[0]) {
        activateInstrument(state.instruments[0].id);
      }
      emit("project-changed", state.project);
    } catch (e) {
      restoreSession(before);
      // A listener may already have redrawn the screen for the file that
      // failed; draw the session that is still open. Its own failure must not
      // hide the one being reported.
      try {
        emit("instrument-changed", state.instrument, { restored: true });
        emit("project-changed", state.project, { restored: true });
      } catch (e2) {}
      throw e;
    }
  }

  // The session a file describes, built without touching `state`.
  function buildLoadedSession(projectFile) {
    var STG = window.App.Storage;
    // The loaded file's own projectId must survive: save-in-place keys its
    // retained handle on it, and a fresh id here would make the file look like
    // a different project and send Save back to the dialogue every time.
    var project = Object.assign(STG.defaultProject(), projectFile.project || {});
    STG.ensureProjectId(project);
    // Older files keyed `assessments` by instrument id, which is what limited a
    // customer to one assessment per instrument. Rekey on load; `moved` lets the
    // old activeInstrumentId still point somewhere.
    var re = STG.rekeyAssessments(projectFile.assessments || {});
    var assessments = re.assessments;
    // Defensive: make sure each loaded assessment has the required keys.
    Object.keys(assessments).forEach(function (id) {
      var ass = assessments[id];
      ass.id = ass.id || id;
      if (!ass.targetProfile) ass.targetProfile = { defaultTargetSL: 2, perFR: {}, perZone: {} };
      if (!ass.targets || ass.targets.length === 0) {
        ass.targets = [{ id: "t-" + Date.now().toString(36), name: "Site 1" }];
      }
      if (!ass.responses) ass.responses = [];
    });
    // The site belongs to the assessment. Older files recorded it once for the
    // whole customer, which could not express a 62443-3-3 at Manchester and
    // another at Birmingham in one file.
    STG.migrateSiteOntoAssessments(project, assessments);
    // Migrate a legacy PROJECT-level basis of assessment (older files stored one
    // shared register) onto the assessment that was active when saved, so the
    // evidence is preserved without bleeding into every instrument's report.
    var legacyBasis = project.basisOfAssessment;
    var legacyHasContent = legacyBasis && ["interviews", "documents", "observations"].some(function (k) {
      return (legacyBasis[k] || []).some(function (r) { return r && Object.keys(r).some(function (kk) { return String(r[kk] || "").trim() !== ""; }); });
    });
    if (legacyHasContent) {
      var legacyKey = re.moved[projectFile.activeInstrumentId] || Object.keys(assessments)[0];
      var target = assessments[legacyKey];
      if (target && !target.basisOfAssessment) target.basisOfAssessment = legacyBasis;
    }
    delete project.basisOfAssessment;

    // activeAssessmentId is what a current file carries; activeInstrumentId is
    // the older field, translated through the rekey.
    var preferredId = projectFile.activeAssessmentId
      || re.moved[projectFile.activeInstrumentId]
      || Object.keys(assessments)[0];
    return { project: project, assessments: assessments, preferredId: preferredId };
  }

  // Back-compat: some test fixtures still call setEngagement(data) with a
  // schema-1.0 shape; transparently migrate it via Storage and reload.
  function setEngagement(data) {
    if (data && data.schemaVersion === "2.0") { loadProjectFile(data); return; }
    if (data && data.engagement) {
      // It's a v1 engagement-shaped object; wrap and route.
      var v2 = {
        schemaVersion: "2.0",
        project: data.engagement,
        activeInstrumentId: data.instrumentId,
        assessments: (function () {
          var m = {};
          m[data.instrumentId] = {
            instrumentId: data.instrumentId,
            instrumentContentVersion: data.instrumentContentVersion || "",
            targetProfile: data.targetProfile || { defaultTargetSL: 2, perFR: {}, perZone: {} },
            targets: data.targets || [],
            responses: data.responses || []
          };
          return m;
        })()
      };
      loadProjectFile(v2);
    }
  }

  // Engagement metadata has two homes: the customer and site belong to the
  // file, the opportunity / who / when / document control belong to THIS
  // assessment. One patch can carry both, so it is split on the way in.
  //
  // engagement.engagement is a merge of the two, and keeps its object identity
  // across updates - anything holding a reference to it (the exporters, the
  // report) keeps seeing current values without re-reading the projection.
  function updateMetadata(patch) {
    ensureProject();
    var STG = window.App.Storage;
    var shared = {}, own = {}, k;
    for (k in patch) {
      if (!Object.prototype.hasOwnProperty.call(patch, k)) continue;
      if (STG.ASSESSMENT_META_KEYS.indexOf(k) !== -1) own[k] = patch[k];
      else shared[k] = patch[k];
    }
    Object.assign(state.project, shared);

    var ass = activeAssessment();
    if (ass && Object.keys(own).length) {
      Object.assign(STG.assessmentMeta(ass, state.project), own);
    } else if (Object.keys(own).length) {
      // No assessment exists yet. The picker's engagement strip is filled in
      // BEFORE a framework is chosen, so consultant and date of visit arrive
      // with nowhere assessment-shaped to live; dropping them meant the
      // consultant typed them, watched them vanish on the next render, and had
      // to type them again later. Hold them on the project as defaults -
      // createAssessment seeds the first assessment from these.
      Object.assign(state.project, own);
    }
    refreshEngagementMeta();
    emit("project-changed", state.project);
    emit("engagement-changed", state.engagement);
  }

  // Rebuild the merged block IN PLACE, so the projection's engagement object is
  // never swapped for a new one.
  function refreshEngagementMeta() {
    if (!state.engagement) return;
    var ass = activeAssessment();
    window.App.Storage.mergedMeta(state.project, ass, state.engagement.engagement);
  }

  // The metadata for THIS assessment only, or the shared record when nothing is
  // open (the picker screen can still edit the customer).
  function getAssessmentMeta() {
    var ass = activeAssessment();
    return ass ? window.App.Storage.assessmentMeta(ass, state.project) : null;
  }

  // Per-assessment consultant report narrative (e.g. NIS2 executive-summary
  // exposure note and top priorities). Stored on the active assessment so it
  // persists with save/load and rides into the engagement projection.
  function getReportNarrative() {
    if (!state.instrument) return {};
    var ass = activeAssessment();
    return (ass && ass.reportNarrative) || {};
  }
  function setReportNarrative(patch) {
    if (!state.instrument) return;
    var ass = activeAssessment();
    if (!ass) return;
    ass.reportNarrative = Object.assign({}, ass.reportNarrative || {}, patch);
    if (state.engagement) state.engagement.reportNarrative = ass.reportNarrative;
    emit("engagement-changed", state.engagement);
  }

  // ---- report customisation --------------------------------------------
  //
  // Per-section overrides the consultant sets from the report page: rename a
  // section, hide it, replace its generated prose, add a note, reorder a list.
  // Keyed by the section slug (Report.sectionKey), which is derived from the
  // GENERATED heading so a renamed section keeps its key. Same per-assessment
  // scope as reportNarrative, and it rides the same save/load projection.
  function getReportCustom() {
    if (!state.instrument) return {};
    var ass = activeAssessment();
    return (ass && ass.reportCustom) || {};
  }
  function getReportSection(key) {
    return getReportCustom()[key] || {};
  }
  // Patch fields; a field set to null or "" is removed, and a section left with
  // nothing is dropped entirely, so "no customisation" never persists as clutter
  // and `hasReportCustom` stays honest.
  function setReportSection(key, patch) {
    if (!state.instrument || !key) return;
    var ass = activeAssessment();
    if (!ass) return;
    if (!ass.reportCustom) ass.reportCustom = {};
    window.App.ReportSections.patchSection(ass.reportCustom, key, patch);
    if (state.engagement) state.engagement.reportCustom = ass.reportCustom;
    emit("engagement-changed", state.engagement);
  }
  function clearReportSection(key) {
    if (!state.instrument || !key) return;
    var ass = activeAssessment();
    if (!ass || !ass.reportCustom) return;
    delete ass.reportCustom[key];
    if (state.engagement) state.engagement.reportCustom = ass.reportCustom;
    emit("engagement-changed", state.engagement);
  }
  function hasReportCustom() {
    return Object.keys(getReportCustom()).length > 0;
  }

  // ---- review (comments from the report review tool) --------------------
  // Per-assessment, kept on the assessment itself and deliberately NOT on the
  // engagement projection (Storage.projectionFromProjectAndAssessment): the
  // exporters read the projection, so a review can never reach Word or Excel.
  // A file saved before reviews existed simply has none. See js/review.js.
  function getReview() {
    var ass = activeAssessment();
    return (ass && ass.review) || null;
  }
  function setReview(store) {
    var ass = activeAssessment();
    if (!ass) return;
    ass.review = store;
    touchReview();
  }
  // The store changed: unsaved work and an autosave, but no re-render, as
  // nothing the report page draws from the engagement has changed.
  function touchReview() { emit("responses-changed", null); }

  // ---- basis of assessment (evidence register) --------------------------
  // Per-assessment (like reportNarrative): the documents reviewed, systems
  // observed and people interviewed are specific to the ACTIVE instrument's
  // assessment and never bleed into another instrument's report. Returns the
  // live, normalised object; callers mutate its arrays in place and persist via
  // the usual save/autosave path. Falls back to a transient store only when no
  // instrument is active (nothing to persist against anyway).
  var _transientBasis = null;
  function getBasisOfAssessment() {
    var ass = activeAssessment();
    var host = ass || (_transientBasis = _transientBasis || {});
    var b = host.basisOfAssessment;
    if (!b || typeof b !== "object") b = host.basisOfAssessment = {};
    if (!Array.isArray(b.interviews))   b.interviews = [];
    if (!Array.isArray(b.documents))    b.documents = [];
    if (!Array.isArray(b.observations)) b.observations = [];
    // Keep the active engagement projection pointing at the live object.
    if (state.engagement) state.engagement.basisOfAssessment = b;
    return b;
  }
  // Notify listeners (drives autosave + header summary) after a structural or
  // field change to the basis register.
  function touchBasisOfAssessment() {
    emit("engagement-changed", state.engagement);
  }

  // ---- re-assessment baseline (progress since previous assessment) ------
  // A snapshot of a previous engagement's responses for this instrument
  // (built by App.Compare.extractBaseline). Stored on the active assessment
  // so it persists through save/load; the loader keeps unknown keys, so no
  // storage migration is needed.
  function getBaseline() {
    if (!state.instrument) return null;
    var ass = activeAssessment();
    return (ass && ass.baseline) || null;
  }
  function setBaseline(baseline) {
    if (!state.instrument) return;
    var ass = activeAssessment();
    if (!ass) return;
    if (baseline) ass.baseline = baseline;
    else delete ass.baseline;
    emit("engagement-changed", state.engagement);
  }
  function clearBaseline() { setBaseline(null); }
  // Pin which baseline target the current target is compared against (only
  // needed when the baseline file held several targets).
  function setBaselineTarget(currentTargetId, baselineTargetId) {
    var b = getBaseline();
    if (!b) return;
    b.targetMap = b.targetMap || {};
    if (baselineTargetId) b.targetMap[currentTargetId] = baselineTargetId;
    else delete b.targetMap[currentTargetId];
    emit("engagement-changed", state.engagement);
  }

  function getProjectFile() {
    // A project begun in this session was created with this version. One
    // loaded from a file keeps what the file says: null for a file from
    // before versions were recorded, which stays unknown.
    var V = window.App.Version;
    if (state.createdWithVersion === undefined) state.createdWithVersion = V ? V.number : null;
    var pf = {
      schemaVersion: window.App.Storage.SCHEMA_VERSION,
      project: state.project || window.App.Storage.defaultProject(),
      activeAssessmentId: state.activeAssessmentId || null,
      // Kept so a file written now still opens in an older build, which reads
      // this field and knows nothing of assessment ids.
      activeInstrumentId: state.instrument ? state.instrument.id : null,
      assessments: state.assessments || {},
      createdAt: state.createdAt || (state.createdAt = new Date().toISOString()),
      updatedAt: new Date().toISOString()
    };
    // Which version of the tool made the file, and which last wrote it, so a
    // project sent back says what the consultant was using. Never in a report:
    // see js/version.js.
    if (state.createdWithVersion) pf.createdWithVersion = state.createdWithVersion;
    if (V) pf.savedWithVersion = V.number;
    return pf;
  }

  // Which instruments in this project have actually been answered. A 62443-3-3
  // or -4-2 result is a technical-conformance figure; whether the organisation
  // also runs a security programme is a 62443-2-1 question, and the report has
  // to say which of the two it is standing on.
  function answeredInstrumentIds() {
    var ids = [];
    Object.keys(state.assessments || {}).forEach(function (id) {
      var ass = state.assessments[id];
      var answered = (ass && ass.responses || []).some(function (r) {
        if (r.state != null && r.state !== "") return true;
        if (r.ml != null && r.ml !== "") return true;
        if (typeof r.band === "number") return true;                    // domain-letter
        if (typeof r.band === "string" && r.band !== "") return true;   // risk appetite: a named band
        if (r.notEstablished === true) return true;                     // risk appetite: could not establish
        if (r.components && Object.keys(r.components).length) return true;
        return false;
      });
      if (answered) ids.push(id);
    });
    return ids;
  }

  function setDefaultTargetSL(sl) {
    state.engagement.targetProfile.defaultTargetSL = sl;
    emit("targets-changed", state.engagement.targetProfile);
  }

  function setFRTarget(frId, sl) {
    if (sl === null || sl === undefined) {
      delete state.engagement.targetProfile.perFR[frId];
    } else {
      state.engagement.targetProfile.perFR[frId] = sl;
    }
    emit("targets-changed", state.engagement.targetProfile);
  }

  // ---- risk context import (capability-sl) -------------------------------
  // Zones + per-zone SL-Ts exported by the sibling risk tool as an
  // spt-risk-context file. The whole parsed context is kept on the active
  // assessment for provenance; scoping creates one target per selected zone
  // and records its SL-T in targetProfile.perZone keyed by the new target id.
  // Conduits are stored but not scored. No import file = no behaviour change.

  // FR id keyed by the abbreviation the interchange uses (IAC, UC, SI, ...),
  // from the shared taxonomy so the mapping is never hardcoded here.
  function frIdByAbbr() {
    var map = {};
    var tax = state.taxonomy || {};
    (tax.frs || []).forEach(function (fr) { if (fr.abbr) map[fr.abbr] = fr.id; });
    return map;
  }

  function getRiskContext() {
    if (!state.instrument) return null;
    var ass = activeAssessment();
    return (ass && ass.riskContext) || null;
  }

  function setRiskContext(ctx, options) {
    if (!state.instrument || !ctx) return;
    var ass = activeAssessment();
    if (!ass) return;
    var opts = options || {};
    ass.riskContext = {
      schema: ctx.schema,
      generatedBy: ctx.generatedBy || "",
      generatedOn: ctx.generatedOn || "",
      importedOn: new Date().toISOString().slice(0, 10),
      fileName: opts.fileName || "",
      suc: ctx.suc || {},
      zones: ctx.zones || [],
      conduits: ctx.conduits || []
    };
    // Every recorded approval (a later 1.4 file), kept as provenance with the
    // rest; nothing here reads it. Absent from older files, so absent here.
    if (Array.isArray(ctx.approvals)) ass.riskContext.approvals = ctx.approvals;
    if (!ass.targetProfile.perZone) ass.targetProfile.perZone = {};

    if (opts.scope && opts.zoneIds && opts.zoneIds.length > 0) {
      var byId = {};
      (ctx.zones || []).forEach(function (z) { byId[z.id] = z; });
      // Existing sites are only replaced when none of them holds a response;
      // captured work is never thrown away - the zones are appended instead.
      var existingIds = {};
      ass.targets.forEach(function (t) { existingIds[t.id] = true; });
      // shared answers count as captured work too: they are inherited by
      // the very zones a replace would delete, so an assessment answered
      // entirely on that layer must not read as empty.
      var hasResponses = (ass.responses || []).some(function (r) {
        return existingIds[r.targetId] || r.targetId === SHARED_TARGET_ID;
      });
      var created = [];
      opts.zoneIds.forEach(function (zid, i) {
        var z = byId[zid];
        if (!z) return;
        var t = { id: "t-" + Date.now().toString(36) + "-z" + (i + 1), name: z.name, zoneId: z.id,
                  zoneType: z.type || "zone" };
        // The interchange has carried a per-FR SL-T vector (slTargetByFR,
        // keyed by FR abbreviation) since v1.1, but this only ever read the
        // flattened scalar, so the vector arrived and was discarded. Take the
        // vector when it is there and fall back to the scalar otherwise.
        var entry = { default: (typeof z.slTarget === "number" ? z.slTarget : null), perFR: {} };
        if (z.slTargetByFR && typeof z.slTargetByFR === "object") {
          var byAbbr = frIdByAbbr();
          Object.keys(z.slTargetByFR).forEach(function (abbr) {
            var frId = byAbbr[abbr];
            var v = z.slTargetByFR[abbr];
            if (frId && typeof v === "number") entry.perFR[frId] = v;
          });
        }
        if (entry.default !== null || Object.keys(entry.perFR).length) {
          ass.targetProfile.perZone[t.id] = entry;
        }
        created.push(t);
      });
      if (created.length > 0) {
        // Mutate the array in place - state.engagement.targets aliases it.
        if (!hasResponses) ass.targets.length = 0;
        created.forEach(function (t) { ass.targets.push(t); });
        state.activeTargetId = ass.targets[0].id;
      }
    }
    emit("targets-changed", state.engagement.targetProfile);
  }

  function clearRiskContext() {
    if (!state.instrument) return;
    var ass = activeAssessment();
    if (!ass) return;
    delete ass.riskContext;
    // Targets created from zones stay - they are the consultant's data now -
    // but the imported per-zone SL-Ts fall away with the context.
    if (ass.targetProfile) ass.targetProfile.perZone = {};
    emit("targets-changed", state.engagement.targetProfile);
  }

  // ---- per-zone SL-T (ISA/IEC 62443-3-2) --------------------------------
  //
  // Each zone and conduit carries its own SL-T, and SL-T is a vector across
  // the seven FRs. perZone[targetId] is { default, perFR } - see
  // Scoring.effectiveTargetSL for the resolution order. Older saved files hold
  // a bare number here; every read goes through zoneTargetEntry so both shapes
  // work and a load never has to rewrite the file.
  function zoneTargetEntry(targetId, create) {
    var tp = state.engagement.targetProfile;
    if (!tp.perZone) tp.perZone = {};
    var cur = tp.perZone[targetId];
    if (cur === undefined || cur === null) {
      if (!create) return null;
      cur = { default: null, perFR: {} };
      tp.perZone[targetId] = cur;
      return cur;
    }
    if (typeof cur === "number") {           // migrate the legacy scalar in place
      cur = { default: cur, perFR: {} };
      tp.perZone[targetId] = cur;
    }
    if (!cur.perFR) cur.perFR = {};
    return cur;
  }

  // Read-only view of a zone's SL-T, normalised. Never creates an entry.
  function getZoneTarget(targetId) {
    var tp = (state.engagement && state.engagement.targetProfile) || {};
    if (!tp.perZone || !(targetId in tp.perZone)) return null;
    return window.App.Scoring.normaliseZoneTarget(tp.perZone[targetId]);
  }

  // The zone's default SL-T across all FRs. null clears it, so the zone falls
  // back to the engagement-wide setting.
  function setZoneTarget(targetId, sl) {
    var e = zoneTargetEntry(targetId, true);
    e.default = (sl === null || sl === undefined) ? null : sl;
    pruneZoneTarget(targetId);
    emit("targets-changed", state.engagement.targetProfile);
  }

  // One FR of the zone's SL-T vector. null clears just that FR.
  function setZoneFRTarget(targetId, frId, sl) {
    var e = zoneTargetEntry(targetId, true);
    if (sl === null || sl === undefined) delete e.perFR[frId];
    else e.perFR[frId] = sl;
    pruneZoneTarget(targetId);
    emit("targets-changed", state.engagement.targetProfile);
  }

  // Drop an entry that no longer says anything, so a cleared zone does not
  // linger in the saved file and read as "has an override".
  function pruneZoneTarget(targetId) {
    var tp = state.engagement.targetProfile;
    var e = tp.perZone && tp.perZone[targetId];
    if (!e || typeof e === "number") return;
    if (e.default === null && Object.keys(e.perFR || {}).length === 0) delete tp.perZone[targetId];
  }

  // ---- CAF profile selection (caf-achieved family) ----------------------

  function getCAFProfileRegistry() {
    if (!state.instrument || state.scoringFamily !== "caf-achieved") return null;
    var slot = window.App.Data && window.App.Data.instruments && window.App.Data.instruments[state.instrument.id];
    return (slot && slot.profileRegistry) || null;
  }
  function getCAFProfiles() {
    if (!state.instrument || state.scoringFamily !== "caf-achieved") return {};
    var slot = window.App.Data && window.App.Data.instruments && window.App.Data.instruments[state.instrument.id];
    return (slot && slot.profiles) || {};
  }
  function getActiveCAFProfileId() {
    var ass = activeAssessment();
    if (!ass) return null;
    var id = ass.selectedProfileId || null;
    // Guard against a stored id that no longer exists in the registry (e.g. a
    // project saved against a removed/renamed profile). Fall back to the
    // registry default rather than leaving the selector with nothing chosen
    // and the overlay silently empty.
    var reg = getCAFProfileRegistry();
    if (!reg) return id;
    var exists = id && (reg.profiles || []).some(function (p) { return p.id === id; });
    return exists ? id : (reg.default || null);
  }

  // Registry metadata for a profile id, enriched with the profileVersion from
  // the loaded profile file (registry entries don't carry the version). Used
  // by the two-step picker to show status + version next to each option.
  function getCAFProfileMeta(profileId) {
    var reg = getCAFProfileRegistry();
    if (!reg) return null;
    var entry = (reg.profiles || []).filter(function (p) { return p.id === profileId; })[0];
    if (!entry) return null;
    var full = getCAFProfiles()[profileId] || null;
    var meta = {};
    for (var k in entry) { if (Object.prototype.hasOwnProperty.call(entry, k)) meta[k] = entry[k]; }
    meta.profileVersion = (full && full.profileVersion) || entry.profileVersion || "UNSET";
    return meta;
  }
  function getActiveCAFProfileMeta() {
    return getCAFProfileMeta(getActiveCAFProfileId());
  }

  // Groups the registry profiles by sector/regulator for step 1 of the
  // picker. Each group lists its level variants (basic/enhanced) for step 2.
  // General is its own single-entry group with no level step.
  function getCAFProfileGroups() {
    var reg = getCAFProfileRegistry();
    if (!reg) return [];
    var order = [];
    var byKey = {};
    (reg.profiles || []).forEach(function (p) {
      var isGeneral = (p.sectorRegulator === "none") || (p.sector === "general");
      var key = isGeneral ? "general" : (p.sectorRegulator + "|" + p.sector);
      if (!byKey[key]) {
        byKey[key] = {
          key: key,
          isGeneral: isGeneral,
          sectorRegulator: p.sectorRegulator,
          sectorRegulatorName: p.sectorRegulatorName || p.sectorRegulator,
          sector: p.sector,
          sectorName: p.sectorName || p.sector,
          label: isGeneral ? p.name : ((p.sectorRegulatorName || p.sectorRegulator) + " - " + (p.sectorName || p.sector)),
          profiles: [],
          levels: []
        };
        order.push(byKey[key]);
      }
      byKey[key].profiles.push(p);
      if (p.level && p.level !== "n/a") byKey[key].levels.push(p);
    });
    return order;
  }
  function getCAFGroupKeyForProfile(profileId) {
    var groups = getCAFProfileGroups();
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].profiles.some(function (p) { return p.id === profileId; })) return groups[i].key;
    }
    return null;
  }
  function getActiveCAFProfile() {
    // Returns the FULL profile object (overlay etc.) from
    // App.Data.instruments[...].profiles[<id>] when it has been loaded. For a
    // placeholder profile listed only in the registry, the full file is not
    // on disk and this returns null - callers should fall back to the
    // registry entry for name/status and treat overlay as unavailable.
    var id = getActiveCAFProfileId();
    if (!id) return null;
    return getCAFProfiles()[id] || null;
  }
  function getActiveCAFOverlay() {
    var p = getActiveCAFProfile();
    return p ? (p.overlay || {}) : {};
  }
  function setCAFProfile(profileId) {
    var ass = activeAssessment();
    if (!ass) return;
    ass.selectedProfileId = profileId || null;
    emit("caf-profile-changed", profileId);
    emit("engagement-changed", state.engagement);
  }

  // ---- risk-appetite setup phase ----------------------------------------
  // Stored on the assessment (assessment.riskAppetiteSetup) so it saves and
  // loads like any answer. Shape:
  //   { sectorId,            // picks the baseline exposure band
  //     includeTech,         // the optional technical layer
  //     modifiers: [ids],    // exposure modifiers the assessor applied
  //     exposureBand,        // assessor's override of the rolled-up band
  //     appetiteBand, revealedBand }
  // The bands are overrides, not the answer: leave one blank and the section
  // roll-up (or, for exposure, the sector baseline) supplies it. That is the
  // whole "tool scaffolds, assessor decides" contract in one field.
  function defaultRiskAppetiteSetup(instrument) {
    return window.App.ScoringRiskAppetite
      ? window.App.ScoringRiskAppetite.defaultSetup(instrument)
      : { sectorId: "", includeTech: false, modifiers: [] };
  }
  function getRiskAppetiteSetup() {
    if (!state.instrument) return defaultRiskAppetiteSetup({});
    var ass = activeAssessment();
    if (!ass) return defaultRiskAppetiteSetup(state.instrument);
    if (!ass.riskAppetiteSetup) ass.riskAppetiteSetup = defaultRiskAppetiteSetup(state.instrument);
    var s = ass.riskAppetiteSetup;
    if (!s.modifiers) s.modifiers = [];
    return s;
  }
  function updateRiskAppetiteSetup(patch) {
    var s = getRiskAppetiteSetup();
    Object.keys(patch || {}).forEach(function (k) { s[k] = patch[k]; });
    emit("engagement-changed", state.engagement);
  }
  // Turning the technical layer off does NOT delete its answers: a consultant
  // who toggles it while exploring would otherwise lose the interview they just
  // recorded. The layer is excluded from the read instead.
  function riskAppetiteTechIncluded() {
    return !!getRiskAppetiteSetup().includeTech;
  }
  // The sections to show: the optional technical layer only when it is in play.
  function getRiskAppetiteSections() {
    if (!state.instrument) return [];
    var tech = riskAppetiteTechIncluded();
    return (state.instrument.sections || []).filter(function (s) {
      return !s.optional || tech;
    });
  }
  function getRiskAppetiteItems(sectionId) {
    if (!state.instrument) return [];
    return (state.instrument.items || []).filter(function (it) { return it.sectionId === sectionId; });
  }

  // ---- CRA setup phase (layered conformance) ----------------------------
  // Stored on the assessment (assessment.craSetup) so it persists through
  // save/load. Shape:
  //   { layers: [ids],                       // in scope for the whole engagement
  //     products: { [targetId]: { productClass, productCategory, productName } } }
  // Product classification is PER TARGET (per product): CRA Annex I Part I is a
  // per-product assessment, so each target/product has its own class, category
  // and name. Layers in scope are shared across the engagement.
  function defaultCRASetup(instrument) {
    var layerSel = (instrument.setup || []).filter(function (s) { return s.type === "layer-select"; })[0];
    var layers = (layerSel && layerSel.default && layerSel.default.length)
      ? layerSel.default.slice()
      : (instrument.layers || []).map(function (l) { return l.id; });
    return { layers: layers, products: {} };
  }
  // The raw per-assessment CRA setup (shared layers + per-target products map).
  function getCRASetupRaw() {
    if (!state.instrument) return { layers: [], products: {} };
    var ass = activeAssessment();
    if (!ass) return defaultCRASetup(state.instrument);
    if (!ass.craSetup) ass.craSetup = defaultCRASetup(state.instrument);
    var cs = ass.craSetup;
    // Migrate an older flat craSetup (productClass at top level) into products.
    if (!cs.products) {
      cs.products = {};
      if (cs.productClass || cs.productCategory || cs.productName) {
        var firstT = (state.engagement && state.engagement.targets && state.engagement.targets[0]) || null;
        if (firstT) cs.products[firstT.id] = { productClass: cs.productClass || "default", productCategory: cs.productCategory || "", productName: cs.productName || "" };
      }
      delete cs.productClass; delete cs.productCategory; delete cs.productName; delete cs.expectedDefault;
    }
    // Normalise: keep only declared layers, in author order.
    var declared = (state.instrument.layers || []).map(function (l) { return l.id; });
    cs.layers = declared.filter(function (id) { return (cs.layers || []).indexOf(id) !== -1; });
    return cs;
  }
  // The product entry for a target (created on demand).
  function craProductEntry(targetId) {
    var cs = getCRASetupRaw();
    if (!cs.products[targetId]) cs.products[targetId] = { productClass: "default", productCategory: "", productName: "" };
    return cs.products[targetId];
  }
  // Flat setup for the ACTIVE target (used by the UI and scoreActiveTarget).
  function getCRASetup() {
    var raw = getCRASetupRaw();
    return window.App.ScoringCRA
      ? window.App.ScoringCRA.flattenSetup(raw, state.activeTargetId)
      : { layers: raw.layers || [], productClass: "default", productCategory: "", productName: "" };
  }
  function emitCRAChanged() { emit("engagement-changed", state.engagement); }
  function toggleCRALayer(layerId) {
    var cs = getCRASetupRaw();
    var declared = (state.instrument.layers || []).map(function (l) { return l.id; });
    var on = (cs.layers || []).indexOf(layerId) !== -1;
    var next = on ? cs.layers.filter(function (id) { return id !== layerId; }) : cs.layers.concat([layerId]);
    if (next.length === 0) return; // at least one layer stays in scope
    cs.layers = declared.filter(function (id) { return next.indexOf(id) !== -1; });
    emitCRAChanged();
  }
  // In-scope layer objects, in author order.
  function getCRALayers() {
    if (!state.instrument) return [];
    var scope = getCRASetupRaw().layers;
    return (state.instrument.layers || []).filter(function (l) { return scope.indexOf(l.id) !== -1; });
  }
  function getCRAItemsByLayer(layerId) {
    return ((state.instrument && state.instrument.items) || []).filter(function (it) { return it.layerId === layerId; });
  }
  function getCRAStateScale() {
    return (state.profile && state.profile.states) || [];
  }
  function getCRASetupSpec() {
    return (state.instrument && state.instrument.setup) || [];
  }
  // The classification lookup for the ACTIVE layered instrument (CRA Annex
  // III/IV, Machinery Annex I, ...) - resolved per instrument via its setup's
  // lookupKey, with the CRA lookup as the fallback.
  function getCRAClassificationLookup() {
    if (!window.App.ScoringCRA) return null;
    return window.App.ScoringCRA.classificationLookup(state.instrument);
  }
  // The derived classification for the ACTIVE target (class, route, flag).
  function getCRAClassification() {
    if (!window.App.ScoringCRA) return null;
    return window.App.ScoringCRA.deriveClassification(getCRASetup(), state.instrument);
  }
  // Per-target product setters (operate on the active target/product).
  function setCRAProductClass(classId) {
    craProductEntry(state.activeTargetId).productClass = classId || "default";
    emitCRAChanged();
  }
  function setCRAProductCategory(key) {
    key = key || "";
    var entry = craProductEntry(state.activeTargetId);
    entry.productCategory = key;
    if (key && window.App.ScoringCRA) {
      var suggested = window.App.ScoringCRA.suggestedFromCategory({ productCategory: key }, state.instrument);
      if (suggested) entry.productClass = suggested;
    }
    emitCRAChanged();
  }
  function setCRAProductName(name) {
    craProductEntry(state.activeTargetId).productName = name || "";
    emitCRAChanged();
  }

  // ---- targets (sites / components / etc) -------------------------------

  // The shared scope. Not a zone: it holds the answers for countermeasures
  // implemented once for the whole system and inherited by every zone, and it
  // never appears in results, charts or per-zone reports in its own right.
  // Selecting it swaps the capture page onto that layer.
  var SHARED_TARGET_ID = window.App.Scoring.SHARED_TARGET_ID;

  function supportsSharedScope() {
    return state.scoringFamily === "capability-sl" && (state.engagement.targets || []).length > 1;
  }
  // What the layer is CALLED on screen and in the exports. "System-wide" was
  // wrong the moment an answer could cover a subset of zones: a link between
  // two of five is shared, not system-wide. Keep the phrase "system-wide" for
  // what it actually means - a weakness present in every zone - and nowhere
  // else.
  function sharedScopeLabel() {
    return "Shared";
  }
  function sharedScopeLabelLong() {
    return "Shared answers";
  }
  function isSharedScope(id) { return id === SHARED_TARGET_ID; }
  function sharedTarget() {
    return { id: SHARED_TARGET_ID, name: sharedScopeLabel(), shared: true };
  }
  function getSharedResponses() {
    return state.engagement.responses.filter(function (r) { return r.targetId === SHARED_TARGET_ID; });
  }
  // The shared page shows everything any zone needs, so its target profile
  // is the highest SL-T per FR across the zones.
  function sharedTargetProfile() {
    return window.App.Scoring.sharedTargetProfile(state.engagement.targetProfile, state.engagement.targets);
  }
  // Which zones a shared item covers. An empty/absent list means all of
  // them, which is the default and the common case.
  function getItemCoverage(requirementId, componentId) {
    var r = findResponse(SHARED_TARGET_ID, requirementId);
    var c = r && r.components && r.components[componentId];
    return (c && c.appliesTo) ? c.appliesTo.slice() : null;
  }

  // null / all zones selected -> store nothing, so the common case leaves no
  // list to maintain and a later zone is picked up automatically.
  function setItemCoverage(requirementId, componentId, targetIds) {
    var all = (state.engagement.targets || []).map(function (t) { return t.id; });
    var r = upsertResponse(SHARED_TARGET_ID, requirementId, {});
    r.components = r.components || {};
    var c = r.components[componentId] || (r.components[componentId] = { state: null, note: "" });
    if (!targetIds || targetIds.length === 0 || targetIds.length >= all.length) {
      delete c.appliesTo;
    } else {
      // Store in the engagement's own zone order, so the report reads in the
      // same order the consultant sees on screen.
      c.appliesTo = all.filter(function (id) { return targetIds.indexOf(id) !== -1; });
    }
    emit("responses-changed", r);
    return c.appliesTo || null;
  }

  // Which items of a requirement have a shared answer. Coverage is only
  // meaningful for these: a reach for a blank item says nothing.
  function answeredSharedComponents(requirementId) {
    var r = findResponse(SHARED_TARGET_ID, requirementId);
    var comps = (r && r.components) || {};
    return Object.keys(comps).filter(function (k) { return comps[k] && comps[k].state; });
  }

  // The reach of a whole requirement, which is how a consultant thinks about
  // it: "the directory service reaches these zones". Returns null when nothing
  // is answered yet, `mixed` when the items disagree (set individually), and
  // otherwise the one list they share - `appliesTo` null meaning every zone.
  function getRequirementCoverage(requirementId) {
    var ids = answeredSharedComponents(requirementId);
    if (!ids.length) return null;
    var first = getItemCoverage(requirementId, ids[0]);
    var same = ids.every(function (k) {
      var cov = getItemCoverage(requirementId, k);
      if (!cov || !first) return !cov && !first;
      return cov.length === first.length && cov.every(function (id, i) { return first[i] === id; });
    });
    return same ? { mixed: false, appliesTo: first } : { mixed: true, appliesTo: null };
  }

  // Set one reach across every answered item, which also resolves a `mixed`
  // requirement back to a single answer.
  function setRequirementCoverage(requirementId, targetIds) {
    answeredSharedComponents(requirementId).forEach(function (k) {
      setItemCoverage(requirementId, k, targetIds);
    });
    return getRequirementCoverage(requirementId);
  }

  // ---- linking a requirement across zones -------------------------------
  //
  // "SR 1.8 is the same here as in the DMZ - use that answer." Expressed with
  // the machinery already in place rather than a second mechanism: the answer
  // moves to the shared layer, scoped to exactly the zones sharing it, and
  // every one of them inherits it per item. Editing it anywhere edits it
  // everywhere, which is the whole point of saying they are the same.

  // The zones sharing one answer for this requirement: those the system-wide
  // answer reaches AND that have not overridden it with an answer of their own.
  // Fewer than two means it is not a link, just a shared answer.
  //
  // This is the LINK as the zone cards present it, not the rule for who takes
  // the shared answer. A zone that overrode one item is left out here but is
  // still scored on the rest, its evidence and its plan (Scoring.resolveResponse
  // works per item). Anything that changes data, or says what a zone is taking,
  // uses zonesReachedBy and materialiseInherited below.
  function linkedTargets(requirementId) {
    var shared = findResponse(SHARED_TARGET_ID, requirementId);
    var comps = (shared && shared.components) || {};
    var answered = Object.keys(comps).filter(function (k) { return comps[k] && comps[k].state; });
    if (!answered.length) return [];
    return (state.engagement.targets || []).filter(function (t) {
      var reaches = answered.some(function (k) {
        return window.App.Scoring.coversTarget(comps[k], t.id);
      });
      if (!reaches) return false;
      var own = findResponse(t.id, requirementId);
      return !(own && own.components && Object.keys(own.components).some(function (k) {
        return own.components[k] && own.components[k].state;
      }));
    }).map(function (t) { return t.id; });
  }

  // Everything a zone carries for one requirement, so a link can move it whole:
  // an answer whose evidence and remediation plan stayed behind would be a
  // different answer.
  //
  // Only ever lifts a zone's answer UP to the shared layer now. Coming down
  // goes through materialiseInherited, which works out per item what the zone
  // was actually taking; a straight copy of the shared answer could not.
  var LINKED_FIELDS = ["evidence", "notes", "owner", "action", "impact", "priorityRank", "priorityBand",
                       "naNote", "slChoice"];
  function copyRequirement(fromTargetId, toTargetId, requirementId) {
    var src = findResponse(fromTargetId, requirementId);
    if (!src) return null;
    var patch = {};
    LINKED_FIELDS.forEach(function (f) { if (src[f] !== undefined) patch[f] = src[f]; });
    var dst = upsertResponse(toTargetId, requirementId, patch);
    dst.components = {};
    Object.keys(src.components || {}).forEach(function (k) {
      var c = src.components[k];
      // A zone's own items carry no appliesTo; the link sets the reach after.
      dst.components[k] = { state: c.state };
      if (c.note) dst.components[k].note = c.note;
    });
    return dst;
  }

  function clearRequirement(targetId, requirementId) {
    state.engagement.responses = state.engagement.responses.filter(function (r) {
      return !(r.targetId === targetId && r.requirementId === requirementId);
    });
    var ass = activeAssessment();
    if (ass) ass.responses = state.engagement.responses;
  }

  // ---- handing a shared answer back without moving anyone's answers ------
  //
  // Resolution is per ITEM: a zone that overrode one enhancement is still
  // taking the base, the evidence and the plan from the shared answer. So
  // "has an answer of its own" never meant "inherits nothing", and anything
  // that replaces, narrows or removes a shared answer has to write down first
  // what each zone it reaches is actually taking from it. Without that,
  // linking two zones blanked the base item of a third that had overridden
  // only RE1, and deleting a zone stripped its partner of every item and the
  // evidence it had not overridden.

  // Every zone a shared answer reaches today: at least one answered item
  // covers it. Overriding some of those items does not take a zone out of
  // this list, because it is still taking the rest.
  function zonesReachedBy(requirementId) {
    var shared = findResponse(SHARED_TARGET_ID, requirementId);
    var comps = (shared && shared.components) || {};
    return (state.engagement.targets || []).filter(function (t) {
      return Object.keys(comps).some(function (k) {
        return comps[k] && comps[k].state && window.App.Scoring.coversTarget(comps[k], t.id);
      });
    }).map(function (t) { return t.id; });
  }

  // The requirement-level fields a zone takes from the shared answer when it
  // has none of its own: exactly the ones Scoring.resolveResponse fills in.
  // naNote is not one of them, so it is not copied down either.
  var INHERITED_FIELDS = ["evidence", "notes", "slChoice",
                          "priorityRank", "priorityBand", "owner", "action", "impact"];

  // Write what one zone takes from the shared answer into the zone's own
  // response, so the shared answer can then be replaced, rescoped or removed
  // without that zone's answers moving. Worked out by the scorer's own
  // resolution rather than restated here, so the copy is what the zone was
  // being scored on, item for item. Nothing the zone already owns is touched:
  // an item it overrode keeps its own state, and its own evidence or plan
  // keeps winning over the shared text exactly as it did before.
  function materialiseInherited(targetId, requirementId) {
    var shared = findResponse(SHARED_TARGET_ID, requirementId);
    if (!shared || isSharedScope(targetId)) return;
    // Outside every item's reach the zone takes nothing, not even the evidence.
    if (zonesReachedBy(requirementId).indexOf(targetId) === -1) return;
    var own = findResponse(targetId, requirementId);
    var eff = window.App.Scoring.resolveResponse(own || null, shared, targetId);
    var dst = own || upsertResponse(targetId, requirementId, {});
    dst.components = dst.components || {};
    Object.keys(eff.components || {}).forEach(function (k) {
      var c = eff.components[k];
      if (!c || c.source !== "shared") return;
      // appliesTo is a property of the shared layer, never of a zone's own copy.
      dst.components[k] = { state: c.state };
      if (c.note) dst.components[k].note = c.note;
    });
    INHERITED_FIELDS.forEach(function (f) { if (eff[f] !== undefined) dst[f] = eff[f]; });
  }

  // Hand a shared answer down to every zone still taking anything from it,
  // then remove it.
  function collapseSharedRequirement(requirementId) {
    zonesReachedBy(requirementId).forEach(function (id) { materialiseInherited(id, requirementId); });
    clearRequirement(SHARED_TARGET_ID, requirementId);
  }

  // Take one zone out of a shared answer's reach, item by item. Each item
  // keeps the reach it had, less this zone. One list written across the whole
  // requirement would also pull out every zone not named in it, and stretch a
  // narrower item over zones it never covered. An item left reaching nobody
  // served only this zone, which holds its own copy by the time this runs, so
  // the item goes rather than widening back to everyone.
  function excludeFromSharedReach(requirementId, targetId) {
    var shared = findResponse(SHARED_TARGET_ID, requirementId);
    if (!shared || !shared.components) return;
    var all = (state.engagement.targets || []).map(function (t) { return t.id; });
    Object.keys(shared.components).forEach(function (k) {
      var c = shared.components[k];
      if (!c || !c.state) return;
      var reach = ((c.appliesTo && c.appliesTo.length) ? c.appliesTo : all)
        .filter(function (id) { return id !== targetId; });
      if (!reach.length) delete shared.components[k];
      else if (reach.length >= all.length) delete c.appliesTo;
      else c.appliesTo = reach;
    });
  }

  // Share `sourceTargetId`'s answer with `targetIds` (which includes the source
  // itself). The zones' own answers are replaced - that is what "the same as"
  // means - so the caller must have said whose answer wins.
  function linkRequirement(requirementId, sourceTargetId, targetIds) {
    var real = (state.engagement.targets || []).map(function (t) { return t.id; });
    // Only real zones: the shared layer is where the answer goes, never a
    // member of the set it reaches.
    var ids = (targetIds || []).filter(function (id) { return real.indexOf(id) !== -1; });
    if (sourceTargetId !== SHARED_TARGET_ID && ids.indexOf(sourceTargetId) === -1) ids.push(sourceTargetId);
    if (ids.length < 2) return false;
    // Every zone the shared answer reaches that is NOT joining this link would
    // otherwise be overwritten by it, or dropped out of its coverage and left
    // blank. Each keeps exactly what it shows today, as its own: linking two
    // zones must not change a third, and that includes a zone that overrode
    // one enhancement and is still taking the base from here. The source
    // writes its inherited part down too, so what is lifted is the answer its
    // card shows rather than only the items it happened to record itself.
    zonesReachedBy(requirementId).forEach(function (id) {
      if (ids.indexOf(id) === -1 || id === sourceTargetId) materialiseInherited(id, requirementId);
    });
    // Lift the source answer up, unless the source IS the shared layer. The
    // old shared answer is replaced, not patched: a field the source never set
    // must not survive from it into the answer the linked zones now share.
    if (sourceTargetId !== SHARED_TARGET_ID) {
      clearRequirement(SHARED_TARGET_ID, requirementId);
      copyRequirement(sourceTargetId, SHARED_TARGET_ID, requirementId);
    }
    ids.forEach(function (id) { clearRequirement(id, requirementId); });
    setRequirementCoverage(requirementId, ids);
    emit("responses-changed", null);
    return true;
  }

  // Give one zone its own copy back. Lossless on purpose: the zone keeps the
  // answer it was inheriting and can now edit it without touching the others.
  // Only this zone leaves the shared answer's reach; a zone that overrode one
  // item and is still taking the rest was not part of the request.
  //
  // A link of one is not a link. Once fewer than two zones take the whole
  // answer, it goes down to every zone it still reaches, partial overriders
  // included, each keeping exactly what it was taking. Counting the partial
  // overriders instead would leave one zone silently inheriting with no link
  // shown on its card and no "answer separately" control to undo it.
  function unlinkRequirement(requirementId, targetId) {
    var linked = linkedTargets(requirementId);
    if (linked.indexOf(targetId) === -1) return false;
    materialiseInherited(targetId, requirementId);
    excludeFromSharedReach(requirementId, targetId);
    if (linkedTargets(requirementId).length < 2) collapseSharedRequirement(requirementId);
    emit("responses-changed", null);
    return true;
  }

  // A shared answer that now reaches fewer than two zones is not shared: it is
  // one zone's answer sitting on a layer that zone cannot edit. That happens
  // when a zone is deleted out of a linked pair, and when an engagement drops
  // to a single zone - at which point the Shared tab disappears entirely and
  // the answers would still be scoring, invisibly and unreachably. Push each
  // one down to the zone that still uses it and remove the shared copy. A zone
  // that answered some items for itself still takes the others, so it gets
  // those, not nothing.
  function collapseOrphanedSharedAnswers() {
    getSharedResponses().slice().forEach(function (shared) {
      var comps = shared.components || {};
      var answered = Object.keys(comps).filter(function (k) { return comps[k] && comps[k].state; });
      if (!answered.length) return;
      if (zonesReachedBy(shared.requirementId).length >= 2) return;
      collapseSharedRequirement(shared.requirementId);
    });
  }

  // A deleted zone must not linger in any coverage list, or a shared answer
  // silently narrows to a zone that no longer exists.
  function pruneItemCoverage(removedTargetId) {
    getSharedResponses().forEach(function (r) {
      var comps = r.components || {};
      var hadAnswer = Object.keys(comps).some(function (k) { return comps[k] && comps[k].state; });
      Object.keys(comps).forEach(function (k) {
        var c = comps[k];
        if (!c || !c.appliesTo) return;
        // An empty list already meant every zone (Scoring.coversTarget). It
        // did not cover the deleted zone in particular, so it stays unscoped.
        if (!c.appliesTo.length) { delete c.appliesTo; return; }
        c.appliesTo = c.appliesTo.filter(function (id) { return id !== removedTargetId; });
        // Emptied by the removal: the item covered only the zone that has
        // gone, so it goes with it. Widening it back to every zone left would
        // hand them an answer nobody gave them.
        if (!c.appliesTo.length) delete comps[k];
      });
      // Nothing answered is left: everything on it, evidence and plan
      // included, served only the deleted zone.
      var answerLeft = Object.keys(comps).some(function (k) { return comps[k] && comps[k].state; });
      if (hadAnswer && !answerLeft) clearRequirement(SHARED_TARGET_ID, r.requirementId);
    });
  }

  // How many zones inherit a given item today, for the "this answer covers N
  // zones" cue on the shared page. A zone counts only if the answer
  // reaches it AND it has not answered for itself.
  function zonesInheriting(requirementId, componentId) {
    var shared = findResponse(SHARED_TARGET_ID, requirementId);
    var sc = shared && shared.components && shared.components[componentId];
    return (state.engagement.targets || []).filter(function (t) {
      if (!window.App.Scoring.coversTarget(sc, t.id)) return false;
      var r = findResponse(t.id, requirementId);
      var c = r && r.components && r.components[componentId];
      return !(c && c.state);
    }).length;
  }

  function addTarget(name) {
    var label = state.instrument.targetDimensionLabel || "Site";
    var n = state.engagement.targets.length + 1;
    var t = { id: "t-" + Date.now().toString(36) + "-" + n, name: name || (label + " " + n) };
    var source = state.engagement.targets[0] || null;
    state.engagement.targets.push(t);
    state.activeTargetId = t.id;
    // Layered CRA: a new product inherits the organisation-scope answers
    // (e.g. P2 vulnerability handling) - they describe the manufacturer's
    // process, which is the same for every product. The fan-out invariant in
    // setResponse means any existing target is a valid source.
    if (source) {
      var orgIds = craOrgScopeItemIds();
      state.engagement.responses
        .filter(function (r) { return r.targetId === source.id && orgIds[r.requirementId]; })
        .forEach(function (r) {
          var copy = JSON.parse(JSON.stringify(r));
          copy.targetId = t.id;
          state.engagement.responses.push(copy);
        });
    }
    // A zone added mid-engagement takes every shared answer that is not scoped
    // away from it, so it can appear substantially assessed the moment it is
    // created - on the strength of answers written before it existed. That is
    // the right default (a shared countermeasure does reach it unless told
    // otherwise) but it must not pass unnoticed, so the count is stamped on the
    // target and the capture page asks for it to be confirmed once.
    var inherited = sharedRequirementsReaching(t.id);
    if (inherited > 0) t.inheritedAtCreation = inherited;
    emit("targets-changed", state.engagement.targets);
    return t;
  }

  // How many requirements a target would take from the shared layer today.
  function sharedRequirementsReaching(targetId) {
    return getSharedResponses().filter(function (r) {
      var comps = r.components || {};
      return Object.keys(comps).some(function (k) {
        return comps[k] && comps[k].state && window.App.Scoring.coversTarget(comps[k], targetId);
      });
    }).length;
  }

  // The consultant has looked at what the new zone inherited. One click, and
  // the prompt does not come back.
  function acknowledgeInherited(targetId) {
    (state.engagement.targets || []).forEach(function (t) {
      if (t.id === targetId) delete t.inheritedAtCreation;
    });
    emit("targets-changed", state.engagement.targets);
  }

  function renameTarget(id, name) {
    state.engagement.targets.forEach(function (t) { if (t.id === id) t.name = name; });
    emit("targets-changed", state.engagement.targets);
  }

  function removeTarget(id) {
    if (state.engagement.targets.length <= 1) return false;
    state.engagement.targets = state.engagement.targets.filter(function (t) { return t.id !== id; });
    state.engagement.responses = state.engagement.responses.filter(function (r) { return r.targetId !== id; });
    pruneItemCoverage(id);
    // Removing a zone can leave a shared answer serving one zone, or none. That
    // is not a shared answer; hand it back before it becomes unreachable.
    collapseOrphanedSharedAnswers();
    // The projection's arrays alias the stored assessment's. Filtering created
    // NEW arrays, so re-point the assessment at them - otherwise the removed
    // target resurrects on the next activation and, worse, every response
    // recorded after the removal is missing from the saved file.
    var ass = activeAssessment();
    if (ass) { ass.targets = state.engagement.targets; ass.responses = state.engagement.responses; }
    if (state.activeTargetId === id) state.activeTargetId = state.engagement.targets[0].id;
    emit("targets-changed", state.engagement.targets);
    return true;
  }

  function setActiveTarget(id) {
    state.activeTargetId = id;
    emit("active-target-changed", id);
  }

  // ---- responses --------------------------------------------------------

  function findResponse(targetId, requirementId) {
    return state.engagement.responses.filter(function (r) {
      return r.targetId === targetId && r.requirementId === requirementId;
    })[0];
  }

  function upsertResponse(targetId, requirementId, patch) {
    var r = findResponse(targetId, requirementId);
    if (!r) {
      r = { targetId: targetId, requirementId: requirementId, applicable: true };
      // Family-specific defaults so unanswered state is consistent.
      if (state.scoringFamily === "domain-letter") {
        r.band = null; r.unknown = false; r.capture = {}; r.notes = "";
        r.priorityRank = null; r.priorityBand = ""; r.owner = ""; r.action = ""; r.impact = ""; r.evidence = "";
      } else if (state.scoringFamily === "caf-achieved") {
        r.state = null; r.evidence = ""; r.notes = "";
        r.priorityRank = null; r.priorityBand = ""; r.owner = ""; r.action = ""; r.impact = "";
      } else if (state.scoringFamily === "program-maturity-ml") {
        r.ml = null; r.targetMl = null; r.evidence = ""; r.notes = "";
        r.priorityRank = null; r.priorityBand = ""; r.owner = ""; r.action = ""; r.impact = "";
      } else if (state.scoringFamily === "nis2-conformance" || state.scoringFamily === "csms-conformance") {
        r.state = null; r.evidence = ""; r.notes = "";
        r.priorityRank = null; r.priorityBand = ""; r.owner = ""; r.action = ""; r.impact = "";
      } else if (state.scoringFamily === "risk-appetite-coherence") {
        // An item records a band on its axis plus the assessor's
        // characterisation. No remediation fields: this instrument produces a
        // risk-acceptance conversation, not a roadmap of things to fix.
        r.band = null; r.notes = ""; r.evidence = ""; r.disposition = ""; r.notEstablished = false;
      } else {
        // capability-sl: the unit of assessment is the ITEM (base + each
        // requirement enhancement), so state lives in components, not on the
        // requirement. Requirement-level evidence/notes/remediation are
        // unchanged, which is what keeps the roadmap and exports keyed on
        // requirementId working.
        r.components = {}; r.evidence = ""; r.notes = "";
        r.priorityRank = null; r.priorityBand = ""; r.owner = ""; r.action = ""; r.impact = "";
      }
      state.engagement.responses.push(r);
    }
    Object.assign(r, patch);
    return r;
  }

  // ---- capability-sl item state ----------------------------------------
  //
  // One item = one component of one requirement (base, RE1, RE2...). state is
  // one of Scoring.ITEM_STATES, or null to clear back to "not assessed". The
  // note is the N/A justification: without it an N/A does NOT exclude the item,
  // it blocks the level, so the UI must ask for it.
  function setItemState(targetId, requirementId, componentId, itemState, note) {
    var r = findResponse(targetId, requirementId);
    if (!r) r = upsertResponse(targetId, requirementId, {});
    if (!r.components) r.components = {};
    if (itemState === null || itemState === undefined) {
      delete r.components[componentId];
    } else {
      var entry = r.components[componentId] || {};
      entry.state = itemState;
      if (note !== undefined) entry.note = note;
      if (itemState !== "na" && !entry.note) delete entry.note;
      r.components[componentId] = entry;
    }
    emit("response-changed", r);
    return r;
  }

  function getItemState(targetId, requirementId, componentId) {
    var r = findResponse(targetId, requirementId);
    var c = r && r.components && r.components[componentId];
    return c || null;
  }

  // Set every item of a requirement at once - the "all met" fast path the
  // consultant needs when a requirement is simply fine.
  function setRequirementItems(targetId, requirementId, itemState, componentIds) {
    var r = findResponse(targetId, requirementId);
    if (!r) r = upsertResponse(targetId, requirementId, {});
    if (!r.components) r.components = {};
    (componentIds || []).forEach(function (cid) {
      if (itemState === null || itemState === undefined) delete r.components[cid];
      else r.components[cid] = Object.assign({}, r.components[cid] || {}, { state: itemState });
    });
    emit("response-changed", r);
    return r;
  }

  // Record a requirement at an achieved Security Level.
  //
  // The consultant thinks in Security Levels, which is the standard's own
  // vocabulary, but the thing that has to be stored is per item - that is what
  // names the blocking item, carries a compensating measure and lets an
  // unassessed item block a claim. So the level is EXPANDED here rather than
  // stored: every item selected at or below `sl` becomes met, everything above
  // it not met. Exactly what "this requirement achieves SL n" means.
  //
  // sl === null clears the requirement; sl === "na" marks every in-scope item
  // not applicable, carrying the justification.
  function setRequirementSL(targetId, requirementId, sl, targetSL, note) {
    var req = (state.instrument.requirements || [])
      .filter(function (r) { return r.id === requirementId; })[0];
    if (!req) return null;
    var items = window.App.Scoring.requirementItems(req);
    var r = findResponse(targetId, requirementId) || upsertResponse(targetId, requirementId, {});
    r.components = r.components || {};
    // How far up to write. The target, at least - but also as far as the level
    // being set, and as far as anything already answered above it, so that
    // dropping from SL 3 back to SL 2 actually retracts the SL 3 item instead
    // of leaving it met and the requirement still reading SL 3.
    var ceiling = (typeof targetSL === "number") ? targetSL : 4;
    if (typeof sl === "number") ceiling = Math.max(ceiling, sl);
    items.forEach(function (it) {
      var c = r.components[it.componentId];
      if (c && c.state) ceiling = Math.max(ceiling, it.firstSL);
    });
    // Remember which level was picked. Where a requirement selects nothing new
    // at the higher levels, several of them write exactly the same items, so
    // the choice cannot be read back off the items - and the consultant still
    // needs the button they pressed to be the one that lights.
    if (typeof sl === "number") r.slChoice = sl;
    else delete r.slChoice;
    items.forEach(function (it) {
      if (it.firstSL > ceiling) return;
      if (sl === null || sl === undefined) { delete r.components[it.componentId]; return; }
      if (sl === "na") {
        r.components[it.componentId] = { state: "na", note: note || "" };
        return;
      }
      r.components[it.componentId] =
        Object.assign({}, r.components[it.componentId] || {},
                      { state: it.firstSL <= sl ? "met" : "not-met" });
    });
    emit("response-changed", r);
    return r;
  }

  // Layered CRA: item ids belonging to organisation-scope layers (e.g. P2
  // vulnerability handling). Answers to these are shared across every
  // product - the process is the manufacturer's, not the product's.
  // Assessments of one instrument at different sites, oldest visit first. The
  // unit of "a site" is an ASSESSMENT: the site is named on it, so covering a
  // second facility means a second assessment rather than a second target, and
  // the same assessment shape serves a single-site company and a multi-site one.
  //
  // Assessments used as somebody else's comparison baseline are excluded: a
  // prior year's read is history, not a peer site, and rolling it in would put
  // a 2024 answer beside this year's as though both were current.
  function siblingSiteAssessments(instrumentId) {
    var id = instrumentId || (state.instrument && state.instrument.id);
    var baselines = {};
    Object.keys(state.assessments || {}).forEach(function (k) {
      var b = state.assessments[k] && state.assessments[k].baseline;
      var d = b && b.source && b.source.dateOfVisit;
      if (d) baselines[d] = true;
    });
    return assessmentsFor(id).filter(function (a) {
      var meta = a.engagementMeta || {};
      if (baselines[meta.dateOfVisit]) return false;
      return (a.responses || []).length > 0;
    });
  }

  function craOrgScopeItemIds() {
    var inst = state.instrument;
    if (!(window.App.ScoringCRA && window.App.ScoringCRA.isCRA(inst))) return {};
    // Item-level scope resolution (ScoringCRA.itemScope): an item is
    // organisation-scoped when it declares scope "organisation" itself (the
    // org-level conformity obligations: Art 14 reporting readiness, component
    // due diligence) or, absent an item scope, when its layer does (all of P2).
    var ids = {};
    (inst.items || []).forEach(function (it) {
      if (window.App.ScoringCRA.itemScope(inst, it) === "organisation") ids[it.id] = true;
    });
    return ids;
  }

  function setResponse(targetId, requirementId, patch) {
    var r = upsertResponse(targetId, requirementId, patch);
    // Organisation-scope CRA answers fan out to every product so they can
    // never diverge; per-product layers (P1, conformity) stay isolated.
    if (craOrgScopeItemIds()[requirementId]) {
      state.engagement.targets.forEach(function (t) {
        if (t.id !== targetId) upsertResponse(t.id, requirementId, patch);
      });
    }
    emit("response-changed", r);
  }

  function setCaptureField(targetId, questionId, fieldId, value) {
    var r = findResponse(targetId, questionId);
    if (!r) {
      r = { targetId: targetId, requirementId: questionId, applicable: true, band: null, unknown: false, capture: {}, notes: "" };
      state.engagement.responses.push(r);
    }
    if (!r.capture) r.capture = {};
    r.capture[fieldId] = value;
    emit("response-changed", r);
  }

  function scoreActiveTarget() {
    if (!state.instrument || !state.profile || !state.engagement) return null;
    var responses = state.engagement.responses.filter(function (r) { return r.targetId === state.activeTargetId; });
    if (state.scoringFamily === "domain-letter") {
      return window.App.ScoringDomainLetter.scoreSite(state.instrument, state.profile, responses);
    }
    if (state.scoringFamily === "caf-achieved") {
      return window.App.ScoringCAF.scoreSite(state.instrument, state.profile, responses, getActiveCAFOverlay());
    }
    if (state.scoringFamily === "program-maturity-ml") {
      return window.App.ScoringProgramML.scoreSite(state.instrument, state.profile, responses);
    }
    if (state.scoringFamily === "nis2-conformance") {
      return window.App.ScoringNIS2.scoreSite(state.instrument, state.profile, responses);
    }
    if (state.scoringFamily === "risk-appetite-coherence") {
      return window.App.ScoringRiskAppetite.scoreSite(
        state.instrument, state.profile, responses, getRiskAppetiteSetup());
    }
    if (state.scoringFamily === "csms-conformance") {
      // Layered CRA reuses the csms scorer per layer; plain csms otherwise.
      // Organisation-scoped answers are already present per product via the
      // setResponse fan-out, so no merge is needed here.
      if (window.App.ScoringCRA && window.App.ScoringCRA.isCRA(state.instrument)) {
        return window.App.ScoringCRA.scoreSite(state.instrument, state.profile, responses, getCRASetup());
      }
      return window.App.ScoringCSMS.scoreSite(state.instrument, state.profile, responses);
    }
    if (state.scoringFamily === "capability-sl") {
      if (!state.taxonomy) return null;
      // The shared layer is scored on its own, against the highest SL-T
      // any zone asks for, so the capture page lists every item a zone could
      // inherit. Its numbers are a working view, never a zone result.
      if (isSharedScope(state.activeTargetId)) {
        return window.App.Scoring.scoreSite(state.instrument, state.taxonomy, state.profile,
          sharedTargetProfile(), responses, null);
      }
      return window.App.Scoring.scoreSite(state.instrument, state.taxonomy, state.profile,
        state.engagement.targetProfile, responses, state.activeTargetId, getSharedResponses());
    }
    // New scoring families (csms-conformance, program-maturity-ml, ...) must
    // have their own dispatch branch; we must not silently fall back to the
    // SL scorer. Maturity / conformance are NOT SL.
    throw new Error("No scorer wired for scoringFamily '" + state.scoringFamily + "'. Add a dispatch branch before activating this instrument.");
  }

  function scoreAllTargets() {
    if (!state.instrument || !state.profile || !state.engagement) return null;
    if (state.scoringFamily === "domain-letter") {
      return window.App.ScoringDomainLetter.scoreEngagement(state.engagement, state.instrument, state.profile);
    }
    if (state.scoringFamily === "caf-achieved") {
      return window.App.ScoringCAF.scoreEngagement(state.engagement, state.instrument, state.profile, getActiveCAFOverlay());
    }
    if (state.scoringFamily === "program-maturity-ml") {
      return window.App.ScoringProgramML.scoreEngagement(state.engagement, state.instrument, state.profile);
    }
    if (state.scoringFamily === "nis2-conformance") {
      return window.App.ScoringNIS2.scoreEngagement(state.engagement, state.instrument, state.profile);
    }
    if (state.scoringFamily === "risk-appetite-coherence") {
      return window.App.ScoringRiskAppetite.scoreEngagement(
        state.engagement, state.instrument, state.profile, getRiskAppetiteSetup());
    }
    if (state.scoringFamily === "csms-conformance") {
      if (window.App.ScoringCRA && window.App.ScoringCRA.isCRA(state.instrument)) {
        return window.App.ScoringCRA.scoreEngagement(state.engagement, state.instrument, state.profile, getCRASetupRaw());
      }
      return window.App.ScoringCSMS.scoreEngagement(state.engagement, state.instrument, state.profile);
    }
    if (state.scoringFamily === "capability-sl") {
      if (!state.taxonomy) return null;
      return window.App.Scoring.scoreEngagement(state.engagement, state.instrument, state.taxonomy, state.profile);
    }
    throw new Error("No scorer wired for scoringFamily '" + state.scoringFamily + "'. Add a dispatch branch before activating this instrument.");
  }

  // ---- selectors --------------------------------------------------------

  function getActiveTarget() {
    if (!state.engagement) return null;
    if (isSharedScope(state.activeTargetId)) return sharedTarget();
    return state.engagement.targets.filter(function (t) { return t.id === state.activeTargetId; })[0];
  }

  function getRequirementsByFR(frId) {
    return state.instrument.requirements.filter(function (r) { return r.frId === frId; });
  }

  function getQuestionsByDomain(domainId) {
    return (state.instrument.questions || []).filter(function (q) { return q.domainId === domainId; });
  }

  function getDomains() {
    return (state.instrument && state.instrument.domains) || [];
  }

  // CAF-specific selectors.
  function getCAFObjectives() {
    return (state.instrument && state.instrument.taxonomy && state.instrument.taxonomy.objectives) || [];
  }
  function getCAFPrinciples() {
    return (state.instrument && state.instrument.taxonomy && state.instrument.taxonomy.principles) || [];
  }
  function getCAFOutcomesByPrinciple(principleId) {
    return ((state.instrument && state.instrument.outcomes) || [])
      .filter(function (o) { return o.principleId === principleId; });
  }

  // program-maturity-ml selectors.
  function getMLElements() {
    return (state.instrument && state.instrument.elements) || [];
  }
  function getMLRequirementsByElement(elementId) {
    return ((state.instrument && state.instrument.requirements) || [])
      .filter(function (r) { return r.elementId === elementId; });
  }
  function getMLMaturityModel() {
    return (state.instrument && state.instrument.maturityModel) || null;
  }
  // Maturity levels with anchor text (the full definitions shown ONCE in the
  // reference/help panel, per maturityModel._display - never inline per req).
  function getMLLevels() {
    var model = getMLMaturityModel();
    return (model && model.levels) || [];
  }
  // The single ordered capture scale (not-met / ML1-4 scored + unknown/na
  // non-scoring). The per-requirement selector is built from this.
  function getMLAchievedScale() {
    return (state.instrument && state.instrument.achievedScale) || { ordered: [], nonScoring: [] };
  }
  // Optional target-ML overlay (off by default). Drives whether the capture
  // shows a target control and whether the report adds gap / shortfall roadmap.
  function getMLTargetOverlay() {
    return (state.instrument && state.instrument.targetOverlay) || { enabled: false, targetScale: [] };
  }
  function isMLTargetOverlayEnabled() {
    return !!getMLTargetOverlay().enabled;
  }
  function getMLThemeName(theme) {
    var names = (state.instrument && state.instrument.themeNames) || {};
    return names[theme] || theme;
  }

  // nis2-conformance selectors.
  function getNIS2Categories() {
    return (state.instrument && state.instrument.categories) || [];
  }
  function getNIS2ItemsByCategory(categoryId) {
    return ((state.instrument && state.instrument.items) || [])
      .filter(function (it) { return it.categoryId === categoryId; });
  }

  // csms-conformance selectors. Elements roll up by category and (for the
  // "Addressing risk" category) by element group; category-direct elements have
  // elementGroupId null.
  function getCSMSCategories() {
    return (state.instrument && state.instrument.categories) || [];
  }
  function getCSMSElementGroups(categoryId) {
    var gs = (state.instrument && state.instrument.elementGroups) || [];
    return categoryId ? gs.filter(function (g) { return g.categoryId === categoryId; }) : gs;
  }
  function getCSMSElementsByCategory(categoryId) {
    return ((state.instrument && state.instrument.requirements) || [])
      .filter(function (el) { return el.categoryId === categoryId; });
  }
  function getCSMSElementsByGroup(groupId) {
    return ((state.instrument && state.instrument.requirements) || [])
      .filter(function (el) { return el.elementGroupId === groupId; });
  }
  // Conformance state scale from the profile (four scored states + unknown/na).
  function getCSMSStateScale() {
    return (state.profile && state.profile.states) || [];
  }

  return {
    state: state,
    on: on,
    loadCatalog: loadCatalog,
    activateInstrument: activateInstrument,
    clearInstrument: clearInstrument,
    newEngagement: newEngagement,
    newProject: newProject,
    setEngagement: setEngagement,
    loadProjectFile: loadProjectFile,
    getProjectFile: getProjectFile,
    answeredInstrumentIds: answeredInstrumentIds,
    updateMetadata: updateMetadata,
    getAssessmentMeta: getAssessmentMeta,
    // A customer file can hold several assessments of the SAME instrument - a
    // 2026 review and a 2028 one. activateInstrument opens the latest;
    // these address them individually.
    activateAssessment: activateAssessment,
    newAssessment: newAssessment,
    deleteAssessment: deleteAssessment,
    renameAssessment: renameAssessment,
    listAssessments: listAssessments,
    assessmentsFor: assessmentsFor,
    activeAssessment: activeAssessment,
    getReportNarrative: getReportNarrative,
    setReportNarrative: setReportNarrative,
    getReportCustom: getReportCustom,
    getReportSection: getReportSection,
    setReportSection: setReportSection,
    clearReportSection: clearReportSection,
    hasReportCustom: hasReportCustom,
    getReview: getReview,
    setReview: setReview,
    touchReview: touchReview,
    getBasisOfAssessment: getBasisOfAssessment,
    touchBasisOfAssessment: touchBasisOfAssessment,
    getBaseline: getBaseline,
    setBaseline: setBaseline,
    clearBaseline: clearBaseline,
    setBaselineTarget: setBaselineTarget,
    setDefaultTargetSL: setDefaultTargetSL,
    setFRTarget: setFRTarget,
    getRiskContext: getRiskContext,
    setRiskContext: setRiskContext,
    clearRiskContext: clearRiskContext,
    setZoneTarget: setZoneTarget,
    setZoneFRTarget: setZoneFRTarget,
    getZoneTarget: getZoneTarget,
    addTarget: addTarget,
    renameTarget: renameTarget,
    removeTarget: removeTarget,
    siblingSiteAssessments: siblingSiteAssessments,
    setActiveTarget: setActiveTarget,
    // shared layer
    SHARED_TARGET_ID: SHARED_TARGET_ID,
    supportsSharedScope: supportsSharedScope,
    sharedScopeLabel: sharedScopeLabel,
    sharedScopeLabelLong: sharedScopeLabelLong,
    isSharedScope: isSharedScope,
    getSharedResponses: getSharedResponses,
    getSharedTargetProfile: sharedTargetProfile,
    zonesInheriting: zonesInheriting,
    getItemCoverage: getItemCoverage,
    setItemCoverage: setItemCoverage,
    getRequirementCoverage: getRequirementCoverage,
    setRequirementCoverage: setRequirementCoverage,
    linkedTargets: linkedTargets,
    // Who is taking anything from a shared answer, partial overriders
    // included: what the zone cards use to say a zone is inheriting.
    zonesReachedBy: zonesReachedBy,
    acknowledgeInherited: acknowledgeInherited,
    linkRequirement: linkRequirement,
    unlinkRequirement: unlinkRequirement,
    findResponse: findResponse,
    setResponse: setResponse,
    setItemState: setItemState,
    getItemState: getItemState,
    setRequirementItems: setRequirementItems,
    setRequirementSL: setRequirementSL,
    setCaptureField: setCaptureField,
    scoreActiveTarget: scoreActiveTarget,
    scoreAllTargets: scoreAllTargets,
    getActiveTarget: getActiveTarget,
    getRequirementsByFR: getRequirementsByFR,
    getQuestionsByDomain: getQuestionsByDomain,
    getDomains: getDomains,
    getActiveNarrative: getActiveNarrative,
    // CAF
    getCAFObjectives: getCAFObjectives,
    getCAFPrinciples: getCAFPrinciples,
    getCAFOutcomesByPrinciple: getCAFOutcomesByPrinciple,
    getCAFProfileRegistry: getCAFProfileRegistry,
    getCAFProfiles: getCAFProfiles,
    getActiveCAFProfileId: getActiveCAFProfileId,
    getActiveCAFProfile: getActiveCAFProfile,
    getActiveCAFOverlay: getActiveCAFOverlay,
    getCAFProfileMeta: getCAFProfileMeta,
    getActiveCAFProfileMeta: getActiveCAFProfileMeta,
    getCAFProfileGroups: getCAFProfileGroups,
    getCAFGroupKeyForProfile: getCAFGroupKeyForProfile,
    setCAFProfile: setCAFProfile,
    // program-maturity-ml
    getMLElements: getMLElements,
    getMLRequirementsByElement: getMLRequirementsByElement,
    getMLMaturityModel: getMLMaturityModel,
    getMLLevels: getMLLevels,
    getMLAchievedScale: getMLAchievedScale,
    getMLTargetOverlay: getMLTargetOverlay,
    isMLTargetOverlayEnabled: isMLTargetOverlayEnabled,
    getMLThemeName: getMLThemeName,
    // NIS2
    getNIS2Categories: getNIS2Categories,
    getNIS2ItemsByCategory: getNIS2ItemsByCategory,
    getCSMSCategories: getCSMSCategories,
    getCSMSElementGroups: getCSMSElementGroups,
    getCSMSElementsByCategory: getCSMSElementsByCategory,
    getCSMSElementsByGroup: getCSMSElementsByGroup,
    getCSMSStateScale: getCSMSStateScale,
    // Risk appetite (exposure vs appetite coherence)
    getRiskAppetiteSetup: getRiskAppetiteSetup,
    updateRiskAppetiteSetup: updateRiskAppetiteSetup,
    riskAppetiteTechIncluded: riskAppetiteTechIncluded,
    getRiskAppetiteSections: getRiskAppetiteSections,
    getRiskAppetiteItems: getRiskAppetiteItems,
    // CRA (layered conformance)
    getCRASetup: getCRASetup,
    toggleCRALayer: toggleCRALayer,
    getCRALayers: getCRALayers,
    getCRAItemsByLayer: getCRAItemsByLayer,
    getCRAStateScale: getCRAStateScale,
    getCRASetupSpec: getCRASetupSpec,
    getCRASetupRaw: getCRASetupRaw,
    getCRAClassificationLookup: getCRAClassificationLookup,
    getCRAClassification: getCRAClassification,
    setCRAProductClass: setCRAProductClass,
    setCRAProductCategory: setCRAProductCategory,
    setCRAProductName: setCRAProductName
  };
})();
