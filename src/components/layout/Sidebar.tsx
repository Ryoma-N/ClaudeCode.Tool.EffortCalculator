import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, CalendarDays } from 'lucide-react'

const links = [
  { to: '/',         icon: LayoutDashboard, label: 'ダッシュボード' },
  { to: '/projects', icon: FolderKanban,    label: 'プロジェクト' },
  { to: '/monthly',  icon: CalendarDays,    label: '月次レポート' },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 bg-surface border-r border-edge min-h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-edge">
        <h1 className="text-base font-bold text-brand-light tracking-wide">工数計算ツール</h1>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-3">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand/20 text-brand-light'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-raised'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
