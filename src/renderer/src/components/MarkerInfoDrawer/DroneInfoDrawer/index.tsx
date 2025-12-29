import { ArrowUpFromLine, Plane } from 'lucide-react'

import DrawerLayout from '../DrawerLayout'
import styles from '../styles.module.scss'
import { DroneMarkerInfo } from '../types'

import HeaderActions from './HeaderActions'
import { isGroundStatus, isAirStatus, getStatusConfig } from './utils'

interface DroneInfoDrawerProps {
  marker: DroneMarkerInfo
  onClose: () => void
  onTakeoff?: (droneId: string) => void
  onLand?: (droneId: string) => void
  onReturnToBase?: (droneId: string) => void
}

const DroneInfoDrawer = ({
  marker,
  onClose,
  onTakeoff,
  onLand,
  onReturnToBase
}: DroneInfoDrawerProps): React.JSX.Element => {
  const handleTakeoffLand = (): void => {
    if (isGroundStatus(marker.status)) {
      onTakeoff?.(marker.id)
    } else if (isAirStatus(marker.status)) {
      onLand?.(marker.id)
    }
  }

  const handleReturnToBase = (): void => {
    onReturnToBase?.(marker.id)
  }

  return (
    <DrawerLayout
      title={marker.name}
      icon={<Plane size={16} />}
      iconClassName={styles.typeIconDrone}
      headerActions={
        <HeaderActions
          status={marker.status}
          battery={marker.battery}
          onTakeoffLand={handleTakeoffLand}
          onReturnToBase={handleReturnToBase}
        />
      }
      onClose={onClose}
    >
      <div className={styles.droneInfo}>
        <span className={styles.coords}>
          {marker.position.lat.toFixed(6)} / {marker.position.lng.toFixed(6)}
        </span>
        <span className={styles.altitude}>
          <ArrowUpFromLine size={12} />
          {marker.altitude.toFixed(1)}m
        </span>
        <span className={`${styles.statusTag} ${styles[getStatusConfig(marker.status).className]}`}>
          {getStatusConfig(marker.status).label}
        </span>
      </div>
    </DrawerLayout>
  )
}

export default DroneInfoDrawer
