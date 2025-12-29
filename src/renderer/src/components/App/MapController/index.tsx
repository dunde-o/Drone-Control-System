import { useEffect } from 'react'

import { useMap } from '@vis.gl/react-google-maps'

import { BaseMovement } from '@renderer/contexts/WebSocketContext/types'
import { useMovementPath } from '@renderer/hooks/useMovementPath'

interface MapControllerProps {
  onPanToBase: (panTo: (position: { lat: number; lng: number }) => void) => void
  onDroneMove: (droneId: string, lat: number, lng: number, append: boolean) => void
  onMapStateChange: (zoom: number, bounds: google.maps.LatLngBounds | null) => void
  baseMovement: BaseMovement | null
}

const MapController = ({
  onPanToBase,
  onDroneMove,
  onMapStateChange,
  baseMovement
}: MapControllerProps): null => {
  const map = useMap()

  useMovementPath(baseMovement)

  useEffect(() => {
    if (!map) return

    onPanToBase((position) => {
      map.panTo(position)
      map.setZoom(15)
    })
  }, [map, onPanToBase])

  // 줌/바운드 변경 감지
  useEffect(() => {
    if (!map) return

    const updateMapState = (): void => {
      const zoom = map.getZoom() ?? 12
      const bounds = map.getBounds() ?? null
      onMapStateChange(zoom, bounds)
    }

    // 초기 상태
    updateMapState()

    // 이벤트 리스너
    const zoomListener = map.addListener('zoom_changed', updateMapState)
    const boundsListener = map.addListener('bounds_changed', updateMapState)

    return () => {
      google.maps.event.removeListener(zoomListener)
      google.maps.event.removeListener(boundsListener)
    }
  }, [map, onMapStateChange])

  // 드론 이동 요청 이벤트 처리
  useEffect(() => {
    if (!map) return

    const handleDroneMoveRequest = (e: CustomEvent): void => {
      const { clientX, clientY, droneId, append } = e.detail

      // 맵 컨테이너의 위치 가져오기
      const mapDiv = map.getDiv()
      const rect = mapDiv.getBoundingClientRect()

      // 화면 좌표를 맵 컨테이너 내 상대 좌표로 변환
      const x = clientX - rect.left
      const y = clientY - rect.top

      // 맵 projection을 사용해 화면 좌표를 위경도로 변환
      const projection = map.getProjection()
      if (!projection) return

      const bounds = map.getBounds()
      if (!bounds) return

      const ne = bounds.getNorthEast()
      const sw = bounds.getSouthWest()
      const topRight = projection.fromLatLngToPoint(ne)
      const bottomLeft = projection.fromLatLngToPoint(sw)

      if (!topRight || !bottomLeft) return

      const scale = Math.pow(2, map.getZoom() || 0)
      const worldPoint = new google.maps.Point(
        bottomLeft.x + (((x / scale) * (topRight.x - bottomLeft.x)) / rect.width) * scale,
        topRight.y + (((y / scale) * (bottomLeft.y - topRight.y)) / rect.height) * scale
      )

      const latLng = projection.fromPointToLatLng(worldPoint)
      if (!latLng) return

      onDroneMove(droneId, latLng.lat(), latLng.lng(), append)
    }

    window.addEventListener('drone-move-request', handleDroneMoveRequest as EventListener)
    return () => {
      window.removeEventListener('drone-move-request', handleDroneMoveRequest as EventListener)
    }
  }, [map, onDroneMove])

  return null
}

export default MapController
