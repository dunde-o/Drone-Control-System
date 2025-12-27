import { useMemo, useCallback, useState, useEffect, useRef, ChangeEvent } from 'react'

import { useDrones, useBasePosition, useConnectionStatus } from '@renderer/hooks/queries'
import { useUpdateBasePosition } from '@renderer/hooks/mutations'
import { useWebSocket } from '@renderer/contexts/WebSocketContext'
import MarkerInfoDrawer, { BaseEditProps } from '@renderer/components/MarkerInfoDrawer'

interface SelectedMarkerInfoProps {
  selectedMarkerId: string | null
  onClose: () => void
  onShowConfirmDialog: (type: 'takeoff' | 'land', droneId: string, droneName: string) => void
  // Base picking props (from App)
  isPickingBase: boolean
  onTogglePickBase: () => void
  pickingLat: string
  pickingLng: string
}

const SelectedMarkerInfo = ({
  selectedMarkerId,
  onClose,
  onShowConfirmDialog,
  isPickingBase,
  onTogglePickBase,
  pickingLat,
  pickingLng
}: SelectedMarkerInfoProps): React.JSX.Element | null => {
  const { data: drones = [] } = useDrones()
  const { data: basePosition } = useBasePosition()
  const { data: connectionStatus = 'disconnected' } = useConnectionStatus()
  const { sendMessage } = useWebSocket()
  const updateBasePosition = useUpdateBasePosition()

  // Local input state for base editing
  const [baseLatInput, setBaseLatInput] = useState('')
  const [baseLngInput, setBaseLngInput] = useState('')

  const isPickingBaseRef = useRef(isPickingBase)
  const isBaseEnabled = connectionStatus === 'connected'
  const isBaseUpdating = updateBasePosition.isPending

  // Sync inputs when server value changes (only if not picking)
  useEffect(() => {
    if (basePosition && !isPickingBaseRef.current) {
      setBaseLatInput(String(basePosition.lat))
      setBaseLngInput(String(basePosition.lng))
    }
  }, [basePosition])

  // Update inputs when picking from map
  useEffect(() => {
    isPickingBaseRef.current = isPickingBase
    if (isPickingBase && pickingLat && pickingLng) {
      setBaseLatInput(pickingLat)
      setBaseLngInput(pickingLng)
    }
  }, [isPickingBase, pickingLat, pickingLng])

  const handleBaseLatChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setBaseLatInput(e.target.value)
  }, [])

  const handleBaseLngChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setBaseLngInput(e.target.value)
  }, [])

  const handleApplyBase = useCallback((): void => {
    const lat = parseFloat(baseLatInput)
    const lng = parseFloat(baseLngInput)
    if (isNaN(lat) || isNaN(lng)) return

    updateBasePosition.mutate({ lat, lng })
  }, [baseLatInput, baseLngInput, updateBasePosition])

  const isInputDisabled = !isBaseEnabled || isBaseUpdating
  const isUnchanged =
    basePosition &&
    baseLatInput === String(basePosition.lat) &&
    baseLngInput === String(basePosition.lng)
  const isApplyDisabled =
    !isBaseEnabled || isBaseUpdating || !baseLatInput || !baseLngInput || !!isUnchanged

  const selectedMarker = useMemo(() => {
    if (!selectedMarkerId) return null

    if (selectedMarkerId === 'base' && basePosition) {
      return {
        id: 'base' as const,
        type: 'base' as const,
        name: 'Base Station',
        position: basePosition
      }
    }

    const drone = drones.find((d) => d.id === selectedMarkerId)
    if (drone) {
      return {
        id: drone.id,
        type: 'drone' as const,
        name: drone.name,
        position: drone.position,
        status: drone.status,
        battery: drone.battery,
        altitude: drone.altitude
      }
    }

    return null
  }, [selectedMarkerId, basePosition, drones])

  const handleTakeoffRequest = useCallback(
    (droneId: string): void => {
      const drone = drones.find((d) => d.id === droneId)
      if (drone) {
        onShowConfirmDialog('takeoff', droneId, drone.name)
      }
    },
    [drones, onShowConfirmDialog]
  )

  const handleLandRequest = useCallback(
    (droneId: string): void => {
      const drone = drones.find((d) => d.id === droneId)
      if (drone) {
        onShowConfirmDialog('land', droneId, drone.name)
      }
    },
    [drones, onShowConfirmDialog]
  )

  const handleReturnToBase = useCallback(
    (droneId: string): void => {
      sendMessage({
        type: 'drone:returnToBase',
        payload: { droneId }
      })
    },
    [sendMessage]
  )

  // Base edit props (only when base is selected)
  const baseEditProps: BaseEditProps | undefined =
    selectedMarker?.type === 'base'
      ? {
          isPickingBase,
          onTogglePickBase,
          baseLatInput,
          baseLngInput,
          onBaseLatChange: handleBaseLatChange,
          onBaseLngChange: handleBaseLngChange,
          onApplyBase: handleApplyBase,
          isApplyDisabled,
          isInputDisabled,
          isBaseUpdating
        }
      : undefined

  return (
    <MarkerInfoDrawer
      marker={selectedMarker}
      onClose={onClose}
      onTakeoff={handleTakeoffRequest}
      onLand={handleLandRequest}
      onReturnToBase={handleReturnToBase}
      baseEditProps={baseEditProps}
    />
  )
}

export default SelectedMarkerInfo
