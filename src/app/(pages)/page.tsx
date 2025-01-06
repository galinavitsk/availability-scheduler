"use client";

import dayjs, { Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useEffect, useState } from "react";
import { Availability } from "../enums/Availability";
import { Slot, SlotTimes } from "../types/Slot";
import Link from "next/link";

export default function Home() {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  const [startDay, setStartDay] = useState<Date>(dayjs.utc("2023-01-01T00:00:00Z").toDate());
  const [endDay, setEndDay] = useState<Date>(dayjs.utc("2023-01-02T23:59:59Z").toDate());
  const [userTimeZone, setUserTimeZone] = useState<string>(dayjs.tz.guess());
  const [option, setOption] = useState<Availability>(0);
  const [timezones, setTimezones] = useState<string[]>([]);
  const selectedTime = new Date("2023-01-01T12:00:00Z");
  const [shiftKeyDown, setShiftKeyDown] = useState<boolean>(false);
  const [ctrlKeyDown, setCtrlKeyDown] = useState<boolean>(false);
  const [lastClicked, setLastClicked] = useState<Date>();
  const [hovered, setHovered] = useState<Dayjs>();

  const [availableTimes, setAvailableTimes] = useState<Slot[]>([]);

  const [excludedTimes, setExcludedTimes] = useState<string[]>([
    new Date("2023-01-01T01:00:00Z").toISOString(),
    new Date("2023-01-01T04:00:00Z").toISOString(),
  ]);

  useEffect(() => {
    const onKeyDown = (key: globalThis.KeyboardEvent) => {
      if (key.shiftKey) {
        setShiftKeyDown(true);
      }
      if (key.ctrlKey) {
        setCtrlKeyDown(true);
      }
    }
    const onKeyUp = (key: globalThis.KeyboardEvent) => {
      if (!key.shiftKey) {
        setShiftKeyDown(false);
      }
      if (!key.ctrlKey) {
        setCtrlKeyDown(false);
      }
    }
    setTimezones([...Intl.supportedValuesOf("timeZone")]);
    document.addEventListener('keydown', onKeyDown,);
    document.addEventListener('keyup', onKeyUp);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    }
  }, []);

  useEffect(() => {
    setUpTimes(startDay, endDay);
  }, [startDay, endDay, userTimeZone]);

  const setUpTimes = (startDay: Date, endDay: Date) => {
    const availabilitySet: SlotTimes[] = [];
    availableTimes.map(d => {
      availabilitySet.push(...d.times.filter(t => t.selected != null || t.available != null));
    })
    const available: any[] = [];
    const localStartDate = dayjs.tz(startDay, userTimeZone).set("hour", 0).set("minute", 0).set("second", 0);
    const localEndDate = dayjs.tz(endDay, userTimeZone).set("hour", 23).set("minute", 59).set("second", 59);
    const days = dayjs.utc(localEndDate).diff(localStartDate, "day") + 1;
    for (let index = 0; index < days; index++) {
      const day = dayjs(localStartDate).add(index, "day").toDate();
      const times = [];
      for (let index = 0; index < 24; index++) {
        const time = dayjs(day).hour(day.getHours() + index).toDate();
        const existing = availabilitySet.find(t => t.time.toISOString() === time.toISOString());
        times.push({
          time: time,
          selected: existing?.selected ?? null,
          disabled: excludedTimes.includes(time.toISOString()) || time.toISOString() < startDay.toISOString() || time.toISOString() > endDay.toISOString(),
          available: existing?.available ?? null
        });
      }
      available.push({ day, times });
    }
    setAvailableTimes(available);
  }

  return (
    <div className="overflow-auto">
      <div className="flex flex-col gap-4 items-center justify-center h-dvh">
      </div>
    </div >
  );
}
