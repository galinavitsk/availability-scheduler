"use client"
import 'rpg-awesome/css/rpg-awesome.min.css'
import React, { useMemo, useState, useRef,  ComponentType, useEffect } from 'react'
import { redirect, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  ScrollText,
  Sparkles as SparkIcon,
  CheckCircle2,
  Send,
  Castle,
  Eraser,
  Swords,
  HelpCircle,
  Shield,
  Wand2,
} from 'lucide-react'
import dayjs from 'dayjs'
import tzPlugin from 'dayjs/plugin/timezone'
import utcPlugin from 'dayjs/plugin/utc'

dayjs.extend(utcPlugin)
dayjs.extend(tzPlugin)

const TIMEZONES = Intl.supportedValuesOf('timeZone')

function convertTime(timeStr: string, fromTz: string, toTz: string, refDate: string) {
  return dayjs.tz(`${refDate} ${timeStr}`, fromTz).tz(toTz).format('h:mm A')
}
import { SessionRow } from './SessionRow'
import { SearchableSelect } from '@/app/components/SearchableSelect'
import { generateSlots } from '@/app/lib/availability';
import { GetSession,SaveAvailability,GetAllAvailabilities,UpdateAvailability } from '@/app/api/selector';
import { ApiStatus } from '@/app/types/ApiResponse';
import { toast } from 'react-toastify';
type Brush = Status | 'erase'
interface SelectorPageProps {
  session: Session
  previousAvailabilities: any
}


const SLOT_MINUTES = 30


const HEROIC_CLASSES = [
  'ra-fairy-wand',
  'ra-horn-call',
  'ra-heavy-shield',
  'ra-cloak-and-dagger',
  'ra-crossbow',
  'ra-angel-wings',
  'ra-leaf',
  'ra-arcane-mask',
  'ra-lightning-bolt',
  'ra-axe-swing',
  'ra-crossed-swords',
  'ra-hand',
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
export function SelectorPage({
  session,
  previousAvailabilities
}: SelectorPageProps) {
  useEffect(() => {
    
  })
  const [name, setName] = useState('')
  const [duplicateName, setDuplicateName] = useState(false)
  const [updating, setUpdating] = useState(false)

  const [heroClass, setHeroClass] = useState('ra-fairy-wand')
  const [localTimezone, setLocalTimezone] = useState(() => dayjs.tz.guess())

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
    () => Array.from(session?.selectedDates||[]).sort(),
    [session],
  )
  const startTime = useMemo(() => session?.startTime, [session])
  const endTime = useMemo(() => session?.endTime, [session])

  const timezone = useMemo(() => session?.timezone, [session])

  const slots = useMemo(
    () => generateSlots(startTime,endTime),
    [startTime,endTime],
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
    if(updating){
      UpdateAvailability(previousAvailabilities.find((av:any) => av.name === name).id, slotsByDate).then((res:any) => {
        if (res.error) {
          toast.error(res.error)
        }
      })
      return;
    }
    SaveAvailability(session, name, heroClass, slotsByDate, localTimezone).then((res:any) => {
      if (res.status===ApiStatus.Failure) {
        toast.error(res.error)
      }
    })
    //redirect(`/council/${session?.slug}`)
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
          <button onClick={() => redirect('/setup')} className="btn-primary">
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
              {convertTime(startTime, timezone, localTimezone, sortedDates[0] ?? dayjs().format('YYYY-MM-DD'))}
            </span>
            {' '}–{' '}
            <span className="font-bold text-burgundy not-italic">
              {convertTime(endTime, timezone, localTimezone, sortedDates[0] ?? dayjs().format('YYYY-MM-DD'))}
            </span>
            {localTimezone !== timezone && (
              <span className="text-ink-light/60"> ({localTimezone.replaceAll('_', ' ')})</span>
            )}
            {'. '}Choose a brush, then paint each half-hour with thy fate.
          </p>
        </div>

        <div className="flex sm:flex-row flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1.5 font-heading font-bold text-ink-light text-xs">
              <User size={12} /> Hero Name
            </label>
            <input
              type="text"
              disabled={updating}
              value={name}
              onChange={(e) => {
                if(previousAvailabilities.map((a: any) => a.name).includes(e.target.value)){
                  setDuplicateName(true)
                }
                setName(e.target.value)
              }}
              placeholder="Anonymous Adventurer"
              className="w-48 input-fantasy"
            />
            <span className="text-xs">{duplicateName && <>Name already taken! <br/>
            <a className="text-burgundy underline cursor-pointer"
            onClick={() => {
              const prevAvailability = previousAvailabilities.find((a:any) => a.name === name)
              if (prevAvailability) {
                setHeroClass(prevAvailability.heroClass)
                setLocalTimezone(prevAvailability.localTimezone)
                const convertedSlotsByDate: Record<string, Map<number, Status>> = {}
                for (const [date, slots] of Object.entries(prevAvailability.slotsByDate)) {
                  const convertedSlots = new Map()
                  for (const [slot, status] of Object.entries(slots || {})) {
                    convertedSlots.set(Number(slot), status)
                  }
                  convertedSlotsByDate[date] = convertedSlots
                }
                setSlotsByDate(convertedSlotsByDate)
                setDuplicateName(false);
                setUpdating(true)
              }
             }}
            >Load previous commitment</a></> } </span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-heading font-bold text-ink-light text-xs">Icon</label>
            <div className="gap-1 grid grid-cols-6">
              {HEROIC_CLASSES.map((icon) => (
                <motion.button
                  key={icon}
                  disabled={previousAvailabilities?.map((a:any) => a.heroClass).includes(icon) || updating}
                  type="button"
                  onClick={() => setHeroClass(icon)}
                  whileHover={{ scale: previousAvailabilities?.map((a:any) => a.heroClass).includes(icon) || updating ? 1 : 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  className={`flex items-center justify-center w-8 h-8 rounded border-2 transition-all ${heroClass === icon ? 'bg-burgundy border-gold text-gold shadow-[0_0_8px_rgba(184,134,11,0.5)]' : 'bg-parchment-base border-gold-light/30 text-ink-light hover:border-gold hover:text-burgundy'}
                    ${(previousAvailabilities?.map((a:any) => a.heroClass).includes(icon) || updating) && 'opacity-50 cursor-not-allowed border--gold-light/30 text-ink-light'}`}
                >
                  <i className={`ra ${icon}`} style={{ fontSize: '0.9rem' }} />
                </motion.button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1.5 font-heading font-bold text-ink-light text-xs">
              Your Timezone
            </label>
            <div className="w-48">
              <SearchableSelect value={localTimezone} onChange={setLocalTimezone} options={TIMEZONES} disabled = {updating}/>
            </div>
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
            eventTimezone={timezone}
            localTimezone={localTimezone}
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
          disabled={totals.pledgedDays === 0 && totals.noHours === 0 || duplicateName}
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
                {name || 'Brave adventurer'}, your pledge has been recorded.
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
  const { slug } = useParams<{ slug: string }>()
  const [session, setSession] = useState<Session>({} as Session)
  const [previousAvailabilities, setPreviousAvailabilities] = useState<any>()
  
  useEffect(() => {
    if (slug) {
      GetSession(slug).then((res:any) => {
        GetAllAvailabilities(slug).then((res:any) => {
          if(res.status === ApiStatus.Success) {
            setPreviousAvailabilities(res.data)
          }
        })
        if(res.status === ApiStatus.Success) {
          setSession(res.data)
        }
        else{
          redirect('/')
        }
      })
    }
  },[slug])
  return (
    <SelectorPage
      session={session}
      previousAvailabilities={previousAvailabilities}
    />
  )
}