// src/components/imobi/TriagemCredito.jsx
import React, { useState } from 'react';
import {
  Calculator,
  Landmark,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  Send,
  ArrowRight,
  User,
  Building2,
  DollarSign,
  Percent,
  Info,
  Loader2,
  RotateCcw,
  MessageCircle,
  FileCheck,
} from 'lucide-react';
import { processarTriagemCreditoIA } from '../../agent/triagemCreditoPrompt';
import { setCreditoPrefill } from '../../lib/credito/prefill';

const brl = (v) =>
  (Number(v) || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

export default function TriagemCredito({ setAbaAtiva, onEncaminhado }) {
  const [form, setForm] = useState({
    tipoImovel: 'usado',
    cidade: 'Uberlândia',
    bairro: '',
    uf: 'MG',
    valorImovel: '280000',
    rendaFamiliar: '6500',
    idadeMaisVelho: '34',
    possuiCoComprador: false,
    parentescoCoComprador: 'Cônjuge',
    possuiDependentes: true,
    qtdDependentes: '1',
    vinculoCidade: true,
    fgtsMais36Meses: true,
    saldoFgts: '35000',
    historicoSubsidio: false,
    possuiImovelLocal: false,
    observacoes: '',
  });

  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [enviadoCredito, setEnviadoCredito] = useState(false);

  const handleChange = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  // Cálculo rápido de porcentagem do FGTS em relação ao imóvel
  const pctFgts = () => {
    const vImovel = parseFloat(String(form.valorImovel).replace(/[^\d]/g, '')) || 0;
    const sFgts = parseFloat(String(form.saldoFgts).replace(/[^\d]/g, '')) || 0;
    if (vImovel <= 0) return 0;
    return (sFgts / vImovel) * 100;
  };

  const executarTriagem = async (e) => {
    if (e) e.preventDefault();
    setAnalisando(true);
    setErro('');
    setEnviadoCredito(false);

    try {
      const res = await processarTriagemCreditoIA(form);
      setResultado(res);
    } catch (err) {
      setErro(err.message || 'Falha ao executar a triagem de financiamento.');
    } finally {
      setAnalisando(false);
    }
  };

  const encaminharParaCorrespondente = () => {
    if (!resultado) return;

    const est = resultado.estimativaFinanceira || {};
    const payload = {
      origem: 'triagem_pro',
      tipo: form.tipoImovel,
      valorImovel: est.valorImovel || form.valorImovel,
      renda: est.rendaFamiliar || form.rendaFamiliar,
      cidade: form.cidade,
      uf: form.uf,
      nascimentoMaisVelho: form.idadeMaisVelho
        ? `${new Date().getFullYear() - parseInt(form.idadeMaisVelho, 10)}-01-01`
        : '',
      fgts: est.saldoFgtsUtilizavel || form.saldoFgts,
      usaFgts: Boolean(parseFloat(form.saldoFgts) > 0),
      entradaDinheiro: est.desembolsoRecursoProprio || '',
      statusViabilidade: resultado.statusViabilidade,
      programaSugerido: resultado.programaSugerido,
      resumo: resultado.resumoEnquadramento,
      dossie: resultado.dossieCorrespondente,
    };

    setCreditoPrefill(payload);
    setEnviadoCredito(true);

    if (typeof onEncaminhado === 'function') {
      onEncaminhado(payload);
    }

    setTimeout(() => {
      if (typeof setAbaAtiva === 'function') {
        setAbaAtiva('credito');
      }
    }, 400);
  };

  const copiarDossie = () => {
    if (!resultado || !resultado.dossieCorrespondente) return;
    try {
      navigator.clipboard?.writeText(resultado.dossieCorrespondente);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {}
  };

  const enviarWhatsApp = () => {
    if (!resultado || !resultado.dossieCorrespondente) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(resultado.dossieCorrespondente)}`;
    window.open(url, '_blank');
  };

  const fgtsExpressivo = pctFgts() >= 10;

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#020408] p-5 md:p-6 shadow-2xl space-y-6 text-slate-100">
      {/* ─── TOPO DO MÓDULO (PLANO PRO) ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Calculator size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Triagem de Financiamento & Crédito
              </h2>
              <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-sky-300">
                Plano PRO · Pré-Análise
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulação de capacidade de parcela (30%), regras de idade (80,5 anos), FGTS e enquadramento MCMV/SBPE.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <span className="text-[11px] text-slate-400 font-bold bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
            <Landmark size={13} className="text-sky-400" /> Ponte Direta com Correspondente (PLUS)
          </span>
        </div>
      </div>

      {/* ─── FORMULÁRIO DE FICHA RÁPIDA DO COMPRADOR ───────────────────────── */}
      <form onSubmit={executarTriagem} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Valor do Imóvel */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Valor do Imóvel (R$)
            </label>
            <input
              type="text"
              value={form.valorImovel}
              onChange={(e) => handleChange('valorImovel', e.target.value)}
              placeholder="Ex: 280000"
              className="w-full bg-transparent text-sm font-black text-white outline-none"
            />
            <span className="text-[10px] text-slate-500 block">
              {brl(form.valorImovel)}
            </span>
          </div>

          {/* Renda Familiar Bruta */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Renda Familiar Bruta Mensal (R$)
            </label>
            <input
              type="text"
              value={form.rendaFamiliar}
              onChange={(e) => handleChange('rendaFamiliar', e.target.value)}
              placeholder="Ex: 6500"
              className="w-full bg-transparent text-sm font-black text-emerald-400 outline-none"
            />
            <span className="text-[10px] text-slate-500 block">
              Parcela máxima (30%): {brl(parseFloat(form.rendaFamiliar || 0) * 0.3)}
            </span>
          </div>

          {/* Idade do Mais Velho */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Idade do Comprador Mais Velho (anos)
            </label>
            <input
              type="number"
              min="18"
              max="90"
              value={form.idadeMaisVelho}
              onChange={(e) => handleChange('idadeMaisVelho', e.target.value)}
              placeholder="Ex: 34"
              className="w-full bg-transparent text-sm font-black text-white outline-none"
            />
            <span className="text-[10px] text-slate-500 block">
              Prazo máx. estimado: {Math.max(12, Math.floor((80.5 - (parseInt(form.idadeMaisVelho, 10) || 30)) * 12))} meses
            </span>
          </div>
        </div>

        {/* Linha 2: Localização, Tipo e Saldo FGTS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Tipo do Imóvel
            </label>
            <select
              value={form.tipoImovel}
              onChange={(e) => handleChange('tipoImovel', e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
            >
              <option value="usado" className="bg-slate-900">Imóvel Usado</option>
              <option value="novo" className="bg-slate-900">Imóvel Novo</option>
              <option value="planta" className="bg-slate-900">Em Construção / Planta</option>
              <option value="lote" className="bg-slate-900">Lote Urbanizado</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Cidade do Imóvel
            </label>
            <input
              type="text"
              value={form.cidade}
              onChange={(e) => handleChange('cidade', e.target.value)}
              placeholder="Ex: Uberlândia"
              className="w-full bg-transparent text-xs font-bold text-white outline-none"
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              UF
            </label>
            <input
              type="text"
              maxLength="2"
              value={form.uf}
              onChange={(e) => handleChange('uf', e.target.value.toUpperCase())}
              placeholder="MG"
              className="w-full bg-transparent text-xs font-bold text-white outline-none"
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Saldo de FGTS (R$)
              </label>
              {fgtsExpressivo && (
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 rounded">
                  &gt;10% do Imóvel
                </span>
              )}
            </div>
            <input
              type="text"
              value={form.saldoFgts}
              onChange={(e) => handleChange('saldoFgts', e.target.value)}
              placeholder="Ex: 35000"
              className="w-full bg-transparent text-sm font-black text-white outline-none"
            />
            <span className="text-[10px] text-slate-500 block">
              Representa {pctFgts().toFixed(1)}% do valor do imóvel
            </span>
          </div>
        </div>

        {/* Linha 3: Checkboxes de Regras Regulatórias e Enquadramento */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2.5">
            Parâmetros Normativos (Caixa / MCMV / FGTS):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700">
              <input
                type="checkbox"
                checked={form.possuiCoComprador}
                onChange={(e) => handleChange('possuiCoComprador', e.target.checked)}
                className="rounded accent-sky-500"
              />
              <span className="text-slate-300 font-bold">Composição de Renda (Co-comprador)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700">
              <input
                type="checkbox"
                checked={form.possuiDependentes}
                onChange={(e) => handleChange('possuiDependentes', e.target.checked)}
                className="rounded accent-sky-500"
              />
              <span className="text-slate-300 font-bold">Possui Dependentes (cônjuge / filhos / estudante até 24a)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700">
              <input
                type="checkbox"
                checked={form.fgtsMais36Meses}
                onChange={(e) => handleChange('fgtsMais36Meses', e.target.checked)}
                className="rounded accent-sky-500"
              />
              <span className="text-slate-300 font-bold">Tempo de FGTS ≥ 36 meses somados</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700">
              <input
                type="checkbox"
                checked={form.vinculoCidade}
                onChange={(e) => handleChange('vinculoCidade', e.target.checked)}
                className="rounded accent-sky-500"
              />
              <span className="text-slate-300 font-bold">Residência ou Trabalho na cidade/limítrofe</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700">
              <input
                type="checkbox"
                checked={form.historicoSubsidio}
                onChange={(e) => handleChange('historicoSubsidio', e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span className="text-slate-300 font-bold">Já usou subsídio federal anterior</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700">
              <input
                type="checkbox"
                checked={form.possuiImovelLocal}
                onChange={(e) => handleChange('possuiImovelLocal', e.target.checked)}
                className="rounded accent-rose-500"
              />
              <span className="text-slate-300 font-bold">Possui outro imóvel residencial no município</span>
            </label>
          </div>
        </div>

        {/* Botão de Disparo da Triagem com IA */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info size={13} className="text-sky-400" /> Pré-análise prudencial instantânea para o corretor economizar tempo e filtrar clientes.
          </span>

          <button
            type="submit"
            disabled={analisando || !form.valorImovel || !form.rendaFamiliar}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 px-5 py-2.5 text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-sky-500/20"
          >
            {analisando ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            <span>{analisando ? 'Calculando Viabilidade com IA...' : 'Analisar Viabilidade com IA'}</span>
          </button>
        </div>
      </form>

      {/* Erro */}
      {erro && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0 text-red-400" />
          <span>{erro}</span>
        </div>
      )}

      {/* ─── PAINEL DE RESULTADOS DA TRIAGEM ──────────────────────────────── */}
      {resultado && (
        <div className="mt-4 rounded-3xl border border-slate-800 bg-[#04080e] p-5 space-y-5 animate-in fade-in duration-200">
          {/* Status e Score */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-[#020408]">
            <div className="flex items-center gap-3">
              <div
                className={`h-11 w-11 rounded-2xl flex items-center justify-center border shrink-0 ${
                  resultado.statusViabilidade === 'APROVAVEL'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : resultado.statusViabilidade === 'AJUSTE_ENTRADA'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                }`}
              >
                {resultado.statusViabilidade === 'APROVAVEL' ? (
                  <CheckCircle2 size={22} />
                ) : resultado.statusViabilidade === 'AJUSTE_ENTRADA' ? (
                  <AlertTriangle size={22} />
                ) : (
                  <ShieldAlert size={22} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-black uppercase px-2 py-0.5 rounded-md border ${
                      resultado.statusViabilidade === 'APROVAVEL'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : resultado.statusViabilidade === 'AJUSTE_ENTRADA'
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    }`}
                  >
                    Status: {resultado.statusViabilidade === 'APROVAVEL' ? 'Aprovável' : resultado.statusViabilidade === 'AJUSTE_ENTRADA' ? 'Ajuste de Entrada' : 'Impedimento'}
                  </span>
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-md">
                    {resultado.programaSugerido}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Score de Enquadramento: <strong className="text-white">{resultado.scoreAprovacao}/100</strong>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={encaminharParaCorrespondente}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              {enviadoCredito ? <Check size={14} /> : <ArrowRight size={14} />}
              <span>{enviadoCredito ? 'Abrindo Correspondente...' : 'Enviar Dossiê para Correspondente / Crédito (PLUS)'}</span>
            </button>
          </div>

          {/* Resumo do Enquadramento */}
          <div className="rounded-2xl border border-slate-800 bg-[#020408] p-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-1">
              Diagnóstico do Corretor:
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {resultado.resumoEnquadramento}
            </p>
          </div>

          {/* Grid de Estimativa Financeira */}
          {resultado.estimativaFinanceira && (
            <div className="rounded-2xl border border-slate-800 bg-[#020408] p-4 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                Números Estimados da Pré-Simulação:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Parcela Máx (30%)</span>
                  <span className="font-black text-emerald-400 block truncate">
                    {brl(resultado.estimativaFinanceira.capacidadeParcelaMaxima)}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Financiamento Est.</span>
                  <span className="font-black text-white block truncate">
                    {brl(resultado.estimativaFinanceira.valorFinanciavelEstimado)}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Entrada Total</span>
                  <span className="font-black text-amber-400 block truncate">
                    {brl(resultado.estimativaFinanceira.entradaNecessariaEstimada)}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">FGTS Aplicado</span>
                  <span className="font-black text-white block truncate">
                    {brl(resultado.estimativaFinanceira.saldoFgtsUtilizavel)}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Desembolso à Vista</span>
                  <span className="font-black text-sky-400 block truncate">
                    {brl(resultado.estimativaFinanceira.desembolsoRecursoProprio)}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                  <span className="text-[9px] text-slate-500 uppercase font-bold block">Prazo Máximo</span>
                  <span className="font-black text-white block truncate">
                    {resultado.estimativaFinanceira.prazoMaximoMeses} meses
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Alertas e Checklist Documental */}
          {resultado.alertasDocumentais && resultado.alertasDocumentais.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                Alertas e Exigências Documentais:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {resultado.alertasDocumentais.map((alerta, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-[#020408] p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{alerta.titulo}</span>
                      <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                        {alerta.tipo}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {alerta.descricao}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barra de Ações: Copiar Dossiê e WhatsApp */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <span className="text-[11px] text-slate-500">
              Dossiê executivo pronto para envio rápido ao correspondente ou cliente.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copiarDossie}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white px-3.5 py-2 transition cursor-pointer"
              >
                {copiado ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiado ? 'Dossiê Copiado!' : 'Copiar Dossiê'}</span>
              </button>

              <button
                type="button"
                onClick={enviarWhatsApp}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider px-4 py-2 transition cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <MessageCircle size={14} />
                <span>Enviar Dossiê no Zap</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
