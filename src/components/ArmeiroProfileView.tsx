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
  cadastrarPolicial: (novoPolicial: Usuario) => Promise<{ success: boolean; error?: string }>;
  editarPolicial: (matricula: string, dadosAtualizados: Partial<Usuario>) => Promise<{ success: boolean }>;
  excluirUsuario: (matricula: string) => Promise<{ success: boolean }>;
}

export function ArmeiroProfileView({
  usuarios,
  activeArmeiroMatricula,
  setActiveArmeiroMatricula,
  alterarSenhaArmeiro,
  cadastrarPolicial,
  editarPolicial,
  excluirUsuario
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
  const [isRegistering, setIsRegistering] = useState(false);

  // Estados locais para gerenciamento de armeiros (Admin)
  const [editingMatricula, setEditingMatricula] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editNomeDeGuerra, setEditNomeDeGuerra] = useState('');
  const [editPosto, setEditPosto] = useState('Sargento');
  
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const startEditing = (u: Usuario) => {
    setEditingMatricula(u.matricula);
    setEditNome(u.nome);
    setEditNomeDeGuerra(u.nome_de_guerra || '');
    setEditPosto(u.posto_graduacao);
    setActionError('');
    setActionSuccess('');
  };

  const cancelEditing = () => {
    setEditingMatricula(null);
    setActionError('');
  };

  const handleSaveEdit = async (matricula: string) => {
    setActionError('');
    setActionSuccess('');
    
    const nomeNorm = editNome.trim();
    const guerraNorm = editNomeDeGuerra.trim();
    
    if (!nomeNorm || !guerraNorm) {
      setActionError('Nome e Nome de Guerra são obrigatórios.');
      return;
    }

    try {
      await editarPolicial(matricula, {
        nome: nomeNorm,
        nome_de_guerra: guerraNorm,
        posto_graduacao: editPosto
      });
      setEditingMatricula(null);
      setActionSuccess(`Perfil do armeiro (Matrícula: ${matricula}) atualizado com sucesso!`);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao atualizar dados do armeiro.');
    }
  };

  const handleDeleteUser = async (matricula: string, nomeGuerra: string) => {
    setActionError('');
    setActionSuccess('');

    if (matricula === '7317573') {
      setActionError('Erro de segurança: O administrador principal não pode excluir a própria conta.');
      return;
    }

    if (!window.confirm(`Tem certeza de que deseja apagar permanentemente o perfil do armeiro ${nomeGuerra} (Matrícula: ${matricula})? Esta ação é irreversível.`)) {
      return;
    }

    try {
      await excluirUsuario(matricula);
      setActionSuccess(`Perfil do armeiro ${nomeGuerra} foi excluído do sistema.`);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao excluir perfil do armeiro.');
    }
  };

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
  const handleCadastrarArmeiro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) return;
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

    setIsRegistering(true);
    try {
      const result = await cadastrarPolicial(novoArmeiro);
      if (result && !result.success) {
        setRegError(result.error || 'Erro ao cadastrar armeiro.');
      } else {
        setNewMatricula('');
        setNewNome('');
        setNewNomeDeGuerra('');
        setNewSenha('');
        setNewPosto('Sargento');
        setRegSuccess(`Armeiro ${guerraNorm} cadastrado e liberado para acesso com sucesso!`);
      }
    } catch (err: any) {
      setRegError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setIsRegistering(false);
    }
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
                disabled={isRegistering}
                className={`w-full font-bold font-mono py-2.5 rounded-lg text-xs transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-2 ${
                  isRegistering 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer glow-cyan'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span>{isRegistering ? 'Salvando no Auth...' : 'Salvar Cadastro de Armeiro'}</span>
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Seção de Gestão de Armeiros - Apenas para o Admin SGT Wagner Torres */}
      {activeArmeiroMatricula === '7317573' && (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
          <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-cyan-400" />
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest">Painel Administrativo: Operadores do Paiol (Armeiros)</h3>
            </div>
            <span className="text-[9px] font-mono text-slate-500">Total: {armorersList.length} cadastrados</span>
          </div>

          {actionError && (
            <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs font-mono text-red-400 flex items-start gap-2 animate-pulse">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-lg text-xs font-mono text-emerald-450 flex items-start gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-850 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Posto / Graduação</th>
                  <th className="py-3 px-4">Nome Completo</th>
                  <th className="py-3 px-4">Nome de Guerra</th>
                  <th className="py-3 px-4">Matrícula (RG)</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/50">
                {armorersList.map(u => {
                  const isEditing = editingMatricula === u.matricula;
                  return (
                    <tr key={u.matricula} className="hover:bg-slate-900/30 transition-colors">
                      {/* Posto / Graduação */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <select
                            value={editPosto}
                            onChange={(e) => setEditPosto(e.target.value)}
                            className="bg-slate-950 border border-slate-800 p-1.5 rounded text-xs text-slate-205 focus:outline-none cursor-pointer"
                          >
                            {['Soldado', 'Cabo', 'Sargento', 'Subtenente', 'Tenente', 'Capitão', 'Major', 'Tenente-Coronel', 'Coronel'].map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-bold text-slate-350">{u.posto_graduacao}</span>
                        )}
                      </td>

                      {/* Nome Completo */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                            className="bg-slate-950 border border-slate-800 p-1.5 rounded text-xs text-slate-205 focus:outline-none w-full"
                          />
                        ) : (
                          <span className="text-slate-300 uppercase">{u.nome}</span>
                        )}
                      </td>

                      {/* Nome de Guerra */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editNomeDeGuerra}
                            onChange={(e) => setEditNomeDeGuerra(e.target.value)}
                            className="bg-slate-950 border border-slate-800 p-1.5 rounded text-xs text-slate-205 focus:outline-none w-full"
                          />
                        ) : (
                          <span className="font-mono text-cyan-400 font-bold uppercase">{u.nome_de_guerra || 'N/A'}</span>
                        )}
                      </td>

                      {/* Matrícula (RG) */}
                      <td className="py-3 px-4 font-mono text-slate-400 uppercase text-[11px]">
                        {u.matricula}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(u.matricula)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold px-2.5 py-1 rounded text-[10px] uppercase tracking-wider cursor-pointer transition-colors"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold px-2.5 py-1 rounded text-[10px] uppercase tracking-wider cursor-pointer transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-3.5">
                            <button
                              onClick={() => startEditing(u)}
                              className="text-cyan-400 hover:text-cyan-300 font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                            >
                              Editar
                            </button>
                            {u.matricula !== '7317573' ? (
                              <button
                                onClick={() => handleDeleteUser(u.matricula, u.nome_de_guerra || u.nome)}
                                className="text-red-400 hover:text-red-300 font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                              >
                                Apagar
                              </button>
                            ) : (
                              <span className="text-slate-600 font-mono text-[10px] uppercase cursor-not-allowed select-none" title="Administrador principal">
                                Bloqueado
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
