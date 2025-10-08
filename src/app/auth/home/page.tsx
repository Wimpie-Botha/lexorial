"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  LogOut,
  Settings,
  BookOpen,
  Layers,
  FileText,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [session, setSession] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [lessonContent, setLessonContent] = useState<any>(null);

  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  const [currentLevel, setCurrentLevel] = useState(1);
  const [progress, setProgress] = useState(0);
  const [userLevelLesson, setUserLevelLesson] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"modules" | "lessons" | "content">("modules");

  // 🔐 Get Supabase session
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

  // 📊 Fetch progress
  useEffect(() => {
    if (!session?.access_token) return;

    const fetchProgress = async () => {
      try {
        const res = await fetch("/api/progress", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch progress data.");

        const data = await res.json();
        setCurrentLevel(data.level || 1);
        setUserLevelLesson(data.level_lesson || 0);
        setProgress(data.module_progress || 0);
      } catch (err: any) {
        console.error("Progress fetch error:", err.message);
      }
    };
    fetchProgress();
  }, [session]);

  // 📚 Fetch modules
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

        const unlocked = modules.map((mod: Module, i: number) => ({
          ...mod,
          level: mod.level || i + 1,
          is_unlocked: (mod.level || i + 1) <= currentLevel,
        }));
        setModules(unlocked);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingModules(false);
      }
    };
    if (session) fetchModules();
  }, [session, currentLevel]);

  // 🧠 Fetch lessons
  useEffect(() => {
    if (!selectedModule || !session) return;
    const fetchLessons = async () => {
      try {
        setLoadingLessons(true);
        const res = await fetch(`/api/lessons?moduleId=${selectedModule}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error(`Failed to fetch lessons`);
        const { lessons } = await res.json();
        setLessons(lessons);
      } catch (err: any) {
        console.error("Lesson fetch error:", err.message);
      } finally {
        setLoadingLessons(false);
      }
    };
    fetchLessons();
  }, [selectedModule, session]);

  // 📄 Fetch lesson content
  useEffect(() => {
    if (!selectedLesson) return;
    const fetchContent = async () => {
      try {
        setLoadingContent(true);
        const res = await fetch(`/api/lesson-content?lesson_id=${selectedLesson}`);
        if (!res.ok) throw new Error("Failed to fetch lesson content");
        const data = await res.json();
        setLessonContent(data);
      } catch (err: any) {
        console.error("Content fetch error:", err.message);
      } finally {
        setLoadingContent(false);
      }
    };
    fetchContent();
  }, [selectedLesson]);

  // === LOGOUT ===
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  // === Animation variants ===
  const fadeSlide = {
    hidden: { opacity: 0, x: 15 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -15 },
  };

  // === RENDER ===
  return (
    <div className="flex h-screen bg-white">
      {/* === LEFT SIDEBAR === */}
      <aside className="w-64 border-r border-gray-200 flex flex-col justify-between py-6 px-4 shadow-md">
        <div>
          {/* Profile */}
          <div className="flex flex-col items-center mb-6">
            <img
              src={`https://ui-avatars.com/api/?name=${
                session?.user?.email || "User"
              }&background=24C655&color=fff`}
              alt="Profile"
              className="w-16 h-16 rounded-full shadow-sm mb-3"
            />
            <p className="text-gray-700 font-medium text-sm text-center truncate w-full">
              {session?.user?.email}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-1">Level {currentLevel - 1}</p>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-500 h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Sidebar Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => setView("modules")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                view === "modules"
                  ? "bg-green-100 text-green-700"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <Layers size={16} /> Modules
            </button>
            <button
              onClick={() => setView("lessons")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                view === "lessons"
                  ? "bg-green-100 text-green-700"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <BookOpen size={16} /> Lessons
            </button>
            <button
              onClick={() => setView("content")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                view === "content"
                  ? "bg-green-100 text-green-700"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <FileText size={16} /> Lesson Content
            </button>
          </div>
        </div>

        {/* Settings + Logout */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-100 text-gray-700">
            <Settings size={16} /> Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* === MAIN CONTENT === */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Fixed Breadcrumb Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-8 py-3 flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => setView("modules")}
            className={`hover:text-green-600 transition ${
              view === "modules" ? "text-green-700 font-semibold" : ""
            }`}
          >
            Home
          </button>
          {view !== "modules" && <span>▸</span>}
          {view !== "modules" && (
            <button
              onClick={() => setView("lessons")}
              className={`hover:text-green-600 transition ${
                view === "lessons" ? "text-green-700 font-semibold" : ""
              }`}
            >
              Lessons
            </button>
          )}
          {view === "content" && (
            <>
              <span>▸</span>
              <span className="text-gray-500 font-medium">Lesson Content</span>
            </>
          )}
        </div>

        {/* Animated Section */}
        <div className="p-8">
          {error && <p className="text-red-500 mb-4 font-medium">⚠️ {error}</p>}
          <AnimatePresence mode="wait">
            {view === "modules" && (
              <motion.div
                key="modules"
                variants={fadeSlide}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <h1 className="text-2xl font-bold mb-6">Modules</h1>
                {loadingModules ? (
                  <p className="text-gray-500">Loading modules…</p>
                ) : (
                  <div className="space-y-2">
                    {modules.map((mod) => (
                      <button
                        key={mod.id}
                        onClick={() => {
                          if (mod.is_unlocked) {
                            setSelectedModule(mod.id);
                            setView("lessons");
                          }
                        }}
                        disabled={!mod.is_unlocked}
                        className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border transition-all ${
                          mod.is_unlocked
                            ? "bg-white hover:bg-green-50 border-gray-300"
                            : "bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {!mod.is_unlocked && (
                            <Lock size={14} className="text-gray-500" />
                          )}
                          <span className="font-semibold">{mod.title}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Lvl {mod.level}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {view === "lessons" && (
              <motion.div
                key="lessons"
                variants={fadeSlide}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <h1 className="text-2xl font-bold mb-6">Lessons</h1>
                {loadingLessons ? (
                  <p className="text-gray-500">Loading lessons…</p>
                ) : selectedModule ? (
                  <div className="space-y-2">
                    {lessons.map((lesson) => {
                      const isCompleted =
                        lesson.order_index! <= userLevelLesson &&
                        lesson.is_unlocked;
                      const isActive =
                        lesson.order_index === userLevelLesson + 1 &&
                        lesson.is_unlocked;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            if (lesson.is_unlocked) {
                              setSelectedLesson(lesson.id);
                              setView("content");
                            }
                          }}
                          disabled={!lesson.is_unlocked}
                          className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border transition-all ${
                            isCompleted
                              ? "bg-green-50 border-green-400 text-green-700"
                              : isActive
                              ? "bg-gray-100 border-gray-300"
                              : "bg-white border-gray-200"
                          } ${
                            !lesson.is_unlocked
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <span className="font-medium text-sm">
                            Lesson {lesson.order_index}: {lesson.title}
                          </span>
                          {isCompleted && (
                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-green-500 text-white text-[10px]">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">
                    Select a module to view lessons.
                  </p>
                )}
              </motion.div>
            )}

            {view === "content" && (
              <motion.div
                key="content"
                variants={fadeSlide}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <h1 className="text-2xl font-bold mb-6">Lesson Content</h1>
                {!selectedLesson ? (
                  <p className="text-gray-400 italic">
                    Select a lesson to view its content.
                  </p>
                ) : loadingContent ? (
                  <p className="text-gray-500">Loading lesson content...</p>
                ) : lessonContent ? (
                  <div className="space-y-2">
                    {lessonContent.videos?.length > 0 && (
                      <button className="w-full flex justify-between items-center px-4 py-3 rounded-xl border bg-white hover:bg-green-50 transition-all">
                        <span className="flex items-center gap-2 font-semibold text-sm">
                          🎬 Video Lesson
                        </span>
                        <span className="text-xs text-gray-500">
                          {lessonContent.videos.length} file(s)
                        </span>
                      </button>
                    )}
                    {lessonContent.slides?.length > 0 && (
                      <button className="w-full flex justify-between items-center px-4 py-3 rounded-xl border bg-white hover:bg-blue-50 transition-all">
                        <span className="flex items-center gap-2 font-semibold text-sm">
                          📑 Slides
                        </span>
                        <span className="text-xs text-gray-500">
                          {lessonContent.slides.length} file(s)
                        </span>
                      </button>
                    )}
                    {lessonContent.flashcards?.length > 0 && (
                      <button className="w-full flex justify-between items-center px-4 py-3 rounded-xl border bg-white hover:bg-yellow-50 transition-all">
                        <span className="flex items-center gap-2 font-semibold text-sm">
                          🧠 Flashcards
                        </span>
                        <span className="text-xs text-gray-500">
                          {lessonContent.flashcards.length} card(s)
                        </span>
                      </button>
                    )}
                    {lessonContent.questions?.length > 0 && (
                      <button className="w-full flex justify-between items-center px-4 py-3 rounded-xl border bg-white hover:bg-purple-50 transition-all">
                        <span className="flex items-center gap-2 font-semibold text-sm">
                          ❓ Questions
                        </span>
                        <span className="text-xs text-gray-500">
                          {lessonContent.questions.length} question(s)
                        </span>
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    No content found for this lesson.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
