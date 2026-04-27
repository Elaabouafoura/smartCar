import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'
import type { CommonProps } from '@/@types/common'

interface LogoProps extends CommonProps {
    type?: 'full' | 'streamline'
    mode?: 'light' | 'dark'
    imgClass?: string
    logoWidth?: number | string
    logoHeight?: number | string
}

const LOGO_SRC_PATH = '/img/logo/'

const Logo = (props: LogoProps) => {
    const {
        type = 'full',
        mode = 'light',
        className,
        imgClass,
        style,
        logoWidth = 180,
        logoHeight = 100, 
    } = props

    return (
        <div
            className={classNames(
                'logo flex items-center justify-center',
                className,
            )}
            style={{
                width: '100%',
                height: logoHeight,
                ...style,
            }}
        >
            <img
                className={imgClass}
                style={{
                    width: logoWidth,
                    height: logoHeight,
                    objectFit: 'contain', // 🔥 évite déformation
                }}
                src={`${LOGO_SRC_PATH}logo-${mode}-${type}.png`}
                alt={`${APP_NAME} logo`}
            />
        </div>
    )
}

export default Logo