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
  const tables = [
    'usuarios', 'materiais', 'categorias', 'cautelas', 'cautela_itens', 
    'auditoria_logs', 'ocorrencias', 'modelos_armas', 'armas_particulares',
    'pendencias_servico', 'quarteis'
  ];

  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`Table ${t}: ${count} rows (Error: ${error?.message || 'none'})`);
  }
}

main().catch(console.error);
