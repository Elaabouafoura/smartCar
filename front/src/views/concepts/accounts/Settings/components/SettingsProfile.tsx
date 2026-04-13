import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import useSWR from 'swr'

import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Upload from '@/components/ui/Upload'
import { Form, FormItem } from '@/components/ui/Form'

import { HiOutlineUser } from 'react-icons/hi'
import { TbPlus } from 'react-icons/tb'

import {
    apiGetSettingsProfile,
    apiUpdateProfile,
    apiUploadAvatar,
} from '@/services/AccontsService'

import { useToken } from '@/store/authStore'

const profileSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email'),
    img: z.string().optional(),
})

type ProfileSchema = z.infer<typeof profileSchema>

const SettingsProfile = () => {
    const { token } = useToken()

    const { data, mutate, isLoading } = useSWR(
        token ? '/api/v1/auth/me' : null,
        apiGetSettingsProfile,
    )

    const {
        handleSubmit,
        reset,
        control,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<ProfileSchema>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            img: '',
        },
    })

    useEffect(() => {
        if (!data) return

        const parts = (data.name || '').trim().split(' ')
        const firstName = parts[0] || ''
        const lastName = parts.slice(1).join(' ')

        reset({
            firstName,
            lastName,
            email: data.email || '',
            img: data.avatarUrl || '',
        })
    }, [data, reset])

  const onSubmit = async (values: ProfileSchema) => {
    try {
        const payload: Record<string, unknown> = {
            name: `${values.firstName} ${values.lastName}`.trim(),
            email: values.email,
        }

        if (
            values.img &&
            /^https?:\/\/.+/i.test(values.img)
        ) {
            payload.avatarUrl = values.img
        }

        await apiUpdateProfile(payload)
        await mutate()
    } catch (err: any) {
        console.error('Update profile error:', err)
        console.error('Status:', err?.response?.status)
        console.error('Backend response:', err?.response?.data)
    }
}
    const handleUpload = async (files: File[]) => {
        try {
            if (!files.length) return

            const res = await apiUploadAvatar(files[0])

            if (res?.url) {
                setValue('img', res.url, { shouldDirty: true })
            }
        } catch (err) {
            console.error('Upload error:', err)
        }
    }

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <h4 className="mb-6">Personal Information</h4>

            <Controller
                name="img"
                control={control}
                render={({ field }) => (
                    <div className="flex items-center gap-4 mb-6">
                        <Avatar
                            size={90}
                            icon={<HiOutlineUser />}
                            src={field.value || undefined}
                        />

                        <Upload
                            showList={false}
                            uploadLimit={1}
                            onChange={handleUpload}
                        >
                            <Button type="button" icon={<TbPlus />}>
                                Upload
                            </Button>
                        </Upload>
                    </div>
                )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem
                    label="First Name"
                    errorMessage={errors.firstName?.message}
                >
                    <Controller
                        name="firstName"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                    />
                </FormItem>

                <FormItem
                    label="Last Name"
                    errorMessage={errors.lastName?.message}
                >
                    <Controller
                        name="lastName"
                        control={control}
                        render={({ field }) => <Input {...field} />}
                    />
                </FormItem>
            </div>

            <FormItem label="Email" errorMessage={errors.email?.message}>
                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => <Input {...field} />}
                />
            </FormItem>

            <div className="flex justify-end mt-4">
                <Button loading={isSubmitting || isLoading} type="submit">
                    Save
                </Button>
            </div>
        </Form>
    )
}

export default SettingsProfile