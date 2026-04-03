import React from 'react';

export default function EdicaoOSGenerica({
    osEditando, setOsEditando,
    editNomeCliente, setEditNomeCliente,
    editPlaca, setEditPlaca, normalizarPlaca,
    editModelo, setEditModelo,
    editChecklist, setEditChecklist,
    editDetalhesPecas, setEditDetalhesPecas,
    editValorPecas, setEditValorPecas,
    editValorMaoObra, setEditValorMaoObra,
    editFotoPainel, setEditFotoPainel,
    editKmAtual, setEditKmAtual,
    editKmProxima, setEditKmProxima,
    editFotos, setEditFotos,
    editLegendaFoto, setEditLegendaFoto,
    adicionarFotoEdicao, comprimirFoto,
    salvarEdicao, formatarMoeda,
    MAIN_COLOR, GREEN_MONEY, KM_COLOR
}) {
    // Se não estiver editando uma OS genérica, não renderiza nada e deixa passar
    if (!osEditando || osEditando.tipoServico || osEditando.origem === 'revisao_preventiva' || osEditando.origem === 'borracharia_pneus') {
        return null;
    }

    return (
        <div style={{ minHeight: '100vh', background: 'black', color: 'white', padding: '20px', paddingBottom: '40px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${MAIN_COLOR}`, paddingBottom: '15px' }}>
                    <h2 style={{ margin: 0, color: MAIN_COLOR }}>Editando O.S. - {osEditando.placa}</h2>
                    <button onClick={() => setOsEditando(null)} style={{ background: 'transparent', color: '#888', border: '1px solid #333', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>❌ Cancelar</button>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ color: '#888', fontSize: '12px' }}>CLIENTE / EMPRESA</label>
                        <input value={editNomeCliente} onChange={(e) => setEditNomeCliente(e.target.value)} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}><label style={{ color: '#888', fontSize: '12px' }}>PLACA</label><input value={editPlaca} onChange={(e) => setEditPlaca(normalizarPlaca(e.target.value))} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} /></div>
                    <div style={{ flex: 2 }}><label style={{ color: '#888', fontSize: '12px' }}>MODELO</label><input value={editModelo} onChange={(e) => setEditModelo(e.target.value)} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} /></div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ color: '#888', fontSize: '12px' }}>DEFEITO / CHECKLIST / SERVIÇO EXECUTADO</label>
                    <textarea value={editChecklist} onChange={(e) => setEditChecklist(e.target.value)} rows={5} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ color: '#888', fontSize: '12px' }}>PEÇAS UTILIZADAS</label>
                    <textarea value={editDetalhesPecas} onChange={(e) => setEditDetalhesPecas(e.target.value)} rows={3} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}><label style={{ color: '#888', fontSize: '12px' }}>VALOR PEÇAS (R$)</label><input type="number" value={editValorPecas} onChange={(e) => setEditValorPecas(e.target.value)} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} /></div>
                    <div style={{ flex: 1 }}><label style={{ color: '#888', fontSize: '12px' }}>MÃO DE OBRA (R$)</label><input type="number" value={editValorMaoObra} onChange={(e) => setEditValorMaoObra(e.target.value)} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }} /></div>
                </div>
                <div style={{ background: '#111', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: `1px solid ${KM_COLOR}44` }}>
                    <label style={{ color: KM_COLOR, fontSize: '12px', fontWeight: 'bold' }}>📸 KM / FOTO DO PAINEL</label>
                    {editFotoPainel ? (
                        <div style={{ marginTop: '10px' }}>
                            <img src={editFotoPainel} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} alt="Painel" />
                            <button onClick={() => setEditFotoPainel(null)} style={{ width: '100%', marginTop: '8px', padding: '8px', background: MAIN_COLOR, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>❌ REMOVER FOTO</button>
                        </div>
                    ) : (
                        <label style={{ display: 'block', marginTop: '10px', padding: '15px', border: `2px dashed ${KM_COLOR}`, borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
                            <div style={{ fontSize: '24px' }}>📷</div>
                            <div style={{ color: KM_COLOR, fontSize: '12px' }}>ADICIONAR FOTO</div>
                            <input type="file" accept="image/*" onChange={(e) => { const r = new FileReader(); r.onloadend = async () => setEditFotoPainel(await comprimirFoto(r.result)); r.readAsDataURL(e.target.files[0]); }} style={{ display: 'none' }} />
                        </label>
                    )}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <div style={{ flex: 1 }}><label style={{ color: '#888', fontSize: '11px' }}>KM ATUAL</label><input type="number" value={editKmAtual} onChange={(e) => setEditKmAtual(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: `1px solid ${KM_COLOR}`, color: KM_COLOR, borderRadius: '5px', textAlign: 'center' }} /></div>
                        <div style={{ flex: 1 }}><label style={{ color: '#888', fontSize: '11px' }}>PRÓXIMA TROCA</label><input type="number" value={editKmProxima} onChange={(e) => setEditKmProxima(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0a0a0a', border: `1px solid ${MAIN_COLOR}`, color: MAIN_COLOR, borderRadius: '5px', textAlign: 'center' }} /></div>
                    </div>
                </div>
                <div style={{ background: '#111', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
                    <label style={{ color: '#888', fontSize: '12px' }}>FOTOS DO SERVIÇO / VEÍCULO</label>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '15px' }}>
                        <input type="text" value={editLegendaFoto} onChange={(e) => setEditLegendaFoto(e.target.value)} placeholder="1º Escreva a legenda aqui..." style={{ flex: 1, padding: '10px', background: '#0a0a0a', border: '1px solid #333', color: 'white', borderRadius: '5px' }} />
                        <label style={{ padding: '10px 20px', background: '#333', color: 'white', cursor: 'pointer', borderRadius: '5px', display: 'flex', alignItems: 'center' }}>
                            📸 2º FOTO <input type="file" accept="image/*" onChange={adicionarFotoEdicao} style={{ display: 'none' }} />
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {editFotos.map((f, i) => (
                            <div key={i} style={{ position: 'relative', width: '100px', borderRadius: '5px', overflow: 'hidden', border: '1px solid #333' }}>
                                <img src={f.foto} style={{ width: '100px', height: '100px', objectFit: 'cover', display: 'block' }} alt="Serviço" />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '10px', padding: '4px', textAlign: 'center' }}>{f.legenda || 'Sem legenda'}</div>
                                <button onClick={() => setEditFotos(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '2px', right: '2px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ background: '#1a1a00', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                    <span style={{ color: '#888', fontSize: '12px' }}>VALOR TOTAL: </span>
                    <strong style={{ color: GREEN_MONEY, fontSize: '20px' }}>{formatarMoeda((Number(editValorPecas) || 0) + (Number(editValorMaoObra) || 0))}</strong>
                </div>
                <button onClick={salvarEdicao} style={{ width: '100%', padding: '18px', background: GREEN_MONEY, color: 'black', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>💾 SALVAR EDIÇÃO</button>
            </div>
        </div>
    );
}