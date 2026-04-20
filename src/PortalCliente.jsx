import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from './lib/firebase';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { useGroq } from './hooks/useGroq';
import ChecklistViagem from './ChecklistViagem';
import AbaAjudaIA from './AbaAjudaIA';
import { ArrowLeft } from 'lucide-react';

// ==========================================
// 🔒 TRAVA DE SEGURANÇA (Limite de 5 usos da IA por dia)
// ==========================================
const verificarLimiteIA = () => {
    const hoje = new Date().toLocaleDateString();
    const limite = JSON.parse(localStorage.getItem('uso_ia_cliente') || '{"data": "", "quantidade": 0}');
    if (limite.data !== hoje) { limite.data = hoje; limite.quantidade = 0; }
    if (limite.quantidade >= 5) {
        alert("⚠️ Limite diário de 5 consultas gratuitas atingido! Volte amanhã.");
        return false;
    }
    limite.quantidade += 1;
    localStorage.setItem('uso_ia_cliente', JSON.stringify(limite));
    return true;
};

// ==========================================
// 🗜️ COMPRESSOR DE IMAGEM
// ==========================================
const comprimirImagem = (base64, maxWidth = 800, qualidade = 0.65) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
            canvas.width = Math.round(img.width * ratio);
            canvas.height = Math.round(img.height * ratio);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', qualidade));
        };
        img.onerror = () => resolve(base64);
        img.src = base64;
    });
};

// ==========================================
// 📤 MONTAR MENSAGEM WHATSAPP COM FOTOS
// ==========================================
const compartilharComFotos = (texto, fotos = []) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
    if (fotos && fotos.length > 0) {
        setTimeout(() => {
            fotos.forEach((foto, i) => {
                const src = foto?.foto || foto;
                if (!src || !src.startsWith('data:')) return;
                const janela = window.open('', `_blank`);
                if (janela) {
                    janela.document.write(`
                        <html><head><title>Foto ${i + 1} do Serviço</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;}
                        img{max-width:100%;max-height:100vh;object-fit:contain;}
                        p{color:white;text-align:center;font-family:sans-serif;font-size:12px;padding:10px;}</style>
                        </head><body>
                        <div style="text-align:center">
                          <p>📸 Foto ${i + 1} — Segure e compartilhe no WhatsApp</p>
                          <img src="${src}" />
                        </div></body></html>
                    `);
                }
            });
        }, 800);
    }
};

// ==========================================
// 🔧 HELPER: Extrai resumo legível do checklist
// ==========================================
const extrairResumoChecklist = (checklist, observacoes) => {
    if (typeof checklist === 'string' && checklist.trim()) return checklist.trim();

    if (checklist && typeof checklist === 'object') {
        const labels = {
            motorEstado: 'Motor', vazamentosOleo: 'Vazamentos', ruidos: 'Ruídos',
            radiador: 'Radiador', correiaDistribuicao: 'Correia',
            pastilhas: 'Pastilhas', discos: 'Discos', fluidoFreio: 'Fluido Freio',
            abs: 'ABS', amortecedores: 'Amortecedores', buchas: 'Buchas',
            rolamentos: 'Rolamentos', direcao: 'Direção', terminais: 'Terminais',
            bateria: 'Bateria', alternador: 'Alternador', luzes: 'Luzes',
            fusiveis: 'Fusíveis', escapamento: 'Escapamento',
            amassados: 'Amassados', oxidacao: 'Oxidação', pintura: 'Pintura',
            repintura: 'Repintura', vidros: 'Vidros', retrovisores: 'Retrovisores',
            parachoques: 'Para-choques', borrachas: 'Borrachas',
            bancos: 'Bancos', painel: 'Painel', tapetes: 'Tapetes',
            compressao: 'Compressão', injecao: 'Injeção', corrente: 'Corrente',
            pneus: 'Pneus', freioD: 'Freio Dianteiro', freioT: 'Freio Traseiro',
            garfo: 'Garfo', amortecedorT: 'Amortecedor Traseiro',
        };
        const itensProblema = Object.entries(checklist)
            .filter(([, v]) => v === 'Atenção' || v === 'Trocar')
            .map(([k, v]) => `${labels[k] || k}: ${v}`);
        if (itensProblema.length > 0) return `⚠️ ${itensProblema.join(' • ')}`;
        return '✅ Revisão Geral — Todos os itens OK';
    }

    if (observacoes && typeof observacoes === 'object') {
        const partes = Object.values(observacoes).filter(Boolean);
        if (partes.length > 0) return partes.join(' | ');
    }

    return 'Revisão Geral';
};

// ==========================================
// 🛡️ SANITIZADOR GLOBAL
// ==========================================
const safe = (valor) => {
    if (valor === null || valor === undefined) return '—';
    if (typeof valor === 'string') return valor.trim() || '—';
    if (typeof valor === 'number') return String(valor);
    if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não';
    if (Array.isArray(valor)) return valor.length ? 'Ver detalhes' : '—';
    if (typeof valor === 'object') return '—';
    return String(valor);
};

const ChecklistResumo = ({ checklist }) => {
    if (!checklist || typeof checklist !== 'object') return null;
    const labels = {
        motorEstado: 'Motor', vazamentosOleo: 'Vazamentos', ruidos: 'Ruídos',
        radiador: 'Radiador', correiaDistribuicao: 'Correia',
        pastilhas: 'Pastilhas', discos: 'Discos', fluidoFreio: 'Fluido Freio',
        abs: 'ABS', amortecedores: 'Amortecedores', buchas: 'Buchas',
        rolamentos: 'Rolamentos', direcao: 'Direção', terminais: 'Terminais',
        bateria: 'Bateria', alternador: 'Alternador', luzes: 'Luzes',
        fusiveis: 'Fusíveis', escapamento: 'Escapamento',
        amassados: 'Amassados', oxidacao: 'Oxidação', pintura: 'Pintura',
        repintura: 'Repintura', vidros: 'Vidros', retrovisores: 'Retrovisores',
        parachoques: 'Para-choques', borrachas: 'Borrachas',
        bancos: 'Bancos', painel: 'Painel', tapetes: 'Tapetes',
        compressao: 'Compressão', injecao: 'Injeção', corrente: 'Corrente',
        pneus: 'Pneus', freioD: 'Freio Dianteiro', freioT: 'Freio Traseiro',
        garfo: 'Garfo', amortecedorT: 'Amortecedor Traseiro',
    };
    const corStatus = { 'OK': 'text-green-500', 'Atenção': 'text-yellow-500', 'Trocar': 'text-red-500' };
    return (
        <div className="grid grid-cols-2 gap-2 mt-4">
            {Object.entries(checklist).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-neutral-900">
                    <span className="text-neutral-500 text-[10px]">{labels[key] || key}</span>
                    <span className={`text-[10px] font-black ${corStatus[value] || 'text-neutral-400'}`}>{value}</span>
                </div>
            ))}
        </div>
    );
};

