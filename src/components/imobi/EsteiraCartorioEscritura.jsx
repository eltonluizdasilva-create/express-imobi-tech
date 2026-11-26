/**
 * EsteiraCartorioEscritura.jsx — Esteira pós-venda dentro de `Repasses & NF`.
 * ============================================================================
 * Integrada ao módulo PLUS existente (Simulador de Custos → Repasses & NF):
 * nenhuma aba nova na sidebar, nenhuma linha nova em `shared/planos.json`.
 *
 * A esteira acompanha cada negociação fechada ANTES da liberação da comissão:
 *   1. Matrícula & certidões (CNDs) — com prazo e alerta de vencimento;
 *   2. ITBI, escritura e registro no RGI;
 *   3. Trava pré-repasse (com liberação manual justificada) → NF.
 *
 * ZERO TOKENS: checklist, prazos e trava são cálculo local (`cartorioEscritura.js`).
 * Esta tela não faz nenhuma requisição de IA: nenhum texto é enviado a provedor
 * externo, nem automaticamente nem por botão.
 * ============================================================================
 */

import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  AlertTriangle, CheckCircle2, Copy, Landmark, Lock, ScrollText, Unlock,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { corDaAba } from '../../lib/coresAbas';
import { obterCenarioCartorioDemo } from '../../lib/cenarioDemo';
import {
  CHECKLIST_CERTIDOES, CHECKLIST_ESCRITURA, ETAPA_CERTIDOES, ETAPA_ESCRITURA,
  JUSTIFICATIVA_MINIMA, LIMITE_ALERTA_DIAS, STATUS_OPCOES,
  alertasVencimento, atualizarItem, dataBR, liberarComJustificativa,
  mensagemWhatsAppCartorio, mesclarNegociacoes, pendenciasCartorio,
  podeLiberarRepasse, progressoNegociacao, revogarLiberacaoManual, rotuloItem,
  statusCertidao,
} from '../../lib/cartorioEscritura';

const CHAVE_LOCAL = 'cartorio_negociacoes_v1';

const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#0d9488]';
const botaoSecundario = 'cursor-pointer rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-200 transition hover:border-[#0d9488]';

const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
});

const TOM_STATUS = {
  pendente: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  vencida: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  a_vencer: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  emitida: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
};

function TituloEtapa({ numero, titulo, detalhe, concluidos, total, corAba }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black"
          style={{ backgroundColor: `${corAba}22`, color: corAba }}
          aria-hidden="true"
        >
          {numero}
        </span>
        {titulo}
      </h4>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {concluidos}/{total} concluído(s)
      </span>
      {detalhe ? <p className="w-full text-[10px] leading-relaxed text-slate-500">{detalhe}</p> : null}
    </div>
  );
}

/**
 * Linha de checklist: status (Pendente/Emitida/Vencida), data de emissão,
 * validade e os campos próprios de ITBI (valor) e RGI (protocolo).
 */
