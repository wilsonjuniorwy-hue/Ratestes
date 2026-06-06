import { createClient } from '@supabase/supabase-js';

const url = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const key = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7"; // Staging anon key

const supabase = createClient(url, key);

async function test() {
  console.log("Iniciando teste de consulta anonima...");
  const { data, error } = await supabase
    .from('quarteis')
    .select('*');
    
  if (error) {
    console.error("ERRO RECEBIDO:", error);
  } else {
    console.log("SUCESSO! Dados retornados:", data);
  }
}

test();
