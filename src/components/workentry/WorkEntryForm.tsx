import { useState, useEffect } from 'react'
import type { ProcessDefinition, WorkEntry } from '../../types'
import { today } from '../../utils/dateUtils'

interface EntryRow {
  processId:    string
  hours:        number
  note:         string
  recordedDate: string
}

interface Props {
  processes:   ProcessDefinition[]
  existing:    WorkEntry[]
  onSave:      (entries: EntryRow[]) => void
  onCancel:    () => void
}

export default function WorkEntryForm({ processes, existing, onSave, onCancel }: Props) {
  const [rows, setRows] = useState<EntryRow[]>([])

  useEffect(() => {
    if (processes.length === 0) return
    const init = processes.map(p => {
      const ex = existing.find(e => e.processId === p.id)
      return { processId: p.id, hours: ex?.hours ?? 0, note: ex?.note ?? '', recordedDate: ex?.recordedDate ?? today() }
    })
    setRows(init)
  }, [processes, existing])

  const update = (i: number, field: keyof EntryRow, value: string | number) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  const total = rows.reduce((s, r) => s + (Number(r.hours) || 0), 0)

  const field = 'bg-surface-raised border border-edge rounded-lg px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-brand'

  if (processes.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-ink-muted mb-3">工程定義がありません</p>
        <p className="text-xs text-ink-subtle">プロジェクト設定から工程を追加してください</p>
        <button onClick={onCancel} className="mt-4 px-4 py-2 rounded-lg text-sm border border-edge text-ink-muted hover:bg-surface-raised">閉じる</button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-ink-subtle border-b border-edge">
            <th className="text-left pb-2 font-medium">工程</th>
            <th className="text-left pb-2 font-medium">実績 (h)</th>
            <th className="text-left pb-2 font-medium hidden sm:table-cell">メモ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-edge/30">
          {rows.map((row, i) => (
            <tr key={row.processId}>
              <td className="py-2 pr-2">
                <span className="text-ink text-sm">
                  {processes.find(p => p.id === row.processId)?.name}
                </span>
              </td>
              <td className="py-2 pr-2 w-24">
                <input
                  type="number" step="0.5" min="0"
                  value={row.hours || ''}
                  onChange={e => update(i, 'hours', parseFloat(e.target.value) || 0)}
                  className={`${field} w-full`}
                  placeholder="0"
                />
              </td>
              <td className="py-2 hidden sm:table-cell">
                <input
                  type="text"
                  value={row.note}
                  onChange={e => update(i, 'note', e.target.value)}
                  className={`${field} w-full`}
                  placeholder="メモ"
                />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-edge">
            <td className="pt-2 text-xs text-ink-muted font-semibold">合計</td>
            <td className="pt-2 font-bold text-ink">{total}h</td>
          </tr>
        </tfoot>
      </table>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onSave(rows)}
          className="flex-1 bg-brand hover:bg-brand/80 text-white rounded-lg py-2 text-sm font-semibold transition-colors"
        >
          保存
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm text-ink-muted border border-edge hover:bg-surface-raised transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
