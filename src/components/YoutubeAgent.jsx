import { useState } from 'react';
import HeroAba from './admin/HeroAba';
import {
  Bot,
  Check,
  Clipboard,
  ExternalLink,
  FileText,
  LoaderCircle,
  Play,
  Sparkles,
  WandSparkles,
  Youtube,
} from 'lucide-react';
import { useGemini } from '../hooks/useGemini';

const MODOS = [
  {
    id: 'analise',
    label: 'Análise estratégica',
    description: 'Identifique ideias, público, pontos fortes e oportunidades.',
    icon: Sparkles,
  },
  {
    id: 'resumo',
    label: 'Resumo executivo',
    description: 'Converta o conteúdo em um resumo claro e acionável.',
    icon: FileText,
  },
  {
    id: 'roteiro',
    label: 'Roteiro estruturado',
    description: 'Gere um roteiro pronto para um novo vídeo.',
    icon: WandSparkles,
  },
];

const extrairVideoId = (valor) => {
  try {
    const url = new URL(valor);
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0];
    if (url.hostname.includes('youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v');
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2];
      if (url.pathname.startsWith('/embed/')) return url.pathname.split('/')[2];
    }
  } catch {
    return null;
  }
  return null;
};

const normalizarLink = (valor) => {
  const videoId = extrairVideoId(valor.trim());
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
};

const criarPrompt = ({ modo, link, metadados, contexto }) => {
  const instrucoes = {
    analise: 'Faça uma análise estratégica do conteúdo, cobrindo tese central, público, estrutura, pontos fortes, pontos fracos, oportunidades e 5 ações práticas.',
    resumo: 'Crie um resumo executivo em português do Brasil com contexto, 7 ideias principais, conclusões e próximos passos. Não invente informações ausentes.',
    roteiro: 'Crie um roteiro estruturado de vídeo em português do Brasil com título, gancho de 15 segundos, capítulos, falas sugeridas, B-roll, CTA e descrição para YouTube.',
  };

  return `Você é um estrategista de conteúdo para YouTube. ${instrucoes[modo]}

LINK DO VÍDEO: ${link}
TÍTULO EXTRAÍDO: ${metadados.title || 'não disponível'}
AUTOR/CANAL: ${metadados.author_name || 'não disponível'}
CONTEXTO, DESCRIÇÃO OU TRANSCRIÇÃO FORNECIDA PELO USUÁRIO:
${contexto || 'Nenhum contexto adicional foi fornecido.'}

Trabalhe apenas com os dados disponíveis. Quando o conteúdo integral não estiver disponível, sinalize essa limitação e indique quais conclusões são hipóteses. Use títulos e listas em Markdown.`;
};

