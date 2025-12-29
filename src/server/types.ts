export interface ServerConfig {
  host: string
  port: number
  basePosition?: {
    lat: number
    lng: number
  }
  baseMoveDuration?: number
  heartbeatInterval?: number
  droneUpdateInterval?: number
  droneVerticalSpeed?: number // 수직 속도 (m/s)
  droneFlySpeed?: number // 비행 속도 (m/s)
  baseAltitude?: number // 베이스 적정 비행 고도 (m)
}

export interface ServerMessage {
  type: string
  payload?: unknown
}

export interface Position {
  lat: number
  lng: number
}

// Alias for backward compatibility
export type BasePosition = Position

export type DroneStatus =
  | 'idle' // 대기 - 베이스에서 시작 가능
  | 'ascending' // 이륙 중 - 베이스에서 적정 고도까지 상승 중
  | 'hovering' // 대기 비행 - 적정 고도에서 다음 명령 대기 중
  | 'moving' // 이동 중 - 지정 위치로 이동 중
  | 'mia' // 통신 두절 - 신호 끊김으로 탐지 불가
  | 'returning' // 복귀 중 - 베이스로 이동 중
  | 'landing' // 착륙 중 - 현재 위치에서 착륙 중
  | 'returning_auto' // 자동 복귀 - 고장/배터리 이슈로 자동 복귀 중
  | 'landing_auto' // 자동 착륙 - 고장/배터리 이슈로 자동 착륙 중

export interface Drone {
  id: string
  name: string
  position: Position
  altitude: number // 고도 (m)
  status: DroneStatus
  battery: number
  waypoints: Position[] // 목표 지점 리스트
}
