"use client";
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Castle,
  Sparkles as SparkIcon,
  Star,
} from 'lucide-react'
import { Sparkles } from '../../components/Sparkles'
interface CalendarProps {
  selectedDates: Set<string>
  toggleDate: (dateStr: string) => void
  currentMonth: Date
  setCurrentMonth: (date: Date) => void
}
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CIVIL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
export function Calendar({
  selectedDates,
  toggleDate,
  currentMonth,
  setCurrentMonth,
}: CalendarProps) {
  const [burstKey, setBurstKey] = useState<{
    key: string
    n: number
  } | null>(null)
  const [direction, setDirection] = useState(1)
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const handlePrevMonth = () => {
    setDirection(-1)
    setCurrentMonth(new Date(year, month - 1, 1))
  }
  const handleNextMonth = () => {
    setDirection(1)
    setCurrentMonth(new Date(year, month + 1, 1))
  }
  const handleToday = () => {
    setDirection(0)
    setCurrentMonth(new Date())
  }
  const formatDate = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const handleCellClick = (dateStr: string) => {
    toggleDate(dateStr)
    if (!selectedDates.has(dateStr)) {
      setBurstKey({
        key: dateStr,
        n: Date.now(),
      })
    }
  }
  // Generate calendar grid
  const grid: {
    day: number
    isCurrentMonth: boolean
    dateStr: string
    dayOfWeek: number
  }[] = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    const d = daysInPrevMonth - firstDayOfMonth + i + 1
    grid.push({
      day: d,
      isCurrentMonth: false,
      dateStr: formatDate(
        month === 0 ? year - 1 : year,
        month === 0 ? 11 : month - 1,
        d,
      ),
      dayOfWeek: i,
    })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push({
      day: i,
      isCurrentMonth: true,
      dateStr: formatDate(year, month, i),
      dayOfWeek: new Date(year, month, i).getDay(),
    })
  }
  const remainingCells = 42 - grid.length
  for (let i = 1; i <= remainingCells; i++) {
    grid.push({
      day: i,
      isCurrentMonth: false,
      dateStr: formatDate(
        month === 11 ? year + 1 : year,
        month === 11 ? 0 : month + 1,
        i,
      ),
      dayOfWeek: new Date(year, month + 1, i).getDay(),
    })
  }
  const todayStr = formatDate(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  )
  return (
    <motion.div
      initial={{
        y: 20,
        opacity: 0,
      }}
      animate={{
        y: 0,
        opacity: 1,
      }}
      transition={{
        delay: 0.2,
      }}
      className="flex flex-col flex-1 h-full parchment-panel"
    >
      {/* Calendar Header */}
      <div className="flex justify-between items-center bg-parchment-base/50 p-4 border-gold-light/30 border-b-2">
        <div className="flex items-center gap-2 w-[140px]">
          <button
            onClick={handleToday}
            className="px-3 py-1 text-sm btn-secondary"
          >
            Today
          </button>
          <div className="flex border border-burgundy rounded overflow-hidden">
            <motion.button
              whileTap={{
                scale: 0.9,
                x: -2,
              }}
              onClick={handlePrevMonth}
              className="bg-parchment-base hover:bg-burgundy px-2 py-1 text-burgundy hover:text-parchment-light transition-colors"
            >
              <ChevronLeft size={18} />
            </motion.button>
            <motion.button
              whileTap={{
                scale: 0.9,
                x: 2,
              }}
              onClick={handleNextMonth}
              className="bg-parchment-base hover:bg-burgundy px-2 py-1 border-burgundy border-l text-burgundy hover:text-parchment-light transition-colors"
            >
              <ChevronRight size={18} />
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-hidden">
          <motion.div
            animate={{
              y: [0, -3, 0],
              rotate: [0, -4, 4, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-gold"
          >
            <Castle size={24} />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${year}-${month}`}
              initial={{
                x: direction === 0 ? 0 : direction * 30,
                opacity: 0,
              }}
              animate={{
                x: 0,
                opacity: 1,
              }}
              exit={{
                x: -direction * 30,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: 'easeOut',
              }}
              className="text-center"
            >
              <h2 className="font-heading font-bold text-burgundy text-2xl leading-none tracking-wide">
                {CIVIL_MONTHS[month]} {year}
              </h2>
            </motion.div>
          </AnimatePresence>

          <motion.div
            animate={{
              y: [0, -3, 0],
              rotate: [0, 4, -4, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
            className="text-gold"
          >
            <Castle size={24} />
          </motion.div>
        </div>

        <div className="flex justify-end w-[140px]">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="text-gold/50"
          >
            <SparkIcon size={18} />
          </motion.div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex flex-col flex-1 bg-parchment-light/50 p-4">
        <div className="grid grid-cols-7 mb-2">
          {DAYS_OF_WEEK.map((day, idx) => (
            <div
              key={day}
              className={`text-center font-heading font-bold text-sm py-2 `}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 gap-1 grid grid-cols-7">
          {grid.map((cell, idx) => {
            const isSelected = selectedDates.has(cell.dateStr)
            const isToday = cell.dateStr === todayStr
            return (
              <motion.button
                key={`${cell.dateStr}-${idx}`}
                onClick={() => handleCellClick(cell.dateStr)}
                whileHover={{
                  scale: cell.isCurrentMonth ? 1.03 : 1,
                  rotate: cell.isCurrentMonth && !isSelected ? -1 : 0,
                }}
                whileTap={{
                  scale: 0.96,
                }}
                className={`
                  relative p-2 flex flex-col items-end justify-start min-h-[80px] border-2 rounded-md transition-colors duration-200 overflow-hidden
                  ${!cell.isCurrentMonth ? 'bg-parchment-dark/30 text-ink-light/40' : (!isSelected ? 'bg-parchment-base/80' : '')}
                  ${isSelected ? 'border-gold bg-burgundy text-parchment-light shadow-[inset_0_0_18px_rgba(184,134,11,0.35),0_0_10px_rgba(122,31,31,0.25)] z-10' : 'border-gold-light/20 hover:border-gold hover:bg-parchment-base hover:shadow-[0_0_10px_rgba(184,134,11,0.25)]'}
                  ${!isSelected && cell.isCurrentMonth ? 'bg-gold-light/15' : ''}
                  ${isToday && !isSelected ? 'ring-2 ring-burgundy ring-offset-1 ring-offset-parchment-light' : ''}
                `}
              >
                <span
                  className={`font-heading text-lg leading-none ${isSelected ? 'font-bold text-gold-light' : ''}`}
                >
                  {cell.day}
                </span>

                {isToday && !isSelected && (
                  <span className="top-1.5 left-1.5 absolute font-heading font-bold text-[9px] text-burgundy uppercase tracking-wider">
                    now
                  </span>
                )}

                {isSelected && (
                  <>
                    <motion.div
                      initial={{
                        scale: 0,
                        rotate: -180,
                      }}
                      animate={{
                        scale: 1,
                        rotate: 0,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 18,
                      }}
                      className="bottom-1.5 left-1.5 absolute text-gold"
                    >
                      <Star size={14} fill="currentColor" />
                    </motion.div>
                    <div className="top-1 right-1 absolute bg-gold opacity-80 rounded-full w-1.5 h-1.5" />
                    <div className="right-1 bottom-1 absolute bg-gold opacity-80 rounded-full w-1.5 h-1.5" />
                  </>
                )}

                {burstKey?.key === cell.dateStr && (
                  <Sparkles trigger={burstKey.n} />
                )}
              </motion.button>
            )
          })}
        </div>

        <div className="flex justify-center items-center gap-4 mt-3 font-body text-ink-light/70 text-xs italic">
          <span className="flex items-center gap-1.5">
            <span className="bg-burgundy border border-gold rounded-sm w-3 h-3" />
            sealed session
          </span>
        </div>
      </div>
    </motion.div>
  )
}
