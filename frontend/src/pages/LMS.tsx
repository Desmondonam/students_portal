import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Video, FileText, Link2, ClipboardList, BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import type { Enrollment, Course, CourseMaterial } from '../types'

const typeConfig: Record<string, { icon: LucideIcon, label: string, color: string }> = {
  video:      { icon: Video,         label: 'Video',      color: 'text-red-500 bg-red-50' },
  document:   { icon: FileText,      label: 'Document',   color: 'text-blue-600 bg-blue-50' },
  link:       { icon: Link2,         label: 'Resource',   color: 'text-purple-600 bg-purple-50' },
  assignment: { icon: ClipboardList, label: 'Assignment', color: 'text-amber-600 bg-amber-50' },
}

function CourseCard({ enrollment }: { enrollment: Enrollment & { course: Course } }) {
  const [expanded, setExpanded] = useState(false)

  const { data: materials, isLoading } = useQuery<CourseMaterial[]>({
    queryKey: ['materials', enrollment.course_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', enrollment.course_id)
        .order('week_number', { ascending: true })
        .order('order_index', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: expanded,
  })

  // Group by week
  const byWeek = materials?.reduce<Record<number, CourseMaterial[]>>((acc, m) => {
    const week = m.week_number ?? 0
    if (!acc[week]) acc[week] = []
    acc[week].push(m)
    return acc
  }, {}) ?? {}

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors"
      >
        <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <BookOpen size={22} className="text-brand-700" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-slate-900">{enrollment.course.name}</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {enrollment.course.code} · {enrollment.course.credits} credits
            {enrollment.course.instructor && ` · ${enrollment.course.instructor}`}
          </p>
        </div>
        <Badge variant="success">Active</Badge>
        {expanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="border-t border-slate-100">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : Object.keys(byWeek).length > 0 ? (
            <div className="divide-y divide-slate-50">
              {Object.entries(byWeek).map(([week, mats]) => (
                <div key={week} className="px-5 py-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    {parseInt(week) === 0 ? 'General Resources' : `Week ${week}`}
                  </h4>
                  <ul className="space-y-2">
                    {mats.map((mat) => {
                      const cfg = typeConfig[mat.material_type] ?? typeConfig.document
                      const Icon = cfg.icon
                      return (
                        <li key={mat.id}>
                          <a
                            href={mat.content_url ?? '#'}
                            target={mat.content_url ? '_blank' : undefined}
                            rel="noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color}`}>
                              <Icon size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 group-hover:text-brand-600 truncate">
                                {mat.title}
                              </p>
                              {mat.description && (
                                <p className="text-xs text-slate-400 truncate">{mat.description}</p>
                              )}
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <FileText size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No course materials yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function LMS() {
  const { user } = useAuth()

  const { data: enrollments, isLoading } = useQuery<(Enrollment & { course: Course })[]>({
    queryKey: ['enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, course:courses(*)')
        .eq('student_id', user!.id)
        .eq('status', 'active')
      if (error) throw error
      return (data ?? []) as (Enrollment & { course: Course })[]
    },
    enabled: !!user?.id,
  })

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
        <h1 className="page-title">Learning Management System</h1>
        <p className="text-slate-500 text-sm mt-1">Access your course materials, videos, and assignments</p>
      </div>

      {enrollments && enrollments.length > 0 ? (
        <div className="space-y-4">
          {enrollments.map((e) => (
            <CourseCard key={e.id} enrollment={e} />
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <BookOpen size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No courses enrolled</p>
          <p className="text-sm text-slate-400 mt-1">Contact admin to enroll in courses.</p>
        </div>
      )}
    </div>
  )
}
