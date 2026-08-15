let createClient;
try {
  createClient = require('@supabase/supabase-js').createClient;
} catch (e) {
  createClient = require('./node_modules/.pnpm/@supabase+supabase-js@2.49.1/node_modules/@supabase/supabase-js').createClient;
}

const supabaseUrl = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const supabaseKey = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE'
    }
  }
});

async function investigateJudivan() {
  console.log('=== BUSCANDO JUDIVAN ===');

  const { data: users } = await supabase.from('usuarios').select('*').or('nome.ilike.%judivan%,nome_de_guerra.ilike.%judivan%');
  console.log('Usuários Judivan:', users);

  if (users && users.length > 0) {
    const mat = users[0].matricula;
    const { data: cautelas } = await supabase.from('cautelas').select('*').eq('matricula_policial', mat);
    console.log('\nCautelas de Judivan:', cautelas);

    if (cautelas && cautelas.length > 0) {
      for (const c of cautelas) {
        const { data: itens } = await supabase.from('cautela_itens').select('*').eq('id_cautela', c.id_cautela);
        console.log(`\nItens da cautela ${c.id_cautela} (status: ${c.status_cautela}):`, itens);
      }
    }
  }
}

investigateJudivan().catch(console.error);
