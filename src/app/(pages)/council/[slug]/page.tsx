"use client"
import React, { useEffect, useMemo, useState } from 'react'

import 'rpg-awesome/css/rpg-awesome.min.css'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Castle,
  Clock,
  Sparkles as SparkIcon,
  Crown,
  Hourglass,
  Calendar as CalIcon,
  CheckCircle2,
  Sword,
  Lock,
  Star,
  UserCheck,
  Minus,
  Plus,
} from 'lucide-react'
import {
  SLOT_MINUTES,
  generateSlots,
  minutesToTime12,
  formatDateParts,
  type Slot,
  type Status,
} from '@/app/lib/availability'
import { redirect, useParams } from 'next/navigation';
import { red } from 'next/dist/lib/picocolors';
import { ApiResponse, ApiStatus } from '@/app/types/ApiResponse';
import {GetAllAvailabilities, GetSession} from '@/app/api/selector'
interface CouncilPageProps {
}
interface Match {
  dateStr: string
  startMin: number
  endMin: number
  perfect: boolean // every counted hero is 'yes' for entire run
  attendees: string[] // members confirmed to count for this window
  memberStatuses: Record<string, Status[]>
}
const HOUR_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6,7,8]
interface FindRunsOpts {
  requiredMembers: Set<string>
  minPartySize: number
  includeMaybes: boolean
}

