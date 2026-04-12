export type SignInCredential = {
    email: string
    password: string
}

export type SignUpCredential = {
    name: string
    email: string
    password: string
}

export type SignInResponse = {
    accessToken: string
    refreshToken: string
}

export type SignUpResponse = SignInResponse

export type AuthRequestStatus = 'success' | 'failed' | ''

export type AuthResult = {
    [x: string]: any
    status: AuthRequestStatus
    message: string
    user?: User 
}

export type User = {
    id?: string | null
    avatarUrl?: string | null
    name?: string | null
    email?: string | null
    role?: string | null
} | null

export type Token = {
    accessToken: string
    refreshToken?: string
}

export type OauthSignInCallbackPayload = {
    onSignIn: (tokens: Token, user?: User) => void
    redirect: () => void
}
export type ForgotPassword = {
    email: string
}

export type ResetPassword = {
    token: string    
    newPass: string  
}