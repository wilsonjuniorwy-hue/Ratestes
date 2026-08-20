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
  const { data: mats } = await supabase
    .from('materiais')
    .select('*')
    .eq('controle_quantidade', true)
    .order('id_material');

  console.table(mats.map(m => ({
    id: m.id_material,
    modelo: m.modelo,
    categoria: m.id_categoria,
    quantidade_atual: m.quantidade
  })));
}

main().catch(console.error);
