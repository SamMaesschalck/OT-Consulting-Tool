# Copyright (c) 2026 SolutionsPT. All rights reserved. Proprietary and confidential; licensed use only.
#
# Makes the app icon (build\icon.ico, plus build\icon-256.png to look at) from
# build\icon-source.jpg, the square "pt" mark.
#
#   powershell -ExecutionPolicy Bypass -File build-icon.ps1
#
# The source is a JPEG: one blue on white, no transparency. Keying out "white"
# would leave a pale fringe round the anti-aliased edges, which shows on a dark
# taskbar. Instead each pixel's opacity is worked out from how much blue is
# mixed into it (the red channel has the most contrast between the two), and
# the colour is set to the pure brand blue. Edges stay smooth on any background.
#
# A larger or vector source would give sharper 256px and 128px sizes; this one
# is 200px and is scaled up for 256.

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$src  = Join-Path $here "build\icon-source.jpg"
$ico  = Join-Path $here "build\icon.ico"
$png  = Join-Path $here "build\icon-256.png"

$in = [Drawing.Bitmap]::FromFile($src)
$w = $in.Width; $h = $in.Height

# The brand blue: the median of the clearly-blue pixels.
$rs = New-Object System.Collections.Generic.List[int]; $gs = New-Object System.Collections.Generic.List[int]; $bs = New-Object System.Collections.Generic.List[int]
for ($y = 0; $y -lt $h; $y++) { for ($x = 0; $x -lt $w; $x++) {
  $p = $in.GetPixel($x, $y); if ($p.R -lt 90) { $rs.Add($p.R); $gs.Add($p.G); $bs.Add($p.B) } } }
function Median($l) { $a = $l.ToArray(); [Array]::Sort($a); $a[[int]($a.Length / 2)] }
$cr = Median $rs; $cg = Median $gs; $cb = Median $bs
Write-Output "Brand blue: $cr,$cg,$cb"

# Un-blend from white into a transparent mark, with a small margin so the mark
# does not touch the edge of the icon.
$margin = [int][math]::Round($w * 0.04)
$side = $w + 2 * $margin
$mark = New-Object Drawing.Bitmap($side, $side, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $h; $y++) { for ($x = 0; $x -lt $w; $x++) {
  $p = $in.GetPixel($x, $y)
  $a = (255 - $p.R) / (255 - $cr)
  if ($a -lt 0.05) { $a = 0 } elseif ($a -gt 1) { $a = 1 }
  $mark.SetPixel($x + $margin, $y + $margin, [Drawing.Color]::FromArgb([int][math]::Round($a * 255), $cr, $cg, $cb))
} }
$in.Dispose()

function Resized($bmp, $size) {
  $out = New-Object Drawing.Bitmap($size, $size, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.Clear([Drawing.Color]::Transparent)
  $g.DrawImage($bmp, 0, 0, $size, $size)
  $g.Dispose()
  return $out
}

# Classic icon bitmap: a 32-bit BGRA image stored bottom-up, with the height
# doubled to cover the 1-bit AND mask that follows it (all zero; the alpha
# channel does the masking).
function DibBytes($bmp) {
  $s = $bmp.Width
  $ms = New-Object IO.MemoryStream
  $w = New-Object IO.BinaryWriter($ms)
  $w.Write([UInt32]40); $w.Write([Int32]$s); $w.Write([Int32]($s * 2))
  $w.Write([UInt16]1); $w.Write([UInt16]32); $w.Write([UInt32]0)
  $w.Write([UInt32]($s * $s * 4)); $w.Write([Int32]0); $w.Write([Int32]0); $w.Write([UInt32]0); $w.Write([UInt32]0)
  for ($y = $s - 1; $y -ge 0; $y--) { for ($x = 0; $x -lt $s; $x++) {
    $p = $bmp.GetPixel($x, $y); $w.Write([byte]$p.B); $w.Write([byte]$p.G); $w.Write([byte]$p.R); $w.Write([byte]$p.A) } }
  $maskRow = [int]([math]::Ceiling($s / 32) * 4)
  $w.Write((New-Object byte[] ($maskRow * $s)))
  $w.Flush()
  return $ms.ToArray()
}

# A multi-size .ico. 256 is stored as PNG, the norm for that size since Vista;
# the smaller sizes as classic bitmaps, which every reader of .ico handles.
$sizes = @(256, 128, 64, 48, 32, 24, 16)
$images = @()
foreach ($s in $sizes) {
  $bmp = Resized $mark $s
  if ($s -eq 256) {
    $ms = New-Object IO.MemoryStream
    $bmp.Save($ms, [Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save($png, [Drawing.Imaging.ImageFormat]::Png)
    $data = $ms.ToArray()
  } else {
    $data = DibBytes $bmp
  }
  $bmp.Dispose()
  $images += ,@($s, $data)
}
$mark.Dispose()

$fs = [IO.File]::Create($ico)
$bw = New-Object IO.BinaryWriter($fs)
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$images.Count)
$offset = 6 + 16 * $images.Count
foreach ($im in $images) {
  $s = $im[0]; $data = $im[1]
  $dim = if ($s -ge 256) { 0 } else { $s }
  $bw.Write([byte]$dim); $bw.Write([byte]$dim); $bw.Write([byte]0); $bw.Write([byte]0)
  $bw.Write([UInt16]1); $bw.Write([UInt16]32)
  $bw.Write([UInt32]$data.Length); $bw.Write([UInt32]$offset)
  $offset += $data.Length
}
foreach ($im in $images) { $bw.Write([byte[]]$im[1]) }
$bw.Close()
Write-Output ("Wrote build\icon.ico ({0} sizes, {1} KB) and build\icon-256.png" -f $images.Count, [math]::Round((Get-Item $ico).Length / 1KB))
