const fs = require('fs');
const path = require('path');

const rawInput = `
SEPURA 03600.216.276
SEPURA 03600.216.278
SEPURA 03600.216.284
SEPURA 03600.216.283
SEPURA 03600.216.286
SEPURA 03600.216.253
SEPURA 03600.216.246
SEPURA 03600.216.266
SEPURA 03600.216.275
SEPURA 03600.216.249
SEPURA 03600.216.260
SEPURA 03600.216.254
SEPURA 03600.216.279
SEPURA 03600.216.250
SEPURA 03600.216.271
SEPURA 03600.216.245
SEPURA 03600.216.273
SEPURA 03600.216.252
SEPURA 03600.216.265
`;

const lines = rawInput.trim().split('\n').map(l => l.trim()).filter(Boolean);
const items = [];
const seen = new Set();

for (const line of lines) {
  const match = line.match(/^SEPURA\s+(03600\.(.+))$/i);
  if (match) {
    const sn = match[1]; // ex: 03600.216.276
    const sufix = match[2]; // ex: 216.276
    const modelo = 'SEP' + sufix; // ex: SEP216.276
    if (!seen.has(sn)) {
      seen.add(sn);
      items.push({ sn, modelo });
    }
  }
}

console.log('Total de rádios Sepura extraídos:', items.length);

const rpmonId = '5c4026ec-6c75-408d-8e26-81a13ecab933';

// 1. Atualizar backup_reserva_armamento.json
const backupPath = path.join(__dirname, '..', 'backup_reserva_armamento.json');
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

const existingIds = new Set(backupData.materiais.map(m => m.id_material));
let addedCount = 0;

for (const item of items) {
  if (!existingIds.has(item.sn)) {
    backupData.materiais.push({
      id_material: item.sn,
      id_categoria: 'CAT-COMUNICACAO',
      modelo: item.modelo,
      fabricante: 'SEPURA',
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
    });
    existingIds.add(item.sn);
    addedCount++;
  }
}

fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
console.log('Novos rádios Sepura adicionados ao backup_reserva_armamento.json:', addedCount);

// 2. Atualizar mockData.ts
const mockDataPath = path.join(__dirname, '..', 'src', 'mockData.ts');
let mockContent = fs.readFileSync(mockDataPath, 'utf8');

const mockItemsToAppend = items.map(item => `  {
    id_material: '${item.sn}',
    id_categoria: 'CAT-COMUNICACAO',
    modelo: '${item.modelo}',
    fabricante: 'SEPURA',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: '',
    quantidade_carregadores: null
  }`).join(',\n');

if (mockContent.includes('export const mockMateriais: Material[] = [')) {
  if (!mockContent.includes(`id_material: '${items[0].sn}'`)) {
    mockContent = mockContent.replace(
      'export const mockMateriais: Material[] = [',
      `export const mockMateriais: Material[] = [\n${mockItemsToAppend},`
    );
    fs.writeFileSync(mockDataPath, mockContent, 'utf8');
    console.log('mockData.ts atualizado com 19 rádios Sepura!');
  } else {
    console.log('mockData.ts já continha os rádios Sepura.');
  }
}

// 3. Gerar radios_sepura_insert.sql
let sql = `-- ====================================================================\n`;
sql += `-- INSERÇÃO DOS 19 RÁDIOS SEPURA NA TABELA 'materiais'\n`;
sql += `-- Execute este script no SQL Editor do Supabase\n`;
sql += `-- ====================================================================\n\n`;

sql += `INSERT INTO materiais (\n`;
sql += `  id_material, id_categoria, modelo, fabricante, calibre, status_atual, data_aquisicao, controle_quantidade, quantidade, id_quartel\n`;
sql += `) VALUES\n`;

const valuesStr = items.map(item => 
  `  ('${item.sn}', 'CAT-COMUNICACAO', '${item.modelo}', 'SEPURA', '', 'disponivel', '2026-07-23', false, 1, '${rpmonId}')`
).join(',\n');

sql += valuesStr + `\nON CONFLICT (id_material) DO UPDATE SET\n`;
sql += `  modelo = EXCLUDED.modelo,\n`;
sql += `  fabricante = EXCLUDED.fabricante,\n`;
sql += `  id_categoria = EXCLUDED.id_categoria,\n`;
sql += `  status_atual = EXCLUDED.status_atual,\n`;
sql += `  id_quartel = EXCLUDED.id_quartel;\n`;

fs.writeFileSync(path.join(__dirname, '..', 'radios_sepura_insert.sql'), sql, 'utf8');
console.log('radios_sepura_insert.sql gerado com sucesso!');
