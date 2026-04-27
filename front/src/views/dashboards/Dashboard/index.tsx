import { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import UpcomingSchedule from '../ProjectDashboard/components/UpcomingSchedule'
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
    TbTool,
    TbAlertTriangle,
    TbCalendarEvent,
    TbCurrencyDollar,
    TbPlaylistX,
    TbFileDownload,
} from 'react-icons/tb'
import {
    apiGetMyVehicles,
    apiGetVehicleDashboard,
    apiGetVehicleMaintenanceAnalytics,
    apiGetVehicleDtcAnalytics,
    apiExportVehicleReport,
} from '@/services/DashboardService'
import { COLORS } from '@/constants/chart.constant'
import { useThemeStore } from '@/store/themeStore'
import {
    ResponsiveContainer,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    AreaChart,
    Area,
    BarChart,
    Bar,
    CartesianGrid,
} from 'recharts'
import type { ReactNode } from 'react'
import type {
    NameType,
    ValueType,
} from 'recharts/types/component/DefaultTooltipContent'

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
type MaintenanceRecordLite = {
    id: string
    service_date?: string
    service_type?: string
    mileage_at_service_km?: number
    cost?: number
    parts_replaced?: string
    shop?: string
    notes?: string
    next_due_km?: number
    next_due_date?: string
    appointmentStart?: string
    appointmentEnd?: string
}  


type MaintenanceAnalyticsResponse = {
    totalCost: number
    totalRecords: number
    costChart: {
        month: string
        cost: number
    }[]
    nextMaintenance?: MaintenanceRecordLite | null
    overdueCount: number
}

type DtcAnalyticsResponse = {
    summary: {
        totalEntries: number
        milActiveCount: number
        highSeverityCount: number
        pendingCount: number
    }
    charts: {
        severityChart: {
            name: string
            value: number
        }[]
        statusChart: {
            name: string
            value: number
        }[]
        topCodes: {
            code: string
            count: number
        }[]
        categoryChart: {
            category: string
            count: number
        }[]
        timeline: {
            date: string
            count: number
        }[]
    }
    latestEntries: {
        id: string
        timestamp: string
        dtc_code: string
        description?: string
        severity: string
        status: string
        mil_active: boolean
        component_category: string
    }[]
}

type VehicleDashboardItem = {
    vehicle: VehicleItem
    dashboard: VehicleDashboardResponse
    maintenance: MaintenanceAnalyticsResponse | null
    dtc: DtcAnalyticsResponse | null
}

type CombinedMetricFilter = 'charge' | 'temperatures'
type VehicleViewMode = 'sensor' | 'maintenance' | 'dtc'

