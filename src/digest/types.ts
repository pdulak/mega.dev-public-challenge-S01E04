export type RunStatus = 'ok' | 'retry' | 'fail';

// One row per job in a night's run log.
export type DigestRow = {
  job: string;
  owner: string | null; // null in the log: keep the row, views show —
  runs: number; // every line for the job
  retries: number; // lines with status "retry"
  lastStatus: RunStatus;
  lastError: string | null;
  firstAt: string; // as written in the log, offset kept
  lastAt: string;
};

export type Night = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[]; // sorted by job
  badLines: number; // lines that did not parse, counted not thrown
};

// null = no runs/<night>.jsonl on disk (routes answer 404). An empty file gives rows: [].
export type ReadNight = (runsDir: string, night: string) => Night | null;
