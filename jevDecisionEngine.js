/**
 * jevDecisionEngine.js
 * 
 * Estrutura base do Motor de Decisão Jev (TypeSafe Integration).
 * Utiliza a variável de ambiente TYPESAFE_API_KEY para autenticação.
 * Inclui modo de simulação/fallback automático com suporte a comandos do Telegram e classificador de intenções.
 */

import fs from 'fs';
import path from 'path';

// Carregar .env automaticamente em ambiente Node.js se não estiver no process.env
const loadEnvFile = () => {
  if (typeof process !== 'undefined' && process.cwd) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx !== -1) {
              const key = trimmed.substring(0, eqIdx).trim();
              const val = trimmed.substring(eqIdx + 1).trim();
              if (key && !process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        });
      }
    } catch (e) {
      // Ignorar erros em ambientes sem acesso ao sistema de ficheiros (ex: browser)
    }
  }
};

loadEnvFile();

// Obter a chave de API suportando Node.js (process.env) e Vite (import.meta.env)
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.TYPESAFE_API_KEY) {
    return process.env.TYPESAFE_API_KEY;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.TYPESAFE_API_KEY || import.meta.env.VITE_TYPESAFE_API_KEY;
  }
  return null;
};

export class JevDecisionEngine {
  /**
   * Inicializa o motor de decisão do Jev.
   * @param {Object} options Configurações adicionais (baseUrl, timeout, enableFallback, etc.)
   */
  constructor(options = {}) {
    this.apiKey = options.apiKey || getApiKey();
    this.baseUrl = options.baseUrl || 'https://api.typesafe.ai/v1/jev'; // URL base para a API do Jev
    this.timeout = options.timeout || 10000;
    this.enableFallback = options.enableFallback !== undefined ? options.enableFallback : true;

    if (!this.apiKey) {
      console.warn(
        '[JevDecisionEngine] AVISO: TYPESAFE_API_KEY não configurada. O modo de simulação/fallback automático está ATIVO.'
      );
    }
  }

