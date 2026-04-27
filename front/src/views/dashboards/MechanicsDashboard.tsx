import { useEffect, useMemo, useState } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import Tag from '@/components/ui/Tag'
import Avatar from '@/components/ui/Avatar'
import { Form, FormItem } from '@/components/ui/Form'
import DebouceInput from '@/components/shared/DebouceInput'
import classNames from '@/utils/classNames'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import {
    TbTool,
    TbEdit,
    TbTrash,
    TbMapPin,
    TbPhone,
    TbPlus,
    TbSearch,
} from 'react-icons/tb'
import {
    apiGetMechanics,
    apiGetAdminMechanics,
    apiCreateMechanic,
    apiUpdateMechanic,
    apiDeleteMechanic,
} from '@/services/DashboardService'

type Mechanic = {
    id: string
    name: string
    specialty?: string
    phone?: string
    location?: string
    isActive: boolean
    createdAt?: string
}

type MechanicForm = {
    name: string
    specialty?: string
    phone?: string
    location?: string
    isActive?: boolean
}

const schema = z.object({
    name: z.string().min(1, 'Nom obligatoire'),
    specialty: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    isActive: z.boolean().optional(),
})

const { Tr, Td, TBody, THead, Th } = Table

const getIsAdmin = () => {
    try {
        const token =
            localStorage.getItem('token') ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('access_token')

        if (!token) return false

        const payload = JSON.parse(atob(token.split('.')[1]))
        const role = payload?.role || payload?.user?.role || payload?.userRole

        return role?.toLowerCase() === 'admin'
    } catch {
        return false
    }
}

