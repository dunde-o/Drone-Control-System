import { Home, PlaneLanding, PlaneTakeoff } from 'lucide-react'

import { DroneStatus } from '@renderer/contexts/WebSocketContext/types'

import styles from '../../styles.module.scss'
import {
  getBatteryIcon,
  getBatteryColorClass,
  isGroundStatus,
  isAirStatus,
  isTransitioning
} from '../utils'

interface HeaderActionsProps {
  status: DroneStatus
  battery: number
  onTakeoffLand: () => void
  onReturnToBase: () => void
}

const HeaderActions = ({
  status,
  battery,
  onTakeoffLand,
  onReturnToBase
}: HeaderActionsProps): React.JSX.Element => {
  const canTakeoffOrLand = !isTransitioning(status)
  const canReturnToBase = isAirStatus(status) && !isTransitioning(status)

  return (
    <>
      <div className={styles.actionButtons}>
        <button
          className={`${styles.actionButton} ${isGroundStatus(status) ? styles.takeoffButton : styles.landButton}`}
          onClick={onTakeoffLand}
          disabled={!canTakeoffOrLand}
          title={isGroundStatus(status) ? '이륙' : '착륙'}
        >
          {isGroundStatus(status) ? <PlaneTakeoff size={16} /> : <PlaneLanding size={16} />}
        </button>
        <button
          className={`${styles.actionButton} ${styles.returnButton}`}
          onClick={onReturnToBase}
          disabled={!canReturnToBase}
          title="복귀"
        >
          <Home size={16} />
        </button>
      </div>
      <div className={`${styles.battery} ${styles[getBatteryColorClass(battery)]}`}>
        {getBatteryIcon(battery)}
        <span>{battery}%</span>
      </div>
    </>
  )
}

export default HeaderActions
