import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { format } from 'date-fns'
import type { AttendanceRecord, Course, Enrollment } from '../types'

const statusConfig = {
  present:  { label: 'Present',  variant: 'success' as const, icon: CheckCircle2, color: 'text-emerald-600' },
  absent:   { label: 'Absent',   variant: 'danger'  as const, icon: XCircle,      color: 'text-red-500' },
  late:     { label: 'Late',     variant: 'warning' as const, icon: Clock,        color: 'text-amber-500' },
  excused:  { label: 'Excused',  variant: 'info'    as const, icon: AlertCircle,  color: 'text-blue-500' },
}

export default function Attendance() {
  const { user } = useAuth()
  const uid = user?.id

  const { data: enrollments } = useQuery<(Enrollment & { course: Course })[]>({
    queryKey: ['enrollments', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, course:courses(*)')
        .eq('student_id', uid!)
        .eq('status', 'active')
      if (error) throw error
      return (data ?? []) as (Enrollment & { course: Course })[]
    },
    enabled: !!uid,
  })

  const { data: records, isLoading } = useQuery<(AttendanceRecord & { course: Course })[]>({
    queryKey: ['attendance', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, course:courses(*)')
        .eq('student_id', uid!)
        .order('date', { ascending: false })
      if (error) throw error
      return (data ?? []) as (AttendanceRecord & { course: Course })[]
    },
    enabled: !!uid,
  })

  // Stats per course
  const courseStats = enrollments?.map((e) => {
    const courseRecords = records?.filter((r) => r.course_id === e.course_id) ?? []
    const total = courseRecords.length
    const present = courseRecords.filter((r) => r.status === 'present' || r.status === 'late').length
    const rate = total > 0 ? Math.round((present / total) * 100) : 0
    return { course: e.course, total, present, rate }
  }) ?? []

  const overallRate = records && records.length > 0
    ? Math.round(records.filter((r) => r.status === 'present' || r.status === 'late').length / records.length * 100)
    : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Attendance</h1>
        <p className="text-slate-500 text-sm mt-1">Track your class attendance across all courses</p>
      </div>

      {/* Overall stat */}
      <div className="card p-5 flex items-center gap-4 bg-gradient-to-r from-brand-600 to-brand-700 text-white border-0">
        <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
          <CalendarCheck size={28} />
        </div>
        <div>
          <p className="text-brand-200 text-sm">Overall Attendance Rate</p>
          <p className="text-4xl font-bold">{records?.length ? `${overallRate}%` : '—'}</p>
          <p className="text-brand-200 text-xs mt-0.5">{records?.length ?? 0} total classes recorded</p>
        </div>
      </div>

      {/* Per-course breakdown */}
      {courseStats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseStats.map(({ course, total, present, rate }) => (
            <div key={course.id} className="card p-4">
              <p className="font-semibold text-slate-900 text-sm truncate">{course.name}</p>
              <p className="text-xs text-slate-500 mb-3">{course.code} · {present}/{total} classes</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      rate >= 75 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className={`text-sm font-semibold ${
                  rate >= 75 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-500' : 'text-red-500'
                }`}>{total > 0 ? `${rate}%` : '—'}</span>
              </div>
              {rate < 75 && total > 0 && (
                <p className="text-xs text-red-500 mt-2">Below 75% threshold — at risk</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Records table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="section-title">Attendance History</h2>
        </div>
        {records && records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {records.map((r) => {
                  const cfg = statusConfig[r.status]
                  const Icon = cfg.icon
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 text-slate-700">{format(new Date(r.date), 'MMM d, yyyy')}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-900 font-medium">{r.course?.name}</p>
                        <p className="text-xs text-slate-400">{r.course?.code}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Icon size={14} className={cfg.color} />
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{r.notes ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <CalendarCheck size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No attendance records found</p>
          </div>
        )}
      </div>
    </div>
  )
}
