import { DASHBOARDS_PREFIX_PATH } from '@/constants/route.constant'
import {
    NAV_ITEM_TYPE_TITLE,
    NAV_ITEM_TYPE_ITEM,
} from '@/constants/navigation.constant'
import { ADMIN, USER } from '@/constants/roles.constant'
import type { NavigationTree } from '@/@types/navigation'

const dashboardsNavigationConfig: NavigationTree[] = [
    {
        key: 'dashboard',
        path: '',
        title: 'Dashboard',
        translateKey: 'nav.dashboard.dashboard',
        icon: 'dashboard',
        type: NAV_ITEM_TYPE_TITLE,
        authority: [ADMIN, USER],
        meta: {
            horizontalMenu: {
                layout: 'default',
            },
        },
        subMenu: [
            {
                key: 'dashboard.ecommerce',
                path: `${DASHBOARDS_PREFIX_PATH}/user`,
                title: 'Users',
                translateKey: 'nav.dashboard.ecommerce',
                icon: 'dashboardEcommerce',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                subMenu: [],
            },
            {
                key: 'dashboard.project',
                path: `${DASHBOARDS_PREFIX_PATH}/vehicle`,
                title: 'Vehicles',
                translateKey: 'nav.dashboard.project',
                icon: 'dashboardProject',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [ADMIN],
                subMenu: [],
            },
            {
                key: 'dashboard.analytic',
                path: `${DASHBOARDS_PREFIX_PATH}/analytic`,
                title: 'Analytic',
                translateKey: 'nav.dashboard.analytic',
                icon: 'dashboardAnalytic',
                type: NAV_ITEM_TYPE_ITEM,
                authority: [USER,ADMIN],
                subMenu: [],
            },
        ],
    },
]

export default dashboardsNavigationConfig