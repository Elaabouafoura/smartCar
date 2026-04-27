import axios from 'axios'

const AxiosBase = axios.create({
  baseURL: 'http://localhost:3000/api/v1', 
  timeout: 60000,
})


AxiosBase.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')

  if (
    token &&
    !config.url?.includes('/auth/login') &&
    !config.url?.includes('/auth/register') &&
    !config.url?.includes('/auth/forgot-password') &&
    !config.url?.includes('/auth/reset-password')
  ) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

AxiosBase.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export default AxiosBase