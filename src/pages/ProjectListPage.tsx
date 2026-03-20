import { useState, useMemo } from 'react'
import { Plus, Archive, CheckCircle, Play } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import ProjectSummaryCard from '../components/dashboard/ProjectSummaryCard'
import Modal from '../components/ui/Modal'
import ProjectForm from '../components/project/ProjectForm'

type Filter = 'active' | 'completed' | 'archived'

export default function ProjectListPage() {
  const [filter, setFilter]     = useState<Filter>('active')
  const [showForm, setShowForm] = useState(false)

  const projects    = useAppStore(s => s.projects)
  const phases      = useAppStore(s => s.phases)
  const tasks       = useAppStore(s => s.tasks)
  const workEntries = useAppStore(s => s.workEntries)
  const getStats    = useAppStore(s => s.getAllProjectsWithStats)
  const { addProject } = useAppStore()

  const allStats = useMemo(() => getStats(), [getStats, projects, phases, tasks, workEntries])
  const filtered = useMemo(() => allStats.filter(p => p.status === filter), [allStats, filter])

  const handleAdd = async (data: any) => {
    await addProject(data)
    setShowForm(false)
  }

  const tabs: { key: Filter; label: string; icon: any }[] = [
    { key: 'active',    label: '進行中',     icon: Play },
    { key: 'completed', label: '完了',       icon: CheckCircle },
    { key: 'archived',  label: 'アーカイブ', icon: Archive },
  ]

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">プロジェクト</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-brand hover:bg-brand-light text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> 新規作成
        </button>
      </div>

      <div className="flex gap-1 bg-surface rounded-xl p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              filter === key ? 'bg-brand text-white shadow' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-subtle text-center py-12">プロジェクトがありません</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(p => <ProjectSummaryCard key={p.id} project={p} />)}
        </div>
      )}

      {showForm && (
        <Modal title="プロジェクト作成" onClose={() => setShowForm(false)}>
          <ProjectForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}
