import { format, differenceInCalendarDays, parseISO, isValid } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { AlertLevel } from '../types'

export const today = (): string => format(new Date(), 'yyyy-MM-dd')

export const formatDate = (iso: string): string => {
  if (!iso) return '—'
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'yyyy/MM/dd', { locale: ja }) : '—'
}

export const formatDateShort = (iso: string): string => {
  if (!iso) return '—'
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'M/d', { locale: ja }) : '—'
}

export const remainingDays = (dueDateIso: string): number | null => {
  if (!dueDateIso) return null
  const d = parseISO(dueDateIso)
  if (!isValid(d)) return null
  return differenceInCalendarDays(d, new Date())
}

export const alertLevel = (dueDateIso: string): AlertLevel => {
  const days = remainingDays(dueDateIso)
  if (days === null) return 'none'
  if (days < 0)  return 'danger'
  if (days <= 3) return 'warning'
  return 'none'
}

export const nowIso = (): string => new Date().toISOString()
