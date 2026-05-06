// Shared availability primitives used by Selector and Council pages.

export type Status = 'yes' | 'maybe' | 'no'

export const SLOT_MINUTES = 30

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
