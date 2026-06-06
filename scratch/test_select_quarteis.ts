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

async function test() {
  const { data, error } = await supabase
    .from('quarteis')
    .select('*');
    
  if (error) {
    console.error("Error fetching quarteis:", error);
  } else {
    console.log("Quarteis:");
    console.dir(data, { depth: null });
  }
}

test();
