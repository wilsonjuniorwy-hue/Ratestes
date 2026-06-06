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

  console.log("Inserting DEVELOPMENT-TEST-DEVICE with status 'pendente'...");
  const { data, error } = await adminClient
    .from('dispositivos_autorizados')
    .insert({
      uuid_hardware: 'DEVELOPMENT-TEST-DEVICE',
      nome_dispositivo: 'Navegador de Teste Local',
      status: 'pendente'
    })
    .select();

  if (error) {
    console.error("Failed to register device:", error);
  } else {
    console.log("Successfully registered device:", data);
  }
}

run();
