import { useCallback } from 'react'

import { useDrones } from '@renderer/hooks/queries'
import { useWebSocket } from '@renderer/contexts/WebSocketContext'

interface UseDroneActionsProps {
  onShowConfirmDialog: (type: 'takeoff' | 'land', droneId: string, droneName: string) => void
}

interface UseDroneActionsReturn {
  handleTakeoffRequest: (droneId: string) => void
  handleLandRequest: (droneId: string) => void
  handleReturnToBase: (droneId: string) => void
}

export const useDroneActions = ({
  onShowConfirmDialog
}: UseDroneActionsProps): UseDroneActionsReturn => {
  const { data: drones = [] } = useDrones()
  const { sendMessage } = useWebSocket()

  const handleTakeoffRequest = useCallback(
    (droneId: string): void => {
      const drone = drones.find((d) => d.id === droneId)
      if (drone) {
        onShowConfirmDialog('takeoff', droneId, drone.name)
      }
    },
    [drones, onShowConfirmDialog]
  )

  const handleLandRequest = useCallback(
    (droneId: string): void => {
      const drone = drones.find((d) => d.id === droneId)
      if (drone) {
        onShowConfirmDialog('land', droneId, drone.name)
      }
    },
    [drones, onShowConfirmDialog]
  )

  const handleReturnToBase = useCallback(
    (droneId: string): void => {
      sendMessage({
        type: 'drone:returnToBase',
        payload: { droneId }
      })
    },
    [sendMessage]
  )

  return {
    handleTakeoffRequest,
    handleLandRequest,
    handleReturnToBase
  }
}
