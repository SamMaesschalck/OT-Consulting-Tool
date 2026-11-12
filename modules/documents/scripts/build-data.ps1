#requires -Version 5.1
# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Regenerates the .js wrappers for the document tool's data files, as the
# other modules' build-data.ps1 do. The tour's document has its own script
# (build-demo.ps1), as it is made by importing a Word file.
#
#   powershell -ExecutionPolicy Bypass -File scripts/build-data.ps1
#
# Outputs (overwritten in place):
#   data/document.js   -> window.App.Data.contracts.document
#   data/licence.js    -> window.App.Data.licence

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

Wrap-Assign "data/document.json" "data/document.js" "(window.App.Data.contracts = window.App.Data.contracts || {}).document"

$licence = [IO.File]::ReadAllText((Join-Path $root "LICENCE.txt"), [Text.Encoding]::UTF8)
$js = $notice + "`n// AUTO-GENERATED from LICENCE.txt - do not edit; edit shared/LICENCE.txt then re-run scripts/build-data.ps1`n" +
  "window.App = window.App || {};`nwindow.App.Data = window.App.Data || {};`nwindow.App.Data.licence = " +
  (ConvertTo-Json $licence.Replace("`r`n", "`n").TrimEnd()) + ";`n"
[IO.File]::WriteAllText((Join-Path $root "data\licence.js"), $js, $utf8NoBom)
Write-Host "wrote data/licence.js"
