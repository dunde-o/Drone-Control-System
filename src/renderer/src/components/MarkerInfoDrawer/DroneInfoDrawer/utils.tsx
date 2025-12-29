import { BatteryFull, BatteryLow, BatteryMedium, BatteryWarning } from 'lucide-react'

import { DroneStatus } from '@renderer/contexts/WebSocketContext/types'

import {
  BATTERY_LEVEL,
  STATUS_CONFIG,
  GROUND_STATUSES,
  AIR_STATUSES,
  TRANSITIONING_STATUSES
} from '../constants'

export const getBatteryIcon = (battery: number): React.JSX.Element => {
  if (battery < BATTERY_LEVEL.CRITICAL) return <BatteryWarning size={14} />
  if (battery < BATTERY_LEVEL.LOW) return <BatteryLow size={14} />
  if (battery < BATTERY_LEVEL.MEDIUM) return <BatteryMedium size={14} />
  return <BatteryFull size={14} />
}

export const getBatteryColorClass = (battery: number): string => {
  if (battery < BATTERY_LEVEL.LOW) return 'batteryDanger'
  if (battery < BATTERY_LEVEL.MEDIUM) return 'batteryWarning'
  return 'batteryGood'
}

export const isGroundStatus = (status: DroneStatus): boolean => GROUND_STATUSES.includes(status)

export const isAirStatus = (status: DroneStatus): boolean => AIR_STATUSES.includes(status)

export const isTransitioning = (status: DroneStatus): boolean =>
  TRANSITIONING_STATUSES.includes(status)

export const getStatusConfig = (status: DroneStatus): { label: string; className: string } => {
  return STATUS_CONFIG[status] || { label: status, className: 'statusIdle' }
}
