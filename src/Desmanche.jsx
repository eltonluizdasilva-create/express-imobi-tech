import React, { useState, useRef, useEffect } from 'react';
import {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    setDoc,
    query,
    where
} from 'firebase/firestore';


export default function Desmanche({ oficinaId, dadosOficina, carregarFinanceiro, db, setLightboxFotos, setLightboxIdx, setLightboxAberto }) {
    const COR = '#ef4444';
    const COR2 = '#f97316';
    const statusCor = { em_desmonte: '#ef4444', desmontado: '#00E676', encerrado: '#666' };

    // ESTADOS
    const [subAbaDesmanche, setSubAbaDesmanche] = useState('veiculos');
    const [veiculosDesmanche, setVeiculosDesmanche] = useState([]);
    const [pecasDesmanche, setPecasDesmanche] = useState([]);
    const [carregandoDesmanche, setCarregandoDesmanche] = useState(false);

    const [formVeiculo, setFormVeiculo] = useState({ modelo: '', ano: '', cor: '', valorLeilao: '', procedencia: '', patio: '', detalhes: '', fotos: [], status: 'em_desmonte' });
    const [salvandoVeiculo, setSalvandoVeiculo] = useState(false);
    const [editandoVeiculo, setEditandoVeiculo] = useState(null);
    const [mostrarFormVeiculo, setMostrarFormVeiculo] = useState(false);
    const [ouvindoObsVeiculo, setOuvindoObsVeiculo] = useState(false);

    const [formPeca, setFormPeca] = useState({ nome: '', veiculoId: '', veiculoNome: '', preco: '', condicao: 'otima', codigo: '', prateleira: '', fotos: [], status: 'disponivel' });
    const [salvandoPeca, setSalvandoPeca] = useState(false);
    const [editandoPeca, setEditandoPeca] = useState(null);
    const [mostrarFormPeca, setMostrarFormPeca] = useState(false);
    const [buscaPeca, setBuscaPeca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('todos');

    const [parceiros, setParceiros] = useState([]);
    const [formParc, setFormParc] = useState({ nome: '', telefone: '', cidade: '', responsavel: '' });
    const [salvandoParc, setSalvandoParc] = useState(false);
    const [mostrarFormParc, setMostrarFormParc] = useState(false);

    const [buscaPecaVoz, setBuscaPecaVoz] = useState('');
    const [ouvindoBuscaPeca, setOuvindoBuscaPeca] = useState(false);
    const [patioSel, setPatioSel] = useState('Todos');



    const recDesRef = useRef(null);

    useEffect(() => {
        if (oficinaId) carregarDesmanche();
    }, [oficinaId]);

    const carregarDesmanche = async () => {
        if (!oficinaId) return;
        setCarregandoDesmanche(true);
        try {
            const [vsSnap, psSnap, parcSnap] = await Promise.all([
                getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_veiculos')),
                getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_pecas')),
                getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_parceiros')),
            ]);
            setVeiculosDesmanche(vsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setPecasDesmanche(psSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setParceiros(parcSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { console.error(e); }
        finally { setCarregandoDesmanche(false); }
    };

    const toBase64 = file => new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
    });

    const tirarFotosDesmanche = async (setter, fotoKey) => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
        input.onchange = async e => {
            const files = Array.from(e.target.files);
            const b64s = await Promise.all(files.map(toBase64));
            setter(prev => ({ ...prev, [fotoKey]: [...(prev[fotoKey] || []), ...b64s] }));
        };
        input.click();
    };

    const iniciarVozDesmanche = (setter, fieldKey, setOuvindo) => {
        if (!('webkitSpeechRecognition' in window)) return alert('Use Chrome para voz.');
        const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        rec.lang = 'pt-BR'; rec.interimResults = false;
        recDesRef.current = rec;
        rec.onstart = () => setOuvindo(true);
        rec.onresult = e => setter(prev => ({ ...prev, [fieldKey]: (prev[fieldKey] ? prev[fieldKey] + ' ' : '') + e.results[0][0].transcript }));
        rec.onerror = () => setOuvindo(false);
        rec.onend = () => setOuvindo(false);
        rec.start();
    };

    const salvarVeiculo = async () => {
        if (!formVeiculo.modelo) return alert('⚠️ Preencha o modelo do veículo!');
        setSalvandoVeiculo(true);
        try {
            const dados = { ...formVeiculo, data_entrada: new Date().toISOString(), oficina: dadosOficina?.nomeOficina || '' };
            if (editandoVeiculo) {
                await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_veiculos', editandoVeiculo), dados);
            } else {
                await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_veiculos'), { ...dados, data_registro: new Date().toISOString() });
            }
            setFormVeiculo({ modelo: '', ano: '', cor: '', valorLeilao: '', procedencia: '', patio: '', detalhes: '', fotos: [], status: 'em_desmonte' });
            setEditandoVeiculo(null); setMostrarFormVeiculo(false);
            await carregarDesmanche();
        } catch (e) { alert('Erro: ' + e.message); }
        finally { setSalvandoVeiculo(false); }
    };

    const salvarPeca = async () => {
        if (!formPeca.nome) return alert('⚠️ Preencha o nome da peça!');
        setSalvandoPeca(true);
        try {
            const dados = { ...formPeca, data_registro: new Date().toISOString() };
            if (editandoPeca) {
                await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_pecas', editandoPeca), dados);
            } else {
                await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_pecas'), dados);
            }
            setFormPeca({ nome: '', veiculoId: '', veiculoNome: '', preco: '', condicao: 'otima', codigo: '', prateleira: '', fotos: [], status: 'disponivel' });
            setEditandoPeca(null); setMostrarFormPeca(false);
            await carregarDesmanche();
        } catch (e) { alert('Erro: ' + e.message); }
        finally { setSalvandoPeca(false); }
    };

    const venderPeca = async (peca) => {
        if (!window.confirm(`Marcar "${peca.nome}" como VENDIDA por R$ ${peca.preco}?`)) return;
        try {
            await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_pecas', peca.id), { status: 'vendida', data_venda: new Date().toISOString() });
            if (carregarFinanceiro) {
                await addDoc(collection(db, 'oficinas', oficinaId, 'financeiro'), {
                    tipo: 'entrada',
                    descricao: `🚗 Venda peça desmanche: ${peca.nome}${peca.veiculoNome ? ` (${peca.veiculoNome})` : ''}`,
                    valor: Number(peca.preco) || 0,
                    formaPagamento: 'desmanche',
                    data: new Date().toISOString(),
                    data_registro: new Date().toISOString(),
                });
                await carregarFinanceiro();
            }
            await carregarDesmanche();
            alert(`✅ Peça vendida! Valor lançado automaticamente no Financeiro.`);
        } catch (e) { alert('Erro: ' + e.message); }
    };

    const salvarParceiro = async () => {
        if (!formParc.nome) return alert('⚠️ Preencha o nome da oficina!');
        setSalvandoParc(true);
        try {
            await addDoc(collection(db, 'oficinas', oficinaId, 'desmanche_parceiros'), { ...formParc, data_registro: new Date().toISOString() });
            setFormParc({ nome: '', telefone: '', cidade: '', responsavel: '' });
            setMostrarFormParc(false);
            await carregarDesmanche();
        } catch (e) { alert('Erro: ' + e.message); }
        finally { setSalvandoParc(false); }
    };

    const publicarChegada = async (carro) => {
        if (!window.confirm(`Publicar "${carro.modelo}" e avisar oficinas parceiras?`)) return;
        try {
            const parcSnap = await getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_parceiros'));
            const parceiros_ids = parcSnap.docs.map(d => d.data().oficinaId).filter(Boolean);
            const pecasDoCarroSnap = await getDocs(query(collection(db, 'oficinas', oficinaId, 'desmanche_pecas'), where('veiculoId', '==', carro.id)));
            const pecasNomes = pecasDoCarroSnap.docs.map(d => d.data().nome).join(', ');

            const globalSnap = await getDoc(doc(db, 'desmanche_global', oficinaId));
            const jaPublicados = globalSnap.exists() ? (globalSnap.data().veiculos_publicados || []) : [];
            const jaExiste = jaPublicados.find(v => v.id === carro.id);
            const carroPublicado = {
                id: carro.id, modelo: carro.modelo, ano: carro.ano, cor: carro.cor,
                patio: carro.patio, detalhes: carro.detalhes, fotos: (carro.fotos || []).slice(0, 10),
                data_publicacao: new Date().toISOString(),
            };
            const novosVeiculos = jaExiste ? jaPublicados.map(v => v.id === carro.id ? carroPublicado : v) : [...jaPublicados, carroPublicado];

            await setDoc(doc(db, 'desmanche_global', oficinaId), {
                nomeOficina: dadosOficina?.nomeOficina || 'Desmanche',
                telefone: dadosOficina?.telefone || '',
                parceiros_ids,
                veiculos_publicados: novosVeiculos,
                ultima_atualizacao: new Date().toISOString(),
            }, { merge: false });

            for (const parc of parcSnap.docs) {
                const parcData = parc.data();
                if (parcData.oficinaId) {
                    await addDoc(collection(db, 'oficinas', parcData.oficinaId, 'notificacoes_desmanche'), {
                        tipo: 'nova_chegada',
                        desmanchemId: oficinaId,
                        desmanchemNome: dadosOficina?.nomeOficina || 'Desmanche',
                        modelo: carro.modelo, ano: carro.ano, fotos: (carro.fotos || []).slice(0, 1),
                        lida: false,
                        data: new Date().toISOString(),
                    });
                }
            }

            await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_veiculos', carro.id), { publicado: true, data_publicacao: new Date().toISOString() });

            const msg = encodeURIComponent(`🚗 *NOVA CHEGADA - ${dadosOficina?.nomeOficina || 'Desmanche'}*\n\nCarro: *${carro.modelo} ${carro.ano || ''}* - ${carro.cor || ''}\nPátio: ${carro.patio || 'A definir'}\nPeças disponíveis: ${pecasNomes || 'Ver no app'}\n\n${carro.detalhes ? `📝 ${carro.detalhes}\n\n` : ''}Acesse o app Oficina IA → aba 🔩 FORNECEDORES para ver fotos e catálogo completo!\nInteresse? Responda esta mensagem! ✅`);
            let enviados = 0;
            for (const p of parceiros) {
                const tel = String(p.telefone || '').replace(/\D/g, '');
                if (tel) { window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank'); enviados++; await new Promise(r => setTimeout(r, 800)); }
            }
            await carregarDesmanche();
            alert(`✅ Publicado! WhatsApp aberto para ${enviados} oficina(s).`);
        } catch (e) { alert('Erro: ' + e.message); }
    };

    const totalInvestido = veiculosDesmanche.reduce((s, v) => s + (Number(v.valorLeilao) || 0), 0);
    const totalVendas = pecasDesmanche.filter(p => p.status === 'vendida').reduce((s, p) => s + (Number(p.preco) || 0), 0);
    const pecasDisponiveis = pecasDesmanche.filter(p => p.status === 'disponivel').length;
    const pecasVendidas = pecasDesmanche.filter(p => p.status === 'vendida').length;

    const pecasFiltradas = pecasDesmanche.filter(p => {
        const buscaOk = !buscaPeca || p.nome?.toLowerCase().includes(buscaPeca.toLowerCase()) || p.veiculoNome?.toLowerCase().includes(buscaPeca.toLowerCase()) || p.codigo?.toLowerCase().includes(buscaPeca.toLowerCase());
        const statusOk = filtroStatus === 'todos' || p.status === filtroStatus;
        return buscaOk && statusOk;
    });

    return (
        <div style={{ color: 'white', fontFamily: 'sans-serif' }}>
            {/* HEADER */}
            <div style={{ background: `linear-gradient(135deg, #1a0000, #0d0d0d)`, border: `1px solid ${COR}44`, borderRadius: '16px', padding: '25px', marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <h2 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '22px' }}>🚗 <span style={{ color: COR }}>Desmanche</span></h2>
                        <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>Gestão de veículos, peças e clientes</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Investido', valor: `R$ ${totalInvestido.toLocaleString('pt-BR')}`, cor: '#ef4444' },
                            { label: 'Vendido', valor: `R$ ${totalVendas.toLocaleString('pt-BR')}`, cor: '#00E676' },
                            { label: 'Lucro', valor: `R$ ${(totalVendas - totalInvestido).toLocaleString('pt-BR')}`, cor: totalVendas >= totalInvestido ? '#00E676' : '#ef4444' },
                        ].map(({ label, valor, cor }) => (
                            <div key={label} style={{ background: '#111', border: `1px solid ${cor}33`, borderRadius: '10px', padding: '10px 16px', textAlign: 'center' }}>
                                <p style={{ color: '#666', fontSize: '10px', margin: '0 0 2px 0', fontWeight: 'bold' }}>{label}</p>
                                <p style={{ color: cor, fontSize: '16px', fontWeight: '900', margin: 0 }}>{valor}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SUB-ABAS */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                    { key: 'veiculos', label: '🚗 Veículos', count: veiculosDesmanche.length },
                    { key: 'pecas', label: '🔩 Peças', count: pecasDisponiveis },
                    { key: 'busca_pecas', label: '🔍 Buscar Peças', count: null },
                    { key: 'parceiros', label: '🔧 Oficinas Parceiras', count: null },
                ].map(({ key, label, count }) => (
                    <button key={key} onClick={() => setSubAbaDesmanche(key)}
                        style={{ padding: '10px 18px', background: subAbaDesmanche === key ? COR : '#1a1a1a', color: subAbaDesmanche === key ? 'white' : '#888', border: `1px solid ${subAbaDesmanche === key ? COR : '#333'}`, borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {label}{count !== null ? ` (${count})` : ''}
                    </button>
                ))}
            </div>

            {/* CONTEÚDO DAS SUB-ABAS */}
            {subAbaDesmanche === 'veiculos' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ color: COR, margin: 0 }}>🚗 Veículos no Desmanche</h3>
                        <button onClick={() => { setMostrarFormVeiculo(true); setEditandoVeiculo(null); setFormVeiculo({ modelo: '', ano: '', cor: '', valorLeilao: '', procedencia: '', patio: '', detalhes: '', fotos: [], status: 'em_desmonte' }); }}
                            style={{ background: COR, color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                            + Novo Veículo
                        </button>
                    </div>
                    {veiculosDesmanche.map(carro => (
                        <div key={carro.id} style={{ background: '#111', border: '1px solid #333', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
                            <h4 style={{ color: 'white', margin: '0 0 4px 0' }}>{carro.modelo} {carro.ano}</h4>
                            <p style={{ color: '#666', fontSize: '12px' }}>🎨 {carro.cor} · 📍 {carro.patio}</p>
                            <button onClick={() => publicarChegada(carro)} style={{ marginTop: '10px', padding: '8px 14px', background: '#1a1a1a', color: '#25D366', border: '1px solid #25D36644', borderRadius: '8px', cursor: 'pointer' }}>📣 Avisar Oficinas</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
