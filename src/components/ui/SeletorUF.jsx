import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { UFS, REGRAS_ESTADUAIS_UF, PORTES_MUNICIPIO, tetoMcMvPorPorte } from '../../lib/regrasEstaduais';
import { lerPreferencias, salvarPreferencias, assinarPreferencias } from '../../lib/preferencias';

/**
 * Seletor rápido de UF + porte do município.
 * Fica no topo das abas Fiscal, Jurídico, Captação e Acompanhamento:
 * o padrão vem das Configurações, e a troca aqui vale para a negociação em curso.
 */
export default function SeletorUF({ onChange, className = '' }) {
  const [prefs, setPrefs] = useState(() => lerPreferencias());

  useEffect(() => assinarPreferencias((novas) => {
    setPrefs(novas);
    if (onChange) onChange(novas);
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  function aplicar(parcial) {
    const novas = salvarPreferencias(parcial);
    setPrefs(novas);
    if (onChange) onChange(novas);
  }

  const regra = REGRAS_ESTADUAIS_UF[prefs.ufPadrao];
  const teto = tetoMcMvPorPorte(prefs.porteMunicipioPadrao);

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2 ${className}`}>
      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        <MapPin size={12} /> Negociando em
      </span>

      <select
        value={prefs.ufPadrao}
        onChange={(e) => aplicar({ ufPadrao: e.target.value })}
        className="rounded-lg border border-slate-700 bg-[#020408] px-2.5 py-1.5 text-[11px] font-bold text-white focus:border-[#10b981] focus:outline-none"
        title="Estado da negociação"
      >
        {UFS.map((uf) => (
          <option key={uf} value={uf}>{uf}</option>
        ))}
      </select>

      <select
        value={prefs.porteMunicipioPadrao}
        onChange={(e) => aplicar({ porteMunicipioPadrao: e.target.value })}
        className="rounded-lg border border-slate-700 bg-[#020408] px-2.5 py-1.5 text-[11px] font-bold text-white focus:border-[#10b981] focus:outline-none"
        title="Porte do município"
      >
        {PORTES_MUNICIPIO.map((p) => (
          <option key={p.key} value={p.key}>{p.label}</option>
        ))}
      </select>

      <span className="text-[10px] font-bold text-slate-500">
        {regra.imposto} {regra.aliquotaUnica ? `${regra.aliquotaMin}%` : `${regra.aliquotaMin}%–${regra.aliquotaMax}%`}
        <span className="mx-1 text-slate-700">·</span>
        teto MCMV {teto.tetoFormatado}
      </span>
    </div>
  );
}
