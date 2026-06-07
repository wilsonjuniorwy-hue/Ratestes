import { useState, useEffect } from 'react';
import { Usuario, Material, Cautela, CautelaItem, OcorrenciaRelatorio, AuditoriaLog } from '../types';

const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

export function useOfflineDatabase() {
  const [dbInstance, setDbInstance] = useState<any>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Inicializar o banco SQLite local do Tauri (ou fallback em navegador)
  useEffect(() => {
    if (!isTauri) {
      console.log('SGBD Offline: Executando fora do Tauri. Modo de simulação ativado.');
      setIsDbReady(true);
      return;
    }

    let activeDb: any = null;

    async function initDb() {
      try {
        setDbError(null);
        // Importação dinâmica para evitar quebras em navegadores fora do Tauri
        const Database = (await import('@tauri-apps/plugin-sql')).default;
        console.log('SGBD Offline: Inicializando SQLite local (reserva_local.db)...');
        
        const db = await Database.load('sqlite:reserva_local.db');
        activeDb = db;
        setDbInstance(db);

        // Criar tabelas necessárias para o cache local e fila de contingência
        await db.execute(`
          CREATE TABLE IF NOT EXISTS usuarios (
            matricula TEXT PRIMARY KEY,
            nome TEXT,
            nome_de_guerra TEXT,
            perfil TEXT,
            posto_graduacao TEXT,
            situacao_cautela TEXT,
            data_ultimo_teste_psicologico TEXT,
            senha_hash TEXT,
            id_quartel TEXT,
            tentativas_login INTEGER DEFAULT 0,
            bloqueado_ate TEXT DEFAULT NULL
          );
        `);

        // Executar migrações caso as novas colunas ainda não existam no SQLite local
        try {
          await db.execute('ALTER TABLE usuarios ADD COLUMN tentativas_login INTEGER DEFAULT 0;');
          console.log('SGBD Offline: Coluna tentativas_login adicionada à tabela usuarios.');
        } catch (_) {
          // A coluna já existe ou tabela não foi alterada
        }

        try {
          await db.execute('ALTER TABLE usuarios ADD COLUMN bloqueado_ate TEXT DEFAULT NULL;');
          console.log('SGBD Offline: Coluna bloqueado_ate adicionada à tabela usuarios.');
        } catch (_) {
          // A coluna já existe ou tabela não foi alterada
        }

        await db.execute(`
          CREATE TABLE IF NOT EXISTS materiais (
            id_material TEXT PRIMARY KEY,
            id_categoria TEXT,
            modelo TEXT,
            fabricante TEXT,
            calibre TEXT,
            status_atual TEXT,
            quantidade INTEGER,
            controle_quantidade INTEGER,
            id_quartel TEXT
          );
        `);

        await db.execute(`
          CREATE TABLE IF NOT EXISTS cautelas (
            id_cautela TEXT PRIMARY KEY,
            matricula_policial TEXT,
            matricula_armeiro_retirada TEXT,
            data_retirada TEXT,
            previsao_devolucao TEXT,
            status_cautela TEXT,
            observacoes_retirada TEXT,
            id_quartel TEXT
          );
        `);

        await db.execute(`
          CREATE TABLE IF NOT EXISTS fila_sincronizacao (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            operacao TEXT NOT NULL,
            payload TEXT NOT NULL
          );
        `);

        await db.execute(`
          CREATE TABLE IF NOT EXISTS cautela_itens (
            id_cautela_item TEXT PRIMARY KEY,
            id_cautela TEXT,
            id_material TEXT,
            quantidade INTEGER,
            estado_entrega TEXT,
            estado_devolucao TEXT,
            consumido INTEGER,
            quantidade_carregadores INTEGER,
            id_quartel TEXT
          );
        `);

        console.log('SGBD Offline: Banco de dados SQLite local inicializado com sucesso.');
        setIsDbReady(true);
      } catch (err: any) {
        console.error('SGBD Offline: Erro ao inicializar SQLite local:', err);
        setDbError(err?.message || String(err));
      }
    }

    initDb();
  }, []);

  // ---- MÉTODOS DE ESCRITA / CACHE LOCAL ----

  const salvarUsuariosLocal = async (usuariosList: Usuario[]) => {
    if (!isDbReady) return;
    if (!isTauri) {
      localStorage.setItem('offline_cache_usuarios', JSON.stringify(usuariosList));
      return;
    }

    try {
      await dbInstance.execute('DELETE FROM usuarios');
      for (const u of usuariosList) {
        await dbInstance.execute(
          `INSERT OR REPLACE INTO usuarios 
          (matricula, nome, nome_de_guerra, perfil, posto_graduacao, situacao_cautela, data_ultimo_teste_psicologico, senha_hash, id_quartel, tentativas_login, bloqueado_ate) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            u.matricula !== undefined ? u.matricula : null,
            u.nome !== undefined ? u.nome : null,
            u.nome_de_guerra !== undefined && u.nome_de_guerra !== null ? u.nome_de_guerra : null,
            u.perfil !== undefined ? u.perfil : null,
            u.posto_graduacao !== undefined ? u.posto_graduacao : null,
            u.situacao_cautela !== undefined ? u.situacao_cautela : null,
            u.data_ultimo_teste_psicologico !== undefined && u.data_ultimo_teste_psicologico !== null ? u.data_ultimo_teste_psicologico : null,
            u.senha_hash !== undefined ? u.senha_hash : null,
            u.id_quartel !== undefined && u.id_quartel !== null ? u.id_quartel : null,
            u.tentativas_login !== undefined && u.tentativas_login !== null ? u.tentativas_login : 0,
            u.bloqueado_ate !== undefined && u.bloqueado_ate !== null ? u.bloqueado_ate : null
          ]
        );
      }
      console.log(`SGBD Offline: ${usuariosList.length} policiais salvos no cache SQLite.`);
    } catch (err) {
      console.error('SGBD Offline: Erro ao salvar policiais localmente:', err);
    }
  };

  const salvarMateriaisLocal = async (materiaisList: Material[]) => {
    if (!isDbReady) return;
    if (!isTauri) {
      localStorage.setItem('offline_cache_materiais', JSON.stringify(materiaisList));
      return;
    }

    try {
      await dbInstance.execute('DELETE FROM materiais');
      for (const m of materiaisList) {
        await dbInstance.execute(
          `INSERT OR REPLACE INTO materiais 
          (id_material, id_categoria, modelo, fabricante, calibre, status_atual, quantidade, controle_quantidade, id_quartel) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            m.id_material !== undefined ? m.id_material : null,
            m.id_categoria !== undefined ? m.id_categoria : null,
            m.modelo !== undefined ? m.modelo : null,
            m.fabricante !== undefined && m.fabricante !== null ? m.fabricante : null,
            m.calibre !== undefined && m.calibre !== null ? m.calibre : null,
            m.status_atual !== undefined ? m.status_atual : null,
            m.quantidade !== undefined && m.quantidade !== null ? m.quantidade : 0,
            m.controle_quantidade ? 1 : 0,
            m.id_quartel !== undefined && m.id_quartel !== null ? m.id_quartel : null
          ]
        );
      }
      console.log(`SGBD Offline: ${materiaisList.length} materiais salvos no cache SQLite.`);
    } catch (err) {
      console.error('SGBD Offline: Erro ao salvar materiais localmente:', err);
    }
  };

  const salvarCautelasLocal = async (cautelasList: Cautela[]) => {
    if (!isDbReady) return;
    if (!isTauri) {
      localStorage.setItem('offline_cache_cautelas', JSON.stringify(cautelasList));
      return;
    }

    try {
      await dbInstance.execute('DELETE FROM cautelas');
      for (const c of cautelasList) {
        await dbInstance.execute(
          `INSERT OR REPLACE INTO cautelas 
          (id_cautela, matricula_policial, matricula_armeiro_retirada, data_retirada, previsao_devolucao, status_cautela, observacoes_retirada, id_quartel) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            c.id_cautela !== undefined ? c.id_cautela : null,
            c.matricula_policial !== undefined ? c.matricula_policial : null,
            c.matricula_armeiro_retirada !== undefined && c.matricula_armeiro_retirada !== null ? c.matricula_armeiro_retirada : null,
            c.data_retirada !== undefined ? c.data_retirada : null,
            c.previsao_devolucao !== undefined && c.previsao_devolucao !== null ? c.previsao_devolucao : null,
            c.status_cautela !== undefined ? c.status_cautela : null,
            c.observacoes_retirada !== undefined && c.observacoes_retirada !== null ? c.observacoes_retirada : null,
            c.id_quartel !== undefined && c.id_quartel !== null ? c.id_quartel : null
          ]
        );
      }
      console.log(`SGBD Offline: ${cautelasList.length} cautelas salvas no cache SQLite.`);
    } catch (err) {
      console.error('SGBD Offline: Erro ao salvar cautelas localmente:', err);
    }
  };

  const salvarCautelaItensLocal = async (itensList: CautelaItem[]) => {
    if (!isDbReady) return;
    if (!isTauri) {
      localStorage.setItem('offline_cache_cautela_itens', JSON.stringify(itensList));
      return;
    }

    try {
      await dbInstance.execute('DELETE FROM cautela_itens');
      for (const item of itensList) {
        await dbInstance.execute(
          `INSERT OR REPLACE INTO cautela_itens 
          (id_cautela_item, id_cautela, id_material, quantidade, estado_entrega, estado_devolucao, consumido, quantidade_carregadores, id_quartel) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id_cautela_item !== undefined ? item.id_cautela_item : null,
            item.id_cautela !== undefined ? item.id_cautela : null,
            item.id_material !== undefined ? item.id_material : null,
            item.quantidade !== undefined && item.quantidade !== null ? item.quantidade : 0,
            item.estado_entrega !== undefined && item.estado_entrega !== null ? item.estado_entrega : null,
            item.estado_devolucao !== undefined && item.estado_devolucao !== null ? item.estado_devolucao : null,
            item.consumido ? 1 : 0,
            item.quantidade_carregadores !== undefined && item.quantidade_carregadores !== null ? item.quantidade_carregadores : 0,
            item.id_quartel !== undefined && item.id_quartel !== null ? item.id_quartel : null
          ]
        );
      }
      console.log(`SGBD Offline: ${itensList.length} itens de cautela salvos no cache SQLite.`);
    } catch (err) {
      console.error('SGBD Offline: Erro ao salvar itens de cautela localmente:', err);
    }
  };

  // ---- MÉTODOS DE LEITURA LOCAL (QUANDO OFFLINE) ----

  const obterUsuariosLocal = async (): Promise<Usuario[]> => {
    if (!isDbReady) return [];
    if (!isTauri) {
      const raw = localStorage.getItem('offline_cache_usuarios');
      return raw ? JSON.parse(raw) : [];
    }

    try {
      const rows = await dbInstance.select('SELECT * FROM usuarios');
      return rows.map((r: any) => ({
        matricula: r.matricula,
        nome: r.nome,
        nome_de_guerra: r.nome_de_guerra,
        perfil: r.perfil,
        posto_graduacao: r.posto_graduacao,
        situacao_cautela: r.situacao_cautela,
        data_ultimo_teste_psicologico: r.data_ultimo_teste_psicologico,
        senha_hash: r.senha_hash,
        id_quartel: r.id_quartel,
        tentativas_login: r.tentativas_login !== undefined ? r.tentativas_login : 0,
        bloqueado_ate: r.bloqueado_ate || null
      }));
    } catch (err) {
      console.error('SGBD Offline: Erro ao ler policiais do SQLite:', err);
      return [];
    }
  };

  const obterMateriaisLocal = async (): Promise<Material[]> => {
    if (!isDbReady) return [];
    if (!isTauri) {
      const raw = localStorage.getItem('offline_cache_materiais');
      return raw ? JSON.parse(raw) : [];
    }

    try {
      const rows = await dbInstance.select('SELECT * FROM materiais');
      return rows.map((r: any) => ({
        id_material: r.id_material,
        id_categoria: r.id_categoria,
        modelo: r.modelo,
        fabricante: r.fabricante,
        calibre: r.calibre,
        status_atual: r.status_atual,
        quantidade: r.quantidade,
        controle_quantidade: r.controle_quantidade === 1,
        id_quartel: r.id_quartel
      }));
    } catch (err) {
      console.error('SGBD Offline: Erro ao ler materiais do SQLite:', err);
      return [];
    }
  };

  const obterCautelasLocal = async (): Promise<Cautela[]> => {
    if (!isDbReady) return [];
    if (!isTauri) {
      const raw = localStorage.getItem('offline_cache_cautelas');
      return raw ? JSON.parse(raw) : [];
    }

    try {
      const rows = await dbInstance.select('SELECT * FROM cautelas');
      return rows.map((r: any) => ({
        id_cautela: r.id_cautela,
        matricula_policial: r.matricula_policial,
        matricula_armeiro_retirada: r.matricula_armeiro_retirada,
        data_retirada: r.data_retirada,
        previsao_devolucao: r.previsao_devolucao,
        status_cautela: r.status_cautela,
        observacoes_retirada: r.observacoes_retirada,
        id_quartel: r.id_quartel
      }));
    } catch (err) {
      console.error('SGBD Offline: Erro ao ler cautelas do SQLite:', err);
      return [];
    }
  };

  const obterCautelaItensLocal = async (): Promise<CautelaItem[]> => {
    if (!isDbReady) return [];
    if (!isTauri) {
      const raw = localStorage.getItem('offline_cache_cautela_itens');
      return raw ? JSON.parse(raw) : [];
    }

    try {
      const rows = await dbInstance.select('SELECT * FROM cautela_itens');
      return rows.map((r: any) => ({
        id_cautela_item: r.id_cautela_item,
        id_cautela: r.id_cautela,
        id_material: r.id_material,
        quantidade: r.quantidade,
        estado_entrega: r.estado_entrega,
        estado_devolucao: r.estado_devolucao || undefined,
        consumido: r.consumido === 1,
        quantidade_carregadores: r.quantidade_carregadores,
        id_quartel: r.id_quartel || undefined
      }));
    } catch (err) {
      console.error('SGBD Offline: Erro ao ler itens de cautela do SQLite:', err);
      return [];
    }
  };

  // ---- GESTÃO DE TRANSACÕES OFFLINE (FILA DE SINCRONIZAÇÃO) ----

  const enfileirarTransacaoOffline = async (operacao: string, payload: any) => {
    if (!isDbReady) return;
    const nowStr = new Date().toISOString();
    const payloadStr = JSON.stringify(payload);

    if (!isTauri) {
      const raw = localStorage.getItem('offline_fila_sincronizacao');
      const fila = raw ? JSON.parse(raw) : [];
      fila.push({ id: Date.now(), timestamp: nowStr, operacao, payload: payloadStr });
      localStorage.setItem('offline_fila_sincronizacao', JSON.stringify(fila));
      console.log(`SGBD Offline: Transação enfileirada no localStorage: ${operacao}`);
      return;
    }

    try {
      await dbInstance.execute(
        'INSERT INTO fila_sincronizacao (timestamp, operacao, payload) VALUES (?, ?, ?)',
        [nowStr, operacao, payloadStr]
      );
      console.log(`SGBD Offline: Transação enfileirada no SQLite: ${operacao}`);
    } catch (err) {
      console.error('SGBD Offline: Erro ao enfileirar transação local:', err);
    }
  };

  const obterFilaSincronizacao = async (): Promise<Array<{ id: number; timestamp: string; operacao: string; payload: string }>> => {
    if (!isDbReady) return [];
    if (!isTauri) {
      const raw = localStorage.getItem('offline_fila_sincronizacao');
      return raw ? JSON.parse(raw) : [];
    }

    try {
      return await dbInstance.select('SELECT * FROM fila_sincronizacao ORDER BY id ASC');
    } catch (err) {
      console.error('SGBD Offline: Erro ao ler fila de sincronização:', err);
      return [];
    }
  };

  const removerTransacaoFila = async (id: number) => {
    if (!isDbReady) return;
    if (!isTauri) {
      const raw = localStorage.getItem('offline_fila_sincronizacao');
      if (raw) {
        const fila = JSON.parse(raw);
        const novaFila = fila.filter((item: any) => item.id !== id);
        localStorage.setItem('offline_fila_sincronizacao', JSON.stringify(novaFila));
      }
      return;
    }

    try {
      await dbInstance.execute('DELETE FROM fila_sincronizacao WHERE id = ?', [id]);
    } catch (err) {
      console.error('SGBD Offline: Erro ao remover transação da fila:', err);
    }
  };

  return {
    isDbReady,
    dbError,
    salvarUsuariosLocal,
    salvarMateriaisLocal,
    salvarCautelasLocal,
    salvarCautelaItensLocal,
    obterUsuariosLocal,
    obterMateriaisLocal,
    obterCautelasLocal,
    obterCautelaItensLocal,
    enfileirarTransacaoOffline,
    obterFilaSincronizacao,
    removerTransacaoFila
  };
}
