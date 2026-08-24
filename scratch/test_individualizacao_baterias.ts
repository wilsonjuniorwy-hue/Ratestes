import { mockMateriais, mockUsuarios, mockCautelas, mockCautelaItens } from '../src/mockData';
import { Cautela, CautelaItem, Material, Usuario, CondicaoUso } from '../src/types';

console.log('================================================================');
console.log('🧪 INICIANDO BATERIA DE TESTES: INDIVIDUALIZAÇÃO DE BATERIAS');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failCount++;
  }
}

// Simulador de estado em memória
let materiais: Material[] = JSON.parse(JSON.stringify(mockMateriais));
let usuarios: Usuario[] = JSON.parse(JSON.stringify(mockUsuarios));
let cautelas: Cautela[] = JSON.parse(JSON.stringify(mockCautelas));
let cautelaItens: CautelaItem[] = JSON.parse(JSON.stringify(mockCautelaItens));

let idCounter = 1000;
function gerarIdUnico(prefixo: string) {
  return `${prefixo}-${++idCounter}`;
}

// Implementação espelho do processEfetivarCautela
function processEfetivarCautela(
  matriculaPolicial: string,
  cartItens: string[],
  observacoes: string,
  weaponMagazines?: Record<string, number>,
  isPermanent?: boolean,
  radioBatteries?: Record<string, { brand: 'Hytera' | 'Sepura'; qty: number }>
): Cautela | null {
  const user = usuarios.find(u => u.matricula === matriculaPolicial);
  if (!user) return null;

  const idNewCautela = `CAUT-TEST-${idCounter++}`;
  const nowIso = new Date().toISOString();

  const novaCautela: Cautela = {
    id_cautela: idNewCautela,
    matricula_policial: matriculaPolicial,
    matricula_armeiro_retirada: 'ARM-00123',
    data_retirada: nowIso,
    previsao_devolucao: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    status_cautela: isPermanent ? 'permanente' : 'ativa',
    observacoes_retirada: observacoes
  };

  const groupedCart: Record<string, number> = {};
  cartItens.forEach(id => {
    groupedCart[id] = (groupedCart[id] || 0) + 1;
  });

  const novosItensCautela: CautelaItem[] = [];

  Object.entries(groupedCart).forEach(([idMat, qty]) => {
    const magQty = (weaponMagazines && weaponMagazines[idMat]) || 0;
    const mat = materiais.find(m => m.id_material === idMat);
    const deveIndividualizar = mat?.individualizar_por_unidade ?? false;

    if (deveIndividualizar) {
      for (let i = 0; i < qty; i++) {
        novosItensCautela.push({
          id_cautela_item: gerarIdUnico('ITEM'),
          id_cautela: idNewCautela,
          id_material: idMat.trim(),
          quantidade: 1,
          estado_entrega: 'excelente',
          quantidade_carregadores: i === 0 ? magQty : 0,
          criado_em: nowIso
        });
      }
    } else {
      novosItensCautela.push({
        id_cautela_item: gerarIdUnico('ITEM'),
        id_cautela: idNewCautela,
        id_material: idMat.trim(),
        quantidade: qty,
        estado_entrega: 'excelente',
        quantidade_carregadores: magQty,
        criado_em: nowIso
      });
    }
  });

  if (radioBatteries) {
    Object.entries(radioBatteries).forEach(([idMat, bInfo]) => {
      if (cartItens.includes(idMat) && bInfo.qty > 0) {
        const batId = `BAT-${bInfo.brand.trim().toUpperCase()}`;
        const batMat = materiais.find(m => m.id_material === batId);
        const deveIndividualizar = batMat?.individualizar_por_unidade ?? true;

        if (deveIndividualizar) {
          for (let i = 0; i < bInfo.qty; i++) {
            novosItensCautela.push({
              id_cautela_item: gerarIdUnico('ITEM-BAT'),
              id_cautela: idNewCautela,
              id_material: batId,
              quantidade: 1,
              estado_entrega: 'excelente',
              criado_em: nowIso
            });
          }
        } else {
          novosItensCautela.push({
            id_cautela_item: gerarIdUnico('ITEM-BAT'),
            id_cautela: idNewCautela,
            id_material: batId,
            quantidade: bInfo.qty,
            estado_entrega: 'excelente',
            criado_em: nowIso
          });
        }
      }
    });
  }

  cautelas = [novaCautela, ...cautelas];
  cautelaItens = [...cautelaItens, ...novosItensCautela];

  return novaCautela;
}

