/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../lib/firebase";
import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { Mic, Save, CheckCircle, Camera, Plus, Trash2, AlertTriangle, Sparkles, Wrench, Thermometer, Disc, Settings2, Car, Search, ClipboardCheck } from "lucide-react";

const STYLES = {
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 mb-8 shadow-xl',
    input: 'bg-zinc-950 border-zinc-800 focus:border-purple-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all font-mono text-sm'
};

// Seletor de Status customizado para Revisão (BOM, ATENÇÃO, TROCAR)
const StatusSelector = ({ label, value, onChange }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-all">
        <span className="text-zinc-300 font-bold text-xs uppercase tracking-widest">{label}</span>
        <div className="flex gap-2 mt-3 md:mt-0">
            {['BOM', 'ATENÇÃO', 'TROCAR'].map((status) => (
                <button
                    key={status}
                    onClick={() => onChange(status)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${value === status
                        ? (status === 'BOM' ? 'bg-green-600/20 border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' :
                            status === 'ATENÇÃO' ? 'bg-yellow-600/20 border-yellow-500 text-yellow-500' :
                                'bg-red-600/20 border-red-500 text-red-500')
                        : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700'
                        }`}
                >
                    {status === 'BOM' && '✓ '} {status.toUpperCase()}
                </button>
            ))}
        </div>
    </div>
);

// Função simples para normalizar placa (remover hífens e espaços, uppercase)
function normalizarPlaca(placa) {
    if (!placa) return '';
    return placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

export default function RevisaoPremium() {
    const { dadosOficina, logado, carregandoAuth } = useAuth();
    const oficinaId = dadosOficina?.id || null;

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Busca por placa
    const [placaBusca, setPlacaBusca] = useState('');
    const [clienteEncontrado, setClienteEncontrado] = useState(null);
    const [buscandoPlaca, setBuscandoPlaca] = useState(false);

    // Dados da revisão
    const [relatoMecanico, setRelatoMecanico] = useState('');
    const [pecas, setPecas] = useState('0');
    const [maoDeObra, setMaoDeObra] = useState('0');
    const [fotos, setFotos] = useState([]);
    const [nomeCliente, setNomeCliente] = useState('');
    const [telefone, setTelefone] = useState('');
    const [modelo, setModelo] = useState('');

    // Checklist Completo
    const [checklist, setChecklist] = useState({
        correias: 'BOM', velasCabos: 'BOM', fluidoRadiador: 'BOM', vazamentos: 'BOM',
        pastilhas: 'BOM', discos: 'BOM', fluidoFreio: 'BOM',
        amortecedores: 'BOM', buchasBandeja: 'BOM', bieletasTerminais: 'BOM',
        filtroCabine: 'BOM', filtroAr: 'BOM', iluminacao: 'BOM', palhetas: 'BOM'
    });

    // Agendamento de Retorno
    const [agendamentoRetorno, setAgendamentoRetorno] = useState(null); // '3m', '6m', '1y'
    const [showModalConversao, setShowModalConversao] = useState(false);
    const [dadosRevisaoSalva, setDadosRevisaoSalva] = useState(null);
    const navigate = useNavigate();

    // Buscar dados por placa no Firebase
    const buscarPorPlaca = useCallback(async (placa) => {
        if (!oficinaId || !placa || placa.length < 7) return;
        setBuscandoPlaca(true);
        try {
            const placaNorm = normalizarPlaca(placa);
            const q = query(
                collection(db, 'oficinas', oficinaId, 'os'),
                where('placa', '==', placaNorm),
                orderBy('data_registro', 'desc'),
                limit(1)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                const data = snap.docs[0].data();
                setClienteEncontrado(data);
                setNomeCliente(data.nomeCliente || data.cliente || '');
                setTelefone(data.telefone || '');
                setModelo(data.modelo || data.veiculo || '');
            } else {
                setClienteEncontrado(null);
                setNomeCliente('');
                setTelefone('');
                setModelo('');
            }
        } catch (err) {
            console.error('Erro ao buscar placa:', err);
        } finally {
            setBuscandoPlaca(false);
        }
    }, [oficinaId]);

    // Disparar busca quando placa tiver 7+ caracteres
    useEffect(() => {
        const norm = normalizarPlaca(placaBusca);
        if (norm.length >= 7) {
            const timer = setTimeout(() => buscarPorPlaca(norm), 500);
            return () => clearTimeout(timer);
        }
    }, [placaBusca, buscarPorPlaca]);

    const handleUploadFoto = async (e) => {
        const files = Array.from(e.target.files);
        if (fotos.length + files.length > 5) return alert("Máximo de 5 fotos para Revisão!");

        const novasFotos = await Promise.all(files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (ev) => {
                    const img = new Image();
                    img.src = ev.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = 800;
                        canvas.height = img.height * (800 / img.width);
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL('image/jpeg', 0.6));
                    };
                };
            });
        }));
        setFotos(prev => [...prev, ...novasFotos]);
    };

    const [isListening, setIsListening] = useState(false);
    const toggleMic = () => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return alert("Microfone não suportado no navegador atual.");
        const rec = new Recognition();
        rec.lang = 'pt-BR';
        if (isListening) { rec.stop(); setIsListening(false); }
        else {
            setIsListening(true); rec.start();
            rec.onresult = (e) => setRelatoMecanico(prev => prev + " " + e.results[0][0].transcript);
            rec.onend = () => setIsListening(false);
        }
    };

    const handleSalvar = async () => {
        if (!oficinaId) return alert("Oficina não identificada.");
        if (!normalizarPlaca(placaBusca)) return alert("Informe a placa do veículo.");

        setLoading(true);
        try {
            const vTotal = (parseFloat(pecas.replace(',', '.')) || 0) + (parseFloat(maoDeObra.replace(',', '.')) || 0);
            
            const hoje = new Date();
            let dataFutura = null;
            if (agendamentoRetorno === '3m') {
                dataFutura = new Date(hoje);
                dataFutura.setMonth(hoje.getMonth() + 3);
            } else if (agendamentoRetorno === '6m') {
                dataFutura = new Date(hoje);
                dataFutura.setMonth(hoje.getMonth() + 6);
            } else if (agendamentoRetorno === '1y') {
                dataFutura = new Date(hoje);
                dataFutura.setFullYear(hoje.getFullYear() + 1);
            }

            const dadosRevisao = {
                tipoServico: 'revisao_premium',
                placa: normalizarPlaca(placaBusca),
                nomeCliente,
                telefone,
                modelo,
                checklistRevisao: checklist,
                relatoRevisao: relatoMecanico,
                fotosRevisao: fotos,
                valorPecas: pecas,
                valorMaoObra: maoDeObra,
                totalRevisao: vTotal,
                data_criacao: serverTimestamp(),
                data_atualizacao: serverTimestamp(),
                periodoRetorno: agendamentoRetorno || null,
                dataRetorno: dataFutura ? dataFutura.toISOString() : null
            };
            // Salvar na coleção revisoes_premium
            const docRef = await addDoc(collection(db, 'oficinas', oficinaId, 'revisoes_premium'), dadosRevisao);

            // Criar agendamento de retorno se selecionado
            if (agendamentoRetorno) {
                const hoje = new Date();
                let dataFutura = new Date(hoje);
                if (agendamentoRetorno === '3m') dataFutura.setMonth(hoje.getMonth() + 3);
                else if (agendamentoRetorno === '6m') dataFutura.setMonth(hoje.getMonth() + 6);
                else if (agendamentoRetorno === '1y') dataFutura.setFullYear(hoje.getFullYear() + 1);

                await addDoc(collection(db, 'oficinas', oficinaId, 'agendamentos_retorno'), {
                    revisaoId: docRef.id,
                    placa: normalizarPlaca(placaBusca),
                    nomeCliente,
                    telefone,
                    modelo,
                    dataRevisao: serverTimestamp(),
                    dataAgendada: dataFutura.toISOString(),
                    periodo: agendamentoRetorno,
                    status: 'pendente',
                    criadoEm: serverTimestamp()
                });
            }

            setDadosRevisaoSalva({
                ...dadosRevisao,
                id: docRef.id,
                valorPecas: pecas,
                valorMaoObra: maoDeObra,
                relatoRevisao: relatoMecanico
            });
            setSuccess(true);
            // Mostrar modal de conversão após 1.5s
            setTimeout(() => {
                setSuccess(false);
                setShowModalConversao(true);
            }, 1500);
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar revisão: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmarConversaoOS = () => {
        setShowModalConversao(false);
        // Navegar para a página de O.S. com dados pré-preenchidos via state
        navigate('/admin', {
            state: {
                conversaoRevisao: true,
                dadosRevisao: dadosRevisaoSalva
            }
        });
    };

    const cancelarConversao = () => {
        setShowModalConversao(false);
        // Limpar formulário
        setPlacaBusca('');
        setNomeCliente('');
        setTelefone('');
        setModelo('');
        setRelatoMecanico('');
        setPecas('0');
        setMaoDeObra('0');
        setFotos([]);
        setChecklist({
            correias: 'BOM', velasCabos: 'BOM', fluidoRadiador: 'BOM', vazamentos: 'BOM',
            pastilhas: 'BOM', discos: 'BOM', fluidoFreio: 'BOM',
            amortecedores: 'BOM', buchasBandeja: 'BOM', bieletasTerminais: 'BOM',
            filtroCabine: 'BOM', filtroAr: 'BOM', iluminacao: 'BOM', palhetas: 'BOM'
        });
        setAgendamentoRetorno(null);
    };

    if (carregandoAuth) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!logado) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <p>Você precisa estar logado para acessar esta página.</p>
            </div>
        );
    }

    return (
        <div id="revisao-area" className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-40 relative">

            {/* HERO SECTION - REVISÃO PREMIUM */}
            <section className="mb-12 overflow-hidden rounded-[28px] border border-purple-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(147,51,234,0.15),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(147,51,234,0.1),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(147,51,234,0.35)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-purple-300">
                            <ClipboardCheck size={14} />
                            Revisão Elite 2.0
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl uppercase italic">
                            Revisão <span className="text-purple-500 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">Premium</span>.
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                            Gere laudos profissionais com fotos e checklist preventivo independente para encantar seu cliente e aumentar o ticket médio.
                        </p>
                    </div>

                    <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-purple-400/20 bg-purple-400/10 p-4 backdrop-blur text-purple-100">
                            <p className="text-xs uppercase tracking-[0.24em] opacity-80">Checklists</p>
                            <p className="mt-2 text-2xl font-black">100%</p>
                            <p className="mt-1 text-sm opacity-80">Padrão Elite de Qualidade</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 backdrop-blur text-emerald-100">
                            <p className="text-xs uppercase tracking-[0.24em] opacity-80">Conversão</p>
                            <p className="mt-2 text-2xl font-black">85%</p>
                            <p className="mt-1 text-sm opacity-80">Aprovação de Orçamentos</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Busca por Placa */}
            <div className={STYLES.card + " mb-8"}>
                <h2 className="text-purple-500 font-black mb-6 uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <Search size={14} /> Identificar Veículo (Placa)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-1">
                        <label className="text-[9px] text-zinc-500 block mb-2 font-bold uppercase">Placa do Veículo</label>
                        <input
                            value={placaBusca}
                            onChange={e => setPlacaBusca(e.target.value)}
                            placeholder="ABC1234"
                            className="bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-xl outline-none w-full text-center font-mono text-lg uppercase"
                        />
                        {buscandoPlaca && <p className="text-[10px] text-purple-400 mt-1">Buscando...</p>}
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-[9px] text-zinc-500 block mb-2 font-bold uppercase">Cliente</label>
                        <input
                            value={nomeCliente}
                            onChange={e => setNomeCliente(e.target.value)}
                            placeholder="Nome do cliente"
                            className="bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-xl outline-none w-full text-center"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-[9px] text-zinc-500 block mb-2 font-bold uppercase">Telefone</label>
                        <input
                            value={telefone}
                            onChange={e => setTelefone(e.target.value)}
                            placeholder="(00) 00000-0000"
                            className="bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-xl outline-none w-full text-center"
                        />
                    </div>
                </div>
                <div className="mb-4">
                    <label className="text-[9px] text-zinc-500 block mb-2 font-bold uppercase">Modelo do Veículo</label>
                    <input
                        value={modelo}
                        onChange={e => setModelo(e.target.value)}
                        placeholder="Ex: Fiat Pulse 2023"
                        className="bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-xl outline-none w-full text-center"
                    />
                </div>
                {clienteEncontrado && (
                    <div className="bg-green-900/20 border border-green-500/30 p-3 rounded-xl text-green-400 text-xs">
                        ✓ Cliente encontrado! Dados preenchidos automaticamente.
                    </div>
                )}
            </div>

            {/* Layout de 2 Colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUNA ESQUERDA: CHECKLIST COMPLETO */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-6 shadow-xl">
                        <h2 className="text-zinc-400 font-black mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2"><Thermometer size={14} className="text-purple-500" /> Motor & Arrefecimento</h2>
                        <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden mb-8">
                            <StatusSelector label="Correias (Dentada/Poly-V)" value={checklist.correias} onChange={v => setChecklist({ ...checklist, correias: v })} />
                            <StatusSelector label="Velas e Cabos" value={checklist.velasCabos} onChange={v => setChecklist({ ...checklist, velasCabos: v })} />
                            <StatusSelector label="Fluido do Radiador" value={checklist.fluidoRadiador} onChange={v => setChecklist({ ...checklist, fluidoRadiador: v })} />
                            <StatusSelector label="Vazamentos de Óleo/Água" value={checklist.vazamentos} onChange={v => setChecklist({ ...checklist, vazamentos: v })} />
                        </div>

                        <h2 className="text-zinc-400 font-black mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2"><Disc size={14} className="text-purple-500" /> Freios</h2>
                        <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden mb-8">
                            <StatusSelector label="Pastilhas de Freio" value={checklist.pastilhas} onChange={v => setChecklist({ ...checklist, pastilhas: v })} />
                            <StatusSelector label="Discos de Freio" value={checklist.discos} onChange={v => setChecklist({ ...checklist, discos: v })} />
                            <StatusSelector label="Fluido de Freio" value={checklist.fluidoFreio} onChange={v => setChecklist({ ...checklist, fluidoFreio: v })} />
                        </div>

                        <h2 className="text-zinc-400 font-black mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2"><Wrench size={14} className="text-purple-500" /> Suspensão & Direção</h2>
                        <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden mb-8">
                            <StatusSelector label="Amortecedores" value={checklist.amortecedores} onChange={v => setChecklist({ ...checklist, amortecedores: v })} />
                            <StatusSelector label="Buchas da Bandeja" value={checklist.buchasBandeja} onChange={v => setChecklist({ ...checklist, buchasBandeja: v })} />
                            <StatusSelector label="Bieletas / Terminais" value={checklist.bieletasTerminais} onChange={v => setChecklist({ ...checklist, bieletasTerminais: v })} />
                        </div>

                        <h2 className="text-zinc-400 font-black mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2"><Settings2 size={14} className="text-purple-500" /> Geral</h2>
                        <div className="bg-zinc-950/40 rounded-[2rem] border border-zinc-800/50 overflow-hidden">
                            <StatusSelector label="Filtro de Cabine" value={checklist.filtroCabine} onChange={v => setChecklist({ ...checklist, filtroCabine: v })} />
                            <StatusSelector label="Filtro de Ar" value={checklist.filtroAr} onChange={v => setChecklist({ ...checklist, filtroAr: v })} />
                            <StatusSelector label="Iluminação" value={checklist.iluminacao} onChange={v => setChecklist({ ...checklist, iluminacao: v })} />
                            <StatusSelector label="Palhetas" value={checklist.palhetas} onChange={v => setChecklist({ ...checklist, palhetas: v })} />
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: RELATO, VALORES E BOTÕES */}
                <div className="lg:col-span-1 space-y-6">

                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                        <label className="text-[10px] text-purple-400 font-black uppercase mb-4 flex items-center gap-2"><Mic size={14} /> Relato do Mecânico</label>
                        <textarea
                            value={relatoMecanico} onChange={e => setRelatoMecanico(e.target.value)}
                            placeholder="Ex: Cliente reclama de barulho na roda direita..."
                            className="bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 p-4 rounded-xl outline-none w-full min-h-[140px] text-sm resize-none mb-4"
                        />
                        <button
                            onClick={toggleMic}
                            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${isListening ? 'bg-red-600 border-red-500 text-white animate-pulse' : 'bg-zinc-950 hover:bg-purple-600 hover:border-purple-500 border-zinc-700 text-zinc-300 hover:text-white'}`}
                        >
                            <Mic size={18} /> {isListening ? 'Gravando...' : 'Ditar por Voz'}
                        </button>
                    </div>

                    {/* Agendamento de Retorno */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 shadow-xl mt-6">
                        <h2 className="text-purple-400 font-black mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2">
                            <Sparkles size={14} /> Agendar Próximo Contato
                        </h2>
                        <p className="text-zinc-400 text-xs mb-4">Selecione o intervalo para retorno automático:</p>
                        <div className="flex gap-3">
                            {[
                                { label: '3 Meses', value: '3m' },
                                { label: '6 Meses', value: '6m' },
                                { label: '1 Ano', value: '1y' }
                            ].map((opcao) => (
                                <button
                                    key={opcao.value}
                                    onClick={() => setAgendamentoRetorno(opcao.value)}
                                    className={`flex-1 py-3 rounded-xl text-xs font-black border transition-all ${agendamentoRetorno === opcao.value
                                        ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]'
                                        : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                                        }`}
                                >
                                    {opcao.label}
                                </button>
                            ))}
                        </div>
                        {agendamentoRetorno && (
                            <p className="text-[10px] text-green-400 mt-3 font-bold">
                                ✓ Retorno agendado para {agendamentoRetorno === '3m' ? '3 meses' : agendamentoRetorno === '6m' ? '6 meses' : '1 ano'} a partir de hoje.
                            </p>
                        )}
                    </div>

                    {/* Botão de Diagnóstico IA */}
                    <button className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-widest rounded-[1.5rem] shadow-lg flex items-center justify-center gap-2 transition-all">
                        <Sparkles size={18} className="text-yellow-300" /> GERAR DIAGNÓSTICO PARA O CLIENTE
                    </button>

                    {/* Quadro de Valores */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 shadow-xl font-mono">
                        <h2 className="text-yellow-500 font-black mb-6 uppercase text-[10px] tracking-widest">💰 Valor do Serviço</h2>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-[9px] text-zinc-500 block mb-2 font-bold uppercase">Peças (R$)</label>
                                <input value={pecas} onChange={e => setPecas(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-xl outline-none w-full text-center" />
                            </div>
                            <div>
                                <label className="text-[9px] text-zinc-500 block mb-2 font-bold uppercase">Mão de Obra (R$)</label>
                                <input id="mao-obra" value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} className="bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-xl outline-none w-full text-center" />
                            </div>
                        </div>
                        <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex items-center justify-center gap-3">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Total:</span>
                            <span className="text-2xl font-black text-green-500">R$ {(parseFloat(pecas.replace(',', '.')) + parseFloat(maoDeObra.replace(',', '.')) || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Fotos */}
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2rem] p-6 shadow-xl">
                        <h2 className="text-purple-500 font-black mb-4 uppercase text-[10px] tracking-widest flex items-center gap-2">
                            <Camera size={14} /> Fotos do Veículo ({fotos.length}/5)
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {fotos.map((f, i) => (
                                <div key={i} className="relative min-w-[100px] h-[80px] rounded-xl overflow-hidden border border-zinc-700">
                                    <img src={f} className="w-full h-full object-cover" />
                                    <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-600 p-1 rounded-full"><Trash2 size={10} /></button>
                                </div>
                            ))}
                            {fotos.length < 5 && (
                                <label className="min-w-[100px] h-[80px] rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center cursor-pointer hover:border-purple-500 bg-zinc-900/50">
                                    <Plus size={20} className="text-zinc-700" />
                                    <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* BOTÃO SALVAR */}
                    <button onClick={handleSalvar} disabled={loading} className="w-full py-6 bg-purple-600 hover:bg-purple-700 text-white font-black text-lg uppercase italic rounded-2xl shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all flex justify-center items-center gap-2">
                        {loading ? 'Processando...' : <><Save size={24} /> SALVAR REVISÃO E GERAR DIAGNÓSTICO</>}
                    </button>
                    <p className="text-center text-[9px] text-zinc-600 mt-2">Salva a revisão vinculada à placa/cliente</p>
                </div>
            </div>

            {success && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-green-600 px-6 py-4 rounded-full shadow-2xl animate-bounce flex items-center gap-3 z-[210] font-black uppercase text-xs text-white max-w-lg text-center leading-relaxed">
                    🚀 Sucesso! Este cliente foi agendado e aparecerá na sua PÁGINA INICIAL quando chegar a hora de cobrar o serviço.
                </div>
            )}

            {/* Modal de Conversão para O.S. */}
            {showModalConversao && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 text-center">
                    <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3rem] max-w-sm shadow-2xl">
                        <CheckCircle size={60} className="text-green-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tighter">Diagnóstico Salvo com Sucesso!</h2>
                        <p className="text-zinc-400 text-sm mb-10 leading-relaxed font-medium">
                            Deseja transformar esta revisão em uma Ordem de Serviço agora?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={confirmarConversaoOS}
                                className="flex-1 py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-purple-600/20 transition-all"
                            >
                                <CheckCircle size={18} /> SIM, IR PARA O.S.
                            </button>
                            <button
                                onClick={cancelarConversao}
                                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-all"
                            >
                                NÃO, FECHAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
