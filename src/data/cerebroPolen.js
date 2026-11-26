/**
 * src/data/cerebroPolen.js
 * ============================================================================
 * Cérebro da Pólen — Secretária Comercial 24h da Imobiliária no WhatsApp.
 *
 * Contém:
 * 1. Diretrizes invioláveis da Pólen perante os compradores e leads:
 *    - NUNCA pedir CPF pelo WhatsApp (o corretor usa o próprio CPF na pré-simulação);
 *    - NUNCA calcular parcelas nem prometer taxas (deixa para o correspondente);
 *    - NUNCA citar preço ou regras da plataforma de SaaS para os clientes finais;
 *    - Preencher automaticamente os dados do imóvel pelo cadastro (residencial/comercial,
 *      valor, UF/cidade/bairro, novo/usado);
 *    - Para clientes à vista: pular checklist e conduzir direto para agendamento de visita;
 *    - Para clientes de financiamento: enviar mensagem opcional e acolhedora com os
 *      7 itens validados de pré-simulação bancária.
 * 2. Roteiro Oficial de Pré-Simulação Bancária (7 Pontos Validados);
 * 3. Gerador de Resposta Rápida (0 tokens) para o Simulador de Atendimento ao Vivo.
 * ============================================================================
 */

export const REGRAS_COMERCIAIS_POLEN = Object.freeze({
  semCpfNoWhatsapp:
    'Nunca solicitar CPF do cliente no WhatsApp. O corretor parceiro utiliza o próprio CPF na simulação inicial junto aos bancos parceiros (Caixa, Itaú, Bradesco, Santander), garantindo total privacidade e conforto ao comprador.',
  
  semCalculoParcelas:
    'A Pólen nunca calcula parcelas nem estima valores de financiamento. Os cálculos e enquadramentos de taxas são prerrogativa técnica exclusiva do corretor e do correspondente bancário credenciado.',
  
  semPrecoPlataforma:
    'A Pólen atua como secretária comercial da imobiliária para compradores finais de imóveis. Jamais cita preços de planos, assinaturas, tokens ou termos do sistema Express Imobi Tech para o cliente.',
  
  autoPreenchimentoImovel:
    'Os dados do imóvel (finalidade residencial/comercial, valor, localização UF/cidade/bairro e condição novo/usado) são preenchidos automaticamente pelo cadastro e confirmados sem burocracia.',

  fluxoAVista:
    'Para clientes com recurso próprio ou compra à vista, a Pólen pula o checklist de financiamento e conduz diretamente a conversa para o agendamento da visita presencial ao imóvel.',

  fluxoFinanciamento:
    'No fechamento de atendimentos em que o cliente demonstra interesse com necessidade de financiamento, a Pólen envia uma mensagem acolhedora e opcional contendo os 7 itens validados para pré-simulação.',
});

/**
 * Os 7 Itens Oficiais Validados para Pré-Simulação Bancária Habitacional.
 */
export const ROTEIRO_PRE_SIMULACAO_7_PONTOS = Object.freeze([
  {
    numero: 1,
    titulo: 'Data de nascimento da pessoa mais velha',
    descricao: 'Data de nascimento da pessoa mais velha que vai participar do financiamento.',
    motivo: 'Define o prazo máximo da operação e a tabela de seguro habitacional (MIP).',
  },
  {
    numero: 2,
    titulo: 'Local de residência e trabalho',
    descricao: 'Se mora ou trabalha na cidade do imóvel ou em cidade vizinha/mesma região metropolitana.',
    motivo: 'Enquadramento territorial das regras do SFH e FGTS.',
  },
  {
    numero: 3,
    titulo: 'Renda bruta mensal familiar',
    descricao: 'Renda bruta mensal somando apenas quem vai participar do financiamento.',
    motivo: 'Capacidade de pagamento (comprometimento de até 30% da renda).',
  },
  {
    numero: 4,
    titulo: 'Tempo de contribuição sob regime do FGTS',
    descricao: 'Se possui 3 anos ou mais de contribuição sob o regime do FGTS (somando todos os empregos de carteira assinada).',
    motivo: 'Condição necessária para redução de juros e enquadramento de programas.',
  },
  {
    numero: 5,
    titulo: 'Conta ativa e saldo de FGTS',
    descricao: 'Se possui conta ativa ou saldo de FGTS superior a 10% do valor do imóvel (destacando que pode usar para ajudar na entrada).',
    motivo: 'Uso do saldo de FGTS para amortizar a entrada necessária.',
  },
  {
    numero: 6,
    titulo: 'Subsídio anterior do FGTS ou da União',
    descricao: 'Se já foi beneficiado com subsídio do FGTS ou da União a partir de 02/05/2005.',
    motivo: 'Verificação de elegibilidade a novos subsídios habitacionais.',
  },
  {
    numero: 7,
    titulo: 'Composição de renda e dependentes',
    descricao: 'Se vai compor renda com mais alguém ou possui dependente sem renda (filho até 21 anos, ou até 24 anos se estiver estudando).',
    motivo: 'Fator determinante para limites de subsídio e ampliação de margem de crédito.',
  },
]);

/**
 * Formata os dados cadastrais do imóvel para constar no preenchimento automático.
 */
export function formatarDadosImovelCadastro(imovel = {}) {
  const tipo = imovel.tipo || 'Residencial';
  const condicao = imovel.novo ? 'Novo' : imovel.condicao || 'Pronto para morar';
  const bairro = imovel.bairro || 'Excelente localização';
  const cidade = imovel.cidade || 'Cidade local';
  const uf = imovel.uf || 'UF';
  const valorNum = Number(imovel.valor || imovel.preco || 0);
  const valorFormatado = valorNum > 0
    ? valorNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : 'Sob consulta';

  return {
    titulo: imovel.titulo || `${tipo} em ${bairro}`,
    tipo,
    condicao,
    localizacao: `${bairro}, ${cidade}/${uf}`,
    valorFormatado,
    valorNum,
  };
}

