import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Calendar from '@/components/ui/Calendar'
import ScrollBar from '@/components/ui/ScrollBar'
import CreateEventDialog from './CreateEventDialog'
import { isToday } from '../utils'
import dayjs from 'dayjs'

type ScheduledEvent = {
    id: string
    label: string
    time?: Date
}

type UpcomingScheduleProps = {
    vehicleId: string
    maintenanceId: string
    defaultDate?: Date | null
    title?: string
    suggestedLabel?: string
    onCreated?: () => void
}

const ScheduledEventItem = ({ label, time }: ScheduledEvent) => {
    return (
        <div className="flex items-center justify-between gap-4 py-1">
            <div>
                <div className="font-bold heading-text">{label}</div>
            </div>

            <div>
                <span className="font-semibold heading-text">
                    {time && dayjs(time).format('HH:mm')}
                </span>
            </div>
        </div>
    )
}

const UpcomingSchedule = ({
    vehicleId,
    maintenanceId,
    defaultDate = dayjs().toDate(),
    title = 'Schedule',
    suggestedLabel = '',
    onCreated,
}: UpcomingScheduleProps) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(defaultDate)
    const [events, setEvents] = useState<ScheduledEvent[]>([])

    useEffect(() => {
        if (defaultDate) {
            setSelectedDate(defaultDate)
        }
    }, [defaultDate])

    const handleCreated = () => {
        if (selectedDate) {
            setEvents((prev) => [
                ...prev,
                {
                    id: String(Date.now()),
                    label: suggestedLabel || 'Maintenance',
                    time: selectedDate,
                },
            ])
        }

        onCreated?.()
    }

    return (
        <Card>
            <div className="flex flex-col md:flex-row xl:flex-col md:gap-10 xl:gap-0">
                <div className="mx-auto flex w-[280px] items-center">
                    <Calendar
                        value={selectedDate}
                        onChange={(val) => setSelectedDate(val)}
                    />
                </div>

                <div className="w-full">
                    <div className="my-6">
                        <h5>
                            {title}{' '}
                            {selectedDate && isToday(selectedDate)
                                ? 'today'
                                : selectedDate
                                  ? dayjs(selectedDate).format('DD MMM')
                                  : ''}
                        </h5>
                    </div>

                   
                </div>
            </div>

            <div className="mt-4">
                <CreateEventDialog
                    vehicleId={vehicleId}
                    maintenanceId={maintenanceId}
                    selectedDate={selectedDate}
                    defaultLabel={suggestedLabel}
                    onCreated={handleCreated}
                />
            </div>
        </Card>
    )
}

export default UpcomingSchedule