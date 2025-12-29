import { DroneStatus } from './types'

// 드론 상태값 상수
export const DRONE_STATUS = {
  IDLE: 'idle',
  ASCENDING: 'ascending',
  HOVERING: 'hovering',
  MOVING: 'moving',
  MIA: 'mia',
  RETURNING: 'returning',
  LANDING: 'landing',
  RETURNING_AUTO: 'returning_auto',
  LANDING_AUTO: 'landing_auto'
} as const satisfies Record<string, DroneStatus>

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
export const GROUND_STATUSES: DroneStatus[] = [DRONE_STATUS.IDLE]

// 공중 상태 (착륙 버튼 표시)
export const AIR_STATUSES: DroneStatus[] = [
  DRONE_STATUS.HOVERING,
  DRONE_STATUS.MOVING,
  DRONE_STATUS.RETURNING,
  DRONE_STATUS.RETURNING_AUTO
]

// 전환 중 상태 (버튼 비활성화)
export const TRANSITIONING_STATUSES: DroneStatus[] = [
  DRONE_STATUS.ASCENDING,
  DRONE_STATUS.LANDING,
  DRONE_STATUS.LANDING_AUTO,
  DRONE_STATUS.MIA
]

// 상태 판별 헬퍼 함수
export const isGroundStatus = (status: DroneStatus): boolean => GROUND_STATUSES.includes(status)

export const isAirStatus = (status: DroneStatus): boolean => AIR_STATUSES.includes(status)

export const isTransitioning = (status: DroneStatus): boolean =>
  TRANSITIONING_STATUSES.includes(status)

export const getStatusConfig = (status: DroneStatus): { label: string; className: string } =>
  STATUS_CONFIG[status] || { label: status, className: 'statusIdle' }
