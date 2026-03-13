/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { db } from './lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useOficina } from "./components/OficinaContext"
// ─── CORES ───────────────────────────────────────────────
const COR = '#06b6d4';       // ciano — identidade visual Lava Jato
const COR2 = '#0891b2';
const GREEN = '#00E676';
const MAIN_COLOR = '#FF0033';

// ─── HELPERS ─────────────────────────────────────────────
const normalizarPlaca = (v) => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const formatarMoeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const comprimirFoto = (base64, qualidade = 0.5) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 800;
      const scale = img.width > MAX ? MAX / img.width : 1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', qualidade));
    };
    img.src = base64;
  });

// ─── CATÁLOGO DE SERVIÇOS ─────────────────────────────────
const SERVICOS_CATALOGO = [
  { key: 'lavagem_simples',      label: '🚿 Lavagem Simples',        desc: 'Externa + rodas + enxágue',           cor: '#22d3ee' },
  { key: 'lavagem_completa',     label: '🧼 Lavagem Completa',        desc: 'Externa + interna + aspiração',        cor: '#06b6d4' },
  { key: 'polimento',            label: '✨ Polimento',               desc: 'Remove riscos e oxidação',             cor: '#a78bfa' },
  { key: 'cristalizacao',        label: '💎 Cristalização',           desc: 'Proteção e brilho duradouro',          cor: '#818cf8' },
  { key: 'higienizacao_interna', label: '🪑 Higienização Interna',    desc: 'Bancos, tapetes, teto e painel',       cor: '#34d399' },
  { key: 'lavagem_motor',        label: '⚙️ Lavagem de Motor',        desc: 'Desengordurante + jato de pressão',    cor: '#fb923c' },
  { key: 'cera',                 label: '🌟 Enceramento / Cera',      desc: 'Proteção da pintura',                  cor: '#facc15' },
  { key: 'higienizacao_ar',      label: '❄️ Higienização do AC',      desc: 'Limpeza do sistema de ar',             cor: '#7dd3fc' },
  { key: 'descontaminacao',      label: '🧪 Descontaminação',         desc: 'Remove ferrugem e contaminantes',      cor: '#f472b6' },
  { key: 'ppf',                  label: '🛡️ Película PPF',            desc: 'Proteção de pintura em película',      cor: '#c4b5fd' },
];

const CATEGORIAS_VEICULO = ['🚗 Carro Pequeno', '🚙 Carro Médio', '🚕 Carro Grande / SUV', '🚐 Van / Utilitário', '🏍️ Moto', '🚚 Caminhão'];

const STATUS_FILA = {
  aguardando:  { label: '⏳ Aguardando',   cor: '#f59e0b', bg: '#1a1200' },
  em_lavagem:  { label: '🚿 Em Lavagem',   cor: '#06b6d4', bg: '#001a1f' },
  finalizado:  { label: '✅ Finalizado',   cor: '#00E676', bg: '#001a0a' },
  entregue:    { label: '🏁 Entregue',     cor: '#888',    bg: '#111'    },
};

