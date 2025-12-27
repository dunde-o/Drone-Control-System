import { useMemo, useCallback, useEffect } from 'react'

import { useDrones } from '@renderer/hooks/queries'
import { useWebSocket } from '@renderer/contexts/WebSocketContext'
import ClusterMarker from '@renderer/components/markers/ClusterMarker'
import DroneMarker from '@renderer/components/markers/DroneMarker'
import DronePath from '@renderer/components/DronePath'
import { getVisibleClustersAndDrones, Cluster } from '@renderer/utils/mapClustering'
import { Drone } from '@renderer/contexts/WebSocketContext/types'

interface DroneMarkersLayerProps {
  mapZoom: number
  mapBounds: google.maps.LatLngBounds | null
  selectedMarkerId: string | null
  pathVisibility: Record<string, boolean>
  panToRef: React.RefObject<((position: { lat: number; lng: number }) => void) | null>
  onDroneMarkerClick: (droneId: string) => void
  onClusterClick: (cluster: Cluster) => void
  onSelectedDroneChange: (drone: Drone | null) => void
}

const DroneMarkersLayer = ({
  mapZoom,
  mapBounds,
  selectedMarkerId,
  pathVisibility,
  panToRef,
  onDroneMarkerClick,
  onClusterClick,
  onSelectedDroneChange
}: DroneMarkersLayerProps): React.JSX.Element => {
  const { data: drones = [] } = useDrones()
  const { sendMessage } = useWebSocket()

  // 클러스터링 계산
  const { clusters, singles } = useMemo(
    () => getVisibleClustersAndDrones(drones, mapBounds, mapZoom, 50),
    [drones, mapBounds, mapZoom]
  )

  // 선택된 드론 (hovering, moving, returning 상태만 이동 명령 가능)
  const selectedDrone = useMemo(() => {
    if (!selectedMarkerId || selectedMarkerId === 'base') return null
    const drone = drones.find((d) => d.id === selectedMarkerId)
    if (drone && ['hovering', 'moving', 'returning', 'returning_auto'].includes(drone.status)) {
      return drone
    }
    return null
  }, [selectedMarkerId, drones])

  // 선택된 드론이 변경될 때 부모에게 알림
  useEffect(() => {
    onSelectedDroneChange(selectedDrone)
  }, [selectedDrone, onSelectedDroneChange])

  // 드론 위치로 이동하고 드론 선택
  const handleLocateDrone = useCallback(
    (droneId: string): void => {
      const drone = drones.find((d) => d.id === droneId)
      if (drone && panToRef.current) {
        panToRef.current(drone.position)
      }
    },
    [drones, panToRef]
  )

  // 드론 이륙 요청용 드론 이름 조회
  const getDroneName = useCallback(
    (droneId: string): string | null => {
      const drone = drones.find((d) => d.id === droneId)
      return drone?.name ?? null
    },
    [drones]
  )

  // 전체 드론 ID 목록 (handleToggleAllPaths용)
  const getAllDroneIds = useCallback((): string[] => {
    return drones.map((d) => d.id)
  }, [drones])

  // 드론 이동 요청 이벤트 처리
  useEffect(() => {
    const handleDroneMoveByEvent = (e: CustomEvent): void => {
      const { droneId, lat, lng, append } = e.detail
      sendMessage({
        type: 'drone:move',
        payload: {
          droneId,
          waypoints: [{ lat, lng }],
          append
        }
      })
    }

    window.addEventListener('execute-drone-move', handleDroneMoveByEvent as EventListener)
    return () => {
      window.removeEventListener('execute-drone-move', handleDroneMoveByEvent as EventListener)
    }
  }, [sendMessage])

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

  return (
    <>
      {clusters.map((cluster) => (
        <ClusterMarker key={cluster.id} cluster={cluster} onClick={onClusterClick} />
      ))}
      {singles.map((drone) => (
        <DroneMarker
          key={drone.id}
          drone={drone}
          isSelected={selectedMarkerId === drone.id}
          onClick={onDroneMarkerClick}
        />
      ))}
      {selectedDrone && selectedDrone.waypoints.length > 0 && <DronePath drone={selectedDrone} />}
      {drones
        .filter(
          (drone) =>
            pathVisibility[drone.id] && drone.id !== selectedDrone?.id && drone.waypoints.length > 0
        )
        .map((drone) => (
          <DronePath key={drone.id} drone={drone} />
        ))}
    </>
  )
}

export default DroneMarkersLayer
