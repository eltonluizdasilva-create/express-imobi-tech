/**
 * conteudoLegal.js — texto único dos documentos legais do Express Imobi Tech.
 * ============================================================================
 * Roteado por `src/pages/legal/PaginaLegal.jsx` e consumido por
 * `/termos`, `/privacidade` e `/reembolso`.
 *
 * Regras de redação (checklist de conformidade, D-22.04):
 *   - português do Brasil, frase curta, sem "juridiquês" desnecessário;
 *   - nenhuma promessa absoluta (resultado, prazo de venda, "100% seguro");
 *   - nenhum número inventado: preço e módulo vêm de `shared/planos.json`
 *     (via `src/lib/planos.js`); contato vem de `src/lib/appUrl.js`;
 *   - a página é informativa: não substitui contrato nem orientação jurídica.
 *
 * Ao mudar o TEXTO de um documento, atualize `ATUALIZADO_EM` — a data é a
 * referência que o usuário vê no topo e no rodapé da página.
 * ============================================================================
 */

import { EMAIL_INSTITUCIONAL, SITE_INSTITUCIONAL } from '../../lib/appUrl';
import { WHATSAPP_COMERCIAL } from '../../lib/planos';

/** Telefone formatado a partir da fonte única (sem duplicar o número). */
function formatarWhatsapp(numero) {
  const digitos = String(numero || '').replace(/\D/g, '');
  const local = digitos.startsWith('55') ? digitos.slice(2) : digitos;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  return digitos;
}

export const EMPRESA = Object.freeze({
  nome: 'Express Tech',
  produto: 'Express Imobi Tech',
  descricao:
    'Plataforma de gestão, CRM e atendimento com agentes de inteligência artificial para imobiliárias e corretores.',
  local: 'Araguari e Uberlândia — Triângulo Mineiro / MG',
  atuacao: 'Atendimento digital em todo o Brasil',
  email: EMAIL_INSTITUCIONAL,
  whatsapp: String(WHATSAPP_COMERCIAL || ''),
  whatsappExibicao: formatarWhatsapp(WHATSAPP_COMERCIAL),
  site: SITE_INSTITUCIONAL,
});

export const ATUALIZADO_EM = '22 de novembro de 2026';

/** Link de e-mail já com o assunto que identifica o pedido de titular. */
export const EMAIL_EXCLUSAO = `mailto:${EMAIL_INSTITUCIONAL}?subject=${encodeURIComponent(
  'LGPD - Exclusão de dados'
)}`;

export const EMAIL_PRIVACIDADE = `mailto:${EMAIL_INSTITUCIONAL}?subject=${encodeURIComponent(
  'LGPD - Solicitação do titular'
)}`;

export const EMAIL_REEMBOLSO = `mailto:${EMAIL_INSTITUCIONAL}?subject=${encodeURIComponent(
  'Reembolso - assinatura Express Imobi Tech'
)}`;

/* ========================================================================== */
/* TERMOS DE USO                                                              */
/* ========================================================================== */