  /**
   * Retorna os cabeçalhos padrão para requisições HTTP
   */
  _getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Api-Key': this.apiKey || ''
    };
  }

  /**
   * Classificador de intenções e detetor de comandos especiais do Telegram.
   * @param {string} text Texto da mensagem do utilizador.
   * @returns {Object} Intenção classificada, confiança, resposta recomendada e parseMode.
   */
  _classifyIntent(text) {
    if (!text || typeof text !== 'string') {
      return {
        intent: 'UNKNOWN',
        confidence: 0.0,
        reply: 'Não foi possível interpretar a mensagem recebida.',
        recommendation: 'SOLICITAR_REPETICAO'
      };
    }

    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();

    // === DETEÇÃO DE COMANDOS DO TELEGRAM (COMEÇADOS POR /) ===
    if (trimmed.startsWith('/')) {
      const command = lower.split(' ')[0].split('@')[0]; // Ex: /orcamento@bot -> /orcamento

      switch (command) {
        case '/start':
        case '/menu':
          return {
            intent: 'COMMAND_START',
            confidence: 1.0,
            reply: `🤖 *Bem-vindo ao Assistente Expresstech!*\n\nAqui estão os comandos disponíveis:\n• /orcamento - Solicitar orçamento ou consultar preços\n• /agendar - Agendar atendimento ou serviço\n• /ajuda - Falar com a nossa equipa de suporte`,
            recommendation: 'EXIBIR_MENU_COMANDOS',
            parseMode: 'Markdown'
          };

        case '/orcamento':
        case '/orçamento':
        case '/preco':
        case '/preço':
          return {
            intent: 'COMMAND_BUDGET',
            confidence: 1.0,
            reply: `💼 *Solicitação de Orçamento*\n\nPara receber uma cotação rápida, por favor envie:\n1. O tipo de serviço ou produto desejado\n2. Quantidade ou especificações técnicas\n\n_A nossa equipa responderá em breves minutos!_`,
            recommendation: 'INICIAR_FLUXO_ORCAMENTO',
            parseMode: 'Markdown'
          };

        case '/agendar':
        case '/agenda':
        case '/reserva':
          return {
            intent: 'COMMAND_SCHEDULE',
            confidence: 1.0,
            reply: `📅 *Agendamento de Atendimento*\n\nPara marcar o seu horário, envie:\n• Data desejada (Ex: 30/09)\n• Turno ou Horário preferencial (Manhã / Tarde)\n\n_Confirmaremos a sua vaga imediatamente!_`,
            recommendation: 'INICIAR_FLUXO_AGENDAMENTO',
            parseMode: 'Markdown'
          };

        case '/ajuda':
        case '/suporte':
        case '/help':
          return {
            intent: 'COMMAND_HELP',
            confidence: 1.0,
            reply: `🛠️ *Central de Ajuda & Suporte*\n\nPrecisa de assistência técnica ou esclarecimento?\n• Envie uma descrição do problema aqui no chat\n• Contacto de suporte: suporte@expresstech.com\n\n_Estamos disponíveis para o ajudar!_`,
            recommendation: 'EXIBIR_CANAIS_SUPORTE',
            parseMode: 'Markdown'
          };

        default:
          return {
            intent: 'COMMAND_UNKNOWN',
            confidence: 0.8,
            reply: `❓ *Comando não reconhecido*\n\nUtilize um dos comandos válidos:\n• /orcamento - Pedir orçamento\n• /agendar - Marcar agendamento\n• /ajuda - Suporte técnico`,
            recommendation: 'SUGERIR_COMANDOS_VALIDOS',
            parseMode: 'Markdown'
          };
      }
    }

    // === CLASSIFICAÇÃO DE MENSAGENS EM LINGUAGEM NATURAL ===

    // 1. Saudações
    if (/\b(olá|ola|oi|bom dia|boa tarde|boa noite|fala|hey|hello|iniciar)\b/i.test(lower)) {
      return {
        intent: 'GREETING',
        confidence: 0.95,
        reply: 'Olá! 👋 Bem-vindo ao assistente automático Expresstech. Como posso ajudar hoje?\n\n(Comandos disponíveis: /orcamento | /agendar | /ajuda)',
        recommendation: 'EXIBIR_MENU'
      };
    }

    // 2. Orçamento / Preço
    if (/\b(orçamento|orcamento|preço|preco|quanto custa|valor|cotação|cotacao|tabela)\b/i.test(lower)) {
      return {
        intent: 'BUDGET_INQUIRY',
        confidence: 0.90,
        reply: '💼 Para fornecer um orçamento ou tabela de preços personalizada, por favor descreva o serviço pretendido ou use o comando /orcamento.',
        recommendation: 'SOLICITAR_DETALHES_SERVICO'
      };
    }

    // 3. Agendamento
    if (/\b(agendar|agendamento|marcar|reserva|horario|horário|agenda|data|atendimento)\b/i.test(lower)) {
      return {
        intent: 'SCHEDULE_REQUEST',
        confidence: 0.92,
        reply: '📅 Com certeza! Para agendar o seu atendimento, informe o dia e horário preferencial ou use o comando /agendar.',
        recommendation: 'ABRIR_AGENDA'
      };
    }

    // 4. Suporte / Ajuda
    if (/\b(suporte|ajuda|problema|erro|dúvida|duvida|atendente|humano|reclamação|reclamacao)\b/i.test(lower)) {
      return {
        intent: 'SUPPORT_HELP',
        confidence: 0.93,
        reply: '🛠️ A nossa equipa de suporte está à sua disposição. Detalhe a sua dúvida ou use o comando /ajuda.',
        recommendation: 'ENCAMINHAR_SUPORTE'
      };
    }

    // 5. Intenção Padrão / Geral
    return {
      intent: 'GENERAL_INQUIRY',
      confidence: 0.70,
      reply: `Obrigado pelo seu contacto! Recebemos a sua mensagem: "${text}". O nosso motor de decisão está a analisar o seu pedido.`,
      recommendation: 'ANALISAR_MENSAGEM'
    };
  }

  /**
   * Gera uma resposta simulada estruturada baseada no classificador de intenções e comandos.
   */
  _getSimulatedEvaluation(inputData, context, reason) {
    const textContent = inputData?.messageText || inputData?.text || (typeof inputData === 'string' ? inputData : JSON.stringify(inputData));
    const intentAnalysis = this._classifyIntent(textContent);

    console.warn(`[JevDecisionEngine] [MODO SIMULAÇÃO] Intent: ${intentAnalysis.intent} (${reason})`);

    return {
      isSimulated: true,
      reason: reason,
      status: 'success',
      intent: intentAnalysis.intent,
      confidence: intentAnalysis.confidence,
      reply: intentAnalysis.reply,
      recommendation: intentAnalysis.recommendation,
      parseMode: intentAnalysis.parseMode || null,
      decisionId: `sim_${Date.now()}`,
      data: inputData,
      context: context,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Gera uma resposta simulada para execução de decisão.
   */
  _getSimulatedExecution(decisionId, payload, reason) {
    console.warn(`[JevDecisionEngine] [MODO SIMULAÇÃO] (${reason}) Executando decisão "${decisionId}".`);

    return {
      isSimulated: true,
      reason: reason,
      status: 'executed',
      decisionId: decisionId,
      result: {
        success: true,
        message: `Decisão '${decisionId}' executada com sucesso em modo de simulação local.`
      },
      payload: payload,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Avalia uma decisão ou regras através do Jev Decision Engine.
   * @param {Object} inputData Dados de entrada para análise e decisão.
   * @param {Object} context Contexto adicional (opcional).
   * @returns {Promise<Object>} Resultado da decisão processada pelo Jev ou Simulação.
   */
  async evaluate(inputData, context = {}) {
    if (!this.apiKey) {
      if (this.enableFallback) {
        return this._getSimulatedEvaluation(inputData, context, 'TYPESAFE_API_KEY não configurada');
      }
      throw new Error('[JevDecisionEngine] Impossível executar avaliação: TYPESAFE_API_KEY não configurada.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/evaluate`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify({
          data: inputData,
          context: context,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API do Jev (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('[JevDecisionEngine] Erro de comunicação com o Jev:', error.message);
      
      if (this.enableFallback) {
        return this._getSimulatedEvaluation(inputData, context, `Erro de rede/API: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Executa uma decisão específica ou ação recomendada pelo Jev.
   * @param {string} decisionId Identificador da decisão a ser executada.
   * @param {Object} payload Parâmetros da execução.
   * @returns {Promise<Object>} Resposta da execução ou Simulação.
   */
  async executeDecision(decisionId, payload = {}) {
    if (!this.apiKey) {
      if (this.enableFallback) {
        return this._getSimulatedExecution(decisionId, payload, 'TYPESAFE_API_KEY não configurada');
      }
      throw new Error('[JevDecisionEngine] Impossível executar decisão: TYPESAFE_API_KEY não configurada.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/decisions/${decisionId}/execute`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao executar decisão no Jev (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[JevDecisionEngine] Erro ao executar decisão ${decisionId}:`, error.message);
      
      if (this.enableFallback) {
        return this._getSimulatedExecution(decisionId, payload, `Erro de rede/API: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Verifica o estado da conexão e autenticação com a API do Jev.
   * @returns {Promise<boolean>} Retorna true se a conexão ou modo fallback estiver ativo.
   */
  async checkHealth() {
    if (!this.apiKey) return this.enableFallback;

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this._getHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('[JevDecisionEngine] Falha ao verificar healthcheck do Jev:', error.message);
      return this.enableFallback;
    }
  }
}

// Instância padrão pronta para uso rápida (com fallback ativado por defeito)
export const jevDecisionEngine = new JevDecisionEngine({ enableFallback: true });

export default JevDecisionEngine;
