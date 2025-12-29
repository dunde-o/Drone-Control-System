import { useEffect } from 'react'

import { useWebSocket } from '@renderer/contexts/WebSocketContext'

export const useDroneMove = (): void => {
  const { sendMessage } = useWebSocket()

  useEffect(() => {
    const handleDroneMoveByEvent = (e: CustomEvent): void => {
      const { droneId, lat, lng, append } = e.detail
      sendMessage({
        type: 'drone:move',
        payload: {
          droneId,
          waypoints: [{ lat, lng }],
          append
        }
      })
    }

    window.addEventListener('execute-drone-move', handleDroneMoveByEvent as EventListener)
    return () => {
      window.removeEventListener('execute-drone-move', handleDroneMoveByEvent as EventListener)
    }
  }, [sendMessage])
}
