import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function AbaAgendaVisitas({
  listaVisitas = [],
  onAbrirNovaVisita,
  onExcluirVisita,
  onAbrirWhatsApp,
}) {
  const visitasArray = Array.isArray(listaVisitas) ? listaVisitas : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            📅 AGENDA DE <span style={{ color: '#10b981' }}>VISITAS & PLANTÃO</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Visita confirmada no WhatsApp antes do horário: menos plantão furado, mais negócio fechado.
          </p>
        </div>
        <button
          onClick={onAbrirNovaVisita}
          style={{ backgroundColor: '#10b981' }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl hover:opacity-90 text-white font-bold text-sm cursor-pointer"
        >
          <Plus size={18} /> Agendar Nova Visita
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visitasArray.map((vis) => (
          <div key={vis.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-[#10b981]/15 text-[#10b981] text-xs font-bold">
                📅 {vis.data || 'Data a confirmar'} às {vis.hora}
              </span>
              <button
                onClick={() => onExcluirVisita?.('visitas_imobi', vis.id)}
                className="text-slate-500 hover:text-emerald-400 cursor-pointer"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <h3 className="font-bold text-white text-base">👤 {vis.cliente}</h3>
            <p className="text-xs text-slate-300">🏠 Imóvel: {vis.imovel || 'Seleção da carteira'}</p>
            <p className="text-xs text-slate-400">👔 Corretor: {vis.corretor}</p>
            <button
              onClick={() =>
                onAbrirWhatsApp?.(
                  vis.telefone,
                  `Olá ${vis.cliente}! Confirmando nossa visita ao imóvel (${vis.imovel}) no dia ${vis.data} às ${vis.hora}. Posso confirmar sua presença?`
                )
              }
              style={{ backgroundColor: '#10b981' }}
              className="w-full py-2 rounded-xl hover:opacity-90 text-white text-xs font-bold cursor-pointer"
            >
              💬 Confirmar Visita no WhatsApp
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
