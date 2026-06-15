import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { format } from 'date-fns'
import type { Profile, Message } from '../types'

export default function Messages() {
  const { user } = useAuth()
  const uid = user?.id
  const queryClient = useQueryClient()
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null)
  const [messageText, setMessageText] = useState('')
  const [search, setSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: contacts } = useQuery<Profile[]>({
    queryKey: ['contacts', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', uid!)
        .limit(50)
      if (error) throw error
      return data ?? []
    },
    enabled: !!uid,
  })

  const { data: messages, isLoading: msgsLoading } = useQuery<Message[]>({
    queryKey: ['messages', uid, selectedContact?.id],
    queryFn: async () => {
      if (!selectedContact) return []
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${uid},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${uid})`)
        .order('sent_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!uid && !!selectedContact,
    refetchInterval: 3000,
  })

  const { mutate: sendMessage, isPending: sending } = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('messages').insert({
        sender_id: uid!,
        receiver_id: selectedContact!.id,
        content,
        is_read: false,
        sent_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      setMessageText('')
      queryClient.invalidateQueries({ queryKey: ['messages', uid, selectedContact?.id] })
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (messageText.trim()) sendMessage(messageText.trim())
  }

  const filteredContacts = contacts?.filter((c) =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const avatarLetter = (p: Profile) => (p.full_name ?? p.email).charAt(0).toUpperCase()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Messages</h1>
        <p className="text-slate-500 text-sm mt-1">Chat with classmates and staff</p>
      </div>

      <div className="card overflow-hidden flex h-[calc(100vh-200px)] min-h-[500px]">
        {/* Contact list */}
        <div className="w-72 border-r border-slate-100 flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-8 text-xs py-2"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredContacts?.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left ${selectedContact?.id === contact.id ? 'bg-brand-50' : ''}`}
              >
                {contact.profile_picture_url ? (
                  <img src={contact.profile_picture_url} className="w-9 h-9 rounded-full object-cover flex-shrink-0" alt="" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {avatarLetter(contact)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{contact.full_name ?? contact.email}</p>
                  <p className="text-xs text-slate-400 truncate">{contact.course_name ?? 'Student'}</p>
                </div>
              </button>
            ))}
            {filteredContacts?.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No contacts found</p>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedContact ? (
            <>
              {/* Chat header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {avatarLetter(selectedContact)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{selectedContact.full_name ?? selectedContact.email}</p>
                  <p className="text-xs text-slate-400">{selectedContact.student_id ?? selectedContact.course_name ?? 'Student'}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {msgsLoading ? (
                  <div className="flex justify-center pt-8"><LoadingSpinner /></div>
                ) : messages && messages.length > 0 ? (
                  messages.map((msg) => {
                    const isOwn = msg.sender_id === uid
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${isOwn ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-900 rounded-bl-sm'}`}>
                          <p className="leading-relaxed">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-brand-200' : 'text-slate-400'}`}>
                            {format(new Date(msg.sent_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-slate-100 flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || sending}
                  className="btn-primary px-3"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} className="mb-3 opacity-30" />
              <p className="font-medium">Select a contact to start messaging</p>
              <p className="text-sm mt-1">Choose someone from the list on the left</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
