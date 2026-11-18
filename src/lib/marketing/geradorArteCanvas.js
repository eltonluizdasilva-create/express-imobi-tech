/**
 * geradorArteCanvas.js — artes PNG do Estúdio de Posts
 * ============================================================================
 * Tudo desenhado no <canvas> do navegador: nenhum arquivo é enviado ao
 * servidor. As 4 capas conceituais são desenhadas por código (nada de banco de
 * imagens), então não há licença de terceiro envolvida.
 *
 * O módulo é importável no Node: nenhuma API de DOM é tocada no topo.
 * ============================================================================
 */
import { quebrarLinhas } from './estudio.js';

export const FORMATOS = {
  feed: { key: 'feed', label: 'Feed 1080×1080', w: 1080, h: 1080 },
  story: { key: 'story', label: 'Stories/Reels 1080×1920', w: 1080, h: 1920 },
};

export const VERDE = '#10b981';
export const PRETO = '#020408';

/** Medidas de layout por formato (puro — usado nos testes). */
export function medidas(formato = 'feed') {
  const base = FORMATOS[formato] || FORMATOS.feed;
  const margem = Math.round(base.w * 0.075);
  return {
    w: base.w,
    h: base.h,
    margem,
    seloY: Math.round(base.h * 0.09),
    headlineY: Math.round(base.h * (base.h > base.w ? 0.62 : 0.60)),
    headlineSize: Math.round(base.w * 0.088),
    bulletSize: Math.round(base.w * 0.040),
    bulletsGap: Math.round(base.w * 0.062),
    footerH: Math.round(base.h * 0.115),
    rodapeSize: Math.round(base.w * 0.024),
  };
}

