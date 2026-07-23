const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Configurações do Supabase Staging
const supabaseUrl = 'https://rndyzoyhpmubbbuxtuso.supabase.co';
const supabaseKey = 'sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function runTest() {
  console.log('======================================================');
  console.log('       INICIANDO TESTES AUTOMATIZADOS DE FLUXO');
  console.log('======================================================');

  try {
    // 1. LOGIN DE CONTROLE (ADMINTEST)
    console.log('\n[Passo 1/6] Efetuando login de administrador...');
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: 'admintest@admin.pm',
      password: 'password123'
    });

    if (authErr) {
      throw new Error(`Falha no login: ${authErr.message}`);
    }
    console.log(`🟢 Login efetuado com sucesso! ID do Admin: ${authData.user.id}`);

    // Obter um quartel válido para os testes
    const { data: quarteis, error: qErr } = await supabase
      .from('quarteis')
      .select('id, nome')
      .is('deletado_em', null)
      .limit(1);

    if (qErr || !quarteis || quarteis.length === 0) {
      throw new Error(`Não foi possível obter um quartel ativo: ${qErr?.message}`);
    }
    const quartelId = quarteis[0].id;
    console.log(`🏢 Quartel de Teste selecionado: ${quarteis[0].nome} (${quartelId})`);

    // Dados de teste únicos para evitar conflitos
    const testMatricula = `TEST-PM-${Math.floor(1000 + Math.random() * 9000)}`;
    const testMaterialId = `TEST-MAT-${Math.floor(1000 + Math.random() * 9000)}`;
    const testCautelaId = `TEST-CAUT-${Math.floor(1000 + Math.random() * 9000)}`;

    console.log(`\nIdentificadores temporários gerados:`);
    console.log(`- Matrícula Militar: ${testMatricula}`);
    console.log(`- Código Material: ${testMaterialId}`);
    console.log(`- Código Cautela: ${testCautelaId}`);

    // 2. CADASTRO DE POLICIAL
    console.log('\n[Passo 2/6] Cadastrando policial de teste...');
    const { error: userInsertErr } = await supabase
      .from('usuarios')
      .insert({
        matricula: testMatricula,
        nome: 'Policial de Teste Automatizado',
        nome_de_guerra: 'Test PM',
        perfil: 'policial',
        posto_graduacao: 'Soldado',
        situacao_cautela: 'apto',
        data_ultimo_teste_psicologico: '2099-12-31',
        id_quartel: quartelId
      });

    if (userInsertErr) {
      throw new Error(`Erro ao cadastrar policial: ${userInsertErr.message}`);
    }
    console.log('🟢 Policial cadastrado com sucesso!');

    // 3. CADASTRO DE EQUIPAMENTO (MATERIAL)
    console.log('\n[Passo 3/6] Cadastrando armamento de teste...');
    const { error: matInsertErr } = await supabase
      .from('materiais')
      .insert({
        id_material: testMaterialId,
        id_categoria: 'CAT-ARMA-CURTA',
        modelo: 'Pistola CZ - P10',
        fabricante: 'CZ',
        calibre: '9mm',
        status_atual: 'disponivel',
        data_aquisicao: new Date().toISOString().split('T')[0],
        id_quartel: quartelId,
        controle_quantidade: false
      });

    if (matInsertErr) {
      throw new Error(`Erro ao cadastrar armamento: ${matInsertErr.message}`);
    }
    console.log('🟢 Armamento cadastrado com sucesso!');

    // 4. SIMULAÇÃO DE CAUTELA (RETIRADA DE ARMA)
    console.log('\n[Passo 4/6] Executando cautela (retirada)...');
    
    // Inserir registro de Cautela
    const { error: cautelaErr } = await supabase
      .from('cautelas')
      .insert({
        id_cautela: testCautelaId,
        matricula_policial: testMatricula,
        matricula_armeiro_retirada: 'ADMINTEST',
        data_retirada: new Date().toISOString(),
        previsao_devolucao: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        status_cautela: 'ativa',
        observacoes_retirada: 'Teste automatizado de fluxo de cautela.',
        id_quartel: quartelId
      });

    if (cautelaErr) {
      throw new Error(`Erro ao registrar cautela: ${cautelaErr.message}`);
    }

    // Inserir item da Cautela
    const { error: itemErr } = await supabase
      .from('cautela_itens')
      .insert({
        id_cautela_item: `ITEM-${Math.floor(100000 + Math.random() * 900000)}`,
        id_cautela: testCautelaId,
        id_material: testMaterialId,
        quantidade: 1,
        estado_entrega: 'excelente',
        id_quartel: quartelId
      });

    if (itemErr) {
      throw new Error(`Erro ao registrar item de cautela: ${itemErr.message}`);
    }

    // Atualizar status do material para 'cautelado' e policial para 'pendente_devolucao'
    await supabase.from('materiais').update({ status_current: 'cautelado', status_atual: 'cautelado' }).eq('id_material', testMaterialId);
    await supabase.from('usuarios').update({ situacao_cautela: 'pendente_devolucao' }).eq('matricula', testMatricula);

    // Verificar se os estados foram alterados corretamente
    const { data: verifMat } = await supabase.from('materiais').select('status_atual').eq('id_material', testMaterialId).single();
    const { data: verifUser } = await supabase.from('usuarios').select('situacao_cautela').eq('matricula', testMatricula).single();

    if (verifMat.status_atual !== 'cautelado' || verifUser.situacao_cautela !== 'pendente_devolucao') {
      throw new Error(`Status de cautela inconsistente. Material: ${verifMat.status_atual}, Policial: ${verifUser.situacao_cautela}`);
    }
    console.log('🟢 Cautela efetuada e confirmada! Material marcado como CAUTELADO e militar como PENDENTE_DEVOLUCAO.');

    // 5. SIMULAÇÃO DE DEVOLUÇÃO
    console.log('\n[Passo 5/6] Executando devolução...');
    
    // Atualizar Cautela para devolvida
    const { error: devErr } = await supabase
      .from('cautelas')
      .update({
        data_devolucao_efetiva: new Date().toISOString(),
        matricula_armeiro_devolucao: 'ADMINTEST',
        status_cautela: 'devolvida',
        observacoes_devolucao: 'Devolução efetuada com sucesso via teste automatizado.'
      })
      .eq('id_cautela', testCautelaId);

    if (devErr) {
      throw new Error(`Erro ao finalizar devolução: ${devErr.message}`);
    }

    // Atualizar status do material e do policial de volta para disponivel/apto
    await supabase.from('materiais').update({ status_current: 'disponivel', status_atual: 'disponivel' }).eq('id_material', testMaterialId);
    await supabase.from('usuarios').update({ situacao_cautela: 'apto' }).eq('matricula', testMatricula);

    // Verificar se os estados voltaram ao normal
    const { data: verifMatDev } = await supabase.from('materiais').select('status_atual').eq('id_material', testMaterialId).single();
    const { data: verifUserDev } = await supabase.from('usuarios').select('situacao_cautela').eq('matricula', testMatricula).single();

    if (verifMatDev.status_atual !== 'disponivel' || verifUserDev.situacao_cautela !== 'apto') {
      throw new Error(`Status de devolução inconsistente. Material: ${verifMatDev.status_atual}, Policial: ${verifUserDev.situacao_cautela}`);
    }
    console.log('🟢 Devolução concluída! Equipamento de volta como DISPONÍVEL e policial como APTO.');

    // 6. LIMPEZA DOS DADOS DE TESTE (CLEANUP)
    console.log('\n[Passo 6/6] Limpando dados temporários de teste...');
    
    await supabase.from('cautela_itens').delete().eq('id_cautela', testCautelaId);
    await supabase.from('cautelas').delete().eq('id_cautela', testCautelaId);
    await supabase.from('materiais').delete().eq('id_material', testMaterialId);
    await supabase.from('usuarios').delete().eq('matricula', testMatricula);

    console.log('🟢 Limpeza concluída sem deixar rastros no SGBD.');
    console.log('\n======================================================');
    console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO! 100% FUNCIONAL');
    console.log('======================================================');

  } catch (error) {
    console.error('\n🔴 O TESTE FALHOU COM ERRO:');
    console.error(error.message);
    console.log('======================================================');
  }
}

runTest();
