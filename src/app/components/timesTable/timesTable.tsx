"use client";

import dayjs, { Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { Slot, SlotTimes } from "@/app/types/Slot";
import { Availability } from "@/app/enums/Availability";

interface Props {
    availableTimes: Slot[]
    setAvailableTimes: React.Dispatch<React.SetStateAction<Slot[]>>
    userTimeZone: string;
    ctrlKeyDown?: boolean;
    shiftKeyDown?: boolean;
    option?: Availability
}

export const SetUpTimes = (availableTimes: Slot[], startDay: Date, endDay: Date, excludedTimes: string[], userTimeZone: string) => {
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
    return available;
}


export const TimesTable = ({
    availableTimes,
    setAvailableTimes,
    userTimeZone,
    ctrlKeyDown = false,
    shiftKeyDown = false,
    option = Availability.Available
}: Props) => {

    dayjs.extend(utc);
    dayjs.extend(timezone);

    return (<div className={`flex text-center gap-4`}>
        <div className="grid grid-rows-25 gap-2">
            {availableTimes.length > 0 && availableTimes.map((day, index) => {
                return (
                    <div key={day.day.toDateString()} className="grid row-span-full"
                        style={{ gridColumnStart: index + 2 }}>
                        <h1
                            key={day.day.toDateString()}
                            className={`row-start-1 bg-neutral px-5`}>
                            {day.day.toDateString()}
                        </h1>
                        {
                            day.times.map((item: any, i: number) => {
                                return (
                                    <button
                                        key={item.time.toTimeString()}
                                        disabled={item.disabled}
                                        className={`btn rounded-none btn-sm ` +
                                            `${item.selected === 0 ? "bg-success/40" : item.selected === 1 ? "bg-warning/40" : item.selected === 2 ? "bg-error/40" : ""} ` +
                                            `${ctrlKeyDown ? "hover:bg-base-100 hover:text-base-content" : option === 0 ? "hover:bg-success" : option === 1 ? "hover:bg-warning" : "hover:bg-error"} ` +
                                            `${item.available === Availability.Available ? "btn-success" : item.available === Availability.Tentative ? "btn-warning" : item.available === Availability.Unavailable ? "btn-error" : "btn-outline"}
                                `}
                                        onMouseOver={(e) => {
                                            const newTimes = [...availableTimes];
                                            if (newTimes[index].times[i].available == option) return;
                                            if (e.shiftKey) {
                                                newTimes[index].times[i].selected = option;
                                            }
                                            if (e.ctrlKey) {
                                                newTimes[index].times[i].selected = null;
                                            }
                                            setAvailableTimes(newTimes);
                                        }
                                        }
                                        style={{
                                            gridRowStart: i + 2
                                        }}
                                        onClick={(e) => {
                                            const newTimes = [...availableTimes];
                                            const newTime = newTimes[index].times[i];
                                            newTimes[index].times[i].selected = null;
                                            if (e.ctrlKey) {
                                                newTimes[index].times[i].available = null;
                                            }
                                            else {
                                                if (newTime.available === option) {
                                                    newTimes[index].times[i].available = null;
                                                } else {
                                                    newTimes[index].times[i].available = option;
                                                }
                                            }
                                            setAvailableTimes(newTimes);
                                        }}
                                    >
                                        <h2>{dayjs(item.time).tz(userTimeZone).format("hh:mm A")}</h2>
                                    </button>
                                )
                            })
                        }
                    </div>
                )
            })
            }
        </div>
    </div>
    );
};

