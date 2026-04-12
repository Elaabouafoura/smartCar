import { useState } from 'react'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import { apiResetPassword } from '@/services/AuthService'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CommonProps } from '@/@types/common'

interface ResetPasswordFormProps extends CommonProps {
    resetComplete: boolean
    setResetComplete?: (complete: boolean) => void
    setMessage?: (message: string) => void
    token: string
}

type ResetPasswordFormSchema = {
    newPassword: string
    confirmPassword: string
}

const validationSchema = z
    .object({
        newPassword: z
            .string()
            .min(6, 'Password must contain at least 6 characters'),
        confirmPassword: z
            .string()
            .min(1, 'Confirm Password Required'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Your passwords do not match',
        path: ['confirmPassword'],
    })

const ResetPasswordForm = (props: ResetPasswordFormProps) => {
    const [isSubmitting, setSubmitting] = useState(false)

    const {
        className,
        setMessage,
        setResetComplete,
        resetComplete,
        children,
        token,
    } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<ResetPasswordFormSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
    })

    const onResetPassword = async (values: ResetPasswordFormSchema) => {
        const { newPassword } = values
        setSubmitting(true)

        try {
            const resp = await apiResetPassword({
                token,
                newPass: newPassword,
            })

            setResetComplete?.(true)
            setMessage?.(resp?.message || 'Password reset successfully')
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error?.message ||
                'Failed to reset password'

            setMessage?.(msg)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className={className}>
            {!resetComplete ? (
                <Form onSubmit={handleSubmit(onResetPassword)}>
                    <FormItem
                        label="New Password"
                        invalid={Boolean(errors.newPassword)}
                        errorMessage={errors.newPassword?.message}
                    >
                        <Controller
                            name="newPassword"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="new-password"
                                    placeholder="Enter new password"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <FormItem
                        label="Confirm Password"
                        invalid={Boolean(errors.confirmPassword)}
                        errorMessage={errors.confirmPassword?.message}
                    >
                        <Controller
                            name="confirmPassword"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="new-password"
                                    placeholder="Confirm new password"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>

                    <Button
                        block
                        loading={isSubmitting}
                        variant="solid"
                        type="submit"
                    >
                        {isSubmitting ? 'Submitting...' : 'Reset Password'}
                    </Button>
                </Form>
            ) : (
                <>{children}</>
            )}
        </div>
    )
}

export default ResetPasswordForm