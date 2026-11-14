/**
 * bot.js
 * 
 * Script principal de execução em produção do Hermes Agent Bot (Telegram).
 * Adequado para Railway, Render, Fly.io, PM2, Docker e servidores VPS.
 * Inclui auto-reconexão, monitorização de saúde e encerramento gracioso.
 */

import { hermesAgentConnector } from './hermesAgentConnector.js';
import { leadStore } from './leadStore.js';

console.log('====================================================');
console.log('🤖 EXPRESS AUTO TECH - HERMES AGENT TELEGRAM BOT');
console.log('====================================================');
console.log(`[SYSTEM] Data/Hora de Início: ${new Date().toISOString()}`);
console.log(`[SYSTEM] Plataforma de Produção Ativa.`);

// Teste inicial do Lead Store
try {
  const stats = leadStore.getStats();
  console.log(`[DATABASE] LeadStore operacional. Total de leads acumulados: ${stats.totalLeads}`);
} catch (err) {
  console.error('[DATABASE ERROR] Falha ao verificar estatísticas iniciais:', err.message);
}

// Iniciar o serviço de Long Polling para o Telegram
try {
  hermesAgentConnector.startPolling(2000);
  console.log('✅ [HERMES BOT] Polling iniciado com sucesso! Escutando mensagens...');
} catch (error) {
  console.error('❌ [HERMES BOT ERROR] Erro fatal ao iniciar o bot:', error.message);
  process.exit(1);
}

// Tratamento de Encerramento Gracioso (Graceful Shutdown)
const gracefulShutdown = (signal) => {
  console.log(`\n[SYSTEM] Sinal ${signal} recebido. A encerrar o Hermes Agent de forma graciosa...`);
  hermesAgentConnector.stopPolling();
  console.log('[SYSTEM] Hermes Agent desligado com sucesso. Até à próxima!');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Capturar erros não tratados
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Erro crítico não capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION] Rejeição de Promise não tratada:', reason);
});
