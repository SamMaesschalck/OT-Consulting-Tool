#requires -Version 5.1
#
# Regenerates the .js namespace wrappers and the loader manifest.js from the
# JSON sources, driven entirely by data/instruments-index.json.
#
#   powershell -ExecutionPolicy Bypass -File scripts/build-data.ps1
#
# Outputs (all overwritten in place):
#   data/manifest.js                          loader; the only data <script> in HTML
#   data/shared/<file>.js                     one per shared taxonomy / scoring profile
#   data/instruments/<id>/instrument.js       one per active instrument
#   data/instruments/<id>/narrative.js        one per active instrument
#   data/instruments/<id>/profiles/*.js       profile registry + each referenced
#                                             profile, when a profiles/_registry.json
#                                             is present (CAF-style instruments).
#                                             Missing profile files are skipped so
#                                             placeholder profiles can be filled in
#                                             without changing the manifest.
#
# Adding a new instrument is: create the folder, add instrument.json and
# narrative.json, add a manifest entry, then run this script. No HTML changes,
# no engine changes.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$manifestPath = "data/instruments-index.json"
if (-not (Test-Path $manifestPath)) { throw "Manifest missing: $manifestPath" }
$manifestRaw = Get-Content $manifestPath -Raw -Encoding UTF8
$manifest = $manifestRaw | ConvertFrom-Json

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-Utf8 {
  param([string]$relPath, [string]$content)
  $abs = (Resolve-Path -LiteralPath ".").Path + "\" + ($relPath -replace "/","\")
  $dir = Split-Path -Parent $abs
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [System.IO.File]::WriteAllText($abs, $content, $utf8NoBom)
  Write-Host ("wrote " + $relPath)
}

function Wrap-Assign {
  # Generates a .js wrapper that assigns the .json content to a single namespace path.
  param(
    [string]$jsonRelPath,
    [string]$jsRelPath,
    [string[]]$parentEnsures, # e.g. @("window.App","window.App.Data","window.App.Data.shared","window.App.Data.shared.taxonomies")
    [string]$targetExpr       # e.g. window.App.Data.shared.taxonomies["fr-7"]
  )
  $jsonRaw = Get-Content $jsonRelPath -Raw -Encoding UTF8
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine("/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */")
  [void]$sb.AppendLine("// AUTO-GENERATED from $jsonRelPath - do not edit; edit the .json then re-run scripts/build-data.ps1")
  foreach ($p in $parentEnsures) {
    [void]$sb.AppendLine("$p = $p || {};")
  }
  [void]$sb.Append("$targetExpr = ")
  [void]$sb.Append($jsonRaw.TrimEnd())
  [void]$sb.AppendLine(";")
  Write-Utf8 -relPath $jsRelPath -content $sb.ToString()
}

function Wrap-ProfileMerge {
  # Scoring-profile files are arrays-of-profiles. Merge them into a dict keyed by id.
  param([string]$jsonRelPath, [string]$jsRelPath)
  $jsonRaw = Get-Content $jsonRelPath -Raw -Encoding UTF8
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine("/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */")
  [void]$sb.AppendLine("// AUTO-GENERATED from $jsonRelPath - do not edit; edit the .json then re-run scripts/build-data.ps1")
  [void]$sb.AppendLine("window.App = window.App || {};")
  [void]$sb.AppendLine("window.App.Data = window.App.Data || {};")
  [void]$sb.AppendLine("window.App.Data.shared = window.App.Data.shared || {};")
  [void]$sb.AppendLine("window.App.Data.shared.scoringProfiles = window.App.Data.shared.scoringProfiles || {};")
  [void]$sb.AppendLine("(function () {")
  [void]$sb.Append("  var data = ")
  [void]$sb.Append($jsonRaw.TrimEnd())
  [void]$sb.AppendLine(";")
  [void]$sb.AppendLine("  var arr = (data && data.profiles) || [];")
  [void]$sb.AppendLine("  for (var i = 0; i < arr.length; i++) {")
  [void]$sb.AppendLine("    window.App.Data.shared.scoringProfiles[arr[i].id] = arr[i];")
  [void]$sb.AppendLine("  }")
  [void]$sb.AppendLine("}());")
  Write-Utf8 -relPath $jsRelPath -content $sb.ToString()
}

# --- 1. Shared taxonomies ---------------------------------------------------

