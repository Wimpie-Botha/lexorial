"use client"

import React, { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import LessonCard from "./LessonCard"
import Modal from "./Modal"

interface Lesson {
  id: string
  title: string
  intro?: string
  video_url?: string
  order_index?: number
}

interface Course {
  id: string
  title: string
  level: string
  description?: string
}

export default function CourseCard({ course }: { course: Course }) {
  const [open, setOpen] = useState(false)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLessons = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", course.id)
        .order("order_index", { ascending: true })

      if (error) {
        console.error(error)
        setLessons([])
      } else {
        setLessons((data as Lesson[]) || [])
      }
    } finally {
      setLoading(false)
    }
  }, [course.id])

  useEffect(() => {
    if (open) {
      fetchLessons()
    }
  }, [open, fetchLessons])

  return (
    <div className="border rounded p-4 shadow">
      <h2 className="text-xl font-semibold">{course.title}</h2>
      <p className="text-gray-600">Level: {course.level}</p>
      {course.description && <p className="mt-2">{course.description}</p>}

      <div className="mt-4 flex gap-2">
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={() => setOpen(true)}
        >
          View Lessons
        </button>
      </div>

      <Modal show={open} onClose={() => setOpen(false)} title="Lessons">
        <div className="p-4">
          {loading && <p>Loading...</p>}
          {!loading && lessons.length === 0 && <p>No lessons yet.</p>}
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
