/**
 * leadStore.js
 * 
 * Módulo de Persistência de Dados Robusta e Centralizada na Nuvem (Firebase Firestore / Supabase).
 * Regista automaticamente contactos, mensagens, intenções detetadas e histórico de conversas do Telegram e Web Chat.
 */

import fs from 'fs';
import path from 'path';

// Carregar variáveis de ambiente no Node.js
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
      // Ignorar no browser
    }
  }
};

loadEnvFile();

export class LeadStore {
  constructor(options = {}) {
    this.filePath = options.filePath || path.resolve(process.cwd(), 'leads.json');
    this.supabaseUrl = options.supabaseUrl || process.env.SUPABASE_URL || null;
    this.supabaseKey = options.supabaseKey || process.env.SUPABASE_KEY || null;
    this.firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID || 'express-ai-automation';
    this.firebaseApiKey = process.env.VITE_FIREBASE_API_KEY || null;
    this._ensureStoreExists();
  }

  _ensureStoreExists() {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf8');
      }
    } catch (error) {
      // Silencioso se estiver em ambiente sem acesso ao FS
    }
  }

  getAllLeads() {
    try {
      this._ensureStoreExists();
      const content = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(content || '[]');
    } catch (error) {
      return [];
    }
  }

  /**
   * Sincroniza o registo do lead com o Supabase via REST API
   */
  async _syncToSupabase(leadData) {
    if (!this.supabaseUrl || !this.supabaseKey) return;

    try {
      const endpoint = `${this.supabaseUrl.replace(/\/$/, '')}/rest/v1/leads`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          telegram_id: leadData.telegramId,
          username: leadData.username,
          nome: leadData.name,
          mensagem: leadData.messageText,
          intent: leadData.intent,
          recomendacao: leadData.recommendation,
          resposta: leadData.replySent,
          plataforma: leadData.platform,
          data_registro: leadData.timestamp,
          status: leadData.status
        })
      });

      if (response.ok) {
        console.log(`[LeadStore Cloud Sync] ✅ Lead sincronizado com sucesso no Supabase!`);
      } else {
        const errorText = await response.text();
        console.warn(`[LeadStore Supabase Sync] Resposta Supabase (${response.status}): ${errorText}`);
      }
    } catch (err) {
      console.error('[LeadStore Supabase Sync Error]:', err.message);
    }
  }

  /**
   * Sincroniza o registo do lead com o Cloud Firestore via REST API
   */
  async _syncToFirestore(leadData) {
    if (!this.firebaseProjectId) return;

    try {
      const collectionPath = 'oficinas/default/leads';
      let url = `https://firestore.googleapis.com/v1/projects/${this.firebaseProjectId}/databases/(default)/documents/${collectionPath}`;
      if (this.firebaseApiKey) {
        url += `?key=${this.firebaseApiKey}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            nome: { stringValue: leadData.name || 'Cliente Telegram/Web' },
            telefone: { stringValue: leadData.username || leadData.telegramId ? String(leadData.telegramId) : 'Atendimento Online' },
            problema: { stringValue: leadData.messageText || '' },
            intent: { stringValue: leadData.intent || 'GENERAL_INQUIRY' },
            recomendacao: { stringValue: leadData.recommendation || '' },
            resposta: { stringValue: leadData.replySent || '' },
            plataforma: { stringValue: leadData.platform || 'telegram' },
            status: { stringValue: leadData.status || 'novo' },
            data_registro: { stringValue: leadData.timestamp }
          }
        })
      });

      if (response.ok) {
        console.log(`[LeadStore Cloud Sync] ✅ Lead gravado na nuvem Cloud Firestore!`);
      }
    } catch (err) {
      console.error('[LeadStore Firestore Sync Error]:', err.message);
    }
  }

  /**
   * Regista o lead no ficheiro local e sincroniza em tempo real com as bases de dados na nuvem.
   */
  async recordLead(user = {}, message = '', intentResult = {}) {
    const leads = this.getAllLeads();

    const nameParts = [user.first_name, user.last_name].filter(Boolean);
    const fullName = nameParts.length > 0 ? nameParts.join(' ') : (user.username || `User_${user.id || 'Web'}`);

    const leadEntry = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      telegramId: user.id || null,
      username: user.username ? `@${user.username}` : (user.email || null),
      name: fullName,
      languageCode: user.language_code || 'pt',
      isBot: user.is_bot || false,
      messageText: message,
      intent: intentResult.intent || 'GENERAL_INQUIRY',
      confidence: intentResult.confidence || 0,
      recommendation: intentResult.recommendation || null,
      replySent: intentResult.reply || null,
      platform: user.platform || 'telegram',
      timestamp: new Date().toISOString(),
      status: 'NOVO'
    };

    // 1. Guardar localmente para cópia de segurança
    leads.push(leadEntry);
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(leads, null, 2), 'utf8');
      console.log(`[LeadStore] Lead guardado localmente para ${fullName} (Intent: ${leadEntry.intent})`);
    } catch (error) {
      // Ignorar se sem acesso ao sistema de ficheiros
    }

    // 2. Sincronizar com bases de dados na Nuvem (Supabase e Firestore)
    await Promise.allSettled([
      this._syncToSupabase(leadEntry),
      this._syncToFirestore(leadEntry)
    ]);

    return leadEntry;
  }

  getLeadsByIntent(intent) {
    const leads = this.getAllLeads();
    return leads.filter(l => l.intent === intent);
  }

  getStats() {
    const leads = this.getAllLeads();
    const stats = {
      totalLeads: leads.length,
      byIntent: {},
      uniqueUsers: new Set(leads.map(l => l.telegramId || l.username)).size,
      lastLead: leads.length > 0 ? leads[leads.length - 1] : null
    };

    leads.forEach(l => {
      stats.byIntent[l.intent] = (stats.byIntent[l.intent] || 0) + 1;
    });

    return stats;
  }
}

export const leadStore = new LeadStore();
export default LeadStore;
