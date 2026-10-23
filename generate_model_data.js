const fs = require('fs');

console.log('Reading malarjakt.glb...');
const b64_1 = fs.readFileSync('models/malarjakt.glb').toString('base64');
fs.writeFileSync('models/malarjakt_data.js', 'window.MALARJAKT_GLB_BASE64 = "' + b64_1 + '";\n', 'utf8');
console.log('Written malarjakt_data.js, size:', fs.statSync('models/malarjakt_data.js').size);

console.log('Reading nordic_folkboat.glb...');
const b64_2 = fs.readFileSync('models/nordic_folkboat.glb').toString('base64');
fs.writeFileSync('models/nordic_folkboat_data.js', 'window.NORDIC_FOLKBOAT_GLB_BASE64 = "' + b64_2 + '";\n', 'utf8');
console.log('Written nordic_folkboat_data.js, size:', fs.statSync('models/nordic_folkboat_data.js').size);
