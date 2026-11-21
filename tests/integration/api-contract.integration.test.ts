import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { Server } from 'node:http';
import { app } from '../../src/server';

describe('Integration: Express/Bun HTTP API Contract', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === 'object' && addr ? addr.port : 3099;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.closeAllConnections?.();
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('GET /api/health returns service status and active version', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; version: string };
    expect(body.status).toBe('ok');
    expect(body.version).toBe('v2.5.0');
  });

  it('POST /api/cicd/runs creates a GitLab CI run and updates staging target health', async () => {
    const createRes = await fetch(`${baseUrl}/api/cicd/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branch: 'staging',
        commitMessage: 'test(integration): verify staging pipeline endpoint',
        triggerEvent: 'gitlab_push',
      }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { run: { id: string; commitSha: string; branch: string } };
    expect(created.run.id).toContain('gl-pipe-');
    expect(created.run.branch).toBe('staging');

    const healthRes = await fetch(`${baseUrl}/api/cicd/staging-health`);
    expect(healthRes.status).toBe(200);
    const health = (await healthRes.json()) as { status: string; commitSha: string };
    expect(health.status).toBe('healthy');
    expect(health.commitSha).toBe(created.run.commitSha);
  });

  it('POST /api/cicd/rollback validates commitSha and restores staging commit', async () => {
    const badRes = await fetch(`${baseUrl}/api/cicd/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(badRes.status).toBe(400);

    const okRes = await fetch(`${baseUrl}/api/cicd/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commitSha: 'b9d41e2' }),
    });
    expect(okRes.status).toBe(200);
    const body = (await okRes.json()) as { success: boolean; staging: { activeCommitSha: string } };
    expect(body.success).toBe(true);
    expect(body.staging.activeCommitSha).toBe('b9d41e2');
  });

  it('PATCH /api/uat/scenarios/:id and POST /api/uat/signoff persist business stakeholder review', async () => {
    const listRes = await fetch(`${baseUrl}/api/uat/scenarios`);
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as { scenarios: Array<{ id: string }> };
    expect(listBody.scenarios.length).toBeGreaterThanOrEqual(4);

    const patchRes = await fetch(`${baseUrl}/api/uat/scenarios/UAT-01`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'approved',
        reviewerName: 'Morgan Lee',
        reviewerNote: 'Team project flow is clear and responsive.',
      }),
    });
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as { scenario: { status: string; reviewerName: string } };
    expect(patched.scenario.status).toBe('approved');
    expect(patched.scenario.reviewerName).toBe('Morgan Lee');

    const invalidSignOff = await fetch(`${baseUrl}/api/uat/signoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved', signedBy: '' }),
    });
    expect(invalidSignOff.status).toBe(400);

    const validSignOff = await fetch(`${baseUrl}/api/uat/signoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'approved',
        signedBy: 'Morgan Lee',
        role: 'VP of Operations',
        summaryNote: 'Approved for production launch.',
      }),
    });
    expect(validSignOff.status).toBe(201);

    const checkRes = await fetch(`${baseUrl}/api/uat/signoff`);
    const checkBody = (await checkRes.json()) as { signOff: { decision: string; signedBy: string } };
    expect(checkBody.signOff.decision).toBe('approved');
    expect(checkBody.signOff.signedBy).toBe('Morgan Lee');
  });

  it('Projects & Storage endpoints enforce validation, immutability, and roundtrip download', async () => {
    const createProj = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Integration Test Project', teamId: 'team_enterprise_alpha' }),
    });
    expect(createProj.status).toBe(201);
    const { project } = (await createProj.json()) as { project: { $id: string; name: string } };

    const immutableAttempt = await fetch(`${baseUrl}/api/projects?id=${encodeURIComponent(project.$id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ createdBy: 'usr_attacker' }),
    });
    expect(immutableAttempt.status).toBe(400);

    const uploadRes = await fetch(`${baseUrl}/api/storage/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'uat-notes.txt',
        mimeType: 'text/plain',
        base64Data: `data:text/plain;base64,${Buffer.from('Verified UAT Output').toString('base64')}`,
      }),
    });
    expect(uploadRes.status).toBe(201);
    const { fileId } = (await uploadRes.json()) as { fileId: string };

    const downloadRes = await fetch(`${baseUrl}/api/storage/download?fileId=${encodeURIComponent(fileId)}`);
    expect(downloadRes.status).toBe(200);
    const downloaded = (await downloadRes.json()) as { fileName: string; dataUrl: string };
    expect(downloaded.fileName).toBe('uat-notes.txt');
    expect(downloaded.dataUrl).toContain('data:text/plain;base64,');
  });
});
