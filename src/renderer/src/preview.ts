import { defaultSettings, type Snapshot } from '../../core/models';
import { catalog } from '../../shared/catalog';
import type { DeckAPI } from '../../shared/contracts';

const date = '2026-10-17T09:32:00+08:00';
const fixture: Snapshot = {
  settings: { ...defaultSettings },
  lastScan: date,
  warnings: [],
  installations: [
    {
      id: 'demo-codex',
      toolId: 'codex',
      name: 'Codex CLI',
      version: '0.153.4',
      versionSource: 'package.json',
      path: 'D:\\tools\\nvm\\v22.23.1\\node_global',
      realPath: 'D:\\tools\\nvm\\v22.23.1\\node_global',
      prefix: 'D:\\tools\\nvm\\v22.23.1\\node_global',
      channel: 'npm',
      health: 'ready',
      managed: true,
      policy: 'notify',
      runtimeId: 'demo-node22',
    },
    {
      id: 'demo-claude',
      toolId: 'claude',
      name: 'Claude Code',
      version: '2.1.296',
      versionSource: '官方原生',
      path: 'C:\\Users\\demo\\.local\\bin\\claude.exe',
      realPath: 'C:\\Users\\demo\\.local\\bin\\claude.exe',
      channel: '官方原生',
      health: 'ready',
      managed: true,
      policy: 'global',
    },
    {
      id: 'demo-cursor',
      toolId: 'cursor',
      name: 'Cursor',
      version: '0.47.8',
      versionSource: '注册表',
      path: 'C:\\Users\\demo\\AppData\\Local\\Programs\\Cursor',
      realPath: 'C:\\Users\\demo\\AppData\\Local\\Programs\\Cursor',
      channel: '注册表',
      health: 'ready',
      managed: false,
      policy: 'global',
    },
    {
      id: 'demo-windsurf',
      toolId: 'windsurf',
      name: 'Windsurf',
      version: '1.13.5',
      versionSource: '注册表',
      path: 'C:\\Users\\demo\\AppData\\Local\\Programs\\Windsurf',
      realPath: 'C:\\Users\\demo\\AppData\\Local\\Programs\\Windsurf',
      channel: '注册表',
      health: 'ready',
      managed: false,
      policy: 'global',
    },
    {
      id: 'demo-desktop',
      toolId: 'codex-desktop',
      name: 'Codex',
      version: '26.1013.4894.0',
      versionSource: 'Microsoft Store',
      path: 'C:\\Program Files\\WindowsApps\\Codex',
      realPath: 'C:\\Program Files\\WindowsApps\\Codex',
      channel: 'Microsoft Store',
      health: 'ready',
      managed: false,
      policy: 'global',
    },
    {
      id: 'demo-gemini',
      toolId: 'gemini',
      name: 'Gemini CLI',
      version: null,
      versionSource: 'pnpm 入口',
      path: 'C:\\Users\\demo\\AppData\\Local\\pnpm\\gemini.cmd',
      realPath: 'C:\\Users\\demo\\AppData\\Local\\pnpm\\gemini.cmd',
      channel: 'pnpm 入口',
      health: 'broken',
      managed: false,
      policy: 'notify',
    },
  ],
  runtimes: [
    {
      id: 'demo-node22',
      version: '22.23.1',
      path: 'D:\\tools\\nvm\\v22.23.1',
      npmPath: 'D:\\tools\\nvm\\v22.23.1\\node_modules\\npm\\bin\\npm-cli.js',
      active: true,
      healthy: true,
      architecture: 'x64',
    },
    {
      id: 'demo-node24',
      version: '24.21.0',
      path: 'D:\\tools\\nvm\\v24.21.0',
      npmPath: 'D:\\tools\\nvm\\v24.21.0\\node_modules\\npm\\bin\\npm-cli.js',
      active: false,
      healthy: true,
      architecture: 'x64',
    },
  ],
  skills: [
    {
      id: 'demo-impeccable',
      name: 'impeccable',
      description: '设计、审视和打磨有品质的产品界面。',
      hosts: ['Agents'],
      path: 'C:\\Users\\demo\\.agents\\skills\\impeccable',
      realPath: 'C:\\Users\\demo\\.agents\\skills\\impeccable',
      fingerprint: 'demo',
      shared: false,
      modified: false,
      ownedByHost: false,
    },
    {
      id: 'demo-find',
      name: 'find-skills',
      description: '发现适合当前任务的技能，拓展你的工具箱。',
      hosts: ['Agents', 'Codex', 'Claude'],
      path: 'C:\\Users\\demo\\.agents\\skills\\find-skills',
      realPath: 'C:\\Users\\demo\\.agents\\skills\\find-skills',
      fingerprint: 'demo',
      shared: true,
      modified: false,
      ownedByHost: false,
    },
    {
      id: 'demo-image',
      name: 'image-to-code',
      description: '从视觉设计出发，构建忠实而灵动的前端。',
      hosts: ['Agents'],
      path: 'C:\\Users\\demo\\.agents\\skills\\image-to-code',
      realPath: 'C:\\Users\\demo\\.agents\\skills\\image-to-code',
      fingerprint: 'demo',
      shared: false,
      modified: false,
      ownedByHost: false,
    },
  ],
  jobs: [
    {
      id: 'demo-job',
      kind: 'scan',
      title: '发现本机工具与 Skills',
      status: 'success',
      startedAt: date,
      finishedAt: date,
      detail: '界面示例任务；未访问当前电脑。',
    },
  ],
};
let state = structuredClone(fixture);
try {
  const saved = localStorage.getItem('ai-deck-preview-settings');
  if (saved) state.settings = { ...defaultSettings, ...JSON.parse(saved) };
} catch {
  /* Private browsing may disable storage. */
}
const unsupported = async (): Promise<never> => {
  throw new Error('这是界面预览。请在桌面客户端中操作本机工具。');
};
export const previewAPI: DeckAPI = {
  snapshot: async () => structuredClone(state),
  scan: unsupported,
  checkUpdates: unsupported,
  manage: async (id, managed) => {
    state = {
      ...state,
      installations: state.installations.map((i) => (i.id === id ? { ...i, managed } : i)),
    };
    return structuredClone(state);
  },
  setPolicy: async (id, policy) => {
    state.installations = state.installations.map((i) => (i.id === id ? { ...i, policy } : i));
    return structuredClone(state);
  },
  saveSettings: async (settings) => {
    localStorage.setItem('ai-deck-preview-settings', JSON.stringify(settings));
    state.settings = settings;
    return structuredClone(state);
  },
  backupSkill: unsupported,
  restoreSkill: unsupported,
  openDirectory: unsupported,
  openWebsite: async (id) => {
    const tool = catalog.find((i) => i.id === id);
    if (tool) window.open(tool.website, '_blank', 'noopener,noreferrer');
  },
  windowAction: async () => {},
  selfUpdate: async () => ({
    status: 'unavailable',
    currentVersion: '0.1.0',
    message: '预览模式。正式签名版本发布后可使用客户端更新。',
    notes: [],
  }),
  checkSelfUpdate: unsupported,
  installSelfUpdate: unsupported,
  onChanged: () => () => {},
};
