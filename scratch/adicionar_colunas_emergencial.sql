-- ====================================================================
-- SCRIPT DE ADIÇÃO DE COLUNAS DE EMERGÊNCIA NA TABELA CAUTELAS
-- Execute este script no SQL Editor do Supabase para garantir que
-- cautelas de emergência (sem senha) gravem o motivo nativamente.
-- ====================================================================

ALTER TABLE cautelas
  ADD COLUMN IF NOT EXISTS is_emergencial BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS motivo_emergencial TEXT;
