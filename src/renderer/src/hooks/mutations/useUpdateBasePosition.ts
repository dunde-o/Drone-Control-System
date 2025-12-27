import { useMutation, UseMutationResult } from '@tanstack/react-query'

import { useWebSocket } from '@renderer/contexts/WebSocketContext'
import { BasePosition } from '@renderer/contexts/WebSocketContext/types'

export const useUpdateBasePosition = (): UseMutationResult<BasePosition, Error, BasePosition> => {
  const { sendMessage } = useWebSocket()

  return useMutation({
    mutationFn: async (position: BasePosition): Promise<BasePosition> => {
      sendMessage({
        type: 'basePosition:update',
        payload: position
      })
      return position
    }
  })
}
