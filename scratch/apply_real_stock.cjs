const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://rndyzoyhpmubbbuxtuso.supabase.co";
const supabaseKey = "sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7";

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'x-device-uuid': 'DEVELOPMENT-TEST-DEVICE'
    }
  }
});

const stockOfficial = {
  'BAT-HYTERA': 47,
  'BAT-SEPURA': 52,
  'MUN-9MM': 339,
  'MUN-556': 180,
  'MUN-40': 177,
  'MUN-123T': 47,
  'MUN-12ELASTOMERO': 213,
  'GL 108 MAX': 37,
  'GL 108': 644,
  '0': 201, // Algema
  '03': 19, // Webcam Full HD
  '04': 20, // Bastao S/N
  '15': 20, // Tonfa
  '01': 19, // Capa de Chuva
  '10': 24, // Capacete Equitacao
  '00': 67, // Colete Refletivo
  '09': 68, // Capacete Balistico
  'TREINO': 50 // Pistola Treino
};

async function main() {
  console.log('=== APLICANDO CORREÇÃO DE ESTOQUE NO SUPABASE ===\n');

  for (const [idMat, qty] of Object.entries(stockOfficial)) {
    const { data, error } = await supabase
      .from('materiais')
      .update({ quantidade: qty })
      .eq('id_material', idMat)
      .select('id_material, modelo, quantidade');

    if (error) {
      console.error(`❌ Erro ao atualizar ${idMat}:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`✔ [${idMat}] ${data[0].modelo} atualizado para quantidade: ${data[0].quantidade}`);
    } else {
      console.warn(`⚠️ [${idMat}] Não encontrado na tabela materiais.`);
    }
  }

  console.log('\n=== CONFERÊNCIA FINAL DOS MATERIAIS EM LOTE ===');
  const { data: mats } = await supabase
    .from('materiais')
    .select('id_material, modelo, quantidade, controle_quantidade')
    .eq('controle_quantidade', true)
    .order('id_material');

  console.table(mats);
}

main().catch(console.error);
