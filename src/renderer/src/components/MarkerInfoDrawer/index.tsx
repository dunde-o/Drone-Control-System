import { X } from 'lucide-react'

import styles from './styles.module.scss'

export interface MarkerInfo {
  id: string
  type: 'base' | 'drone' | 'waypoint'
  name: string
  position: {
    lat: number
    lng: number
  }
  details?: Record<string, string | number>
}

interface MarkerInfoDrawerProps {
  marker: MarkerInfo | null
  onClose: () => void
}

const MarkerInfoDrawer = ({ marker, onClose }: MarkerInfoDrawerProps): React.JSX.Element | null => {
  if (!marker) return null

  const typeLabels: Record<MarkerInfo['type'], string> = {
    base: 'Base Station',
    drone: 'Drone',
    waypoint: 'Waypoint'
  }

  return (
    <div className={styles.drawer}>
      <div className={styles.header}>
        <h3 className={styles.title}>{marker.name}</h3>
        <span className={styles.type}>{typeLabels[marker.type]}</span>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>위치</h4>
          <div className={styles.info}>
            <span className={styles.label}>위도</span>
            <span className={styles.value}>{marker.position.lat.toFixed(6)}</span>
          </div>
          <div className={styles.info}>
            <span className={styles.label}>경도</span>
            <span className={styles.value}>{marker.position.lng.toFixed(6)}</span>
          </div>
        </div>

        {marker.details && Object.keys(marker.details).length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>상세 정보</h4>
            {Object.entries(marker.details).map(([key, value]) => (
              <div key={key} className={styles.info}>
                <span className={styles.label}>{key}</span>
                <span className={styles.value}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MarkerInfoDrawer
