import { ChangeEvent, memo, useCallback, useEffect, useRef, useState } from 'react'

import {
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
  Route,
  Shuffle,
  X
} from 'lucide-react'

import { useUpdateBasePosition } from '@renderer/hooks/mutations'
import { useBasePosition, useConnectionStatus, useDrones } from '@renderer/hooks/queries'
import { Drone } from '@renderer/contexts/WebSocketContext/types'

import styles from './styles.module.scss'

interface DroneCardProps {
  drone: Drone
  showPath: boolean
  onTakeoff: (droneId: string) => void
  onLand: (droneId: string) => void
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
      onTakeoff(drone.id)
    } else if (isAirStatus(drone.status)) {
      onLand(drone.id)
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

// 드론 리스트 섹션 (별도 컴포넌트로 분리하여 useDrones 구독을 격리)
interface DroneListSectionProps {
  basePosition: { lat: number; lng: number } | undefined
  pathVisibility: Record<string, boolean>
  onTakeoff: (droneId: string) => void
  onLand: (droneId: string) => void
  onReturnToBase: (droneId: string) => void
  onLocate: (droneId: string) => void
  onTogglePath: (droneId: string) => void
  onToggleAllPaths: (show: boolean) => void
  onRandomMove?: (droneId: string, lat: number, lng: number) => void
  onDirectTakeoff?: (droneId: string) => void
  onShowConfirmDialog?: (
    type: 'allTakeoff' | 'allReturnToBase' | 'allRandomMove',
    onConfirm: () => void
  ) => void
}

const DroneListSection = memo(
  ({
    basePosition,
    pathVisibility,
    onTakeoff,
    onLand,
    onReturnToBase,
    onLocate,
    onTogglePath,
    onToggleAllPaths,
    onRandomMove,
    onDirectTakeoff,
    onShowConfirmDialog
  }: DroneListSectionProps): React.JSX.Element | null => {
    const { data: drones = [] } = useDrones()

    // 전체 경로 표시 상태 계산
    const allPathsVisible = drones.length > 0 && drones.every((d) => pathVisibility[d.id])

    const handleAllRandomMove = useCallback((): void => {
      if (!basePosition) return
      onShowConfirmDialog?.('allRandomMove', () => {
        drones.forEach((drone) => {
          if (['hovering', 'moving', 'returning', 'returning_auto'].includes(drone.status)) {
            const randomPos = generateRandomPosition(basePosition.lat, basePosition.lng)
            onRandomMove?.(drone.id, randomPos.lat, randomPos.lng)
          }
        })
      })
    }, [basePosition, drones, onRandomMove, onShowConfirmDialog])

    const handleAllTakeoff = useCallback((): void => {
      onShowConfirmDialog?.('allTakeoff', () => {
        drones.forEach((drone) => {
          if (drone.status === 'idle') {
            onDirectTakeoff?.(drone.id)
          }
        })
      })
    }, [drones, onDirectTakeoff, onShowConfirmDialog])

    const handleAllReturnToBase = useCallback((): void => {
      onShowConfirmDialog?.('allReturnToBase', () => {
        drones.forEach((drone) => {
          if (['hovering', 'moving', 'returning', 'returning_auto'].includes(drone.status)) {
            onReturnToBase?.(drone.id)
          }
        })
      })
    }, [drones, onReturnToBase, onShowConfirmDialog])

    const handleToggleAllPaths = useCallback((): void => {
      onToggleAllPaths(!allPathsVisible)
    }, [allPathsVisible, onToggleAllPaths])

    if (drones.length === 0) return null

    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>드론 목록</h3>
          <div className={styles.bulkActions}>
            <button
              className={`${styles.bulkButton} ${styles.pathButton} ${allPathsVisible ? styles.active : ''}`}
              onClick={handleToggleAllPaths}
              title={allPathsVisible ? '전체 경로 숨기기' : '전체 경로 보기'}
            >
              <Route size={14} />
            </button>
            <button
              className={`${styles.bulkButton} ${styles.randomButton}`}
              onClick={handleAllRandomMove}
              disabled={!basePosition}
              title="전체 랜덤 이동"
            >
              <Shuffle size={14} />
            </button>
            <button
              className={`${styles.bulkButton} ${styles.takeoffButton}`}
              onClick={handleAllTakeoff}
              title="전체 이륙"
            >
              <PlaneTakeoff size={14} />
            </button>
            <button
              className={`${styles.bulkButton} ${styles.returnButton}`}
              onClick={handleAllReturnToBase}
              title="전체 복귀"
            >
              <Home size={14} />
            </button>
          </div>
        </div>
        <div className={styles.droneList}>
          {drones.map((drone: Drone) => (
            <DroneCard
              key={drone.id}
              drone={drone}
              showPath={pathVisibility[drone.id] ?? false}
              onTakeoff={onTakeoff}
              onLand={onLand}
              onTogglePath={onTogglePath}
              onReturnToBase={onReturnToBase}
              onLocate={onLocate}
            />
          ))}
        </div>
      </div>
    )
  }
)

