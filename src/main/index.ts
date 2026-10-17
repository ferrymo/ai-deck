import { stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Notification,
  nativeImage,
  powerMonitor,
  shell,
  Tray,
} from 'electron';
import type { Policy, Snapshot } from '../core/models';
import { definition } from '../shared/catalog';
import { type Action, validateId, validateSettings } from '../shared/contracts';
import { AppUpdater } from './self-update';
import { WorkerHost } from './worker-host';

let window: BrowserWindow | undefined;
let tray: Tray | undefined;
let quitting = false;
let worker: WorkerHost;
let updater: AppUpdater;
const smoke = process.env.AI_DECK_SMOKE === '1';
const dataPath =
  process.env.AI_DECK_DATA_DIR || join(process.env.LOCALAPPDATA ?? app.getPath('appData'), 'AI Deck');
app.setPath('userData', dataPath);
const lock = app.requestSingleInstanceLock();
if (!lock) {
  quitting = true;
  app.quit();
} else {
  app.on('second-instance', () => {
    window?.show();
    window?.focus();
  });
  void app.whenReady().then(start);
}

async function start(): Promise<void> {
  const changed = () => {
    if (window && !window.isDestroyed()) window.webContents.send('deck:changed');
  };
  worker = new WorkerHost(dataPath, changed);
  updater = new AppUpdater(worker, changed, () => {
    quitting = true;
  });
  worker.start();
  window = new BrowserWindow({
    icon: join(app.getAppPath(), 'resources/icon.png'),
    width: 1320,
    height: 880,
    minWidth: 860,
    minHeight: 620,
    show: false,
    frame: false,
    backgroundColor: '#f8f9fb',
    title: 'AI Deck',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.on('ready-to-show', () => {
    if (!smoke) window?.show();
  });
  window.on('close', (event) => {
    if (!quitting) {
      event.preventDefault();
      window?.hide();
    }
  });
  registerIPC();
  if (process.env.ELECTRON_RENDERER_URL) await window.loadURL(process.env.ELECTRON_RENDERER_URL);
  else await window.loadFile(join(__dirname, '../renderer/index.html'));
  tray = new Tray(
    nativeImage
      .createFromPath(join(app.getAppPath(), 'resources/icon.png'))
      .resize({ width: 20, height: 20 }),
  );
  tray.setToolTip('AI Deck · 个人 AI 工具管家');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '打开 AI Deck', click: () => window?.show() },
      { type: 'separator' },
      { label: '退出 AI Deck', click: () => void quitSafely() },
    ]),
  );
  tray.on('double-click', () => window?.show());
  let lastCheck = Date.now();
  let lastDaily = '';
  const schedule = async (force = false) => {
    if (quitting || updater.blocksChanges() || smoke) return;
    try {
      const state = (await worker.request({ type: 'snapshot' })) as Snapshot;
      const now = new Date();
      const local = new Intl.DateTimeFormat('sv-SE', {
        timeZone: state.settings.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now);
      const day = local.slice(0, 10);
      const time = local.slice(-5);
      const due =
        state.settings.scheduleMode === 'daily'
          ? day !== lastDaily && time >= state.settings.dailyTime
          : Date.now() - lastCheck >= state.settings.intervalMinutes * 60000;
      if ((force || due) && !state.jobs.some((job) => job.status === 'running') && state.lastScan) {
        lastCheck = Date.now();
        lastDaily = day;
        const result = (await worker.request({ type: 'check' })) as Snapshot;
        if (result.jobs[0]?.status === 'failed' && state.settings.notifications && Notification.isSupported())
          new Notification({ title: 'AI Deck · 更新检查失败', body: '打开任务记录查看原因并重试。' }).show();
      }
    } catch (error) {
      console.error('Scheduler:', error instanceof Error ? error.message : '后台检查失败');
    }
  };
  setInterval(() => void schedule(), 60000).unref();
  powerMonitor.on('resume', () => void schedule(true));
  const checkApp = async () => {
    const s = (await worker.request({ type: 'snapshot' })) as Snapshot;
    if (s.settings.selfUpdate && !smoke) await updater.check();
  };
  void checkApp();
  setInterval(() => void checkApp(), 6 * 60 * 60 * 1000).unref();
}

function registerIPC(): void {
  function handle(name: string, handler: (...args: unknown[]) => unknown): void {
    ipcMain.handle(`deck:${name}`, (event, ...args: unknown[]) => {
      if (
        !window ||
        event.sender !== window.webContents ||
        event.senderFrame !== window.webContents.mainFrame
      )
        throw new Error('不可信的请求来源');
      return handler(...args);
    });
  }
  const request = (action: Action) => {
    if (updater.blocksChanges() && action.type !== 'snapshot')
      throw new Error('客户端更新已就绪，正在等待安全重启');
    return worker.request(action);
  };
  handle('snapshot', () => request({ type: 'snapshot' }));
  handle('scan', () => request({ type: 'scan' }));
  handle('check', () => request({ type: 'check' }));
  handle('manage', (id, managed) => {
    if (typeof managed !== 'boolean') throw new Error('接管选项无效');
    return request({ type: 'manage', id: validateId(id), managed });
  });
  handle('policy', (id, policy) => {
    if (!['global', 'notify', 'auto', 'pinned'].includes(String(policy))) throw new Error('策略无效');
    return request({ type: 'policy', id: validateId(id), policy: policy as Policy });
  });
  handle('settings', async (value) => {
    const settings = validateSettings(value);
    const previous = (await worker.request({ type: 'snapshot' })) as Snapshot;
    if (settings.launchAtLogin !== previous.settings.launchAtLogin) {
      if (!app.isPackaged) throw new Error('登录自启需要正式安装版，开发环境未更改系统设置');
      app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin });
    }
    return request({ type: 'settings', settings });
  });
  handle('backup', (id) => request({ type: 'backup', id: validateId(id) }));
  handle('restore', (id) => request({ type: 'restore', id: validateId(id) }));
  handle('directory', async (id) => {
    const path = (await worker.request({ type: 'resolve-path', id: validateId(id) })) as string;
    const info = await stat(path);
    const error = await shell.openPath(info.isDirectory() ? path : dirname(path));
    if (error) throw new Error(error);
  });
  handle('website', (id) => {
    const tool = definition(validateId(id));
    if (!tool?.website) throw new Error('此产品的官方来源尚未核实');
    return shell.openExternal(tool.website);
  });
  handle('window', (action) => {
    if (action === 'minimize') window?.minimize();
    else if (action === 'maximize') {
      if (window?.isMaximized()) window.unmaximize();
      else window?.maximize();
    } else if (action === 'close') window?.close();
    else throw new Error('窗口操作无效');
  });
  handle('self-state', () => updater.state());
  handle('self-check', () => updater.check());
  handle('self-install', () => updater.install());
}
async function quitSafely(): Promise<void> {
  try {
    await worker.stop();
    quitting = true;
    tray?.destroy();
    app.quit();
  } catch (error) {
    window?.show();
    if (Notification.isSupported())
      new Notification({
        title: 'AI Deck',
        body: error instanceof Error ? error.message : '请等待当前任务完成后退出',
      }).show();
  }
}
app.on('before-quit', (event) => {
  if (!quitting) {
    event.preventDefault();
    void quitSafely();
  }
});
app.on('window-all-closed', () => {
  /* The tray owns application lifetime. */
});
