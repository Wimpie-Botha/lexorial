"use client"

import type { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function Modal({
  show,
  onClose,
  title,
  children,
}: {
  show: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="bg-white rounded-xl p-6 w-96 shadow-lg"
          >
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
