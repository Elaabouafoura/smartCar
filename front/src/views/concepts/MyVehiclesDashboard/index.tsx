import { useMemo, useState } from 'react'
import useSWR from 'swr'
import cloneDeep from 'lodash/cloneDeep'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Tooltip from '@/components/ui/Tooltip'
import Dialog from '@/components/ui/Dialog'
import Progress from '@/components/ui/Progress'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import DataTable from '@/components/shared/DataTable'
import { useNavigate } from 'react-router'
import { TbCar, TbEye, TbPencil, TbUpload, TbDownload } from 'react-icons/tb'
import type {
    ColumnDef,
    OnSortParam,
} from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import {
    apiGetMyVehicles,
    type VehicleListItem,
    type VehiclePaginatedResponse,
} from '@/services/DashboardService'
import ApiService from '@/services/ApiService'

type UploadItem = {
    id: string
    filename: string
    status: 'processing' | 'success' | 'failed'
    row_count?: number
    created_at?: string
    downloadUrl?: string
}

type UploadPaginatedResponse = {
    data: UploadItem[]
    total: number
    page: number
    totalPages: number
}

const apiGetUploadsByVehicle = async <
    T,
    U extends { vehicleId: string; page: number; limit: number },
>(
    params: U,
) => {
    return ApiService.fetchDataWithAxios<T>({
        url: `/uploads/vehicle/${params.vehicleId}`,
        method: 'get',
        params: {
            page: params.page,
            limit: params.limit,
        },
    })
}

const VehicleColumn = ({
    row,
    onPhotoClick,
}: {
    row: VehicleListItem
    onPhotoClick: (vehicle: VehicleListItem) => void
}) => {
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                className="rounded-full"
                onClick={(e) => {
                    e.stopPropagation()
                    onPhotoClick(row)
                }}
                title="Show uploaded files"
            >
                <Avatar
                    size={50}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    {...(row.photoUrl ? { src: row.photoUrl } : { icon: <TbCar /> })}
                />
            </button>

            <div>
                <div className="font-bold heading-text">
                    {row.make} {row.model}
                </div>
                <div className="text-xs text-gray-500">
                    {row.plateNumber}
                </div>
            </div>
        </div>
    )
}

const ActionColumn = ({
    onView,
    onEdit,
    onUpload,
}: {
    onView: () => void
    onEdit: () => void
    onUpload: () => void
}) => {
    return (
        <div className="flex items-center justify-end gap-3">
            <Tooltip title="View">
                <button
                    type="button"
                    className="text-xl cursor-pointer select-none font-semibold"
                    onClick={(e) => {
                        e.stopPropagation()
                        onView()
                    }}
                >
                    <TbEye />
                </button>
            </Tooltip>

            <Tooltip title="Edit">
                <button
                    type="button"
                    className="text-xl cursor-pointer select-none font-semibold"
                    onClick={(e) => {
                        e.stopPropagation()
                        onEdit()
                    }}
                >
                    <TbPencil />
                </button>
            </Tooltip>

            <Tooltip title="Upload files">
                <button
                    type="button"
                    className="text-xl cursor-pointer select-none font-semibold"
                    onClick={(e) => {
                        e.stopPropagation()
                        onUpload()
                    }}
                >
                    <TbUpload />
                </button>
            </Tooltip>
        </div>
    )
}

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
            <div className="font-semibold break-words">{value}</div>
        </div>
    )
}

