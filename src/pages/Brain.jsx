import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LogoExpress from '../components/ui/LogoExpress';

/**
 * Brain — Control Brain do celular.
 * Rota privada (/brain): só a conta administradora da plataforma entra.
 *
 * Aba 1 · Captura rápida  → escreve/ditap no celular e anexa a decisão no topo
 *                           do documento, com a data AAAA-MM-DD.
 * Aba 2 · Consultar       → lê os 6 documentos do `company_brain`.
 *
 * A nuvem é a fonte quando você está longe do PC. Para reconciliar com o disco,
 * rode `npm run brain:pull` na máquina (git é o registro histórico de lá).
 */

const DOCS = [
  { slug: '01-identidade-produtos', titulo: 'Identidade e Produtos', curto: 'Identidade' },
  { slug: '02-regras-comerciais', titulo: 'Regras Comerciais', curto: 'Comercial' },
  { slug: '03-mapa-agentes', titulo: 'Mapa de Agentes e Skills', curto: 'Agentes' },
  { slug: '04-arquitetura-stack', titulo: 'Arquitetura e Stack', curto: 'Arquitetura' },
  { slug: '05-decisoes-ativas', titulo: 'Decisões Ativas', curto: 'Decisões' },
  { slug: '06-governanca-lei-financeiro', titulo: 'Governança Fiscal e Financeira', curto: 'Fiscal' },
];

const hoje = () => new Date().toISOString().slice(0, 10);

function mensagemErro(e) {
  const codigo = e?.code || '';
  if (codigo.includes('permission-denied')) {
    return 'Sem permissão no Firestore. A regra do `company_brain` ainda não foi publicada — rode `firebase deploy --only firestore:rules` no PC.';
  }
  if (codigo.includes('unavailable') || codigo.includes('network')) {
    return 'Sem conexão agora. O texto continua aqui; tente salvar de novo quando voltar.';
  }
  return e?.message || 'Falha inesperada ao falar com o Firestore.';
}

