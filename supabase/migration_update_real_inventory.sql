-- ============================================================
-- MIGRATION: Atualização de Estoque Real do Paiol (SEGURO - SEM DELETE DE BASTÕES)
-- Data: 2026-08-08
-- Execute este script no SQL Editor do Supabase (Staging / Production)
-- ============================================================

-- 1. Soft-delete das baterias legadas de mock ("07" e "08") para preservar histórico de cautelas passadas
UPDATE materiais 
SET deletado_em = NOW() 
WHERE id_material IN ('07', '08');

-- 2. Atualizar Baterias Oficiais (Sepura: 52, Hytera: 29)
INSERT INTO materiais (id_material, id_categoria, modelo, fabricante, status_atual, data_aquisicao, controle_quantidade, quantidade, id_quartel)
VALUES 
  ('BAT-SEPURA', 'CAT-COMUNICACAO', 'Bateria Sepura', 'Sepura', 'disponivel', CURRENT_DATE, TRUE, 52, (SELECT id FROM quarteis WHERE slug = 'cavalaria' LIMIT 1)),
  ('BAT-HYTERA', 'CAT-COMUNICACAO', 'Bateria Hytera', 'Hytera', 'disponivel', CURRENT_DATE, TRUE, 29, (SELECT id FROM quarteis WHERE slug = 'cavalaria' LIMIT 1))
ON CONFLICT (id_material) DO UPDATE SET quantidade = EXCLUDED.quantidade, deletado_em = NULL;

-- 3. Atualizar Munições (9mm: 339, 5.56: 180, .40: 177)
INSERT INTO materiais (id_material, id_categoria, modelo, fabricante, calibre, status_atual, data_aquisicao, controle_quantidade, quantidade, id_quartel)
VALUES 
  ('MUN-9MM', 'CAT-MUNICAO', 'Munição 9mm CBC Gold Flat', 'CBC', '9x19mm Parabellum', 'disponivel', CURRENT_DATE, TRUE, 339, (SELECT id FROM quarteis WHERE slug = 'cavalaria' LIMIT 1)),
  ('MUN-556', 'CAT-MUNICAO', 'Munição 5.56x45mm NATO CBC', 'CBC', '5.56x45mm NATO', 'disponivel', CURRENT_DATE, TRUE, 180, (SELECT id FROM quarteis WHERE slug = 'cavalaria' LIMIT 1)),
  ('MUN-40',  'CAT-MUNICAO', 'Munição .40 S&W CBC Gold', 'CBC', '.40 S&W', 'disponivel', CURRENT_DATE, TRUE, 177, (SELECT id FROM quarteis WHERE slug = 'cavalaria' LIMIT 1))
ON CONFLICT (id_material) DO UPDATE SET quantidade = EXCLUDED.quantidade, deletado_em = NULL;

-- 4. Atualizar Algemas (ID '0' -> 201 un) e Webcams (ID '03' -> 9 un) nos registros já existentes
UPDATE materiais SET quantidade = 201 WHERE id_material = '0';
UPDATE materiais SET quantidade = 9   WHERE id_material = '03';
