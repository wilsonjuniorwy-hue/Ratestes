import { createClient } from '@supabase/supabase-js';

const url = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const key = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const supabase = createClient(url, key);

async function run() {
  const email = "admintest@admin.pm";
  const password = "password123";

  console.log(`1. Signing up auth user: ${email}...`);
  // Try to signUp. If user already exists, it might return an error or auto-login.
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password
  });

  let authId = '';
  if (signUpErr) {
    if (signUpErr.message.includes("already registered")) {
      console.log("User already registered in Auth. Logging in...");
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInErr) {
        console.error("Sign in failed:", signInErr.message);
        return;
      }
      authId = signInData.user.id;
    } else {
      console.error("Sign up failed:", signUpErr.message);
      return;
    }
  } else {
    authId = signUpData.user.id;
  }

  console.log(`Auth ID for test admin: ${authId}`);

  console.log("2. Logging in as armeiro 01...");
  const { data: armeiroData, error: armeiroErr } = await supabase.auth.signInWithPassword({
    email: '01@cavalaria.pm',
    password: '123456'
  });

  if (armeiroErr) {
    console.error("Armeiro login failed:", armeiroErr.message);
    return;
  }

  const armeiroClient = createClient(url, key, {
    global: {
      headers: {
        'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE',
        'Authorization': `Bearer ${armeiroData.session?.access_token}`
      }
    }
  });

  console.log("3. Inserting ADMINTEST user into database...");
  const { data: insertData, error: insertErr } = await armeiroClient
    .from('usuarios')
    .insert({
      matricula: 'ADMINTEST',
      nome: 'Admin de Teste',
      nome_de_guerra: 'AdminTest',
      senha_hash: '5fac61b0fd803321c5831cd12a21649522595554c8a508bd42d4a1b4f09eab36', // sha256 of dummy/totem
      perfil: 'admin',
      posto_graduacao: 'Administrador',
      situacao_cautela: 'apto',
      data_ultimo_teste_psicologico: '2099-12-31',
      auth_user_id: authId,
      id_quartel: null
    })
    .select();

  if (insertErr) {
    if (insertErr.message.includes("duplicate key")) {
      console.log("ADMINTEST profile already exists in usuarios table. Updating auth_user_id...");
      const { data: updateData, error: updateErr } = await armeiroClient
        .from('usuarios')
        .update({ auth_user_id: authId })
        .eq('matricula', 'ADMINTEST')
        .select();
      if (updateErr) {
        console.error("Update failed:", updateErr.message);
        return;
      }
      console.log("ADMINTEST profile updated successfully:", updateData);
    } else {
      console.error("Insert failed:", insertErr.message);
      return;
    }
  } else {
    console.log("ADMINTEST profile created successfully:", insertData);
  }

  console.log("4. Logging in as ADMINTEST to verify...");
  const { data: testAdminData, error: testAdminErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (testAdminErr) {
    console.error("Test admin login failed:", testAdminErr.message);
    return;
  }

  const testAdminClient = createClient(url, key, {
    global: {
      headers: {
        'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE',
        'Authorization': `Bearer ${testAdminData.session?.access_token}`
      }
    }
  });

  const { data: sessionData, error: sessionErr } = await testAdminClient.rpc('check_my_session');
  if (sessionErr) {
    console.error("Session RPC failed:", sessionErr);
  } else {
    console.log("Session verified! check_my_session response:", sessionData);
  }
}

run();
