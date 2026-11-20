/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  Brain,
  Lock,
  CheckCircle2,
  Sparkles,
  Crown,
  AlertCircle,
} from 'lucide-react';
import {
  useAuth,
  DEFAULT_NIVEL_INTELIGENCIA,
  CREDITOS_IA_FALLBACK,
  FRANQUIA_BASE_CREDITOS_IA,
} from '../contexts/AuthContext';
import BloqueioPremium from './BloqueioPremium';
import AnelEscuro from './admin/AnelEscuro';

const OPCOES_INTELIGENCIA = [
  {
    id: 'padrao',
    titulo: 'Rápido e Objetivo (Motor Padrão)',
    descricao:
      'Atendimento ágil para qualificação de leads. Consome 1 crédito por resposta.',
    custoCreditos: 1,
    badge: 'Disponível para todos',
    icone: Zap,
    requerPro: false,
  },
  {
    id: 'avancado',
    titulo: 'Analítico e Avançado (Motor PRO)',
    descricao:
      'Raciocínio complexo, análise de contexto profundo e negociação. Consome 5 créditos por resposta.',
    custoCreditos: 5,
    badge: 'Exclusivo Assinantes PRO',
    icone: Brain,
    requerPro: true,
  },
];

/**
 * Componente modular de Controle de Custos de IA (Tiered AI / Sistema de Créditos).
 * Exibe o saldo de `creditosIA` (Progress Bar + Badge) em modo SOMENTE LEITURA e permite selecionar o
 * `nivelInteligencia` ("padrao" | "avancado"), bloqueando a opção avançada quando `isPro` for `false`.
 *
 * Segurança: a única escrita possível nesta tela é `nivelInteligencia` (via AuthContext).
 * O saldo de créditos é gravado/descontado exclusivamente pelo backend (Webhook n8n).
 */
