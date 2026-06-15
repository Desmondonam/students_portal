import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const personalSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  phone: z.string().min(6, 'Phone number is required'),
  country: z.string().min(2, 'Country is required'),
})

const academicSchema = z.object({
  student_id: z.string().min(2, 'Student ID is required'),
  course_name: z.string().min(2, 'Course name is required'),
  year_of_study: z.string().min(1, 'Year of study is required'),
})

type PersonalData = z.infer<typeof personalSchema>
type AcademicData = z.infer<typeof academicSchema>

const COUNTRIES = [
  'Ghana', 'Nigeria', 'Kenya', 'South Africa', 'Tanzania', 'Uganda', 'Rwanda',
  'Ethiopia', 'Egypt', 'Morocco', 'United States', 'United Kingdom', 'Canada',
  'India', 'Other',
]

const COURSES = [
  'Computer Science', 'Information Technology', 'Business Administration',
  'Accounting & Finance', 'Engineering (Civil)', 'Engineering (Electrical)',
  'Medicine & Surgery', 'Nursing', 'Education', 'Law', 'Economics',
  'Architecture', 'Agriculture', 'Other',
]

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [personalData, setPersonalData] = useState<PersonalData | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const personalForm = useForm<PersonalData>({ resolver: zodResolver(personalSchema) })
  const academicForm = useForm<AcademicData>({ resolver: zodResolver(academicSchema) })

  function onPersonalSubmit(data: PersonalData) {
    setPersonalData(data)
    setStep(2)
  }

  async function onAcademicSubmit(data: AcademicData) {
    if (!user || !personalData) return
    setSaving(true)
    setError('')

    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email ?? '',
      ...personalData,
      ...data,
      year_of_study: parseInt(data.year_of_study),
      is_profile_complete: true,
      updated_at: new Date().toISOString(),
    })

    if (upsertError) {
      setError(upsertError.message)
      setSaving(false)
      return
    }

    await refreshProfile()
    setStep(3)
    setTimeout(() => navigate('/dashboard', { replace: true }), 1800)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-slate-900 font-bold text-xl">NextEdge</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Complete Your Profile</h1>
          <p className="mt-1 text-slate-500 text-sm">Step {Math.min(step, 2)} of 2 — {step === 1 ? 'Personal Information' : 'Academic Details'}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-brand-600' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <form onSubmit={personalForm.handleSubmit(onPersonalSubmit)} className="card p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full Name *</label>
                <input {...personalForm.register('full_name')} className="input" placeholder="John Doe" />
                {personalForm.formState.errors.full_name && (
                  <p className="mt-1 text-xs text-red-500">{personalForm.formState.errors.full_name.message}</p>
                )}
              </div>
              <div>
                <label className="label">Date of Birth *</label>
                <input {...personalForm.register('date_of_birth')} type="date" className="input" />
                {personalForm.formState.errors.date_of_birth && (
                  <p className="mt-1 text-xs text-red-500">{personalForm.formState.errors.date_of_birth.message}</p>
                )}
              </div>
              <div>
                <label className="label">Gender *</label>
                <select {...personalForm.register('gender')} className="input">
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                {personalForm.formState.errors.gender && (
                  <p className="mt-1 text-xs text-red-500">{personalForm.formState.errors.gender.message}</p>
                )}
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input {...personalForm.register('phone')} className="input" placeholder="+1 234 567 8900" />
                {personalForm.formState.errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{personalForm.formState.errors.phone.message}</p>
                )}
              </div>
              <div>
                <label className="label">Country *</label>
                <select {...personalForm.register('country')} className="input">
                  <option value="">Select country...</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {personalForm.formState.errors.country && (
                  <p className="mt-1 text-xs text-red-500">{personalForm.formState.errors.country.message}</p>
                )}
              </div>
            </div>
            <button type="submit" className="btn-primary w-full mt-2">
              Continue <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Step 2: Academic Info */}
        {step === 2 && (
          <form onSubmit={academicForm.handleSubmit(onAcademicSubmit)} className="card p-6 space-y-4">
            <div>
              <label className="label">Student ID *</label>
              <input {...academicForm.register('student_id')} className="input" placeholder="e.g. STU/2024/001" />
              {academicForm.formState.errors.student_id && (
                <p className="mt-1 text-xs text-red-500">{academicForm.formState.errors.student_id.message}</p>
              )}
            </div>
            <div>
              <label className="label">Course / Programme *</label>
              <select {...academicForm.register('course_name')} className="input">
                <option value="">Select your programme...</option>
                {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {academicForm.formState.errors.course_name && (
                <p className="mt-1 text-xs text-red-500">{academicForm.formState.errors.course_name.message}</p>
              )}
            </div>
            <div>
              <label className="label">Year of Study *</label>
              <select {...academicForm.register('year_of_study')} className="input">
                <option value="">Select year...</option>
                {[1, 2, 3, 4, 5, 6].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
              {academicForm.formState.errors.year_of_study && (
                <p className="mt-1 text-xs text-red-500">{academicForm.formState.errors.year_of_study.message}</p>
              )}
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving...' : 'Complete Setup'} <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Profile Complete!</h2>
            <p className="mt-2 text-slate-500 text-sm">Welcome to NextEdge. Redirecting to your dashboard...</p>
          </div>
        )}
      </div>
    </div>
  )
}
