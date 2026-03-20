import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import { useAppStore } from '../stores/appStore'
import { formatDate } from '../utils/dateUtils'
import { format } from 'date-fns'

export default function PdfExportPage() {
  const { id } = useParams<{ id: string }>()
  const { getProjectWithStats, processDefinitions, workEntries, tasks } = useAppStore()
  const [generating, setGenerating] = useState(false)
  const project = getProjectWithStats(id!)

  if (!project) return <div className="p-6 text-ink-muted">プロジェクトが見つかりません</div>

  const processes = processDefinitions.filter(p => p.projectId === id)
  const projectTaskIds = tasks.filter(t => t.projectId === id).map(t => t.id)
  const projectEntries = workEntries.filter(e => projectTaskIds.includes(e.taskId))

  const generatePdf = async () => {
    setGenerating(true)
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210, margin = 15, lineH = 7
      let y = margin

      const text = (str: string, x: number, size = 10, bold = false) => {
        doc.setFontSize(size)
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.text(str, x, y)
      }
      const line = (gap = lineH) => { y += gap }
      const hLine = () => { doc.setDrawColor(200, 200, 200); doc.line(margin, y, W - margin, y); y += 3 }

      // Title
      text('Project Work Hours Report', margin, 18, true)
      line(10)
      text(`Project: ${project.name}`, margin, 12, true)
      line(6)
      if (project.description) { text(project.description, margin, 9); line(5) }
      text(`Period: ${formatDate(project.startDate)} - ${formatDate(project.endDate)}`, margin)
      line()
      text(`Generated: ${format(new Date(), 'yyyy/MM/dd HH:mm')}`, margin)
      line(4)
      hLine()

      // Summary
      text('Summary', margin, 13, true)
      line(8)
      const estMd     = project.mdHours > 0 ? ` / ${(project.totalEstimatedHours / project.mdHours).toFixed(2)}人日` : ''
      const earnedMd  = project.mdHours > 0 ? ` / ${(project.totalEarnedHours / project.mdHours).toFixed(2)}人日` : ''
      const actMd     = project.mdHours > 0 ? ` / ${(project.totalActualHours / project.mdHours).toFixed(2)}人日` : ''
      const varSign   = project.totalVariance >= 0 ? '+' : ''
      const varMd     = project.mdHours > 0 ? ` / ${varSign}${(project.totalVariance / project.mdHours).toFixed(2)}人日` : ''
      const prog      = isNaN(project.progress) ? 'N/A' : `${project.progress}%`
      text(`見積工数:   ${project.totalEstimatedHours}h${estMd}`, margin)
      line()
      text(`出来高:     ${project.totalEarnedHours.toFixed(1)}h${earnedMd}`, margin)
      line()
      text(`実績工数:   ${project.totalActualHours}h${actMd}`, margin)
      line()
      text(`乖離:       ${varSign}${project.totalVariance.toFixed(1)}h${varMd}`, margin)
      line()
      text(`進捗率:     ${prog}`, margin)
      line(4)
      hLine()

      // Process breakdown
      if (processes.length > 0) {
        text('Process Breakdown', margin, 13, true)
        line(8)
        processes.forEach(proc => {
          const hrs = projectEntries.filter(e => e.processId === proc.id).reduce((s, e) => s + e.hours, 0)
          if (hrs > 0) {
            text(`  ${proc.name}:  ${hrs}h`, margin)
            line()
          }
        })
        line(2)
        hLine()
      }

      // Phase breakdown
      if (project.phases.length > 0) {
        text('Phase Breakdown', margin, 13, true)
        line(8)
        project.phases.forEach(phase => {
          text(`[${phase.name}]  Est: ${phase.estimatedHours}h  Act: ${phase.actualHours}h`, margin, 10, true)
          line()
          phase.tasks.forEach(task => {
            const status = { todo: 'TODO', in_progress: 'WIP', done: 'DONE' }[task.status]
            text(`  [${status}] ${task.name}  Est:${task.estimatedHours || '-'}h  Act:${task.actualHours}h`, margin + 3, 9)
            line(5.5)
            if (y > 270) { doc.addPage(); y = margin }
          })
          line(2)
        })
      }

      // Unphased tasks
      const unphased = project.unphasedTasks
      if (unphased.length > 0) {
        text('Other Tasks', margin, 13, true)
        line(8)
        unphased.forEach(task => {
          const status = { todo: 'TODO', in_progress: 'WIP', done: 'DONE' }[task.status]
          text(`  [${status}] ${task.name}  Est:${task.estimatedHours || '-'}h  Act:${task.actualHours}h`, margin, 9)
          line(5.5)
          if (y > 270) { doc.addPage(); y = margin }
        })
      }

      doc.save(`${project.name}_report_${format(new Date(), 'yyyyMMdd')}.pdf`)
    } finally {
      setGenerating(false)
    }
  }

  const allTasks = [...project.phases.flatMap(ph => ph.tasks), ...project.unphasedTasks]

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5 fade-in">
      <div className="flex items-center gap-2">
        <Link to={`/projects/${id}`} className="p-1 rounded-lg hover:bg-surface-raised text-ink-muted">
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-ink">PDFレポート出力</h1>
      </div>

      {/* Preview */}
      <div className="bg-surface rounded-xl border border-edge p-5 space-y-4">
        <h2 className="font-bold text-ink text-base">{project.name}</h2>
        {project.description && <p className="text-sm text-ink-muted">{project.description}</p>}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-ink-subtle">見積合計</span><br /><span className="font-bold text-ink">{project.totalEstimatedHours}h</span></div>
          <div><span className="text-ink-subtle">実績合計</span><br /><span className="font-bold text-ink">{project.totalActualHours}h</span></div>
          <div><span className="text-ink-subtle">進捗</span><br /><span className="font-bold text-ink">{isNaN(project.progress) ? '—' : `${project.progress}%`}</span></div>
          <div><span className="text-ink-subtle">タスク数</span><br /><span className="font-bold text-ink">{allTasks.length}件</span></div>
        </div>
        <div className="border-t border-edge pt-3">
          <p className="text-xs text-ink-subtle mb-2">含まれる情報</p>
          <ul className="text-xs text-ink-muted space-y-1">
            <li>✓ プロジェクトサマリー（見積・実績・進捗）</li>
            <li>✓ 工程別実績内訳</li>
            <li>✓ フェーズ別・タスク別の工数一覧</li>
          </ul>
        </div>
      </div>

      <button
        onClick={generatePdf}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand/80 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
      >
        <Download size={16} />
        {generating ? 'PDF生成中...' : 'PDFをダウンロード'}
      </button>
    </div>
  )
}
