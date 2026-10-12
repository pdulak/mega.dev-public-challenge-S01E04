import type { DigestRow, Night } from '../digest/types.js';

// A row is flagged when a job retried 3 times or more, or its last run failed.
export function needsCheck(row: DigestRow): boolean {
  return row.retries >= 3 || row.lastStatus === 'fail';
}

function Cell({ value }: { value: string | null }) {
  return <td>{value ?? '—'}</td>;
}

export function DigestTable({ night }: { night: Night }) {
  return (
    <>
      <h1>digest · {night.night}</h1>
      {night.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {night.rows.map((row) => {
              const warn = needsCheck(row);
              return (
                <tr class={warn ? 'warn' : undefined}>
                  <Cell value={row.job} />
                  <Cell value={row.owner} />
                  <td>{row.runs}</td>
                  <td>{row.retries}</td>
                  <td>
                    {row.lastStatus}
                    {warn ? ' ! check' : ''}
                  </td>
                  <Cell value={row.lastError} />
                  <Cell value={row.firstAt} />
                  <Cell value={row.lastAt} />
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
