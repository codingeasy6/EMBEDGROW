import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.map': 'application/json'
};

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;

function resolveFilePath(urlPath) {
  // Strip query strings and hash
  const cleanPath = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  let relativePath = cleanPath;

  if (relativePath === '/' || relativePath === '') {
    relativePath = '/index.html';
  }

  let fullPath = path.join(ROOT_DIR, relativePath);

  // Prevent directory traversal attacks
  if (!fullPath.startsWith(ROOT_DIR)) {
    return null;
  }

  // 1. Direct file match
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    return fullPath;
  }

  // 2. Clean URL match (e.g. /services -> /services.html)
  if (fs.existsSync(fullPath + '.html') && fs.statSync(fullPath + '.html').isFile()) {
    return fullPath + '.html';
  }

  // 3. Directory index match
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    const indexPath = path.join(fullPath, 'index.html');
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
      return indexPath;
    }
  }

  return null;
}

const server = http.createServer((req, res) => {
  // Handle /api/contact (Cloudflare Pages Function simulation) or legacy POST
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      let data = {};
      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(body);
        } catch {
          data = {};
        }
      } else {
        const params = new URLSearchParams(body);
        for (const [key, value] of params.entries()) {
          data[key] = value;
        }
      }

      const botField = (data['bot-field'] || data['_gotcha'] || '').trim();
      const name = (data.name || '').trim();
      const email = (data.email || '').trim();
      const mobile = (data.mobile || '').trim();
      const service = (data.service || '').trim();
      const message = (data.message || '').trim();

      console.log('\n--------------------------------------------------');
      console.log('  📬 [Dev Server] Contact Submission Received');
      console.log('--------------------------------------------------');
      console.log('  Name:     ', name || '(empty)');
      console.log('  Email:    ', email || '(empty)');
      console.log('  Mobile:   ', mobile || '(empty)');
      console.log('  Service:  ', service || '(empty)');
      console.log('  Message:  ', message || '(empty)');
      console.log('  Honeypot: ', botField ? `BLOCKED (${botField})` : 'PASSED (clean)');
      console.log('--------------------------------------------------\n');

      res.setHeader('Content-Type', 'application/json; charset=utf-8');

      if (botField !== '') {
        // Silently accept honeypot bot trap
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Inquiry received.' }));
        return;
      }

      if (!name || !email || !mobile || !service || !message) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: 'Please fill in all required fields marked with *.'
        }));
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'Thank you! Your project inquiry has been submitted successfully. Our team will review your requirements and reach out within 24 hours.'
      }));
    });
    return;
  }

  const filePath = resolveFilePath(req.url);

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>404 Not Found | EMBEDGROW</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #071A2B; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .box { text-align: center; padding: 2rem; }
          h1 { font-size: 3rem; color: #FF641C; margin: 0 0 1rem; }
          p { color: #94A3B8; margin-bottom: 2rem; }
          a { color: #0B7285; background: #fff; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>404 - Page Not Found</h1>
          <p>The requested path <code>${escapeHtml(req.url)}</code> does not exist.</p>
          <a href="/">Back to Homepage</a>
        </div>
      </body>
      </html>
    `);
    console.log(`[404] ${req.method} ${req.url}`);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.setHeader('Content-Type', contentType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Internal Server Error');
    console.error(`[500] ${req.url}:`, err.message);
  });

  stream.pipe(res);
  console.log(`[200] ${req.method} ${req.url} -> ${path.relative(ROOT_DIR, filePath)}`);
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function startServer(port) {
  server.listen(port, () => {
    console.log('\n==================================================');
    console.log('  🚀 EMBEDGROW Local Development Server');
    console.log('==================================================');
    console.log(`  > Local:    http://localhost:${port}`);
    console.log(`  > Network:  http://127.0.0.1:${port}`);
    console.log(`  > Features: Clean URLs enabled (/services, /projects, etc.)`);
    console.log('==================================================\n');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(DEFAULT_PORT);
