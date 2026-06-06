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
  const matricula = `TEMP_${Date.now()}`;
  const email = `${matricula.toLowerCase()}@cavalaria.pm`;
  const password = "password123";
  
  console.log(`1. Criando registro local na tabela usuarios: ${matricula}`);
  const { error: insertErr } = await supabase
    .from('usuarios')
    .insert({
      matricula,
      nome: 'Usuario Temp Teste',
      nome_de_guerra: 'Temp',
      senha_hash: 'dummy',
      perfil: 'armeiro_gestor',
      posto_graduacao: 'Soldado',
      situacao_cautela: 'apto',
      data_ultimo_teste_psicologico: '2026-06-05',
      id_quartel: '5c4026ec-6c75-408d-8e26-81a13ecab933'
    });
    
  if (insertErr) {
    console.error("Erro ao inserir usuario local:", insertErr);
    return;
  }
  
  console.log(`2. Cadastrando e autenticando no Auth: ${email}`);
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (signUpError || !authData.user) {
    console.error("Erro no cadastro Auth:", signUpError);
    return;
  }
  
  const userClient = createClient(url, key, {
    global: {
      headers: {
        'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE',
        'Authorization': `Bearer ${authData.session?.access_token}`
      }
    }
  });
  
  console.log("3. Tentando atualizar auth_user_id via cliente autenticado...");
  const { data: updateData, error: updateErr } = await userClient
    .from('usuarios')
    .update({ auth_user_id: authData.user.id })
    .eq('matricula', matricula)
    .select();
    
  if (updateErr) {
    console.error("ERRO AO ATUALIZAR auth_user_id:", updateErr);
  } else {
    console.log("SUCESSO AO ATUALIZAR auth_user_id:", updateData);
  }
}

test();
