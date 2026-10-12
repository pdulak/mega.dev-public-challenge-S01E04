import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLine } from './read-night.js';
import type { RunStatus } from './types.js';

export type NightCounts = Record<RunStatus, number>; // lines per status; bad lines not counted

// null = the night's log cannot be read (the board shows —).
export function nightCounts(runsDir: string, night: string): NightCounts | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return null;
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    return null;
  }
  const counts: NightCounts = { ok: 0, retry: 0, fail: 0 };
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    const line = parseLine(raw);
    if (line) counts[line.status]++;
  }
  return counts;
}
