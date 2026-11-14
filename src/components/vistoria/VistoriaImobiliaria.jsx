import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';
import { uploadImages } from '../desmanche/uploadImage';
import { useGroq } from '../../hooks/useGroq';
import {
  Camera,
  ImagePlus,
  Trash2,
  Sparkles,
  ShieldAlert,
  FileText,
  Printer,
  Copy,
  Save,
  Home,
  Sofa,
  CookingPot,
  BedDouble,
  Bath,
  Trees,
  Plus,
  X,
  LoaderCircle,
  MapPin,
  User,
  Key,
  LogIn,
  LogOut,
  Calendar,
  History,
  Share2,
  ClipboardList,
  CheckCircle2,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* CONSTANTES                                                          */
/* ------------------------------------------------------------------ */

export const DISCLAIMER_LAUDO =
  'Este documento e respetivo laudo são gerados por IA como minuta de apoio operacional e devem ser validados por profissionais habilitados.';

const TIPOS_VISTORIA = [
  { value: 'entrada', label: 'Vistoria de Entrada', icon: LogIn },
  { value: 'saida', label: 'Vistoria de Saída', icon: LogOut },
  { value: 'entrega_chaves', label: 'Entrega de Chaves', icon: Key },
  { value: 'captacao', label: 'Captação de Imóvel', icon: Home },
  { value: 'periodica', label: 'Vistoria Periódica', icon: ClipboardList },
];

const DIVISOES_PADRAO = [
  { id: 'sala', nome: 'Sala', icon: 'sofa' },
  { id: 'cozinha', nome: 'Cozinha', icon: 'cozinha' },
  { id: 'quartos', nome: 'Quartos', icon: 'quarto' },
  { id: 'wc', nome: 'W.C.', icon: 'wc' },
  { id: 'exterior', nome: 'Exterior', icon: 'exterior' },
];

const ICONES_DIVISAO = {
  sofa: Sofa,
  cozinha: CookingPot,
  quarto: BedDouble,
  wc: Bath,
  exterior: Trees,
  outro: Home,
};

const ESTADOS = [
  { value: 'bom', label: 'Bom' },
  { value: 'regular', label: 'Regular' },
  { value: 'ruim', label: 'Necessita reparo' },
];

const OBS_RAPIDAS = [
  'Sem avarias aparentes',
  'Pintura em bom estado',
  'Pintura desgastada',
  'Infiltração / humidade',
  'Piso riscado',
  'Azulejo partido',
  'Tomadas e interruptores OK',
  'Torneiras sem fugas',
  'Portas e fechaduras OK',
  'Vidro trincado',
  'Limpeza necessária',
];

const criarDivisao = ({ id, nome, icon }) => ({
  id: id || `div_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  nome,
  icon: icon || 'outro',
  estado: 'bom',
  observacoes: '',
  fotos: [],
});

const dadosIniciais = () => ({
  tipo: 'entrada',
  imovel: '',
  proprietario: '',
  inquilino: '',
  corretor: '',
  data: new Date().toISOString().slice(0, 10),
});

const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const labelTipo = (value) => TIPOS_VISTORIA.find(t => t.value === value)?.label || 'Vistoria';
const labelEstado = (value) => ESTADOS.find(e => e.value === value)?.label || '-';

/* ------------------------------------------------------------------ */
/* COMPONENTE PRINCIPAL                                                */
/* ------------------------------------------------------------------ */

export default function VistoriaImobiliaria({ oficinaId }) {
  const [dados, setDados] = useState(dadosIniciais);
  const [divisoes, setDivisoes] = useState(() => DIVISOES_PADRAO.map(criarDivisao));
  const [divisaoAtivaId, setDivisaoAtivaId] = useState(DIVISOES_PADRAO[0].id);
  const [novaDivisaoNome, setNovaDivisaoNome] = useState('');
  const [laudo, setLaudo] = useState('');
  const [gerandoLaudo, setGerandoLaudo] = useState(false);
  const [processandoFotos, setProcessandoFotos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [aviso, setAviso] = useState('');
  const [tarefasRapidas, setTarefasRapidas] = useState([]);
  const [novaTarefaInput, setNovaTarefaInput] = useState('');

  const { analyzeText } = useGroq(oficinaId);

  useEffect(() => {
    if (!oficinaId) return undefined;
    const unsub = onSnapshot(
      collection(db, 'oficinas', oficinaId, 'tarefas'),
      (snap) => {
        const lista = (snap?.docs ?? [])?.map(d => ({ id: d.id, ...d.data() })) ?? [];
        setTarefasRapidas(lista);
      },
      () => null
    );
    return () => unsub();
  }, [oficinaId]);

  const criarTarefa1Clique = async (titulo) => {
    const t = String(titulo || novaTarefaInput || '').trim();
    if (!t) return;
    try {
      const nova = {
        titulo: t,
        descricao: 'Tarefa imobiliária rápida',
        status: 'pendente',
        dataCriacao: new Date().toISOString(),
      };
      if (oficinaId) {
        await addDoc(collection(db, 'oficinas', oficinaId, 'tarefas'), nova);
      } else {
        setTarefasRapidas(prev => [{ id: `local_${Date.now()}`, ...nova }, ...(prev ?? [])]);
      }
      setNovaTarefaInput('');
      mostrarAviso(`Tarefa "${t}" criada com 1 clique!`);
    } catch (e) {
      console.error(e);
    }
  };

  const concluirOuReabrirTarefa = async (tar) => {
    const novoStatus = tar.status === 'concluida' ? 'pendente' : 'concluida';
    if (!oficinaId || String(tar.id).startsWith('local_')) {
      setTarefasRapidas(prev => (prev ?? [])?.map(x => (x.id === tar.id ? { ...x, status: novoStatus } : x)) ?? []);
      return;
    }
    try {
      await updateDoc(doc(db, 'oficinas', oficinaId, 'tarefas', tar.id), { status: novoStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const removerTarefaRapida = async (id) => {
    if (!oficinaId || String(id).startsWith('local_')) {
      setTarefasRapidas(prev => (prev ?? [])?.filter(x => x.id !== id) ?? []);
      return;
    }
    try {
      await deleteDoc(doc(db, 'oficinas', oficinaId, 'tarefas', id));
    } catch (e) {
      console.error(e);
    }
  };

  const divisaoAtiva = useMemo(
    () => (divisoes ?? [])?.find(d => d.id === divisaoAtivaId) || (divisoes ?? [])[0],
    [divisoes, divisaoAtivaId]
  );

  const totalFotos = useMemo(
    () => (divisoes ?? [])?.reduce((acc, d) => acc + (d?.fotos?.length || 0), 0) || 0,
    [divisoes]
  );

  const mostrarAviso = (msg) => {
    setAviso(msg);
    setTimeout(() => setAviso(''), 3500);
  };

  /* ---------------- Histórico ---------------- */

  const carregarHistorico = useCallback(async () => {
    if (!oficinaId) return;
    try {
      const q = query(collection(db, 'oficinas', oficinaId, 'vistorias'), orderBy('dataCriacao', 'desc'));
      const snap = await getDocs(q);
      setHistorico(snap?.docs?.map(d => ({ id: d.id, ...d.data() })) ?? []);
    } catch (erro) {
      console.error('Erro ao carregar vistorias:', erro);
      setHistorico([]);
    }
  }, [oficinaId]);

  useEffect(() => { carregarHistorico(); }, [carregarHistorico]);

  /* ---------------- Divisões ---------------- */

  const atualizarDivisao = (id, patch) => {
    setDivisoes(prev => (prev ?? [])?.map(d => (d.id === id ? { ...d, ...patch } : d)) ?? []);
  };

  const adicionarDivisao = () => {
    const nome = novaDivisaoNome.trim();
    if (!nome) return;
    const nova = criarDivisao({ nome, icon: 'outro' });
    setDivisoes(prev => [...(prev ?? []), nova]);
    setDivisaoAtivaId(nova.id);
    setNovaDivisaoNome('');
  };

  const removerDivisao = (id) => {
    if ((divisoes ?? []).length <= 1) return;
    if (!window.confirm('Remover esta divisão e as respetivas fotos?')) return;
    const restantes = (divisoes ?? [])?.filter(d => d.id !== id) ?? [];
    setDivisoes(restantes);
    if (divisaoAtivaId === id) setDivisaoAtivaId(restantes[0]?.id);
  };

  const alternarObsRapida = (texto) => {
    if (!divisaoAtiva) return;
    const atual = divisaoAtiva.observacoes || '';
    const linhas = atual.split('\n').map(l => l.trim()).filter(Boolean);
    const novas = linhas.includes(texto) ? linhas.filter(l => l !== texto) : [...linhas, texto];
    atualizarDivisao(divisaoAtiva.id, { observacoes: novas.join('\n') });
  };

  /* ---------------- Fotos ---------------- */

  const adicionarFotos = async (event) => {
    const arquivos = Array.from(event?.target?.files ?? []);
    if (event?.target) event.target.value = '';
    if (!divisaoAtiva || arquivos.length === 0) return;
    setProcessandoFotos(true);
    try {
      const novas = await Promise.all(
        arquivos?.map(async (file) => {
          let preview = '';
          try {
            const comprimida = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 1080, useWebWorker: true });
            preview = await imageCompression.getDataUrlFromFile(comprimida);
          } catch {
            preview = await imageCompression.getDataUrlFromFile(file);
          }
          return { id: `foto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, file, preview, legenda: '' };
        }) ?? []
      );
      const alvoId = divisaoAtiva.id;
      setDivisoes(prev => (prev ?? [])?.map(d => (d.id === alvoId ? { ...d, fotos: [...(d.fotos ?? []), ...novas] } : d)) ?? []);
    } catch (erro) {
      console.error('Erro ao processar fotos:', erro);
      alert('Não foi possível processar as fotos selecionadas.');
    } finally {
      setProcessandoFotos(false);
    }
  };

  const removerFoto = (divisaoId, fotoId) => {
    setDivisoes(prev =>
      (prev ?? [])?.map(d => (d.id === divisaoId ? { ...d, fotos: (d.fotos ?? [])?.filter(f => f.id !== fotoId) ?? [] } : d)) ?? []
    );
  };

  const atualizarLegenda = (divisaoId, fotoId, legenda) => {
    setDivisoes(prev =>
      (prev ?? [])?.map(d =>
        d.id === divisaoId ? { ...d, fotos: (d.fotos ?? [])?.map(f => (f.id === fotoId ? { ...f, legenda } : f)) ?? [] } : d
      ) ?? []
    );
  };

  /* ---------------- Laudo ---------------- */

  const resumoDivisoesTexto = () =>
    (divisoes ?? [])
      ?.map(d => {
        const legendas = (d?.fotos ?? [])?.map(f => f?.legenda).filter(Boolean) ?? [];
        return `- ${d.nome}: estado ${labelEstado(d.estado)}; ${d?.fotos?.length || 0} foto(s)` +
          `${legendas.length ? `; legendas: ${legendas.join(' | ')}` : ''}` +
          `; observações: ${(d.observacoes || 'sem observações').replace(/\n/g, '; ')}`;
      })
      .join('\n') ?? '';

  const gerarLaudoLocal = () => {
    const linhas = [
      `LAUDO RESUMIDO — ${labelTipo(dados.tipo).toUpperCase()}`,
      '',
      `Imóvel: ${dados.imovel || '-'}`,
      `Proprietário: ${dados.proprietario || '-'}`,
      `Inquilino / Cliente: ${dados.inquilino || '-'}`,
      `Corretor responsável: ${dados.corretor || '-'}`,
      `Data da vistoria: ${dados.data ? dados.data.split('-').reverse().join('/') : '-'}`,
      `Total de fotos registadas: ${totalFotos}`,
      '',
      'ESTADO POR DIVISÃO',
      ...((divisoes ?? [])?.map(d =>
        `• ${d.nome} — ${labelEstado(d.estado)} (${d?.fotos?.length || 0} foto(s))` +
        `${d.observacoes ? `\n   ${d.observacoes.split('\n').join('; ')}` : ''}`
      ) ?? []),
      '',
      'PONTOS DE ATENÇÃO',
      ...(((divisoes ?? [])?.filter(d => d.estado !== 'bom') ?? []).length
        ? (divisoes ?? [])?.filter(d => d.estado !== 'bom')?.map(d => `• ${d.nome}: ${labelEstado(d.estado)}`) ?? []
        : ['• Nenhuma divisão sinalizada com necessidade de reparo.']),
    ];
    return linhas.join('\n');
  };

  const gerarLaudo = async () => {
    if (!dados.imovel.trim()) { alert('Indique o imóvel / endereço antes de gerar o laudo.'); return; }
    setGerandoLaudo(true);
    const prompt = `Ignore qualquer contexto automotivo ou de oficina. Atue como assistente de vistorias imobiliárias.
Redija um LAUDO RESUMIDO de ${labelTipo(dados.tipo)} em português, objetivo e profissional, em texto simples (sem asteriscos, sem markdown).
Estrutura: 1) Identificação do imóvel e das partes; 2) Estado geral por divisão; 3) Pontos de atenção e recomendações; 4) Conclusão.
Não invente danos nem informações que não constem dos dados abaixo.

Imóvel: ${dados.imovel}
Proprietário: ${dados.proprietario || '-'}
Inquilino / Cliente: ${dados.inquilino || '-'}
Corretor: ${dados.corretor || '-'}
Data: ${dados.data}
Total de fotos: ${totalFotos}

Divisões:
${resumoDivisoesTexto()}`;
    try {
      const resposta = await analyzeText(prompt);
      setLaudo((resposta || '').replace(/\*\*/g, '').trim() || gerarLaudoLocal());
    } catch (erro) {
      console.warn('IA indisponível, a gerar laudo local:', erro);
      setLaudo(gerarLaudoLocal());
      mostrarAviso('IA indisponível — foi gerada uma minuta automática com base nos dados preenchidos.');
    } finally {
      setGerandoLaudo(false);
    }
  };

  const textoCompletoLaudo = () => `${laudo}\n\n⚠️ AVISO LEGAL: ${DISCLAIMER_LAUDO}`;

  const copiarLaudo = async () => {
    if (!laudo) return;
    try {
      await navigator.clipboard.writeText(textoCompletoLaudo());
      mostrarAviso('Laudo copiado para a área de transferência.');
    } catch {
      alert('Não foi possível copiar o laudo.');
    }
  };

  const partilharWhatsApp = () => {
    if (!laudo) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(textoCompletoLaudo())}`, '_blank');
  };

  const imprimirRelatorio = () => {
    const janela = window.open('', '_blank');
    if (!janela) { alert('Permita pop-ups para gerar o relatório fotográfico.'); return; }
    const blocos = (divisoes ?? [])
      ?.map(d => `
        <section class="div">
          <h3>${escapeHtml(d.nome)} <span class="estado">${escapeHtml(labelEstado(d.estado))}</span></h3>
          ${d.observacoes ? `<p class="obs">${escapeHtml(d.observacoes).replace(/\n/g, '<br/>')}</p>` : ''}
          <div class="fotos">
            ${(d?.fotos ?? [])?.map(f => `
              <figure><img src="${f.preview}" /><figcaption>${escapeHtml(f.legenda || '')}</figcaption></figure>
            `).join('') ?? ''}
          </div>
        </section>`)
      .join('') ?? '';

    janela.document.write(`<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"/>
      <title>Relatório Fotográfico — ${escapeHtml(dados.imovel)}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:32px;}
        h1{font-size:22px;margin:0 0 4px;color:#047857}
        .meta{font-size:12px;color:#334155;margin-bottom:16px;line-height:1.6}
        .disclaimer{border:2px solid #10b981;background:#ecfdf5;padding:12px 14px;border-radius:8px;font-size:12px;font-weight:bold;margin:16px 0}
        .laudo{white-space:pre-wrap;font-size:13px;line-height:1.55;border:1px solid #e2e8f0;padding:14px;border-radius:8px}
        .div{page-break-inside:avoid;margin-top:22px}
        .div h3{font-size:15px;border-bottom:2px solid #10b981;padding-bottom:4px}
        .estado{font-size:11px;background:#10b981;color:#fff;padding:2px 8px;border-radius:10px;margin-left:6px}
        .obs{font-size:12px;color:#334155}
        .fotos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        figure{margin:0}
        img{width:100%;height:150px;object-fit:cover;border-radius:6px;border:1px solid #cbd5e1}
        figcaption{font-size:10px;color:#475569;margin-top:2px}
      </style></head><body>
      <h1>Relatório Fotográfico — ${escapeHtml(labelTipo(dados.tipo))}</h1>
      <div class="meta">
        <b>Imóvel:</b> ${escapeHtml(dados.imovel || '-')}<br/>
        <b>Proprietário:</b> ${escapeHtml(dados.proprietario || '-')} &nbsp;|&nbsp;
        <b>Inquilino / Cliente:</b> ${escapeHtml(dados.inquilino || '-')}<br/>
        <b>Corretor:</b> ${escapeHtml(dados.corretor || '-')} &nbsp;|&nbsp;
        <b>Data:</b> ${escapeHtml(dados.data ? dados.data.split('-').reverse().join('/') : '-')}
      </div>
      <div class="disclaimer">⚠️ AVISO LEGAL: ${escapeHtml(DISCLAIMER_LAUDO)}</div>
      ${laudo ? `<h2 style="font-size:16px">Laudo Resumido</h2><div class="laudo">${escapeHtml(laudo)}</div>` : ''}
      ${blocos}
      <div class="disclaimer">⚠️ AVISO LEGAL: ${escapeHtml(DISCLAIMER_LAUDO)}</div>
      <script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
      </body></html>`);
    janela.document.close();
  };

  /* ---------------- Guardar ---------------- */

  const guardarVistoria = async () => {
    if (!oficinaId) { alert('Sessão inválida. Faça login novamente.'); return; }
    if (!dados.imovel.trim()) { alert('Indique o imóvel / endereço.'); return; }
    setSalvando(true);
    try {
      const divisoesSalvas = await Promise.all(
        (divisoes ?? [])?.map(async (d) => {
          const fotos = d?.fotos ?? [];
          const urls = fotos.length ? await uploadImages(fotos?.map(f => f.file) ?? [], oficinaId, 'vistorias') : [];
          return {
            nome: d.nome,
            estado: d.estado,
            observacoes: d.observacoes || '',
            fotos: (urls ?? [])?.map((url, i) => ({ url, legenda: fotos[i]?.legenda || '' })) ?? [],
          };
        }) ?? []
      );
      await addDoc(collection(db, 'oficinas', oficinaId, 'vistorias'), {
        ...dados,
        divisoes: divisoesSalvas,
        laudo: laudo || '',
        disclaimer: DISCLAIMER_LAUDO,
        totalFotos,
        dataCriacao: Timestamp.now(),
      });
      mostrarAviso('Vistoria guardada com sucesso.');
      setDados(dadosIniciais());
      setDivisoes(DIVISOES_PADRAO.map(criarDivisao));
      setDivisaoAtivaId(DIVISOES_PADRAO[0].id);
      setLaudo('');
      carregarHistorico();
    } catch (erro) {
      console.error('Erro ao guardar vistoria:', erro);
      alert('Erro ao guardar a vistoria.');
    } finally {
      setSalvando(false);
    }
  };

  const excluirVistoria = async (id) => {
    if (!oficinaId || !window.confirm('Excluir esta vistoria do histórico?')) return;
    try {
      await deleteDoc(doc(db, 'oficinas', oficinaId, 'vistorias', id));
      carregarHistorico();
    } catch (erro) { console.error(erro); }
  };

  /* ---------------- Render ---------------- */

  const IconeAtivo = ICONES_DIVISAO[divisaoAtiva?.icon] || Home;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans bg-[#020408]">

      {/* HERO */}
      <section className="overflow-hidden rounded-[28px] border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_32%),linear-gradient(135deg,_#020408,_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(16,185,129,0.3)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
              <Sparkles size={14} /> Vistoria Imobiliária com IA
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Vistoria Imobiliária & Laudo Fotográfico
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              Registe vistorias de entrada e saída, entregas de chaves e captações. Fotografe cada divisão,
              anote observações e gere um relatório fotográfico profissional para os seus clientes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <Stat label="Fotos" value={totalFotos} />
            <Stat label="Vistorias" value={(historico ?? []).length} />
          </div>
        </div>
      </section>

      {/* DISCLAIMER */}
      <Disclaimer />

      {aviso && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300">
          <CheckCircle2 size={16} /> {aviso}
        </div>
      )}

      {/* TAREFAS IMOBILIÁRIAS RÁPIDAS (CRIAÇÃO COM 1 CLIQUE) */}
      <section className="rounded-[28px] border border-emerald-500/30 bg-slate-950/90 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-white">
              <Zap size={18} className="text-emerald-500" /> Tarefas Imobiliárias Rápidas (Criação com 1 Clique)
            </h2>
            <p className="text-xs text-slate-400">
              Registe compromissos operacionais com um único clique ou use o botão flutuante de tarefas a qualquer momento.
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-extrabold text-emerald-400">
            {(tarefasRapidas ?? []).length} Tarefa(s)
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            '📸 Vistoria de Entrada',
            '🔑 Entrega de Chaves',
            '📞 Retornar Lead Quente',
            '🏠 Captar Novo Imóvel',
            '📄 Enviar Contrato p/ Assinatura',
            '📅 Confirmar Visita com Proprietário',
          ]?.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => criarTarefa1Clique(preset)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-emerald-500 hover:bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-emerald-300 transition cursor-pointer"
            >
              <span>{preset}</span>
              <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black text-slate-950">+1 Clique</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={novaTarefaInput}
            onChange={(e) => setNovaTarefaInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && criarTarefa1Clique(novaTarefaInput)}
            placeholder="Ou digite uma tarefa personalizada e clique em Criar..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => criarTarefa1Clique(novaTarefaInput)}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black uppercase text-slate-950 hover:bg-emerald-400 transition cursor-pointer"
          >
            + Criar Tarefa
          </button>
        </div>

        {(tarefasRapidas ?? []).length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(tarefasRapidas ?? []).slice(0, 6)?.map((tar) => {
              const concluida = tar.status === 'concluida';
              return (
                <div
                  key={tar.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => concluirOuReabrirTarefa(tar)}
                    className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] font-black shrink-0 ${
                        concluida
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : 'border-slate-600 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className={`text-xs font-bold truncate ${concluida ? 'line-through text-slate-500' : 'text-white'}`}>
                      {tar.titulo}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removerTarefaRapida(tar.id)}
                    className="text-slate-500 hover:text-emerald-400 p-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* DADOS DA VISTORIA */}
      <section className="rounded-[28px] border border-slate-800 bg-slate-950/80 p-6">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-white">
          <FileText size={18} className="text-emerald-500" /> Dados da Vistoria
        </h2>
        <div className="mb-5 flex flex-wrap gap-2">
          {TIPOS_VISTORIA?.map(t => {
            const Icone = t.icon;
            const ativo = dados.tipo === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setDados(p => ({ ...p, tipo: t.value }))}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${ativo ? 'border-emerald-400 bg-emerald-500 text-slate-950' : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'}`}
              >
                <Icone size={14} /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Imóvel / Endereço *" icon={<MapPin size={14} />} value={dados.imovel} onChange={v => setDados(p => ({ ...p, imovel: v }))} placeholder="Rua das Flores, 120 - Apto 302" />
          <Field label="Proprietário" icon={<User size={14} />} value={dados.proprietario} onChange={v => setDados(p => ({ ...p, proprietario: v }))} placeholder="Nome do proprietário" />
          <Field label="Inquilino / Cliente" icon={<User size={14} />} value={dados.inquilino} onChange={v => setDados(p => ({ ...p, inquilino: v }))} placeholder="Nome do inquilino ou cliente" />
          <Field label="Corretor Responsável" icon={<User size={14} />} value={dados.corretor} onChange={v => setDados(p => ({ ...p, corretor: v }))} placeholder="Nome do corretor" />
          <Field label="Data" type="date" icon={<Calendar size={14} />} value={dados.data} onChange={v => setDados(p => ({ ...p, data: v }))} />
        </div>
      </section>

      {/* DIVISÕES */}
      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3 rounded-[28px] border border-slate-800 bg-slate-950/80 p-4">
          <p className="px-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">Divisões do Imóvel</p>
          {(divisoes ?? [])?.map(d => {
            const Icone = ICONES_DIVISAO[d.icon] || Home;
            const ativo = d.id === divisaoAtiva?.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDivisaoAtivaId(d.id)}
                className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-3 py-3 text-left text-sm font-bold transition-all ${ativo ? 'border-emerald-500/50 bg-emerald-500/10 text-white' : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white'}`}
              >
                <span className="flex items-center gap-2"><Icone size={16} className="text-emerald-500" /> {d.nome}</span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-400">
                  {d?.fotos?.length || 0} <Camera size={10} className="inline" />
                </span>
              </button>
            );
          })}
          <div className="flex gap-2 pt-2">
            <input
              value={novaDivisaoNome}
              onChange={e => setNovaDivisaoNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionarDivisao()}
              placeholder="Ex: Quarto 2, Varanda"
              className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/60 placeholder:text-slate-600"
            />
            <button type="button" onClick={adicionarDivisao} className="rounded-xl bg-emerald-500 px-3 text-slate-950 hover:bg-emerald-400" title="Adicionar divisão">
              <Plus size={16} />
            </button>
          </div>
        </aside>

        {divisaoAtiva && (
          <div className="space-y-6 rounded-[28px] border border-emerald-500/20 bg-slate-950/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="flex items-center gap-2 text-2xl font-black text-white">
                <IconeAtivo size={22} className="text-emerald-500" /> {divisaoAtiva.nome}
              </h3>
              <div className="flex items-center gap-2">
                {ESTADOS?.map(e => (
                  <button
                    key={e.value}
                    type="button"
                    onClick={() => atualizarDivisao(divisaoAtiva.id, { estado: e.value })}
                    className={`rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${divisaoAtiva.estado === e.value ? 'border-emerald-400 bg-emerald-500 text-slate-950' : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'}`}
                  >
                    {e.label}
                  </button>
                ))}
                {(divisoes ?? []).length > 1 && (
                  <button type="button" onClick={() => removerDivisao(divisaoAtiva.id)} className="rounded-xl border border-slate-800 p-2 text-slate-500 hover:text-white" title="Remover divisão">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Fotos */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Fotos da divisão</span>
                <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-emerald-400 ${processandoFotos ? 'pointer-events-none opacity-60' : ''}`}>
                  {processandoFotos ? <LoaderCircle size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                  {processandoFotos ? 'A processar...' : 'Adicionar Fotos'}
                  <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={adicionarFotos} />
                </label>
              </div>
              {(divisaoAtiva?.fotos ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-800 bg-slate-900/20 py-12 text-slate-500">
                  <Camera size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma foto nesta divisão. Toque em “Adicionar Fotos”.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {divisaoAtiva?.fotos?.map(f => (
                    <div key={f.id} className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                      <img src={f.preview} alt={f.legenda || divisaoAtiva.nome} className="h-32 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removerFoto(divisaoAtiva.id, f.id)}
                        className="absolute right-2 top-2 rounded-full bg-[#020408]/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        title="Remover foto"
                      >
                        <X size={14} />
                      </button>
                      <input
                        value={f.legenda}
                        onChange={e => atualizarLegenda(divisaoAtiva.id, f.id, e.target.value)}
                        placeholder="Legenda..."
                        className="w-full border-t border-slate-800 bg-transparent px-2 py-1.5 text-[11px] text-slate-300 outline-none placeholder:text-slate-600"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-3">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Observações rápidas</span>
              <div className="flex flex-wrap gap-2">
                {OBS_RAPIDAS?.map(o => {
                  const ativo = (divisaoAtiva?.observacoes || '').split('\n')?.map(l => l.trim())?.includes(o);
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => alternarObsRapida(o)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-bold transition-all ${ativo ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300' : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'}`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={divisaoAtiva.observacoes}
                onChange={e => atualizarDivisao(divisaoAtiva.id, { observacoes: e.target.value })}
                rows={4}
                placeholder="Descreva o estado de paredes, piso, teto, janelas, instalações elétricas e hidráulicas..."
                className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/60 placeholder:text-slate-600"
              />
            </div>
          </div>
        )}
      </section>

      {/* LAUDO */}
      <section className="space-y-5 rounded-[28px] border border-emerald-500/20 bg-slate-950/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-lg font-black text-white">
            <Sparkles size={18} className="text-emerald-500" /> Laudo Resumido com IA
          </h2>
          <button
            type="button"
            onClick={gerarLaudo}
            disabled={gerandoLaudo}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {gerandoLaudo ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {gerandoLaudo ? 'A gerar laudo...' : laudo ? 'Regenerar Laudo' : 'Gerar Laudo'}
          </button>
        </div>

        <textarea
          value={laudo}
          onChange={e => setLaudo(e.target.value)}
          rows={12}
          placeholder="O laudo resumido gerado pela IA aparecerá aqui e poderá ser editado antes de partilhar."
          className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 font-mono text-sm leading-relaxed text-slate-200 outline-none focus:border-emerald-500/60 placeholder:text-slate-600"
        />

        <Disclaimer compacto />

        <div className="flex flex-wrap gap-3">
          <ActionButton onClick={imprimirRelatorio} icon={<Printer size={16} />} label="Relatório Fotográfico / PDF" />
          <ActionButton onClick={copiarLaudo} disabled={!laudo} icon={<Copy size={16} />} label="Copiar Laudo" />
          <ActionButton onClick={partilharWhatsApp} disabled={!laudo} icon={<Share2 size={16} />} label="Enviar ao Cliente" />
          <button
            type="button"
            onClick={guardarVistoria}
            disabled={salvando}
            className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {salvando ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
            {salvando ? 'A guardar...' : 'Guardar Vistoria'}
          </button>
        </div>
      </section>

      {/* HISTÓRICO */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-black text-white">
          <History size={18} className="text-emerald-500" /> Histórico de Vistorias
        </h2>
        {(historico ?? []).length === 0 ? (
          <div className="rounded-[24px] border-2 border-dashed border-slate-800 bg-slate-900/20 py-10 text-center text-sm text-slate-500">
            Nenhuma vistoria guardada até ao momento.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {historico?.map(v => (
              <div key={v.id} className="group rounded-[24px] border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="mb-2 inline-flex rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      {labelTipo(v.tipo)}
                    </span>
                    <h4 className="truncate font-black text-white">{v.imovel || '-'}</h4>
                    <p className="mt-1 text-xs text-slate-400">
                      {v.data ? v.data.split('-').reverse().join('/') : '-'} · {v.totalFotos || 0} foto(s) · {(v?.divisoes ?? []).length} divisão(ões)
                    </p>
                  </div>
                  <button type="button" onClick={() => excluirVistoria(v.id)} className="rounded-xl border border-slate-800 p-2 text-slate-500 opacity-0 transition-opacity hover:text-white group-hover:opacity-100" title="Excluir">
                    <Trash2 size={14} />
                  </button>
                </div>
                {(v?.divisoes ?? []).some(d => (d?.fotos ?? []).length) && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {(v?.divisoes ?? [])?.flatMap(d => d?.fotos ?? [])?.slice(0, 6)?.map((f, i) => (
                      <img key={`${v.id}_${i}`} src={f?.url} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-slate-800 object-cover" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* COMPONENTES AUXILIARES                                              */
/* ------------------------------------------------------------------ */

function Disclaimer({ compacto = false }) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-[20px] border-2 border-emerald-500/60 bg-emerald-500/10 ${compacto ? 'px-4 py-3' : 'px-5 py-4'}`}
    >
      <ShieldAlert size={compacto ? 18 : 24} className="mt-0.5 shrink-0 text-emerald-400" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">Aviso Legal</p>
        <p className={`font-bold text-white ${compacto ? 'text-xs' : 'text-sm'}`}>{DISCLAIMER_LAUDO}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#020408]/60 px-5 py-3">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{label}</p>
    </div>
  );
}

function ActionButton({ onClick, icon, label, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-black text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-40"
    >
      {icon} {label}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', icon }) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">{icon}{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500/60 placeholder:text-slate-600"
      />
    </label>
  );
}
