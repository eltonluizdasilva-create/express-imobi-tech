import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

export default function Fornecedores({ oficinaId, db }) {
    const [fornecedores, setFornecedores] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [form, setForm] = useState({
        nome: '',
        telefone: '',
        especialidade: '',
        cidade: '',
        contato: '',
        obs: ''
    });

    const carregarFornecedores = async () => {
        if (!oficinaId || !db) return;
        setCarregando(true);
        try {
            const snap = await getDocs(collection(db, 'oficinas', oficinaId, 'fornecedores'));
            setFornecedores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error('Erro ao buscar fornecedores:', e);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarFornecedores();
    }, [oficinaId]);

    const handleSalvar = async () => {
        if (!form.nome) {
            alert('Nome da loja é obrigatório.');
            return;
        }
        setSalvando(true);
        try {
            await addDoc(collection(db, 'oficinas', oficinaId, 'fornecedores'), {
                ...form,
                data_registro: new Date().toISOString()
            });
            setMostrarForm(false);
            setForm({ nome: '', telefone: '', especialidade: '', cidade: '', contato: '', obs: '' });
            await carregarFornecedores();
        } catch (e) {
            alert('Erro ao salvar: ' + e.message);
        } finally {
            setSalvando(false);
        }
    };

    const handleExcluir = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) return;
        try {
            await deleteDoc(doc(db, 'oficinas', oficinaId, 'fornecedores', id));
            await carregarFornecedores();
        } catch (e) {
            alert('Erro ao excluir: ' + e.message);
        }
    };

    const baseInputStyle = {
        width: '100%',
        padding: '12px',
        background: '#0a0a0a',
        border: '1px solid #333',
        color: 'white',
        borderRadius: '8px',
        marginBottom: '10px'
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#f97316', margin: 0 }}>🛒 Fornecedores e Autopeças</h2>
                <button 
                    onClick={() => setMostrarForm(!mostrarForm)} 
                    style={{ padding: '10px 16px', background: '#f97316', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    {mostrarForm ? '✕ CANCELAR' : '➕ NOVO FORNECEDOR'}
                </button>
            </div>

            {mostrarForm && (
                <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #f9731644', marginBottom: '24px' }}>
                    <h3 style={{ color: '#f97316', marginTop: 0 }}>Cadastrar Fornecedor</h3>
                    
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 2, minWidth: '200px' }}>
                            <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>NOME DA LOJA / DESMANCHE *</label>
                            <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} style={baseInputStyle} placeholder="Ex: MercadoCar, Autopeças do Zé..." />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>TELEFONE / WHATSAPP</label>
                            <input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} style={baseInputStyle} placeholder="(11) 99999-9999" />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>CIDADE/BAIRRO</label>
                            <input value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} style={baseInputStyle} placeholder="Ex: São Paulo / Tatuapé" />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>CONTATO (Vendedor)</label>
                            <input value={form.contato} onChange={e => setForm({...form, contato: e.target.value})} style={baseInputStyle} placeholder="Ex: Roberto" />
                        </div>
                    </div>

                    <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>ESPECIALIDADE</label>
                    <input value={form.especialidade} onChange={e => setForm({...form, especialidade: e.target.value})} style={baseInputStyle} placeholder="Ex: Peças para suspensão, motor, importados..." />

                    <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>OBSERVAÇÕES (Opcional)</label>
                    <textarea value={form.obs} onChange={e => setForm({...form, obs: e.target.value})} style={{ ...baseInputStyle, resize: 'vertical' }} rows={2} placeholder="Desconto de 10% para oficina, entrega rápida..." />

                    <button 
                        onClick={handleSalvar} 
                        disabled={salvando}
                        style={{ width: '100%', padding: '14px', background: salvando ? '#555' : '#f97316', color: salvando ? '#ccc' : 'black', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', marginTop: '10px' }}
                    >
                        {salvando ? '⏳ SALVANDO...' : '💾 SALVAR FORNECEDOR'}
                    </button>
                </div>
            )}

            {carregando ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Carregando fornecedores...</div>
            ) : fornecedores.length === 0 ? (
                <div style={{ background: '#111', padding: '40px', borderRadius: '12px', border: '1px solid #333', textAlign: 'center' }}>
                    <h3 style={{ color: '#aaa', margin: '0 0 10px' }}>Nenhum fornecedor cadastrado</h3>
                    <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Adicione as lojas de autopeças onde você costuma comprar peças.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #333', color: '#888', textAlign: 'left' }}>
                                <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>Fornecedor</th>
                                <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>Contato / Fone</th>
                                <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>Local</th>
                                <th style={{ padding: '12px 8px', fontWeight: 'bold' }}>Especialidade</th>
                                <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fornecedores.map(f => (
                                <tr key={f.id} style={{ borderBottom: '1px solid #222', color: 'white' }}>
                                    <td style={{ padding: '14px 8px' }}>
                                        <strong style={{ color: '#f97316', display: 'block' }}>{f.nome}</strong>
                                        {f.obs && <span style={{ fontSize: '11px', color: '#666' }}>{f.obs}</span>}
                                    </td>
                                    <td style={{ padding: '14px 8px', color: '#ccc' }}>
                                        {f.contato && <span style={{ display: 'block', fontSize: '12px' }}>Vendedor: {f.contato}</span>}
                                        {f.telefone || '-'}
                                    </td>
                                    <td style={{ padding: '14px 8px', color: '#aaa' }}>{f.cidade || '-'}</td>
                                    <td style={{ padding: '14px 8px', color: '#aaa' }}>{f.especialidade || '-'}</td>
                                    <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                                        {f.telefone && (
                                            <a 
                                                href={`https://wa.me/55${f.telefone.replace(/\D/g, '')}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                style={{ display: 'inline-block', padding: '6px 10px', background: '#25D366', color: 'black', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '11px', marginRight: '6px' }}
                                            >
                                                Ver no WhatsApp
                                            </a>
                                        )}
                                        <button 
                                            onClick={() => handleExcluir(f.id)}
                                            style={{ padding: '6px 8px', background: 'transparent', color: '#ef4444', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                        >
                                            Deletar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}