import { useEffect, useRef, useMemo } from 'react'
import { useMap } from '@vis.gl/react-google-maps'

import { Drone } from '@renderer/contexts/WebSocketContext/types'

interface DronePathProps {
  drone: Drone
}

const DronePath = ({ drone }: DronePathProps): null => {
  const map = useMap()
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const endMarkerRef = useRef<google.maps.Marker | null>(null)

  const symbols = useMemo(() => {
    if (typeof google === 'undefined') return null

    return {
      dash: {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        strokeWeight: 2,
        scale: 3
      } as google.maps.Symbol
    }
  }, [])

  useEffect(() => {
    if (!map || !symbols) return

    // 경로가 없으면 polyline 및 마커 제거
    if (drone.waypoints.length === 0) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }
      if (endMarkerRef.current) {
        endMarkerRef.current.setMap(null)
        endMarkerRef.current = null
      }
      return
    }

    // 드론 현재 위치 + 모든 waypoints로 경로 구성
    const path = [
      { lat: drone.position.lat, lng: drone.position.lng },
      ...drone.waypoints.map((wp) => ({ lat: wp.lat, lng: wp.lng }))
    ]

    // 마지막 waypoint 위치
    const lastWaypoint = drone.waypoints[drone.waypoints.length - 1]

    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeOpacity: 0,
        icons: [
          {
            icon: {
              ...symbols.dash,
              strokeColor: '#22c55e' // green
            },
            offset: '0',
            repeat: '15px'
          }
        ],
        map
      })
    } else {
      polylineRef.current.setPath(path)
    }

    // 끝 지점에 둥근 마커 추가
    if (!endMarkerRef.current) {
      endMarkerRef.current = new google.maps.Marker({
        position: lastWaypoint,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 6
        }
      })
    } else {
      endMarkerRef.current.setPosition(lastWaypoint)
    }
  }, [map, drone.position, drone.waypoints, symbols])

  // 컴포넌트 unmount 시 cleanup
  useEffect(() => {
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }
      if (endMarkerRef.current) {
        endMarkerRef.current.setMap(null)
        endMarkerRef.current = null
      }
    }
  }, [])

  return null
}

export default DronePath
