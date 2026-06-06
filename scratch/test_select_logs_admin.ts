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

  const client = createClient(url, key, {
    global: {
      headers: {
        'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE',
        'Authorization': `Bearer ${authData.session?.access_token}`
      }
    }
  });

  // Query audit logs
  console.log("\n--- Querying auditoria_logs as Admin ---");
  const { data: logs, error: logsErr } = await client
    .from('auditoria_logs')
    .select('*')
    .order('data_hora', { ascending: false });

  console.log("auditoria_logs error:", logsErr);
  console.log("auditoria_logs count:", logs?.length);
  if (logs) {
    console.dir(logs, { depth: null });
  }
}

run();
