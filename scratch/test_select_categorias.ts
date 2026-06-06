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
  console.log("Buscando categorias...");
  const { data, error } = await supabase
    .from('categorias')
    .select('*');
    
  if (error) {
    console.error("Erro ao buscar categorias:", error);
  } else {
    console.log("Categorias no banco:");
    console.dir(data, { depth: null });
  }
}

test();
