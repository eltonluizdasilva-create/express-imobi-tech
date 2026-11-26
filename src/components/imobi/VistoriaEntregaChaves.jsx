import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Key,
  FileCheck,
  ClipboardList,
  Gauge,
  Zap,
  Droplets,
  Flame,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Printer,
  Copy,
  Trash2,
  Plus,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  ShieldCheck,
  Camera,
  ExternalLink,
  Check,
} from 'lucide-react';
import {
  MODALIDADES_VISTORIA,
  STATUS_CHECKLIST,
  gerarChecklistInicial,
  calcularResumoChecklist,
  gerarTextoWhatsAppVistoria,
  publicarLaudoVistoria,
  validarVistoria,
} from '../../lib/vistoriaChaves';
import { vistoriasDemoChaves } from '../../lib/cenarioDemo';

export default function VistoriaEntregaChaves({
  oficinaId,
  propostaInicial = null,
  onVoltarParaPropostas,
}) {
  const [vistorias, setVistorias] = useState(vistoriasDemoChaves);
  const [vistoriaSelecionadaId, setVistoriaSelecionadaId] = useState(
    vistoriasDemoChaves[0]?.id || null
  );
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [visualizarImpressao, setVisualizarImpressao] = useState(false);
  // Espelho público no Portal do Cliente (D-23.37): código + PIN de 4 dígitos.
  const [publicandoPortal, setPublicandoPortal] = useState(false);
  const [laudoPublicado, setLaudoPublicado] = useState(null);

  // Form State
  const [form, setForm] = useState({
    id: null,
    modalidade: MODALIDADES_VISTORIA.ENTREGA_CHAVES_VENDA,
    codigoImovel: '',
    imovelTitulo: '',
    endereco: '',
    nomeCliente: '',
    telefone: '',
    nomeProprietario: '',
    corretor: '',
    creciCorretor: '',
    dataVistoria: new Date().toISOString().split('T')[0],
    qtdChaves: 2,
    qtdControles: 1,
    qtdTags: 1,
    obsChaves: '',
    medidores: {
      energiaNumero: '',
      energiaLeitura: '',
      aguaNumero: '',
      aguaLeitura: '',
      gasNumero: '',
      gasLeitura: '',
    },
    checklist: gerarChecklistInicial(),
    observacoesGerais: '',
  });

  // Carrega do Firestore quando oficinaId existir
  useEffect(() => {
    if (!oficinaId) return;
    try {
      const q = query(
        collection(db, 'oficinas', oficinaId, 'vistorias_chaves'),
        orderBy('dataVistoria', 'desc')
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          if (docs.length > 0) {
            setVistorias(docs);
            if (!vistoriaSelecionadaId) {
              setVistoriaSelecionadaId(docs[0].id);
            }
          }
        },
        (err) => console.warn('Aviso ao carregar vistorias:', err)
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Erro na subscrição de vistorias:', e);
    }
  }, [oficinaId]);

  // Se propostaInicial for fornecida, pré-preenche o formulário
  useEffect(() => {
    if (propostaInicial) {
      setForm((prev) => ({
        ...prev,
        id: null,
        modalidade: propostaInicial.modalidade?.toLowerCase().includes('loca')
          ? MODALIDADES_VISTORIA.ENTRADA_LOCACAO
          : MODALIDADES_VISTORIA.ENTREGA_CHAVES_VENDA,
        codigoImovel: propostaInicial.codigoImovel || '',
        imovelTitulo: propostaInicial.imovelTitulo || '',
        nomeCliente: propostaInicial.nomeCliente || '',
        telefone: propostaInicial.telefone || '',
        corretor: propostaInicial.corretor || '',
        checklist: gerarChecklistInicial(),
      }));
      setModoEdicao(true);
    }
  }, [propostaInicial]);

  // Vistoria ativa para visualização
  const vistoriaAtiva = useMemo(() => {
    if (modoEdicao) return form;
    return (
      (vistorias || []).find((v) => v.id === vistoriaSelecionadaId) ||
      vistorias[0] ||
      form
    );
  }, [vistorias, vistoriaSelecionadaId, modoEdicao, form]);

  const resumoAtivo = useMemo(() => {
    return calcularResumoChecklist(vistoriaAtiva.checklist || []);
  }, [vistoriaAtiva]);

  // Ações de Formulário
  const iniciarNovaVistoria = () => {
    setForm({
      id: null,
      modalidade: MODALIDADES_VISTORIA.ENTREGA_CHAVES_VENDA,
      codigoImovel: '',
      imovelTitulo: '',
      endereco: '',
      nomeCliente: '',
      telefone: '',
      nomeProprietario: '',
      corretor: '',
      creciCorretor: '',
      dataVistoria: new Date().toISOString().split('T')[0],
      qtdChaves: 2,
      qtdControles: 1,
      qtdTags: 1,
      obsChaves: '',
      medidores: {
        energiaNumero: '',
        energiaLeitura: '',
        aguaNumero: '',
        aguaLeitura: '',
        gasNumero: '',
        gasLeitura: '',
      },
      checklist: gerarChecklistInicial(),
      observacoesGerais: '',
    });
    setModoEdicao(true);
  };

  const editarVistoria = (vistoria) => {
    setForm({
      ...vistoria,
      medidores: vistoria.medidores || {
        energiaNumero: '',
        energiaLeitura: '',
        aguaNumero: '',
        aguaLeitura: '',
        gasNumero: '',
        gasLeitura: '',
      },
      checklist: Array.isArray(vistoria.checklist) && vistoria.checklist.length > 0
        ? vistoria.checklist
        : gerarChecklistInicial(),
    });
    setModoEdicao(true);
  };

  const salvarVistoria = async (e) => {
    if (e) e.preventDefault();
    const validacao = validarVistoria(form);
    if (!validacao.valido) {
      alert(validacao.erros.join('\n'));
      return;
    }

    setSalvando(true);
    try {
      const dados = {
        modalidade: form.modalidade,
        codigoImovel: form.codigoImovel || '',
        imovelTitulo: form.imovelTitulo.trim(),
        endereco: form.endereco.trim(),
        nomeCliente: form.nomeCliente.trim(),
        telefone: form.telefone.replace(/\D/g, ''),
        nomeProprietario: form.nomeProprietario.trim(),
        corretor: form.corretor.trim(),
        creciCorretor: form.creciCorretor.trim(),
        dataVistoria: form.dataVistoria,
        qtdChaves: Number(form.qtdChaves || 0),
        qtdControles: Number(form.qtdControles || 0),
        qtdTags: Number(form.qtdTags || 0),
        obsChaves: form.obsChaves.trim(),
        medidores: form.medidores,
        checklist: form.checklist,
        observacoesGerais: form.observacoesGerais.trim(),
        atualizadoEm: serverTimestamp(),
      };

      if (oficinaId) {
        if (form.id && !String(form.id).startsWith('vistoria_demo_')) {
          await updateDoc(
            doc(db, 'oficinas', oficinaId, 'vistorias_chaves', form.id),
            dados
          );
        } else {
          const docRef = await addDoc(
            collection(db, 'oficinas', oficinaId, 'vistorias_chaves'),
            { ...dados, criadoEm: serverTimestamp() }
          );
          setVistoriaSelecionadaId(docRef.id);
        }
      } else {
        const idLocal = form.id || `local_vistoria_${Date.now()}`;
        const itemLocal = { id: idLocal, ...dados };
        setVistorias((prev) => [
          itemLocal,
          ...prev.filter((p) => p.id !== idLocal),
        ]);
        setVistoriaSelecionadaId(idLocal);
      }

      setModoEdicao(false);
    } catch (err) {
      console.error('Erro ao salvar laudo de vistoria:', err);
      alert('Erro ao salvar laudo de vistoria: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const excluirVistoria = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este laudo de vistoria?')) return;
    try {
      if (oficinaId && !String(id).startsWith('vistoria_demo_')) {
        await deleteDoc(doc(db, 'oficinas', oficinaId, 'vistorias_chaves', id));
      }
      setVistorias((prev) => prev.filter((v) => v.id !== id));
      if (vistoriaSelecionadaId === id) {
        setVistoriaSelecionadaId(null);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const atualizarItemChecklist = (id, campo, valor) => {
    setForm((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item
      ),
    }));
  };

  const copiarWhatsApp = () => {
    const texto = gerarTextoWhatsAppVistoria(vistoriaAtiva);
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const imprimirLaudo = () => {
    window.print();
  };

  /**
   * D-23.37 — publica o laudo no Portal do Cliente.
   * O laudo continua privado em `oficinas/{oid}/vistorias_chaves`; o que o
   * cliente consulta em `/portal` é o espelho higienizado em
   * `acompanhamentos_publicos/{CODIGO_PIN}` (código + PIN de 4 dígitos).
   */
  const publicarNoPortal = async () => {
    if (!oficinaId) {
      alert('Abra a vistoria dentro de uma imobiliária (sessão autenticada) para publicar o laudo no portal.');
      return;
    }
    if (!vistoriaAtiva?.codigoImovel) {
      alert('Preencha o Código do Imóvel no laudo — é por ele que o cliente consulta o resultado no portal.');
      return;
    }

    setPublicandoPortal(true);
    try {
      const resultado = await publicarLaudoVistoria(db, {
        vistoria: vistoriaAtiva,
        tenantId: oficinaId,
      });
      setLaudoPublicado(resultado);
      if (!resultado.ok) {
        alert(
          'Não foi possível publicar o laudo no portal agora. ' +
            'O laudo continua salvo e a mensagem de WhatsApp com o resumo funciona normalmente.'
        );
      }
    } finally {
      setPublicandoPortal(false);
    }
  };

  const copiarAcessoPortal = () => {
    if (!laudoPublicado) return;
    const texto =
      `Laudo de vistoria disponível no Portal do Cliente.\n` +
      `Código: ${laudoPublicado.codigo}\n` +
      `PIN: ${laudoPublicado.senha}\n` +
      (laudoPublicado.link ? `${laudoPublicado.link}\n` : '') +
      `Em /portal abra "Status de Vistoria" e informe o código e o PIN.`;
    navigator.clipboard?.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#10b981]">
              <Key size={13} /> Vistoria & Laudo Digital
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
              VISTORIA DE ENTREGA DE CHAVES & <span style={{ color: '#10b981' }}>LAUDO DIGITAL</span>
            </h2>
            <p className="mt-2 text-xs md:text-sm text-zinc-400">
              Checklist de ambientes, corte de contas com medidores de consumo (energia, água, gás), inventário de chaves e controle de ressalvas com emissão de laudo impresso e WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onVoltarParaPropostas && (
              <button
                type="button"
                onClick={onVoltarParaPropostas}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <ArrowLeft size={14} /> Voltar para Propostas
              </button>
            )}

            {!modoEdicao ? (
              <button
                type="button"
                onClick={iniciarNovaVistoria}
                style={{ backgroundColor: '#10b981' }}
                className="px-5 py-2.5 rounded-xl text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:opacity-90 transition cursor-pointer"
              >
                <Plus size={15} /> Nova Vistoria
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setModoEdicao(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Cancelar Edição
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SELEÇÃO DE VISTORIAS SALVAS / MODO DE DEMONSTRAÇÃO */}
      {!modoEdicao && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-[#10b981]" />
            <span className="text-xs font-bold text-zinc-300">Laudos Registrados:</span>
            <div className="flex flex-wrap gap-1.5 ml-2">
              {(vistorias || []).map((v) => {
                const ativo = v.id === vistoriaSelecionadaId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVistoriaSelecionadaId(v.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      ativo
                        ? 'bg-[#10b981] text-slate-950 font-black'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                  >
                    <span>{v.codigoImovel || v.imovelTitulo?.slice(0, 16) || 'Vistoria'}</span>
                    <span className="text-[10px] opacity-75">({v.modalidade?.includes('Loca') ? 'Locação' : 'Venda'})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => editarVistoria(vistoriaAtiva)}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer"
            >
              Editar Laudo
            </button>
            <button
              type="button"
              onClick={copiarWhatsApp}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiado ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiado ? 'Copiado!' : 'Copiar WhatsApp'}</span>
            </button>
            <button
              type="button"
              onClick={publicarNoPortal}
              disabled={publicandoPortal}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <ExternalLink size={13} />
              <span>{publicandoPortal ? 'A publicar...' : 'Publicar no Portal'}</span>
            </button>
            <button
              type="button"
              onClick={imprimirLaudo}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={13} />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={() => excluirVistoria(vistoriaAtiva.id)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"
              title="Excluir vistoria"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ACESSO DO CLIENTE AO LAUDO NO PORTAL (D-23.37) */}
      {!modoEdicao && laudoPublicado && (
        <div
          role="status"
          className={`rounded-2xl border px-4 py-3 text-xs ${
            laudoPublicado.ok
              ? 'border-[#10b981]/40 bg-[#10b981]/10 text-emerald-200'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {laudoPublicado.ok ? 'Laudo publicado no Portal do Cliente.' : 'Laudo publicável, mas a nuvem não confirmou a gravação.'}{' '}
              Código <strong>{laudoPublicado.codigo}</strong> · PIN <strong>{laudoPublicado.senha}</strong> — o cliente consulta em{' '}
              <strong>/portal → Status de Vistoria</strong>.
            </span>
            <button
              type="button"
              onClick={copiarAcessoPortal}
              className="rounded-xl border border-current/40 px-3 py-1.5 font-bold transition hover:opacity-80 cursor-pointer"
            >
              Copiar acesso
            </button>
          </div>
        </div>
      )}

      {/* FORMULÁRIO DE EDIÇÃO / CRIAÇÃO */}
      {modoEdicao ? (
        <form onSubmit={salvarVistoria} className="space-y-6">
          {/* DADOS PRINCIPAIS & MODALIDADE */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#10b981] flex items-center gap-2">
              <Key size={15} /> 1. Identificação da Vistoria & Partes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Modalidade da Vistoria *</label>
                <select
                  value={form.modalidade}
                  onChange={(e) => setForm({ ...form, modalidade: e.target.value })}
                  className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                >
                  <option value={MODALIDADES_VISTORIA.ENTREGA_CHAVES_VENDA}>Entrega de Chaves — Venda</option>
                  <option value={MODALIDADES_VISTORIA.ENTRADA_LOCACAO}>Vistoria de Entrada — Locação</option>
                  <option value={MODALIDADES_VISTORIA.SAIDA_LOCACAO}>Vistoria de Saída — Locação</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Código do Imóvel</label>
                <input
                  type="text"
                  value={form.codigoImovel}
                  onChange={(e) => setForm({ ...form, codigoImovel: e.target.value })}
                  placeholder="Ex: IMB-3041"
                  className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Data da Vistoria *</label>
                <input
                  type="date"
                  required
                  value={form.dataVistoria}
                  onChange={(e) => setForm({ ...form, dataVistoria: e.target.value })}
                  className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Título do Imóvel *</label>
                <input
                  type="text"
                  required
                  value={form.imovelTitulo}
                  onChange={(e) => setForm({ ...form, imovelTitulo: e.target.value })}
                  placeholder="Ex: Apartamento 3 Suítes — Residencial Jardins"
                  className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  placeholder="Rua, número, complemento, bairro, cidade/UF"
                  className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Comprador / Locatário *</label>
                <input
                  type="text"
                  required
                  value={form.nomeCliente}
                  onChange={(e) => setForm({ ...form, nomeCliente: e.target.value })}
                  placeholder="Nome do cliente receptor"
                  className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">WhatsApp / Telefone</label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Vendedor / Locador</label>
                <input
                  type="text"
                  value={form.nomeProprietario}
                  onChange={(e) => setForm({ ...form, nomeProprietario: e.target.value })}
                  placeholder="Nome do proprietário"
                  className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Corretor / CRECI</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.corretor}
                    onChange={(e) => setForm({ ...form, corretor: e.target.value })}
                    placeholder="Nome"
                    className="w-2/3 p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                  />
                  <input
                    type="text"
                    value={form.creciCorretor}
                    onChange={(e) => setForm({ ...form, creciCorretor: e.target.value })}
                    placeholder="CRECI"
                    className="w-1/3 p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* INVENTÁRIO DE CHAVES & ACESSOS */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#10b981] flex items-center gap-2">
              <Key size={15} /> 2. Inventário de Chaves, Controles & Senhas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Chaves Físicas (un)</label>
                <input
                  type="number"
                  min="0"
                  value={form.qtdChaves}
                  onChange={(e) => setForm({ ...form, qtdChaves: e.target.value })}
                  className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Controles Remotos (un)</label>
                <input
                  type="number"
                  min="0"
                  value={form.qtdControles}
                  onChange={(e) => setForm({ ...form, qtdControles: e.target.value })}
                  className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Tags / Senhas Digitais (un)</label>
                <input
                  type="number"
                  min="0"
                  value={form.qtdTags}
                  onChange={(e) => setForm({ ...form, qtdTags: e.target.value })}
                  className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Observações de Acessos</label>
                <input
                  type="text"
                  value={form.obsChaves}
                  onChange={(e) => setForm({ ...form, obsChaves: e.target.value })}
                  placeholder="Ex: 2 chaves tetra da porta principal, controle PPA..."
                  className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* LEITURA DE MEDIDORES / CORTE DE CONTAS */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#10b981] flex items-center gap-2">
              <Gauge size={15} /> 3. Leitura de Medidores (Corte de Contas Concessionárias)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Energia */}
              <div className="bg-[#020408] border border-zinc-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <Zap size={14} /> Energia Elétrica (kWh)
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-zinc-500">Nº do Medidor / Instalação</label>
                  <input
                    type="text"
                    value={form.medidores.energiaNumero}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        medidores: { ...form.medidores, energiaNumero: e.target.value },
                      })
                    }
                    placeholder="Ex: MED-784912"
                    className="w-full p-2.5 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-zinc-500">Leitura Atual (kWh)</label>
                  <input
                    type="text"
                    value={form.medidores.energiaLeitura}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        medidores: { ...form.medidores, energiaLeitura: e.target.value },
                      })
                    }
                    placeholder="Ex: 14280"
                    className="w-full p-2.5 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Água */}
              <div className="bg-[#020408] border border-zinc-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
                  <Droplets size={14} /> Água / Saneamento (m³)
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-zinc-500">Nº do Hidrômetro</label>
                  <input
                    type="text"
                    value={form.medidores.aguaNumero}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        medidores: { ...form.medidores, aguaNumero: e.target.value },
                      })
                    }
                    placeholder="Ex: HID-33019"
                    className="w-full p-2.5 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-zinc-500">Leitura Atual (m³)</label>
                  <input
                    type="text"
                    value={form.medidores.aguaLeitura}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        medidores: { ...form.medidores, aguaLeitura: e.target.value },
                      })
                    }
                    placeholder="Ex: 318"
                    className="w-full p-2.5 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Gás */}
              <div className="bg-[#020408] border border-zinc-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                  <Flame size={14} /> Gás Canalizado (m³)
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-zinc-500">Nº do Relógio / Botijão</label>
                  <input
                    type="text"
                    value={form.medidores.gasNumero}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        medidores: { ...form.medidores, gasNumero: e.target.value },
                      })
                    }
                    placeholder="Ex: GAS-99120 ou N/A (Botijão)"
                    className="w-full p-2.5 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-zinc-500">Leitura Atual (m³)</label>
                  <input
                    type="text"
                    value={form.medidores.gasLeitura}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        medidores: { ...form.medidores, gasLeitura: e.target.value },
                      })
                    }
                    placeholder="Ex: 104"
                    className="w-full p-2.5 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CHECKLIST DE 7 AMBIENTES */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#10b981] flex items-center gap-2">
                <ClipboardList size={15} /> 4. Checklist Padronizado de Ambientes (7 Áreas Críticas)
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-zinc-400">
                  Aprovados: <strong className="text-emerald-400">{resumoAtivo.aprovados}</strong>/7
                </span>
                {resumoAtivo.ressalvas > 0 && (
                  <span className="text-amber-400">Ressalvas: {resumoAtivo.ressalvas}</span>
                )}
                {resumoAtivo.pendentes > 0 && (
                  <span className="text-rose-400">Pendentes: {resumoAtivo.pendentes}</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {form.checklist.map((item) => {
                return (
                  <div
                    key={item.id}
                    className="bg-[#020408] border border-zinc-800 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-black text-white">{item.ambiente}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            atualizarItemChecklist(item.id, 'status', STATUS_CHECKLIST.APROVADO)
                          }
                          className={`px-3 py-1 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                            item.status === STATUS_CHECKLIST.APROVADO
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <CheckCircle2 size={12} /> Aprovado
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            atualizarItemChecklist(item.id, 'status', STATUS_CHECKLIST.COM_RESSALVA)
                          }
                          className={`px-3 py-1 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                            item.status === STATUS_CHECKLIST.COM_RESSALVA
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <AlertTriangle size={12} /> Com Ressalva
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            atualizarItemChecklist(item.id, 'status', STATUS_CHECKLIST.REPARO_PENDENTE)
                          }
                          className={`px-3 py-1 rounded-lg text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                            item.status === STATUS_CHECKLIST.REPARO_PENDENTE
                              ? 'bg-rose-500 text-slate-950 font-black'
                              : 'bg-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <XCircle size={12} /> Reparo Pendente
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="md:col-span-2">
                        <input
                          type="text"
                          value={item.observacao}
                          onChange={(e) =>
                            atualizarItemChecklist(item.id, 'observacao', e.target.value)
                          }
                          placeholder={`Observações detalhadas sobre ${item.ambiente}...`}
                          className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={item.fotoUrl}
                          onChange={(e) =>
                            atualizarItemChecklist(item.id, 'fotoUrl', e.target.value)
                          }
                          placeholder="Link da foto/evidência (opcional)"
                          className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-400"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* OBSERVAÇÕES GERAIS E SALVAMENTO */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">
                Observações Gerais do Termo de Vistoria
              </label>
              <textarea
                rows="3"
                value={form.observacoesGerais}
                onChange={(e) => setForm({ ...form, observacoesGerais: e.target.value })}
                placeholder="Ex: Imóvel entregue pintado e com armários higienizados. Prazo de 7 dias úteis para contestação de vícios ocultos..."
                className="w-full p-3 bg-[#020408] border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setModoEdicao(false)}
                className="px-5 py-3 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                style={{ backgroundColor: '#10b981' }}
                className="px-8 py-3 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider hover:opacity-95 transition cursor-pointer"
              >
                {salvando ? 'Salvando...' : 'Salvar Laudo de Vistoria'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* PAINEL DE VISUALIZAÇÃO EXECUTIVA & LAUDO IMPRESSO */
        <div className="space-y-6">
          {/* PAINEL DE RESUMO E INDICADORES */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5">
              <p className="text-[10px] font-bold uppercase text-zinc-400">Modalidade</p>
              <p className="text-sm font-black text-white mt-1">{vistoriaAtiva.modalidade}</p>
              <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
                <Calendar size={13} className="text-[#10b981]" /> {vistoriaAtiva.dataVistoria}
              </p>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5">
              <p className="text-[10px] font-bold uppercase text-zinc-400">Conformidade Geral</p>
              <div className="flex items-baseline gap-2 mt-1">
                <p style={{ color: '#10b981' }} className="text-2xl font-black">
                  {resumoAtivo.percentualAprovado}%
                </p>
                <span className="text-xs text-zinc-400">({resumoAtivo.aprovados}/7 aprovados)</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-[#10b981] transition-all"
                  style={{ width: `${resumoAtivo.percentualAprovado}%` }}
                />
              </div>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5">
              <p className="text-[10px] font-bold uppercase text-zinc-400">Chaves & Acessos</p>
              <p className="text-xl font-black text-white mt-1">
                {vistoriaAtiva.qtdChaves ?? 1} Chave(s)
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                {vistoriaAtiva.qtdControles ?? 0} Controles • {vistoriaAtiva.qtdTags ?? 0} Tags
              </p>
            </div>

            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5">
              <p className="text-[10px] font-bold uppercase text-zinc-400">Apontamentos</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                  {resumoAtivo.ressalvas} Ressalvas
                </span>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold">
                  {resumoAtivo.pendentes} Pendentes
                </span>
              </div>
            </div>
          </div>

          {/* LAUDO ESTRUTURADO PARA IMPRESSÃO / VISUALIZAÇÃO (com suporte a window.print()) */}
          <div
            id="area-laudo-impresso"
            className="rounded-3xl border border-zinc-800 bg-zinc-900/90 p-6 md:p-8 space-y-6 text-slate-100"
          >
            {/* CABEÇALHO DO LAUDO */}
            <div className="border-b border-zinc-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-[#020408] text-[#10b981] border border-[#10b981]/30">
                  {vistoriaAtiva.modalidade}
                </span>
                <h3 className="text-xl md:text-2xl font-black text-white mt-2">
                  {vistoriaAtiva.imovelTitulo}
                </h3>
                {vistoriaAtiva.endereco && (
                  <p className="text-xs text-zinc-400 mt-1">{vistoriaAtiva.endereco}</p>
                )}
              </div>

              <div className="text-left md:text-right text-xs space-y-1 text-zinc-400">
                <p>Data do Laudo: <strong className="text-white">{vistoriaAtiva.dataVistoria}</strong></p>
                <p>Código Imóvel: <strong className="text-[#10b981]">{vistoriaAtiva.codigoImovel || 'S/C'}</strong></p>
                <p>Vistoriador: <strong className="text-white">{vistoriaAtiva.corretor || 'Equipe Imobiliária'}</strong> {vistoriaAtiva.creciCorretor ? `(${vistoriaAtiva.creciCorretor})` : ''}</p>
              </div>
            </div>

            {/* PARTES INTERESSADAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#020408] border border-zinc-800 rounded-2xl p-4 text-xs">
              <div>
                <p className="text-[9px] uppercase font-bold text-zinc-500">Destinatário / Titular Receptor</p>
                <p className="font-bold text-white text-sm mt-0.5">{vistoriaAtiva.nomeCliente || 'Não informado'}</p>
                {vistoriaAtiva.telefone && <p className="text-zinc-400">{vistoriaAtiva.telefone}</p>}
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-zinc-500">Proprietário / Vendedor / Locador</p>
                <p className="font-bold text-white text-sm mt-0.5">{vistoriaAtiva.nomeProprietario || 'Proprietário Cadastrado'}</p>
              </div>
            </div>

            {/* MEDIDORES E CHAVES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Medidores */}
              <div className="bg-[#020408] border border-zinc-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-[#10b981] flex items-center gap-1.5">
                  <Gauge size={13} /> Leitura dos Medidores (Corte de Contas)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                    <span className="text-zinc-400 flex items-center gap-1.5"><Zap size={13} className="text-amber-400" /> Energia Elétrica:</span>
                    <span className="font-bold text-white">
                      Medidor {vistoriaAtiva.medidores?.energiaNumero || 'S/N'} • <strong className="text-[#10b981]">{vistoriaAtiva.medidores?.energiaLeitura || '0'} kWh</strong>
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                    <span className="text-zinc-400 flex items-center gap-1.5"><Droplets size={13} className="text-sky-400" /> Água / Hidrômetro:</span>
                    <span className="font-bold text-white">
                      Hidrômetro {vistoriaAtiva.medidores?.aguaNumero || 'S/N'} • <strong className="text-sky-400">{vistoriaAtiva.medidores?.aguaLeitura || '0'} m³</strong>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 flex items-center gap-1.5"><Flame size={13} className="text-rose-400" /> Gás Canalizado:</span>
                    <span className="font-bold text-white">
                      Relógio {vistoriaAtiva.medidores?.gasNumero || 'S/N'} • <strong className="text-rose-400">{vistoriaAtiva.medidores?.gasLeitura || 'N/A'} m³</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Inventário de Chaves */}
              <div className="bg-[#020408] border border-zinc-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-[#10b981] flex items-center gap-1.5">
                  <Key size={13} /> Inventário de Chaves & Dispositivos
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5">
                    <p className="text-[9px] uppercase font-bold text-zinc-500">Chaves</p>
                    <p className="text-base font-black text-white">{vistoriaAtiva.qtdChaves ?? 1}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5">
                    <p className="text-[9px] uppercase font-bold text-zinc-500">Controles</p>
                    <p className="text-base font-black text-white">{vistoriaAtiva.qtdControles ?? 0}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5">
                    <p className="text-[9px] uppercase font-bold text-zinc-500">Tags</p>
                    <p className="text-base font-black text-white">{vistoriaAtiva.qtdTags ?? 0}</p>
                  </div>
                </div>
                {vistoriaAtiva.obsChaves && (
                  <p className="text-xs text-zinc-400 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                    {vistoriaAtiva.obsChaves}
                  </p>
                )}
              </div>
            </div>

            {/* TABELA DE CHECKLIST DOS 7 AMBIENTES */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-[#10b981] flex items-center gap-1.5">
                <ClipboardList size={13} /> Detalhamento dos Ambientes
              </h4>
              <div className="border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#020408] text-zinc-400 border-b border-zinc-800 uppercase text-[9px] font-black">
                    <tr>
                      <th className="py-2.5 px-4">Ambiente</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Observação / Laudo Técnico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {(vistoriaAtiva.checklist || []).map((amb) => {
                      const isAprovado = amb.status === STATUS_CHECKLIST.APROVADO;
                      const isRessalva = amb.status === STATUS_CHECKLIST.COM_RESSALVA;
                      return (
                        <tr key={amb.id} className="hover:bg-zinc-900/40">
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                            {amb.ambiente}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${
                                isAprovado
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : isRessalva
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {amb.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-300">
                            {amb.observacao || <span className="text-zinc-500 italic">Sem ressalvas registradas</span>}
                            {amb.fotoUrl && (
                              <div className="mt-1">
                                <a
                                  href={amb.fotoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-[#10b981] hover:underline inline-flex items-center gap-1"
                                >
                                  <Camera size={11} /> Ver foto/evidência
                                </a>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* OBSERVAÇÕES FINAIS */}
            {vistoriaAtiva.observacoesGerais && (
              <div className="bg-[#020408] border border-zinc-800 rounded-2xl p-4 text-xs">
                <p className="text-[9px] uppercase font-bold text-zinc-500">Observações & Cláusulas Complementares</p>
                <p className="text-zinc-300 mt-1">{vistoriaAtiva.observacoesGerais}</p>
              </div>
            )}

            {/* BLOCO DE 3 ASSINATURAS */}
            <div className="pt-8 border-t border-zinc-800">
              <p className="text-[10px] text-center text-zinc-400 mb-8 uppercase font-bold tracking-wider">
                As partes declaram ciência e pleno acordo com as condições físicas e leituras descritas neste termo:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-zinc-700 pb-2 mb-1.5" />
                  <p className="font-bold text-white">{vistoriaAtiva.nomeProprietario || 'Proprietário / Vendedor'}</p>
                  <p className="text-[10px] text-zinc-500">Vendedor / Locador</p>
                </div>

                <div>
                  <div className="border-b border-zinc-700 pb-2 mb-1.5" />
                  <p className="font-bold text-white">{vistoriaAtiva.nomeCliente || 'Comprador / Locatário'}</p>
                  <p className="text-[10px] text-zinc-500">Comprador / Inquilino</p>
                </div>

                <div>
                  <div className="border-b border-zinc-700 pb-2 mb-1.5" />
                  <p className="font-bold text-white">{vistoriaAtiva.corretor || 'Corretor / Vistoriador'}</p>
                  <p className="text-[10px] text-zinc-500">Responsável Técnico {vistoriaAtiva.creciCorretor ? `• ${vistoriaAtiva.creciCorretor}` : ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ESTILO GLOBAL PARA IMPRESSÃO EM FOLHA LIMPA */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #area-laudo-impresso, #area-laudo-impresso * {
            visibility: visible;
          }
          #area-laudo-impresso {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background-color: white !important;
            color: black !important;
            border: none !important;
            padding: 10px !important;
          }
          #area-laudo-impresso h3,
          #area-laudo-impresso h4,
          #area-laudo-impresso strong,
          #area-laudo-impresso p,
          #area-laudo-impresso td,
          #area-laudo-impresso th {
            color: black !important;
          }
          #area-laudo-impresso table {
            border: 1px solid #ccc !important;
          }
          #area-laudo-impresso th {
            background-color: #f3f4f6 !important;
          }
        }
      `}</style>
    </div>
  );
}
