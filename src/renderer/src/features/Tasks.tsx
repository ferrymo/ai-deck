import { Check, CircleAlert, Clock3, RotateCw } from 'lucide-react';
import { useState } from 'react';
import { Badge, Empty, formatTime } from '../components';
import { useDeck } from '../context';

const statuses = { success: '已完成', failed: '失败', running: '进行中', interrupted: '已中断' };
export function Tasks() {
  const { state, api, perform, busy } = useDeck();
  const [filter, setFilter] = useState('all');
  const jobs = state.jobs.filter(
    (j) =>
      filter === 'all' ||
      (filter === 'attention' ? ['failed', 'interrupted'].includes(j.status) : j.status === filter),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>任务记录</h1>
          <p>每一次检查、每一次变更，都有迹可循。</p>
        </div>
        <span className="heading-note">
          <Clock3 size={15} />
          保留最近 150 条
        </span>
      </div>
      <div className="toolbar">
        <div className="tabs">
          {[
            ['all', '全部任务'],
            ['running', '进行中'],
            ['success', '已完成'],
            ['attention', '需要处理'],
          ].map(([value, label]) => (
            <button
              type="button"
              className={filter === value ? 'active' : ''}
              key={value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <section className="panel task-panel">
        {jobs.map((job) => (
          <details className="task-row" key={job.id}>
            <summary>
              <span className={`activity-symbol ${job.status}`}>
                {job.status === 'success' ? (
                  <Check size={17} />
                ) : job.status === 'running' ? (
                  <Clock3 size={17} />
                ) : (
                  <CircleAlert size={17} />
                )}
              </span>
              <span className="task-name">
                <strong>{job.title}</strong>
                <span>{formatTime(job.startedAt)}</span>
              </span>
              <Badge
                tone={job.status === 'success' ? 'green' : job.status === 'running' ? 'blue' : 'warning'}
              >
                {statuses[job.status]}
              </Badge>
            </summary>
            <div className="task-detail">
              <p>{job.detail}</p>
              <dl>
                <dt>任务 ID</dt>
                <dd>{job.id}</dd>
                <dt>完成时间</dt>
                <dd>{job.finishedAt ? formatTime(job.finishedAt) : '正在运行'}</dd>
              </dl>
              {['failed', 'interrupted'].includes(job.status) && ['scan', 'check'].includes(job.kind) && (
                <button
                  type="button"
                  className="button small secondary"
                  disabled={busy}
                  onClick={() => void perform(() => (job.kind === 'scan' ? api.scan() : api.checkUpdates()))}
                >
                  <RotateCw size={14} />
                  重试此任务
                </button>
              )}
            </div>
          </details>
        ))}
        {!jobs.length && (
          <Empty title="这里很安静" text="扫描、检查更新和备份 Skills 后，可以在这里查看进度与真实结果。" />
        )}
      </section>
    </>
  );
}
