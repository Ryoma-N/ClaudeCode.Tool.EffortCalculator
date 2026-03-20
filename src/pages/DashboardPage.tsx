import { useMemo } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useAppStore } from '../stores/appStore'
import AlertSection from '../components/dashboard/AlertSection'
import OverallStats from '../components/dashboard/OverallStats'
import ProjectSummaryCard from '../components/dashboard/ProjectSummaryCard'

export default function DashboardPage() {
  const projects      = useAppStore(s => s.projects)
  const phases        = useAppStore(s => s.phases)
  const tasks         = useAppStore(s => s.tasks)
  const workEntries   = useAppStore(s => s.workEntries)
  const getStats      = useAppStore(s => s.getAllProjectsWithStats)

  const allStats = useMemo(() => getStats(), [getStats, projects, phases, tasks, workEntries])
  const active   = useMemo(() => allStats.filter(p => p.status === 'active'), [allStats])
  const dateStr  = format(new Date(), 'yyyy年M月d日(E)', { locale: ja })

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-ink">ダッシュボード</h1>
        <p className="text-sm text-ink-muted mt-0.5">{dateStr}</p>
      </div>

      <AlertSection />
      <OverallStats />

      <div>
        <h2 className="text-sm font-semibold text-ink-muted mb-3 uppercase tracking-wider">進行中プロジェクト</h2>
        {active.length === 0 ? (
          <p className="text-sm text-ink-subtle text-center py-8">進行中のプロジェクトはありません</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {active.map(p => <ProjectSummaryCard key={p.id} project={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
