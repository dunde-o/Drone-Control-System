import { useQuery } from '@tanstack/react-query'

import { ConnectionStatus } from '@renderer/contexts/WebSocketContext/types'
import { queryKeys } from './queryKeys'

import { UseQueryResult } from '@tanstack/react-query'

export const useConnectionStatus = (): UseQueryResult<ConnectionStatus> => {
  return useQuery<ConnectionStatus>({
    queryKey: queryKeys.connection.status(),
    queryFn: () => 'disconnected',
    staleTime: Infinity
  })
}
