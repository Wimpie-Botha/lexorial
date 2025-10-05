"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

type SimpleUser = {
  id: string
  email?: string | null
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<SimpleUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const getUser = async () => {
      try {
        setLoading(true)
        if (!supabase) throw new Error('Supabase client not available')
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        if (!data?.user) {
          router.push("/auth/login")
        } else {
          // pick only the fields we need to avoid typing the full Supabase User
          const rawUser = data.user as unknown
          const getProp = <T extends string | undefined>(obj: unknown, key: string): T | undefined => {
            if (!obj || typeof obj !== "object") return undefined
            const v = (obj as Record<string, unknown>)[key]
            return (typeof v === "string" ? (v as T) : undefined)
          }

          const id = getProp<string>(rawUser, "id") ?? ""
          const email = getProp<string | undefined>(rawUser, "email")
          const u: SimpleUser = { id, email }
          setUser(u)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  const handleLogout = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not available')
      await supabase.auth.signOut()
    } finally {
      router.push("/auth/login")
    }
  }

  if (loading) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-red-600">{error}</p>
        <button onClick={() => router.push('/auth/login')} className="mt-4 underline">Go to login</button>
      </div>
    )
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {user ? (
        <>
          <p>Welcome, <strong>{user.email ?? "user"}</strong>!</p>
          <p className="text-sm text-gray-600 mt-2">User id: {user.id}</p>
        </>
      ) : (
        <p>No user data available.</p>
      )}

      <button
        onClick={handleLogout}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  )
}
