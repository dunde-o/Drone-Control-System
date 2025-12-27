import { useMemo, useCallback } from 'react'

import { useDrones, useBasePosition } from '@renderer/hooks/queries'
import { useWebSocket } from '@renderer/contexts/WebSocketContext'
import MarkerInfoDrawer from '@renderer/components/MarkerInfoDrawer'

interface SelectedMarkerInfoProps {
  selectedMarkerId: string | null
  onClose: () => void
  onShowConfirmDialog: (type: 'takeoff' | 'land', droneId: string, droneName: string) => void
}

const SelectedMarkerInfo = ({
  selectedMarkerId,
  onClose,
  onShowConfirmDialog
}: SelectedMarkerInfoProps): React.JSX.Element | null => {
  const { data: drones = [] } = useDrones()
  const { data: basePosition } = useBasePosition()
  const { sendMessage } = useWebSocket()

  const selectedMarker = useMemo(() => {
    if (!selectedMarkerId) return null

    if (selectedMarkerId === 'base' && basePosition) {
      return {
        id: 'base' as const,
        type: 'base' as const,
        name: 'Base Station',
        position: basePosition
      }
    }

    const drone = drones.find((d) => d.id === selectedMarkerId)
    if (drone) {
      return {
        id: drone.id,
        type: 'drone' as const,
        name: drone.name,
        position: drone.position,
        status: drone.status,
        battery: drone.battery,
        altitude: drone.altitude
      }
    }

    return null
  }, [selectedMarkerId, basePosition, drones])

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

  return (
    <MarkerInfoDrawer
      marker={selectedMarker}
      onClose={onClose}
      onTakeoff={handleTakeoffRequest}
      onLand={handleLandRequest}
      onReturnToBase={handleReturnToBase}
    />
  )
}

export default SelectedMarkerInfo
