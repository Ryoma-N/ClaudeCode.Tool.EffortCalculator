import { remainingDays, formatDateShort } from '../../utils/dateUtils'

export default function TaskDueBadge({ dueDate }: { dueDate: string }) {
  if (!dueDate) return null
  const days = remainingDays(dueDate)
  if (days === null) return null

  let cls = 'text-ink-subtle'
  let suffix = ''
  if (days < 0)  { cls = 'text-danger';  suffix = ` (${Math.abs(days)}日超過)` }
  else if (days <= 3) { cls = 'text-warn'; suffix = ` (残${days}日)` }
  else { suffix = ` (残${days}日)` }

  return (
    <span className={`text-xs ${cls}`}>
      {formatDateShort(dueDate)}{suffix}
    </span>
  )
}
