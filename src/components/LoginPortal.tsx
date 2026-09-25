/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, ShieldAlert, CheckCircle, RefreshCw, Eye, EyeOff, Building2, ArrowLeft, Download, Sparkles, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Usuario, Quartel } from '../types';
import { supabase, obterAmbienteAtual, alterarAmbiente } from '../supabaseClient';
import { useAppUpdater } from '../hooks/useAppUpdater';
import packageJson from '../../package.json';

interface LoginPortalProps {
  onLoginSuccess: (usuario: Usuario, quartel: Quartel | null) => void;
  quarteis: Quartel[];
  updater?: ReturnType<typeof useAppUpdater>;
}

export default function LoginPortal({
  onLoginSuccess,
  quarteis,
  updater: externalUpdater
}: LoginPortalProps) {
  // ---- SISTEMA DE ATUALIZAÇÃO AUTOMÁTICA ----
  const localUpdater = useAppUpdater();
  const updater = externalUpdater || localUpdater;

  const { 
    updateAvailable, 
    newVersion, 
    isDownloading, 
    isChecking: updaterIsChecking,
    error: updaterError, 
    checkUpdates, 
    installUpdate 
  } = updater;

  const [isCheckingLocal, setIsCheckingLocal] = useState(false);
  const [checkedSuccessfully, setCheckedSuccessfully] = useState(false);

  const isChecking = updaterIsChecking || isCheckingLocal;

  const handleCheckClick = async () => {
    if (isChecking || isDownloading) return;
    setIsCheckingLocal(true);
    setCheckedSuccessfully(false);
    try {
      const update = await checkUpdates(false);
      if (!update) {
        setCheckedSuccessfully(true);
        setTimeout(() => setCheckedSuccessfully(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingLocal(false);
    }
  };

  const handleInstallClick = async () => {
    if (window.confirm(`Deseja baixar e instalar a versão v${newVersion} agora? O aplicativo será reiniciado automaticamente após a instalação.`)) {
      await installUpdate();
    }
  };

  // ---- FLUXO DA TELA ----
  const [step, setStep] = useState<'login' | 'sucesso'>('login');
  const [selectedQuartel, setSelectedQuartel] = useState<Quartel | null>(null);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  
  // ---- ESTADOS DOS CAMPOS ----
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // ---- ESTADOS DE CARREGAMENTO ----
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // ---- LISTA DE QUARTÉIS DO LOGIN (consulta própria; não depende dos dados do sistema) ----
  const [quarteisLogin, setQuarteisLogin] = useState<Quartel[]>([]);

  useEffect(() => {
    let ativo = true;
    supabase
      .from('quarteis')
      .select('id, slug, nome, ativo, criado_em')
      .is('deletado_em', null)
      .eq('ativo', true)
      .order('nome', { ascending: true })
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) {
          console.error('Erro ao carregar a lista de quartéis do login:', error);
          return;
        }
        setQuarteisLogin((data as Quartel[]) || []);
      });
    return () => { ativo = false; };
  }, []);

  // Usa a lista própria; enquanto ela não chega, usa a lista recebida do App
  const listaQuarteis = quarteisLogin.length > 0 ? quarteisLogin : quarteis;

  // Seleciona o RPMON (ou a Cavalaria) por padrão ao iniciar
  useEffect(() => {
    if (listaQuarteis && listaQuarteis.length > 0 && !selectedQuartel && !isAdminLogin) {
      const cavalaria = listaQuarteis.find(
        q => q.slug.includes('cavalaria') || 
             q.nome.toLowerCase().includes('cavalaria') || 
             q.nome.toLowerCase().includes('rpmon')
      );
      if (cavalaria) {
        setSelectedQuartel(cavalaria);
      } else {
        setSelectedQuartel(listaQuarteis[0]);
      }
    }
  }, [listaQuarteis, selectedQuartel, isAdminLogin]);

  // ---- SUBMIT DO LOGIN ----
  // Auditoria 2026 (passo B2): a tela NÃO lê mais a tabela usuarios antes do login.
  // Ela pergunta ao "balcão de informações" fn_login_buscar_usuario, que devolve só
  // o necessário e NUNCA a senha. O cadastro completo só é lido DEPOIS do login,
  // já com a conta autenticada. Não existe mais conferência de senha no computador.
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    const inputClean = matricula.trim().toUpperCase();
    const senhaNorm = senha.trim();
    let entrouNoAuth = false;

    // Encerra a tentativa mostrando uma mensagem (e sai da conta, se já tiver entrado)
    const falhar = async (mensagem: string) => {
      if (entrouNoAuth) {
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          console.error('Erro ao encerrar a sessão após falha no login:', signOutErr);
        }
      }
      sessionStorage.removeItem('logging_in');
      setAuthError(mensagem);
      setIsAuthenticating(false);
    };

    const ehLimiteDeTentativas = (err: any) => {
      if (!err) return false;
      const msg = String(err.message || '').toLowerCase();
      return err.status === 429 || msg.includes('rate limit') || msg.includes('exceeded');
    };

    try {
      // 1. Perguntar ao "balcão de informações" (não devolve senha; só armeiros e admins)
      const { data: infoRows, error: infoError } = await supabase.rpc('fn_login_buscar_usuario', {
        p_login: inputClean
      });

      if (infoError) {
        console.error('Erro ao consultar fn_login_buscar_usuario:', infoError);
        await falhar('Falha de conexão com o SGBD.');
        return;
      }

      const info: any = Array.isArray(infoRows) ? infoRows[0] : infoRows;

      if (!info || !info.matricula) {
        await falhar('Usuário não encontrado ou sem acesso a este terminal (exclusivo para Armeiros Gestores e Administradores).');
        return;
      }

      const matriculaNorm: string = info.matricula;
      const ehAdmin = info.perfil === 'admin';

      if (!ehAdmin && info.perfil !== 'armeiro_gestor') {
        await falhar('Acesso restrito. Este terminal é exclusivo para Armeiros Gestores e Administradores.');
        return;
      }

      // 2. Conferências do armeiro antes de tentar a senha (bloqueio e quartel)
      const quartelEscolhido: Quartel | null = ehAdmin ? null : selectedQuartel;

      if (!ehAdmin) {
        if (info.bloqueado_ate) {
          const bloqueadoAteDate = new Date(info.bloqueado_ate);
          if (bloqueadoAteDate > new Date()) {
            const mins = Math.ceil((bloqueadoAteDate.getTime() - Date.now()) / (60 * 1000));
            await falhar(`Usuário temporariamente bloqueado por 5 tentativas incorretas. Tente em ${mins} min ou contate o Admin.`);
            return;
          }
        }

        if (!quartelEscolhido) {
          await falhar('Selecione o quartel antes de fazer login.');
          return;
        }

        if (info.id_quartel && info.id_quartel !== quartelEscolhido.id) {
          await falhar('Acesso negado. Sua matrícula está vinculada a outro quartel.');
          return;
        }
      }

      // Avisa o App que o login está em andamento (evita que ele volte para a tela de login no meio)
      sessionStorage.setItem('logging_in', 'true');

      // 3. Tentar a senha no Supabase Auth
      const emailPrincipal = ehAdmin
        ? `${matriculaNorm.toLowerCase()}@admin.pm`
        : `${matriculaNorm.toLowerCase()}@${quartelEscolhido!.slug.toLowerCase()}.pm`;

      let authUserId: string | null = null;
      let authErr: any = null;

      try {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailPrincipal,
          password: senhaNorm,
        });
        authUserId = signInData?.user?.id ?? null;
        authErr = signInError;
      } catch (err: any) {
        authErr = err;
      }

      // Reserva: contas antigas de armeiro criadas com o domínio cavalaria.pm
      if (
        (authErr || !authUserId) &&
        !ehAdmin &&
        quartelEscolhido &&
        quartelEscolhido.slug.toLowerCase() !== 'cavalaria' &&
        !ehLimiteDeTentativas(authErr)
      ) {
        try {
          const { data: fbData, error: fbError } = await supabase.auth.signInWithPassword({
            email: `${matriculaNorm.toLowerCase()}@cavalaria.pm`,
            password: senhaNorm,
          });
          if (!fbError && fbData?.user?.id) {
            authUserId = fbData.user.id;
            authErr = null;
          }
        } catch (fbErr) {
          console.error('Erro no login de reserva (domínio cavalaria):', fbErr);
        }
      }

      if (authErr || !authUserId) {
        if (ehLimiteDeTentativas(authErr)) {
          await falhar('Muitas tentativas de login neste momento. Aguarde alguns minutos e tente novamente.');
          return;
        }

        if (!info.tem_conta) {
          await falhar('Senha incorreta ou acesso ao sistema ainda não ativado. Se for o seu primeiro acesso, procure o administrador.');
          return;
        }

        if (ehAdmin) {
          await falhar('Senha de acesso incorreta.');
          return;
        }

        // Armeiro: registra a tentativa errada no banco (quem bloqueia é a função do banco)
        let msgErro = 'Senha de acesso incorreta.';
        try {
          const { data: failResult, error: failErr } = await supabase.rpc('fn_registrar_falha_login', {
            p_matricula: matriculaNorm
          });
          if (failErr) {
            console.warn('Falha ao registrar a tentativa de login incorreta:', failErr);
          }
          const tentativasAgora = (info.tentativas_login || 0) + 1;
          if ((failResult as any)?.bloqueado || tentativasAgora >= 5) {
            msgErro = 'Usuário bloqueado temporariamente por 15 min devido a 5 tentativas de senha incorretas.';
          }
        } catch (rpcErr) {
          console.warn('Erro ao chamar fn_registrar_falha_login:', rpcErr);
        }
        await falhar(msgErro);
        return;
      }

      // 4. Senha aceita. Daqui em diante tudo é feito já com a conta autenticada.
      entrouNoAuth = true;

      // 4a. Conta de login ainda não vinculada ao cadastro (ex.: conta criada pelo painel do Supabase)
      if (!info.tem_conta) {
        const { error: linkErr } = await supabase.rpc('vincular_usuario_auth', {
          p_matricula: matriculaNorm,
          p_auth_id: authUserId
        });
        if (linkErr) {
          console.error('Erro ao vincular a conta de login ao cadastro:', linkErr);
        }
      }

      // 4b. Ler o PRÓPRIO cadastro (sem a senha), pela conta que acabou de entrar
      const { data: cadastro, error: cadastroErr } = await supabase
        .from('usuarios')
        .select('matricula, nome, nome_de_guerra, perfil, posto_graduacao, situacao_cautela, data_ultimo_teste_psicologico, motivo_suspensao, auth_user_id, id_quartel, tentativas_login, bloqueado_ate, assinatura_foto, nome_usuario')
        .eq('auth_user_id', authUserId)
        .is('deletado_em', null)
        .maybeSingle();

      if (cadastroErr || !cadastro) {
        console.error('Cadastro não encontrado para a conta autenticada:', cadastroErr);
        await falhar('Sua conta de login não está vinculada a este cadastro. Procure o administrador.');
        return;
      }

      // 4c. Conferir de novo, agora com o cadastro verdadeiro
      if (cadastro.matricula !== matriculaNorm || cadastro.perfil !== info.perfil) {
        await falhar('Os dados da conta de login não conferem com o cadastro. Procure o administrador.');
        return;
      }

      if (!ehAdmin && cadastro.id_quartel && cadastro.id_quartel !== quartelEscolhido!.id) {
        await falhar('Acesso negado. Sua matrícula está vinculada a outro quartel.');
        return;
      }

      // 4d. Armeiro antigo sem quartel: vincula ao quartel escolhido (já autenticado)
      if (!ehAdmin && !cadastro.id_quartel) {
        const { error: vincQuartelErr } = await supabase
          .from('usuarios')
          .update({ id_quartel: quartelEscolhido!.id })
          .eq('matricula', matriculaNorm);
        if (vincQuartelErr) {
          console.error('Erro ao vincular o armeiro ao quartel selecionado:', vincQuartelErr);
        } else {
          cadastro.id_quartel = quartelEscolhido!.id;
        }
      }

      // 4e. Zerar as tentativas erradas do armeiro
      if (!ehAdmin && ((info.tentativas_login || 0) > 0 || info.bloqueado_ate)) {
        const { error: zerarErr } = await supabase
          .from('usuarios')
          .update({ tentativas_login: 0, bloqueado_ate: null })
          .eq('matricula', matriculaNorm);
        if (zerarErr) {
          console.error('Erro ao zerar as tentativas de login:', zerarErr);
        } else {
          cadastro.tentativas_login = 0;
          cadastro.bloqueado_ate = null;
        }
      }

      // 5. Sucesso (o cadastro segue SEM a senha)
      const usuarioLogado = { ...cadastro, senha_hash: '' } as Usuario;
      setStep('sucesso');
      setTimeout(() => {
        onLoginSuccess(usuarioLogado, ehAdmin ? null : quartelEscolhido);
      }, 1000);
    } catch (err) {
      console.error('Erro de autenticação:', err);
      await falhar('Falha de conexão com o SGBD.');
    }
  };


  return (
    <div 
      className="fixed inset-0 bg-slate-955 flex items-center justify-center p-4 z-[999] overflow-y-auto selection:bg-blue-600 selection:text-white bg-cover bg-center bg-no-repeat" 
      style={{ backgroundImage: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(9, 15, 30, 0.95)), url("/cavalry_bg.png")' }}
      id="login-portal-root"
    >
      
      {/* Background Matrix/Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl relative"
      >
        {/* Glow Borders */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-sm pointer-events-none"></div>
        
        {/* TOP BRANDING HUD */}
        <div className="text-center space-y-3 mb-8 relative">
          <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/40 rounded-xl flex items-center justify-center font-bold text-blue-400 mx-auto shadow-[0_0_20px_rgba(59,130,246,0.2)] glow-blue">
            <Shield className="h-7 w-7 text-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-sm font-extrabold tracking-wider uppercase text-white font-sans">
                RESERVA DE ARMAMENTO
              </h2>
              <span className="text-[8px] bg-blue-955 text-blue-400 border border-blue-900/60 px-1 py-0.5 rounded font-black font-mono">PMDF</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">SISTEMA TÁTICO DE CONTROLE BÉLICO</p>
          </div>
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
        </div>

        {/* FORMULÁRIO DE LOGIN COM SELETOR INLINE */}
        {step === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5 relative font-sans text-xs">
            
            {/* HUD de Seleção de Unidade Bélica via Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Unidade Bélica:</label>
              <div className="relative">
                <select
                  value={selectedQuartel?.id || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const q = listaQuarteis.find(item => item.id === val);
                    if (q) {
                      setSelectedQuartel(q);
                    }
                    setAuthError('');
                  }}
                  className="w-full bg-slate-950/80 border border-slate-800/80 p-3 text-xs font-mono text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-500/30 rounded-xl cursor-pointer appearance-none pr-10 focus:border-blue-500/40"
                >
                  {listaQuarteis.map((q) => (
                    <option key={q.id} value={q.id} className="bg-slate-900 text-slate-200">
                      {q.nome.toUpperCase()} ({q.slug.toUpperCase() === 'CAVALARIA' ? 'RPMON' : q.slug.toUpperCase()})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Nome de Usuário ou Matrícula:</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="USUÁRIO OU MATRÍCULA"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                className="w-full bg-slate-950/70 border border-slate-800/80 p-3 text-xs font-mono uppercase text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-500/30 rounded-xl placeholder:text-slate-600 focus:border-blue-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Senha de Acesso (PIN):</label>
              <div className="relative">
                <input
                  type={showSenha ? 'text' : 'password'}
                  required
                  placeholder="Senha cadastrada..."
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-950/70 border border-slate-800/80 p-3 text-xs font-mono text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-500/30 rounded-xl placeholder:text-slate-600 focus:border-blue-500/40 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-955/30 border border-red-900/40 p-3 rounded-xl text-[10px] text-red-400 font-mono flex items-start gap-2.5"
              >
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
                <span>{authError}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-3 rounded-xl text-xs transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer glow-blue disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>Autenticando no SGBD...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 text-white" />
                  <span>Liberar Console de Armaria</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest block">
                PAIOL PRINCIPAL • CONEXÃO CRIPTOGRAFADA AES-256
              </span>
            </div>
          </form>
        )}

        {/* STEP 3: SUCESSO E TRANSIÇÃO */}
        {step === 'sucesso' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-6 space-y-4 font-sans text-xs relative"
          >
            <div className="w-14 h-14 bg-emerald-600/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-405 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Acesso Autorizado</h3>
              <p className="text-[10px] text-slate-400 font-mono uppercase mt-1">Carregando painel de comando do Paiol...</p>
            </div>
          </motion.div>
        )}

        {/* CARD TÁTICO DE VERSÃO E ATUALIZAÇÃO DO SISTEMA */}
        <div className="border-t border-slate-800/80 mt-6 pt-5 relative z-10 font-mono">
          {updateAvailable ? (
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-blue-950/40 border border-emerald-500/40 rounded-xl p-4 shadow-[0_0_20px_rgba(16,185,129,0.15)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Nova Versão Disponível
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Instalada: v{packageJson.version}
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Versão de Destino:</span>
                <span className="text-emerald-400 font-bold text-sm tracking-wider">v{newVersion}</span>
              </div>

              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isDownloading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse transition-all cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>Baixando e Instalando v{newVersion}...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 text-white" />
                    <span>Atualizar Sistema Agora (v{newVersion})</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                    Versão: <strong className="text-white text-[11px]">v{packageJson.version}</strong>
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                  Canal Oficial PMDF
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckClick}
                disabled={isChecking}
                className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-blue-500/50 text-slate-300 hover:text-white py-2.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 shadow-sm"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" />
                    <span className="text-blue-400">Verificando Servidor de Atualizações...</span>
                  </>
                ) : checkedSuccessfully ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Sistema Atualizado na Versão Mais Recente!</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                    <span>Buscar Atualização do Sistema</span>
                  </>
                )}
              </button>
            </div>
          )}

          {updaterError && (
            <p className="text-red-400 text-[9px] font-mono mt-2 text-center bg-red-955/20 border border-red-900/30 p-1.5 rounded" title={updaterError}>
              Falha na checagem: {updaterError}
            </p>
          )}
        </div>

      </motion.div>

      {/* Desenvolvido por Wagner Torres */}
      <div className="absolute bottom-4 right-6 text-right font-mono text-[8px] text-slate-500/80 uppercase tracking-widest pointer-events-none select-none no-print">
        <span>Desenvolvido por Wagner Torres</span>
      </div>
    </div>
  );
}
