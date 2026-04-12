import useSWR from 'swr'
import { useParams, useNavigate } from 'react-router'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Loading from '@/components/shared/Loading'
import Progress from '@/components/ui/Progress'
import { TbArrowLeft, TbCar } from 'react-icons/tb'
import {
    apiGetAdminVehicleById,
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
        id ? ['/vehicles/admin', id] : null,
        () => apiGetAdminVehicleById<VehicleListItem>(id as string),
        {
            revalidateOnFocus: false,
        },
    )

    const vehicle = data

    return (
        <Loading loading={isLoading}>
            {vehicle && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4>Vehicle details</h4>
                            <p className="text-gray-500">
                                View vehicle information
                            </p>
                        </div>

                        <Button
                            icon={<TbArrowLeft />}
                            onClick={() => navigate('/dashboards/vehicle')}
                        >
                            Back
                        </Button>
                    </div>

                    <Card>
                        <div className="flex items-center gap-4">
                            <Avatar
                                size={70}
                                {...(vehicle.photoUrl
                                    ? { src: vehicle.photoUrl }
                                    : { icon: <TbCar /> })}
                            />

                            <div>
                                <h3>
                                    {vehicle.make} {vehicle.model}
                                </h3>
                                <div className="text-gray-500 text-sm">
                                   
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="text-sm text-gray-500 mb-2">
                                Health
                            </div>

                            <div className="flex items-center gap-3 mb-2">
                                <span className="font-bold">
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
                            label="Plate"
                            value={vehicle.plateNumber || '-'}
                        />
                        <InfoItem label="Year" value={vehicle.year || '-'} />
                        <InfoItem
                            label="Mileage"
                            value={`${vehicle.currentMileageKm ?? 0} km`}
                        />
                        <InfoItem
                            label="Created"
                            value={
                                vehicle.createdAt
                                    ? new Date(vehicle.createdAt).toLocaleString()
                                    : '-'
                            }
                        />
                        <InfoItem
                            label="Updated"
                            value={
                                vehicle.updatedAt
                                    ? new Date(vehicle.updatedAt).toLocaleString()
                                    : '-'
                            }
                        />
                        <InfoItem
                            label="Owner"
                            value={
        vehicle.owner
            ? `${vehicle.owner.name} (${vehicle.owner.email})`
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