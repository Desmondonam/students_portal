import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FileText, Plus, Clock, CheckCircle2, Package, Truck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { format } from 'date-fns'
import type { DocumentRequest } from '../types'

const statusConfig = {
  pending:    { label: 'Pending',    variant: 'warning' as const, icon: Clock },
  processing: { label: 'Processing', variant: 'info'    as const, icon: Package },
  ready:      { label: 'Ready',      variant: 'success' as const, icon: CheckCircle2 },
  delivered:  { label: 'Delivered',  variant: 'default' as const, icon: Truck },
}

const docTypes = [
  { value: 'transcript',  label: 'Academic Transcript', description: 'Official record of all completed courses and grades' },
  { value: 'certificate', label: 'Certificate of Enrollment', description: 'Proof that you are currently enrolled' },
  { value: 'letter',      label: 'Recommendation Letter', description: 'Official letter from the institution' },
]

export default function Documents() {
  const { user } = useAuth()
  const uid = user?.id
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [docType, setDocType] = useState<'transcript' | 'certificate' | 'letter'>('transcript')
  const [reason, setReason] = useState('')

  const { data: requests, isLoading } = useQuery<DocumentRequest[]>({
    queryKey: ['documents', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_requests')
        .select('*')
        .eq('student_id', uid!)
        .order('requested_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!uid,
  })

  const { mutate: submitRequest, isPending: submitting } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('document_requests').insert({
        student_id: uid!,
        document_type: docType,
        reason: reason || null,
        status: 'pending',
        requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', uid] })
      setShowModal(false)
      setReason('')
    },
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Document Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Request official transcripts, certificates, and letters</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> New Request
        </button>
      </div>

      {/* Doc type cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {docTypes.map((dt) => (
          <div key={dt.value} className="card p-5">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mb-3">
              <FileText size={20} className="text-brand-600" />
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">{dt.label}</h3>
            <p className="text-xs text-slate-500 mt-1">{dt.description}</p>
            <button
              onClick={() => { setDocType(dt.value as typeof docType); setShowModal(true) }}
              className="mt-4 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Request →
            </button>
          </div>
        ))}
      </div>

      {/* Requests list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="section-title">My Requests</h2>
        </div>
        {requests && requests.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {requests.map((req) => {
              const cfg = statusConfig[req.status]
              const Icon = cfg.icon
              const dt = docTypes.find((d) => d.value === req.document_type)
              return (
                <div key={req.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{dt?.label ?? req.document_type}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Requested {format(new Date(req.requested_at), 'MMM d, yyyy')}
                      {req.reason && ` · ${req.reason}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={req.status === 'ready' ? 'text-emerald-500' : req.status === 'processing' ? 'text-blue-500' : 'text-slate-400'} />
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <FileText size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No document requests yet</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Request a Document</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Document Type</label>
                <select className="input" value={docType} onChange={(e) => setDocType(e.target.value as typeof docType)}>
                  {docTypes.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Reason / Purpose (optional)</label>
                <textarea
                  className="input min-h-[80px] resize-none"
                  placeholder="e.g. Visa application, job application..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <div className="bg-brand-50 rounded-lg p-3 text-xs text-brand-800">
                Processing typically takes 3–5 business days. You will be notified when your document is ready.
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => submitRequest()} disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
