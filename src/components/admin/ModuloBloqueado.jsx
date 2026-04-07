/* eslint-disable react/prop-types */
import { Lock } from 'lucide-react';

export default function ModuloBloqueado({
  toastModuloBloqueado,
  modalUpgradeAba,
  setToastModuloBloqueado,
  setModalUpgradeAba,
  setAbaAtiva,
  MAIN,
  planosSistema,
  LABELS_ABAS_MODAL,
}) {
  return (
    <>
      {toastModuloBloqueado && !modalUpgradeAba && (
        <div style={{
          position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
          background: '#111', border: `1px solid ${MAIN}`, borderRadius: '12px',
          padding: '16px 24px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '12px',
          boxShadow: `0 0 30px ${MAIN}44`, maxWidth: '400px', width: '90%'
        }}>
          <div style={{ width: '36px', height: '36px', background: `${MAIN}22`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lock size={16} color={MAIN} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: MAIN, fontWeight: 'bold', fontSize: '13px', margin: 0 }}>Módulo Premium</p>
            <p style={{ color: '#888', fontSize: '11px', margin: '2px 0 0 0' }}>Acesse a aba <strong style={{ color: 'white' }}>Meu Plano</strong> para liberar.</p>
          </div>
          <button onClick={() => setToastModuloBloqueado(null)} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: '16px', padding: '0', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {modalUpgradeAba && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#111', border: `1px solid ${MAIN}`, borderRadius: '24px',
            padding: '40px', maxWidth: '420px', width: '100%', textAlign: 'center',
            boxShadow: `0 0 60px ${MAIN}33`
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 20px',
              background: `${MAIN}22`, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Lock size={28} color={MAIN} />
            </div>
            <h2 style={{ color: MAIN, fontSize: '22px', fontWeight: '900', marginBottom: '10px', textTransform: 'uppercase' }}>
              Upgrade Necessário
            </h2>
            <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.7', marginBottom: '8px' }}>
              O módulo <strong style={{ color: 'white' }}>{LABELS_ABAS_MODAL[modalUpgradeAba] || modalUpgradeAba}</strong> não está incluso no seu plano atual.
            </p>
            <p style={{ color: '#555', fontSize: '11px', marginBottom: '28px' }}>
              Faça um upgrade para desbloquear todos os módulos e funcionalidades.
            </p>
            <a
              href={`https://wa.me/${planosSistema?.whatsapp || '5534991439845'}?text=${encodeURIComponent(`Olá! Gostaria de desbloquear o módulo ${LABELS_ABAS_MODAL[modalUpgradeAba] || modalUpgradeAba}. Qual plano preciso?`)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'block', width: '100%', padding: '16px', borderRadius: '12px',
                background: MAIN, color: 'white', fontWeight: '900', fontSize: '13px',
                textAlign: 'center', textDecoration: 'none', textTransform: 'uppercase',
                boxShadow: `0 8px 30px ${MAIN}44`, marginBottom: '10px'
              }}
            >
              💬 Falar com Suporte
            </a>
            <button
              onClick={() => { setModalUpgradeAba(null); setAbaAtiva('meuplano'); }}
              style={{
                width: '100%', padding: '14px', background: 'transparent',
                color: '#888', border: '1px solid #333', borderRadius: '12px',
                fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', textTransform: 'uppercase'
              }}
            >
              Ver Planos
            </button>
          </div>
        </div>
      )}
    </>
  );
}
