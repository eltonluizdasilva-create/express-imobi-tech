
// Renderiza exportacoes do logotipo + folhas de revisao (SVG e PNG).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const opentype = require('opentype.js');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, '02-logotipo/src');
const OUT = path.join(ROOT, '02-logotipo/export');
const SHEETS = path.join(ROOT, '06-render/sheets');
[OUT, SHEETS].forEach(function (d) { fs.mkdirSync(d, { recursive: true }); });

const C = { ink: '#05070A', grafite: '#081016', superficie: '#121B24', linha: '#1E2A33', claro: '#F2F6F8', neutro: '#8899A6', verde: '#10B981', verdeClaro: '#6EE7B7' };

function loadFont(file) {
  const b = fs.readFileSync(path.join(__dirname, 'fonts', file));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
const SORA = loadFont('Sora-600.ttf');
const INTER = loadFont('Inter-500.ttf');

function tg(font, text, size, trackingEm) {
  const track = (trackingEm || 0) * size, scale = size / font.unitsPerEm;
  const P = new opentype.Path();
  let cursor = 0, prev = null;
  Array.from(text).forEach(function (ch) {
    const g = font.charToGlyph(ch);
    if (prev) cursor += (font.getKerningValue(prev, g) || 0) * scale;
    P.extend(g.getPath(cursor, 0, size));
    cursor += g.advanceWidth * scale + track;
    prev = g;
  });
  const bb = P.getBoundingBox();
  return { d: P.toPathData(2), w: bb.x2 - bb.x1, x1: bb.x1 };
}
function label(font, text, x, y, size, color, tracking, anchor) {
  const t = tg(font, text, size, tracking || 0);
  const dx = anchor === 'center' ? x - t.w / 2 : x;
  return '<path fill="' + color + '" d="' + t.d + '" transform="translate(' + (dx - t.x1) + ',' + y + ')"/>';
}

function inner(svgPath) {
  const s = fs.readFileSync(svgPath, 'utf8');
  return s.replace(/^[\s\S]*?<\/title>/, '').replace(/<\/svg>\s*$/, '');
}

async function svgToPng(svgString, outFile, width) {
  const buf = Buffer.from(svgString);
  let img = sharp(buf, { density: 384 });
  if (width) img = img.resize(width);
  await img.png().toFile(outFile);
  const st = fs.statSync(outFile);
  console.log('png', path.relative(ROOT, outFile), width + 'px', st.size + 'b', new Date(st.mtimeMs).toISOString().slice(11, 19));
}

(async function () {
  // ---------- exportacoes do simbolo (fundo transparente)
  const markSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">' + inner(path.join(SRC, 'simbolo-principal.svg')) + '</svg>';
  for (const s of [1024, 512, 256, 128, 64, 48, 32, 16]) {
    await svgToPng(markSvg, path.join(OUT, 'simbolo-principal-' + s + '.png'), s);
  }
  const monoSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">' + inner(path.join(SRC, 'simbolo-principal-mono.svg')) + '</svg>';
  await svgToPng(monoSvg, path.join(OUT, 'simbolo-principal-mono-1024.png'), 1024);

  const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">' + inner(path.join(SRC, 'appicon-principal.svg')) + '</svg>';
  for (const s of [1024, 512, 180, 192]) {
    await svgToPng(iconSvg, path.join(OUT, 'appicon-principal-' + s + '.png'), s);
  }

  const lockH = '<svg xmlns="http://www.w3.org/2000/svg" width="1900" height="560" viewBox="0 0 1900 560">' + inner(path.join(SRC, 'lockup-principal-horizontal.svg')) + '</svg>';
  await svgToPng(lockH, path.join(OUT, 'lockup-principal-horizontal-1900.png'), 1900);
  await svgToPng(lockH, path.join(OUT, 'lockup-principal-horizontal-950.png'), 950);
  const lockE = '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1400" viewBox="0 0 1200 1400">' + inner(path.join(SRC, 'lockup-principal-empilhado.svg')) + '</svg>';
  await svgToPng(lockE, path.join(OUT, 'lockup-principal-empilhado-1200.png'), 1200);
  await svgToPng(lockE, path.join(OUT, 'lockup-principal-empilhado-600.png'), 600);

  // ---------- folha 1: simbolo + escala
  const W1 = 2000, H1 = 1240;
  const esc = [128, 96, 64, 48, 32, 24, 16];
  let ladder = '', lx = 900;
  esc.forEach(function (s) {
    const y = 830 - s;
    ladder += '<g transform="translate(' + lx + ',' + y + ') scale(' + (s / 1024) + ')">' + inner(path.join(SRC, 'simbolo-principal.svg')) + '</g>';
    ladder += label(INTER, s + 'px', lx + s / 2, 900, 26, C.neutro, 0.02, 'center');
    lx += s + 76;
  });
  const sheet1 =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W1 + '" height="' + H1 + '" viewBox="0 0 ' + W1 + ' ' + H1 + '">' +
      '<rect width="' + W1 + '" height="' + H1 + '" fill="' + C.ink + '"/>' +
      '<rect x="0" y="0" width="' + W1 + '" height="6" fill="' + C.verde + '"/>' +
      label(SORA, 'express', 120, 150, 64, C.claro, -0.01, 'left') +
      label(INTER, 'SIMBOLO PRINCIPAL', 320, 150, 34, C.verdeClaro, 0.24, 'left') +
      label(INTER, 'tres lajes ligadas a uma coluna + no verde no braco central', 120, 206, 30, C.neutro, 0.01, 'left') +
      '<line x1="120" y1="250" x2="' + (W1 - 120) + '" y2="250" stroke="' + C.linha + '" stroke-width="2"/>' +
      '<g transform="translate(120,300) scale(0.6)">' + inner(path.join(SRC, 'simbolo-principal.svg')) + '</g>' +
      '<g transform="translate(800,300) scale(0.36)">' + inner(path.join(SRC, 'appicon-principal.svg')) + '</g>' +
      label(INTER, 'ICONE DE APP', 800, 700, 26, C.neutro, 0.22, 'left') +
      label(INTER, 'ESCALA / FAVICON', 120, 790, 26, C.neutro, 0.22, 'left') +
      ladder +
      label(INTER, 'uso mo­nocromatico (1 cor)', 120, 1010, 26, C.neutro, 0.18, 'left') +
      '<g transform="translate(120,1050) scale(0.12)">' + inner(path.join(SRC, 'simbolo-principal-mono.svg')) + '</g>' +
      '<g transform="translate(320,1050) scale(0.12)"><rect width="1024" height="1024" rx="230" fill="' + C.claro + '"/><g transform="translate(0,0)">' + inner(path.join(SRC, 'simbolo-principal-mono.svg')) + '</g></g>' +
      label(INTER, 'fundo escuro (padrao)', 120, 1215, 24, C.neutro, 0.02, 'left') +
      label(INTER, 'fundo claro (invertido, no em verde)', 320, 1215, 24, C.neutro, 0.02, 'left') +
    '</svg>';
  fs.writeFileSync(path.join(SHEETS, 'sheet-simbolo.svg'), sheet1);
  await svgToPng(sheet1, path.join(SHEETS, 'sheet-simbolo.png'), W1);

  // ---------- folha 2: wordmark / lockups
  const W2 = 2000, H2 = 1500;
  const sheet2 =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + W2 + '" height="' + H2 + '" viewBox="0 0 ' + W2 + ' ' + H2 + '">' +
      '<rect width="' + W2 + '" height="' + H2 + '" fill="' + C.ink + '"/>' +
      '<rect x="0" y="0" width="' + W2 + '" height="6" fill="' + C.verde + '"/>' +
      label(SORA, 'express', 120, 150, 64, C.claro, -0.01, 'left') +
      label(INTER, 'LOCKUPS', 320, 150, 34, C.verdeClaro, 0.24, 'left') +
      label(INTER, 'Sora SemiBold + Inter Medium  |  malha de 8px  |  sem tracking negativo agressivo', 120, 206, 30, C.neutro, 0.01, 'left') +
      '<line x1="120" y1="250" x2="' + (W2 - 120) + '" y2="250" stroke="' + C.linha + '" stroke-width="2"/>' +
      label(INTER, 'HORIZONTAL', 120, 320, 26, C.neutro, 0.22, 'left') +
      '<g transform="translate(120,360) scale(' + ((W2 - 240) / 1900) + ')">' + inner(path.join(SRC, 'lockup-principal-horizontal.svg')) + '</g>' +
      '<line x1="120" y1="860" x2="' + (W2 - 120) + '" y2="860" stroke="' + C.linha + '" stroke-width="2"/>' +
      label(INTER, 'EMPILHADO', 120, 930, 26, C.neutro, 0.22, 'left') +
      '<g transform="translate(600,900) scale(0.36)">' + inner(path.join(SRC, 'lockup-principal-empilhado.svg')) + '</g>' +
      '<g transform="translate(1200,930) scale(0.30)">' + inner(path.join(SRC, 'appicon-principal.svg')) + '</g>' +
      label(INTER, 'icone de app', 1200, 1290, 24, C.neutro, 0.02, 'left') +
    '</svg>';
  fs.writeFileSync(path.join(SHEETS, 'sheet-wordmark.svg'), sheet2);
  await svgToPng(sheet2, path.join(SHEETS, 'sheet-wordmark.png'), W2);

  console.log('render concluido');
})().catch(function (e) { console.error('FALHOU:', e.message); process.exit(1); });
