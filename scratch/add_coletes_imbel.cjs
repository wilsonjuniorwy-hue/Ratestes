const fs = require('fs');
const path = require('path');

const rawInput = `
3002093
3001989
3002090
3001993
3001991
`;

const lines = rawInput.trim().split('\n').map(l => l.trim()).filter(Boolean);
const items = [];
const seen = new Set();

for (const line of lines) {
  const match = line.match(/^(300\d+)$/);
  if (match) {
    const sn = match[1]; // ex: 3002093
    const modelo = 'Colete Imbel Tam M';
    if (!seen.has(sn)) {
      seen.add(sn);
      items.push({ sn, modelo });
    }
  }
}

console.log('Total de coletes Imbel extraídos:', items.length);

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
      id_categoria: 'CAT-MANUTENCAO',
      modelo: item.modelo,
      fabricante: 'IMBEL',
      calibre: '',
      status_atual: 'disponivel',
      data_aquisicao: '2026-07-23',
      data_ultima_manutencao: null,
      especificacoes_tecnicas: 'Tamanho M',
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
console.log('Novos coletes Imbel adicionados ao backup_reserva_armamento.json:', addedCount);

// 2. Atualizar mockData.ts
const mockDataPath = path.join(__dirname, '..', 'src', 'mockData.ts');
let mockContent = fs.readFileSync(mockDataPath, 'utf8');

const mockItemsToAppend = items.map(item => `  {
    id_material: '${item.sn}',
    id_categoria: 'CAT-MANUTENCAO',
    modelo: '${item.modelo}',
    fabricante: 'IMBEL',
    calibre: '',
    status_atual: 'disponivel',
    data_aquisicao: '2026-07-23',
    especificacoes_tecnicas: 'Tamanho M',
    quantidade_carregadores: null
  }`).join(',\n');

if (mockContent.includes('export const mockMateriais: Material[] = [')) {
  if (!mockContent.includes(`id_material: '${items[0].sn}'`)) {
    mockContent = mockContent.replace(
      'export const mockMateriais: Material[] = [',
      `export const mockMateriais: Material[] = [\n${mockItemsToAppend},`
    );
    fs.writeFileSync(mockDataPath, mockContent, 'utf8');
    console.log('mockData.ts atualizado com 5 coletes Imbel!');
  } else {
    console.log('mockData.ts já continha os coletes Imbel.');
  }
}

// 3. Gerar coletes_imbel_insert.sql
let sql = `-- ====================================================================\n`;
sql += `-- INSERÇÃO DOS 5 COLETES IMBEL (TAM M) NA TABELA 'materiais'\n`;
sql += `-- Execute este script no SQL Editor do Supabase\n`;
sql += `-- ====================================================================\n\n`;

sql += `INSERT INTO materiais (\n`;
sql += `  id_material, id_categoria, modelo, fabricante, calibre, especificacoes_tecnicas, status_atual, data_aquisicao, controle_quantidade, quantidade, id_quartel\n`;
sql += `) VALUES\n`;

const valuesStr = items.map(item => 
  `  ('${item.sn}', 'CAT-MANUTENCAO', '${item.modelo}', 'IMBEL', '', 'Tamanho M', 'disponivel', '2026-07-23', false, 1, '${rpmonId}')`
).join(',\n');

sql += valuesStr + `\nON CONFLICT (id_material) DO UPDATE SET\n`;
sql += `  modelo = EXCLUDED.modelo,\n`;
sql += `  fabricante = EXCLUDED.fabricante,\n`;
sql += `  id_categoria = EXCLUDED.id_categoria,\n`;
sql += `  especificacoes_tecnicas = EXCLUDED.especificacoes_tecnicas,\n`;
sql += `  status_atual = EXCLUDED.status_atual,\n`;
sql += `  id_quartel = EXCLUDED.id_quartel;\n`;

fs.writeFileSync(path.join(__dirname, '..', 'coletes_imbel_insert.sql'), sql, 'utf8');
console.log('coletes_imbel_insert.sql gerado com sucesso!');
