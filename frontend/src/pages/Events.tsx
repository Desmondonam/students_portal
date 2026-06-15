import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CalendarDays, MapPin, Users, Clock, CheckCircle2, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { format, isPast } from 'date-fns'
import type { Event } from '../types'

const CATEGORIES = ['All', 'Academic', 'Sports', 'Cultural', 'Social', 'Career']

const catColor = (cat: string | null) => {
  switch (cat?.toLowerCase()) {
    case 'academic':  return 'info'    as const
    case 'sports':    return 'success' as const
    case 'cultural':  return 'warning' as const
    case 'career':    return 'default' as const
    default:          return 'default' as const
  }
}

const catBg = (cat: string | null) => {
  switch (cat?.toLowerCase()) {
    case 'academic':  return 'bg-blue-500'
    case 'sports':    return 'bg-emerald-500'
    case 'cultural':  return 'bg-amber-500'
    case 'career':    return 'bg-purple-500'
    case 'social':    return 'bg-pink-500'
    default:          return 'bg-brand-500'
  }
}

export default function Events() {
  const { user } = useAuth()
  const uid = user?.id
  const queryClient = useQueryClient()
  const [activeCategory, setActiveCategory] = useState('All')
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming')

  const { data: registrations } = useQuery<string[]>({
    queryKey: ['event-registrations', uid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('student_id', uid!)
      if (error) return []
      return (data ?? []).map((r) => r.event_id)
    },
    enabled: !!uid,
  })

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['events', activeCategory, filter],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: filter === 'upcoming' })
      if (filter === 'upcoming') {
        query = query.gte('event_date', new Date().toISOString())
      } else {
        query = query.lt('event_date', new Date().toISOString())
      }
      if (activeCategory !== 'All') query = query.ilike('category', activeCategory)
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })

  const { mutate: toggleRegistration } = useMutation({
    mutationFn: async ({ eventId, isRegistered }: { eventId: string; isRegistered: boolean }) => {
      if (isRegistered) {
        await supabase
          .from('event_registrations')
          .delete()
          .eq('event_id', eventId)
          .eq('student_id', uid!)
      } else {
        await supabase.from('event_registrations').insert({
          event_id: eventId,
          student_id: uid!,
          registered_at: new Date().toISOString(),
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-registrations', uid] })
    },
  })

  if (isLoading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Campus Events</h1>
        <p className="text-slate-500 text-sm mt-1">Stay connected with campus life and activities</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-brand-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1 gap-1 self-start">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'upcoming' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'past' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Past
          </button>
        </div>
      </div>

      {/* Events grid */}
      {events && events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => {
            const isRegistered = registrations?.includes(event.id) ?? false
            const eventPast = isPast(new Date(event.event_date))
            return (
              <div key={event.id} className="card overflow-hidden flex flex-col">
                {/* Color banner */}
                <div className={`h-2 ${catBg(event.category)}`} />

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug">{event.title}</h3>
                    {event.category && <Badge variant={catColor(event.category)}>{event.category}</Badge>}
                  </div>

                  {event.description && (
                    <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{event.description}</p>
                  )}

                  <div className="space-y-1.5 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                      <span>{format(new Date(event.event_date), 'EEE, MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock size={13} className="text-slate-400 flex-shrink-0" />
                      <span>
                        {format(new Date(event.event_date), 'h:mm a')}
                        {event.end_date && ` – ${format(new Date(event.end_date), 'h:mm a')}`}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    {event.max_attendees && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Users size={13} className="text-slate-400 flex-shrink-0" />
                        <span>Capacity: {event.max_attendees}</span>
                      </div>
                    )}
                  </div>

                  {!eventPast && (
                    <button
                      onClick={() => toggleRegistration({ eventId: event.id, isRegistered })}
                      className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        isRegistered
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                          : 'btn-primary'
                      }`}
                    >
                      {isRegistered ? (
                        <><CheckCircle2 size={15} /> Registered</>
                      ) : (
                        <><CalendarDays size={15} /> Register</>
                      )}
                    </button>
                  )}
                  {eventPast && (
                    <div className="mt-4 text-center">
                      <Badge variant="default" size="md">Event Ended</Badge>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <CalendarDays size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No {filter} events</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === 'upcoming' ? 'Check back soon for new events.' : 'No past events to show.'}
          </p>
        </div>
      )}
    </div>
  )
}
