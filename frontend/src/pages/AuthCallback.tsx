import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { XCircle } from 'lucide-react'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function handleCallback() {
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')
      const errorParam = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Handle error from Supabase (e.g. expired link)
      if (errorParam) {
        setErrorMsg(errorDescription ?? 'Verification failed. The link may have expired.')
        setStatus('error')
        return
      }

      // PKCE flow: exchange the code for a session
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setErrorMsg(error.message)
          setStatus('error')
          return
        }
        navigate('/', { replace: true })
        return
      }

      // Implicit flow: tokens are in the URL hash — getSession picks them up
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        navigate('/', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 px-4">
        <div className="card p-8 max-w-sm w-full text-center">
          <XCircle size={40} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Verification Failed</h2>
          <p className="text-sm text-slate-500 mb-5">{errorMsg}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="btn-primary w-full"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <LoadingSpinner size="lg" />
      <p className="text-slate-600 text-sm">Verifying your account...</p>
    </div>
  )
}
