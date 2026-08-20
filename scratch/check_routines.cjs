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
  // Check if we can get function definitions or triggers
  const { data: routines, error: errR } = await supabase
    .from('information_schema.routines')
    .select('*')
    .limit(10);
  console.log('Routines access:', errR ? errR.message : 'OK');
}

main().catch(console.error);
