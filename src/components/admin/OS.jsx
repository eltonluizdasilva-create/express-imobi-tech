/* eslint-disable react/prop-types */
import React, { useEffect, useState, useMemo } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { sincronizarRetornosAutomaticos } from '../../lib/retornos';
import { formatarTelefone, normalizarPlaca, TAB_COLORS } from './constants';
import { getLimiteOS, contarOSdoMes, LIMITES_PLANOS } from '../../lib/validacoes-planos';

const SETORES = [
  { key: 'mecanica', label: 'Mecânica', icon: '🔧' },
  { key: 'hibrido', label: 'Híbridos', icon: '🔋' },
  { key: 'eletrico', label: 'Elétricos', icon: '🔌' },
  { key: 'moto', label: 'Motos', icon: '🏍️' },
  { key: 'funilaria', label: 'Funilaria', icon: '🚗' },
  { key: 'amortecedor', label: 'Amortecedor', icon: '🧰' },
  { key: 'injecao', label: 'Injeção', icon: '🛠️' },
  { key: 'eletrica', label: 'Elétrica', icon: '⚡' },
  { key: 'alinhamento', label: 'Alinhamento', icon: '⚙️' },
  { key: 'oleo', label: 'Óleo', icon: '🛢️' },
  { key: 'ar_condicionado', label: 'Ar-Cond.', icon: '❄️' },
  { key: 'pneus', label: 'Pneus', icon: '⭕' },
  // desmanche removido — agora é aba de Gestão, não O.S.
  { key: 'escapamento', label: 'Escapamento', icon: '💨' },
  { key: 'lavajato', label: 'Lava Jato', icon: '🚿' },
  { key: 'estetica', label: 'Estética', icon: '✨' },
];

/**
 * OSModulo.jsx (Recepção de Veículo)
 * 
 * CORREÇÃO: Agora recebe as props corretas do GerenciadorDeModulos:
 * - nomeCliente, setNomeCliente, placa, setPlaca, telefone, setTelefone, modelo, setModelo
 * - modulosOperacionais (para filtrar setores visíveis)
 * - handleOSCriada (callback que redireciona após criar a OS)
 * 
 * O fluxo agora é:
 * 1. Usuário preenche cliente, placa, telefone, modelo
 * 2. Seleciona um setor (Mecânica, Estética, etc.)
 * 3. Clica em "GERAR O.S."
 * 4. OS é criada no Firebase
 * 5. handleOSCriada é chamado com a nova OS e setor escolhido
 * 6. AdminNovo redireciona para o módulo do setor (TelaMaestro)
 */