const TERMOS = {
  slug: 'termos',
  titulo: 'Termos de Uso',
  resumo:
    'As regras para usar o Express Imobi Tech: o que o sistema faz, o que esperamos de quem usa, como funcionam planos e teste, e como encerrar a conta.',
  secoes: [
    {
      id: 'quem-somos',
      titulo: '1. Quem oferece a plataforma',
      paragrafos: [
        'O Express Imobi Tech é um produto da Express Tech. O contato oficial é o e-mail institucional informado no rodapé desta página e no rodapé do painel.',
        'Estes Termos valem para a versão web do produto, para o portal público de imóveis e para as integrações que a imobiliária conectar à própria conta (por exemplo, WhatsApp e portais de anúncio).',
      ],
    },
    {
      id: 'aceitacao',
      titulo: '2. Aceitação e quem pode usar',
      paragrafos: [
        'Ao criar a conta, contratar um plano ou usar o sistema, você concorda com estes Termos e com a Política de Privacidade. Se não concordar, não use a plataforma.',
        'A conta é destinada a maiores de 18 anos que atuem como titular, sócio, gestor ou corretor autorizado da imobiliária cadastrada. Ao aceitar, você declara ter poderes para representar essa imobiliária.',
      ],
    },
    {
      id: 'o-que-e',
      titulo: '3. O que a plataforma faz — e o que ela não faz',
      paragrafos: [
        'O Express Imobi Tech organiza a operação imobiliária: carteira de imóveis, leads, funil de vendas, visitas, propostas, financeiro, portal público e assistentes de inteligência artificial que apoiam o atendimento.',
        'O sistema é uma ferramenta de apoio operacional. Ele não substitui a análise do corretor, do advogado, do contador ou de qualquer profissional habilitado, e não emite parecer jurídico, contábil, laudo de avaliação ou aprovação de crédito.',
        'Textos produzidos por inteligência artificial são rascunhos: podem conter erro, omissão ou informação desatualizada e precisam de conferência humana antes de qualquer uso com o cliente final.',
        'O sistema não garante venda, captação, aprovação de crédito, posição em portal de anúncios nem qualquer resultado comercial.',
      ],
    },
    {
      id: 'conta',
      titulo: '4. Conta, equipe e segurança do acesso',
      paragrafos: [
        'Você é responsável pelas credenciais da conta e por quem convida para a equipe. Cada pessoa deve usar o próprio acesso; não compartilhe senha de administrador.',
        'Percebeu acesso indevido ou perda de senha? Troque a senha e avise pelo e-mail institucional imediatamente. Podemos suspender o acesso enquanto a situação é verificada.',
        'As permissões de cada usuário são definidas pela imobiliária. O sistema aplica as restrições de papel, mas a decisão sobre quem vê o quê é da imobiliária.',
      ],
    },
    {
      id: 'dados-clientes',
      titulo: '5. Dados dos clientes da imobiliária',
      paragrafos: [
        'Os dados de clientes, imóveis, propostas e contratos que a imobiliária cadastra pertencem à imobiliária. Em relação a esses dados, a imobiliária atua como controladora e a Express Tech atua como operadora, seguindo as instruções da conta.',
        'A imobiliária é responsável por ter base legal para tratar esses dados, por informar seus clientes e por atender pedidos de titular. O detalhamento está na Política de Privacidade.',
      ],
    },
    {
      id: 'planos',
      titulo: '6. Planos, teste de 10 dias e cobrança',
      paragrafos: [
        'A conta começa com 10 dias de teste completo, sem cartão. Durante o teste ficam liberados os módulos PRO e os Agentes Operacionais. Encerrado o período sem assinatura ativa, os módulos PRO exigem o Plano PRO e os módulos exclusivos exigem o PLUS; CRM e agenda continuam no plano gratuito.',
        'Os preços vigentes, os módulos de cada plano e os limites estão sempre na tela Meu Plano e no checkout, que leem a tabela oficial de planos. Em caso de divergência entre texto de campanha e essa tabela, vale a tabela do checkout.',
        'A cobrança é feita pelo processador de pagamentos contratado e indicado no checkout. A renovação é automática no ciclo escolhido (mensal ou anual) até que você cancele.',
        'Reajuste de preço é comunicado com antecedência na própria plataforma antes de valer para a próxima renovação.',
      ],
    },
    {
      id: 'uso-aceitavel',
      titulo: '7. Uso aceitável',
      paragrafos: [
        'A conta é de uso da imobiliária cadastrada. Ao usar o sistema, você se compromete a não:',
      ],
      itens: [
        'enviar mensagem em massa ou prospecção sem consentimento e sem identificação, respeitando o pedido de descadastro no mesmo dia;',
        'cadastrar dados de terceiros sem base legal, obtidos de vazamento ou de área restrita de outro sistema;',
        'tentar acessar dados de outra imobiliária, burlar limites de plano, contornar autenticação ou extrair a base por meio automatizado;',
        'usar o sistema para conteúdo ilícito, discriminatório ou que viole direito de terceiro;',
        'revender, sublicenciar ou disponibilizar o acesso a quem não faz parte da equipe cadastrada.',
      ],
    },
    {
      id: 'propriedade',
      titulo: '8. Propriedade intelectual',
      paragrafos: [
        'O software, a marca, os textos do produto e os modelos de prompt são da Express Tech. O contrato dá à imobiliária uma licença de uso, não a propriedade do sistema.',
        'O conteúdo que a imobiliária cadastra (imóveis, fotos, textos, dados de clientes) continua sendo dela. A imobiliária concede apenas a licença técnica necessária para o sistema armazenar, exibir no portal público e processar esse conteúdo em nome dela.',
      ],
    },
    {
      id: 'disponibilidade',
      titulo: '9. Disponibilidade, suporte e mudanças',
      paragrafos: [
        'Trabalhamos para manter o serviço disponível, com manutenções programadas e correções. Não há garantia de disponibilidade ininterrupta: provedores de nuvem, de WhatsApp e de inteligência artificial podem falhar ou mudar de política.',
        'O suporte é prestado pelo e-mail institucional e pelo WhatsApp comercial, em horário comercial, de segunda a sexta. O prazo de retorno depende da complexidade do chamado.',
        'Funcionalidades podem ser ajustadas, substituídas ou descontinuadas. Mudança que afete módulo contratado é comunicada antes de valer.',
      ],
    },
    {
      id: 'responsabilidade',
      titulo: '10. Limitação de responsabilidade',
      paragrafos: [
        'A Express Tech responde pelos serviços que presta, nos limites da lei aplicável. Não responde por decisão comercial tomada pela imobiliária, por informação cadastrada de forma incorreta, por uso do sistema fora das orientações do produto nem por indisponibilidade causada por terceiro.',
        'O cliente final atendido pelos agentes de IA é cliente da imobiliária. A conferência de valores, disponibilidade de imóvel e condições de negócio é sempre da imobiliária.',
      ],
    },
    {
      id: 'encerramento',
      titulo: '11. Suspensão e encerramento',
      paragrafos: [
        'A conta pode ser suspensa por inadimplência, por uso que viole estes Termos ou por determinação legal, com aviso na plataforma ou no e-mail cadastrado quando possível.',
        'Você pode cancelar a assinatura e encerrar a conta a qualquer momento na tela Meu Plano ou pelo e-mail institucional. O encerramento não gera multa. Os dados podem ser exportados antes do fechamento e a exclusão pode ser solicitada pelo canal indicado na Política de Privacidade.',
      ],
    },
    {
      id: 'alteracoes',
      titulo: '12. Alterações destes Termos',
      paragrafos: [
        'Estes Termos podem ser atualizados para refletir mudança no produto, na lei ou na operação. A data de atualização aparece no topo do documento.',
        'Mudança relevante é avisada na plataforma ou por e-mail antes de entrar em vigor. Continuar usando depois do aviso significa concordar com a versão nova.',
      ],
    },
    {
      id: 'contato',
      titulo: '13. Contato e legislação aplicável',
      paragrafos: [
        'Dúvida sobre estes Termos, cobrança ou cancelamento: fale pelo e-mail institucional informado no rodapé. Guarde o número do chamado para acompanhar.',
        'Estes Termos são regidos pela legislação brasileira. Antes de qualquer medida formal, as partes buscam solução pelo contato direto.',
      ],
    },
  ],
};

