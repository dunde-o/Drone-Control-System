import { useMemo, useEffect } from 'react'

import { Drone } from '@renderer/contexts/WebSocketContext/types'

const MOVABLE_STATUSES = ['hovering', 'moving', 'returning', 'returning_auto']

interface UseSelectedDroneProps {
  selectedMarkerId: string | null
  drones: Drone[]
  onSelectedDroneChange: (drone: Drone | null) => void
}

export const useSelectedDrone = ({
  selectedMarkerId,
  drones,
  onSelectedDroneChange
}: UseSelectedDroneProps): Drone | null => {
  const selectedDrone = useMemo(() => {
    if (!selectedMarkerId || selectedMarkerId === 'base') return null
    const drone = drones.find((d) => d.id === selectedMarkerId)
    if (drone && MOVABLE_STATUSES.includes(drone.status)) {
      return drone
    }
    return null
  }, [selectedMarkerId, drones])

  useEffect(() => {
    onSelectedDroneChange(selectedDrone)
  }, [selectedDrone, onSelectedDroneChange])

  return selectedDrone
}
