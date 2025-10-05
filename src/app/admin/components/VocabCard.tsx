"use client"

import React from "react"

interface VocabProps {
  vocab: {
    id: number | string
    word: string
    translation: string
  }
  onDelete?: (id: number | string) => void
}

export default function VocabCard({ vocab, onDelete }: VocabProps) {
  return (
    <div className="flex justify-between items-center border-b py-1">
      <p className="text-gray-800">
        <span className="font-semibold">{vocab.word}</span> → {vocab.translation}
      </p>
      <div className="flex gap-2">
        <button className="text-sm text-yellow-600 hover:underline">Edit</button>
        <button
          className="text-sm text-red-600 hover:underline"
          onClick={() => onDelete && onDelete(vocab.id)}
        >
          Delete
        </button>
      </div>
    </div>
  )
}
