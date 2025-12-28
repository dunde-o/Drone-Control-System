import { memo } from 'react'

import {
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Crosshair,
  Home,
  PlaneLanding,
  PlaneTakeoff,
  Route
} from 'lucide-react'

import { Drone } from '@renderer/contexts/WebSocketContext/types'

import styles from '../styles.module.scss'

interface DroneCardProps {
  drone: Drone
  showPath: boolean
  onTakeoff: (droneId: string, droneName: string) => void
  onLand: (droneId: string, droneName: string) => void
  onReturnToBase: (droneId: string) => void
  onLocate: (droneId: string) => void
  onTogglePath: (droneId: string) => void
}

// 지상 대기 상태 (이륙 버튼 표시)
const isGroundStatus = (status: Drone['status']): boolean => status === 'idle'

// 공중 상태 (착륙 버튼 표시)
const isAirStatus = (status: Drone['status']): boolean =>
  ['hovering', 'moving', 'returning', 'returning_auto'].includes(status)

// 버튼 비활성화 상태 (이/착륙 중)
const isTransitioning = (status: Drone['status']): boolean =>
  ['ascending', 'landing', 'landing_auto', 'mia'].includes(status)

const STATUS_CONFIG: Record<Drone['status'], { label: string; className: string }> = {
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

const getBatteryIcon = (battery: number): React.JSX.Element => {
  if (battery < 20) return <BatteryWarning size={14} />
  if (battery < 40) return <BatteryLow size={14} />
  if (battery < 70) return <BatteryMedium size={14} />
  return <BatteryFull size={14} />
}

const getBatteryColorClass = (battery: number): string => {
  if (battery < 40) return 'batteryDanger'
  if (battery < 70) return 'batteryWarning'
  return 'batteryGood'
}

const DroneCardComponent = ({
  drone,
  showPath,
  onTakeoff,
  onLand,
  onReturnToBase,
  onLocate,
  onTogglePath
}: DroneCardProps): React.JSX.Element => {
  const statusConfig = STATUS_CONFIG[drone.status] || {
    label: drone.status,
    className: 'statusIdle'
  }
  const batteryColorClass = getBatteryColorClass(drone.battery)

  const canTakeoffOrLand = !isTransitioning(drone.status)
  const canReturnToBase = isAirStatus(drone.status) && !isTransitioning(drone.status)

  const handleTakeoffLand = (): void => {
    if (isGroundStatus(drone.status)) {
      onTakeoff(drone.id, drone.name)
    } else if (isAirStatus(drone.status)) {
      onLand(drone.id, drone.name)
    }
  }

  const handleLocate = (): void => {
    onLocate(drone.id)
  }

  const handleReturnToBase = (): void => {
    onReturnToBase(drone.id)
  }

  const handleTogglePath = (): void => {
    onTogglePath(drone.id)
  }

  return (
    <div className={styles.droneCard}>
      <div className={styles.droneHeader}>
        <span className={styles.droneName}>{drone.name}</span>
        <span className={`${styles.droneStatus} ${styles[statusConfig.className]}`}>
          {statusConfig.label}
        </span>
      </div>
      <div className={styles.droneInfo}>
        <div
          className={`${styles.droneBattery} ${batteryColorClass ? styles[batteryColorClass] : ''}`}
        >
          {getBatteryIcon(drone.battery)}
          <span>{drone.battery}%</span>
        </div>
        <button
          className={`${styles.pathToggle} ${showPath ? styles.active : ''}`}
          onClick={handleTogglePath}
          title={showPath ? '경로 숨기기' : '경로 보기'}
        >
          <Route size={14} />
        </button>
        <div className={styles.droneActions}>
          <button
            className={`${styles.droneActionButton} ${styles.locateButton}`}
            onClick={handleLocate}
            title="위치 보기"
          >
            <Crosshair size={14} />
          </button>
          <button
            className={`${styles.droneActionButton} ${isGroundStatus(drone.status) ? styles.takeoffButton : styles.landButton}`}
            onClick={handleTakeoffLand}
            disabled={!canTakeoffOrLand}
            title={isGroundStatus(drone.status) ? '이륙' : '착륙'}
          >
            {isGroundStatus(drone.status) ? <PlaneTakeoff size={14} /> : <PlaneLanding size={14} />}
          </button>
          <button
            className={`${styles.droneActionButton} ${styles.returnButton}`}
            onClick={handleReturnToBase}
            disabled={!canReturnToBase}
            title="복귀"
          >
            <Home size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// 드론 데이터가 변경될 때만 리렌더링 (위치, 고도는 무시)
const DroneCard = memo(DroneCardComponent, (prevProps, nextProps) => {
  const prev = prevProps.drone
  const next = nextProps.drone
  return (
    prev.id === next.id &&
    prev.status === next.status &&
    prev.battery === next.battery &&
    prev.name === next.name &&
    prevProps.showPath === nextProps.showPath
  )
})

export default DroneCard
