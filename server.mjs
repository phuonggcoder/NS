import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { handleApiRequest, handlePublishedAssetRequest } from './server-api.mjs';
import { applySecurityHeaders } from './server-auth.mjs';
import { getPublicDir, getStorageMode, resolveSafeChild } from './server-store.mjs';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ROOT_DIR = process.cwd();
const PUBLIC_DIR = getPublicDir(ROOT_DIR);
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

async function tryResolveStaticFile(baseDir, urlPath) {
  const relative = urlPath.replace(/^\/+/, '');
  try {
    const candidate = resolveSafeChild(baseDir, relative);
    const stat = await fs.promises.stat(candidate);
    if (stat.isFile()) return candidate;
    if (stat.isDirectory()) {
      const idx = path.join(candidate, 'index.html');
      const idxStat = await fs.promises.stat(idx);
      if (idxStat.isFile()) return idx;
    }
  } catch {
    // Not found in this baseDir
  }
  return null;
}

async function sendFile(res, req, filePath, isAsset) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  const cacheHeader = isAsset
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';

  applySecurityHeaders(res, req);
  res.statusCode = 200;
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', cacheHeader);

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
  stream.pipe(res);
}

const server = http.createServer(async (req, res) => {
  if (await handleApiRequest(req, res, { rootDir: ROOT_DIR })) {
    return;
  }

  // Serve published client sites & specs from persistent store (survives ephemeral disk wipes)
  if (await handlePublishedAssetRequest(req, res, ROOT_DIR)) {
    return;
  }

  const urlObj = new URL(req.url || '/', 'http://localhost');
  const pathname = decodeURIComponent(urlObj.pathname);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  if (pathname !== '/') {
    const publicMatch = await tryResolveStaticFile(PUBLIC_DIR, pathname);
    if (publicMatch) {
      await sendFile(res, req, publicMatch, false);
      return;
    }
  }

  const distPath = pathname === '/' ? '/index.html' : pathname;
  const distMatch = await tryResolveStaticFile(DIST_DIR, distPath);
  if (distMatch) {
    await sendFile(res, req, distMatch, pathname.startsWith('/assets/'));
    return;
  }

  if (!path.extname(pathname)) {
    const spaIndex = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(spaIndex)) {
      await sendFile(res, req, spaIndex, false);
      return;
    }
  }

  applySecurityHeaders(res, req);
  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, HOST, () => {
  console.log(
    `SpecPage Production Server đang chạy tại http://localhost:${PORT}/ (Storage: ${getStorageMode()})`
  );
});
