import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { storage, db } from "./lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// Componentes de Interface e Admin
import { COLORS, TAB_COLORS, normalizarPlaca, formatarMoeda } from './components/admin/constants';
import Dashboard, { TEMAS } from './DashboardTab';
import OSModulo from './components/admin/OS';
import ListaOS from './components/admin/ListaOS';
import SpeechTextarea from './components/admin/SpeechTextarea';
import { TelaTrialExpirou, TelaBloqueado, TelaLogin } from './components/admin/TelasDeAcesso';
import TelaEdicaoOS from './components/admin/TelaEdicaoOS';
import Header from './components/admin/Header';
import NovaOSBar from './components/admin/NovaOSBar';
import MenuNavegacao from './components/admin/MenuNavegacao';
import AvisoIA from './components/admin/AvisoIA';
import ConteudoAbas from './components/admin/ConteudoAbas';
import ModuloBloqueado from './components/admin/ModuloBloqueado';
import ModaisExtras from './components/admin/ModaisExtras';
import TelaMaestro from './components/admin/TelaMaestro';
import Precificacao from './components/admin/Precificacao';
import OnboardingTour from './components/admin/OnboardingTour';
import useQuickActions from './hooks/useQuickActions';
import { useAuth } from './contexts/AuthContext';
import useCarregamentoInicial from './hooks/useCarregamentoInicial.jsx';
import { resolverTipoOS, resolverAbaDestino, buscarDadosPorPlaca as buscarDadosPorPlacaHelper, abrirMercado as abrirMercadoHelper, TIPO_TITULOS, TIPO_EXPLICACOES } from './helpers/osHelpers';
import { Zap, ClipboardList, Wallet, Target, Lock, ShoppingCart, X } from 'lucide-react';

// --- 1. MÓDULOS NA PASTA COMPONENTS ---
import Mecanica from './components/Mecanica';
import FunilariaModulo from './components/Funilaria';
import AmortecedorModulo from './components/Amortecedor';
import MotoModulo from './components/Motos';
import PneusModulo from './components/pneus';
import OleoModulo from './components/Oleo';
import InjecaoModulo from './components/Injecao';
import AlinhamentoModulo from './components/Alinhamento';
import CopilotoModulo from './components/copiloto';
import Secretaria from './components/Secretaria';
import Administrador from './components/Administrador';
import Contador from './components/Contador';
import GestaoRetorno from './components/GestaoRetorno';
import OficinaPatrimonio from './components/OficinaPatrimonio';
import Fornecedores from './components/Fornecedores';
import Ajuda from './components/Ajuda';
import MasterPanel from './components/MasterPanel';
import QuickActions from './components/QuickActions';

// --- 2. MÓDULOS NA RAIZ SRC ---
import EletricaModulo from './Eletrica';
import ArCondicionado from './ArCondicionado';
import Escapamento from './Escapamento';
import Estetica from './Estetica';
import LavaJato from './LavaJato';
import Desmanche from "./components/desmanche/Desmanche";
import VeiculoEletrico from './VeiculoEletrico';
import HibridoEV from './HibridoEV';
import MarketingModulo from './Marketing';
import Financeiro from './Financeiro';
import Estoque from './Estoque';
import LeadsPage from './LeadsPage';
import Historico from './Historico';
import Equipe from './Equipe';
import ConfiguracoesPage from './Configuracoes';
import ModuloMeuPlano from './ModuloMeuPlano';
import MercadoLivre from './Mercadolivre';
import TarefaTab from './Tarefas';
import NotaFiscal from './NotaFiscal';
import AbaEstrategia from './Estrategia';
import { sincronizarRetornosAutomaticos } from './lib/retornos';
import AbaAjudaIA from './components/AbaAjudaIA';
import FloatingButtons from './components/FloatingButtons';

