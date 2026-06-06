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

  console.log("\n--- Checking Quarteis ---");
  const { data: quarteis, error: qErr } = await client.from('quarteis').select('*');
  console.log("Quarteis error:", qErr);
  console.log("Quarteis count:", quarteis?.length);
  if (quarteis) {
    console.dir(quarteis, { depth: null });
  }

  console.log("\n--- Checking ALL Materiais ---");
  const { data: materiais, error: mErr } = await client
    .from('materiais')
    .select('*');
  console.log("Materiais error:", mErr);
  console.log("Materiais count:", materiais?.length);
  if (materiais) {
    console.dir(materiais, { depth: null });
  }
}

run();
