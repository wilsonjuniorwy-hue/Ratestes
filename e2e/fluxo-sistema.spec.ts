import { test, expect } from '@playwright/test';

test.describe('Fluxo Completo de Cautela e Administração', () => {
  
  test('Deve logar como admin, cadastrar policial, cadastrar senha de primeiro acesso e excluir o policial de teste', async ({ page }) => {
    // Escuta e imprime os logs do console do navegador no terminal do Playwright para depuração
    page.on('console', msg => {
      console.log(`[CONSOLE BROWSER - ${msg.type().toUpperCase()}] ${msg.text()}`);
    });

    // Escuta e aceita diálogos de confirmação (ex: confirmação de exclusão)
    page.on('dialog', async (dialog) => {
      console.log(`[DIÁLOGO] Tipo: ${dialog.type()} | Mensagem: ${dialog.message()}`);
      await dialog.accept();
    });

    // 1. Acesso à tela de Login
    console.log('1. Acessando a página de login...');
    await page.goto('/');
    await expect(page).toHaveTitle(/Reserva de Armamento/i);

    // 2. Preenchimento de credenciais do Administrador
    console.log('2. Efetuando login do Administrador...');
    // Aguarda o select de quartéis estar visível e seleciona Cavalaria
    const quartelSelect = page.locator('select').first();
    await expect(quartelSelect).toBeVisible();
    await quartelSelect.selectOption({ index: 0 });

    // Preenche matrícula
    const matriculaInput = page.locator('input[placeholder="Matrícula Funcional"]');
    await expect(matriculaInput).toBeVisible();
    await matriculaInput.fill('ADMINTEST');

    // Preenche senha
    const senhaInput = page.locator('input[placeholder="Senha cadastrada..."]');
    await expect(senhaInput).toBeVisible();
    await senhaInput.fill('password123');

    // Submete formulário
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // 3. Verificação do login e navegação para painel
    console.log('3. Logado como Admin. Selecionando o quartel Cavalaria...');
    await page.waitForURL('**/');
    
    // Clica em "Entrar" no Regimento de Cavalaria no painel do administrador
    const entrarQuartelBtn = page.locator('button:has-text("Entrar")').first();
    await expect(entrarQuartelBtn).toBeVisible();
    // Aguarda um pequeno timeout para garantir a hidratação do React e binding dos eventos do clique
    await page.waitForTimeout(1500);
    await entrarQuartelBtn.click();

    // Aguarda o cabeçalho estar presente no DOM (indica que a transição de rota ocorreu)
    await page.locator('#app-header').waitFor({ state: 'attached' });

    // Aguarda o sumiço do spinner de carregamento/sincronização do Supabase (se ele estiver visível)
    const loader = page.locator('text=Sincronizando com o SGBD Cloud Supabase...');
    try {
      if (await loader.isVisible()) {
        await expect(loader).not.toBeVisible({ timeout: 20000 });
      }
    } catch (e) {
      // Ignora se já sumiu ou não ficou visível
    }

    // Garante que o cabeçalho está totalmente visível para interação
    await expect(page.locator('#app-header')).toBeVisible();

    // Seleciona o modo "Console da Armaria (Armeiro)"
    const btnModeArmeiro = page.locator('#btn-mode-armeiro');
    await expect(btnModeArmeiro).toBeVisible();
    await btnModeArmeiro.click();

    // 4. Cadastro de Novo Policial Militar
    console.log('4. Cadastrando novo policial militar...');
    // Clica na sub-aba de cadastros
    const tabCadastro = page.locator('#btn-arm-tab-cadastro_usuarios');
    await expect(tabCadastro).toBeVisible();
    await tabCadastro.click();

    // Preenche dados do novo militar
    const matriculaMilitar = `PM-E2E-${Math.floor(10000 + Math.random() * 90000)}`;
    console.log(`Matrícula gerada para o teste: ${matriculaMilitar}`);

    await page.locator('input[placeholder="EX: JEAN-CLAUDE VAN DAMME"]').fill('POLICIAL TESTE AUTOMATIZADO');
    await page.locator('input[placeholder="EX: VAN DAMME"]').fill('TESTE E2E');
    await page.locator('input[placeholder="EX: PM-333333"]').fill(matriculaMilitar);
    await page.locator('#form-cadastro-usuario select').first().selectOption('Soldado');

    // Submete o cadastro
    await page.locator('#form-cadastro-usuario button[type="submit"]').click();

    // Aguarda mensagem de sucesso em tela
    console.log('5. Verificando confirmação de cadastro...');
    // Aguarda 3 segundos para garantir que a gravação no Supabase foi concluída
    await page.waitForTimeout(3000);

    // 5. Simular Primeiro Acesso do Policial no Totem
    console.log('6. Acessando Totem de Autoatendimento...');
    const btnModePolicial = page.locator('#btn-mode-policial');
    await expect(btnModePolicial).toBeVisible();
    await btnModePolicial.click();

    // Preencher a matrícula no Totem
    const inputMatriculaTotem = page.locator('#input-matricula');
    await expect(inputMatriculaTotem).toBeVisible();
    await inputMatriculaTotem.fill(matriculaMilitar);

    // Clica para autenticar (somente matrícula agora)
    await page.locator('#btn-submit-login').click();

    // Aguarda entrar na tela de aptidão / travas
    await expect(page.locator('#policial-aptitude-step')).toBeVisible();

    // Avança para escolha de materiais
    const btnGoToSelectMaterials = page.locator('#btn-go-to-select-materials');
    await expect(btnGoToSelectMaterials).toBeVisible();
    await btnGoToSelectMaterials.click();

    // Aguarda carregar a tela de dotações do totem
    await expect(page.locator('#policial-cart-step')).toBeVisible();

    // Adiciona um material disponível ao carrinho (primeiro botão "Selecionar" no modal de busca rápida que abriu automaticamente)
    const selectMaterialBtn = page.locator('button:has-text("Selecionar")').first();
    await expect(selectMaterialBtn).toBeVisible();
    await selectMaterialBtn.click();

    // Se abrir o modal de dotação de acessórios (para armas de fogo), confirma a carga
    await page.locator('button:has-text("Confirmar Carga")')
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(async () => {
        await page.locator('button:has-text("Confirmar Carga")').click();
      })
      .catch(() => {
        // Modal de acessórios não abriu (não é arma de fogo ou já está no carrinho), segue em frente
      });

    // Clica em "Cadastrar Senha" no painel direito do modal (o que fecha o modal e redireciona para a criação de senha)
    const registerPasswordBtn = page.locator('button:has-text("Cadastrar Senha")');
    await expect(registerPasswordBtn).toBeVisible();
    await registerPasswordBtn.click();

    // 6. Cadastro de Senha de Primeiro Acesso
    console.log('7. Detectou primeiro acesso no checkout. Configurando PIN de 4 dígitos...');
    const inputNovaSenha = page.locator('#input-nova-senha');
    await expect(inputNovaSenha).toBeVisible();
    await inputNovaSenha.fill('4321');

    const inputConfirmarSenha = page.locator('#input-confirmar-senha');
    await expect(inputConfirmarSenha).toBeVisible();
    await inputConfirmarSenha.fill('4321');

    // Confirma cadastro de senha
    await page.locator('#btn-submit-cadastro-senha').click();

    // Aguarda entrar na tela de assinatura digital final
    console.log('8. Acesso ao checkout final validado com sucesso!');
    await expect(page.locator('#policial-sign-step')).toBeVisible();

    // 7. Cleanup - Exclusão do Policial do Banco de Dados
    console.log('9. Removendo policial de teste para limpeza do banco...');
    
    // Altera para o modo Banco de Dados
    const btnModeDb = page.locator('#btn-mode-banco-dados');
    await expect(btnModeDb).toBeVisible();
    await btnModeDb.click();

    // Aguarda a lista de usuários carregar
    await expect(page.locator('#arm-banco-dados-view table').first()).toBeVisible();

    // Filtra/Procura a linha do militar na tabela de policiais e clica no botão "Excluir"
    const row = page.locator('table').first().locator('tr').filter({ hasText: matriculaMilitar });
    await expect(row).toBeVisible();
    
    const deleteBtn = row.locator('button:has-text("Excluir")');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Aguarda que a linha desapareça da tabela após a exclusão do Supabase
    await expect(row).not.toBeVisible({ timeout: 12000 });
    console.log('🟢 Fluxo concluído com sucesso! Policial de teste cadastrado, verificado e limpo do banco.');
  });
});