// Implementação espelho do processDevolucao
function processDevolucao(
  cautId: string,
  idsItensDevolvidos: string[],
  claimConditions: Record<string, CondicaoUso>,
  observacoes: string,
  prorrogar: boolean = false,
  returnedQuantities?: Record<string, number>,
  consumedQuantities?: Record<string, number>
) {
  const cautelaParaBaixa = cautelas.find(c => c.id_cautela === cautId);
  if (!cautelaParaBaixa) return;

  const agora = new Date().toISOString();
  const activeItemsMap = new Map<string, CautelaItem>();
  cautelaItens.forEach(ci => activeItemsMap.set(ci.id_cautela_item, { ...ci }));

  const returnedMaterialIdsSet = new Set<string>();

  idsItensDevolvidos.forEach(idOrKey => {
    let ci = activeItemsMap.get(idOrKey);
    if (!ci || ci.id_cautela !== cautId || ci.estado_devolucao) {
      ci = Array.from(activeItemsMap.values()).find(
        item => item.id_cautela === cautId && item.id_material === idOrKey && !item.estado_devolucao
      );
    }
    if (!ci) return;

    const itemKey = ci.id_cautela_item;
    const matId = ci.id_material;
    returnedMaterialIdsSet.add(matId);

    const mat = materiais.find(m => m.id_material === matId);
    const condition = claimConditions?.[itemKey] || claimConditions?.[matId] || 'em_condicoes_de_uso';

    if (mat?.individualizar_por_unidade) {
      if (ci.quantidade === 1) {
        activeItemsMap.set(itemKey, {
          ...ci,
          estado_devolucao: condition
        });
      } else {
        const qtyToReturn = (returnedQuantities?.[itemKey] ?? returnedQuantities?.[matId]) ?? ci.quantidade;
        if (qtyToReturn >= ci.quantidade) {
          activeItemsMap.set(itemKey, {
            ...ci,
            estado_devolucao: condition
          });
        } else if (qtyToReturn > 0) {
          activeItemsMap.set(itemKey, {
            ...ci,
            quantidade: ci.quantidade - qtyToReturn
          });
          const newIdDev = gerarIdUnico('ITEM-DEV');
          activeItemsMap.set(newIdDev, {
            ...ci,
            id_cautela_item: newIdDev,
            quantidade: qtyToReturn,
            estado_devolucao: condition,
            criado_em: agora
          });
        }
      }
    } else if (mat?.controle_quantidade) {
      const qtyToReturn = (returnedQuantities?.[itemKey] ?? returnedQuantities?.[matId]) ?? ci.quantidade;
      const qtyConsumed = (consumedQuantities?.[itemKey] ?? consumedQuantities?.[matId]) ?? 0;
      const totalProcessed = qtyToReturn + qtyConsumed;

      if (totalProcessed >= ci.quantidade) {
        if (qtyToReturn > 0 && qtyConsumed > 0) {
          activeItemsMap.set(itemKey, {
            ...ci,
            quantidade: qtyToReturn,
            estado_devolucao: condition
          });
          const newId = gerarIdUnico('ITEM-CONS');
          activeItemsMap.set(newId, {
            id_cautela_item: newId,
            id_cautela: cautId,
            id_material: matId,
            quantidade: qtyConsumed,
            estado_entrega: ci.estado_entrega,
            estado_devolucao: 'avariado',
            consumido: true,
            criado_em: agora
          });
        } else if (qtyConsumed > 0) {
          activeItemsMap.set(itemKey, {
            ...ci,
            estado_devolucao: 'avariado',
            consumido: true
          });
        } else {
          activeItemsMap.set(itemKey, {
            ...ci,
            estado_devolucao: condition
          });
        }
      } else {
        activeItemsMap.set(itemKey, {
          ...ci,
          quantidade: ci.quantidade - totalProcessed
        });

        if (qtyToReturn > 0) {
          const newIdDev = gerarIdUnico('ITEM-DEV');
          activeItemsMap.set(newIdDev, {
            id_cautela_item: newIdDev,
            id_cautela: cautId,
            id_material: matId,
            quantidade: qtyToReturn,
            estado_entrega: ci.estado_entrega,
            estado_devolucao: condition,
            criado_em: agora
          });
        }

        if (qtyConsumed > 0) {
          const newIdCons = gerarIdUnico('ITEM-CONS');
          activeItemsMap.set(newIdCons, {
            id_cautela_item: newIdCons,
            id_cautela: cautId,
            id_material: matId,
            quantidade: qtyConsumed,
            estado_entrega: ci.estado_entrega,
            estado_devolucao: 'avariado',
            consumido: true,
            criado_em: agora
          });
        }
      }
    } else {
      activeItemsMap.set(itemKey, {
        ...ci,
        estado_devolucao: condition
      });
    }
  });

  cautelaItens = Array.from(activeItemsMap.values());

  const todosItensDaCautela = cautelaItens.filter(ci => ci.id_cautela === cautId);
  const todosDevolvidos = todosItensDaCautela.every(ci => !!ci.estado_devolucao);

  cautelas = cautelas.map(c => {
    if (c.id_cautela === cautId) {
      if (todosDevolvidos) {
        return {
          ...c,
          status_cautela: 'devolvida' as const,
          data_devolucao_efetiva: agora
        };
      }
    }
    return c;
  });
}

