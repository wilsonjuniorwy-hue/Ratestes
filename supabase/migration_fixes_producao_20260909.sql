-- ==============================================================================
-- MIGRAÇÃO DE CORREÇÃO: INTEGRALIDADE, CONCORRÊNCIA E CONTROLE DE ESTOQUE
-- Data: 2026-09-09
-- Autor: Wagner Torres / Antigravity
-- ==============================================================================
-- INSTRUÇÕES DE EXECUÇÃO EM PRODUÇÃO:
-- 1. Execute primeiro o BLOCO 1 (Backup) e verifique os totais retornados.
-- 2. Execute o BLOCO 2 (Diagnóstico) para auditoria prévia.
-- 3. Execute o BLOCO 3 (Procedures e Permissões) - 100% não-destrutivo.
-- 4. O BLOCO 4 (Correção Opcional de Militares) só deve ser rodado após validar o Bloco 3.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- BLOCO 1: BACKUP PREVENTIVO NÃO-DESTRUTIVO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cautelas_backup_20260909 AS SELECT * FROM cautelas;
CREATE TABLE IF NOT EXISTS cautela_itens_backup_20260909 AS SELECT * FROM cautela_itens;
CREATE TABLE IF NOT EXISTS materiais_backup_20260909 AS SELECT * FROM materiais;
CREATE TABLE IF NOT EXISTS usuarios_backup_20260909 AS SELECT * FROM usuarios;

SELECT 
  (SELECT count(*) FROM cautelas_backup_20260909) AS total_cautelas_salvas,
  (SELECT count(*) FROM cautela_itens_backup_20260909) AS total_itens_salvos,
  (SELECT count(*) FROM materiais_backup_20260909) AS total_materiais_salvos,
  (SELECT count(*) FROM usuarios_backup_20260909) AS total_usuarios_salvos;

-- ------------------------------------------------------------------------------
-- BLOCO 2: CONSULTAS DE DIAGNÓSTICO (SOMENTE LEITURA)
-- ------------------------------------------------------------------------------
-- 2.1 Cautelas com itens já devolvidos mas com status aberto:
SELECT 
  c.id_cautela,
  c.matricula_policial,
  c.status_cautela,
  ci.id_cautela_item,
  ci.id_material,
  ci.quantidade,
  ci.estado_devolucao,
  ci.consumido
FROM cautelas c
JOIN cautela_itens ci ON ci.id_cautela = c.id_cautela
WHERE c.status_cautela IN ('ativa', 'prorrogada', 'atrasada')
  AND ci.estado_devolucao IS NOT NULL;

-- 2.2 Militares presos como 'pendente_devolucao' sem cautelas ativas:
SELECT u.matricula, u.nome, u.posto_graduacao, u.situacao_cautela
FROM usuarios u
WHERE u.situacao_cautela = 'pendente_devolucao'
  AND NOT EXISTS (
    SELECT 1 FROM cautelas c
    WHERE c.matricula_policial = u.matricula
      AND c.status_cautela IN ('ativa', 'prorrogada', 'atrasada')
  );

-- ------------------------------------------------------------------------------
-- BLOCO 3: PROCEDURES CORRIGIDAS E PERMISSÕES (ATÔMICO E SEGURO)
-- ------------------------------------------------------------------------------

-- Item 1 & 3: fn_realizar_devolucao com UPSERT e exclusão de 'permanente'
CREATE OR REPLACE FUNCTION fn_realizar_devolucao(
  p_id_cautela text,
  p_matricula_armeiro text,
  p_status_cautela text,
  p_data_devolucao_efetiva timestamptz,
  p_observacoes_devolucao text,
  p_itens_devolvidos jsonb
) RETURNS jsonb AS $$
DECLARE
  v_cautela record;
  v_item_devolvido jsonb;
  v_material record;
  v_qty_item integer;
  v_outras_cautelas_ativas integer;
  v_estado_entrega text;
