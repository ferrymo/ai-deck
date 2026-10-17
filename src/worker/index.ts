import { safeError } from '../adapters/system/process';
import type { Action } from '../shared/contracts';
import { DeckService } from './service';

const parent = process.parentPort;
if (!parent || !process.argv[2]) throw new Error('Worker 必须由主进程启动');
const service = new DeckService(process.argv[2], () => parent.postMessage({ changed: true }));
parent.on('message', async ({ data }: { data: { id: number; action: Action } }) => {
  try {
    parent.postMessage({ id: data.id, result: await service.dispatch(data.action) });
  } catch (error) {
    parent.postMessage({ id: data.id, error: safeError(error) });
  }
});
parent.postMessage({ ready: true, napi: process.versions.napi });