const MechanicsDashboard = () => {
    const isAdmin = useMemo(() => getIsAdmin(), [])

    const [mechanics, setMechanics] = useState<Mechanic[]>([])
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editing, setEditing] = useState<Mechanic | null>(null)

    const {
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting },
    } = useForm<MechanicForm>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: '',
            specialty: '',
            phone: '',
            location: '',
            isActive: true,
        },
    })

    const loadMechanics = async () => {
        setLoading(true)

        try {
            const data = isAdmin
                ? await apiGetAdminMechanics<Mechanic[]>()
                : await apiGetMechanics<Mechanic[]>()

            setMechanics(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadMechanics()
    }, [isAdmin])

    const filteredMechanics = useMemo(() => {
        const search = query.trim().toLowerCase()

        if (!search) return mechanics

        return mechanics.filter((mechanic) => {
            return (
                mechanic.name.toLowerCase().includes(search) ||
                mechanic.specialty?.toLowerCase().includes(search) ||
                mechanic.phone?.toLowerCase().includes(search) ||
                mechanic.location?.toLowerCase().includes(search)
            )
        })
    }, [mechanics, query])

    const openAdd = () => {
        setEditing(null)
        reset({
            name: '',
            specialty: '',
            phone: '',
            location: '',
            isActive: true,
        })
        setDialogOpen(true)
    }

    const openEdit = (mechanic: Mechanic) => {
        setEditing(mechanic)
        reset({
            name: mechanic.name,
            specialty: mechanic.specialty || '',
            phone: mechanic.phone || '',
            location: mechanic.location || '',
            isActive: mechanic.isActive,
        })
        setDialogOpen(true)
    }

    const closeDialog = () => {
        setDialogOpen(false)
        setEditing(null)
    }

    const submit = async (data: MechanicForm) => {
        if (!isAdmin) return

        if (editing) {
            await apiUpdateMechanic(editing.id, data)
        } else {
            await apiCreateMechanic(data)
        }

        await loadMechanics()
        closeDialog()
    }

    const remove = async (id: string) => {
        if (!isAdmin) return

        await apiDeleteMechanic(id)
        await loadMechanics()
    }

    const toggleActive = async (value: boolean, mechanic: Mechanic) => {
        if (!isAdmin) return

        await apiUpdateMechanic(mechanic.id, {
            isActive: value,
        })

        await loadMechanics()
    }

    return (
        <Card>
            <div className="flex flex-col gap-3 mb-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h4 className="mb-1">
                            {isAdmin
                                ? 'Mechanics'
                                : 'Mécaniciens'}
                        </h4>
                        <p className="text-sm text-gray-500">
                            {isAdmin
                                ? ''
                                : 'Consulter les mécaniciens actifs disponibles.'}
                        </p>
                    </div>

                    {isAdmin && (
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<TbPlus />}
                            onClick={openAdd}
                        >
                            Add mechanic
                        </Button>
                    )}
                </div>

                <DebouceInput
                    placeholder="Search"
                    suffix={<TbSearch className="text-lg" />}
                    onChange={(event) => {
                        const value = event.target.value
                        if (value.length > 1 || value.length === 0) {
                            setQuery(value)
                        }
                    }}
                />
            </div>

            <div className="mt-6">
                {loading ? (
                    <div className="py-8 text-center text-gray-500">
                        Loading...
                    </div>
                ) : (
                    <Table hoverable={false}>
                        <THead>
                            <Tr>
                                {isAdmin && <Th></Th>}
                                <Th>Mechanic </Th>
                                <Th>Specialty</Th>
                                <Th>Phone</Th>
                                <Th>Location</Th>
                                <Th>Status</Th>
                                {isAdmin && <Th>Actions</Th>}
                            </Tr>
                        </THead>

                        <TBody>
                            {filteredMechanics.map((mechanic) => (
                                <Tr key={mechanic.id}>
                                    {isAdmin && (
                                        <Td>
                                            
                                        </Td>
                                    )}

                                    <Td>
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                className="bg-transparent dark:bg-transparent p-2 border-2 border-gray-200 dark:border-gray-600"
                                                size={50}
                                                shape="round"
                                                icon={
                                                    <div className="text-2xl heading-text">
                                                        <TbTool />
                                                    </div>
                                                }
                                            />

                                            <div>
                                                <div className="heading-text font-bold">
                                                    {mechanic.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {mechanic.createdAt
                                                        ? dayjs(
                                                              mechanic.createdAt,
                                                          ).format(
                                                              'DD MMM YYYY',
                                                          )
                                                        : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </Td>

                                    <Td>
                                        {mechanic.specialty || (
                                            <span className="text-gray-400">
                                                N/A
                                            </span>
                                        )}
                                    </Td>

                                    <Td>
                                        <div className="flex items-center gap-2">
                                            <TbPhone />
                                            {mechanic.phone || (
                                                <span className="text-gray-400">
                                                    N/A
                                                </span>
                                            )}
                                        </div>
                                    </Td>

                                    <Td>
                                        <div className="flex items-center gap-2">
                                            <TbMapPin />
                                            {mechanic.location || (
                                                <span className="text-gray-400">
                                                    N/A
                                                </span>
                                            )}
                                        </div>
                                    </Td>

                                    <Td>
                                        <Tag
                                            className={classNames(
                                                mechanic.isActive
                                                    ? 'bg-emerald-200'
                                                    : 'bg-gray-200',
                                            )}
                                        >
                                            {mechanic.isActive
                                                ? 'Disponible'
                                                : 'Désactivé'}
                                        </Tag>
                                    </Td>

                                    {isAdmin && (
                                        <Td>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="xs"
                                                    icon={<TbEdit />}
                                                    onClick={() =>
                                                        openEdit(mechanic)
                                                    }
                                                />

                                                <Button
                                                    size="xs"
                                                    icon={<TbTrash />}
                                                    onClick={() =>
                                                        remove(mechanic.id)
                                                    }
                                                />
                                            </div>
                                        </Td>
                                    )}
                                </Tr>
                            ))}

                            {filteredMechanics.length === 0 && (
                                <Tr>
                                    <Td colSpan={isAdmin ? 7 : 5}>
                                        <div className="py-8 text-center text-gray-500">
                                            Aucun mécanicien trouvé.
                                        </div>
                                    </Td>
                                </Tr>
                            )}
                        </TBody>
                    </Table>
                )}
            </div>

            {isAdmin && (
                <Dialog
                    isOpen={dialogOpen}
                    width={600}
                    onClose={closeDialog}
                    onRequestClose={closeDialog}
                >
                    <h4>
                        {editing
                            ? 'Modifier mécanicien'
                            : 'Add mechanic'}
                    </h4>

                    <Form className="mt-6" onSubmit={handleSubmit(submit)}>
                        <FormItem
                            label="Name"
                            invalid={Boolean(errors.name)}
                            errorMessage={errors.name?.message}
                        >
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Nom mécanicien"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem label="Specialty">
                            <Controller
                                name="specialty"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Ex: Moteur"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem label="Phone">
                            <Controller
                                name="phone"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Ex: 22111222"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem label="Localisation">
                            <Controller
                                name="location"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        type="text"
                                        autoComplete="off"
                                        placeholder="Ex: Tunis centre"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>

                        <FormItem label="Actif">
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <Switcher
                                        checked={Boolean(field.value)}
                                        onChange={(value) =>
                                            field.onChange(value)
                                        }
                                    />
                                )}
                            />
                        </FormItem>

                        <div className="flex justify-end gap-2">
                            <Button type="button" onClick={closeDialog}>
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                variant="solid"
                                loading={isSubmitting}
                            >
                                {editing ? 'Update' : 'Submit'}
                            </Button>
                        </div>
                    </Form>
                </Dialog>
            )}
        </Card>
    )
}

export default MechanicsDashboard