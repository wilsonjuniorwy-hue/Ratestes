const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const rawInput = `
Bastao 120
Bastao 142
Bastao 125
Bastao 101
Bastao 24
Bastao 111
Bastao 80
Bastao 76
Bastao 99
Bastao 127
Bastao 44
Bastao 121
Bastao 83
Bastao 142
Bastao 97
Bastao 53
Bastao 147
Bastao 48
Bastao 87
Bastao 43
Bastao 93
Bastao 119
Bastao 92
Bastao 150
Bastao 22
Bastao 46
Bastao 145
Bastao 122
Bastao 13
Bastao 105
Bastao 68
Bastao 133
Bastao 34
Bastao 20
Bastao 25
Bastao 139
Bastao 28
Bastao 64
Bastao 52
Bastao 211
Bastao 70
Bastao 130
Bastao 123
Bastao 05
Bastao 65
Bastao 73
Bastao 54
Bastao 107
Bastao 39
Bastao 29
Bastao 71
Bastao 06
Bastao 72
Bastao 74
Bastao 95
Bastao 35
Bastao 113
Bastao 110
Bastao 14
Bastao 112
Bastao 20
Bastao 34
Bastao 40
Bastao 06
Bastao 29
Bastao 12
Bastao 37
Bastao 45
`;

const lines = rawInput.trim().split('\n').map(l => l.trim()).filter(Boolean);
const nums = [];
const seen = new Set();

for (const line of lines) {
  const match = line.match(/^Bastao\s+(\d+)$/i);
  if (match) {
    const num = match[1];
    if (!seen.has(num)) {
      seen.add(num);
      nums.push(num);
    }
  }
}

const rpmonId = '5c4026ec-6c75-408d-8e26-81a13ecab933';

const newMaterials = nums.map(num => ({
  id_material: num,
  id_categoria: 'CAT-493',
  modelo: 'B' + num,
  fabricante: '',
  calibre: '',
  status_atual: 'disponivel',
  data_aquisicao: '2026-07-23',
  data_ultima_manutencao: null,
  especificacoes_tecnicas: '',
  controle_quantidade: false,
  quantidade: 1,
  id_arma_vinculada: null,
  quantidade_carregadores: null,
  id_quartel: rpmonId,
  deletado_em: null
}));

// 1. Atualizar mockData.ts
const mockDataPath = path.join(__dirname, '..', 'src', 'mockData.ts');
let mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

const mockItemsToAppend = newMaterials.map(m => `  {
    id_material: '${m.id_material}',
    id_categoria: '${m.id_categoria}',
    modelo: '${m.modelo}',
    fabricante: '${m.fabricante}',
    calibre: '${m.calibre}',
    status_atual: 'disponivel',
    data_aquisicao: '${m.data_aquisicao}',
    especificacoes_tecnicas: '${m.especificacoes_tecnicas}',
    quantidade_carregadores: null
  }`).join(',\n');

if (mockDataContent.includes('export const mockMateriais: Material[] = [')) {
  // Verificar se ja foram adicionados para evitar duplicar string
  if (!mockDataContent.includes(`id_material: '${nums[0]}'`)) {
    mockDataContent = mockDataContent.replace(
      'export const mockMateriais: Material[] = [',
      `export const mockMateriais: Material[] = [\n${mockItemsToAppend},`
    );
    fs.writeFileSync(mockDataPath, mockDataContent, 'utf8');
    console.log('mockData.ts atualizado com 63 bastoes!');
  } else {
    console.log('mockData.ts ja possuía os bastoes.');
  }
}

// 2. Enviar para o Supabase (Homologação e Produção)
const envs = [
  {
    name: 'homologacao',
    url: 'https://rndyzoyhpmubbbuxtuso.supabase.co',
    key: 'sb_publishable_1PHcHXdcHye3Ent0hq4dLw_YGiRWtU7'
  },
  {
    name: 'producao',
    url: 'https://rwnldjtevkheiwutxhgg.supabase.co',
    key: 'sb_publishable_CQWOt6VSUTH7jPdYJXiY2w_IjvhG1Ea'
  }
];

async function syncToSupabase() {
  for (const env of envs) {
    console.log(`Conectando ao Supabase (${env.name})...`);
    try {
      const client = createClient(env.url, env.key);
      const { data, error } = await client.from('materiais').upsert(newMaterials, { onConflict: 'id_material' });
      if (error) {
        console.error(`Erro ao inserir no Supabase (${env.name}):`, error.message);
      } else {
        console.log(`Sucesso ao sincronizar 63 bastoes no Supabase (${env.name})!`);
      }
    } catch (err) {
      console.error(`Falha ao conectar no Supabase (${env.name}):`, err);
    }
  }
}

syncToSupabase();
