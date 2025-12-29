import { useMemo } from 'react'

import { useMap } from '@vis.gl/react-google-maps'

import { BaseMovement } from '@renderer/contexts/WebSocketContext/types'

import { createPathSymbols } from './symbols'
import { usePathAnimation } from './usePathAnimation'

export const useMovementPath = (movement: BaseMovement | null): void => {
  const map = useMap()
  const symbols = useMemo(() => createPathSymbols(), [])

  usePathAnimation({ map, movement, symbols })
}
