import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function OficinaPatrimonio({ oficinaId }) {
    const [equipamentoNome, setEquipamentoNome] = useState('');
    const [equipamentoFoto, setEquipamentoFoto] = useState(null);
    const [listaEquipamentos, setListaEquipamentos] = useState([]);
    const [carregando, setCarregando] = useState(false);

    const carregarEquipamentos = async () => {
        if (!oficinaId) return;
        setCarregando(true);
        try {
            const snap = await getDocs(collection(db, 'oficinas', oficinaId, 'patrimonio'));
            setListaEquipamentos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error('Erro ao carregar patrimônio:', e);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarEquipamentos();
    }, [oficinaId]);

    const comprimirFoto = (base64, qualidade = 0.5) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', qualidade));
            };
        });
    };

    const handleSalvarEquipamento = async () => {
        if (!equipamentoNome.trim()) return alert('Digite o nome do equipamento');
        if (!oficinaId) return;
        
        try {
            await addDoc(collection(db, 'oficinas', oficinaId, 'patrimonio'), {
                nome: equipamentoNome,
                foto: equipamentoFoto,
                data_registro: new Date().toISOString()
            });
            setEquipamentoNome('');
            setEquipamentoFoto(null);
            carregarEquipamentos();
        } catch (e) {
            alert('Erro ao salvar: ' + e.message);
        }
    };

    const handleDeletar = async (id) => {
        if (!window.confirm('Excluir este equipamento?')) return;
        try {
            await deleteDoc(doc(db, 'oficinas', oficinaId, 'patrimonio', id));
            carregarEquipamentos();
        } catch (e) {
            alert('Erro ao deletar: ' + e.message);
        }
    };
    return (
        <div>
            <div style={{ background: 'linear-gradient(135deg, #1a1400, #0d0d0d)', border: '1px solid #D4AF3744', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', background: '#D4AF3722', border: '2px solid #D4AF37', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>P</div>
                    <div>
                        <h2 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '900' }}>Gestao de <span style={{ color: '#D4AF37' }}>Patrimonio</span></h2>
                        <p style={{ color: '#555', margin: 0, fontSize: '12px' }}>Cadastre aqui as ferramentas grandes e equipamentos de valor que pertencem a oficina.</p>
                    </div>
                </div>
            </div>
            <div style={{ background: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #D4AF3733', marginBottom: '24px' }}>
                <label style={{ color: '#D4AF37', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '12px', letterSpacing: '1px' }}>NOVO EQUIPAMENTO</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <input type="text" value={equipamentoNome} onChange={e => setEquipamentoNome(e.target.value)} placeholder="Nome do Equipamento..." style={{ flex: 1, minWidth: '200px', padding: '14px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '10px', fontSize: '14px' }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 18px', background: '#0a0a0a', color: '#00E676', border: '1px dashed #00E67644', cursor: 'pointer', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px' }}>
                        FOTO
                        <input type="file" accept="image/*" capture="environment" onChange={e => { const r = new FileReader(); r.onload = async () => setEquipamentoFoto(await comprimirFoto(r.result, 0.5)); r.readAsDataURL(e.target.files[0]); }} style={{ display: 'none' }} />
                    </label>
                    <button onClick={handleSalvarEquipamento} style={{ padding: '14px 24px', background: '#D4AF37', color: 'black', border: 'none', fontWeight: 'bold', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}>SALVAR</button>
                </div>
                {equipamentoFoto && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><img src={equipamentoFoto} style={{ height: '60px', width: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #D4AF3744' }} /><button onClick={() => setEquipamentoFoto(null)} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef444444', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px' }}>Remover</button></div>}
            </div>
            {carregando ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Carregando...</div>
            ) : listaEquipamentos.length === 0 ? (
                <div style={{ background: '#0a0a0a', border: '1px dashed #D4AF3733', borderRadius: '16px', padding: '50px', textAlign: 'center' }}>
                    <p style={{ fontSize: '48px', margin: '0 0 10px 0' }}>P</p>
                    <p style={{ color: '#333', margin: 0, fontSize: '14px' }}>Nenhum equipamento cadastrado ainda.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                    {listaEquipamentos.map(eq => (
                        <div key={eq.id} style={{ background: '#0a0a0a', borderRadius: '12px', position: 'relative', textAlign: 'center', overflow: 'hidden', border: '1px solid #D4AF3722' }}>
                            {eq.foto ? <img src={eq.foto} style={{ width: '100%', height: '100px', objectFit: 'cover' }} /> : <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '30px' }}>F</div>}
                            <p style={{ margin: '8px 6px', fontWeight: 'bold', fontSize: '12px', color: '#D4AF37' }}>{eq.nome}</p>
                            <button onClick={() => handleDeletar(eq.id)} style={{ position: 'absolute', top: '6px', right: '6px', background: '#ef444433', color: '#ef4444', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>x</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
