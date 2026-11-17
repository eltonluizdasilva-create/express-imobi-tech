import React, { useEffect, useMemo, useState } from 'react';
import {
  Landmark, Calculator, Sparkles, AlertTriangle, Send, Save, Check,
  Trash2, Columns3, ShieldAlert, FileStack, Wallet,
} from 'lucide-react';
import HeroAba from '../admin/HeroAba';
import GuiaDaAba from '../ui/GuiaDaAba';
import { corDaAba } from '../../lib/coresAbas';
import FormularioSimulacao from './FormularioSimulacao';
import FichaCaixa from './FichaCaixa';
import useCredito from '../../hooks/useCredito';
import { simular, resumoWhatsApp } from '../../lib/credito/simulador';
import { avisoDeParametros } from '../../lib/credito/parametros';
import { consumeCreditoPrefill } from '../../lib/credito/prefill';
import EsteiraKanban from './EsteiraKanban';
import DocumentosProcesso from './DocumentosProcesso';
import PainelReceita from './PainelReceita';
import ParecerViabilidade from './ParecerViabilidade';
import useEsteira from '../../hooks/useEsteira';
import { useAuth } from '../../contexts/AuthContext';

const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const pct = (v) => `${((Number(v) || 0) * 100).toFixed(1).replace('.', ',')}%`;

const ENTRADA_VAZIA = {
  valorImovel: '', tipo: 'usado', uf: 'MG', cidade: '',
  rendas: [''], numProponentes: 1, nascimentoMaisVelho: '',
  fgts: '', usaFgts: true, entradaDinheiro: '', sistema: 'sac',
  prazo: '360', taxaAnual: '', taxaTipo: 'nominal', primeiroImovel: true,
  mipPct: '', dfiPct: '', tarifaMensal: '',
};

const ABAS = [
  { id: 'simulador', label: 'Simulador', icone: Calculator },
  { id: 'esteira', label: 'Esteira', icone: FileStack },
  { id: 'documentos', label: 'Documentos', icone: ShieldAlert },
  { id: 'receita', label: 'Receita', icone: Wallet },
];

