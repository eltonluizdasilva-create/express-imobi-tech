import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { uploadImages } from './uploadImage';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit2, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Mic, 
  X, 
  Save, 
  Car,
  Tag,
  Warehouse,
  ShieldCheck,
  HelpCircle,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useGroq } from '../../hooks/useGroq';

const COR = '#ef4444';
const COR2 = '#f97316';
const VERDE = '#10b981';

const condicaoCor = {
  otima: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  boa: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  regular: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  sucata: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

export default function AbaPecas({
  db,
  oficinaId,
  pecas,
  veiculos,
  onReload,
  onAbrirLightbox,
  onVenderPeca,
  dadosOficina,
  carregarFinanceiro,
  filtroApenasIrregulares,
  setFiltroApenasIrregulares,
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [ouvindo, setOuvindo] = useState(false);
  const [preenchendoVoz, setPreenchendoVoz] = useState(false);
  const { analyzeText } = useGroq(oficinaId);

  const formInicial = {
    nome: '', veiculoId: '', veiculoNome: '',
    preco: '', condicao: 'otima', codigo: '',
    prateleira: '', fotos: [], status: 'disponivel',
    descricao: '', seloDetran: '',
  };
  const [form, setForm] = useState(formInicial);

  const pecasFiltradas = pecas.filter(p => {
    const bOk = !busca ||
      p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      p.veiculoNome?.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(busca.toLowerCase());
    const sOk = filtroStatus === 'todos' || p.status === filtroStatus;
    const iOk = !filtroApenasIrregulares || !p.seloDetran?.trim();
    return bOk && sOk && iOk;
  });

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

  const ouvirEPreencherPecaComIA = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
      return alert('Use o Chrome para reconhecimento de voz.');
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = 'pt-BR';
    rec.onstart = () => setPreenchendoVoz('ouvindo');
    rec.onresult = async (e) => {
      const transcricao = e.results[0][0].transcript;
      if (!transcricao.trim()) {
        setPreenchendoVoz(false);
        return;
      }
      setPreenchendoVoz('processando');
      try {
        const prompt = `Aja como um extrator inteligente de dados de autopeças para um sistema de estoque de desmanche legalizado. Analise a frase narrada pelo mecânico e extraia os campos para preenchimento do formulário da nova peça.
Retorne APENAS um objeto JSON estruturado seguindo exatamente este formato, sem explicações adicionais, sem crases de markdown, sem blocos de código:
{
  "nome": "Nome da peça cadastrada (Ex: Alternador, Caixa de Marchas, Cabeçote)",
  "preco": "Preço de venda estimado, APENAS números, sem R$ (Ex: 450)",
  "seloDetran": "Código numérico do Selo de Rastreabilidade do Detran, se citado",
  "condicao": "Condição da peça: APENAS um dos seguintes termos exatos: 'otima', 'boa', 'regular' ou 'sucata'"
}

Fala transcrita: "${transcricao}"`;

        const response = await analyzeText(prompt);
        const cleanJson = response.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        setForm(prev => ({
          ...prev,
          nome: parsed.nome || prev.nome,
          preco: parsed.preco || prev.preco,
          seloDetran: parsed.seloDetran || prev.seloDetran,
          condicao: parsed.condicao || prev.condicao,
        }));
      } catch (err) {
        console.error('[Voz Peça] Erro:', err);
        alert('Não conseguimos mapear os dados da peça. Fale de forma mais pausada.');
      } finally {
        setPreenchendoVoz(false);
      }
    };
    rec.onend = () => {
      setTimeout(() => setPreenchendoVoz(p => p === 'ouvindo' ? false : p), 500);
    };
    rec.start();
  };

  const formatarMoeda = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const agora = () => new Date().toISOString();

  const salvar = async () => {
    if (!form.nome.trim()) return alert('⚠️ Preencha o nome da peça!');
    setSalvando(true);
    try {
      const dados = { ...form, data_registro: agora() };
      if (editando) {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_pecas', editando), dados);
      } else {
        await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_pecas'), dados);
      }
      setForm(formInicial);
      setEditando(null);
      setMostrarForm(false);
      if (onReload) onReload();
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvando(false); }
  };

  const editar = (p) => {
    setForm({
      nome: p.nome || '', veiculoId: p.veiculoId || '',
      veiculoNome: p.veiculoNome || '', preco: p.preco || '',
      condicao: p.condicao || 'otima', codigo: p.codigo || '',
      prateleira: p.prateleira || '', fotos: p.fotos || [],
      status: p.status || 'disponivel', descricao: p.descricao || '',
      seloDetran: p.seloDetran || '',
    });
    setEditando(p.id);
    setMostrarForm(true);
  };

  const vender = async (peca) => {
    if (!window.confirm(`Marcar "${peca.nome}" como VENDIDA por ${formatarMoeda(peca.preco)}?`)) return;
    try {
      await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_pecas', peca.id), {
        status: 'vendida', data_venda: agora(),
      });
      await addDoc(collection(db, 'oficinas', oficinaId, 'financeiro'), {
        tipo: 'entrada',
        descricao: `🚗 Venda peça desmanche: ${peca.nome}${peca.veiculoNome ? ` (${peca.veiculoNome})` : ''}`,
        valor: Number(peca.preco) || 0,
        formaPagamento: 'desmanche',
        data: agora(),
        data_registro: agora(),
      });
      if (carregarFinanceiro) await carregarFinanceiro();
      if (onReload) onReload();
      alert('✅ Peça vendida! Valor lançado automaticamente no Financeiro.');
    } catch (e) { alert('Erro: ' + e.message); }
  };

  const excluir = async (id) => {
    if (!window.confirm('Excluir esta peça?')) return;
    try {
      await deleteDoc(doc(db, 'oficinas', oficinaId, 'desmanche_pecas', id));
      if (onReload) onReload();
    } catch (e) { alert('Erro: ' + e.message); }
  };

  return (
    <div className="space-y-6">
      {/* FILTERS & SEARCH */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text" 
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar peça, código, veículo..."
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 py-3.5 pl-12 pr-4 text-sm text-white outline-none focus:border-rose-500/50 transition-all"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['todos', 'disponivel', 'vendida', 'reservada'].map(s => (
            <button 
              key={s} 
              onClick={() => setFiltroStatus(s)} 
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${filtroStatus === s ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'}`}
            >
              {s}
            </button>
          ))}
          {filtroApenasIrregulares && (
            <button 
              onClick={() => setFiltroApenasIrregulares(false)} 
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-rose-500/40 whitespace-nowrap bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 shadow-lg shadow-rose-500/10 flex items-center gap-1.5 animate-pulse"
            >
              <ShieldAlert size={12} />
              ⚠️ SEM SELO (RISCO) ✕
            </button>
          )}
        </div>

        <button 
          onClick={() => { setForm(formInicial); setEditando(null); setMostrarForm(true); }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 font-black text-sm text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus size={18} />
          Nova Peça
        </button>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
          <Filter size={12} /> {pecasFiltradas.length} peça(s) encontrada(s)
        </p>
      </div>

      {/* EMPTY STATE */}
      {pecasFiltradas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-[32px] bg-slate-900/20">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-600">
            <Package size={32} />
          </div>
          <p className="text-slate-500 font-medium">Nenhuma peça encontrada com os filtros atuais.</p>
        </div>
      )}

      {/* LIST OF PARTS */}
      <div className="grid gap-4">
        {pecasFiltradas.map(peca => (
          <div 
            key={peca.id} 
            className={`group relative overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950/90 p-6 transition-all hover:border-orange-500/30 hover:bg-slate-900/80 shadow-2xl shadow-slate-950/40 ${peca.status === 'vendida' ? 'opacity-70' : ''}`}
          >
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Part Info */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-lg font-black text-white">{peca.nome}</h4>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${condicaoCor[peca.condicao] || 'text-slate-400'}`}>
                    {peca.condicao}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${peca.status === 'vendida' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-slate-500 bg-slate-900 border-slate-800'}`}>
                    {peca.status}
                  </span>
                  {peca.seloDetran && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                      <ShieldCheck size={12} /> ORIGEM LÍCITA
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow icon={<Car size={14} />} label="Origem" value={peca.veiculoNome} />
                  <InfoRow icon={<Tag size={14} />} label="Código" value={peca.codigo} />
                  <InfoRow icon={<Warehouse size={14} />} label="Local" value={peca.prateleira} />
                  {peca.seloDetran && (
                    <InfoRow icon={<ShieldCheck size={14} />} label="Selo Detran" value={peca.seloDetran} />
                  )}
                </div>

                {peca.descricao && (
                  <p className="text-sm text-slate-400 italic bg-slate-900/50 p-3 rounded-2xl border border-slate-800/50">
                    " {peca.descricao} "
                  </p>
                )}

                <p className="text-2xl font-black text-emerald-400 font-mono">
                  {formatarMoeda(peca.preco)}
                </p>
              </div>

              {/* Photos */}
              {(peca.fotos || []).length > 0 && (
                <div className="flex gap-2 overflow-x-auto lg:max-w-[200px] scrollbar-hide pb-2">
                  {peca.fotos.slice(0, 3).map((f, i) => (
                    <img 
                      key={i} 
                      src={f} 
                      alt="foto" 
                      onClick={() => onAbrirLightbox?.(peca.fotos, i)}
                      className="w-16 h-16 lg:w-20 lg:h-20 object-cover rounded-2xl border border-slate-800 cursor-pointer transition hover:scale-105" 
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-800/50 items-center">
              {peca.status !== 'vendida' ? (
                <>
                  <button 
                    onClick={() => editar(peca)} 
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400 transition hover:border-slate-600 hover:text-white"
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                  <button 
                    onClick={() => vender(peca)} 
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
                  >
                    <DollarSign size={14} /> Vender Peça
                  </button>
                  <div className="flex-1" />
                  <button 
                    onClick={() => excluir(peca.id)}
                    className="p-2 rounded-xl border border-rose-500/10 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-400 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-bold">
                  <CheckCircle size={14} /> Vendida em {new Date(peca.data_venda).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* FORM MODAL */}
      {mostrarForm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-slate-800 bg-slate-950 p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  {editando ? <Edit2 className="text-orange-500" /> : <Package className="text-orange-500" />}
                  {editando ? 'Editar Peça' : 'Nova Peça'}
                </h3>
                <p className="text-slate-500 text-sm mt-1">Detalhes técnicos e precificação</p>
              </div>
              <button 
                onClick={() => setMostrarForm(false)} 
                className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 🧠 PREENCHIMENTO INTELIGENTE POR VOZ */}
            <div className="mb-6">
              <button
                type="button"
                onClick={ouvirEPreencherPecaComIA}
                disabled={preenchendoVoz === 'processando'}
                className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-[0.15em] border transition-all active:scale-[0.98] ${
                  preenchendoVoz === 'ouvindo'
                    ? 'bg-orange-500/10 text-orange-500 border-orange-500 animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                    : 'bg-orange-500/5 text-orange-400 border-orange-500/20 hover:bg-orange-500/10'
                }`}
              >
                {preenchendoVoz === 'processando' ? (
                  <>⏳ Processando Dados da Peça...</>
                ) : preenchendoVoz === 'ouvindo' ? (
                  <>🔴 Pode ditar os detalhes da peça...</>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <Mic size={14} />
                    Preenchimento Inteligente por Voz
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                💡 Diga: <i>"Cadastra o motor, selo do detran 999999, condição ótima por mil e quinhentos reais."</i>
              </p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6 scrollbar-hide">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Veículo de Origem</span>
                  <select 
                    value={form.veiculoId} 
                    onChange={e => {
                      const v = veiculos.find(v => v.id === e.target.value);
                      setForm(p => ({ ...p, veiculoId: e.target.value, veiculoNome: v ? `${v.modelo} ${v.ano}` : '' }));
                    }}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none appearance-none"
                  >
                    <option value=''>Nenhum / Peça avulsa</option>
                    {veiculos.map(v => (
                      <option key={v.id} value={v.id}>{v.modelo} {v.ano}</option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Field 
                      label="Nome da Peça *" 
                      value={form.nome} 
                      onChange={val => setForm(p => ({ ...p, nome: val }))} 
                      placeholder="Ex: Cabeçote Motor 1.6" 
                      showMic 
                      onMic={() => iniciarVoz('nome')} 
                      ouvindo={ouvindo}
                    />
                  </div>
                  <Field label="Preço de Venda (R$)" type="number" value={form.preco} onChange={val => setForm(p => ({ ...p, preco: val }))} placeholder="0,00" />
                  <Field label="Código / Ref." value={form.codigo} onChange={val => setForm(p => ({ ...p, codigo: val }))} placeholder="Ex: 93402-2" />
                  <Field 
                    label="Selo de Rastreabilidade / Código Detran" 
                    value={form.seloDetran} 
                    onChange={val => setForm(p => ({ ...p, seloDetran: val }))} 
                    placeholder="Ex: DETRAN-BR-123" 
                    tooltip="Peça sem selo do Detran não pode ser comercializada legalmente."
                  />
                  <Field label="Prateleira / Local" value={form.prateleira} onChange={val => setForm(p => ({ ...p, prateleira: val }))} placeholder="Ex: A-12" />
                  
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Condição</span>
                    <select value={form.condicao} onChange={e => setForm(p => ({ ...p, condicao: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none appearance-none">
                      <option value='otima'>Ótima</option>
                      <option value='boa'>Boa</option>
                      <option value='regular'>Regular</option>
                      <option value='sucata'>Sucata</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</span>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none appearance-none">
                      <option value='disponivel'>Disponível</option>
                      <option value='reservada'>Reservada</option>
                      <option value='vendida'>Vendida</option>
                    </select>
                  </label>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 flex items-center justify-between">
                    Descrição / Observações
                  </span>
                  <textarea
                    value={form.descricao}
                    onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                    rows={3} 
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-orange-500/60 resize-none transition-all" 
                    placeholder="Detalhes sobre a peça, marcas de uso, etc..."
                  />
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Fotos da Peça</span>
                  <div className="flex flex-wrap gap-3">
                    {(form.fotos || []).map((f, i) => (
                      <div key={i} className="relative w-20 h-20 group">
                        <img src={f} alt="" className="w-full h-full object-cover rounded-2xl border border-slate-800" />
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
                className="flex-[2] rounded-2xl bg-orange-500 py-4 font-black text-sm uppercase tracking-widest text-white hover:bg-orange-400 shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {salvando ? '⏳ Salvando...' : <span className="flex items-center justify-center gap-2"><Save size={18} /> Salvar Peça</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// HELPERS

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-slate-600">{icon}</div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-xs font-black truncate max-w-[120px] text-slate-200">
          {value || '—'}
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', showMic, onMic, ouvindo, tooltip }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 flex justify-between items-center">
        <span className="flex items-center gap-2">
          {label}
          {tooltip && (
            <div className="group/tip relative inline-block normal-case tracking-normal">
              <HelpCircle size={13} className="text-slate-500 cursor-help hover:text-orange-400 transition-colors" />
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-60 p-3 bg-slate-950 border border-orange-500/20 text-[10px] text-slate-300 rounded-xl opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-all duration-200 shadow-2xl leading-relaxed font-medium z-50">
                <span className="text-orange-400 font-black uppercase block mb-1">Rastreabilidade Legal</span>
                {tooltip}
              </div>
            </div>
          )}
        </span>
        {showMic && (
          <button onClick={onMic} className={`flex items-center gap-1 ${ouvindo ? 'text-rose-500 animate-pulse' : 'text-slate-600'}`}>
            <Mic size={12} /> {ouvindo ? 'Ouvindo...' : 'Voz'}
          </button>
        )}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-500/60"
      />
    </label>
  );
}