import DebouceInput from '@/components/shared/DebouceInput'
import Button from '@/components/ui/Button'
import { CSVLink } from 'react-csv'
import { TbSearch } from 'react-icons/tb'
import cloneDeep from 'lodash/cloneDeep'
import type { ChangeEvent } from 'react'
import type { TableQueries } from '@/@types/common'
import type { UserListItem } from '@/services/DashboardService'

type Props = {
    tableData: TableQueries
    setTableData: React.Dispatch<React.SetStateAction<TableQueries>>
    roleFilter: string
    setRoleFilter: React.Dispatch<React.SetStateAction<string>>
    csvData: {
        ID: string
        Name: string
        Email: string
        Role: string
        CreatedAt: string
    }[]
    setSelectedUsers: React.Dispatch<React.SetStateAction<UserListItem[]>>
}

const UsersTableTools = ({
    tableData,
    setTableData,
    roleFilter,
    setRoleFilter,
    csvData,
    setSelectedUsers,
}: Props) => {
    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const val = event.target.value
        const newTableData = cloneDeep(tableData)
        newTableData.query = val
        newTableData.pageIndex = 1

        if (typeof val === 'string' && val.length > 1) {
            setTableData(newTableData)
        }

        if (typeof val === 'string' && val.length === 0) {
            setTableData(newTableData)
        }
    }

    const handleRoleFilterChange = (
        e: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        setRoleFilter(e.target.value)

        setTableData((prev) => ({
            ...prev,
            pageIndex: 1,
        }))

        setSelectedUsers([])
    }

    return (
        <div className="flex flex-col gap-4 mb-4">
            <div>
                <h4 className="mb-1">Users</h4>
                
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-2">
                <DebouceInput
                    placeholder="Search "
                    suffix={<TbSearch className="text-lg" />}
                    onChange={handleInputChange}
                />

                <select
                    value={roleFilter}
                    onChange={handleRoleFilterChange}
                    className="w-full md:w-[160px] rounded-lg border border-gray-300  bg-white  px-3 py-2 text-sm font-bold outline-none"
                >
                    <option value="all">All roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                </select>

                <CSVLink filename="users-list.csv" data={csvData}>
                    <Button size="sm">Export data</Button>
                </CSVLink>
            </div>
        </div>
    )
}

export default UsersTableTools