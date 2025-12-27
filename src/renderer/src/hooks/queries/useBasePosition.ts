import { useQuery } from '@tanstack/react-query'

import { BasePosition } from '@renderer/contexts/WebSocketContext/types'
import { queryKeys } from './queryKeys'

import { UseQueryResult } from '@tanstack/react-query'

export const useBasePosition = (): UseQueryResult<BasePosition | null> => {
  return useQuery<BasePosition | null>({
    queryKey: queryKeys.map.basePosition(),
    queryFn: () => null,
    staleTime: Infinity
  })
}
