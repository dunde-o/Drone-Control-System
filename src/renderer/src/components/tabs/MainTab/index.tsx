import { memo, useCallback } from 'react'

import {
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  BatteryWarning,
  Crosshair,
  Home,
  Locate,
  PlaneLanding,
  PlaneTakeoff,
  Route,
  Shuffle
} from 'lucide-react'

import { useBasePosition, useConnectionStatus, useDrones } from '@renderer/hooks/queries'
import { Drone } from '@renderer/contexts/WebSocketContext/types'

import styles from './styles.module.scss'

// 메모이제이션된 아이콘 컴포넌트
const LocateIcon = memo((): React.JSX.Element => <Locate size={16} />)
LocateIcon.displayName = 'LocateIcon'

const RouteIcon = memo((): React.JSX.Element => <Route size={14} />)
RouteIcon.displayName = 'RouteIcon'

const ShuffleIcon = memo((): React.JSX.Element => <Shuffle size={14} />)
ShuffleIcon.displayName = 'ShuffleIcon'

const PlaneTakeoffIcon = memo((): React.JSX.Element => <PlaneTakeoff size={14} />)
PlaneTakeoffIcon.displayName = 'PlaneTakeoffIcon'

const HomeIcon = memo((): React.JSX.Element => <Home size={14} />)
HomeIcon.displayName = 'HomeIcon'

interface DroneCardProps {
  drone: Drone
  showPath: boolean
  onTakeoff: (droneId: string, droneName: string) => void
  onLand: (droneId: string, droneName: string) => void
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

// 드론 리스트 섹션 (별도 컴포넌트로 분리하여 useDrones 구독을 격리)
interface DroneListSectionProps {
  pathVisibility: Record<string, boolean>
  onTakeoff: (droneId: string, droneName: string) => void
  onLand: (droneId: string, droneName: string) => void
  onReturnToBase: (droneId: string) => void
  onLocate: (droneId: string) => void
  onTogglePath: (droneId: string) => void
  onToggleAllPaths: (show: boolean) => void
  onShowConfirmDialog?: (type: 'allTakeoff' | 'allReturnToBase' | 'allRandomMove') => void
}

const DroneListSection = memo(
  ({
    pathVisibility,
    onTakeoff,
    onLand,
    onReturnToBase,
    onLocate,
    onTogglePath,
    onToggleAllPaths,
    onShowConfirmDialog
  }: DroneListSectionProps): React.JSX.Element | null => {
    const { data: drones = [] } = useDrones()

    // 전체 경로 표시 상태 계산
    const allPathsVisible = drones.length > 0 && drones.every((d) => pathVisibility[d.id])

    const handleAllRandomMove = useCallback((): void => {
      onShowConfirmDialog?.('allRandomMove')
    }, [onShowConfirmDialog])

    const handleAllTakeoff = useCallback((): void => {
      onShowConfirmDialog?.('allTakeoff')
    }, [onShowConfirmDialog])

    const handleAllReturnToBase = useCallback((): void => {
      onShowConfirmDialog?.('allReturnToBase')
    }, [onShowConfirmDialog])

    const handleToggleAllPaths = useCallback((): void => {
      onToggleAllPaths(!allPathsVisible)
    }, [allPathsVisible, onToggleAllPaths])

    if (drones.length === 0) return null

    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>드론 목록 ({drones.length})</h3>
          <div className={styles.bulkActions}>
            <button
              className={`${styles.bulkButton} ${styles.pathButton} ${allPathsVisible ? styles.active : ''}`}
              onClick={handleToggleAllPaths}
              title={allPathsVisible ? '전체 경로 숨기기' : '전체 경로 보기'}
            >
              <RouteIcon />
            </button>
            <button
              className={`${styles.bulkButton} ${styles.randomButton}`}
              onClick={handleAllRandomMove}
              title="전체 랜덤 이동"
            >
              <ShuffleIcon />
            </button>
            <button
              className={`${styles.bulkButton} ${styles.takeoffButton}`}
              onClick={handleAllTakeoff}
              title="전체 이륙"
            >
              <PlaneTakeoffIcon />
            </button>
            <button
              className={`${styles.bulkButton} ${styles.returnButton}`}
              onClick={handleAllReturnToBase}
              title="전체 복귀"
            >
              <HomeIcon />
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

interface MainTabProps {
  onPanToBase?: () => void
  onTakeoff?: (droneId: string, droneName: string) => void
  onLand?: (droneId: string, droneName: string) => void
  onReturnToBase?: (droneId: string) => void
  onLocateDrone?: (droneId: string) => void
  onShowConfirmDialog?: (type: 'allTakeoff' | 'allReturnToBase' | 'allRandomMove') => void
  pathVisibility?: Record<string, boolean>
  onTogglePath?: (droneId: string) => void
  onToggleAllPaths?: (show: boolean) => void
}

const MainTab = ({
  onPanToBase,
  onTakeoff,
  onLand,
  onReturnToBase,
  onLocateDrone,
  onShowConfirmDialog,
  pathVisibility = {},
  onTogglePath,
  onToggleAllPaths
}: MainTabProps): React.JSX.Element => {
  const { data: connectionStatus = 'disconnected' } = useConnectionStatus()
  const { data: basePosition } = useBasePosition()

  const isBaseEnabled = connectionStatus === 'connected'

  // 안정적인 콜백 참조 (DroneListSection에 전달)
  const handleDroneTakeoff = useCallback(
    (droneId: string, droneName: string): void => {
      onTakeoff?.(droneId, droneName)
    },
    [onTakeoff]
  )

  const handleDroneLand = useCallback(
    (droneId: string, droneName: string): void => {
      onLand?.(droneId, droneName)
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

  return (
    <div className={styles.container}>
      <h2>MAIN</h2>

      <div className={styles.baseHeader}>
        <span className={styles.baseLabel}>Base 위치</span>
        <button
          onClick={onPanToBase}
          className={styles.panButton}
          title="Base 위치로 이동"
          disabled={!isBaseEnabled || !basePosition}
        >
          <LocateIcon />
        </button>
      </div>

      <DroneListSection
        pathVisibility={pathVisibility}
        onTakeoff={handleDroneTakeoff}
        onLand={handleDroneLand}
        onReturnToBase={handleDroneReturnToBase}
        onLocate={handleDroneLocate}
        onTogglePath={handleTogglePath}
        onToggleAllPaths={handleToggleAllPaths}
        onShowConfirmDialog={onShowConfirmDialog}
      />
    </div>
  )
}

export default MainTab
