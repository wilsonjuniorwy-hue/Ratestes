# ================================================================================
#  SISTEMA DE GESTÃO DE RESERVA DE ARMAMENTO PMDF 🛡️
#  SCRIPT DE AUTOMAÇÃO DE INSTALAÇÃO DO AMBIENTE (PÓS-FORMATAÇÃO)
# ================================================================================

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

function Write-Header ($text) {
    Write-Host "`n==========================================================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Yellow
    Write-Host "==========================================================================" -ForegroundColor Cyan
}

function Write-Success ($text) {
    Write-Host "  [✓] $text" -ForegroundColor Green
}

function Write-Info ($text) {
    Write-Host "  [i] $text" -ForegroundColor DarkCyan
}

function Write-Warn ($text) {
    Write-Host "  [!] $text" -ForegroundColor Yellow
}

# 1. Verificar privilégios de Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warn "ATENÇÃO: Este script requer privilégios de Administrador para instalar programas."
    Write-Warn "Por favor, feche este terminal, abra o PowerShell como Administrador e rode novamente:"
    Write-Warn ".\scripts\setup_environment.ps1"
    Write-Host "`nPressione qualquer tecla para sair..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Header "INICIANDO CONFIGURAÇÃO DO AMBIENTE - RESERVA DE ARMAMENTO PMDF"

# Criar pasta temporária para instaladores
$tempDir = Join-Path $repoRoot "scratch\installers"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# --------------------------------------------------------------------------------
# 1. Git for Windows
# --------------------------------------------------------------------------------
if (Get-Command "git" -ErrorAction SilentlyContinue) {
    Write-Success "Git já está instalado! ($(git --version))"
} else {
    Write-Info "Baixando o Git for Windows..."
    $gitUrl = "https://github.com/git-for-windows/git/releases/download/v2.48.1.windows.1/Git-2.48.1-64-bit.exe"
    $gitPath = Join-Path $tempDir "git-installer.exe"
    Invoke-WebRequest -Uri $gitUrl -OutFile $gitPath
    
    Write-Info "Instalando o Git silenciosamente (aguarde)..."
    Start-Process -FilePath $gitPath -ArgumentList "/VERYSILENT", "/NORESTART", "/NOCANCEL", "/SP-" -Wait
    Write-Success "Git instalado com sucesso!"
}

# --------------------------------------------------------------------------------
# 2. Node.js LTS
# --------------------------------------------------------------------------------
if (Get-Command "node" -ErrorAction SilentlyContinue) {
    Write-Success "Node.js já está instalado! ($(node -v))"
} else {
    Write-Info "Baixando o Node.js v22 (LTS)..."
    $nodeUrl = "https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi"
    $nodePath = Join-Path $tempDir "node-installer.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodePath
    
    Write-Info "Instalando o Node.js silenciosamente (aguarde)..."
    Start-Process "msiexec.exe" -ArgumentList "/i `"$nodePath`" /qn /norestart" -Wait
    Write-Success "Node.js instalado com sucesso!"
}

# --------------------------------------------------------------------------------
# 3. Visual Studio C++ Build Tools (Necessário para o Rust / Tauri no Windows)
# --------------------------------------------------------------------------------
$vsPath = "C:\Program Files (x86)\Microsoft Visual Studio"
if (Test-Path $vsPath) {
    Write-Success "Visual Studio Build Tools já encontrado no sistema."
} else {
    Write-Info "Baixando o Visual Studio Build Tools 2022..."
    $vsUrl = "https://aka.ms/vs/17/release/vs_buildtools.exe"
    $vsPathExe = Join-Path $tempDir "vs_buildtools.exe"
    Invoke-WebRequest -Uri $vsUrl -OutFile $vsPathExe
    
    Write-Info "Instalando Ferramentas de Compilação C++ (Desktop development with C++) (isso pode levar alguns minutos)..."
    Start-Process -FilePath $vsPathExe -ArgumentList "--quiet", "--wait", "--norestart", "--nocache", "--add", "Microsoft.VisualStudio.Workload.VCTools", "--includeRecommended" -Wait
    Write-Success "Visual Studio C++ Build Tools instalado com sucesso!"
}

# --------------------------------------------------------------------------------
# 4. Rust & Cargo (rustup)
# --------------------------------------------------------------------------------
if (Get-Command "cargo" -ErrorAction SilentlyContinue) {
    Write-Success "Rust/Cargo já está instalado! ($(cargo --version))"
} else {
    Write-Info "Baixando o Rustup (rustup-init.exe)..."
    $rustUrl = "https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe"
    $rustPath = Join-Path $tempDir "rustup-init.exe"
    Invoke-WebRequest -Uri $rustUrl -OutFile $rustPath
    
    Write-Info "Instalando o Rust Toolchain silenciosamente (aguarde)..."
    Start-Process -FilePath $rustPath -ArgumentList "-y" -Wait
    Write-Success "Rust/Cargo instalado com sucesso!"
}

# --------------------------------------------------------------------------------
# 5. Atualizar variáveis de ambiente PATH na sessão atual
# --------------------------------------------------------------------------------
Write-Info "Atualizando variáveis de ambiente PATH..."
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
if (Test-Path "$env:USERPROFILE\.cargo\bin") {
    $env:Path += ";$env:USERPROFILE\.cargo\bin"
}
if (Test-Path "C:\Program Files\nodejs") {
    $env:Path += ";C:\Program Files\nodejs"
}
if (Test-Path "C:\Program Files\Git\cmd") {
    $env:Path += ";C:\Program Files\Git\cmd"
}

# --------------------------------------------------------------------------------
# 6. PNPM e Dependências do Projeto
# --------------------------------------------------------------------------------
Write-Header "INSTALANDO PNPM E DEPENDÊNCIAS DO PROJETO"

if (-not (Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
    Write-Info "Instalando o PNPM globalmente via npm..."
    if (Get-Command "npm" -ErrorAction SilentlyContinue) {
        npm install -g pnpm
        Write-Success "PNPM instalado com sucesso!"
    } else {
        Write-Warn "Não foi possível rodar 'npm'. Por favor, abra uma nova janela de terminal e rode 'npm install -g pnpm'."
    }
} else {
    Write-Success "PNPM já instalado! ($(pnpm -v))"
}

if (Get-Command "pnpm" -ErrorAction SilentlyContinue) {
    Write-Info "Executando 'pnpm install' na pasta do projeto..."
    Set-Location $repoRoot
    pnpm install
    Write-Success "Dependências do projeto instaladas com sucesso!"
}

Write-Header "INSTALAÇÃO CONCLUÍDA COM SUCESSO! 🚀"
Write-Host "Para rodar o projeto:" -ForegroundColor Yellow
Write-Host "  A) Modo Web:          pnpm dev" -ForegroundColor Cyan
Write-Host "  B) Modo Desktop Nativo: pnpm tauri dev" -ForegroundColor Cyan
Write-Host ""
