'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    const supabase = createClient()

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setIsError(false)
        setMessage('Account created! Check your email to confirm, then sign in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/')
        router.refresh()
      }
    } catch (err: unknown) {
      setIsError(true)
      setMessage(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-stone-800 tracking-tight">Vendr</h1>
        <p className="text-stone-500 mt-2 text-sm">Your market toolkit</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
        <div className="flex rounded-lg bg-stone-100 p-1 mb-6">
          <button
            type="button"
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              mode === 'signin' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'
            }`}
            onClick={() => { setMode('signin'); setMessage('') }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
              mode === 'signup' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'
            }`}
            onClick={() => { setMode('signup'); setMessage('') }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
            />
          </div>

          {message && (
            <p className={`text-sm ${isError ? 'text-red-500' : 'text-green-600'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? 'Loading…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
