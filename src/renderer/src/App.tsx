import {
  ArrowDownToLine,
  ArrowUpRight,
  Bell,
  Box,
  Check,
  ChevronRight,
  CircleAlert,
  Command,
  ExternalLink,
  FolderOpen,
  Layers3,
  LayoutDashboard,
  ListTodo,
  LoaderCircle,
  Minus,
  Monitor,
  PanelLeftClose,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Square,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { emptySnapshot, type Page, type SelfUpdate, type Snapshot } from '../../core/models';
import { definition } from '../../shared/catalog';
import { Badge, formatTime, HealthBadge, ToolIcon } from './components';
import { AppContext } from './context';
import { Overview } from './features/Overview';
import { Runtimes } from './features/Runtimes';
import { Settings } from './features/Settings';
import { Skills } from './features/Skills';
import { Store } from './features/Store';
import { Tasks } from './features/Tasks';
import { Tools } from './features/Tools';
import { previewAPI } from './preview';

const api = window.deck ?? previewAPI;
const preview = !window.deck;
const navigation = [
  { id: 'overview', name: '总览', icon: LayoutDashboard },
  { id: 'tools', name: '我的工具', icon: Box },
  { id: 'skills', name: '个人 Skills', icon: Layers3 },
  { id: 'store', name: '探索商店', icon: ShoppingBag },
  { id: 'runtimes', name: '运行时', icon: Monitor },
  { id: 'tasks', name: '任务记录', icon: ListTodo },
] as const;
const pageNames: Record<Page, string> = {
  overview: '总览',
  tools: '我的工具',
  skills: '个人 Skills',
  store: '探索商店',
  runtimes: '运行时',
  tasks: '任务记录',
  settings: '偏好设置',
};

export function App() {
  const [state, setState] = useState<Snapshot>(emptySnapshot);
  const [page, setPage] = useState<Page>('overview');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; error: boolean }>();
  const [selected, setSelected] = useState<string>();
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [self, setSelf] = useState<SelfUpdate>({
    status: 'unavailable',
    currentVersion: '0.1.0',
    notes: [],
    message: '正在读取客户端状态',
  });
  const [updateOpen, setUpdateOpen] = useState(false);
  const [startupError, setStartupError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const inspector = useRef<HTMLDialogElement>(null);
  const notify = useCallback((message: string) => setToast({ message, error: false }), []);
  const perform = useCallback(async (work: () => Promise<Snapshot> | Promise<void>, success?: string) => {
    const startedAt = Date.now();
    setBusy(true);
    try {
      const result = await work();
      if (result) {
        setState(result);
        if (result.jobs[0]?.status === 'failed' && Date.parse(result.jobs[0].startedAt) >= startedAt) {
          setToast({ message: result.jobs[0].detail, error: true });
          return;
        }
      }
      if (success) setToast({ message: success, error: false });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : '操作失败，请重试', error: true });
    } finally {
      setBusy(false);
    }
  }, []);
  const load = useCallback(async () => {
    try {
      const [snapshot, update] = await Promise.all([api.snapshot(), api.selfUpdate()]);
      setState(snapshot);
      setSelf(update);
      setPage(snapshot.settings.page);
      setStartupError('');
    } catch (error) {
      setStartupError(error instanceof Error ? error.message : '无法读取本机状态');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    return api.onChanged(() => {
      void Promise.all([api.snapshot(), api.selfUpdate()])
        .then(([snapshot, update]) => {
          setState(snapshot);
          setSelf(update);
        })
        .catch((error) => setToast({ message: String(error), error: true }));
    });
  }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(undefined), toast.error ? 9000 : 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => {
      document.documentElement.dataset.theme =
        state.settings.theme === 'system' ? (media.matches ? 'dark' : 'light') : state.settings.theme;
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [state.settings.theme]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearch(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (search) dialog.current?.showModal();
    else dialog.current?.close();
  }, [search]);
  useEffect(() => {
    if (selected) inspector.current?.showModal();
    else inspector.current?.close();
  }, [selected]);
  const navigate = (next: Page) => {
    setPage(next);
    setSearch(false);
    setQuery('');
    const settings = { ...state.settings, page: next };
    setState((current) => ({ ...current, settings }));
    void api.saveSettings(settings).catch((error) => setToast({ message: String(error), error: true }));
  };
  const inspect = (id: string) => {
    setSelected(id);
    setSearch(false);
  };
  const item = state.installations.find((i) => i.id === selected);
  const runtime = state.runtimes.find((r) => r.id === item?.runtimeId);
  const tool = item ? definition(item.toolId) : undefined;
  const attention = state.installations.filter((i) => i.health !== 'ready' || i.checkError).length;
  const running = busy || state.jobs.some((j) => j.status === 'running');
  const content = {
    overview: <Overview />,
    tools: <Tools />,
    skills: <Skills />,
    store: <Store />,
    runtimes: <Runtimes />,
    tasks: <Tasks />,
    settings: <Settings />,
  }[page];
  const updateAction = async (install = false) => {
    try {
      setSelf(install ? await api.installSelfUpdate() : await api.checkSelfUpdate());
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : '客户端更新失败', error: true });
    }
  };
  return (
    <AppContext.Provider value={{ state, api, busy: running, preview, navigate, perform, notify, inspect }}>
      <div className={`app-shell ${collapsed ? 'nav-collapsed' : ''}`}>
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-mark">
              <Layers3 size={24} strokeWidth={1.8} />
            </span>
            <span>
              AI Deck<span className="brand-dot">.</span>
            </span>
          </div>
          <button type="button" className="global-search" onClick={() => setSearch(true)}>
            <Search size={16} />
            <span>快速查找</span>
            <kbd>Ctrl K</kbd>
          </button>
          <nav aria-label="主导航">
            {navigation.map(({ id, name, icon: Icon }, index) => (
              <button
                type="button"
                key={id}
                className={`nav-item ${page === id ? 'active' : ''} ${index === 3 ? 'nav-divider' : ''}`}
                aria-current={page === id ? 'page' : undefined}
                title={name}
                onClick={() => navigate(id)}
              >
                <Icon size={19} strokeWidth={1.7} />
                <span>{name}</span>
                {id === 'tools' && state.installations.length > 0 && (
                  <span className="nav-count">{state.installations.length}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="local-status">
              <span className="status-dot" />
              <div>
                <strong>{preview ? '界面预览' : '本机工作空间'}</strong>
                <span>{preview ? '示例数据 · 未连接本机' : '数据仅保存在这台电脑'}</span>
              </div>
              <ShieldCheck size={16} />
            </div>
            <button
              type="button"
              className={`nav-item ${page === 'settings' ? 'active' : ''}`}
              title="偏好设置"
              onClick={() => navigate('settings')}
            >
              <Settings2 size={19} strokeWidth={1.7} />
              <span>偏好设置</span>
            </button>
            <div className="sidebar-version">
              <span>
                AI Deck <span>v{self.currentVersion}</span>
              </span>
              <button
                type="button"
                className="icon-button"
                title="收起侧栏"
                aria-label="收起侧栏"
                onClick={() => setCollapsed(!collapsed)}
              >
                <PanelLeftClose size={15} />
              </button>
            </div>
          </div>
        </aside>
        <div className="workspace">
          <header className="titlebar">
            <div className="breadcrumb">
              <span>工作空间</span>
              <ChevronRight size={13} />
              <strong>{pageNames[page]}</strong>
            </div>
            <div className="titlebar-actions">
              {preview && <span className="preview-label">预览 · 示例数据</span>}
              <fieldset
                className="update-control"
                aria-label="客户端更新操作"
                onMouseEnter={() => setUpdateOpen(true)}
                onMouseLeave={() => setUpdateOpen(false)}
                onFocus={() => setUpdateOpen(true)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setUpdateOpen(false);
                }}
              >
                <button
                  type="button"
                  className={`icon-button ${self.status === 'ready' ? 'update-ready' : ''}`}
                  aria-label="客户端更新"
                  aria-expanded={updateOpen}
                  onClick={() => {
                    setUpdateOpen(true);
                    if (self.status === 'ready') void updateAction(true);
                  }}
                >
                  <ArrowDownToLine size={17} />
                </button>
                {updateOpen && (
                  <div className="update-popover">
                    <div>
                      <strong>AI Deck {self.version ? `v${self.version}` : `v${self.currentVersion}`}</strong>
                      <Badge>{self.status === 'ready' ? '可以安装' : '客户端更新'}</Badge>
                    </div>
                    <p>{self.message}</p>
                    {self.status === 'downloading' && <progress max={100} value={self.progress ?? 0} />}
                    <div className="release-notes">
                      {self.notes.map((note) => (
                        <section key={note.version}>
                          <h4>{note.version}</h4>
                          <p>{note.note}</p>
                        </section>
                      ))}
                    </div>
                    {self.status === 'ready' ? (
                      <button
                        type="button"
                        className="button primary full"
                        onClick={() => void updateAction(true)}
                      >
                        安装并重启
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="button secondary full"
                        disabled={[
                          'unavailable',
                          'checking',
                          'downloading',
                          'waiting',
                          'installing',
                        ].includes(self.status)}
                        onClick={() => void updateAction()}
                      >
                        检查客户端更新
                      </button>
                    )}
                  </div>
                )}
              </fieldset>
              <button
                type="button"
                className="icon-button notification-button"
                title="查看需要处理的任务"
                aria-label="查看需要处理的任务"
                onClick={() => navigate('tasks')}
              >
                <Bell size={17} />
                {attention > 0 && <span />}
              </button>
              {!preview && (
                <div className="window-controls">
                  <button type="button" aria-label="最小化" onClick={() => void api.windowAction('minimize')}>
                    <Minus size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="最大化或还原"
                    onClick={() => void api.windowAction('maximize')}
                  >
                    <Square size={11} />
                  </button>
                  <button
                    type="button"
                    aria-label="关闭到托盘"
                    className="window-close"
                    onClick={() => void api.windowAction('close')}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </header>
          <main id="main" className="main-content">
            {loading ? (
              <div className="loading-state">
                <div />
                <div />
                <div />
                <span>正在读取本机工作空间…</span>
              </div>
            ) : startupError ? (
              <div className="startup-error">
                <CircleAlert size={30} />
                <h1>暂时无法读取工作空间</h1>
                <p>{startupError}</p>
                <button
                  type="button"
                  className="button primary"
                  onClick={() => {
                    setLoading(true);
                    void load();
                  }}
                >
                  重新连接
                </button>
              </div>
            ) : (
              content
            )}
          </main>
          <footer className="statusbar">
            <span>
              {running ? <LoaderCircle size={12} className="spin" /> : <span className="status-dot" />}
              {running ? '后台任务进行中' : preview ? '示例工作空间' : '本机连接正常'}
            </span>
            <span>
              {preview ? '界面预览不执行本机操作' : '关闭窗口后，AI Deck 会留在托盘'}
              <span className="statusbar-separator" />
              Windows · x64
            </span>
          </footer>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="command-dialog"
        onCancel={() => setSearch(false)}
        onClose={() => setSearch(false)}
      >
        <div className="command-input">
          <Search size={20} />
          <input
            aria-label="搜索页面或工具"
            placeholder="搜索页面、工具或安装目录…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="button"
            className="icon-button"
            aria-label="关闭搜索"
            onClick={() => setSearch(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="command-results">
          {Object.entries(pageNames)
            .filter(([, name]) => name.includes(query))
            .map(([id, name]) => (
              <button type="button" key={id} onClick={() => navigate(id as Page)}>
                <Command size={17} />
                <span>{name}</span>
                <ChevronRight size={15} />
              </button>
            ))}
          {state.installations
            .filter((i) => `${i.name} ${i.path}`.toLowerCase().includes(query.toLowerCase()))
            .map((i) => (
              <button type="button" key={i.id} onClick={() => inspect(i.id)}>
                <ToolIcon id={i.toolId} />
                <span>
                  {i.name}
                  <small>{i.channel}</small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
          {query &&
            !Object.values(pageNames).some((name) => name.includes(query)) &&
            !state.installations.some((i) =>
              `${i.name} ${i.path}`.toLowerCase().includes(query.toLowerCase()),
            ) && <p className="command-empty">没有找到匹配的页面或工具。</p>}
        </div>
        <footer>
          <span>快速跳转到你的工具与工作区</span>
          <kbd>Esc 关闭</kbd>
        </footer>
      </dialog>
      <dialog
        ref={inspector}
        className="inspector"
        onCancel={() => setSelected(undefined)}
        onClose={() => setSelected(undefined)}
      >
        {item && (
          <>
            <header>
              <span>安装实例</span>
              <button
                type="button"
                className="icon-button"
                aria-label="关闭实例详情"
                onClick={() => setSelected(undefined)}
              >
                <X size={20} />
              </button>
            </header>
            <div className="inspector-body">
              <ToolIcon id={item.toolId} large />
              <h2>{item.name}</h2>
              <div className="inspector-badges">
                <HealthBadge item={item} />
                <Badge>{item.channel}</Badge>
              </div>
              <p className="inspector-description">{tool?.description}</p>
              {item.health !== 'ready' && (
                <div className="inline-warning">
                  <CircleAlert size={18} />
                  <p>
                    {item.health === 'broken'
                      ? '入口仍然存在，但目标文件已失效。请通过官方渠道修复；当前实例不会被当作可用工具。'
                      : '尚未验证为可用安装。配置与原始版本证据已保留。'}
                  </p>
                </div>
              )}
              <section>
                <h3>版本与来源</h3>
                <dl className="inspector-facts">
                  <dt>当前版本</dt>
                  <dd>{item.version ?? '未知'}</dd>
                  <dt>版本证据</dt>
                  <dd>{item.versionSource}</dd>
                  <dt>官方最新版本</dt>
                  <dd>{item.checkError ? '检查失败' : (item.latestVersion ?? '尚未检查')}</dd>
                  <dt>上次成功检查</dt>
                  <dd>{formatTime(item.checkedAt)}</dd>
                </dl>
                {item.checkError && <p className="inline-error">{item.checkError}</p>}
              </section>
              <section>
                <h3>安装位置</h3>
                <div className="path-field">
                  <code>{item.realPath}</code>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="打开安装目录"
                    onClick={() => void perform(() => api.openDirectory(item.id))}
                  >
                    <FolderOpen size={17} />
                  </button>
                </div>
                {item.realPath !== item.path && <p className="muted small-text">逻辑入口：{item.path}</p>}
                <dl className="inspector-facts">
                  <dt>运行时</dt>
                  <dd>
                    {runtime
                      ? `Node.js ${runtime.version}`
                      : item.channel === 'npm'
                        ? '尚未确认绑定'
                        : '由原渠道管理'}
                  </dd>
                  {item.prefix && (
                    <>
                      <dt>真实 prefix</dt>
                      <dd className="mono-path">{item.prefix}</dd>
                    </>
                  )}
                </dl>
              </section>
              <section>
                <h3>管理方式</h3>
                <div className="management-note">
                  <ShieldCheck size={18} />
                  <p>
                    当前支持发现、版本检查与官方引导。自动安装尚未开放；接管会记住此实例，不改变现有安装。
                  </p>
                </div>
                <label className="policy-label" htmlFor="instance-policy">
                  提醒策略
                </label>
                <select
                  id="instance-policy"
                  value={item.policy}
                  disabled={running || !item.managed}
                  onChange={(e) =>
                    void perform(() => api.setPolicy(item.id, e.target.value as typeof item.policy))
                  }
                >
                  <option value="global">跟随全局</option>
                  <option value="notify">仅提醒</option>
                  <option value="pinned">固定当前版本（AI Deck）</option>
                  <option value="auto" disabled>
                    自动升级 · 尚未开放
                  </option>
                </select>
                <p className="small-text muted">这里的策略不能约束 Microsoft Store 或工具自身的自动更新。</p>
              </section>
            </div>
            <footer>
              <button
                type="button"
                className="button secondary"
                disabled={running || item.health !== 'ready'}
                onClick={() =>
                  void perform(
                    () => api.manage(item.id, !item.managed),
                    item.managed ? '已取消接管，软件与配置保持不变' : '已记住此安装实例',
                  )
                }
              >
                <Check size={16} />
                {item.managed ? '取消接管' : '加入管理'}
              </button>
              <button
                type="button"
                className="button primary"
                disabled={!tool?.website}
                onClick={() => void perform(() => api.openWebsite(item.toolId))}
              >
                {tool?.website ? '官方入口' : '来源待核实'}
                <ExternalLink size={15} />
              </button>
            </footer>
          </>
        )}
      </dialog>
      {toast && (
        <div className={`toast ${toast.error ? 'error' : ''}`} role={toast.error ? 'alert' : 'status'}>
          {toast.error ? <CircleAlert size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
          <button type="button" aria-label="关闭提示" onClick={() => setToast(undefined)}>
            <X size={15} />
          </button>
        </div>
      )}
      {preview && (
        <a
          className="preview-source"
          href="https://github.com/ferrymo/ai-deck"
          target="_blank"
          rel="noreferrer"
          aria-label="打开项目源代码"
        >
          源代码
          <ArrowUpRight size={12} />
        </a>
      )}
    </AppContext.Provider>
  );
}
