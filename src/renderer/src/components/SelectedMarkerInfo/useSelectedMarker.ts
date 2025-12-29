import { useMemo } from 'react'

import { useDrones, useBasePosition } from '@renderer/hooks/queries'
import { MarkerInfo } from '@renderer/components/MarkerInfoDrawer'

export const useSelectedMarker = (selectedMarkerId: string | null): MarkerInfo | null => {
  const { data: drones = [] } = useDrones()
  const { data: basePosition } = useBasePosition()

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

  return selectedMarker
}
