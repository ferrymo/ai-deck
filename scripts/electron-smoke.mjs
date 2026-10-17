import { _electron as electron } from '@playwright/test';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const dataDirectory = await mkdtemp(join(tmpdir(), 'ai-deck-smoke-'));
const env = { ...process.env, AI_DECK_SMOKE: '1', AI_DECK_DATA_DIR: dataDirectory };
delete env.ELECTRON_RUN_AS_NODE;
delete env.ELECTRON_RENDERER_URL;
const packaged = process.argv.includes('--packaged');
const app = await electron.launch({ executablePath: packaged ? resolve('release/win-unpacked/AI Deck.exe') : require('electron'), args: packaged ? [] : [resolve('.')], env, timeout: 30000 });
try {
  const page = await app.firstWindow();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.waitForSelector('h1', { timeout: 30000 });
  const security = await app.evaluate(({ BrowserWindow }) => {
    const prefs = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return { sandbox: prefs.sandbox, contextIsolation: prefs.contextIsolation, nodeIntegration: prefs.nodeIntegration, versions: process.versions };
  });
  if (!security.sandbox || !security.contextIsolation || security.nodeIntegration) throw new Error('安全窗口配置不符合约束');
  const initial = await page.evaluate(() => window.deck.snapshot());
  if (initial.installations.length) throw new Error('隔离数据库初始状态不是空白');
  const scan = await page.evaluate(() => window.deck.scan());
  if (scan.jobs[0]?.status !== 'success') throw new Error(scan.jobs[0]?.detail ?? '扫描未完成');
  const setting = await page.evaluate(async () => { const state = await window.deck.snapshot(); return window.deck.saveSettings({ ...state.settings, page: 'tools' }); });
  if (setting.settings.page !== 'tools') throw new Error('设置未持久化');
  await page.reload(); await page.waitForFunction(() => document.querySelector('main h1')?.textContent === '我的工具', { timeout: 30000 });
  await mkdir('.impeccable/review', { recursive: true });
  const capture = await app.evaluate(async ({ BrowserWindow }) => {
    const image = await BrowserWindow.getAllWindows()[0].webContents.capturePage(undefined, { stayHidden: true, stayAwake: true });
    return image.toPNG().toString('base64');
  });
  await writeFile('.impeccable/review/electron-real.png',Buffer.from(capture,'base64'));
  const forbidden = await page.evaluate(() => ({ require: typeof window.require, nodeProcess: typeof window.process }));
  if (forbidden.require !== 'undefined' || forbidden.nodeProcess !== 'undefined') throw new Error('渲染器暴露了 Node 全局');
  const result = { security, forbidden, errors, scan: { installations: scan.installations.length, runtimes: scan.runtimes.length, skills: scan.skills.length, warnings: scan.warnings, tools: scan.installations.map(i => ({ name: i.name, version: i.version, health: i.health, channel: i.channel })), jobs: scan.jobs }, dataDirectory };
  await writeFile('.impeccable/review/electron-smoke.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, scan: { ...result.scan, warnings: result.scan.warnings.length, tools: undefined, jobs: undefined } }, null, 2));
  if (errors.length) throw new Error('渲染器出现错误');
} finally {
  await app.close();
}
