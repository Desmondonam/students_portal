import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Video, CalendarCheck,
  CreditCard, FileText, MessageSquare, Users, CalendarDays,
  GraduationCap, X
} from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Academic',
    items: [
      { to: '/grades',     icon: BookOpen,      label: 'Grades' },
      { to: '/courses',    icon: Video,         label: 'Learning (LMS)' },
      { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    ],
  },
  {
    label: 'Financial & Admin',
    items: [
      { to: '/finance',   icon: CreditCard, label: 'Finance & Fees' },
      { to: '/documents', icon: FileText,   label: 'Documents' },
    ],
  },
  {
    label: 'Community',
    items: [
      { to: '/messages', icon: MessageSquare, label: 'Messages' },
      { to: '/forums',   icon: Users,         label: 'Forums' },
      { to: '/events',   icon: CalendarDays,  label: 'Events' },
    ],
  },
]

export default function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">NextEdge</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-brand-600 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon size={18} />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom version tag */}
        <div className="px-5 py-4 border-t border-slate-700/50">
          <p className="text-xs text-slate-600">NextEdge Portal v1.0</p>
        </div>
      </aside>
    </>
  )
}
