import { AdvancedMarker } from '@vis.gl/react-google-maps'
import { Plane, WifiOff } from 'lucide-react'

import { Drone, DroneStatus } from '@renderer/contexts/WebSocketContext/types'

import styles from './styles.module.scss'

interface DroneMarkerProps {
  drone: Drone
  isSelected?: boolean
  onClick?: () => void
}

// 상태별 스타일 클래스 매핑
const STATUS_STYLE_MAP: Record<DroneStatus, string> = {
  idle: styles.statusIdle,
  ascending: styles.statusAscending,
  hovering: styles.statusHovering,
  moving: styles.statusMoving,
  mia: styles.statusMia,
  returning: styles.statusReturning,
  landing: styles.statusLanding,
  returning_auto: styles.statusAuto,
  landing_auto: styles.statusAuto
}

// 광원효과를 보여줄 상태 (idle과 mia는 제외)
const shouldShowPulse = (status: DroneStatus): boolean => !['idle', 'mia'].includes(status)

const DroneMarker = ({ drone, isSelected, onClick }: DroneMarkerProps): React.JSX.Element => {
  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onClick?.()
  }

  const statusClass = STATUS_STYLE_MAP[drone.status] || ''
  const showPulse = isSelected && shouldShowPulse(drone.status)

  return (
    <AdvancedMarker position={drone.position} title={drone.name} zIndex={10}>
      <div className={`${styles.wrapper} map-marker`}>
        {showPulse && <span className={styles.pulse} />}
        <div
          className={`${styles.marker} ${statusClass} ${isSelected ? styles.selected : ''}`}
          onClick={handleClick}
        >
          {drone.status === 'mia' ? (
            <WifiOff size={20} strokeWidth={2.5} />
          ) : (
            <Plane size={20} strokeWidth={2.5} />
          )}
        </div>
      </div>
    </AdvancedMarker>
  )
}

export default DroneMarker
