import { ChevronRight, FolderOpen, GitBranch, Link2 } from 'lucide-react';
import { Badge, Empty, ToolIcon } from '../components';
import { useDeck } from '../context';
export function Runtimes() {
  const { state, api, perform, inspect } = useDeck();
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>运行时</h1>
          <p>知道工具在哪里运行，比切换版本更重要。</p>
        </div>
        <span className="heading-note">
          <GitBranch size={15} />
          nvm · 只读识别
        </span>
      </div>
      <div className="info-band">
        <Link2 size={18} />
        <span>展示真实 Node 与 npm 路径。AI Deck 不切换全局 Node，也不修改 PATH。</span>
      </div>
      <section className="panel runtime-panel">
        <div className="section-heading">
          <h2>Node.js 环境</h2>
          <span className="count">{state.runtimes.length} 个版本</span>
        </div>
        {state.runtimes.map((runtime) => {
          const tools = state.installations.filter((i) => i.runtimeId === runtime.id);
          return (
            <article className="runtime-row" key={runtime.id}>
              <div className="runtime-main">
                <ToolIcon id="nodejs" />
                <div>
                  <h3>
                    Node.js <span className="version">{runtime.version}</span>
                    {runtime.active && <Badge tone="green">当前活动</Badge>}
                    {!runtime.healthy && <Badge tone="warning">待修复</Badge>}
                  </h3>
                  <span className="mono-path">{runtime.path}</span>
                </div>
                <span className="runtime-arch">{runtime.architecture}</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`打开 Node ${runtime.version} 目录`}
                  title="打开目录"
                  onClick={() => void perform(() => api.openDirectory(runtime.id))}
                >
                  <FolderOpen size={17} />
                </button>
              </div>
              <div className="runtime-binding">
                <span>
                  <Link2 size={14} />
                  关联工具
                </span>
                {tools.length ? (
                  tools.map((tool) => (
                    <button type="button" key={tool.id} onClick={() => inspect(tool.id)}>
                      {tool.name}
                      <ChevronRight size={12} />
                    </button>
                  ))
                ) : (
                  <span className="muted">暂无已识别的工具绑定</span>
                )}
              </div>
              <details className="runtime-details">
                <summary>查看 npm 入口</summary>
                <code>{runtime.npmPath}</code>
              </details>
            </article>
          );
        })}
        {!state.runtimes.length && (
          <Empty
            title="尚未识别 Node.js 环境"
            text="扫描会验证 nvm 目录和 PATH 中的真实 Node。仅存在目录不会被判定为健康运行时。"
          />
        )}
      </section>
    </>
  );
}
