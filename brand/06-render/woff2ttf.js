// Converte WOFF (v1) para TTF, sem dependências externas.
const fs = require('fs');
const zlib = require('zlib');

function woffToTtf(buf) {
  if (buf.readUInt32BE(0) !== 0x774F4646) throw new Error('not woff');
  const flavor = buf.readUInt32BE(4);
  const numTables = buf.readUInt16BE(12);
  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const o = 44 + i * 20;
    tables.push({
      tag: buf.slice(o, o + 4).toString('latin1'),
      offset: buf.readUInt32BE(o + 4),
      compLength: buf.readUInt32BE(o + 8),
      origLength: buf.readUInt32BE(o + 12),
      checksum: buf.readUInt32BE(o + 16),
    });
  }
  const searchRange = Math.pow(2, Math.floor(Math.log2(numTables))) * 16;
  const entrySelector = Math.floor(Math.log2(numTables));
  const rangeShift = numTables * 16 - searchRange;

  const header = Buffer.alloc(12 + numTables * 16);
  header.writeUInt32BE(flavor, 0);
  header.writeUInt16BE(numTables, 4);
  header.writeUInt16BE(searchRange, 6);
  header.writeUInt16BE(entrySelector, 8);
  header.writeUInt16BE(rangeShift, 10);

  const out = [header];
  let offset = header.length;
  const sorted = tables.slice().sort((a, b) => (a.tag < b.tag ? -1 : 1));
  const bodies = [];
  let bodyOffset = offset;
  sorted.forEach((t, i) => {
    const raw = buf.slice(t.offset, t.offset + t.compLength);
    const data = t.compLength < t.origLength ? zlib.inflateSync(raw) : raw;
    header.write(t.tag, 12 + i * 16, 4, 'latin1');
    header.writeUInt32BE(t.checksum, 12 + i * 16 + 4);
    header.writeUInt32BE(bodyOffset, 12 + i * 16 + 8);
    header.writeUInt32BE(data.length, 12 + i * 16 + 12);
    const pad = (4 - (data.length % 4)) % 4;
    bodies.push(data, Buffer.alloc(pad));
    bodyOffset += data.length + pad;
  });
  return Buffer.concat([header, ...bodies]);
}

for (const f of process.argv.slice(2)) {
  const buf = fs.readFileSync(f);
  const ttf = woffToTtf(buf);
  const out = f.replace(/\.ttf$/, '.ttf');
  fs.writeFileSync(out, ttf);
  console.log(out, ttf.length);
}