function getDisponivelQty(mat: Material) {
  if (!mat.controle_quantidade) {
    return mat.status_atual === 'disponivel' ? 1 : 0;
  }
  const total = mat.quantidade || 0;
  const activeQty = cautelaItens
    .filter(ci => {
      const c = cautelas.find(caut => caut.id_cautela === ci.id_cautela);
      return ci.id_material === mat.id_material && c && (c.status_cautela === 'ativa' || c.status_cautela === 'atrasada' || c.status_cautela === 'prorrogada') && !ci.estado_devolucao;
    })
    .reduce((sum, ci) => sum + ci.quantidade, 0);
  return Math.max(0, total - activeQty);
}

// -------------------------------------------------------------
// TESTE 1: Acautelamento de Rádio + 3 Baterias
// -------------------------------------------------------------
console.log('--- TESTE 1: Acautelamento de 1 Rádio Hytera com 3 Baterias ---');
const radioMat = materiais.find(m => m.fabricante === 'HYTERA' && m.id_material.startsWith('HY')) || materiais[0];
const batHytera = materiais.find(m => m.id_material === 'BAT-HYTERA')!;
const initialBatStock = getDisponivelQty(batHytera);

const novaCautela = processEfetivarCautela(
  'PM-921384',
  [radioMat.id_material],
  'Serviço operacional',
  {},
  false,
  { [radioMat.id_material]: { brand: 'Hytera', qty: 3 } }
);

assert(!!novaCautela, 'Cautela foi criada com sucesso');
const itensDaCautela = cautelaItens.filter(ci => ci.id_cautela === novaCautela?.id_cautela);
const itensBateria = itensDaCautela.filter(ci => ci.id_material === 'BAT-HYTERA');
const itensRadio = itensDaCautela.filter(ci => ci.id_material === radioMat.id_material);

assert(itensRadio.length === 1, 'Criou 1 registro para o rádio');
assert(itensBateria.length === 3, 'Criou exatamente 3 registros individuais para as baterias');
assert(itensBateria.every(b => b.quantidade === 1), 'Cada bateria tem quantidade individual = 1');
const uniqueIds = new Set(itensBateria.map(b => b.id_cautela_item));
assert(uniqueIds.size === 3, 'Cada bateria possui um id_cautela_item exclusivo');
assert(getDisponivelQty(batHytera) === initialBatStock - 3, 'Estoque disponível de baterias foi deduzido em 3 unidades');

// -------------------------------------------------------------
// TESTE 2: Devolução Parcial de 1 Bateria
// -------------------------------------------------------------
console.log('\n--- TESTE 2: Devolução de apenas 1 Bateria (Baixa Unitária) ---');
const primeiraBateria = itensBateria[0];
const segundaBateria = itensBateria[1];
const terceiraBateria = itensBateria[2];

processDevolucao(
  novaCautela!.id_cautela,
  [primeiraBateria.id_cautela_item],
  { [primeiraBateria.id_cautela_item]: 'em_condicoes_de_uso' },
  'Devolveu 1 bateria recarregada'
);

const cautAtualizada = cautelas.find(c => c.id_cautela === novaCautela!.id_cautela)!;
assert(cautAtualizada.status_cautela === 'ativa', 'A cautela permanece com status "ativa" após devolução parcial');

