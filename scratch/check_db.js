import { createClient } from '@supabase/supabase-js';

const CONFIGS = {
  homologacao: {
    url: "https://rndyzoyhpmubbbuxtuso.supabase.co",
    key: "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7"
  },
  producao: {
    url: "https://rwnldjtevkheiwutxhgg.supabase.co",
    key: "sb_publishable_CQWOt6VSUTH7jPdYJXiY2w_IjvhG1Ea"
  }
};

async function testConfig(name, config) {
  console.log(`\n=== Testando Banco [${name.toUpperCase()}]: ${config.url} ===`);
  const supabase = createClient(config.url, config.key);
  
  // 1. Tentar selecionar matricula, nome, tentativas_login
  const { data: data1, error: error1 } = await supabase
    .from('usuarios')
    .select('matricula, nome, tentativas_login')
    .limit(1);
    
  if (error1) {
    console.log(`❌ Erro ao buscar 'tentativas_login':`, error1.message || error1);
  } else {
    console.log(`✅ Sucesso ao buscar 'tentativas_login'. Retorno:`, data1);
  }

  // 2. Tentar selecionar matricula, nome, bloqueado_ate
  const { data: data2, error: error2 } = await supabase
    .from('usuarios')
    .select('matricula, nome, bloqueado_ate')
    .limit(1);
    
  if (error2) {
    console.log(`❌ Erro ao buscar 'bloqueado_ate':`, error2.message || error2);
  } else {
    console.log(`✅ Sucesso ao buscar 'bloqueado_ate'. Retorno:`, data2);
  }
}

async function run() {
  await testConfig('homologacao', CONFIGS.homologacao);
  await testConfig('producao', CONFIGS.producao);
}

run().catch(console.error);
