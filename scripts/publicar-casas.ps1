$ErrorActionPreference = "Stop"
$root = "C:\Dev\guix-automation"
$slugs = @("barbearia", "salao", "estetica", "petshop", "academia", "contabilidade", "advocacia")
$cfg = Join-Path $root "prototipos\barbearia\vite.config.ts"

foreach ($slug in $slugs) {
  $dir = Join-Path $root "prototipos\$slug"
  if ($slug -ne "barbearia") {
    Copy-Item $cfg (Join-Path $dir "vite.config.ts") -Force
    Write-Output "INSTALL $slug"
    Push-Location $dir
    npm install --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "install $slug failed" }
    Pop-Location
  }
}

foreach ($slug in $slugs) {
  $dir = Join-Path $root "prototipos\$slug"
  Write-Output "BUILD $slug"
  Push-Location $dir
  $env:GUIX_BASE = "/casas/$slug/"
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "build $slug failed" }
  $dest = Join-Path $root "site\public\casas\$slug"
  if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
  New-Item -ItemType Directory -Path (Split-Path $dest) -Force | Out-Null
  Copy-Item (Join-Path $dir ".output\public") $dest -Recurse -Force
  Pop-Location
  Write-Output "PUBLISHED $slug"
}
