import endpointConfig from '@/configs/endpoint.config'
import ApiService from './ApiService'

import AxiosBase from './axios/AxiosBase'

export async function apiGetSettingsNotification<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/setting/notification',
        method: 'get',
    })
}

export async function apiGetSettingsBilling<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/setting/billing',
        method: 'get',
    })
}

export async function apiGetSettingsIntergration<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/setting/intergration',
        method: 'get',
    })
}

export async function apiGetRolesPermissionsUsers<
    T,
    U extends Record<string, unknown>,
>(params: U) {
    return ApiService.fetchDataWithAxios<T>({
        url: '/rbac/users',
        method: 'get',
        params,
    })
}

export async function apiGetRolesPermissionsRoles<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/rbac/roles',
        method: 'get',
    })
}

export async function apiGetPricingPlans<T>() {
    return ApiService.fetchDataWithAxios<T>({
        url: '/pricing',
        method: 'get',
    })
}


export const apiGetSettingsProfile = async () => {
  const res = await AxiosBase.get(endpointConfig.me)
  return res.data
}

// 🔹 UPDATE PROFILE
export const apiUpdateProfile = async (data: any) => {
  const res = await AxiosBase.patch('/users/me', data)
  return res.data
}

// 🔹 UPLOAD AVATAR
export const apiUploadAvatar = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const res = await AxiosBase.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  
  return res.data
}