foreach ($t in $manifest.shared.taxonomies) {
  $jsonRel = "data/" + $t
  $jsRel   = $jsonRel -replace "\.json$", ".js"
  $taxObj  = Get-Content $jsonRel -Raw -Encoding UTF8 | ConvertFrom-Json
  $taxId   = $taxObj.id
  if (-not $taxId) { throw "Taxonomy file is missing 'id': $jsonRel" }
  $key = ConvertTo-Json $taxId -Compress
  Wrap-Assign -jsonRelPath $jsonRel -jsRelPath $jsRel `
    -parentEnsures @(
      "window.App",
      "window.App.Data",
      "window.App.Data.shared",
      "window.App.Data.shared.taxonomies"
    ) `
    -targetExpr ("window.App.Data.shared.taxonomies[" + $key + "]")
}

# --- 2. Shared scoring profiles --------------------------------------------

foreach ($p in $manifest.shared.scoringProfiles) {
  $jsonRel = "data/" + $p
  $jsRel   = $jsonRel -replace "\.json$", ".js"
  Wrap-ProfileMerge -jsonRelPath $jsonRel -jsRelPath $jsRel
}

# --- 2b. Shared cross-references (IEC 62443 mapping table) ------------------

foreach ($c in $manifest.shared.crossReferences) {
  $jsonRel = "data/" + $c
  $jsRel   = $jsonRel -replace "\.json$", ".js"
  Wrap-Assign -jsonRelPath $jsonRel -jsRelPath $jsRel `
    -parentEnsures @(
      "window.App",
      "window.App.Data",
      "window.App.Data.shared"
    ) `
    -targetExpr ("window.App.Data.shared.crossReferences")
}

# --- 2c. Shared risk-context interchange contract ---------------------------
# Contract for the spt-risk-context files exported by the sibling risk tool.
# The 3-3 importer validates incoming files against .schema from this copy.

foreach ($r in $manifest.shared.riskContextInterchange) {
  $jsonRel = "data/" + $r
  $jsRel   = $jsonRel -replace "\.json$", ".js"
  Wrap-Assign -jsonRelPath $jsonRel -jsRelPath $jsRel `
    -parentEnsures @(
      "window.App",
      "window.App.Data",
      "window.App.Data.shared"
    ) `
    -targetExpr ("window.App.Data.shared.riskContextInterchange")
}

# --- 2d. Shared engagement-preparation guidance ------------------------------
# Advisory per-instrument notes: typical documents, often-forgotten items and
# key stakeholders. Rendered on the engagement page; never pre-populates the
# basis-of-assessment register.

foreach ($g in $manifest.shared.engagementGuidance) {
  $jsonRel = "data/" + $g
  $jsRel   = $jsonRel -replace "\.json$", ".js"
  Wrap-Assign -jsonRelPath $jsonRel -jsRelPath $jsRel `
    -parentEnsures @(
      "window.App",
      "window.App.Data",
      "window.App.Data.shared"
    ) `
    -targetExpr ("window.App.Data.shared.engagementGuidance")
}

# --- 2e. Shared lookup tables ------------------------------------------------
# Reference data an instrument's SETUP step reads: Annex categories +
# routeByClass for the layered instruments (CRA Annex III/IV, Machinery Annex I)
# and the sector exposure baselines for the risk-appetite instrument.
# Each file registers under the camelCase of its basename, so
# cra-product-classification.json        -> Data.shared.craProductClassification
# machinery-classification.json          -> Data.shared.machineryClassification
# risk-appetite-sector-baselines.json    -> Data.shared.riskAppetiteSectorBaselines
# The instrument's setup entry names its lookup via `lookupKey`.
#
# Both categories are wrapped the same way, so a new lookup table is a manifest
# entry rather than another copy of this loop.

$lookupFiles = @()
if ($manifest.shared.productClassifications) { $lookupFiles += $manifest.shared.productClassifications }
if ($manifest.shared.sectorBaselines)        { $lookupFiles += $manifest.shared.sectorBaselines }

foreach ($c in $lookupFiles) {
  $jsonRel = "data/" + $c
  $jsRel   = $jsonRel -replace "\.json$", ".js"
  $base = [System.IO.Path]::GetFileNameWithoutExtension($c)
  $parts = $base -split "-"
  $lookupKey = $parts[0]
  for ($i = 1; $i -lt $parts.Count; $i++) {
    if ($parts[$i].Length -gt 0) { $lookupKey += $parts[$i].Substring(0,1).ToUpper() + $parts[$i].Substring(1) }
  }
  Wrap-Assign -jsonRelPath $jsonRel -jsRelPath $jsRel `
    -parentEnsures @(
      "window.App",
      "window.App.Data",
      "window.App.Data.shared"
    ) `
    -targetExpr ("window.App.Data.shared." + $lookupKey)
}

