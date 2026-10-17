import { cp, mkdir, realpath, rename, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Skill } from '../../core/models';
import { exists, fingerprint } from './discovery';

export async function backupSkill(skill: Skill, dataPath: string): Promise<string> {
  if (skill.ownedByHost) throw new Error('系统与插件附带技能由宿主管理');
  if ((await realpath(skill.path)).toLowerCase() !== skill.realPath.toLowerCase())
    throw new Error('共享目录目标已变化，请重新扫描');
  const before = await fingerprint(skill.realPath);
  const destination = join(dataPath, 'backups', skill.id, new Date().toISOString().replace(/[:.]/g, '-'));
  await mkdir(dirname(destination), { recursive: true });
  await cp(skill.realPath, destination, {
    recursive: true,
    dereference: false,
  });
  if (before !== (await fingerprint(destination)) || before !== (await fingerprint(skill.realPath)))
    throw new Error('备份期间文件发生变化，备份未通过校验');
  return destination;
}
export async function restoreSkill(skill: Skill, backup: string, expectedFingerprint: string): Promise<void> {
  if (skill.ownedByHost) throw new Error('系统与插件附带技能由宿主管理');
  if ((await realpath(skill.path)).toLowerCase() !== skill.realPath.toLowerCase())
    throw new Error('目标目录已变化，请重新扫描');
  if ((await fingerprint(skill.realPath)) !== expectedFingerprint)
    throw new Error('扫描后存在新的本地修改，请先备份并重新扫描');
  const suffix = Date.now().toString();
  const staging = `${skill.realPath}.aideck-staging-${suffix}`;
  const previous = `${skill.realPath}.aideck-before-restore-${suffix}`;
  await fingerprint(backup);
  await cp(backup, staging, { recursive: true, dereference: false });
  if ((await fingerprint(staging)) !== (await fingerprint(backup)))
    throw new Error('恢复文件校验失败，原目录未更改');
  if ((await fingerprint(skill.realPath)) !== expectedFingerprint) {
    await rm(staging, { recursive: true });
    throw new Error('恢复准备期间出现本地修改，已停止');
  }
  await rename(skill.realPath, previous);
  try {
    await rename(staging, skill.realPath);
  } catch (error) {
    if (!(await exists(skill.realPath))) await rename(previous, skill.realPath);
    throw error;
  }
  // Keep the previous tree beside the restored directory; never discard user changes.
}
