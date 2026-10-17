import type { Policy, SelfUpdate, Settings, Snapshot } from '../core/models';
export type Action =
  | { type: 'snapshot' }
  | { type: 'scan' }
  | { type: 'check' }
  | { type: 'manage'; id: string; managed: boolean }
  | { type: 'policy'; id: string; policy: Policy }
  | { type: 'settings'; settings: Settings }
  | { type: 'backup'; id: string }
  | { type: 'restore'; id: string }
  | { type: 'resolve-path'; id: string }
  | { type: 'shutdown' };
export type WorkerResult = Snapshot | string;
export interface DeckAPI {
  snapshot(): Promise<Snapshot>;
  scan(): Promise<Snapshot>;
  checkUpdates(): Promise<Snapshot>;
  manage(id: string, managed: boolean): Promise<Snapshot>;
  setPolicy(id: string, policy: Policy): Promise<Snapshot>;
  saveSettings(settings: Settings): Promise<Snapshot>;
  backupSkill(id: string): Promise<Snapshot>;
  restoreSkill(id: string): Promise<Snapshot>;
  openDirectory(id: string): Promise<void>;
  openWebsite(toolId: string): Promise<void>;
  windowAction(action: 'minimize' | 'maximize' | 'close'): Promise<void>;
  selfUpdate(): Promise<SelfUpdate>;
  checkSelfUpdate(): Promise<SelfUpdate>;
  installSelfUpdate(): Promise<SelfUpdate>;
  onChanged(listener: () => void): () => void;
}
const pages = ['overview', 'tools', 'skills', 'store', 'runtimes', 'tasks', 'settings'];
export function validateSettings(value: unknown): Settings {
  if (!value || typeof value !== 'object') throw new Error('设置格式无效');
  const s = value as Record<string, unknown>;
  for (const key of ['autoUpdate', 'launchAtLogin', 'notifications', 'selfUpdate']) {
    if (typeof s[key] !== 'boolean') throw new Error('设置开关无效');
  }
  if (
    !Number.isInteger(s.intervalMinutes) ||
    Number(s.intervalMinutes) < 15 ||
    Number(s.intervalMinutes) > 1440
  )
    throw new Error('检查周期应为 15–1440 分钟');
  for (const key of ['dailyTime', 'windowStart', 'windowEnd'])
    if (typeof s[key] !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(s[key]))
      throw new Error('时间格式无效');
  if (
    !['continuous', 'daily'].includes(String(s.scheduleMode)) ||
    !['light', 'dark', 'system'].includes(String(s.theme)) ||
    !pages.includes(String(s.page))
  )
    throw new Error('设置选项无效');
  if (typeof s.timezone !== 'string' || s.timezone.length > 100) throw new Error('时区无效');
  new Intl.DateTimeFormat('en', { timeZone: s.timezone });
  return {
    autoUpdate: s.autoUpdate as boolean,
    launchAtLogin: s.launchAtLogin as boolean,
    notifications: s.notifications as boolean,
    selfUpdate: s.selfUpdate as boolean,
    intervalMinutes: s.intervalMinutes as number,
    dailyTime: s.dailyTime as string,
    windowStart: s.windowStart as string,
    windowEnd: s.windowEnd as string,
    timezone: s.timezone,
    scheduleMode: s.scheduleMode as Settings['scheduleMode'],
    theme: s.theme as Settings['theme'],
    page: s.page as Settings['page'],
  };
}
export function validateId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(value)) throw new Error('对象标识无效');
  return value;
}
