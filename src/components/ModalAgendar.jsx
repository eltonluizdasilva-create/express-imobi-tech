// ============================================================
// ========== MODAL DE AGENDAMENTO DE RETORNO =================
// ============================================================

import React, { useState } from 'react';

const ModalAgendar = ({ os, nomeOficina, onConfirmar, onFechar }) => {
    const [dataHora, setDataHora] = useState('');

    const formatarDataHora = (valor) => {
        if (!valor) return '';
        const d = new Date(valor);
        return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const handleConfirmar = () => {
        if (!dataHora) return alert('Por favor, selecione uma data e horário.');
        onConfirmar(os, dataHora, formatarDataHora(dataHora));
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: '16px', padding: '28px', maxWidth: '400px', width: '100%' }}>
                <h3 style={{ color: '#3b82f6', margin: '0 0 8px' }}>📅 Agendar Retorno</h3>
                <p style={{ color: '#888', fontSize: '13px', margin: '0 0 20px' }}>
                    {os?.nomeCliente || 'Cliente'} — {os?.placa || ''}
                </p>

                <label style={{ color: '#aaa', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                    Data e Horário:
                </label>
                <input
                    type="datetime-local"
                    value={dataHora}
                    onChange={e => setDataHora(e.target.value)}
                    style={{
                        width: '100%', padding: '12px', background: '#0a0a0a',
                        border: '1px solid #444', color: 'white', borderRadius: '8px',
                        fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box'
                    }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleConfirmar}
                        style={{
                            flex: 1, padding: '14px', background: '#3b82f6', color: 'white',
                            border: 'none', borderRadius: '8px', fontWeight: '900',
                            fontSize: '14px', cursor: 'pointer'
                        }}
                    >
                        ✅ Confirmar e enviar WhatsApp
                    </button>
                    <button
                        onClick={onFechar}
                        style={{
                            padding: '14px 18px', background: 'transparent', color: '#666',
                            border: '1px solid #333', borderRadius: '8px', cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        ❌
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalAgendar;
