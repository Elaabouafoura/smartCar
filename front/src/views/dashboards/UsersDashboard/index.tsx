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
import { TbChecks, TbTrash, TbX, TbUsers, TbShield, TbUser } from 'react-icons/tb'
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
                            <Avatar 
                                size={40} 
                                className="bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md"
                            >
                                {(user.name ?? 'U').charAt(0).toUpperCase()}
                            </Avatar>
                            <div>
                                <div className="heading-text font-semibold text-gray-900 dark:text-gray-100">
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
                cell: (props) => (
                    <div className="text-gray-600 dark:text-gray-400">
                        {props.row.original.email}
                    </div>
                ),
            },
            {
                header: 'Role',
                accessorKey: 'role',
                cell: (props) => {
                    const user = props.row.original

                    return (
                        <div className="w-32">
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
                                className="role-select-custom"
                                styles={{
                                    control: (base, { isDisabled }) => ({
                                        ...base,
                                        backgroundColor: 'transparent',
                                        borderColor: '#e2e8f0',
                                        borderRadius: '8px',
                                        minHeight: '36px',
                                        boxShadow: 'none',
                                        '&:hover': {
                                            backgroundColor: 'transparent',
                                            borderColor: '#cbd5e1',
                                        },
                                        ...(isDisabled && {
                                            backgroundColor: '#f3f4f6',
                                            opacity: 0.6,
                                        }),
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: 'white',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        marginTop: '4px',
                                    }),
                                    option: (base, { isFocused, isSelected }) => ({
                                        ...base,
                                        backgroundColor: isSelected 
                                            ? '#3b82f6' 
                                            : isFocused 
                                            ? '#f3f4f6' 
                                            : 'white',
                                        color: isSelected ? 'white' : '#374151',
                                        cursor: 'pointer',
                                        '&:active': {
                                            backgroundColor: isSelected ? '#3b82f6' : '#e5e7eb',
                                        },
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: '#1f2937',
                                        fontWeight: 500,
                                    }),
                                    indicatorSeparator: (base) => ({
                                        ...base,
                                        backgroundColor: '#e2e8f0',
                                    }),
                                    dropdownIndicator: (base) => ({
                                        ...base,
                                        color: '#9ca3af',
                                        '&:hover': {
                                            color: '#6b7280',
                                        },
                                    }),
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
                    const date = new Date(props.row.original.createdAt)
                    return (
                        <div className="text-gray-500 dark:text-gray-400 text-sm">
                            {date.toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            })}
                        </div>
                    )
                },
            },
        ],
        [roleUpdatingUserId, users],
    )

    return (
        <Loading loading={isLoading}>
            <div className="flex flex-col gap-4">
                <Card className="shadow-lg border-0">
                    <UsersTableTools
                        tableData={tableData}
                        setTableData={setTableData}
                        roleFilter={roleFilter}
                        setRoleFilter={setRoleFilter}
                        csvData={csvData}
                        setSelectedUsers={setSelectedUsers}
                    />

                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="bg-gradient-to-br  dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</h3>
                                </div>
                                <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                                    <TbUsers className="text-blue-500 text-xl" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br  dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Admins</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.admins}</h3>
                                </div>
                                <div className="h-12 w-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                                    <TbShield className="text-purple-500 text-xl" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br  dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600 dark:text-green-400"> Users</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.normalUsers}</h3>
                                </div>
                                <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                                    <TbUser className="text-green-500 text-xl" />
                                </div>
                            </div>
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
                        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800 shadow-lg"
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
                                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                        Clear selection
                                    </Button>

                                    <Button
                                        size="sm"
                                        type="button"
                                        icon={<TbTrash />}
                                        customColorClass={() =>
                                            'border-error ring-1 ring-error text-error hover:border-error hover:ring-error hover:text-error hover:bg-error/10'
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