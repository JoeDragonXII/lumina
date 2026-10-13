param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $PSScriptRoot
$port = 3002
$frontendDir = Join-Path $projectDir "frontend"
$dataDir = Join-Path $projectDir ".local-data"
$stdoutLog = Join-Path $dataDir "dev-server.log"
$stderrLog = Join-Path $dataDir "dev-server-error.log"
$appUrl = "http://127.0.0.1:$port/"
$nextCli = Join-Path $projectDir "node_modules\next\dist\bin\next"

function Get-PortListeners {
  return @(
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
      Sort-Object OwningProcess -Unique
  )
}

function Stop-PortNodeTree {
  $listeners = Get-PortListeners
  if ($listeners.Count -eq 0) {
    return
  }

  foreach ($listener in $listeners) {
    $listenerProcessId = [int]$listener.OwningProcess
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $listenerProcessId" -ErrorAction SilentlyContinue
    if (-not $process) {
      continue
    }

    if ($process.Name -ne "node.exe") {
      throw "Port $port is occupied by unrelated process $($process.Name) (PID $listenerProcessId). Close it manually and retry."
    }

    $treeRootId = $listenerProcessId
    $parentId = [int]$process.ParentProcessId
    while ($parentId -gt 0) {
      $parent = Get-CimInstance Win32_Process -Filter "ProcessId = $parentId" -ErrorAction SilentlyContinue
      if (-not $parent -or $parent.Name -ne "node.exe") {
        break
      }
      $treeRootId = [int]$parent.ProcessId
      $parentId = [int]$parent.ParentProcessId
    }

    Write-Host "Stopping old service on port $port (PID $treeRootId)..."
    & taskkill.exe /PID $treeRootId /T /F | Out-Null
  }

  for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
    if ((Get-PortListeners).Count -eq 0) {
      return
    }
    Start-Sleep -Milliseconds 250
  }

  throw "Port $port was not released after stopping the old service."
}

function Test-LuminaReady {
  try {
    $response = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 3
    return $response.StatusCode -eq 200 -and $response.Content -match "Lumina"
  } catch {
    return $false
  }
}

if (-not (Test-Path -LiteralPath (Join-Path $projectDir "package.json"))) {
  throw "Project not found: $projectDir"
}

$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
  throw "Node.js is not available. Restart Windows or reinstall Node.js, then retry."
}
$nodeExe = $nodeCommand.Source

Set-Location -LiteralPath $projectDir
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

if (-not (Test-Path -LiteralPath $nextCli)) {
  $pnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
  if (-not $pnpmCommand) {
    throw "pnpm is not available. Run Corepack setup before starting Lumina."
  }

  Write-Host "Installing dependencies..."
  & $pnpmCommand.Source install
  if ($LASTEXITCODE -ne 0) {
    throw "Dependency installation failed with exit code $LASTEXITCODE."
  }
}

Stop-PortNodeTree

Write-Host "Starting Lumina on port $port..."
$serverProcess = Start-Process -FilePath $nodeExe `
  -ArgumentList @($nextCli, "dev", $frontendDir, "-p", "$port") `
  -WorkingDirectory $projectDir `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -PassThru

for ($attempt = 0; $attempt -lt 60; $attempt += 1) {
  if ($serverProcess.HasExited) {
    throw "Lumina exited during startup. Check $stdoutLog and $stderrLog."
  }
  if (Test-LuminaReady) {
    Write-Host "Lumina is ready: $appUrl"
    if (-not $NoBrowser) {
      Start-Process $appUrl
    }
    exit 0
  }
  Start-Sleep -Seconds 1
}

throw "Lumina did not become ready in time. Check $stdoutLog and $stderrLog."
