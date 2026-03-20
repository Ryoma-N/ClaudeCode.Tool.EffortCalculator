import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import TaskStatusBadge from '../components/task/TaskStatusBadge'
import TaskDueBadge from '../components/task/TaskDueBadge'
import DailyWorkLog from '../components/workentry/DailyWorkLog'
import Modal from '../components/ui/Modal'
import TaskForm from '../components/task/TaskForm'
import { sumHours } from '../utils/hoursUtils'

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const tasks              = useAppStore(s => s.tasks)
  const projects           = useAppStore(s => s.projects)
  const phases             = useAppStore(s => s.phases)
  const processDefinitions = useAppStore(s => s.processDefinitions)
  const workEntries        = useAppStore(s => s.workEntries)
  const { updateTask, deleteTask } = useAppStore()

  const [showEdit, setShowEdit] = useState(false)

  const task          = useMemo(() => tasks.find(t => t.id === id), [tasks, id])
  const project       = useMemo(() => task ? projects.find(p => p.id === task.projectId) : undefined, [task, projects])
  const projectPhases = useMemo(() => project ? phases.filter(p => p.projectId === project.id) : [], [project, phases])
  const processes     = useMemo(() => project ? processDefinitions.filter(p => p.projectId === project.id) : [], [project, processDefinitions])
  const taskEntries   = useMemo(() => workEntries.filter(e => e.taskId === id), [workEntries, id])
  const actualHours   = useMemo(() => sumHours(taskEntries), [taskEntries])
  // ステータスから進捗率を自動計算
  const progressRate  = task?.status === 'done' ? 100 : task?.status === 'in_progress' ? 50 : 0
  const earnedHours   = task?.estimatedHours ? task.estimatedHours * progressRate / 100 : 0
  const variance      = actualHours - earnedHours

  if (!task) return <div className="p-6 text-ink-muted">タスクが見つかりません</div>

  const pct      = Math.min(progressRate, 100)
  const barColor = pct >= 100 ? 'bg-ok' : pct >= 80 ? 'bg-warn' : 'bg-brand'

  const handleEdit = async (data: any) => {
    await updateTask(id!, data)
    setShowEdit(false)
  }

  const handleDelete = async () => {
    if (!confirm('このタスクを削除しますか？')) return
    await deleteTask(id!)
    navigate(project ? `/projects/${project.id}` : '/projects')
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-start gap-2">
        <Link to={project ? `/projects/${project.id}` : '/projects'} className="mt-1 p-1 rounded-lg hover:bg-surface-raised text-ink-muted">
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          {project && <p className="text-xs text-ink-subtle mb-1">{project.name}</p>}
          <h1 className="text-xl font-bold text-ink">{task.name}</h1>
          {task.description && <p className="text-sm text-ink-muted mt-1">{task.description}</p>}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => setShowEdit(true)} className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors">
            <Pencil size={16} />
          </button>
          <button onClick={handleDelete} className="p-2 rounded-lg text-ink-muted hover:text-danger hover:bg-surface-raised transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <TaskStatusBadge status={task.status} />
        <TaskDueBadge dueDate={task.dueDate} />
        {task.assignees && task.assignees.length > 0 && task.assignees.map(name => (
          <span key={name} className="text-xs text-ink-muted bg-surface-raised border border-edge rounded-full px-2.5 py-0.5">
            👤 {name}
          </span>
        ))}
      </div>

      {/* Hours summary */}
      <div className="bg-surface rounded-xl border border-edge p-4 space-y-4">
        {/* 進捗率 */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs text-ink-subtle">進捗率（ステータスから自動計算）</p>
            <p className="text-lg font-bold text-ink">{progressRate}%</p>
          </div>
          <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* 工数グリッド */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-ink-subtle mb-1">見積工数</p>
            <p className="text-base font-bold text-ink">{task.estimatedHours > 0 ? `${task.estimatedHours}h` : '—'}</p>
            {task.estimatedHours > 0 && project && project.mdHours > 0 && (
              <p className="text-xs text-ink-muted">{(task.estimatedHours / project.mdHours).toFixed(2)}人日</p>
            )}
          </div>
          <div>
            <p className="text-xs text-ink-subtle mb-1">出来高</p>
            <p className="text-base font-bold text-ink">{task.estimatedHours > 0 ? `${earnedHours.toFixed(1)}h` : '—'}</p>
            {task.estimatedHours > 0 && project && project.mdHours > 0 && (
              <p className="text-xs text-ink-muted">{(earnedHours / project.mdHours).toFixed(2)}人日</p>
            )}
          </div>
          <div>
            <p className="text-xs text-ink-subtle mb-1">実績工数</p>
            <p className="text-base font-bold text-ink">{actualHours}h</p>
            {project && project.mdHours > 0 && actualHours > 0 && (
              <p className="text-xs text-ink-muted">{(actualHours / project.mdHours).toFixed(2)}人日</p>
            )}
          </div>
        </div>

        {/* 乖離 */}
        {task.estimatedHours > 0 && (
          <div className="flex justify-between text-xs pt-1 border-t border-edge">
            <span className="text-ink-muted">乖離（実績 − 出来高）</span>
            <span className={`font-semibold ${variance > 0 ? 'text-danger' : variance < 0 ? 'text-ok' : 'text-ink-muted'}`}>
              {variance > 0 ? '+' : ''}{variance.toFixed(1)}h
              {project && project.mdHours > 0 ? ` (${variance > 0 ? '+' : ''}${(variance / project.mdHours).toFixed(2)}人日)` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Work entries */}
      <div className="bg-surface rounded-xl border border-edge p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">工程別実績</h2>
          {actualHours > 0 && (
            <span className="text-xs text-ink-muted">合計 <span className="font-bold text-ink">{actualHours}h</span></span>
          )}
        </div>

        {processes.length === 0 ? (
          <p className="text-xs text-ink-subtle">
            工程定義がありません —{' '}
            <Link to={`/projects/${task.projectId}/settings`} className="text-brand hover:underline">
              プロジェクト設定
            </Link>
            から追加できます
          </p>
        ) : (
          <>
            {taskEntries.length > 0 && (
              <table className="w-full text-sm mb-4">
                <tbody className="divide-y divide-edge">
                  {processes.map(proc => {
                    const total = taskEntries.filter(e => e.processId === proc.id).reduce((s, e) => s + e.hours, 0)
                    if (!total) return null
                    return (
                      <tr key={proc.id}>
                        <td className="py-1.5 text-ink">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proc.color }} />
                            {proc.name}
                          </span>
                        </td>
                        <td className="py-1.5 font-medium text-right text-ink">{total}h</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            <DailyWorkLog taskId={task.id} processes={processes} entries={taskEntries} />
          </>
        )}
      </div>

      {showEdit && (
        <Modal title="タスク編集" onClose={() => setShowEdit(false)}>
          <TaskForm initial={task} phases={projectPhases} onSave={handleEdit} onCancel={() => setShowEdit(false)} />
        </Modal>
      )}
    </div>
  )
}
