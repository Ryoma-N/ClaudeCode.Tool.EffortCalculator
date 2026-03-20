import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { X } from 'lucide-react'
import type { Task, Phase } from '../../types'

type FormData = {
  name:           string
  description:    string
  phaseId:        string
  status:         'todo' | 'in_progress' | 'done'
  dueDate:        string
  estimatedHours: number
}

interface Props {
  initial?: Partial<Task>
  phases:   Phase[]
  onSave:   (data: FormData & { assignees: string[]; progressRate: number }) => void
  onCancel: () => void
}

const STATUS_OPTIONS = [
  { value: 'todo',        label: '未着手',  desc: 'まだ始めていない' },
  { value: 'in_progress', label: '進行中',  desc: '現在作業中' },
  { value: 'done',        label: '完了',    desc: '作業が終わった' },
] as const

export default function TaskForm({ initial, phases, onSave, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name:           initial?.name           ?? '',
      description:    initial?.description    ?? '',
      phaseId:        initial?.phaseId        ?? '',
      status:         initial?.status         ?? 'todo',
      dueDate:        initial?.dueDate        ?? '',
      estimatedHours: initial?.estimatedHours ?? 0,
    },
  })

  // 複数担当者の状態管理
  const [assignees, setAssignees] = useState<string[]>(initial?.assignees ?? [])
  const [assigneeInput, setAssigneeInput] = useState('')

  const addAssignee = () => {
    const name = assigneeInput.trim()
    if (name && !assignees.includes(name)) {
      setAssignees(prev => [...prev, name])
    }
    setAssigneeInput('')
  }

  const removeAssignee = (name: string) => {
    setAssignees(prev => prev.filter(a => a !== name))
  }

  const onSubmit = (raw: FormData) => {
    const progressRate = raw.status === 'done' ? 100 : raw.status === 'in_progress' ? 50 : 0
    onSave({
      ...raw,
      estimatedHours: Number(raw.estimatedHours) || 0,
      assignees,
      progressRate,
    })
  }

  const field = 'bg-surface-raised border border-edge rounded-lg px-3 py-2 text-sm text-ink w-full focus:outline-none focus:border-brand'
  const label = 'block text-xs text-ink-muted mb-1'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* タスク名 */}
      <div>
        <label className={label}>タスク名 <span className="text-danger">*</span></label>
        <input
          {...register('name', { required: '必須項目です' })}
          className={field}
          placeholder="例：ログイン画面のデザイン作成"
        />
        {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
      </div>

      {/* 説明 */}
      <div>
        <label className={label}>メモ・詳細（任意）</label>
        <textarea
          {...register('description')}
          rows={2}
          className={field}
          placeholder="このタスクの詳細や注意点などを書いておけます"
        />
      </div>

      {/* フェーズ + ステータス */}
      <div className="grid grid-cols-2 gap-3">
        {phases.length > 0 && (
          <div>
            <label className={label}>フェーズ（工程グループ）</label>
            <select {...register('phaseId')} className={field}>
              <option value="">グループなし</option>
              {phases.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className={phases.length > 0 ? '' : 'col-span-2'}>
          <label className={label}>進捗ステータス</label>
          <select {...register('status')} className={field}>
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label} — {o.desc}</option>
            ))}
          </select>
          <p className="text-xs text-ink-subtle mt-1">
            「完了」にすると進捗率が自動で上がります
          </p>
        </div>
      </div>

      {/* 期日 + 見積工数 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>期日（締め切り日）</label>
          <input type="date" {...register('dueDate')} className={field} />
        </div>
        <div>
          <label className={label}>作業時間の見積もり（時間）</label>
          <input
            type="number"
            step="0.5"
            min="0"
            {...register('estimatedHours')}
            className={field}
            placeholder="例：8（1日分）"
          />
          <p className="text-xs text-ink-subtle mt-1">未入力でも使えます</p>
        </div>
      </div>

      {/* 複数担当者 */}
      <div>
        <label className={label}>担当者（複数人設定できます）</label>
        <div className="flex gap-2">
          <input
            value={assigneeInput}
            onChange={e => setAssigneeInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addAssignee() }
            }}
            className={`${field} flex-1`}
            placeholder="名前を入力して Enter"
          />
          <button
            type="button"
            onClick={addAssignee}
            className="px-3 py-2 bg-surface-raised border border-edge rounded-lg text-sm text-ink hover:bg-surface-high transition-colors"
          >
            追加
          </button>
        </div>
        {assignees.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {assignees.map(name => (
              <span
                key={name}
                className="flex items-center gap-1 bg-brand/10 text-brand text-xs rounded-full px-2.5 py-1 border border-brand/20"
              >
                👤 {name}
                <button
                  type="button"
                  onClick={() => removeAssignee(name)}
                  className="hover:text-danger transition-colors ml-0.5"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 bg-brand hover:bg-brand/80 text-white rounded-lg py-2 text-sm font-semibold transition-colors"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm text-ink-muted border border-edge hover:bg-surface-raised transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
