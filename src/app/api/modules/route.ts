import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

/**
 * GET /api/modules
 * Returns all modules plus whether each one is unlocked for the current user
 */
export async function GET(request: Request) {
  try {
    // 🧩 Get current user session
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id

    // 1️⃣ Get all modules
    const { data: modules, error: modError } = await supabase
      .from("modules")
      .select("*")
      .order("id")
    if (modError) throw modError

    if (!userId) {
      // not logged in — only show first module as unlocked
      const safeModules = modules.map((m, i) => ({
        ...m,
        is_unlocked: i === 0,
      }))
      return NextResponse.json({ modules: safeModules })
    }

    // 2️⃣ Get user progress
    const { data: progress, error: progError } = await supabase
      .from("user_progress")
      .select("module_id, completed")
      .eq("user_id", userId)
    if (progError) throw progError

    // 3️⃣ Mark modules unlocked if previous completed
    const unlockedModules = modules.map((m, i) => {
      if (i === 0) return { ...m, is_unlocked: true }
      const previousId = modules[i - 1]?.id
      const prevDone = progress?.some(
        (p) => p.module_id === previousId && p.completed
      )
      return { ...m, is_unlocked: prevDone }
    })

    return NextResponse.json({ modules: unlockedModules })
  } catch (err: any) {
    console.error("Error fetching modules:", err)
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    )
  }
}
// Note: POST, PUT, DELETE handlers can be added similarly when needed

export async function POST(request: Request) {
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  )
}   