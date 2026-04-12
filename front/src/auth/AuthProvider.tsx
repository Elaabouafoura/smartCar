import { useRef, useImperativeHandle, forwardRef } from 'react'
import { useNavigate, useLocation } from 'react-router'
import AuthContext from './AuthContext'
import appConfig from '@/configs/app.config'
import { useSessionUser, useToken } from '@/store/authStore'
import { apiSignIn, apiSignOut, apiSignUp, apiGetMe } from '@/services/AuthService'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import type {
  SignInCredential,
  SignUpCredential,
  AuthResult,
  OauthSignInCallbackPayload,
  User,
  Token,
} from '@/@types/auth'
import type { ReactNode } from 'react'
import type { NavigateFunction } from 'react-router'

type AuthProviderProps = { children: ReactNode }
export type IsolatedNavigatorRef = { navigate: NavigateFunction }

// Navigator isolé pour naviguer hors composant
const IsolatedNavigator = forwardRef<IsolatedNavigatorRef>((_, ref) => {
  const navigate = useNavigate()
  useImperativeHandle(ref, () => ({ navigate }), [navigate])
  return null
})

const PUBLIC_PAGES = ['/password-new', '/password-new', '/forgot-password', '/sign-in']
function AuthProvider({ children }: AuthProviderProps) {
  const signedIn = useSessionUser((s) => s.session.signedIn)
  const user = useSessionUser((s) => s.user)
  const setUser = useSessionUser((s) => s.setUser)
  const setSessionSignedIn = useSessionUser((s) => s.setSessionSignedIn)
  const { token, setToken } = useToken()
  const location = useLocation()
  const navigatorRef = useRef<IsolatedNavigatorRef>(null)

  const authenticated = Boolean(token && signedIn)

  const redirect = () => {
    if (PUBLIC_PAGES.some((page) => location.pathname.startsWith(page))) return

    const redirectUrl = new URLSearchParams(location.search).get(REDIRECT_URL_KEY)
    navigatorRef.current?.navigate(redirectUrl || appConfig.authenticatedEntryPath)
  }

  const handleSignIn = (tokens: Token) => {
    localStorage.setItem('accessToken', tokens.accessToken)
    if (tokens.refreshToken) localStorage.setItem('refreshToken', tokens.refreshToken)
    setToken(tokens.accessToken)
    setSessionSignedIn(true)
  }

  const handleSignOut = () => {
    setToken('')
    setUser(null)
    setSessionSignedIn(false)
  }

 const fetchUser = async (accessToken: string): Promise<User> => {
    const user = await apiGetMe()
    console.log('user from API:', user) 
    return user
}

const signIn = async (values: SignInCredential): Promise<AuthResult> => {
    try {
        const resp = await apiSignIn(values)
        handleSignIn(resp)
        const user = await fetchUser(resp.accessToken)
        setUser(user)
        // ← pas de redirect() ici
        return { status: 'success', message: 'Login successful', user }
    } catch (err: any) {
        return { status: 'failed', message: err?.response?.data?.message || err.toString() }
    }
}

  const signUp = async (values: SignUpCredential): Promise<AuthResult> => {
    try {
      const resp = await apiSignUp(values)
      handleSignIn(resp)
      setUser(await fetchUser(resp.accessToken))
      redirect()
      return { status: 'success', message: 'Account created' }
    } catch (err: any) {
      return { status: 'failed', message: err?.response?.data?.message || err.toString() }
    }
  }

  const signOut = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) await apiSignOut({ refreshToken })
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      handleSignOut()
      navigatorRef.current?.navigate('/')
    }
  }

  const oAuthSignIn = (callback: (payload: OauthSignInCallbackPayload) => void) => {
    callback({ onSignIn: handleSignIn, redirect })
  }

  return (
    <AuthContext.Provider value={{ authenticated, user, signIn, signUp, signOut, oAuthSignIn }}>
      {children}
      <IsolatedNavigator ref={navigatorRef} />
    </AuthContext.Provider>
  )
}

export default AuthProvider