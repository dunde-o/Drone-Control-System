import { useQuery } from '@tanstack/react-query'

import { Drone } from '@renderer/contexts/WebSocketContext/types'
import { queryKeys } from './queryKeys'

export const useDroneCount = (): number => {
  const { data: count = 0 } = useQuery<Drone[], Error, number>({
    queryKey: queryKeys.drones.list(),
    queryFn: () => [],
    staleTime: Infinity,
    select: (drones) => drones.length
  })

  return count
}
