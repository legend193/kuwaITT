const fs = require('fs');
const zlib = require('zlib');

function generateSeamlessSand() {
  const size = 32;
  const table = new Float32Array(size * size * size * size);
  let seed = 1337;
  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 4294967296) * 2 - 1;
  }
  for (let i = 0; i < table.length; i++) table[i] = rand();

  function smooth(t) { return t * t * (3 - 2 * t); }

  function noise4D(x, y, z, w) {
    const xi = ((Math.floor(x) % size) + size) % size;
    const yi = ((Math.floor(y) % size) + size) % size;
    const zi = ((Math.floor(z) % size) + size) % size;
    const wi = ((Math.floor(w) % size) + size) % size;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);
    const wf = w - Math.floor(w);

    const sx = smooth(xf), sy = smooth(yf), sz = smooth(zf), sw = smooth(wf);

    function get(ox, oy, oz, ow) {
      const idx = ((((xi + ox) % size) * size + ((yi + oy) % size)) * size + ((zi + oz) % size)) * size + ((wi + ow) % size);
      return table[idx];
    }

    let val = 0;
    for (let ow = 0; ow < 2; ow++) {
      const kw = ow === 0 ? 1 - sw : sw;
      for (let oz = 0; oz < 2; oz++) {
        const kz = oz === 0 ? 1 - sz : sz;
        for (let oy = 0; oy < 2; oy++) {
          const ky = oy === 0 ? 1 - sy : sy;
          for (let ox = 0; ox < 2; ox++) {
            const kx = ox === 0 ? 1 - sx : sx;
            val += get(ox, oy, oz, ow) * kx * ky * kz * kw;
          }
        }
      }
    }
    return val;
  }

  const width = 1024, height = 1024;
  const heightMap = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    const v = y / height;
    const sinV = Math.sin(v * Math.PI * 2);
    const cosV = Math.cos(v * Math.PI * 2);

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const sinU = Math.sin(u * Math.PI * 2);
      const cosU = Math.cos(u * Math.PI * 2);

      // 4-octave smooth continuous 4D torus sampling
      const n1 = noise4D(cosU * 1.8, sinU * 1.8, cosV * 1.8, sinV * 1.8) * 0.48;
      const n2 = noise4D(cosU * 4.2 + 8, sinU * 4.2, cosV * 4.2, sinV * 4.2 + 8) * 0.24;
      const n3 = noise4D(cosU * 9.5 + 16, sinU * 9.5, cosV * 9.5, sinV * 9.5 + 16) * 0.14;
      const n4 = noise4D(cosU * 22.0 + 32, sinU * 22.0, cosV * 22.0, sinV * 22.0 + 32) * 0.08;

      const h = (n1 + n2 + n3 + n4 + 1.0) * 0.5;
      heightMap[y * width + x] = Math.max(0, Math.min(1, h));
    }
  }

  // Pure PNG encoder
  function createPNG(bufferRGB, w, h, isRGBA) {
    const channels = isRGBA ? 4 : 3;
    const rawData = Buffer.alloc((w * channels + 1) * h);
    let p = 0;
    for (let y = 0; y < h; y++) {
      rawData[p++] = 0;
      for (let x = 0; x < w; x++) {
        const srcIdx = (y * w + x) * channels;
        for (let c = 0; c < channels; c++) {
          rawData[p++] = bufferRGB[srcIdx + c];
        }
      }
    }

    const compressed = zlib.deflateSync(rawData, { level: 9 });

    function crc32(buf) {
      let c = 0xffffffff;
      for (let i = 0; i < buf.length; i++) {
        c ^= buf[i];
        for (let j = 0; j < 8; j++) {
          c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
        }
      }
      return (c ^ 0xffffffff) >>> 0;
    }

    function makeChunk(type, data) {
      const len = data.length;
      const chunk = Buffer.alloc(12 + len);
      chunk.writeUInt32BE(len, 0);
      chunk.write(type, 4, 4, 'ascii');
      data.copy(chunk, 8);
      const crc = crc32(chunk.slice(4, 8 + len));
      chunk.writeUInt32BE(crc, 8 + len);
      return chunk;
    }

    const header = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0);
    ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8;
    ihdr[9] = isRGBA ? 6 : 2;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const ihdrChunk = makeChunk('IHDR', ihdr);
    const idatChunk = makeChunk('IDAT', compressed);
    const iendChunk = makeChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
  }

  // 1. Color Buffer (Rich Kuwait Golden Desert Dunes - Non-Washout Palette)
  // Low: warm desert shadows (155, 118, 62)
  // Mid: classic Kuwait golden sand (188, 148, 86)
  // High: warm sunlit sand dunes crest (212, 172, 108)
  const colorBuf = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const h = heightMap[i];
    let r, g, b;
    if (h < 0.5) {
      const t = h / 0.5;
      r = Math.round(155 + t * (188 - 155));
      g = Math.round(118 + t * (148 - 118));
      b = Math.round(62 + t * (86 - 62));
    } else {
      const t = (h - 0.5) / 0.5;
      r = Math.round(188 + t * (212 - 188));
      g = Math.round(148 + t * (172 - 148));
      b = Math.round(86 + t * (108 - 86));
    }
    colorBuf[i * 3 + 0] = r;
    colorBuf[i * 3 + 1] = g;
    colorBuf[i * 3 + 2] = b;
  }

  // 2. Normal Map Buffer (Periodic Sobel)
  const normalBuf = Buffer.alloc(width * height * 3);
  const bumpStrength = 3.2;
  for (let y = 0; y < height; y++) {
    const ym1 = (y - 1 + height) % height;
    const yp1 = (y + 1) % height;
    for (let x = 0; x < width; x++) {
      const xm1 = (x - 1 + width) % width;
      const xp1 = (x + 1) % width;

      const dX = (heightMap[y * width + xp1] - heightMap[y * width + xm1]) * bumpStrength;
      const dY = (heightMap[yp1 * width + x] - heightMap[ym1 * width + x]) * bumpStrength;

      let nx = -dX;
      let ny = -dY;
      let nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len; ny /= len; nz /= len;

      normalBuf[(y * width + x) * 3 + 0] = Math.round((nx * 0.5 + 0.5) * 255);
      normalBuf[(y * width + x) * 3 + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalBuf[(y * width + x) * 3 + 2] = Math.round((nz * 0.5 + 0.5) * 255);
    }
  }

  const pngColor = createPNG(colorBuf, width, height, false);
  const pngNormal = createPNG(normalBuf, width, height, false);

  fs.writeFileSync('models/sand_dunes_color.png', pngColor);
  fs.writeFileSync('models/sand_dunes_normal.png', pngNormal);

  const base64Color = pngColor.toString('base64');
  const base64Normal = pngNormal.toString('base64');

  const jsContent = '// Generated Rich Golden Seamless Desert Sand Textures for Kuwait 3D\n' +
    'window.SAND_COLOR_BASE64 = "data:image/png;base64,' + base64Color + '";\n' +
    'window.SAND_NORMAL_BASE64 = "data:image/png;base64,' + base64Normal + '";\n';

  fs.writeFileSync('models/sand_texture_data.js', jsContent, 'utf8');
  console.log('✓ Successfully generated rich golden desert sand textures! File size: ' + jsContent.length + ' bytes');
}

generateSeamlessSand();
