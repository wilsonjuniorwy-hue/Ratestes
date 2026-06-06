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

  console.log("\n--- ALL POLICIES ---");
  const { data: policies, error: policiesErr } = await client.rpc('inspect_policies');

  if (policiesErr) {
    console.error("Failed to fetch policies:", policiesErr.message);
  } else {
    console.log(`Policies found (Count: ${policies.length}):`);
    console.dir(policies, { depth: null });
  }
}

run();
