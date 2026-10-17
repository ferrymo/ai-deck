import { Box, FolderOpen, Search, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Installation } from '../../core/models';
import { brandLogos } from './brands';

export function ToolIcon({ id, large = false }: { id: string; large?: boolean }) {
  const logo = brandLogos[id];
  return (
    <span
      className={`tool-icon ${logo ? 'official-logo' : 'ink'} ${large ? 'large' : ''}`}
      aria-hidden="true"
    >
      {logo ? <img src={logo} alt="" draggable={false} /> : <Box size={large ? 30 : 23} strokeWidth={1.8} />}
    </span>
  );
}
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function HealthBadge({ item }: { item: Installation }) {
  if (item.checkError) return <Badge tone="warning">检查失败</Badge>;
  if (item.health === 'broken') return <Badge tone="warning">待修复</Badge>;
  if (item.health === 'config-only') return <Badge>仅发现配置</Badge>;
  if (item.health === 'unknown') return <Badge>待验证</Badge>;
  return (
    <span className="health-label">
      <span className="status-dot" />
      已就绪
    </span>
  );
}
export function Empty({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <FolderOpen size={30} strokeWidth={1.4} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = '搜索名称、目录或版本…',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-input">
      <Search size={16} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" aria-label="清空搜索" onClick={() => onChange('')}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'on' : ''}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}
export const formatTime = (date?: string) =>
  date
    ? new Intl.DateTimeFormat('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(date))
    : '尚未检查';
