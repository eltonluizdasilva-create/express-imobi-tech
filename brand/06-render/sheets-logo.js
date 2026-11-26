
// Folhas de revisao do logotipo (layout corrigido, sem sobreposicao).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const opentype = require('opentype.js');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, '02-logotipo/src');
const SHEETS = path.join(ROOT, '06-render/sheets');
const C = { ink: '#05070A', grafite: '#081016', superficie: '#121B24', linha: '#22303A', claro: '#F2F6F8', neutro: '#8899A6', verde: '#10B981', verdeClaro: '#6EE7B7' };

function loadFont(f) { const b = fs.readFileSync(path.join(__dirname, 'fonts', f)); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); }
const SORA = loadFont('Sora-600.ttf');
const INTER = loadFont('Inter-500.ttf');

function tg(font, text, size, trackingEm) {
  const track = (trackingEm || 0) * size, scale = size / font.unitsPerEm;
  const P = new opentype.Path(); let cursor = 0, prev = null;
  Array.from(text).forEach(function (ch) {
    const g = font.charToGlyph(ch);
    if (prev) cursor += (font.getKerningValue(prev, g) || 0) * scale;
    P.extend(g.getPath(cursor, 0, size)); cursor += g.advanceWidth * scale + track; prev = g;
  });
  const bb = P.getBoundingBox();
  return { d: P.toPathData(2), w: bb.x2 - bb.x1, x1: bb.x1 };
}
function txt(font, text, x, y, size, color, tracking, anchor) {
  const t = tg(font, text, size, tracking || 0);
  const dx = anchor === 'center' ? x - t.w / 2 : anchor === 'right' ? x - t.w : x;
  return '<path fill="' + color + '" d="' + t.d + '" transform="translate(' + (dx - t.x1) + ',' + y + ')"/>';
}
function inner(p) { const s = fs.readFileSync(p, 'utf8'); return s.replace(/^[\s\S]*?<\/title>/, '').replace(/<\/svg>\s*$/, ''); }

// simbolo em uma cor arbitraria (para fundo claro)
function symbolInk(cor) {
  return '<g fill="' + cor + '">' +
    '<rect x="216" y="216" width="120" height="592" rx="28"/>' +
    '<rect x="216" y="216" width="552" height="120" rx="28"/>' +
    '<rect x="216" y="452" width="384" height="120" rx="28"/>' +
    '<rect x="216" y="688" width="616" height="120" rx="28"/>' +
    '<rect x="600" y="452" width="136" height="120" rx="60"/>' +
    '</g>';
}

async function out(svg, file, w) {
  await sharp(Buffer.from(svg), { density: 384 }).resize(w).png().toFile(file);
  const st = fs.statSync(file);
  console.log('png', path.relative(ROOT, file), w + 'px', st.size + 'b', new Date(st.mtimeMs).toISOString().slice(11, 19));
}

