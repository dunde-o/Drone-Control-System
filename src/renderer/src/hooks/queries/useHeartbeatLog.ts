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
