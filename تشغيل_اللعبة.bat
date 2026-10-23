@echo off
chcp 65001 > nul
cls
echo ========================================================
echo   تشغيل لعبة: رحلة عبر تاريخ الكويت 3D
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [✓] تم العثور على Node.js .. جاري بدء الخادم وتجهيز النماذج 3D...
    start "" http://localhost:8080/index.html
    node -e "const http = require('http'); const fs = require('fs'); const server = http.createServer((req, res) => { let p = '.' + decodeURI(req.url.split('?')[0]); if (p === './') p = './index.html'; fs.readFile(p, (err, data) => { if (err) { res.writeHead(404); res.end('Not found'); } else { let mime = 'text/html'; if (p.endsWith('.js')) mime = 'application/javascript'; else if (p.endsWith('.glb')) mime = 'model/gltf-binary'; else if (p.endsWith('.json')) mime = 'application/json'; res.writeHead(200, {'Content-Type': mime, 'Access-Control-Allow-Origin': '*'}); res.end(data); } }); }); server.listen(8080, () => console.log('الخادم يعمل بنجاح على: http://localhost:8080/'));"
    exit /b
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [✓] تم العثور على Python .. جاري بدء الخادم...
    start "" http://localhost:8080/index.html
    python -m http.server 8080
    exit /b
)

echo جاري فتح اللعبة في المتصفح مباشرة...
start "" "%~dp0index.html"
