export type Page = 'overview' | 'tools' | 'skills' | 'store' | 'runtimes' | 'tasks' | 'settings';
export type Policy = 'global' | 'notify' | 'auto' | 'pinned';
export type Health = 'ready' | 'broken' | 'config-only' | 'unknown';
export type Category = 'cli' | 'desktop' | 'editor' | 'companion';
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: Category;
  website: string;
  color: string;
  mark: string;
  packageName?: string;
  capability: 'npm' | 'official' | 'discover';
}
export interface Installation {
  id: string;
  toolId: string;
  name: string;
  version: string | null;
  versionSource: string;
  path: string;
  realPath: string;
  channel: string;
  health: Health;
  managed: boolean;
  policy: Policy;
  runtimeId?: string;
  prefix?: string;
  latestVersion?: string;
  checkedAt?: string;
  checkError?: string;
}
export interface Runtime {
  id: string;
  version: string;
  path: string;
  npmPath: string;
  active: boolean;
  healthy: boolean;
  architecture: string;
}
export interface Skill {
  id: string;
  name: string;
  description: string;
  hosts: string[];
  path: string;
  realPath: string;
  source?: string;
  fingerprint: string;
  baseline?: string;
  modified: boolean;
  shared: boolean;
  ownedByHost: boolean;
  backupAt?: string;
}
export interface Job {
  id: string;
  kind: 'scan' | 'check' | 'backup' | 'restore';
  title: string;
  status: 'running' | 'success' | 'failed' | 'interrupted';
  startedAt: string;
  finishedAt?: string;
  detail: string;
  targetId?: string;
}
export interface Settings {
  autoUpdate: boolean;
  intervalMinutes: number;
  scheduleMode: 'continuous' | 'daily';
  dailyTime: string;
  windowStart: string;
  windowEnd: string;
  timezone: string;
  launchAtLogin: boolean;
  notifications: boolean;
  selfUpdate: boolean;
  theme: 'light' | 'dark' | 'system';
  page: Page;
}
export interface Snapshot {
  installations: Installation[];
  runtimes: Runtime[];
  skills: Skill[];
  jobs: Job[];
  settings: Settings;
  lastScan?: string;
  warnings: string[];
}
export interface SelfUpdate {
  status: 'unavailable' | 'idle' | 'checking' | 'downloading' | 'ready' | 'waiting' | 'installing' | 'failed';
  currentVersion: string;
  version?: string;
  progress?: number;
  message: string;
  notes: { version: string; note: string }[];
}
export const defaultSettings: Settings = {
  autoUpdate: false,
  intervalMinutes: 30,
  scheduleMode: 'continuous',
  dailyTime: '09:00',
  windowStart: '09:00',
  windowEnd: '22:00',
  timezone: 'Asia/Hong_Kong',
  launchAtLogin: false,
  notifications: true,
  selfUpdate: true,
  theme: 'light',
  page: 'overview',
};
export const emptySnapshot = (): Snapshot => ({
  installations: [],
  runtimes: [],
  skills: [],
  jobs: [],
  settings: { ...defaultSettings },
  warnings: [],
});