export function CouncilPage({
}: CouncilPageProps) {
  
  const { slug } = useParams<{ slug: string }>()
  const [desiredHours, setDesiredHours] = useState<number>(2)
  const [includeMaybes, setIncludeMaybes] = useState(false)
  const [requiredMembers, setRequiredMembers] = useState<Set<string>>(new Set())
  const [party, setParty]=useState<{name:string, icon:string}[]>([])
  const [minPartySize, setMinPartySize] = useState<number>(party.length)
  const [selectedDates, setSelectedDates] = useState<Set<string> | null>(null)
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('23:00')
  const [timeZone, setTimeZone] = useState('UTC')
  type PlayerAvailability = { localTimezone: string; slotsByDate: Record<string, Map<number, Status>> }
  const [partyStatuses, setPartyStatuses] = useState<Record<string, PlayerAvailability>>({})
  useEffect(() => {
    GetSession(slug).then((res:ApiResponse) => {
      if (res.status === ApiStatus.Success) {
        setStartTime(res.data.startTime)
        setEndTime(res.data.endTime)
        setSelectedDates(new Set(res.data.selectedDates))
        setTimeZone(res.data.timezone)
      }
    })
    GetAllAvailabilities(slug).then((res:ApiResponse) => {
      if (res.status === ApiStatus.Success) {
        setParty((res.data||[]).map((p:any) => ({name:p.name, icon:p.heroClass})))
        const processed: Record<string, PlayerAvailability> = {}
        for (const player of res.data||[]) {
          const slotsByDate: Record<string, Map<number, Status>> = {}
          for (const [date, rawSlots] of Object.entries(player.slotsByDate || {})) {
            const m = new Map<number, Status>()
            for (const [idx, status] of Object.entries(rawSlots as Record<string, Status>)) {
              m.set(Number(idx), status as Status)
            }
            slotsByDate[date] = m
          }
          processed[player.name] = { localTimezone: player.localTimezone, slotsByDate }
        }
        setPartyStatuses(processed)
      }
    })
  },[slug])
  const sortedDates = useMemo(
    () => Array.from(selectedDates||[]).sort(),
    [selectedDates],
  )

  function findRuns(
  slots: Slot[],
  partyStatuses: Record<string, PlayerAvailability>,
  date: string,
  opts: FindRunsOpts,
): {
  startIdx: number
  endIdx: number
  perfect: boolean
  attendees: string[]
}[] {
  const runs: {
    startIdx: number
    endIdx: number
    perfect: boolean
    attendees: string[]
  }[] = []
  // Helper to evaluate a single slot
  const evalSlot = (
    i: number,
  ): {
    ok: boolean
    attendees: string[]
    allYes: boolean
  } => {
    // Check required members (must be available)
    for (const reqName of opts.requiredMembers) {
      const s = partyStatuses[reqName]?.slotsByDate[date]?.get(i)
      if (s !== 'yes' && !(opts.includeMaybes && s === 'maybe')) {
        return {
          ok: false,
          attendees: [],
          allYes: false,
        }
      }
    }
    const attendees: string[] = []
    let allYes = true
    for (const p of party) {
      const s = partyStatuses[p.name]?.slotsByDate[date]?.get(i)
      if (s === 'yes') {
        attendees.push(p.name)
      } else if (opts.includeMaybes && s === 'maybe') {
        attendees.push(p.name)
        allYes = false
      }
    }
    if (attendees.length < opts.minPartySize) {
      return {
        ok: false,
        attendees: [],
        allYes: false,
      }
    }
    return {
      ok: true,
      attendees,
      allYes,
    }
  }
  let curStart: number | null = null
  let curPerfect = true
  let curAttendees = new Set<string>() // intersection across the run
  for (let i = 0; i < slots.length; i++) {
    const result = evalSlot(i)
    if (result.ok) {
      if (curStart === null) {
        curStart = i
        curPerfect = result.allYes
        curAttendees = new Set(result.attendees)
      } else {
        curPerfect = curPerfect && result.allYes
        // Keep only attendees who are available across all slots in the run
        curAttendees = new Set(
          [...curAttendees].filter((n) => result.attendees.includes(n)),
        )
      }
    } else {
      if (curStart !== null) {
        runs.push({
          startIdx: curStart,
          endIdx: i - 1,
          perfect: curPerfect,
          attendees: [...curAttendees],
        })
        curStart = null
        curPerfect = true
        curAttendees = new Set()
      }
    }
  }
  if (curStart !== null) {
    runs.push({
      startIdx: curStart,
      endIdx: slots.length - 1,
      perfect: curPerfect,
      attendees: [...curAttendees],
    })
  }
  return runs
}
function statusesForRun(
  startIdx: number,
  endIdx: number,
  partyStatuses: Record<string, PlayerAvailability>,
  date: string,
): Record<string, Status[]> {
  const out: Record<string, Status[]> = {}
  for (const p of party) {
    const arr: Status[] = []
    for (let i = startIdx; i <= endIdx; i++) {
      arr.push(partyStatuses[p.name]?.slotsByDate[date]?.get(i) ?? 'no')
    }
    out[p.name] = arr
  }
  return out
}
  const slots = useMemo(
    () => generateSlots(startTime, endTime),
    [startTime, endTime],
  )
  const toggleRequired = (name: string) => {
    setRequiredMembers((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      // Ensure minPartySize >= required + DM
      const reqCount = next.size// +1 for DM
      if (minPartySize < reqCount) setMinPartySize(reqCount)
      return next
    })
  }
  const minRequired = requiredMembers.size + 1 // DM always counted
  const maxParty = party.length
  const adjustMinSize = (delta: number) => {
    setMinPartySize((s) => Math.max(minRequired, Math.min(maxParty, s + delta)))
  }
  const matches = useMemo<Match[]>(() => {
    const requiredSlots = Math.ceil((desiredHours * 60) / SLOT_MINUTES)
    const out: Match[] = []
    for (const dateStr of sortedDates) {
      const runs = findRuns(slots, partyStatuses, dateStr, {
        requiredMembers,
        minPartySize,
        includeMaybes,
      })
      for (const run of runs) {
        const length = run.endIdx - run.startIdx + 1
        if (length >= requiredSlots) {
          out.push({
            dateStr,
            startMin: slots[run.startIdx].startMin,
            endMin: slots[run.endIdx].endMin,
            perfect: run.perfect && run.attendees.length === maxParty,
            attendees: run.attendees,
            memberStatuses: statusesForRun(
              run.startIdx,
              run.endIdx,
              partyStatuses,
              dateStr,
            ),
          })
        }
      }
    }
    out.sort((a, b) => {
      // Full party + perfect first, then by attendee count desc, then date
      if (a.perfect !== b.perfect) return a.perfect ? -1 : 1
      if (a.attendees.length !== b.attendees.length)
        return b.attendees.length - a.attendees.length
      if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr)
      return a.startMin - b.startMin
    })
    return out
  }, [
    sortedDates,
    slots,
    desiredHours,
    includeMaybes,
    requiredMembers,
    minPartySize,
    maxParty,
    partyStatuses,
  ])
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
            No Quests to Convene Upon
          </h2>
          <p className="mx-auto mb-6 max-w-md font-body text-ink-light italic">
            The Council has no sessions to deliberate. Begin by sealing dates in
            the Setup Chamber.
          </p>
          <button onClick={()=>{redirect("/setup")}} className="btn-primary">
            Visit the Setup Chamber
          </button>
        </div>
      </motion.div>
    )
  }

  function MatchCard({
  match,
  desiredHours,
  idx,
  requiredMembers,
}: {
  match: Match
  desiredHours: number
  idx: number
  requiredMembers: Set<string>
}) {
  const f = formatDateParts(match.dateStr)
  const durationHrs = (match.endMin - match.startMin) / 60
  const isPartial = match.attendees.length < party.length
  const missing = party.filter((p) => !match.attendees.includes(p.name))
  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        scale: 0.96,
      }}
      transition={{
        delay: 0.03 * Math.min(idx, 8),
        duration: 0.3,
      }}
      whileHover={{
        y: -3,
      }}
      className={`parchment-panel p-4 flex flex-col md:flex-row md:items-center gap-4 ${match.perfect ? 'ring-2 ring-offset-2 ring-offset-parchment-base ring-gold shadow-[0_0_18px_rgba(184,134,11,0.25)]' : ''}`}
    >
      {/* Date block */}
      <div className="flex flex-shrink-0 items-center gap-3 md:w-52">
        <div className="flex flex-col flex-shrink-0 justify-center items-center bg-parchment-base shadow-inner border-2 border-gold rounded-lg w-16 h-16">
          <span className="font-heading text-[10px] text-burgundy uppercase tracking-wider">
            {f.month}
          </span>
          <span className="font-heading font-bold text-burgundy text-2xl leading-none">
            {f.day}
          </span>
          <span className="font-heading text-[10px] text-ink-light">
            {f.weekday}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-heading font-bold text-ink text-sm leading-tight">
            {f.long}
          </span>
          <span className="flex items-center gap-1 font-body text-[11px] text-ink-light italic">
            <CalIcon size={10} />
            {durationHrs}h window
          </span>
        </div>
      </div>

      {/* Time range */}
      <div className="flex flex-col flex-1 gap-1.5">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-heading font-bold text-burgundy text-2xl">
            {minutesToTime12(match.startMin)}
          </span>
          <span className="font-heading text-ink-light">→</span>
          <span className="font-heading font-bold text-burgundy text-2xl">
            {minutesToTime12(match.endMin)}
          </span>
          {match.perfect ? (
            <span className="flex items-center gap-1 bg-emerald-800 px-2 py-0.5 border border-gold rounded-full font-heading font-bold text-[10px] text-parchment-light">
              <CheckCircle2 size={10} />
              Full party
            </span>
          ) : isPartial ? (
            <span className="bg-burgundy px-2 py-0.5 border border-gold rounded-full font-heading font-bold text-[10px] text-parchment-light">
              Short-handed: {match.attendees.length}/{party.length}
            </span>
          ) : (
            <span className="bg-gold px-2 py-0.5 border border-burgundy rounded-full font-heading font-bold text-[10px] text-ink">
              Some maybes
            </span>
          )}
        </div>
        <div className="font-body text-[11px] text-ink-light italic">
          {durationHrs > desiredHours
            ? `${(durationHrs - desiredHours).toFixed(1)}h of slack`
            : `Exactly ${desiredHours}h available`}
          {missing.length > 0 && (
            <>
              {' '}
              · without{' '}
              {missing.map((m, i) => (
                <span key={m.name}>
                  <span className="font-bold text-burgundy not-italic">
                    {m.name.split(' ')[0]}
                  </span>
                  {i < missing.length - 1 ? ', ' : ''}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Party attendance */}
      <div className="flex flex-col gap-1.5 md:w-52">
        <span className="font-heading text-[10px] text-ink-light/70 uppercase tracking-wider">
          Attendance
        </span>
        <div className="flex flex-wrap gap-1.5">
          {party.map((p) => {
            const attending = match.attendees.includes(p.name)
            const statuses = match.memberStatuses[p.name]
            const allYes = attending && statuses.every((s) => s === 'yes')
            const isRequired =  requiredMembers.has(p.name)
            return (
              <div
                key={p.name}
                title={`${p.name} — ${allYes ? 'fully available' : attending ? 'available (with maybes)' : 'not available'}${isRequired ? ' · required' : ''}`}
                className="relative"
              >
                <div
                  className={`w-9 h-9 rounded-full bg-parchment-base border-2 flex items-center justify-center text-base ${!attending ? 'border-burgundy/40 opacity-40 grayscale' : allYes ? 'border-emerald-700' : 'border-gold'}`}
                >
                  <i className={`ra ${p.icon}`} style={{ fontSize: '0.9rem' }} />
                </div>
                {/* Status dot */}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-parchment-light ${!attending ? 'bg-burgundy' : allYes ? 'bg-emerald-700' : 'bg-gold'}`}
                />
                {/* Required marker */}
                {isRequired && attending && (
                  <span className="-top-1 -left-1 absolute flex justify-center items-center bg-burgundy border border-gold rounded-full w-3.5 h-3.5">
                    <Star size={7} className="fill-gold text-gold" />
                  </span>
                )}
              </div>
            )
          })}
        </div>
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
      className="flex flex-col flex-1 gap-6 mx-auto p-4 md:p-6 w-full max-w-5xl"
    >
      {/* Header */}
      <motion.div
        initial={{
          x: -20,
          opacity: 0,
        }}
        animate={{
          x: 0,
          opacity: 1,
        }}
        className="flex flex-col gap-4 p-6 parchment-panel"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{
              rotate: [0, -6, 6, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-gold"
          >
            <Crown size={28} />
          </motion.div>
          <div>
            <h2 className="font-heading font-bold text-burgundy text-2xl">
              Council of Heroes
            </h2>
            <p className="font-body text-ink-light text-sm italic">
              Where the stars align — find every window when the party may
              convene.
            </p>
          </div>
        </div>

        <div className="gap-4 grid grid-cols-1 md:grid-cols-3 pt-4 border-gold-light/30 border-t">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 font-heading font-bold text-ink-light text-xs">
              <Hourglass size={12} /> Quest Length
            </label>
            <div className="flex flex-wrap gap-1.5">
              {HOUR_OPTIONS.map((h) => (
                <motion.button
                  key={h}
                  onClick={() => setDesiredHours(h)}
                  whileTap={{
                    scale: 0.92,
                  }}
                  whileHover={{
                    y: -1,
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-heading font-bold border-2 transition-all ${desiredHours === h ? 'bg-burgundy text-parchment-light border-gold shadow-[0_0_8px_rgba(184,134,11,0.4)]' : 'bg-parchment-base text-ink-light border-gold-light/40 hover:border-gold hover:text-burgundy'}`}
                >
                  {h}h
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 font-heading font-bold text-ink-light text-xs">
              <Users size={12} /> Min Party Size
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustMinSize(-1)}
                disabled={minPartySize <= minRequired}
                className="flex justify-center items-center bg-parchment-base hover:bg-burgundy disabled:opacity-40 border-2 border-burgundy rounded w-8 h-8 text-burgundy hover:text-parchment-light transition-colors disabled:cursor-not-allowed"
                aria-label="Decrease minimum party size"
              >
                <Minus size={14} />
              </button>
              <div className="flex-1 bg-parchment-base/60 px-2 py-1 border-2 border-gold-light/40 rounded text-center">
                <span className="font-heading font-bold text-burgundy text-xl">
                  {minPartySize}
                </span>
                <span className="font-heading text-ink-light text-xs">
                  {' '}
                  / {maxParty}
                </span>
              </div>
              <button
                onClick={() => adjustMinSize(1)}
                disabled={minPartySize >= maxParty}
                className="flex justify-center items-center bg-parchment-base hover:bg-burgundy disabled:opacity-40 border-2 border-burgundy rounded w-8 h-8 text-burgundy hover:text-parchment-light transition-colors disabled:cursor-not-allowed"
                aria-label="Increase minimum party size"
              >
                <Plus size={14} />
              </button>
            </div>
            <p className="font-body text-[10px] text-ink-light/70 italic">
              Allow short-handed sessions by lowering this.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-1.5 font-heading font-bold text-ink-light text-xs">
              <SparkIcon size={12} /> Tolerance
            </label>
            <button
              onClick={() => setIncludeMaybes((v) => !v)}
              className={`px-3 py-2 rounded text-sm font-heading font-bold border-2 transition-all text-left ${includeMaybes ? 'bg-gold/30 text-ink border-gold' : 'bg-parchment-base text-ink-light border-gold-light/40 hover:border-gold'}`}
            >
              {includeMaybes ? '✓ ' : ''}Accept "Maybes"
              <span className="block font-body font-normal text-[10px] text-ink-light/70 italic">
                Treat uncertain heroes as available
              </span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Party roster — required toggles */}
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
        className="flex flex-col gap-3 p-4 parchment-panel"
      >
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2 font-heading text-burgundy text-sm">
            <UserCheck size={16} className="text-gold" />
            <span className="font-bold">Mark heroes as required</span>
            <span className="font-body text-ink-light/80 text-xs italic">
              — they must be available for the session to count.
            </span>
          </div>
          {requiredMembers.size > 0 && (
            <button
              onClick={() => setRequiredMembers(new Set())}
              className="font-heading font-bold text-[10px] text-burgundy hover:underline uppercase tracking-wider"
            >
              Clear required
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Players — toggleable */}
          {party.map((p) => {
            const required = requiredMembers.has(p.name)
            return (
              <motion.button
                key={p.name}
                onClick={() => toggleRequired(p.name)}
                whileTap={{
                  scale: 0.95,
                }}
                whileHover={{
                  y: -1,
                }}
                className={`px-3 py-2 rounded-lg border-2 flex items-center gap-2 transition-all ${required ? 'bg-gold/30 border-gold text-ink shadow-[0_0_8px_rgba(184,134,11,0.3)]' : 'bg-parchment-base border-gold-light/40 text-ink-light hover:border-gold hover:text-burgundy'}`}
              >
                <span className="text-base leading-none">
                  <i className={`ra ${p.icon}`} style={{ fontSize: '0.9rem' }} /></span>
                <div className="flex flex-col text-left leading-tight">
                  <span className="flex items-center gap-1 font-heading font-bold text-xs">
                    {p.name}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-ink-light/70 italic">
                    {required ? (
                      <>
                        <Star
                          size={9}
                          className="fill-burgundy text-burgundy"
                        />
                        Required
                      </>
                    ) : (
                      <></>
                    )}
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Results header */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="flex items-center gap-2 font-heading font-bold text-burgundy text-lg">
          <Sword size={16} className="text-gold" />
          {matches.length === 0
            ? 'No windows found'
            : `${matches.length} window${matches.length === 1 ? '' : 's'} where the party may gather`}
        </h3>
        <span className="font-body text-ink-light text-xs italic">
          ≥ {desiredHours}h · ≥ {minPartySize}/{maxParty} heroes
          {requiredMembers.size > 0 &&
            ` · ${requiredMembers.size} required hero${requiredMembers.size === 1 ? '' : 'es'}`}
          {includeMaybes ? ' · maybes ok' : ''}
        </span>
      </div>

      {/* Results */}
      <AnimatePresence mode="popLayout">
        {matches.length === 0 ? (
          <motion.div
            key="empty"
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -10,
            }}
            className="p-8 text-center parchment-panel"
          >
            <motion.div
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="mx-auto mb-3 w-fit text-gold"
            >
              <Hourglass size={40} />
            </motion.div>
            <p className="mb-1 font-heading font-bold text-burgundy text-lg">
              The fates do not align.
            </p>
            <p className="mx-auto max-w-md font-body text-ink-light text-sm italic">
              No window of {desiredHours}h satisfies thy conditions. Try{' '}
              {!includeMaybes && (
                <>
                  <button
                    onClick={() => setIncludeMaybes(true)}
                    className="font-bold text-burgundy underline"
                  >
                    accepting "maybes"
                  </button>
                  ,{' '}
                </>
              )}
              {minPartySize > minRequired && (
                <>
                  <button
                    onClick={() => setMinPartySize(minRequired)}
                    className="font-bold text-burgundy underline"
                  >
                    allowing a smaller party
                  </button>
                  ,{' '}
                </>
              )}
              or shortening the quest.
            </p>
          </motion.div>
        ) : (
          <motion.div key="results" layout className="flex flex-col gap-3">
            {matches.map((m, i) => (
              <MatchCard
                key={`${m.dateStr}-${m.startMin}-${i}`}
                match={m}
                desiredHours={desiredHours}
                idx={i}
                requiredMembers={requiredMembers}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}


export default CouncilPage