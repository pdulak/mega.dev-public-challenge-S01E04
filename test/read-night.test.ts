import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read-night.js';

describe('readNight', () => {
  const n = readNight('runs', '2026-10-28');

  it('reads 5 jobs and counts the 1 bad line', () => {
    expect(n?.rows.map((r) => r.job)).toEqual([
      'digest/render', 'fixtures/refresh', 'lane/sync', 'notes/backup', 'rig/rotate-logs',
    ]);
    expect(n?.badLines).toBe(1);
  });

  it('counts runs, retries, last status and last error', () => {
    const fx = n?.rows.find((r) => r.job === 'fixtures/refresh');
    expect(fx).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', lastError: 'upstream 503', owner: 'rook' });
    expect(fx?.firstAt).toBe('2026-10-29T01:30:00+01:00');
    expect(fx?.lastAt).toBe('2026-10-29T01:37:00+01:00');
    expect(n?.rows.find((r) => r.job === 'notes/backup')).toMatchObject({ lastStatus: 'fail', lastError: 'quota exceeded' });
  });

  it('keeps a row whose owner is null', () => {
    expect(n?.rows.find((r) => r.job === 'digest/render')?.owner).toBeNull();
  });

  it('returns null for a night with no file or a bad night name', () => {
    expect(readNight('runs', '2000-01-01')).toBeNull();
    expect(readNight('runs', '../x')).toBeNull();
  });
});
