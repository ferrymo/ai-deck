import { join } from 'node:path';
import { type UtilityProcess, utilityProcess } from 'electron';
import type { Action, WorkerResult } from '../shared/contracts';

export class WorkerHost {
  private child?: UtilityProcess;
  private serial = 0;
  private stopping = false;
  private pending = new Map<
    number,
    {
      resolve: (value: WorkerResult) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  constructor(
    private directory: string,
    private changed: () => void,
  ) {}
  start(): void {
    this.child = utilityProcess.fork(join(__dirname, 'worker.cjs'), [this.directory], {
      serviceName: 'AI Deck tasks',
      stdio: 'pipe',
    });
    this.child.on(
      'message',
      (message: { id?: number; result: WorkerResult; error?: string; changed?: boolean }) => {
        if (message.changed) this.changed();
        if (message.id === undefined) return;
        const request = this.pending.get(message.id);
        if (!request) return;
        clearTimeout(request.timer);
        this.pending.delete(message.id);
        if (message.error) request.reject(new Error(message.error));
        else request.resolve(message.result);
      },
    );
    this.child.on('exit', () => {
      this.child = undefined;
      for (const request of this.pending.values()) {
        clearTimeout(request.timer);
        request.reject(new Error('后台进程已停止。请重试，未自动重复执行文件操作。'));
      }
      this.pending.clear();
      this.changed();
    });
  }
  request(action: Action): Promise<WorkerResult> {
    if (this.stopping) return Promise.reject(new Error('应用正在退出'));
    if (!this.child) this.start();
    return new Promise((resolve, reject) => {
      const id = ++this.serial;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('后台操作超时。请查看任务记录后再重试。'));
      }, 180000);
      this.pending.set(id, { resolve, reject, timer });
      this.child?.postMessage({ id, action });
    });
  }
  async stop(): Promise<void> {
    await this.request({ type: 'shutdown' });
    this.stopping = true;
    this.child?.kill();
  }
}
