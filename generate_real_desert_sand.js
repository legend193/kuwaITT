const fs = require('fs');
const zlib = require('zlib');

// Function to generate seamless periodic noise for natural sand dunes
function generateDesertSandTextures() {
  const width = 1024;
  const height = 1024;

  // Simple pseudo-random permutation table
  const p = new Uint8Array(512);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.abs(Math.sin(i * 12.9898 + 78.233) * 43758.5453) * (i + 1));
    const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
  }
  for (let i = 0; i < 256; i++) p[256 + i] = p[i];

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(t, a, b) { return a + t * (b - a); }
  function grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }

  // 2D Perlin noise that seamlessly wraps across [0, 1]
  function seamlessNoise(x, y, freq) {
    x = (x * freq) % 1; if (x < 0) x += 1;
    y = (y * freq) % 1; if (y < 0) y += 1;
    // Map unit square to 4D cylinder/torus or wrap coordinates
    const xi = Math.floor(x * freq) % 256;
    const yi = Math.floor(y * freq) % 256;
    const xf = (x * freq) - Math.floor(x * freq);
    const yf = (y * freq) - Math.floor(y * freq);
    const u = fade(xf);
    const v = fade(yf);
    const aa = p[p[xi] + yi];
    const ab = p[p[xi] + (yi + 1) % 256];
    const ba = p[p[(xi + 1) % 256] + yi];
    const bb = p[p[(xi + 1) % 256] + (yi + 1) % 256];
    return lerp(v, lerp(u, grad(aa, xf, yf), grad(ba, xf - 1, yf)),
                   lerp(u, grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1)));
  }

  // Multi-frequency heightmap for desert dunes
  const heightMap = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;

      // 1. Large gentle dunes (كثبان رملية متموجة ناعمة)
      const duneAngle = (nx * 3.0 + ny * 1.5) * Math.PI * 2;
      const duneSwells = Math.sin(duneAngle + Math.sin(ny * Math.PI * 4) * 0.4) * 0.35;

      // 2. Wind ripples (سافي الرياح الصحراوية)
      const rippleAngle = (nx * 14.0 + ny * 7.0) * Math.PI * 2;
      const windRipples = Math.sin(rippleAngle + Math.sin(nx * Math.PI * 6) * 0.3) * 0.18;

      // 3. Organic desert noise layers
      const n1 = seamlessNoise(nx, ny, 4) * 0.25;
      const n2 = seamlessNoise(nx, ny, 10) * 0.12;
      const n3 = seamlessNoise(nx, ny, 24) * 0.06;

      // 4. Fine sand grain
      const grain = (Math.sin(x * 123.45 + y * 678.9) * 0.5 + 0.5) * 0.05;

      const h = (duneSwells + windRipples + n1 + n2 + n3 + grain + 1.0) * 0.5;
      heightMap[y * width + x] = Math.max(0, Math.min(1, h));
    }
  }

  // Generate Color Texture (الوان رمل الكويت الذهبي الأصيل)
  // Base: warm golden desert sand (#DCBE8D)
  // Crests: sunlit sandy highlight (#EAD6AE)
  // Troughs: warm desert shadows (#C6A26B)
  const colorData = Buffer.alloc((width * 4 + 1) * height);
  const normalData = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    colorData[rowOffset] = 0; // PNG filter: None
    normalData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const h = heightMap[y * width + x];
      const pxOffset = rowOffset + 1 + x * 4;

      // Color interpolation:
      // Trough (h=0): R=198, G=162, B=107 (#C6A26B)
      // Mid (h=0.5): R=220, G=190, B=141 (#DCBE8D)
      // Crest (h=1): R=238, G=218, B=178 (#EEDAB2)
      let r, g, b;
      if (h < 0.5) {
        const t = h * 2.0;
        r = 198 + (220 - 198) * t;
        g = 162 + (190 - 162) * t;
        b = 107 + (141 - 107) * t;
      } else {
        const t = (h - 0.5) * 2.0;
        r = 220 + (238 - 220) * t;
        g = 190 + (218 - 190) * t;
        b = 141 + (178 - 141) * t;
      }

      // Add fine micro-speckle
      const speckle = (Math.sin(x * 43.1 + y * 97.7) * 0.5 + 0.5) * 6 - 3;
      colorData[pxOffset]     = Math.min(255, Math.max(0, Math.round(r + speckle)));
      colorData[pxOffset + 1] = Math.min(255, Math.max(0, Math.round(g + speckle * 0.8)));
      colorData[pxOffset + 2] = Math.min(255, Math.max(0, Math.round(b + speckle * 0.6)));
      colorData[pxOffset + 3] = 255;

      // Normal Map (Sobel gradient)
      const xPrev = (x - 1 + width) % width;
      const xNext = (x + 1) % width;
      const yPrev = (y - 1 + height) % height;
      const yNext = (y + 1) % height;

      const dhdx = (heightMap[y * width + xNext] - heightMap[y * width + xPrev]) * 3.5;
      const dhdy = (heightMap[yNext * width + x] - heightMap[yPrev * width + x]) * 3.5;

      // Normal vector = normalize(-dhdx, -dhdy, 1.0)
      const len = Math.sqrt(dhdx * dhdx + dhdy * dhdy + 1.0);
      const nx = -dhdx / len;
      const ny = -dhdy / len;
      const nz = 1.0 / len;

      normalData[pxOffset]     = Math.round((nx * 0.5 + 0.5) * 255);
      normalData[pxOffset + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      normalData[pxOffset + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      normalData[pxOffset + 3] = 255;
    }
  }

  function encodePNG(raw) {
    const compressed = zlib.deflateSync(raw, { level: 9 });
    const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

    function chunk(type, data) {
      const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
      const t = Buffer.from(type, 'ascii');
      const crc = crc32(Buffer.concat([t, data]));
      const crcOut = Buffer.alloc(4); crcOut.writeUInt32BE(crc, 0);
      return Buffer.concat([len, t, data, crcOut]);
    }

    return Buffer.concat([header, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
  }

  function crc32(buf) {
    let c = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xFF];
    }
    return (c ^ (-1)) >>> 0;
  }
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    crcTable[i] = c >>> 0;
  }

  const colorPNG = encodePNG(colorData);
  const normalPNG = encodePNG(normalData);

  fs.writeFileSync('models/sand_dunes_color.png', colorPNG);
  fs.writeFileSync('models/sand_dunes_normal.png', normalPNG);

  const jsContent = 'window.SAND_COLOR_BASE64 = "data:image/png;base64,' + colorPNG.toString('base64') + '";\n' +
                    'window.SAND_NORMAL_BASE64 = "data:image/png;base64,' + normalPNG.toString('base64') + '";\n';
  fs.writeFileSync('models/sand_texture_data.js', jsContent, 'utf8');

  console.log('Successfully generated authentic desert sand textures!');
  console.log('Color PNG size:', colorPNG.length, 'Normal PNG size:', normalPNG.length);
  console.log('Script file size:', fs.statSync('models/sand_texture_data.js').size);
}

generateDesertSandTextures();
