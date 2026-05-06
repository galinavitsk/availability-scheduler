import { minutesToTime12 } from "@/app/lib/availability";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useMemo } from "react";
import { STATUS_META } from "./page";

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return {
    weekday: date.toLocaleDateString('en-US', {
      weekday: 'short',
    }),
    long: date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
    month: date.toLocaleDateString('en-US', {
      month: 'short',
    }),
    day: date.getDate(),
  }
}
function mergeChunksByStatus(
  statusMap: Map<number, Status>,
  slots: {
    index: number
    startMin: number
    endMin: number
  }[],
) {
  const sortedIdx = Array.from(statusMap.keys()).sort((a, b) => a - b)
  const chunks: {
    start: number
    end: number
    status: Status
  }[] = []
  let cur: {
    start: number
    end: number
    status: Status
  } | null = null
  for (const idx of sortedIdx) {
    const s = slots[idx]
    if (!s) continue
    const status = statusMap.get(idx)!
    if (cur && cur.status === status && s.startMin === cur.end) {
      cur.end = s.endMin
    } else {
      if (cur) chunks.push(cur)
      cur = {
        start: s.startMin,
        end: s.endMin,
        status,
      }
    }
  }
  if (cur) chunks.push(cur)
  return chunks
}
export function SessionRow({
  date,
  idx,
  slots,
  statusMap,
  onSlotMouseDown,
  onSlotMouseEnter,
  onFill,
  onClear,
}: {
  date: string
  idx: number
  slots: {
    index: number
    startMin: number
    endMin: number
  }[]
  statusMap: Map<number, Status>
  onSlotMouseDown: (date: string, slotIdx: number) => void
  onSlotMouseEnter: (date: string, slotIdx: number) => void
  onFill: (status: Status) => void
  onClear: () => void
}) {
  const f = formatDate(date)
  const chunks = useMemo(
    () => mergeChunksByStatus(statusMap, slots),
    [statusMap, slots],
  )
  const hasAny = statusMap.size > 0
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: 0.04 * idx,
        duration: 0.3,
      }}
      className={`parchment-panel p-4 flex flex-col gap-3 ${hasAny ? 'ring-2 ring-offset-2 ring-offset-parchment-base ring-gold' : ''}`}
    >
      <div className="flex md:flex-row flex-col md:items-center gap-4">
        <div className="flex flex-shrink-0 items-center gap-3 md:w-56">
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
            <span className="font-heading font-bold text-ink leading-tight">
              {f.long}
            </span>
            <span className="flex items-center gap-1 font-body text-ink-light text-xs italic">
              <Clock size={10} />
              {minutesToTime12(slots[0]?.startMin ?? 0)} –{' '}
              {minutesToTime12(slots[slots.length - 1]?.endMin ?? 0)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:ml-auto">
          <button
            onClick={() => onFill('yes')}
            className="bg-emerald-800/15 px-2.5 py-1 border-2 border-emerald-800/40 rounded font-heading font-bold text-emerald-900 text-xs hover:scale-105 transition-transform"
          >
            All available
          </button>
          <button
            onClick={() => onFill('maybe')}
            className="bg-gold/20 px-2.5 py-1 border-2 border-gold/60 rounded font-heading font-bold text-ink text-xs hover:scale-105 transition-transform"
          >
            All maybe
          </button>
          <button
            onClick={() => onFill('no')}
            className="bg-burgundy/15 px-2.5 py-1 border-2 border-burgundy/40 rounded font-heading font-bold text-burgundy text-xs hover:scale-105 transition-transform"
          >
            All busy
          </button>
          <button
            onClick={onClear}
            className="bg-parchment-base px-2.5 py-1 border-2 border-gold-light/40 hover:border-gold rounded font-heading font-bold text-ink-light text-xs transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Slot grid */}
      <div className="select-none" onContextMenu={(e) => e.preventDefault()}>
        {/* Hour axis */}
        <div
          className="grid mb-1 font-heading text-[9px] text-ink-light/70"
          style={{
            gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))`,
          }}
        >
          {slots.map((s) => {
            const isHour = s.startMin % 60 === 0
            return (
              <div
                key={s.index}
                className={`text-center ${isHour ? '' : 'invisible'}`}
              >
                {isHour && minutesToTime12(s.startMin).replace(':00 ', '')}
              </div>
            )
          })}
        </div>

        {/* Slot cells */}
        <div
          className="gap-0.5 grid bg-parchment-base/50 border-2 border-gold-light/30 rounded-md overflow-hidden"
          style={{
            gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))`,
          }}
        >
          {slots.map((s) => {
            const status = statusMap.get(s.index)
            const isHourBoundary = s.startMin % 60 === 0
            const meta = status ? STATUS_META[status] : null
            return (
              <button
                key={s.index}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSlotMouseDown(date, s.index)
                }}
                onMouseEnter={() => onSlotMouseEnter(date, s.index)}
                onTouchStart={(e) => {
                  e.preventDefault()
                  onSlotMouseDown(date, s.index)
                }}
                className={`relative h-9 transition-colors ${meta ? meta.cellClass : 'bg-parchment-light hover:bg-gold/20'} ${isHourBoundary ? 'border-l-2 border-gold/40' : ''}`}
              >
                {meta && (
                  <span className="absolute inset-0 flex justify-center items-center">
                    <span className={`w-1 h-1 rounded-full ${meta.dot}`} />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected chunks summary */}
        <div className="flex flex-wrap gap-1.5 mt-2 min-h-[24px]">
          {chunks.length === 0 ? (
            <span className="font-body text-ink-light/70 text-xs italic">
              No hours marked — pick a brush above and paint your fate.
            </span>
          ) : (
            chunks.map((c, i) => {
              const meta = STATUS_META[c.status]
              const Icon = meta.icon
              return (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded-full text-xs font-heading font-bold border flex items-center gap-1 ${meta.pillClass}`}
                >
                  <Icon size={10} />
                  {minutesToTime12(c.start)} – {minutesToTime12(c.end)}
                </span>
              )
            })
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-2 font-body text-[10px] text-ink-light/70 italic">
          <span className="flex items-center gap-1">
            <span className="bg-emerald-800 border border-gold rounded-sm w-3 h-3" />{' '}
            available
          </span>
          <span className="flex items-center gap-1">
            <span className="bg-gold border border-burgundy rounded-sm w-3 h-3" />{' '}
            maybe
          </span>
          <span className="flex items-center gap-1">
            <span className="bg-burgundy border border-gold rounded-sm w-3 h-3" />{' '}
            unavailable
          </span>
          <span className="flex items-center gap-1">
            <span className="bg-gold/30 border border-gold/40 rounded-sm w-3 h-3" />{' '}
            party gathered
          </span>
        </div>
      </div>
    </motion.div>
  )
}