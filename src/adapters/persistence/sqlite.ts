import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { emptySnapshot, type Snapshot } from '../../core/models';

export class StateStore {
  private db: Database.Database;
  constructor(directory: string) {
    mkdirSync(directory, { recursive: true });
    this.db = new Database(join(directory, 'state.db'));
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
    this.db.transaction(() => {
      this.db.exec(
        'CREATE TABLE IF NOT EXISTS state (id INTEGER PRIMARY KEY CHECK (id = 1), json TEXT NOT NULL); PRAGMA user_version = 1;',
      );
    })();
  }
  load(): Snapshot {
    const row = this.db.prepare('SELECT json FROM state WHERE id = 1').get() as { json: string } | undefined;
    return row ? (JSON.parse(row.json) as Snapshot) : emptySnapshot();
  }
  save(state: Snapshot): void {
    this.db
      .prepare('INSERT INTO state (id,json) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET json=excluded.json')
      .run(JSON.stringify(state));
  }
  close(): void {
    this.db.close();
  }
}
