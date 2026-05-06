"use client";
import React from 'react'
import { Dices, Sparkles as SparkIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { redirect } from 'next/navigation';
export function TopNav() {
  return (
    <motion.header
      initial={{
        y: -20,
        opacity: 0,
      }}
      animate={{
        y: 0,
        opacity: 1,
      }}
      className="top-0 z-50 sticky backdrop-blur-sm border-gold-light/20 border-b-1 w-full"
    >
      <div className="flex justify-between items-center mx-auto px-4 max-w-7xl h-20">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{
              rotate: 360,
              scale: 1.1,
            }}
            transition={{
              duration: 0.6,
              ease: 'easeInOut',
            }}
            animate={{
              rotate: [0, -6, 6, -3, 0],
            }}
            // gentle idle wiggle
            // @ts-ignore
            transition2={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="bg-burgundy shadow-[0_0_12px_rgba(184,134,11,0.4)] p-2 border border-gold/60 rounded-lg text-gold cursor-pointer"
          onClick={()=>{redirect("/")}}
          >
            <Dices size={26} />
          </motion.div>
          <div className="flex flex-col leading-tight">
            <h1 className="flex items-center gap-2 font-heading font-bold text-burgundy text-2xl tracking-wide">
              Quest Scheduler
              <motion.span
                animate={{
                  rotate: [0, 20, -10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-gold"
              >
                <SparkIcon size={16} />
              </motion.span>
            </h1>
            <p className="font-body text-ink-light/80 text-xs italic">
              "Where heroes pencil in their bravery"
            </p>
          </div>
        </div>

        <nav className="flex items-end gap-1">
          <motion.button
                
                onClick={() => {redirect('/setup')}}
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  y: 0,
                  scale: 0.97,
                }}
                className={`relative px-4 py-2 font-heading text-lg transition-colors rounded-t-md border-b-2 border-transparent text-ink-light hover:text-burgundy hover:bg-parchment-base/30`}
              >
                Create New
              </motion.button>
        </nav>
      </div>
    </motion.header>
  )
}

