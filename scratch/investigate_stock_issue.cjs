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
  const { data: materiais, error: errMat } = await supabase
    .from('materiais')
    .select('*')
    .eq('controle_quantidade', true);

  if (errMat) {
    console.error('Erro ao buscar materiais:', errMat);
  } else {
    console.table(materiais.map(m => ({
      id: m.id_material,
      tipo: m.tipo,
      modelo: m.modelo,
      calibre: m.calibre,
      quantidade_cadastrada: m.quantidade,
      status: m.status_atual,
      deletado_em: m.deletado_em
    })));
  }

  console.log('\n=== 2. TODOS OS MATERIAIS QUE POSSUEM "BAT" OU "HYTERA" OU "MUN" NO NOME/ID ===');
  const { data: matsAll } = await supabase.from('materiais').select('*');
  const matsBatOuMun = matsAll.filter(m => 
    (m.id_material && (m.id_material.includes('BAT') || m.id_material.includes('MUN') || m.id_material.includes('HYT'))) ||
    (m.modelo && (m.modelo.toLowerCase().includes('bateria') || m.modelo.toLowerCase().includes('hytera') || m.modelo.toLowerCase().includes('munição') || m.modelo.toLowerCase().includes('municao'))) ||
    (m.tipo && (m.tipo.toLowerCase().includes('bateria') || m.tipo.toLowerCase().includes('munição') || m.tipo.toLowerCase().includes('municao')))
  );
  console.table(matsBatOuMun.map(m => ({
    id: m.id_material,
    tipo: m.tipo,
    modelo: m.modelo,
    serial: m.numero_serie,
    ctrl_qtd: m.controle_quantidade,
    qtd: m.quantidade,
    status: m.status_atual
  })));

  console.log('\n=== 3. TODOS OS CAUTELA_ITENS DE MATERIAIS EM LOTE ===');
  const { data: itensLote, error: errItens } = await supabase
    .from('cautela_itens')
    .select('*, cautelas(id_cautela, status_cautela, matricula_policial, data_retirada, data_devolucao_efetiva)');

  if (errItens) {
    console.error('Erro ao buscar cautela_itens:', errItens);
  } else {
    const lotes = itensLote.filter(i => {
      return (materiais || []).some(m => m.id_material === i.id_material) ||
             (matsBatOuMun || []).some(m => m.id_material === i.id_material);
    });

    console.log(`Total de itens de lote registrados: ${lotes.length}`);
    
    // Agrupados por material
    console.log('\n=== 4. BALANÇO DE MATERIAIS EM LOTE ===');
    for (const mat of (materiais || [])) {
      const itensMat = itensLote.filter(i => i.id_material === mat.id_material);
      const itensAtivos = itensMat.filter(i => 
        i.cautelas && ['ativa', 'atrasada', 'prorrogada', 'pendente_aprovacao'].includes(i.cautelas.status_cautela) &&
        !i.estado_devolucao
      );
      const itensDevolvidos = itensMat.filter(i => 
        (i.cautelas && i.cautelas.status_cautela === 'devolvida') || i.estado_devolucao
      );
      
      const qtdNaRua = itensAtivos.reduce((acc, curr) => acc + (curr.quantidade || 1), 0);
      const qtdTotalDevolvidaHistorico = itensDevolvidos.reduce((acc, curr) => acc + (curr.quantidade || 1), 0);
      const disponivelCalculado = (mat.quantidade || 0) - qtdNaRua;

      console.log(`\n--------------------------------------------------`);
      console.log(`Material: [${mat.id_material}] ${mat.modelo || mat.tipo}`);
      console.log(`- Cadastrado no BD (materiais.quantidade): ${mat.quantidade}`);
      console.log(`- Quantidade atualmente em Cautelas Ativas (na rua): ${qtdNaRua}`);
      console.log(`- Disponível calculado (materiais.quantidade - na_rua): ${disponivelCalculado}`);
      console.log(`- Total histórico em cautelas devolvidas: ${qtdTotalDevolvidaHistorico}`);
      if (itensAtivos.length > 0) {
        console.log(`- Detalhe das cautelas ativas:`);
        itensAtivos.forEach(i => {
          console.log(`  * Cautela ${i.id_cautela} | PM: ${i.cautelas?.matricula_policial} | Retirada: ${i.cautelas?.data_retirada} | Qtd: ${i.quantidade} | Status: ${i.cautelas?.status_cautela}`);
        });
      }
    }

    console.log('\n=== 5. HISTÓRICO DE TODAS AS MOVIMENTAÇÕES DE BAT-HYTERA ===');
    const itensBat = itensLote.filter(i => i.id_material === 'BAT-HYTERA');
    console.table(itensBat.map(i => ({
      id_item: i.id_cautela_item,
      id_cautela: i.id_cautela,
      pm: i.cautelas?.matricula_policial,
      qtd: i.quantidade,
      estado_dev: i.estado_devolucao,
      consumido: i.consumido,
      cautela_status: i.cautelas?.status_cautela,
      retirada: i.cautelas?.data_retirada,
      devolucao: i.cautelas?.data_devolucao_efetiva
    })));

    console.log('\n=== 6. HISTÓRICO DE TODAS AS MOVIMENTAÇÕES DE MUN-9MM ===');
    const itensMun = itensLote.filter(i => i.id_material === 'MUN-9MM');
    console.table(itensMun.map(i => ({
      id_item: i.id_cautela_item,
      id_cautela: i.id_cautela,
      pm: i.cautelas?.matricula_policial,
      qtd: i.quantidade,
      estado_dev: i.estado_devolucao,
      consumido: i.consumido,
      cautela_status: i.cautelas?.status_cautela,
      retirada: i.cautelas?.data_retirada,
      devolucao: i.cautelas?.data_devolucao_efetiva
    })));
  }
}

main().catch(console.error);
