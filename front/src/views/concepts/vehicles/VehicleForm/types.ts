import type { Control, FieldErrors } from 'react-hook-form'

export type VehicleFormSchema = {
    make: string
    model: string
    year: number | string
    vin: string
    plateNumber: string
    currentMileageKm: number | string
    imgList: {
        id: string
        name: string
        img: string
    }[]
}

export type FormSectionBaseProps = {
    control: Control<VehicleFormSchema>
    errors: FieldErrors<VehicleFormSchema>
}