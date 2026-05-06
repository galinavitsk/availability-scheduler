export type Session = {
    id: string
    name: string
    startTime: string
    endTime: string
    timezone: string
    selectedDates: Set<string>
    slug: string
}