export default function ControleInteligenciaIA({
  isPro: isProProp,
  setAbaAtiva,
  compacto = false,
}) {
  const auth = useAuth() || {};

  // isPro vem do documento da organização; a prop só pode RESTRINGIR (ex.: modo de painel), nunca conceder.
  const isPro = Boolean(auth.isPro) && (typeof isProProp === 'boolean' ? isProProp : true);

  // Lê nivelInteligencia e creditosIA exclusivamente do estado global (documento da organização)
  const nivelAtualRaw = auth.nivelInteligencia || DEFAULT_NIVEL_INTELIGENCIA;

  // Se não for PRO, garante exibição segura no motor padrão
  const nivelSelecionado =
    !isPro && nivelAtualRaw === 'avancado' ? 'padrao' : nivelAtualRaw;

  const creditosDisponiveis =
    typeof auth.creditosIA === 'number' ? auth.creditosIA : CREDITOS_IA_FALLBACK;

  const metaBaseCreditos = FRANQUIA_BASE_CREDITOS_IA; // referência visual da barra
  const percentualCreditos = Math.max(
    0,
    Math.min(100, Math.round((creditosDisponiveis / metaBaseCreditos) * 100))
  );

  const [salvandoNivel, setSalvandoNivel] = useState(false);
  const [feedbackSalvo, setFeedbackSalvo] = useState('');
  const [mostrarBloqueioPro, setMostrarBloqueioPro] = useState(false);
  const [tooltipBloqueio, setTooltipBloqueio] = useState(false);

  const atualizarNivelInteligenciaNoFirestore = async (novoNivel) => {
    if (novoNivel === 'avancado' && !isPro) {
      setTooltipBloqueio(true);
      setMostrarBloqueioPro(true);
      setTimeout(() => setTooltipBloqueio(false), 4000);
      return;
    }

    setMostrarBloqueioPro(false);
    if (novoNivel === nivelSelecionado && !salvandoNivel) return;

    setSalvandoNivel(true);
    setFeedbackSalvo('');

    try {
      if (typeof auth.atualizarNivelInteligencia !== 'function') {
        throw new Error('Contexto de autenticação indisponível.');
      }
      await auth.atualizarNivelInteligencia(novoNivel);
      setFeedbackSalvo(
        novoNivel === 'avancado'
          ? '✓ Motor PRO (Analítico e Avançado) ativado!'
          : '✓ Motor Padrão (Rápido e Objetivo) ativado!'
      );
      setTimeout(() => setFeedbackSalvo(''), 3500);
    } catch (error) {
      console.error('Erro ao salvar nivelInteligencia:', error);
      setFeedbackSalvo('⚠️ Não foi possível atualizar o motor de IA.');
    } finally {
      setSalvandoNivel(false);
    }
  };

  const respostasEstimadas =
    nivelSelecionado === 'avancado'
      ? Math.floor(creditosDisponiveis / 5)
      : creditosDisponiveis;

  return (
    <AnelEscuro className={`rounded-2xl ${compacto ? 'p-4' : 'p-5 md:p-6'} shadow-xl`}>
      {/* Lote 4 — o cabeçalho vive em `AnelEscuro` (shadow root) porque no tema
          claro o fundo `#020408` virava branco enquanto os títulos `text-white`
          eram escurecidos pelo CSS do tema. */}
      {/* CABEÇALHO + MOSTRADOR DE CRÉDITOS DE IA (BADGE + PROGRESS BAR) */}
      <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/90">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#10b981]/15 border border-[#10b981]/40 text-[#10b981] text-[10px] font-black uppercase tracking-wider">
              <Cpu size={12} /> Tiered AI • Controle de Consumo
            </span>
            {feedbackSalvo && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#10b981]/20 text-[#10b981] text-[11px] font-bold animate-pulse">
                {feedbackSalvo}
              </span>
            )}
          </div>
          <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight">
            Nível de Inteligência do Atendimento & Saldo de Créditos
          </h3>
          <p className="text-xs text-slate-400">
            Escolha a capacidade cognitiva dos agentes de WhatsApp e Diretor Comercial conforme sua operação.
          </p>
        </div>

        {/* Mostrador Visual Elegante de Créditos IA (Badge + Progress Bar) */}
        <div className="w-full lg:w-80 bg-slate-900/90 border border-[#10b981]/30 rounded-2xl p-3.5 space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#10b981]" /> Saldo de Créditos IA
            </span>
            <span
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
              className="px-2.5 py-0.5 rounded-full border border-[#10b981]/50 text-[#10b981] text-xs font-black"
            >
              ⚡ {creditosDisponiveis.toLocaleString('pt-BR')} créditos
            </span>
          </div>

          {/* Barra de Progresso */}
          <div className="w-full h-2.5 bg-[#020408] rounded-full overflow-hidden border border-slate-800">
            <div
              style={{
                width: `${percentualCreditos}%`,
                backgroundColor: '#10b981',
              }}
              className="h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
            <span>Franquia base: {metaBaseCreditos.toLocaleString('pt-BR')} créd.</span>
            <span className="text-[#10b981] font-bold">
              ~{respostasEstimadas.toLocaleString('pt-BR')} respostas restantes
            </span>
          </div>
        </div>
      </div>

      {/* SELEÇÃO DE NÍVEL DE INTELIGÊNCIA (RADIO BUTTONS / TOGGLE CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OPCOES_INTELIGENCIA.map((opcao) => {
          const Icone = opcao.icone;
          const bloqueada = opcao.requerPro && !isPro;
          const selecionada = nivelSelecionado === opcao.id && !bloqueada;

          return (
            <div
              key={opcao.id}
              role="radio"
              aria-checked={selecionada}
              aria-disabled={bloqueada}
              tabIndex={0}
              onClick={() => atualizarNivelInteligenciaNoFirestore(opcao.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  atualizarNivelInteligenciaNoFirestore(opcao.id);
                }
              }}
              title={
                bloqueada
                  ? 'Exclusivo para assinantes PRO. Clique para ver opções de upgrade.'
                  : opcao.titulo
              }
              className={`relative rounded-2xl p-4 md:p-5 border-2 transition-all flex flex-col justify-between gap-3 select-none ${
                selecionada
                  ? 'bg-slate-900/95 border-[#10b981] shadow-[0_0_25px_rgba(16,185,129,0.15)] cursor-pointer'
                  : bloqueada
                  ? 'bg-slate-950/70 border-slate-800/80 opacity-75 hover:border-[#10b981]/40 cursor-not-allowed'
                  : 'bg-slate-900/50 border-slate-800 hover:border-[#10b981]/50 cursor-pointer'
              }`}
            >
              {/* Tooltip flutuante ao tentar clicar na Opção 2 bloqueada */}
              {bloqueada && tooltipBloqueio && (
                <div
                  style={{ backgroundColor: '#020408' }}
                  className="absolute -top-3 right-3 z-20 px-3 py-1 rounded-full border border-[#10b981] text-[#10b981] text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1 animate-bounce"
                >
                  <Lock size={11} /> Exclusivo Plano PRO — Faça Upgrade
                </div>
              )}

              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Radio Button Visual */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                        selecionada
                          ? 'border-[#10b981] bg-[#10b981]/20'
                          : 'border-slate-600 bg-[#020408]'
                      }`}
                    >
                      {selecionada && (
                        <div
                          style={{ backgroundColor: '#10b981' }}
                          className="w-2.5 h-2.5 rounded-full"
                        />
                      )}
                    </div>

                    <div
                      style={
                        selecionada
                          ? { backgroundColor: '#10b981' }
                          : { backgroundColor: 'rgba(16, 185, 129, 0.12)' }
                      }
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        selecionada ? 'text-[#020408]' : 'text-[#10b981]'
                      }`}
                    >
                      <Icone size={18} />
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white leading-tight">
                        {opcao.titulo}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">
                        {opcao.badge}
                      </span>
                    </div>
                  </div>

                  {/* Badge de Status / Bloqueio */}
                  {bloqueada ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-[#10b981]/40 text-[#10b981] text-[10px] font-black uppercase shrink-0">
                      <Lock size={11} /> PRO
                    </span>
                  ) : selecionada ? (
                    <span
                      style={{ backgroundColor: '#10b981' }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[#020408] text-[10px] font-black uppercase shrink-0"
                    >
                      <CheckCircle2 size={11} /> Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase shrink-0">
                      Selecionar
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-7">
                  {opcao.descricao}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] pl-7">
                <span className="text-slate-400 font-semibold">
                  Taxa de consumo:
                </span>
                <span className="font-black text-[#10b981]">
                  ⚡ {opcao.custoCreditos}{' '}
                  {opcao.custoCreditos === 1 ? 'crédito / resposta' : 'créditos / resposta'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPONENTE <BloqueioPremium> EXIBIDO QUANDO USUÁRIO NÃO-PRO CLICA NA OPÇÃO 2 */}
      <BloqueioPremium
        aberto={mostrarBloqueioPro && !isPro}
        onFechar={() => setMostrarBloqueioPro(false)}
        setAbaAtiva={setAbaAtiva}
      />
      </div>
    </AnelEscuro>
  );
}