const itensPendentes = cautelaItens.filter(ci => ci.id_cautela === novaCautela!.id_cautela && !ci.estado_devolucao);
assert(itensPendentes.length === 3, 'Listagem de itens na rua agora mostra 3 itens pendentes (1 rádio + 2 baterias restantes)');

const bat1Atualizada = cautelaItens.find(ci => ci.id_cautela_item === primeiraBateria.id_cautela_item)!;
assert(bat1Atualizada.estado_devolucao === 'em_condicoes_de_uso', 'A primeira bateria foi marcada como devolvida');

assert(getDisponivelQty(batHytera) === initialBatStock - 2, 'Estoque disponível de baterias aumentou em +1 imediatamente');

// Teste de numeração estável
const allBatSorted = cautelaItens
  .filter(ci => ci.id_cautela === novaCautela!.id_cautela && ci.id_material === 'BAT-HYTERA')
  .sort((a, b) => (a.criado_em || a.id_cautela_item).localeCompare(b.criado_em || b.id_cautela_item));

const idxBat2 = allBatSorted.findIndex(b => b.id_cautela_item === segundaBateria.id_cautela_item) + 1;
const idxBat3 = allBatSorted.findIndex(b => b.id_cautela_item === terceiraBateria.id_cautela_item) + 1;

assert(idxBat2 === 2 && allBatSorted.length === 3, 'Segunda bateria mantém índice fixo (Item 2 de 3)');
assert(idxBat3 === 3 && allBatSorted.length === 3, 'Terceira bateria mantém índice fixo (Item 3 de 3)');

// -------------------------------------------------------------
// TESTE 3: Devolução Total dos Itens Restantes
// -------------------------------------------------------------
console.log('\n--- TESTE 3: Devolução dos itens restantes (Rádio + Baterias 2 e 3) ---');
processDevolucao(
  novaCautela!.id_cautela,
  [itensRadio[0].id_cautela_item, segundaBateria.id_cautela_item, terceiraBateria.id_cautela_item],
  {
    [itensRadio[0].id_cautela_item]: 'em_condicoes_de_uso',
    [segundaBateria.id_cautela_item]: 'em_condicoes_de_uso',
    [terceiraBateria.id_cautela_item]: 'avariado' // laudo independente
  },
  'Devolução final'
);

const cautFinal = cautelas.find(c => c.id_cautela === novaCautela!.id_cautela)!;
assert(cautFinal.status_cautela === 'devolvida', 'Cautela transicionou automaticamente para status "devolvida"');
assert(!!cautFinal.data_devolucao_efetiva, 'Data de devolução efetiva foi registrada');

const bat3Final = cautelaItens.find(ci => ci.id_cautela_item === terceiraBateria.id_cautela_item)!;
assert(bat3Final.estado_devolucao === 'avariado', 'Laudo individual da terceira bateria ("avariado") foi gravado com precisão');
assert(getDisponivelQty(batHytera) === initialBatStock, 'Estoque de baterias foi 100% restaurado ao estoque inicial');

// -------------------------------------------------------------
// TESTE 4: Não-regressão de Munições em Lote com Consumo
// -------------------------------------------------------------
console.log('\n--- TESTE 4: Não-regressão do fluxo de Munições (30 cartuchos com 10 disparados) ---');
const munMat: Material = {
  id_material: 'MUN-9MM-TEST',
  id_categoria: 'CAT-MUNICAO',
  modelo: 'Munição 9mm CBC Luger',
  fabricante: 'CBC',
  calibre: '9mm',
  status_atual: 'disponivel',
  data_aquisicao: '2026-01-01',
  especificacoes_tecnicas: 'Treinamento',
  controle_quantidade: true,
  individualizar_por_unidade: false,
  quantidade: 500
};
materiais.push(munMat);

// Acautelar 30 cartuchos
const cautMun = processEfetivarCautela(
  'PM-921384',
  Array(30).fill('MUN-9MM-TEST'),
  'Treinamento de tiro'
)!;

const itemMun = cautelaItens.find(ci => ci.id_cautela === cautMun.id_cautela && ci.id_material === 'MUN-9MM-TEST')!;
assert(itemMun.quantidade === 30, 'Munição em lote gerou 1 único registro agregado com quantidade = 30');