export default function OSModulo({
  // Props obrigatórias
  oficinaId,
  handleOSCriada,

  // Props do formulário (vêm do AdminNovo através do GerenciadorDeModulos)
  nomeCliente = '',
  setNomeCliente = () => { },
  placa = '',
  setPlaca = () => { },
  telefone = '',
  setTelefone = () => { },
  modelo = '',
  setModelo = () => { },

  // Props opcionais
  senhaPortal = '',
  setSenhaPortal = () => { },
  ouvirCampo = null,
  campoOuvindo = null,
  buscarDadosPorPlaca = null,
  modulosOperacionais = [],
  dadosOficina = {},
  isTrial = false,
  listaCarros = [],
  setAbaAtiva = null,
  t = { text: '#fff', textSoft: '#888', stroke: '#333', card: '#111', bg: '#000' },
  tema = 'escuro',
}) {
  const [dados, setDados] = useState({
    nomeCliente: nomeCliente || '',
    placa: placa || '',
    veiculo: modelo || '',
    ano: '',
    motor: '',
    telefone: telefone || '',
    tipoVeiculo: 'carro',
  });

  const [salvando, setSalvando] = useState(false);
  const [buscaPlaca, setBuscaPlaca] = useState('');
  const [setorAtivo, setSetorAtivo] = useState('mecanica');

  // ────────────────────────────────────────────────────────────────────────────
  // SINCRONIZAÇÃO: dados locais ↔ props do AdminNovo
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    setDados(prev => ({
      ...prev,
      nomeCliente: nomeCliente || prev.nomeCliente,
      placa: placa || prev.placa,
      telefone: telefone || prev.telefone,
      veiculo: modelo || prev.veiculo,
    }));
  }, [nomeCliente, placa, telefone, modelo]);

  // ────────────────────────────────────────────────────────────────────────────
  // FILTRAGEM DE SETORES: apenas os módulos operacionais contratados
  // ────────────────────────────────────────────────────────────────────────────
  const setoresVisiveis = useMemo(() => {
    if (isTrial) return SETORES;
    if (!dadosOficina) return SETORES;

    const ehMaster = dadosOficina?.papel === 'master' || dadosOficina?.plano === 'master';
    if (ehMaster || dadosOficina?.modulosPermitidos === 'ALL') return SETORES;

    const modulos = (modulosOperacionais || []) || (dadosOficina?.modulosOperacionais || []);
    const modulosNormalizados = new Set(
      (modulos || []).filter(Boolean).map((m) => String(m).trim().toLowerCase())
    );

    if (modulosNormalizados.size === 0) return SETORES.filter(s => s.key === 'mecanica');

    const MAPA = {
      mecanica: ['mecanica', 'MECÂNICA', 'MECANICA'],
      hibrido: ['hibrido', 'HÍBRIDOS', 'HIBRIDOS'],
      eletrico: ['eletrico', '100% ELÉTRICOS', '100% ELETRICOS'],
      moto: ['moto', 'motos', 'MOTOS'],
      funilaria: ['funilaria', 'FUNILARIA'],
      amortecedor: ['amortecedor', 'AMORTECEDOR'],
      injecao: ['injecao', 'INJEÇÃO', 'INJECAO'],
      eletrica: ['eletrica', 'ELÉTRICA', 'ELÉTRICA'],
      alinhamento: ['alinhamento', 'ALINHAMENTO'],
      oleo: ['oleo', 'ÓLEO', 'OLEO'],
      ar_condicionado: ['ar_condicionado', 'AR-CONDICIONADO'],
      pneus: ['pneus', 'PNEUS'],
      desmanche: ['desmanche', 'DESMANCHE'],
      escapamento: ['escapamento', 'ESCAPAMENTO'],
      lavajato: ['lavajato', 'LAVA JATO'],
      estetica: ['estetica', 'ESTÉTICA', 'ESTETICA'],
    };

    return SETORES.filter((setor) => {
      const nomesModulo = MAPA[setor.key] || [setor.key];
      return nomesModulo.some((nome) => modulosNormalizados.has(nome.toLowerCase()));
    });
  }, [dadosOficina, isTrial, modulosOperacionais]);

  // Garante que o setor ativo seja válido
  useEffect(() => {
    if (setoresVisiveis && setoresVisiveis.length > 0 && setorAtivo) {
      const ativoValido = setoresVisiveis.some(s => s.key === setorAtivo);
      if (!ativoValido) {
        setSetorAtivo(setoresVisiveis[0].key);
      }
    }
  }, [setoresVisiveis, setorAtivo]);

  // ────────────────────────────────────────────────────────────────────────────
  // BUSCA POR PLACA: quando o usuário digita uma placa, busca dados cadastrados
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (buscaPlaca.length >= 7 && buscarDadosPorPlaca) {
      buscarDadosPorPlaca(buscaPlaca, {
        setNome: (v) => setDados((d) => ({ ...d, nomeCliente: v })),
        setTelefone: (v) => setDados((d) => ({ ...d, telefone: v })),
        setModelo: (v) => {
          setDados((d) => ({ ...d, veiculo: v }));
        }
      });
      setDados((d) => ({ ...d, placa: normalizarPlaca(buscaPlaca) }));
    }
  }, [buscaPlaca, buscarDadosPorPlaca]);

  // ────────────────────────────────────────────────────────────────────────────
  // HANDLER: mudanças nos inputs
  // ────────────────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    let novoValor = value;

    if (name === 'placa') novoValor = normalizarPlaca(value);
    if (name === 'telefone') novoValor = formatarTelefone(value);

    // 1. Salva na tela local
    setDados((prev) => ({ ...prev, [name]: novoValor }));

    // 2. Sincroniza com os states do AdminNovo (via props)
    if (name === 'nomeCliente' && setNomeCliente) setNomeCliente(novoValor);
    if (name === 'placa' && setPlaca) setPlaca(novoValor);
    if (name === 'telefone' && setTelefone) setTelefone(novoValor);
    if (name === 'veiculo' && setModelo) setModelo(novoValor);

    if (name === 'placa') {
      setBuscaPlaca(novoValor);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // GERAÇÃO DA SENHA: baseada nos últimos 4 dígitos da placa
  // ────────────────────────────────────────────────────────────────────────────
  const gerarSenhaPlaca = (placa) => {
    const limpa = (placa || '').replace(/[^A-Z0-9]/g, '');
    return limpa.slice(-4).toUpperCase() || '0000';
  };

  // ────────────────────────────────────────────────────────────────────────────
  // SUBMIT: criar a O.S. no Firebase e redirecionar
  // ────────────────────────────────────────────────────────────────────────────
  const handleGerarOS = async (e) => {
    e.preventDefault();

    if (!dados.placa || !dados.veiculo) {
      alert('Preencha Placa e Veículo!');
      return;
    }

    if (!oficinaId) {
      alert('Erro: ID da oficina não encontrado. Faça login novamente.');
      return;
    }

    // ── Verificação de limite do plano GRATUITO ──────────────────────────
    const planoAtual = dadosOficina?.plano || 'GRATUITO';
    const isGratuito = planoAtual === 'GRATUITO' || planoAtual === 'gratis';
    if (isGratuito) {
      const limiteOS = getLimiteOS(planoAtual);
      const osMes = contarOSdoMes(listaCarros);
      const alertaEm = LIMITES_PLANOS.GRATUITO.alerta_em; // 2

      if (osMes >= limiteOS) {
        alert(
          `⛔ Limite do plano GRATUITO atingido!\n\n` +
          `Você já gerou ${osMes} O.S. este mês (limite: ${limiteOS}).\n\n` +
          `Faça o upgrade para um plano Pro e continue cadastrando seus serviços sem parar. 🚀`
        );
        if (setAbaAtiva) setAbaAtiva('meuplano');
        return;
      }

      if (osMes === alertaEm) {
        const confirmar = window.confirm(
          `⚠️ Atenção: Esta é sua ${osMes + 1}ª O.S. no plano GRATUITO.\n\n` +
          `Seu limite é de ${limiteOS} O.S. por mês. Deseja continuar?\n\n` +
          `👉 Para remover o limite, acesse MEU PLANO e faça o upgrade.`
        );
        if (!confirmar) return;
      }
    }
    // ────────────────────────────────────────────────────────────────────

    const setorValido = setorAtivo || 'mecanica';

    setSalvando(true);
    try {
      console.log('[OSModulo] ==========================================');
      console.log('[OSModulo] Iniciando geração - setor:', setorValido);
      console.log('[OSModulo] OficinaID:', oficinaId);
      console.log('[OSModulo] Dados:', dados);
      console.log('[OSModulo] ==========================================');

      const modeloCompleto = `${dados.veiculo} ${dados.ano} ${dados.motor}`.trim();

      // Payload da OS que será salva no Firebase
      const payload = {
        ...dados,
        modelo: modeloCompleto,
        veiculo: modeloCompleto,
        nomeCliente: dados.nomeCliente,
        cliente: dados.nomeCliente,
        oficinaId,
        data_registro: new Date().toISOString(),
        data: new Date().toISOString(),
        statusPagamento: 'pendente',
        tipo: setorValido,
        tipoServico: setorValido,
        total: 0,
        senhaConsulta: gerarSenhaPlaca(dados.placa),
        senha_web: gerarSenhaPlaca(dados.placa),
      };

      // Salva no Firebase
      const docRef = await addDoc(collection(db, 'oficinas', oficinaId, 'os'), payload);

      // Sincroniza com automações (lembretes, retornos, etc.)
      await sincronizarRetornosAutomaticos({
        oficinaId,
        osId: docRef.id,
        osData: payload,
        osBase: {},
      });

      // Cria objeto da nova OS com o ID do Firebase
      const novaOS = { id: docRef.id, ...payload };

      console.log('[OSModulo] OS criada com sucesso:', novaOS.id);

      alert(`✅ O.S. gerada e enviada para ${setorValido.toUpperCase()}!`);

      // Limpa o formulário
      setDados({
        nomeCliente: '',
        placa: '',
        veiculo: '',
        ano: '',
        motor: '',
        telefone: '',
        tipoVeiculo: 'carro',
      });
      setBuscaPlaca('');
      setSetorAtivo('mecanica');

      // CRUCIAL: Chama o callback para redirecionar
      if (handleOSCriada) {
        console.log('[OSModulo] Chamando handleOSCriada com setor:', setorValido);
        handleOSCriada(setorValido, novaOS);
      }

    } catch (erro) {
      console.error('[OSModulo] Erro completo:', erro);
      alert('❌ Erro ao gerar O.S.: ' + erro.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div id="tela-recepcao" className="p-6 max-w-4xl mx-auto" style={{ color: t.text }}>
      
      {/* 🌟 Cabeçalho Moderno */}
      <div className="flex items-center gap-4 mb-8 border-b pb-5" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,0,51,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,0,51,0.2)'
        }}>
          <span style={{ fontSize: '26px' }}>📝</span>
        </div>
        <div>
          <h2 className="text-xl font-black tracking-wider uppercase m-0" style={{ color: '#fff' }}>
            Recepção de Veículo
          </h2>
          <p className="text-[12px] font-bold tracking-widest uppercase m-0" style={{ color: '#6b7280' }}>
            Cadastre e gere uma nova ordem de serviço instantaneamente
          </p>
        </div>
      </div>

      <form onSubmit={handleGerarOS} className="space-y-8">
        
        {/* 🌟 Seção: Dados do Cliente e Veículo */}
        <div className="p-6 rounded-2xl space-y-5" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.03)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
          <p className="text-[11px] text-red-500 font-black uppercase block tracking-wider m-0 mb-2">📌 Informações Gerais</p>
          
          <div>
            <label className="text-[10px] text-gray-400 font-black uppercase block mb-1 tracking-widest">Nome do Cliente *</label>
            <input
              type="text"
              name="nomeCliente"
              value={dados.nomeCliente}
              onChange={handleChange}
              className="w-full border p-3.5 rounded-xl outline-none transition-all"
              style={{ background: '#181818', borderColor: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px' }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ff0033';
                e.target.style.boxShadow = '0 0 15px rgba(255,0,51,0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.06)';
                e.target.style.boxShadow = 'none';
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-400 font-black uppercase block mb-1 tracking-widest">Placa *</label>
              <input
                type="text"
                name="placa"
                value={dados.placa}
                onChange={handleChange}
                placeholder="ABC1D23"
                className="w-full border p-3.5 rounded-xl outline-none transition-all font-bold text-center tracking-[0.2em] text-lg uppercase"
                style={{ background: '#181818', borderColor: 'rgba(255,255,255,0.06)', color: '#ff0033' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ff0033';
                  e.target.style.boxShadow = '0 0 15px rgba(255,0,51,0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-black uppercase block mb-1 tracking-widest">WhatsApp *</label>
              <input
                type="text"
                name="telefone"
                value={dados.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                className="w-full border p-3.5 rounded-xl outline-none transition-all"
                style={{ background: '#181818', borderColor: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ff0033';
                  e.target.style.boxShadow = '0 0 15px rgba(255,0,51,0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 font-black uppercase block mb-1 tracking-widest">Veículo *</label>
              <input
                type="text"
                name="veiculo"
                value={dados.veiculo}
                onChange={handleChange}
                placeholder="Ex: Honda Civic"
                className="w-full border p-3.5 rounded-xl outline-none transition-all font-bold"
                style={{ background: '#181818', borderColor: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ff0033';
                  e.target.style.boxShadow = '0 0 15px rgba(255,0,51,0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.target.style.boxShadow = 'none';
                }}
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-black uppercase block mb-1 tracking-widest">Ano</label>
              <input
                type="text"
                name="ano"
                value={dados.ano}
                onChange={handleChange}
                placeholder="Ex: 2022"
                className="w-full border p-3.5 rounded-xl outline-none transition-all text-center"
                style={{ background: '#181818', borderColor: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ff0033';
                  e.target.style.boxShadow = '0 0 15px rgba(255,0,51,0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-black uppercase block mb-1 tracking-widest">Motor</label>
              <input
                type="text"
                name="motor"
                value={dados.motor}
                onChange={handleChange}
                placeholder="Ex: 2.0 Turbo"
                className="w-full border p-3.5 rounded-xl outline-none transition-all text-center"
                style={{ background: '#181818', borderColor: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '13px' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ff0033';
                  e.target.style.boxShadow = '0 0 15px rgba(255,0,51,0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        </div>

        {/* 🌟 Seção: Escolher Setor */}
        <div id="passo-selecionar-ramo" className="space-y-4">
          <style>{`
            @keyframes activePulse {
              0%, 100% { border-color: var(--cor-ativa); box-shadow: 0 0 15px var(--cor-sombra), inset 0 0 8px var(--cor-sombra); }
              50% { border-color: #fff; box-shadow: 0 0 32px var(--cor-ativa), inset 0 0 15px var(--cor-sombra); }
            }
            .ativo-pulsante {
              animation: activePulse 2s infinite ease-in-out !important;
            }
          `}</style>
          <p className="text-[11px] text-red-500 font-black uppercase block tracking-wider m-0 mb-1">🛠️ Escolha o Setor Responsável</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {setoresVisiveis.map((setor) => {
              const cor = TAB_COLORS[setor.key] || '#ff0033';
              const ativo = setorAtivo === setor.key;
              return (
                <button
                  key={setor.key}
                  type="button"
                  onClick={() => setSetorAtivo(setor.key)}
                  className={`nav-button-premium ${ativo ? 'ativo-pulsante' : ''}`}
                  style={{
                    '--cor-ativa': cor,
                    '--cor-sombra': `${cor}44`,
                    padding: '16px 12px',
                    borderRadius: '16px',
                    background: ativo ? `${cor}15` : t.card,
                    border: `2px solid ${ativo ? cor : 'rgba(255,255,255,0.05)'}`,
                    color: ativo ? '#fff' : '#888',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    backdropFilter: 'blur(8px)',
                    transform: ativo ? 'scale(1.04)' : 'scale(1)',
                  }}
                  onMouseEnter={(e) => {
                    if (!ativo) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!ativo) {
                      e.currentTarget.style.background = t.card;
                      e.currentTarget.style.color = '#888';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <span style={{ 
                    fontSize: '32px', 
                    filter: ativo ? `drop-shadow(0 0 10px ${cor})` : 'none',
                    transition: 'transform 0.2s ease-in-out'
                  }}>
                    {setor.icon}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    color: ativo ? '#fff' : '#6b7280'
                  }}>
                    {setor.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 🌟 Botão: Gerar O.S. (Glow e Premium) */}
        <button
          type="submit"
          disabled={salvando}
          style={{
            width: '100%', padding: '18px', borderRadius: '16px',
            background: 'linear-gradient(90deg, #ff0033, #e6002d)', color: '#fff', border: 'none',
            fontWeight: '900', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1.5px',
            cursor: salvando ? 'not-allowed' : 'pointer', boxShadow: '0 5px 25px rgba(255,0,51,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {salvando ? '⏳ GERANDO O.S. ...' : '💾 GERAR O.S.'}
        </button>
      </form>

      {/* 🌟 Seção: Busca Rápida por Placa */}
      <div className="mt-12 p-6 rounded-2xl shadow-inner" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.03)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🔍</span>
          <h3 className="text-sm font-black text-gray-300 m-0 tracking-widest uppercase">Consulta Rápida de Placas</h3>
        </div>
        <input
          type="text"
          placeholder="Digite a placa para preencher automaticamente..."
          value={buscaPlaca}
          onChange={(e) => setBuscaPlaca(e.target.value)}
          className="w-full border p-4 rounded-xl uppercase outline-none focus:border-red-500 text-2xl font-black tracking-[0.2em] transition-all mb-4"
          style={{ background: '#181818', borderColor: 'rgba(255,255,255,0.06)', color: '#ff0033' }}
          onFocus={(e) => {
            e.target.style.borderColor = '#ff0033';
            e.target.style.boxShadow = '0 0 15px rgba(255,0,51,0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255,255,255,0.06)';
            e.target.style.boxShadow = 'none';
          }}
        />
        <div style={{ background: '#1a0505', padding: '14px', borderRadius: '12px', border: '1px solid #ff003322' }}>
          <p className="text-[11px] text-gray-400 m-0 leading-relaxed">
            <strong className="text-red-500">Dica:</strong> A Ordem de Serviço (O.S.) é o documento oficial do serviço e das peças. Preencha todos os campos do cliente para manter o histórico de manutenção perfeitamente organizado.
          </p>
        </div>
      </div>
    </div>
  );
}