const MyVehiclesDashboard = () => {
    const navigate = useNavigate()

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: {
            order: '',
            key: '',
        },
        query: '',
    })

    const [detailOpen, setDetailOpen] = useState(false)
    const [selectedVehicle, setSelectedVehicle] =
        useState<VehicleListItem | null>(null)

    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [uploadVehicle, setUploadVehicle] =
        useState<VehicleListItem | null>(null)

    const { data, isLoading } = useSWR(
        ['/vehicles', tableData.pageIndex, tableData.pageSize],
        () =>
            apiGetMyVehicles<VehiclePaginatedResponse>({
                page: tableData.pageIndex as number,
                limit: tableData.pageSize as number,
            }),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const { data: uploadData, isLoading: uploadsLoading } = useSWR(
        uploadVehicle ? ['/uploads/vehicle', uploadVehicle.id] : null,
        () =>
            apiGetUploadsByVehicle<
                UploadPaginatedResponse,
                { vehicleId: string; page: number; limit: number }
            >({
                vehicleId: uploadVehicle!.id,
                page: 1,
                limit: 20,
            }),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const vehicles = data?.data ?? []
    const total = data?.total ?? 0

    const handleView = (vehicle: VehicleListItem) => {
        setSelectedVehicle(vehicle)
        setDetailOpen(true)
    }

    const handleCloseDetail = () => {
        setDetailOpen(false)
        setSelectedVehicle(null)
    }

    const handleOpenUploads = (vehicle: VehicleListItem) => {
        setUploadVehicle(vehicle)
        setUploadDialogOpen(true)
    }

    const handleCloseUploads = () => {
        setUploadDialogOpen(false)
        setUploadVehicle(null)
    }

    const handleDownload = async (id: string, filename: string) => {
        try {
            const token = localStorage.getItem('token')

            const response = await fetch(
                `http://localhost:3000/api/v1/uploads/${id}/download`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            )

            if (!response.ok) {
                const errorText = await response.text()
                console.error('download error body =', errorText)
                throw new Error(`Failed to download file (${response.status})`)
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            link.remove()

            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('handleDownload error:', error)
            toast.push(
                <Notification type="danger">
                    Failed to download upload
                </Notification>,
                { placement: 'top-center' },
            )
        }
    }

    const columns: ColumnDef<VehicleListItem>[] = useMemo(
        () => [
            {
                header: 'Vehicle',
                accessorKey: 'make',
                cell: (props) => {
                    return (
                        <VehicleColumn
                            row={props.row.original}
                            onPhotoClick={handleOpenUploads}
                        />
                    )
                },
            },
            {
                header: 'Plate',
                accessorKey: 'plateNumber',
                cell: (props) => (
                    <span className="mb-2 text-sm text-gray-500">
                        {props.row.original.plateNumber}
                    </span>
                ),
            },
            {
                header: 'Year',
                accessorKey: 'year',
                cell: (props) => (
                    <span className="mb-2 text-sm text-gray-500">
                        {props.row.original.year}
                    </span>
                ),
            },
            {
                header: 'Mileage',
                accessorKey: 'currentMileageKm',
                cell: (props) => (
                    <span className="mb-2 text-sm text-gray-500">
                        {props.row.original.currentMileageKm} km
                    </span>
                ),
            },
            {
                header: '',
                id: 'action',
                cell: (props) => (
                    <ActionColumn
                        onView={() => handleView(props.row.original)}
                        onEdit={() =>
                            navigate(
                                `/concepts/vehicles/vehicle-edit/${props.row.original.id}`,
                            )
                        }
                        onUpload={() =>
                            navigate(
                                `/concepts/vehicles/vehicle-upload/${props.row.original.id}`,
                            )
                        }
                    />
                ),
            },
        ],
        [navigate],
    )

    const handleSetTableData = (data: TableQueries) => {
        setTableData(data)
    }

    const handlePaginationChange = (page: number) => {
        const newTableData = cloneDeep(tableData)
        newTableData.pageIndex = page
        handleSetTableData(newTableData)
    }

    const handleSelectChange = (value: number) => {
        const newTableData = cloneDeep(tableData)
        newTableData.pageSize = Number(value)
        newTableData.pageIndex = 1
        handleSetTableData(newTableData)
    }

    const handleSort = (sort: OnSortParam) => {
        const newTableData = cloneDeep(tableData)
        newTableData.sort = sort
        handleSetTableData(newTableData)
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h4>My Vehicles</h4>

                <Button
                    onClick={() =>
                        navigate('/concepts/vehicles/vehicle-create')
                    }
                >
                    Add Vehicle
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={vehicles}
                loading={isLoading}
                noData={!isLoading && vehicles.length === 0}
                skeletonAvatarColumns={[0]}
                skeletonAvatarProps={{ width: 28, height: 28 }}
                pagingData={{
                    total,
                    pageIndex: tableData.pageIndex as number,
                    pageSize: tableData.pageSize as number,
                }}
                onPaginationChange={handlePaginationChange}
                onSelectChange={handleSelectChange}
                onSort={handleSort}
            />

            <Dialog
                isOpen={detailOpen}
                onClose={handleCloseDetail}
                onRequestClose={handleCloseDetail}
                width={800}
            >
                {selectedVehicle && (
                    <div className="flex flex-col gap-4">
                        <div>
                            <h4>Vehicle details</h4>
                        </div>

                        <Card>
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <button
                                    type="button"
                                    className="rounded-full"
                                    onClick={() => handleOpenUploads(selectedVehicle)}
                                    title="Show uploaded files"
                                >
                                    <Avatar
                                        size={72}
                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                        {...(selectedVehicle.photoUrl
                                            ? { src: selectedVehicle.photoUrl }
                                            : { icon: <TbCar /> })}
                                    />
                                </button>

                                <div>
                                    <h3 className="mb-1">
                                        {selectedVehicle.make} {selectedVehicle.model}
                                    </h3>
                                </div>
                            </div>

                            <div className="mt-8">
                                <div className="mb-2 text-sm text-gray-500">
                                    Health score
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-lg font-bold">
                                        {selectedVehicle.healthScore ?? 100}%
                                    </span>
                                </div>
                                <Progress
                                    percent={selectedVehicle.healthScore ?? 100}
                                    showInfo={false}
                                />
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <InfoItem label="Make" value={selectedVehicle.make || '-'} />
                            <InfoItem label="Model" value={selectedVehicle.model || '-'} />
                            <InfoItem label="VIN" value={selectedVehicle.vin || '-'} />
                            <InfoItem
                                label="Plate Number"
                                value={selectedVehicle.plateNumber || '-'}
                            />
                            <InfoItem label="Year" value={selectedVehicle.year || '-'} />
                            <InfoItem
                                label="Mileage"
                                value={`${selectedVehicle.currentMileageKm ?? 0} km`}
                            />
                          
                            <InfoItem
                                label="Updated At"
                                value={
                                    selectedVehicle.updatedAt
                                        ? new Date(selectedVehicle.updatedAt).toLocaleString()
                                        : '-'
                                }
                            />
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button
                                variant="solid"
                                icon={<TbPencil />}
                                onClick={() =>
                                    navigate(
                                        `/concepts/vehicles/vehicle-edit/${selectedVehicle.id}`,
                                    )
                                }
                            >
                                Edit
                            </Button>
                        </div>
                    </div>
                )}
            </Dialog>

            <Dialog
                isOpen={uploadDialogOpen}
                onClose={handleCloseUploads}
                onRequestClose={handleCloseUploads}
                width={700}
            >
                <div className="flex flex-col gap-4">
                    <div>
                        <h4>Uploaded files</h4>
                        {uploadVehicle && (
                            <div className="text-sm text-gray-500 mt-1">
                                {uploadVehicle.make} {uploadVehicle.model}
                                {uploadVehicle.plateNumber
                                    ? ` - ${uploadVehicle.plateNumber}`
                                    : ''}
                            </div>
                        )}
                    </div>

                    {uploadsLoading ? (
                        <div className="text-sm text-gray-500">
                            Loading uploads...
                        </div>
                    ) : !uploadData?.data?.length ? (
                        <Card>
                            <div className="text-sm text-gray-500">
                                No uploaded files for this vehicle.
                            </div>
                        </Card>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {uploadData.data.map((file) => (
                                <Card key={file.id}>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="font-semibold break-all">
                                                {file.filename}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                Status: {file.status}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Rows: {file.row_count ?? 0}
                                            </div>
                                          
                                        </div>

                                        <Button
                                            size="sm"
                                            icon={<TbDownload />}
                                            onClick={() =>
                                                handleDownload(file.id, file.filename)
                                            }
                                        >
                                            Download
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </Dialog>
        </Card>
    )
}

export default MyVehiclesDashboard