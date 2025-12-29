import { useMemo } from 'react'

import { useDrones } from '@renderer/hooks/queries'

import ClusterMarker from './ClusterMarker'
import DroneMarker from './DroneMarker'
import DronePath from './DronePath'
import { getVisibleClustersAndDrones, Cluster } from '@renderer/utils/mapClustering'
import { Drone } from '@renderer/contexts/WebSocketContext/types'

import { useDroneHelpers } from './useDroneHelpers'
import { useDroneMove } from './useDroneMove'
import { useSelectedDrone } from './useSelectedDrone'

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

  const { clusters, singles } = useMemo(
    () => getVisibleClustersAndDrones(drones, mapBounds, mapZoom, 50),
    [drones, mapBounds, mapZoom]
  )

  const selectedDrone = useSelectedDrone({
    selectedMarkerId,
    drones,
    onSelectedDroneChange
  })

  useDroneHelpers({ drones, panToRef })
  useDroneMove()

  const visiblePaths = useMemo(
    () =>
      drones.filter(
        (drone) =>
          pathVisibility[drone.id] && drone.id !== selectedDrone?.id && drone.waypoints.length > 0
      ),
    [drones, pathVisibility, selectedDrone?.id]
  )

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
      {visiblePaths.map((drone) => (
        <DronePath key={drone.id} drone={drone} />
      ))}
    </>
  )
}

export default DroneMarkersLayer
