import { ChangeEvent } from 'react'

import { DroneStatus } from '@renderer/contexts/WebSocketContext/types'

export type MarkerType = 'base' | 'drone' | 'waypoint'

export interface Position {
  lat: number
  lng: number
}

export interface BaseMarkerInfo {
  type: 'base'
  id: string
  name: string
  position: Position
  details?: Record<string, string | number>
}

export interface DroneMarkerInfo {
  type: 'drone'
  id: string
  name: string
  position: Position
  status: DroneStatus
  battery: number
  altitude: number
}

export interface WaypointMarkerInfo {
  type: 'waypoint'
  id: string
  name: string
  position: Position
}

export type MarkerInfo = BaseMarkerInfo | DroneMarkerInfo | WaypointMarkerInfo

export interface BaseEditProps {
  isPickingBase: boolean
  onTogglePickBase: () => void
  baseLatInput: string
  baseLngInput: string
  onBaseLatChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBaseLngChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyBase: () => void
  isApplyDisabled: boolean
  isInputDisabled: boolean
  isBaseUpdating: boolean
}
