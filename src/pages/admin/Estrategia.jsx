import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const AbaEstrategia = ({ oficinaId }) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!oficinaId) {
            console.log("Aguardando ID da oficina...");
            setLoading(false);
            return;
        }

        const buscarDadosEstrategicos = async () => {
            setLoading(true);
            try {
                // ... (lógica futura de IA)
                setLoading(false);
            } catch (error) {
                console.error("Erro ao auditar dados do Firebase:", error);
                setLoading(false);
            }
        };

        buscarDadosEstrategicos();
    }, [oficinaId]);

    return (
        <div style={{ padding: '20px', color: '#ddd', maxWidth: '1400px', margin: '0 auto' }}>

            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <h2 style={{ color: '#ffcc00', margin: '0 0 10px 0', fontSize: '28px', textTransform: 'uppercase', letterSpacing: '1px' }}>🧠 Cérebro do Negócio</h2>
                <p style={{ color: '#aaa', fontSize: '15px', margin: 0 }}>Inteligência Estratégica, Auditoria e Máquina de Vendas em Tempo Real</p>
                <p style={{ color: '#555', marginTop: '20px' }}>Aguardando novos recursos de IA...</p>
            </div>

            {loading ? (
                <p style={{ color: '#00E676', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>⏳ Sincronizando dados com o servidor...</p>
            ) : (
                <div style={{ textAlign: 'center', padding: '50px', border: '2px dashed #333', borderRadius: '20px' }}>
                    <p style={{ color: '#666' }}>Espaço reservado para novos módulos de IA.</p>
                </div>
            )}
        </div>
    );
};

export default AbaEstrategia;
