"use client";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { AnimatePresence, motion } from "framer-motion";
import { Swords, X } from "lucide-react";
import {  useState } from "react";
import { Sidebar } from "@/app/(pages)/setup/Sidebar";
import { Calendar } from "@/app/(pages)/setup/Calendar";
import { CreateSession } from "@/app/api/setup";
import { ApiStatus } from "@/app/types/ApiResponse";
import { toast } from "react-toastify";

dayjs.extend(utc);
dayjs.extend(timezone);
export default function SetUp() {
  const [timezone, setTimezone] = useState('America/New_York')
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('23:00')
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showSealed, setShowSealed] = useState(false)
  const [eventName, setEventName] = useState('')
  const [slug, setSlug] = useState('')
 
  const toggleDate = (dateStr: string) => {
    const newDates = new Set(selectedDates)
    if (newDates.has(dateStr)) {
      newDates.delete(dateStr)
    } else {
      newDates.add(dateStr)
    }
    setSelectedDates(newDates)
  }
  const handleClear = () => {
    setSelectedDates(new Set())
  }
  const handleSave = () => {
    CreateSession(eventName, endTime, startTime, timezone, selectedDates).then(
      (res) => {
        if (res.status === ApiStatus.Success) {
          setShowSealed(true)
          setSlug(res.data.slug)
        }
        else{
            toast.error(res.message)
        }
      },
    )
  }
  return (
    <div className="relative flex flex-col overflow-hidden">
      <main className="z-10 relative flex lg:flex-row flex-col flex-1 gap-6 mx-auto p-4 md:p-6 w-full max-w-7xl">
        <Sidebar
        eventName={eventName}
        setEventName={setEventName}
          timezone={timezone}
          setTimezone={setTimezone}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          selectedDatesCount={selectedDates.size}
          onClear={handleClear}
          onSave={handleSave}
        />

        <Calendar
          selectedDates={selectedDates}
          toggleDate={toggleDate}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
        />
      </main>

      <AnimatePresence>
        {showSealed && (
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
            className="z-50 fixed inset-0 flex justify-center items-center bg-ink/60 backdrop-blur-sm p-4"
            onClick={() => setShowSealed(false)}
          >
            <motion.div
              initial={{
                scale: 0.7,
                y: 30,
                rotate: -3,
              }}
              animate={{
                scale: 1,
                y: 0,
                rotate: 0,
              }}
              exit={{
                scale: 0.7,
                y: 30,
                opacity: 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 220,
                damping: 18,
              }}
              onClick={(e) => e.stopPropagation()}
              className="relative p-8 w-full max-w-md text-center parchment-panel"
            >
              <button
                onClick={() => setShowSealed(false)}
                className="top-3 right-3 absolute text-ink-light hover:text-burgundy"
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -5, 5, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  repeatDelay: 1.5,
                }}
                className="flex justify-center items-center bg-burgundy shadow-[0_0_24px_rgba(184,134,11,0.6)] mx-auto mb-4 border-4 border-gold rounded-full w-20 h-20 text-gold"
              >
                <Swords size={36} />
              </motion.div>
              <h3 className="mb-2 font-heading font-bold text-burgundy text-2xl">
                The Sessions are planned!
              </h3>
              <p className="mb-6 font-body text-ink-light italic">
                Send the following link to your players:
                <br/>
                <span className="text-burgundy text-lg">https://quest-scheduler.vercel.app/selector/{slug}</span>
              </p>
              <button
                onClick={() => setShowSealed(false)}
                className="btn-primary"
              >
                Onward!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
