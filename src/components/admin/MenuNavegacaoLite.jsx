import React from 'react';

const ABAS_CLIENTE = ['dashboard', 'clientes', 'retorno', 'secretaria', 'financeiro', 'meuplano'];

export default function MenuNavegacao({ 
  t, 
  papelLogado, 
  abaAtiva, 
  setAbaAtiva, 
  moduloLiberado, 
  lidarModuloBloqueado, 
  LABELS_ABAS 
}) {
  const makeButton = (aba) => {
    const ativo = abaAtiva === aba;
    const isSecretaria = aba === 'secretaria';
    let labelFinal = LABELS_ABAS?.[aba] || aba.toUpperCase();
    
    if (aba === 'retorno') labelFinal = '🔔 RETORNOS';
    if (aba === 'secretaria') labelFinal = '🤖 SECRETÁRIA IA';
    if (aba === 'financeiro') labelFinal = '💰 FINANCEIRO';
    if (aba === 'meuplano') labelFinal = '💎 MEU PLANO';

    let classesAtivo = 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/30 ring-2 ring-[#10b981]/50 scale-105';
    let classesInativo = 'bg-[#020408] border border-neutral-800 text-neutral-400 hover:text-white hover:border-[#10b981]';

    if (isSecretaria) {
      classesAtivo = 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/30 ring-2 ring-[#10b981]/50 scale-105';
      classesInativo = 'bg-[#020408] border border-[#10b981]/40 text-[#10b981] hover:text-white hover:bg-[#10b981]/15';
    }

    return (
      <button
        key={aba}
        type="button"
        onClick={() => {
          if (aba === 'secretaria' || (moduloLiberado && moduloLiberado(aba))) {
            setAbaAtiva(aba);
          } else if (lidarModuloBloqueado) {
            lidarModuloBloqueado(aba);
          }
        }}
        className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shrink-0 ${
          ativo ? classesAtivo : classesInativo
        }`}
      >
        {labelFinal}
      </button>
    );
  };

  return (
    <div id="menu-navegacao" className="menu-navegacao w-full py-4 border-b border-neutral-800/60 bg-black/40 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-3">
          Navegação Principal
        </p>
        <div className="flex w-full overflow-x-auto gap-3 pb-2 scrollbar-hide">
          {ABAS_CLIENTE.map(aba => makeButton(aba))}
        </div>
      </div>
    </div>
  );
}