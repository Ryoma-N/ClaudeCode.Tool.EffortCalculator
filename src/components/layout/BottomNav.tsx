import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, CalendarDays } from 'lucide-react'

const links = [
  { to: '/',         icon: LayoutDashboard, label: 'ホーム' },
  { to: '/projects', icon: FolderKanban,    label: 'プロジェクト' },
  { to: '/monthly',  icon: CalendarDays,    label: '月次' },
]

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-edge z-50 flex">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${
              isActive ? 'text-brand-light' : 'text-ink-subtle'
            }`
          }
        >
          <Icon size={20} className="mb-0.5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
