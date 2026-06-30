/**
 * Database portability: export/import the full SQLite database as a `.db` file.
 * The exported file is a standard SQLite binary, so data stays portable and
 * locally owned.
 */
import { exportDatabase, importDatabase } from './db';
import { todayISO } from '../utils/dates';

/** Trigger a download of the current database as `GymPro_<date>.db`. */
export function downloadDatabase(): void {
  const data = exportDatabase();
  // Copy into a fresh ArrayBuffer-backed view so the typing satisfies BlobPart.
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GymPro_${todayISO()}.db`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Read a user-selected `.db` file and replace the current database.
 * Throws on read failure so callers can surface an error to the user.
 */
export function readDatabaseFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = (ev) => {
      try {
        const buffer = ev.target?.result;
        if (!(buffer instanceof ArrayBuffer)) throw new Error('Invalid file contents');
        importDatabase(new Uint8Array(buffer));
        resolve();
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Import failed — not a valid GymPro database'));
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
