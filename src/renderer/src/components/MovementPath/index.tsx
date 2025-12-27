import { useEffect, useRef, useMemo } from 'react'
import { useMap } from '@vis.gl/react-google-maps'

import { BaseMovement } from '@renderer/contexts/WebSocketContext/types'

interface MovementPathProps {
  movement: BaseMovement
}

const MovementPath = ({ movement }: MovementPathProps): null => {
  const map = useMap()
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const glowPolylineRef = useRef<google.maps.Polyline | null>(null)
  const animationRef = useRef<number | null>(null)

  // Define symbols inside component after Google Maps API is loaded
  const symbols = useMemo(() => {
    if (typeof google === 'undefined') return null

    return {
      dash: {
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        strokeWeight: 3,
        scale: 4
      } as google.maps.Symbol,
      endCircle: {
        path: google.maps.SymbolPath.CIRCLE,
        strokeOpacity: 1,
        fillOpacity: 1,
        scale: 6
      } as google.maps.Symbol,
      glow: {
        path: 'M -2,0 A 2,2 0 1,1 2,0 A 2,2 0 1,1 -2,0',
        strokeOpacity: 0,
        fillOpacity: 1,
        scale: 3
      } as google.maps.Symbol
    }
  }, [])

  useEffect(() => {
    if (!map || !symbols) return

    const path = [
      { lat: movement.from.lat, lng: movement.from.lng },
      { lat: movement.to.lat, lng: movement.to.lng }
    ]

    // Main dashed line with end circle
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

    // Glow effect polyline (animated)
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

    // Animation
    const startTime = Date.now()
    const duration = movement.duration

    const animate = (): void => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Move glow along the path
      const offset = progress * 100

      if (glowPolylineRef.current) {
        const icons = glowPolylineRef.current.get('icons')
        if (icons && icons[0]) {
          icons[0].offset = `${offset}%`

          // Pulse effect - vary opacity and scale
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

      // Update dash and end circle colors with flowing effect
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

  return null
}

export default MovementPath