const downsample = <T,>(arr: T[], maxPoints = 60): T[] => {
    if (arr.length <= maxPoints) return arr
    const step = Math.ceil(arr.length / maxPoints)
    return arr.filter((_, i) => i % step === 0)
}

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
    const [exportingId, setExportingId] = useState<string | null>(null)
    const [viewMode, setViewMode] = useState<Record<string, VehicleViewMode>>(
        {},
    )

    const getVehicleViewMode = (vehicleId: string): VehicleViewMode =>
        viewMode[vehicleId] || 'sensor'

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
                        const [dashboard, maintenance, dtc] = await Promise.all([
                            apiGetVehicleDashboard<VehicleDashboardResponse>(
                                vehicle.id,
                            ),
                            apiGetVehicleMaintenanceAnalytics<MaintenanceAnalyticsResponse>(
                                vehicle.id,
                            ).catch(() => null),
                            apiGetVehicleDtcAnalytics<DtcAnalyticsResponse>(
                                vehicle.id,
                            ).catch(() => null),
                        ])

                        return {
                            vehicle,
                            dashboard,
                            maintenance,
                            dtc,
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

    const handleExportReport = async (vehicle: VehicleItem) => {
        try {
            setExportingId(vehicle.id)

            const response = await apiExportVehicleReport(vehicle.id)

            const blob = new Blob([response], {
                type: 'application/pdf',
            })

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')

            const safeName = `${vehicle.make || 'vehicle'}-${vehicle.model || ''}-${vehicle.plateNumber || vehicle.id}`
                .replace(/\s+/g, '-')
                .replace(/[^a-zA-Z0-9-_]/g, '')
                .toLowerCase()

            link.href = url
            link.download = `${safeName}-report.pdf`

            document.body.appendChild(link)
            link.click()
            link.remove()

            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Export failed:', error)
        } finally {
            setExportingId(null)
        }
    }

    const isLoading = vehiclesLoading || loadingDashboards
    const formatTime = (value: string) => dayjs(value).format('HH:mm')

    return (
        <Loading loading={isLoading}>
            <div className="flex flex-col gap-6">
                {dashboards.map(({ vehicle, dashboard, maintenance, dtc }) => {
                    const title =
                        [vehicle.make, vehicle.model].filter(Boolean).join(' ') ||
                        `Véhicule ${vehicle.id}`

                    const sampledRpmSpeed = downsample(dashboard.charts.rpmSpeed)
                    const sampledTrimsMaf = downsample(dashboard.charts.trimsMaf)
                    const currentView = getVehicleViewMode(vehicle.id)

                    return (
                        <Card
                            key={vehicle.id}
                            className="overflow-hidden rounded-3xl border border-gray-200/70 bg-white shadow-sm dark:border-gray-700/70 dark:bg-gray-900"
                        >
                            <div className="bg-white px-6 py-5 dark:bg-gray-900">
                                <div className="flex flex-col gap-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                                    {title}
                                                </h3>

                                                <Segment
                                                    value={currentView}
                                                    size="sm"
                                                    onChange={(val) =>
                                                        setViewMode((prev) => ({
                                                            ...prev,
                                                            [vehicle.id]:
                                                                val as VehicleViewMode,
                                                        }))
                                                    }
                                                >
                                                    <Segment.Item value="sensor">
                                                        Sensor
                                                    </Segment.Item>
                                                    <Segment.Item value="maintenance">
                                                        Maintenance
                                                    </Segment.Item>
                                                    <Segment.Item value="dtc">
                                                        DTC
                                                    </Segment.Item>
                                                </Segment>
                                            </div>

                                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                {vehicle.year
                                                    ? `${vehicle.year} • `
                                                    : ''}
                                                {vehicle.plateNumber
                                                    ? `Plaque: ${vehicle.plateNumber}`
                                                    : 'Aucune plaque'}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleExportReport(vehicle)}
                                            disabled={exportingId === vehicle.id}
                                            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <TbFileDownload className="text-lg" />
                                            {exportingId === vehicle.id
                                                ? 'Export...'
                                                : 'Export PDF'}
                                        </button>
                                    </div>

                                    {currentView === 'sensor' ? (
                                        <VehicleQuickStats dashboard={dashboard} />
                                    ) : currentView === 'maintenance' ? (
                                        <MaintenanceQuickStats
                                            maintenance={maintenance}
                                        />
                                    ) : (
                                        <DtcQuickStats dtc={dtc} />
                                    )}
                                </div>
                            </div>

                            <div className="p-6">
                                {currentView === 'sensor' ? (
                                    <div className="grid grid-cols-12 gap-4">
                                        <div className="col-span-12">
                                            <ModernChartSection
                                                title="Fuel trims & MAF"
                                                height={340}
                                            >
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >
                                                    <AreaChart
                                                        data={sampledTrimsMaf}
                                                    >
                                                        <defs>
                                                            <linearGradient
                                                                id={`mafGradient-${vehicle.id}`}
                                                                x1="0"
                                                                y1="0"
                                                                x2="0"
                                                                y2="1"
                                                            >
                                                                <stop
                                                                    offset="5%"
                                                                    stopColor="#10b981"
                                                                    stopOpacity={0.2}
                                                                />
                                                                <stop
                                                                    offset="95%"
                                                                    stopColor="#10b981"
                                                                    stopOpacity={0.02}
                                                                />
                                                            </linearGradient>
                                                        </defs>

                                                        <XAxis
                                                            dataKey="timestamp"
                                                            tickFormatter={formatTime}
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: '#64748b',
                                                            }}
                                                            interval="preserveStartEnd"
                                                            tickCount={8}
                                                            minTickGap={24}
                                                        />

                                                        <YAxis
                                                            yAxisId="left"
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: '#64748b',
                                                            }}
                                                            tickFormatter={(v) =>
                                                                `${Math.round(
                                                                    Number(v),
                                                                )}%`
                                                            }
                                                            width={50}
                                                            domain={[-10, 10]}
                                                        />

                                                        <YAxis
                                                            yAxisId="right"
                                                            orientation="right"
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: '#64748b',
                                                            }}
                                                            tickFormatter={(v) =>
                                                                `${Number(v).toFixed(1)}`
                                                            }
                                                            width={50}
                                                        />

                                                        <Tooltip
                                                            formatter={(
                                                                value: any,
                                                                name: any,
                                                            ) => {
                                                                const n =
                                                                    Number(value)

                                                                if (
                                                                    name ===
                                                                    'MAF g/s'
                                                                ) {
                                                                    return [
                                                                        `${n.toFixed(
                                                                            2,
                                                                        )} g/s`,
                                                                        name,
                                                                    ]
                                                                }

                                                                return [
                                                                    `${n.toFixed(
                                                                        2,
                                                                    )} %`,
                                                                    name,
                                                                ]
                                                            }}
                                                        />

                                                        <Legend
                                                            iconType="circle"
                                                            iconSize={8}
                                                        />

                                                        <Line
                                                            yAxisId="right"
                                                            type="monotone"
                                                            dataKey="maf_airflow_gs"
                                                            stroke="#10b981"
                                                            strokeWidth={2.5}
                                                            name="MAF g/s"
                                                            dot={false}
                                                        />

                                                        <Line
                                                            yAxisId="left"
                                                            type="monotone"
                                                            dataKey="short_fuel_trim_pct"
                                                            stroke="#3b82f6"
                                                            strokeWidth={1.2}
                                                            strokeOpacity={0.4}
                                                            name="Short trim %"
                                                            dot={false}
                                                        />

                                                        <Line
                                                            yAxisId="left"
                                                            type="monotone"
                                                            dataKey="long_fuel_trim_pct"
                                                            stroke="#f59e0b"
                                                            strokeWidth={1.2}
                                                            strokeOpacity={0.4}
                                                            name="Long trim %"
                                                            dot={false}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </ModernChartSection>
                                        </div>

                                        <div className="col-span-12 lg:col-span-6">
                                            <ModernChartSection
                                                title="RPM and speed"
                                                height={320}
                                            >
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >
                                                    <AreaChart
                                                        data={sampledRpmSpeed}
                                                    >
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
                                                                    stopColor={
                                                                        COLORS[0]
                                                                    }
                                                                    stopOpacity={
                                                                        0.3
                                                                    }
                                                                />
                                                                <stop
                                                                    offset="95%"
                                                                    stopColor={
                                                                        COLORS[0]
                                                                    }
                                                                    stopOpacity={
                                                                        0.02
                                                                    }
                                                                />
                                                            </linearGradient>
                                                        </defs>

                                                        <XAxis
                                                            dataKey="timestamp"
                                                            tickFormatter={
                                                                formatTime
                                                            }
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: '#64748b',
                                                            }}
                                                            interval="preserveStartEnd"
                                                            tickCount={8}
                                                            minTickGap={24}
                                                            axisLine={{
                                                                stroke: '#cbd5e1',
                                                                strokeWidth: 1,
                                                            }}
                                                            tickLine={{
                                                                stroke: '#cbd5e1',
                                                            }}
                                                        />

                                                        <YAxis
                                                            yAxisId="left"
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: '#64748b',
                                                            }}
                                                            tickFormatter={(v) =>
                                                                Math.round(
                                                                    Number(v),
                                                                ).toLocaleString()
                                                            }
                                                            width={60}
                                                            axisLine={{
                                                                stroke: '#cbd5e1',
                                                                strokeWidth: 1,
                                                            }}
                                                            tickLine={{
                                                                stroke: '#cbd5e1',
                                                            }}
                                                        />

                                                        <YAxis
                                                            yAxisId="right"
                                                            orientation="right"
                                                            tick={{
                                                                fontSize: 12,
                                                                fill: '#64748b',
                                                            }}
                                                            tickFormatter={(v) =>
                                                                Math.round(
                                                                    Number(v),
                                                                ).toString()
                                                            }
                                                            width={55}
                                                            axisLine={{
                                                                stroke: '#cbd5e1',
                                                                strokeWidth: 1,
                                                            }}
                                                            tickLine={{
                                                                stroke: '#cbd5e1',
                                                            }}
                                                        />

                                                        <Tooltip
                                                            labelFormatter={(
                                                                value,
                                                            ) =>
                                                                dayjs(
                                                                    String(value),
                                                                ).format(
                                                                    'YYYY-MM-DD HH:mm:ss',
                                                                )
                                                            }
                                                            formatter={(
                                                                value:
                                                                    | ValueType
                                                                    | undefined,
                                                                name:
                                                                    | NameType
                                                                    | undefined,
                                                            ) => {
                                                                if (
                                                                    value ===
                                                                    undefined
                                                                ) {
                                                                    return [
                                                                        '',
                                                                        String(
                                                                            name,
                                                                        ),
                                                                    ]
                                                                }

                                                                const n =
                                                                    Number(value)
                                                                const label =
                                                                    String(name)

                                                                if (
                                                                    label ===
                                                                    'Vitesse km/h'
                                                                ) {
                                                                    return [
                                                                        `${Math.round(
                                                                            n,
                                                                        )} km/h`,
                                                                        label,
                                                                    ]
                                                                }

                                                                return [
                                                                    `${Math.round(
                                                                        n,
                                                                    ).toLocaleString()} tr/min`,
                                                                    label,
                                                                ]
                                                            }}
                                                            contentStyle={{
                                                                borderRadius: 12,
                                                                border: '1px solid rgba(148,163,184,0.2)',
                                                                backgroundColor:
                                                                    'rgba(255,255,255,0.95)',
                                                                boxShadow:
                                                                    '0 4px 12px rgba(0,0,0,0.1)',
                                                            }}
                                                        />

                                                        <Legend
                                                            wrapperStyle={{
                                                                paddingTop: 8,
                                                            }}
                                                            iconType="circle"
                                                            iconSize={10}
                                                        />

                                                        <Area
                                                            yAxisId="left"
                                                            type="monotone"
                                                            dataKey="engine_rpm"
                                                            stroke={COLORS[0]}
                                                            fill={`url(#rpmGradient-${vehicle.id})`}
                                                            strokeWidth={2.5}
                                                            name="RPM"
                                                            dot={false}
                                                            activeDot={{
                                                                r: 5,
                                                                strokeWidth: 2,
                                                            }}
                                                        />

                                                        <Line
                                                            yAxisId="right"
                                                            type="monotone"
                                                            dataKey="vehicle_speed_kmh"
                                                            stroke={COLORS[7]}
                                                            strokeWidth={2.5}
                                                            dot={false}
                                                            activeDot={{
                                                                r: 5,
                                                                strokeWidth: 2,
                                                            }}
                                                            name="Vitesse km/h"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </ModernChartSection>
                                        </div>

                                        <div className="col-span-12 lg:col-span-6">
                                            <CombinedMonitorChart
                                                dashboard={dashboard}
                                            />
                                        </div>
                                    </div>
                                ) : currentView === 'maintenance' ? (
                                   <MaintenanceAnalyticsSection
    vehicleId={vehicle.id}
    maintenance={maintenance}
/>
                                ) : (
                                    <DtcAnalyticsSection dtc={dtc} />
                                )}
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-0">
                <SummarySegment
                    title="Max RPM"
                    value={`${Math.round(dashboard.summary.rpmMax).toLocaleString()} tr/min`}
                    icon={<TbGauge />}
                    iconClass="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                    className="border-b border-r-0 border-gray-200 dark:border-gray-700 md:border-b xl:border-b-0 xl:ltr:border-r xl:rtl:border-l"
                />
                <SummarySegment
                    title="Max Speed"
                    value={`${dashboard.summary.speedMax.toFixed(1)} km/h`}
                    icon={<TbRoute />}
                    iconClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    className="border-b border-gray-200 dark:border-gray-700 md:border-b xl:border-b-0 xl:ltr:border-r xl:rtl:border-l"
                />
                <SummarySegment
                    title="Load"
                    value={`${dashboard.summary.totalReadings} lectures`}
                    icon={<TbEngine />}
                    iconClass="bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                    className="border-b border-r-0 border-gray-200 dark:border-gray-700 md:border-b-0 md:ltr:border-r md:rtl:border-l"
                />
                <SummarySegment
                    title="Temperature"
                    value={`${dashboard.summary.coolantAvg.toFixed(1)} °C`}
                    icon={<TbTemperature />}
                    iconClass="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                />
            </div>
        </div>
    )
}

