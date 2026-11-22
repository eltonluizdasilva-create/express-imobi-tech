import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from './lib/firebase';
import {
  collectionGroup,
  query,
  getDocs,
  collection,
  addDoc,
  serverTimestamp,
  limit,
  where,
} from 'firebase/firestore';
import { useGroq } from './hooks/useGroq';
import SolicitacaoExclusaoDados from './components/privacidade/SolicitacaoExclusaoDados';
import { FOTOS_EXEMPLO, ehFotoExemplo } from './lib/fotosExemplo';
import {
  ArrowLeft,
  Building2,
  Calculator,
  FileCheck2,
  ClipboardCheck,
  TrendingUp,
  Lock,
  Sparkles,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Search,
  Calendar,
  ShieldCheck,
  Home,
  Key,
  Share2,
} from 'lucide-react';

// ==========================================
// 🔒 TRAVA DE SEGURANÇA (Limite diário de IA)
// ==========================================
const verificarLimiteIA = () => {
  const hoje = new Date().toLocaleDateString();
  const limite = JSON.parse(localStorage.getItem('uso_ia_cliente') || '{"data": "", "quantidade": 0}');
  if (limite.data !== hoje) {
    limite.data = hoje;
    limite.quantidade = 0;
  }
  if (limite.quantidade >= 10) {
    alert('⚠️ Limite diário de consultas gratuitas atingido! Um corretor especialista entrará em contacto consigo.');
    return false;
  }
  limite.quantidade += 1;
  localStorage.setItem('uso_ia_cliente', JSON.stringify(limite));
  return true;
};

const fmtBRL = (valor) =>
  Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  });

const limparNumero = (val) => Number(String(val || '').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

// ==========================================
// 🎯 INTEGRAÇÃO IMEDIATA COM O CRM DO CORRETOR
// ==========================================
async function resolverImobiliariaIds(oficinaIdPreferencial) {
  const ids = new Set();
  if (oficinaIdPreferencial) ids.add(oficinaIdPreferencial);

  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('imobiliariaId') || params.get('imob') || params.get('oficinaId');
    if (fromUrl) ids.add(fromUrl);
  } catch (e) {
    console.warn(e);
  }

  try {
    const lsImob = localStorage.getItem('imobiliariaId');
    const lsOfic = localStorage.getItem('oficinaId');
    if (lsImob) ids.add(lsImob);
    if (lsOfic) ids.add(lsOfic);
  } catch (e) {
    console.warn(e);
  }

  // Sem fallback global: as rules bloqueiam listagem de `oficinas` e `usuarios`
  // para visitantes (só o tenant autenticado lê a própria organização).
  // O tenant vem SEMPRE de ?imobiliariaId= (ou do vínculo salvo no navegador).
  if (ids.size === 0) {
    console.warn(
      '[Portal] Nenhum imobiliariaId informado. O lead será gravado apenas na coleção global. ' +
      'Divulgue o link com ?imobiliariaId=<id-da-imobiliaria>.'
    );
  }

  return Array.from(ids);
}

export async function registrarLeadNoCRM({
  nome,
  telefone,
  interesse,
  bairro = '',
  orcamento = 0,
  detalhes = '',
  oficinaIdPreferencial = null,
}) {
  const nomeLimpo = String(nome || '').trim();
  const telLimpo = String(telefone || '').replace(/\D/g, '');
  if (!nomeLimpo || telLimpo.length < 8) return false;

  // Persiste qualificação na sessão para facilitar navegação do cliente
  try {
    localStorage.setItem(
      'lead_qualificado_imobi',
      JSON.stringify({ nome: nomeLimpo, telefone: String(telefone || '').trim() })
    );
  } catch (e) {
    console.warn(e);
  }

  const payloadImobi = {
    nome: nomeLimpo,
    telefone: telLimpo,
    interesse: interesse || 'Compra',
    bairro: bairro || 'Portal Público',
    orcamento: Number(orcamento) || 0,
    estagio: 'Qualificado IA',
    corretorResponsavel: 'Plantão Digital IA',
    origem: `Portal do Cliente • ${interesse || 'Ferramenta Pública'}`,
    observacoes: detalhes || '',
    data_registro: new Date().toISOString(),
    criadoEm: serverTimestamp(),
  };

  // Guarda também em fila local para sincronização garantida quando o corretor abrir o painel no mesmo navegador
  try {
    const pendentes = JSON.parse(localStorage.getItem('leads_portal_pendentes') || '[]');
    pendentes.unshift({
      ...payloadImobi,
      idTemp: `portal_${Date.now()}`,
      criadoEmISO: new Date().toISOString(),
    });
    localStorage.setItem('leads_portal_pendentes', JSON.stringify(pendentes.slice(0, 30)));
  } catch (e) {
    console.warn(e);
  }

  try {
    const targetIds = await resolverImobiliariaIds(oficinaIdPreferencial);

    await Promise.all([
      // Coleção global de leads
      addDoc(collection(db, 'leads'), payloadImobi).catch(() => null),
      // Subcoleções de cada imobiliária/corretor identificado (CRM Funil + LeadsPage)
      ...(targetIds || [])?.flatMap((id) => [
        addDoc(collection(db, 'oficinas', id, 'leads_imobi'), payloadImobi).catch(() => null),
        addDoc(collection(db, 'oficinas', id, 'leads'), {
          nome: nomeLimpo,
          telefone: telLimpo,
          imovel: bairro || interesse,
          problema: detalhes || `Lead qualificado via ${interesse}`,
          status: 'novo',
          origem: 'portal_cliente_imobi',
          orcamento: Number(orcamento) || 0,
          data_registro: new Date().toISOString(),
        }).catch(() => null),
      ]),
    ]);
    return true;
  } catch (err) {
    console.error('Erro ao registrar lead no CRM:', err);
    return false;
  }
}

