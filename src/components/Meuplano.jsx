import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  Sparkles,
  Crown,
  Bot,
  Gift,
  MessageCircle,
  LoaderCircle,
  ShieldCheck,
  Home,
  Users,
  CalendarDays,
  Camera,
  FileBarChart,
  Shuffle,
  Clock,
  Minus,
  ArrowUpRight,
  Lock,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

// Mesma região configurada em functions/index.js
const REGIAO_FUNCTIONS = 'southamerica-east1';

import { PLANOS, WHATSAPP_COMERCIAL } from '../lib/planos';
import { COMPARATIVO_PRO, planoPro, valorParaMensagem, precoDoPlano } from '../lib/comparativoPlanos';
import { destinoCheckout, urlCheckoutPro, abrirDestino } from '../lib/checkout';

// Mapa nome-do-icone -> componente lucide (o catalogo guarda so o nome)
const ICONES = {
  Check, Sparkles, Crown, Bot, Gift, MessageCircle, ShieldCheck,
  Home, Users, CalendarDays, Camera, FileBarChart, Shuffle, Clock,
};

const formatarBRL = (valor) =>
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

/* ------------------------------------------------------------------ */
/* COMPONENTE PRINCIPAL                                                */
/* ------------------------------------------------------------------ */

export default function ModuloMeuPlano({ dadosOficina, onModulosChange }) {
  // Estado inicial derivado das props: sem "flash" de gratuito para quem já é PRO
  // e sem depender de useEffect (o que também torna o componente testável em SSR).
  const [ciclo, setCiclo] = useState(() => (dadosOficina?.tipoPlano === 'anual' ? 'anual' : 'mensal'));
  const [planoAtual, setPlanoAtual] = useState(() => {
    const existe = (PLANOS ?? []).some((p) => p.key === dadosOficina?.plano);
    return existe ? dadosOficina.plano : 'gratis';
  });
  const [salvando, setSalvando] = useState(null);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    if (!dadosOficina) return;
    const existe = (PLANOS ?? [])?.some(p => p.key === dadosOficina?.plano);
    setPlanoAtual(existe ? dadosOficina.plano : 'gratis');
    setCiclo(dadosOficina?.tipoPlano === 'anual' ? 'anual' : 'mensal');
  }, [dadosOficina]);

  const pro = useMemo(() => planoPro(PLANOS), []);
  const jaEhPro = Boolean(pro && planoAtual === pro.key);

  const planoAtualInfo = useMemo(
    () => (PLANOS ?? [])?.find(p => p.key === planoAtual) || PLANOS[0],
    [planoAtual]
  );

  const mostrarMensagem = (texto) => {
    setMensagem(texto);
    setTimeout(() => setMensagem(''), 4000);
  };

  const abrirWhatsApp = (texto) => {
    window.open(`https://wa.me/${WHATSAPP_COMERCIAL}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // Checkout real do PRO: URL de pagamento se configurada; senão WhatsApp
  // comercial com plano, ciclo, e-mail e ID já preenchidos.
  const abrirCheckoutPro = (plano = pro) => {
    if (!plano) { mostrarMensagem('Plano PRO indisponível no momento.'); return; }
    const conta = getAuth().currentUser;
    const destino = destinoCheckout({
      checkoutUrl: urlCheckoutPro(import.meta.env || {}),
      whatsapp: import.meta.env?.VITE_SU_WPP || WHATSAPP_COMERCIAL,
      planoNome: plano.nome,
      ciclo,
      email: conta?.email || '',
      uid: conta?.uid || '',
      nomeOficina: dadosOficina?.nomeOficina || '',
      valor: valorParaMensagem(plano, ciclo),
    });
    const abriu = abrirDestino(destino);
    if (!abriu) {
      mostrarMensagem('O navegador bloqueou a janela. Libere pop-ups e tente novamente.');
      return;
    }
    if (destino.tipo === 'whatsapp') {
      mostrarMensagem('Abrimos o WhatsApp do comercial com seus dados já preenchidos.');
    }
  };

  const selecionarPlano = async (plano) => {
    const uid = getAuth().currentUser?.uid;

    // Esquadrão de IA: contratação consultiva via equipa comercial
    if (!plano?.autoAtivavel) {
      abrirWhatsApp(
        `Olá! Tenho interesse no ${plano?.nome} (setup de R$ 1.000,00 + R$ 1.000,00 a R$ 1.500,00/mês) ` +
        `para a minha imobiliária${dadosOficina?.nomeOficina ? ` (${dadosOficina.nomeOficina})` : ''}.`
      );
      if (uid) {
        try {
          await updateDoc(doc(db, 'usuarios', uid), {
            solicitacaoEsquadraoIA: Timestamp.now(),
          });
        } catch (err) { console.error(err); }
      }
      mostrarMensagem('Pedido enviado! A nossa equipa comercial entrará em contacto.');
      return;
    }

    if (!uid) { mostrarMensagem('Sessão expirada. Faça login novamente.'); return; }

    // Plano pago só entra por checkout/WhatsApp — nunca por auto-ativação.
    if (Number(plano?.preco?.[ciclo] ?? 0) > 0) {
      abrirCheckoutPro(plano);
      return;
    }

    setSalvando(plano.key);
    try {
      const modulos = [...new Set(plano?.modulos ?? [])];

      // Ativacao server-side: a Cloud Function valida o plano e grava
      // plano/isPro na organizacao. O cliente NAO tem permissao de escrita
      // nesses campos (ver firestore.rules), por isso nao usamos setDoc aqui.
      const ativarPlano = httpsCallable(getFunctions(getApp(), REGIAO_FUNCTIONS), 'ativarPlano');
      const resposta = await ativarPlano({ plano: plano.key, ciclo });
      const dadosAtivacao = resposta?.data ?? {};

      if (dadosAtivacao.ok === false) {
        throw new Error(dadosAtivacao.mensagem || 'Nao foi possivel ativar o plano.');
      }

      const modulosAtivados =
        Array.isArray(dadosAtivacao.modulos) && dadosAtivacao.modulos.length
          ? dadosAtivacao.modulos
          : modulos;

      // Cache de UI (nunca fonte de verdade do plano)
      await setDoc(doc(db, 'usuarios', uid), { modulosOperacionais: modulosAtivados }, { merge: true });
      setPlanoAtual(plano.key);
      if (onModulosChange) onModulosChange(modulosAtivados);
      mostrarMensagem(`✓ ${plano.nome} ativado com sucesso!`);
    } catch (err) {
      console.error(err);
      mostrarMensagem('Não foi possível atualizar o plano. Tente novamente.');
    } finally {
      setSalvando(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 bg-[#020408] px-4 pb-24 pt-4 font-sans text-slate-100 md:px-8">

      {/* HERO */}
      <section className="overflow-hidden rounded-[28px] border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_35%),linear-gradient(135deg,_#020408,_rgba(3,7,18,0.96))] p-6 text-center shadow-[0_30px_120px_-40px_rgba(16,185,129,0.3)] md:p-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
          <Sparkles size={14} /> Planos & Assinaturas
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
          Meu Plano — Express Imobi Tech
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
          Escolha o plano ideal para a sua imobiliária: comece grátis, evolua para a gestão profissional
          ou automatize o atendimento com o nosso Esquadrão de IA.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-300">
          Plano atual: <span className="text-white">{planoAtualInfo?.nome}</span>
        </div>
      </section>

      {/* COMPARATIVO GRATUITO × PRO + CHECKOUT */}
      <section className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950/70">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 px-5 py-4 md:px-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">Comparativo</p>
            <h2 className="mt-1 text-xl font-black text-white md:text-2xl">Modo Grátis × Plano PRO</h2>
            <p className="mt-1 text-xs text-slate-400">
              O grátis serve para operar. O PRO serve para crescer: mais módulos, mais corretores e laudo por IA.
            </p>
          </div>
          {pro && (
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">PRO {ciclo}</p>
              <p className="text-2xl font-black text-white">
                {precoDoPlano(pro, ciclo)}<span className="text-xs font-bold text-slate-400">/mês</span>
              </p>
            </div>
          )}
        </div>

        <div className="divide-y divide-slate-800/70">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-5 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500 md:px-7">
            <span>Recurso</span>
            <span className="w-16 text-center">Grátis</span>
            <span className="w-16 text-center text-emerald-400">PRO</span>
          </div>

          {COMPARATIVO_PRO.map((linha) => (
            <div key={linha.recurso} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-5 py-2.5 md:px-7">
              <span className="text-xs text-slate-300">{linha.recurso}</span>
              <span className="w-16 text-center text-xs font-bold text-slate-400">
                {typeof linha.gratis === 'boolean'
                  ? (linha.gratis ? <Check size={14} className="mx-auto text-slate-400" /> : <Minus size={14} className="mx-auto text-slate-600" />)
                  : linha.gratis}
              </span>
              <span className="w-16 text-center text-xs font-black text-emerald-300">
                {typeof linha.pro === 'boolean'
                  ? (linha.pro ? <Check size={14} className="mx-auto text-emerald-400" /> : <Minus size={14} className="mx-auto text-slate-600" />)
                  : linha.pro}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-800 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7">
          <p className="flex items-center gap-2 text-[11px] text-slate-400">
            <Lock size={12} className="text-emerald-400" />
            {urlCheckoutPro(import.meta.env || {})
              ? 'Pagamento em ambiente seguro — liberação automática.'
              : 'Atendimento direto no WhatsApp comercial. Seus dados já vão preenchidos.'}
          </p>

          <button
            type="button"
            onClick={() => abrirCheckoutPro()}
            disabled={jaEhPro || !pro}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-xs font-black uppercase tracking-widest transition md:w-auto ${
              jaEhPro
                ? 'cursor-default border border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            } disabled:opacity-90`}
          >
            {jaEhPro ? <><Check size={15} /> Plano PRO ativo</> : <>Assinar Plano PRO Agora <ArrowUpRight size={15} /></>}
          </button>
        </div>
      </section>

      {/* CICLO */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-xs font-black uppercase tracking-widest ${ciclo === 'mensal' ? 'text-white' : 'text-slate-500'}`}>Mensal</span>
        <button
          type="button"
          onClick={() => setCiclo(c => (c === 'mensal' ? 'anual' : 'mensal'))}
          className="relative h-6 w-12 rounded-full border border-slate-700 bg-slate-900"
          aria-label="Alternar ciclo de pagamento"
        >
          <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-emerald-500 transition-all ${ciclo === 'mensal' ? 'left-0.5' : 'left-[26px]'}`} />
        </button>
        <span className={`text-xs font-black uppercase tracking-widest ${ciclo === 'anual' ? 'text-white' : 'text-slate-500'}`}>
          Anual <span className="ml-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] text-slate-950">Profissional R$ 89/mês</span>
        </span>
      </div>

      {mensagem && (
        <div className="mx-auto max-w-xl rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-bold text-emerald-300">
          {mensagem}
        </div>
      )}

      {/* CARDS DE PLANOS */}
      <section className="grid gap-6 lg:grid-cols-3">
        {(PLANOS ?? [])?.map(plano => {
          const Icone = ICONES[plano.icone] || Crown;
          const ativo = planoAtual === plano.key;
          const precoTexto = plano.preco
            ? (plano.preco?.[ciclo] === 0 ? 'R$ 0' : formatarBRL(plano.preco?.[ciclo]))
            : plano.precoLabel;

          return (
            <div
              key={plano.key}
              className={`relative flex flex-col rounded-[28px] border p-6 transition-all ${
                plano.destaque
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_20px_80px_-30px_rgba(16,185,129,0.6)]'
                  : 'border-slate-800 bg-slate-950/80'
              }`}
            >
              {plano.destaque && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950">
                  ⭐ Mais escolhido
                </span>
              )}

              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <Icone size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black leading-tight text-white">{plano.nome}</h2>
                  <p className="text-xs text-slate-400">{plano.subtitulo}</p>
                </div>
              </div>

              <div className="mb-1">
                <span className="text-3xl font-black text-white">{precoTexto}</span>
                <span className="ml-1 text-sm text-slate-400">{plano.periodo}</span>
              </div>
              {plano.key === 'profissional' && (
                <p className="text-xs font-bold text-emerald-400">
                  {ciclo === 'anual' ? 'Faturado anualmente (R$ 1.068,00/ano)' : 'Ou R$ 89,00/mês no plano anual'}
                </p>
              )}
              {plano.setup && <p className="text-xs font-bold text-emerald-400">+ {plano.setup}</p>}

              <ul className="my-6 flex-1 space-y-3">
                {(plano?.recursos ?? [])?.map((r, i) => {
                  const IconeRecurso = ICONES[r.icone] || Check;
                  return (
                    <li key={`${plano.key}_${i}`} className="flex items-start gap-3 text-sm text-slate-300">
                      <IconeRecurso size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                      {r.texto}
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                onClick={() => selecionarPlano(plano)}
                disabled={(ativo && plano.autoAtivavel) || salvando !== null}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-xs font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed ${
                  ativo && plano.autoAtivavel
                    ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : plano.destaque || !plano.autoAtivavel
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      : 'border border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10'
                } ${salvando !== null && salvando !== plano.key ? 'opacity-50' : ''}`}
              >
                {salvando === plano.key ? (
                  <><LoaderCircle size={16} className="animate-spin" /> A processar...</>
                ) : ativo && plano.autoAtivavel ? (
                  <><Check size={16} /> Plano atual</>
                ) : !plano.autoAtivavel ? (
                  <><MessageCircle size={16} /> {plano.cta}</>
                ) : (
                  plano.cta
                )}
              </button>
            </div>
          );
        })}
      </section>

      {/* RODAPÉ INFORMATIVO */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ShieldCheck, titulo: 'Sem fidelidade', texto: 'Cancele ou altere o seu plano a qualquer momento.' },
          { icon: Users, titulo: 'Feito para imobiliárias', texto: 'Ferramentas pensadas para corretores, captação e locação.' },
          { icon: MessageCircle, titulo: 'Suporte humano', texto: 'Fale com a nossa equipa pelo WhatsApp sempre que precisar.' },
        ]?.map(item => {
          const Icone = item.icon;
          return (
            <div key={item.titulo} className="flex gap-4 rounded-[24px] border border-slate-800 bg-slate-950/80 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Icone size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">{item.titulo}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">{item.texto}</p>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
