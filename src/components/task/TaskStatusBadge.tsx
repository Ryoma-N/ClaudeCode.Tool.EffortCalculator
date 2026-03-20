import type { TaskStatus } from '../../types'

const MAP: Record<TaskStatus, { label: string; cls: string }> = {
  todo:        { label: '未着手', cls: 'bg-surface-raised text-ink-muted border border-edge' },
  in_progress: { label: '進行中', cls: 'bg-working/20 text-working border border-working/30' },
  done:        { label: '完了',   cls: 'bg-ok/20 text-ok border border-ok/30' },
}

export default function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { label, cls } = MAP[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
}
