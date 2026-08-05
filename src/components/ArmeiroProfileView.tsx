import React, { useState } from 'react';
import { 
  User, KeyRound, UserPlus, ShieldAlert, CheckCircle, UserCheck, Shield,
  Upload, Trash2, FileImage, RefreshCw
} from 'lucide-react';
import { Usuario } from '../types';
import { POSTOS_GRADUACOES_EXTENSO, normalizarPostoExtenso, formatMatriculaExibicao, formatMatriculaArmeiroInterna } from '../utils/rankUtils';

interface ArmeiroProfileViewProps {
  usuarios: Usuario[];
  activeArmeiroMatricula: string;
  authenticatedPerfil: string;
  setActiveArmeiroMatricula: (matricula: string) => void;
  alterarSenhaArmeiro: (matricula: string, novaSenha: string) => Promise<{ success: boolean; error?: string }>;
  cadastrarPolicial: (novoPolicial: Usuario) => Promise<{ success: boolean; error?: string }>;
  editarPolicial: (matricula: string, dadosAtualizados: Partial<Usuario>) => Promise<{ success: boolean }>;
  excluirUsuario: (matricula: string) => Promise<{ success: boolean }>;
}

export function ArmeiroProfileView({
  usuarios,
  activeArmeiroMatricula,
  authenticatedPerfil,
  setActiveArmeiroMatricula,
  alterarSenhaArmeiro,
  cadastrarPolicial,
  editarPolicial,
  excluirUsuario
}: ArmeiroProfileViewProps) {
  // Filtrar todos os usuários com perfil de armeiro
  const armorersList = usuarios.filter(u => u.perfil === 'armeiro_gestor');
  
  // Obter armeiro atualmente ativo (suporta admin logado buscando na lista geral)
  console.log('ArmeiroProfileView - activeArmeiroMatricula:', activeArmeiroMatricula);
  console.log('ArmeiroProfileView - usuarios disponíveis:', usuarios.map(u => ({ matricula: u.matricula, perfil: u.perfil })));
  const activeArmeiro = usuarios.find(u => u.matricula.trim().toUpperCase() === activeArmeiroMatricula.trim().toUpperCase()) || armorersList[0];

  // Estados locais para alteração de senha
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

const sanitizeNomeUsuario = (value: string): string => {
  return value
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9._-]/g, "");
};

  // Estados locais para cadastro de novo armeiro
  const [newMatricula, setNewMatricula] = useState('');
  const [newNome, setNewNome] = useState('');
  const [newNomeDeGuerra, setNewNomeDeGuerra] = useState('');
  const [newNomeUsuario, setNewNomeUsuario] = useState('');
  const [newPosto, setNewPosto] = useState('Sargento');
  const [newSenha, setNewSenha] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Estados locais para gerenciamento de armeiros (Admin)
  const [editingMatricula, setEditingMatricula] = useState<string | null>(null);
  const [editMatriculaVal, setEditMatriculaVal] = useState('');
  const [editNome, setEditNome] = useState('');
  const [editNomeDeGuerra, setEditNomeDeGuerra] = useState('');
  const [editNomeUsuario, setEditNomeUsuario] = useState('');
  const [editPosto, setEditPosto] = useState('Sargento');
  
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Estados locais para assinatura digitalizada
  const [sigError, setSigError] = useState('');
  const [sigSuccess, setSigSuccess] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSigError('');
    setSigSuccess('');

    if (file.size > 5 * 1024 * 1024) {
      setSigError("A imagem selecionada é muito grande. Escolha uma imagem de até 5MB.");
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar mantendo proporção com limites 300x120
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Preencher fundo com branco (evita preto se imagem tiver transparência)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Desenhar imagem no canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Comprimir para JPEG 0.7
          const base64Compressed = canvas.toDataURL('image/jpeg', 0.7);
          
          if (activeArmeiro) {
            editarPolicial(activeArmeiro.matricula, { assinatura_foto: base64Compressed })
              .then(() => {
                setSigSuccess("Sua assinatura digitalizada foi salva com sucesso!");
                setIsCompressing(false);
              })
              .catch((err) => {
                setSigError("Erro ao salvar assinatura no banco de dados.");
                setIsCompressing(false);
                console.error(err);
              });
          } else {
            setSigError("Nenhum armeiro ativo identificado.");
            setIsCompressing(false);
          }
        } else {
          setSigError("Erro ao criar contexto gráfico.");
          setIsCompressing(false);
        }
      };
      img.onerror = () => {
        setSigError("Erro ao processar imagem. Escolha outro arquivo de imagem válido.");
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = async () => {
    if (!activeArmeiro) return;
    
    setSigError('');
    setSigSuccess('');

    if (!window.confirm("Tem certeza de que deseja apagar permanentemente a sua assinatura digitalizada? Isso reverterá a impressão para apenas nome de forma textual.")) {
      return;
    }

    try {
      await editarPolicial(activeArmeiro.matricula, { assinatura_foto: null });
      setSigSuccess("Assinatura digitalizada removida com sucesso.");
    } catch (err) {
      setSigError("Erro ao remover a assinatura do banco de dados.");
      console.error(err);
    }
  };

  const startEditing = (u: Usuario) => {
    setEditingMatricula(u.matricula);
    setEditMatriculaVal(formatMatriculaArmeiroInterna(u.matricula));
    setEditNome(u.nome);
    setEditNomeDeGuerra(u.nome_de_guerra || '');
    setEditNomeUsuario(u.nome_usuario || '');
    setEditPosto(u.posto_graduacao);
    setActionError('');
    setActionSuccess('');
  };

  const cancelEditing = () => {
    setEditingMatricula(null);
    setActionError('');
  };

  const handleSaveEdit = async (matriculaAntiga: string) => {
    setActionError('');
    setActionSuccess('');
    
    const internalMatricula = formatMatriculaArmeiroInterna(editMatriculaVal);
    const nomeNorm = editNome.trim();
    const guerraNorm = editNomeDeGuerra.trim();
    const nomeUsuarioNorm = sanitizeNomeUsuario(editNomeUsuario);
    
    if (!internalMatricula || !nomeNorm || !guerraNorm) {
      setActionError('Matrícula, Nome e Nome de Guerra são obrigatórios.');
      return;
    }

    // Verificar se já existe outro ARMEIRO com esta matrícula (excluindo a atual)
    if (usuarios.some(u => u.perfil === 'armeiro_gestor' && u.matricula !== matriculaAntiga && u.matricula.toUpperCase() === internalMatricula)) {
      setActionError('Esta Matrícula de armeiro já está cadastrada no sistema.');
      return;
    }

    if (nomeUsuarioNorm && usuarios.some(u => u.matricula !== matriculaAntiga && u.nome_usuario?.toUpperCase() === nomeUsuarioNorm)) {
      setActionError('Este Nome de Usuário já está em uso por outro operador.');
      return;
    }

    try {
      const payloadToUpdate: Partial<Usuario> = {
        nome: nomeNorm,
        nome_de_guerra: guerraNorm,
        posto_graduacao: editPosto,
        nome_usuario: nomeUsuarioNorm || undefined
      };

      // Inclui a matrícula no payload APENAS se tiver mudado de fato
      if (internalMatricula !== matriculaAntiga) {
        payloadToUpdate.matricula = internalMatricula;
      }

      await editarPolicial(matriculaAntiga, payloadToUpdate);

      if (activeArmeiroMatricula === matriculaAntiga && internalMatricula !== matriculaAntiga) {
        setActiveArmeiroMatricula(internalMatricula);
      }

      setEditingMatricula(null);
      setActionSuccess(`Perfil do armeiro (${internalMatricula}) atualizado com sucesso!`);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao atualizar dados do armeiro.');
    }
  };

  const handleDeleteUser = async (u: Usuario) => {
    setActionError('');
    setActionSuccess('');

    if (u.perfil === 'admin') {
      setActionError('Erro de segurança: A conta de administrador não pode ser excluída por este painel.');
      return;
    }

    const nomeGuerra = u.nome_de_guerra || u.nome;
    if (!window.confirm(`Tem certeza de que deseja apagar permanentemente o perfil do armeiro ${nomeGuerra} (Matrícula: ${formatMatriculaExibicao(u.matricula)})? Esta ação é irreversível.`)) {
      return;
    }

    try {
      await excluirUsuario(u.matricula);
      setActionSuccess(`Perfil do armeiro ${nomeGuerra} foi excluído do sistema.`);
    } catch (err: any) {
      setActionError(err.message || 'Erro ao excluir perfil do armeiro.');
    }
  };

  // Trocar senha submit
  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('DEBUG [handleAlterarSenha] - Botão clicado. Iniciando alteração...');
    setPwdError('');
    setPwdSuccess('');

    const newPwdTrim = novaSenha.trim();
    const confPwdTrim = confirmarSenha.trim();
    console.log('DEBUG [handleAlterarSenha] - Senhas limpas:', { newPwdTrim, confPwdTrim });

    if (!newPwdTrim) {
      console.log('DEBUG [handleAlterarSenha] - Senha vazia.');
      setPwdError('Insira a nova senha.');
      return;
    }

    if (newPwdTrim.length < 4) {
      console.log('DEBUG [handleAlterarSenha] - Senha muito curta.');
      setPwdError('A senha deve conter pelo menos 4 dígitos.');
      return;
    }

    if (newPwdTrim !== confPwdTrim) {
      console.log('DEBUG [handleAlterarSenha] - Senhas não coincidem.');
      setPwdError('A confirmação da senha não confere.');
      return;
    }

    try {
      console.log('DEBUG [handleAlterarSenha] - Chamando alterarSenhaArmeiro para matrícula:', activeArmeiro.matricula);
      const result = await alterarSenhaArmeiro(activeArmeiro.matricula, newPwdTrim);
      console.log('DEBUG [handleAlterarSenha] - Resultado obtido:', result);
      if (result && !result.success) {
        setPwdError(result.error || 'Erro ao alterar senha.');
      } else {
        setNovaSenha('');
        setConfirmarSenha('');
        setPwdSuccess('Senha alterada com sucesso no Auth e SGBD!');
      }
    } catch (err: any) {
      console.error('DEBUG [handleAlterarSenha] - Erro capturado na Promise:', err);
      setPwdError(err.message || 'Erro inesperado ao alterar senha.');
    }
  };

  // Cadastrar armeiro submit
  const handleCadastrarArmeiro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) return;
    setRegError('');
    setRegSuccess('');

    const internalMatricula = formatMatriculaArmeiroInterna(newMatricula);
    const nomeNorm = newNome.trim();
    const guerraNorm = newNomeDeGuerra.trim();
    const nomeUsuarioNorm = sanitizeNomeUsuario(newNomeUsuario);
    const senhaNorm = newSenha.trim();

    if (!internalMatricula || !nomeNorm || !guerraNorm || !senhaNorm) {
      setRegError('Preencha todos os campos do formulário.');
      return;
    }

    // Verificar se matrícula já existe entre armeiros
    if (usuarios.some(u => u.perfil === 'armeiro_gestor' && u.matricula.toUpperCase() === internalMatricula)) {
      setRegError('Matrícula de armeiro já cadastrada no sistema.');
      return;
    }

    // Verificar se nome_usuario já existe
    if (nomeUsuarioNorm && usuarios.some(u => u.nome_usuario?.toUpperCase() === nomeUsuarioNorm)) {
      setRegError('Este Nome de Usuário já está em uso por outro armeiro.');
      return;
    }

    const novoArmeiro: Usuario = {
      matricula: internalMatricula,
      nome: nomeNorm,
      nome_de_guerra: guerraNorm,
      nome_usuario: nomeUsuarioNorm || undefined,
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
        setNewNomeUsuario('');
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
          </div>

          {/* Assinatura Digitalizada do Armeiro */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4" id="arm-assinatura-card">
            <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileImage className="h-4.5 w-4.5 text-blue-500" />
                <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest">Assinatura Digitalizada para Relatórios (PDF)</h3>
              </div>
              {activeArmeiro?.assinatura_foto && (
                <span className="text-[8px] bg-blue-950/50 text-blue-400 border border-blue-900/50 px-2 py-0.5 rounded font-black uppercase">
                  Anexada
                </span>
              )}
            </div>

            <div className="space-y-4">
              {activeArmeiro?.assinatura_foto ? (
                <div className="space-y-3">
                  <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-center min-h-[100px] shadow-inner">
                    <img 
                      src={activeArmeiro.assinatura_foto} 
                      alt="Assinatura manuscrita" 
                      className="max-h-20 max-w-full object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center font-sans">
                    Esta assinatura será exibida automaticamente sobre o seu nome nos relatórios e livros de ocorrência gerados em PDF.
                  </p>
                  <div className="flex gap-3 pt-1">
                    <label className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-205 font-bold font-mono py-2 rounded-lg text-[10px] transition-all uppercase tracking-wider cursor-pointer text-center flex items-center justify-center gap-1.5 border border-slate-700">
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Substituir</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleSignatureUpload} 
                        className="hidden" 
                        disabled={isCompressing}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="flex-1 bg-red-950/40 hover:bg-red-950/60 text-red-400 font-bold font-mono py-2 rounded-lg text-[10px] transition-all uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 border border-red-900/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remover</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-950/40 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group min-h-[120px]">
                    <Upload className="h-7 w-7 text-slate-500 group-hover:text-blue-400 transition-colors" />
                    <span className="text-[11px] font-bold text-slate-300 group-hover:text-blue-300 transition-colors">Carregar Imagem de Assinatura</span>
                    <span className="text-[9px] text-slate-500 font-mono text-center">Fundo branco ou transparente (PNG, JPG) • Max 5MB</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleSignatureUpload} 
                      className="hidden"
                      disabled={isCompressing}
                    />
                  </label>
                  <p className="text-[10px] text-slate-500 font-sans text-justify">
                    Dica: Assine em um papel branco bem iluminado, tire uma foto nítida e faça o upload. O sistema cortará e otimizará a imagem automaticamente para o banco de dados.
                  </p>
                </div>
              )}

              {isCompressing && (
                <div className="bg-blue-950/30 border border-blue-900/40 p-2.5 rounded-lg text-[10px] text-blue-400 font-mono flex items-center justify-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Compactando e salvando imagem...</span>
                </div>
              )}

              {sigError && (
                <div className="bg-red-955/30 border border-red-900/40 p-2.5 rounded-lg text-[10px] text-red-400 font-mono flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{sigError}</span>
                </div>
              )}

              {sigSuccess && (
                <div className="bg-emerald-950/30 border border-emerald-900/40 p-2.5 rounded-lg text-[10px] text-emerald-450 font-mono flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{sigSuccess}</span>
                </div>
              )}
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

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide">Nome de Usuário (Acesso ao Sistema):</label>
                <input
                  type="text"
                  placeholder="EX: ROBERTO.DIAS (sem espaços ou caracteres especiais)"
                  value={newNomeUsuario}
                  onChange={(e) => setNewNomeUsuario(sanitizeNomeUsuario(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs font-mono uppercase text-cyan-300 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                />
                <p className="text-[9px] text-slate-500 font-mono">Usado para fazer login no portal. Se deixado em branco, a matrícula será usada.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Posto / Graduação:</label>
                  <select
                    value={normalizarPostoExtenso(newPosto)}
                    onChange={(e) => setNewPosto(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-805 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg cursor-pointer"
                  >
                    {POSTOS_GRADUACOES_EXTENSO.map(p => (
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
      {authenticatedPerfil === 'admin' && (
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
                  <th className="py-3 px-4">Nome de Usuário (Login)</th>
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
                            value={normalizarPostoExtenso(editPosto)}
                            onChange={(e) => setEditPosto(e.target.value)}
                            className="bg-slate-950 border border-slate-800 p-1.5 rounded text-xs text-slate-205 focus:outline-none cursor-pointer"
                          >
                            {POSTOS_GRADUACOES_EXTENSO.map(p => (
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

                      {/* Nome de Usuário */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editNomeUsuario}
                            onChange={(e) => setEditNomeUsuario(sanitizeNomeUsuario(e.target.value))}
                            placeholder="EX: ROBERTO.DIAS"
                            className="bg-slate-950 border border-slate-800 p-1.5 rounded text-xs font-mono uppercase text-cyan-300 focus:outline-none w-full"
                          />
                        ) : (
                          <span className="font-mono text-amber-300 text-[11px] font-semibold">{u.nome_usuario ? u.nome_usuario.toUpperCase() : <em className="text-slate-600 font-normal">Nâo definido (usar matrícula)</em>}</span>
                        )}
                      </td>

                      {/* Matrícula (RG) */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editMatriculaVal}
                            onChange={(e) => setEditMatriculaVal(e.target.value.toUpperCase())}
                            className="bg-slate-950 border border-slate-800 p-1.5 rounded text-xs font-mono uppercase text-cyan-300 focus:outline-none w-full"
                          />
                        ) : (
                          <span className="font-mono text-slate-400 uppercase text-[11px]">
                            {formatMatriculaExibicao(u.matricula)}
                          </span>
                        )}
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
                            {u.perfil !== 'admin' ? (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="text-red-400 hover:text-red-300 font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                              >
                                Apagar
                              </button>
                            ) : (
                              <span className="text-slate-600 font-mono text-[10px] uppercase cursor-not-allowed select-none" title="Conta de administrador protegida">
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
