"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!email || !password) {
      setError("Please enter email and password")
      return
    }
    try {
      setLoading(true)
      if (!supabase) throw new Error('Supabase client not available')
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Sign up successful — check your email if confirmation is required')
        // continue onboarding: questions -> courses -> home
        setTimeout(() => router.push('/auth/questions'), 800)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <form
        onSubmit={handleSignup}
        className="max-w-md w-full bg-white p-8 rounded shadow space-y-6 border"
        aria-labelledby="signup-heading"
      >
        <h1 id="signup-heading" className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-gray-600">Enter your details to create an account.</p>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Choose a password"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <Link href="/auth/login" className="text-sm text-blue-600 hover:underline">Already have an account?</Link>
        </div>

        <div>
          <button
            type="submit"
            className={`w-full px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-black'}`}
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </div>

        {error && <p role="alert" className="text-red-600">{error}</p>}
        {success && <p role="status" className="text-green-600">{success}</p>}
      </form>
    </div>
  )
}
            