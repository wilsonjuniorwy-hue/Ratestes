-- ====================================================================
-- INSERÇÃO DOS 16 RÁDIOS HYTERA NA TABELA 'materiais'
-- Execute este script no SQL Editor do Supabase
-- ====================================================================

INSERT INTO materiais (
  id_material, id_categoria, modelo, fabricante, calibre, status_atual, data_aquisicao, controle_quantidade, quantidade, id_quartel
) VALUES
  ('03600.213.945', 'CAT-COMUNICACAO', 'HY213.945', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.213.924', 'CAT-COMUNICACAO', 'HY213.924', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.213.944', 'CAT-COMUNICACAO', 'HY213.944', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.213.931', 'CAT-COMUNICACAO', 'HY213.931', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.213.922', 'CAT-COMUNICACAO', 'HY213.922', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.213.917', 'CAT-COMUNICACAO', 'HY213.917', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.213.920', 'CAT-COMUNICACAO', 'HY213.920', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.213.943', 'CAT-COMUNICACAO', 'HY213.943', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.214.388', 'CAT-COMUNICACAO', 'HY214.388', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.213.928', 'CAT-COMUNICACAO', 'HY213.928', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.213.918', 'CAT-COMUNICACAO', 'HY213.918', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.213.940', 'CAT-COMUNICACAO', 'HY213.940', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.213.935', 'CAT-COMUNICACAO', 'HY213.935', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.214.009', 'CAT-COMUNICACAO', 'HY214.009', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.213.948', 'CAT-COMUNICACAO', 'HY213.948', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933'),
  ('03600.213.927', 'CAT-COMUNICACAO', 'HY213.927', 'HYTERA', '', 'disponivel', '2026-07-23', false, 1, '5c4026ec-6c75-408d-8e26-81a13ecab933')
ON CONFLICT (id_material) DO UPDATE SET
  modelo = EXCLUDED.modelo,
  fabricante = EXCLUDED.fabricante,
  id_categoria = EXCLUDED.id_categoria,
  status_atual = EXCLUDED.status_atual,
  id_quartel = EXCLUDED.id_quartel;
