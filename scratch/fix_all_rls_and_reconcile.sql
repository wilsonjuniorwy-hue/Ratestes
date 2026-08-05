-- ====================================================================
-- SCRIPT COMPLETO DE CORREÇÃO DE RLS E RECONCILIAÇÃO DE USUÁRIOS
-- Execute este script no SQL Editor do seu projeto Supabase
-- ====================================================================

-- 1. CORRIGIR POLÍTICAS RLS DA TABELA USUARIOS (Permite UPDATE por dispositivos autorizados)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
CREATE POLICY "usuarios_select" ON usuarios FOR SELECT USING (
  deletado_em IS NULL AND (
    is_current_device_authorized()
    OR get_meu_perfil() = 'admin'
    OR id_quartel = get_meu_quartel()
    OR matricula = get_minha_matricula()
  )
);

DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
CREATE POLICY "usuarios_insert" ON usuarios FOR INSERT WITH CHECK (
  is_current_device_authorized()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

DROP POLICY IF EXISTS "usuarios_update" ON usuarios;
CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE USING (
  is_current_device_authorized()
  OR matricula = get_minha_matricula()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

-- 2. CORRIGIR POLÍTICAS RLS DA TABELA CAUTELAS
ALTER TABLE cautelas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cautelas_select" ON cautelas;
CREATE POLICY "cautelas_select" ON cautelas FOR SELECT USING (
  deletado_em IS NULL AND (
    is_current_device_authorized()
    OR get_meu_perfil() = 'admin'
    OR id_quartel = get_meu_quartel()
    OR id_quartel IS NULL
  )
);

DROP POLICY IF EXISTS "cautelas_insert" ON cautelas;
CREATE POLICY "cautelas_insert" ON cautelas FOR INSERT WITH CHECK (
  is_current_device_authorized()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

DROP POLICY IF EXISTS "cautelas_update" ON cautelas;
CREATE POLICY "cautelas_update" ON cautelas FOR UPDATE USING (
  is_current_device_authorized()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

-- 3. CORRIGIR POLÍTICAS RLS DA TABELA CAUTELA_ITENS
ALTER TABLE cautela_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cautela_itens_select" ON cautela_itens;
CREATE POLICY "cautela_itens_select" ON cautela_itens FOR SELECT USING (
  deletado_em IS NULL AND (
    is_current_device_authorized()
    OR get_meu_perfil() = 'admin'
    OR id_quartel = get_meu_quartel()
    OR id_quartel IS NULL
  )
);

DROP POLICY IF EXISTS "cautela_itens_insert" ON cautela_itens;
CREATE POLICY "cautela_itens_insert" ON cautela_itens FOR INSERT WITH CHECK (
  is_current_device_authorized()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

DROP POLICY IF EXISTS "cautela_itens_update" ON cautela_itens;
CREATE POLICY "cautela_itens_update" ON cautela_itens FOR UPDATE USING (
  is_current_device_authorized()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

-- 4. CORRIGIR POLÍTICAS RLS DA TABELA MATERIAIS
ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "materiais_select" ON materiais;
CREATE POLICY "materiais_select" ON materiais FOR SELECT USING (
  deletado_em IS NULL AND (
    is_current_device_authorized()
    OR get_meu_perfil() = 'admin'
    OR id_quartel = get_meu_quartel()
    OR id_quartel IS NULL
  )
);

DROP POLICY IF EXISTS "materiais_insert" ON materiais;
CREATE POLICY "materiais_insert" ON materiais FOR INSERT WITH CHECK (
  is_current_device_authorized()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

DROP POLICY IF EXISTS "materiais_update" ON materiais;
CREATE POLICY "materiais_update" ON materiais FOR UPDATE USING (
  is_current_device_authorized()
  OR get_meu_perfil() IN ('admin', 'armeiro_gestor')
);

-- 5. RECONCILIAR MILITARES QUE FICARAM PRESO EM 'PENDENTE_DEVOLUCAO' SEM CAUTELAS ATIVAS
UPDATE usuarios
SET situacao_cautela = 'apto'
WHERE situacao_cautela = 'pendente_devolucao'
  AND matricula NOT IN (
    SELECT DISTINCT matricula_policial
    FROM cautelas
    WHERE (deletado_em IS NULL)
      AND LOWER(TRIM(status_cautela)) IN ('ativa', 'atrasada', 'prorrogada')
  );
