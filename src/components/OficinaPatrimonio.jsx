import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { 
  Package, 
  Sparkles, 
  Camera, 
  Trash2, 
  Plus, 
  Save, 
  X, 
  Wrench, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight,
  Monitor
} from 'lucide-react';

export default function OficinaPatrimonio({ oficinaId }) {
    const [equipamentoNome, setEquipamentoNome] = useState('');
    const [equipamentoFoto, setEquipamentoFoto] = useState(null);
    const [listaEquipamentos, setListaEquipamentos] = useState([]);
    const [carregando, setCarregando] = useState(false);

    const carregarEquipamentos = async () => {
        if (!oficinaId) return;
        setCarregando(true);
        try {
            const snap = await getDocs(collection(db, 'oficinas', oficinaId, 'patrimonio'));
            setListaEquipamentos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error('Erro ao carregar patrimônio:', e);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarEquipamentos();
    }, [oficinaId]);

    const comprimirFoto = (base64, qualidade = 0.5) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', qualidade));
            };
        });
    };

    const handleSalvarEquipamento = async () => {
        if (!equipamentoNome.trim()) return alert('Digite o nome do equipamento');
        if (!oficinaId) return;
        
        try {
            await addDoc(collection(db, 'oficinas', oficinaId, 'patrimonio'), {
                nome: equipamentoNome,
                foto: equipamentoFoto,
                data_registro: new Date().toISOString()
            });
            setEquipamentoNome('');
            setEquipamentoFoto(null);
            carregarEquipamentos();
        } catch (e) {
            alert('Erro ao salvar: ' + e.message);
        }
    };

    const handleDeletar = async (id) => {
        if (!window.confirm('Excluir este equipamento?')) return;
        try {
            await deleteDoc(doc(db, 'oficinas', oficinaId, 'patrimonio', id));
            carregarEquipamentos();
        } catch (e) {
            alert('Erro ao deletar: ' + e.message);
        }
    };

    const totalItens = listaEquipamentos.length;
    const comFoto = listaEquipamentos.filter(e => e.foto).length;
    const ultimaAtualizacao = useMemo(() => {
        if (listaEquipamentos.length === 0) return '-';
        const datas = listaEquipamentos.map(e => new Date(e.data_registro));
        const maisRecente = new Date(Math.max(...datas));
        return maisRecente.toLocaleDateString('pt-BR');
    }, [listaEquipamentos]);

    return (
        <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans">
            
            {/* HERO SECTION */}
            <section className="overflow-hidden rounded-[28px] border border-amber-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.15),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.1),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(245,158,11,0.35)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
                            <Sparkles size={14} />
                            Gestão de Ativos & Patrimônio
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                            Valorize cada ferramenta da sua oficina.
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                            Mantenha o inventário completo dos seus equipamentos de valor, ferramentas grandes e infraestrutura técnica.
                        </p>
                    </div>

                    <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
                        <QuickHighlight
                            label="Itens Totais"
                            value={totalItens}
                            tone="info"
                            helper="Ativos registrados"
                        />
                        <QuickHighlight
                            label="Documentados"
                            value={comFoto}
                            tone="success"
                            helper="Itens com foto"
                        />
                    </div>
                </div>
            </section>

            {/* METRIC CARDS GRID */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard 
                    title="Total de Ativos" 
                    value={totalItens} 
                    detail="Equipamentos cadastrados" 
                    icon={<Package size={20} />} 
                    tone="info" 
                />
                <MetricCard 
                    title="Fotos do Patrimônio" 
                    value={comFoto} 
                    detail={`${totalItens - comFoto} sem registro visual`} 
                    icon={<Camera size={20} />} 
                    tone="warning" 
                />
                <MetricCard 
                    title="Último Registro" 
                    value={ultimaAtualizacao} 
                    detail="Data da última inclusão" 
                    icon={<Clock size={20} />} 
                    tone="success" 
                />
                <MetricCard 
                    title="Status Geral" 
                    value="Atualizado" 
                    detail="Banco de dados em dia" 
                    icon={<ShieldCheck size={20} />} 
                    tone="info" 
                />
            </section>

            <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
                
                {/* EQUIPMENT GRID AREA */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-black text-white flex items-center gap-2">
                            <Monitor size={20} className="text-amber-500" />
                            Seu Patrimônio
                        </h3>
                    </div>

                    {carregando ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando inventário...</p>
                        </div>
                    ) : listaEquipamentos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-800 rounded-[32px] bg-slate-900/20 text-slate-500 text-center px-6">
                            <Package size={48} className="mb-4 opacity-20" />
                            <h4 className="text-lg font-bold text-slate-400">Nenhum equipamento cadastrado ainda.</h4>
                            <p className="text-sm mt-2 max-w-xs">Comece a registrar suas ferramentas e ativos de valor no formulário ao lado.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {listaEquipamentos.map(eq => (
                                <div key={eq.id} className="group relative overflow-hidden rounded-[24px] border border-slate-800 bg-slate-950/80 p-0 transition-all hover:border-amber-500/30 hover:bg-slate-900 shadow-xl shadow-slate-950/40 animate-in zoom-in-95 duration-200">
                                    <div className="relative aspect-video overflow-hidden bg-slate-900 flex items-center justify-center">
                                        {eq.foto ? (
                                            <img src={eq.foto} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={eq.nome} />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-700">
                                                <Camera size={32} />
                                                <span className="text-[10px] font-black uppercase">Sem Foto</span>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => handleDeletar(eq.id)} 
                                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-rose-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="p-4 bg-gradient-to-t from-slate-950 to-slate-950/90 border-t border-slate-800/50">
                                        <p className="text-sm font-black text-amber-500 uppercase tracking-wider truncate">{eq.nome}</p>
                                        <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                            <Clock size={10} /> Registrado em {new Date(eq.data_registro).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ADD EQUIPMENT FORM AREA */}
                <div className="lg:sticky lg:top-8 self-start">
                    <div className="rounded-[32px] border border-amber-500/20 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
                        <div className="mb-8 flex items-center gap-3">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white leading-none">Novo Ativo</h2>
                                <p className="text-slate-500 text-sm mt-1">Registre um equipamento</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <Field 
                                label="Nome do Equipamento *" 
                                value={equipamentoNome} 
                                onChange={setEquipamentoNome} 
                                placeholder="Ex: Elevador Hidráulico, Scanner..." 
                                icon={<Wrench size={16} />}
                            />

                            <div className="space-y-3">
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <Camera size={14} /> Registro Visual
                                </span>
                                
                                <div className="flex gap-3">
                                    <label className="flex-1 inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 p-6 text-xs font-black text-slate-500 hover:border-amber-500/40 hover:text-amber-400 cursor-pointer transition-all">
                                        <Camera size={20} />
                                        FOTOGRAFAR
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            capture="environment" 
                                            onChange={e => { 
                                                const r = new FileReader(); 
                                                r.onload = async () => setEquipamentoFoto(await comprimirFoto(r.result, 0.5)); 
                                                r.readAsDataURL(e.target.files[0]); 
                                            }} 
                                            className="hidden" 
                                        />
                                    </label>

                                    {equipamentoFoto && (
                                        <div className="relative w-24 h-24 rounded-2xl border border-amber-500/40 overflow-hidden shrink-0 group">
                                            <img src={equipamentoFoto} alt="Preview" className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => setEquipamentoFoto(null)} 
                                                className="absolute inset-0 bg-rose-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={handleSalvarEquipamento} 
                                className="w-full rounded-2xl bg-amber-500 py-5 font-black text-sm uppercase tracking-widest text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                <Save size={20} /> Salvar Equipamento
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// SHARED COMPONENTS

function MetricCard({ title, value, detail, icon, tone }) {
  const tones = {
    info: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    danger: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
    warning: 'border-amber-300/20 bg-amber-300/10 text-amber-100'
  };

  return (
    <div className="rounded-[24px] border border-slate-800 bg-slate-950/90 p-5 shadow-2xl shadow-slate-950/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{title}</p>
          <h3 className="mt-3 text-2xl font-black text-white">{value}</h3>
          <p className="mt-2 text-sm text-slate-400">{detail}</p>
        </div>
        <div className={`rounded-2xl border p-3 ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

function QuickHighlight({ label, value, helper, tone }) {
  const tones = {
    danger: 'border-rose-400/20 bg-rose-400/10 text-rose-100',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
    info: 'border-amber-400/20 bg-amber-400/10 text-amber-100'
  };

  return (
    <div className={`rounded-2xl border p-4 backdrop-blur ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.24em] opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm opacity-80">{helper}</p>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', icon }) {
  return (
    <label className="block space-y-2">
      <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
        {icon}{label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs text-white outline-none transition focus:border-amber-500/60 placeholder:text-slate-700"
      />
    </label>
  );
}
