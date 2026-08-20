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
  console.log('=== 1. MATERIAIS COM CONTROLE DE QUANTIDADE ===');
  const { data: materiais } = await supabase
    .from('materiais')
    .select('*')
    .eq('controle_quantidade', true);

  console.table(materiais.map(m => ({
    id: m.id_material,
    tipo: m.tipo,
    modelo: m.modelo,
    quantidade_cadastrada: m.quantidade,
    status: m.status_atual,
    deletado: m.deletado_em
  })));

  console.log('\n=== 2. TODOS OS MATERIAIS NA TABELA ===');
  const { data: allMats } = await supabase.from('materiais').select('*');
  console.table(allMats.map(m => ({
    id: m.id_material,
    tipo: m.tipo,
    modelo: m.modelo,
    serial: m.numero_serie,
    ctrl_qtd: m.controle_quantidade,
    quantidade: m.quantidade,
    status: m.status_atual
  })));

  console.log('\n=== 3. BALANÇO DETALHADO DOS MATERIAIS EM LOTE ===');
  const { data: itensLote } = await supabase
    .from('cautela_itens')
    .select('*, cautelas(id_cautela, status_cautela, matricula_policial, data_retirada, data_devolucao_efetiva)');

  for (const mat of (materiais || [])) {
    const itensMat = (itensLote || []).filter(i => i.id_material === mat.id_material);
    const itensAtivos = itensMat.filter(i => 
      i.cautelas && ['ativa', 'atrasada', 'prorrogada', 'pendente_aprovacao'].includes(i.cautelas.status_cautela) &&
      !i.estado_devolucao
    );
    const qtdNaRua = itensAtivos.reduce((acc, curr) => acc + (curr.quantidade || 1), 0);
    const disponivelCalculado = (mat.quantidade || 0) - qtdNaRua;

    console.log(`\n--------------------------------------------------`);
    console.log(`MATERIAL: [${mat.id_material}] ${mat.modelo || mat.tipo}`);
    console.log(`- Quantidade no Banco (materiais.quantidade): ${mat.quantidade}`);
    console.log(`- Quantidade em Cautelas Ativas: ${qtdNaRua}`);
    console.log(`- Estoque Disponível Calculado (Total - Na Rua): ${disponivelCalculado}`);
    console.log(`- Total de registros de cautela_itens vinculados: ${itensMat.length}`);
    if (itensAtivos.length > 0) {
      console.log(`- Cautelas ativas segurando este item:`);
      itensAtivos.forEach(i => {
        console.log(`  * Cautela ${i.id_cautela} | PM: ${i.cautelas?.matricula_policial} | Qtd: ${i.quantidade} | Data Retirada: ${i.cautelas?.data_retirada}`);
      });
    }
  }
}

main().catch(console.error);
