import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "lesson-slides";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for elevated privileges
);

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB



// === GET /api/lesson-content?lesson_id=xxx ===
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lesson_id = searchParams.get("lesson_id");

    if (!lesson_id) {
      return NextResponse.json(
        { error: "Missing lesson_id parameter" },
        { status: 400 }
      );
    }

    // Fetch lesson + module info
    const { data: lessonData, error: lessonError } = await supabase
      .from("lessons")
      .select("id, title, intro, module_id")
      .eq("id", lesson_id)
      .single();

    if (lessonError) throw lessonError;

    // Fetch all linked content in parallel for speed
    const [videos, slides, flashcards, questions] = await Promise.all([
      supabase.from("videos").select("id, video_url").eq("lesson_id", lesson_id),
      supabase.from("slides").select("id, slide_url").eq("lesson_id", lesson_id),
      supabase
        .from("flashcards")
        .select("id, word, translation, example_sentence")
        .eq("lesson_id", lesson_id),
      supabase
        .from("questions")
        .select(
          "id, question_text, question_type, options, correct_answer"
        )
        .eq("lesson_id", lesson_id),
    ]);

    if (videos.error) throw videos.error;
    if (slides.error) throw slides.error;
    if (flashcards.error) throw flashcards.error;
    if (questions.error) throw questions.error;

    return NextResponse.json(
      {
        lesson: lessonData,
        videos: videos.data,
        slides: slides.data,
        flashcards: flashcards.data,
        questions: questions.data,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching lesson content:", err.message || err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// === PUT /api/lesson-content ===
//supports file uploads via FormData and saves to Supabase Storage
export async function PUT(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    //Handle both JSON (no file) and FormData (with file)
    let lesson_id = "";
    let video_url = "";
    let flashcard_url = "";
    let slide_file: File | null = null;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      lesson_id = body.lesson_id;
      video_url = body.video_url;
      flashcard_url = body.flashcard_url;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      lesson_id = formData.get("lesson_id") as string;
      video_url = (formData.get("video_url") as string) || "";
      flashcard_url = (formData.get("flashcard_url") as string) || "";
      slide_file = formData.get("slide_file") as File | null;
    }

    if (!lesson_id) {
      return NextResponse.json(
        { error: "Missing required field: lesson_id" },
        { status: 400 }
      );
    }

    // === 1. Update or insert video
    if (video_url) {
      const { error: videoError } = await supabase
        .from("videos")
        .upsert(
          {
            lesson_id,
            video_url,
            created_at: new Date().toISOString(),
          },
          { onConflict: "lesson_id" }
        );
      if (videoError) throw videoError;
    }

    // === 2. Update or insert flashcard link
    if (flashcard_url) {
      const { error: flashError } = await supabase
        .from("flashcards")
        .upsert(
          {
            lesson_id,
            word: "Flashcard Link",
            translation: flashcard_url,
            created_at: new Date().toISOString(),
          },
          { onConflict: "lesson_id" }
        );
      if (flashError) throw flashError;
    }

    // === 3. Upload slide image to Supabase Storage (if file provided)
    let slide_url: string | null = null;
    if (slide_file) {
      //Validate file
      if (!ALLOWED_TYPES.includes(slide_file.type)) {
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
      }
      if (slide_file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
      }

      //Delete old file if it exists
      const { data: existingSlide } = await supabase
        .from("slides")
        .select("file_path")
        .eq("lesson_id", lesson_id)
        .single();

      if (existingSlide?.file_path) {
        await supabase.storage.from(bucketName).remove([existingSlide.file_path]);
      }

      //Upload new file
  const filePath = `lesson-${lesson_id}/${Date.now()}-${slide_file.name}`;
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, slide_file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      slide_url = publicData.publicUrl;

      const { error: slideError } = await supabase
        .from("slides")
        .upsert(
          {
            lesson_id,
            slide_url,
            bucket: bucketName, 
            file_path: filePath, 
            created_at: new Date().toISOString(),
          },
          { onConflict: "lesson_id" }
        );

      if (slideError) throw slideError;
    }

    return NextResponse.json(
      {
        message: "Lesson content updated successfully.",
        slide_url,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error updating lesson content:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
