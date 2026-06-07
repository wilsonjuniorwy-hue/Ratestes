/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Usuario, Categoria, Material, Cautela, CautelaItem, 
  AuditoriaLog, OcorrenciaRelatorio, SituacaoMilitar, 
  StatusMaterial, CondicaoUso, ArmaParticular, PendenciaServico,
  Quartel
} from '../types';
import { hashSHA256 } from '../utils/crypto';
import { 
  mockUsuarios, mockCategorias, mockMateriais, 
  mockCautelas, mockCautelaItens, mockAuditoriaLogs, 
  mockOcorrencias 
} from '../mockData';
import { useOfflineDatabase } from './useOfflineDatabase';

const defaultModelosArmas = [
  { modelo: 'Pistola CZ - P10', calibre: '9mm' },
  { modelo: 'Fuzil Imbel IA2 5.56', calibre: '5.56mm' },
  { modelo: 'Espingarda Calibre 12', calibre: '12' }
];

export function useSupabaseDatabase(activeArmeiroMatricula?: string, quartelId?: string | null, enabled: boolean = true) {
  const offlineDb = useOfflineDatabase();
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [cautelaItens, setCautelaItens] = useState<CautelaItem[]>([]);
  const [auditoriaLogs, setAuditoriaLogs] = useState<AuditoriaLog[]>([]);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaRelatorio[]>([]);
  const [modelosArmas, setModelosArmas] = useState<Array<{ modelo: string; calibre: string }>>([]);
  const [armasParticulares, setArmasParticulares] = useState<ArmaParticular[]>([]);
  const [pendenciasServico, setPendenciasServico] = useState<PendenciaServico[]>([]);
  const [quarteis, setQuarteis] = useState<Quartel[]>([]);

  const [filaSincronizacao, setFilaSincronizacao] = useState<any[]>([]);
  const [syncQueueErrors, setSyncQueueErrors] = useState<Record<number, string>>({});

  const carregarFilaSincronizacao = async () => {
    if (!offlineDb.isDbReady) return;
    try {
      const fila = await offlineDb.obterFilaSincronizacao();
      setFilaSincronizacao(fila);
    } catch (err) {
      console.error('Erro ao carregar fila de sincronização:', err);
    }
  };

  const enfileirarEAtualizar = async (operacao: string, payload: any) => {
    await offlineDb.enfileirarTransacaoOffline(operacao, payload);
    await carregarFilaSincronizacao();
  };

  const removerItemFilaSincronizacao = async (id: number) => {
    await offlineDb.removerTransacaoFila(id);
    setSyncQueueErrors(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    await carregarFilaSincronizacao();
  };

  const limparFilaSincronizacao = async () => {
    await offlineDb.limparFilaSincronizacao();
    setSyncQueueErrors({});
    await carregarFilaSincronizacao();
  };

  useEffect(() => {
    if (offlineDb.isDbReady) {
      carregarFilaSincronizacao();
    }
  }, [offlineDb.isDbReady]);

  const [isLoading, setIsLoading] = useState(enabled);
  const [dbError, setDbError] = useState<string | null>(null);

  // Monitorar status de internet
  useEffect(() => {
    const handleOnline = () => {
      console.log('SGBD Conexão: Internet restabelecida.');
      setIsOnline(true);
    };
    const handleOffline = () => {
      console.log('SGBD Conexão: Internet desconectada. Modo contingência ativo.');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ---- BUSCAR DADOS DO SUPABASE AO INICIAR ----
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setDbError(null);

      if (!isOnline) {
        console.log('SGBD Offline: Dispositivo offline. Carregando dados do SQLite local...');
        const [localUsers, localMaterials, localCautelas, localItems] = await Promise.all([
          offlineDb.obterUsuariosLocal(),
          offlineDb.obterMateriaisLocal(),
          offlineDb.obterCautelasLocal(),
          offlineDb.obterCautelaItensLocal()
        ]);
        
        const mappedUsers = localUsers.map(u => ({ ...u, senha_hash: '' } as Usuario));
        setUsuarios(mappedUsers);
        setMateriais(localMaterials);
        setCautelas(localCautelas);
        setCautelaItens(localItems);
        setIsLoading(false);
        return;
      }

      console.log('SGBD: Iniciando busca de dados paralela (fetchData)...');

      const [
        { data: users, error: errUsers },
        { data: materials, error: errMaterials },
        { data: categories, error: errCategories },
        { data: cautelasData, error: errCautelas },
        { data: items, error: errItems },
        { data: logs, error: errLogs },
        { data: ocos, error: errOcos },
        { data: models, error: errModels },
        { data: privateWeapons, error: errPrivateWeapons },
        { data: dbPendencias, error: errPendencias },
        { data: quarteisData, error: errQuarteis }
      ] = await Promise.all([
        supabase.from('usuarios').select('matricula, nome, nome_de_guerra, perfil, posto_graduacao, situacao_cautela, data_ultimo_teste_psicologico, motivo_suspensao, id_quartel, tentativas_login, bloqueado_ate, senha_hash, auth_user_id').is('deletado_em', null).then(r => { console.log('SGBD: 1. usuarios OK'); return r; }),
        supabase.from('materiais').select('*').is('deletado_em', null).then(r => { console.log('SGBD: 2. materiais OK'); return r; }),
        supabase.from('categorias').select('*').then(r => { console.log('SGBD: 3. categorias OK'); return r; }),
        supabase.from('cautelas').select('*').is('deletado_em', null).then(r => { console.log('SGBD: 4. cautelas OK'); return r; }),
        supabase.from('cautela_itens').select('*').is('deletado_em', null).then(r => { console.log('SGBD: 5. cautela_itens OK'); return r; }),
        supabase.from('auditoria_logs').select('*').order('data_hora', { ascending: false }).then(r => { console.log('SGBD: 6. auditoria_logs OK'); return r; }),
        supabase.from('ocorrencias').select('*').is('deletado_em', null).order('data_hora', { ascending: false }).then(r => { console.log('SGBD: 7. ocorrencias OK'); return r; }),
        supabase.from('modelos_armas').select('*').then(r => { console.log('SGBD: 8. modelos_armas OK'); return r; }),
        supabase.from('armas_particulares').select('*').is('deletado_em', null).order('data_deposito', { ascending: false }).then(r => { console.log('SGBD: 9. armas_particulares OK'); return r; }),
        supabase.from('pendencias_servico').select('*').is('deletado_em', null).order('data_criacao', { ascending: false }).then(r => { console.log('SGBD: 10. pendencias_servico OK'); return r; }),
        supabase.from('quarteis').select('*').is('deletado_em', null).eq('ativo', true).then(r => { console.log('SGBD: 11. quarteis OK'); return r; })
      ]);

      console.log('SGBD: Todas as queries paralelas finalizadas com sucesso.');

      if (errUsers) throw errUsers;
      if (errMaterials) throw errMaterials;
      if (errCategories) throw errCategories;
      if (errCautelas) throw errCautelas;
      if (errItems) throw errItems;
      if (errLogs) throw errLogs;
      if (errOcos) throw errOcos;
      if (errModels) throw errModels;
      if (errPrivateWeapons) throw errPrivateWeapons;
      if (errPendencias) throw errPendencias;
      if (errQuarteis) throw errQuarteis;

      let mappedUsers = (users || []).map(u => ({ ...u, senha_hash: '' } as Usuario));
      if (activeArmeiroMatricula && activeArmeiroMatricula.trim().toUpperCase() === 'ADMIN') {
        const hasAdmin = mappedUsers.some(u => u.matricula.trim().toUpperCase() === 'ADMIN');
        if (!hasAdmin) {
          mappedUsers.push({
            matricula: 'ADMIN',
            nome: 'Administrador do Sistema',
            nome_de_guerra: 'Admin',
            senha_hash: '',
            perfil: 'admin',
            posto_graduacao: 'Administrador',
            situacao_cautela: 'apto',
            data_ultimo_teste_psicologico: '2099-12-31',
            id_quartel: null
          });
        }
      }
      setUsuarios(mappedUsers);
      setMateriais(materials || []);
      setCategorias(categories || []);
      setCautelas(cautelasData || []);
      setCautelaItens(items || []);
      setAuditoriaLogs(logs || []);
      setOcorrencias(ocos || []);
      setModelosArmas(models || []);
      setArmasParticulares(privateWeapons || []);
      setPendenciasServico(dbPendencias || []);
      setQuarteis(quarteisData || []);

      // Auto-seeding do usuário armeiro se não existir na base de dados (com migração de caixa)
      const userList = users || [];
      const exactArmeiro = userList.find(u => u.matricula === 'ARMEIRO');
      const lowerArmeiro = userList.find(u => u.matricula === 'armeiro');

      if (lowerArmeiro) {
        console.log('SGBD: Corrigindo matrícula do armeiro para maiúsculas (ARMEIRO)...');
        supabase.from('usuarios').delete().eq('matricula', 'armeiro').then(() => {
          const armeiroData = {
            matricula: 'ARMEIRO',
            nome: 'Totem de Atendimento',
            nome_de_guerra: 'Totem',
            senha_hash: '5fac61b0fd803321c5831cd12a21649522595554c8a508bd42d4a1b4f09eab36', // hash de 101187
            perfil: 'armeiro_gestor',
            posto_graduacao: 'Totem',
            situacao_cautela: 'apto',
            data_ultimo_teste_psicologico: '2026-05-31'
          };
          supabase.from('usuarios').insert(armeiroData).then(({ error }) => {
            if (error) console.error('SGBD Erro ao migrar armeiro:', error);
            fetchData();
          });
        });
      } else if (!exactArmeiro) {
        console.log('SGBD: Usuário "ARMEIRO" não encontrado. Criando em segundo plano...');
        const armeiroData = {
          matricula: 'ARMEIRO',
          nome: 'Totem de Atendimento',
          nome_de_guerra: 'Totem',
          senha_hash: '5fac61b0fd803321c5831cd12a21649522595554c8a508bd42d4a1b4f09eab36', // hash de 101187
          perfil: 'armeiro_gestor',
          posto_graduacao: 'Totem',
          situacao_cautela: 'apto',
          data_ultimo_teste_psicologico: '2026-05-31'
        };
        supabase.from('usuarios').insert(armeiroData).then(({ error }) => {
          if (error) {
            console.error('SGBD Erro: Falha ao inserir armeiro automático:', error);
          } else {
            console.log('SGBD: Usuário "ARMEIRO" criado com sucesso!');
            fetchData();
          }
        });
      }
      
      // Salvar no cache offline local
      if (offlineDb.isDbReady) {
        console.log('SGBD Offline: Atualizando cache local SQLite com novos dados online...');
        offlineDb.salvarUsuariosLocal(users || []);
        offlineDb.salvarMateriaisLocal(materials || []);
        offlineDb.salvarCautelasLocal(cautelasData || []);
        offlineDb.salvarCautelaItensLocal(items || []);
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados do Supabase:', error);
      setDbError(error.message || 'Erro de conexão com o Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;
    fetchData();

    let fetchTimeout: any = null;

    // Inscreve nos eventos em tempo real do Supabase com debounce para evitar condições de corrida (race conditions)
    // durante operações de escrita rápida (ex: delete + insert em lote).
    const channel = supabase
      .channel('reserva-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('SGBD Realtime: alteração detectada.', payload);
          
          if (fetchTimeout) {
            clearTimeout(fetchTimeout);
          }
          
          fetchTimeout = setTimeout(() => {
            console.log('SGBD Realtime: sincronizando dados em segundo plano...');
            fetchData();
          }, 800); // Debounce de 800ms garante que toda a sequência de inserts encadeados (cautelas → cautela_itens) terminou antes de re-buscar
        }
      )
      .subscribe();

    return () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
      supabase.removeChannel(channel);
    };
  }, [enabled, activeArmeiroMatricula, quartelId, isOnline, offlineDb.isDbReady]);

  // ---- TRIGGERS DE LOG DE AUDITORIA ----
  const registrarLogAuditoria = (executor: string, tipo: AuditoriaLog['tipo_evento'], detalhes: string, overrideQuartelId?: string | null) => {
    const targetQuartelId = overrideQuartelId !== undefined ? overrideQuartelId : (quartelId || null);
    const novoLog: AuditoriaLog = {
      id_log: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
      data_hora: new Date().toISOString(),
      matricula_executor: executor,
      tipo_evento: tipo,
      detalhes: detalhes,
      id_quartel: targetQuartelId || undefined
    };

    // Update local state instantly
    setAuditoriaLogs(prev => [novoLog, ...prev]);

    // Montar o objeto de insert incluindo id_quartel se disponível
    const logToInsert: any = { ...novoLog };
    if (targetQuartelId) logToInsert.id_quartel = targetQuartelId;

    // Update Supabase in background
    supabase.from('auditoria_logs').insert(logToInsert).then(({ error }) => {
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
      await supabase.from('armas_particulares').delete().neq('id_particular', '');
      await supabase.from('pendencias_servico').delete().neq('id_pendencia', '');
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
      const { error: errMat } = await supabase.from('materiais').insert(mockMateriais);
      if (errMat) {
        console.error('Falha ao inserir materiais no reset:', errMat);
        throw new Error(`Tabela materiais: ${errMat.message} (${errMat.details || ''})`);
      }

      // Estágio 3: Cautelas, Logs, Ocorrências (Dependem de Usuários e/ou Materiais)
      const { error: errCautelasData } = await supabase.from('cautelas').insert(mockCautelas);
      if (errCautelasData) {
        console.error('Falha ao inserir cautelas no reset:', errCautelasData);
        throw new Error(`Tabela cautelas: ${errCautelasData.message} (${errCautelasData.details || ''})`);
      }

      const { error: errLogsData } = await supabase.from('auditoria_logs').insert(mockAuditoriaLogs);
      if (errLogsData) {
        console.error('Falha ao inserir logs de auditoria no reset:', errLogsData);
        throw new Error(`Tabela auditoria_logs: ${errLogsData.message} (${errLogsData.details || ''})`);
      }

      const { error: errOcosData } = await supabase.from('ocorrencias').insert(mockOcorrencias);
      if (errOcosData) {
        console.error('Falha ao inserir ocorrencias no reset:', errOcosData);
        throw new Error(`Tabela ocorrencias: ${errOcosData.message} (${errOcosData.details || ''})`);
      }

      // Estágio 4: Cautela Itens (Depende de Cautelas e Materiais)
      const { error: errItemsData } = await supabase.from('cautela_itens').insert(mockCautelaItens);
      if (errItemsData) {
        console.error('Falha ao inserir itens de cautela no reset:', errItemsData);
        throw new Error(`Tabela cautela_itens: ${errItemsData.message} (${errItemsData.details || ''})`);
      }

      console.log('SGBD: Reset de banco de dados efetuado com sucesso!');
      await fetchData();
    } catch (error: any) {
      console.error('Falha crítica no reset de banco de dados do Supabase:', error);
      setDbError(error.message);
    } finally {
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
      const cleanTable = async (tableName: string, colName: string, dummyVal: string = '') => {
        const { error } = await supabase.from(tableName).delete().neq(colName, dummyVal);
        if (error) throw new Error(`Falha ao limpar tabela ${tableName}: ${error.message}`);
      };

      await cleanTable('cautela_itens', 'id_cautela_item');
      await cleanTable('cautelas', 'id_cautela');
      await cleanTable('armas_particulares', 'id_particular', '00000000-0000-0000-0000-000000000000');
      await cleanTable('pendencias_servico', 'id_pendencia', '00000000-0000-0000-0000-000000000000');
      await cleanTable('materiais', 'id_material');
      await cleanTable('categorias', 'id_categoria');
      await cleanTable('ocorrencias', 'id_ocorrencia');
      await cleanTable('auditoria_logs', 'id_log');
      await cleanTable('usuarios', 'matricula');
      await cleanTable('modelos_armas', 'modelo');

      const contemQuarteis = Array.isArray(backupData.quarteis);
      if (contemQuarteis) {
        await cleanTable('quarteis', 'id', '00000000-0000-0000-0000-000000000000');
      }

      // 2. Inserir sequencialmente respeitando as chaves estrangeiras

      // Estágio 0: Quarteis (Independente)
      if (contemQuarteis && backupData.quarteis.length > 0) {
        const { error: errQ } = await supabase.from('quarteis').insert(backupData.quarteis);
        if (errQ) throw new Error(`Erro ao importar quarteis: ${errQ.message}`);
      }

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

      if (backupData.armas_particulares && backupData.armas_particulares.length > 0) {
        const { error: errPart } = await supabase.from('armas_particulares').insert(backupData.armas_particulares);
        if (errPart) throw new Error(`Erro ao importar armas_particulares: ${errPart.message}`);
      }

      if (backupData.pendencias_servico && backupData.pendencias_servico.length > 0) {
        const { error: errPend } = await supabase.from('pendencias_servico').insert(backupData.pendencias_servico);
        if (errPend) throw new Error(`Erro ao importar pendencias_servico: ${errPend.message}`);
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
    hashSHA256(novaSenhaInput).then(hashed => {
      const usuariosAtualizados = usuarios.map(u => {
        if (u.matricula === matricula) {
          return { ...u, senha_hash: hashed };
        }
        return u;
      });
      setUsuarios(usuariosAtualizados);

      if (!isOnline) {
        enfileirarEAtualizar('CADASTRAR_SENHA', { matricula, hashed });
        if (offlineDb.isDbReady) {
          offlineDb.obterUsuariosLocal().then(localUsers => {
            const updated = localUsers.map(u => {
              if (u.matricula === matricula) {
                return { ...u, senha_hash: hashed };
              }
              return u;
            });
            offlineDb.salvarUsuariosLocal(updated);
          });
        }
      } else {
        supabase.from('usuarios').update({ senha_hash: hashed }).eq('matricula', matricula).then(({ error }) => {
          if (error) console.error('Erro ao salvar nova senha:', error);
        });
      }
    });

    registrarLogAuditoria(
      matricula,
      'login',
      `Senha de 4 dígitos cadastrada com sucesso no primeiro acesso.`
    );
  };

  // ---- CADASTRO DE NOVO POLICIAL MILITAR ----
  const cadastrarPolicial = async (novoPolicial: Usuario): Promise<{ success: boolean; error?: string }> => {
    const rawSenha = novoPolicial.senha_hash;
    
    try {
      const hashed = await hashSHA256(rawSenha);
      let finalQuartelId = novoPolicial.perfil === 'admin' ? null : (novoPolicial.id_quartel || quartelId);

      // Tentar obter o id_quartel a partir do armeiro logado caso esteja nulo
      if (!finalQuartelId && activeArmeiroMatricula && novoPolicial.perfil !== 'admin') {
        const armeiroLogado = usuarios.find(u => u.matricula.trim().toUpperCase() === activeArmeiroMatricula.trim().toUpperCase());
        if (armeiroLogado && armeiroLogado.id_quartel) {
          finalQuartelId = armeiroLogado.id_quartel;
        }
      }
      const userToInsert = { 
        ...novoPolicial, 
        senha_hash: hashed,
        id_quartel: finalQuartelId
      };

      if (!isOnline) {
        await enfileirarEAtualizar('CADASTRAR_POLICIAL', { 
          userToInsert, 
          rawSenha 
        });

        if (offlineDb.isDbReady) {
          const localUsers = await offlineDb.obterUsuariosLocal();
          await offlineDb.salvarUsuariosLocal([...localUsers, userToInsert]);
        }

        setUsuarios(prev => [...prev, { ...novoPolicial, id_quartel: finalQuartelId, senha_hash: '' }]);

        registrarLogAuditoria(
          activeArmeiroMatricula || 'SYS-AM',
          'cadastro_militar',
          `Novo ${novoPolicial.perfil === 'armeiro_gestor' ? 'armeiro' : 'policial'} militar cadastrado (Modo Offline): ${novoPolicial.posto_graduacao} ${novoPolicial.nome} (Matrícula: ${novoPolicial.matricula}).`
        );

        return { success: true };
      }

      const { error: insertError } = await supabase.from('usuarios').upsert({
        ...userToInsert,
        deletado_em: null
      });
      if (insertError) {
        console.error('Erro ao cadastrar/reativar policial/armeiro:', insertError);
        return { success: false, error: `Erro ao cadastrar: ${insertError.message}` };
      }

      // Store empty password hash locally so it is not visible in memory listings
      setUsuarios(prev => [...prev, { ...novoPolicial, id_quartel: finalQuartelId, senha_hash: '' }]);

      // Se o usuário cadastrado for armeiro_gestor, chama a Edge Function para criar a conta no Auth e vincular
      if (novoPolicial.perfil === 'armeiro_gestor') {
        let slugQuartel = 'cavalaria';

        // 1. Tentar ler o slug da lista local em memória
        const quartelEmMemoria = quarteis.find(q => q.id === finalQuartelId);
        if (quartelEmMemoria && quartelEmMemoria.slug) {
          slugQuartel = quartelEmMemoria.slug;
        } else {
          // 2. Extrair do JWT do usuário logado na sessão local (sem chamadas ao banco)
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const sessionEmail = session?.user?.email;
            if (sessionEmail && sessionEmail.includes('@') && !sessionEmail.includes('@admin.pm')) {
              const extraido = sessionEmail.split('@')[1]?.split('.')[0];
              if (extraido) {
                slugQuartel = extraido;
              }
            }
          } catch (sessionErr) {
            console.error('Erro ao ler e-mail da sessão para extrair slug:', sessionErr);
          }

          // 3. Select direto no banco se ainda continuar padrão
          if (slugQuartel === 'cavalaria' && finalQuartelId) {
            try {
              const { data: qData } = await supabase
                .from('quarteis')
                .select('slug')
                .eq('id', finalQuartelId)
                .maybeSingle();
              
              if (qData && qData.slug) {
                slugQuartel = qData.slug;
              }
            } catch (qErr) {
              console.error('Erro ao buscar slug do quartel no banco de dados:', qErr);
            }
          }
        }

        const emailCalculado = `${novoPolicial.matricula.trim().toLowerCase()}@${slugQuartel.trim().toLowerCase()}.pm`;

        try {
          const { data, error: funcError } = await supabase.functions.invoke('criar-armeiro-auth', {
            body: { 
              matricula: novoPolicial.matricula, 
              senha: rawSenha,
              email: emailCalculado
            }
          });

          if (funcError || (data && data.error)) {
            const errMsg = funcError?.message || data?.error || 'Erro desconhecido na Edge Function';
            console.warn('Erro na Edge Function ao criar conta no Auth (prosseguindo sem Auth para auto-cadastro no primeiro login):', errMsg);
            // NÃO revertemos a inserção na tabela usuarios. O login portal cuidará de auto-cadastrar no Auth no primeiro login.
          } else if (data && data.auth_user_id) {
            // Atualizar o estado local com o auth_user_id gerado
            setUsuarios(prev => prev.map(u => u.matricula === novoPolicial.matricula ? { ...u, auth_user_id: data.auth_user_id } : u));
          }
        } catch (funcErr: any) {
          console.warn('Falha de rede ao invocar Edge Function (prosseguindo sem Auth para auto-cadastro no primeiro login):', funcErr);
          // NÃO revertemos a inserção na tabela usuarios. O login portal cuidará de auto-cadastrar no Auth no primeiro login.
        }
      }

      registrarLogAuditoria(
        activeArmeiroMatricula || 'SYS-AM',
        'cadastro_militar',
        `Novo ${novoPolicial.perfil === 'armeiro_gestor' ? 'armeiro' : 'policial'} militar cadastrado: ${novoPolicial.posto_graduacao} ${novoPolicial.nome} (Guerra: ${novoPolicial.nome_de_guerra || 'N/A'}, Matrícula: ${novoPolicial.matricula}, Porte: ${novoPolicial.situacao_cautela.toUpperCase()}).`
      );

      return { success: true };
    } catch (err: any) {
      console.error('Erro interno no cadastro:', err);
      return { success: false, error: err.message || 'Erro inesperado no cadastro.' };
    }
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
        .update({ deletado_em: new Date().toISOString() })
        .eq('matricula', matricula);

      if (error) {
        throw error;
      }

      setUsuarios(prev => prev.filter(u => u.matricula !== matricula));

      const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
      registrarLogAuditoria(
        armeiroSvc,
        'cadastro_militar',
        `Perfil de usuário (Matrícula: ${matricula}) excluído do sistema (soft delete).`
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
      matricula_armeiro: armeiroSvc,
      id_quartel: quartelId || undefined
    };

    setOcorrencias(prev => [novaOco, ...prev]);

    const ocoToInsert: any = { ...novaOco };
    if (quartelId) ocoToInsert.id_quartel = quartelId;

    if (!isOnline) {
      enfileirarEAtualizar('SALVAR_OCORRENCIA', { novaOco });
    } else {
      supabase.from('ocorrencias').insert(ocoToInsert).then(({ error }) => {
        if (error) console.error('Erro ao salvar ocorrencia:', error);
      });
    }

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
        return { ...u, senha_hash: '', tentativas_login: 0, bloqueado_ate: null };
      }
      return u;
    });

    setUsuarios(usuariosAtualizados);

    supabase.from('usuarios').update({ senha_hash: '', tentativas_login: 0, bloqueado_ate: null }).eq('matricula', matricula).then(({ error }) => {
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
      // Incluir id_quartel ao inserir novo material
      const materialToInsert: any = { ...novoMaterial };
      if (quartelId) materialToInsert.id_quartel = quartelId;

      setMateriais(prev => [...prev, materialToInsert]);

      supabase.from('materiais').insert(materialToInsert).then(({ error }) => {
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
      observacoes_retirada: observacoes,
      id_quartel: quartelId || undefined
    };

    // Incluir id_quartel na cautela e nos itens
    const cautelaToInsert: any = { ...novaCautela };
    if (quartelId) cautelaToInsert.id_quartel = quartelId;

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
        quantidade_carregadores: magQty,
        id_quartel: quartelId || undefined
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

    // Marcar militar como pendente_devolucao
    const usuariosAtualizados = usuarios.map(u => {
      if (u.matricula === matriculaPolicial) {
        return { ...u, situacao_cautela: 'pendente_devolucao' as const };
      }
      return u;
    });

    // Update local state
    setCautelas(prev => [novaCautela, ...prev]);
    setCautelaItens(prev => [...prev, ...novosItensCautela]);
    setMateriais(materiaisAtualizados);
    setUsuarios(usuariosAtualizados);

    if (!isOnline) {
      enfileirarEAtualizar('EFETIVAR_CAUTELA', { 
        matriculaPolicial, 
        cartItens, 
        observacoes, 
        weaponMagazines, 
        idNewCautela, 
        novosItensCautela, 
        novaCautela 
      });
      salvarCacheLocalCompleto(
        usuariosAtualizados,
        materiaisAtualizados,
        [novaCautela, ...cautelas],
        [...cautelaItens, ...novosItensCautela]
      );
    } else {
      // Sync to Supabase - SEQUENTIALLY to avoid Foreign Key Violations!
      supabase.from('cautelas').insert(cautelaToInsert).then(({ error: errCautela }) => {
        if (errCautela) {
          console.error('Erro ao salvar nova cautela no Supabase:', errCautela);
        } else {
          // Adicionar id_quartel nos itens também
          const itensToInsert = novosItensCautela.map(item => {
            const itemData: any = { ...item };
            if (quartelId) itemData.id_quartel = quartelId;
            return itemData;
          });
          // Insert items only after the parent caution record is successfully saved
          supabase.from('cautela_itens').insert(itensToInsert).then(({ error: errItens }) => {
            if (errItens) {
              console.error('Erro ao salvar itens da cautela no Supabase:', errItens);
            } else {
              // Safety re-fetch 2s after all writes complete to guarantee all clients are in sync
              setTimeout(() => {
                console.log('SGBD: Re-sincronização de segurança pós-cautela...');
                fetchData();
              }, 2000);
            }
          });
        }
      });

      // Update material statuses
      const individualMats = cartItens.filter(id => !materiais.find(m => m.id_material === id)?.controle_quantidade);
      if (individualMats.length > 0) {
        supabase.from('materiais').update({ status_atual: 'cautelado' }).in('id_material', individualMats).then(({ error: errMats }) => {
          if (errMats) {
            console.error('Erro ao atualizar status dos materiais da cautela no Supabase:', errMats);
          }
        });
      }

      // Sincronizar status do militar para pendente_devolucao no Supabase
      supabase.from('usuarios').update({ situacao_cautela: 'pendente_devolucao' }).eq('matricula', matriculaPolicial).then(({ error: errUser }) => {
        if (errUser) {
          console.error('Erro ao atualizar situação do militar para pendente_devolucao:', errUser);
        }
      });
    }

    registrarLogAuditoria(
      armeiroSvcMatricula, 
      'registro_cautela', 
      `Cautela ${idNewCautela} autorizada pelo armeiro para o policial ${user.posto_graduacao || ''} ${user.nome_de_guerra || user.nome} (Matrícula: ${matriculaPolicial}). Itens: ${Object.entries(groupedCart).map(([id, qty]) => `${id} (x${qty})`).join(', ')}.`
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
        item => item.id_cautela === cautId && item.id_material === idMat && !item.estado_devolucao
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
            consumido: true,
            id_quartel: ci.id_quartel
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
            estado_devolucao: condition,
            id_quartel: ci.id_quartel
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
            consumido: true,
            id_quartel: ci.id_quartel
          });
        }
      }
    });

    novosCautelaItens = Array.from(activeItemsMap.values());

    // 3. Verificar se todos os itens foram devolvidos
    const todosItensDaCautela = novosCautelaItens.filter(ci => ci.id_cautela === cautId);
    const todosDevolvidos = todosItensDaCautela.every(ci => !!ci.estado_devolucao);

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
    if (!isOnline) {
      enfileirarEAtualizar('EFETIVAR_DEVOLUCAO', {
        cautId,
        idsMateriaisDevolvidos,
        claimConditions,
        observacoes,
        prorrogar,
        returnedQuantities,
        consumedQuantities,
        agora,
        armeiroResponsavel,
        novosCautelaItens,
        todosDevolvidos,
        policialResponsavel,
        updatedCautela: updatedCautela!
      });
      salvarCacheLocalCompleto(
        usuariosAtualizados,
        materiaisAtualizados,
        cautelasAtualizadas,
        novosCautelaItens
      );
    } else {
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
          let itemsToInsert = todosItensDaCautela;
          if (itemsToInsert.length > 0) {
            itemsToInsert = itemsToInsert.map((ci: any) => {
              const copy = { ...ci };
              if (!copy.id_quartel && quartelId) {
                copy.id_quartel = quartelId;
              }
              return copy;
            });
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

  const adicionarArmaParticular = async (novoItem: Omit<ArmaParticular, 'id_particular' | 'data_deposito' | 'status'>) => {
    const idNew = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    const itemToInsert: ArmaParticular = {
      ...novoItem,
      id_particular: idNew,
      data_deposito: new Date().toISOString(),
      status: 'guardado',
      id_quartel: quartelId || undefined
    };

    setArmasParticulares(prev => [itemToInsert, ...prev]);

    const { error } = await supabase.from('armas_particulares').insert(itemToInsert);
    if (error) {
      console.error('Erro ao sincronizar armas_particulares:', error);
      throw new Error(error.message);
    }

    const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
    registrarLogAuditoria(
      armeiroSvc,
      'registro_cautela',
      `Depósito de armamento particular cadastrado para o policial ${novoItem.matricula_policial}. Item: ${novoItem.modelo} (Tipo: ${novoItem.tipo_item.toUpperCase()}, S/N: ${novoItem.numero_serie || 'N/A'}).`
    );
  };

  const devolverArmasParticulares = async (idsParticulares: string[], matriculaPolicial: string) => {
    const agora = new Date().toISOString();
    const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';

    setArmasParticulares(prev => prev.map(ap => {
      if (idsParticulares.includes(ap.id_particular)) {
        return { ...ap, status: 'devolvido', data_devolucao: agora };
      }
      return ap;
    }));

    const { error } = await supabase
      .from('armas_particulares')
      .update({ status: 'devolvido', data_devolucao: agora })
      .in('id_particular', idsParticulares);

    if (error) {
      console.error('Erro ao devolver armas particulares no Supabase:', error);
      throw new Error(error.message);
    }

    registrarLogAuditoria(
      armeiroSvc,
      'registro_devolucao',
      `Restituição/Devolução de armas particulares concluída para o policial ${matriculaPolicial}. Itens devolvidos: ${idsParticulares.join(', ')}.`
    );
  };

  const adicionarPendencia = async (descricao: string) => {
    const idNew = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });

    const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';

    const novaPendencia: PendenciaServico = {
      id_pendencia: idNew,
      descricao: descricao.trim(),
      status: 'aberto',
      data_criacao: new Date().toISOString(),
      matricula_criador: armeiroSvc,
      id_quartel: quartelId || undefined
    };

    setPendenciasServico(prev => [novaPendencia, ...prev]);

    const { error } = await supabase.from('pendencias_servico').insert(novaPendencia);
    if (error) {
      console.error('Erro ao salvar pendência:', error);
      throw new Error(error.message);
    }

    registrarLogAuditoria(
      armeiroSvc,
      'registro_cautela',
      `Pendência registrada: "${descricao.trim().substring(0, 60)}..." (Criada por: ${armeiroSvc}).`
    );
  };

  const resolverPendencia = async (idPendencia: string, resolucao: string) => {
    const agora = new Date().toISOString();
    const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';

    setPendenciasServico(prev => prev.map(p => {
      if (p.id_pendencia === idPendencia) {
        return { 
          ...p, 
          status: 'resolvido', 
          resolucao: resolucao.trim(), 
          data_resolucao: agora, 
          matricula_resolvedor: armeiroSvc 
        };
      }
      return p;
    }));

    const { error } = await supabase
      .from('pendencias_servico')
      .update({ 
        status: 'resolvido', 
        resolucao: resolucao.trim(), 
        data_resolucao: agora, 
        matricula_resolvedor: armeiroSvc 
      })
      .eq('id_pendencia', idPendencia);

    if (error) {
      console.error('Erro ao resolver pendência no Supabase:', error);
      throw new Error(error.message);
    }

    registrarLogAuditoria(
      armeiroSvc,
      'registro_devolucao',
      `Pendência resolvida: ID ${idPendencia.substring(0, 8)}. Solução: "${resolucao.trim().substring(0, 60)}..." (Resolvida por: ${armeiroSvc}).`
    );
  };

  const alterarSenhaArmeiro = async (matricula: string, novaSenha: string): Promise<{ success: boolean; error?: string }> => {
    const matriculaNorm = matricula.trim().toUpperCase();
    console.log('DEBUG [alterarSenhaArmeiro] - Iniciando com matrícula:', { matriculaNorm, activeArmeiroMatricula });
    
    try {
      console.log('DEBUG [alterarSenhaArmeiro] - Buscando usuário ativo...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('DEBUG [alterarSenhaArmeiro] - Erro ao obter usuário autenticado:', userError);
        return { success: false, error: `Erro ao obter usuário: ${userError.message}` };
      }

      console.log('DEBUG [alterarSenhaArmeiro] - Usuário obtido:', user);

      if (!user) {
        console.log('DEBUG [alterarSenhaArmeiro] - Sem usuário do Supabase Auth (modo local/fallback de rate limit)');
        if (activeArmeiroMatricula && activeArmeiroMatricula.trim().toUpperCase() === matriculaNorm) {
          console.log('DEBUG [alterarSenhaArmeiro] - Matrícula coincide com o ativo. Salvando localmente no SGBD...');
          const hashed = await hashSHA256(novaSenha);
          const { error: dbError } = await supabase
            .from('usuarios')
            .update({ senha_hash: hashed })
            .eq('matricula', matriculaNorm);

          if (dbError) {
            console.error('DEBUG [alterarSenhaArmeiro] - Erro ao alterar senha localmente no banco:', dbError);
            return { success: false, error: `Erro ao atualizar no banco: ${dbError.message}` };
          }

          setUsuarios(prev => prev.map(u => {
            if (u.matricula.trim().toUpperCase() === matriculaNorm) {
              return { ...u, senha_hash: hashed };
            }
            return u;
          }));

          registrarLogAuditoria(
            matriculaNorm,
            'login',
            `Senha do armeiro (Matrícula: ${matriculaNorm}) alterada com sucesso no banco de dados (modo local).`
          );

          console.log('DEBUG [alterarSenhaArmeiro] - Sucesso no modo local.');
          return { success: true };
        }
        console.warn('DEBUG [alterarSenhaArmeiro] - Acesso negado no modo local.');
        return { success: false, error: 'Usuário não autenticado.' };
      }

      // 2. Buscar a matrícula do usuário logado no banco de dados para validar
      console.log('DEBUG [alterarSenhaArmeiro] - Validando usuário no banco com UUID:', user.id);
      const { data: dbUser, error: dbUserError } = await supabase
        .from('usuarios')
        .select('matricula')
        .eq('auth_user_id', user.id)
        .is('deletado_em', null)
        .single();

      console.log('DEBUG [alterarSenhaArmeiro] - Retorno de validação no banco:', { dbUser, dbUserError });

      if (dbUserError || !dbUser) {
        console.warn('DEBUG [alterarSenhaArmeiro] - Usuário não encontrado pelo UUID. Tentando fallback por email...');
        if (user.email && user.email.toUpperCase().startsWith(matriculaNorm)) {
          const { error: authError } = await supabase.auth.updateUser({ password: novaSenha });
          if (authError) {
            console.error('DEBUG [alterarSenhaArmeiro] - Erro no Auth (fallback email):', authError);
            return { success: false, error: `Erro no Auth: ${authError.message}` };
          }
        } else {
          console.error('DEBUG [alterarSenhaArmeiro] - Falha na validação do usuário logado.');
          return { success: false, error: 'Não foi possível validar as credenciais locais do usuário logado.' };
        }
      } else {
        console.log('DEBUG [alterarSenhaArmeiro] - Usuário validado. Matrícula no banco:', dbUser.matricula);
        if (dbUser.matricula.trim().toUpperCase() === matriculaNorm) {
          console.log('DEBUG [alterarSenhaArmeiro] - Atualizando senha no Supabase Auth...');
          const { error: authError } = await supabase.auth.updateUser({ password: novaSenha });
          if (authError) {
            console.error('DEBUG [alterarSenhaArmeiro] - Erro ao alterar senha no Supabase Auth:', authError);
            return { success: false, error: `Erro no Auth: ${authError.message}` };
          }
        } else {
          console.warn('DEBUG [alterarSenhaArmeiro] - Matrícula logada difere da matrícula alvo.');
          return { success: false, error: 'Você só pode alterar a senha do usuário que está atualmente autenticado.' };
        }
      }

      console.log('DEBUG [alterarSenhaArmeiro] - Atualizando senha_hash na tabela usuarios...');
      const hashed = await hashSHA256(novaSenha);
      const { error: dbError } = await supabase
        .from('usuarios')
        .update({ senha_hash: hashed })
        .eq('matricula', matriculaNorm);

      if (dbError) {
        console.error('DEBUG [alterarSenhaArmeiro] - Erro ao alterar senha no SGBD:', dbError);
        return { success: false, error: `Erro ao atualizar no banco: ${dbError.message}` };
      }

      setUsuarios(prev => prev.map(u => {
        if (u.matricula.trim().toUpperCase() === matriculaNorm) {
          return { ...u, senha_hash: hashed };
        }
        return u;
      }));

      registrarLogAuditoria(
        matriculaNorm,
        'login',
        `Senha do armeiro (Matrícula: ${matriculaNorm}) alterada com sucesso no Auth e banco de dados.`
      );

      console.log('DEBUG [alterarSenhaArmeiro] - Senha alterada com sucesso!');
      return { success: true };
    } catch (err: any) {
      console.error('DEBUG [alterarSenhaArmeiro] - Exceção capturada:', err);
      return { success: false, error: err.message || 'Erro inesperado ao alterar senha.' };
    }
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


  // ---- EXCLUIR POLICIAL TOTAL EM CASCATA (ADMIN) ----
  const excluirPolicialTotal = async (matricula: string) => {
    try {
      const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';

      // 1. Obter todas as cautelas deste policial
      const cautelasPolicial = cautelas.filter(c => c.matricula_policial === matricula);
      const idsCautelas = cautelasPolicial.map(c => c.id_cautela);

      // Se houver cautelas, deletar itens e depois as cautelas
      if (idsCautelas.length > 0) {
        // Deletar cautela_itens
        const { error: errItens } = await supabase
          .from('cautela_itens')
          .delete()
          .in('id_cautela', idsCautelas);
        if (errItens) throw errItens;

        // Deletar as cautelas
        const { error: errCautelas } = await supabase
          .from('cautelas')
          .delete()
          .in('id_cautela', idsCautelas);
        if (errCautelas) throw errCautelas;
      }

      // 2. Deletar logs de auditoria executados por ele (se houver)
      const { error: errLogs } = await supabase
        .from('auditoria_logs')
        .delete()
        .eq('matricula_executor', matricula);
      if (errLogs) {
        console.warn('Aviso ao remover logs de auditoria:', errLogs);
      }

      // 3. Deletar o usuário de usuários
      const { error: errUser } = await supabase
        .from('usuarios')
        .delete()
        .eq('matricula', matricula);
      if (errUser) throw errUser;

      // 4. Se havia materiais que estavam com status 'cautelado' em cautelas ativas que foram deletadas,
      // devemos marcá-los como 'disponivel'.
      const activeCautelasIds = cautelasPolicial
        .filter(c => c.status_cautela !== 'devolvida')
        .map(c => c.id_cautela);
      
      const itemsInActiveCautelas = cautelaItens.filter(ci => activeCautelasIds.includes(ci.id_cautela));
      const materialIdsToRelease = itemsInActiveCautelas.map(ci => ci.id_material);

      if (materialIdsToRelease.length > 0) {
        const individualMats = materiais.filter(m => materialIdsToRelease.includes(m.id_material) && !m.controle_quantidade);
        const qtyMats = materiais.filter(m => materialIdsToRelease.includes(m.id_material) && m.controle_quantidade);

        if (individualMats.length > 0) {
          const { error: errMats } = await supabase
            .from('materiais')
            .update({ status_atual: 'disponivel' })
            .in('id_material', individualMats.map(m => m.id_material));
          if (errMats) console.error('Erro ao retornar materiais individuais ao estoque:', errMats);
        }

        for (const mat of qtyMats) {
          const qtyToReturn = itemsInActiveCautelas
            .filter(ci => ci.id_material === mat.id_material)
            .reduce((sum, ci) => sum + ci.quantidade, 0);
          
          const newQty = (mat.quantidade || 0) + qtyToReturn;
          const { error: errQty } = await supabase
            .from('materiais')
            .update({ quantidade: newQty })
            .eq('id_material', mat.id_material);
          if (errQty) console.error(`Erro ao retornar quantidade de ${mat.id_material}:`, errQty);
        }
      }

      // 5. Atualizar os estados locais
      setUsuarios(prev => prev.filter(u => u.matricula !== matricula));
      setCautelas(prev => prev.filter(c => c.matricula_policial !== matricula));
      setCautelaItens(prev => prev.filter(ci => !idsCautelas.includes(ci.id_cautela)));
      if (materialIdsToRelease.length > 0) {
        setMateriais(prev => prev.map(m => {
          if (materialIdsToRelease.includes(m.id_material)) {
            if (!m.controle_quantidade) {
              return { ...m, status_atual: 'disponivel' };
            } else {
              const qtyToReturn = itemsInActiveCautelas
                .filter(ci => ci.id_material === m.id_material)
                .reduce((sum, ci) => sum + ci.quantidade, 0);
              return { ...m, quantidade: (m.quantidade || 0) + qtyToReturn };
            }
          }
          return m;
        }));
      }

      registrarLogAuditoria(
        armeiroSvc,
        'cadastro_militar',
        `EXCLUSÃO TOTAL (ADMIN): Policial matrícula ${matricula} e todos os seus históricos/cautelas foram removidos permanentemente por intervenção do administrador.`
      );

      return { success: true };
    } catch (error: any) {
      console.error('Erro na exclusão total do policial:', error);
      throw error;
    }
  };

  // ---- EXCLUIR MATERIAL TOTAL EM CASCATA (ADMIN) ----
  const excluirMaterialTotal = async (idMaterial: string) => {
    try {
      const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';

      // 1. Deletar do Supabase: cautela_itens
      const { error: errItens } = await supabase
        .from('cautela_itens')
        .delete()
        .eq('id_material', idMaterial);
      if (errItens) throw errItens;

      // 2. Deletar do Supabase: materiais
      const { error: errMaterial } = await supabase
        .from('materiais')
        .delete()
        .eq('id_material', idMaterial);
      if (errMaterial) throw errMaterial;

      // 3. Atualizar estados locais
      setMateriais(prev => prev.filter(m => m.id_material !== idMaterial));
      setCautelaItens(prev => prev.filter(ci => ci.id_material !== idMaterial));

      registrarLogAuditoria(
        armeiroSvc,
        'envio_manutencao',
        `EXCLUSÃO TOTAL (ADMIN): Material S/N: ${idMaterial} foi removido permanentemente da carga e estoque do paiol pelo administrador.`
      );

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao excluir material do estoque:', error);
      throw error;
    }
  };

  // ---- EXCLUIR CAUTELA TOTAL EM CASCATA (ADMIN) ----
  const excluirCautelaTotal = async (idCautela: string) => {
    try {
      const armeiroSvc = activeArmeiroMatricula || usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
      
      const cautelaObj = cautelas.find(c => c.id_cautela === idCautela);
      if (!cautelaObj) throw new Error('Cautela não encontrada localmente.');

      const itensDaCautela = cautelaItens.filter(ci => ci.id_cautela === idCautela);
      const isAtiva = cautelaObj.status_cautela !== 'devolvida';

      // 1. Restaurar o inventário dos materiais associados se a cautela ainda estava ativa
      if (isAtiva && itensDaCautela.length > 0) {
        for (const item of itensDaCautela) {
          const mat = materiais.find(m => m.id_material === item.id_material);
          if (mat) {
            if (!mat.controle_quantidade) {
              const { error: errMat } = await supabase
                .from('materiais')
                .update({ status_atual: 'disponivel' })
                .eq('id_material', item.id_material);
              if (errMat) console.error(`Erro ao restaurar status do material ${item.id_material}:`, errMat);
            } else {
              const newQty = (mat.quantidade || 0) + item.quantidade;
              const { error: errQty } = await supabase
                .from('materiais')
                .update({ quantidade: newQty })
                .eq('id_material', item.id_material);
              if (errQty) console.error(`Erro ao reintegrar quantidade de munição ${item.id_material}:`, errQty);
            }
          }
        }
      }

      // 2. Deletar do Supabase: cautela_itens
      const { error: errItens } = await supabase
        .from('cautela_itens')
        .delete()
        .eq('id_cautela', idCautela);
      if (errItens) throw errItens;

      // 3. Deletar do Supabase: cautelas
      const { error: errCautela } = await supabase
        .from('cautelas')
        .delete()
        .eq('id_cautela', idCautela);
      if (errCautela) throw errCautela;

      // 4. Se o militar ficar sem nenhuma outra cautela ativa, garantir que sua situação não seja 'pendente_devolucao'
      const matriculaPolicial = cautelaObj.matricula_policial;
      const outrasCautelasAtivas = cautelas.filter(c => c.matricula_policial === matriculaPolicial && c.id_cautela !== idCautela && c.status_cautela !== 'devolvida');
      if (outrasCautelasAtivas.length === 0) {
        const polObj = usuarios.find(u => u.matricula === matriculaPolicial);
        if (polObj && polObj.situacao_cautela === 'pendente_devolucao') {
          const { error: errUser } = await supabase
            .from('usuarios')
            .update({ situacao_cautela: 'apto' })
            .eq('matricula', matriculaPolicial);
          if (errUser) console.error(`Erro ao reabilitar policial ${matriculaPolicial}:`, errUser);
        }
      }

      // 5. Atualizar estados locais
      setCautelas(prev => prev.filter(c => c.id_cautela !== idCautela));
      setCautelaItens(prev => prev.filter(ci => ci.id_cautela !== idCautela));
      if (isAtiva && itensDaCautela.length > 0) {
        setMateriais(prev => prev.map(m => {
          const item = itensDaCautela.find(ci => ci.id_material === m.id_material);
          if (item) {
            if (!m.controle_quantidade) {
              return { ...m, status_atual: 'disponivel' };
            } else {
              return { ...m, quantidade: (m.quantidade || 0) + item.quantidade };
            }
          }
          return m;
        }));
      }
      if (outrasCautelasAtivas.length === 0) {
        setUsuarios(prev => prev.map(u => {
          if (u.matricula === matriculaPolicial && u.situacao_cautela === 'pendente_devolucao') {
            return { ...u, situacao_cautela: 'apto' };
          }
          return u;
        }));
      }

      registrarLogAuditoria(
        armeiroSvc,
        'registro_devolucao',
        `EXCLUSÃO TOTAL (ADMIN): Registro da guia de cautela ${idCautela} foi apagado do banco de dados pelo administrador. Estoque revertido.`
      );

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao excluir cautela:', error);
      throw error;
    }
  };

  // ---- FUNÇÕES DE GESTÃO DE QUARTEIS (ADMIN) ----
  const fetchQuarteis = async (): Promise<Quartel[]> => {
    const { data, error } = await supabase
      .from('quarteis')
      .select('*')
      .is('deletado_em', null)
      .order('nome', { ascending: true });
    if (error) {
      console.error('Erro ao buscar quarteis:', error);
      return [];
    }
    setQuarteis(data || []);
    return data || [];
  };

  const criarQuartel = async (slug: string, nome: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase
      .from('quarteis')
      .insert({ slug: slug.toLowerCase().replace(/\s+/g, '-'), nome })
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    setQuarteis(prev => [...prev, data]);
    return { success: true };
  };

  const toggleQuartelAtivo = async (idQuartel: string, ativo: boolean): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
      .from('quarteis')
      .update({ ativo })
      .eq('id', idQuartel);
    if (error) return { success: false, error: error.message };
    setQuarteis(prev => prev.map(q => q.id === idQuartel ? { ...q, ativo } : q));
    return { success: true };
  };

  // ---- AUXILIARES DE MODO OFFLINE ----
  const salvarCacheLocalCompleto = async (
    usersList?: Usuario[],
    matsList?: Material[],
    cautsList?: Cautela[],
    itensList?: CautelaItem[]
  ) => {
    if (!offlineDb.isDbReady) return;
    try {
      if (usersList) await offlineDb.salvarUsuariosLocal(usersList);
      if (matsList) await offlineDb.salvarMateriaisLocal(matsList);
      if (cautsList) await offlineDb.salvarCautelasLocal(cautsList);
      if (itensList) await offlineDb.salvarCautelaItensLocal(itensList);
    } catch (err) {
      console.error('Erro ao atualizar cache local SQLite:', err);
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const processarFilaSincronizacao = async () => {
    if (isSyncing || !offlineDb.isDbReady || !isOnline) return;
    
    setIsSyncing(true);
    console.log('SGBD Sync: Iniciando processamento da fila de sincronização...');
    
    try {
      const fila = await offlineDb.obterFilaSincronizacao();
      if (fila.length === 0) {
        console.log('SGBD Sync: Nenhum item na fila de sincronização.');
        setIsSyncing(false);
        return;
      }
      
      console.log(`SGBD Sync: Encontrados ${fila.length} itens para sincronizar.`);
      
      for (const item of fila) {
        const payload = JSON.parse(item.payload);
        console.log(`SGBD Sync: Processando item ${item.id} - Operação: ${item.operacao}`);
        
        let success = false;
        
        try {
          if (item.operacao === 'EFETIVAR_CAUTELA') {
            const { matriculaPolicial, cartItens, observacoes, weaponMagazines, idNewCautela, novosItensCautela } = payload;
            
            const cautelaToInsert = {
              id_cautela: idNewCautela,
              matricula_policial: matriculaPolicial,
              matricula_armeiro_retirada: payload.novaCautela?.matricula_armeiro_retirada || activeArmeiroMatricula || 'SYS-AM',
              data_retirada: payload.novaCautela?.data_retirada || new Date().toISOString(),
              previsao_devolucao: payload.novaCautela?.previsao_devolucao || new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
              status_cautela: 'ativa',
              observacoes_retirada: observacoes,
              id_quartel: quartelId || undefined
            };

            const { error: errCautela } = await supabase.from('cautelas').insert(cautelaToInsert);
            if (errCautela) throw errCautela;
            
            const itensToInsert = novosItensCautela.map((it: any) => {
              const itemData = { ...it };
              if (quartelId) itemData.id_quartel = quartelId;
              return itemData;
            });
            const { error: errItens } = await supabase.from('cautela_itens').insert(itensToInsert);
            if (errItens) throw errItens;
            
            const individualMats = cartItens.filter((id: string) => !materiais.find(m => m.id_material === id)?.controle_quantidade);
            if (individualMats.length > 0) {
              const { error: errMats } = await supabase.from('materiais').update({ status_atual: 'cautelado' }).in('id_material', individualMats);
              if (errMats) throw errMats;
            }
            
            const { error: errUser } = await supabase.from('usuarios').update({ situacao_cautela: 'pendente_devolucao' }).eq('matricula', matriculaPolicial);
            if (errUser) throw errUser;
            
            success = true;
          } 
          else if (item.operacao === 'EFETIVAR_DEVOLUCAO') {
            const { cautId, idsMateriaisDevolvidos, prorrogar, returnedQuantities, novosCautelaItens, todosDevolvidos, policialResponsavel, updatedCautela } = payload;
            
            for (const idMat of idsMateriaisDevolvidos) {
              let matObj = materiais.find(m => m.id_material === idMat);
              if (!matObj) {
                console.log(`SGBD Sync: Material ${idMat} não encontrado na memória local. Buscando diretamente do SGBD...`);
                const { data: dbMat } = await supabase.from('materiais').select('*').eq('id_material', idMat).single();
                if (dbMat) {
                  matObj = dbMat;
                }
              }

              if (matObj) {
                const fieldsToUpdate = matObj.controle_quantidade 
                  ? { quantidade: (matObj.quantidade || 0) + (returnedQuantities?.[idMat] ?? 0) } 
                  : { status_atual: 'disponivel' };
                const { error: errMat } = await supabase.from('materiais').update(fieldsToUpdate).eq('id_material', idMat);
                if (errMat) throw errMat;
              } else {
                console.warn(`SGBD Sync: Material ${idMat} não localizado de forma alguma. Executando atualização padrão para 'disponivel'...`);
                const { error: errMat } = await supabase.from('materiais').update({ status_atual: 'disponivel' }).eq('id_material', idMat);
                if (errMat) throw errMat;
              }
            }
            
            const { error: errDel } = await supabase.from('cautela_itens').delete().eq('id_cautela', cautId);
            if (errDel) throw errDel;
            
            let itemsToInsert = novosCautelaItens.filter((ci: any) => ci.id_cautela === cautId);
            if (itemsToInsert.length > 0) {
              itemsToInsert = itemsToInsert.map((ci: any) => {
                const copy = { ...ci };
                if (!copy.id_quartel && quartelId) {
                  copy.id_quartel = quartelId;
                }
                return copy;
              });
              const { error: errIns } = await supabase.from('cautela_itens').insert(itemsToInsert);
              if (errIns) throw errIns;
            }
            
            const { error: errCaut } = await supabase.from('cautelas').update(updatedCautela).eq('id_cautela', cautId);
            if (errCaut) throw errCaut;
            
            if (todosDevolvidos) {
              const { error: errUser } = await supabase.from('usuarios').update({ situacao_cautela: 'apto' }).eq('matricula', policialResponsavel);
              if (errUser) throw errUser;
            }
            
            success = true;
          }
          else if (item.operacao === 'SALVAR_OCORRENCIA') {
            const { novaOco } = payload;
            const { error: errOco } = await supabase.from('ocorrencias').insert(novaOco);
            if (errOco) throw errOco;
            success = true;
          }
          else if (item.operacao === 'CADASTRAR_SENHA') {
            const { matricula, hashed } = payload;
            const { error } = await supabase.from('usuarios').update({ senha_hash: hashed }).eq('matricula', matricula);
            if (error) throw error;
            success = true;
          }
          else if (item.operacao === 'CADASTRAR_POLICIAL') {
            const { userToInsert, rawSenha } = payload;
            const { error: errInsert } = await supabase.from('usuarios').upsert({
              ...userToInsert,
              deletado_em: null
            });
            if (errInsert) throw errInsert;
            
            if (userToInsert.perfil === 'armeiro_gestor' && rawSenha) {
              try {
                let slugQuartel = 'cavalaria';
                const quartelEmMemoria = quarteis.find(q => q.id === userToInsert.id_quartel);
                if (quartelEmMemoria && quartelEmMemoria.slug) {
                  slugQuartel = quartelEmMemoria.slug;
                }
                const emailCalculado = `${userToInsert.matricula.trim().toLowerCase()}@${slugQuartel.trim().toLowerCase()}.pm`;
                
                await supabase.functions.invoke('criar-armeiro-auth', {
                  body: { 
                    matricula: userToInsert.matricula, 
                    senha: rawSenha,
                    email: emailCalculado
                  }
                });
              } catch (funcErr) {
                console.warn('SGBD Sync: Erro ao criar armeiro no Auth durante a sincronização:', funcErr);
              }
            }
            success = true;
          }
          
          if (success) {
            console.log(`SGBD Sync: Item ${item.id} processado com sucesso. Removendo da fila...`);
            await offlineDb.removerTransacaoFila(item.id);
            setSyncQueueErrors(prev => {
              const copy = { ...prev };
              delete copy[item.id];
              return copy;
            });
          }
        } catch (opError: any) {
          const errMsg = opError?.message || String(opError);
          console.error(`SGBD Sync: Erro ao sincronizar item ${item.id}:`, opError);
          setSyncQueueErrors(prev => ({
            ...prev,
            [item.id]: errMsg
          }));
          break;
        }
      }
      
      console.log('SGBD Sync: Sincronização offline concluída, atualizando dados locais...');
      await carregarFilaSincronizacao();
      fetchData();
    } catch (err) {
      console.error('SGBD Sync: Erro geral no sync worker:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (isOnline && offlineDb.isDbReady) {
      processarFilaSincronizacao();
    }
  }, [isOnline, offlineDb.isDbReady]);

  // ---- ISOLAMENTO DE DADOS MULTI-QUARTEL NO FRONTEND (DUPLA CAMADA) ----
  // Se o quartelId estiver ativo, limitamos os dados apenas ao quartel do armeiro/painel selecionado.
  // Admins sem quartel ativo selecionado (painel administrativo global) continuam vendo tudo.
  const isUserAdmin = activeArmeiroMatricula?.trim().toUpperCase() === 'ADMIN';

  const usuariosExibidos = (isUserAdmin && !quartelId)
    ? usuarios
    : usuarios.filter(u => u.perfil === 'admin' || u.id_quartel === quartelId);

  const materiaisExibidos = (isUserAdmin && !quartelId)
    ? materiais
    : materiais.filter(m => m.id_quartel === quartelId);

  const cautelasExibidas = (isUserAdmin && !quartelId)
    ? cautelas
    : cautelas.filter(c => c.id_quartel === quartelId);

  // Vincular cautela_itens ao quartel através da própria cautela
  const cautelaItensExibidos = (isUserAdmin && !quartelId)
    ? cautelaItens
    : cautelaItens.filter(item => {
        const cautela = cautelas.find(c => c.id_cautela === item.id_cautela);
        return !cautela || cautela.id_quartel === quartelId;
      });

  const ocorrenciasExibidas = (isUserAdmin && !quartelId)
    ? ocorrencias
    : ocorrencias.filter(o => o.id_quartel === quartelId);

  const armasParticularesExibidas = (isUserAdmin && !quartelId)
    ? armasParticulares
    : armasParticulares.filter(ap => ap.id_quartel === quartelId);

  const pendenciasServicoExibidas = (isUserAdmin && !quartelId)
    ? pendenciasServico
    : pendenciasServico.filter(ps => ps.id_quartel === quartelId);

  const auditoriaLogsExibidos = (isUserAdmin && !quartelId)
    ? auditoriaLogs
    : auditoriaLogs.filter(al => al.id_quartel === quartelId);

  const exportarDadosCompletos = async () => {
    const [
      { data: quarteisData },
      { data: usuariosData },
      { data: categoriasData },
      { data: modelosArmasData },
      { data: materiaisData },
      { data: cautelasData },
      { data: cautelaItensData },
      { data: armasParticularesData },
      { data: pendenciasServicoData },
      { data: ocorrenciasData },
      { data: auditoriaLogsData }
    ] = await Promise.all([
      supabase.from('quarteis').select('*').is('deletado_em', null),
      supabase.from('usuarios').select('*').is('deletado_em', null),
      supabase.from('categorias').select('*'),
      supabase.from('modelos_armas').select('*'),
      supabase.from('materiais').select('*').is('deletado_em', null),
      supabase.from('cautelas').select('*').is('deletado_em', null),
      supabase.from('cautela_itens').select('*').is('deletado_em', null),
      supabase.from('armas_particulares').select('*').is('deletado_em', null),
      supabase.from('pendencias_servico').select('*').is('deletado_em', null),
      supabase.from('ocorrencias').select('*').is('deletado_em', null),
      supabase.from('auditoria_logs').select('*')
    ]);

    return {
      quarteis: quarteisData || [],
      usuarios: usuariosData || [],
      categorias: categoriasData || [],
      modelos_armas: modelosArmasData || [],
      materiais: materiaisData || [],
      cautelas: cautelasData || [],
      cautela_itens: cautelaItensData || [],
      armas_particulares: armasParticularesData || [],
      pendencias_servico: pendenciasServicoData || [],
      ocorrencias: ocorrenciasData || [],
      auditoria_logs: auditoriaLogsData || [],
    };
  };

  return {
    usuarios: usuariosExibidos,
    setUsuarios,
    materiais: materiaisExibidos,
    setMateriais,
    categorias,
    setCategorias,
    cautelas: cautelasExibidas,
    setCautelas,
    cautelaItens: cautelaItensExibidos,
    setCautelaItens,
    auditoriaLogs: auditoriaLogsExibidos,
    setAuditoriaLogs,
    ocorrencias: ocorrenciasExibidas,
    setOcorrencias,
    modelosArmas,
    adicionarModeloArma,
    resetDatabase,
    importarBackupDatabase,
    exportarDadosCompletos,
    registrarLogAuditoria,
    cadastrarSenha,
    cadastrarPolicial,
    editarPolicial,
    excluirUsuario,
    excluirPolicialTotal,
    excluirMaterialTotal,
    excluirCautelaTotal,
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
    armasParticulares: armasParticularesExibidas,
    adicionarArmaParticular,
    devolverArmasParticulares,
    pendenciasServico: pendenciasServicoExibidas,
    adicionarPendencia,
    resolverPendencia,
    // Multi-quartel
    quarteis,
    fetchQuarteis,
    criarQuartel,
    toggleQuartelAtivo,
    isLoading,
    dbError,
    offlineDbError: offlineDb.dbError,
    isOnline,
    isSyncing,
    filaSincronizacao,
    removerItemFilaSincronizacao,
    forcarSincronizacao: processarFilaSincronizacao,
    limparFilaSincronizacao,
    syncQueueErrors
  };
}
