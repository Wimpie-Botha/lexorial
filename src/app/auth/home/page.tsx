"use client"

import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import BurgerMenu from "@/components/BurgerMenu"
import LearnerProgress from "@/components/LearnerProgress"
import { Lock, LogOut } from "lucide-react"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation" //  Added for redirect after logout

interface Module {
  id: string
  title: string
  description?: string
}

interface Lesson {
  id: string
  module_id: string
  title: string
  intro?: string
}

interface UserProgress {
  module_id: string
  lesson_id: string
  completed: boolean
}

export default function HomePage() {
  const [open, setOpen] = useState(false)
  const [modules, setModules] = useState<Module[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<UserProgress[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter() //  For navigation

  // 🧠 Load Authenticated User
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (!error && data?.user) {
        setUser(data.user)
        setUserId(data.user.id)
        console.log("Logged in as:", data.user.email)
      } else {
        console.warn("No active session found.")
        router.push("/auth/login") // Redirect to login if no session
      }
    }

    fetchUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setUserId(session.user.id)
      } else {
        setUser(null)
        setUserId(null)
        router.push("/auth/login") // Redirect on logout
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  // 📦 Load Modules
  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase.from("modules").select("*").order("id")
      if (error) console.error("Error loading modules:", error)
      else setModules(data || [])
    }
    fetchModules()
  }, [])

  // 📊 Load User Progress
  useEffect(() => {
    if (!userId) return
    const fetchProgress = async () => {
      const { data, error } = await supabase
        .from("user_progress")
        .select("module_id, lesson_id, completed")
        .eq("user_id", userId)
      if (error) console.error("Error loading progress:", error)
      else setProgress(data || [])
      setLoading(false)
    }
    fetchProgress()
  }, [userId])

  // 📚 Load Lessons for Selected Module
  useEffect(() => {
    if (!selectedModule) return
    const fetchLessons = async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", selectedModule)
        .order("order_index", { ascending: true })
      if (error) console.error("Error loading lessons:", error)
      else setLessons(data || [])
    }
    fetchLessons()
  }, [selectedModule])

  // 🧩 Determine if module is unlocked
  const isModuleUnlocked = (moduleId: string): boolean => {
    return progress.some((p) => p.module_id === moduleId)
  }

  // 🧩 Determine if lesson is completed
  const isLessonCompleted = (lessonId: string): boolean => {
    return progress.some((p) => p.lesson_id === lessonId && p.completed)
  }

  // 🧩 Mark Lesson Placeholder (for future)
  const markLessonComplete = async (lessonId: string) => {
    console.log("TODO: mark lesson as complete in Supabase:", lessonId)
    // Future implementation: call Supabase function to update progress
  }

  return (
    <div className="p-10">
      <BurgerMenu side="left" isOpen={open} onToggle={setOpen} />
      <LearnerProgress side="left" open={open} onClose={() => setOpen(false)} />

      {/* 🔹 User Info Bar */}
      {user && (
        <div className="flex justify-between items-center mb-6 bg-gray-100 px-4 py-3 rounded-md shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center font-semibold">
              {user.email?.[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">{user.email}</p>
              <p className="text-xs text-gray-500">Signed in</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push("/auth/login") //Redirect to login page
            }}
            className="flex items-center text-sm text-red-500 hover:text-red-600 transition"
          >
            <LogOut size={16} className="mr-1" /> Log out
          </button>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-4">Welcome Home!</h1>
      <p className="text-gray-700 mb-6">
        You are now logged in to the Afrikaans learning platform. 🎉
      </p>

      {/* 3-column layout */}
      <div className="grid grid-cols-3 gap-4">
        {/* LEFT COLUMN — MODULES */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Modules</h2>
          <div className="flex flex-col">
            {loading ? (
              <p className="text-gray-500">Loading modules...</p>
            ) : (
              modules.map((mod) => {
                const unlocked = isModuleUnlocked(mod.id)
                return (
                  <button
                    key={mod.id}
                    onClick={() => unlocked && setSelectedModule(mod.id)}
                    disabled={!unlocked}
                    className={`relative group text-left flex justify-between items-center px-3 py-2 border border-gray-300 rounded-md transition-all duration-150 active:scale-[0.97]
                      ${
                        selectedModule === mod.id
                          ? "bg-gray-200"
                          : unlocked
                          ? "bg-gray-50 hover:bg-gray-100"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    style={{ minHeight: "50px" }}
                  >
                    <div className="flex items-center gap-2">
                      {!unlocked && <Lock size={14} className="text-gray-500" />}
                      <h3 className="font-bold text-sm">{mod.title}</h3>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN — LESSONS */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Lessons</h2>
          <div className="flex flex-col">
            {selectedModule ? (
              lessons.length > 0 ? (
                lessons.map((lesson, index) => {
                  const prevLessonCompleted =
                    index === 0 ||
                    progress.some(
                      (p) =>
                        p.lesson_id === lessons[index - 1]?.id && p.completed
                    )

                  const isUnlocked = prevLessonCompleted
                  const isCompleted = isLessonCompleted(lesson.id)

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => isUnlocked && setSelectedLesson(lesson.id)}
                      disabled={!isUnlocked}
                      className={`relative group text-left flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md transition-all duration-150 active:scale-[0.97]
                        ${
                          selectedLesson === lesson.id
                            ? "bg-gray-200"
                            : isUnlocked
                            ? "bg-gray-50 hover:bg-gray-100"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      style={{ minHeight: "50px" }}
                    >
                      <div className="flex items-center gap-2">
                        {!isUnlocked && (
                          <Lock size={14} className="text-gray-500" />
                        )}
                        <h4 className="font-bold text-sm">{lesson.title}</h4>
                      </div>

                      {/*  Tiny Green Dot for Completed Lessons */}
                      {isCompleted && (
                        <span className="w-2 h-2 bg-green-500 rounded-full inline-block mr-1"></span>
                      )}
                    </button>
                  )
                })
              ) : (
                <p className="text-gray-500 text-sm italic">
                  No lessons found for this module.
                </p>
              )
            ) : (
              <p className="text-gray-400 text-sm italic">
                Select a module to view its lessons.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — CONTENT */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Lesson Content</h2>
          {selectedLesson ? (
            <p className="text-gray-700 text-sm">
              📘 You selected lesson{" "}
              <span className="font-semibold">{selectedLesson}</span>.  
              Lesson content (videos, slides, flashcards, etc.) will appear here.
            </p>
          ) : (
            <p className="text-gray-500 text-sm italic">
              Select a lesson to view its videos, slides, flashcards, and questions.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
