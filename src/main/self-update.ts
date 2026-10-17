import { app } from 'electron';
import { autoUpdater } from 'electron-updater';
import packageMetadata from '../../package.json';
import type { SelfUpdate, Snapshot } from '../core/models';
import { releaseChannel } from './release-channel';
import type { WorkerHost } from './worker-host';

export class AppUpdater {
  private value: SelfUpdate = {
    status: 'unavailable',
    currentVersion: packageMetadata.version,
    message: '开发版本。正式签名安装包发布后可检查客户端更新。',
    notes: [],
  };
  private requested = false;
  constructor(
    private worker: WorkerHost,
    private changed: () => void,
    private beforeInstall: () => void,
  ) {
    if (!app.isPackaged || !releaseChannel.verified) return;
    this.value.status = 'idle';
    this.value.message = '客户端更新尚未检查';
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowPrerelease = false;
    autoUpdater.allowDowngrade = false;
    autoUpdater.fullChangelog = true;
    autoUpdater.on('checking-for-update', () =>
      this.set({ status: 'checking', message: '正在检查客户端更新…' }),
    );
    autoUpdater.on('update-not-available', () => this.set({ status: 'idle', message: '当前已是最新版本' }));
    autoUpdater.on('update-available', (info) =>
      this.set({
        status: 'downloading',
        version: info.version,
        progress: 0,
        message: '正在后台下载并校验更新',
        notes:
          typeof info.releaseNotes === 'string'
            ? [{ version: info.version, note: info.releaseNotes }]
            : (info.releaseNotes ?? []).map((note) => ({ version: note.version, note: note.note ?? '' })),
      }),
    );
    autoUpdater.on('download-progress', (progress) => this.set({ progress: progress.percent }));
    autoUpdater.on('update-downloaded', () =>
      this.set({ status: 'ready', message: `更新至 v${this.value.version} 并重启` }),
    );
    autoUpdater.on('error', (error) => {
      this.requested = false;
      this.set({ status: 'failed', message: error.message.slice(0, 500) });
    });
  }
  private set(patch: Partial<SelfUpdate>): void {
    this.value = { ...this.value, ...patch };
    this.changed();
  }
  state(): SelfUpdate {
    return this.value;
  }
  async check(): Promise<SelfUpdate> {
    if (
      !app.isPackaged ||
      !releaseChannel.verified ||
      ['checking', 'downloading', 'ready', 'waiting', 'installing'].includes(this.value.status)
    )
      return this.value;
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.set({
        status: 'failed',
        message: error instanceof Error ? error.message.slice(0, 500) : '检查失败，请稍后重试',
      });
    }
    return this.value;
  }
  async install(): Promise<SelfUpdate> {
    if (this.requested || this.value.status !== 'ready') return this.value;
    this.requested = true;
    this.set({ status: 'waiting', message: '等待当前任务完成后自动重启更新' });
    void this.finishWhenIdle();
    return this.value;
  }
  private async finishWhenIdle(): Promise<void> {
    try {
      const snapshot = (await this.worker.request({ type: 'snapshot' })) as Snapshot;
      if (snapshot.jobs.some((job) => job.status === 'running')) {
        setTimeout(() => void this.finishWhenIdle(), 1000);
        return;
      }
      await this.worker.stop();
      this.set({ status: 'installing', message: '正在安装并重启…' });
      this.beforeInstall();
      autoUpdater.quitAndInstall(true, true);
    } catch (error) {
      this.requested = false;
      this.set({ status: 'failed', message: error instanceof Error ? error.message : '更新准备失败' });
    }
  }
  blocksChanges(): boolean {
    return this.requested;
  }
}
