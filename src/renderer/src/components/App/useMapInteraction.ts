import { useState, useEffect, useRef, useCallback } from 'react'

import { useWebSocket } from '@renderer/contexts/WebSocketContext'
import { Drone } from '@renderer/contexts/WebSocketContext/types'
import { Cluster } from '@renderer/utils/mapClustering'

interface Position {
  lat: number
  lng: number
}

interface UseMapInteractionProps {
  basePosition: Position | null | undefined
  setSelectedMarkerId: React.Dispatch<React.SetStateAction<string | null>>
}

interface UseMapInteractionReturn {
  mapZoom: number
  mapBounds: google.maps.LatLngBounds | null
  pathVisibility: Record<string, boolean>
  selectedDrone: Drone | null
  panToRef: React.MutableRefObject<((position: Position) => void) | null>
  setSelectedDrone: React.Dispatch<React.SetStateAction<Drone | null>>
  handleBaseMarkerClick: () => void
  handleDroneMarkerClick: (droneId: string) => void
  handleCloseMarkerInfo: () => void
  handleSetPanTo: (panTo: (position: Position) => void) => void
  handlePanToBase: () => void
  handleLocateDrone: (droneId: string) => void
  handleMapStateChange: (zoom: number, bounds: google.maps.LatLngBounds | null) => void
  handleClusterClick: (cluster: Cluster) => void
  handleTogglePath: (droneId: string) => void
  handleToggleAllPaths: (show: boolean) => void
  handleDroneMove: (droneId: string, lat: number, lng: number, append: boolean) => void
}

export const useMapInteraction = ({
  basePosition,
  setSelectedMarkerId
}: UseMapInteractionProps): UseMapInteractionReturn => {
  const [mapZoom, setMapZoom] = useState(12)
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null)
  const [pathVisibility, setPathVisibility] = useState<Record<string, boolean>>({})
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null)

  const panToRef = useRef<((position: Position) => void) | null>(null)

  const { sendMessage } = useWebSocket()

  useEffect(() => {
    if (selectedDrone) {
      document.body.classList.add('drone-selected')
    } else {
      document.body.classList.remove('drone-selected')
    }
  }, [selectedDrone])

  const handleBaseMarkerClick = useCallback((): void => {
    setSelectedMarkerId('base')
  }, [setSelectedMarkerId])

  const handleDroneMarkerClick = useCallback(
    (droneId: string): void => {
      setSelectedMarkerId(droneId)
    },
    [setSelectedMarkerId]
  )

  const handleCloseMarkerInfo = useCallback((): void => {
    setSelectedMarkerId(null)
  }, [setSelectedMarkerId])

  const handleSetPanTo = useCallback((panTo: (position: Position) => void): void => {
    panToRef.current = panTo
  }, [])

  const handlePanToBase = useCallback((): void => {
    if (basePosition && panToRef.current) {
      panToRef.current(basePosition)
      setSelectedMarkerId('base')
    }
  }, [basePosition, setSelectedMarkerId])

  const handleLocateDrone = useCallback(
    (droneId: string): void => {
      const helpers = (window as unknown as Record<string, unknown>).__droneHelpers as
        | { locateDrone: (id: string) => void }
        | undefined
      if (helpers?.locateDrone) {
        helpers.locateDrone(droneId)
      }
      setSelectedMarkerId(droneId)
    },
    [setSelectedMarkerId]
  )

  const handleMapStateChange = useCallback(
    (zoom: number, bounds: google.maps.LatLngBounds | null): void => {
      setMapZoom(zoom)
      setMapBounds(bounds)
    },
    []
  )

  const handleClusterClick = useCallback((cluster: Cluster): void => {
    if (panToRef.current) {
      panToRef.current(cluster.center)
    }
  }, [])

  const handleTogglePath = useCallback((droneId: string): void => {
    setPathVisibility((prev) => ({
      ...prev,
      [droneId]: !prev[droneId]
    }))
  }, [])

  const handleToggleAllPaths = useCallback((show: boolean): void => {
    const helpers = (window as unknown as Record<string, unknown>).__droneHelpers as
      | { getAllDroneIds: () => string[] }
      | undefined
    const droneIds = helpers?.getAllDroneIds?.() ?? []
    const newVisibility: Record<string, boolean> = {}
    droneIds.forEach((id) => {
      newVisibility[id] = show
    })
    setPathVisibility(newVisibility)
  }, [])

  const handleDroneMove = useCallback(
    (droneId: string, lat: number, lng: number, append: boolean): void => {
      sendMessage({
        type: 'drone:move',
        payload: {
          droneId,
          waypoints: [{ lat, lng }],
          append
        }
      })
    },
    [sendMessage]
  )

  const handleMapContextMenu = useCallback(
    (e: MouseEvent): void => {
      if (!selectedDrone) return

      const target = e.target as HTMLElement
      if (!target.closest('.gm-style')) return

      e.preventDefault()

      const customEvent = new CustomEvent('drone-move-request', {
        detail: {
          clientX: e.clientX,
          clientY: e.clientY,
          droneId: selectedDrone.id,
          append: e.shiftKey
        }
      })
      window.dispatchEvent(customEvent)
    },
    [selectedDrone]
  )

  useEffect(() => {
    document.addEventListener('contextmenu', handleMapContextMenu)
    return () => document.removeEventListener('contextmenu', handleMapContextMenu)
  }, [handleMapContextMenu])

  return {
    mapZoom,
    mapBounds,
    pathVisibility,
    selectedDrone,
    panToRef,
    setSelectedDrone,
    handleBaseMarkerClick,
    handleDroneMarkerClick,
    handleCloseMarkerInfo,
    handleSetPanTo,
    handlePanToBase,
    handleLocateDrone,
    handleMapStateChange,
    handleClusterClick,
    handleTogglePath,
    handleToggleAllPaths,
    handleDroneMove
  }
}
