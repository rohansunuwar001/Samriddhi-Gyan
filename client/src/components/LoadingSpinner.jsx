import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 font-sans">
      <div className="relative flex flex-col items-center">
        {/* Ambient background glow */}
        <div className="absolute -top-4 w-24 h-24 bg-blue-400/10 rounded-full blur-xl animate-pulse" />

        {/* Animated Book Icon */}
        <motion.div
          animate={{
            y: [0, -8, 0],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10 flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-xl shadow-blue-100/40 border border-slate-100 text-blue-600"
        >
          <BookOpen className="h-10 w-10 stroke-[1.75]" />
          
          {/* Small decorative spark/star animation */}
          <motion.div 
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-3 right-3 w-2 h-2 bg-amber-400 rounded-full"
          />
        </motion.div>

        {/* Text Presentation */}
        <h3 className="mt-6 text-3xl font-light text-slate-800 tracking-tight">
          Preparing your classroom
        </h3>
        <p className="mt-1.5 text-lg font-extralight text-slate-500">
          Gathering lessons and materials...
        </p>

        {/* Modern Infinite Progress Line */}
        <div className="mt-6 w-48 h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
          <motion.div
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{
              duration: 1.75,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative h-full w-1/2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
          />
        </div>
      </div>
    </div>
  )
}

export default LoadingSpinner