const ObservacoesResumo = ({ observacoes }) => {
    if (!observacoes || typeof observacoes !== 'object') return null;
    const secoes = {
        motor: '⚙️ Motor', freios: '🛑 Freios', suspensao: '🔩 Suspensão',
        eletrica: '⚡ Elétrica', geral: '📋 Geral',
        funilaria: '🛠️ Funilaria', acabamento: '💎 Acabamento',
    };
    const entradas = Object.entries(secoes)
        .map(([key, label]) => ({ key, label, texto: observacoes[key] || observacoes[key.charAt(0).toUpperCase() + key.slice(1)] }))
        .filter(({ texto }) => texto && typeof texto === 'string' && texto.trim());
    if (entradas.length === 0) return null;
    return (
        <div className="space-y-3 mt-4">
            {entradas.map(({ key, label, texto }) => (
                <div key={key} className="bg-black/40 border border-neutral-900 p-4 rounded-xl">
                    <span className="text-neutral-500 text-[9px] font-black uppercase block mb-1">{label}</span>
                    <p className="text-gray-300 text-sm leading-relaxed">{texto}</p>
                </div>
            ))}
        </div>
    );
};

// --- CONFIGURAÇÃO DE TEMAS ---
const abasConfig = {
    home: { text: 'INÍCIO / LOGIN', menuStyle: 'bg-red-900/10 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.15)]', theme: { main: 'text-red-600', bg: 'bg-red-600', border: 'border-red-600', borderLight: 'border-red-900/30', bgLight: 'bg-red-900/10', textLight: 'text-red-500', shadowColor: 'rgba(220,38,38,0.44)' } },
    doutor: { text: 'DOUTOR IA (GRÁTIS)', menuStyle: 'bg-blue-900/10 border-blue-500/50 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]', theme: { main: 'text-blue-600', bg: 'bg-blue-600', border: 'border-blue-600', borderLight: 'border-blue-900/30', bgLight: 'bg-blue-900/10', textLight: 'text-blue-500', shadowColor: 'rgba(59,130,246,0.44)' } },
    scanner: { text: 'SCANNER DE LUZES', menuStyle: 'bg-yellow-900/10 border-yellow-500/50 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)]', theme: { main: 'text-yellow-500', bg: 'bg-yellow-500', border: 'border-yellow-500', borderLight: 'border-yellow-900/30', bgLight: 'bg-yellow-900/10', textLight: 'text-yellow-500', shadowColor: 'rgba(234,179,8,0.44)' } },
    calibra: { text: 'CALIBRAGEM EXATA', menuStyle: 'bg-green-900/10 border-green-500/50 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]', theme: { main: 'text-green-600', bg: 'bg-green-600', border: 'border-green-600', borderLight: 'border-green-900/30', bgLight: 'bg-green-900/10', textLight: 'text-green-500', shadowColor: 'rgba(34,197,94,0.44)' } },
    oleo: { text: 'GUIA DE ÓLEO', menuStyle: 'bg-orange-900/10 border-orange-500/50 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)]', theme: { main: 'text-orange-600', bg: 'bg-orange-600', border: 'border-orange-600', borderLight: 'border-orange-900/30', bgLight: 'bg-orange-900/10', textLight: 'text-orange-500', shadowColor: 'rgba(249,115,22,0.44)' } },
    calc: { text: 'CALCULADORA FLEX', menuStyle: 'bg-purple-900/10 border-purple-500/50 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]', theme: { main: 'text-purple-600', bg: 'bg-purple-600', border: 'border-purple-600', borderLight: 'border-purple-900/30', bgLight: 'bg-purple-900/10', textLight: 'text-purple-500', shadowColor: 'rgba(168,85,247,0.44)' } },
    dicas: { text: 'DICAS TÉCNICAS', menuStyle: 'bg-cyan-900/10 border-cyan-500/50 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]', theme: { main: 'text-cyan-600', bg: 'bg-cyan-600', border: 'border-cyan-600', borderLight: 'border-cyan-900/30', bgLight: 'bg-cyan-900/10', textLight: 'text-cyan-500', shadowColor: 'rgba(6,182,212,0.44)' } },
    ajuda: { text: '💬 FALE COM A ESPECIALISTA', menuStyle: 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:bg-red-500 animate-pulse', theme: { main: 'text-red-500', bg: 'bg-red-600', border: 'border-red-600', borderLight: 'border-red-900/30', bgLight: 'bg-red-900/10', textLight: 'text-red-500', shadowColor: 'rgba(220,38,38,0.44)' } }
};

const videosDestaque = [
    { id: 1, titulo: "COMO USAR O PORTAL", link: "https://youtube.com/shorts/Ce5GGozfVs4?feature=share", thumbnail: "https://img.youtube.com/vi/Ce5GGozfVs4/0.jpg" },
    { id: 2, titulo: "VALORIZAÇÃO DE REVENDA", link: "https://youtu.be/9TdP0avJGhs", thumbnail: "https://img.youtube.com/vi/9TdP0avJGhs/0.jpg" },
    { id: 3, titulo: "DOUTOR IA: COMO FUNCIONA", link: "https://youtube.com/shorts/6pWY8GXSKgU?feature=share", thumbnail: "https://img.youtube.com/vi/6pWY8GXSKgU/0.jpg" },
    { id: 4, titulo: "SCANNER DE PAINEL", link: "https://youtu.be/BHn2ZfSPr9Y", thumbnail: "https://img.youtube.com/vi/BHn2ZfSPr9Y/0.jpg" },
    { id: 5, titulo: "VIAGEM SEGURA", link: "https://youtube.com/shorts/xVI-DmvYcOg?feature=share", thumbnail: "https://img.youtube.com/vi/xVI-DmvYcOg/0.jpg" }
];

const DisclaimerIA = () => (
    <div className="mt-10 flex justify-center animate-fade-in">
        <p className="text-neutral-600 font-bold text-[9px] uppercase tracking-widest leading-relaxed text-center max-w-sm border-t border-neutral-900 pt-6">⚠️ Sugestões geradas por IA baseadas na internet.<br />Confirme no manual do veículo ou com um mecânico.</p>
    </div>
);

const BotaoVoltar = ({ onBack }) => (
    <button onClick={onBack} className="mb-10 text-red-500 font-black text-[10px] uppercase tracking-widest border border-red-600/50 px-8 py-3 rounded-full hover:bg-red-600 hover:text-white transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)]">
        ← VOLTAR AO MENU PRINCIPAL
    </button>
);

function Lightbox({ fotos, indiceInicial, onFechar }) {
    const [idx, setIdx] = useState(indiceInicial);
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowRight') setIdx(i => (i + 1) % fotos.length);
            if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + fotos.length) % fotos.length);
            if (e.key === 'Escape') onFechar();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [fotos.length, onFechar]);

    const foto = fotos[idx];
    const src = foto?.foto || foto;
    const legenda = foto?.legenda || '';

    return (
        <div onClick={onFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.97)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <img src={src} onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: '12px' }} alt={legenda} />
            {legenda && <p style={{ color: '#aaa', fontSize: '12px', marginTop: '12px', textAlign: 'center' }}>{legenda}</p>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }} onClick={e => e.stopPropagation()}>
                {fotos.length > 1 && (
                    <>
                        <button onClick={() => setIdx(i => (i - 1 + fotos.length) % fotos.length)} style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}>‹</button>
                        <span style={{ color: '#666', alignSelf: 'center', fontSize: '12px' }}>{idx + 1} / {fotos.length}</span>
                        <button onClick={() => setIdx(i => (i + 1) % fotos.length)} style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' }}>›</button>
                    </>
                )}
                <button onClick={onFechar} style={{ padding: '10px 20px', background: '#555', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>✕</button>
            </div>
        </div>
    );
}

