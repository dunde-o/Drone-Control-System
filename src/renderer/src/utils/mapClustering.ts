import { Drone } from '@renderer/contexts/WebSocketContext/types'

export interface Cluster {
  id: string
  drones: Drone[]
  center: { lat: number; lng: number }
}

export interface ClusteringResult {
  clusters: Cluster[]
  singles: Drone[]
}

// 위경도를 픽셀 좌표로 변환 (Mercator projection)
function latLngToPixel(
  lat: number,
  lng: number,
  zoom: number
): { x: number; y: number } {
  const scale = Math.pow(2, zoom) * 256
  const x = ((lng + 180) / 360) * scale
  const latRad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale
  return { x, y }
}

// 두 픽셀 좌표 간 거리 계산
function pixelDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.sqrt(dx * dx + dy * dy)
}

// 뷰포트 내 드론 필터링
export function filterDronesInViewport(
  drones: Drone[],
  bounds: google.maps.LatLngBounds | null | undefined
): Drone[] {
  if (!bounds) return drones

  return drones.filter((drone) =>
    bounds.contains({ lat: drone.position.lat, lng: drone.position.lng })
  )
}

// 드론 클러스터링
export function clusterDrones(
  drones: Drone[],
  zoom: number,
  clusterRadius: number = 40 // 픽셀 단위 클러스터 반경
): ClusteringResult {
  if (drones.length === 0) {
    return { clusters: [], singles: [] }
  }

  // 각 드론의 픽셀 좌표 계산
  const dronePixels = drones.map((drone) => ({
    drone,
    pixel: latLngToPixel(drone.position.lat, drone.position.lng, zoom)
  }))

  const clustered: Set<string> = new Set()
  const clusters: Cluster[] = []
  const singles: Drone[] = []

  // 간단한 그리디 클러스터링
  for (let i = 0; i < dronePixels.length; i++) {
    const current = dronePixels[i]
    if (clustered.has(current.drone.id)) continue

    // 현재 드론과 가까운 드론들 찾기
    const nearby: typeof dronePixels = [current]

    for (let j = i + 1; j < dronePixels.length; j++) {
      const other = dronePixels[j]
      if (clustered.has(other.drone.id)) continue

      if (pixelDistance(current.pixel, other.pixel) <= clusterRadius) {
        nearby.push(other)
      }
    }

    if (nearby.length > 1) {
      // 클러스터 생성
      nearby.forEach((item) => clustered.add(item.drone.id))

      // 클러스터 중심 계산
      const centerLat =
        nearby.reduce((sum, item) => sum + item.drone.position.lat, 0) / nearby.length
      const centerLng =
        nearby.reduce((sum, item) => sum + item.drone.position.lng, 0) / nearby.length

      clusters.push({
        id: `cluster-${current.drone.id}`,
        drones: nearby.map((item) => item.drone),
        center: { lat: centerLat, lng: centerLng }
      })
    } else {
      // 단일 드론
      clustered.add(current.drone.id)
      singles.push(current.drone)
    }
  }

  return { clusters, singles }
}

// 클러스터링 + 뷰포트 필터링 통합
export function getVisibleClustersAndDrones(
  drones: Drone[],
  bounds: google.maps.LatLngBounds | null | undefined,
  zoom: number,
  clusterRadius: number = 40
): ClusteringResult {
  // 뷰포트 내 드론만 필터링
  const visibleDrones = filterDronesInViewport(drones, bounds)

  // 클러스터링 적용
  return clusterDrones(visibleDrones, zoom, clusterRadius)
}
