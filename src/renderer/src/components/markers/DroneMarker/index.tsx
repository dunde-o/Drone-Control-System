import { useEffect, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import { createRoot, Root } from 'react-dom/client'
import { Plane, WifiOff } from 'lucide-react'

import { Drone, DroneStatus } from '@renderer/contexts/WebSocketContext/types'

import styles from './styles.module.scss'

interface DroneMarkerProps {
  drone: Drone
  isSelected?: boolean
  onClick?: (droneId: string) => void
}

// 상태별 스타일 클래스 매핑
const STATUS_STYLE_MAP: Record<DroneStatus, string> = {
  idle: styles.statusIdle,
  ascending: styles.statusAscending,
  hovering: styles.statusHovering,
  moving: styles.statusMoving,
  mia: styles.statusMia,
  returning: styles.statusReturning,
  landing: styles.statusLanding,
  returning_auto: styles.statusAuto,
  landing_auto: styles.statusAuto
}

// 광원효과를 보여줄 상태 (idle과 mia는 제외)
const shouldShowPulse = (status: DroneStatus): boolean => !['idle', 'mia'].includes(status)

// 마커 내부 컨텐츠 컴포넌트
interface MarkerContentProps {
  status: DroneStatus
  isSelected: boolean
  onClick: () => void
}

const MarkerContent = ({ status, isSelected, onClick }: MarkerContentProps): React.JSX.Element => {
  const statusClass = STATUS_STYLE_MAP[status] || ''
  const showPulse = isSelected && shouldShowPulse(status)

  return (
    <div className={`${styles.wrapper} map-marker`}>
      {showPulse && <span className={styles.pulse} />}
      <div
        className={`${styles.marker} ${statusClass} ${isSelected ? styles.selected : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      >
        {status === 'mia' ? (
          <WifiOff size={20} strokeWidth={2.5} />
        ) : (
          <Plane size={20} strokeWidth={2.5} />
        )}
      </div>
    </div>
  )
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
      <MarkerContent
        status={drone.status}
        isSelected={isSelected}
        onClick={() => onClick?.(drone.id)}
      />
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
      if (rootRef.current) {
        rootRef.current.unmount()
        rootRef.current = null
      }
      contentRef.current = null
    }
  }, [map]) // map만 의존 - 마커 생성/제거만 담당

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
  }, [drone.position.lat, drone.position.lng])

  // 상태/선택 변경 시 컨텐츠 업데이트
  useEffect(() => {
    if (!rootRef.current) return

    const statusChanged = prevStatusRef.current !== drone.status
    const selectedChanged = prevIsSelectedRef.current !== isSelected

    if (statusChanged || selectedChanged) {
      rootRef.current.render(
        <MarkerContent
          status={drone.status}
          isSelected={isSelected}
          onClick={() => onClick?.(drone.id)}
        />
      )
      prevStatusRef.current = drone.status
      prevIsSelectedRef.current = isSelected
    }
  }, [drone.status, isSelected, drone.id, onClick])

  return null
}

export default DroneMarker
