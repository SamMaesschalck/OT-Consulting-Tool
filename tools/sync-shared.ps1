# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only, see LICENCE.txt.
#
# Copies the canonical shared files and contracts into every module that
# uses them, as listed in shared/sync.json.
#
#   .\tools\sync-shared.ps1          # copy every canonical file into the modules
#   .\tools\sync-shared.ps1 -Check   # change nothing; exit 1 if any module copy differs
#
# Modules keep their own copies so each one runs and ships standalone. The
# canonical copy is the only one to edit: a module copy edited by hand is
# drift, and -Check (run by tools/release.ps1) refuses to release with it.
param([switch]$Check)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$map = Get-Content (Join-Path $repo "shared\sync.json") -Raw -Encoding UTF8 | ConvertFrom-Json
$drift = @(); $copied = 0
foreach ($f in $map.files) {
  $src = Join-Path $repo $f.from
  if (-not (Test-Path $src)) { throw "Canonical file missing: $($f.from)" }
  $h = (Get-FileHash $src -Algorithm SHA256).Hash
  foreach ($to in $f.to) {
    $dst = Join-Path $repo $to
    $same = (Test-Path $dst) -and ((Get-FileHash $dst -Algorithm SHA256).Hash -eq $h)
    if ($same) { continue }
    if ($Check) { $drift += "$to (differs from $($f.from))"; continue }
    New-Item -ItemType Directory -Force (Split-Path -Parent $dst) | Out-Null
    Copy-Item $src $dst -Force
    Write-Output "copied $($f.from) -> $to"
    $copied++
  }
}
if ($Check) {
  if ($drift.Count) { Write-Output "Shared files out of step:"; $drift | ForEach-Object { "  $_" }; exit 1 }
  Write-Output "Shared files and contracts: every module copy matches."
  exit 0
}
Write-Output ("{0} file(s) copied." -f $copied)
if ($copied -gt 0) { Write-Output "If a contract .json changed, re-run each module's scripts\build-data.ps1." }
