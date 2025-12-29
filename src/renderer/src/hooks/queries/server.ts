import { useQuery, UseQueryResult } from '@tanstack/react-query'

import { ConnectionStatus, ServerConfig } from '@renderer/contexts/WebSocketContext/types'

import { queryKeys } from './queryKeys'

export const useServerRunning = (): UseQueryResult<boolean> => {
  return useQuery<boolean>({
    queryKey: queryKeys.server.running(),
    queryFn: () => false,
    staleTime: Infinity
  })
}

export const useServerConfig = (): UseQueryResult<ServerConfig | null> => {
  return useQuery<ServerConfig | null>({
    queryKey: queryKeys.server.config(),
    queryFn: () => null,
    staleTime: Infinity
  })
}

export const useConnectionStatus = (): UseQueryResult<ConnectionStatus> => {
  return useQuery<ConnectionStatus>({
    queryKey: queryKeys.connection.status(),
    queryFn: () => 'disconnected',
    staleTime: Infinity
  })
}
