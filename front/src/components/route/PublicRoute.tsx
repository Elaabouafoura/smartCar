import { Navigate, Outlet } from 'react-router'
import appConfig from '@/configs/app.config'
import { useAuth } from '@/auth'

const { authenticatedEntryPath } = appConfig

const PublicRoute = () => {
    const { authenticated } = useAuth()
    const pathname = window.location.pathname

    const allowPublicEvenIfAuthenticated =
        pathname.startsWith('/password-new') ||
        pathname.startsWith('/auth/password-new') ||
        pathname.startsWith('/forgot-password')

    if (allowPublicEvenIfAuthenticated) {
        return <Outlet />
    }

    return authenticated ? <Navigate to={authenticatedEntryPath} replace /> : <Outlet />
}

export default PublicRoute