"use client";
import React from 'react'
import { motion } from 'framer-motion'
interface SparklesProps {
  count?: number
  trigger: number // changing this re-fires the burst
}
export function Sparkles({ count = 6, trigger }: SparklesProps) {
  return (
    <div className="absolute inset-0 overflow-visible pointer-events-none">
      {Array.from({
        length: count,
      }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2
        const distance = 30 + Math.random() * 20
        const x = Math.cos(angle) * distance
        const y = Math.sin(angle) * distance
        return (
          <motion.div
            key={`${trigger}-${i}`}
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              opacity: 1,
            }}
            animate={{
              x,
              y,
              scale: [0, 1.2, 0],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 0.7,
              ease: 'easeOut',
              delay: i * 0.02,
            }}
            className="top-1/2 left-1/2 absolute w-1.5 h-1.5"
            style={{
              marginTop: -3,
              marginLeft: -3,
            }}
          >
            <div className="bg-gold shadow-[0_0_6px_rgba(184,134,11,0.9)] rounded-full w-full h-full" />
          </motion.div>
        )
      })}
    </div>
  )
}
