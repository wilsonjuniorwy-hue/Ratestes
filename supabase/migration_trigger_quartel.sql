-- ============================================================
-- MIGRATION: Trigger de Preenchimento Automático do id_quartel
-- Data: 2026-08-06
-- Descrição: Preenche id_quartel automaticamente com get_meu_quartel()
--            caso a inserção venha sem id_quartel (NULL).
-- ============================================================

-- 1. Função Central de Proteção
CREATE OR REPLACE FUNCTION set_id_quartel_default()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id_quartel IS NULL THEN
    NEW.id_quartel := get_meu_quartel();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Triggers amarradas nas 7 tabelas com suporte a multi-quartel

DROP TRIGGER IF EXISTS trg_cautelas_id_quartel ON cautelas;
CREATE TRIGGER trg_cautelas_id_quartel BEFORE INSERT ON cautelas
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_cautela_itens_id_quartel ON cautela_itens;
CREATE TRIGGER trg_cautela_itens_id_quartel BEFORE INSERT ON cautela_itens
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_materiais_id_quartel ON materiais;
CREATE TRIGGER trg_materiais_id_quartel BEFORE INSERT ON materiais
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_ocorrencias_id_quartel ON ocorrencias;
CREATE TRIGGER trg_ocorrencias_id_quartel BEFORE INSERT ON ocorrencias
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_armas_particulares_id_quartel ON armas_particulares;
CREATE TRIGGER trg_armas_particulares_id_quartel BEFORE INSERT ON armas_particulares
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_pendencias_servico_id_quartel ON pendencias_servico;
CREATE TRIGGER trg_pendencias_servico_id_quartel BEFORE INSERT ON pendencias_servico
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_auditoria_logs_id_quartel ON auditoria_logs;
CREATE TRIGGER trg_auditoria_logs_id_quartel BEFORE INSERT ON auditoria_logs
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

DROP TRIGGER IF EXISTS trg_usuarios_id_quartel ON usuarios;
CREATE TRIGGER trg_usuarios_id_quartel BEFORE INSERT ON usuarios
FOR EACH ROW EXECUTE FUNCTION set_id_quartel_default();

