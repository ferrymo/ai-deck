import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StateStore } from '../../src/adapters/persistence/sqlite';
import { fingerprint, identity } from '../../src/adapters/system/discovery';
import { backupSkill, restoreSkill } from '../../src/adapters/system/skill-backup';
import { emptySnapshot, type Skill } from '../../src/core/models';
import { DeckService } from '../../src/worker/service';

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'ai-deck-test-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});
async function makeSkill(): Promise<Skill> {
  const path = join(root, 'skill');
  await mkdir(path);
  await writeFile(join(path, 'SKILL.md'), 'original');
  return {
    id: identity(path),
    name: 'test',
    description: 'test',
    hosts: ['Codex'],
    path,
    realPath: path,
    fingerprint: await fingerprint(path),
    modified: false,
    shared: false,
    ownedByHost: false,
  };
}
describe('SQLite 与任务恢复', () => {
  it('设置和实例在重启后保留', () => {
    let store = new StateStore(root);
    const state = emptySnapshot();
    state.settings.page = 'skills';
    store.save(state);
    store.close();
    store = new StateStore(root);
    expect(store.load().settings.page).toBe('skills');
    store.close();
  });
  it('中断任务标记待核实，不重放文件操作', async () => {
    const store = new StateStore(root);
    const state = emptySnapshot();
    state.jobs = [
      {
        id: 'job',
        kind: 'restore',
        title: '恢复',
        status: 'running',
        startedAt: new Date().toISOString(),
        detail: '',
      },
    ];
    store.save(state);
    store.close();
    const service = new DeckService(root, () => {});
    const snapshot = await service.dispatch({ type: 'snapshot' });
    expect(typeof snapshot !== 'string' && snapshot.jobs[0]?.status).toBe('interrupted');
    await service.dispatch({ type: 'shutdown' });
  });
});
describe('Skills 文件保护', () => {
  it('备份与恢复保留 Git 元数据，不丢失来源记录', async () => {
    const skill = await makeSkill();
    await mkdir(join(skill.path, '.git'));
    await writeFile(join(skill.path, '.git', 'HEAD'), 'ref: refs/heads/main');
    const backup = await backupSkill(skill, join(root, 'data'));
    await restoreSkill(skill, backup, await fingerprint(skill.path));
    expect(await readFile(join(skill.path, '.git', 'HEAD'), 'utf8')).toBe('ref: refs/heads/main');
  });
  it('完整树指纹能发现修改和新增文件', async () => {
    const skill = await makeSkill();
    await writeFile(join(skill.path, 'extra.txt'), 'new');
    expect(await fingerprint(skill.path)).not.toBe(skill.fingerprint);
  });
  it('通过共享 junction 备份和恢复物理目标，不覆盖其他副本', async () => {
    const skill = await makeSkill();
    const link = join(root, 'shared');
    await symlink(skill.path, link, 'junction');
    skill.path = link;
    const backup = await backupSkill(skill, join(root, 'data'));
    await writeFile(join(skill.realPath, 'SKILL.md'), 'modified');
    await restoreSkill(skill, backup, await fingerprint(skill.realPath));
    expect(await readFile(join(link, 'SKILL.md'), 'utf8')).toBe('original');
    expect((await readdir(root)).some((name) => name.startsWith('skill.aideck-before-restore'))).toBe(true);
  });
  it('扫描后出现新修改时拒绝恢复，原文件保持不变', async () => {
    const skill = await makeSkill();
    const backup = await backupSkill(skill, join(root, 'data'));
    await writeFile(join(skill.path, 'SKILL.md'), 'new user changes');
    await expect(restoreSkill(skill, backup, skill.fingerprint)).rejects.toThrow('新的本地修改');
    expect(await readFile(join(skill.path, 'SKILL.md'), 'utf8')).toBe('new user changes');
  });
  it('嵌套 junction 不被递归扫描或复制', async () => {
    const skill = await makeSkill();
    const other = join(root, 'outside');
    await mkdir(other);
    await symlink(other, join(skill.path, 'nested'), 'junction');
    await expect(backupSkill(skill, join(root, 'data'))).rejects.toThrow('嵌套链接');
  });
});