const AJUDA_ITENS = [
  { aba: 'dashboard', icon: '📊', titulo: 'Visão Geral & Dashboard', conteudo: ['Acompanhe faturamento, número de O.S. e ticket médio.', 'Visualize o status das ordens de serviço em tempo real.', 'Monitore metas financeiras e desempenho da equipe.'] },
  { aba: 'os', icon: '📝', titulo: 'Abertura de O.S. (Triagem)', conteudo: ['Inicie o atendimento clicando em "Nova O.S." ou use a Busca Rápida.', 'Preencha os dados do cliente e veículo (use o microfone se disponível).', 'Encaminhe para o setor técnico desejado (Mecânica, Óleo, Alinhamento, etc).'] },
  { aba: 'mecanica', icon: '🔧', titulo: 'Módulo Mecânica Geral', conteudo: ['Geração de orçamentos detalhados com peças e mão de obra.', 'Controle de serviços complexos e suspensão.', 'Envio automático de orçamento via WhatsApp para aprovação.'] },
  { aba: 'funilaria', icon: '🚗', titulo: 'Funilaria & Pintura', conteudo: ['Checklist visual de avarias e fotos do veículo.', 'Orçamento específico para funilaria e serviços de pintura.', 'Acompanhamento do status de repintura e acabamento.'] },
  { aba: 'oleo', icon: '🛢️', titulo: 'Troca de Óleo & Filtros', conteudo: ['Registro simplificado de viscosidade e quantidade de óleo.', 'Controle de troca de filtros (Ar, Óleo, Combustível, Cabine).', 'Configuração de etiqueta de próxima quilometragem.'] },
  { aba: 'alinhamento', icon: '⚙️', titulo: 'Alinhamento & Balanceamento', conteudo: ['Checklist de suspensão e estado dos pneus.', 'Registro de medidas de cambagem, convergência e cáster.', 'Integração com serviços de freios e amortecedores.'] },
  { aba: 'eletrica', icon: '⚡', titulo: 'Elétrica & Baterias', conteudo: ['Diagnóstico de alternador, motor de partida e iluminação.', 'Teste de carga de bateria e scanner eletrônico.', 'Lançamento de componentes elétricos e chicotes.'] },
  { aba: 'pneus', icon: '🛞', titulo: 'Pneus & Borracharia', conteudo: ['Controle de DOT, marca e medida dos pneus.', 'Serviços de vulcanização, rodízio e montagem.', 'Venda de pneus novos com integração ao estoque.'] },
  { aba: 'copiloto', icon: '🤖', titulo: 'Copiloto IA Técnico', conteudo: ['Tire dúvidas técnicas sobre torque, sensores e esquemas.', 'Analise códigos de falha (DTC) e receba dicas de reparo.', 'Treinado especificamente para a frota brasileira.'] },
  { aba: 'secretaria', icon: '👩‍💼', titulo: 'Secretária & Orçamentos (IA)', conteudo: ['Gera textos persuasivos para enviar no WhatsApp.', 'Resume diagnósticos técnicos para o cliente entender.', 'Aumenta a conversão de orçamentos parados.'] },
  { aba: 'financeiro', icon: '💰', titulo: 'Gestão Financeira & Caixa', conteudo: ['Controle de Entradas (Caixa) e Saídas (Despesas).', 'Relatórios de lucro líquido e fluxo de caixa mensal.', 'Lançamentos automáticos ao finalizar uma O.S. paga.'] },
  { aba: 'estoque', icon: '📦', titulo: 'Controle de Peças & Produtos', conteudo: ['Entrada de notas e controle de saldo mínimo.', 'Custo médio e valor total em estoque.', 'Venda de balcão direta ou integrada à O.S.'] },
  { aba: 'clientes', icon: '🎯', titulo: 'Clientes & Leads (CRM)', conteudo: ['Base de dados centralizada de clientes e veículos.', 'Histórico completo de passagens na oficina.', 'Gestão de novos leads que entram via WhatsApp ou site.'] },
  { aba: 'historico', icon: '🕐', titulo: 'Histórico de Placa (Busca)', conteudo: ['Digite uma placa para ver tudo o que já foi feito no carro.', 'Reimprima O.S. antigas e verifique garantias.', 'Ótimo para fidelização e pós-venda.'] },
  { aba: 'retorno', icon: '📆', titulo: 'Gestão de Retornos (Vendas)', conteudo: ['Agendamento automático de revisões futuras.', 'Lembrete de troca de óleo, freios e correia dentada.', 'Aumente o faturamento trazendo o cliente de volta.'] },
  { aba: 'precificacao', icon: '💰', titulo: 'PRECIFICAÇÃO - Sua Calculadora de Lucro Real', conteudo: ['👉 Pare de pagar para trabalhar! Use esta aba para saber exatamente quanto cobrar.', '🏦 PAINEL ESQUERDO: Configure seus custos fixos mensais (Aluguel, Luz, Folha) e suas horas úteis.', '✅ O sistema calcula automaticamente o valor da sua HORA TÉCNICA.', '📈 CALCULADORA À DIREITA: Digite o custo da peça, o tempo do serviço e os impostos.', '📊 RAIO-X DO DINHEIRO: Veja visualmente para onde vai cada centavo e garanta seu LUCRO LÍQUIDO.', '📲 AÇÃO RÁPIDA: Gere o valor e envie o orçamento profissional direto no WhatsApp do cliente com 1 clique.', '💡 Dica: Salve seus custos fixos uma vez e o sistema lembrará deles para todos os próximos orçamentos.'] },
  { aba: 'config', icon: '⚙️', titulo: 'Configurações do Sistema', conteudo: ['Personalize nome, logo e endereço da sua oficina.', 'Cadastre chaves PIX para links de pagamento.', 'Ajuste horários e preferências globais.'] }
];

const { MAIN, GREEN, MASTER } = COLORS;
const APP_BASE_URL = 'https://oficina.expresstech.com.br';
const SERVICOS_ESTETICA_ABAS = ['mecanica', 'hibrido', 'eletrico', 'moto', 'funilaria', 'amortecedor', 'injecao', 'eletrica', 'alinhamento', 'oleo', 'ar_condicionado', 'pneus', 'desmanche', 'escapamento', 'lavajato', 'estetica'];
const MAPA_MODULOS_SERVICOS = {
  mecanica: ['mecanica', 'MECÂNICA', 'MECANICA'],
  hibrido: ['hibrido', 'HÍBRIDOS', 'HIBRIDOS'],
  eletrico: ['eletrico', '100% ELÉTRICOS', '100% ELETRICOS'],
  moto: ['moto', 'motos', 'MOTOS'],
  funilaria: ['funilaria', 'FUNILARIA'],
  amortecedor: ['amortecedor', 'AMORTECEDOR'],
  injecao: ['injecao', 'INJEÇÃO', 'INJECAO'],
  eletrica: ['eletrica', 'ELÉTRICA', 'ELÉTRICA'],
  alinhamento: ['alinhamento', 'ALINHAMENTO'],
  oleo: ['oleo', 'ÓLEO', 'OLEO'],
  ar_condicionado: ['ar_condicionado', 'AR-CONDICIONADO'],
  pneus: ['pneus', 'PNEUS'],
  desmanche: ['desmanche', 'DESMANCHE'],
  escapamento: ['escapamento', 'ESCAPAMENTO'],
  lavajato: ['lavajato', 'LAVA JATO'],
  estetica: ['estetica', 'ESTÉTICA', 'ESTETICA'],
};

