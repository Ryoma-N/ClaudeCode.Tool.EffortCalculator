import { X } from 'lucide-react'
import { useEffect } from 'react'

interface Props {
  title:    string
  children: React.ReactNode
  onClose:  () => void
}

export default function Modal({ title, children, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface border border-edge rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
