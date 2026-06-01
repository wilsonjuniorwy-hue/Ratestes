/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { motion } from 'motion/react';
import FlowSimulator from './components/FlowSimulator';
import { useSupabaseDatabase } from './hooks/useSupabaseDatabase';
import LoginPortal from './components/LoginPortal';
import { Usuario } from './types';

export default function App() {
  const [activeArmeiroMatricula, setActiveArmeiroMatricula] = useState('');
  const db = useSupabaseDatabase(activeArmeiroMatricula);
  const [authenticatedArmeiro, setAuthenticatedArmeiro] = useState<Usuario | null>(null);
  
  // Encontrar o armeiro ativo atual no banco de dados
  const activeArmeiro = db.usuarios.find(u => u.matricula === activeArmeiroMatricula);

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 font-sans flex flex-col overflow-x-hidden selection:bg-blue-600 selection:text-white" id="app-root">
      
      {/* Tela de Login Tático Bloqueante */}
      {!authenticatedArmeiro && !db.isLoading && (
        <LoginPortal 
          usuarios={db.usuarios}
          onLoginSuccess={(user) => {
            setAuthenticatedArmeiro(user);
            setActiveArmeiroMatricula(user.matricula);
            db.registrarLogAuditoria(
              user.matricula,
              'login',
              `Armeiro ${user.posto_graduacao} ${user.nome_de_guerra || user.nome} realizou login com sucesso no painel de controle do paiol.`
            );
          }}
          cadastrarSenha={db.cadastrarSenha}
        />
      )}
      
      {/* Indicador de Conexão com Banco de Dados Cloud (Supabase) */}
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
      
      {/* Top Navigation Bar - Premium Tactical Cockpit HUD Theme */}
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
              <h1 className="text-base font-extrabold tracking-tight uppercase text-white font-sans">CAVALARIA - RESERVA DE ARMAMENTO</h1>
              <span className="text-[9px] bg-blue-955 text-blue-405 border border-blue-800/60 px-1.5 py-0.5 rounded font-black font-mono">PMDF</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">SISTEMA TÁTICO DE CONTROLE BÉLICO</p>
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
              onClick={() => {
                setAuthenticatedArmeiro(null);
                setActiveArmeiroMatricula('');
              }}
              className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 px-3.5 py-2 border border-red-900/40 rounded-lg transition-all duration-200 cursor-pointer uppercase tracking-wider"
              id="btn-logout-armeiro"
            >
              Bloquear / Sair
            </button>
          )}
          
          <div className="h-10 w-[1px] bg-slate-800 hidden sm:block"></div>
          
          <div className="flex gap-2.5 items-center bg-slate-900/40 border border-slate-800/80 px-3.5 py-2 rounded-lg hidden sm:flex">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse"></div>
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400">Paiol Principal</span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">Online & Seguro</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container - Cockpit Dashboard Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8" id="app-main-content">
        <FlowSimulator 
          db={db}
          activeArmeiroMatricula={activeArmeiroMatricula}
          setActiveArmeiroMatricula={setActiveArmeiroMatricula}
        />
      </main>

      {/* Footer Status Bar - Technical System Telemetry */}
      <footer className="h-auto md:h-14 bg-slate-955 border-t border-slate-900 px-6 py-4 md:py-0 flex flex-col md:flex-row items-center justify-between shrink-0 gap-4 mt-auto">
        <div className="flex flex-wrap gap-4 text-[9px] font-mono text-slate-505 uppercase tracking-widest">
          <span>Session: <strong className="text-slate-400">PMDF-CO-827A</strong></span>
          <span>SGBD: <strong className="text-slate-400">SQL Server 2026 Enterprise</strong></span>
          <span>Cluster: <strong className="text-slate-400">PRD-HUD-01</strong></span>
          <span className="flex items-center gap-1.5">
            Latency: <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <strong className="text-emerald-400">9ms</strong>
          </span>
        </div>
        <div className="text-[9px] text-slate-505 font-mono uppercase tracking-wider text-center md:text-right flex flex-col items-end gap-0.5">
          <span>© 2026 DEPARTAMENTO DE LOGÍSTICA E SUPRIMENTOS (DLS) - POLÍCIA MILITAR DO DISTRITO FEDERAL</span>
          <span className="text-[8px] text-slate-500 font-black tracking-wider">Desenvolvido por Wagner Torres</span>
        </div>
      </footer>

    </div>
  );
}
