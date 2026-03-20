import { useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useAppStore } from '../stores/appStore'
import { formatDate } from '../utils/dateUtils'
import { format } from 'date-fns'

// ── スタイル定数 ────────────────────────────────────────────────────────────
const S = {
  page:       { fontFamily: '"Meiryo", "Yu Gothic", "Hiragino Sans", sans-serif', fontSize: 11, color: '#1a1a1a', backgroundColor: '#fff', padding: '12mm 14mm', width: '182mm', boxSizing: 'border-box' as const, lineHeight: 1.6 },
  title:      { fontSize: 20, fontWeight: 700, color: '#4c1d95', marginBottom: 4 },
  subtitle:   { fontSize: 11, color: '#555', marginBottom: 2 },
  section:    { marginTop: 14, marginBottom: 6, paddingBottom: 3, borderBottom: '2px solid #7c3aed', display: 'flex', alignItems: 'center', gap: 6 },
  sectionTxt: { fontSize: 13, fontWeight: 700, color: '#4c1d95' },
  card:       { background: '#f5f3ff', borderRadius: 6, padding: '8px 12px', marginBottom: 8 },
  grid:       { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 10 },
  statBox:    { background: '#f5f3ff', borderRadius: 6, padding: '6px 10px', textAlign: 'center' as const },
  statLabel:  { fontSize: 9, color: '#7c3aed', marginBottom: 2 },
  statVal:    { fontSize: 15, fontWeight: 700, color: '#1a1a1a' },
  statSub:    { fontSize: 9, color: '#666' },
  bar:        { height: 8, borderRadius: 4, background: '#e9d5ff', overflow: 'hidden', marginTop: 4 },
  barInner:   (pct: number) => ({ height: '100%', width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? '#10b981' : pct >= 70 ? '#7c3aed' : '#3b82f6', borderRadius: 4 }),
  table:      { width: '100%', borderCollapse: 'collapse' as const, fontSize: 10, marginBottom: 8 },
  th:         { background: '#7c3aed', color: '#fff', padding: '4px 8px', textAlign: 'left' as const, fontWeight: 600 },
  thR:        { background: '#7c3aed', color: '#fff', padding: '4px 8px', textAlign: 'right' as const, fontWeight: 600 },
  td:         { padding: '4px 8px', borderBottom: '1px solid #e9d5ff', verticalAlign: 'top' as const },
  tdR:        { padding: '4px 8px', borderBottom: '1px solid #e9d5ff', textAlign: 'right' as const },
  tdAlt:      { padding: '4px 8px', borderBottom: '1px solid #e9d5ff', background: '#faf5ff', verticalAlign: 'top' as const },
  badge:      (s: string) => ({ display: 'inline-block', padding: '1px 6px', borderRadius: 10, fontSize: 9, fontWeight: 600, background: s === 'done' ? '#d1fae5' : s === 'in_progress' ? '#dbeafe' : '#f3f4f6', color: s === 'done' ? '#065f46' : s === 'in_progress' ? '#1e40af' : '#374151' }),
  footer:     { marginTop: 12, paddingTop: 6, borderTop: '1px solid #ddd', fontSize: 9, color: '#999', textAlign: 'right' as const },
}

const STATUS_LABEL: Record<string, string> = { todo: '未着手', in_progress: '進行中', done: '完了' }

