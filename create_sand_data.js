const fs = require('fs');

const colorBuf = fs.readFileSync('models/sand_texture_color.jpg');
const normalBuf = fs.readFileSync('models/sand_texture_normal.png');

const colorB64 = colorBuf.toString('base64');
const normalB64 = normalBuf.toString('base64');

const js = 'window.SAND_COLOR_BASE64 = "data:image/jpeg;base64,' + colorB64 + '";\n' +
           'window.SAND_NORMAL_BASE64 = "data:image/png;base64,' + normalB64 + '";\n';

fs.writeFileSync('models/sand_texture_data.js', js, 'utf8');
console.log('Successfully created models/sand_texture_data.js! Size:', fs.statSync('models/sand_texture_data.js').size);
