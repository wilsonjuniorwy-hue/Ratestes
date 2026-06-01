import React, { useState } from 'react';
import { 
  User, KeyRound, UserPlus, ShieldAlert, CheckCircle, UserCheck, Shield
} from 'lucide-react';
import { Usuario } from '../types';

interface ArmeiroProfileViewProps {
  usuarios: Usuario[];
  activeArmeiroMatricula: string;
  setActiveArmeiroMatricula: (matricula: string) => void;
  alterarSenhaArmeiro: (matricula: string, novaSenha: string) => void;
  cadastrarPolicial: (novoPolicial: Usuario) => void; // Reuses cadastrarPolicial since it adds to db.usuarios
}

export function ArmeiroProfileView({
  usuarios,
  activeArmeiroMatricula,
  setActiveArmeiroMatricula,
  alterarSenhaArmeiro,
  cadastrarPolicial
}: ArmeiroProfileViewProps) {
  // Filtrar todos os usuários com perfil de armeiro
  const armorersList = usuarios.filter(u => u.perfil === 'armeiro_gestor');
  
  // Obter armeiro atualmente ativo
  const activeArmeiro = armorersList.find(u => u.matricula === activeArmeiroMatricula) || armorersList[0];

  // Estados locais para alteração de senha
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Estados locais para cadastro de novo armeiro
  const [newMatricula, setNewMatricula] = useState('');
  const [newNome, setNewNome] = useState('');
  const [newNomeDeGuerra, setNewNomeDeGuerra] = useState('');
  const [newPosto, setNewPosto] = useState('Sargento');
  const [newSenha, setNewSenha] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Trocar senha submit
  const handleAlterarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    const newPwdTrim = novaSenha.trim();
    const confPwdTrim = confirmarSenha.trim();

    if (!newPwdTrim) {
      setPwdError('Insira a nova senha.');
      return;
    }

    if (newPwdTrim.length < 4) {
      setPwdError('A senha deve conter pelo menos 4 dígitos.');
      return;
    }

    if (newPwdTrim !== confPwdTrim) {
      setPwdError('A confirmação da senha não confere.');
      return;
    }

    alterarSenhaArmeiro(activeArmeiro.matricula, newPwdTrim);
    setNovaSenha('');
    setConfirmarSenha('');
    setPwdSuccess('Senha alterada com sucesso no SGBD!');
  };

  // Cadastrar armeiro submit
  const handleCadastrarArmeiro = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    const matNorm = newMatricula.trim().toUpperCase();
    const nomeNorm = newNome.trim();
    const guerraNorm = newNomeDeGuerra.trim();
    const senhaNorm = newSenha.trim();

    if (!matNorm || !nomeNorm || !guerraNorm || !senhaNorm) {
      setRegError('Preencha todos os campos do formulário.');
      return;
    }

    // Verificar se matrícula já existe
    if (usuarios.some(u => u.matricula.trim().toUpperCase() === matNorm)) {
      setRegError('Matrícula já cadastrada no sistema.');
      return;
    }

    const novoArmeiro: Usuario = {
      matricula: matNorm,
      nome: nomeNorm,
      nome_de_guerra: guerraNorm,
      senha_hash: senhaNorm,
      perfil: 'armeiro_gestor',
      posto_graduacao: newPosto,
      situacao_cautela: 'apto',
      data_ultimo_teste_psicologico: new Date().toISOString().split('T')[0]
    };

    cadastrarPolicial(novoArmeiro);

    setNewMatricula('');
    setNewNome('');
    setNewNomeDeGuerra('');
    setNewSenha('');
    setNewPosto('Sargento');
    setRegSuccess(`Armeiro ${guerraNorm} cadastrado e liberado para acesso com sucesso!`);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="arm-perfil-view-root">
      
      {/* Banner Principal HUD */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 shadow-lg">
        <div className="space-y-1">
          <h3 className="text-xs font-bold font-mono text-slate-205 uppercase tracking-widest flex items-center gap-2">
            <Shield className="h-4.5 w-4.5 text-blue-500 glow-blue" />
            <span>Gerenciamento de Identidade & Perfil do Armeiro</span>
          </h3>
          <p className="text-xs text-slate-455 font-sans">Administração de senhas de acesso, cadastro de operadores do paiol e troca de perfil ativo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Lado Esquerdo: Perfil do Armeiro Ativo & Troca de Senha */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card de Informações do Armeiro Ativo */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4.5 w-4.5 text-blue-505" />
                <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest">Armeiro Ativo</h3>
              </div>
              <span className="text-[8px] bg-emerald-955/50 text-emerald-450 border border-emerald-900/50 px-2 py-0.5 rounded font-black uppercase">
                Autenticado
              </span>
            </div>

            <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-lg flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.1)] shrink-0 font-mono text-lg">
                {activeArmeiro?.nome_de_guerra?.slice(0, 2).toUpperCase() || 'AM'}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Nome do Operador</div>
                <div className="text-xs font-black text-slate-200 uppercase truncate">
                  {activeArmeiro?.posto_graduacao} {activeArmeiro?.nome}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-slate-450 pt-0.5">
                  <span>Matrícula: <strong className="text-cyan-400">{activeArmeiro?.matricula}</strong></span>
                  <span>Guerra: <strong className="text-slate-300">{activeArmeiro?.nome_de_guerra}</strong></span>
                </div>
              </div>
            </div>

            {/* Dropdown Seletor de Armeiro Ativo (Simulador) */}
            <div className="space-y-1.5 font-sans">
              <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Alternar Armeiro Ativo (Simulador):</label>
              <select
                value={activeArmeiroMatricula}
                onChange={(e) => setActiveArmeiroMatricula(e.target.value)}
                className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs text-slate-205 focus:outline-none rounded-lg cursor-pointer font-sans"
              >
                {armorersList.map(a => (
                  <option key={a.matricula} value={a.matricula}>
                    {a.posto_graduacao} {a.nome_de_guerra || a.nome} ({a.matricula})
                  </option>
                ))}
              </select>
              <span className="text-[9px] text-slate-500 italic block pt-0.5">Mude aqui para simular o uso do sistema por outro armeiro cadastrado.</span>
            </div>
          </div>

          {/* Painel de Alteração de Senha */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-850 pb-3 flex items-center gap-2">
              <KeyRound className="h-4.5 w-4.5 text-blue-505 font-bold" />
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest">Alterar Senha do Armeiro</h3>
            </div>

            <form onSubmit={handleAlterarSenha} className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide block">Nova Senha:</label>
                  <input
                    type="password"
                    required
                    maxLength={10}
                    placeholder="Min. 4 caracteres..."
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs font-mono text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Confirmar Senha:</label>
                  <input
                    type="password"
                    required
                    maxLength={10}
                    placeholder="Repita a nova senha..."
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs font-mono text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {pwdError && (
                <div className="bg-red-955/30 border border-red-900/40 p-2.5 rounded-lg text-[10px] text-red-400 font-mono flex items-start gap-2 animate-pulse">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{pwdError}</span>
                </div>
              )}

              {pwdSuccess && (
                <div className="bg-emerald-950/30 border border-emerald-900/40 p-2.5 rounded-lg text-[10px] text-emerald-450 font-mono flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{pwdSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-2.5 rounded-lg text-xs transition-all shadow-md uppercase tracking-wider cursor-pointer glow-blue flex items-center justify-center gap-2"
              >
                <KeyRound className="h-4 w-4" />
                <span>Salvar Nova Senha</span>
              </button>
            </form>
          </div>

        </div>

        {/* Lado Direito: Cadastrar Novo Armeiro */}
        <div className="lg:col-span-6">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-850 pb-3 flex items-center gap-2">
              <UserPlus className="h-4.5 w-4.5 text-cyan-400" />
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest">Cadastrar Novo Armeiro</h3>
            </div>

            <form onSubmit={handleCadastrarArmeiro} className="space-y-4 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide">Nome Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="EX: ROBERTO DIAS DOS SANTOS"
                  value={newNome}
                  onChange={(e) => setNewNome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide">Nome de Guerra:</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: DIAS"
                    value={newNomeDeGuerra}
                    onChange={(e) => setNewNomeDeGuerra(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wide">Matrícula (RG Funcional):</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: ARM-99887"
                    value={newMatricula}
                    onChange={(e) => setNewMatricula(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs font-mono uppercase text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Posto / Graduação:</label>
                  <select
                    value={newPosto}
                    onChange={(e) => setNewPosto(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-805 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg cursor-pointer"
                  >
                    {['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Tenente-Coronel', 'Coronel'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Senha Inicial:</label>
                  <input
                    type="password"
                    required
                    placeholder="Defina a senha..."
                    value={newSenha}
                    onChange={(e) => setNewSenha(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs font-mono text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {regError && (
                <div className="bg-red-955/30 border border-red-900/40 p-2.5 rounded-lg text-[10px] text-red-400 font-mono flex items-start gap-2 animate-pulse">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccess && (
                <div className="bg-emerald-950/30 border border-emerald-900/40 p-2.5 rounded-lg text-[10px] text-emerald-450 font-mono flex items-start gap-2">
                  <UserCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{regSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono py-2.5 rounded-lg text-xs transition-all shadow-md uppercase tracking-wider cursor-pointer glow-cyan flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span>Salvar Cadastro de Armeiro</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
