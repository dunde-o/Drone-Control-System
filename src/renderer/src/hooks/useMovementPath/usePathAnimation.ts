import { useEffect, useRef } from 'react'

import { BaseMovement } from '@renderer/contexts/WebSocketContext/types'

import { PathSymbols } from './symbols'

interface UsePathAnimationProps {
  map: google.maps.Map | null
  movement: BaseMovement | null
  symbols: PathSymbols | null
}

export const usePathAnimation = ({ map, movement, symbols }: UsePathAnimationProps): void => {
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const glowPolylineRef = useRef<google.maps.Polyline | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!map || !symbols || !movement) return

    const path = [
      { lat: movement.from.lat, lng: movement.from.lng },
      { lat: movement.to.lat, lng: movement.to.lng }
    ]

    polylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeOpacity: 0,
      icons: [
        {
          icon: symbols.dash,
          offset: '0',
          repeat: '20px'
        },
        {
          icon: symbols.endCircle,
          offset: '100%'
        }
      ],
      map
    })

    glowPolylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeOpacity: 0,
      icons: [
        {
          icon: symbols.glow,
          offset: '0%'
        }
      ],
      map
    })

    const startTime = Date.now()
    const duration = movement.duration

    const animate = (): void => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const offset = progress * 100

      if (glowPolylineRef.current) {
        const icons = glowPolylineRef.current.get('icons')
        if (icons && icons[0]) {
          icons[0].offset = `${offset}%`

          const pulse = Math.sin(elapsed * 0.01) * 0.3 + 0.7
          icons[0].icon = {
            ...symbols.glow,
            fillColor: `rgba(59, 130, 246, ${pulse})`,
            strokeColor: `rgba(59, 130, 246, ${pulse * 0.5})`,
            scale: 3 + Math.sin(elapsed * 0.015) * 1.5
          }

          glowPolylineRef.current.set('icons', icons)
        }
      }

      if (polylineRef.current) {
        const icons = polylineRef.current.get('icons')
        if (icons) {
          const flowOffset = (elapsed * 0.05) % 20
          icons[0] = {
            ...icons[0],
            offset: `${flowOffset}px`,
            icon: {
              ...symbols.dash,
              strokeColor: '#000000'
            }
          }
          icons[1] = {
            ...icons[1],
            icon: {
              ...symbols.endCircle,
              strokeColor: '#000000',
              fillColor: '#000000'
            }
          }
          polylineRef.current.set('icons', icons)
        }
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
      }
      if (glowPolylineRef.current) {
        glowPolylineRef.current.setMap(null)
      }
    }
  }, [map, movement, symbols])
}
