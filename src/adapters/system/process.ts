import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execute = promisify(execFile);
export async function run(file: string, args: string[], timeout = 15000): Promise<string> {
  const { stdout } = await execute(file, args, {
    windowsHide: true,
    timeout,
    maxBuffer: 4 * 1024 * 1024,
    encoding: 'utf8',
  });
  return stdout.trim();
}
export function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/(token|password|authorization|api[_-]?key)([=: ]+)[^\s&]+/gi, '$1$2[已隐藏]')
    .slice(0, 1600);
}
