import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Form, FormItem } from '@/components/ui/Form'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import {
    apiGetMechanics,
    apiGetMechanicBookings,
    apiUpdateMaintenanceAppointment,
} from '@/services/DashboardService'

type Mechanic = {
    id: string
    name: string
    specialty?: string
}

export type FormSchema = {
    label: string
    time: number
    mechanicId: string
}

const timeOption = [
    { value: 8, label: '08:00' },
    { value: 9, label: '09:00' },
    { value: 10, label: '10:00' },
    { value: 11, label: '11:00' },
    { value: 12, label: '12:00' },
    { value: 13, label: '13:00' },
    { value: 14, label: '14:00' },
    { value: 15, label: '15:00' },
    { value: 16, label: '16:00' },
    { value: 17, label: '17:00' },
]

const validationSchema = z.object({
    label: z.string().min(1, 'Nom obligatoire'),
    time: z.number(),
    mechanicId: z.string().min(1, 'Choisir un mécanicien'),
})

const CreateEventDialog = ({
    vehicleId,
    maintenanceId,
    selectedDate,
    defaultLabel = '',
    onCreated,
}: {
    vehicleId: string
    maintenanceId: string
    selectedDate: Date | null
    defaultLabel?: string
    onCreated?: () => void
}) => {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [mechanics, setMechanics] = useState<Mechanic[]>([])
    const [loadingMechanics, setLoadingMechanics] = useState(false)

    const {
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        control,
        watch,
    } = useForm<FormSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            label: defaultLabel,
            time: 9,
            mechanicId: '',
        },
    })

    const selectedTime = watch('time')

    useEffect(() => {
        if (dialogOpen) {
            reset({
                label: defaultLabel,
                time: 9,
                mechanicId: '',
            })
        }
    }, [dialogOpen, defaultLabel, reset])

    useEffect(() => {
        const loadAvailableMechanics = async () => {
            if (!dialogOpen || !selectedDate) return

            setLoadingMechanics(true)

            try {
                const allMechanics = await apiGetMechanics<Mechanic[]>()
                const date = dayjs(selectedDate).format('YYYY-MM-DD')

                const result = await Promise.all(
                    allMechanics.map(async (mechanic) => {
                        const bookings = await apiGetMechanicBookings<any[]>(
                            vehicleId,
                            mechanic.id,
                            date,
                        ).catch(() => [])

                        const start = dayjs(selectedDate)
                            .hour(selectedTime)
                            .minute(0)
                            .second(0)
                            .millisecond(0)

                        const end = start.add(1, 'hour')

                        const hasConflict = bookings.some((booking) => {
                            const bookingStart = dayjs(booking.appointmentStart)
                            const bookingEnd = dayjs(booking.appointmentEnd)

                            return (
                                bookingStart.isBefore(end) &&
                                bookingEnd.isAfter(start)
                            )
                        })

                        return hasConflict ? null : mechanic
                    }),
                )

                setMechanics(result.filter(Boolean) as Mechanic[])
            } finally {
                setLoadingMechanics(false)
            }
        }

        loadAvailableMechanics()
    }, [dialogOpen, selectedDate, selectedTime, vehicleId])

    const mechanicOptions = useMemo(
        () =>
            mechanics.map((mechanic) => ({
                value: mechanic.id,
                label: mechanic.specialty
                    ? `${mechanic.name} - ${mechanic.specialty}`
                    : mechanic.name,
            })),
        [mechanics],
    )

    const handleDialogClose = () => {
        setDialogOpen(false)
    }

    const onSubmit = async (value: FormSchema) => {
        if (!selectedDate) return

        const start = dayjs(selectedDate)
            .hour(value.time)
            .minute(0)
            .second(0)
            .millisecond(0)

        const end = start.add(1, 'hour')

        await apiUpdateMaintenanceAppointment(vehicleId, maintenanceId, {
            mechanicId: value.mechanicId,
            appointmentStart: start.toISOString(),
            appointmentEnd: end.toISOString(),
        })

        onCreated?.()
        handleDialogClose()
    }

    return (
        <>
            <Button block onClick={() => setDialogOpen(true)}>
                Fix an appointment
            </Button>

            <Dialog
                isOpen={dialogOpen}
                onClose={handleDialogClose}
                onRequestClose={handleDialogClose}
            >
                <h4>Fix now</h4>

                <div className="mt-2 text-sm text-gray-500">
                    Selected date:{' '}
                    {selectedDate
                        ? dayjs(selectedDate).format('YYYY-MM-DD')
                        : 'Aucune date'}
                </div>

                <Form className="mt-6" onSubmit={handleSubmit(onSubmit)}>
                    <FormItem
                        label="Name"
                        invalid={Boolean(errors.label)}
                        errorMessage={errors.label?.message}
                    >
                        <Controller
                            name="label"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Maintenance"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        label="Time"
                        invalid={Boolean(errors.time)}
                        errorMessage={errors.time?.message}
                    >
                        <Controller
                            name="time"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    options={timeOption}
                                    placeholder="Choisir heure"
                                    value={timeOption.find(
                                        (option) =>
                                            option.value === field.value,
                                    )}
                                    onChange={(option: any) =>
                                        field.onChange(option?.value)
                                    }
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        label="Mechanic available"
                        invalid={Boolean(errors.mechanicId)}
                        errorMessage={errors.mechanicId?.message}
                    >
                        <Controller
                            name="mechanicId"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    isLoading={loadingMechanics}
                                    options={mechanicOptions}
                                    placeholder="Choose mechanic"
                                    value={mechanicOptions.find(
                                        (option) =>
                                            option.value === field.value,
                                    )}
                                    onChange={(option: any) =>
                                        field.onChange(option?.value)
                                    }
                                />
                            )}
                        />
                    </FormItem>

                    <Button
                        block
                        variant="solid"
                        type="submit"
                        loading={isSubmitting}
                        disabled={!selectedDate}
                    >
                        Fix now
                    </Button>
                </Form>
            </Dialog>
        </>
    )
}

export default CreateEventDialog