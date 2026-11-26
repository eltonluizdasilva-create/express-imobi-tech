/**
 * manualAbas.js — mini-manual por aba, exibido no botão flutuante de ajuda.
 * Texto curto e operacional: o corretor lê em 20 segundos, no celular.
 */

export const MANUAL_ABAS = {
  dashboard_imobi: {
    titulo: 'Visão Geral',
    resumo: 'É o seu dia em uma tela: leads, visitas e o que está em negociação.',
    passos: [
      'Confira os quatro números do topo: VGV em carteira, comissão prevista, leads no funil e visitas.',
      'Use "Visão Geral" como abertura de reunião com o cliente: os números vêm do CRM, não de planilha.',
      'Se um número estiver zerado, é porque falta lançar lead ou visita — o painel só soma o que existe.',
    ],
    dica: 'Nada aqui precisa ser preenchido à mão: o painel lê o CRM em tempo real.',
  },
  captacao_imobi: {
    titulo: 'Captação & Imóveis',
    resumo: 'Cadastro e catálogo dos imóveis que você anuncia.',
    passos: [
      'Clique em "+ Imóvel" no topo para cadastrar: tipo, bairro, valor e fotos.',
      'Preencha o bairro com o nome usado nos anúncios (ex.: Santa Mônica) — é por ele que o portal filtra.',
      'Imóvel sem foto perde até metade dos contatos: suba pelo menos três.',
    ],
    dica: 'Imóvel cadastrado aqui aparece no portal e no link que você envia no WhatsApp.',
  },
  funil_leads: {
    titulo: 'Leads & Funil CRM',
    resumo: 'Onde o lead entra, é qualificado e vira negócio.',
    passos: [
      'Cada coluna é um estágio. Arraste o card quando o cliente avançar.',
      'Registre o contato no mesmo dia: lead sem registro é lead perdido.',
      'Use a roleta quando houver mais de um corretor para dividir os leads.',
    ],
    dica: 'Quem responde em até 5 minutos fecha muito mais. É aqui que você vê quem está atrasando.',
  },
  visitas_imobi: {
    titulo: 'Agenda de Visitas',
    resumo: 'Compromissos com cliente e imóvel, sem caderno.',
    passos: [
      'Crie a visita com data, hora, cliente e imóvel.',
      'Confirme no dia anterior pelo WhatsApp — reduz visita perdida.',
      'Depois da visita, mova o lead de estágio para não esfriar.',
    ],
    dica: 'Visita marcada e não confirmada é a maior causa de agenda vazia.',
  },
  financeiro: {
    titulo: 'Financeiro & VGV',
    resumo: 'Comissões, despesas e previsão de recebimento.',
    passos: [
      'Lance comissão prevista ao fechar negócio; recebida quando cair na conta.',
      'Despesa de anúncio entra aqui para você saber o custo real por venda.',
      'Confira o VGV do mês antes de definir meta do mês seguinte.',
    ],
    dica: 'Sem lançar despesa de tráfego, o lucro que aparece é ficção.',
  },
  historico: {
    titulo: 'Propostas & Negócios',
    resumo: 'Histórico do que foi proposto, aceito e fechado.',
    passos: [
      'Consulte antes de falar com o cliente: evita repetir proposta antiga.',
      'Proposta recusada fica registrada — serve de argumento no futuro.',
      'Negócio fechado aqui alimenta o VGV do painel.',
    ],
    dica: 'Histórico é sua memória comercial. Use nas negociações difíceis.',
  },
  equipe: {
    titulo: 'Corretores & Equipe',
    resumo: 'Quem está no time, com qual permissão e qual meta.',
    passos: [
      'Cadastre cada corretor com o próprio e-mail — o acesso é individual.',
      'Defina permissões antes de liberar o acesso: nem todos precisam de financeiro.',
      'Acompanhe meta individual na aba de cada corretor.',
    ],
    dica: 'Limite de corretores depende do plano. Veja em Meu Plano.',
  },
  marketing: {
    titulo: 'Meta Ads & Criativos',
    resumo: 'Copy, criativo e link direto para o WhatsApp do corretor.',
    passos: [
      'Escolha o imóvel: o gerador monta a copy com base nos dados dele.',
      'Teste dois títulos diferentes por campanha — o Meta entrega o melhor.',
      'O link leva para o WhatsApp com mensagem pronta; responda rápido.',
    ],
    dica: 'Anúncio bom com atendimento lento é dinheiro jogado fora.',
  },
  agentes_ia: {
    titulo: 'Agentes Operacionais · Zara',
    resumo: 'Zara coordena os agentes e a execução recorrente do funil; Tom apoia decisões e a Pólen atende 24h.',
    passos: [
      'Consulte os papéis dos agentes operacionais coordenados por Zara.',
      'Os estados e contadores exibidos nesta área são demonstrativos; a execução depende das integrações contratadas.',
      'Abra Tom para apoio estratégico ou Pólen para atendimento 24h no WhatsApp.',
    ],
    dica: 'Zara coordena a rotina; Tom apoia decisões e Pólen é a secretária 24h.',
  },
  whatsapp_hub: {
    titulo: 'Conexão WhatsApp',
    resumo: 'Liga o número da imobiliária ao atendimento automático.',
    passos: [
      'Conecte pelo QR Code com o celular que atende os clientes.',
      'Teste com uma mensagem real antes de divulgar o número.',
      'Se cair a conexão, reconecte pelo mesmo QR — o histórico permanece.',
    ],
    dica: 'Use um número dedicado ao atendimento, não o pessoal do dono.',
  },
  roleta_imobi: {
    titulo: 'Roleta de Leads',
    resumo: 'Distribui lead entre corretores sem briga por cliente.',
    passos: [
      'Cadastre os corretores ativos na roleta.',
      'Defina o critério: ordem fixa ou por disponibilidade.',
      'Lead não atendido em X minutos volta para a fila — ajuste esse tempo.',
    ],
    dica: 'Roleta sem regra de retorno premia quem demora.',
  },
  radar_captacao: {
    titulo: 'Radar de Captação',
    resumo: 'Ache o anúncio de particular, chegue com avaliação técnica e leve a carteira para os portais.',
    passos: [
      'Preencha cidade, bairro e nicho e abra as buscas prontas (OLX, Marketplace, Google).',
      'Achou um anúncio? Cole o texto inteiro no extrator — o motor lê preço, área, contato e compara com o m² da região.',
      'Copie uma das três abordagens e envie no WhatsApp do proprietário.',
      'No fim, baixe o feed-portais.xml com os imóveis ativos para subir em ZAP, VivaReal e OLX.',
    ],
    dica: 'Anúncio acima do mercado é o melhor gancho: você chega com número, não com opinião.',
  },
  avaliacao_imovel: {
    titulo: 'Avaliação de Imóvel',
    resumo: 'Chega no preço certo com comparáveis de mercado — e num parecer que convence o proprietário.',
    passos: [
      'Informe UF, cidade, bairro e tipologia do imóvel.',
      'Preencha áreas, padrão construtivo e estado de conservação.',
      'Se tiver, cole até 3 comparáveis (valor pedido, área e distância) — o motor desconta 10% de oferta.',
      'Copie o parecer para o WhatsApp ou imprima em PDF e mande para o proprietário.',
    ],
    dica: 'Sem comparáveis o motor entrega estimativa paramétrica; com 3 comparáveis próximos o grau de fundamentação sobe e o número fica defensável.',
  },
  acompanhamento_cliente: {
    titulo: 'Acompanhamento do Cliente',
    resumo: 'Cada processo tem código e senha; o cliente acompanha sozinho.',
    passos: [
      'Clique em "+ Novo Processo" e escolha o tipo de operação — as etapas carregam prontas.',
      'Marque cada etapa assim que avançar: o cliente vê na hora pelo link.',
      'Envie o link no WhatsApp pelo próprio card do processo.',
    ],
    dica: 'Quem acompanha não liga perguntando. Isso devolve horas do seu dia.',
  },
  meuplano: {
    titulo: 'Meu Plano',
    resumo: 'O que está liberado hoje e o que muda no PRO e no PLUS.',
    passos: [
      'Veja o plano atual e a data do período de teste.',
      'Compare os recursos antes de decidir o upgrade.',
      'Ao assinar, o plano é aplicado na hora — sem precisar sair do painel.',
    ],
    dica: 'O que você usa no dia a dia (CRM, visitas, imóveis) já está no plano gratuito.',
  },
  'reunioes-atas': {
    titulo: 'Reuniões & Atas IA',
    resumo: 'Gravação ao vivo, transcrição inteligente e geração de atas executivas com envio de pendências para a agenda.',
    passos: [
      'Clique em "Gravar" para ativar o microfone e transcrever a reunião ao vivo pelo navegador (ou cole o texto da transcrição no campo).',
      'Clique em "Gerar Ata Executiva com IA": a inteligência artificial analisa a reunião e estrutura o resumo, as decisões e os prazos.',
      'Revise a ata gerada e envie cada tarefa diretamente para a Agenda & Tarefas com o corretor responsável.',
    ],
    dica: 'Privacidade garantida: o áudio não sai do seu navegador. Apenas o texto transcrito é enviado com segurança para a IA.',
  },
};

export function manualDaAba(abaAtiva, infoAba) {
  const manual = MANUAL_ABAS[abaAtiva];
  if (manual) return manual;

  return {
    titulo: infoAba?.tituloLimpo || infoAba?.tituloCard || 'Esta aba',
    resumo: infoAba?.descricao || 'Módulo do painel Express Imobi Tech.',
    passos: [
      'Use os controles no topo do card para começar.',
      'Os dados salvos aparecem na lista abaixo, em tempo real.',
      'Em caso de dúvida, fale com o suporte pelo botão de especialista.',
    ],
    dica: '',
  };
}
