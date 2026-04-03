/* eslint-disable react/prop-types */
import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, where, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { COLORS, TAB_COLORS, normalizarPlaca, formatarMoeda } from './components/admin/constants';
import Dashboard, { TEMAS } from './DashboardTab';
import OSModulo from './components/admin/OS';
import ListaOS from './components/admin/ListaOS';
import SpeechTextarea from './components/admin/SpeechTextarea';
import { temAcessoModulo } from './components/admin/helpers';
import { Zap, ClipboardList, Wallet, Target } from 'lucide-react';
import HibridoEV from './HibridoEV'; // Ou ./VeiculoEletrico se preferir o outro
import InjecaoModulo from './components/Injecao'; // Note que este está na pasta components
import VeiculoEletrico from './VeiculoEletrico';
import Mecanica from './components/Mecanica';
import LatariaModulo from './components/Lataria';
import AmortecedorModulo from './components/Amortecedor';
import MotoModulo from './components/Motos';
import Pneus from './components/Pneus';
import OleoModulo from './components/Oleo';
import AlinhamentoModulo from './components/Alinhamento';
import EletricaModulo from './Eletrica';
import RevisaoModulo from './components/ModuloRevisao';
import ArCondicionado from './ArCondicionado';
import Escapamento from './Escapamento';
import Estetica from './Estetica';
import LavaJato from './LavaJato';
import Desmanche from './Desmanche';
import CopilotoModulo from './components/copiloto';
import MarketingModulo from './Marketing';
import Financeiro from './Financeiro';
import Estoque from './Estoque';
import LeadsPage from './LeadsPage';
import Historico from './Historico';
import Equipe from './Equipe';
import ConfiguracoesPage from './Configuracoes';
import ModuloMeuPlano from './ModuloMeuPlano';
import MercadoLivre from './Mercadolivre';
import Secretaria from './components/Secretaria';
import Administrador from './components/Administrador';
import Contador from './components/Contador';
import TarefaTab from './Tarefas';
import NotaFiscal from './NotaFiscal';
import GestaoRetorno from './components/GestaoRetorno';
import OficinaPatrimonio from './components/OficinaPatrimonio';
import Fornecedores from './components/Fornecedores';
import AbaEstrategia from './Estrategia';
import Ajuda from './components/Ajuda';
import MasterPanel from './components/MasterPanel';
import QuickActions from './components/QuickActions';

const AJUDA_ITENS = [
  { aba: 'dashboard', icon: '📊', titulo: 'Visão Geral & Dashboard', conteudo: ['Acompanhe faturamento, número de O.S. e ticket médio.', 'Visualize o status das ordens de serviço em tempo real.', 'Monitore metas financeiras e desempenho da equipe.'] },
  { aba: 'os', icon: '📝', titulo: 'Abertura de O.S. (Triagem)', conteudo: ['Inicie o atendimento clicando em "Nova O.S." ou use a Busca Rápida.', 'Preencha os dados do cliente e veículo (use o microfone se disponível).', 'Encaminhe para o setor técnico desejado (Mecânica, Óleo, Alinhamento, etc).'] },
  { aba: 'mecanica', icon: '🔧', titulo: 'Módulo Mecânica Geral', conteudo: ['Geração de orçamentos detalhados com peças e mão de obra.', 'Controle de serviços complexos e suspensão.', 'Envio automático de orçamento via WhatsApp para aprovação.'] },
  { aba: 'lataria', icon: '🚗', titulo: 'Lataria & Pintura', conteudo: ['Checklist visual de avarias e fotos do veículo.', 'Orçamento específico para funilaria e serviços de pintura.', 'Acompanhamento do status de repintura e acabamento.'] },
  { aba: 'oleo', icon: '🛢️', titulo: 'Troca de Óleo & Filtros', conteudo: ['Registro simplificado de viscosidade e quantidade de óleo.', 'Controle de troca de filtros (Ar, Óleo, Combustível, Cabine).', 'Configuração de etiqueta de próxima quilometragem.'] },
  { aba: 'alinhamento', icon: '⚙️', titulo: 'Alinhamento & Balanceamento', conteudo: ['Checklist de suspensão e estado dos pneus.', 'Registro de medidas de cambagem, convergência e cáster.', 'Integração com serviços de freios e amortecedores.'] },
  { aba: 'eletrica', icon: '⚡', titulo: 'Elétrica & Baterias', conteudo: ['Diagnóstico de alternador, motor de partida e iluminação.', 'Teste de carga de bateria e scanner eletrônico.', 'Lançamento de componentes elétricos e chicotes.'] },
  { aba: 'pneus', icon: '🛞', titulo: 'Pneus & Borracharia', conteudo: ['Controle de DOT, marca e medida dos pneus.', 'Serviços de vulcanização, rodízio e montagem.', 'Venda de pneus novos com integração ao estoque.'] },
  { aba: 'copiloto', icon: '🤖', titulo: 'Copiloto IA Técnico', conteudo: ['Tire dúvidas técnicas sobre torque, sensores e esquemas.', 'Analise códigos de falha (DTC) e receba dicas de reparo.', 'Treinado especificamente para a frota brasileira.'] },
  { aba: 'secretaria', icon: '📞', titulo: 'Secretária & Orçamentos (IA)', conteudo: ['Gera textos persuasivos para enviar no WhatsApp.', 'Resume diagnósticos técnicos para o cliente entender.', 'Aumenta a conversão de orçamentos parados.'] },
  { aba: 'financeiro', icon: '💰', titulo: 'Gestão Financeira & Caixa', conteudo: ['Controle de Entradas (Caixa) e Saídas (Despesas).', 'Relatórios de lucro líquido e fluxo de caixa mensal.', 'Lançamentos automáticos ao finalizar uma O.S. paga.'] },
  { aba: 'estoque', icon: '📦', titulo: 'Controle de Peças & Produtos', conteudo: ['Entrada de notas e controle de saldo mínimo.', 'Custo médio e valor total em estoque.', 'Venda de balcão direta ou integrada à O.S.'] },
  { aba: 'clientes', icon: '🎯', titulo: 'Clientes & Leads (CRM)', conteudo: ['Base de dados centralizada de clientes e veículos.', 'Histórico completo de passagens na oficina.', 'Gestão de novos leads que entram via WhatsApp ou site.'] },
  { aba: 'historico', icon: '🕒', titulo: 'Histórico de Placa (Busca)', conteudo: ['Digite uma placa para ver tudo o que já foi feito no carro.', 'Reimprima O.S. antigas e verifique garantias.', 'Ótimo para fidelização e pós-venda.'] },
  { aba: 'retorno', icon: '📅', titulo: 'Gestão de Retornos (Vendas)', conteudo: ['Agendamento automático de revisões futuras.', 'Lembrete de troca de óleo, freios e correia dentada.', 'Aumente o faturamento trazendo o cliente de volta.'] },
  { aba: 'config', icon: '⚙️', titulo: 'Configurações do Sistema', conteudo: ['Personalize nome, logo e endereço da sua oficina.', 'Cadastre chaves PIX para links de pagamento.', 'Ajuste horários e preferências globais.'] }
];

const { MAIN, GREEN, MASTER } = COLORS;
const APP_BASE_URL = 'https://oficina.expresstech.com.br';

