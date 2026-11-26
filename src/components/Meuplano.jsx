import React, { useMemo, useState } from 'react';
import {
  Check, Sparkles, Crown, Bot, MessageCircle, ShieldCheck, Users, Home,
  ArrowUpRight, Lock, Globe, Info, Rocket, Smartphone, Building2,
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { WHATSAPP_COMERCIAL, chaveCanonica, getPlano, isPlanoPro } from '../lib/planos';
import { DEGRAUS, SERVICO_PRESENCA_DIGITAL, precoMensal } from '../lib/planosComerciais';
import { destinoCheckout, urlAsaasLink, comDadosDaConta, abrirDestino } from '../lib/checkout';
import ModalPacoteCompleto from './admin/ModalPacoteCompleto';

const ICONE_DEGRAU = {
  essencial: Home,
  pro: Crown,
  plus: Rocket,
  esquadrao_ia: Bot,
  tom_autonomo: Smartphone,
  tom_imobiliaria: Building2,
  presenca_digital: Globe,
};

/**
 * Meu Plano — Grátis, PRO (R$ 39,90), PLUS (R$ 99,90) e os módulos de IA
 * contratados à parte (Pólen, Tom Autônomo e Tom Imobiliária), mais o serviço
 * adicional de Presença Digital.
 */
export default function ModuloMeuPlano({ dadosOficina }) {
  const [mensagem, setMensagem] = useState('');

  const planoAtual = String(dadosOficina?.plano || 'gratis');
  const chavePlano = useMemo(() => chaveCanonica(planoAtual), [planoAtual]);
  // Mesma fonte do crachá do /admin (D-23.18): `isPlanoPro` lê o plano pago do
  // catálogo e resolve os aliases antigos (`essencial_plus` → pro,
  // `profissional` → plus). Antes, a conta com alias PRO continuava a ver
  // "assinar o PRO" no card mesmo já pagando.
  const ehPro = useMemo(() => isPlanoPro(planoAtual), [planoAtual]);
  const ehPlus = chavePlano === 'plus';
  const ehPago = ehPro || ehPlus;
  const nomePlanoAtual = getPlano(chavePlano)?.nome || 'Grátis';

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
   * Cada plano/ciclo usa sua URL. Só o PRO mensal tem link público padrão;
   * PLUS e ciclos anuais sem link próprio seguem para o WhatsApp comercial.
   */
  const linkDoPlano = (planoKey, conta) =>
    comDadosDaConta(
      urlAsaasLink(
        {
          essencial: import.meta.env?.VITE_ASAAS_LINK_ESSENCIAL,
          pro: import.meta.env?.VITE_ASAAS_LINK_PRO,
          proAnual: import.meta.env?.VITE_ASAAS_LINK_PRO_ANUAL,
          plus: import.meta.env?.VITE_ASAAS_LINK_PLUS,
          plusAnual: import.meta.env?.VITE_ASAAS_LINK_PLUS_ANUAL,
        },
        planoKey,
        'mensal',
      ),
      { email: conta.email, oficinaId: conta.oficinaId },
    );

  /** Checkout do degrau pago (PRO R$ 39,90 / PLUS R$ 99,90). */
  const assinar = (planoKey = 'pro') => {
    const degrau = DEGRAUS.find((d) => d.key === planoKey);
    const conta = dadosConta();
    const { email, uid, nomeOficina } = conta;
    const valor = `${precoMensal(degrau)}/mês`;

    const destino = destinoCheckout({
      checkoutUrl: linkDoPlano(planoKey, conta),
      whatsapp: import.meta.env?.VITE_SU_WPP || WHATSAPP_COMERCIAL,
      planoNome: String(degrau?.nome || planoKey).toUpperCase(),
      ciclo: 'mensal',
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
        ? `Abrimos o pagamento do ${degrau?.nome || 'plano'} em outra aba.`
        : 'Abrimos o WhatsApp comercial com seu plano, e-mail e ID já preenchidos.',
    );
  };

  /** Contratação consultiva dos módulos de IA ou do serviço adicional. */
  const falarEspecialista = (nomeDegrau = 'Pólen') => {
    const { email, uid, nomeOficina } = dadosConta();
    const operacaoIA = DEGRAUS.find((degrau) => degrau.key === 'esquadrao_ia');
    const ehOperacaoIA = /p[óo]len|tom|sofia|automa[cç][aã]o|ia\b/i.test(String(nomeDegrau || ''));
    const texto = [
      `Olá! Quero falar sobre o ${nomeDegrau} do Express Imobi Tech.`,
      nomeOficina ? `Imobiliária: ${nomeOficina}.` : '',
      ehOperacaoIA ? 'Equipe de corretores: ___ (quantos corretores hoje).' : '',
      email ? `E-mail da conta: ${email}.` : '',
      uid ? `ID da conta: ${uid}.` : '',
      ehOperacaoIA && operacaoIA
        ? `Podemos falar do módulo ${nomeDegrau} (${operacaoIA.detalhePreco || ''}${operacaoIA.periodo || ''}) e da implantação assistida?`
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
      `Olá! Quero voltar do ${nomePlanoAtual} para o plano Grátis.`,
      email ? `E-mail da conta: ${email}.` : '',
      uid ? `ID da conta: ${uid}.` : '',
    ].filter(Boolean).join('\n');
    const zap = (import.meta.env?.VITE_SU_WPP || WHATSAPP_COMERCIAL).replace(/\D/g, '');
    abrirDestino({ url: `https://wa.me/${zap}?text=${encodeURIComponent(texto)}` });
  };

  const rotuloCta = (degrau) => {
    if (degrau.key === 'pro') {
      if (ehPlus) return 'Incluído no seu plano';
      return ehPro ? 'Plano PRO ativo' : degrau.cta;
    }
    if (degrau.key === 'plus') return ehPlus ? 'Plano PLUS ativo' : degrau.cta;
    if (degrau.key === 'essencial') return ehPago ? 'Falar sobre downgrade' : 'Plano atual';
    return degrau.cta;
  };

  const desabilitado = (degrau) =>
    (degrau.key === 'pro' && ehPago) ||
    (degrau.key === 'plus' && ehPlus) ||
    (degrau.key === 'essencial' && !ehPago);

  const acaoCta = (degrau) => {
    if (degrau.key === 'pro' || degrau.key === 'plus') return assinar(degrau.key);
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
          Comece grátis com CRM e agenda. O PRO inclui Simuladores, Assistente Legal, captação e vitrine;
          o PLUS inclui tudo do PRO, recursos exclusivos e mais capacidade para a equipe. Pólen,
          Tom Autônomo e Tom Imobiliária entram como módulos de IA contratados à parte.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-emerald-300">
          Plano atual: <span className="text-white">{nomePlanoAtual}</span>
        </div>
      </section>

      {/* AVISO EXPLICATIVO OBRIGATÓRIO DOS PLANOS DE IA */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:p-5 flex items-start gap-3 text-xs text-slate-300 leading-relaxed">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />
        <p>
          <strong>Política de precificação dos módulos de IA:</strong> Os valores dos planos de IA (Pólen, Zara e Tom) são <em>a partir do valor base</em> porque variam conforme a quantidade de disparos/frequência de abordagens, a forma de abordagem, o número de chips/usuários e o nível de automação contratados pela operação da sua imobiliária.
        </p>
      </div>

      <ModalPacoteCompleto
        aberto={modalPacoteAberto}
        onFechar={() => setModalPacoteAberto(false)}
      />

      {/* Aviso de ativação automática: o webhook casa o pagamento pelo
          externalReference/e-mail que o Asaas levar na cobrança. */}
      <p className="mx-auto flex max-w-2xl items-start justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-2.5 text-[11px] leading-5 text-slate-400">
        <Info size={13} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden="true" />
        <span>
          Importante: use no pagamento o mesmo e-mail cadastrado aqui para ativação automática imediata.
        </span>
      </p>

      {mensagem && (
        <div className="mx-auto max-w-xl rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-bold text-emerald-300">
          {mensagem}
        </div>
      )}

      {/* BANNER DO PACOTE COMPLETO IMOBILIÁRIA (PLUS + TOM + ZARA + PÓLEN) */}
      <section className="rounded-3xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/10 via-slate-950 to-teal-500/10 p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider text-[#10b981]">
                ⭐ Ecossistema Integrado de Vendas
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
              Pacote Completo Imobiliária (PLUS + Tom + Zara + Pólen)
            </h3>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              A máquina definitiva de captação e vendas: busca proprietários e empresários no Maps pelo <strong>Radar (PLUS)</strong>, cruza dados e objeções com o <strong>Tom</strong>, atende e dispara 24h no WhatsApp com a <strong>Pólen</strong> e audita a esteira diária com a <strong>Zara</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalPacoteAberto(true)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-950 transition shadow-xl shadow-emerald-500/25 cursor-pointer shrink-0 font-sans"
          >
            <Sparkles size={15} />
            Ativar Pacote Completo →
          </button>
        </div>
      </section>

      {/* PLANOS E MÓDULOS DE IA */}
      <section className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {DEGRAUS.map((degrau) => {
          const Icone = ICONE_DEGRAU[degrau.key] || Check;
          const preco = degrau.precos ? precoMensal(degrau, 'mensal') : degrau.detalhePreco;
          const bloqueado = desabilitado(degrau);
          const recursos = degrau.key === 'plus'
            ? degrau.recursos.filter((texto) => !/usuários inclusos/i.test(texto))
            : degrau.recursos;

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
              {degrau.key === 'plus' && degrau.usuarios && (
                <p className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs font-bold text-emerald-200">
                  {degrau.usuarios}
                </p>
              )}

              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{preco}</span>
                <span className="text-sm text-slate-400">{degrau.periodo}</span>
              </div>
              {degrau.implementacao && (
                <p className="text-[11px] font-bold text-emerald-400">
                  + {degrau.implementacao}
                </p>
              )}

              <ul className="my-6 flex-1 space-y-2.5">
                {recursos.map((texto) => (
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

      <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Serviço adicional</p>
            <h2 className="mt-2 text-xl font-black text-white">{SERVICO_PRESENCA_DIGITAL.nome}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{SERVICO_PRESENCA_DIGITAL.resumo}</p>
            <p className="mt-3 text-sm font-bold text-emerald-300">{SERVICO_PRESENCA_DIGITAL.detalhePreco}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{SERVICO_PRESENCA_DIGITAL.implementacao}</p>
          </div>
          <button
            type="button"
            onClick={() => falarEspecialista(SERVICO_PRESENCA_DIGITAL.nome)}
            className="shrink-0 rounded-2xl border border-emerald-500/30 px-5 py-3 text-xs font-black uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-500/10"
          >
            {SERVICO_PRESENCA_DIGITAL.cta}
          </button>
        </div>
      </section>

      {/* GARANTIAS */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ShieldCheck, titulo: 'Sem fidelidade', texto: 'O PRO é mensal e você cancela quando quiser.' },
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
