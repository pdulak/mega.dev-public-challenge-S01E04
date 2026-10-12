import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { RigConfig } from '../src/config.js';

// Routes under test are added by other workers; these tests fail until they are merged.
// Fixtures live in a temp dir, never in runs/.
let runsDir: string;
let config: RigConfig;

const line = (at: string, job: string, status: 'ok' | 'retry' | 'fail', owner: string | null = null, error: string | null = null) =>
  JSON.stringify({ at, job, status, owner, error });

beforeAll(() => {
  runsDir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  writeFileSync(
    join(runsDir, '2026-10-28.jsonl'),
    [
      line('2026-10-28T01:00:00+01:00', 'digest/render', 'ok'),
      line('2026-10-28T01:10:00+01:00', 'fixtures/refresh', 'retry', 'rook', 'upstream 503'),
      line('2026-10-28T01:12:00+01:00', 'fixtures/refresh', 'ok', 'rook'),
      line('2026-10-28T02:00:00+01:00', 'notes/backup', 'fail', null, 'quota exceeded'),
      '',
    ].join('\n'),
  );
  writeFileSync(join(runsDir, '2026-10-27.jsonl'), '');
  writeFileSync(
    join(runsDir, '2026-10-26.jsonl'),
    [line('2026-10-26T01:00:00+01:00', 'lane/sync', 'ok'), 'not json at all'].join('\n'),
  );
  config = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir };
});

afterAll(() => {
  rmSync(runsDir, { recursive: true, force: true });
});

describe('GET /digest/:night', () => {
  it('renders 200 with the job names of the night', async () => {
    const res = await createApp(config).request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('digest/render');
    expect(html).toContain('fixtures/refresh');
    expect(html).toContain('notes/backup');
  });

  it('answers 404 for a night with no file', async () => {
    const res = await createApp(config).request('/digest/2000-01-01');
    expect(res.status).toBe(404);
  });

  it('renders the text "nothing ran" for an empty night file', async () => {
    const res = await createApp(config).request('/digest/2026-10-27');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });

  it('still renders 200 for a night with a bad line', async () => {
    const res = await createApp(config).request('/digest/2026-10-26');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('lane/sync');
  });
});

describe('GET /api/digest/:night', () => {
  it('answers 200 with {night, rows, badLines}', async () => {
    const res = await createApp(config).request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { night: string; rows: { job: string }[]; badLines: number };
    expect(body.night).toBe('2026-10-28');
    expect(body.rows.map((r) => r.job)).toEqual(['digest/render', 'fixtures/refresh', 'notes/backup']);
    expect(body.badLines).toBe(0);
  });

  it('answers 404 with a JSON error for a night with no file', async () => {
    const res = await createApp(config).request('/api/digest/2000-01-01');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: expect.any(String) });
  });

  it('gives rows [] for an empty night', async () => {
    const res = await createApp(config).request('/api/digest/2026-10-27');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ night: '2026-10-27', rows: [] });
  });

  it('counts the bad line for a night with one', async () => {
    const res = await createApp(config).request('/api/digest/2026-10-26');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { badLines: number };
    expect(body.badLines).toBeGreaterThanOrEqual(1);
  });
});
