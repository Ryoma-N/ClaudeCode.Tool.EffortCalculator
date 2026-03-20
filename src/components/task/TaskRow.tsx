import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { TaskWithActuals } from '../../types'
import TaskStatusBadge from './TaskStatusBadge'
import TaskDueBadge from './TaskDueBadge'

export default function TaskRow({ task }: { task: TaskWithActuals; mdHours: number }) {
  const pct      = Math.min(task.progress, 100)
  const barColor = pct >= 100 ? 'bg-ok' : pct >= 80 ? 'bg-warn' : 'bg-brand'

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-surface-raised transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-ink truncate">{task.name}</span>
          <TaskStatusBadge status={task.status} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <TaskDueBadge dueDate={task.dueDate} />
          {task.assignees && task.assignees.length > 0 && (
            <span className="text-xs text-ink-muted">
              👤 {task.assignees.join(' · ')}
            </span>
          )}
          <span className="text-xs text-ink-subtle">
            {task.estimatedHours > 0 ? `見積${task.estimatedHours}h · 実績${task.actualHours}h` : task.actualHours > 0 ? `実績${task.actualHours}h` : ''}
          </span>
          <div className="flex-1 max-w-24 h-1 bg-surface-high rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-medium text-ink-subtle">{task.progress}%</span>
        </div>
      </div>
      <ChevronRight size={16} className="text-ink-subtle group-hover:text-ink transition-colors shrink-0" />
    </Link>
  )
}
