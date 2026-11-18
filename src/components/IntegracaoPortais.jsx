import React, { useEffect, useMemo, useState } from 'react';
import {
  Rss, KeyRound, Copy, Check, RefreshCw, Link2, Mail, Plus, Loader2,
  AlertTriangle, ShieldCheck, ExternalLink, Info,
} from 'lucide-react';
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  PORTAIS, gerarTokenPortal, extrairLeadDeEmail, leadParaFirestore,
  resumoFeed, urlFeedXml, urlWebhook, ORIGEM_POR_PORTAL,
} from '../lib/portais';

const card = 'bg-slate-900/90 border border-slate-800 rounded-3xl';
const inputCls = 'w-full bg-[#020408] border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]';
const labelCls = 'block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1';

export default function IntegracaoPortais({ oficinaId: oficinaProp, papelLogado: papelProp }) {
  // Funciona dentro de Configurações (props) ou sozinho (contexto).
  const auth = useAuth();
  const oficinaId = oficinaProp || auth?.currentUserId || null;
  const papelLogado = papelProp || auth?.papelLogado || 'corretor';
  const [portais, setPortais] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [copiado, setCopiado] = useState('');
  const [imoveis, setImoveis] = useState([]);
  const [textoEmail, setTextoEmail] = useState('');
  const [extraido, setExtraido] = useState(null);
  const [criandoLead, setCriandoLead] = useState(false);
  const [leadCriado, setLeadCriado] = useState('');

  const ehGestor = ['dono', 'admin', 'master'].includes(papelLogado);
  const origem = typeof window !== 'undefined' ? window.location.origin : 'https://express-imobi-tech-dqgx.vercel.app';

  useEffect(() => {
    let vivo = true;
    async function carregar() {
      if (!oficinaId) { setCarregando(false); return; }
      try {
        const snap = await getDoc(doc(db, 'oficinas', oficinaId, 'configuracoes', 'portais'));
        if (vivo && snap.exists()) setPortais(snap.data());
      } catch (e) {
        // corretor não lê o documento (rules: ehGestor) — não é erro de tela
        if (vivo) setErro(ehGestor ? `Falha ao ler a configuração: ${e?.message || e}` : '');
      }
      try {
        const snapImv = await getDocs(collection(db, 'oficinas', oficinaId, 'imoveis_imobi'));
        if (vivo) setImoveis(snapImv.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { /* segue sem a contagem */ }
      if (vivo) setCarregando(false);
    }
    carregar();
    return () => { vivo = false; };
  }, [oficinaId, ehGestor]);

  const resumo = useMemo(() => resumoFeed(imoveis), [imoveis]);
  const feed = urlFeedXml(origem, oficinaId || '');
  const webhook = urlWebhook(origem, oficinaId || '', portais?.token || '');

  async function copiar(texto, chave) {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(chave);
      setTimeout(() => setCopiado(''), 2000);
    } catch { setCopiado(''); }
  }

  async function gerarToken() {
    if (!oficinaId || !ehGestor) return;
    const token = gerarTokenPortal();
    setErro('');
    try {
      await setDoc(doc(db, 'oficinas', oficinaId, 'configuracoes', 'portais'), {
        token,
        ativo: true,
        atualizadoEm: serverTimestamp(),
        atualizadoPor: 'painel',
      }, { merge: true });
      setPortais((atual) => ({ ...(atual || {}), token, ativo: true }));
    } catch (e) {
      setErro(`Falha ao gravar o token: ${e?.message || e}`);
    }
  }

  function analisarEmail() {
    const r = extrairLeadDeEmail(textoEmail);
    setExtraido(r);
    setLeadCriado('');
  }

  async function criarLeadDoEmail() {
    if (!extraido?.valido || !oficinaId) return;
    setCriandoLead(true);
    setErro('');
    try {
      const payload = {
        ...leadParaFirestore(
          { ...extraido, portal: extraido.portal, origem: extraido.origem },
          { imovelId: extraido.imovelId || null },
        ),
        data_registro: new Date().toISOString(),
        criadoEm: serverTimestamp(),
        origem: `${extraido.origem} (e-mail)`,
        recebidoPorEmail: true,
      };
      const ref = await addDoc(collection(db, 'oficinas', oficinaId, 'leads_imobi'), payload);
      setLeadCriado(ref.id);
      setTextoEmail('');
    } catch (e) {
      setErro(`Falha ao criar o lead: ${e?.message || e}`);
    } finally {
      setCriandoLead(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#10b981]">
              <Rss size={13} /> Integração com portais
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Feed XML nativo para ZAP, VivaReal, OLX, Imovelweb e Chaves na Mão — sem intermediário.
              {resumo.total > 0 && (
                <span className="ml-1 text-slate-300">
                  {resumo.publicaveis} de {resumo.total} imóveis entram no feed
                  {resumo.ocultos > 0 ? ` (${resumo.ocultos} fora por status/publicarPortais)` : ''}.
                </span>
              )}
            </p>
          </div>
          <span className="rounded-full border border-[#10b981]/40 bg-[#10b981]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#10b981]">
            serverless /api
          </span>
        </div>

        {carregando && <p className="mt-3 text-[11px] text-slate-500">Carregando…</p>}

        {/* FEED */}
        <div className="mt-4 rounded-2xl border border-slate-800 p-3">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Link2 size={12} /> URL do feed XML
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input readOnly value={feed} className={inputCls} onFocus={(e) => e.target.select()} />
            <button
              onClick={() => copiar(feed, 'feed')}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#10b981]/50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#10b981]"
            >
              {copiado === 'feed' ? <Check size={12} /> : <Copy size={12} />} Copiar Link XML
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={feed} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white">
              <ExternalLink size={10} /> abrir feed
            </a>
            <span className="text-[9px] text-slate-600">atualiza a cada 5 min</span>
          </div>
        </div>

        {/* WEBHOOK */}
        <div className="mt-3 rounded-2xl border border-slate-800 p-3">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <KeyRound size={12} /> Webhook de leads
          </p>

          {!ehGestor ? (
            <p className="mt-2 flex items-start gap-1.5 text-[10px] text-amber-300">
              <ShieldCheck size={11} className="mt-0.5" /> O token do webhook é visível apenas para dono/admin.
            </p>
          ) : (
            <>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input readOnly value={portais?.token || ''} placeholder="Nenhum token gerado ainda" className={inputCls} onFocus={(e) => e.target.select()} />
                <button onClick={gerarToken} className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#10b981] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-950">
                  <RefreshCw size={12} /> {portais?.token ? 'Gerar Novo Token' : 'Gerar Token'}
                </button>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input readOnly value={webhook} placeholder="Gere o token para montar a URL" className={inputCls} onFocus={(e) => e.target.select()} />
                <button
                  onClick={() => copiar(webhook, 'webhook')}
                  disabled={!portais?.token}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 disabled:opacity-40"
                >
                  {copiado === 'webhook' ? <Check size={12} /> : <Copy size={12} />} Copiar URL Webhook
                </button>
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-[9px] text-slate-500">
                <Info size={10} className="mt-0.5 shrink-0" />
                O token fica em <code>configuracoes/portais</code>, com leitura só de gestor. Trocar o token invalida a URL antiga na hora.
              </p>
            </>
          )}
        </div>

        {/* GUIA */}
        <div className="mt-3 rounded-2xl border border-slate-800 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Onde colar</p>
          <ul className="mt-1.5 space-y-1 text-[10px] text-slate-400">
            <li><strong className="text-slate-200">ZAP / VivaReal:</strong> painel do anunciante → Configurações → Integração → Carga XML → colar a URL do feed.</li>
            <li><strong className="text-slate-200">OLX:</strong> Anúncios → Importar catálogo → XML → informar a URL.</li>
            <li><strong className="text-slate-200">Imovelweb / Chaves na Mão:</strong> Configurações → Integração/Importação → XML.</li>
            <li><strong className="text-slate-200">Leads:</strong> cadastre a URL do webhook na aba de integração do portal (ou encaminhe o e-mail e use o extrator abaixo).</li>
          </ul>
        </div>

        {erro && <p className="mt-2 flex items-start gap-1.5 text-[10px] text-red-300"><AlertTriangle size={11} className="mt-0.5" /> {erro}</p>}
      </div>

      {/* EXTRATOR DE E-MAIL */}
      <div className={`${card} p-5`}>
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Mail size={13} /> Extrator rápido de e-mail de portal
        </p>
        <p className="mt-1 text-[10px] text-slate-500">Cole o texto do e-mail do portal. Extraímos nome, telefone, e-mail e código do imóvel.</p>

        <textarea
          className={`${inputCls} mt-2 h-28 resize-y`}
          placeholder={'Novo contato do portal\nNome: Maria Souza\nTelefone: (34) 99999-8888\nCódigo do imóvel: AP302'}
          value={textoEmail}
          onChange={(e) => setTextoEmail(e.target.value)}
        />

        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={analisarEmail} disabled={!textoEmail.trim()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-300 disabled:opacity-40">
            Extrair dados
          </button>
          <button
            onClick={criarLeadDoEmail}
            disabled={!extraido?.valido || criandoLead || !oficinaId}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#10b981] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-950 disabled:opacity-40"
          >
            {criandoLead ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Criar lead no funil
          </button>
        </div>

        {extraido && (
          <div className="mt-3 rounded-xl border border-slate-800 p-2.5 text-[10px]">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Prévia</p>
            <p className="mt-1 text-slate-200">
              <strong>{extraido.nome || '—'}</strong>
              {' · '}{extraido.telefone || 'sem telefone'}
              {' · '}{extraido.email || 'sem e-mail'}
            </p>
            <p className="text-slate-400">
              imóvel: {extraido.imovelCodigo || '—'} · origem: {extraido.origem}
            </p>
            {!extraido.valido && <p className="text-amber-300">Precisa de nome + telefone ou e-mail.</p>}
          </div>
        )}

        {leadCriado && (
          <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[#10b981]">
            <Check size={11} /> Lead criado no funil ({leadCriado.slice(0, 8)}…).
          </p>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {PORTAIS.slice(0, 3).map((p) => (
          <div key={p.key} className="rounded-xl border border-slate-800 px-3 py-2">
            <p className="text-[10px] font-black text-white">{p.label}</p>
            <p className="text-[9px] text-slate-500">{ORIGEM_POR_PORTAL[p.key]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
