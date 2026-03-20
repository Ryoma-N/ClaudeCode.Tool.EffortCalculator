import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, Plus, Trash2, Lightbulb } from 'lucide-react'
import { useAppStore, nextColor } from '../stores/appStore'

// よく使われる工程テンプレート
const PRESETS = [
  {
    label: 'IT開発（標準）',
    items: ['要件定義', '設計', '実装', 'レビュー', 'テスト'],
  },
  {
    label: 'シンプル',
    items: ['作業', '確認・修正'],
  },
  {
    label: 'コンサル・事務',
    items: ['調査・分析', '資料作成', '打ち合わせ', '報告・提出'],
  },
]

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const { projects, processDefinitions, workEntries, addProcess, updateProcess, deleteProcess } = useAppStore()

  const [newProcessName, setNewProcessName] = useState('')

  const project  = projects.find(p => p.id === id)
  const processes = processDefinitions.filter(p => p.projectId === id).sort((a, b) => a.order - b.order)

  if (!project) return <div className="p-6 text-ink-muted">プロジェクトが見つかりません</div>

  const handleAddProcess = async (name?: string) => {
    const pname = (name ?? newProcessName).trim()
    if (!pname) return
    // 既に同名があればスキップ
    if (processes.some(p => p.name === pname)) return
    const color = nextColor(processes.map(p => p.color))
    await addProcess({ projectId: id!, name: pname, order: processes.length, color })
    if (!name) setNewProcessName('')
  }

  const handleApplyPreset = async (items: string[]) => {
    if (processes.length > 0) {
      if (!confirm('現在の工程をすべて削除してプリセットを適用しますか？')) return
      for (const p of processes) await deleteProcess(p.id)
    }
    for (let i = 0; i < items.length; i++) {
      const color = nextColor(
        Array.from({ length: i }, (_, j) => processes[j]?.color ?? '').filter(Boolean)
      )
      await addProcess({ projectId: id!, name: items[i], order: i, color })
    }
  }

  const handleDeleteProcess = async (pid: string) => {
    const count = workEntries.filter(e => e.processId === pid).length
    const msg = count > 0
      ? `この工程には${count}件の実績記録があります。削除しますか？`
      : 'この工程を削除しますか？'
    if (!confirm(msg)) return
    await deleteProcess(pid)
  }

  const field = 'bg-surface-raised border border-edge rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand'

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6 fade-in">
      <div className="flex items-center gap-2">
        <Link to={`/projects/${id}`} className="p-1 rounded-lg hover:bg-surface-raised text-ink-muted">
          <ChevronLeft size={18} />
        </Link>
        <div>
          <p className="text-xs text-ink-subtle">{project.name}</p>
          <h1 className="text-xl font-bold text-ink">プロジェクト設定</h1>
        </div>
      </div>

      {/* 工程定義 */}
      <div className="bg-surface rounded-xl border border-edge p-4 space-y-4">
        <div>
          <h2 className="font-semibold text-ink text-sm">作業の種類（工程）を設定する</h2>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            各タスクに対して「どの種類の作業に何時間かかったか」を記録するための分類です。<br />
            例えば「設計に2時間、実装に5時間」のように記録できるようになります。
          </p>
        </div>

        {/* プリセット */}
        <div className="bg-surface-raised rounded-lg p-3 border border-edge">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb size={13} className="text-warn" />
            <span className="text-xs font-medium text-ink-muted">よく使うテンプレートから始める</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(preset => (
              <button
                key={preset.label}
                onClick={() => handleApplyPreset(preset.items)}
                className="text-xs bg-surface-high border border-edge rounded-lg px-3 py-1.5 text-ink hover:border-brand hover:text-brand transition-colors"
              >
                {preset.label}
                <span className="text-ink-subtle ml-1">({preset.items.join(' / ')})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 登録済み工程一覧 */}
        <div className="space-y-2">
          {processes.length === 0 ? (
            <p className="text-xs text-ink-subtle py-2 text-center">
              工程がまだありません。上のテンプレートを使うか、下から追加してください。
            </p>
          ) : (
            processes.map((proc) => {
              const entryCount = workEntries.filter(e => e.processId === proc.id).length
              return (
                <div key={proc.id} className="flex items-center gap-3 bg-surface-raised rounded-lg px-3 py-2.5 border border-edge">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: proc.color }} />
                  <input
                    defaultValue={proc.name}
                    onBlur={e => { if (e.target.value.trim()) updateProcess(proc.id, { name: e.target.value.trim() }) }}
                    className="flex-1 bg-transparent text-sm text-ink focus:outline-none"
                  />
                  {entryCount > 0 && (
                    <span className="text-xs text-ink-subtle">{entryCount}件の記録</span>
                  )}
                  <button
                    onClick={() => handleDeleteProcess(proc.id)}
                    className="p-1 rounded text-ink-subtle hover:text-danger transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* 工程を追加 */}
        <div className="flex gap-2">
          <input
            value={newProcessName}
            onChange={e => setNewProcessName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddProcess() }}
            className={`${field} flex-1`}
            placeholder="工程名を入力（例：打ち合わせ）"
          />
          <button
            onClick={() => handleAddProcess()}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand/80 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus size={15} /> 追加
          </button>
        </div>
      </div>

      {/* プロジェクト情報 */}
      <div className="bg-surface rounded-xl border border-edge p-4 space-y-3">
        <h2 className="font-semibold text-ink text-sm">プロジェクト情報</h2>
        <div className="text-sm text-ink-muted space-y-1.5">
          <div className="flex justify-between">
            <span>1人日あたりの作業時間</span>
            <span className="text-ink">{project.mdHours}時間</span>
          </div>
          <div className="flex justify-between">
            <span>1人月あたりの営業日数</span>
            <span className="text-ink">{project.mmDays ?? 20}日（1人月 = {(project.mmDays ?? 20) * project.mdHours}h）</span>
          </div>
          <div className="flex justify-between">
            <span>ステータス</span>
            <span className="text-ink">
              {{ active: '進行中', completed: '完了', archived: 'アーカイブ' }[project.status]}
            </span>
          </div>
        </div>
        <Link to={`/projects/${id}`} className="block text-center text-sm text-brand hover:underline pt-1">
          プロジェクト詳細に戻る
        </Link>
      </div>
    </div>
  )
}
