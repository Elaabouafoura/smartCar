import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import { Controller } from 'react-hook-form'
import type { FormSectionBaseProps } from '../types'

type GeneralSectionProps = FormSectionBaseProps

const GeneralSection = ({ control, errors }: GeneralSectionProps) => {
    return (
        <Card>
            <h4 className="mb-6">Basic Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem
                    label="Make"
                    invalid={Boolean(errors.make)}
                    errorMessage={errors.make?.message}
                >
                    <Controller
                        name="make"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Toyota"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Model"
                    invalid={Boolean(errors.model)}
                    errorMessage={errors.model?.message}
                >
                    <Controller
                        name="model"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Corolla"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Year"
                    invalid={Boolean(errors.year)}
                    errorMessage={errors.year?.message}
                >
                    <Controller
                        name="year"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="number"
                                autoComplete="off"
                                placeholder="2020"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Plate Number"
                    invalid={Boolean(errors.plateNumber)}
                    errorMessage={errors.plateNumber?.message}
                >
                    <Controller
                        name="plateNumber"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="123-TN-456"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="VIN"
                    invalid={Boolean(errors.vin)}
                    errorMessage={errors.vin?.message}
                >
                    <Controller
                        name="vin"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="text"
                                autoComplete="off"
                                placeholder="VIN12345678901234"
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    label="Current Mileage (Km)"
                    invalid={Boolean(errors.currentMileageKm)}
                    errorMessage={errors.currentMileageKm?.message}
                >
                    <Controller
                        name="currentMileageKm"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="number"
                                autoComplete="off"
                                placeholder="90000"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
            </div>
        </Card>
    )
}

export default GeneralSection