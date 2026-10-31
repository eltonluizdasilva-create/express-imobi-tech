import{t as j,r as n,h as k,f as z,d as y,j as a,S as G,X as L,v as q}from"./index-Ch2M55ZW.js";import{M as F}from"./mic-B_tRuH4p.js";const B=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],V=j("download",B);const U=[["path",{d:"M12 19v3",key:"npa21l"}],["path",{d:"M15 9.34V5a3 3 0 0 0-5.68-1.33",key:"1gzdoj"}],["path",{d:"M16.95 16.95A7 7 0 0 1 5 12v-2",key:"cqa7eg"}],["path",{d:"M18.89 13.23A7 7 0 0 0 19 12v-2",key:"16hl24"}],["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M9 9v3a3 3 0 0 0 5.12 2.12",key:"r2i35w"}]],Q=j("mic-off",U);const H=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]],K=j("rotate-ccw",H),P={BASE_URL:"./",DEV:!1,MODE:"production",PROD:!0,SSR:!1,VITE_DEEPSEEK_API_KEY:"",VITE_FIREBASE_API_KEY:"AIzaSyCJtPXpPtHIhNCnqLRF5zJOq-AJR6cyZec",VITE_FIREBASE_APP_ID:"1:234700237204:web:0c99f3290c9b7cb9c10781",VITE_FIREBASE_AUTH_DOMAIN:"express-ai-automation.firebaseapp.com",VITE_FIREBASE_MESSAGING_SENDER_ID:"234700237204",VITE_FIREBASE_PROJECT_ID:"express-ai-automation",VITE_FIREBASE_STORAGE_BUCKET:"express-ai-automation.firebasestorage.app",VITE_GEMINI_API_KEY:"",VITE_GROQ_API_KEY:"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",VITE_SILICONFLOW_API_KEY:"sk-ztmfepzeazgssvxajcmnirdlnowpamzzanlphljyqaqvuxdp",VITE_SU:"elton.luizdasilva@hotmail.com",VITE_SU_WPP:"5534988273194",VITE_ZHIPU_API_KEY:"1116fa104da64800adf7ee5decc70282.u7Xvel2lHGzsOQAS"},M=`Você é o especialista da Express Auto Tech. 
Sua missão é auxiliar mecânicos e gestores de oficina.
Responda de forma direta, técnica quando necessário, mas sempre respeitando o contexto da pergunta do usuário. 
Se o usuário perguntar sobre gestão ou mercado, responda como um consultor de negócios. 
NUNCA use asteriscos (**) para negrito ou formatação nas suas respostas.`,_={groq:{nome:"Groq (Llama)",api:"https://api.groq.com/openai/v1/chat/completions",model:"llama-3.3-70b-versatile",keyEnv:"VITE_GROQ_API_KEY"},gemini:{nome:"Google Gemini",api:"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent",keyEnv:"VITE_GEMINI_API_KEY"}},J="gemini";function Y(t){const[h,d]=n.useState(!1),[e,o]=n.useState(J);n.useEffect(()=>{(async()=>{if(t)try{const r=await k(z(y,"usuarios",t));if(r.exists()&&r.data().preferencia_modelo){const c=r.data().preferencia_modelo;_[c]&&o(c)}}catch{console.log("[IA] Usando modelo padrão")}})()},[t]);const p=async g=>{d(!0);try{const r=_[e],c=P[r.keyEnv];if(!c){const u=_.groq,b=P[u.keyEnv];return await v(u,b,g)}return await v(r,c,g)}catch(r){throw r}finally{d(!1)}},v=async(g,r,c)=>{if(g.nome.includes("Gemini")){const u=await fetch(`${g.api}?key=${r}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:c}]}],systemInstruction:{parts:[{text:M}]}})});if(!u.ok)throw new Error("Erro no Gemini. Verifique sua VITE_GEMINI_API_KEY.");return(await u.json()).candidates[0].content.parts[0].text}if(g.nome.includes("Groq")){const u=await fetch(g.api,{method:"POST",headers:{Authorization:`Bearer ${r}`,"Content-Type":"application/json"},body:JSON.stringify({model:g.model,messages:[{role:"system",content:M},{role:"user",content:c}],temperature:.7})});if(!u.ok)throw new Error("Erro na Groq");return(await u.json()).choices[0].message.content}throw new Error("Modelo não suportado")};return{analyzeText:p,loading:h,modeloAtual:e,MODELOS:_}}const f={ABAS_GESTAO:{VISAO_GERAL:{nome:"Visão Geral / Home",icone:"📊",descricao:"Dashboard de comando central. Mostra faturamento previsto, O.S. abertas, clientes no mês, tendências de lucro.",modulos_ativos:["Forecast","KPIs do dia","Alertas críticos"],exemplos_perguntas:["Por que meu faturamento está zerado?","Como ativar o Forecast?","Qual é meu faturamento previsto para próximos 30 dias?","Quantas O.S. devo abrir para faturar R$ 50k?"],tags:["faturamento","dashboard","overview","kpi"]},ESTOQUE:{nome:"Estoque",icone:"📦",descricao:"Controle de peças com saldo mínimo, custo médio e giro. Sistema avisa quando peças de alto giro (filtros/óleo) estão acabando.",funcionalidades:["Cadastro de peças com SKU","Saldo mínimo automático","Custo médio ponderado","Alertas de falta de estoque","Integração com O.S. (peças usadas)","Relatório de giro (ABC)"],insights_ia:["Identifica peças paradas (C) que viram sucata","Prediz demanda com base no histórico de O.S.","Sugere aumento de saldo para peças sazonais"],exemplos_perguntas:["Qual é meu giro de estoque?","Quais peças estão paradas?","Como aumentar o saldo mínimo?","Posso vender peças usadas com rastreabilidade?"],tags:["estoque","peças","giro","saldo mínimo","custo"]},FINANCEIRO:{nome:"Financeiro",icone:"💰",descricao:"Fluxo de caixa, contas a pagar/receber, análise de margem de contribuição. Módulo de IA: Forecast Inteligente.",modulos:{CONTAS_A_RECEBER:{descricao:"Rastreamento de pagamentos de clientes",funcionalidades:["Parcelas em aberto","Histórico de adimplência","Alertas de atraso","Integração com WhatsApp (cobranças automáticas)"]},CONTAS_A_PAGAR:{descricao:"Gestão de compromissos financeiros",funcionalidades:["Previsão de desembolso","Pagamento de fornecedores","Fluxo de caixa projetado"]},FORECAST_INTELIGENTE:{descricao:"⭐ FEATURE-CHAVE: Predição de faturamento dos próximos 30 dias com base no histórico de O.S.",como_funciona:"IA analisa: volume de O.S. abertas, ticket médio, padrões de sazonalidade, clientes recorrentes",beneficio:"Permite provisionar capital e planejar compras de estoque com precisão",exemplo:"Se você teve 50 O.S. em março com ticket médio de R$ 1.200, o Forecast prevê ~R$ 60k em abril"},MARGEM_DE_CONTRIBUICAO:{descricao:"Análise de lucro real por serviço/peça",como_calcular:"Receita - Custos Variáveis (peças + mão de obra alocada)"}},exemplos_perguntas:["Quanto vou faturar nos próximos 30 dias?","Como ativar o Forecast Inteligente?","Qual é minha margem média?","Quais serviços são mais lucrativos?","Posso usar o Assistente Fiscal?"],tags:["financeiro","forecast","fluxo de caixa","margem","lucro"]},DESMANCHE:{nome:"Desmanche Legalizado (Lei 12.977/14)",icone:"🔧",descricao:"Gestão de peças usadas de reaproveitamento com rastreabilidade jurídica total e descontaminação ecológica. Evita o crime de receptação e protege a liberdade e o patrimônio do dono.",funcionalidades:["Checklist de Descontaminação Obrigatório (óleos, bateria, extintor)","Upload da Nota do Leilão e Registro de Baixa do Detran","Selo de Rastreabilidade / Código Detran por peça ativa","Ícone Escudo Verde: Destaque visual de Origem Lícita","Alerta de Compliance no Dashboard para rastreabilidade pendente"],leis_ambientais_e_criminais:{lei_12977:"Exige rastreabilidade absoluta de cada peça de reaproveitamento para evitar comércio de veículos furtados/roubados.",descontaminacao:"Regulamento CONAMA impõe a retirada total de fluidos e baterias antes do corte do veículo para evitar crime ambiental de contaminação do solo.",receptacao:"A venda ou desmonte de veículo sem baixa ou sem o respectivo selo Detran nas peças configura crime de Receptação Qualificada."},exemplos_perguntas:["O que diz a Lei do Desmanche?","Quais as regras para operar um desmanche legalizado?","O que é o checklist de descontaminação?","Por que preciso registrar o selo do Detran nas peças?","Qual o perigo de desmontar carro sem baixa?"],tags:["desmanche","peças usadas","sucata","revenda","lei","rastreabilidade","detran","conama"]},CLIENTES:{nome:"Clientes",icone:"👥",descricao:"CRM completo com histórico de serviços por placa, KM médio, padrão de compra e comportamento.",funcionalidades:["Cadastro por CPF/CNPJ","Histórico de O.S. por placa","KM médio registrado","Frequência de compra (semanal/mensal/trimestral)","Segmentação automática (Cliente Ouro, Prata, Bronze)","Integração com Marketing (campanhas direcionadas)"],insights_ia:["Identifica clientes em risco de churn (não vieram há 3 meses)","Sugere serviços preventivos (ex: revisão de embreagem a 100k km)","Estima lifetime value do cliente"],exemplos_perguntas:["Quantas O.S. um cliente teve comigo?","Qual é o KM médio registrado?","Como segmentar clientes para marketing?","Qual cliente vai fazer serviço em breve?"],tags:["clientes","crm","histórico","fidelização","segmentação"]},RETORNO:{nome:"Máquina de Retorno (Vendas Preditivas)",icone:"📅",descricao:"O cérebro de vendas preditivas do sistema que antecipa as necessidades do cliente antes dele procurar a concorrência, recuperando clientes inativos.",regras_preditivas:{oleo:"Data do serviço + 180 dias (6 meses)",revisao:"Data do serviço + 365 dias (1 ano)",filtros:"A cada 2 trocas de óleo",acao:"Envio de mensagem proativa via Evolution API 15 dias antes do vencimento da revisão preventiva."},lucro_real:{descricao:"Assistente de Preço Inteligente no Financeiro para evitar margens de lucro no vermelho.",diagnostico:"Cruza custo de peças + impostos + horas de mão de obra, identificando serviços com margem crítica (< 20%)."},exemplos_perguntas:["Como funciona a Máquina de Retorno?","O que fazer quando a margem de lucro está vermelha?","Como a IA ajuda na fidelização e recorrência?"],tags:["retorno","vendas","preditiva","margem","vermelho","revisão","lucro real"]},TAREFA:{nome:"Tarefa",icone:"✅",descricao:"Gerenciador de produtividade interna. Delega serviços para mecânicos, monitora tempo de execução.",funcionalidades:["Criar tarefa a partir de O.S.","Atribuir para mecânico específico","Status: Aberta / Em Andamento / Pronta","Tempo estimado vs. tempo real","Produtividade por mecânico (% de tarefas no prazo)"],beneficio:"Reduz gargalos, identifica mecânicos mais rápidos, melhora o throughput de O.S.",exemplos_perguntas:["Qual mecânico é mais rápido?","Quantas tarefas tenho em aberto?","Posso monitorar o tempo de execução?"],tags:["tarefa","produtividade","mecânicos","scheduling"]},NOTA_FISCAL:{nome:"Nota Fiscal",icone:"📄",descricao:"Interface direta com o Assistente Fiscal para emissão simplificada de NF-e e NFS-e.",funcionalidades:["Emissão de NF-e (produtos)","Emissão de NFS-e (serviços)","Integração com SEFAZ","Modelo de recibo pré-preenchido com dados da O.S."],assistente_fiscal:{nome:"Assistente Fiscal",descricao:"Suporte especializado para reduzir carga tributária e organizar contabilidade",funcionalidades:["Consultoria de regime tributário (Simples vs. Lucro Real)","Otimização de ISS (Imposto sobre Serviço)","Orientação sobre retenção de IR","Ajuda na declaração de renda"]},exemplos_perguntas:["Como emitir uma NF-e?","Qual é meu regime tributário ideal?","O Assistente Fiscal pode me ajudar com impostos?"],tags:["nota fiscal","fiscal","nfe","nfse","imposto"]},PATRIMONIO:{nome:"Patrimônio",icone:"🏗️",descricao:"Inventário de ativos da oficina (elevadores, scanners, ferramentas especiais). Controla depreciação e manutenções.",funcionalidades:["Cadastro de ativos com valor de compra","Cálculo de depreciação acelerada","Agenda de manutenção preventiva","Alertas de manutenção vencida","Relatório para contabilidade (ativo imobilizado)"],beneficio:"Reduz downtime de equipamentos, otimiza depreciação fiscal, melhora ROI do investimento em ferramental",exemplos_perguntas:["Qual é o valor do meu patrimônio?","Quando preciso fazer manutenção no elevador?","Como calcular depreciação?"],tags:["patrimônio","ativos","depreciação","manutenção"]},FORNECEDORES:{nome:"Fornecedores",icone:"🚚",descricao:"Cadastro e histórico de compras com comparação de preços e prazos de entrega.",funcionalidades:["Registro de fornecedor (CNPJ, contatinho)","Histórico de compras (preço, data, quantidade)","Comparação de preço (melhor fornecedor por peça)","Prazo de entrega médio","Rating de confiabilidade"],insights_ia:["Identifica fornecedor mais barato por peça","Prediz atrasos com base em histórico","Sugere negociação de volume"],exemplos_perguntas:["Qual fornecedor tem o melhor preço?","Qual é o prazo de entrega médio?","Posso negociar volume com fornecedores?"],tags:["fornecedores","compras","preço","prazo"]},BUROCRACIAS:{nome:"Gestão de Conformidade / Burocracias & Descartes",icone:"🛡️",descricao:"A aba Burocracias é o seu escudo jurídico. Lá você controla seus alvarás, registra o descarte correto de óleo e sucata metálica (evitando multas da Vigilância Sanitária) e conquista o Selo de Oficina Blindada.",funcionalidades:["Gestão de Alvarás (Funcionamento, Bombeiros, Vigilância)","Registro de Coleta de Óleo Lubrificante (OLUC)","Descarte de Peças Inservíveis / Sucata Metálica (Lei 12.977/14)","Checklist da Caixa Separadora de Água e Óleo (SAO)","Gamificação: Selo Oficina Blindada & Sustentável"],exemplos_perguntas:["o que é a aba burocracia?","Como conseguir o Selo Oficina Blindada?","Qual é a lei do desmanche?","Onde registro descarte de sucata?"],tags:["burocracia","alvará","descarte","sucata","selo","blindada","óleo"]},MIGRACAO:{nome:"👑 Migração de Dados (Inteligência de Dados Antigos)",icone:"💎",descricao:"Recurso exclusivo Premium que transforma o 'arquivo morto' (planilhas Excel, CSV, Zip) em vendas reais através de leitura inteligente e reativação de clientes adormecidos.",etapas:["1. Leitura Profunda: IA escaneia planilhas antigas detectando nomes, telefones e veículos.","2. Limpeza & Cura: Remove duplicados, valida CPFs e formata WhatsApps.","3. Reativação Ativa: Histórico vira lembretes preditivos para agendar retornos automaticamente."],beneficios:["Identificação de 'Dorminhocos': Localiza clientes inativos há mais de 6 meses.","Potencial de Faturamento Oculto: Calcula receita prevista represada no passado.","Re-engajamento Preditivo: Lê OS antigas para disparar avisos (ex: troca de óleo programada)."],exemplos_perguntas:["Como funciona a migração de dados?","Posso importar planilhas antigas do Excel?","Como a IA reativa clientes antigos?"],tags:["migracao","dados","excel","csv","importar","dorminhocos","histórico"]},ESPECIALISTA:{nome:"🚀 Especialista IA (Mentor de Negócios & Leis)",icone:"🤖",descricao:"Sua inteligência de bordo focada em mentoria estratégica de gestão, legislação ambiental e lucratividade extrema. O Especialista IA correlaciona dados operacionais com as leis de descarte e estratégias comerciais para servir como o escudo jurídico da oficina.",funcionalidades:["Mentoria Jurídica: Domina a Lei do Desmanche (12.977/14), descartes PNRS, descarte de óleo e multas da Vigilância Sanitária.","Assessoria Comercial: Analisa as regras da Máquina de Retorno (180 dias para óleo, 365 dias para revisões) e fidelização ativa.","Prevenção Financeira: Detecta margens vermelhas e ensina a reprecificar com foco no lucro real."],exemplos_perguntas:["O que o Especialista IA faz?","Como você me ajuda com leis ambientais?","Como posso aumentar meu lucro real usando a IA?"],tags:["especialista","mentor","dúvida","inteligência","leis","estratégia"]}},ABAS_SISTEMA:{AJUSTES:{nome:"Ajustes",icone:"⚙️",descricao:"Personalização de logos, cabeçalhos e configurações operacionais.",configuracoes:["Logo e branding (aparece em O.S. e NF)","Cabeçalho de O.S. customizado","Garantia padrão (ex: 30 dias para serviços)","Chaves PIX para recebimento","Formas de pagamento aceitas","Margens padrão por tipo de serviço"],exemplos_perguntas:["Como colocar meu logo?","Qual é a garantia padrão que devo oferecer?","Como configurar minhas chaves PIX?"],tags:["ajustes","configuração","branding","pix"]},EQUIPE:{nome:"Equipe",icone:"👨‍💼",descricao:"Gestão de acessos e permissões. Define quem vê financeiro ou apenas abre O.S.",funcionalidades:["Cadastro de usuários (email + senha)","Atribuição de roles (Admin / Mecânico / Atendente / Consultor)","Permissões por módulo (financeiro privado, estoque visível, etc)","Histórico de alterações (quem fez o quê)"],roles_padrao:{ADMIN:"Acesso total (financeiro, estoque, gestão de equipe)",MECANICO:"Vê apenas suas tarefas e O.S. abertas (sem acesso a financeiro)",ATENDENTE:"Abre O.S. e consulta cliente, mas sem acesso a custos/lucro",CONSULTOR:"Acesso de leitura a relatórios, sem permissão de edição"},exemplos_perguntas:["Como criar um novo usuário?","Qual é a diferença entre Mecânico e Atendente?","Posso restringir acesso ao financeiro?"],tags:["equipe","usuários","permissões","roles","acesso"]},MARKETING:{nome:"Marketing",icone:"📢",descricao:"Disparos automáticos via WhatsApp e criação de promoções baseadas em baixa demanda.",funcionalidades:["Campanhas automáticas (ex: 'Tempo de revisão?' para clientes parados há 3 meses)","Criação de promoções (ex: '20% em freio para clientes bronze')","Disparos em massa via WhatsApp com template customizado","A/B testing de mensagens","Relatório de conversão por campanha"],exemplos_ia:["IA identifica clientes que precisam de revisão e dispara aviso automático","IA sugere promo para serviços com baixa demanda (ex: ar-condicionado no inverno)"],exemplos_perguntas:["Como enviar uma mensagem em massa?","Quais promoções funcionam melhor?","Posso automatizar campanhas?"],tags:["marketing","whatsapp","promoção","campanha"]},AJUDA:{nome:"Ajuda",icone:"❓",descricao:"Biblioteca de tutoriais e acesso direto ao Especialista IA para dúvidas de gestão.",conteudo:["Guia de uso por módulo","FAQ de problemas comuns","Vídeos de treinamento","Chat direto com Especialista IA (você agora!)"],exemplos_perguntas:["Como funciona o Forecast?","Qual é a fórmula do lucro?","Como aumentar meu faturamento?"],tags:["ajuda","tutorial","faq","suporte"]}}};function X(t){const h=[];return Object.entries(f.ABAS_GESTAO).forEach(([d,e])=>{e.tags&&e.tags.includes(t.toLowerCase())&&h.push({categoria:"GESTÃO",chave:d,nome:e.nome,descricao:e.descricao})}),Object.entries(f.ABAS_SISTEMA).forEach(([d,e])=>{e.tags&&e.tags.includes(t.toLowerCase())&&h.push({categoria:"SISTEMA",chave:d,nome:e.nome,descricao:e.descricao})}),h}function T(t){const d={visao_geral:()=>{const e=f.ABAS_GESTAO.VISAO_GERAL;return`
        ABA ATIVA: ${e.nome}
        DESCRIÇÃO: ${e.descricao}
        MÓDULOS: ${e.modulos_ativos.join(", ")}
        
        Dica: Se o faturamento está zerado, ative o Forecast para prever receita
        com base em O.S. abertas. Use perguntas como: "Quanto vou faturar?"
      `},estoque:()=>{const e=f.ABAS_GESTAO.ESTOQUE;return`
        ABA ATIVA: ${e.nome}
        DESCRIÇÃO: ${e.descricao}
        
        FUNCIONALIDADES:
        ${e.funcionalidades.map(o=>`  • ${o}`).join(`
`)}
        
        INSIGHTS: ${e.insights_ia.join(" | ")}
        
        Dica: Analise o giro ABC para identificar peças paradas (sucata)
      `},financeiro:()=>{const e=f.ABAS_GESTAO.FINANCEIRO,o=e.modulos.FORECAST_INTELIGENTE;return`
        ABA ATIVA: ${e.nome}
        DESCRIÇÃO: ${e.descricao}
        
        ⭐ DESTAQUE - FORECAST INTELIGENTE:
        Como funciona: ${o.como_funciona}
        Benefício: ${o.beneficio}
        Exemplo: ${o.exemplo}
        
        Dica: Use o Forecast para planejar compras e fluxo de caixa
      `},clientes:()=>{const e=f.ABAS_GESTAO.CLIENTES;return`
        ABA ATIVA: ${e.nome}
        DESCRIÇÃO: ${e.descricao}
        
        INSIGHTS DA IA:
        ${e.insights_ia.map(o=>`  • ${o}`).join(`
`)}
        
        Dica: Use a segmentação (Ouro/Prata/Bronze) para campanhas
        personalizadas via WhatsApp
      `},nota_fiscal:()=>{const e=f.ABAS_GESTAO.NOTA_FISCAL;return`
        ABA ATIVA: ${e.nome}
        
        MÓDULO ASSISTENTE FISCAL:
        ${e.assistente_fiscal.funcionalidades.map(o=>`  • ${o}`).join(`
`)}
        
        Dica: Consulte o Assistente Fiscal para otimizar impostos
      `},retorno:()=>{const e=f.ABAS_GESTAO.RETORNO;return`
        ABA ATIVA: ${e.nome}
        DESCRIÇÃO: ${e.descricao}
        
        REGRAS DE RETORNO PREVENTIVO:
        • Óleo: ${e.regras_preditivas.oleo}
        • Revisão: ${e.regras_preditivas.revisao}
        • Filtros: ${e.regras_preditivas.filtros}
        • Ação: ${e.regras_preditivas.acao}
        
        💡 ASSISTENTE DE LUCRO REAL (MARGENS):
        ${e.lucro_real.descricao}
        Diagnóstico Crítico: ${e.lucro_real.diagnostico}
        
        DICA IA: Se o serviço estiver com margem vermelha (< 20%), use o Assistente de Preço para reprecificar a hora técnica ou renegociar o custo de peças. Aborde o cliente de forma motivada para agendar a preventiva!
      `},burocracias:()=>{const e=f.ABAS_GESTAO.BUROCRACIAS;return`
        ABA ATIVA: ${e.nome}
        DESCRIÇÃO: ${e.descricao}
        
        FUNCIONALIDADES CRÍTICAS:
        ${e.funcionalidades.map(o=>`  • ${o}`).join(`
`)}
        
        DICA IA: Mantenha o descarte de óleo nos últimos 90 dias e sucata metálica nos últimos 180 dias para manter o Selo de Oficina Blindada ativo e utilizá-lo comercialmente!
      `},migracao:()=>{const e=f.ABAS_GESTAO.MIGRACAO;return`
        ABA ATIVA: ${e.nome}
        DESCRIÇÃO: ${e.descricao}
        
        ETAPAS DO MOTOR DE DADOS:
        ${e.etapas.map(o=>`  • ${o}`).join(`
`)}
        
        RECURSOS ESTRATÉGICOS:
        ${e.beneficios.map(o=>`  • ${o}`).join(`
`)}
        
        DICA IA: Sugira ao dono importar o backup antigo em Excel/CSV para caçar 'orçamentos perdidos' e reativar 'dorminhocos' imediatamente!
      `},especialista:()=>{const e=f.ABAS_GESTAO.ESPECIALISTA;return`
        ABA ATIVA: ${e.nome}
        DESCRIÇÃO: ${e.descricao}
        
        CONHECIMENTOS INTEGRADOS:
        ${e.funcionalidades.map(o=>`  • ${o}`).join(`
`)}
        
        DICA IA: Você está em modo de autoconhecimento! Lembre o dono de que você é o mentor 24h dele para blindar juridicamente a oficina e garantir lucro real em cada ordem de serviço!
      `},desmanche:()=>{const e=f.ABAS_GESTAO.DESMANCHE,o=e.leis_ambientais_e_criminais;return`
        ABA ATIVA: ${e.nome}
        DESCRIÇÃO: ${e.descricao}
        
        LEIS E REGRAS DE COMPLIANCE:
        • Lei 12.977/14: ${o.lei_12977}
        • Descontaminação Ambiental: ${o.descontaminacao}
        • Risco Criminal: ${o.receptacao}
        
        CHECKLIST OBRIGATÓRIO:
        ${e.funcionalidades.map(p=>`  • ${p}`).join(`
`)}
        
        DICA IA: Alerte firmemente o usuário que desmontar carros sem baixa no Detran ou vender peças sem selo de rastreabilidade é crime de receptação. O sistema bloqueia o status 'Desmontado' se a descontaminação não for atestada para protegê-lo de sanções ecológicas do CONAMA!
      `},sistema:()=>`
        VOCÊ ESTÁ EM: Menu de Sistema (Configurações)
        
        Abas disponíveis:
        1. AJUSTES - Logo, chaves PIX, garantia padrão
        2. EQUIPE - Usuários e permissões
        3. MARKETING - Campanhas automáticas
        4. AJUDA - Tutoriais e suporte
        
        Dica: Configure AJUSTES primeiro para aparecer logo na O.S.
      `}[t.toLowerCase()];return d?d():`Aba não reconhecida: ${t}. Consulte o Menu de Gestão.`}const W=(t="visao_geral")=>{const{analyzeText:h,loading:d}=Y(),[e,o]=n.useState(()=>[{role:"assistant",content:"Olá! 🚀 Sou seu Especialista Particular Express Auto Tech. Conheço cada detalhe do sistema — Forecast, Fiscal, O.S., Estoque e tudo mais. Como posso te ajudar a lucrar mais hoje?",timestamp:Date.now()}]),[p,v]=n.useState(""),[g,r]=n.useState(!1),c=n.useRef(null),u=n.useRef(null),b=n.useCallback(m=>["faturamento","forecast","ticket","margem","lucro","estoque","giro","clientes","crm","fiscal","nota","financeiro","peças","fornecedor","os","ordem serviço","desmanche","patrimônio","marketing","burocracia","sucata","alvará","selo","migracao","dados","especialista","lei","detran","conama","receptacao"].filter(l=>m.toLowerCase().includes(l)||m.toLowerCase().includes(l.split(" ")[0])),[]),I=n.useCallback(m=>{const s=b(m);if(s.length===0)return T(t);let l="";return s.forEach(i=>{const A=X(i);A.length>0&&(l+=`
📌 Relacionado a "${i}":
`,A.forEach(S=>{l+=`   • ${S.nome}: ${S.descricao.substring(0,100)}...
`}))}),l.trim()||(l=T(t)),l},[t,b]),C=n.useCallback(()=>e.slice(-10).map(s=>`${s.role.toUpperCase()}: ${s.content}`).join(`

`),[e]),N=n.useCallback(async()=>{if(!p.trim()||d)return;const m={role:"user",content:p,timestamp:Date.now()},s=[...e,m];o(s),v("");const l=T(t),i=I(p),A=C(),S=`
╔════════════════════════════════════════════════════════════════╗
║         ESPECIALISTA IA - EXPRESS AUTO TECH                    ║
║  Seu assistente de gestão de oficinas com foco em LUCRO        ║
╚════════════════════════════════════════════════════════════════╝

IDENTIDADE:
- Nome: Especialista IA
- Expertise: Forecast Inteligente, Fiscal, O.S., Estoque, CRM
- Linguagem: Direto, prático, com emojis. Zero parolagem.
- Objetivo: Aumentar faturamento e lucro do dono de oficina

REGRAS RÍGIDAS:
1. PROIBIDO saudações genéricas ("Olá novamente", "Bem-vindo")
2. Analisa SEMPRE o contexto específico da aba ativa
3. Responde com dados concretos (números, fórmulas, exemplos)
4. Foca em AÇÃO: não explica, recomenda e como fazer
6. Se perguntado "o que é a aba burocracia?", responda EXATAMENTE: "A aba Burocracias é o seu escudo jurídico. Lá você controla seus alvarás, registra o descarte correto de óleo e sucata metálica (evitando multas da Vigilância Sanitária) e conquista o Selo de Oficina Blindada."
7. Se algo está zerado/vazio, DIAGNOSTICA por quê

ABA ATIVA: ${t}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTEXTO DA ABA:
${l}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BASE DE CONHECIMENTO (RAG):
${i}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HISTÓRICO DA CONVERSA (últimas mensagens):
${A}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MENSAGEM DO USUÁRIO: "${p}"

ANALISA E RESPONDE:
- Com base no contexto da aba + conhecimento relevante
- Números concretos (exemplos, cálculos)
- Tom direto: recomendação clara de ação
- Máximo 3-4 parágrafos, sem enrolação
    `;try{const w=(await h(S)).replace(/^"|"$/g,"").replace(/\\n/g,`
`).trim();o($=>[...$,{role:"assistant",content:w,timestamp:Date.now()}])}catch(x){console.error("Erro ao chamar IA:",x),o(w=>[...w,{role:"assistant",content:"⚠️ Tive um soluço técnico na minha análise. Repita a pergunta ou reformule.",timestamp:Date.now()}])}},[p,e,d,t,h,I,C]),D=n.useCallback(()=>{if(!("webkitSpeechRecognition"in window||"SpeechRecognition"in window)){alert("Seu navegador não suporta reconhecimento de voz");return}const m=window.SpeechRecognition||window.webkitSpeechRecognition,s=new m;s.lang="pt-BR",s.continuous=!1,s.interimResults=!1,s.onstart=()=>r(!0),s.onresult=l=>{const i=l.results[0][0].transcript;v(A=>A?A+" "+i:i)},s.onerror=l=>{console.error("Erro ao reconhecer voz:",l),r(!1)},s.onend=()=>r(!1),c.current=s,s.start()},[]),O=n.useCallback(()=>{c.current&&(c.current.stop(),r(!1))},[]),E=n.useCallback(()=>{o([{role:"assistant",content:"Chat reiniciado! 🔄 Como posso ajudar a aumentar seu lucro hoje?",timestamp:Date.now()}]),v("")},[]),R=n.useCallback((m="json")=>{if(m==="json")return JSON.stringify(e,null,2);if(m==="markdown")return e.map(s=>`**${s.role.toUpperCase()}:**
${s.content}

---
`).join(`
`)},[e]);return{chat:e,mensagem:p,setMensagem:v,loading:d,ouvindo:g,fimDoChatRef:u,enviarMensagem:N,iniciarVoz:D,pararVoz:O,limparChat:E,exportarHistorico:R,contextoAtual:T(t)}};function ae({onBack:t,isFloating:h,abaAtiva:d="visao_geral",t:e,tema:o}){const{chat:p,mensagem:v,setMensagem:g,loading:r,ouvindo:c,fimDoChatRef:u,enviarMensagem:b,iniciarVoz:I,pararVoz:C,limparChat:N,exportarHistorico:D}=W(d),[O,E]=n.useState(!1);n.useEffect(()=>{u.current?.scrollIntoView({behavior:"smooth"})},[p,u]);const R=()=>{b(),E(!1)},m=i=>{i.key==="Enter"&&!i.shiftKey&&(i.preventDefault(),R())},s=()=>{c?C():I()},l=()=>{const i=D("json"),A=new Blob([i],{type:"application/json"}),S=URL.createObjectURL(A),x=document.createElement("a");x.href=S,x.download=`chat-especialista-${Date.now()}.json`,x.click(),E(!1)};return a.jsxs("div",{className:`w-full h-full flex flex-col ${e?.bg||"bg-black"} overflow-hidden transition-all duration-300`,children:[a.jsxs("div",{className:`${e?.card||"bg-black/70"} backdrop-blur-lg border-b ${e?.border||"border-neutral-900/50"} px-4 py-4 flex items-center justify-between`,children:[a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsx("div",{className:"w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center animate-pulse",children:a.jsx(G,{size:20,className:"text-white"})}),a.jsxs("div",{children:[a.jsxs("h2",{className:`text-sm font-black uppercase tracking-tight ${e?.text||"text-white"}`,children:["Especialista ",a.jsx("span",{className:"text-red-500",children:"IA"})]}),a.jsx("p",{className:`text-[10px] ${e?.textMuted||"text-neutral-400"} font-medium`,children:"Express Auto Tech"})]})]}),a.jsx("button",{onClick:t,className:`p-2 hover:${e?.bgCard||"bg-neutral-900"} rounded-lg transition-all duration-200 ${e?.textMuted||"text-neutral-400"} hover:${e?.text||"text-white"}`,title:"Voltar",children:a.jsx(L,{size:18})})]}),a.jsxs("div",{className:"flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent",children:[p.map((i,A)=>a.jsx("div",{className:`flex ${i.role==="user"?"justify-end":"justify-start"} animate-fade-in`,style:{animation:"fadeIn 0.3s ease-out forwards",animationDelay:`${A*50}ms`},children:a.jsxs("div",{className:`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-200 ${i.role==="user"?"bg-red-600/20 border border-red-600/40 "+(o==="light"?"text-zinc-900":"text-white")+" shadow-lg shadow-red-600/10":(e?.card||"bg-neutral-900/80")+" border "+(e?.border||"border-neutral-800/50")+" "+(e?.text||"text-neutral-100")+" shadow-lg shadow-black/20"}`,children:[a.jsx("p",{className:"text-[10px] font-bold opacity-40 mb-1.5 uppercase tracking-wider",children:i.role==="user"?"👤 Você":"🤖 Especialista"}),a.jsx("p",{className:"whitespace-pre-wrap break-words",children:i.content}),a.jsx("p",{className:"text-[9px] opacity-30 mt-1.5 text-right",children:new Date(i.timestamp).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})})]})},A)),r&&a.jsx("div",{className:"flex justify-start",children:a.jsxs("div",{className:"bg-neutral-900/80 border border-neutral-800/50 px-4 py-3 rounded-2xl flex items-center gap-2",children:[a.jsxs("div",{className:"flex gap-1",children:[a.jsx("div",{className:"w-2 h-2 rounded-full bg-red-500 animate-bounce"}),a.jsx("div",{className:"w-2 h-2 rounded-full bg-red-500 animate-bounce",style:{animationDelay:"0.1s"}}),a.jsx("div",{className:"w-2 h-2 rounded-full bg-red-500 animate-bounce",style:{animationDelay:"0.2s"}})]}),a.jsx("span",{className:"text-neutral-400 text-xs",children:"Analisando..."})]})}),a.jsx("div",{ref:u})]}),a.jsxs("div",{className:`${e?.card||"bg-black/70"} backdrop-blur-lg border-t ${e?.border||"border-neutral-900/50"} p-4 space-y-3`,children:[a.jsx("div",{className:"relative",children:a.jsxs("div",{className:`flex gap-2 items-end ${e?.bg||"bg-neutral-900/60"} border ${e?.border||"border-neutral-800"} rounded-2xl px-3 py-2 transition-all duration-200 hover:border-neutral-700 focus-within:border-red-600/50 focus-within:shadow-lg focus-within:shadow-red-600/10`,children:[a.jsx("button",{onClick:s,disabled:r,className:`p-2 rounded-full transition-all duration-200 flex-shrink-0 ${c?"bg-red-600 text-white shadow-lg shadow-red-600/50":(e?.bgCard||"bg-neutral-800")+" "+(e?.textMuted||"text-neutral-400")+" hover:"+(e?.text||"text-white")+" hover:bg-neutral-700"} disabled:opacity-50`,title:c?"Parar gravação":"Iniciar gravação de voz",children:c?a.jsx(Q,{size:16}):a.jsx(F,{size:16})}),a.jsx("textarea",{value:v,onChange:i=>g(i.target.value),onKeyPress:m,placeholder:"O que você quer saber para lucrar mais?",className:`flex-1 bg-transparent ${e?.text||"text-white"} text-sm outline-none resize-none max-h-24 py-1`,rows:"1",disabled:r,style:{scrollbarWidth:"thin",scrollbarColor:"#404040 transparent"}}),a.jsx("button",{onClick:R,disabled:r||!v.trim(),className:"p-2 rounded-full transition-all duration-200 flex-shrink-0 bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed",title:"Enviar mensagem",children:a.jsx(q,{size:16})}),a.jsxs("div",{className:"relative",children:[a.jsx("button",{onClick:()=>E(!O),className:"p-2 rounded-full transition-all duration-200 text-neutral-400 hover:text-white hover:bg-neutral-800",title:"Mais ações",children:"⋮"}),O&&a.jsxs("div",{className:"absolute right-0 bottom-full mb-2 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl shadow-black/50 overflow-hidden z-50 min-w-[180px]",children:[a.jsxs("button",{onClick:()=>{N(),E(!1)},className:"w-full px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 transition-colors",children:[a.jsx(K,{size:14}),"Limpar chat"]}),a.jsxs("button",{onClick:l,className:"w-full px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 transition-colors border-t border-neutral-800",children:[a.jsx(V,{size:14}),"Exportar histórico"]})]})]})]})}),a.jsxs("div",{className:"text-[10px] text-neutral-500 px-2 flex items-center gap-2",children:[a.jsx("span",{className:"inline-block w-1 h-1 rounded-full bg-neutral-600"}),a.jsxs("span",{children:["Aba ativa: ",a.jsx("strong",{className:"text-neutral-400",children:d})]})]})]}),a.jsx("style",{children:`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thumb-neutral-800::-webkit-scrollbar-thumb {
          background-color: rgba(38, 38, 38, 0.5);
          border-radius: 3px;
        }

        .scrollbar-thumb-neutral-800::-webkit-scrollbar-thumb:hover {
          background-color: rgba(64, 64, 64, 0.7);
        }

        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `})]})}export{ae as A,K as R,Y as u};
