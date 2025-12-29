import { Plane, WifiOff } from 'lucide-react'

import { DroneStatus } from '@renderer/contexts/WebSocketContext/types'
import { DRONE_STATUS } from '@renderer/contexts/WebSocketContext/constants'

import styles from '../styles.module.scss'

interface MarkerContentProps {
  status: DroneStatus
  isSelected: boolean
  onClick: () => void
}

// 상태별 스타일 클래스 매핑
const STATUS_STYLE_MAP: Record<DroneStatus, string> = {
  [DRONE_STATUS.IDLE]: styles.statusIdle,
  [DRONE_STATUS.ASCENDING]: styles.statusAscending,
  [DRONE_STATUS.HOVERING]: styles.statusHovering,
  [DRONE_STATUS.MOVING]: styles.statusMoving,
  [DRONE_STATUS.MIA]: styles.statusMia,
  [DRONE_STATUS.RETURNING]: styles.statusReturning,
  [DRONE_STATUS.LANDING]: styles.statusLanding,
  [DRONE_STATUS.RETURNING_AUTO]: styles.statusAuto,
  [DRONE_STATUS.LANDING_AUTO]: styles.statusAuto
}

// 광원효과를 보여줄 상태 (idle과 mia는 제외)
const shouldShowPulse = (status: DroneStatus): boolean =>
  status !== DRONE_STATUS.IDLE && status !== DRONE_STATUS.MIA

const MarkerContent = ({ status, isSelected, onClick }: MarkerContentProps): React.JSX.Element => {
  const statusClass = STATUS_STYLE_MAP[status] || ''
  const showPulse = isSelected && shouldShowPulse(status)

  const handleSelectDrone = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onClick()
  }

  return (
    <div className={`${styles.wrapper} map-marker`}>
      {showPulse && <span className={styles.pulse} />}
      <div
        className={`${styles.marker} ${statusClass} ${isSelected ? styles.selected : ''}`}
        onClick={handleSelectDrone}
      >
        {status === DRONE_STATUS.MIA ? (
          <WifiOff size={20} strokeWidth={2.5} />
        ) : (
          <Plane size={20} strokeWidth={2.5} />
        )}
      </div>
    </div>
  )
}

export default MarkerContent
