import { collection, addDoc, doc, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { negociacoesDemoCartorio } from './cartorioEscritura.js';
import { MODALIDADES_VISTORIA, STATUS_CHECKLIST } from './vistoriaChaves.js';
import { CATEGORIAS_RADAR, IMPACTOS_RADAR, calcularIndiceLiquidez } from './radarEntorno.js';

export const cenarioDemoRadarEntorno = [
  {
    id: 'radar_demo_1',
    codigoImovel: 'IMB-3041',
    bairro: 'Jardins',
    cidade: 'São Paulo',
    uf: 'SP',
    ancoras: [
      { id: 'anc_1', nome: 'Supermercado Pão de Açúcar', categoria: CATEGORIAS_RADAR.COMERCIO, distancia: '250m', impacto: IMPACTOS_RADAR.CONVENIENCIA, pesoBase: 15 },
      { id: 'anc_2', nome: 'Colégio Dante Alighieri', categoria: CATEGORIAS_RADAR.EDUCACAO, distancia: '350m', impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 18 },
      { id: 'anc_3', nome: 'Complexo Hospitalar & Clínicas', categoria: CATEGORIAS_RADAR.SAUDE, distancia: '600m', impacto: IMPACTOS_RADAR.CONVENIENCIA, pesoBase: 15 },
      { id: 'anc_4', nome: 'Parque Ibirapuera', categoria: CATEGORIAS_RADAR.LAZER, distancia: '800m', impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 20 },
      { id: 'anc_5', nome: 'Estação de Metrô Oscar Freire', categoria: CATEGORIAS_RADAR.MOBILIDADE, distancia: '400m', impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 20 },
    ],
    indice: calcularIndiceLiquidez([
      { distancia: '250m', impacto: IMPACTOS_RADAR.CONVENIENCIA, pesoBase: 15 },
      { distancia: '350m', impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 18 },
      { distancia: '600m', impacto: IMPACTOS_RADAR.CONVENIENCIA, pesoBase: 15 },
      { distancia: '800m', impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 20 },
      { distancia: '400m', impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 20 },
    ]),
  },
  {
    id: 'radar_demo_2',
    codigoImovel: 'IMB-1180',
    bairro: 'Centro',
    cidade: 'Uberlândia',
    uf: 'MG',
    ancoras: [
      { id: 'anc_1', nome: 'Supermercado Bretas', categoria: CATEGORIAS_RADAR.COMERCIO, distancia: '300m', impacto: IMPACTOS_RADAR.CONVENIENCIA, pesoBase: 14 },
      { id: 'anc_2', nome: 'Escola Estadual & Cursos', categoria: CATEGORIAS_RADAR.EDUCACAO, distancia: '400m', impacto: IMPACTOS_RADAR.CONVENIENCIA, pesoBase: 14 },
      { id: 'anc_3', nome: 'Praça Tubal Vilela', categoria: CATEGORIAS_RADAR.LAZER, distancia: '300m', impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 16 },
      { id: 'anc_4', nome: 'Av. Afonso Pena (Corredor BRT)', categoria: CATEGORIAS_RADAR.MOBILIDADE, distancia: '150m', impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 16 },
      { id: 'anc_5', nome: 'Corredor Central de Alto Tráfego / Ruído', categoria: CATEGORIAS_RADAR.RUIDO_ATENCAO, distancia: '100m', impacto: IMPACTOS_RADAR.PONTO_ATENCAO, pesoBase: -20 },
    ],
    indice: calcularIndiceLiquidez([
      { distancia: '300m', impacto: IMPACTOS_RADAR.CONVENIENCIA, pesoBase: 14 },
      { distancia: '400m', impacto: IMPACTOS_RADAR.CONVENIENCIA, pesoBase: 14 },
      { distancia: '300m', impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 16 },
      { distancia: '150m', impacto: IMPACTOS_RADAR.ALTA_VALORIZACAO, pesoBase: 16 },
      { distancia: '100m', impacto: IMPACTOS_RADAR.PONTO_ATENCAO, pesoBase: -20 },
    ]),
  },
];

export const vistoriasDemoChaves = [
  {
    id: 'vistoria_demo_1',
    modalidade: MODALIDADES_VISTORIA.ENTREGA_CHAVES_VENDA,
    codigoImovel: 'IMB-3041',
    imovelTitulo: 'Apartamento 3 Suítes — Residencial Jardins',
    endereco: 'Rua das Palmeiras, 450, Apto 82 — Jardins, São Paulo/SP',
    nomeCliente: 'Marcelo Vasconcelos',
    telefone: '11999887766',
    nomeProprietario: 'Construtora & Incorporadora Horizonte',
    corretor: 'Rodrigo Almeida',
    creciCorretor: 'CRECI 189204-F',
    dataVistoria: '2026-11-26',
    qtdChaves: 4,
    qtdControles: 2,
    qtdTags: 3,
    obsChaves: '2 chaves da porta principal (fechadura multiponto), 2 de serviço, 2 controles PPA e 3 tags prediais.',
    medidores: {
      energiaNumero: 'MED-784912',
      energiaLeitura: '14280',
      aguaNumero: 'HID-33019',
      aguaLeitura: '318',
      gasNumero: 'GAS-99120',
      gasLeitura: '104',
    },
    checklist: [
      { id: 'amb_1', ambiente: 'Sala & Estar', status: STATUS_CHECKLIST.APROVADO, observacao: 'Piso porcelanato polido sem trincas, pintura nova branco neve.', fotoUrl: '' },
      { id: 'amb_2', ambiente: 'Cozinha & Área de Serviço', status: STATUS_CHECKLIST.APROVADO, observacao: 'Bancadas de granito intactas, torneiras sem vazamento, cuba inox perfeita.', fotoUrl: '' },
      { id: 'amb_3', ambiente: 'Quartos & Suítes', status: STATUS_CHECKLIST.APROVADO, observacao: 'Esquadrias de alumínio com persianas integradas funcionando perfeitamente.', fotoUrl: '' },
      { id: 'amb_4', ambiente: 'Banheiros', status: STATUS_CHECKLIST.APROVADO, observacao: 'Louças e metais Deca testados, ralos limpos e com vazão plena.', fotoUrl: '' },
      { id: 'amb_5', ambiente: 'Parte Elétrica & Quadro', status: STATUS_CHECKLIST.APROVADO, observacao: 'Quadro de disjuntores DIN identificado com DR e DPS instalados.', fotoUrl: '' },
      { id: 'amb_6', ambiente: 'Hidráulica & Registros', status: STATUS_CHECKLIST.APROVADO, observacao: 'Pressurizador funcionando normalmente, registros gerais testados.', fotoUrl: '' },
      { id: 'amb_7', ambiente: 'Esquadrias, Portas & Fechaduras', status: STATUS_CHECKLIST.APROVADO, observacao: 'Portas maciças com fechaduras La Fonte e chaves testadas.', fotoUrl: '' },
    ],
    observacoesGerais: 'Imóvel novo entregue conforme memorial descritivo da incorporadora.',
  },
  {
    id: 'vistoria_demo_2',
    modalidade: MODALIDADES_VISTORIA.ENTRADA_LOCACAO,
    codigoImovel: 'IMB-1180',
    imovelTitulo: 'Casa em Condomínio Fechado — Quadra B Lote 14',
    endereco: 'Al. dos Ipês, 120 — Condomínio Bosque Imperial',
    nomeCliente: 'Fernanda Ribeiro',
    telefone: '11988776655',
    nomeProprietario: 'Dr. Eduardo Vasques',
    corretor: 'Camila Rocha',
    creciCorretor: 'CRECI 215430-F',
    dataVistoria: '2026-11-25',
    qtdChaves: 3,
    qtdControles: 1,
    qtdTags: 2,
    obsChaves: '3 chaves do portão/porta social e 1 controle de garagem.',
    medidores: {
      energiaNumero: 'MED-415820',
      energiaLeitura: '28950',
      aguaNumero: 'HID-88412',
      aguaLeitura: '542',
      gasNumero: 'N/A (Botijão P13)',
      gasLeitura: '0',
    },
    checklist: [
      { id: 'amb_1', ambiente: 'Sala & Estar', status: STATUS_CHECKLIST.COM_RESSALVA, observacao: 'Pequena marca de quadro na parede oeste; proprietário ciente.', fotoUrl: '' },
      { id: 'amb_2', ambiente: 'Cozinha & Área de Serviço', status: STATUS_CHECKLIST.APROVADO, observacao: 'Armários embutidos bem alinhados, torneira gourmet operando.', fotoUrl: '' },
      { id: 'amb_3', ambiente: 'Quartos & Suítes', status: STATUS_CHECKLIST.APROVADO, observacao: 'Pintura geral em bom estado de conservação.', fotoUrl: '' },
      { id: 'amb_4', ambiente: 'Banheiros', status: STATUS_CHECKLIST.REPARO_PENDENTE, observacao: 'Leve gotejamento na ducha higiênica da suíte master; reparo agendado para 28/11.', fotoUrl: '' },
      { id: 'amb_5', ambiente: 'Parte Elétrica & Quadro', status: STATUS_CHECKLIST.APROVADO, observacao: 'Todas as tomadas e interruptores testados.', fotoUrl: '' },
      { id: 'amb_6', ambiente: 'Hidráulica & Registros', status: STATUS_CHECKLIST.APROVADO, observacao: 'Caixa d\'água limpa e registros funcionando.', fotoUrl: '' },
      { id: 'amb_7', ambiente: 'Esquadrias, Portas & Fechaduras', status: STATUS_CHECKLIST.APROVADO, observacao: 'Portas e janelas em bom estado com vedação correta.', fotoUrl: '' },
    ],
    observacoesGerais: 'Locação com garantia de caução; reparo do gotejamento fica por conta do locador.',
  },
];

export function obterCenarioVistoriasDemo() {
  return vistoriasDemoChaves;
}

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
  const vistoriasDemo = obterCenarioVistoriasDemo();

  // Inserir no Firestore
  const imoveisInseridos = [];
  const leadsInseridos = [];
  const cartorioInseridos = [];
  const vistoriasInseridas = [];

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

    // IDs fixos: vistorias de entrega de chaves não duplicam
    for (const vistoria of vistoriasDemo) {
      try {
        await setDoc(
          doc(db, 'oficinas', tenantId, 'vistorias_chaves', vistoria.id),
          vistoria,
          { merge: true },
        );
        vistoriasInseridas.push(vistoria);
      } catch (err) {
        console.warn('Erro ao inserir vistoria demo:', err.message);
      }
    }
  }

  return {
    sucesso: true,
    totalImoveis: imoveisInseridos.length || imoveisDemo.length,
    totalLeads: leadsInseridos.length || leadsDemo.length,
    totalCartorio: cartorioInseridos.length || cartorioDemo.length,
    totalVistorias: vistoriasInseridas.length || vistoriasDemo.length,
    imoveis: imoveisInseridos.length ? imoveisInseridos : imoveisDemo,
    leads: leadsInseridos.length ? leadsInseridos : leadsDemo,
    cartorio: cartorioInseridos.length ? cartorioInseridos : cartorioDemo,
    vistorias: vistoriasInseridas.length ? vistoriasInseridas : vistoriasDemo,
  };
}
