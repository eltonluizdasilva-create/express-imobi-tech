import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/* ============================================================================
 * DEV ONLY — /api/ai local
 * ----------------------------------------------------------------------------
 * Em produção quem executa o handler é a Vercel (api/ai.js). No `vite dev` não
 * existe runtime serverless, então este middleware:
 *   1. carrega o .env e mapeia  VITE_*_API_KEY  ->  *_API_KEY  (sem prefixo)
 *   2. monta req/res no formato que o handler espera
 *   3. executa o handler real (mesmo arquivo de produção)
 *
 * Além disso, esta rede local não resolve DNS (o resolvedor do provedor não
 * responde). Para o dev continuar funcionando, o fetch global é substituído
 * por uma versão que resolve via DoH (8.8.8.8) e conecta por IP com curl.
 * Desligue com DEV_AI_DOH=0 se a rede voltar ao normal.
 * ========================================================================== */

function lerArquivoEnv(arquivo) {
  const caminho = join(process.cwd(), arquivo)
  if (!existsSync(caminho)) return {}
  const saida = {}
  for (const linha of readFileSync(caminho, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    saida[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
  return saida
}

/**
 * ORDEM DE PRIORIDADE: .env  >  .env.local
 *
 * O Vite (loadEnv) faz o contrário: .env.local vence .env. Neste projeto o
 * .env.local é antigo (set/2026) e tem uma GROQ key diferente/revogada, então
 * o painel local cairia em 401. Aqui o .env manda, como o operador espera.
 */
function mapearEnv() {
  const principal = lerArquivoEnv('.env')
  const local = lerArquivoEnv('.env.local')

  const pares = {
    DEEPSEEK_API_KEY: 'VITE_DEEPSEEK_API_KEY',
    GROQ_API_KEY: 'VITE_GROQ_API_KEY',
    GEMINI_API_KEY: 'VITE_GEMINI_API_KEY',
    ZHIPU_API_KEY: 'VITE_ZHIPU_API_KEY',
    SILICONFLOW_API_KEY: 'VITE_SILICONFLOW_API_KEY',
  }

  const aplicadas = []
  for (const [destino, origem] of Object.entries(pares)) {
    const dePrincipal = principal[origem]
    const deLocal = local[origem]
    const valor = dePrincipal || deLocal
    if (!valor) continue
    process.env[destino] = valor
    aplicadas.push(`${destino}${dePrincipal ? ' (.env)' : ' (.env.local)'}`)
  }
  return aplicadas
}

function instalarFetchViaDoH() {
  if (process.env.DEV_AI_DOH === '0' || globalThis.__devAiFetchDoh) return
  const cache = new Map()
  const ipDe = (host) => {
    if (cache.has(host)) return cache.get(host)
    const saida = execFileSync('curl', ['-sk', '-m', '10', `https://8.8.8.8/resolve?name=${host}&type=A`], { encoding: 'utf8' })
    const ip = (JSON.parse(saida).Answer || []).find((a) => a.type === 1)?.data
    cache.set(host, ip)
    return ip
  }

  globalThis.fetch = async (url, init = {}) => {
    const alvo = new URL(String(url))
    const ip = ipDe(alvo.hostname)
    const headers = { ...(init.headers || {}) }
    if (!Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')) {
      headers['Content-Type'] = 'application/json'
    }
    const args = ['-sk', '-m', '60', '--resolve', `${alvo.hostname}:443:${ip}`, '-X', init.method || 'GET', '-w', '\n%{http_code}']
    for (const [k, v] of Object.entries(headers)) args.push('-H', `${k}: ${v}`)
    if (init.body) args.push('--data-binary', init.body)
    args.push(String(url))

    const bruto = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
    const corte = bruto.lastIndexOf('\n')
    const status = Number(bruto.slice(corte + 1).trim()) || 0
    const corpo = bruto.slice(0, corte)
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => corpo,
      json: async () => JSON.parse(corpo),
    }
  }
  globalThis.__devAiFetchDoh = true
}

function devApiAi() {
  return {
    name: 'dev-api-ai',
    apply: 'serve',
    configureServer(server) {
      // Adaptador que dá ao handler serverless o mesmo req/res da Vercel.
      const montar = (rota, carregar) => {
        server.middlewares.use(rota, async (req, res) => {
          const responderErro = (codigo, mensagem) => {
            res.statusCode = codigo
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: mensagem, dev: true }))
          }

          try {
            const partes = []
            for await (const bloco of req) partes.push(bloco)
            const bruto = Buffer.concat(partes).toString('utf8')

            req.body = bruto ? JSON.parse(bruto) : {}
            const url = new URL(req.url || '/', 'http://localhost')
            req.query = Object.fromEntries(url.searchParams)
            req.socket = req.socket || {}

            res.status = (c) => { res.statusCode = c; return res }
            res.json = (obj) => {
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify(obj))
              return res
            }

            const { default: handler } = await carregar()
            await handler(req, res)
          } catch (erro) {
            server.config.logger.error(`[dev ${rota}] ${erro?.message || erro}`)
            if (!res.writableEnded) responderErro(500, String(erro?.message || erro))
          }
        })
      }

      montar('/api/ai', () => import('./api/ai.js'))
      montar('/api/places', () => import('./api/places.js'))
    },
  }
}

export default defineConfig(({ mode }) => {
  const carregadas = mapearEnv()
  instalarFetchViaDoH()
  if (carregadas.length) {
    console.log(`[dev /api/ai] env: ${carregadas.join(' | ')}`)
  } else {
    console.warn('[dev /api/ai] nenhuma chave encontrada no .env — /api/ai vai responder 503')
  }

  return {
    base: './',
    server: {
      port: 5173,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
    },
    plugins: [
      react(),
      devApiAi(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        workbox: {
          maximumFileSizeToCacheInBytes: 4000000,
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          // Depois de um deploy o service worker antigo podia continuar
          // servindo o index.html e os chunks da versão anterior. Estas três
          // opções descartam o cache velho e ativam o SW novo na hora.
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          navigateFallbackDenylist: [/^\/api\//],
        },
        manifest: {
          name: 'Express Auto Tech Express',
          short_name: 'OficinaIA',
          description: 'Gerador de Checklist Automotivo com IA',
          theme_color: '#1a1a1a',
          background_color: '#1a1a1a',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
      }),
    ],
  }
})
