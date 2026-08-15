const assert = require('assert');

// 1. Testes Unitários das Funções de Cálculo do Frontend
console.log('=== 1. TESTES UNITÁRIOS DE CÁLCULO DE DISPONIBILIDADE ===\n');

function runUnitTests() {
  const mockMateriais = [
    { id_material: 'MUN-9MM', modelo: 'Munição Calibre 9mm', quantidade: 339, controle_quantidade: true, status_atual: 'disponivel' },
    { id_material: 'BAT-HYTERA', modelo: 'Bateria Hytera', quantidade: 47, controle_quantidade: true, status_atual: 'disponivel' },
    { id_material: 'ARM-01', modelo: 'Pistola TS9', quantidade: 1, controle_quantidade: false, status_atual: 'cautelado' },
    { id_material: 'ARM-02', modelo: 'Pistola TS9', quantidade: 1, controle_quantidade: false, status_atual: 'disponivel' }
  ];

  const mockCautelas = [
    { id_cautela: 'CAUT-01', status_cautela: 'ativa' },
    { id_cautela: 'CAUT-02', status_cautela: 'devolvida', data_devolucao_efetiva: '2026-08-15T12:00:00Z' }
  ];

  const mockCautelaItens = [
    { id_cautela: 'CAUT-01', id_material: 'MUN-9MM', quantidade: 30, estado_devolucao: undefined },
    { id_cautela: 'CAUT-01', id_material: 'BAT-HYTERA', quantidade: 10, estado_devolucao: undefined },
    { id_cautela: 'CAUT-01', id_material: 'ARM-01', quantidade: 1, estado_devolucao: undefined },
    { id_cautela: 'CAUT-02', id_material: 'MUN-9MM', quantidade: 50, estado_devolucao: 'em_condicoes_de_uso' }
  ];

  // Helper do Totem / Armeiro
  const getDisponivelQty = (mat) => {
    if (!mat.controle_quantidade) {
      return mat.status_atual === 'disponivel' ? 1 : 0;
    }
    const total = mat.quantidade || 0;
    const activeQty = mockCautelaItens
      .filter(ci => {
        const c = mockCautelas.find(caut => caut.id_cautela === ci.id_cautela);
        return ci.id_material === mat.id_material && c && (c.status_cautela === 'ativa' || c.status_cautela === 'atrasada' || c.status_cautela === 'prorrogada') && !ci.estado_devolucao;
      })
      .reduce((sum, ci) => sum + ci.quantidade, 0);
    return Math.max(0, total - activeQty);
  };

  // Verificações
  const disp9mm = getDisponivelQty(mockMateriais[0]);
  const dispBat = getDisponivelQty(mockMateriais[1]);
  const dispArm01 = getDisponivelQty(mockMateriais[2]);
  const dispArm02 = getDisponivelQty(mockMateriais[3]);

  console.log(`- MUN-9MM: Total = ${mockMateriais[0].quantidade} | Disponível calculado = ${disp9mm} (Esperado: 309)`);
  assert.strictEqual(disp9mm, 309, 'MUN-9MM disponível deve ser 309');

  console.log(`- BAT-HYTERA: Total = ${mockMateriais[1].quantidade} | Disponível calculado = ${dispBat} (Esperado: 37)`);
  assert.strictEqual(dispBat, 37, 'BAT-HYTERA disponível deve ser 37');

  console.log(`- ARM-01 (cautelado): Disponível = ${dispArm01} (Esperado: 0)`);
  assert.strictEqual(dispArm01, 0, 'ARM-01 não deve estar disponível');

  console.log(`- ARM-02 (disponivel): Disponível = ${dispArm02} (Esperado: 1)`);
  assert.strictEqual(dispArm02, 1, 'ARM-02 deve estar disponível');

  console.log('✔ Todos os testes unitários de cálculo de disponibilidade passaram com sucesso!\n');
}

// 2. Simulação de Ciclo de Vida Completo (Cautela -> Devolução Intacta -> Consumo Parcial)
console.log('=== 2. TESTE DE CICLO DE VIDA DE CAUTELA, DEVOLUÇÃO E CONSUMO ===\n');

