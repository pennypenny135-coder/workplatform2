import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'ghost';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md font-medium',
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-2.5 py-1 text-sm',
        variant === 'default' && 'bg-gray-700 text-gray-300',
        variant === 'success' && 'bg-emerald-900/50 text-emerald-400 border border-emerald-800',
        variant === 'warning' && 'bg-amber-900/50 text-amber-400 border border-amber-800',
        variant === 'danger' && 'bg-red-900/50 text-red-400 border border-red-800',
        variant === 'info' && 'bg-sky-900/50 text-sky-400 border border-sky-800',
        variant === 'purple' && 'bg-purple-900/50 text-purple-400 border border-purple-800',
        variant === 'ghost' && 'bg-transparent text-gray-400 border border-gray-700',
        className,
      )}
    >
      {children}
    </span>
  );
}

// Priority badge helper
export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    low:    { label: '低', variant: 'ghost' },
    medium: { label: '中', variant: 'info' },
    high:   { label: '高', variant: 'warning' },
    urgent: { label: '緊急', variant: 'danger' },
  };
  const { label, variant } = map[priority] ?? { label: priority, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
}

// Status badge helper for tasks
export function TaskStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    inbox:       { label: '收件箱', variant: 'ghost' },
    next:        { label: '下一步', variant: 'info' },
    'in-progress': { label: '進行中', variant: 'purple' },
    waiting:     { label: '等待中', variant: 'warning' },
    completed:   { label: '已完成', variant: 'success' },
    cancelled:   { label: '已取消', variant: 'default' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
}

// Project status badge
export function ProjectStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    planning:  { label: '規劃中', variant: 'ghost' },
    active:    { label: '進行中', variant: 'success' },
    paused:    { label: '暫停', variant: 'warning' },
    completed: { label: '已完成', variant: 'info' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
}

// Contact status badge
export function ContactStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    lead:      { label: '潛在客戶', variant: 'ghost' },
    contacted: { label: '已聯絡', variant: 'info' },
    proposal:  { label: '報價中', variant: 'warning' },
    won:       { label: '成交', variant: 'success' },
    lost:      { label: '失敗', variant: 'danger' },
  };
  const { label, variant } = map[status] ?? { label: status, variant: 'default' };
  return <Badge variant={variant}>{label}</Badge>;
}
