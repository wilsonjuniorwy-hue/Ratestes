-- ====================================================================
-- SCRIPT DE RECONCILIAÇÃO DE MATERIAIS ÓRFÃOS (STATUS CAUTELADO)
-- Execute este script no SQL Editor do Supabase para corrigir materiais
-- que ficaram com status_atual = 'cautelado', mas não possuem nenhuma
-- cautela ativa ou item de cautela sem baixa.
-- ====================================================================

-- 1. Restaurar os itens da cautela CAUT-3411-2026 para exibição dos materiais de Wagner
UPDATE cautela_itens
SET estado_devolucao = NULL
WHERE id_cautela = 'CAUT-3411-2026';

-- 2. Atualizar materiais com status 'cautelado' que não estão em nenhuma cautela ativa
UPDATE materiais
SET status_atual = 'disponivel'
WHERE status_atual = 'cautelado'
  AND controle_quantidade = false
  AND id_material NOT IN (
    SELECT ci.id_material
    FROM cautela_itens ci
    JOIN cautelas c ON c.id_cautela = ci.id_cautela
    WHERE (ci.deletado_em IS NULL)
      AND (c.deletado_em IS NULL)
      AND ci.estado_devolucao IS NULL
      AND LOWER(TRIM(c.status_cautela)) IN ('ativa', 'atrasada', 'prorrogada')
  );
