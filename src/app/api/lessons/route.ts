import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

/**
 * GET /api/lessons?moduleId=...
 * Returns lessons for a given module with progress info
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get("moduleId")

    if (!moduleId)
      return NextResponse.json({ error: "Missing moduleId" }, { status: 400 })

    // 🧩 Get current user session
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData?.user?.id

    // 1️⃣ Get all lessons in that module
    const { data: lessons, error: lesError } = await supabase
      .from("lessons")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true })
    if (lesError) throw lesError

    if (!userId) {
      // Not logged in — only unlock first lesson
      const safeLessons = lessons.map((l, i) => ({
        ...l,
        is_unlocked: i === 0,
        completed: false,
      }))
      return NextResponse.json({ lessons: safeLessons })
    }

    // 2️⃣ Fetch user's lesson progress
    const { data: progress, error: progError } = await supabase
      .from("lesson_progress")
      .select("lesson_id, completed")
      .eq("user_id", userId)
    if (progError) throw progError

    // 3️⃣ Unlock logic: lesson is unlocked if previous completed
    const processed = lessons.map((lesson, i) => {
      const previousLesson = lessons[i - 1]
      const prevCompleted = previousLesson
        ? progress.some(
            (p) => p.lesson_id === previousLesson.id && p.completed === true
          )
        : true // first lesson unlocked by default

      const currentCompleted = progress.some(
        (p) => p.lesson_id === lesson.id && p.completed === true
      )

      return {
        ...lesson,
        is_unlocked: prevCompleted || currentCompleted,
        completed: currentCompleted,
      }
    })

    return NextResponse.json({ lessons: processed })
  } catch (err: any) {
    console.error("Error fetching lessons:", err)
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

export async function PUT(request: Request) {
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  )
}