import { useEffect } from 'react'
import { Form } from '@/components/ui/Form'
import Container from '@/components/shared/Container'
import BottomStickyBar from '@/components/template/BottomStickyBar'
import GeneralSection from './components/GeneralSection'
import ImageSection from './components/ImageSection'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import isEmpty from 'lodash/isEmpty'
import type { VehicleFormSchema } from './types'
import type { CommonProps } from '@/@types/common'

type VehicleFormProps = {
    onFormSubmit: (values: VehicleFormSchema) => void
    defaultValues?: VehicleFormSchema
    newVehicle?: boolean
} & CommonProps

const validationSchema = z.object({
    make: z.string().min(1, { message: 'Make required!' }),
    model: z.string().min(1, { message: 'Model required!' }),
    year: z
        .union([z.string(), z.number()])
        .refine((val) => val !== '' && val !== null && val !== undefined, {
            message: 'Year required!',
        }),
    vin: z.string().min(1, { message: 'VIN required!' }),
    plateNumber: z.string().min(1, { message: 'Plate number required!' }),
    currentMileageKm: z
        .union([z.string(), z.number()])
        .refine((val) => val !== '' && val !== null && val !== undefined, {
            message: 'Mileage required!',
        }),
    imgList: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            img: z.string(),
        }),
    ),
})

const VehicleForm = (props: VehicleFormProps) => {
    const {
        onFormSubmit,
        defaultValues = {
            make: '',
            model: '',
            year: '',
            vin: '',
            plateNumber: '',
            currentMileageKm: '',
            imgList: [],
        },
        children,
    } = props

    const {
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm<VehicleFormSchema>({
        defaultValues: {
            ...defaultValues,
        },
        resolver: zodResolver(validationSchema),
    })

    useEffect(() => {
        if (!isEmpty(defaultValues)) {
            reset(defaultValues)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(defaultValues)])

    const onSubmit = (values: VehicleFormSchema) => {
        onFormSubmit(values)
    }

    return (
        <Form
            className="flex w-full h-full"
            containerClassName="flex flex-col w-full justify-between"
            onSubmit={handleSubmit(onSubmit)}
        >
            <Container>
                <div className="flex flex-col xl:flex-row gap-4">
                    <div className="gap-4 flex flex-col flex-auto">
                        <GeneralSection control={control} errors={errors} />
                    </div>
                    <div className="lg:min-w-[440px] 2xl:w-[500px] gap-4 flex flex-col">
                        <ImageSection control={control} errors={errors} />
                    </div>
                </div>
            </Container>

            <BottomStickyBar>{children}</BottomStickyBar>
        </Form>
    )
}

export default VehicleForm