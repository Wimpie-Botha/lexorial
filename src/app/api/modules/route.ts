import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // 1️⃣ Authenticate user
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      console.warn("❌ Missing authorization token");
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      console.warn("❌ Unauthorized:", userError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Fetch user's level safely
    const { data: userData, error: userError2 } = await supabase
      .from("users")
      .select("level, level_lesson")
      .eq("id", user.id)
      .maybeSingle();

    if (userError2) throw new Error(userError2.message);

    const userLevel = userData?.level ?? 1;
    console.log(`✅ User level: ${userLevel}`);

    // 3️⃣ Fetch all modules (ensure "level" column exists)
    const { data: modules, error: modulesError } = await supabase
      .from("modules")
      .select("id, title, description, level")
      .order("level", { ascending: true });

    if (modulesError) throw new Error(modulesError.message);

    if (!modules || modules.length === 0) {
      console.warn("⚠️ No modules found in database.");
      return NextResponse.json({ modules: [] });
    }

    console.log(`✅ Found ${modules.length} modules`);

    // 4️⃣ Add fallback levels if missing
    const leveledModules = modules.map((mod, idx) => ({
      ...mod,
      level: mod.level ?? idx + 1,
    }));

    // 5️⃣ Mark unlocked modules
    const updatedModules = leveledModules.map((mod) => ({
      ...mod,
      is_unlocked: mod.level <= userLevel,
    }));

    return NextResponse.json({ modules: updatedModules });
  } catch (err: any) {
    console.error("❌ Error in /api/modules:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
