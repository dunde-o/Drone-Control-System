import { useCallback, useEffect } from 'react'

import { Drone } from '@renderer/contexts/WebSocketContext/types'

interface Position {
  lat: number
  lng: number
}

interface UseDroneHelpersProps {
  drones: Drone[]
  panToRef: React.RefObject<((position: Position) => void) | null>
}

interface UseDroneHelpersReturn {
  handleLocateDrone: (droneId: string) => void
  getDroneName: (droneId: string) => string | null
  getAllDroneIds: () => string[]
}

export const useDroneHelpers = ({
  drones,
  panToRef
}: UseDroneHelpersProps): UseDroneHelpersReturn => {
  const handleLocateDrone = useCallback(
    (droneId: string): void => {
      const drone = drones.find((d) => d.id === droneId)
      if (drone && panToRef.current) {
        panToRef.current(drone.position)
      }
    },
    [drones, panToRef]
  )

  const getDroneName = useCallback(
    (droneId: string): string | null => {
      const drone = drones.find((d) => d.id === droneId)
      return drone?.name ?? null
    },
    [drones]
  )

  const getAllDroneIds = useCallback((): string[] => {
    return drones.map((d) => d.id)
  }, [drones])

  // 드론 조회 함수들을 window에 노출 (App에서 사용)
  useEffect(() => {
    ;(window as unknown as Record<string, unknown>).__droneHelpers = {
      locateDrone: handleLocateDrone,
      getDroneName,
      getAllDroneIds
    }
    return () => {
      delete (window as unknown as Record<string, unknown>).__droneHelpers
    }
  }, [handleLocateDrone, getDroneName, getAllDroneIds])

  return {
    handleLocateDrone,
    getDroneName,
    getAllDroneIds
  }
}
