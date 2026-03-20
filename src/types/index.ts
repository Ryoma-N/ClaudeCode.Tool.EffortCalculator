export type ProjectStatus = 'active' | 'completed' | 'archived'
export type TaskStatus   = 'todo' | 'in_progress' | 'done'
export type AlertLevel   = 'none' | 'warning' | 'danger'

export interface Project {
  id:          string
  name:        string
  description: string
  startDate:   string
  endDate:     string
  status:      ProjectStatus
  mdHours:     number        // 1人日 = mdHours h (default 8)
  mmDays:      number        // 1人月 = mmDays 営業日 (default 20)
  createdAt:   string
  updatedAt:   string
}

export interface Phase {
  id:        string
  projectId: string
  name:      string
  order:     number
  createdAt: string
  updatedAt: string
}

export interface Task {
  id:             string
  projectId:      string
  phaseId:        string     // '' = no phase
  name:           string
  description:    string
  status:         TaskStatus
  dueDate:        string     // '' = no due date
  estimatedHours: number     // 0 = not set
  progressRate:   number     // 0-100 (%), auto-derived from status
  assignees:      string[]   // 複数担当者
  order:          number
  createdAt:      string
  updatedAt:      string
}

export interface ProcessDefinition {
  id:        string
  projectId: string
  name:      string
  order:     number
  color:     string
  createdAt: string
}

export interface WorkEntry {
  id:           string
  taskId:       string
  processId:    string
  hours:        number
  note:         string
  recordedDate: string
  createdAt:    string
  updatedAt:    string
}

// ── Computed / derived types ─────────────────────────────────────────────────

export interface TaskWithActuals extends Task {
  actualHours: number   // 実績工数 (h)
  earnedHours: number   // 出来高工数 = estimatedHours * progressRate / 100
  variance:    number   // 乖離 = actualHours - earnedHours (+ = 予算超過傾向)
  progress:    number   // = progressRate (0-100)
}

export interface PhaseWithStats extends Phase {
  tasks:          TaskWithActuals[]
  estimatedHours: number   // 見積合計
  actualHours:    number   // 実績合計
  earnedHours:    number   // 出来高合計
  variance:       number   // 乖離合計
  progress:       number   // 加重平均進捗率
}

export interface ProjectWithStats extends Project {
  phases:              PhaseWithStats[]
  unphasedTasks:       TaskWithActuals[]
  totalEstimatedHours: number
  totalActualHours:    number
  totalEarnedHours:    number   // 出来高合計
  totalVariance:       number   // 乖離合計
  progress:            number   // 加重平均進捗率 (NaN if no estimate)
  alertLevel:          AlertLevel
  remainingDays:       number | null
}
