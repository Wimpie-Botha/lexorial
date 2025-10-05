"use client"

import HomeMenu from "@/components/HomeMenu"
import BurgerMenu from "@/components/BurgerMenu"
import LearnerProgress from "@/components/LearnerProgress"
import { useState } from "react"

export const metadata = {
  title: 'Home',
}

export default function HomeAuthPage() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <BurgerMenu isOpen={open} onToggle={setOpen} />
      <LearnerProgress open={open} onClose={() => setOpen(false)} />
      <HomeMenu />
    </>
  )
}
