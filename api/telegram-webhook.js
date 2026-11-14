/**
 * api/telegram-webhook.js
 * 
 * Handler Serverless Function para Vercel / Netlify.
 * Recebe atualizações Webhook do Telegram em tempo real e responde via Vercel Edge/Node Functions.
 */

import { hermesAgentConnector } from '../hermesAgentConnector.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok', message: 'Endpoint Telegram Webhook Express Auto Tech' });
  }

  try {
    const update = req.body;
    if (update) {
      await hermesAgentConnector.processUpdate(update);
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[Vercel Telegram Webhook Error]:', error);
    return res.status(500).json({ error: error.message });
  }
}
