import ApiService from './ApiService'
export type UserListItem = {
    id: string
    email: string
    name: string
    role: 'admin' | 'user'
    createdAt: string
}

export async function apiGetUsers<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/users',
        method: 'get',
    })
}
export async function apiDeleteUser<T>(id: string) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/users/${id}`,
        method: 'delete',
    })
}

export async function apiDeleteUsers(ids: string[]) {
    return Promise.all(
        ids.map((id) =>
            ApiService.fetchDataWithAxios({
                url: `/users/${id}`,
                method: 'delete',
            }),
        ),
    )
}








export type VehicleListItem = {
    owner:  UserListItem
    id: string
    userId: string
    make: string
    model: string
    year: number
    vin: string
    plateNumber: string
    currentMileageKm: number
    photoUrl?: string | null
    healthScore?: number | null
    isDeleted?: boolean
    deletedAt?: string | null
    createdAt: string
    updatedAt?: string
}

export async function apiGetAdminVehicles<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/vehicles/admin/all',
        method: 'get',
    })
}


export async function apiGetAdminVehicleById<T>(id: string) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/vehicles/admin/${id}`,
        method: 'get',
    })
}

export async function apiDeleteAdminVehicle<T>(id: string) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/vehicles/admin/${id}`,
        method: 'delete',
    })
}

export async function apiDeleteAdminVehicles(ids: string[]) {
    return Promise.all(ids.map((id) => apiDeleteAdminVehicle(id)))
}

export type VehiclePaginatedResponse = {
    data: VehicleListItem[]
    total: number
    page: number
    limit: number
}

export async function apiGetMyVehicles<T>(params: {
    page: number
    limit: number
}) {
    return ApiService.fetchDataWithAxios<T>({
        url: '/vehicles',
        method: 'get',
        params,
    })
}



export async function apiGetMyVehicleById<T>(id: string) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/vehicles/${id}`,
        method: 'get',
    })
}

export async function apiUpdateMyVehicle<T>(
    id: string,
    data: {
        make: string
        model: string
        year: number
        vin: string
        plateNumber: string
        currentMileageKm: number
        photoUrl?: string | null
    },
) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/vehicles/${id}`,
        method: 'patch',
        data,
    })
}


export async function apiUploadVehicleImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return ApiService.fetchDataWithAxios<{ photoUrl: string }>({
        url: '/vehicles/upload-image',
        method: 'post',
        data: formData as any,
    })
}


export async function apiUploadVehicleSensorData(
    vehicleId: string,
    file: File,
) {
    const formData = new FormData()
    formData.append('file', file)

    return ApiService.fetchDataWithAxios<
        { message?: string },
        FormData
    >({
        url: `/vehicles/${vehicleId}/sensor-data/upload`,
        method: 'post',
        data: formData,
    })
}

export async function apiUploadVehicleDtc(
    vehicleId: string,
    file: File,
) {
    const formData = new FormData()
    formData.append('file', file)

    return ApiService.fetchDataWithAxios<
        { message?: string },
        FormData
    >({
        url: `/vehicles/${vehicleId}/dtc/upload`,
        method: 'post',
        data: formData,
    })
}

export async function apiUploadVehicleMaintenance(
    vehicleId: string,
    file: File,
) {
    const formData = new FormData()
    formData.append('file', file)

    return ApiService.fetchDataWithAxios<{ message?: string }, FormData>({
        url: `/vehicles/${vehicleId}/maintenance/upload`,
        method: 'post',
        data: formData,
    })
}




export type UploadItem = {
    id: string
    filename: string
    status: 'processing' | 'success' | 'failed'
    row_count?: number | null
    errors?: unknown
    created_at: string
    vehicle?: {
        id: string
        make?: string
        model?: string
        plateNumber?: string
    }
}

export type UploadPaginatedResponse = {
    data: UploadItem[]
    total: number
    page: number
    limit: number
}

export async function apiGetUploads<T>(params: {
    page: number
    limit: number
}) {
    return ApiService.fetchDataWithAxios<T>({
        url: '/uploads',
        method: 'get',
        params,
    })
}

export async function apiGetUploadById<T>(id: string) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/uploads/${id}`,
        method: 'get',
    })
}

export async function apiDeleteUpload<T>(id: string) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/uploads/${id}`,
        method: 'delete',
    })
}



export async function apiGetUploadsByVehicle<T, U extends Record<string, unknown>>(
    params: U,
) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/uploads/vehicle/${params.vehicleId}`,
        method: 'get',
        params: {
            page: params.page,
            limit: params.limit,
        },
    })
}







export async function apiGetEcommerceDashboard<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/api/dashboard/ecommerce',
        method: 'get',
    })
}

export async function apiGetProjectDashboard<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/api/dashboard/project',
        method: 'get',
    })
}

export async function apiGetAnalyticDashboard<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/api/dashboard/analytic',
        method: 'get',
    })
}

export async function apiGetMarketingDashboard<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/api/dashboard/marketing',
        method: 'get',
    })
}




export async function apiGetVehicleDashboard<T>(vehicleId: string) {
    return ApiService.fetchDataWithAxios<T>({
        url: `/vehicles/${vehicleId}/sensor-data/dashboard`,
        method: 'get',
    })
}