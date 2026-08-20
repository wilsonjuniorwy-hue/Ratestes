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
  const { data, error } = await supabase
    .from('materiais')
    .delete()
    .or('id_material.ilike.TEST-BAT-%,id_material.ilike.TEST-MAT-%');

  console.log('Deleted test materials:', error || 'OK');
}

main().catch(console.error);
