import { useQuery, UseQueryResult } from '@tanstack/react-query'

import { BaseMovement } from '@renderer/contexts/WebSocketContext/types'
import { queryKeys } from './queryKeys'

export const useBaseMovement = (): UseQueryResult<BaseMovement | null> => {
  return useQuery<BaseMovement | null>({
    queryKey: queryKeys.map.baseMovement(),
    queryFn: () => null,
    staleTime: Infinity
  })
}
