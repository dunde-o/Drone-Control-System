import { DroneStatus } from '@renderer/contexts/WebSocketContext/types'

// 배터리 레벨 임계값
export const BATTERY_LEVEL = {
  CRITICAL: 20, // 위험 (아이콘: BatteryWarning)
  LOW: 40, // 낮음 (아이콘: BatteryLow, 색상: danger)
  MEDIUM: 70 // 보통 (아이콘: BatteryMedium, 색상: warning)
  // 70 이상: 양호 (아이콘: BatteryFull, 색상: good)
} as const

// 드론 상태별 설정 (라벨, CSS 클래스)
export const STATUS_CONFIG: Record<DroneStatus, { label: string; className: string }> = {
  idle: { label: '대기', className: 'statusIdle' },
  ascending: { label: '이륙 중', className: 'statusAscending' },
  hovering: { label: '대기 비행', className: 'statusHovering' },
  moving: { label: '이동 중', className: 'statusMoving' },
  mia: { label: '통신 두절', className: 'statusMia' },
  returning: { label: '복귀 중', className: 'statusReturning' },
  landing: { label: '착륙 중', className: 'statusLanding' },
  returning_auto: { label: '자동 복귀', className: 'statusAuto' },
  landing_auto: { label: '자동 착륙', className: 'statusAuto' }
}

// 지상 대기 상태 (이륙 버튼 표시)
export const GROUND_STATUSES: DroneStatus[] = ['idle']

// 공중 상태 (착륙 버튼 표시)
export const AIR_STATUSES: DroneStatus[] = ['hovering', 'moving', 'returning', 'returning_auto']

// 전환 중 상태 (버튼 비활성화)
export const TRANSITIONING_STATUSES: DroneStatus[] = ['ascending', 'landing', 'landing_auto', 'mia']
