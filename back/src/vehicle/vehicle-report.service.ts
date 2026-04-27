import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'

import { VehicleService } from './vehicle.service'
import { SensorReadingService } from '../sensor-reading/sensor-reading.service'
import { MaintenanceService } from '../maintenance/maintenance.service'
import { DtcService } from '../dtc/dtc.service'

@Injectable()
export class VehicleReportService {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly sensorReadingService: SensorReadingService,
    private readonly maintenanceService: MaintenanceService,
    private readonly dtcService: DtcService,
  ) {}

  async generateVehicleReportPdf(vehicleId: string, userId: string) {
    const vehicle = await this.vehicleService.findOne(vehicleId, userId)

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found')
    }

    const [dashboard, maintenance, dtc] = await Promise.all([
      this.sensorReadingService
        .getVehicleDashboard(vehicleId, userId)
        .catch(() => null),
      this.maintenanceService
        .getAnalytics(vehicleId, userId)
        .catch(() => null),
      this.dtcService
        .getDtcAnalytics(vehicleId, userId)
        .catch(() => null),
    ])

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    })

    const stream = new PassThrough()
    doc.pipe(stream)

    const fileName = `${(vehicle.make || 'vehicle')
      .replace(/\s+/g, '-')
      .toLowerCase()}-${(vehicle.model || 'report')
      .replace(/\s+/g, '-')
      .toLowerCase()}-report.pdf`

    this.drawHeader(doc, vehicle)
    this.drawVehicleInfo(doc, vehicle)
    this.drawSummaryCards(doc, dashboard, maintenance, dtc)

    this.ensureSpace(doc, 260)
    this.drawSectionTitle(doc, 'Sensor Charts')
    this.drawSensorCharts(doc, dashboard)

    this.ensureSpace(doc, 220)
    this.drawSectionTitle(doc, 'Maintenance Overview')
    this.drawMaintenanceSection(doc, maintenance)

    this.ensureSpace(doc, 250)
    this.drawSectionTitle(doc, 'DTC Overview')
    this.drawDtcSection(doc, dtc)

    this.drawFooter(doc)

    doc.end()

    return { stream, fileName }
  }

  private drawHeader(doc: PDFKit.PDFDocument, vehicle: any) {
    doc
      .roundedRect(40, 30, 515, 70, 16)
      .fill('#0f172a')

    doc
      .fillColor('#ffffff')
      .fontSize(24)
      .text('Smart Car Monitoring Report', 60, 48)

    doc
      .fontSize(10)
      .fillColor('#cbd5e1')
      .text(`Generated on ${new Date().toLocaleString()}`, 60, 76)

    doc.moveDown()
    doc.y = 120
  }

  private drawVehicleInfo(doc: PDFKit.PDFDocument, vehicle: any) {
    const x = 40
    const y = doc.y

    doc
      .roundedRect(x, y, 515, 70, 14)
      .fill('#f8fafc')

    doc.fillColor('#0f172a').fontSize(16).text(
      `${vehicle.make || '-'} ${vehicle.model || '-'}`,
      x + 16,
      y + 12,
    )

    doc
      .fontSize(11)
      .fillColor('#475569')
      .text(`Year: ${vehicle.year || '-'}`, x + 16, y + 38)
      .text(`Plate: ${vehicle.plateNumber || '-'}`, x + 140, y + 38)
      .text(`Vehicle ID: ${vehicle.id || '-'}`, x + 280, y + 38)

    doc.y = y + 90
  }

  private drawSummaryCards(
    doc: PDFKit.PDFDocument,
    dashboard: any,
    maintenance: any,
    dtc: any,
  ) {
    const startX = 40
    const y = doc.y
    const cardWidth = 120
    const cardHeight = 72
    const gap = 11

    const cards = [
      {
        title: 'Max RPM',
        value: `${Math.round(dashboard?.summary?.rpmMax ?? 0)}`,
        color: '#dbeafe',
        text: '#1d4ed8',
      },
      {
        title: 'Max Speed',
        value: `${Math.round(dashboard?.summary?.speedMax ?? 0)} km/h`,
        color: '#dcfce7',
        text: '#15803d',
      },
      {
        title: 'Maintenance',
        value: `${maintenance?.totalRecords ?? 0}`,
        color: '#fef3c7',
        text: '#b45309',
      },
      {
        title: 'DTC Count',
        value: `${dtc?.summary?.totalEntries ?? 0}`,
        color: '#fee2e2',
        text: '#b91c1c',
      },
    ]

    cards.forEach((card, index) => {
      const x = startX + index * (cardWidth + gap)

      doc.roundedRect(x, y, cardWidth, cardHeight, 14).fill(card.color)

      doc
        .fillColor('#475569')
        .fontSize(10)
        .text(card.title, x + 12, y + 12)

      doc
        .fillColor(card.text)
        .fontSize(18)
        .text(card.value, x + 12, y + 34, {
          width: cardWidth - 24,
        })
    })

    doc.y = y + cardHeight + 24
  }

  private drawSectionTitle(doc: PDFKit.PDFDocument, title: string) {
    doc
      .fillColor('#0f172a')
      .fontSize(16)
      .text(title, 40, doc.y)

    doc
      .moveTo(40, doc.y + 6)
      .lineTo(555, doc.y + 6)
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .stroke()

    doc.moveDown(1.2)
  }

  private drawSensorCharts(doc: PDFKit.PDFDocument, dashboard: any) {
    if (!dashboard) {
      doc.fillColor('#64748b').fontSize(11).text('No dashboard data available.')
      doc.moveDown()
      return
    }

    const rpmData = (dashboard.charts?.rpmSpeed || [])
      .slice(-20)
      .map((item: any) => Number(item.engine_rpm || 0))

    const speedData = (dashboard.charts?.rpmSpeed || [])
      .slice(-20)
      .map((item: any) => Number(item.vehicle_speed_kmh || 0))

    const tempData = (dashboard.charts?.temperatures || [])
      .slice(-20)
      .map((item: any) => Number(item.coolant_temp_c || 0))

    const y = doc.y

    this.drawMiniLineChart(doc, {
      x: 40,
      y,
      width: 250,
      height: 120,
      title: 'RPM Trend',
      data: rpmData,
      lineColor: '#2563eb',
      fillColor: '#dbeafe',
      suffix: '',
    })

    this.drawMiniLineChart(doc, {
      x: 305,
      y,
      width: 250,
      height: 120,
      title: 'Speed Trend',
      data: speedData,
      lineColor: '#16a34a',
      fillColor: '#dcfce7',
      suffix: ' km/h',
    })

    doc.y = y + 140

    this.drawMiniBarChart(doc, {
      x: 40,
      y: doc.y,
      width: 515,
      height: 130,
      title: 'Coolant Temperature',
      data: tempData,
      barColor: '#f59e0b',
      bgColor: '#fff7ed',
      suffix: ' °C',
    })

    doc.y += 150
  }

  private drawMaintenanceSection(doc: PDFKit.PDFDocument, maintenance: any) {
    if (!maintenance) {
      doc.fillColor('#64748b').fontSize(11).text('No maintenance data available.')
      doc.moveDown()
      return
    }

    const boxY = doc.y

    doc.roundedRect(40, boxY, 250, 110, 14).fill('#f8fafc')
    doc.roundedRect(305, boxY, 250, 110, 14).fill('#f8fafc')

    doc
      .fillColor('#0f172a')
      .fontSize(13)
      .text('Maintenance Summary', 55, boxY + 14)

    doc
      .fillColor('#475569')
      .fontSize(11)
      .text(`Total records: ${maintenance.totalRecords ?? 0}`, 55, boxY + 40)
      .text(`Total cost: ${maintenance.totalCost ?? 0} TND`, 55, boxY + 58)
      .text(`Overdue count: ${maintenance.overdueCount ?? 0}`, 55, boxY + 76)

    doc
      .fillColor('#0f172a')
      .fontSize(13)
      .text('Next Maintenance', 320, boxY + 14)

    doc
      .fillColor('#475569')
      .fontSize(11)
      .text(
        `Service: ${maintenance.nextMaintenance?.service_type || 'N/A'}`,
        320,
        boxY + 40,
      )
      .text(
        `Due date: ${maintenance.nextMaintenance?.next_due_date || 'N/A'}`,
        320,
        boxY + 58,
      )
      .text(
        `Due km: ${maintenance.nextMaintenance?.next_due_km || 'N/A'}`,
        320,
        boxY + 76,
      )

    doc.y = boxY + 130

    const costData = (maintenance.costChart || [])
      .slice(-10)
      .map((item: any) => Number(item.cost || 0))

    this.drawMiniBarChart(doc, {
      x: 40,
      y: doc.y,
      width: 515,
      height: 130,
      title: 'Maintenance Cost by Period',
      data: costData,
      barColor: '#0ea5e9',
      bgColor: '#f0f9ff',
      suffix: ' TND',
    })

    doc.y += 150
  }

  private drawDtcSection(doc: PDFKit.PDFDocument, dtc: any) {
    if (!dtc) {
      doc.fillColor('#64748b').fontSize(11).text('No DTC data available.')
      doc.moveDown()
      return
    }

    const boxY = doc.y

    doc.roundedRect(40, boxY, 515, 80, 14).fill('#f8fafc')

    doc
      .fillColor('#0f172a')
      .fontSize(13)
      .text('DTC Summary', 55, boxY + 14)

    doc
      .fillColor('#475569')
      .fontSize(11)
      .text(`Total entries: ${dtc.summary?.totalEntries ?? 0}`, 55, boxY + 42)
      .text(`MIL active: ${dtc.summary?.milActiveCount ?? 0}`, 180, boxY + 42)
      .text(
        `High severity: ${dtc.summary?.highSeverityCount ?? 0}`,
        300,
        boxY + 42,
      )
      .text(`Pending: ${dtc.summary?.pendingCount ?? 0}`, 450, boxY + 42)

    doc.y = boxY + 100

    const latestEntries = dtc.latestEntries || []

    doc
      .fillColor('#0f172a')
      .fontSize(12)
      .text('Latest DTC Entries', 40, doc.y)

    doc.y += 8

    if (latestEntries.length === 0) {
      doc.fillColor('#64748b').fontSize(11).text('No DTC entries.')
      doc.moveDown()
      return
    }

    latestEntries.slice(0, 5).forEach((entry: any, index: number) => {
      const rowY = doc.y

      doc.roundedRect(40, rowY, 515, 28, 8).fill(index % 2 === 0 ? '#f8fafc' : '#ffffff')

      doc.fillColor('#0f172a').fontSize(10)
      doc.text(entry.dtc_code || '-', 50, rowY + 9, { width: 70 })
      doc.text(entry.severity || '-', 130, rowY + 9, { width: 90 })
      doc.text(entry.status || '-', 230, rowY + 9, { width: 90 })
      doc.text(entry.component_category || '-', 330, rowY + 9, { width: 210 })

      doc.y = rowY + 34
    })
  }

  private drawMiniLineChart(
    doc: PDFKit.PDFDocument,
    options: {
      x: number
      y: number
      width: number
      height: number
      title: string
      data: number[]
      lineColor: string
      fillColor: string
      suffix?: string
    },
  ) {
    const {
      x,
      y,
      width,
      height,
      title,
      data,
      lineColor,
      fillColor,
    } = options

    doc.roundedRect(x, y, width, height, 14).fill(fillColor)

    doc.fillColor('#0f172a').fontSize(12).text(title, x + 12, y + 10)

    const chartX = x + 12
    const chartY = y + 32
    const chartW = width - 24
    const chartH = height - 44

    doc
      .moveTo(chartX, chartY + chartH)
      .lineTo(chartX + chartW, chartY + chartH)
      .strokeColor('#cbd5e1')
      .stroke()

    if (!data.length || data.every((v) => v === 0)) {
      doc.fillColor('#64748b').fontSize(10).text('No data', chartX, chartY + 20)
      return
    }

    const max = Math.max(...data, 1)
    const min = Math.min(...data, 0)
    const range = max - min || 1

    data.forEach((value, index) => {
      const px = chartX + (index / Math.max(data.length - 1, 1)) * chartW
      const py = chartY + chartH - ((value - min) / range) * chartH

      if (index === 0) {
        doc.moveTo(px, py)
      } else {
        doc.lineTo(px, py)
      }
    })

    doc.strokeColor(lineColor).lineWidth(2).stroke()
  }

  private drawMiniBarChart(
    doc: PDFKit.PDFDocument,
    options: {
      x: number
      y: number
      width: number
      height: number
      title: string
      data: number[]
      barColor: string
      bgColor: string
      suffix?: string
    },
  ) {
    const {
      x,
      y,
      width,
      height,
      title,
      data,
      barColor,
      bgColor,
    } = options

    doc.roundedRect(x, y, width, height, 14).fill(bgColor)

    doc.fillColor('#0f172a').fontSize(12).text(title, x + 12, y + 10)

    const chartX = x + 12
    const chartY = y + 32
    const chartW = width - 24
    const chartH = height - 44

    doc
      .moveTo(chartX, chartY + chartH)
      .lineTo(chartX + chartW, chartY + chartH)
      .strokeColor('#cbd5e1')
      .stroke()

    if (!data.length || data.every((v) => v === 0)) {
      doc.fillColor('#64748b').fontSize(10).text('No data', chartX, chartY + 20)
      return
    }

    const max = Math.max(...data, 1)
    const gap = 6
    const barWidth = (chartW - gap * (data.length - 1)) / data.length

    data.forEach((value, index) => {
      const barHeight = (value / max) * chartH
      const bx = chartX + index * (barWidth + gap)
      const by = chartY + chartH - barHeight

      doc.roundedRect(bx, by, barWidth, barHeight, 4).fill(barColor)
    })
  }

  private ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number) {
    if (doc.y + neededHeight > doc.page.height - 50) {
      doc.addPage()
      doc.y = 40
    }
  }

  private drawFooter(doc: PDFKit.PDFDocument) {
    const range = doc.bufferedPageRange()

    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)
      doc
        .fontSize(9)
        .fillColor('#94a3b8')
        .text(
          `Smart Car Monitoring Platform • Page ${i + 1}`,
          40,
          doc.page.height - 30,
          { align: 'center', width: 515 },
        )
    }
  }
}