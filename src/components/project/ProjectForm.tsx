import { useForm } from 'react-hook-form'
import type { Project } from '../../types'
import { today } from '../../utils/dateUtils'

type FormData = {
  name:        string
  description: string
  startDate:   string
  endDate:     string
  mdHours:     number
  mmDays:      number
  status:      'active' | 'completed' | 'archived'
}

interface Props {
  initial?: Partial<Project>
  onSave:   (data: FormData) => void
  onCancel: () => void
}

export default function ProjectForm({ initial, onSave, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name:        initial?.name        ?? '',
      description: initial?.description ?? '',
      startDate:   initial?.startDate   ?? today(),
      endDate:     initial?.endDate     ?? '',
      mdHours:     initial?.mdHours     ?? 8,
      mmDays:      initial?.mmDays      ?? 20,
      status:      initial?.status      ?? 'active',
    },
  })

  const onSubmit = (raw: FormData) => {
    onSave({ ...raw, mdHours: Number(raw.mdHours) || 8, mmDays: Number(raw.mmDays) || 20 })
  }

  const field = 'bg-surface-raised border border-edge rounded-lg px-3 py-2 text-sm text-ink w-full focus:outline-none focus:border-brand'
  const label = 'block text-xs text-ink-muted mb-1'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={label}>プロジェクト名 *</label>
        <input {...register('name', { required: '必須項目です' })} className={field} placeholder="ECサイトリニューアル" />
        {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className={label}>説明</label>
        <textarea {...register('description')} rows={2} className={field} placeholder="プロジェクトの概要..." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>開始日</label>
          <input type="date" {...register('startDate')} className={field} />
        </div>
        <div>
          <label className={label}>終了日（期限）</label>
          <input type="date" {...register('endDate')} className={field} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>1人日あたりの作業時間（h）</label>
          <input type="number" {...register('mdHours')} className={field} min={1} max={24} placeholder="8" />
        </div>
        <div>
          <label className={label}>1人月あたりの営業日数</label>
          <input type="number" {...register('mmDays')} className={field} min={1} max={31} placeholder="20" />
        </div>
      </div>

      <div>
        <label className={label}>ステータス</label>
        <select {...register('status')} className={field}>
          <option value="active">進行中</option>
          <option value="completed">完了</option>
          <option value="archived">アーカイブ</option>
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="flex-1 bg-brand hover:bg-brand/80 text-white rounded-lg py-2 text-sm font-semibold transition-colors">
          保存
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-ink-muted border border-edge hover:bg-surface-raised transition-colors">
          キャンセル
        </button>
      </div>
    </form>
  )
}
