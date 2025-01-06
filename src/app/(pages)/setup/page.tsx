"use client";

import dayjs, { Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useEffect, useState } from "react";
import { Availability } from "../../enums/Availability";
import { Slot, SlotTimes } from "../../types/Slot";
import Link from "next/link";

export default function SetUp() {
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


    return (
        <div className="overflow-auto">
            <div className="flex flex-col gap-4 items-center justify-center h-dvh">
                
            </div>
        </div >
    );
}
