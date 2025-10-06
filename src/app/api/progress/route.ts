import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// === POST: Update lesson progress ===
// This handles "lesson completed" → increments level_lesson
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { module_id, total_lessons_in_module } = body; // total lessons = number in current module

    if (!module_id || !total_lessons_in_module) {
      return NextResponse.json(
        { error: "Missing required fields (module_id, total_lessons_in_module)" },
        { status: 400 }
      );
    }

    // 🔐 Verify user from token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 🔍 Fetch current user progress
    const { data: current, error: userError } = await supabase
      .from("users")
      .select("level, level_lesson")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) throw new Error(userError.message);
    let { level, level_lesson } = current || { level: 1, level_lesson: 0 };

    // 🧩 Update lesson-level progress
    level_lesson += 1;

    // ✅ Level up when finishing all lessons in current module
    if (level_lesson >= total_lessons_in_module) {
      level += 1;
      level_lesson = 0;
    }

    // 🔄 Save back to database
    const { error: updateError } = await supabase
      .from("users")
      .update({ level, level_lesson })
      .eq("id", user.id);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({
      message: "Progress updated successfully",
      level,
      level_lesson,
    });
  } catch (err: any) {
    console.error("Error in POST /progress:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// === GET: Retrieve current user level + lesson-level ===
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  // 🧾 Fetch user progress (level + level_lesson)
const { data: progressData, error: progressError } = await supabase
  .from("users")
  .select("level, level_lesson")
  .eq("id", user.id)
  .maybeSingle();

if (progressError) throw new Error(progressError.message);

// Provide safe fallback values if user row is missing
const userProgress = {
  level: progressData?.level ?? 1,
  level_lesson: progressData?.level_lesson ?? 0,
};

// 🧮 Compute total modules count
const { count: totalModules, error: countError } = await supabase
  .from("modules")
  .select("id", { count: "exact", head: true });

if (countError) throw new Error(countError.message);

// 🧮 Calculate module progress percent
const modulePercent =
  totalModules && totalModules > 0
    ? (userProgress.level / totalModules) * 100
    : 0;

return NextResponse.json({
  level: userProgress.level,
  level_lesson: userProgress.level_lesson,
  module_progress: parseFloat(modulePercent.toFixed(1)),
  message: "User progress retrieved successfully",
});
  } catch (err: any) {
    console.error("Error in GET /progress:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