function GaleriaFotos({ fotos }) {
    const [lightboxAberto, setLightboxAberto] = useState(false);
    const [indice, setIndice] = useState(0);

    if (!fotos || fotos.length === 0) return null;

    const abrirFoto = (i) => { setIndice(i); setLightboxAberto(true); };

    return (
        <div className="mt-8">
            <p className="text-neutral-500 text-[9px] font-black uppercase tracking-widest mb-4">📸 FOTOS DO SERVIÇO ({fotos.length})</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
                {fotos.map((foto, i) => {
                    const src = foto?.foto || foto;
                    const legenda = foto?.legenda || '';
                    return (
                        <div key={i} onClick={() => abrirFoto(i)} className="flex-shrink-0 cursor-pointer group">
                            <div className="w-24 h-20 rounded-xl overflow-hidden border border-neutral-800 group-hover:border-red-500 transition-all">
                                <img src={src} alt={legenda || `Foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </div>
                            {legenda && <p className="text-neutral-600 text-[8px] text-center mt-1 max-w-[96px] truncate">{legenda}</p>}
                        </div>
                    );
                })}
            </div>
            {lightboxAberto && (
                <Lightbox fotos={fotos} indiceInicial={indice} onFechar={() => setLightboxAberto(false)} />
            )}
        </div>
    );
}

// ==========================================
// 🎙️ DOUTOR IA (COM BOTÃO GIGANTE DE ÁUDIO)
// ==========================================
function DoutorIA({ theme, onBack }) {
    const { analyzeText, loading } = useGroq();
    const [pergunta, setPergunta] = useState('');
    const [carro, setCarro] = useState('');
    const [ano, setAno] = useState('');
    const [resposta, setResposta] = useState(null);
    const [gravando, setGravando] = useState(false);

    const diagnosticar = async () => {
        if (!pergunta || !carro || !ano) return alert("Preencha o veículo, o ano e o sintoma.");
        if (!verificarLimiteIA()) return;
        setResposta(null);
        try {
            const prompt = `Mecânico sênior. Carro: ${carro}. Ano: ${ano}. Sintoma: ${pergunta}. Responda APENAS em JSON estrito: {"diagnostico": "..."}`;
            const res = await analyzeText(prompt);
            const jsonMatch = res.match(/\{[\s\S]*\}/);
            if (jsonMatch) setResposta(JSON.parse(jsonMatch[0]));
        } catch (error) { console.error(error); }
    };

    const toggleGravacao = () => {
        if (gravando) {
            setGravando(false);
            setPergunta(pergunta + (pergunta ? ' ' : '') + '(Sintoma informado via áudio pelo cliente...)');
        } else {
            setGravando(true);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto text-center pb-20 px-4 mt-10 animate-fade-in">
            <BotaoVoltar onBack={onBack} />
            <h2 className="text-3xl font-black text-white uppercase mb-8">Doutor <span className={theme.main}>IA</span></h2>

            <div className="bg-[#0a0a0a] border border-neutral-800 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-transparent opacity-50`}></div>

                <div className="flex gap-4">
                    <input type="text" placeholder="VEÍCULO" value={carro} onChange={e => setCarro(e.target.value)} className="w-2/3 p-4 bg-black border border-neutral-900 rounded-xl text-white font-bold outline-none focus:border-blue-600 transition-all" />
                    <input type="text" placeholder="ANO" value={ano} onChange={e => setAno(e.target.value)} className="w-1/3 p-4 bg-black border border-neutral-900 rounded-xl text-white font-bold text-center outline-none focus:border-blue-600 transition-all" />
                </div>

                {/* 👇 O NOVO BOTÃO REDONDO DE ÁUDIO NO MEIO 👇 */}
                <div className="flex justify-center py-6">
                    <button
                        onClick={toggleGravacao}
                        className={`w-40 h-40 rounded-full flex flex-col items-center justify-center transition-all border-4 ${gravando
                                ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.6)] animate-pulse'
                                : 'bg-[#050505] border-neutral-800 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                            }`}
                    >
                        <span className="text-5xl mb-2">🎙️</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest mt-2 ${gravando ? 'text-blue-400' : 'text-neutral-500'}`}>
                            {gravando ? 'A ESCUTAR...' : 'GRAVAR ÁUDIO'}
                        </span>
                    </button>
                </div>
                {/* 👆 FIM DO BOTÃO 👆 */}

                <textarea value={pergunta} onChange={e => setPergunta(e.target.value)} placeholder="Ou digite o sintoma aqui se preferir..." className="w-full h-16 bg-black border border-neutral-800 rounded-xl p-4 text-white resize-none outline-none focus:border-blue-600 transition-all text-xs" />

                <button onClick={diagnosticar} disabled={loading || gravando} className={`w-full ${theme.bg} py-5 rounded-2xl font-black uppercase text-white hover:opacity-80 active:scale-95 transition-all shadow-lg shadow-blue-600/20 tracking-widest disabled:opacity-50`}>
                    {loading ? 'A ANALISAR...' : 'ANALISAR SINTOMA'}
                </button>
            </div>

            {resposta && <div className={`mt-8 bg-[#0a0a0a] p-8 rounded-3xl text-left text-gray-300 font-medium leading-relaxed border ${theme.borderLight} shadow-xl animate-fade-in`}>{resposta.diagnostico}</div>}
            <DisclaimerIA />
        </div>
    );
}

function ScannerLuzesIA({ carroLogado, theme, onBack }) {
    const { analyzeText, loading } = useGroq();
    const [carro, setCarro] = useState(carroLogado || '');
    const [ano, setAno] = useState('');
    const [resultado, setResultado] = useState(null);
    const [luzAtiva, setLuzAtiva] = useState(null);
    const luzes = [{ id: 'oleo', icone: '🛢️', nome: 'Óleo' }, { id: 'bat', icone: '🔋', nome: 'Bateria' }, { id: 'freio', icone: '(!)', nome: 'Freio' }, { id: 'inj', icone: '💡', nome: 'Injeção' }, { id: 'temp', icone: '🌡️', nome: 'Temp.' }, { id: 'pneu', icone: '⭕', nome: 'Pneu' }, { id: 'abs', icone: 'ABS', nome: 'ABS' }, { id: 'air', icone: '🎈', nome: 'Airbag' }];

    const analisar = async (l) => {
        if (!carro || !ano) return alert("Preencha o modelo e o ano do veículo.");
        if (!verificarLimiteIA()) return;
        setLuzAtiva(l); setResultado(null);
        try {
            const prompt = `Atue como manual do carro ${carro}, ano ${ano}. A luz de ${l.nome} acendeu no painel. Responda APENAS em JSON estrito: {"msg": "Explicação curta", "risco": "ALTO/MEDIO/BAIXO", "acao": "O que fazer"}`;
            const res = await analyzeText(prompt);
            const jsonMatch = res.match(/\{[\s\S]*\}/);
            if (jsonMatch) setResultado(JSON.parse(jsonMatch[0]));
        } catch (error) { console.error(error); }
    };

    return (
        <div className="w-full max-w-2xl mx-auto text-center animate-fade-in pb-16 px-4 mt-10">
            <BotaoVoltar onBack={onBack} />
            <h2 className="text-3xl font-black text-white uppercase mb-8 tracking-widest">Scanner <span className={theme.main}>Painel</span></h2>
            <div className="flex gap-4 mb-8">
                <input type="text" placeholder="MODELO DO SEU CARRO" value={carro} onChange={e => setCarro(e.target.value)} className="w-2/3 p-5 bg-[#0a0a0a] border border-neutral-800 rounded-2xl text-white font-bold outline-none focus:border-red-600 transition-all" />
                <input type="text" placeholder="ANO" value={ano} onChange={e => setAno(e.target.value)} className="w-1/3 p-5 bg-[#0a0a0a] border border-neutral-800 rounded-2xl text-white font-bold text-center outline-none focus:border-red-600 transition-all" />
            </div>
            <div className="grid grid-cols-4 gap-3 mb-8">
                {luzes.map(l => (
                    <button key={l.id} onClick={() => analisar(l)} style={luzAtiva?.id === l.id ? { boxShadow: `0 0 15px ${theme.shadowColor}` } : {}} className={`bg-[#0a0a0a] border p-5 rounded-2xl flex flex-col items-center transition-all ${luzAtiva?.id === l.id ? `${theme.border} ${theme.bgLight}` : `border-neutral-800 hover:${theme.border}`}`}>
                        <span className="text-3xl mb-3">{l.icone}</span>
                        <span className={`text-[9px] font-black uppercase ${luzAtiva?.id === l.id ? theme.textLight : 'text-neutral-500'}`}>{l.nome}</span>
                    </button>
                ))}
            </div>
            {loading && <p className={`${theme.main} font-black animate-pulse uppercase text-[10px]`}>Analisando sistema...</p>}
            {resultado && (
                <div className={`bg-[#0a0a0a] border ${theme.borderLight} p-8 rounded-3xl text-left shadow-2xl animate-fade-in`}>
                    <p className="text-white text-sm leading-relaxed mb-4">{resultado.msg}</p>
                    <div className="bg-black/50 p-4 rounded-xl border border-neutral-900 text-center"><p className={`${theme.textLight} font-black text-[9px] uppercase`}>AÇÃO RECOMENDADA: {resultado.acao}</p></div>
                </div>
            )}
            <DisclaimerIA />
        </div>
    );
}

function CalibragemIA({ theme, onBack }) {
    const { analyzeText, loading } = useGroq();
    const [carro, setCarro] = useState('');
    const [aro, setAro] = useState('');
    const [resultado, setResultado] = useState(null);
    const [erro, setErro] = useState('');

    const consultar = async () => {
        if (!carro || !aro) return alert("Preencha o modelo do carro e o aro do pneu.");
        if (!verificarLimiteIA()) return;
        setResultado(null); setErro('');
        try {
            const prompt = `Você é um especialista automotivo. Qual a calibragem recomendada dos pneus do ${carro} com aro ${aro}?
Responda SOMENTE em JSON válido, sem texto adicional, sem explicações:
{"vazio": "32", "cheio": "35"}
Use apenas números inteiros em libras (psi). Não use aspas extras, não adicione texto fora do JSON.`;
            const res = await analyzeText(prompt);
            const jsonMatch = res.match(/\{[^{}]*"vazio"[^{}]*"cheio"[^{}]*\}/) || res.match(/\{[^{}]*"cheio"[^{}]*"vazio"[^{}]*\}/) || res.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                parsed.vazio = String(parsed.vazio).replace(/[^0-9]/g, '') || '--';
                parsed.cheio = String(parsed.cheio).replace(/[^0-9]/g, '') || '--';
                setResultado(parsed);
            } else {
                setErro('Não foi possível obter a calibragem. Tente novamente.');
            }
        } catch (error) {
            setErro('Erro na consulta. Verifique sua conexão.');
            console.error(error);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto text-center pb-20 px-4 mt-10 animate-fade-in">
            <BotaoVoltar onBack={onBack} />
            <h2 className="text-2xl font-black text-white uppercase mb-8 tracking-widest">Pressão <span className={theme.main}>Pneus</span></h2>
            <div className="bg-[#0a0a0a] border border-neutral-800 p-8 rounded-3xl space-y-4 shadow-2xl">
                <input type="text" placeholder="MODELO (ex: Civic)" value={carro} onChange={e => setCarro(e.target.value)} className="w-full p-4 bg-black border border-neutral-900 rounded-xl text-white text-center outline-none focus:border-green-600 transition-all" />
                <input type="text" placeholder="ARO (ex: 16)" value={aro} onChange={e => setAro(e.target.value.replace(/\D/g, ''))} className="w-full p-4 bg-black border border-neutral-900 rounded-xl text-white text-center outline-none focus:border-green-600 transition-all" />
                <button onClick={consultar} disabled={loading} className={`w-full ${theme.bg} py-4 rounded-xl font-black text-white hover:opacity-80 active:scale-95 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50`}>
                    {loading ? '🔍 BUSCANDO...' : 'VER CALIBRAGEM'}
                </button>
            </div>
            {erro && <p className="mt-6 text-red-500 text-sm font-bold">{erro}</p>}
            {resultado && (
                <div className="mt-8 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-800 text-center">
                            <p className="text-neutral-500 text-[10px] font-black uppercase mb-2">VAZIO</p>
                            <p className={`${theme.textLight} font-black text-3xl`}>{resultado.vazio}</p>
                            <p className="text-neutral-600 text-[10px] font-bold mt-1">PSI / LBS</p>
                        </div>
                        <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-neutral-800 text-center">
                            <p className="text-neutral-500 text-[10px] font-black uppercase mb-2">CHEIO</p>
                            <p className={`${theme.textLight} font-black text-3xl`}>{resultado.cheio}</p>
                            <p className="text-neutral-600 text-[10px] font-bold mt-1">PSI / LBS</p>
                        </div>
                    </div>
                    <p className="text-neutral-700 text-[9px] font-bold text-center">{carro.toUpperCase()} • ARO {aro} • Valores em libras (PSI)</p>
                </div>
            )}
            <DisclaimerIA />
        </div>
    );
}

function GuiaOleoIA({ theme, onBack }) {
    const { analyzeText, loading } = useGroq();
    const [carro, setCarro] = useState('');
    const [motor, setMotor] = useState('');
    const [resultado, setResultado] = useState(null);

    const consultar = async () => {
        if (!carro || !motor) return alert("Preencha carro e motor.");
        if (!verificarLimiteIA()) return;
        setResultado(null);
        try {
            const prompt = `Carro ${carro} motor ${motor} lubrificante. Responda APENAS em JSON: {"visco": "5W30", "litros": "4.5L"}`;
            const res = await analyzeText(prompt);
            const jsonMatch = res.match(/\{[\s\S]*\}/);
            if (jsonMatch) setResultado(JSON.parse(jsonMatch[0]));
        } catch (error) { console.error(error); }
    };

    return (
        <div className="w-full max-w-lg mx-auto text-center pb-20 px-4 mt-10 animate-fade-in">
            <BotaoVoltar onBack={onBack} />
            <h2 className="text-3xl font-black text-white uppercase mb-8 tracking-widest">Guia de <span className={theme.main}>Óleo</span></h2>
            <div className="bg-[#0a0a0a] border border-neutral-800 p-8 rounded-3xl space-y-4 shadow-2xl">
                <input type="text" placeholder="CARRO" value={carro} onChange={e => setCarro(e.target.value)} className="w-full p-4 bg-black border border-neutral-800 rounded-xl text-white text-center outline-none focus:border-orange-600 transition-all" />
                <input type="text" placeholder="MOTOR" value={motor} onChange={e => setMotor(e.target.value)} className="w-full p-4 bg-black border border-neutral-800 rounded-xl text-white text-center outline-none focus:border-orange-600 transition-all" />
                <button onClick={consultar} className={`w-full ${theme.bg} py-4 rounded-xl font-black text-white uppercase hover:opacity-80 active:scale-95 transition-all shadow-lg shadow-orange-600/20`}>{loading ? 'BUSCANDO...' : 'VER ESPECIFICAÇÃO'}</button>
            </div>
            {resultado && (
                <div className={`mt-8 bg-[#0a0a0a] p-8 rounded-3xl text-left border ${theme.borderLight} shadow-2xl animate-fade-in`}>
                    <div className="mb-4"><p className="text-neutral-500 text-[9px] uppercase font-black mb-1">Viscosidade Ideal:</p><p className={`${theme.textLight} text-2xl font-black`}>{resultado.visco || resultado.Visco}</p></div>
                    <div><p className="text-neutral-500 text-[9px] uppercase font-black mb-1">Capacidade do Cárter:</p><p className="text-white text-xl font-black">{resultado.litros || resultado.Litros}</p></div>
                </div>
            )}
            <DisclaimerIA />
        </div>
    );
}

function CalculadoraFlex({ theme, onBack }) {
    const [e, setE] = useState('');
    const [g, setG] = useState('');
    const [r, setR] = useState(null);

    const calcular = () => {
        const pE = parseFloat(e.replace(',', '.'));
        const pG = parseFloat(g.replace(',', '.'));
        if (!pE || !pG) return;
        setR((pE / pG) <= 0.73 ? { t: 'VÁ DE ÁLCOOL', c: 'text-green-500' } : { t: 'VÁ DE GASOLINA', c: 'text-blue-500' });
    };

    return (
        <div className="w-full max-w-sm mx-auto text-center mt-10 px-4 animate-fade-in">
            <BotaoVoltar onBack={onBack} />
            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-widest">Calc <span className={theme.main}>Flex</span></h2>
            <div className="bg-[#0a0a0a] border border-neutral-800 p-8 rounded-[2.5rem] space-y-4 shadow-2xl">
                <input type="text" placeholder="R$ ÁLCOOL" value={e} onChange={val => setE(val.target.value)} className="w-full p-5 bg-black border border-neutral-900 rounded-2xl text-white text-center text-xl font-black outline-none focus:border-purple-600 transition-all" />
                <input type="text" placeholder="R$ GASOLINA" value={g} onChange={val => setG(val.target.value)} className="w-full p-5 bg-black border border-neutral-900 rounded-2xl text-white text-center text-xl font-black outline-none focus:border-purple-600 transition-all" />
                <button onClick={calcular} className={`w-full ${theme.bg} py-5 rounded-2xl font-black text-white uppercase hover:opacity-80 active:scale-95 transition-all shadow-lg shadow-purple-600/20`}>Calcular</button>
                {r && <p className={`text-2xl font-black mt-8 animate-bounce ${r.c}`}>{r.t}</p>}
            </div>
        </div>
    );
}

function DicasTecnicas({ theme, onBack }) {
    const dicas = [
        { t: "🌡️ ARREFECIMENTO", d: "Jamais abra o radiador com o motor quente. O vapor pode causar queimaduras graves." },
        { t: "🛢️ ÓLEO DO MOTOR", d: "Verifique o nível semanalmente com o carro frio em terreno plano." },
        { t: "🛞 PNEUS", d: "Calibre sempre a cada 15 dias com os pneus frios para economizar combustível." }
    ];
    return (
        <div className="w-full max-w-lg mx-auto text-center mt-10 pb-20 px-4 animate-fade-in">
            <BotaoVoltar onBack={onBack} />
            <h2 className="text-2xl font-black text-white mb-10 tracking-widest">Dicas <span className={theme.main}>Oficina</span></h2>
            {dicas.map((d, i) => (
                <div key={i} className="bg-[#0a0a0a] border border-neutral-800 p-8 rounded-[2rem] mb-6 text-left shadow-xl">
                    <h3 className={`${theme.main} font-black mb-3 uppercase text-xs tracking-widest`}>{d.t}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">{d.d}</p>
                </div>
            ))}
        </div>
    );
}

// ==========================================
// COMPONENTE PRINCIPAL: PORTAL DO CLIENTE
// ==========================================
export default function PortalCliente() {
    const [placa, setPlaca] = useState('');
    const [senha, setSenha] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [todasAsOs, setTodasAsOs] = useState(null);
    const [osSelecionada, setOsSelecionada] = useState(null);
    const [abaAtiva, setAbaAtiva] = useState('home');
    const navigate = useNavigate();

    const formatarDataBR = (valor) => {
        if (!valor) return '—';
        if (valor?.toDate) return valor.toDate().toLocaleDateString('pt-BR');
        const data = new Date(valor);
        return isNaN(data.getTime()) ? '—' : data.toLocaleDateString('pt-BR');
    };

    const handleEntrar = async () => {
        if (!placa || !senha) return alert("Preencha Placa e Senha.");
        setCarregando(true);
        try {
            const q = query(collectionGroup(db, "os"), where("placa", "==", placa.toUpperCase()));
            const snap = await getDocs(q);
            const list = [];
            snap.forEach(doc => {
                const d = doc.data();
                const senhaArmazenada = String(d.senhaConsulta || '').trim();
                const cel = (d.telefone || d.celular || d.whatsapp || '').replace(/\D/g, '');
                const senhaLegado = cel.slice(-4);
                const senhaDigitada = String(senha).trim();
                if (senhaArmazenada === senhaDigitada || senhaLegado === senhaDigitada) {
                    list.push({ id: doc.id, ...d });
                }
            });
            if (list.length > 0) {
                setTodasAsOs(list.sort((a, b) => (b.data_registro || b.data || '').localeCompare(a.data_registro || a.data || '')));
                setAbaAtiva('dashboard');
            } else {
                alert("Acesso negado. Dados não encontrados.");
            }
        } catch (e) {
            alert("Erro de rede. Verifique sua conexão.");
        }
        setCarregando(false);
    };

    const compartilharHistoricoCompleto = () => {
        if (!todasAsOs || todasAsOs.length === 0) return;
        let texto = `🚗 *Histórico de Manutenção*\n*Veículo:* ${placa}\n\n`;
        todasAsOs.forEach(os => {
            const resumoServico = extrairResumoChecklist(os.checklist, os.observacoes);
            texto += `📅 *Data:* ${formatarDataBR(os.data_registro || os.data)}\n`;
            texto += `🛠️ *Serviço:* ${resumoServico}\n`;
            texto += `💰 *Valor:* R$ ${os.total || '0'}\n`;
            if (os.fotos && os.fotos.length > 0) texto += `📸 *Fotos:* ${os.fotos.length} foto(s) no laudo\n`;
            texto += `---\n`;
        });
        const todasFotos = todasAsOs.flatMap(os => os.fotos || []);
        compartilharComFotos(texto, todasFotos);
    };

    const compartilharOsEspecifica = () => {
        if (!osSelecionada) return;
        const fotos = osSelecionada.fotos || [];
        const resumoServico = extrairResumoChecklist(osSelecionada.checklist, osSelecionada.observacoes);
        let texto = `🚗 *Laudo Técnico*\n`;
        texto += `*Veículo:* ${osSelecionada.veiculo || placa}\n`;
        texto += `*Placa:* ${osSelecionada.placa || placa}\n`;
        texto += `*Data:* ${formatarDataBR(osSelecionada.data_registro || osSelecionada.data)}\n\n`;
        texto += `🛠️ *Serviços:*\n${resumoServico}\n\n`;
        if (osSelecionada.detalhesPecas) texto += `📦 *Peças:* ${osSelecionada.detalhesPecas}\n\n`;
        texto += `💰 *Total:* R$ ${osSelecionada.total || '0'}`;
        if (fotos.length > 0) texto += `\n📸 *${fotos.length} foto(s) do serviço serão abertas em seguida*`;
        compartilharComFotos(texto, fotos);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
            {/* HEADER */}
            <header className="w-full px-8 py-5 flex justify-between items-center border-b border-neutral-900 sticky top-0 bg-[#050505] z-50 font-black">
                <h1 className="text-xl font-black text-red-600 tracking-[0.3em] uppercase cursor-pointer" onClick={() => window.location.reload()}>🔧 OFICINA IA</h1>
                <button onClick={() => navigate('/login-admin')} className="bg-[#eab308] text-black px-6 py-2 rounded-lg text-[10px] uppercase shadow-lg shadow-yellow-600/20 hover:scale-105 transition-all">🏢 ÁREA ADMIN</button>
            </header>

            <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-[#050505]">

                {/* TELA 1: LOGIN E FERRAMENTAS */}
                {!todasAsOs && abaAtiva === 'home' && (
                    <div className="max-w-[600px] mx-auto text-center mt-6 animate-fade-in flex flex-col items-center">
                        <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tighter">PORTAL <span className="text-red-600 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">CLIENTE</span></h1>
                        <p className="text-neutral-600 text-[10px] mb-8 uppercase tracking-widest leading-relaxed">Acesse seu histórico completo de manutenção</p>
                        <div className="bg-[#080808] border border-red-900/30 p-8 md:p-12 rounded-[3rem] space-y-6 shadow-[0_0_30px_rgba(220,38,38,0.15)] relative w-full max-w-[420px]">
                            <div className="text-left">
                                <label className="text-red-600 text-[9px] font-black uppercase tracking-widest mb-3 block ml-2">Placa do Carro</label>
                                <input type="text" placeholder="ABC-1234" value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} className="w-full p-5 bg-black border border-neutral-800 rounded-2xl text-center text-xl font-black text-white outline-none focus:border-red-600 transition-all" />
                            </div>
                            <div className="text-left">
                                <label className="text-red-600 text-[9px] font-black uppercase tracking-widest mb-3 block ml-2">Senha (4 últimos dígitos do WhatsApp)</label>
                                <input type="password" placeholder="••••" value={senha} onChange={e => setSenha(e.target.value)} className="w-full p-5 bg-black border border-neutral-800 rounded-2xl text-center text-4xl font-black text-white outline-none focus:border-red-600 transition-all tracking-[0.4em]" />
                            </div>
                            <button onClick={handleEntrar} className="w-full bg-red-600 py-6 rounded-2xl font-black text-white uppercase text-xs shadow-[0_0_15px_rgba(220,38,38,0.3)] active:scale-95 transition-all hover:bg-red-500">
                                {carregando ? 'ENTRANDO...' : 'ACESSAR AGORA'}
                            </button>
                        </div>
                        <a href="https://youtu.be/u5ufl4IrzlA" target="_blank" rel="noopener noreferrer" className="mt-8 mb-10 flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest border border-red-600/30 px-6 py-3 rounded-full hover:bg-red-600 hover:text-white transition-all">🎬 COMO USAR O PORTAL</a>

                        <div className="w-full mt-6 mb-10">
                            <p className="text-neutral-600 text-[9px] font-black uppercase mb-4 tracking-widest text-center">📺 Dicas para valorizar seu veículo</p>
                            <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
                                {videosDestaque.map((vid) => (
                                    <a key={vid.id} href={vid.link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 w-40 group">
                                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-neutral-800 group-hover:border-red-600 transition-all shadow-lg bg-black">
                                            <img src={vid.thumbnail} alt={vid.titulo} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-2xl drop-shadow-md">▶️</span>
                                            </div>
                                        </div>
                                        <p className="text-[8px] font-black uppercase mt-3 text-neutral-500 group-hover:text-red-500 transition-colors text-center leading-tight">
                                            {vid.titulo}
                                        </p>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="w-full mt-4 border-t border-neutral-900 pt-8">
                            <p className="text-neutral-600 text-[9px] font-black uppercase mb-6 tracking-widest text-center">Ou acesse as Ferramentas de IA</p>

                            {/* 👇 NOVO BOTÃO DA ESPECIALISTA CENTRALIZADO 👇 */}
                            <div className="flex justify-center mb-8">
                                <button
                                    onClick={() => { setAbaAtiva('ajuda'); window.scrollTo(0, 0); }}
                                    className="flex items-center gap-3 px-8 py-4 bg-[#1a0000] border-2 border-red-500 rounded-full text-red-500 hover:text-white font-black text-[10px] md:text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] hover:bg-red-600 transition-all hover:scale-105"
                                >
                                    <span className="text-2xl">👩‍🔧</span> FALE COM A ESPECIALISTA
                                </button>
                            </div>
                            {/* 👆 FIM DO BOTÃO DA ESPECIALISTA 👆 */}

                            {/* GRADE COM O RESTO DAS FERRAMENTAS */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(abasConfig).filter(([id]) => id !== 'home' && id !== 'ajuda').map(([id, config]) => (
                                    <button key={id} onClick={() => { setAbaAtiva(id); window.scrollTo(0, 0); }} className={`w-full py-6 px-4 rounded-2xl font-black text-[10px] uppercase transition-all border bg-[#0a0a0a] hover:scale-[1.03] shadow-lg ${config.menuStyle}`}>
                                        {config.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* FERRAMENTAS PARA NÃO LOGADOS */}
                {!todasAsOs && abaAtiva === 'doutor' && <DoutorIA theme={abasConfig.doutor.theme} onBack={() => { setAbaAtiva('home'); window.scrollTo(0, 0); }} />}
                {!todasAsOs && abaAtiva === 'scanner' && <ScannerLuzesIA theme={abasConfig.scanner.theme} carroLogado={placa} onBack={() => { setAbaAtiva('home'); window.scrollTo(0, 0); }} />}
                {!todasAsOs && abaAtiva === 'calibra' && <CalibragemIA theme={abasConfig.calibra.theme} onBack={() => { setAbaAtiva('home'); window.scrollTo(0, 0); }} />}
                {!todasAsOs && abaAtiva === 'oleo' && <GuiaOleoIA theme={abasConfig.oleo.theme} onBack={() => { setAbaAtiva('home'); window.scrollTo(0, 0); }} />}
                {!todasAsOs && abaAtiva === 'calc' && <CalculadoraFlex theme={abasConfig.calc.theme} onBack={() => { setAbaAtiva('home'); window.scrollTo(0, 0); }} />}
                {!todasAsOs && abaAtiva === 'dicas' && <DicasTecnicas theme={abasConfig.dicas.theme} onBack={() => { setAbaAtiva('home'); window.scrollTo(0, 0); }} />}
                {!todasAsOs && abaAtiva === 'ajuda' && <AbaAjudaIA theme={abasConfig.ajuda.theme} onBack={() => { setAbaAtiva('home'); window.scrollTo(0, 0); }} />}

                {/* TELA 2: DASHBOARD DO CLIENTE LOGADO */}
                {todasAsOs && (
                    <div className="max-w-4xl mx-auto w-full pb-20 animate-fade-in">

                        {/* LISTA DE OS */}
                        {!osSelecionada && abaAtiva === 'dashboard' && (
                            <>
                                <div className="mb-12 px-8 py-8 bg-neutral-900/30 rounded-[2.5rem] border border-neutral-800 text-center shadow-inner flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="text-center md:text-left">
                                        <p className="text-green-500 text-[10px] font-black uppercase mb-1 tracking-widest">Painel do Veículo:</p>
                                        <p className="text-4xl font-black text-white uppercase tracking-wider">{placa}</p>
                                    </div>
                                    <div className="text-right max-w-xs">
                                        <p className="text-neutral-400 text-[10px] uppercase font-black tracking-widest leading-relaxed">HISTÓRICO TRANSPARENTE — VALORIZE SEU VEÍCULO NA REVENDA.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
                                    <button onClick={() => setAbaAtiva('rastreamento')} className="flex flex-col items-center justify-center p-8 bg-[#0a0a0a] border border-[#a855f7] rounded-[2rem] hover:bg-[#a855f7]/10 transition-all shadow-[0_0_20px_rgba(168,85,247,0.15)] group">
                                        <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📍</span>
                                        <span className="text-[#a855f7] font-black uppercase tracking-widest text-xs">Rastrear Serviço</span>
                                        <span className="text-neutral-500 text-[9px] mt-2 text-center uppercase">Acompanhe a sua OS em tempo real</span>
                                    </button>
                                    <button onClick={() => setAbaAtiva('checklist')} className="flex flex-col items-center justify-center p-8 bg-[#0a0a0a] border border-green-500 rounded-[2rem] hover:bg-green-500/10 transition-all shadow-[0_0_20px_rgba(34,197,94,0.15)] group">
                                        <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">🛡️</span>
                                        <span className="text-green-500 font-black uppercase tracking-widest text-xs">Viagem Segura</span>
                                        <span className="text-neutral-500 text-[9px] mt-2 text-center uppercase">Faça o checklist antes de pegar a estrada</span>
                                    </button>
                                </div>

                                <div className="border-t border-neutral-900 pt-12">
                                    <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 gap-4">
                                        <div className="text-center md:text-left">
                                            <h2 className="text-3xl font-black uppercase tracking-widest">Histórico <span className="text-red-600">do Carro</span></h2>
                                            <p className="text-neutral-600 text-[10px] font-black uppercase tracking-widest mt-2">{todasAsOs.length} serviço(s) registrado(s)</p>
                                        </div>
                                        <button onClick={compartilharHistoricoCompleto} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-[#25D366]/10 text-[#25D366] px-6 py-3 rounded-xl hover:bg-[#25D366]/20 transition-all border border-[#25D366]/30">
                                            📱 ENVIAR TUDO (WHATSAPP)
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {todasAsOs.map(os => (
                                            <div key={os.id} onClick={() => setOsSelecionada(os)} className="bg-[#0a0a0a] border border-neutral-800 p-8 md:p-10 rounded-[2.5rem] hover:border-red-600 transition-all group cursor-pointer shadow-xl relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-4 bg-red-600/10 text-red-500 font-black text-[8px] rounded-bl-xl uppercase tracking-widest">VER LAUDO</div>

                                                <p className="text-white font-black text-lg md:text-xl mb-4 pr-20 uppercase leading-relaxed group-hover:text-red-500 transition-colors line-clamp-2">
                                                    {extrairResumoChecklist(os.checklist, os.observacoes)}
                                                </p>

                                                {os.fotos && os.fotos.length > 0 && (
                                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                                                        {os.fotos.slice(0, 4).map((foto, i) => {
                                                            const src = foto?.foto || foto;
                                                            return (
                                                                <img
                                                                    key={i}
                                                                    src={src}
                                                                    alt={`foto ${i + 1}`}
                                                                    onClick={e => e.stopPropagation()}
                                                                    className="w-16 h-12 object-cover rounded-lg border border-neutral-700 flex-shrink-0"
                                                                />
                                                            );
                                                        })}
                                                        {os.fotos.length > 4 && (
                                                            <div className="w-16 h-12 rounded-lg border border-neutral-700 flex-shrink-0 bg-neutral-900 flex items-center justify-center">
                                                                <span className="text-neutral-400 text-[10px] font-bold">+{os.fotos.length - 4}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center border-t border-neutral-900 pt-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-neutral-600 text-[9px] font-black uppercase mb-1">DATA</span>
                                                        <span className="text-white font-bold">{formatarDataBR(os.data_registro || os.data)}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-neutral-600 text-[9px] font-black uppercase block mb-1">VALOR INVESTIDO</span>
                                                        <p className="text-green-500 font-black text-xl md:text-2xl tracking-tighter">R$ {safe(os.total)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-16 text-center border-t border-neutral-900 pt-8">
                                    <button onClick={() => window.location.reload()} className="text-neutral-600 font-black text-xs uppercase hover:text-red-500 transition-all">← SAIR DA CONTA</button>
                                </div>
                            </>
                        )}

                        {/* DETALHE DE UMA OS ESPECÍFICA */}
                        {abaAtiva === 'dashboard' && osSelecionada && (
                            <div className="animate-fade-in">
                                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                                    <button onClick={() => setOsSelecionada(null)} className="text-red-600 font-black text-[10px] uppercase tracking-widest border border-red-600/50 px-8 py-3 rounded-full hover:bg-red-600 hover:text-white transition-all w-full sm:w-auto text-center">
                                        ← VOLTAR AO HISTÓRICO
                                    </button>
                                    <button onClick={compartilharOsEspecifica} className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest bg-[#25D366]/10 text-[#25D366] px-8 py-3 rounded-full hover:bg-[#25D366]/20 transition-all border border-[#25D366]/30 w-full sm:w-auto">
                                        📱 ENVIAR LAUDO (WHATSAPP)
                                    </button>
                                </div>

                                <div className="bg-[#0a0a0a] border border-neutral-800 p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-transparent opacity-50"></div>

                                    <h2 className="text-white text-xl font-black uppercase mb-2 border-b border-neutral-900 pb-6">
                                        Laudo Técnico
                                    </h2>
                                    <p className="text-neutral-600 text-[10px] font-black uppercase mb-6">
                                        {formatarDataBR(osSelecionada.data_registro || osSelecionada.data)}
                                        {osSelecionada.veiculo ? ` • ${osSelecionada.veiculo}` : osSelecionada.modelo ? ` • ${osSelecionada.modelo}` : ''}
                                    </p>

                                    {typeof osSelecionada.checklist === 'string' && osSelecionada.checklist.trim() ? (
                                        <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-line mb-8">
                                            {osSelecionada.checklist}
                                        </p>
                                    ) : typeof osSelecionada.checklist === 'object' && osSelecionada.checklist ? (
                                        <div className="mb-8">
                                            <p className="text-neutral-500 text-[9px] font-black uppercase mb-3 tracking-widest">🔍 INSPEÇÃO REALIZADA</p>
                                            <ChecklistResumo checklist={osSelecionada.checklist} />
                                        </div>
                                    ) : (
                                        <p className="text-gray-300 text-sm mb-8">Revisão Geral</p>
                                    )}

                                    {osSelecionada.observacoes && typeof osSelecionada.observacoes === 'object' && (
                                        <div className="mb-8">
                                            <p className="text-neutral-500 text-[9px] font-black uppercase mb-3 tracking-widest">📋 OBSERVAÇÕES DO TÉCNICO</p>
                                            <ObservacoesResumo observacoes={osSelecionada.observacoes} />
                                        </div>
                                    )}

                                    {/* Peças utilizadas */}
                                    {osSelecionada.detalhesPecas && (
                                        <div className="bg-black/40 border border-neutral-900 p-6 rounded-2xl mb-8">
                                            <p className="text-neutral-500 text-[9px] font-black uppercase mb-2 tracking-widest">📦 PEÇAS / DIAGNÓSTICO</p>
                                            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{osSelecionada.detalhesPecas}</p>
                                        </div>
                                    )}

                                    {/* ── GALERIA COMPLETA DAS FOTOS ── */}
                                    <GaleriaFotos fotos={osSelecionada.fotos} />

                                    {/* KM */}
                                    {osSelecionada.kmAtual ? (
                                        <div className="mt-8 flex gap-4">
                                            <div className="flex-1 bg-black/40 border border-neutral-900 p-4 rounded-xl text-center">
                                                <p className="text-neutral-600 text-[9px] font-black uppercase mb-1">KM ATUAL</p>
                                                <p className="text-yellow-400 font-black text-lg">{Number(osSelecionada.kmAtual).toLocaleString()} km</p>
                                            </div>
                                            {osSelecionada.kmProxima && (
                                                <div className="flex-1 bg-black/40 border border-neutral-900 p-4 rounded-xl text-center">
                                                    <p className="text-neutral-600 text-[9px] font-black uppercase mb-1">PRÓXIMA TROCA</p>
                                                    <p className="text-green-400 font-black text-lg">{Number(osSelecionada.kmProxima).toLocaleString()} km</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}

                                    {/* Total */}
                                    <div className="text-center pt-10 border-t border-neutral-900 mt-8">
                                        <p className="text-neutral-500 text-[10px] font-black uppercase mb-2 tracking-widest">INVESTIMENTO TOTAL NA MANUTENÇÃO</p>
                                        <p className="text-green-500 font-black text-5xl tracking-tighter">R$ {safe(osSelecionada.total)}</p>
                                        {osSelecionada.statusPagamento === 'pago' && (
                                            <span className="inline-block mt-3 bg-green-500/10 text-green-500 border border-green-500/30 px-4 py-1 rounded-full text-[10px] font-black uppercase">✅ PAGO</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* RASTREAMENTO */}
                        {abaAtiva === 'rastreamento' && (
                            <div className="animate-fade-in">
                                <div className="flex justify-between items-center mb-8 border-b border-neutral-900 pb-6">
                                    <h2 className="text-2xl font-black uppercase tracking-widest text-[#a855f7]">Rastreamento</h2>
                                    <button onClick={() => setAbaAtiva('dashboard')} className="text-neutral-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all px-4 py-2 border border-neutral-800 rounded-lg">FECHAR ✖</button>
                                </div>
                                <ChecklistViagem osId={todasAsOs[0]?.id} statusInicial={todasAsOs[0]?.statusRastreamento || 1} isAdmin={false} modo="rastreamento" />
                            </div>
                        )}

                        {/* CHECKLIST VIAGEM */}
                        {abaAtiva === 'checklist' && (
                            <div className="animate-fade-in">
                                <div className="flex justify-between items-center mb-8 border-b border-neutral-900 pb-6">
                                    <h2 className="text-2xl font-black uppercase tracking-widest text-green-500">Viagem Segura</h2>
                                    <button onClick={() => setAbaAtiva('dashboard')} className="text-neutral-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all px-4 py-2 border border-neutral-800 rounded-lg">FECHAR ✖</button>
                                </div>
                                <ChecklistViagem osId={todasAsOs[0]?.id} statusInicial={todasAsOs[0]?.statusRastreamento || 1} isAdmin={false} modo="checklist" />
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}