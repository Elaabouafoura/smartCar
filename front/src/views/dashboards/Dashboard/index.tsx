import { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import dayjs from 'dayjs'
import Card from '@/components/ui/Card'
import Loading from '@/components/shared/Loading'
import Segment from '@/components/ui/Segment'
import ApexChart from 'react-apexcharts'
import classNames from '@/utils/classNames'
import {
    TbGauge,
    TbRoute,
    TbEngine,
    TbTemperature,
} from 'react-icons/tb'
import { apiGetMyVehicles, apiGetVehicleDashboard } from '@/services/DashboardService'
import { COLORS } from '@/constants/chart.constant'
import { useThemeStore } from '@/store/themeStore'
import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    AreaChart,
    Area,
} from 'recharts'
import type { ReactNode } from 'react'

type VehicleItem = {
    id: string
    make?: string
    model?: string
    plateNumber?: string
    year?: number
}

type VehicleDashboardResponse = {
    vehicle: {
        id: string
        make?: string | null
        model?: string | null
        plateNumber?: string | null
        year?: number | null
    }
    selectedUploadId?: string | null
    summary: {
        totalReadings: number
        rpmMax: number
        speedMax: number
        coolantAvg: number
        fuelAvg: number
    }
    charts: {
        rpmSpeed: {
            timestamp: string
            engine_rpm: number
            vehicle_speed_kmh: number
        }[]
        loadThrottle: {
            timestamp: string
            engine_load_pct: number
            throttle_position_pct: number
        }[]
        temperatures: {
            timestamp: string
            coolant_temp_c: number
            intake_air_temp_c: number
            ambient_temp_c: number
        }[]
        trimsMaf: {
            timestamp: string
            short_fuel_trim_pct: number
            long_fuel_trim_pct: number
            maf_airflow_gs: number
        }[]
    }
}

type VehicleDashboardItem = {
    vehicle: VehicleItem
    dashboard: VehicleDashboardResponse
}

type CombinedMetricFilter = 'charge' | 'temperatures'

