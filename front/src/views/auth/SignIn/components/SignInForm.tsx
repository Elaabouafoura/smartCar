import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import classNames from '@/utils/classNames'
import useAuth from '@/auth/useAuth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CommonProps } from '@/@types/common'
import type { ReactNode } from 'react'
// ← import { result } from 'lodash' supprimé

interface SignInFormProps extends CommonProps {
    disableSubmit?: boolean
    passwordHint?: string | ReactNode
    setMessage?: (message: string) => void
}

type SignInFormSchema = {
    email: string
    password: string
}

const validationSchema = z.object({
    email: z.string().min(1, { message: 'Please enter your email' }),
    password: z.string().min(1, { message: 'Please enter your password' }),
})

const SignInForm = (props: SignInFormProps) => {
    const [isSubmitting, setSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const { disableSubmit = false, className, passwordHint, setMessage } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<SignInFormSchema>({
        defaultValues: {
            email: 'exemple@gmail.com',
            password: 'password',
        },
        resolver: zodResolver(validationSchema),
    })

    const { signIn } = useAuth()

    const onSignIn = async (values: { email: string; password: string }) => {
        setSubmitting(true)
        setMessage?.('')

        try {
            const result = await signIn({ email: values.email, password: values.password })

            if (result.status === 'success') {
    console.log('result.user:', result.user) 
    
    if (result.user?.role === 'ADMIN') {
        window.location.href = '/dashboards/user'
    } else {
        window.location.href = '/dashboards/analytic'
    }
}
            
        } catch (err: any) {
            setMessage?.(err?.message || 'Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className={className}>
            <Form onSubmit={handleSubmit(onSignIn)}>
                <FormItem
                    label="Email"
                    invalid={Boolean(errors.email)}
                    errorMessage={errors.email?.message}
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input type="email" placeholder="Email" autoComplete="off" {...field} />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Password"
                    invalid={Boolean(errors.password)}
                    errorMessage={errors.password?.message}
                    className={classNames(
                        passwordHint ? 'mb-0' : '',
                        errors.password?.message ? 'mb-8' : '',
                    )}
                >
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <PasswordInput placeholder="Password" autoComplete="off" {...field} />
                        )}
                    />
                </FormItem>

                {passwordHint}

                {errorMessage && (
                    <div className="text-red-500 mb-4 text-sm">{errorMessage}</div>
                )}

                <Button block loading={isSubmitting} type="submit" variant="solid">
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
            </Form>
        </div>
    )
}

export default SignInForm