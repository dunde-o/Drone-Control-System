import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query'

import { useWebSocket } from '@renderer/contexts/WebSocketContext'
import { queryKeys } from '@renderer/hooks/queries/queryKeys'

interface StartServerParams {
  host: string
  port: string
}

interface UseServerControlReturn {
  startServer: UseMutationResult<StartServerParams, Error, StartServerParams>
  stopServer: UseMutationResult<void, Error, void>
}

export const useServerControl = (): UseServerControlReturn => {
  const queryClient = useQueryClient()
  const { connect, disconnect } = useWebSocket()

  const startServer = useMutation({
    mutationFn: async ({ host, port }: StartServerParams) => {
      const result = await window.api.server.start({
        host,
        port: parseInt(port, 10)
      })
      if (!result.success) {
        throw new Error(result.error)
      }
      return { host, port }
    },
    onSuccess: ({ host, port }) => {
      queryClient.setQueryData(queryKeys.server.running(), true)
      // Connect to WebSocket after server starts
      setTimeout(() => connect(host, port), 500)
    },
    onError: (error) => {
      console.error('Failed to start server:', error)
    }
  })

  const stopServer = useMutation({
    mutationFn: async () => {
      // Disconnect WebSocket first
      disconnect()

      const result = await window.api.server.stop()
      if (!result.success) {
        throw new Error(result.error)
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.server.running(), false)
    },
    onError: (error) => {
      console.error('Failed to stop server:', error)
    }
  })

  return { startServer, stopServer }
}
