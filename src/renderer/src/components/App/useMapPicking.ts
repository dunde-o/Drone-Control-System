import { useState, useEffect, useCallback } from 'react'

import { MapMouseEvent } from '@vis.gl/react-google-maps'

interface UseMapPickingReturn {
  isPickingBase: boolean
  pickingLat: string
  pickingLng: string
  handleTogglePickBase: () => void
  handleMapClick: (e: MapMouseEvent) => void
  handleMapMouseMove: (e: MapMouseEvent) => void
  setSelectedMarkerId: React.Dispatch<React.SetStateAction<string | null>>
  selectedMarkerId: string | null
}

export const useMapPicking = (): UseMapPickingReturn => {
  const [isPickingBase, setIsPickingBase] = useState(false)
  const [pickingLat, setPickingLat] = useState('')
  const [pickingLng, setPickingLng] = useState('')
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null)

  useEffect(() => {
    if (isPickingBase) {
      document.body.classList.add('picking-base')
    } else {
      document.body.classList.remove('picking-base')
    }
  }, [isPickingBase])

  const handleTogglePickBase = useCallback((): void => {
    if (isPickingBase) {
      setPickingLat('')
      setPickingLng('')
      setIsPickingBase(false)
    } else {
      setIsPickingBase(true)
    }
  }, [isPickingBase])

  const handleMapClick = useCallback(
    (e: MapMouseEvent): void => {
      if (isPickingBase && e.detail.latLng) {
        const lat = e.detail.latLng.lat
        const lng = e.detail.latLng.lng
        setPickingLat(String(lat))
        setPickingLng(String(lng))
        setIsPickingBase(false)
      } else {
        setSelectedMarkerId(null)
      }
    },
    [isPickingBase]
  )

  const handleMapMouseMove = useCallback(
    (e: MapMouseEvent): void => {
      if (isPickingBase && e.detail.latLng) {
        const lat = e.detail.latLng.lat
        const lng = e.detail.latLng.lng
        setPickingLat(String(lat))
        setPickingLng(String(lng))
      }
    },
    [isPickingBase]
  )

  return {
    isPickingBase,
    pickingLat,
    pickingLng,
    handleTogglePickBase,
    handleMapClick,
    handleMapMouseMove,
    setSelectedMarkerId,
    selectedMarkerId
  }
}
