@echo off
SET GIT=C:\Users\wagne\AppData\Local\GitHubDesktop\app-3.4.15\resources\app\git\cmd\git.exe

IF NOT EXIST "%GIT%" (
    echo Git nao encontrado em %GIT%
    echo Tente usar o Git Bash ou o GitHub Desktop.
    pause
    exit /b
)

cd /d "G:\Sistemas\gestão-de-reserva-de-armamento-pm"

echo === ENVIANDO RELEASE V0.2.27 PARA O GITHUB ===
echo.

echo [1/5] Adicionando arquivos...
"%GIT%" add .

echo [2/5] Criando commit...
"%GIT%" commit -m "release: v0.2.27 - correcao na impressao de assinatura e padronizacao graduacao e nome de guerra"

echo [3/5] Criando tag v0.2.27...
"%GIT%" tag v0.2.27

echo [4/5] Enviando codigo para o GitHub (branch main)...
"%GIT%" push origin main

echo [5/5] Enviando tag v0.2.27 para disparar o atualizador...
"%GIT%" push origin v0.2.27

echo.
echo === CONCLUIDO! O SISTEMA SERA ATUALIZADO AUTOMATICAMENTE NAS OUTRAS MAQUINAS ===
pause
