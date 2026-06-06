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

  console.log("Fetching devices...");
  const { data, error } = await adminClient
    .from('dispositivos_autorizados')
    .select('*');

  if (error) {
    console.error("Error fetching devices:", error.message);
  } else {
    console.log(`Devices found (Count: ${data.length}):`);
    console.dir(data, { depth: null });
  }
}

run();
