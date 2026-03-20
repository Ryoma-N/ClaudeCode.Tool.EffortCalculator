import { Briefcase, CheckCircle, Clock } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'

export default function OverallStats() {
  const projects = useAppStore(s => s.projects)
  const tasks    = useAppStore(s => s.tasks)

  const active    = projects.filter(p => p.status === 'active').length
  const completed = projects.filter(p => p.status === 'completed').length
  const doneTasks = tasks.filter(t => t.status === 'done').length

  const stats = [
    { icon: Briefcase,    label: '進行中PJ',   value: active,    color: 'text-brand-light' },
    { icon: CheckCircle,  label: '完了PJ',     value: completed,  color: 'text-ok' },
    { icon: Clock,        label: '完了タスク',  value: doneTasks,  color: 'text-ink-muted' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="bg-surface rounded-xl border border-edge p-3 text-center">
          <Icon size={18} className={`mx-auto mb-1 ${color}`} />
          <div className="text-xl font-bold text-ink">{value}</div>
          <div className="text-xs text-ink-subtle">{label}</div>
        </div>
      ))}
    </div>
  )
}
