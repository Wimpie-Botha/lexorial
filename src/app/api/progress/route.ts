import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"


// POST: create or update lesson progress
export async function POST(request: Request) {
  const body = await request.json()
  const { user_id, lesson_id, completed } = body

  if (!user_id || !lesson_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("lesson_progress")
    .upsert([{ user_id, lesson_id, completed }], { onConflict: "user_id,lesson_id" })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ progress: data }, { status: 201 })
}
// Note: GET, PUT, DELETE handlers can be added similarly when needed
// Note: GET, PUT, DELETE handlers can be added similarly when needed