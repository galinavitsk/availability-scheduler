"use client"
import React, { useMemo, useState, useRef, Component, ComponentType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  ScrollText,
  Sparkles as SparkIcon,
  CheckCircle2,
  Send,
  Castle,
  Clock,
  Eraser,
  Swords,
  HelpCircle,
  Shield,
  Wand2,
} from 'lucide-react'
import dayjs from 'dayjs';
import { SessionRow } from './SessionRow';
type Brush = Status | 'erase'
interface SelectorPageProps {
  selectedDates: Set<string>
  startTime: string
  endTime: string
  timezone: string
  templateDays: Set<number>
  onGoToSetup: () => void
}
const SLOT_MINUTES = 30

const HEROIC_CLASSES = [
  'Wizard',
  'Bard',
  'Paladin',
  'Rogue',
  'Ranger',
  'Cleric',
  'Druid',
  'Warlock',
  'Sorcerer',
  'Barbarian',
  'Fighter',
  'Monk',
]
export const STATUS_META: Record<
  Status,
  {
    label: string
    flavor: string
    icon: ComponentType<{
      size?: number
    }>
    brushClass: string
    cellClass: string
    pillClass: string
    dot: string
  }
> = {
  yes: {
    label: 'Available',
    flavor: 'I shall answer',
    icon: Swords,
    brushClass: 'bg-emerald-800 text-parchment-light border-gold',
    cellClass: 'bg-emerald-800 hover:bg-emerald-900',
    pillClass: 'bg-emerald-800 text-parchment-light border-gold',
    dot: 'bg-gold',
  },
  maybe: {
    label: 'Maybe',
    flavor: 'Fates permitting',
    icon: HelpCircle,
    brushClass: 'bg-gold text-ink border-burgundy',
    cellClass: 'bg-gold/80 hover:bg-gold',
    pillClass: 'bg-gold text-ink border-burgundy',
    dot: 'bg-burgundy',
  },
  no: {
    label: 'Unavailable',
    flavor: 'I am bound elsewhere',
    icon: Shield,
    brushClass: 'bg-burgundy text-parchment-light border-gold',
    cellClass: 'bg-burgundy hover:bg-burgundy-dark',
    pillClass: 'bg-burgundy text-parchment-light border-gold',
    dot: 'bg-gold',
  },
}
// ----- helpers -----
function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export function minutesToTime12(min: number) {
  const h24 = Math.floor(min / 60) % 24
  const m = min % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h = ((h24 + 11) % 12) + 1
  return `${h}:${String(m).padStart(2, '0')} ${period}`
}
function generateSlots(start: string, end: string) {
  const startMin = timeToMinutes(start)
  let endMin = timeToMinutes(end)
  if (endMin <= startMin) endMin += 24 * 60
  const slots: {
    index: number
    startMin: number
    endMin: number
  }[] = []
  for (let m = startMin, i = 0; m < endMin; m += SLOT_MINUTES, i++) {
    slots.push({
      index: i,
      startMin: m,
      endMin: m + SLOT_MINUTES,
    })
  }
  return slots
}


