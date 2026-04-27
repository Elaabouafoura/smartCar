import { useEffect, useState, useRef, useCallback } from 'react'
import classNames from 'classnames'
import { io, Socket } from 'socket.io-client'
import withHeaderItem from '@/utils/hoc/withHeaderItem'
import Dropdown from '@/components/ui/Dropdown'
import ScrollBar from '@/components/ui/ScrollBar'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import NotificationAvatar from './NotificationAvatar'
import NotificationToggle from './NotificationToggle'
import { HiOutlineMailOpen } from 'react-icons/hi'
import { apiGetAlerts } from '@/services/CommonService'
import isLastChild from '@/utils/isLastChild'
import useResponsive from '@/utils/hooks/useResponsive'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'

import type { DropdownRef } from '@/components/ui/Dropdown'

type NotificationItem = {
    id: string
    type: 'dtc' | 'maintenance'
    level: 'critical' | 'warning' | 'info'
    title: string
    message: string
    vehicleId: string
    vehicleLabel?: string
    createdAt: string
    metadata?: Record<string, any>
    readed: boolean
}

type AlertApiItem = {
    id: string
    type: 'dtc' | 'maintenance'
    level: 'critical' | 'warning' | 'info'
    title: string
    message: string
    vehicleId: string
    vehicleLabel?: string
    createdAt: string
    metadata?: Record<string, any>
}

const notificationHeight = 'h-[280px]'

