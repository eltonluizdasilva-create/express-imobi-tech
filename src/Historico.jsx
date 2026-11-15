import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { registrarEventoLead, TIPOS_EVENTO } from './services/girardEngine';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import {
  Search,
  FileText,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';

const PROPOSTAS_DEMONSTRACAO = [
  {
    id: 'prop_demo_1',
    codigoImovel: 'IMB-3041',
    imovelTitulo: 'Apartamento 3 Suítes — Residencial Jardins',
    nomeCliente: 'Marcelo Vasconcelos',
    telefone: '11999887766',
    modalidade: 'Financiamento SBPE + FGTS',
    valorProposta: 740000,
    sinalEntrada: 150000,
    corretor: 'Rodrigo Almeida',
    status: 'Aceita / Em Contrato',
    observacoes: 'Entrada de R$ 150 mil via TED + R$ 590 mil aprovados no Itaú.',
    dataRegistro: new Date().toISOString(),
  },
  {
    id: 'prop_demo_2',
    codigoImovel: 'IMB-1180',
    imovelTitulo: 'Lote Condomínio Fechado — Quadra B Lote 14',
    nomeCliente: 'Fernanda Ribeiro',
    telefone: '11988776655',
    modalidade: 'Compra Direta / Parcelamento Loteadora',
    valorProposta: 285000,
    sinalEntrada: 57000,
    corretor: 'Camila Rocha',
    status: 'Em Análise',
    observacoes: 'Proposta com 20% de sinal e saldo em 60x direto com a urbanizadora.',
    dataRegistro: new Date().toISOString(),
  },
];

export default function Historico({ oficinaId }) {
  const [propostas, setPropostas] = useState(PROPOSTAS_DEMONSTRACAO);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [salvando, setSalvando] = useState(false);

  const [formProposta, setFormProposta] = useState({
    codigoImovel: '',
    imovelTitulo: '',
    nomeCliente: '',
    telefone: '',
    modalidade: 'Financiamento SBPE + FGTS',
    valorProposta: '',
    sinalEntrada: '',
    corretor: '',
    status: 'Em Análise',
    observacoes: '',
  });

  useEffect(() => {
    if (!oficinaId) return;
    const q = query(collection(db, 'oficinas', oficinaId, 'propostas_imobi'), orderBy('criadoEm', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (docs.length > 0) {
          setPropostas(docs);
        }
      },
      (err) => console.warn('Aviso ao carregar propostas:', err)
    );
    return () => unsubscribe();
  }, [oficinaId]);

  const parseValor = (val) => {
    if (typeof val === 'number') return val;
    const limpo = String(val || '')
      .replace(/[^\d,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const n = parseFloat(limpo);
    return Number.isFinite(n) ? n : 0;
  };

  const fmtBRL = (val) =>
    Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    });

  const salvarProposta = async (e) => {
    e.preventDefault();
    if (!formProposta.nomeCliente.trim() || !formProposta.imovelTitulo.trim()) {
      alert('Preencha o nome do cliente proponente e o imóvel objeto da proposta.');
      return;
    }

    setSalvando(true);
    try {
      const nova = {
        codigoImovel: formProposta.codigoImovel.trim() || `IMB-${Math.floor(1000 + Math.random() * 9000)}`,
        imovelTitulo: formProposta.imovelTitulo.trim(),
        nomeCliente: formProposta.nomeCliente.trim(),
        telefone: formProposta.telefone.replace(/\D/g, ''),
        modalidade: formProposta.modalidade,
        valorProposta: parseValor(formProposta.valorProposta),
        sinalEntrada: parseValor(formProposta.sinalEntrada),
        corretor: formProposta.corretor.trim() || 'Corretor Responsável',
        status: formProposta.status || 'Em Análise',
        observacoes: formProposta.observacoes.trim(),
        dataRegistro: new Date().toISOString(),
        leadId: formProposta.leadId || null,
        ultimaMovimentacaoEm: serverTimestamp(),
        criadoEm: serverTimestamp(),
      };

      if (oficinaId) {
        await addDoc(collection(db, 'oficinas', oficinaId, 'propostas_imobi'), nova);
        await registrarEventoLead(db, oficinaId, {
          leadId: nova.leadId,
          telefone: nova.telefone,
          tipo: TIPOS_EVENTO.PROPOSTA_CRIADA,
          canal: 'painel',
          descricao: `Proposta ${nova.modalidade} de ${nova.valorProposta}`,
          metadados: { codigoImovel: nova.codigoImovel, status: nova.status },
        });
      } else {
        setPropostas((prev) => [{ id: `local_${Date.now()}`, ...nova }, ...(prev || [])]);
      }

      setFormProposta({
        codigoImovel: '',
        imovelTitulo: '',
        nomeCliente: '',
        telefone: '',
        modalidade: 'Financiamento SBPE + FGTS',
        valorProposta: '',
        sinalEntrada: '',
        corretor: '',
        status: 'Em Análise',
        observacoes: '',
      });
    } catch (err) {
      console.error('Erro ao registrar proposta:', err);
      alert('Erro ao salvar proposta: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const alterarStatusProposta = async (prop, novoStatus) => {
    try {
      if (oficinaId && prop?.id && !String(prop.id).startsWith('prop_demo_') && !String(prop.id).startsWith('local_')) {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'propostas_imobi', prop.id), { status: novoStatus });
      } else {
        setPropostas((prev) =>
          (prev || [])?.map((item) => (item.id === prop.id ? { ...item, status: novoStatus } : item))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const excluirProposta = async (id) => {
    if (!window.confirm('Deseja remover esta proposta comercial?')) return;
    try {
      if (oficinaId && !String(id).startsWith('prop_demo_') && !String(id).startsWith('local_')) {
        await deleteDoc(doc(db, 'oficinas', oficinaId, 'propostas_imobi', id));
      } else {
        setPropostas((prev) => (prev || []).filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const propostasFiltradas = useMemo(() => {
    const base = Array.isArray(propostas) ? propostas : [];
    const busca = searchTerm.toLowerCase();
    return base.filter((p) => {
      const matchTexto =
        !busca ||
        String(p.nomeCliente || '').toLowerCase().includes(busca) ||
        String(p.imovelTitulo || '').toLowerCase().includes(busca) ||
        String(p.codigoImovel || '').toLowerCase().includes(busca);
      const matchStatus = filtroStatus === 'Todos' || p.status === filtroStatus;
      return matchTexto && matchStatus;
    });
  }, [propostas, searchTerm, filtroStatus]);

  const vgvPropostas = useMemo(
    () => (propostas || []).reduce((acc, p) => acc + (Number(p.valorProposta) || 0), 0),
    [propostas]
  );

  const comissaoPrevista = vgvPropostas * 0.06;

  const enviarPropostaWhatsApp = (p) => {
    const foneLimpo = String(p.telefone || '').replace(/\D/g, '');
    const numero = foneLimpo ? (foneLimpo.startsWith('55') ? foneLimpo : `55${foneLimpo}`) : '';
    const msg =
      `📑 *PROPOSTA COMERCIAL DE COMPRA / LOCAÇÃO — EXPRESS IMOBI TECH*\n\n` +
      `👤 *Proponente:* ${p.nomeCliente}\n` +
      `🏢 *Imóvel:* ${p.imovelTitulo} (${p.codigoImovel})\n` +
      `💰 *Valor da Proposta:* ${fmtBRL(p.valorProposta)}\n` +
      `💵 *Sinal / Entrada:* ${fmtBRL(p.sinalEntrada)}\n` +
      `🏦 *Modalidade:* ${p.modalidade}\n` +
      `📌 *Status Atual:* ${p.status}\n` +
      (p.observacoes ? `📝 *Condições:* ${p.observacoes}\n` : '') +
      `\nPor favor, confirme o recebimento desta proposta para avançarmos com a minuta contratual.`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ backgroundColor: '#020408' }} className="mx-auto max-w-7xl space-y-6 px-4 pb-24 pt-2 text-slate-100 md:px-6 font-sans">
      {/* CABEÇALHO EXECUTIVO */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#10b981]">
              <FileText size={13} /> Propostas & Negócios
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase">
              📝 PROPOSTAS & <span style={{ color: '#10b981' }}>FECHAMENTO</span>
            </h1>
            <p className="mt-2 text-xs md:text-sm text-zinc-400">
              Gerenciamento de propostas comerciais, análise de crédito (SBPE, FGTS, financiamentos) e histórico de negociações até a assinatura do contrato.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-[#020408] border border-zinc-800 rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase text-zinc-400">Propostas Ativas</p>
              <p style={{ color: '#10b981' }} className="text-2xl font-black mt-1">{(propostas || []).length}</p>
            </div>
            <div className="bg-[#020408] border border-zinc-800 rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase text-zinc-400">VGV em Propostas</p>
              <p style={{ color: '#10b981' }} className="text-lg font-black mt-1">{fmtBRL(vgvPropostas)}</p>
            </div>
            <div className="bg-[#020408] border border-zinc-800 rounded-2xl p-4 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold uppercase text-zinc-400">Comissão (6%)</p>
              <p style={{ color: '#10b981' }} className="text-lg font-black mt-1">{fmtBRL(comissaoPrevista)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FORMULÁRIO DE NOVA PROPOSTA IMOBILIÁRIA */}
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#10b981] mb-4 flex items-center gap-2">
          <Plus size={15} /> Registrar Nova Proposta Comercial
        </h2>

        <form onSubmit={salvarProposta} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Código do Imóvel</label>
              <input
                type="text"
                value={formProposta.codigoImovel}
                onChange={(e) => setFormProposta({ ...formProposta, codigoImovel: e.target.value })}
                placeholder="Ex: IMB-2040"
                className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Imóvel / Lote / Fazenda *</label>
              <input
                type="text"
                required
                value={formProposta.imovelTitulo}
                onChange={(e) => setFormProposta({ ...formProposta, imovelTitulo: e.target.value })}
                placeholder="Ex: Sobrado 3 Suítes Condomínio Bosque"
                className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Modalidade do Negócio</label>
              <select
                value={formProposta.modalidade}
                onChange={(e) => setFormProposta({ ...formProposta, modalidade: e.target.value })}
                className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
              >
                <option value="Financiamento SBPE + FGTS">Financiamento SBPE + FGTS</option>
                <option value="Minha Casa, Minha Vida (MCMV)">Minha Casa, Minha Vida (MCMV)</option>
                <option value="Pagamento à Vista (TED/PIX)">Pagamento à Vista (TED/PIX)</option>
                <option value="Permuta + Saldo em Dinheiro">Permuta + Saldo em Dinheiro</option>
                <option value="Compra Direta / Parcelamento Loteadora">Parcelamento Direto Loteadora</option>
                <option value="Proposta de Locação Residencial/Comercial">Proposta de Locação</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Cliente Proponente *</label>
              <input
                type="text"
                required
                value={formProposta.nomeCliente}
                onChange={(e) => setFormProposta({ ...formProposta, nomeCliente: e.target.value })}
                placeholder="Nome do comprador/locatário"
                className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">WhatsApp do Cliente</label>
              <input
                type="text"
                value={formProposta.telefone}
                onChange={(e) => setFormProposta({ ...formProposta, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Valor da Proposta (R$)</label>
              <input
                type="text"
                value={formProposta.valorProposta}
                onChange={(e) => setFormProposta({ ...formProposta, valorProposta: e.target.value })}
                placeholder="Ex: 580000"
                className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Sinal / Entrada (R$)</label>
              <input
                type="text"
                value={formProposta.sinalEntrada}
                onChange={(e) => setFormProposta({ ...formProposta, sinalEntrada: e.target.value })}
                placeholder="Ex: 116000"
                className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Corretor Responsável</label>
              <input
                type="text"
                value={formProposta.corretor}
                onChange={(e) => setFormProposta({ ...formProposta, corretor: e.target.value })}
                placeholder="Nome do corretor"
                className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Condições de Pagamento / Observações da Proposta</label>
              <input
                type="text"
                value={formProposta.observacoes}
                onChange={(e) => setFormProposta({ ...formProposta, observacoes: e.target.value })}
                placeholder="Ex: Sinal de R$ 50 mil na assinatura do contrato + uso de FGTS + financiamento Caixa..."
                className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>
            <button
              type="submit"
              disabled={salvando}
              style={{ backgroundColor: '#10b981' }}
              className="w-full py-3.5 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-95 transition cursor-pointer"
            >
              {salvando ? 'Salvando...' : '➕ Emitir Proposta'}
            </button>
          </div>
        </form>
      </section>

      {/* BUSCA E FILTROS */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#10b981]" size={16} />
          <input
            type="text"
            placeholder="Buscar por nome do comprador, código do imóvel (Ex: IMB-3041) ou título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#020408] border border-zinc-800 focus:border-[#10b981] text-white py-2.5 pl-10 pr-4 rounded-xl outline-none text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['Todos', 'Em Análise', 'Contraproposta', 'Aceita / Em Contrato', 'Recusada'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFiltroStatus(st)}
              style={filtroStatus === st ? { backgroundColor: '#10b981' } : undefined}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                filtroStatus === st
                  ? 'text-slate-950'
                  : 'bg-[#020408] text-zinc-400 border border-zinc-800 hover:border-[#10b981]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM DE PROPOSTAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(propostasFiltradas || [])?.map((p) => {
          const isAceita = p.status === 'Aceita / Em Contrato';
          return (
            <div
              key={p.id}
              className="bg-zinc-900/90 border border-zinc-800 hover:border-[#10b981]/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-[#020408] text-[#10b981] border border-[#10b981]/30">
                    {p.codigoImovel || 'IMB'} • {p.modalidade}
                  </span>
                  <select
                    value={p.status || 'Em Análise'}
                    onChange={(e) => alterarStatusProposta(p, e.target.value)}
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border cursor-pointer ${
                      isAceita
                        ? 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    <option value="Em Análise" className="bg-zinc-900 text-white">⏳ Em Análise</option>
                    <option value="Contraproposta" className="bg-zinc-900 text-white">🔄 Contraproposta</option>
                    <option value="Aceita / Em Contrato" className="bg-zinc-900 text-white">✅ Aceita / Em Contrato</option>
                    <option value="Recusada" className="bg-zinc-900 text-white">❌ Recusada</option>
                  </select>
                </div>

                <div>
                  <h3 className="text-base font-black text-white">{p.imovelTitulo}</h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                    <User size={13} className="text-[#10b981]" /> Proponente: <strong className="text-white">{p.nomeCliente}</strong>
                    {p.corretor && <span> • Corretor: {p.corretor}</span>}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#020408] border border-zinc-800 rounded-xl p-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Valor Proposto</p>
                    <p style={{ color: '#10b981' }} className="text-base font-black">{fmtBRL(p.valorProposta)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Sinal / Entrada</p>
                    <p className="text-sm font-bold text-white">{fmtBRL(p.sinalEntrada)}</p>
                  </div>
                </div>

                {p.observacoes && (
                  <p className="text-xs text-zinc-300 bg-[#020408]/60 border border-zinc-800/80 rounded-xl p-2.5">
                    📝 {p.observacoes}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => enviarPropostaWhatsApp(p)}
                  style={{ backgroundColor: '#10b981' }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition cursor-pointer"
                >
                  <Send size={13} /> Enviar Proposta no WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => excluirProposta(p.id)}
                  className="p-2.5 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                  title="Excluir proposta"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
