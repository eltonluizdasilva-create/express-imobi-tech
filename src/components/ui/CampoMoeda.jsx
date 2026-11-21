/* eslint-disable react/prop-types */
/**
 * CampoMoeda — input de valor monetário com máscara brasileira (R$ 350.000,00).
 *
 * O valor recebido/emitido é o **texto mascarado**. Na hora de gravar, o chamador
 * converte com `parseMoedaBR()` (src/hooks/useQuickActions.js) para Number limpo.
 * O "R$" é só adorno visual: não entra no valor, então nada de símbolo no Firestore.
 */
import { mascararMoedaBR, finalizarMoedaBR, PLACEHOLDER_MOEDA } from '../../lib/moedaBR';

export default function CampoMoeda({
  valor = '',
  onChange,
  className = '',
  containerClassName = '',
  placeholder = PLACEHOLDER_MOEDA,
  ...props
}) {
  return (
    <div className={`relative ${containerClassName}`}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500"
      >
        R$
      </span>
      <input
        {...props}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => onChange?.(mascararMoedaBR(e.target.value))}
        onBlur={(e) => onChange?.(finalizarMoedaBR(e.target.value))}
        className={`!pl-9 ${className}`}
      />
    </div>
  );
}
