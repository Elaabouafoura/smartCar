import useSWR from 'swr'
import { useNavigate, useParams } from 'react-router'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Loading from '@/components/shared/Loading'
import Progress from '@/components/ui/Progress'
import { TbArrowLeft, TbCar, TbPencil } from 'react-icons/tb'
import {
    apiGetMyVehicleById,
    type VehicleListItem,
} from '@/services/DashboardService'

const InfoItem = ({
    label,
    value,
}: {
    label: string
    value: string | number
}) => {
    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-500 mb-1">{label}</div>
            <div className="font-semibold">{value}</div>
        </div>
    )
}

const VehicleDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const { data, isLoading } = useSWR(
        id ? ['/vehicles', id] : null,
        () => apiGetMyVehicleById<VehicleListItem>(id as string),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const vehicle = data

    return (
        <Loading loading={isLoading}>
            {vehicle && (
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <h4>Vehicle details</h4>
                            <p className="text-gray-500">
                                View information for your vehicle
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                icon={<TbArrowLeft />}
                                onClick={() =>
                                    navigate('/concepts/vehicles/vehicle-list')
                                }
                            >
                                Back
                            </Button>

                            <Button
                                variant="solid"
                                icon={<TbPencil />}
                                onClick={() =>
                                    navigate(
                                        `/concepts/vehicles/vehicle-edit/${vehicle.id}`,
                                    )
                                }
                            >
                                Edit
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <Avatar
                                size={72}
                                {...(vehicle.photoUrl
                                    ? { src: vehicle.photoUrl }
                                    : { icon: <TbCar /> })}
                            />

                            <div>
                                <h3 className="mb-1">
                                    {vehicle.make} {vehicle.model}
                                </h3>
                                <div className="text-sm text-gray-500">
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <div className="mb-2 text-sm text-gray-500">
                                Health score
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg font-bold">
                                    {vehicle.healthScore ?? 100}%
                                </span>
                            </div>
                            <Progress
                                percent={vehicle.healthScore ?? 100}
                                showInfo={false}
                            />
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <InfoItem label="Make" value={vehicle.make || '-'} />
                        <InfoItem label="Model" value={vehicle.model || '-'} />
                        <InfoItem label="VIN" value={vehicle.vin || '-'} />
                        <InfoItem
                            label="Plate Number"
                            value={vehicle.plateNumber || '-'}
                        />
                        <InfoItem label="Year" value={vehicle.year || '-'} />
                        <InfoItem
                            label="Mileage"
                            value={`${vehicle.currentMileageKm ?? 0} km`}
                        />
                        <InfoItem
                            label="Created At"
                            value={
                                vehicle.createdAt
                                    ? new Date(
                                          vehicle.createdAt,
                                      ).toLocaleString()
                                    : '-'
                            }
                        />
                        <InfoItem
                            label="Updated At"
                            value={
                                vehicle.updatedAt
                                    ? new Date(
                                          vehicle.updatedAt,
                                      ).toLocaleString()
                                    : '-'
                            }
                        />
                    </div>
                </div>
            )}
        </Loading>
    )
}

export default VehicleDetails