# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Dot-sourced by the packaging and release scripts, once per module:
#
#   . (Join-Path $repo "packaging\module-info.ps1") -Module risk-assessment
#
# Reads modules\<id>\module.json (the module manifest) and the suite version
# from shared\version.js, checks the module is in step with both, and sets:
#
#   $ModuleInfo        the manifest (id, product, entry, tests, singleHtml, electron)
#   $ModuleDir         the module's folder, modules\<id>
#   $AppProduct        its product name, e.g. "OT Cyber Risk Assessment Tool"
#   $AppVersion        the suite version, e.g. "0.5.0" (the exe's version number)
#   $AppVersionLabel   e.g. "v0.5" (what the tools show; used in file names)
#   $AppPageName       the single-file build's name: "<product> <label>.html"
#   $AppExeName        the portable exe's name:     "<product> <label>.exe"
#   $ElectronRoot      %LOCALAPPDATA%\OTCAT-electron: what every module's build
#                      shares (Electron download cache, portable Node, the
#                      electron-builder staging project)
#   $ElectronOut       %LOCALAPPDATA%\OTCAT-electron\<id>: this module's own
#                      builds and self-test results, so modules never overwrite
#                      each other's
#   $AllModules        the id of every module that has a module.json
#
# One version for the whole suite: shared\version.js is the only place it is
# set, and every module carries a synced copy (tools\sync-shared.ps1). A module
# copy that differs is refused here, so nothing is ever built with a stale one.
param([string]$Module = "assessments")

$_repo = Split-Path -Parent $PSScriptRoot
$AllModules = @(Get-ChildItem (Join-Path $_repo "modules") -Directory |
  Where-Object { Test-Path (Join-Path $_.FullName "module.json") } | ForEach-Object { $_.Name })
$ModuleDir = Join-Path $_repo "modules\$Module"
$_manifest = Join-Path $ModuleDir "module.json"
if (-not (Test-Path $_manifest)) { throw "No module '$Module' (no $_manifest). Modules: $($AllModules -join ', ')" }
$ModuleInfo = [IO.File]::ReadAllText($_manifest, [Text.Encoding]::UTF8) | ConvertFrom-Json
if ($ModuleInfo.id -ne $Module) { throw "modules\$Module\module.json says its id is '$($ModuleInfo.id)'" }
$AppProduct = [string]$ModuleInfo.product
if (-not $AppProduct) { throw "modules\$Module\module.json has no product name" }

# The suite version, from the canonical copy; the module's copy must match it.
$_verRx = 'var VERSION = "([0-9]+\.[0-9]+\.[0-9]+)"'
$_shared = [IO.File]::ReadAllText((Join-Path $_repo "shared\version.js"))
$_verMatch = [regex]::Match($_shared, $_verRx)
if (-not $_verMatch.Success) { throw "Could not read the version from shared\version.js" }
$_modVer = Join-Path $ModuleDir "js\version.js"
if (-not (Test-Path $_modVer) -or [IO.File]::ReadAllText($_modVer) -ne $_shared) {
  throw "modules\$Module\js\version.js is not the same as shared\version.js. Run tools\sync-shared.ps1."
}
$AppVersion = $_verMatch.Groups[1].Value
$_verParts = $AppVersion.Split('.')
$AppVersionLabel = "v" + $(if ($_verParts[2] -eq "0") { $_verParts[0] + "." + $_verParts[1] } else { $AppVersion })

# The product name the module shows (js/product.js) is the one it ships under.
$_prod = Join-Path $ModuleDir "js\product.js"
$_prodMatch = [regex]::Match($(if (Test-Path $_prod) { [IO.File]::ReadAllText($_prod) } else { "" }), 'name: "([^"]+)"')
if (-not $_prodMatch.Success -or $_prodMatch.Groups[1].Value -ne $AppProduct) {
  throw "modules\$Module\js\product.js does not name the product in module.json ('$AppProduct')"
}

$AppPageName = "$AppProduct $AppVersionLabel.html"
$AppExeName  = "$AppProduct $AppVersionLabel.exe"
$ElectronRoot = Join-Path $env:LOCALAPPDATA "OTCAT-electron"
$ElectronOut  = Join-Path $ElectronRoot $Module
