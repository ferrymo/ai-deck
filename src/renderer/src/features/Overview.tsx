import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Layers3,
  Monitor,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import { isNewer } from '../../../core/policy';
import { Badge, Empty, formatTime, HealthBadge, ToolIcon } from '../components';
import { useDeck } from '../context';

export function Overview() {
  const { state, api, busy, perform, navigate, inspect } = useDeck();
  const ready = state.installations.filter((i) => i.health === 'ready');
  const attention = state.installations.filter((i) => i.health !== 'ready' || i.checkError);
  const updates = state.installations.filter(
    (i) => !i.checkError && i.latestVersion && i.version && isNewer(i.latestVersion, i.version),
  );
  const managed = state.installations.filter((i) => i.managed);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>飞行甲板已就绪，您负责飞我负责稳~</h1>
          <p>把工具交给 AI Deck，把注意力留给创造。</p>
        </div>
        <button
          type="button"
          className="button primary"
          disabled={busy}
          onClick={() => void perform(() => api.scan(), '本机扫描已完成')}
        >
          <ScanLine size={17} />
          {busy ? '正在处理…' : '发现本机工具'}
        </button>
      </div>
      <section className="environment-strip" aria-label="环境状态">
        <span className="environment-symbol">
          <Monitor size={24} />
        </span>
        <div className="environment-copy">
          <strong>{state.lastScan ? '你的 AI 工作环境' : '欢迎来到你的 AI 工作台'}</strong>
          <span>
            {state.lastScan
              ? `最近扫描 ${formatTime(state.lastScan)}`
              : '从一次只读扫描开始，认识这台电脑上的工具。'}
          </span>
        </div>
        <div className="environment-stats">
          <div>
            <strong>
              {ready.length}
              <span>个</span>
            </strong>
            <span>已就绪工具</span>
          </div>
          <div>
            <strong>
              {managed.length}
              <span>个</span>
            </strong>
            <span>已加入管理</span>
          </div>
          <div>
            <strong>
              {state.skills.length}
              <span>个</span>
            </strong>
            <span>个人 Skills</span>
          </div>
        </div>
      </section>
      <div className="overview-grid">
        <div className="overview-main">
          <section className="panel tool-panel">
            <div className="section-heading">
              <h2>
                我的工具 <span className="count">{state.installations.length}</span>
              </h2>
              <button type="button" className="text-button" onClick={() => navigate('tools')}>
                查看全部
                <ArrowRight size={15} />
              </button>
            </div>
            {!state.installations.length ? (
              <Empty
                title="让熟悉的工具，在这里相聚"
                text="扫描已知安装目录、系统应用与命令入口。工具和登录配置会保留在原处。"
                action={
                  <button
                    type="button"
                    className="button secondary"
                    disabled={busy}
                    onClick={() => void perform(() => api.scan())}
                  >
                    <ScanLine size={16} />
                    开始发现
                  </button>
                }
              />
            ) : (
              <div className="tool-ledger">
                {state.installations.slice(0, 6).map((item) => (
                  <button type="button" className="ledger-row" key={item.id} onClick={() => inspect(item.id)}>
                    <ToolIcon id={item.toolId} />
                    <span className="tool-name">
                      <strong>{item.name}</strong>
                      <span>
                        {item.channel}
                        {item.managed ? ' · 已接管' : ''}
                      </span>
                    </span>
                    <span className="version">{item.version ? `v${item.version}` : '版本未知'}</span>
                    <HealthBadge item={item} />
                    <ChevronRight size={15} className="row-chevron" />
                  </button>
                ))}
              </div>
            )}
            <div className="panel-footer">
              <ShieldCheck size={14} />
              <span>独立识别每个安装实例，保留原来的目录与渠道。</span>
            </div>
          </section>
          <section className="activity-section">
            <div className="section-heading">
              <h2>最近动态</h2>
              <button type="button" className="text-button" onClick={() => navigate('tasks')}>
                任务记录
                <ArrowRight size={15} />
              </button>
            </div>
            {state.jobs.length ? (
              state.jobs.slice(0, 3).map((job) => (
                <button type="button" key={job.id} className="activity-row" onClick={() => navigate('tasks')}>
                  <span className={`activity-symbol ${job.status}`}>
                    {job.status === 'success' ? <Check size={15} /> : <Clock3 size={15} />}
                  </span>
                  <span>
                    <strong>{job.title}</strong>
                    <span>
                      {job.status === 'success'
                        ? '已完成'
                        : job.status === 'running'
                          ? '正在处理'
                          : '需要处理'}{' '}
                      · {formatTime(job.startedAt)}
                    </span>
                  </span>
                  <ChevronRight size={15} />
                </button>
              ))
            ) : (
              <div className="quiet-empty">
                <Clock3 size={18} />
                <span>第一次扫描完成后，动态会显示在这里。</span>
              </div>
            )}
          </section>
        </div>
        <aside className="overview-rail">
          <section className="updates-panel">
            <div className="section-heading">
              <h2>
                <ArrowDownToLine size={17} />
                工具更新
              </h2>
              {updates.length > 0 && <Badge tone="blue">{updates.length}</Badge>}
            </div>
            <div className="updates-message">
              <span className="update-symbol">
                <ArrowDownToLine size={25} strokeWidth={1.5} />
              </span>
              <h3>{updates.length ? `${updates.length} 个实例有新版本` : '让好用的工具，保持新鲜。'}</h3>
              <p>
                {updates.length
                  ? '查看版本与来源，通过已验证的官方渠道更新。'
                  : '检查官方来源，了解你的工具是否有新版本。'}
              </p>
            </div>
            <button
              type="button"
              className="button secondary full"
              disabled={busy}
              onClick={() => void perform(() => api.checkUpdates(), '更新检查已完成')}
            >
              检查工具更新
            </button>
            <div className="quiet-caption">
              <span className="status-dot neutral" />
              自动安装未开启
            </div>
          </section>
          <section className="attention-section">
            <div className="section-heading">
              <h2>需要留意</h2>
              <span className="count">{attention.length + state.warnings.length}</span>
            </div>
            {attention.slice(0, 3).map((item) => (
              <button type="button" key={item.id} className="attention-item" onClick={() => inspect(item.id)}>
                <CircleAlert size={17} />
                <span>
                  <strong>
                    {item.name}
                    {item.health === 'broken' ? ' 入口失效' : item.checkError ? ' 检查失败' : ' 待确认'}
                  </strong>
                  <span>
                    {item.health === 'broken'
                      ? '原入口的目标文件不存在，请通过官方渠道修复。'
                      : item.checkError
                        ? '保留了上次结果，稍后可重新检查。'
                        : '需要进一步验证安装状态。'}
                  </span>
                </span>
                <ChevronRight size={14} />
              </button>
            ))}
            {state.warnings.slice(0, 2).map((warning) => (
              <details className="warning-detail" key={warning}>
                <summary>扫描提示</summary>
                <p>{warning}</p>
              </details>
            ))}
            {!attention.length && !state.warnings.length && (
              <p className="rail-empty">
                <Check size={16} />
                当前没有需要处理的问题
              </p>
            )}
          </section>
          <button type="button" className="skills-shortcut" onClick={() => navigate('skills')}>
            <Layers3 size={22} />
            <span>
              <strong>让你的 AI 更懂你</strong>
              <span>整理个人 Skills 与共享目录</span>
            </span>
            <ArrowRight size={16} />
          </button>
        </aside>
      </div>
    </>
  );
}