/* ========================================================================== */
/* POLÍTICA DE PRIVACIDADE                                                    */
/* ========================================================================== */

const PRIVACIDADE = {
  slug: 'privacidade',
  titulo: 'Política de Privacidade',
  resumo:
    'Quais dados o Express Imobi Tech trata, para quê, com quem compartilha, por quanto tempo guarda e como você pede acesso, correção ou exclusão.',
  secoes: [
    {
      id: 'resumo',
      titulo: '1. Resumo em linguagem simples',
      itens: [
        'Coletamos o mínimo para a conta funcionar: dados de cadastro, dados da operação da imobiliária e o que o visitante digita no portal público.',
        'Não vendemos dados e não usamos a base de clientes da imobiliária para publicidade.',
        'Hoje não há pixel, analytics ou script de terceiros ativo. Se isso mudar, roda apenas com o seu consentimento.',
        'Para pedir acesso, correção ou exclusão, escreva para o e-mail institucional com o assunto "LGPD - Exclusão de dados".',
      ],
    },
    {
      id: 'papeis',
      titulo: '2. Quem é responsável por cada dado',
      paragrafos: [
        'Em relação aos dados de clientes, imóveis, propostas e negócios cadastrados na conta, a imobiliária é a controladora e a Express Tech é operadora: tratamos esses dados para prestar o serviço, seguindo as instruções da conta.',
        'Em relação aos dados de cadastro da conta, de cobrança e de navegação da plataforma, a Express Tech é controladora.',
        'No portal público de imóveis, o visitante envia nome e WhatsApp diretamente para a imobiliária responsável pelos anúncios. A plataforma apenas registra esse contato no CRM dela.',
      ],
    },
    {
      id: 'dados',
      titulo: '3. Quais dados são tratados',
      paragrafos: ['A coleta é limitada ao necessário para cada finalidade:'],
      itens: [
        'Cadastro da conta: nome da imobiliária, e-mail, WhatsApp, cidade e senha. Nome do responsável é opcional.',
        'Operação da imobiliária: imóveis (código, tipo, bairro, valor, fotos), leads (nome, telefone, interesse, orçamento, anotações), visitas, propostas, lançamentos financeiros e dados fiscais da própria empresa.',
        'Portal público: nome e WhatsApp digitados pelo visitante que quer falar com a imobiliária, além do código ou documento usado na consulta.',
        'Registros técnicos: data e hora de acesso, endereço IP, tipo de navegador e eventos de erro, usados para segurança e estabilidade.',
        'Armazenamento local no navegador: tema escolhido, preferência de cookies, contador de mensagens de demonstração e o último nome/telefone informado no portal, para não pedir duas vezes.',
      ],
    },
    {
      id: 'finalidades',
      titulo: '4. Para que usamos e com qual base legal',
      itens: [
        'Executar o contrato: criar e manter a conta, exibir o painel, entregar o portal público, processar cobrança e prestar suporte.',
        'Cumprir obrigação legal ou regulatória: guarda de documento fiscal, atendimento a autoridade competente e registro de acesso.',
        'Legítimo interesse: segurança da plataforma, prevenção a fraude e abuso, melhoria do produto a partir de uso agregado.',
        'Consentimento: cookies e scripts de análise, quando existirem, e comunicações comerciais opcionais. O consentimento pode ser retirado a qualquer momento.',
      ],
    },
    {
      id: 'cookies',
      titulo: '5. Cookies, armazenamento local e rastreamento',
      paragrafos: [
        'Cookies e armazenamento local estritamente necessários mantêm a sessão autenticada, o tema do painel e o contador de demonstração. Sem eles a plataforma não funciona e, por isso, não dependem de consentimento.',
        'Cookies de análise, publicidade ou qualquer script de terceiro são opcionais. O banner de privacidade registra a sua escolha e pode ser reaberto pelo link "Preferências de cookies" no rodapé.',
        'Hoje o produto não carrega Google Analytics, Meta Pixel, Clarity ou equivalente. Se algum for adicionado, ele só será carregado quando o registro de consentimento permitir análise — a decisão fica gravada no navegador, com data e versão do aviso.',
        'O portal público pode carregar imagens hospedadas em serviço externo e o botão de contato abre o WhatsApp. Ao clicar, você passa a estar sujeito à política do serviço de destino.',
      ],
    },
    {
      id: 'compartilhamento',
      titulo: '6. Com quem compartilhamos',
      paragrafos: [
        'Não vendemos, alugamos nem cedemos dados para publicidade. O compartilhamento acontece apenas para operar o serviço:',
      ],
      itens: [
        'Provedor de nuvem e banco de dados (Google Firebase / Google Cloud), que hospeda a aplicação e o armazenamento.',
        'Processador de pagamentos contratado, para emitir cobrança e confirmar pagamento. Os dados de cartão são tratados por ele, não pela plataforma.',
        'WhatsApp / Meta, quando a imobiliária conecta o número dela para atendimento; e provedores de inteligência artificial, acionados por servidor intermediário para gerar respostas — a chave de API não passa pelo navegador.',
        'Portais de anúncio (ZAP, VivaReal, OLX e equivalentes), quando a própria imobiliária decide publicar o catálogo por integração.',
        'Autoridade pública, quando houver requisição legal fundamentada.',
      ],
    },
    {
      id: 'transferencia',
      titulo: '7. Transferência internacional',
      paragrafos: [
        'Os provedores de nuvem e de inteligência artificial podem processar dados fora do Brasil. Nesses casos, a transferência segue a LGPD e as cláusulas contratuais de proteção de dados do próprio provedor.',
      ],
    },
    {
      id: 'retencao',
      titulo: '8. Por quanto tempo guardamos',
      paragrafos: [
        'Dados de conta e de operação ficam armazenados enquanto a conta estiver ativa. Depois do encerramento, são excluídos ou anonimizados após o pedido do titular, ressalvado o que a lei obriga a manter.',
        'Documento fiscal e registro de acesso podem ser mantidos pelo prazo legal aplicável, ainda que a conta seja encerrada.',
        'Registros de erro e segurança são mantidos pelo tempo necessário à investigação e à proteção da plataforma.',
      ],
    },
    {
      id: 'direitos',
      titulo: '9. Seus direitos como titular',
      paragrafos: [
        'A LGPD (Lei 13.709/2018, art. 18) assegura ao titular, entre outros:',
      ],
      itens: [
        'confirmação de que existe tratamento e acesso aos dados;',
        'correção de dado incompleto, inexato ou desatualizado;',
        'anonimização, bloqueio ou eliminação de dado desnecessário, excessivo ou tratado em desconformidade;',
        'portabilidade a outro fornecedor, mediante requisição;',
        'informação sobre compartilhamento;',
        'revogação do consentimento, quando a base legal for consentimento.',
      ],
    },
    {
      id: 'exclusao',
      titulo: '10. Como solicitar exclusão dos seus dados',
      paragrafos: [
        'Cliente da imobiliária (lead, visitante do portal, locatário, comprador): o pedido pode ser feito diretamente à imobiliária com quem você falou — ela é a controladora desses dados. Se preferir, escreva para o e-mail institucional e encaminharemos o pedido à imobiliária responsável.',
        'Titular de conta da plataforma: envie o pedido pelo e-mail institucional com o assunto "LGPD - Exclusão de dados", informando o e-mail cadastrado. Confirmamos o recebimento e informamos o prazo de atendimento no primeiro retorno.',
        'A exclusão pode ser parcial: é possível apagar apenas os dados de clientes da operação, mantendo a conta ativa, ou encerrar a conta inteira.',
        'Alguns registros podem permanecer bloqueados pelo prazo legal (por exemplo, documento fiscal), sem uso para outra finalidade.',
      ],
    },
    {
      id: 'seguranca',
      titulo: '11. Segurança da informação',
      paragrafos: [
        'O acesso ao painel exige autenticação e cada conta opera isolada por imobiliária; as consultas são filtradas pelo identificador da organização.',
        'O tráfego do painel usa HTTPS e o banco de dados é hospedado no Google Cloud, que aplica criptografia em repouso. Nenhum sistema é imune a incidente: se houver incidente relevante, comunicamos os titulares e a ANPD conforme a LGPD.',
        'Não envie senha, código de verificação ou dado bancário por chat, e-mail ou WhatsApp. A equipe da Express Tech não pede esses dados.',
      ],
    },
    {
      id: 'menores',
      titulo: '12. Crianças e adolescentes',
      paragrafos: [
        'A plataforma é destinada a uso profissional por maiores de 18 anos e não é direcionada a crianças ou adolescentes. Se identificarmos cadastro nessa condição, a conta será encerrada.',
      ],
    },
    {
      id: 'alteracoes',
      titulo: '13. Alterações desta Política',
      paragrafos: [
        'Esta Política pode ser atualizada para refletir mudança no produto, em fornecedor ou na lei. A data de atualização aparece no topo da página.',
        'Mudança que amplie a coleta ou o compartilhamento é avisada antes de valer, e o consentimento é pedido de novo quando a base legal for consentimento.',
      ],
    },
    {
      id: 'contato',
      titulo: '14. Contato e encarregado de dados',
      paragrafos: [
        'Canal único para assunto de privacidade: o e-mail institucional informado no rodapé. O pedido é recebido pelo encarregado de proteção de dados (DPO) da Express Tech.',
        'Para agilizar, informe no e-mail: nome, e-mail ou telefone usado no cadastro, qual direito deseja exercer e, se for sobre um cliente da imobiliária, o nome da imobiliária envolvida.',
      ],
    },
  ],
};

