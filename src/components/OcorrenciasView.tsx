import React, { useState, useMemo } from 'react';
import { 
  Terminal, ShieldAlert, CheckCircle, Printer, Boxes, BookOpen, Check, AlertTriangle, X,
  PlusCircle, ClipboardList, AlertCircle, History, FileText, Calendar, Search, Filter, Clock, ChevronDown
} from 'lucide-react';
import { OcorrenciaRelatorio, Material, PendenciaServico, Usuario, Cautela, CautelaItem, ArmaParticular, Categoria } from '../types';

interface OcorrenciasViewProps {
  ocorrencias: OcorrenciaRelatorio[];
  materiais: Material[];
  salvarOcorrencia: (
    titulo: string, 
    tipo: 'troca_turno' | 'avaria_material' | 'fiscalizacao' | 'outros' | 'conferencia_estoque', 
    descricao: string
  ) => OcorrenciaRelatorio;
  handlePrintOcorrencia: (oco: OcorrenciaRelatorio) => void;
  activeArmeiroMatricula: string;
  pendenciasServico: PendenciaServico[];
  adicionarPendencia: (descricao: string) => Promise<void>;
  resolverPendencia: (id: string, resolucao: string) => Promise<void>;
  usuarios: Usuario[];
  cautelas: Cautela[];
  cautelaItens: CautelaItem[];
  armasParticulares: ArmaParticular[];
  handlePrintRelatorio: (reportData: any) => void;
  categorias: Categoria[];
}