BEGIN
  -- 1. Carregar cautela
  SELECT * INTO v_cautela FROM cautelas WHERE id_cautela = p_id_cautela;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cautela % não encontrada.', p_id_cautela;
  END IF;

  -- 2. Atualizar cabeçalho da cautela
  UPDATE cautelas SET
    status_cautela = p_status_cautela,
    data_devolucao_efetiva = p_data_devolucao_efetiva,
    matricula_armeiro_devolucao = p_matricula_armeiro,
    observacoes_devolucao = COALESCE(p_observacoes_devolucao, observacoes_devolucao)
  WHERE id_cautela = p_id_cautela;

  -- 3. Processar cada item via UPSERT (garante gravação dos desdobramentos de lote ITEM-DEV e ITEM-CONS)
  FOR v_item_devolvido IN SELECT * FROM jsonb_array_elements(p_itens_devolvidos)
  LOOP
    v_qty_item := COALESCE((v_item_devolvido->>'quantidade')::integer, 1);
    v_estado_entrega := COALESCE(v_item_devolvido->>'estado_entrega', 'excelente');

    INSERT INTO cautela_itens (
      id_cautela_item,
      id_cautela,
      id_material,
      quantidade,
      estado_entrega,
      estado_devolucao,
      consumido,
      quantidade_carregadores,
      id_quartel,
      criado_em
    ) VALUES (
      v_item_devolvido->>'id_cautela_item',
      p_id_cautela,
      v_item_devolvido->>'id_material',
      v_qty_item,
      v_estado_entrega,
      v_item_devolvido->>'estado_devolucao',
      COALESCE((v_item_devolvido->>'consumido')::boolean, false),
      COALESCE((v_item_devolvido->>'quantidade_carregadores')::integer, 0),
      v_cautela.id_quartel,
      now()
    )
    ON CONFLICT (id_cautela_item) DO UPDATE SET
      quantidade = EXCLUDED.quantidade,
      estado_devolucao = EXCLUDED.estado_devolucao,
      consumido = EXCLUDED.consumido;

    -- Atualizar status e saldo do material no estoque
    SELECT * INTO v_material FROM materiais WHERE id_material = (v_item_devolvido->>'id_material');
    IF FOUND THEN
      IF v_material.controle_quantidade THEN
        IF COALESCE((v_item_devolvido->>'consumido')::boolean, false) THEN
          UPDATE materiais 
          SET quantidade = GREATEST(0, quantidade - v_qty_item) 
          WHERE id_material = v_material.id_material;
        END IF;
      ELSE
        IF v_item_devolvido->>'estado_devolucao' IS NOT NULL THEN
          UPDATE materiais SET status_atual = 'disponivel' WHERE id_material = v_material.id_material;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- 4. Reabilitar militar se não possuir outras cautelas diárias ativas
  -- (Exclui 'permanente', 'devolvida' e 'cancelada')
  SELECT COUNT(*) INTO v_outras_cautelas_ativas 
  FROM cautelas 
  WHERE matricula_policial = v_cautela.matricula_policial 
    AND id_cautela <> p_id_cautela 
    AND status_cautela NOT IN ('devolvida', 'cancelada', 'permanente');

  IF v_outras_cautelas_ativas = 0 THEN
    UPDATE usuarios SET situacao_cautela = 'apto' WHERE matricula = v_cautela.matricula_policial;
  END IF;

  RETURN jsonb_build_object('success', true, 'id_cautela', p_id_cautela);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Item 2: fn_efetivar_cautela com trava pessimista FOR UPDATE
CREATE OR REPLACE FUNCTION fn_efetivar_cautela(
  p_cautela jsonb,
  p_itens jsonb
) RETURNS jsonb AS $$
DECLARE
  v_item jsonb;
  v_material record;
  v_policial record;
  v_qty_solicitada integer;
  v_active_cautelado integer;
  v_disponivel integer;
