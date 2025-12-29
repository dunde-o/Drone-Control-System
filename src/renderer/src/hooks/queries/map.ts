import { useQuery, UseQueryResult } from '@tanstack/react-query'

import { BasePosition, BaseMovement } from '@renderer/contexts/WebSocketContext/types'

import { queryKeys } from './queryKeys'

export const useBasePosition = (): UseQueryResult<BasePosition | null> => {
  return useQuery<BasePosition | null>({
    queryKey: queryKeys.map.basePosition(),
    queryFn: () => null,
    staleTime: Infinity
  })
}

export const useBaseMovement = (): UseQueryResult<BaseMovement | null> => {
  return useQuery<BaseMovement | null>({
    queryKey: queryKeys.map.baseMovement(),
    queryFn: () => null,
    staleTime: Infinity
  })
}
