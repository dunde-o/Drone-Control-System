import { ChangeEvent } from 'react'

import {
  ArrowUpFromLine,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Home,
  Loader2,
  MapPinned,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  X
} from 'lucide-react'

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

export interface BaseEditProps {
  isPickingBase: boolean
  onTogglePickBase: () => void
  baseLatInput: string
  baseLngInput: string
  onBaseLatChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBaseLngChange: (e: ChangeEvent<HTMLInputElement>) => void
  onApplyBase: () => void
  isApplyDisabled: boolean
  isInputDisabled: boolean
  isBaseUpdating: boolean
}

interface MarkerInfoDrawerProps {
  marker: MarkerInfo | null
  onClose: () => void
  onTakeoff?: (droneId: string) => void
  onLand?: (droneId: string) => void
  onReturnToBase?: (droneId: string) => void
  baseEditProps?: BaseEditProps
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

// 지상 대기 상태 (이륙 버튼 표시)
const isGroundStatus = (status: DroneStatus): boolean => status === 'idle'

// 공중 상태 (착륙 버튼 표시)
const isAirStatus = (status: DroneStatus): boolean =>
  ['hovering', 'moving', 'returning', 'returning_auto'].includes(status)

// 버튼 비활성화 상태 (이/착륙 중)
const isTransitioning = (status: DroneStatus): boolean =>
  ['ascending', 'landing', 'landing_auto', 'mia'].includes(status)

const MarkerInfoDrawer = ({
  marker,
  onClose,
  onTakeoff,
  onLand,
  onReturnToBase,
  baseEditProps
}: MarkerInfoDrawerProps): React.JSX.Element | null => {
  if (!marker) return null

  const isDrone = marker.type === 'drone'

  const getStatusConfig = (status: DroneStatus): { label: string; className: string } => {
    return STATUS_CONFIG[status] || { label: status, className: 'statusIdle' }
  }

  const handleTakeoffLand = (): void => {
    if (!marker.status) return
    if (isGroundStatus(marker.status)) {
      onTakeoff?.(marker.id)
    } else if (isAirStatus(marker.status)) {
      onLand?.(marker.id)
    }
  }

  const handleReturnToBase = (): void => {
    onReturnToBase?.(marker.id)
  }

  const canTakeoffOrLand = marker.status && !isTransitioning(marker.status)
  const canReturnToBase =
    marker.status && isAirStatus(marker.status) && !isTransitioning(marker.status)

  return (
    <div className={styles.drawer}>
      <div className={styles.header}>
        <span
          className={`${styles.typeIcon} ${isDrone ? styles.typeIconDrone : styles.typeIconBase}`}
        >
          {isDrone ? <Plane size={16} /> : <Home size={16} />}
        </span>
        <h3 className={styles.title}>{marker.name}</h3>
        {isDrone && marker.status && (
          <div className={styles.actionButtons}>
            <button
              className={`${styles.actionButton} ${isGroundStatus(marker.status) ? styles.takeoffButton : styles.landButton}`}
              onClick={handleTakeoffLand}
              disabled={!canTakeoffOrLand}
              title={isGroundStatus(marker.status) ? '이륙' : '착륙'}
            >
              {isGroundStatus(marker.status) ? (
                <PlaneTakeoff size={16} />
              ) : (
                <PlaneLanding size={16} />
              )}
            </button>
            <button
              className={`${styles.actionButton} ${styles.returnButton}`}
              onClick={handleReturnToBase}
              disabled={!canReturnToBase}
              title="복귀"
            >
              <Home size={16} />
            </button>
          </div>
        )}
        {isDrone && marker.battery !== undefined && (
          <div className={`${styles.battery} ${styles[getBatteryColorClass(marker.battery)]}`}>
            {getBatteryIcon(marker.battery)}
            <span>{marker.battery}%</span>
          </div>
        )}
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
            {baseEditProps ? (
              <div className={styles.baseEditSection}>
                <div className={styles.coordGroup}>
                  <div className={styles.coordInput}>
                    <label className={styles.coordLabel}>위도 (Latitude)</label>
                    <input
                      type="number"
                      step="any"
                      value={baseEditProps.baseLatInput}
                      onChange={baseEditProps.onBaseLatChange}
                      placeholder="37.5665"
                      className={styles.coordInputField}
                      disabled={baseEditProps.isInputDisabled}
                    />
                  </div>
                  <div className={styles.coordInput}>
                    <label className={styles.coordLabel}>경도 (Longitude)</label>
                    <input
                      type="number"
                      step="any"
                      value={baseEditProps.baseLngInput}
                      onChange={baseEditProps.onBaseLngChange}
                      placeholder="126.978"
                      className={styles.coordInputField}
                      disabled={baseEditProps.isInputDisabled}
                    />
                  </div>
                </div>
                <div className={styles.baseButtonGroup}>
                  <button
                    onClick={baseEditProps.onApplyBase}
                    className={styles.applyButton}
                    disabled={baseEditProps.isApplyDisabled}
                  >
                    {baseEditProps.isBaseUpdating ? (
                      <>
                        <Loader2 size={14} className={styles.spinner} />
                        적용 중...
                      </>
                    ) : (
                      '위치 적용'
                    )}
                  </button>
                  <button
                    onClick={baseEditProps.onTogglePickBase}
                    className={`${styles.pickButton} ${baseEditProps.isPickingBase ? styles.active : ''}`}
                    title={baseEditProps.isPickingBase ? '선택 취소' : '지도에서 선택'}
                    disabled={baseEditProps.isInputDisabled}
                  >
                    {baseEditProps.isPickingBase ? <X size={18} /> : <MapPinned size={18} />}
                  </button>
                </div>
                {baseEditProps.isPickingBase && (
                  <p className={styles.pickingHint}>지도를 클릭하여 위치를 선택하세요</p>
                )}
              </div>
            ) : (
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
            )}

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
