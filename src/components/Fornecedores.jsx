import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { 
  Store, 
  Sparkles, 
  Plus, 
  Save, 
  X, 
  Phone, 
  MapPin, 
  Tag, 
  User, 
  MessageSquare, 
  Trash2, 
  Users, 
  Map, 
  Award,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';

export default function Fornecedores({ oficinaId, db }) {
    const [fornecedores, setFornecedores] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [busca, setBusca] = useState('');
    const [form, setForm] = useState({
        nome: '',
        telefone: '',
        especialidade: '',
        cidade: '',
        contato: '',
        obs: ''
    });

    const carregarFornecedores = async () => {
        if (!oficinaId || !db) return;
        setCarregando(true);
        try {
            const snap = await getDocs(collection(db, 'oficinas', oficinaId, 'fornecedores'));
            setFornecedores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error('Erro ao buscar fornecedores:', e);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarFornecedores();
    }, [oficinaId]);

    const handleSalvar = async () => {
        if (!form.nome) {
            alert('Nome da loja é obrigatório.');
            return;
        }
        setSalvando(true);
        try {
            await addDoc(collection(db, 'oficinas', oficinaId, 'fornecedores'), {
                ...form,
                data_registro: new Date().toISOString()
            });
            setMostrarForm(false);
            setForm({ nome: '', telefone: '', especialidade: '', cidade: '', contato: '', obs: '' });
            await carregarFornecedores();
        } catch (e) {
            alert('Erro ao salvar: ' + e.message);
        } finally {
            setSalvando(false);
        }
    };

    const handleExcluir = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) return;
        try {
            await deleteDoc(doc(db, 'oficinas', oficinaId, 'fornecedores', id));
            await carregarFornecedores();
        } catch (e) {
            alert('Erro ao excluir: ' + e.message);
        }
    };

    const fornecedoresFiltrados = useMemo(() => {
        return fornecedores.filter(f => 
            f.nome.toLowerCase().includes(busca.toLowerCase()) ||
            (f.especialidade || '').toLowerCase().includes(busca.toLowerCase()) ||
            (f.contato || '').toLowerCase().includes(busca.toLowerCase())
        );
    }, [fornecedores, busca]);

    const totalFornecedores = fornecedores.length;
    const comZap = fornecedores.filter(f => f.telefone).length;
    const cidadesCount = new Set(fornecedores.map(f => f.cidade).filter(Boolean)).size;

    return (
        <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans">
            
            {/* HERO SECTION */}
            <section className="overflow-hidden rounded-[28px] border border-orange-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.15),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.1),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(249,115,22,0.35)]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">
                            <Sparkles size={14} />
                            Gestão de Parcerias & Autopeças
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                            Conecte sua oficina aos melhores parceiros.
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                            Organize sua rede de fornecedores, autopeças e desmanches para garantir agilidade na compra de peças.
                        </p>
                    </div>

                    <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
                        <QuickHighlight
                            label="Rede Ativa"
                            value={totalFornecedores}
                            tone="info"
                            helper="Parceiros registrados"
                        />
                        <QuickHighlight
                            label="Abrangência"
                            value={cidadesCount}
                            tone="success"
                            helper="Cidades atendidas"
                        />
                    </div>
                </div>
            </section>

            {/* METRIC CARDS GRID */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard 
                    title="Fornecedores" 
                    value={totalFornecedores} 
                    detail="Total de parceiros na rede" 
                    icon={<Store size={20} />} 
                    tone="info" 
                />
                <MetricCard 
                    title="Contatos Zap" 
                    value={comZap} 
                    detail="Fornecedores com WhatsApp" 
                    icon={<MessageSquare size={20} />} 
                    tone="success" 
                />
                <MetricCard 
                    title="Cidades" 
                    value={cidadesCount} 
                    detail="Diferentes locais de origem" 
                    icon={<MapPin size={20} />} 
                    tone="warning" 
                />
                <MetricCard 
                    title="Qualificação" 
                    value="Verificada" 
                    detail="Rede de confiança ativa" 
                    icon={<Award size={20} />} 
                    tone="info" 
                />
            </section>

            <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
                
                {/* SUPPLIER LIST AREA */}
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
                        <h3 className="text-xl font-black text-white flex items-center gap-2">
                            <Users size={20} className="text-orange-500" />
                            Sua Rede de Contatos
                        </h3>
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="text" 
                                value={busca} 
                                onChange={e => setBusca(e.target.value)} 
                                placeholder="Buscar loja ou especialidade..." 
                                className="w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2 pl-10 pr-4 text-xs text-white outline-none focus:border-orange-500/50"
                            />
                        </div>
                    </div>

                    {carregando ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando rede...</p>
                        </div>
                    ) : fornecedoresFiltrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-800 rounded-[32px] bg-slate-900/20 text-slate-500 text-center px-6">
                            <Store size={48} className="mb-4 opacity-20" />
                            <h4 className="text-lg font-bold text-slate-400">Nenhum fornecedor cadastrado.</h4>
                            <p className="text-sm mt-2 max-w-xs">Adicione autopeças e lojas parceiras para facilitar sua rotina de orçamentos.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {fornecedoresFiltrados.map(f => (
                                <div key={f.id} className="group relative overflow-hidden rounded-[24px] border border-slate-800 bg-slate-950/80 p-5 transition-all hover:border-orange-500/30 hover:bg-slate-900 shadow-xl shadow-slate-950/40 animate-in zoom-in-95 duration-200">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="space-y-1">
                                            <h4 className="text-lg font-black text-white group-hover:text-orange-400 transition-colors uppercase tracking-tight">
                                                {f.nome}
                                            </h4>
                                            {f.especialidade && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-orange-500/20 bg-orange-500/5 text-orange-300">
                                                    <Tag size={10} />
                                                    {f.especialidade}
                                                </span>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => handleExcluir(f.id)} 
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="space-y-3 mb-5">
                                        {f.contato && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                <User size={14} className="text-orange-500/60" />
                                                <span className="text-slate-300">{f.contato}</span>
                                                <span className="text-slate-600 font-medium">(Vendedor)</span>
                                            </div>
                                        )}
                                        {f.cidade && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                <MapPin size={14} className="text-orange-500/60" />
                                                <span>{f.cidade}</span>
                                            </div>
                                        )}
                                        {f.obs && (
                                            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 text-[11px] leading-relaxed text-slate-500 italic">
                                                {f.obs}
                                            </div>
                                        )}
                                    </div>

                                    {f.telefone && (
                                        <a 
                                            href={`https://wa.me/55${f.telefone.replace(/\D/g, '')}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 font-black text-[11px] uppercase tracking-widest text-slate-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
                                        >
                                            <MessageSquare size={14} /> Falar no WhatsApp
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ADD SUPPLIER FORM AREA */}
                <div className="lg:sticky lg:top-8 self-start">
                    <div className="rounded-[32px] border border-orange-500/20 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
                        <div className="mb-8 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white leading-none">Novo Parceiro</h2>
                                    <p className="text-slate-500 text-sm mt-1">Cadastrar fornecedor</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setMostrarForm(!mostrarForm)}
                                className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-slate-800"
                            >
                                {mostrarForm ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>

                        <div className={`space-y-6 transition-all duration-300 ${mostrarForm ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden invisible'}`}>
                            <Field 
                                label="Nome da Loja *" 
                                value={form.nome} 
                                onChange={v => setForm({...form, nome: v})} 
                                placeholder="Ex: Autopeças Imperial..." 
                                icon={<Store size={16} />}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field 
                                    label="WhatsApp" 
                                    value={form.telefone} 
                                    onChange={v => setForm({...form, telefone: v})} 
                                    placeholder="(11) 99999-9999" 
                                    icon={<Phone size={16} />}
                                />
                                <Field 
                                    label="Contato" 
                                    value={form.contato} 
                                    onChange={v => setForm({...form, contato: v})} 
                                    placeholder="Nome do Vendedor" 
                                    icon={<User size={16} />}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field 
                                    label="Especialidade" 
                                    value={form.especialidade} 
                                    onChange={v => setForm({...form, especialidade: v})} 
                                    placeholder="Ex: Suspensão" 
                                    icon={<Tag size={16} />}
                                />
                                <Field 
                                    label="Localização" 
                                    value={form.cidade} 
                                    onChange={v => setForm({...form, cidade: v})} 
                                    placeholder="Cidade / Bairro" 
                                    icon={<MapPin size={16} />}
                                />
                            </div>

                            <div className="space-y-2">
                                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <Tag size={14} /> Observações
                                </span>
                                <textarea
                                    value={form.obs}
                                    onChange={e => setForm({...form, obs: e.target.value})}
                                    rows={3} 
                                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs text-white outline-none focus:border-orange-500/60 resize-none transition-all placeholder:text-slate-700" 
                                    placeholder="Detalhes sobre entregas, descontos..."
                                />
                            </div>

                            <button 
                                onClick={handleSalvar} 
                                disabled={salvando}
                                className="w-full rounded-2xl bg-orange-500 py-5 font-black text-sm uppercase tracking-widest text-slate-950 hover:bg-orange-400 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {salvando ? '⏳ PROCESSANDO...' : <><Save size={20} /> Salvar Fornecedor</>}
                            </button>
                        </div>
                        
                        {!mostrarForm && (
                            <div className="text-center py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                                    Formulário Oculto
                                </p>
                            </div>
                        )}
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
    warning: 'border-orange-400/20 bg-orange-400/10 text-orange-100'
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
    info: 'border-orange-400/20 bg-orange-400/10 text-orange-100'
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
        className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs text-white outline-none transition focus:border-orange-500/60 placeholder:text-slate-700"
      />
    </label>
  );
}