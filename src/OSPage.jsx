import React, { useState, useEffect, useRef } from 'react';
import { db } from './lib/firebase'; 
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore'; 
import { useOficina } from './components/OficinaContext';

const APP_LINK = 'https://oficina.expresstech.com.br';
const SITE_LINK = 'https://expresstech.com.br';

export default function OSPage() {
  const { oficinaId } = useOficina() || {};
  
  const [cliente, setCliente] = useState('');
  const [placa, setPlaca] = useState('');
  const [celular, setCelular] = useState('');
  const [modelo, setModelo] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('🚗 CARRO'); 
  const [kmAtual, setKmAtual] = useState('');
  const [kmProxima, setKmProxima] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [pecasDescricao, setPecasDescricao] = useState('');
  const [valorPecas, setValorPecas] = useState('');
  const [valorMaoObra, setValorMaoObra] = useState('');
  const [galeria, setGaleria] = useState([]);
  const [legendaFoto, setLegendaFoto] = useState('');
  const inputFotoRef = useRef(null);
  const [listaOS, setListaOS] = useState([]);
  const [idEditando, setIdEditando] = useState(null);

  const carregarOS = async () => {
    if (!oficinaId) return;
    try {
      const querySnapshot = await getDocs(collection(db, "oficinas", oficinaId, "os"));
      const listaTemp = [];
      querySnapshot.forEach((doc) => {
        listaTemp.push({ id: doc.id, ...doc.data() });
      });
      listaTemp.sort((a, b) => {
        const dataA = a.data?.toMillis ? a.data.toMillis() : new Date(a.dataEntrada || a.data).getTime();
        const dataB = b.data?.toMillis ? b.data.toMillis() : new Date(b.dataEntrada || b.data).getTime();
        return dataB - dataA;
      });
      setListaOS(listaTemp);
    } catch (error) {
      console.error("Erro ao carregar OS:", error);
    }
  };

  useEffect(() => { carregarOS(); }, [oficinaId]);

  const processarFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!legendaFoto) { alert("⚠️ Dite ou digite uma legenda para a foto primeiro!"); return; }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; 
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const fotoTextoBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setGaleria([...galeria, { legenda: legendaFoto, imagem: fotoTextoBase64 }]);
        setLegendaFoto(''); 
      };
    };
  };

  const handleRemoverFoto = (index) => setGaleria(galeria.filter((_, i) => i !== index));

  const handleSalvarOS = async () => {
    if (!cliente && !placa) { alert("⚠️ Digite a Placa ou o Nome do Cliente!"); return; }
    try {
      const vPecas = parseFloat(String(valorPecas).replace(',', '.')) || 0;
      const vMaoObra = parseFloat(String(valorMaoObra).replace(',', '.')) || 0;
      const dadosOS = {
        cliente, placa: placa.toUpperCase(), celular, modelo, tipoVeiculo,
        kmAtual, kmProxima, diagnostico, pecasDescricao, 
        valorPecas: vPecas, valorMaoObra: vMaoObra, total: vPecas + vMaoObra,
        galeria, data: new Date()
      };
      if (idEditando) {
        await updateDoc(doc(db, "oficinas", oficinaId, "os", idEditando), dadosOS);
        alert("🔄 O.S. atualizada!");
      } else {
        await addDoc(collection(db, "oficinas", oficinaId, "os"), dadosOS);
        alert("✅ O.S. salva!");
      }
      limparFormulario();
      carregarOS();
    } catch (error) {
      alert("❌ Erro: " + error.message);
    }
  };

  const handleEditar = (os) => {
    setCliente(os.cliente || '');
    setPlaca(os.placa || ''); 
    setCelular(os.celular || os.telefone || ''); 
    setModelo(os.modelo || os.veiculo || '');
    setTipoVeiculo(os.tipoVeiculo || '🚗 CARRO');
    setKmAtual(os.kmAtual || ''); 
    setKmProxima(os.kmProxima || '');
    setDiagnostico(os.diagnostico || os.defeitoRelatado || ''); 
    setPecasDescricao(os.pecasDescricao || '');
    setValorPecas(os.valorPecas ? String(os.valorPecas).replace('.', ',') : '');
    setValorMaoObra(os.valorMaoObra ? String(os.valorMaoObra).replace('.', ',') : '');
    setGaleria(os.galeria || []); 
    setIdEditando(os.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const limparFormulario = () => {
    setCliente(''); setPlaca(''); setCelular(''); setModelo(''); setTipoVeiculo('🚗 CARRO');
    setKmAtual(''); setKmProxima(''); setDiagnostico(''); setPecasDescricao('');
    setValorPecas(''); setValorMaoObra(''); setGaleria([]); setLegendaFoto('');
    setIdEditando(null);
  };

  const handleOuvirVoz = (setCampoAlvo) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("⚠️ Voz não suportada.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR'; 
    recognition.onresult = (e) => setCampoAlvo((t) => t + (t ? ' ' : '') + e.results[0][0].transcript);
    recognition.start();
  };

  // ✅ Enviar laudo individual com link do app + rodapé do site
  const enviarLaudoWhatsApp = (os) => {
    const tel = os.celular || os.telefone;
    if (!tel) { alert("⚠️ Sem número de WhatsApp nesta O.S."); return; }
    const total = Number(os.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const km = os.kmAtual ? `🛣️ KM: ${os.kmAtual}` : '';
    const proximaTroca = os.kmProxima ? `\n🔔 Próxima troca: ${os.kmProxima} km` : '';
    const msg =
`👋 Olá${os.cliente ? ', ' + os.cliente : ''}!

🔧 *O.S. — ${os.modelo || 'Veículo'} ${os.placa ? '| ' + os.placa : ''}*
${km}${proximaTroca}

📋 *Serviço:* ${os.diagnostico || os.checklist || 'Conforme combinado'}

💰 *Total: R$ ${total}*

📱 Acesse seu histórico completo:
${APP_LINK}

─────────────────
🏢 *Express Tech*
${SITE_LINK}`;
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ✅ Enviar TODOS os laudos do histórico de uma vez
  const enviarTodosLaudos = (os) => {
    const tel = os.celular || os.telefone;
    if (!tel) { alert("⚠️ Sem número de WhatsApp nesta O.S."); return; }
    const osDoCliente = listaOS.filter(o =>
      (o.placa && os.placa && o.placa === os.placa) ||
      (o.celular && os.celular && o.celular === os.celular)
    );
    if (osDoCliente.length === 0) { alert("Nenhum histórico encontrado."); return; }
    const historico = osDoCliente.map((o, i) => {
      const d = o.data?.toDate ? o.data.toDate().toLocaleDateString('pt-BR') : (o.data ? new Date(o.data).toLocaleDateString('pt-BR') : '—');
      const total = Number(o.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      return `${i + 1}. ${d} — ${o.modelo || 'Veículo'} | R$ ${total}\n   📋 ${(o.diagnostico || o.checklist || 'Serviço realizado').substring(0, 80)}`;
    }).join('\n\n');

    const msg =
`👋 Olá${os.cliente ? ', ' + os.cliente : ''}!

📂 *Histórico completo — ${os.placa || os.modelo || 'seu veículo'}*

${historico}

📱 Acesse todos os laudos detalhados:
${APP_LINK}

─────────────────
🏢 *Express Tech*
${SITE_LINK}`;
    window.open(`https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 pb-24 space-y-6 text-white font-sans">
      
      {/* 1. SELETOR DE TIPO DE VEÍCULO */}
      <div className="w-full grid grid-cols-3 gap-2">
        {['🚗 CARRO', '🏍️ MOTO', '🚚 BRUTO'].map((tipo) => (
          <button key={tipo} onClick={() => setTipoVeiculo(tipo)}
            className={`py-2 rounded-md text-[10px] font-bold transition-all border ${tipoVeiculo === tipo ? 'bg-red-600 border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-neutral-900 border-neutral-800 text-gray-500'}`}>
            {tipo}
          </button>
        ))}
      </div>

      {/* 2. DADOS BÁSICOS */}
      <div className={`w-full space-y-3 p-4 bg-neutral-900/50 rounded-xl border ${idEditando ? 'border-blue-500' : 'border-neutral-800'}`}>
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-gray-500 tracking-[0.2em]">IDENTIFICAÇÃO</label>
          <button onClick={() => handleOuvirVoz(setModelo)} className="text-gray-400 text-sm">🎤</button>
        </div>
        <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="NOME DO CLIENTE" className="w-full p-3 bg-black border border-neutral-800 rounded-lg focus:border-red-500 outline-none uppercase text-center font-bold" />
        <input type="text" value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="PLACA" className="w-full p-3 bg-black border border-neutral-800 rounded-lg focus:border-red-500 outline-none uppercase text-center font-bold tracking-widest text-xl" />
        <input type="text" value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="CELULAR (WHATSAPP)" className="w-full p-3 bg-black border border-neutral-800 rounded-lg outline-none text-center" />
        <input type="text" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="MODELO E ANO" className="w-full p-3 bg-black border border-neutral-800 rounded-lg outline-none text-center uppercase" />
      </div>

      {/* 3. KM */}
      <div className="w-full grid grid-cols-2 gap-3 p-4 bg-neutral-900/30 border border-dashed border-neutral-800 rounded-xl">
        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 font-bold">KM ATUAL</label>
          <input type="number" value={kmAtual} onChange={(e) => setKmAtual(e.target.value)} placeholder="00000" className="w-full p-2 bg-black border border-neutral-800 rounded-md outline-none text-center text-yellow-500 font-bold" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-gray-500 font-bold">PRÓX. TROCA</label>
          <input type="number" value={kmProxima} onChange={(e) => setKmProxima(e.target.value)} placeholder="00000" className="w-full p-2 bg-black border border-neutral-800 rounded-md outline-none text-center text-red-500 font-bold" />
        </div>
      </div>

      {/* 4. GALERIA */}
      <div className="w-full border border-dashed border-red-900/50 p-4 rounded-xl bg-black space-y-4 shadow-xl">
        <h3 className="text-red-500 font-bold text-center text-xs tracking-widest uppercase">📸 Galeria de Evidências</h3>
        <div className="flex flex-col gap-2">
          <div className="relative flex items-center">
            <input type="text" value={legendaFoto} onChange={(e) => setLegendaFoto(e.target.value)} placeholder="Diga a legenda e bata a foto" className="w-full p-3 pr-12 bg-neutral-900 border border-neutral-800 rounded-lg outline-none text-sm text-center italic" />
            <button onClick={() => handleOuvirVoz(setLegendaFoto)} className="absolute right-3 text-gray-500 hover:text-red-500">🎤</button>
          </div>
          <input type="file" accept="image/*" capture="environment" ref={inputFotoRef} onChange={processarFoto} className="hidden" />
          <button onClick={() => inputFotoRef.current.click()} className="w-full bg-white text-black font-bold py-3 rounded-lg flex justify-center items-center gap-2 active:scale-95 transition-transform">
            <span>📷</span> TIRAR FOTO AGORA
          </button>
        </div>
        {galeria.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {galeria.map((foto, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden border border-neutral-800">
                <img src={foto.imagem} alt="OS" className="w-full h-24 object-cover" />
                <div className="bg-black/80 text-[10px] p-1 text-center truncate uppercase font-bold text-gray-400">{foto.legenda}</div>
                <button onClick={() => handleRemoverFoto(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. DIAGNÓSTICO E VALORES */}
      <div className="w-full space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-400">DIAGNÓSTICO</label>
            <button onClick={() => handleOuvirVoz(setDiagnostico)} className="text-gray-500">🎤</button>
          </div>
          <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg h-24 outline-none text-sm"></textarea>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-400">DESCRIÇÃO PEÇAS</label>
            <button onClick={() => handleOuvirVoz(setPecasDescricao)} className="text-gray-500">🎤</button>
          </div>
          <textarea value={pecasDescricao} onChange={(e) => setPecasDescricao(e.target.value)} className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg h-20 outline-none text-sm"></textarea>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="text" value={valorPecas} onChange={(e) => setValorPecas(e.target.value)} placeholder="PEÇAS R$" className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg outline-none text-center font-bold text-green-500" />
          <input type="text" value={valorMaoObra} onChange={(e) => setValorMaoObra(e.target.value)} placeholder="M. OBRA R$" className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg outline-none text-center font-bold text-green-500" />
        </div>
      </div>

      {/* BOTÃO SALVAR */}
      <button onClick={handleSalvarOS} className={`w-full py-5 rounded-xl font-bold text-xl shadow-lg transition-all active:scale-95 ${idEditando ? 'bg-blue-600' : 'bg-red-600 shadow-red-900/20'}`}>
        {idEditando ? '🔄 ATUALIZAR O.S.' : '💾 SALVAR ORDEM DE SERVIÇO'}
      </button>

      {/* LISTA DE HISTÓRICO */}
      <div className="w-full pt-6 border-t border-neutral-900 space-y-4">
        <h3 className="text-xs font-bold text-gray-500 tracking-widest text-center">HISTÓRICO RECENTE</h3>
        {listaOS.map((os) => (
          <div key={os.id} className="w-full bg-neutral-900/50 border border-neutral-800 border-l-4 border-l-red-600 rounded-r-xl p-4 space-y-3 relative">
            
            {os.origem === 'Lead do Funil' && (
              <span className="absolute top-2 right-2 bg-red-900 text-white text-[9px] px-2 py-1 rounded font-bold uppercase">
                🎯 VEIO DO FUNIL
              </span>
            )}

            <div className="flex justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-black px-1.5 py-0.5 rounded text-gray-400">{os.tipoVeiculo || '🚗'}</span>
                  <h4 className="font-bold text-white uppercase text-sm truncate max-w-[150px]">
                    {os.cliente || os.modelo || 'Veículo'}
                  </h4>
                </div>
                <p className={`font-black tracking-tighter text-lg ${os.placa ? 'text-red-500' : 'text-gray-500 italic'}`}>
                  {os.placa || 'SEM PLACA'}
                </p>
              </div>
              <div className="text-right pt-4">
                <p className="text-[10px] text-gray-500">TOTAL</p>
                <p className="text-green-500 font-bold">R$ {Number(os.total || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
              </div>
            </div>

            {(os.kmAtual || os.galeria?.length > 0) && (
              <div className="flex gap-4 text-[10px] text-gray-400 bg-black/30 p-2 rounded">
                {os.kmAtual && <span>🛣️ {os.kmAtual} KM</span>}
                {os.galeria?.length > 0 && <span>📸 {os.galeria.length} FOTOS</span>}
              </div>
            )}

            {/* ✅ BOTÕES WHATSAPP MELHORADOS */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => enviarLaudoWhatsApp(os)}
                className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg text-xs"
              >
                📋 Enviar Laudo
              </button>
              <button
                onClick={() => enviarTodosLaudos(os)}
                className="flex-1 bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs"
              >
                📂 Todos os Laudos
              </button>
              <button
                onClick={() => handleEditar(os)}
                className="w-10 bg-blue-600 text-white py-2 rounded-lg flex justify-center items-center text-sm"
              >
                ✏️
              </button>
            </div>

            {/* ✅ RODAPÉ COM LINK DO APP */}
            <div className="text-center pt-1">
              <a href={APP_LINK} target="_blank" rel="noopener noreferrer"
                className="text-[9px] text-gray-600 hover:text-gray-400">
                🔗 {APP_LINK}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
