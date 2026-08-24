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

async function testRpcDefinitions() {
  console.log('=== TESTANDO SE AS PROCEDURES ESTÃO ATIVAS E COM RESPOSTA VÁLIDA ===\n');

  // Testar chamada à procedure com cautela inexistente (deve retornar erro amigável 'Cautela não encontrada')
  const { data, error } = await supabase.rpc('fn_realizar_devolucao', {
    p_id_cautela: 'CAUT-INEXISTENTE-VALIDACAO',
    p_matricula_armeiro: 'A7317573',
    p_status_cautela: 'devolvida',
    p_data_devolucao_efetiva: new Date().toISOString(),
    p_observacoes_devolucao: 'Teste',
    p_itens_devolvidos: []
  });

  if (error && error.message.includes('Cautela CAUT-INEXISTENTE-VALIDACAO não encontrada')) {
    console.log('✔ fn_realizar_devolucao está instalada e respondendo perfeitamente com SECURITY DEFINER!');
  } else {
    console.log('Resposta inesperada:', data, error);
  }

  // Testar efetivar cautela com policial inexistente (deve validar normalmente)
  const { data: dataCaut, error: errCaut } = await supabase.rpc('fn_efetivar_cautela', {
    p_cautela: {
      id_cautela: 'CAUT-TEST-VAL',
      matricula_policial: '99999999-INEXISTENTE',
      matricula_armeiro_retirada: 'A7317573',
      data_retirada: new Date().toISOString(),
      status_cautela: 'ativa'
    },
    p_itens: []
  });

  if (errCaut && errCaut.message.includes('não encontrado ou desativado')) {
    console.log('✔ fn_efetivar_cautela está instalada e respondendo perfeitamente com SECURITY DEFINER!');
  } else {
    console.log('Resposta inesperada efetivar:', dataCaut, errCaut);
  }
}

testRpcDefinitions().catch(console.error);
