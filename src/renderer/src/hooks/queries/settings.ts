import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { queryKeys } from './queryKeys'

interface UseHeartbeatLogReturn {
  showHeartbeatLog: boolean
  toggleHeartbeatLog: () => void
}

export const useHeartbeatLog = (): UseHeartbeatLogReturn => {
  const queryClient = useQueryClient()

  const { data: showHeartbeatLog = false } = useQuery<boolean>({
    queryKey: queryKeys.settings.heartbeatLog(),
    queryFn: () => false,
    staleTime: Infinity
  })

  const toggleHeartbeatLog = useCallback(() => {
    queryClient.setQueryData<boolean>(queryKeys.settings.heartbeatLog(), (prev) => !prev)
  }, [queryClient])

  return { showHeartbeatLog, toggleHeartbeatLog }
}

interface UseDroneLogReturn {
  showDroneLog: boolean
  toggleDroneLog: () => void
}

export const useDroneLog = (): UseDroneLogReturn => {
  const queryClient = useQueryClient()

  const { data: showDroneLog = false } = useQuery<boolean>({
    queryKey: queryKeys.settings.droneLog(),
    queryFn: () => false,
    staleTime: Infinity
  })

  const toggleDroneLog = useCallback(() => {
    queryClient.setQueryData<boolean>(queryKeys.settings.droneLog(), (prev) => !prev)
  }, [queryClient])

  return { showDroneLog, toggleDroneLog }
}
