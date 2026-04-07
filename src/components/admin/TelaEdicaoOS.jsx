/* eslint-disable react/prop-types */

export default function TelaEdicaoOS({
  osEditando,
  setOsEditando,
  fecharEdicao,
  salvarEdicao,
  normalizarPlaca,
  SpeechTextarea,
  GREEN,
  MAIN,
}) {
  if (!osEditando) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'black', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: `1px solid ${MAIN}`, paddingBottom: '15px' }}>
          <h2 style={{ margin: 0, color: MAIN }}>✏️ Editando O.S. - {osEditando.placa}</h2>
          <button onClick={fecharEdicao} style={{ background: 'transparent', color: '#888', border: '1px solid #333', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>✖ Cancelar</button>
        </div>
        <div style={{ display: 'grid', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ color: '#888', fontSize: '12px' }}>CLIENTE</label>
            <input
              value={osEditando.nomeCliente || ''}
              onChange={(e) => setOsEditando({ ...osEditando, nomeCliente: e.target.value })}
              style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ color: '#888', fontSize: '12px' }}>PLACA</label>
              <input
                value={osEditando.placa || ''}
                onChange={(e) => setOsEditando({ ...osEditando, placa: normalizarPlaca(e.target.value) })}
                style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>VEÍCULO</label>
                <input
                  value={osEditando.modelo || ''}
                  onChange={(e) => setOsEditando({ ...osEditando, modelo: e.target.value })}
                  placeholder="Ex: Gol"
                  style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>ANO</label>
                <input
                  value={osEditando.ano || ''}
                  onChange={(e) => setOsEditando({ ...osEditando, ano: e.target.value })}
                  placeholder="2020"
                  style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>MOTOR</label>
                <input
                  value={osEditando.motor || ''}
                  onChange={(e) => setOsEditando({ ...osEditando, motor: e.target.value })}
                  placeholder="1.6"
                  style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '8px' }}
                />
              </div>
            </div>
          </div>
          <SpeechTextarea
            label="SERVIÇO"
            value={osEditando.checklist || ''}
            onChange={(value) => setOsEditando({ ...osEditando, checklist: value })}
            rows={4}
            placeholder="Descreva os serviços executados..."
            labelStyle={{ color: '#888', fontSize: '12px' }}
          />
          <SpeechTextarea
            label="PEÇAS"
            value={osEditando.detalhesPecas || ''}
            onChange={(value) => setOsEditando({ ...osEditando, detalhesPecas: value })}
            rows={3}
            placeholder="Descreva peças e observações..."
            labelStyle={{ color: '#888', fontSize: '12px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ color: '#888', fontSize: '12px' }}>VALOR PEÇAS</label>
              <input
                type="number"
                value={osEditando.valorPecas || ''}
                onChange={(e) => setOsEditando({ ...osEditando, valorPecas: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }}
              />
            </div>
            <div>
              <label style={{ color: '#888', fontSize: '12px' }}>MÃO DE OBRA</label>
              <input
                type="number"
                value={osEditando.valorMaoObra || ''}
                onChange={(e) => setOsEditando({ ...osEditando, valorMaoObra: e.target.value })}
                style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '5px' }}
              />
            </div>
          </div>
        </div>
        <button onClick={salvarEdicao} style={{ width: '100%', padding: '18px', background: GREEN, color: 'black', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
          💾 SALVAR EDIÇÃO
        </button>
      </div>
    </div>
  );
}
