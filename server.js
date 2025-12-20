const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// Verify dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error(`ERROR: dist directory does not exist at ${DIST_DIR}`);
  console.error(`Current working directory: ${process.cwd()}`);
  console.error(`__dirname: ${__dirname}`);
  console.error(`Contents of __dirname: ${fs.readdirSync(__dirname).join(', ')}`);
  process.exit(1);
}

// Verify index.html exists
const indexPath = path.join(DIST_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`ERROR: index.html does not exist at ${indexPath}`);
  console.error(`Contents of dist directory: ${fs.readdirSync(DIST_DIR).join(', ')}`);
  process.exit(1);
}

console.log(`Starting server on port ${PORT}`);
console.log(`Serving files from ${DIST_DIR}`);
console.log(`index.html exists: ${fs.existsSync(indexPath)}`);

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // Remove query string
  filePath = filePath.split('?')[0];
  
  // For SPA routing, serve index.html for non-file requests
  const ext = path.extname(filePath);
  if (!ext && !fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found, serve index.html for SPA routing
        const indexPath = path.join(DIST_DIR, 'index.html');
        fs.readFile(indexPath, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        });
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }
    
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});

// Handle errors
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

