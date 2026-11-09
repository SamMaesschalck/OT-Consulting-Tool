#requires -Version 5.1
# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Regenerates the .js wrappers for the report review tool's data files, as the
# other modules' build-data.ps1 do. The demo pack has its own script
# (build-demo-pack.ps1), as it is built from the assessment tool's demo.
#
#   powershell -ExecutionPolicy Bypass -File scripts/build-data.ps1
#
# Outputs (overwritten in place):
#   data/review-pack.js   -> window.App.Data.contracts.reviewPack
#   data/review-file.js   -> window.App.Data.contracts.reviewFile
#   data/checklists.js    -> window.App.Data.checklists
#   data/licence.js       -> window.App.Data.licence

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$notice = "/* Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt. */"

function Wrap-Assign {
  param([string]$jsonRelPath, [string]$jsRelPath, [string]$targetExpr)
  $jsonRaw = [IO.File]::ReadAllText((Join-Path $root $jsonRelPath), [Text.Encoding]::UTF8)
  $null = $jsonRaw | ConvertFrom-Json   # it must parse
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.AppendLine($notice)
  [void]$sb.AppendLine("// AUTO-GENERATED from $jsonRelPath - do not edit; edit the .json then re-run scripts/build-data.ps1")
  [void]$sb.AppendLine("window.App = window.App || {};")
  [void]$sb.AppendLine("window.App.Data = window.App.Data || {};")
  [void]$sb.Append("$targetExpr = ")
  [void]$sb.Append($jsonRaw.TrimEnd())
  [void]$sb.AppendLine(";")
  [IO.File]::WriteAllText((Join-Path $root ($jsRelPath -replace "/", "\")), $sb.ToString(), $utf8NoBom)
  Write-Host ("wrote " + $jsRelPath)
}

Wrap-Assign "data/review-pack.json" "data/review-pack.js" "(window.App.Data.contracts = window.App.Data.contracts || {}).reviewPack"
Wrap-Assign "data/review-file.json" "data/review-file.js" "(window.App.Data.contracts = window.App.Data.contracts || {}).reviewFile"
Wrap-Assign "data/checklists.json" "data/checklists.js" "window.App.Data.checklists"

$licence = [IO.File]::ReadAllText((Join-Path $root "LICENCE.txt"), [Text.Encoding]::UTF8)
$js = $notice + "`n// AUTO-GENERATED from LICENCE.txt - do not edit; edit shared/LICENCE.txt then re-run scripts/build-data.ps1`n" +
  "window.App = window.App || {};`nwindow.App.Data = window.App.Data || {};`nwindow.App.Data.licence = " +
  (ConvertTo-Json $licence.Replace("`r`n", "`n").TrimEnd()) + ";`n"
[IO.File]::WriteAllText((Join-Path $root "data\licence.js"), $js, $utf8NoBom)
Write-Host "wrote data/licence.js"
