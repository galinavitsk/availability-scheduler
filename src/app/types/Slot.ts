import { Availability } from "../enums/Availability";

export type Slot = {
    day: Date,
    times: SlotTimes[],
};

export type SlotTimes = {
    time: Date,
    selected: Availability | null,
    disabled: boolean,
    available: Availability | null;
};