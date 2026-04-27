import ApiService from './ApiService'

export async function apiGetNotificationCount() {
    return ApiService.fetchDataWithAxios<{
        count: number
    }>({
        url: '/notification/count',
        method: 'get',
    })
}

export async function apiGetNotificationList() {
    return ApiService.fetchDataWithAxios<
        {
            id: string
            target: string
            description: string
            date: string
            image: string
            type: number
            location: string
            locationLabel: string
            status: string
            readed: boolean
        }[]
    >({
        url: '/notification/list',
        method: 'get',
    })
}

export async function apiGetSearchResult<T>(params: { query: string }) {
    return ApiService.fetchDataWithAxios<T>({
        url: '/search/query',
        method: 'get',
        params,
    })
}
export type AlertItem = {
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

export async function apiGetAlerts() {
    return ApiService.fetchDataWithAxios<{
        data: AlertItem[]
        total: number
    }>({
        url: '/alerts',
        method: 'get',
    })
}