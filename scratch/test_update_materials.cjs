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
  console.log('=== TESTE DE ATUALIZAÇÃO DIRETA NO SUPABASE ===');
  
  // Testar update de um item
  const { data, error } = await supabase
    .from('materiais')
    .update({ quantidade: 47 })
    .eq('id_material', 'BAT-HYTERA')
    .select();

  console.log('Update BAT-HYTERA:', data, error);
}

main().catch(console.error);
