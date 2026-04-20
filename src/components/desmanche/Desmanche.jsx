import React, { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import AbaVeiculos from './AbaVeiculos';
import AbaPecas from './AbaPecas';
import AbaParceiros from './AbaParceiros';
import AbaBuscaRede from './AbaBuscaRede';

const COR = '#ef4444';
const COR2 = '#f97316';
const VERDE = '#00E676';

export default function Desmanche({
  oficinaId,
  dadosOficina,
  carregarFinanceiro,
  db,
  setLightboxFotos,
  setLightboxIdx,
  setLightboxAberto,
}) {
  const [subAba, setSubAba] = useState('veiculos');
  const [veiculos, setVeiculos] = useState([]);
  const [pecas, setPecas] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (oficinaId) carregarTudo();
  }, [oficinaId]);

  const carregarTudo = async () => {
    if (!oficinaId) return;
    setCarregando(true);
    try {
      const [vsSnap, psSnap, parcSnap] = await Promise.all([
        getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_veiculos')),
        getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_pecas')),
        getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_parceiros')),
      ]);
      setVeiculos(vsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPecas(psSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setParceiros(parcSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setCarregando(false); }
  };

  const abrirLightbox = (fotos, idx = 0) => {
    if (setLightboxFotos && setLightboxIdx && setLightboxAberto) {
      setLightboxFotos(fotos);
      setLightboxIdx(idx);
      setLightboxAberto(true);
    }
  };

  const formatarMoeda = v => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  const totalInvestido = veiculos.reduce((s, v) => s + (Number(v.valorLeilao) || 0), 0);
  const totalVendas = pecas.filter(p => p.status === 'vendida').reduce((s, p) => s + (Number(p.preco) || 0), 0);
  const lucro = totalVendas - totalInvestido;
  const pecasDisponiveis = pecas.filter(p => p.status === 'disponivel').length;
  const pecasVendidas = pecas.filter(p => p.status === 'vendida').length;

  const publicarChegada = async (carro) => {
    if (!window.confirm(`Publicar "${carro.modelo}" e avisar oficinas parceiras?`)) return;
    try {
      const parcSnap = await getDocs(collection(db, 'oficinas', oficinaId, 'desmanche_parceiros'));
      const parceiros_ids = parcSnap.docs.map(d => d.data().oficinaId).filter(Boolean);

      const pecasDoCarroSnap = await getDocs(
        query(collection(db, 'oficinas', oficinaId, 'desmanche_pecas'), where('veiculoId', '==', carro.id))
      );
      const pecasNomes = pecasDoCarroSnap.docs.map(d => d.data().nome).join(', ');

      const globalSnap = await getDoc(doc(db, 'desmanche_global', oficinaId));
      const jaPublicados = globalSnap.exists() ? (globalSnap.data().veiculos_publicados || []) : [];
      const carroPublicado = {
        id: carro.id, modelo: carro.modelo, ano: carro.ano, cor: carro.cor,
        patio: carro.patio, detalhes: carro.detalhes,
        fotos: (carro.fotos || []).slice(0, 10),
        data_publicacao: new Date().toISOString(),
      };
      const novosVeiculos = jaPublicados.find(v => v.id === carro.id)
        ? jaPublicados.map(v => v.id === carro.id ? carroPublicado : v)
        : [...jaPublicados, carroPublicado];

      await setDoc(doc(db, 'desmanche_global', oficinaId), {
        nomeOficina: dadosOficina?.nomeOficina || 'Desmanche',
        telefone: dadosOficina?.telefone || '',
        parceiros_ids,
        veiculos_publicados: novosVeiculos,
        ultima_atualizacao: new Date().toISOString(),
      }, { merge: false });

      for (const p of parcSnap.docs) {
        const pd = p.data();
        if (pd.oficinaId) {
          await addDoc(collection(db, 'oficinas', pd.oficinaId, 'notificacoes_desmanche'), {
            tipo: 'nova_chegada',
            desmanchemId: oficinaId,
            desmanchemNome: dadosOficina?.nomeOficina || 'Desmanche',
            modelo: carro.modelo, ano: carro.ano,
            fotos: (carro.fotos || []).slice(0, 1),
            lida: false,
            data: new Date().toISOString(),
          });
        }
      }

      await updateDoc(doc(db, 'oficinas', oficinaId, 'desmanche_veiculos', carro.id), {
        publicado: true, data_publicacao: new Date().toISOString(),
      });

      const listaParceiros = parcSnap.docs.map(d => d.data());
      const msg = encodeURIComponent(
        `🚗 *NOVA CHEGADA — ${dadosOficina?.nomeOficina || 'Desmanche'}*\n\n` +
        `Carro: *${carro.modelo} ${carro.ano || ''}* — ${carro.cor || ''}\n` +
        `Pátio: ${carro.patio || 'A definir'}\n` +
        `Peças: ${pecasNomes || 'Ver no app'}\n\n` +
        (carro.detalhes ? `📝 ${carro.detalhes}\n\n` : '') +
        `Acesse o app → aba 🔩 FORNECEDORES para ver fotos.\nInteresse? Responda! ✅`
      );

      let enviados = 0;
      for (const p of listaParceiros) {
        const tel = String(p.telefone || '').replace(/\D/g, '');
        if (tel) {
          window.open(`https://wa.me/55${tel}?text=${msg}`, '_blank');
          enviados++;
          await new Promise(r => setTimeout(r, 800));
        }
      }

      await carregarTudo();
      alert(`✅Publicado! WhatsApp aberto para ${enviados} oficina(s).`);
    } catch (e) { alert('Erro: ' + e.message); }
  };

  return (
    <div style={{ color: 'white', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      <div style={{
        background: 'linear-gradient(135deg,#1a0000,#0d0d0d)',
        border: `1px solid ${COR}33`,
        borderRadius: '16px', padding: '22px', marginBottom: '22px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '22px' }}>
              🚗 <span style={{ color: COR }}>Desmanche</span>
            </h2>
            <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
              Gestão de veículos, peças e parceiros
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { label: 'Investido', valor: `R$ ${formatarMoeda(totalInvestido)}`, cor: COR },
              { label: 'Vendido', valor: `R$ ${formatarMoeda(totalVendas)}`, cor: VERDE },
              { label: 'Lucro', valor: `R$ ${formatarMoeda(lucro)}`, cor: lucro >= 0 ? VERDE : COR },
              { label: 'Peças Disp.', valor: pecasDisponiveis, cor: '#f97316' },
              { label: 'Vendidas', valor: pecasVendidas, cor: VERDE },
            ].map(({ label, valor, cor }) => (
              <div key={label} style={{
                background: '#111', border: `1px solid ${cor}22`,
                borderRadius: '10px', padding: '10px 14px', textAlign: 'center', minWidth: '80px',
              }}>
                <p style={{ color: '#555', fontSize: '10px', margin: '0 0 2px 0', fontWeight: 'bold', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ color: cor, fontSize: '15px', fontWeight: '900', margin: 0 }}>{valor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { key: 'veiculos', label: '🚗 Veículos', count: veiculos.length },
          { key: 'pecas', label: '🔩 Peças', count: pecasDisponiveis },
          { key: 'busca', label: '🔍 Buscar na Rede', count: null },
          { key: 'parceiros', label: '🔧 Parceiros', count: parceiros.length },
        ].map(({ key, label, count }) => (
          <button key={key} onClick={() => setSubAba(key)} style={{
            padding: '10px 18px',
            background: subAba === key ? COR : '#1a1a1a',
            color: subAba === key ? 'white' : '#777',
            border: `1px solid ${subAba === key ? COR : '#2a2a2a'}`,
            borderRadius: '20px', fontWeight: 'bold',
            fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}>
            {label}{count !== null ? ` (${count})` : ''}
          </button>
        ))}
      </div>

      {carregando && <p style={{ color: '#555', textAlign: 'center' }}>Carregando...</p>}

      {subAba === 'veiculos' && (
        <AbaVeiculos
          db={db}
          oficinaId={oficinaId}
          veiculos={veiculos}
          pecas={pecas}
          onReload={carregarTudo}
          onAbrirLightbox={abrirLightbox}
          onPublicarChegada={publicarChegada}
        />
      )}

      {subAba === 'pecas' && (
        <AbaPecas
          db={db}
          oficinaId={oficinaId}
          pecas={pecas}
          veiculos={veiculos}
          onReload={carregarTudo}
          onAbrirLightbox={abrirLightbox}
          dadosOficina={dadosOficina}
          carregarFinanceiro={carregarFinanceiro}
        />
      )}

      {subAba === 'busca' && (
        <AbaBuscaRede db={db} />
      )}

      {subAba === 'parceiros' && (
        <AbaParceiros
          db={db}
          oficinaId={oficinaId}
          parceiros={parceiros}
          onReload={carregarTudo}
        />
      )}
    </div>
  );
}