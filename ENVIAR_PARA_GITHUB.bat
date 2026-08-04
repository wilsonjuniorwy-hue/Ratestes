@echo off
cd /d "%~dp0"

echo === ENVIANDO RELEASE V0.2.36 PARA O GITHUB ===
echo.

git config --global --add safe.directory "%~dp0"

echo [1/5] Adicionando arquivos...
git add .

echo [2/5] Criando commit...
git commit -m "release: v0.2.36 - auditoria geral: correcoes de state leak, TypeError, printMode e imports"

echo [3/5] Enviando codigo para o GitHub...
git push origin feature/tauri-desktop

echo [4/5] Enviando para a branch main...
git push origin feature/tauri-desktop:main

echo.
echo === CONCLUIDO! O SISTEMA FOI ENVIADO COM SUCESSO AO GITHUB ===
pause