DroneListSection.displayName = 'DroneListSection'

// 베이스 기준 5km ~ 10km 반경 내 랜덤 좌표 생성
const generateRandomPosition = (baseLat: number, baseLng: number): { lat: number; lng: number } => {
  // 5km ~ 10km 사이 랜덤 거리 (미터)
  const minDistance = 5000
  const maxDistance = 10000
  const distance = minDistance + Math.random() * (maxDistance - minDistance)

  // 랜덤 방향 (0 ~ 360도)
  const bearing = Math.random() * 360

  // 위도/경도 변환 (근사값)
  const earthRadius = 6371000 // 지구 반지름 (미터)
  const latOffset = (distance * Math.cos((bearing * Math.PI) / 180)) / earthRadius
  const lngOffset =
    (distance * Math.sin((bearing * Math.PI) / 180)) /
    (earthRadius * Math.cos((baseLat * Math.PI) / 180))

  return {
    lat: baseLat + (latOffset * 180) / Math.PI,
    lng: baseLng + (lngOffset * 180) / Math.PI
  }
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
  onRandomMove?: (droneId: string, lat: number, lng: number) => void
  onDirectTakeoff?: (droneId: string) => void
  onShowConfirmDialog?: (
    type: 'allTakeoff' | 'allReturnToBase' | 'allRandomMove',
    onConfirm: () => void
  ) => void
  pathVisibility?: Record<string, boolean>
  onTogglePath?: (droneId: string) => void
  onToggleAllPaths?: (show: boolean) => void
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
  onLocateDrone,
  onRandomMove,
  onDirectTakeoff,
  onShowConfirmDialog,
  pathVisibility = {},
  onTogglePath,
  onToggleAllPaths
}: MainTabProps): React.JSX.Element => {
  const { data: connectionStatus = 'disconnected' } = useConnectionStatus()
  const { data: basePosition } = useBasePosition()
  const updateBasePosition = useUpdateBasePosition()

  const [baseLatInput, setBaseLatInput] = useState('')
  const [baseLngInput, setBaseLngInput] = useState('')

  // 안정적인 콜백 참조 (DroneListSection에 전달)
  const handleDroneTakeoff = useCallback(
    (droneId: string): void => {
      onTakeoff?.(droneId)
    },
    [onTakeoff]
  )

  const handleDroneLand = useCallback(
    (droneId: string): void => {
      onLand?.(droneId)
    },
    [onLand]
  )

  const handleDroneReturnToBase = useCallback(
    (droneId: string): void => {
      onReturnToBase?.(droneId)
    },
    [onReturnToBase]
  )

  const handleDroneLocate = useCallback(
    (droneId: string): void => {
      onLocateDrone?.(droneId)
    },
    [onLocateDrone]
  )

  const handleTogglePath = useCallback(
    (droneId: string): void => {
      onTogglePath?.(droneId)
    },
    [onTogglePath]
  )

  const handleToggleAllPaths = useCallback(
    (show: boolean): void => {
      onToggleAllPaths?.(show)
    },
    [onToggleAllPaths]
  )

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

      <DroneListSection
        basePosition={basePosition ?? undefined}
        pathVisibility={pathVisibility}
        onTakeoff={handleDroneTakeoff}
        onLand={handleDroneLand}
        onReturnToBase={handleDroneReturnToBase}
        onLocate={handleDroneLocate}
        onTogglePath={handleTogglePath}
        onToggleAllPaths={handleToggleAllPaths}
        onRandomMove={onRandomMove}
        onDirectTakeoff={onDirectTakeoff}
        onShowConfirmDialog={onShowConfirmDialog}
      />
    </div>
  )
}

export default MainTab
