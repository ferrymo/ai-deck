import type { Installation, Settings } from './models';

export function inInstallWindow(settings: Settings, time: string): boolean {
  const { windowStart: start, windowEnd: end } = settings;
  return start === end || (start < end ? time >= start && time < end : time >= start || time < end);
}
export function canAutoInstall(settings: Settings, instance: Installation, time: string): boolean {
  return (
    settings.autoUpdate &&
    instance.managed &&
    instance.health === 'ready' &&
    (instance.policy === 'global' || instance.policy === 'auto') &&
    inInstallWindow(settings, time)
  );
}
export function isNewer(candidate: string, installed: string): boolean {
  const pattern = /^v?(\d+)\.(\d+)\.(\d+)$/;
  const a = candidate.match(pattern);
  const b = installed.match(pattern);
  if (!a || !b) return false;
  for (let i = 1; i <= 3; i++) {
    if (Number(a[i]) !== Number(b[i])) return Number(a[i]) > Number(b[i]);
  }
  return false;
}
