-- ============================================================
-- MIGRATION HOTFIX: Seeding Idempotente de Baterias (BAT-HYTERA / BAT-SEPURA)
-- Data: 2026-08-08
-- Execute este script no SQL Editor do Supabase (Staging / Production)
-- ============================================================

-- NOTA MULTI-QUARTEL:
-- Este script realiza o seed das baterias para o quartel 'cavalaria' (produção).
-- Caso novos quarteis sejam ativados com materiais operacionais no futuro,
-- este mesmo seed de baterias (BAT-HYTERA / BAT-SEPURA) deverá ser executado
-- com o id_quartel correspondente para evitar erros de Foreign Key (FK 23503).

INSERT INTO materiais (
  id_material,
  id_categoria,
  modelo,
  fabricante,
  status_atual,
  data_aquisicao,
  controle_quantidade,
  quantidade,
  id_quartel
) VALUES 
  (
    'BAT-HYTERA',
    'CAT-COMUNICACAO',
    'Bateria Hytera',
    'Hytera',
    'disponivel',
    CURRENT_DATE,
    TRUE,
    999,
    (SELECT id FROM quarteis WHERE slug = 'cavalaria' LIMIT 1)
  ),
  (
    'BAT-SEPURA',
    'CAT-COMUNICACAO',
    'Bateria Sepura',
    'Sepura',
    'disponivel',
    CURRENT_DATE,
    TRUE,
    999,
    (SELECT id FROM quarteis WHERE slug = 'cavalaria' LIMIT 1)
  )
ON CONFLICT (id_material) DO NOTHING;
