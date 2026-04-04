import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatarMoeda } from '../components/admin/constants';

export default function Recibo() {
    const { oficinaId, id } = useParams();
    const [recibo, setRecibo] = useState(null);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch OS
                const osRef = doc(db, 'oficinas', oficinaId, 'os', id);
                const osSnap = await getDoc(osRef);

                // Fetch Config
                const configRef = doc(db, 'oficinas', oficinaId);
                const configSnap = await getDoc(configRef);

                if (osSnap.exists()) {
                    setRecibo({ id: osSnap.id, ...osSnap.data() });
                }
                if (configSnap.exists()) {
                    setConfig(configSnap.data());
                }
            } catch (error) {
                console.error("Erro ao buscar recibo:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [oficinaId, id]);

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando...</div>;
    if (!recibo) return <div style={{ textAlign: 'center', padding: '50px' }}>Recibo não encontrado.</div>;

    return (
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', fontFamily: 'monospace' }}>
            <div style={{ background: 'white', color: 'black', width: '100%', maxWidth: '380px', padding: '30px', border: '1px solid #ccc' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '15px', marginBottom: '15px' }}>
                    {config?.logoUrl && <img src={config.logoUrl} style={{ maxWidth: '140px', maxHeight: '70px', marginBottom: '10px', filter: 'grayscale(1)' }} />}
                    <h2 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>{config?.nome || 'Exp Auto Tech'}</h2>
                    {config?.cnpj && <p style={{ margin: '2px 0', fontSize: '11px' }}>CNPJ/NIF: {config.cnpj}</p>}
                    <p style={{ margin: '2px 0', fontSize: '11px' }}>{config?.endereco || ''}</p>
                    <p style={{ margin: '2px 0', fontSize: '11px' }}>TEL: {config?.telefone || ''}</p>
                </div>
                <h3 style={{ textAlign: 'center', fontSize: '14px', margin: '0 0 15px 0' }}>*** ORDEM DE SERVIÇO ***</h3>
                <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>DATA:</span><strong>{String(recibo.data || '').split(',')[0]}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>O.S Nº:</span><strong>#{recibo.id?.slice(-5).toUpperCase()}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', padding: '5px 0', borderTop: '1px dotted #ccc', borderBottom: '1px dotted #ccc' }}>
                        <span>CLIENTE:</span><strong style={{ fontSize: '14px', textTransform: 'uppercase' }}>{recibo.nomeCliente || 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>PLACA:</span><strong style={{ fontSize: '16px' }}>{recibo.placa}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VEÍCULO:</span><strong>{recibo.modelo}</strong></div>
                    {recibo.kmAtual && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>KM:</span><strong>{Number(recibo.kmAtual).toLocaleString()} km</strong></div>}
                </div>
                <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '10px 0', marginBottom: '15px' }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', fontSize: '11px' }}>SERVIÇO:</p>
                    <p style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap' }}>{recibo.checklist || 'Nenhum'}</p>
                    {recibo.detalhesPecas && <><p style={{ fontWeight: 'bold', margin: '10px 0 5px 0', fontSize: '11px' }}>PEÇAS:</p><p style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap' }}>{recibo.detalhesPecas}</p></>}
                </div>
                {recibo.fotos?.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                        <p style={{ fontWeight: 'bold', margin: '0 0 8px 0', fontSize: '11px', textAlign: 'center' }}>FOTOS DO SERVIÇO</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {recibo.fotos.map((f, i) => (
                                <div key={i} style={{ textAlign: 'center' }}>
                                    <img src={f.foto} style={{ width: '100%', height: '80px', objectFit: 'cover', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    {f.legenda && <p style={{ margin: '4px 0 0 0', fontSize: '9px', lineHeight: '1.2', fontWeight: 'bold', color: '#333' }}>{f.legenda}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', marginTop: '15px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>TOTAL:</span>
                    <span style={{ fontSize: '22px', fontWeight: '900' }}>{formatarMoeda(recibo.total)}</span>
                </div>
                <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '15px' }}>
                    <p style={{ fontSize: '10px', margin: '0 0 10px 0' }}>{config?.garantia || 'Garantia de 90 dias.'}</p>
                    {config?.pixKey && (
                        <div style={{ border: '1px solid #000', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '0 0 4px 0' }}>PAGAMENTO VIA PIX</p>
                            <p style={{ fontSize: '13px', margin: 0, wordBreak: 'break-all' }}><strong>{config.pixKey}</strong></p>
                        </div>
                    )}
                    <p style={{ fontSize: '11px', marginTop: '5px', letterSpacing: '4px', fontWeight: 'bold' }}>* OBRIGADO *</p>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <button onClick={() => window.print()} style={{ width: '100%', padding: '15px', background: 'black', color: 'white', border: '2px solid black', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ IMPRIMIR RECIBO</button>
                </div>
            </div>
        </div>
    );
}