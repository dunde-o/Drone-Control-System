import { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react'

import { useBasePosition, useConnectionStatus } from '@renderer/hooks/queries'
import { useUpdateBasePosition } from '@renderer/hooks/mutations'
import { BaseEditProps } from '@renderer/components/MarkerInfoDrawer'

interface UseBaseEditProps {
  isPickingBase: boolean
  onTogglePickBase: () => void
  pickingLat: string
  pickingLng: string
}

export const useBaseEdit = ({
  isPickingBase,
  onTogglePickBase,
  pickingLat,
  pickingLng
}: UseBaseEditProps): BaseEditProps => {
  const { data: basePosition } = useBasePosition()
  const { data: connectionStatus = 'disconnected' } = useConnectionStatus()
  const updateBasePosition = useUpdateBasePosition()

  const [baseLatInput, setBaseLatInput] = useState('')
  const [baseLngInput, setBaseLngInput] = useState('')

  const isPickingBaseRef = useRef(isPickingBase)
  const isBaseEnabled = connectionStatus === 'connected'
  const isBaseUpdating = updateBasePosition.isPending

  useEffect(() => {
    if (basePosition && !isPickingBaseRef.current) {
      setBaseLatInput(String(basePosition.lat))
      setBaseLngInput(String(basePosition.lng))
    }
  }, [basePosition])

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

  return {
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
}
