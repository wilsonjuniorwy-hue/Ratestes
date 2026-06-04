import React, { useState } from 'react';
import { Shield, Building2, Plus, Power, LogOut, ChevronRight } from 'lucide-react';
import { Usuario, Quartel } from '../types';

interface AdminPanelViewProps {
  admin: Usuario;
  db: {
    quarteis: Quartel[];
    criarQuartel: (slug: string, nome: string) => Promise<{ success: boolean; error?: string }>;
    toggleQuartelAtivo: (id: string, ativo: boolean) => Promise<{ success: boolean; error?: string }>;
  };
  onSelecionarQuartel: (quartel: Quartel) => void;
  onLogout: () => void;
}

export function AdminPanelView({ admin, db, onSelecionarQuartel, onLogout }: AdminPanelViewProps) {
  const [novoNome, setNovoNome] = useState('');
  const [novoSlug, setNovoSlug] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCriarQuartel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    const nomeNorm = novoNome.trim();
    const slugNorm = novoSlug.trim() || nomeNorm.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (!nomeNorm) {
      setCreateError('Nome do quartel é obrigatório.');
      return;
    }
    setIsCreating(true);
    try {
      const result = await db.criarQuartel(slugNorm, nomeNorm);
      if (result.success) {
        setCreateSuccess(`Quartel "${nomeNorm}" criado com sucesso!`);
        setNovoNome('');
        setNovoSlug('');
      } else {
        setCreateError(result.error || 'Erro ao criar quartel.');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Erro inesperado.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 font-sans flex flex-col" id="admin-panel-root">
      {/* Header */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between px-6 shrink-0 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-600/10 border border-amber-500/40 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Shield className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight uppercase text-white font-sans">
                Painel do Administrador
              </h1>
              <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-800/60 px-1.5 py-0.5 rounded font-black font-mono">ADMIN</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">
              Controle Global de Quarteis e Acessos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-mono text-slate-400 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-amber-400 font-bold">{admin.nome_de_guerra || 'Admin'}</span>
            <span className="text-slate-500 ml-2">· {admin.matricula}</span>
          </div>
          <button
            onClick={onLogout}
            className="text-[10px] font-mono font-bold text-red-400 hover:text-red-300 hover:bg-red-955/20 px-3.5 py-2 border border-red-900/40 rounded-lg transition-all duration-200 cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8 flex-1 w-full space-y-8">

        {/* Aviso de escopo */}
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wide">Acesso de Administrador Global</p>
            <p className="text-[11px] text-amber-200/60 font-sans mt-0.5">
              Selecione um quartel para acessar o sistema com visão completa daquele quartel, ou gerencie a estrutura de quarteis abaixo.
            </p>
          </div>
        </div>

        {/* Lista de Quarteis */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-850 pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-blue-400" />
              <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-widest">Quarteis Cadastrados</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{db.quarteis.length} quarteis</span>
          </div>

          {db.quarteis.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono text-center py-4">Nenhum quartel cadastrado ainda.</p>
          ) : (
            <div className="space-y-3">
              {db.quarteis.map(q => (
                <div key={q.id} className="flex items-center justify-between bg-slate-950/60 border border-slate-850 rounded-xl p-4 hover:border-slate-750 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${q.ativo ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-slate-600'}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-200 uppercase">{q.nome}</p>
                      <p className="text-[10px] font-mono text-slate-500">{q.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => db.toggleQuartelAtivo(q.id, !q.ativo)}
                      className={`text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        q.ativo
                          ? 'text-amber-400 border-amber-900/40 hover:bg-amber-950/20'
                          : 'text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/20'
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {q.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => onSelecionarQuartel(q)}
                      disabled={!q.ativo}
                      className={`text-[10px] font-mono font-bold px-4 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                        q.ativo
                          ? 'text-blue-400 border-blue-800/50 hover:bg-blue-955/30 cursor-pointer'
                          : 'text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                      }`}
                    >
                      Entrar
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Criar Novo Quartel */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 shadow-lg space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-4">
            <Plus className="h-4.5 w-4.5 text-cyan-400" />
            <h2 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-widest">Cadastrar Novo Quartel</h2>
          </div>

          <form onSubmit={handleCriarQuartel} className="space-y-4 font-sans text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Nome do Quartel *:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 2º Batalhão de Polícia"
                  value={novoNome}
                  onChange={(e) => {
                    setNovoNome(e.target.value);
                    setNovoSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                  }}
                  className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Slug (identificador único):</label>
                <input
                  type="text"
                  placeholder="2-batalhao-policia (gerado auto)"
                  value={novoSlug}
                  onChange={(e) => setNovoSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs font-mono text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {createError && (
              <div className="bg-red-955/30 border border-red-900/40 p-2.5 rounded-lg text-[10px] text-red-400 font-mono">
                {createError}
              </div>
            )}
            {createSuccess && (
              <div className="bg-emerald-950/30 border border-emerald-900/40 p-2.5 rounded-lg text-[10px] text-emerald-400 font-mono">
                {createSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono py-2.5 rounded-lg text-xs transition-all shadow-md uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? 'Criando...' : 'Criar Quartel'}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
