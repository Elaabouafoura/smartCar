import { lazy } from 'react'
import { DASHBOARDS_PREFIX_PATH } from '@/constants/route.constant'
import { ADMIN, USER } from '@/constants/roles.constant'
import type { Routes } from '@/@types/routes'

const dashboardsRoute: Routes = [
    {
        key: 'dashboard.ecommerce',
        path: `${DASHBOARDS_PREFIX_PATH}/user`,
        component: lazy(() => import('@/views/dashboards/UsersDashboard')),
        authority: [ADMIN],
        meta: {
            pageContainerType: 'contained',
        },
    },
   {
    key: 'dashboard.vehicleDetails',
    path: `${DASHBOARDS_PREFIX_PATH}/vehicle/:id`,
    component: lazy(() => import('@/views/dashboards/VehicleDashboard/VehicleDetails')),
    authority: [ADMIN],
    meta: {
        pageContainerType: 'contained',
    },
},
{
    key: 'dashboard.project',
    path: `${DASHBOARDS_PREFIX_PATH}/vehicle`,
    component: lazy(() => import('@/views/dashboards/VehicleDashboard')),
    authority: [ADMIN],
    meta: {
        pageContainerType: 'contained',
    },
},
    {
        key: 'dashboard.marketing',
        path: `${DASHBOARDS_PREFIX_PATH}/marketing`,
        component: lazy(() => import('@/views/dashboards/MarketingDashboard')),
        authority: [ADMIN, USER],
        meta: {
            pageContainerType: 'contained',
        },
    },
    {
        key: 'dashboard.analytic',
        path: `${DASHBOARDS_PREFIX_PATH}/analytic`,
        component: lazy(() => import('@/views/dashboards/AnalyticDashboard')),
        authority: [USER,ADMIN],
        meta: {
            pageContainerType: 'contained',
            pageBackgroundType: 'plain',
        },
    },
]

export default dashboardsRoute