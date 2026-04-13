import { useMemo, useState } from 'react'
import useSWR from 'swr'
import cloneDeep from 'lodash/cloneDeep'
import Avatar from '@/components/ui/Avatar'
import Progress from '@/components/ui/Progress'
import Tooltip from '@/components/ui/Tooltip'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import DataTable from '@/components/shared/DataTable'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Dialog from '@/components/ui/Dialog'
import classNames from '@/utils/classNames'
import { TbEye, TbTrash, TbCar, TbDownload } from 'react-icons/tb'
import type {
    OnSortParam,
    ColumnDef,
    Row,
} from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import {
    apiDeleteAdminVehicle,
    apiGetAdminVehicles,
    type VehicleListItem,
} from '@/services/DashboardService'
import ApiService from '@/services/ApiService'
import Card from '@/components/ui/Card/Card'
import Button from '@/components/ui/Button'
import VehicleListTableTools from './VehicleListTableTools'

type GetVehiclesResponse = VehicleListItem[]

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

const apiGetUploadsByVehicle = async (
    vehicleId: string,
    page = 1,
    limit = 20,
) => {
    return ApiService.fetchDataWithAxios<UploadPaginatedResponse>({
        url: `/uploads/vehicle/${vehicleId}`,
        method: 'get',
        params: {
            page,
            limit,
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
                    shape="round"
                    size={60}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    {...(row.photoUrl ? { src: row.photoUrl } : { icon: <TbCar /> })}
                />
            </button>

            <div>
                <div className="font-bold heading-text mb-1">
                    {row.make} {row.model}
                </div>
            </div>
        </div>
    )
}

const ActionColumn = ({
    onView,
    onDelete,
}: {
    onView: () => void
    onDelete: () => void
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

            <Tooltip title="Delete">
                <button
                    type="button"
                    className="text-xl cursor-pointer select-none font-semibold"
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                    }}
                >
                    <TbTrash />
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

const VehicleDashboard = () => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [toDeleteId, setToDeleteId] = useState('')
    const [deleteLoading, setDeleteLoading] = useState(false)

    const [detailOpen, setDetailOpen] = useState(false)
    const [selectedDetailVehicle, setSelectedDetailVehicle] =
        useState<VehicleListItem | null>(null)

    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [uploadVehicle, setUploadVehicle] =
        useState<VehicleListItem | null>(null)

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: {
            order: '',
            key: '',
        },
        query: '',
    })

    const [selectedVehicle, setSelectedVehicle] = useState<VehicleListItem[]>([])

    const { data, isLoading, mutate } = useSWR(
        ['/vehicles/admin/all'],
        () => apiGetAdminVehicles<GetVehiclesResponse>(),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const { data: uploadData, isLoading: uploadsLoading } = useSWR(
        uploadVehicle ? ['/uploads/vehicle', uploadVehicle.id] : null,
        () => apiGetUploadsByVehicle(uploadVehicle!.id, 1, 20),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const vehicleList = data ?? []

    const filteredVehicleList = useMemo(() => {
        const query = tableData.query?.toLowerCase().trim() || ''

        if (!query) {
            return vehicleList
        }

        return vehicleList.filter((vehicle) => {
            return (
                vehicle.make?.toLowerCase().includes(query) ||
                vehicle.model?.toLowerCase().includes(query) ||
                vehicle.plateNumber?.toLowerCase().includes(query) ||
                vehicle.owner?.name?.toLowerCase().includes(query)
            )
        })
    }, [vehicleList, tableData.query])

    const sortedVehicleList = useMemo(() => {
        const copied = [...filteredVehicleList]
        const sort = tableData.sort

        if (!sort?.key || !sort?.order) {
            return copied
        }

        return copied.sort((a, b) => {
            const key = sort.key as keyof VehicleListItem
            const aValue = a[key]
            const bValue = b[key]

            if (key === 'createdAt') {
                const aDate = new Date(a.createdAt).getTime()
                const bDate = new Date(b.createdAt).getTime()
                return sort.order === 'asc' ? aDate - bDate : bDate - aDate
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sort.order === 'asc' ? aValue - bValue : bValue - aValue
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sort.order === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            }

            return 0
        })
    }, [filteredVehicleList, tableData.sort])

    const paginatedVehicleList = useMemo(() => {
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const start = (pageIndex - 1) * pageSize
        const end = start + pageSize

        return sortedVehicleList.slice(start, end)
    }, [sortedVehicleList, tableData.pageIndex, tableData.pageSize])

    const handleCancel = () => {
        if (deleteLoading) return
        setDeleteConfirmationOpen(false)
    }

    const handleDelete = (vehicle: VehicleListItem) => {
        setDeleteConfirmationOpen(true)
        setToDeleteId(vehicle.id)
    }

    const handleView = (vehicle: VehicleListItem) => {
        setSelectedDetailVehicle(vehicle)
        setDetailOpen(true)
    }

    const handleCloseDetail = () => {
        setDetailOpen(false)
        setSelectedDetailVehicle(null)
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

    const handleConfirmDelete = async () => {
        if (!toDeleteId) return

        try {
            setDeleteLoading(true)

            await apiDeleteAdminVehicle(toDeleteId)

            const newVehicleList = vehicleList.filter(
                (vehicle) => vehicle.id !== toDeleteId,
            )

            setSelectedVehicle((prev) =>
                prev.filter((vehicle) => vehicle.id !== toDeleteId),
            )

            if (selectedDetailVehicle?.id === toDeleteId) {
                handleCloseDetail()
            }

            if (uploadVehicle?.id === toDeleteId) {
                handleCloseUploads()
            }

            await mutate(newVehicleList, false)

            toast.push(
                <Notification type="success">
                    Vehicle deleted successfully
                </Notification>,
                { placement: 'top-center' },
            )

            const filteredAfterDelete = newVehicleList.filter((vehicle) => {
                const query = tableData.query?.toLowerCase().trim() || ''

                if (!query) {
                    return true
                }

                return (
                    vehicle.make?.toLowerCase().includes(query) ||
                    vehicle.model?.toLowerCase().includes(query) ||
                    vehicle.plateNumber?.toLowerCase().includes(query) ||
                    vehicle.owner?.name?.toLowerCase().includes(query)
                )
            })

            const totalPages = Math.ceil(
                filteredAfterDelete.length / (tableData.pageSize as number),
            )

            if ((tableData.pageIndex as number) > totalPages) {
                setTableData((prev) => ({
                    ...prev,
                    pageIndex: totalPages > 0 ? totalPages : 1,
                }))
            }
        } catch (error) {
            console.error(error)
            toast.push(
                <Notification type="danger">
                    Failed to delete vehicle
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setDeleteConfirmationOpen(false)
            setToDeleteId('')
            setDeleteLoading(false)
        }
    }

    const columns: ColumnDef<VehicleListItem>[] = useMemo(
        () => [
            {
                header: 'Vehicle',
                accessorKey: 'make',
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <VehicleColumn
                            row={row}
                            onPhotoClick={handleOpenUploads}
                        />
                    )
                },
            },
            {
                header: 'Plate',
                accessorKey: 'plateNumber',
                cell: (props) => {
                    return (
                        <span className="mb-2 text-sm text-gray-500">
                            {props.row.original.plateNumber || '-'}
                        </span>
                    )
                },
            },
            {
                header: 'Owner',
                accessorKey: 'ownerName',
                cell: (props) => {
                    return (
                        <span className="mb-2 text-sm text-gray-500">
                            {props.row.original.owner?.name || '-'}
                        </span>
                    )
                },
            },
            {
                header: 'Mileage',
                accessorKey: 'currentMileageKm',
                cell: (props) => {
                    return (
                        <span className="mb-2 text-sm text-gray-500">
                            {props.row.original.currentMileageKm ?? 0} km
                        </span>
                    )
                },
            },
            {
                header: 'Health',
                accessorKey: 'healthScore',
                cell: (props) => {
                    const healthScore = props.row.original.healthScore ?? 100

                    return (
                        <div className="flex flex-col gap-1">
                            <span className="flex gap-1">
                                <span className="font-semibold">
                                    {healthScore}%
                                </span>
                                <span>Health</span>
                            </span>
                            <Progress
                                percent={healthScore}
                                showInfo={false}
                                customColorClass={classNames(
                                    'bg-error',
                                    healthScore > 40 && 'bg-warning',
                                    healthScore > 70 && 'bg-success',
                                )}
                            />
                        </div>
                    )
                },
            },
            {
                header: '',
                id: 'action',
                cell: (props) => (
                    <ActionColumn
                        onView={() => handleView(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        [selectedVehicle],
    )

    const handleSetTableData = (data: TableQueries) => {
        setTableData(data)
        if (selectedVehicle.length > 0) {
            setSelectedVehicle([])
        }
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

    const handleRowSelect = (checked: boolean, row: VehicleListItem) => {
        if (checked) {
            setSelectedVehicle((prev) => {
                const exists = prev.some((item) => item.id === row.id)
                if (exists) return prev
                return [...prev, row]
            })
        } else {
            setSelectedVehicle((prev) =>
                prev.filter((item) => item.id !== row.id),
            )
        }
    }

    const handleAllRowSelect = (
        checked: boolean,
        rows: Row<VehicleListItem>[],
    ) => {
        if (checked) {
            const originalRows = rows.map((row) => row.original)
            setSelectedVehicle(originalRows)
        } else {
            setSelectedVehicle([])
        }
    }

    return (
        <Card>
            <VehicleListTableTools
                tableData={tableData}
                setTableData={setTableData}
            />

            <DataTable
                selectable
                columns={columns}
                data={paginatedVehicleList}
                noData={!isLoading && filteredVehicleList.length === 0}
                skeletonAvatarColumns={[0]}
                skeletonAvatarProps={{ width: 28, height: 28 }}
                loading={isLoading}
                pagingData={{
                    total: filteredVehicleList.length,
                    pageIndex: tableData.pageIndex as number,
                    pageSize: tableData.pageSize as number,
                }}
                checkboxChecked={(row) =>
                    selectedVehicle.some((selected) => selected.id === row.id)
                }
                onPaginationChange={handlePaginationChange}
                onSelectChange={handleSelectChange}
                onSort={handleSort}
                onCheckBoxChange={handleRowSelect}
                onIndeterminateCheckBoxChange={handleAllRowSelect}
            />

            <Dialog
                isOpen={detailOpen}
                onClose={handleCloseDetail}
                onRequestClose={handleCloseDetail}
                width={800}
            >
                {selectedDetailVehicle && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                className="rounded-full"
                                onClick={() => handleOpenUploads(selectedDetailVehicle)}
                                title="Show uploaded files"
                            >
                                <Avatar
                                    size={70}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    {...(selectedDetailVehicle.photoUrl
                                        ? { src: selectedDetailVehicle.photoUrl }
                                        : { icon: <TbCar /> })}
                                />
                            </button>

                            <div>
                                <h3>
                                    {selectedDetailVehicle.make}{' '}
                                    {selectedDetailVehicle.model}
                                </h3>
                                <div className="text-gray-500 text-sm">
                                    Vehicle information
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-500 mb-2">
                                Health
                            </div>

                            <div className="flex items-center gap-3 mb-2">
                                <span className="font-bold">
                                    {selectedDetailVehicle.healthScore ?? 100}%
                                </span>
                            </div>

                            <Progress
                                percent={selectedDetailVehicle.healthScore ?? 100}
                                showInfo={false}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <InfoItem
                                label="Make"
                                value={selectedDetailVehicle.make || '-'}
                            />
                            <InfoItem
                                label="Model"
                                value={selectedDetailVehicle.model || '-'}
                            />
                            <InfoItem
                                label="VIN"
                                value={selectedDetailVehicle.vin || '-'}
                            />
                            <InfoItem
                                label="Plate"
                                value={selectedDetailVehicle.plateNumber || '-'}
                            />
                            <InfoItem
                                label="Year"
                                value={selectedDetailVehicle.year || '-'}
                            />
                            <InfoItem
                                label="Mileage"
                                value={`${selectedDetailVehicle.currentMileageKm ?? 0} km`}
                            />
                            
                            <InfoItem
                                label="Updated"
                                value={
                                    selectedDetailVehicle.updatedAt
                                        ? new Date(
                                              selectedDetailVehicle.updatedAt,
                                          ).toLocaleString()
                                        : '-'
                                }
                            />
                            <InfoItem
                                label="Owner"
                                value={
                                    selectedDetailVehicle.owner
                                        ? `${selectedDetailVehicle.owner.name} (${selectedDetailVehicle.owner.email})`
                                        : '-'
                                }
                            />
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

            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title="Remove vehicle"
                onClose={handleCancel}
                onRequestClose={handleCancel}
                onCancel={handleCancel}
                onConfirm={handleConfirmDelete}
                confirmButtonProps={{ loading: deleteLoading }}
            >
                <p>
                    Are you sure you want to remove this vehicle? This action
                    can&apos;t be undo.
                </p>
            </ConfirmDialog>
        </Card>
    )
}

export default VehicleDashboard