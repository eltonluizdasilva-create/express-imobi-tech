import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase'; 
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore'; 
import { useOficina } from '../components/OficinaContext'; // 🔥 Importante para o SaaS

export default function OSPage() {
  const { oficinaId } = useOficina() || {}; // 🔥 Puxa a ID da oficina logada
  
  // Campos Básicos
  const [cliente, setCliente] = useState(''); // 🔥 Novo campo para receber do Lead
  const [placa, setPlaca] = useState('');
  const [celular, setCelular] = useState('');
  const [modelo, setModelo] = useState('');
  const [tipoVeiculo, setTipoVeiculo] = useState('🚗 CARRO'); 
  
  // Controle de Quilometragem/Óleo
  const [kmAtual, setKmAtual] = useState('');
  const [kmProxima, setKmProxima] = useState('');

  // Diagnóstico e Financeiro
  const [diagnostico, setDiagnostico] = useState('');
  const [pecasDescricao, setPecasDescricao] = useState('');
  const [valorPecas, setValorPecas] = useState('');
  const [valorMaoObra, setValorMaoObra] = useState('');

  // Galeria de Fotos
  const [galeria, setGaleria] = useState([]);
  const [legendaFoto, setLegendaFoto] = useState('');
  const inputFotoRef = useRef(null);

  // Lista e Edição
  const [listaOS, setListaOS] = useState([]);
  const [idEditando, setIdEditando] = useState(null);

  const carregarOS = async () => {
    if (!oficinaId) return; // Só carrega se tiver oficina logada
    try {
      // 🔥 Busca na coleção correta da oficina atual
      const querySnapshot = await getDocs(collection(db, "oficinas", oficinaId, "os"));
      const listaTemp = [];
      querySnapshot.forEach((doc) => {
        listaTemp.push({ id: doc.id, ...doc.data() });
      });
      // Ordena pelas mais recentes
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

  useEffect(() => { 
    carregarOS(); 
  }, [oficinaId]); // Recarrega sempre que a oficina logada mudar

  // 📸 PROCESSAR FOTO
  const processarFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!legendaFoto) {
      alert("⚠️ Dite ou digite uma legenda para a foto primeiro!");
      return;
    }

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

  // 💾 SALVAR OU ATUALIZAR
  const handleSalvarOS = async () => {
    // Agora placa não é obrigatória logo de cara, porque o lead pode não ter passado a placa ainda.
    if (!cliente && !placa) { alert("⚠️ Digite a Placa ou o Nome do Cliente!"); return; }
    
    try {
      const vPecas = parseFloat(String(valorPecas).replace(',', '.')) || 0;
      const vMaoObra = parseFloat(String(valorMaoObra).replace(',', '.')) || 0;
      
      const dadosOS = {
        cliente, 
        placa: placa.toUpperCase(), 
        celular, 
        modelo, 
        tipoVeiculo,
        kmAtual, 
        kmProxima, 
        diagnostico, 
        pecasDescricao, 
        valorPecas: vPecas, 
        valorMaoObra: vMaoObra, 
        total: vPecas + vMaoObra,
        galeria, 
        data: new Date()
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
    // 🔥 Puxa os dados antigos ou os dados que vieram do Lead
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

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 pb-24 space-y-6 text-white font-sans">
      
      {/* 1. SELETOR DE TIPO DE VEÍCULO */}
      <div className="w-full grid grid-cols-3 gap-2">
        {['🚗 CARRO', '🏍️ MOTO', '🚚 BRUTO'].map((tipo) => (
          <button
            key={tipo}
            onClick={() => setTipoVeiculo(tipo)}
            className={`py-2 rounded-md text-[10px] font-bold transition-all border ${tipoVeiculo === tipo ? 'bg-red-600 border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-neutral-900 border-neutral-800 text-gray-500'}`}
          >
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
        
        {/* 🔥 Novo Campo de Cliente */}
        <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="NOME DO CLIENTE" className="w-full p-3 bg-black border border-neutral-800 rounded-lg focus:border-red-500 outline-none uppercase text-center font-bold" />
        
        <input type="text" value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="PLACA" className="w-full p-3 bg-black border border-neutral-800 rounded-lg focus:border-red-500 outline-none uppercase text-center font-bold tracking-widest text-xl" />
        <input type="text" value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="CELULAR (WHATSAPP)" className="w-full p-3 bg-black border border-neutral-800 rounded-lg outline-none text-center" />
        <input type="text" value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="MODELO E ANO" className="w-full p-3 bg-black border border-neutral-800 rounded-lg outline-none text-center uppercase" />
      </div>

      {/* 3. KM E TROCA DE ÓLEO */}
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

      {/* 4. GALERIA COM MICROFONE */}
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
          <div className="flex justify-between items-center"><label className="text-xs font-bold text-gray-400">DIAGNÓSTICO</label><button onClick={() => handleOuvirVoz(setDiagnostico)} className="text-gray-500">🎤</button></div>
          <textarea value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg h-24 outline-none text-sm"></textarea>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center"><label className="text-xs font-bold text-gray-400">DESCRIÇÃO PEÇAS</label><button onClick={() => handleOuvirVoz(setPecasDescricao)} className="text-gray-500">🎤</button></div>
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
            
            {/* 🔥 Selo visual se a O.S. veio da aba Leads */}
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
                {/* 🔥 Aviso de sem placa se o mecânico ainda não adicionou */}
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

            <div className="flex gap-2 pt-2">
              <button onClick={() => window.open(`https://wa.me/55${os.celular || os.telefone}?text=Olá!`, '_blank')} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg text-xs">ZAP</button>
              <button onClick={() => handleEditar(os)} className="w-12 bg-blue-600 text-white py-2 rounded-lg flex justify-center items-center">✏️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}