(async function () {
  const simb = inner(path.join(SRC, 'simbolo-principal.svg'));
  const icone = inner(path.join(SRC, 'appicon-principal.svg'));
  const lockH = inner(path.join(SRC, 'lockup-principal-horizontal.svg'));
  const lockE = inner(path.join(SRC, 'lockup-principal-empilhado.svg'));

  /* ---------- folha 1 ---------- */
  const W1 = 2000, H1 = 1300;
  const wExpress = tg(SORA, 'express', 58, -0.01).w;
  const ladder = [128, 96, 72, 56, 40, 32, 24, 16];
  let lx = 760, ladderSvg = '';
  ladder.forEach(function (s) {
    ladderSvg += '<g transform="translate(' + lx + ',' + (890 - s) + ') scale(' + (s / 1024) + ')">' + simb + '</g>';
    ladderSvg += txt(INTER, String(s), lx + s / 2, 930, 24, C.neutro, 0.02, 'center');
    lx += s + 58;
  });
  const sheet1 =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W1 + '" height="' + H1 + '" viewBox="0 0 ' + W1 + ' ' + H1 + '">' +
      '<rect width="' + W1 + '" height="' + H1 + '" fill="' + C.ink + '"/>' +
      '<rect x="0" y="0" width="' + W1 + '" height="5" fill="' + C.verde + '"/>' +
      txt(SORA, 'express', 120, 128, 58, C.claro, -0.01, 'left') +
      txt(INTER, 'SIMBOLO PRINCIPAL', 120 + wExpress + 44, 128, 30, C.verdeClaro, 0.26, 'left') +
      txt(INTER, 'tres lajes ligadas a uma coluna, braco central terminando em no verde', 120, 184, 28, C.neutro, 0.01, 'left') +
      '<line x1="120" y1="236" x2="' + (W1 - 120) + '" y2="236" stroke="' + C.linha + '" stroke-width="2"/>' +
      // simbolo grande
      '<g transform="translate(120,286) scale(0.5)">' + simb + '</g>' +
      txt(INTER, 'positivo / fundo escuro', 120, 870, 24, C.neutro, 0.16, 'left') +
      // icone de app
      '<g transform="translate(760,286) scale(0.34)">' + icone + '</g>' +
      txt(INTER, 'ICONE DE APP', 760, 690, 24, C.neutro, 0.22, 'left') +
      // escada de tamanhos
      txt(INTER, 'ESCALA / FAVICON', 760, 740, 24, C.neutro, 0.22, 'left') +
      ladderSvg +
      // rodape: escuro x claro
      '<line x1="120" y1="980" x2="' + (W1 - 120) + '" y2="980" stroke="' + C.linha + '" stroke-width="2"/>' +
      txt(INTER, 'USO MONOCROMATICO', 120, 1050, 24, C.neutro, 0.22, 'left') +
      '<rect x="120" y="1080" width="150" height="150" rx="34" fill="' + C.grafite + '" stroke="' + C.linha + '" stroke-width="2"/>' +
      '<g transform="translate(137,1097) scale(0.113)">' + simb + '</g>' +
      txt(INTER, 'fundo escuro (padrao)', 290, 1160, 24, C.neutro, 0.02, 'left') +
      '<rect x="560" y="1080" width="150" height="150" rx="34" fill="' + C.claro + '"/>' +
      '<g transform="translate(577,1097) scale(0.113)">' + symbolInk(C.ink) + '</g>' +
      txt(INTER, 'fundo claro (1 cor: tinta)', 730, 1160, 24, C.neutro, 0.02, 'left') +
      '<rect x="1080" y="1080" width="150" height="150" rx="34" fill="' + C.ink + '" stroke="' + C.linha + '" stroke-width="2"/>' +
      '<g transform="translate(1097,1097) scale(0.113)">' + symbolInk(C.verde) + '</g>' +
      txt(INTER, 'acento unico (verde)', 1250, 1160, 24, C.neutro, 0.02, 'left') +
    '</svg>';
  fs.writeFileSync(path.join(SHEETS, 'sheet-simbolo.svg'), sheet1);
  await out(sheet1, path.join(SHEETS, 'sheet-simbolo.png'), W1);

  /* ---------- folha 2 ---------- */
  const W2 = 2000, H2 = 1560;
  const sheet2 =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W2 + '" height="' + H2 + '" viewBox="0 0 ' + W2 + ' ' + H2 + '">' +
      '<rect width="' + W2 + '" height="' + H2 + '" fill="' + C.ink + '"/>' +
      '<rect x="0" y="0" width="' + W2 + '" height="5" fill="' + C.verde + '"/>' +
      txt(SORA, 'express', 120, 128, 58, C.claro, -0.01, 'left') +
      txt(INTER, 'LOCKUPS', 120 + wExpress + 44, 128, 30, C.verdeClaro, 0.26, 'left') +
      txt(INTER, 'Sora SemiBold (wordmark) + Inter Medium (assinatura)  |  texto em curvas  |  tracking -0.012em / +0.20em', 120, 184, 28, C.neutro, 0.01, 'left') +
      '<line x1="120" y1="236" x2="' + (W2 - 120) + '" y2="236" stroke="' + C.linha + '" stroke-width="2"/>' +
      txt(INTER, 'HORIZONTAL', 120, 300, 24, C.neutro, 0.22, 'left') +
      '<g transform="translate(120,340) scale(0.92)">' + lockH + '</g>' +
      '<line x1="120" y1="920" x2="' + (W2 - 120) + '" y2="920" stroke="' + C.linha + '" stroke-width="2"/>' +
      txt(INTER, 'EMPILHADO', 120, 985, 24, C.neutro, 0.22, 'left') +
      '<g transform="translate(430,960) scale(0.34)">' + lockE + '</g>' +
      txt(INTER, 'icone de app (avatar / favicon)', 1200, 985, 24, C.neutro, 0.22, 'left') +
      '<g transform="translate(1200,1010) scale(0.30)">' + icone + '</g>' +
    '</svg>';
  fs.writeFileSync(path.join(SHEETS, 'sheet-wordmark.svg'), sheet2);
  await out(sheet2, path.join(SHEETS, 'sheet-wordmark.png'), W2);

  console.log('folhas atualizadas');
})().catch(function (e) { console.error('FALHOU:', e.message); process.exit(1); });
