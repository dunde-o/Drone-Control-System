// 배터리 관련 상수 및 함수는 공통 유틸에서 re-export
export { BATTERY_LEVEL, getBatteryColorClass } from '@renderer/utils/battery'

// 드론 상태 관련 상수는 WebSocketContext/constants.ts에서 re-export
export {
  DRONE_STATUS,
  STATUS_CONFIG,
  GROUND_STATUSES,
  AIR_STATUSES,
  TRANSITIONING_STATUSES,
  isGroundStatus,
  isAirStatus,
  isTransitioning,
  getStatusConfig
} from '@renderer/contexts/WebSocketContext/constants'
