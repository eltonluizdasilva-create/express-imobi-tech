/**
 * BASE DE CONHECIMENTO ESTRUTURADA
 * Express Auto Tech - Sistema de Gestão Inteligente para Oficinas
 * 
 * ARQUITETURA:
 * - Organizado por módulos principais (não é apenas texto)
 * - Cada módulo tem contexto curto + exemplos de perguntas
 * - Sistema de tags para busca RAG (Retrieval-Augmented Generation)
 * 
 * USO: Importar em useOficinaBD.js para seleção inteligente de contexto
 */

export const CONHECIMENTO_OFICINA_IA = {
    // ═══════════════════════════════════════════════════════════════
    // INFORMAÇÕES GERAIS DO SISTEMA
    // ═══════════════════════════════════════════════════════════════
    SISTEMA: {
        nome: "Express Auto Tech",
        tagline: "Sistema de Gestão Inteligente para Oficinas",
        pilar_estrategico: "Transformar dados técnicos em lucro real e fidelização extrema",
        slogan_ia: "Cada detalhe do seu negócio se torna uma oportunidade de lucro",
        features_principais: [
            "Forecast Inteligente (Predição de Faturamento)",
            "Assistente Fiscal (Suporte Tributário)",
            "O.S. Inteligente (Precificação Estratégica)",
            "CRM de Clientes (Fidelização)",
            "Controle de Estoque com IA",
        ],
    },

    // ═══════════════════════════════════════════════════════════════
    // ABAS DO MENU DE GESTÃO (Dashboard Principal)
    // ═══════════════════════════════════════════════════════════════
    ABAS_GESTAO: {
        VISAO_GERAL: {
            nome: "Visão Geral / Home",
            icone: "📊",
            descricao:
                "Dashboard de comando central. Mostra faturamento previsto, O.S. abertas, clientes no mês, tendências de lucro.",
            modulos_ativos: ["Forecast", "KPIs do dia", "Alertas críticos"],
            exemplos_perguntas: [
                "Por que meu faturamento está zerado?",
                "Como ativar o Forecast?",
                "Qual é meu faturamento previsto para próximos 30 dias?",
                "Quantas O.S. devo abrir para faturar R$ 50k?",
            ],
            tags: ["faturamento", "dashboard", "overview", "kpi"],
        },

        ESTOQUE: {
            nome: "Estoque",
            icone: "📦",
            descricao:
                "Controle de peças com saldo mínimo, custo médio e giro. Sistema avisa quando peças de alto giro (filtros/óleo) estão acabando.",
            funcionalidades: [
                "Cadastro de peças com SKU",
                "Saldo mínimo automático",
                "Custo médio ponderado",
                "Alertas de falta de estoque",
                "Integração com O.S. (peças usadas)",
                "Relatório de giro (ABC)",
            ],
            insights_ia: [
                "Identifica peças paradas (C) que viram sucata",
                "Prediz demanda com base no histórico de O.S.",
                "Sugere aumento de saldo para peças sazonais",
            ],
            exemplos_perguntas: [
                "Qual é meu giro de estoque?",
                "Quais peças estão paradas?",
                "Como aumentar o saldo mínimo?",
                "Posso vender peças usadas com rastreabilidade?",
            ],
            tags: ["estoque", "peças", "giro", "saldo mínimo", "custo"],
        },

        FINANCEIRO: {
            nome: "Financeiro",
            icone: "💰",
            descricao:
                "Fluxo de caixa, contas a pagar/receber, análise de margem de contribuição. Módulo de IA: Forecast Inteligente.",
            modulos: {
                CONTAS_A_RECEBER: {
                    descricao: "Rastreamento de pagamentos de clientes",
                    funcionalidades: [
                        "Parcelas em aberto",
                        "Histórico de adimplência",
                        "Alertas de atraso",
                        "Integração com WhatsApp (cobranças automáticas)",
                    ],
                },
                CONTAS_A_PAGAR: {
                    descricao: "Gestão de compromissos financeiros",
                    funcionalidades: [
                        "Previsão de desembolso",
                        "Pagamento de fornecedores",
                        "Fluxo de caixa projetado",
                    ],
                },
                FORECAST_INTELIGENTE: {
                    descricao:
                        "⭐ FEATURE-CHAVE: Predição de faturamento dos próximos 30 dias com base no histórico de O.S.",
                    como_funciona:
                        "IA analisa: volume de O.S. abertas, ticket médio, padrões de sazonalidade, clientes recorrentes",
                    beneficio:
                        "Permite provisionar capital e planejar compras de estoque com precisão",
                    exemplo:
                        "Se você teve 50 O.S. em março com ticket médio de R$ 1.200, o Forecast prevê ~R$ 60k em abril",
                },
                MARGEM_DE_CONTRIBUICAO: {
                    descricao: "Análise de lucro real por serviço/peça",
                    como_calcular:
                        "Receita - Custos Variáveis (peças + mão de obra alocada)",
                },
            },
            exemplos_perguntas: [
                "Quanto vou faturar nos próximos 30 dias?",
                "Como ativar o Forecast Inteligente?",
                "Qual é minha margem média?",
                "Quais serviços são mais lucrativos?",
                "Posso usar o Assistente Fiscal?",
            ],
            tags: ["financeiro", "forecast", "fluxo de caixa", "margem", "lucro"],
        },

        DESMANCHE: {
            nome: "Desmanche",
            icone: "🔧",
            descricao:
                "Gestão de peças usadas e sucatas com rastreabilidade. Permite recuperar valor de peças com defeito.",
            funcionalidades: [
                "Registro de peças removidas (motor, câmbio, farol)",
                "Preço de venda para sucata ou revenda",
                "Rastreabilidade por veículo",
                "Integração com estoque (peças recuperadas)",
            ],
            beneficio:
                "Aumenta a margem em serviços de baixo custo (ex: troca de óleo vira oportunidade de vender peças usadas)",
            exemplos_perguntas: [
                "Como registrar peças usadas?",
                "Qual é o valor de revenda de uma peça?",
                "Quais peças desmanchei este mês?",
            ],
            tags: ["desmanche", "peças usadas", "sucata", "revenda"],
        },

        CLIENTES: {
            nome: "Clientes",
            icone: "👥",
            descricao:
                "CRM completo com histórico de serviços por placa, KM médio, padrão de compra e comportamento.",
            funcionalidades: [
                "Cadastro por CPF/CNPJ",
                "Histórico de O.S. por placa",
                "KM médio registrado",
                "Frequência de compra (semanal/mensal/trimestral)",
                "Segmentação automática (Cliente Ouro, Prata, Bronze)",
                "Integração com Marketing (campanhas direcionadas)",
            ],
            insights_ia: [
                "Identifica clientes em risco de churn (não vieram há 3 meses)",
                "Sugere serviços preventivos (ex: revisão de embreagem a 100k km)",
                "Estima lifetime value do cliente",
            ],
            exemplos_perguntas: [
                "Quantas O.S. um cliente teve comigo?",
                "Qual é o KM médio registrado?",
                "Como segmentar clientes para marketing?",
                "Qual cliente vai fazer serviço em breve?",
            ],
            tags: ["clientes", "crm", "histórico", "fidelização", "segmentação"],
        },

        TAREFA: {
            nome: "Tarefa",
            icone: "✅",
            descricao:
                "Gerenciador de produtividade interna. Delega serviços para mecânicos, monitora tempo de execução.",
            funcionalidades: [
                "Criar tarefa a partir de O.S.",
                "Atribuir para mecânico específico",
                "Status: Aberta / Em Andamento / Pronta",
                "Tempo estimado vs. tempo real",
                "Produtividade por mecânico (% de tarefas no prazo)",
            ],
            beneficio:
                "Reduz gargalos, identifica mecânicos mais rápidos, melhora o throughput de O.S.",
            exemplos_perguntas: [
                "Qual mecânico é mais rápido?",
                "Quantas tarefas tenho em aberto?",
                "Posso monitorar o tempo de execução?",
            ],
            tags: ["tarefa", "produtividade", "mecânicos", "scheduling"],
        },

        NOTA_FISCAL: {
            nome: "Nota Fiscal",
            icone: "📄",
            descricao:
                "Interface direta com o Assistente Fiscal para emissão simplificada de NF-e e NFS-e.",
            funcionalidades: [
                "Emissão de NF-e (produtos)",
                "Emissão de NFS-e (serviços)",
                "Integração com SEFAZ",
                "Modelo de recibo pré-preenchido com dados da O.S.",
            ],
            assistente_fiscal: {
                nome: "Assistente Fiscal",
                descricao:
                    "Suporte especializado para reduzir carga tributária e organizar contabilidade",
                funcionalidades: [
                    "Consultoria de regime tributário (Simples vs. Lucro Real)",
                    "Otimização de ISS (Imposto sobre Serviço)",
                    "Orientação sobre retenção de IR",
                    "Ajuda na declaração de renda",
                ],
            },
            exemplos_perguntas: [
                "Como emitir uma NF-e?",
                "Qual é meu regime tributário ideal?",
                "O Assistente Fiscal pode me ajudar com impostos?",
            ],
            tags: ["nota fiscal", "fiscal", "nfe", "nfse", "imposto"],
        },

        PATRIMONIO: {
            nome: "Patrimônio",
            icone: "🏗️",
            descricao:
                "Inventário de ativos da oficina (elevadores, scanners, ferramentas especiais). Controla depreciação e manutenções.",
            funcionalidades: [
                "Cadastro de ativos com valor de compra",
                "Cálculo de depreciação acelerada",
                "Agenda de manutenção preventiva",
                "Alertas de manutenção vencida",
                "Relatório para contabilidade (ativo imobilizado)",
            ],
            beneficio:
                "Reduz downtime de equipamentos, otimiza depreciação fiscal, melhora ROI do investimento em ferramental",
            exemplos_perguntas: [
                "Qual é o valor do meu patrimônio?",
                "Quando preciso fazer manutenção no elevador?",
                "Como calcular depreciação?",
            ],
            tags: ["patrimônio", "ativos", "depreciação", "manutenção"],
        },

        FORNECEDORES: {
            nome: "Fornecedores",
            icone: "🚚",
            descricao:
                "Cadastro e histórico de compras com comparação de preços e prazos de entrega.",
            funcionalidades: [
                "Registro de fornecedor (CNPJ, contatinho)",
                "Histórico de compras (preço, data, quantidade)",
                "Comparação de preço (melhor fornecedor por peça)",
                "Prazo de entrega médio",
                "Rating de confiabilidade",
            ],
            insights_ia: [
                "Identifica fornecedor mais barato por peça",
                "Prediz atrasos com base em histórico",
                "Sugere negociação de volume",
            ],
            exemplos_perguntas: [
                "Qual fornecedor tem o melhor preço?",
                "Qual é o prazo de entrega médio?",
                "Posso negociar volume com fornecedores?",
            ],
            tags: ["fornecedores", "compras", "preço", "prazo"],
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // ABAS DO MENU DE SISTEMA (Configurações)
    // ═══════════════════════════════════════════════════════════════
    ABAS_SISTEMA: {
        AJUSTES: {
            nome: "Ajustes",
            icone: "⚙️",
            descricao: "Personalização de logos, cabeçalhos e configurações operacionais.",
            configuracoes: [
                "Logo e branding (aparece em O.S. e NF)",
                "Cabeçalho de O.S. customizado",
                "Garantia padrão (ex: 30 dias para serviços)",
                "Chaves PIX para recebimento",
                "Formas de pagamento aceitas",
                "Margens padrão por tipo de serviço",
            ],
            exemplos_perguntas: [
                "Como colocar meu logo?",
                "Qual é a garantia padrão que devo oferecer?",
                "Como configurar minhas chaves PIX?",
            ],
            tags: ["ajustes", "configuração", "branding", "pix"],
        },

        EQUIPE: {
            nome: "Equipe",
            icone: "👨‍💼",
            descricao:
                "Gestão de acessos e permissões. Define quem vê financeiro ou apenas abre O.S.",
            funcionalidades: [
                "Cadastro de usuários (email + senha)",
                "Atribuição de roles (Admin / Mecânico / Atendente / Consultor)",
                "Permissões por módulo (financeiro privado, estoque visível, etc)",
                "Histórico de alterações (quem fez o quê)",
            ],
            roles_padrao: {
                ADMIN: "Acesso total (financeiro, estoque, gestão de equipe)",
                MECANICO:
                    "Vê apenas suas tarefas e O.S. abertas (sem acesso a financeiro)",
                ATENDENTE:
                    "Abre O.S. e consulta cliente, mas sem acesso a custos/lucro",
                CONSULTOR:
                    "Acesso de leitura a relatórios, sem permissão de edição",
            },
            exemplos_perguntas: [
                "Como criar um novo usuário?",
                "Qual é a diferença entre Mecânico e Atendente?",
                "Posso restringir acesso ao financeiro?",
            ],
            tags: ["equipe", "usuários", "permissões", "roles", "acesso"],
        },

        MARKETING: {
            nome: "Marketing",
            icone: "📢",
            descricao:
                "Disparos automáticos via WhatsApp e criação de promoções baseadas em baixa demanda.",
            funcionalidades: [
                "Campanhas automáticas (ex: 'Tempo de revisão?' para clientes parados há 3 meses)",
                "Criação de promoções (ex: '20% em freio para clientes bronze')",
                "Disparos em massa via WhatsApp com template customizado",
                "A/B testing de mensagens",
                "Relatório de conversão por campanha",
            ],
            exemplos_ia: [
                "IA identifica clientes que precisam de revisão e dispara aviso automático",
                "IA sugere promo para serviços com baixa demanda (ex: ar-condicionado no inverno)",
            ],
            exemplos_perguntas: [
                "Como enviar uma mensagem em massa?",
                "Quais promoções funcionam melhor?",
                "Posso automatizar campanhas?",
            ],
            tags: ["marketing", "whatsapp", "promoção", "campanha"],
        },

        AJUDA: {
            nome: "Ajuda",
            icone: "❓",
            descricao:
                "Biblioteca de tutoriais e acesso direto ao Especialista IA para dúvidas de gestão.",
            conteudo: [
                "Guia de uso por módulo",
                "FAQ de problemas comuns",
                "Vídeos de treinamento",
                "Chat direto com Especialista IA (você agora!)",
            ],
            exemplos_perguntas: [
                "Como funciona o Forecast?",
                "Qual é a fórmula do lucro?",
                "Como aumentar meu faturamento?",
            ],
            tags: ["ajuda", "tutorial", "faq", "suporte"],
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // DIFERENCIAIS COMPETITIVOS (Vantagens do Express Auto Tech)
    // ═══════════════════════════════════════════════════════════════
    DIFERENCIAIS: {
        CERTIFICADO_PROCEDENCIA: {
            nome: "Certificado de Procedência Digital",
            descricao:
                "Gera um documento digital comprovando o histórico de manutenção do veículo",
            beneficio: "Aumenta valor de revenda do carro em até 10%",
            como_usar:
                "Automaticamente gerado ao fechar cada O.S. com assinatura digital",
            impacto:
                "Cliente vende carro mais caro → volta pra você fazer revisão do novo",
        },
        SEGURANCA_FEMININA: {
            nome: "Interface Amigável e Segura para Mulheres",
            descricao:
                "Linguagem clara, transparência total, fotos/vídeos reais do defeito via WhatsApp",
            beneficio: "Aumenta confiança, reduz reclamações, fideliza cliente",
            como_usar:
                "O app sugere envio automático de fotos da peça defeituosa antes de cobrança",
        },
        ASSISTENTE_FISCAL_COMPLETO: {
            nome: "Assistente Fiscal Integrado",
            descricao:
                "Suporte especializado para reduzir carga tributária e organizar contabilidade",
            beneficio: "Economia de até 15% em impostos + organização contábil",
            como_usar: "Acesso via módulo NOTA_FISCAL ou comando direto na IA",
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // FÓRMULAS E CÁLCULOS CRÍTICOS
    // ═══════════════════════════════════════════════════════════════
    FORMULAS: {
        FATURAMENTO: {
            formula: "Número de O.S. × Ticket Médio",
            exemplo: "50 O.S. × R$ 1.200 = R$ 60.000",
            insight:
                "Aumentar O.S. é mais fácil que aumentar ticket. Foco em volume com automação.",
        },
        MARGEM_BRUTA: {
            formula: "(Receita - Custo de Peças) / Receita × 100",
            exemplo:
                "Se receita = R$ 1.000 e custo de peças = R$ 300, margem = 70%",
        },
        MARGEM_CONTRIBUICAO: {
            formula: "(Receita - Custos Variáveis) / Receita × 100",
            custos_variaveis: "Peças + Mão de obra alocada + Combustível",
            insight: "Indica quanto cada O.S. contribui para pagar custos fixos",
        },
        TICKET_MEDIO: {
            formula: "Faturamento Total / Número de O.S.",
            exemplo: "R$ 60.000 / 50 O.S. = R$ 1.200 por O.S.",
            insight:
                "Aumentar ticket = vender mais peças complementares ou serviços agregados",
        },
        GIRO_ESTOQUE: {
            formula: "Custo de Peças Usadas / Saldo Médio de Estoque",
            insight: "Quanto maior, melhor. Objetivo: 3-4x ao ano",
        },
    },

    // ═══════════════════════════════════════════════════════════════
    // ESTRATÉGIAS DE LUCRO (O que a IA recomenda)
    // ═══════════════════════════════════════════════════════════════
    ESTRATEGIAS_LUCRO: [
        {
            nome: "Aumentar Volume de O.S.",
            como: "Marketing automático + campanhas no WhatsApp para clientes inativos",
            impacto:
                "50 O.S. → 60 O.S. = +R$ 12k/mês (com ticket médio de R$ 1.200)",
        },
        {
            nome: "Aumentar Ticket Médio",
            como: "Vender peças complementares (filtro de ar ao trocar óleo, bateria na revisão)",
            impacto:
                "R$ 1.200 → R$ 1.500 = +R$ 15k/mês (em 50 O.S.)",
        },
        {
            nome: "Reduzir Custo de Peças",
            como: "Negociar volume com fornecedores, comparar preços via módulo Fornecedores",
            impacto:
                "Margem 65% → 72% = +R$ 3.5k/mês (em R$ 60k faturado)",
        },
        {
            nome: "Vender Peças Usadas (Desmanche)",
            como: "Registrar peças removidas e revender como recuperadas",
            impacto:
                "+R$ 1-2k/mês em receita adicional sem custo de compra",
        },
        {
            nome: "Fidelizar Clientes Ouro",
            como: "Acompanhamento pro-ativo (próxima revisão, histórico salvo)",
            impacto:
                "Cliente volta 5x mais frequente → +R$ 6k/mês por cliente fiel",
        },
    ],

    // ═══════════════════════════════════════════════════════════════
    // ERROS COMUNS (O que evitar)
    // ═══════════════════════════════════════════════════════════════
    ERROS_COMUNS: [
        {
            erro: "Faturamento zerado no Home",
            causa: "Nenhuma O.S. foi aberta ou foi aberta sem cliente/valor",
            solucao:
                "Abrir uma O.S. teste: ir em GESTÃO > VISÃO_GERAL > Botão 'Nova O.S.'",
        },
        {
            erro: "Estoque zerado sem ter comprado nada",
            causa: "Peças não foram cadastradas no início do mês",
            solucao:
                "GESTÃO > ESTOQUE > Importar lista de peças padrão (fornecedor)",
        },
        {
            erro: "Clientes não aparecem na lista",
            causa:
                "O.S. foi aberta com cliente genérico ou 'Sem Cadastro'",
            solucao:
                "Sempre preencher CPF/Nome no cadastro de cliente da O.S.",
        },
        {
            erro: "Não consigo emitir nota fiscal",
            causa: "CNPJ ou razão social não foi configurada em SISTEMA > AJUSTES",
            solucao: "Preencher dados da empresa em AJUSTES antes de emitir NF",
        },
    ],
};

/**
 * FUNÇÃO AUXILIAR: Buscar conhecimento por tag
 * Permite que useOficinaBD.js faça consultas RAG eficientes
 */
export function buscarPorTag(tag) {
    const resultado = [];

    // Busca em ABAS_GESTAO
    Object.entries(CONHECIMENTO_OFICINA_IA.ABAS_GESTAO).forEach(
        ([chave, aba]) => {
            if (aba.tags && aba.tags.includes(tag.toLowerCase())) {
                resultado.push({
                    categoria: "GESTÃO",
                    chave,
                    nome: aba.nome,
                    descricao: aba.descricao,
                });
            }
        }
    );

    // Busca em ABAS_SISTEMA
    Object.entries(CONHECIMENTO_OFICINA_IA.ABAS_SISTEMA).forEach(
        ([chave, aba]) => {
            if (aba.tags && aba.tags.includes(tag.toLowerCase())) {
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
 * Retorna apenas as informações relevantes (não todo o JSON)
 */
export function gerarContextoPorAba(abaAtiva) {
    const contextos = {
        visao_geral: () => {
            const aba = CONHECIMENTO_OFICINA_IA.ABAS_GESTAO.VISAO_GERAL;
            return `
        ABA ATIVA: ${aba.nome}
        DESCRIÇÃO: ${aba.descricao}
        MÓDULOS: ${aba.modulos_ativos.join(", ")}
        
        Dica: Se o faturamento está zerado, ative o Forecast para prever receita
        com base em O.S. abertas. Use perguntas como: "Quanto vou faturar?"
      `;
        },
        estoque: () => {
            const aba = CONHECIMENTO_OFICINA_IA.ABAS_GESTAO.ESTOQUE;
            return `
        ABA ATIVA: ${aba.nome}
        DESCRIÇÃO: ${aba.descricao}
        
        FUNCIONALIDADES:
        ${aba.funcionalidades.map((f) => `  • ${f}`).join("\n")}
        
        INSIGHTS: ${aba.insights_ia.join(" | ")}
        
        Dica: Analise o giro ABC para identificar peças paradas (sucata)
      `;
        },
        financeiro: () => {
            const aba = CONHECIMENTO_OFICINA_IA.ABAS_GESTAO.FINANCEIRO;
            const forecast =
                aba.modulos.FORECAST_INTELIGENTE;
            return `
        ABA ATIVA: ${aba.nome}
        DESCRIÇÃO: ${aba.descricao}
        
        ⭐ DESTAQUE - FORECAST INTELIGENTE:
        Como funciona: ${forecast.como_funciona}
        Benefício: ${forecast.beneficio}
        Exemplo: ${forecast.exemplo}
        
        Dica: Use o Forecast para planejar compras e fluxo de caixa
      `;
        },
        clientes: () => {
            const aba = CONHECIMENTO_OFICINA_IA.ABAS_GESTAO.CLIENTES;
            return `
        ABA ATIVA: ${aba.nome}
        DESCRIÇÃO: ${aba.descricao}
        
        INSIGHTS DA IA:
        ${aba.insights_ia.map((i) => `  • ${i}`).join("\n")}
        
        Dica: Use a segmentação (Ouro/Prata/Bronze) para campanhas
        personalizadas via WhatsApp
      `;
        },
        nota_fiscal: () => {
            const aba = CONHECIMENTO_OFICINA_IA.ABAS_GESTAO.NOTA_FISCAL;
            return `
        ABA ATIVA: ${aba.nome}
        
        MÓDULO ASSISTENTE FISCAL:
        ${aba.assistente_fiscal.funcionalidades.map((f) => `  • ${f}`).join("\n")}
        
        Dica: Consulte o Assistente Fiscal para otimizar impostos
      `;
        },
        retorno: () => {
            return `
        ABA ATIVA: Gestão de Retorno
        DESCRIÇÃO: Módulo focado em fidelização e recorrência. 
        AÇÃO: O dono deve filtrar por categoria e convidar clientes via WhatsApp para revisões pendentes.
        DICA IA: Clientes que retornam gastam até 3x mais do que clientes novos. Foque nos 'Híbridos' e 'Mecânica' hoje.
      `;
        },
        sistema: () => {
            return `
        VOCÊ ESTÁ EM: Menu de Sistema (Configurações)
        
        Abas disponíveis:
        1. AJUSTES - Logo, chaves PIX, garantia padrão
        2. EQUIPE - Usuários e permissões
        3. MARKETING - Campanhas automáticas
        4. AJUDA - Tutoriais e suporte
        
        Dica: Configure AJUSTES primeiro para aparecer logo na O.S.
      `;
        },
    };

    const gerador = contextos[abaAtiva.toLowerCase()];
    return gerador
        ? gerador()
        : `Aba não reconhecida: ${abaAtiva}. Consulte o Menu de Gestão.`;
}

export default CONHECIMENTO_OFICINA_IA;