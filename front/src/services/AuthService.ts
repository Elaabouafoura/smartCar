import ApiService from './ApiService'
import endpointConfig from '@/configs/endpoint.config'
import type {
    SignInCredential,
    SignUpCredential,
    ForgotPassword,
    ResetPassword,
    SignInResponse,
    SignUpResponse,
    User,
} from '@/@types/auth'
import AxiosBase from './axios/AxiosBase'

export async function apiSignIn(data: SignInCredential) {
    return ApiService.fetchDataWithAxios<SignInResponse>({
        url: endpointConfig.signIn, 
        method: 'post',
        data,
    })
}

export async function apiSignUp(data: SignUpCredential) {
    return ApiService.fetchDataWithAxios<SignUpResponse>({
        url: endpointConfig.signUp,
        method: 'post',
        data,
    })
}

export async function apiSignOut(data: { refreshToken: string }) {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.signOut,
        method: 'post',
        data,
    })
}

export async function apiForgotPassword<T>(data: ForgotPassword) {
    return ApiService.fetchDataWithAxios<T>({
        url: endpointConfig.forgotPassword,
        method: 'post',
        data,
    })
}

export async function apiResetPassword(data: { token: string; newPass: string }) {
    return ApiService.fetchDataWithAxios<{
        message: string
    }>({
        url: endpointConfig.resetPassword,
        method: 'post',
        data,
    })
}
export async function apiGetMe() {
    return ApiService.fetchDataWithAxios<User>({
        url: '/auth/me',
        method: 'get',
    })
}