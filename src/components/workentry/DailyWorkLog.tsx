import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import type { ProcessDefinition, WorkEntry } from '../../types'
import { today } from '../../utils/dateUtils'

interface Props {
  taskId:    string
  processes: ProcessDefinition[]
  entries:   WorkEntry[]
}

export default function DailyWorkLog({ taskId, processes, entries }: Props) {
  const { addWorkEntry, deleteWorkEntry } = useAppStore()

  const [date,      setDate]      = useState(today())
  const [processId, setProcessId] = useState(processes[0]?.id ?? '')
  const [hours,     setHours]     = useState('')
  const [note,      setNote]      = useState('')
  const [saving,    setSaving]    = useState(false)

  const handleAdd = async () => {
    const h = parseFloat(hours)
    if (!h || h <= 0 || !processId || !date) return
    setSaving(true)
    try {
      await addWorkEntry({ taskId, processId, hours: h, note: note.trim(), recordedDate: date })
      setHours('')
      setNote('')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この実績を削除しますか？')) return
    await deleteWorkEntry(id)
  }

  // 日付降順でソート
  const sorted = [...entries].sort((a, b) => b.recordedDate.localeCompare(a.recordedDate))

  const field = 'bg-surface-raised border border-edge rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand'

  return (
    <div className="space-y-4">
      {/* 入力フォーム */}
      <div className="bg-surface-raised rounded-xl border border-edge p-3 space-y-3">
        <p className="text-xs font-semibold text-ink-muted">新規実績入力</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-ink-subtle mb-1">日付</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={field + ' w-full'} />
          </div>
          <div>
            <label className="block text-xs text-ink-subtle mb-1">工程</label>
            <select value={processId} onChange={e => setProcessId(e.target.value)} className={field + ' w-full'}>
              {processes.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-ink-subtle mb-1">時間 (h)</label>
            <input
              type="number" step="0.5" min="0.5" max="24"
              value={hours} onChange={e => setHours(e.target.value)}
              className={field + ' w-full'} placeholder="8"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-subtle mb-1">備考</label>
            <input
              type="text" value={note} onChange={e => setNote(e.target.value)}
              className={field + ' w-full'} placeholder="作業内容など"
            />
          </div>
        </div>
        <button
          onClick={handleAdd} disabled={saving || !hours || !processId}
          className="w-full flex items-center justify-center gap-1.5 bg-brand hover:bg-brand/80 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
        >
          <Plus size={14} /> 記録を追加
        </button>
      </div>

      {/* 履歴 */}
      {sorted.length === 0 ? (
        <p className="text-xs text-ink-subtle text-center py-3">実績がありません</p>
      ) : (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-ink-muted mb-2">実績履歴</p>
          {sorted.map(entry => {
            const proc = processes.find(p => p.id === entry.processId)
            return (
              <div key={entry.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised border border-edge">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: proc?.color ?? '#888' }} />
                <span className="text-xs text-ink-muted w-20 shrink-0">{entry.recordedDate}</span>
                <span className="text-xs text-ink-muted flex-1">{proc?.name ?? '—'}</span>
                <span className="text-sm font-bold text-ink">{entry.hours}h</span>
                {entry.note && <span className="text-xs text-ink-subtle hidden sm:block max-w-24 truncate">{entry.note}</span>}
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="p-1 rounded text-ink-subtle hover:text-danger transition-colors shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
