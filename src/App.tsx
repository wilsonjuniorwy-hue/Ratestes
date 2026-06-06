/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { motion } from 'motion/react';
import FlowSimulator from './components/FlowSimulator';
import { useSupabaseDatabase } from './hooks/useSupabaseDatabase';
import LoginPortal from './components/LoginPortal';
import { AdminPanelView } from './components/AdminPanelView';
import { Usuario, Quartel } from './types';
import { supabase, configurarAssinaturaDispositivo, obterAmbienteAtual, alterarAmbiente } from './supabaseClient';

export default function App() {
  const [activeArmeiroMatricula, setActiveArmeiroMatricula] = useState<string>(() => {
    return sessionStorage.getItem('activeArmeiroMatricula') || '';
  });
  const [authenticatedArmeiro, setAuthenticatedArmeiro] = useState<Usuario | null>(() => {
    const saved = sessionStorage.getItem('authenticatedArmeiro');
    return saved ? JSON.parse(saved) : null;
  });
  const [quartelAtivo, setQuartelAtivo] = useState<Quartel | null>(() => {
    const saved = sessionStorage.getItem('quartelAtivo');
    return saved ? JSON.parse(saved) : null;
  });
  // Rota interna: 'login' | 'admin_panel' | 'sistema'
  const [rota, setRota] = useState<'login' | 'admin_panel' | 'sistema'>(() => {
    return (sessionStorage.getItem('rota') as any) || 'login';
  });

  const [tauriStatus, setTauriStatus] = useState<'checking' | 'not_tauri' | 'authorized' | 'unauthorized' | 'suspended' | 'blocked' | 'error' | 'pending_approval'>('checking');
  const [deviceSignature, setDeviceSignature] = useState<string>('');
  const [nomeDispositivo, setNomeDispositivo] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [bypassCode, setBypassCode] = useState<string>('');
  const [bypassError, setBypassError] = useState<string>('');

  const db = useSupabaseDatabase(activeArmeiroMatricula, quartelAtivo?.id ?? null, tauriStatus === 'authorized');

  const [activeSession, setActiveSession] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setActiveSession(session);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('DEBUG [onAuthStateChange] - Evento:', event);
      setActiveSession(session);
      setAuthChecked(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    let active = true;

    async function handleSessionChange() {
      if (activeSession) {
        if (sessionStorage.getItem('logging_in') === 'true') {
          return;
        }

        const userUuid = activeSession.user.id;
        try {
          const { data: dbUser, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_user_id', userUuid)
            .single();

          if (!active) return;

          if (!error && dbUser && dbUser.perfil !== 'policial') {
            setAuthenticatedArmeiro(dbUser);
            setActiveArmeiroMatricula(dbUser.matricula);
            sessionStorage.setItem('activeArmeiroMatricula', dbUser.matricula);
            sessionStorage.setItem('authenticatedArmeiro', JSON.stringify(dbUser));

            // Restaurar o quartelAtivo se não estiver no sessionStorage mas estiver no dbUser
            if (dbUser.perfil === 'armeiro_gestor' && dbUser.id_quartel) {
              const savedQuartel = sessionStorage.getItem('quartelAtivo');
              if (!savedQuartel) {
                const { data: qData } = await supabase
                  .from('quarteis')
                  .select('*')
                  .eq('id', dbUser.id_quartel)
                  .maybeSingle();

                if (active && qData) {
                  setQuartelAtivo(qData);
                  sessionStorage.setItem('quartelAtivo', JSON.stringify(qData));
                }
              }
            }

            const savedRota = sessionStorage.getItem('rota') as any;
            if (!savedRota || savedRota === 'login') {
              const novaRota = dbUser.perfil === 'admin' ? 'admin_panel' : 'sistema';
              setRota(novaRota);
              sessionStorage.setItem('rota', novaRota);
            }
          }
        } catch (err) {
          console.error('Erro ao restaurar sessão:', err);
        }
      } else {
        if (sessionStorage.getItem('logging_in') !== 'true') {
          setAuthenticatedArmeiro(null);
          setActiveArmeiroMatricula('');
          setQuartelAtivo(null);
          setRota('login');
          sessionStorage.removeItem('activeArmeiroMatricula');
          sessionStorage.removeItem('authenticatedArmeiro');
          sessionStorage.removeItem('quartelAtivo');
          sessionStorage.removeItem('rota');
        }
      }
    }

    handleSessionChange();

    return () => {
      active = false;
    };
  }, [activeSession, authChecked]);
  
  useEffect(() => {
    async function checkDevice() {
      const isTauri = typeof window !== 'undefined' && (
        (window as any).__TAURI__ !== undefined ||
        (window as any).__TAURI_INTERNALS__ !== undefined
      );
      
      // Permitir acesso no navegador durante desenvolvimento ou homologação local para testes
      const isLocalDevOrStaging = import.meta.env.DEV || import.meta.env.MODE === 'staging';

      if (!isTauri) {
        if (isLocalDevOrStaging) {
          console.warn('[TAURI CHECK] Rodando fora do Tauri, mas liberado por estar em modo Desenvolvimento/Staging.');
          setTauriStatus('authorized');
        } else {
          setTauriStatus('not_tauri');
        }
        return;
      }
      
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const signature = await invoke<string>('obter_assinatura_fisica');
        setDeviceSignature(signature);
        
        configurarAssinaturaDispositivo(signature);
        
        const { data, error } = await supabase.rpc('verificar_dispositivo', { p_uuid: signature });
        
        if (error) {
          console.error('Erro ao verificar dispositivo:', error);
          setTauriStatus('error');
          return;
        }
        
        const result = data as any;
        const info = Array.isArray(result) ? result[0] : result;
        
        if (info && info.existe) {
          if (info.status === 'ativo') {
            setTauriStatus('authorized');
          } else if (info.status === 'suspenso') {
            setTauriStatus('suspended');
          } else if (info.status === 'bloqueado') {
            setTauriStatus('blocked');
          } else if (info.status === 'pendente') {
            setTauriStatus('pending_approval');
          } else {
            setTauriStatus('unauthorized');
          }
        } else {
          setTauriStatus('unauthorized');
        }
      } catch (err) {
        console.error('Erro na validação do hardware:', err);
        setTauriStatus('error');
      }
    }
    
    checkDevice();
  }, []);

  const handleSolicitarHomologacao = async () => {
    if (!nomeDispositivo.trim()) return;
    setIsRegistering(true);
    try {
      const { error } = await supabase
        .from('dispositivos_autorizados')
        .insert({
          uuid_hardware: deviceSignature,
          nome_dispositivo: nomeDispositivo,
          status: 'pendente'
        });
      if (error) throw error;
      
      alert('Solicitação enviada com sucesso! Aguarde a aprovação do Administrador no painel.');
      setTauriStatus('pending_approval');
    } catch (err) {
      console.error('Erro ao cadastrar dispositivo:', err);
      alert('Falha ao enviar solicitação.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleAplicarBypass = async () => {
    if (!bypassCode.trim()) return;
    try {
      const { data, error } = await supabase.rpc('validar_codigo_bypass', { p_codigo: bypassCode });
      if (error) throw error;
      
      if (data) {
        setTauriStatus('authorized');
        alert('Bypass de emergência ativado! Acesso liberado por 24 horas.');
      } else {
        setBypassError('Código inválido, já utilizado ou expirado.');
      }
    } catch (err) {
      console.error('Erro ao validar bypass:', err);
      setBypassError('Erro na conexão para validar o código.');
    }
  };

  const renderLockScreen = () => {
    const iconMap: Record<string, string> = {
      checking: '🔄',
      not_tauri: '🚫',
      unauthorized: '🔒',
      pending_approval: '⏳',
      suspended: '🛠️',
      blocked: '⚠️',
      error: '❌'
    };

    const titleMap: Record<string, string> = {
      checking: 'Autenticando Dispositivo...',
      not_tauri: 'Acesso Não Autorizado',
      unauthorized: 'Homologação Pendente',
      pending_approval: 'Aguardando Homologação',
      suspended: 'Dispositivo Suspenso',
      blocked: 'Dispositivo Bloqueado',
      error: 'Erro de Integridade'
    };

    const descMap: Record<string, string> = {
      checking: 'Verificando as chaves de segurança física da máquina no banco de dados cloud...',
      not_tauri: 'Este sistema de segurança tática (PMDF) só pode ser acessado através do aplicativo desktop homologado.',
      unauthorized: 'Esta máquina ainda não está homologada para realizar cautelas nesta armaria.',
      pending_approval: 'Sua solicitação de homologação já foi enviada ao banco de dados e está aguardando liberação de um Administrador no painel de controle.',
      suspended: 'Este computador foi suspenso temporariamente pela administração para manutenção ou movimentação física.',
      blocked: 'Esta máquina foi bloqueada por razões de segurança ou violação de políticas de acesso.',
      error: 'Não foi possível validar a assinatura física da máquina. Verifique a conexão com o banco de dados.'
    };

    return (
      <div className="fixed inset-0 bg-slate-955 flex items-center justify-center p-6 z-[9999] overflow-auto">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/30 rounded-full flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(59,130,246,0.15)] animate-pulse">
            {iconMap[tauriStatus] || '🔒'}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-mono text-white uppercase tracking-wider">
              {titleMap[tauriStatus] || 'Bloqueio de Segurança'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {descMap[tauriStatus]}
            </p>
          </div>

          {deviceSignature && (
            <div className="w-full bg-slate-955 border border-slate-850 p-4 rounded-lg space-y-1 text-left">
              <span className="text-[9px] font-mono text-slate-550 uppercase tracking-wider block">Assinatura do Computador (SHA-256):</span>
              <code className="text-[10px] font-mono text-cyan-400 break-all select-all block font-bold leading-normal">
                {deviceSignature}
              </code>
            </div>
          )}

          {tauriStatus === 'unauthorized' && (
            <div className="w-full space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Identificador do Computador (Ex: Armaria Cavalaria PC-01):</label>
                <input 
                  type="text"
                  value={nomeDispositivo}
                  onChange={(e) => setNomeDispositivo(e.target.value)}
                  placeholder="Digite um nome para identificar esta máquina"
                  className="w-full bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                />
              </div>
              <button
                onClick={handleSolicitarHomologacao}
                disabled={isRegistering || !nomeDispositivo.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-xs font-mono font-bold text-white rounded transition-colors uppercase tracking-wider cursor-pointer font-bold"
              >
                {isRegistering ? 'Enviando...' : 'Solicitar Homologação'}
              </button>
            </div>
          )}

          {(tauriStatus === 'unauthorized' || tauriStatus === 'pending_approval' || tauriStatus === 'suspended' || tauriStatus === 'blocked') && (
            <div className="w-full border-t border-slate-800/65 pt-6 space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Código de Bypass de Emergência (24 Horas):</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={bypassCode}
                    onChange={(e) => { setBypassCode(e.target.value); setBypassError(''); }}
                    placeholder="Digite o código gerado pelo Admin"
                    className="flex-1 bg-slate-955 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                  />
                  <button
                    onClick={handleAplicarBypass}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-505 text-xs font-mono font-bold text-white rounded transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Validar
                  </button>
                </div>
                {bypassError && (
                  <span className="text-[9px] font-mono text-red-500 block">{bypassError}</span>
                )}
              </div>
            </div>
          )}

          {tauriStatus === 'error' && (
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-mono font-bold text-white rounded transition-colors uppercase tracking-wider cursor-pointer"
            >
              Recarregar Aplicação
            </button>
          )}

          <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest pt-2">
            DEPARTAMENTO DE LOGÍSTICA E SUPRIMENTOS - PMDF
          </div>
        </div>
      </div>
    );
  };

  // Encontrar o armeiro ativo atual no banco de dados
  const activeArmeiro = db.usuarios.find(u => u.matricula === activeArmeiroMatricula);

  // Função de logout completo
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthenticatedArmeiro(null);
    setActiveArmeiroMatricula('');
    setQuartelAtivo(null);
    setRota('login');
    sessionStorage.removeItem('activeArmeiroMatricula');
    sessionStorage.removeItem('authenticatedArmeiro');
    sessionStorage.removeItem('quartelAtivo');
    sessionStorage.removeItem('rota');
  };

  if (tauriStatus !== 'authorized') {
    return renderLockScreen();
  }

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 font-sans flex flex-col overflow-x-hidden selection:bg-blue-600 selection:text-white" id="app-root">
      
      {/* Telas Globais de Carregamento e Erro */}
      {db.isLoading && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest animate-pulse">
            Sincronizando com o SGBD Cloud Supabase...
          </span>
        </div>
      )}

      {db.dbError && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-red-900/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-bold font-mono text-white uppercase tracking-wider">Falha na Conexão Cloud</h2>
          <p className="text-xs font-sans text-slate-400 max-w-md leading-relaxed">
            Não foi possível estabelecer contato com o banco de dados Supabase. Verifique se configurou corretamente as chaves no arquivo <code className="text-red-400 bg-red-950/30 px-1 py-0.5 rounded font-mono">.env</code>.
          </p>
          <p className="text-[10px] font-mono text-red-500 bg-red-950/20 border border-red-900/40 p-3 rounded max-w-lg overflow-auto">
            Erro: {db.dbError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-mono font-bold text-white rounded transition-colors uppercase tracking-wider cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      )}
      {/* Tela de Login */}
      {rota === 'login' && !db.isLoading && (
        <LoginPortal 
          onLoginSuccess={(user, quartel) => {
            setAuthenticatedArmeiro(user);
            setActiveArmeiroMatricula(user.matricula);
            sessionStorage.setItem('activeArmeiroMatricula', user.matricula);
            sessionStorage.setItem('authenticatedArmeiro', JSON.stringify(user));
            sessionStorage.removeItem('logging_in');
            db.registrarLogAuditoria(
              user.matricula,
              'login',
              `${user.perfil === 'admin' ? 'Admin' : `Armeiro ${user.posto_graduacao} ${user.nome_de_guerra || user.nome}`} realizou login com sucesso.${ quartel ? ` Quartel: ${quartel.nome}.` : ''}`
            );
            if (user.perfil === 'admin') {
              setRota('admin_panel');
              sessionStorage.setItem('rota', 'admin_panel');
            } else {
              setQuartelAtivo(quartel);
              sessionStorage.setItem('quartelAtivo', JSON.stringify(quartel));
              setRota('sistema');
              sessionStorage.setItem('rota', 'sistema');
            }
          }}
          cadastrarSenha={db.cadastrarSenha}
          quarteis={db.quarteis.length > 0 ? db.quarteis : []}
        />
      )}

      {/* Painel Admin */}
      {rota === 'admin_panel' && authenticatedArmeiro?.perfil === 'admin' && (
        <AdminPanelView
          admin={authenticatedArmeiro}
          db={db}
          onSelecionarQuartel={(quartel) => {
            setQuartelAtivo(quartel);
            sessionStorage.setItem('quartelAtivo', JSON.stringify(quartel));
            setRota('sistema');
            sessionStorage.setItem('rota', 'sistema');
          }}
          onLogout={handleLogout}
        />
      )}
      {/* Sistema Principal */}
      {rota === 'sistema' && authenticatedArmeiro && (
        <>
      
      {/* Top Navigation Bar */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between px-6 shrink-0 sticky top-0 z-50 backdrop-blur-xl" id="app-header">
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-12 h-12 bg-blue-600/10 border border-blue-500/40 rounded-lg flex items-center justify-center font-bold text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] glow-blue"
          >
            <Shield className="h-6 w-6 text-blue-400" id="header-brand-logo" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight uppercase text-white font-sans">
                {quartelAtivo ? quartelAtivo.nome.toUpperCase() : 'RESERVA DE ARMAMENTO'}
              </h1>
              <span className="text-[9px] bg-blue-955 text-blue-405 border border-blue-800/60 px-1.5 py-0.5 rounded font-black font-mono">PMDF</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">
              {activeArmeiroMatricula?.toUpperCase() === 'ARMEIRO' ? 'TOTEM DE AUTOATENDIMENTO (ATIVO)' : 'SISTEMA TÁTICO DE CONTROLE BÉLICO'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-850 px-4 py-2 rounded-lg">
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-bold text-slate-350 uppercase">
                {activeArmeiro ? `${activeArmeiro.posto_graduacao}. ${activeArmeiro.nome_de_guerra || activeArmeiro.nome}` : 'Sem Armeiro'}
              </span>
              <span className="text-[9px] text-cyan-405 font-mono tracking-wider">
                MATRÍCULA: {activeArmeiro ? activeArmeiro.matricula : 'N/A'}
              </span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)] animate-pulse"></div>
          </div>
          
          {authenticatedArmeiro && (
            <button
              onClick={handleLogout}
              className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 hover:bg-red-955/20 px-3.5 py-2 border border-red-900/40 rounded-lg transition-all duration-200 cursor-pointer uppercase tracking-wider"
              id="btn-logout-armeiro"
            >
              Bloquear / Sair
            </button>
          )}

          {authenticatedArmeiro?.perfil === 'admin' && (
            <button
              onClick={() => { setRota('admin_panel'); sessionStorage.setItem('rota', 'admin_panel'); }}
              className="text-[10px] font-mono font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-955/20 px-3.5 py-2 border border-amber-900/40 rounded-lg transition-all duration-200 cursor-pointer uppercase tracking-wider"
            >
              ← Admin
            </button>
          )}
          
          {activeArmeiroMatricula?.toUpperCase() !== 'ARMEIRO' && (
            <>
              <div className="h-10 w-[1px] bg-slate-800 hidden sm:block"></div>
              
              <div className="flex gap-2.5 items-center bg-slate-900/40 border border-slate-800/80 px-3.5 py-2 rounded-lg hidden sm:flex">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse"></div>
                <div className="flex flex-col">
                  <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400">Paiol Principal</span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">Online & Seguro</span>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Container - Cockpit Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8" id="app-main-content">
        <FlowSimulator 
          db={db}
          activeArmeiroMatricula={activeArmeiroMatricula}
          authenticatedPerfil={authenticatedArmeiro?.perfil || ''}
          setActiveArmeiroMatricula={setActiveArmeiroMatricula}
        />

      </main>

      {/* Footer Status Bar - Technical System Telemetry */}
      <footer className="h-auto bg-slate-955 border-t border-slate-900 px-6 py-4 md:py-4 flex flex-col md:flex-row items-center justify-between shrink-0 gap-4 mt-auto">
        {activeArmeiroMatricula?.toUpperCase() !== 'ARMEIRO' ? (
          <>
            <div className="flex flex-wrap gap-4 text-[9px] font-mono text-slate-505 uppercase tracking-widest">
              <span>Session: <strong className="text-slate-400">PMDF-CO-827A</strong></span>
              <span>SGBD: <strong className="text-slate-400">Supabase Cloud</strong></span>
              <span>Quartel: <strong className="text-slate-400">{quartelAtivo?.nome || 'N/A'}</strong></span>
              <span className="flex items-center gap-1.5">
                Latency: <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <strong className="text-emerald-400">9ms</strong>
              </span>
            </div>
            <div className="text-[9px] text-slate-505 font-mono uppercase tracking-wider text-center md:text-right flex flex-col items-end gap-0.5">
              <span>© 2026 DEPARTAMENTO DE LOGÍSTICA E SUPRIMENTOS (DLS) - POLÍCIA MILITAR DO DISTRITO FEDERAL</span>
              <span className="text-[8px] text-slate-500 font-black tracking-wider">Desenvolvido por Wagner Torres</span>
            </div>
          </>
        ) : (
          <div className="text-[9px] text-slate-505 font-mono uppercase tracking-wider text-center w-full flex flex-col items-center gap-0.5">
            <span>© 2026 DEPARTAMENTO DE LOGÍSTICA E SUPRIMENTOS (DLS) - POLÍCIA MILITAR DO DISTRITO FEDERAL</span>
            <span className="text-[8px] text-slate-500 font-black tracking-wider">MODO TOTEM DE AUTOATENDIMENTO BÉLICO ATIVO</span>
          </div>
        )}
      </footer>

      </>
      )}

    </div>
  );
}
