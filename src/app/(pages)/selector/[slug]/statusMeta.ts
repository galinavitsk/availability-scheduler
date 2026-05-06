import { ComponentType } from 'react'
import { Swords, HelpCircle, Shield } from 'lucide-react'
import { Status } from '@/app/lib/availability'

export const STATUS_META: Record<
  Status,
  {
    label: string
    flavor: string
    icon: ComponentType<{ size?: number }>
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
