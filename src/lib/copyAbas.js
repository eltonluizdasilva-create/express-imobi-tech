/**
 * copyAbas.js — copy orientada a dor para o rodapé contextual
 * ============================================================================
 * Regra de escrita: falar como corretor fala. Nada de "motor comparativo" ou
 * "NBR 14.653" no rodapé — isso fica nas telas técnicas. Aqui é dor + ganho.
 * Cada entrada tem duas linhas curtas para caber no celular.
 * ============================================================================
 */

// Selo visível no rodapé: serve para conferir, em produção, qual build está carregado.
export const VERSAO_COPY = 'v2026.11.18-c';

export const DOR_SOLUCAO = {
  dashboard_imobi: {
    dor: 'Você abre o sistema e não sabe o que fazer primeiro.',
    ganho: 'Em 5 segundos vê quem chegou, quem está esperando resposta e quanto tem a receber.',
  },
  captacao_imobi: {
    dor: 'Cadastrar imóvel dá trabalho e sempre falta um campo.',
    ganho: 'Cadastre em 1 minuto: o formulário se adapta ao tipo e o imóvel já sai na vitrine e nos portais.',
  },
  funil_leads: {
    dor: 'Lead esfria porque ninguém sabe de quem é ou quem falou por último.',
    ganho: 'Cada cliente tem dono, etapa e prazo — e o card denuncia quem está parado.',
  },
  visitas_imobi: {
    dor: 'Plantão furado: cliente não aparece e o corretor descobre na hora.',
    ganho: 'Agenda com corretor, imóvel e confirmação no WhatsApp antes da visita.',
  },
  financeiro: {
    dor: 'Você não sabe quanto realmente vai receber até fechar o mês.',
    ganho: 'Comissão prevista, recebida e travada no mesmo lugar — sem planilha.',
  },
  historico: {
    dor: 'Cliente pergunta da proposta e você precisa garimpar conversa antiga.',
    ganho: 'Proposta, status e histórico em um clique: responde na hora, sem "vou verificar".',
  },
  marketing: {
    dor: 'Post improvisado no meio do plantão não gera lead.',
    ganho: 'Arte, legenda e público prontos em 1 minuto, no tom que o cliente responde.',
  },
  tarefa: {
    dor: 'Vistoria sem laudo vira discussão na saída do inquilino.',
    ganho: 'Laudo fotográfico por ambiente: entrada e saída documentadas, sem desgaste.',
  },
  notafiscal: {
    dor: 'Repasse e nota em sistemas diferentes: sempre sobra conta errada.',
    ganho: 'Emite, divide o repasse e mostra quanto entra — no mesmo lugar.',
  },
  avaliacao_imovel: {
    dor: 'Proprietário acha que o imóvel vale mais e você não tem argumento.',
    ganho: 'Avaliação com comparáveis reais e três cenários de preço: mostra o número, não a opinião.',
  },
  credito: {
    dor: 'Você leva o cliente ao banco e descobre ali que não passa.',
    ganho: 'Enquadramento, parcela e subsídio antes da visita: só leva quem tem chance.',
  },
  agentes_ia: {
    dor: 'Lead que chega no fim de semana fica sem resposta até segunda.',
    ganho: 'Agentes respondem, qualificam e agendam 24h — seu WhatsApp para de perder contato.',
  },
  radar_captacao: {
    dor: 'Você descobre o imóvel do concorrente quando o cliente já visitou.',
    ganho: 'Radar mostra anúncio novo na região com preço e argumento de abordagem.',
  },
  whatsapp_hub: {
    dor: 'Lead manda mensagem fora de hora e fecha com o concorrente que respondeu primeiro?',
    ganho: 'Atendimento imediato no WhatsApp 24/7 que qualifica o cliente e agenda a visita para você.',
  },
  secretaria: {
    dor: 'Lead manda mensagem fora de hora e fecha com o concorrente que respondeu primeiro?',
    ganho: 'Atendimento imediato no WhatsApp 24/7 que qualifica o cliente e agenda a visita para você.',
  },
  copiloto: {
    dor: 'Perde tempo caçando dados no sistema ou redigindo mensagens do zero para cada cliente?',
    ganho: 'Seu copiloto operacional que executa tarefas, resume fichas e acelera seu atendimento.',
  },
  administrador: {
    dor: 'Equipe travada, estoque encalhado ou dúvida sobre onde investir em tráfego?',
    ganho: 'Um diretor comercial 24h analisando sua carteira e montando planos prontos para bater meta.',
  },
  contador: {
    dor: 'Medo de errar cálculo de imposto, ganho de capital ou emissão de nota na venda?',
    ganho: 'Orientação tributária imobiliária na hora para fechar negócios sem susto com a Receita.',
  },
  juridico_imobi: {
    dor: 'Contrato travado por cláusula duvidosa ou insegurança na documentação do imóvel?',
    ganho: 'Análise rápida de cláusulas, distrato e matrícula para dar segurança jurídica ao fechamento.',
  },
  equipe: {
    dor: 'Você não sabe quem está produzindo e quem só ocupa lugar.',
    ganho: 'Produção por corretor visível: decide comissão e escala com número na mão.',
  },
  roleta_imobi: {
    dor: 'Lead distribuído a dedo gera briga interna.',
    ganho: 'Roleta equilibrada por ordem e disponibilidade: distribuição justa e rastreada.',
  },
  config: {
    dor: 'Dado da imobiliária espalhado e desatualizado.',
    ganho: 'Um lugar para marca, contato, CRECI e integrações — tudo que a arte e o portal usam.',
  },
  meuplano: {
    dor: 'Contratou um plano e não sabe direito o que está liberado?',
    ganho: 'Em 1 tela: o que está incluso, quanto falta do trial e o que muda no PRO — ative sem falar com ninguém.',
  },
  migracao: {
    dor: 'Trocar de CRM dá medo de perder a carteira e o histórico.',
    ganho: 'Importa backup e planilha sem perder contato: você começa a usar no mesmo dia.',
  },
  especialista: {
    dor: 'Suporte que promete retorno e nunca volta?',
    ganho: 'Atendimento humano de quem conhece o produto, direto no painel — sem fila de robô.',
  },
  youtube: {
    dor: 'Vídeo longo que ninguém assiste não gera cliente.',
    ganho: 'Transforma o vídeo em resumo e cortes prontos para publicar — conteúdo sem edição manual.',
  },
  burocracias: {
    dor: 'Documento e exigência espalhados entre e-mail, pasta e memória.',
    ganho: 'Guia de burocracia por etapa: em segundos você sabe o que pedir ao cliente.',
  },
  acompanhamento_cliente: {
    dor: 'Cliente liga toda hora perguntando como está o processo.',
    ganho: 'Link com código e senha mostra cada etapa sozinho: menos ligação, mais confiança.',
  },
};

/** Fallback para abas sem copy específica. */
export const DOR_PADRAO = {
  dor: 'Ferramenta parada não fecha venda.',
  ganho: 'Cada aba existe para tirar uma tarefa manual do seu dia.',
};

export function textoDor(abaAtiva) {
  return DOR_SOLUCAO[abaAtiva] || DOR_PADRAO;
}

/** Abas cobertas (usado em teste para garantir cobertura das principais). */
export const ABAS_COM_COPY = Object.keys(DOR_SOLUCAO);
