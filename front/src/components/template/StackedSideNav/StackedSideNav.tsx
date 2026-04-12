import { useState } from 'react'
import {
    SPLITTED_SIDE_NAV_MINI_WIDTH,
    STACKED_SIDE_NAV_SECONDARY_WIDTH,
    DIR_LTR,
    DIR_RTL,
} from '@/constants/theme.constant'
import StackedSideNavMini, { SelectedMenuItem } from './StackedSideNavMini'
import StackedSideNavSecondary from './StackedSideNavSecondary'
import useResponsive from '@/utils/hooks/useResponsive'
import { useThemeStore } from '@/store/themeStore'
import { useRouteKeyStore } from '@/store/routeKeyStore'
import { useSessionUser } from '@/store/authStore'
import appConfig from '@/configs/app.config'
import isEmpty from 'lodash/isEmpty'
import useTranslation from '@/utils/hooks/useTranslation'
import type { TraslationFn } from '@/@types/common'

const stackedSideNavDefaultStyle = {
    width: SPLITTED_SIDE_NAV_MINI_WIDTH,
}

const StackedSideNav = () => {
}

export default StackedSideNav
