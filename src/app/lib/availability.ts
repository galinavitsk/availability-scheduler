// Shared availability primitives used by Selector and Council pages.

export type Status = 'yes' | 'maybe' | 'no'

export const SLOT_MINUTES = 30

export type PartyRole = 'dm' | 'player'

export const PARTY = [
  {
    name: 'Mordrin the Loremaster',
    class: 'Dungeon Master',
    glyph: '👑',
    isYou: false,
    role: 'dm' as PartyRole,
  },
  {
    name: 'Kael Stormrider',
    class: 'Ranger',
    glyph: '🏹',
    isYou: true,
    role: 'player' as PartyRole,
  },
  {
    name: 'Eldrin the Wise',
    class: 'Wizard',
    glyph: '🧙',
    isYou: false,
    role: 'player' as PartyRole,
  },
  {
    name: 'Thora Ironheart',
    class: 'Paladin',
    glyph: '⚔️',
    isYou: false,
    role: 'player' as PartyRole,
  },
  {
    name: 'Pip Underfoot',
    class: 'Rogue',
    glyph: '🗡️',
    isYou: false,
    role: 'player' as PartyRole,
  },
] as const

export type PartyMember = (typeof PARTY)[number]

export function timeToMinutes(t: string) {
  const [h, m] = (t||'00:00').split(':').map(Number)
  return h * 60 + m
}

export function minutesToTime12(min: number) {
  const h24 = Math.floor(min / 60) % 24
  const m = min % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h = ((h24 + 11) % 12) + 1
  return `${h}:${String(m).padStart(2, '0')} ${period}`
}

export interface Slot {
  index: number
  startMin: number
  endMin: number
}

export function generateSlots(start: string, end: string): Slot[] {
  const startMin = timeToMinutes(start)
  let endMin = timeToMinutes(end)
  if (endMin <= startMin) endMin += 24 * 60
  const slots: Slot[] = []
  for (let m = startMin, i = 0; m < endMin; m += SLOT_MINUTES, i++) {
    slots.push({ index: i, startMin: m, endMin: m + SLOT_MINUTES })
  }
  return slots
}

// Deterministic, hand-tuned mock party statuses producing realistic test data.
// Each party member has a distinct availability "personality" and per-date variance.
//
// Test scenarios produced across multiple dates:
//  - Sessions where the FULL party (all 5) overlaps for ~3-4 hours.
//  - Sessions where only 3-4 heroes can attend (short-handed).
//  - Sessions where overlap requires accepting "maybes".
//  - Sessions where no overlap exists at all (worst-case fates).
export function mockPartyStatuses(
  dateStr: string,
  total: number,
): Record<string, Map<number, Status>> {
  const result: Record<string, Map<number, Status>> = {}
  if (total === 0) {
    PARTY.forEach((p) => (result[p.name] = new Map()))
    return result
  }

  // Date-based variant: cycles through 4 scenarios so testers see all cases.
  const dayNum = Number(dateStr.split('-')[2])
  const variant = dayNum % 4 // 0..3

  // Helper to fill a contiguous range with a status, respecting bounds.
  const fill = (
    map: Map<number, Status>,
    from: number,
    to: number,
    status: Status,
  ) => {
    const lo = Math.max(0, Math.floor((from / total) * total))
    const hi = Math.min(total, Math.ceil((to / total) * total))
    for (let i = lo; i < hi; i++) map.set(i, status)
  }

  // We work in normalized slot indices [0..total-1].
  // Patterns expressed as fractions of the window for portability across windows.
  const seg = (frac: number) => Math.round(frac * total)

  PARTY.forEach((p) => {
    const map = new Map<number, Status>()

    if (p.role === 'dm') {
      // DM: high availability. Full window minus a small dinner break.
      // Variant 3 = DM has a hard conflict in the middle (creates split windows).
      for (let i = 0; i < total; i++) map.set(i, 'yes')
      if (variant === 3) {
        for (let i = seg(0.4); i < seg(0.55); i++) map.set(i, 'no')
      } else {
        // small "dinner" maybe in the middle
        for (let i = seg(0.45); i < seg(0.5); i++) map.set(i, 'maybe')
      }
    } else if (p.name === 'Kael Stormrider') {
      // You — usually wide availability, an early errand on some days.
      for (let i = 0; i < total; i++) map.set(i, 'yes')
      if (variant === 0 || variant === 2) {
        for (let i = 0; i < seg(0.15); i++) map.set(i, 'no')
      }
      if (variant === 1) {
        // Late-night maybe
        for (let i = seg(0.85); i < total; i++) map.set(i, 'maybe')
      }
    } else if (p.name === 'Eldrin the Wise') {
      // Night owl — busy early, free in the evening.
      for (let i = 0; i < seg(0.3); i++) map.set(i, 'no')
      for (let i = seg(0.3); i < seg(0.45); i++) map.set(i, 'maybe')
      for (let i = seg(0.45); i < total; i++) map.set(i, 'yes')
      if (variant === 2) {
        // Off the grid this night
        for (let i = seg(0.7); i < total; i++) map.set(i, 'no')
      }
    } else if (p.name === 'Thora Ironheart') {
      // Early bird — free first half, off duty later.
      for (let i = 0; i < seg(0.1); i++) map.set(i, 'maybe')
      for (let i = seg(0.1); i < seg(0.65); i++) map.set(i, 'yes')
      for (let i = seg(0.65); i < seg(0.8); i++) map.set(i, 'maybe')
      for (let i = seg(0.8); i < total; i++) map.set(i, 'no')
      if (variant === 1) {
        // Knightly duty all evening
        for (let i = seg(0.5); i < total; i++) map.set(i, 'no')
      }
    } else if (p.name === 'Pip Underfoot') {
      // Chaotic — lots of maybes, scattered yes/no.
      for (let i = 0; i < total; i++) {
        const r = (i * 7 + dayNum * 3) % 10
        if (r < 5) map.set(i, 'yes')
        else if (r < 8) map.set(i, 'maybe')
        else map.set(i, 'no')
      }
      if (variant === 0) {
        // Pip is rock solid this session — full party possible
        for (let i = seg(0.3); i < seg(0.75); i++) map.set(i, 'yes')
      }
      if (variant === 2) {
        // Pip vanishes completely (creates short-handed scenario)
        for (let i = 0; i < total; i++) map.set(i, 'no')
      }
    }

    result[p.name] = map
  })

  return result
}

export function formatDateParts(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    long: date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: date.getDate(),
    date,
  }
}
