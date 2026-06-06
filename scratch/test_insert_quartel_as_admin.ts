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

  console.log("Attempting to insert a new quartel...");
  const slug = `batalhao-teste-${Date.now()}`;
  const nome = `Batalhão Teste ${Date.now()}`;

  const { data, error } = await adminClient
    .from('quarteis')
    .insert({ slug, nome })
    .select()
    .single();

  if (error) {
    console.error("FAILED to insert quartel:", error);
  } else {
    console.log("SUCCESS inserting quartel:", data);
  }
}

run();
