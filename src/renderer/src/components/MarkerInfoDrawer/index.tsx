import { ArrowUpFromLine, Battery, X } from 'lucide-react'

import { DroneStatus } from '@renderer/contexts/WebSocketContext/types'

import styles from './styles.module.scss'

export interface MarkerInfo {
  id: string
  type: 'base' | 'drone' | 'waypoint'
  name: string
  position: {
    lat: number
    lng: number
  }
  status?: DroneStatus
  battery?: number
  altitude?: number
  details?: Record<string, string | number>
}

interface MarkerInfoDrawerProps {
  marker: MarkerInfo | null
  onClose: () => void
}

const STATUS_CONFIG: Record<DroneStatus, { label: string; className: string }> = {
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

const MarkerInfoDrawer = ({ marker, onClose }: MarkerInfoDrawerProps): React.JSX.Element | null => {
  if (!marker) return null

  const typeLabels: Record<MarkerInfo['type'], string> = {
    base: 'Base Station',
    drone: 'Drone',
    waypoint: 'Waypoint'
  }

  const isDrone = marker.type === 'drone'

  const getStatusConfig = (status: DroneStatus): { label: string; className: string } => {
    return STATUS_CONFIG[status] || { label: status, className: 'statusIdle' }
  }

  return (
    <div className={styles.drawer}>
      <div className={styles.header}>
        <h3 className={styles.title}>{marker.name}</h3>
        {isDrone && marker.battery !== undefined && (
          <div className={styles.battery}>
            <Battery size={14} />
            <span>{marker.battery}%</span>
          </div>
        )}
        <span className={styles.type}>{typeLabels[marker.type]}</span>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className={styles.content}>
        {isDrone ? (
          <div className={styles.droneInfo}>
            <span className={styles.coords}>
              {marker.position.lat.toFixed(6)} / {marker.position.lng.toFixed(6)}
            </span>
            {marker.altitude !== undefined && (
              <span className={styles.altitude}>
                <ArrowUpFromLine size={12} />
                {marker.altitude.toFixed(1)}m
              </span>
            )}
            {marker.status && (
              <span
                className={`${styles.statusTag} ${styles[getStatusConfig(marker.status).className]}`}
              >
                {getStatusConfig(marker.status).label}
              </span>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}

export default MarkerInfoDrawer
