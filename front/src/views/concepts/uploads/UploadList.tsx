import { useMemo, useState } from 'react'
import useSWR from 'swr'
import cloneDeep from 'lodash/cloneDeep'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import FileIcon from '@/components/view/FileIcon'
import {
    TbTrash,
    TbDownload,
    TbLayoutGrid,
    TbList,
    TbDots,
    TbChevronLeft,
    TbChevronRight,
} from 'react-icons/tb'
import type { TableQueries } from '@/@types/common'
import {
    apiDeleteUpload,
    apiGetUploads,
    type UploadItem,
    type UploadPaginatedResponse,
} from '@/services/DashboardService'

type Layout = 'grid' | 'list'

const statusColor: Record<string, string> = {
    processing:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
    success:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
}

const UploadCard = ({
    item,
    onDownload,
    onDelete,
}: {
    item: UploadItem
    onDownload: () => void
    onDelete: () => void
}) => {
    const vehicleLabel = item.vehicle
        ? `${item.vehicle.make ?? ''} ${item.vehicle.model ?? ''} ${item.vehicle.plateNumber ?? ''}`.trim()
        : 'No vehicle'

    return (
        <div className="border rounded-2xl px-5 py-5 bg-white dark:bg-gray-800 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="text-5xl shrink-0">
                        <FileIcon type="csv" />
                    </div>

                    <div className="min-w-0">
                        <div className="font-bold text-base md:text-lg text-gray-900 dark:text-white truncate">
                            {item.filename}
                        </div>

                        <div className="text-sm text-gray-500 mt-1 truncate">
                            {vehicleLabel}
                        </div>

                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <Tag className={statusColor[item.status] || ''}>
                                <span className="capitalize">{item.status}</span>
                            </Tag>

                            <span className="text-sm text-gray-500">
                                Rows: {item.row_count ?? '-'}
                            </span>

                            <span className="text-sm text-gray-500">
                                {new Date(item.created_at).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <Tooltip title="Download">
                        <button
                            type="button"
                            className="h-10 w-10 inline-flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={onDownload}
                        >
                            <TbDownload className="text-xl" />
                        </button>
                    </Tooltip>

                    <Tooltip title="Delete">
                        <button
                            type="button"
                            className="h-10 w-10 inline-flex items-center justify-center rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                            onClick={onDelete}
                        >
                            <TbTrash className="text-xl" />
                        </button>
                    </Tooltip>

                    <button
                        type="button"
                        className="h-10 w-10 inline-flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <TbDots className="text-xl" />
                    </button>
                </div>
            </div>
        </div>
    )
}

const UploadRow = ({
    item,
    onDownload,
    onDelete,
}: {
    item: UploadItem
    onDownload: () => void
    onDelete: () => void
}) => {
    return (
        <div className="border rounded-2xl px-5 py-4 bg-white dark:bg-gray-800 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <div className="text-4xl shrink-0">
                        <FileIcon type="csv" />
                    </div>

                    <div className="min-w-0">
                        <div className="font-bold text-base text-gray-900 dark:text-white truncate">
                            {item.filename}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                            
                            {item.vehicle?.make && ` · ${item.vehicle.make}`}
                            {item.vehicle?.model && ` ${item.vehicle.model}`}
                            {item.vehicle?.plateNumber && ` (${item.vehicle.plateNumber})`}
                            
                        
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Tag className={statusColor[item.status] || ''}>
                        <span className="capitalize">{item.status}</span>
                    </Tag>

                    <Tooltip title="Download">
                        <button
                            type="button"
                            className="h-10 w-10 inline-flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={onDownload}
                        >
                            <TbDownload className="text-xl" />
                        </button>
                    </Tooltip>

                    <Tooltip title="Delete">
                        <button
                            type="button"
                            className="h-10 w-10 inline-flex items-center justify-center rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                            onClick={onDelete}
                        >
                            <TbTrash className="text-xl" />
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>
    )
}

const UploadList = () => {
    const [layout, setLayout] = useState<Layout>('grid')

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: {
            order: '',
            key: '',
        },
        query: '',
    })

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [selectedUploadId, setSelectedUploadId] = useState('')
    const [pageSizeMenuOpen, setPageSizeMenuOpen] = useState(false)

    const { data, isLoading, mutate } = useSWR(
        ['/uploads', tableData.pageIndex, tableData.pageSize],
        () =>
            apiGetUploads<UploadPaginatedResponse>({
                page: tableData.pageIndex as number,
                limit: tableData.pageSize as number,
            }),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const uploadList = useMemo(() => data?.data ?? [], [data])
    const total = data?.total ?? 0
    const currentPage = tableData.pageIndex as number
    const pageSize = tableData.pageSize as number
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    const handleSetTableData = (newData: TableQueries) => {
        setTableData(newData)
    }

    const handlePaginationChange = (page: number) => {
        const nextPage = Math.min(Math.max(page, 1), totalPages)
        const newTableData = cloneDeep(tableData)
        newTableData.pageIndex = nextPage
        handleSetTableData(newTableData)
    }

    const handleSelectChange = (value: number) => {
        const newTableData = cloneDeep(tableData)
        newTableData.pageSize = Number(value)
        newTableData.pageIndex = 1
        handleSetTableData(newTableData)
        setPageSizeMenuOpen(false)
    }

    const handleDelete = (id: string) => {
        setSelectedUploadId(id)
        setDeleteConfirmationOpen(true)
    }

    const handleCloseDeleteDialog = () => {
        setDeleteConfirmationOpen(false)
        setSelectedUploadId('')
    }

    const handleConfirmDelete = async () => {
        if (!selectedUploadId) return

        try {
            await apiDeleteUpload(selectedUploadId)
            await mutate()

            toast.push(
                <Notification type="success">
                    Upload deleted successfully
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error) {
            console.error(error)
            toast.push(
                <Notification type="danger">
                    Failed to delete upload
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            handleCloseDeleteDialog()
        }
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

    const getPageNumbers = () => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1)
        }

        if (currentPage <= 3) {
            return [1, 2, 3, 4, totalPages]
        }

        if (currentPage >= totalPages - 2) {
            return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
        }

        return [1, currentPage - 1, currentPage, currentPage + 1, totalPages]
    }

    return (
        <>
            <Card className="rounded-2xl p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-bold">File Manager</h3>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-2xl p-1">
                            <button
                                type="button"
                                className={`h-11 w-11 inline-flex items-center justify-center rounded-xl transition ${
                                    layout === 'grid'
                                        ? 'bg-white shadow text-primary'
                                        : 'text-gray-500'
                                }`}
                                onClick={() => setLayout('grid')}
                            >
                                <TbLayoutGrid className="text-xl" />
                            </button>

                            <button
                                type="button"
                                className={`h-11 w-11 inline-flex items-center justify-center rounded-xl transition ${
                                    layout === 'list'
                                        ? 'bg-white shadow text-primary'
                                        : 'text-gray-500'
                                }`}
                                onClick={() => setLayout('list')}
                            >
                                <TbList className="text-xl" />
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="mb-5">Files</h4>

                    {isLoading && (
                        <div className="text-sm text-gray-500">Loading...</div>
                    )}

                    {!isLoading && uploadList.length === 0 && (
                        <div className="text-sm text-gray-500">
                            No uploads found
                        </div>
                    )}

                    {!isLoading && uploadList.length > 0 && layout === 'grid' && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {uploadList.map((item) => (
                                <UploadCard
                                    key={item.id}
                                    item={item}
                                    onDownload={() =>
                                        handleDownload(item.id, item.filename)
                                    }
                                    onDelete={() => handleDelete(item.id)}
                                />
                            ))}
                        </div>
                    )}

                    {!isLoading && uploadList.length > 0 && layout === 'list' && (
                        <div className="flex flex-col gap-4">
                            {uploadList.map((item) => (
                                <UploadRow
                                    key={item.id}
                                    item={item}
                                    onDownload={() =>
                                        handleDownload(item.id, item.filename)
                                    }
                                    onDelete={() => handleDelete(item.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {totalPages > 0 && (
                    <div className="mt-8 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() =>
                                    handlePaginationChange(currentPage - 1)
                                }
                                className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-gray-700"
                            >
                                <TbChevronLeft className="text-lg" />
                            </button>

                            {getPageNumbers().map((page, index, arr) => {
                                const showDots =
                                    index > 0 && page - arr[index - 1] > 1

                                return (
                                    <div
                                        key={page}
                                        className="flex items-center gap-2"
                                    >
                                        {showDots && (
                                            <span className="px-1 text-gray-400">
                                                ...
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handlePaginationChange(page)
                                            }
                                            className={`h-9 min-w-[36px] px-3 rounded-lg text-sm font-semibold transition ${
                                                currentPage === page
                                                    ? 'text-orange-500'
                                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    </div>
                                )
                            })}

                            <button
                                type="button"
                                disabled={currentPage >= totalPages}
                                onClick={() =>
                                    handlePaginationChange(currentPage + 1)
                                }
                                className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-gray-700"
                            >
                                <TbChevronRight className="text-lg" />
                            </button>
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() =>
                                    setPageSizeMenuOpen((prev) => !prev)
                                }
                                className="h-12 rounded-2xl border border-orange-500 bg-white px-5 text-base font-semibold text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white min-w-[140px] inline-flex items-center justify-between gap-3"
                            >
                                <span>{pageSize} / page</span>
                                <TbDots className="text-lg text-gray-500" />
                            </button>

                            {pageSizeMenuOpen && (
                                <div className="absolute bottom-16 right-0 w-[165px] rounded-3xl border border-gray-100 bg-white shadow-xl dark:bg-gray-800 dark:border-gray-700 overflow-hidden z-20">
                                    {[10, 25, 50, 100].map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() =>
                                                handleSelectChange(size)
                                            }
                                            className={`w-full px-6 py-4 text-left text-[16px] font-semibold transition ${
                                                pageSize === size
                                                    ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10'
                                                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {size} / page
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Card>

            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title="Delete upload"
                onClose={handleCloseDeleteDialog}
                onRequestClose={handleCloseDeleteDialog}
                onCancel={handleCloseDeleteDialog}
                onConfirm={handleConfirmDelete}
            >
                <p>Are you sure you want to delete this upload?</p>
            </ConfirmDialog>
        </>
    )
}

export default UploadList