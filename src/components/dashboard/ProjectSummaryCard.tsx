import { Link } from 'react-router-dom'
import { AlertTriangle, Clock } from 'lucide-react'
import type { ProjectWithStats } from '../../types'

export default function ProjectSummaryCard({ project }: { project: ProjectWithStats }) {
  const pct = isNaN(project.progress) ? 0 : Math.min(project.progress, 100)
  const barColor = pct >= 100 ? 'bg-ok' : pct >= 80 ? 'bg-warn' : 'bg-brand'

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block bg-surface rounded-xl border border-edge p-4 hover:border-edge-light hover:bg-surface-raised transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-ink text-sm truncate pr-2">{project.name}</h3>
        {project.alertLevel === 'danger'  && <AlertTriangle size={15} className="text-danger shrink-0" />}
        {project.alertLevel === 'warning' && <Clock size={15} className="text-warn shrink-0" />}
      </div>

      <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>

      <div className="flex justify-between text-xs text-ink-subtle">
        <span>{isNaN(project.progress) ? '見積なし' : `${project.progress}%`}</span>
        <span>
          {project.remainingDays === null ? '' :
           project.remainingDays < 0
             ? <span className="text-danger">{Math.abs(project.remainingDays)}日超過</span>
             : `残${project.remainingDays}日`
          }
        </span>
      </div>

      <div className="mt-2 text-xs text-ink-muted">
        {project.totalEstimatedHours > 0
          ? `見積${project.totalEstimatedHours}h · 実績${project.totalActualHours}h`
          : `実績${project.totalActualHours}h`
        }
      </div>
    </Link>
  )
}
