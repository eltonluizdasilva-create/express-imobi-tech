import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const AbaEstrategia = ({ oficinaId }) => {
    const [loading, setLoading] = useState(true);

    const [alertasJuridicos, setAlertasJuridicos] = useState({ semFoto: 0, semAssinatura: 0 });
    const [alertasContabeis, setAlertasContabeis] = useState({ osInadimplentes: 0, valorPendente: 0, nfPendente: 0 });
    const [alertasSecretaria, setAlertasSecretaria] = useState({ orcamentosPerdidosCount: 0, valorPerdido: 0 });

    const alertarEquipe = () => {
        const texto = encodeURIComponent(`🚨 *ALERTA ESTRATÉGICO DA DIREÇÃO* 🚨\n\nPessoal, o nosso sistema detectou:\n📸 ${alertasJuridicos.semFoto} serviços finalizados sem foto.\n✍️ ${alertasJuridicos.semAssinatura} serviços sem assinatura.\n\nPor favor, atenção aos procedimentos no pátio para evitarmos problemas jurídicos!`);
        window.open(`https://wa.me/?text=${texto}`, '_blank');
    };

    const cobrarInadimplentes = () => {
        alert(`💰 Iniciando processo de recuperação de R$ ${alertasContabeis.valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}...\n\n(Aba de cobrança em desenvolvimento)`);
    };

    const recontatarOrcamentos = () => {
        alert(`📞 Acionando Secretária Digital para recuperar R$ ${alertasSecretaria.valorPerdido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em orçamentos não aprovados...`);
    };

    useEffect(() => {
        if (!oficinaId) {
            console.log("Aguardando ID da oficina...");
            setLoading(false);
            return;
        }

        const buscarDadosEstrategicos = async () => {
            setLoading(true);
            try {
                const osRef = collection(db, "oficinas", oficinaId, "os");
                const querySnapshot = await getDocs(osRef);

                let contSemFoto = 0;
                let contSemAssinatura = 0;
                let contInadimplentes = 0;
                let somaValorPendente = 0;
                let contNfPendente = 0;

                let contOrcamentos = 0;
                let somaValorOrcamentoPerdido = 0;

                const trintaDiasAtras = new Date();
                trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

                querySnapshot.forEach((doc) => {
                    const os = doc.data();

                    // 1. FOTOS
                    if (!os.fotos || os.fotos.length === 0) contSemFoto++;

                    // 2. ASSINATURA
                    if (!os.assinatura) contSemAssinatura++;

                    // 3. CAIXA & SECRETÁRIA (O Escudo Anti-Erro está aqui)
                    if (os.statusPagamento === 'pendente' || os.status === 'pendente') {
                        contInadimplentes++;
                        somaValorPendente += (Number(os.total) || 0);

                        let dataOS = null;

                        // Tenta extrair a data de forma segura, seja Timestamp ou String
                        if (os.data_registro && typeof os.data_registro.toDate === 'function') {
                            dataOS = os.data_registro.toDate();
                        } else if (os.data_registro) {
                            dataOS = new Date(os.data_registro);
                        }

                        // Se encontrou a data e foi nos últimos 30 dias -> Vai para a Secretária
                        if (dataOS && dataOS >= trintaDiasAtras) {
                            contOrcamentos++;
                            somaValorOrcamentoPerdido += (Number(os.total) || 0);
                        }
                    }

                    // 4. NF
                    if (!os.nfEmitida) contNfPendente++;
                });

                setAlertasJuridicos({ semFoto: contSemFoto, semAssinatura: contSemAssinatura });
                setAlertasContabeis({ osInadimplentes: contInadimplentes, valorPendente: somaValorPendente, nfPendente: contNfPendente });
                setAlertasSecretaria({ orcamentosPerdidosCount: contOrcamentos, valorPerdido: somaValorOrcamentoPerdido });

                setLoading(false);

            } catch (error) {
                console.error("Erro ao auditar dados do Firebase:", error);
                setLoading(false);
            }
        };

        buscarDadosEstrategicos();
    }, [oficinaId]);

    return (
        // max-width aumentado para 1400px para caber as 3 caixas lado a lado com folga
        <div style={{ padding: '20px', color: '#ddd', maxWidth: '1400px', margin: '0 auto' }}>

            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <h2 style={{ color: '#ffcc00', margin: '0 0 10px 0', fontSize: '28px', textTransform: 'uppercase', letterSpacing: '1px' }}>🧠 Cérebro do Negócio</h2>
                <p style={{ color: '#aaa', fontSize: '15px', margin: 0 }}>Inteligência Estratégica, Auditoria e Máquina de Vendas em Tempo Real</p>
            </div>

            {loading ? (
                <p style={{ color: '#00E676', textAlign: 'center', fontSize: '18px', fontWeight: 'bold' }}>⏳ Sincronizando dados com o servidor...</p>
            ) : (
                // O gridTemplateColumns com minmax(350px, 1fr) garante que fiquem lado a lado
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px', alignItems: 'start' }}>

                    {/* ==================================================================== */}
                    {/* 🛡️ MÓDULO 1: PROTEÇÃO JURÍDICA (NEON VERMELHO)                      */}
                    {/* ==================================================================== */}
                    <div style={{
                        background: '#0a0a0a',
                        border: '2px solid #ff3333',
                        borderRadius: '12px',
                        padding: '25px',
                        // Efeito NEON BRILHANTE
                        boxShadow: '0 0 20px rgba(255, 51, 51, 0.4), inset 0 0 10px rgba(255, 51, 51, 0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '28px', marginRight: '15px', textShadow: '0 0 10px #ff3333' }}>⚖️</span>
                            <h3 style={{ color: '#ff3333', margin: 0, fontSize: '20px', textShadow: '0 0 5px rgba(255,51,51,0.5)' }}>Proteção Jurídica</h3>
                        </div>
                        <p style={{ fontSize: '13px', color: '#999', marginBottom: '25px', lineHeight: '1.5' }}>Auditoria de provas do estado do veículo e autorizações de serviço.</p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#111', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #333' }}>
                            <span style={{ color: '#ddd' }}>📸 Serviços sem fotos:</span>
                            <strong style={{ color: alertasJuridicos.semFoto > 0 ? '#ff3333' : '#00E676', fontSize: '18px' }}>{alertasJuridicos.semFoto}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#111', padding: '15px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #333' }}>
                            <span style={{ color: '#ddd' }}>✍️ Serviços sem assinatura:</span>
                            <strong style={{ color: alertasJuridicos.semAssinatura > 0 ? '#ffcc00' : '#00E676', fontSize: '18px' }}>{alertasJuridicos.semAssinatura}</strong>
                        </div>

                        <button onClick={alertarEquipe} style={{ width: '100%', padding: '15px', background: 'rgba(255, 51, 51, 0.1)', color: '#ff3333', border: '1px solid #ff3333', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.3s' }}>
                            🚨 ALERTA GERAL DA EQUIPE
                        </button>
                    </div>

                    {/* ==================================================================== */}
                    {/* 🧾 MÓDULO 2: AUDITORIA CONTÁBIL (NEON AZUL)                         */}
                    {/* ==================================================================== */}
                    <div style={{
                        background: '#0a0a0a',
                        border: '2px solid #3b82f6',
                        borderRadius: '12px',
                        padding: '25px',
                        // Efeito NEON BRILHANTE
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), inset 0 0 10px rgba(59, 130, 246, 0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '28px', marginRight: '15px', textShadow: '0 0 10px #3b82f6' }}>🧾</span>
                            <h3 style={{ color: '#3b82f6', margin: 0, fontSize: '20px', textShadow: '0 0 5px rgba(59,130,246,0.5)' }}>Caixa & Devedores</h3>
                        </div>
                        <p style={{ fontSize: '13px', color: '#999', marginBottom: '25px', lineHeight: '1.5' }}>Controle de inadimplência e pendências fiscais que afetam seu lucro.</p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '15px', borderRadius: '8px', marginBottom: '15px', borderLeft: '4px solid #ffcc00', borderTop: '1px solid #333', borderRight: '1px solid #333', borderBottom: '1px solid #333' }}>
                            <div>
                                <span style={{ color: '#ddd', display: 'block', marginBottom: '5px' }}>⚠️ Pagamentos pendentes:</span>
                                <span style={{ fontSize: '12px', color: '#ffcc00' }}>{alertasContabeis.osInadimplentes} Ordens de Serviço</span>
                            </div>
                            <strong style={{ color: '#ffcc00', fontSize: '22px', textShadow: '0 0 8px rgba(255,204,0,0.4)' }}>
                                R$ {alertasContabeis.valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', background: '#111', padding: '15px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #333' }}>
                            <span style={{ color: '#ddd' }}>📄 Serviços sem Nota Fiscal:</span>
                            <strong style={{ color: alertasContabeis.nfPendente > 0 ? '#ff3333' : '#00E676', fontSize: '18px' }}>{alertasContabeis.nfPendente}</strong>
                        </div>

                        <button onClick={cobrarInadimplentes} style={{ width: '100%', padding: '15px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' }}>
                            📲 COBRAR INADIMPLENTES
                        </button>
                    </div>

                    {/* ==================================================================== */}
                    {/* 📞 MÓDULO 3: SECRETÁRIA DIGITAL (NEON VERDE)                        */}
                    {/* ==================================================================== */}
                    <div style={{
                        background: '#0a0a0a',
                        border: '2px solid #00E676',
                        borderRadius: '12px',
                        padding: '25px',
                        // Efeito NEON BRILHANTE
                        boxShadow: '0 0 20px rgba(0, 230, 118, 0.4), inset 0 0 10px rgba(0, 230, 118, 0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '28px', marginRight: '15px', textShadow: '0 0 10px #00E676' }}>📞</span>
                            <h3 style={{ color: '#00E676', margin: 0, fontSize: '20px', textShadow: '0 0 5px rgba(0,230,118,0.5)' }}>Secretária Digital</h3>
                        </div>
                        <p style={{ fontSize: '13px', color: '#999', marginBottom: '25px', lineHeight: '1.5' }}>Recuperação de faturamento de orçamentos parados nos últimos 30 dias.</p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '15px', borderRadius: '8px', marginBottom: '25px', borderLeft: '4px solid #00E676', borderTop: '1px solid #333', borderRight: '1px solid #333', borderBottom: '1px solid #333' }}>
                            <div>
                                <span style={{ color: '#ddd', display: 'block', marginBottom: '5px' }}>💰 Orçamentos Parados:</span>
                                <span style={{ fontSize: '12px', color: '#00E676' }}>{alertasSecretaria.orcamentosPerdidosCount} clientes esquecidos</span>
                            </div>
                            <strong style={{ color: '#00E676', fontSize: '22px', textShadow: '0 0 8px rgba(0,230,118,0.4)' }}>
                                R$ {alertasSecretaria.valorPerdido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </strong>
                        </div>

                        <button onClick={recontatarOrcamentos} style={{ width: '100%', padding: '15px', background: '#00E676', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,230,118,0.3)' }}>
                            📲 RECONTATAR PARA FECHAR
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};

export default AbaEstrategia;