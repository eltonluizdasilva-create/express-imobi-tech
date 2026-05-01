import React, { useState, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Plus,
  Save,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Award
} from 'lucide-react';

export default function FechamentoCaixa({ oficinaId, listaFinanceiro }) {
  const [dinheiroInformado, setDinheiroInformado] = useState('');
  const [pixInformado, setPixInformado] = useState('');
  const [cartaoInformado, setCartaoInformado] = useState('');

  const [descricaoSangria, setDescricaoSangria] = useState('');
  const [valorSangria, setValorSangria] = useState('');
  const [categoriaSangria, setCategoriaSangria] = useState('Despesa Geral');
  const [carregandoSangria, setCarregandoSangria] = useState(false);

  const [carregandoFechamento, setCarregandoFechamento] = useState(false);
  const [sucessoVisivel, setSucessoVisivel] = useState(false);
  const [sucessoTipo, setSucessoTipo] = useState(''); // 'fechamento' | 'sangria'

  // Helper parser for string input to float conversion
  const parseNumberInput = (val) => {
    if (!val) return 0;
    const sanitized = String(val).replace(',', '.');
    return parseFloat(sanitized) || 0;
  };

  // Resumo do Dia
  const resumoDia = useMemo(() => {
    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);

    const hojeFim = new Date();
    hojeFim.setHours(23, 59, 59, 999);

    const base = listaFinanceiro && listaFinanceiro.length > 0 ? listaFinanceiro : [];

    let entradasDinheiro = 0;
    let entradasPix = 0;
    let entradasCartao = 0;

    let totalEntradas = 0;
    let totalSaidas = 0;

    base.forEach(t => {
      let dataTransacao;
      try {
        if (t.data?.toDate) {
          dataTransacao = t.data.toDate();
        } else if (t.data) {
          dataTransacao = new Date(t.data);
        } else {
          dataTransacao = new Date();
        }
      } catch {
        dataTransacao = new Date();
      }

      if (dataTransacao >= hojeInicio && dataTransacao <= hojeFim) {
        const v = Number(t.valor) || 0;
        const isEntrada = t.tipo !== 'saida';

        if (isEntrada) {
          totalEntradas += v;
          const pag = (t.pagamento || '').trim().toLowerCase();
          if (pag.includes('pix')) entradasPix += v;
          else if (pag.includes('cart') || pag.includes('crédito') || pag.includes('débito')) entradasCartao += v;
          else entradasDinheiro += v;
        } else {
          totalSaidas += v;
        }
      }
    });

    return {
      entradasDinheiro,
      entradasPix,
      entradasCartao,
      totalEntradas,
      totalSaidas,
      saldoEsperado: totalEntradas - totalSaidas,
    };
  }, [listaFinanceiro]);

  const handleSalvarSangria = async (e) => {
    if (e) e.preventDefault();
    if (!oficinaId) return;
    if (!descricaoSangria || !valorSangria) {
      alert("⚠️ Preencha a descrição e o valor da sangria!");
      return;
    }
    setCarregandoSangria(true);
    try {
      const v = Math.abs(parseNumberInput(valorSangria));
      const valeFunc = categoriaSangria === 'Vale Funcionário';

      await addDoc(collection(db, "oficinas", oficinaId, "financeiro"), {
        descricao: `Sangria (${categoriaSangria}): ${descricaoSangria}`,
        valor: v,
        pagamento: 'Dinheiro',
        tipo: 'saida',
        categoria: categoriaSangria,
        valeFuncionario: valeFunc,
        data: new Date().toISOString()
      });

      setDescricaoSangria('');
      setValorSangria('');
      setCategoriaSangria('Despesa Geral');

      setSucessoTipo('sangria');
      setSucessoVisivel(true);
      setTimeout(() => setSucessoVisivel(false), 5000);
    } catch (err) {
      alert("❌ Erro: " + err.message);
    } finally {
      setCarregandoSangria(false);
    }
  };

  const handleFinalizarFechamento = async () => {
    if (!oficinaId) return;
    setCarregandoFechamento(true);
    try {
      const valDinheiro = parseNumberInput(dinheiroInformado);
      const valPix = parseNumberInput(pixInformado);
      const valCartao = parseNumberInput(cartaoInformado);

      const dif = (valDinheiro + valPix + valCartao) - resumoDia.saldoEsperado;

      await addDoc(collection(db, "oficinas", oficinaId, "fechamentos_diarios"), {
        dinheiroInformado: valDinheiro,
        pixInformado: valPix,
        cartaoInformado: valCartao,
        saldoEsperado: resumoDia.saldoEsperado,
        diferenca: dif,
        oficinaId,
        dataFechamento: new Date().toISOString()
      });

      setDinheiroInformado('');
      setPixInformado('');
      setCartaoInformado('');

      setSucessoTipo('fechamento');
      setSucessoVisivel(true);
      setTimeout(() => setSucessoVisivel(false), 5000);
    } catch (err) {
      alert("❌ Erro ao salvar fechamento: " + err.message);
    } finally {
      setCarregandoFechamento(false);
    }
  };

  const diferenca = (
    parseNumberInput(dinheiroInformado) +
    parseNumberInput(pixInformado) +
    parseNumberInput(cartaoInformado)
  ) - resumoDia.saldoEsperado;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-4 text-slate-100 md:px-8 font-sans">
      
      {/* SUCCESS POPUP / BANNER */}
      {sucessoVisivel && (
        <div className="fixed inset-x-0 top-12 z-50 flex justify-center animate-bounce">
          <div className="flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-950/90 px-6 py-3 text-sm font-black uppercase tracking-wider text-emerald-200 shadow-[0_20px_50px_rgba(16,185,129,0.4)] backdrop-blur transition-all duration-300">
            <CheckCircle className="text-emerald-400" size={22} />
            {sucessoTipo === 'sangria' ? 'Sangria registrada com sucesso!' : 'Fechamento de caixa gravado com sucesso!'}
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(3,7,18,0.96))] p-6 shadow-[0_30px_120px_-40px_rgba(16,185,129,0.35)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
              <Sparkles size={14} />
              Conciliação Diária
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
              Fechamento de Caixa
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
              Concilie os valores recebidos e faça retiradas do caixa (sangrias) com controle de saldo em tempo real.
            </p>
          </div>
        </div>
      </section>

      {/* SUMMARY GRID */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Saldo Esperado do Dia"
          value={formatCurrency(resumoDia.saldoEsperado)}
          detail="Total entradas - sangrias"
          icon={<Wallet size={20} />}
          tone="info"
        />
        <MetricCard
          title="Entradas em Dinheiro"
          value={formatCurrency(resumoDia.entradasDinheiro)}
          detail="Total registrado em dinheiro"
          icon={<ArrowUpRight size={20} />}
          tone="success"
        />
        <MetricCard
          title="Entradas em PIX"
          value={formatCurrency(resumoDia.entradasPix)}
          detail="Total registrado via PIX"
          icon={<ArrowUpRight size={20} />}
          tone="success"
        />
        <MetricCard
          title="Entradas em Cartão"
          value={formatCurrency(resumoDia.entradasCartao)}
          detail="Total em cartão"
          icon={<ArrowUpRight size={20} />}
          tone="success"
        />
      </section>

      {/* CONCILIATION & SANGRIA FORMS */}
      <section className="grid gap-6 xl:grid-cols-2">
        
        {/* CONCILIATION FORM */}
        <div className="rounded-[26px] border border-slate-800 bg-slate-950/90 p-6 shadow-2xl">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">Conciliação</p>
            <h2 className="mt-1 text-xl font-bold text-white">Conferência de Saldo do Dia</h2>
            <p className="text-slate-400 text-xs mt-1">Insira os valores reais no seu caixa físico/contas.</p>
          </div>

          <div className="space-y-4">
            <Field
              label="Saldo Físico em Dinheiro (R$)"
              value={dinheiroInformado}
              onChange={setDinheiroInformado}
              placeholder="0,00"
            />
            <Field
              label="Saldo em Conta PIX (R$)"
              value={pixInformado}
              onChange={setPixInformado}
              placeholder="0,00"
            />
            <Field
              label="Saldo em Conta Cartão (R$)"
              value={cartaoInformado}
              onChange={setCartaoInformado}
              placeholder="0,00"
            />

            <div className={`mt-4 rounded-2xl border p-4 backdrop-blur transition-all flex items-center justify-between ${diferenca === 0 ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : (diferenca > 0 ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200' : 'border-rose-500/20 bg-rose-500/10 text-rose-200')}`}>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] opacity-80">Diferença de Caixa</p>
                <p className="mt-1 text-2xl font-black">{formatCurrency(diferenca)}</p>
              </div>
              <div>
                {diferenca === 0 ? <CheckCircle size={28} /> : <RefreshCw size={28} className="animate-spin" style={{ animationDuration: '4s' }} />}
              </div>
            </div>

            <button
              onClick={handleFinalizarFechamento}
              disabled={carregandoFechamento}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 py-4 font-black text-xs uppercase tracking-widest text-slate-950 transition active:scale-95 hover:bg-cyan-400 disabled:opacity-50"
            >
              <Award size={18} />
              {carregandoFechamento ? 'Processando...' : 'Finalizar Fechamento'}
            </button>
          </div>
        </div>

        {/* SANGRIA FORM */}
        <div className="rounded-[26px] border border-slate-800 bg-slate-950/90 p-6 shadow-2xl h-fit">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-300">Retirada de Caixa</p>
            <h2 className="mt-1 text-xl font-bold text-white">Registrar Sangria</h2>
            <p className="text-slate-400 text-xs mt-1">Registe saídas e deduções de dinheiro.</p>
          </div>

          <form onSubmit={handleSalvarSangria} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Categoria da Sangria</span>
              <select
                value={categoriaSangria}
                onChange={e => setCategoriaSangria(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-rose-400/60 transition cursor-pointer"
              >
                <option value="Despesa Geral">Despesa Geral</option>
                <option value="Vale Funcionário">Vale Funcionário</option>
                <option value="Retirada Sócio">Retirada Sócio</option>
              </select>
            </label>

            <Field
              label="Descrição da Sangria"
              value={descricaoSangria}
              onChange={setDescricaoSangria}
              placeholder="Ex: Compra de Material de Limpeza"
            />
            <Field
              label="Valor (R$)"
              value={valorSangria}
              onChange={setValorSangria}
              placeholder="0,00"
            />

            <button
              disabled={carregandoSangria}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-4 font-black text-sm uppercase tracking-widest transition-all active:scale-95 bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-50"
            >
              <Save size={18} />
              {carregandoSangria ? 'Gravando...' : 'Registrar Sangria'}
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}

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

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60"
      />
    </label>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}
