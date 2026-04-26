import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { 
  ClipboardList, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Calendar, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Mic, 
  Save, 
  X,
  Type,
  AlignLeft
} from 'lucide-react';

const TAREFA_COLOR = '#10b981';
const WARN_RED = '#f43f5e';
const WARN_YELLOW = '#f59e0b';
const BLUE_INFO = '#3b82f6';

function useVoz() {
  const [campoOuvindo, setCampoOuvindo] = useState(null);
  const ouvirCampo = (nomeCampo, setFn) => {
    if (!('webkitSpeechRecognition' in window)) { alert('Use Chrome para usar o microfone.'); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;
    setCampoOuvindo(nomeCampo);
    recognition.onresult = (event) => {
      let texto = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        texto += event.results[i][0].transcript;
      }
      setFn(prev => prev ? prev + ' ' + texto : texto);
    };
    recognition.onend = () => setCampoOuvindo(null);
    recognition.onerror = () => setCampoOuvindo(null);
    recognition.start();
    setTimeout(() => { recognition.stop(); setCampoOuvindo(null); }, 8000);
  };
  return { campoOuvindo, ouvirCampo };
}

export default function TarefaTab({ oficinaId }) {
  const [tarefas, setTarefas] = useState([]);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novaHora, setNovaHora] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [expandidos, setExpandidos] = useState({});
  const { campoOuvindo, ouvirCampo } = useVoz();

  useEffect(() => {
    carregarTarefas();
    const intervalo = setInterval(carregarTarefas, 5000);
    return () => clearInterval(intervalo);
  }, []);

  const carregarTarefas = async () => {
    try {
      if (!oficinaId) return;
      const q = query(collection(db, 'oficinas', oficinaId, 'tarefas'), orderBy('dataCriacao', 'desc'));
      const snapshot = await getDocs(q);
      setTarefas(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (erro) { console.error('Erro ao carregar tarefas:', erro); }
  };

  const adicionarTarefa = async () => {
    if (!novoTitulo.trim()) { alert('Digite um título para a tarefa'); return; }
    setCarregando(true);
    try {
      let dataHora = null;
      if (novaData && novaHora) {
        dataHora = new Date(`${novaData}T${novaHora}:00`);
      } else if (novaData) {
        dataHora = new Date(`${novaData}T23:59:00`);
      }
      const novaTarefa = {
        titulo: novoTitulo.trim(),
        descricao: novaDescricao.trim(),
        dataHora: dataHora ? Timestamp.fromDate(dataHora) : null,
        status: 'pendente',
        dataCriacao: Timestamp.now(),
      };
      if (!oficinaId) return;
      await addDoc(collection(db, 'oficinas', oficinaId, 'tarefas'), novaTarefa);
      setNovoTitulo('');
      setNovaDescricao('');
      setNovaData('');
      setNovaHora('');
      carregarTarefas();
    } catch (erro) { console.error('Erro ao adicionar tarefa:', erro); alert('Erro ao adicionar tarefa'); }
    finally { setCarregando(false); }
  };

  const atualizarStatusTarefa = async (tarefaId, novoStatus) => {
    try {
      if (!oficinaId) return;
      await updateDoc(doc(db, 'oficinas', oficinaId, 'tarefas', tarefaId), { status: novoStatus });
      carregarTarefas();
    } catch (erro) { console.error(erro); }
  };

  const deletarTarefa = async (tarefaId) => {
    if (!window.confirm('Deletar esta tarefa?')) return;
    try {
      if (!oficinaId) return;
      await deleteDoc(doc(db, 'oficinas', oficinaId, 'tarefas', tarefaId));
      carregarTarefas();
    } catch (erro) { console.error(erro); }
  };

  const calcularStatusTarefa = (dataHora) => {
    if (!dataHora) return 'sem_data';
    const agora = new Date();
    const dataHoraObj = dataHora?.toDate ? dataHora.toDate() : new Date(dataHora);
    const diffHoras = (dataHoraObj - agora) / (1000 * 60 * 60);
    if (diffHoras < 0) return 'vencida';
    if (diffHoras <= 1) return 'urgente';
    if (diffHoras <= 24) return 'aviso';
    return 'ok';
  };

  const formatarDataHora = (timestamp) => {
    if (!timestamp) return '-';
    const data = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');
    return `${dia}/${mes} ${hora}:${minuto}`;
  };

  const tarefasFiltradas = useMemo(() => {
    return tarefas.filter(t => {
      if (filtroStatus === 'pendentes') return t.status === 'pendente';
      if (filtroStatus === 'concluidas') return t.status === 'concluida';
      return true;
    });
  }, [tarefas, filtroStatus]);

  const pendentesCount = useMemo(() => tarefas.filter(t => t.status === 'pendente').length, [tarefas]);
  const concluidasCount = useMemo(() => tarefas.filter(t => t.status === 'concluida').length, [tarefas]);
  const urgentesCount = useMemo(() => tarefas.filter(t => { 
    const s = calcularStatusTarefa(t.dataHora); 
    return (s === 'urgente' || s === 'vencida') && t.status === 'pendente'; 
  }).length, [tarefas]);

  const paletaStatus = {
    vencida: { border: 'border-rose-500/30', bg: 'bg-rose-500/5', badge: 'text-rose-400 border-rose-400/20 bg-rose-400/10', icon: <AlertCircle size={14} />, label: 'VENCIDA' },
    urgente: { border: 'border-rose-400/30', bg: 'bg-rose-400/5', badge: 'text-rose-400 border-rose-400/20 bg-rose-400/10', icon: <AlertCircle size={14} />, label: 'URGENTE' },
    aviso: { border: 'border-amber-400/30', bg: 'bg-amber-400/5', badge: 'text-amber-400 border-amber-400/20 bg-amber-400/10', icon: <Clock size={14} />, label: 'PRÓXIMA' },
    ok: { border: 'border-emerald-500/20', bg: 'bg-slate-900/40', badge: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10', icon: <CheckCircle2 size={14} />, label: 'EM DIA' },
    sem_data: { border: 'border-slate-800', bg: 'bg-slate-900/40', badge: 'text-slate-400 border-slate-700 bg-slate-800/50', icon: <ClipboardList size={14} />, label: 'SEM DATA' },
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans">
      
      {/* HERO SECTION */}
      <section className="overflow-hidden rounded-[28px] border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.1),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(16,185,129,0.3)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
              <Sparkles size={14} />
              Gestão de Alta Performance
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Organize suas tarefas e mantenha sua oficina em dia.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Controle prazos, agende compromissos e garanta que nenhuma pendência seja esquecida no dia a dia.
            </p>
          </div>

          <div className="flex gap-4">
             <button 
                onClick={() => setFiltroStatus('pendentes')}
                className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-emerald-500 px-6 py-4 font-black text-slate-950 transition-all hover:bg-emerald-400 active:scale-95"
             >
               <span className="relative z-10">Ver Pendentes</span>
               <div className="absolute -right-2 -top-2 opacity-10 transition-transform group-hover:scale-110">
                 <ClipboardList size={60} />
               </div>
             </button>
          </div>
        </div>
      </section>

      {/* METRIC CARDS GRID */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard 
          title="Pendentes" 
          value={pendentesCount} 
          detail="Tarefas aguardando ação" 
          icon={<Clock size={20} />} 
          tone="warning" 
        />
        <MetricCard 
          title="Concluídas" 
          value={concluidasCount} 
          detail="Tarefas finalizadas" 
          icon={<CheckCircle2 size={20} />} 
          tone="success" 
        />
        <MetricCard 
          title="Urgentes" 
          value={urgentesCount} 
          detail="Vencidas ou próximas do prazo" 
          icon={<AlertCircle size={20} />} 
          tone="danger" 
        />
        <MetricCard 
          title="Total Geral" 
          value={tarefas.length} 
          detail="Histórico de produtividade" 
          icon={<ClipboardList size={20} />} 
          tone="info" 
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* TASK LIST AREA */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white">Suas Tarefas</h3>
            <div className="flex gap-2">
              {[['todas', 'Todas'], ['pendentes', 'Pendentes'], ['concluidas', 'Concluídas']].map(([f, label]) => (
                <button 
                  key={f} 
                  onClick={() => setFiltroStatus(f)} 
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filtroStatus === f ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {tarefasFiltradas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-[32px] bg-slate-900/20 text-slate-500">
                <ClipboardList size={32} className="mb-2 opacity-20" />
                <p>Nenhuma tarefa encontrada.</p>
              </div>
            )}
            {tarefasFiltradas.map(tarefa => {
              const statusTarefa = calcularStatusTarefa(tarefa.dataHora);
              const paleta = paletaStatus[statusTarefa];
              const expandida = expandidos[tarefa.id];
              return (
                <div 
                  key={tarefa.id} 
                  className={`group relative overflow-hidden rounded-[24px] border ${paleta.border} ${paleta.bg} p-5 transition-all hover:border-emerald-500/30 shadow-xl shadow-slate-950/20`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h4 className={`text-lg font-black text-white ${tarefa.status === 'concluida' ? 'line-through opacity-50' : ''}`}>
                          {tarefa.titulo}
                        </h4>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${paleta.badge}`}>
                          {paleta.icon}
                          {paleta.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                        {tarefa.dataHora && (
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-emerald-500" />
                            {formatarDataHora(tarefa.dataHora)}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${tarefa.status === 'concluida' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {tarefa.status === 'concluida' ? 'Concluída' : 'Pendente'}
                        </span>
                      </div>

                      {tarefa.descricao && !expandida && (
                        <p className="mt-2 text-sm text-slate-500 truncate max-w-lg">
                          {tarefa.descricao}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => setExpandidos(prev => ({ ...prev, [tarefa.id]: !prev[tarefa.id] }))}
                        className="w-10 h-10 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                      >
                        {expandida ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      <button 
                        onClick={() => deletarTarefa(tarefa.id)}
                        className="w-10 h-10 rounded-xl border border-rose-500/10 bg-rose-500/5 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {expandida && (
                    <div className="mt-5 pt-5 border-t border-slate-800/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                      {tarefa.descricao && (
                        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/50">
                          <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
                            {tarefa.descricao}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        {tarefa.status === 'pendente' ? (
                          <button 
                            onClick={() => atualizarStatusTarefa(tarefa.id, 'concluida')}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-black text-slate-950 transition-all hover:bg-emerald-400 active:scale-95"
                          >
                            <CheckCircle2 size={16} /> Marcar como Concluída
                          </button>
                        ) : (
                          <button 
                            onClick={() => atualizarStatusTarefa(tarefa.id, 'pendente')}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-black text-amber-400 transition-all hover:bg-amber-500/20 active:scale-95"
                          >
                            <Clock size={16} /> Reabrir Tarefa
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* NEW TASK FORM AREA */}
        <div className="lg:sticky lg:top-8 self-start">
          <div className="rounded-[32px] border border-emerald-500/20 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">Nova Tarefa</h2>
                <p className="text-slate-500 text-sm mt-1">Organize seu próximo passo</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <Plus size={24} />
              </div>
            </div>

            <div className="space-y-6">
              <Field 
                label="Título da Tarefa *" 
                value={novoTitulo} 
                onChange={setNovoTitulo} 
                placeholder="Ex: Ligar para fornecedor..." 
                icon={<Type size={16} />}
                showMic 
                onMic={() => ouvirCampo('tituloTarefa', setNovoTitulo)} 
                ouvindo={campoOuvindo === 'tituloTarefa'}
              />

              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-2"><AlignLeft size={14} /> Descrição</div>
                  <button 
                    onClick={() => ouvirCampo('descTarefa', setNovaDescricao)} 
                    className={`flex items-center gap-1.5 transition-colors ${campoOuvindo === 'descTarefa' ? 'text-rose-500 animate-pulse' : 'text-slate-600 hover:text-emerald-400'}`}
                  >
                    <Mic size={14} /> {campoOuvindo === 'descTarefa' ? 'Ouvindo...' : 'Voz'}
                  </button>
                </span>
                <textarea
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  rows={3} 
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/60 resize-none transition-all placeholder:text-slate-700" 
                  placeholder="Detalhes opcionais..."
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <Field 
                  label="Data" 
                  type="date" 
                  value={novaData} 
                  onChange={setNovaData} 
                  icon={<Calendar size={16} />}
                />
                <Field 
                  label="Hora" 
                  type="time" 
                  value={novaHora} 
                  onChange={setNovaHora} 
                  icon={<Clock size={16} />}
                />
              </div>

              <button 
                onClick={adicionarTarefa} 
                disabled={carregando}
                className="w-full rounded-2xl bg-emerald-500 py-5 font-black text-sm uppercase tracking-widest text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {carregando ? '⏳ Processando...' : <><Save size={20} /> Salvar Tarefa</>}
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

function Field({ label, value, onChange, placeholder, type = 'text', icon, showMic, onMic, ouvindo }) {
  return (
    <label className="block space-y-2">
      <span className="block text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex justify-between items-center">
        <div className="flex items-center gap-2">{icon}{label}</div>
        {showMic && (
          <button 
            onClick={onMic} 
            className={`flex items-center gap-1.5 transition-colors ${ouvindo ? 'text-rose-500 animate-pulse' : 'text-slate-600 hover:text-emerald-400'}`}
          >
            <Mic size={14} /> {ouvindo ? 'Ouvindo...' : 'Voz'}
          </button>
        )}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500/60 placeholder:text-slate-700"
      />
    </label>
  );
}
