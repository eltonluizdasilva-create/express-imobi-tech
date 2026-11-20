/**
 * BASE DE CONHECIMENTO ESTRUTURADA
 * Express Imobi Tech - Sistema de Gestão Inteligente para Imobiliárias e Corretores
 *
 * ARQUITETURA:
 * - Organizado por módulos principais do ecossistema imobiliário
 * - Cada módulo possui contexto estratégico + exemplos de perguntas
 * - Sistema de tags para busca RAG (Retrieval-Augmented Generation)
 *
 * USO: Importar em useOficinaBD.js para seleção inteligente de contexto
 */

export const CONHECIMENTO_OFICINA_IA = {
    // ═══════════════════════════════════════════════════════════════
    // INFORMAÇÕES GERAIS DO SISTEMA
    // ═══════════════════════════════════════════════════════════════
    SISTEMA: {
        nome: "Express Imobi Tech",
        tagline: "Plataforma Inteligente de VGV, CRM e Automação para Imobiliárias e Corretores",
        pilar_estrategico: "Transformar leads imobiliários em visitas confirmadas, propostas fechadas e VGV recorrente",
        slogan_ia: "Cada lead qualificado e imóvel captado se torna uma oportunidade real de comissão",
        features_principais: [
            "Painel Executivo & Visão Geral (Monitoramento de VGV e Comissões em Tempo Real)",
            "Funil de Leads & CRM Imobiliário com Roleta de Distribuição Justa",
            "Captação & Catálogo de Imóveis com Ficha Rápida para WhatsApp",
            "Vistoria Imobiliária & Laudo Fotográfico com IA",
            "Esquadrão de 7 Agentes IA (Sofia Triagem, Hermes Copiloto, Téo Visitas)",
        ],
    },

    // ═══════════════════════════════════════════════════════════════
    // ABAS DO MENU DE GESTÃO (Painel Executivo & Operação)
    // ═══════════════════════════════════════════════════════════════
    ABAS_GESTAO: {
        VISAO_GERAL: {
            nome: "Visão Geral — Painel Executivo",
            icone: "📊",
            descricao:
                "Central executiva da imobiliária e do corretor. Exibe VGV em carteira, comissão prevista (6%), leads ativos no funil, visitas agendadas e evolução de demanda.",
            modulos_ativos: ["VGV em Carteira", "Comissão Prevista (6%)", "Funil CRM", "Agenda de Visitas"],
            exemplos_perguntas: [
                "Como aumentar meu VGV em carteira?",
                "Como é calculada a comissão prevista de 6%?",
                "Qual é minha projeção de fechamento para os próximos 30 dias?",
                "Quantos imóveis e leads preciso para atingir minha meta de VGV?",
            ],
            tags: ["vgv", "faturamento", "dashboard", "visão geral", "painel executivo", "comissão", "kpi"],
        },

        ESTOQUE: {
            nome: "Captação & Carteira de Imóveis",
            icone: "🏠",
            descricao:
                "Gestão do catálogo de imóveis para venda e locação (apartamentos, casas, coberturas, terrenos e salas comerciais) com código de referência e disparo de ficha no WhatsApp.",
            funcionalidades: [
                "Cadastro rápido de imóveis com código IMB automático",
                "Classificação por finalidade (Venda ou Locação) e tipologia",
                "Filtro por bairro, faixa de valor e número de quartos",
                "Cálculo automático de VGV da carteira e comissão estimada",
                "Agendamento direto de visita a partir do card do imóvel",
            ],
            insights_ia: [
                "Identifica os bairros e faixas de preço com maior procura pelos leads",
                "Cruza automaticamente imóveis captados com o orçamento dos leads no CRM",
                "Sugere ajustes de posicionamento para imóveis sem visitas agendadas",
            ],
            exemplos_perguntas: [
                "Como captar e cadastrar um novo imóvel?",
                "Qual o VGV total dos meus imóveis captados?",
                "Quais tipos de imóveis têm maior liquidez na carteira?",
            ],
            tags: ["imóveis", "captação", "carteira", "catálogo", "venda", "locação", "estoque"],
        },

        FINANCEIRO: {
            nome: "Financeiro & Gestão de VGV",
            icone: "💰",
            descricao:
                "Controle completo de comissões de venda, taxas de administração de locação, repasses a corretores parceiros, despesas de tráfego pago e projeção de lucro líquido.",
            modulos: {
                COMISSOES_A_RECEBER: {
                    descricao: "Rastreamento de comissões de intermediação (5% a 6%) e taxas de locação",
                    funcionalidades: [
                        "Lançamento de comissões sobre VGV fechado",
                        "Controle de sinal/arras e parcelas de comissão",
                        "Histórico por meio de pagamento (PIX, Transferência, Boleto)",
                        "Resumo financeiro pronto para envio no WhatsApp",
                    ],
                },
                DESPESAS_E_REPASSES: {
                    descricao: "Gestão de custos operacionais da imobiliária e repasses de parceria",
                    funcionalidades: [
                        "Controle de investimentos em portais (ZAP, VivaReal, OLX) e Meta Ads",
                        "Provisão de equipe administrativa e ajuda de custo",
                        "Repasse de comissões para corretores e captadores",
                    ],
                },
                FORECAST_INTELIGENTE: {
                    descricao:
                        "⭐ FEATURE-CHAVE: Projeção de comissões e VGV com base nos leads em fase de Visita Agendada e Proposta.",
                    como_funciona:
                        "IA analisa: VGV no funil CRM, taxa de conversão histórica, imóveis em negociação e sazonalidade do mercado imobiliário.",
                    beneficio:
                        "Permite prever entradas de comissões e planejar investimentos em tráfego pago com segurança.",
                    exemplo:
                        "Com R$ 3.000.000 de VGV em fase de proposta e conversão média de 25%, a comissão projetada (6%) supera R$ 45.000 no período.",
                },
                MARGEM_DE_CONTRIBUICAO: {
                    descricao: "Análise de resultado líquido por operação imobiliária",
                    como_calcular:
                        "Comissão Bruta Recebida - (Repasse Corretor/Captador + Impostos + Custo de Aquisição do Lead)",
                },
            },
            exemplos_perguntas: [
                "Como lançar uma comissão de venda ou despesa?",
                "Qual é meu lucro líquido após despesas e provisões?",
                "Como calcular o repasse do corretor e do captador?",
            ],
            tags: ["financeiro", "vgv", "comissão", "fluxo de caixa", "lucro", "repasse", "despesa"],
        },

        CLIENTES: {
            nome: "Funil de Leads & CRM Imobiliário",
            icone: "👥",
            descricao:
                "CRM Kanban especializado no mercado imobiliário (Novo Lead, Qualificado IA, Visita Agendada, Proposta / Fechamento) com Roleta de Distribuição Justa.",
            funcionalidades: [
                "Cadastro rápido de compradores, locatários e proprietários",
                "Qualificação por interesse (Compra/Locação), bairro desejado e orçamento",
                "Cálculo imediato do VGV do lead e comissão potencial (6%)",
                "Roleta de Leads automática (Round-Robin equilibrado por carga)",
                "Importação inteligente de listas de contatos com IA",
            ],
            insights_ia: [
                "Prioriza leads quentes com orçamento compatível com a carteira atual",
                "Sugere abordagem personalizada no WhatsApp para agendar visita",
                "Identifica leads estagnados há mais de 15 dias para reativação automática",
            ],
            exemplos_perguntas: [
                "Como cadastrar um novo lead no funil CRM?",
                "Como funciona a Roleta de Leads entre os corretores?",
                "Como converter mais leads em visitas presenciais?",
            ],
            tags: ["clientes", "leads", "crm", "funil", "roleta", "visitas", "proposta"],
        },

        RETORNO: {
            nome: "Reativação Preditiva de Leads & Renovação de Contratos",
            icone: "📅",
            descricao:
                "Inteligência comercial que monitora leads que visitaram imóveis e não fecharam, além de contratos de locação próximos da renovação ou reajuste anual.",
            regras_preditivas: {
                pos_visita: "Follow-up estratégico em 7 e 15 dias após a visita ao imóvel",
                reativacao_base: "Oferta de novas captações ou queda de preço após 30 dias",
                renovacao_locacao: "Alerta preventivo 60 dias antes do vencimento do contrato de aluguel",
                acao: "Disparo em 1 clique via WhatsApp com mensagem consultiva personalizada.",
            },
            lucro_real: {
                descricao: "Recuperação de CAC (Custo de Aquisição de Cliente) já investido em tráfego pago.",
                diagnostico: "Transforma leads adormecidos da base em novas propostas sem custo extra de anúncio.",
            },
            exemplos_perguntas: [
                "Como reativar leads antigos que pararam de responder?",
                "Como acompanhar renovações de locação?",
            ],
            tags: ["retorno", "reativação", "follow-up", "renovação", "locação"],
        },

        TAREFA: {
            nome: "Vistoria Imobiliária & Tarefas Rápidas",
            icone: "📸",
            descricao:
                "Módulo completo de Vistoria Imobiliária com Laudo Fotográfico gerado por IA (Entrada, Saída, Entrega de Chaves, Captação) e criação rápida de compromissos em 1 clique.",
            funcionalidades: [
                "Criação rápida de tarefas imobiliárias com 1 clique pelo botão flutuante",
                "Inspeção fotográfica por divisão do imóvel (Sala, Cozinha, Quartos, W.C., Exterior)",
                "Observações rápidas de estado de conservação e geração de minuta de laudo com IA",
                "Impressão de PDF e envio direto do resumo no WhatsApp",
            ],
            beneficio:
                "Garante segurança documental nas locações e entregas de chaves com agilidade em campo.",
            exemplos_perguntas: [
                "Como criar uma tarefa rápida com 1 clique?",
                "Como gerar um laudo de vistoria imobiliária com fotos e IA?",
                "Como exportar ou imprimir o laudo de vistoria?",
            ],
            tags: ["tarefa", "vistoria", "laudo", "chaves", "compromissos", "agenda"],
        },

        NOTA_FISCAL: {
            nome: "Recibos de Comissão & Simulador de Custos",
            icone: "📄",
            descricao:
                "Emissão de recibos de corretagem, controle de repasses e orientação tributária para corretores autônomos (CPF/ Carnê-Leão) e imobiliárias (CNPJ / Simples Nacional).",
            funcionalidades: [
                "Gerador de recibos de comissão e sinal de negócio",
                "Controle de notas fiscais de serviço de corretagem (NFS-e)",
                "Simulação de carga tributária (Pessoa Física vs. PJ Imobiliária)",
            ],
            assistente_fiscal: {
                nome: "Simulador de Custos Imobiliário",
                descricao:
                    "Apoio informativo para organização contábil de comissões, DIMOB e redução legal de impostos.",
                funcionalidades: [
                    "Comparativo tributário PF (até 27,5%) vs. PJ no Simples Nacional (Anexo III a partir de 6%)",
                    "Boas práticas para divisão de comissão entre corretor e imobiliária (Lei do Corretor Associado)",
                    "Organização de comprovantes para declaração anual e DIMOB",
                ],
            },
            exemplos_perguntas: [
                "Vale a pena abrir CNPJ para receber comissões imobiliárias?",
                "Como emitir um recibo de comissão?",
                "Como funciona a tributação no Simples Nacional para corretores?",
            ],
            tags: ["nota fiscal", "fiscal", "recibo", "comissão", "imposto", "creci", "cnpj"],
        },

        ESPECIALISTA: {
            nome: "🚀 Especialista IA Imobiliário (Mentor de VGV & Conversão)",
            icone: "🤖",
            descricao:
                "Seu consultor estratégico 24h focado em alta performance imobiliária: crescimento de VGV, qualificação de leads, financiamento habitacional (SAC, Price, MCMV, SBPE) e fechamento de propostas.",
            funcionalidades: [
                "Estratégia de VGV: Analisa seu funil de leads e carteira de imóveis para destravar negociações.",
                "Mentoria Comercial: Scripts de abordagem no WhatsApp, contorno de objeções e agendamento de visitas.",
                "Apoio Técnico: Regras de financiamento bancário, uso de FGTS, documentação imobiliária e vistorias.",
            ],
            exemplos_perguntas: [
                "Como estruturar um script para agendar mais visitas?",
                "Qual a diferença entre SAC e Price para explicar ao meu cliente?",
                "Como aumentar minha taxa de conversão no funil CRM?",
            ],
            tags: ["especialista", "mentor", "dúvida", "inteligência", "vgv", "estratégia", "financiamento"],
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // ABAS DO MENU DE SISTEMA (Configurações & Equipe)
    // ═══════════════════════════════════════════════════════════════
    ABAS_SISTEMA: {
        AJUSTES: {
            nome: "Configurações da Imobiliária / Corretor",
            icone: "⚙️",
            descricao: "Personalização de Nome da Imobiliária/Corretor, CRECI, Endereço, WhatsApp, Logomarca e Chave PIX de Comissão.",
            configuracoes: [
                "Nome da Imobiliária ou Corretor e registro CRECI",
                "Logomarca oficial para relatórios de vistoria e propostas",
                "Chave PIX e dados bancários para recebimento de comissões",
                "Telefone/WhatsApp comercial integrado aos botões de disparo",
            ],
            exemplos_perguntas: [
                "Onde configuro meu número do CRECI e logomarca?",
                "Como cadastrar minha chave PIX de comissão?",
            ],
            tags: ["ajustes", "configuração", "creci", "pix", "logo"],
        },

        EQUIPE: {
            nome: "Corretores & Equipe",
            icone: "👔",
            descricao:
                "Gestão de corretores associados, captadores e plantonistas integrados à Roleta de Leads.",
            funcionalidades: [
                "Cadastro de corretores com WhatsApp direto",
                "Definição de perfil de acesso (Gestor/Admin, Corretor, Captador, Secretaria)",
                "Sincronização automática com a Roleta de Distribuição de Leads",
                "Acompanhamento de VGV e comissões por corretor",
            ],
            roles_padrao: {
                ADMIN: "Acesso total (Painel Executivo, VGV, Financeiro, Equipe e Configurações)",
                CORRETOR: "Acesso ao Funil de Leads, Agenda de Visitas, Captação e Vistoria",
                ATENDENTE: "Cadastro de leads, triagem e agendamento de visitas",
                CONSULTOR: "Visualização de indicadores e relatórios de VGV",
            },
            exemplos_perguntas: [
                "Como adicionar um novo corretor na equipe e na roleta?",
                "Como acompanhar o VGV de cada corretor?",
            ],
            tags: ["equipe", "corretores", "permissões", "plantão", "roleta"],
        },

        MARKETING: {
            nome: "Meta Ads, Criativos & Campanhas",
            icone: "📣",
            descricao:
                "Criação de anúncios persuasivos com IA para Instagram, Facebook e WhatsApp focados em captação de leads imobiliários.",
            funcionalidades: [
                "Geração de copy imobiliária de alta conversão (MCMV, Médio e Alto Padrão)",
                "Scripts de reativação de leads via WhatsApp",
                " Sugestões de segmentação para campanhas de tráfego pago",
            ],
            exemplos_perguntas: [
                "Crie um anúncio para apartamento de 2 quartos com varanda gourmet",
                "Qual a melhor mensagem para chamar leads do tráfego pago?",
            ],
            tags: ["marketing", "whatsapp", "anúncio", "campanha", "meta ads"],
        },

        AJUDA: {
            nome: "Central de Ajuda",
            icone: "❓",
            descricao:
                "Tutoriais práticos e acesso direto ao Especialista IA da Express Imobi Tech.",
            conteudo: [
                "Guia rápido de uso por módulo imobiliário",
                "Boas práticas de conversão de leads e gestão de VGV",
                "Chat interativo com Especialista IA",
            ],
            exemplos_perguntas: [
                "Como usar o Painel Executivo?",
                "Como funciona o Simulador de Financiamento no Portal do Cliente?",
            ],
            tags: ["ajuda", "tutorial", "faq", "suporte"],
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // FÓRMULAS E CÁLCULOS DO MERCADO IMOBILIÁRIO
    // ═══════════════════════════════════════════════════════════════
    FORMULAS: {
        VGV_CARTEIRA: {
            formula: "Soma do Valor dos Imóveis Captados + Orçamento dos Leads Qualificados no CRM",
            exemplo: "5 imóveis de R$ 500k + 10 leads de R$ 400k = R$ 6.500.000 de VGV movimentado",
            insight: "Manter o funil abastecido e atualizado garante previsibilidade de fechamentos todos os meses.",
        },
        COMISSAO_PREVISTA: {
            formula: "VGV Negociado × Taxa Média de Corretagem (ex: 6%)",
            exemplo: "Imóvel vendido por R$ 500.000 × 6% = R$ 30.000 de comissão bruta",
        },
        ROI_LOCACAO: {
            formula: "((Aluguel Mensal - Custos) × 12 / Valor do Imóvel) × 100",
            exemplo: "Aluguel líquido de R$ 2.500/mês num imóvel de R$ 400.000 = 7,5% ao ano + valorização patrimonial",
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // ESTRATÉGIAS DE CRESCIMENTO DE VGV
    // ═══════════════════════════════════════════════════════════════
    ESTRATEGIAS_LUCRO: [
        {
            nome: "Tempo de Resposta Abaixo de 3 Minutos",
            como: "Usar o atendimento imediato com Agentes de IA (Sofia) e a Roleta de Leads para não deixar o comprador esfriar",
            impacto: "Aumenta em até 3x a taxa de agendamento de visitas presenciais",
        },
        {
            nome: "Qualificação Financeira Antes da Visita",
            como: "Utilizar o Simulador de Financiamento com IA (SAC/Price, MCMV vs SBPE e limite de idade de 80 anos e 6 meses)",
            impacto: "Reduz visitas improdutivas e foca nos imóveis que cabem na renda aprovada do cliente",
        },
        {
            nome: "Reativação Quinzenal da Base do CRM",
            como: "Acionar leads parados com novas captações ou oportunidades de redução de valor no mesmo bairro",
            impacto: "Gera de 20% a 30% de vendas extras sem custo adicional com anúncios",
        },
    ],
};

/**
 * FUNÇÃO AUXILIAR: Buscar conhecimento por tag
 */
export function buscarPorTag(tag) {
    const resultado = [];
    const termo = String(tag || "").toLowerCase();

    Object.entries(CONHECIMENTO_OFICINA_IA.ABAS_GESTAO || {}).forEach(
        ([chave, aba]) => {
            if (aba?.tags && aba.tags.some((t) => t.toLowerCase().includes(termo))) {
                resultado.push({
                    categoria: "GESTÃO IMOBILIÁRIA",
                    chave,
                    nome: aba.nome,
                    descricao: aba.descricao,
                });
            }
        }
    );

    Object.entries(CONHECIMENTO_OFICINA_IA.ABAS_SISTEMA || {}).forEach(
        ([chave, aba]) => {
            if (aba?.tags && aba.tags.some((t) => t.toLowerCase().includes(termo))) {
                resultado.push({
                    categoria: "SISTEMA",
                    chave,
                    nome: aba.nome,
                    descricao: aba.descricao,
                });
            }
        }
    );

    return resultado;
}

/**
 * FUNÇÃO AUXILIAR: Gerar contexto por aba ativa
 */
export function gerarContextoPorAba(abaAtiva = "visao_geral") {
    const chaveNormalizada = String(abaAtiva || "visao_geral").toLowerCase();

    const contextos = {
        dashboard: () => contextos.visao_geral(),
        dashboard_imobi: () => contextos.visao_geral(),
        visao_geral: () => {
            const aba = CONHECIMENTO_OFICINA_IA.ABAS_GESTAO.VISAO_GERAL;
            return `
        ABA ATIVA: ${aba.nome}
        DESCRIÇÃO: ${aba.descricao}
        MÓDULOS: ${(aba.modulos_ativos || []).join(", ")}
        Dica Estratégica: Acompanhe o VGV em Carteira e a Comissão Prevista (6%) em tempo real.
      `;
        },
        captacao_imobi: () => contextos.estoque(),
        estoque: () => {
            const aba = CONHECIMENTO_OFICINA_IA.ABAS_GESTAO.ESTOQUE;
            return `
        ABA ATIVA: ${aba.nome}
        DESCRIÇÃO: ${aba.descricao}
        FUNCIONALIDADES:
        ${(aba.funcionalidades || []).map((f) => `  • ${f}`).join("\n")}
        INSIGHTS: ${(aba.insights_ia || []).join(" | ")}
      `;
        },
        financeiro: () => {
            const aba = CONHECIMENTO_OFICINA_IA.ABAS_GESTAO.FINANCEIRO;
            const forecast = aba.modulos.FORECAST_INTELIGENTE;
            return `
        ABA ATIVA: ${aba.nome}
        DESCRIÇÃO: ${aba.descricao}
        ⭐ DESTAQUE - PROJEÇÃO DE COMISSÕES & VGV:
        Como funciona: ${forecast.como_funciona}
        Benefício: ${forecast.beneficio}
        Exemplo: ${forecast.exemplo}
      `;
        },
        funil_leads: () => contextos.clientes(),
        leads: () => contextos.clientes(),
        clientes: () => {
            const aba = CONHECIMENTO_OFICINA_IA.ABAS_GESTAO.CLIENTES;
            return `
        ABA ATIVA: ${aba.nome}
        DESCRIÇÃO: ${aba.descricao}
        INSIGHTS DA IA:
        ${(aba.insights_ia || []).map((i) => `  • ${i}`).join("\n")}
      `;
        },
        tarefa: () => {
            const aba = CONHECIMENTO_OFICINA_IA.ABAS_GESTAO.TAREFA;
            return `
        ABA ATIVA: ${aba.nome}
        DESCRIÇÃO: ${aba.descricao}
        FUNCIONALIDADES:
        ${(aba.funcionalidades || []).map((f) => `  • ${f}`).join("\n")}
      `;
        },
        notafiscal: () => contextos.nota_fiscal(),
        nota_fiscal: () => {
            const aba = CONHECIMENTO_OFICINA_IA.ABAS_GESTAO.NOTA_FISCAL;
            return `
        ABA ATIVA: ${aba.nome}
        ASSISTENTE FISCAL IMOBILIÁRIO:
        ${(aba.assistente_fiscal?.funcionalidades || []).map((f) => `  • ${f}`).join("\n")}
      `;
        },
        retorno: () => {
            const aba = CONHECIMENTO_OFICINA_IA.ABAS_GESTAO.RETORNO;
            return `
        ABA ATIVA: ${aba.nome}
        DESCRIÇÃO: ${aba.descricao}
      `;
        },
        especialista: () => {
            const aba = CONHECIMENTO_OFICINA_IA.ABAS_GESTAO.ESPECIALISTA;
            return `
        ABA ATIVA: ${aba.nome}
        DESCRIÇÃO: ${aba.descricao}
      `;
        },
    };

    const gerador = contextos[chaveNormalizada];
    return gerador
        ? gerador()
        : `Aba ativa no ecossistema Express Imobi Tech: ${abaAtiva}. Foco em Gestão de VGV, Leads, Captação de Imóveis e Visitas.`;
}

export default CONHECIMENTO_OFICINA_IA;
