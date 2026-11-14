import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import {
  Users,
  Wallet,
  Clock,
  Sparkles,
  CheckCircle,
  TrendingDown,
  Calendar,
  DollarSign
} from 'lucide-react';

export default function PagamentosEquipe({ oficinaId, listaCarros, onSalvo }) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [comissaoPadrao, setComissaoPadrao] = useState(30);
  const [filtroPeriodo, setFiltroPeriodo] = useState('Mensal');

  // Listen to members
  useEffect(() => {
    if (!oficinaId) return;
    const q = collection(db, 'oficinas', oficinaId, 'equipe');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setFuncionarios(lista);
    });
    return () => unsubscribe();
  }, [oficinaId]);

  // Compute date bound for period
  const inicioPeriodo = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (filtroPeriodo === 'Semanal') {
      hoje.setDate(hoje.getDate() - 6);
    } else if (filtroPeriodo === 'Quinzenal') {
      hoje.setDate(hoje.getDate() - 14);
    } else if (filtroPeriodo === 'Mensal') {
      hoje.setDate(1); // Mês atual
    }
    return hoje;
  }, [filtroPeriodo]);

  // For each employee, group their matching OSs and commissions
  const dadosEquipe = useMemo(() => {
    const osBase = Array.isArray(listaCarros) ? listaCarros : [];

    return funcionarios.map(func => {
      const osDoFuncionario = [];
      let totalMaoObra = 0;

      osBase.forEach(os => {
        let dataOS;
        try {
          if (os.data_registro?.toDate) dataOS = os.data_registro.toDate();
          else if (os.data_registro) dataOS = new Date(os.data_registro);
          else if (os.data) dataOS = new Date(os.data);
          else dataOS = new Date();
        } catch {
          dataOS = new Date();
        }

        if (dataOS >= inicioPeriodo) {
          const resp = (os.mecanico || os.responsavel || os.funcionario || os.tecnico || '').trim().toLowerCase();
          const nomeFunc = (func.nome || '').trim().toLowerCase();

          if (resp && (resp.includes(nomeFunc) || nomeFunc.includes(resp))) {
            osDoFuncionario.push(os);
            const mo = Number(os.valorMaoObra) || 0;
            totalMaoObra += mo;
          }
        }
      });

      const valorComissao = (totalMaoObra * comissaoPadrao) / 100;

      return {
        ...func,
        osRealizadas: osDoFuncionario,
        totalMaoObra,
        valorComissao,
      };
    });
  }, [funcionarios, listaCarros, inicioPeriodo, comissaoPadrao]);

  const handlePagarFuncionario = async (func) => {
    if (!oficinaId) return;
    if (func.valorComissao <= 0) {
      alert("⚠️ O funcionário não tem comissões a receber no período selecionado.");
      return;
    }
    if (window.confirm(`Deseja confirmar o pagamento de ${formatCurrency(func.valorComissao)} para ${func.nome}?`)) {
      try {
        await addDoc(collection(db, 'oficinas', oficinaId, 'financeiro'), {
          descricao: `Pagamento Comissão: ${func.nome} - Período ${filtroPeriodo}`,
          valor: func.valorComissao,
          pagamento: 'PIX',
          tipo: 'saida',
          data: new Date().toISOString()
        });
        alert(`✅ Pagamento de comissão gravado com sucesso!`);
        if (onSalvo) onSalvo();
      } catch (err) {
        alert("❌ Erro ao salvar pagamento: " + err.message);
      }
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans">
      
      {/* HERO SECTION */}
      <section className="overflow-hidden rounded-[28px] border border-purple-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.15),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(168,85,247,0.35)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-purple-200">
              <Sparkles size={14} />
              Gestão de Equipe & Pagamentos
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Equipe & Comissões
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Acompanhe as O.S. vinculadas a cada funcionário, calcule comissões de mão de obra e integre pagamentos diretamente ao caixa.
            </p>
          </div>

          <div className="flex flex-col gap-3 min-w-[320px]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Filtrar por Período:</p>
            <div className="flex flex-wrap gap-2">
              {['Semanal', 'Quinzenal', 'Mensal'].map((opcao) => (
                <button
                  key={opcao}
                  onClick={() => setFiltroPeriodo(opcao)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${filtroPeriodo === opcao ? 'bg-purple-500 text-slate-950 font-black shadow-lg shadow-purple-500/30 ring-2 ring-purple-400/50' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  {opcao}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SETTINGS BAR */}
      <section className="rounded-[24px] border border-slate-800 bg-slate-950/80 p-5 backdrop-blur flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-purple-300 flex items-center gap-2">
            ⚙️ Comissão de Mão de Obra
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Defina a taxa de comissão aplicada aos serviços.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Taxa (%)</label>
          <input
            type="number"
            value={comissaoPadrao}
            onChange={e => setComissaoPadrao(Number(e.target.value))}
            className="w-24 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-purple-400 text-center font-bold"
          />
        </div>
      </section>

      {/* EMPLOYEES GRID WITH COMMISSIONS */}
      <section className="grid gap-6 md:grid-cols-2">
        {dadosEquipe.length === 0 ? (
          <div className="md:col-span-2 text-center py-12 text-slate-500 font-medium italic border border-slate-800/80 rounded-[28px] bg-slate-950/90 shadow">
            Nenhum membro cadastrado na equipe. Adicione em "Equipe" para começar.
          </div>
        ) : (
          dadosEquipe.map(func => (
            <div key={func.id} className="rounded-[28px] border border-slate-800/80 bg-slate-950/90 p-6 shadow-2xl flex flex-col justify-between hover:border-purple-500/20 transition duration-300">
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black bg-purple-500/15 border-2 border-purple-500/30 text-purple-200">
                    {func.nome?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white">{func.nome}</h3>
                    <p className="text-xs text-slate-400">{func.email || 'Sem e-mail'}</p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-purple-500/10 text-purple-300 text-[10px] font-black uppercase tracking-wider rounded-full border border-purple-500/20">
                      {func.nivelAcesso || 'Funcionário'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-800/50 pt-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mão de Obra Realizada</p>
                    <p className="text-lg font-black mt-0.5 text-white">{formatCurrency(func.totalMaoObra)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Comissão a Pagar</p>
                    <p className="text-lg font-black mt-0.5 text-emerald-400">{formatCurrency(func.valorComissao)}</p>
                  </div>
                </div>

                {/* OS list summary */}
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {func.osRealizadas.length} O.S. realizadas no período
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                    {func.osRealizadas.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">Nenhuma O.S. realizada por este funcionário no período.</p>
                    ) : (
                      func.osRealizadas.map(os => (
                        <div key={os.id} className="flex items-center justify-between text-xs p-2 bg-slate-900/40 rounded-xl border border-slate-800/40">
                          <div>
                            <span className="font-black text-purple-300">{os.placa || 'Sem Placa'}</span>
                            <p className="text-slate-400 text-[10px]">{os.modelo || 'Sem Modelo'}</p>
                          </div>
                          <p className="font-mono font-bold text-white">{formatCurrency(os.valorMaoObra)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => handlePagarFuncionario(func)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                >
                  <DollarSign size={16} />
                  Pagar {formatCurrency(func.valorComissao)}
                </button>
              </div>

            </div>
          ))
        )}
      </section>

    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}
