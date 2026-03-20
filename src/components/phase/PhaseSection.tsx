import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import type { PhaseWithStats, Phase } from '../../types'
import TaskRow from '../task/TaskRow'
import Modal from '../ui/Modal'
import TaskForm from '../task/TaskForm'
import { useAppStore } from '../../stores/appStore'

interface Props {
  phase:   PhaseWithStats
  allPhases: Phase[]
  mdHours: number
  projectId: string
  onEditPhase: () => void
  onDeletePhase: () => void
}

export default function PhaseSection({ phase, allPhases, mdHours, projectId, onEditPhase, onDeletePhase }: Props) {
  const [open, setOpen] = useState(true)
  const [addTask, setAddTask] = useState(false)
  const { addTask: storeAddTask } = useAppStore()

  const pct = isNaN(phase.progress) ? 0 : Math.min(phase.progress, 100)
  const barColor = pct >= 100 ? 'bg-ok' : pct >= 80 ? 'bg-warn' : 'bg-brand'

  const handleAddTask = async (data: any) => {
    await storeAddTask({ ...data, projectId, phaseId: phase.id, order: phase.tasks.length })
    setAddTask(false)
  }

  return (
    <div className="border border-edge rounded-xl overflow-hidden">
      {/* Phase header */}
      <div
        className="flex items-center gap-2 px-4 py-3 bg-surface cursor-pointer hover:bg-surface-raised transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {open ? <ChevronDown size={15} className="text-ink-muted" /> : <ChevronRight size={15} className="text-ink-muted" />}
        <span className="font-semibold text-sm text-ink flex-1">{phase.name}</span>

        {/* Progress bar */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-ink-subtle">
          <div className="w-20 h-1.5 bg-surface-high rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <span>{isNaN(phase.progress) ? '—' : `${phase.progress}%`}</span>
          <span>見積{phase.estimatedHours}h · 実績{phase.actualHours}h</span>
        </div>

        <button onClick={e => { e.stopPropagation(); setAddTask(true) }} className="ml-2 p-1 rounded hover:bg-surface-high text-ink-subtle hover:text-brand transition-colors">
          <Plus size={14} />
        </button>
        <button onClick={e => { e.stopPropagation(); onEditPhase() }} className="p-1 rounded hover:bg-surface-high text-ink-subtle hover:text-ink transition-colors">
          <Pencil size={13} />
        </button>
        <button onClick={e => { e.stopPropagation(); onDeletePhase() }} className="p-1 rounded hover:bg-surface-high text-ink-subtle hover:text-danger transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Task list */}
      {open && (
        <div className="bg-surface-base divide-y divide-edge/50">
          {phase.tasks.length === 0 && (
            <p className="text-xs text-ink-subtle px-4 py-3">タスクがありません</p>
          )}
          {phase.tasks.map(task => (
            <TaskRow key={task.id} task={task} mdHours={mdHours} />
          ))}
        </div>
      )}

      {addTask && (
        <Modal title="タスク追加" onClose={() => setAddTask(false)}>
          <TaskForm phases={allPhases} initial={{ phaseId: phase.id }} onSave={handleAddTask} onCancel={() => setAddTask(false)} />
        </Modal>
      )}
    </div>
  )
}
