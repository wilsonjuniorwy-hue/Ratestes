import { createClient } from '@supabase/supabase-js';

const url = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const key = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const supabase = createClient(url, key);

async function test() {
  const email = `test_temp_session_${Date.now()}@cavalaria.pm`;
  const password = "password123";
  
  console.log(`Cadastrando usuario: ${email}`);
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (signUpError || !authData.user) {
    console.error("Erro no cadastro:", signUpError);
    return;
  }
  
  const userClient = createClient(url, key, {
    global: {
      headers: {
        'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE',
        'Authorization': `Bearer ${authData.session?.access_token}`
      }
    }
  });
  
  console.log("Chamando RPC check_my_session...");
  const { data: sessionData, error: sessionErr } = await userClient
    .rpc('check_my_session');
    
  if (sessionErr) {
    console.error("ERRO RPC:", sessionErr);
  } else {
    console.log("RESULTADO RPC check_my_session:");
    console.dir(sessionData, { depth: null });
  }
}

test();
