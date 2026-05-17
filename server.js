import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function resolveFilePath(urlPath) {
  const clean = urlPath.split('?')[0];

  if (clean === '/' || clean === '') {
    return join(ROOT, 'web', 'index.html');
  }

  if (clean.startsWith('/web/')) {
    return join(ROOT, clean);
  }

  if (clean.startsWith('/src/')) {
    return join(ROOT, clean);
  }

  return null;
}

const server = createServer(async (req, res) => {
  const filePath = resolveFilePath(req.url);

  console.log(`${req.method} ${req.url}`);

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  // WHY: prevent path traversal by ensuring the resolved path stays inside ROOT
  const abs = resolve(filePath);
  if (!abs.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  try {
    const data = await readFile(abs);
    const mime = MIME[extname(abs)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`x-post-analyzer dev server running at http://localhost:${PORT}`);
});
