
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SRC = { logo: path.join(ROOT, '02-logotipo/src'), avatar: path.join(ROOT, '03-avatar/src') };
const OUT_LOGO = path.join(ROOT, '02-logotipo/export');
const OUT_AVA = path.join(ROOT, '03-avatar/export');
const SHEETS = path.join(ROOT, '06-render/sheets');
[OUT_LOGO, OUT_AVA, SHEETS].forEach(d => fs.mkdirSync(d, { recursive: true }));

const INK = { r: 5, g: 7, b: 10, alpha: 1 };

function render(svgFile, outFile, width, height) {
  const svg = fs.readFileSync(svgFile);
  return sharp(svg, { density: 384 }).resize(width, height || null).png().toFile(outFile).then(() => outFile);
}

(async () => {
  const marks = ['a', 'b', 'c'];
  for (const m of marks) {
    await render(path.join(SRC.logo, `mark-${m}.svg`), path.join(OUT_LOGO, `simbolo-${m}-1024.png`), 1024, 1024);
    await render(path.join(SRC.logo, `mark-${m}.svg`), path.join(OUT_LOGO, `simbolo-${m}-256.png`), 256, 256);
    await render(path.join(SRC.logo, `mark-${m}.svg`), path.join(OUT_LOGO, `simbolo-${m}-64.png`), 64, 64);
    await render(path.join(SRC.logo, `mark-${m}.svg`), path.join(OUT_LOGO, `favicon-${m}-32.png`), 32, 32);
    await render(path.join(SRC.logo, `mark-${m}.svg`), path.join(OUT_LOGO, `favicon-${m}-16.png`), 16, 16);
    await render(path.join(SRC.logo, `appicon-${m}.svg`), path.join(OUT_LOGO, `appicon-${m}-1024.png`), 1024, 1024);
    await render(path.join(SRC.logo, `appicon-${m}.svg`), path.join(OUT_LOGO, `appicon-${m}-512.png`), 512, 512);
    await render(path.join(SRC.logo, `appicon-${m}.svg`), path.join(OUT_LOGO, `appicon-${m}-180.png`), 180, 180);
    await render(path.join(SRC.logo, `lockup-${m}-horizontal.svg`), path.join(OUT_LOGO, `lockup-${m}-horizontal.png`), 1900, 560);
    await render(path.join(SRC.logo, `lockup-${m}-empilhado.svg`), path.join(OUT_LOGO, `lockup-${m}-empilhado.png`), 1200, 1400);
  }

  const people = ['sofia', 'polen', 'tom', 'zara'];
  for (const p of people) {
    await render(path.join(SRC.avatar, `avatar-${p}.svg`), path.join(OUT_AVA, `avatar-${p}-1024.png`), 1024, 1024);
    await render(path.join(SRC.avatar, `avatar-${p}.svg`), path.join(OUT_AVA, `avatar-${p}-256.png`), 256, 256);
    await render(path.join(SRC.avatar, `avatar-${p}.svg`), path.join(OUT_AVA, `avatar-${p}-96.png`), 96, 96);
  }

  // --- folhas de contato para revisão
  const tile = async (svgFile, size) => sharp(await sharp(fs.readFileSync(svgFile), { density: 384 }).resize(size, size).png().toBuffer()).toBuffer();
  const bg = (w, h) => sharp({ create: { width: w, height: h, channels: 4, background: INK } });

  const m1 = await tile(path.join(SRC.logo, 'mark-a.svg'), 420);
  const m2 = await tile(path.join(SRC.logo, 'mark-b.svg'), 420);
  const m3 = await tile(path.join(SRC.logo, 'mark-c.svg'), 420);
  await bg(1500, 620).composite([
    { input: m1, left: 60, top: 100 }, { input: m2, left: 540, top: 100 }, { input: m3, left: 1020, top: 100 },
  ]).png().toFile(path.join(SHEETS, 'sheet-simbolos.png'));

  const a1 = await tile(path.join(SRC.avatar, 'avatar-sofia.svg'), 500);
  const a2 = await tile(path.join(SRC.avatar, 'avatar-polen.svg'), 500);
  const a3 = await tile(path.join(SRC.avatar, 'avatar-tom.svg'), 500);
  const a4 = await tile(path.join(SRC.avatar, 'avatar-zara.svg'), 500);
  await bg(2200, 640).composite([
    { input: a1, left: 60, top: 70 }, { input: a2, left: 600, top: 70 },
    { input: a3, left: 1140, top: 70 }, { input: a4, left: 1680, top: 70 },
  ]).png().toFile(path.join(SHEETS, 'sheet-avatares.png'));

  const l1 = await sharp(fs.readFileSync(path.join(OUT_LOGO, 'lockup-a-horizontal.png'))).resize(1400).png().toBuffer();
  const l2 = await sharp(fs.readFileSync(path.join(OUT_LOGO, 'lockup-b-horizontal.png'))).resize(1400).png().toBuffer();
  const l3 = await sharp(fs.readFileSync(path.join(OUT_LOGO, 'lockup-c-horizontal.png'))).resize(1400).png().toBuffer();
  await bg(1520, 1420).composite([
    { input: l1, left: 60, top: 40 }, { input: l2, left: 60, top: 480 }, { input: l3, left: 60, top: 920 },
  ]).png().toFile(path.join(SHEETS, 'sheet-lockups.png'));

  console.log('renders ok');
})();
