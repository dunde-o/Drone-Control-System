import { memo } from 'react'

import { Crosshair, Home, PlaneLanding, PlaneTakeoff, Route } from 'lucide-react'

import { Drone } from '@renderer/contexts/WebSocketContext/types'
import {
  isGroundStatus,
  isAirStatus,
  isTransitioning,
  getStatusConfig
} from '@renderer/contexts/WebSocketContext/constants'
import { getBatteryIcon } from '@renderer/utils/BatteryIcon'
import { getBatteryColorClass } from '@renderer/utils/battery'

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

const DroneCardComponent = ({
  drone,
  showPath,
  onTakeoff,
  onLand,
  onReturnToBase,
  onLocate,
  onTogglePath
}: DroneCardProps): React.JSX.Element => {
  const statusConfig = getStatusConfig(drone.status)
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
