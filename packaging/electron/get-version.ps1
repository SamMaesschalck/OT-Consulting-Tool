# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only.
#
# Dot-sourced by the build scripts here. Reads the tool's version from
# ..\..\modules\assessments\js\version.js, its one source, and sets:
#   $AppVersion       e.g. "0.3.0"  (the exe's version number)
#   $AppVersionLabel  e.g. "v0.3"   (what the tool shows; used in file names)
#   $AppPageName      the single-file build's name for this version

$verFile = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) "modules\assessments\js\version.js"
$verMatch = [regex]::Match([IO.File]::ReadAllText($verFile), 'var VERSION = "([0-9]+\.[0-9]+\.[0-9]+)"')
if (-not $verMatch.Success) { throw "Could not read the version from $verFile" }
$AppVersion = $verMatch.Groups[1].Value
$verParts = $AppVersion.Split('.')
$AppVersionLabel = "v" + $(if ($verParts[2] -eq "0") { $verParts[0] + "." + $verParts[1] } else { $AppVersion })
$AppPageName = "OT Cyber Assessment Tool $AppVersionLabel.html"