const FORM_VAZIO = {
  nomeCliente: '', placa: '', telefone: '', modelo: '',
  categoria: '🚗 Carro Pequeno', servicos: [],
  valorTotal: '', obs: '', fotos: [], horaEntrada: '',
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────
export default function LavaJato({ setAbaAtiva, planosSistema, carregarOS }) {
  const { oficinaId } = useOficina() || {};

  // Estados principais
  const [fila, setFila] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [subAba, setSubAba] = useState('fila');
  const [todasOS, setTodasOS] = useState([]);
  const [autoFillMsg, setAutoFillMsg] = useState(false);

  // Form
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [legendaFoto, setLegendaFoto] = useState('');

  // ── Carregar dados ──
  const carregarLavaJato = async () => {
    if (!oficinaId) return;
    setCarregando(true);
    try {
      const snap = await getDocs(collection(db, 'oficinas', oficinaId, 'lavajato'));
      const todos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.data_registro || 0) - new Date(a.data_registro || 0));
      setFila(todos.filter(o => o.status !== 'entregue'));
      setHistorico(todos.filter(o => o.status === 'entregue'));
    } catch (e) { console.error(e); }
    finally { setCarregando(false); }
  };

  useEffect(() => { carregarLavaJato(); carregarTodasOS(); }, [oficinaId]);

  const carregarTodasOS = async () => {
    if (!oficinaId) return;
    try {
      const snap = await getDocs(collection(db, 'oficinas', oficinaId, 'os'));
      setTodasOS(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {}
  };

  const buscarPorPlaca = (placaDigitada) => {
    const placaNorm = normalizarPlaca(placaDigitada);
    if (placaNorm.length < 7) return;
    const match = todasOS
      .filter(o => normalizarPlaca(o.placa) === placaNorm)
      .sort((a, b) => new Date(b.data_registro || 0) - new Date(a.data_registro || 0))[0];
    if (match) {
      setForm(p => ({
        ...p,
        nomeCliente: p.nomeCliente || match.nomeCliente || '',
        telefone:    p.telefone    || match.telefone    || '',
        modelo:      p.modelo      || match.modelo      || '',
      }));
      setAutoFillMsg(true);
      setTimeout(() => setAutoFillMsg(false), 4000);
    }
  };

  // ── Calcular total automático ──
  useEffect(() => {
    if (form.servicos.length === 0) return;
    // Se preços estiverem no planosSistema, usa; caso contrário não auto-preenche
    // (mecânico define o valor manualmente)
  }, [form.servicos]);

  // ── Salvar / Atualizar ──
  const salvar = async () => {
    if (!form.placa && !form.nomeCliente) return alert('⚠️ Informe a Placa ou Nome do Cliente!');
    if (form.servicos.length === 0) return alert('⚠️ Selecione ao menos 1 serviço!');
    setSalvando(true);
    try {
      const servicosTexto = form.servicos
        .map(k => SERVICOS_CATALOGO.find(s => s.key === k)?.label || k)
        .join(', ');
      const dados = {
        ...form,
        placa: normalizarPlaca(form.placa),
        servicosTexto,
        valorTotal: Number(form.valorTotal) || 0,
        status: editandoId ? form.status : 'aguardando',
        horaEntrada: form.horaEntrada || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        // também salva como OS para aparecer no histórico global
        tipoServico: 'lavajato',
        checklist: servicosTexto,
        nomeCliente: form.nomeCliente,
        modelo: form.modelo,
        telefone: form.telefone,
        valorPecas: 0,
        valorMaoObra: Number(form.valorTotal) || 0,
        total: Number(form.valorTotal) || 0,
        detalhesPecas: form.obs,
        fotos: form.fotos,
        origem: 'lavajato',
      };

      if (editandoId) {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'lavajato', editandoId), dados);
        // Atualiza OS global se existir
        if (form.osId) {
          await updateDoc(doc(db, 'oficinas', oficinaId, 'os', form.osId), dados);
        }
        setEditandoId(null);
      } else {
        // Salva na coleção lavajato
        const ref = await addDoc(collection(db, 'oficinas', oficinaId, 'lavajato'), {
          ...dados, data_registro: new Date().toISOString()
        });
        // Salva também na coleção OS (integração total)
        const osRef = await addDoc(collection(db, 'oficinas', oficinaId, 'os'), {
          ...dados, statusPagamento: 'pendente', data_registro: new Date().toISOString()
        });
        // Guarda referência cruzada
        await updateDoc(doc(db, 'oficinas', oficinaId, 'lavajato', ref.id), { osId: osRef.id });

        setSalvo(true);
        setTimeout(() => setSalvo(false), 3000);
      }

      setForm(FORM_VAZIO);
      carregarLavaJato();
      if (carregarOS) carregarOS();
      setSubAba('fila');
    } catch (e) { alert('Erro: ' + e.message); }
    finally { setSalvando(false); }
  };

  // ── Mudar status na fila ──
  const mudarStatus = async (item, novoStatus) => {
    try {
      await updateDoc(doc(db, 'oficinas', oficinaId, 'lavajato', item.id), { status: novoStatus });
      if (item.osId) {
        await updateDoc(doc(db, 'oficinas', oficinaId, 'os', item.osId), {
          statusPagamento: novoStatus === 'entregue' ? 'pago' : 'pendente'
        });
      }
      carregarLavaJato();
    } catch (e) { alert('Erro: ' + e.message); }
  };

  // ── Editar ──
  const abrirEdicao = (item) => {
    setForm({ ...FORM_VAZIO, ...item });
    setEditandoId(item.id);
    setSubAba('novo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── WhatsApp pronto ──
  const enviarWhatsApp = (item) => {
    if (!item.telefone) return alert('Sem WhatsApp cadastrado!');
    const msg =
      `🚿 *Lava Jato — ${item.nomeCliente || 'Cliente'}*\n\n` +
      `🚗 ${item.modelo || 'Veículo'} | Placa: *${item.placa}*\n` +
      `✅ Serviços: ${item.servicosTexto}\n` +
      `💰 Total: *${formatarMoeda(item.valorTotal)}*\n\n` +
      `Seu veículo está pronto! 🎉`;
    const tel = item.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ── Foto ──
  const adicionarFoto = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onloadend = async () => {
      const c = await comprimirFoto(r.result);
      setForm(p => ({ ...p, fotos: [...(p.fotos || []), { foto: c, legenda: legendaFoto, dataEnvio: new Date().toLocaleString('pt-BR') }] }));
      setLegendaFoto('');
    };
    r.readAsDataURL(f);
  };

  // ── Stats ──
  const stats = useMemo(() => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const filaNums = {
      aguardando: fila.filter(i => i.status === 'aguardando').length,
      em_lavagem: fila.filter(i => i.status === 'em_lavagem').length,
      finalizado: fila.filter(i => i.status === 'finalizado').length,
    };
    const receitaHoje = [...fila, ...historico]
      .filter(i => {
        const d = i.data_registro ? new Date(i.data_registro).toLocaleDateString('pt-BR') : '';
        return d === hoje && (i.status === 'finalizado' || i.status === 'entregue');
      })
      .reduce((acc, i) => acc + Number(i.valorTotal || 0), 0);
    return { ...filaNums, receitaHoje };
  }, [fila, historico]);

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div style={{ color: 'white', fontFamily: 'sans-serif' }}>

      {/* ── Toast auto-fill ── */}
      {autoFillMsg && (
        <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', background: '#00E676', color: 'black', padding: '12px 24px', borderRadius: '30px', fontWeight: '900', fontSize: '13px', zIndex: 9999, boxShadow: '0 4px 20px #00E67666', whiteSpace: 'nowrap' }}>
          ✅ Cliente encontrado! Dados preenchidos automaticamente.
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background: `linear-gradient(135deg, ${COR}22, transparent)`, border: `1px solid ${COR}44`, borderRadius: '14px', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, color: COR, fontSize: '22px', fontWeight: '900' }}>🚿 Lava Jato</h2>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '13px' }}>Fila de serviços, histórico e O.S. integrada</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: '⏳ Aguardando', val: stats.aguardando, cor: '#f59e0b' },
            { label: '🚿 Lavando', val: stats.em_lavagem, cor: COR },
            { label: '✅ Prontos', val: stats.finalizado, cor: GREEN },
            { label: '💰 Hoje', val: formatarMoeda(stats.receitaHoje), cor: GREEN },
          ].map((s, i) => (
            <div key={i} style={{ background: '#111', border: `1px solid ${s.cor}33`, borderRadius: '10px', padding: '10px 16px', textAlign: 'center', minWidth: '80px' }}>
              <p style={{ margin: 0, color: s.cor, fontWeight: '900', fontSize: '18px' }}>{s.val}</p>
              <p style={{ margin: '2px 0 0 0', color: '#666', fontSize: '10px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SUB-ABAS ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'fila', label: `🚿 Fila (${fila.length})` },
          { key: 'novo', label: editandoId ? '✏️ Editando' : '➕ Novo Serviço' },
          { key: 'historico', label: `📋 Histórico (${historico.length})` },
        ].map(s => (
          <button key={s.key} onClick={() => { setSubAba(s.key); if (s.key !== 'novo') { setForm(FORM_VAZIO); setEditandoId(null); } }}
            style={{ padding: '10px 20px', background: subAba === s.key ? COR : '#1a1a1a', color: subAba === s.key ? 'black' : '#888', border: `1px solid ${subAba === s.key ? COR : '#333'}`, borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════
          SUB-ABA: FILA
      ══════════════════════════════════ */}
      {subAba === 'fila' && (
        <div>
          {carregando ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>⏳ Carregando fila...</div>
          ) : fila.length === 0 ? (
            <div style={{ background: '#111', border: '1px dashed #333', borderRadius: '14px', padding: '50px', textAlign: 'center' }}>
              <p style={{ fontSize: '50px', margin: '0 0 12px 0' }}>🚿</p>
              <p style={{ color: '#555', margin: 0, fontSize: '15px' }}>Nenhum veículo na fila agora</p>
              <button onClick={() => setSubAba('novo')} style={{ marginTop: '16px', padding: '12px 24px', background: COR, color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                + Adicionar à Fila
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {fila.map(item => {
                const st = STATUS_FILA[item.status] || STATUS_FILA.aguardando;
                return (
                  <div key={item.id} style={{ background: st.bg, border: `1px solid ${st.cor}44`, borderRadius: '14px', padding: '16px', borderLeft: `4px solid ${st.cor}` }}>

                    {/* Topo do card */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ background: st.cor + '33', color: st.cor, padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{st.label}</span>
                          {item.horaEntrada && <span style={{ color: '#666', fontSize: '11px' }}>⏰ {item.horaEntrada}</span>}
                        </div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>{item.nomeCliente || 'Cliente'}</p>
                        <p style={{ margin: '2px 0 0 0', color: COR, fontWeight: '900', fontSize: '18px', letterSpacing: '1px' }}>{item.placa}</p>
                        <p style={{ margin: '2px 0 0 0', color: '#888', fontSize: '12px' }}>{item.modelo} · {item.categoria}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, color: GREEN, fontWeight: '900', fontSize: '20px' }}>{formatarMoeda(item.valorTotal)}</p>
                        {item.osId && <p style={{ margin: '2px 0 0 0', color: '#444', fontSize: '10px' }}>O.S. gerada ✅</p>}
                      </div>
                    </div>

                    {/* Serviços */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {(item.servicos || []).map(k => {
                        const s = SERVICOS_CATALOGO.find(x => x.key === k);
                        return s ? (
                          <span key={k} style={{ background: s.cor + '22', color: s.cor, border: `1px solid ${s.cor}44`, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                            {s.label}
                          </span>
                        ) : null;
                      })}
                    </div>

                    {/* Obs */}
                    {item.obs && <p style={{ color: '#666', fontSize: '12px', margin: '0 0 12px 0', fontStyle: 'italic' }}>📝 {item.obs}</p>}

                    {/* Botões de status */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {item.status !== 'em_lavagem' && item.status !== 'finalizado' && item.status !== 'entregue' && (
                        <button onClick={() => mudarStatus(item, 'em_lavagem')}
                          style={{ padding: '8px 14px', background: COR + '33', color: COR, border: `1px solid ${COR}`, borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                          🚿 Iniciar Lavagem
                        </button>
                      )}
                      {item.status === 'em_lavagem' && (
                        <button onClick={() => mudarStatus(item, 'finalizado')}
                          style={{ padding: '8px 14px', background: GREEN + '33', color: GREEN, border: `1px solid ${GREEN}`, borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                          ✅ Marcar como Pronto
                        </button>
                      )}
                      {item.status === 'finalizado' && (
                        <button onClick={() => mudarStatus(item, 'entregue')}
                          style={{ padding: '8px 14px', background: '#88888833', color: '#aaa', border: '1px solid #555', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                          🏁 Entregar / Fechar
                        </button>
                      )}
                      {item.telefone && (
                        <button onClick={() => enviarWhatsApp(item)}
                          style={{ padding: '8px 14px', background: '#25D36633', color: '#25D366', border: '1px solid #25D366', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                          💬 Avisar Cliente
                        </button>
                      )}
                      <button onClick={() => abrirEdicao(item)}
                        style={{ padding: '8px 14px', background: '#33333333', color: '#888', border: '1px solid #444', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                        ✏️ Editar
                      </button>
                    </div>

                    {/* Fotos miniaturas */}
                    {item.fotos && item.fotos.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {item.fotos.map((f, i) => (
                          <div key={i} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #333' }}>
                            <img src={f.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════
          SUB-ABA: NOVO SERVIÇO / EDITAR
      ══════════════════════════════════ */}
      {subAba === 'novo' && (
        <div>
          {editandoId && (
            <div style={{ background: '#1a1500', border: `2px solid ${COR}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: COR, fontWeight: 'bold', fontSize: '13px' }}>✏️ EDITANDO — {form.placa || form.nomeCliente}</span>
              <button onClick={() => { setForm(FORM_VAZIO); setEditandoId(null); }} style={{ background: 'transparent', color: '#888', border: '1px solid #444', padding: '5px 12px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>✕ Cancelar</button>
            </div>
          )}

          {/* ── Dados do cliente ── */}
          <div style={{ background: '#111', padding: '16px', borderRadius: '12px', marginBottom: '14px' }}>
            <label style={{ color: COR, fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '12px', letterSpacing: '1px' }}>👤 DADOS DO CLIENTE</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { key: 'nomeCliente', ph: 'NOME DO CLIENTE' },
                { key: 'placa',      ph: 'PLACA', fn: v => { const p = normalizarPlaca(v); buscarPorPlaca(p); return p; } },
                { key: 'telefone',   ph: 'WHATSAPP', type: 'tel' },
                { key: 'modelo',     ph: 'MODELO DO VEÍCULO' },
              ].map(({ key, ph, fn, type }) => (
                <input key={key} type={type || 'text'} value={form[key]} placeholder={ph}
                  onChange={e => setForm(p => ({ ...p, [key]: fn ? fn(e.target.value) : e.target.value }))}
                  style={{ padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', boxSizing: 'border-box', width: '100%' }} />
              ))}
            </div>
            <div style={{ marginTop: '10px' }}>
              <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>CATEGORIA DO VEÍCULO</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {CATEGORIAS_VEICULO.map(cat => (
                  <button key={cat} onClick={() => setForm(p => ({ ...p, categoria: cat }))}
                    style={{ padding: '8px 12px', background: form.categoria === cat ? COR : '#1a1a1a', color: form.categoria === cat ? 'black' : '#888', border: `1px solid ${form.categoria === cat ? COR : '#333'}`, borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Hora de entrada ── */}
          <div style={{ background: '#111', padding: '14px', borderRadius: '12px', marginBottom: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>⏰ HORA DE ENTRADA</label>
              <input type="time" value={form.horaEntrada}
                onChange={e => setForm(p => ({ ...p, horaEntrada: e.target.value }))}
                style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: COR, borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', boxSizing: 'border-box' }} />
            </div>
            <button onClick={() => setForm(p => ({ ...p, horaEntrada: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }))}
              style={{ marginTop: '18px', padding: '12px 16px', background: COR + '22', color: COR, border: `1px solid ${COR}`, borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              🕐 Agora
            </button>
          </div>

          {/* ── Serviços ── */}
          <div style={{ background: '#111', padding: '16px', borderRadius: '12px', marginBottom: '14px' }}>
            <label style={{ color: COR, fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '14px', letterSpacing: '1px' }}>🧼 SERVIÇOS</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {SERVICOS_CATALOGO.map(s => {
                const ativo = form.servicos.includes(s.key);
                return (
                  <button key={s.key}
                    onClick={() => setForm(p => ({ ...p, servicos: ativo ? p.servicos.filter(k => k !== s.key) : [...p.servicos, s.key] }))}
                    style={{ padding: '12px 10px', background: ativo ? s.cor + '22' : '#0a0a0a', border: `2px solid ${ativo ? s.cor : '#333'}`, color: ativo ? s.cor : '#666', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'left', fontSize: '12px' }}>
                    <span style={{ display: 'block' }}>{ativo ? '✅ ' : ''}{s.label}</span>
                    <span style={{ color: ativo ? s.cor + 'aa' : '#444', fontSize: '10px', fontWeight: 'normal' }}>{s.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Valor ── */}
          <div style={{ background: '#111', padding: '14px', borderRadius: '12px', marginBottom: '14px' }}>
            <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>💰 VALOR TOTAL (R$)</label>
            <input type="number" value={form.valorTotal} placeholder="0,00"
              onChange={e => setForm(p => ({ ...p, valorTotal: e.target.value }))}
              style={{ width: '100%', padding: '14px', background: '#0a0a0a', border: `1px solid ${GREEN}44`, color: GREEN, borderRadius: '8px', fontSize: '24px', fontWeight: '900', textAlign: 'center', boxSizing: 'border-box' }} />
          </div>

          {/* ── Observações ── */}
          <div style={{ background: '#111', padding: '14px', borderRadius: '12px', marginBottom: '14px' }}>
            <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>📝 OBSERVAÇÕES</label>
            <textarea value={form.obs} onChange={e => setForm(p => ({ ...p, obs: e.target.value }))}
              rows={3} placeholder="Ex: carro muito sujo, riscos na lateral, cliente deixou chave..."
              style={{ width: '100%', padding: '12px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box', fontSize: '13px' }} />
          </div>

          {/* ── Fotos ── */}
          <div style={{ background: '#111', padding: '14px', borderRadius: '12px', marginBottom: '20px' }}>
            <label style={{ color: '#666', fontSize: '10px', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>📸 FOTOS ({(form.fotos || []).length}/10)</label>
            <input value={legendaFoto} onChange={e => setLegendaFoto(e.target.value)} placeholder="Legenda da foto..."
              style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '8px', marginBottom: '8px', boxSizing: 'border-box' }} />
            <label style={{ display: 'block', padding: '12px', background: (form.fotos || []).length >= 10 ? '#222' : '#001a1f', border: `1px dashed ${(form.fotos || []).length >= 10 ? '#444' : COR}`, borderRadius: '8px', textAlign: 'center', cursor: (form.fotos || []).length >= 10 ? 'not-allowed' : 'pointer', color: (form.fotos || []).length >= 10 ? '#555' : 'white', fontWeight: 'bold' }}>
              📷 {(form.fotos || []).length >= 10 ? 'LIMITE ATINGIDO' : 'TIRAR FOTO'}
              <input type="file" accept="image/*" capture="environment" disabled={(form.fotos || []).length >= 10} onChange={adicionarFoto} style={{ display: 'none' }} />
            </label>
            {(form.fotos || []).length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                {form.fotos.map((f, i) => (
                  <div key={i} style={{ position: 'relative', width: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #333' }}>
                    <img src={f.foto} alt={f.legenda} style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                    <div style={{ background: 'rgba(0,0,0,0.85)', color: '#aaa', fontSize: '9px', padding: '3px', textAlign: 'center' }}>{f.legenda || 'Foto'}</div>
                    <button onClick={() => setForm(p => ({ ...p, fotos: p.fotos.filter((_, idx) => idx !== i) }))}
                      style={{ position: 'absolute', top: '2px', right: '2px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '11px', lineHeight: '18px' }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Botão Salvar ── */}
          <button onClick={salvar} disabled={salvando}
            style={{ width: '100%', padding: '20px', background: salvando ? '#333' : COR, color: 'black', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: '900', cursor: 'pointer', letterSpacing: '0.5px' }}>
            {salvando ? '⏳ SALVANDO...' : salvo ? '✅ ADICIONADO À FILA!' : editandoId ? '💾 SALVAR EDIÇÃO' : '🚿 ADICIONAR À FILA + GERAR O.S.'}
          </button>
        </div>
      )}

      {/* ══════════════════════════════════
          SUB-ABA: HISTÓRICO
      ══════════════════════════════════ */}
      {subAba === 'historico' && (
        <div>
          {historico.length === 0 ? (
            <div style={{ background: '#111', border: '1px dashed #333', borderRadius: '14px', padding: '50px', textAlign: 'center' }}>
              <p style={{ fontSize: '40px', margin: '0 0 10px 0' }}>📋</p>
              <p style={{ color: '#555', margin: 0 }}>Nenhum veículo entregue ainda.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historico.map(item => (
                <div key={item.id} style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <p style={{ margin: '0 0 3px 0', fontWeight: 'bold', fontSize: '14px' }}>{item.nomeCliente || 'Cliente'}</p>
                    <p style={{ margin: '0 0 3px 0', color: COR, fontWeight: '900', fontSize: '16px' }}>{item.placa}</p>
                    <p style={{ margin: '0 0 6px 0', color: '#666', fontSize: '11px' }}>{item.modelo} · {item.categoria}</p>
                    <p style={{ margin: 0, color: '#555', fontSize: '11px' }}>{item.servicosTexto}</p>
                    {item.data_registro && (
                      <p style={{ margin: '4px 0 0 0', color: '#444', fontSize: '10px' }}>
                        📅 {new Date(item.data_registro).toLocaleDateString('pt-BR')} {item.horaEntrada ? `· ⏰ ${item.horaEntrada}` : ''}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 8px 0', color: GREEN, fontWeight: '900', fontSize: '18px' }}>{formatarMoeda(item.valorTotal)}</p>
                    {item.telefone && (
                      <button onClick={() => enviarWhatsApp(item)}
                        style={{ padding: '7px 12px', background: '#25D36622', color: '#25D366', border: '1px solid #25D366', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                        💬 WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
