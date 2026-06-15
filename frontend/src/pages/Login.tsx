import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GraduationCap, Mail, Lock, Eye, EyeOff, BookOpen, BarChart3, Users, Shield, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// ─── Schemas ──────────────────────────────────────────────────
const signInSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

const signUpSchema = z.object({
  email:           z.string().email('Enter a valid email address'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignInData = z.infer<typeof signInSchema>
type SignUpData = z.infer<typeof signUpSchema>
type Mode = 'signin' | 'signup'

// ─── Left branding panel ──────────────────────────────────────
const features = [
  { icon: BookOpen,  text: 'Full Learning Management System with course materials' },
  { icon: BarChart3, text: 'Real-time grades, GPA tracker, and attendance' },
  { icon: Users,     text: 'Forums, messaging, and campus event management' },
  { icon: Shield,    text: 'Secure fee payments and document requests' },
]

function BrandingPanel() {
  return (
    <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-16 left-16 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-24 right-8 w-96 h-96 bg-brand-400 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
          <GraduationCap size={22} className="text-white" />
        </div>
        <span className="text-white font-bold text-xl tracking-tight">NextEdge</span>
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Your Gateway to<br />
            <span className="text-brand-300">Academic Excellence</span>
          </h1>
          <p className="mt-4 text-slate-300 text-lg leading-relaxed max-w-md">
            Everything you need to manage your academic journey — from grades to events — in one place.
          </p>
        </div>
        <ul className="space-y-4">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-brand-300" />
              </div>
              <span className="text-slate-300 text-sm">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 border-l-2 border-brand-400 pl-4">
        <p className="text-slate-300 text-sm italic">
          "NextEdge has transformed how I manage my studies. Everything I need is right here."
        </p>
        <cite className="mt-2 block text-xs text-slate-500 not-italic">— Student, Computer Science '24</cite>
      </div>
    </div>
  )
}

// ─── Google button ─────────────────────────────────────────────
function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-medium text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )}
      Continue with Google
    </button>
  )
}

// ─── Divider ───────────────────────────────────────────────────
function Divider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs text-slate-400 font-medium">or continue with email</span>
      </div>
    </div>
  )
}

// ─── Password field with show/hide ────────────────────────────
function PasswordInput({ id, placeholder, registration, error }: {
  id: string
  placeholder: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any
  error?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <div className="relative">
        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          className="input pl-10 pr-10"
          {...registration}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Verification sent screen ─────────────────────────────────
function VerificationSent({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail size={30} className="text-brand-600" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Check your inbox</h2>
      <p className="mt-2 text-slate-500 text-sm leading-relaxed">
        We sent a verification link to<br />
        <span className="font-semibold text-slate-700">{email}</span>
      </p>
      <div className="mt-5 p-4 bg-brand-50 rounded-xl text-left space-y-2">
        <p className="text-xs text-brand-800 font-semibold">Next steps:</p>
        <ol className="text-xs text-brand-700 space-y-1 list-decimal list-inside">
          <li>Open the email from NextEdge</li>
          <li>Click the "Verify email" link</li>
          <li>Come back here and sign in</li>
        </ol>
      </div>
      <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
        <CheckCircle2 size={13} className="text-emerald-500" />
        Didn't receive it? Check your spam folder.
      </div>
      <button
        onClick={onBack}
        className="mt-6 flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium mx-auto"
      >
        <ArrowLeft size={14} /> Back to Sign In
      </button>
    </div>
  )
}

// ─── Main Login page ──────────────────────────────────────────
export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null)

  const signInForm = useForm<SignInData>({ resolver: zodResolver(signInSchema) })
  const signUpForm = useForm<SignUpData>({ resolver: zodResolver(signUpSchema) })

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    signInForm.clearErrors()
    signUpForm.clearErrors()
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError('')
    await signInWithGoogle()
    setGoogleLoading(false)
  }

  async function onSignIn(data: SignInData) {
    setSubmitLoading(true)
    setError('')
    const { error: err } = await signInWithEmail(data.email, data.password)
    if (err) setError(err)
    setSubmitLoading(false)
  }

  async function onSignUp(data: SignUpData) {
    setSubmitLoading(true)
    setError('')
    const { error: err, needsVerification } = await signUpWithEmail(data.email, data.password)
    if (err) {
      setError(err)
    } else if (needsVerification) {
      setVerificationEmail(data.email)
    }
    // If needsVerification is false, Supabase auto-confirmed → auth state change handles redirect
    setSubmitLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      <BrandingPanel />

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="text-slate-900 font-bold text-xl">NextEdge</span>
          </div>

          {/* Verification email sent state */}
          {verificationEmail ? (
            <VerificationSent
              email={verificationEmail}
              onBack={() => { setVerificationEmail(null); switchMode('signin') }}
            />
          ) : (
            <>
              {/* Mode tabs */}
              <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                <button
                  onClick={() => switchMode('signin')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    mode === 'signin'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => switchMode('signup')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Google button */}
              <GoogleButton onClick={handleGoogleSignIn} loading={googleLoading} />

              <Divider />

              {/* ── Sign In Form ── */}
              {mode === 'signin' && (
                <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="si-email" className="label">Email address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="si-email"
                        type="email"
                        placeholder="you@example.com"
                        className="input pl-10"
                        autoComplete="email"
                        {...signInForm.register('email')}
                      />
                    </div>
                    {signInForm.formState.errors.email && (
                      <p className="mt-1 text-xs text-red-500">{signInForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="si-password" className="label">Password</label>
                    <PasswordInput
                      id="si-password"
                      placeholder="Enter your password"
                      registration={signInForm.register('password')}
                      error={signInForm.formState.errors.password?.message}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="btn-primary w-full py-3 text-sm"
                  >
                    {submitLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : 'Sign In'}
                  </button>

                  <p className="text-center text-xs text-slate-500 pt-1">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="text-brand-600 font-medium hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                </form>
              )}

              {/* ── Sign Up Form ── */}
              {mode === 'signup' && (
                <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="su-email" className="label">Email address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="su-email"
                        type="email"
                        placeholder="you@example.com"
                        className="input pl-10"
                        autoComplete="email"
                        {...signUpForm.register('email')}
                      />
                    </div>
                    {signUpForm.formState.errors.email && (
                      <p className="mt-1 text-xs text-red-500">{signUpForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="su-password" className="label">Password</label>
                    <PasswordInput
                      id="su-password"
                      placeholder="At least 8 characters"
                      registration={signUpForm.register('password')}
                      error={signUpForm.formState.errors.password?.message}
                    />
                  </div>

                  <div>
                    <label htmlFor="su-confirm" className="label">Confirm password</label>
                    <PasswordInput
                      id="su-confirm"
                      placeholder="Repeat your password"
                      registration={signUpForm.register('confirmPassword')}
                      error={signUpForm.formState.errors.confirmPassword?.message}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="btn-primary w-full py-3 text-sm"
                  >
                    {submitLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : 'Create Account'}
                  </button>

                  <div className="text-xs text-slate-400 text-center leading-relaxed pt-1">
                    By signing up you agree to our{' '}
                    <a href="#" className="text-brand-600 hover:underline">Terms</a>{' '}
                    and{' '}
                    <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>
                  </div>

                  <p className="text-center text-xs text-slate-500">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="text-brand-600 font-medium hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
