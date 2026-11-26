
// Marca Express Imobi Tech - logotipo e simbolo principal (rodada 2).
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const ROOT = path.resolve(__dirname, '..');
const FONTS = path.join(__dirname, 'fonts');

const C = {
  ink: '#05070A', grafite: '#081016', superficie: '#121B24', linha: '#1E2A33',
  claro: '#F2F6F8', neutro: '#9FB0BD',
  verde: '#10B981', verdeClaro: '#6EE7B7', verdeEscuro: '#0B7A58',
};

function loadFont(file) {
  const b = fs.readFileSync(path.join(FONTS, file));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
const SORA = loadFont('Sora-600.ttf');
const INTER = loadFont('Inter-500.ttf');

// opentype.js devolve coordenadas de tela (y para baixo), linha de base em y=0.
// Nao aplicar scale(1,-1): isso espelhava as letras.
function textGeom(font, text, size, trackingEm) {
  const track = (trackingEm || 0) * size;
  const scale = size / font.unitsPerEm;
  const P = new opentype.Path();
  let cursor = 0;
  let prev = null;
  Array.from(text).forEach(function (ch) {
    const g = font.charToGlyph(ch);
    if (prev) cursor += (font.getKerningValue(prev, g) || 0) * scale;
    P.extend(g.getPath(cursor, 0, size));
    cursor += g.advanceWidth * scale + track;
    prev = g;
  });
  const bb = P.getBoundingBox();
  return { d: P.toPathData(2), bb: bb, advance: cursor - track };
}

function capHeight(font, size) {
  const os2 = font.tables && font.tables.os2;
  const cap = os2 && os2.sCapHeight ? os2.sCapHeight : 0.72 * font.unitsPerEm;
  return (cap / font.unitsPerEm) * size;
}

// Simbolo principal: monograma E em tres lajes ligadas a uma coluna,
// com o braco central terminando em um no verde. Sem anel fechado,
// sem pecas soltas, sem orbitas.
function markPrincipal(cor, acento) {
  cor = cor || C.claro; acento = acento || C.verde;
  const y1 = 216, y2 = 452, y3 = 688, h = 120, spine = 216;
  return '<g fill="' + cor + '">' +
      '<rect x="' + spine + '" y="' + y1 + '" width="120" height="' + (808 - y1) + '" rx="28"/>' +
      '<rect x="' + spine + '" y="' + y1 + '" width="552" height="' + h + '" rx="28"/>' +
      '<rect x="' + spine + '" y="' + y2 + '" width="384" height="' + h + '" rx="28"/>' +
      '<rect x="' + spine + '" y="' + y3 + '" width="616" height="' + h + '" rx="28"/>' +
    '</g>' +
    '<rect x="600" y="' + y2 + '" width="136" height="' + h + '" rx="60" fill="' + acento + '"/>';
}

const HEAD = (w, h, title) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + title + '"><title>' + title + '</title>';
function write(rel, svg) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, svg, 'utf8');
  console.log('svg', rel);
}

write('02-logotipo/src/simbolo-principal.svg',
  HEAD(1024, 1024, 'Express Imobi Tech - simbolo principal') + markPrincipal() + '</svg>');
write('02-logotipo/src/simbolo-principal-mono.svg',
  HEAD(1024, 1024, 'Express Imobi Tech - simbolo principal monocromatico') + markPrincipal(C.claro, C.claro) + '</svg>');

const TEXTO_EXP = 'express';
const TEXTO_SUB = 'IMOBI TECH';

function bloco(sizeExp, sizeSub, trackExp, trackSub) {
  const e = textGeom(SORA, TEXTO_EXP, sizeExp, trackExp);
  const s = textGeom(INTER, TEXTO_SUB, sizeSub, trackSub);
  const capE = capHeight(SORA, sizeExp);
  const capS = capHeight(INTER, sizeSub);
  const gap = sizeExp * 0.34;
  return {
    e: e, s: s, capE: capE, capS: capS, gap: gap,
    altura: capE + gap + capS,
    largura: Math.max(e.bb.x2 - e.bb.x1, s.bb.x2 - s.bb.x1),
  };
}

