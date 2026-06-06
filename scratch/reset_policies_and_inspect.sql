-- ====================================================================
-- SCRIPT DE AJUSTE E INSPEÇÃO DE POLÍTICAS (STAGING / HOMOLOGACAO)
-- Execute este script completo no SQL Editor do seu projeto Supabase
-- correspondente ao ambiente de STAGING/HOMOLOGACAO.
-- ====================================================================

-- 1. Resetar as políticas da tabela 'quarteis'
ALTER TABLE quarteis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quarteis_select" ON quarteis;
CREATE POLICY "quarteis_select" ON quarteis FOR SELECT USING (deletado_em IS NULL);

DROP POLICY IF EXISTS "quarteis_insert" ON quarteis;
CREATE POLICY "quarteis_insert" ON quarteis FOR INSERT WITH CHECK (get_meu_perfil() = 'admin');

DROP POLICY IF EXISTS "quarteis_update" ON quarteis;
CREATE POLICY "quarteis_update" ON quarteis FOR UPDATE USING (get_meu_perfil() = 'admin');

-- 2. Resetar as políticas da tabela 'dispositivos_autorizados'
ALTER TABLE dispositivos_autorizados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dispositivos_admin_all" ON dispositivos_autorizados;
CREATE POLICY "dispositivos_admin_all" ON dispositivos_autorizados FOR ALL USING (
  get_meu_perfil() = 'admin'
);

DROP POLICY IF EXISTS "dispositivos_insert_anon" ON dispositivos_autorizados;
CREATE POLICY "dispositivos_insert_anon" ON dispositivos_autorizados FOR INSERT WITH CHECK (
  status = 'pendente'
);

-- 3. Registrar o dispositivo de desenvolvimento caso ainda não esteja lá
INSERT INTO dispositivos_autorizados (uuid_hardware, nome_dispositivo, status)
VALUES ('DEVELOPMENT-TEST-DEVICE', 'Navegador de Teste Local', 'ativo')
ON CONFLICT (uuid_hardware) DO UPDATE SET status = 'ativo';

-- 4. Criar função de inspeção de políticas
CREATE OR REPLACE FUNCTION public.inspect_policies()
RETURNS TABLE (
  schemaname text,
  tablename text,
  policyname text,
  permissive text,
  roles text[],
  cmd text,
  qual text,
  with_check text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.schemaname::text,
    p.tablename::text,
    p.policyname::text,
    p.permissive::text,
    p.roles::text[],
    p.cmd::text,
    p.qual::text,
    p.with_check::text
  FROM pg_policies p
  WHERE p.schemaname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
