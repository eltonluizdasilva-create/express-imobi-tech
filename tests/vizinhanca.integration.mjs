/** Teste de integração REAL do raio-X de vizinhança (ViaCEP + Nominatim + Overpass). */
import { execFileSync } from 'node:child_process';
import { raioXDaVizinhanca, resumirParaIA } from '../src/services/vizinhancaService.js';

// fetch por DoH + curl --resolve (a rede local não resolve DNS)
const cache = new Map();
const ipDe = (host) => {
  if (cache.has(host)) return cache.get(host);
  const saida = execFileSync('curl', ['-sk', '-m', '10', `https://8.8.8.8/resolve?name=${host}&type=A`], { encoding: 'utf8' });
  const ip = (JSON.parse(saida).Answer || []).find((a) => a.type === 1)?.data;
  cache.set(host, ip);
  return ip;
};
globalThis.fetch = async (url, init = {}) => {
  const alvo = new URL(String(url));
  const ip = ipDe(alvo.hostname);
  const headers = { ...(init.headers || {}) };
  if (!Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json';
  // Overpass responde 406 ao UA padrao do curl
  headers['User-Agent'] = 'ExpressImobiTech/1.0 (avaliacao imobiliaria)';
  const args = ['-sk', '-m', '60', '--resolve', `${alvo.hostname}:443:${ip}`, '-X', init.method || 'GET', '-w', '\n%{http_code}'];
  for (const [k, v] of Object.entries(headers)) args.push('-H', `${k}: ${v}`);
  if (init.body) args.push('--data-binary', String(init.body));
  args.push(String(url));
  const bruto = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  const corte = bruto.lastIndexOf('\n');
  const status = Number(bruto.slice(corte + 1).trim()) || 0;
  const corpo = bruto.slice(0, corte);
  return { ok: status >= 200 && status < 300, status, text: async () => corpo, json: async () => JSON.parse(corpo) };
};

const t0 = Date.now();
const viz = await raioXDaVizinhanca({ cep: '38400-100' }); // Av. Floriano Peixoto, Centro, Uberlândia
console.log(`tempo: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log('ok:', viz.ok, '| motivo:', viz.motivo || '-');
if (viz.ok) {
  console.log('endereço:', viz.endereco);
  console.log('coords:', viz.coords, '| fontes:', viz.fonteGeo, '/', (viz.fontePoi || '').split('/')[2]);
  console.log('nota:', viz.nota, '/100 —', viz.classificacao);
  console.log('contagem:', viz.contagem, '| total:', viz.total);
  console.log('\nprimeiros 12 pontos reais:');
  for (const p of viz.pontos.slice(0, 12)) console.log(`  ${String(p.metros).padStart(4)}m  ${p.categoria.padEnd(12)} ${p.nome}`);
  console.log('\nresumo para a IA:\n' + resumirParaIA(viz));
}

// caminho de erro: CEP inexistente não pode lançar exceção
const ruim = await raioXDaVizinhanca({ cep: '38400-000' }); // CEP genérico/inexistente
console.log('\nCEP inválido -> ok:', ruim.ok, '| motivo:', ruim.motivo, '| nota:', ruim.nota);
process.exit(viz.ok ? 0 : 1);
