import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Check, ClipboardList, Landmark, MapPin, ShieldCheck, Home, KeyRound,
  HelpCircle, LoaderCircle, Save, Trash2, X, Mic, MicOff, Sparkles, Copy, Video,
  FileText, Layers, Layers2,
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
import { processarCaptacaoCampoIA } from '../../agent/captacaoCampoPrompt';

const E = '#10b981';
const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]';

const ICONES = { rural: Landmark, loteamento: MapPin, mcmv: Home, alto_padrao: ShieldCheck, locacao: KeyRound };

const fmtBRL = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const ROTULO_NICHO = {
  locacao: 'Locação',
  rural: 'Rural',
  loteamento: 'Loteamento',
  mcmv: 'Minha Casa Minha Vida',
  alto_padrao: 'Alto padrão',
};

/**
 * Registro de `imoveis_nicho` → forma que a Prestação de Contas entende
 * (mesmos nomes de campo de `imoveis_imobi`). Sem tradução o relatório
 * mostraria "sem código" e "sem metragem" mesmo com o dado digitado.
 */
function paraPrestacao(registro = {}) {
  const areaM2 = Number(registro.areaM2) || Number(registro.areaTotal) || 0;
  const areaHa = Number(registro.areaHa) || 0;
  return {
    ...registro,
    codigo: registro.referencia || registro.codigo || '',
    titulo: [ROTULO_NICHO[registro.nicho], registro.bairro, registro.cidade].filter(Boolean).join(' · ') || 'Captação por nicho',
    tipo: registro.subtipo || ROTULO_NICHO[registro.nicho] || 'Imóvel',
    metragemTerreno: areaM2 || Number(registro.metragemTerreno) || 0,
    hectares: areaHa || Number(registro.hectares) || 0,
    areaConstruida: Number(registro.areaConstruida) || 0,
    valor: Number(registro.valor) || Number(registro.valorAluguel) || 0,
  };
}

