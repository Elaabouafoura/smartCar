import useSWR from 'swr'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useNavigate, useParams } from 'react-router'
import VehicleForm from './VehicleForm/VehicleForm'
import type { VehicleFormSchema } from './VehicleForm/types'
import {
    apiGetMyVehicleById,
    apiUpdateMyVehicle,
    type VehicleListItem,
} from '@/services/DashboardService'

const VehicleEdit = () => {
    const navigate = useNavigate()
    const { id } = useParams()

    const { data, isLoading } = useSWR(
        id ? ['/vehicles', id] : null,
        () => apiGetMyVehicleById<VehicleListItem>(id as string),
        {
            revalidateOnFocus: false,
        },
    )

    const defaultValues: VehicleFormSchema | undefined = data
        ? {
              make: data.make ?? '',
              model: data.model ?? '',
              year: data.year ?? '',
              vin: data.vin ?? '',
              plateNumber: data.plateNumber ?? '',
              currentMileageKm: data.currentMileageKm ?? '',
              imgList: data.photoUrl
                  ? [
                        {
                            id: '1-img-0',
                            name: 'vehicle-image',
                            img: data.photoUrl,
                        },
                    ]
                  : [],
          }
        : undefined

    const handleFormSubmit = async (values: VehicleFormSchema) => {
        try {
            await apiUpdateMyVehicle(id as string, {
                make: values.make,
                model: values.model,
                year: Number(values.year),
                vin: values.vin,
                plateNumber: values.plateNumber,
                currentMileageKm: Number(values.currentMileageKm),
                photoUrl: values.imgList?.[0]?.img || null,
            })

            toast.push(
                <Notification type="success">
                    Vehicle updated successfully
                </Notification>,
                { placement: 'top-center' },
            )

            navigate('/concepts/vehicles/vehicle-list')
        } catch (error) {
            console.error(error)

            toast.push(
                <Notification type="danger">
                    Failed to update vehicle
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    return (
        <VehicleForm
            defaultValues={defaultValues}
            onFormSubmit={handleFormSubmit}
        >
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    onClick={() => navigate('/concepts/vehicles/vehicle-list')}
                >
                    Cancel
                </Button>
                <Button
                    variant="solid"
                    type="submit"
                    loading={isLoading}
                >
                    Save Changes
                </Button>
            </div>
        </VehicleForm>
    )
}

export default VehicleEdit