/* ========================================================================== */
/* POLÍTICA DE REEMBOLSO                                                      */
/* ========================================================================== */

const REEMBOLSO = {
  slug: 'reembolso',
  titulo: 'Política de Reembolso',
  resumo:
    'Quando há reembolso, como pedir, em quanto tempo o valor volta e o que acontece com o teste de 10 dias, com o plano anual e com a implantação.',
  secoes: [
    {
      id: 'abrangencia',
      titulo: '1. A que esta política se aplica',
      paragrafos: [
        'Esta política vale para as assinaturas dos planos do Express Imobi Tech cobradas pelo checkout da plataforma e para as contratações de implantação feitas com a equipe comercial.',
        'Ela não altera direitos previstos no Código de Defesa do Consumidor (Lei 8.078/1990).',
      ],
    },
    {
      id: 'teste',
      titulo: '2. Teste de 10 dias',
      paragrafos: [
        'O teste de 10 dias é gratuito e não pede cartão no cadastro. Não existe cobrança automática ao final do teste: sem assinatura ativa, a conta continua no plano gratuito e as frentes que exigem PRO ficam bloqueadas.',
        'Se você assinar durante o teste, a cobrança passa a valer a partir da contratação, no ciclo escolhido.',
      ],
    },
    {
      id: 'arrependimento',
      titulo: '3. Direito de arrependimento (7 dias)',
      paragrafos: [
        'Na contratação feita fora do estabelecimento comercial — como é o caso da assinatura pela internet —, o Código de Defesa do Consumidor (art. 49) garante 7 dias corridos, contados do pagamento, para desistir com devolução integral do valor pago.',
        'Para exercer, basta enviar o pedido dentro desse prazo pelo e-mail de reembolso informado no rodapé. Não é necessário justificar a desistência.',
      ],
    },
    {
      id: 'cancelamento',
      titulo: '4. Cancelamento sem multa',
      paragrafos: [
        'A assinatura pode ser cancelada a qualquer momento na tela Meu Plano ou pelo e-mail institucional. Não há multa nem fidelidade.',
        'No cancelamento comum, o acesso permanece até o fim do período já pago e não há cobrança na renovação seguinte. O valor do período em uso não é devolvido, salvo nas hipóteses desta política.',
      ],
    },
    {
      id: 'quando-ha-reembolso',
      titulo: '5. Quando há reembolso',
      paragrafos: ['Além do direito de arrependimento, analisamos caso a caso:'],
      itens: [
        'cobrança em duplicidade ou cobrança depois do cancelamento solicitado;',
        'falha de ativação que impeça o uso do módulo contratado e não seja resolvida pelo suporte;',
        'indisponibilidade relevante e prolongada do serviço contratado, comprovada pelos registros da plataforma;',
        'cobrança de plano diferente do escolhido no checkout.',
      ],
    },
    {
      id: 'como-solicitar',
      titulo: '6. Como pedir o reembolso',
      paragrafos: [
        'Envie um e-mail para o endereço de reembolso informado no rodapé com o assunto "Reembolso - assinatura Express Imobi Tech", incluindo: e-mail da conta, nome da imobiliária, data da cobrança, valor e comprovante ou identificador da transação.',
        'Confirmamos o recebimento e informamos a análise no primeiro retorno. Pedido de arrependimento dentro dos 7 dias é aprovado sem necessidade de justificativa.',
      ],
    },
    {
      id: 'forma-estorno',
      titulo: '7. Como o valor volta',
      paragrafos: [
        'O estorno é feito na mesma forma de pagamento usada na compra. O prazo para o valor aparecer na sua conta é definido pela instituição financeira, operadora do cartão ou instituição de pagamento — não conseguimos encurtar esse prazo por fora.',
        'Quando o meio de pagamento não permite estorno, combinamos outra forma com você por escrito.',
      ],
    },
    {
      id: 'implantacao',
      titulo: '8. Implantação dos módulos de IA (Pólen e Tom)',
      paragrafos: [
        'A taxa de implantação e as horas assistidas dos módulos de inteligência artificial (Pólen, Tom Autônomo e Tom Imobiliária) remuneram trabalho já executado: configuração, conexão do WhatsApp e treinamento da equipe.',
        'Pedido de reembolso desses valores é avaliado conforme o que já foi executado e o que estiver escrito na proposta aceita, sem prejuízo do direito de arrependimento nos 7 dias quando aplicável.',
      ],
    },
    {
      id: 'anuais',
      titulo: '9. Plano anual',
      paragrafos: [
        'No plano anual, o direito de arrependimento dos 7 dias devolve o valor integral. Depois desse prazo, o cancelamento interrompe a renovação seguinte, e um reembolso proporcional aos meses não utilizados pode ser analisado caso a caso, conforme o motivo do pedido.',
      ],
    },
    {
      id: 'contato',
      titulo: '10. Contato',
      paragrafos: [
        'Dúvida sobre cobrança, estorno ou esta política: use o e-mail de reembolso ou o WhatsApp comercial informados no rodapé desta página.',
      ],
    },
  ],
};

export const DOCUMENTOS = Object.freeze({
  termos: TERMOS,
  privacidade: PRIVACIDADE,
  reembolso: REEMBOLSO,
});

/** Ordem exibida na navegação entre documentos. */
export const ORDEM_DOCUMENTOS = Object.freeze([
  { slug: 'termos', titulo: 'Termos de Uso', rota: '/termos' },
  { slug: 'privacidade', titulo: 'Política de Privacidade', rota: '/privacidade' },
  { slug: 'reembolso', titulo: 'Política de Reembolso', rota: '/reembolso' },
]);
