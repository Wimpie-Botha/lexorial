"use client"

import { useRouter } from "next/navigation"

export default function QuestionsPage() {
  const router = useRouter()
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Initial Questions</h1>
      <p className="mt-2 text-sm text-gray-600">Answer a couple quick questions to tailor your course.</p>
      <div className="mt-6">
        <button onClick={() => router.push('/auth/courses')} className="px-4 py-2 bg-black text-white rounded">Continue to courses</button>
      </div>
    </div>
  )
}