const MaintenanceQuickStats = ({
    maintenance,
}: {
    maintenance: MaintenanceAnalyticsResponse | null
}) => {
    if (!maintenance) {
        return (
            <div className="rounded-3xl border border-gray-200 bg-white/70 p-6 dark:border-gray-700 dark:bg-gray-900/40">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aucune donnée de maintenance disponible.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-3xl border border-gray-200 bg-white/70 dark:border-gray-700 dark:bg-gray-900/40">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-0">
                <SummarySegment
                    title="Total cost"
                    value={`${maintenance.totalCost.toFixed(2)} TND`}
                    icon={<TbCurrencyDollar />}
                    iconClass="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                    className="border-b border-r-0 border-gray-200 dark:border-gray-700 md:border-b xl:border-b-0 xl:ltr:border-r xl:rtl:border-l"
                />
                <SummarySegment
                    title="Maintenances"
                    value={maintenance.totalRecords}
                    icon={<TbTool />}
                    iconClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    className="border-b border-gray-200 dark:border-gray-700 md:border-b xl:border-b-0 xl:ltr:border-r xl:rtl:border-l"
                />
            
               <SummarySegment
    title="Next due date"
    value={
        maintenance.nextMaintenance?.next_due_date
            ? dayjs(maintenance.nextMaintenance.next_due_date).format(
                  'YYYY-MM-DD',
              )
            : 'N/A'
    }
    icon={<TbCalendarEvent />}
    iconClass="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
/>

<SummarySegment
    title="Appointment"
    value={
        maintenance.nextMaintenance?.appointmentStart
            ? dayjs(maintenance.nextMaintenance.appointmentStart).format(
                  'YYYY-MM-DD HH:mm',
              )
            : 'Non planifié'
    }
    icon={<TbCalendarEvent />}
    iconClass="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
/>
            </div>
        </div>
    )
}

const DtcQuickStats = ({
    dtc,
}: {
    dtc: DtcAnalyticsResponse | null
}) => {
    if (!dtc) {
        return (
            <div className="rounded-3xl border border-gray-200 bg-white/70 p-6 dark:border-gray-700 dark:bg-gray-900/40">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aucune donnée DTC disponible.
                </p>
            </div>
        )
    }

    const alertLevel =
        dtc.summary.highSeverityCount > 0
            ? 'Critical alerts detected'
            : dtc.summary.milActiveCount > 0
              ? 'Warnings active'
              : 'System stable'

    return (
        <div className="rounded-3xl border border-gray-200 bg-white/70 dark:border-gray-700 dark:bg-gray-900/40">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div></div>

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {alertLevel}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-0">
                <SummarySegment
                    title="Total DTC"
                    value={dtc.summary.totalEntries}
                    icon={<TbPlaylistX />}
                    iconClass="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                    className="border-b border-r-0 border-gray-200 dark:border-gray-700 md:border-b xl:border-b-0 xl:ltr:border-r xl:rtl:border-l"
                />
                <SummarySegment
                    title="MIL active"
                    value={dtc.summary.milActiveCount}
                    icon={<TbEngine />}
                    iconClass="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                    className="border-b border-gray-200 dark:border-gray-700 md:border-b xl:border-b-0 xl:ltr:border-r xl:rtl:border-l"
                />
                <SummarySegment
                    title="High severity"
                    value={dtc.summary.highSeverityCount}
                    icon={<TbAlertTriangle />}
                    iconClass="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                    className="border-b border-r-0 border-gray-200 dark:border-gray-700 md:border-b-0 md:ltr:border-r md:rtl:border-l"
                />
                <SummarySegment
                    title="Pending"
                    value={dtc.summary.pendingCount}
                    icon={<TbTool />}
                    iconClass="bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
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
                    'flex min-h-12 min-w-12 max-h-12 max-w-12 items-center justify-center rounded-full text-2xl',
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

    const sampledLoadThrottle = useMemo(
        () => downsample(dashboard.charts.loadThrottle),
        [dashboard.charts.loadThrottle],
    )

    const sampledTemperatures = useMemo(
        () => downsample(dashboard.charts.temperatures),
        [dashboard.charts.temperatures],
    )

    const labels = useMemo(
        () =>
            (category === 'charge'
                ? sampledLoadThrottle
                : sampledTemperatures
            ).map((item) => dayjs(item.timestamp).format('HH:mm')),
        [category, sampledLoadThrottle, sampledTemperatures],
    )

    const series = useMemo(() => {
        const chargeSeries = {
            name: 'Motor load %',
            type: 'line' as const,
            data: sampledLoadThrottle.map((item) =>
                parseFloat(item.engine_load_pct.toFixed(1)),
            ),
            color: '#3b82f6',
        }

        const throttleSeries = {
            name: 'Papillon %',
            type: 'line' as const,
            data: sampledLoadThrottle.map((item) =>
                parseFloat(item.throttle_position_pct.toFixed(1)),
            ),
            color: '#6ee7b7',
        }

        const coolantSeries = {
            name: 'Liquide °C',
            type: 'line' as const,
            data: sampledTemperatures.map((item) =>
                parseFloat(item.coolant_temp_c.toFixed(1)),
            ),
            color: '#7dd3fc',
        }

        const intakeSeries = {
            name: 'Admission °C',
            type: 'line' as const,
            data: sampledTemperatures.map((item) =>
                parseFloat(item.intake_air_temp_c.toFixed(1)),
            ),
            color: '#fbbf24',
        }

        const ambientSeries = {
            name: 'Ambiante °C',
            type: 'line' as const,
            data: sampledTemperatures.map((item) =>
                parseFloat(item.ambient_temp_c.toFixed(1)),
            ),
            color: '#6ee7b7',
        }

        return category === 'charge'
            ? [chargeSeries, throttleSeries]
            : [coolantSeries, intakeSeries, ambientSeries]
    }, [category, sampledLoadThrottle, sampledTemperatures])

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
                    <Segment.Item value="temperatures">
                        Temperatures
                    </Segment.Item>
                </Segment>
            }
            height={320}
        >
            <ApexChart
                type="line"
                height={320}
                series={series}
                options={{
                    chart: {
                        type: 'line',
                        stacked: false,
                        zoom: { enabled: false },
                        toolbar: { show: false },
                        animations: { enabled: false },
                        background: 'transparent',
                    },
                    stroke: {
                        width: category === 'charge' ? [3, 3] : [2.5, 2.5, 2.5],
                        curve: 'smooth',
                        lineCap: 'round',
                    },
                    dataLabels: { enabled: false },
                    legend: {
                        show: true,
                        position: 'top',
                        horizontalAlign: 'center',
                    },
                    labels,
                    grid: {
                        show: false,
                    },
                    xaxis: {
                        labels: {
                            rotate: -15,
                            style: {
                                fontSize: '11px',
                                colors: ['#64748b'],
                            },
                        },
                        tickAmount: 10,
                        axisBorder: {
                            show: true,
                            color: '#cbd5e1',
                            height: 1,
                        },
                        axisTicks: {
                            show: true,
                            color: '#cbd5e1',
                        },
                    },
                    yaxis:
                        category === 'charge'
                            ? [
                                  {
                                      title: {
                                          text: 'Pourcentage %',
                                      },
                                      min:
                                          Math.min(
                                              ...series.flatMap((s) => s.data),
                                          ) - 5,
                                      max:
                                          Math.max(
                                              ...series.flatMap((s) => s.data),
                                          ) + 5,
                                      tickAmount: 5,
                                      labels: {
                                          formatter: (val: number) =>
                                              `${Math.round(val)}%`,
                                          style: {
                                              fontSize: '11px',
                                              colors: ['#64748b'],
                                          },
                                      },
                                  },
                              ]
                            : [
                                  {
                                      title: {
                                          text: 'Températures °C',
                                      },
                                      labels: {
                                          formatter: (val: number) =>
                                              `${Math.round(val)}`,
                                          style: {
                                              fontSize: '11px',
                                              colors: ['#64748b'],
                                          },
                                      },
                                  },
                              ],
                    markers: {
                        size: 0,
                        hover: {
                            size: category === 'charge' ? 6 : 5,
                            sizeOffset: 2,
                        },
                        strokeWidth: 2,
                    },
                    tooltip: {
                        shared: true,
                        intersect: false,
                        style: {
                            fontSize: '12px',
                        },
                        y: {
                            formatter: (val: number) =>
                                category === 'charge'
                                    ? `${Number(val).toFixed(1)}%`
                                    : `${Number(val).toFixed(1)} °C`,
                        },
                    },
                    theme: {
                        mode: 'light',
                    },
                }}
            />
        </ModernChartSection>
    )
}

