import { collection, addDoc, doc, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { negociacoesDemoCartorio } from './cartorioEscritura.js';

/**
 * Esteira de Cartório & Escritura (Repasses & NF) em modo demonstração:
 * 1 venda travada por CND prestes a vencer, 1 aguardando a conclusão do
 * registro e 1 já liberada para repasse/NF. Fonte única: `cartorioEscritura.js`
 * (cálculo determinístico, sem IA).
 */
export function obterCenarioCartorioDemo(agora = Date.now()) {
  return negociacoesDemoCartorio(agora);
}

export function obterDadosCenarioDemoMemoria() {
  const agora = Date.now();
  const diaMs = 24 * 60 * 60 * 1000;
  const horaMs = 60 * 60 * 1000;

  // 5 Imóveis (2 parados há mais de 40 dias)
  const imoveisDemo = [
    {
      titulo: 'Apartamento 3 Qts Vista Mar',
      tipo: 'Apartamento',
      finalidade: 'Venda',
      padraoImovel: 'Alto Padrão',
      status: 'Ativo',
      valor: 850000,
      codigo: 'IMB-101',
      bairro: 'Meireles',
      quartos: '3',
      corretorResponsavel: 'Carlos Mendes',
      criadoEm: Timestamp.fromMillis(agora - 48 * diaMs),
      atualizadoEm: Timestamp.fromMillis(agora - 48 * diaMs),
      diasParado: 48,
    },
    {
      titulo: 'Casa em Condomínio Fechado',
      tipo: 'Casa',
      finalidade: 'Venda',
      padraoImovel: 'Alto Padrão',
      status: 'Ativo',
      valor: 1250000,
      codigo: 'IMB-102',
      bairro: 'Eusébio',
      quartos: '4',
      corretorResponsavel: 'Mariana Souza',
      criadoEm: Timestamp.fromMillis(agora - 42 * diaMs),
      atualizadoEm: Timestamp.fromMillis(agora - 42 * diaMs),
      diasParado: 42,
    },
    {
      titulo: 'Cobertura Duplex Jardins',
      tipo: 'Cobertura',
      finalidade: 'Venda',
      padraoImovel: 'Luxo',
      status: 'Ativo',
      valor: 2400000,
      codigo: 'IMB-103',
      bairro: 'Aldeota',
      quartos: '4',
      corretorResponsavel: 'Carlos Mendes',
      criadoEm: Timestamp.fromMillis(agora - 12 * diaMs),
      atualizadoEm: Timestamp.fromMillis(agora - 12 * diaMs),
      diasParado: 12,
    },
    {
      titulo: 'Sala Comercial Prime Plaza',
      tipo: 'Comercial',
      finalidade: 'Venda',
      padraoImovel: 'Comercial',
      status: 'Ativo',
      valor: 380000,
      codigo: 'IMB-104',
      bairro: 'Centro Empresarial',
      quartos: '1',
      corretorResponsavel: 'Roberto Lima',
      criadoEm: Timestamp.fromMillis(agora - 8 * diaMs),
      atualizadoEm: Timestamp.fromMillis(agora - 8 * diaMs),
      diasParado: 8,
    },
    {
      titulo: 'Studio Mobiliado Beira Mar',
      tipo: 'Studio',
      finalidade: 'Venda',
      padraoImovel: 'Médio Padrão',
      status: 'Ativo',
      valor: 420000,
      codigo: 'IMB-105',
      bairro: 'Praia de Iracema',
      quartos: '1',
      corretorResponsavel: 'Mariana Souza',
      criadoEm: Timestamp.fromMillis(agora - 3 * diaMs),
      atualizadoEm: Timestamp.fromMillis(agora - 3 * diaMs),
      diasParado: 3,
    },
  ];

  // 6 Leads (2 sem resposta há mais de 24h)
  const leadsDemo = [
    {
      nome: 'Eduardo Fonseca',
      telefone: '(11) 98765-4321',
      interesse: 'Apartamento 3 Qts Vista Mar',
      bairro: 'Meireles',
      orcamento: 850000,
      estagio: 'Novo Lead',
      origem: 'WhatsApp Pólen 24h',
      corretorResponsavel: 'Carlos Mendes',
      criadoEm: Timestamp.fromMillis(agora - 36 * horaMs),
      ultimoContatoEm: Timestamp.fromMillis(agora - 36 * horaMs),
      horasSemResposta: 36,
      horasSemContato: 36,
      semResposta: true,
    },
    {
      nome: 'Camila Rodrigues',
      telefone: '(21) 99876-5432',
      interesse: 'Casa em Condomínio Fechado',
      bairro: 'Eusébio',
      orcamento: 1200000,
      estagio: 'Visita Solicitada',
      origem: 'Portal Imobiliário',
      corretorResponsavel: 'Mariana Souza',
      criadoEm: Timestamp.fromMillis(agora - 28 * horaMs),
      ultimoContatoEm: Timestamp.fromMillis(agora - 28 * horaMs),
      horasSemResposta: 28,
      horasSemContato: 28,
      semResposta: true,
    },
    {
      nome: 'Bruno Albuquerque',
      telefone: '(11) 97654-3210',
      interesse: 'Cobertura Duplex Jardins',
      bairro: 'Aldeota',
      orcamento: 2500000,
      estagio: 'Proposta',
      origem: 'Indicação',
      corretorResponsavel: 'Carlos Mendes',
      criadoEm: Timestamp.fromMillis(agora - 2 * horaMs),
      ultimoContatoEm: Timestamp.fromMillis(agora - 2 * horaMs),
      horasSemResposta: 2,
      horasSemContato: 2,
      semResposta: false,
    },
    {
      nome: 'Fernanda Costa',
      telefone: '(85) 98123-4567',
      interesse: 'Studio Mobiliado Beira Mar',
      bairro: 'Praia de Iracema',
      orcamento: 400000,
      estagio: 'Qualificação',
      origem: 'Meta Ads',
      corretorResponsavel: 'Mariana Souza',
      criadoEm: Timestamp.fromMillis(agora - 4 * horaMs),
      ultimoContatoEm: Timestamp.fromMillis(agora - 4 * horaMs),
      horasSemResposta: 4,
      horasSemContato: 4,
      semResposta: false,
    },
    {
      nome: 'Rodrigo Meireles',
      telefone: '(31) 99112-3344',
      interesse: 'Sala Comercial Prime Plaza',
      bairro: 'Centro Empresarial',
      orcamento: 380000,
      estagio: 'Visita Agendada',
      origem: 'Google Maps',
      corretorResponsavel: 'Roberto Lima',
      criadoEm: Timestamp.fromMillis(agora - 1 * horaMs),
      ultimoContatoEm: Timestamp.fromMillis(agora - 1 * horaMs),
      horasSemResposta: 1,
      horasSemContato: 1,
      semResposta: false,
    },
    {
      nome: 'Juliana Peixoto',
      telefone: '(41) 98877-6655',
      interesse: 'Apartamento 3 Qts Vista Mar',
      bairro: 'Meireles',
      orcamento: 800000,
      estagio: 'Em Negociação',
      origem: 'WhatsApp Pólen 24h',
      corretorResponsavel: 'Carlos Mendes',
      criadoEm: Timestamp.fromMillis(agora - 5 * horaMs),
      ultimoContatoEm: Timestamp.fromMillis(agora - 5 * horaMs),
      horasSemResposta: 5,
      horasSemContato: 5,
      semResposta: false,
    },
  ];

  return { imoveisDemo, leadsDemo };
}

export async function carregarCenarioDemo(tenantId, db, { force = false } = {}) {
  // 1. Verificar se a conta já possui dados (se não for forçado)
  if (db && tenantId && !force) {
    try {
      const snapImoveis = await getDocs(collection(db, 'oficinas', tenantId, 'imoveis_imobi'));
      const snapLeads = await getDocs(collection(db, 'oficinas', tenantId, 'leads_imobi'));
      if (!snapImoveis.empty || !snapLeads.empty) {
        return {
          sucesso: false,
          motivo: 'A conta já possui imóveis ou leads cadastrados. O cenário demo é destinado a contas vazias (Cold Start).',
          jaPopulada: true,
        };
      }
    } catch (err) {
      console.warn('Verificação de cold start no Firestore:', err.message);
    }
  }

  const { imoveisDemo, leadsDemo } = obterDadosCenarioDemoMemoria();
  const cartorioDemo = obterCenarioCartorioDemo();

  // Inserir no Firestore
  const imoveisInseridos = [];
  const leadsInseridos = [];
  const cartorioInseridos = [];

  if (db && tenantId) {
    for (const imovel of imoveisDemo) {
      try {
        const ref = await addDoc(collection(db, 'oficinas', tenantId, 'imoveis_imobi'), imovel);
        imoveisInseridos.push({ id: ref.id, ...imovel });
      } catch (err) {
        console.warn('Erro ao inserir imóvel demo:', err.message);
      }
    }

    for (const lead of leadsDemo) {
      try {
        const ref = await addDoc(collection(db, 'oficinas', tenantId, 'leads_imobi'), lead);
        leadsInseridos.push({ id: ref.id, ...lead });
      } catch (err) {
        console.warn('Erro ao inserir lead demo:', err.message);
      }
    }

    // IDs fixos: a esteira de cartório não duplica quando o modo demo roda 2x.
    for (const negociacao of cartorioDemo) {
      try {
        await setDoc(
          doc(db, 'oficinas', tenantId, 'cartorio_negociacoes', negociacao.id),
          negociacao,
          { merge: true },
        );
        cartorioInseridos.push(negociacao);
      } catch (err) {
        console.warn('Erro ao inserir negociação de cartório demo:', err.message);
      }
    }
  }

  return {
    sucesso: true,
    totalImoveis: imoveisInseridos.length || imoveisDemo.length,
    totalLeads: leadsInseridos.length || leadsDemo.length,
    totalCartorio: cartorioInseridos.length || cartorioDemo.length,
    imoveis: imoveisInseridos.length ? imoveisInseridos : imoveisDemo,
    leads: leadsInseridos.length ? leadsInseridos : leadsDemo,
    cartorio: cartorioInseridos.length ? cartorioInseridos : cartorioDemo,
  };
}
