import { useQuery } from '@tanstack/react-query'
import { BookOpen, CalendarCheck, CreditCard, CalendarDays, TrendingUp, Clock, Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import StatCard from '../components/ui/StatCard'
import { format } from 'date-fns'
import type { Grade, AttendanceRecord, FeeBalance, Event, Enrollment } from '../types'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const uid = user?.id

  const { data: enrollments } = useQuery<Enrollment[]>({
    queryKey: ['enrollments', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, course:courses(*)')
        .eq('student_id', uid!)
        .eq('status', 'active')
      if (error) throw error
      return data ?? []
    },
    enabled: !!uid,
  })

  const { data: grades } = useQuery<Grade[]>({
    queryKey: ['grades-recent', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grades')
        .select('*, course:courses(name, code)')
        .eq('student_id', uid!)
        .order('graded_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data ?? []
    },
    enabled: !!uid,
  })

  const { data: attendance } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance-recent', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', uid!)
        .order('date', { ascending: false })
        .limit(30)
      if (error) throw error
      return data ?? []
    },
    enabled: !!uid,
  })

  const { data: feeBalance } = useQuery<FeeBalance | null>({
    queryKey: ['fee-balance', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_balances')
        .select('*')
        .eq('student_id', uid!)
        .single()
      if (error) return null
      return data
    },
    enabled: !!uid,
  })

  const { data: upcomingEvents } = useQuery<Event[]>({
    queryKey: ['events-upcoming'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(3)
      if (error) throw error
      return data ?? []
    },
  })

  const attendanceRate = attendance && attendance.length > 0
    ? Math.round((attendance.filter(a => a.status === 'present' || a.status === 'late').length / attendance.length) * 100)
    : 0

  const avgGrade = grades && grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0) / grades.length)
    : 0

  const gradeToLetter = (pct: number) => {
    if (pct >= 90) return 'A'
    if (pct >= 80) return 'B+'
    if (pct >= 70) return 'B'
    if (pct >= 60) return 'C'
    return 'F'
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="page-title">{greeting}, {profile?.full_name?.split(' ')[0] ?? 'Student'} 👋</h1>
        <p className="text-slate-500 text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} · {enrollments?.length ?? 0} active course{enrollments?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Average Grade"
          value={grades?.length ? `${avgGrade}%` : '—'}
          subtitle={grades?.length ? gradeToLetter(avgGrade) : 'No grades yet'}
          icon={TrendingUp}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
        />
        <StatCard
          title="Attendance Rate"
          value={attendance?.length ? `${attendanceRate}%` : '—'}
          subtitle="Last 30 records"
          icon={CalendarCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Fee Balance"
          value={feeBalance ? `$${feeBalance.balance.toLocaleString()}` : '—'}
          subtitle={feeBalance?.due_date ? `Due ${format(new Date(feeBalance.due_date), 'MMM d')}` : 'No balance data'}
          icon={CreditCard}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Active Courses"
          value={enrollments?.length ?? 0}
          subtitle="This semester"
          icon={BookOpen}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent grades */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Grades</h2>
            <a href="/grades" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all</a>
          </div>
          {grades && grades.length > 0 ? (
            <div className="space-y-3">
              {grades.map((g) => {
                const pct = Math.round((g.score / g.max_score) * 100)
                return (
                  <div key={g.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{g.assignment_name}</p>
                      <p className="text-xs text-slate-500 truncate">{(g.course as {name?: string})?.name} · {g.grade_type}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-slate-900">{g.score}/{g.max_score}</p>
                      <p className={`text-xs font-medium ${pct >= 70 ? 'text-emerald-600' : 'text-red-500'}`}>{pct}%</p>
                    </div>
                    <div className="w-16 bg-slate-100 rounded-full h-1.5 flex-shrink-0">
                      <div
                        className={`h-1.5 rounded-full ${pct >= 70 ? 'bg-emerald-500' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No grades recorded yet</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Enrolled courses */}
          <div className="card p-5">
            <h2 className="section-title mb-3">My Courses</h2>
            {enrollments && enrollments.length > 0 ? (
              <ul className="space-y-2.5">
                {enrollments.map((e) => (
                  <li key={e.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen size={14} className="text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{(e.course as {name?: string})?.name}</p>
                      <p className="text-xs text-slate-500">{(e.course as {code?: string})?.code}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No active enrollments</p>
            )}
          </div>

          {/* Upcoming events */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">Upcoming Events</h2>
              <a href="/events" className="text-xs text-brand-600 font-medium">See all</a>
            </div>
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <ul className="space-y-3">
                {upcomingEvents.map((ev) => (
                  <li key={ev.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-10 text-center">
                      <p className="text-xs font-bold text-brand-600 uppercase">{format(new Date(ev.event_date), 'MMM')}</p>
                      <p className="text-lg font-bold text-slate-900 leading-none">{format(new Date(ev.event_date), 'd')}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{ev.title}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={10} /> {format(new Date(ev.event_date), 'h:mm a')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 text-slate-400">
                <CalendarDays size={28} className="mx-auto mb-1.5 opacity-40" />
                <p className="text-xs">No upcoming events</p>
              </div>
            )}
          </div>

          {/* Quick notification */}
          {feeBalance && feeBalance.balance > 0 && (
            <div className="card p-4 border-amber-200 bg-amber-50">
              <div className="flex gap-2.5">
                <Bell size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Fee Balance Outstanding</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    You have ${feeBalance.balance.toLocaleString()} due.{' '}
                    <a href="/finance" className="underline">Pay now</a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
