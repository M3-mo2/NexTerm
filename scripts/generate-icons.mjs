import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'src-tauri', 'icons');

mkdirSync(ICONS_DIR, { recursive: true });

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, c]);
}

function generatePNG(size) {
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  const raw = Buffer.alloc((size*3+1)*size);
  for (let y=0; y<size; y++) {
    const off = y*(size*3+1); raw[off]=0;
    for (let x=0; x<size; x++) {
      const px=off+1+x*3;
      raw[px]=0; raw[px+1]=120; raw[px+2]=212; // #0078D4
    }
  }
  return Buffer.concat([sig, makeChunk('IHDR',ihdr), makeChunk('IDAT',zlib.deflateSync(raw)), makeChunk('IEND',Buffer.alloc(0))]);
}

function generateICO(size) {
  const pixels = Buffer.alloc(size*size*4);
  for (let y=0; y<size; y++) for (let x=0; x<size; x++) {
    const i=(y*size+x)*4;
    pixels[i]=212; pixels[i+1]=120; pixels[i+2]=0; pixels[i+3]=255; // BGRA
  }
  const andMask = Buffer.alloc(Math.ceil(size/8)*size, 0);
  const imgDataSize = 40 + pixels.length + andMask.length;

  const bmpHdr = Buffer.alloc(40);
  bmpHdr.writeUInt32LE(40,0); bmpHdr.writeInt32LE(size,4); bmpHdr.writeInt32LE(size*2,8);
  bmpHdr.writeUInt16LE(1,12); bmpHdr.writeUInt16LE(32,14);
  bmpHdr.writeUInt32LE(size*size*4,20);

  const hdr = Buffer.alloc(6);
  hdr.writeUInt16LE(0,0); hdr.writeUInt16LE(1,2); hdr.writeUInt16LE(1,4);

  const entry = Buffer.alloc(16);
  entry[0]=size>=256?0:size; entry[1]=size>=256?0:size;
  entry.writeUInt32LE(imgDataSize,8); entry.writeUInt32LE(22,12);

  return Buffer.concat([hdr, entry, bmpHdr, pixels, andMask]);
}

// Generate all required sizes
writeFileSync(join(ICONS_DIR, 'icon.ico'), generateICO(32));
writeFileSync(join(ICONS_DIR, 'icon.png'), generatePNG(32));
writeFileSync(join(ICONS_DIR, '32x32.png'), generatePNG(32));
writeFileSync(join(ICONS_DIR, '128x128.png'), generatePNG(128));
writeFileSync(join(ICONS_DIR, '128x128@2x.png'), generatePNG(256));

console.log('Icons generated in', ICONS_DIR);