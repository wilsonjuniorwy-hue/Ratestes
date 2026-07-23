import { createClient } from '@supabase/supabase-js';

const url = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const key = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const email = "admintest@admin.pm";
const password = "password123";

const supabase = createClient(url, key, {
  global: {
    headers: {
      'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE'
    }
  }
});

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

  console.log("Logged in successfully. Token: ", authData.session?.access_token ? "PRESENT" : "MISSING");

  const adminClient = createClient(url, key, {
    global: {
      headers: {
        'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE',
        'Authorization': `Bearer ${authData.session?.access_token}`
      }
    }
  });

  console.log("2. Attempting to soft delete user with matricula 31...");
  const { data, error } = await adminClient
    .from('usuarios')
    .update({ deletado_em: new Date().toISOString() })
    .eq('matricula', '31')
    .select();

  if (error) {
    console.error("Error soft deleting user:", error);
  } else {
    console.log("Success! Updated user data:", data);
  }
}

run();
