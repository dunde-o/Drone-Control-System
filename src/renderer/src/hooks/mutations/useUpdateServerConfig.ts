import { useMutation, UseMutationResult } from '@tanstack/react-query'

import { useWebSocket } from '@renderer/contexts/WebSocketContext'

export const useUpdateBaseMoveDuration = (): UseMutationResult<number, Error, number> => {
  const { sendMessage } = useWebSocket()

  return useMutation({
    mutationFn: async (duration: number): Promise<number> => {
      sendMessage({
        type: 'baseMoveDuration:update',
        payload: { duration }
      })
      return duration
    }
  })
}

export const useUpdateHeartbeatInterval = (): UseMutationResult<number, Error, number> => {
  const { sendMessage } = useWebSocket()

  return useMutation({
    mutationFn: async (interval: number): Promise<number> => {
      sendMessage({
        type: 'heartbeatInterval:update',
        payload: { interval }
      })
      return interval
    }
  })
}
