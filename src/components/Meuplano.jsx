import React, { useMemo, useState } from 'react';
import {
  Check, Sparkles, Crown, Bot, MessageCircle, ShieldCheck, Users, Home,
  ArrowUpRight, Lock, Zap, Globe,
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { PLANOS_PRO, WHATSAPP_COMERCIAL } from '../lib/planos';
import { DEGRAUS, precoMensal, detalheCiclo, rotuloEconomia } from '../lib/planosComerciais';
import { destinoCheckout, urlCheckoutPro, urlAsaasLink, comDadosDaConta, abrirDestino } from '../lib/checkout';

const ICONE_DEGRAU = {
  essencial: Home,
  essencial_plus: Zap,
  pro: Crown,
  automacao: Bot,
  presenca_digital: Globe,
};

/**
 * Meu Plano — 5 degraus comerciais (Grátis, Essencial Plus, PRO,
 * Automação Sofia WhatsApp, Presença Digital & Tráfego).
 * O ciclo é escolhido no topo e muda preço e destino do checkout.
 */
export default function ModuloMeuPlano({ dadosOficina }) {
  // Anual é o padrão de venda: aparece com o selo de economia.
  const [ciclo, setCiclo] = useState('anual');
  const [mensagem, setMensagem] = useState('');

  const planoAtual = String(dadosOficina?.plano || 'gratis');
  const ehPro = useMemo(() => (PLANOS_PRO instanceof Set ? PLANOS_PRO.has(planoAtual) : false), [planoAtual]);

  const mostrarMensagem = (texto) => {
    setMensagem(texto);
    setTimeout(() => setMensagem(''), 5000);
  };

  const dadosConta = () => {
    const conta = getAuth().currentUser;
    return {
      email: conta?.email || '',
      uid: conta?.uid || '',
      // oficinaId é o id do documento em `oficinas` (multi-tenant); o uid do
      // usuário pode ser de um corretor da equipe, então não serve como tenant.
      oficinaId: dadosOficina?.id || localStorage.getItem('oficinaId') || '',
      nomeOficina: dadosOficina?.nomeOficina || '',
    };
  };

  /**
   * Link de pagamento (Asaas) do degrau, já com e-mail e oficinaId na URL.
   * Vazio quando a variável do plano não está configurada.
   */
  const linkDoPlano = (planoKey, conta) =>
    comDadosDaConta(
      urlAsaasLink(
        {
          essencial: import.meta.env?.VITE_ASAAS_LINK_ESSENCIAL,
          pro: import.meta.env?.VITE_ASAAS_LINK_PRO,
          proAnual: import.meta.env?.VITE_ASAAS_LINK_PRO_ANUAL,
        },
        planoKey,
        ciclo,
      ),
      { email: conta.email, oficinaId: conta.oficinaId },
    );

  /** Card 2 — Essencial Plus (R$ 39,90): link do Asaas ou WhatsApp comercial. */
  const assinarEssencialPlus = () => {
    const essencialPlus = DEGRAUS.find((d) => d.key === 'essencial_plus');
    const conta = dadosConta();
    const valor = `${precoMensal(essencialPlus, ciclo)}/mês`;

    const destino = destinoCheckout({
      checkoutUrl: linkDoPlano('essencial_plus', conta),
      whatsapp: import.meta.env?.VITE_SU_WPP || WHATSAPP_COMERCIAL,
      planoNome: 'Essencial Plus',
      ciclo,
      email: conta.email,
      uid: conta.uid,
      nomeOficina: conta.nomeOficina,
      valor,
    });

    const abriu = abrirDestino(destino);
    if (!abriu) {
      mostrarMensagem('O navegador bloqueou a janela. Libere pop-ups e tente novamente.');
      return;
    }
    mostrarMensagem(
      destino.tipo === 'checkout'
        ? 'Abrimos o pagamento do Essencial Plus em outra aba.'
        : 'Abrimos o WhatsApp comercial com o Essencial Plus, seu e-mail e ID já preenchidos.',
    );
  };

  /** Card 3 — checkout do PRO no ciclo escolhido. */
  const assinarPro = () => {
    const pro = DEGRAUS.find((d) => d.key === 'pro');
    const conta = dadosConta();
    const { email, uid, nomeOficina } = conta;
    const valor = `${precoMensal(pro, ciclo)}/mês${ciclo === 'anual' ? ' (cobrado R$ 1.068,00/ano)' : ''}`;

    const destino = destinoCheckout({
      checkoutUrl:
        linkDoPlano('pro', conta) ||
        urlCheckoutPro({
          mensal: import.meta.env?.VITE_CHECKOUT_PRO_MENSAL_URL,
          anual: import.meta.env?.VITE_CHECKOUT_PRO_ANUAL_URL,
          unico: import.meta.env?.VITE_CHECKOUT_PRO_URL,
        }, ciclo),
      whatsapp: import.meta.env?.VITE_SU_WPP || WHATSAPP_COMERCIAL,
      planoNome: `Completo PRO (${ciclo})`,
      ciclo,
      email,
      uid,
      nomeOficina,
      valor,
    });

    const abriu = abrirDestino(destino);
    if (!abriu) {
      mostrarMensagem('O navegador bloqueou a janela. Libere pop-ups e tente novamente.');
      return;
    }
    mostrarMensagem(
      destino.tipo === 'checkout'
        ? 'Abrimos o pagamento do PRO em outra aba.'
        : 'Abrimos o WhatsApp comercial com seu plano, e-mail e ID já preenchidos.',
    );
  };

  /** Card 3 — implantação consultiva. */
  const falarEspecialista = (nomeDegrau = 'Automação Sofia WhatsApp') => {
    const { email, uid, nomeOficina } = dadosConta();
    const ehAutomacao = nomeDegrau === 'Automação Sofia WhatsApp';
    const texto = [
      `Olá! Quero falar sobre o ${nomeDegrau} do Express Imobi Tech.`,
      nomeOficina ? `Imobiliária: ${nomeOficina}.` : '',
      ehAutomacao ? 'Equipe de corretores: ___ (quantos corretores hoje).' : '',
      email ? `E-mail da conta: ${email}.` : '',
      uid ? `ID da conta: ${uid}.` : '',
      ehAutomacao
        ? 'Podemos falar sobre a taxa de implantação e o valor a partir de R$ 450/mês?'
        : 'Podemos falar sobre o escopo e o setup do projeto?',
    ].filter(Boolean).join('\n');

    const zap = (import.meta.env?.VITE_SU_WPP || WHATSAPP_COMERCIAL).replace(/\D/g, '');
    const abriu = abrirDestino({ url: `https://wa.me/${zap}?text=${encodeURIComponent(texto)}` });
    if (!abriu) mostrarMensagem('O navegador bloqueou a janela. Libere pop-ups e tente novamente.');
  };

  /** Plano atual / downgrade — passa pelo comercial, nunca auto-cancela. */
  const falarSobreDowngrade = () => {
    const { email, uid } = dadosConta();
    const texto = [
      'Olá! Quero voltar do PRO para o plano Essencial (gratuito).',
      email ? `E-mail da conta: ${email}.` : '',
      uid ? `ID da conta: ${uid}.` : '',
    ].filter(Boolean).join('\n');
    const zap = (import.meta.env?.VITE_SU_WPP || WHATSAPP_COMERCIAL).replace(/\D/g, '');
    abrirDestino({ url: `https://wa.me/${zap}?text=${encodeURIComponent(texto)}` });
  };

  const rotuloCta = (degrau) => {
    if (degrau.key === 'pro') return ehPro ? 'Plano PRO ativo' : degrau.cta;
    if (degrau.key === 'essencial') return ehPro ? 'Falar sobre downgrade' : 'Plano atual';
    if (degrau.key === 'essencial_plus' && ehPro) return 'Assinar Essencial Plus';
    return degrau.cta;
  };

  const desabilitado = (degrau) =>
    (degrau.key === 'pro' && ehPro) || (degrau.key === 'essencial' && !ehPro);

  const acaoCta = (degrau) => {
    if (degrau.key === 'pro') return assinarPro();
    if (degrau.key === 'essencial_plus') return assinarEssencialPlus();
    if (degrau.key === 'essencial') return falarSobreDowngrade();
    return falarEspecialista(degrau.nome);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 bg-[#020408] px-4 pb-24 pt-4 font-sans text-slate-100 md:px-8">

      {/* HERO */}
      <section className="overflow-hidden rounded-[28px] border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_35%),linear-gradient(135deg,_#020408,_rgba(3,7,18,0.96))] p-6 text-center shadow-[0_30px_120px_-40px_rgba(16,185,129,0.3)] md:p-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
          <Sparkles size={14} /> Planos & Assinaturas
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
          Escolha o nível do seu jogo
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
          Comece grátis com os 7 Agentes de IA em vitrine, suba para o Essencial Plus
          quando quiser propostas e anúncios, ou vá de PRO para a operação completa.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-300">
          Plano atual: <span className="text-white">{ehPro ? 'Completo PRO' : 'Grátis'}</span>
        </div>
      </section>

      {/* SELETOR DE CICLO */}
      <div className="flex flex-col items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-800 bg-slate-950/80 p-1">
          <button
            type="button"
            onClick={() => setCiclo('mensal')}
            className={`rounded-xl px-5 py-2 text-xs font-black uppercase tracking-widest transition ${
              ciclo === 'mensal' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setCiclo('anual')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-black uppercase tracking-widest transition ${
              ciclo === 'anual' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Anual
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] ${
                ciclo === 'anual' ? 'bg-slate-950/20 text-slate-900' : 'bg-emerald-500/15 text-emerald-300'
              }`}
            >
              {rotuloEconomia('anual')}
            </span>
          </button>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500">
          {ciclo === 'anual' ? 'Cobrança anual — melhor preço por mês' : 'Cobrança mensal — sem fidelidade'}
        </p>
      </div>

      {mensagem && (
        <div className="mx-auto max-w-xl rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-bold text-emerald-300">
          {mensagem}
        </div>
      )}

      {/* 5 DEGRAUS */}
      <section className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {DEGRAUS.map((degrau) => {
          const Icone = ICONE_DEGRAU[degrau.key] || Check;
          const preco = degrau.precos ? precoMensal(degrau, ciclo) : degrau.detalhePreco;
          const detalhe = detalheCiclo(degrau, ciclo);
          const bloqueado = desabilitado(degrau);

          return (
            <div
              key={degrau.key}
              className={`relative flex h-full flex-col rounded-[28px] border p-5 transition-all ${
                degrau.destaque
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_20px_80px_-30px_rgba(16,185,129,0.6)]'
                  : 'border-slate-800 bg-slate-950/80'
              }`}
            >
              {degrau.selo && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950">
                  ⭐ {degrau.selo}
                </span>
              )}

              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <Icone size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black leading-tight text-white">{degrau.nome}</h2>
                  <p className="text-[11px] uppercase tracking-widest text-emerald-400">{degrau.tag}</p>
                </div>
              </div>

              <p className="mb-3 text-xs leading-5 text-slate-400">{degrau.resumo}</p>

              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{preco}</span>
                <span className="text-sm text-slate-400">{degrau.periodo}</span>
              </div>
              {detalhe && <p className="text-[11px] font-bold text-emerald-400">{detalhe}</p>}
              {degrau.implementacao && (
                <p className="text-[11px] font-bold text-emerald-400">
                  {degrau.key === 'presenca_digital' ? degrau.implementacao : `+ ${degrau.implementacao}`}
                </p>
              )}
              {degrau.verba && (
                <p className="text-[10px] text-slate-500">{degrau.verba}</p>
              )}

              <ul className="my-6 flex-1 space-y-2.5">
                {degrau.recursos.map((texto) => (
                  <li key={texto} className="flex items-start gap-2.5 text-[13px] text-slate-300">
                    <Check size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                    {texto}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => acaoCta(degrau)}
                disabled={bloqueado}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-[11px] font-black uppercase tracking-widest transition ${
                  bloqueado
                    ? 'cursor-default border border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : degrau.destaque
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      : 'border border-emerald-500/30 bg-transparent text-emerald-300 hover:bg-emerald-500/10'
                }`}
              >
                {bloqueado ? <Check size={14} /> : degrau.tipo === 'checkout' ? <ArrowUpRight size={14} /> : <MessageCircle size={14} />}
                {rotuloCta(degrau)}
              </button>
            </div>
          );
        })}
      </section>

      {/* GARANTIAS */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ShieldCheck, titulo: 'Sem fidelidade', texto: 'No mensal você cancela quando quiser; no anual o desconto já está no preço.' },
          { icon: Users, titulo: 'Feito para imobiliárias', texto: 'Do corretor sozinho à equipe de 20+ com automação no WhatsApp.' },
          { icon: Lock, titulo: 'Pagamento seguro', texto: 'Checkout do PRO em ambiente de pagamento; a implantação passa por contrato.' },
        ].map((item) => {
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
