"use client";
import React from 'react'
import { motion } from 'framer-motion'
import { Sparkle, Moon, Star, Feather, Wand2, Gem } from 'lucide-react'
const ITEMS = [
  {
    Icon: Sparkle,
    top: '12%',
    left: '6%',
    size: 18,
    dur: 6,
    delay: 0,
  },
  {
    Icon: Moon,
    top: '22%',
    right: '8%',
    size: 22,
    dur: 8,
    delay: 0.4,
  },
  {
    Icon: Star,
    top: '70%',
    left: '4%',
    size: 14,
    dur: 5,
    delay: 1.1,
  },
  {
    Icon: Feather,
    top: '82%',
    right: '12%',
    size: 20,
    dur: 7,
    delay: 0.6,
  },
  {
    Icon: Wand2,
    top: '45%',
    right: '3%',
    size: 18,
    dur: 9,
    delay: 0.2,
  },
  {
    Icon: Gem,
    top: '55%',
    left: '5%',
    size: 16,
    dur: 7.5,
    delay: 1.5,
  },
  {
    Icon: Sparkle,
    top: '8%',
    right: '40%',
    size: 12,
    dur: 4.5,
    delay: 0.9,
  },
  {
    Icon: Star,
    top: '90%',
    left: '45%',
    size: 12,
    dur: 5.5,
    delay: 0.3,
  },
] as const
export function FloatingDecor() {
  return (
    <div
      className="z-0 fixed inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {ITEMS.map((item, i) => {
        const { Icon, size, dur, delay } = item
        const style: React.CSSProperties = {
          top: item.top,
          left: 'left' in item ? (item as any).left : undefined,
          right: 'right' in item ? (item as any).right : undefined,
        }
        return (
          <motion.div
            key={i}
            style={style}
            className="absolute text-gold"
            animate={{
              y: [0, -12, 0, 8, 0],
              rotate: [0, 8, -6, 4, 0],
              opacity: [0.25, 0.55, 0.25],
            }}
            transition={{
              duration: dur,
              delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Icon size={size} strokeWidth={1.5} />
          </motion.div>
        )
      })}
    </div>
  )
}
