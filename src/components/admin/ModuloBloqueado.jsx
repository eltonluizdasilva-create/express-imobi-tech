import React from 'react';
import { Lock, Rocket, CheckCircle, X, ShoppingCart } from 'lucide-react';

export default function ModuloBloqueado({ isVisible, onClose, setAbaAtiva }) {
    if (!isVisible) return null;

    const irParaPlanos = () => {
        setAbaAtiva('meuplano');
        onClose(); // Fecha o aviso depois de redirecionar
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: '#0a0a0a', width: '100%', maxWidth: '450px',
                borderRadius: '16px', border: '2px solid #FF0033',
                boxShadow: '0 0 40px rgba(255, 0, 51, 0.4)',
                position: 'relative', overflow: 'hidden', textAlign: 'center',
                padding: '30px 20px'
            }}>
                {/* Botão Fechar */}
                <button onClick={onClose} style={{
                    position: 'absolute', top: '15px', right: '15px',
                    background: 'transparent', border: 'none', color: '#666', cursor: 'pointer',
                    transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#666'}>
                    <X size={24} />
                </button>

                {/* Ícone de Cadeado Animado */}
                <div style={{
                    width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,0,51,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', border: '2px solid #FF0033'
                }}>
                    <Lock size={35} color="#FF0033" />
                </div>

                <h2 style={{ color: 'white', margin: '0 0 10px', fontSize: '22px', fontWeight: '900', textTransform: 'uppercase' }}>
                    Módulo Exclusivo
                </h2>

                <p style={{ color: '#bbb', fontSize: '14px', lineHeight: '1.5', margin: '0 0 20px' }}>
                    Esta ferramenta faz parte do nosso pacote profissional de crescimento.
                </p>

                {/* Caixa de Vantagens (A Isca) */}
                <div style={{
                    background: '#111', border: '1px solid #222', borderRadius: '12px',
                    padding: '16px', textAlign: 'left', marginBottom: '25px'
                }}>
                    <p style={{ color: '#FF0033', fontSize: '12px', fontWeight: '900', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Vantagens do Assinante:
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <CheckCircle size={18} color="#22c55e" />
                        <span style={{ color: '#ddd', fontSize: '13px' }}>Leva <b>TODOS</b> os módulos grátis para sempre</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <Rocket size={18} color="#a855f7" />
                        <span style={{ color: '#ddd', fontSize: '13px' }}>Libera as ferramentas operacionais travadas</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShoppingCart size={18} color="#FF0033" />
                        <span style={{ color: '#ddd', fontSize: '13px' }}>Você escolhe o que pagar na hora de montar o plano</span>
                    </div>
                </div>

                {/* Botão de Ação Principal */}
                <button onClick={irParaPlanos} style={{
                    width: '100%', padding: '16px', borderRadius: '10px',
                    background: '#FF0033', color: 'white', border: 'none',
                    fontWeight: '900', fontSize: '14px', textTransform: 'uppercase',
                    cursor: 'pointer', boxShadow: '0 5px 20px rgba(255,0,51,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}>
                    💰 QUERO LIBERAR MEU SISTEMA
                </button>
                
                <button onClick={onClose} style={{
                    marginTop: '15px', background: 'transparent', border: 'none',
                    color: '#666', fontSize: '11px', textTransform: 'uppercase',
                    fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px'
                }}>
                    Continuar no plano grátis por enquanto
                </button>
            </div>
        </div>
    );
}
