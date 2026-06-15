import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { MessageSquare, Plus, Eye, Pin, Users, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { format } from 'date-fns'
import type { ForumThread, ForumPost, Profile } from '../types'

const CATEGORIES = ['All', 'General', 'Academic', 'Sports', 'Housing', 'Jobs', 'Social']

const categoryColor = (cat: string | null) => {
  switch (cat?.toLowerCase()) {
    case 'academic': return 'info' as const
    case 'sports':   return 'success' as const
    case 'housing':  return 'warning' as const
    case 'jobs':     return 'default' as const
    default:         return 'default' as const
  }
}

function ThreadView({ thread, onBack }: { thread: ForumThread & { author?: Profile }; onBack: () => void }) {
  const { user } = useAuth()
  const uid = user?.id
  const queryClient = useQueryClient()
  const [reply, setReply] = useState('')

  const { data: posts } = useQuery<(ForumPost & { author?: Profile })[]>({
    queryKey: ['forum-posts', thread.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*, author:profiles(id, full_name, profile_picture_url, student_id)')
        .eq('thread_id', thread.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

  const { mutate: postReply, isPending: posting } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('forum_posts').insert({
        thread_id: thread.id,
        author_id: uid!,
        content: reply.trim(),
        created_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      setReply('')
      queryClient.invalidateQueries({ queryKey: ['forum-posts', thread.id] })
    },
  })

  const avatarLetter = (p?: Profile | null) => (p?.full_name ?? 'U').charAt(0).toUpperCase()

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-brand-600 hover:text-brand-700 font-medium">← Back to forums</button>
      <div className="card p-5">
        <div className="flex items-start gap-3">
          {thread.is_pinned && <Pin size={14} className="text-amber-500 mt-1 flex-shrink-0" />}
          <div>
            <h2 className="text-xl font-bold text-slate-900">{thread.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span>By {thread.author?.full_name ?? 'Unknown'}</span>
              <span>·</span>
              <span>{format(new Date(thread.created_at), 'MMM d, yyyy')}</span>
              {thread.category && <Badge variant={categoryColor(thread.category)}>{thread.category}</Badge>}
            </div>
            <p className="mt-4 text-slate-700 leading-relaxed">{thread.content}</p>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-3">
        {posts?.map((post) => (
          <div key={post.id} className="card p-4 flex gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm flex-shrink-0">
              {avatarLetter(post.author)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-800">{post.author?.full_name ?? 'Student'}</span>
                <span className="text-xs text-slate-400">{format(new Date(post.created_at), 'MMM d, h:mm a')}</span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply input */}
      <div className="card p-4">
        <textarea
          className="input resize-none min-h-[80px]"
          placeholder="Write a reply..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={() => postReply()}
            disabled={!reply.trim() || posting}
            className="btn-primary"
          >
            Post Reply
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Forums() {
  const { user } = useAuth()
  const uid = user?.id
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [selectedThread, setSelectedThread] = useState<(ForumThread & { author?: Profile }) | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('General')

  const { data: threads, isLoading } = useQuery<(ForumThread & { author?: Profile })[]>({
    queryKey: ['forum-threads', activeCategory],
    queryFn: async () => {
      let query = supabase
        .from('forum_threads')
        .select('*, author:profiles(id, full_name, profile_picture_url)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      if (activeCategory !== 'All') query = query.ilike('category', activeCategory)
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })

  const { mutate: createThread, isPending: creating } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('forum_threads').insert({
        author_id: uid!,
        title: newTitle.trim(),
        content: newContent.trim(),
        category: newCategory,
        views: 0,
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-threads'] })
      setShowModal(false)
      setNewTitle('')
      setNewContent('')
    },
  })

  if (selectedThread) {
    return <ThreadView thread={selectedThread} onBack={() => setSelectedThread(null)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Forums</h1>
          <p className="text-slate-500 text-sm mt-1">Discuss topics, ask questions, and share ideas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> New Thread
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Thread list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : threads && threads.length > 0 ? (
        <div className="space-y-2">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              className="card w-full p-4 flex items-start gap-4 hover:border-brand-200 transition-colors text-left"
            >
              {thread.is_pinned && (
                <Pin size={16} className="text-amber-500 mt-1 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900 text-sm">{thread.title}</h3>
                  {thread.is_pinned && <Badge variant="warning">Pinned</Badge>}
                  {thread.category && <Badge variant={categoryColor(thread.category)}>{thread.category}</Badge>}
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{thread.content}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Users size={11} /> {thread.author?.full_name ?? 'Unknown'}</span>
                  <span>{format(new Date(thread.created_at), 'MMM d, yyyy')}</span>
                  <span className="flex items-center gap-1"><Eye size={11} /> {thread.views}</span>
                  <span className="flex items-center gap-1"><MessageSquare size={11} /> {thread.post_count ?? 0}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <MessageSquare size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No threads yet</p>
          <p className="text-sm text-slate-400 mt-1">Be the first to start a discussion!</p>
        </div>
      )}

      {/* New thread modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Start a Discussion</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Title</label>
                <input className="input" placeholder="What's on your mind?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  {CATEGORIES.filter(c => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Content</label>
                <textarea className="input min-h-[120px] resize-none" placeholder="Share your thoughts..." value={newContent} onChange={(e) => setNewContent(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => createThread()} disabled={!newTitle.trim() || !newContent.trim() || creating} className="btn-primary flex-1">
                  {creating ? 'Posting...' : 'Post Thread'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