# --- 2f. The licence --------------------------------------------------------
# LICENCE.txt is the one source. The app shows it in a pop-up (sidebar notice,
# home screen), and a page opened from file:// cannot read a text file beside
# it, so the text is carried in as data. That also puts it inside the
# single-file build, which then needs no LICENCE.txt sent alongside.

$licenceText = [System.IO.File]::ReadAllText((Join-Path $root "LICENCE.txt"), [System.Text.Encoding]::UTF8)
$licSb = New-Object System.Text.StringBuilder
[void]$licSb.AppendLine("/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */")
[void]$licSb.AppendLine("// AUTO-GENERATED from LICENCE.txt - do not edit; edit LICENCE.txt then re-run scripts/build-data.ps1")
[void]$licSb.AppendLine("window.App = window.App || {};")
[void]$licSb.AppendLine("window.App.Data = window.App.Data || {};")
[void]$licSb.AppendLine("window.App.Data.shared = window.App.Data.shared || {};")
[void]$licSb.Append("window.App.Data.shared.licence = ")
[void]$licSb.Append((ConvertTo-Json $licenceText.Replace("`r`n", "`n").TrimEnd()))
[void]$licSb.AppendLine(";")
Write-Utf8 -relPath "data/shared/licence.js" -content $licSb.ToString()

# --- 3. Per-instrument files (active only) ---------------------------------

foreach ($inst in $manifest.instruments) {
  # "active-skeleton" is an active-but-indicative instrument (partial content);
  # it is wrapped and loaded exactly like an active instrument.
  if ($inst.status -ne "active" -and $inst.status -ne "active-skeleton") { continue }
  $instId = $inst.id
  $key = ConvertTo-Json $instId -Compress
  if (-not $inst.files) { throw "Active instrument '$instId' has no 'files' map in manifest." }

  if ($inst.files.instrument) {
    $jsonRel = "data/" + $inst.path + "/" + $inst.files.instrument
    $jsRel   = $jsonRel -replace "\.json$", ".js"
    Wrap-Assign -jsonRelPath $jsonRel -jsRelPath $jsRel `
      -parentEnsures @(
        "window.App",
        "window.App.Data",
        "window.App.Data.instruments",
        "window.App.Data.instruments[$key]"
      ) `
      -targetExpr ("window.App.Data.instruments[$key].instrument")
  }
  if ($inst.files.narrative) {
    $jsonRel = "data/" + $inst.path + "/" + $inst.files.narrative
    $jsRel   = $jsonRel -replace "\.json$", ".js"
    Wrap-Assign -jsonRelPath $jsonRel -jsRelPath $jsRel `
      -parentEnsures @(
        "window.App",
        "window.App.Data",
        "window.App.Data.instruments",
        "window.App.Data.instruments[$key]"
      ) `
      -targetExpr ("window.App.Data.instruments[$key].narrative")
  }

  # Convention-driven discovery of an optional profile overlay registry
  # at <instrument>/profiles/_registry.json. Used by CAF to ship sector
  # profiles (caf-general, caf-ofgem, ...) without enlarging the top-level
  # manifest. The registry is wrapped into
  # window.App.Data.instruments[<instId>].profileRegistry; each referenced
  # profile JSON that exists on disk is wrapped into
  # window.App.Data.instruments[<instId>].profiles[<profileId>].
  # Profiles listed in the registry but not yet present on disk are skipped
  # (warned, not errored) so the placeholders can be authored incrementally.
  $registryRel = "data/" + $inst.path + "/profiles/_registry.json"
  if (Test-Path $registryRel) {
    $regJsRel = $registryRel -replace "\.json$", ".js"
    Wrap-Assign -jsonRelPath $registryRel -jsRelPath $regJsRel `
      -parentEnsures @(
        "window.App",
        "window.App.Data",
        "window.App.Data.instruments",
        "window.App.Data.instruments[$key]"
      ) `
      -targetExpr ("window.App.Data.instruments[$key].profileRegistry")

    $registry = Get-Content $registryRel -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($p in $registry.profiles) {
      $pRel = "data/" + $inst.path + "/" + $p.file
      if (-not (Test-Path $pRel)) {
        Write-Host ("  (profile file not on disk yet, skipping: " + $pRel + ")")
        continue
      }
      $pJsRel = $pRel -replace "\.json$", ".js"
      $pkey = ConvertTo-Json $p.id -Compress
      Wrap-Assign -jsonRelPath $pRel -jsRelPath $pJsRel `
        -parentEnsures @(
          "window.App",
          "window.App.Data",
          "window.App.Data.instruments",
          "window.App.Data.instruments[$key]",
          "window.App.Data.instruments[$key].profiles"
        ) `
        -targetExpr ("window.App.Data.instruments[$key].profiles[$pkey]")
    }
  }
}

