// 배터리 관련 함수는 공통 유틸에서 re-export
export { getBatteryIcon } from '@renderer/utils/BatteryIcon'
export { getBatteryColorClass } from '@renderer/utils/battery'

// 드론 상태 관련 함수는 공통 상수에서 re-export
export {
  isGroundStatus,
  isAirStatus,
  isTransitioning,
  getStatusConfig
} from '@renderer/contexts/WebSocketContext/constants'
