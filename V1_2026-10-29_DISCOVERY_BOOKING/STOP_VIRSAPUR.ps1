$ErrorActionPreference='Stop'
$state=Join-Path $PSScriptRoot 'local-runtime/server.pid'
if(-not (Test-Path -LiteralPath $state)){Write-Output 'No server started by this package.';exit}
$serverId=[int](Get-Content -LiteralPath $state)
$process=Get-CimInstance Win32_Process -Filter "ProcessId=$serverId" -ErrorAction SilentlyContinue
$server=Join-Path $PSScriptRoot 'site/studio/server.mjs'
if($process -and $process.CommandLine.Contains($server)){Stop-Process -Id $serverId;Write-Output 'The package local server has stopped.'}else{Write-Output 'The package server is already stopped. No other process was changed.'}
