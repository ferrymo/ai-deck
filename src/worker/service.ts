import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { StateStore } from '../adapters/persistence/sqlite';
import { discoverRuntimes, discoverSkills, discoverTools, fingerprint } from '../adapters/system/discovery';
import { safeError } from '../adapters/system/process';
import { backupSkill, restoreSkill } from '../adapters/system/skill-backup';
import type { Job, Snapshot } from '../core/models';
import { definition } from '../shared/catalog';
import type { Action, WorkerResult } from '../shared/contracts';
import { validateSettings } from '../shared/contracts';

export class DeckService {
  private store: StateStore;
  private state: Snapshot;
  private busy = false;
  constructor(
    private directory: string,
    private changed: () => void,
  ) {
    this.store = new StateStore(directory);
    this.state = this.store.load();
    for (const job of this.state.jobs)
      if (job.status === 'running') {
        job.status = 'interrupted';
        job.finishedAt = new Date().toISOString();
        job.detail = '上次运行意外中断。请重新扫描以核实状态；未自动重放文件操作。';
      }
    this.save();
  }
  private save(): Snapshot {
    this.store.save(this.state);
    this.changed();
    return structuredClone(this.state);
  }
  private async task(
    kind: Job['kind'],
    title: string,
    work: () => Promise<string>,
    targetId?: string,
  ): Promise<Snapshot> {
    if (this.busy) throw new Error('已有任务正在运行，请等待完成');
    this.busy = true;
    const job: Job = {
      id: randomUUID(),
      kind,
      title,
      status: 'running',
      startedAt: new Date().toISOString(),
      detail: '正在处理…',
      targetId,
    };
    this.state.jobs = [job, ...this.state.jobs].slice(0, 150);
    this.save();
    try {
      job.detail = await work();
      job.status = 'success';
    } catch (error) {
      job.detail = safeError(error);
      job.status = 'failed';
    } finally {
      job.finishedAt = new Date().toISOString();
      this.busy = false;
    }
    return this.save();
  }
  async dispatch(action: Action): Promise<WorkerResult> {
    switch (action.type) {
      case 'snapshot':
        return structuredClone(this.state);
      case 'scan':
        return this.task('scan', '发现本机工具与 Skills', async () => {
          const warnings: string[] = [];
          const runtimes = await discoverRuntimes(warnings);
          const installations = await discoverTools(runtimes, warnings);
          const skills = await discoverSkills(warnings);
          this.state.installations = installations.map((item) => {
            const previous = this.state.installations.find((i) => i.id === item.id);
            return previous
              ? {
                  ...item,
                  managed: previous.managed,
                  policy: previous.policy,
                  latestVersion: previous.latestVersion,
                  checkedAt: previous.checkedAt,
                  checkError: previous.checkError,
                }
              : item;
          });
          this.state.skills = skills.map((skill) => {
            const previous = this.state.skills.find((i) => i.id === skill.id);
            return {
              ...skill,
              baseline: previous?.baseline,
              modified: !!previous?.baseline && previous.baseline !== skill.fingerprint,
              backupAt: previous?.backupAt,
            };
          });
          this.state.runtimes = runtimes;
          this.state.lastScan = new Date().toISOString();
          this.state.warnings = warnings;
          return `发现 ${installations.length} 个工具实例、${skills.length} 个物理 Skill 目录和 ${runtimes.length} 个运行时。${warnings.length ? `另有 ${warnings.length} 项扫描提示，见总览。` : ''}`;
        });
      case 'check':
        return this.task('check', '检查工具更新', async () => {
          let count = 0;
          const errors: string[] = [];
          const packages = new Map<string, { version: string }>();
          for (const instance of this.state.installations) {
            const pkg = definition(instance.toolId)?.packageName;
            if (!pkg || instance.channel !== 'npm' || instance.health !== 'ready') continue;
            try {
              let metadata = packages.get(pkg);
              if (!metadata) {
                const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`, {
                  signal: AbortSignal.timeout(15000),
                });
                if (!response.ok) throw new Error(`官方源返回 HTTP ${response.status}`);
                const data: unknown = await response.json();
                if (
                  !data ||
                  typeof data !== 'object' ||
                  !('version' in data) ||
                  typeof data.version !== 'string' ||
                  !/^\d+\.\d+\.\d+$/.test(data.version)
                )
                  throw new Error('官方源没有可识别的稳定版本');
                metadata = { version: data.version };
                packages.set(pkg, metadata);
              }
              instance.latestVersion = metadata.version;
              instance.checkedAt = new Date().toISOString();
              delete instance.checkError;
              count++;
            } catch (error) {
              instance.checkError = safeError(error);
              errors.push(`${instance.name}：${instance.checkError}`);
            }
          }
          if (errors.length) throw new Error(`${count} 个实例检查完成；${errors.join('；')}`);
          return count
            ? `已从官方 npm 源检查 ${count} 个实例。其他渠道请使用官方更新入口。`
            : '暂无支持在线检查的 npm 实例。可先扫描本机，其他渠道请使用官方更新入口。';
        });
      case 'manage': {
        const item = this.state.installations.find((i) => i.id === action.id);
        if (item?.health !== 'ready') throw new Error('请先修复或验证此安装实例');
        item.managed = action.managed;
        return this.save();
      }
      case 'policy': {
        const item = this.state.installations.find((i) => i.id === action.id);
        if (!item) throw new Error('安装实例不存在');
        item.policy = action.policy;
        return this.save();
      }
      case 'settings':
        this.state.settings = validateSettings(action.settings);
        return this.save();
      case 'backup':
        return this.task(
          'backup',
          '备份个人 Skill',
          async () => {
            const skill = this.state.skills.find((i) => i.id === action.id);
            if (!skill) throw new Error('Skill 不存在，请重新扫描');
            const backup = await backupSkill(skill, this.directory);
            const current = await fingerprint(backup);
            await writeFile(
              join(this.directory, 'backups', skill.id, 'latest.json'),
              JSON.stringify({ path: backup, fingerprint: current }),
              'utf8',
            );
            skill.baseline = current;
            skill.fingerprint = await fingerprint(skill.realPath);
            skill.modified = skill.fingerprint !== current;
            skill.backupAt = new Date().toISOString();
            return '完整文件树已备份并通过指纹校验。此基线仅用于本地变更检测，不代表已核实上游来源。';
          },
          action.id,
        );
      case 'restore':
        return this.task(
          'restore',
          '恢复个人 Skill 备份',
          async () => {
            const skill = this.state.skills.find((i) => i.id === action.id);
            if (!skill?.backupAt) throw new Error('没有可恢复的备份');
            const record = JSON.parse(
              await readFile(join(this.directory, 'backups', skill.id, 'latest.json'), 'utf8'),
            ) as { path: string; fingerprint: string };
            if (
              !record.path.startsWith(join(this.directory, 'backups', skill.id)) ||
              (await fingerprint(record.path)) !== record.fingerprint
            )
              throw new Error('备份身份或内容校验失败');
            await restoreSkill(skill, record.path, skill.fingerprint);
            skill.fingerprint = await fingerprint(skill.realPath);
            skill.modified = false;
            return '备份已恢复。恢复前的完整目录保留在原目录旁，文件名含 aideck-before-restore。';
          },
          action.id,
        );
      case 'resolve-path': {
        const item = [...this.state.installations, ...this.state.skills, ...this.state.runtimes].find(
          (i) => i.id === action.id,
        );
        if (!item) throw new Error('对象不存在，请重新扫描');
        return item.path;
      }
      case 'shutdown':
        if (this.busy) throw new Error('请等待当前任务完成');
        this.store.close();
        return 'closed';
    }
  }
}