const Dashboard = () => {
    const isFirstRender = useRef(true)

    const sideNavCollapse = useThemeStore(
        (state) => state.layout.sideNavCollapse,
    )

    const { data: vehiclesResponse, isLoading: vehiclesLoading } = useSWR(
        ['/api/vehicles/my'],
        () =>
            apiGetMyVehicles<{
                data: VehicleItem[]
            }>({ page: 1, limit: 100 }),
        {
            revalidateOnFocus: false,
            revalidateIfStale: false,
            revalidateOnReconnect: false,
        },
    )

    const [dashboards, setDashboards] = useState<VehicleDashboardItem[]>([])
    const [loadingDashboards, setLoadingDashboards] = useState(false)

    useEffect(() => {
        if (!sideNavCollapse && isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        if (!isFirstRender.current) {
            window.dispatchEvent(new Event('resize'))
        }
    }, [sideNavCollapse])

    useEffect(() => {
        const loadDashboards = async () => {
            const vehicles = vehiclesResponse?.data

            if (!vehicles || vehicles.length === 0) {
                setDashboards([])
                return
            }

            setLoadingDashboards(true)

            try {
                const results = await Promise.all(
                    vehicles.map(async (vehicle) => {
                        const dashboard =
                            await apiGetVehicleDashboard<VehicleDashboardResponse>(
                                vehicle.id,
                            )

                        return {
                            vehicle,
                            dashboard,
                        }
                    }),
                )

                setDashboards(results)
            } finally {
                setLoadingDashboards(false)
            }
        }

        loadDashboards()
    }, [vehiclesResponse])

    const isLoading = vehiclesLoading || loadingDashboards

    const formatTime = (value: string) => dayjs(value).format('HH:mm')

    return (
        <Loading loading={isLoading}>
            <div className="flex flex-col gap-6">
                {dashboards.map(({ vehicle, dashboard }) => {
                    const title =
                        [vehicle.make, vehicle.model].filter(Boolean).join(' ') ||
                        `Véhicule ${vehicle.id}`

                    return (
                        <Card
                            key={vehicle.id}
                            className="overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-sm dark:border-gray-700/70 dark:bg-gray-900"
                        >
                            <div className="bg-white px-6 py-5 dark:bg-gray-900">
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                                {title}
                                            </h3>
                                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                {vehicle.year ? `${vehicle.year} • ` : ''}
                                                {vehicle.plateNumber
                                                    ? `Plaque: ${vehicle.plateNumber}`
                                                    : 'Aucune plaque'}
                                            </div>
                                        </div>
                                    </div>

                                    <VehicleQuickStats dashboard={dashboard} />
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-12">
                                        <CombinedMonitorChart dashboard={dashboard} />
                                    </div>

                                    <div className="col-span-12 lg:col-span-6">
                                        <ModernChartSection
                                            title="RPM and speed"
                                            height={320}
                                        >
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={dashboard.charts.rpmSpeed}>
                                                    <defs>
                                                        <linearGradient
                                                            id={`rpmGradient-${vehicle.id}`}
                                                            x1="0"
                                                            y1="0"
                                                            x2="0"
                                                            y2="1"
                                                        >
                                                            <stop
                                                                offset="5%"
                                                                stopColor={COLORS[0]}
                                                                stopOpacity={0.22}
                                                            />
                                                            <stop
                                                                offset="95%"
                                                                stopColor={COLORS[0]}
                                                                stopOpacity={0.02}
                                                            />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                        vertical={false}
                                                    />
                                                    <XAxis
                                                        dataKey="timestamp"
                                                        tickFormatter={formatTime}
                                                        tick={{ fontSize: 12 }}
                                                    />
                                                    <YAxis
                                                        yAxisId="left"
                                                        tick={{ fontSize: 12 }}
                                                    />
                                                    <YAxis
                                                        yAxisId="right"
                                                        orientation="right"
                                                        tick={{ fontSize: 12 }}
                                                    />
                                                    <Tooltip
                                                        labelFormatter={(value) =>
                                                            dayjs(value).format(
                                                                'YYYY-MM-DD HH:mm:ss',
                                                            )
                                                        }
                                                    />
                                                    <Legend />
                                                    <Area
                                                        yAxisId="left"
                                                        type="monotone"
                                                        dataKey="engine_rpm"
                                                        stroke={COLORS[0]}
                                                        fill={`url(#rpmGradient-${vehicle.id})`}
                                                        strokeWidth={2.5}
                                                        name="RPM"
                                                    />
                                                    <Line
                                                        yAxisId="right"
                                                        type="monotone"
                                                        dataKey="vehicle_speed_kmh"
                                                        stroke={COLORS[7]}
                                                        strokeWidth={2.5}
                                                        dot={false}
                                                        name="Vitesse km/h"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </ModernChartSection>
                                    </div>

                                    <div className="col-span-12 lg:col-span-6">
                                        <ModernChartSection
                                            title="Fuel trims and MAF"
                                            height={320}
                                        >
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={dashboard.charts.trimsMaf}>
                                                    <CartesianGrid
                                                        strokeDasharray="3 3"
                                                        vertical={false}
                                                    />
                                                    <XAxis
                                                        dataKey="timestamp"
                                                        tickFormatter={formatTime}
                                                        tick={{ fontSize: 12 }}
                                                    />
                                                    <YAxis
                                                        yAxisId="left"
                                                        tick={{ fontSize: 12 }}
                                                    />
                                                    <YAxis
                                                        yAxisId="right"
                                                        orientation="right"
                                                        tick={{ fontSize: 12 }}
                                                    />
                                                    <Tooltip
                                                        labelFormatter={(value) =>
                                                            dayjs(value).format(
                                                                'YYYY-MM-DD HH:mm:ss',
                                                            )
                                                        }
                                                    />
                                                    <Legend />
                                                    <Line
                                                        yAxisId="left"
                                                        type="monotone"
                                                        dataKey="short_fuel_trim_pct"
                                                        stroke="#7dd3fc"
                                                        strokeWidth={2.5}
                                                        dot={false}
                                                        name="Short trim %"
                                                    />
                                                    <Line
                                                        yAxisId="left"
                                                        type="monotone"
                                                        dataKey="long_fuel_trim_pct"
                                                        stroke="#fbbf24"
                                                        strokeWidth={2.5}
                                                        dot={false}
                                                        name="Long trim %"
                                                    />
                                                    <Line
                                                        yAxisId="right"
                                                        type="monotone"
                                                        dataKey="maf_airflow_gs"
                                                        stroke="#6ee7b7"
                                                        strokeWidth={2.5}
                                                        dot={false}
                                                        name="MAF g/s"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </ModernChartSection>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </div>
        </Loading>
    )
}

const VehicleQuickStats = ({
    dashboard,
}: {
    dashboard: VehicleDashboardResponse
}) => {
    return (
        <div className="rounded-3xl border border-gray-200 bg-white/70 dark:border-gray-700 dark:bg-gray-900/40">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-0">
                <SummarySegment
                    title=" Max RPM"
                    value={`${dashboard.summary.rpmMax} tr/min`}
                    icon={<TbGauge />}
                    iconClass="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                    className="border-b border-r-0 md:border-b xl:border-b-0 xl:ltr:border-r xl:rtl:border-l border-gray-200 dark:border-gray-700"
                />
                <SummarySegment
                    title="Max Speed"
                    value={`${dashboard.summary.speedMax} km/h`}
                    icon={<TbRoute />}
                    iconClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    className="border-b md:border-b xl:border-b-0 xl:ltr:border-r xl:rtl:border-l border-gray-200 dark:border-gray-700"
                />
                <SummarySegment
                    title="Load"
                    value={`${dashboard.summary.totalReadings} lectures`}
                    icon={<TbEngine />}
                    iconClass="bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                    className="border-b border-r-0 md:border-b-0 md:ltr:border-r md:rtl:border-l border-gray-200 dark:border-gray-700"
                />
                <SummarySegment
                    title="Temperature"
                    value={`${dashboard.summary.coolantAvg} °C`}
                    icon={<TbTemperature />}
                    iconClass="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                />
            </div>
        </div>
    )
}

type SummarySegmentProps = {
    title: string
    value: string | number | ReactNode
    icon: ReactNode
    iconClass: string
    className?: string
}

const SummarySegment = ({
    title,
    value,
    icon,
    iconClass,
    className,
}: SummarySegmentProps) => {
    return (
        <div className={classNames('flex flex-col gap-2 px-6 py-5', className)}>
            <div
                className={classNames(
                    'flex items-center justify-center min-h-12 min-w-12 max-h-12 max-w-12 rounded-full text-2xl',
                    iconClass,
                )}
            >
                {icon}
            </div>
            <div className="mt-3">
                <div className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                    {title}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {value}
                </h3>
            </div>
        </div>
    )
}

const CombinedMonitorChart = ({
    dashboard,
}: {
    dashboard: VehicleDashboardResponse
}) => {
    const [category, setCategory] = useState<CombinedMetricFilter>('charge')

    const labels = useMemo(
        () =>
            dashboard.charts.loadThrottle.map((item) =>
                dayjs(item.timestamp).format('HH:mm'),
            ),
        [dashboard.charts.loadThrottle],
    )

    const series = useMemo(() => {
        const chargeSeries = {
            name: 'Motor load %',
            type: 'column' as const,
            data: dashboard.charts.loadThrottle.map((item) => item.engine_load_pct),
            color: '#7dd3fc',
        }

        const throttleSeries = {
            name: 'Papillon %',
            type: 'column' as const,
            data: dashboard.charts.loadThrottle.map(
                (item) => item.throttle_position_pct,
            ),
            color: '#bee9d3d9',
        }

        const coolantSeries = {
            name: 'Liquide °C',
            type: 'line' as const,
            data: dashboard.charts.temperatures.map((item) => item.coolant_temp_c),
            color: '#7dd3fc',
        }

        const intakeSeries = {
            name: 'Admission °C',
            type: 'line' as const,
            data: dashboard.charts.temperatures.map(
                (item) => item.intake_air_temp_c,
            ),
            color: '#fbbf24',
        }

        const ambientSeries = {
            name: 'Ambiante °C',
            type: 'line' as const,
            data: dashboard.charts.temperatures.map((item) => item.ambient_temp_c),
            color: '#6ee7b7',
        }

        if (category === 'charge') {
            return [chargeSeries, throttleSeries]
        }

        return [coolantSeries, intakeSeries, ambientSeries]
    }, [category, dashboard])

    return (
        <ModernChartSection
            title="Motor load & Temperatures"
            headerExtra={
                <Segment
                    className="gap-1"
                    value={category}
                    size="sm"
                    onChange={(val) => setCategory(val as CombinedMetricFilter)}
                >
                    <Segment.Item value="charge">Load</Segment.Item>
                    <Segment.Item value="temperatures">Temperatures</Segment.Item>
                </Segment>
            }
            height={380}
        >
            <ApexChart
                type="line"
                height={380}
                series={series}
                options={{
                    chart: {
                        type: 'line',
                        stacked: false,
                        zoom: {
                            enabled: false,
                        },
                        toolbar: {
                            show: false,
                        },
                    },
                    stroke: {
                        width: category === 'charge' ? [0, 0] : [2.5, 2.5, 2.5],
                        curve: 'smooth',
                    },
                    dataLabels: {
                        enabled: false,
                    },
                    legend: {
                        show: true,
                        position: 'top',
                    },
                    labels,
                    xaxis: {
                        labels: {
                            rotate: -15,
                        },
                    },
                    yaxis:
                        category === 'charge'
                            ? [
                                  {
                                      title: {
                                          text: 'Pourcentage %',
                                      },
                                  },
                              ]
                            : [
                                  {
                                      title: {
                                          text: 'Temperatures °C',
                                      },
                                  },
                              ],
                    plotOptions: {
                        bar: {
                            columnWidth: '34px',
                            borderRadius: 6,
                            borderRadiusApplication: 'end',
                        },
                    },
                    tooltip: {
                        shared: true,
                        intersect: false,
                    },
                }}
            />
        </ModernChartSection>
    )
}

type ModernChartSectionProps = {
    title: string
    subtitle?: string
    height: number
    children: ReactNode
    headerExtra?: ReactNode
}

const ModernChartSection = ({
    title,
    subtitle,
    height,
    children,
    headerExtra,
}: ModernChartSectionProps) => {
    return (
        <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-700/80 dark:bg-gray-900">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h4>
                    {subtitle && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {subtitle}
                        </p>
                    )}
                </div>
                {headerExtra ? <div>{headerExtra}</div> : null}
            </div>
            <div style={{ width: '100%', height: `${height}px` }}>{children}</div>
        </div>
    )
}

export default Dashboard