export default function Admin() {
  const {
    logado,
    carregandoAuth,
    papelLogado,
    permissoesLogado,
    dadosOficina,
    bloqueado,
    emailInput,
    setEmailInput,
    senhaInput,
    setSenhaInput,
    erroLogin,
    setErroLogin,
    fazerLogin,
    fazerLogout,
    currentUserId,
    modulosOperacionais,
    dataFimTrial,
    mostrarOnboarding,
    trialExpirou, // Certifique-se que o AuthContext proveja este estado
    setTrialExpirou,
    setDadosOficina,
    setBloqueado,
    setModulosOperacionais,
    setDataFimTrial,
    setMostrarOnboarding,
  } = useAuth();

  const [dadosOSGlobal, setDadosOSGlobal] = useState({
    placa: '',
    cliente: '',
    telefone: '',
    modelo: '',
    veiculo: '',
    oficinaId: '',
    km: '',
    senha_web: ''
  });

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('oficinaId', currentUserId);
      setDadosOSGlobal(prev => ({ ...prev, oficinaId: currentUserId }));
    }
  }, [currentUserId]);

  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [showMLModal, setShowMLModal] = useState(false);

  useEffect(() => {
    const handleAbrirML = () => setShowMLModal(true);
    const handleMudarAba = (e) => {
      setAbaAtiva(e.detail);
      window.scrollTo(0, 0);
    };

    window.addEventListener('abrirMercadoLivreModal', handleAbrirML);
    window.addEventListener('mudarAba', handleMudarAba);

    return () => {
      window.removeEventListener('abrirMercadoLivreModal', handleAbrirML);
      window.removeEventListener('mudarAba', handleMudarAba);
    };
  }, []);

  const [tema, setTema] = useState('escuro');
  const toggleTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');
  const [modoFoco, setModoFoco] = useState(false);

  const entrarModoFoco = () => {
    setModoFoco(true);
    window.scrollTo(0, 0);
  };

  const sairModoFoco = () => {
    setModoFoco(false);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handleModoFoco = () => {
      setModoFoco(true);
      window.scrollTo(0, 0);
    };
    window.addEventListener('ativarModoFoco', handleModoFoco);
    return () => window.removeEventListener('ativarModoFoco', handleModoFoco);
  }, []);

  const [listaCarros, setListaCarros] = useState([]);
  const [listaFinanceiro, setListaFinanceiro] = useState([]);
  const [listaEstoque, setListaEstoque] = useState([]);
  const [config, setConfig] = useState({});
  const [planosSistema, setPlanosSistema] = useState({});
  const [osEditando, setOsEditando] = useState(null);
  const [buscaMercado, setBuscaMercado] = useState('');
  const [busca, setBusca] = useState('');
  const [osEmEdicao, setOsEmEdicao] = useState(null);
  const [servicosAlinhamento, setServicosAlinhamento] = useState([]);
  const [extrasAlinhamento, setExtrasAlinhamento] = useState([]);
  const [estadoPneus, setEstadoPneus] = useState('bons');
  const [subAbaEletrica, setSubAbaEletrica] = useState('bateria');

  const [nomeCliente, setNomeCliente] = useState('');
  const [placa, setPlaca] = useState('');
  const [telefone, setTelefone] = useState('');
  const [modelo, setModelo] = useState('');
  const [senhaPortal, setSenhaPortal] = useState('');
  const [campoOuvindo, setCampoOuvindo] = useState(null);
  const [salvandoOS, setSalvandoOS] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const [finCampoOuvindo, setFinCampoOuvindo] = useState(false);
  const [leadCampoOuvindo, setLeadCampoOuvindo] = useState(null);
  const [toastModuloBloqueado, setToastModuloBloqueado] = useState(null);

  const trialExpiraouRef = useRef(false);
  const [modalUpgradeAba, setModalUpgradeAba] = useState(null);

  const modulosUsuario = useMemo(() => {
    return modulosOperacionais.length > 0
      ? modulosOperacionais
      : (dadosOficina?.modulosOperacionais || []);
  }, [modulosOperacionais, dadosOficina?.modulosOperacionais]);

  const servicosVisiveis = useMemo(() => {
    const modulosNormalizados = new Set(
      modulosUsuario
        .filter(Boolean)
        .map((modulo) => String(modulo).trim().toLowerCase())
    );

    return SERVICOS_ESTETICA_ABAS.filter((aba) =>
      (MAPA_MODULOS_SERVICOS[aba] || [aba]).some((nomeModulo) =>
        modulosNormalizados.has(String(nomeModulo).trim().toLowerCase())
      )
    );
  }, [modulosUsuario]);

  useEffect(() => {
    if (!logado || !currentUserId || !dataFimTrial) return;
    if (trialExpiraouRef.current) return;

    const fim = dataFimTrial instanceof Date ? dataFimTrial : new Date(dataFimTrial);
    if (fim >= new Date()) return;

    trialExpiraouRef.current = true;
    setTrialExpirou(true);

    updateDoc(doc(db, 'usuarios', currentUserId), {
      modulosPermitidos: null,
      dataFimTrial: null,
    }, { merge: true }).catch(err => console.error('Erro ao expirar trial:', err));
  }, [dataFimTrial, logado, currentUserId, setTrialExpirou]);

  const isLicencaAtiva = useMemo(() => {
    if (!dataFimTrial) return true;
    const fim = dataFimTrial instanceof Date ? dataFimTrial : new Date(dataFimTrial);
    return fim >= new Date();
  }, [dataFimTrial]);

  const verificarLicenca = (acao = 'esta ação') => {
    if (trialExpirou) {
      alert(`⛔ Sua assinatura expirou! Para continuar usando o sistema e ${acao}, renove agora em 💎 MEU PLANO.`);
      setAbaAtiva('meuplano');
      return false;
    }
    return true;
  };

  const ouvirCampo = (campo) => {
    setCampoOuvindo(campo);
    setTimeout(() => setCampoOuvindo(null), 3000);
  };

  const handleSalvarOS = async () => {
    if (!verificarLicenca('salvar ordens de serviço')) return;
    setSalvandoOS(true);
    try {
      setSalvo(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSalvandoOS(false);
    }
  };

  const ouvirFinDesc = () => {
    setFinCampoOuvindo(true);
    setTimeout(() => setFinCampoOuvindo(false), 3000);
  };

  const ouvirCampoLead = (campo) => {
    setLeadCampoOuvindo(campo);
    setTimeout(() => setLeadCampoOuvindo(null), 3000);
  };

  const irParaNovaOS = () => {
    setOsEditando(null);
    setPlaca('');
    setNomeCliente('');
    setTelefone('');
    setModelo('');
    setAbaAtiva('os');
  };

  const resumoEdicaoAtiva = useMemo(() => {
    if (!osEmEdicao) return null;
    const tipo = resolverTipoOS(osEmEdicao);
    const map = {
      mecanica: Mecanica, hibrido: HibridoEV, eletrico: VeiculoEletrico, moto: MotoModulo,
      funilaria: FunilariaModulo, amortecedor: AmortecedorModulo, injecao: InjecaoModulo,
      eletrica: EletricaModulo, oleo: OleoModulo, alinhamento: AlinhamentoModulo,
      lavajato: LavaJato, ar_condicionado: ArCondicionado,
      pneus: PneusModulo, escapamento: Escapamento, estetica: Estetica, desmanche: Desmanche,
    };
    return {
      tipo,
      titulo: TIPO_TITULOS[tipo] || 'Mecânica',
      editor: map[tipo] || Mecanica,
    };
  }, [osEmEdicao]);

  const explicacaoTriagemAtiva = useMemo(() => {
    return TIPO_EXPLICACOES[resumoEdicaoAtiva?.tipo || 'mecanica'] || TIPO_EXPLICACOES.mecanica;
  }, [resumoEdicaoAtiva]);

  function abrirWhatsApp(url) {
    window.open(url, '_blank');
  }

  async function enviarWhatsApp(os, tipo = 'link') {
    let msg = '';
    const linkStatus = `${APP_BASE_URL}/status/${oficinaId}/${os.id}`;
    const valorReal = Number(os?.total || 0);
    const pixKey = config?.pixKey || '(Não configurada)';

    if (tipo === 'link') {
      msg = `Olá${os.nomeCliente ? ' ' + os.nomeCliente : ''}! 👋\nRegistramos a entrada do seu *${os.modelo}* (Placa: ${os.placa}).\n🛠️ *Serviço:* ${os.checklist || 'Avaliação'}\n💰 *Valor:* ${formatarMoeda(valorReal)}\n📸 Acompanhe aqui: ${linkStatus}`;
    } else if (tipo === 'orcamento') {
      msg = `Olá${os.nomeCliente ? ' ' + os.nomeCliente : ''}! 👋 O orçamento do seu *${os.modelo}* ficou em *${formatarMoeda(valorReal)}*.\nVeja os detalhes completos e as fotos das peças aqui:\n🔗 ${linkStatus}\nPodemos iniciar o serviço?`;
    } else if (tipo === 'pagamento') {
      msg = `Olá${os.nomeCliente ? ' ' + os.nomeCliente : ''}! 👋\nServiço concluído!\nValor: *${formatarMoeda(valorReal)}*\n💳 Chave PIX: ${pixKey}\nRecibo: ${linkStatus}`;
      const confirmar = window.confirm(`Confirmar pagamento de ${formatarMoeda(valorReal)}?`);
      if (confirmar) {
        try {
          await addDoc(collection(db, 'oficinas', oficinaId, 'financeiro'), {
            descricao: `O.S. Paga - ${os.placa}`,
            valor: valorReal,
            pagamento: 'PIX',
            tipo: 'entrada',
            data: new Date().toISOString()
          });
          await updateDoc(doc(db, 'oficinas', oficinaId, 'os', os.id), { statusPagamento: 'pago' });
          await sincronizarRetornosAutomaticos({
            oficinaId,
            osId: os.id,
            osData: { statusPagamento: 'pago' },
            osBase: os,
          });
          carregarOS();
          carregarFinanceiro();
        } catch {
          alert('Erro ao lançar no caixa.');
        }
      }
    }

    if (os.telefone) {
      const texto = encodeURIComponent(msg);
      abrirWhatsApp(`https://wa.me/55${os.telefone.replace(/\D/g, '')}?text=${texto}`);
    }
  }

  const abrirMercado = (os) => {
    setBuscaMercado(abrirMercadoHelper(os));
    setAbaAtiva('mercadolivre');
  };

  const iniciarEdicao = (os) => {
    const tipo = resolverTipoOS(os);
    const abaDestino = resolverAbaDestino(tipo);
    setOsEditando(os);
    setOsEmEdicao(os);
    setAbaAtiva(abaDestino);
  };

  const handleOSCriada = (setor, novaOS) => {
    const setorSeguro = setor || 'mecanica';
    const tipo = resolverTipoOS({ tipo: setorSeguro, tipoServico: setorSeguro });
    const abaDestino = resolverAbaDestino(tipo);
    setListaCarros(prev => [novaOS, ...prev]);
    setOsEditando(novaOS);
    setOsEmEdicao(novaOS);
    setAbaAtiva(abaDestino);
    setDadosOSGlobal({
      placa: novaOS.placa || '',
      veiculo: novaOS.modelo || novaOS.veiculo || '',
      modelo: novaOS.modelo || novaOS.veiculo || '',
      cliente: novaOS.nomeCliente || novaOS.cliente || '',
      telefone: novaOS.telefone || novaOS.whatsapp || '',
      km: novaOS.km?.toString() || novaOS.kmAtual?.toString() || '',
      senha_web: novaOS.senha_web || novaOS.senhaConsulta || '',
      oficinaId: oficinaId || ''
    });
  };

  const fecharEdicao = () => {
    setOsEmEdicao(null);
    setOsEditando(null);
    setAbaAtiva('dashboard');
  };

  const oficinaId = useMemo(() => {
    return dadosOficina?.id || localStorage.getItem('oficinaId');
  }, [dadosOficina]);

  const {
    modalTarefaAberto, setModalTarefaAberto,
    tarefaRapidaTitulo, setTarefaRapidaTitulo,
    tarefaRapidaDesc, setTarefaRapidaDesc,
    tarefaRapidaData, setTarefaRapidaData,
    tarefaRapidaHora, setTarefaRapidaHora,
    salvarTarefaRapida, salvandoTarefaRapida,
    modalFinanceiroAberto, setModalFinanceiroAberto,
    finTipo, setFinTipo,
    finDesc, setFinDesc,
    finValor, setFinValor,
    finPagamento, setFinPagamento,
    salvarFinanceiroRapido, finSalvando,
    modalClienteAberto, setModalClienteAberto,
    leadNome, setLeadNome,
    leadTelefone, setLeadTelefone,
    leadProblema, setLeadProblema,
    salvarLeadRapido, leadSalvando,
  } = useQuickActions({ oficinaId, setAbaAtiva });

  const buscarDadosPorPlaca = async (placaDigitada, callbacks) => {
    return buscarDadosPorPlacaHelper(listaCarros, placaDigitada, normalizarPlaca, callbacks);
  };

  const { carregarOS, carregarFinanceiro, carregarEstoque, carregarConfig, carregarPlanos } = useCarregamentoInicial(oficinaId, {
    setListaCarros,
    setListaFinanceiro,
    setListaEstoque,
    setConfig,
    setPlanosSistema,
    logado,
  });

  if (osEmEdicao) {
    return (
      <TelaMaestro
        osEmEdicao={osEmEdicao}
        osEditando={osEditando}
        resumoEdicaoAtiva={resumoEdicaoAtiva}
        explicacaoTriagemAtiva={explicacaoTriagemAtiva}
        fecharEdicao={fecharEdicao}
        oficinaId={oficinaId}
        listaCarros={listaCarros}
        carregarOS={carregarOS}
        buscarDadosPorPlaca={buscarDadosPorPlaca}
        config={config}
        setOsEmEdicao={setOsEmEdicao}
        setAbaAtiva={setAbaAtiva}
        abrirWhatsApp={abrirWhatsApp}
        subAbaEletrica={subAbaEletrica}
        setSubAbaEletrica={setSubAbaEletrica}
        dadosOficina={dadosOficina}
        papelLogado={papelLogado}
        permissoesLogado={permissoesLogado}
        Mecanica={Mecanica}
      />
    );
  }

  const moduloLiberado = (idAba) => {
    // Validação de Trial via data
    const hoje = new Date();
    const fimTrial = dataFimTrial instanceof Date ? dataFimTrial : new Date(dataFimTrial);
    if (dataFimTrial && fimTrial > hoje) return true;

    const ehMaster = dadosOficina?.papel === 'master' || dadosOficina?.plano === 'master';
    if (ehMaster) return true;
    if (dadosOficina?.modulosPermitidos === 'ALL') return true;

    const abasVitais = ['dashboard', 'os', 'mecanica', 'clientes', 'ajuda', 'meuplano', 'config'];
    if (abasVitais.includes(idAba)) return true;

    return (dadosOficina?.modulosOperacionais || []).includes(idAba);
  };

  const lidarModuloBloqueado = (aba) => {
    const hoje = new Date();
    const fimTrial = dataFimTrial instanceof Date ? dataFimTrial : new Date(dataFimTrial);
    if (dataFimTrial && fimTrial > hoje) return;

    if (dadosOficina?.plano === 'master' || dadosOficina?.plano === 'prime') return;
    setModalUpgradeAba(aba);
  };

  const LABELS_ABAS_MODAL = {
    mecanica: 'Mecânica', clientes: 'Clientes', hibrido: 'Híbridos/Elétricos',
    moto: 'Motos', funilaria: 'Funilaria', amortecedor: 'Amortecedor',
    injecao: 'Injeção', eletrica: 'Elétrica', alinhamento: 'Alinhamento',
    oleo: 'Óleo', ar_condicionado: 'Ar-Condicionado',
    pneus: 'Pneus', desmanche: 'Desmanche', escapamento: 'Escapamento',
    lavajato: 'Lava Jato', estetica: 'Estética',
    copiloto: 'Copiloto IA', secretaria: 'Secretária IA', administrador: 'Administrador IA',
    contador: 'Assistente Fiscal IA', mercadolivre: 'Compras',
  };

  const dispararLembreteOleo = (os) => {
    const msg = `Olá${os.nomeCliente ? ' ' + os.nomeCliente : ''}! 👋\nPassando para avisar que já faz ~6 meses desde a última troca de óleo do seu *${os.modelo}* (${os.placa}).\nManter em dia evita danos. Vamos agendar? 🚗`;
    abrirWhatsApp(`https://wa.me/55${os.telefone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`);
  };

  const salvarEdicao = async () => {
    if (!osEditando || !oficinaId) return;
    try {
      const dadosAtualizados = {
        nomeCliente: osEditando.nomeCliente,
        placa: normalizarPlaca(osEditando.placa),
        modelo: osEditando.modelo || '',
        ano: osEditando.ano || '',
        motor: osEditando.motor || '',
        checklist: osEditando.checklist,
        detalhesPecas: osEditando.detalhesPecas,
        valorPecas: osEditando.valorPecas,
        valorMaoObra: osEditando.valorMaoObra,
        total: (Number(osEditando.valorPecas) || 0) + (Number(osEditando.valorMaoObra) || 0),
        fotos: osEditando.fotos || [],
        kmAtual: osEditando.kmAtual || '',
        kmProxima: osEditando.kmProxima || '',
      };
      await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osEditando.id), dadosAtualizados);
      await sincronizarRetornosAutomaticos({
        oficinaId,
        osId: osEditando.id,
        osData: dadosAtualizados,
        osBase: osEditando,
      });
      setListaCarros(prev => prev.map(o => o.id === osEditando.id ? { ...o, ...dadosAtualizados } : o));
      setOsEditando(null);
      alert('O.S. atualizada!');
    } catch (e) { alert('Erro: ' + e.message); }
  };

  const deletarOS = async (id) => {
    if (!confirm('Apagar esta O.S. permanentemente?')) return;
    await deleteDoc(doc(db, 'oficinas', oficinaId, 'os', id));
    setListaCarros(prev => prev.filter(o => o.id !== id));
  };

  const LABELS_ABAS = {
    dashboard: '📊 VISÃO GERAL', os: '🔧 O.S.', mecanica: '🔧 MECÂNICA', clientes: '👥 CLIENTES', hibrido: '🔋 HÍBRIDOS',
    moto: '🏍️ MOTOS', eletrico: '🔌 100% ELÉTRICOS', funilaria: '🚗 FUNILARIA', amortecedor: '🧰 AMORTECEDOR', injecao: '🛠️ INJEÇÃO',
    oleo: '🛢️ ÓLEO', alinhamento: '⚙️ ALINHAMENTO', eletrica: '⚡ ELÉTRICA',
    ar_condicionado: '❄️ AR-COND.', pneus: '🛞 PNEUS', escapamento: '🪛 ESCAPAMENTO', estetica: '✨ ESTÉTICA',
    lavajato: '🚿 LAVA JATO', desmanche: '🚗 DESMANCHE', copiloto: '👨‍🔧 COPILOTO',
    secretaria: '👩‍💼 SECRETÁRIA', administrador: '👔 ADMINISTRADOR', contador: '📋 ASSIST. FISCAL',
    mercadolivre: '📦 COMPRAS', mercado_livre: '📦 COMPRAS',
    financeiro: '📊 FINANCEIRO', estoque: '📦 ESTOQUE', leads: '👥 CLIENTES', historico: '📋 HISTÓRICO',
    tarefa: '📋 TAREFA', notafiscal: '📄 NOTA FISCAL', retorno: '📅 RETORNO', patrimonio: '📊 PATRIMÔNIO', fornecedores: '🤝 FORNECEDORES',
    precificacao: '💰 PRECIFICAÇÃO',
    equipe: '👥 EQUIPE', config: '⚙️ AJUSTES', marketing: '📣 MARKETING', estrategia: '🚀 ESTRATÉGIA', ajuda: '❓ AJUDA',
    master: '👑 MASTER', meuplano: '💰 MEU PLANO',
  };

  if (carregandoAuth) {
    return (
      <div style={{ minHeight: '100vh', background: 'black', color: MAIN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
        ⏳ INICIANDO SISTEMA...
      </div>
    );
  }

  if (trialExpirou) {
    return <TelaTrialExpirou setTrialExpirou={setTrialExpirou} />;
  }

  if (bloqueado) {
    return <TelaBloqueado bloqueado={bloqueado} MAIN={MAIN} planosSistema={planosSistema} fazerLogout={fazerLogout} />;
  }

  if (!logado) {
    return <TelaLogin emailInput={emailInput} setEmailInput={setEmailInput} senhaInput={senhaInput} setSenhaInput={setSenhaInput} erroLogin={erroLogin} setErroLogin={setErroLogin} fazerLogin={fazerLogin} MAIN={MAIN} fazerLogout={fazerLogout} />;
  }

  if (osEditando && !osEmEdicao) {
    return (
      <TelaEdicaoOS
        osEditando={osEditando}
        setOsEditando={setOsEditando}
        fecharEdicao={fecharEdicao}
        salvarEdicao={salvarEdicao}
        normalizarPlaca={normalizarPlaca}
        SpeechTextarea={SpeechTextarea}
        GREEN={GREEN}
        MAIN={MAIN}
        oficinaId={oficinaId}
      />
    );
  }

  const t = TEMAS[tema];

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.texto, paddingBottom: '100px', transition: 'background 0.3s' }}>
      <Header t={t} papelLogado={papelLogado} MASTER={MASTER} MAIN={MAIN} toggleTema={toggleTema} fazerLogout={fazerLogout} oficinaId={oficinaId} />
      <NovaOSBar t={t} MAIN={MAIN} abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} listaCarros={listaCarros} busca={busca} setBusca={setBusca} normalizarPlaca={normalizarPlaca} />

      {modoFoco && (
        <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
          <button
            onClick={() => { setAbaAtiva('dashboard'); setModoFoco(false); window.scrollTo(0, 0); }}
            className="text-red-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:text-red-400"
          >
            ← VOLTAR AO DASHBOARD
          </button>
          <span className="text-neutral-500 text-[10px]">MODO FOCO ATIVADO</span>
        </div>
      )}

      {!modoFoco && (
        <MenuNavegacao t={t} servicosVisiveis={servicosVisiveis} MAIN={MAIN} MASTER={MASTER} papelLogado={papelLogado} abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} moduloLiberado={moduloLiberado} lidarModuloBloqueado={lidarModuloBloqueado} LABELS_ABAS={LABELS_ABAS} osEmEdicao={osEmEdicao} />
      )}

      <AvisoIA abaAtiva={abaAtiva} />

      <ConteudoAbas
        dadosOSGlobal={dadosOSGlobal}
        setDadosOSGlobal={setDadosOSGlobal}
        abaAtiva={abaAtiva}
        dataFimTrial={dataFimTrial}
        listaCarros={listaCarros}
        listaFinanceiro={listaFinanceiro}
        listaEstoque={listaEstoque}
        config={config}
        dadosOficina={dadosOficina}
        oficinaId={oficinaId}
        papelLogado={papelLogado}
        permissoesLogado={permissoesLogado}
        handleSalvarOS={handleSalvarOS}
        salvandoOS={salvandoOS}
        salvo={salvo}
        onSalvo={carregarOS}
        osEmEdicao={osEmEdicao}
        osParaEditar={osEditando}
        onCancelar={fecharEdicao}
        iniciarEdicao={iniciarEdicao}
        deletarOS={deletarOS}
        enviarWhatsApp={enviarWhatsApp}
        abrirWhatsApp={abrirWhatsApp}
        abrirMercado={abrirMercado}
        buscarDadosPorPlaca={buscarDadosPorPlaca}
        handleOSCriada={handleOSCriada}
        nomeCliente={nomeCliente}
        setNomeCliente={setNomeCliente}
        placa={placa}
        setPlaca={setPlaca}
        telefone={telefone}
        setTelefone={setTelefone}
        modelo={modelo}
        setModelo={setModelo}
        senhaPortal={senhaPortal}
        setSenhaPortal={setSenhaPortal}
        ouvirCampo={ouvirCampo}
        campoOuvindo={campoOuvindo}
        normalizarPlaca={normalizarPlaca}
        formatarMoeda={formatarMoeda}
        Dashboard={Dashboard}
        OSModulo={OSModulo}
        ListaOS={ListaOS}
        Mecanica={Mecanica}
        HibridoEV={HibridoEV}
        VeiculoEletrico={VeiculoEletrico}
        MotoModulo={MotoModulo}
        FunilariaModulo={FunilariaModulo}
        AmortecedorModulo={AmortecedorModulo}
        InjecaoModulo={InjecaoModulo}
        OleoModulo={OleoModulo}
        AlinhamentoModulo={AlinhamentoModulo}
        EletricaModulo={EletricaModulo}

        ArCondicionado={ArCondicionado}
        PneusModulo={PneusModulo}
        Escapamento={Escapamento}
        Estetica={Estetica}
        LavaJato={LavaJato}
        Desmanche={Desmanche}
        CopilotoModulo={CopilotoModulo}
        Secretaria={Secretaria}
        Administrador={Administrador}
        Contador={Contador}
        MarketingModulo={MarketingModulo}
        MercadoLivre={MercadoLivre}
        buscaMercado={buscaMercado}
        Financeiro={Financeiro}
        Estoque={Estoque}
        LeadsPage={LeadsPage}
        Historico={Historico}
        Equipe={Equipe}
        ConfiguracoesPage={ConfiguracoesPage}
        ModuloMeuPlano={ModuloMeuPlano}
        MasterPanel={MasterPanel}
        TarefaTab={TarefaTab}
        NotaFiscal={NotaFiscal}
        GestaoRetorno={GestaoRetorno}
        OficinaPatrimonio={OficinaPatrimonio}
        Fornecedores={Fornecedores}
        Ajuda={Ajuda}
        AbaEstrategia={AbaEstrategia}
        servicosAlinhamento={servicosAlinhamento}
        setServicosAlinhamento={setServicosAlinhamento}
        extrasAlinhamento={extrasAlinhamento}
        setExtrasAlinhamento={setExtrasAlinhamento}
        estadoPneus={estadoPneus}
        setEstadoPneus={setEstadoPneus}
        subAbaEletrica={subAbaEletrica}
        setSubAbaEletrica={setSubAbaEletrica}
        tema={tema}
        toggleTema={toggleTema}
        isTrial={dataFimTrial && (new Date(dataFimTrial) > new Date())}
        modulosOperacionais={modulosOperacionais}
        irParaNovaOS={irParaNovaOS}
        verificarLicenca={verificarLicenca}
      />

      <ModuloBloqueado
        toastModuloBloqueado={toastModuloBloqueado}
        modalUpgradeAba={modalUpgradeAba}
        setToastModuloBloqueado={setToastModuloBloqueado}
        setModalUpgradeAba={setModalUpgradeAba}
        setAbaAtiva={setAbaAtiva}
        MAIN={MAIN}
        planosSistema={planosSistema}
        LABELS_ABAS_MODAL={LABELS_ABAS_MODAL}
      />

      <ModaisExtras
        QuickActions={QuickActions}
        oficinaId={oficinaId}
        GREEN={GREEN}
        modalTarefaAberto={modalTarefaAberto}
        setModalTarefaAberto={setModalTarefaAberto}
        tarefaRapidaTitulo={tarefaRapidaTitulo}
        setTarefaRapidaTitulo={setTarefaRapidaTitulo}
        tarefaRapidaDesc={tarefaRapidaDesc}
        setTarefaRapidaDesc={setTarefaRapidaDesc}
        tarefaRapidaData={tarefaRapidaData}
        setTarefaRapidaData={setTarefaRapidaData}
        tarefaRapidaHora={tarefaRapidaHora}
        setTarefaRapidaHora={setTarefaRapidaHora}
        salvarTarefaRapida={salvarTarefaRapida}
        salvandoTarefaRapida={salvandoTarefaRapida}
        modalFinanceiroAberto={modalFinanceiroAberto}
        setModalFinanceiroAberto={setModalFinanceiroAberto}
        finTipo={finTipo}
        setFinTipo={setFinTipo}
        finDesc={finDesc}
        setFinDesc={setFinDesc}
        finValor={finValor}
        setFinValor={setFinValor}
        finPagamento={finPagamento}
        setFinPagamento={setFinPagamento}
        salvarFinanceiroRapido={salvarFinanceiroRapido}
        finSalvando={finSalvando}
        modalClienteAberto={modalClienteAberto}
        setModalClienteAberto={setModalClienteAberto}
        leadNome={leadNome}
        setLeadNome={setLeadNome}
        leadTelefone={leadTelefone}
        setLeadTelefone={setLeadTelefone}
        leadProblema={leadProblema}
        setLeadProblema={setLeadProblema}
        salvarLeadRapido={salvarLeadRapido}
        leadSalvando={leadSalvando}
        ouvirFinDesc={ouvirFinDesc}
        finCampoOuvindo={finCampoOuvindo}
        ouvirCampoLead={ouvirCampoLead}
        leadCampoOuvindo={leadCampoOuvindo}
        carregarFinanceiro={carregarFinanceiro}
        setAbaAtiva={setAbaAtiva}
        mostrarOnboarding={mostrarOnboarding}
        setMostrarOnboarding={setMostrarOnboarding}
        setModulosOperacionais={setModulosOperacionais}
        planosSistema={planosSistema}
      />

      {showMLModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-10 backdrop-blur-sm bg-black/60">
          <div className="bg-zinc-950 border-2 border-yellow-500 w-full max-w-5xl h-[85vh] rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(255,230,0,0.2)] flex flex-col relative">
            <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-[#FFE600] p-2 rounded-lg">
                  <ShoppingCart size={20} color="#FFE600" />
                </div>
                <span className="font-black text-yellow-500 uppercase tracking-tighter">Central de Suprimentos IA</span>
              </div>
              <button
                onClick={() => setShowMLModal(false)}
                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MercadoLivre />
            </div>
            <div className="bg-zinc-900 p-3 text-center">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Tecnologia Express Auto Tech &copy; 2026</p>
            </div>
          </div>
        </div>
      )}

      <FloatingButtons abaAtiva={abaAtiva} />

      <OnboardingTour
        setAbaAtiva={setAbaAtiva}
        setMostrarOnboarding={setMostrarOnboarding}
        modalBemVindoAberto={mostrarOnboarding}
      />
    </div>
  );
}