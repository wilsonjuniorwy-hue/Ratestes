-- ==============================================================================
-- MIGRAÇÃO: Índices de Alta Performance para Cautelas e Itens
-- Data: 2026-09-01
--
-- ATENÇÃO IMPORTANTE PARA EXECUÇÃO NO SUPABASE:
-- O comando 'CREATE INDEX CONCURRENTLY' constrói o índice sem bloquear
-- inserções ou atualizações na tabela em produção, MAS NÃO PODE rodar dentro
-- de um bloco de transação implícito.
--
-- POR FAVOR, EXECUTE CADA UM DOS 4 BLOCOS ABAIXO SEPARADAMENTE NO SQL EDITOR
-- (Selecione um bloco por vez e clique no botão 'Run' individualmente).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- BLOCO 1: Índice composto para cálculo instantâneo de itens acautelados ativos
-- Acelera a consulta de contagem e verificação de estoque em lote na procedure fn_efetivar_cautela
-- ------------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cautela_itens_material_devolucao 
ON cautela_itens (id_material, estado_devolucao);

-- ------------------------------------------------------------------------------
-- BLOCO 2: Índice cobrindo a chave estrangeira da cautela
-- Acelera o JOIN entre cautela_itens e cautelas
-- ------------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cautela_itens_id_cautela 
ON cautela_itens (id_cautela);

-- ------------------------------------------------------------------------------
-- BLOCO 3: Índice parcial nas cautelas ativas/atrasadas/prorrogadas
-- Reduz o escopo de busca em cautelas apenas para os registros atualmente em aberto
-- ------------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cautelas_status_ativas 
ON cautelas (id_cautela, status_cautela) 
WHERE status_cautela IN ('ativa', 'atrasada', 'prorrogada');

-- ------------------------------------------------------------------------------
-- BLOCO 4: Índice para conferência rápida de situação do policial
-- Acelera a checagem se o policial já possui cautelas ativas pendentes de devolução
-- ------------------------------------------------------------------------------
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cautelas_policial 
ON cautelas (matricula_policial, status_cautela);
