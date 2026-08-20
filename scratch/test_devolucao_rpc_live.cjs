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
  console.log('=== TESTE DIRETO DE fn_realizar_devolucao NO SUPABASE ===\n');

  // 1. Criar cautela temporária no banco
  const testCautId = `TEST-DEV-${Date.now()}`;
  const testMatId = `TEST-MAT-${Date.now()}`;
  const testItemId = `TEST-ITEM-${Date.now()}`;

  console.log('1. Criando material de teste com quantidade = 100...');
  await supabase.from('materiais').insert({
    id_material: testMatId,
    id_categoria: 'CAT-COMUNICACAO',
    modelo: 'Item Teste Devolucao',
    fabricante: 'TEST',
    status_atual: 'disponivel',
    controle_quantidade: true,
    quantidade: 100,
    data_aquisicao: '2026-08-20'
  });

  console.log('2. Criando cautela e item de teste...');
  await supabase.from('cautelas').insert({
    id_cautela: testCautId,
    matricula_policial: '7317573',
    matricula_armeiro_retirada: 'A7317573',
    data_retirada: new Date().toISOString(),
    status_cautela: 'ativa'
  });

  await supabase.from('cautela_itens').insert({
    id_cautela_item: testItemId,
    id_cautela: testCautId,
    id_material: testMatId,
    quantidade: 5,
    estado_entrega: 'excelente'
  });

  // 3. Executar fn_realizar_devolucao
  console.log('3. Executando fn_realizar_devolucao devolvendo 5 unidades (consumido: false)...');
  const { data: rpcResult, error: rpcErr } = await supabase.rpc('fn_realizar_devolucao', {
    p_id_cautela: testCautId,
    p_matricula_armeiro: 'A7317573',
    p_status_cautela: 'devolvida',
    p_data_devolucao_efetiva: new Date().toISOString(),
    p_observacoes_devolucao: 'Devolução teste',
    p_itens_devolvidos: [{
      id_cautela_item: testItemId,
      id_material: testMatId,
      quantidade: 5,
      estado_devolucao: 'em_condicoes_de_uso',
      consumido: false
    }]
  });

  console.log('Resultado RPC:', rpcResult, 'Erro:', rpcErr);

  // 4. Checar quantidade no banco
  const { data: matResult } = await supabase.from('materiais').select('quantidade').eq('id_material', testMatId).single();
  console.log(`\n=============================================================`);
  console.log(`QUANTIDADE FINAL DO MATERIAL NO BANCO: ${matResult?.quantidade}`);
  if (matResult?.quantidade === 100) {
    console.log(`✔ A RPC NÃO inflou o estoque (quantidade permaneceu 100).`);
  } else if (matResult?.quantidade === 105) {
    console.log(`🚨 ATENÇÃO: A RPC fn_realizar_devolucao ESTÁ ATIVA COM O CÓDIGO ANTIGO (quantidade subiu de 100 para 105)!`);
  } else {
    console.log(`Outro valor retornado: ${matResult?.quantidade}`);
  }
  console.log(`=============================================================\n`);

  // 5. Limpeza
  await supabase.from('cautela_itens').delete().eq('id_cautela_item', testItemId);
  await supabase.from('cautelas').delete().eq('id_cautela', testCautId);
  await supabase.from('materiais').delete().eq('id_material', testMatId);
  console.log('✔ Limpeza concluída.');
}

main().catch(console.error);
