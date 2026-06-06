import { createClient } from '@supabase/supabase-js';

const url = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const key = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const supabase = createClient(url, key);

async function test() {
  console.log("Logging in as 01@cavalaria.pm...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: '01@cavalaria.pm',
    password: '123456'
  });
  
  if (authErr) {
    console.error("Login failed:", authErr.message);
    return;
  }
  
  console.log("Login success! UID:", authData.user.id);
  
  const userClient = createClient(url, key, {
    global: {
      headers: {
        'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE',
        'Authorization': `Bearer ${authData.session?.access_token}`
      }
    }
  });
  
  const { data: sessionData, error: sessionErr } = await userClient.rpc('check_my_session');
  if (sessionErr) {
    console.error("RPC Error:", sessionErr);
  } else {
    console.log("check_my_session:", sessionData);
  }
}

test();
