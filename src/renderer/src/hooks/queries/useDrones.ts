import { useQuery, UseQueryResult } from '@tanstack/react-query'

import { Drone } from '@renderer/contexts/WebSocketContext/types'
import { queryKeys } from './queryKeys'

export const useDrones = (): UseQueryResult<Drone[]> => {
  return useQuery<Drone[]>({
    queryKey: queryKeys.drones.list(),
    queryFn: () => [],
    staleTime: Infinity
  })
}
