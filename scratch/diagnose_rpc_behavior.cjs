const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const supabaseKey = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE'
    }
  }
});

async function main() {
  console.log('=== TESTE DE DIAGNÓSTICO DAS RPCs NO SUPABASE ===\n');

  const testMatId = `TEST-BAT-${Date.now()}`;
  const testCautId = `TEST-CAUT-${Date.now()}`;
  const testItemId = `TEST-ITEM-${Date.now()}`;
  const testPolicial = '7322623'; // Policial existente

  // 1. Criar material de teste
  console.log(`1. Criando material de teste ${testMatId} com quantidade = 10...`);
  const { error: errMat } = await supabase.from('materiais').insert({
    id_material: testMatId,
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'Bateria Teste Diagnóstico',
    fabricante: 'TEST',
    status_atual: 'disponivel',
    controle_quantidade: true,
    quantidade: 10,
    data_aquisicao: '2026-08-20'
  });

  if (errMat) {
    console.error('Erro ao criar material de teste:', errMat);
    return;
  }

  // 2. Chamar fn_efetivar_cautela
  console.log(`2. Chamando fn_efetivar_cautela acautelando 2 unidades...`);
  const cautelaPayload = {
    id_cautela: testCautId,
    matricula_policial: testPolicial,
    matricula_armeiro_retirada: 'A7317573',
    data_retirada: new Date().toISOString(),
    previsao_devolucao: new Date(Date.now() + 3600000).toISOString(),
    status_cautela: 'ativa',
    observacoes_retirada: 'Teste diagnóstico'
  };

  const itensPayload = [{
    id_cautela_item: testItemId,
    id_cautela: testCautId,
    id_material: testMatId,
    quantidade: 2,
    estado_entrega: 'excelente'
  }];

  const { data: rpcCautelaData, error: errRpcCautela } = await supabase.rpc('fn_efetivar_cautela', {
    p_cautela: cautelaPayload,
    p_itens: itensPayload
  });

  if (errRpcCautela) {
    console.error('❌ Erro na RPC fn_efetivar_cautela:', errRpcCautela);
  } else {
    console.log('✔ fn_efetivar_cautela executada com sucesso:', rpcCautelaData);
  }

  // 3. Checar quantidade no banco após cautela
  const { data: matPosCautela } = await supabase
    .from('materiais')
    .select('quantidade')
    .eq('id_material', testMatId)
    .single();

  console.log(`-> Quantidade de ${testMatId} após CAUTELA: ${matPosCautela?.quantidade} (Esperado: 10 se invariante, ou 8 se decrementou)`);

  // 4. Chamar fn_realizar_devolucao
  console.log(`\n4. Chamando fn_realizar_devolucao devolvendo as 2 unidades (consumido: false)...`);
  const devPayload = [{
    id_cautela_item: testItemId,
    id_material: testMatId,
    quantidade: 2,
    estado_devolucao: 'em_condicoes_de_uso',
    consumido: false
  }];

  const { data: rpcDevData, error: errRpcDev } = await supabase.rpc('fn_realizar_devolucao', {
    p_id_cautela: testCautId,
    p_matricula_armeiro: 'A7317573',
    p_status_cautela: 'devolvida',
    p_data_devolucao_efetiva: new Date().toISOString(),
    p_observacoes_devolucao: 'Devolução teste diagnóstico',
    p_itens_devolvidos: devPayload
  });

  if (errRpcDev) {
    console.error('❌ Erro na RPC fn_realizar_devolucao:', errRpcDev);
  } else {
    console.log('✔ fn_realizar_devolucao executada com sucesso:', rpcDevData);
  }

  // 5. Checar quantidade no banco após devolução
  const { data: matPosDevolucao } = await supabase
    .from('materiais')
    .select('quantidade')
    .eq('id_material', testMatId)
    .single();

  console.log(`-> Quantidade de ${testMatId} após DEVOLUÇÃO: ${matPosDevolucao?.quantidade} (Se for 12, a RPC ESTÁ INFLANDO O ESTOQUE!)`);

  // 6. Limpeza
  console.log('\n6. Limpando dados de teste...');
  await supabase.from('cautela_itens').delete().eq('id_cautela_item', testItemId);
  await supabase.from('cautelas').delete().eq('id_cautela', testCautId);
  await supabase.from('materiais').delete().eq('id_material', testMatId);
  console.log('✔ Limpeza concluída.');
}

main().catch(console.error);
