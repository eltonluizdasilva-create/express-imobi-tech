import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Ruler, Copy, Check, Printer, Sparkles, AlertTriangle, TrendingUp,
  Building2, MapPin, Gauge, FileText, MessageSquare, Info, ChevronDown, ChevronUp, Stamp,
  Camera, X, Loader2, ScanSearch, Mic, Trash2, Video, ArrowRight,
  Compass, Navigation, Plus,
} from 'lucide-react';
import HeroAba from '../admin/HeroAba';
import GuiaDaAba from '../ui/GuiaDaAba';
import SeletorUF from '../ui/SeletorUF';
import { corDaAba, heroDaAba } from '../../lib/coresAbas';
import { lerPreferencias } from '../../lib/preferencias';
import LaudoExecutivo from './LaudoExecutivo';
import useLaudoImobi, { comprimirImagem, CDI_PADRAO, FII_TIJOLO_PADRAO } from '../../hooks/useLaudoImobi.js';
import { raioXDaVizinhanca } from '../../services/vizinhancaService.js';
import {
  avaliarImovel, gerarPTAM, gerarResumoComercial, gerarDocumentoHtmlPTAM, identidadeDocumento,
  TIPOLOGIAS, PADROES, ESTADOS_CONSERVACAO, TOPOGRAFIAS, CONDICOES_TESTADA, FINALIDADES_PTAM,
} from '../../lib/avaliacao';
import { processarCaptacaoCampoIA } from '../../agent/captacaoCampoPrompt';
import {
  CATEGORIAS_RADAR, IMPACTOS_RADAR, ANCORAS_PREDEFINIDAS,
  calcularIndiceLiquidez, gerarParecerFatorLocalizacao, gerarArgumentoWhatsAppLocalizacao,
} from '../../lib/radarEntorno';

