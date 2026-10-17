import { describe, expect, it } from 'vitest';
import { defaultSettings, type Installation } from '../../src/core/models';
import { canAutoInstall, inInstallWindow, isNewer } from '../../src/core/policy';
import { validateId, validateSettings } from '../../src/shared/contracts';

const item: Installation = {
  id: 'one',
  toolId: 'codex',
  name: 'Codex',
  path: 'a',
  realPath: 'a',
  version: '1.0.0',
  versionSource: 'package.json',
  channel: 'npm',
  health: 'ready',
  managed: true,
  policy: 'auto',
};
describe('更新策略边界', () => {
  it('全局关闭优先于实例自动策略', () => expect(canAutoInstall(defaultSettings, item, '12:00')).toBe(false));
  it('固定版本与非受管实例从不自动安装', () => {
    const settings = { ...defaultSettings, autoUpdate: true };
    expect(canAutoInstall(settings, { ...item, policy: 'pinned' }, '12:00')).toBe(false);
    expect(canAutoInstall(settings, { ...item, managed: false }, '12:00')).toBe(false);
    expect(canAutoInstall(settings, { ...item, health: 'broken' }, '12:00')).toBe(false);
  });
  it('支持跨午夜时段且结束边界不执行', () => {
    const settings = { ...defaultSettings, windowStart: '22:00', windowEnd: '06:00' };
    expect(inInstallWindow(settings, '23:00')).toBe(true);
    expect(inInstallWindow(settings, '05:59')).toBe(true);
    expect(inInstallWindow(settings, '06:00')).toBe(false);
    expect(inInstallWindow(settings, '15:00')).toBe(false);
  });
  it('不把渠道版本或预发布版本误判为可升级', () => {
    expect(isNewer('1.10.0', '1.9.9')).toBe(true);
    expect(isNewer('1.2.0', '2.0.0')).toBe(false);
    expect(isNewer('1.3.0-beta.1', '1.2.0')).toBe(false);
    expect(isNewer('26.1013.4894.0', '1.2.0')).toBe(false);
  });
});
describe('IPC 输入校验', () => {
  it('拒绝任意路径、命令、非法枚举和越界周期', () => {
    expect(() => validateId('../file')).toThrow();
    expect(() => validateId('foo; calc.exe')).toThrow();
    expect(() => validateSettings({ ...defaultSettings, intervalMinutes: 0 })).toThrow();
    expect(() => validateSettings({ ...defaultSettings, dailyTime: '99:00' })).toThrow();
    expect(() => validateSettings({ ...defaultSettings, timezone: 'invalid-zone' })).toThrow();
    expect(() => validateSettings({ ...defaultSettings, theme: 'execute' })).toThrow();
    expect(validateSettings({ ...defaultSettings, command: 'malicious' })).not.toHaveProperty('command');
  });
});