// ==========================================
// 🛡️ COMPONENTE DE QUALIFICAÇÃO OBRIGATÓRIA DE LEAD
// ==========================================
function BlocoQualificacaoLead({ nome, setNome, telefone, setTelefone, erroQualificacao, tituloContextual }) {
  return (
    <div className="rounded-2xl border border-[#10b981]/40 bg-[#020408] p-5 text-left shadow-[0_0_30px_rgba(16,185,129,0.08)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#10b981]/20 text-[#10b981]">
          <Lock size={13} />
        </span>
        <span className="text-[11px] font-black uppercase tracking-wider text-[#10b981]">
          Identificação Obrigatória para Liberar {tituloContextual || 'o Relatório Detalhado'}
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Informe o seu Nome e WhatsApp/Telemóvel para desbloquear o resultado completo e receber acompanhamento personalizado do corretor.
      </p>
      <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
        Coleta mínima: usamos esses dois dados apenas para responder ao seu contato e registrá-lo no CRM da
        imobiliária responsável. Para pedir acesso, correção ou exclusão, fale com a imobiliária ou escreva para{' '}
        <a
          href="mailto:contato@expresstech.com.br?subject=LGPD%20-%20Exclus%C3%A3o%20de%20dados"
          className="text-[#10b981] underline"
        >
          contato@expresstech.com.br
        </a>
        . Detalhes na{' '}
        <Link to="/privacidade" className="text-[#10b981] underline">
          Política de Privacidade
        </Link>
        .
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="portal-lead-nome" className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
            Seu Nome Completo *
          </label>
          <div className="relative">
            <User size={15} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#10b981]" />
            <input
              id="portal-lead-nome"
              name="nome"
              type="text"
              autoComplete="name"
              required
              placeholder="Ex: Maria Oliveira"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-semibold outline-none focus:border-[#10b981]"
            />
          </div>
        </div>
        <div>
          <label htmlFor="portal-lead-telefone" className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
            WhatsApp / Telemóvel *
          </label>
          <div className="relative">
            <Phone size={15} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#10b981]" />
            <input
              id="portal-lead-telefone"
              name="telefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="Ex: (34) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-semibold outline-none focus:border-[#10b981]"
            />
          </div>
        </div>
      </div>
      {erroQualificacao && (
        <p role="alert" className="mt-3 text-xs font-bold text-amber-400 flex items-center gap-1.5">
          <span aria-hidden="true">⚠️</span> {erroQualificacao}
        </p>
      )}
    </div>
  );
}

const DisclaimerIA = () => (
  <div className="mt-8 flex justify-center">
    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-wider leading-relaxed text-center max-w-lg border-t border-slate-900 pt-5">
      ⚠️ Este documento e respetiva simulação são gerados por IA como minuta de apoio operacional e devem ser validados por profissionais habilitados (CRECI / instituição financeira).
    </p>
  </div>
);

const BotaoVoltar = ({ onBack }) => (
  <button
    onClick={onBack}
    className="mb-8 inline-flex items-center gap-2 text-[#10b981] font-black text-[11px] uppercase tracking-widest border border-[#10b981]/40 px-6 py-2.5 rounded-full hover:bg-[#10b981] hover:text-[#020408] transition-all cursor-pointer"
  >
    <ArrowLeft size={14} /> Voltar ao Portal
  </button>
);

// ==========================================
// ❓ BOTÃO DE AJUDA CONTEXTUAL (?) PARA CAMPOS TÉCNICOS
// ==========================================
function BotaoAjudaCampo({ id, topicoAtivo, setTopicoAtivo, titulo, explicacao }) {
  const aberto = topicoAtivo === id;
  return (
    <span className="inline-flex items-center">
      <button
        type="button"
        onClick={() => setTopicoAtivo(aberto ? null : id)}
        title={`Ajuda: ${titulo}`}
        aria-label={`Explicação sobre ${titulo}`}
        className={`ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black border transition-all cursor-pointer ${
          aberto
            ? 'bg-[#10b981] text-[#020408] border-[#10b981]'
            : 'bg-[#020408] text-[#10b981] border-[#10b981]/50 hover:bg-[#10b981] hover:text-[#020408]'
        }`}
      >
        ?
      </button>
      {aberto && (
        <span className="block w-full mt-2 p-3 rounded-xl bg-[#020408] border border-[#10b981]/40 text-left shadow-lg">
          <strong className="block text-[10px] font-black uppercase tracking-wider text-[#10b981] mb-1">
            💡 {titulo}
          </strong>
          <span className="block text-[11px] text-slate-300 font-normal normal-case leading-relaxed">
            {explicacao}
          </span>
        </span>
      )}
    </span>
  );
}

// ==========================================
// ⚖️ DISCLAIMER JURÍDICO DESTACADO — FINANCIAMENTO
// ==========================================
function DisclaimerJuridicoFinanciamento() {
  return (
    <div
      role="alert"
      className="mt-8 rounded-2xl border-2 border-[#10b981]/50 bg-[#020408] p-5 text-left shadow-[0_0_30px_rgba(16,185,129,0.08)]"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center text-[#10b981] shrink-0 mt-0.5">
          <ShieldCheck size={18} />
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#10b981]">
            ⚖️ Aviso Jurídico e Regulatório Importante
          </p>
          <p className="text-xs text-slate-200 font-semibold leading-relaxed">
            Os cálculos e pareceres exibidos nesta página possuem caráter <strong className="text-white">exclusivamente informativo e de simulação preliminar</strong>, gerados com apoio de Inteligência Artificial como minuta operacional.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Esta simulação não constitui proposta de crédito, promessa de contratação nem garantia de taxa de juros. A aprovação efetiva do financiamento, o limite de crédito, o Custo Efetivo Total (CET), os seguros obrigatórios (MIP e DFI) e o prazo final dependem <strong className="text-slate-200">exclusivamente da análise de crédito, comprovação de renda, avaliação de engenharia do imóvel e políticas vigentes da instituição financeira</strong> escolhida.
          </p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1. SIMULADOR DE FINANCIAMENTO COM IA
// ==========================================
function SimuladorFinanciamentoIA({ onBack, leadInicial, oficinaIdPortal }) {
  const { analyzeText, loading } = useGroq();
  const [nome, setNome] = useState(leadInicial?.nome || '');
  const [telefone, setTelefone] = useState(leadInicial?.telefone || '');
  const [valorImovel, setValorImovel] = useState('500000');
  const [entrada, setEntrada] = useState('100000');
  const [idadeComprador, setIdadeComprador] = useState('35');
  const [prazoAnos, setPrazoAnos] = useState('30');
  const [modalidadeCredito, setModalidadeCredito] = useState('SBPE');
  const [jurosAnual, setJurosAnual] = useState('10.5');
  const [sistema, setSistema] = useState('SAC');
  const [bairro, setBairro] = useState('');
  const [topicoAjudaAtivo, setTopicoAjudaAtivo] = useState(null);
  const [erroQualificacao, setErroQualificacao] = useState('');
  const [resultado, setResultado] = useState(null);
  const [enviandoLead, setEnviandoLead] = useState(false);

  // Cálculo automático do prazo máximo permitido pela regra bancária (Idade + Prazo <= 80 anos e 6 meses, limitado a 35 anos)
  const idadeNum = Math.max(18, Math.min(80, Math.floor(limparNumero(idadeComprador) || 35)));
  const prazoMaximoPorIdade = Math.max(1, Math.min(35, Math.floor(80.5 - idadeNum)));
  const prazoSolicitado = Math.max(1, Math.floor(limparNumero(prazoAnos) || 30));
  const prazoExcedeIdade = prazoSolicitado > prazoMaximoPorIdade;

  const handleTrocarModalidade = (novaMod) => {
    setModalidadeCredito(novaMod);
    if (novaMod === 'MCMV') {
      setJurosAnual('7.66');
    } else {
      setJurosAnual('10.5');
    }
  };

  const simular = async () => {
    const telDigitos = String(telefone || '').replace(/\D/g, '');
    if (!nome.trim() || telDigitos.length < 8) {
      setErroQualificacao('Preencha obrigatoriamente o seu Nome e WhatsApp/Telemóvel válido para desbloquear o resultado completo.');
      return;
    }
    setErroQualificacao('');

    const vImovel = limparNumero(valorImovel);
    const vEntrada = limparNumero(entrada);
    const anosEfetivos = Math.max(1, Math.min(prazoMaximoPorIdade, prazoSolicitado));
    const taxaAnual = Math.max(1, limparNumero(jurosAnual) || 10.5);

    if (vImovel <= 0 || vEntrada >= vImovel) {
      alert('Informe um valor de imóvel válido e uma entrada inferior ao valor do imóvel.');
      return;
    }

    if (prazoExcedeIdade) {
      setPrazoAnos(String(anosEfetivos));
    }

    setEnviandoLead(true);
    const financiado = vImovel - vEntrada;
    const meses = anosEfetivos * 12;
    const taxaMensal = taxaAnual / 100 / 12;

    let primeiraParcela = 0;
    let ultimaParcela = 0;
    if (sistema === 'SAC') {
      const amortizacao = financiado / meses;
      primeiraParcela = amortizacao + financiado * taxaMensal;
      ultimaParcela = amortizacao + amortizacao * taxaMensal;
    } else {
      const fator = Math.pow(1 + taxaMensal, meses);
      primeiraParcela = (financiado * (taxaMensal * fator)) / (fator - 1);
      ultimaParcela = primeiraParcela;
    }

    const rendaMinima = primeiraParcela / 0.3;

    // Captura imediata do Lead no CRM do corretor
    await registrarLeadNoCRM({
      nome,
      telefone,
      interesse: `Financiamento ${modalidadeCredito} (${sistema})`,
      bairro: bairro || 'Simulador de Financiamento',
      orcamento: vImovel,
      detalhes: `Simulação ${modalidadeCredito}/${sistema}: Imóvel ${fmtBRL(vImovel)}, Entrada ${fmtBRL(vEntrada)}, Idade ${idadeNum} anos, Prazo ${anosEfetivos} anos, 1ª Parcela ${fmtBRL(primeiraParcela)}.`,
      oficinaIdPreferencial: oficinaIdPortal,
    });

    let analiseIA =
      `Análise Preliminar (${modalidadeCredito} • ${sistema}): Para um imóvel de ${fmtBRL(vImovel)} com entrada de ${fmtBRL(vEntrada)} (${Math.round((vEntrada / vImovel) * 100)}%), ` +
      `o valor financiado é de ${fmtBRL(financiado)} em ${meses} meses (${anosEfetivos} anos, respeitando o limite bancário para ${idadeNum} anos de idade). ` +
      `Recomenda-se renda familiar bruta a partir de ${fmtBRL(rendaMinima)} (comprometimento máximo de 30% da renda).`;

    if (verificarLimiteIA()) {
      try {
        const prompt = `Atue como especialista em crédito imobiliário brasileiro. O cliente ${nome} (${idadeNum} anos) simulou na modalidade ${modalidadeCredito} um imóvel de R$ ${vImovel}, entrada de R$ ${vEntrada}, prazo ${anosEfetivos} anos, juros ${taxaAnual}% a.a. no sistema ${sistema}. Primeira parcela: R$ ${primeiraParcela.toFixed(2)}. Dê 3 orientações claras sobre: 1) diferença prática entre SAC e Price para este caso, 2) regras do ${modalidadeCredito} e uso do FGTS, e 3) impacto da idade no prazo. Máximo 5 linhas, sem asteriscos.`;
        const resIA = await analyzeText(prompt);
        if (resIA && resIA.trim()) analiseIA = resIA.replace(/\*\*/g, '').trim();
      } catch (e) {
        console.warn('Usando análise padrão local:', e);
      }
    }

    setResultado({
      vImovel,
      vEntrada,
      financiado,
      anosEfetivos,
      meses,
      idadeNum,
      modalidadeCredito,
      sistema,
      primeiraParcela,
      ultimaParcela,
      rendaMinima,
      analiseIA,
    });
    setEnviandoLead(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 px-4 mt-8">
      <BotaoVoltar onBack={onBack} />
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 mb-2">
          <Calculator size={12} /> Crédito Habitacional & Clareza Jurídica
        </span>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">
          Simulador de <span className="text-[#10b981]">Financiamento com IA</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Toque nos botões <span className="text-[#10b981] font-black">(?)</span> em cada campo para entender de forma simples as regras bancárias.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* VALOR DO IMÓVEL */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Valor do Imóvel (R$)
            </label>
            <input
              type="number"
              value={valorImovel}
              onChange={(e) => setValorImovel(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            />
          </div>

          {/* ENTRADA / FGTS COM AJUDA (?) */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Valor de Entrada / FGTS (R$)
              <BotaoAjudaCampo
                id="entrada_fgts"
                topicoAtivo={topicoAjudaAtivo}
                setTopicoAtivo={setTopicoAjudaAtivo}
                titulo="Entrada Mínima e Uso do FGTS"
                explicacao="A maioria dos bancos pede no mínimo 20% do valor do imóvel como entrada. Você pode somar recursos próprios com o saldo do seu FGTS (desde que cumpra os requisitos de 3 anos de trabalho sob o regime do FGTS e não possua outro financiamento ativo no SFH)."
              />
            </label>
            <input
              type="number"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            />
          </div>

          {/* MODALIDADE MCMV vs SBPE COM AJUDA (?) */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Linha de Crédito (MCMV vs SBPE)
              <BotaoAjudaCampo
                id="mcmv_sbpe"
                topicoAtivo={topicoAjudaAtivo}
                setTopicoAtivo={setTopicoAjudaAtivo}
                titulo="Minha Casa Minha Vida (MCMV) vs SBPE"
                explicacao="• MCMV: Programa habitacional para famílias com renda bruta até R$ 8 mil (ou teto vigente) e imóveis até R$ 350 mil, oferecendo as menores taxas de juros do mercado (4,5% a 8,16% a.a.) e subsídio do governo. • SBPE: Linha tradicional com recursos da poupança para imóveis de qualquer valor, financiando até 80% do bem com taxas de mercado."
              />
            </label>
            <select
              value={modalidadeCredito}
              onChange={(e) => handleTrocarModalidade(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            >
              <option value="SBPE">SBPE — Sistema de Poupança (Qualquer Valor)</option>
              <option value="MCMV">Minha Casa Minha Vida (Taxas Reduzidas)</option>
            </select>
          </div>

          {/* SISTEMA SAC vs PRICE COM AJUDA (?) */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Sistema de Amortização (SAC vs Price)
              <BotaoAjudaCampo
                id="sac_price"
                topicoAtivo={topicoAjudaAtivo}
                setTopicoAtivo={setTopicoAjudaAtivo}
                titulo="Diferença Simples entre SAC e Tabela Price"
                explicacao="• SAC (Parcelas Decrescentes): Você abate o mesmo valor da dívida todo mês; por isso a 1ª parcela é mais alta e as seguintes vão caindo até o final, gerando menor custo total de juros. • Tabela Price (Parcelas Fixas): A prestação inicial é menor e permanece igual do início ao fim (salvo correção da TR), porém o saldo devedor cai mais devagar e você paga mais juros no total."
              />
            </label>
            <select
              value={sistema}
              onChange={(e) => setSistema(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            >
              <option value="SAC">SAC (Parcelas Decrescentes • Menos Juros)</option>
              <option value="PRICE">Tabela Price (Parcelas Fixas • Menor 1ª Parcela)</option>
            </select>
          </div>

          {/* IDADE DO COMPRADOR COM AJUDA (?) */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Idade do Comprador Mais Velho (Anos)
              <BotaoAjudaCampo
                id="idade_prazo"
                topicoAtivo={topicoAjudaAtivo}
                setTopicoAtivo={setTopicoAjudaAtivo}
                titulo="Impacto da Idade no Prazo Máximo"
                explicacao="Por regra do seguro habitacional obrigatório (MIP), a soma da idade do comprador mais velho + o prazo do financiamento não pode ultrapassar 80 anos e 6 meses. Exemplo: se você tem 55 anos, o banco financiará em no máximo 25 anos (300 meses)."
              />
            </label>
            <input
              type="number"
              min="18"
              max="80"
              value={idadeComprador}
              onChange={(e) => setIdadeComprador(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            />
          </div>

          {/* PRAZO EM ANOS COM AJUDA (?) */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Prazo Desejado (Anos — Máx. p/ sua idade: {prazoMaximoPorIdade} anos)
              <BotaoAjudaCampo
                id="prazo_bancos"
                topicoAtivo={topicoAjudaAtivo}
                setTopicoAtivo={setTopicoAjudaAtivo}
                titulo="Prazo Máximo dos Bancos (Até 35 Anos)"
                explicacao="O teto legal dos bancos é de até 35 anos (420 meses), mas sempre limitado pela regra dos 80 anos e 6 meses de idade final do comprador."
              />
            </label>
            <input
              type="number"
              min="1"
              max="35"
              value={prazoAnos}
              onChange={(e) => setPrazoAnos(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            />
          </div>

          {/* TAXA DE JUROS */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Taxa de Juros Anual Estimada (% a.a.)
            </label>
            <input
              type="number"
              step="0.1"
              value={jurosAnual}
              onChange={(e) => setJurosAnual(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            />
          </div>

          {/* BAIRRO */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Bairro / Região de Interesse
            </label>
            <input
              type="text"
              placeholder="Ex: Centro, Jardins, Zona Sul..."
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            />
          </div>
        </div>

        {/* LEMBRETE VISUAL SOBRE A IDADE DO COMPRADOR E REGRA DE PRAZOS DOS BANCOS */}
        <div className="rounded-2xl border border-[#10b981]/30 bg-[#020408] p-4 flex items-start gap-3">
          <Calendar size={18} className="text-[#10b981] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-black uppercase tracking-wider text-[#10b981]">
              Regra Bancária de Idade & Prazo (Limite de 80 anos e 6 meses)
            </p>
            <p className="text-slate-300 mt-0.5">
              Para a idade informada de <strong className="text-white">{idadeNum} anos</strong>, o prazo máximo permitido pelas instituições financeiras é de{' '}
              <strong className="text-[#10b981]">{prazoMaximoPorIdade} anos ({prazoMaximoPorIdade * 12} meses)</strong>.
              {prazoExcedeIdade && (
                <span className="block mt-1 text-amber-400 font-bold">
                  ⚠️ O prazo digitado ({prazoSolicitado} anos) ultrapassa o teto para a sua idade e será ajustado automaticamente para {prazoMaximoPorIdade} anos no cálculo.
                </span>
              )}
            </p>
          </div>
        </div>

        <BlocoQualificacaoLead
          nome={nome}
          setNome={setNome}
          telefone={telefone}
          setTelefone={setTelefone}
          erroQualificacao={erroQualificacao}
          tituloContextual="a Simulação de Financiamento"
        />

        <button
          onClick={simular}
          disabled={loading || enviandoLead}
          className="w-full py-4 rounded-2xl bg-[#10b981] text-[#020408] font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading || enviandoLead ? '⏳ Calculando e Qualificando...' : '🚀 Concluir Simulação e Ver Relatório Completo'}
        </button>
      </div>

      {resultado && (
        <div className="mt-8 rounded-3xl border border-[#10b981]/40 bg-slate-950 p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#10b981]">
                Simulação Preliminar ({resultado.modalidadeCredito}) • Prazo: {resultado.anosEfetivos} anos ({resultado.meses} meses)
              </span>
              <h3 className="text-xl font-black text-white">Resumo do Financiamento ({resultado.sistema})</h3>
            </div>
            <CheckCircle2 size={28} className="text-[#10b981]" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#020408] border border-slate-800 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">Valor Financiado</p>
              <p className="text-lg font-black text-white mt-1">{fmtBRL(resultado.financiado)}</p>
            </div>
            <div className="rounded-2xl bg-[#020408] border border-[#10b981]/40 p-4">
              <p className="text-[10px] font-bold uppercase text-[#10b981]">1ª Parcela</p>
              <p className="text-lg font-black text-[#10b981] mt-1">{fmtBRL(resultado.primeiraParcela)}</p>
            </div>
            <div className="rounded-2xl bg-[#020408] border border-slate-800 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">Última Parcela</p>
              <p className="text-lg font-black text-white mt-1">{fmtBRL(resultado.ultimaParcela)}</p>
            </div>
            <div className="rounded-2xl bg-[#020408] border border-slate-800 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">Renda Familiar Mín.</p>
              <p className="text-lg font-black text-emerald-400 mt-1">{fmtBRL(resultado.rendaMinima)}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#020408] border border-slate-800 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#10b981] mb-2 flex items-center gap-1.5">
              <Sparkles size={13} /> Parecer do Consultor de Crédito IA
            </p>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{resultado.analiseIA}</p>
          </div>
        </div>
      )}

      <DisclaimerJuridicoFinanciamento />
    </div>
  );
}

// ==========================================
// 2. GUIA DE DOCUMENTAÇÃO IMOBILIÁRIA
// ==========================================
const GUIAS_DOCUMENTACAO = {
  compra_venda: {
    titulo: 'Compra e Venda de Imóvel (À Vista ou Financiado)',
    custos: 'ITBI (2% a 3% do valor venal/transação) + Escritura Pública + Registro no Cartório de Imóveis.',
    itens: [
      'Matrícula Atualizada do Imóvel com Certidão de Ônus Reais (validade 30 dias)',
      'Certidão Negativa de Débitos de IPTU (Prefeitura) e Condomínio',
      'RG, CPF, Comprovante de Residência e Certidão de Estado Civil (Comprador e Vendedor)',
      'Certidões Negativas Cíveis, Trabalhistas e Federais dos Vendedores',
      'Contrato Particular de Promessa de Compra e Venda assinado',
    ],
  },
  financiamento_fgts: {
    titulo: 'Financiamento Bancário & Uso de FGTS',
    custos: 'Taxa de Avaliação de Engenharia do Banco + Seguro MIP/DFI embutido nas parcelas.',
    itens: [
      'Comprovantes de Renda dos últimos 3 meses (Holerites, Extratos ou DECORE)',
      'Declaração Completa de Imposto de Renda (IRPF) com Recibo de Entrega',
      'Extrato Atualizado do FGTS e Carteira de Trabalho (para uso do FGTS)',
      'Laudo de Vistoria de Engenharia do Banco financiador',
      'Declaração de 1º imóvel (caso utilize benefício de redução de emolumentos)',
    ],
  },
  locacao: {
    titulo: 'Locação Residencial ou Comercial',
    custos: 'Garantia locatícia (Caução até 3 aluguéis, Seguro-Fiança ou Fiador com imóvel quitado).',
    itens: [
      'Documento de Identidade (RG/CNH), CPF e Comprovante de Renda (> 3x o valor do aluguel)',
      'Certidão de Nada Consta (SPC/Serasa) e referências comerciais',
      'Laudo de Vistoria de Entrada assinado pelas partes com registo fotográfico',
      'Contrato de Locação nos termos da Lei do Inquilinato (Lei 8.245/91)',
      'Comprovante de transferência de titularidade de Energia e Água/Saneamento',
    ],
  },
};

function GuiaDocumentacaoImobi({ onBack, leadInicial, oficinaIdPortal }) {
  const { analyzeText, loading } = useGroq();
  const [modalidade, setModalidade] = useState('compra_venda');
  const [perfil, setPerfil] = useState('Comprador');
  const [duvidaExtra, setDuvidaExtra] = useState('');
  const [nome, setNome] = useState(leadInicial?.nome || '');
  const [telefone, setTelefone] = useState(leadInicial?.telefone || '');
  const [erroQualificacao, setErroQualificacao] = useState('');
  const [relatorioLiberado, setRelatorioLiberado] = useState(false);
  const [orientacaoIA, setOrientacaoIA] = useState('');

  const desbloquearGuia = async () => {
    const telDigitos = String(telefone || '').replace(/\D/g, '');
    if (!nome.trim() || telDigitos.length < 8) {
      setErroQualificacao('Preencha o seu Nome e WhatsApp/Telemóvel para desbloquear o checklist detalhado de documentação.');
      return;
    }
    setErroQualificacao('');

    const guia = GUIAS_DOCUMENTACAO[modalidade] || GUIAS_DOCUMENTACAO.compra_venda;

    await registrarLeadNoCRM({
      nome,
      telefone,
      interesse: `Documentação (${perfil})`,
      bairro: guia.titulo,
      orcamento: 0,
      detalhes: `Consulta de Guia de Documentação: ${guia.titulo} • Perfil: ${perfil}. ${duvidaExtra ? `Dúvida: ${duvidaExtra}` : ''}`,
      oficinaIdPreferencial: oficinaIdPortal,
    });

    if (duvidaExtra.trim() && verificarLimiteIA()) {
      try {
        const prompt = `Atue como especialista jurídico imobiliário. O cliente ${nome} (${perfil}) consulta sobre "${guia.titulo}" e perguntou: "${duvidaExtra}". Responda de forma clara e objetiva em até 5 linhas, sem asteriscos.`;
        const resp = await analyzeText(prompt);
        if (resp) setOrientacaoIA(resp.replace(/\*\*/g, '').trim());
      } catch (e) {
        console.warn(e);
      }
    } else {
      setOrientacaoIA('');
    }

    setRelatorioLiberado(true);
  };

  const guiaAtual = GUIAS_DOCUMENTACAO[modalidade] || GUIAS_DOCUMENTACAO.compra_venda;

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 px-4 mt-8">
      <BotaoVoltar onBack={onBack} />
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 mb-2">
          <FileCheck2 size={12} /> Segurança Jurídica Imobiliária
        </span>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">
          Guia de <span className="text-[#10b981]">Documentação</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Consulte a lista completa de certidões, prazos e taxas de cartório para compra, venda, financiamento ou locação.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Tipo de Operação Imobiliária
            </label>
            <select
              value={modalidade}
              onChange={(e) => {
                setModalidade(e.target.value);
                setRelatorioLiberado(false);
              }}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            >
              <option value="compra_venda">Compra e Venda de Imóvel</option>
              <option value="financiamento_fgts">Financiamento Bancário / Uso de FGTS</option>
              <option value="locacao">Locação Residencial ou Comercial</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Seu Perfil na Transação
            </label>
            <select
              value={perfil}
              onChange={(e) => setPerfil(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            >
              <option value="Comprador">Comprador</option>
              <option value="Vendedor / Proprietário">Vendedor / Proprietário</option>
              <option value="Inquilino / Locatário">Inquilino / Locatário</option>
              <option value="Investidor">Investidor</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
            Tem alguma dúvida específica sobre documentação, ITBI ou escritura? (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ex: Imóvel com inventário pode ser financiado?"
            value={duvidaExtra}
            onChange={(e) => setDuvidaExtra(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white text-sm outline-none focus:border-[#10b981]"
          />
        </div>

        <BlocoQualificacaoLead
          nome={nome}
          setNome={setNome}
          telefone={telefone}
          setTelefone={setTelefone}
          erroQualificacao={erroQualificacao}
          tituloContextual="o Guia Completo de Documentação"
        />

        <button
          onClick={desbloquearGuia}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-[#10b981] text-[#020408] font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all cursor-pointer"
        >
          {loading ? '⏳ Gerando Relatório Documental...' : '📋 Ver Checklist Detalhado de Documentação'}
        </button>
      </div>

      {relatorioLiberado && (
        <div className="mt-8 rounded-3xl border border-[#10b981]/40 bg-slate-950 p-6 md:p-8 space-y-5 shadow-2xl">
          <h3 className="text-xl font-black text-white">{guiaAtual.titulo}</h3>
          <div className="rounded-2xl bg-[#020408] border border-slate-800 p-4 text-xs text-slate-300">
            <strong className="text-[#10b981] uppercase">Taxas e Custos Previstos:</strong> {guiaAtual.custos}
          </div>
          <div className="space-y-2.5">
            {(guiaAtual.itens || [])?.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl bg-[#020408] border border-slate-800 p-3.5 text-sm text-slate-200"
              >
                <CheckCircle2 size={17} className="text-[#10b981] shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          {orientacaoIA && (
            <div className="rounded-2xl bg-[#020408] border border-[#10b981]/30 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#10b981] mb-2">
                ✨ Orientação da IA para a sua dúvida
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">{orientacaoIA}</p>
            </div>
          )}
        </div>
      )}

      <DisclaimerIA />
    </div>
  );
}

// ==========================================
// 3. STATUS DE VISTORIA IMOBILIÁRIA
// ==========================================
function ConsultaStatusVistoria({ onBack, leadInicial, codigoInicial, oficinaIdPortal }) {
  const [codigoBusca, setCodigoBusca] = useState(codigoInicial || '');
  const [tipoVistoria, setTipoVistoria] = useState('Vistoria de Entrada');
  const [nome, setNome] = useState(leadInicial?.nome || '');
  const [telefone, setTelefone] = useState(leadInicial?.telefone || '');
  const [erroQualificacao, setErroQualificacao] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultadoVistoria, setResultadoVistoria] = useState(null);

  const consultarVistoria = async () => {
    const telDigitos = String(telefone || '').replace(/\D/g, '');
    if (!nome.trim() || telDigitos.length < 8) {
      setErroQualificacao('Informe o seu Nome e WhatsApp/Telemóvel para visualizar o Relatório de Status de Vistoria.');
      return;
    }
    if (!codigoBusca.trim()) {
      alert('Digite o Código do Imóvel, Endereço ou CPF/WhatsApp vinculado à vistoria.');
      return;
    }
    setErroQualificacao('');
    setBuscando(true);

    await registrarLeadNoCRM({
      nome,
      telefone,
      interesse: `Status de Vistoria (${tipoVistoria})`,
      bairro: codigoBusca.trim(),
      orcamento: 0,
      detalhes: `Consulta pública de ${tipoVistoria} para a referência: ${codigoBusca.trim()}`,
      oficinaIdPreferencial: oficinaIdPortal,
    });

    let encontrada = null;
    try {
      const snap = await getDocs(query(collectionGroup(db, 'vistorias'), where('publico', '==', true), limit(30)));
      const termo = codigoBusca.trim().toLowerCase();
      snap.forEach((docSnap) => {
        const d = docSnap.data() || {};
        const textoAlvo = `${d.imovel || ''} ${d.proprietario || ''} ${d.inquilino || ''} ${docSnap.id}`.toLowerCase();
        if (!encontrada && textoAlvo.includes(termo)) {
          encontrada = { id: docSnap.id, ...d };
        }
      });
    } catch (e) {
      console.warn('Busca direta de vistoria:', e);
    }

    if (encontrada) {
      setResultadoVistoria({
        encontrada: true,
        imovel: encontrada.imovel || codigoBusca.toUpperCase(),
        tipo: encontrada.tipo || tipoVistoria,
        data: encontrada.data || new Date().toLocaleDateString('pt-BR'),
        totalFotos: encontrada.totalFotos || (encontrada.divisoes || []).length * 3,
        status: 'Laudo Fotográfico Concluído e Validado',
        laudo:
          encontrada.laudo ||
          'Vistoria registada por divisão (Sala, Cozinha, Quartos, W.C. e Exterior) com fotos anexadas e conferência de medidores e chaves.',
        divisoes: Array.isArray(encontrada.divisoes) ? encontrada.divisoes : [],
      });
    } else {
      setResultadoVistoria({
        encontrada: false,
        imovel: codigoBusca.toUpperCase(),
        tipo: tipoVistoria,
        data: new Date().toLocaleDateString('pt-BR'),
        totalFotos: 0,
        status: 'Solicitação de Laudo Registada — Em Conferência pelo Corretor',
        laudo:
          `Recebemos a sua consulta referente a "${codigoBusca.toUpperCase()}" (${tipoVistoria}). ` +
          `O corretor responsável já recebeu a sua identificação no CRM e enviará o link do Laudo Fotográfico com IA diretamente para o seu WhatsApp (${telefone}).`,
        divisoes: [
          { nome: 'Sala & Estar', estado: 'Em conferência' },
          { nome: 'Cozinha & Área Técnica', estado: 'Em conferência' },
          { nome: 'Quartos / Suítes', estado: 'Em conferência' },
          { nome: 'W.C. & Instalações Hidráulicas', estado: 'Em conferência' },
          { nome: 'Exterior / Entrega de Chaves', estado: 'Em conferência' },
        ],
      });
    }

    setBuscando(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 px-4 mt-8">
      <BotaoVoltar onBack={onBack} />
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 mb-2">
          <ClipboardCheck size={12} /> Laudo Fotográfico & Chaves
        </span>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">
          Status de <span className="text-[#10b981]">Vistoria</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Acompanhe o andamento da vistoria de entrada, saída ou entrega de chaves do seu imóvel.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Código do Imóvel, Endereço ou CPF *
            </label>
            <input
              type="text"
              placeholder="Ex: IMOB-204, Apto 302 ou CPF"
              value={codigoBusca}
              onChange={(e) => setCodigoBusca(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Modalidade da Vistoria
            </label>
            <select
              value={tipoVistoria}
              onChange={(e) => setTipoVistoria(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            >
              <option value="Vistoria de Entrada">Vistoria de Entrada</option>
              <option value="Vistoria de Saída">Vistoria de Saída</option>
              <option value="Entrega de Chaves">Entrega de Chaves</option>
              <option value="Vistoria de Captação">Vistoria de Captação</option>
            </select>
          </div>
        </div>

        <BlocoQualificacaoLead
          nome={nome}
          setNome={setNome}
          telefone={telefone}
          setTelefone={setTelefone}
          erroQualificacao={erroQualificacao}
          tituloContextual="o Relatório de Status de Vistoria"
        />

        <button
          onClick={consultarVistoria}
          disabled={buscando}
          className="w-full py-4 rounded-2xl bg-[#10b981] text-[#020408] font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all cursor-pointer"
        >
          {buscando ? '⏳ Consultando Base de Vistorias...' : '🔍 Consultar Status e Ver Relatório'}
        </button>
      </div>

      {resultadoVistoria && (
        <div className="mt-8 rounded-3xl border border-[#10b981]/40 bg-slate-950 p-6 md:p-8 space-y-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#10b981]">
                {resultadoVistoria.status}
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">{resultadoVistoria.imovel}</h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#10b981]/15 text-[#10b981] text-xs font-black">
              {resultadoVistoria.data}
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{resultadoVistoria.laudo}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(resultadoVistoria.divisoes || [])?.map((div, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-[#020408] border border-slate-800 px-4 py-3 text-xs"
              >
                <span className="font-bold text-white">{div.nome}</span>
                <span className="font-black uppercase text-[#10b981]">{div.estado || 'Verificado'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <DisclaimerIA />
    </div>
  );
}

// ==========================================
// 4. CALCULADORA DE RENTABILIDADE (ROI IMOBILIÁRIO)
// ==========================================
function CalculadoraRentabilidadeROI({ onBack, leadInicial, oficinaIdPortal }) {
  const [valorCompra, setValorCompra] = useState('450000');
  const [aluguelMensal, setAluguelMensal] = useState('3200');
  const [despesasMensais, setDespesasMensais] = useState('350');
  const [valorizacaoAnual, setValorizacaoAnual] = useState('6');
  const [nome, setNome] = useState(leadInicial?.nome || '');
  const [telefone, setTelefone] = useState(leadInicial?.telefone || '');
  const [erroQualificacao, setErroQualificacao] = useState('');
  const [relatorioROI, setRelatorioROI] = useState(null);

  const calcularROI = async () => {
    const telDigitos = String(telefone || '').replace(/\D/g, '');
    if (!nome.trim() || telDigitos.length < 8) {
      setErroQualificacao('Preencha o seu Nome e WhatsApp/Telemóvel para desbloquear o Relatório Completo de Rentabilidade (ROI).');
      return;
    }
    setErroQualificacao('');

    const vCompra = limparNumero(valorCompra);
    const vAluguel = limparNumero(aluguelMensal);
    const vDespesas = limparNumero(despesasMensais);
    const taxaVal = limparNumero(valorizacaoAnual) || 6;

    if (vCompra <= 0 || vAluguel <= 0) {
      alert('Preencha um valor de aquisição e aluguel mensal válidos.');
      return;
    }

    const receitaLiquidaMensal = Math.max(0, vAluguel - vDespesas);
    const receitaLiquidaAnual = receitaLiquidaMensal * 12;
    const yieldMensal = (receitaLiquidaMensal / vCompra) * 100;
    const yieldAnual = (receitaLiquidaAnual / vCompra) * 100;
    const retornoTotalAnual = yieldAnual + taxaVal;
    const paybackAnos = receitaLiquidaAnual > 0 ? vCompra / receitaLiquidaAnual : 0;
    const patrimonio5Anos = vCompra * Math.pow(1 + taxaVal / 100, 5) + receitaLiquidaAnual * 5;

    await registrarLeadNoCRM({
      nome,
      telefone,
      interesse: 'Investimento Imobiliário (ROI)',
      bairro: 'Calculadora de Rentabilidade',
      orcamento: vCompra,
      detalhes: `ROI calculado: Imóvel ${fmtBRL(vCompra)}, Aluguel líquido ${fmtBRL(receitaLiquidaMensal)}/mês, Yield Anual ${yieldAnual.toFixed(2)}% a.a., Retorno Total c/ valorização ${retornoTotalAnual.toFixed(2)}% a.a.`,
      oficinaIdPreferencial: oficinaIdPortal,
    });

    setRelatorioROI({
      vCompra,
      receitaLiquidaMensal,
      receitaLiquidaAnual,
      yieldMensal,
      yieldAnual,
      retornoTotalAnual,
      paybackAnos,
      patrimonio5Anos,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 px-4 mt-8">
      <BotaoVoltar onBack={onBack} />
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 mb-2">
          <TrendingUp size={12} /> Inteligência para Investidores
        </span>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight">
          Calculadora de <span className="text-[#10b981]">Rentabilidade (ROI)</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Descubra o Yield de locação, retorno anual líquido, payback e projeção patrimonial de 5 anos.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Valor de Compra do Imóvel (R$)
            </label>
            <input
              type="number"
              value={valorCompra}
              onChange={(e) => setValorCompra(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Aluguel Mensal Estimado (R$)
            </label>
            <input
              type="number"
              value={aluguelMensal}
              onChange={(e) => setAluguelMensal(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Custos Mensais / Vacância / Adm. (R$)
            </label>
            <input
              type="number"
              value={despesasMensais}
              onChange={(e) => setDespesasMensais(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
              Valorização Anual Estimada (% a.a.)
            </label>
            <input
              type="number"
              step="0.5"
              value={valorizacaoAnual}
              onChange={(e) => setValorizacaoAnual(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold outline-none focus:border-[#10b981]"
            />
          </div>
        </div>

        <BlocoQualificacaoLead
          nome={nome}
          setNome={setNome}
          telefone={telefone}
          setTelefone={setTelefone}
          erroQualificacao={erroQualificacao}
          tituloContextual="o Relatório de Rentabilidade (ROI)"
        />

        <button
          onClick={calcularROI}
          className="w-full py-4 rounded-2xl bg-[#10b981] text-[#020408] font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all cursor-pointer"
        >
          📈 Calcular Rentabilidade e Ver Relatório Completo
        </button>
      </div>

      {relatorioROI && (
        <div className="mt-8 rounded-3xl border border-[#10b981]/40 bg-slate-950 p-6 md:p-8 space-y-6 shadow-2xl">
          <h3 className="text-xl font-black text-white">Relatório de Viabilidade e Retorno Imobiliário</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#020408] border border-[#10b981]/40 p-4">
              <p className="text-[10px] font-bold uppercase text-[#10b981]">Yield Mensal Líquido</p>
              <p className="text-xl font-black text-[#10b981] mt-1">{relatorioROI.yieldMensal.toFixed(2)}% a.m.</p>
            </div>
            <div className="rounded-2xl bg-[#020408] border border-slate-800 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">Cap Rate Anual</p>
              <p className="text-xl font-black text-white mt-1">{relatorioROI.yieldAnual.toFixed(2)}% a.a.</p>
            </div>
            <div className="rounded-2xl bg-[#020408] border border-slate-800 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">ROI Total + Valorização</p>
              <p className="text-xl font-black text-emerald-400 mt-1">{relatorioROI.retornoTotalAnual.toFixed(2)}% a.a.</p>
            </div>
            <div className="rounded-2xl bg-[#020408] border border-slate-800 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">Payback Estimado</p>
              <p className="text-xl font-black text-white mt-1">{relatorioROI.paybackAnos.toFixed(1)} anos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#020408] border border-slate-800 p-4">
              <p className="text-xs text-slate-400">Renda Passiva Anual Líquida</p>
              <p className="text-2xl font-black text-white mt-1">{fmtBRL(relatorioROI.receitaLiquidaAnual)}</p>
            </div>
            <div className="rounded-2xl bg-[#020408] border border-slate-800 p-4">
              <p className="text-xs text-slate-400">Património + Rendas Acumuladas em 5 Anos</p>
              <p className="text-2xl font-black text-[#10b981] mt-1">{fmtBRL(relatorioROI.patrimonio5Anos)}</p>
            </div>
          </div>
        </div>
      )}

      <DisclaimerIA />
    </div>
  );
}

// ==========================================
// 📅 AGENDAMENTO DE VISITA AO IMÓVEL
// ==========================================
function AgendamentoVisitaImovel({ oficinaId, codigoImovel, leadInicial, onBack }) {
  const [nome, setNome] = useState(leadInicial?.nome || '');
  const [telefone, setTelefone] = useState(leadInicial?.telefone || '');
  const [data, setData] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const enviarAgendamento = async (e) => {
    e.preventDefault();
    const telDigitos = String(telefone || '').replace(/\D/g, '');
    if (!nome.trim() || telDigitos.length < 8 || !data) {
      alert('Preencha obrigatoriamente o seu Nome, WhatsApp/Telemóvel e a Data pretendida.');
      return;
    }

    setLoading(true);
    try {
      await registrarLeadNoCRM({
        nome,
        telefone,
        interesse: 'Visita Agendada pelo Portal',
        bairro: codigoImovel || 'Imóvel em Carteira',
        orcamento: 0,
        detalhes: `Solicitação de visita para o imóvel/código ${codigoImovel} na data ${data.split('-').reverse().join('/')}.`,
        oficinaIdPreferencial: oficinaId,
      });
      setSucesso(true);
    } catch (error) {
      console.error(error);
      alert('Erro ao solicitar agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sucesso) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-16 px-6">
        <div className="w-20 h-20 bg-[#10b981]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#10b981]/40">
          <CheckCircle2 size={38} className="text-[#10b981]" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase mb-3">Visita Solicitada!</h2>
        <p className="text-slate-400 text-sm mb-8">
          Registámos o seu pedido de visita para o dia <strong className="text-white">{data.split('-').reverse().join('/')}</strong>. O corretor responsável já recebeu os seus dados no CRM.
        </p>
        <button
          onClick={onBack}
          className="bg-[#10b981] text-[#020408] px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest cursor-pointer"
        >
          Voltar ao Painel do Imóvel
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto pt-4 pb-20 px-4">
      <BotaoVoltar onBack={onBack} />
      <h2 className="text-2xl font-black text-white mb-2 uppercase">
        Agendar <span className="text-[#10b981]">Visita ao Imóvel</span>
      </h2>
      <p className="text-slate-400 text-xs mb-6">Atendimento rápido e acompanhado por corretor credenciado</p>

      <form onSubmit={enviarAgendamento} className="bg-slate-950 border border-slate-800 p-6 rounded-3xl space-y-4 text-left">
        <div>
          <label htmlFor="visita-nome" className="text-[10px] font-black uppercase text-[#10b981] tracking-widest mb-1.5 block">
            1. Seu Nome Completo *
          </label>
          <input
            id="visita-nome"
            name="nome"
            type="text"
            autoComplete="name"
            placeholder="Digite seu nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full p-3.5 bg-[#020408] border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-[#10b981]"
            required
          />
        </div>
        <div>
          <label htmlFor="visita-telefone" className="text-[10px] font-black uppercase text-[#10b981] tracking-widest mb-1.5 block">
            2. Seu WhatsApp / Telemóvel *
          </label>
          <input
            id="visita-telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(34) 99999-9999"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full p-3.5 bg-[#020408] border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-[#10b981]"
            required
          />
        </div>
        <div>
          <label htmlFor="visita-imovel" className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">
            3. Referência do Imóvel / Cliente
          </label>
          <input
            id="visita-imovel"
            name="imovel"
            type="text"
            autoComplete="off"
            value={codigoImovel}
            disabled
            className="w-full p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 font-bold"
          />
        </div>
        <div>
          <label htmlFor="visita-data" className="text-[10px] font-black uppercase text-[#10b981] tracking-widest mb-1.5 block">
            4. Data Pretendida *
          </label>
          <input
            id="visita-data"
            name="data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-3.5 bg-[#020408] border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-[#10b981]"
            style={{ colorScheme: 'dark' }}
            required
          />
        </div>
        {/* LGPD — finalidade, coleta mínima e canal de exclusão (D-22.05) */}
        <p className="text-[11px] leading-relaxed text-slate-500">
          Usamos seu nome e WhatsApp apenas para confirmar esta visita com o corretor responsável e registrar o
          pedido no CRM da imobiliária. A data pretendida serve só para a agenda. Para correção ou exclusão,
          use o botão <strong className="text-slate-300">"Solicitar exclusão dos meus dados"</strong> no rodapé
          ou leia a{' '}
          <Link to="/privacidade" className="text-[#10b981] underline">
            Política de Privacidade
          </Link>
          .
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#10b981] rounded-2xl font-black uppercase text-xs text-[#020408] tracking-widest cursor-pointer"
        >
          {loading ? 'Enviando...' : '📅 Confirmar Solicitação de Visita'}
        </button>
      </form>
    </div>
  );
}

// ==========================================
// FERRAMENTAS PÚBLICAS DISPONÍVEIS
// ==========================================
const FERRAMENTAS_IMOBI = [
  {
    id: 'financiamento',
    titulo: 'Simulador de Financiamento com IA',
    subtitulo: 'Parcelas SAC/Price, FGTS e análise de crédito',
    icon: Calculator,
  },
  {
    id: 'documentacao',
    titulo: 'Guia de Documentação',
    subtitulo: 'Certidões, ITBI, escritura e locação segura',
    icon: FileCheck2,
  },
  {
    id: 'vistoria',
    titulo: 'Status de Vistoria',
    subtitulo: 'Laudo fotográfico de entrada, saída e chaves',
    icon: ClipboardCheck,
  },
  {
    id: 'roi',
    titulo: 'Calculadora de Rentabilidade (ROI)',
    subtitulo: 'Yield de aluguel, payback e ganho patrimonial',
    icon: TrendingUp,
  },
];

const IMOVEIS_VITRINE_DEMONSTRACAO = [
  {
    id: 'vit_demo_1',
    codigo: 'IMB-1042',
    titulo: 'Residencial Parque das Águas — 2 Quartos c/ Varanda',
    tipo: 'Apartamento',
    finalidade: 'Venda',
    padraoImovel: 'Minha Casa, Minha Vida / Interesse Social',
    status: 'Ativo',
    bairro: 'Bosque / Zona Sul',
    quartos: '2',
    valor: 235000,
    fotoCapa: FOTOS_EXEMPLO.apartamento,
    fotos: [
      FOTOS_EXEMPLO.apartamento,
      FOTOS_EXEMPLO.interior,
    ],
  },
  {
    id: 'vit_demo_2',
    codigo: 'IMB-2088',
    titulo: 'Lote em Condomínio Fechado Reserva Imperial',
    tipo: 'Loteamento / Condomínio',
    finalidade: 'Venda',
    padraoImovel: 'Médio Padrão',
    status: 'Ativo',
    bairro: 'Jardins / Condomínios',
    valor: 390000,
    quadra: 'Qd. 08',
    lote: 'Lote 15',
    metragemTerreno: '420',
    fotoCapa: FOTOS_EXEMPLO.casa,
    fotos: [
      FOTOS_EXEMPLO.casa,
    ],
  },
  {
    id: 'vit_demo_3',
    codigo: 'IMB-9015',
    titulo: 'Fazenda Santa Helena — Produtiva e Georreferenciada',
    tipo: 'Fazenda / Imóvel Rural',
    finalidade: 'Venda',
    padraoImovel: 'Alto Padrão / Luxo',
    status: 'Ativo',
    bairro: 'Zona Rural / Rodovia BR',
    valor: 4850000,
    hectares: '185',
    aptidaoRural: 'Dupla Aptidão (Lavoura e Pecuária)',
    benfeitorias: 'Sede completa, curral, 2 represas, energia trifásica e CAR/INCRA OK',
    fotoCapa: FOTOS_EXEMPLO.fazenda,
    fotos: [
      FOTOS_EXEMPLO.fazenda,
    ],
  },
];

const obterEstiloTagPadraoVitrine = (padrao) => {
  const p = String(padrao || '').toLowerCase();
  if (p.includes('minha casa') || p.includes('social')) {
    return {
      label: 'Minha Casa, Minha Vida / Social',
      classes: 'bg-sky-500/20 text-sky-300 border border-sky-400/50',
    };
  }
  if (p.includes('alto') || p.includes('luxo')) {
    return {
      label: 'Alto Padrão / Luxo',
      classes: 'bg-amber-500/20 text-amber-300 border border-amber-400/50',
    };
  }
  return {
    label: padrao || 'Médio Padrão',
    classes: 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/50',
  };
};

// ==========================================
// COMPONENTE PRINCIPAL: PORTAL DO CLIENTE IMOBILIÁRIO & VITRINE DIGITAL
// ==========================================
export default function PortalCliente() {
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [nomePortal, setNomePortal] = useState('');
  const [whatsappPortal, setWhatsappPortal] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [registrosImovel, setRegistrosImovel] = useState(null);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('home');
  const [oficinaIdPortal, setOficinaIdPortal] = useState(null);
  const [imoveisVitrine, setImoveisVitrine] = useState([]);
  const [filtroVitrine, setFiltroVitrine] = useState('Todos');
  const [fotoAtivaPorCard, setFotoAtivaPorCard] = useState({});
  // Vitrine sem imóvel real publicado cai nos exemplos de tela: a página avisa
  // e cada cartão ganha selo "Exemplo" (D-22.04 — nada de anúncio fictício).
  const [vitrineEmDemonstracao, setVitrineEmDemonstracao] = useState(false);
  // Fluxo explícito de exclusão de dados (LGPD) acessível no portal público.
  const [exclusaoAberta, setExclusaoAberta] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const salvo = JSON.parse(localStorage.getItem('lead_qualificado_imobi') || 'null');
      if (salvo?.nome) setNomePortal(salvo.nome);
      if (salvo?.telefone) setWhatsappPortal(salvo.telefone);
    } catch (e) {
      console.warn(e);
    }

    // Carrega os imóveis com status "Ativo" / "Disponível" da Captação para a Vitrine Pública
    const carregarVitrinePublica = async () => {
      let listaLocal = [];
      try {
        const cache = JSON.parse(localStorage.getItem('vitrine_imoveis_ativos') || '[]');
        if (Array.isArray(cache)) listaLocal = cache;
      } catch (e) {
        console.warn(e);
      }

      const listaFirestore = [];
      try {
        const snap = await getDocs(query(collectionGroup(db, 'imoveis_imobi'), where('publico', '==', true), limit(40)));
        snap.forEach((docSnap) => {
          const d = docSnap.data() || {};
          if (!d.status || d.status === 'Ativo' || d.status === 'Disponível') {
            listaFirestore.push({ id: docSnap.id, ...d });
          }
        });
      } catch (e) {
        console.warn('Aviso ao carregar vitrine do Firestore:', e);
      }

      const combinados = [...listaFirestore, ...listaLocal];
      const unicos = [];
      const chaves = new Set();
      combinados.forEach((item) => {
        const k = item?.codigo || item?.id || item?.titulo;
        if (!k || chaves.has(k)) return;
        chaves.add(k);
        unicos.push(item);
      });

      setImoveisVitrine(unicos.length > 0 ? unicos : IMOVEIS_VITRINE_DEMONSTRACAO);
      setVitrineEmDemonstracao(unicos.length === 0);
    };

    carregarVitrinePublica();
  }, []);

  const demonstrarInteresseImovel = async (imv) => {
    if (nomePortal.trim() && String(whatsappPortal || '').replace(/\D/g, '').length >= 8) {
      await registrarLeadNoCRM({
        nome: nomePortal,
        telefone: whatsappPortal,
        interesse: `${imv.finalidade || 'Compra'} — ${imv.titulo}`,
        bairro: imv.bairro || 'Vitrine Digital',
        orcamento: Number(imv.valor) || 0,
        detalhes: `Lead clicou em "Tenho Interesse" na Vitrine Digital para o imóvel ${imv.codigo || ''} (${imv.padraoImovel || 'Médio Padrão'}).`,
        oficinaIdPreferencial: oficinaIdPortal,
      });
    }

    const foneCorretor = String(imv?.whatsappCorretor || '5534991439845').replace(/\D/g, '');
    const msg =
      `Olá! Vi na Vitrine Digital da Imobiliária o imóvel *${imv.codigo || 'IMÓVEL'} - ${imv.titulo}* ` +
      `(${imv.padraoImovel || 'Disponível'}) em *${imv.bairro || 'destaque'}* pelo valor de *${fmtBRL(imv.valor)}* ` +
      `e tenho interesse em receber mais informações e agendar uma visita!`;

    const url = foneCorretor
      ? `https://wa.me/${foneCorretor}?text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const formatarDataBR = (valor) => {
    if (!valor) return '—';
    if (valor?.toDate) return valor.toDate().toLocaleDateString('pt-BR');
    const data = new Date(valor);
    return isNaN(data.getTime()) ? String(valor) : data.toLocaleDateString('pt-BR');
  };

  const handleEntrar = async () => {
    const idTrim = identificador.trim();
    const telDigitos = String(whatsappPortal || '').replace(/\D/g, '');
    if (!idTrim) {
      alert('Preencha o Código do Imóvel ou CPF/WhatsApp.');
      return;
    }
    if (!nomePortal.trim() || telDigitos.length < 8) {
      alert('Para consultar o relatório detalhado no portal, preencha obrigatoriamente o seu Nome e WhatsApp/Telemóvel.');
      return;
    }

    setCarregando(true);
    try {
      // Regista imediatamente o lead qualificado no CRM do corretor
      await registrarLeadNoCRM({
        nome: nomePortal,
        telefone: whatsappPortal,
        interesse: 'Acesso ao Portal do Cliente',
        bairro: idTrim.toUpperCase(),
        orcamento: 0,
        detalhes: `Cliente acedeu ao Portal consultando o Código/CPF/WhatsApp: ${idTrim.toUpperCase()}`,
        oficinaIdPreferencial: oficinaIdPortal,
      });

      const resultados = [];
      let idDaImobiliaria = null;
      const termo = idTrim.toLowerCase();
      const digitosBusca = idTrim.replace(/\D/g, '');

      // 1. Procura em vistorias
      try {
        const snapVist = await getDocs(query(collectionGroup(db, 'vistorias'), where('publico', '==', true), limit(40)));
        snapVist.forEach((docSnap) => {
          const d = docSnap.data() || {};
          const texto = `${d.imovel || ''} ${d.proprietario || ''} ${d.inquilino || ''} ${docSnap.id}`.toLowerCase();
          if (texto.includes(termo)) {
            resultados.push({
              id: docSnap.id,
              categoria: 'Laudo de Vistoria',
              titulo: d.imovel || idTrim.toUpperCase(),
              resumo: d.laudo || `Vistoria (${d.tipo || 'Entrada'}) registada com ${d.totalFotos || 0} foto(s).`,
              data: d.data || d.dataCriacao,
              valor: d.valor || null,
              divisoes: Array.isArray(d.divisoes) ? d.divisoes : [],
            });
            if (!idDaImobiliaria) idDaImobiliaria = docSnap.ref.parent.parent?.id;
          }
        });
      } catch (e) {
        console.warn(e);
      }

      // 2. Procura em imoveis_imobi
      try {
        const snapImov = await getDocs(query(collectionGroup(db, 'imoveis_imobi'), where('publico', '==', true), limit(40)));
        snapImov.forEach((docSnap) => {
          const d = docSnap.data() || {};
          const texto = `${d.titulo || ''} ${d.codigo || ''} ${d.bairro || ''} ${docSnap.id}`.toLowerCase();
          if (texto.includes(termo)) {
            resultados.push({
              id: docSnap.id,
              categoria: `Ficha do Imóvel • ${d.finalidade || 'Venda'}`,
              titulo: d.titulo || idTrim.toUpperCase(),
              resumo: `${d.tipo || 'Imóvel'} em ${d.bairro || 'localização privilegiada'} • ${d.quartos || 2} quarto(s) • Status: ${d.status || 'Disponível'}.`,
              data: d.criadoEm,
              valor: d.valor,
              divisoes: [],
            });
            if (!idDaImobiliaria) idDaImobiliaria = docSnap.ref.parent.parent?.id;
          }
        });
      } catch (e) {
        console.warn(e);
      }

      // 3. Caso ainda não haja documento específico com esse código, gera o dossiê de atendimento ativo para o cliente acompanhar
      if (resultados.length === 0) {
        resultados.push({
          id: `dossie_${Date.now()}`,
          categoria: 'Atendimento & Proposta Imobiliária',
          titulo: `Referência: ${idTrim.toUpperCase()}`,
          resumo:
            `Dossiê de atendimento vinculado a ${nomePortal} (${whatsappPortal}). ` +
            `Os seus dados foram encaminhados ao corretor responsável no CRM para envio de documentação, agendamento de visita e laudo de vistoria.`,
          data: new Date().toISOString(),
          valor: null,
          divisoes: [
            { nome: 'Qualificação de Cadastro', estado: 'Concluído' },
            { nome: 'Análise de Proposta / Financiamento', estado: 'Em andamento' },
            { nome: 'Vistoria Fotográfica com IA', estado: 'Disponível' },
          ],
        });
      }

      setOficinaIdPortal(idDaImobiliaria);
      setRegistrosImovel(resultados);
      setAbaAtiva('dashboard');
    } catch (e) {
      console.error(e);
      alert('Erro de ligação ao consultar o portal. Verifique a sua internet.');
    } finally {
      setCarregando(false);
    }
  };

  const compartilharDossieWhatsApp = (item) => {
    const alvo = item || registrosImovel?.[0];
    if (!alvo) return;
    const texto =
      `🏢 *EXPRESS IMOBI TECH — RELATÓRIO DO IMÓVEL*\n` +
      `*Referência:* ${alvo.titulo}\n` +
      `*Categoria:* ${alvo.categoria}\n` +
      `*Data:* ${formatarDataBR(alvo.data)}\n\n` +
      `*Resumo:* ${alvo.resumo}\n` +
      (alvo.valor ? `*Valor:* ${fmtBRL(alvo.valor)}\n` : '');
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const leadAtual = { nome: nomePortal, telefone: whatsappPortal };

  return (
    <div className="flex flex-col min-h-screen bg-[#020408] text-white font-sans overflow-x-hidden pt-14">
      {/* HEADER SECUNDÁRIO */}
      <header className="w-full px-6 md:px-10 py-4 flex justify-between items-center border-b border-slate-900 bg-[#020408]/90 backdrop-blur-md">
        <div
          onClick={() => {
            setRegistrosImovel(null);
            setItemSelecionado(null);
            setAbaAtiva('home');
          }}
          className="text-sm md:text-base font-black text-white tracking-wider uppercase cursor-pointer flex items-center gap-2"
        >
          <Building2 size={18} className="text-[#10b981]" />
          <span>
            Express <span className="text-[#10b981]">Imobi Tech</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/login-admin')}
          className="px-4 py-2 rounded-xl text-[10px] uppercase font-black tracking-widest bg-[#10b981] text-[#020408] hover:opacity-90 transition-all cursor-pointer"
        >
          🏢 Área do Corretor
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        {/* TELA 1: VITRINE DIGITAL DE IMÓVEIS ATIVOS, LOGIN DO PORTAL E FERRAMENTAS */}
        {!registrosImovel && abaAtiva === 'home' && (
          <div className="max-w-6xl mx-auto px-4 pt-8 pb-24 flex flex-col items-center text-center">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 bg-[#10b981]/10 border border-[#10b981]/30">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-[#10b981] text-[10px] font-black uppercase tracking-widest">
                  Vitrine Digital & Portal Imobiliário
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black mb-3 uppercase tracking-tight">
                Vitrine & Portal do <span className="text-[#10b981]">Cliente</span>
              </h1>
              <p className="text-slate-400 text-xs md:text-sm max-w-2xl mx-auto">
                Explore os imóveis ativos da imobiliária (Minha Casa Minha Vida, Médio e Alto Padrão, Lotes e Fazendas), simule o seu financiamento com IA ou consulte o dossiê do seu imóvel.
              </p>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                SEÇÃO 1: VITRINE PÚBLICA DE IMÓVEIS ATIVOS (ESTILO SITE IMOBILIÁRIO)
               ═══════════════════════════════════════════════════════════════════ */}
            <div className="w-full mb-14 text-left space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-4">
                <div>
                  <span className="text-[#10b981] text-[10px] font-black uppercase tracking-[0.2em] block">
                    🏡 Catálogo Oficial Ativo na Captação
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-white">
                    Vitrine Digital de Imóveis Disponíveis
                  </h2>
                </div>

                {/* Filtros da Vitrine Digital */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'Todos', label: 'Todos' },
                    { id: 'MCMV', label: 'Minha Casa, Minha Vida' },
                    { id: 'Medio', label: 'Médio Padrão' },
                    { id: 'Alto', label: 'Alto Padrão / Luxo' },
                    { id: 'LotesRurais', label: 'Lotes & Fazendas' },
                    { id: 'Locacao', label: 'Locação' },
                  ]?.map((f) => {
                    const ativo = filtroVitrine === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFiltroVitrine(f.id)}
                        aria-pressed={ativo}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer border ${
                          ativo
                            ? 'bg-[#10b981] text-[#020408] border-[#10b981]'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-[#10b981]'
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {vitrineEmDemonstracao && (
                <div
                  role="status"
                  className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200"
                >
                  <strong className="font-black uppercase tracking-wider">Vitrine em modo demonstração.</strong>{' '}
                  Nenhum imóvel real está publicado nesta vitrine ainda. Os cartões abaixo são exemplos de tela —
                  não são anúncios disponíveis e não devem ser tratados como oferta.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(imoveisVitrine || [])
                  .filter((imv) => {
                    if (filtroVitrine === 'Todos') return true;
                    if (filtroVitrine === 'MCMV') return /minha casa|social/i.test(imv?.padraoImovel || '');
                    if (filtroVitrine === 'Medio') return /m[eé]dio/i.test(imv?.padraoImovel || 'Médio Padrão');
                    if (filtroVitrine === 'Alto') return /alto|luxo/i.test(imv?.padraoImovel || '');
                    if (filtroVitrine === 'Locacao') return imv?.finalidade === 'Locação';
                    if (filtroVitrine === 'LotesRurais')
                      return /lote|terreno|fazenda|rural|ch[aá]cara|s[ií]tio/i.test(imv?.tipo || '');
                    return true;
                  })
                  ?.map((imv) => {
                    const tagPadrao = obterEstiloTagPadraoVitrine(imv?.padraoImovel);
                    const fotosArr = Array.isArray(imv?.fotos) && imv.fotos.length > 0
                      ? imv.fotos
                      : imv?.fotoCapa
                      ? [imv.fotoCapa]
                      : [FOTOS_EXEMPLO.apartamento];
                    const fotoAtual = fotoAtivaPorCard[imv.id] || imv?.fotoCapa || fotosArr[0];
                    const isLote = /lote|terreno/i.test(imv?.tipo || '');
                    const isRural = /fazenda|rural|ch[aá]cara|s[ií]tio/i.test(imv?.tipo || '');
                    const isLocacao = imv?.finalidade === 'Locação';
                    const ehExemplo =
                      vitrineEmDemonstracao ||
                      String(imv?.id || '').startsWith('vit_demo') ||
                      ehFotoExemplo(fotoAtual);

                    return (
                      <div
                        key={imv.id || imv.codigo}
                        className="rounded-3xl border border-slate-800 hover:border-[#10b981] bg-slate-950 overflow-hidden flex flex-col justify-between transition-all shadow-xl"
                      >
                        <div>
                          {/* Imagem de Capa + Seletor de Galeria */}
                          <div className="relative h-52 w-full bg-[#020408] overflow-hidden border-b border-slate-800">
                            <img
                              src={fotoAtual}
                              alt={ehExemplo ? `Imagem ilustrativa de exemplo — ${imv.titulo || 'imóvel'}` : imv.titulo}
                              className="w-full h-full object-cover transition-all duration-300"
                            />
                            {ehExemplo && (
                              <span className="absolute bottom-3 left-3 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-950">
                                Exemplo
                              </span>
                            )}
                            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase backdrop-blur-md bg-[#020408]/85 ${tagPadrao.classes}`}>
                                {tagPadrao.label}
                              </span>
                            </div>
                            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#10b981] text-[#020408] text-[10px] font-black uppercase">
                              {imv.finalidade || 'Venda'}
                            </span>

                            {/* Miniaturas da Galeria (se houver mais de 1 foto) */}
                            {fotosArr.length > 1 && (
                              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-center gap-1.5 bg-black/70 backdrop-blur-sm p-1.5 rounded-xl">
                                {(fotosArr || [])?.map((fUrl, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() =>
                                      setFotoAtivaPorCard((prev) => ({ ...prev, [imv.id]: fUrl }))
                                    }
                                    aria-label={`Ver foto ${idx + 1} de ${fotosArr.length}`}
                                    aria-pressed={fotoAtual === fUrl}
                                    className={`w-9 h-7 rounded-md overflow-hidden border-2 cursor-pointer ${
                                      fotoAtual === fUrl ? 'border-[#10b981]' : 'border-transparent opacity-70'
                                    }`}
                                  >
                                    <img src={fUrl} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Conteúdo Técnico do Imóvel */}
                          <div className="p-5 space-y-2.5">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                              <span>Cód: {imv.codigo || 'IMÓVEL'}</span>
                              <span>📍 {imv.bairro || 'Localização Privilegiada'}</span>
                            </div>

                            <h3 className="text-lg font-black text-white leading-snug">{imv.titulo}</h3>

                            <p className="text-xs text-slate-400">
                              {imv.tipo}
                              {!isLote && !isRural && imv.quartos ? ` • ${imv.quartos} quarto(s)` : ''}
                            </p>

                            {/* Detalhes Específicos de Loteamento / Fazenda / Locação */}
                            {isLote && (imv.quadra || imv.lote || imv.metragemTerreno) && (
                              <div className="bg-[#020408] border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300">
                                <span className="text-[#10b981] font-black block">📐 Loteamento / Condomínio:</span>
                                Quadra: <strong>{imv.quadra || '-'}</strong> • Lote: <strong>{imv.lote || '-'}</strong> •{' '}
                                <strong>{imv.metragemTerreno ? `${imv.metragemTerreno} m²` : '-'}</strong>
                              </div>
                            )}

                            {isRural && (imv.hectares || imv.aptidaoRural || imv.benfeitorias) && (
                              <div className="bg-[#020408] border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 space-y-0.5">
                                <span className="text-[#10b981] font-black block">
                                  🌾 Propriedade Rural ({imv.hectares ? `${imv.hectares} ha` : 'Área Rural'}):
                                </span>
                                <span className="block">Aptidão: <strong>{imv.aptidaoRural || 'Mista'}</strong></span>
                                {imv.benfeitorias && (
                                  <span className="block text-slate-400 truncate">{imv.benfeitorias}</span>
                                )}
                              </div>
                            )}

                            {isLocacao && (imv.modalidadeGarantia || imv.regrasLocacao) && (
                              <div className="bg-[#020408] border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300">
                                <span className="text-[#10b981] font-black block">🔑 Garantia Aceita:</span>
                                {imv.modalidadeGarantia || 'Seguro Fiança / Caução'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Preço + Botão "Tenho Interesse" Direto para WhatsApp */}
                        <div className="px-5 pb-5 pt-3 border-t border-slate-900 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 font-bold block">
                              {imv.finalidade === 'Locação' ? 'Aluguel Mensal' : 'Investimento'}
                            </span>
                            <span className="text-xl font-black text-[#10b981]">{fmtBRL(imv.valor)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => demonstrarInteresseImovel(imv)}
                            className="px-4 py-2.5 rounded-xl bg-[#10b981] text-[#020408] font-black text-xs uppercase tracking-wider hover:opacity-90 transition cursor-pointer shadow-lg shadow-[#10b981]/20"
                          >
                            💬 Tenho Interesse
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Card de Acesso ao Imóvel / Proposta */}
            <div className="w-full max-w-lg mb-12 rounded-3xl border border-[#10b981]/30 bg-slate-950/90 p-6 md:p-8 shadow-[0_0_60px_rgba(16,185,129,0.1)] text-left space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <Key size={16} className="text-[#10b981]" />
                <h2 className="text-xs font-black uppercase tracking-widest text-white">
                  Aceder ao Dossiê do Imóvel / Vistoria
                </h2>
              </div>

              <div>
                <label htmlFor="portal-consulta-id" className="text-[#10b981] text-[10px] font-black uppercase tracking-widest mb-1.5 block">
                  🏢 Código do Imóvel (ou CPF/WhatsApp do cadastro) *
                </label>
                <input
                  id="portal-consulta-id"
                  name="identificador"
                  type="text"
                  autoComplete="off"
                  placeholder="Ex: IMOB-102"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold text-center outline-none focus:border-[#10b981]"
                />
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-500">
                  Prefira o código do imóvel. O CPF só é necessário se a imobiliária cadastrou o seu
                  atendimento por ele — não pedimos CPF para simulações.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="portal-consulta-nome" className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5 block">
                    👤 Seu Nome *
                  </label>
                  <input
                    id="portal-consulta-nome"
                    name="nome"
                    type="text"
                    autoComplete="name"
                    placeholder="Nome completo"
                    value={nomePortal}
                    onChange={(e) => setNomePortal(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#020408] border border-slate-800 text-white text-sm font-semibold outline-none focus:border-[#10b981]"
                  />
                </div>
                <div>
                  <label htmlFor="portal-consulta-whatsapp" className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5 block">
                    📱 Seu WhatsApp / Telemóvel *
                  </label>
                  <input
                    id="portal-consulta-whatsapp"
                    name="telefone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(34) 99999-9999"
                    value={whatsappPortal}
                    onChange={(e) => setWhatsappPortal(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#020408] border border-slate-800 text-white text-sm font-semibold outline-none focus:border-[#10b981]"
                  />
                </div>
              </div>

              <p className="text-[10.5px] leading-relaxed text-slate-500">
                Nome e WhatsApp são usados para identificar o seu atendimento e liberar o relatório — e ficam
                registrados no CRM da imobiliária responsável. Sem esses dois dados a consulta não abre. Para
                correção ou exclusão, use{' '}
                <button
                  type="button"
                  onClick={() => setExclusaoAberta(true)}
                  className="cursor-pointer text-[#10b981] underline"
                >
                  Solicitar exclusão dos meus dados
                </button>{' '}
                ou leia a{' '}
                <Link to="/privacidade" className="text-[#10b981] underline">
                  Política de Privacidade
                </Link>
                .
              </p>

              <div>
                <label htmlFor="portal-consulta-senha" className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5 block">
                  🔑 Código de Acesso / 4 últimos dígitos do WhatsApp (Opcional)
                </label>
                <input
                  id="portal-consulta-senha"
                  name="senha"
                  type="password"
                  autoComplete="off"
                  placeholder="••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#020408] border border-slate-800 text-white font-bold text-center tracking-[0.4em] outline-none focus:border-[#10b981]"
                />
              </div>

              <button
                onClick={handleEntrar}
                disabled={carregando}
                className="w-full py-4 rounded-2xl bg-[#10b981] text-[#020408] font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.25)]"
              >
                {carregando ? '⏳ Consultando Imóvel...' : '🚀 Consultar Imóvel e Relatórios'}
              </button>
            </div>

            {/* Ferramentas Imobiliárias Públicas */}
            <div className="w-full border-t border-slate-900 pt-8">
              <p className="text-[#10b981] text-[10px] font-black uppercase mb-2 tracking-[0.2em]">
                ⚡ Ferramentas Imobiliárias com IA
              </p>
              <p className="text-slate-400 text-xs mb-6">
                Simule financiamentos, consulte documentação, acompanhe vistorias e calcule a rentabilidade do seu imóvel.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {(FERRAMENTAS_IMOBI || [])?.map((ferramenta) => {
                  const Icone = ferramenta.icon;
                  return (
                    <button
                      key={ferramenta.id}
                      onClick={() => {
                        setAbaAtiva(ferramenta.id);
                        window.scrollTo(0, 0);
                      }}
                      className="group rounded-2xl border border-slate-800 hover:border-[#10b981] bg-slate-950/90 p-5 flex items-start gap-4 transition-all cursor-pointer text-left"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] shrink-0 group-hover:bg-[#10b981] group-hover:text-[#020408] transition-all">
                        <Icone size={22} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white group-hover:text-[#10b981] transition-colors">
                          {ferramenta.titulo}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">{ferramenta.subtitulo}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* FERRAMENTAS IMOBILIÁRIAS PÚBLICAS */}
        {!registrosImovel && abaAtiva === 'financiamento' && (
          <SimuladorFinanciamentoIA
            leadInicial={leadAtual}
            oficinaIdPortal={oficinaIdPortal}
            onBack={() => {
              setAbaAtiva('home');
              window.scrollTo(0, 0);
            }}
          />
        )}
        {!registrosImovel && abaAtiva === 'documentacao' && (
          <GuiaDocumentacaoImobi
            leadInicial={leadAtual}
            oficinaIdPortal={oficinaIdPortal}
            onBack={() => {
              setAbaAtiva('home');
              window.scrollTo(0, 0);
            }}
          />
        )}
        {!registrosImovel && abaAtiva === 'vistoria' && (
          <ConsultaStatusVistoria
            leadInicial={leadAtual}
            codigoInicial={identificador}
            oficinaIdPortal={oficinaIdPortal}
            onBack={() => {
              setAbaAtiva('home');
              window.scrollTo(0, 0);
            }}
          />
        )}
        {!registrosImovel && abaAtiva === 'roi' && (
          <CalculadoraRentabilidadeROI
            leadInicial={leadAtual}
            oficinaIdPortal={oficinaIdPortal}
            onBack={() => {
              setAbaAtiva('home');
              window.scrollTo(0, 0);
            }}
          />
        )}

        {/* TELA 2: PAINEL DO CLIENTE LOGADO */}
        {registrosImovel && (
          <div className="max-w-4xl mx-auto w-full px-4 py-8 pb-24">
            {!itemSelecionado && abaAtiva === 'dashboard' && (
              <>
                <div className="mb-8 p-6 md:p-8 bg-slate-950 rounded-3xl border border-[#10b981]/30 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="text-[#10b981] text-[10px] font-black uppercase tracking-widest">
                      Dossiê Imobiliário do Cliente
                    </p>
                    <p className="text-2xl md:text-3xl font-black text-white uppercase mt-1">{identificador}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Cliente: <strong className="text-white">{nomePortal}</strong> • WhatsApp: {whatsappPortal}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setAbaAtiva('agendamento')}
                      className="px-4 py-2.5 rounded-xl bg-[#10b981] text-[#020408] font-black text-xs uppercase tracking-wider cursor-pointer"
                    >
                      📅 Agendar Visita
                    </button>
                    <button
                      onClick={() => {
                        setRegistrosImovel(null);
                        setAbaAtiva('financiamento');
                      }}
                      className="px-4 py-2.5 rounded-xl border border-[#10b981]/40 text-[#10b981] font-black text-xs uppercase tracking-wider cursor-pointer"
                    >
                      💰 Simular Financiamento
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {(registrosImovel || [])?.map((reg) => (
                    <div
                      key={reg.id}
                      onClick={() => setItemSelecionado(reg)}
                      className="rounded-3xl border border-slate-800 hover:border-[#10b981] bg-slate-950 p-6 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] text-[10px] font-black uppercase tracking-wider">
                          {reg.categoria}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">{formatarDataBR(reg.data)}</span>
                      </div>
                      <h3 className="text-lg font-black text-white mb-2">{reg.titulo}</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">{reg.resumo}</p>
                      {reg.valor && (
                        <p className="text-[#10b981] font-black text-lg mt-3">{fmtBRL(reg.valor)}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-10 text-center">
                  <button
                    onClick={() => {
                      setRegistrosImovel(null);
                      setItemSelecionado(null);
                      setAbaAtiva('home');
                    }}
                    className="text-slate-400 hover:text-[#10b981] font-black text-xs uppercase tracking-widest cursor-pointer"
                  >
                    ← Sair da Consulta
                  </button>
                </div>
              </>
            )}

            {abaAtiva === 'dashboard' && itemSelecionado && (
              <div className="rounded-3xl border border-[#10b981]/40 bg-slate-950 p-6 md:p-8 space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-4">
                  <button
                    onClick={() => setItemSelecionado(null)}
                    className="text-[#10b981] font-black text-xs uppercase tracking-widest cursor-pointer"
                  >
                    ← Voltar ao Dossiê
                  </button>
                  <button
                    onClick={() => compartilharDossieWhatsApp(itemSelecionado)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10b981]/15 text-[#10b981] font-black text-xs uppercase cursor-pointer"
                  >
                    <Share2 size={14} /> Partilhar no WhatsApp
                  </button>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#10b981]">
                    {itemSelecionado.categoria}
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">{itemSelecionado.titulo}</h2>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{itemSelecionado.resumo}</p>

                {Array.isArray(itemSelecionado.divisoes) && itemSelecionado.divisoes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Etapas / Divisões Verificadas
                    </p>
                    {(itemSelecionado.divisoes || [])?.map((d, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-xl bg-[#020408] border border-slate-800 px-4 py-3 text-xs"
                      >
                        <span className="font-bold text-white">{d.nome}</span>
                        <span className="font-black text-[#10b981] uppercase">{d.estado || 'OK'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {abaAtiva === 'agendamento' && (
              <AgendamentoVisitaImovel
                oficinaId={oficinaIdPortal}
                codigoImovel={identificador}
                leadInicial={leadAtual}
                onBack={() => setAbaAtiva('dashboard')}
              />
            )}
          </div>
        )}
      </main>

      {/* Rodapé do portal: quem opera, para que servem os dados e como pedir
          exclusão. O visitante é cliente da imobiliária; a plataforma é
          operadora (D-22.04). */}
      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 sm:px-6">
        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-[11px] leading-relaxed text-slate-400">
          <p>
            Este portal é operado pela imobiliária responsável pelos imóveis anunciados, com tecnologia{' '}
            <strong className="text-slate-200">Express Imobi Tech</strong>. O nome e o WhatsApp enviados nos formulários
            são usados para responder ao seu contato e ficam registrados no CRM dessa imobiliária.
          </p>
          <p>
            Para pedir acesso, correção ou exclusão dos seus dados, fale com a imobiliária pelo canal de atendimento
            dela ou use o pedido guiado da plataforma — o mesmo canal de privacidade existe em todo rodapé.
          </p>
          <p className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setExclusaoAberta(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-200 transition hover:border-[#10b981] hover:text-white"
            >
              <Lock size={12} aria-hidden="true" />
              Solicitar exclusão dos meus dados
            </button>
            <span className="text-slate-600">contato@expresstech.com.br</span>
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/privacidade" className="text-[#10b981] underline">
              Política de Privacidade
            </Link>
            <Link to="/termos" className="text-[#10b981] underline">
              Termos de Uso
            </Link>
            <Link to="/reembolso" className="text-[#10b981] underline">
              Política de Reembolso
            </Link>
            <span className="text-slate-600">Express Tech · Araguari e Uberlândia/MG</span>
          </p>
        </div>
      </footer>

      <SolicitacaoExclusaoDados
        aberto={exclusaoAberta}
        onFechar={() => setExclusaoAberta(false)}
        contexto="portal"
      />
    </div>
  );
}
