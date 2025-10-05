"use client"

import { useRouter } from "next/navigation"

export default function CoursesPage() {
  const router = useRouter()
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Courses</h1>
      <p className="mt-2 text-sm text-gray-600">Choose a course to start learning.</p>
      <ul className="mt-4 space-y-3">
        <li>
          <button onClick={() => router.push('/auth/home')} className="px-4 py-2 bg-black text-white rounded">Start Course: Afrikaans Basics</button>
        </li>
      </ul>
    </div>
  )
}
