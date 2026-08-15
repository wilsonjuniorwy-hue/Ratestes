-- ==============================================================================
-- MIGRAÇÃO: Geração Atômica e Sequencial de IDs de Cautela (cautela_id_seq)
-- Evita colisões de chaves primárias (cautelas_pkey) e garante identificadores legíveis
-- ==============================================================================

-- 1. Criar a sequência para o contador de cautelas (se não existir)
CREATE SEQUENCE IF NOT EXISTS cautela_id_seq START WITH 1;

-- 2. Ajustar a sequência para o maior número legado existente sem pular o próximo número
SELECT setval('cautela_id_seq', COALESCE((
  SELECT MAX(CAST(SUBSTRING(id_cautela FROM 'CAUT-([0-9]+)-') AS INTEGER)) 
  FROM cautelas 
  WHERE id_cautela ~ '^CAUT-[0-9]+-'
), 1), false);

-- 3. Criar a função RPC com SECURITY DEFINER e search_path seguro
CREATE OR REPLACE FUNCTION proximo_id_cautela()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_val INT;
  ano TEXT := TO_CHAR(CURRENT_DATE, 'YYYY');
BEGIN
  SELECT nextval('cautela_id_seq') INTO seq_val;
  RETURN 'CAUT-' || LPAD(seq_val::TEXT, 5, '0') || '-' || ano;
END;
$$;

-- 4. CONCESSÃO DE PERMISSÕES (Restrito a usuários autenticados e service_role)
REVOKE ALL ON FUNCTION proximo_id_cautela() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION proximo_id_cautela() TO authenticated;
GRANT EXECUTE ON FUNCTION proximo_id_cautela() TO service_role;
