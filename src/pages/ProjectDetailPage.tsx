import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Plus, Settings, FileText, ChevronLeft, Pencil, Trash2 } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import ProjectProgressBar from '../components/project/ProjectProgressBar'
import PhaseSection from '../components/phase/PhaseSection'
import TaskRow from '../components/task/TaskRow'
import PhaseProgressChart from '../components/charts/PhaseProgressChart'
import ProcessBreakdownChart from '../components/charts/ProcessBreakdownChart'
import Modal from '../components/ui/Modal'
import TaskForm from '../components/task/TaskForm'
import ProjectForm from '../components/project/ProjectForm'
import { formatDate } from '../utils/dateUtils'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const projects    = useAppStore(s => s.projects)
  const phases      = useAppStore(s => s.phases)
  const tasks       = useAppStore(s => s.tasks)
  const workEntries = useAppStore(s => s.workEntries)
  const getStats    = useAppStore(s => s.getProjectWithStats)
  const { addTask, addPhase, updatePhase, deletePhase, updateProject, deleteProject } = useAppStore()

  const [showAddTask,     setShowAddTask]     = useState(false)
  const [showAddPhase,    setShowAddPhase]    = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  const [editPhaseId,     setEditPhaseId]     = useState<string | null>(null)

  const project       = useMemo(() => getStats(id!), [getStats, id, projects, phases, tasks, workEntries])
  const projectPhases = useMemo(() => phases.filter(p => p.projectId === id), [phases, id])
  const editingPhase  = useMemo(() => editPhaseId ? projectPhases.find(p => p.id === editPhaseId) : null, [editPhaseId, projectPhases])

  if (!project) return <div className="p-6 text-ink-muted">プロジェクトが見つかりません</div>

  const handleAddTask = async (data: any) => {
    await addTask({ ...data, projectId: id!, order: project.unphasedTasks.length })
    setShowAddTask(false)
  }

  const handleAddPhase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value.trim()
    if (!name) return
    await addPhase({ projectId: id!, name, order: projectPhases.length })
    setShowAddPhase(false)
  }

  const handleEditPhase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editPhaseId) return
    const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value.trim()
    if (!name) return
    await updatePhase(editPhaseId, { name })
    setEditPhaseId(null)
  }

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm('このフェーズを削除しますか？タスクのフェーズ割り当てが解除されます。')) return
    await deletePhase(phaseId)
  }

  const handleEditProject = async (data: any) => {
    await updateProject(id!, data)
    setShowEditProject(false)
  }

  const handleDeleteProject = async () => {
    if (!confirm(`「${project.name}」を削除しますか？全データが失われます。`)) return
    await deleteProject(id!)
    navigate('/projects')
  }

  const field = 'bg-surface-raised border border-edge rounded-lg px-3 py-2 text-sm text-ink w-full focus:outline-none focus:border-brand'

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-start gap-2">
        <Link to="/projects" className="mt-1 p-1 rounded-lg hover:bg-surface-raised text-ink-muted">
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-ink truncate">{project.name}</h1>
          {project.description && <p className="text-sm text-ink-muted mt-0.5">{project.description}</p>}
          {(project.startDate || project.endDate) && (
            <p className="text-xs text-ink-subtle mt-1">
              {formatDate(project.startDate)} 〜 {formatDate(project.endDate)}
            </p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => setShowEditProject(true)} className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors">
            <Pencil size={16} />
          </button>
          <Link to={`/projects/${id}/settings`} className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors">
            <Settings size={16} />
          </Link>
          <Link to={`/projects/${id}/pdf`} className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors">
            <FileText size={16} />
          </Link>
          <button onClick={handleDeleteProject} className="p-2 rounded-lg text-ink-muted hover:text-danger hover:bg-surface-raised transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Progress summary */}
      <div className="bg-surface rounded-xl border border-edge p-4">
        <ProjectProgressBar
          progress={project.progress}
          estimatedHours={project.totalEstimatedHours}
          actualHours={project.totalActualHours}
          earnedHours={project.totalEarnedHours}
          variance={project.totalVariance}
          mdHours={project.mdHours}
        />
      </div>

      {/* Charts */}
      {(project.phases.length > 0 || project.unphasedTasks.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {project.phases.length > 0 && (
            <div className="bg-surface rounded-xl border border-edge p-4">
              <PhaseProgressChart phases={project.phases} />
            </div>
          )}
          <div className="bg-surface rounded-xl border border-edge p-4">
            <ProcessBreakdownChart projectId={id!} />
          </div>
        </div>
      )}

      {/* Phases */}
      <div className="space-y-3">
        {project.phases.map(phase => (
          <PhaseSection
            key={phase.id}
            phase={phase}
            allPhases={projectPhases}
            mdHours={project.mdHours}
            projectId={id!}
            onEditPhase={() => setEditPhaseId(phase.id)}
            onDeletePhase={() => handleDeletePhase(phase.id)}
          />
        ))}

        {project.unphasedTasks.length > 0 && (
          <div className="border border-edge rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-surface">
              <span className="text-sm font-semibold text-ink-muted">フェーズなし</span>
            </div>
            <div className="bg-surface-base divide-y divide-edge">
              {project.unphasedTasks.map(task => (
                <TaskRow key={task.id} task={task} mdHours={project.mdHours} />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setShowAddPhase(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-ink-muted border border-edge hover:border-brand hover:text-brand transition-colors">
            <Plus size={14} /> フェーズ追加
          </button>
          <button onClick={() => setShowAddTask(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-ink-muted border border-edge hover:border-brand hover:text-brand transition-colors">
            <Plus size={14} /> タスク追加
          </button>
        </div>
      </div>

      {showAddTask && (
        <Modal title="タスク追加" onClose={() => setShowAddTask(false)}>
          <TaskForm phases={projectPhases} onSave={handleAddTask} onCancel={() => setShowAddTask(false)} />
        </Modal>
      )}

      {showAddPhase && (
        <Modal title="フェーズ追加" onClose={() => setShowAddPhase(false)}>
          <form onSubmit={handleAddPhase} className="space-y-4">
            <input name="name" className={field} placeholder="例：設計・開発・テスト" autoFocus />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-semibold">追加</button>
              <button type="button" onClick={() => setShowAddPhase(false)} className="px-4 py-2 rounded-lg text-sm border border-edge text-ink-muted">キャンセル</button>
            </div>
          </form>
        </Modal>
      )}

      {editingPhase && (
        <Modal title="フェーズ編集" onClose={() => setEditPhaseId(null)}>
          <form onSubmit={handleEditPhase} className="space-y-4">
            <input name="name" defaultValue={editingPhase.name} className={field} autoFocus />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-brand text-white rounded-lg py-2 text-sm font-semibold">保存</button>
              <button type="button" onClick={() => setEditPhaseId(null)} className="px-4 py-2 rounded-lg text-sm border border-edge text-ink-muted">キャンセル</button>
            </div>
          </form>
        </Modal>
      )}

      {showEditProject && (
        <Modal title="プロジェクト編集" onClose={() => setShowEditProject(false)}>
          <ProjectForm initial={project} onSave={handleEditProject} onCancel={() => setShowEditProject(false)} />
        </Modal>
      )}
    </div>
  )
}
