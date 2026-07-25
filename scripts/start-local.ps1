$ErrorActionPreference = "Stop"

$projectDir = "D:\Codex\lumina"
$nodeBin = "C:\Users\Long\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$nodeExe = Join-Path $nodeBin "node.exe"
$pnpmCli = "C:\Users\Long\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\pnpm\bin\pnpm.cjs"
$nextCli = Join-Path $projectDir "node_modules\next\dist\bin\next"
$frontendDir = Join-Path $projectDir "frontend"
$dataDir = Join-Path $projectDir ".local-data"
$stdoutLog = Join-Path $dataDir "dev-server.log"
$stderrLog = Join-Path $dataDir "dev-server-error.log"
$appUrl = "http://localhost:3002/"

function Test-AppPort {
  return $null -ne (Get-NetTCPConnection -LocalPort 3002 -State Listen -ErrorAction SilentlyContinue)
}

if (-not (Test-Path -LiteralPath (Join-Path $projectDir "package.json"))) {
  throw "Project not found: $projectDir"
}

if (-not (Test-Path -LiteralPath $nodeExe)) {
  throw "Node runtime not found: $nodeExe"
}

$env:Path = "$nodeBin;$env:Path"
Set-Location -LiteralPath $projectDir
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

if (-not (Test-AppPort)) {
  if (-not (Test-Path -LiteralPath $nextCli)) {
    if (-not (Test-Path -LiteralPath $pnpmCli)) {
      throw "pnpm runtime not found: $pnpmCli"
    }

    & $nodeExe $pnpmCli install
    if ($LASTEXITCODE -ne 0) {
      throw "Dependency installation failed with exit code $LASTEXITCODE."
    }
  }

  Start-Process -FilePath $nodeExe `
    -ArgumentList @($nextCli, "dev", $frontendDir, "-p", "3002") `
    -WorkingDirectory $projectDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog | Out-Null

  for ($attempt = 0; $attempt -lt 30; $attempt += 1) {
    Start-Sleep -Seconds 1
    if (Test-AppPort) { break }
  }
}

if (-not (Test-AppPort)) {
  throw "Startup failed. Check $stdoutLog and $stderrLog."
}

Start-Process $appUrl