export default function Admin() {
  const [logado, setLogado] = useState(false);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [papelLogado, setPapelLogado] = useState(null);
  const [permissoesLogado, setPermissoesLogado] = useState(null);
  const [dadosOficina, setDadosOficina] = useState(null);
  const [bloqueado, setBloqueado] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [tema, setTema] = useState('escuro');
  const toggleTema = () => setTema(prev => prev === 'escuro' ? 'claro' : 'escuro');
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
  const [subAbaEletrica, setSubAbaEletrica] = useState('geral');

  const [nomeCliente, setNomeCliente] = useState('');
  const [placa, setPlaca] = useState('');
  const [telefone, setTelefone] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState('');
  const [motor, setMotor] = useState('');
  const [senhaPortal, setSenhaPortal] = useState('');
  const [campoOuvindo, setCampoOuvindo] = useState(null);
  const [salvandoOS, setSalvandoOS] = useState(false);
  const [salvo, setSalvo] = useState(false);

  // --- ESTADOS PARA QUICK ACTIONS (FABs) ---
  const [modalTarefaAberto, setModalTarefaAberto] = useState(false);
  const [tarefaRapidaTitulo, setTarefaRapidaTitulo] = useState('');
  const [tarefaRapidaDesc, setTarefaRapidaDesc] = useState('');
  const [salvandoTarefaRapida, setSalvandoTarefaRapida] = useState(false);

  const [modalFinanceiroAberto, setModalFinanceiroAberto] = useState(false);
  const [finTipo, setFinTipo] = useState('entrada');
  const [finDesc, setFinDesc] = useState('');
  const [finValor, setFinValor] = useState('');
  const [finPagamento, setFinPagamento] = useState('PIX');
  const [finSalvando, setFinSalvando] = useState(false);
  const [finCampoOuvindo, setFinCampoOuvindo] = useState(false);

  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [leadNome, setLeadNome] = useState('');
  const [leadTelefone, setLeadTelefone] = useState('');
  const [leadProblema, setLeadProblema] = useState('');
  const [leadSalvando, setLeadSalvando] = useState(false);
  const [leadCampoOuvindo, setLeadCampoOuvindo] = useState(null);

  // --- ESTADO PARA AJUDA DINÂMICA ---
  const [videosAjudaAdmin, setVideosAjudaAdmin] = useState({});

  const ouvirCampo = (campo) => {
    setCampoOuvindo(campo);
    setTimeout(() => setCampoOuvindo(null), 3000);
  };

  const handleSalvarOS = async () => {
    setSalvandoOS(true);
    try {
      setSalvo(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSalvandoOS(false);
    }
  };

  // --- HANDLERS PARA QUICK ACTIONS ---

  const ouvirFinDesc = () => {
    setFinCampoOuvindo(true);
    setTimeout(() => setFinCampoOuvindo(false), 3000);
    // Integração real com Web Speech API ou similar pode vir depois
  };

  const ouvirCampoLead = (campo, setter) => {
    setLeadCampoOuvindo(campo);
    setTimeout(() => setLeadCampoOuvindo(null), 3000);
  };

  const salvarTarefaRapida = async () => {
    if (!oficinaId || !tarefaRapidaTitulo.trim()) return;
    setSalvandoTarefaRapida(true);
    try {
      await addDoc(collection(db, 'oficinas', oficinaId, 'tarefas'), {
        titulo: tarefaRapidaTitulo,
        descricao: tarefaRapidaDesc,
        status: 'pendente',
        criadoEm: new Date(),
        prioridade: 'normal'
      });
      setTarefaRapidaTitulo('');
      setTarefaRapidaDesc('');
      setModalTarefaAberto(false);
      alert('✅ Tarefa criada com sucesso!');
    } catch (err) { alert('Erro ao salvar tarefa: ' + err.message); }
    finally { setSalvandoTarefaRapida(false); }
  };

  const salvarFinanceiroRapido = async () => {
    if (!oficinaId || (!finDesc && !finValor)) return;
    setFinSalvando(true);
    try {
      await addDoc(collection(db, 'oficinas', oficinaId, 'financeiro'), {
        descricao: finDesc,
        valor: Number(finValor),
        tipo: finTipo,
        pagamento: finPagamento,
        data: new Date(),
        vencimento: new Date(),
        status: 'pago'
      });
      setFinDesc('');
      setFinValor('');
      setModalFinanceiroAberto(false);
      alert('✅ Lançamento realizado no caixa!');
    } catch (err) { alert('Erro ao salvar financeiro: ' + err.message); }
    finally { setFinSalvando(false); }
  };

  const salvarLeadRapido = async () => {
    if (!oficinaId || !leadTelefone) return;
    setLeadSalvando(true);
    try {
      await addDoc(collection(db, 'oficinas', oficinaId, 'leads'), {
        nome: leadNome,
        telefone: leadTelefone,
        problema: leadProblema,
        data: new Date(),
        origem: 'QuickAction',
        status: 'novo'
      });
      setLeadNome('');
      setLeadTelefone('');
      setLeadProblema('');
      setModalClienteAberto(false);
      alert('✅ Lead/Cliente cadastrado!');
    } catch (err) { alert('Erro ao salvar lead: ' + err.message); }
    finally { setLeadSalvando(false); }
  };

  const irParaNovaOS = () => {
    setOsEditando(null); // Limpa qualquer O.S. que estava aberta
    setPlaca('');        // Limpa a placa
    setNomeCliente('');  // Limpa o nome
    setTelefone('');     // Limpa o zap
    setModelo('');       // Limpa o carro
    setAbaAtiva('os'); // Te joga na aba de entrada (Triagem/OS)
  };

  const resolverTipoOS = (os) => {
    if (!os) return 'mecanica';
    const t = String(os.tipo || os.tipoServico || os.setor || 'mecanica').toLowerCase().trim();
    const map = {
      hibrido: 'hibrido', moto: 'moto', eletrico: 'eletrico', lataria: 'lataria',
      amortecedor: 'amortecedor', injecao: 'injecao',
      eletrica: 'eletrica', oleo: 'oleo', alinhamento: 'alinhamento',
      revisao: 'revisao', lavajato: 'lavajato', lava_jato: 'lavajato',
      ar_condicionado: 'ar_condicionado', arcondicionado: 'ar_condicionado', pneus: 'pneus',
      escapamento: 'escapamento', estetica: 'estetica', desmanche: 'desmanche',
    };
    return map[t] || 'mecanica';
  };

  const resolverAbaDestino = (tipo) => {
    const map = {
      hibrido: 'hibrido', eletrico: 'eletrico', moto: 'moto', lataria: 'lataria',
      amortecedor: 'amortecedor', injecao: 'injecao',
      eletrica: 'eletrica', oleo: 'oleo', alinhamento: 'alinhamento',
      revisao: 'revisao', lavajato: 'lavajato',
      ar_condicionado: 'ar_condicionado', pneus: 'pneus', escapamento: 'escapamento',
      estetica: 'estetica', desmanche: 'desmanche',
    };
    return map[tipo] || 'mecanica';
  };

  const resolverEditorDaOS = (tipo) => {
    const map = {
      // AS QUE FALTAVAM:
      mecanica: Mecanica,
      hibrido: HibridoEV,
      eletrico: VeiculoEletrico,
      moto: MotoModulo,
      lataria: LatariaModulo,
      amortecedor: AmortecedorModulo,
      injecao: InjecaoModulo,

      // AS QUE JÁ ESTAVAM AÍ:
      eletrica: EletricaModulo,
      oleo: OleoModulo,
      alinhamento: AlinhamentoModulo,
      revisao: RevisaoModulo,
      lavajato: LavaJato,
      ar_condicionado: ArCondicionado,
      pneus: PneusModulo,
      escapamento: Escapamento,
      estetica: Estetica,
      desmanche: Desmanche,
    };
    return map[tipo] || Mecanica;
  };

  const resumoEdicaoAtiva = useMemo(() => {
    if (!osEmEdicao) return null;
    const tipo = resolverTipoOS(osEmEdicao);
    const abaDestino = resolverAbaDestino(tipo);
    const titulos = {
      // AS QUE VOCÊ ADICIONOU AGORA:
      hibrido: 'Híbridos / EV',
      eletrico: 'Elétricos',
      moto: 'Motos',
      lataria: 'Lataria',
      amortecedor: 'Amortecedor',
      injecao: 'Injeção Eletrônica',

      // AS QUE JÁ ESTAVAM:
      mecanica: 'Mecânica', eletrica: 'Elétrica', oleo: 'Óleo',
      alinhamento: 'Alinhamento', revisao: 'Revisão',
      ar_condicionado: 'Ar-Condicionado', pneus: 'Pneus', escapamento: 'Escapamento',
      estetica: 'Estética', desmanche: 'Desmanche', lavajato: 'Lava Jato',
    };
    return {
      tipo,
      abaDestino,
      titulo: titulos[tipo] || 'Mecânica',
      editor: resolverEditorDaOS(tipo)
    };
  }, [osEmEdicao]);

  const explicacaoTriagemAtiva = useMemo(() => {
    const tipo = resumoEdicaoAtiva?.tipo || 'mecanica';
    const exp = {
      // ⬇️ AS NOVAS EXPLICAÇÕES:
      hibrido: 'Triagem encaminhada para laudo de baterias e sistema EV.',
      eletrico: 'Triagem encaminhada para laudo de veículos elétricos.',
      moto: 'Triagem encaminhada para oficina de motocicletas.',
      lataria: 'Triagem encaminhada para funilaria e pintura.',
      amortecedor: 'Triagem encaminhada para suspensão e amortecedores.',
      injecao: 'Triagem encaminhada para diagnóstico de injeção eletrônica.',

      // ⬇️ AS QUE JÁ ESTAVAM AÍ:
      mecanica: 'Triagem encaminhada para diagnóstico mecânico e peças.',
      eletrica: 'Triagem encaminhada para laudo técnico elétrico.',
      oleo: 'Triagem encaminhada para troca de óleo e fluidos.',
      alinhamento: 'Triagem encaminhada para alinhamento e geometria.',
      revisao: 'Triagem encaminhada para revisão preventiva.',
      ar_condicionado: 'Triagem encaminhada para climatização e ar-condicionado.',
      pneus: 'Triagem encaminhada para borracharia e troca de pneus.',
      escapamento: 'Triagem encaminhada para diagnóstico de escapamento.',
      estetica: 'Triagem encaminhada para acabamento e estética automotiva.',
      desmanche: 'Triagem encaminhada para gestão de desmanche e peças.',
      lavajato: 'Triagem encaminhada para estética e lava jato.',
    };
    return exp[tipo] || exp.mecanica;
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
    const full = os?.modelo || '';
    const parts = full.trim().split(' ');
    const marca = parts.length > 0 ? parts[0] : '';
    const resto = parts.length > 1 ? parts.slice(1).join(' ') : full;
    const termoBusca = `Peças para ${marca}${resto ? ' ' + resto : ''}`.trim();
    setBuscaMercado(termoBusca);
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
    const tipo = resolverTipoOS({ tipo: setor, tipoServico: setor });
    const abaDestino = resolverAbaDestino(tipo);
    setListaCarros(prev => [novaOS, ...prev]);
    setOsEditando(novaOS);
    setOsEmEdicao(novaOS);
    setAbaAtiva(abaDestino);
  };

  const fecharEdicao = () => {
    setOsEmEdicao(null);
    setOsEditando(null);
    setAbaAtiva('dashboard');
  };

  const titulosGrupoServico = useMemo(() => (
    ['lavajato', 'estetica'].includes(abaAtiva)
      ? { principal: '✨ Estética', secundario: '⚙️ Serviços Mecânicos' }
      : { principal: '⚙️ Serviços Mecânicos', secundario: '✨ Estética' }
  ), [abaAtiva]);

  const oficinaId = useMemo(() => {
    return dadosOficina?.id || localStorage.getItem('oficinaId');
  }, [dadosOficina]);

  // ─── CURATIVO: buscarDadosPorPlaca — evita ReferenceError nas abas ───
  const buscarDadosPorPlaca = async (placaDigitada, callbacks) => {
    const placaNorm = normalizarPlaca(placaDigitada || '');
    if (placaNorm.length < 7) return null;
    const match = listaCarros
      .filter(o => normalizarPlaca(o.placa || '') === placaNorm)
      .sort((a, b) => new Date(b.data_registro || 0) - new Date(a.data_registro || 0))[0];
    if (match && callbacks) {
      if (callbacks.setNome) callbacks.setNome(match.nomeCliente || '');
      if (callbacks.setTelefone) callbacks.setTelefone(match.telefone || '');
      if (callbacks.setModelo) callbacks.setModelo(match.modelo || '');
      if (callbacks.setKm) callbacks.setKm(match.kmAtual || '');
      if (callbacks.onFound) callbacks.onFound(match);
    }
    return match || null;
  };

  async function carregarOS() {
    if (!oficinaId) return;
    try {
      const s = await getDocs(query(collection(db, 'oficinas', oficinaId, 'os'), orderBy('data_registro', 'desc')));
      setListaCarros(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('carregarOS:', e.message); }
  }

  async function carregarFinanceiro() {
    if (!oficinaId) return;
    try {
      const s = await getDocs(query(collection(db, 'oficinas', oficinaId, 'financeiro'), orderBy('data', 'desc')));
      setListaFinanceiro(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('carregarFinanceiro:', e.message); }
  }

  async function carregarEstoque() {
    if (!oficinaId) return;
    try {
      const s = await getDocs(collection(db, 'oficinas', oficinaId, 'estoque'));
      setListaEstoque(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('carregarEstoque:', e.message); }
  }

  async function carregarConfig() {
    if (!oficinaId) return;
    try {
      const d = await getDoc(doc(db, 'oficinas', oficinaId, 'configuracoes', 'geral'));
      if (d.exists()) setConfig(d.data());
    } catch { }
  }

  async function carregarPlanos() {
    try {
      const snap = await getDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'planos'));
      if (snap.exists()) setPlanosSistema(snap.data());

      // Carrega também os vídeos de ajuda do MASTER
      const snapVideos = await getDoc(doc(db, 'oficinas', 'MASTER', 'configuracoes', 'videos_ajuda'));
      if (snapVideos.exists()) setVideosAjudaAdmin(snapVideos.data());
    } catch { }
  }

  function carregarTudo() {
    return Promise.all([
      carregarOS(),
      carregarFinanceiro(),
      carregarEstoque(),
      carregarConfig(),
      carregarPlanos(),
    ]);
  }

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.email === import.meta.env.VITE_SU) {
          setPapelLogado('master');
          setPermissoesLogado(null);
          setLogado(true);
          setCarregandoAuth(false);
          setDadosOficina({ id: user.uid, nome: 'Sistema Master', plano: 'master' });
          return;
        }
        try {
          const docSnap = await getDoc(doc(db, 'usuarios', user.uid));
          if (docSnap.exists()) {
            const dados = docSnap.data();
            const userOficinaId = dados.papel === 'dono' ? user.uid : dados.oficinaId;
            if (userOficinaId) {
              const oficinaSnap = await getDoc(doc(db, 'oficinas', userOficinaId));
              if (oficinaSnap.exists()) {
                const oficina = oficinaSnap.data();
                setDadosOficina({ ...oficina, id: userOficinaId });
                if (oficina.ativo === false) { setBloqueado('bloqueado'); return; }
                if (oficina.plano === 'trial') {
                  const fim = oficina.trialFim?.toDate ? oficina.trialFim.toDate() : new Date(oficina.trialFim);
                  if (fim < new Date()) { setBloqueado('trial'); return; }
                }
              }
            }
            setPermissoesLogado(dados.permissoes || null);
            setPapelLogado(dados.papel || 'dono');
          } else {
            setPermissoesLogado(null);
            setPapelLogado('dono');
            setDadosOficina({ id: user.uid, nome: 'Minha Oficina', plano: 'trial' });
          }
        } catch {
          setPermissoesLogado(null);
          setPapelLogado('dono');
        }
        setLogado(true);
      } else {
        setLogado(false);
        setPermissoesLogado(null);
        setPapelLogado(null);
        setDadosOficina(null);
        setBloqueado(null);
      }
      setCarregandoAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (logado && oficinaId) carregarTudo();
  }, [logado, oficinaId]);

  // ─── MAESTRO: edição de O.S. — renderiza apenas o editor correspondente ───
  if (osEmEdicao) {
    const Editor = resumoEdicaoAtiva?.editor || Mecanica;
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '12px', color: '#888', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
          TRIAGEM ATIVA: {resumoEdicaoAtiva?.titulo || 'Mecânica'}
        </div>
        <div style={{ marginBottom: '12px', color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
          {explicacaoTriagemAtiva}
        </div>
        <button onClick={fecharEdicao} style={{ padding: '8px 12px', marginBottom: '12px', background: '#222', color: 'white', border: '1px solid #555', borderRadius: '6px', cursor: 'pointer' }}>
          ← Voltar / Cancelar
        </button>
        {Editor && (
          <Editor
            oficinaId={oficinaId}
            listaCarros={listaCarros}
            onSalvo={carregarOS}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
            config={config}
            osEmEdicao={osEmEdicao}
            osParaEditar={osEditando}
            onRedirecionar={(t, os) => { setOsEmEdicao(os); setAbaAtiva(t); }}
            onAbrirWhatsApp={abrirWhatsApp}
            onCancelar={fecharEdicao}
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
            permissoesLogado={permissoesLogado}
          />
        )}
      </div>
    );
  }

  const temAcessoPlano = (aba) => {
    const plano = dadosOficina?.plano || 'trial';
    return temAcessoModulo(plano, aba);
  };

  const temPermissao = (aba) => {
    if (papelLogado === 'master') return true;
    if (papelLogado === 'dono') return temAcessoPlano(aba);
    if (!permissoesLogado) return temAcessoPlano(aba);
    return permissoesLogado[aba] === true;
  };

  const verificarSenha = async () => {
    try {
      await signInWithEmailAndPassword(getAuth(), emailInput, senhaInput);
      setErroLogin('');
    } catch {
      setErroLogin('E-mail ou senha inválidos. Tente novamente.');
    }
  };

  const fazerLogout = () => {
    signOut(getAuth()).then(() => {
      window.location.href = 'http://localhost:5174/portal2';
    });
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

  const osFiltradas = listaCarros.filter(os =>
    !busca ||
    (os.placa || '').toLowerCase().includes(busca.toLowerCase()) ||
    (os.modelo || '').toLowerCase().includes(busca.toLowerCase()) ||
    (os.nomeCliente || '').toLowerCase().includes(busca.toLowerCase())
  );

  const LABELS_ABAS = {
    dashboard: '📊 VISÃO GERAL', os: '🔧 O.S.', mecanica: '🔧 MECÂNICA', hibrido: '🔋 HÍBRIDOS',
    moto: '🏍️ MOTOS', eletrico: 'ELÉTRICOS', lataria: '🚗 LATARIA', amortecedor: '🧰 AMORTECEDOR', injecao: '🛠️ INJEÇÃO',
    oleo: '🛢️ ÓLEO', alinhamento: '⚙️ ALINHAMENTO', revisao: '🛡️ REVISÃO', eletrica: '⚡ ELÉTRICA',
    ar_condicionado: '❄️ AR-COND.', pneus: '🛞 PNEUS', escapamento: '🪛 ESCAPAMENTO', estetica: '✨ ESTÉTICA',
    lavajato: '🚿 LAVA JATO', desmanche: '🚗 DESMANCHE', copiloto: '👨‍🔧 COPILOTO',
    secretaria: '👩‍💼 SECRETÁRIA', administrador: '👔 ADMINISTRADOR', contador: '🧮 CONTADOR',
    mercadolivre: '📦 MERCADO LIVRE', mercado_livre: '🛒 MERCADO LIVRE',
    financeiro: '📊 FINANCEIRO', estoque: '📦 ESTOQUE', leads: '👥 CLIENTES', historico: '📋 HISTÓRICO',
    tarefa: '📋 TAREFA', notafiscal: '📄 NOTA FISCAL', retorno: '📅 RETORNO', patrimonio: '📊 PATRIMÔNIO', fornecedores: '🤝 FORNECEDORES',
    equipe: '👥 EQUIPE', config: '⚙️ AJUSTES', marketing: '📣 MARKETING', estrategia: '🚀 ESTRATÉGIA', ajuda: '❓ AJUDA',
    master: '👑 MASTER', meuplano: '💰 MEU PLANO',
  };

  const abasDisponiveis = [
    'dashboard', 'os', 'mecanica', 'hibrido', 'eletrico', 'moto', 'lataria', 'amortecedor', 'injecao',
    'oleo', 'alinhamento', 'eletrica', 'revisao', 'ar_condicionado', 'pneus', 'desmanche', 'escapamento', 'estetica',
    'lavajato', 'copiloto', 'secretaria', 'administrador', 'contador',
    'mercadolivre', 'mercado_livre', 'financeiro', 'estoque', 'leads', 'historico',
    'tarefa', 'notafiscal', 'retorno', 'patrimonio', 'fornecedores',
    'equipe', 'marketing', 'config', 'master', 'meuplano', 'estrategia', 'ajuda',
  ].filter(aba => temPermissao(aba));

  // ─── TELAS DE ESTADO ESPECIAL ───

  if (carregandoAuth) {
    return (
      <div style={{ minHeight: '100vh', background: 'black', color: MAIN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
        ⏳ INICIANDO SISTEMA...
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div style={{ minHeight: '100vh', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ maxWidth: '450px', width: '100%', background: '#111', padding: '40px', borderRadius: '15px', border: `1px solid ${MAIN}`, textAlign: 'center' }}>
          <div style={{ fontSize: '50px', marginBottom: '15px' }}>{bloqueado === 'trial' ? '⏰' : '🔒'}</div>
          <h2 style={{ color: MAIN, margin: '0 0 10px 0' }}>{bloqueado === 'trial' ? 'TEMPO DE TESTE TERMINOU' : 'ACESSO SUSPENSO'}</h2>
          <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '14px', lineHeight: '1.6' }}>
            {bloqueado === 'trial' ? 'Escolha seu plano para continuar:' : 'Sua conta foi suspensa.'}
          </p>
          <button onClick={() => window.open(planosSistema.linkMensal || '#', '_blank')} style={{ width: '100%', padding: '15px', background: '#222', color: 'white', border: '1px solid #555', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
            💳 Plano Mensal
          </button>
          <button onClick={fazerLogout} style={{ width: '100%', padding: '15px', background: MAIN, color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </div>
    );
  }

  if (!logado) {
    return (
      <div style={{ minHeight: '100vh', background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px', background: '#111', padding: '40px', borderRadius: '10px', border: `1px solid ${MAIN}`, boxShadow: '0px 10px 30px rgba(0,0,0,0.5)' }}>
          <h2 style={{ color: 'white', textAlign: 'center', marginBottom: '30px' }}>ADMIN <span style={{ color: MAIN }}>IA</span></h2>
          <input
            type="email"
            placeholder="E-MAIL"
            value={emailInput}
            onChange={(e) => { setEmailInput(e.target.value); setErroLogin(''); }}
            style={{ width: '100%', padding: '15px', background: 'black', border: '1px solid #333', color: 'white', marginBottom: '10px', textAlign: 'center' }}
          />
          <input
            type="password"
            placeholder="SENHA"
            value={senhaInput}
            onChange={(e) => { setSenhaInput(e.target.value); setErroLogin(''); }}
            onKeyDown={(e) => e.key === 'Enter' && verificarSenha()}
            style={{ width: '100%', padding: '15px', background: 'black', border: '1px solid #333', color: 'white', marginBottom: '20px', textAlign: 'center' }}
          />
          {erroLogin && (
            <div style={{ color: '#ff4444', fontSize: '13px', marginBottom: '15px', textAlign: 'center', background: '#ff444411', padding: '10px', borderRadius: '8px', border: '1px solid #ff444433' }}>
              ⚠️ {erroLogin}
            </div>
          )}
          <button onClick={verificarSenha} style={{ width: '100%', padding: '15px', background: MAIN, color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>ENTRAR</button>
          <p style={{ textAlign: 'center', marginTop: '20px', color: '#555', fontSize: '13px' }}>
            Não tem conta? <a href="/cadastro" style={{ color: MAIN, textDecoration: 'none', fontWeight: 'bold' }}>Cadastre sua oficina grátis</a>
          </p>
        </div>
      </div>
    );
  }

  // ─── MODO EDIÇÃO SIMPLES DE O.S. (sem Maestro) ───
  if (osEditando && !osEmEdicao) {
    return (
      <div style={{ minHeight: '100vh', background: 'black', color: 'white', padding: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${MAIN}`, paddingBottom: '15px' }}>
            <h2 style={{ margin: 0, color: MAIN }}>✏️ Editando O.S. - {osEditando.placa}</h2>
            <button onClick={fecharEdicao} style={{ background: 'transparent', color: '#888', border: '1px solid #333', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>✖ Cancelar</button>
          </div>
          <div style={{ display: 'grid', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ color: '#888', fontSize: '12px' }}>CLIENTE</label>
              <input
                value={osEditando.nomeCliente || ''}
                onChange={(e) => setOsEditando({ ...osEditando, nomeCliente: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ color: '#888', fontSize: '12px' }}>PLACA</label>
                <input
                  value={osEditando.placa || ''}
                  onChange={(e) => setOsEditando({ ...osEditando, placa: normalizarPlaca(e.target.value) })}
                  style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>VEÍCULO</label>
                  <input
                    value={osEditando.modelo || ''}
                    onChange={(e) => setOsEditando({ ...osEditando, modelo: e.target.value })}
                    placeholder="Ex: Gol"
                    style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>ANO</label>
                  <input
                    value={osEditando.ano || ''}
                    onChange={(e) => setOsEditando({ ...osEditando, ano: e.target.value })}
                    placeholder="2020"
                    style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>MOTOR</label>
                  <input
                    value={osEditando.motor || ''}
                    onChange={(e) => setOsEditando({ ...osEditando, motor: e.target.value })}
                    placeholder="1.6"
                    style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px' }}
                  />
                </div>
              </div>
            </div>
            <SpeechTextarea
              label="SERVIÇO"
              value={osEditando.checklist || ''}
              onChange={(value) => setOsEditando({ ...osEditando, checklist: value })}
              rows={4}
              placeholder="Descreva os serviços executados..."
              labelStyle={{ color: '#888', fontSize: '12px' }}
            />
            <SpeechTextarea
              label="PEÇAS"
              value={osEditando.detalhesPecas || ''}
              onChange={(value) => setOsEditando({ ...osEditando, detalhesPecas: value })}
              rows={3}
              placeholder="Descreva peças e observações..."
              labelStyle={{ color: '#888', fontSize: '12px' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ color: '#888', fontSize: '12px' }}>VALOR PEÇAS</label>
                <input
                  type="number"
                  value={osEditando.valorPecas || ''}
                  onChange={(e) => setOsEditando({ ...osEditando, valorPecas: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }}
                />
              </div>
              <div>
                <label style={{ color: '#888', fontSize: '12px' }}>MÃO DE OBRA</label>
                <input
                  type="number"
                  value={osEditando.valorMaoObra || ''}
                  onChange={(e) => setOsEditando({ ...osEditando, valorMaoObra: e.target.value })}
                  style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }}
                />
              </div>
            </div>
          </div>
          <button onClick={salvarEdicao} style={{ width: '100%', padding: '18px', background: GREEN, color: 'black', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            💾 SALVAR EDIÇÃO
          </button>
        </div>
      </div>
    );
  }

  // ─── LAYOUT PRINCIPAL ───
  const t = TEMAS[tema];

  return (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.texto, paddingBottom: '100px', transition: 'background 0.3s' }}>

      {/* Header */}
      <div style={{ background: t.bgCard, padding: '15px 20px', borderBottom: `2px solid ${papelLogado === 'master' ? MASTER : MAIN}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px' }}>EXPRESS <span style={{ color: papelLogado === 'master' ? MASTER : MAIN }}>AUTO TECH</span></h1>
          {papelLogado === 'master' && <span style={{ color: MASTER, fontSize: '11px', fontWeight: 'bold' }}>👑 MASTER</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={toggleTema} style={{ background: t.bgCardAlt, color: t.texto, border: `2px solid ${t.border}`, padding: '8px 16px', borderRadius: '30px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
            {t.iconeToggle} {t.labelToggle}
          </button>
          <button onClick={fazerLogout} style={{ background: 'transparent', color: papelLogado === 'master' ? MASTER : MAIN, border: `1px solid ${papelLogado === 'master' ? MASTER : MAIN}`, padding: '8px 16px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>SAIR</button>
        </div>
      </div>

      {/* BOTÃO NOVA O.S. DESTACADO */}
      <div style={{ padding: '12px 20px', background: t.bgCardAlt, borderBottom: `1px solid ${t.border}` }}>
        <button
          onClick={() => setAbaAtiva('os')}
          style={{
            width: '100%', padding: '16px 24px',
            background: abaAtiva === 'os' ? MAIN : t.bgCard,
            color: abaAtiva === 'os' ? 'white' : MAIN,
            border: `2px solid ${abaAtiva === 'os' ? MAIN : MAIN + '66'}`,
            borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            letterSpacing: '1px', transition: 'all 0.2s',
          }}>
          📋 NOVA ORDEM DE SERVIÇO
          {listaCarros.filter(o => o.statusPagamento === 'pendente').length > 0 && (
            <span style={{ background: MAIN, color: 'white', borderRadius: '12px', padding: '2px 10px', fontSize: '12px', fontWeight: 'bold' }}>
              {listaCarros.filter(o => o.statusPagamento === 'pendente').length} pendentes
            </span>
          )}
        </button>

        {/* BUSCA RÁPIDA (PLACA) ABAIXO DA NOVA O.S. */}
        <div style={{ marginTop: '12px', position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Busca Rápida (Placa)..."
            value={busca}
            onChange={(e) => {
              const val = normalizarPlaca(e.target.value);
              setBusca(val);
              if (val.length >= 7) {
                setAbaAtiva('os'); // Abre a lista de O.S. ou histórico se preferir
              }
            }}
            style={{
              width: '100%', padding: '14px 20px', background: t.bgCard, border: `2px solid ${t.border}`,
              borderRadius: '12px', color: t.texto, fontSize: '14px', outline: 'none'
            }}
          />
        </div>
      </div>

      {/* MENU AGRUPADO */}
      <div style={{ background: t.bgCardAlt, padding: '12px 20px 8px', borderBottom: `1px solid ${t.border}` }}>

        {/* GRUPO: SERVIÇOS E ESTÉTICA */}
        <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>⚙️ SERVIÇOS E ESTÉTICA</p>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
          {['mecanica', 'hibrido', 'eletrico', 'moto', 'lataria', 'amortecedor', 'injecao', 'eletrica', 'alinhamento', 'oleo', 'revisao', 'ar_condicionado', 'pneus', 'desmanche', 'escapamento', 'lavajato', 'estetica']
            .filter(aba => abasDisponiveis.includes(aba))
            .map(aba => {
              const corAba = TAB_COLORS[aba] || MAIN;
              return (
                <button key={aba} onClick={() => setAbaAtiva(aba)}
                  className="nav-button-premium"
                  style={{
                    flexShrink: 0, padding: '8px 14px',
                    background: abaAtiva === aba ? `${corAba}22` : t.bgCard,
                    color: abaAtiva === aba ? corAba : `${corAba}aa`,
                    border: `1px solid ${abaAtiva === aba ? corAba : `${corAba}44`}`,
                    borderRadius: '20px', fontWeight: '900', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap',
                    '--glow-color': corAba
                  }}>
                  {LABELS_ABAS[aba]}
                </button>
              );
            })}
        </div>

        {/* GRUPO: INTELIGÊNCIA ARTIFICIAL */}
        <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>🤖 INTELIGÊNCIA ARTIFICIAL</p>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
          {['copiloto', 'secretaria', 'administrador', 'contador', 'mercadolivre']
            .filter(aba => abasDisponiveis.includes(aba))
            .map(aba => {
              const corAba = TAB_COLORS[aba] || MAIN;
              return (
                <button key={aba} onClick={() => setAbaAtiva(aba)}
                  className="nav-button-premium"
                  style={{
                    flexShrink: 0, padding: '10px 18px',
                    background: abaAtiva === aba ? `${corAba}22` : t.bgCard,
                    color: abaAtiva === aba ? corAba : `${corAba}aa`,
                    border: `1px solid ${abaAtiva === aba ? corAba : `${corAba}44`}`,
                    borderRadius: '20px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                    '--glow-color': corAba
                  }}>
                  {LABELS_ABAS[aba]}
                </button>
              );
            })}
        </div>

        {/* GRUPO: GESTÃO */}
        <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>📋 Gestão</p>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
          {['dashboard', 'estoque', 'financeiro', 'tarefa', 'notafiscal', 'retorno', 'leads', 'patrimonio', 'fornecedores', 'historico']
            .filter(aba => abasDisponiveis.includes(aba))
            .map(aba => {
              const corAba = TAB_COLORS[aba] || MAIN;
              return (
                <button key={aba} onClick={() => setAbaAtiva(aba)}
                  className="nav-button-premium"
                  style={{
                    flexShrink: 0, padding: '10px 18px',
                    background: abaAtiva === aba ? `${corAba}22` : t.bgCard,
                    color: abaAtiva === aba ? corAba : `${corAba}aa`,
                    border: `1px solid ${abaAtiva === aba ? corAba : `${corAba}44`}`,
                    borderRadius: '20px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                    '--glow-color': corAba
                  }}>
                  {LABELS_ABAS[aba]}
                </button>
              );
            })}
        </div>

        {/* GRUPO: SISTEMA — apenas dono e master */}
        {(papelLogado === 'dono' || papelLogado === 'master') && (
          <>
            <p style={{ color: t.textoTer, fontSize: '9px', fontWeight: 'bold', letterSpacing: '2px', margin: '0 0 6px', textTransform: 'uppercase' }}>⚙️ Sistema</p>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '4px' }}>
              {['master', 'meuplano', 'config', 'equipe', 'marketing', 'estrategia', 'ajuda']
                .filter(aba => abasDisponiveis.includes(aba))
                .map(aba => {
                  const corAba = TAB_COLORS[aba] || MASTER;
                  return (
                    <button key={aba} onClick={() => setAbaAtiva(aba)}
                      className="nav-button-premium"
                      style={{
                        flexShrink: 0, padding: '10px 18px',
                        background: abaAtiva === aba ? `${corAba}22` : t.bgCard,
                        color: abaAtiva === aba ? corAba : `${corAba}aa`,
                        border: `1px solid ${abaAtiva === aba ? corAba : `${corAba}44`}`,
                        borderRadius: '20px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                        '--glow-color': corAba
                      }}>
                      {LABELS_ABAS[aba]}
                    </button>
                  );
                })}
            </div>
          </>
        )}
      </div>

      {/* AVISO DE IA */}
      {['copiloto', 'revisao', 'alinhamento', 'oleo'].includes(abaAtiva) && (
        <div style={{ background: '#1a1000', border: '1px solid #f59e0b44', borderRadius: '8px', padding: '10px 14px', margin: '14px 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🤖</span>
          <p style={{ margin: 0, color: '#f59e0b', fontSize: '11px', lineHeight: '1.5' }}>
            <strong>AVISO:</strong> A Inteligência Artificial pode cometer erros. Use sempre como <strong>assistente de apoio</strong> — a decisão técnica final é sempre do mecânico qualificado.
          </p>
        </div>
      )}

      {/* ─── CONTEÚDO DAS ABAS — ROTEAMENTO INDIVIDUAL ─── */}
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>

        {/* DASHBOARD */}
        {abaAtiva === 'dashboard' && (
          <Dashboard
            listaCarros={listaCarros}
            listaFinanceiro={listaFinanceiro}
            listaEstoque={listaEstoque}
            config={config}
            onAbrirWhatsApp={abrirWhatsApp}
            onLembreteOleo={dispararLembreteOleo}
            tema={tema}
            onToggleTema={toggleTema}
            onNovaOS={() => setAbaAtiva('os')}
            onBuscarCliente={() => setAbaAtiva('leads')}
            onFinanceiro={() => setAbaAtiva('financeiro')}
            onEstoque={() => setAbaAtiva('estoque')}
            onLancarDespesa={() => setAbaAtiva('financeiro')}
            onAgendarRevisao={() => setAbaAtiva('revisao')}
          />
        )}

        {/* NOVA O.S. */}
        {abaAtiva === 'os' && (
          <>
            <OSModulo
              oficinaId={oficinaId}
              listaCarros={listaCarros}
              onSalvo={carregarOS}
              onRedirecionar={handleOSCriada}
              buscarDadosPorPlaca={buscarDadosPorPlaca}
              config={config}
              editarOS={osEditando}
              onAbrirWhatsApp={abrirWhatsApp}
            />
            <div style={{ marginTop: '20px' }}>
              <ListaOS
                listaCarros={listaCarros}
                oficinaId={oficinaId}
                onEditar={(os) => iniciarEdicao(os)}
                onDeletar={deletarOS}
                onWhatsApp={enviarWhatsApp}
                onBaixar={(os) => enviarWhatsApp(os, 'pagamento')}
                iniciarEdicao={iniciarEdicao}
                onMercadoClick={abrirMercado}
                osEmEdicao={osEmEdicao}
              />
            </div>
          </>
        )}

        {/* MECÂNICA GERAL (Mantém o componente Mecânica) */}
        {abaAtiva === 'mecanica' && (
          <Mecanica
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            irParaNovaOS={irParaNovaOS}
            papelLogado={papelLogado}
            oficinaId={oficinaId}
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
            handleSalvarOS={handleSalvarOS}
            salvandoOS={salvandoOS}
            salvo={salvo}
            onSalvo={carregarOS}
            osEmEdicao={osEmEdicao}
            osParaEditar={osEditando}
            onCancelar={fecharEdicao}
            dadosOficina={dadosOficina}
            permissoesLogado={permissoesLogado}
            listaCarros={listaCarros}
            listaFinanceiro={listaFinanceiro}
            listaEstoque={listaEstoque}
            config={config}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
          />
        )}

        {/* HÍBRIDOS */}
        {abaAtiva === 'hibrido' && (
          <HibridoEV
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            irParaNovaOS={irParaNovaOS}
            papelLogado={papelLogado}
            oficinaId={oficinaId}
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
            handleSalvarOS={handleSalvarOS}
            salvandoOS={salvandoOS}
            salvo={salvo}
            onSalvo={carregarOS}
            osEmEdicao={osEmEdicao}
            osParaEditar={osEditando}
            onCancelar={fecharEdicao}
            dadosOficina={dadosOficina}
            permissoesLogado={permissoesLogado}
            listaCarros={listaCarros}
            listaFinanceiro={listaFinanceiro}
            listaEstoque={listaEstoque}
            config={config}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
          />
        )}

        {/* ELÉTRICOS BEV */}
        {abaAtiva === 'eletrico' && (
          <VeiculoEletrico
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            irParaNovaOS={irParaNovaOS}
            papelLogado={papelLogado}
            oficinaId={oficinaId}
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
            handleSalvarOS={handleSalvarOS}
            salvandoOS={salvandoOS}
            salvo={salvo}
            onSalvo={carregarOS}
            osEmEdicao={osEmEdicao}
            osParaEditar={osEditando}
            onCancelar={fecharEdicao}
            dadosOficina={dadosOficina}
            permissoesLogado={permissoesLogado}
            listaCarros={listaCarros}
            listaFinanceiro={listaFinanceiro}
            listaEstoque={listaEstoque}
            config={config}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
          />
        )}

        {/* MOTOS */}
        {abaAtiva === 'moto' && (
          <MotoModulo
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            irParaNovaOS={irParaNovaOS}
            papelLogado={papelLogado}
            oficinaId={oficinaId}
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
            handleSalvarOS={handleSalvarOS}
            salvandoOS={salvandoOS}
            salvo={salvo}
            onSalvo={carregarOS}
            osEmEdicao={osEmEdicao}
            osParaEditar={osEditando}
            onCancelar={fecharEdicao}
            dadosOficina={dadosOficina}
            permissoesLogado={permissoesLogado}
            listaCarros={listaCarros}
            listaFinanceiro={listaFinanceiro}
            listaEstoque={listaEstoque}
            config={config}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
          />
        )}

        {/* LATARIA */}
        {abaAtiva === 'lataria' && (
          <LatariaModulo
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            irParaNovaOS={irParaNovaOS}
            papelLogado={papelLogado}
            oficinaId={oficinaId}
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
            handleSalvarOS={handleSalvarOS}
            salvandoOS={salvandoOS}
            salvo={salvo}
            onSalvo={carregarOS}
            osEmEdicao={osEmEdicao}
            osParaEditar={osEditando}
            onCancelar={fecharEdicao}
            dadosOficina={dadosOficina}
            permissoesLogado={permissoesLogado}
            listaCarros={listaCarros}
            listaFinanceiro={listaFinanceiro}
            listaEstoque={listaEstoque}
            config={config}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
          />
        )}

        {/* AMORTECEDOR */}
        {abaAtiva === 'amortecedor' && (
          <AmortecedorModulo
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            irParaNovaOS={irParaNovaOS}
            papelLogado={papelLogado}
            oficinaId={oficinaId}
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
            handleSalvarOS={handleSalvarOS}
            salvandoOS={salvandoOS}
            salvo={salvo}
            onSalvo={carregarOS}
            osEmEdicao={osEmEdicao}
            osParaEditar={osEditando}
            onCancelar={fecharEdicao}
            dadosOficina={dadosOficina}
            permissoesLogado={permissoesLogado}
            listaCarros={listaCarros}
            listaFinanceiro={listaFinanceiro}
            listaEstoque={listaEstoque}
            config={config}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
          />
        )}

        {/* INJEÇÃO */}
        {abaAtiva === 'injecao' && (
          <InjecaoModulo
            abaAtiva={abaAtiva}
            setAbaAtiva={setAbaAtiva}
            irParaNovaOS={irParaNovaOS}
            papelLogado={papelLogado}
            oficinaId={oficinaId}
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
            handleSalvarOS={handleSalvarOS}
            salvandoOS={salvandoOS}
            salvo={salvo}
            onSalvo={carregarOS}
            osEmEdicao={osEmEdicao}
            osParaEditar={osEditando}
            onCancelar={fecharEdicao}
            dadosOficina={dadosOficina}
            permissoesLogado={permissoesLogado}
            listaCarros={listaCarros}
            listaFinanceiro={listaFinanceiro}
            listaEstoque={listaEstoque}
            config={config}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
          />
        )}
        {/* ÓLEO */}
        {abaAtiva === 'oleo' && (
          <OleoModulo
            oficinaId={oficinaId}
            onSalvo={carregarOS}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
            osParaEditar={osEditando}
            onCancelar={fecharEdicao}
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
            permissoesLogado={permissoesLogado}
            irParaNovaOS={irParaNovaOS}
          />
        )}

        {/* ALINHAMENTO */}
        {abaAtiva === 'alinhamento' && (
          <AlinhamentoModulo
            oficinaId={oficinaId}
            onSalvo={carregarOS}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
            osParaEditar={osEditando}
            onCancelar={fecharEdicao}
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
            permissoesLogado={permissoesLogado}
            formatarMoeda={formatarMoeda}
            servicosAlinhamento={servicosAlinhamento}
            setServicosAlinhamento={setServicosAlinhamento}
            extrasAlinhamento={extrasAlinhamento}
            setExtrasAlinhamento={setExtrasAlinhamento}
            estadoPneus={estadoPneus}
            setEstadoPneus={setEstadoPneus}
            irParaNovaOS={irParaNovaOS}
          />
        )}

        {/* ELÉTRICA */}
        {abaAtiva === 'eletrica' && (
          <EletricaModulo
            oficinaId={oficinaId}
            onSalvo={carregarOS}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
            osEmEdicao={osEmEdicao}
            osParaEditar={osEditando}
            onCancelar={fecharEdicao}
            subAbaEletrica={subAbaEletrica}
            setSubAbaEletrica={setSubAbaEletrica}
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
            permissoesLogado={permissoesLogado}
            irParaNovaOS={irParaNovaOS}
          />
        )}

        {/* REVISÃO */}
        {abaAtiva === 'revisao' && (
          <RevisaoModulo
            oficinaId={oficinaId}
            onSalvo={carregarOS}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
            osParaEditar={osEditando}
            onCancelar={fecharEdicao}
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
            permissoesLogado={permissoesLogado}
            irParaNovaOS={irParaNovaOS}
          />
        )}

        {/* AR-CONDICIONADO */}
        {abaAtiva === 'ar_condicionado' && (
          <ArCondicionado
            oficinaId={oficinaId}
            onSalvo={carregarOS}
            buscarDadosPorPlaca={buscarDadosPorPlaca}
            osParaEditar={osEditando}
            onCancelar={fecharEdicao}
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
            permissoesLogado={permissoesLogado}
            irParaNovaOS={irParaNovaOS}
          />
        )}

        {/* PNEUS */}
        {abaAtiva === 'pneus' && (
          <PneusModulo
            oficinaId={oficinaId}
            onSalvo={carregarOS}
            buscarPorPlaca={buscarDadosPorPlaca}
            osParaEditar={osEditando}
            onCancelarEdicao={fecharEdicao}
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
            irParaNovaOS={irParaNovaOS}
          />
        )}

        {/* ESCAPAMENTO */}
        {abaAtiva === 'escapamento' && (
          <Escapamento
            oficinaId={oficinaId}
            osParaEditar={osEmEdicao || osEditando}
            onCancelar={fecharEdicao}
            onSalvo={carregarOS}
            irParaNovaOS={irParaNovaOS}
          />
        )}

        {/* ESTÉTICA */}
        {abaAtiva === 'estetica' && (
          <Estetica
            oficinaId={oficinaId}
            osParaEditar={osEmEdicao || osEditando}
            onCancelar={fecharEdicao}
            onSalvo={carregarOS}
            irParaNovaOS={irParaNovaOS}
          />
        )}

        {/* LAVA JATO */}
        {abaAtiva === 'lavajato' && (
          <LavaJato
            oficinaId={oficinaId}
            osParaEditar={osEmEdicao || osEditando}
            onCancelar={fecharEdicao}
            onSalvo={carregarOS}
            irParaNovaOS={irParaNovaOS}
          />
        )}

        {/* DESMANCHE */}
        {abaAtiva === 'desmanche' && (
          <Desmanche
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
            carregarFinanceiro={carregarFinanceiro}
            config={config}
            permissoesLogado={permissoesLogado}
          />
        )}

        {/* COPILOTO IA */}
        {abaAtiva === 'copiloto' && (
          <CopilotoModulo
            papelLogado={papelLogado}
            dadosOficina={dadosOficina}
            setAbaAtiva={setAbaAtiva}
            listaCarros={listaCarros}
          />
        )}

        {/* SECRETÁRIA IA */}
        {abaAtiva === 'secretaria' && (
          <Secretaria />
        )}

        {/* ADMINISTRADOR IA */}
        {abaAtiva === 'administrador' && (
          <Administrador />
        )}

        {/* CONTADOR IA */}
        {abaAtiva === 'contador' && (
          <Contador />
        )}

        {/* MARKETING */}
        {abaAtiva === 'marketing' && (
          <MarketingModulo />
        )}

        {/* MERCADO LIVRE */}
        {abaAtiva === 'mercadolivre' && (
          <MercadoLivre
            termoBuscaInicial={buscaMercado}
          />
        )}

        {/* FINANCEIRO */}
        {abaAtiva === 'financeiro' && (
          <Financeiro
            oficinaId={oficinaId}
            listaFinanceiro={listaFinanceiro}
            onSalvo={carregarFinanceiro}
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
          />
        )}

        {/* ESTOQUE */}
        {abaAtiva === 'estoque' && (
          <Estoque
            oficinaId={oficinaId}
            listaEstoque={listaEstoque}
            onSalvo={carregarEstoque}
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
          />
        )}

        {/* LEADS / CLIENTES */}
        {abaAtiva === 'leads' && (
          <LeadsPage
            oficinaId={oficinaId}
            listaCarros={listaCarros}
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
          />
        )}

        {/* HISTÓRICO */}
        {abaAtiva === 'historico' && (
          <Historico
            oficinaId={oficinaId}
            listaCarros={listaCarros}
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
          />
        )}

        {/* EQUIPE */}
        {abaAtiva === 'equipe' && (
          <Equipe
            oficinaId={oficinaId}
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
          />
        )}

        {/* CONFIGURAÇÕES */}
        {abaAtiva === 'config' && (
          <ConfiguracoesPage
            oficinaId={oficinaId}
            onSalvo={carregarConfig}
            dadosOficina={dadosOficina}
            papelLogado={papelLogado}
          />
        )}
        {/* MEU PLANO */}
        {abaAtiva === 'meuplano' && (
          <ModuloMeuPlano
            dadosOficina={dadosOficina}
            planosSistema={planosSistema}
          />
        )}

        {/* MASTER PANEL */}
        {abaAtiva === 'master' && (
          <MasterPanel
            setPlanosGlobais={setPlanosSistema}
          />
        )}

        {/* TAREFAS */}
        {abaAtiva === 'tarefa' && (
          <TarefaTab oficinaId={oficinaId} />
        )}

        {/* NOTA FISCAL */}
        {abaAtiva === 'notafiscal' && (
          <NotaFiscal
            oficinaId={oficinaId}
            papelLogado={papelLogado}
            dadosOficina={dadosOficina}
          />
        )}

        {/* RETORNO */}
        {abaAtiva === 'retorno' && (
          <GestaoRetorno
            oficinaId={oficinaId}
            listaCarros={listaCarros}
            setListaCarros={setListaCarros}
            nomeOficina={dadosOficina?.nome}
            abrirWhatsAppFn={abrirWhatsApp}
          />
        )}

        {/* PATRIMÔNIO */}
        {abaAtiva === 'patrimonio' && (
          <OficinaPatrimonio
            oficinaId={oficinaId}
          />
        )}

        {/* FORNECEDORES */}
        {abaAtiva === 'fornecedores' && (
          <Fornecedores
            oficinaId={oficinaId}
            db={db}
          />
        )}

        {/* ESTRATÉGIA */}
        {abaAtiva === 'estrategia' && (
          <AbaEstrategia
            oficinaId={oficinaId}
          />
        )}

        {/* AJUDA */}
        {abaAtiva === 'ajuda' && (
          <Ajuda
            ajudaItens={AJUDA_ITENS}
            tabColors={TAB_COLORS}
            videosAjudaAdmin={videosAjudaAdmin}
          />
        )}

      </div>

      <QuickActions
        oficinaId={oficinaId}
        GREEN_MONEY={GREEN}
        modalTarefaAberto={modalTarefaAberto}
        setModalTarefaAberto={setModalTarefaAberto}
        tarefaRapidaTitulo={tarefaRapidaTitulo}
        setTarefaRapidaTitulo={setTarefaRapidaTitulo}
        tarefaRapidaDesc={tarefaRapidaDesc}
        setTarefaRapidaDesc={setTarefaRapidaDesc}
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
      />
    </div>
  );
}