# --- 4. The loader manifest.js ---------------------------------------------
#
# The HTML loads exactly one data script: data/manifest.js. It registers the
# manifest, then document.write()s the shared and active-instrument .js files
# into the page (resolved relative to manifest.js's own URL so the same
# manifest works from index.html at the project root and from test pages
# under /scripts/). Script tags inserted via document.write run synchronously
# in order, so by the time the engine.js script later executes, App.Data is
# fully populated.

$loaderSb = New-Object System.Text.StringBuilder
[void]$loaderSb.AppendLine("/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */")
[void]$loaderSb.AppendLine("// AUTO-GENERATED from data/instruments-index.json - do not edit; edit the JSON sources then re-run scripts/build-data.ps1")
[void]$loaderSb.AppendLine("window.App = window.App || {};")
[void]$loaderSb.AppendLine("window.App.Data = window.App.Data || {};")
[void]$loaderSb.Append("window.App.Data.index = ")
[void]$loaderSb.Append($manifestRaw.TrimEnd())
[void]$loaderSb.AppendLine(";")
[void]$loaderSb.AppendLine("(function () {")
[void]$loaderSb.AppendLine("  var s = document.currentScript;")
[void]$loaderSb.AppendLine("  if (!s) return;")
[void]$loaderSb.AppendLine("  var src = s.src;")
[void]$loaderSb.AppendLine("  var i = src.lastIndexOf('/');")
[void]$loaderSb.AppendLine("  var base = i >= 0 ? src.substring(0, i + 1) : '';")
[void]$loaderSb.AppendLine("  function add(rel) { document.write('<script src=\""' + base + rel + '\""><\/script>'); }")

foreach ($t in $manifest.shared.taxonomies) {
  $js = $t -replace "\.json$", ".js"
  [void]$loaderSb.AppendLine("  add('$js');")
}
foreach ($p in $manifest.shared.scoringProfiles) {
  $js = $p -replace "\.json$", ".js"
  [void]$loaderSb.AppendLine("  add('$js');")
}
foreach ($c in $manifest.shared.crossReferences) {
  $js = $c -replace "\.json$", ".js"
  [void]$loaderSb.AppendLine("  add('$js');")
}
foreach ($r in $manifest.shared.riskContextInterchange) {
  $js = $r -replace "\.json$", ".js"
  [void]$loaderSb.AppendLine("  add('$js');")
}
foreach ($g in $manifest.shared.engagementGuidance) {
  $js = $g -replace "\.json$", ".js"
  [void]$loaderSb.AppendLine("  add('$js');")
}
foreach ($c in $lookupFiles) {
  $js = $c -replace "\.json$", ".js"
  [void]$loaderSb.AppendLine("  add('$js');")
}
[void]$loaderSb.AppendLine("  add('shared/licence.js');")
foreach ($inst in $manifest.instruments) {
  if ($inst.status -ne "active" -and $inst.status -ne "active-skeleton") { continue }
  $path = $inst.path
  if ($inst.files.instrument) {
    $js = $inst.files.instrument -replace "\.json$", ".js"
    [void]$loaderSb.AppendLine("  add('$path/$js');")
  }
  if ($inst.files.narrative) {
    $js = $inst.files.narrative -replace "\.json$", ".js"
    [void]$loaderSb.AppendLine("  add('$path/$js');")
  }
  # Optional profile registry + profile overlays (see CAF). Registry first,
  # then each profile JSON that is actually on disk. The order doesn't
  # matter for namespace assignment, but loading the registry first means
  # the engine can fall back to registry metadata for placeholders.
  $registryRel = "data/" + $path + "/profiles/_registry.json"
  if (Test-Path $registryRel) {
    [void]$loaderSb.AppendLine("  add('$path/profiles/_registry.js');")
    $registry = Get-Content $registryRel -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($p in $registry.profiles) {
      $pRel = "data/" + $path + "/" + $p.file
      if (-not (Test-Path $pRel)) { continue }
      $pJs = $p.file -replace "\.json$", ".js"
      [void]$loaderSb.AppendLine("  add('$path/$pJs');")
    }
  }
}
[void]$loaderSb.AppendLine("}());")

Write-Utf8 -relPath "data/manifest.js" -content $loaderSb.ToString()

Write-Host ""
Write-Host "Done. Loaded by HTML via a single <script src='data/manifest.js'></script>."
