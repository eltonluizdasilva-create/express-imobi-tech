import React, { useState } from 'react';

export default function PainelRoletaLeads({
  tempoRepasseMin = 15,
  setTempoRepasseMin,
  redistribuirLeadsEquilibrado,
  roletaAtiva = true,
  setRoletaAtiva,
  statusRoletaMsg = '',
  setStatusRoletaMsg,
  proximoCorretorDaVez,
  corretoresAtivos = [],
  setModalNovoLeadImobi,
  setCorretoresRoleta,
  corretoresComMetricas = [],
  fmtBRL,
}) {
  const [novoCorretorNome, setNovoCorretorNome] = useState('');
  const [novoCorretorZap, setNovoCorretorZap] = useState('');
  const [statusMsgLocal, setStatusMsgLocal] = useState('');

  const formatarMoeda = fmtBRL || ((val) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  const mensagemExibida = statusRoletaMsg || statusMsgLocal;

  const limparMensagem = () => {
    if (setStatusRoletaMsg) setStatusRoletaMsg('');
    setStatusMsgLocal('');
  };

  const adicionarCorretorRoleta = (e) => {
    e.preventDefault();
    if (!novoCorretorNome.trim()) return;
    const novo = {
      id: `cor_${Date.now()}`,
      nome: novoCorretorNome.trim(),
      whatsapp: novoCorretorZap.replace(/\D/g, '') || '5511999999999',
      ativo: true,
      leadsBase: 0,
    };
    setCorretoresRoleta?.((prev) => [...(Array.isArray(prev) ? prev : []), novo]);
    setNovoCorretorNome('');
    setNovoCorretorZap('');
    const msg = `Corretor ${novo.nome} incluído na roleta ativa!`;
    if (setStatusRoletaMsg) {
      setStatusRoletaMsg(msg);
      setTimeout(() => setStatusRoletaMsg(''), 4000);
    } else {
      setStatusMsgLocal(msg);
      setTimeout(() => setStatusMsgLocal(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 text-[#10b981] text-[10px] font-extrabold uppercase tracking-wider mb-2">
            🔀 Módulo de Assinantes • Controlo de Gestão
          </div>
          <h2 className="text-2xl font-black text-white">Roleta de Leads & Distribuição Justa</h2>
          <p className="text-sm text-slate-400">
            Distribui novos leads de forma rotativa e equilibrada entre os corretores ativos da equipa e calcula o VGV e comissões (6%) por corretor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-slate-300 font-bold">
            Prazo p/ Aceite (min):
            <input
              type="number"
              value={tempoRepasseMin}
              onChange={(e) => setTempoRepasseMin?.(Number(e.target.value) || 5)}
              className="ml-2 w-16 bg-[#020408] border border-slate-700 rounded-lg px-2 py-1 text-[#10b981] font-bold"
            />
          </label>
          {redistribuirLeadsEquilibrado && (
            <button
              onClick={redistribuirLeadsEquilibrado}
              className="px-4 py-2 rounded-xl bg-[#020408] border border-slate-700 hover:border-[#10b981] text-slate-200 hover:text-[#10b981] text-xs font-bold cursor-pointer transition"
            >
              🔀 Redistribuir Leads do CRM (Giro Justo)
            </button>
          )}
          {setRoletaAtiva && (
            <button
              onClick={() => setRoletaAtiva((v) => !v)}
              style={roletaAtiva ? { backgroundColor: '#10b981' } : undefined}
              className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                roletaAtiva ? 'text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {roletaAtiva ? '✅ Roleta Ativa' : '⏸️ Roleta Pausada'}
            </button>
          )}
        </div>
      </div>

      {mensagemExibida && (
        <div className="bg-[#020408] border border-[#10b981] rounded-xl px-4 py-3 text-xs font-bold text-[#10b981] flex items-center justify-between">
          <span>{mensagemExibida}</span>
          <button
            onClick={limparMensagem}
            aria-label="Fechar o aviso da roleta"
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Painel de Controlo da Fila Rotativa + Adição Rápida de Corretor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Próximo Corretor da Vez
            </span>
            <h3 style={{ color: '#10b981' }} className="text-xl font-black text-[#10b981] mt-1">
              {roletaAtiva ? proximoCorretorDaVez?.nome || 'Nenhum corretor ativo' : 'Roleta Pausada (Plantão Geral)'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Critério: menor carga ativa de leads no CRM + desempate por giro rotativo (Round-Robin).
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Corretores no plantão: <strong className="text-white">{corretoresAtivos?.length || 0}</strong>
            </span>
            {setModalNovoLeadImobi && (
              <button
                onClick={() => setModalNovoLeadImobi(true)}
                style={{ backgroundColor: '#10b981' }}
                className="px-3 py-1.5 rounded-lg text-white font-bold cursor-pointer hover:opacity-90"
              >
                + Testar Novo Lead na Roleta
              </button>
            )}
          </div>
        </div>

        <form
          onSubmit={adicionarCorretorRoleta}
          className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-3"
        >
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Adicionar Corretor à Equipa / Roleta
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Inclua corretores para participarem imediatamente na distribuição rotativa.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              placeholder="Nome (ex: Corretor Lucas)"
              value={novoCorretorNome}
              onChange={(e) => setNovoCorretorNome(e.target.value)}
              className="bg-[#020408] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
            <input
              placeholder="WhatsApp (ex: 11988887777)"
              value={novoCorretorZap}
              onChange={(e) => setNovoCorretorZap(e.target.value)}
              className="bg-[#020408] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
            <button
              type="submit"
              style={{ backgroundColor: '#10b981' }}
              className="px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer hover:opacity-90"
            >
              + Incluir na Roleta
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(corretoresComMetricas || []).map((corretor) => {
          const ehProximo = roletaAtiva && proximoCorretorDaVez?.id === corretor.id;
          return (
            <div
              key={corretor.id}
              className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between gap-4 ${
                ehProximo ? 'border-[#10b981]' : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white">{corretor.nome}</h3>
                    {ehProximo && (
                      <span className="px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] text-[10px] font-extrabold uppercase">
                        Da Vez
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">📱 {corretor.whatsapp}</p>
                </div>
                <button
                  onClick={() =>
                    setCorretoresRoleta?.((prev) =>
                      (Array.isArray(prev) ? prev : []).map((c) =>
                        c.id === corretor.id ? { ...c, ativo: !c.ativo } : c
                      )
                    )
                  }
                  style={corretor.ativo ? { backgroundColor: '#10b981' } : undefined}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    corretor.ativo ? 'text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {corretor.ativo ? 'No Plantão' : 'Ausente'}
                </button>
              </div>

              <div className="bg-[#020408] border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Leads atribuídos no CRM:</span>
                  <span style={{ color: '#10b981' }} className="font-black text-[#10b981]">
                    {corretor.leadsRecebidos}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">VGV sob gestão:</span>
                  <span className="font-bold text-white">{formatarMoeda(corretor.vgvAtribuido)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Comissão prevista (6%):</span>
                  <span style={{ color: '#10b981' }} className="font-bold text-[#10b981]">
                    {formatarMoeda(corretor.comissaoCorretor)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
