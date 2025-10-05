"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }
    try {
      setLoading(true)
      if (!supabase) throw new Error("Supabase client not available")
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess("Logged in — redirecting…")
        // small delay to show success
        setTimeout(() => router.push('/auth/home'), 400)
      }
    } catch (err: unknown) {
        // narrow unknown to Error if possible
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <form
        onSubmit={handleLogin}
        className="max-w-md w-full bg-white p-8 rounded shadow space-y-6 border"
        aria-labelledby="login-heading"
      >
        <h1 id="login-heading" className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-gray-600">Sign in to your account to continue.</p>

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
            aria-required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-required
          />
        </div>

        <div className="flex items-center justify-between">
          <Link href="/auth/signup" className="text-sm text-blue-600 hover:underline">Create account</Link>
          <a className="text-sm text-gray-600 hover:underline" href="#">Forgot password?</a>
        </div>

        <div>
          <button
            type="submit"
            className={`w-full px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-black'}`}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>

        {error && <p role="alert" className="text-red-600">{error}</p>}
        {success && <p role="status" className="text-green-600">{success}</p>}
      </form>
    </div>
  )
}