export function SelectorPage({
  selectedDates,
  startTime,
  endTime,
  timezone,
  onGoToSetup,
}: SelectorPageProps) {
  const [name, setName] = useState('')
  const [heroClass, setHeroClass] = useState('Wizard')
  // Per-date map of slotIndex -> Status
  const [slotsByDate, setSlotsByDate] = useState<
    Record<string, Map<number, Status>>
  >({})
  const [brush, setBrush] = useState<Brush>('yes')
  const [submitted, setSubmitted] = useState(false)
  // Drag state
  const dragModeRef = useRef<{
    action: 'paint' | 'erase'
    status: Status | null
  } | null>(null)
  const dragDateRef = useRef<string | null>(null)
  const sortedDates = useMemo(
    () => Array.from(selectedDates).sort(),
    [selectedDates],
  )
  const slots = useMemo(
    () => generateSlots(startTime, endTime),
    [startTime, endTime],
  )
  const updateSlots = (
    date: string,
    updater: (prev: Map<number, Status>) => Map<number, Status>,
  ) => {
    setSlotsByDate((prev) => {
      const cur = prev[date] ?? new Map<number, Status>()
      const next = updater(new Map(cur))
      return {
        ...prev,
        [date]: next,
      }
    })
  }
  const beginDrag = (date: string, slotIdx: number) => {
    const cur = slotsByDate[date] ?? new Map<number, Status>()
    const existing = cur.get(slotIdx)
    let mode: {
      action: 'paint' | 'erase'
      status: Status | null
    }
    if (brush === 'erase') {
      mode = {
        action: 'erase',
        status: null,
      }
    } else if (existing === brush) {
      // clicking same status -> erase
      mode = {
        action: 'erase',
        status: null,
      }
    } else {
      mode = {
        action: 'paint',
        status: brush,
      }
    }
    dragModeRef.current = mode
    dragDateRef.current = date
    applyDrag(date, slotIdx, mode)
  }
  const applyDrag = (
    date: string,
    slotIdx: number,
    mode: {
      action: 'paint' | 'erase'
      status: Status | null
    },
  ) => {
    updateSlots(date, (s) => {
      if (mode.action === 'erase') s.delete(slotIdx)
      else if (mode.status) s.set(slotIdx, mode.status)
      return s
    })
  }
  const continueDrag = (date: string, slotIdx: number) => {
    if (!dragModeRef.current || dragDateRef.current !== date) return
    applyDrag(date, slotIdx, dragModeRef.current)
  }
  const endDrag = () => {
    dragModeRef.current = null
    dragDateRef.current = null
  }
  const fillSession = (date: string, status: Status) => {
    updateSlots(date, () => {
      const m = new Map<number, Status>()
      slots.forEach((s) => m.set(s.index, status))
      return m
    })
  }
  const clearSession = (date: string) => {
    updateSlots(date, () => new Map())
  }
  const fillAll = (status: Status) => {
    const next: Record<string, Map<number, Status>> = {}
    sortedDates.forEach((d) => {
      const m = new Map<number, Status>()
      slots.forEach((s) => m.set(s.index, status))
      next[d] = m
    })
    setSlotsByDate(next)
  }
  const clearAll = () => setSlotsByDate({})
  const totals = useMemo(() => {
    let yesMin = 0,
      maybeMin = 0,
      noMin = 0
    let pledgedDays = 0
    sortedDates.forEach((d) => {
      const m = slotsByDate[d]
      if (m && m.size > 0) {
        let hasYesOrMaybe = false
        m.forEach((status) => {
          if (status === 'yes') {
            yesMin += SLOT_MINUTES
            hasYesOrMaybe = true
          } else if (status === 'maybe') {
            maybeMin += SLOT_MINUTES
            hasYesOrMaybe = true
          } else if (status === 'no') noMin += SLOT_MINUTES
        })
        if (hasYesOrMaybe) pledgedDays++
      }
    })
    return {
      pledgedDays,
      yesHours: yesMin / 60,
      maybeHours: maybeMin / 60,
      noHours: noMin / 60,
      unanswered: sortedDates.filter((d) => !slotsByDate[d]?.size).length,
    }
  }, [slotsByDate, sortedDates])
  const handleSubmit = () => {
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3500)
  }
  if (sortedDates.length === 0) {
    return (
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="flex flex-1 justify-center items-center mx-auto p-6 w-full max-w-2xl"
      >
        <div className="p-10 w-full text-center parchment-panel">
          <motion.div
            animate={{
              y: [0, -6, 0],
              rotate: [0, -4, 4, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="mx-auto mb-4 w-fit text-gold"
          >
            <Castle size={56} />
          </motion.div>
          <h2 className="mb-2 font-heading font-bold text-burgundy text-3xl">
            The Quest Awaits...
          </h2>
          <p className="mx-auto mb-6 max-w-md font-body text-ink-light italic">
            No sessions have been sealed yet. The Dungeon Master must first lay
            the campaign's foundations before brave souls may pledge their time.
          </p>
          <button onClick={onGoToSetup} className="btn-primary">
            Visit the Setup Chamber
          </button>
        </div>
      </motion.div>
    )
  }
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      className="flex flex-col flex-1 gap-6 mx-auto p-4 md:p-6 w-full max-w-5xl"
    >
      {/* Identity card */}
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
          delay: 0.05,
        }}
        className="flex md:flex-row flex-col md:items-end gap-4 p-6 parchment-panel"
      >
        <div className="flex flex-col flex-1 gap-1">
          <div className="flex items-center gap-2 text-burgundy">
            <ScrollText size={20} />
            <h2 className="font-heading font-bold text-xl">Pledge Thy Hours</h2>
          </div>
          <p className="font-body text-ink-light text-sm italic">
            The DM's window:{' '}
            <span className="font-bold text-burgundy not-italic">
              {minutesToTime12(timeToMinutes(startTime))}
            </span>{' '}
            –{' '}
            <span className="font-bold text-burgundy not-italic">
              {minutesToTime12(timeToMinutes(endTime))}
            </span>{' '}
            ({timezone.replace('_', ' ')}). Choose a brush, then paint each
            half-hour with thy fate.
          </p>
        </div>

        <div className="flex sm:flex-row flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1.5 font-heading font-bold text-ink-light text-xs">
              <User size={12} /> Hero Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anonymous Adventurer"
              className="w-48 input-fantasy"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-heading font-bold text-ink-light text-xs">
              Class
            </label>
            <select
              value={heroClass}
              onChange={(e) => setHeroClass(e.target.value)}
              className="w-36 input-fantasy"
            >
              {HEROIC_CLASSES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Brush toolbar */}
      <motion.div
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        transition={{
          delay: 0.1,
        }}
        className="top-20 z-30 sticky flex flex-col gap-3 p-4 parchment-panel"
      >
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2 font-heading text-ink-light text-sm">
            <SparkIcon size={14} className="text-gold" />
            Active brush:
          </div>
          <div className="flex flex-wrap gap-2">
            {(['yes', 'maybe', 'no'] as Status[]).map((s) => {
              const meta = STATUS_META[s]
              const Icon = meta.icon
              const active = brush === s
              return (
                <motion.button
                  key={s}
                  onClick={() => setBrush(s)}
                  whileTap={{
                    scale: 0.93,
                  }}
                  whileHover={{
                    y: -1,
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-heading font-bold border-2 transition-all flex items-center gap-1.5 ${active ? `${meta.brushClass} shadow-[0_0_12px_rgba(184,134,11,0.5)] scale-105` : 'bg-parchment-base text-ink-light border-gold-light/40 hover:border-gold hover:text-burgundy'}`}
                  title={meta.flavor}
                >
                  <Icon size={12} />
                  {meta.label}
                </motion.button>
              )
            })}
            <motion.button
              onClick={() => setBrush('erase')}
              whileTap={{
                scale: 0.93,
              }}
              whileHover={{
                y: -1,
              }}
              className={`px-3 py-1.5 rounded text-xs font-heading font-bold border-2 transition-all flex items-center gap-1.5 ${brush === 'erase' ? 'bg-ink text-parchment-light border-gold shadow-[0_0_12px_rgba(184,134,11,0.5)] scale-105' : 'bg-parchment-base text-ink-light border-gold-light/40 hover:border-gold hover:text-burgundy'}`}
            >
              <Eraser size={12} />
              Erase
            </motion.button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-gold-light/30 border-t">
          <span className="mr-1 font-heading text-ink-light/70 text-xs">
            All sessions:
          </span>
          <button
            onClick={() => fillAll('yes')}
            className="flex items-center gap-1 bg-emerald-800/15 px-2 py-1 border-2 border-emerald-800/40 rounded font-heading font-bold text-[11px] text-emerald-900 hover:scale-105 transition-transform"
          >
            <Wand2 size={10} /> All available
          </button>
          <button
            onClick={() => fillAll('maybe')}
            className="bg-gold/20 px-2 py-1 border-2 border-gold/60 rounded font-heading font-bold text-[11px] text-ink hover:scale-105 transition-transform"
          >
            All maybe
          </button>
          <button
            onClick={() => fillAll('no')}
            className="bg-burgundy/15 px-2 py-1 border-2 border-burgundy/40 rounded font-heading font-bold text-[11px] text-burgundy hover:scale-105 transition-transform"
          >
            All unavailable
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-1 bg-parchment-base px-2 py-1 border-2 border-gold-light/40 hover:border-gold rounded font-heading font-bold text-[11px] text-ink-light transition-colors"
          >
            <Eraser size={10} /> Clear all
          </button>
        </div>
      </motion.div>

      {/* Sessions */}
      <div className="flex flex-col gap-3">
        {sortedDates.map((date, idx) => (
          <SessionRow
            key={date}
            date={date}
            idx={idx}
            slots={slots}
            statusMap={slotsByDate[date] ?? new Map()}
            onSlotMouseDown={beginDrag}
            onSlotMouseEnter={continueDrag}
            onFill={(status) => fillSession(date, status)}
            onClear={() => clearSession(date)}
          />
        ))}
      </div>

      {/* Summary */}
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.2,
        }}
        className="bottom-4 z-20 sticky flex md:flex-row flex-col md:items-center gap-4 p-5 parchment-panel"
      >
        <div className="flex flex-wrap flex-1 gap-3">
          <Stat
            label="Sessions Pledged"
            value={totals.pledgedDays}
            variant="muted"
          />
          <Stat
            label="Available hrs"
            value={Number(totals.yesHours.toFixed(1))}
            variant="yes"
          />
          <Stat
            label="Maybe hrs"
            value={Number(totals.maybeHours.toFixed(1))}
            variant="maybe"
          />
          <Stat
            label="Unavailable hrs"
            value={Number(totals.noHours.toFixed(1))}
            variant="no"
          />
          {totals.unanswered > 0 && (
            <Stat
              label="Unanswered"
              value={totals.unanswered}
              variant="muted"
            />
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={totals.pledgedDays === 0 && totals.noHours === 0}
          className="flex items-center gap-2 btn-primary"
        >
          <Send size={16} />
          Submit Pledge
        </button>
      </motion.div>

      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="z-50 fixed inset-0 flex justify-center items-center bg-ink/60 backdrop-blur-sm p-4 pointer-events-none"
          >
            <motion.div
              initial={{
                scale: 0.6,
                rotate: -4,
                y: 20,
              }}
              animate={{
                scale: 1,
                rotate: 0,
                y: 0,
              }}
              exit={{
                scale: 0.7,
                opacity: 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 220,
                damping: 16,
              }}
              className="p-8 max-w-sm text-center parchment-panel"
            >
              <motion.div
                animate={{
                  rotate: [0, -8, 8, 0],
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 0.8,
                }}
                className="flex justify-center items-center bg-emerald-800 shadow-[0_0_20px_rgba(184,134,11,0.6)] mx-auto mb-3 border-4 border-gold rounded-full w-16 h-16 text-gold"
              >
                <CheckCircle2 size={28} />
              </motion.div>
              <h3 className="mb-1 font-heading font-bold text-burgundy text-xl">
                Pledge Recorded!
              </h3>
              <p className="font-body text-ink-light text-sm italic">
                {name || 'Brave adventurer'}
                {name ? `, ${heroClass.toLowerCase()},` : ''} the chronicler has
                inked thy hours into the campaign tome.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
// ----- Session row -----

function Stat({
  label,
  value,
  variant,
}: {
  label: string
  value: number
  variant: 'yes' | 'maybe' | 'no' | 'muted'
}) {
  const styles = {
    yes: 'text-emerald-900 bg-emerald-800/15 border-emerald-800/40',
    maybe: 'text-ink bg-gold/20 border-gold/60',
    no: 'text-burgundy bg-burgundy/15 border-burgundy/40',
    muted: 'text-ink-light bg-parchment-base border-gold-light/40',
  }[variant]
  return (
    <div
      className={`px-3 py-1.5 rounded border-2 flex items-center gap-2 font-heading ${styles}`}
    >
      <span className="font-bold text-lg">{value}</span>
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </div>
  )
}

export default function SelectorPageRoute() {
  const [selectedDates] = useState<Set<string>>(new Set(
    Array.from({ length: 7 }).map((_, i) => dayjs().add(i, 'day').format('YYYY-MM-DD')),
  ))
  const [startTime] = useState('19:00')
  const [endTime] = useState('23:00')
  const [timezone] = useState('America/New_York')
  return (
    <SelectorPage
      selectedDates={selectedDates}
      startTime={startTime}
      endTime={endTime}
      timezone={timezone}
      templateDays={new Set()}
      onGoToSetup={() => {}}
    />
  )
}