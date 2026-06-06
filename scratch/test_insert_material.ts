import { createClient } from '@supabase/supabase-js';

const url = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const key = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const supabase = createClient(url, key);

async function run() {
  console.log("Logging in as admintest@admin.pm...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admintest@admin.pm',
    password: 'password123'
  });

  if (authErr) {
    console.error("Login failed:", authErr.message);
    return;
  }

  const adminClient = createClient(url, key, {
    global: {
      headers: {
        'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE',
        'Authorization': `Bearer ${authData.session?.access_token}`
      }
    }
  });

  console.log("Attempting to insert a material...");
  const { data, error } = await adminClient
    .from('materiais')
    .insert({
      id_material: 'PMDF-PISTOLA-9MM-TEST-DIAGNOSE',
      id_categoria: 'CAT-ARMA-CURTA',
      modelo: 'APX',
      fabricante: 'Beretta',
      calibre: '9x19mm',
      status_atual: 'disponivel',
      data_aquisicao: '2024-01-10',
      controle_quantidade: false,
      id_quartel: '5c4026ec-6c75-408d-8e26-81a13ecab933'
    })
    .select();

  if (error) {
    console.error("FAILED to insert material:", error);
  } else {
    console.log("SUCCESS inserting material:", data);
  }
}

run();
