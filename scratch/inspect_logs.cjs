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
  console.log('=== AUDITORIA LOGS RELACIONADOS A DEVOLUÇÃO E ESTOQUE ===');
  const { data: logs } = await supabase
    .from('auditoria_logs')
    .select('*')
    .or('detalhes.ilike.%bateria%,detalhes.ilike.%hytera%,detalhes.ilike.%9mm%,detalhes.ilike.%estoque%,detalhes.ilike.%adicionad%')
    .order('data_hora', { ascending: false })
    .limit(50);

  console.table(logs?.map(l => ({
    data: l.data_hora,
    executor: l.matricula_executor,
    evento: l.tipo_evento,
    detalhes: l.detalhes?.slice(0, 80)
  })));

  // Cautelas recentes de hoje (20/08/2026)
  console.log('\n=== CAUTELAS DE HOJE (20/08/2026) ===');
  const { data: cautelasHoje } = await supabase
    .from('cautelas')
    .select('*, cautela_itens(*)')
    .gte('data_retirada', '2026-08-19T00:00:00Z')
    .order('data_retirada', { ascending: false });

  console.log(`Total cautelas desde ontem: ${cautelasHoje?.length}`);
  for (const c of (cautelasHoje || [])) {
    console.log(`\nID: ${c.id_cautela} | PM: ${c.matricula_policial} | Status: ${c.status_cautela} | Retirada: ${c.data_retirada} | Devolução: ${c.data_devolucao_efetiva}`);
    console.log(`  Armeiro Retirada: ${c.matricula_armeiro_retirada} | Armeiro Devolução: ${c.matricula_armeiro_devolucao}`);
    if (c.cautela_itens) {
      c.cautela_itens.forEach(i => {
        console.log(`    Item: ${i.id_material} | Qtd: ${i.quantidade} | EstadoDev: ${i.estado_devolucao} | Consumido: ${i.consumido}`);
      });
    }
  }
}

main().catch(console.error);
