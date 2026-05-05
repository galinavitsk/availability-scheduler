"use client"

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  Clock,
  CalendarDays,
  Scroll,
  Swords,
  Dice6,
  Sun,
  Moon,
  Sparkles as SparkIcon,
  Book,
} from 'lucide-react'

function SearchableSelect({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleFocus = () => {
    setRect(inputRef.current?.getBoundingClientRect() ?? null)
    setOpen(true)
  }

  const select = (tz: string) => {
    onChange(tz)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        className="w-full input-fantasy"
        value={open ? query : value.replaceAll('_', ' ')}
        placeholder={value.replaceAll('_', ' ')}
        onFocus={handleFocus}
        onChange={(e) => setQuery(e.target.value.replaceAll(' ', '_'))}
      />
      {open && rect && createPortal(
        <ul
          style={{ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width }}
          className="z-[9999] fixed bg-parchment-light shadow-lg border border-gold-light rounded max-h-52 overflow-y-auto scrollbar-hide"
        >
          {filtered.length === 0
            ? <li className="px-3 py-2 text-ink-light text-sm italic">No results</li>
            : filtered.map((tz) => (
              <li
                key={tz}
                onMouseDown={() => select(tz)}
                className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-gold/20 font-body ${tz === value ? 'text-burgundy font-semibold' : 'text-ink'}`}
              >
                {tz.replaceAll('_', ' ')}
              </li>
            ))
          }
        </ul>,
        document.body
      )}
    </div>
  )
}
const TIMEZONES = Intl.supportedValuesOf('timeZone')
const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5)

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hStr, mStr] = value.split(':')
  const h24 = parseInt(hStr) || 0
  const mins = parseInt(mStr) || 0
  const isPM = h24 >= 12
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24

  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const emit = (newH12: number, newMins: number, newIsPM: boolean) => {
    const next24 = (newH12 % 12) + (newIsPM ? 12 : 0)
    onChange(`${next24.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (!btnRef.current?.contains(t) && !dropdownRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const col = (items: (string | number)[], isSelected: (i: number) => boolean, onPick: (i: number) => void) => (
    <ul className="flex-1 max-h-44 overflow-y-auto scrollbar-hide">
      {items.map((item, i) => (
        <li
          key={item}
          onMouseDown={() => onPick(i)}
          className={`px-3 py-1.5 text-sm text-center cursor-pointer font-body hover:bg-gold/20 ${isSelected(i) ? 'text-burgundy font-semibold bg-gold/10' : 'text-ink'}`}
        >
          {item}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="w-full">
      <button
        ref={btnRef}
        type="button"
        onClick={() => { setRect(btnRef.current?.getBoundingClientRect() ?? null); setOpen(o => !o) }}
        className="w-full text-left input-fantasy"
      >
        {h12}:{mins.toString().padStart(2, '0')} {isPM ? 'PM' : 'AM'}
      </button>
      {open && rect && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width }}
          className="z-[9999] fixed flex bg-parchment-light shadow-lg border border-gold-light rounded divide-x divide-gold-light/40"
        >
          {col(HOURS, (i) => HOURS[i] === h12, (i) => emit(HOURS[i], mins, isPM))}
          {col(MINUTES.map(m => m.toString().padStart(2, '0')), (i) => MINUTES[i] === mins, (i) => emit(h12, MINUTES[i], isPM))}
          {col(['AM', 'PM'], (i) => (i === 1) === isPM, (i) => emit(h12, mins, i === 1))}
        </div>,
        document.body
      )}
    </div>
  )
}

interface SidebarProps {
  timezone: string
  setTimezone: (tz: string) => void
  startTime: string
  setStartTime: (time: string) => void
  endTime: string
  setEndTime: (time: string) => void
  eventName: string
  setEventName: (name: string) => void
  selectedDatesCount: number
  onClear: () => void
  onSave: () => void
}
export function Sidebar({
  timezone,
  setTimezone,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  eventName,
  setEventName,
  selectedDatesCount,
  onClear,
  onSave,
}: SidebarProps) {
  
  return (
    <motion.div
      initial={{
        x: -20,
        opacity: 0,
      }}
      animate={{
        x: 0,
        opacity: 1,
      }}
      transition={{
        delay: 0.1,
      }}
      className="flex flex-col gap-6 w-full lg:w-96"
    >
      <div className="flex flex-col gap-6 p-6 parchment-panel">
        <div className="flex items-center gap-2 pb-2 border-gold-light/30 border-b">
          <motion.div
            animate={{
              rotate: [0, -8, 8, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Scroll className="text-burgundy" size={20} />
          </motion.div>
          <h2 className="font-heading font-bold text-burgundy text-xl">
            Campaign Rules
          </h2>
        </div>

        {/* Event Name */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 font-heading font-bold text-ink-light text-sm">
            <Book size={16} /> Event Name
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="input-fantasy"
          />
        </div>
        {/* Timezone */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 font-heading font-bold text-ink-light text-sm">
            <Globe size={16} /> Realm Timezone
          </label>
          <SearchableSelect value={timezone} onChange={setTimezone} options={TIMEZONES} />
        </div>


        {/* Time Window */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 font-heading font-bold text-ink-light text-sm">
            <Clock size={16} /> Session Window
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Sun
                size={12}
                className="-top-1 -right-1 absolute text-gold pointer-events-none"
              />
              <TimeInput value={startTime} onChange={setStartTime} />
            </div>
            <span className="font-heading text-burgundy text-lg">→</span>
            <div className="relative flex-1">
              <Moon
                size={12}
                className="-top-1 -right-1 absolute text-gold pointer-events-none"
              />
              <TimeInput value={endTime} onChange={setEndTime} />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Panel */}
      <motion.div
        whileHover={{
          y: -3,
          rotate: -0.3,
        }}
        className="relative flex flex-col gap-4 p-6 parchment-panel"
      >
        {/* Sparkle decor */}
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="top-3 right-3 absolute text-gold/60"
        >
          <SparkIcon size={14} />
        </motion.div>

        <div className="text-center">
          <motion.div
            key={selectedDatesCount}
            initial={{
              scale: 0.6,
              opacity: 0,
              y: -10,
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 15,
            }}
            className="mb-1 font-heading font-bold text-burgundy text-5xl"
          >
            {selectedDatesCount}
          </motion.div>
          <div className="font-heading font-bold text-ink-light text-sm uppercase tracking-wider">
            {selectedDatesCount === 1
              ? 'Session Foretold'
              : 'Sessions Foretold'}
          </div>
        </div>

        <div className="bg-gradient-to-r from-transparent via-gold to-transparent opacity-60 my-1 w-full h-px" />

        <div className="flex flex-col gap-3">
          <motion.button
            onClick={onSave}
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.98,
            }}
            className="flex justify-center items-center gap-2 w-full btn-primary"
          >
            <Swords size={18} />
            Seal the Covenant
          </motion.button>
          <button onClick={onClear} className="w-full text-sm btn-secondary">
            Banish All Runes
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
