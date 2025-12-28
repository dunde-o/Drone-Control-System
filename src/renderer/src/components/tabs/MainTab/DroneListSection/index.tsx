import { memo, useCallback } from 'react'

import { Home, PlaneTakeoff, Route, Shuffle } from 'lucide-react'

import { useDrones } from '@renderer/hooks/queries'
import { Drone } from '@renderer/contexts/WebSocketContext/types'

import DroneCard from '../DroneCard'

import styles from '../styles.module.scss'

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

const DroneListSectionComponent = ({
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
            <Route size={14} />
          </button>
          <button
            className={`${styles.bulkButton} ${styles.randomButton}`}
            onClick={handleAllRandomMove}
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

const DroneListSection = memo(DroneListSectionComponent)

DroneListSection.displayName = 'DroneListSection'

export default DroneListSection