/**
 * Gera a mensagem oficial acolhedora com os 7 pontos para o cliente de financiamento.
 */
export function gerarMensagemPreSimulacao({
  imovel = {},
  nomeCliente = '',
  nomeImobiliaria = 'nossa imobiliária',
  nomeCorretor = 'nosso corretor especialista',
} = {}) {
  const dados = formatarDadosImovelCadastro(imovel);
  const saudacaoCliente = nomeCliente ? `Olá, ${nomeCliente}! ` : 'Olá! ';

  return `${saudacaoCliente}Ótima escolha! Esse imóvel aceita financiamento bancário pelos principais bancos (Caixa, Itaú, Bradesco e Santander).

Já deixei os dados técnicos do imóvel pré-preenchidos:
🏡 **${dados.titulo}**
📍 Localização: ${dados.localizacao}
💰 Valor de referência: ${dados.valorFormatado} (${dados.condicao})

🔒 **Segurança e Conforto:** Nós **nunca pedimos seu CPF pelo WhatsApp**. Para a sua pré-simulação inicial, ${nomeCorretor} utiliza os dados do imóvel e os parâmetros básicos diretamente nos bancos.

Se você quiser adiantar uma pré-simulação bancária oficial sob medida para ver o melhor cenário de entrada e parcelas, envie estes 7 itens quando tiver um tempinho (é super simples e opcional):

1️⃣ **Data de nascimento** da pessoa mais velha que vai financiar;
2️⃣ **Se mora ou trabalha** na cidade do imóvel ou em cidade vizinha;
3️⃣ **Renda bruta mensal** (somando apenas quem vai participar do financiamento);
4️⃣ **Se possui 3 anos ou mais** de trabalho sob regime do FGTS (somando todos os empregos);
5️⃣ **Se possui saldo de FGTS** superior a 10% do valor do imóvel (lembrando que você pode usar para ajudar na entrada!);
6️⃣ **Se já recebeu subsídio** do FGTS ou da União a partir de 02/05/2005;
7️⃣ **Se vai compor renda** com mais alguém ou possui dependente sem renda (filho até 21 anos, ou até 24 anos se estiver estudando).

Assim que enviar, o especialista gera sua simulação oficial nos bancos parceiros. Podemos também já deixar sua visita agendada para conhecer o imóvel presencialmente?`;
}

/**
 * Resposta rápida para clientes com compra à vista.
 */
export function gerarRespostaCompraAVista({
  imovel = {},
  nomeCorretor = 'nosso corretor especialista',
} = {}) {
  const dados = formatarDadosImovelCadastro(imovel);
  return `Excelente! Para aquisição com recursos próprios ou à vista no imóvel **${dados.titulo}** (${dados.valorFormatado}), temos condições muito ágeis de fechamento direto com o proprietário.

Vamos já agendar a sua visita para você conhecer o imóvel pessoalmente? Qual dia da semana e período (manhã ou tarde) fica melhor para você?`;
}

/**
 * Dicionário de respostas instantâneas (0 tokens) para a demonstração ao vivo da Pólen.
 */
export function obterRespostaRapida0Tokens({
  mensagem = '',
  imovel = {},
  nomeImobiliaria = 'sua imobiliária',
  nomeCorretor = 'Corretor Especialista',
} = {}) {
  const texto = String(mensagem || '').toLowerCase().trim();

  // 1. Financiamento
  if (
    texto.includes('preciso financiar') ||
    texto.includes('aceita financiamento') ||
    texto.includes('simulacao') ||
    texto.includes('simulação') ||
    texto.includes('financiar')
  ) {
    return gerarMensagemPreSimulacao({
      imovel,
      nomeImobiliaria,
      nomeCorretor,
    });
  }

  // 2. Compra à vista
  if (
    texto.includes('à vista') ||
    texto.includes('a vista') ||
    texto.includes('recurso próprio') ||
    texto.includes('sem financiamento')
  ) {
    return gerarRespostaCompraAVista({
      imovel,
      nomeCorretor,
    });
  }

  // 3. Agendar visita
  if (
    texto.includes('visita') ||
    texto.includes('conhecer o imóvel') ||
    texto.includes('agendar')
  ) {
    const dados = formatarDadosImovelCadastro(imovel);
    return `Com certeza! Será um prazer te apresentar o **${dados.titulo}** (${dados.localizacao}).

Temos horários flexíveis para visitação nesta semana. Você prefere uma visita no período da manhã ou da tarde? Se preferir um dia específico, me informe para eu já reservar na agenda de ${nomeCorretor}.`;
  }

  // 4. Condomínio e IPTU
  if (
    texto.includes('condomínio') ||
    texto.includes('condominio') ||
    texto.includes('iptu')
  ) {
    const cond = imovel.condominio ? `R$ ${Number(imovel.condominio).toLocaleString('pt-BR')}` : 'a confirmar com o proprietário';
    const iptu = imovel.iptu ? `R$ ${Number(imovel.iptu).toLocaleString('pt-BR')}/ano` : 'a confirmar';
    return `Os valores informados para este imóvel são:
🏢 **Condomínio:** ${cond}
📄 **IPTU:** ${iptu}

Gostaria de agendar uma visita para ver os detalhes do prédio e das áreas comuns presencialmente?`;
  }

  return null;
}
