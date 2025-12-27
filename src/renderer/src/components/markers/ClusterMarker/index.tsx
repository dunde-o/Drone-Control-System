import { useEffect, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import { createRoot, Root } from 'react-dom/client'
import { Plane } from 'lucide-react'

import { Cluster } from '@renderer/utils/mapClustering'

import styles from './styles.module.scss'

interface ClusterMarkerProps {
  cluster: Cluster
  onClick?: (cluster: Cluster) => void
}

// 마커 내부 컨텐츠 컴포넌트
interface MarkerContentProps {
  count: number
  onClick: () => void
}

const MarkerContent = ({ count, onClick }: MarkerContentProps): React.JSX.Element => {
  return (
    <div className={`${styles.wrapper} map-marker`}>
      <div className={styles.pulse} />
      <div className={styles.marker} onClick={onClick}>
        <div className={styles.icon}>
          <Plane size={22} strokeWidth={2.5} />
          <span className={styles.count}>{count > 99 ? '99+' : count}</span>
        </div>
      </div>
    </div>
  )
}

const ClusterMarker = ({ cluster, onClick }: ClusterMarkerProps): null => {
  const map = useMap()
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const rootRef = useRef<Root | null>(null)

  // 이전 값 저장
  const prevPositionRef = useRef<{ lat: number; lng: number } | null>(null)
  const prevCountRef = useRef<number>(0)

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
      <MarkerContent count={cluster.drones.length} onClick={() => onClick?.(cluster)} />
    )

    // AdvancedMarkerElement 생성
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: cluster.center.lat, lng: cluster.center.lng },
      content,
      title: `${cluster.drones.length}개 드론`,
      zIndex: 20 // 클러스터가 개별 드론보다 위에
    })

    markerRef.current = marker
    prevPositionRef.current = { ...cluster.center }
    prevCountRef.current = cluster.drones.length

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
  }, [map]) // map만 의존

  // 위치 업데이트
  useEffect(() => {
    if (!markerRef.current) return

    const positionChanged =
      !prevPositionRef.current ||
      prevPositionRef.current.lat !== cluster.center.lat ||
      prevPositionRef.current.lng !== cluster.center.lng

    if (positionChanged) {
      markerRef.current.position = { lat: cluster.center.lat, lng: cluster.center.lng }
      prevPositionRef.current = { ...cluster.center }
    }
  }, [cluster.center.lat, cluster.center.lng])

  // 카운트 변경 시 컨텐츠 업데이트
  useEffect(() => {
    if (!rootRef.current) return

    if (prevCountRef.current !== cluster.drones.length) {
      rootRef.current.render(
        <MarkerContent count={cluster.drones.length} onClick={() => onClick?.(cluster)} />
      )
      prevCountRef.current = cluster.drones.length
    }
  }, [cluster.drones.length, cluster, onClick])

  return null
}

export default ClusterMarker
