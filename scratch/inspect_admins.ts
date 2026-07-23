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
  console.log("Buscando administradores e gestores...");
  const { data, error } = await supabase
    .from('usuarios')
    .select('matricula, nome, perfil, auth_user_id, id_quartel')
    .in('perfil', ['admin', 'armeiro_gestor']);
    
  if (error) {
    console.error("Erro ao buscar usuarios:", error);
  } else {
    console.log("Administradores e Gestores cadastrados:");
    console.dir(data, { depth: null });
  }
}

test();
