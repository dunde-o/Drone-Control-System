import { useQuery } from '@tanstack/react-query'

import { queryKeys } from './queryKeys'

import { UseQueryResult } from '@tanstack/react-query'

export const useServerRunning = (): UseQueryResult<boolean> => {
  return useQuery<boolean>({
    queryKey: queryKeys.server.running(),
    queryFn: () => false,
    staleTime: Infinity
  })
}
