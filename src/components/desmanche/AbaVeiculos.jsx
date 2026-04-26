import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { uploadImages } from './uploadImage';
import { 
  Car, 
  MapPin, 
  Tag, 
  Key, 
  Info, 
  Package, 
  DollarSign, 
  CheckCircle, 
  Edit2, 
  Trash2, 
  Megaphone,
  Plus,
  Mic,
  X,
  Save,
  Image as ImageIcon
} from 'lucide-react';

const COR = '#ef4444';
const VERDE = '#10b981';

const statusCor = {
  em_desmonte: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  desmontado: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  encerrado: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
};

const PATIOS = ['Todos', 'Pátio 1', 'Pátio 2', 'Pátio 3', 'Pátio 4', 'Pátio 5'];

export default function AbaVeiculos({
  db,
  oficinaId,
  veiculos,
  pecas,
  onReload,
  onAbrirLightbox,
  onPublicarChegada,
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [patioFiltro, setPatioFiltro] = useState('Todos');
  const [ouvindo, setOuvindo] = useState(false);

  const formInicial = {
    modelo: '', ano: '', cor: '', placa: '',
    valorLeilao: '', procedencia: '', patio: '',
    detalhes: '', fotos: [], status: 'em_desmonte',
  };
  const [form, setForm] = useState(formInicial);

  const veiculosFiltrados = veiculos.filter(v =>
    patioFiltro === 'Todos' || v.patio === patioFiltro
  );

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const urls = await uploadImages(files, oficinaId, 'desmanche');
    setForm(prev => ({ ...prev, fotos: [...prev.fotos, ...urls] }));
  };

  const iniciarVoz = (fieldKey) => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
      return alert('Use o Chrome para reconhecimento de voz.');
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = 'pt-BR';
    rec.onstart = () => setOuvindo(true);
    rec.onresult = e => setForm(prev => ({
      ...prev,
      [fieldKey]: (prev[fieldKey] || '') + ' ' + e.results[0][0].transcript,
    }));
    rec.onend = () => setOuvindo(false);
    rec.start();
  };

  const salvar = async () => {
    if (!form.modelo.trim()) return alert('⚠️ Preencha o modelo do veículo!');
    setSalvando(true);
    try {
      const dados = { ...form, data_entrada: new Date().toISOString() };
      if (editando) {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_veiculos', editando), dados);
      } else {
        await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_veiculos'), {
          ...dados, data_registro: new Date().toISOString(),
        });
      }
      setForm(formInicial);
      setEditando(null);
      setMostrarForm(false);
      if (onReload) onReload();
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvando(false); }
  };

  const editar = (v) => {
    setForm({
      modelo: v.modelo || '', ano: v.ano || '', cor: v.cor || '',
      placa: v.placa || '', valorLeilao: v.valorLeilao || '',
      procedencia: v.procedencia || '', patio: v.patio || '',
      detalhes: v.detalhes || '', fotos: v.fotos || [],
      status: v.status || 'em_desmonte',
    });
    setEditando(v.id);
    setMostrarForm(true);
  };

  const excluir = async (id) => {
    if (!window.confirm('Excluir este veículo do desmanche?')) return;
    try {
      await deleteDoc(doc(db, 'oficinas', oficinaId, 'desmanche_veiculos', id));
      if (onReload) onReload();
    } catch (e) { alert('Erro: ' + e.message); }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <div className="space-y-6">
      {/* FILTERS & ACTION BAR */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {PATIOS.map(p => (
            <button 
              key={p} 
              onClick={() => setPatioFiltro(p)} 
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${patioFiltro === p ? 'bg-orange-500 border-orange-400 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <button 
          onClick={() => { setForm(formInicial); setEditando(null); setMostrarForm(true); }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-6 py-3 font-black text-sm text-white shadow-lg shadow-rose-500/20 hover:bg-rose-400 transition-all active:scale-95"
        >
          <Plus size={18} />
          Novo Veículo
        </button>
      </div>

      {/* EMPTY STATE */}
      {veiculosFiltrados.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-[32px] bg-slate-900/20">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-600">
            <Car size={32} />
          </div>
          <p className="text-slate-500 font-medium">Nenhum veículo cadastrado neste pátio.</p>
        </div>
      )}

      {/* VEHICLE CARDS */}
      <div className="grid gap-4">
        {veiculosFiltrados.map(carro => {
          const pecasDoCarro = pecas.filter(p => p.veiculoId === carro.id);
          const pecasDispCarro = pecasDoCarro.filter(p => p.status === 'disponivel').length;
          const pecasVendCarro = pecasDoCarro.filter(p => p.status === 'vendida').length;
          const receitaCarro = pecasDoCarro.filter(p => p.status === 'vendida').reduce((s, p) => s + (Number(p.preco) || 0), 0);
          
          return (
            <div key={carro.id} className="group relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950/90 p-6 transition-all hover:border-rose-500/30 hover:bg-slate-900/80 shadow-2xl shadow-slate-950/40">
              <div className="flex flex-col gap-6 lg:flex-row">
                {/* Vehicle Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h4 className="text-xl font-black text-white">{carro.modelo} <span className="text-slate-500 font-bold">{carro.ano}</span></h4>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusCor[carro.status] || statusCor.em_desmonte}`}>
                      {carro.status?.replace('_', ' ')}
                    </span>
                    {carro.publicado && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                        <CheckCircle size={10} /> PUBLICADO
                      </span>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoRow icon={<Tag size={14} />} label="Cor" value={carro.cor} />
                    <InfoRow icon={<MapPin size={14} />} label="Pátio" value={carro.patio} />
                    <InfoRow icon={<Key size={14} />} label="Placa" value={carro.placa} />
                    <InfoRow icon={<DollarSign size={14} />} label="Leilão" value={formatCurrency(carro.valorLeilao)} tone="danger" />
                    <InfoRow icon={<Info size={14} />} label="Procedência" value={carro.procedencia} />
                  </div>

                  {carro.detalhes && (
                    <p className="text-sm text-slate-400 italic bg-slate-900/50 p-3 rounded-2xl border border-slate-800/50">
                      " {carro.detalhes} "
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge icon={<Settings size={12} />} label={`${pecasDispCarro} disponíveis`} tone="warning" />
                    <Badge icon={<Plus size={12} />} label={`Receita: ${formatCurrency(receitaCarro)}`} tone="success" />
                    <Badge icon={<CheckCircle size={12} />} label={`${pecasVendCarro} vendidas`} tone="info" />
                  </div>
                </div>

                {/* Photos */}
                {(carro.fotos || []).length > 0 && (
                  <div className="flex gap-2 overflow-x-auto lg:max-w-[280px] scrollbar-hide pb-2">
                    {carro.fotos.slice(0, 4).map((f, i) => (
                      <div key={i} className="relative flex-shrink-0 group/img">
                        <img 
                          src={f} 
                          alt="foto" 
                          onClick={() => onAbrirLightbox?.(carro.fotos, i)}
                          className="w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-2xl border border-slate-800 cursor-pointer transition hover:scale-105" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-800/50">
                <button 
                  onClick={() => editar(carro)} 
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400 transition hover:border-slate-600 hover:text-white"
                >
                  <Edit2 size={14} /> Editar
                </button>
                <button 
                  onClick={() => onPublicarChegada?.(carro)}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/5"
                >
                  <Megaphone size={14} /> Avisar Parceiros
                </button>
                <div className="flex-1" />
                <button 
                  onClick={() => excluir(carro.id)}
                  className="p-2 rounded-xl border border-rose-500/10 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-400 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FORM MODAL */}
      {mostrarForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  {editando ? <Edit2 className="text-rose-500" /> : <Car className="text-rose-500" />}
                  {editando ? 'Editar Veículo' : 'Novo Veículo'}
                </h3>
                <p className="text-slate-500 text-sm mt-1">Preencha os dados do desmonte</p>
              </div>
              <button 
                onClick={() => setMostrarForm(false)} 
                className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6 scrollbar-hide">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field label="Modelo do Veículo *" value={form.modelo} onChange={val => setForm(p => ({ ...p, modelo: val }))} placeholder="Ex: VW Golf 2018" />
                </div>
                <Field label="Ano" value={form.ano} onChange={val => setForm(p => ({ ...p, ano: val }))} placeholder="Ex: 2018/2019" />
                <Field label="Cor" value={form.cor} onChange={val => setForm(p => ({ ...p, cor: val }))} placeholder="Ex: Branco" />
                <Field label="Placa" value={form.placa} onChange={val => setForm(p => ({ ...p, placa: val }))} placeholder="ABC-1234" />
                <Field label="Valor Leilão (R$)" type="number" value={form.valorLeilao} onChange={val => setForm(p => ({ ...p, valorLeilao: val }))} placeholder="0,00" />
                <Field label="Procedência" value={form.procedencia} onChange={val => setForm(p => ({ ...p, procedencia: val }))} placeholder="Ex: Leilão Copart" />
                
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pátio</span>
                  <select 
                    value={form.patio} 
                    onChange={e => setForm(p => ({ ...p, patio: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none appearance-none"
                  >
                    <option value=''>Selecionar...</option>
                    {['Pátio 1', 'Pátio 2', 'Pátio 3', 'Pátio 4', 'Pátio 5'].map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</span>
                  <select 
                    value={form.status} 
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none appearance-none"
                  >
                    <option value='em_desmonte'>Em Desmonte</option>
                    <option value='desmontado'>Desmontado</option>
                    <option value='encerrado'>Encerrado</option>
                  </select>
                </label>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 flex items-center justify-between">
                  Detalhes / Observações
                  <button onClick={() => iniciarVoz('detalhes')} className={`flex items-center gap-1 ${ouvindo ? 'text-rose-500 animate-pulse' : 'text-slate-600 hover:text-rose-400'}`}>
                    <Mic size={14} /> {ouvindo ? 'Ouvindo...' : 'Voz'}
                  </button>
                </span>
                <textarea
                  value={form.detalhes}
                  onChange={e => setForm(p => ({ ...p, detalhes: e.target.value }))}
                  rows={3} 
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-rose-500/60 resize-none transition-all" 
                  placeholder="Descreva detalhes importantes..."
                />
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Fotos do Veículo</span>
                <div className="flex flex-wrap gap-3">
                  {(form.fotos || []).map((f, i) => (
                    <div key={i} className="relative w-20 h-20 group">
                      <img src={f} alt="foto" className="w-full h-full object-cover rounded-2xl border border-slate-800" />
                      <button 
                        onClick={() => setForm(p => ({ ...p, fotos: p.fotos.filter((_, j) => j !== i) }))}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center text-slate-600 hover:text-slate-400 hover:border-slate-600 cursor-pointer transition-all">
                    <Plus size={20} />
                    <span className="text-[10px] font-bold mt-1">Add</span>
                    <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-8 mt-4 border-t border-slate-800">
              <button 
                onClick={() => setMostrarForm(false)}
                className="flex-1 rounded-2xl border border-slate-800 py-4 font-bold text-slate-500 hover:bg-slate-900 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={salvar} 
                disabled={salvando}
                className="flex-[2] rounded-2xl bg-rose-500 py-4 font-black text-sm uppercase tracking-widest text-white hover:bg-rose-400 shadow-lg shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {salvando ? '⏳ Salvando...' : <span className="flex items-center justify-center gap-2"><Save size={18} /> Salvar Veículo</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// HELPERS

function InfoRow({ icon, label, value, tone }) {
  const tones = {
    danger: 'text-rose-400',
    success: 'text-emerald-400',
    warning: 'text-orange-400',
    info: 'text-cyan-400'
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-slate-600">{icon}</div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <p className={`text-xs font-black truncate max-w-[120px] ${tone ? tones[tone] : 'text-slate-200'}`}>
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

function Badge({ icon, label, tone }) {
  const tones = {
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    warning: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
    info: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
    danger: 'border-rose-500/20 bg-rose-500/10 text-rose-400'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border ${tones[tone]}`}>
      {icon}
      {label}
    </span>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-rose-500/60"
      />
    </label>
  );
}