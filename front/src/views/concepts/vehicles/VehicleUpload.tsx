import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Upload from '@/components/ui/Upload'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Loading from '@/components/shared/Loading'
import {
    TbArrowLeft,
    TbUpload,
    TbDatabase,
    TbAlertTriangle,
    TbTool,
} from 'react-icons/tb'
import {
    apiUploadVehicleSensorData,
    apiUploadVehicleDtc,
    apiUploadVehicleMaintenance,
} from '@/services/DashboardService'

const UploadBlock = ({
    title,
    description,
    accept,
    loading,
    onUpload,
    icon,
}: {
    title: string
    description: string
    accept?: string
    loading: boolean
    onUpload: (file: File) => Promise<void>
    icon: React.ReactNode
}) => {
    return (
        <Card>
            <div className="flex items-start gap-3 mb-4">
                <div className="text-2xl">{icon}</div>
                <div>
                    <h4>{title}</h4>
                    <p className="text-gray-500">{description}</p>
                </div>
            </div>

            <Upload
                draggable
                accept={accept}
                showList={false}
                onChange={async (files) => {
                    const latestFile = files?.[files.length - 1]
                    if (!latestFile) return
                    await onUpload(latestFile)
                }}
            >
                <div className="max-w-full flex flex-col px-4 py-8 justify-center items-center">
                    <div className="text-[56px]">
                        <TbUpload />
                    </div>
                    <p className="flex flex-col items-center mt-2 text-center">
                        <span className="text-gray-800 dark:text-white">
                            Drop your file here, or
                        </span>
                        <span className="text-primary">Click to browse</span>
                    </p>
                    {loading && (
                        <p className="mt-3 text-sm text-primary">Uploading...</p>
                    )}
                </div>
            </Upload>
        </Card>
    )
}

const VehicleUpload = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const [sensorLoading, setSensorLoading] = useState(false)
    const [dtcLoading, setDtcLoading] = useState(false)
    const [maintenanceLoading, setMaintenanceLoading] = useState(false)

    const handleSensorUpload = async (file: File) => {
        if (!id) return

        try {
            setSensorLoading(true)
            await apiUploadVehicleSensorData(id, file)

            toast.push(
                <Notification type="success">
                    Sensor data uploaded successfully
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error) {
            console.error(error)
            toast.push(
                <Notification type="danger">
                    Failed to upload sensor data
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setSensorLoading(false)
        }
    }

    const handleDtcUpload = async (file: File) => {
        if (!id) return

        try {
            setDtcLoading(true)
            await apiUploadVehicleDtc(id, file)

            toast.push(
                <Notification type="success">
                    DTC file uploaded successfully
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error) {
            console.error(error)
            toast.push(
                <Notification type="danger">
                    Failed to upload DTC file
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setDtcLoading(false)
        }
    }

    const handleMaintenanceUpload = async (file: File) => {
        if (!id) return

        try {
            setMaintenanceLoading(true)
            await apiUploadVehicleMaintenance(id, file)

            toast.push(
                <Notification type="success">
                    Maintenance file uploaded successfully
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error) {
            console.error(error)
            toast.push(
                <Notification type="danger">
                    Failed to upload maintenance file
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setMaintenanceLoading(false)
        }
    }

    return (
        <Loading loading={false}>
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h4>Vehicle Upload Center</h4>
                        <p className="text-gray-500">
                            Upload files related to this vehicle
                        </p>
                    </div>

                    <Button
                        icon={<TbArrowLeft />}
                        onClick={() => navigate('/concepts/vehicles/vehicle-list')}
                    >
                        Back
                    </Button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <UploadBlock
                        title="Sensor Data Upload"
                        description="Upload CSV/JSON sensor readings for this vehicle."
                        accept=".csv,.json"
                        loading={sensorLoading}
                        onUpload={handleSensorUpload}
                        icon={<TbDatabase />}
                    />

                    <UploadBlock
                        title="DTC Upload"
                        description="Upload CSV/JSON DTC files for this vehicle."
                        accept=".csv,.json"
                        loading={dtcLoading}
                        onUpload={handleDtcUpload}
                        icon={<TbAlertTriangle />}
                    />

                    <UploadBlock
                        title="Maintenance Upload"
                        description="Upload CSV/JSON maintenance files for this vehicle."
                        accept=".csv,.json"
                        loading={maintenanceLoading}
                        onUpload={handleMaintenanceUpload}
                        icon={<TbTool />}
                    />
                </div>
            </div>
        </Loading>
    )
}

export default VehicleUpload