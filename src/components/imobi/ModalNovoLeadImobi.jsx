import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { parseMoedaBR } from '../../hooks/useQuickActions';

const FORM_LEAD_INICIAL = {
  nome: '',
  telefone: '',
  interesse: 'Compra',
  bairro: '',
  orcamento: '',
  estagio: 'Novo Lead',
};

export default function ModalNovoLeadImobi({
  aberto,
  onFechar,
  imobiliariaId,
  roletaAtiva = false,
  proximoCorretorDaVez = null,
  tempoRepasseMin = 15,
  corretoresRoleta = [],
  setPonteiroRoleta,
  setListaLeads,
  onSalvo,
}) {
  const [formLead, setFormLead] = useState(FORM_LEAD_INICIAL);
  const [salvandoAcao, setSalvandoAcao] = useState(false);

  if (!aberto) return null;

  const salvarLeadImobi = async (e) => {
    e.preventDefault();
    if (!formLead.nome.trim()) return;
    setSalvandoAcao(true);
    try {
      const sorteado = roletaAtiva && proximoCorretorDaVez ? proximoCorretorDaVez : null;
      const corretorSorteado = sorteado ? sorteado.nome : 'Atendimento Direto';
      const orcamentoNumerico = parseMoedaBR(formLead.orcamento);

      const novoLeadObj = {
        ...formLead,
        orcamento: orcamentoNumerico,
        corretorResponsavel: corretorSorteado,
        corretorWhatsapp: sorteado?.whatsapp || '',
        distribuidoPorRoleta: Boolean(sorteado),
        prazoAceiteMin: tempoRepasseMin,
        origem: 'WhatsApp IA • Roleta',
        criadoEm: serverTimestamp(),
      };

      if (imobiliariaId) {
        await addDoc(collection(db, 'oficinas', imobiliariaId, 'leads_imobi'), novoLeadObj);
      } else {
        setListaLeads?.((prev) => [{ id: `local_${Date.now()}`, ...novoLeadObj }, ...(prev || [])]);
      }

      if (sorteado) {
        setPonteiroRoleta?.((prev) => (prev + 1) % Math.max((corretoresRoleta || []).length, 1));
      }
      setFormLead(FORM_LEAD_INICIAL);
      onSalvo?.(novoLeadObj);
      onFechar?.();
    } catch (err) {
      console.error('Erro ao salvar lead:', err);
    } finally {
      setSalvandoAcao(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <form
        onSubmit={salvarLeadImobi}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-novo-lead-titulo"
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md space-y-4"
      >
        <h3 id="modal-novo-lead-titulo" className="text-lg font-black text-white">
          👥 Cadastrar Novo Lead Imobiliário
        </h3>
        <div className="bg-[#020408] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs flex items-center justify-between">
          <span className="text-slate-400">🔀 Destino na Roleta:</span>
          <span style={{ color: '#10b981' }} className="font-bold text-[#10b981]">
            {roletaAtiva ? proximoCorretorDaVez?.nome || 'Plantão Geral' : 'Fila Manual (Roleta Pausada)'}
          </span>
        </div>
        <div>
          <label htmlFor="lead-nome" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            Nome do cliente *
          </label>
          <input
            id="lead-nome"
            name="nome"
            autoComplete="off"
            required
            placeholder="Ex: Maria Oliveira"
            value={formLead.nome}
            onChange={(e) => setFormLead({ ...formLead, nome: e.target.value })}
            className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        <div>
          <label htmlFor="lead-telefone" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            WhatsApp com DDD *
          </label>
          <input
            id="lead-telefone"
            name="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            required
            placeholder="Ex: 34999998888"
            value={formLead.telefone}
            onChange={(e) => setFormLead({ ...formLead, telefone: e.target.value })}
            className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="lead-interesse" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Interesse
            </label>
            <select
              id="lead-interesse"
              name="interesse"
              value={formLead.interesse}
              onChange={(e) => setFormLead({ ...formLead, interesse: e.target.value })}
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white"
            >
              <option>Compra</option>
              <option>Locação</option>
              <option>Investimento</option>
            </select>
          </div>
          <div>
            <label htmlFor="lead-orcamento" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Orçamento (R$)
            </label>
            <input
              id="lead-orcamento"
              name="orcamento"
              inputMode="decimal"
              autoComplete="off"
              placeholder="Ex: 350.000"
              value={formLead.orcamento}
              onChange={(e) => setFormLead({ ...formLead, orcamento: e.target.value })}
              className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
          </div>
        </div>
        <div>
          <label htmlFor="lead-bairro" className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            Bairro de preferência
          </label>
          <input
            id="lead-bairro"
            name="bairro"
            autoComplete="off"
            placeholder="Ex: Tibery"
            value={formLead.bairro}
            onChange={(e) => setFormLead({ ...formLead, bairro: e.target.value })}
            className="w-full bg-[#020408] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
          />
        </div>
        {/* LGPD — dado de terceiro digitado pelo corretor (D-22.05) */}
        <p className="text-[10.5px] leading-relaxed text-slate-500">
          Registre aqui apenas o que o cliente informou para ser atendido: nome, WhatsApp, interesse e faixa de
          orçamento. O cadastro fica no CRM desta imobiliária e serve para responder a esse contato. Para correção ou
          exclusão, use <strong className="text-slate-300">Excluir meus dados</strong> no rodapé do painel ou a
          Política de Privacidade.
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
            {salvandoAcao ? 'Distribuindo...' : 'Salvar e Enviar p/ Roleta'}
          </button>
        </div>
      </form>
    </div>
  );
}
