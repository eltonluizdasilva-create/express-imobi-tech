import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPin, Search, X, Loader2, Download, Save, Check, AlertTriangle,
  ChevronLeft, ChevronRight, Building2, Trees,
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  capturarLeads,
  exportarCsv,
  paginar,
  rotuloAvaliacao,
  rotuloStatus,
  usandoWebhookExterno,
  POR_PAGINA,
} from '../../services/mapsScraperService';

/**
 * ModalCapturaLeads — montado sob demanda (React.lazy no componente pai).
 * Fica fora da arvore da pagina de prospeccao: digitar aqui nao re-renderiza
 * Radar de Captacao nem o painel.
 */

const RAIOS = [
  { valor: 500, rotulo: '500 m' },
  { valor: 1000, rotulo: '1 km' },
  { valor: 3000, rotulo: '3 km' },
  { valor: 5000, rotulo: '5 km' },
];

const OBJETIVOS = [
  {
    id: 'comercial',
    titulo: 'Prospecção comercial',
    texto: 'Empresas e comércios do entorno para parceria e captação.',
    icone: Building2,
  },
  {
    id: 'entorno',
    titulo: 'Entorno imobiliário',
    texto: 'Escolas, mercados, bancos e saúde que valorizam o imóvel.',
    icone: Trees,
  },
];

