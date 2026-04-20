/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { sincronizarRetornosAutomaticos } from '../lib/retornos';
import {
    Mic, Save, X, CheckCircle, AlertTriangle,
    ArrowRight, Info, Camera, Plus, Trash2, Settings
} from 'lucide-react';

// ─────────────────────────────────────────────
// ESTILOS — Padrão Funilaria, cor roxa
// ─────────────────────────────────────────────
const STYLES = {
    accent: 'text-purple-500',
    buttonPurple: 'bg-purple-600 hover:bg-purple-700 text-white font-black py-5 px-8 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3',
    buttonGray: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold py-5 px-8 rounded-2xl border border-zinc-700 transition-all flex items-center justify-center gap-3',
    card: 'bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 mb-6',
    input: 'bg-zinc-900/50 border border-zinc-800 focus:border-purple-500 text-zinc-100 p-4 rounded-xl outline-none w-full transition-all',
};

// ─────────────────────────────────────────────
// StatusSelector — idêntico ao Funilaria
// ─────────────────────────────────────────────
const StatusSelector = ({ label, value, onChange }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-zinc-800/10 transition-all">
        <span className="text-zinc-300 font-medium">{label}</span>
        <div className="flex gap-2 mt-2 md:mt-0">
            {['OK', 'Atenção', 'Trocar'].map((status) => (
                <button
                    key={status}
                    onClick={() => onChange(status)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${value === status
                            ? status === 'OK'
                                ? 'bg-green-600/20 border-green-500 text-green-500'
                                : status === 'Atenção'
                                    ? 'bg-yellow-600/20 border-yellow-500 text-yellow-500'
                                    : 'bg-red-600/20 border-red-500 text-red-500'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700'
                        }`}
                >
                    {status.toUpperCase()}
                </button>
            ))}
        </div>
    </div>
);

// ─────────────────────────────────────────────
// CHECKLIST INICIAL — todas as seções
// ─────────────────────────────────────────────
const CHECKLIST_INICIAL = {
    motorEstado: 'OK',
    vazamentosOleo: 'OK',
    ruidos: 'OK',
    radiador: 'OK',
    correiaDistribuicao: 'OK',
    pastilhas: 'OK',
    discos: 'OK',
    fluidoFreio: 'OK',
    abs: 'OK',
    amortecedores: 'OK',
    buchas: 'OK',
    rolamentos: 'OK',
    direcao: 'OK',
    terminais: 'OK',
    bateria: 'OK',
    alternador: 'OK',
    luzes: 'OK',
    fusiveis: 'OK',
    escapamento: 'OK',
};

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function Mecanica({
    oficinaId,
    osParaEditar,
    onCancelar,
    onSalvo,
    setAbaAtiva,
    irParaNovaOS,
}) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [fotos, setFotos] = useState([]);
    const [isListening, setIsListening] = useState(null);

    const [pecas, setPecas] = useState('0');
    const [maoDeObra, setMaoDeObra] = useState('0');

    const [obsMotor, setObsMotor] = useState('');
    const [obsFreios, setObsFreios] = useState('');
    const [obsSuspensao, setObsSuspensao] = useState('');
    const [obsEletrica, setObsEletrica] = useState('');
    const [obsGeral, setObsGeral] = useState('');

    const [checklist, setChecklist] = useState(CHECKLIST_INICIAL);

    // ── Pré-popula ao editar ──────────────────────────────────────────
    useEffect(() => {
        if (!osParaEditar) return;
        setPecas(osParaEditar.valorPecas?.toString().replace('.', ',') || '0');
        setMaoDeObra(osParaEditar.valorMaoObra?.toString().replace('.', ',') || '0');
        setFotos(osParaEditar.fotos || []);
        const obs = osParaEditar.observacoes || {};
        setObsMotor(obs.motor || '');
        setObsFreios(obs.freios || '');
        setObsSuspensao(obs.suspensao || '');
        setObsEletrica(obs.eletrica || '');
        setObsGeral(obs.geral || '');
        if (osParaEditar.checklist) {
            setChecklist((prev) => ({ ...prev, ...osParaEditar.checklist }));
        }
    }, [osParaEditar]);

    // ── Compressão de fotos ───────────────────────────────────────────
    const handleUploadFoto = async (e) => {
        const files = Array.from(e.target.files);
        if (fotos.length + files.length > 10) { alert('Máximo de 10 fotos!'); return; }
        const novasFotos = await Promise.all(files.map(file => new Promise(resolve => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const scale = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scale;
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
        })));
        setFotos(prev => [...prev, ...novasFotos]);
    };

    // ── Microfone ─────────────────────────────────────────────────────
    const toggleMic = (campo) => {
        const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Recognition) return;
        const rec = new Recognition();
        rec.lang = 'pt-BR';
        if (isListening === campo) { rec.stop(); setIsListening(null); return; }
        setIsListening(campo);
        rec.start();
        const setMap = {
            motor: setObsMotor,
            freios: setObsFreios,
            suspensao: setObsSuspensao,
            eletrica: setObsEletrica,
            geral: setObsGeral,
        };
        rec.onresult = (e) => setMap[campo]?.(prev => prev + ' ' + e.results[0][0].transcript);
        rec.onend = () => setIsListening(null);
    };

    // ── Parsing seguro de moeda ───────────────────────────────────────
    const parseMoeda = (str) => parseFloat(String(str).replace(',', '.')) || 0;

    // ──────────────────────────────────────────────────────────────────
    // SALVAR — PADRÃO IDÊNTICO AO FUNILARIA
    // ──────────────────────────────────────────────────────────────────
    const handleSalvarTentativa = async () => {
        if (!osParaEditar) { setShowAlert(true); return; }

        setLoading(true);
        try {
            const vPecas = parseMoeda(pecas);
            const vMao = parseMoeda(maoDeObra);

            // ── Senha = 4 últimos dígitos do WhatsApp/telefone ─────────
            const telLimpo = String(
                osParaEditar.telefone || osParaEditar.whatsapp || ''
            ).replace(/\D/g, '');
            const senhaConsulta = telLimpo.length >= 4
                ? telLimpo.slice(-4)
                : osParaEditar.senhaConsulta || Math.floor(1000 + Math.random() * 9000).toString();

            // ── Chaves canônicas — mesmas que o Dashboard (ListaOS) lê ──
            const dadosMecanica = {
                veiculo: (osParaEditar.veiculo || osParaEditar.modelo || 'Veículo').trim(),
                placa: (osParaEditar.placa || '').toUpperCase().trim(),
                nomeCliente: (osParaEditar.nomeCliente || osParaEditar.cliente || '').trim(),
                senhaConsulta,
                kmAtual: Number(osParaEditar.kmAtual || osParaEditar.km) || 0,

                whatsapp: osParaEditar.whatsapp || osParaEditar.telefone || '',
                telefone: osParaEditar.telefone || osParaEditar.whatsapp || '',

                tipoServico: 'mecanica',
                valorPecas: vPecas,
                valorMaoObra: vMao,
                total: vPecas + vMao,

                // Observações como objeto — NUNCA renderizar o objeto checklist diretamente no JSX
                observacoes: {
                    motor: obsMotor.trim(),
                    freios: obsFreios.trim(),
                    suspensao: obsSuspensao.trim(),
                    eletrica: obsEletrica.trim(),
                    geral: obsGeral.trim(),
                },

                // Checklist como objeto puro (leia as chaves, não renderize o objeto inteiro)
                checklist,

                fotos,

                data_atualizacao: new Date().toISOString(),
            };

            // Remove undefined antes de enviar ao Firestore
            const payload = JSON.parse(JSON.stringify(dadosMecanica));

            console.log('📦 Mecanica — payload canônico:', payload);

            await updateDoc(doc(db, 'oficinas', oficinaId, 'os', osParaEditar.id), payload);
            await sincronizarRetornosAutomaticos({
                oficinaId,
                osId: osParaEditar.id,
                osData: payload,
                osBase: osParaEditar,
            });

            setSuccess(true);
            if (onSalvo) onSalvo();
            setTimeout(() => { if (onCancelar) onCancelar(); }, 1500);
        } catch (e) {
            console.error('❌ Erro ao salvar:', e);
            alert('Erro ao salvar: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const totalFormatado = (parseMoeda(pecas) + parseMoeda(maoDeObra)).toFixed(2);

    // ─────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="bg-black min-h-screen text-zinc-100 p-4 md:p-8 pb-32 relative">

            {/* ── MODAL DE BLOQUEIO — idêntico ao Funilaria ───────────── */}
            {showAlert && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] max-w-sm text-center shadow-2xl">
                        <div className="bg-purple-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-600/20">
                            <Info size={32} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2 uppercase italic">Atenção!</h2>
                        <div className="text-zinc-400 text-sm mb-8 space-y-4 text-left">
                            <p>Para salvar este laudo técnico, siga os passos:</p>
                            <div className="flex gap-3 items-center bg-zinc-800 p-3 rounded-xl border border-zinc-700">
                                <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                                <span>Crie a O.S. na aba <strong>Triagem</strong></span>
                            </div>
                            <div className="flex gap-3 items-center bg-zinc-800 p-3 rounded-xl border border-zinc-700">
                                <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                                <span>Clique em <strong>Editar O.S.</strong> e volte aqui</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    if (irParaNovaOS) irParaNovaOS();
                                    else if (setAbaAtiva) setAbaAtiva('os');
                                    setShowAlert(false);
                                }}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 uppercase transition-all"
                            >
                                INICIAR O.S. AGORA <ArrowRight size={18} />
                            </button>
                            <button onClick={() => setShowAlert(false)} className="py-2 text-zinc-500 text-xs hover:text-zinc-300">
                                Vou criar a O.S. depois
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto">

                {/* ── HEADER ──────────────────────────────────────────────── */}
                <div className="mb-10 flex justify-between items-center border-b border-zinc-800 pb-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-purple-600 rounded-2xl shadow-lg shadow-purple-600/20">
                            <Settings className="text-white" size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Laudo de Mecânica</h1>
                            <p className="text-zinc-500 text-sm">Inspeção completa de motor, freios, suspensão e elétrica</p>
                        </div>
                    </div>
                    <button onClick={onCancelar} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* ── FOTOS ───────────────────────────────────────────────── */}
                <div className={STYLES.card}>
                    <h2 className="text-purple-500 font-black mb-6 uppercase text-[10px] border-l-2 border-purple-500 pl-3 tracking-widest flex items-center gap-2">
                        <Camera size={14} /> Evidências do Veículo ({fotos.length}/10)
                    </h2>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {fotos.map((f, i) => (
                            <div key={i} className="relative min-w-[160px] h-[110px] rounded-2xl overflow-hidden border border-zinc-700 shadow-xl flex-shrink-0">
                                <img src={f} className="w-full h-full object-cover" alt={`foto-${i}`} />
                                <button onClick={() => setFotos(fotos.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-red-600 p-1.5 rounded-full hover:bg-red-700">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        {fotos.length < 10 && (
                            <label className="min-w-[160px] h-[110px] rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 bg-zinc-900/50 flex-shrink-0 transition-all">
                                <Plus size={28} className="text-zinc-600" />
                                <input type="file" multiple accept="image/*" onChange={handleUploadFoto} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* ── MOTOR & ARREFECIMENTO ────────────────────────────────── */}
                <div className={STYLES.card}>
                    <h2 className="text-purple-500 font-black flex items-center gap-2 mb-6 uppercase tracking-widest text-[10px] border-l-2 border-purple-500 pl-3">
                        ⚙️ Motor & Arrefecimento
                    </h2>
                    <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden mb-6">
                        <StatusSelector label="Estado geral do motor" value={checklist.motorEstado} onChange={v => setChecklist({ ...checklist, motorEstado: v })} />
                        <StatusSelector label="Vazamentos de óleo / água" value={checklist.vazamentosOleo} onChange={v => setChecklist({ ...checklist, vazamentosOleo: v })} />
                        <StatusSelector label="Ruídos / Batidas anormais" value={checklist.ruidos} onChange={v => setChecklist({ ...checklist, ruidos: v })} />
                        <StatusSelector label="Radiador / Mangueiras" value={checklist.radiador} onChange={v => setChecklist({ ...checklist, radiador: v })} />
                        <StatusSelector label="Correia de Distribuição / Tensor" value={checklist.correiaDistribuicao} onChange={v => setChecklist({ ...checklist, correiaDistribuicao: v })} />
                    </div>
                    <div className="relative">
                        <textarea value={obsMotor} onChange={e => setObsMotor(e.target.value)} placeholder="Detalhes do motor..." className={STYLES.input + ' min-h-[80px]'} />
                        <button onClick={() => toggleMic('motor')} className={`absolute right-3 bottom-3 p-2 rounded-full ${isListening === 'motor' ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`}><Mic size={16} /></button>
                    </div>
                </div>

                {/* ── FREIOS ──────────────────────────────────────────────── */}
                <div className={STYLES.card}>
                    <h2 className="text-purple-500 font-black flex items-center gap-2 mb-6 uppercase tracking-widest text-[10px] border-l-2 border-purple-500 pl-3">
                        🛑 Freios
                    </h2>
                    <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden mb-6">
                        <StatusSelector label="Pastilhas / Lonas" value={checklist.pastilhas} onChange={v => setChecklist({ ...checklist, pastilhas: v })} />
                        <StatusSelector label="Discos / Tambores" value={checklist.discos} onChange={v => setChecklist({ ...checklist, discos: v })} />
                        <StatusSelector label="Fluido de Freio" value={checklist.fluidoFreio} onChange={v => setChecklist({ ...checklist, fluidoFreio: v })} />
                        <StatusSelector label="ABS / Sensores" value={checklist.abs} onChange={v => setChecklist({ ...checklist, abs: v })} />
                    </div>
                    <div className="relative">
                        <textarea value={obsFreios} onChange={e => setObsFreios(e.target.value)} placeholder="Detalhes dos freios..." className={STYLES.input + ' min-h-[80px]'} />
                        <button onClick={() => toggleMic('freios')} className={`absolute right-3 bottom-3 p-2 rounded-full ${isListening === 'freios' ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`}><Mic size={16} /></button>
                    </div>
                </div>

                {/* ── SUSPENSÃO & DIREÇÃO ──────────────────────────────────── */}
                <div className={STYLES.card}>
                    <h2 className="text-purple-500 font-black flex items-center gap-2 mb-6 uppercase tracking-widest text-[10px] border-l-2 border-purple-500 pl-3">
                        🔩 Suspensão & Direção
                    </h2>
                    <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden mb-6">
                        <StatusSelector label="Amortecedores" value={checklist.amortecedores} onChange={v => setChecklist({ ...checklist, amortecedores: v })} />
                        <StatusSelector label="Buchas / Bandejas / Barras" value={checklist.buchas} onChange={v => setChecklist({ ...checklist, buchas: v })} />
                        <StatusSelector label="Rolamentos de Roda" value={checklist.rolamentos} onChange={v => setChecklist({ ...checklist, rolamentos: v })} />
                        <StatusSelector label="Direção (folga / alinhamento)" value={checklist.direcao} onChange={v => setChecklist({ ...checklist, direcao: v })} />
                        <StatusSelector label="Terminais / Pivôs" value={checklist.terminais} onChange={v => setChecklist({ ...checklist, terminais: v })} />
                    </div>
                    <div className="relative">
                        <textarea value={obsSuspensao} onChange={e => setObsSuspensao(e.target.value)} placeholder="Detalhes da suspensão..." className={STYLES.input + ' min-h-[80px]'} />
                        <button onClick={() => toggleMic('suspensao')} className={`absolute right-3 bottom-3 p-2 rounded-full ${isListening === 'suspensao' ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`}><Mic size={16} /></button>
                    </div>
                </div>

                {/* ── ELÉTRICA & ESCAPAMENTO ───────────────────────────────── */}
                <div className={STYLES.card}>
                    <h2 className="text-purple-500 font-black flex items-center gap-2 mb-6 uppercase tracking-widest text-[10px] border-l-2 border-purple-500 pl-3">
                        ⚡ Elétrica & Escapamento
                    </h2>
                    <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 overflow-hidden mb-6">
                        <StatusSelector label="Bateria" value={checklist.bateria} onChange={v => setChecklist({ ...checklist, bateria: v })} />
                        <StatusSelector label="Alternador / Gerador" value={checklist.alternador} onChange={v => setChecklist({ ...checklist, alternador: v })} />
                        <StatusSelector label="Luzes / Lanternas / Faróis" value={checklist.luzes} onChange={v => setChecklist({ ...checklist, luzes: v })} />
                        <StatusSelector label="Fusíveis / Relés" value={checklist.fusiveis} onChange={v => setChecklist({ ...checklist, fusiveis: v })} />
                        <StatusSelector label="Vazamento / Ruído no escapamento" value={checklist.escapamento} onChange={v => setChecklist({ ...checklist, escapamento: v })} />
                    </div>
                    <div className="relative">
                        <textarea value={obsEletrica} onChange={e => setObsEletrica(e.target.value)} placeholder="Detalhes elétricos e escapamento..." className={STYLES.input + ' min-h-[80px]'} />
                        <button onClick={() => toggleMic('eletrica')} className={`absolute right-3 bottom-3 p-2 rounded-full ${isListening === 'eletrica' ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`}><Mic size={16} /></button>
                    </div>
                </div>

                {/* ── OBSERVAÇÕES GERAIS ───────────────────────────────────── */}
                <div className={STYLES.card}>
                    <h2 className="text-purple-500 font-black flex items-center gap-2 mb-6 uppercase tracking-widest text-[10px] border-l-2 border-purple-500 pl-3">
                        📋 Observações Gerais / Pendências
                    </h2>
                    <div className="relative">
                        <textarea value={obsGeral} onChange={e => setObsGeral(e.target.value)} placeholder="Itens pendentes, recomendações ao cliente..." className={STYLES.input + ' min-h-[100px]'} />
                        <button onClick={() => toggleMic('geral')} className={`absolute right-3 bottom-3 p-2 rounded-full ${isListening === 'geral' ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`}><Mic size={16} /></button>
                    </div>
                </div>

                {/* ── ORÇAMENTO ────────────────────────────────────────────── */}
                <div className={STYLES.card}>
                    <h2 className="text-purple-500 font-black flex items-center gap-2 mb-6 uppercase tracking-widest text-[10px] border-l-2 border-purple-500 pl-3">
                        💰 Orçamento
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase">Peças (R$)</label>
                            <input value={pecas} onChange={e => setPecas(e.target.value)} inputMode="decimal" className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl outline-none text-center font-mono text-xl text-white focus:border-purple-500 transition-all" />
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 block mb-3 font-bold uppercase">Mão de Obra (R$)</label>
                            <input value={maoDeObra} onChange={e => setMaoDeObra(e.target.value)} inputMode="decimal" className="w-full p-4 bg-zinc-900 border border-zinc-800 rounded-xl outline-none text-center font-mono text-xl text-white focus:border-purple-500 transition-all" />
                        </div>
                        <div className="bg-purple-950/20 border border-purple-500/30 p-5 rounded-2xl flex flex-col items-center">
                            <span className="text-[10px] text-purple-500 font-bold mb-2 uppercase">Total Mecânica</span>
                            <span className="text-3xl font-black text-purple-500">R$ {totalFormatado}</span>
                        </div>
                    </div>
                </div>

                {/* ── BOTÃO PRINCIPAL ──────────────────────────────────────── */}
                <button
                    onClick={handleSalvarTentativa}
                    disabled={loading}
                    className={(osParaEditar ? STYLES.buttonPurple : STYLES.buttonGray) + ' w-full disabled:opacity-60'}
                >
                    {loading ? 'Sincronizando...' : (
                        osParaEditar
                            ? <><Save size={28} /> ATUALIZAR DADOS NA O.S.</>
                            : <><AlertTriangle size={24} /> 1. CRIE A O.S. → 2. CLIQUE EM EDITAR</>
                    )}
                </button>
            </div>

            {/* ── TOAST SUCESSO ────────────────────────────────────────── */}
            {success && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-green-600 px-10 py-5 rounded-full shadow-2xl animate-bounce flex items-center gap-3 z-[110] font-black uppercase">
                    <CheckCircle size={24} /> O.S. ATUALIZADA!
                </div>
            )}
        </div>
    );
}
