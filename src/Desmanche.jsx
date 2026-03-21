import React, { useState, useRef, useEffect } from 'react';
import {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    query,
    where,
} from 'firebase/firestore';

// =====================================================================
// DESMANCHE.JSX — Módulo completo de gestão de desmanche para EXP AUTO AI
// Props recebidas do Admin.jsx:
//   oficinaId       — ID da oficina no Firestore
//   dadosOficina    — objeto com nomeOficina, telefone, etc.
//   carregarFinanceiro — função para recarregar aba financeiro após venda
//   db              — instância do Firebase Firestore
//   setLightboxFotos   — abre lightbox global com array de fotos
//   setLightboxIdx     — define índice inicial no lightbox
//   setLightboxAberto  — toggle do lightbox
// =====================================================================

export default function Desmanche({
    oficinaId,
    dadosOficina,
    carregarFinanceiro,
    db,
    setLightboxFotos,
    setLightboxIdx,
    setLightboxAberto,
}) {
    // ─── BRANDING ──────────────────────────────────────────────────────
    const COR = '#ef4444';       // vermelho neon — desmonte / alerta
    const COR2 = '#f97316';      // laranja — secundário
    const VERDE = '#00E676';     // verde neon — lucro / vendido
    const statusCor = {
        em_desmonte: '#ef4444',
        desmontado: '#00E676',
        encerrado: '#666',
    };
    const condicaoCor = {
        otima: '#00E676',
        boa: '#eab308',
        regular: '#f97316',
        sucata: '#ef4444',
    };

    // ─── SUB-ABAS ──────────────────────────────────────────────────────
    const [subAba, setSubAba] = useState('veiculos');

    // ─── ESTADOS — VEÍCULOS ────────────────────────────────────────────
    const [veiculos, setVeiculos] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [mostrarFormVeiculo, setMostrarFormVeiculo] = useState(false);
    const [editandoVeiculo, setEditandoVeiculo] = useState(null); // id ou null
    const [salvandoVeiculo, setSalvandoVeiculo] = useState(false);
    const [patioFiltro, setPatioFiltro] = useState('Todos');
    const [ouvindoDetalhes, setOuvindoDetalhes] = useState(false);
    const formVeiculoInicial = {
        modelo: '', ano: '', cor: '', placa: '',
        valorLeilao: '', procedencia: '', patio: '',
        detalhes: '', fotos: [], status: 'em_desmonte',
    };
    const [formVeiculo, setFormVeiculo] = useState(formVeiculoInicial);

    // ─── ESTADOS — PEÇAS ───────────────────────────────────────────────
    const [pecas, setPecas] = useState([]);
    const [mostrarFormPeca, setMostrarFormPeca] = useState(false);
    const [editandoPeca, setEditandoPeca] = useState(null);
    const [salvandoPeca, setSalvandoPeca] = useState(false);
    const [buscaPeca, setBuscaPeca] = useState('');
    const [filtroStatusPeca, setFiltroStatusPeca] = useState('todos');
    const [ouvindoNomePeca, setOuvindoNomePeca] = useState(false);
    const formPecaInicial = {
        nome: '', veiculoId: '', veiculoNome: '',
        preco: '', condicao: 'otima', codigo: '',
        prateleira: '', fotos: [], status: 'disponivel',
        descricao: '',
    };
    const [formPeca, setFormPeca] = useState(formPecaInicial);

    // ─── ESTADOS — BUSCA DE PEÇAS (rede global) ────────────────────────
    const [buscaRede, setBuscaRede] = useState('');
    const [resultadosRede, setResultadosRede] = useState([]);
    const [buscandoRede, setBuscandoRede] = useState(false);
    const [ouvindoBuscaRede, setOuvindoBuscaRede] = useState(false);

    // ─── ESTADOS — PARCEIROS ───────────────────────────────────────────
    const [parceiros, setParceiros] = useState([]);
    const [mostrarFormParc, setMostrarFormParc] = useState(false);
    const [salvandoParc, setSalvandoParc] = useState(false);
    const formParcInicial = { nome: '', telefone: '', cidade: '', responsavel: '', oficinaId: '' };
    const [formParc, setFormParc] = useState(formParcInicial);

    // ─── REFS ──────────────────────────────────────────────────────────
    const recRef = useRef(null);

    // ─── CARGA INICIAL ─────────────────────────────────────────────────
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

    // ─── UTILS ─────────────────────────────────────────────────────────
    const toBase64 = file => new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
    });

    const escolherFotos = async (setter, key) => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
        input.onchange = async e => {
            const b64s = await Promise.all(Array.from(e.target.files).map(toBase64));
            setter(prev => ({ ...prev, [key]: [...(prev[key] || []), ...b64s] }));
        };
        input.click();
    };

    const iniciarVoz = (setter, fieldKey, setOuvindo) => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
            return alert('Use o Chrome para reconhecimento de voz.');
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.lang = 'pt-BR'; rec.interimResults = false;
        recRef.current = rec;
        rec.onstart = () => setOuvindo(true);
        rec.onresult = e => setter(prev => ({
            ...prev,
            [fieldKey]: (prev[fieldKey] ? prev[fieldKey] + ' ' : '') + e.results[0][0].transcript,
        }));
        rec.onerror = () => setOuvindo(false);
        rec.onend = () => setOuvindo(false);
        rec.start();
    };

    const abrirLightbox = (fotos, idx = 0) => {
        if (setLightboxFotos && setLightboxIdx && setLightboxAberto) {
            setLightboxFotos(fotos);
            setLightboxIdx(idx);
            setLightboxAberto(true);
        }
    };

    const formatarMoeda = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const agora = () => new Date().toISOString();

    // ─── TOTAIS ────────────────────────────────────────────────────────
    const totalInvestido = veiculos.reduce((s, v) => s + (Number(v.valorLeilao) || 0), 0);
    const totalVendas = pecas.filter(p => p.status === 'vendida').reduce((s, p) => s + (Number(p.preco) || 0), 0);
    const lucro = totalVendas - totalInvestido;
    const pecasDisponiveis = pecas.filter(p => p.status === 'disponivel').length;
    const pecasVendidas = pecas.filter(p => p.status === 'vendida').length;

    // ─────────────────────────────────────────────────────────────────────
    // CRUD — VEÍCULOS
    // ─────────────────────────────────────────────────────────────────────
    const salvarVeiculo = async () => {
        if (!formVeiculo.modelo.trim()) return alert('⚠️ Preencha o modelo do veículo!');
        setSalvandoVeiculo(true);
        try {
            const dados = {
                ...formVeiculo,
                data_entrada: agora(),
                oficina: dadosOficina?.nomeOficina || '',
            };
            if (editandoVeiculo) {
                await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_veiculos', editandoVeiculo), dados);
            } else {
                await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_veiculos'), {
                    ...dados, data_registro: agora(),
                });
            }
            setFormVeiculo(formVeiculoInicial);
            setEditandoVeiculo(null);
            setMostrarFormVeiculo(false);
            await carregarTudo();
        } catch (e) { alert('Erro: ' + e.message); }
        finally { setSalvandoVeiculo(false); }
    };

    const editarVeiculo = (v) => {
        setFormVeiculo({
            modelo: v.modelo || '', ano: v.ano || '', cor: v.cor || '',
            placa: v.placa || '', valorLeilao: v.valorLeilao || '',
            procedencia: v.procedencia || '', patio: v.patio || '',
            detalhes: v.detalhes || '', fotos: v.fotos || [],
            status: v.status || 'em_desmonte',
        });
        setEditandoVeiculo(v.id);
        setMostrarFormVeiculo(true);
    };

    const excluirVeiculo = async (id) => {
        if (!window.confirm('Excluir este veículo do desmanche?')) return;
        try {
            await deleteDoc(doc(db, 'oficinas', oficinaId, 'desmanche_veiculos', id));
            await carregarTudo();
        } catch (e) { alert('Erro: ' + e.message); }
    };

    // ─────────────────────────────────────────────────────────────────────
    // CRUD — PEÇAS
    // ─────────────────────────────────────────────────────────────────────
    const salvarPeca = async () => {
        if (!formPeca.nome.trim()) return alert('⚠️ Preencha o nome da peça!');
        setSalvandoPeca(true);
        try {
            const dados = { ...formPeca, data_registro: agora() };
            if (editandoPeca) {
                await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_pecas', editandoPeca), dados);
            } else {
                await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_pecas'), dados);
            }
            setFormPeca(formPecaInicial);
            setEditandoPeca(null);
            setMostrarFormPeca(false);
            await carregarTudo();
        } catch (e) { alert('Erro: ' + e.message); }
        finally { setSalvandoPeca(false); }
    };

    const editarPeca = (p) => {
        setFormPeca({
            nome: p.nome || '', veiculoId: p.veiculoId || '',
            veiculoNome: p.veiculoNome || '', preco: p.preco || '',
            condicao: p.condicao || 'otima', codigo: p.codigo || '',
            prateleira: p.prateleira || '', fotos: p.fotos || [],
            status: p.status || 'disponivel', descricao: p.descricao || '',
        });
        setEditandoPeca(p.id);
        setMostrarFormPeca(true);
    };

    const venderPeca = async (peca) => {
        if (!window.confirm(`Marcar "${peca.nome}" como VENDIDA por R$ ${formatarMoeda(peca.preco)}?`)) return;
        try {
            await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_pecas', peca.id), {
                status: 'vendida', data_venda: agora(),
            });
            // ── Integração Financeiro ─────────────────────────────────────
            await addDoc(collection(db, 'oficinas', oficinaId, 'financeiro'), {
                tipo: 'entrada',
                descricao: `🚗 Venda peça desmanche: ${peca.nome}${peca.veiculoNome ? ` (${peca.veiculoNome})` : ''}`,
                valor: Number(peca.preco) || 0,
                formaPagamento: 'desmanche',
                data: agora(),
                data_registro: agora(),
            });
            if (carregarFinanceiro) await carregarFinanceiro();
            await carregarTudo();
            alert('✅ Peça vendida! Valor lançado automaticamente no Financeiro.');
        } catch (e) { alert('Erro: ' + e.message); }
    };

    const excluirPeca = async (id) => {
        if (!window.confirm('Excluir esta peça?')) return;
        try {
            await deleteDoc(doc(db, 'oficinas', oficinaId, 'desmanche_pecas', id));
            await carregarTudo();
        } catch (e) { alert('Erro: ' + e.message); }
    };

    // ─────────────────────────────────────────────────────────────────────
    // BUSCA NA REDE (desmanche_global)
    // ─────────────────────────────────────────────────────────────────────
    const buscarNaRede = async () => {
        if (!buscaRede.trim()) return;
        setBuscandoRede(true);
        setResultadosRede([]);
        try {
            // Busca em todos os documentos do desmanche_global
            const snap = await getDocs(collection(db, 'desmanche_global'));
            const encontrados = [];
            snap.docs.forEach(d => {
                const data = d.data();
                (data.veiculos_publicados || []).forEach(v => {
                    const nomeOk = v.modelo?.toLowerCase().includes(buscaRede.toLowerCase());
                    if (nomeOk) {
                        encontrados.push({
                            ...v,
                            nomeOficina: data.nomeOficina,
                            telefone: data.telefone,
                            desmanchemId: d.id,
                        });
                    }
                });
            });
            setResultadosRede(encontrados);
        } catch (e) { console.error(e); alert('Erro na busca: ' + e.message); }
        finally { setBuscandoRede(false); }
    };

    const iniciarVozBuscaRede = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window))
            return alert('Use o Chrome para reconhecimento de voz.');
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.lang = 'pt-BR'; rec.interimResults = false;
        rec.onstart = () => setOuvindoBuscaRede(true);
        rec.onresult = e => setBuscaRede(e.results[0][0].transcript);
        rec.onerror = () => setOuvindoBuscaRede(false);
        rec.onend = () => setOuvindoBuscaRede(false);
        rec.start();
    };

    // ─────────────────────────────────────────────────────────────────────
    // PUBLICAR CHEGADA + WHATSAPP PARA PARCEIROS
    // ─────────────────────────────────────────────────────────────────────
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
                data_publicacao: agora(),
            };
            const novosVeiculos = jaPublicados.find(v => v.id === carro.id)
                ? jaPublicados.map(v => v.id === carro.id ? carroPublicado : v)
                : [...jaPublicados, carroPublicado];

            await setDoc(doc(db, 'desmanche_global', oficinaId), {
                nomeOficina: dadosOficina?.nomeOficina || 'Desmanche',
                telefone: dadosOficina?.telefone || '',
                parceiros_ids,
                veiculos_publicados: novosVeiculos,
                ultima_atualizacao: agora(),
            }, { merge: false });

            // Notificar oficinas parceiras no Firestore
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
                        data: agora(),
                    });
                }
            }

            await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_veiculos', carro.id), {
                publicado: true, data_publicacao: agora(),
            });

            // WhatsApp em massa para parceiros
            const listaParceiros = parcSnap.docs.map(d => d.data());
            const msg = encodeURIComponent(
                `🚗 *NOVA CHEGADA — ${dadosOficina?.nomeOficina || 'Desmanche'}*\n\n` +
                `Carro: *${carro.modelo} ${carro.ano || ''}* — ${carro.cor || ''}\n` +
                `Pátio: ${carro.patio || 'A definir'}\n` +
                `Peças: ${pecasNomes || 'Ver no app'}\n\n` +
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
            alert(`✅ Publicado! WhatsApp aberto para ${enviados} oficina(s).`);
        } catch (e) { alert('Erro: ' + e.message); }
    };

    // ─────────────────────────────────────────────────────────────────────
    // CRUD — PARCEIROS
    // ─────────────────────────────────────────────────────────────────────
    const salvarParceiro = async () => {
        if (!formParc.nome.trim()) return alert('⚠️ Preencha o nome da oficina parceira!');
        setSalvandoParc(true);
        try {
            await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_parceiros'), {
                ...formParc, data_registro: agora(),
            });
            setFormParc(formParcInicial);
            setMostrarFormParc(false);
            await carregarTudo();
        } catch (e) { alert('Erro: ' + e.message); }
        finally { setSalvandoParc(false); }
    };

    const excluirParceiro = async (id) => {
        if (!window.confirm('Remover esta oficina parceira?')) return;
        try {
            await deleteDoc(doc(db, 'oficinas', oficinaId, 'desmanche_parceiros', id));
            await carregarTudo();
        } catch (e) { alert('Erro: ' + e.message); }
    };

    // ─────────────────────────────────────────────────────────────────────
    // FILTROS
    // ─────────────────────────────────────────────────────────────────────
    const PATIOS = ['Todos', 'Pátio 1', 'Pátio 2', 'Pátio 3', 'Pátio 4', 'Pátio 5'];

    const veiculosFiltrados = veiculos.filter(v =>
        patioFiltro === 'Todos' || v.patio === patioFiltro
    );

    const pecasFiltradas = pecas.filter(p => {
        const bOk = !buscaPeca ||
            p.nome?.toLowerCase().includes(buscaPeca.toLowerCase()) ||
            p.veiculoNome?.toLowerCase().includes(buscaPeca.toLowerCase()) ||
            p.codigo?.toLowerCase().includes(buscaPeca.toLowerCase());
        const sOk = filtroStatusPeca === 'todos' || p.status === filtroStatusPeca;
        return bOk && sOk;
    });

    // ─────────────────────────────────────────────────────────────────────
    // ESTILOS REUTILIZÁVEIS
    // ─────────────────────────────────────────────────────────────────────
    const inputStyle = {
        width: '100%', padding: '12px 14px',
        background: '#0d0d0d', border: '1px solid #2a2a2a',
        color: 'white', borderRadius: '8px',
        fontSize: '14px', boxSizing: 'border-box',
    };
    const btnPrimary = (cor = COR) => ({
        background: cor, color: cor === VERDE ? 'black' : 'white',
        border: 'none', borderRadius: '8px',
        padding: '11px 18px', fontWeight: '800',
        fontSize: '13px', cursor: 'pointer', letterSpacing: '0.5px',
    });
    const cardStyle = {
        background: 'linear-gradient(135deg,#111,#0d0d0d)',
        border: '1px solid #222', borderRadius: '14px',
        padding: '18px', marginBottom: '14px',
    };

    // ─────────────────────────────────────────────────────────────────────
    // ══════════════════════════  RENDER  ═════════════════════════════════
    // ─────────────────────────────────────────────────────────────────────
    return (
        <div style={{ color: 'white', fontFamily: 'sans-serif', paddingBottom: '40px' }}>

            {/* ── HEADER RESUMO ─────────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg,#1a0000,#0d0d0d)',
                border: `1px solid ${COR}33`,
                borderRadius: '16px', padding: '22px', marginBottom: '22px',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                        <h2 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '22px' }}>
                            🚗 <span style={{ color: COR }}>Desmanche</span>
                        </h2>
                        <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
                            Gestão de veículos, peças e parceiros
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Investido', valor: `R$ ${formatarMoeda(totalInvestido)}`, cor: COR },
                            { label: 'Vendido', valor: `R$ ${formatarMoeda(totalVendas)}`, cor: VERDE },
                            { label: 'Lucro', valor: `R$ ${formatarMoeda(lucro)}`, cor: lucro >= 0 ? VERDE : COR },
                            { label: 'Peças Disp.', valor: pecasDisponiveis, cor: '#f97316' },
                            { label: 'Vendidas', valor: pecasVendidas, cor: VERDE },
                        ].map(({ label, valor, cor }) => (
                            <div key={label} style={{
                                background: '#111', border: `1px solid ${cor}22`,
                                borderRadius: '10px', padding: '10px 14px', textAlign: 'center', minWidth: '80px',
                            }}>
                                <p style={{ color: '#555', fontSize: '10px', margin: '0 0 2px 0', fontWeight: 'bold', textTransform: 'uppercase' }}>{label}</p>
                                <p style={{ color: cor, fontSize: '15px', fontWeight: '900', margin: 0 }}>{valor}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── NAVEGAÇÃO DE SUB-ABAS ──────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                    { key: 'veiculos', label: '🚗 Veículos', count: veiculos.length },
                    { key: 'pecas', label: '🔩 Peças', count: pecasDisponiveis },
                    { key: 'busca', label: '🔍 Buscar na Rede', count: null },
                    { key: 'parceiros', label: '🔧 Parceiros', count: parceiros.length },
                ].map(({ key, label, count }) => (
                    <button key={key} onClick={() => setSubAba(key)} style={{
                        padding: '10px 18px',
                        background: subAba === key ? COR : '#1a1a1a',
                        color: subAba === key ? 'white' : '#777',
                        border: `1px solid ${subAba === key ? COR : '#2a2a2a'}`,
                        borderRadius: '20px', fontWeight: 'bold',
                        fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                    }}>
                        {label}{count !== null ? ` (${count})` : ''}
                    </button>
                ))}
            </div>

            {/* ════════════════════════════════════════════════════════════════
          ABA — VEÍCULOS
      ════════════════════════════════════════════════════════════════ */}
            {subAba === 'veiculos' && (
                <div>
                    {/* Filtro por pátio + botão novo */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', flex: 1, flexWrap: 'wrap' }}>
                            {PATIOS.map(p => (
                                <button key={p} onClick={() => setPatioFiltro(p)} style={{
                                    padding: '7px 14px', borderRadius: '20px',
                                    background: patioFiltro === p ? COR2 : '#1a1a1a',
                                    color: patioFiltro === p ? 'white' : '#666',
                                    border: `1px solid ${patioFiltro === p ? COR2 : '#2a2a2a'}`,
                                    fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                                }}>
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => { setFormVeiculo(formVeiculoInicial); setEditandoVeiculo(null); setMostrarFormVeiculo(true); }}
                            style={btnPrimary()}>
                            + Novo Veículo
                        </button>
                    </div>

                    {carregando && <p style={{ color: '#555', textAlign: 'center' }}>Carregando...</p>}

                    {/* Lista de veículos */}
                    {veiculosFiltrados.length === 0 && !carregando && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#444' }}>
                            <p style={{ fontSize: '32px' }}>🚗</p>
                            <p>Nenhum veículo cadastrado neste pátio.</p>
                        </div>
                    )}

                    {veiculosFiltrados.map(carro => {
                        const pecasDoCarro = pecas.filter(p => p.veiculoId === carro.id);
                        const pecasDispCarro = pecasDoCarro.filter(p => p.status === 'disponivel').length;
                        const pecasVendCarro = pecasDoCarro.filter(p => p.status === 'vendida').length;
                        const receitaCarro = pecasDoCarro.filter(p => p.status === 'vendida').reduce((s, p) => s + (Number(p.preco) || 0), 0);
                        return (
                            <div key={carro.id} style={{ ...cardStyle, borderLeft: `4px solid ${statusCor[carro.status] || '#333'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                            <h4 style={{ color: 'white', margin: 0, fontSize: '16px' }}>{carro.modelo} {carro.ano}</h4>
                                            <span style={{
                                                background: `${statusCor[carro.status] || '#333'}22`,
                                                color: statusCor[carro.status] || '#666',
                                                padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                                            }}>
                                                {carro.status?.replace('_', ' ').toUpperCase()}
                                            </span>
                                            {carro.publicado && (
                                                <span style={{ background: '#00E67622', color: VERDE, padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                                                    ✅ PUBLICADO
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ color: '#666', fontSize: '12px', margin: '0 0 4px 0' }}>
                                            🎨 {carro.cor || '—'} &nbsp;·&nbsp; 📍 {carro.patio || '—'} &nbsp;·&nbsp; 🔑 {carro.placa || '—'}
                                        </p>
                                        <p style={{ color: '#555', fontSize: '12px', margin: '0 0 6px 0' }}>
                                            🏷️ Leilão: <span style={{ color: COR, fontWeight: 'bold' }}>R$ {formatarMoeda(carro.valorLeilao)}</span>
                                            &nbsp;·&nbsp; 📦 Procedência: {carro.procedencia || '—'}
                                        </p>
                                        {carro.detalhes && (
                                            <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0', fontStyle: 'italic' }}>📝 {carro.detalhes}</p>
                                        )}
                                        {/* Mini resumo de peças */}
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            <span style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: '#f97316' }}>
                                                🔩 {pecasDispCarro} peças disp.
                                            </span>
                                            <span style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: VERDE }}>
                                                💰 Receita: R$ {formatarMoeda(receitaCarro)}
                                            </span>
                                            <span style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', color: '#555' }}>
                                                ✅ {pecasVendCarro} vendidas
                                            </span>
                                        </div>
                                    </div>

                                    {/* Carrossel de fotos */}
                                    {(carro.fotos || []).length > 0 && (
                                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '200px' }}>
                                            {carro.fotos.slice(0, 4).map((f, i) => (
                                                <img key={i} src={f} alt="foto" onClick={() => abrirLightbox(carro.fotos, i)}
                                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #333', flexShrink: 0 }} />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Ações */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                                    <button onClick={() => editarVeiculo(carro)} style={{ ...btnPrimary('#333'), color: '#aaa', border: '1px solid #333' }}>
                                        ✏️ Editar
                                    </button>
                                    <button onClick={() => {
                                        setFormPeca({ ...formPecaInicial, veiculoId: carro.id, veiculoNome: `${carro.modelo} ${carro.ano}` });
                                        setEditandoPeca(null);
                                        setMostrarFormPeca(true);
                                        setSubAba('pecas');
                                    }} style={btnPrimary(COR2)}>
                                        + Peça
                                    </button>
                                    <button onClick={() => publicarChegada(carro)}
                                        style={{ ...btnPrimary('#1a1a1a'), color: '#25D366', border: '1px solid #25D36644' }}>
                                        📣 Avisar Parceiros
                                    </button>
                                    <button onClick={() => excluirVeiculo(carro.id)}
                                        style={{ ...btnPrimary('#1a1a1a'), color: '#ef444488', border: '1px solid #ef444422' }}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* ── MODAL / FORM VEÍCULO ──────────────────────────────── */}
                    {mostrarFormVeiculo && (
                        <div style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.92)', zIndex: 9999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                        }}>
                            <div style={{
                                background: '#111', width: '100%', maxWidth: '520px',
                                borderRadius: '16px', padding: '26px',
                                border: `2px solid ${COR}`, maxHeight: '90vh', overflowY: 'auto',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ color: COR, margin: 0 }}>{editandoVeiculo ? '✏️ Editar Veículo' : '🚗 Novo Veículo'}</h3>
                                    <button onClick={() => setMostrarFormVeiculo(false)}
                                        style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✖</button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                    {[
                                        { label: 'Modelo *', key: 'modelo', type: 'text', full: true },
                                        { label: 'Ano', key: 'ano', type: 'text' },
                                        { label: 'Cor', key: 'cor', type: 'text' },
                                        { label: 'Placa', key: 'placa', type: 'text' },
                                        { label: 'Valor Leilão (R$)', key: 'valorLeilao', type: 'number' },
                                        { label: 'Procedência', key: 'procedencia', type: 'text' },
                                    ].map(({ label, key, type, full }) => (
                                        <div key={key} style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
                                            <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{label}</label>
                                            <input type={type} value={formVeiculo[key]} onChange={e => setFormVeiculo(p => ({ ...p, [key]: e.target.value }))}
                                                style={inputStyle} />
                                        </div>
                                    ))}
                                </div>

                                {/* Pátio */}
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Pátio</label>
                                    <select value={formVeiculo.patio} onChange={e => setFormVeiculo(p => ({ ...p, patio: e.target.value }))}
                                        style={{ ...inputStyle }}>
                                        <option value=''>Selecionar...</option>
                                        {['Pátio 1', 'Pátio 2', 'Pátio 3', 'Pátio 4', 'Pátio 5'].map(pt => (
                                            <option key={pt} value={pt}>{pt}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status */}
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Status</label>
                                    <select value={formVeiculo.status} onChange={e => setFormVeiculo(p => ({ ...p, status: e.target.value }))}
                                        style={{ ...inputStyle }}>
                                        <option value='em_desmonte'>Em Desmonte</option>
                                        <option value='desmontado'>Desmontado</option>
                                        <option value='encerrado'>Encerrado</option>
                                    </select>
                                </div>

                                {/* Detalhes com voz */}
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Detalhes / Observações</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <textarea
                                            value={formVeiculo.detalhes}
                                            onChange={e => setFormVeiculo(p => ({ ...p, detalhes: e.target.value }))}
                                            rows={3} style={{ ...inputStyle, resize: 'none' }} />
                                        <button onClick={() => iniciarVoz(setFormVeiculo, 'detalhes', setOuvindoDetalhes)}
                                            style={{ ...btnPrimary(ouvindoDetalhes ? COR : '#333'), padding: '0 14px', fontSize: '18px' }}>
                                            {ouvindoDetalhes ? '🔴' : '🎤'}
                                        </button>
                                    </div>
                                </div>

                                {/* Fotos */}
                                <div style={{ marginBottom: '18px' }}>
                                    <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '8px' }}>Fotos</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                        {(formVeiculo.fotos || []).map((f, i) => (
                                            <div key={i} style={{ position: 'relative' }}>
                                                <img src={f} alt="foto" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #333' }} />
                                                <button onClick={() => setFormVeiculo(p => ({ ...p, fotos: p.fotos.filter((_, j) => j !== i) }))}
                                                    style={{ position: 'absolute', top: '-6px', right: '-6px', background: COR, color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', lineHeight: 1 }}>
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={() => escolherFotos(setFormVeiculo, 'fotos')}
                                            style={{ width: '64px', height: '64px', background: '#1a1a1a', border: '2px dashed #333', borderRadius: '8px', color: '#555', fontSize: '22px', cursor: 'pointer' }}>
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setMostrarFormVeiculo(false)}
                                        style={{ ...btnPrimary('#2a2a2a'), color: '#888', flex: 1 }}>
                                        Cancelar
                                    </button>
                                    <button onClick={salvarVeiculo} disabled={salvandoVeiculo}
                                        style={{ ...btnPrimary(), flex: 2, opacity: salvandoVeiculo ? 0.5 : 1 }}>
                                        {salvandoVeiculo ? '⏳ Salvando...' : '💾 Salvar Veículo'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
          ABA — PEÇAS
      ════════════════════════════════════════════════════════════════ */}
            {subAba === 'pecas' && (
                <div>
                    {/* Barra busca + filtros + botão novo */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                            type="text" value={buscaPeca}
                            onChange={e => setBuscaPeca(e.target.value)}
                            placeholder="🔍 Buscar peça, código, veículo..."
                            style={{ ...inputStyle, flex: 1, minWidth: '180px', padding: '10px 14px' }}
                        />
                        {['todos', 'disponivel', 'vendida', 'reservada'].map(s => (
                            <button key={s} onClick={() => setFiltroStatusPeca(s)} style={{
                                padding: '8px 14px', borderRadius: '20px',
                                background: filtroStatusPeca === s ? (s === 'disponivel' ? VERDE : s === 'vendida' ? COR : '#f97316') : '#1a1a1a',
                                color: filtroStatusPeca === s ? (s === 'disponivel' ? 'black' : 'white') : '#666',
                                border: `1px solid ${filtroStatusPeca === s ? 'transparent' : '#2a2a2a'}`,
                                fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                            }}>
                                {s === 'todos' ? 'Todos' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                        <button onClick={() => { setFormPeca(formPecaInicial); setEditandoPeca(null); setMostrarFormPeca(true); }}
                            style={btnPrimary(COR2)}>
                            + Nova Peça
                        </button>
                    </div>

                    <p style={{ color: '#555', fontSize: '12px', marginBottom: '14px' }}>
                        {pecasFiltradas.length} peça(s) encontrada(s)
                    </p>

                    {pecasFiltradas.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#444' }}>
                            <p style={{ fontSize: '32px' }}>🔩</p>
                            <p>Nenhuma peça encontrada.</p>
                        </div>
                    )}

                    {pecasFiltradas.map(peca => (
                        <div key={peca.id} style={{
                            ...cardStyle,
                            borderLeft: `4px solid ${peca.status === 'vendida' ? VERDE : peca.status === 'reservada' ? '#f97316' : '#333'}`,
                            opacity: peca.status === 'vendida' ? 0.7 : 1,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
                                        <h4 style={{ color: 'white', margin: 0, fontSize: '15px' }}>{peca.nome}</h4>
                                        <span style={{
                                            background: `${condicaoCor[peca.condicao] || '#333'}22`,
                                            color: condicaoCor[peca.condicao] || '#666',
                                            padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold',
                                        }}>
                                            {peca.condicao?.toUpperCase()}
                                        </span>
                                        <span style={{
                                            background: peca.status === 'vendida' ? '#00E67622' : '#1a1a1a',
                                            color: peca.status === 'vendida' ? VERDE : '#666',
                                            padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold',
                                        }}>
                                            {peca.status?.toUpperCase()}
                                        </span>
                                    </div>
                                    <p style={{ color: '#555', fontSize: '12px', margin: '0 0 4px 0' }}>
                                        🚗 {peca.veiculoNome || '—'} &nbsp;·&nbsp; 🏷️ Código: {peca.codigo || '—'} &nbsp;·&nbsp; 📦 Prateleira: {peca.prateleira || '—'}
                                    </p>
                                    {peca.descricao && (
                                        <p style={{ color: '#555', fontSize: '12px', margin: '0 0 6px 0', fontStyle: 'italic' }}>📝 {peca.descricao}</p>
                                    )}
                                    <p style={{ color: VERDE, fontSize: '18px', fontWeight: '900', margin: 0 }}>
                                        R$ {formatarMoeda(peca.preco)}
                                    </p>
                                </div>
                                {(peca.fotos || []).length > 0 && (
                                    <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                                        {peca.fotos.slice(0, 3).map((f, i) => (
                                            <img key={i} src={f} alt="foto" onClick={() => abrirLightbox(peca.fotos, i)}
                                                style={{ width: '55px', height: '55px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #2a2a2a' }} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {peca.status !== 'vendida' && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                                    <button onClick={() => editarPeca(peca)} style={{ ...btnPrimary('#2a2a2a'), color: '#aaa', border: '1px solid #333' }}>
                                        ✏️ Editar
                                    </button>
                                    <button onClick={() => venderPeca(peca)} style={btnPrimary(VERDE)}>
                                        💰 Vender
                                    </button>
                                    <button onClick={() => excluirPeca(peca.id)} style={{ ...btnPrimary('#1a1a1a'), color: '#ef444488', border: '1px solid #ef444422' }}>
                                        🗑️
                                    </button>
                                </div>
                            )}
                            {peca.status === 'vendida' && peca.data_venda && (
                                <p style={{ color: '#444', fontSize: '11px', marginTop: '8px', margin: '8px 0 0 0' }}>
                                    ✅ Vendida em {new Date(peca.data_venda).toLocaleDateString('pt-BR')}
                                </p>
                            )}
                        </div>
                    ))}

                    {/* ── MODAL / FORM PEÇA ──────────────────────────────────── */}
                    {mostrarFormPeca && (
                        <div style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.92)', zIndex: 9999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                        }}>
                            <div style={{
                                background: '#111', width: '100%', maxWidth: '520px',
                                borderRadius: '16px', padding: '26px',
                                border: `2px solid ${COR2}`, maxHeight: '90vh', overflowY: 'auto',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ color: COR2, margin: 0 }}>{editandoPeca ? '✏️ Editar Peça' : '🔩 Nova Peça'}</h3>
                                    <button onClick={() => setMostrarFormPeca(false)}
                                        style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✖</button>
                                </div>

                                {/* Vínculo com veículo */}
                                <div style={{ marginBottom: '12px' }}>
                                    <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Veículo de Origem</label>
                                    <select value={formPeca.veiculoId}
                                        onChange={e => {
                                            const v = veiculos.find(v => v.id === e.target.value);
                                            setFormPeca(p => ({ ...p, veiculoId: e.target.value, veiculoNome: v ? `${v.modelo} ${v.ano}` : '' }));
                                        }}
                                        style={inputStyle}>
                                        <option value=''>Nenhum / Peça avulsa</option>
                                        {veiculos.map(v => (
                                            <option key={v.id} value={v.id}>{v.modelo} {v.ano}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                    {[
                                        { label: 'Nome da Peça *', key: 'nome', type: 'text', full: true },
                                        { label: 'Preço (R$)', key: 'preco', type: 'number' },
                                        { label: 'Código / Ref.', key: 'codigo', type: 'text' },
                                        { label: 'Prateleira / Local', key: 'prateleira', type: 'text' },
                                    ].map(({ label, key, type, full }) => (
                                        <div key={key} style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
                                            <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{label}</label>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <input type={type} value={formPeca[key]}
                                                    onChange={e => setFormPeca(p => ({ ...p, [key]: e.target.value }))}
                                                    style={inputStyle} />
                                                {key === 'nome' && (
                                                    <button onClick={() => iniciarVoz(setFormPeca, 'nome', setOuvindoNomePeca)}
                                                        style={{ ...btnPrimary(ouvindoNomePeca ? COR : '#2a2a2a'), padding: '0 12px', fontSize: '16px' }}>
                                                        {ouvindoNomePeca ? '🔴' : '🎤'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                    <div>
                                        <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Condição</label>
                                        <select value={formPeca.condicao} onChange={e => setFormPeca(p => ({ ...p, condicao: e.target.value }))}
                                            style={inputStyle}>
                                            <option value='otima'>Ótima</option>
                                            <option value='boa'>Boa</option>
                                            <option value='regular'>Regular</option>
                                            <option value='sucata'>Sucata</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Status</label>
                                        <select value={formPeca.status} onChange={e => setFormPeca(p => ({ ...p, status: e.target.value }))}
                                            style={inputStyle}>
                                            <option value='disponivel'>Disponível</option>
                                            <option value='reservada'>Reservada</option>
                                            <option value='vendida'>Vendida</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Descrição */}
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Descrição / Observações</label>
                                    <textarea value={formPeca.descricao}
                                        onChange={e => setFormPeca(p => ({ ...p, descricao: e.target.value }))}
                                        rows={2} style={{ ...inputStyle, resize: 'none' }} />
                                </div>

                                {/* Fotos */}
                                <div style={{ marginBottom: '18px' }}>
                                    <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '8px' }}>Fotos</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {(formPeca.fotos || []).map((f, i) => (
                                            <div key={i} style={{ position: 'relative' }}>
                                                <img src={f} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #2a2a2a' }} />
                                                <button onClick={() => setFormPeca(p => ({ ...p, fotos: p.fotos.filter((_, j) => j !== i) }))}
                                                    style={{ position: 'absolute', top: '-5px', right: '-5px', background: COR, color: 'white', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', cursor: 'pointer', lineHeight: 1 }}>
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        <button onClick={() => escolherFotos(setFormPeca, 'fotos')}
                                            style={{ width: '60px', height: '60px', background: '#1a1a1a', border: '2px dashed #2a2a2a', borderRadius: '8px', color: '#444', fontSize: '20px', cursor: 'pointer' }}>
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setMostrarFormPeca(false)}
                                        style={{ ...btnPrimary('#2a2a2a'), color: '#888', flex: 1 }}>
                                        Cancelar
                                    </button>
                                    <button onClick={salvarPeca} disabled={salvandoPeca}
                                        style={{ ...btnPrimary(COR2), flex: 2, opacity: salvandoPeca ? 0.5 : 1 }}>
                                        {salvandoPeca ? '⏳ Salvando...' : '💾 Salvar Peça'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
          ABA — BUSCAR NA REDE
      ════════════════════════════════════════════════════════════════ */}
            {subAba === 'busca' && (
                <div>
                    <div style={{ ...cardStyle, borderColor: `${COR}33`, marginBottom: '20px' }}>
                        <h3 style={{ color: COR, margin: '0 0 6px 0' }}>🔍 Buscar Veículo / Peça na Rede</h3>
                        <p style={{ color: '#555', fontSize: '12px', margin: '0 0 16px 0' }}>
                            Pesquise em todos os desmanches parceiros cadastrados na plataforma.
                        </p>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                            <input
                                type="text" value={buscaRede}
                                onChange={e => setBuscaRede(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && buscarNaRede()}
                                placeholder="Ex: Civic 2018, Gol, porta dianteira..."
                                style={{ ...inputStyle, flex: 1, fontSize: '15px', padding: '13px 14px' }}
                            />
                            <button onClick={() => iniciarVozBuscaRede()}
                                style={{ ...btnPrimary(ouvindoBuscaRede ? COR : '#2a2a2a'), padding: '0 16px', fontSize: '20px' }}>
                                {ouvindoBuscaRede ? '🔴' : '🎤'}
                            </button>
                            <button onClick={buscarNaRede} disabled={buscandoRede || !buscaRede.trim()}
                                style={{ ...btnPrimary(), padding: '12px 20px', opacity: buscandoRede ? 0.6 : 1 }}>
                                {buscandoRede ? '⏳' : '🔍 Buscar'}
                            </button>
                        </div>
                    </div>

                    {buscandoRede && (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#555' }}>
                            <p style={{ fontSize: '24px' }}>⏳</p>
                            <p>Buscando na rede de desmanches...</p>
                        </div>
                    )}

                    {!buscandoRede && resultadosRede.length === 0 && buscaRede && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#444' }}>
                            <p style={{ fontSize: '32px' }}>😕</p>
                            <p>Nenhum resultado encontrado para "<strong style={{ color: '#888' }}>{buscaRede}</strong>".</p>
                            <p style={{ fontSize: '12px', color: '#555' }}>Tente outros termos ou verifique os parceiros cadastrados.</p>
                        </div>
                    )}

                    {resultadosRede.map((item, idx) => (
                        <div key={idx} style={{ ...cardStyle, borderLeft: `4px solid ${COR}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ color: 'white', margin: '0 0 4px 0' }}>{item.modelo} {item.ano}</h4>
                                    <p style={{ color: '#555', fontSize: '12px', margin: '0 0 4px 0' }}>
                                        🎨 {item.cor || '—'} &nbsp;·&nbsp; 📍 {item.patio || '—'}
                                    </p>
                                    {item.detalhes && (
                                        <p style={{ color: '#555', fontSize: '12px', margin: '0 0 8px 0', fontStyle: 'italic' }}>📝 {item.detalhes}</p>
                                    )}
                                    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '8px 12px', display: 'inline-block' }}>
                                        <p style={{ color: '#888', fontSize: '11px', margin: '0 0 2px 0' }}>🔧 Oficina</p>
                                        <p style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>{item.nomeOficina}</p>
                                    </div>
                                </div>
                                {(item.fotos || []).length > 0 && (
                                    <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                                        {item.fotos.slice(0, 3).map((f, i) => (
                                            <img key={i} src={f} alt="" onClick={() => abrirLightbox(item.fotos, i)}
                                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #2a2a2a' }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            {item.telefone && (
                                <button
                                    onClick={() => window.open(`https://wa.me/55${String(item.telefone).replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Vi o ${item.modelo} ${item.ano || ''} publicado no app. Tenho interesse. Ainda disponível?`)}`, '_blank')}
                                    style={{ marginTop: '12px', ...btnPrimary('#1a1a1a'), color: '#25D366', border: '1px solid #25D36644' }}>
                                    💬 Contatar via WhatsApp
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
          ABA — PARCEIROS
      ════════════════════════════════════════════════════════════════ */}
            {subAba === 'parceiros' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                        <div>
                            <h3 style={{ color: '#f97316', margin: '0 0 4px 0' }}>🔧 Oficinas Parceiras</h3>
                            <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
                                Ao avisar chegada de um veículo, todos os parceiros serão notificados automaticamente.
                            </p>
                        </div>
                        <button onClick={() => { setFormParc(formParcInicial); setMostrarFormParc(true); }}
                            style={btnPrimary('#f97316')}>
                            + Parceiro
                        </button>
                    </div>

                    {parceiros.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#444' }}>
                            <p style={{ fontSize: '32px' }}>🤝</p>
                            <p>Nenhuma oficina parceira cadastrada.</p>
                            <p style={{ fontSize: '12px', color: '#555' }}>Adicione parceiros para receber e enviar avisos de chegada de veículos.</p>
                        </div>
                    )}

                    {parceiros.map(p => (
                        <div key={p.id} style={{ ...cardStyle, borderLeft: '4px solid #f97316' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                <div>
                                    <h4 style={{ color: 'white', margin: '0 0 4px 0' }}>{p.nome}</h4>
                                    <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
                                        📞 {p.telefone || '—'} &nbsp;·&nbsp; 📍 {p.cidade || '—'}
                                        {p.responsavel ? ` · 👤 ${p.responsavel}` : ''}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {p.telefone && (
                                        <button onClick={() => window.open(`https://wa.me/55${String(p.telefone).replace(/\D/g, '')}`, '_blank')}
                                            style={{ ...btnPrimary('#1a1a1a'), color: '#25D366', border: '1px solid #25D36644', padding: '8px 12px' }}>
                                            💬
                                        </button>
                                    )}
                                    <button onClick={() => excluirParceiro(p.id)}
                                        style={{ ...btnPrimary('#1a1a1a'), color: '#ef444488', border: '1px solid #ef444422', padding: '8px 12px' }}>
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* ── MODAL FORM PARCEIRO ────────────────────────────────── */}
                    {mostrarFormParc && (
                        <div style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.92)', zIndex: 9999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                        }}>
                            <div style={{
                                background: '#111', width: '100%', maxWidth: '460px',
                                borderRadius: '16px', padding: '26px',
                                border: '2px solid #f97316',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3 style={{ color: '#f97316', margin: 0 }}>🔧 Nova Oficina Parceira</h3>
                                    <button onClick={() => setMostrarFormParc(false)}
                                        style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>✖</button>
                                </div>

                                {[
                                    { label: 'Nome da Oficina *', key: 'nome', type: 'text' },
                                    { label: 'WhatsApp (só números)', key: 'telefone', type: 'tel' },
                                    { label: 'Cidade', key: 'cidade', type: 'text' },
                                    { label: 'Responsável', key: 'responsavel', type: 'text' },
                                    { label: 'ID da Oficina no App (opcional)', key: 'oficinaId', type: 'text' },
                                ].map(({ label, key, type }) => (
                                    <div key={key} style={{ marginBottom: '12px' }}>
                                        <label style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{label}</label>
                                        <input type={type} value={formParc[key]}
                                            onChange={e => setFormParc(p => ({ ...p, [key]: type === 'tel' ? e.target.value.replace(/\D/g, '') : e.target.value }))}
                                            style={inputStyle} />
                                    </div>
                                ))}

                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                    <button onClick={() => setMostrarFormParc(false)}
                                        style={{ ...btnPrimary('#2a2a2a'), color: '#888', flex: 1 }}>
                                        Cancelar
                                    </button>
                                    <button onClick={salvarParceiro} disabled={salvandoParc}
                                        style={{ ...btnPrimary('#f97316'), flex: 2, opacity: salvandoParc ? 0.5 : 1 }}>
                                        {salvandoParc ? '⏳ Salvando...' : '💾 Salvar Parceiro'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
