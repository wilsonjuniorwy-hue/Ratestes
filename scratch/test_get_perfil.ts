import { createClient } from '@supabase/supabase-js';

const url = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const key = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const email = "admintest@admin.pm";
const password = "password123";

const supabase = createClient(url, key);

async function run() {
  console.log(`1. Logging in as admin: ${email}...`);
  const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInErr) {
    console.error("Sign in failed:", signInErr.message);
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

  console.log("2. Calling get_meu_perfil RPC...");
  const { data: perfil, error: perfilErr } = await adminClient.rpc('get_meu_perfil');
  if (perfilErr) {
    console.error("Error calling get_meu_perfil:", perfilErr);
  } else {
    console.log("get_meu_perfil() returned:", perfil);
  }

  console.log("3. Calling get_minha_matricula RPC...");
  const { data: matricula, error: matriculaErr } = await adminClient.rpc('get_minha_matricula');
  if (matriculaErr) {
    console.error("Error calling get_minha_matricula:", matriculaErr);
  } else {
    console.log("get_minha_matricula() returned:", matricula);
  }
}

run();
