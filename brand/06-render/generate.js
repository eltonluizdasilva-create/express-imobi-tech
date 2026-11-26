
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const ROOT = path.resolve(__dirname, '..');
const FONTS = path.join(__dirname, 'fonts');

const C = {
  ink: '#05070A', grafite: '#0B1016', superficie: '#121A21', linha: '#1E2A33',
  claro: '#F2F6F8', neutro: '#9FB0BD',
  verde: '#10B981', verdeEscuro: '#0B7A58', verdeClaro: '#6EE7B7',
};

function loadFont(file) {
  const b = fs.readFileSync(path.join(FONTS, file));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
const SORA600 = loadFont('Sora-600.ttf');
const INTER500 = loadFont('Inter-500.ttf');

function textPath(font, text, opts) {
  const size = opts.size || 100, tracking = opts.tracking || 0;
  const glyphs = Array.from(text).map(function (ch) { return font.charToGlyph(ch); });
  const scale = size / font.unitsPerEm;
  let cursor = 0, d = '', prev = null;
  for (const g of glyphs) {
    if (prev) cursor += (font.getKerningValue(prev, g) || 0) * scale;
    const p = g.getPath(cursor, 0, size);
    const pd = p.toPathData(3);
    if (pd) d += pd + ' ';
    cursor += g.advanceWidth * scale + tracking * size;
    prev = g;
  }
  return { d: d, width: cursor - tracking * size };
}
function measure(font, text, size, tracking) { return textPath(font, text, { size: size, tracking: tracking }).width; }

const HEAD = (w, h, title) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + title + '"><title>' + title + '</title>';

function write(rel, svg) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, svg, 'utf8');
  console.log('svg', rel);
}

function markPortal(color, accent) {
  color = color || C.claro; accent = accent || C.verde;
  return '<path fill="' + color + '" fill-rule="evenodd" d="M176 816 V512 A336 336 0 0 1 848 512 V816 A56 56 0 0 1 792 872 H232 A56 56 0 0 1 176 816 Z M320 816 V512 A192 192 0 0 1 704 512 V816 Z"/>' +
    '<circle cx="512" cy="690" r="76" fill="' + accent + '"/>';
}
function markPlanta(color, accent) {
  color = color || C.claro; accent = accent || C.verde;
  return '<g fill="' + color + '"><rect x="208" y="200" width="600" height="112" rx="26"/><rect x="208" y="456" width="112" height="368" rx="26"/><rect x="208" y="712" width="600" height="112" rx="26"/><rect x="376" y="456" width="308" height="112" rx="26"/></g>' +
    '<circle cx="700" cy="512" r="66" fill="' + accent + '"/>';
}
function markOrbita(color, accent) {
  color = color || C.claro; accent = accent || C.verde;
  return '<g fill="none" stroke="' + color + '" stroke-width="26" opacity="0.55"><ellipse cx="512" cy="512" rx="356" ry="188" transform="rotate(-22 512 512)"/></g>' +
    '<g fill="' + color + '"><rect x="248" y="248" width="112" height="528" rx="24"/><rect x="248" y="248" width="512" height="112" rx="24"/><rect x="248" y="456" width="404" height="112" rx="24"/><rect x="248" y="664" width="512" height="112" rx="24"/></g>' +
    '<circle cx="796" cy="316" r="66" fill="' + accent + '"/>';
}
const MARKS = { a: markPortal, b: markPlanta, c: markOrbita };

Object.keys(MARKS).forEach(function (k) {
  const fn = MARKS[k];
  write('02-logotipo/src/mark-' + k + '.svg', HEAD(1024, 1024, 'Express Imobi Tech - simbolo ' + k.toUpperCase()) + fn() + '</svg>');
  write('02-logotipo/src/mark-' + k + '-mono.svg', HEAD(1024, 1024, 'Express Imobi Tech - simbolo ' + k.toUpperCase() + ' monocromatico') + fn(C.claro, C.claro) + '</svg>');
});