const _Notification = ({ className }: { className?: string }) => {
    const [notificationList, setNotificationList] = useState<NotificationItem[]>([])
    const [unreadNotification, setUnreadNotification] = useState(false)
    const [noResult, setNoResult] = useState(false)
    const [loading, setLoading] = useState(false)

    const socketRef = useRef<Socket | null>(null)
    const hasFetchedRef = useRef(false)
    const notificationDropdownRef = useRef<DropdownRef>(null)

    const { larger } = useResponsive()
    const navigate = useNavigate()

    const mapIncomingNotification = useCallback(
        (item: Partial<AlertApiItem>): NotificationItem => ({
            id: item.id || crypto.randomUUID(),
            type: item.type === 'maintenance' ? 'maintenance' : 'dtc',
            level:
                item.level === 'critical' ||
                item.level === 'warning' ||
                item.level === 'info'
                    ? item.level
                    : 'info',
            title: item.title || 'Notification',
            message: item.message || '',
            vehicleId: item.vehicleId || '',
            vehicleLabel: item.vehicleLabel,
            createdAt: item.createdAt || new Date().toISOString(),
            metadata: item.metadata || {},
            readed: false,
        }),
        [],
    )

    const fetchNotifications = useCallback(async () => {
        setLoading(true)

        try {
            const resp = await apiGetAlerts()

           
      const rawData = resp.data ?? []
            const mapped = rawData.map((item: AlertApiItem) =>
                mapIncomingNotification(item),
            )

            setNotificationList(mapped)
            setUnreadNotification(mapped.length > 0)
            setNoResult(mapped.length === 0)
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
            setNotificationList([])
            setUnreadNotification(false)
            setNoResult(true)
        } finally {
            setLoading(false)
        }
    }, [mapIncomingNotification])

    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken')
        const userId = localStorage.getItem('userId')

        const socket = io(
            import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000',
            {
                transports: ['websocket'],
                auth: {
                    token: accessToken,
                    userId,
                },
            },
        )

        socketRef.current = socket

        socket.on('connect', () => {
            console.log('socket connected')
        })

        socket.on('notification:new', (incoming: AlertApiItem) => {
            const notification = mapIncomingNotification(incoming)
            setNotificationList((prev) => [notification, ...prev])
            setUnreadNotification(true)
            setNoResult(false)
        })

        socket.on('notification:batch', (incoming: AlertApiItem[]) => {
            const notifications = Array.isArray(incoming)
                ? incoming.map(mapIncomingNotification)
                : []

            setNotificationList((prev) => [...notifications.reverse(), ...prev])

            if (notifications.length > 0) {
                setUnreadNotification(true)
                setNoResult(false)
            }
        })

        socket.on('disconnect', () => {
            console.log('socket disconnected')
        })

        return () => {
            socket.disconnect()
            socketRef.current = null
        }
    }, [mapIncomingNotification])

    const onNotificationOpen = async () => {
        if (!hasFetchedRef.current && notificationList.length === 0) {
            hasFetchedRef.current = true
            await fetchNotifications()
        }
    }

    const onMarkAllAsRead = () => {
        const list = notificationList.map((item) => ({
            ...item,
            readed: true,
        }))
        setNotificationList(list)
        setUnreadNotification(false)
    }

    const onMarkAsRead = (id: string) => {
        const list = notificationList.map((item) =>
            item.id === id ? { ...item, readed: true } : item,
        )

        setNotificationList(list)
        setUnreadNotification(list.some((item) => !item.readed))
    }

    const handleItemClick = (item: NotificationItem) => {
        onMarkAsRead(item.id)

        if (item.type === 'dtc') {
            navigate(`/app/vehicles/${item.vehicleId}?tab=dtc`)
        } else {
            navigate(`/app/vehicles/${item.vehicleId}?tab=maintenance`)
        }

        notificationDropdownRef.current?.handleDropdownClose()
    }

    const handleViewAllActivity = () => {
        navigate('/concepts/account/activity-log')
        notificationDropdownRef.current?.handleDropdownClose()
    }

    const getBadgeColor = (item: NotificationItem) => {
        if (item.readed) {
            return 'bg-gray-300 dark:bg-gray-600'
        }

        if (item.level === 'critical') {
            return 'bg-red-500'
        }

        if (item.level === 'warning') {
            return 'bg-amber-500'
        }

        return 'bg-primary'
    }

    return (
        <Dropdown
            ref={notificationDropdownRef}
            renderTitle={
                <NotificationToggle
                    dot={unreadNotification}
                    className={className}
                />
            }
            menuClass="min-w-[280px] md:min-w-[360px]"
            placement={larger.md ? 'bottom-end' : 'bottom'}
            onOpen={onNotificationOpen}
        >
            <Dropdown.Item variant="header">
                <div className="mb-1 flex items-center justify-between px-2 dark:border-gray-700">
                    <h6>Notifications</h6>
                    <Button
                        variant="plain"
                        shape="circle"
                        size="sm"
                        icon={<HiOutlineMailOpen className="text-xl" />}
                        title="Mark all as read"
                        onClick={onMarkAllAsRead}
                    />
                </div>
            </Dropdown.Item>

            <ScrollBar className={classNames('overflow-y-auto', notificationHeight)}>
                {notificationList.length > 0 &&
                    notificationList.map((item, index) => (
                        <div key={item.id}>
                            <div
                                className="relative flex cursor-pointer rounded-xl px-4 py-3 hover:bg-gray-100 active:bg-gray-100 dark:hover:bg-gray-700"
                                onClick={() => handleItemClick(item)}
                            >
                                <div>
                                    <NotificationAvatar
                                        type={item.type === 'dtc' ? 1 : 2}
                                        image=""
                                        target=""
                                        status=""
                                    />
                                </div>

                                <div className="mx-3 flex-1">
                                    <div className="pr-6">
                                        <span className="font-semibold heading-text">
                                            {item.title}
                                        </span>
                                    </div>

                                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                        {item.message}
                                    </div>

                                    {item.vehicleLabel && (
                                        <div className="mt-1 text-xs text-gray-500">
                                            {item.vehicleLabel}
                                        </div>
                                    )}

                                    <span className="mt-1 block text-xs text-gray-500">
                                        {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                                    </span>
                                </div>

                                <Badge
                                    className="absolute top-4 mt-1.5 ltr:right-4 rtl:left-4"
                                    innerClass={getBadgeColor(item)}
                                />
                            </div>

                            {!isLastChild(notificationList, index) ? (
                                <div className="my-2 border-b border-gray-200 dark:border-gray-700" />
                            ) : (
                                ''
                            )}
                        </div>
                    ))}

                {loading && (
                    <div
                        className={classNames(
                            'flex items-center justify-center',
                            notificationHeight,
                        )}
                    >
                        <Spinner size={40} />
                    </div>
                )}

                {noResult && notificationList.length === 0 && (
                    <div
                        className={classNames(
                            'flex items-center justify-center',
                            notificationHeight,
                        )}
                    >
                        <div className="text-center">
                            <img
                                className="mx-auto mb-2 max-w-[150px]"
                                src="/img/others/no-notification.png"
                                alt="no-notification"
                            />
                            <h6 className="font-semibold">No notifications!</h6>
                            <p className="mt-1">Please try again later</p>
                        </div>
                    </div>
                )}
            </ScrollBar>

            <Dropdown.Item variant="header">
                <div className="pt-4">
                    <Button
                        block
                        variant="solid"
                        onClick={handleViewAllActivity}
                    >
                        View All Activity
                    </Button>
                </div>
            </Dropdown.Item>
        </Dropdown>
    )
}

const Notification = withHeaderItem(_Notification)

export default Notification