// Devolver 20 cartuchos e registrar 10 consumidos/disparados
processDevolucao(
  cautMun.id_cautela,
  [itemMun.id_cautela_item],
  { [itemMun.id_cautela_item]: 'em_condicoes_de_uso' },
  'Treinamento concluído',
  false,
  { [itemMun.id_cautela_item]: 20 },
  { [itemMun.id_cautela_item]: 10 }
);

const munItensCautela = cautelaItens.filter(ci => ci.id_cautela === cautMun.id_cautela);
const itemMunDev = munItensCautela.find(ci => ci.quantidade === 20 && ci.estado_devolucao === 'em_condicoes_de_uso');
const itemMunCons = munItensCautela.find(ci => ci.quantidade === 10 && ci.consumido === true);

assert(!!itemMunDev, 'Munição devolvida gerou registro de 20 cartuchos em condições de uso');
assert(!!itemMunCons, 'Munição disparada gerou registro de 10 cartuchos consumidos');

const cautMunFinal = cautelas.find(c => c.id_cautela === cautMun.id_cautela)!;
assert(cautMunFinal.status_cautela === 'devolvida', 'Cautela de munição foi encerrada com sucesso após devolução + consumo');

// -------------------------------------------------------------
// TESTE 5: Compatibilidade com Cautelas Legadas Ativas (1 linha com quantidade: 5)
// -------------------------------------------------------------
console.log('\n--- TESTE 5: Compatibilidade com Cautelas Legadas Ativas (1 linha com Qtd: 5) ---');
const idCautelaLegada = 'CAUT-LEGADA-999';
const cautLegada: Cautela = {
  id_cautela: idCautelaLegada,
  matricula_policial: 'PM-734891',
  matricula_armeiro_retirada: 'ARM-00123',
  data_retirada: new Date().toISOString(),
  previsao_devolucao: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
  status_cautela: 'ativa',
  observacoes_retirada: 'Cautela legada criada antes da mudança'
};
const itemLegadoBateria: CautelaItem = {
  id_cautela_item: 'ITEM-LEGADO-BAT-5',
  id_cautela: idCautelaLegada,
  id_material: 'BAT-SEPURA',
  quantidade: 5,
  estado_entrega: 'excelente'
};
cautelas.push(cautLegada);
cautelaItens.push(itemLegadoBateria);

// Passo 1: Devolver 2 baterias das 5 da cautela legada
processDevolucao(
  idCautelaLegada,
  [itemLegadoBateria.id_cautela_item],
  { [itemLegadoBateria.id_cautela_item]: 'em_condicoes_de_uso' },
  'Devolvendo 2 de 5 baterias legadas',
  false,
  { [itemLegadoBateria.id_cautela_item]: 2 }
);

const itensLegadosAposBaixa1 = cautelaItens.filter(ci => ci.id_cautela === idCautelaLegada);
const itemAtivoRestante = itensLegadosAposBaixa1.find(ci => !ci.estado_devolucao);
const itemDevolvido = itensLegadosAposBaixa1.find(ci => ci.estado_devolucao === 'em_condicoes_de_uso');

assert(itemAtivoRestante?.quantidade === 3, 'Linha ativa remanescente da cautela legada ficou com quantidade = 3');
assert(itemDevolvido?.quantidade === 2, 'Nova linha de devolução parcial foi criada com quantidade = 2');
assert(cautelas.find(c => c.id_cautela === idCautelaLegada)?.status_cautela === 'ativa', 'Cautela legada permanece ativa');

// Passo 2: Devolver as 3 baterias restantes
processDevolucao(
  idCautelaLegada,
  [itemAtivoRestante!.id_cautela_item],
  { [itemAtivoRestante!.id_cautela_item]: 'em_condicoes_de_uso' },
  'Devolvendo as 3 restantes',
  false,
  { [itemAtivoRestante!.id_cautela_item]: 3 }
);

const cautLegadaFinal = cautelas.find(c => c.id_cautela === idCautelaLegada)!;
assert(cautLegadaFinal.status_cautela === 'devolvida', 'Cautela legada foi encerrada com sucesso após devolver todas as unidades');

// -------------------------------------------------------------
// RESUMO FINAL
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`📊 RESUMO DOS TESTES: ${passCount} PASSOU | ${failCount} FALHOU`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!\n');
}
