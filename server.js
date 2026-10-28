const express = require('express');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip/brotli compression for all responses
// This compresses the base64 model data and scripts by 70%+, ensuring blazing fast loads on Heroku
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// Set proper MIME types and Cache-Control headers
express.static.mime.define({
  'model/gltf-binary': ['glb'],
  'application/json': ['geojson', 'json'],
  'application/javascript': ['js']
});

// Serve static assets with caching headers
app.use(express.static(path.join(__dirname), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // HTML is not cached aggressively to allow instant updates
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else {
      // Scripts, models, textures cached for performance
      res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    }
  }
}));

// Health check endpoint for Heroku dyno monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

// Fallback: serve index.html for any route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🇰🇼 Kuwait 3D History Journey Server Running!`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🚀 Mode: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
