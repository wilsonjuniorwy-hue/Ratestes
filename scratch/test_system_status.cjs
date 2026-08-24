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
  console.log('================================================================');
  console.log('🔍 RELATÓRIO DE AUDITORIA E TESTE DO SISTEMA');
  console.log('================================================================\n');

  // 1. Verificar materiais em lote cadastrados
  const { data: materiais, error: errMat } = await supabase
    .from('materiais')
    .select('*')
    .eq('controle_quantidade', true)
    .order('id_material');

  if (errMat) {
    console.error('❌ Erro ao buscar materiais:', errMat.message);
    return;
  }

  // 2. Verificar cautelas ativas e itens
  const { data: cautelasAtivas, error: errCaut } = await supabase
    .from('cautelas')
    .select('*, cautela_itens(*)')
    .in('status_cautela', ['ativa', 'atrasada', 'prorrogada']);

  if (errCaut) {
    console.error('❌ Erro ao buscar cautelas ativas:', errCaut.message);
    return;
  }

  console.log(`📋 Total de cautelas ativas na rua: ${cautelasAtivas.length}`);

  // 3. Buscar todos os cautela_itens não devolvidos
  const { data: itensNaoDevolvidos, error: errItens } = await supabase
    .from('cautela_itens')
    .select('*, cautelas(status_cautela, matricula_policial)')
    .is('estado_devolucao', null);

  if (errItens) {
    console.error('❌ Erro ao buscar itens:', errItens.message);
    return;
  }

  const activeItens = (itensNaoDevolvidos || []).filter(i => 
    i.cautelas && ['ativa', 'atrasada', 'prorrogada'].includes(i.cautelas.status_cautela)
  );

  console.log('\n================================================================');
  console.log('📦 BALANÇO COMPLETO DOS MATERIAIS EM LOTE (ESTOQUE ATUAL)');
  console.log('================================================================');

  const tabelaResumo = materiais.map(m => {
    const itensDoMaterial = activeItens.filter(i => i.id_material === m.id_material);
    const qtdNaRua = itensDoMaterial.reduce((sum, item) => sum + (item.quantidade || 1), 0);
    const cargaTotal = m.quantidade || 0;
    const disponivel = Math.max(0, cargaTotal - qtdNaRua);

    return {
      'ID Material': m.id_material,
      'Modelo / Descrição': m.modelo,
      'Carga Total (Banco)': cargaTotal,
      'Na Rua (Em Serviço)': qtdNaRua,
      'Disponível na Reserva': disponivel,
      'Status Consistência': disponivel >= 0 ? '✔ OK' : '❌ NEGATIVO'
    };
  });

  console.table(tabelaResumo);

  // 4. Detalhar quem está com materiais em lote na rua
  console.log('\n================================================================');
  console.log('👮 DETALHE DOS ITENS EM LOTE NA RUA NESTE MOMENTO');
  console.log('================================================================');
  
  const materiaisComItensNaRua = materiais.filter(m => {
    return activeItens.some(i => i.id_material === m.id_material);
  });

  if (materiaisComItensNaRua.length === 0) {
    console.log('Nenhum material em lote em uso no momento.');
  } else {
    materiaisComItensNaRua.forEach(m => {
      const vinculados = activeItens.filter(i => i.id_material === m.id_material);
      console.log(`\n📌 [${m.id_material}] ${m.modelo} (Total na rua: ${vinculados.reduce((s, i) => s + i.quantidade, 0)} un):`);
      vinculados.forEach(i => {
        console.log(`   - Cautela: ${i.id_cautela} | Policial: ${i.cautelas?.matricula_policial} | Qtd: ${i.quantidade} un | Status: ${i.cautelas?.status_cautela}`);
      });
    });
  }

  // 5. Verificar se restou algum registro de teste TEST-%
  const { data: testMats } = await supabase
    .from('materiais')
    .select('id_material')
    .ilike('id_material', 'TEST-%');

  const { data: testItens } = await supabase
    .from('cautela_itens')
    .select('id_cautela_item')
    .ilike('id_material', 'TEST-%');

  console.log('\n================================================================');
  console.log('🧹 VERIFICAÇÃO DE REGISTROS DE TESTE / ÓRFÃOS');
  console.log('================================================================');
  console.log(`- Materiais de teste (TEST-%): ${testMats?.length || 0} encontrados ${testMats?.length === 0 ? '✔ (Limpo)' : '⚠️ (Pendente)'}`);
  console.log(`- Itens de cautela de teste (TEST-%): ${testItens?.length || 0} encontrados ${testItens?.length === 0 ? '✔ (Limpo)' : '⚠️ (Pendente)'}`);

  console.log('\n================================================================');
  console.log('✔ AUDITORIA FINALIZADA');
  console.log('================================================================');
}

main().catch(console.error);
