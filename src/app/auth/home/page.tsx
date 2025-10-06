"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import BurgerMenu from "@/components/BurgerMenu";
import { Lock } from "lucide-react";

    // === Types ===
    interface Module {
    id: string;
    title: string;
    description?: string;
    level?: number;
    is_unlocked?: boolean;
    lessons?: Lesson[];
    }

    interface Lesson {
    id: string;
    module_id: string;
    title: string;
    intro?: string;
    order_index?: number;
    is_unlocked?: boolean;
    completed?: boolean;
    }

    export default function HomePage() {
    const [userLevelLesson, setUserLevelLesson] = useState(0);
    const [open, setOpen] = useState(false);
    const [session, setSession] = useState<any>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
    const [lessonContent, setLessonContent] = useState<any>(null);
    const [loadingContent, setLoadingContent] = useState(false);
    const [loadingModules, setLoadingModules] = useState(true);
    const [loadingLessons, setLoadingLessons] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Progress state
    const [currentLevel, setCurrentLevel] = useState(1);
    const [progress, setProgress] = useState(0);
    const [loadingProgress, setLoadingProgress] = useState(true);

    // 🔐 Load current Supabase session
    useEffect(() => {
      const getSession = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
      };
      getSession();
    }, []);


useEffect(() => {
  const fetchProgress = async () => {
    if (!session?.access_token) return;

    try {
      setLoadingProgress(true);
      const res = await fetch("/api/progress", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch progress data.");

      const data = await res.json();

      // ✅ Update state values
      setCurrentLevel(data.level || 1);
      setUserLevelLesson(data.level_lesson || 0);
      setProgress(data.module_progress || 0);

      console.log("📊 Progress:", data);
    } catch (err: any) {
      console.error("Error fetching progress:", err.message);
    } finally {
      setLoadingProgress(false);
    }
  };

  fetchProgress();
}, [session]);


  // 🌐 Fetch modules via API and mark unlocked ones based on level
  useEffect(() => {
    const fetchModules = async () => {
      if (!session) return;
      setLoadingModules(true);
      try {
        const res = await fetch("/api/modules", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch modules.");
        const { modules } = await res.json();

        // Unlock modules if module.level <= user.currentLevel
        const unlockedModules = modules.map((mod: Module, index: number) => ({
          ...mod,
          level: mod.level || index + 1, // fallback if no level column yet
          is_unlocked: (mod.level || index + 1) <= currentLevel,
        }));

        setModules(unlockedModules);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingModules(false);
      }
    };
    if (session) fetchModules();
  }, [session, currentLevel]);

  // 🌐 Fetch lessons for selected module and mark unlocked based on module unlock
  useEffect(() => {
  // 🧠 Only run if we have a selected module AND a valid session
  if (!selectedModule || !session) return;

  const fetchLessons = async () => {
    try {
      setLoadingLessons(true);

      const token = session.access_token;
      if (!token) {
        console.warn("⚠️ Missing authorization token — skipping lesson fetch.");
        return;
      }

      // 🌐 Fetch lessons for this module
      const res = await fetch(`/api/lessons?moduleId=${selectedModule}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to fetch lessons (${res.status})`);

      const { lessons } = await res.json();

      // 🔍 Find the selected module to determine overall unlock status
      const selectedMod = modules.find((m) => m.id === selectedModule);
      const moduleUnlocked = selectedMod?.is_unlocked ?? false;

      // 🔓 Merge server unlock info with module unlock
      // (Server already decides which lessons are unlocked)
      setLessons(lessons);

    } catch (err: any) {
      console.error("❌ Error fetching lessons:", err.message);
      setError(err.message);
    } finally {
      setLoadingLessons(false);
    }
  };

    fetchLessons();
  }, [selectedModule, session?.access_token, modules]);
  // 🌐 Fetch content for selected lesson


  useEffect(() => {

     console.log("🔥 useEffect triggered for lesson:", selectedLesson);
    if (!selectedLesson) return;

    const fetchLessonContent = async () => {
      try {
        setLoadingContent(true);
        setLessonContent(null);

        const res = await fetch(`/api/lesson-content?lesson_id=${selectedLesson}`);
        if (!res.ok) throw new Error("Failed to fetch lesson content");
        const data = await res.json();
        setLessonContent(data);
      } catch (err: any) {
        console.error("Error fetching lesson content:", err.message);
      } finally {
        setLoadingContent(false);
        
      }
    };

      fetchLessonContent();
    }, [selectedLesson]);

  
   


  // === Render ===
  return (
    <div className="p-10 relative overflow-hidden">
      {/* === Burger Menu (button) === */}
      <BurgerMenu side="left" isOpen={open} onToggle={setOpen} />

      {/* === Sidebar: Your Progress === */}
      <div
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white shadow-xl border-r border-gray-200 
        transform transition-all duration-500 ease-in-out ${
          open ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          <h2 className="text-xl font-semibold mb-4">Your Progress</h2>

          {loadingProgress ? (
            <div className="bg-gray-100 rounded-lg p-4 mb-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-3"></div>
              <div className="h-2 bg-gray-300 rounded"></div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-[#24C655] to-[#1D9E44] text-white rounded-lg p-4 mb-6 shadow-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  Level {currentLevel-1}
                </span>
                <span className="text-sm font-medium">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-500 ease-in-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {progress === 100 && (
                <p className="text-xs mt-2 text-white/80">
                  🎉 Level Up! You’ve reached Level {currentLevel}!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === Overlay === */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity duration-500"
          onClick={() => setOpen(false)}
        />
      )}

      {/* === Top Banner === */}
      {session && (
        <div className="flex items-center justify-between bg-gray-100 border border-gray-300 rounded-2xl px-4 py-2 mb-6">
          <div>
            <p className="text-gray-600 text-sm">
              Signed in as{" "}
              <span className="font-semibold">{session.user.email}</span>
            </p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/auth/login";
            }}
            className="px-3 py-1 bg-red-300 text-white text-sm font-semibold rounded-md border border-black/[0.9] hover:bg-red-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-4">Welcome Home!</h1>
      <p className="text-gray-700 mb-6">
        You are now logged in to the Afrikaans learning platform. 🎉
      </p>

      {error && <p className="text-red-500 mb-4 font-medium">⚠️ {error}</p>}

      {/* === MAIN CONTENT === */}
      <div className="grid grid-cols-3 gap-1">
        {/* === LEFT COLUMN — MODULES === */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Modules</h2>
          {loadingModules ? (
            <p className="text-gray-500">Loading modules…</p>
          ) : (
            <div className="flex flex-col space-y-1">
              {modules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() =>
                    mod.is_unlocked && setSelectedModule(mod.id)
                  }
                  disabled={!mod.is_unlocked}
                  className={`relative flex justify-between items-center px-3 py-2 border border-gray-400 rounded-md transition-all duration-150 active:scale-[0.97] ${
                    selectedModule === mod.id
                      ? "bg-gray-200"
                      : "bg-gray-50 hover:bg-gray-100"
                  } ${!mod.is_unlocked ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {!mod.is_unlocked && (
                      <Lock size={14} className="text-gray-500" />
                    )}
                    <h3 className="font-bold text-sm">
                      {mod.title} (Lvl {mod.level})
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* === MIDDLE COLUMN — LESSONS === */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Lessons</h2>
          {loadingLessons ? (
            <p className="text-gray-500">Loading lessons…</p>
          ) : selectedModule ? (
            <div className="flex flex-col space-y-1">
             {lessons.length > 0 ? (
                lessons.map((lesson) => {
                    // ✅ Check if the lesson is completed or current
                    const isCompleted =
                            lesson.order_index! <= userLevelLesson && lesson.is_unlocked;
                            const isActive =
                            lesson.order_index === userLevelLesson + 1 && lesson.is_unlocked;

                    return (
                    <button
                        key={lesson.id}
                        onClick={() => {lesson.is_unlocked && setSelectedLesson(lesson.id);
                                        }}
                                    disabled={!lesson.is_unlocked}

                        
                        className={`relative flex justify-between items-center px-3 py-2 border rounded-md transition-all duration-200 active:scale-[0.97]
                        ${
                            isCompleted
                            ? "bg-green-50 border-green-500 text-green-700"
                            : isActive
                            ? "bg-gray-100 border-gray-400 text-gray-800"
                            : "bg-gray-50 border-gray-300 text-gray-600"
                        }
                        ${!lesson.is_unlocked ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                    >
                        <div className="flex items-center gap-2">
                        {!lesson.is_unlocked && <Lock size={12} className="text-gray-500" />}

                        <h4
                            className={`font-semibold text-sm ${
                            isCompleted
                                ? "text-green-700"
                                : isActive
                                ? "text-gray-800"
                                : "text-gray-600"
                            }`}
                        >
                            Lesson {lesson.order_index}: {lesson.title}
                        </h4>
                        </div>

                        {/* ✅ Completion icon */}
                        {isCompleted && (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold">
                            ✓
                        </span>
                        )}
                    </button>
                    );
                })
                ) : (
                <p className="text-gray-500 text-sm italic">
                    No lessons found for this module.
                </p>
)}
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic">
              Select a module to view its lessons.
            </p>
          )}
        </div>

      {/* === RIGHT COLUMN — CONTENT === */}
<div>
  <h2 className="text-lg font-semibold mb-2">Lesson Content</h2>

  {!selectedLesson ? (
    <p className="text-gray-400 text-sm italic">
      Select a lesson to view its content.
    </p>
  ) : loadingContent ? (
    <p className="text-gray-500 text-sm">Loading lesson content...</p>
  ) : lessonContent ? (
    <div className="flex flex-col space-y-2">
      <h3 className="text-lg font-bold text-gray-800 mb-2">
        {lessonContent.lesson.title}
      </h3>

      {/* === Video button === */}
      {lessonContent.videos?.length > 0 && (
        <button
          className="flex justify-between items-center px-3 py-2 border border-gray-400 rounded-md bg-gray-50 hover:bg-gray-100 transition-all duration-150 active:scale-[0.97]"
          onClick={() => console.log("Open video player")}
        >
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-bold">🎬</span>
            <span className="font-semibold text-sm">Video Lesson</span>
          </div>
          <span className="text-xs text-gray-600">
            {lessonContent.videos.length} file(s)
          </span>
        </button>
      )}

      {/* === Slides button === */}
      {lessonContent.slides?.length > 0 && (
        <button
          className="flex justify-between items-center px-3 py-2 border border-gray-400 rounded-md bg-gray-50 hover:bg-gray-100 transition-all duration-150 active:scale-[0.97]"
          onClick={() => console.log("Open slides")}
        >
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold">📑</span>
            <span className="font-semibold text-sm">Slides</span>
          </div>
          <span className="text-xs text-gray-600">
            {lessonContent.slides.length} file(s)
          </span>
        </button>
      )}

      {/* === Flashcards button === */}
      {lessonContent.flashcards?.length > 0 && (
        <button
          className="flex justify-between items-center px-3 py-2 border border-gray-400 rounded-md bg-gray-50 hover:bg-gray-100 transition-all duration-150 active:scale-[0.97]"
          onClick={() => console.log("Open flashcards")}
        >
          <div className="flex items-center gap-2">
            <span className="text-yellow-600 font-bold">🧠</span>
            <span className="font-semibold text-sm">Flashcards</span>
          </div>
          <span className="text-xs text-gray-600">
            {lessonContent.flashcards.length} card(s)
          </span>
        </button>
      )}

      {/* === Questions button === */}
      {lessonContent.questions?.length > 0 && (
        <button
          className="flex justify-between items-center px-3 py-2 border border-gray-400 rounded-md bg-gray-50 hover:bg-gray-100 transition-all duration-150 active:scale-[0.97]"
          onClick={() => console.log("Open questions")}
        >
          <div className="flex items-center gap-2">
            <span className="text-purple-600 font-bold">❓</span>
            <span className="font-semibold text-sm">Questions</span>
          </div>
          <span className="text-xs text-gray-600">
            {lessonContent.questions.length} question(s)
          </span>
        </button>
      )}


      {/* === No content message === */}
      {!lessonContent.videos?.length &&
        !lessonContent.slides?.length &&
        !lessonContent.flashcards?.length &&
        !lessonContent.questions?.length && (
          <p className="text-gray-500 text-sm italic mt-2">
            fokkol.
          </p>
        )}
    </div>
  ) : (
      <p className="text-gray-500 text-sm italic">
        No content found for this lesson.
      </p>
    )}
  </div>
      </div> {/* End grid (modules + lessons + content) */}
    </div> 
    
  );
}

