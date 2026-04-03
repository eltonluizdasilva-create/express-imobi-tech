// ============================================================
// ========== CARROSSEL DE FOTOS DOS PNEUS ====================
// ============================================================

import React, { useState } from 'react';

const TIRE_LABELS = ['DE Diant. Esq.', 'DD Diant. Dir.', 'TE Tras. Esq.', 'TD Tras. Dir.', 'Pneu Novo'];

const TirePhotoCarousel = ({ fotos, setFotos }) => {
    return (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {(fotos || [null, null, null, null, null]).map((foto, idx) => (
                <div key={idx} style={{ flexShrink: 0, width: '90px' }}>
                    {foto ? (
                        <div style={{ position: 'relative' }}>
                            <img src={foto} style={{ width: '90px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #00E676' }} alt={TIRE_LABELS[idx]} />
                            <button
                                onClick={() => {
                                    const n = [...(fotos || [null, null, null, null, null])];
                                    n[idx] = null;
                                    if (setFotos) setFotos(n);
                                }}
                                style={{ position: 'absolute', top: '2px', right: '2px', background: '#FF0033', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                            >×</button>
                            <div style={{ fontSize: '8px', color: '#00E676', textAlign: 'center', marginTop: '3px' }}>{TIRE_LABELS[idx]}</div>
                        </div>
                    ) : (
                        <label style={{ display: 'block', cursor: 'pointer' }}>
                            <div style={{ width: '90px', height: '70px', border: '2px dashed #00E67666', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
                                <div style={{ fontSize: '16px' }}>📷</div>
                                <div style={{ fontSize: '8px', color: '#00E676', textAlign: 'center', marginTop: '2px', padding: '0 3px' }}>{TIRE_LABELS[idx]}</div>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                style={{ display: 'none' }}
                                onChange={e => {
                                    if (!e.target.files[0]) return;
                                    const r = new FileReader();
                                    r.onloadend = () => {
                                        const n = [...(fotos || [null, null, null, null, null])];
                                        n[idx] = r.result;
                                        if (setFotos) setFotos(n);
                                    };
                                    r.readAsDataURL(e.target.files[0]);
                                }}
                            />
                        </label>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TirePhotoCarousel;
