/**
 * transparenciaDados.js — estado REAL de rastreamento e integrações de terceiros.
 * ============================================================================
 * Fonte única usada pelo banner de cookies, pela Política de Privacidade e pelo
 * painel "Privacidade e seus dados". Se um script novo entrar no produto, ele
 * muda AQUI primeiro — o texto de tela acompanha sozinho.
 *
 * Regra (D-22.05): nada de afirmar integração que não existe nem esconder a que
 * existe. O inventário abaixo foi levantado no código:
 *   - `index.html` não carrega script de terceiro (só o bundle da aplicação);
 *   - `grep` por gtag/fbq/posthog/hotjar/clarity = 0 ocorrência;
 *   - Firebase, ViaCEP, Photon e as CDNs de imagem aparecem no código;
 *   - WhatsApp, portais e Asaas são abertos por link/checkout, a pedido do
 *     usuário, não em segundo plano.
 * ============================================================================
 */

/** Scripts de rastreamento/publicidade carregados hoje. Lista vazia = nenhum. */
export const SCRIPTS_RASTREAMENTO = Object.freeze([]);

export const RASTREAMENTO = Object.freeze({
  analytics: false,
  pixelDePublicidade: false,
  gravacaoDeSessao: false,
  cookiesDeTerceiros: false,
  perfilamentoOuRemarketing: false,
});

/**
 * Integrações que o navegador aciona de fato.
 * `essencial: true` = necessário para a conta/serviço funcionar.
 * `gatilho` diz quando o pedido acontece — é o que separa "sempre" de "só se
 * você usar".
 */
export const INTEGRACOES_TERCEIROS = Object.freeze([
  {
    id: 'firebase',
    nome: 'Google Firebase (Auth, Firestore e Storage)',
    finalidade: 'Login, banco de dados da conta e armazenamento de fotos/documentos.',
    dadoEnviado: 'E-mail, credencial de acesso (guardada pelo provedor) e o conteúdo que você cadastra.',
    gatilho: 'Sempre que você entra ou usa o painel.',
    essencial: true,
  },
  {
    id: 'ia',
    nome: 'Provedor de inteligência artificial (via servidor da Express Tech)',
    finalidade: 'Gerar respostas dos agentes, rascunhos e simulações.',
    dadoEnviado: 'Texto da conversa e catálogo enviado pela plataforma. A chave de API fica no servidor, nunca no navegador.',
    gatilho: 'Só quando você pede uma resposta de IA (simulador, copiloto, assistido).',
    essencial: false,
  },
  {
    id: 'whatsapp',
    nome: 'WhatsApp / Meta',
    finalidade: 'Abrir a conversa com a imobiliária ou com o lead e conectar o número da conta.',
    dadoEnviado: 'Telefone e texto da mensagem que você mesmo aciona ao clicar no botão.',
    gatilho: 'Só ao clicar em um botão de WhatsApp.',
    essencial: false,
  },
  {
    id: 'pagamento',
    nome: 'Processador de pagamentos (checkout Asaas)',
    finalidade: 'Emitir a cobrança da assinatura e confirmar o pagamento.',
    dadoEnviado: 'Dados digitados no checkout do provedor. Cartão não passa pela plataforma.',
    gatilho: 'Só ao contratar ou renovar um plano.',
    essencial: false,
  },
  {
    id: 'cep',
    nome: 'ViaCEP',
    finalidade: 'Completar o endereço a partir do CEP digitado.',
    dadoEnviado: 'Apenas o CEP.',
    gatilho: 'Só quando um formulário de endereço consulta o CEP.',
    essencial: false,
  },
  {
    id: 'geocodificacao',
    nome: 'Photon / OpenStreetMap',
    finalidade: 'Localizar empresas e imóveis por região no Radar de Captação.',
    dadoEnviado: 'Termo de busca e raio de distância. Sem nome de pessoa.',
    gatilho: 'Só ao usar o Radar de Captação.',
    essencial: false,
  },
  {
    id: 'imagens',
    nome: 'CDNs de imagem (Unsplash, DiceBear, QR Server)',
    finalidade: 'Fotos de exemplo, avatar do agente e geração do QR Code.',
    dadoEnviado: 'Endereço IP e a imagem solicitada — não há identificação de usuário.',
    gatilho: 'Ao abrir uma tela que usa imagem de exemplo, avatar ou QR Code.',
    essencial: false,
  },
  {
    id: 'portais',
    nome: 'Portais de anúncio (ZAP, VivaReal, OLX e equivalentes)',
    finalidade: 'Publicar o catálogo de imóveis quando a imobiliária integra o feed.',
    dadoEnviado: 'Dados públicos do imóvel escolhidos pela imobiliária.',
    gatilho: 'Só com integração de portal ativa e catálogo publicado.',
    essencial: false,
  },
]);

/** Resumo curto do estado atual para banners e avisos. */
export function resumoRastreamento() {
  const ativos = SCRIPTS_RASTREAMENTO.length;
  if (!ativos) {
    return {
      ativos: false,
      titulo: 'Nenhum script de rastreamento ativo',
      texto:
        'Não carregamos Google Analytics, Meta Pixel, gravação de sessão nem remarketing. Se algum for adicionado, só roda com o seu consentimento.',
    };
  }
  return {
    ativos: true,
    titulo: `${ativos} script(s) de rastreamento ativo(s)`,
    texto: 'Estes scripts só rodam quando o registro de consentimento permite análise.',
  };
}

/** Integrações essenciais (o que funciona sem consentimento). */
export function integracoesEssenciais() {
  return INTEGRACOES_TERCEIROS.filter((item) => item.essencial === true);
}

/** Integrações opcionais, acionadas por uso (não em segundo plano). */
export function integracoesOpcionais() {
  return INTEGRACOES_TERCEIROS.filter((item) => item.essencial !== true);
}