function lockupStacked(markFn) {
  const w = 1200, h = 1400, color = C.claro, accent = C.verde;
  const sExp = 250, sSub = 74, sMark = 400;
  const tExp = -0.03, tSub = 0.32;
  const expW = measure(SORA600, 'express', sExp, tExp);
  const subW = measure(INTER500, 'IMOBI TECH', sSub, tSub);
  const cx = w / 2;
  const markY = (h - sMark) / 2 - 210;
  const expY = markY + sMark + 240;
  const subY = expY + 128;
  return '<g>' +
    '<g transform="translate(' + (cx - sMark / 2) + ',' + markY + ') scale(' + (sMark / 1024) + ')">' + markFn(color, accent) + '</g>' +
    '<path fill="' + color + '" d="' + textPath(SORA600, 'express', { size: sExp, tracking: tExp }).d + '" transform="translate(' + (cx - expW / 2) + ',' + expY + ') scale(1,-1)"/>' +
    '<path fill="' + color + '" d="' + textPath(INTER500, 'IMOBI TECH', { size: sSub, tracking: tSub }).d + '" transform="translate(' + (cx - subW / 2) + ',' + subY + ') scale(1,-1)"/>' +
    '</g>';
}
function lockupHorizontal(markFn) {
  const w = 1900, h = 560, color = C.claro, accent = C.verde, sMark = 360;
  const sExp = 190, sSub = 58;
  const tExp = -0.03, tSub = 0.32;
  const expW = measure(SORA600, 'express', sExp, tExp);
  const subW = measure(INTER500, 'IMOBI TECH', sSub, tSub);
  const textW = Math.max(expW, subW);
  const gap = 90;
  const totalW = sMark + gap + textW;
  const startX = (w - totalW) / 2;
  const markY = (h - sMark) / 2;
  const expY = h / 2 + 38;
  const subY = expY + 96;
  return '<g>' +
    '<g transform="translate(' + startX + ',' + markY + ') scale(' + (sMark / 1024) + ')">' + markFn(color, accent) + '</g>' +
    '<path fill="' + color + '" d="' + textPath(SORA600, 'express', { size: sExp, tracking: tExp }).d + '" transform="translate(' + (startX + sMark + gap) + ',' + expY + ') scale(1,-1)"/>' +
    '<path fill="' + color + '" d="' + textPath(INTER500, 'IMOBI TECH', { size: sSub, tracking: tSub }).d + '" transform="translate(' + (startX + sMark + gap) + ',' + subY + ') scale(1,-1)"/>' +
    '</g>';
}

Object.keys(MARKS).forEach(function (k) {
  write('02-logotipo/src/lockup-' + k + '-horizontal.svg', HEAD(1900, 560, 'Lockup horizontal ' + k.toUpperCase()) + lockupHorizontal(MARKS[k]) + '</svg>');
  write('02-logotipo/src/lockup-' + k + '-empilhado.svg', HEAD(1200, 1400, 'Lockup empilhado ' + k.toUpperCase()) + lockupStacked(MARKS[k]) + '</svg>');
});

function appIcon(markFn) {
  return '<defs><linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#151D25"/><stop offset="1" stop-color="' + C.ink + '"/></linearGradient>' +
    '<radialGradient id="glow" cx="0.5" cy="0.28" r="0.7"><stop offset="0" stop-color="' + C.verde + '" stop-opacity="0.20"/><stop offset="1" stop-color="' + C.verde + '" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="1024" height="1024" rx="232" fill="url(#bg)"/><rect width="1024" height="1024" rx="232" fill="url(#glow)"/>' +
    '<rect x="1.5" y="1.5" width="1021" height="1021" rx="230" fill="none" stroke="#FFFFFF" stroke-opacity="0.07" stroke-width="3"/>' +
    '<g transform="translate(139,139) scale(0.729)">' + markFn(C.claro, C.verde) + '</g>';
}
Object.keys(MARKS).forEach(function (k) {
  write('02-logotipo/src/appicon-' + k + '.svg', HEAD(1024, 1024, 'Icone de app ' + k.toUpperCase()) + appIcon(MARKS[k]) + '</svg>');
});

