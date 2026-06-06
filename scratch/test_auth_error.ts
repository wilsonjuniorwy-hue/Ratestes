import { createClient } from '@supabase/supabase-js';

const url = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const key = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const supabase = createClient(url, key);

async function test() {
  const email = `test_temp_${Date.now()}@cavalaria.pm`;
  const password = "password123";
  
  console.log(`Cadastrando usuario temporario: ${email}`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (signUpError) {
    console.error("Erro no cadastro:", signUpError);
    return;
  }
  
  console.log("Cadastro com sucesso. JWT obtido. Querying quarteis...");
  const { data: qData, error: qError } = await supabase
    .from('quarteis')
    .select('*');
    
  if (qError) {
    console.error("ERRO QUERY QUARTEIS:", qError);
  } else {
    console.log("SUCESSO QUERY QUARTEIS:", qData);
  }
}

test();
