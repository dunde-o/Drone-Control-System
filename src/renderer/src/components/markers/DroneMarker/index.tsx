import { AdvancedMarker } from '@vis.gl/react-google-maps'
import { Plane } from 'lucide-react'

import { Drone } from '@renderer/contexts/WebSocketContext/types'

import styles from './styles.module.scss'

interface DroneMarkerProps {
  drone: Drone
  isSelected?: boolean
  onClick?: () => void
}

const DroneMarker = ({
  drone,
  isSelected,
  onClick
}: DroneMarkerProps): React.JSX.Element | null => {
  // Only show marker for flying drones
  if (drone.status !== 'flying' && drone.status !== 'returning') {
    return null
  }

  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    onClick?.()
  }

  return (
    <AdvancedMarker position={drone.position} title={drone.name}>
      <div className={styles.wrapper}>
        {isSelected && <span className={styles.pulse} />}
        <div
          className={`${styles.marker} ${isSelected ? styles.selected : ''}`}
          onClick={handleClick}
        >
          <Plane size={20} strokeWidth={2.5} />
        </div>
      </div>
    </AdvancedMarker>
  )
}

export default DroneMarker
