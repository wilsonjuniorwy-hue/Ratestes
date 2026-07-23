const { createClient } = require('@supabase/supabase-js');

const url = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const key = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const client = createClient(url, key);

async function run() {
  const { data, error } = await client.from('materiais').select('*');
  if (error) {
    console.error('Error fetching Supabase materials:', error);
    return;
  }

  const bastoes = data.filter(m => {
    const mod = (m.modelo || '').trim();
    const id = (m.id_material || '').trim();
    return m.id_categoria === 'CAT-493' ||
      /^B\d+$/i.test(mod) ||
      /^BASTAO/i.test(mod) ||
      /^BASTÃO/i.test(mod) ||
      /^BASTAO/i.test(id) ||
      /^BASTÃO/i.test(id);
  });

  console.log(`--- ENCONTRADOS ${bastoes.length} REGISTROS DE BASTAO NO SUPABASE ---`);
  let sum = 0;
  bastoes.forEach(b => {
    const qty = b.controle_quantidade ? (b.quantidade || 0) : 1;
    sum += qty;
    console.log(`Supabase ID: "${b.id_material}" | Modelo: "${b.modelo}" | Qtd: ${b.quantidade} | ControleQtd: ${b.controle_quantidade} | Calc: ${qty}`);
  });
  console.log('SUM TOTAL NO SUPABASE:', sum);
}

run();
