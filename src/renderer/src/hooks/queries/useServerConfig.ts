import { useQuery } from '@tanstack/react-query'

import { ServerConfig } from '@renderer/contexts/WebSocketContext/types'
import { queryKeys } from './queryKeys'

import { UseQueryResult } from '@tanstack/react-query'

export const useServerConfig = (): UseQueryResult<ServerConfig | null> => {
  return useQuery<ServerConfig | null>({
    queryKey: queryKeys.server.config(),
    queryFn: () => null,
    staleTime: Infinity
  })
}
