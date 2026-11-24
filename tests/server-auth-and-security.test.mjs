import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { handleApiRequest } from '../server-api.mjs';
import { backupStoreSnapshot, storeGetStrict } from '../server-store.mjs';

describe('Auth, Security & Data Integrity', () => {
  let rootDir;
  let server;
  let baseUrl;
  let adminCookie = '';

  before(async () => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specpage-auth-'));
    server = http.createServer(async (req, res) => {
      if (await handleApiRequest(req, res, { rootDir })) return;
      res.statusCode = 404;
      res.end('Not found');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('rejects unauthenticated admin endpoints with 401', async () => {
    const res = await fetch(`${baseUrl}/api/projects`);
    assert.equal(res.status, 401);
    const aiRes = await fetch(`${baseUrl}/api/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'website_copy', input: 'test' }),
    });
    assert.equal(aiRes.status, 401);
  });

  it('sets up first admin password, issues HttpOnly session cookie, and validates login', async () => {
    const setupRes = await fetch(`${baseUrl}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'StrongPassword123!' }),
    });
    assert.equal(setupRes.status, 200);
    const setCookie = setupRes.headers.get('set-cookie');
    assert.ok(setCookie && setCookie.includes('specpage_session='));
    assert.ok(setCookie.includes('HttpOnly'));
    adminCookie = setCookie.split(';')[0];

    const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'WrongPassword' }),
    });
    assert.equal(badLogin.status, 401);
  });

  it('blocks cross-origin mutations with 403 CSRF guard', async () => {
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
        Origin: 'https://evil-attacker.example',
      },
      body: JSON.stringify({ projects: [], activeProjectId: 'x' }),
    });
    assert.equal(res.status, 403);
  });

  it('distinguishes missing keys from corrupted JSON in storeGetStrict and creates backups', async () => {
    const missing = await storeGetStrict('nonexistent_key', rootDir);
    assert.equal(missing.found, false);

    const kvDir = path.join(rootDir, 'data', 'kv');
    fs.mkdirSync(kvDir, { recursive: true });
    const badKey = Buffer.from('corrupt_test', 'utf8').toString('base64url');
    fs.writeFileSync(path.join(kvDir, `${badKey}.json`), '{not-valid-json', 'utf8');

    await assert.rejects(() => storeGetStrict('corrupt_test', rootDir));

    const backup = await backupStoreSnapshot('unit-test', rootDir);
    assert.ok(backup.backupKey.startsWith('backup:'));
    const loadedBackup = await storeGetStrict(backup.backupKey, rootDir);
    assert.equal(loadedBackup.found, true);
  });
});
