// src/services/adminConfig.js

export const isTrial = true;

export const APP_BASE_URL = 'https://imobi.expresstech.com.br';

export const SERVICOS_ESTETICA_ABAS = [
    'mecanica', 'hibrido', 'eletrico', 'moto', 'funilaria', 'amortecedor',
    'injecao', 'eletrica', 'alinhamento', 'oleo', 'revisao', 'ar_condicionado',
    'pneus', 'desmanche', 'escapamento', 'lavajato', 'estetica'
];

export const MAPA_MODULOS_SERVICOS = {
    mecanica: ['mecanica', 'MECÂNICA', 'MECANICA'],
    hibrido: ['hibrido', 'HÍBRIDOS', 'HIBRIDOS'],
    eletrico: ['eletrico', '100% ELÉTRICOS', '100% ELETRICOS'],
    moto: ['moto', 'motos', 'MOTOS'],
    funilaria: ['funilaria', 'FUNILARIA'],
    amortecedor: ['amortecedor', 'AMORTECEDOR'],
    injecao: ['injecao', 'INJEÇÃO', 'INJECAO'],
    eletrica: ['eletrica', 'ELÉTRICA', 'ELÉTRICA'],
    alinhamento: ['alinhamento', 'ALINHAMENTO'],
    oleo: ['oleo', 'ÓLEO', 'OLEO'],
    ar_condicionado: ['ar_condicionado', 'AR-CONDICIONADO'],
    pneus: ['pneus', 'PNEUS'],
    desmanche: ['desmanche', 'DESMANCHE'],
    escapamento: ['escapamento', 'ESCAPAMENTO'],
    lavajato: ['lavajato', 'LAVA JATO'],
    estetica: ['estetica', 'ESTÉTICA', 'ESTETICA'],
};

export const LABELS_ABAS_MODAL = {
    clientes: 'Clientes & Leads',
    copiloto: 'Hermes Copiloto IA',
    secretaria: 'Pólen · Atendimento 24h',
    administrador: 'Diretor Comercial IA',
    contador: 'Simulador de Custos IA',
};

export const LABELS_ABAS = {
    dashboard: '📊 VISÃO GERAL',
    clientes: '👥 CLIENTES & LEADS',
    copiloto: '🧠 HERMES COPILOTO',
    secretaria: '👩‍💼 SOFIA SECRETÁRIA',
    administrador: '👔 DIRETOR COMERCIAL',
    contador: '📋 ASSIST. FISCAL',
    financeiro: '📊 FINANCEIRO & VGV',
    estoque: '🏠 CAPTAÇÃO & IMÓVEIS',
    leads: '👥 FUNIL CRM',
    historico: '📋 PROPOSTAS & NEGÓCIOS',
    tarefa: '📸 VISTORIA & LAUDO IA',
    notafiscal: '📄 REPASSES & NF',
    retorno: '📅 REATIVAÇÃO DE LEADS',
    patrimonio: '📊 PATRIMÔNIO',
    fornecedores: '🤝 PARCEIROS',
    precificacao: '💰 PRECIFICAÇÃO',
    equipe: '👥 CORRETORES & EQUIPE',
    config: '⚙️ CONFIGURAÇÕES',
    marketing: '📣 META ADS & CRIATIVOS',
    estrategia: '🚀 ESTRATÉGIA',
    ajuda: '❓ AJUDA',
    master: '👑 MASTER',
    meuplano: '💎 MEU PLANO',
};

export const AJUDA_ITENS = [
    { aba: 'dashboard', icon: '📊', titulo: 'Visão Geral & Painel Executivo', conteudo: ['Acompanhe VGV em carteira, comissão prevista (6%) e visitas agendadas.', 'Visualize o status dos leads no funil CRM em tempo real.', 'Monitore metas financeiras e desempenho dos corretores.'] },
    { aba: 'clientes', icon: '🎯', titulo: 'Clientes & Funil de Leads (CRM)', conteudo: ['Base de dados centralizada de compradores, locatários e proprietários.', 'Distribuição justa via Roleta de Leads entre os corretores ativos.', 'Gestão de novos leads que entram via WhatsApp ou Simulador de Financiamento.'] },
    { aba: 'financeiro', icon: '💰', titulo: 'Financeiro & Gestão de VGV', conteudo: ['Controle de Comissões (Entradas) e Despesas/Repasses (Saídas).', 'Relatórios de lucro líquido e fluxo de caixa por período.', 'Disparo de resumo financeiro direto no WhatsApp.'] },
    { aba: 'tarefa', icon: '📸', titulo: 'Vistoria Imobiliária & Tarefas Rápidas', conteudo: ['Crie tarefas imobiliárias rápidas com 1 único clique.', 'Adicione fotos por divisão do imóvel (Sala, Cozinha, Quartos, W.C., Exterior).', 'Gere minutas de laudo fotográfico com IA para impressão ou envio no WhatsApp.'] },
    { aba: 'config', icon: '⚙️', titulo: 'Configurações da Imobiliária / Corretor', conteudo: ['Personalize Nome da Imobiliária/Corretor, CRECI, Endereço e WhatsApp.', 'Cadastre URL da logomarca e Chave PIX/Dados de Comissão.'] }
];
