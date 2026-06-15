import { Menu, Bell, ChevronDown, LogOut, User } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface Props {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: Props) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'Student'
  const avatarLetter = displayName.charAt(0).toUpperCase()
  const avatarUrl = profile?.profile_picture_url ?? user?.user_metadata?.avatar_url

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 lg:flex-none" />

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-semibold">
                {avatarLetter}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-900 leading-none">{displayName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{profile?.student_id ?? 'Student'}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1 overflow-hidden">
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/dashboard') }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <User size={16} />
                  My Profile
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
