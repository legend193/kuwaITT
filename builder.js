const fs = require('fs');

const polys = JSON.parse(fs.readFileSync('kuwait_3d_polys.json', 'utf8'));
const polyStr = JSON.stringify(polys);

const template = fs.readFileSync('template.html', 'utf8');
const finalHtml = template.replace('__POLY_DATA__', polyStr);

fs.writeFileSync('index.html', finalHtml, 'utf8');
console.log('Successfully generated index.html! File size:', fs.statSync('index.html').size, 'bytes');
