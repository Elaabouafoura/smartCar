import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import { useSessionUser } from '@/store/authStore'
import { Link } from 'react-router'
import {
    PiUserDuotone,
    PiGearDuotone,
    PiPulseDuotone,
    PiSignOutDuotone,
} from 'react-icons/pi'
import { useAuth } from '@/auth'
import type { JSX } from 'react'

type DropdownList = {
    label: string
    path: string
    icon: JSX.Element
}

const dropdownItemList: DropdownList[] = [
    { label: 'Profile', path: '/concepts/account/settings', icon: <PiUserDuotone /> },
    { label: 'Account Setting', path: '/concepts/account/settings', icon: <PiGearDuotone /> },
    { label: 'Activity Log', path: '/concepts/account/activity-log', icon: <PiPulseDuotone /> },
]

const _UserDropdown = () => {
    const user = useSessionUser((state) => state.user)
    const { signOut } = useAuth()

    const handleSignOut = () => {
        signOut()
    }

    const avatarProps = user?.avatarUrl
        ? { src: user.avatarUrl }
        : { icon: <PiUserDuotone /> }

    return (
        <Dropdown
            className="flex"
            toggleClassName="flex items-center"
            renderTitle={
                <div className="cursor-pointer flex items-center">
                    <Avatar size={32} {...avatarProps} />
                </div>
            }
            placement="bottom-end"
        >
            {/* Header */}
            <Dropdown.Item variant="header">
                <div className="py-2 px-3 flex items-center gap-3">
                    <Avatar {...avatarProps} />
                    <div>
                        <div className="font-bold text-gray-900 dark:text-gray-100">
                            {user?.name || 'Anonymous'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.email || 'No email available'}
                        </div>
                    </div>
                </div>
            </Dropdown.Item>

            <Dropdown.Item variant="divider" />

            {/* Navigation items */}
            {dropdownItemList.map((item) => (
                <Dropdown.Item key={item.label} className="px-0">
                    <Link className="flex h-full w-full px-2" to={item.path}>
                        <span className="flex gap-2 items-center w-full">
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                        </span>
                    </Link>
                </Dropdown.Item>
            ))}

            <Dropdown.Item variant="divider" />

            {/* Sign Out */}
            <Dropdown.Item eventKey="Sign Out" className="gap-2" onClick={handleSignOut}>
                <span className="text-xl">
                    <PiSignOutDuotone />
                </span>
                <span>Sign Out</span>
            </Dropdown.Item>
        </Dropdown>
    )
}

const UserDropdown = withHeaderItem(_UserDropdown)
export default UserDropdown