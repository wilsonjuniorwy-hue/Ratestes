let createClient;
try {
  createClient = require('@supabase/supabase-js').createClient;
} catch (e) {
  createClient = require('./node_modules/.pnpm/@supabase+supabase-js@2.49.1/node_modules/@supabase/supabase-js').createClient;
}

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
  console.log('=== RASTREAMENTO DA MUNIÇÃO 9MM (MUN-9MM) ===\n');

  // 1. Todas as cautela_itens com MUN-9MM criadas desde 13/08
  const { data: cautelasRecentes } = await supabase
    .from('cautelas')
    .select('id_cautela, matricula_policial, matricula_armeiro_retirada, matricula_armeiro_devolucao, data_retirada, data_devolucao_efetiva, status_cautela')
    .gte('data_retirada', '2026-08-13T12:00:00Z')
    .order('data_retirada', { ascending: true });

  console.log(`Cautelas geradas desde 13/08 12:00 (${cautelasRecentes ? cautelasRecentes.length : 0} encontradas):`);
  
  if (cautelasRecentes) {
    const cautIds = cautelasRecentes.map(c => c.id_cautela);
    const { data: itens } = await supabase
      .from('cautela_itens')
      .select('*')
      .in('id_cautela', cautIds);

    const itens9mm = itens ? itens.filter(i => i.id_material === 'MUN-9MM') : [];
    console.log(`Itens de MUN-9MM acautelados/devolvidos nessas cautelas (${itens9mm.length}):`);
    console.table(itens9mm);

    for (const item of itens9mm) {
      const c = cautelasRecentes.find(c => c.id_cautela === item.id_cautela);
      console.log(`Cautela ${item.id_cautela} | PM: ${c?.matricula_policial} | Retirada: ${c?.data_retirada} | Devolução: ${c?.data_devolucao_efetiva} | Qtd: ${item.quantidade} | EstadoDev: ${item.estado_devolucao}`);
    }
  }

  // 2. Verificar se armas 9mm foram acauteladas ou devolvidas
  const { data: armas9mm } = await supabase
    .from('materiais')
    .select('id_material, modelo, calibre')
    .ilike('calibre', '%9%');

  console.log('\nArmas 9mm cadastradas:', armas9mm?.length);
}

main().catch(console.error);
