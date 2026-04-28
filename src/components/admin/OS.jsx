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
  { key: 'revisao', label: 'Revisão', icon: '🛡️' },
  { key: 'ar_condicionado', label: 'Ar-Cond.', icon: '❄️' },
  { key: 'pneus', label: 'Pneus', icon: '🛞' },
  // desmanche removido — agora é aba de Gestão, não O.S.
  { key: 'escapamento', label: 'Escapamento', icon: '🪛' },
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
      revisao: ['revisao', 'REVISÃO', 'REVISAO'],
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
    <div id="tela-recepcao" className="p-4 max-w-3xl mx-auto" style={{ color: t.text }}>
      <h2 className="text-xl font-bold text-red-500 mb-6 border-b pb-4" style={{ borderColor: t.stroke }}>📋 Recepção de Veículo</h2>

      <form onSubmit={handleGerarOS} className="space-y-6">
        {/* Seção: Dados do Cliente */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Cliente *</label>
            <input
              type="text"
              name="nomeCliente"
              value={dados.nomeCliente}
              onChange={handleChange}
              className="w-full border p-3 rounded-lg outline-none"
              style={{ background: t.card, borderColor: t.stroke, color: t.text }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Placa *</label>
              <input
                type="text"
                name="placa"
                value={dados.placa}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg font-bold text-center tracking-widest text-lg"
                style={{ background: t.card, borderColor: t.stroke, color: t.text }}
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">WhatsApp *</label>
              <input
                type="text"
                name="telefone"
                value={dados.telefone}
                onChange={handleChange}
                className="w-full border p-3 rounded-lg"
                style={{ background: t.card, borderColor: t.stroke, color: t.text }}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Veículo *</label>
              <input
                type="text"
                name="veiculo"
                value={dados.veiculo}
                onChange={handleChange}
                placeholder="Ex: Gol"
                className="w-full border p-3 rounded-lg text-xs"
                style={{ background: t.card, borderColor: t.stroke, color: t.text }}
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Ano</label>
              <input
                type="text"
                name="ano"
                value={dados.ano}
                onChange={handleChange}
                placeholder="2020"
                className="w-full border p-3 rounded-lg text-xs"
                style={{ background: t.card, borderColor: t.stroke, color: t.text }}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Motor</label>
              <input
                type="text"
                name="motor"
                value={dados.motor}
                onChange={handleChange}
                placeholder="1.6"
                className="w-full border p-3 rounded-lg text-xs"
                style={{ background: t.card, borderColor: t.stroke, color: t.text }}
              />
            </div>
          </div>
        </div>

        {/* Seção: Escolher Setor */}
        <div id="passo-selecionar-ramo" className="space-y-4">
          <label className="text-[10px] text-gray-500 font-bold uppercase block">Área do Serviço *</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {setoresVisiveis.map((setor) => {
              const cor = TAB_COLORS[setor.key] || '#ff0033';
              const ativo = setorAtivo === setor.key;
              return (
                <button
                  key={setor.key}
                  type="button"
                  onClick={() => setSetorAtivo(setor.key)}
                  className="nav-button-premium"
                  style={{
                    padding: '8px 4px',
                    borderRadius: '10px',
                    background: ativo ? `${cor}33` : t.card,
                    border: `1px solid ${ativo ? cor : t.stroke}`,
                    boxShadow: ativo ? `0 0 15px ${cor}44` : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    color: ativo ? t.text : t.textSoft,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{setor.icon}</span>
                  <span style={{
                    fontSize: '8px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%'
                  }}>
                    {setor.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botão: Gerar O.S. */}
        <button
          type="submit"
          disabled={salvando}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900 text-white font-bold py-4 rounded-lg mt-4 shadow-xl transition-all"
        >
          {salvando ? '⏳ GERANDO...' : '💾 GERAR O.S.'}
        </button>
      </form>

      {/* Seção: Busca Rápida por Placa */}
      <div className="mt-12 p-5 rounded-2xl shadow-inner" style={{ background: t.cardSoft, border: `1px solid ${t.stroke}` }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🔍</span>
          <h3 className="text-sm font-bold text-gray-400 m-0 tracking-widest uppercase">Busca Rápida (Placa)</h3>
        </div>
        <input
          type="text"
          placeholder="Digite a placa para preencher automaticamente..."
          value={buscaPlaca}
          onChange={(e) => setBuscaPlaca(e.target.value)}
          className="w-full border p-4 rounded-xl uppercase outline-none focus:border-red-500 text-2xl font-black tracking-[0.2em] transition-all mb-4"
          style={{ background: t.card, borderColor: t.stroke, color: t.text }}
        />
        <div style={{ background: '#1a0505', padding: '12px', borderRadius: '10px', border: '1px solid #ff003322' }}>
          <p className="text-[11px] text-gray-400 m-0 leading-relaxed">
            <strong className="text-red-500">O.S. (Ordem de Serviço):</strong> É o documento que registra tudo o que será feito no veículo, as peças cobradas e garante o histórico técnico do seu cliente.
          </p>
        </div>
      </div>
    </div>
  );
}