export default function YoutubeAgent() {
  const { analyzeText, loading: iaCarregando } = useGemini();
  const [link, setLink] = useState('');
  const [metadados, setMetadados] = useState({});
  const [contexto, setContexto] = useState('');
  const [modo, setModo] = useState('analise');
  const [resultado, setResultado] = useState('');
  const [extraindo, setExtraindo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [historico, setHistorico] = useState([]);

  const videoId = extrairVideoId(link);
  const linkNormalizado = normalizarLink(link);

  const extrairDados = async () => {
    if (!linkNormalizado) {
      alert('Cole um link válido do YouTube.');
      return;
    }

    setExtraindo(true);
    try {
      const resposta = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(linkNormalizado)}&format=json`);
      if (!resposta.ok) throw new Error('Metadados indisponíveis');
      setMetadados(await resposta.json());
    } catch {
      setMetadados({});
      alert('Não foi possível extrair os metadados agora. O link continua pronto para análise.');
    } finally {
      setExtraindo(false);
    }
  };

  const solicitarIA = async () => {
    if (!linkNormalizado) {
      alert('Adicione um link válido do YouTube antes de solicitar a IA.');
      return;
    }

    try {
      const resposta = await analyzeText(criarPrompt({ modo, link: linkNormalizado, metadados, contexto }));
      const novoResultado = { id: Date.now(), modo, titulo: metadados.title || linkNormalizado, conteudo: resposta };
      setResultado(resposta);
      setHistorico((anterior) => [novoResultado, ...anterior].slice(0, 5));
    } catch (erro) {
      setResultado(`Não foi possível concluir a solicitação: ${erro.message}`);
    }
  };

  const copiarResultado = async () => {
    await navigator.clipboard.writeText(resultado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };

  return (
    <section className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/70 via-zinc-900 to-zinc-950 p-6 shadow-2xl shadow-emerald-950/20 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-emerald-600 p-4 shadow-lg shadow-emerald-600/30"><Youtube size={34} /></div>
            <HeroAba
              flat
              icone={Youtube}
              chip="Painel de agentes"
              titulo="YouTube Agent"
              subtitulo="Extraia contexto, transforme vídeos em decisões e acelere a produção de conteúdo."
              cor="#ef4444"
            />
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 md:self-auto">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> IA pronta
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl md:p-6">
              <div className="mb-5 flex items-center gap-3"><Play className="text-emerald-500" size={20} /><h2 className="font-black">Fonte do conteúdo</h2></div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-emerald-500" />
                <button type="button" onClick={extrairDados} disabled={extraindo || !linkNormalizado} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500">
                  {extraindo ? <LoaderCircle size={16} className="animate-spin" /> : <Bot size={16} />} Extrair dados
                </button>
              </div>
              {videoId && <p className="mt-3 text-xs text-zinc-500">ID identificado: <span className="font-mono text-emerald-400">{videoId}</span></p>}
              {metadados.title && <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4"><p className="font-bold text-emerald-200">{metadados.title}</p><p className="mt-1 text-xs text-zinc-400">Canal: {metadados.author_name}</p></div>}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-xl md:p-6">
              <div className="mb-5 flex items-center gap-3"><Bot className="text-emerald-500" size={20} /><h2 className="font-black">Escolha o agente</h2></div>
              <div className="grid gap-3 md:grid-cols-3">
                {MODOS.map((item) => {
                  const IconComponent = item.icon;
                  return <button key={item.id} type="button" onClick={() => setModo(item.id)} className={`rounded-xl border p-4 text-left transition ${modo === item.id ? 'border-emerald-500 bg-emerald-600/15 text-white shadow-lg shadow-emerald-950/20' : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-emerald-500/50'}`}><IconComponent size={20} className="mb-3 text-emerald-500" /><span className="block text-sm font-black">{item.label}</span><span className="mt-2 block text-xs leading-relaxed text-zinc-500">{item.description}</span></button>;
                })}
              </div>
              <label className="mt-6 block text-xs font-black uppercase tracking-widest text-zinc-500">Descrição, transcrição ou objetivo (opcional)</label>
              <textarea value={contexto} onChange={(e) => setContexto(e.target.value)} rows={6} placeholder="Cole uma transcrição, descreva o público ou diga o que você quer aproveitar do vídeo..." className="mt-2 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-sm leading-relaxed outline-none transition focus:border-emerald-500" />
              <button type="button" onClick={solicitarIA} disabled={iaCarregando || !linkNormalizado} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-black transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500">{iaCarregando ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />} {iaCarregando ? 'Processando...' : 'Solicitar agente de IA'}</button>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl">
              <div className="aspect-video bg-black">{videoId ? <iframe title="Prévia do vídeo do YouTube" src={`https://www.youtube.com/embed/${videoId}`} className="h-full w-full" allowFullScreen /> : <div className="flex h-full items-center justify-center text-center text-sm text-zinc-600"><div><Youtube size={42} className="mx-auto mb-3 text-emerald-700" /><p>A prévia aparecerá aqui</p></div></div>}</div>
              {linkNormalizado && <a href={linkNormalizado} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 border-t border-zinc-800 px-4 py-3 text-xs font-bold text-emerald-400 hover:text-emerald-300">Abrir no YouTube <ExternalLink size={14} /></a>}
            </div>

            {resultado && <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900/80 p-5 shadow-xl md:p-6"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-black text-emerald-400">Resultado do agente</h2><button type="button" onClick={copiarResultado} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 hover:border-emerald-500 hover:text-white">{copiado ? <Check size={14} /> : <Clipboard size={14} />}{copiado ? 'Copiado' : 'Copiar'}</button></div><div className="max-h-[520px] overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-zinc-300">{resultado}</div></div>}

            {historico.length > 0 && <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"><h2 className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-500">Solicitações recentes</h2><div className="space-y-2">{historico.map((item) => <button key={item.id} type="button" onClick={() => setResultado(item.conteudo)} className="block w-full truncate rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-left text-xs text-zinc-400 hover:border-emerald-500/50 hover:text-white">{item.modo} · {item.titulo}</button>)}</div></div>}
          </aside>
        </div>
      </div>
    </section>
  );
}