const card = 'bg-[#020408] border border-slate-800 rounded-3xl';
const labelCls = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5';
const inputCls = 'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]';
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export default function AvaliacaoImovel({ setAbaAtiva, onExportarCaptacao }) {
  const corAba = corDaAba('avaliacao_imovel');
  const prefs = lerPreferencias();

  const [uf, setUf] = useState(prefs.ufPadrao);
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [tipologia, setTipologia] = useState('urbano');
  const [padrao, setPadrao] = useState('normal');
  const [estado, setEstado] = useState('bom');
  const [topografia, setTopografia] = useState('plano');
  const [condicoes, setCondicoes] = useState([]);
  const [areaTotal, setAreaTotal] = useState('');
  const [areaConstruida, setAreaConstruida] = useState('');
  const [comparaveis, setComparaveis] = useState([
    { valor: '', area: '', distanciaKm: '', oferta: true },
    { valor: '', area: '', distanciaKm: '', oferta: true },
    { valor: '', area: '', distanciaKm: '', oferta: true },
  ]);

  const [abrirEmissao, setAbrirEmissao] = useState(false);
  const [corretorNome, setCorretorNome] = useState('');
  const [creci, setCreci] = useState('');
  const [cnai, setCnai] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [matricula, setMatricula] = useState('');
  const [finalidade, setFinalidade] = useState('venda');

  const [abaSaida, setAbaSaida] = useState('resumo');
  const [copiado, setCopiado] = useState(false);

  // --- Laudo executivo 5 agentes ---
  const [cep, setCep] = useState('');
  const [valorPedido, setValorPedido] = useState('');
  const [cdi, setCdi] = useState(CDI_PADRAO);
  const [fii, setFii] = useState(FII_TIJOLO_PADRAO);
  const [fotos, setFotos] = useState([]);
  const [erroFoto, setErroFoto] = useState('');
  const [vizCarregando, setVizCarregando] = useState(false);
  const {
    fase, carregando: gerandoLaudo, erro: erroLaudo, laudo,
    analiseFotos, vizinhanca, meta, gerar: gerarLaudoIA, setVizinhanca,
  } = useLaudoImobi();

  // ─── Captação de Campo por Áudio com IA (ABNT NBR 14653 / COFECI) ───────────
  const [audioCampoAberto, setAudioCampoAberto] = useState(false);
  const [transcricaoAudio, setTranscricaoAudio] = useState('');
  const [gravandoCampo, setGravandoCampo] = useState(false);
  const [processandoIA, setProcessandoIA] = useState(false);
  const [resultadoIA, setResultadoIA] = useState(null);
  const [copiadoCampo, setCopiadoCampo] = useState(null);
  const [blocoMaterialAberto, setBlocoMaterialAberto] = useState(true);
  const [exportadoOk, setExportadoOk] = useState(false);
  const [erroAudio, setErroAudio] = useState('');
  const [okAudio, setOkAudio] = useState('');
  const reconhecimentoRef = useRef(null);
  const gravacaoAtivaRef = useRef(false);

  // ─── Radar de Valorização & Amenidades do Entorno (Fator Localização) ───────
  const [ancorasEntorno, setAncorasEntorno] = useState([
    { id: 'anc_1', nome: 'Supermercado / Atacadista', categoria: CATEGORIAS_RADAR.COMERCIO, distancia: '300m', impacto: IMPACTOS_RADAR.CONVENIENCIA, pesoBase: 14 },
    { id: 'anc_2', nome: 'Escola / Colégio de Referência', categoria: CATEGORIAS_RADAR.EDUCACAO, distancia: '400m', impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 18 },
  ]);
  const [novaAncoraNome, setNovaAncoraNome] = useState('');
  const [novaAncoraDistancia, setNovaAncoraDistancia] = useState('500m');
  const [novaAncoraCategoria, setNovaAncoraCategoria] = useState(CATEGORIAS_RADAR.COMERCIO);
  const [novaAncoraImpacto, setNovaAncoraImpacto] = useState(IMPACTOS_RADAR.CONVENIENCIA);
  const [copiadoLocalizacao, setCopiadoLocalizacao] = useState(false);
  const [copiadoParecer, setCopiadoParecer] = useState(false);
  const [refinandoPitchIA, setRefinandoPitchIA] = useState(false);
  const [pitchIARefinado, setPitchIARefinado] = useState('');

  const indiceLiquidez = useMemo(() => calcularIndiceLiquidez(ancorasEntorno), [ancorasEntorno]);
  const parecerLocalizacaoSugerido = useMemo(() => {
    return gerarParecerFatorLocalizacao({
      bairro,
      cidade,
      ancoras: ancorasEntorno,
      indice: indiceLiquidez,
    });
  }, [bairro, cidade, ancorasEntorno, indiceLiquidez]);

  useEffect(() => {
    return () => {
      gravacaoAtivaRef.current = false;
      try {
        reconhecimentoRef.current?.stop?.();
      } catch {}
    };
  }, []);

  function alternarGravacaoAudio() {
    if (gravandoCampo) {
      gravacaoAtivaRef.current = false;
      try {
        reconhecimentoRef.current?.stop?.();
      } catch {}
      setGravandoCampo(false);
      return;
    }

    const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Reconhecimento) {
      alert('Reconhecimento de voz direto não suportado pelo navegador. Digite ou cole a transcrição do áudio.');
      return;
    }

    try {
      const rec = new Reconhecimento();
      rec.lang = 'pt-BR';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onstart = () => {
        gravacaoAtivaRef.current = true;
        setGravandoCampo(true);
      };

      rec.onresult = (evento) => {
        let falaFinal = '';
        for (let i = evento.resultIndex; i < evento.results.length; i += 1) {
          const res = evento.results[i];
          if (res.isFinal) {
            falaFinal += (res[0]?.transcript || '') + ' ';
          }
        }
        if (falaFinal.trim()) {
          setTranscricaoAudio((prev) => (prev ? `${prev} ${falaFinal.trim()}` : falaFinal.trim()));
        }
      };

      rec.onerror = (e) => {
        if (e.error === 'not-allowed') {
          alert('Microfone bloqueado pelo navegador. Conceda permissão ou cole a transcrição manualmente.');
          gravacaoAtivaRef.current = false;
          setGravandoCampo(false);
        }
      };

      rec.onend = () => {
        if (gravacaoAtivaRef.current) {
          try {
            rec.start();
          } catch {
            setGravandoCampo(false);
          }
        } else {
          setGravandoCampo(false);
        }
      };

      reconhecimentoRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn('Erro ao iniciar reconhecimento:', err);
      setGravandoCampo(false);
    }
  }

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
        endereco: [bairro, cidade].filter(Boolean).join(', '),
        valorPedido,
      });

      setResultadoIA(dados);

      // Preenchimento automático dos campos da Avaliação de Imóvel
      const dt = dados.dadosTecnicos || {};

      // 1. Cidade e Bairro
      if (dt.cidade) setCidade(dt.cidade);
      if (dt.bairro) setBairro(dt.bairro);

      // 2. Tipologia
      if (dt.tipologia || dt.subtipo) {
        const tL = String(dt.tipologia || '').toLowerCase();
        const sL = String(dt.subtipo || '').toLowerCase();
        if (tL.includes('rural') || sL.includes('chácara') || sL.includes('chacara') || sL.includes('fazenda')) {
          setTipologia('rural');
        } else if (sL.includes('lote') || sL.includes('terreno')) {
          setTipologia('loteamento');
        } else if (dt.padraoConstrutivo === 'Luxo' || dt.padraoConstrutivo === 'Alto') {
          setTipologia('alto_padrao');
        } else if (dt.padraoConstrutivo === 'Popular') {
          setTipologia('mcmv');
        } else {
          setTipologia('urbano');
        }
      }

      // 3. Áreas
      if (dt.areaTotal) setAreaTotal(String(dt.areaTotal));
      if (dt.areaConstruida) setAreaConstruida(String(dt.areaConstruida));

      // 4. Padrão Construtivo
      if (dt.padraoConstrutivo) {
        const pL = String(dt.padraoConstrutivo).toLowerCase();
        if (pL.includes('luxo')) setPadrao('luxo');
        else if (pL.includes('alto')) setPadrao('alto');
        else if (pL.includes('popular')) setPadrao('popular');
        else if (pL.includes('simples')) setPadrao('simples');
        else setPadrao('normal');
      }

      // 5. Estado de Conservação
      if (dt.conservacao) {
        const cL = String(dt.conservacao).toLowerCase();
        if (cL.includes('novo')) setEstado('novo');
        else if (cL.includes('ótimo') || cL.includes('otimo')) setEstado('otimo');
        else if (cL.includes('reforma') || cL.includes('reparo')) setEstado('reparos');
        else if (cL.includes('regular')) setEstado('regular');
        else if (cL.includes('ruim') || cL.includes('condenado')) setEstado('ruina');
        else setEstado('bom');
      }

      // 6. Valor Pedido
      if (dt.valorPedido) setValorPedido(String(dt.valorPedido));

      setOkAudio('Ficha técnica do imóvel preenchida automaticamente com base no áudio de campo!');
    } catch (e) {
      setErroAudio(`Falha ao analisar áudio de campo: ${e?.message || 'erro inesperado'}`);
    } finally {
      setProcessandoIA(false);
    }
  }

  function copiarParaClipboard(texto, chave) {
    if (!texto) return;
    try {
      navigator.clipboard?.writeText(texto);
      setCopiadoCampo(chave);
      setTimeout(() => setCopiadoCampo(null), 2500);
    } catch {}
  }

  function exportarParaCaptacao() {
    const rascunho = {
      cidade: [cidade, bairro].filter(Boolean).join(' - ') || cidade,
      valor: valorPedido || (resultadoIA?.dadosTecnicos?.valorPedido ? String(resultadoIA.dadosTecnicos.valorPedido) : ''),
      referencia: `${(tipologia || 'IMOVEL').toUpperCase()}-${(bairro || cidade || 'CAMPO').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)}`,
      areaM2: areaTotal,
      areaConstruida,
      nicho: tipologia === 'rural' ? 'rural' : tipologia === 'loteamento' ? 'loteamento' : tipologia === 'alto_padrao' ? 'alto_padrao' : tipologia === 'mcmv' ? 'mcmv' : 'locacao',
      observacoes: [
        resultadoIA?.materialComercial?.descricaoPortal,
        resultadoIA?.analiseMercado?.observacaoTecnica,
        resultadoIA?.materialComercial?.fichaTecnica,
      ].filter(Boolean).join('\n\n').slice(0, 600),
    };

    try {
      localStorage.setItem('express_imobi_rascunho_captacao', JSON.stringify(rascunho));
    } catch {}

    setExportadoOk(true);
    setTimeout(() => {
      if (typeof onExportarCaptacao === 'function') {
        onExportarCaptacao(rascunho);
      } else if (typeof setAbaAtiva === 'function') {
        setAbaAtiva('captacao_imobi');
      } else {
        alert('Dados preparados para Captação! Navegue para a aba Captação & Imóveis.');
      }
    }, 400);
  }

  const avaliacao = useMemo(() => avaliarImovel({
    uf, cidade, bairro, tipologia, padrao, estado, topografia, condicoes,
    areaTotal: Number(areaTotal) || 0,
    areaConstruida: Number(areaConstruida) || 0,
    comparaveis,
  }), [uf, cidade, bairro, tipologia, padrao, estado, topografia, condicoes, areaTotal, areaConstruida, comparaveis]);

  const dadosEmissao = useMemo(() => ({
    corretorNome, creci, cnai, solicitante, matricula, finalidade, cidade, uf,
  }), [corretorNome, creci, cnai, solicitante, matricula, finalidade, cidade, uf]);

  const resumo = useMemo(() => gerarResumoComercial(dadosEmissao, avaliacao), [dadosEmissao, avaliacao]);
  const documento = useMemo(() => gerarPTAM(dadosEmissao, avaliacao), [dadosEmissao, avaliacao]);
  const identidade = useMemo(() => identidadeDocumento(dadosEmissao), [dadosEmissao]);
  const temArea = (Number(areaTotal) || 0) + (Number(areaConstruida) || 0) > 0;

  function alternarCondicao(key) {
    setCondicoes((atual) => (atual.includes(key) ? atual.filter((k) => k !== key) : [...atual, key]));
  }

  function atualizarComparavel(idx, campo, valor) {
    setComparaveis((atual) => atual.map((c, i) => (i === idx ? { ...c, [campo]: valor } : c)));
  }

  const documentoComLocalizacao = useMemo(() => {
    if (!temArea) return 'Informe a área do imóvel para gerar o documento.';
    if (abaSaida === 'resumo') {
      return ancorasEntorno.length > 0
        ? `${resumo}\n\n📍 VETOR DE LOCALIZAÇÃO & LIQUIDEZ:\nÍndice de Liquidez: ${indiceLiquidez.score}/100 (${indiceLiquidez.classificacao.rotulo})\n${pitchIARefinado || parecerLocalizacaoSugerido}`
        : resumo;
    }
    return ancorasEntorno.length > 0
      ? `${documento}\n\n6. ANÁLISE DO ENTORNO & FATOR LOCALIZAÇÃO (ABNT NBR 14653)\nÍndice de Liquidez e Atratividade Mercadológica: ${indiceLiquidez.score}/100 (${indiceLiquidez.classificacao.rotulo})\n${pitchIARefinado || parecerLocalizacaoSugerido}`
      : documento;
  }, [abaSaida, temArea, resumo, documento, ancorasEntorno, indiceLiquidez, parecerLocalizacaoSugerido, pitchIARefinado]);

  function adicionarAncoraPredefinida(anc) {
    const id = `anc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setAncorasEntorno((prev) => [...prev, { id, ...anc }]);
  }

  function adicionarAncoraCustomizada(e) {
    if (e) e.preventDefault();
    if (!novaAncoraNome.trim()) return;
    const id = `anc_cust_${Date.now()}`;
    const peso = novaAncoraImpacto === IMPACTOS_RADAR.ALTA_VALORIZACAO ? 18 : novaAncoraImpacto === IMPACTOS_RADAR.CONVENIENCIA ? 14 : -20;
    setAncorasEntorno((prev) => [
      ...prev,
      {
        id,
        nome: novaAncoraNome.trim(),
        distancia: novaAncoraDistancia.trim() || '500m',
        categoria: novaAncoraCategoria,
        impacto: novaAncoraImpacto,
        pesoBase: peso,
      },
    ]);
    setNovaAncoraNome('');
  }

  function removerAncora(id) {
    setAncorasEntorno((prev) => prev.filter((a) => a.id !== id));
  }

  function copiarWhatsAppLocalizacao() {
    const txt = gerarArgumentoWhatsAppLocalizacao({
      bairro,
      cidade,
      ancoras: ancorasEntorno,
      indice: indiceLiquidez,
      valorPedido,
    });
    try {
      navigator.clipboard?.writeText(txt);
      setCopiadoLocalizacao(true);
      setTimeout(() => setCopiadoLocalizacao(false), 2200);
    } catch {}
  }

  function copiarParecerTecnico() {
    try {
      navigator.clipboard?.writeText(pitchIARefinado || parecerLocalizacaoSugerido);
      setCopiadoParecer(true);
      setTimeout(() => setCopiadoParecer(false), 2200);
    } catch {}
  }

  async function refinarPitchComIA() {
    if (refinandoPitchIA) return;
    setRefinandoPitchIA(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          systemPrompt: 'Você é um avaliador e copywriter imobiliário sênior especialista em ABNT NBR 14653. Escreva um pitch persuasivo de valorização do entorno do imóvel.',
          prompt: `Imóvel situado em ${[bairro, cidade].filter(Boolean).join(', ') || 'região metropolitana'}.
Índice de Liquidez: ${indiceLiquidez.score}/100 (${indiceLiquidez.classificacao.rotulo}).
Amenidades do entorno: ${ancorasEntorno.map((a) => `${a.nome} a ${a.distancia} (${a.impacto})`).join(', ')}.
Escreva 2 parágrafos objetivos defendendo a localização e o valor pedido perante um comprador exigente ou proprietário.`,
        }),
      });
      const data = await res.json();
      if (data && data.text) {
        setPitchIARefinado(data.text);
      } else {
        setPitchIARefinado(parecerLocalizacaoSugerido);
      }
    } catch {
      setPitchIARefinado(parecerLocalizacaoSugerido);
    } finally {
      setRefinandoPitchIA(false);
    }
  }

  async function copiar() {
    const texto = documentoComLocalizacao;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      setCopiado(false);
    }
  }

  function imprimir() {
    const janela = window.open('', '_blank');
    if (!janela) {
      alert('Permita pop-ups para gerar o PDF do documento.');
      return;
    }
    janela.document.write(gerarDocumentoHtmlPTAM(dadosEmissao, avaliacao));
    janela.document.close();
    janela.focus();
    setTimeout(() => janela.print(), 350);
  }

  async function adicionarFotos(evento) {
    const arquivos = Array.from(evento.target.files || []).slice(0, 3 - fotos.length);
    if (!arquivos.length) return;
    setErroFoto('');
    const novas = [];
    for (const arquivo of arquivos) {
      try {
        novas.push(await comprimirImagem(arquivo));
      } catch (e) {
        setErroFoto(String(e?.message || e));
      }
    }
    setFotos((atual) => [...atual, ...novas].slice(0, 3));
    evento.target.value = '';
  }

  async function gerarLaudoCompleto() {
    setVizCarregando(true);
    let viz = null;
    try {
      viz = await raioXDaVizinhanca({
        cep,
        endereco: [bairro, cidade].filter(Boolean).join(', '),
        cidade,
        uf,
      });
    } catch (e) {
      viz = { ok: false, motivo: String(e?.message || e) };
    } finally {
      setVizCarregando(false);
    }
    setVizinhanca(viz);

    await gerarLaudoIA({
      dados: {
        cidade, bairro, uf, tipologia, padrao, estado, topografia,
        areaTotal: Number(areaTotal) || 0,
        areaConstruida: Number(areaConstruida) || 0,
        comparaveis,
      },
      avaliacao,
      valorPedido: Number(valorPedido) || 0,
      cdi: Number(cdi) || CDI_PADRAO,
      fii: Number(fii) || FII_TIJOLO_PADRAO,
      fotos,
      vizinhanca: viz,
    });
  }

  return (
    <div className="space-y-6">
      <HeroAba
        icone={Ruler}
        titulo="Avaliação de"
        destaque="Imóvel"
        chip={identidade.temResponsavel ? 'PTAM · COFECI 1.066/2007 + ABNT NBR 14.653' : 'Estudo Estimativo de Valor de Mercado'}
        subtitulo="Comparativo direto com fatores de topografia e testada e três cenários de preço. Sem nome e CRECI do corretor preenchidos, a saída é Estudo Estimativo de Valor de Mercado — não é PTAM nem laudo."
        cor={corAba}
      />

      {/* ─── BLOCO DE CAPTAÇÃO POR VOZ EM CAMPO (IA NBR 14653) ────────────────── */}
      <div className="rounded-3xl border border-emerald-500/30 bg-[#020408] p-5 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Mic size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Captação por Voz em Campo</h3>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                  IA NBR 14653
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Grave um áudio relatando os detalhes do imóvel em campo para preencher a avaliação e gerar materiais comerciais.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAudioCampoAberto((prev) => !prev)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs font-black text-emerald-300 transition cursor-pointer"
          >
            <Mic size={14} className={gravandoCampo ? 'animate-pulse text-red-400' : 'text-emerald-400'} />
            <span>{audioCampoAberto ? 'Recuar Gravador' : 'Gravar Captação por Voz (Campo)'}</span>
            {audioCampoAberto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {audioCampoAberto && (
          <div className="mt-4 space-y-4 animate-in fade-in duration-200">
            {/* Status de gravação */}
            {gravandoCampo && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-300">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                <span>Microfone gravando ao vivo... Fale sobre localização, tipologia, metragem, padrão, conservação e valor pedido.</span>
              </div>
            )}

            {/* Campo de transcrição editável */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Transcrição do Áudio de Campo (editável):
              </label>
              <textarea
                rows={4}
                value={transcricaoAudio}
                onChange={(e) => setTranscricaoAudio(e.target.value)}
                placeholder="Exemplo falado: 'Estou aqui no Centro de Uberlândia avaliando uma casa em padrão normal, ótimo estado, lote de 360m² e área construída de 210m². Proprietário pede 650 mil reais...'"
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 leading-relaxed"
              />
            </div>

            {/* Barra de ações do áudio */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={alternarGravacaoAudio}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black transition cursor-pointer ${
                    gravandoCampo
                      ? 'border border-red-500/60 bg-red-500/20 text-red-200 hover:bg-red-500/30'
                      : 'border border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                  }`}
                >
                  <Mic size={14} className={gravandoCampo ? 'animate-pulse text-red-400' : 'text-emerald-400'} />
                  <span>{gravandoCampo ? 'Parar Gravação' : 'Gravar com Microfone'}</span>
                </button>

                {transcricaoAudio && (
                  <button
                    type="button"
                    onClick={() => {
                      if (gravandoCampo) alternarGravacaoAudio();
                      setTranscricaoAudio('');
                      setResultadoIA(null);
                      setErroAudio('');
                      setOkAudio('');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Limpar</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={processarAudioComIA}
                disabled={processandoIA || !transcricaoAudio.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {processandoIA ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>{processandoIA ? 'Analisando com IA...' : 'Preencher Ficha & Gerar Material'}</span>
              </button>
            </div>

            {/* Mensagens de feedback */}
            {erroAudio && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                {erroAudio}
              </div>
            )}
            {okAudio && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                {okAudio}
              </div>
            )}

            {/* Bloco de Resultados Extraídos pela IA */}
            {resultadoIA && (
              <div className="mt-4 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                {/* Resumo Técnico Extraído */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                    <Check size={14} /> Dados Técnicos Extraídos & Injetados
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="rounded-xl border border-slate-800/80 bg-[#020408] p-2.5">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Localização</span>
                      <span className="font-bold text-white truncate block">
                        {[resultadoIA.dadosTecnicos?.bairro, resultadoIA.dadosTecnicos?.cidade].filter(Boolean).join(', ') || 'Não inf.'}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-[#020408] p-2.5">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Tipologia</span>
                      <span className="font-bold text-white truncate block">
                        {[resultadoIA.dadosTecnicos?.tipologia, resultadoIA.dadosTecnicos?.subtipo].filter(Boolean).join(' · ') || 'Urbano'}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-[#020408] p-2.5">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Áreas (Total / Const.)</span>
                      <span className="font-bold text-white truncate block">
                        {resultadoIA.dadosTecnicos?.areaTotal || 0}m² / {resultadoIA.dadosTecnicos?.areaConstruida || 0}m²
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-[#020408] p-2.5">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Padrão / Estado</span>
                      <span className="font-bold text-white truncate block">
                        {resultadoIA.dadosTecnicos?.padraoConstrutivo || 'Normal'} · {resultadoIA.dadosTecnicos?.conservacao || 'Bom'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Análise de Mercado Calculada */}
                {resultadoIA.analiseMercado && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-emerald-400">Análise de Mercado</span>
                      {resultadoIA.analiseMercado.valorM2Pedido > 0 && (
                        <span className="font-black text-white bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          {brl(resultadoIA.analiseMercado.valorM2Pedido)} / m²
                        </span>
                      )}
                    </div>
                    {resultadoIA.analiseMercado.observacaoTecnica && (
                      <p className="mt-1.5 text-slate-300 leading-relaxed">
                        {resultadoIA.analiseMercado.observacaoTecnica}
                      </p>
                    )}
                  </div>
                )}

                {/* Material Comercial Gerado */}
                {resultadoIA.materialComercial && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Sparkles size={13} className="text-emerald-400" /> Material Comercial Gerado
                      </h4>
                      <button
                        type="button"
                        onClick={() => setBlocoMaterialAberto((p) => !p)}
                        className="text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        {blocoMaterialAberto ? 'Recuar Material' : 'Expandir Material'}
                      </button>
                    </div>

                    {blocoMaterialAberto && (
                      <div className="space-y-3">
                        {/* Botões de Cópia Rápida */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copiarParaClipboard(resultadoIA.materialComercial.descricaoPortal, 'portal')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 transition cursor-pointer"
                          >
                            {copiadoCampo === 'portal' ? <Check size={13} /> : <Copy size={13} />}
                            <span>{copiadoCampo === 'portal' ? 'Copiado!' : 'Copiar Anúncio Portal'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => copiarParaClipboard(resultadoIA.materialComercial.roteiroReels35s, 'reels')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-300 transition cursor-pointer"
                          >
                            {copiadoCampo === 'reels' ? <Check size={13} /> : <Video size={13} />}
                            <span>{copiadoCampo === 'reels' ? 'Copiado!' : 'Copiar Roteiro Reels 35s'}</span>
                          </button>
                        </div>

                        {/* Título de Portal */}
                        {resultadoIA.materialComercial.tituloAnuncio && (
                          <div className="rounded-xl border border-slate-800/80 bg-[#020408] p-3 text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Título de Alta Conversão</span>
                            <p className="font-bold text-white">{resultadoIA.materialComercial.tituloAnuncio}</p>
                          </div>
                        )}

                        {/* Roteiro de Reels */}
                        {resultadoIA.materialComercial.roteiroReels35s && (
                          <div className="rounded-xl border border-slate-800/80 bg-[#020408] p-3 text-xs">
                            <span className="text-[10px] uppercase font-bold text-purple-400 block mb-1 flex items-center gap-1">
                              <Video size={11} /> Roteiro Reels / TikTok (35s)
                            </span>
                            <p className="text-slate-300 whitespace-pre-line leading-relaxed font-mono text-[11px]">
                              {resultadoIA.materialComercial.roteiroReels35s}
                            </p>
                          </div>
                        )}

                        {/* Botão de Exportação para Captação & Imóveis */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80">
                          <span className="text-[11px] text-slate-400">
                            Pronto para cadastrar na vitrine e nos portais?
                          </span>
                          <button
                            type="button"
                            onClick={exportarParaCaptacao}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                          >
                            {exportadoOk ? <Check size={14} /> : <ArrowRight size={14} />}
                            <span>{exportadoOk ? 'Redirecionando...' : 'Exportar para Captação & Imóveis'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <SeletorUF onChange={(p) => setUf(p.ufPadrao)} />

      {/* Quadro legal */}
      <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3">
        <Info size={15} className="mt-0.5 shrink-0 text-slate-500" />
        <p className="text-[11px] leading-relaxed text-slate-400">
          <strong className="text-slate-300">Base legal (Lei 6.530/78 e Resolução COFECI 1.066/2007):</strong>{' '}
          o PTAM (Parecer Técnico de Avaliação Mercadológica) é prerrogativa do corretor inscrito no
          CRECI e só sai com <strong className="text-slate-300">nome e CRECI preenchidos pelo próprio corretor</strong>.
          Enquanto esses campos estiverem vazios, o documento sai como
          <strong className="text-slate-300"> Estudo Estimativo de Valor de Mercado</strong>, sem valor de laudo.
          Laudos estruturais de engenharia exigem ART/RRT (CREA/CAU).
        </p>
      </div>

      <GuiaDaAba
        titulo="Avaliação de Imóvel"
        descricao="Preencha os dados do imóvel, a topografia e as condições da testada, e informe até 3 comparáveis. O motor homogeneíza (desconto de oferta 10% + peso por distância), aplica os fatores físicos e devolve três cenários, prazo e dois textos: resumo para WhatsApp e o documento para imprimir — que é Estudo Estimativo de Valor de Mercado, e só vira PTAM quando o corretor preenche nome e CRECI."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className={`${card} p-5 lg:col-span-3 space-y-4`}>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className={labelCls}>Cidade</label>
              <input className={inputCls} value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Uberlândia" />
            </div>
            <div>
              <label className={labelCls}>Bairro</label>
              <input className={inputCls} value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Centro" />
            </div>
            <div>
              <label className={labelCls}>Tipologia</label>
              <select className={inputCls} value={tipologia} onChange={(e) => setTipologia(e.target.value)}>
                {TIPOLOGIAS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className={labelCls}>{tipologia === 'rural' ? 'Área (hectares)' : 'Área total (m²)'}</label>
              <input className={inputCls} value={areaTotal} onChange={(e) => setAreaTotal(e.target.value)} inputMode="decimal" placeholder="360" />
            </div>
            <div>
              <label className={labelCls}>Área construída (m²)</label>
              <input className={inputCls} value={areaConstruida} onChange={(e) => setAreaConstruida(e.target.value)} inputMode="decimal" placeholder="210" />
            </div>
            <div>
              <label className={labelCls}>Padrão construtivo</label>
              <select className={inputCls} value={padrao} onChange={(e) => setPadrao(e.target.value)}>
                {PADROES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Conservação</label>
              <select className={inputCls} value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS_CONSERVACAO.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Topografia */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className={labelCls}>Topografia do terreno</label>
              <select className={inputCls} value={topografia} onChange={(e) => setTopografia(e.target.value)}>
                {TOPOGRAFIAS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label} ({t.efeito === 0 ? 'sem ajuste' : `${t.efeito}%`})
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-slate-800 px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-slate-400">Fator de topografia</p>
              <p className="text-sm font-black text-white">
                {avaliacao.topografia.fator.toFixed(2)}
                <span className="ml-2 text-[10px] font-bold text-slate-500">{avaliacao.topografia.nota}</span>
              </p>
            </div>
          </div>

          {/* Testada */}
          <div>
            <label className={labelCls}>Condições da testada / terreno</label>
            <div className="flex flex-wrap gap-2">
              {CONDICOES_TESTADA.map((c) => {
                const ativo = condicoes.includes(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => alternarCondicao(c.key)}
                    title={c.nota}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${ativo
                      ? 'border-[#10b981] bg-[#10b981]/15 text-[#10b981]'
                      : 'border-slate-800 text-slate-400 hover:border-slate-600'}`}
                  >
                    {c.label} <span className="opacity-70">({c.efeito > 0 ? '+' : ''}{c.efeito}%)</span>
                  </button>
                );
              })}
            </div>
            {condicoes.length > 0 && (
              <p className="mt-2 text-[10px] text-slate-500">
                Fator cumulativo da testada: {avaliacao.fatores.testada} ({avaliacao.fatores.testadaPct > 0 ? '+' : ''}{avaliacao.fatores.testadaPct}%)
              </p>
            )}
          </div>

          {/* Comparáveis */}
          <div className="rounded-2xl border border-slate-800 p-4">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Building2 size={13} /> Comparáveis de referência (opcional, até 3)
            </p>
            <div className="space-y-2">
              {comparaveis.map((c, i) => (
                <div key={i} className="grid grid-cols-12 items-center gap-2">
                  <span className="col-span-1 text-[10px] font-black text-slate-500">#{i + 1}</span>
                  <input className={`${inputCls} col-span-4`} value={c.valor} onChange={(e) => atualizarComparavel(i, 'valor', e.target.value)} placeholder="Valor pedido (R$)" inputMode="decimal" />
                  <input className={`${inputCls} col-span-3`} value={c.area} onChange={(e) => atualizarComparavel(i, 'area', e.target.value)} placeholder="Área" inputMode="decimal" />
                  <input className={`${inputCls} col-span-3`} value={c.distanciaKm} onChange={(e) => atualizarComparavel(i, 'distanciaKm', e.target.value)} placeholder="Distância km" inputMode="decimal" />
                  <label className="col-span-1 flex items-center justify-center" title="É anúncio de oferta (aplica desconto de 10%)">
                    <input type="checkbox" checked={c.oferta} onChange={(e) => atualizarComparavel(i, 'oferta', e.target.checked)} className="h-4 w-4 accent-[#10b981]" />
                  </label>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Marque a caixa quando o valor for preço de anúncio: o motor aplica 10% de desconto e reduz o peso de comparáveis distantes.
            </p>
          </div>

          {/* Emissão do PTAM */}
          <div className="rounded-2xl border border-slate-800 p-4">
            <button onClick={() => setAbrirEmissao((v) => !v)} className="flex w-full items-center justify-between gap-2 text-left">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Stamp size={13} /> Dados para emissão do PTAM
              </span>
              <ChevronDown size={15} className={`text-slate-500 transition ${abrirEmissao ? 'rotate-180' : ''}`} />
            </button>

            {abrirEmissao && (
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <label className={labelCls}>Corretor / Avaliador</label>
                  <input className={inputCls} value={corretorNome} onChange={(e) => setCorretorNome(e.target.value)} placeholder="Seu nome" />
                </div>
                <div>
                  <label className={labelCls}>CRECI</label>
                  <input className={inputCls} value={creci} onChange={(e) => setCreci(e.target.value)} placeholder="MG 12345" />
                </div>
                <div>
                  <label className={labelCls}>CNAI (opcional)</label>
                  <input className={inputCls} value={cnai} onChange={(e) => setCnai(e.target.value)} placeholder="CNAI 000000" />
                </div>
                <div>
                  <label className={labelCls}>Solicitante / Proprietário</label>
                  <input className={inputCls} value={solicitante} onChange={(e) => setSolicitante(e.target.value)} placeholder="Nome do proprietário" />
                </div>
                <div>
                  <label className={labelCls}>Matrícula (CRI)</label>
                  <input className={inputCls} value={matricula} onChange={(e) => setMatricula(e.target.value)} placeholder="45.678" />
                </div>
                <div>
                  <label className={labelCls}>Finalidade</label>
                  <select className={inputCls} value={finalidade} onChange={(e) => setFinalidade(e.target.value)}>
                    {FINALIDADES_PTAM.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Radar de Valorização & Amenidades do Entorno (Fator Localização — ABNT NBR 14653) */}
          <div className="rounded-2xl border border-slate-800 p-4 space-y-4 bg-slate-950/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Compass size={15} className="text-[#10b981]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Radar de Valorização & Entorno (Fator Localização)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">Índice:</span>
                <span
                  style={{ color: indiceLiquidez.classificacao.cor }}
                  className="text-sm font-black"
                >
                  {indiceLiquidez.score}/100
                </span>
                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${indiceLiquidez.classificacao.badge}`}
                >
                  {indiceLiquidez.classificacao.rotulo}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pondere o impacto da infraestrutura urbana de <strong>{[bairro, cidade].filter(Boolean).join(', ') || 'seu bairro'}</strong> no valor de mercado (ABNT NBR 14653).
            </p>

            {/* Botões de Seleção Rápida */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                Adicionar Amenidade Rápida:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ANCORAS_PREDEFINIDAS.map((anc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => adicionarAncoraPredefinida(anc)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={11} className="text-[#10b981]" />
                    <span>{anc.nome}</span>
                    <span className="text-[9px] text-slate-500">({anc.distancia})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de Âncoras Ativas */}
            {ancorasEntorno.length > 0 && (
              <div className="space-y-2 pt-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Âncoras & Condicionantes Consideradas ({ancorasEntorno.length}):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ancorasEntorno.map((a) => {
                    const isAtencao = a.categoria === CATEGORIAS_RADAR.RUIDO_ATENCAO || a.impacto === IMPACTOS_RADAR.PONTO_ATENCAO;
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#020408] border border-slate-800/80 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white truncate text-[11px]">{a.nome}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="text-slate-400">{a.distancia}</span>
                            <span>•</span>
                            <span className={isAtencao ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                              {a.impacto}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removerAncora(a.id)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition cursor-pointer"
                          title="Remover âncora"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Adicionar Âncora Personalizada */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                Personalizar Âncora / Ponto de Atenção:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={novaAncoraNome}
                  onChange={(e) => setNovaAncoraNome(e.target.value)}
                  placeholder="Ex: Polo Tecnológico, Estádio..."
                  className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
                />
                <input
                  type="text"
                  value={novaAncoraDistancia}
                  onChange={(e) => setNovaAncoraDistancia(e.target.value)}
                  placeholder="Ex: 500m ou 1.2km"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
                />
                <select
                  value={novaAncoraImpacto}
                  onChange={(e) => setNovaAncoraImpacto(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-[#10b981]"
                >
                  <option value={IMPACTOS_RADAR.ALTA_VALORIZACAO}>Alta Valorização</option>
                  <option value={IMPACTOS_RADAR.CONVENIENCIA}>Conveniência</option>
                  <option value={IMPACTOS_RADAR.PONTO_ATENCAO}>Ponto de Atenção</option>
                </select>
              </div>
              <button
                type="button"
                onClick={adicionarAncoraCustomizada}
                disabled={!novaAncoraNome.trim()}
                className="mt-2 w-full sm:w-auto px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-white transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus size={13} /> Inserir no Radar
              </button>
            </div>

            {/* Parecer Técnico Automático & Ações Rápidas */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Check size={12} /> Parecer Técnico ABNT NBR 14653 (Injetável no Laudo)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copiarParecerTecnico}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    {copiadoParecer ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiadoParecer ? 'Copiado!' : 'Copiar Parecer'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={copiarWhatsAppLocalizacao}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    {copiadoLocalizacao ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiadoLocalizacao ? 'Copiado!' : 'WhatsApp Defesa de Preço'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={refinarPitchComIA}
                    disabled={refinandoPitchIA}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 text-[10px] font-black uppercase transition cursor-pointer flex items-center gap-1"
                  >
                    {refinandoPitchIA ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    <span>{refinandoPitchIA ? 'Refinando...' : 'Pitch com IA'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#020408] border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                {pitchIARefinado || parecerLocalizacaoSugerido}
              </div>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`${card} p-5`}>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: corAba }}>
              <Gauge size={13} /> Valor do {avaliacao.unidade}
            </p>
            <p className="mt-1 text-3xl font-black text-white">{brl(avaliacao.precoUnitario)}</p>
            <p className="text-[11px] text-slate-500">
              base {brl(avaliacao.precoUnitarioBase)} · mercado {brl(avaliacao.precoMercado)} →
              físico ×{avaliacao.fatorFisico} = {brl(avaliacao.precoUnitario)}
            </p>
            <p className="text-[10px] text-slate-500">{avaliacao.grauFundamentacao}</p>

            <div className="mt-4 space-y-2">
              {avaliacao.cenarios.map((c) => (
                <div key={c.key} className="rounded-xl border border-slate-800 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.label}</span>
                    <strong className="text-sm font-black text-white">{brl(c.valor)}</strong>
                  </div>
                  <p className="text-[10px] text-slate-500">{c.objetivo}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-2">
              <TrendingUp size={14} color={corAba} />
              <span className="text-[11px] text-slate-300">Prazo médio: <strong className="text-white">{avaliacao.prazoMedioDias} dias</strong></span>
            </div>

            {avaliacao.alertas.length > 0 && (
              <ul className="mt-3 space-y-1">
                {avaliacao.alertas.map((a) => (
                  <li key={a} className="flex items-start gap-1.5 text-[10px] text-amber-300">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {a}
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
              <MapPin size={11} /> {avaliacao.cidade} · {avaliacao.uf} · região {avaliacao.regiao}
            </p>
          </div>
        </div>
      </div>

      {/* ================= Laudo Executivo 5 Agentes ================= */}
      <div className={`${card} p-5 space-y-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: corAba }}>
              <ScanSearch size={13} /> Laudo executivo · 5 agentes de IA
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Cruza o PTAM com comparáveis reais, raio-X de vizinhança (OpenStreetMap), fotos do imóvel,
              renda fixa e liquidez — e devolve score, faixa de preço, prazo e anúncio pronto.
            </p>
          </div>
          <button
            onClick={gerarLaudoCompleto}
            disabled={!temArea || gerandoLaudo || vizCarregando}
            className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-950 transition hover:bg-[#0ea472] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {gerandoLaudo || vizCarregando ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {gerandoLaudo ? 'Gerando…' : vizCarregando ? 'Consultando entorno…' : 'Gerar Laudo Executivo 5 Agentes'}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className={labelCls}>CEP do imóvel</label>
            <input className={inputCls} value={cep} onChange={(e) => setCep(e.target.value)} placeholder="38400-000" inputMode="numeric" />
          </div>
          <div>
            <label className={labelCls}>Valor pedido pelo dono (R$)</label>
            <input className={inputCls} value={valorPedido} onChange={(e) => setValorPedido(e.target.value)} placeholder="450000" inputMode="decimal" />
          </div>
          <div>
            <label className={labelCls}>CDI anual (%)</label>
            <input className={inputCls} value={cdi} onChange={(e) => setCdi(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <label className={labelCls}>FII de tijolo (%)</label>
            <input className={inputCls} value={fii} onChange={(e) => setFii(e.target.value)} inputMode="decimal" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Fotos do imóvel (até 3 · análise visual Gemini)</label>
          <div className="flex flex-wrap items-center gap-2">
            {fotos.map((foto, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-800">
                <img src={foto} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  onClick={() => setFotos((atual) => atual.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 rounded-full bg-slate-950/80 p-0.5 text-slate-300 hover:text-white"
                  title="Remover foto"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {fotos.length < 3 && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-700 text-slate-500 transition hover:border-[#10b981] hover:text-[#10b981]">
                <Camera size={18} />
                <span className="text-[9px] font-bold uppercase">Anexar</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={adicionarFotos} />
              </label>
            )}
          </div>
          {analiseFotos && (
            <p className="mt-2 text-[10px] text-slate-400">
              Fotos: padrão <strong className="text-slate-200">{analiseFotos.padraoConstrutivo}</strong> ·
              conservação <strong className="text-slate-200">{analiseFotos.estadoConservacao}</strong>
              {analiseFotos.confianca ? ` · confiança ${analiseFotos.confianca}%` : ''}
            </p>
          )}
          {erroFoto && <p className="mt-1 text-[10px] text-amber-300">{erroFoto}</p>}
        </div>

        {!temArea && (
          <p className="flex items-center gap-1.5 text-[10px] text-amber-300">
            <AlertTriangle size={12} /> Informe a área do imóvel para liberar o laudo executivo.
          </p>
        )}
      </div>

      <LaudoExecutivo
        laudo={laudo}
        meta={meta}
        vizinhanca={vizinhanca}
        analiseFotos={analiseFotos}
        avaliacao={avaliacao}
        identidade={identidade}
        valorPedido={Number(valorPedido) || 0}
        dados={{ cidade, bairro, uf, padrao, estado }}
        carregando={gerandoLaudo || vizCarregando}
        fase={vizCarregando ? 'Consultando ViaCEP, OpenStreetMap e Overpass…' : fase}
        erro={erroLaudo}
      />

      {/* Saídas */}
      <div className={`${card} p-5`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 p-1">
            <button
              onClick={() => setAbaSaida('resumo')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${abaSaida === 'resumo' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <MessageSquare size={12} /> Resumo comercial
            </button>
            <button
              onClick={() => setAbaSaida('ptam')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition ${abaSaida === 'ptam' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <FileText size={12} /> {identidade.temResponsavel ? 'Documento PTAM' : 'Estudo de valor'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copiar}
              className="inline-flex items-center gap-2 rounded-xl border border-[#10b981]/50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#10b981] transition hover:border-[#10b981]"
            >
              {copiado ? <Check size={13} /> : <Copy size={13} />} {copiado ? 'Copiado' : abaSaida === 'resumo' ? 'Copiar WhatsApp' : 'Copiar documento'}
            </button>
            <button
              onClick={imprimir}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 transition hover:border-slate-500"
            >
              <Printer size={13} /> Imprimir / PDF
            </button>
          </div>
        </div>

        <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-[11px] leading-relaxed text-slate-300">
          {documentoComLocalizacao}
        </pre>

        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500">
          <Sparkles size={11} />
          {abaSaida === 'resumo'
            ? 'Resumo curto para convencer na conversa — cita topografia, poste, bueiro e arrimo quando marcados.'
            : identidade.temResponsavel
              ? 'PTAM no padrão COFECI 1.066/2007, com partes, metodologia, fatores, amostras e bloco de assinatura.'
              : 'Estudo Estimativo de Valor de Mercado: mesmo cálculo, sem alegação de laudo. Preencha nome e CRECI para emitir PTAM.'}
        </p>
      </div>
    </div>
  );
}