export function formatarWhatsApp(bruto) {
  const d = String(bruto || '').replace(/\D/g, '');
  if (d.length === 13) return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`;
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  return String(bruto || '').slice(0, 24);
}

/** Rodapé obrigatório no modo conceitual; vazio no imóvel real. */
export function textoRodape(modo, ilustrativo = 'Imagem meramente ilustrativa • Condições sujeitas à análise') {
  return modo === 'conceitual' ? ilustrativo : '';
}

export function nomeArquivo(formato, modo) {
  const selo = modo === 'conceitual' ? 'conceito' : 'imovel';
  return `post-${selo}-${formato}-${Date.now()}.png`;
}

/* ------------------------------ utilidades ------------------------------- */

function lcg(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function gradiente(ctx, x0, y0, x1, y1, paradas) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  paradas.forEach(([p, cor]) => g.addColorStop(p, cor));
  return g;
}

function carregarImagem(url) {
  if (!url || typeof Image === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Desenha a imagem cobrindo a área (cover), centralizada. */
function desenharCover(ctx, img, x, y, w, h) {
  const escala = Math.max(w / img.width, h / img.height);
  const dw = img.width * escala;
  const dh = img.height * escala;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/* ------------------------- 4 capas arquitetônicas ------------------------ */

function fundoPredios(ctx, W, H) {
  const rnd = lcg(7);
  ctx.fillStyle = gradiente(ctx, 0, 0, 0, H, [[0, '#1b1035'], [0.45, '#7c2d5b'], [0.72, '#e0562f'], [1, '#f3a06a']]);
  ctx.fillRect(0, 0, W, H);

  // sol
  ctx.fillStyle = 'rgba(255, 214, 153, 0.95)';
  ctx.beginPath();
  ctx.arc(W * 0.72, H * 0.42, W * 0.10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 180, 120, 0.18)';
  ctx.beginPath();
  ctx.arc(W * 0.72, H * 0.42, W * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // prédios
  let x = -20;
  while (x < W) {
    const largura = W * (0.10 + rnd() * 0.09);
    const altura = H * (0.20 + rnd() * 0.30);
    ctx.fillStyle = `rgba(8, 6, 18, ${0.72 + rnd() * 0.2})`;
    ctx.fillRect(x, H - altura - H * 0.10, largura, altura);
    // janelas
    for (let j = 0; j < Math.floor(altura / (H * 0.045)); j += 1) {
      for (let i = 0; i < Math.floor(largura / (W * 0.028)); i += 1) {
        if (rnd() > 0.55) {
          ctx.fillStyle = `rgba(255, 214, 120, ${0.35 + rnd() * 0.5})`;
          ctx.fillRect(x + W * 0.010 + i * W * 0.028, H - altura - H * 0.10 + H * 0.030 + j * H * 0.045, W * 0.014, H * 0.018);
        }
      }
    }
    x += largura + W * 0.014;
  }
}

function fundoCasas(ctx, W, H) {
  ctx.fillStyle = gradiente(ctx, 0, 0, 0, H, [[0, '#0f2f4a'], [0.5, '#2f7fa8'], [1, '#a9d6c8']]);
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#123b2c';
  ctx.fillRect(0, H * 0.72, W, H * 0.28);
  ctx.fillStyle = '#1c5a41';
  ctx.beginPath();
  ctx.ellipse(W * 0.2, H * 0.74, W * 0.3, H * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  const casas = [
    { x: W * 0.06, w: W * 0.26, h: H * 0.20, telhado: '#8d3b28' },
    { x: W * 0.38, w: W * 0.30, h: H * 0.24, telhado: '#5b2a1c' },
    { x: W * 0.72, w: W * 0.24, h: H * 0.18, telhado: '#8d3b28' },
  ];
  for (const c of casas) {
    const base = H * 0.74;
    ctx.fillStyle = '#f2efe6';
    ctx.fillRect(c.x, base - c.h, c.w, c.h);
    ctx.fillStyle = c.telhado;
    ctx.beginPath();
    ctx.moveTo(c.x - W * 0.02, base - c.h);
    ctx.lineTo(c.x + c.w / 2, base - c.h - H * 0.075);
    ctx.lineTo(c.x + c.w + W * 0.02, base - c.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(20, 40, 60, 0.75)';
    ctx.fillRect(c.x + c.w * 0.16, base - c.h * 0.65, c.w * 0.22, c.h * 0.30);
    ctx.fillRect(c.x + c.w * 0.58, base - c.h * 0.65, c.w * 0.22, c.h * 0.30);
    ctx.fillStyle = '#4a3324';
    ctx.fillRect(c.x + c.w * 0.42, base - c.h * 0.42, c.w * 0.16, c.h * 0.42);
  }
}

function fundoSkyline(ctx, W, H) {
  const rnd = lcg(21);
  ctx.fillStyle = gradiente(ctx, 0, 0, 0, H, [[0, '#03040c'], [0.6, '#0b1a33'], [1, '#123a52']]);
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(226, 240, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(W * 0.24, H * 0.20, W * 0.055, 0, Math.PI * 2);
  ctx.fill();

  let x = -10;
  while (x < W) {
    const largura = W * (0.07 + rnd() * 0.10);
    const altura = H * (0.26 + rnd() * 0.42);
    ctx.fillStyle = 'rgba(4, 10, 20, 0.95)';
    ctx.fillRect(x, H - altura, largura, altura);
    for (let j = 0; j < Math.floor(altura / (H * 0.035)); j += 1) {
      for (let i = 0; i < Math.floor(largura / (W * 0.022)); i += 1) {
        if (rnd() > 0.5) {
          ctx.fillStyle = `rgba(120, 220, 255, ${0.25 + rnd() * 0.55})`;
          ctx.fillRect(x + W * 0.008 + i * W * 0.022, H - altura + H * 0.020 + j * H * 0.035, W * 0.010, H * 0.014);
        }
      }
    }
    x += largura + W * 0.008;
  }
  ctx.fillStyle = 'rgba(16, 185, 129, 0.16)';
  ctx.fillRect(0, H * 0.86, W, H * 0.14);
}

function fundoInterior(ctx, W, H) {
  ctx.fillStyle = gradiente(ctx, 0, 0, W, H, [[0, '#f4efe6'], [1, '#d9cdbb']]);
  ctx.fillRect(0, 0, W, H);

  // janela com luz
  ctx.fillStyle = '#cfe8f5';
  ctx.fillRect(W * 0.52, H * 0.08, W * 0.40, H * 0.34);
  ctx.strokeStyle = '#8a7f6d';
  ctx.lineWidth = W * 0.012;
  ctx.strokeRect(W * 0.52, H * 0.08, W * 0.40, H * 0.34);
  ctx.beginPath();
  ctx.moveTo(W * 0.72, H * 0.08);
  ctx.lineTo(W * 0.72, H * 0.42);
  ctx.moveTo(W * 0.52, H * 0.25);
  ctx.lineTo(W * 0.92, H * 0.25);
  ctx.stroke();

  // feixe de luz
  ctx.fillStyle = 'rgba(255, 244, 214, 0.35)';
  ctx.beginPath();
  ctx.moveTo(W * 0.52, H * 0.42);
  ctx.lineTo(W * 0.92, H * 0.42);
  ctx.lineTo(W * 0.78, H * 0.74);
  ctx.lineTo(W * 0.30, H * 0.74);
  ctx.closePath();
  ctx.fill();

  // sofá
  ctx.fillStyle = '#6b7f74';
  ctx.fillRect(W * 0.08, H * 0.60, W * 0.34, H * 0.12);
  ctx.fillRect(W * 0.08, H * 0.52, W * 0.34, H * 0.08);
  ctx.fillStyle = '#88996f';
  ctx.fillRect(W * 0.12, H * 0.545, W * 0.10, H * 0.07);

  // planta
  ctx.fillStyle = '#8a5a3b';
  ctx.fillRect(W * 0.86, H * 0.56, W * 0.07, H * 0.10);
  ctx.fillStyle = '#2f7d4f';
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(W * (0.855 + i * 0.02), H * (0.50 - (i % 2) * 0.03), W * 0.035, H * 0.055, i * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const DESENHOS_FUNDO = [fundoPredios, fundoCasas, fundoSkyline, fundoInterior];

/* ------------------------------- arte final ------------------------------ */

function selo(ctx, m, texto, cor) {
  if (!texto) return;
  ctx.font = `800 ${Math.round(m.w * 0.030)}px Segoe UI, Arial, sans-serif`;
  const largura = ctx.measureText(texto).width + m.w * 0.07;
  const altura = m.w * 0.058;
  const x = m.margem;
  const y = m.seloY;
  ctx.fillStyle = cor;
  const r = altura / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + largura, y, x + largura, y + altura, r);
  ctx.arcTo(x + largura, y + altura, x, y + altura, r);
  ctx.arcTo(x, y + altura, x, y, r);
  ctx.arcTo(x, y, x + largura, y, r);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#04120c';
  ctx.textBaseline = 'middle';
  ctx.fillText(texto, x + m.w * 0.035, y + altura / 2);
}

/**
 * Renderiza a arte e devolve data URL PNG.
 * @returns {Promise<string>} dataURL
 */
export async function renderizarArte({
  formato = 'feed',
  modo = 'imovel',
  imagemUrl = '',
  fundoIndice = 0,
  seloTexto = '',
  headline = '',
  bullets = [],
  logoUrl = '',
  whatsapp = '',
  creci = '',
  rodape = '',
  corDestaque = VERDE,
} = {}) {
  const m = medidas(formato);
  const canvas = document.createElement('canvas');
  canvas.width = m.w;
  canvas.height = m.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');

  const foto = modo === 'imovel' ? await carregarImagem(imagemUrl) : null;
  if (foto) {
    desenharCover(ctx, foto, 0, 0, m.w, m.h);
    // escurece a base para o texto
    ctx.fillStyle = gradiente(ctx, 0, m.h * 0.35, 0, m.h, [[0, 'rgba(2,4,8,0)'], [1, 'rgba(2,4,8,0.94)']]);
    ctx.fillRect(0, 0, m.w, m.h);
  } else {
    const desenho = DESENHOS_FUNDO[fundoIndice] || DESENHOS_FUNDO[0];
    desenho(ctx, m.w, m.h);
    ctx.fillStyle = gradiente(ctx, 0, m.h * 0.30, 0, m.h, [[0, 'rgba(2,4,8,0)'], [0.55, 'rgba(2,4,8,0.72)'], [1, 'rgba(2,4,8,0.96)']]);
    ctx.fillRect(0, 0, m.w, m.h);
  }

  selo(ctx, m, seloTexto, corDestaque);

  // headline
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${m.headlineSize}px Segoe UI, Arial, sans-serif`;
  ctx.textBaseline = 'alphabetic';
  const linhasHeadline = quebrarLinhas(headline, formato === 'story' ? 18 : 20, 3);
  let y = m.headlineY;
  for (const linha of linhasHeadline) {
    ctx.fillText(linha, m.margem, y);
    y += m.headlineSize * 1.06;
  }

  // bullets
  y += m.bulletSize * 0.5;
  ctx.font = `600 ${m.bulletSize}px Segoe UI, Arial, sans-serif`;
  bullets.slice(0, 3).forEach((b) => {
    if (!b) return;
    ctx.fillStyle = corDestaque;
    ctx.beginPath();
    ctx.arc(m.margem + m.bulletSize * 0.34, y - m.bulletSize * 0.32, m.bulletSize * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(b, m.margem + m.bulletSize * 0.95, y);
    y += m.bulletsGap;
  });

  // rodapé
  const yRodape = m.h - m.footerH;
  ctx.fillStyle = 'rgba(2, 4, 8, 0.92)';
  ctx.fillRect(0, yRodape, m.w, m.footerH);
  ctx.fillStyle = corDestaque;
  ctx.fillRect(0, yRodape, m.w, Math.max(3, m.h * 0.004));

  const logo = await carregarImagem(logoUrl);
  let xTexto = m.margem;
  if (logo) {
    const alvo = m.footerH * 0.46;
    const escala = Math.min(alvo / logo.height, (m.w * 0.18) / logo.width);
    const lw = logo.width * escala;
    const lh = logo.height * escala;
    ctx.drawImage(logo, m.margem, yRodape + (m.footerH - lh) / 2, lw, lh);
    xTexto = m.margem + lw + m.w * 0.03;
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${Math.round(m.w * 0.032)}px Segoe UI, Arial, sans-serif`;
  ctx.fillText(whatsapp ? `WhatsApp ${whatsapp}` : 'Fale com a imobiliária', xTexto, yRodape + m.footerH * 0.42);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `600 ${Math.round(m.w * 0.024)}px Segoe UI, Arial, sans-serif`;
  if (creci) ctx.fillText(`CRECI ${creci}`, xTexto, yRodape + m.footerH * 0.72);

  const aviso = rodape || textoRodape(modo);
  if (aviso) {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = `600 ${m.rodapeSize}px Segoe UI, Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(aviso, m.w - m.margem, yRodape + m.footerH * 0.72);
    ctx.textAlign = 'left';
  }

  return canvas.toDataURL('image/png');
}

/** Dispara o download do PNG. */
export function baixarPng(dataUrl, nome = 'post.png') {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
