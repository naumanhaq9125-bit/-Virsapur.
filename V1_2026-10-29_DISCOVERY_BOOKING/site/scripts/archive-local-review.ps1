param(
  [string]$PackageDirectory = 'D:\Virsapur-Website-Developer-Handoff\V1_2026-10-29_DISCOVERY_BOOKING',
  [string]$ZipPath = 'D:\Virsapur-Website-Developer-Handoff\Virsapur_V1_Discovery_Booking_2026-10-29.zip'
)
$ErrorActionPreference = 'Stop'
$packageRoot = (Resolve-Path -LiteralPath $PackageDirectory).Path
$handoffRoot = (Resolve-Path -LiteralPath 'D:\Virsapur-Website-Developer-Handoff').Path
if (-not $packageRoot.StartsWith($handoffRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Package must be inside the developer handoff directory.' }
$zipAbsolute = [IO.Path]::GetFullPath($ZipPath)
if ([IO.Path]::GetDirectoryName($zipAbsolute) -ne $handoffRoot) { throw 'ZIP must be directly in the developer handoff directory.' }
if (Test-Path -LiteralPath $zipAbsolute) { throw 'ZIP already exists. Preserve verified packages; use a new name.' }
$manifest = Get-Content -Raw -LiteralPath (Join-Path $packageRoot 'FILES.sha256.json') | ConvertFrom-Json
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::Open($zipAbsolute,[IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($entry in $manifest.PSObject.Properties) {
    $sourcePath = [IO.Path]::GetFullPath((Join-Path $packageRoot $entry.Name))
    if (-not $sourcePath.StartsWith($packageRoot + '\',[StringComparison]::OrdinalIgnoreCase)) { throw 'Manifest contains an unsafe path.' }
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$sourcePath,$entry.Name,[IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
  [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,(Join-Path $packageRoot 'FILES.sha256.json'),'FILES.sha256.json',[IO.Compression.CompressionLevel]::Optimal) | Out-Null
} finally { $archive.Dispose() }
$archive = [IO.Compression.ZipFile]::OpenRead($zipAbsolute)
$verified = 0
try {
  $expectedCount = @($manifest.PSObject.Properties).Count + 1
  if ($archive.Entries.Count -ne $expectedCount) { throw 'ZIP entry count differs from manifest.' }
  foreach ($entry in $manifest.PSObject.Properties) {
    $zipped = $archive.GetEntry($entry.Name)
    if (-not $zipped) { throw ('Missing ZIP entry: ' + $entry.Name) }
    $stream = $zipped.Open(); $sha = [Security.Cryptography.SHA256]::Create()
    try { $actual = ([BitConverter]::ToString($sha.ComputeHash($stream))).Replace('-','').ToLowerInvariant() }
    finally { $stream.Dispose(); $sha.Dispose() }
    if ($actual -ne $entry.Value) { throw ('Hash mismatch: ' + $entry.Name) }
    $verified++
  }
} finally { $archive.Dispose() }
$report = [ordered]@{checkedAt=[DateTime]::UtcNow.ToString('o');passed=$true;zip=$zipAbsolute;bytes=(Get-Item -LiteralPath $zipAbsolute).Length;files=$verified+1;verifiedContentFiles=$verified;sha256=(Get-FileHash -LiteralPath $zipAbsolute -Algorithm SHA256).Hash.ToLowerInvariant();notDeployed=$true}
$reportPath = [IO.Path]::ChangeExtension($zipAbsolute,$null) + '_VERIFIED.json'
$report | ConvertTo-Json | Set-Content -LiteralPath $reportPath -Encoding UTF8
$report | ConvertTo-Json
