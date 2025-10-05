"use client"

import React from "react"

interface Lesson {
  id: string
  title: string
  intro?: string
  video_url?: string
  order_index?: number
}

export default function LessonCard({ lesson }: { lesson: Lesson }) {
  return (
    <div className="border p-2 rounded">
      <h4 className="font-semibold">{lesson.title}</h4>
      {lesson.intro && <p className="text-sm text-gray-600">{lesson.intro}</p>}
    </div>
  )
}
