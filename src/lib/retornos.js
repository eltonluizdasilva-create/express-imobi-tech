import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';

const DIA_MS = 24 * 60 * 60 * 1000;

export const MAPA_RETORNOS = {
  MECANICA: 180,
  OLEO: 180,
  ALINHAMENTO: 180,
  HIBRIDOS: 180,
  ELETRICOS: 180,
  MOTOS: 180,
  FUNILARIA: 180,
  AMORTECEDOR: 180,
  INJECAO: 180,
  ELÉTRICA: 180,
  REVISAO: 180,
  AR_CONDICIONADO: 180,
  AR_CONDICIONADO_HIGIENIZACAO: 30,
  PNEUS: 180,
  ESCAPAMENTO: 180,
  LAVA_JATO_LAVAGEM: 30,
  LAVA_JATO_HIGIENIZACAO: 30,
  LAVA_JATO_ESTETICA: 180,
  ESTETICA_POLIMENTO: 180,
  ESTETICA_LAVAGEM: 30,
  ESTETICA_HIGIENIZACAO: 30,
  BATERIA: 540,
};

const CONFIG_RETORNOS = {
  MECANICA: { categoria: 'Mecânica', label: 'Mecânica' },
  OLEO: { categoria: 'Óleo', label: 'Troca de Óleo' },
  ALINHAMENTO: { categoria: 'Alinhamento', label: 'Alinhamento' },
  HIBRIDOS: { categoria: 'Híbridos', label: 'Híbridos' },
  ELETRICOS: { categoria: 'Elétricos', label: 'Elétricos' },
  MOTOS: { categoria: 'Motos', label: 'Motos' },
  FUNILARIA: { categoria: 'Funilaria', label: 'Funilaria' },
  AMORTECEDOR: { categoria: 'Amortecedor', label: 'Amortecedor' },
  INJECAO: { categoria: 'Injeção', label: 'Injeção' },
  ELÉTRICA: { categoria: 'Elétrica', label: 'Elétrica' },
  REVISAO: { categoria: 'Revisão', label: 'Revisão' },
  AR_CONDICIONADO: { categoria: 'Ar-Condicionado', label: 'Ar-Condicionado' },
  AR_CONDICIONADO_HIGIENIZACAO: { categoria: 'Ar-Condicionado', label: 'Higienização do Ar' },
  PNEUS: { categoria: 'Pneus', label: 'Pneus' },
  ESCAPAMENTO: { categoria: 'Escapamento', label: 'Escapamento' },
  LAVA_JATO_LAVAGEM: { categoria: 'Lava Jato', label: 'Lavagem' },
  LAVA_JATO_HIGIENIZACAO: { categoria: 'Lava Jato', label: 'Higienização' },
  LAVA_JATO_ESTETICA: { categoria: 'Lava Jato', label: 'Estética Automotiva' },
  ESTETICA_POLIMENTO: { categoria: 'Estética', label: 'Polimento / Proteção' },
  ESTETICA_LAVAGEM: { categoria: 'Estética', label: 'Lavagem Técnica' },
  ESTETICA_HIGIENIZACAO: { categoria: 'Estética', label: 'Higienização Interna' },
  BATERIA: { categoria: 'Elétrica', label: 'Bateria' },
};

const normalizarSlug = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();

const criarDataBase = (dados) => {
  const base = dados?.data_atualizacao || dados?.data_registro || new Date().toISOString();
  const data = base?.toDate ? base.toDate() : new Date(base);
  return Number.isNaN(data.getTime()) ? new Date() : data;
};

const adicionarGatilho = (gatilhos, chave) => {
  if (!MAPA_RETORNOS[chave] || gatilhos.some((item) => item.servico === chave)) return;
  gatilhos.push({
    servico: chave,
    diasRetorno: MAPA_RETORNOS[chave],
    ...CONFIG_RETORNOS[chave],
  });
};

const temAlgum = (obj, chaves) => chaves.some((chave) => Boolean(obj?.[chave]));

