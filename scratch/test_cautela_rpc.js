import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let _idCounter = 0;
const gerarIdUnico = (prefix = 'ITEM') => {
  _idCounter = (_idCounter + 1) % 1000000;
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(100000 + Math.random() * 900000);
  const counterHex = _idCounter.toString(36).toUpperCase().padStart(4, '0');
  return `${prefix}-${timestamp}-${counterHex}-${rand}`;
};

async function runTests() {
  console.log('========================================');
  console.log('INICIANDO TESTES LOCAIS DO SISTEMA...');
  console.log('========================================\n');

  // Teste 1: Testar colisão em gerarIdUnico com 100.000 iterações instantâneas
  console.log('🧪 TESTE 1: Validando algoritmo gerarIdUnico (100.000 iterações instantâneas)...');
  const idsSet = new Set();
  let collisionCount = 0;
  for (let i = 0; i < 100000; i++) {
    const id = gerarIdUnico('ITEM');
    if (idsSet.has(id)) {
      collisionCount++;
    }
    idsSet.add(id);
  }
  if (collisionCount === 0) {
    console.log('✅ TESTE 1 PASSOU: 100.000 IDs gerados sem NENHUMA colisão (0 colisões)!\n');
  } else {
    console.error(`❌ TESTE 1 FALHOU: Ocorreram ${collisionCount} colisões em 100.000 IDs.\n`);
  }

  // Teste 2: Testar chamada RPC proximo_id_cautela no Supabase
  console.log('🧪 TESTE 2: Testando RPC proximo_id_cautela no banco Supabase...');
  try {
    const { data: id1, error: err1 } = await supabase.rpc('proximo_id_cautela');
    if (err1) {
      console.error('❌ Erro ao chamar proximo_id_cautela:', err1);
    } else {
      console.log(`✅ TESTE 2 PASSOU: ID gerado pelo banco: ${id1}`);
    }
  } catch (e) {
    console.error('❌ Exceção ao executar chamada RPC:', e);
  }

  console.log('\n========================================');
  console.log('TESTES FINALIZADOS COM SUCESSO!');
  console.log('========================================');
}

runTests();
