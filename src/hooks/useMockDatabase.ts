/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Usuario, Categoria, Material, Cautela, CautelaItem, AuditoriaLog, OcorrenciaRelatorio, SituacaoMilitar, StatusMaterial, CondicaoUso } from '../types';
import { mockUsuarios, mockCategorias, mockMateriais, mockCautelas, mockCautelaItens, mockAuditoriaLogs, mockOcorrencias } from '../mockData';

export function useMockDatabase() {
  // ---- ESTADOS COMPARTILHADOS SIMULANDO O SGBD RELACIONAL ----
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    const saved = localStorage.getItem('pm_usuarios');
    if (saved) {
      const parsed = JSON.parse(saved) as Usuario[];
      let updated = [...parsed];
      let hasChanges = false;
      
      mockUsuarios.forEach(mockUser => {
        if (!updated.some(u => u.matricula === mockUser.matricula)) {
          updated.push(mockUser);
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        localStorage.setItem('pm_usuarios', JSON.stringify(updated));
        return updated;
      }
      return parsed;
    }
    return mockUsuarios;
  });

  const [materiais, setMateriais] = useState<Material[]>(() => {
    const saved = localStorage.getItem('pm_materiais');
    return saved ? JSON.parse(saved) : mockMateriais;
  });

  const [categorias, setCategorias] = useState<Categoria[]>(() => {
    const saved = localStorage.getItem('pm_categorias');
    return saved ? JSON.parse(saved) : mockCategorias;
  });

  const [cautelas, setCautelas] = useState<Cautela[]>(() => {
    const saved = localStorage.getItem('pm_cautelas');
    return saved ? JSON.parse(saved) : mockCautelas;
  });

  const [cautelaItens, setCautelaItens] = useState<CautelaItem[]>(() => {
    const saved = localStorage.getItem('pm_cautela_itens');
    return saved ? JSON.parse(saved) : mockCautelaItens;
  });

  const [auditoriaLogs, setAuditoriaLogs] = useState<AuditoriaLog[]>(() => {
    const saved = localStorage.getItem('pm_auditoria_logs');
    return saved ? JSON.parse(saved) : mockAuditoriaLogs;
  });

  const [ocorrencias, setOcorrencias] = useState<OcorrenciaRelatorio[]>(() => {
    const saved = localStorage.getItem('pm_ocorrencias');
    return saved ? JSON.parse(saved) : mockOcorrencias;
  });

  const [modelosArmas, setModelosArmas] = useState<Array<{ modelo: string; calibre: string }>>(() => {
    const saved = localStorage.getItem('pm_modelos_armas');
    if (saved) return JSON.parse(saved);
    return [
      { modelo: 'Pistola CZ - P10', calibre: '9mm' },
      { modelo: 'Fuzil Imbel IA2 5.56', calibre: '5.56mm' },
      { modelo: 'Espingarda Calibre 12', calibre: '12' }
    ];
  });

  // Salvar no localStorage para que modificações persistam entre interações
  useEffect(() => {
    localStorage.setItem('pm_usuarios', JSON.stringify(usuarios));
    localStorage.setItem('pm_materiais', JSON.stringify(materiais));
    localStorage.setItem('pm_categorias', JSON.stringify(categorias));
    localStorage.setItem('pm_cautelas', JSON.stringify(cautelas));
    localStorage.setItem('pm_cautela_itens', JSON.stringify(cautelaItens));
    localStorage.setItem('pm_auditoria_logs', JSON.stringify(auditoriaLogs));
    localStorage.setItem('pm_ocorrencias', JSON.stringify(ocorrencias));
    localStorage.setItem('pm_modelos_armas', JSON.stringify(modelosArmas));
  }, [usuarios, materiais, categorias, cautelas, cautelaItens, auditoriaLogs, ocorrencias, modelosArmas]);

  // Função Resetar Banco de Dados para estado inicial
  const resetDatabase = () => {
    setUsuarios(mockUsuarios);
    setMateriais(mockMateriais);
    setCategorias(mockCategorias);
    setCautelas(mockCautelas);
    setCautelaItens(mockCautelaItens);
    setAuditoriaLogs(mockAuditoriaLogs);
    setOcorrencias(mockOcorrencias);
    setModelosArmas([
      { modelo: 'Pistola CZ - P10', calibre: '9mm' },
      { modelo: 'Fuzil Imbel IA2 5.56', calibre: '5.56mm' },
      { modelo: 'Espingarda Calibre 12', calibre: '12' }
    ]);
    localStorage.removeItem('pm_usuarios');
    localStorage.removeItem('pm_materiais');
    localStorage.removeItem('pm_categorias');
    localStorage.removeItem('pm_cautelas');
    localStorage.removeItem('pm_cautela_itens');
    localStorage.removeItem('pm_auditoria_logs');
    localStorage.removeItem('pm_ocorrencias');
    localStorage.removeItem('pm_modelos_armas');
  };

  const adicionarCategoria = (novaCategoria: Categoria) => {
    setCategorias(prev => [...prev, novaCategoria]);
    const armeiroSvc = usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
    registrarLogAuditoria(
      armeiroSvc,
      'cadastro_militar',
      `Nova categoria regulamentar cadastrada: ${novaCategoria.nome} (ID: ${novaCategoria.id_categoria}).`
    );
  };

  // ---- TRIGGERS DE LOG DE AUDITORIA ----
  const registrarLogAuditoria = (executor: string, tipo: AuditoriaLog['tipo_evento'], detalhes: string) => {
    const novoLog: AuditoriaLog = {
      id_log: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
      data_hora: new Date().toISOString(),
      matricula_executor: executor,
      tipo_evento: tipo,
      detalhes: detalhes
    };
    setAuditoriaLogs(prev => [novoLog, ...prev]);
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
    registrarLogAuditoria(
      matricula,
      'login',
      `Senha de 4 dígitos cadastrada com sucesso no primeiro acesso.`
    );
  };

  // ---- CADASTRO DE NOVO POLICIAL MILITAR ----
  const cadastrarPolicial = async (novoPolicial: Usuario): Promise<{ success: boolean; error?: string }> => {
    const novosUsuarios = [...usuarios, novoPolicial];
    setUsuarios(novosUsuarios);

    registrarLogAuditoria(
      'SYS-AM',
      'cadastro_militar',
      `Novo policial militar cadastrado: ${novoPolicial.posto_graduacao} ${novoPolicial.nome} (Guerra: ${novoPolicial.nome_de_guerra || 'N/A'}, Matrícula: ${novoPolicial.matricula}, Porte: ${novoPolicial.situacao_cautela.toUpperCase()}).`
    );
    return { success: true };
  };

  // ---- SALVAR REGISTRO NO LIVRO DE OCORRÊNCIAS ----
  const salvarOcorrencia = (titulo: string, tipo: 'troca_turno' | 'avaria_material' | 'fiscalizacao' | 'outros' | 'conferencia_estoque', descricao: string) => {
    const armeiroSvc = usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';

    const novaOco: OcorrenciaRelatorio = {
      id_ocorrencia: `OCO-${Math.floor(100000 + Math.random() * 900000)}`,
      data_hora: new Date().toISOString(),
      titulo: titulo,
      tipo: tipo,
      descricao: descricao,
      matricula_armeiro: armeiroSvc
    };

    setOcorrencias(prev => [novaOco, ...prev]);

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

    const armeiroSvc = usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
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

    const armeiroSvc = usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
    registrarLogAuditoria(
      armeiroSvc,
      'bloqueio_militar',
      `Situação de Cautela do militar ${user.posto_graduacao} ${user.nome} (Matrícula: ${matricula}) alterada para ${novaSituacao.toUpperCase()}.`
    );
  };

  // ---- ADICIONAR NOVO MATERIAL AO ESTOQUE ----
  const adicionarMaterial = (novoMaterial: Material) => {
    const existsIndex = materiais.findIndex(m => m.id_material === novoMaterial.id_material);
    const armeiroSvc = usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';

    if (existsIndex > -1) {
      const novosMateriais = materiais.map((m, idx) => {
        if (idx === existsIndex) {
          return {
            ...m,
            quantidade: (m.quantidade || 0) + (novoMaterial.quantidade || 0)
          };
        }
        return m;
      });
      setMateriais(novosMateriais);
      
      registrarLogAuditoria(
        armeiroSvc,
        'envio_manutencao',
        `Quantidade incrementada para o material: ${novoMaterial.modelo} (Código: ${novoMaterial.id_material}). Adicionado: ${novoMaterial.quantidade}. Novo total: ${(materiais[existsIndex].quantidade || 0) + (novoMaterial.quantidade || 0)}.`
      );
    } else {
      const novosMateriais = [...materiais, novoMaterial];
      setMateriais(novosMateriais);

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

    const armeiroSvc = usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
    
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

    const materiaisAtualizados = materiais.map(m => {
      if (m.id_material === id) {
        if (m.controle_quantidade) {
          const newQty = Math.max(0, (m.quantidade || 0) - quantidade_retirada);
          return { ...m, quantidade: newQty };
        }
        return { ...m, status_atual: 'retirado' as StatusMaterial };
      }
      return m;
    });

    setMateriais(materiaisAtualizados);

    const armeiroSvc = usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
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
    const armeiroSvc = usuarios.find(u => u.perfil === 'armeiro_gestor') || user;

    const novaCautela: Cautela = {
      id_cautela: idNewCautela,
      matricula_policial: matriculaPolicial,
      matricula_armeiro_retirada: armeiroSvc.matricula,
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
        id_cautela_item: `ITEM-NEW-${idx}-${Math.floor(Math.random() * 10000)}`,
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
          return m; // Quantity-based materials remain available in stock list
        }
        return { ...m, status_atual: 'cautelado' as StatusMaterial };
      }
      return m;
    });

    setCautelas(prev => [novaCautela, ...prev]);
    setCautelaItens(prev => [...prev, ...novosItensCautela]);
    setMateriais(materiaisAtualizados);

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

    const armeiroResponsavel = usuarios.find(u => u.perfil === 'armeiro_gestor')?.matricula || 'SYS-AM';
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
    
    // Usaremos um mapa para evitar duplicar itens ou lidar com indices erráticos ao inserir novos splits
    const activeItemsMap = new Map<string, CautelaItem>();
    novosCautelaItens.forEach(ci => {
      activeItemsMap.set(ci.id_cautela_item, { ...ci });
    });

    idsMateriaisDevolvidos.forEach(idMat => {
      // Encontra o CautelaItem ativo para este material nesta cautela
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
        // Totalmente resolvido
        if (qtyToReturn > 0 && qtyConsumed > 0) {
          // Atualiza o original para o retornado
          activeItemsMap.set(ci.id_cautela_item, {
            ...ci,
            quantidade: qtyToReturn,
            estado_devolucao: condition
          });
          // Cria um novo para o consumido
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
          // Apenas consumo
          activeItemsMap.set(ci.id_cautela_item, {
            ...ci,
            estado_devolucao: 'avariado',
            consumido: true
          });
        } else {
          // Apenas retorno normal
          activeItemsMap.set(ci.id_cautela_item, {
            ...ci,
            estado_devolucao: condition
          });
        }
      } else {
        // Parcialmente resolvido, ainda há pendências
        // Atualiza original com o saldo restante que ainda está ativo
        activeItemsMap.set(ci.id_cautela_item, {
          ...ci,
          quantidade: ci.quantidade - totalProcessed
        });

        // Cria item devolvido se maior que 0
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

        // Cria item consumido se maior que 0
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

    // 3. Verificar se TODOS os itens desta cautela foram devolvidos
    const todosItensDaCautela = novosCautelaItens.filter(ci => ci.id_cautela === cautId);
    const todosDevolvidos = todosItensDaCautela.every(ci => ci.estado_devolucao !== undefined);

    // 4. Calcular nova previsão de devolução (+48h) quando prorrogar
    const novaPrevisao = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // 5. Atualizar o registro da Cautela com todos os dados persistentes
    const cautelasAtualizadas = cautelas.map(c => {
      if (c.id_cautela === cautId) {
        // Base das observações
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

        if (todosDevolvidos) {
          return {
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
          return {
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
          return {
            ...c,
            observacoes_devolucao: c.observacoes_devolucao
              ? `${c.observacoes_devolucao} | ${baseObs}`
              : baseObs
          };
        }
      }
      return c;
    });

    // 6. Liberar o militar apenas se todos os itens foram devolvidos
    const policialResponsavel = cautelaParaBaixa.matricula_policial;
    const usuariosAtualizados = usuarios.map(u => {
      if (u.matricula === policialResponsavel && todosDevolvidos) {
        return { ...u, situacao_cautela: 'apto' as const };
      }
      return u;
    });

    setCautelas(cautelasAtualizadas);
    setMateriais(materiaisAtualizados);
    setCautelaItens(novosCautelaItens);
    setUsuarios(usuariosAtualizados);

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
    registrarLogAuditoria,
    cadastrarSenha,
    cadastrarPolicial,
    salvarOcorrencia,
    zerarSenha,
    updatePorte,
    adicionarMaterial,
    updateMaterialStatus,
    confirmarRetirada,
    processEfetivarCautela,
    processDevolucao,
    adicionarCategoria,
    alterarSenhaArmeiro
  };
}
