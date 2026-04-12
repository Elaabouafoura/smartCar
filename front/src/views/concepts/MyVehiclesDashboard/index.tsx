import { useMemo, useState } from 'react'
import useSWR from 'swr'
import cloneDeep from 'lodash/cloneDeep'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Tooltip from '@/components/ui/Tooltip'
import Dialog from '@/components/ui/Dialog'
import Progress from '@/components/ui/Progress'
import DataTable from '@/components/shared/DataTable'
import { useNavigate } from 'react-router'
import { TbCar, TbEye, TbPencil, TbUpload } from 'react-icons/tb'
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

const VehicleColumn = ({ row }: { row: VehicleListItem }) => {
    return (
        <div className="flex items-center gap-2">
            <Avatar
                size={50}
                {...(row.photoUrl ? { src: row.photoUrl } : { icon: <TbCar /> })}
            />
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

    const columns: ColumnDef<VehicleListItem>[] = useMemo(
        () => [
            {
                header: 'Vehicle',
                accessorKey: 'make',
                cell: (props) => {
                    return <VehicleColumn row={props.row.original} />
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
                                <Avatar
                                    size={72}
                                    {...(selectedVehicle.photoUrl
                                        ? { src: selectedVehicle.photoUrl }
                                        : { icon: <TbCar /> })}
                                />

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
                                label="Created At"
                                value={
                                    selectedVehicle.createdAt
                                        ? new Date(
                                              selectedVehicle.createdAt,
                                          ).toLocaleString()
                                        : '-'
                                }
                            />
                            <InfoItem
                                label="Updated At"
                                value={
                                    selectedVehicle.updatedAt
                                        ? new Date(
                                              selectedVehicle.updatedAt,
                                          ).toLocaleString()
                                        : '-'
                                }
                            />
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

                      
                    </div>
                )}
            </Dialog>
        </Card>
    )
}

export default MyVehiclesDashboard