-- ============================================================
-- MIGRAÇÃO COMPLETA: Colunas Faltantes + Procedures RPC Atômicas
-- Data: 2026-08-08
-- Execute este script inteiro no SQL Editor do Supabase (Staging / Production)
-- ============================================================

-- ------------------------------------------------------------
-- PASSO 1: ADICIONAR COLUNAS FALTANTES (SE NÃO EXISTIREM)
-- ------------------------------------------------------------
ALTER TABLE usuarios 
  ADD COLUMN IF NOT EXISTS tentativas_login INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bloqueado_ate TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nome_usuario TEXT;

ALTER TABLE cautelas 
  ADD COLUMN IF NOT EXISTS is_emergencial BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS motivo_emergencial TEXT;

-- ------------------------------------------------------------
-- PASSO 2: RPC PARA EFETIVAR CAUTELA ATÔMICA
-- ------------------------------------------------------------
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
  -- Validar registro do policial
  SELECT * INTO v_policial FROM usuarios WHERE matricula = (p_cautela->>'matricula_policial') AND deletado_em IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Policial com matrícula % não encontrado ou desativado.', (p_cautela->>'matricula_policial');
  END IF;

  IF v_policial.situacao_cautela = 'suspenso' OR v_policial.situacao_cautela = 'restrito_servico' THEN
    RAISE EXCEPTION 'Policial está em situação % e não pode realizar acautelamento.', v_policial.situacao_cautela;
  END IF;

  -- Inserir Cautela
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
    (p_cautela->>'id_quartel')::uuid,
    COALESCE((p_cautela->>'is_emergencial')::boolean, false),
    p_cautela->>'motivo_emergencial'
  );

  -- Processar cada item da cautela
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itens)
  LOOP
    v_qty_solicitada := COALESCE((v_item->>'quantidade')::integer, 1);

    SELECT * INTO v_material FROM materiais WHERE id_material = (v_item->>'id_material') AND deletado_em IS NULL;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Material % não encontrado.', (v_item->>'id_material');
    END IF;

    IF v_material.controle_quantidade THEN
      -- Validar quantidade disponível (Total cadastrado menos a soma das cautelas ativas não devolvidas)
      SELECT COALESCE(SUM(ci.quantidade), 0) INTO v_active_cautelado
      FROM cautela_itens ci
      JOIN cautelas c ON c.id_cautela = ci.id_cautela
      WHERE ci.id_material = v_material.id_material
        AND c.status_cautela IN ('ativa', 'atrasada', 'prorrogada')
        AND ci.estado_devolucao IS NULL;

      v_disponivel := COALESCE(v_material.quantidade, 0) - v_active_cautelado;

      IF v_disponivel < v_qty_solicitada THEN
        RAISE EXCEPTION 'Estoque insuficiente para o material % (disponível na reserva: %, solicitado: %).', v_material.modelo, v_disponivel, v_qty_solicitada;
      END IF;

      -- Não decrementa materiais.quantidade: a carga total permanece invariante e os itens na rua são rastreados por cautela_itens.
    ELSE
      IF v_material.status_atual <> 'disponivel' THEN
        RAISE EXCEPTION 'Material % não está disponível para acautelamento (status atual: %).', v_material.id_material, v_material.status_atual;
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
      id_quartel
    ) VALUES (
      v_item->>'id_cautela_item',
      v_item->>'id_cautela',
      v_item->>'id_material',
      v_qty_solicitada,
      v_item->>'estado_entrega',
      (v_item->>'quantidade_carregadores')::integer,
      (v_item->>'id_quartel')::uuid
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

-- ------------------------------------------------------------
-- PASSO 3: RPC PARA REALIZAR DEVOLUÇÃO ATÔMICA
-- ------------------------------------------------------------
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
  v_qty_devolvida integer;
  v_outras_cautelas_ativas integer;
BEGIN
  -- Carregar cautela
  SELECT * INTO v_cautela FROM cautelas WHERE id_cautela = p_id_cautela;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cautela % não encontrada.', p_id_cautela;
  END IF;

  -- Atualizar status da Cautela
  UPDATE cautelas SET
    status_cautela = p_status_cautela,
    data_devolucao_efetiva = p_data_devolucao_efetiva,
    matricula_armeiro_devolucao = p_matricula_armeiro,
    observacoes_devolucao = COALESCE(p_observacoes_devolucao, observacoes_devolucao)
  WHERE id_cautela = p_id_cautela;

  -- Atualizar cada item devolvido e devolver ao estoque
  FOR v_item_devolvido IN SELECT * FROM jsonb_array_elements(p_itens_devolvidos)
  LOOP
    v_qty_devolvida := COALESCE((v_item_devolvido->>'quantidade')::integer, 1);

    UPDATE cautela_itens SET
      estado_devolucao = (v_item_devolvido->>'estado_devolucao'),
      consumido = COALESCE((v_item_devolvido->>'consumido')::boolean, false)
    WHERE id_cautela_item = (v_item_devolvido->>'id_cautela_item');

    SELECT * INTO v_material FROM materiais WHERE id_material = (v_item_devolvido->>'id_material');
    IF FOUND THEN
      IF v_material.controle_quantidade THEN
        -- Se o item foi consumido em serviço (ex: disparos efetuados), deduzimos permanentemente da carga total
        -- Se foi apenas devolvido intacto, não alteramos materiais.quantidade (pois a carga total nunca foi reduzida na saída)
        IF COALESCE((v_item_devolvido->>'consumido')::boolean, false) THEN
          UPDATE materiais SET quantidade = GREATEST(0, quantidade - v_qty_devolvida) WHERE id_material = v_material.id_material;
        END IF;
      ELSE
        UPDATE materiais SET status_atual = 'disponivel' WHERE id_material = v_material.id_material;
      END IF;
    END IF;
  END LOOP;

  -- Verificar se o policial possui outras cautelas ativas
  SELECT COUNT(*) INTO v_outras_cautelas_ativas 
  FROM cautelas 
  WHERE matricula_policial = v_cautela.matricula_policial 
    AND id_cautela <> p_id_cautela 
    AND status_cautela NOT IN ('devolvida', 'cancelada');

  IF v_outras_cautelas_ativas = 0 THEN
    UPDATE usuarios SET situacao_cautela = 'apto' WHERE matricula = v_cautela.matricula_policial;
  END IF;

  RETURN jsonb_build_object('success', true, 'id_cautela', p_id_cautela);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------
-- PASSO 4: PERMISSÕES DE EXECUÇÃO RESTRITAS (GRANT EXECUTE)
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION fn_efetivar_cautela(jsonb, jsonb) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION fn_realizar_devolucao(text, text, text, timestamptz, text, jsonb) TO authenticated, anon;
