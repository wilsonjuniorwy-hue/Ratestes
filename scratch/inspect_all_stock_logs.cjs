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
  console.log('=== AUDITORIA LOGS - HISTÓRICO COMPLETO ===');
  const { data: logs, error } = await supabase
    .from('auditoria_logs')
    .select('*')
    .order('data_hora', { ascending: true });

  if (error) {
    console.error('Erro ao buscar logs:', error);
    return;
  }

  console.log(`Total de logs de auditoria: ${logs.length}`);

  const stockLogs = logs.filter(l => 
    l.detalhes.includes('BAT-') || 
    l.detalhes.includes('HYTERA') || 
    l.detalhes.includes('SEPURA') || 
    l.detalhes.includes('9MM') || 
    l.detalhes.includes('556') || 
    l.detalhes.includes('incrementada') ||
    l.detalhes.includes('ADICIONADAS') ||
    l.detalhes.includes('RETIRADAS') ||
    l.detalhes.includes('Restauração')
  );

  console.table(stockLogs.map(l => ({
    id: l.id_log,
    data: l.data_hora,
    executor: l.matricula_executor,
    evento: l.tipo_evento,
    detalhes: l.detalhes
  })));
}

main().catch(console.error);
