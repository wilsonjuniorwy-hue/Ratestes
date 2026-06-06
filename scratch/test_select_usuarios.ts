import { createClient } from '@supabase/supabase-js';

const url = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const key = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

// Criar o cliente com a assinatura virtual para passar pela RLS
const supabase = createClient(url, key, {
  global: {
    headers: {
      'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE'
    }
  }
});

async function test() {
  console.log("Buscando usuarios...");
  const { data, error } = await supabase
    .from('usuarios')
    .select('*');
    
  if (error) {
    console.error("Erro ao buscar usuarios:", error);
  } else {
    console.log("Usuarios cadastrados:");
    console.dir(data, { depth: null });
  }
}

test();
