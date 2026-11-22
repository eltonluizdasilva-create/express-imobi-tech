import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { Check, Search, LoaderCircle, ShieldCheck, CircleDot, Building2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { etapasDoTipo, labelDoTipo, docIdDe, progresso, etapaAtual } from '../../lib/acompanhamento';

const E = '#10b981';

export default function AcompanharProcesso() {
  const [params] = useSearchParams();
  const [codigo, setCodigo] = useState(params.get('c') || '');
  const [senha, setSenha] = useState(params.get('s') || '');
  const [processo, setProcesso] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const buscar = async (c = codigo, s = senha) => {
    const id = docIdDe(c, s);
    if (!c?.trim() || !s?.trim()) { setErro('Informe o código e a senha recebidos no WhatsApp.'); return; }
    setCarregando(true);
    setErro('');
    setProcesso(null);
    try {
      const snap = await getDoc(doc(db, 'acompanhamentos_publicos', id));
      if (!snap.exists()) {
        setErro('Processo não encontrado. Confira o código e a senha.');
      } else {
        const d = snap.data() || {};
        setProcesso({ id, ...d, etapas: d.etapas?.length ? d.etapas : etapasDoTipo(d.tipo) });
      }
    } catch (err) {
      console.warn(err);
      setErro('Não foi possível consultar agora. Tente novamente em instantes.');
    } finally {
      setCarregando(false);
    }
  };

  // Link direto (?c=&s=) resolve sozinho
  useEffect(() => {
    const c = params.get('c');
    const s = params.get('s');
    if (c && s) buscar(c, s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const etapas = processo?.etapas || [];
  const feitas = Array.isArray(processo?.concluidas) ? processo.concluidas : [];
  const atual = processo ? etapaAtual(processo) : 0;
  const pct = processo ? progresso(processo) : 0;

  return (
    <div className="min-h-screen bg-[#020408] text-white font-sans px-4 py-10 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Marca */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: E }}>
            <Building2 size={20} className="text-slate-950" />
          </div>
          <div>
            <p className="text-sm font-black tracking-widest text-white">EXPRESS IMOBI TECH</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Acompanhamento do cliente</p>
          </div>
        </div>

        {/* Consulta */}
        <section className="bg-[#060a10] border border-slate-800 rounded-3xl p-6 md:p-8">
          <h1 className="text-xl md:text-2xl font-black tracking-tight">
            Acompanhe seu <span style={{ color: E }}>processo</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Digite o código e a senha que a imobiliária enviou no WhatsApp. Aqui aparece cada etapa, atualizada
            em tempo real — sem precisar ligar.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); buscar(); }}
            className="mt-5 grid gap-3 sm:grid-cols-[1fr_140px_auto]"
          >
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Código (IMB-4829)"
              aria-label="Código do processo"
              autoComplete="off"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
            />
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Senha"
              aria-label="Senha de 4 dígitos recebida no WhatsApp"
              autoComplete="off"
              inputMode="numeric"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#10b981]"
            />
            <button
              type="submit"
              disabled={carregando}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-950 disabled:opacity-50"
              style={{ backgroundColor: E }}
            >
              {carregando ? <LoaderCircle size={15} className="animate-spin" /> : <Search size={15} />}
              Consultar
            </button>
          </form>

          {erro && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {erro}
            </div>
          )}
        </section>

        {/* Resultado */}
        {processo && (
          <section className="bg-[#060a10] border border-slate-800 rounded-3xl p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  {labelDoTipo(processo.tipo)}
                </p>
                <h2 className="text-lg font-black text-white mt-1">{processo.cliente}</h2>
                <p className="text-xs text-slate-400">{processo.imovel || 'Imóvel em processamento'}</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30">
                {processo.status === 'concluido' ? 'Concluído' : `${pct}% concluído`}
              </span>
            </div>

            <div className="mt-4 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: E }} />
            </div>

            <ol className="mt-5 space-y-2">
              {etapas.map((etapa, i) => {
                const done = feitas.includes(i);
                const ehAtual = i === atual;
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                      style={{
                        borderColor: done || ehAtual ? E : '#334155',
                        backgroundColor: done ? E : 'transparent',
                      }}
                    >
                      {done ? <Check size={11} className="text-slate-950" /> : <CircleDot size={9} className="text-slate-500" />}
                    </span>
                    <div className="flex-1">
                      <p className={`text-sm ${done ? 'text-slate-500 line-through' : ehAtual ? 'text-white font-bold' : 'text-slate-300'}`}>
                        {etapa}
                      </p>
                      {ehAtual && !done && (
                        <p className="text-[10px] uppercase tracking-widest font-black" style={{ color: E }}>
                          etapa atual
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            <p className="mt-5 text-[10px] text-slate-600 flex items-center gap-1.5">
              <ShieldCheck size={12} /> Consulta protegida por código e senha. Não compartilhe com terceiros.
            </p>
          </section>
        )}
      </div>

      {/* Privacidade desta consulta: código + senha, sem coleta de dado novo. */}
      <p className="mt-6 max-w-2xl text-center text-[11px] leading-relaxed text-slate-500">
        Esta consulta usa apenas o código e a senha enviados pela imobiliária — nada é gravado no seu navegador.
        Os dados do processo pertencem ao atendimento da imobiliária; para correção ou exclusão, fale com ela ou
        use o canal de privacidade da{' '}
        <Link to="/privacidade" className="text-[#10b981] underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </div>
  );
}