const MaintenanceAnalyticsSection = ({
    vehicleId,
    maintenance,
}: {
    vehicleId: string
    maintenance: MaintenanceAnalyticsResponse | null
}) => {
    if (!maintenance) {
        return (
            <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-700/80 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aucune analytics de maintenance disponible.
                </p>
            </div>
        )
    }

    const plannedDate = maintenance.nextMaintenance?.next_due_date
        ? dayjs(maintenance.nextMaintenance.next_due_date)
              .subtract(3, 'day')
              .toDate()
        : dayjs().toDate()

    const suggestedLabel = maintenance.nextMaintenance?.service_type
        ? `Maintenance - ${maintenance.nextMaintenance.service_type}`
        : 'Maintenance reminder'

    const maintenanceId = maintenance.nextMaintenance?.id

    return (
        <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-8">
                <ModernChartSection
                    title="Maintenance cost per month"
                    height={320}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={maintenance.costChart}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip
                                formatter={(value: any) => [
                                    `${Number(value).toFixed(2)} TND`,
                                    'Cost',
                                ]}
                            />
                            <Legend />
                            <Bar
                                dataKey="cost"
                                name="Cost"
                                fill="#bee9d3"
                                radius={[8, 8, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ModernChartSection>
            </div>

            <div className="col-span-12 lg:col-span-4">
                {maintenanceId ? (
                    <UpcomingSchedule
                        vehicleId={vehicleId}
                        maintenanceId={maintenanceId}
                        defaultDate={plannedDate}
                        title="Maintenance "
                        suggestedLabel={suggestedLabel}
                        onCreated={() => window.location.reload()}
                    />
                ) : (
                    <Card>
                        <p className="text-sm text-gray-500">
                            Aucune maintenance à planifier.
                        </p>
                    </Card>
                )}
            </div>
        </div>
    )
}

const DtcAnalyticsSection = ({
    dtc,
}: {
    dtc: DtcAnalyticsResponse | null
}) => {
    if (!dtc) {
        return (
            <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-700/80 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aucune analytics DTC disponible.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-8">
                <ModernChartSection
                    title="DTC timeline"
                    subtitle=""
                    height={320}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dtc.charts.timeline}>
                            <defs>
                                <linearGradient
                                    id="dtcTimeline"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#6366f1"
                                        stopOpacity={0.28}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#6366f1"
                                        stopOpacity={0.03}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#6366f1"
                                fill="url(#dtcTimeline)"
                                strokeWidth={2.5}
                                name="DTC count"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ModernChartSection>
            </div>

            <div className="col-span-12 lg:col-span-4">
                <ModernChartSection
                    title="Severity"
                    subtitle=" "
                    height={320}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dtc.charts.severityChart}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar
                                dataKey="value"
                                fill="#FE964A"
                                name="Count"
                                radius={[10, 10, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ModernChartSection>
            </div>

            <div className="col-span-12 lg:col-span-6">
                <ModernChartSection
                    title="Top DTC codes"
                    subtitle=""
                    height={320}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dtc.charts.topCodes}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="code" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar
                                dataKey="count"
                                fill="#7cd2fa"
                                name="Occurrences"
                                radius={[10, 10, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ModernChartSection>
            </div>

            <div className="col-span-12 lg:col-span-6">
                <ModernChartSection
                    title="Status"
                    subtitle=""
                    height={320}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dtc.charts.statusChart}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar
                                dataKey="value"
                                fill="#fbc13e"
                                name="Count"
                                radius={[10, 10, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ModernChartSection>
            </div>
        </div>
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
        <div className="rounded-[28px] border border-gray-200/70 bg-white p-5 shadow-sm shadow-gray-200/40 dark:border-gray-700/70 dark:bg-gray-900 dark:shadow-none">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h4 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                        {title}
                    </h4>
                    {subtitle && (
                        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                            {subtitle}
                        </p>
                    )}
                </div>
                {headerExtra ? <div>{headerExtra}</div> : null}
            </div>
            <div
                className="rounded-2xl bg-gradient-to-b from-gray-50 to-white p-2 dark:from-gray-900 dark:to-gray-950"
                style={{ width: '100%', height: `${height}px` }}
            >
                {children}
            </div>
        </div>
    )
}

export default Dashboard