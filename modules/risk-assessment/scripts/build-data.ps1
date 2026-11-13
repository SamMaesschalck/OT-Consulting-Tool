#requires -Version 5.1
#
# Regenerates the .js namespace wrappers for the Risk Assessment tool's data
# files. Same pattern as the Assessments app's build-data.ps1, but this app
# has no instruments: just a few flat data files.
#
#   powershell -ExecutionPolicy Bypass -File scripts/build-data.ps1
#
# Outputs (overwritten in place):
#   data/slt-suggestion-rules.js      -> window.App.Data.sltRules
#   data/risk-context-interchange.js  -> window.App.Data.interchange
#   data/zcr-map.js                   -> window.App.Data.zcrMap
#   data/scenario-library.js          -> window.App.Data.scenarioLibrary

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Wrap-Assign {
  param([string]$jsonRelPath, [string]$jsRelPath, [string]$targetExpr)
  $jsonRaw = Get-Content $jsonRelPath -Raw -Encoding UTF8
  # Validate it parses before wrapping.
  $null = $jsonRaw | ConvertFrom-Json
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine("/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */")
  [void]$sb.AppendLine("// AUTO-GENERATED from $jsonRelPath - do not edit; edit the .json then re-run scripts/build-data.ps1")
  [void]$sb.AppendLine("window.App = window.App || {};")
  [void]$sb.AppendLine("window.App.Data = window.App.Data || {};")
  [void]$sb.Append("$targetExpr = ")
  [void]$sb.Append($jsonRaw.TrimEnd())
  [void]$sb.AppendLine(";")
  $abs = Join-Path (Resolve-Path -LiteralPath ".").Path ($jsRelPath -replace "/", "\")
  [System.IO.File]::WriteAllText($abs, $sb.ToString(), $utf8NoBom)
  Write-Host ("wrote " + $jsRelPath)
}

Wrap-Assign -jsonRelPath "data/slt-suggestion-rules.json" `
            -jsRelPath   "data/slt-suggestion-rules.js" `
            -targetExpr  "window.App.Data.sltRules"

Wrap-Assign -jsonRelPath "data/risk-context-interchange.json" `
            -jsRelPath   "data/risk-context-interchange.js" `
            -targetExpr  "window.App.Data.interchange"

Wrap-Assign -jsonRelPath "data/zcr-map.json" `
            -jsRelPath   "data/zcr-map.js" `
            -targetExpr  "window.App.Data.zcrMap"

Wrap-Assign -jsonRelPath "data/review-pack.json" `
            -jsRelPath   "data/review-pack.js" `
            -targetExpr  "(window.App.Data.contracts = window.App.Data.contracts || {}).reviewPack"

Wrap-Assign -jsonRelPath "data/review-file.json" `
            -jsRelPath   "data/review-file.js" `
            -targetExpr  "(window.App.Data.contracts = window.App.Data.contracts || {}).reviewFile"

Wrap-Assign -jsonRelPath "data/engagement-guidance.json" `
            -jsRelPath   "data/engagement-guidance.js" `
            -targetExpr  "window.App.Data.engagementGuidance"

Wrap-Assign -jsonRelPath "data/scenario-library.json" `
            -jsRelPath   "data/scenario-library.js" `
            -targetExpr  "window.App.Data.scenarioLibrary"

Write-Host ""
Write-Host "Done. index.html loads these via classic <script src> tags."