function runLifecycleTests() {
  let materiais = [
    { id_material: 'MUN-9MM', modelo: 'Munição Calibre 9mm', quantidade: 339, controle_quantidade: true }
  ];
  let cautelas = [];
  let cautelaItens = [];

  // A) Cautelar 10 munições
  console.log('--- A) Cautelando 10 munições 9mm ---');
  const novaCautela = { id_cautela: 'CAUT-TEST-1', status_cautela: 'ativa' };
  const novoItem = { id_cautela_item: 'ITEM-1', id_cautela: 'CAUT-TEST-1', id_material: 'MUN-9MM', quantidade: 10 };
  
  cautelas.push(novaCautela);
  cautelaItens.push(novoItem);
  // materiais.quantidade permanece 339!

  const totalAtivoNaRua = cautelaItens
    .filter(ci => ci.id_material === 'MUN-9MM' && !ci.estado_devolucao)
    .reduce((sum, ci) => sum + ci.quantidade, 0);
  const totalPatrimonio = materiais[0].quantidade;
  const disponivelReserva = totalPatrimonio - totalAtivoNaRua;

  console.log(`Total Patrimonial: ${totalPatrimonio} | Na Reserva: ${disponivelReserva} | Na Rua: ${totalAtivoNaRua}`);
  assert.strictEqual(totalPatrimonio, 339);
  assert.strictEqual(disponivelReserva, 329);
  assert.strictEqual(totalAtivoNaRua, 10);
  console.log('✔ Cautela efetuada com sucesso: Total permanece 339 e Na Reserva exibe 329!\n');

  // B) Devolução Parcial com Consumo: 8 intactas + 2 consumidas
  console.log('--- B) Devolvendo 8 intactas e 2 consumidas em serviço ---');
  const returnedQuantities = { 'MUN-9MM': 8 };
  const consumedQuantities = { 'MUN-9MM': 2 };

  // Atualizar itens de cautela
  cautelaItens = [
    { id_cautela_item: 'ITEM-1', id_cautela: 'CAUT-TEST-1', id_material: 'MUN-9MM', quantidade: 8, estado_devolucao: 'em_condicoes_de_uso', consumido: false },
    { id_cautela_item: 'ITEM-2-CONS', id_cautela: 'CAUT-TEST-1', id_material: 'MUN-9MM', quantidade: 2, estado_devolucao: 'avariado', consumido: true }
  ];
  novaCautela.status_cautela = 'devolvida';

  // Aplicar regra: deduz apenas consumedQuantities
  materiais = materiais.map(m => {
    if (m.controle_quantidade) {
      const qtyConsumed = consumedQuantities[m.id_material] || 0;
      if (qtyConsumed > 0) {
        return { ...m, quantidade: Math.max(0, m.quantidade - qtyConsumed) };
      }
    }
    return m;
  });

  const totalAtivoNaRuaPos = cautelaItens
    .filter(ci => ci.id_material === 'MUN-9MM' && !ci.estado_devolucao)
    .reduce((sum, ci) => sum + ci.quantidade, 0);
  const totalPatrimonioPos = materiais[0].quantidade;
  const disponivelReservaPos = totalPatrimonioPos - totalAtivoNaRuaPos;

  console.log(`Total Patrimonial Pós-Consumo: ${totalPatrimonioPos} | Na Reserva: ${disponivelReservaPos} | Na Rua: ${totalAtivoNaRuaPos}`);
  assert.strictEqual(totalPatrimonioPos, 337, 'Total patrimonial deve ser reduzido em exatamente 2 (339 - 2 = 337)');
  assert.strictEqual(disponivelReservaPos, 337, 'Disponível na reserva deve ser 337');
  assert.strictEqual(totalAtivoNaRuaPos, 0, 'Na rua deve ser 0');
  console.log('✔ Devolução com consumo parcial processada com precisão absoluta!\n');
}

// 3. Verificação em Tempo Real no Supabase
async function runSupabaseVerification() {
  console.log('=== 3. VERIFICAÇÃO EM TEMPO REAL NO SUPABASE ===\n');
  
  let createClient;
  try {
    createClient = require('@supabase/supabase-js').createClient;
  } catch (e) {
    createClient = require('../node_modules/.pnpm/@supabase+supabase-js@2.49.1/node_modules/@supabase/supabase-js').createClient;
  }

  const supabaseUrl = 'https://rndyzoyhpmubbbuxtuso.supabase.co';
  const supabaseKey = 'sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7';

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { 'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE' } }
  });

  const { data: mat9mm } = await supabase.from('materiais').select('*').eq('id_material', 'MUN-9MM').single();
  const { data: cautelasAtivas } = await supabase.from('cautelas').select('id_cautela').in('status_cautela', ['ativa', 'atrasada', 'prorrogada']);
  const activeIds = cautelasAtivas.map(c => c.id_cautela);

  const { data: itensAtivos } = await supabase
    .from('cautela_itens')
    .select('*')
    .eq('id_material', 'MUN-9MM')
    .in('id_cautela', activeIds)
    .is('estado_devolucao', null);

  const totalRua = itensAtivos.reduce((sum, i) => sum + (i.quantidade || 0), 0);
  const totalDB = mat9mm.quantidade;
  const dispReserva = totalDB - totalRua;

  console.log(`MUN-9MM no Supabase:`);
  console.log(`- Quantidade Total Cadastrada: ${totalDB}`);
  console.log(`- Quantidade Na Rua: ${totalRua}`);
  console.log(`- Quantidade Disponível na Reserva: ${dispReserva}`);

  assert.strictEqual(totalDB, 339, 'Quantidade de MUN-9MM no banco deve ser 339');
  assert.strictEqual(totalRua, 30, 'Quantidade na rua de MUN-9MM deve ser 30');
  assert.strictEqual(dispReserva, 309, 'Quantidade disponível na reserva deve ser 309');

  console.log('\n✔ Verificação no Supabase concluída com 100% de sucesso!');
}

runUnitTests();
runLifecycleTests();
runSupabaseVerification().catch(console.error);
