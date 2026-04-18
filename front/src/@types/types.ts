export type VehicleItem = {
    id: string
    name?: string
    plateNumber?: string
}

export type Summary = {
    totalReadings: number
    rpmMax: number
    speedMax: number
    coolantAvg: number
    fuelAvg: number
}

export type RpmSpeedPoint = {
    timestamp: string
    engine_rpm: number
    vehicle_speed_kmh: number
}

export type LoadThrottlePoint = {
    timestamp: string
    engine_load_pct: number
    throttle_position_pct: number
}

export type TemperaturePoint = {
    timestamp: string
    coolant_temp_c: number
    intake_air_temp_c: number
    ambient_temp_c: number
}

export type TrimsMafPoint = {
    timestamp: string
    short_fuel_trim_pct: number
    long_fuel_trim_pct: number
    maf_airflow_gs: number
}

export type VehicleDashboardResponse = {
    vehicle: {
        id: string
        name?: string | null
        plateNumber?: string | null
    }
    summary: Summary
    charts: {
        rpmSpeed: RpmSpeedPoint[]
        loadThrottle: LoadThrottlePoint[]
        temperatures: TemperaturePoint[]
        trimsMaf: TrimsMafPoint[]
    }
}