function avatarBust(p) {
  const hairBack = {
    bob: '<path d="M336 520 C336 300 402 214 512 214 C622 214 688 300 688 520 C688 600 664 646 640 660 L664 520 C664 420 610 372 512 372 C414 372 360 420 360 520 L384 660 C360 646 336 600 336 520 Z" fill="' + p.hair + '"/>',
    bun: '<circle cx="512" cy="196" r="72" fill="' + p.hair + '"/><path d="M348 540 C348 320 414 232 512 232 C610 232 676 320 676 540 C676 604 660 642 640 656 L348 540 Z" fill="' + p.hair + '"/>',
    curto: '<path d="M356 500 C356 306 420 226 512 226 C604 226 668 306 668 500 C668 540 660 566 650 574 L374 574 C364 566 356 540 356 500 Z" fill="' + p.hair + '"/>'
  }[p.hairStyle];
  return '<g>' + hairBack +
    '<path d="M462 560 h100 v118 c0 26 -22 44 -50 44 s-50 -18 -50 -44 Z" fill="' + p.skinShade + '"/>' +
    '<path d="M262 1024 c0 -168 96 -258 250 -258 c154 0 250 90 250 258 Z" fill="' + p.cloth + '"/>' +
    '<path d="M512 766 c-46 0 -88 8 -122 24 l122 234 l122 -234 c-34 -16 -76 -24 -122 -24 Z" fill="' + p.clothShade + '"/>' +
    '<path d="M470 792 l42 200 l42 -200 l-42 -26 Z" fill="' + p.skin + '"/>' +
    '<ellipse cx="512" cy="452" rx="132" ry="164" fill="' + p.skin + '"/>' +
    '<path d="M512 288 c-74 0 -132 56 -132 138 c0 24 4 48 12 70 c6 -104 56 -152 120 -152 c64 0 114 48 120 152 c8 -22 12 -46 12 -70 c0 -82 -58 -138 -132 -138 Z" fill="' + p.skinShade + '" opacity="0.35"/>' +
    '<path d="M380 400 c10 -110 66 -170 132 -170 c66 0 122 60 132 170 c-42 -46 -78 -62 -132 -62 c-54 0 -90 16 -132 62 Z" fill="' + p.hair + '"/>' +
    '<path d="M404 372 c26 -46 62 -66 108 -66 c46 0 82 20 108 66 c-34 -28 -66 -40 -108 -40 c-42 0 -74 12 -108 40 Z" fill="' + p.hairHi + '" opacity="0.7"/>' +
    '<path d="M716 372 c14 40 20 78 18 112" stroke="' + p.accent + '" stroke-width="9" fill="none" stroke-linecap="round" opacity="0.9"/>' +
    '</g>';
}
function avatarFrame(body, accent) {
  return '<defs><linearGradient id="bgg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#131C24"/><stop offset="1" stop-color="#070A0E"/></linearGradient>' +
    '<radialGradient id="light" cx="0.72" cy="0.18" r="0.85"><stop offset="0" stop-color="' + accent + '" stop-opacity="0.26"/><stop offset="1" stop-color="' + accent + '" stop-opacity="0"/></radialGradient>' +
    '<clipPath id="c"><rect width="1024" height="1024" rx="250"/></clipPath></defs>' +
    '<g clip-path="url(#c)"><rect width="1024" height="1024" fill="url(#bgg)"/><rect width="1024" height="1024" fill="url(#light)"/>' +
    '<g opacity="0.28" fill="none" stroke="' + accent + '" stroke-width="3"><path d="M150 860 V470 a362 362 0 0 1 724 0 V860"/><path d="M196 900 V480 a316 316 0 0 1 632 0 V900"/></g>' +
    body +
    '<rect x="1.5" y="1.5" width="1021" height="1021" rx="249" fill="none" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="3"/></g>';
}

const PEOPLE = {
  sofia: { skin: '#D6A17A', skinShade: '#B8815C', hair: '#241A16', hairHi: '#3A2A22', cloth: '#1B242D', clothShade: '#141C24', hairStyle: 'bob', accent: C.verde },
  polen: { skin: '#8C5A3C', skinShade: '#6E442B', hair: '#151215', hairHi: '#2A2329', cloth: '#1A232B', clothShade: '#131A21', hairStyle: 'bun', accent: C.verdeClaro },
  tom:   { skin: '#C08D62', skinShade: '#9C6C46', hair: '#2A2622', hairHi: '#413A32', cloth: '#161E26', clothShade: '#11171D', hairStyle: 'curto', accent: C.verde },
  zara:  { skin: '#EFC3A0', skinShade: '#CFA07C', hair: '#3A2723', hairHi: '#523832', cloth: '#1C252E', clothShade: '#151C23', hairStyle: 'bob', accent: C.verde }
};
Object.keys(PEOPLE).forEach(function (k) {
  const p = PEOPLE[k];
  write('03-avatar/src/avatar-' + k + '.svg', HEAD(1024, 1024, 'Avatar ' + k) + avatarFrame(avatarBust(p), p.accent) + '</svg>');
});

console.log('done');
