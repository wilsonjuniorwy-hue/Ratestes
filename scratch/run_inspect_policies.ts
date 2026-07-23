import { createClient } from '@supabase/supabase-js';

const url = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const key = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const supabase = createClient(url, key, {
  global: {
    headers: {
      'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE'
    }
  }
});

async function run() {
  console.log("Calling inspect_policies RPC...");
  const { data, error } = await supabase.rpc('inspect_policies');
  if (error) {
    console.error("Error calling inspect_policies:", error);
  } else {
    console.log("Policies defined in DB:");
    const filtered = (data as any[]).filter(p => p.tablename === 'usuarios');
    console.dir(filtered, { depth: null });
  }
}

run();
