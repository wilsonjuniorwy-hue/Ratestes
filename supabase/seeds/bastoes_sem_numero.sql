-- INSERCAO DO LOTE DE 12 BASTOES SEM NUMERO NO SUPABASE
INSERT INTO materiais (
  id_material, id_categoria, modelo, fabricante, calibre, status_atual, data_aquisicao, controle_quantidade, quantidade, id_quartel
) VALUES (
  'BASTAO-SEM-NUMERO', 'CAT-493', 'Bastao Policial (Sem Numero)', 'Dotacao PMDF', 'N/A', 'disponivel', '2026-07-23', true, 12, '5c4026ec-6c75-408d-8e26-81a13ecab933'
) ON CONFLICT (id_material) DO UPDATE SET
  quantidade = 12,
  modelo = EXCLUDED.modelo,
  controle_quantidade = true,
  status_atual = 'disponivel';
