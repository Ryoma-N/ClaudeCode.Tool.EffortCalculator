interface Props {
  progress:       number   // 0–100 or NaN (加重平均進捗率)
  estimatedHours: number
  actualHours:    number
  earnedHours:    number   // 出来高
  variance:       number   // 乖離 = 実績 - 出来高
  mdHours:        number
}

const mdLabel = (hours: number, mdHours: number): string | null => {
  if (!hours || !mdHours) return null
  return `${(hours / mdHours).toFixed(1)}人日`
}

export default function ProjectProgressBar({ progress, estimatedHours, actualHours, earnedHours, variance, mdHours }: Props) {
  const pct      = isNaN(progress) ? 0 : Math.min(progress, 100)
  // 消化率（実績/見積）— バジェット消化の参考値
  const burnPct  = estimatedHours > 0 ? Math.min(Math.round(actualHours / estimatedHours * 100), 100) : 0

  const estMd = mdLabel(estimatedHours, mdHours)
  const actMd = mdLabel(actualHours, mdHours)
  const evMd  = mdLabel(earnedHours, mdHours)

  const varSign = variance > 0 ? '+' : ''
  const varColor = variance > 0 ? 'text-danger' : variance < 0 ? 'text-ok' : 'text-ink-muted'
  const varMd = mdHours > 0 ? ` (${varSign}${(variance / mdHours).toFixed(1)}人日)` : ''

  return (
    <div className="space-y-3">
      {/* 見積 / 実績 行 */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-ink-subtle mb-0.5">見積工数</p>
          <p className="font-semibold text-ink">
            {estimatedHours > 0 ? `${estimatedHours}h` : '未設定'}
            {estMd && <span className="text-ink-muted font-normal"> / {estMd}</span>}
          </p>
        </div>
        <div>
          <p className="text-ink-subtle mb-0.5">出来高</p>
          <p className="font-semibold text-ink">
            {estimatedHours > 0 ? `${earnedHours.toFixed(1)}h` : '—'}
            {evMd && <span className="text-ink-muted font-normal"> / {evMd}</span>}
          </p>
        </div>
        <div>
          <p className="text-ink-subtle mb-0.5">実績工数</p>
          <p className="font-semibold text-ink">
            {actualHours > 0 ? `${actualHours}h` : '0h'}
            {actMd && <span className="text-ink-muted font-normal"> / {actMd}</span>}
          </p>
        </div>
      </div>

      {/* 進捗率バー */}
      <div>
        <div className="flex justify-between text-xs text-ink-muted mb-1">
          <span>進捗率</span>
          <span className="font-semibold text-ink">
            {isNaN(progress) ? '（見積未設定）' : `${progress}%`}
          </span>
        </div>
        <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-ok' : pct >= 80 ? 'bg-warn' : 'bg-brand'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* 工数消化率バー（薄め） */}
      {estimatedHours > 0 && (
        <div>
          <div className="flex justify-between text-xs text-ink-muted mb-1">
            <span>工数消化率</span>
            <span>{burnPct}%</span>
          </div>
          <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${burnPct >= 100 ? 'bg-danger' : burnPct >= 80 ? 'bg-warn' : 'bg-surface-high'}`}
              style={{ width: `${burnPct}%` }}
            />
          </div>
        </div>
      )}

      {/* 乖離 */}
      {estimatedHours > 0 && (actualHours > 0 || earnedHours > 0) && (
        <div className="flex justify-between text-xs pt-1 border-t border-edge">
          <span className="text-ink-muted">乖離（実績 − 出来高）</span>
          <span className={`font-semibold ${varColor}`}>
            {varSign}{variance.toFixed(1)}h{varMd}
          </span>
        </div>
      )}
    </div>
  )
}
