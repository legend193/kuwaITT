const net = require('net');

function sendToBlender(type, params) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let data = '';

    client.connect(9876, '127.0.0.1', () => {
      const msg = JSON.stringify({ type, params });
      client.write(msg);
    });

    client.on('data', chunk => {
      data += chunk;
      try {
        const res = JSON.parse(data);
        client.destroy();
        resolve(res);
      } catch (e) {
        // waiting for full chunk
      }
    });

    client.on('error', err => {
      client.destroy();
      reject(err);
    });

    setTimeout(() => {
      client.destroy();
      if (data) {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(data); }
      } else {
        reject(new Error('Timeout waiting for Blender'));
      }
    }, 15000);
  });
}

module.exports = { sendToBlender };

if (require.main === module) {
  const code = process.argv[2] || 'import bpy; print("Active scene:", bpy.context.scene.name)';
  sendToBlender('execute_code', { code }).then(res => {
    console.log('Response:', JSON.stringify(res, null, 2));
  }).catch(err => {
    console.error('Error:', err);
  });
}
