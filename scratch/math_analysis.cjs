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
  console.log('=== ANÁLISE DE HISTÓRICO DE DEVOLUÇÕES VS ESTOQUE INFLACIONADO ===');

  const { data: itens } = await supabase
    .from('cautela_itens')
    .select('*, cautelas(id_cautela, status_cautela, matricula_policial, data_retirada, data_devolucao_efetiva, matricula_armeiro_devolucao)');

  const materiaisParaAnalisar = ['BAT-HYTERA', 'BAT-SEPURA', 'MUN-9MM', 'MUN-556', '0', '03', 'GL 108', 'GL 108 MAX'];

  const { data: mats } = await supabase
    .from('materiais')
    .select('*')
    .in('id_material', materiaisParaAnalisar);

  for (const matId of materiaisParaAnalisar) {
    const mat = mats?.find(m => m.id_material === matId);
    const itensDoMat = (itens || []).filter(i => i.id_material === matId);
    
    // Total de cautela_itens devolvidos
    const itensDevolvidos = itensDoMat.filter(i => 
      (i.cautelas && i.cautelas.status_cautela === 'devolvida') || i.estado_devolucao
    );

    const totalDevolvido = itensDevolvidos.reduce((acc, curr) => acc + (curr.quantidade || 1), 0);
    const totalItens = itensDoMat.reduce((acc, curr) => acc + (curr.quantidade || 1), 0);

    console.log(`\n======================================================`);
    console.log(`Material: ${matId} (${mat?.modelo})`);
    console.log(`- Estoque atual em materiais.quantidade: ${mat?.quantidade}`);
    console.log(`- Total de itens já devolvidos no histórico: ${totalDevolvido}`);
    console.log(`- Total de todos os itens já acautelados: ${totalItens}`);
    
    // Ver se estoqueAtual == estoqueBase + totalDevolvido
    // Para BAT-HYTERA: 47 base? 572 atual -> 572 - totalDevolvido?
    console.log(`- Diferença (Estoque Atual - Total Devolvido): ${mat?.quantidade - totalDevolvido}`);
    
    // Vamos listar as últimas 10 devoluções deste item com data e armeiro
    console.log(`- Últimas 10 devoluções:`);
    itensDevolvidos.slice(0, 10).forEach(i => {
      console.log(`  * Cautela: ${i.id_cautela} | Qtd: ${i.quantidade} | PM: ${i.cautelas?.matricula_policial} | Armeiro Dev: ${i.cautelas?.matricula_armeiro_devolucao} | Data Dev: ${i.cautelas?.data_devolucao_efetiva}`);
    });
  }
}

main().catch(console.error);
