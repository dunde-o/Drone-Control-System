import { ChangeEvent, memo, useCallback, useEffect, useState } from 'react'

import { Loader2 } from 'lucide-react'

import { useUpdateDroneCount } from '@renderer/hooks/mutations'
import { useDroneCount } from '@renderer/hooks/queries'

import styles from '../styles.module.scss'

interface DroneCountInputProps {
  isConnected: boolean
}

const DroneCountInputComponent = ({ isConnected }: DroneCountInputProps): React.JSX.Element => {
  const droneCount = useDroneCount()
  const updateDroneCount = useUpdateDroneCount()
  const [droneCountInput, setDroneCountInput] = useState('')

  const isDroneCountUpdating = updateDroneCount.isPending
  const isDroneCountUnchanged = droneCountInput === String(droneCount)

  // Sync drone count input when drones change
  useEffect(() => {
    setDroneCountInput(String(droneCount))
  }, [droneCount])

  const handleDroneCountChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setDroneCountInput(e.target.value)
  }, [])

  const handleApplyDroneCount = useCallback((): void => {
    const count = parseInt(droneCountInput, 10)
    if (isNaN(count) || count < 0) return
    updateDroneCount.mutate(count)
  }, [droneCountInput, updateDroneCount])

  return (
    <div className={styles.durationRow}>
      <label className={styles.statusLabel}>드론 수:</label>
      <div className={styles.durationInputGroup}>
        <input
          type="number"
          value={droneCountInput}
          onChange={handleDroneCountChange}
          className={styles.durationInput}
          min="0"
          step="1"
          disabled={!isConnected || isDroneCountUpdating}
          placeholder="-"
        />
        <button
          onClick={handleApplyDroneCount}
          className={styles.applyButton}
          disabled={
            !isConnected || !droneCountInput || isDroneCountUpdating || isDroneCountUnchanged
          }
        >
          {isDroneCountUpdating ? <Loader2 size={14} className={styles.spinner} /> : '적용'}
        </button>
      </div>
    </div>
  )
}

const DroneCountInput = memo(DroneCountInputComponent)

DroneCountInput.displayName = 'DroneCountInput'

export default DroneCountInput