BEGIN
  -- 1. Validar registro do policial
  SELECT * INTO v_policial 
  FROM usuarios 
  WHERE matricula = (p_cautela->>'matricula_policial') 
    AND deletado_em IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Policial com matrícula % não encontrado ou desativado.', (p_cautela->>'matricula_policial');
  END IF;

  IF v_policial.situacao_cautela IN ('suspenso', 'restrito_servico') THEN
    RAISE EXCEPTION 'Policial está em situação % e não pode realizar acautelamento.', v_policial.situacao_cautela;
  END IF;

  -- 2. Inserir Cabeçalho da Cautela
  INSERT INTO cautelas (
    id_cautela,
    matricula_policial,
    matricula_armeiro_retirada,
    data_retirada,
    previsao_devolucao,
    status_cautela,
    observacoes_retirada,
    id_quartel,
    is_emergencial,
    motivo_emergencial
  ) VALUES (
    p_cautela->>'id_cautela',
    p_cautela->>'matricula_policial',
    p_cautela->>'matricula_armeiro_retirada',
    (p_cautela->>'data_retirada')::timestamptz,
    (p_cautela->>'previsao_devolucao')::timestamptz,
    p_cautela->>'status_cautela',
    p_cautela->>'observacoes_retirada',
    NULLIF(p_cautela->>'id_quartel', '')::uuid,
    COALESCE((p_cautela->>'is_emergencial')::boolean, false),
    p_cautela->>'motivo_emergencial'
  );

  -- 3. Processar cada item com TRAVA DE LINHA (FOR UPDATE)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    v_qty_solicitada := COALESCE((v_item->>'quantidade')::integer, 1);

    -- Trava exclusiva de linha do material
    SELECT * INTO v_material 
    FROM materiais 
    WHERE id_material = (v_item->>'id_material') 
      AND deletado_em IS NULL 
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Material % não encontrado.', (v_item->>'id_material');
    END IF;

    IF v_material.controle_quantidade THEN
      SELECT COALESCE(SUM(ci.quantidade), 0) INTO v_active_cautelado
      FROM cautela_itens ci
      JOIN cautelas c ON c.id_cautela = ci.id_cautela
      WHERE ci.id_material = v_material.id_material
        AND c.status_cautela IN ('ativa', 'atrasada', 'prorrogada')
        AND ci.estado_devolucao IS NULL;

      v_disponivel := COALESCE(v_material.quantidade, 0) - v_active_cautelado;

      IF v_disponivel < v_qty_solicitada THEN
        RAISE EXCEPTION 'Estoque insuficiente para % (disponível: %, solicitado: %).', v_material.modelo, v_disponivel, v_qty_solicitada;
      END IF;
    ELSE
      IF v_material.status_atual <> 'disponivel' THEN
        RAISE EXCEPTION 'Material % não está disponível (status atual: %).', v_material.id_material, v_material.status_atual;
      END IF;

      UPDATE materiais 
      SET status_atual = 'cautelado' 
      WHERE id_material = v_material.id_material;
    END IF;

    INSERT INTO cautela_itens (
      id_cautela_item,
      id_cautela,
      id_material,
      quantidade,
      estado_entrega,
      quantidade_carregadores,
      id_quartel,
      criado_em
    ) VALUES (
      v_item->>'id_cautela_item',
      v_item->>'id_cautela',
      v_item->>'id_material',
      v_qty_solicitada,
      COALESCE(v_item->>'estado_entrega', 'excelente'),
      (v_item->>'quantidade_carregadores')::integer,
      NULLIF(v_item->>'id_quartel', '')::uuid,
      now()
    );
  END LOOP;

  IF (p_cautela->>'status_cautela') <> 'permanente' THEN
    UPDATE usuarios 
    SET situacao_cautela = 'pendente_devolucao' 
    WHERE matricula = (p_cautela->>'matricula_policial');
  END IF;

  RETURN jsonb_build_object('success', true, 'id_cautela', p_cautela->>'id_cautela');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Item 6: fn_registrar_falha_login com SECURITY DEFINER
CREATE OR REPLACE FUNCTION fn_registrar_falha_login(p_matricula text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user record;
  v_novas_tentativas integer;
  v_bloqueio timestamptz := NULL;
  v_bloqueado boolean := false;
BEGIN
  SELECT * INTO v_user 
  FROM usuarios 
  WHERE (matricula = p_matricula OR nome_usuario ILIKE p_matricula) 
    AND deletado_em IS NULL 
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('encontrado', false);
  END IF;

  v_novas_tentativas := COALESCE(v_user.tentativas_login, 0) + 1;
  IF v_novas_tentativas >= 5 THEN
    v_bloqueio := now() + interval '15 minutes';
    v_bloqueado := true;
  END IF;

  UPDATE usuarios SET
    tentativas_login = v_novas_tentativas,
    bloqueado_ate = v_bloqueio
  WHERE matricula = v_user.matricula;

  RETURN jsonb_build_object(
    'encontrado', true,
    'tentativas', v_novas_tentativas,
    'bloqueado', v_bloqueado,
    'bloqueado_ate', v_bloqueio
  );
END;
$$;

-- Item 7: Concessão de permissões de execução
GRANT EXECUTE ON FUNCTION fn_realizar_devolucao(text, text, text, timestamptz, text, jsonb) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION fn_efetivar_cautela(jsonb, jsonb) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION fn_registrar_falha_login(text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION proximo_id_cautela() TO authenticated, anon, service_role;

-- ------------------------------------------------------------------------------
-- BLOCO 4: CORREÇÃO PONTUAL DE MILITARES PRESOS (OPCIONAL)
-- ------------------------------------------------------------------------------
-- Execute apenas após validar o Bloco 3:
/*
UPDATE usuarios u
SET situacao_cautela = 'apto'
WHERE u.situacao_cautela = 'pendente_devolucao'
  AND NOT EXISTS (
    SELECT 1 FROM cautelas c
    WHERE c.matricula_policial = u.matricula
      AND c.status_cautela IN ('ativa', 'prorrogada', 'atrasada')
  );
*/