function lockupHorizontal() {
  const W = 1900, H = 560, markSize = 330, gapMark = 86;
  const b = bloco(170, 50, -0.012, 0.20);
  const totalW = markSize + gapMark + b.largura;
  const startX = (W - totalW) / 2;
  const markY = (H - markSize) / 2;
  const topo = (H - b.altura) / 2;
  const baseExp = topo + b.capE;
  const baseSub = baseExp + b.gap + b.capS;
  const tx = startX + markSize + gapMark;
  return '<g>' +
    '<g transform="translate(' + startX + ',' + markY + ') scale(' + (markSize / 1024) + ')">' + markPrincipal() + '</g>' +
    '<path fill="' + C.claro + '" d="' + b.e.d + '" transform="translate(' + (tx - b.e.bb.x1) + ',' + baseExp + ')"/>' +
    '<path fill="' + C.verdeClaro + '" d="' + b.s.d + '" transform="translate(' + (tx - b.s.bb.x1) + ',' + baseSub + ')"/>' +
    '</g>';
}

function lockupEmpilhado() {
  const W = 1200, markSize = 320;
  const b = bloco(215, 60, -0.012, 0.20);
  const markY = 200;
  const baseExp = markY + markSize + 130 + b.capE;
  const baseSub = baseExp + b.gap + b.capS;
  const cx = W / 2;
  const wE = b.e.bb.x2 - b.e.bb.x1;
  const wS = b.s.bb.x2 - b.s.bb.x1;
  return '<g>' +
    '<g transform="translate(' + (cx - markSize / 2) + ',' + markY + ') scale(' + (markSize / 1024) + ')">' + markPrincipal() + '</g>' +
    '<path fill="' + C.claro + '" d="' + b.e.d + '" transform="translate(' + (cx - wE / 2 - b.e.bb.x1) + ',' + baseExp + ')"/>' +
    '<path fill="' + C.verdeClaro + '" d="' + b.s.d + '" transform="translate(' + (cx - wS / 2 - b.s.bb.x1) + ',' + baseSub + ')"/>' +
    '</g>';
}

write('02-logotipo/src/lockup-principal-horizontal.svg', HEAD(1900, 560, 'Lockup horizontal') + lockupHorizontal() + '</svg>');
write('02-logotipo/src/lockup-principal-empilhado.svg', HEAD(1200, 1400, 'Lockup empilhado') + lockupEmpilhado() + '</svg>');

function appIcon() {
  return '<defs>' +
      '<linearGradient id="bg" x1="0" y1="0" x2="0.45" y2="1"><stop offset="0" stop-color="' + C.superficie + '"/><stop offset="1" stop-color="' + C.ink + '"/></linearGradient>' +
      '<radialGradient id="glow" cx="0.62" cy="0.22" r="0.75"><stop offset="0" stop-color="' + C.verde + '" stop-opacity="0.16"/><stop offset="1" stop-color="' + C.verde + '" stop-opacity="0"/></radialGradient>' +
    '</defs>' +
    '<rect width="1024" height="1024" rx="230" fill="url(#bg)"/>' +
    '<rect width="1024" height="1024" rx="230" fill="url(#glow)"/>' +
    '<rect x="2" y="2" width="1020" height="1020" rx="228" fill="none" stroke="#FFFFFF" stroke-opacity="0.06" stroke-width="4"/>' +
    '<g transform="translate(166,166) scale(0.675)">' + markPrincipal() + '</g>';
}
write('02-logotipo/src/appicon-principal.svg', HEAD(1024, 1024, 'Icone de app') + appIcon() + '</svg>');

const a = textGeom(SORA, TEXTO_EXP, 170, -0.012);
const b2 = textGeom(INTER, TEXTO_SUB, 50, 0.20);
console.log('express 170px -> largura ' + (a.bb.x2 - a.bb.x1).toFixed(1) + ' | altura ' + (a.bb.y1).toFixed(1) + ' a ' + a.bb.y2.toFixed(1));
console.log('IMOBI TECH 50px -> largura ' + (b2.bb.x2 - b2.bb.x1).toFixed(1));
console.log('ok');
