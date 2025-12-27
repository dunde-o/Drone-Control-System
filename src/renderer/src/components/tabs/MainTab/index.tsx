import { ChangeEvent, useEffect, useRef, useState } from 'react'

import {
  ArrowUpFromLine,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Crosshair,
  Home,
  Loader2,
  Locate,
  MapPinned,
  PlaneLanding,
  PlaneTakeoff,
  X
} from 'lucide-react'

import { useUpdateBasePosition } from '@renderer/hooks/mutations'
import { useBasePosition, useConnectionStatus, useDrones } from '@renderer/hooks/queries'
import { Drone } from '@renderer/contexts/WebSocketContext/types'

import styles from './styles.module.scss'

interface DroneCardProps {
  drone: Drone
  onTakeoff: () => void
  onLand: () => void
  onReturnToBase: () => void
  onLocate: () => void
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

const DroneCard = ({
  drone,
  onTakeoff,
  onLand,
  onReturnToBase,
  onLocate
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
      onTakeoff()
    } else if (isAirStatus(drone.status)) {
      onLand()
    }
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
        <div className={styles.droneAltitude}>
          <ArrowUpFromLine size={14} />
          <span>{drone.altitude.toFixed(1)}m</span>
        </div>
        <div className={styles.droneActions}>
          <button
            className={`${styles.droneActionButton} ${styles.locateButton}`}
            onClick={onLocate}
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
            onClick={onReturnToBase}
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

interface MainTabProps {
  isPickingBase: boolean
  onTogglePickBase: () => void
  pickingLat: string
  pickingLng: string
  onPanToBase?: () => void
  onTakeoff?: (droneId: string) => void
  onLand?: (droneId: string) => void
  onReturnToBase?: (droneId: string) => void
  onLocateDrone?: (droneId: string) => void
}

const MainTab = ({
  isPickingBase,
  onTogglePickBase,
  pickingLat,
  pickingLng,
  onPanToBase,
  onTakeoff,
  onLand,
  onReturnToBase,
  onLocateDrone
}: MainTabProps): React.JSX.Element => {
  const { data: connectionStatus = 'disconnected' } = useConnectionStatus()
  const { data: basePosition } = useBasePosition()
  const { data: drones = [] } = useDrones()
  const updateBasePosition = useUpdateBasePosition()

  const [baseLatInput, setBaseLatInput] = useState('')
  const [baseLngInput, setBaseLngInput] = useState('')

  // Track if user has modified inputs locally
  const isPickingBaseRef = useRef(isPickingBase)

  const isBaseEnabled = connectionStatus === 'connected'
  const isBaseUpdating = updateBasePosition.isPending

  // Sync inputs when server value changes (only if not picking)
  useEffect(() => {
    if (basePosition && !isPickingBaseRef.current) {
      setBaseLatInput(String(basePosition.lat))
      setBaseLngInput(String(basePosition.lng))
    }
  }, [basePosition])

  // Update inputs when picking from map
  useEffect(() => {
    isPickingBaseRef.current = isPickingBase
    if (isPickingBase && pickingLat && pickingLng) {
      setBaseLatInput(pickingLat)
      setBaseLngInput(pickingLng)
    }
  }, [isPickingBase, pickingLat, pickingLng])

  const handleBaseLatChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setBaseLatInput(e.target.value)
  }

  const handleBaseLngChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setBaseLngInput(e.target.value)
  }

  const handleApplyBase = (): void => {
    const lat = parseFloat(baseLatInput)
    const lng = parseFloat(baseLngInput)
    if (isNaN(lat) || isNaN(lng)) return

    updateBasePosition.mutate({ lat, lng })
  }

  const isInputDisabled = !isBaseEnabled || isBaseUpdating
  const isUnchanged =
    basePosition &&
    baseLatInput === String(basePosition.lat) &&
    baseLngInput === String(basePosition.lng)
  const isApplyDisabled =
    !isBaseEnabled || isBaseUpdating || !baseLatInput || !baseLngInput || !!isUnchanged

  return (
    <div className={styles.container}>
      <h2>MAIN</h2>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Base 위치 설정</h3>
          <button
            onClick={onPanToBase}
            className={styles.panButton}
            title="Base 위치로 이동"
            disabled={!isBaseEnabled || !basePosition}
          >
            <Locate size={16} />
          </button>
        </div>
        {!isBaseEnabled && (
          <p className={styles.disabledHint}>서버가 연결되어야 Base 위치를 설정할 수 있습니다</p>
        )}
        <div className={styles.coordGroup}>
          <div className={styles.coordInput}>
            <label className={styles.label}>위도 (Latitude)</label>
            <input
              type="number"
              step="any"
              value={baseLatInput}
              onChange={handleBaseLatChange}
              placeholder={isBaseEnabled ? '37.5665' : '-'}
              className={styles.input}
              disabled={isInputDisabled}
            />
          </div>
          <div className={styles.coordInput}>
            <label className={styles.label}>경도 (Longitude)</label>
            <input
              type="number"
              step="any"
              value={baseLngInput}
              onChange={handleBaseLngChange}
              placeholder={isBaseEnabled ? '126.978' : '-'}
              className={styles.input}
              disabled={isInputDisabled}
            />
          </div>
        </div>
        <div className={styles.buttonGroup}>
          <button onClick={handleApplyBase} className={styles.button} disabled={isApplyDisabled}>
            {isBaseUpdating ? (
              <>
                <Loader2 size={16} className={styles.spinner} />
                적용 중...
              </>
            ) : (
              'Base 위치 적용'
            )}
          </button>
          <button
            onClick={onTogglePickBase}
            className={`${styles.pickButton} ${isPickingBase ? styles.active : ''}`}
            title={isPickingBase ? '선택 취소' : '지도에서 선택'}
            disabled={isInputDisabled}
          >
            {isPickingBase ? <X size={20} /> : <MapPinned size={20} />}
          </button>
        </div>
        <p className={styles.hint}>
          {isPickingBase
            ? '지도를 클릭하여 Base 위치를 선택하세요'
            : '드론의 이착륙 기지 위치를 설정합니다'}
        </p>
      </div>

      {drones.length > 0 && (
        <div className={styles.section}>
          <h3>드론 목록</h3>
          <div className={styles.droneList}>
            {drones.map((drone: Drone) => (
              <DroneCard
                key={drone.id}
                drone={drone}
                onTakeoff={() => onTakeoff?.(drone.id)}
                onLand={() => onLand?.(drone.id)}
                onReturnToBase={() => onReturnToBase?.(drone.id)}
                onLocate={() => onLocateDrone?.(drone.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MainTab
