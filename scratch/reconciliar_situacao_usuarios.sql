-- ====================================================================
-- SCRIPT DE RECONCILIAÇÃO DE SITUAÇÃO DE CAUTELA (PENDENTE_DEVOLUCAO)
-- Execute este script no SQL Editor do Supabase para corrigir militares
-- que ficaram com status 'pendente_devolucao', mas não possuem nenhuma
-- cautela ativa, atrasada ou prorrogada na tabela de cautelas.
-- ====================================================================

UPDATE usuarios
SET situacao_cautela = 'apto'
WHERE situacao_cautela = 'pendente_devolucao'
  AND matricula NOT IN (
    SELECT DISTINCT matricula_policial
    FROM cautelas
    WHERE (deletado_em IS NULL)
      AND LOWER(TRIM(status_cautela)) IN ('ativa', 'atrasada', 'prorrogada')
  );
