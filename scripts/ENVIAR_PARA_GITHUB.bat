@echo off
cd /d "%~dp0\.."

echo === ENVIANDO RELEASE V0.3.0 PARA O GITHUB ===
echo.

git config --global --add safe.directory "%~dp0\.."

echo [1/6] Adicionando arquivos...
git add .

echo [2/6] Criando commit...
git commit -m "release: v0.3.0 - novo relatorio geral PMDF, impressao de passagem de servico e ordenacao de cautelas"

echo [3/6] Criando tag v0.3.0...
git tag -a v0.3.0 -m "Release v0.3.0"

echo [4/6] Enviando codigo para o GitHub (feature/tauri-desktop)...
git push origin feature/tauri-desktop

echo [5/6] Enviando para a branch main...
git push origin feature/tauri-desktop:main

echo [6/6] Enviando tag v0.3.0 para o GitHub...
git push origin v0.3.0

echo.
echo === CONCLUIDO! O SISTEMA FOI ENVIADO COM SUCESSO AO GITHUB (RELEASE V0.3.0) ===
pause
