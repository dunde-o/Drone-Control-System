export const DEFAULT_HEARTBEAT_INTERVAL = 3000 // 3 seconds
export const DEFAULT_BASE_MOVE_DURATION = 1000 // 1 second
export const DEFAULT_DRONE_UPDATE_INTERVAL = 200 // 0.2 seconds
export const DEFAULT_DRONE_VERTICAL_SPEED = 5 // 5 m/s
export const DEFAULT_DRONE_FLY_SPEED = 10 // 10 m/s
export const DEFAULT_BASE_ALTITUDE = 50 // 50 m

// 랜덤 위치 생성 범위 (미터)
export const RANDOM_POSITION_MIN_DISTANCE = 5000 // 5km
export const RANDOM_POSITION_MAX_DISTANCE = 10000 // 10km

// 지구 반지름 (미터)
export const EARTH_RADIUS = 6371000

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
} as const

// 공중 상태 (이동 가능한 상태)
export const AIRBORNE_STATUSES: readonly string[] = [
  DRONE_STATUS.HOVERING,
  DRONE_STATUS.MOVING,
  DRONE_STATUS.RETURNING,
  DRONE_STATUS.RETURNING_AUTO
]
