// src/adminConfig.js

export const isTrial = true;

export const APP_BASE_URL = 'https://oficina.expresstech.com.br';

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
    mecanica: 'Mecânica', clientes: 'Clientes', hibrido: 'Híbridos/Elétricos',
    moto: 'Motos', funilaria: 'Funilaria', amortecedor: 'Amortecedor',
    injecao: 'Injeção', eletrica: 'Elétrica', alinhamento: 'Alinhamento',
    oleo: 'Óleo', ar_condicionado: 'Ar-Condicionado',
    pneus: 'Pneus', desmanche: 'Desmanche', escapamento: 'Escapamento',
    lavajato: 'Lava Jato', estetica: 'Estética',
    copiloto: 'Copiloto IA', secretaria: 'Secretária IA', administrador: 'Administrador IA',
    contador: 'Assistente Fiscal IA', mercadolivre: 'Compras',
};

export const LABELS_ABAS = {
    dashboard: '📊 VISÃO GERAL', os: '🔧 O.S.', mecanica: '🔧 MECÂNICA', clientes: '👥 CLIENTES', hibrido: '🔋 HÍBRIDOS',
    moto: '🏍️ MOTOS', eletrico: '🔌 100% ELÉTRICOS', funilaria: '🚗 FUNILARIA', amortecedor: '🧰 AMORTECEDOR', injecao: '🛠️ INJEÇÃO',
    oleo: '🛢️ ÓLEO', alinhamento: '⚙️ ALINHAMENTO', eletrica: '⚡ ELÉTRICA',
    ar_condicionado: '❄️ AR-COND.', pneus: '🛞 PNEUS', escapamento: '🪛 ESCAPAMENTO', estetica: '✨ ESTÉTICA',
    lavajato: '🚿 LAVA JATO', desmanche: '🚗 DESMANCHE', copiloto: '👨‍🔧 COPILOTO',
    secretaria: '👩‍💼 SECRETÁRIA', administrador: '👔 ADMINISTRADOR', contador: '📋 ASSIST. FISCAL',
    mercadolivre: '📦 COMPRAS', mercado_livre: '📦 COMPRAS',
    financeiro: '📊 FINANCEIRO', estoque: '📦 ESTOQUE', leads: '👥 CLIENTES', historico: '📋 HISTÓRICO',
    tarefa: '📋 TAREFA', notafiscal: '📄 NOTA FISCAL', retorno: '📅 RETORNO', patrimonio: '📊 PATRIMÔNIO', fornecedores: '🤝 FORNECEDORES',
    precificacao: '💰 PRECIFICAÇÃO',
    equipe: '👥 EQUIPE', config: '⚙️ AJUSTES', marketing: '📣 MARKETING', estrategia: '🚀 ESTRATÉGIA', ajuda: '❓ AJUDA',
    master: '👑 MASTER', meuplano: '💰 MEU PLANO',
};

