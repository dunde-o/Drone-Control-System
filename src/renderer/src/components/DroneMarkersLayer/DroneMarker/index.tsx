import { useCallback, useEffect, useRef } from 'react'

import { useMap } from '@vis.gl/react-google-maps'
import { createRoot, Root } from 'react-dom/client'

import { Drone, DroneStatus } from '@renderer/contexts/WebSocketContext/types'

import MarkerContent from './MarkerContent'

interface DroneMarkerProps {
  drone: Drone
  isSelected?: boolean
  onClick?: (droneId: string) => void
}

const DroneMarker = ({ drone, isSelected = false, onClick }: DroneMarkerProps): null => {
  const map = useMap()
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<Root | null>(null)

  // 이전 값 저장 (불필요한 업데이트 방지)
  const prevPositionRef = useRef<{ lat: number; lng: number } | null>(null)
  const prevStatusRef = useRef<DroneStatus | null>(null)
  const prevIsSelectedRef = useRef<boolean>(false)

  const handleSelectDrone = useCallback((): void => {
    onClick?.(drone.id)
  }, [onClick, drone.id])

  // 마커 생성 (최초 1회)
  useEffect(() => {
    if (!map) return

    // 컨텐츠 컨테이너 생성
    const content = document.createElement('div')
    contentRef.current = content

    // React root 생성
    const root = createRoot(content)
    rootRef.current = root

    // 초기 렌더링
    root.render(
      <MarkerContent status={drone.status} isSelected={isSelected} onClick={handleSelectDrone} />
    )

    // AdvancedMarkerElement 생성
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: drone.position.lat, lng: drone.position.lng },
      content,
      title: drone.name,
      zIndex: 10
    })

    markerRef.current = marker
    prevPositionRef.current = { ...drone.position }
    prevStatusRef.current = drone.status
    prevIsSelectedRef.current = isSelected

    // cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.map = null
        markerRef.current = null
      }
      // React 렌더링 중 unmount 호출 시 race condition 방지를 위해 지연 실행
      const rootToUnmount = rootRef.current
      if (rootToUnmount) {
        rootRef.current = null
        setTimeout(() => {
          rootToUnmount.unmount()
        }, 0)
      }
      contentRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마커 생성/제거만 담당, 다른 값들은 별도 useEffect에서 처리
  }, [map])

  // 위치 업데이트 (React 렌더링 없이 직접 업데이트)
  useEffect(() => {
    if (!markerRef.current) return

    const positionChanged =
      !prevPositionRef.current ||
      prevPositionRef.current.lat !== drone.position.lat ||
      prevPositionRef.current.lng !== drone.position.lng

    if (positionChanged) {
      markerRef.current.position = { lat: drone.position.lat, lng: drone.position.lng }
      prevPositionRef.current = { ...drone.position }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lat, lng만 추적하여 불필요한 객체 참조 비교 방지
  }, [drone.position.lat, drone.position.lng])

  // 상태/선택 변경 시 컨텐츠 업데이트
  useEffect(() => {
    if (!rootRef.current) return

    const statusChanged = prevStatusRef.current !== drone.status
    const selectedChanged = prevIsSelectedRef.current !== isSelected

    if (statusChanged || selectedChanged) {
      rootRef.current.render(
        <MarkerContent status={drone.status} isSelected={isSelected} onClick={handleSelectDrone} />
      )
      prevStatusRef.current = drone.status
      prevIsSelectedRef.current = isSelected
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleSelectDrone은 drone.id, onClick에서 파생되므로 중복 추가 불필요
  }, [drone.status, isSelected, drone.id, onClick])

  return null
}

export default DroneMarker