export const resolverGatilhosRetorno = (dados = {}) => {
  const gatilhos = [];
  const tipoServico = String(dados.tipoServico || dados.tipo || '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  switch (tipoServico) {
    case 'mecanica':
      adicionarGatilho(gatilhos, 'MECANICA');
      break;
    case 'oleo':
      adicionarGatilho(gatilhos, 'OLEO');
      break;
    case 'alinhamento':
      adicionarGatilho(gatilhos, 'ALINHAMENTO');
      break;
    case 'hibrido':
      adicionarGatilho(gatilhos, 'HIBRIDOS');
      break;
    case 'eletrico':
      adicionarGatilho(gatilhos, 'ELETRICOS');
      break;
    case 'moto':
      adicionarGatilho(gatilhos, 'MOTOS');
      break;
    case 'funilaria':
      adicionarGatilho(gatilhos, 'FUNILARIA');
      break;
    case 'amortecedor':
      adicionarGatilho(gatilhos, 'AMORTECEDOR');
      break;
    case 'injecao':
      adicionarGatilho(gatilhos, 'INJECAO');
      break;
    case 'revisao':
      adicionarGatilho(gatilhos, 'REVISAO');
      break;
    case 'pneus':
      adicionarGatilho(gatilhos, 'PNEUS');
      break;
    case 'escapamento':
      adicionarGatilho(gatilhos, 'ESCAPAMENTO');
      break;
    case 'eletrica': {
      const temBateria = Boolean(
        dados.subTipo === 'bateria' ||
        dados.dataInstalacaoBateria ||
        dados.marcaBateria ||
        dados.amperagemBateria
      );
      adicionarGatilho(gatilhos, temBateria ? 'BATERIA' : 'ELÉTRICA');
      break;
    }
    case 'ar_condicionado': {
      const servicosAr = dados.servicosAr || {};
      adicionarGatilho(gatilhos, 'AR_CONDICIONADO');
      if (servicosAr.higienizacao) {
        adicionarGatilho(gatilhos, 'AR_CONDICIONADO_HIGIENIZACAO');
      }
      break;
    }
    case 'lavajato': {
      const servicosLavaJato = dados.servicosLavaJato || {};
      if (temAlgum(servicosLavaJato, ['lavagemSimples', 'lavagemCompleta'])) {
        adicionarGatilho(gatilhos, 'LAVA_JATO_LAVAGEM');
      }
      if (temAlgum(servicosLavaJato, ['higienizacaoInterna', 'higienizacaoAC'])) {
        adicionarGatilho(gatilhos, 'LAVA_JATO_HIGIENIZACAO');
      }
      if (temAlgum(servicosLavaJato, ['polimento', 'cristalizacao', 'enceramento', 'descontaminacao', 'peliculaPPF', 'lavagemMotor'])) {
        adicionarGatilho(gatilhos, 'LAVA_JATO_ESTETICA');
      }
      if (gatilhos.length === 0) {
        adicionarGatilho(gatilhos, 'LAVA_JATO_LAVAGEM');
      }
      break;
    }
    case 'estetica': {
      const servicosEstetica = dados.servicosEstetica || {};
      if (temAlgum(servicosEstetica, ['polimentoSimples', 'polimentoCompleto', 'cristalizacao', 'envelopamentoTotal', 'envelopamentoParcial', 'peliculaPPF', 'coatingCeramico', 'vitrificacao', 'restauracaoFarois', 'polimentoTeto'])) {
        adicionarGatilho(gatilhos, 'ESTETICA_POLIMENTO');
      }
      if (servicosEstetica.lavagemTecnica) {
        adicionarGatilho(gatilhos, 'ESTETICA_LAVAGEM');
      }
      if (servicosEstetica.higienizacaoInterna) {
        adicionarGatilho(gatilhos, 'ESTETICA_HIGIENIZACAO');
      }
      if (gatilhos.length === 0) {
        adicionarGatilho(gatilhos, 'ESTETICA_POLIMENTO');
      }
      break;
    }
    default:
      break;
  }

  return gatilhos;
};

export const sincronizarRetornosAutomaticos = async ({ oficinaId, osId, osData, osBase = {} }) => {
  if (!oficinaId || !osId) return [];

  const dadosCompletos = { ...osBase, ...osData };
  const gatilhos = resolverGatilhosRetorno(dadosCompletos);
  const retornosRef = collection(db, 'oficinas', oficinaId, 'retornos');
  const existentesSnap = await getDocs(query(retornosRef, where('osId', '==', osId)));
  const idsDesejados = new Set();
  const dataBase = criarDataBase(dadosCompletos);

  for (const gatilho of gatilhos) {
    const retornoId = `${osId}__${normalizarSlug(gatilho.servico)}`;
    idsDesejados.add(retornoId);

    const dataVencimento = new Date(dataBase.getTime() + gatilho.diasRetorno * DIA_MS);
    await setDoc(doc(db, 'oficinas', oficinaId, 'retornos', retornoId), {
      osId,
      oficinaId,
      nomeCliente: dadosCompletos.nomeCliente || dadosCompletos.cliente || '',
      telefone: dadosCompletos.telefone || dadosCompletos.whatsapp || '',
      placa: dadosCompletos.placa || '',
      modelo: dadosCompletos.modelo || dadosCompletos.veiculo || '',
      tipoServico: dadosCompletos.tipoServico || dadosCompletos.tipo || '',
      servico: gatilho.servico,
      servicoLabel: gatilho.label,
      categoria: gatilho.categoria,
      diasRetorno: gatilho.diasRetorno,
      valorTotal: Number(
        dadosCompletos.total ||
        dadosCompletos.totalOleo ||
        dadosCompletos.totalAlinhamento ||
        dadosCompletos.totalEstetica ||
        dadosCompletos.totalAmortecedor ||
        dadosCompletos.totalInjecao ||
        dadosCompletos.totalEletrico ||
        dadosCompletos.totalEscapamento ||
        dadosCompletos.totalLavaJato ||
        dadosCompletos.totalAr ||
        0
      ),
      statusRetorno: dadosCompletos.statusRetorno || 'pendente',
      dataAgendamento: dadosCompletos.dataAgendamento || null,
      dataBase: dataBase.toISOString(),
      dataVencimento: dataVencimento.toISOString(),
      origem: 'automatico',
      dataAtualizacao: new Date().toISOString(),
    }, { merge: true });
  }

  for (const retornoDoc of existentesSnap.docs) {
    if (!idsDesejados.has(retornoDoc.id)) {
      await deleteDoc(retornoDoc.ref);
    }
  }

  return gatilhos;
};
