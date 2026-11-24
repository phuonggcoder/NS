import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { handleApiRequest } from '../server-api.mjs';

describe('Projects CRUD, Backward Compatibility & Version Restore', () => {
  let rootDir;
  let server;
  let baseUrl;
  let cookie;

  before(async () => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specpage-proj-'));
    server = http.createServer(async (req, res) => {
      if (await handleApiRequest(req, res, { rootDir })) return;
      res.statusCode = 404;
      res.end('Not found');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;

    const setup = await fetch(`${baseUrl}/api/auth/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'AdminPassword2026!' }),
    });
    cookie = setup.headers.get('set-cookie').split(';')[0];
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it('persists legacy projects without digitalMenu or reviewToken and auto-assigns reviewToken', async () => {
    const legacySpec = {
      specVersion: '1.0.0',
      templateId: 'creator-store',
      updatedAt: new Date().toISOString(),
      meta: { title: 'Legacy Site', description: 'Desc', favicon: '✨', floatingContact: { enabled: false, label: '', href: '#' } },
      theme: { presetId: 'speckit-crisp', mode: 'light', colors: { primary: '#007AFF', accent: '#5856D6', background: '#FFFFFF', surface: '#FFFFFF', surfaceAlt: '#F5F5F7', text: '#1D1D1F', muted: '#6E6E73', border: '#E5E5EA' }, typography: { headingFont: 'Inter', bodyFont: 'Inter', scale: 'standard' }, shape: { radius: 'rounded', buttonStyle: 'solid', cardStyle: 'bordered' }, spacing: 'standard' },
      sections: [],
    };

    const putRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        activeProjectId: 'p-1',
        projects: [
          {
            id: 'p-1',
            slug: 'legacy-cafe',
            projectName: 'Legacy Cafe',
            clientName: 'Anh A',
            status: 'draft',
            notes: '',
            updatedAt: new Date().toISOString(),
            spec: legacySpec,
          },
        ],
      }),
    });
    assert.equal(putRes.status, 200);

    const getRes = await fetch(`${baseUrl}/api/projects`, { headers: { Cookie: cookie } });
    const data = await getRes.json();
    assert.equal(data.ok, true);
    assert.equal(data.projects.length, 1);
    assert.ok(typeof data.projects[0].reviewToken === 'string' && data.projects[0].reviewToken.length >= 16);
  });

  it('saves versions and restores previous version while creating pre-restore safety snapshot', async () => {
    const v1Spec = {
      specVersion: '1.0.0',
      templateId: 'coffee-shop',
      meta: { title: 'Version 1 Title', description: 'V1', favicon: '☕', floatingContact: { enabled: false, label: '', href: '#' } },
      theme: {},
      sections: [],
    };
    const v2Spec = { ...v1Spec, meta: { ...v1Spec.meta, title: 'Version 2 Title' } };

    // Save v1 checkpoint
    const saveV1 = await fetch(`${baseUrl}/api/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ slug: 'legacy-cafe', label: 'Mốc V1', scope: 'both', spec: v1Spec }),
    });
    const v1Data = await saveV1.json();
    assert.equal(v1Data.ok, true);

    // Update active project to v2
    await fetch(`${baseUrl}/api/projects`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        activeProjectId: 'p-1',
        projects: [{ id: 'p-1', slug: 'legacy-cafe', projectName: 'Legacy Cafe', clientName: 'Anh A', status: 'draft', notes: '', updatedAt: new Date().toISOString(), spec: v2Spec }],
      }),
    });

    // Restore v1
    const restoreRes = await fetch(`${baseUrl}/api/versions/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ slug: 'legacy-cafe', versionId: v1Data.version.id }),
    });
    const restoreData = await restoreRes.json();
    assert.equal(restoreData.ok, true);
    assert.equal(restoreData.restored.spec.meta.title, 'Version 1 Title');

    // Verify project was restored and safety snapshot of v2 exists in versions list
    const listRes = await fetch(`${baseUrl}/api/versions?slug=legacy-cafe`, { headers: { Cookie: cookie } });
    const listData = await listRes.json();
    assert.ok(listData.versions.length >= 2);
    assert.ok(listData.versions.some((v) => v.spec.meta.title === 'Version 2 Title'));
  });
});
