param(
  [Parameter(Mandatory = $true)]
  [string]$SourceIcon
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = (Resolve-Path -LiteralPath $SourceIcon).Path
$resRoot = Join-Path $workspaceRoot 'android\app\src\main\res'
$masterPath = Join-Path $workspaceRoot 'assets\icon-mobile.png'

Copy-Item -LiteralPath $sourcePath -Destination $masterPath -Force

$densityMap = @{
  'mipmap-ldpi' = @{ legacy = 36; adaptive = 81 }
  'mipmap-mdpi' = @{ legacy = 48; adaptive = 108 }
  'mipmap-hdpi' = @{ legacy = 72; adaptive = 162 }
  'mipmap-xhdpi' = @{ legacy = 96; adaptive = 216 }
  'mipmap-xxhdpi' = @{ legacy = 144; adaptive = 324 }
  'mipmap-xxxhdpi' = @{ legacy = 192; adaptive = 432 }
}

function Save-ResizedIcon {
  param([System.Drawing.Bitmap]$Source, [int]$Size, [string]$Destination)

  $output = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($output)
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.DrawImage($Source, 0, 0, $Size, $Size)
  $graphics.Dispose()
  $output.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
  $output.Dispose()
}

function New-TransparentForeground {
  param([System.Drawing.Bitmap]$Source)

  $foreground = New-Object System.Drawing.Bitmap($Source.Width, $Source.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $Source.Height; $y++) {
    for ($x = 0; $x -lt $Source.Width; $x++) {
      $pixel = $Source.GetPixel($x, $y)
      $brightness = [Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B))
      $goldBias = $pixel.R - $pixel.B
      if ($brightness -lt 85 -or $goldBias -lt 45) {
        $foreground.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
      } else {
        $alpha = [Math]::Min(255, [Math]::Max(0, ($brightness - 70) * 4))
        $foreground.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
      }
    }
  }
  return $foreground
}

$source = [System.Drawing.Bitmap]::FromFile($sourcePath)
$foreground = New-TransparentForeground -Source $source

foreach ($entry in $densityMap.GetEnumerator()) {
  $folder = Join-Path $resRoot $entry.Key
  Save-ResizedIcon -Source $source -Size $entry.Value.legacy -Destination (Join-Path $folder 'ic_launcher.png')
  Save-ResizedIcon -Source $source -Size $entry.Value.legacy -Destination (Join-Path $folder 'ic_launcher_round.png')
  Save-ResizedIcon -Source $foreground -Size $entry.Value.adaptive -Destination (Join-Path $folder 'ic_launcher_foreground.png')

  $background = New-Object System.Drawing.Bitmap($entry.Value.adaptive, $entry.Value.adaptive)
  $backgroundGraphics = [System.Drawing.Graphics]::FromImage($background)
  $backgroundGraphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#070D1C'))
  $backgroundGraphics.Dispose()
  $background.Save((Join-Path $folder 'ic_launcher_background.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $background.Dispose()
}

$foreground.Dispose()
$source.Dispose()

Write-Output "Android launcher icons generated from $sourcePath"
Write-Output "Master icon saved to $masterPath"
