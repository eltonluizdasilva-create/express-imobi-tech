/**
 * hermesAgentConnector.js
 * 
 * Gestor de integração do Hermes Agent com o Telegram.
 * Utiliza a variável de ambiente TELEGRAM_BOT_TOKEN e o jevDecisionEngine.js
 * para processar mensagens recebidas, responder aos utilizadores e registar
 * leads automaticamente no módulo leadStore.js.
 */

import { jevDecisionEngine } from './jevDecisionEngine.js';
import { leadStore } from './leadStore.js';

// Obter o Token do Bot Telegram suportando Node.js (process.env) e Vite (import.meta.env)
const getTelegramToken = () => {
  if (typeof process !== 'undefined' && process.env && process.env.TELEGRAM_BOT_TOKEN) {
    return process.env.TELEGRAM_BOT_TOKEN;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.TELEGRAM_BOT_TOKEN || import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  }
  return null;
};

export class HermesAgentConnector {
  /**
   * Construtor da integração Hermes / Telegram.
   * @param {Object} options Opções de configuração (token, decisionEngine, leadStore, etc.)
   */
  constructor(options = {}) {
    this.token = options.token || getTelegramToken();
    this.decisionEngine = options.decisionEngine || jevDecisionEngine;
    this.leadStore = options.leadStore || leadStore;
    this.apiBaseUrl = this.token ? `https://api.telegram.org/bot${this.token}` : null;
    this.isPolling = false;
    this.lastUpdateId = 0;
    this.pollingInterval = null;

    if (!this.token) {
      console.warn(
        '[HermesAgentConnector] AVISO: TELEGRAM_BOT_TOKEN não foi encontrado nas variáveis de ambiente nem nas opções.'
      );
    }
  }

  /**
   * Envia uma mensagem de texto para um chat do Telegram.
   * @param {number|string} chatId ID do chat no Telegram.
   * @param {string} text Texto da mensagem.
   * @param {Object} extraOptions Opções adicionais da Telegram Bot API (parse_mode, reply_markup, etc.)
   * @returns {Promise<Object>} Resposta da API do Telegram.
   */
  async sendMessage(chatId, text, extraOptions = {}) {
    if (!this.token) {
      throw new Error('[HermesAgentConnector] Impossível enviar mensagem: TELEGRAM_BOT_TOKEN não configurado.');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          ...extraOptions
        })
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(`Erro Telegram API (${data.error_code}): ${data.description}`);
      }
      return data.result;
    } catch (error) {
      console.error('[HermesAgentConnector] Erro ao enviar mensagem no Telegram:', error.message);
      throw error;
    }
  }

  /**
   * Processa uma atualização (update/mensagem) recebida do Telegram.
   * Encaminha o conteúdo para o jevDecisionEngine, regista o lead no leadStore
   * e responde ao utilizador com o campo .reply.
   * @param {Object} update Objeto Update do Telegram.
   * @returns {Promise<Object|null>} Resposta enviada ou null caso não seja mensagem de texto.
   */
  async processUpdate(update) {
    const message = update.message || update.edited_message;
    if (!message || !message.text) {
      return null;
    }

    const chatId = message.chat.id;
    const userText = message.text;
    const isCommand = userText.trim().startsWith('/');

    const userContext = {
      user: message.from,
      chat: message.chat,
      messageId: message.message_id,
      date: message.date,
      platform: 'telegram',
      isCommand: isCommand
    };

    console.log(`[HermesAgentConnector] Mensagem (${isCommand ? 'Comando' : 'Texto'}) de ${message.from?.first_name || chatId}: "${userText}"`);

    try {
      // 1. Processar a mensagem utilizando o Jev Decision Engine
      const decision = await this.decisionEngine.evaluate(
        { messageText: userText },
        userContext
      );

      // 2. Priorizar a extração direta do campo .reply retornado pelo motor inteligente Jev
      let responseText = '';
      if (decision && decision.reply) {
        responseText = decision.reply;
      } else if (typeof decision === 'string') {
        responseText = decision;
      } else if (decision && decision.text) {
        responseText = decision.text;
      } else if (decision && decision.recommendation) {
        responseText = `Recomendação Jev: ${decision.recommendation}`;
      } else {
        responseText = 'Mensagem processada pelo Hermes Agent.';
      }

      // 3. REGISTO / PERSISTÊNCIA DE LEADS (ETAPA 3)
      if (this.leadStore) {
        this.leadStore.recordLead(message.from, userText, decision);
      }

      // 4. Configurar opções adicionais como parse_mode (Markdown/HTML) se retornado pelo Jev
      const extraOptions = {};
      if (decision && decision.parseMode) {
        extraOptions.parse_mode = decision.parseMode;
      }

      console.log(`[HermesAgentConnector] Resposta Jev (Intent: ${decision?.intent || 'N/A'}): "${responseText.split('\n')[0]}..."`);

      // 5. Responder ao utilizador no Telegram com o texto contextualizado e formatado
      return await this.sendMessage(chatId, responseText, extraOptions);
    } catch (error) {
      console.error('[HermesAgentConnector] Erro ao processar mensagem com Jev:', error.message);
      const fallbackText = 'Desculpe, ocorreu um erro ao processar a sua mensagem com o motor de decisão Jev.';
      return await this.sendMessage(chatId, fallbackText);
    }
  }

  /**
   * Inicia o modo Long Polling para procurar novas mensagens no Telegram.
   * @param {number} intervalMs Intervalo em milissegundos entre consultas (padrão: 3000ms).
   */
  startPolling(intervalMs = 3000) {
    if (!this.token) {
      console.error('[HermesAgentConnector] Não é possível iniciar Polling sem TELEGRAM_BOT_TOKEN.');
      return;
    }

    if (this.isPolling) {
      console.log('[HermesAgentConnector] Polling já está ativo.');
      return;
    }

    this.isPolling = true;
    console.log('[HermesAgentConnector] Long Polling iniciado para o Telegram Bot...');

    const fetchUpdates = async () => {
      if (!this.isPolling) return;

      try {
        const response = await fetch(
          `${this.apiBaseUrl}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=10`
        );
        const data = await response.json();

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.lastUpdateId = update.update_id;
            await this.processUpdate(update);
          }
        }
      } catch (error) {
        console.error('[HermesAgentConnector] Erro durante o Polling:', error.message);
      }
    };

    fetchUpdates();
    this.pollingInterval = setInterval(fetchUpdates, intervalMs);
  }

  /**
   * Para o modo Long Polling.
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('[HermesAgentConnector] Polling parado.');
  }

  /**
   * Configura um Webhook para receber atualizações do Telegram.
   * @param {string} url URL pública para receber os Webhooks.
   * @returns {Promise<Object>} Resposta da Telegram API.
   */
  async setWebhook(url) {
    if (!this.token) {
      throw new Error('[HermesAgentConnector] TELEGRAM_BOT_TOKEN não configurado.');
    }

    const response = await fetch(`${this.apiBaseUrl}/setWebhook?url=${encodeURIComponent(url)}`);
    return await response.json();
  }
}

// Instância padrão para uso direto
export const hermesAgentConnector = new HermesAgentConnector();

export default HermesAgentConnector;
