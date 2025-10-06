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
// === GET: Retrieve current user level + lesson-level ===
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    // 🔐 Verify user identity via Supabase Auth
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🧾 Fetch user progress (level + level_lesson)
    const { data: userProgress, error: progressError } = await supabase
      .from("users")
      .select("level, level_lesson")
      .eq("id", user.id)
      .maybeSingle();

    if (progressError) throw new Error(progressError.message);

    const level = userProgress?.level ?? 1;
    const level_lesson = userProgress?.level_lesson ?? 0;

    // 🧩 Fetch current module info
    const { data: currentModule, error: moduleError } = await supabase
      .from("modules")
      .select("id, level")
      .eq("level", level)
      .maybeSingle();

    if (moduleError) throw new Error(moduleError.message);

    // 🧩 Fetch all lessons belonging to current module
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, module_id, order_index")
      .eq("module_id", currentModule?.id || "")
      .order("order_index", { ascending: true });

    if (lessonsError) throw new Error(lessonsError.message);

    const totalLessons = lessons?.length || 0;

    // 🧮 Calculate % based on current module only
    const progressPercent =
      totalLessons > 0
        ? Math.min((level_lesson / totalLessons) * 100, 100)
        : 0;

    // 🧮 Adjust display level (show n-1 if current module incomplete)
    const displayLevel =
      level > 1 && level_lesson === 0 ? level - 1 : level;

    return NextResponse.json({
      level: displayLevel,
      level_lesson,
      module_progress: parseFloat(progressPercent.toFixed(1)),
      total_lessons: totalLessons,
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