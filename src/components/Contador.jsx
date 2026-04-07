/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
    Calculator, Receipt, TrendingUp, TrendingDown,
    Trash2, Send, Copy, CheckCircle, ScanLine,
    Landmark, PiggyBank, Sparkles, FileText, DollarSign
} from "lucide-react";

const STYLES = {
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl',
    input: 'bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm shadow-inner'
};

export default function Contador({ oficinaId }) {
    // 1. Estados do Fluxo de Caixa Expresso
    const [transacoes, setTransacoes] = useState([
        { id: 1, tipo: 'receita', valor: 450.00, desc: 'O.S. Carlos - Freios', data: new Date().toLocaleDateString() },
        { id: 2, tipo: 'despesa', valor: 120.00, desc: 'Compra Mercado Livre (Pastilha)', data: new Date().toLocaleDateString() }
    ]);
    const [novaDesc, setNovaDesc] = useState("");
    const [novoValor, setNovoValor] = useState("");
    const [novoTipo, setNovoTipo] = useState("receita");

    // 2. Estados do Gerador de Recibos
    const [recCliente, setRecCliente] = useState("");
    const [recValor, setRecValor] = useState("");
    const [recServico, setRecServico] = useState("");
    const [reciboGerado, setReciboGerado] = useState("");
    const [copied, setCopied] = useState(false);

    // Cálculos do Caixa
    const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((acc, curr) => acc + curr.valor, 0);
    const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((acc, curr) => acc + curr.valor, 0);
    const saldo = totalReceitas - totalDespesas;

    const addTransacao = () => {
        if (!novaDesc || !novoValor) return alert("Preencha a descrição e o valor.");
        const valorNum = parseFloat(novoValor.replace(',', '.'));
        if (isNaN(valorNum)) return alert("Valor inválido.");

        setTransacoes([{
            id: Date.now(),
            tipo: novoTipo,
            valor: valorNum,
            desc: novaDesc,
            data: new Date().toLocaleDateString()
        }, ...transacoes]);

        setNovaDesc("");
        setNovoValor("");
    };

    const deleteTransacao = (id) => {
        setTransacoes(transacoes.filter(t => t.id !== id));
    };

    const gerarRecibo = () => {
        if (!recCliente || !recValor || !recServico) return alert("Preencha todos os campos do recibo.");
        const valorNum = parseFloat(recValor.replace(',', '.')).toFixed(2);
        const dataAtual = new Date().toLocaleDateString('pt-BR');

        const recibo = `🧾 *RECIBO DE PAGAMENTO*\n\nRecebemos de *${recCliente}* a quantia de *R$ ${valorNum}* referente a:\n🔧 ${recServico}\n\nData: ${dataAtual}\n\nExpress Auto Tech agradece a preferência! 📱`;
        setReciboGerado(recibo);
    };

    return (
        <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40">
            <div className="max-w-7xl mx-auto">

                {/* HEADER DO CONTADOR */}
                <div className="bg-gradient-to-r from-amber-600 to-orange-500 rounded-[2rem] p-8 mb-10 shadow-[0_0_40px_rgba(245,158,11,0.2)] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-black/20 rounded-2xl backdrop-blur-sm">
                            <Calculator className="text-white" size={48} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Contador IA</h1>
                            <p className="text-amber-100 font-bold mt-2 uppercase tracking-widest text-sm flex items-center gap-2">
                                <Sparkles size={16} /> Gestão Financeira, Caixa e Recibos
                            </p>
                        </div>
                    </div>
                </div>

                {/* 💰 DASHBOARD RÁPIDO DO CAIXA */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={100} className="text-green-500" /></div>
                        <span className="text-green-500 font-black uppercase text-xs tracking-widest mb-2 flex items-center gap-2"><TrendingUp size={14} /> Entradas</span>
                        <span className="text-3xl font-black text-white">R$ {totalReceitas.toFixed(2)}</span>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingDown size={100} className="text-rose-500" /></div>
                        <span className="text-rose-500 font-black uppercase text-xs tracking-widest mb-2 flex items-center gap-2"><TrendingDown size={14} /> Saídas</span>
                        <span className="text-3xl font-black text-white">R$ {totalDespesas.toFixed(2)}</span>
                    </div>
                    <div className={`border p-6 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group transition-all ${saldo >= 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform"><PiggyBank size={100} className={saldo >= 0 ? 'text-amber-500' : 'text-rose-500'} /></div>
                        <span className={`font-black uppercase text-xs tracking-widest mb-2 flex items-center gap-2 ${saldo >= 0 ? 'text-amber-500' : 'text-rose-500'}`}><DollarSign size={14} /> Saldo Atual</span>
                        <span className={`text-4xl font-black ${saldo >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>R$ {saldo.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* 💵 GERADOR DE RECIBOS */}
                    <div className={STYLES.card + " mb-0"}>
                        <h2 className="text-amber-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2 border-l-4 border-amber-500 pl-4">
                            <Receipt size={16} /> Gerador de Recibos
                        </h2>
                        <p className="text-[11px] text-zinc-500 mb-6">Gere um comprovante de pagamento profissional para enviar via WhatsApp.</p>

                        <div className="space-y-4 mb-6">
                            <input value={recCliente} onChange={e => setRecCliente(e.target.value)} placeholder="Nome do Cliente" className={STYLES.input} />
                            <div className="grid grid-cols-2 gap-4">
                                <input value={recValor} onChange={e => setRecValor(e.target.value)} placeholder="Valor (R$)" className={STYLES.input} />
                                <input value={recServico} onChange={e => setRecServico(e.target.value)} placeholder="Ref: Troca de Óleo" className={STYLES.input} />
                            </div>
                        </div>

                        <button onClick={gerarRecibo} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                            <FileText size={16} /> Criar Recibo
                        </button>

                        {reciboGerado && (
                            <div className="mt-6 p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl animate-in fade-in duration-500">
                                <p className="text-xs text-amber-500 font-mono mb-4 whitespace-pre-wrap leading-relaxed">{reciboGerado}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => { navigator.clipboard.writeText(reciboGerado); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all flex justify-center items-center gap-2 ${copied ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                                        {copied ? <CheckCircle size={14} /> : <Copy size={14} />} {copied ? 'Copiado!' : 'Copiar'}
                                    </button>
                                    <button onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(reciboGerado)}`, '_blank')} className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-black text-[10px] uppercase text-white transition-all flex justify-center items-center gap-2">
                                        <Send size={14} /> Enviar Zap
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 💸 LIVRO CAIXA (FLUXO EXPRESSO) */}
                    <div className={STYLES.card + " mb-0"}>
                        <h2 className="text-amber-500 font-black mb-6 uppercase text-xs tracking-widest flex items-center gap-2 border-l-4 border-amber-500 pl-4">
                            <Calculator size={16} /> Lançamentos (Caixa Hoje)
                        </h2>

                        {/* Form de Adição */}
                        <div className="flex gap-2 mb-6">
                            <select value={novoTipo} onChange={e => setNovoTipo(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-xl px-2 text-xs font-bold outline-none">
                                <option value="receita">Entrada (+)</option>
                                <option value="despesa">Saída (-)</option>
                            </select>
                            <input value={novaDesc} onChange={e => setNovaDesc(e.target.value)} placeholder="Descrição..." className={STYLES.input + " py-3 flex-1"} />
                            <input value={novoValor} onChange={e => setNovoValor(e.target.value)} placeholder="R$ 0" className={STYLES.input + " py-3 w-24 text-center"} />
                            <button onClick={addTransacao} className="bg-amber-600 hover:bg-amber-500 text-white px-4 rounded-xl font-black transition-all">+</button>
                        </div>

                        {/* Lista de Transações */}
                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
                            {transacoes.length === 0 && <p className="text-center text-zinc-600 text-xs py-4 italic">Nenhum lançamento no caixa.</p>}
                            {transacoes.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${t.tipo === 'receita' ? 'bg-green-500/10 text-green-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {t.tipo === 'receita' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-300">{t.desc}</p>
                                            <p className="text-[9px] text-zinc-600">{t.data}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`font-black text-sm ${t.tipo === 'receita' ? 'text-green-500' : 'text-rose-500'}`}>
                                            {t.tipo === 'receita' ? '+' : '-'} R$ {t.valor.toFixed(2)}
                                        </span>
                                        <button onClick={() => deleteTransacao(t.id)} className="text-zinc-600 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 🚀 ROADMAP DO CONTADOR (VISÃO DE FUTURO DA IA) */}
                <div className="mt-12">
                    <div className="text-center mb-8">
                        <h2 className="text-zinc-500 font-black uppercase text-xs tracking-widest mb-2 flex items-center justify-center gap-2">
                            <Sparkles size={14} className="text-amber-500" /> IA em Treinamento (Em Breve)
                        </h2>
                        <p className="text-zinc-600 text-[10px] uppercase tracking-widest">O Contador Virtual está aprendendo a automatizar a burocracia da sua oficina.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">

                        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-6 relative overflow-hidden">
                            <div className="absolute top-4 right-4 bg-zinc-800 text-zinc-500 text-[8px] font-black uppercase px-2 py-1 rounded-sm">V.2.0</div>
                            <ScanLine size={32} className="text-zinc-600 mb-4" />
                            <h3 className="text-zinc-400 font-black text-sm uppercase tracking-widest mb-2">Leitor de Notas Fiscais</h3>
                            <p className="text-zinc-600 text-xs">Tire foto das notas de peças. A IA lê os valores e lança no fluxo de caixa automaticamente.</p>
                        </div>

                        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-6 relative overflow-hidden">
                            <div className="absolute top-4 right-4 bg-zinc-800 text-zinc-500 text-[8px] font-black uppercase px-2 py-1 rounded-sm">V.2.5</div>
                            <Landmark size={32} className="text-zinc-600 mb-4" />
                            <h3 className="text-zinc-400 font-black text-sm uppercase tracking-widest mb-2">Cálculo de Impostos</h3>
                            <p className="text-zinc-600 text-xs">O Contador separa automaticamente a porcentagem do Simples Nacional/DAS a cada O.S. paga.</p>
                        </div>

                        <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-6 relative overflow-hidden">
                            <div className="absolute top-4 right-4 bg-zinc-800 text-zinc-500 text-[8px] font-black uppercase px-2 py-1 rounded-sm">V.3.0</div>
                            <PiggyBank size={32} className="text-zinc-600 mb-4" />
                            <h3 className="text-zinc-400 font-black text-sm uppercase tracking-widest mb-2">Conciliação Bancária</h3>
                            <p className="text-zinc-600 text-xs">Conecte sua conta via Open Finance. O sistema cruza os PIXs recebidos com as O.S. e dá baixa sozinho.</p>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}