export const AJUDA_ITENS = [
    { aba: 'dashboard', icon: '📊', titulo: 'Visão Geral & Dashboard', conteudo: ['Acompanhe faturamento, número de O.S. e ticket médio.', 'Visualize o status das ordens de serviço em tempo real.', 'Monitore metas financeiras e desempenho da equipe.'] },
    { aba: 'os', icon: '📝', titulo: 'Abertura de O.S. (Triagem)', conteudo: ['Inicie o atendimento clicando em "Nova O.S." ou use a Busca Rápida.', 'Preencha os dados do cliente e veículo (use o microfone se disponível).', 'Encaminhe para o setor técnico desejado (Mecânica, Óleo, Alinhamento, etc).'] },
    { aba: 'mecanica', icon: '🔧', titulo: 'Módulo Mecânica Geral', conteudo: ['Geração de orçamentos detalhados com peças e mão de obra.', 'Controle de serviços complexos e suspensão.', 'Envio automático de orçamento via WhatsApp para aprovação.'] },
    { aba: 'funilaria', icon: '🚗', titulo: 'Funilaria & Pintura', conteudo: ['Checklist visual de avarias e fotos do veículo.', 'Orçamento específico para funilaria e serviços de pintura.', 'Acompanhamento do status de repintura e acabamento.'] },
    { aba: 'oleo', icon: '🛢️', titulo: 'Troca de Óleo & Filtros', conteudo: ['Registro simplificado de viscosidade e quantidade de óleo.', 'Controle de troca de filtros (Ar, Óleo, Combustível, Cabine).', 'Configuração de etiqueta de próxima quilometragem.'] },
    { aba: 'alinhamento', icon: '⚙️', titulo: 'Alinhamento & Balanceamento', conteudo: ['Checklist de suspensão e estado dos pneus.', 'Registro de medidas de cambagem, convergência e cáster.', 'Integração com serviços de freios e amortecedores.'] },
    { aba: 'eletrica', icon: '⚡', titulo: 'Elétrica & Baterias', conteudo: ['Diagnóstico de alternador, motor de partida e iluminação.', 'Teste de carga de bateria e scanner eletrônico.', 'Lançamento de componentes elétricos e chicotes.'] },
    { aba: 'pneus', icon: '🛞', titulo: 'Pneus & Borracharia', conteudo: ['Controle de DOT, marca e medida dos pneus.', 'Serviços de vulcanização, rodízio e montagem.', 'Venda de pneus novos com integração ao estoque.'] },
    { aba: 'copiloto', icon: '🤖', titulo: 'Copiloto IA Técnico', conteudo: ['Tire dúvidas técnicas sobre torque, sensores e esquemas.', 'Analise códigos de falha (DTC) e receba dicas de reparo.', 'Treinado especificamente para a frota brasileira.'] },
    { aba: 'secretaria', icon: '📞', titulo: 'Secretária & Orçamentos (IA)', conteudo: ['Gera textos persuasivos para enviar no WhatsApp.', 'Resume diagnósticos técnicos para o cliente entender.', 'Aumenta a conversão de orçamentos parados.'] },
    { aba: 'financeiro', icon: '💰', titulo: 'Gestão Financeira & Caixa', conteudo: ['Controle de Entradas (Caixa) e Saídas (Despesas).', 'Relatórios de lucro líquido e fluxo de caixa mensal.', 'Lançamentos automáticos ao finalizar uma O.S. paga.'] },
    { aba: 'estoque', icon: '📦', titulo: 'Controle de Peças & Produtos', conteudo: ['Entrada de notas e controle de saldo mínimo.', 'Custo médio e valor total em estoque.', 'Venda de balcão direta ou integrada à O.S.'] },
    { aba: 'clientes', icon: '🎯', titulo: 'Clientes & Leads (CRM)', conteudo: ['Base de dados centralizada de clientes e veículos.', 'Histórico completo de passagens na oficina.', 'Gestão de novos leads que entram via WhatsApp ou site.'] },
    { aba: 'historico', icon: '🕐', titulo: 'Histórico de Placa (Busca)', conteudo: ['Digite uma placa para ver tudo o que já foi feito no carro.', 'Reimprima O.S. antigas e verifique garantias.', 'Ótimo para fidelização e pós-venda.'] },
    { aba: 'retorno', icon: '📆', titulo: 'Gestão de Retornos (Vendas)', conteudo: ['Agendamento automático de revisões futuras.', 'Lembrete de troca de óleo, freios e correia dentada.', 'Aumente o faturamento trazendo o cliente de volta.'] },
    { aba: 'precificacao', icon: '💰', titulo: 'PRECIFICAÇÃO - Sua Calculadora de Lucro Real', conteudo: ['👉 Pare de pagar para trabalhar! Use esta aba para saber exatamente quanto cobrar.', '🏦 PAINEL ESQUERDO: Configure seus custos fixos mensais (Aluguel, Luz, Folha) e suas horas úteis.', '✅ O sistema calcula automaticamente o valor da sua HORA TÉCNICA.', '📈 CALCULADORA À DIREITA: Digite o custo da peça, o tempo do serviço e os impostos.', '📊 RAIO-X DO DINHEIRO: Veja visualmente para onde vai cada centavo e garanta seu LUCRO LÍQUIDO.', '📲 AÇÃO RÁPIDA: Gere o valor e envie o orçamento profissional direto no WhatsApp do cliente com 1 clique.', '💡 Dica: Salve seus custos fixos uma vez e o sistema lembrará deles para todos os próximos orçamentos.'] },
    { aba: 'config', icon: '⚙️', titulo: 'Configurações do Sistema', conteudo: ['Personalize nome, logo e endereço da sua oficina.', 'Cadastre chaves PIX para links de pagamento.', 'Ajuste horários e preferências globais.'] }
];