export default function CaptacaoNicho({ dadosOficina, setAbaAtiva, onAbrirPrestacao }) {
  const tenantId = dadosOficina?.id || dadosOficina?.uid || null;

  const [nicho, setNicho] = useState('locacao');
  const [prefs, setPrefs] = useState(() => lerPreferencias());
  const [salvos, setSalvos] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  // ─── Captação por Voz em Campo & Kit Comercial (IA) ───
  const [transcricaoAudio, setTranscricaoAudio] = useState('');
  const [gravandoCampo, setGravandoCampo] = useState(false);
  const [processandoIA, setProcessandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [erroAudio, setErroAudio] = useState('');
  const [okAudio, setOkAudio] = useState('');
  const [copiadoCampo, setCopiadoCampo] = useState(null);
  const recognitionRef = useRef(null);

  // campos comuns do imóvel
  const [referencia, setReferencia] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [endereco, setEndereco] = useState('');
  const [valor, setValor] = useState('');
  const [cib, setCib] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [dicaCibAberta, setDicaCibAberta] = useState(false);

  // dados técnicos captados / formulário
  const [tipologia, setTipologia] = useState('Urbano');
  const [subtipo, setSubtipo] = useState('');
  const [areaTotal, setAreaTotal] = useState('');
  const [areaConstruida, setAreaConstruida] = useState('');
  const [quartos, setQuartos] = useState('');
  const [suites, setSuites] = useState('');
  const [vagas, setVagas] = useState('');
  const [padraoConstrutivo, setPadraoConstrutivo] = useState('');
  const [conservacao, setConservacao] = useState('');

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
  const [condominio, setCondominio] = useState('');

  // Carrega rascunho exportado da Avaliação de Imóvel (se houver)
  useEffect(() => {
    try {
      const salvo = localStorage.getItem('express_imobi_rascunho_captacao');
      if (salvo) {
        const dados = JSON.parse(salvo);
        if (dados.cidade) setCidade(dados.cidade);
        if (dados.bairro) setBairro(dados.bairro);
        if (dados.valor) setValor(String(dados.valor));
        if (dados.referencia) setReferencia(dados.referencia);
        if (dados.areaM2) setAreaM2(String(dados.areaM2));
        if (dados.areaTotal) setAreaTotal(String(dados.areaTotal));
        if (dados.areaConstruida) setAreaConstruida(String(dados.areaConstruida));
        if (dados.nicho) setNicho(dados.nicho);
        if (dados.observacoes) setObservacoes(dados.observacoes);
        setOk('Dados importados com sucesso da Avaliação de Imóvel!');
        localStorage.removeItem('express_imobi_rascunho_captacao');
      }
    } catch {}
  }, []);

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

  // ─── Reconhecimento de Voz (SpeechRecognition em pt-BR) ───
  const alternarGravacaoAudio = () => {
    if (gravandoCampo) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      setGravandoCampo(false);
    } else {
      const SpeechRec = typeof window !== 'undefined'
        ? (window.SpeechRecognition || window.webkitSpeechRecognition)
        : null;

      if (!SpeechRec) {
        setErroAudio('Reconhecimento de voz não suportado neste navegador. Digite ou cole a transcrição no campo abaixo.');
        return;
      }

      try {
        const recognition = new SpeechRec();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setGravandoCampo(true);
          setErroAudio('');
        };

        recognition.onresult = (event) => {
          let textoAtual = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              const pedaco = event.results[i][0].transcript;
              setTranscricaoAudio((prev) => (prev ? `${prev} ${pedaco}`.trim() : pedaco.trim()));
            } else {
              textoAtual += event.results[i][0].transcript;
            }
          }
        };

        recognition.onerror = (e) => {
          console.warn('Erro no microfone:', e);
          setGravandoCampo(false);
        };

        recognition.onend = () => {
          setGravandoCampo(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('Falha ao iniciar microfone:', err);
        setGravandoCampo(false);
      }
    }
  };

  // ─── Processar Captação de Campo com IA ───
  async function processarAudioComIA() {
    if (!transcricaoAudio.trim()) {
      setErroAudio('Grave ou cole a transcrição do áudio gravado em campo antes de processar com a IA.');
      return;
    }
    if (gravandoCampo) {
      alternarGravacaoAudio();
    }

    setProcessandoIA(true);
    setErroAudio('');
    setOkAudio('');

    try {
      const dados = await processarCaptacaoCampoIA({
        transcricao: transcricaoAudio,
        endereco: [endereco, bairro, cidade].filter(Boolean).join(', '),
        valorPedido: valor,
      });

      setResultadoIA(dados);

      // Preenchimento inteligente da ficha técnica (preserva o que o usuário já digitou)
      const dt = dados.dadosTecnicos || {};

      if (dt.cidade && !cidade) setCidade(dt.cidade);
      if (dt.bairro && !bairro) setBairro(dt.bairro);
      if (dt.endereco && !endereco) setEndereco(dt.endereco);
      if (dt.tipologia) setTipologia(dt.tipologia);
      if (dt.subtipo) setSubtipo(dt.subtipo);

      // Autoajuste inteligente do nicho com base no subtipo/tipologia detectado
      if (dt.tipologia || dt.subtipo) {
        const tL = String(dt.tipologia || '').toLowerCase();
        const sL = String(dt.subtipo || '').toLowerCase();
        if (tL.includes('rural') || sL.includes('chácara') || sL.includes('chacara') || sL.includes('fazenda')) {
          setNicho('rural');
        } else if (sL.includes('lote') || sL.includes('terreno')) {
          setNicho('loteamento');
        } else if (dt.padraoConstrutivo === 'Luxo' || dt.padraoConstrutivo === 'Alto') {
          setNicho('alto_padrao');
        } else if (dt.padraoConstrutivo === 'Popular') {
          setNicho('mcmv');
        }
      }

      if (dt.areaTotal != null) {
        setAreaTotal(String(dt.areaTotal));
        setAreaM2(String(dt.areaTotal));
      }
      if (dt.areaConstruida != null) {
        setAreaConstruida(String(dt.areaConstruida));
      }
      if (dt.quartos != null) setQuartos(String(dt.quartos));
      if (dt.suites != null) setSuites(String(dt.suites));
      if (dt.vagas != null) setVagas(String(dt.vagas));
      if (dt.padraoConstrutivo) setPadraoConstrutivo(dt.padraoConstrutivo);
      if (dt.conservacao) setConservacao(dt.conservacao);

      if (dt.valorPedido != null && !valor) {
        setValor(String(dt.valorPedido));
      }

      if (!referencia && (dt.subtipo || dt.bairro || dt.cidade)) {
        const tagSub = (dt.subtipo || 'IMOVEL').toUpperCase().replace(/[^\w]/g, '').slice(0, 4);
        const tagLoc = (dt.bairro || dt.cidade || 'NOVO').toUpperCase().replace(/[^\w]/g, '').slice(0, 4);
        setReferencia(`${tagSub}-${tagLoc}-${Math.floor(10 + Math.random() * 90)}`);
      }

      if (dados.materialComercial?.descricaoPortal && !observacoes) {
        setObservacoes(dados.materialComercial.descricaoPortal.slice(0, 580));
      }

      setOkAudio('Ficha do imóvel preenchida com sucesso e Kit Portais & Reels gerado!');
    } catch (e) {
      setErroAudio(`Falha ao processar áudio de campo: ${e?.message || 'erro desconhecido'}`);
    } finally {
      setProcessandoIA(false);
    }
  }

  function copiarTexto(texto, chave) {
    if (!texto) return;
    try {
      navigator.clipboard?.writeText(texto);
      setCopiadoCampo(chave);
      setTimeout(() => setCopiadoCampo(null), 2500);
    } catch {}
  }

  function montarRegistro() {
    const base = {
      nicho, referencia, cidade, bairro, endereco, tipologia, subtipo,
      quartos: quartos ? Number(quartos) : null,
      suites: suites ? Number(suites) : null,
      vagas: vagas ? Number(vagas) : null,
      padraoConstrutivo, conservacao,
      areaTotal: areaTotal ? Number(areaTotal) : (Number(areaM2) || 0),
      valor: parseMoedaBR(valor),
      cib: cib.replace(/\D/g, ''),
      observacoes: observacoes.trim(),
      materialComercial: resultadoIA?.materialComercial || null,
      analiseMercado: resultadoIA?.analiseMercado || null,
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
      return { ...base, quadra, lote, areaM2: Number(areaM2) || Number(areaTotal) || 0, infraestrutura: Object.keys(infra).filter((k) => infra[k]) };
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
      setOk('Captação salva com Kit Portais & Reels integrado.');
      setReferencia(''); setValor(''); setValorAluguel(''); setCaucaoValor(''); setFiadorNome('');
      setQuadra(''); setLote(''); setAreaM2(''); setAreaHa(''); setRendaFamiliar('');
      setAreaConstruida(''); setCondominio('');
      setCib('');
      setObservacoes('');
      setBairro(''); setEndereco(''); setSubtipo(''); setAreaTotal(''); setQuartos(''); setSuites(''); setVagas('');
      setPadraoConstrutivo(''); setConservacao('');
      setResultadoIA(null); setTranscricaoAudio('');
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

      {/* ─── PAINEL CAPTAÇÃO POR VOZ EM CAMPO (IA) ─── */}
      <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-[#060a10] p-5 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="text-sm font-black text-white tracking-tight">Captação por Voz em Campo (IA)</h4>
              <p className="text-[11px] text-slate-400">Grave suas impressões ao vivo na visita ou cole suas anotações.</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
            PLANO PRO · NBR 14653 / COFECI
          </span>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <textarea
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 pr-28 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              rows={3}
              placeholder="Ex: 'Apartamento no 4º andar no bairro Funcionários, 3 quartos sendo 1 suíte, 2 vagas livres, 98 metros de área útil. Posição solar nascente, precisa apenas de uma pintura. Proprietário pede 520 mil à vista.'"
              value={transcricaoAudio}
              onChange={(e) => setTranscricaoAudio(e.target.value)}
            />
            <div className="absolute right-2 top-2.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={alternarGravacaoAudio}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                  gravandoCampo
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                    : 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-emerald-500 hover:text-emerald-400'
                }`}
                title={gravandoCampo ? 'Parar gravação de voz' : 'Gravar áudio de campo'}
              >
                {gravandoCampo ? <MicOff size={14} /> : <Mic size={14} />}
                <span>{gravandoCampo ? 'Parar Gravação' : 'Gravar Áudio de Campo'}</span>
              </button>
            </div>
          </div>

          {gravandoCampo && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Ouvindo em tempo real (pt-BR)... Fale livremente sobre o imóvel.</span>
            </div>
          )}

          {erroAudio && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5">
              <AlertTriangle size={14} /> {erroAudio}
            </p>
          )}

          {okAudio && (
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <Check size={14} /> {okAudio}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <span className="text-[11px] text-slate-500">
              A IA preenche a ficha técnica e gera o Kit completo de anúncios sem consumir tokens na transcrição.
            </span>
            <button
              type="button"
              onClick={processarAudioComIA}
              disabled={processandoIA || !transcricaoAudio.trim()}
              style={{ backgroundColor: E }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black text-slate-950 transition hover:brightness-110 disabled:opacity-40 cursor-pointer shadow-md shadow-emerald-500/20"
            >
              {processandoIA ? (
                <>
                  <LoaderCircle size={14} className="animate-spin" />
                  <span>Analisando e Gerando Kit...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Preencher Ficha & Gerar Anúncio/Reels</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── BLOCO DE MATERIAL COMERCIAL & ANÁLISE RÁPIDA (KIT PORTAIS & REELS) ─── */}
      {resultadoIA && (
        <div className="mb-6 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-emerald-400" />
              <h4 className="text-sm font-black text-white uppercase tracking-wide">
                Kit Portais & Reels Gerado com IA
              </h4>
            </div>
            {resultadoIA.analiseMercado?.valorM2Pedido ? (
              <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-black text-emerald-400">
                Valor estimado: {fmtBRL(resultadoIA.analiseMercado.valorM2Pedido)} / m²
              </span>
            ) : null}
          </div>

          {resultadoIA.analiseMercado?.observacaoTecnica && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-400 uppercase text-[10px] block mb-0.5">Diagnóstico Técnico</span>
              {resultadoIA.analiseMercado.observacaoTecnica}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Card Anúncio Portais */}
            <div className="rounded-xl border border-slate-800 bg-[#0B1215] p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                    <FileText size={14} className="text-emerald-400" /> Anúncio para Portais (ZAP / VivaReal / OLX)
                  </span>
                  <button
                    type="button"
                    onClick={() => copiarTexto(
                      `${resultadoIA.materialComercial?.tituloAnuncio || ''}\n\n${resultadoIA.materialComercial?.descricaoPortal || ''}`,
                      'anuncio'
                    )}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:border-emerald-500 hover:text-white transition cursor-pointer"
                  >
                    {copiadoCampo === 'anuncio' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiadoCampo === 'anuncio' ? 'Copiado!' : 'Copiar Anúncio'}</span>
                  </button>
                </div>
                <h5 className="text-xs font-bold text-emerald-400 mb-1.5">
                  {resultadoIA.materialComercial?.tituloAnuncio}
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {resultadoIA.materialComercial?.descricaoPortal}
                </p>
              </div>
            </div>

            {/* Card Roteiro Reels 35s */}
            <div className="rounded-xl border border-slate-800 bg-[#0B1215] p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                    <Video size={14} className="text-purple-400" /> Roteiro Reels / TikTok 35s
                  </span>
                  <button
                    type="button"
                    onClick={() => copiarTexto(resultadoIA.materialComercial?.roteiroReels || '', 'reels')}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:border-purple-500 hover:text-white transition cursor-pointer"
                  >
                    {copiadoCampo === 'reels' ? <Check size={12} className="text-purple-400" /> : <Copy size={12} />}
                    <span>{copiadoCampo === 'reels' ? 'Copiado!' : 'Copiar Roteiro'}</span>
                  </button>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto font-sans">
                  {resultadoIA.materialComercial?.roteiroReels}
                </div>
              </div>
            </div>
          </div>

          {/* Ficha Técnica Limpa */}
          {resultadoIA.materialComercial?.fichaTecnica && (
            <div className="rounded-xl border border-slate-800 bg-[#0B1215] p-3.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase text-[10px]">Ficha Técnica Resumida</span>
                <button
                  type="button"
                  onClick={() => copiarTexto(resultadoIA.materialComercial?.fichaTecnica || '', 'ficha')}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  {copiadoCampo === 'ficha' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copiadoCampo === 'ficha' ? 'Copiado!' : 'Copiar Ficha'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">
                {resultadoIA.materialComercial?.fichaTecnica}
              </p>
            </div>
          )}
        </div>
      )}

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
          <label className={labelCls}>Cidade</label>
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
          <label className={labelCls}>Bairro</label>
          <div className="relative">
            <input
              className={`${inputCls} pr-11`}
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Ex: Jardim dos Ipês"
            />
            <MicButton
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
              onTexto={(texto) => setBairro((v) => (v ? `${v} ${texto}` : texto))}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Endereço / Logradouro</label>
          <div className="relative">
            <input
              className={`${inputCls} pr-11`}
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex: Rua das Flores, 120"
            />
            <MicButton
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
              onTexto={(texto) => setEndereco((v) => (v ? `${v} ${texto}` : texto))}
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

      {/* Grid de Dados Técnicos Complementares */}
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <div>
          <label className={labelCls}>Tipologia / Subtipo</label>
          <input
            className={inputCls}
            value={subtipo || tipologia}
            onChange={(e) => setSubtipo(e.target.value)}
            placeholder="Ex: Apartamento, Casa, Sobrado"
          />
        </div>
        <div>
          <label className={labelCls}>Quartos / Suítes / Vagas</label>
          <div className="grid grid-cols-3 gap-1.5">
            <input
              className={`${inputCls} text-center px-1`}
              value={quartos}
              onChange={(e) => setQuartos(e.target.value)}
              placeholder="Qts"
              title="Quartos"
              type="number"
            />
            <input
              className={`${inputCls} text-center px-1`}
              value={suites}
              onChange={(e) => setSuites(e.target.value)}
              placeholder="Sts"
              title="Suítes"
              type="number"
            />
            <input
              className={`${inputCls} text-center px-1`}
              value={vagas}
              onChange={(e) => setVagas(e.target.value)}
              placeholder="Vgs"
              title="Vagas de Garagem"
              type="number"
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Padrão Construtivo</label>
          <select
            className={inputCls}
            value={padraoConstrutivo}
            onChange={(e) => setPadraoConstrutivo(e.target.value)}
          >
            <option value="">Selecione...</option>
            <option value="Popular">Popular</option>
            <option value="Normal">Normal</option>
            <option value="Médio-Alto">Médio-Alto</option>
            <option value="Alto">Alto</option>
            <option value="Luxo">Luxo</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Estado de Conservação</label>
          <select
            className={inputCls}
            value={conservacao}
            onChange={(e) => setConservacao(e.target.value)}
          >
            <option value="">Selecione...</option>
            <option value="Novo">Novo</option>
            <option value="Ótimo">Ótimo</option>
            <option value="Bom">Bom</option>
            <option value="Regular">Regular</option>
            <option value="Necessita Reforma">Necessita Reforma</option>
          </select>
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

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Valor do aluguel mensal (R$)</label>
              <CampoMoeda className={inputCls} valor={valorAluguel} onChange={setValorAluguel} />
            </div>
            <div>
              <label className={labelCls}>Garantia locatícia</label>
              <div className="grid grid-cols-2 gap-2">
                {GARANTIAS_LOCATICIA.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => marcarGarantia(g.key)}
                    className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                      garantia === g.key
                        ? 'border-[#10b981] bg-[#10b981]/10 text-white font-bold'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── RURAL ─── */}
      {nicho === 'rural' && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Área em Hectares (ha)</label>
              <input
                className={inputCls}
                value={areaHa}
                onChange={(e) => setAreaHa(e.target.value)}
                placeholder="Ex: 120"
                type="number"
              />
            </div>
            <div>
              <label className={labelCls}>Aptidão da terra</label>
              <select className={inputCls} value={aptidao} onChange={(e) => setAptidao(e.target.value)}>
                <option value="lavoura">Lavoura / Agricultura</option>
                <option value="pecuaria">Pecuária</option>
                <option value="mista">Mista (Lavoura e Pecuária)</option>
                <option value="reflorestamento">Reflorestamento</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Checklist Registral & Ambiental Obrigatório</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {CHECKLIST_RURAL.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 cursor-pointer hover:border-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checklist[c.key])}
                    onChange={(e) => setChecklist({ ...checklist, [c.key]: e.target.checked })}
                    className="accent-[#10b981]"
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── LOTEAMENTO ─── */}
      {nicho === 'loteamento' && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelCls}>Quadra</label>
              <input className={inputCls} value={quadra} onChange={(e) => setQuadra(e.target.value)} placeholder="Ex: Q-04" />
            </div>
            <div>
              <label className={labelCls}>Lote</label>
              <input className={inputCls} value={lote} onChange={(e) => setLote(e.target.value)} placeholder="Ex: 12" />
            </div>
            <div>
              <label className={labelCls}>Área do lote (m²)</label>
              <input
                className={inputCls}
                value={areaM2 || areaTotal}
                onChange={(e) => { setAreaM2(e.target.value); setAreaTotal(e.target.value); }}
                placeholder="Ex: 360"
                type="number"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── MCMV ─── */}
      {nicho === 'mcmv' && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Renda familiar bruta mensal (R$)</label>
              <CampoMoeda className={inputCls} valor={rendaFamiliar} onChange={setRendaFamiliar} />
            </div>
            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usaFgts}
                  onChange={(e) => setUsaFgts(e.target.checked)}
                  className="accent-[#10b981]"
                />
                <span>Utilizar saldo de FGTS</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={outroImovel}
                  onChange={(e) => setOutroImovel(e.target.checked)}
                  className="accent-[#10b981]"
                />
                <span>Possui outro imóvel</span>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Simulação MCMV:</span>
              <span className={`font-black ${mcmv.elegivel ? 'text-emerald-400' : 'text-amber-400'}`}>
                {mcmv.elegivel ? `Elegível · ${mcmv.faixa?.label || 'Faixa 1/2'}` : 'Atenção aos limites'}
              </span>
            </div>
            {!mcmv.elegivel && mcmv.impedimentos?.length > 0 && (
              <ul className="mt-2 space-y-1 text-[11px] text-amber-200/80">
                {mcmv.impedimentos.map((imp, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="text-amber-400">•</span> {imp}
                  </li>
                ))}
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
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-950 transition hover:brightness-110 disabled:opacity-60 cursor-pointer"
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
                  {s.bairro ? ` · ${s.bairro}` : ''}{s.cidade ? ` · ${s.cidade}` : ''}
                  {s.garantia ? ` · ${s.garantia}` : ''}{s.faixa ? ` · ${s.faixa}` : ''}
                </span>
                <button onClick={() => excluir(s.id)} className="text-slate-500 hover:text-rose-400 cursor-pointer" title="Excluir">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          {onAbrirPrestacao ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-teal-500/30 bg-teal-500/5 px-3 py-2">
              <p className="text-[10px] leading-snug text-teal-200/80">
                Prestação de contas ao proprietário: use a captação salva como base do relatório.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ultima = salvos[0];
                    if (ultima) onAbrirPrestacao(paraPrestacao(ultima));
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-teal-500/50 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-teal-300 transition hover:bg-teal-500/10 cursor-pointer"
                >
                  <ClipboardList size={12} /> Abrir prestação
                </button>
                <button
                  type="button"
                  onClick={() => setAbaAtiva?.('mapa_inteligencia')}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-300 transition hover:border-slate-500 cursor-pointer"
                >
                  <MapPin size={12} /> Mapa de inteligência
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
