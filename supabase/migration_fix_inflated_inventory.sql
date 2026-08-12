-- ============================================================
-- SCRIPT DE AJUSTE DE ESTOQUE REAL (PASSO 4 - CONTAGEM 12/08/2026)
-- Data: 2026-08-12
-- Execute este script no SQL Editor do Supabase para restaurar os estoques reais
-- ============================================================

-- 1. Restabelecer Munições com a contagem física de 12/08
UPDATE materiais SET quantidade = 339 WHERE id_material = 'MUN-9MM';
UPDATE materiais SET quantidade = 180 WHERE id_material = 'MUN-556';
UPDATE materiais SET quantidade = 177 WHERE id_material = 'MUN-40';

-- 2. Restabelecer Baterias Oficiais com a contagem física de 12/08
UPDATE materiais SET quantidade = 52 WHERE id_material = 'BAT-SEPURA';
UPDATE materiais SET quantidade = 29 WHERE id_material = 'BAT-HYTERA';

-- 3. Restabelecer Algemas e Webcams com a contagem física de 12/08
UPDATE materiais SET quantidade = 201 WHERE id_material = '0';
UPDATE materiais SET quantidade = 9   WHERE id_material = '03';

-- 4. Exibir conferência final dos estoques corrigidos
SELECT id_material, modelo, quantidade, controle_quantidade, status_atual 
FROM materiais 
WHERE id_material IN ('MUN-9MM', 'MUN-556', 'MUN-40', 'BAT-SEPURA', 'BAT-HYTERA', '0', '03')
ORDER BY id_material;
