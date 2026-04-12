import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useNavigate } from 'react-router'
import VehicleForm from './VehicleForm/VehicleForm'
import type { VehicleFormSchema } from './VehicleForm/types'
import ApiService from '@/services/ApiService'

const VehicleCreate = () => {
    const navigate = useNavigate()

    const handleFormSubmit = async (values: VehicleFormSchema) => {
        try {
            await ApiService.fetchDataWithAxios({
                url: '/vehicles',
                method: 'post',
                data: {
                    make: values.make,
                    model: values.model,
                    year: Number(values.year),
                    vin: values.vin,
                    plateNumber: values.plateNumber,
                    currentMileageKm: Number(values.currentMileageKm),
                    photoUrl: values.imgList?.[0]?.img || null,
                },
            })

            toast.push(
                <Notification type="success">
                    Vehicle created successfully
                </Notification>,
                { placement: 'top-center' },
            )

            navigate('/concepts/vehicles/vehicle-list')
        } catch (error) {
            console.error(error)

            toast.push(
                <Notification type="danger">
                    Failed to create vehicle
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    return (
        <VehicleForm
            newVehicle
            onFormSubmit={handleFormSubmit}
        >
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    onClick={() => navigate('/concepts/vehicles/vehicle-list')}
                >
                    Cancel
                </Button>
                <Button variant="solid" type="submit">
                    Create Vehicle
                </Button>
            </div>
        </VehicleForm>
    )
}

export default VehicleCreate