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
  const { data, error } = await supabase.from('usuarios').select('*').eq('matricula', '7322623');
  console.log('User 7322623:', data, error);

  // Check which matriculas are actually in cautelas
  const { data: cautelas } = await supabase.from('cautelas').select('matricula_policial').limit(10);
  console.log('Cautelas policiais:', cautelas);
}

main().catch(console.error);
