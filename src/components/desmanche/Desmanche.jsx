import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { 
  Car, 
  Settings, 
  Search, 
  Users, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package,
  ArrowUpRight,
  Plus,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import AbaVeiculos from './AbaVeiculos';
import AbaPecas from './AbaPecas';
import AbaParceiros from './AbaParceiros';
import AbaBuscaRede from './AbaBuscaRede';

const COR = '#ef4444';
const VERDE = '#10b981';

export default function Desmanche({
  oficinaId,
  dadosOficina,
  carregarFinanceiro,
  db,
  setLightboxFotos,
  setLightboxIdx,
  setLightboxAberto,
}) {
  const [subAba, setSubAba] = useState('veiculos');
  const [veiculos, setVeiculos] = useState([]);
  const [pecas, setPecas] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroApenasIrregulares, setFiltroApenasIrregulares] = useState(false);

  useEffect(() => {
    if (oficinaId) carregarTudo();
  }, [oficinaId]);

  const carregarTudo = async () => {
    if (!oficinaId) return;
    setCarregando(true);
    try {
      const [vsSnap, psSnap, parcSnap] = await Promise.all([
        getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_veiculos')),
        getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_pecas')),
        getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_parceiros')),
      ]);
      setVeiculos(vsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPecas(psSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setParceiros(parcSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setCarregando(false); }
  };

  const abrirLightbox = (fotos, idx = 0) => {
    if (setLightboxFotos && setLightboxIdx && setLightboxAberto) {
      setLightboxFotos(fotos);
      setLightboxIdx(idx);
      setLightboxAberto(true);
    }
  };

  const totalInvestido = useMemo(() => veiculos.reduce((s, v) => s + (Number(v.valorLeilao) || 0), 0), [veiculos]);
  const totalVendas = useMemo(() => pecas.filter(p => p.status === 'vendida').reduce((s, p) => s + (Number(p.preco) || 0), 0), [pecas]);
  const lucro = totalVendas - totalInvestido;
  const pecasDisponiveis = pecas.filter(p => p.status === 'disponivel').length;
  const pecasVendidas = pecas.filter(p => p.status === 'vendida').length;
  const pecasSemSelo = useMemo(() => pecas.filter(p => p.status === 'disponivel' && !p.seloDetran).length, [pecas]);

  const publicarChegada = async (carro) => {
    if (!window.confirm(`Publicar "${carro.modelo}" e avisar oficinas parceiras?`)) return;
    try {
      const parcSnap = await getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_parceiros'));
      const parceiros_ids = parcSnap.docs.map(d => d.data().oficinaId).filter(Boolean);

      const pecasDoCarroSnap = await getDocs(
        query(collection(db, 'oficinas', oficinaId, 'desmanche_pecas'), where('veiculoId', '==', carro.id))
      );
      const pecasNomes = pecasDoCarroSnap.docs.map(d => d.data().nome).join(', ');

      const globalSnap = await getDoc(doc(db, 'desmanche_global', oficinaId));
      const jaPublicados = globalSnap.exists() ? (globalSnap.data().veiculos_publicados || []) : [];
      const carroPublicado = {
        id: carro.id, modelo: carro.modelo, ano: carro.ano, cor: carro.cor,
        patio: carro.patio, detalhes: carro.detalhes,
        fotos: (carro.fotos || []).slice(0, 10),
        data_publicacao: new Date().toISOString(),
      };
      const novosVeiculos = jaPublicados.find(v => v.id === carro.id)
        ? jaPublicados.map(v => v.id === carro.id ? carroPublicado : v)
        : [...jaPublicados, carroPublicado];

      await setDoc(doc(db, 'desmanche_global', oficinaId), {
        nomeOficina: dadosOficina?.nomeOficina || 'Desmanche',
        telefone: dadosOficina?.telefone || '',
        parceiros_ids,
        veiculos_publicados: novosVeiculos,
        ultima_atualizacao: new Date().toISOString(),
      }, { merge: false });

      for (const p of parcSnap.docs) {
        const pd = p.data();
        if (pd.oficinaId) {
          await addDoc(collection(db, 'oficinas', pd.oficinaId, 'notificacoes_desmanche'), {
            tipo: 'nova_chegada',
            desmanchemId: oficinaId,
            desmanchemNome: dadosOficina?.nomeOficina || 'Desmanche',
            modelo: carro.modelo, ano: carro.ano,
            fotos: (carro.fotos || []).slice(0, 1),
            lida: false,
            data: new Date().toISOString(),
          });
        }
      }

      await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_veiculos', carro.id), {
        publicado: true, data_publicacao: new Date().toISOString(),
      });

      const listaParceiros = parcSnap.docs.map(d => d.data());
      const msg = encodeURIComponent(
        `🚗 *NOVA CHEGADA — ${dadosOficina?.nomeOficina || 'Desmanche'}*\n\n` +
        `Carro: *${carro.modelo} ${carro.ano || ''}* — ${carro.cor || ''}\n` +
        `Pátio: ${carro.patio || 'A definir'}\n` +
        `Peças: ${pecasNomes || 'Ver no app'}\n\n` +
        `✅ Veículo com procedência lícita garantida e peças com rastreabilidade.\n\n` +
        (carro.detalhes ? `📝 ${carro.detalhes}\n\n` : '') +
        `Acesse o app → aba 🔩 FORNECEDORES para ver fotos.\nInteresse? Responda! ✅`
      );

      let enviados = 0;
      for (const p of listaParceiros) {
        const tel = String(p.telefone || '').replace(/\D/g, '');
        if (tel) {
          window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
          enviados++;
          await new Promise(r => setTimeout(r, 800));
        }
      }

      await carregarTudo();
      alert(`✅Publicado! WhatsApp aberto para ${enviados} oficina(s).`);
    } catch (e) { alert('Erro: ' + e.message); }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans">
      
      {/* HERO SECTION */}
      <section className="overflow-hidden rounded-[28px] border border-rose-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.15),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(244,63,94,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-rose-300">
              <Sparkles size={14} />
              Operação de Desmonte em Tempo Real
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Gestão inteligente de veículos, peças e rede de parceiros.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Controle seu estoque de desmanche, acompanhe a rentabilidade por veículo e conecte-se com sua rede de oficinas parceiras.
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <QuickHighlight
              label="Investimento"
              value={formatCurrency(totalInvestido)}
              tone="danger"
              helper="Total em leilão"
            />
            <QuickHighlight
              label="Vendido"
              value={formatCurrency(totalVendas)}
              tone="success"
              helper="Retorno acumulado"
            />
          </div>
        </div>
      </section>

      {/* METRIC CARDS GRID */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard 
          title="Investimento Total" 
          value={formatCurrency(totalInvestido)} 
          detail="Capital investido em veículos" 
          icon={<DollarSign size={20} />} 
          tone="danger" 
        />
        <MetricCard 
          title="Faturamento Bruto" 
          value={formatCurrency(totalVendas)} 
          detail="Total de peças vendidas" 
          icon={<TrendingUp size={20} />} 
          tone="success" 
        />
        <MetricCard 
          title="Lucro Estimado" 
          value={formatCurrency(lucro)} 
          detail={lucro >= 0 ? "Resultado positivo" : "Abaixo do investimento"} 
          icon={<ArrowUpRight size={20} />} 
          tone={lucro >= 0 ? "success" : "danger"} 
        />
        <MetricCard 
          title="Peças Disponíveis" 
          value={pecasDisponiveis} 
          detail={`${pecasVendidas} peças já vendidas`} 
          icon={<Package size={20} />} 
          tone="warning" 
        />
        <MetricCard 
          title="Alertas Compliance" 
          value={
            pecas.length === 0 
              ? 'Aguardando Estoque' 
              : pecasSemSelo > 0 
                ? '🚨 Risco Detectado' 
                : 'Tudo Regular'
          } 
          detail={
            pecas.length === 0 
              ? 'Cadastre peças com o Selo Detran para iniciar o monitoramento.' 
              : pecasSemSelo > 0 
                ? `${pecasSemSelo} ${pecasSemSelo === 1 ? 'peça sem selo' : 'peças sem selo'}` 
                : 'Todas as peças rastreadas'
          } 
          icon={<ShieldAlert size={20} />} 
          tone={pecas.length === 0 ? 'info' : pecasSemSelo > 0 ? 'danger' : 'success'} 
          tooltip="O sistema verifica se 100% do seu estoque possui a numeração de rastreabilidade (Selo Detran)."
          onClick={
            pecasSemSelo > 0 
              ? () => { setSubAba('pecas'); setFiltroApenasIrregulares(true); } 
              : undefined
          }
        />
      </section>

      {/* MENTORIA LEGAL CARD */}
      <div className="relative overflow-hidden rounded-[24px] border border-rose-500/30 bg-gradient-to-r from-rose-950/30 to-slate-950 p-6 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[80px] rounded-full"></div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex-shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            <ShieldAlert size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2 uppercase">
              🛡️ Mentoria Legal de Desmanche
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              A Lei 12.977/14 exige rastreabilidade total. Desmontar carros sem baixa ou vender peças sem o selo do Detran é crime de receptação. <strong className="text-rose-400 font-black uppercase tracking-wider">Este painel protege sua liberdade e seu patrimônio.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* SUB-ABA NAVIGATION */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { key: 'veiculos', label: 'Veículos', icon: <Car size={16} />, count: veiculos.length },
          { key: 'pecas', label: 'Peças', icon: <Settings size={16} />, count: pecasDisponiveis },
          { key: 'busca', label: 'Buscar na Rede', icon: <Search size={16} />, count: null },
          { key: 'parceiros', label: 'Parceiros', icon: <Users size={16} />, count: parceiros.length },
        ].map(({ key, label, icon, count }) => (
          <button 
            key={key} 
            onClick={() => setSubAba(key)} 
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap border ${subAba === key ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'}`}
          >
            {icon}
            {label}
            {count !== null && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${subAba === key ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {carregando && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando dados...</p>
        </div>
      )}

      {!carregando && (
        <div className="mt-4">
          {subAba === 'veiculos' && (
            <AbaVeiculos
              db={db}
              oficinaId={oficinaId}
              veiculos={veiculos}
              pecas={pecas}
              onReload={carregarTudo}
              onAbrirLightbox={abrirLightbox}
              onPublicarChegada={publicarChegada}
            />
          )}

          {subAba === 'pecas' && (
            <AbaPecas
              db={db}
              oficinaId={oficinaId}
              pecas={pecas}
              veiculos={veiculos}
              onReload={carregarTudo}
              onAbrirLightbox={abrirLightbox}
              dadosOficina={dadosOficina}
              carregarFinanceiro={carregarFinanceiro}
              filtroApenasIrregulares={filtroApenasIrregulares}
              setFiltroApenasIrregulares={setFiltroApenasIrregulares}
            />
          )}

          {subAba === 'busca' && (
            <AbaBuscaRede db={db} />
          )}

          {subAba === 'parceiros' && (
            <AbaParceiros
              db={db}
              oficinaId={oficinaId}
              parceiros={parceiros}
              onReload={carregarTudo}
            />
          )}
        </div>
      )}
    </div>
  );
}

// SHARED UI COMPONENTS

function MetricCard({ title, value, detail, icon, tone, tooltip, onClick }) {
  const tones = {
    info: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    danger: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
    warning: 'border-amber-300/20 bg-amber-300/10 text-amber-100'
  };

  return (
    <div 
      onClick={onClick}
      className={`rounded-[24px] border bg-slate-950/90 p-5 shadow-2xl shadow-slate-950/30 transition-all group relative ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:border-rose-500/40 border-slate-800/60 active:scale-95 hover:shadow-rose-500/5' : 'border-slate-800'}`}
    >
      {tooltip && (
        <div className="absolute top-3 right-3 group/tip">
          <HelpCircle size={14} className="text-slate-600 cursor-help hover:text-rose-400 transition-colors" />
          <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-slate-950 border border-rose-500/20 text-[10px] leading-relaxed text-slate-300 rounded-xl opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-all duration-200 shadow-2xl z-50">
            <span className="text-rose-400 font-black uppercase block mb-0.5">Regra de Compliance</span>
            {tooltip}
          </div>
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="pr-2 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">{title}</p>
          <h3 className="mt-3 text-lg lg:text-xl font-black text-white break-words leading-tight">{value}</h3>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{detail}</p>
        </div>
        <div className={`rounded-2xl border p-3 flex-shrink-0 ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

function QuickHighlight({ label, value, helper, tone }) {
  const tones = {
    danger: 'border-rose-400/20 bg-rose-400/10 text-rose-100',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
    info: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100'
  };

  return (
    <div className={`rounded-2xl border p-4 backdrop-blur ${tones[tone]}`}>
      <p className="text-xs uppercase tracking-[0.24em] opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm opacity-80">{helper}</p>
    </div>
  );
}