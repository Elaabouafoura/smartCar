import { useMemo, useState } from 'react'
import useSWR from 'swr'
import cloneDeep from 'lodash/cloneDeep'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import DataTable from '@/components/shared/DataTable'
import Loading from '@/components/shared/Loading'
import StickyFooter from '@/components/shared/StickyFooter'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { TbChecks, TbTrash, TbX } from 'react-icons/tb'
import {
    apiGetUsers,
    type UserListItem,
    apiDeleteUsers,
} from '@/services/DashboardService'
import ApiService from '@/services/ApiService'
import type {
    ColumnDef,
    OnSortParam,
    Row,
} from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import UsersTableTools from './UsersTableTools'

type GetUsersResponse = UserListItem[]
type RoleType = 'admin' | 'user'

type RoleOption = {
    value: RoleType
    label: string
}

const roleOptions: RoleOption[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
]

const apiUpdateUserRole = async (userId: string, role: RoleType) => {
    return ApiService.fetchDataWithAxios({
        url: `/users/${userId}/role`,
        method: 'patch',
        data: { role },
    })
}

const UsersDashboard = () => {
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: {
            order: '',
            key: '',
        },
        query: '',
    })

    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [selectedUsers, setSelectedUsers] = useState<UserListItem[]>([])
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [localUsers, setLocalUsers] = useState<UserListItem[] | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [roleUpdatingUserId, setRoleUpdatingUserId] = useState<string | null>(
        null,
    )

    const { data, isLoading } = useSWR(
        ['/users'],
        () => apiGetUsers<GetUsersResponse>(),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const users = localUsers ?? data ?? []

    const stats = useMemo(() => {
        const total = users.length
        const admins = users.filter((user) => user.role === 'admin').length
        const normalUsers = users.filter((user) => user.role === 'user').length

        return {
            total,
            admins,
            normalUsers,
        }
    }, [users])

    const filteredUsers = useMemo(() => {
        const query = tableData.query?.toLowerCase().trim() || ''

        return users.filter((user) => {
            const matchesRole =
                roleFilter === 'all' ? true : user.role === roleFilter

            const matchesQuery =
                !query ||
                user.name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query) ||
                user.role?.toLowerCase().includes(query)

            return matchesRole && matchesQuery
        })
    }, [users, tableData.query, roleFilter])

    const sortedUsers = useMemo(() => {
        const copied = [...filteredUsers]
        const sort = tableData.sort

        if (!sort?.key || !sort?.order) {
            return copied
        }

        return copied.sort((a, b) => {
            const key = sort.key as keyof UserListItem
            const aValue = a[key]
            const bValue = b[key]

            if (key === 'createdAt') {
                const aDate = new Date(a.createdAt).getTime()
                const bDate = new Date(b.createdAt).getTime()
                return sort.order === 'asc' ? aDate - bDate : bDate - aDate
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sort.order === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            }

            return 0
        })
    }, [filteredUsers, tableData.sort])

    const paginatedUsers = useMemo(() => {
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const start = (pageIndex - 1) * pageSize
        const end = start + pageSize

        return sortedUsers.slice(start, end)
    }, [sortedUsers, tableData.pageIndex, tableData.pageSize])

    const csvData = useMemo(() => {
        return filteredUsers.map((user) => ({
            ID: user.id,
            Name: user.name,
            Email: user.email,
            Role: user.role,
            CreatedAt: new Date(user.createdAt).toLocaleString(),
        }))
    }, [filteredUsers])

    const handleSetTableData = (data: TableQueries) => {
        setTableData(data)
        if (selectedUsers.length > 0) {
            setSelectedUsers([])
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

    const handleRowSelect = (checked: boolean, row: UserListItem) => {
        if (checked) {
            setSelectedUsers((prev) => {
                const exists = prev.some((user) => user.id === row.id)
                if (exists) return prev
                return [...prev, row]
            })
        } else {
            setSelectedUsers((prev) =>
                prev.filter((user) => user.id !== row.id),
            )
        }
    }

    const handleAllRowSelect = (
        checked: boolean,
        rows: Row<UserListItem>[],
    ) => {
        if (checked) {
            const originalRows = rows.map((row) => row.original)
            setSelectedUsers(originalRows)
        } else {
            setSelectedUsers([])
        }
    }

    const handleClearSelection = () => {
        setSelectedUsers([])
    }

    const handleDelete = () => {
        setDeleteConfirmationOpen(true)
    }

    const handleCancelDelete = () => {
        if (deleteLoading) return
        setDeleteConfirmationOpen(false)
    }

    const handleConfirmDelete = async () => {
        try {
            setDeleteLoading(true)

            const ids = selectedUsers.map((user) => user.id)

            await apiDeleteUsers(ids)

            const newUsers = users.filter((user) => !ids.includes(user.id))

            setLocalUsers(newUsers)
            setSelectedUsers([])
            setDeleteConfirmationOpen(false)

            const filteredAfterDelete = newUsers.filter((user) => {
                const query = tableData.query?.toLowerCase().trim() || ''

                const matchesRole =
                    roleFilter === 'all' ? true : user.role === roleFilter

                const matchesQuery =
                    !query ||
                    user.name?.toLowerCase().includes(query) ||
                    user.email?.toLowerCase().includes(query) ||
                    user.role?.toLowerCase().includes(query)

                return matchesRole && matchesQuery
            })

            const totalPages = Math.ceil(
                filteredAfterDelete.length / (tableData.pageSize as number),
            )

            setTableData((prev) => ({
                ...prev,
                pageIndex:
                    totalPages > 0 && (prev.pageIndex as number) > totalPages
                        ? totalPages
                        : 1,
            }))

            toast.push(
                <Notification type="success">
                    Users deleted successfully
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error) {
            console.error('Delete users error:', error)

            toast.push(
                <Notification type="danger">
                    Failed to delete selected users
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleRoleChange = async (
        userId: string,
        nextRole: RoleType,
        currentRole: string,
    ) => {
        if (nextRole === currentRole) return

        try {
            setRoleUpdatingUserId(userId)

            await apiUpdateUserRole(userId, nextRole)

            const newUsers = users.map((user) =>
                user.id === userId ? { ...user, role: nextRole } : user,
            )

            setLocalUsers(newUsers)

            setSelectedUsers((prev) =>
                prev.map((user) =>
                    user.id === userId ? { ...user, role: nextRole } : user,
                ),
            )

            toast.push(
                <Notification type="success">
                    User role updated successfully
                </Notification>,
                { placement: 'top-center' },
            )
        } catch (error) {
            console.error('Update role error:', error)
            toast.push(
                <Notification type="danger">
                    Failed to update user role
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setRoleUpdatingUserId(null)
        }
    }

    const columns: ColumnDef<UserListItem>[] = useMemo(
        () => [
            {
                header: 'User',
                accessorKey: 'name',
                cell: (props) => {
                    const user = props.row.original

                    return (
                        <div className="flex items-center gap-3">
                            <Avatar size={32}>
                                {(user.name ?? 'U').charAt(0).toUpperCase()}
                            </Avatar>
                            <div>
                                <div className="heading-text font-bold">
                                    {user.name}
                                </div>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Email',
                accessorKey: 'email',
            },
            {
                header: 'Role',
                accessorKey: 'role',
                cell: (props) => {
                    const user = props.row.original

                    return (
                        <div className="min-w-[150px]">
                            <Select<RoleOption>
                                size="sm"
                                isDisabled={roleUpdatingUserId === user.id}
                                value={roleOptions.find(
                                    (option) => option.value === user.role,
                                )}
                                options={roleOptions}
                                onChange={(option) => {
                                    if (!option) return
                                    handleRoleChange(
                                        user.id,
                                        option.value,
                                        user.role,
                                    )
                                }}
                            />
                        </div>
                    )
                },
            },
            {
                header: 'Created at',
                accessorKey: 'createdAt',
                cell: (props) => {
                    return new Date(
                        props.row.original.createdAt,
                    ).toLocaleDateString()
                },
            },
        ],
        [roleUpdatingUserId, users],
    )

    return (
        <Loading loading={isLoading}>
            <div className="flex flex-col gap-4">
                <Card>
                    <UsersTableTools
                        tableData={tableData}
                        setTableData={setTableData}
                        roleFilter={roleFilter}
                        setRoleFilter={setRoleFilter}
                        csvData={csvData}
                        setSelectedUsers={setSelectedUsers}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="text-sm text-gray-500">
                                Total users
                            </div>
                            <h3 className="mt-2">{stats.total}</h3>
                        </div>

                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="text-sm text-gray-500">
                                Admins
                            </div>
                            <h3 className="mt-2">{stats.admins}</h3>
                        </div>

                        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                            <div className="text-sm text-gray-500">Users</div>
                            <h3 className="mt-2">{stats.normalUsers}</h3>
                        </div>
                    </div>

                    <div className="mt-6">
                        <DataTable
                            selectable
                            columns={columns}
                            data={paginatedUsers}
                            loading={isLoading}
                            noData={!isLoading && filteredUsers.length === 0}
                            skeletonAvatarColumns={[0]}
                            skeletonAvatarProps={{ width: 28, height: 28 }}
                            pagingData={{
                                total: filteredUsers.length,
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            checkboxChecked={(row) =>
                                selectedUsers.some(
                                    (selected) => selected.id === row.id,
                                )
                            }
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                            onCheckBoxChange={handleRowSelect}
                            onIndeterminateCheckBoxChange={handleAllRowSelect}
                        />
                    </div>
                </Card>

                {selectedUsers.length > 0 && (
                    <StickyFooter
                        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
                        defaultClass="container mx-auto px-8 rounded-xl border border-gray-200 dark:border-gray-600 mt-4"
                    >
                        <div className="container mx-auto">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <span className="text-lg text-primary">
                                        <TbChecks />
                                    </span>
                                    <span className="font-semibold flex items-center gap-1">
                                        <span className="heading-text">
                                            {selectedUsers.length} Users
                                        </span>
                                        <span>selected</span>
                                    </span>
                                </span>

                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        icon={<TbX />}
                                        onClick={handleClearSelection}
                                    >
                                        Clear selection
                                    </Button>

                                    <Button
                                        size="sm"
                                        type="button"
                                        icon={<TbTrash />}
                                        customColorClass={() =>
                                            'border-error ring-1 ring-error text-error hover:border-error hover:ring-error hover:text-error'
                                        }
                                        onClick={handleDelete}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </StickyFooter>
                )}

                <ConfirmDialog
                    isOpen={deleteConfirmationOpen}
                    type="danger"
                    title="Delete users"
                    onClose={handleCancelDelete}
                    onRequestClose={handleCancelDelete}
                    onCancel={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    confirmButtonProps={{ loading: deleteLoading }}
                >
                    <p>
                        Are you sure you want to delete these users? This action
                        can&apos;t be undone.
                    </p>
                </ConfirmDialog>
            </div>
        </Loading>
    )
}

export default UsersDashboard