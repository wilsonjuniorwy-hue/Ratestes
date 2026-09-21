@echo off
cd /d "%~dp0\.."

echo === ENVIANDO RELEASE V0.3.9 PARA O GITHUB ===
echo.

git config --global --add safe.directory "%~dp0\.."

echo [1/6] Adicionando arquivos...
git add .

echo [2/6] Criando commit...
git commit -m "chore: release v0.3.9"

echo [3/6] Criando tag v0.3.9...
git tag -a v0.3.9 -m "Release v0.3.9"

echo [4/6] Enviando codigo para o GitHub (main)...
git push origin main

echo [5/6] Enviando para a branch feature/tauri-desktop...
git push origin main:feature/tauri-desktop

echo [6/6] Enviando tag v0.3.9 para o GitHub...
git push origin v0.3.9 --force

echo.
echo === CONCLUIDO! O SISTEMA FOI ENVIADO COM SUCESSO AO GITHUB (RELEASE V0.3.9) ===
pause
