/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Usuario, Categoria, Material, Cautela, CautelaItem, 
  AuditoriaLog, OcorrenciaRelatorio, SituacaoMilitar, 
  StatusMaterial, CondicaoUso 
} from '../types';
import { 
  mockUsuarios, mockCategorias, mockMateriais, 
  mockCautelas, mockCautelaItens, mockAuditoriaLogs, 
  mockOcorrencias 
} from '../mockData';

const defaultModelosArmas = [
  { modelo: 'Pistola CZ - P10', calibre: '9mm' },
  { modelo: 'Fuzil Imbel IA2 5.56', calibre: '5.56mm' },
  { modelo: 'Espingarda Calibre 12', calibre: '12' }
];

export function useSupabaseDatabase(activeArmeiroMatricula?: string) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [cautelaItens, setCautelaItens] = useState<CautelaItem[]>([]);
  const [auditoriaLogs, setAuditoriaLogs] = useState<AuditoriaLog[]>([]);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaRelatorio[]>([]);
  const [modelosArmas, setModelosArmas] = useState<Array<{ modelo: string; calibre: string }>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // ---- BUSCAR DADOS DO SUPABASE AO INICIAR ----
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setDbError(null);

      const [
        { data: users, error: errUsers },
        { data: materials, error: errMaterials },
        { data: categories, error: errCategories },
        { data: cautelasData, error: errCautelas },
        { data: items, error: errItems },
        { data: logs, error: errLogs },
        { data: ocos, error: errOcos },
        { data: models, error: errModels }
      ] = await Promise.all([
        supabase.from('usuarios').select('*'),
        supabase.from('materiais').select('*'),
        supabase.from('categorias').select('*'),
        supabase.from('cautelas').select('*'),
        supabase.from('cautela_itens').select('*'),
        supabase.from('auditoria_logs').select('*').order('data_hora', { ascending: false }),
        supabase.from('ocorrencias').select('*').order('data_hora', { ascending: false }),
        supabase.from('modelos_armas').select('*')
      ]);

      if (errUsers) throw errUsers;
      if (errMaterials) throw errMaterials;
      if (errCategories) throw errCategories;
      if (errCautelas) throw errCautelas;
      if (errItems) throw errItems;
      if (errLogs) throw errLogs;
      if (errOcos) throw errOcos;
      if (errModels) throw errModels;

      setUsuarios(users || []);
      setMateriais(materials || []);
      setCategorias(categories || []);
      setCautelas(cautelasData || []);
      setCautelaItens(items || []);
      setAuditoriaLogs(logs || []);
      setOcorrencias(ocos || []);
      setModelosArmas(models || []);
    } catch (error: any) {
      console.error('Erro ao buscar dados do Supabase:', error);
      setDbError(error.message || 'Erro de conexão com o Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---- TRIGGERS DE LOG DE AUDITORIA ----
  const registrarLogAuditoria = (executor: string, tipo: AuditoriaLog['tipo_evento'], detalhes: string) => {
    const novoLog: AuditoriaLog = {
      id_log: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
      data_hora: new Date().toISOString(),
      matricula_executor: executor,
      tipo_evento: tipo,
      detalhes: detalhes
    };

    // Update local state instantly
    setAuditoriaLogs(prev => [novoLog, ...prev]);

    // Update Supabase in background
    supabase.from('auditoria_logs').insert(novoLog).then(({ error }) => {
      if (error) console.error('Erro ao sincronizar auditoria_logs:', error);
    });
  };

  // ---- RESETAR BANCO DE DADOS PARA ESTADO INICIAL ----
  const resetDatabase = async () => {
    try {
      setIsLoading(true);

      // 1. Limpar todas as tabelas em ordem reversa de chaves estrangeiras
      await supabase.from('cautela_itens').delete().neq('id_cautela_item', '');
      await supabase.from('cautelas').delete().neq('id_cautela', '');
      await supabase.from('materiais').delete().neq('id_material', '');
      await supabase.from('categorias').delete().neq('id_categoria', '');
      await supabase.from('ocorrencias').delete().neq('id_ocorrencia', '');
      await supabase.from('auditoria_logs').delete().neq('id_log', '');
      await supabase.from('usuarios').delete().neq('matricula', '');
      await supabase.from('modelos_armas').delete().neq('modelo', '');

      // 2. Inserir dados mockados iniciais sequencialmente por causa das chaves estrangeiras (FK)
      
      // Estágio 1: Tabelas Base / Independentes
      const { error: errU } = await supabase.from('usuarios').insert(mockUsuarios);
      if (errU) {
        console.error('Falha ao inserir usuários no reset:', errU);
        throw new Error(`Tabela usuarios: ${errU.message} (${errU.details || ''})`);
      }

      const { error: errC } = await supabase.from('categorias').insert(mockCategorias);
      if (errC) {
        console.error('Falha ao inserir categorias no reset:', errC);
        throw new Error(`Tabela categorias: ${errC.message} (${errC.details || ''})`);
      }

      const { error: errModels } = await supabase.from('modelos_armas').insert(defaultModelosArmas);
      if (errModels) {
        console.error('Falha ao inserir modelos_armas no reset:', errModels);
        throw new Error(`Tabela modelos_armas: ${errModels.message} (${errModels.details || ''})`);
      }

      // Estágio 2: Materiais (Depende de Categorias)
      const { error: errM } = await supabase.from('materiais').insert(mockMateriais);
      if (errM) {
        console.error('Falha ao inserir materiais no reset:', errM);
        throw new Error(`Tabela materiais: ${errM.message} (${errM.details || ''})`);
      }

      // Estágio 3: Cautelas, Logs, Ocorrências (Dependem de Usuários e/ou Materiais)
      const { error: errCaut } = await supabase.from('cautelas').insert(mockCautelas);
      if (errCaut) {
        console.error('Falha ao inserir cautelas no reset:', errCaut);
        throw new Error(`Tabela cautelas: ${errCaut.message} (${errCaut.details || ''})`);
      }

      const { error: errLogs } = await supabase.from('auditoria_logs').insert(mockAuditoriaLogs);
      if (errLogs) {
        console.error('Falha ao inserir auditoria_logs no reset:', errLogs);
        throw new Error(`Tabela auditoria_logs: ${errLogs.message} (${errLogs.details || ''})`);
      }

      const { error: errOcos } = await supabase.from('ocorrencias').insert(mockOcorrencias);
      if (errOcos) {
        console.error('Falha ao inserir ocorrencias no reset:', errOcos);
        throw new Error(`Tabela ocorrencias: ${errOcos.message} (${errOcos.details || ''})`);
      }

      // Estágio 4: Cautela Itens (Depende de Cautelas e Materiais)
      const { error: errItems } = await supabase.from('cautela_itens').insert(mockCautelaItens);
      if (errItems) {
        console.error('Falha ao inserir cautela_itens no reset:', errItems);
        throw new Error(`Tabela cautela_itens: ${errItems.message} (${errItems.details || ''})`);
      }

      // Re-fetch clean data to synchronize local state
      await fetchData();
    } catch (error: any) {
      console.error('Erro ao resetar banco do Supabase:', error);
      alert('Erro ao resetar banco remoto:\n' + error.message);
      setIsLoading(false);
    }
  };

  // ---- RESTAURAR BANCO DE DADOS A PARTIR DE BACKUP JSON ----
  const importarBackupDatabase = async (backupData: any) => {
    try {
      setIsLoading(true);

      if (!backupData || typeof backupData !== 'object') {
        throw new Error('Formato de backup inválido.');
      }

      // Validar chaves essenciais para evitar corromper o banco
      const chavesObrigatorias = ['usuarios', 'categorias', 'materiais', 'cautelas', 'cautela_itens'];
      for (const chave of chavesObrigatorias) {
        if (!Array.isArray(backupData[chave])) {
          throw new Error(`O backup está incompleto ou inválido: chave "${chave}" não encontrada.`);
        }
      }

      // 1. Limpar todas as tabelas em ordem reversa de chaves estrangeiras
      await supabase.from('cautela_itens').delete().neq('id_cautela_item', '');
      await supabase.from('cautelas').delete().neq('id_cautela', '');
      await supabase.from('materiais').delete().neq('id_material', '');
      await supabase.from('categorias').delete().neq('id_categoria', '');
      await supabase.from('ocorrencias').delete().neq('id_ocorrencia', '');
      await supabase.from('auditoria_logs').delete().neq('id_log', '');
      await supabase.from('usuarios').delete().neq('matricula', '');
      await supabase.from('modelos_armas').delete().neq('modelo', '');

      // 2. Inserir sequencialmente respeitando as chaves estrangeiras

      // Estágio 1: Tabelas Base / Independentes
      if (backupData.usuarios && backupData.usuarios.length > 0) {
        const { error: errU } = await supabase.from('usuarios').insert(backupData.usuarios);
        if (errU) throw new Error(`Erro ao importar usuarios: ${errU.message}`);
      }

      if (backupData.categorias && backupData.categorias.length > 0) {
        const { error: errC } = await supabase.from('categorias').insert(backupData.categorias);
        if (errC) throw new Error(`Erro ao importar categorias: ${errC.message}`);
      }

      if (backupData.modelos_armas && backupData.modelos_armas.length > 0) {
        const { error: errModels } = await supabase.from('modelos_armas').insert(backupData.modelos_armas);
        if (errModels) throw new Error(`Erro ao importar modelos_armas: ${errModels.message}`);
      }

      // Estágio 2: Materiais (Depende de Categorias)
      if (backupData.materiais && backupData.materiais.length > 0) {
        const { error: errM } = await supabase.from('materiais').insert(backupData.materiais);
        if (errM) throw new Error(`Erro ao importar materiais: ${errM.message}`);
      }

      // Estágio 3: Cautelas, Logs, Ocorrências (Dependem de Usuários e/ou Materiais)
      if (backupData.cautelas && backupData.cautelas.length > 0) {
        const { error: errCaut } = await supabase.from('cautelas').insert(backupData.cautelas);
        if (errCaut) throw new Error(`Erro ao importar cautelas: ${errCaut.message}`);
      }

      if (backupData.auditoria_logs && backupData.auditoria_logs.length > 0) {
        const { error: errLogs } = await supabase.from('auditoria_logs').insert(backupData.auditoria_logs);
        if (errLogs) throw new Error(`Erro ao importar auditoria_logs: ${errLogs.message}`);
      }

      if (backupData.ocorrencias && backupData.ocorrencias.length > 0) {
        const { error: errOcos } = await supabase.from('ocorrencias').insert(backupData.ocorrencias);
        if (errOcos) throw new Error(`Erro ao importar ocorrencias: ${errOcos.message}`);
      }

      // Estágio 4: Cautela Itens (Depende de Cautelas e Materiais)
      if (backupData.cautela_itens && backupData.cautela_itens.length > 0) {
        const { error: errItems } = await supabase.from('cautela_itens').insert(backupData.cautela_itens);
        if (errItems) throw new Error(`Erro ao importar cautela_itens: ${errItems.message}`);
      }

      // Re-fetch clean data to synchronize local state
      await fetchData();

      registrarLogAuditoria(
        '7317573',
        'cadastro_militar',
        `Restauração completa do banco de dados realizada com sucesso a partir de arquivo de backup JSON.`
      );

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao importar backup no Supabase:', error);
      alert('Erro ao restaurar backup remoto:\n' + error.message);
      setIsLoading(false);
      throw error;
    }
  };

  const adicionarCategoria = (novaCategoria: Categoria) => {
    setCategorias(prev => [...prev, novaCategoria]);

    supabase.from('categorias').insert(novaCategoria).then(({ error }) => {
      if (error) console.error('Erro ao sincronizar categorias:', error);
    });

    const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
    registrarLogAuditoria(
      armeiroSvc,
      'cadastro_militar',
      `Nova categoria regulamentar cadastrada: ${novaCategoria.nome} (ID: ${novaCategoria.id_categoria}).`
    );
  };

  // ---- CADASTRO DE SENHA DO PRIMEIRO ACESSO ----
  const cadastrarSenha = (matricula: string, novaSenhaInput: string) => {
    const usuariosAtualizados = usuarios.map(u => {
      if (u.matricula === matricula) {
        return { ...u, senha_hash: novaSenhaInput };
      }
      return u;
    });

    setUsuarios(usuariosAtualizados);

    supabase.from('usuarios').update({ senha_hash: novaSenhaInput }).eq('matricula', matricula).then(({ error }) => {
      if (error) console.error('Erro ao salvar nova senha:', error);
    });

    registrarLogAuditoria(
      matricula,
      'login',
      `Senha de 4 dígitos cadastrada com sucesso no primeiro acesso.`
    );
  };

  // ---- CADASTRO DE NOVO POLICIAL MILITAR ----
  const cadastrarPolicial = (novoPolicial: Usuario) => {
    setUsuarios(prev => [...prev, novoPolicial]);

    supabase.from('usuarios').insert(novoPolicial).then(({ error }) => {
      if (error) console.error('Erro ao cadastrar policial:', error);
    });

    registrarLogAuditoria(
      activeArmeiroMatricula || 'SYS-AM',
      'cadastro_militar',
      `Novo policial militar cadastrado: ${novoPolicial.posto_graduacao} ${novoPolicial.nome} (Guerra: ${novoPolicial.nome_de_guerra || 'N/A'}, Matrícula: ${novoPolicial.matricula}, Porte: ${novoPolicial.situacao_cautela.toUpperCase()}).`
    );
  };

  // ---- EDITAR PERFIL DE USUÁRIO (POLICIAL OU ARMEIRO) ----
  const editarPolicial = async (matricula: string, dadosAtualizados: Partial<Usuario>) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update(dadosAtualizados)
        .eq('matricula', matricula);

      if (error) throw error;

      setUsuarios(prev => prev.map(u => u.matricula === matricula ? { ...u, ...dadosAtualizados } : u));

      const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
      registrarLogAuditoria(
        armeiroSvc,
        'cadastro_militar',
        `Perfil do usuário matricula ${matricula} atualizado: ${Object.keys(dadosAtualizados).join(', ')}`
      );

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao editar policial no Supabase:', error);
      throw error;
    }
  };

  // ---- EXCLUIR PERFIL DE USUÁRIO ----
  const excluirUsuario = async (matricula: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('matricula', matricula);

      if (error) {
        if (error.code === '23503') {
          throw new Error('Este usuário possui históricos de cautelas, ocorrências ou auditorias registradas e não pode ser excluído fisicamente para manter a integridade dos dados bélicos.');
        }
        throw error;
      }

      setUsuarios(prev => prev.filter(u => u.matricula !== matricula));

      const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
      registrarLogAuditoria(
        armeiroSvc,
        'cadastro_militar',
        `Usuário com matrícula ${matricula} foi excluído permanentemente do sistema.`
      );

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao excluir usuário no Supabase:', error);
      throw error;
    }
  };

  // ---- SALVAR REGISTRO NO LIVRO DE OCORRÊNCIAS ----
  const salvarOcorrencia = (
    titulo: string, 
    tipo: 'troca_turno' | 'avaria_material' | 'fiscalizacao' | 'outros' | 'conferencia_estoque', 
    descricao: string
  ) => {
    const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';

    const novaOco: OcorrenciaRelatorio = {
      id_ocorrencia: `OCO-${Math.floor(100000 + Math.random() * 900000)}`,
      data_hora: new Date().toISOString(),
      titulo: titulo,
      tipo: tipo,
      descricao: descricao,
      matricula_armeiro: armeiroSvc
    };

    setOcorrencias(prev => [novaOco, ...prev]);

    supabase.from('ocorrencias').insert(novaOco).then(({ error }) => {
      if (error) console.error('Erro ao salvar ocorrencia:', error);
    });

    registrarLogAuditoria(
      armeiroSvc,
      'bloqueio_militar',
      `Novo relatório registrado no Livro de Ocorrências: "${titulo}" (Tipo: ${tipo.toUpperCase()}, ID: ${novaOco.id_ocorrencia}).`
    );
  };

  // ---- ZERAR SENHA DE MILITAR ----
  const zerarSenha = (matricula: string) => {
    const user = usuarios.find(u => u.matricula === matricula);
    if (!user) return;

    const usuariosAtualizados = usuarios.map(u => {
      if (u.matricula === matricula) {
        return { ...u, senha_hash: '' };
      }
      return u;
    });

    setUsuarios(usuariosAtualizados);

    supabase.from('usuarios').update({ senha_hash: '' }).eq('matricula', matricula).then(({ error }) => {
      if (error) console.error('Erro ao zerar senha:', error);
    });

    const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
    registrarLogAuditoria(
      armeiroSvc,
      'bloqueio_militar',
      `Senha do militar ${user.posto_graduacao} ${user.nome} (Matrícula: ${matricula}) foi zerada pelo armeiro para redefinição no Totem.`
    );
  };

  // ---- ALTERAR SITUAÇÃO DO PORTE ----
  const updatePorte = (matricula: string, novaSituacao: SituacaoMilitar) => {
    const user = usuarios.find(u => u.matricula === matricula);
    if (!user) return;

    const usuariosAtualizados = usuarios.map(u => {
      if (u.matricula === matricula) {
        return { ...u, situacao_cautela: novaSituacao };
      }
      return u;
    });

    setUsuarios(usuariosAtualizados);

    supabase.from('usuarios').update({ situacao_cautela: novaSituacao }).eq('matricula', matricula).then(({ error }) => {
      if (error) console.error('Erro ao atualizar situação do porte:', error);
    });

    const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
    registrarLogAuditoria(
      armeiroSvc,
      'bloqueio_militar',
      `Situação de Cautela do militar ${user.posto_graduacao} ${user.nome} (Matrícula: ${matricula}) alterada para ${novaSituacao.toUpperCase()}.`
    );
  };

  // ---- ADICIONAR NOVO MATERIAL AO ESTOQUE ----
  const adicionarMaterial = (novoMaterial: Material) => {
    const existsIndex = materiais.findIndex(m => m.id_material === novoMaterial.id_material);
    const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';

    if (existsIndex > -1) {
      const newQty = (materiais[existsIndex].quantidade || 0) + (novoMaterial.quantidade || 0);
      const novosMateriais = materiais.map((m, idx) => {
        if (idx === existsIndex) {
          return { ...m, quantidade: newQty };
        }
        return m;
      });
      setMateriais(novosMateriais);

      supabase.from('materiais').update({ quantidade: newQty }).eq('id_material', novoMaterial.id_material).then(({ error }) => {
        if (error) console.error('Erro ao atualizar quantidade do material:', error);
      });
      
      registrarLogAuditoria(
        armeiroSvc,
        'envio_manutencao',
        `Quantidade incrementada para o material: ${novoMaterial.modelo} (Código: ${novoMaterial.id_material}). Adicionado: ${novoMaterial.quantidade}. Novo total: ${newQty}.`
      );
    } else {
      setMateriais(prev => [...prev, novoMaterial]);

      supabase.from('materiais').insert(novoMaterial).then(({ error }) => {
        if (error) console.error('Erro ao cadastrar novo material:', error);
      });

      registrarLogAuditoria(
        armeiroSvc,
        'envio_manutencao',
        `Novo material bélico cadastrado no estoque: ${novoMaterial.modelo} (S/N: ${novoMaterial.id_material}, Calibre: ${novoMaterial.calibre || 'N/A'}, Categoria: ${novoMaterial.id_categoria}).`
      );
    }
  };

  // ---- ALTERAR STATUS OPERACIONAL DE UM MATERIAL ----
  const updateMaterialStatus = (id: string, novoStatus: StatusMaterial) => {
    const mat = materiais.find(m => m.id_material === id);
    if (!mat) return;

    const materiaisAtualizados = materiais.map(m => {
      if (m.id_material === id) {
        return { ...m, status_atual: novoStatus };
      }
      return m;
    });

    setMateriais(materiaisAtualizados);

    supabase.from('materiais').update({ status_atual: novoStatus }).eq('id_material', id).then(({ error }) => {
      if (error) console.error('Erro ao atualizar status do material:', error);
    });

    const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
    
    let ev: AuditoriaLog['tipo_evento'] = 'envio_manutencao';
    if (novoStatus === 'disponivel') ev = 'retorno_manutencao';
    else if (novoStatus === 'condenado') ev = 'bloqueio_militar';

    registrarLogAuditoria(
      armeiroSvc,
      ev,
      `Status do material ${mat.modelo} (S/N: ${id}) alterado para ${novoStatus.toUpperCase()}.`
    );
  };

  // ---- CONFIRMAR RETIRADA COM JUSTIFICATIVA ----
  const confirmarRetirada = (id: string, destino: string, quantidade_retirada: number = 1) => {
    const mat = materiais.find(m => m.id_material === id);
    if (!mat) return;

    let newQty = mat.quantidade || 0;
    const materiaisAtualizados = materiais.map(m => {
      if (m.id_material === id) {
        if (m.controle_quantidade) {
          newQty = Math.max(0, (m.quantidade || 0) - quantidade_retirada);
          return { ...m, quantidade: newQty };
        }
        return { ...m, status_atual: 'retirado' as StatusMaterial };
      }
      return m;
    });

    setMateriais(materiaisAtualizados);

    const updateFields = mat.controle_quantidade ? { quantidade: newQty } : { status_atual: 'retirado' };
    supabase.from('materiais').update(updateFields).eq('id_material', id).then(({ error }) => {
      if (error) console.error('Erro ao registrar retirada de material:', error);
    });

    const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
    const desc = mat.controle_quantidade 
      ? `Material ${mat.modelo} (Lote: ${id}) - Qtd: ${quantidade_retirada} RETIRADAS do estoque. Destino/Justificativa: "${destino}".`
      : `Material ${mat.modelo} (S/N: ${id}) RETIRADO do estoque. Destino/Justificativa: "${destino}".`;

    registrarLogAuditoria(
      armeiroSvc,
      'envio_manutencao',
      desc
    );
  };

  // ---- EFETIVAR CAUTELA ----
  const processEfetivarCautela = (
    matriculaPolicial: string, 
    cartItens: string[], 
    observacoes: string,
    weaponMagazines?: Record<string, number>
  ) => {
    const user = usuarios.find(u => u.matricula === matriculaPolicial);
    if (!user) return null;

    const idNewCautela = `CAUT-${Math.floor(1000 + Math.random() * 9000)}-2026`;
    const armeiroSvcMatricula = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || user.matricula;

    const novaCautela: Cautela = {
      id_cautela: idNewCautela,
      matricula_policial: matriculaPolicial,
      matricula_armeiro_retirada: armeiroSvcMatricula,
      data_retirada: new Date().toISOString(),
      previsao_devolucao: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      status_cautela: 'ativa',
      observacoes_retirada: observacoes
    };

    // Group cart items to handle quantity-based items
    const groupedCart: Record<string, number> = {};
    cartItens.forEach(id => {
      groupedCart[id] = (groupedCart[id] || 0) + 1;
    });

    const novosItensCautela: CautelaItem[] = Object.entries(groupedCart).map(([idMat, qty], idx) => {
      const magQty = (weaponMagazines && weaponMagazines[idMat]) || 0;
      return {
        id_cautela_item: `ITEM-${Math.floor(100000 + Math.random() * 900000)}`,
        id_cautela: idNewCautela,
        id_material: idMat,
        quantidade: qty,
        estado_entrega: 'excelente',
        quantidade_carregadores: magQty
      };
    });

    const materiaisAtualizados = materiais.map(m => {
      if (cartItens.includes(m.id_material)) {
        if (m.controle_quantidade) {
          return m; // Quantity-based remains active in list
        }
        return { ...m, status_atual: 'cautelado' as StatusMaterial };
      }
      return m;
    });

    // Update local state
    setCautelas(prev => [novaCautela, ...prev]);
    setCautelaItens(prev => [...prev, ...novosItensCautela]);
    setMateriais(materiaisAtualizados);

    // Sync to Supabase
    supabase.from('cautelas').insert(novaCautela).then(({ error }) => {
      if (error) console.error('Erro ao salvar nova cautela:', error);
    });

    supabase.from('cautela_itens').insert(novosItensCautela).then(({ error }) => {
      if (error) console.error('Erro ao salvar itens da cautela:', error);
    });

    // Update material statuses
    const individualMats = cartItens.filter(id => !materiais.find(m => m.id_material === id)?.controle_quantidade);
    if (individualMats.length > 0) {
      supabase.from('materiais').update({ status_atual: 'cautelado' }).in('id_material', individualMats).then(({ error }) => {
        if (error) console.error('Erro ao atualizar status dos materiais da cautela:', error);
      });
    }

    registrarLogAuditoria(
      matriculaPolicial, 
      'registro_cautela', 
      `Cautela ${idNewCautela} criada com sucesso para ${user.nome}. Itens: ${Object.entries(groupedCart).map(([id, qty]) => `${id} (x${qty})`).join(', ')}.`
    );

    return novaCautela;
  };

  // ---- EFETIVAR DEVOLUÇÃO ----
  const processDevolucao = (
    cautId: string, 
    idsMateriaisDevolvidos: string[], 
    claimConditions: Record<string, CondicaoUso>, 
    observacoes: string, 
    prorrogar: boolean = false,
    returnedQuantities?: Record<string, number>,
    consumedQuantities?: Record<string, number>
  ) => {
    const cautelaParaBaixa = cautelas.find(c => c.id_cautela === cautId);
    if (!cautelaParaBaixa) return;

    const armeiroResponsavel = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
    const agora = new Date().toISOString();

    // 1. Atualizar materiais correspondentes no estoque (somente quantidade devolvida para controle_quantidade)
    const materiaisAtualizados = materiais.map(m => {
      if (idsMateriaisDevolvidos.includes(m.id_material)) {
        if (m.controle_quantidade) {
          const qtyToReturn = returnedQuantities?.[m.id_material] ?? 0;
          return { ...m, quantidade: (m.quantidade || 0) + qtyToReturn };
        }
        return { ...m, status_atual: 'disponivel' as StatusMaterial };
      }
      return m;
    });

    // 2. Atualizar a condição de devolução de cada item na CautelaItem, suportando devolução parcial e consumo
    let novosCautelaItens = [...cautelaItens];
    const activeItemsMap = new Map<string, CautelaItem>();
    novosCautelaItens.forEach(ci => {
      activeItemsMap.set(ci.id_cautela_item, { ...ci });
    });

    idsMateriaisDevolvidos.forEach(idMat => {
      const ci = Array.from(activeItemsMap.values()).find(
        item => item.id_cautela === cautId && item.id_material === idMat && item.estado_devolucao === undefined
      );
      if (!ci) return;

      const mat = materiais.find(m => m.id_material === idMat);
      const qtyToReturn = (mat?.controle_quantidade && returnedQuantities) 
        ? (returnedQuantities[idMat] ?? ci.quantidade) 
        : ci.quantidade;
      const qtyConsumed = (mat?.controle_quantidade && consumedQuantities)
        ? (consumedQuantities[idMat] ?? 0)
        : 0;

      const condition = claimConditions[idMat] || 'bom';
      const totalProcessed = qtyToReturn + qtyConsumed;

      if (totalProcessed >= ci.quantidade) {
        if (qtyToReturn > 0 && qtyConsumed > 0) {
          activeItemsMap.set(ci.id_cautela_item, {
            ...ci,
            quantidade: qtyToReturn,
            estado_devolucao: condition
          });
          const newId = `ITEM-CONS-${Math.floor(Math.random() * 100000)}`;
          activeItemsMap.set(newId, {
            id_cautela_item: newId,
            id_cautela: cautId,
            id_material: idMat,
            quantidade: qtyConsumed,
            estado_entrega: ci.estado_entrega,
            estado_devolucao: 'avariado',
            consumido: true
          });
        } else if (qtyConsumed > 0) {
          activeItemsMap.set(ci.id_cautela_item, {
            ...ci,
            estado_devolucao: 'avariado',
            consumido: true
          });
        } else {
          activeItemsMap.set(ci.id_cautela_item, {
            ...ci,
            estado_devolucao: condition
          });
        }
      } else {
        activeItemsMap.set(ci.id_cautela_item, {
          ...ci,
          quantidade: ci.quantidade - totalProcessed
        });

        if (qtyToReturn > 0) {
          const newIdDev = `ITEM-DEV-${Math.floor(Math.random() * 100000)}`;
          activeItemsMap.set(newIdDev, {
            id_cautela_item: newIdDev,
            id_cautela: cautId,
            id_material: idMat,
            quantidade: qtyToReturn,
            estado_entrega: ci.estado_entrega,
            estado_devolucao: condition
          });
        }

        if (qtyConsumed > 0) {
          const newIdCons = `ITEM-CONS-${Math.floor(Math.random() * 100000)}`;
          activeItemsMap.set(newIdCons, {
            id_cautela_item: newIdCons,
            id_cautela: cautId,
            id_material: idMat,
            quantidade: qtyConsumed,
            estado_entrega: ci.estado_entrega,
            estado_devolucao: 'avariado',
            consumido: true
          });
        }
      }
    });

    novosCautelaItens = Array.from(activeItemsMap.values());

    // 3. Verificar se todos os itens foram devolvidos
    const todosItensDaCautela = novosCautelaItens.filter(ci => ci.id_cautela === cautId);
    const todosDevolvidos = todosItensDaCautela.every(ci => ci.estado_devolucao !== undefined);

    // 4. Nova previsão (+48h)
    const novaPrevisao = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // 5. Atualizar Cautela
    const returnedSummary = idsMateriaisDevolvidos.map(id => {
      const qtyRet = returnedQuantities?.[id];
      const qtyCons = consumedQuantities?.[id];
      const parts = [];
      if (qtyRet !== undefined) parts.push(`Dev: ${qtyRet}`);
      if (qtyCons !== undefined && qtyCons > 0) parts.push(`Cons: ${qtyCons}`);
      return `${id} (${parts.join(', ') || 'Total'})`;
    }).join(', ');

    const baseObs = idsMateriaisDevolvidos.length > 0
      ? `[Baixa Parcial] Itens: ${returnedSummary}. Obs: ${observacoes}`
      : observacoes;

    let updatedCautela: Cautela;

    const cautelasAtualizadas = cautelas.map(c => {
      if (c.id_cautela === cautId) {
        if (todosDevolvidos) {
          updatedCautela = {
            ...c,
            status_cautela: 'devolvida' as const,
            data_devolucao_efetiva: agora,
            matricula_armeiro_devolucao: armeiroResponsavel,
            observacoes_devolucao: observacoes,
            ...(prorrogar || c.prorrogada ? {
              prorrogada: true,
              data_prorrogacao: c.data_prorrogacao || agora,
              matricula_armeiro_prorrogacao: c.matricula_armeiro_prorrogacao || armeiroResponsavel
            } : {})
          };
        } else if (prorrogar) {
          updatedCautela = {
            ...c,
            previsao_devolucao: novaPrevisao,
            status_cautela: 'prorrogada' as const,
            prorrogada: true,
            data_prorrogacao: agora,
            matricula_armeiro_prorrogacao: armeiroResponsavel,
            observacoes_devolucao: c.observacoes_devolucao
              ? `${c.observacoes_devolucao} | [Prorrogado >24h em ${new Date(agora).toLocaleString('pt-BR')}] ${baseObs}`
              : `[Prorrogado >24h em ${new Date(agora).toLocaleString('pt-BR')}] ${baseObs}`
          };
        } else {
          updatedCautela = {
            ...c,
            observacoes_devolucao: c.observacoes_devolucao
              ? `${c.observacoes_devolucao} | ${baseObs}`
              : baseObs
          };
        }
        return updatedCautela;
      }
      return c;
    });

    // 6. Atualizar Militar
    const policialResponsavel = cautelaParaBaixa.matricula_policial;
    const usuariosAtualizados = usuarios.map(u => {
      if (u.matricula === policialResponsavel && todosDevolvidos) {
        return { ...u, situacao_cautela: 'apto' as const };
      }
      return u;
    });

    // Atualizar Estados Locais
    setCautelas(cautelasAtualizadas);
    setMateriais(materiaisAtualizados);
    setCautelaItens(novosCautelaItens);
    setUsuarios(usuariosAtualizados);

    // ---- SINCRONIZAR COM SUPABASE ----
    
    // Sincronizar Materiais
    idsMateriaisDevolvidos.forEach(idMat => {
      const matObj = materiaisAtualizados.find(m => m.id_material === idMat);
      if (matObj) {
        const fieldsToUpdate = matObj.controle_quantidade 
          ? { quantidade: matObj.quantidade } 
          : { status_atual: matObj.status_atual };
          
        supabase.from('materiais').update(fieldsToUpdate).eq('id_material', idMat).then(({ error }) => {
          if (error) console.error(`Erro ao atualizar material ${idMat} no Supabase:`, error);
        });
      }
    });

    // Sincronizar CautelaItens (Deletar antigos e inserir novos para esta cautela)
    supabase.from('cautela_itens').delete().eq('id_cautela', cautId).then(({ error }) => {
      if (error) {
        console.error('Erro ao remover itens antigos no Supabase:', error);
      } else {
        const itemsToInsert = todosItensDaCautela;
        if (itemsToInsert.length > 0) {
          supabase.from('cautela_itens').insert(itemsToInsert).then(({ error: errIns }) => {
            if (errIns) console.error('Erro ao reinserir itens atualizados no Supabase:', errIns);
          });
        }
      }
    });

    // Sincronizar Cautela
    const cautObj = cautelasAtualizadas.find(c => c.id_cautela === cautId);
    if (cautObj) {
      supabase.from('cautelas').update(cautObj).eq('id_cautela', cautId).then(({ error }) => {
        if (error) console.error('Erro ao atualizar cautela no Supabase:', error);
      });
    }

    // Sincronizar Militar (se todos devolvidos)
    if (todosDevolvidos) {
      supabase.from('usuarios').update({ situacao_cautela: 'apto' }).eq('matricula', policialResponsavel).then(({ error }) => {
        if (error) console.error('Erro ao reabilitar militar no Supabase:', error);
      });
    }

    // Logs de consumo adicionais
    if (consumedQuantities) {
      Object.entries(consumedQuantities).forEach(([idMat, qty]) => {
        if (qty > 0) {
          const mat = materiais.find(m => m.id_material === idMat);
          registrarLogAuditoria(
            armeiroResponsavel,
            'registro_devolucao',
            `Consumo de munição registrado: ${qty} unidades do material ${mat?.modelo || idMat} consumidas pelo militar na cautela ${cautId}.`
          );
        }
      });
    }

    const prorrogouStr = prorrogar && !todosDevolvidos ? 'SIM — Nova previsão: +48h' : 'NÃO';
    registrarLogAuditoria(
      armeiroResponsavel,
      'registro_devolucao',
      `Baixa de Cautela efetuada para ${cautId} (Militar: ${policialResponsavel}). Itens processados: ${idsMateriaisDevolvidos.join(', ') || 'Nenhum'}. Cautela concluída: ${todosDevolvidos ? 'SIM' : 'NÃO'}. Prorrogada >24h: ${prorrogouStr}.`
    );
  };

  const alterarSenhaArmeiro = (matricula: string, novaSenha: string) => {
    const usuariosAtualizados = usuarios.map(u => {
      if (u.matricula === matricula) {
        return { ...u, senha_hash: novaSenha };
      }
      return u;
    });
    setUsuarios(usuariosAtualizados);

    supabase.from('usuarios').update({ senha_hash: novaSenha }).eq('matricula', matricula).then(({ error }) => {
      if (error) console.error('Erro ao alterar senha do armeiro no Supabase:', error);
    });

    registrarLogAuditoria(
      matricula,
      'login',
      `Senha do armeiro (Matrícula: ${matricula}) alterada com sucesso.`
    );
  };

  const adicionarModeloArma = (modelo: string, calibre: string) => {
    const novoModel = { modelo: modelo.trim(), calibre: calibre.trim() };
    if (!modelosArmas.some(m => m.modelo.toLowerCase() === novoModel.modelo.toLowerCase())) {
      setModelosArmas(prev => [...prev, novoModel]);

      supabase.from('modelos_armas').insert(novoModel).then(({ error }) => {
        if (error) console.error('Erro ao adicionar modelo de arma no Supabase:', error);
      });
    }
  };

  return {
    usuarios,
    setUsuarios,
    materiais,
    setMateriais,
    categorias,
    setCategorias,
    cautelas,
    setCautelas,
    cautelaItens,
    setCautelaItens,
    auditoriaLogs,
    setAuditoriaLogs,
    ocorrencias,
    setOcorrencias,
    modelosArmas,
    adicionarModeloArma,
    resetDatabase,
    importarBackupDatabase,
    registrarLogAuditoria,
    cadastrarSenha,
    cadastrarPolicial,
    editarPolicial,
    excluirUsuario,
    salvarOcorrencia,
    zerarSenha,
    updatePorte,
    adicionarMaterial,
    updateMaterialStatus,
    confirmarRetirada,
    processEfetivarCautela,
    processDevolucao,
    adicionarCategoria,
    alterarSenhaArmeiro,
    isLoading,
    dbError
  };
}
