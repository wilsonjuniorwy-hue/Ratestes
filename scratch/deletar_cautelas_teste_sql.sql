-- ====================================================================
-- SCRIPT DE REMOÇÃO DE CAUTELAS DE TESTE (RESPETANDO CHAVES ESTRANGEIRAS)
-- Execute este script no SQL Editor do Supabase
-- ====================================================================

-- 1. Deletar primeiro os itens das cautelas de teste (evita erro FK 23503)
DELETE FROM cautela_itens
WHERE id_cautela IN ('CAUT-TEST-3335', 'CAUT-TEST-CLEAN-5517', 'CAUT-TEST-1719')
   OR id_cautela LIKE 'CAUT-TEST-%';

-- 2. Deletar as cautelas de teste da tabela principal
DELETE FROM cautelas
WHERE id_cautela IN ('CAUT-TEST-3335', 'CAUT-TEST-CLEAN-5517', 'CAUT-TEST-1719')
   OR id_cautela LIKE 'CAUT-TEST-%';
