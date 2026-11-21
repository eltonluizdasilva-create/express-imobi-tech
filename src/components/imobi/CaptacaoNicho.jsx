import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Check, Landmark, MapPin, ShieldCheck, Home, KeyRound,
  HelpCircle, LoaderCircle, Save, Trash2, X,
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  NICHOS_CAPTACAO, GARANTIAS_LOCATICIA, AVISO_NULIDADE_GARANTIA, CHECKLIST_RURAL,
  selecionarGarantia, validarChecklistRural, validarGarantiaLocacao,
  elegibilidadeMcMv, FAIXAS_MCMV,
} from '../../lib/travas-legais';
import { validarCib, formatarCib } from '../../lib/fiscal';
import SeletorUF from '../ui/SeletorUF';
import MicButton from '../ui/MicButton';
import CampoMoeda from '../ui/CampoMoeda';
import { parseMoedaBR } from '../../lib/moedaBR';
import { lerPreferencias } from '../../lib/preferencias';
import { tetoMcMvPorPorte } from '../../lib/regrasEstaduais';

const E = '#10b981';
const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]';

const ICONES = { rural: Landmark, loteamento: MapPin, mcmv: Home, alto_padrao: ShieldCheck, locacao: KeyRound };

const fmtBRL = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CaptacaoNicho({ dadosOficina, setAbaAtiva }) {
  const tenantId = dadosOficina?.id || dadosOficina?.uid || null;

  const [nicho, setNicho] = useState('locacao');
  const [prefs, setPrefs] = useState(() => lerPreferencias());
  const [salvos, setSalvos] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  // campos comuns
  const [referencia, setReferencia] = useState('');
  const [cidade, setCidade] = useState('');
  const [valor, setValor] = useState('');
  const [cib, setCib] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [dicaCibAberta, setDicaCibAberta] = useState(false);

  // locação
  const [garantia, setGarantia] = useState(null);
  const [valorAluguel, setValorAluguel] = useState('');
  const [caucaoValor, setCaucaoValor] = useState('');
  const [fiadorNome, setFiadorNome] = useState('');

  // rural
  const [checklist, setChecklist] = useState({});
  const [areaHa, setAreaHa] = useState('');
  const [aptidao, setAptidao] = useState('lavoura');

  // loteamento
  const [quadra, setQuadra] = useState('');
  const [lote, setLote] = useState('');
  const [areaM2, setAreaM2] = useState('');
  const [infra, setInfra] = useState({});

  // MCMV
  const [rendaFamiliar, setRendaFamiliar] = useState('');
  const [usaFgts, setUsaFgts] = useState(false);
  const [outroImovel, setOutroImovel] = useState(false);

  // alto padrão
  const [areaConstruida, setAreaConstruida] = useState('');
  const [condominio, setCondominio] = useState('');

  useEffect(() => {
    if (!tenantId) return undefined;
    const unsub = onSnapshot(
      collection(db, 'oficinas', tenantId, 'imoveis_nicho'),
      (snap) => setSalvos(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => setSalvos([]),
    );
    return () => unsub();
  }, [tenantId]);

  const mcmv = useMemo(
    () => elegibilidadeMcMv({
      rendaFamiliar: parseMoedaBR(rendaFamiliar),
      possuiOutroImovel: outroImovel,
      usaFgts,
      valorImovel: parseMoedaBR(valor),
      porte: prefs.porteMunicipioPadrao,
    }),
    [rendaFamiliar, outroImovel, usaFgts, valor, prefs.porteMunicipioPadrao],
  );

  const tetoPorte = useMemo(() => tetoMcMvPorPorte(prefs.porteMunicipioPadrao), [prefs.porteMunicipioPadrao]);

  const rural = useMemo(() => validarChecklistRural(checklist), [checklist]);

  const garantiaValidacao = useMemo(
    () => validarGarantiaLocacao(garantia, { caucaoValor: parseMoedaBR(caucaoValor), valorAluguel: parseMoedaBR(valorAluguel), fiadorNome }),
    [garantia, caucaoValor, valorAluguel, fiadorNome],
  );

  function marcarGarantia(key) {
    const res = selecionarGarantia(garantia, key);
    setGarantia(res.selecionada);
    setErro(res.erro || '');
    setOk('');
  }

  function montarRegistro() {
    const base = {
      nicho, referencia, cidade,
      valor: parseMoedaBR(valor),
      cib: cib.replace(/\D/g, ''),
      observacoes: observacoes.trim(),
      criadoEm: serverTimestamp(),
    };
    if (nicho === 'locacao') {
      return {
        ...base,
        garantia,
        valorAluguel: parseMoedaBR(valorAluguel),
        caucaoValor: parseMoedaBR(caucaoValor),
        fiadorNome,
      };
    }
    if (nicho === 'rural') {
      return { ...base, areaHa: Number(areaHa) || 0, aptidao, checklist };
    }
    if (nicho === 'loteamento') {
      return { ...base, quadra, lote, areaM2: Number(areaM2) || 0, infraestrutura: Object.keys(infra).filter((k) => infra[k]) };
    }
    if (nicho === 'mcmv') {
      return { ...base, rendaFamiliar: parseMoedaBR(rendaFamiliar), usaFgts, possuiOutroImovel: outroImovel, faixa: mcmv.faixa?.key || null };
    }
    return { ...base, areaConstruida: Number(areaConstruida) || 0, condominio: parseMoedaBR(condominio) };
  }

  async function salvar() {
    setErro('');
    setOk('');
    if (!tenantId) { setErro('Sessão sem imobiliária vinculada.'); return; }
    if (!referencia.trim()) { setErro('Informe a referência do imóvel.'); return; }

    if (nicho === 'locacao' && !garantiaValidacao.ok) { setErro(garantiaValidacao.erro); return; }
    if (nicho === 'rural' && !rural.ok) { setErro(rural.erro); return; }
    if (nicho === 'mcmv' && parseMoedaBR(rendaFamiliar) > 0 && !mcmv.elegivel) {
      setErro(`Fora das regras do MCMV: ${mcmv.impedimentos.join(' ')}`);
      return;
    }

    setSalvando(true);
    try {
      const id = `${nicho}_${Date.now()}`;
      await setDoc(doc(db, 'oficinas', tenantId, 'imoveis_nicho', id), { id, ...montarRegistro() });
      setOk('Captação salva com as travas legais aplicadas.');
      setReferencia(''); setValor(''); setValorAluguel(''); setCaucaoValor(''); setFiadorNome('');
      setQuadra(''); setLote(''); setAreaM2(''); setAreaHa(''); setRendaFamiliar('');
      setAreaConstruida(''); setCondominio('');
      setCib('');
      setObservacoes('');
    } catch (e) {
      setErro(`Não foi possível salvar: ${e?.message || 'erro desconhecido'}`);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    if (!tenantId) return;
    await deleteDoc(doc(db, 'oficinas', tenantId, 'imoveis_nicho', id));
  }

  const Icone = ICONES[nicho] || Home;

  return (
    <div className={`${card} p-5 md:p-6`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: E }}>
            <Icone size={13} /> Captação por Nicho · Travas Legais
          </p>
          <h3 className="mt-1 text-lg font-black text-white">Formulário Dinâmico</h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Cadastre em 1 minuto sem esquecer nenhum detalhe: os campos se adaptam sozinhos para Minha Casa Minha Vida,
            Rural, Loteamento, Alto Padrão ou Locação.
          </p>
        </div>
      </div>

      <SeletorUF className="mb-4" onChange={setPrefs} />

      {/* seletor de nicho */}
      <div className="mb-5 flex flex-wrap gap-2">
        {NICHOS_CAPTACAO.map((n) => {
          const ativo = nicho === n.key;
          return (
            <button
              key={n.key}
              onClick={() => { setNicho(n.key); setErro(''); setOk(''); }}
              className={`rounded-full border px-3.5 py-2 text-[11px] font-bold transition ${ativo
                ? 'border-white bg-white text-slate-900'
                : 'border-white/10 text-slate-300 hover:border-white/30'}`}
            >
              <span className="mr-1">{n.icone}</span> {n.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={labelCls}>Referência do imóvel</label>
          <div className="relative">
            <input
              className={`${inputCls} pr-11`}
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ex: CASA-JD-12"
            />
            <MicButton
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
              onTexto={(texto) => setReferencia((v) => (v ? `${v} ${texto}` : texto))}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Cidade / bairro</label>
          <div className="relative">
            <input
              className={`${inputCls} pr-11`}
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Uberlândia - MG"
            />
            <MicButton
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
              onTexto={(texto) => setCidade((v) => (v ? `${v} ${texto}` : texto))}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Valor do imóvel (R$)</label>
          <CampoMoeda className={inputCls} valor={valor} onChange={setValor} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <label className={`${labelCls} mb-0`}>CIB (Cadastro Imobiliário Brasileiro) — Opcional</label>
            <button
              type="button"
              onClick={() => setDicaCibAberta((v) => !v)}
              aria-expanded={dicaCibAberta}
              aria-label="O que é o CIB?"
              title="O que é o CIB?"
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-600 text-slate-400 transition hover:border-[#10b981] hover:text-[#10b981]"
            >
              <HelpCircle size={11} />
            </button>
          </div>
          <input className={inputCls} value={cib} onChange={(e) => setCib(e.target.value)} placeholder="20 dígitos" />
          {dicaCibAberta ? (
            <p className="mt-1 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-[10px] leading-snug text-slate-400">
              É o &quot;CPF do imóvel&quot; na Receita Federal. Se você não tiver o número agora, deixe em branco.
            </p>
          ) : null}
          {cib ? (
            <p className={`mt-1 text-[10px] font-bold ${validarCib(cib).ok ? 'text-[#10b981]' : 'text-rose-400'}`}>
              {validarCib(cib).ok ? `válido · ${formatarCib(cib)}` : validarCib(cib).erro}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <label className={labelCls}>Descrição / observações</label>
        <div className="relative">
          <textarea
            className={`${inputCls} resize-y pr-12`}
            rows={3}
            maxLength={600}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: casa reformada, quintal nos fundos, aceita permuta por apartamento."
          />
          <MicButton
            className="absolute right-2 top-2"
            onTexto={(texto) => setObservacoes((v) => (v ? `${v} ${texto}` : texto))}
          />
        </div>
        <p className="mt-1 text-right text-[10px] text-slate-600">{observacoes.length}/600</p>
      </div>

      {/* ─── LOCAÇÃO ─── */}
      {nicho === 'locacao' && (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="flex items-start gap-2 text-[11px] font-bold text-amber-200">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              {AVISO_NULIDADE_GARANTIA}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {GARANTIAS_LOCATICIA.map((g) => {
              const ativo = garantia === g.key;
              return (
                <button
                  key={g.key}
                  onClick={() => marcarGarantia(g.key)}
                  className={`rounded-2xl border p-3 text-left transition ${ativo
                    ? 'border-[#10b981] bg-[#10b981]/10'
                    : 'border-slate-800 hover:border-slate-600'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-white">{g.label}</span>
                    {ativo ? <Check size={15} color={E} /> : <span className="text-[10px] text-slate-500">selecionar</span>}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-slate-400">{g.detalhe}</p>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelCls}>Aluguel mensal (R$)</label>
              <CampoMoeda className={inputCls} valor={valorAluguel} onChange={setValorAluguel} />
            </div>
            {garantia === 'caucao' && (
              <div>
                <label className={labelCls}>Caução (máx. 3 aluguéis)</label>
                <CampoMoeda className={inputCls} valor={caucaoValor} onChange={setCaucaoValor} />
                {parseMoedaBR(valorAluguel) > 0 && (
                  <p className="mt-1 text-[10px] text-slate-500">Limite legal: {fmtBRL(parseMoedaBR(valorAluguel) * 3)}</p>
                )}
              </div>
            )}
            {garantia === 'fiador' && (
              <div>
                <label className={labelCls}>Nome do fiador</label>
                <input className={inputCls} value={fiadorNome} onChange={(e) => setFiadorNome(e.target.value)} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── RURAL ─── */}
      {nicho === 'rural' && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Área (hectares)</label>
              <input className={inputCls} value={areaHa} onChange={(e) => setAreaHa(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <label className={labelCls}>Aptidão agrícola</label>
              <select className={inputCls} value={aptidao} onChange={(e) => setAptidao(e.target.value)}>
                <option value="lavoura">Lavoura</option>
                <option value="pastagem">Pastagem</option>
                <option value="misto">Misto</option>
                <option value="silvicultura">Silvicultura</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 p-4">
            <p className={labelCls}>Checklist de cartório (obrigatório)</p>
            <div className="mt-2 space-y-2">
              {CHECKLIST_RURAL.map((item) => {
                const marcado = !!checklist[item.key];
                return (
                  <label key={item.key} className="flex cursor-pointer items-start gap-3 rounded-xl p-2 hover:bg-white/[0.03]">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={(e) => setChecklist((c) => ({ ...c, [item.key]: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 accent-[#10b981]"
                    />
                    <span>
                      <span className="text-xs font-bold text-white">
                        {item.label}
                        {item.obrigatorio && <span className="ml-1 text-[9px] font-black uppercase" style={{ color: E }}>obrigatório</span>}
                      </span>
                      <span className="block text-[11px] text-slate-500">{item.detalhe}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className={`mt-3 text-[11px] font-bold ${rural.ok ? 'text-[#10b981]' : 'text-amber-300'}`}>
              {rural.ok ? 'Documentação completa — pode registrar.' : rural.erro}
            </p>
          </div>
        </div>
      )}

      {/* ─── LOTEAMENTO ─── */}
      {nicho === 'loteamento' && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelCls}>Quadra</label>
              <input className={inputCls} value={quadra} onChange={(e) => setQuadra(e.target.value)} placeholder="Q-04" />
            </div>
            <div>
              <label className={labelCls}>Lote</label>
              <input className={inputCls} value={lote} onChange={(e) => setLote(e.target.value)} placeholder="L-12" />
            </div>
            <div>
              <label className={labelCls}>Área do lote (m²)</label>
              <input className={inputCls} value={areaM2} onChange={(e) => setAreaM2(e.target.value)} inputMode="decimal" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Infraestrutura entregue</label>
            <div className="flex flex-wrap gap-2">
              {['Asfalto', 'Água', 'Esgoto', 'Energia', 'Gás', 'Fibra'].map((item) => {
                const ativo = !!infra[item];
                return (
                  <button
                    key={item}
                    onClick={() => setInfra((i) => ({ ...i, [item]: !i[item] }))}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${ativo
                      ? 'border-[#10b981] bg-[#10b981]/15 text-[#10b981]'
                      : 'border-slate-800 text-slate-400'}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── MCMV ─── */}
      {nicho === 'mcmv' && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Renda familiar mensal (R$)</label>
              <CampoMoeda className={inputCls} valor={rendaFamiliar} onChange={setRendaFamiliar} />
            </div>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={usaFgts} onChange={(e) => setUsaFgts(e.target.checked)} className="h-4 w-4 accent-[#10b981]" />
                Vai usar FGTS
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={outroImovel} onChange={(e) => setOutroImovel(e.target.checked)} className="h-4 w-4 accent-[#10b981]" />
                Já possui imóvel residencial
              </label>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {FAIXAS_MCMV.map((f) => (
              <div key={f.key} className={`rounded-2xl border p-3 ${mcmv.faixa?.key === f.key ? 'border-[#10b981] bg-[#10b981]/10' : 'border-slate-800'}`}>
                <p className="text-xs font-black text-white">{f.label}</p>
                <p className="text-[11px] text-slate-400">{f.descricao}</p>
                <p className="mt-1 text-[11px] text-slate-500">Subsídio ref.: {fmtBRL(f.subsidioReferencia)}</p>
              </div>
            ))}
          </div>

          <div className={`rounded-2xl border p-4 ${mcmv.elegivel ? 'border-[#10b981]/40 bg-[#10b981]/5' : 'border-amber-500/40 bg-amber-500/5'}`}>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Teto do imóvel para {tetoPorte.porte}: {tetoPorte.tetoFormatado}
            </p>
            {Number(rendaFamiliar) === 0 ? (
              <p className="text-[11px] text-slate-400">Informe a renda familiar para simular a elegibilidade.</p>
            ) : mcmv.elegivel ? (
              <div className="text-[11px] text-slate-300">
                <p className="font-black text-[#10b981]">Elegível — {mcmv.faixa.label}</p>
                <p className="mt-1">Subsídio de referência {fmtBRL(mcmv.subsidioReferencia)} · juros {mcmv.jurosReferencia}% a.a.
                  {mcmv.parcelaAproximada ? ` · parcela estimada ${fmtBRL(mcmv.parcelaAproximada)} em 360 meses.` : ''}</p>
              </div>
            ) : (
              <ul className="list-inside list-disc text-[11px] text-amber-200">
                {mcmv.impedimentos.map((i) => <li key={i}>{i}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ─── ALTO PADRÃO ─── */}
      {nicho === 'alto_padrao' && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelCls}>Área construída (m²)</label>
            <input className={inputCls} value={areaConstruida} onChange={(e) => setAreaConstruida(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className={labelCls}>Condomínio mensal (R$)</label>
            <CampoMoeda className={inputCls} valor={condominio} onChange={setCondominio} />
          </div>
        </div>
      )}

      {/* feedback */}
      {erro && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-[11px] font-bold text-rose-200">
          <X size={14} className="mt-0.5 shrink-0" /> {erro}
        </p>
      )}
      {ok && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 p-3 text-[11px] font-bold text-[#10b981]">
          <Check size={14} className="mt-0.5 shrink-0" /> {ok}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <ShieldCheck size={13} /> {NICHOS_CAPTACAO.find((n) => n.key === nicho)?.base}
        </span>
        <div className="flex items-center gap-2">
          {nicho === 'rural' && !rural.ok && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              {rural.faltando.length} pendência(s)
            </span>
          )}
          <button
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-950 transition hover:brightness-110 disabled:opacity-60"
            style={{ backgroundColor: E }}
          >
            {salvando ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />} Salvar captação
          </button>
        </div>
      </div>

      {salvos.length > 0 && (
        <div className="mt-5 border-t border-slate-800 pt-4">
          <p className={labelCls}>Captações salvas ({salvos.length})</p>
          <div className="mt-2 space-y-1.5">
            {salvos.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2">
                <span className="truncate text-[11px] text-slate-300">
                  <span className="font-black text-white">{s.referencia || s.id}</span> · {s.nicho}
                  {s.garantia ? ` · ${s.garantia}` : ''}{s.faixa ? ` · ${s.faixa}` : ''}
                </span>
                <button onClick={() => excluir(s.id)} className="text-slate-500 hover:text-rose-400" title="Excluir">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
