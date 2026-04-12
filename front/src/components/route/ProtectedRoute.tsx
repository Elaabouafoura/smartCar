import { Navigate, Outlet, useLocation } from 'react-router'
import appConfig from '@/configs/app.config'
import { useAuth } from '@/auth'

const { unAuthenticatedEntryPath } = appConfig

const ProtectedRoute = () => {
    const { authenticated } = useAuth()
    const location = useLocation()

    if (!authenticated) {
        const redirectUrl = `${location.pathname}${location.search}`
        return (
            <Navigate
                to={`${unAuthenticatedEntryPath}?redirectUrl=${encodeURIComponent(redirectUrl)}`}
                replace
            />
        )
    }

    return <Outlet />
}

export default ProtectedRoute