export default function Brain() {
  const navigate = useNavigate();
  const [aba, setAba] = useState('capturar');

  // captura
  const [texto, setTexto] = useState('');
  const [destino, setDestino] = useState('05-decisoes-ativas');
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState(null);

  // consulta
  const [docs, setDocs] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [slugAberto, setSlugAberto] = useState('05-decisoes-ativas');
  const [conteudo, setConteudo] = useState('');
  const [carregandoDoc, setCarregandoDoc] = useState(false);

  const dataDeHoje = useMemo(hoje, []);

  async function carregarLista() {
    setCarregandoLista(true);
    try {
      const snap = await getDocs(collection(db, 'company_brain'));
      const lista = snap.docs.map((d) => ({ slug: d.id, ...d.data() }));
      setDocs(lista);
    } catch (e) {
      setAviso({ tipo: 'erro', texto: mensagemErro(e) });
    } finally {
      setCarregandoLista(false);
    }
  }

  useEffect(() => {
    carregarLista();
  }, []);

  async function abrirDoc(slug) {
    setSlugAberto(slug);
    setCarregandoDoc(true);
    try {
      const snap = await getDoc(doc(db, 'company_brain', slug));
      setConteudo(snap.exists() ? String(snap.data().conteudo || '') : '');
    } catch (e) {
      setConteudo('');
      setAviso({ tipo: 'erro', texto: mensagemErro(e) });
    } finally {
      setCarregandoDoc(false);
    }
  }

  useEffect(() => {
    if (aba === 'consultar' && !conteudo) abrirDoc(slugAberto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba]);

  async function salvar() {
    const limpo = texto.trim();
    if (limpo.length < 3) {
      setAviso({ tipo: 'erro', texto: 'Escreva ao menos uma frase.' });
      return;
    }

    setSalvando(true);
    setAviso(null);

    try {
      const ref = doc(db, 'company_brain', destino);
      const snap = await getDoc(ref);
      const atual = snap.exists() ? String(snap.data().conteudo || '') : '';

      const bloco = `## ${dataDeHoje} — Captura rápida (mobile)\n\n${limpo}\n\n---\n\n`;

      // insere antes do primeiro "## " (o arquivo é cronológico, mais novo primeiro)
      const posicao = atual.search(/^## /m);
      const novo = posicao >= 0 ? atual.slice(0, posicao) + bloco + atual.slice(posicao) : atual + '\n' + bloco;

      const titulo =
        (snap.exists() && snap.data().titulo) ||
        (DOCS.find((d) => d.slug === destino) || {}).titulo ||
        destino;

      await setDoc(
        ref,
        {
          titulo,
          conteudo: novo,
          updatedAt: serverTimestamp(),
          updatedBy: 'mobile',
        },
        { merge: true }
      );

      setTexto('');
      setAviso({ tipo: 'ok', texto: `Salvo em "${destino}" com a data ${dataDeHoje}.` });
      carregarLista();
      if (aba === 'consultar') abrirDoc(destino);
    } catch (e) {
      setAviso({ tipo: 'erro', texto: mensagemErro(e) });
    } finally {
      setSalvando(false);
    }
  }

  const docAberto = docs.find((d) => d.slug === slugAberto);

  return (
    <div className="min-h-screen bg-[#020408] pb-24 font-sans text-white">
      {/* topo */}
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#020408]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <LogoExpress tamanho="sm" comWordmark={false} />
            <div>
              <p className="text-[13px] font-black leading-tight">Cérebro da Express Tech</p>
              <p className="text-[10px] text-slate-500">
                {carregandoLista ? 'sincronizando…' : `${docs.length} documentos na nuvem`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="rounded-lg border border-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-slate-400 hover:text-white"
          >
            Painel
          </button>
        </div>

        <div className="mx-auto flex max-w-2xl gap-1 px-4 pb-3">
          {[
            { id: 'capturar', rotulo: 'Captura rápida' },
            { id: 'consultar', rotulo: 'Consultar cérebro' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setAba(t.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-[12px] font-bold transition-colors ${
                aba === t.id ? 'bg-white text-slate-900' : 'bg-white/[0.04] text-slate-400 hover:text-white'
              }`}
            >
              {t.rotulo}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5">
        {aviso && (
          <div
            className={`mb-4 rounded-xl border px-3 py-2.5 text-[12px] ${
              aviso.tipo === 'ok'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}
          >
            {aviso.texto}
          </div>
        )}

        {aba === 'capturar' && (
          <section className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nova decisão / fato
              </label>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={9}
                placeholder="Dite ou escreva: o que ficou decidido, por quê e a partir de quando vale."
                className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-[15px] leading-relaxed text-white placeholder-slate-600 outline-none focus:border-[#10b981]"
              />
              <p className="mt-1 text-[11px] text-slate-600">
                Entra no topo do documento com a data <span className="text-slate-400">{dataDeHoje}</span>.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Onde salvar
              </label>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-[14px] text-white outline-none focus:border-[#10b981]"
              >
                {DOCS.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.slug} · {d.titulo}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={salvar}
              disabled={salvando || texto.trim().length < 3}
              className="w-full rounded-xl bg-gradient-to-r from-[#34d399] via-[#10b981] to-[#0d9488] px-5 py-3.5 text-[14px] font-black text-[#04120c] transition-opacity disabled:opacity-40"
            >
              {salvando ? 'Salvando…' : 'Salvar no Cérebro'}
            </button>

            <div className="rounded-xl border border-slate-800 bg-white/[0.02] p-3">
              <p className="text-[11px] leading-relaxed text-slate-500">
                Salvou pelo celular? No PC, rode <span className="text-slate-300">npm run brain:pull</span> para
                trazer a decisão para o arquivo local e commitar.
              </p>
            </div>
          </section>
        )}

        {aba === 'consultar' && (
          <section className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {DOCS.map((d) => {
                const existe = docs.some((x) => x.slug === d.slug);
                const ativo = slugAberto === d.slug;
                return (
                  <button
                    key={d.slug}
                    type="button"
                    onClick={() => abrirDoc(d.slug)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                      ativo
                        ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                        : existe
                          ? 'border-slate-700 text-slate-300 hover:text-white'
                          : 'border-slate-800 text-slate-600'
                    }`}
                  >
                    {d.curto}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-bold text-white">{docAberto?.titulo || slugAberto}</p>
              <p className="text-[10px] text-slate-500">
                {docAberto?.updatedBy ? `por ${docAberto.updatedBy}` : ''}
              </p>
            </div>

            {carregandoDoc ? (
              <p className="py-10 text-center text-[12px] text-slate-500">carregando…</p>
            ) : conteudo ? (
              <article className="whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-[#04090d] p-4 text-[13px] leading-relaxed text-slate-300">
                {conteudo}
              </article>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-800 py-10 text-center text-[12px] text-slate-500">
                Documento vazio ou ainda não sincronizado.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