export default function ModalCapturaLeads({ oficinaId, cor = '#10b981', onFechar }) {
  const [endereco, setEndereco] = useState('');
  const [raio, setRaio] = useState(1000);
  const [objetivo, setObjetivo] = useState('comercial');

  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);
  const [pagina, setPagina] = useState(1);

  const [salvando, setSalvando] = useState(null);
  const [salvos, setSalvos] = useState({});
  const [avisoCrm, setAvisoCrm] = useState(null);

  const abortRef = useRef(null);
  const primeiroCampo = useRef(null);

  useEffect(() => {
    primeiroCampo.current?.focus();
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const aoTeclar = (e) => {
      if (e.key === 'Escape') fechar();
    };
    window.addEventListener('keydown', aoTeclar);

    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', aoTeclar);
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fechar() {
    abortRef.current?.abort();
    if (onFechar) onFechar();
  }

  async function executar(e) {
    if (e) e.preventDefault();
    if (carregando) return;

    setErro(null);
    setAvisoCrm(null);
    setResultado(null);
    setPagina(1);
    setCarregando(true);

    const controle = new AbortController();
    abortRef.current = controle;

    try {
      const resposta = await capturarLeads(
        { endereco, raio, objetivo },
        {
          signal: controle.signal,
          getToken: async () => (auth.currentUser ? auth.currentUser.getIdToken() : null),
        }
      );
      setResultado(resposta);
    } catch (falha) {
      setErro({
        codigo: (falha && falha.codigo) || 'servidor',
        mensagem: (falha && falha.message) || 'Nao foi possivel concluir a varredura.',
        dica: falha && falha.hint,
      });
    } finally {
      setCarregando(false);
      abortRef.current = null;
    }
  }

  async function salvarNoCrm(item) {
    if (!oficinaId) {
      setAvisoCrm('Conta sem identificacao de imobiliaria. Recarregue a pagina e tente de novo.');
      return;
    }
    if (salvos[item.placeId] || salvando) return;

    setSalvando(item.placeId);
    setAvisoCrm(null);

    try {
      const telefoneLimpo = String(item.telefone || '').replace(/\D/g, '');
      await addDoc(collection(db, 'oficinas', oficinaId, 'leads'), {
        nome: item.nome,
        telefone: telefoneLimpo,
        telefoneLimpo,
        telefoneFormatado: item.telefone || '',
        categoria: item.categoria,
        endereco: item.endereco,
        site: item.site || '',
        avaliacaoGoogle: item.avaliacao ?? null,
        avaliacoesGoogle: item.totalAvaliacoes ?? 0,
        placeId: item.placeId,
        lat: item.lat,
        lng: item.lng,
        veiculo: 'Imovel Residencial / Comercial',
        imovel: item.endereco,
        problema: item.categoria + ' no entorno do imovel',
        origem: 'Captura Maps',
        fonte: 'google_places',
        status: 'novo',
        estagio: 'Novo Lead',
        data_registro: new Date().toISOString(),
        data: new Date().toISOString(),
        criadoEm: serverTimestamp(),
      });
      setSalvos((antes) => ({ ...antes, [item.placeId]: true }));
    } catch (falha) {
      setAvisoCrm(
        `Nao consegui salvar "${item.nome}": ${(falha && falha.message) || 'erro desconhecido'}.`
      );
    } finally {
      setSalvando(null);
    }
  }

  function salvarTodosVisiveis() {
    if (!resultado) return;
    const pendentes = paginados.itens.filter((item) => !salvos[item.placeId]);
    // sequencial de proposito: evita rajada de escritas no Firestore
    (async () => {
      for (const item of pendentes) {
        // eslint-disable-next-line no-await-in-loop
        await salvarNoCrm(item);
      }
    })();
  }

  function baixarCsv() {
    if (!resultado || !resultado.itens || !resultado.itens.length) return;
    const csv = exportarCsv(resultado.itens);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const rotulo = String(endereco || 'regiao')
      .replace(/[^\w-]+/g, '-')
      .slice(0, 40)
      .toLowerCase();
    link.href = url;
    link.download = `captura-${rotulo}-${raio}m.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const paginados = useMemo(() => paginar((resultado && resultado.itens) || [], pagina, POR_PAGINA), [
    resultado,
    pagina,
  ]);

  const salvosCount = Object.keys(salvos).length;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/75 px-3 py-6 backdrop-blur-sm sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-label="Capturar leads por regiao"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-[#020408] shadow-2xl">
        {/* topo */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl border"
              style={{ borderColor: `${cor}55`, backgroundColor: `${cor}18`, color: cor }}
            >
              <MapPin size={17} />
            </span>
            <div>
              <h3 className="text-sm font-black text-white sm:text-base">Capturar leads por região</h3>
              <p className="text-[11px] text-slate-500">
                Varredura no servidor · {usandoWebhookExterno() ? 'webhook configurado' : 'endpoint interno'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fechar}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* formulario */}
        <form onSubmit={executar} className="border-b border-slate-800 px-4 py-4 sm:px-6">
          <div className="grid gap-3 md:grid-cols-[1.6fr_1fr]">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Endereço, bairro ou cidade
              </label>
              <div className="relative">
                <MapPin size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  ref={primeiroCampo}
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Av. Afonso Pena, 1000, Uberlândia - MG"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none focus:border-[#10b981]"
                  maxLength={160}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">
                Raio de busca
              </label>
              <div className="flex overflow-hidden rounded-xl border border-slate-800">
                {RAIOS.map((opcao) => (
                  <button
                    key={opcao.valor}
                    type="button"
                    onClick={() => setRaio(opcao.valor)}
                    className={`flex-1 px-2 py-2.5 text-[11px] font-bold transition-colors ${
                      raio === opcao.valor ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opcao.rotulo}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {OBJETIVOS.map((opcao) => {
              const Icone = opcao.icone;
              const ativo = objetivo === opcao.id;
              return (
                <button
                  key={opcao.id}
                  type="button"
                  onClick={() => setObjetivo(opcao.id)}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    ativo ? 'border-transparent bg-white/5' : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                  style={ativo ? { borderColor: `${cor}66` } : undefined}
                >
                  <span
                    className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border"
                    style={
                      ativo
                        ? { borderColor: `${cor}55`, backgroundColor: `${cor}1a`, color: cor }
                        : { borderColor: '#1e293b', color: '#64748b' }
                    }
                  >
                    <Icone size={14} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-bold text-white">{opcao.titulo}</span>
                    <span className="block text-[11px] leading-snug text-slate-500">{opcao.texto}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500">
              A consulta roda no servidor. Nenhuma chave do Google passa pelo navegador.
            </p>
            <button
              type="submit"
              disabled={carregando || endereco.trim().length < 3}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-black text-slate-950 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: cor }}
            >
              {carregando ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {carregando ? 'Varrendo região…' : 'Executar Varredura'}
            </button>
          </div>
        </form>

        {/* estado / resultado */}
        <div className="max-h-[52vh] overflow-y-auto px-4 py-4 sm:px-6">
          {erro && (
            <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
              <p className="flex items-center gap-2 text-[12px] font-bold text-amber-300">
                <AlertTriangle size={13} />
                {erro.mensagem}
              </p>
              {erro.dica && <p className="mt-1 text-[11px] text-amber-200/70">{erro.dica}</p>}
              <p className="mt-1 text-[10px] uppercase tracking-wider text-amber-200/40">código: {erro.codigo}</p>
            </div>
          )}

          {avisoCrm && (
            <div className="mb-3 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-300">
              {avisoCrm}
            </div>
          )}

          {!resultado && !erro && (
            <div className="grid place-items-center rounded-xl border border-dashed border-slate-800 px-4 py-10 text-center">
              <MapPin size={22} className="mb-2 text-slate-600" />
              <p className="text-[12px] font-semibold text-slate-400">Nenhuma varredura ainda</p>
              <p className="mt-1 max-w-md text-[11px] text-slate-600">
                Informe o endereço e o raio. A varredura devolve nome, categoria, endereço, avaliação e contato de
                cada estabelecimento — pronto para virar lead no CRM.
              </p>
            </div>
          )}

          {resultado && (
            <>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-slate-400">
                  <span className="font-bold text-white">{resultado.total}</span> estabelecimentos em{' '}
                  <span className="text-slate-300">
                    {(resultado.centro && resultado.centro.enderecoFormatado) || endereco}
                  </span>{' '}
                  · raio {resultado.raio >= 1000 ? `${resultado.raio / 1000} km` : `${resultado.raio} m`}
                  {resultado.truncado && <span className="text-amber-400"> · lista truncada</span>}
                  {resultado.provedor === 'openstreetmap' && (
                    <span className="ml-2 rounded border border-slate-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      OpenStreetMap
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  {salvosCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                      <Check size={11} /> {salvosCount} no CRM
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={baixarCsv}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                  >
                    <Download size={12} /> Exportar CSV
                  </button>
                  <button
                    type="button"
                    onClick={salvarTodosVisiveis}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                  >
                    <Save size={12} /> Salvar página
                  </button>
                </div>
              </div>

              {resultado.avisos && resultado.avisos.length > 0 && (
                <p className="mb-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[11px] text-amber-300">
                  {resultado.avisos.join(' ')}
                </p>
              )}

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="bg-white/[0.03] text-[9px] uppercase tracking-widest text-slate-500">
                      <th className="px-3 py-2 font-black">Nome</th>
                      <th className="px-3 py-2 font-black">Categoria</th>
                      <th className="px-3 py-2 font-black">Endereço</th>
                      <th className="px-3 py-2 font-black">Avaliação</th>
                      <th className="px-3 py-2 font-black">Contato</th>
                      <th className="px-3 py-2 text-right font-black">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginados.itens.map((item) => {
                      const jaSalvo = Boolean(salvos[item.placeId]);
                      return (
                        <tr key={item.placeId} className="border-t border-slate-800/80 align-top">
                          <td className="px-3 py-2.5">
                            <p className="text-[12px] font-semibold text-white">{item.nome}</p>
                            <p className="text-[10px] text-slate-500">{rotuloStatus(item)}</p>
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-400">{item.categoria}</td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-400">{item.endereco || '—'}</td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-300">{rotuloAvaliacao(item)}</td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-400">
                            {item.telefone ? <span className="block text-slate-300">{item.telefone}</span> : null}
                            {item.site ? (
                              <a
                                href={item.site}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block truncate text-[10px] text-sky-400 hover:text-sky-300"
                              >
                                {item.site.replace(/^https?:\/\//, '').slice(0, 32)}
                              </a>
                            ) : null}
                            {!item.telefone && !item.site && <span className="text-slate-600">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => salvarNoCrm(item)}
                              disabled={jaSalvo || salvando === item.placeId}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
                                jaSalvo
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                  : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                              } disabled:cursor-default`}
                            >
                              {salvando === item.placeId ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : jaSalvo ? (
                                <Check size={11} />
                              ) : (
                                <Save size={11} />
                              )}
                              {jaSalvo ? 'No CRM' : 'Salvar no CRM'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500">
                  {paginados.total > 0
                    ? `${paginados.inicio + 1}–${Math.min(paginados.inicio + POR_PAGINA, paginados.total)} de ${
                        paginados.total
                      }`
                    : 'sem itens'}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={paginados.pagina <= 1}
                    className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[11px] text-slate-400">
                    {paginados.pagina} / {paginados.totalPaginas}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPagina((p) => Math.min(paginados.totalPaginas, p + 1))}
                    disabled={paginados.pagina >= paginados.totalPaginas}
                    className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:text-white disabled:opacity-30"
                    aria-label="Próxima página"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