export default function CorrespondenteCredito({ dadosOficina, usuario: usuarioProp, papelLogado }) {
  const corAba = corDaAba('credito');
  // A oficina e o usuário vêm do AuthContext quando o shell não os repassa,
  // mantendo o AdminNovo com o mínimo de alterações.
  const auth = useAuth();
  const oficinaId = dadosOficina?.id || dadosOficina?.uid || auth?.dadosOficina?.id || auth?.currentUserId || null;
  const papelEfetivo = papelLogado || auth?.papelLogado || 'corretor';
  const usuario = usuarioProp || {
    uid: auth?.currentUserId || null,
    email: auth?.currentUser?.email || null,
    nome: auth?.currentUser?.displayName || null,
  };

  const { parametros, carregando, aviso, salvando, erro, salvarSimulacao } = useCredito(oficinaId, usuario);
  // Fases 3 e 5 usam a lista da esteira para escolher o processo.
  const esteira = useEsteira(oficinaId, usuario, papelEfetivo);
  const [processoSelId, setProcessoSelId] = useState('');

  const [aba, setAba] = useState('simulador');
  const [entrada, setEntrada] = useState(ENTRADA_VAZIA);
  const [prefill, setPrefill] = useState(null);
  const [cenarios, setCenarios] = useState([]);
  const [oficial, setOficial] = useState({ numero: '', valorFinanciado: '', parcela: '', data: '' });
  const [salvoEm, setSalvoEm] = useState('');
  const [copiadoWpp, setCopiadoWpp] = useState(false);

  // Pré-preenchimento vindo do card de lead/imóvel
  useEffect(() => {
    const p = consumeCreditoPrefill();
    if (!p) return;
    setPrefill(p);
    setEntrada((atual) => ({
      ...atual,
      valorImovel: p.valorImovel ? String(p.valorImovel) : atual.valorImovel,
      cidade: p.cidade || atual.cidade,
      uf: p.uf || atual.uf,
      rendas: p.renda ? [String(p.renda)] : atual.rendas,
    }));
  }, []);

  const sim = useMemo(() => {
    if (!parametros) return null;
    return simular({ ...entrada, rendas: entrada.rendas }, parametros);
  }, [entrada, parametros]);

  const seloParametros = avisoDeParametros(parametros);

  async function salvarCenario() {
    if (!sim) return;
    const rotulo = `Cenário ${cenarios.length + 1} · ${sim.sistema.toUpperCase()} ${sim.prazo}m`;
    setCenarios((atual) => [...atual.slice(0, 2), { id: Date.now(), rotulo, sim }]);
    try {
      await salvarSimulacao(sim, {
        rotulo,
        leadId: prefill?.leadId,
        leadNome: prefill?.leadNome,
        imovelId: prefill?.imovelId,
        resultadoOficial: oficial.numero ? oficial : null,
      });
      setSalvoEm(new Date().toLocaleTimeString('pt-BR'));
    } catch {
      setSalvoEm('');
    }
  }

  function abrirWhatsApp() {
    if (!sim) return;
    const texto = resumoWhatsApp(sim, prefill?.leadNome || '');
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  }

  async function copiarResumo() {
    if (!sim) return;
    try {
      await navigator.clipboard.writeText(resumoWhatsApp(sim, prefill?.leadNome || ''));
      setCopiadoWpp(true);
      setTimeout(() => setCopiadoWpp(false), 2000);
    } catch { setCopiadoWpp(false); }
  }

  return (
    <div className="space-y-6">
      <HeroAba
        icone={Landmark}
        titulo="Correspondente"
        destaque="Crédito"
        chip="Pré-simulação MCMV + SBPE · apoio ao correspondente"
        subtitulo="Simula enquadramento, parcela, subsídio e comprometimento antes de levar o cliente ao banco. Não aprova crédito nem acessa sistemas de banco."
        cor={corAba}
      />

      <GuiaDaAba
        titulo="Correspondente / Crédito"
        descricao="Ferramenta de apoio: calcula a pré-simulação com os parâmetros versionados, gera a ficha espelho na ordem do simulador oficial e o resumo para WhatsApp. Todo resultado é estimativa — a análise é do banco."
      />

      {/* Aviso de parâmetros */}
      {(seloParametros || aviso) && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-300" />
          <div className="text-[11px] leading-relaxed text-amber-200">
            <strong>{seloParametros || 'Aviso de parâmetros'}</strong>
            {aviso ? <span className="block text-amber-200/80">{aviso}</span> : null}
            <span className="block text-amber-200/70">
              Fonte: {parametros?.fonte || '—'} · versão {parametros?.versao || '—'}
              {parametros?.validado ? ' · validado' : ' · NÃO VALIDADO'}
            </span>
          </div>
        </div>
      )}

      {/* Sub-abas */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-800 bg-white/[0.015] p-1.5">
        {ABAS.map(({ id, label, icone: Icone }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${
              aba === id ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icone size={12} /> {label}
          </button>
        ))}
      </div>

      {aba === 'esteira' && (
        <EsteiraKanban
          oficinaId={oficinaId}
          usuario={usuario}
          papelLogado={papelEfetivo}
          simAtual={sim}
          onAbrirSimulador={() => setAba('simulador')}
        />
      )}

      {aba === 'documentos' && (
        <div className="space-y-4">
          <div className={`${card} p-4`}>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Processo</label>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-[12px] text-white focus:outline-none focus:border-[#10b981]"
              value={processoSelId}
              onChange={(e) => setProcessoSelId(e.target.value)}
            >
              <option value="">Selecione o processo…</option>
              {esteira.processos.map((proc) => (
                <option key={proc.id} value={proc.id}>
                  {proc.leadNome || 'Sem lead'} — {proc.banco || 'banco'} · {proc.etapa}
                </option>
              ))}
            </select>
          </div>
          <DocumentosProcesso
            oficinaId={oficinaId}
            processo={esteira.processos.find((x) => x.id === processoSelId) || null}
            usuario={usuario}
            papelLogado={papelEfetivo}
          />
        </div>
      )}

      {aba === 'receita' && <PainelReceita processos={esteira.processos} />}

      {aba === 'simulador' && (
        <>
          <div className={`${card} p-5 space-y-4`}>
            <FormularioSimulacao entrada={entrada} setEntrada={setEntrada} parametros={parametros} prefilled={prefill} />
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={salvarCenario}
                disabled={!sim || salvando}
                className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-950 disabled:opacity-40"
              >
                {salvando ? <Sparkles size={13} /> : <Save size={13} />} Salvar cenário
              </button>
              <button onClick={abrirWhatsApp} disabled={!sim} className="inline-flex items-center gap-2 rounded-xl border border-[#10b981]/50 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-[#10b981] disabled:opacity-40">
                <Send size={13} /> Enviar resumo no WhatsApp
              </button>
              <button onClick={copiarResumo} disabled={!sim} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-300 disabled:opacity-40">
                {copiadoWpp ? <Check size={13} /> : <Sparkles size={13} />} {copiadoWpp ? 'Copiado' : 'Copiar resumo'}
              </button>
              {salvoEm && <span className="text-[10px] text-slate-500">Cenário salvo às {salvoEm}</span>}
              {erro && <span className="text-[10px] text-red-300">{erro}</span>}
            </div>
          </div>

          {/* Resultado principal */}
          {carregando && <div className={`${card} p-5 text-[11px] text-slate-400`}>Carregando parâmetros…</div>}

          {sim && (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className={`${card} p-5 lg:col-span-2 space-y-3`}>
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: corAba }}>
                  <Calculator size={13} /> Enquadramento sugerido
                </p>
                <p className="text-2xl font-black text-white">
                  {sim.enquadramento.linha}
                  {sim.enquadramento.faixa ? <span className="ml-2 text-base text-slate-300">{sim.enquadramento.faixa}</span> : null}
                </p>
                <ul className="space-y-1">
                  {sim.enquadramento.motivos.map((m) => (
                    <li key={m} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                      <Check size={11} className="mt-0.5 shrink-0 text-[#10b981]" /> {m}
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-2 gap-2 pt-1 md:grid-cols-4">
                  {[
                    ['Financiável', brl(sim.financiavel)],
                    ['Entrada necessária', brl(sim.entradaNecessaria)],
                    ['Subsídio estimado', sim.subsidio > 0 ? brl(sim.subsidio) : '—'],
                    ['Prazo', `${sim.prazo} meses`],
                    ['Parcela com seguros', brl(sim.parcelaComSeguros)],
                    ['Parcela sem seguros', brl(sim.parcelaSemSeguros)],
                    ['Última parcela', brl(sim.parcelaFinal)],
                    [`Taxa ${sim.taxaTipo}`, `${sim.taxaAnual.toFixed(2)}% a.a.`],
                    ['Taxa efetiva equiv.', `${sim.taxaEfetiva.toFixed(2)}% a.a.`],
                    ['Cota', pct(sim.cota)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-slate-800 px-2 py-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{k}</p>
                      <p className="text-sm font-black text-white">{v}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['MIP', brl(sim.encargos.mip)],
                    ['DFI', brl(sim.encargos.dfi)],
                    ['Tarifa', brl(sim.encargos.tarifa)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-slate-800 px-2 py-1.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{k}</p>
                      <p className="text-[11px] font-bold text-slate-200">{v}</p>
                    </div>
                  ))}
                </div>

                <div className={`rounded-xl border px-3 py-2 ${sim.deficitEntrada > 0 ? 'border-red-500/40 bg-red-500/10' : 'border-[#10b981]/40 bg-[#10b981]/5'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entrada exigida × disponível</p>
                      <p className="text-[11px] text-slate-300">
                        {brl(sim.entradaNecessaria)} exigida · {brl(sim.entradaDisponivel)} disponível (dinheiro + FGTS)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {sim.deficitEntrada > 0 ? 'Déficit' : 'Folga'}
                      </p>
                      <p className={`text-lg font-black ${sim.deficitEntrada > 0 ? 'text-red-300' : 'text-[#10b981]'}`}>
                        {brl(sim.deficitEntrada > 0 ? sim.deficitEntrada : sim.entradaDisponivel - sim.entradaNecessaria)}
                      </p>
                    </div>
                  </div>
                  {sim.deficitEntrada > 0 && (
                    <p className="mt-1 text-[10px] text-red-300">
                      Falta entrada: some FGTS, aumente a entrada em dinheiro ou reduza o valor do imóvel.
                    </p>
                  )}
                </div>

                <div className={`rounded-xl border px-3 py-2 ${sim.comprometimento > sim.limiteComprometimento ? 'border-red-500/40 bg-red-500/10' : 'border-slate-800'}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comprometimento da renda (parcela com seguros)</p>
                  <p className={`text-lg font-black ${sim.comprometimento > sim.limiteComprometimento ? 'text-red-300' : 'text-white'}`}>
                    {pct(sim.comprometimento)} <span className="text-[10px] font-bold text-slate-500">limite {pct(sim.limiteComprometimento)}</span>
                  </p>
                  {sim.comprometimento > sim.limiteComprometimento && (
                    <p className="text-[10px] text-red-300">Acima do limite: o banco tende a recusar ou exigir renda maior/entrada maior.</p>
                  )}
                </div>

                {sim.alertas.length > 0 && (
                  <ul className="space-y-1">
                    {sim.alertas.map((a) => (
                      <li key={a} className="flex items-start gap-1.5 text-[10px] text-amber-300">
                        <AlertTriangle size={11} className="mt-0.5 shrink-0" /> {a}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="text-[10px] text-slate-500">{sim.avisoLegal}</p>
              </div>

              <div className={`${card} p-5`}>
                <FichaCaixa sim={sim} oficial={oficial} setOficial={setOficial} />
              </div>
            </div>
          )}

          {/* Parecer de viabilidade por IA (Fase 4) */}
          {sim && (
            <ParecerViabilidade
              oficinaId={oficinaId}
              nomeCliente={prefill?.leadNome || ''}
              dadosBase={{
                rendaTotal: sim.rendaTotal,
                idade: sim.idade || 0,
                fgts: Number(entrada.fgts) || 0,
                entradaDisponivel: sim.entradaDisponivel,
                valorImovel: Number(entrada.valorImovel) || 0,
                numProponentes: Number(entrada.numProponentes) || 1,
              }}
            />
          )}

          {/* Cenários lado a lado */}
          {cenarios.length > 0 && (
            <div className={`${card} p-5`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Columns3 size={13} /> Cenários salvos ({cenarios.length}/3)
                </p>
                <button onClick={() => setCenarios([])} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-red-300">
                  limpar
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {cenarios.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-slate-800 p-3">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.rotulo}</p>
                      <button onClick={() => setCenarios((a) => a.filter((x) => x.id !== c.id))} className="text-slate-600 hover:text-red-300">
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-300">{c.sim.enquadramento.linha} {c.sim.enquadramento.faixa || ''}</p>
                    <p className="mt-1 text-sm font-black text-white">{brl(c.sim.parcelaComSeguros)}<span className="text-[9px] text-slate-500"> /mês c/ seguros</span></p>
                    <dl className="mt-1 space-y-0.5 text-[10px] text-slate-400">
                      <div className="flex justify-between"><dt>Financia</dt><dd className="text-slate-200">{brl(c.sim.financiavel)}</dd></div>
                      <div className="flex justify-between"><dt>Entrada</dt><dd className="text-slate-200">{brl(c.sim.entradaNecessaria)}</dd></div>
                      <div className="flex justify-between"><dt>Comprom.</dt><dd className={c.sim.comprometimento > c.sim.limiteComprometimento ? 'text-red-300' : 'text-slate-200'}>{pct(c.sim.comprometimento)}</dd></div>
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
