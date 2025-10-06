import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // 1️⃣ Get auth token and verify user
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get("moduleId");

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

    // 2️⃣ Fetch user level + level_lesson
    const { data: userProgress, error: userProgressError } = await supabase
      .from("users")
      .select("level, level_lesson")
      .eq("id", user.id)
      .maybeSingle();

    if (userProgressError) throw new Error(userProgressError.message);
    const userLevel = userProgress?.level || 1;
    const userLessonLevel = userProgress?.level_lesson || 0;

    // 3️⃣ Fetch all lessons (either for one module or all)
    const lessonQuery = supabase
      .from("lessons")
      .select("id, module_id, title, intro, order_index")
      .order("order_index", { ascending: true });

    if (moduleId) lessonQuery.eq("module_id", moduleId);

    const { data: lessons, error: lessonsError } = await lessonQuery;
    if (lessonsError || !lessons) throw new Error(lessonsError?.message || "Failed to fetch lessons");

    // 4️⃣ Fetch all modules to know their level
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select("id, level")
      .order("id", { ascending: true });

    if (modulesError || !modules) throw new Error(modulesError?.message || "Failed to fetch modules");

    // 🧩 Helper: find module's numeric level
    const getModuleLevel = (id: string) => {
      const found = modules.find((m) => m.id === id);
      if (!found) return 9999; // non-existing module (locked by default)
      return found.level || modules.findIndex((m) => m.id === id) + 1;
    };

    // 5️⃣ Determine unlock logic for each lesson
    const updatedLessons = lessons.map((lesson) => {
      const moduleLevel = getModuleLevel(lesson.module_id);
      let is_unlocked = false;

      // 🔓 Rule 1: All modules below user level are fully unlocked
      if (moduleLevel < userLevel) {
        is_unlocked = true;
      }
      // 🔓 Rule 2: Current module (equal to user level)
      else if (moduleLevel === userLevel) {
        // unlock lessons up to level_lesson + 1
        if (lesson.order_index <= userLessonLevel + 1) {
          is_unlocked = true;
        }
      }
      // 🔒 Rule 3: Modules above user level → locked
      else {
        is_unlocked = false;
      }

      return {
        ...lesson,
        is_unlocked,
      };
    });

    return NextResponse.json({ lessons: updatedLessons });
  } catch (err: any) {
    console.error("Error in /api/lessons:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
