import { ArrowUpRight, ChevronRight, ScanLine } from 'lucide-react';
import { useState } from 'react';
import { definition } from '../../../shared/catalog';
import { Badge, Empty, HealthBadge, SearchInput, ToolIcon } from '../components';
import { useDeck } from '../context';

const filters = [
  ['all', '全部工具'],
  ['cli', '命令行'],
  ['desktop', '桌面应用'],
  ['editor', '编辑器'],
  ['companion', '配套工具'],
  ['attention', '需要处理'],
] as const;
export function Tools() {
  const { state, api, busy, perform, inspect, navigate } = useDeck();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const items = state.installations.filter(
    (i) =>
      (filter === 'all' ||
        (filter === 'attention'
          ? i.health !== 'ready' || !!i.checkError
          : definition(i.toolId)?.category === filter)) &&
      `${i.name} ${i.path} ${i.version ?? ''}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>我的工具</h1>
          <p>每一个安装实例，都有自己的位置。</p>
        </div>
        <button
          type="button"
          className="button primary"
          disabled={busy}
          onClick={() => void perform(() => api.scan(), '扫描已完成')}
        >
          <ScanLine size={17} />
          重新扫描
        </button>
      </div>
      <div className="toolbar">
        <fieldset className="tabs" aria-label="工具分类">
          {filters.map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={filter === value ? 'active' : ''}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </fieldset>
        <SearchInput value={query} onChange={setQuery} />
      </div>
      <section className="panel table-panel">
        <div className="table-header">
          <span>工具 / 安装实例</span>
          <span>当前版本</span>
          <span>来源</span>
          <span>状态</span>
          <span />
        </div>
        {items.map((item) => (
          <button type="button" className="tool-table-row" key={item.id} onClick={() => inspect(item.id)}>
            <span className="tool-cell">
              <ToolIcon id={item.toolId} />
              <span className="tool-name">
                <strong>
                  {item.name}
                  {item.managed && <span className="managed-dot" title="已接管" />}
                </strong>
                <span title={item.realPath}>{item.realPath}</span>
              </span>
            </span>
            <span className="version">{item.version ?? '未知'}</span>
            <span>
              <Badge>{item.channel}</Badge>
            </span>
            <HealthBadge item={item} />
            <ChevronRight size={16} />
          </button>
        ))}
        {!items.length && (
          <Empty
            title={query ? '没有找到匹配的工具' : '这里还没有工具'}
            text={
              query
                ? '试试名称、版本或目录中的其他关键词。'
                : '扫描本机发现已有安装，或去商店找到你的下一个工具。'
            }
            action={
              <button
                type="button"
                className="button secondary"
                onClick={() => (query ? setQuery('') : navigate('store'))}
              >
                {query ? '清空搜索' : '探索商店'}
                <ArrowUpRight size={15} />
              </button>
            }
          />
        )}
        <div className="panel-footer">
          {items.length} 个安装实例<span className="footer-right">取消接管会保留软件与配置</span>
        </div>
      </section>
    </>
  );
}
