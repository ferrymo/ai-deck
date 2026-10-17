import { createHash } from 'node:crypto';
import { access, readdir, readFile, realpath, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type { Installation, Runtime, Skill } from '../../core/models';
import { catalog } from '../../shared/catalog';
import { run, safeError } from './process';

export const identity = (value: string) =>
  createHash('sha256').update(value.toLowerCase()).digest('hex').slice(0, 24);
export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
async function directories(path: string): Promise<string[]> {
  try {
    return (await readdir(path, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
      .map((entry) => join(path, entry.name));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}
export async function discoverRuntimes(warnings: string[]): Promise<Runtime[]> {
  const roots = new Set<string>();
  if (process.env.NVM_HOME)
    for (const path of await directories(process.env.NVM_HOME))
      if (/^v\d/.test(path.split(/[\\/]/).at(-1) ?? '')) roots.add(path);
  if (process.env.NVM_SYMLINK && (await exists(process.env.NVM_SYMLINK)))
    roots.add(await realpath(process.env.NVM_SYMLINK));
  for (const path of (process.env.PATH ?? '').split(';'))
    if (path && (await exists(join(path, 'node.exe')))) roots.add(await realpath(path));
  const active =
    process.env.NVM_SYMLINK && (await exists(process.env.NVM_SYMLINK))
      ? (await realpath(process.env.NVM_SYMLINK)).toLowerCase()
      : '';
  return Promise.all(
    [...roots].map(async (path) => {
      const npmPath = join(path, 'node_modules/npm/bin/npm-cli.js');
      try {
        const result = JSON.parse(
          await run(join(path, 'node.exe'), [
            '-p',
            'JSON.stringify({version:process.versions.node,arch:process.arch})',
          ]),
        ) as { version: string; arch: string };
        return {
          id: identity(path),
          version: result.version,
          path,
          npmPath,
          active: path.toLowerCase() === active,
          healthy: await exists(npmPath),
          architecture: result.arch,
        };
      } catch (error) {
        warnings.push(`运行时无法验证：${path}；${safeError(error)}`);
        return {
          id: identity(path),
          version: path.split(/[\\/]/).at(-1)?.replace(/^v/, '') ?? '未知',
          path,
          npmPath,
          active: false,
          healthy: false,
          architecture: '未知',
        };
      }
    }),
  );
}
function installation(
  toolId: string,
  path: string,
  physical: string,
  version: string | null,
  channel: string,
  health: Installation['health'],
): Installation {
  return {
    id: identity(`${toolId}:${physical}:${channel}`),
    toolId,
    name: catalog.find((t) => t.id === toolId)?.name ?? toolId,
    path,
    realPath: physical,
    version,
    versionSource: channel === 'npm' ? 'package.json' : channel,
    channel,
    health,
    managed: false,
    policy: 'global',
  };
}
export async function discoverTools(runtimes: Runtime[], warnings: string[]): Promise<Installation[]> {
  const found: Installation[] = [];
  const prefixes = new Map<string, Runtime | undefined>();
  for (const runtime of runtimes.filter((r) => r.healthy)) {
    prefixes.set(join(runtime.path, 'node_global'), runtime);
    prefixes.set(runtime.path, runtime);
    try {
      const prefix = await run(join(runtime.path, 'node.exe'), [runtime.npmPath, 'prefix', '-g']);
      if (await exists(prefix)) {
        const physical = await realpath(prefix);
        // A global npmrc may point every Node version at the active nvm junction.
        const owner =
          runtimes.find((r) => physical.toLowerCase().startsWith(`${r.path.toLowerCase()}\\`)) ??
          (runtime.active ? runtime : undefined);
        if (owner || !prefixes.has(physical)) prefixes.set(physical, owner);
      }
    } catch (error) {
      warnings.push(`npm 目录检查失败（Node ${runtime.version}）：${safeError(error)}`);
    }
  }
  prefixes.set(
    join(process.env.APPDATA ?? homedir(), 'npm'),
    runtimes.find((r) => r.active),
  );
  const packages = [
    ...catalog.filter((t) => t.packageName).map((t) => ({ id: t.id, name: t.packageName as string })),
    { id: 'claude', name: '@anthropic-ai/claude-code' },
  ];
  for (const [prefix, runtime] of prefixes) {
    for (const pkg of packages) {
      const packagePath = join(prefix, 'node_modules', pkg.name);
      if (!(await exists(join(packagePath, 'package.json')))) continue;
      try {
        const info = JSON.parse(await readFile(join(packagePath, 'package.json'), 'utf8')) as {
          version?: string;
          bin?: string | Record<string, string>;
        };
        const bin = typeof info.bin === 'string' ? info.bin : Object.values(info.bin ?? {})[0];
        const physical = await realpath(packagePath);
        const item = installation(
          pkg.id,
          packagePath,
          physical,
          info.version ?? null,
          'npm',
          bin && (await exists(resolve(packagePath, bin))) ? 'ready' : 'broken',
        );
        item.prefix = await realpath(prefix);
        item.runtimeId = runtime?.id;
        if (!found.some((i) => i.id === item.id)) found.push(item);
      } catch (error) {
        warnings.push(`无法读取 ${pkg.id} 安装：${safeError(error)}`);
      }
    }
  }
  const ps = join(process.env.SystemRoot ?? 'C:\\Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
  const script =
    "$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[System.Text.UTF8Encoding]::new(); $items=@(); foreach($root in @('HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*')){$items+=@(Get-ItemProperty $root -ErrorAction SilentlyContinue | Where-Object {$_.DisplayName -match 'Cursor|Windsurf|Trae|Qoder|ZCode|Antigravity|CC Switch|Ollama|Claude|Codex'} | Select-Object DisplayName,DisplayVersion,InstallLocation,DisplayIcon)}; ConvertTo-Json -InputObject @($items) -Compress";
  try {
    const entries = JSON.parse(
      await run(ps, ['-NoProfile', '-NonInteractive', '-Command', script], 30000),
    ) as { DisplayName?: string; DisplayVersion?: string; InstallLocation?: string; DisplayIcon?: string }[];
    for (const entry of entries) {
      const name = entry.DisplayName ?? '';
      const tool = [...catalog]
        .sort((a, b) => b.name.length - a.name.length)
        .find((t) => t.category !== 'cli' && name.toLowerCase().includes(t.name.toLowerCase()));
      const path = (entry.InstallLocation || entry.DisplayIcon)?.trim().replace(/^"|"(?:,\d+)?$|,\d+$/g, '');
      if (!tool || !path) continue;
      const present = await exists(path);
      found.push(
        installation(
          tool.id,
          path,
          present ? await realpath(path) : path,
          entry.DisplayVersion ?? null,
          '注册表',
          present ? 'ready' : 'unknown',
        ),
      );
    }
  } catch (error) {
    warnings.push(`注册表扫描失败：${safeError(error)}`);
  }
  try {
    const appxScript =
      "[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new(); ConvertTo-Json -InputObject @(Get-AppxPackage | Where-Object {$_.Name -match 'Claude|Codex'} | Select-Object Name,Version,InstallLocation) -Compress";
    const appx = JSON.parse(
      await run(ps, ['-NoProfile', '-NonInteractive', '-Command', appxScript], 30000),
    ) as { Name: string; Version: string; InstallLocation: string }[];
    for (const item of appx)
      found.push(
        installation(
          /claude/i.test(item.Name) ? 'claude-desktop' : 'codex-desktop',
          item.InstallLocation,
          item.InstallLocation,
          item.Version,
          'Microsoft Store',
          'ready',
        ),
      );
  } catch (error) {
    warnings.push(`Store 应用扫描失败：${safeError(error)}`);
  }
  const nativeClaude = join(homedir(), '.local/bin/claude.exe');
  if (await exists(nativeClaude)) {
    try {
      found.push(
        installation(
          'claude',
          nativeClaude,
          await realpath(nativeClaude),
          (await run(nativeClaude, ['--version'])).split(' ')[0] ?? null,
          '官方原生',
          'ready',
        ),
      );
    } catch (error) {
      warnings.push(`Claude 原生入口无法验证：${safeError(error)}`);
    }
  }
  for (const toolId of ['gemini', 'claude', 'codex']) {
    const shim = join(process.env.LOCALAPPDATA ?? '', 'pnpm', `${toolId}.cmd`);
    if (!(await exists(shim))) continue;
    const text = await readFile(shim, 'utf8');
    const targets = [...text.matchAll(/"([^"\r\n]*\.(?:js|cjs|mjs|exe))"/gi)]
      .map((match) => (match[1] ?? '').replace(/%~dp0|%dp0%/gi, `${dirname(shim)}\\`))
      .filter((path) => !path.includes('%') && !/node\.exe$/i.test(path));
    const healthy = targets.length > 0 && (await Promise.all(targets.map(exists))).some(Boolean);
    found.push(
      installation(toolId, shim, await realpath(shim), null, 'pnpm 入口', healthy ? 'unknown' : 'broken'),
    );
  }
  for (const toolId of ['opencode', 'ollama']) {
    const config = join(homedir(), toolId === 'opencode' ? '.config/opencode' : '.ollama');
    if ((await exists(config)) && !found.some((i) => i.toolId === toolId && i.health === 'ready'))
      found.push(installation(toolId, config, await realpath(config), null, '配置目录', 'config-only'));
  }
  return [...new Map(found.map((i) => [i.id, i])).values()];
}
export async function fingerprint(root: string): Promise<string> {
  const hash = createHash('sha256');
  let count = 0;
  let bytes = 0;
  async function walk(path: string, relative: string): Promise<void> {
    const entries = (await readdir(path, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    for (const entry of entries) {
      if (++count > 10000) throw new Error('Skill 文件数超过安全扫描上限');
      const child = join(path, entry.name);
      const key = `${relative}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`Skill 内存在嵌套链接，需人工检查：${key}`);
      hash.update(key);
      hash.update(entry.isDirectory() ? 'directory' : 'file');
      if (entry.isDirectory()) await walk(child, key);
      else if (entry.isFile()) {
        bytes += (await stat(child)).size;
        if (bytes > 32 * 1024 * 1024) throw new Error('Skill 大小超过 32 MB 扫描上限');
        hash.update(await readFile(child));
      }
    }
  }
  await walk(root, '');
  return hash.digest('hex');
}
export async function discoverSkills(warnings: string[]): Promise<Skill[]> {
  const found = new Map<string, Skill>();
  for (const [host, root] of [
    ['Agents', '.agents/skills'],
    ['Codex', '.codex/skills'],
    ['Claude', '.claude/skills'],
  ] as const) {
    for (const path of await directories(join(homedir(), root))) {
      if (path.split(/[\\/]/).at(-1)?.startsWith('.') || /\.aideck-(?:before-restore|staging)-/.test(path))
        continue;
      if (!(await exists(join(path, 'SKILL.md')))) continue;
      try {
        const physical = await realpath(path);
        const id = identity(physical);
        const existing = found.get(id);
        if (existing) {
          existing.hosts.push(host);
          existing.shared = true;
          continue;
        }
        const content = (await readFile(join(path, 'SKILL.md'), 'utf8')).slice(0, 32000);
        const name =
          content
            .match(/^name:\s*(.+)$/m)?.[1]
            ?.trim()
            .replace(/^['"]|['"]$/g, '') ??
          path.split(/[\\/]/).at(-1) ??
          'Skill';
        const description =
          content
            .match(/^description:\s*(.+)$/m)?.[1]
            ?.trim()
            .replace(/^['"]|['"]$/g, '') ?? '个人技能，来源待确认。';
        found.set(id, {
          id,
          name,
          description,
          hosts: [host],
          path,
          realPath: physical,
          fingerprint: await fingerprint(physical),
          modified: false,
          shared: path.toLowerCase() !== physical.toLowerCase(),
          ownedByHost: false,
        });
      } catch (error) {
        warnings.push(`Skill 扫描跳过 ${path}：${safeError(error)}`);
      }
    }
  }
  return [...found.values()];
}
