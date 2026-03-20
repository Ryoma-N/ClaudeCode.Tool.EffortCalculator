/** Convert hours to man-days */
export const toMd = (hours: number, mdHours: number): string => {
  if (!hours || !mdHours) return '0.0'
  return (hours / mdHours).toFixed(2)
}

/** Compute progress % (0–100). Returns NaN if no estimate. */
export const progress = (actualH: number, estimatedH: number): number => {
  if (!estimatedH) return NaN
  return Math.min(Math.round((actualH / estimatedH) * 100), 999)
}

export const sumHours = (entries: { hours: number }[]): number =>
  entries.reduce((s, e) => s + (e.hours || 0), 0)

/** Returns a display string like "12h / 1.50人日" */
export const hoursLabel = (hours: number, mdHours: number): string =>
  `${hours}h / ${toMd(hours, mdHours)}人日`