export default function PdfExportPage() {
  const { id } = useParams<{ id: string }>()
  const { getProjectWithStats, processDefinitions, workEntries, tasks } = useAppStore()
  const [generating, setGenerating] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const project = getProjectWithStats(id!)
  if (!project) return <div className="p-6 text-ink-muted">プロジェクトが見つかりません</div>

  const processes       = processDefinitions.filter(p => p.projectId === id)
  const projectTaskIds  = tasks.filter(t => t.projectId === id).map(t => t.id)
  const projectEntries  = workEntries.filter(e => projectTaskIds.includes(e.taskId))
  const allTasks        = [...project.phases.flatMap(ph => ph.tasks), ...project.unphasedTasks]
  const prog            = isNaN(project.progress) ? 0 : project.progress

  const generatePdf = async () => {
    if (!reportRef.current) return
    setGenerating(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })

      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW     = 210
      const pdfH     = 297
      const imgW     = pdfW
      const imgH     = (canvas.height * pdfW) / canvas.width
      const imgData  = canvas.toDataURL('image/png')

      // 複数ページに分割して出力
      let remain  = imgH
      let offset  = 0
      let isFirst = true
      while (remain > 0) {
        if (!isFirst) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -offset, imgW, imgH)
        offset  += pdfH
        remain  -= pdfH
        isFirst  = false
      }

      pdf.save(`${project.name}_工数レポート_${format(new Date(), 'yyyyMMdd')}.pdf`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5 fade-in">
      {/* ヘッダー */}
      <div className="flex items-center gap-2">
        <Link to={`/projects/${id}`} className="p-1 rounded-lg hover:bg-surface-raised text-ink-muted">
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold text-ink">PDFレポート出力</h1>
      </div>

      {/* ダウンロードボタン */}
      <button
        onClick={generatePdf}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand/80 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
      >
        <Download size={16} />
        {generating ? 'PDF生成中...' : 'PDFをダウンロード'}
      </button>

      <p className="text-xs text-ink-subtle text-center">下のプレビューがそのままPDFになります</p>

      {/* ── PDF用レポート本体（プレビュー兼用） ── */}
      <div className="rounded-xl overflow-hidden border border-edge shadow-lg">
        <div ref={reportRef} style={S.page}>

          {/* タイトル */}
          <div style={{ borderBottom: '3px solid #7c3aed', paddingBottom: 8, marginBottom: 12 }}>
            <div style={S.title}>工数レポート</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{project.name}</div>
            {project.description && <div style={S.subtitle}>{project.description}</div>}
            <div style={{ display: 'flex', gap: 20, fontSize: 10, color: '#666', marginTop: 4 }}>
              <span>期間：{formatDate(project.startDate)} 〜 {formatDate(project.endDate)}</span>
              <span>出力日：{format(new Date(), 'yyyy年MM月dd日')}</span>
              <span>ステータス：{{ active: '進行中', completed: '完了', archived: 'アーカイブ' }[project.status]}</span>
            </div>
          </div>

          {/* サマリー */}
          <div style={S.section}><span style={{ fontSize: 16 }}>📊</span><span style={S.sectionTxt}>サマリー</span></div>
          <div style={S.grid}>
            <div style={S.statBox}>
              <div style={S.statLabel}>見積工数</div>
              <div style={S.statVal}>{project.totalEstimatedHours}h</div>
              {project.mdHours > 0 && <div style={S.statSub}>{(project.totalEstimatedHours / project.mdHours).toFixed(1)}人日</div>}
            </div>
            <div style={S.statBox}>
              <div style={S.statLabel}>実績工数</div>
              <div style={S.statVal}>{project.totalActualHours}h</div>
              {project.mdHours > 0 && <div style={S.statSub}>{(project.totalActualHours / project.mdHours).toFixed(1)}人日</div>}
            </div>
            <div style={S.statBox}>
              <div style={S.statLabel}>進捗率</div>
              <div style={S.statVal}>{isNaN(project.progress) ? '—' : `${project.progress}%`}</div>
              <div style={S.statSub}>{allTasks.filter(t => t.status === 'done').length} / {allTasks.length} タスク完了</div>
            </div>
            <div style={S.statBox}>
              <div style={S.statLabel}>乖離</div>
              <div style={{ ...S.statVal, color: project.totalVariance > 0 ? '#dc2626' : project.totalVariance < 0 ? '#059669' : '#1a1a1a' }}>
                {project.totalVariance > 0 ? '+' : ''}{project.totalVariance.toFixed(1)}h
              </div>
              <div style={S.statSub}>{project.totalVariance > 0 ? '予算超過傾向' : project.totalVariance < 0 ? '予算内' : '±0'}</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>進捗バー</div>
          <div style={S.bar}><div style={S.barInner(prog)} /></div>
          <div style={{ fontSize: 9, color: '#888', textAlign: 'right', marginBottom: 10 }}>{prog}%</div>

          {/* 工程別実績 */}
          {processes.length > 0 && projectEntries.length > 0 && (() => {
            const rows = processes.map(p => ({
              name: p.name,
              hrs: projectEntries.filter(e => e.processId === p.id).reduce((s, e) => s + e.hours, 0),
            })).filter(r => r.hrs > 0)
            if (rows.length === 0) return null
            return (
              <>
                <div style={S.section}><span style={{ fontSize: 16 }}>🔧</span><span style={S.sectionTxt}>工程別実績</span></div>
                <table style={S.table}>
                  <thead>
                    <tr><th style={S.th}>工程名</th><th style={S.thR}>実績（h）</th><th style={S.thR}>割合</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.name}>
                        <td style={i % 2 === 0 ? S.td : S.tdAlt}>{r.name}</td>
                        <td style={{ ...(i % 2 === 0 ? S.tdR : { ...S.tdR, background: '#faf5ff' }) }}>{r.hrs}h</td>
                        <td style={{ ...(i % 2 === 0 ? S.tdR : { ...S.tdR, background: '#faf5ff' }) }}>
                          {project.totalActualHours > 0 ? `${Math.round(r.hrs / project.totalActualHours * 100)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )
          })()}

          {/* フェーズ別タスク一覧 */}
          {project.phases.length > 0 && (
            <>
              <div style={S.section}><span style={{ fontSize: 16 }}>📋</span><span style={S.sectionTxt}>フェーズ別タスク一覧</span></div>
              {project.phases.map(phase => (
                <div key={phase.id} style={{ marginBottom: 10 }}>
                  <div style={{ background: '#ede9fe', borderLeft: '4px solid #7c3aed', padding: '4px 10px', fontSize: 11, fontWeight: 700, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{phase.name}</span>
                    <span style={{ fontWeight: 400, fontSize: 10, color: '#555' }}>
                      見積 {phase.estimatedHours}h ／ 実績 {phase.actualHours}h ／ 進捗 {isNaN(phase.progress) ? '—' : `${phase.progress}%`}
                    </span>
                  </div>
                  {phase.tasks.length > 0 && (
                    <table style={S.table}>
                      <thead>
                        <tr>
                          <th style={S.th}>タスク名</th>
                          <th style={S.th}>担当者</th>
                          <th style={S.th}>ステータス</th>
                          <th style={S.thR}>見積(h)</th>
                          <th style={S.thR}>実績(h)</th>
                          <th style={S.th}>期日</th>
                        </tr>
                      </thead>
                      <tbody>
                        {phase.tasks.map((task, i) => (
                          <tr key={task.id}>
                            <td style={i % 2 === 0 ? S.td : S.tdAlt}>{task.name}</td>
                            <td style={i % 2 === 0 ? S.td : S.tdAlt}>{task.assignees?.join(', ') || '—'}</td>
                            <td style={i % 2 === 0 ? S.td : S.tdAlt}><span style={S.badge(task.status)}>{STATUS_LABEL[task.status]}</span></td>
                            <td style={{ ...(i % 2 === 0 ? S.tdR : { ...S.tdR, background: '#faf5ff' }) }}>{task.estimatedHours || '—'}</td>
                            <td style={{ ...(i % 2 === 0 ? S.tdR : { ...S.tdR, background: '#faf5ff' }) }}>{task.actualHours}</td>
                            <td style={i % 2 === 0 ? S.td : S.tdAlt}>{formatDate(task.dueDate) || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </>
          )}

          {/* フェーズなしタスク */}
          {project.unphasedTasks.length > 0 && (
            <>
              <div style={S.section}><span style={{ fontSize: 16 }}>📌</span><span style={S.sectionTxt}>その他のタスク</span></div>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>タスク名</th>
                    <th style={S.th}>担当者</th>
                    <th style={S.th}>ステータス</th>
                    <th style={S.thR}>見積(h)</th>
                    <th style={S.thR}>実績(h)</th>
                    <th style={S.th}>期日</th>
                  </tr>
                </thead>
                <tbody>
                  {project.unphasedTasks.map((task, i) => (
                    <tr key={task.id}>
                      <td style={i % 2 === 0 ? S.td : S.tdAlt}>{task.name}</td>
                      <td style={i % 2 === 0 ? S.td : S.tdAlt}>{task.assignees?.join(', ') || '—'}</td>
                      <td style={i % 2 === 0 ? S.td : S.tdAlt}><span style={S.badge(task.status)}>{STATUS_LABEL[task.status]}</span></td>
                      <td style={{ ...(i % 2 === 0 ? S.tdR : { ...S.tdR, background: '#faf5ff' }) }}>{task.estimatedHours || '—'}</td>
                      <td style={{ ...(i % 2 === 0 ? S.tdR : { ...S.tdR, background: '#faf5ff' }) }}>{task.actualHours}</td>
                      <td style={i % 2 === 0 ? S.td : S.tdAlt}>{formatDate(task.dueDate) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* フッター */}
          <div style={S.footer}>
            工数計算ツール ／ 出力日時：{format(new Date(), 'yyyy年MM月dd日 HH:mm')}
          </div>
        </div>
      </div>
    </div>
  )
}
