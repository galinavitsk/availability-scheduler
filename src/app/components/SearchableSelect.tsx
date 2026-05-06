"use client"

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export function SearchableSelect({ value, onChange, options,disabled }: {
  value: string
  onChange: (v: string) => void
  options: string[]
  disabled?: boolean
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

  const select = (v: string) => {
    onChange(v)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative w-full">
      <input
      disabled={disabled}
        ref={inputRef}
        className="w-full input-fantasy"
        value={open ? query : value.replaceAll('_', ' ')}
        placeholder={value.replaceAll('_', ' ')}
        onFocus={() => { setRect(inputRef.current?.getBoundingClientRect() ?? null); setOpen(true) }}
        onChange={(e) => setQuery(e.target.value.replaceAll(' ', '_'))}
      />
      {open && rect && createPortal(
        <ul
          style={{ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width }}
          className="z-[9999] fixed bg-parchment-light shadow-lg border border-gold-light rounded max-h-52 overflow-y-auto scrollbar-hide"
        >
          {filtered.length === 0
            ? <li className="px-3 py-2 text-ink-light text-sm italic">No results</li>
            : filtered.map((opt) => (
              <li
                key={opt}
                onMouseDown={() => select(opt)}
                className={`px-3 py-1.5 text-sm cursor-pointer font-body hover:bg-gold/20 ${opt === value ? 'text-burgundy font-semibold' : 'text-ink'}`}
              >
                {opt.replaceAll('_', ' ')}
              </li>
            ))
          }
        </ul>,
        document.body
      )}
    </div>
  )
}
