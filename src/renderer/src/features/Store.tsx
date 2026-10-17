import { ArrowUpRight, Check, Command, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { catalog } from '../../../shared/catalog';
import { Badge, SearchInput, ToolIcon } from '../components';
import { useDeck } from '../context';
export function Store() {
  const { api, state, perform } = useDeck();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const tools = catalog.filter(
    (t) =>
      t.website &&
      (filter === 'all' || t.category === filter) &&
      `${t.name} ${t.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>发现好工具</h1>
          <p>少一点寻找，多一点可能。</p>
        </div>
        <span className="heading-note">
          <ShieldCheck size={15} />
          精选官方入口
        </span>
      </div>
      <section className="store-feature">
        <div>
          <span className="feature-symbol">
            <Command size={25} />
          </span>
          <h2>你的下一个编程搭档。</h2>
          <p>
            在熟悉的终端里，找到更顺手的工作方式。
            <br />从 Codex、Claude Code 和 Gemini 开始。
          </p>
          <button type="button" className="button primary" onClick={() => setFilter('cli')}>
            探索命令行工具
            <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="feature-tools" aria-hidden="true">
          <span className="feature-line" />
          <ToolIcon id="codex" large />
          <ToolIcon id="claude" large />
          <ToolIcon id="gemini" large />
          <span className="feature-caption">
            <Sparkles size={13} />
            各有所长，为你所用
          </span>
        </div>
      </section>
      <div className="toolbar">
        <div className="tabs">
          {[
            ['all', '全部精选'],
            ['cli', '命令行'],
            ['editor', '编辑器'],
            ['desktop', '桌面应用'],
            ['companion', '配套工具'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={filter === value ? 'active' : ''}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <SearchInput value={query} onChange={setQuery} placeholder="搜索工具…" />
      </div>
      <div className="catalog-grid">
        {tools.map((tool) => {
          const installed = state.installations.some((i) => i.toolId === tool.id && i.health === 'ready');
          return (
            <article className="catalog-item" key={tool.id}>
              <div className="catalog-top">
                <ToolIcon id={tool.id} large />
                {installed && (
                  <Badge tone="green">
                    <Check size={12} />
                    本机已发现
                  </Badge>
                )}
              </div>
              <h2>{tool.name}</h2>
              <p>{tool.description}</p>
              <div className="catalog-bottom">
                <span>
                  {tool.capability === 'npm'
                    ? 'npm 官方分发'
                    : tool.capability === 'official'
                      ? '官方渠道管理'
                      : '发现与引导'}
                </span>
                <button
                  type="button"
                  className="button small secondary"
                  onClick={() => void perform(() => api.openWebsite(tool.id))}
                >
                  前往官网
                  <ExternalLink size={13} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!tools.length && <p className="quiet-empty">没有匹配的工具，试试其他关键词。</p>}
      <p className="store-footnote">当前版本提供官方安装引导。自动安装与升级将在隔离环境验收通过后开放。</p>
    </>
  );
}
