-- 1. Garante que as colunas existem na tabela usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS tentativas_login INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bloqueado_ate TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Função SECURITY DEFINER para registrar falha de login de forma segura (ignora RLS)
CREATE OR REPLACE FUNCTION registrar_tentativa_login_falha(p_matricula text)
RETURNS jsonb
SECURITY DEFINER
AS $$
DECLARE
  v_tentativas int;
  v_bloqueado_ate timestamp with time zone;
  v_user_exists boolean;
BEGIN
  -- Normaliza a matrícula
  p_matricula := upper(trim(p_matricula));

  -- Verificar se o usuário existe e não está deletado
  SELECT EXISTS(SELECT 1 FROM usuarios WHERE upper(trim(matricula)) = p_matricula AND deletado_em IS NULL) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Militar não cadastrado.');
  END IF;

  -- Incrementar tentativas e calcular bloqueio temporário
  UPDATE usuarios
  SET 
    tentativas_login = COALESCE(tentativas_login, 0) + 1,
    bloqueado_ate = CASE WHEN COALESCE(tentativas_login, 0) + 1 >= 3 THEN now() + interval '5 minutes' ELSE NULL END
  WHERE upper(trim(matricula)) = p_matricula
  RETURNING tentativas_login, bloqueado_ate INTO v_tentativas, v_bloqueado_ate;

  RETURN jsonb_build_object(
    'success', true, 
    'tentativas', v_tentativas, 
    'bloqueado_ate', v_bloqueado_ate
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Função SECURITY DEFINER para resetar as tentativas após login correto (ignora RLS)
CREATE OR REPLACE FUNCTION resetar_tentativas_login(p_matricula text)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  UPDATE usuarios
  SET tentativas_login = 0, bloqueado_ate = NULL
  WHERE upper(trim(matricula)) = upper(trim(p_matricula));
END;
$$ LANGUAGE plpgsql;
