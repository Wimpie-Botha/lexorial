"use client"

import React from "react"

interface QuizProps {
  quiz: {
    id: number | string
    question_text: string
  }
  onDelete?: (id: number | string) => void
}

export default function QuizCard({ quiz, onDelete }: QuizProps) {
  return (
    <div className="flex justify-between items-center border-b py-1">
      <p>{quiz.question_text}</p>
      <div className="flex gap-2">
        <button className="text-sm text-yellow-600 hover:underline">Edit</button>
        <button
          className="text-sm text-red-600 hover:underline"
          onClick={() => onDelete && onDelete(quiz.id)}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
