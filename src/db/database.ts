import Dexie, { type Table } from 'dexie'
import type { Project, Phase, Task, ProcessDefinition, WorkEntry } from '../types'

class AppDatabase extends Dexie {
  projects!:           Table<Project>
  phases!:             Table<Phase>
  tasks!:              Table<Task>
  processDefinitions!: Table<ProcessDefinition>
  workEntries!:        Table<WorkEntry>

  constructor() {
    super('ManHourApp')
    this.version(1).stores({
      projects:           'id, status, createdAt',
      phases:             'id, projectId, order',
      tasks:              'id, projectId, phaseId, status, dueDate, order',
      processDefinitions: 'id, projectId, order',
      workEntries:        'id, taskId, processId, recordedDate',
    })
    this.version(2).stores({
      projects:           'id, status, createdAt',
      phases:             'id, projectId, order',
      tasks:              'id, projectId, phaseId, status, dueDate, order',
      processDefinitions: 'id, projectId, order',
      workEntries:        'id, taskId, processId, recordedDate',
    }).upgrade(tx => {
      return tx.table('tasks').toCollection().modify((task: any) => {
        if (task.progressRate === undefined) {
          task.progressRate = task.status === 'done' ? 100 : 0
        }
      })
    })
    this.version(3).stores({
      projects:           'id, status, createdAt',
      phases:             'id, projectId, order',
      tasks:              'id, projectId, phaseId, status, dueDate, order',
      processDefinitions: 'id, projectId, order',
      workEntries:        'id, taskId, processId, recordedDate',
    }).upgrade(tx => {
      tx.table('projects').toCollection().modify((p: any) => {
        if (p.mmDays === undefined) p.mmDays = 20
      })
      return tx.table('tasks').toCollection().modify((t: any) => {
        if (t.assignee === undefined) t.assignee = ''
      })
    })
    // v4: assignee(string) → assignees(string[]), progressRate auto from status
    this.version(4).stores({
      projects:           'id, status, createdAt',
      phases:             'id, projectId, order',
      tasks:              'id, projectId, phaseId, status, dueDate, order',
      processDefinitions: 'id, projectId, order',
      workEntries:        'id, taskId, processId, recordedDate',
    }).upgrade(tx => {
      return tx.table('tasks').toCollection().modify((t: any) => {
        if (t.assignees === undefined) {
          t.assignees = t.assignee ? [t.assignee] : []
        }
        // auto-derive progressRate from status
        t.progressRate = t.status === 'done' ? 100 : t.status === 'in_progress' ? 50 : 0
      })
    })
  }
}

export const db = new AppDatabase()
