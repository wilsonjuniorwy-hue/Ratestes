import { createClient } from '@supabase/supabase-js';

const url = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const key = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const supabase = createClient(url, key);

async function run() {
  console.log("Logging in as armeiro@cavalaria.pm...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'armeiro@cavalaria.pm',
    password: '101187'
  });

  if (authErr) {
    console.error("Login failed:", authErr.message);
    return;
  }

  console.log("Logged in successfully. User UID:", authData.user?.id);

  const client = createClient(url, key, {
    global: {
      headers: {
        'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE',
        'Authorization': `Bearer ${authData.session?.access_token}`
      }
    }
  });

  // 1. Check user record in database
  console.log("\n--- Checking User Record ---");
  const { data: userRec, error: userRecErr } = await client
    .from('usuarios')
    .select('matricula, nome, perfil, id_quartel, auth_user_id')
    .eq('matricula', 'ARMEIRO')
    .single();

  console.log("User record error:", userRecErr);
  console.log("User record:", userRec);

  // 2. Call get_meu_perfil() and get_meu_quartel() via RPC
  console.log("\n--- Testing RLS Functions ---");
  const { data: perfil, error: pErr } = await client.rpc('get_meu_perfil');
  console.log("get_meu_perfil() result:", perfil, "| error:", pErr);

  const { data: quartel, error: qErr } = await client.rpc('get_meu_quartel');
  console.log("get_meu_quartel() result:", quartel, "| error:", qErr);

  const { data: matricula, error: mErr } = await client.rpc('get_minha_matricula');
  console.log("get_minha_matricula() result:", matricula, "| error:", mErr);

  // 3. Query audit logs
  console.log("\n--- Querying auditoria_logs ---");
  const { data: logs, error: logsErr } = await client
    .from('auditoria_logs')
    .select('*')
    .order('data_hora', { ascending: false });

  console.log("auditoria_logs error:", logsErr);
  console.log("auditoria_logs count:", logs?.length);
  if (logs && logs.length > 0) {
    console.log("Sample logs:", logs.slice(0, 3));
  }
}

run();
