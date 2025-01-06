"use client";

import dayjs, { Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useEffect, useState } from "react";
import { Availability } from "../../enums/Availability";
import { Slot, SlotTimes } from "../../types/Slot";
import { Tooltip } from "react-tooltip";
import { HiInformationCircle } from "react-icons/hi";

export default function Selector() {
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


      <div className="flex flex-col gap-4 items-center justify-center">
        <div className="flex gap-2 items-center pt-2">
          <select className="select select-bordered"
            value={userTimeZone}
            onChange={(e) => {
              setUserTimeZone(e.target.value);
            }}>
            {
              ["America/New_York", "GMT"].map((zone) => {
                return (
                  <option key={zone} value={zone}>{zone}</option>
                )
              })
            }
          </select>
          <input type="radio"
            name="radio-10"
            className="radio radio-success"
            checked={option === 0}
            onChange={() => setOption(0)} />
          <input type="radio"
            name="radio-10"
            className="radio radio-warning"
            checked={option === 1}
            onChange={() => setOption(1)} />
          <input type="radio"
            name="radio-10"
            className="radio radio-error"
            checked={option === 2}
            onChange={() => setOption(2)} />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              const newTimes = availableTimes.map(d => {
                return {
                  day: d.day,
                  times: d.times.map(t => {
                    if (t.selected == null) {
                      return t;
                    }
                    return {
                      ...t,
                      selected: null,
                      available: t.selected
                    }
                  })
                }
              })
              setAvailableTimes(newTimes);
            }}>Confirm Drafts</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              const newTimes = availableTimes.map(d => {
                return {
                  day: d.day,
                  times: d.times.map(t => {
                    return {
                      ...t,
                      available: null,
                      selected: null
                    }
                  })
                }
              })
              setAvailableTimes(newTimes);
            }}>Clear All</button>
          <Tooltip id="info-tooltip">
            <div>
              <p>Click to set Availability<br />
                Hold Shift to draft multiple by hovering<br />
                Ctlr to deselect draft</p>
            </div>
          </Tooltip>
          <a data-tooltip-id="info-tooltip" className="text-accent hover:text-primary cursor-pointer"><HiInformationCircle size="30" /></a>
        </div>
        <div className={`flex text-center gap-4`}>
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
      </div>
    </div >
  );
}