function ItemChecklist({ definicao, etapa, item, negociacao, referencia, onChange }) {
  const situacao = statusCertidao(item, referencia);
  const tom = TOM_STATUS[situacao.chave] || TOM_STATUS.pendente;
  const idBase = `${etapa}-${definicao.id}`;

  return (
    <li className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-100">{rotuloItem(definicao.id, negociacao)}</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{definicao.detalhe}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${tom}`}>
          {situacao.rotulo}
        </span>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <div>
          <label className={labelCls} htmlFor={`${idBase}-status`}>Status</label>
          <select
            id={`${idBase}-status`}
            value={item.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className={inputCls}
          >
            {STATUS_OPCOES.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>{opcao.rotulo}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor={`${idBase}-emissao`}>Emitida em</label>
          <input
            id={`${idBase}-emissao`}
            type="date"
            value={item.emitidaEm || ''}
            onChange={(e) => onChange({ emitidaEm: e.target.value })}
            className={inputCls}
          />
        </div>
        {definicao.validadeDias ? (
          <div>
            <label className={labelCls} htmlFor={`${idBase}-validade`}>Válida até</label>
            <input
              id={`${idBase}-validade`}
              type="date"
              value={item.validadeAte || ''}
              onChange={(e) => onChange({ validadeAte: e.target.value })}
              className={inputCls}
            />
          </div>
        ) : null}
        {definicao.id === 'itbi_guia' ? (
          <div>
            <label className={labelCls} htmlFor={`${idBase}-valor`}>Valor do ITBI (R$)</label>
            <input
              id={`${idBase}-valor`}
              type="number"
              min="0"
              step="0.01"
              value={item.valor || ''}
              onChange={(e) => onChange({ valor: e.target.value })}
              className={inputCls}
            />
          </div>
        ) : null}
        {definicao.id === 'registro_protocolo' ? (
          <div>
            <label className={labelCls} htmlFor={`${idBase}-protocolo`}>Protocolo no RGI</label>
            <input
              id={`${idBase}-protocolo`}
              value={item.protocolo || ''}
              onChange={(e) => onChange({ protocolo: e.target.value })}
              className={inputCls}
              placeholder="RGI-0000/0000"
            />
          </div>
        ) : null}
      </div>

      {situacao.vencida ? (
        <p className="mt-1.5 text-[10px] font-bold text-rose-300">
          Certidão vencida — peça a 2ª via antes do repasse.
        </p>
      ) : null}
      {situacao.aVencer ? (
        <p className="mt-1.5 text-[10px] font-bold text-amber-300">
          Vence em {situacao.dias} dia(s) — renove antes do repasse.
        </p>
      ) : null}
    </li>
  );
}

export default function EsteiraCartorioEscritura({
  oficinaId = '',
  propostas = [],
  negociacoesIniciais = null,
  nomeImobiliaria = '',
  corretorPadrao = '',
  agora,
  onAbrirAba,
}) {
  const corAba = corDaAba('notafiscal');
  const controlado = Array.isArray(negociacoesIniciais);

  // O "hoje" é fixado na montagem: os prazos não mudam no meio da operação.
  const [referencia] = useState(() => Number(agora) || Date.now());
  const [persistidas, setPersistidas] = useState(() => (controlado ? negociacoesIniciais : []));
  const [selecionadaId, setSelecionadaId] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [copiou, setCopiou] = useState(false);

  useEffect(() => {
    if (controlado) return undefined;
    let ativo = true;

    const lerLocal = () => {
      try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE_LOCAL) || '[]');
        if (ativo) setPersistidas(Array.isArray(salvo) ? salvo : []);
      } catch {
        if (ativo) setPersistidas([]);
      }
    };

    if (!oficinaId) {
      lerLocal();
      return () => { ativo = false; };
    }

    const ref = collection(db, 'oficinas', oficinaId, 'cartorio_negociacoes');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!ativo) return;
        setPersistidas((snap?.docs || []).map((d) => ({ id: d.id, ...d.data() })));
      },
      (falha) => {
        if (!ativo) return;
        console.warn('Esteira de cartório: leitura do Firestore falhou.', falha?.message);
        lerLocal();
      },
    );

    return () => {
      ativo = false;
      unsub();
    };
  }, [controlado, oficinaId]);

  const mescladas = useMemo(
    () => mesclarNegociacoes({ persistidas, propostas, agora: referencia }),
    [persistidas, propostas, referencia],
  );

  // Conta nova (cold start) já abre rica: 3 negociações de demonstração.
  const demonstracao = mescladas.length === 0;
  const demo = useMemo(
    () => (demonstracao ? obterCenarioCartorioDemo(referencia) : []),
    [demonstracao, referencia],
  );
  const negociacoes = demonstracao ? demo : mescladas;

  const selecionada = useMemo(() => {
    if (!negociacoes.length) return null;
    return negociacoes.find((n) => n.id === selecionadaId) || negociacoes[0];
  }, [negociacoes, selecionadaId]);

  const trava = useMemo(
    () => (selecionada ? podeLiberarRepasse(selecionada, referencia) : null),
    [selecionada, referencia],
  );
  const progresso = useMemo(
    () => (selecionada ? progressoNegociacao(selecionada, referencia) : null),
    [selecionada, referencia],
  );
  const alertas = useMemo(
    () => (selecionada ? alertasVencimento(selecionada, referencia) : []),
    [selecionada, referencia],
  );

  const fila = useMemo(() => {
    let travadas = 0;
    let liberadas = 0;
    let emAlerta = 0;
    for (const negociacao of negociacoes) {
      const situacao = podeLiberarRepasse(negociacao, referencia);
      if (situacao.status === 'travado') travadas += 1;
      else liberadas += 1;
      emAlerta += situacao.alertas.length;
    }
    return { total: negociacoes.length, travadas, liberadas, emAlerta };
  }, [negociacoes, referencia]);

  function gravarLocal(negociacao) {
    try {
      const atual = JSON.parse(localStorage.getItem(CHAVE_LOCAL) || '[]');
      const resto = Array.isArray(atual) ? atual.filter((n) => n.id !== negociacao.id) : [];
      localStorage.setItem(CHAVE_LOCAL, JSON.stringify([...resto, negociacao]));
    } catch {
      // Navegador sem storage: a tela continua funcionando em memória.
    }
  }

  function aplicar(negociacao) {
    // No modo demonstração, partir de uma das 3 vendas de exemplo não pode
    // apagar as outras duas: a lista inteira passa a ser a base local.
    const baseDemo = demonstracao ? demo : [];
    const proxima = [...baseDemo.filter((n) => n.id !== negociacao.id), negociacao];

    setPersistidas((prev) => (
      demonstracao
        ? proxima
        : [...(Array.isArray(prev) ? prev : []).filter((n) => n.id !== negociacao.id), negociacao]
    ));

    if (controlado) return;
    if (demonstracao || !oficinaId) {
      proxima.forEach(gravarLocal);
      return;
    }

    setDoc(
      doc(db, 'oficinas', oficinaId, 'cartorio_negociacoes', negociacao.id),
      negociacao,
      { merge: true },
    ).catch((falha) => {
      gravarLocal(negociacao);
      setErro(`Gravação no Firestore falhou (${falha?.message || 'erro'}). A alteração ficou salva neste navegador.`);
    });
  }

  function mudarItem(etapa, itemId, dados) {
    if (!selecionada) return;
    aplicar(atualizarItem(selecionada, etapa, itemId, dados, { agora: referencia }));
    setErro('');
  }

  async function copiarStatus() {
    if (!selecionada) return;
    const texto = mensagemWhatsAppCartorio(selecionada, { agora: referencia, nomeImobiliaria });
    try {
      await navigator.clipboard.writeText(texto);
      setCopiou(true);
      setAviso('Status do cartório copiado — cole no WhatsApp do comprador, vendedor ou correspondente bancário.');
      setTimeout(() => setCopiou(false), 2500);
    } catch {
      setCopiou(false);
      setAviso('O navegador bloqueou a cópia automática. Use o resumo abaixo como roteiro da mensagem.');
    }
    setTimeout(() => setAviso(''), 4500);
  }

  function liberar() {
    if (!selecionada) return;
    const resultado = liberarComJustificativa(selecionada, {
      justificativa,
      por: corretorPadrao,
      agora: referencia,
    });
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    setErro('');
    setJustificativa('');
    setAviso('Repasse liberado manualmente. A justificativa ficou registrada no dossiê da negociação.');
    aplicar(resultado.negociacao);
    setTimeout(() => setAviso(''), 4500);
  }

  function revogar() {
    if (!selecionada) return;
    aplicar(revogarLiberacaoManual(selecionada, { agora: referencia }));
    setErro('');
    setAviso('Liberação manual revogada: a negociação voltou a respeitar a trava pré-repasse.');
    setTimeout(() => setAviso(''), 4500);
  }

  if (!selecionada || !trava || !progresso) {
    return (
      <div className={`${card} p-6`}>
        <p className="text-xs text-slate-400">Esteira de cartório indisponível no momento.</p>
      </div>
    );
  }

  const pendencias = pendenciasCartorio(selecionada, referencia);
  const textoWhatsApp = mensagemWhatsAppCartorio(selecionada, { agora: referencia, nomeImobiliaria });

  return (
    <div className="space-y-4">
      <section className={`${card} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Landmark size={20} style={{ color: corAba }} aria-hidden="true" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-white">
                Esteira pós-venda · Cartório &amp; Escritura
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Nenhuma comissão do repasse é liberada antes de matrícula, CNDs, ITBI, escritura e registro
                conferidos. Prazos e trava calculados no navegador — sem IA.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-700 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-slate-300">
              {fila.total} negociação(ões)
            </span>
            <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-rose-300">
              {fila.travadas} travada(s)
            </span>
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300">
              {fila.liberadas} liberada(s)
            </span>
            <button
              type="button"
              onClick={copiarStatus}
              className={`${botaoSecundario} inline-flex items-center gap-1.5`}
            >
              {copiou ? <CheckCircle2 size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              Copiar Status do Cartório (WhatsApp)
            </button>
          </div>
        </div>

        {demonstracao ? (
          <div className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
            <strong>Dados de demonstração.</strong> A conta ainda não tem negociação fechada. As três vendas abaixo
            são exemplo: uma travada por CND a vencer, uma aguardando a conclusão do registro e uma já liberada
            para repasse.
          </div>
        ) : null}

        {fila.emAlerta > 0 ? (
          <p role="status" className="mt-2 flex items-center gap-2 text-[11px] font-bold text-amber-300">
            <AlertTriangle size={13} aria-hidden="true" />
            {fila.emAlerta} certidão(ões) vencida(s) ou vencendo em até {LIMITE_ALERTA_DIAS} dias.
          </p>
        ) : null}

        {erro ? (
          <div role="alert" className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
            {erro}
          </div>
        ) : null}

        {aviso ? (
          <div role="status" className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
            {aviso}
          </div>
        ) : null}

        <div
          className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="Negociações na esteira de cartório"
        >
          {negociacoes.map((negociacao) => {
            const situacao = podeLiberarRepasse(negociacao, referencia);
            const ativa = negociacao.id === selecionada.id;
            return (
              <button
                key={negociacao.id}
                type="button"
                aria-pressed={ativa}
                onClick={() => {
                  setSelecionadaId(negociacao.id);
                  setErro('');
                  setJustificativa('');
                }}
                className={`rounded-2xl border p-3 text-left transition ${
                  ativa
                    ? 'border-[#0d9488] bg-[#0d9488]/10'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {negociacao.codigoImovel || 'sem código'}
                </p>
                <p className="mt-0.5 truncate text-xs font-bold text-white">
                  {negociacao.imovelTitulo || 'Imóvel da negociação'}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {brl(negociacao.valor)}
                  {negociacao.comprador ? ` · ${negociacao.comprador}` : ''}
                </p>
                <span
                  className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    situacao.status === 'travado'
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                      : situacao.status === 'liberado_manual'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  }`}
                >
                  {situacao.status === 'travado'
                    ? <Lock size={10} aria-hidden="true" />
                    : <Unlock size={10} aria-hidden="true" />}
                  {situacao.status === 'travado'
                    ? 'Trava pré-repasse'
                    : situacao.status === 'liberado_manual'
                      ? 'Liberação manual'
                      : 'Liberada'}
                </span>
                {situacao.alertas.length ? (
                  <p className="mt-1 text-[10px] font-bold text-amber-300">
                    {situacao.alertas.length} alerta(s) de prazo
                  </p>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>
      <section className={`${card} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {selecionada.codigoImovel || 'sem código'}
              {selecionada.corretor ? ` · ${selecionada.corretor}` : ''}
            </p>
            <h3 className="text-sm font-black text-white">
              {selecionada.imovelTitulo || 'Imóvel da negociação'}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Comprador: {selecionada.comprador || 'não registrado'} · Vendedor: {selecionada.vendedor || 'não registrado'}
              {' · '}Valor: {brl(selecionada.valor)} · Sinal: {brl(selecionada.sinal)}
              {selecionada.origemCredito
                ? ` · Crédito: ${selecionada.banco || 'Correspondente & Crédito'}`
                : ''}
            </p>
          </div>

          <div className="w-full sm:w-56">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Checklist</span>
              <span>{progresso.pct}%</span>
            </div>
            <div
              className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800"
              role="progressbar"
              aria-valuenow={progresso.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso da esteira de cartório"
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progresso.pct}%`, backgroundColor: corAba }}
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              {progresso.concluidos} de {progresso.total} documentos concluídos
            </p>
          </div>
        </div>

        {alertas.length ? (
          <ul className="mt-3 space-y-1" aria-label="Alertas de vencimento das certidões">
            {alertas.map((alerta) => (
              <li
                key={alerta.id}
                className={`flex flex-wrap items-baseline justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] ${
                  alerta.severidade === 'critica'
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                }`}
              >
                <span>{alerta.rotulo}</span>
                <span className="font-bold">
                  {alerta.rotuloStatus}
                  {alerta.validadeAte ? ` · ${dataBR(alerta.validadeAte)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
            <TituloEtapa
              numero="1"
              titulo="Matrícula & Certidões (CNDs)"
              detalhe={`Certidão emitida com ${LIMITE_ALERTA_DIAS} dias ou menos para vencer fica em âmbar; fora do prazo fica vermelha e volta a travar o repasse.`}
              concluidos={progresso.certidoes.concluidos}
              total={progresso.certidoes.total}
              corAba={corAba}
            />
            <ul className="mt-3 space-y-2">
              {CHECKLIST_CERTIDOES.map((definicao) => (
                <ItemChecklist
                  key={definicao.id}
                  definicao={definicao}
                  etapa={ETAPA_CERTIDOES}
                  item={selecionada.certidoes[definicao.id]}
                  negociacao={selecionada}
                  referencia={referencia}
                  onChange={(dados) => mudarItem(ETAPA_CERTIDOES, definicao.id, dados)}
                />
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
            <TituloEtapa
              numero="2"
              titulo="ITBI, Escritura & Registro"
              detalhe={selecionada.origemCredito
                ? `Venda com crédito (${selecionada.banco || 'Correspondente & Crédito'}): vale o contrato com força de escritura do banco. Sinal registrado: ${brl(selecionada.sinal)}.`
                : 'Escritura pública no tabelionato e registro no Cartório de Registro de Imóveis (RGI).'}
              concluidos={progresso.escritura.concluidos}
              total={progresso.escritura.total}
              corAba={corAba}
            />
            <ul className="mt-3 space-y-2">
              {CHECKLIST_ESCRITURA.map((definicao) => (
                <ItemChecklist
                  key={definicao.id}
                  definicao={definicao}
                  etapa={ETAPA_ESCRITURA}
                  item={selecionada.escritura[definicao.id]}
                  negociacao={selecionada}
                  referencia={referencia}
                  onChange={(dados) => mudarItem(ETAPA_ESCRITURA, definicao.id, dados)}
                />
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className={`${card} p-4 sm:p-5`}>
        <TituloEtapa
          numero="3"
          titulo="Liberação de Repasse & NF"
          detalhe="A comissão só sai depois das etapas 1 e 2. Havendo comissão paga na assinatura, a gestão libera na mão e a justificativa fica registrada."
          concluidos={trava.liberado ? 1 : 0}
          total={1}
          corAba={corAba}
        />

        {trava.status === 'travado' ? (
          <div role="alert" className="mt-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3">
            <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-rose-300">
              <Lock size={13} aria-hidden="true" /> Aguardando Cartório (Trava Pré-Repasse)
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-rose-200">
              {pendencias.length} pendência(s) crítica(s) entre a Etapa 1 e a Etapa 2. O repasse ao corretor e a
              emissão da NF ficam bloqueados até a conclusão — ou até uma liberação manual justificada.
            </p>
            <ul className="mt-2 space-y-1">
              {pendencias.map((pendencia) => (
                <li
                  key={`${pendencia.etapa}-${pendencia.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-slate-950/60 px-2.5 py-1.5 text-[11px] text-slate-200"
                >
                  <span>
                    {pendencia.etapa === ETAPA_CERTIDOES ? 'Etapa 1' : 'Etapa 2'} · {pendencia.rotulo}
                  </span>
                  <span className="font-bold text-rose-300">
                    {pendencia.motivo === 'pendente' ? 'pendente' : 'prazo vencido'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div
            role="status"
            className={`mt-3 rounded-2xl border p-3 ${
              trava.status === 'liberado_manual'
                ? 'border-amber-500/40 bg-amber-500/10'
                : 'border-emerald-500/40 bg-emerald-500/10'
            }`}
          >
            <p
              className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-wider ${
                trava.status === 'liberado_manual' ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              <Unlock size={13} aria-hidden="true" /> {trava.selo}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-200">
              {trava.status === 'liberado_manual'
                ? `Justificativa registrada: “${trava.liberacaoManual.justificativa}”${trava.liberacaoManual.por ? ` — ${trava.liberacaoManual.por}` : ''}.`
                : 'Sem pendência crítica: siga para o repasse ao corretor e a emissão da NFS-e na seção de notas abaixo.'}
            </p>
            {trava.pendencias.length ? (
              <p className="mt-1 text-[10px] text-amber-200">
                {trava.pendencias.length} pendência(s) ainda aberta(s) — acompanhe até o registro concluir.
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {onAbrirAba ? (
                <button type="button" onClick={() => onAbrirAba('notafiscal')} className={botaoSecundario}>
                  Ir para a emissão da NF
                </button>
              ) : null}
              {trava.status === 'liberado_manual' ? (
                <button type="button" onClick={revogar} className={botaoSecundario}>
                  Revogar liberação manual
                </button>
              ) : null}
            </div>
          </div>
        )}

        {trava.status !== 'liberado' ? (
          <details className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
            <summary className="cursor-pointer text-[11px] font-black uppercase tracking-wider text-slate-300">
              Liberar manualmente com justificativa
            </summary>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              Use quando a comissão é paga na assinatura do contrato e o cartório ainda não concluiu. A
              justificativa fica gravada no dossiê da negociação.
            </p>
            <label className={`${labelCls} mt-2`} htmlFor="cartorio-justificativa">
              Justificativa (mínimo {JUSTIFICATIVA_MINIMA} caracteres)
            </label>
            <textarea
              id="cartorio-justificativa"
              rows={3}
              value={justificativa}
              onChange={(e) => {
                setJustificativa(e.target.value);
                setErro('');
              }}
              className={inputCls}
              placeholder="Ex.: comissão paga na assinatura do contrato, conforme cláusula 7 do compromisso."
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={liberar}
                disabled={justificativa.trim().length < JUSTIFICATIVA_MINIMA}
                className="cursor-pointer rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Liberar repasse com justificativa
              </button>
              <span className="text-[10px] text-slate-500">
                {justificativa.trim().length}/{JUSTIFICATIVA_MINIMA} caracteres
              </span>
            </div>
          </details>
        ) : null}
      </section>
      <section className={`${card} p-4`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white">
            <ScrollText size={14} style={{ color: corAba }} aria-hidden="true" /> Resumo para WhatsApp
          </h4>
          <button type="button" onClick={copiarStatus} className={`${botaoSecundario} inline-flex items-center gap-1.5`}>
            <Copy size={13} aria-hidden="true" /> Copiar Status do Cartório (WhatsApp)
          </button>
        </div>
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-[11px] leading-relaxed text-slate-300">
          {textoWhatsApp}
        </pre>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          Texto calculado no navegador a partir do checklist — sem IA. A conferência final é do tabelionato e do
          registro de imóveis.
        </p>
      </section>
    </div>
  );
}
