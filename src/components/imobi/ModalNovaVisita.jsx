import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { registrarEventoLead, TIPOS_EVENTO } from '../../services/girardEngine';

export default function ModalNovaVisita({
  aberto,
  onFechar,
  imobiliariaId,
  imovelInicial = '',
  onSalvo,
}) {
  const [formVisita, setFormVisita] = useState({
    cliente: '',
    telefone: '',
    imovel: imovelInicial || '',
    data: '',
    hora: '10:00',
    corretor: 'Corretor Plantão 01',
  });
  const [salvandoAcao, setSalvandoAcao] = useState(false);

  useEffect(() => {
    if (imovelInicial) {
      setFormVisita((prev) => ({ ...prev, imovel: imovelInicial }));
    }
  }, [imovelInicial]);

  if (!aberto) return null;

  const salvarVisitaImobi = async (e) => {
    e.preventDefault();
    if (!formVisita.cliente.trim() || !imobiliariaId) return;
    setSalvandoAcao(true);
    try {
      await addDoc(collection(db, 'oficinas', imobiliariaId, 'visitas_imobi'), {
        ...formVisita,
        leadId: formVisita.leadId || null,
        status: 'Confirmada',
        criadoEm: serverTimestamp(),
      });
      const eventoVisita = await registrarEventoLead(db, imobiliariaId, {
        leadId: formVisita.leadId || null,
        telefone: formVisita.telefone,
        tipo: TIPOS_EVENTO.VISITA_AGENDADA,
        canal: 'painel',
        descricao: `Visita agendada para ${formVisita.data || ''} ${formVisita.hora || ''}`.trim(),
        metadados: { imovel: formVisita.imovel, corretor: formVisita.corretor },
      });
      if (!eventoVisita.ok) {
        console.error('Falha ao registrar evento de visita:', eventoVisita.error);
      }
      setFormVisita({ cliente: '', telefone: '', imovel: '', data: '', hora: '10:00', corretor: 'Corretor Plantão 01' });
      onSalvo?.();
      onFechar?.();
    } catch (err) {
      console.error('Erro ao agendar visita:', err);
    } finally {
      setSalvandoAcao(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <form
        onSubmit={salvarVisitaImobi}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-nova-visita-titulo"
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        <h3 id="modal-nova-visita-titulo" className="text-lg font-black text-white">
          📅 Agendar Visita ao Imóvel
        </h3>
        <div>
          <label htmlFor="visita-cliente" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            Nome do cliente *
          </label>
          <input
            id="visita-cliente"
            name="cliente"
            autoComplete="off"
            required
            placeholder="Ex: Maria Oliveira"
            value={formVisita.cliente}
            onChange={(e) => setFormVisita({ ...formVisita, cliente: e.target.value })}
            className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label htmlFor="visita-telefone" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            WhatsApp do cliente
          </label>
          <input
            id="visita-telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="Ex: 34999998888"
            value={formVisita.telefone}
            onChange={(e) => setFormVisita({ ...formVisita, telefone: e.target.value })}
            className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label htmlFor="visita-imovel" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            Imóvel / código
          </label>
          <input
            id="visita-imovel"
            name="imovel"
            autoComplete="off"
            placeholder="Ex: IMB-1042"
            value={formVisita.imovel}
            onChange={(e) => setFormVisita({ ...formVisita, imovel: e.target.value })}
            className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="visita-data" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Data
            </label>
            <input
              id="visita-data"
              name="data"
              type="date"
              value={formVisita.data}
              onChange={(e) => setFormVisita({ ...formVisita, data: e.target.value })}
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label htmlFor="visita-hora" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Hora
            </label>
            <input
              id="visita-hora"
              name="hora"
              type="time"
              value={formVisita.hora}
              onChange={(e) => setFormVisita({ ...formVisita, hora: e.target.value })}
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
            />
          </div>
        </div>
        {/* LGPD — dado de terceiro digitado pelo corretor (D-22.05) */}
        <p className="text-[10.5px] leading-relaxed text-slate-500">
          Nome e WhatsApp servem para confirmar a visita e ficam registrados no CRM desta imobiliária. Não pede
          documento nem dado financeiro. Para correção ou exclusão, use{' '}
          <strong className="text-slate-300">Excluir meus dados</strong> no rodapé do painel.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvandoAcao}
            style={{ backgroundColor: '#10b981' }}
            className="px-5 py-2 rounded-xl text-white text-xs font-bold cursor-pointer"
          >
            {salvandoAcao ? 'Agendando...' : 'Confirmar Visita'}
          </button>
        </div>
      </form>
    </div>
  );
}
