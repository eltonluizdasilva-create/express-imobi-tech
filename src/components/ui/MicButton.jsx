/* eslint-disable react/prop-types */
/**
 * MicButton — ditado por voz leve e reutilizável, com a Web Speech API nativa do
 * navegador (custo zero, nada sai para o servidor da Express Tech; o áudio é
 * processado pelo próprio navegador).
 *
 * Fallback silencioso: em navegador sem suporte (Firefox, Safari antigo) o botão
 * simplesmente não é renderizado — nenhum alert, nenhum erro no console.
 *
 * Uso:
 *   <MicButton onTexto={(texto) => setCampo((v) => (v ? `${v} ${texto}` : texto))} />
 * Sempre `type="button"` para nunca submeter o formulário do campo.
 */
import { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';

/** true quando o navegador atual expõe a Web Speech API de reconhecimento. */
export function vozDisponivel() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export default function MicButton({
  onTexto,
  className = '',
  titulo = 'Ditar por voz (pt-BR)',
  tamanho = 14,
}) {
  const [ouvindo, setOuvindo] = useState(false);
  const reconhecimentoRef = useRef(null);

  useEffect(
    () => () => {
      try {
        reconhecimentoRef.current?.abort?.();
      } catch {
        /* fallback silencioso: nada a fazer se o navegador já liberou o motor */
      }
    },
    [],
  );

  // Fallback silencioso: sem suporte, o componente não ocupa espaço.
  if (!vozDisponivel()) return null;

  function alternarDitado() {
    if (ouvindo && reconhecimentoRef.current) {
      try {
        reconhecimentoRef.current.stop();
      } catch {
        setOuvindo(false);
      }
      return;
    }

    const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
    let reconhecimento;
    try {
      reconhecimento = new Reconhecimento();
      reconhecimento.lang = 'pt-BR';
      reconhecimento.continuous = false;
      reconhecimento.interimResults = false;
      reconhecimento.maxAlternatives = 1;
    } catch {
      return; // microfone bloqueado, sem permissão ou motor indisponível
    }

    reconhecimento.onstart = () => setOuvindo(true);
    reconhecimento.onend = () => setOuvindo(false);
    reconhecimento.onerror = () => setOuvindo(false);
    reconhecimento.onresult = (evento) => {
      const texto = Array.from(evento?.results || [])
        .map((resultado) => resultado?.[0]?.transcript || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (texto) onTexto?.(texto);
    };

    reconhecimentoRef.current = reconhecimento;
    try {
      reconhecimento.start();
    } catch {
      setOuvindo(false); // start() repetido ou bloqueado pelo navegador
    }
  }

  return (
    <button
      type="button"
      onClick={alternarDitado}
      title={ouvindo ? 'Parar ditado' : titulo}
      aria-label={ouvindo ? 'Parar ditado por voz' : titulo}
      aria-pressed={ouvindo}
      className={
        ouvindo
          ? `inline-flex shrink-0 items-center justify-center rounded-lg border border-[#10b981] bg-[#10b981]/20 p-2 text-[#10b981] transition ${className}`
          : `inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 p-2 text-slate-400 transition hover:border-[#10b981] hover:text-[#10b981] ${className}`
      }
    >
      <Mic size={tamanho} className={ouvindo ? 'animate-pulse' : ''} />
    </button>
  );
}
