import { useQuery } from '@tanstack/react-query'
import { BookOpen, TrendingUp, Award } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { format } from 'date-fns'
import type { Grade, Course } from '../types'

function gradeLabel(pct: number) {
  if (pct >= 90) return { letter: 'A', variant: 'success' as const }
  if (pct >= 80) return { letter: 'B+', variant: 'success' as const }
  if (pct >= 75) return { letter: 'B', variant: 'info' as const }
  if (pct >= 70) return { letter: 'B-', variant: 'info' as const }
  if (pct >= 60) return { letter: 'C', variant: 'warning' as const }
  if (pct >= 50) return { letter: 'D', variant: 'warning' as const }
  return { letter: 'F', variant: 'danger' as const }
}

export default function Grades() {
  const { user } = useAuth()
  const uid = user?.id

  const { data: grades, isLoading } = useQuery<(Grade & { course: Course })[]>({
    queryKey: ['grades', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grades')
        .select('*, course:courses(*)')
        .eq('student_id', uid!)
        .order('graded_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as (Grade & { course: Course })[]
    },
    enabled: !!uid,
  })

  // Group grades by course
  const byCourse = grades?.reduce<Record<string, { course: Course; grades: Grade[] }>>((acc, g) => {
    if (!acc[g.course_id]) acc[g.course_id] = { course: g.course, grades: [] }
    acc[g.course_id].grades.push(g)
    return acc
  }, {}) ?? {}

  const overallAvg = grades && grades.length > 0
    ? grades.reduce((sum, g) => sum + (g.score / g.max_score) * 100, 0) / grades.length
    : 0

  const gpa = ((overallAvg / 100) * 4).toFixed(2)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Grades</h1>
          <p className="text-slate-500 text-sm mt-1">Your academic performance across all courses</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center">
            <TrendingUp size={22} className="text-brand-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Cumulative GPA</p>
            <p className="text-2xl font-bold text-slate-900">{grades?.length ? gpa : '—'}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Award size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Average Score</p>
            <p className="text-2xl font-bold text-slate-900">
              {grades?.length ? `${overallAvg.toFixed(1)}%` : '—'}
            </p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <BookOpen size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Assessments</p>
            <p className="text-2xl font-bold text-slate-900">{grades?.length ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Grades by course */}
      {Object.values(byCourse).length > 0 ? (
        <div className="space-y-4">
          {Object.values(byCourse).map(({ course, grades: cGrades }) => {
            const avg = cGrades.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / cGrades.length
            const { letter, variant } = gradeLabel(avg)
            return (
              <div key={course.id} className="card overflow-hidden">
                {/* Course header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{course.name}</h3>
                      <Badge variant="info">{course.code}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {course.instructor && `Instructor: ${course.instructor} · `}{cGrades.length} assessment{cGrades.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={variant} size="md">{letter}</Badge>
                    <p className="text-xs text-slate-500 mt-1">{avg.toFixed(1)}% avg</p>
                  </div>
                </div>

                {/* Grade list */}
                <div className="divide-y divide-slate-50">
                  {cGrades.map((g) => {
                    const pct = Math.round((g.score / g.max_score) * 100)
                    const { letter: gl, variant: gv } = gradeLabel(pct)
                    return (
                      <div key={g.id} className="px-5 py-3 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{g.assignment_name}</p>
                          <p className="text-xs text-slate-400 capitalize">{g.grade_type} · {format(new Date(g.graded_at), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="w-32 bg-slate-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-sm font-medium text-slate-700 w-20 text-right">{g.score}/{g.max_score}</p>
                        <Badge variant={gv}>{gl}</Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <BookOpen size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No grades yet</p>
          <p className="text-sm text-slate-400 mt-1">Grades will appear here once your instructors post them.</p>
        </div>
      )}
    </div>
  )
}
