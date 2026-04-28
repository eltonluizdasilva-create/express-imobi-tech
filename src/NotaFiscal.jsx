/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { db, auth } from './lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  FileText,
  ShieldCheck,
  Zap,
  Globe,
  Info,
  CheckCircle2,
  AlertCircle,
  Copy,
  Search,
  BookOpen,
  ExternalLink,
  Wand2,
  Car,
  User,
  Hash,
  Sparkles,
  ArrowRight,
  Monitor,
  Package,
  Wrench,
  ChevronRight
} from 'lucide-react';

const GREEN_FISCAL = '#00E676';

export default function NotaFiscal() {
  const [tipoEmpresa, setTipoEmpresa] = useState(''); // 'mei' | 'me'
  const [subAba, setSubAba] = useState('guia');

  // ── Gerador de texto ──
  const [nomeCliente, setNomeCliente] = useState('');
  const [documento, setDocumento] = useState('');
  const [placa, setPlaca] = useState('');
  const [modeloCarro, setModeloCarro] = useState('');
  const [numeroOS, setNumeroOS] = useState('');
  const [servicos, setServicos] = useState('');
  const [valorServico, setValorServico] = useState('');
  const [pecas, setPecas] = useState('');
  const [valorPecas, setValorPecas] = useState('');

  const [copiadoNFS, setCopiadoNFS] = useState(false);
  const [copiadoNFe, setCopiadoNFe] = useState(false);

  const clienteDoc = documento.trim() || 'Consumidor Final';
  const formatMoeda = (v) => {
    const n = parseFloat(String(v || '').replace(',', '.'));
    return isNaN(n) ? 'R$ 0,00' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const textoNFSe = `=== DADOS PARA NFS-e NACIONAL ===
─────────────────────────────
Cliente: ${nomeCliente || 'CONSUMIDOR FINAL'}
Documento: ${clienteDoc}
Veículo: ${placa ? `${placa.toUpperCase()} – ${modeloCarro}` : modeloCarro || '–'}
Referente à O.S.: #${numeroOS || '–'}

Descrição do Serviço:
${servicos || '–'}

Valor do Serviço: ${formatMoeda(valorServico)}
─────────────────────────────
Padrão Aprovado 2026 - Emissão Portal Nacional`;

  const textoNFe = `=== DADOS PARA NF-e (Peças) ===
─────────────────────────────
Cliente: ${nomeCliente || 'CONSUMIDOR FINAL'}
Documento: ${clienteDoc}
Referente à O.S.: #${numeroOS || '–'}

Produto: Peças utilizadas conforme O.S. #${numeroOS || '–'}
Descrição:
${pecas || '–'}

Valor Total: ${formatMoeda(valorPecas)}
─────────────────────────────
Emissão SEFAZ Estadual`;

  const copiar = (texto, setCopied) => {
    navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const buscarDadosPorPlaca = async (placaBuscada) => {
    const placaLimpa = placaBuscada.toUpperCase().trim();
    if (placaLimpa.length < 7) return;

    try {
      const oficinaId = auth.currentUser?.uid;
      if (!oficinaId) return;

      const q = query(collection(db, 'oficinas', oficinaId, 'os'), where('placa', '==', placaLimpa));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => new Date(b.data_registro || 0) - new Date(a.data_registro || 0));
        const os = list[0];

        setNomeCliente(os.nomeCliente || '');
        setModeloCarro(os.modelo || '');
        setNumeroOS(os.id.slice(0, 6).toUpperCase());
        setServicos(os.checklist || os.observacoes || 'Serviços mecânicos gerais');
        setValorServico(os.valorMaoObra || '0');
        setPecas(os.detalhesPecas || 'Peças aplicadas na manutenção');
        setValorPecas(os.valorPecas || '0');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans">

      {/* HERO SECTION */}
      <section className="overflow-hidden rounded-[28px] border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.1),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(16,185,129,0.35)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
              <ShieldCheck size={14} />
              Conformidade Fiscal & Emissão
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Central de Emissão Fiscal <span className="text-emerald-500">2026</span>.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              A NFS-e agora é obrigatória e padronizada nacionalmente. O Express Auto Tech já formata os dados da sua O.S. prontos para o portal do governo.
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
            <QuickHighlight
              label="Padrão"
              value="Nacional"
              tone="success"
              helper="Atualizado para 2026"
            />
            <QuickHighlight
              label="Status"
              value="Ativo"
              tone="info"
              helper="Sincronizado com SEFAZ"
            />
          </div>
        </div>
      </section>

      {/* METRIC CARDS GRID */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Notas de Serviço"
          value="NFS-e"
          detail="Padrão Nacional Obrigatório"
          icon={<FileText size={20} />}
          tone="success"
        />
        <MetricCard
          title="Notas de Peças"
          value="NF-e"
          detail="Emissão SEFAZ Estadual"
          icon={<Package size={20} />}
          tone="info"
        />
        <MetricCard
          title="Certificado A1"
          value="Exigido"
          detail="Para emissão de NF-e (Peças)"
          icon={<Monitor size={20} />}
          tone="warning"
        />
        <MetricCard
          title="Segurança"
          value="100%"
          detail="Dados criptografados"
          icon={<ShieldCheck size={20} />}
          tone="success"
        />
      </section>

      {/* SUB-ABAS NAVIGATION */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-900/50 rounded-2xl border border-slate-800 self-start w-fit">
        {[
          { key: 'guia', label: '📖 Guia Prático' },
          { key: 'gerar', label: '📋 Gerar Dados' },
          { key: 'portais', label: '🌐 Portais Oficiais' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setSubAba(s.key)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subAba === s.key ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ══════════ ABA: GUIA ══════════ */}
      {subAba === 'guia' && (
        <div className="space-y-8 animate-in fade-in duration-500">

          <div className="grid gap-8 lg:grid-cols-2">

            {/* UNDERSTANDING SECTION */}
            <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-xl font-black text-white">Entendendo as Notas</h3>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed">
                Na prática, você vende <span className="text-white font-bold">duas coisas diferentes</span>, e cada uma vai para um sistema diferente do governo:
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-3">
                  <p className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-wider">
                    <Wrench size={16} /> Mão de Obra
                  </p>
                  <p className="text-xs text-slate-300">Nota: <span className="text-white font-bold uppercase">NFS-e</span></p>
                  <p className="text-[10px] text-slate-500 leading-tight">Imposto destinado à <span className="text-amber-500">Prefeitura</span> da sua cidade através do Padrão Nacional.</p>
                </div>
                <div className="rounded-[24px] border border-cyan-500/30 bg-cyan-500/5 p-6 space-y-3">
                  <p className="flex items-center gap-2 text-cyan-400 font-black text-sm uppercase tracking-wider">
                    <Package size={16} /> Peças e Fluidos
                  </p>
                  <p className="text-xs text-slate-300">Nota: <span className="text-white font-bold uppercase">NF-e</span></p>
                  <p className="text-[10px] text-slate-500 leading-tight">Imposto destinado ao <span className="text-amber-500">Estado (SEFAZ)</span>.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
                <p className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-widest">
                  <Info size={14} /> Dúvida Frequente
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">
                  "Já comprei a peça com nota — vou pagar imposto duas vezes?"
                </p>
                <p className="text-xs text-slate-300">
                  <span className="text-emerald-500 font-black">Não!</span> A maioria das peças tem imposto recolhido na fábrica. Você emite a nota para justificar lucro, baixar estoque e dar garantia.
                </p>
              </div>
            </div>

            {/* MEI GOLDEN RULES SECTION */}
            <div className="rounded-[32px] border border-amber-500/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.05),transparent)] p-8 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-amber-500 leading-none">Regra de Ouro do MEI</h3>
                  <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Informação Essencial</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/50 p-5 border border-slate-800">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Por lei, o <span className="text-amber-500 font-black uppercase">MEI não é obrigado</span> a emitir nota fiscal para pessoa física (CPF) — apenas para empresas (CNPJ), a menos que o cliente peça.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: <CheckCircle2 size={16} />, text: 'Cliente com CNPJ (empresa) → Nota Obrigatória', color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                  { icon: <AlertCircle size={16} />, text: 'Cliente com CPF (física) → Só se ele exigir', color: 'text-amber-500', bg: 'bg-amber-500/5' },
                  { icon: <Zap size={16} />, text: 'Se o cliente não pedir, você está dispensado', color: 'text-cyan-500', bg: 'bg-cyan-500/5' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border border-slate-800/50 ${item.bg}`}>
                    <span className={item.color}>{item.icon}</span>
                    <span className="text-xs font-bold text-slate-400">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* HOW TO EMIT SELECTOR */}
          <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-8 shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <ArrowRight className="text-emerald-500" size={20} />
              Como Emitir — Escolha sua Empresa
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              {[
                { key: 'mei', label: '⚙️ MEI', desc: 'Microempreendedor Individual' },
                { key: 'me', label: '🏢 ME/Simples', desc: 'Microempresa / Simples Nacional' },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setTipoEmpresa(tipoEmpresa === t.key ? '' : t.key)}
                  className={`flex flex-col items-center justify-center p-6 rounded-[24px] border-2 transition-all gap-1 ${tipoEmpresa === t.key ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                >
                  <span className="text-xl font-black uppercase tracking-wider">{t.label}</span>
                  <span className="text-[10px] font-bold opacity-60">{t.desc}</span>
                </button>
              ))}
            </div>

            {tipoEmpresa && (
              <div className="grid gap-6 sm:grid-cols-2 animate-in slide-in-from-top-4 duration-300">
                <div className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4">
                  <p className="text-emerald-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                    <Wrench size={16} /> Mão de Obra (NFS-e)
                  </p>
                  <div className="space-y-3">
                    {(tipoEmpresa === 'mei' ? [
                      'Governo unificado — Totalmente GRATUITO',
                      'Acesse Portal Nacional (gov.br/nfse) ou app Mobile',
                      'Use os dados formatados na aba "Gerar Dados"',
                      'Cole, descreva o serviço e emita em segundos'
                    ] : [
                      'Uso do Portal Nacional ou sistema integrado',
                      'Siga as novas regras de 2026 para padronização',
                      'Use a descrição automatizada do Express Auto Tech',
                      'Mantenha histórico no portal para conciliação'
                    ]).map((txt, i) => (
                      <div key={i} className="flex gap-3 text-xs text-slate-400">
                        <span className="text-emerald-500 font-black">{i + 1}.</span>
                        <span>{txt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-cyan-500/20 bg-cyan-500/5 p-6 space-y-4">
                  <p className="text-cyan-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                    <Package size={16} /> Peças (NF-e)
                  </p>
                  <div className="space-y-3">
                    {(tipoEmpresa === 'mei' ? [
                      'Utilize a NFA-e (Nota Fiscal Avulsa Eletrônica)',
                      'Acesse o portal da SEFAZ do seu Estado',
                      'Procure por Nota Avulsa de Produtor (Gratuito)',
                      'Use a lista de peças da O.S. importada aqui'
                    ] : [
                      'Exige Certificado Digital (A1 ou A3)',
                      'Use Emissor Gratuito do Sebrae ou similar',
                      'Copie a lista de peças consolidada da O.S.',
                      'Lance no emissor e gere o DANFE oficial'
                    ]).map((txt, i) => (
                      <div key={i} className="flex gap-3 text-xs text-slate-400">
                        <span className="text-cyan-500 font-black">{i + 1}.</span>
                        <span>{txt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ ABA: GERAR DADOS ══════════ */}
      {subAba === 'gerar' && (
        <div className="space-y-8 animate-in fade-in duration-500">

          {/* QUICK STEPS */}
          <div className="rounded-[32px] border border-cyan-500/30 bg-cyan-500/5 p-8 shadow-2xl">
            <h3 className="text-lg font-black text-cyan-400 mb-6 flex items-center gap-2">
              <Wand2 size={20} /> Passo a Passo Rápido
            </h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px]">1</span> Puxar Dados
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">Digite a placa abaixo e aperte Enter. A IA importará os valores da última O.S.</p>
              </div>
              <div className="space-y-2">
                <p className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px]">2</span> Copiar Texto
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">Clique no botão grande <span className="text-emerald-500">Verde</span> (Serviço) ou <span className="text-cyan-500">Azul</span> (Peças).</p>
              </div>
              <div className="space-y-2">
                <p className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px]">3</span> Colar no Portal
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">Vá em "Portais Oficiais" e cole o texto na caixa "Discriminação dos Serviços".</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_400px]">

            {/* INPUT SECTION */}
            <div className="space-y-6">
              <div className="rounded-[32px] border border-slate-800 bg-slate-950/80 p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>

                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6 flex items-center gap-2">
                  <Sparkles size={12} className="text-emerald-500" /> Importação de O.S.
                </h4>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                  <div className="relative">
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 flex items-center gap-2">
                      <Car size={14} /> Placa do Veículo
                    </span>
                    <div className="relative">
                      <input
                        value={placa}
                        onChange={e => setPlaca(e.target.value.toUpperCase())}
                        onBlur={(e) => buscarDadosPorPlaca(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') buscarDadosPorPlaca(e.target.value); }}
                        placeholder="ABC1234"
                        className="w-full rounded-2xl border border-emerald-500/30 bg-slate-900/50 px-4 py-4 text-sm font-black text-white outline-none focus:border-emerald-500 shadow-[0_0_20px_-10px_rgba(16,185,129,0.3)] placeholder:text-slate-700 uppercase tracking-widest"
                      />
                      <button
                        onClick={() => buscarDadosPorPlaca(placa)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 hover:bg-emerald-400 transition-all shadow-lg"
                      >
                        <Search size={18} />
                      </button>
                    </div>
                  </div>

                  <Field label="Modelo do Carro" value={modeloCarro} onChange={setModeloCarro} placeholder="Ex: Gol 1.0" icon={<Car size={14} />} />
                  <Field label="Nº da O.S." value={numeroOS} onChange={v => setNumeroOS(v.toUpperCase())} placeholder="Ex: AB1234" icon={<Hash size={14} />} />
                </div>

                <div className="pt-6 border-t border-slate-800 grid gap-4 sm:grid-cols-2">
                  <Field label="Nome do Cliente" value={nomeCliente} onChange={setNomeCliente} placeholder="Ou Consumidor Final" icon={<User size={14} />} />
                  <Field label="CPF ou CNPJ" value={documento} onChange={setDocumento} placeholder="Opcional" icon={<ShieldCheck size={14} />} />
                </div>
              </div>

              {/* COPY SECTIONS */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-[32px] border border-emerald-500/20 bg-slate-950/80 p-8 shadow-2xl space-y-6 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-bl-2xl">Mão de Obra</div>

                  <div className="space-y-4">
                    <h5 className="text-emerald-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                      <Wrench size={16} /> NFS-e Nacional
                    </h5>
                    <textarea
                      value={servicos}
                      onChange={e => setServicos(e.target.value)}
                      placeholder="Descrição dos serviços..."
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-400 outline-none focus:border-emerald-500/50 resize-none h-24"
                    />
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Valor do Serviço</span>
                      <span className="text-3xl font-black text-emerald-400">{formatMoeda(valorServico)}</span>
                    </div>
                    <button
                      onClick={() => copiar(textoNFSe, setCopiadoNFS)}
                      className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${copiadoNFS ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-emerald-400 border border-emerald-500/20 hover:bg-slate-700'}`}
                    >
                      {copiadoNFS ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      {copiadoNFS ? 'Copiado!' : 'Copiar para NFS-e'}
                    </button>
                  </div>
                </div>

                <div className="rounded-[32px] border border-cyan-500/20 bg-slate-950/80 p-8 shadow-2xl space-y-6 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-cyan-500 text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-bl-2xl">Peças e Fluidos</div>

                  <div className="space-y-4">
                    <h5 className="text-cyan-400 font-black text-sm uppercase tracking-widest flex items-center gap-2">
                      <Package size={16} /> NF-e Estadual
                    </h5>
                    <textarea
                      value={pecas}
                      onChange={e => setPecas(e.target.value)}
                      placeholder="Lista de peças aplicadas..."
                      className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-400 outline-none focus:border-cyan-500/50 resize-none h-24"
                    />
                    <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 text-center">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-1">Valor das Peças</span>
                      <span className="text-3xl font-black text-cyan-400">{formatMoeda(valorPecas)}</span>
                    </div>
                    <button
                      onClick={() => copiar(textoNFe, setCopiadoNFe)}
                      className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${copiadoNFe ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400 border border-cyan-500/20 hover:bg-slate-700'}`}
                    >
                      {copiadoNFe ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      {copiadoNFe ? 'Copiado!' : 'Copiar para NF-e'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AI ROBOT MESSAGE */}
            <div className="rounded-[32px] border border-emerald-500/20 bg-emerald-500/5 p-8 flex items-center gap-6 group">
              <div className="w-20 h-20 bg-slate-950 rounded-[28px] border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-lg group-hover:scale-110 transition-transform">
                <Sparkles size={36} />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-lg font-black text-white">Inteligência Fiscal</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ao digitar a placa, nosso assistente busca instantaneamente o histórico para preencher valores, serviços e dados do cliente. Isso economiza até <span className="text-emerald-500 font-bold">5 minutos</span> por emissão.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ ABA: PORTAIS ══════════ */}
      {subAba === 'portais' && (
        <div className="space-y-8 animate-in fade-in duration-500">

          <div className="grid gap-6 md:grid-cols-2">

            {/* GOV.BR TUTORIAL */}
            <div className="rounded-[32px] border border-emerald-500/20 bg-slate-950/80 p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                    <Globe size={20} />
                  </div>
                  <h3 className="text-xl font-black text-white">Portal NFS-e Nacional</h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Mão de Obra</span>
              </div>

              <div className="space-y-4">
                {[
                  { step: '1', title: 'Login Gov.br', desc: 'Acesse com seu CPF (Prata/Ouro) e vincule o CNPJ da sua oficina.' },
                  { step: '2', title: 'Emissão Simplificada', desc: 'Clique em "Nova NFS-e" e selecione o modo simplificado para rapidez.' },
                  { step: '3', title: 'Colar Descrição', desc: 'No campo "Discriminação", cole o texto gerado pelo Express Auto Tech.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm shrink-0">{item.step}</span>
                    <div>
                      <p className="text-xs font-black text-slate-200 uppercase tracking-wider">{item.title}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <PortalLink label="Acessar Portal Nacional" url="https://www.gov.br/nfse/pt-br" tone="success" />
                <div className="grid grid-cols-2 gap-2">
                  <PortalLink label="App Android" url="https://play.google.com/store/search?q=nfse+mobile" tone="info" />
                  <PortalLink label="App iOS" url="https://apps.apple.com/br/app/nfs-e-mobile/id1090373239" tone="info" />
                </div>
              </div>
            </div>

            {/* SEFAZ/SEBRAE TUTORIAL */}
            <div className="rounded-[32px] border border-cyan-500/20 bg-slate-950/80 p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
                    <Monitor size={20} />
                  </div>
                  <h3 className="text-xl font-black text-white">Portal NF-e Peças</h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Produtos</span>
              </div>

              <div className="space-y-4">
                {[
                  { step: '!', title: 'Certificado Digital', desc: 'Para peças (NF-e), você precisa do Certificado A1 instalado.' },
                  { step: '>', title: 'Emissor Sebrae', desc: 'O emissor gratuito do Sebrae é a melhor opção para Microempresas.' },
                  { step: '+', title: 'Dados Adicionais', desc: 'Crie um item genérico e cole a lista de peças detalhada.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <span className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center text-slate-950 font-black text-sm shrink-0">{item.step}</span>
                    <div>
                      <p className="text-xs font-black text-slate-200 uppercase tracking-wider">{item.title}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col gap-2">
                <PortalLink label="Emissor Gratuito Sebrae" url="https://www.sebrae.com.br/sites/PortalSebrae/bis/emissao-de-nota-fiscal-eletronica" tone="info" />
                <PortalLink label="Consultar SEFAZ Nacional" url="https://www.nfe.fazenda.gov.br" tone="info" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SHARED COMPONENTS

function MetricCard({ title, value, detail, icon, tone }) {
  const tones = {
    info: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200',
    success: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    danger: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
    warning: 'border-amber-400/20 bg-amber-400/10 text-amber-100'
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
        className="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs text-white outline-none transition focus:border-emerald-500/60 placeholder:text-slate-700"
      />
    </label>
  );
}

function PortalLink({ label, url, tone }) {
  const tones = {
    success: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950',
    info: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950'
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${tones[tone]}`}
    >
      {label}
      <ExternalLink size={14} />
    </a>
  );
}