interface SearchableSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  required?: boolean;
  direction?: 'up' | 'down';
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  required = false,
  direction = 'down'
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedOption = options.find(o => o.value === value);
  
  const filteredOptions = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return options;
    return options.filter(o => o.label.toLowerCase().includes(s));
  }, [options, search]);

  return (
    <div className="relative w-full">
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
        />
      )}
      
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch('');
        }}
        className="w-full bg-slate-900 border border-slate-800 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg cursor-pointer font-sans flex items-center justify-between gap-2 text-left"
      >
        <span className={selectedOption ? "text-slate-200" : "text-slate-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className={`absolute left-0 right-0 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl z-50 flex flex-col max-h-60 overflow-hidden ${
            direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}>
            <div className="p-2 border-b border-slate-900 flex items-center gap-2 bg-slate-900/80">
              <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Digitar nome ou matrícula..."
                className="w-full bg-transparent text-xs text-slate-200 focus:outline-none font-sans"
                autoFocus
              />
            </div>
            
            <div className="overflow-y-auto flex-1 custom-scrollbar max-h-48 py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-violet-955/40 hover:text-violet-200 transition-colors flex items-center justify-between font-sans ${
                      opt.value === value ? 'bg-violet-955/35 text-violet-400 font-bold' : 'text-slate-350'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2.5 text-xs text-slate-500 font-mono italic text-center">
                  Nenhum militar encontrado
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function OcorrenciasView({
  ocorrencias,
  materiais,
  salvarOcorrencia,
  handlePrintOcorrencia,
  activeArmeiroMatricula,
  pendenciasServico,
  adicionarPendencia,
  resolverPendencia,
  usuarios,
  cautelas,
  cautelaItens,
  armasParticulares,
  handlePrintRelatorio,
  categorias
}: OcorrenciasViewProps) {
  // Controle de Visualização do Modal
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isAlteracoesModalOpen, setIsAlteracoesModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [selectedReportTab, setSelectedReportTab] = useState<'periodico' | 'estoque' | 'particulares'>('periodico');
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverArmeiroAnterior, setHandoverArmeiroAnterior] = useState('');
  const [handoverAdjunto, setHandoverAdjunto] = useState('');
  const [handoverOficialDia, setHandoverOficialDia] = useState('');
  const [handoverProximoArmeiro, setHandoverProximoArmeiro] = useState('');
  const [handoverError, setHandoverError] = useState('');
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  // Bloquear scroll do body quando um modal estiver aberto
  React.useEffect(() => {
    const anyModalOpen = isStockModalOpen || isAlteracoesModalOpen || isReportsModalOpen || isHandoverModalOpen;
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isStockModalOpen, isAlteracoesModalOpen, isReportsModalOpen, isHandoverModalOpen]);

  // Ordenar usuários por posto/graduação e nome (excluindo admins e deletados)
  const usuariosOrdenados = useMemo(() => {
    return [...usuarios]
      .filter(u => !u.deletado_em && u.perfil !== 'admin')
      .sort((a, b) => {
        const r1 = a.posto_graduacao || '';
        const r2 = b.posto_graduacao || '';
        if (r1 !== r2) return r1.localeCompare(r2);
        return a.nome.localeCompare(b.nome);
      });
  }, [usuarios]);

  const loggedArmeiroUser = useMemo(() => {
    return usuarios.find(u => u.matricula === activeArmeiroMatricula);
  }, [usuarios, activeArmeiroMatricula]);

  const optionsMilitares = useMemo(() => {
    return usuariosOrdenados.map(u => ({
      value: u.matricula,
      label: `${u.posto_graduacao} ${u.nome_de_guerra || u.nome} (${u.matricula})`
    }));
  }, [usuariosOrdenados]);

  // Verificar se há ocorrência de conferencia_estoque nas últimas 24 horas feita por este armeiro
  const checkStockCountDone = () => {
    const now = new Date();
    const hours24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return ocorrencias.some(oco => 
      oco.tipo === 'conferencia_estoque' && 
      new Date(oco.data_hora) >= hours24Ago &&
      oco.matricula_armeiro === activeArmeiroMatricula
    );
  };

  const handleHandoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHandoverError('');

    if (!handoverArmeiroAnterior || !handoverAdjunto || !handoverOficialDia || !handoverProximoArmeiro) {
      setHandoverError('Por favor, preencha todos os militares de serviço.');
      return;
    }

    const fezContagem = checkStockCountDone();
    if (!fezContagem) {
      alert(
        'ATENÇÃO: É obrigatório realizar a contagem física de estoque nas últimas 24 horas antes de efetuar a passagem de serviço.\n\nO painel de Contagem de Estoque será aberto para você realizar a conferência agora.'
      );
      setIsHandoverModalOpen(false);
      setIsStockModalOpen(true);
      return;
    }

    const listEstoqueDetallado = estoqueAgrupado.map(g => {
      const magText = g.carregadoresTotal > 0 ? ` + ${g.carregadoresTotal} carregadores` : '';
      const detailText = `(Disponível: ${g.breakdown.disponivel}, Cautelado: ${g.breakdown.cautelado}, Manutenção: ${g.breakdown.manutencao})`;
      return `- ${g.modelo} [${g.fabricante}]: ${g.quantidadeTotal} un.${magText} ${detailText}`;
    }).join('\n');

    const pendenciasAbertas = pendenciasServico.filter(p => p.status === 'aberto');
    const pendenciasTexto = pendenciasAbertas.length > 0
      ? pendenciasAbertas.map((p, idx) => `${idx + 1}. ID: ${p.id_pendencia.substring(0, 8).toUpperCase()} - ${p.descricao}`).join('\n')
      : 'Nenhuma alteração ou pendência em aberto registrada.';

    const getMilText = (matricula: string) => {
      const u = usuarios.find(usr => usr.matricula === matricula);
      const cleanMat = matricula.toUpperCase().startsWith('A') ? matricula.substring(1) : matricula;
      return u ? `${u.posto_graduacao} ${u.nome_de_guerra || u.nome} (${cleanMat})` : cleanMat;
    };

    const cleanActiveArmeiroMat = activeArmeiroMatricula.toUpperCase().startsWith('A') ? activeArmeiroMatricula.substring(1) : activeArmeiroMatricula;
    const armeiroAnteriorText = getMilText(handoverArmeiroAnterior);
    const armeiroDiaText = loggedArmeiroUser 
      ? `${loggedArmeiroUser.posto_graduacao} ${loggedArmeiroUser.nome_de_guerra || loggedArmeiroUser.nome} (${cleanActiveArmeiroMat})`
      : cleanActiveArmeiroMat;
    const adjuntoText = getMilText(handoverAdjunto);
    const oficialDiaText = getMilText(handoverOficialDia);
    const proximoArmeiroText = getMilText(handoverProximoArmeiro);

    const dataHoraStr = new Date().toLocaleString('pt-BR');
    const ocoId = `OCO-${Math.floor(100000 + Math.random() * 900000)}`;
    const ocoTitulo = `PASSAGEM DE SERVIÇO - ${dataHoraStr}`;

    const formatDataPorExtensoMaiusculo = (date: Date) => {
      const meses = [
        'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
        'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
      ];
      const dia = date.getDate();
      const mes = meses[date.getMonth()];
      const ano = date.getFullYear();
      return `${dia} DE ${mes} DE ${ano}`;
    };

    const formatDataPorExtensoMinusculo = (date: Date) => {
      const meses = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
      ];
      const dia = date.getDate();
      const mes = meses[date.getMonth()];
      const ano = date.getFullYear();
      return `${dia} de ${mes} de ${ano}`;
    };

    const dataExtenso = formatDataPorExtensoMaiusculo(new Date());
    const dataMinusculo = formatDataPorExtensoMinusculo(new Date());
    const alteracoesTextoOpcao = pendenciasServico.filter(p => p.status === 'aberto').length > 0 ? 'COM' : 'SEM';

    const ataTexto = `PARTE DIÁRIA DO ARMEIRO DA RESERVA DE ARMAMENTO DO RPMON DO DIA ${dataExtenso}.

Assumi o serviço em substituição ao ${armeiroAnteriorText}, no horário regulamentar com todas as ordens em vigor e ${alteracoesTextoOpcao} alterações constantes no Livro de Parte Diária anterior.

SERVIÇO DIÁRIO
Oficial CPU: ${oficialDiaText}
Adjunto ao CPU: ${adjuntoText}
Armeiro de dia: ${armeiroDiaText}

MATERIAL CARGA
${listEstoqueDetallado}

SITUAÇÃO DAS ALTERAÇÕES E PENDÊNCIAS DO SERVIÇO
${pendenciasTexto}

CONFERÊNCIA FÍSICA E QUANTITATIVA
Certifico que a contagem física do estoque do paiol foi devidamente conferida e validada nas últimas 24h, estando em concordância plena com as quantidades informadas de cada item e gravadas no SGBD.

PASSAGEM DE SERVIÇO
Foi realizada ao ${proximoArmeiroText}, no horário Regulamentar e com todas as ordens em vigor, bem como ${alteracoesTextoOpcao} alterações constantes no LIVRO DE CONTROLE MATERIAL

Riacho Fundo I - DF, ${dataMinusculo}.`;

    const novaOco = salvarOcorrencia(ocoTitulo, 'troca_turno', ataTexto);

    handlePrintOcorrencia(novaOco);

    setHandoverArmeiroAnterior('');
    setHandoverAdjunto('');
    setHandoverOficialDia('');
    setHandoverProximoArmeiro('');
    setHandoverError('');
    setIsHandoverModalOpen(false);
  };

  // Filtros do Relatório Periódico (Padrão: últimas 24 horas)
  const [startDateStr, setStartDateStr] = useState(() => {
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tzoffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
  });
  const [endDateStr, setEndDateStr] = useState(() => {
    const d = new Date();
    const tzoffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
  });
  const [showPaidReceived, setShowPaidReceived] = useState(true);
  const [showPending, setShowPending] = useState(true);
  const [showPrivateWeapons, setShowPrivateWeapons] = useState(true);

  // Filtro de Busca de Armas Particulares
  const [privateSearchQuery, setPrivateSearchQuery] = useState('');

  // Lógica de cálculo do Relatório Periódico: Movimentações
  const periodMovimentacoes = useMemo(() => {
    if (selectedReportTab !== 'periodico' && !isReportsModalOpen) return [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    return cautelas
      .filter(c => {
        const checkOutDate = new Date(c.data_retirada);
        const checkInDate = c.data_devolucao_efetiva ? new Date(c.data_devolucao_efetiva) : null;
        const outInPeriod = checkOutDate >= start && checkOutDate <= end;
        const inInPeriod = checkInDate && checkInDate >= start && checkInDate <= end;
        return outInPeriod || inInPeriod;
      })
      .map(c => {
        const pol = usuarios.find(u => u.matricula === c.matricula_policial);
        const items = cautelaItens
          .filter(ci => ci.id_cautela === c.id_cautela)
          .map(ci => {
            const mat = materiais.find(m => m.id_material === ci.id_material);
            return `${mat?.modelo || 'Desconhecido'} (${mat?.controle_quantidade ? `x${ci.quantidade}` : ci.id_material})`;
          })
          .join(', ');

        return {
          matricula: c.matricula_policial,
          nome: pol?.nome || 'Desconhecido',
          nome_de_guerra: pol?.nome_de_guerra || pol?.nome || 'Desconhecido',
          materiais: items,
          hora_cautela: new Date(c.data_retirada).toLocaleString(),
          hora_devolucao: c.data_devolucao_efetiva ? new Date(c.data_devolucao_efetiva).toLocaleString() : 'Pendente'
        };
      });
  }, [cautelas, usuarios, cautelaItens, materiais, startDateStr, endDateStr, selectedReportTab, isReportsModalOpen]);

  // Lógica de cálculo do Relatório Periódico: Pendências
  const periodPendencias = useMemo(() => {
    if (selectedReportTab !== 'periodico' && !isReportsModalOpen) return [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    return cautelas
      .filter(c => {
        const checkOutDate = new Date(c.data_retirada);
        const outInPeriod = checkOutDate >= start && checkOutDate <= end;
        const isPending = !c.data_devolucao_efetiva;
        return outInPeriod && isPending;
      })
      .map(c => {
        const pol = usuarios.find(u => u.matricula === c.matricula_policial);
        const items = cautelaItens
          .filter(ci => ci.id_cautela === c.id_cautela)
          .map(ci => {
            const mat = materiais.find(m => m.id_material === ci.id_material);
            return `${mat?.modelo || 'Desconhecido'} (${mat?.controle_quantidade ? `x${ci.quantidade}` : ci.id_material})`;
          })
          .join(', ');

        return {
          matricula: c.matricula_policial,
          nome: pol?.nome || 'Desconhecido',
          nome_de_guerra: pol?.nome_de_guerra || pol?.nome || 'Desconhecido',
          materiais: items,
          previsao: new Date(c.previsao_devolucao).toLocaleString()
        };
      });
  }, [cautelas, usuarios, cautelaItens, materiais, startDateStr, endDateStr, selectedReportTab, isReportsModalOpen]);

  // Lógica de cálculo do Relatório Periódico: Movimentação de Armas Particulares
  const periodArmasParticularesMov = useMemo(() => {
    if (selectedReportTab !== 'periodico' && !isReportsModalOpen) return [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    const movs: any[] = [];

    armasParticulares.forEach(arma => {
      const pol = usuarios.find(u => u.matricula === arma.matricula_policial);
      const polName = pol?.nome_de_guerra || pol?.nome || 'Desconhecido';
      const modeloSerie = `${arma.modelo} ${arma.numero_serie ? `(SN: ${arma.numero_serie})` : ''}`;

      // Entrada/Depósito
      const depDate = new Date(arma.data_deposito);
      if (depDate >= start && depDate <= end) {
        movs.push({
          matricula: arma.matricula_policial,
          nome: pol?.nome || 'Desconhecido',
          nome_de_guerra: polName,
          modelo_serie: modeloSerie,
          tipo_mov: 'Entrada/Depósito',
          data_hora: depDate.toLocaleString(),
          obs: arma.observacoes || 'Sem observações'
        });
      }

      // Saída/Devolução
      if (arma.status === 'devolvido' && arma.data_devolucao) {
        const devDate = new Date(arma.data_devolucao);
        if (devDate >= start && devDate <= end) {
          movs.push({
            matricula: arma.matricula_policial,
            nome: pol?.nome || 'Desconhecido',
            nome_de_guerra: polName,
            modelo_serie: modeloSerie,
            tipo_mov: 'Saída/Retirada',
            data_hora: devDate.toLocaleString(),
            obs: arma.observacoes || 'Sem observações'
          });
        }
      }
    });

    return movs.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
  }, [armasParticulares, usuarios, startDateStr, endDateStr, selectedReportTab, isReportsModalOpen]);

  // Lógica de cálculo: Estoque da Reserva (Item a Item, individual)
  const estoqueRelatorioData = useMemo(() => {
    if (selectedReportTab !== 'estoque' && !isReportsModalOpen) return [];

    const activeCautelas = cautelas.filter(c => !c.data_devolucao_efetiva);

    return materiais.map(m => {
      // Obter nome da categoria
      const cat = categorias.find(c => c.id_categoria === m.id_categoria);
      const catName = cat ? cat.nome : 'Sem Categoria';

      // Verificar se é item coletivo (ex: munições)
      if (m.controle_quantidade) {
        // Obter todas as cautelas ativas que contêm este lote de munição
        const activeCautelaItensForLote = cautelaItens.filter(ci => 
          ci.id_material === m.id_material && 
          activeCautelas.some(ac => ac.id_cautela === ci.id_cautela)
        );

        const totalCautelado = activeCautelaItensForLote.reduce((sum, ci) => sum + (ci.quantidade || 0), 0);
        const totalDisponivel = Math.max(0, (m.quantidade || 0) - totalCautelado);

        // Obter lista de policiais com esta munição
        const custDetails = activeCautelaItensForLote.map(ci => {
          const ac = activeCautelas.find(c => c.id_cautela === ci.id_cautela);
          const pol = ac ? usuarios.find(u => u.matricula === ac.matricula_policial) : null;
          const polName = pol ? `${pol.posto_graduacao} ${pol.nome_de_guerra || pol.nome}` : 'Militar Desconhecido';
          return {
            nome: polName,
            matricula: ac?.matricula_policial || '',
            desde: ac ? new Date(ac.data_retirada).toLocaleString() : '',
            qtd: ci.quantidade
          };
        }).filter(c => c.matricula);

        const respText = custDetails.length > 0
          ? custDetails.map(c => `${c.nome} (${c.qtd} un.)`).join(', ')
          : '-';

        return {
          id_material: m.id_material,
          categoria: catName,
          modelo: m.modelo,
          fabricante: m.fabricante,
          calibre: m.calibre || 'N/A',
          status_atual: `Lote (${totalDisponivel} un. disp. / ${totalCautelado} un. em campo)`,
          responsavel: respText,
          desde: undefined,
          isColetivo: true,
          total: m.quantidade || 0,
          disponivel: totalDisponivel,
          fora: totalCautelado,
          custodiantes: custDetails
        };
      } else {
        // Item individual (arma, colete, HT)
        const activeCautelaItem = cautelaItens.find(ci => 
          ci.id_material === m.id_material && 
          activeCautelas.some(ac => ac.id_cautela === ci.id_cautela)
        );

        const activeCautela = activeCautelaItem 
          ? activeCautelas.find(c => c.id_cautela === activeCautelaItem.id_cautela) 
          : null;

        const pol = activeCautela ? usuarios.find(u => u.matricula === activeCautela.matricula_policial) : null;
        const polName = pol ? `${pol.posto_graduacao} ${pol.nome_de_guerra || pol.nome}` : 'Militar Desconhecido';

        let respText = '-';
        let statusStr: string = m.status_atual;
        let desdeStr: string | undefined = undefined;

        if (m.status_atual === 'cautelado') {
          respText = activeCautela ? `${polName} (${activeCautela.matricula_policial})` : 'Militar Desconhecido';
          desdeStr = activeCautela ? new Date(activeCautela.data_retirada).toLocaleString() : undefined;
          statusStr = 'Cautelado';
        } else if (m.status_atual === 'manutencao') {
          statusStr = 'Manutenção';
          respText = 'Oficina / Manutenção';
        } else if (m.status_atual === 'disponivel') {
          statusStr = 'Disponível';
        } else if (m.status_atual === 'condenado') {
          statusStr = 'Condenado';
        } else if (m.status_atual === 'indisponivel') {
          statusStr = 'Indisponível';
        } else if (m.status_atual === 'danificado') {
          statusStr = 'Danificado';
        }

        return {
          id_material: m.id_material,
          categoria: catName,
          modelo: m.modelo,
          fabricante: m.fabricante,
          calibre: m.calibre || 'N/A',
          status_atual: statusStr,
          responsavel: respText,
          desde: desdeStr,
          isColetivo: false,
          total: 1,
          disponivel: m.status_atual === 'disponivel' ? 1 : 0,
          fora: m.status_atual === 'cautelado' ? 1 : 0,
          custodiantes: activeCautela ? [{
            nome: polName,
            matricula: activeCautela.matricula_policial,
            desde: new Date(activeCautela.data_retirada).toLocaleString(),
            qtd: 1
          }] : []
        };
      }
    });
  }, [materiais, cautelas, cautelaItens, usuarios, categorias, selectedReportTab, isReportsModalOpen]);

  // Lógica de filtragem dinâmica para a listagem completa do Estoque
  const filteredEstoqueData = useMemo(() => {
    const q = stockSearchQuery.toLowerCase().trim();
    if (!q) return estoqueRelatorioData;
    return estoqueRelatorioData.filter(item => 
      item.id_material.toLowerCase().includes(q) ||
      item.categoria.toLowerCase().includes(q) ||
      item.modelo.toLowerCase().includes(q) ||
      item.fabricante.toLowerCase().includes(q) ||
      item.calibre.toLowerCase().includes(q) ||
      item.status_atual.toLowerCase().includes(q) ||
      item.responsavel.toLowerCase().includes(q)
    );
  }, [estoqueRelatorioData, stockSearchQuery]);

  // Lógica de cálculo: Armas Particulares Ativas
  const armasParticularesData = useMemo(() => {
    if (selectedReportTab !== 'particulares' && !isReportsModalOpen) return [];

    const activeArmas = armasParticulares.filter(a => a.status === 'guardado');

    return activeArmas
      .map(arma => {
        const pol = usuarios.find(u => u.matricula === arma.matricula_policial);
        const polName = pol ? `${pol.posto_graduacao} ${pol.nome_de_guerra || pol.nome}` : 'Militar Desconhecido';
        
        return {
          id: arma.id_particular,
          matricula: arma.matricula_policial,
          nome: polName,
          modelo: arma.modelo,
          fabricante: arma.fabricante || 'Desconhecido',
          calibre: arma.calibre || 'N/A',
          numero_serie: arma.numero_serie || 'S/N',
          data_deposito: new Date(arma.data_deposito).toLocaleString(),
          obs: arma.observacoes || 'Sem observações'
        };
      })
      .filter(arma => {
        const query = privateSearchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
          arma.matricula.toLowerCase().includes(query) ||
          arma.nome.toLowerCase().includes(query) ||
          arma.modelo.toLowerCase().includes(query) ||
          arma.numero_serie.toLowerCase().includes(query)
        );
      });
  }, [armasParticulares, usuarios, privateSearchQuery, selectedReportTab, isReportsModalOpen]);

  const triggerPrintReport = () => {
    let reportData: any = {};
    if (selectedReportTab === 'periodico') {
      reportData = {
        title: 'Relatório Periódico de Movimentações - PMDF',
        meta: `Período: ${new Date(startDateStr).toLocaleString()} até ${new Date(endDateStr).toLocaleString()} | Gerado em: ${new Date().toLocaleString()}`,
        type: 'periodico',
        data: {
          movimentacoes: showPaidReceived ? periodMovimentacoes : [],
          pendentes: showPending ? periodPendencias : [],
          armasParticularesMov: showPrivateWeapons ? periodArmasParticularesMov : []
        }
      };
    } else if (selectedReportTab === 'estoque') {
      reportData = {
        title: 'Relatório de Estoque da Reserva - PMDF',
        meta: `Inventário gerado em: ${new Date().toLocaleString()}`,
        type: 'estoque',
        data: {
          itens: estoqueRelatorioData
        }
      };
    } else {
      reportData = {
        title: 'Relatório de Armas Particulares Custodiadas - PMDF',
        meta: `Consulta gerada em: ${new Date().toLocaleString()}`,
        type: 'particulares',
        data: {
          armas: armasParticularesData
        }
      };
    }
    handlePrintRelatorio(reportData);
  };

  // Estados locais do Livro de Ocorrências (Aba Diário)
  const [ocorrenciaTitulo, setOcorrenciaTitulo] = useState('');
  const [ocorrenciaTipo, setOcorrenciaTipo] = useState<'troca_turno' | 'avaria_material' | 'fiscalizacao' | 'outros' | 'conferencia_estoque'>('troca_turno');
  const [ocorrenciaDescricao, setOcorrenciaDescricao] = useState('');
  const [ocorrenciaSuccess, setOcorrenciaSuccess] = useState('');
  const [ocorrenciaError, setOcorrenciaError] = useState('');

  // Estados locais da Contagem de Estoque
  const [conferidos, setConferidos] = useState<Record<string, boolean>>({});
  const [estoqueObservacao, setEstoqueObservacao] = useState('');
  const [estoqueSuccess, setEstoqueSuccess] = useState('');
  const [estoqueError, setEstoqueError] = useState('');

  // Estados locais do Painel de Alterações (Pendências)
  const [alteracaoFilter, setAlteracaoFilter] = useState<'todas' | 'abertas' | 'resolvidas'>('todas');
  const [isNovaPendenciaFormOpen, setIsNovaPendenciaFormOpen] = useState(false);
  const [novaPendenciaDescricao, setNovaPendenciaDescricao] = useState('');
  const [pendenciaError, setPendenciaError] = useState('');
  const [pendenciaSuccess, setPendenciaSuccess] = useState('');
  
  const [isResolvingPendenciaId, setIsResolvingPendenciaId] = useState<string | null>(null);
  const [resolucaoTexto, setResolucaoTexto] = useState('');
  const [isSubmittingPendencia, setIsSubmittingPendencia] = useState(false);

  // Agrupamento de materiais por modelo para contagem
  const estoqueAgrupado = useMemo(() => {
    const groups: Record<string, {
      modelo: string;
      fabricante: string;
      categoriaId: string;
      isColetivo: boolean;
      quantidadeTotal: number;
      carregadoresTotal: number;
      breakdown: {
        disponivel: number;
        cautelado: number;
        manutencao: number;
        condenado: number;
        indisponivel: number;
        danificado: number;
        retirado: number;
      };
    }> = {};

    const activeCautelas = cautelas.filter(c => !c.data_devolucao_efetiva);

    materiais.forEach(m => {
      const key = m.modelo;
      if (!groups[key]) {
        groups[key] = {
          modelo: m.modelo,
          fabricante: m.fabricante,
          categoriaId: m.id_categoria,
          isColetivo: !!m.controle_quantidade,
          quantidadeTotal: 0,
          carregadoresTotal: 0,
          breakdown: {
            disponivel: 0,
            cautelado: 0,
            manutencao: 0,
            condenado: 0,
            indisponivel: 0,
            danificado: 0,
            retirado: 0,
          }
        };
      }

      if (m.controle_quantidade) {
        // Obter todas as cautelas ativas que contêm este lote de munição
        const activeCautelaItensForLote = cautelaItens.filter(ci => 
          ci.id_material === m.id_material && 
          activeCautelas.some(ac => ac.id_cautela === ci.id_cautela)
        );

        const totalCautelado = activeCautelaItensForLote.reduce((sum, ci) => sum + (ci.quantidade || 0), 0);
        const totalDisponivel = Math.max(0, (m.quantidade || 0) - totalCautelado);

        groups[key].quantidadeTotal += m.quantidade || 0;
        groups[key].breakdown.disponivel += totalDisponivel;
        groups[key].breakdown.cautelado += totalCautelado;

        // Tratar outros possíveis status
        if (m.status_atual !== 'disponivel' && m.status_atual !== 'cautelado' && m.status_atual !== 'retirado') {
          const status = m.status_atual as keyof typeof groups[string]['breakdown'];
          if (groups[key].breakdown[status] !== undefined) {
            groups[key].breakdown[status] += totalDisponivel;
            groups[key].breakdown.disponivel -= totalDisponivel;
          }
        }
      } else {
        const qty = 1;
        groups[key].quantidadeTotal += qty;
        
        if (m.quantidade_carregadores) {
          groups[key].carregadoresTotal += m.quantidade_carregadores;
        }

        if (m.status_atual === 'cautelado') {
          groups[key].breakdown.cautelado += qty;
        } else if (['manutencao', 'danificado', 'indisponivel', 'condenado'].includes(m.status_atual)) {
          groups[key].breakdown.manutencao += qty;
        }
      }
    });

    Object.values(groups).forEach(g => {
      if (!g.isColetivo) {
        g.breakdown.disponivel = Math.max(0, g.quantidadeTotal - g.breakdown.cautelado - g.breakdown.manutencao);
      }
    });

    return Object.values(groups);
  }, [materiais, cautelas, cautelaItens]);

  const handleSalvarOcorrenciaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOcorrenciaSuccess('');
    setOcorrenciaError('');

    const tituloNorm = ocorrenciaTitulo.trim();
    const descNorm = ocorrenciaDescricao.trim();

    if (!tituloNorm || !descNorm) {
      setOcorrenciaError('Preencha todos os campos do relatório.');
      return;
    }

    salvarOcorrencia(tituloNorm, ocorrenciaTipo, descNorm);

    setOcorrenciaTitulo('');
    setOcorrenciaTipo('troca_turno');
    setOcorrenciaDescricao('');
    setOcorrenciaSuccess('Relatório de ocorrência registrado e gravado no SGBD com sucesso!');
  };

  const handleFinalizarConferencia = (e: React.FormEvent) => {
    e.preventDefault();
    setEstoqueSuccess('');
    setEstoqueError('');

    // Verificar se há algum item não marcado como conferido
    const itensNaoConferidos = estoqueAgrupado.filter(g => !conferidos[g.modelo]);
    
    if (itensNaoConferidos.length > 0 && !estoqueObservacao.trim()) {
      setEstoqueError('Justificativa obrigatória: existem itens não conferidos no estoque.');
      return;
    }

    // Gerar título
    const dataHoraStr = new Date().toLocaleString('pt-BR');
    const titulo = `CONFERÊNCIA DE ESTOQUE - ${dataHoraStr}`;

    // Gerar descrição detalhada
    const listConferidos = estoqueAgrupado
      .filter(g => conferidos[g.modelo])
      .map(g => {
        const magText = g.carregadoresTotal > 0 ? ` + ${g.carregadoresTotal} carregadores` : '';
        const detailText = `(Disponível: ${g.breakdown.disponivel}, Cautelado: ${g.breakdown.cautelado}, Manutenção: ${g.breakdown.manutencao})`;
        return `- ${g.modelo} [${g.fabricante}]: ${g.quantidadeTotal} un.${magText} ${detailText}`;
      });

    const listNaoConferidos = estoqueAgrupado
      .filter(g => !conferidos[g.modelo])
      .map(g => {
        const magText = g.carregadoresTotal > 0 ? ` + ${g.carregadoresTotal} carregadores` : '';
        const detailText = `(Disponível: ${g.breakdown.disponivel}, Cautelado: ${g.breakdown.cautelado}, Manutenção: ${g.breakdown.manutencao})`;
        return `- ${g.modelo} [${g.fabricante}]: ${g.quantidadeTotal} un.${magText} ${detailText}`;
      });

    const breakdownText = `=== CONFERÊNCIA FÍSICA E QUANTITATIVA DE ESTOQUE ===
Data/Hora: ${dataHoraStr}
Resultado Geral: ${itensNaoConferidos.length === 0 ? 'CONCORDÂNCIA PLENA DO PAIOL' : 'DIVERGÊNCIA / ITENS EM ABERTO'}

ITENS CONFERIDOS E OK:
${listConferidos.length > 0 ? listConferidos.join('\n') : '- Nenhum item marcado como OK.'}

ITENS EM ABERTO / PENDENTES:
${listNaoConferidos.length > 0 ? listNaoConferidos.join('\n') : '- Nenhum item com divergência.'}

OBSERVAÇÕES E RELATOS DE DIVERGÊNCIA:
${estoqueObservacao.trim() || 'Sem divergências ou alterações físicas relatadas. O estoque físico confere integralmente com os dados do SGBD.'}
`;

    salvarOcorrencia(titulo, 'conferencia_estoque', breakdownText);

    // Limpar estados
    setConferidos({});
    setEstoqueObservacao('');
    setEstoqueSuccess('Conferência de estoque registrada no Livro de Ocorrências com sucesso!');
    
    // Fechar o modal após 1.8s para ver o log gerado
    setTimeout(() => {
      setIsStockModalOpen(false);
      setEstoqueSuccess('');
    }, 1800);
  };

  const handleTentativaFecharModal = () => {
    const hasProgress = Object.values(conferidos).some(val => val === true) || estoqueObservacao.trim() !== '';
    if (hasProgress) {
      const confirmClose = window.confirm(
        "Você possui alterações pendentes na contagem de estoque. Deseja realmente fechar? Todo o progresso não gravado será perdido."
      );
      if (!confirmClose) return;
    }
    // Limpar estados e fechar
    setConferidos({});
    setEstoqueObservacao('');
    setEstoqueError('');
    setEstoqueSuccess('');
    setIsStockModalOpen(false);
  };

  const handleNovaPendenciaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendenciaError('');
    setPendenciaSuccess('');
    
    const desc = novaPendenciaDescricao.trim();
    if (!desc) {
      setPendenciaError('Descreva a pendência antes de gravar.');
      return;
    }

    try {
      setIsSubmittingPendencia(true);
      await adicionarPendencia(desc);
      setPendenciaSuccess('Pendência de serviço registrada com sucesso!');
      setNovaPendenciaDescricao('');
      setIsNovaPendenciaFormOpen(false);
      
      setTimeout(() => {
        setPendenciaSuccess('');
      }, 3000);
    } catch (err: any) {
      setPendenciaError('Erro ao registrar pendência: ' + err.message);
    } finally {
      setIsSubmittingPendencia(false);
    }
  };

  const handleResolverPendenciaSubmit = async (e: React.FormEvent, idPendencia: string) => {
    e.preventDefault();
    setPendenciaError('');
    setPendenciaSuccess('');

    const res = resolucaoTexto.trim();
    if (!res) {
      setPendenciaError('Descreva o que foi feito para resolver a pendência.');
      return;
    }

    try {
      setIsSubmittingPendencia(true);
      await resolverPendencia(idPendencia, res);
      setPendenciaSuccess('Pendência marcada como resolvida com sucesso!');
      setIsResolvingPendenciaId(null);
      setResolucaoTexto('');
      
      setTimeout(() => {
        setPendenciaSuccess('');
      }, 3000);
    } catch (err: any) {
      setPendenciaError('Erro ao resolver pendência: ' + err.message);
    } finally {
      setIsSubmittingPendencia(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="arm-ocorrencias-view">
      {/* Top Banner com Botão de Abertura do Modal */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 shadow-lg">
        <div className="space-y-1">
          <h3 className="text-xs font-bold font-mono text-slate-205 uppercase tracking-widest flex items-center gap-2">
            <Terminal className="h-4.5 w-4.5 text-blue-505 glow-blue" />
            <span>Livro Digital de Ocorrências</span>
          </h3>
          <p className="text-xs text-slate-450 font-sans">Visualização e registro histórico das atividades diárias e ocorrências bélicas da reserva.</p>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          {/* Botão de Contagem de Estoque */}
          <button
            onClick={() => setIsStockModalOpen(true)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-550 active:scale-95 text-white font-bold font-mono text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-950/45 glow-cyan duration-150"
          >
            <Boxes className="h-4 w-4 text-white animate-pulse" />
            <span>CONTAGEM DE ESTOQUE</span>
          </button>

          {/* Botão de Alterações do Serviço */}
          <button
            onClick={() => {
              setIsAlteracoesModalOpen(true);
              setPendenciaError('');
              setPendenciaSuccess('');
              setIsNovaPendenciaFormOpen(false);
              setNovaPendenciaDescricao('');
              setIsResolvingPendenciaId(null);
              setResolucaoTexto('');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-550 active:scale-95 text-white font-bold font-mono text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-950/45 glow-blue duration-150"
          >
            <BookOpen className="h-4 w-4 text-white animate-pulse" />
            <span>ALTERAÇÕES DO SERVIÇO</span>
          </button>

          {/* Botão de Relatórios */}
          <button
            onClick={() => {
              setIsReportsModalOpen(true);
              setPrivateSearchQuery('');
            }}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-550 active:scale-95 text-white font-bold font-mono text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-violet-950/45 glow-violet duration-150"
          >
            <FileText className="h-4 w-4 text-white animate-pulse" />
            <span>RELATÓRIOS</span>
          </button>

          {/* Botão de Passagem de Serviço */}
          <button
            onClick={() => {
              setIsHandoverModalOpen(true);
              setHandoverError('');
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-550 active:scale-95 text-white font-bold font-mono text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-950/45 glow-amber duration-150"
          >
            <History className="h-4 w-4 text-white animate-pulse" />
            <span>PASSAGEM DE SERVIÇO</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Formulário de Registro de Ocorrência (Sempre Visível) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4" id="arm-ocorrencias-form-wrapper">
            <div className="border-b border-slate-850 pb-3 flex items-center gap-2">
              <Terminal className="h-4.5 w-4.5 text-blue-550" />
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest">Registrar Nova Ocorrência</h3>
            </div>
            
            <form onSubmit={handleSalvarOcorrenciaSubmit} className="space-y-4 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide">Título / Assunto:</label>
                <input
                  type="text"
                  required
                  placeholder="EX: TROCA DE TURNO - SEM ALTERAÇÕES"
                  value={ocorrenciaTitulo}
                  onChange={(e) => setOcorrenciaTitulo(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-805 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20 uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Tipo de Ocorrência:</label>
                <select
                  value={ocorrenciaTipo}
                  onChange={(e) => setOcorrenciaTipo(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs text-slate-205 focus:outline-none rounded-lg cursor-pointer font-sans"
                >
                  <option value="troca_turno">Passagem/Troca de Turno</option>
                  <option value="avaria_material">Avaria / Falha de Material</option>
                  <option value="fiscalizacao">Fiscalização / Vistoria</option>
                  <option value="conferencia_estoque">Conferência de Estoque</option>
                  <option value="outros">Outros Incidentes</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Descrição Detalhada:</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Descreva detalhadamente o evento, informando seriais de armas envolvidas, estado do cofre, selos de segurança ou anomalias observadas..."
                  value={ocorrenciaDescricao}
                  onChange={(e) => setOcorrenciaDescricao(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-805 p-2.5 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              {ocorrenciaError && (
                <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex items-start gap-2 animate-pulse">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{ocorrenciaError}</span>
                </div>
              )}

              {ocorrenciaSuccess && (
                <div className="bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-lg text-xs text-emerald-450 font-mono flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{ocorrenciaSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                id="btn-registrar-ocorrencia-submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono py-2.5 rounded-lg text-xs transition-all shadow-md uppercase tracking-wider cursor-pointer glow-blue"
              >
                Registrar no Livro
              </button>
            </form>
          </div>
        </div>

        {/* Lado Direito: Histórico de Ocorrências (Sempre Visível) */}
        <div className="lg:col-span-5 space-y-4" id="arm-ocorrencias-list-wrapper">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-5 shadow-lg space-y-4">
            <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest">Livro Digital de Registro</h3>
              <span className="text-[8px] bg-blue-955/50 text-blue-400 font-mono border border-blue-900/50 px-2 py-0.5 rounded font-black uppercase">
                Ativo ({ocorrencias.length})
              </span>
            </div>

            <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1" id="ocorrencias-list">
              {ocorrencias.map((oco) => (
                <div 
                  key={oco.id_ocorrencia} 
                  className="bg-slate-955/40 p-4 border border-slate-855/80 rounded-lg hover:border-slate-750 transition-all font-mono text-xs space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                        oco.tipo === 'troca_turno'
                          ? 'bg-blue-955/50 text-blue-400 border-blue-900/40'
                          : oco.tipo === 'avaria_material'
                          ? 'bg-red-955/50 text-red-400 border-red-900/40'
                          : oco.tipo === 'fiscalizacao'
                          ? 'bg-emerald-950/50 text-emerald-455 border-emerald-900/40'
                          : oco.tipo === 'conferencia_estoque'
                          ? 'bg-purple-955/50 text-purple-400 border-purple-900/40 font-bold'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800'
                      }`}>
                        {oco.tipo.replace('_', ' ')}
                      </span>
                      <span className="text-slate-500 text-[9px]">ID: {oco.id_ocorrencia}</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handlePrintOcorrencia(oco)}
                      className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-455 hover:text-slate-200 py-1 px-2 rounded text-[9px] uppercase font-bold tracking-wider transition-colors flex items-center gap-1 cursor-pointer no-print font-mono"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Imprimir</span>
                    </button>
                  </div>

                  <div className="space-y-1 font-sans">
                    <h4 className="text-xs font-bold text-slate-100 uppercase font-mono">{oco.titulo}</h4>
                    <p className="text-[11px] text-slate-400 leading-normal whitespace-pre-wrap">{oco.descricao}</p>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1.5 border-t border-slate-905">
                    <span>Registrado: {new Date(oco.data_hora).toLocaleString()}</span>
                    <span>Armeiro: <strong className="text-slate-400">{oco.matricula_armeiro}</strong></span>
                  </div>
                </div>
              ))}
              
              {ocorrencias.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-550 leading-loose">
                  Nenhuma ocorrência ou relatório cadastrado na base simulada do paiol.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* JANELA MODAL DE CONTAGEM DE ESTOQUE */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp"
            id="arm-conferencia-estoque-wrapper"
          >
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-850 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-cyan-405" />
                <div>
                  <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-widest">Painel de Contagem de Estoque</h3>
                  <p className="text-[10px] text-slate-450 font-sans mt-0.5 font-normal">Realize a conferência física dos itens ativos do paiol.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] bg-cyan-955/50 text-cyan-400 font-mono border border-cyan-900/50 px-2.5 py-1 rounded font-black uppercase">
                  Total Modelos: {estoqueAgrupado.length}
                </span>
                <button
                  type="button"
                  onClick={handleTentativaFecharModal}
                  className="p-1.5 rounded-lg bg-slate-955 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Fechar Janela"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Form / Body do Modal */}
            <form onSubmit={handleFinalizarConferencia} className="flex-1 flex flex-col overflow-hidden">
              {/* Área Rolável Interna */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {estoqueAgrupado.map((group) => {
                    const isChecked = !!conferidos[group.modelo];
                    const isAmmo = group.categoriaId === 'CAT-MUNICAO';
                    return (
                      <div 
                        key={group.modelo} 
                        className={`p-3.5 border rounded-xl transition-all duration-200 flex flex-col justify-between gap-3 ${
                          isChecked 
                            ? 'bg-emerald-950/10 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.05)]' 
                            : 'bg-slate-955/40 border-slate-850 hover:border-slate-800'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <span className="text-[8px] font-mono text-slate-500 block uppercase tracking-wider truncate">{group.fabricante}</span>
                              <h4 className="text-[11px] font-bold text-slate-205 uppercase leading-snug truncate">{group.modelo}</h4>
                            </div>
                            <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded shrink-0 ${
                              isAmmo ? 'bg-amber-955/50 text-amber-400 border border-amber-900/40' : 'bg-blue-955/50 text-blue-400 border border-blue-900/40'
                            }`}>
                              {isAmmo ? 'MUNIÇÃO' : 'PATRIMÔNIO'}
                            </span>
                          </div>

                          <div className="text-xs font-mono py-0.5">
                            <div className="text-slate-350 font-black text-[12px] flex flex-wrap items-center gap-1">
                              <span>{group.quantidadeTotal} {isAmmo ? 'munições' : 'unidades'}</span>
                              {group.carregadoresTotal > 0 && (
                                <span className="text-slate-500 text-[10px] font-normal">
                                  (+ {group.carregadoresTotal} carregadores)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Detalhamento de Status */}
                          <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-900/60">
                            <span className="text-xs bg-slate-900/60 text-emerald-400 border border-slate-850/50 px-2 py-1 rounded font-mono">
                              {group.breakdown.disponivel} na reserva
                            </span>
                            {group.breakdown.cautelado > 0 && (
                              <span className="text-xs bg-slate-900/60 text-blue-400 border border-slate-850/50 px-2 py-1 rounded font-mono">
                                {group.breakdown.cautelado} na rua
                              </span>
                            )}
                            {group.breakdown.manutencao > 0 && (
                              <span className="text-xs bg-slate-900/60 text-amber-500 border border-slate-850/50 px-2 py-1 rounded font-mono">
                                {group.breakdown.manutencao} em manutenção
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botão de Toggle Checkbox */}
                        <button
                          type="button"
                          onClick={() => {
                            setConferidos(prev => ({
                              ...prev,
                              [group.modelo]: !prev[group.modelo]
                            }));
                          }}
                          className={`w-full py-1.5 px-2 rounded-lg border font-mono text-[9px] font-bold uppercase transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                            isChecked 
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20' 
                              : 'bg-slate-900 border-slate-800 text-slate-450 hover:border-slate-750 hover:text-slate-350'
                          }`}
                        >
                          {isChecked ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Estoque Conferido</span>
                            </>
                          ) : (
                            <>
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
                              <span>Marcar como Conferido</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-850">
                  <label className="text-[10px] font-mono font-bold text-slate-455 uppercase tracking-wide flex items-center gap-1">
                    <span>Observações / Relato de Divergências:</span>
                    {estoqueAgrupado.some(g => !conferidos[g.modelo]) && (
                      <span className="text-red-400 text-[8px] font-bold font-mono animate-pulse">
                        (OBRIGATÓRIO: ITENS EM ABERTO)
                      </span>
                    )}
                  </label>
                  <textarea
                    rows={3}
                    value={estoqueObservacao}
                    onChange={(e) => setEstoqueObservacao(e.target.value)}
                    placeholder="Justifique discrepâncias físicas ou o porquê de deixar algum item sem marcar..."
                    className="w-full bg-slate-955 border border-slate-805 p-2 text-xs text-slate-205 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20 placeholder-slate-650"
                  />
                </div>

                {estoqueError && (
                  <div className="bg-red-955/30 border border-red-900/40 p-2.5 rounded-lg text-[10px] text-red-400 font-mono flex items-start gap-2 animate-pulse">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{estoqueError}</span>
                  </div>
                )}

                {estoqueSuccess && (
                  <div className="bg-emerald-950/30 border border-emerald-900/40 p-2.5 rounded-lg text-[10px] text-emerald-450 font-mono flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{estoqueSuccess}</span>
                  </div>
                )}
              </div>

              {/* Rodapé do Modal */}
              <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleTentativaFecharModal}
                  className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 font-bold font-mono text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar / Fechar
                </button>
                
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold font-mono text-xs rounded-lg transition-all shadow-md hover:shadow-blue-500/20 active:scale-95 duration-150 cursor-pointer flex items-center gap-1.5 glow-blue"
                >
                  <Boxes className="h-4 w-4" />
                  <span>Finalizar Conferência</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JANELA MODAL DE ALTERAÇÕES DO SERVIÇO (PENDÊNCIAS) */}
      {isAlteracoesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp"
            id="arm-alteracoes-servico-wrapper"
          >
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-850 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-505 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-widest">Alterações do Serviço & Pendências</h3>
                  <p className="text-[10px] text-slate-455 font-sans mt-0.5 font-normal">Quadro bélico de pendências em aberto e histórico de resoluções de plantão.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsNovaPendenciaFormOpen(prev => !prev);
                    setPendenciaError('');
                    setPendenciaSuccess('');
                  }}
                  className="px-3.5 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-900/30 rounded-lg font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>{isNovaPendenciaFormOpen ? 'Ver Pendências' : 'Criar Nova Pendência'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAlteracoesModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-955 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Fechar Janela"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
              {/* Avisos rápidos de Sucesso / Erro */}
              {pendenciaSuccess && (
                <div className="bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-lg text-xs text-emerald-450 font-mono flex items-center gap-2 animate-fadeIn">
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{pendenciaSuccess}</span>
                </div>
              )}
              {pendenciaError && (
                <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex items-center gap-2 animate-pulse">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{pendenciaError}</span>
                </div>
              )}

              {isNovaPendenciaFormOpen ? (
                /* Formulário de Nova Pendência */
                <form onSubmit={handleNovaPendenciaSubmit} className="space-y-4 bg-slate-955/50 border border-slate-850 p-5 rounded-xl animate-fadeIn">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-blue-450" />
                      <span>Descreva a alteração ou pendência a ser registrada:</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={novaPendenciaDescricao}
                      onChange={(e) => setNovaPendenciaDescricao(e.target.value)}
                      placeholder="Descreva detalhadamente a alteração observada (Ex: 'Substituição da lâmpada de emergência queimada na sala de munições', 'Rádio HT patrimônio 2812 com carregador quebrado'...)"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 p-3 text-xs text-slate-205 focus:outline-none rounded-lg focus:ring-1 focus:ring-blue-500/20"
                      disabled={isSubmittingPendencia}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNovaPendenciaFormOpen(false);
                        setNovaPendenciaDescricao('');
                        setPendenciaError('');
                      }}
                      className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 font-bold font-mono text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
                      disabled={isSubmittingPendencia}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold font-mono text-[10px] uppercase rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5 glow-blue"
                      disabled={isSubmittingPendencia}
                    >
                      {isSubmittingPendencia ? 'Gravando...' : 'Gravar Alteração/Pendência'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Listagem de Pendências */
                <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                  {/* Filtros de Status */}
                  <div className="flex items-center gap-2 border-b border-slate-850 pb-2">
                    {(['todas', 'abertas', 'resolvidas'] as const).map((filter) => {
                      const isActive = alteracaoFilter === filter;
                      const label = filter === 'todas' ? 'Todas' : filter === 'abertas' ? 'Em Aberto' : 'Resolvidas';
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => {
                            setAlteracaoFilter(filter);
                            setIsResolvingPendenciaId(null);
                            setResolucaoTexto('');
                            setPendenciaError('');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all tracking-wider ${
                            isActive
                              ? 'bg-blue-600/15 border border-blue-500/30 text-blue-400'
                              : 'bg-slate-950 border border-slate-800 text-slate-450 hover:text-slate-350'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Lista Rolável */}
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
                    {(() => {
                      const filtered = pendenciasServico.filter((p) => {
                        if (alteracaoFilter === 'abertas') return p.status === 'aberto';
                        if (alteracaoFilter === 'resolvidas') return p.status === 'resolvido';
                        return true;
                      });

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-12 text-slate-505 font-mono text-xs border border-dashed border-slate-805 rounded-xl bg-slate-955/20">
                            Nenhuma alteração ou pendência encontrada neste filtro.
                          </div>
                        );
                      }

                      return filtered.map((item) => {
                        const isOpen = item.status === 'aberto';
                        const isResolving = isResolvingPendenciaId === item.id_pendencia;
                        return (
                          <div
                            key={item.id_pendencia}
                            className={`p-4 border rounded-xl transition-all duration-205 flex flex-col gap-3.5 relative ${
                              isOpen
                                ? 'bg-red-955/5 border-red-900/30 hover:border-red-900/50 shadow-[0_0_12px_rgba(239,68,68,0.02)]'
                                : 'bg-emerald-955/5 border-emerald-900/20 hover:border-emerald-900/40'
                            }`}
                          >
                            {/* Top info and status badge */}
                            <div className="flex items-center justify-between gap-3 border-b border-slate-850/40 pb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded border ${
                                  isOpen
                                    ? 'bg-red-955/35 text-red-400 border-red-900/40 animate-pulse'
                                    : 'bg-emerald-950/35 text-emerald-450 border-emerald-900/40'
                                }`}>
                                  {isOpen ? 'Em Aberto' : 'Resolvido'}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">ID: {item.id_pendencia.substring(0, 8).toUpperCase()}</span>
                              </div>
                              <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                                <span>Criado em: {new Date(item.data_criacao).toLocaleString()}</span>
                                <span className="text-slate-300 font-bold">Por: {item.matricula_criador}</span>
                              </div>
                            </div>

                            {/* Description text */}
                            <div className="text-slate-100 text-sm font-sans font-medium leading-relaxed whitespace-pre-wrap">
                              {item.descricao}
                            </div>

                            {/* Resolution Details or Resolve Form */}
                            {!isOpen && item.resolucao && (
                              <div className="bg-emerald-950/15 border border-emerald-900/25 p-3.5 rounded-lg flex flex-col gap-1.5 animate-fadeIn">
                                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 border-b border-emerald-900/10 pb-1.5 flex-wrap gap-1">
                                  <span className="flex items-center gap-1 font-bold">
                                    <Check className="h-4 w-4" />
                                    <span>RESOLVIDO</span>
                                  </span>
                                  <span>
                                    Em: {new Date(item.data_resolucao || '').toLocaleString()} | Resolvedor: <strong className="text-emerald-300">{item.matricula_resolvedor}</strong>
                                  </span>
                                </div>
                                <p className="text-sm font-sans text-slate-200 leading-relaxed italic">
                                  &ldquo;{item.resolucao}&rdquo;
                                </p>
                              </div>
                            )}

                            {isOpen && (
                              <div className="flex flex-col gap-3">
                                {!isResolving ? (
                                  <div className="flex justify-end pt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsResolvingPendenciaId(item.id_pendencia);
                                        setResolucaoTexto('');
                                        setPendenciaError('');
                                      }}
                                      className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-900/30 hover:border-emerald-800/80 rounded-lg text-[11px] font-mono font-bold uppercase transition-all duration-150 cursor-pointer flex items-center gap-1.5"
                                    >
                                      <Check className="h-4 w-4" />
                                      <span>Marcar como Resolvido</span>
                                    </button>
                                  </div>
                                ) : (
                                  /* Form de Resolução */
                                  <form 
                                    onSubmit={(e) => handleResolverPendenciaSubmit(e, item.id_pendencia)}
                                    className="bg-slate-955 border border-slate-805 p-4 rounded-lg space-y-3.5 animate-fadeIn"
                                  >
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] font-mono font-bold text-slate-455 uppercase tracking-wide block">Descreva o que foi feito para resolver (justificativa de resolução) *:</label>
                                      <textarea
                                        required
                                        rows={2}
                                        value={resolucaoTexto}
                                        onChange={(e) => setResolucaoTexto(e.target.value)}
                                        placeholder="Ex: HT enviado para substituição no DLS, ou HT reparado com troca de bateria..."
                                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 p-2 text-xs text-slate-205 focus:outline-none rounded focus:ring-1 focus:ring-emerald-500/20"
                                        disabled={isSubmittingPendencia}
                                      />
                                    </div>
                                    <div className="flex items-center justify-end gap-2.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsResolvingPendenciaId(null);
                                          setResolucaoTexto('');
                                        }}
                                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-450 hover:text-slate-205 text-[9px] font-mono font-bold uppercase rounded cursor-pointer"
                                        disabled={isSubmittingPendencia}
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        type="submit"
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-555 text-white text-[9px] font-mono font-bold uppercase rounded cursor-pointer transition-colors shadow-md"
                                        disabled={isSubmittingPendencia}
                                      >
                                        {isSubmittingPendencia ? 'Enviando...' : 'Confirmar Resolução'}
                                      </button>
                                    </div>
                                  </form>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-slate-955/40 border-t border-slate-850 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsAlteracoesModalOpen(false)}
                className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 font-bold font-mono text-xs rounded-lg transition-colors cursor-pointer"
              >
                Fechar Janela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JANELA MODAL DE RELATÓRIOS DO LIVRO DE OCORRÊNCIAS */}
      {isReportsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp"
            id="arm-relatorios-wrapper"
          >
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-850 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-450 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-widest">Painel de Geração de Relatórios</h3>
                  <p className="text-[10px] text-slate-450 font-sans mt-0.5 font-normal">Gere e imprima relatórios operacionais do estoque e movimentações da reserva.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-955 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Fechar Janela"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Abas de Tipo de Relatório */}
            <div className="flex border-b border-slate-850 bg-slate-950/20 px-6 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedReportTab('periodico')}
                className={`px-4 py-2 text-xs font-mono font-bold border-t-2 border-x border-b border-transparent rounded-t-lg transition-all cursor-pointer ${
                  selectedReportTab === 'periodico'
                    ? 'border-t-violet-500 border-x-slate-800 bg-slate-900 text-slate-100 border-b-slate-900'
                    : 'text-slate-455 hover:text-slate-200 hover:bg-slate-850/50'
                }`}
              >
                Relatório Periódico / Diário
              </button>
              <button
                type="button"
                onClick={() => setSelectedReportTab('estoque')}
                className={`px-4 py-2 text-xs font-mono font-bold border-t-2 border-x border-b border-transparent rounded-t-lg transition-all cursor-pointer ${
                  selectedReportTab === 'estoque'
                    ? 'border-t-violet-500 border-x-slate-800 bg-slate-900 text-slate-100 border-b-slate-900'
                    : 'text-slate-455 hover:text-slate-200 hover:bg-slate-850/50'
                }`}
              >
                Estoque da Reserva
              </button>
              <button
                type="button"
                onClick={() => setSelectedReportTab('particulares')}
                className={`px-4 py-2 text-xs font-mono font-bold border-t-2 border-x border-b border-transparent rounded-t-lg transition-all cursor-pointer ${
                  selectedReportTab === 'particulares'
                    ? 'border-t-violet-500 border-x-slate-800 bg-slate-900 text-slate-100 border-b-slate-900'
                    : 'text-slate-455 hover:text-slate-200 hover:bg-slate-850/50'
                }`}
              >
                Armas Particulares
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar font-sans text-xs">
              
              {/* ABA 1: RELATÓRIO PERIÓDICO */}
              {selectedReportTab === 'periodico' && (
                <div className="space-y-6">
                  {/* Controles de Filtros */}
                  <div className="bg-slate-955/20 border border-slate-800 p-4 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-violet-400" />
                          <span>Data/Hora Início:</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={startDateStr}
                          onChange={(e) => setStartDateStr(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 p-2 text-xs text-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500/20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-violet-400" />
                          <span>Data/Hora Fim:</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={endDateStr}
                          onChange={(e) => setEndDateStr(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 p-2 text-xs text-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500/20"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-850/60">
                      <label className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-slate-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showPaidReceived}
                          onChange={(e) => setShowPaidReceived(e.target.checked)}
                          className="rounded text-violet-600 bg-slate-900 border-slate-800 focus:ring-violet-500 cursor-pointer h-4 w-4"
                        />
                        <span>Materiais Pagos e Recebidos</span>
                      </label>

                      <label className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-slate-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showPending}
                          onChange={(e) => setShowPending(e.target.checked)}
                          className="rounded text-violet-600 bg-slate-900 border-slate-800 focus:ring-violet-500 cursor-pointer h-4 w-4"
                        />
                        <span>Materiais Não Entregues (Pendentes)</span>
                      </label>

                      <label className="flex items-center gap-2 font-mono text-[10px] uppercase font-bold text-slate-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showPrivateWeapons}
                          onChange={(e) => setShowPrivateWeapons(e.target.checked)}
                          className="rounded text-violet-600 bg-slate-900 border-slate-800 focus:ring-violet-500 cursor-pointer h-4 w-4"
                        />
                        <span>Armas Particulares (Movimento)</span>
                      </label>
                    </div>
                  </div>

                  {/* Resultados das tabelas */}
                  <div className="space-y-6">
                    {/* Tabela de Pagos/Recebidos */}
                    {showPaidReceived && (
                      <div className="space-y-2 animate-fadeIn">
                        <h4 className="text-[11px] font-bold font-mono text-slate-205 uppercase tracking-widest border-l-2 border-violet-500 pl-2 flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-violet-400" />
                          <span>Materiais Pagos e Recebidos no Período ({periodMovimentacoes.length})</span>
                        </h4>
                        <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-900/80 border-b border-slate-850 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                                <th className="p-3">Matrícula</th>
                                <th className="p-3">Policial (Guerra)</th>
                                <th className="p-3">Materiais</th>
                                <th className="p-3">Saída (Pago)</th>
                                <th className="p-3">Retorno (Recebido)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {periodMovimentacoes.map((mov, index) => (
                                <tr key={index} className="border-b border-slate-855/50 hover:bg-slate-850/10 transition-colors font-mono">
                                  <td className="p-3 font-semibold text-slate-300">{mov.matricula}</td>
                                  <td className="p-3 font-sans text-slate-200">{mov.nome} ({mov.nome_de_guerra})</td>
                                  <td className="p-3 font-sans text-slate-300 max-w-xs truncate" title={mov.materiais}>{mov.materiais}</td>
                                  <td className="p-3 text-slate-455">{mov.hora_cautela}</td>
                                  <td className="p-3">
                                    {mov.hora_devolucao === 'Pendente' ? (
                                      <span className="text-amber-500 text-[10px] font-bold uppercase">Pendente</span>
                                    ) : (
                                      <span className="text-emerald-400">{mov.hora_devolucao}</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {periodMovimentacoes.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="p-4 text-center text-slate-500 font-mono italic">
                                    Nenhuma movimentação de cautela registrada no período selecionado.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Tabela de Pendentes de Devolução */}
                    {showPending && (
                      <div className="space-y-2 animate-fadeIn">
                        <h4 className="text-[11px] font-bold font-mono text-slate-205 uppercase tracking-widest border-l-2 border-amber-500 pl-2 flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
                          <span>Materiais Cautelados no Período Pendentes de Devolução ({periodPendencias.length})</span>
                        </h4>
                        <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-900/80 border-b border-slate-850 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                                <th className="p-3">Matrícula</th>
                                <th className="p-3">Policial (Guerra)</th>
                                <th className="p-3">Materiais</th>
                                <th className="p-3">Previsão Devolução</th>
                              </tr>
                            </thead>
                            <tbody>
                              {periodPendencias.map((pend, index) => (
                                <tr key={index} className="border-b border-slate-855/50 hover:bg-slate-850/10 transition-colors font-mono">
                                  <td className="p-3 font-semibold text-slate-300">{pend.matricula}</td>
                                  <td className="p-3 font-sans text-slate-200">{pend.nome} ({pend.nome_de_guerra})</td>
                                  <td className="p-3 font-sans text-slate-300">{pend.materiais}</td>
                                  <td className="p-3 text-amber-500 font-semibold">{pend.previsao}</td>
                                </tr>
                              ))}
                              {periodPendencias.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="p-4 text-center text-slate-500 font-mono italic">
                                    Nenhuma cautela do período está pendente de devolução.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Tabela de Armas Particulares Movimentadas */}
                    {showPrivateWeapons && (
                      <div className="space-y-2 animate-fadeIn">
                        <h4 className="text-[11px] font-bold font-mono text-slate-205 uppercase tracking-widest border-l-2 border-violet-500 pl-2 flex items-center gap-1.5">
                          <ClipboardList className="h-4 w-4 text-violet-400" />
                          <span>Armas Particulares - Depósitos e Devoluções no Período ({periodArmasParticularesMov.length})</span>
                        </h4>
                        <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-900/80 border-b border-slate-850 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                                <th className="p-3">Matrícula</th>
                                <th className="p-3">Policial (Guerra)</th>
                                <th className="p-3">Modelo / Série</th>
                                <th className="p-3">Tipo Movimentação</th>
                                <th className="p-3">Data/Hora</th>
                                <th className="p-3">Observações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {periodArmasParticularesMov.map((mov, index) => (
                                <tr key={index} className="border-b border-slate-855/50 hover:bg-slate-850/10 transition-colors font-mono">
                                  <td className="p-3 font-semibold text-slate-300">{mov.matricula}</td>
                                  <td className="p-3 font-sans text-slate-200">{mov.nome} ({mov.nome_de_guerra})</td>
                                  <td className="p-3 text-slate-300">{mov.modelo_serie}</td>
                                  <td className="p-3">
                                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-black uppercase ${
                                      mov.tipo_mov === 'Entrada/Depósito'
                                        ? 'bg-blue-950/50 text-blue-400 border border-blue-900/30'
                                        : 'bg-emerald-950/50 text-emerald-450 border border-emerald-900/30'
                                    }`}>
                                      {mov.tipo_mov}
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-455">{mov.data_hora}</td>
                                  <td className="p-3 font-sans text-slate-300">{mov.obs}</td>
                                </tr>
                              ))}
                              {periodArmasParticularesMov.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="p-4 text-center text-slate-500 font-mono italic">
                                    Nenhuma entrada ou saída de arma particular registrada no período.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 2: ESTOQUE DA RESERVA */}
              {selectedReportTab === 'estoque' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Busca e Totalizador */}
                  <div className="bg-slate-955/20 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Buscar por Série, Modelo, Categoria, Status ou Policial..."
                        value={stockSearchQuery}
                        onChange={(e) => setStockSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 text-xs text-slate-202 focus:outline-none rounded-lg focus:ring-1 focus:ring-violet-500/20 font-sans"
                      />
                    </div>
                    <span className="bg-violet-955/50 text-violet-400 border border-violet-900/40 px-2.5 py-1.5 rounded font-mono text-[10px] font-black uppercase">
                      Itens no Estoque: {filteredEstoqueData.length}
                    </span>
                  </div>

                  {/* Tabela de Estoque Completo */}
                  <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900/80 border-b border-slate-850 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="p-3.5">Série / Patr.</th>
                          <th className="p-3.5">Categoria</th>
                          <th className="p-3.5">Modelo</th>
                          <th className="p-3.5">Fabricante</th>
                          <th className="p-3.5">Calibre</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Responsável / Detalhes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEstoqueData.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/30 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-slate-200">{item.id_material}</td>
                            <td className="p-3.5 text-slate-300">{item.categoria}</td>
                            <td className="p-3.5 text-slate-200 font-medium">{item.modelo}</td>
                            <td className="p-3.5 text-slate-400">{item.fabricante}</td>
                            <td className="p-3.5 text-slate-400 font-mono">{item.calibre}</td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                item.status_atual === 'Disponível' 
                                  ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30' 
                                  : item.status_atual === 'Cautelado' 
                                  ? 'bg-blue-955/30 text-blue-400 border border-blue-900/30' 
                                  : item.status_atual === 'Manutenção'
                                  ? 'bg-amber-955/30 text-amber-400 border border-amber-900/30'
                                  : item.status_atual.startsWith('Lote')
                                  ? 'bg-violet-955/30 text-violet-400 border border-violet-900/30'
                                  : 'bg-slate-900 text-slate-400 border border-slate-800'
                              }`}>
                                {item.status_atual}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                              {item.responsavel}
                              {item.desde && (
                                <span className="block text-[9px] text-slate-500 mt-0.5">
                                  ({item.desde})
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {filteredEstoqueData.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-slate-500 font-mono italic">
                              Nenhum material encontrado no estoque.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 3: ARMAS PARTICULARES */}
              {selectedReportTab === 'particulares' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Busca e Totalizador */}
                  <div className="bg-slate-955/20 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                    <div className="relative w-full max-w-md">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Buscar por Nome, Matrícula ou Número de Série..."
                        value={privateSearchQuery}
                        onChange={(e) => setPrivateSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none rounded-lg focus:ring-1 focus:ring-violet-500/20"
                      />
                    </div>
                    <span className="bg-violet-955/50 text-violet-400 border border-violet-900/40 px-2.5 py-1.5 rounded font-mono text-[10px] font-black uppercase">
                      Total Custodiado: {armasParticularesData.length}
                    </span>
                  </div>

                  {/* Tabela de Armas Particulares */}
                  <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900/80 border-b border-slate-850 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="p-3.5">Matrícula</th>
                          <th className="p-3.5">Proprietário</th>
                          <th className="p-3.5">Modelo / Fabricante</th>
                          <th className="p-3.5">Calibre</th>
                          <th className="p-3.5">Nº de Série</th>
                          <th className="p-3.5">Desde Quando</th>
                          <th className="p-3.5">Observações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {armasParticularesData.map((arma, index) => (
                          <tr key={arma.id} className="border-b border-slate-855/50 hover:bg-slate-850/10 transition-colors font-mono">
                            <td className="p-3.5 font-semibold text-slate-300">{arma.matricula}</td>
                            <td className="p-3.5 font-sans text-slate-200">{arma.nome}</td>
                            <td className="p-3.5 text-slate-200">{arma.modelo} ({arma.fabricante})</td>
                            <td className="p-3.5 text-slate-455">{arma.calibre}</td>
                            <td className="p-3.5 text-slate-300 font-bold">{arma.numero_serie}</td>
                            <td className="p-3.5 text-slate-455">{arma.data_deposito}</td>
                            <td className="p-3.5 font-sans text-slate-300 max-w-xs truncate" title={arma.obs}>{arma.obs}</td>
                          </tr>
                        ))}
                        {armasParticularesData.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-500 font-mono italic">
                              Nenhuma arma particular sob custódia atende a busca atual ou está cadastrada.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsReportsModalOpen(false)}
                className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-455 hover:text-slate-200 font-bold font-mono text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancelar / Fechar
              </button>
              
              <button
                type="button"
                onClick={triggerPrintReport}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-550 text-white font-bold font-mono text-xs rounded-lg transition-all shadow-md hover:shadow-violet-500/20 active:scale-95 duration-150 cursor-pointer flex items-center gap-1.5 glow-violet"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir Relatório</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JANELA MODAL DE PASSAGEM DE SERVIÇO */}
      {isHandoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-md animate-fadeIn">
          <div 
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp"
            id="arm-passagem-servico-wrapper"
          >
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-850 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-widest">Passagem de Serviço Bélico</h3>
                  <p className="text-[10px] text-slate-400 font-sans mt-0.5 font-normal">Preencha os dados dos militares do plantão para gerar a ata e fechar o livro.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHandoverModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Fechar Janela"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Form / Body do Modal */}
            <form onSubmit={handleHandoverSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar text-slate-200">
                {/* Armeiro do Dia (Bloqueado) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide block">Armeiro do Dia (Logado):</label>
                  <input
                    type="text"
                    disabled
                    value={loggedArmeiroUser ? `${loggedArmeiroUser.posto_graduacao} ${loggedArmeiroUser.nome} (${activeArmeiroMatricula})` : activeArmeiroMatricula}
                    className="w-full bg-slate-950/80 border border-slate-850 p-2.5 text-xs text-slate-400 rounded-lg cursor-not-allowed font-sans"
                  />
                </div>

                {/* Armeiro Anterior */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide block">Armeiro Anterior:</label>
                  <SearchableSelect
                    required
                    value={handoverArmeiroAnterior}
                    onChange={setHandoverArmeiroAnterior}
                    options={optionsMilitares}
                    placeholder="Selecione o Armeiro Anterior..."
                  />
                </div>

                {/* Adjunto de Serviço */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide block">Adjunto de Serviço:</label>
                  <SearchableSelect
                    required
                    value={handoverAdjunto}
                    onChange={setHandoverAdjunto}
                    options={optionsMilitares}
                    placeholder="Selecione o Adjunto de Serviço..."
                  />
                </div>

                {/* Oficial de Dia */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide block">Oficial de Dia:</label>
                  <SearchableSelect
                    required
                    value={handoverOficialDia}
                    onChange={setHandoverOficialDia}
                    options={optionsMilitares}
                    placeholder="Selecione o Oficial de Dia..."
                    direction="up"
                  />
                </div>

                {/* Próximo Armeiro */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wide block">Próximo Armeiro (Recebedor):</label>
                  <SearchableSelect
                    required
                    value={handoverProximoArmeiro}
                    onChange={setHandoverProximoArmeiro}
                    options={optionsMilitares}
                    placeholder="Selecione o Próximo Armeiro..."
                    direction="up"
                  />
                </div>

                {handoverError && (
                  <div className="bg-red-955/30 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex items-start gap-2 animate-pulse">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{handoverError}</span>
                  </div>
                )}
              </div>

              {/* Rodapé do Modal */}
              <div className="p-4 bg-slate-955/40 border-t border-slate-850 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 font-bold font-mono text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-550 text-white font-bold font-mono text-xs rounded-lg transition-all shadow-md hover:shadow-amber-500/20 active:scale-95 duration-150 cursor-pointer flex items-center gap-1.5 glow-amber"
                >
                  <History className="h-4 w-4" />
                  <span>Gerar Relatório de Passagem</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
