# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only.
#
# Draws the loading window's picture for the portable exe (see README:
# Loading screen).
#
#   powershell -ExecutionPolicy Bypass -File build-splash.ps1 -Out <path.bmp>
#
# Called by build-portable-exe.ps1, so the version on it is always the one
# being built (from ..\Assessments\js\version.js). launcher-splash\OtcatSplash
# shows it and animates the bar over the track drawn here, from double-click
# until the tool is up. It is also the still image the launcher falls back to
# if that program cannot start. Same size, layout and words as app\splash.html,
# the app's own loading window for the other builds.

param([Parameter(Mandatory = $true)][string]$Out)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $here "get-version.ps1")   # $AppVersionLabel

$W = 520; $H = 300; $pad = 40
$bmp = New-Object Drawing.Bitmap($W, $H, [Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.TextRenderingHint = [Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.Clear([Drawing.Color]::White)
$g.DrawRectangle((New-Object Drawing.Pen([Drawing.Color]::FromArgb(0xD0, 0xD7, 0xDE))), 0, 0, $W - 1, $H - 1)

function Brush($r, $gr, $b) { New-Object Drawing.SolidBrush([Drawing.Color]::FromArgb($r, $gr, $b)) }
function Font($name, $px, $style) { New-Object Drawing.Font($name, $px, $style, [Drawing.GraphicsUnit]::Pixel) }
$ink = Brush 0x1F 0x2D 0x3A; $muted = Brush 0x5A 0x6B 0x7B; $faint = Brush 0x87 0x95 0xA1
$reg = [Drawing.FontStyle]::Regular

# The same vertical layout as splash.html: logo row, status, bar, note, footer.
# The bar's track (40,202 440x4) must match OtcatSplash.cs.
$top = 58
$logo = [Drawing.Image]::FromFile((Join-Path $here "build\icon-256.png"))
$g.DrawImage($logo, $pad, $top, 92, 92)
$logo.Dispose()
$tx = $pad + 92 + 22
$g.DrawString("OT Cyber Assessment Tool", (Font "Segoe UI Semibold" 22 $reg), $ink, $tx, $top + 22)
$g.DrawString($AppVersionLabel, (Font "Segoe UI" 13 $reg), $muted, $tx + 1, $top + 54)
$g.DrawString("Starting up" + [char]0x2026, (Font "Segoe UI" 14 $reg), $ink, $pad - 2, $top + 92 + 28)
$g.FillRectangle((Brush 0xE6 0xEE 0xF6), $pad, $top + 92 + 52, $W - 2 * $pad, 4)
$g.DrawString("The first start on a computer can take up to a minute.",
  (Font "Segoe UI" 12 $reg), $muted, (New-Object Drawing.RectangleF(($pad - 2), ($top + 92 + 64), ($W - 2 * $pad + 4), 40)))
$g.DrawString([char]0x00A9 + " 2026 SolutionsPT. All rights reserved.", (Font "Segoe UI" 11 $reg), $faint, $pad - 1, $H - 30)
$g.Dispose()

$dir = Split-Path -Parent $Out
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
$bmp.Save($Out, [Drawing.Imaging.ImageFormat]::Bmp)
$bmp.Dispose()
Write-Output "Wrote $Out ($AppVersionLabel)"
