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

export const useUpdateDroneCount = (): UseMutationResult<number, Error, number> => {
  const { sendMessage } = useWebSocket()

  return useMutation({
    mutationFn: async (count: number): Promise<number> => {
      sendMessage({
        type: 'droneCount:update',
        payload: { count }
      })
      return count
    }
  })
}

export const useUpdateDroneUpdateInterval = (): UseMutationResult<number, Error, number> => {
  const { sendMessage } = useWebSocket()

  return useMutation({
    mutationFn: async (interval: number): Promise<number> => {
      sendMessage({
        type: 'droneUpdateInterval:update',
        payload: { interval }
      })
      return interval
    }
  })
}
