# 📦 Como Enviar uma Nova Versão para o GitHub

> Guia passo a passo para publicar uma nova release do sistema Reserva de Armamento.
> Siga **todos os passos na ordem** para evitar problemas com o GitHub Actions.

---

## ✅ Pré-requisitos

- Git instalado (`C:\Program Files\Git\cmd\git.exe`)
- Acesso ao repositório: `https://github.com/wilsonjuniorwy-hue/Ratestes`
- Terminal: **PowerShell** ou **Git Bash**

> **Dica:** Se o PowerShell não reconhecer o comando `git`, feche e abra uma nova janela do PowerShell.

---

## 📋 Passo a Passo

### 1. Descubra a versão atual

Abra o arquivo `package.json` e veja o campo `"version"`. Exemplo: `"0.2.44"`.
A **nova versão** será o próximo número. Exemplo: `0.2.45`.

### 2. Atualize a versão nos 3 arquivos obrigatórios

Antes de enviar, **atualize o número da versão** nestes 3 arquivos:

| Arquivo | Campo a alterar |
|---------|----------------|
| `package.json` | `"version": "0.2.XX"` |
| `src-tauri/tauri.conf.json` | `"version": "0.2.XX"` |
| `scripts/ENVIAR_PARA_GITHUB.bat` | Todas as referências `v0.2.XX` |

> ⚠️ **IMPORTANTE:** A versão nos 3 arquivos DEVE ser idêntica e DEVE ser uma versão que **nunca foi usada antes**.

### 3. Envie para o GitHub

Abra o PowerShell na pasta do projeto e cole o comando abaixo, **substituindo `XX` pelo número da nova versão**:

```powershell
git add .; git commit -m "release: v0.2.XX - descricao das mudancas"; git tag v0.2.XX; git push origin feature/tauri-desktop; git push origin feature/tauri-desktop:main; git push origin v0.2.XX
```

#### Exemplo real para a versão 0.2.45:

```powershell
git add .; git commit -m "release: v0.2.45 - descricao das mudancas"; git tag v0.2.45; git push origin feature/tauri-desktop; git push origin feature/tauri-desktop:main; git push origin v0.2.45
```

### 4. Verifique no GitHub

1. Acesse `https://github.com/wilsonjuniorwy-hue/Ratestes`
2. Clique na aba **Actions**
3. Deve aparecer um novo workflow **"publish"** rodando com bolinha amarela 🟡
4. Aguarde ~8 minutos até ficar verde ✅

### 5. Publique a Release

1. Após o workflow terminar (bolinha verde ✅), vá na aba **Releases**
2. A nova versão estará como **Draft** (rascunho)
3. Clique no ícone de edição ✏️
4. Clique em **"Publish release"** para liberar a atualização

> Após publicar, os computadores com o sistema instalado receberão a atualização automaticamente!

---

## 🔧 Disparo Manual (Caso o Actions Não Dispare Sozinho)

Se o workflow não aparecer na aba Actions após o push:

1. Vá na aba **Actions**
2. No menu lateral esquerdo, clique em **"publish"**
3. Clique no botão **"Run workflow"** (canto superior direito)
4. Selecione a branch **main**
5. Clique em **"Run workflow"**

---

## ⚠️ Erros Comuns e Soluções

### Erro: `git não é reconhecido`
**Causa:** O terminal foi aberto antes da instalação do Git.
**Solução:** Feche o PowerShell e abra uma nova janela.

### Erro: `failed to push some refs` / `fetch first`
**Causa:** O GitHub tem commits que você não tem localmente.
**Solução:** Rode antes do push:
```powershell
git pull origin feature/tauri-desktop --rebase
```
Se der conflito, resolva os arquivos marcados e depois:
```powershell
git add .; git rebase --continue
```

### Erro: `tag already exists`
**Causa:** A tag que você tentou criar já existe.
**Solução:** Use um número de versão maior (ex: se `v0.2.45` já existe, use `v0.2.46`).

### Erro: `Updates were rejected` ao dar push
**Causa:** Alguém (ou outro computador) enviou mudanças depois de você.
**Solução:**
```powershell
git pull origin feature/tauri-desktop --rebase
git push origin feature/tauri-desktop
git push origin feature/tauri-desktop:main
```

### O workflow do Actions não apareceu
**Causa:** O GitHub nem sempre detecta o push da tag automaticamente.
**Solução:** Use o disparo manual (seção acima).

---

## 📁 Alternativa: Usar o Script Automático

Em vez de digitar o comando no PowerShell, você pode dar **duplo clique** no arquivo:

```
scripts/ENVIAR_PARA_GITHUB.bat
```

> ⚠️ Lembre-se de atualizar a versão dentro do `.bat` antes de usá-lo!

---

## 📌 Resumo Rápido (Cola Rápida)

```
1. Atualizar versão em: package.json + tauri.conf.json + ENVIAR_PARA_GITHUB.bat
2. PowerShell: git add .; git commit -m "release: vX.X.XX - ..."; git tag vX.X.XX; git push origin feature/tauri-desktop; git push origin feature/tauri-desktop:main; git push origin vX.X.XX
3. GitHub Actions: esperar workflow "publish" rodar (~8 min)
4. Releases: publicar o Draft
```
