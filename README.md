# Reserva de Armamento PMDF 🛡️

Sistema tático desktop e web para controle, gestão e cautela de reserva de armamento da Polícia Militar do Distrito Federal (PMDF).

Esta versão foi migrada para rodar nativamente no Windows utilizando **Tauri v2** + **Vite/React**, garantindo máxima segurança através de **homologação de hardware física** (motherboard UUID + MachineGuid) e controle de acessos centralizado no banco de dados **Supabase**.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
Certifique-se de ter instalado no seu computador:
1. **Node.js** (LTS)
2. **PNPM** (`npm install -g pnpm`)
3. **Rust & Cargo** (Necessário para compilar o Tauri. Instale através do [rustup.rs](https://rustup.rs/))

---

### 💻 1. Desenvolvimento Rápido Local (Tauri Desktop)
Para rodar o aplicativo de forma nativa e editar o código em tempo real:

1. **Instale as dependências:**
   ```powershell
   pnpm install
   ```
2. **Inicie o servidor de desenvolvimento do Tauri:**
   ```powershell
   pnpm tauri dev
   ```
   * **Hot Reload:** Qualquer alteração no código feita no editor (VS Code) será atualizada e exibida **instantaneamente** na janela do aplicativo em menos de 1 segundo, sem necessidade de recompilar ou reiniciar o app.

---

### 🌐 2. Desenvolvimento Apenas Web (Navegador)
Para rodar e testar o sistema apenas no navegador de internet (ignora a validação de hardware físico do Tauri):
```powershell
pnpm dev
```
O projeto estará disponível em `http://localhost:3000`.

---

## 🏭 Fluxo de Deploy e Publicação (Nova Release)

Quando terminar de fazer alterações locais (botões, tabelas, novas abas) e desejar enviar a atualização para todos os computadores instalados, siga este fluxo:

### Passo 1: Atualizar as Versões
Altere o campo `"version"` (ex: de `"0.2.0"` para `"0.2.1"`) nos seguintes arquivos:
1. `package.json`
2. `src-tauri/tauri.conf.json`

### Passo 2: Criar e Enviar a Tag Git
Abra o terminal e execute os seguintes comandos:
```powershell
git add package.json src-tauri/tauri.conf.json
git commit -m "chore: bump version to v0.2.1"
git tag v0.2.1
git push origin feature/tauri-desktop
git push origin v0.2.1
```

### Passo 3: Compilação no GitHub Actions
1. Acesse o pipeline nas Actions do seu repositório:
   👉 [GitHub Actions - Reserva de Armamento](https://github.com/wilsonjuniorwy-hue/Reserva-de-armamento/actions)
2. O GitHub começará a compilar e assinar digitalmente o instalador Windows (`.msi`) automaticamente. Aguarde até o build ficar verde (aprox. 10 minutos).

### Passo 4: Publicar a Release para Atualização Automática (Auto-Updater)
1. Vá na aba de [Releases](https://github.com/wilsonjuniorwy-hue/Reserva-de-armamento/releases).
2. O build gerará um rascunho em amarelo marcado como **Draft** da versão criada (ex: `v0.2.1`).
3. Clique em **Edit** (Editar) na release correspondente.
4. Role a página até o final e clique no botão **Publish Release** (Publicar Release).
5. **Pronto!** O aplicativo instalado nas armarias buscará o update e atualizará os computadores dos policiais automaticamente no próximo início.

---

## 🔐 Estrutura de Segurança e Assinatura Digital

Para garantir que apenas atualizações oficiais autorizadas por você sejam instaladas nas máquinas dos policiais, o Tauri exige assinatura digital:

* **Chave Privada (`TAURI_SIGNING_PRIVATE_KEY`):** Cadastrada de forma totalmente segura e oculta no repositório em *Settings > Secrets and variables > Actions* do GitHub. 
* **Chave Pública (`pubkey` em `tauri.conf.json`):** Chave em formato base64 inserida na configuração do projeto para validar se o download da nova versão é seguro.
* **Ignorados pelo Git:** Os arquivos de chave locais (`tauri-key-final.key` e `tauri-key-final.key.pub`) estão protegidos pelo `.gitignore` e **nunca** devem ser compartilhados ou commitados no repositório.

---

## 🗄️ Controle de Ambientes e Bancos de Dados

O sistema possui chaveamento dinâmico entre dois bancos de dados Supabase na nuvem:

1. **Homologação/Staging:** Banco de testes livre para simulações e cadastros experimentais.
   * *Identificação:* Badge azul **HOMOLOGAÇÃO** no topo e no rodapé.
   * *URL:* `https://rndyzoyhpmubbbuxtuso.supabase.co`
2. **Produção:** Banco de dados oficial ativo nas armarias.
   * *Identificação:* Badge vermelho **PRODUÇÃO** no topo e no rodapé.
   * *URL:* `https://rwnldjtevkheiwutxhgg.supabase.co`

### Como Alterar o Ambiente
Tanto na tela de login quanto na tela de bloqueio de homologação, há um seletor no rodapé. Clique no ambiente desejado. O sistema salvará a preferência localmente, recarregará a página e se conectará dinamicamente ao banco correspondente.
