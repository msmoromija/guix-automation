# Processa o ZIP GuiX e monta o projeto do cliente (Windows).
# Uso:
#   .\scripts\processar-pacote.ps1 -Zip "C:\Downloads\guix-TOKEN-pacote.zip"
#   .\scripts\processar-pacote.ps1 -Zip ".\pacote.zip" -Cliente "lucia-batos" -Install
#   .\scripts\processar-pacote.ps1 -Pedido "pay_xxx" -Token $env:PAINEL_MIDIA_TOKEN

param(
  [string]$Zip = "",
  [string]$Url = "",
  [string]$Pedido = "",
  [string]$Token = "",
  [string]$Cliente = "",
  [switch]$Install,
  [switch]$Build
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if ($Pedido) {
  $args = @("scripts/baixar-e-processar-pedido.mjs", "--pedido", $Pedido)
  if ($Token) { $args += @("--token", $Token) }
  if ($Cliente) { $args += @("--cliente", $Cliente) }
  if ($Install) { $args += "--install" }
  if ($Build) { $args += "--build" }
  node @args
  exit $LASTEXITCODE
}

if (-not $Zip -and -not $Url) {
  Write-Host "Informe -Zip, -Url ou -Pedido"
  exit 1
}

$args = @("scripts/processar-pacote-zip.mjs")
if ($Zip) { $args += @("--zip", (Resolve-Path $Zip).Path) }
if ($Url) { $args += @("--url", $Url) }
if ($Cliente) { $args += @("--cliente", $Cliente) }
if ($Install) { $args += "--install" }
if ($Build) { $args += "--build" }

node @args
exit $LASTEXITCODE
