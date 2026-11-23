param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$bundle = $PSScriptRoot
$site = Join-Path $bundle 'site'
$node = Join-Path $bundle 'runtime/bin/node.exe'
$server = Join-Path $site 'studio/server.mjs'
$state = Join-Path $bundle 'local-runtime'
New-Item -ItemType Directory -Force -Path $state | Out-Null
$listener = Get-NetTCPConnection -State Listen -LocalPort 4174 -ErrorAction SilentlyContinue
if ($listener) {
    $running = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener[0].OwningProcess)"
    if (-not $running.CommandLine.Contains($server)) {
        throw 'Another local preview is using port 4174. Close that preview server, then run this launcher again. No process was stopped.'
    }
} else {
    $env:STUDIO_PORT='4174'
    $env:STUDIO_DATA_MODE='local'
    $env:CMS_DATA_MODE='local'
    $env:PRODUCTION_CMS_ENABLED='false'
    $env:PAYMENT_MODE='disabled'
    $env:CUSTOM_TOUR_QUOTES_ENABLED='false'
    $process = Start-Process -FilePath $node -ArgumentList @('"'+$server+'"') -WorkingDirectory $site -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $state 'server.log') -RedirectStandardError (Join-Path $state 'server-error.log')
    $process.Id | Set-Content -LiteralPath (Join-Path $state 'server.pid')
}
$ready=$false
for ($attempt=0;$attempt -lt 120;$attempt++) {
    try { $response=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:4174/production/' -TimeoutSec 2; if($response.StatusCode -eq 200){$ready=$true;break} } catch {}
    Start-Sleep -Seconds 1
}
if(-not $ready){throw 'The local preview did not start. See local-runtime/server-error.log.'}
Write-Output 'Website: http://127.0.0.1:4174/production/'
Write-Output 'Development: http://127.0.0.1:4174/preview/'
Write-Output 'Admin: http://127.0.0.1:4174/studio/'
if(-not $NoBrowser){Start-Process 'http://127.0.0.1:4174/production/'}
