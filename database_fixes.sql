-- ====================================================================
-- SCRIPT DE MIGRACAO / AJUSTE DE SEGURANCA (STAGING / HOMOLOGACAO)
-- Execute este script completo no SQL Editor do seu projeto Supabase
-- correspondente ao ambiente de STAGING/HOMOLOGACAO.
-- ====================================================================

-- 1. Atualizar a função get_meu_perfil() com fallback para o e-mail do JWT
CREATE OR REPLACE FUNCTION get_meu_perfil()
RETURNS TEXT AS $$
DECLARE
  v_perfil TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- 1ª tentativa: buscar pelo auth_user_id direto
  SELECT perfil INTO v_perfil FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1;
  
  -- 2ª tentativa (bootstrap): buscar pela matrícula no prefixo do e-mail do JWT
  IF v_perfil IS NULL THEN
    SELECT perfil INTO v_perfil FROM usuarios 
    WHERE matricula = upper(split_part(auth.jwt() ->> 'email', '@', 1)) LIMIT 1;
  END IF;
  
  RETURN v_perfil;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Atualizar a função get_meu_quartel() com o mesmo fallback
CREATE OR REPLACE FUNCTION get_meu_quartel()
RETURNS UUID AS $$
DECLARE
  v_quartel_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- 1ª tentativa: buscar pelo auth_user_id direto
  SELECT id_quartel INTO v_quartel_id FROM usuarios WHERE auth_user_id = auth.uid() LIMIT 1;
  
  -- 2ª tentativa (bootstrap): buscar pela matrícula no prefixo do e-mail do JWT
  IF v_quartel_id IS NULL THEN
    SELECT id_quartel INTO v_quartel_id FROM usuarios 
    WHERE matricula = upper(split_part(auth.jwt() ->> 'email', '@', 1)) LIMIT 1;
  END IF;
  
  RETURN v_quartel_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. Reescrever verificar_dispositivo() de forma determinística e livre de duplicatas
CREATE OR REPLACE FUNCTION verificar_dispositivo(p_uuid TEXT)
RETURNS TABLE (existe BOOLEAN, status TEXT) AS $$
  -- Retorna a linha se existir
  SELECT 
    TRUE as existe,
    status
  FROM dispositivos_autorizados
  WHERE uuid_hardware = p_uuid
  UNION ALL
  -- Retorna inexistente se não existir na tabela
  SELECT 
    FALSE as existe,
    'inexistente'::TEXT as status
  WHERE NOT EXISTS (
    SELECT 1 FROM dispositivos_autorizados WHERE uuid_hardware = p_uuid
  )
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Registrar o dispositivo simulado de desenvolvimento no navegador
INSERT INTO dispositivos_autorizados (uuid_hardware, nome_dispositivo, status)
VALUES ('DEVELOPMENT-TEST-DEVICE', 'Navegador de Teste Local', 'ativo')
ON CONFLICT (uuid_hardware) DO UPDATE SET status = 'ativo';

-- 5. Helper de depuração para analisar a sessão ativa
CREATE OR REPLACE FUNCTION check_my_session()
RETURNS TABLE (
  session_uid UUID,
  jwt_email TEXT,
  jwt_perfil TEXT,
  meu_perfil TEXT,
  minha_matricula TEXT
) AS $$
  SELECT 
    auth.uid(),
    auth.jwt() ->> 'email',
    auth.jwt() ->> 'perfil',
    get_meu_perfil(),
    get_minha_matricula();
$$ LANGUAGE sql STABLE;
