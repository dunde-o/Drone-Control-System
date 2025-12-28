import { useCallback } from 'react'

import { Locate } from 'lucide-react'

import { useBasePosition, useConnectionStatus } from '@renderer/hooks/queries'

import DroneListSection from './DroneListSection'

import styles from './styles.module.scss'

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

  const handlePanToBase = (): void => {
    onPanToBase?.()
  }

  return (
    <div className={styles.container}>
      <h2>MAIN</h2>

      <div className={styles.baseHeader}>
        <span className={styles.baseLabel}>Base 위치</span>
        <button
          onClick={handlePanToBase}
          className={styles.panButton}
          title="Base 위치로 이동"
          disabled={!isBaseEnabled || !basePosition}
        >
          <Locate size={16} />
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
