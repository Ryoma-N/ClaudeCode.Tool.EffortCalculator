import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import jsPDF from 'jspdf'
import { useAppStore } from '../stores/appStore'

export default function MonthlyReportPage() {
  const now = new Date()
  const [yearMonth, setYearMonth] = useState(format(now, 'yyyy-MM'))

  const projects           = useAppStore(s => s.projects)
  const tasks              = useAppStore(s => s.tasks)
  const processDefinitions = useAppStore(s => s.processDefinitions)
  const workEntries        = useAppStore(s => s.workEntries)

  const [projectFilter, setProjectFilter] = useState<string>('all')

  // 対象月のエントリを絞り込み
  const monthEntries = useMemo(
    () => workEntries.filter(e => e.recordedDate.startsWith(yearMonth)),
    [workEntries, yearMonth]
  )

  // プロジェクトフィルタ適用
  const filteredEntries = useMemo(() => {
    if (projectFilter === 'all') return monthEntries
    const taskIds = tasks.filter(t => t.projectId === projectFilter).map(t => t.id)
    return monthEntries.filter(e => taskIds.includes(e.taskId))
  }, [monthEntries, projectFilter, tasks])

  // 行データを組み立て（日付 | タスク | 工程 | 担当者 | 時間 | 備考）
  const rows = useMemo(() => {
    return [...filteredEntries]
      .sort((a, b) => a.recordedDate.localeCompare(b.recordedDate))
      .map(entry => {
        const task    = tasks.find(t => t.id === entry.taskId)
        const project = task ? projects.find(p => p.id === task.projectId) : undefined
        const proc    = processDefinitions.find(p => p.id === entry.processId)
        return {
          id:          entry.id,
          date:        entry.recordedDate,
          projectName: project?.name ?? '—',
          taskName:    task?.name    ?? '—',
          assignee:    task?.assignees?.join(', ') ?? '—',
          processName: proc?.name    ?? '—',
          hours:       entry.hours,
          note:        entry.note,
        }
      })
  }, [filteredEntries, tasks, projects, processDefinitions])

  const totalHours = useMemo(() => rows.reduce((s, r) => s + r.hours, 0), [rows])

  // 工程別集計
  const byProcess = useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach(r => map.set(r.processName, (map.get(r.processName) ?? 0) + r.hours))
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  // 担当者別集計
  const byAssignee = useMemo(() => {
    const map = new Map<string, number>()
    rows.forEach(r => {
      const key = r.assignee || '未割当'
      map.set(key, (map.get(key) ?? 0) + r.hours)
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  // 人月計算（選択プロジェクトのmmDays・mdHours、複数混在時は最初のプロジェクトを使用）
  const mmHours = useMemo(() => {
    const proj = projectFilter !== 'all'
      ? projects.find(p => p.id === projectFilter)
      : projects[0]
    if (!proj) return null
    return proj.mmDays * proj.mdHours
  }, [projectFilter, projects])

  const generatePdf = () => {
    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W    = 210
    const m    = 15
    const lh   = 6.5
    let y      = m

    const t = (str: string, x: number, size = 10, bold = false) => {
      doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.text(str, x, y)
    }
    const ln = (gap = lh) => { y += gap }
    const hl = () => { doc.setDrawColor(200, 200, 200); doc.line(m, y, W - m, y); y += 3 }

    t(`月次工数レポート  ${yearMonth}`, m, 16, true); ln(9)
    if (projectFilter !== 'all') {
      const proj = projects.find(p => p.id === projectFilter)
      t(`プロジェクト: ${proj?.name ?? ''}`, m, 11); ln(7)
    }
    t(`合計工数: ${totalHours}h${mmHours ? `  /  ${(totalHours / mmHours).toFixed(2)}人月` : ''}`, m, 11); ln(4)
    hl()

    t('担当者別集計', m, 12, true); ln(7)
    byAssignee.forEach(([name, h]) => { t(`  ${name}:  ${h}h`, m); ln() })
    ln(2); hl()

    t('工程別集計', m, 12, true); ln(7)
    byProcess.forEach(([name, h]) => { t(`  ${name}:  ${h}h`, m); ln() })
    ln(2); hl()

    t('明細', m, 12, true); ln(7)
    rows.forEach(r => {
      if (y > 270) { doc.addPage(); y = m }
      t(`${r.date}  ${r.projectName}  ${r.taskName}  ${r.processName}  ${r.assignee}  ${r.hours}h`, m, 9)
      if (r.note) { ln(4.5); t(`    備考: ${r.note}`, m, 8); ln(4) }
      else ln()
    })

    doc.save(`月次工数_${yearMonth}.pdf`)
  }

  const field = 'bg-surface-raised border border-edge rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand'

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">月次レポート</h1>
        <button
          onClick={generatePdf}
          disabled={rows.length === 0}
          className="flex items-center gap-1.5 bg-brand hover:bg-brand/80 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Download size={15} /> PDF出力
        </button>
      </div>

      {/* フィルター */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="month" value={yearMonth} onChange={e => setYearMonth(e.target.value)}
          className={field}
        />
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} className={field}>
          <option value="all">全プロジェクト</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-16 text-ink-muted text-sm">
          {yearMonth} の実績がありません
        </div>
      ) : (
        <>
          {/* サマリーカード */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface rounded-xl border border-edge p-3 text-center">
              <p className="text-xs text-ink-subtle mb-1">合計工数</p>
              <p className="text-xl font-bold text-ink">{totalHours}h</p>
            </div>
            {mmHours && (
              <div className="bg-surface rounded-xl border border-edge p-3 text-center">
                <p className="text-xs text-ink-subtle mb-1">人月換算</p>
                <p className="text-xl font-bold text-brand">{(totalHours / mmHours).toFixed(2)}<span className="text-sm font-normal text-ink-muted">人月</span></p>
              </div>
            )}
            <div className="bg-surface rounded-xl border border-edge p-3 text-center">
              <p className="text-xs text-ink-subtle mb-1">稼働日数</p>
              <p className="text-xl font-bold text-ink">{new Set(rows.map(r => r.date)).size}<span className="text-sm font-normal text-ink-muted">日</span></p>
            </div>
            <div className="bg-surface rounded-xl border border-edge p-3 text-center">
              <p className="text-xs text-ink-subtle mb-1">記録件数</p>
              <p className="text-xl font-bold text-ink">{rows.length}<span className="text-sm font-normal text-ink-muted">件</span></p>
            </div>
          </div>

          {/* 集計テーブル 2列 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 担当者別 */}
            <div className="bg-surface rounded-xl border border-edge p-4">
              <h2 className="text-sm font-semibold text-ink mb-3">担当者別</h2>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-edge">
                  {byAssignee.map(([name, h]) => (
                    <tr key={name}>
                      <td className="py-1.5 text-ink">{name}</td>
                      <td className="py-1.5 text-right font-medium text-ink">{h}h</td>
                      {mmHours && <td className="py-1.5 text-right text-xs text-ink-muted pl-2">{(h / mmHours).toFixed(2)}人月</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 工程別 */}
            <div className="bg-surface rounded-xl border border-edge p-4">
              <h2 className="text-sm font-semibold text-ink mb-3">工程別</h2>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-edge">
                  {byProcess.map(([name, h]) => (
                    <tr key={name}>
                      <td className="py-1.5 text-ink">{name}</td>
                      <td className="py-1.5 text-right font-medium text-ink">{h}h</td>
                      {mmHours && <td className="py-1.5 text-right text-xs text-ink-muted pl-2">{(h / mmHours).toFixed(2)}人月</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 明細テーブル */}
          <div className="bg-surface rounded-xl border border-edge overflow-hidden">
            <div className="px-4 py-3 border-b border-edge">
              <h2 className="text-sm font-semibold text-ink">作業明細</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-edge text-xs text-ink-muted">
                    <th className="px-4 py-2 text-left">日付</th>
                    <th className="px-4 py-2 text-left">プロジェクト</th>
                    <th className="px-4 py-2 text-left">タスク</th>
                    <th className="px-4 py-2 text-left">工程</th>
                    <th className="px-4 py-2 text-left">担当者</th>
                    <th className="px-4 py-2 text-right">時間</th>
                    <th className="px-4 py-2 text-left hidden sm:table-cell">備考</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge">
                  {rows.map(r => (
                    <tr key={r.id} className="hover:bg-surface-raised transition-colors">
                      <td className="px-4 py-2 text-ink-muted whitespace-nowrap">{r.date}</td>
                      <td className="px-4 py-2 text-ink-muted text-xs max-w-24 truncate">{r.projectName}</td>
                      <td className="px-4 py-2 text-ink max-w-32 truncate">{r.taskName}</td>
                      <td className="px-4 py-2 text-ink-muted">{r.processName}</td>
                      <td className="px-4 py-2 text-ink-muted">{r.assignee}</td>
                      <td className="px-4 py-2 text-right font-medium text-ink">{r.hours}h</td>
                      <td className="px-4 py-2 text-ink-subtle text-xs hidden sm:table-cell max-w-32 truncate">{r.note}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-edge bg-surface-raised">
                    <td colSpan={5} className="px-4 py-2 text-xs font-semibold text-ink-muted">合計</td>
                    <td className="px-4 py-2 text-right font-bold text-ink">{totalHours}h</td>
                    <td className="hidden sm:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
