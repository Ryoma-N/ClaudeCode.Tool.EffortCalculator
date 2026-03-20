import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { formatDateShort, remainingDays } from '../../utils/dateUtils'
import { differenceInCalendarDays, parseISO, isValid } from 'date-fns'

export default function AlertSection() {
  const tasks = useAppStore(s => s.tasks)

  const { overdue, soon } = useMemo(() => {
    const today = new Date()
    const active = tasks.filter(t => t.status !== 'done' && t.dueDate)
    const overdue: typeof tasks = []
    const soon:    typeof tasks = []
    for (const t of active) {
      const d = parseISO(t.dueDate)
      if (!isValid(d)) continue
      const diff = differenceInCalendarDays(d, today)
      if (diff < 0)          overdue.push(t)
      else if (diff <= 3)    soon.push(t)
    }
    return { overdue, soon }
  }, [tasks])

  if (!overdue.length && !soon.length) return null

  return (
    <div className="space-y-2">
      {overdue.length > 0 && (
        <div className="bg-danger bg-opacity-10 border border-danger border-opacity-30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-danger font-semibold text-sm mb-2">
            <AlertTriangle size={15} />
            期限超過 {overdue.length}件
          </div>
          <ul className="space-y-1">
            {overdue.map(t => (
              <li key={t.id}>
                <Link to={`/tasks/${t.id}`} className="text-sm text-ink hover:text-danger transition-colors flex justify-between">
                  <span className="truncate">{t.name}</span>
                  <span className="text-danger ml-2 shrink-0">{Math.abs(remainingDays(t.dueDate) ?? 0)}日超過</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {soon.length > 0 && (
        <div className="bg-warn bg-opacity-10 border border-warn border-opacity-30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-warn font-semibold text-sm mb-2">
            <Clock size={15} />
            3日以内に期限 {soon.length}件
          </div>
          <ul className="space-y-1">
            {soon.map(t => (
              <li key={t.id}>
                <Link to={`/tasks/${t.id}`} className="text-sm text-ink hover:text-warn transition-colors flex justify-between">
                  <span className="truncate">{t.name}</span>
                  <span className="text-warn ml-2 shrink-0">{formatDateShort(t.dueDate)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
