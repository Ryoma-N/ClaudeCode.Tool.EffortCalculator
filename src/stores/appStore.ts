import { create } from 'zustand'
import { db } from '../db/database'
import { generateId } from '../utils/idUtils'
import { nowIso } from '../utils/dateUtils'
import { sumHours } from '../utils/hoursUtils'
import type {
  Project, Phase, Task, ProcessDefinition, WorkEntry,
  TaskWithActuals, PhaseWithStats, ProjectWithStats,
  AlertLevel,
} from '../types'
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns'

// ── Process color palette ────────────────────────────────────────────────────
const PALETTE = ['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316','#8b5cf6']
export const nextColor = (used: string[]): string =>
  PALETTE.find(c => !used.includes(c)) ?? PALETTE[used.length % PALETTE.length]

// ── Store ────────────────────────────────────────────────────────────────────
interface AppStore {
  projects:           Project[]
  phases:             Phase[]
  tasks:              Task[]
  processDefinitions: ProcessDefinition[]
  workEntries:        WorkEntry[]
  isLoaded:           boolean

  loadAll: () => Promise<void>

  // Projects
  addProject:    (d: Omit<Project, 'id'|'createdAt'|'updatedAt'>) => Promise<Project>
  updateProject: (id: string, d: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>

  // Phases
  addPhase:    (d: Omit<Phase, 'id'|'createdAt'|'updatedAt'>) => Promise<Phase>
  updatePhase: (id: string, d: Partial<Phase>) => Promise<void>
  deletePhase: (id: string) => Promise<void>

  // Tasks
  addTask:    (d: Omit<Task, 'id'|'createdAt'|'updatedAt'>) => Promise<Task>
  updateTask: (id: string, d: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>

  // ProcessDefinitions
  addProcess:    (d: Omit<ProcessDefinition, 'id'|'createdAt'>) => Promise<ProcessDefinition>
  updateProcess: (id: string, d: Partial<ProcessDefinition>) => Promise<void>
  deleteProcess: (id: string) => Promise<void>

  // WorkEntries
  addWorkEntry:    (entry: Omit<WorkEntry, 'id'|'createdAt'|'updatedAt'>) => Promise<WorkEntry>
  updateWorkEntry: (id: string, d: Partial<WorkEntry>) => Promise<void>
  deleteWorkEntry: (id: string) => Promise<void>

  // Computed selectors
  getTaskWithActuals:   (taskId: string) => TaskWithActuals | undefined
  getProjectWithStats:  (projectId: string) => ProjectWithStats | undefined
  getAllProjectsWithStats: () => ProjectWithStats[]
  getAlertTasks: () => { overdue: TaskWithActuals[]; soon: TaskWithActuals[] }
}

const computeTaskActuals = (task: Task, workEntries: WorkEntry[]): TaskWithActuals => {
  const entries     = workEntries.filter(e => e.taskId === task.id)
  const actualHours = sumHours(entries)
  // ステータスから進捗率を自動計算（手動入力不要）
  const rate        = task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0
  const earnedHours = task.estimatedHours ? task.estimatedHours * rate / 100 : 0
  const variance    = actualHours - earnedHours
  return { ...task, actualHours, earnedHours, variance, progress: rate }
}

const computeProjectStats = (
  project: Project,
  phases: Phase[],
  tasks: Task[],
  workEntries: WorkEntry[],
): ProjectWithStats => {
  const projectTasks  = tasks.filter(t => t.projectId === project.id)
  const projectPhases = phases.filter(p => p.projectId === project.id).sort((a, b) => a.order - b.order)

  const tasksWithActuals = projectTasks.map(t => computeTaskActuals(t, workEntries))

  const phaseStats: PhaseWithStats[] = projectPhases.map(phase => {
    const phaseTasks  = tasksWithActuals.filter(t => t.phaseId === phase.id).sort((a, b) => a.order - b.order)
    const estH        = phaseTasks.reduce((s, t) => s + (t.estimatedHours || 0), 0)
    const actH        = phaseTasks.reduce((s, t) => s + t.actualHours, 0)
    const earnedH     = phaseTasks.reduce((s, t) => s + t.earnedHours, 0)
    const variance    = actH - earnedH
    // 完了タスク数 / 総タスク数 で進捗率を計算（初心者にわかりやすい）
    const doneCount = phaseTasks.filter(t => t.status === 'done').length
    const prog = phaseTasks.length ? Math.round(doneCount / phaseTasks.length * 100) : NaN
    return { ...phase, tasks: phaseTasks, estimatedHours: estH, actualHours: actH, earnedHours: earnedH, variance, progress: prog }
  })

  const unphasedTasks = tasksWithActuals
    .filter(t => !t.phaseId || !projectPhases.find(p => p.id === t.phaseId))
    .sort((a, b) => a.order - b.order)

  const totalEstH    = tasksWithActuals.reduce((s, t) => s + (t.estimatedHours || 0), 0)
  const totalActH    = tasksWithActuals.reduce((s, t) => s + t.actualHours, 0)
  const totalEarnedH = tasksWithActuals.reduce((s, t) => s + t.earnedHours, 0)
  const totalVar     = totalActH - totalEarnedH
  // 完了タスク数 / 総タスク数 で進捗率を計算（初心者にわかりやすい）
  const doneCount = tasksWithActuals.filter(t => t.status === 'done').length
  const prog = tasksWithActuals.length ? Math.round(doneCount / tasksWithActuals.length * 100) : NaN

  let remainingDays: number | null = null
  let alertLevel: AlertLevel = 'none'
  if (project.endDate) {
    const d = parseISO(project.endDate)
    if (isValid(d)) {
      remainingDays = differenceInCalendarDays(d, new Date())
      if (remainingDays < 0)        alertLevel = 'danger'
      else if (remainingDays <= 3)  alertLevel = 'warning'
    }
  }

  return {
    ...project,
    phases: phaseStats,
    unphasedTasks,
    totalEstimatedHours: totalEstH,
    totalActualHours:    totalActH,
    totalEarnedHours:    totalEarnedH,
    totalVariance:       totalVar,
    progress:            prog,
    alertLevel,
    remainingDays,
  }
}

export const useAppStore = create<AppStore>((set, get) => ({
  projects:           [],
  phases:             [],
  tasks:              [],
  processDefinitions: [],
  workEntries:        [],
  isLoaded:           false,

  loadAll: async () => {
    const [projects, phases, tasks, processDefinitions, workEntries] = await Promise.all([
      db.projects.orderBy('createdAt').reverse().toArray(),
      db.phases.orderBy('order').toArray(),
      db.tasks.orderBy('order').toArray(),
      db.processDefinitions.orderBy('order').toArray(),
      db.workEntries.toArray(),
    ])
    set({ projects, phases, tasks, processDefinitions, workEntries, isLoaded: true })
  },

  // Projects
  addProject: async (d) => {
    const now = nowIso()
    const project: Project = { ...d, id: generateId(), createdAt: now, updatedAt: now }
    await db.projects.add(project)
    set(s => ({ projects: [project, ...s.projects] }))
    return project
  },
  updateProject: async (id, d) => {
    const upd = { ...d, updatedAt: nowIso() }
    await db.projects.update(id, upd)
    set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...upd } : p) }))
  },
  deleteProject: async (id) => {
    const taskIds = get().tasks.filter(t => t.projectId === id).map(t => t.id)
    await db.transaction('rw', [db.projects, db.phases, db.tasks, db.processDefinitions, db.workEntries], async () => {
      if (taskIds.length) await db.workEntries.where('taskId').anyOf(taskIds).delete()
      await db.tasks.where('projectId').equals(id).delete()
      await db.phases.where('projectId').equals(id).delete()
      await db.processDefinitions.where('projectId').equals(id).delete()
      await db.projects.delete(id)
    })
    set(s => ({
      projects:           s.projects.filter(p => p.id !== id),
      phases:             s.phases.filter(p => p.projectId !== id),
      tasks:              s.tasks.filter(t => t.projectId !== id),
      processDefinitions: s.processDefinitions.filter(p => p.projectId !== id),
      workEntries:        s.workEntries.filter(e => !taskIds.includes(e.taskId)),
    }))
  },

  // Phases
  addPhase: async (d) => {
    const now = nowIso()
    const phase: Phase = { ...d, id: generateId(), createdAt: now, updatedAt: now }
    await db.phases.add(phase)
    set(s => ({ phases: [...s.phases, phase] }))
    return phase
  },
  updatePhase: async (id, d) => {
    const upd = { ...d, updatedAt: nowIso() }
    await db.phases.update(id, upd)
    set(s => ({ phases: s.phases.map(p => p.id === id ? { ...p, ...upd } : p) }))
  },
  deletePhase: async (id) => {
    await db.phases.delete(id)
    // Unlink tasks from this phase
    await db.tasks.where('phaseId').equals(id).modify({ phaseId: '' })
    set(s => ({
      phases: s.phases.filter(p => p.id !== id),
      tasks:  s.tasks.map(t => t.phaseId === id ? { ...t, phaseId: '' } : t),
    }))
  },

  // Tasks
  addTask: async (d) => {
    const now = nowIso()
    const task: Task = { ...d, id: generateId(), createdAt: now, updatedAt: now }
    await db.tasks.add(task)
    set(s => ({ tasks: [...s.tasks, task] }))
    return task
  },
  updateTask: async (id, d) => {
    const upd = { ...d, updatedAt: nowIso() }
    await db.tasks.update(id, upd)
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...upd } : t) }))
  },
  deleteTask: async (id) => {
    await db.transaction('rw', db.tasks, db.workEntries, async () => {
      await db.workEntries.where('taskId').equals(id).delete()
      await db.tasks.delete(id)
    })
    set(s => ({
      tasks:       s.tasks.filter(t => t.id !== id),
      workEntries: s.workEntries.filter(e => e.taskId !== id),
    }))
  },

  // ProcessDefinitions
  addProcess: async (d) => {
    const process: ProcessDefinition = { ...d, id: generateId(), createdAt: nowIso() }
    await db.processDefinitions.add(process)
    set(s => ({ processDefinitions: [...s.processDefinitions, process] }))
    return process
  },
  updateProcess: async (id, d) => {
    await db.processDefinitions.update(id, d)
    set(s => ({ processDefinitions: s.processDefinitions.map(p => p.id === id ? { ...p, ...d } : p) }))
  },
  deleteProcess: async (id) => {
    await db.processDefinitions.delete(id)
    set(s => ({ processDefinitions: s.processDefinitions.filter(p => p.id !== id) }))
  },

  // WorkEntries
  addWorkEntry: async (d) => {
    const now   = nowIso()
    const entry: WorkEntry = { ...d, id: generateId(), createdAt: now, updatedAt: now }
    await db.workEntries.add(entry)
    set(s => ({ workEntries: [...s.workEntries, entry] }))
    return entry
  },
  updateWorkEntry: async (id, d) => {
    const upd = { ...d, updatedAt: nowIso() }
    await db.workEntries.update(id, upd)
    set(s => ({ workEntries: s.workEntries.map(e => e.id === id ? { ...e, ...upd } : e) }))
  },
  deleteWorkEntry: async (id) => {
    await db.workEntries.delete(id)
    set(s => ({ workEntries: s.workEntries.filter(e => e.id !== id) }))
  },

  // Computed selectors
  getTaskWithActuals: (taskId) => {
    const { tasks, workEntries } = get()
    const task = tasks.find(t => t.id === taskId)
    if (!task) return undefined
    return computeTaskActuals(task, workEntries)
  },

  getProjectWithStats: (projectId) => {
    const { projects, phases, tasks, workEntries } = get()
    const project = projects.find(p => p.id === projectId)
    if (!project) return undefined
    return computeProjectStats(project, phases, tasks, workEntries)
  },

  getAllProjectsWithStats: () => {
    const { projects, phases, tasks, workEntries } = get()
    return projects.map(p => computeProjectStats(p, phases, tasks, workEntries))
  },

  getAlertTasks: () => {
    const { tasks, workEntries } = get()
    const today = new Date()
    const activeTasks = tasks.filter(t => t.status !== 'done' && t.dueDate)
    const withActuals = activeTasks.map(t => computeTaskActuals(t, workEntries))
    const overdue = withActuals.filter(t => {
      const d = parseISO(t.dueDate)
      return isValid(d) && differenceInCalendarDays(d, today) < 0
    })
    const soon = withActuals.filter(t => {
      const d = parseISO(t.dueDate)
      const diff = differenceInCalendarDays(d, today)
      return isValid(d) && diff >= 0 && diff <= 3
    })
    return { overdue, soon }
  },
}))
