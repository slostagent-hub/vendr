'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import MarketModal from './MarketModal'
import EventModal from './EventModal'

type Market = {
  id: string
  name: string
  location: string | null
  type: string | null
  application_fee: number
  booth_fee: number
  notes: string | null
}

type Event = {
  id: string
  market_id: string | null
  date: string | null
  status: string
  deadline: string | null
  fees_paid: number
  booth_assignment: string | null
  notes: string | null
  markets: { name: string } | null
}

const EVENT_STATUS_STYLE: Record<string, string> = {
  'Applied':    'bg-amber-100 text-amber-700',
  'Accepted':   'bg-blue-100 text-blue-700',
  'Waitlisted': 'bg-violet-100 text-violet-700',
  'Confirmed':  'bg-green-100 text-green-700',
  'Attended':   'bg-emerald-100 text-emerald-700',
  'Skipped':    'bg-stone-100 text-stone-500',
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isDeadlineSoon(d: string | null) {
  if (!d) return false
  const diff = new Date(d).getTime() - Date.now()
  return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000
}

function isOverdue(d: string | null) {
  if (!d) return false
  return new Date(d) < new Date(new Date().toDateString())
}

export default function SchedulePage() {
  const [view, setView] = useState<'tracker' | 'markets'>('tracker')
  const [events, setEvents] = useState<Event[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showMarketModal, setShowMarketModal] = useState(false)
  const [editEvent, setEditEvent] = useState<Event | null>(null)
  const [editMarket, setEditMarket] = useState<Market | null>(null)

  async function fetchAll() {
    const supabase = createClient()
    const [{ data: eventsData }, { data: marketsData }] = await Promise.all([
      supabase
        .from('events')
        .select('*, markets(name)')
        .order('deadline', { ascending: true, nullsFirst: false }),
      supabase
        .from('markets')
        .select('*')
        .order('name'),
    ])
    if (eventsData) setEvents(eventsData)
    if (marketsData) setMarkets(marketsData)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  function handleSaved() {
    setShowEventModal(false)
    setShowMarketModal(false)
    setEditEvent(null)
    setEditMarket(null)
    fetchAll()
  }

  const upcomingEvents = events.filter(e => !['Attended', 'Skipped'].includes(e.status))
  const pastEvents = events.filter(e => ['Attended', 'Skipped'].includes(e.status))

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white px-4 pt-14 pb-3 border-b border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-stone-800">Schedule</h1>
          <button
            onClick={() => {
              if (view === 'tracker') { setEditEvent(null); setShowEventModal(true) }
              else { setEditMarket(null); setShowMarketModal(true) }
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            + Add
          </button>
        </div>

        {/* View toggle */}
        <div className="flex rounded-lg bg-stone-100 p-1">
          <button
            onClick={() => setView('tracker')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              view === 'tracker' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => setView('markets')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              view === 'markets' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'
            }`}
          >
            Markets
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <p className="text-center text-stone-400 py-20">Loading…</p>
        ) : view === 'tracker' ? (
          /* Application Tracker */
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-20">
                No events yet. Tap + Add to track a market application.
              </p>
            ) : (
              <>
                {upcomingEvents.length > 0 && (
                  <div className="space-y-3">
                    {upcomingEvents.map(event => {
                      const deadlineSoon = isDeadlineSoon(event.deadline)
                      const deadlineOverdue = isOverdue(event.deadline)
                      return (
                        <div
                          key={event.id}
                          onClick={() => { setEditEvent(event as Event & { markets: { name: string } | null }); setShowEventModal(true) }}
                          className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer active:scale-95 transition-transform"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-stone-800 truncate">
                                {event.markets?.name ?? 'Unnamed Market'}
                              </p>
                              {event.date && (
                                <p className="text-sm text-stone-500 mt-0.5">{formatDate(event.date)}</p>
                              )}
                              {event.booth_assignment && (
                                <p className="text-xs text-stone-400 mt-0.5">Booth {event.booth_assignment}</p>
                              )}
                            </div>
                            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${EVENT_STATUS_STYLE[event.status] ?? 'bg-stone-100 text-stone-500'}`}>
                              {event.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-3 text-xs">
                            {event.deadline && (
                              <span className={
                                deadlineOverdue ? 'text-red-500 font-medium' :
                                deadlineSoon ? 'text-amber-600 font-medium' :
                                'text-stone-400'
                              }>
                                {deadlineOverdue ? 'Deadline passed · ' : deadlineSoon ? 'Deadline soon · ' : 'Deadline '}
                                {formatDate(event.deadline)}
                              </span>
                            )}
                            {event.fees_paid > 0 && (
                              <span className="text-stone-400 ml-auto">${event.fees_paid} paid</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {pastEvents.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Past</p>
                    <div className="space-y-3">
                      {pastEvents.map(event => (
                        <div
                          key={event.id}
                          onClick={() => { setEditEvent(event as Event & { markets: { name: string } | null }); setShowEventModal(true) }}
                          className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer opacity-60 active:scale-95 transition-transform"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-stone-800 text-sm">
                                {event.markets?.name ?? 'Unnamed Market'}
                              </p>
                              {event.date && (
                                <p className="text-xs text-stone-400 mt-0.5">{formatDate(event.date)}</p>
                              )}
                            </div>
                            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${EVENT_STATUS_STYLE[event.status] ?? 'bg-stone-100 text-stone-500'}`}>
                              {event.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Markets list */
          <div className="space-y-3">
            {markets.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-20">
                No markets yet. Tap + Add to save a venue.
              </p>
            ) : (
              markets.map(market => (
                <div
                  key={market.id}
                  onClick={() => { setEditMarket(market); setShowMarketModal(true) }}
                  className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer active:scale-95 transition-transform"
                >
                  <p className="font-semibold text-stone-800">{market.name}</p>
                  {market.type && <p className="text-xs text-stone-400 mt-0.5">{market.type}</p>}
                  {market.location && <p className="text-sm text-stone-500 mt-1">{market.location}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-stone-400">
                    {market.application_fee > 0 && <span>App fee ${market.application_fee}</span>}
                    {market.booth_fee > 0 && <span>Booth ${market.booth_fee}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showEventModal && (
        <EventModal
          event={editEvent}
          markets={markets}
          onClose={() => { setShowEventModal(false); setEditEvent(null) }}
          onSaved={handleSaved}
        />
      )}

      {showMarketModal && (
        <MarketModal
          market={editMarket}
          onClose={() => { setShowMarketModal(false); setEditMarket(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
