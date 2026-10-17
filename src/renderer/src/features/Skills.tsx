import { Archive, ArrowUpRight, FolderOpen, Layers3, Link2, RotateCcw, Shield } from 'lucide-react';
import { useState } from 'react';
import { Badge, Empty, formatTime, SearchInput } from '../components';
import { useDeck } from '../context';
export function Skills() {
  const { state, api, busy, perform } = useDeck();
  const [query, setQuery] = useState('');
  const [host, setHost] = useState('全部宿主');
  const [restore, setRestore] = useState<string>();
  const skills = state.skills.filter(
    (s) =>
      (host === '全部宿主' || s.hosts.includes(host)) &&
      `${s.name} ${s.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>个人 Skills</h1>
          <p>属于你的能力库，井然有序地连接每个 AI。</p>
        </div>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={() => void perform(() => api.scan())}
        >
          <Layers3 size={17} />
          刷新技能
        </button>
      </div>
      <div className="info-band">
        <Shield size={19} />
        <span>共享目录只记录一次。来源与初始基线未核实时，保留本地内容。</span>
      </div>
      <div className="toolbar">
        <div className="tabs">
          {['全部宿主', 'Agents', 'Codex', 'Claude'].map((value) => (
            <button
              type="button"
              key={value}
              className={value === host ? 'active' : ''}
              onClick={() => setHost(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="搜索 Skills…" />
      </div>
      <div className="skill-list">
        {skills.map((skill) => (
          <article className="skill-item" key={skill.id}>
            <div className="skill-top">
              <span className="skill-glyph">
                <Layers3 size={22} strokeWidth={1.6} />
              </span>
              <div>
                <h2>{skill.name}</h2>
                <div className="skill-hosts">
                  {skill.hosts.join(' · ')}
                  {skill.shared && (
                    <span>
                      <Link2 size={12} />
                      共享目录
                    </span>
                  )}
                </div>
              </div>
              <Badge tone={skill.modified ? 'warning' : 'neutral'}>
                {skill.modified ? '存在本地修改' : skill.source ? '来源已记录' : '来源待确认'}
              </Badge>
            </div>
            <p className="skill-description" title={skill.description}>
              {skill.description}
            </p>
            <p className="skill-path" title={skill.realPath}>
              {skill.realPath}
            </p>
            <div className="skill-bottom">
              <span>{skill.backupAt ? `已备份 ${formatTime(skill.backupAt)}` : '尚未创建文件备份'}</span>
              <div>
                <button
                  type="button"
                  className="icon-button"
                  title="打开技能目录"
                  aria-label={`打开 ${skill.name} 目录`}
                  onClick={() => void perform(() => api.openDirectory(skill.id))}
                >
                  <FolderOpen size={16} />
                </button>
                <button
                  type="button"
                  className="button small secondary"
                  disabled={busy || skill.ownedByHost}
                  onClick={() =>
                    void perform(() => api.backupSkill(skill.id), '备份操作已完成，请查看任务结果')
                  }
                >
                  <Archive size={14} />
                  备份
                </button>
                {skill.backupAt && (
                  <button
                    type="button"
                    className="button small secondary"
                    disabled={busy}
                    onClick={() => setRestore(restore === skill.id ? undefined : skill.id)}
                  >
                    <RotateCcw size={14} />
                    恢复
                  </button>
                )}
              </div>
            </div>
            {restore === skill.id && (
              <div className="restore-confirm">
                <p>恢复最近备份。当前文件会保留在同级目录；扫描后有新修改时停止恢复。</p>
                <button
                  type="button"
                  className="button small primary"
                  disabled={busy}
                  onClick={() => {
                    setRestore(undefined);
                    void perform(() => api.restoreSkill(skill.id));
                  }}
                >
                  确认恢复
                </button>
                <button type="button" className="text-button" onClick={() => setRestore(undefined)}>
                  取消
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {!skills.length && (
        <Empty
          title="还没有发现个人 Skills"
          text="扫描会检查 .agents、.codex 和 .claude 下的个人技能目录。系统与插件附带技能由宿主管理。"
          action={
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => void perform(() => api.scan())}
            >
              扫描个人 Skills
              <ArrowUpRight size={15} />
            </button>
          }
        />
      )}
    </>
  );
}
