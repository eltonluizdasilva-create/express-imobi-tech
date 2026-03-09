import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';

export default function Login() {
  const [placa, setPlaca] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const [todasAsOs, setTodasAsOs] = useState(null);
  const [osSelecionada, setOsSelecionada] = useState(null);

  const navigate = useNavigate();

  const handleEntrarCliente = async () => {
    if (!placa || !senha) {
      alert("⚠️ Por favor, preencha a Placa e a Senha!");
      return;
    }
    setCarregando(true);
    try {
      const q = query(collectionGroup(db, "os"), where("placa", "==", placa.toUpperCase()));
      const querySnapshot = await getDocs(q);

      const osEncontradas = [];

      querySnapshot.forEach((doc) => {
        const dados = doc.data();
        const celularLimpo = dados.telefone
          ? String(dados.telefone).replace(/\D/g, '')
          : dados.celular
          ? String(dados.celular).replace(/\D/g, '')
          : '';
        const ultimos4 = celularLimpo.slice(-4);

        if (ultimos4 === senha) {
          osEncontradas.push({ id: doc.id, ...dados });
        }
      });

      if (osEncontradas.length > 0) {
        osEncontradas.sort((a, b) => {
          const dataA = a.data || a.createdAt || '';
          const dataB = b.data || b.createdAt || '';
          return dataB.localeCompare(dataA);
        });
        setTodasAsOs(osEncontradas);
      } else {
        alert("❌ Veículo não encontrado! Verifique se a placa e a senha (4 últimos números do celular) estão corretas.");
      }
    } catch (error) {
      console.error("Erro Firebase:", error.message);
      alert("⚠️ Erro de Índice do Firebase!\n\nAperte F12 e clique no link azul para criar o índice.");
    }
    setCarregando(false);
  };

  const voltarParaLogin = () => {
    setTodasAsOs(null);
    setOsSelecionada(null);
    setPlaca('');
    setSenha('');
  };

  const voltarParaHistorico = () => {
    setOsSelecionada(null);
  };

  const handleCompartilharLaudo = (os) => {
    const texto =
      `*Laudo de Manutenção Digital - OFICINA IA*\n\n` +
      `🚗 *Veículo:* ${os.modelo || 'Não informado'}\n` +
      `🔡 *Placa:* ${os.placa}\n` +
      (os.data ? `📅 *Data:* ${os.data}\n` : '') +
      `\n🛠️ *Serviço Executado:*\n${os.checklist || os.diagnostico || 'Avaliação realizada'}\n\n` +
      (os.detalhesPecas || os.pecasDescricao
        ? `⚙️ *Observações/Peças:*\n${os.detalhesPecas || os.pecasDescricao}\n\n`
        : '') +
      `💰 *Total:* R$ ${!isNaN(Number(os.total)) ? Number(os.total).toFixed(2).replace('.', ',') : '0,00'}\n\n` +
      `✅ _Manutenção registrada e garantida por OFICINA IA._`;

    const urlMensagem = encodeURIComponent(texto);
    window.open(`https://wa.me/?text=${urlMensagem}`, '_blank');
  };

  const getBadgeStatus = (status) => {
    if (!status) return { cor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'PENDENTE' };
    const s = status.toLowerCase();
    if (s.includes('conclu') || s.includes('pago') || s.includes('finaliz'))
      return { cor: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'CONCLUÍDO' };
    if (s.includes('andamento') || s.includes('execu'))
      return { cor: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'EM ANDAMENTO' };
    return { cor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: status.toUpperCase() };
  };

  // ==========================================
  // TELA 3: DETALHE DE UMA O.S. ESPECÍFICA
  // ==========================================
  if (osSelecionada) {
    const os = osSelecionada;
    const totalSeguro = !isNaN(Number(os.total))
      ? Number(os.total).toFixed(2).replace('.', ',')
      : '0,00';
    const badge = getBadgeStatus(os.status);

    return (
      <div className="flex flex-col items-center justify-start min-h-screen bg-[#050505] text-white font-sans p-4 pt-6 pb-24">
        <div className="w-full max-w-sm flex items-center gap-3 mb-5">
          <button onClick={voltarParaHistorico} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
            ← Voltar
          </button>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 text-sm">Detalhes da O.S.</span>
        </div>

        <div className="w-full max-w-sm border border-red-900/30 rounded-3xl p-6 bg-[#0a0a0a] shadow-[0_0_20px_rgba(220,38,38,0.1)]">
          <div className="text-center pb-5 border-b border-dashed border-neutral-800 mb-6">
            <h2 className="text-xl text-blue-400 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
              <span>🩺</span> LAUDO DIGITAL
            </h2>
            <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">Histórico de Manutenção</p>
          </div>

          <div className="space-y-4">
            <div className="bg-black border border-neutral-900 p-4 rounded-xl">
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Veículo</p>
              <p className="text-lg font-medium text-white uppercase">{os.modelo || 'Não informado'}</p>
              <p className="text-red-500 font-bold tracking-widest mt-1">{os.placa}</p>
              {os.data && <p className="text-gray-500 text-xs mt-1">📅 {os.data}</p>}
              {os.km && <p className="text-gray-500 text-xs">🔢 {os.km} km</p>}
            </div>

            <div className="bg-black border border-neutral-900 p-4 rounded-xl flex items-center justify-between">
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Status</p>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${badge.cor}`}>
                {badge.label}
              </span>
            </div>

            <div className="bg-black border border-neutral-900 p-4 rounded-xl">
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-2">Serviços Executados</p>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {os.checklist || os.diagnostico || 'Nenhum serviço registrado.'}
              </p>

              {(os.detalhesPecas || os.pecasDescricao) && (
                <div className="mt-3 pt-3 border-t border-neutral-900">
                  <p className="text-xs text-blue-400 font-bold tracking-widest uppercase mb-1">Peças / Observações</p>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {os.detalhesPecas || os.pecasDescricao}
                  </p>
                </div>
              )}
            </div>

            {os.fotos && os.fotos.length > 0 && (
              <div className="bg-black border border-neutral-900 p-4 rounded-xl">
                <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">📸 Fotos do Serviço</p>
                <div className="grid grid-cols-2 gap-2">
                  {os.fotos.map((foto, i) => (
                    <img key={i} src={foto} alt={`Foto ${i + 1}`} className="rounded-lg w-full object-cover aspect-square border border-neutral-800" />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-black border border-neutral-900 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Investimento Total</p>
              <p className="text-3xl font-bold text-green-500 mt-1">R$ {totalSeguro}</p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button onClick={() => handleCompartilharLaudo(os)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors text-sm tracking-widest flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(22,163,74,0.2)]">
              <span className="text-xl">📲</span> COMPARTILHAR LAUDO
            </button>
            <button onClick={voltarParaHistorico} className="w-full bg-neutral-900 hover:bg-neutral-800 text-gray-300 border border-neutral-800 font-bold py-4 rounded-xl transition-colors text-sm tracking-widest">
              ← Ver Todas as O.S.
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA 2: HISTÓRICO COM TODAS AS O.S.
  // ==========================================
  if (todasAsOs) {
    const primeiraOs = todasAsOs[0];
    const totalGasto = todasAsOs.reduce((acc, os) => acc + (Number(os.total) || 0), 0);

    return (
      <div className="flex flex-col items-center justify-start min-h-screen bg-[#050505] text-white font-sans p-4 pt-6 pb-24">
        <div className="w-full max-w-sm mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-widest uppercase">📋 MEU HISTÓRICO</h2>
              <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">{primeiraOs.modelo || 'Veículo'} • {primeiraOs.placa}</p>
            </div>
            <button onClick={voltarParaLogin} className="text-gray-500 hover:text-white text-xs border border-neutral-800 px-3 py-2 rounded-lg transition-colors">
              Sair
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{todasAsOs.length}</p>
              <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">Serviços</p>
            </div>
            <div className="bg-[#0a0a0a] border border-neutral-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-400">R$ {totalGasto.toFixed(2).replace('.', ',')}</p>
              <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">Total Investido</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-3">
          {todasAsOs.map((os, index) => {
            const badge = getBadgeStatus(os.status);
            const totalOs = !isNaN(Number(os.total)) ? Number(os.total).toFixed(2).replace('.', ',') : '0,00';

            return (
              <div key={os.id} onClick={() => setOsSelecionada(os)} className="bg-[#0a0a0a] border border-neutral-800 hover:border-red-900/50 rounded-2xl p-4 cursor-pointer transition-all active:scale-[0.98] shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {index === 0 && <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded-full font-bold">MAIS RECENTE</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${badge.cor}`}>{badge.label}</span>
                    </div>
                    <p className="text-white font-medium text-sm mt-2 leading-relaxed line-clamp-2">🛠️ {os.checklist || os.diagnostico || 'Serviço registrado'}</p>
                    {os.data && <p className="text-gray-500 text-xs mt-1">📅 {os.data}</p>}
                    {os.km && <p className="text-gray-500 text-xs">🔢 {os.km} km</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-green-400 font-bold text-lg">R$ {totalOs}</p>
                    <p className="text-gray-600 text-xs mt-1">Ver detalhes →</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="w-full max-w-sm mt-6">
          <button onClick={() => handleCompartilharLaudo(todasAsOs[0])} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors text-sm tracking-widest flex justify-center items-center gap-2">
            <span>📲</span> COMPARTILHAR ÚLTIMO LAUDO
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // TELA 1: LOGIN PRINCIPAL (PORTAL CLIENTE)
  // ==========================================
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-[#050505] text-white font-sans relative pb-24">
      
      {/* CABEÇALHO */}
      <header className="w-full p-4 flex justify-between items-center bg-[#050505]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(220,38,38,0.6)] text-white">E</div>
          <h1 className="text-lg font-bold tracking-[0.2em] text-white">OFICINA<span className="text-red-600 drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]">IA</span></h1>
        </div>
        <button onClick={() => navigate('/login-admin')} className="border border-neutral-800 text-gray-400 hover:text-white bg-[#0a0a0a] px-3 py-1.5 rounded-md text-[10px] font-bold tracking-widest transition-colors flex items-center gap-1.5 uppercase">
          Área Restrita <span className="text-yellow-500 text-xs">🔒</span>
        </button>
      </header>

      {/* TÍTULO */}
      <div className="w-full text-center mt-12 mb-8">
        <h1 className="text-5xl font-bold tracking-widest text-white mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">PORTAL</h1>
        <h1 className="text-5xl font-bold tracking-widest text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.7)]">CLIENTE</h1>

        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="h-[1px] w-full max-w-[40px] bg-red-800/50"></div>
          <div className="w-1 h-1 rounded-full bg-neutral-600"></div>
          <p className="text-gray-400 text-[10px] tracking-[0.2em] font-medium uppercase whitespace-nowrap px-2">ACOMPANHE SEU VEÍCULO EM TEMPO REAL</p>
          <div className="w-1 h-1 rounded-full bg-neutral-600"></div>
          <div className="h-[1px] w-full max-w-[40px] bg-red-800/50"></div>
        </div>
      </div>

      <div className="w-full max-w-sm p-4 flex flex-col items-center">
        <div className="w-full border border-red-900/30 rounded-3xl p-6 bg-[#0a0a0a] shadow-[0_0_30px_rgba(220,38,38,0.05)] relative">

          <div className="text-center pb-6 flex flex-col items-center justify-center gap-3">
            <span className="text-blue-400 text-4xl">🩺</span>
            <h2 className="text-2xl text-white font-light tracking-wider leading-tight">
              <span>Acesso ao</span><br /><span>Prontuário</span>
            </h2>
          </div>

          <div className="w-full border-t border-dashed border-neutral-800 mb-8"></div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-red-600 text-[11px] font-bold tracking-widest flex items-center gap-2 uppercase">
                🚗 PLACA DO VEÍCULO
              </label>
              <input
                type="text"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
                maxLength={8}
                className="w-full p-4 bg-[#111] border border-neutral-800 rounded-xl focus:border-red-500 outline-none text-center text-2xl font-bold tracking-widest text-neutral-300 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-red-600 text-[11px] font-bold tracking-widest flex items-center gap-2 uppercase mt-2">
                🔑 SENHA DE ACESSO
              </label>
              <p className="text-neutral-500 text-[10px] mb-2">Digite os últimos 4 dígitos do celular</p>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                maxLength={4}
                className="w-full p-4 bg-[#111] border border-neutral-800 rounded-xl focus:border-red-500 outline-none text-center text-4xl font-bold tracking-[0.3em] text-neutral-300 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleEntrarCliente}
            disabled={carregando}
            className={`w-full ${carregando ? 'bg-red-900/50' : 'bg-red-600 hover:bg-red-700'} text-white font-bold py-4 rounded-xl transition-colors text-sm tracking-widest flex items-center justify-center gap-2 mt-8 shadow-[0_0_15px_rgba(220,38,38,0.3)]`}
          >
            {carregando ? '⏳ BUSCANDO...' : '🔍 ENTRAR'}
          </button>
        </div>

        {/* 🟢 SEÇÃO DE VANTAGENS E INSTALAÇÃO 🟢 */}
        <div className="w-full mt-8 space-y-4">
          
          {/* Card Vantagens */}
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-5">
            <h3 className="text-white font-bold text-[13px] tracking-widest uppercase mb-3 flex items-center gap-2">
              <span className="text-red-500 text-lg">✨</span> Por que usar o portal?
            </h3>
            
            <p className="text-gray-500 text-[11px] mb-4 italic border-b border-neutral-800 pb-3 leading-relaxed">
              "Criado por quem vive o dia a dia de oficina e sabe o quanto é importante ter segurança e total transparência com o seu veículo."
            </p>

            <ul className="text-gray-300 text-[11px] space-y-4 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✅</span> 
                <div>
                  <strong className="text-white">Acesso VIP pelo WhatsApp:</strong>
                  <p className="mt-0.5 text-gray-400">Sem cadastros demorados! O mecânico gera o seu laudo e envia o link direto no seu WhatsApp. A sua senha é sempre os 4 últimos dígitos do seu celular.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✅</span> 
                <div>
                  <strong className="text-white">Segunda Opinião Facilitada:</strong>
                  <p className="mt-0.5 text-gray-400">Recebeu o laudo? Compartilhe o link pelo WhatsApp com aquele amigo que entende mais de mecânica para ele avaliar junto com você.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✅</span> 
                <div>
                  <strong className="text-white">Valoriza seu Carro na Revenda:</strong>
                  <p className="mt-0.5 text-gray-400">Vai trocar de carro? Mostre este histórico ao futuro comprador. Um carro com manutenções provadas vale muito mais.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✅</span> 
                <div>
                  <strong className="text-white">Garantia à Prova de Perdas:</strong>
                  <p className="mt-0.5 text-gray-400">Diga adeus aos papéis no porta-luvas. O serviço executado e as fotos das peças trocadas ficam na palma da sua mão.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Card Como Instalar (PWA) */}
          <div className="bg-[#111] border border-red-900/20 rounded-2xl p-5">
            <h3 className="text-white font-bold text-[12px] tracking-widest uppercase mb-2 flex items-center gap-2">
              <span className="text-blue-400 text-lg">📲</span> Instale nosso App
            </h3>
            <p className="text-gray-500 text-[10px] mb-4">Acesse direto da tela do seu celular, sem precisar baixar na loja e sem ocupar memória!</p>
            
            <div className="text-[11px] text-gray-400 space-y-3 bg-black p-3 rounded-xl border border-neutral-800">
              <div>
                <strong className="text-white flex items-center gap-1 mb-1"><span className="text-green-500">🤖</span> Android (Chrome):</strong>
                <p className="pl-5">Toque nos 3 pontinhos (⋮) no topo da tela e escolha <span className="text-white font-bold">"Adicionar à tela inicial"</span>.</p>
              </div>
              <div className="border-t border-neutral-800 pt-3">
                <strong className="text-white flex items-center gap-1 mb-1"><span className="text-gray-300">🍎</span> iPhone (Safari):</strong>
                <p className="pl-5">Toque no ícone de compartilhar (quadrado com seta) e escolha <span className="text-white font-bold">"Adicionar à Tela de Início"</span>.</p>
              </div>
            </div>
          </div>

        </div>
        {/* 🟢 FIM DA SEÇÃO DE VANTAGENS 🟢 */}

      </div>
    </div>
  );
}